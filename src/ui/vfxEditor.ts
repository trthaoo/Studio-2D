// VFX editor (Library tab): write or describe an effect, preview it on a stand-in character, save it to Library/vfx.
// The code follows Rigging Studio's contract (src/vfxCode.ts VFX_CONTRACT), so effects move between the two studios.
import { S, edit, select, selObj, toast, emit } from '../state';
import { SceneObject, newId, normalize, SceneDoc, activeCut } from '../doc';
const stageForNew = () => { const sel = selObj(); if (sel) return sel.stage; const c = activeCut(S.doc, S.t).cur; const cam = c && S.doc.objects.find((o) => o.id === c.camera); return cam?.stage || S.doc.stages[0].id; };
import { LIB, loadLibrary, saveLibrary, safeName, vfxHeader } from '../library';
import { Runtime } from '../runtime';
import { VFX_CONTRACT, VFX_EXAMPLES, buildVfx, updateVfx } from '../vfxCode';
import { FX, FX_AT, FX_AT_VI, FX_DEFAULT_AT } from '../vfx';
import { h } from './dom';
import { framePoint } from './viewport';
import { aiLoop, renderAiSetup } from './ai';
import * as THREE from 'three';

/** Add an effect to the scene: on the selected character (at its best spot) if one is selected, else mid-frame.
 *  One-shot effects start at the playhead. */
export function addFx(p: Record<string, any>) {
  const sel = selObj(), on = sel?.kind === 'char' ? sel : null;
  const code = p.type === 'code' ? LIB.vfx.find((x) => x.name === p.code)?.code || '' : '';
  const at = p.at || (p.type === 'code' ? vfxHeader(code).at : FX_DEFAULT_AT[p.type] || 'feet');
  const label = p.type === 'code' ? vfxHeader(code).name || p.code : FX[p.type]?.label || 'Hiệu ứng';
  const burst = p.type === 'code' || !!FX[p.type]?.burst, t = Math.round(S.t * 100) / 100;
  const o: SceneObject = {
    id: newId('fx'), name: on ? `${label} (${on.name})` : label, kind: 'fx', stage: on?.stage || stageForNew(),
    params: { ...p, seed: 1, ...(on ? { follow: on.id, at } : {}) },
    tracks: { pos: [{ t: 0, v: on ? [0, 0, 0] : framePoint() }], ...(burst && t > 0 ? { visible: [{ t: 0, v: false }, { t, v: true }] } : {}) },
  };
  edit((d) => d.objects.push(o)); select(o.id);
  if (S.ws !== 'scene') { S.ws = 'scene'; emit('ws'); }
  toast(on ? `Đã thêm "${label}" bám theo ${on.name}${burst ? `, bắt đầu tại ${t}s` : ''}.` : `Đã thêm "${label}" giữa khung hình${burst ? `, bắt đầu tại ${t}s` : ''}. Chọn một nhân vật trước để hiệu ứng bám theo.`);
}

const DEFAULT = VFX_EXAMPLES[0];
const SYSTEM = `${VFX_CONTRACT}\n\nTrả lời đúng một khối code \`\`\`js, không giải thích. Bắt đầu code bằng 3 dòng chú thích: // name: <tên tiếng Việt>, // at: <feet|hips|chest|head|leftHand|rightHand>, // dur: <giây>.`;
const header = (name: string, at: string, dur: number, code: string) => `// name: ${name}\n// at: ${at}\n// dur: ${dur}\n` + code.replace(/^\s*\/\/\s*(name|at|dur):.*\n/gim, '').replace(/^\n+/, '');

