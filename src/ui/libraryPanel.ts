// Thư viện (Library/ trên ổ đĩa, dùng chung mọi project): nhân vật, bối cảnh, vật làm bằng code.
// - Bảng nhỏ bên trái: danh sách để thêm nhanh vào cảnh.
// - Workspace "Thư viện": quản lý (xem, thêm, xoá), soạn code với xem trước 3D, lưu từ cảnh vào thư viện.
import * as THREE from 'three';
import { S, edit, select, selObj, toast, emit } from '../state';
import { SceneObject, newId, valueAt, Vec3, activeCut } from '../doc';
import { LIB, loadLibrary, codeAssets, compile, tryBuild, headerOf, saveLibrary, removeFromLibrary, safeName } from '../library';
import { h, ask } from './dom';
import { framePoint } from './viewport';
import { characterCreator, stopCreator } from './charCreator';
import { AIH, codeOf, renderAiSetup } from './ai';
import { vfxEditor, addFx } from './vfxEditor';
import { vfxHeader } from '../library';
import { FX_AT_VI } from '../vfx';

const PART = /^(hair|face|eye|brow|mouth|acc)\./;

// ---------------------------------------------------------------- saving from the scene
export async function saveCharacter(o: SceneObject) {
  const name = await ask('Lưu nhân vật vào thư viện với tên', o.name); if (!name) return;
  const tracks: Record<string, any> = {};
  for (const [k, keys] of Object.entries(o.tracks)) if (PART.test(k) && keys.length) tracks[k] = [{ t: 0, v: valueAt(o, k, S.t) }];
  await saveLibrary.character(safeName(name), { name, params: o.params, tracks, savedFrom: S.project });
  await loadLibrary(); toast(`Đã lưu "${name}" vào thư viện, mục Nhân vật.`);
}
export async function saveBackground(stageId: string) {
  const objs = S.doc.objects.filter((o) => o.stage === stageId && (o.kind === 'set' || o.kind === 'prop' || o.kind === 'lamp') && !o.parent);
  if (!objs.length) { toast('Sân khấu này chưa có bối cảnh hay đồ vật để lưu.'); return; }
  const st = S.doc.stages.find((s) => s.id === stageId)!;
  const name = await ask('Lưu bối cảnh (phòng, đồ vật, đèn) với tên', st.name); if (!name) return;
  const cut = activeCut(S.doc, S.t).cur, cam = cut && S.doc.objects.find((o) => o.id === cut.camera && o.stage === stageId);
  const tg = cam ? (valueAt(cam, 'target', S.t) as Vec3) : [0, 0, 0];
  const clean = objs.map((o) => ({ ...JSON.parse(JSON.stringify(o)), tracks: Object.fromEntries(Object.entries(o.tracks).map(([k]) => [k, [{ t: 0, v: valueAt(o, k, 0) }]])) }));
  await saveLibrary.background(safeName(name), { name, mood: st.mood, stand: [tg[0], tg[2]], objects: clean });
  await loadLibrary(); toast(`Đã lưu bối cảnh "${name}" (${objs.length} thứ) vào thư viện.`);
}

// ---------------------------------------------------------------- adding from the library
export function stageForNew() { const sel = selObj(); if (sel) return sel.stage; const c = activeCut(S.doc, S.t).cur; const cam = c && S.doc.objects.find((o) => o.id === c.camera); return cam?.stage || S.doc.stages[0].id; }
const toScene = () => { if (S.ws !== 'scene') { S.ws = 'scene'; emit('ws'); } };
export function addSavedCharacter(name: string) {
  const it = LIB.characters.find((c) => c.name === name)?.data; if (!it) return;
  const o: SceneObject = { id: newId('char'), name: it.name || name, kind: 'char', stage: stageForNew(), params: JSON.parse(JSON.stringify(it.params)), tracks: { ...JSON.parse(JSON.stringify(it.tracks || {})), pos: [{ t: 0, v: framePoint() }], rotY: [{ t: 0, v: -90 }] } };
  edit((d) => d.objects.push(o)); select(o.id); toScene();
}
export function addSavedBackground(name: string) {
  const it = LIB.backgrounds.find((c) => c.name === name)?.data; if (!it) return;
  const stage = stageForNew(); let n = 0;
  edit((d) => { for (const src of it.objects) { d.objects.push({ ...JSON.parse(JSON.stringify(src)), id: newId(src.kind), stage }); n++; } });
  toScene(); toast(`Đã thêm bối cảnh "${name}" (${n} thứ).`);
}
export function addCodeObject(name: string) {
  const a = codeAssets().find((x) => x.name === name); if (!a) return;
  const o: SceneObject = { id: newId(a.kind), name: a.label, kind: a.kind, stage: stageForNew(), params: { type: 'code', code: a.name, opts: {} }, tracks: { pos: [{ t: 0, v: a.kind === 'set' ? [0, 0, 0] : framePoint() }] } };
  edit((d) => d.objects.push(o)); select(o.id); toScene();
}

