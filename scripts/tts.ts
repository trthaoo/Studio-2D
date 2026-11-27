// Speech for the lines of a video, on the studio's back end. Two engines, chosen in the studio (Xuất video or a
// character's Mặt tab), saved per machine in ~/.2d-studio/tts.json (outside the project and OneDrive; keys are never
// sent to the page):
//   - Breeze TTS 2 (github.com/breezeblue-ai/breeze-tts): runs as its own server (Linux + NVIDIA GPU 12 GB+:
//     `python -m breeze_infer.api BreezeBlue/breeze-tts-2 --host 0.0.0.0 --port 7860`); the studio only knows its
//     address (BREEZE_TTS_URL or saved). English and Chinese; self-hosted output is research / non-commercial only.
//   - ElevenLabs (api.elevenlabs.io): an API key (ELEVENLABS_API_KEY or saved); a voice per character from the
//     account's voices; models eleven_flash_v2_5 (cheap, fast), eleven_v3 / eleven_v4 (best); all speak Vietnamese.
// Both give mono 24 kHz 16-bit PCM, wrapped as a WAV in Projects/<name>/audio/tts/, cached by everything that shapes
// the voice, so rendering again does not pay or wait again.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const CFG_DIR = path.join(os.homedir(), '.2d-studio'), CFG = path.join(CFG_DIR, 'tts.json');
const RATE = 24000, XI = 'https://api.elevenlabs.io';
export type Engine = 'breeze' | 'elevenlabs';
export const ELEVEN_MODELS = ['eleven_flash_v2_5', 'eleven_v3', 'eleven_v4', 'eleven_v4_turbo'];
interface Cfg { engine?: Engine; url?: string; elevenKey?: string; elevenModel?: string }
function readCfg(): Cfg { try { return JSON.parse(fs.readFileSync(CFG, 'utf8')); } catch { return {}; } }
function writeCfg(c: Cfg) { fs.mkdirSync(CFG_DIR, { recursive: true }); fs.writeFileSync(CFG, JSON.stringify(c, null, 1), { mode: 0o600 }); }
export const ttsUrl = () => (process.env.BREEZE_TTS_URL || readCfg().url || '').replace(/\/+$/, '');
const elevenKey = () => (process.env.ELEVENLABS_API_KEY || readCfg().elevenKey || '').trim();
const elevenModel = () => { const m = readCfg().elevenModel || ''; return ELEVEN_MODELS.includes(m) ? m : ELEVEN_MODELS[0]; };
export const ttsEngine = (): Engine => (readCfg().engine === 'elevenlabs' ? 'elevenlabs' : readCfg().engine === 'breeze' ? 'breeze' : elevenKey() && !ttsUrl() ? 'elevenlabs' : 'breeze');

/** Save settings from the studio. url: Breeze address; elevenKey: '' forgets the key; engine; elevenModel. */
export function saveTtsConfig(q: { engine?: string; url?: string; elevenKey?: string; elevenModel?: string }) {
  const c = readCfg();
  if (q.url !== undefined) {
    const u = String(q.url).trim().replace(/\/+$/, '');
    if (u && !/^https?:\/\/[^\s/]+(:\d+)?(\/[^\s]*)?$/i.test(u)) throw new Error('Địa chỉ phải dạng http://máy:7860');
    if (u) c.url = u; else delete c.url;
  }
  if (q.elevenKey !== undefined) {
    const k = String(q.elevenKey).trim();
    if (k && !/^[A-Za-z0-9_\-]{20,}$/.test(k)) throw new Error('Key ElevenLabs không đúng dạng (thường bắt đầu bằng sk_).');
    if (k) c.elevenKey = k; else delete c.elevenKey;
  }
  if (q.engine === 'breeze' || q.engine === 'elevenlabs') c.engine = q.engine;
  if (q.elevenModel && ELEVEN_MODELS.includes(q.elevenModel)) c.elevenModel = q.elevenModel;
  writeCfg(c);
}
/** For the URL kept in the old format (Breeze only). */
export const saveTtsUrl = (url: string) => saveTtsConfig({ url });

