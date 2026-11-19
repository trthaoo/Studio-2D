// Danh sách cảnh (Trong cảnh), thư viện thêm nhanh, thanh menu, màn hình project và hướng dẫn.
import { S, on, emit, select, selObj, edit, save, openProject, newProject, toast, doUndo, doRedo, snapT } from '../state';
import { valueAt, newId, SceneObject, Kind, normalize } from '../doc';
import { h, contextMenu, ask, KIND_COLOR, MenuItem } from './dom';
import { setView, framePoint } from './viewport';
import { expand, fit, deleteSelectedKeys } from './timeline';
import { KIND_VI } from './inspector';
import { PROPS as PROP_NAMES } from 'engine/props.js';
import { cast, CAR_ROLES } from 'engine/variety.js';
import { randomLook } from '../looks';
import { demoDoc } from '../demo';
import { quickList, saveCharacter, saveBackground, openLibrary, stageForNew } from './libraryPanel';
import { onLibrary, LIB, vfxHeader } from '../library';
import { FX, FX_NAMES } from '../vfx';
import { addFx } from './vfxEditor';
import { setWorkspace } from './workspaces';
import { startRender } from './exportPanel';

const hier = document.querySelector('#hierarchy .body')!;
const lib = document.querySelector('#library .body')!;
const menubar = document.getElementById('menubar')!;
const startEl = document.getElementById('start')!;
const replace = (el: Element, ...kids: (Node | string | null | undefined | false)[]) => el.replaceChildren(...(kids.filter((k) => k != null && k !== false) as (Node | string)[]));
const MOOD_VI: Record<string, string> = { day: 'ngày', dusk: 'hoàng hôn', night: 'đêm', rain: 'mưa' };

