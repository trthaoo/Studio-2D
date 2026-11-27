// Inspector (bảng bên phải): sửa thứ đang chọn. Nhân vật có các thẻ theo bộ phận: Vị trí, Dáng & tay, Mặt, Tóc,
// Quần áo, Phụ kiện. Mỗi thay đổi áp dụng cho cả video, hoặc tạo keyframe tại playhead (công tắc ở trên cùng).
import { S, on, emit, edit, changed, checkpoint, beginGesture, endGesture, selObj, select, snapT, toast } from '../state';
import { PROPS, propDef, valueAt, applyValue, isAnimated, SceneObject, PropDef, Vec3, ARMS, ARM_VI, EXPRS, EXPR_VI, POSE_VI, JOINTS, JOINT_VI, setValue, activeCut, newId, lookSource, lookParams, lookMismatches, shareLook, LOOK_TRACK } from '../doc';
import { h, fmtTime, KIND_COLOR } from './dom';
import { setTool, refreshToolbar, TAB_NAME, viewedCam, rt } from './viewport';
import { HAIR_STYLES, BUILD_NAMES, OUTFIT_NAMES, ACC_NAMES } from 'engine/chars.js';
import { CAR_TYPES } from 'engine/cars.js';
import { PROPS as PROP_NAMES } from 'engine/props.js';
import { SHOTS, Shot, Move, MOVE_VI, shotKeys, applyShotKeys, shotFromCamera, nextCutAfter } from '../cameraShots';
import { LIB, loadLibrary, saveLibrary, removeFromLibrary, safeName, onLibrary } from '../library';
import { ask } from './dom';
import { LIGHTS, LOOKS, stageMood, sunAngles } from '../lighting';
import { PAINT_DEFAULT } from 'engine/core.js';
import type { Stage } from '../doc';
import { FX, FX_NAMES, FX_AT, FX_AT_VI, FX_DEFAULT_AT } from '../vfx';
import { vfxHeader } from '../library';
import { openLibrary } from './libraryPanel';
import { voiceSection } from './voice';

const insp = document.querySelector('#inspector .body')!;
let sliding = false;   // while a slider is dragged, don't rebuild the panel under the pointer

export const KIND_VI: Record<string, string> = { char: 'Nhân vật', car: 'Xe', prop: 'Đồ vật', set: 'Bối cảnh', camera: 'Camera', lamp: 'Đèn', fx: 'Hiệu ứng' };
const HAIR_VI: Record<string, string> = { mess: 'Rối, có xoáy', bowl: 'Úp tô', side: 'Rẽ lệch', spiky: 'Dựng gai', curly: 'Xoăn', afro: 'Afro', bun: 'Búi tó', ponytail: 'Đuôi ngựa', long: 'Dài', flattop: 'Đầu bằng', buzz: 'Húi cua', bald: 'Hói' };
const BUILD_VI: Record<string, string> = { average: 'Trung bình', slim: 'Gầy', tall: 'Cao', short: 'Thấp', stout: 'Đậm', big: 'To con', kid: 'Trẻ con' };
const OUTFIT_VI: Record<string, string> = { plain: 'Trơn', tee: 'Áo phông', polo: 'Polo', shirt: 'Sơ mi', suit: 'Vest', uniform: 'Đồng phục', hoodie: 'Hoodie', jacket: 'Áo khoác', vest: 'Gi-lê', stripes: 'Kẻ sọc', plaid: 'Ca-rô', overalls: 'Quần yếm', apron: 'Tạp dề', sweater: 'Áo len', cardigan: 'Cardigan', hivis: 'Áo phản quang', tracksuit: 'Đồ thể thao', labcoat: 'Áo blouse', dress: 'Váy' };
const ACC_VI: Record<string, string> = { sunglasses: 'Kính râm', shadesUp: 'Kính trên trán', cap: 'Mũ lưỡi trai', ranger: 'Mũ rộng vành', beanie: 'Mũ len', headset: 'Tai nghe', mustache: 'Ria mép', beard: 'Râu quai nón', bandage: 'Băng dán', blush: 'Má hồng', neckbrace: 'Nẹp cổ' };
const AXIS: Record<string, [string, string, string]> = { pos: ['Trái ↔ Phải', 'Thấp ↔ Cao', 'Sau ↔ Trước'], target: ['Trái ↔ Phải', 'Thấp ↔ Cao', 'Sau ↔ Trước'], look: ['Trước ↔ Sau', 'Xuống ↔ Lên', 'Trái ↔ Phải'] };

const t = () => snapT(S.t);
const replace = (el: Element, ...kids: (Node | string | null | undefined | false)[]) => el.replaceChildren(...(kids.filter((k) => k != null && k !== false) as (Node | string)[]));