// ---------------------------------------------------------------- left panel: quick add
export function quickList(): HTMLElement {
  const group = (title: string, items: Array<[string, () => void, string?]>, empty: string) => h('div', { class: 'qgroup' }, h('div', { class: 'qtitle' }, title),
    items.length ? h('div', { class: 'qlist' }, ...items.map(([l, f, tip]) => h('div', { class: 'qitem', title: tip || 'Bấm để thêm vào cảnh', onclick: f }, l))) : h('div', { class: 'hint' }, empty));
  return h('div', {},
    group('Nhân vật', LIB.characters.map((c) => [c.data?.name || c.name, () => addSavedCharacter(c.name)]), 'Chưa có.'),
    group('Bối cảnh', LIB.backgrounds.map((c) => [c.data?.name || c.name, () => addSavedBackground(c.name)]), 'Chưa có.'),
    group('VFX', LIB.vfx.map((x) => [vfxHeader(x.code || '').name || x.name, () => addFx({ type: 'code', code: x.name })]), 'Chưa có.'),
    group('Đồ vật và bối cảnh bằng code', codeAssets().map((a) => [a.label + (a.error ? ' (lỗi)' : ''), () => (a.error ? openLibrary({ type: 'code', name: a.name }) : addCodeObject(a.name)), a.error ? 'Code đang lỗi: bấm để sửa' : undefined]), 'Chưa có.'),
    h('button', { class: 'wide', onclick: () => openLibrary() }, 'Quản lý thư viện'));
}