// ================================================================ trong cảnh
function renderHierarchy() {
  const kids: HTMLElement[] = [];
  for (const st of S.doc.stages) {
    kids.push(h('div', { class: 'stagehdr', title: 'Một sân khấu là một thế giới riêng (bối cảnh, ánh sáng). Chuột phải để đổi.', oncontextmenu: (e: MouseEvent) => { e.preventDefault(); stageMenu(e, st.id); } }, st.name, h('span', { class: 'mood' }, MOOD_VI[st.mood] || st.mood)));
    for (const o of S.doc.objects.filter((x) => x.stage === st.id)) {
      kids.push(h('div', { class: 'hrow' + (o.id === S.sel ? ' sel' : '') + (o.hidden ? ' hid' : '') + (o.parent ? ' child' : ''), title: KIND_VI[o.kind] + '. Bấm đúp để đổi tên, chuột phải để nhân bản hoặc xoá.', onclick: () => { select(o.id); expand(o.id); if (o.kind === 'camera' && S.ws === 'scene') setWorkspace('camera'); }, ondblclick: () => rename(o), oncontextmenu: (e: MouseEvent) => { e.preventDefault(); select(o.id); objMenu(e, o); } },
        h('span', { class: 'kdot', style: { background: KIND_COLOR[o.kind] } }),
        h('span', { class: 'nm' }, o.name),
        h('span', { class: 'kind' }, KIND_VI[o.kind]),
        h('button', { class: 'tg' + (o.hidden ? ' on' : ''), title: 'Ẩn khỏi cảnh và video', onclick: (e: MouseEvent) => { e.stopPropagation(); edit(() => { o.hidden = !o.hidden; }); } }, 'Ẩn'),
        h('button', { class: 'tg' + (o.locked ? ' on' : ''), title: 'Khoá: không bấm chọn được trong khung hình', onclick: (e: MouseEvent) => { e.stopPropagation(); edit(() => { o.locked = !o.locked; }); } }, 'Khoá')));
    }
  }
  hier.replaceChildren(...kids);
  hier.querySelector('.sel')?.scrollIntoView({ block: 'nearest' });
}
async function rename(o: SceneObject) { const n = await ask('Tên mới', o.name); if (n) edit(() => { o.name = n; }); }
function objMenu(e: MouseEvent, o: SceneObject) {
  const items: MenuItem[] = [
    { label: 'Đổi tên...', action: () => rename(o) },
    { label: 'Nhân bản (Ctrl+D)', action: () => duplicate(o) },
    { label: o.hidden ? 'Hiện' : 'Ẩn', action: () => edit(() => { o.hidden = !o.hidden; }) },
    { label: o.locked ? 'Mở khoá' : 'Khoá', action: () => edit(() => { o.locked = !o.locked; }) },
  ];
  if (o.kind === 'char') items.push({ label: 'Lưu vào thư viện', action: () => saveCharacter(o) });
  if (o.params?.type === 'code') items.push({ label: 'Sửa code của vật này...', action: () => openLibrary({ type: 'code', name: o.params.code }) });
  if (S.doc.stages.length > 1) { items.push({ sep: true, label: '' }); for (const st of S.doc.stages) if (st.id !== o.stage) items.push({ label: `Chuyển sang ${st.name}`, action: () => edit(() => { o.stage = st.id; delete o.parent; }) }); }
  if (o.kind === 'camera') items.push({ sep: true, label: '' }, { label: 'Cắt sang camera này tại playhead', action: () => edit((d) => { const t = snapT(S.t); const c = d.cuts.find((q) => Math.abs(q.t - t) < 1e-3); if (c) c.camera = o.id; else d.cuts.push({ t, camera: o.id }); d.cuts.sort((a, b) => a.t - b.t); }) });
  items.push({ sep: true, label: '' }, { label: 'Xoá', action: () => removeObj(o) });
  contextMenu(e.clientX, e.clientY, items);
}
function stageMenu(e: MouseEvent, id: string) {
  const st = S.doc.stages.find((s) => s.id === id)!;
  contextMenu(e.clientX, e.clientY, [
    { label: 'Đổi tên...', action: async () => { const n = await ask('Tên sân khấu', st.name); if (n) edit(() => { st.name = n; }); } },
    ...(['day', 'dusk', 'night', 'rain'] as const).map((m) => ({ label: `Không khí: ${MOOD_VI[m]}`, checked: st.mood === m, action: () => edit(() => { st.mood = m; }) })),
    { label: 'Ánh sáng và phong cách hình...', action: () => select(null) },
    { label: 'Lưu bối cảnh này vào thư viện', action: () => saveBackground(id) },
    { sep: true, label: '' },
    { label: 'Xoá sân khấu (và mọi thứ trên đó)', disabled: S.doc.stages.length < 2, action: () => edit((d) => { d.objects = d.objects.filter((o) => o.stage !== id); d.stages = d.stages.filter((s) => s.id !== id); const ids = new Set(d.objects.map((o) => o.id)); d.cuts = d.cuts.filter((c) => ids.has(c.camera)); }) },
  ]);
}
export function duplicate(o: SceneObject) {
  const c: SceneObject = JSON.parse(JSON.stringify(o)); c.id = newId(o.kind); c.name = o.name + ' (bản sao)';
  const p = (c.tracks.pos ||= [{ t: 0, v: [0, 0, 0] }]); for (const k of p) { const v = k.v as number[]; k.v = [v[0] + 0.6, v[1], v[2]]; }
  edit((d) => d.objects.push(c)); select(c.id);
}
export function removeObj(o: SceneObject) {
  edit((d) => {
    d.objects = d.objects.filter((x) => x.id !== o.id);
    for (const x of d.objects) if (x.parent === o.id) delete x.parent;
    if (o.kind === 'camera') d.cuts = d.cuts.filter((c) => c.camera !== o.id);
  });
  select(null);
}