// ---------------------------------------------------------------- building blocks
/** ◆ button: shows whether this property is animated / has a key here; click adds or removes the key at the playhead. */
function keyBtn(o: SceneObject, d: PropDef) {
  const keys = o.tracks[d.key] || [], here = keys.find((k) => Math.abs(k.t - t()) < 1 / 120), anim = keys.length > 1;
  return h('button', { class: 'kbtn' + (here && anim ? ' on' : anim ? ' anim' : ''), title: here ? 'Có keyframe tại đây: bấm để xoá' : anim ? 'Đang chuyển động theo keyframe. Bấm để thêm keyframe tại đây' : 'Bấm để tạo keyframe tại đây (bắt đầu làm chuyển động)', onclick: () => edit(() => {
    const ks = (o.tracks[d.key] ||= []);
    if (here && anim) { ks.splice(ks.indexOf(here), 1); } else setValue(o, d.key, t(), valueAt(o, d.key, t()), true);
  }) }, h('span', { class: 'dia' }));
}
function resetBtn(o: SceneObject, keys: string[], title = 'Bỏ chỉnh sửa, về như ban đầu') {
  const any = keys.some((k) => o.tracks[k]?.length);
  return h('button', { class: 'rbtn' + (any ? '' : ' off'), title, onclick: () => edit(() => { for (const k of keys) delete o.tracks[k]; }) }, 'Bỏ');
}
function slider(o: SceneObject, d: PropDef, label = d.label, getV?: () => number, setV?: (v: number) => void, range?: [number, number]) {
  const cur = getV ? getV() : (valueAt(o, d.key, t()) as number);
  const [mn, mx] = range || [d.min ?? cur - 5, d.max ?? cur + 5];
  const put = (v: number) => { if (setV) setV(v); else applyValue(o, d.key, t(), +v.toFixed(4), S.apply); };
  const num = h('input', { type: 'number', class: 'num', step: d.step ?? 0.01, value: +cur.toFixed(3) }) as HTMLInputElement;
  const rng = h('input', { type: 'range', min: Math.min(mn, cur), max: Math.max(mx, cur), step: d.step ?? 0.01, value: cur }) as HTMLInputElement;
  rng.addEventListener('pointerdown', () => { sliding = true; beginGesture(); checkpoint(); });
  rng.addEventListener('input', () => { num.value = String(+(+rng.value).toFixed(3)); put(+rng.value); changed(); });
  rng.addEventListener('change', () => { sliding = false; endGesture(); render(); });
  num.addEventListener('change', () => edit(() => put(+num.value)));
  return h('div', { class: 'srow', title: d.tip || '' }, h('label', {}, label), rng, num, getV ? h('span') : keyBtn(o, d), getV ? h('span') : resetBtn(o, [d.key]));
}
function vecSliders(o: SceneObject, d: PropDef) {
  const v = valueAt(o, d.key, t()) as Vec3, names = AXIS[d.key] || ['x', 'y', 'z'];
  return h('div', { class: 'vgroup' }, h('div', { class: 'vtitle' }, d.label, h('span', { class: 'grow' }), keyBtn(o, d), resetBtn(o, [d.key])),
    ...[0, 1, 2].map((i) => slider(o, { ...d, min: undefined, max: undefined }, names[i], () => (valueAt(o, d.key, t()) as Vec3)[i], (nv) => { const c = [...(valueAt(o, d.key, t()) as Vec3)] as Vec3; c[i] = +nv.toFixed(3); applyValue(o, d.key, t(), c, S.apply); }, [Math.floor(v[i] - (d.key === 'look' ? 1.5 : 4)), Math.ceil(v[i] + (d.key === 'look' ? 1.5 : 4))])));
}
function choice(o: SceneObject, d: PropDef, names: Record<string, string>, cols = 3) {
  const cur = valueAt(o, d.key, t());
  return h('div', { class: 'cgroup' }, h('div', { class: 'vtitle' }, d.label, h('span', { class: 'grow' }), keyBtn(o, d), resetBtn(o, [d.key])),
    h('div', { class: 'cgrid', style: { gridTemplateColumns: `repeat(${cols}, 1fr)` } }, ...(d.options || []).map((op) => h('button', { class: 'cbtn' + (op === cur ? ' on' : ''), onclick: () => edit(() => applyValue(o, d.key, t(), op, S.apply)) }, names[op] || op))));
}
function toggle(o: SceneObject, d: PropDef) {
  return h('div', { class: 'srow' }, h('label', {}, d.label), h('input', { type: 'checkbox', checked: !!valueAt(o, d.key, t()), onchange: (e: any) => edit(() => applyValue(o, d.key, t(), e.target.checked, S.apply)) }), h('span'), keyBtn(o, d), resetBtn(o, [d.key]));
}
function text(o: SceneObject, d: PropDef) {
  const keys = o.tracks[d.key] || [], here = keys.find((k) => Math.abs(k.t - t()) < 1 / 120);
  return h('div', { class: 'cgroup' }, h('div', { class: 'vtitle' }, d.label, h('span', { class: 'grow' }), keyBtn(o, d)),
    h('textarea', { rows: 2, value: here ? String(here.v) : '', placeholder: d.key === 'say' ? `Nhập câu thoại bắt đầu ở ${fmtTime(t())}` : 'Nhập chữ', onchange: (e: any) => edit(() => setValue(o, d.key, t(), e.target.value, true)) }),
    d.tip ? h('div', { class: 'hint' }, d.tip) : null,
    keys.length ? h('div', { class: 'hint' }, `${keys.length} đoạn trên timeline. Bấm đúp vào đoạn trên timeline để sửa chữ.`) : null);
}
function prop(o: SceneObject, key: string) {
  const d = propDef(o.kind, key)!;
  if (d.type === 'vec3') return vecSliders(o, d);
  if (d.type === 'number') return slider(o, d);
  if (d.type === 'bool') return toggle(o, d);
  if (d.type === 'enum') return choice(o, d, key === 'pose' ? POSE_VI : key.startsWith('arm') ? ARM_VI : key === 'expr' ? EXPR_VI : {}, key === 'pose' ? 3 : 3);
  return text(o, d);
}
// build settings (rebuild the object; always the whole video)
const toHex = (v: any) => typeof v === 'number' ? '#' + v.toString(16).padStart(6, '0') : typeof v === 'string' && /^(#|0x)?[0-9a-f]{6}$/i.test(v) ? '#' + v.replace('#', '').replace(/^0x/i, '') : '#888888';
function pColor(o: SceneObject, k: string, label: string) {
  return h('div', { class: 'srow' }, h('label', {}, label), h('input', { type: 'color', value: toHex(o.params[k]), onchange: (e: any) => edit(() => { o.params[k] = e.target.value; }) }), h('span'), h('span'), o.params[k] != null ? h('button', { class: 'rbtn', title: 'Về màu mặc định', onclick: () => edit(() => { delete o.params[k]; }) }, 'Bỏ') : h('span'));
}
function pSelect(o: SceneObject, k: string, label: string, opts: string[], names: Record<string, string> = {}) {
  return h('div', { class: 'srow' }, h('label', {}, label), h('select', { class: 'span2', onchange: (e: any) => edit(() => { if (e.target.value) o.params[k] = e.target.value; else delete o.params[k]; }) }, h('option', { value: '' }, '— mặc định —'), ...opts.map((x) => h('option', { value: x, selected: o.params[k] === x }, names[x] || x))));
}
function pNum(o: SceneObject, k: string, label: string, min: number, max: number, def: number, step = 0.01) {
  const d: PropDef = { key: k, label, type: 'number', def, min, max, step };
  return slider(o, d, label, () => o.params[k] ?? def, (v) => { o.params[k] = +v.toFixed(3); });
}
function pCheck(o: SceneObject, label: string, get: () => boolean, set: (v: boolean) => void) {
  return h('div', { class: 'srow' }, h('label', {}, label), h('input', { type: 'checkbox', checked: get(), onchange: (e: any) => edit(() => set(e.target.checked)) }));
}
const section = (title: string, ...kids: any[]) => h('div', { class: 'sec' }, h('div', { class: 'sectitle' }, title), ...kids);
const note = (s: string) => h('div', { class: 'hint' }, s);

// ---------------------------------------------------------------- character part tabs
const TABS = ['pos', 'pose', 'face', 'hair', 'clothes', 'acc'];
/** Top of a character's panel: who else is this person (other stages), and fixing two looks of one person. */
function personBanner(o: SceneObject, look: SceneObject) {
  const d = S.doc, stageName = (x: SceneObject) => d.stages.find((s) => s.id === x.stage)?.name || x.stage;
  if (look !== o) return h('div', { class: 'person ok' },
    h('div', {}, `Cùng một người với "${look.name}" (${stageName(look)}). Ngoại hình và giọng dùng chung: sửa tóc, áo, mặt ở đây là sửa cho mọi cảnh.`),
    h('div', { class: 'row' }, h('button', { onclick: () => select(look.id) }, `Chọn "${look.name}"`),
      h('button', { onclick: () => edit(() => { const own = { ...o.params }; delete own.same; o.params = { ...lookParams(d, o), ...own }; for (const [k, v] of Object.entries(look.tracks)) if (LOOK_TRACK.test(k) && !o.tracks[k]) o.tracks[k] = JSON.parse(JSON.stringify(v)); delete o.params.same; }) }, 'Tách ra, ngoại hình riêng')));
  const group = lookMismatches(d).find((g) => g.includes(o));
  const others = group ? group.filter((x) => lookSource(d, x).id !== look.id) : [];
  if (!others.length) return null;
  return h('div', { class: 'person warn' },
    h('div', {}, `Ở cảnh khác có ${others.map((x) => `"${x.name}" (${stageName(x)})`).join(', ')} trông như cùng người nhưng ngoại hình khác.`),
    h('div', { class: 'row' },
      h('button', { class: 'primary', onclick: () => edit(() => shareLook([o, ...others.map((x) => lookSource(d, x))].filter((x, i, a) => a.indexOf(x) === i), o)) }, 'Dùng ngoại hình này cho tất cả'),
      ...others.slice(0, 3).map((x) => h('button', { onclick: () => edit(() => shareLook([lookSource(d, x), o])) }, `Lấy ngoại hình của "${x.name}"`))));
}

function charTab(o: SceneObject, tab: string, look: SceneObject = o): any[] {
  const p = o.params;
  if (tab === 'pos') return [
    prop(o, 'pos'), prop(o, 'rotY'), prop(o, 'scale'), prop(o, 'visible'),
    section('Cùng một người', note('Một nhân vật xuất hiện ở nhiều cảnh (sân khấu) là nhiều object. Nối chúng lại để mọi cảnh dùng chung một ngoại hình và giọng.'),
      h('div', { class: 'srow' }, h('label', {}, 'Giống hệt'), h('select', { class: 'span2', onchange: (e: any) => edit(() => { const v = e.target.value; if (v) shareLook([lookSource(S.doc, S.doc.objects.find((x) => x.id === v)!), o]); else { const lp = lookParams(S.doc, o); o.params = { ...lp }; delete o.params.same; } }) },
        h('option', { value: '' }, '— ngoại hình riêng —'),
        ...S.doc.objects.filter((x) => x.kind === 'char' && x.id !== o.id && lookSource(S.doc, x).id !== o.id).map((x) => h('option', { value: x.id, selected: o.params.same === x.id }, `${x.name} (${S.doc.stages.find((s) => s.id === x.stage)?.name || x.stage})`))))),
    section('Trong xe', (() => {
      const cars = S.doc.objects.filter((x) => x.kind === 'car' && x.stage === o.stage);
      return h('div', { class: 'srow' }, h('label', {}, 'Ngồi trong'), h('select', { class: 'span2', onchange: (e: any) => edit(() => { if (e.target.value) { o.parent = e.target.value; o.tracks.pose = [{ t: 0, v: 'drive' }]; o.tracks.pos = [{ t: 0, v: [0, 0, 0] }]; o.tracks.rotY = [{ t: 0, v: 0 }]; } else { delete o.parent; o.tracks.pose = [{ t: 0, v: 'stand' }]; } }) },
        h('option', { value: '' }, '— đứng ngoài —'), ...cars.map((c) => h('option', { value: c.id, selected: o.parent === c.id }, c.name))));
    })()),
  ];
  if (tab === 'pose') {
    const withOff = JOINTS.filter((j) => (o.tracks['j.' + j] || []).length);
    return [
      prop(o, 'pose'), choice(o, propDef('char', 'armL')!, ARM_VI), choice(o, propDef('char', 'armR')!, ARM_VI), prop(o, 'lean'), prop(o, 'walk'), prop(o, 'seat'),
      section('Chỉnh tay chân bằng tay',
        note('Bật công cụ Tạo dáng, rồi kéo các chấm tròn trên nhân vật trong khung hình. Chỉnh ở đây cộng thêm vào tư thế tay đã chọn ở trên.'),
        h('button', { class: 'wide primary', onclick: () => setTool('pose') }, 'Bật công cụ Tạo dáng (R)'),
        ...withOff.map((j) => h('div', { class: 'srow' }, h('label', {}, JOINT_VI[j]), h('span', { class: 'hint span2' }, isAnimated(o, 'j.' + j) ? 'có chuyển động' : 'đã chỉnh'), keyBtn(o, propDef('char', 'j.' + j)!), resetBtn(o, ['j.' + j]))),
        withOff.length ? h('button', { class: 'wide', onclick: () => edit(() => { for (const j of JOINTS) delete o.tracks['j.' + j]; }) }, 'Đặt lại toàn bộ tay chân') : null),
    ];
  }
  if (tab === 'face') return [
    choice(o, propDef('char', 'expr')!, EXPR_VI), prop(o, 'say'), voiceSection(o, section),
    section('Chỉnh mặt', ...['face.x', 'face.y', 'eye.size', 'eye.gap', 'eye.y', 'brow.y', 'mouth.y', 'mouth.size'].map((k) => prop(look, k)),
      h('button', { class: 'wide', onclick: () => edit(() => { for (const k of ['face.x', 'face.y', 'eye.size', 'eye.gap', 'eye.y', 'brow.y', 'mouth.y', 'mouth.size']) delete look.tracks[k]; }) }, 'Đặt lại mặt')),
    section('Kính và da (cả video)', pCheck(look, 'Đeo kính cận', () => !!look.params.glasses, (v) => { if (v) look.params.glasses = true; else delete look.params.glasses; }), pColor(look, 'skin', 'Màu da')),
    prop(o, 'look'),
  ];
  if (tab === 'hair') {
    const HO = p.hairOpts || {}, setHO = (k: string, v: any) => { const n = { ...(p.hairOpts || {}) }; if (v === undefined) delete n[k]; else n[k] = v; if (Object.keys(n).length) p.hairOpts = n; else delete p.hairOpts; };
    const keys = ['hair.x', 'hair.y', 'hair.size', 'hair.vol', 'hair.fringe', 'hair.side', 'hair.part'];
    return [
      section('Kiểu & màu (cả video)',
        h('div', { class: 'cgrid', style: { gridTemplateColumns: 'repeat(3, 1fr)' } }, ...HAIR_STYLES.map((s: string) => h('button', { class: 'cbtn' + ((p.style || 'mess') === s ? ' on' : ''), onclick: () => edit(() => { p.style = s; }) }, HAIR_VI[s] || s))),
        pColor(o, 'hair', 'Màu tóc'), pColor(o, 'hair2', 'Màu sợi tóc')),
      section('Chỉnh hình tóc', ...keys.map((k) => prop(o, k)),
        h('button', { class: 'wide', onclick: () => edit(() => { for (const k of keys) delete o.tracks[k]; }) }, 'Đặt lại hình tóc')),
      section('Chi tiết (cả video)',
        pCheck(o, 'Xoáy tóc (lọn dựng)', () => HO.cowlick ?? (p.style || 'mess') === 'mess', (v) => setHO('cowlick', v)),
        pCheck(o, 'Vẽ sợi tóc', () => HO.strands !== false, (v) => setHO('strands', v ? undefined : false)),
        pCheck(o, 'Búi / đuôi / tóc sau đầu', () => HO.behind !== false, (v) => setHO('behind', v ? undefined : false)),
        pCheck(o, 'Ẩn hẳn tóc', () => HO.hidden === true, (v) => setHO('hidden', v || undefined))),
    ];
  }
  if (tab === 'clothes') return [
    section('Quần áo (cả video)',
      h('div', { class: 'cgrid', style: { gridTemplateColumns: 'repeat(3, 1fr)' } }, ...OUTFIT_NAMES.map((s: string) => h('button', { class: 'cbtn' + (p.outfit === s ? ' on' : ''), onclick: () => edit(() => { p.outfit = s; }) }, OUTFIT_VI[s] || s))),
      pColor(o, 'shirt', 'Màu áo chính'), pColor(o, 'shirt2', 'Màu áo trong'), pColor(o, 'pants', 'Màu quần')),
    section('Dáng người (cả video)', pSelect(o, 'build', 'Vóc dáng', BUILD_NAMES, BUILD_VI),
      pNum(o, 'R', 'Cỡ đầu', 0.15, 0.26, 0.2, 0.005), pNum(o, 'girth', 'Độ béo', 0.7, 1.5, 1), pNum(o, 'torso', 'Dài thân', 0.7, 1.4, 1), pNum(o, 'legs', 'Dài chân', 0.7, 1.4, 1)),
  ];
  if (tab === 'acc') {
    const list: string[] = p.acc || [];
    const has = (a: string) => list.find((x) => x.split(':')[0] === a);
    return [
      section('Đồ đeo (cả video)', ...ACC_NAMES.map((a: string) => {
        const cur = has(a), col = cur?.split(':')[1];
        return h('div', { class: 'srow' }, h('label', {}, ACC_VI[a] || a), h('input', { type: 'checkbox', checked: !!cur, onchange: (e: any) => edit(() => { p.acc = e.target.checked ? [...list, a] : list.filter((x) => x.split(':')[0] !== a); }) }),
          cur && a !== 'neckbrace' && a !== 'blush' && a !== 'bandage' ? h('input', { type: 'color', title: 'Màu', value: col || '#888888', onchange: (e: any) => edit(() => { p.acc = list.map((x) => (x.split(':')[0] === a ? `${a}:${e.target.value}` : x)); }) }) : h('span'));
      })),
      section('Vị trí đồ đeo trên đầu', ...['acc.x', 'acc.y', 'acc.size'].map((k) => prop(o, k))),
    ];
  }
  return [];
}

// ---------------------------------------------------------------- VFX
function fxBody(o: SceneObject): any[] {
  const p = o.params, d = S.doc, chars = d.objects.filter((x) => x.kind === 'char' && x.stage === o.stage);
  const isCode = p.type === 'code', burst = isCode || !!FX[p.type]?.burst;
  const cur = isCode ? 'code:' + p.code : p.type;
  const replay = () => edit(() => {   // hide just before the playhead, show at it: a one-shot effect starts here
    const tt = snapT(S.t), ks = (o.tracks.visible ||= []);
    o.tracks.visible = ks.filter((k) => Math.abs(k.t - tt) > 0.02 && Math.abs(k.t - (tt - 0.02)) > 0.005);
    if (!o.tracks.visible.length) o.tracks.visible.push({ t: 0, v: false });
    o.tracks.visible.push({ t: Math.max(0, tt - 0.02), v: false }, { t: tt, v: true });
    o.tracks.visible.sort((a, b) => a.t - b.t);
  });
  return [
    section('Hiệu ứng (cả video)',
      h('div', { class: 'srow' }, h('label', {}, 'Loại'), h('select', { class: 'span2', onchange: (e: any) => edit(() => { const v = String(e.target.value); if (v.startsWith('code:')) { p.type = 'code'; p.code = v.slice(5); } else { p.type = v; delete p.code; } }) },
        h('optgroup', { label: 'Có sẵn' }, ...FX_NAMES.map((k) => h('option', { value: k, selected: cur === k }, FX[k].label))),
        LIB.vfx.length ? h('optgroup', { label: 'Code VFX (thư viện)' }, ...LIB.vfx.map((x) => h('option', { value: 'code:' + x.name, selected: cur === 'code:' + x.name }, vfxHeader(x.code || '').name || x.name))) : null)),
      note(isCode ? 'Code VFX: chạy từ lúc Hiện, trong số giây ghi ở đầu file (hoặc lặp lại).' : FX[p.type]?.tip || ''),
      h('div', { class: 'srow' }, h('label', {}, 'Bám theo'), h('select', { class: 'span2', onchange: (e: any) => edit(() => { if (e.target.value) { p.follow = e.target.value; p.at ||= FX_DEFAULT_AT[p.type] || 'feet'; o.tracks.pos = [{ t: 0, v: [0, 0, 0] }]; } else delete p.follow; }) },
        h('option', { value: '', selected: !p.follow }, 'Không (đứng yên trong cảnh)'), ...chars.map((c) => h('option', { value: c.id, selected: p.follow === c.id }, c.name)))),
      p.follow ? h('div', { class: 'srow' }, h('label', {}, 'Ở chỗ'), h('select', { class: 'span2', onchange: (e: any) => edit(() => { p.at = e.target.value; }) }, ...FX_AT.map((a) => h('option', { value: a, selected: (p.at || 'feet') === a }, FX_AT_VI[a])))) : null,
      p.follow ? note('Vị trí ở trên giờ là độ lệch so với chỗ bám (trục Sau ↔ Trước = phía nhân vật nhìn).') : null,
      !isCode ? pColor(o, 'color', 'Màu') : null,
      !isCode ? pNum(o, 'size', 'Độ toả', 0.3, 3, 1) : h('div', { class: 'srow' }, h('label', {}, 'Lặp lại'), h('input', { type: 'checkbox', checked: !!p.loop, onchange: (e: any) => edit(() => { if (e.target.checked) p.loop = true; else delete p.loop; }) })),
      h('div', { class: 'srow' }, h('label', {}, 'Biến thể'), h('span', { class: 'hint' }, String(p.seed ?? 1)), h('button', { class: 'rbtn', onclick: () => edit(() => { p.seed = ((p.seed ?? 1) % 997) + 1 + Math.floor(Math.random() * 50); }) }, 'Khác'), h('span')),
      burst ? h('button', { class: 'wide primary', onclick: replay }, `Bắt đầu hiệu ứng tại ${fmtTime(S.t, d.fps)}`) : null,
      isCode ? h('button', { class: 'wide', onclick: () => openLibrary({ type: 'vfx', name: p.code }) }, 'Sửa code VFX...') : null),
  ];
}

// ---------------------------------------------------------------- other kinds
/** A set's pieces (floor, walls, window, shelf, desk...): pick one, then move, turn, resize, recolour or hide it. */
function piecesSection(o: SceneObject) {
  const parts = rt.partsOf(o.id), E: Record<string, any> = o.params.parts || {};
  const i = S.setPart, pc = parts[i], e = E[i] || {};
  const put = (patch: Record<string, any>) => { const n = { ...(o.params.parts?.[i] || {}), ...patch }; for (const k of Object.keys(n)) if (n[k] == null) delete n[k]; const all = { ...(o.params.parts || {}) }; if (Object.keys(n).length) all[i] = n; else delete all[i]; if (Object.keys(all).length) o.params.parts = all; else delete o.params.parts; };
  const num = (label: string, get: () => number, setV: (v: number) => void, mn: number, mx: number, step = 0.01) => slider(o, { key: 'part', label, type: 'number', def: 0, min: mn, max: mx, step }, label, get, setV);
  const edited = Object.keys(E).map(Number).filter((k) => parts[k]);
  const pick = (k: number) => { S.setPart = k; emit('select'); render(); };
  return [
    section(pc ? `Đồ vật: ${pc.name}` : 'Đồ vật trong bối cảnh',
      pc ? null : note('Bấm vào một thứ trong bối cảnh (kệ, cửa sổ, tường, bàn...) ở khung hình để chỉnh riêng nó, hoặc chọn trong danh sách. Dùng công cụ Di chuyển (W) để kéo nó.'),
      h('div', { class: 'srow' }, h('label', {}, 'Chọn'), h('select', { class: 'span2', onchange: (ev: any) => pick(+ev.target.value) },
        h('option', { value: -1, selected: i < 0 }, '— cả bối cảnh —'), ...parts.map((p, k) => h('option', { value: k, selected: k === i }, p.name + (E[k] ? ' (đã chỉnh)' : ''))))),
      ...(pc ? [
        num('Sang trái/phải', () => e.pos?.[0] ?? 0, (v) => put({ pos: [+v.toFixed(3), e.pos?.[1] ?? 0, e.pos?.[2] ?? 0] }), -4, 4),
        num('Lên/xuống', () => e.pos?.[1] ?? 0, (v) => put({ pos: [e.pos?.[0] ?? 0, +v.toFixed(3), e.pos?.[2] ?? 0] }), -3, 3),
        num('Ra trước/sau', () => e.pos?.[2] ?? 0, (v) => put({ pos: [e.pos?.[0] ?? 0, e.pos?.[1] ?? 0, +v.toFixed(3)] }), -4, 4),
        num('Xoay (°)', () => e.rotY ?? 0, (v) => put({ rotY: Math.round(v) }), -180, 180, 1),
        num('Kích thước', () => e.scale ?? 1, (v) => put({ scale: +v.toFixed(3) }), 0.2, 3),
        h('div', { class: 'srow' }, h('label', {}, 'Màu'), h('input', { type: 'color', value: e.color || '#888888', onchange: (ev: any) => edit(() => put({ color: ev.target.value })) }), h('span'), h('span'), e.color ? h('button', { class: 'rbtn', onclick: () => edit(() => put({ color: undefined })) }, 'Bỏ') : h('span')),
        pCheck(o, 'Ẩn đồ vật này', () => !!e.hidden, (v) => put({ hidden: v || undefined })),
        h('div', { class: 'row' }, h('button', { onclick: () => edit(() => put({ pos: undefined, rotY: undefined, scale: undefined, color: undefined, hidden: undefined })) }, 'Về như ban đầu'), h('button', { onclick: () => pick(-1) }, 'Chọn cả bối cảnh')),
      ] : []),
      edited.length ? note(`Đã chỉnh: ${edited.map((k) => parts[k].name).join(', ')}. Áp dụng cho cả video.`) : null),
  ];
}

function otherBody(o: SceneObject): any[] {
  const keys = PROPS[o.kind].map((d) => d.key);
  const out: any[] = o.kind === 'set' ? piecesSection(o) : [];
  out.push(...keys.map((k) => prop(o, k)));
  const p = o.params;
  if (o.kind === 'car') out.push(section('Kiểu xe (cả video)', pSelect(o, 'type', 'Dáng xe', Object.keys(CAR_TYPES)), pColor(o, 'color', 'Màu sơn'), pSelect(o, 'interior', 'Nội thất', ['modern', 'old'], { modern: 'Hiện đại', old: 'Cổ' })));
  if (o.kind === 'prop') out.push(section('Đồ vật (cả video)', pSelect(o, 'type', 'Loại', PROP_NAMES)));
  if (o.kind === 'set' && p.type === 'room') out.push(section('Phòng (cả video)', h('div', { class: 'cgrid', style: { gridTemplateColumns: 'repeat(3, 1fr)' } }, ...['office', 'kitchen', 'living', 'shop', 'empty'].map((k) => h('button', { class: 'cbtn' + (p.opts?.kind === k ? ' on' : ''), onclick: () => edit(() => { p.opts = { ...(p.opts || {}), kind: k }; }) }, ({ office: 'Văn phòng', kitchen: 'Bếp', living: 'Phòng khách', shop: 'Cửa hàng', empty: 'Trống' } as any)[k])))));
  if (o.kind === 'lamp') out.push(section('Đèn (cả video)', pColor(o, 'color', 'Màu đèn')));
  if (o.kind === 'fx') out.push(...fxBody(o));
  if (o.kind === 'camera') out.push(h('button', { class: 'wide', onclick: () => { S.ws = 'camera'; emit('ws'); } }, 'Mở tab Camera để chỉnh góc máy'));
  return out;
}

// ---------------------------------------------------------------- the panel
function applyBar() {
  return h('div', { class: 'applybar' },
    h('div', { class: 'applytitle' }, 'Khi sửa, áp dụng cho:'),
    h('div', { class: 'seg' },
      h('button', { class: S.apply === 'all' ? 'on' : '', onclick: () => { S.apply = 'all'; S.autoKey = false; emit('select'); refreshToolbar(); } }, 'Cả video'),
      h('button', { class: S.apply === 'key' ? 'on' : '', onclick: () => { S.apply = 'key'; S.autoKey = true; emit('select'); refreshToolbar(); } }, `Từ ${fmtTime(S.t, S.doc.fps)} (keyframe)`)),
    h('div', { class: 'hint' }, S.apply === 'all' ? 'Sửa một lần, đúng cho toàn bộ video. Thứ đang chuyển động sẽ dịch cả đường đi.' : 'Tạo keyframe ở thời điểm đang đứng: nhân vật chuyển dần từ keyframe trước sang giá trị mới. Dùng để sửa lỗi ở một đoạn.'));
}
// ---------------------------------------------------------------- Camera workspace
// Shot library: pick a character, pick a shot (built in, or saved by you in Library/cameras), and the camera is placed
// and moved for you from the playhead to the next cut. Any camera you set up by hand can be saved as a shot, relative
// to the character, and reused in every video.
const SH = { pick: 'Cận mặt (người nói)', a: '', b: '', move: '' as '' | Move, dur: 0 };
function allShots(): Shot[] { return [...SHOTS, ...LIB.cameras.filter((c) => c.data).map((c) => ({ ...c.data, saved: c.name }))]; }
function shotLibrary(cur: SceneObject | null, cutHere: (id: string) => void) {
  const d = S.doc, chars = d.objects.filter((o) => o.kind === 'char');
  if (!chars.length) return section('Kho góc máy', note('Thêm nhân vật vào cảnh để đặt camera theo nhân vật.'));
  const selC = selObj()?.kind === 'char' ? selObj()!.id : '';
  if (!chars.some((c) => c.id === SH.a)) SH.a = selC || chars[0].id;
  if (SH.b && !chars.some((c) => c.id === SH.b) || SH.b === SH.a) SH.b = chars.find((c) => c.id !== SH.a)?.id || '';
  const shots = allShots(), shot = shots.find((s) => (s.saved || s.name) === SH.pick) || shots[2];
  const A = chars.find((c) => c.id === SH.a)!, B = chars.find((c) => c.id === SH.b) || null;
  const t0 = snapT(S.t), t1 = SH.dur > 0 ? Math.min(d.duration, t0 + SH.dur) : nextCutAfter(d, t0);
  const use = (): Shot => ({ ...shot, ...(SH.move ? { move: SH.move as Move } : {}) });
  const needB = !!shot.two && !B;
  // where the scene is filmed from: the camera on screen now, else the first camera of that stage
  const hintCam = cur || d.objects.find((o) => o.kind === 'camera' && o.stage === A.stage) || null;
  const build = (cam: SceneObject) => {
    const ks = shotKeys(use(), A, B, t0, t1, hintCam ? valueAt(hintCam, 'pos', t0) as Vec3 : undefined, (f, to) => rt.obstacle(A.stage, f, to));
    applyShotKeys(cam, ks, t0, t1);
  };
  const applyTo = () => { if (!cur) return; edit(() => build(cur)); toast(`Đã đặt ${cur.name}: ${shot.name}, từ ${fmtTime(t0, d.fps)} đến ${fmtTime(t1, d.fps)}.`); };
  const newCam = () => {
    const o: SceneObject = { id: newId('cam'), name: `${shot.name} - ${A.name}`, kind: 'camera', stage: A.stage, params: {}, tracks: {} };
    build(o); edit((dd) => dd.objects.push(o)); cutHere(o.id); select(o.id);
    toast(`Đã tạo camera "${o.name}" và cắt sang nó tại ${fmtTime(t0, d.fps)}.`);
  };
  const saveCur = async () => {
    if (!cur) return;
    const n = await ask('Tên góc máy để lưu vào kho (dùng lại cho mọi video)', `${cur.name}`); if (!n) return;
    const data = shotFromCamera(cur, A, S.t, n, (SH.move || 'none') as Move, SH.move === 'push' ? 6 : undefined);
    await saveLibrary.camera(safeName(n), data); await loadLibrary(); SH.pick = safeName(n); render();
    toast(`Đã lưu góc máy "${n}" vào Library/cameras.`);
  };
  const charSel = (val: string, set: (v: string) => void, none?: string) => h('select', { class: 'span2', onchange: (e: any) => { set(e.target.value); render(); } },
    ...(none ? [h('option', { value: '', selected: !val }, none)] : []), ...chars.map((c) => h('option', { value: c.id, selected: c.id === val }, c.name)));
  return section('Kho góc máy',
    note('Chọn nhân vật và kiểu góc máy: camera tự đặt đúng khoảng cách, độ cao, chuyển động, từ playhead đến lần cắt cảnh tiếp theo.'),
    h('div', { class: 'srow' }, h('label', {}, 'Nhân vật chính'), charSel(SH.a, (v) => { SH.a = v; })),
    shot.two ? h('div', { class: 'srow' }, h('label', {}, shot.two === 'ots' ? 'Qua vai của' : 'Cùng với'), charSel(SH.b, (v) => { SH.b = v; }, '— chọn —')) : null,
    h('div', { class: 'shotgrid' }, ...shots.map((s) => h('button', { class: 'shotbtn' + (s === shot ? ' on' : '') + (s.saved ? ' mine' : ''), title: s.tip || (s.saved ? 'Góc máy bạn đã lưu' : ''), onclick: () => { SH.pick = s.saved || s.name; render(); } }, s.name))),
    shot.tip ? note(shot.tip) : null,
    h('div', { class: 'srow' }, h('label', {}, 'Chuyển động'), h('select', { class: 'span2', onchange: (e: any) => { SH.move = e.target.value; render(); } },
      h('option', { value: '', selected: !SH.move }, `Theo mẫu (${MOVE_VI[shot.move || 'none']})`), ...(Object.keys(MOVE_VI) as Move[]).map((m) => h('option', { value: m, selected: SH.move === m }, MOVE_VI[m])))),
    h('div', { class: 'srow' }, h('label', {}, 'Độ dài'), h('select', { class: 'span2', onchange: (e: any) => { SH.dur = +e.target.value; render(); } },
      ...[[0, 'Đến lần cắt tiếp theo'], [1.5, '1,5 giây'], [3, '3 giây'], [5, '5 giây'], [10, '10 giây']].map(([v, l]) => h('option', { value: v, selected: SH.dur === v }, l as string)))),
    needB ? note('Góc này cần hai nhân vật: chọn người thứ hai ở trên.') : null,
    h('div', { class: 'row wrap' },
      h('button', { class: 'primary', disabled: needB, onclick: newCam }, `Camera mới, cắt tại ${fmtTime(t0, d.fps)}`),
      cur ? h('button', { disabled: needB, onclick: applyTo }, `Áp vào ${cur.name}`) : null),
    h('div', { class: 'row wrap' },
      cur ? h('button', { onclick: saveCur, title: 'Lưu vị trí camera đang chọn (so với nhân vật chính) thành một góc máy trong kho' }, 'Lưu góc hiện tại vào kho') : null,
      shot.saved ? h('button', { class: 'danger', onclick: async () => { await removeFromLibrary('cameras', shot.saved!); await loadLibrary(); SH.pick = SHOTS[2].name; render(); } }, 'Xoá khỏi kho') : null));
}
function cameraPanel(): any[] {
  const d = S.doc, cams = d.objects.filter((o) => o.kind === 'camera'), cur = viewedCam(), atT = activeCut(d, S.t).cur?.camera;
  const addCam = () => {
    const src = cur, n = cams.length + 1;
    const o: SceneObject = { id: newId('cam'), name: `Camera ${n}`, kind: 'camera', stage: src?.stage || d.stages[0].id, params: {}, tracks: src ? { pos: [{ t: 0, v: valueAt(src, 'pos', S.t) }], target: [{ t: 0, v: valueAt(src, 'target', S.t) }], fov: [{ t: 0, v: valueAt(src, 'fov', S.t) }] } : {} };
    edit((dd) => dd.objects.push(o)); select(o.id);
  };
  const cutHere = (camId: string) => edit((dd) => { const tt = snapT(S.t); const c = dd.cuts.find((q) => Math.abs(q.t - tt) < 1e-3); if (c) c.camera = camId; else dd.cuts.push({ t: tt, camera: camId }); dd.cuts.sort((a, b) => a.t - b.t); });
  return [
    h('div', { class: 'ihead' }, h('b', {}, 'Camera')),
    applyBar(),
    shotLibrary(cur, cutHere),
    section('Các camera',
      ...cams.map((c) => h('div', { class: 'camrow' + (cur?.id === c.id ? ' on' : ''), onclick: () => select(c.id) }, h('span', { class: 'nm' }, c.name), atT === c.id ? h('span', { class: 'badge' }, 'đang quay') : null)),
      h('div', { class: 'row' }, h('button', { onclick: addCam }, 'Thêm camera ở góc này'), cur ? h('button', { class: 'danger', onclick: () => edit((dd) => { dd.objects = dd.objects.filter((x) => x.id !== cur.id); dd.cuts = dd.cuts.filter((q) => q.camera !== cur.id); }) }, 'Xoá camera này') : null)),
    cur ? section(`Góc máy: ${cur.name}`,
      h('input', { class: 'name', value: cur.name, onchange: (e: any) => edit(() => { cur.name = e.target.value || cur.name; }) }),
      ...['pos', 'target', 'fov', 'roll', 'dof'].map((k) => prop(cur, k)),
      h('button', { class: 'wide primary', onclick: () => cutHere(cur.id) }, `Cắt sang ${cur.name} tại ${fmtTime(S.t, d.fps)}`)) : null,
    section('Cắt cảnh',
      note('Thứ tự camera theo thời gian. Kéo các mốc trên hàng "Cắt cảnh" của timeline để dời.'),
      ...d.cuts.map((c, i) => h('div', { class: 'cutrow' },
        h('input', { type: 'number', class: 'num', step: 0.05, value: c.t, disabled: i === 0, onchange: (e: any) => edit((dd) => { dd.cuts[i].t = Math.max(0, +e.target.value); dd.cuts.sort((a, b) => a.t - b.t); }) }),
        h('select', { onchange: (e: any) => edit((dd) => { dd.cuts[i].camera = e.target.value; }) }, ...cams.map((cm) => h('option', { value: cm.id, selected: cm.id === c.camera }, cm.name))),
        i === 0 ? h('span', { class: 'hint' }, 'mở đầu') : h('select', { onchange: (e: any) => edit((dd) => { const f = +e.target.value; if (f) dd.cuts[i].dissolve = f; else delete dd.cuts[i].dissolve; }) }, ...[[0, 'Cắt thẳng'], [6, 'Mờ nhanh'], [9, 'Mờ vừa'], [12, 'Mờ chậm']].map(([f, l]) => h('option', { value: f, selected: (c.dissolve || 0) === f }, l as string))),
        i === 0 ? h('span') : h('button', { class: 'rbtn', title: 'Xoá mốc cắt này', onclick: () => edit((dd) => { dd.cuts.splice(i, 1); }) }, 'Xoá')))),
  ];
}
function sidePanel(): any[] {
  if (S.ws === 'script') return [h('div', { class: 'ihead' }, h('b', {}, 'Kịch bản')), note('Viết kịch bản ở giữa, rồi bấm Dựng. Bản nháp xếp sẵn nhân vật, camera, nhép miệng và phụ đề; mọi thứ sửa được ở tab Dựng cảnh.'), note('Mẹo: đặt tên nhân vật trong kịch bản trùng tên nhân vật đã lưu trong thư viện thì studio tự chọn đúng người đó.')];
  if (S.ws === 'library') return [h('div', { class: 'ihead' }, h('b', {}, 'Thư viện')), note('Thư viện nằm trong thư mục Library, dùng chung cho mọi project. Xoá thì file được chuyển sang Library/Removed.')];
  return [h('div', { class: 'ihead' }, h('b', {}, 'Xuất video')), note(`Video: ${fmtTime(S.doc.duration, S.doc.fps)}, ${S.doc.objects.filter((o) => o.kind === 'char').length} nhân vật, ${S.doc.cuts.length} cảnh quay, ${S.doc.audio.length} âm thanh.`), note('Xuất bản nháp một đoạn ngắn trước để kiểm tra, rồi mới xuất cả video.')];
}

export function render() {
  if (sliding) return;
  if (S.ws === 'camera') { replace(insp, ...cameraPanel()); return; }
  if (S.ws === 'script' || S.ws === 'library' || S.ws === 'export') { replace(insp, ...sidePanel()); return; }
  const o = selObj();
  if (!o) { replace(insp, ...projectPanel()); return; }
  const head = h('div', { class: 'ihead' }, h('span', { class: 'kdot', style: { background: KIND_COLOR[o.kind] } }), h('input', { class: 'name', value: o.name, onchange: (e: any) => edit(() => { o.name = e.target.value || o.name; }) }), h('span', { class: 'kind' }, KIND_VI[o.kind]));
  if (o.kind === 'char') {
    if (!TABS.includes(S.tab)) S.tab = 'pos';
    // the same person in another stage: hair, clothes, accessories, face fixes and voice are edited on the shared look
    const look = lookSource(S.doc, o);
    replace(insp, head, applyBar(), personBanner(o, look),
      h('div', { class: 'tabs' }, ...TABS.map((tb) => h('button', { class: 'tab' + (S.tab === tb ? ' on' : ''), onclick: () => { S.tab = tb; render(); emit('select'); } }, TAB_NAME[tb]))),
      h('div', { class: 'tabbody' }, ...charTab(['hair', 'clothes', 'acc'].includes(S.tab) ? look : o, S.tab, look)));
  } else replace(insp, head, applyBar(), h('div', { class: 'tabbody' }, ...otherBody(o)));
}

// ---------------------------------------------------------------- lighting and picture style (per stage)
function liveSlider(label: string, get: () => number, set: (v: number) => void, min: number, max: number, step = 0.01, tip = '') {
  const cur = get();
  const num = h('input', { type: 'number', class: 'num', step, value: +cur.toFixed(3) }) as HTMLInputElement;
  const rng = h('input', { type: 'range', min: Math.min(min, cur), max: Math.max(max, cur), step, value: cur }) as HTMLInputElement;
  rng.addEventListener('pointerdown', () => { sliding = true; beginGesture(); checkpoint(); });
  rng.addEventListener('input', () => { num.value = String(+(+rng.value).toFixed(3)); set(+rng.value); changed(); });
  rng.addEventListener('change', () => { sliding = false; endGesture(); render(); });
  num.addEventListener('change', () => edit(() => set(+num.value)));
  return h('div', { class: 'srow', title: tip }, h('label', {}, label), rng, num, h('span'), h('span'));
}
const toHexStr = (v: any) => '#' + (typeof v === 'number' ? v.toString(16).padStart(6, '0') : String(v).replace('#', '')).slice(-6);
function colorRow(label: string, get: () => any, set: (v: string) => void) {
  return h('div', { class: 'srow' }, h('label', {}, label), h('input', { type: 'color', value: toHexStr(get()), onchange: (e: any) => edit(() => set(e.target.value)) }), h('span'), h('span'), h('span'));
}
const MOOD_NAMES: Array<[string, string]> = [['day', 'Ban ngày'], ['dusk', 'Hoàng hôn'], ['night', 'Ban đêm'], ['rain', 'Trời mưa']];
function lightPanel(st: Stage, named: boolean) {
  const m = stageMood(st), sa = sunAngles(m.sunDir), P = { ...PAINT_DEFAULT, ...m.paint };
  const L = () => (st.light ||= {}), Pt = () => (st.paint ||= {});
  const grid = (items: Array<[string, string, string]>, cur: string, pick: (k: string) => void) => h('div', { class: 'shotgrid' },
    ...items.map(([k, label, tip]) => h('button', { class: 'shotbtn' + (cur === k ? ' on' : ''), title: tip, onclick: () => edit(() => pick(k)) }, label)));
  const saved = LIB.looks.filter((x) => x.data);
  const saveLook = async () => {
    const n = await ask('Tên kiểu ánh sáng và hình ảnh để lưu vào kho', st.lightPreset ? LIGHTS[st.lightPreset]?.label : 'Ánh sáng của tôi'); if (!n) return;
    const data = { name: n, mood: st.mood, lightPreset: st.lightPreset || null, light: st.light || {}, look: st.look || null, paint: st.paint || {} };
    await saveLibrary.look(safeName(n), data); await loadLibrary(); render(); toast(`Đã lưu "${n}" vào Library/looks. Dùng được ở mọi video.`);
  };
  return h('div', {},
    section(named ? `Ánh sáng: ${st.name}` : 'Ánh sáng',
      h('div', { class: 'srow' }, h('label', {}, 'Bầu trời'), h('select', { class: 'span2', onchange: (e: any) => edit(() => { st.mood = e.target.value; }) }, ...MOOD_NAMES.map(([k, l]) => h('option', { value: k, selected: st.mood === k }, l)))),
      grid([['', 'Theo bầu trời', 'Ánh sáng sẵn của bầu trời đã chọn'], ...Object.entries(LIGHTS).map(([k, v]) => [k, v.label, v.tip] as [string, string, string])], st.lightPreset || '',
        (k) => { if (k) { st.lightPreset = k; const b = LIGHTS[k].base; if (b) st.mood = b; } else delete st.lightPreset; delete st.light; }),
      h('div', { class: 'vtitle' }, 'Chỉnh tay'),
      colorRow('Màu nắng', () => m.sun[0], (v) => { L().sun = [v, m.sun[1]]; }),
      liveSlider('Nắng mạnh', () => m.sun[1], (v) => { L().sun = [toHexStr(stageMood(st).sun[0]), +v.toFixed(2)]; }, 0, 6, 0.05),
      liveSlider('Hướng nắng', () => sa.az, (v) => { L().sunAz = Math.round(v); }, -180, 180, 1, 'Nắng chiếu từ phía nào (độ). Bóng đổ theo.'),
      liveSlider('Nắng cao', () => sa.el, (v) => { L().sunEl = Math.round(v); }, 3, 90, 1, 'Thấp = bóng dài như sáng sớm, chiều tối.'),
      colorRow('Màu trời (bóng râm)', () => m.hemi[0], (v) => { const c = stageMood(st).hemi; L().hemi = [v, toHexStr(c[1]), c[2]]; }),
      colorRow('Màu hắt từ đất', () => m.hemi[1], (v) => { const c = stageMood(st).hemi; L().hemi = [toHexStr(c[0]), v, c[2]]; }),
      liveSlider('Sáng chung', () => m.hemi[2], (v) => { const c = stageMood(st).hemi; L().hemi = [toHexStr(c[0]), toHexStr(c[1]), +v.toFixed(2)]; }, 0, 3, 0.05),
      liveSlider('Phơi sáng', () => m.exposure, (v) => { L().exposure = +v.toFixed(2); }, 0.4, 1.8, 0.01)),
    section('Phong cách hình (shader)',
      grid([['', 'Mặc định', 'Nét mực, màu tươi như skill'], ...Object.entries(LOOKS).map(([k, v]) => [k, v.label, v.tip] as [string, string, string])], st.look || '', (k) => { if (k) st.look = k; else delete st.look; delete st.paint; }),
      h('div', { class: 'vtitle' }, 'Chỉnh tay'),
      liveSlider('Viền mực', () => P.ink, (v) => { Pt().ink = +v.toFixed(2); }, 0, 1.6, 0.01),
      liveSlider('Độ dày viền', () => P.inkWidth[0], (v) => { Pt().inkWidth = [+v.toFixed(2), +(v * 0.55).toFixed(2)]; }, 0.8, 6, 0.05),
      colorRow('Màu viền', () => P.inkColor, (v) => { Pt().inkColor = parseInt(v.slice(1), 16); }),
      liveSlider('Độ đậm màu', () => P.sat, (v) => { Pt().sat = +v.toFixed(2); }, 0, 1.6, 0.01),
      liveSlider('Tương phản', () => P.contrast, (v) => { Pt().contrast = +v.toFixed(2); }, 0.7, 1.4, 0.01),
      liveSlider('Độ sáng', () => P.bright, (v) => { Pt().bright = +v.toFixed(2); }, 0.7, 1.3, 0.01),
      liveSlider('Phát sáng', () => P.bloom, (v) => { Pt().bloom = +v.toFixed(2); }, 0, 2.5, 0.05),
      liveSlider('Bóng tiếp xúc', () => P.ao, (v) => { Pt().ao = +v.toFixed(2); }, 0, 1, 0.01),
      liveSlider('Hạt phim', () => P.grain, (v) => { Pt().grain = +v.toFixed(3); }, 0, 0.15, 0.005),
      liveSlider('Tối góc', () => P.vignette[0], (v) => { Pt().vignette = [+v.toFixed(2), P.vignette[1]]; }, 0, 0.8, 0.01),
      liveSlider('Nét cọ sơn dầu', () => P.radius, (v) => { Pt().radius = Math.round(v); }, 0, 4, 1)),
    section('Kho ánh sáng',
      saved.length ? h('div', { class: 'shotgrid' }, ...saved.map((x) => h('button', { class: 'shotbtn mine', title: 'Áp kiểu đã lưu', onclick: () => edit(() => { const dd = x.data; st.mood = dd.mood || st.mood; if (dd.lightPreset) st.lightPreset = dd.lightPreset; else delete st.lightPreset; st.light = { ...(dd.light || {}) }; if (dd.look) st.look = dd.look; else delete st.look; st.paint = { ...(dd.paint || {}) }; }) }, x.data.name || x.name))) : note('Chưa có kiểu nào. Chỉnh xong thì bấm Lưu để dùng lại cho video sau.'),
      h('div', { class: 'row wrap' },
        h('button', { onclick: saveLook }, 'Lưu kiểu này vào kho'),
        h('button', { onclick: () => edit(() => { delete st.light; delete st.paint; }), title: 'Giữ kiểu đã chọn, bỏ các chỉnh tay' }, 'Bỏ chỉnh tay'))));
}

function projectPanel(): any[] {
  const d = S.doc;
  return [
    h('div', { class: 'ihead' }, h('b', {}, S.project || 'Chưa mở project')),
    h('div', { class: 'empty' }, 'Bấm vào nhân vật, đồ vật hoặc camera trong khung hình (hoặc danh sách bên trái) để sửa. Ánh sáng và phong cách hình ở ngay dưới đây.'),
    section('Video',
      h('div', { class: 'srow' }, h('label', {}, 'Độ dài (giây)'), h('input', { type: 'number', class: 'span2', step: 0.1, value: d.duration, onchange: (e: any) => edit(() => { d.duration = Math.max(0.5, +e.target.value); }) })),
      h('div', { class: 'srow' }, h('label', {}, 'Khung hình/giây'), h('select', { class: 'span2', onchange: (e: any) => edit(() => { d.fps = +e.target.value; }) }, ...[24, 25, 30, 60].map((f) => h('option', { value: f, selected: d.fps === f }, String(f)))))),
    ...d.stages.map((st) => lightPanel(st, d.stages.length > 1)),
    section('Phụ đề dạng chữ', note('Mỗi dòng: giây rồi chữ, ví dụ "1.25 cái phanh". Chữ trống = tắt phụ đề.'),
      (() => { const ta = h('textarea', { rows: 8, value: d.captions.map((c) => `${c.t.toFixed(2)} ${c.text}`).join('\n') }); return h('div', {}, ta, h('button', { class: 'wide', onclick: () => edit(() => { d.captions = String((ta as any).value).split('\n').map((l) => l.match(/^\s*([\d.]+)\s?(.*)$/)).filter(Boolean).map((m) => ({ t: +m![1], text: m![2] })).sort((a, b) => a.t - b.t); }) }, 'Áp dụng phụ đề')); })()),
    section('Ghi chú', h('textarea', { rows: 4, value: d.notes || '', onchange: (e: any) => edit(() => { d.notes = e.target.value; }) })),
  ];
}

on('doc', render); on('select', render); on('ws', render); onLibrary(() => { if (S.ws === 'camera' || S.ws === 'scene') render(); });
// scrubbing moves the time many times a second: rebuild the panel at most ~12 times a second (and once at the end)
let timeQ: number | null = null, lastTimeR = 0;
on('time', () => {
  if (S.playing || timeQ != null) return;
  const wait = Math.max(0, 80 - (performance.now() - lastTimeR));
  timeQ = window.setTimeout(() => requestAnimationFrame(() => { timeQ = null; lastTimeR = performance.now(); if (!S.playing) render(); }), wait);
});