// ---------------------------------------------------------------- workspace "Thư viện"
type Pick = { type: 'characters' | 'backgrounds' | 'code' | 'new' | 'newchar' | 'vfx' | 'newvfx'; name?: string };
let picked: Pick | null = null, libRoot: HTMLElement | null = null, stopPreview: (() => void) | null = null;
export function pickItem(p: Pick) { picked = p; }
export function openLibrary(p?: Pick) { if (p) picked = p; S.ws = 'library'; emit('ws'); }
export async function libraryPanel(root: HTMLElement) {
  libRoot = root; await loadLibrary(); renderLib();
}
export function refreshLibraryPanel() { if (libRoot && S.ws === 'library') renderLib(); }
function renderLib() {
  const root = libRoot!; stopPreview?.(); stopPreview = null;
  const sel = selObj();
  const item = (p: Pick, label: string, sub = '') => h('div', { class: 'litem' + (picked?.type === p.type && picked?.name === p.name ? ' on' : ''), onclick: () => { picked = p; renderLib(); } }, h('div', {}, label), sub ? h('div', { class: 'hint' }, sub) : null);
  const list = h('div', { class: 'lcol' },
    h('div', { class: 'lactions top' }, h('button', { class: 'primary', onclick: () => { picked = { type: 'newchar' }; renderLib(); } }, 'Tạo nhân vật mới')),
    h('div', { class: 'lgroup' }, 'Nhân vật'), ...LIB.characters.map((c) => item({ type: 'characters', name: c.name }, c.data?.name || c.name, c.data?.params?.build ? `dáng ${c.data.params.build}` : '')),
    !LIB.characters.length ? h('div', { class: 'hint pad' }, 'Chưa có. Chọn một nhân vật trong cảnh rồi bấm "Lưu nhân vật đang chọn".') : null,
    h('div', { class: 'lgroup' }, 'Bối cảnh'), ...LIB.backgrounds.map((c) => item({ type: 'backgrounds', name: c.name }, c.data?.name || c.name, `${c.data?.objects?.length || 0} thứ`)),
    !LIB.backgrounds.length ? h('div', { class: 'hint pad' }, 'Chưa có. Dựng một phòng rồi bấm "Lưu bối cảnh hiện tại".') : null,
    h('div', { class: 'lgroup' }, 'VFX (hiệu ứng bằng code)'), ...LIB.vfx.map((x) => item({ type: 'vfx', name: x.name }, vfxHeader(x.code || '').name || x.name, FX_AT_VI[vfxHeader(x.code || '').at] + ', ' + vfxHeader(x.code || '').dur + ' giây')),
    h('div', { class: 'lgroup' }, 'Làm bằng code'), ...codeAssets().map((a) => item({ type: 'code', name: a.name }, a.label, (a.kind === 'set' ? 'bối cảnh' : 'đồ vật') + (a.error ? ', đang lỗi' : ''))),
    h('div', { class: 'lactions' },
      h('button', { class: 'primary', onclick: () => { picked = { type: 'new' }; renderLib(); } }, 'Tạo mới bằng code'),
      h('button', { onclick: () => { picked = { type: 'newvfx' }; renderLib(); } }, 'Tạo VFX mới'),
      h('button', { disabled: sel?.kind !== 'char', title: sel?.kind === 'char' ? '' : 'Chọn một nhân vật trong cảnh trước', onclick: () => sel && saveCharacter(sel) }, sel?.kind === 'char' ? `Lưu nhân vật "${sel.name}"` : 'Lưu nhân vật đang chọn'),
      h('button', { onclick: () => saveBackground(stageForNew()) }, 'Lưu bối cảnh hiện tại')));
  const detail = h('div', { class: 'ldetail' });
  if (!picked) detail.append(h('div', { class: 'wshead' }, h('h1', {}, 'Thư viện'), h('p', { class: 'hint' }, 'Nhân vật, bối cảnh và đồ vật dùng chung cho mọi project. Chọn một mục bên trái để xem, thêm vào cảnh hoặc sửa. Đồ vật mới thì bấm "Tạo mới bằng code": nhờ AI viết code, thử, rồi lưu.')));
  else if (picked.type === 'code' || picked.type === 'new') codeEditor(detail, picked.type === 'code' ? picked.name : undefined);
  else if (picked.type === 'vfx' || picked.type === 'newvfx') stopPreview = vfxEditor(detail, picked.type === 'vfx' ? picked.name : undefined, (n) => { picked = { type: 'vfx', name: n }; renderLib(); }, (n) => removeItem('vfx', n));
  else if (picked.type === 'newchar' || picked.type === 'characters') {
    characterCreator(detail, picked.type === 'characters' ? picked.name : undefined); stopPreview = stopCreator;
    if (picked.type === 'characters') { const n = picked.name!; detail.querySelector('.ccside')?.append(h('button', { class: 'danger', onclick: () => removeItem('characters', n) }, 'Xoá khỏi thư viện')); }
  } else {
    const it = LIB.backgrounds.find((x) => x.name === picked!.name);
    if (it) {
      const isChar = false, p = it.data?.params || {};
      detail.append(h('div', { class: 'wshead' }, h('h1', {}, it.data?.name || it.name), h('p', { class: 'hint' }, it.file)),
        isChar ? h('dl', { class: 'facts' }, ...[['Kiểu tóc', p.style], ['Vóc dáng', p.build], ['Trang phục', p.outfit], ['Màu áo', p.shirt], ['Phụ kiện', (p.acc || []).join(', ') || 'không'], ['Chỉnh riêng', Object.keys(it.data?.tracks || {}).length + ' thông số']].flatMap(([a, b]) => [h('dt', {}, a), h('dd', {}, String(b ?? 'mặc định'))]))
          : h('dl', { class: 'facts' }, h('dt', {}, 'Gồm'), h('dd', {}, (it.data?.objects || []).map((o: any) => o.name).join(', ')), h('dt', {}, 'Không khí'), h('dd', {}, it.data?.mood || 'day')),
        h('div', { class: 'row' },
          h('button', { class: 'primary', onclick: () => (isChar ? addSavedCharacter(it.name) : addSavedBackground(it.name)) }, 'Thêm vào cảnh'),
          h('button', { class: 'danger', onclick: () => removeItem(picked!.type as any, it.name) }, 'Xoá khỏi thư viện')));
    }
  }
  root.replaceChildren(h('div', { class: 'libws' }, list, detail));
}
async function removeItem(type: 'characters' | 'backgrounds' | 'code' | 'vfx', name: string) {
  const ok = await ask(`Xoá "${name}" khỏi thư viện? File được chuyển vào Library/Removed; những gì đã đặt trong các project vẫn giữ. Gõ "ok" để xoá.`);
  if (ok?.toLowerCase() !== 'ok') return;
  await removeFromLibrary(type, name); picked = null; await loadLibrary(); renderLib();
}

