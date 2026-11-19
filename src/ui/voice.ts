// Giọng đọc bằng Breeze TTS 2: mỗi nhân vật một giọng (mô tả giọng, hoặc file giọng mẫu + lời đọc), mỗi câu thoại
// ("say") thành một đoạn âm thanh trên hàng Âm thanh, đặt đúng lúc câu bắt đầu, và miệng nhép kéo theo độ dài giọng.
// Máy chủ Breeze chạy riêng (cần Linux + GPU NVIDIA); back end: scripts/tts.ts.
import { S, edit, save, toast } from '../state';
import { SceneObject, Key, AudioClip } from '../doc';
import { h } from './dom';
import { AIH } from './ai';

export interface Voice { instruction?: string; ref?: string; refText?: string; seed?: number; cfg?: number }
export const DEFAULT_INSTRUCTION = 'A clear, natural adult voice with a relaxed, conversational delivery.';
export const LICENSE_NOTE = 'Breeze TTS 2 chỉ nói tiếng Anh và tiếng Trung. Giọng tự tạo bằng model này chỉ được dùng cho nghiên cứu, không dùng thương mại (giấy phép BreezeBlue Research and Non-Commercial).';

/** A stable seed per character, so a character keeps its voice until someone changes it. */
const idSeed = (id: string) => { let x = 7; for (const c of id) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x % 100000; };
export function voiceOf(o: SceneObject): Voice { const v: Voice = o.params.voice || {}; return { instruction: v.ref ? v.instruction : v.instruction || DEFAULT_INSTRUCTION, ref: v.ref, refText: v.refText, seed: v.seed ?? idSeed(o.id), cfg: v.cfg }; }
const lines = (o: SceneObject) => (o.tracks.say || []).filter((k) => String(k.v || '').trim());
export const speakers = () => S.doc.objects.filter((o) => o.kind === 'char' && lines(o).length);

// ---------------------------------------------------------------- server
export interface TtsStatus { url: string; ok: boolean; digest?: string; error?: string }
export async function ttsStatus(): Promise<TtsStatus> {
  try { return await (await fetch('/api/tts/status', { headers: AIH })).json(); } catch (e: any) { return { url: '', ok: false, error: e.message }; }
}
async function line(text: string, v: Voice) {
  const r = await fetch(`/api/tts/line?name=${encodeURIComponent(S.project)}`, { method: 'POST', headers: { ...AIH, 'Content-Type': 'application/json' }, body: JSON.stringify({ text, ...v }) });
  const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Breeze TTS lỗi ' + r.status);
  return j as { file: string; duration: number; cached: boolean };
}