// ================================================================ thư viện (thêm nhanh)
const CAR_VI: Record<string, string> = { schemer: 'Xe nhân vật chính', upgrade: 'Xe thể thao', quiet: 'Xe cũ', buddy: 'Xe tải nhỏ', victim: 'Xe thường', traffic: 'Xe trên đường' };
const PROP_VI: Record<string, string> = { sign: 'Biển chữ', deskPlate: 'Bảng tên bàn', counter: 'Bảng đếm ngày', screen: 'Màn hình', desk: 'Bàn làm việc', table: 'Bàn', chair: 'Ghế', shelf: 'Kệ sách', cabinet: 'Tủ hồ sơ', plant: 'Chậu cây', deskPhone: 'Điện thoại bàn', laptop: 'Laptop', frame: 'Khung ảnh', cashPile: 'Đống tiền', hospitalBed: 'Giường bệnh', mailbox: 'Hộp thư', bin: 'Thùng rác', bush: 'Bụi cây', tree: 'Cây', fence: 'Hàng rào', streetLamp: 'Đèn đường', cone: 'Cọc giao thông', parcel: 'Thùng hàng', duck: 'Vịt cao su', camBox: 'Camera hành trình', sofa: 'Sofa', fridge: 'Tủ lạnh', counterUnit: 'Quầy bếp', tv: 'TV', rug: 'Thảm' };
function add(kind: Kind, name: string, params: any, tracks: Record<string, any> = {}) {
  const o: SceneObject = { id: newId(kind), name, kind, stage: stageForNew(), params, tracks: { pos: [{ t: 0, v: framePoint() }], ...tracks } };
  const n = S.doc.objects.filter((x) => x.name.startsWith(name)).length; if (n) o.name = `${name} ${n + 1}`;
  edit((d) => d.objects.push(o)); select(o.id); expand(o.id);
  if (S.ws !== 'scene') setWorkspace('scene');
  toast(`Đã thêm "${o.name}" giữa khung hình. Dùng công cụ Di chuyển (W) để đặt chỗ.`);
}
let libTab: 'mine' | 'builtin' = 'mine';
function renderLibrary() {
  const group = (title: string, items: Array<[string, () => void]>) => h('details', { class: 'qgroup', open: title === 'Nhân vật' }, h('summary', { class: 'qtitle' }, title), h('div', { class: 'qlist' }, ...items.map(([l, f]) => h('div', { class: 'qitem', onclick: f }, l))));
  const tabs = h('div', { class: 'seg libtabs' },
    h('button', { class: libTab === 'mine' ? 'on' : '', onclick: () => { libTab = 'mine'; renderLibrary(); } }, 'Của tôi'),
    h('button', { class: libTab === 'builtin' ? 'on' : '', onclick: () => { libTab = 'builtin'; renderLibrary(); } }, 'Có sẵn'));
  if (libTab === 'mine') { lib.replaceChildren(tabs, quickList()); return; }
  lib.replaceChildren(tabs,
    group('Nhân vật', [
      ['Nhân vật mới (ngẫu nhiên)', () => add('char', 'Nhân vật', randomLook(), { rotY: [{ t: 0, v: -90 }] })],
      ['Mở trình tạo nhân vật...', () => openLibrary({ type: 'newchar' })]]),
    group('Xe', Object.keys(CAR_ROLES).map((r) => [CAR_VI[r] || r, () => add('car', CAR_VI[r] || 'Xe', cast({ seed: (Math.random() * 1e9) >>> 0, cars: [r] }).cars[r])])),
    group('Đồ vật', (PROP_NAMES as string[]).filter((p) => !['panel', 'paper'].includes(p)).map((p) => [PROP_VI[p] || p, () => add('prop', PROP_VI[p] || p, { type: p, ...(p === 'sign' ? { text: 'BIỂN' } : p === 'counter' ? { text: 'DAYS SINCE', value: 0 } : p === 'deskPlate' ? { text: 'TÊN' } : {}) })])),
    group('Bối cảnh', [
      ...[['office', 'Văn phòng'], ['kitchen', 'Bếp'], ['living', 'Phòng khách'], ['shop', 'Cửa hàng'], ['empty', 'Phòng trống']].map(([k, l]) => [l, () => add('set', l, { type: 'room', opts: { kind: k } })] as [string, () => void]),
      ['Nhà', () => add('set', 'Nhà', { type: 'house', opts: { seed: (Math.random() * 999) | 0 } })],
      ['Đường cao tốc', () => add('set', 'Đường cao tốc', { type: 'highway', opts: {} })],
      ['Sàn trống', () => add('set', 'Sàn', { type: 'floor', w: 40, d: 40 })]]),
    group('Hiệu ứng (VFX)', [
      ...FX_NAMES.map((k) => [FX[k].label, () => addFx({ type: k })] as [string, () => void]),
      ...LIB.vfx.map((x) => [vfxHeader(x.code || '').name || x.name, () => addFx({ type: 'code', code: x.name })] as [string, () => void]),
      ['Tạo VFX mới bằng mô tả...', () => openLibrary({ type: 'newvfx' })]]),
    group('Khác', [
      ['Camera mới ở góc hiện tại', () => {
        const cut = S.doc.cuts.filter((q) => q.t <= S.t).pop(); const cur = cut && S.doc.objects.find((o) => o.id === cut.camera);
        const n = S.doc.objects.filter((o) => o.kind === 'camera').length + 1;
        const o: SceneObject = { id: newId('cam'), name: `Camera ${n}`, kind: 'camera', stage: stageForNew(), params: {}, tracks: cur ? { pos: [{ t: 0, v: valueAt(cur, 'pos', S.t) }], target: [{ t: 0, v: valueAt(cur, 'target', S.t) }], fov: [{ t: 0, v: valueAt(cur, 'fov', S.t) }] } : {} };
        edit((d) => d.objects.push(o)); select(o.id); setWorkspace('camera');
      }],
      ...([['Đèn vàng ấm', '#ffd08a', 30], ['Đèn trắng', '#f2f6ff', 30], ['Đèn neon hồng', '#ff4fd8', 45], ['Đèn neon xanh', '#38e1ff', 45], ['Đèn đỏ báo động', '#ff2a2a', 50], ['Ánh lửa', '#ff8a3a', 35]] as Array<[string, string, number]>)
        .map(([l, c, i]) => [l, () => add('lamp', l, { color: c, range: 10 }, { pos: [{ t: 0, v: [framePoint()[0], 2.4, framePoint()[2]] }], intensity: [{ t: 0, v: i }] })] as [string, () => void]),
      ['Ánh sáng và phong cách hình...', () => { select(null); setWorkspace('scene'); toast('Ánh sáng và shader ở bảng bên phải (khi không chọn gì).'); }],
      ['Sân khấu mới', async () => { const n = await ask('Tên sân khấu mới (một thế giới riêng)', `Sân khấu ${S.doc.stages.length + 1}`); if (!n) return; edit((d) => d.stages.push({ id: newId('stage'), name: n, mood: 'day' })); }]]),
  );
}

