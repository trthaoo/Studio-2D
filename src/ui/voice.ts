// Giọng đọc: mỗi nhân vật một giọng, mỗi câu thoại ("say") thành một đoạn âm thanh trên hàng Âm thanh, đặt đúng lúc
// câu bắt đầu, và miệng nhép kéo theo độ dài giọng. Hai cách tạo giọng, chọn một lần cho máy này:
//   Breeze TTS 2 (máy chủ riêng, Linux + GPU NVIDIA): mô tả giọng, hoặc file giọng mẫu + lời đọc.
//   ElevenLabs (API key): chọn một giọng trong tài khoản ElevenLabs; nói được tiếng Việt.
// Back end: scripts/tts.ts (key chỉ nằm trên máy này, không gửi ra trang).
import { S, edit, save, toast } from '../state';
import { SceneObject, Key, AudioClip, lookSource } from '../doc';
import { h } from './dom';
import { AIH } from './ai';

export interface Voice { instruction?: string; ref?: string; refText?: string; seed?: number; cfg?: number; eleven?: string; elevenName?: string; speed?: number }
export const DEFAULT_INSTRUCTION = 'A clear, natural adult voice with a relaxed, conversational delivery.';
export const LICENSE_NOTE = 'Breeze TTS 2 chỉ nói tiếng Anh và tiếng Trung. Giọng tự tạo bằng model này chỉ được dùng cho nghiên cứu, không dùng thương mại (giấy phép BreezeBlue Research and Non-Commercial). ElevenLabs: dùng thương mại theo gói của tài khoản.';
const MODEL_VI: Record<string, string> = { eleven_flash_v2_5: 'Flash v2.5 (nhanh, rẻ một nửa)', eleven_v3: 'v3 (biểu cảm)', eleven_v4: 'v4 (chất lượng cao nhất)', eleven_v4_turbo: 'v4 Turbo (nhanh)' };

/** A stable seed per character, so a character keeps its voice until someone changes it. */
const idSeed = (id: string) => { let x = 7; for (const c of id) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x % 100000; };
/** The same person in several stages speaks with one voice: the voice lives on the shared look (doc lookSource). */
export function voiceOf(o: SceneObject): Voice {
  const src = lookSource(S.doc, o), v: Voice = src.params.voice || {};
  return { instruction: v.ref ? v.instruction : v.instruction || DEFAULT_INSTRUCTION, ref: v.ref, refText: v.refText, seed: v.seed ?? idSeed(src.id), cfg: v.cfg, eleven: v.eleven || autoVoice(src), speed: v.speed };
}
const lines = (o: SceneObject) => (o.tracks.say || []).filter((k) => String(k.v || '').trim());
export const speakers = () => S.doc.objects.filter((o) => o.kind === 'char' && lines(o).length);

// ---------------------------------------------------------------- server
export interface TtsStatus {
  engine: 'breeze' | 'elevenlabs'; ok: boolean; error?: string; url: string; models?: string[];
  breeze?: { url: string; ok: boolean; digest?: string; error?: string };
  eleven?: { hasKey: boolean; ok: boolean; model: string; tier?: string; left?: number | null; limit?: number | null; error?: string };
}
export async function ttsStatus(): Promise<TtsStatus> {
  try { return await (await fetch('/api/tts/status', { headers: AIH })).json(); } catch (e: any) { return { engine: 'breeze', url: '', ok: false, error: e.message }; }
}
async function line(text: string, v: Voice) {
  const r = await fetch(`/api/tts/line?name=${encodeURIComponent(S.project)}`, { method: 'POST', headers: { ...AIH, 'Content-Type': 'application/json' }, body: JSON.stringify({ text, ...v }) });
  const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Lỗi tạo giọng ' + r.status);
  return j as { file: string; duration: number; cached: boolean };
}
// the account's ElevenLabs voices (loaded once per page)
export interface ElevenVoice { id: string; name: string; category: string; labels: Record<string, string> }
let voicesP: Promise<ElevenVoice[]> | null = null, voicesNow: ElevenVoice[] = [];
export function elevenVoices(again = false): Promise<ElevenVoice[]> {
  if (!voicesP || again) voicesP = fetch('/api/tts/voices', { headers: AIH }).then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); voicesNow = j; return j; }).catch((e) => { voicesP = null; throw e; });
  return voicesP;
}
/** No voice picked yet: a different one per character from the account (by gender label when there is one). */
function autoVoice(o: SceneObject): string | undefined {
  if (!voicesNow.length) return undefined;
  const people = S.doc.objects.filter((x) => x.kind === 'char' && !x.params.same), i = Math.max(0, people.findIndex((x) => x.id === o.id));
  const fem = o.params.outfit === 'dress' || ['bun', 'ponytail', 'long'].includes(o.params.style);
  const pool = voicesNow.filter((v) => !v.labels?.gender || (fem ? v.labels.gender === 'female' : v.labels.gender === 'male'));
  const list = pool.length ? pool : voicesNow; return list[(i * 3 + idSeed(o.id)) % list.length]?.id;
}