/** Box to set (and check) the Breeze server address. */
export function ttsSetup(after?: () => void) {
  const box = h('div', { class: 'tts-setup' });
  const draw = (st: TtsStatus | null) => {
    const inp = h('input', { type: 'text', placeholder: 'http://may-gpu:7860', value: st?.url || '' }) as HTMLInputElement;
    box.replaceChildren(
      h('div', { class: 'hint ' + (st?.ok ? 'ok' : 'warn') }, !st ? 'Đang kiểm tra máy chủ Breeze TTS...' : st.ok ? `Đã nối Breeze TTS (${st.url}${st.digest ? ', model ' + st.digest : ''}).` : st.error || 'Chưa nối được.'),
      h('div', { class: 'srow' }, h('label', {}, 'Máy chủ'), inp, h('button', { onclick: async () => {
        const r = await fetch('/api/tts/config', { method: 'PUT', headers: { ...AIH, 'Content-Type': 'application/json' }, body: JSON.stringify({ url: inp.value }) });
        const j = await r.json(); if (!r.ok) return toast(j.error); draw(j); after?.();
      } }, 'Lưu')),
      ...(st && !st.ok ? [h('div', { class: 'hint' }, 'Máy chủ Breeze cần Linux và card NVIDIA từ 12 GB. Trên máy đó chạy: python -m breeze_infer.api BreezeBlue/breeze-tts-2 --host 0.0.0.0 --port 7860, rồi điền địa chỉ ở trên.')] : []),
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
  if (!st.ok) { toast('Breeze TTS: ' + (st.error || 'chưa nối được máy chủ') + ' Điền địa chỉ ở tab Xuất video hoặc thẻ Mặt của nhân vật.', 6000); return false; }
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
  } catch (e: any) { toast('Breeze TTS: ' + e.message, 7000); return false; }
  finally { busy = false; }
}

/** Play one line's speech (made or cached) right away. */
export async function previewVoice(o: SceneObject, text?: string) {
  const st = await ttsStatus(); if (!st.ok) return toast('Breeze TTS: ' + (st.error || 'chưa nối được máy chủ'), 5000);
  const say = text || String(lines(o)[0]?.v || 'Hello! This is how I sound.');
  toast('Đang tạo giọng mẫu...', 60000);
  try { const r = await line(say, voiceOf(o)); toast(`Giọng mẫu ${r.duration.toFixed(1)} giây.`); new Audio(`/Projects/${encodeURIComponent(S.project)}/${r.file}`).play(); }
  catch (e: any) { toast('Breeze TTS: ' + e.message, 7000); }
}

/** Thẻ Mặt của nhân vật: giọng đọc. */
export function voiceSection(o: SceneObject, section: (title: string, ...kids: any[]) => HTMLElement) {
  const v: Voice = o.params.voice || {}, set = (patch: Partial<Voice>) => edit(() => { const n: any = { ...(o.params.voice || {}), ...patch }; for (const k of Object.keys(n)) if (n[k] === '' || n[k] == null) delete n[k]; if (Object.keys(n).length) o.params.voice = n; else delete o.params.voice; });
  const refIn = h('input', { type: 'file', accept: 'audio/wav,audio/x-wav,.wav,.flac' }) as HTMLInputElement;
  refIn.onchange = async () => {
    const f = refIn.files?.[0]; if (!f) return;
    const r = await fetch(`/api/upload?name=${encodeURIComponent(S.project)}&file=${encodeURIComponent('voice_' + o.id + '_' + f.name)}`, { method: 'POST', body: f });
    const j = await r.json(); if (!r.ok) return toast(j.error); set({ ref: j.file }); toast('Đã thêm giọng mẫu. Điền đúng lời đọc trong file ở ô bên dưới.');
  };
  const n = lines(o).length, done = S.doc.audio.filter((a) => a.tts === o.id).length;
  return section('Giọng đọc (Breeze TTS)',
    h('div', { class: 'hint' }, v.ref ? 'Nhái theo file giọng mẫu. Mô tả (không bắt buộc) chỉnh cách nói.' : 'Mô tả giọng bằng tiếng Anh: tuổi, giới tính, chất giọng, cách nói.'),
    h('textarea', { rows: 3, placeholder: DEFAULT_INSTRUCTION, value: v.instruction || '', onchange: (e: any) => set({ instruction: e.target.value.trim() }) }),
    h('div', { class: 'srow' }, h('label', {}, 'Giọng mẫu'), h('span', { class: 'hint span2' }, v.ref ? v.ref.split('/').pop() : 'không có (tạo giọng theo mô tả)'),
      h('button', { class: 'rbtn', onclick: () => refIn.click() }, 'Chọn'), v.ref ? h('button', { class: 'rbtn', onclick: () => set({ ref: '', refText: '' }) }, 'Bỏ') : h('span')),
    v.ref ? h('textarea', { rows: 2, placeholder: 'Lời đọc đúng y như trong file giọng mẫu', value: v.refText || '', onchange: (e: any) => set({ refText: e.target.value.trim() }) }) : null,
    h('div', { class: 'srow' }, h('label', {}, 'Biến thể'), h('span', { class: 'hint' }, String(voiceOf(o).seed)), h('button', { class: 'rbtn', onclick: () => set({ seed: Math.floor(Math.random() * 100000) }) }, 'Khác'), h('span')),
    h('div', { class: 'row2' }, h('button', { onclick: () => previewVoice(o) }, 'Nghe thử'), h('button', { class: 'primary', disabled: !n, onclick: () => makeVoices([o]) }, `Tạo giọng cho ${n} câu`)),
    done ? h('div', { class: 'hint' }, `${done} câu đã có giọng trên hàng Âm thanh. Đổi giọng hay sửa câu thì bấm tạo lại.`) : null,
    h('details', {}, h('summary', {}, 'Máy chủ và giấy phép'), ttsSetup(), h('div', { class: 'hint' }, LICENSE_NOTE)),
  );
}