/** The editor. Returns a stop function for its preview loop. */
export function vfxEditor(root: HTMLElement, existing: string | undefined, saved: (name: string) => void, remove: (name: string) => void): () => void {
  const it = existing ? LIB.vfx.find((x) => x.name === existing) : null;
  const start = it?.code || header('Lấp lánh bung ra', DEFAULT.at, DEFAULT.dur, DEFAULT.code), hd = vfxHeader(start);
  const nameIn = h('input', { value: hd.name || existing || '', placeholder: 'Tên hiệu ứng, ví dụ: Khiên năng lượng' }) as HTMLInputElement;
  const atSel = h('select', {}, ...FX_AT.map((a) => h('option', { value: a, selected: hd.at === a }, FX_AT_VI[a]))) as HTMLSelectElement;
  const durIn = h('input', { type: 'number', class: 'num', min: 0.2, max: 120, step: 0.1, value: hd.dur, title: 'Số giây hiệu ứng chạy' }) as HTMLInputElement;
  const exSel = h('select', { title: 'Bắt đầu từ một ví dụ' }, h('option', { value: '' }, 'Bắt đầu từ ví dụ...'), ...VFX_EXAMPLES.map((e, i) => h('option', { value: i }, e.name))) as HTMLSelectElement;
  const desc = h('textarea', { rows: 2, placeholder: 'Mô tả cho AI, ví dụ: khiên năng lượng xanh hình cầu bao quanh người, gợn sóng khi xuất hiện, tan thành tia sáng lúc biến mất' }) as HTMLTextAreaElement;
  const ta = h('textarea', { class: 'code', rows: 22, spellcheck: false, value: start }) as HTMLTextAreaElement;
  const msg = h('div', { class: 'codemsg' }), aiMsg = h('div', { class: 'hint aimsg' }), aiBox = h('div', { class: 'aibox' });
  const cv = h('canvas', { class: 'codeprev', width: 360, height: 640 }) as HTMLCanvasElement;
  const g2 = cv.getContext('2d')!;

  // ---- preview: the real runtime, a stand-in character, the effect on it, looping over its duration
  const rt = new Runtime(); let raf = 0, t0 = performance.now(), ok = false;
  const docFor = (code: string): SceneDoc => normalize({
    version: 1, name: 'vfx', fps: 30, width: 1080, height: 1920, duration: 10, stages: [{ id: 's', name: 's', mood: 'night' }],
    objects: [
      { id: 'f', name: 'f', kind: 'set', stage: 's', params: { type: 'floor', color: '#2c3244' }, tracks: {} },
      { id: 'c', name: 'c', kind: 'char', stage: 's', params: { shirt: '#5a6b8c' }, tracks: { pos: [{ t: 0, v: [0, 0, 0] }], rotY: [{ t: 0, v: -55 }], armR: [{ t: 0, v: 'point' }] } },
      { id: 'x', name: 'x', kind: 'fx', stage: 's', params: { type: 'code', codeText: code, follow: 'c', at: atSel.value, dur: +durIn.value || 3, loop: true }, tracks: { pos: [{ t: 0, v: [0, 0, 0] }] } },
      { id: 'cam', name: 'cam', kind: 'camera', stage: 's', params: {}, tracks: { pos: [{ t: 0, v: [0, 1.4, 5.2] }], target: [{ t: 0, v: [0, 0.85, 0] }], fov: [{ t: 0, v: 42 }] } },
    ], cuts: [{ t: 0, camera: 'cam' }], captions: [], audio: [],
  } as any);
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (!ok) return;
    const t = ((performance.now() - t0) / 1000) % 10;
    try { rt.draw(t, { captions: false }); g2.drawImage(rt.frame, 0, 0, cv.width, cv.height); } catch { /* shown by tryIt */ }
  };
  /** Check the code (builds, runs at several moments) and show it. Returns an error text, or null when fine. */
  async function tryIt(): Promise<string | null> {
    const code = ta.value, dur = +durIn.value || 3;
    try {
      const b = buildVfx(THREE as any, code, { seed: 1, duration: dur });
      for (const t of [0, dur * 0.25, dur * 0.5, dur * 0.9, 0.1]) updateVfx(b, t);
      rt.sync(docFor(code));
      if (rt.errors.length) throw new Error(rt.errors.join('; '));
      ok = true; t0 = performance.now();
      msg.className = 'codemsg'; msg.textContent = `Chạy được: ${b.stats.particles.toLocaleString()} hạt, ${b.stats.meshes} khối, ${b.stats.triangles.toLocaleString()} tam giác. Xem trước lặp lại mỗi ${dur} giây trên nhân vật mẫu.`;
      return null;
    } catch (e: any) {
      ok = false; msg.className = 'codemsg err';
      msg.textContent = 'Lỗi' + (e.line ? ` (dòng ${e.line})` : '') + ': ' + e.message;
      return msg.textContent;
    }
  }
  async function keep(andAdd: boolean) {
    if (await tryIt()) return;
    const name = nameIn.value.trim() || vfxHeader(ta.value).name || 'VFX mới';
    const file = existing || safeName(name);
    if (!existing && LIB.vfx.some((x) => x.name === file)) { toast(`Đã có "${name}" trong thư viện. Đặt tên khác.`); return; }
    await saveLibrary.vfx(file, header(name, atSel.value, +durIn.value || 3, ta.value)); await loadLibrary();
    toast(`Đã lưu VFX "${name}" vào Library/vfx.`);
    if (andAdd) addFx({ type: 'code', code: file, at: atSel.value }); else saved(file);
  }
  const promptFor = (want: string) => `Hiệu ứng cần làm: ${want}\nVị trí trên nhân vật: ${atSel.value} (${FX_AT_VI[atSel.value]}). Thời lượng: ${durIn.value} giây. Tên gợi ý: ${nameIn.value || '(tự đặt, tiếng Việt)'}.\nNhân vật cao khoảng 1.2 m, phong cách hoạt hình phẳng, màu tươi.`;
  async function generate(editMode: boolean) {
    const want = desc.value.trim(); if (!want) { toast('Viết mô tả trước.'); desc.focus(); return; }
    await aiLoop({
      msg: aiMsg, setupBox: aiBox, system: SYSTEM,
      first: editMode ? `${promptFor(want)}\n\nĐây là code hiện tại. Sửa theo mô tả (giữ những gì không được nhắc tới), trả lại TOÀN BỘ code:\n\`\`\`js\n${ta.value}\n\`\`\`` : promptFor(want),
      fix: (code, err) => `${promptFor(want)}\n\nCode dưới đây bị lỗi: ${err}\nSửa lỗi, trả lại TOÀN BỘ code:\n\`\`\`js\n${code}\n\`\`\``,
      apply: async (code) => {
        ta.value = code; const hh = vfxHeader(code);
        if (hh.name && !nameIn.value) nameIn.value = hh.name;
        if (/\/\/\s*at:/i.test(code)) atSel.value = hh.at; if (/\/\/\s*dur:/i.test(code)) durIn.value = String(hh.dur);
        return tryIt();
      },
    });
  }
  ta.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); tryIt(); } if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); } });
  exSel.addEventListener('change', () => { const e = VFX_EXAMPLES[+exSel.value]; if (!e) return; ta.value = e.code; atSel.value = e.at; durIn.value = String(e.dur); exSel.value = ''; tryIt(); });
  atSel.addEventListener('change', () => tryIt()); durIn.addEventListener('change', () => tryIt());
  root.append(
    h('div', { class: 'wshead' }, h('h1', {}, existing ? `Sửa VFX: ${hd.name || existing}` : 'Tạo VFX mới'),
      h('p', { class: 'hint' }, 'Mô tả hiệu ứng rồi bấm "Tạo bằng AI": AI viết code three.js, studio tự chạy thử, tự sửa lỗi và chiếu thử trên nhân vật mẫu. Ưng thì Lưu; trong cảnh, chọn nhân vật rồi thêm VFX từ thư viện là nó bám theo. Code theo đúng quy tắc của Rigging Studio, dán qua lại được.')),
    h('div', { class: 'codegrid' },
      h('div', { class: 'codeleft' },
        h('div', { class: 'row' }, nameIn, atSel, durIn, h('span', { class: 'hint' }, 'giây')),
        desc,
        h('div', { class: 'row wrap' },
          h('button', { class: 'primary', onclick: () => generate(false) }, 'Tạo bằng AI'),
          h('button', { onclick: () => generate(true), title: 'Giữ code hiện tại, chỉ sửa theo mô tả' }, 'Sửa bằng AI'),
          exSel,
          h('button', { onclick: () => navigator.clipboard.writeText(`${SYSTEM}\n\n${promptFor(desc.value || '(mô tả)')}`).then(() => toast('Đã copy quy tắc + mô tả để dán cho AI.')) }, 'Copy prompt')),
        aiMsg, aiBox, ta),
      h('div', { class: 'coderight' }, cv, msg,
        h('div', { class: 'wbtns' },
          h('button', { onclick: () => tryIt() }, 'Thử (Ctrl+Enter)'),
          h('button', { onclick: () => keep(false) }, 'Lưu vào thư viện'),
          h('button', { class: 'primary', onclick: () => keep(true) }, 'Lưu và thêm vào cảnh'),
          it ? h('button', { class: 'danger', onclick: () => remove(it.name) }, 'Xoá khỏi thư viện') : null))));
  renderAiSetup(aiBox); tryIt(); loop();
  return () => cancelAnimationFrame(raf);
}