// ================================================================ menu
let renderState: any = null;
function menuButton(label: string, items: () => MenuItem[]) {
  return h('button', { class: 'menu', onclick: (e: MouseEvent) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); contextMenu(r.left, r.bottom + 2, items()); } }, label);
}
function renderMenu() {
  const rs = renderState, viewing = S.ws === 'scene' || S.ws === 'camera';
  replace(menubar,
    h('span', { class: 'brand' }, '2D Studio'),
    menuButton('Tệp', () => [
      { label: 'Danh sách project...', action: showStart },
      { label: 'Project mới từ kịch bản...', action: () => setWorkspace('script') },
      { label: 'Project trống...', action: newProjectAsk },
      { label: 'Lưu (Ctrl+S)', action: save },
      { label: 'Lưu thành bản khác...', action: async () => { const n = await ask('Tên bản mới', S.project + ' (2)'); if (n) await newProject(n, JSON.parse(JSON.stringify(S.doc))); } },
      { sep: true, label: '' },
      { label: 'Thêm âm thanh / giọng đọc...', action: importAudio },
      { label: 'Nhập scene JSON...', action: importJson },
      { sep: true, label: '' },
      { label: 'Xuất video', action: () => setWorkspace('export') },
    ]),
    menuButton('Sửa', () => [
      { label: 'Hoàn tác (Ctrl+Z)', action: doUndo }, { label: 'Làm lại (Ctrl+Y)', action: doRedo },
      { sep: true, label: '' },
      { label: 'Nhân bản (Ctrl+D)', disabled: !selObj(), action: () => duplicate(selObj()!) },
      { label: 'Xoá (Delete)', action: deleteSelection },
    ]),
    menuButton('Xem', () => [
      { label: 'Khung hình video (C)', checked: S.view === 'camera', action: () => setView('camera') },
      { label: 'Nhìn tự do quanh sân khấu (V)', checked: S.view === 'free', action: () => setView('free') },
      { label: 'Vừa timeline', action: fit },
    ]),
    menuButton('Claude', () => [
      { label: 'Copy lời nhắn cho Claude (project này)', action: copyBrief },
      { label: 'Tải lại scene từ ổ đĩa', action: () => openProject(S.project, true) },
    ]),
    menuButton('Trợ giúp', () => [{ label: 'Hướng dẫn nhanh', action: showHelp }]),
    h('span', { class: 'proj' }, S.project ? `${S.project}${S.dirty ? ' (đang lưu)' : ''}` : ''),
    h('span', { class: 'grow' }),
    viewing ? h('div', { class: 'viewtoggle' },
      h('button', { class: S.view === 'camera' ? 'on' : '', onclick: () => setView('camera'), title: 'Đúng khung hình video sẽ xuất ra (C)' }, 'Khung video'),
      h('button', { class: S.view === 'free' ? 'on' : '', onclick: () => setView('free'), title: 'Đi vòng quanh sân khấu (V). Kéo chuột phải để xoay, lăn để zoom.' }, 'Nhìn tự do')) : null,
    rs && rs.state === 'running' ? h('span', { class: 'rstat', onclick: () => setWorkspace('export') }, `Đang xuất ${rs.progress}`) : null,
    h('button', { class: 'primary', onclick: () => { setWorkspace('export'); if (!(rs && rs.state === 'running')) startRender(); }, title: 'Xuất MP4 (xem tiến độ ở tab Xuất video)' }, 'Xuất video'),
  );
}
export async function pollRender() {
  const r = await fetch('/api/render'); renderState = await r.json(); renderMenu();
  if (renderState?.state === 'running') setTimeout(pollRender, 1000);
}
async function importAudio() {
  const inp = h('input', { type: 'file', accept: 'audio/*' }) as HTMLInputElement;
  inp.onchange = async () => {
    const f = inp.files?.[0]; if (!f) return;
    const r = await fetch(`/api/upload?name=${encodeURIComponent(S.project)}&file=${encodeURIComponent(f.name)}`, { method: 'POST', body: f });
    const j = await r.json(); if (!r.ok) return toast(j.error);
    edit((d) => d.audio.push({ id: newId('aud'), file: j.file, start: snapT(S.t), name: f.name }));
    toast('Đã thêm âm thanh vào hàng Âm thanh trên timeline, bắt đầu từ playhead.');
  };
  inp.click();
}
async function importJson() {
  const inp = h('input', { type: 'file', accept: '.json,application/json' }) as HTMLInputElement;
  inp.onchange = async () => { const f = inp.files?.[0]; if (!f) return; try { const d = normalize(JSON.parse(await f.text())); edit(() => { Object.assign(S.doc, d); }); } catch (e: any) { toast('JSON lỗi: ' + e.message); } };
  inp.click();
}
function copyBrief() {
  const o = selObj();
  const text = `Mở project 2D Studio "${S.project}" (file Projects/${S.project}/scene.json trong thư mục 2D Studio). Đọc skill/SKILL.md trước, rồi chỉ sửa đúng phần mình nhờ trong scene.json (studio tự tải lại).${o ? ` Đang nói về: "${o.name}" (id ${o.id}) ở giây ${S.t.toFixed(2)}.` : ''}\nMình muốn: `;
  navigator.clipboard.writeText(text).then(() => toast('Đã copy. Dán vào Claude rồi viết thêm bạn muốn sửa gì.'));
}
export function deleteSelection() {
  if (deleteSelectedKeys()) return;
  const o = selObj(); if (o) removeObj(o);
}