async function withTimeout<T>(ms: number, f: (s: AbortSignal) => Promise<T>) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try { return await f(ac.signal); } finally { clearTimeout(t); }
}
const netErr = (e: any) => (e.name === 'AbortError' ? 'Không kết nối được (quá thời gian).' : 'Không kết nối được: ' + (e.cause?.code || e.message));

async function breezeStatus() {
  const url = ttsUrl(); if (!url) return { url, ok: false, error: 'Chưa có địa chỉ máy chủ Breeze TTS.' };
  try {
    const r = await withTimeout(5000, (signal) => fetch(url + '/v1/model', { signal }));
    if (!r.ok) return { url, ok: false, error: `Máy chủ trả lỗi ${r.status}.` };
    const j: any = await r.json(); return { url, ok: true, digest: String(j.model_digest || '').slice(0, 12) };
  } catch (e: any) { return { url, ok: false, error: netErr(e) }; }
}
async function elevenStatus() {
  const key = elevenKey(), model = elevenModel(); if (!key) return { hasKey: false, ok: false, model, error: 'Chưa có key ElevenLabs.' };
  try {
    const r = await withTimeout(8000, (signal) => fetch(XI + '/v1/user', { headers: { 'xi-api-key': key }, signal }));
    if (r.status === 401) return { hasKey: true, ok: false, model, error: 'Key ElevenLabs không đúng hoặc đã bị thu hồi.' };
    if (!r.ok) return { hasKey: true, ok: false, model, error: `ElevenLabs trả lỗi ${r.status}.` };
    const j: any = await r.json(), s = j.subscription || {};
    return { hasKey: true, ok: true, model, tier: s.tier || '', left: s.character_limit != null ? Math.max(0, (s.character_limit || 0) - (s.character_count || 0)) : null, limit: s.character_limit ?? null };
  } catch (e: any) { return { hasKey: true, ok: false, model, error: netErr(e) }; }
}
/** Both engines: which one is chosen, and whether each is ready. */
export async function ttsStatus() {
  const [breeze, eleven] = await Promise.all([breezeStatus(), elevenStatus()]), engine = ttsEngine();
  const cur = engine === 'elevenlabs' ? eleven : breeze;
  return { engine, ok: cur.ok, error: cur.ok ? undefined : cur.error, url: breeze.url, breeze, eleven, models: ELEVEN_MODELS };
}
/** The ElevenLabs voices of the account (premade and your own). */
export async function elevenVoices() {
  const key = elevenKey(); if (!key) throw new Error('Chưa có key ElevenLabs.');
  const out: Array<{ id: string; name: string; category: string; labels: Record<string, string> }> = [];
  let token: string | null = null;
  for (let page = 0; page < 5; page++) {
    const q = new URLSearchParams({ page_size: '100', ...(token ? { next_page_token: token } : {}) });
    const r = await withTimeout(10000, (signal) => fetch(`${XI}/v2/voices?${q}`, { headers: { 'xi-api-key': key }, signal }));
    if (!r.ok) throw new Error(`ElevenLabs trả lỗi ${r.status}.`);
    const j: any = await r.json();
    for (const v of j.voices || []) out.push({ id: v.voice_id, name: v.name || v.voice_id, category: v.category || '', labels: v.labels || {} });
    if (!j.has_more || !j.next_page_token) break; token = j.next_page_token;
  }
  return out;
}

export interface LineReq { text: string; instruction?: string; ref?: string; refText?: string; seed?: number; cfg?: number; eleven?: string; speed?: number }

function wav(pcm: Buffer) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