// ---------------------------------------------------------------- code editor (inline)
const EXAMPLE = `// name: Máy pha cà phê
// kind: prop
// Đồ vật đứng trên sàn (y = 0), mặt trước hướng +z, đơn vị mét (nhân vật cao khoảng 1.2 m).
export default function build({ THREE, box, flat, labelTex }, opts) {
  const g = new THREE.Group();
  const body = flat(opts.color ?? 0x2b2f3a, 0.5), steel = flat(0xd9dde4, 0.25);
  g.add(box(0.36, 0.42, 0.3, body, 0, 0.21, 0, 0.03));          // thân máy
  g.add(box(0.3, 0.06, 0.26, steel, 0, 0.45, 0, 0.02));          // nắp
  g.add(box(0.14, 0.04, 0.12, steel, 0, 0.03, 0.12, 0.01));      // khay
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.07, 16), flat(0xffffff, 0.4));
  cup.position.set(0, 0.085, 0.12); cup.castShadow = true; g.add(cup);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.08), new THREE.MeshBasicMaterial({ map: labelTex(['COFFEE'], { bg: '#c9781a', fg: '#fff', border: false }) }));
  label.position.set(0, 0.3, 0.151); g.add(label);
  return g;
}
`;
function promptFor(desc: string, kind: string, name: string) {
  return `Viết code JavaScript tạo một ${kind === 'set' ? 'BỐI CẢNH (cả một không gian: sàn, tường, đồ đạc)' : 'ĐỒ VẬT'} cho 2D Studio (three.js 0.187, phong cách hoạt hình phẳng, màu tươi, khối đơn giản bo tròn nhẹ).
Mô tả: ${desc || '(tự nghĩ)'}

Quy tắc:
- Trả lời đúng MỘT khối code. Dòng đầu: "// name: ${name || 'Tên'}" và "// kind: ${kind}".
- export default function build(lib, opts) { ... return group; }. KHÔNG import gì; mọi thứ lấy từ lib:
  lib.THREE; lib.box(w, h, d, material, x, y, z, bo_góc?) (luôn truyền đủ x, y, z; đã bật đổ bóng);
  lib.flat(màu, độ_nhám=0.85) vật liệu mờ; lib.paint(màu) sơn bóng; lib.labelTex(['DÒNG 1','DÒNG 2'], { bg, fg, border:false }) texture chữ;
  lib.canvas(w,h) + lib.ctex(canvas) để tự vẽ texture; lib.rng(seed) số ngẫu nhiên; lib.M.chrome / M.glass / M.dark; lib.P (đồ có sẵn: P.desk(), P.chair(), P.plant(), P.sign(text, opts)...).
- Đơn vị mét, đứng trên y = 0, mặt trước hướng +z, tâm ở x = 0. Nhân vật cao khoảng 1.2 m, đồ nội thất nhỏ hơn đời thật khoảng 0.7 lần.
${kind === 'set' ? '- Bối cảnh: mở về phía +z (camera đứng ở +z nhìn về -z), chừa khoảng trống z từ -0.5 đến -2 cho nhân vật đứng, tường sau khoảng z = -4.' : '- Đồ vật nhỏ gọn, chi tiết vừa phải, ít hơn 80 khối.'}
- opts là tuỳ chọn người dùng (ví dụ opts.color), luôn có giá trị mặc định.

Ví dụ đúng định dạng:
\`\`\`js
${EXAMPLE}\`\`\``;
}
function codeEditor(root: HTMLElement, existing?: string) {
  const a = existing ? codeAssets().find((x) => x.name === existing) : null;
  const code = a ? a.code : EXAMPLE, hd = headerOf(code);
  const nameIn = h('input', { value: a ? a.label : '', placeholder: 'Tên, ví dụ: Máy pha cà phê' }) as HTMLInputElement;
  const kindSel = h('select', {}, h('option', { value: 'prop', selected: hd.kind === 'prop' }, 'Đồ vật'), h('option', { value: 'set', selected: hd.kind === 'set' }, 'Bối cảnh')) as HTMLSelectElement;
  const desc = h('textarea', { rows: 2, placeholder: 'Mô tả cho AI, ví dụ: cây nước nóng lạnh màu xanh có bình nước úp ngược' }) as HTMLTextAreaElement;
  const ta = h('textarea', { class: 'code', rows: 22, spellcheck: false, value: code }) as HTMLTextAreaElement;
  const msg = h('div', { class: 'codemsg' });
  const prev = h('canvas', { class: 'codeprev', width: 420, height: 420 }) as HTMLCanvasElement;
  if (!nameIn.value) nameIn.value = a ? a.label : '';
  // preview: a small renderer of its own, turning slowly
  const R = new THREE.WebGLRenderer({ canvas: prev, antialias: true }); R.setPixelRatio(1); R.setClearColor(0x1d2129);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, 0.01, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.2)); const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(2, 4, 3); scene.add(sun);
  scene.add(new THREE.GridHelper(4, 16, 0x3a4252, 0x2a303b));
  const holder = new THREE.Group(); scene.add(holder);
  let spin = 0, raf = 0;
  const loop = () => { raf = requestAnimationFrame(loop); spin += 0.006; holder.rotation.y = spin; R.render(scene, cam); };
  loop(); stopPreview = () => { cancelAnimationFrame(raf); R.dispose(); };
  async function tryIt() {
    msg.className = 'codemsg'; msg.textContent = 'Đang thử...';
    const c = await compile(ta.value);
    if (c.error) { msg.className = 'codemsg err'; msg.textContent = 'Lỗi: ' + c.error; return null; }
    try {
      const g = tryBuild(c.build!, {}); holder.clear(); holder.add(g);
      const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
      const d = Math.max(size.x, size.y, size.z) * 2.2 + 0.3; cam.position.set(ctr.x + d * 0.6, ctr.y + d * 0.45, ctr.z + d * 0.8); cam.lookAt(ctr);
      msg.textContent = `Chạy được. Kích thước ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m (rộng × cao × sâu).`;
      return c;
    } catch (e: any) { msg.className = 'codemsg err'; msg.textContent = 'Lỗi: ' + e.message; return null; }
  }
  async function keep(andAdd: boolean) {
    if (!(await tryIt())) return;
    const label = nameIn.value.trim() || headerOf(ta.value).name || 'Đồ vật mới';
    let src = ta.value.replace(/^\s*```(?:js|javascript)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
    src = src.replace(/\/\/\s*name:.*\n?/i, '').replace(/\/\/\s*kind:.*\n?/i, '');
    src = `// name: ${label}\n// kind: ${kindSel.value}\n` + src.replace(/^\n+/, '');
    const file = existing || safeName(label);
    await saveLibrary.code(file, src); await loadLibrary();
    picked = { type: 'code', name: file }; toast(`Đã lưu "${label}" vào thư viện.`);
    if (andAdd) addCodeObject(file); else renderLib();
  }
  // ---- AI: describe it, the studio asks Claude for the code, tries it, and sends errors back to be fixed (twice)
  const aiMsg = h('div', { class: 'hint aimsg' });
  const aiBox = h('div', { class: 'aibox' });
  let busy = false;
  const SYSTEM = 'Bạn viết code JavaScript (three.js) tạo đồ vật và bối cảnh cho 2D Studio. Chỉ trả lời đúng một khối code ```js, không giải thích.';
  async function ask(prompt: string) {
    const r = await fetch('/api/ai/text', { method: 'POST', headers: AIH, body: JSON.stringify({ system: SYSTEM, prompt }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Lỗi');
    return codeOf(j.text);
  }
  async function generate(edit: boolean) {
    if (busy) return;
    const want = desc.value.trim(); if (!want) { toast('Viết mô tả trước.'); desc.focus(); return; }
    busy = true; const t0 = Date.now(); const tick = setInterval(() => { aiMsg.textContent = `${aiMsg.dataset.step || 'Đang nhờ Claude viết code'}... ${Math.round((Date.now() - t0) / 1000)} giây`; }, 500);
    const step = (s: string) => { aiMsg.dataset.step = s; };
    try {
      step(edit ? 'Đang nhờ Claude sửa code' : 'Đang nhờ Claude viết code');
      let prompt = edit
        ? `${promptFor(want, kindSel.value, nameIn.value)}\n\nĐây là code hiện tại. Sửa theo mô tả ở trên (giữ những gì không được nhắc tới), trả lại TOÀN BỘ code:\n\`\`\`js\n${ta.value}\n\`\`\``
        : promptFor(want, kindSel.value, nameIn.value);
      for (let attempt = 0; attempt < 3; attempt++) {
        const code = await ask(prompt);
        ta.value = code; const hh = headerOf(code); if (hh.name && !nameIn.value) nameIn.value = hh.name;
        step('Đang thử code');
        const ok = await tryIt();
        if (ok) { aiMsg.dataset.step = ''; clearInterval(tick); aiMsg.textContent = `Xong sau ${Math.round((Date.now() - t0) / 1000)} giây${attempt ? ` (đã tự sửa lỗi ${attempt} lần)` : ''}. Xem bên phải; chưa ưng thì viết thêm yêu cầu rồi bấm "Sửa bằng AI". Ưng thì bấm Lưu.`; return; }
        step(`Code bị lỗi, đang nhờ Claude sửa (lần ${attempt + 1})`);
        prompt = `${promptFor(want, kindSel.value, nameIn.value)}\n\nCode dưới đây bị lỗi khi chạy: ${msg.textContent}\nSửa lỗi và trả lại TOÀN BỘ code:\n\`\`\`js\n${code}\n\`\`\``;
      }
      clearInterval(tick); aiMsg.textContent = 'Claude chưa sửa được lỗi sau 3 lần. Xem lỗi bên phải, sửa tay hoặc viết mô tả rõ hơn.';
    } catch (e: any) {
      clearInterval(tick);
      if (e.message === 'NO_AI') { aiMsg.textContent = ''; renderSetup(); } else aiMsg.textContent = 'Lỗi: ' + e.message;
    } finally { busy = false; clearInterval(tick); }
  }
  const renderSetup = () => renderAiSetup(aiBox);
  renderSetup();
  ta.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); tryIt(); } if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); } });
  ta.addEventListener('change', () => { const hh = headerOf(ta.value); if (hh.name && !nameIn.value) nameIn.value = hh.name; kindSel.value = hh.kind; });
  root.append(
    h('div', { class: 'wshead' }, h('h1', {}, existing ? `Sửa code: ${a?.label}` : 'Tạo mới bằng code'),
      h('p', { class: 'hint' }, 'Mô tả thứ bạn muốn rồi bấm "Tạo bằng AI": studio nhờ Claude viết code, tự chạy thử, tự sửa lỗi, hiện hình bên phải. Ưng thì Lưu vào thư viện. Muốn đổi gì thì viết thêm yêu cầu và bấm "Sửa bằng AI".')),
    h('div', { class: 'codegrid' },
      h('div', { class: 'codeleft' },
        h('div', { class: 'row' }, nameIn, kindSel),
        desc,
        h('div', { class: 'row wrap' },
          h('button', { class: 'primary', onclick: () => generate(false) }, 'Tạo bằng AI'),
          h('button', { onclick: () => generate(true), title: 'Giữ code hiện tại, chỉ sửa theo mô tả' }, 'Sửa bằng AI'),
          h('button', { onclick: () => navigator.clipboard.writeText(promptFor(desc.value, kindSel.value, nameIn.value)).then(() => toast('Đã copy prompt. Dán vào Claude, rồi dán code trả về vào ô code.')) }, 'Copy prompt')),
        aiMsg, aiBox,
        ta),
      h('div', { class: 'coderight' }, prev, msg,
        h('div', { class: 'wbtns' },
          h('button', { onclick: tryIt }, 'Thử (Ctrl+Enter)'),
          h('button', { onclick: () => keep(false) }, 'Lưu vào thư viện'),
          h('button', { class: 'primary', onclick: () => keep(true) }, 'Lưu và thêm vào cảnh'),
          a ? h('button', { class: 'danger', onclick: () => removeItem('code', a.name) }, 'Xoá khỏi thư viện') : null))));
  tryIt();
}