// ================================================================ hướng dẫn
export function showHelp() {
  const step = (n: string, title: string, body: string) => h('div', { class: 'hstep' }, h('div', { class: 'hn' }, n), h('div', {}, h('b', {}, title), h('div', {}, body)));
  const back = h('div', { class: 'modal-back', onclick: (e: MouseEvent) => { if (e.target === back) back.remove(); } },
    h('div', { class: 'modal help' },
      h('div', { class: 'title' }, 'Cách làm một video trong 2D Studio'),
      h('div', { class: 'hint' }, 'Các tab trên khung hình đi theo đúng thứ tự công việc:'),
      step('1', 'Thư viện', 'Chuẩn bị trước: tạo nhân vật (chọn tóc, dáng, áo, phụ kiện, xem trước ngay), lưu bối cảnh, tạo đồ vật bằng code. Dùng lại được ở mọi video.'),
      step('2', 'Kịch bản', 'Viết từ ý tưởng, hoặc clone một video: dán link hay chọn file, studio lấy lời thoại, giọng và nhịp cắt cảnh. Chọn nhân vật, bối cảnh rồi bấm Dựng.'),
      step('3', 'Dựng cảnh', 'Bấm Phát (Space) để xem. Thấy lỗi thì dừng, bấm vào thứ bị lỗi. Bấm vào tóc mở phần Tóc, vào mặt mở phần Mặt. Công cụ: Chọn (Q), Di chuyển (W), Xoay (E), Tạo dáng (R).'),
      step('4', 'Camera', 'Chọn camera ở thanh trên khung hình, kéo để đổi góc, lăn chuột để tiến lùi. Bảng bên phải có danh sách cắt cảnh: đổi camera, thêm chuyển mờ.'),
      step('5', 'Xuất video', 'Xuất MP4, có thể tách từng object ra layer riêng. Xem lại file ngay trong tab.'),
      h('div', { class: 'hint' }, 'Công tắc "Cả video / Từ playhead" ở bảng bên phải: sửa một lần cho cả video, hay chỉ thay đổi từ thời điểm đang đứng (tạo keyframe). Lỡ tay thì Ctrl+Z. Project tự lưu.'),
      h('div', { class: 'row' }, h('button', { class: 'primary', onclick: () => back.remove() }, 'Đã hiểu'))));
  document.body.append(back);
  try { localStorage.setItem('2ds.helped', '1'); } catch {}
}

