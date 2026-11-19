// Breeze TTS 2 (github.com/breezeblue-ai/breeze-tts) for the studio's back end: speech for the lines of a video.
// The model needs Linux + an NVIDIA GPU (12 GB+), so it runs as its own server somewhere (a GPU machine, WSL2, a cloud
// box): `python -m breeze_infer.api BreezeBlue/breeze-tts-2 --host 0.0.0.0 --port 7860`. The studio only knows its
// address (BREEZE_TTS_URL, or saved from the studio in ~/.2d-studio/tts.json) and calls POST /v1/audio/speech, which
// streams mono 24 kHz 16-bit PCM; we wrap it as a WAV in Projects/<name>/audio/tts/, cached by everything that shapes
// the voice, so rendering again does not ask the GPU again.
// Breeze TTS 2 speaks English and Chinese. Its weights and self-hosted output are for research and non-commercial use
// only (BreezeBlue Research and Non-Commercial License); the studio says so where it is used.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const CFG_DIR = path.join(os.homedir(), '.2d-studio'), CFG = path.join(CFG_DIR, 'tts.json');
const RATE = 24000;
function readCfg(): { url?: string } { try { return JSON.parse(fs.readFileSync(CFG, 'utf8')); } catch { return {}; } }
export const ttsUrl = () => (process.env.BREEZE_TTS_URL || readCfg().url || '').replace(/\/+$/, '');
/** Save the Breeze server address (http(s)://host:port). Empty = forget it. */
export function saveTtsUrl(url: string) {
  const u = url.trim().replace(/\/+$/, '');
  if (u && !/^https?:\/\/[^\s/]+(:\d+)?(\/[^\s]*)?$/i.test(u)) throw new Error('Địa chỉ phải dạng http://máy:7860');
  fs.mkdirSync(CFG_DIR, { recursive: true });
  const c = readCfg(); if (u) c.url = u; else delete c.url;
  fs.writeFileSync(CFG, JSON.stringify(c, null, 1));
}

async function withTimeout<T>(ms: number, f: (s: AbortSignal) => Promise<T>) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try { return await f(ac.signal); } finally { clearTimeout(t); }
}
/** Is the server there? GET /v1/model -> { frame_rate, model_digest, ... } */
export async function ttsStatus(): Promise<{ url: string; ok: boolean; digest?: string; error?: string }> {
  const url = ttsUrl(); if (!url) return { url, ok: false, error: 'Chưa có địa chỉ máy chủ Breeze TTS.' };
  try {
    const r = await withTimeout(5000, (signal) => fetch(url + '/v1/model', { signal }));
    if (!r.ok) return { url, ok: false, error: `Máy chủ trả lỗi ${r.status}.` };
    const j: any = await r.json(); return { url, ok: true, digest: String(j.model_digest || '').slice(0, 12) };
  } catch (e: any) { return { url, ok: false, error: e.name === 'AbortError' ? 'Không kết nối được (quá 5 giây).' : 'Không kết nối được: ' + (e.cause?.code || e.message) }; }
}

export interface LineReq { text: string; instruction?: string; ref?: string; refText?: string; seed?: number; cfg?: number }

function wav(pcm: Buffer) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

/** Speech for one line into <projectDir>/audio/tts/<hash>.wav (reused when nothing changed). Returns the project-relative file. */
export async function ttsLine(projectDir: string, q: LineReq): Promise<{ file: string; duration: number; cached: boolean }> {
  const url = ttsUrl(); if (!url) throw new Error('Chưa có địa chỉ máy chủ Breeze TTS.');
  const text = String(q.text || '').trim(); if (!text) throw new Error('Câu thoại trống.');
  if (text.length > 1200) throw new Error('Câu quá dài (tối đa 1200 ký tự một câu).');
  let refBuf: Buffer | null = null;
  if (q.ref) {
    const f = path.resolve(projectDir, q.ref);
    if (!f.toLowerCase().startsWith(path.resolve(projectDir).toLowerCase() + path.sep) || !fs.existsSync(f)) throw new Error('Không thấy file giọng mẫu: ' + q.ref);
    if (!String(q.refText || '').trim()) throw new Error('Giọng mẫu cần lời đọc đúng y như trong file.');
    refBuf = fs.readFileSync(f);
  }
  const seed = Number.isFinite(q.seed) ? Math.round(q.seed!) : 42, cfg = q.cfg && q.cfg > 0 ? q.cfg : q.instruction ? 4 : 1;
  const key = crypto.createHash('sha1').update(JSON.stringify([text, q.instruction || '', refBuf ? crypto.createHash('sha1').update(refBuf).digest('hex') : '', q.refText || '', seed, cfg])).digest('hex').slice(0, 16);
  const rel = `audio/tts/${key}.wav`, out = path.join(projectDir, rel);
  if (fs.existsSync(out)) return { file: rel, duration: (fs.statSync(out).size - 44) / 2 / RATE, cached: true };

  const form = () => {
    const f = new FormData();
    f.set('text', text); f.set('seed', String(seed)); f.set('cfg_scale', String(cfg));
    if (q.instruction?.trim()) f.set('instruction', q.instruction.trim());
    if (refBuf) { f.set('ref_audio', new Blob([new Uint8Array(refBuf)]), path.basename(q.ref!)); f.set('ref_text', String(q.refText).trim()); }
    return f;
  };
  // one request at a time on the server: 409 = busy, wait and try again
  for (let attempt = 0; ; attempt++) {
    const r = await withTimeout(180000, (signal) => fetch(url + '/v1/audio/speech', { method: 'POST', body: form(), signal }));
    if (r.status === 409 && attempt < 30) { await new Promise((res) => setTimeout(res, 2000)); continue; }
    if (!r.ok) throw new Error(`Breeze TTS lỗi ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const pcm = Buffer.from(await r.arrayBuffer());
    if (pcm.length < RATE / 10) throw new Error('Breeze TTS trả về âm thanh rỗng.');
    const even = pcm.length % 2 ? pcm.subarray(0, pcm.length - 1) : pcm;
    fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, wav(even));
    return { file: rel, duration: even.length / 2 / RATE, cached: false };
  }
}