/** Speech for one line into <projectDir>/audio/tts/<hash>.wav (reused when nothing changed). Returns the project-relative file. */
export async function ttsLine(projectDir: string, q: LineReq): Promise<{ file: string; duration: number; cached: boolean; engine: Engine }> {
  const engine = ttsEngine();
  const text = String(q.text || '').trim(); if (!text) throw new Error('Câu thoại trống.');
  if (text.length > 1200) throw new Error('Câu quá dài (tối đa 1200 ký tự một câu).');
  const seed = Number.isFinite(q.seed) ? Math.round(q.seed!) % 4294967295 : 42;
  let refBuf: Buffer | null = null;
  if (engine === 'breeze' && q.ref) {
    const f = path.resolve(projectDir, q.ref);
    if (!f.toLowerCase().startsWith(path.resolve(projectDir).toLowerCase() + path.sep) || !fs.existsSync(f)) throw new Error('Không thấy file giọng mẫu: ' + q.ref);
    if (!String(q.refText || '').trim()) throw new Error('Giọng mẫu cần lời đọc đúng y như trong file.');
    refBuf = fs.readFileSync(f);
  }
  const cfg = q.cfg && q.cfg > 0 ? q.cfg : q.instruction ? 4 : 1, model = elevenModel(), voice = q.eleven || '';
  if (engine === 'elevenlabs' && !voice) throw new Error('Chưa chọn giọng ElevenLabs cho nhân vật này (thẻ Mặt > Giọng đọc).');
  const shape = engine === 'elevenlabs' ? ['eleven', text, voice, model, seed, q.speed ?? 1] : [text, q.instruction || '', refBuf ? crypto.createHash('sha1').update(refBuf).digest('hex') : '', q.refText || '', seed, cfg];
  const key = crypto.createHash('sha1').update(JSON.stringify(shape)).digest('hex').slice(0, 16);
  const rel = `audio/tts/${key}.wav`, out = path.join(projectDir, rel);
  if (fs.existsSync(out)) return { file: rel, duration: (fs.statSync(out).size - 44) / 2 / RATE, cached: true, engine };

  let pcm: Buffer;
  if (engine === 'elevenlabs') {
    const k = elevenKey(); if (!k) throw new Error('Chưa có key ElevenLabs.');
    const body = { text, model_id: model, seed, ...(q.speed && q.speed !== 1 ? { voice_settings: { speed: Math.max(0.7, Math.min(1.2, q.speed)) } } : {}) };
    for (let attempt = 0; ; attempt++) {
      const r = await withTimeout(120000, (signal) => fetch(`${XI}/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=pcm_24000`, { method: 'POST', headers: { 'xi-api-key': k, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal }));
      if (r.status === 429 && attempt < 5) { await new Promise((res) => setTimeout(res, 2000 * (attempt + 1))); continue; }   // too many at once: wait
      if (r.status === 401) throw new Error('Key ElevenLabs không đúng hoặc đã bị thu hồi.');
      if (!r.ok) { let m = ''; try { const j: any = await r.json(); m = j.detail?.message || j.detail?.status || JSON.stringify(j.detail || j).slice(0, 200); } catch { /* not json */ } throw new Error(`ElevenLabs lỗi ${r.status}${m ? ': ' + m : ''}`); }
      pcm = Buffer.from(await r.arrayBuffer()); break;
    }
  } else {
    const url = ttsUrl(); if (!url) throw new Error('Chưa có địa chỉ máy chủ Breeze TTS.');
    const form = () => {
      const f = new FormData();
      f.set('text', text); f.set('seed', String(seed)); f.set('cfg_scale', String(cfg));
      if (q.instruction?.trim()) f.set('instruction', q.instruction.trim());
      if (refBuf) { f.set('ref_audio', new Blob([new Uint8Array(refBuf)]), path.basename(q.ref!)); f.set('ref_text', String(q.refText).trim()); }
      return f;
    };
    for (let attempt = 0; ; attempt++) {   // one request at a time on the server: 409 = busy, wait and try again
      const r = await withTimeout(180000, (signal) => fetch(url + '/v1/audio/speech', { method: 'POST', body: form(), signal }));
      if (r.status === 409 && attempt < 30) { await new Promise((res) => setTimeout(res, 2000)); continue; }
      if (!r.ok) throw new Error(`Breeze TTS lỗi ${r.status}: ${(await r.text()).slice(0, 300)}`);
      pcm = Buffer.from(await r.arrayBuffer()); break;
    }
  }
  if (pcm!.length < RATE / 10) throw new Error('Không nhận được âm thanh (rỗng).');
  const even = pcm!.length % 2 ? pcm!.subarray(0, pcm!.length - 1) : pcm!;
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, wav(even));
  return { file: rel, duration: even.length / 2 / RATE, cached: false, engine };
}