/** Box to choose the engine and connect it: Breeze server address, or the ElevenLabs key and model. */
export function ttsSetup(after?: () => void) {
  const box = h('div', { class: 'tts-setup' });
  const put = async (q: any) => { const r = await fetch('/api/tts/config', { method: 'PUT', headers: { ...AIH, 'Content-Type': 'application/json' }, body: JSON.stringify(q) }); const j = await r.json(); if (!r.ok) { toast(j.error); return; } draw(j); elevenVoices(true).catch(() => {}); after?.(); };
  const draw = (st: TtsStatus | null) => {
    if (!st) { box.replaceChildren(h('div', { class: 'hint' }, 'Đang kiểm tra giọng đọc...')); return; }
    const E = st.eleven, B = st.breeze;
    const eng = h('div', { class: 'seg small' },
      h('button', { class: st.engine === 'elevenlabs' ? 'on' : '', onclick: () => put({ engine: 'elevenlabs' }) }, 'ElevenLabs'),
      h('button', { class: st.engine === 'breeze' ? 'on' : '', onclick: () => put({ engine: 'breeze' }) }, 'Breeze TTS (máy chủ riêng)'));
    const keyIn = h('input', { type: 'password', placeholder: E?.hasKey ? 'Đã có key (dán key mới để thay)' : 'Dán API key ElevenLabs (sk_...)', autocomplete: 'off', spellcheck: false }) as HTMLInputElement;
    const urlIn = h('input', { type: 'text', placeholder: 'http://may-gpu:7860', value: B?.url || '' }) as HTMLInputElement;
    box.replaceChildren(
      h('div', { class: 'row' }, h('span', { class: 'hint' }, 'Tạo giọng bằng'), eng),
      st.engine === 'elevenlabs' ? h('div', { class: 'tts-eng' },
        h('div', { class: 'hint ' + (E?.ok ? 'ok' : 'warn') }, E?.ok ? `Đã nối ElevenLabs${E.tier ? ` (gói ${E.tier}` : ''}${E.left != null ? `, còn ${E.left.toLocaleString('vi-VN')} ký tự` : ''}${E.tier ? ')' : ''}.` : E?.error || 'Chưa nối được.'),
        h('div', { class: 'row' }, keyIn, h('button', { onclick: () => { const k = keyIn.value.trim(); if (!k) return; keyIn.value = ''; put({ elevenKey: k }); } }, 'Lưu key'),
          E?.hasKey ? h('button', { class: 'rbtn', title: 'Xoá key ElevenLabs đã lưu trên máy này', onclick: () => put({ elevenKey: '' }) }, 'Xoá key') : null),
        h('div', { class: 'row' }, h('span', { class: 'hint' }, 'Model'), h('select', { onchange: (e: any) => put({ elevenModel: e.target.value }) }, ...(st.models || []).map((m) => h('option', { value: m, selected: E?.model === m }, MODEL_VI[m] || m)))),
        h('div', { class: 'hint' }, 'Key chỉ lưu trên máy này (thư mục người dùng, ngoài project), không gửi ra trang và không lên git. Lấy key ở elevenlabs.io > Developers > API Keys.'))
      : h('div', { class: 'tts-eng' },
        h('div', { class: 'hint ' + (B?.ok ? 'ok' : 'warn') }, B?.ok ? `Đã nối Breeze TTS (${B.url}${B.digest ? ', model ' + B.digest : ''}).` : B?.error || 'Chưa nối được.'),
        h('div', { class: 'row' }, urlIn, h('button', { onclick: () => put({ url: urlIn.value }) }, 'Lưu')),
        h('div', { class: 'hint' }, 'Máy chủ Breeze cần Linux và card NVIDIA từ 12 GB. Trên máy đó chạy: python -m breeze_infer.api BreezeBlue/breeze-tts-2 --host 0.0.0.0 --port 7860, rồi điền địa chỉ ở trên.')),
    );
  };
  draw(null); ttsStatus().then(draw);
  return box;
}

// ---------------------------------------------------------------- making the voices
let busy = false;
/**
 * Speech for every line of these characters (all speakers by default). Each line becomes an audio clip at the line's
 * time (old Breeze clips of that character are replaced), and the line's lip-sync stretches to the speech.
 * Lines already made with the same voice and words come from the cache in an instant.
 */
export async function makeVoices(chars: SceneObject[] = speakers(), quiet = false): Promise<boolean> {
  if (busy) { toast('Đang tạo giọng, đợi xong đã.'); return false; }
  if (!S.project) return false;
  const jobs = chars.flatMap((o) => lines(o).map((k) => ({ o, k })));
  if (!jobs.length) { if (!quiet) toast('Chưa có câu thoại nào (thẻ Mặt → Câu thoại).'); return true; }
  const st = await ttsStatus();
  if (!st.ok) { toast('Giọng đọc: ' + (st.error || 'chưa kết nối') + ' Cài đặt ở tab Xuất video hoặc thẻ Mặt của nhân vật.', 6000); return false; }
  if (st.engine === 'elevenlabs') { try { await elevenVoices(); } catch (e: any) { toast('ElevenLabs: ' + e.message, 6000); return false; } }   // for characters with no voice picked yet
  busy = true;
  const made: Array<{ o: SceneObject; k: Key; file: string; duration: number }> = [];
  try {
    await save();
    let fresh = 0;
    for (let i = 0; i < jobs.length; i++) {
      const { o, k } = jobs[i];
      toast(`Đang tạo giọng ${i + 1}/${jobs.length}: ${o.name}`, 60000);
      const r = await line(String(k.v), voiceOf(o)); if (!r.cached) fresh++;
      made.push({ o, k, file: r.file, duration: r.duration });
    }
    let overlaps = 0;
    edit((d) => {
      const ids = new Set(chars.map((o) => o.id));
      d.audio = d.audio.filter((a) => !(a.tts && ids.has(a.tts)));
      for (const m of made) {
        const obj = d.objects.find((x) => x.id === m.o.id); const key = obj?.tracks.say?.find((x) => Math.abs(x.t - m.k.t) < 1e-6 && x.v === m.k.v);
        if (key) key.d = +m.duration.toFixed(3);   // lips move for as long as the voice speaks
        const clip: AudioClip = { id: `tts_${m.o.id}_${Math.round(m.k.t * 1000)}`, file: m.file, start: m.k.t, name: `${m.o.name}: ${String(m.k.v).slice(0, 40)}`, tts: m.o.id };
        d.audio.push(clip);
      }
      const all = d.audio.filter((a) => a.tts).sort((a, b) => a.start - b.start);
      const len = (a: AudioClip) => made.find((m) => m.file === a.file)?.duration ?? 0;
      for (let i = 1; i < all.length; i++) if (all[i].start < all[i - 1].start + len(all[i - 1]) - 0.05) overlaps++;
      const end = Math.max(...made.map((m) => m.k.t + m.duration));
      if (end + 0.3 > d.duration) d.duration = +(end + 0.3).toFixed(2);
    });
    toast(`Xong giọng đọc: ${made.length} câu (${fresh} câu mới, ${made.length - fresh} lấy lại từ lần trước).${overlaps ? ` Có ${overlaps} chỗ câu sau bắt đầu khi câu trước chưa nói xong: dời câu trên timeline nếu cần.` : ''}`, overlaps ? 8000 : 4000);
    return true;
  } catch (e: any) { toast('Giọng đọc: ' + e.message, 7000); return false; }
  finally { busy = false; }
}

/** Play one line's speech (made or cached) right away. */
export async function previewVoice(o: SceneObject, text?: string) {
  const st = await ttsStatus(); if (!st.ok) return toast('Giọng đọc: ' + (st.error || 'chưa kết nối'), 5000);
  if (st.engine === 'elevenlabs') { try { await elevenVoices(); } catch (e: any) { return toast('ElevenLabs: ' + e.message, 6000); } }
  const say = text || String(lines(o)[0]?.v || (st.engine === 'elevenlabs' ? 'Xin chào, đây là giọng của tôi.' : 'Hello! This is how I sound.'));
  toast('Đang tạo giọng mẫu...', 60000);
  try { const r = await line(say, voiceOf(o)); toast(`Giọng mẫu ${r.duration.toFixed(1)} giây.`); new Audio(`/Projects/${encodeURIComponent(S.project)}/${r.file}`).play(); }
  catch (e: any) { toast('Giọng đọc: ' + e.message, 7000); }
}

/** Thẻ Mặt của nhân vật: giọng đọc. */
export function voiceSection(o: SceneObject, section: (title: string, ...kids: any[]) => HTMLElement) {
  const src = lookSource(S.doc, o);
  const v: Voice = src.params.voice || {}, set = (patch: Partial<Voice>) => edit(() => { const n: any = { ...(src.params.voice || {}), ...patch }; for (const k of Object.keys(n)) if (n[k] === '' || n[k] == null) delete n[k]; if (Object.keys(n).length) src.params.voice = n; else delete src.params.voice; });
  const refIn = h('input', { type: 'file', accept: 'audio/wav,audio/x-wav,.wav,.flac' }) as HTMLInputElement;
  refIn.onchange = async () => {
    const f = refIn.files?.[0]; if (!f) return;
    const r = await fetch(`/api/upload?name=${encodeURIComponent(S.project)}&file=${encodeURIComponent('voice_' + o.id + '_' + f.name)}`, { method: 'POST', body: f });
    const j = await r.json(); if (!r.ok) return toast(j.error); set({ ref: j.file }); toast('Đã thêm giọng mẫu. Điền đúng lời đọc trong file ở ô bên dưới.');
  };
  const n = lines(o).length, done = S.doc.audio.filter((a) => a.tts === o.id).length;
  // ElevenLabs: a voice from the account (filled once the list arrives); Breeze: the description / sample below
  const elBox = h('div', { class: 'tts-eng' }), brBox = h('div', {}, ...breezeFields(o, v, set, refIn));
  ttsStatus().then(async (st) => {
    if (st.engine !== 'elevenlabs') { elBox.remove(); return; }
    brBox.remove();
    let list: ElevenVoice[] = []; try { list = await elevenVoices(); } catch (e: any) { elBox.replaceChildren(h('div', { class: 'hint warn' }, 'ElevenLabs: ' + e.message)); return; }
    const cur = voiceOf(o).eleven;
    elBox.replaceChildren(
      h('div', { class: 'srow' }, h('label', {}, 'Giọng'), h('select', { class: 'span2', onchange: (e: any) => { const vv = list.find((x) => x.id === e.target.value); set({ eleven: e.target.value, elevenName: vv?.name }); } },
        ...list.map((vv) => h('option', { value: vv.id, selected: vv.id === cur }, `${vv.name}${vv.labels?.gender ? ` · ${vv.labels.gender === 'female' ? 'nữ' : vv.labels.gender === 'male' ? 'nam' : vv.labels.gender}` : ''}${vv.labels?.age ? ` · ${vv.labels.age}` : ''}${vv.category === 'cloned' || vv.category === 'generated' ? ' (của bạn)' : ''}`)))),
      h('div', { class: 'srow' }, h('label', {}, 'Tốc độ'), h('input', { type: 'number', class: 'num', min: 0.7, max: 1.2, step: 0.05, value: v.speed ?? 1, onchange: (e: any) => set({ speed: +e.target.value === 1 ? undefined : Math.max(0.7, Math.min(1.2, +e.target.value)) }) }), h('span', { class: 'hint' }, '0.7 - 1.2')),
      h('div', { class: 'hint' }, v.eleven ? 'Giọng này dùng cho nhân vật ở mọi cảnh.' : 'Chưa chọn: studio tự chia mỗi nhân vật một giọng khác nhau.'));
  });
  return section('Giọng đọc',
    elBox, brBox,
    h('div', { class: 'row2' }, h('button', { onclick: () => previewVoice(o) }, 'Nghe thử'), h('button', { class: 'primary', disabled: !n, onclick: () => makeVoices([o]) }, `Tạo giọng cho ${n} câu`)),
    done ? h('div', { class: 'hint' }, `${done} câu đã có giọng trên hàng Âm thanh. Đổi giọng hay sửa câu thì bấm tạo lại.`) : null,
    h('details', {}, h('summary', {}, 'Chọn ElevenLabs hoặc Breeze, key và giấy phép'), ttsSetup(), h('div', { class: 'hint' }, LICENSE_NOTE)),
  );
}
function breezeFields(o: SceneObject, v: Voice, set: (p: Partial<Voice>) => void, refIn: HTMLInputElement) {
  return [
    h('div', { class: 'hint' }, v.ref ? 'Nhái theo file giọng mẫu. Mô tả (không bắt buộc) chỉnh cách nói.' : 'Mô tả giọng bằng tiếng Anh: tuổi, giới tính, chất giọng, cách nói.'),
    h('textarea', { rows: 3, placeholder: DEFAULT_INSTRUCTION, value: v.instruction || '', onchange: (e: any) => set({ instruction: e.target.value.trim() }) }),
    h('div', { class: 'srow' }, h('label', {}, 'Giọng mẫu'), h('span', { class: 'hint span2' }, v.ref ? v.ref.split('/').pop() : 'không có (tạo giọng theo mô tả)'),
      h('button', { class: 'rbtn', onclick: () => refIn.click() }, 'Chọn'), v.ref ? h('button', { class: 'rbtn', onclick: () => set({ ref: '', refText: '' }) }, 'Bỏ') : h('span')),
    v.ref ? h('textarea', { rows: 2, placeholder: 'Lời đọc đúng y như trong file giọng mẫu', value: v.refText || '', onchange: (e: any) => set({ refText: e.target.value.trim() }) }) : null,
    h('div', { class: 'srow' }, h('label', {}, 'Biến thể'), h('span', { class: 'hint' }, String(voiceOf(o).seed)), h('button', { class: 'rbtn', onclick: () => set({ seed: Math.floor(Math.random() * 100000) }) }, 'Khác'), h('span')),
  ].filter(Boolean) as HTMLElement[];
}