// ================================================================ màn hình project
export async function newProjectAsk() {
  const n = await ask('Tên project mới', 'Video của tôi'); if (!n) return;
  await newProject(n.trim()); hideStart();
}
export async function showStart() {
  const list = await (await fetch('/api/projects')).json();
  startEl.hidden = false;
  startEl.replaceChildren(h('div', { class: 'startbox' },
    h('h1', {}, '2D Studio'),
    h('p', { class: 'hint' }, 'Video hoạt hình kiểu 3d-video-studio, trong đó từng nhân vật, đồ vật, camera và phụ đề đều chỉnh được bằng tay trên timeline.'),
    h('div', { class: 'row' },
      h('button', { class: 'primary', onclick: async () => { const n = await ask('Tên project mới', 'Video mới'); if (!n) return; await newProject(n.trim()); hideStart(); setWorkspace('script'); } }, 'Video mới từ kịch bản'),
      h('button', { onclick: newProjectAsk }, 'Project trống'),
      h('button', { onclick: async () => { const n = await ask('Tên cho project mẫu', 'Demo văn phòng'); if (!n) return; await newProject(n, demoDoc(n)); hideStart(); } }, 'Project mẫu'),
      S.project ? h('button', { onclick: hideStart }, 'Quay lại ' + S.project) : null),
    h('div', { class: 'plist' }, ...list.map((p: any) => h('div', { class: 'pitem', onclick: async () => { if (await openProject(p.name)) hideStart(); } },
      h('div', { class: 'pn' }, p.name), h('div', { class: 'pm' }, `${p.broken ? 'scene.json lỗi · ' : ''}${p.duration ?? '?'} giây · ${p.objects ?? 0} object · sửa lúc ${new Date(p.modified).toLocaleString('vi-VN')}${p.rendered ? ' · đã xuất video' : ''}`),
      h('button', { class: 'danger small', onclick: async (e: MouseEvent) => { e.stopPropagation(); const sure = await ask(`Xoá hẳn "${p.name}"? Gõ đúng tên để xác nhận.`); if (sure !== p.name) return; await fetch(`/api/project?name=${encodeURIComponent(p.name)}`, { method: 'DELETE' }); showStart(); } }, 'Xoá')))),
    !list.length ? h('p', { class: 'hint' }, 'Chưa có project. Thử project mẫu trước, hoặc bắt đầu từ kịch bản.') : null,
  ));
}
function hideStart() {
  startEl.hidden = true; fit();
  let helped = false; try { helped = !!localStorage.getItem('2ds.helped'); } catch {}
  if (!helped) showHelp();
}

// ================================================================ wiring
on('doc', () => { renderHierarchy(); renderMenu(); });
on('select', () => { renderHierarchy(); if (libTab === 'mine') renderLibrary(); });
on('project', renderMenu);
on('play', renderMenu);
on('ws', renderMenu);
onLibrary(renderLibrary);
renderLibrary(); renderMenu();
export { emit };
