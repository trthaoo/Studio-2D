// Kịch bản > Chat với AI: tell the AI what video you want (chat, as many turns as you like), it writes a production
// plan; the review on the right shows every choice (cast looks, sets, lighting, shader, props, blocking, and each
// beat's line, face, gesture, action, camera shot and move, transition, effect) to change by hand. Then "Dựng" builds
// it into an editable scene, or "Duyệt & xuất video" builds and renders. Each approved plan is remembered
// (Library/plans) so the next videos are told to be different, and the review shows what repeats.
import { S, emit, edit, newProject, toast, save } from '../state';
import { h, ask } from './dom';
import { AIH, renderAiSetup } from './ai';
import { LIB, loadLibrary, saveLibrary, safeName } from '../library';
import { normalize, EXPRS, EXPR_VI, ARMS, ARM_VI } from '../doc';
import { LIGHTS, LOOKS } from '../lighting';
import { MOVE_VI, Move } from '../cameraShots';
import { FX, FX_NAMES } from '../vfx';
import { HAIR_STYLES, BUILD_NAMES, OUTFIT_NAMES, ACC_NAMES } from 'engine/chars.js';
import { PROPS as PROP_TYPES } from 'engine/props.js';
import { randomLook } from '../looks';
import { fit } from './timeline';
import {
  Plan, PlanScene, PlanBeat, PlanChar, SetType, Action, cleanPlan, cleanLook, planSystem, planPrompt, parseReply, localPlan, buildFromPlan, fingerprint, novelty,
  freshPick, usedRecently, allShotIds, shotLabel, MOVES, ROOM_KINDS, ROOM_KIND_VI, VIEWS, VIEW_VI, FLOORS, SET_VI, ACTION_VI, SKY_VI, planScript,
} from '../plan';

interface ChatMsg { role: 'user' | 'ai'; text: string }
let st: { project: string; chat: ChatMsg[]; plan: Plan | null; busy: boolean } = { project: '\u0000', chat: [], plan: null, busy: false };
function state() {
  if (st.project !== S.project) st = { project: S.project, chat: [...(S.doc.chat || [])], plan: S.doc.plan ? cleanPlan(S.doc.plan) : null, busy: false };
  return st;
}
const HAIR_VI: Record<string, string> = { mess: 'Rối, có xoáy', bowl: 'Úp tô', side: 'Rẽ lệch', spiky: 'Dựng gai', curly: 'Xoăn', afro: 'Afro', bun: 'Búi tó', ponytail: 'Đuôi ngựa', long: 'Dài', flattop: 'Đầu bằng', buzz: 'Húi cua', bald: 'Hói' };
const BUILD_VI: Record<string, string> = { average: 'Trung bình', slim: 'Gầy', tall: 'Cao', short: 'Thấp', stout: 'Đậm', big: 'To con', kid: 'Trẻ con' };
const OUTFIT_VI: Record<string, string> = { plain: 'Trơn', tee: 'Áo phông', polo: 'Polo', shirt: 'Sơ mi', suit: 'Vest', uniform: 'Đồng phục', hoodie: 'Hoodie', jacket: 'Áo khoác', vest: 'Gi-lê', stripes: 'Kẻ sọc', plaid: 'Ca-rô', overalls: 'Quần yếm', apron: 'Tạp dề', sweater: 'Áo len', cardigan: 'Cardigan', hivis: 'Áo phản quang', tracksuit: 'Đồ thể thao', labcoat: 'Áo blouse', dress: 'Váy' };
const ACC_VI: Record<string, string> = { sunglasses: 'Kính râm', shadesUp: 'Kính trên trán', cap: 'Mũ lưỡi trai', ranger: 'Mũ rộng vành', beanie: 'Mũ len', headset: 'Tai nghe', mustache: 'Ria mép', beard: 'Râu quai nón', bandage: 'Băng dán', blush: 'Má hồng', neckbrace: 'Nẹp cổ' };

// ---------------------------------------------------------------- small form pieces (they change the plan in place)
let rerender: () => void = () => {};
const sel = (val: any, opts: Array<[string, string]>, on: (v: string) => void, cls = '') => h('select', { class: cls, onchange: (e: any) => { on(e.target.value); rerender(); } }, ...opts.map(([v, l]) => h('option', { value: v, selected: String(val ?? '') === v }, l)));
const txt = (val: any, on: (v: string) => void, ph = '', cls = '') => h('input', { type: 'text', class: cls, value: val ?? '', placeholder: ph, onchange: (e: any) => { on(e.target.value); rerender(); } });
const nbox = (val: any, on: (v: number) => void, step = 0.1, cls = 'num') => h('input', { type: 'number', class: cls, step, value: val ?? 0, onchange: (e: any) => { on(+e.target.value); rerender(); } });
const color = (val: any, on: (v: string) => void, title = '') => h('input', { type: 'color', title, value: val || '#888888', onchange: (e: any) => { on(e.target.value); rerender(); } });
const field = (label: string, ...kids: any[]) => h('label', { class: 'pf' }, h('span', {}, label), ...kids);
const opts = (keys: string[], vi: Record<string, string> = {}) => keys.map((k) => [k, vi[k] || k] as [string, string]);

// ---------------------------------------------------------------- the panel
export async function planPanel(root: HTMLElement, modeBar: HTMLElement) {
  await loadLibrary();
  const P = state();
  const msgs = h('div', { class: 'chatlog' }), status = h('div', { class: 'hint chatstatus' }), setupBox = h('div', {});
  const input = h('textarea', { rows: 4, placeholder: P.plan ? 'Muốn sửa gì? Ví dụ: đổi sang đêm mưa, thêm một cảnh ngoài phố, nhiều góc máy động hơn...' : 'Mô tả video bạn muốn: chủ đề, nhân vật, giọng điệu, độ dài, ngôn ngữ thoại, phong cách hình...' }) as HTMLTextAreaElement;
  const review = h('div', { class: 'planreview' });
  const drawChat = () => {
    msgs.replaceChildren(...(P.chat.length ? P.chat.map((m) => h('div', { class: 'msg ' + m.role }, h('div', { class: 'who' }, m.role === 'user' ? 'Bạn' : 'AI'), h('div', { class: 'body' }, m.text)))
      : [h('div', { class: 'hint' }, 'Kể cho AI bạn muốn video thế nào. AI viết một plan mới hoàn toàn, khác các video trước (bối cảnh, ánh sáng, shader, góc máy, ngoại hình). Bạn sửa tiếp bằng chat hoặc sửa tay ở bảng bên phải.')]));
    msgs.scrollTop = msgs.scrollHeight;
  };
  rerender = () => drawReview(review);
  async function send(text: string) {
    text = text.trim(); if (!text || P.busy) return;
    P.busy = true; P.chat.push({ role: 'user', text }); input.value = ''; drawChat();
    const t0 = Date.now(), tick = setInterval(() => { status.textContent = `AI đang viết plan... ${Math.round((Date.now() - t0) / 1000)} giây`; }, 500);
    try {
      let prompt = planPrompt(P.chat.slice(0, -1), P.plan, text), got: ReturnType<typeof parseReply> | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const r = await fetch('/api/ai/text', { method: 'POST', headers: AIH, body: JSON.stringify({ system: planSystem(), prompt }) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Lỗi');
        got = parseReply(j.text); if (got.plan) break;
        prompt += `\n\n(Lần trước JSON bị lỗi: ${got.error}. Trả lại đúng một khối \`\`\`json hợp lệ.)`;
      }
      if (!got?.plan) throw new Error('AI không trả về plan đọc được. Thử lại hoặc viết rõ hơn.');
      P.plan = got.plan; P.chat.push({ role: 'ai', text: got.say || 'Đã viết plan, xem và sửa ở bên phải.' });
      status.textContent = `Xong sau ${Math.round((Date.now() - t0) / 1000)} giây.`;
    } catch (e: any) {
      P.chat.pop(); input.value = text;
      if (e.message === 'NO_AI') { status.textContent = ''; renderAiSetup(setupBox); } else status.textContent = 'Lỗi: ' + e.message;
    } finally { clearInterval(tick); P.busy = false; drawChat(); rerender(); persist(); }
  }
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(input.value); } });
  const chips = ['Làm lại một phiên bản khác hẳn', 'Đổi ánh sáng và shader cho lạ hơn', 'Nhiều góc máy và chuyển động máy hơn', 'Thêm một cảnh ở nơi khác', 'Ngắn gọn hơn, nhịp nhanh hơn'];
  root.replaceChildren(h('div', { class: 'wsdoc wide' },
    h('div', { class: 'wshead' }, h('h1', {}, 'Kịch bản'), h('p', { class: 'hint' }, 'Chat với AI để có plan, duyệt và sửa mọi tham số ở bên phải, rồi dựng hoặc xuất video. Mỗi video được nhắc phải khác các video trước.'), modeBar),
    h('div', { class: 'plancols' },
      h('section', { class: 'wsec chat' }, h('div', { class: 'wsec-h' }, h('span', { class: 'wnum' }, '1'), 'Chat với AI'),
        msgs, h('div', { class: 'chips' }, ...(P.plan ? chips : chips.slice(0, 0)).map((c) => h('button', { class: 'chip', onclick: () => send(c) }, c))),
        input, h('div', { class: 'row' }, h('button', { class: 'primary', onclick: () => send(input.value) }, 'Gửi (Ctrl+Enter)'), status), setupBox,
        h('details', { class: 'nochat' }, h('summary', {}, 'Không dùng AI: tạo plan từ kịch bản'),
          (() => { const ta = h('textarea', { rows: 5, placeholder: 'Tên: câu thoại\nTên khác: câu thoại' }) as HTMLTextAreaElement;
            return h('div', {}, ta, h('button', { onclick: () => { if (!ta.value.trim()) return toast('Viết vài dòng kịch bản trước.'); P.plan = localPlan(ta.value, S.project || 'Video mới'); P.chat.push({ role: 'ai', text: 'Đã tạo plan từ kịch bản (không dùng AI), chọn ngẫu nhiên và tránh lặp các video trước.' }); drawChat(); rerender(); persist(); } }, 'Tạo plan'),
              h('div', { class: 'hint' }, 'Bối cảnh, ánh sáng, shader, góc máy, ngoại hình được chọn ngẫu nhiên, tránh những gì các video gần đây đã dùng.')); })())),
      h('section', { class: 'wsec' }, h('div', { class: 'wsec-h' }, h('span', { class: 'wnum' }, '2'), 'Duyệt plan trước khi dựng'), review))));
  drawChat(); rerender();
}
let saveT = 0;
/** Keep the chat and the plan with the project (they come back when it is opened again). */
function persist() {
  if (!S.project) return; clearTimeout(saveT);
  saveT = window.setTimeout(() => { S.doc.chat = st.chat.slice(-40); if (st.plan) S.doc.plan = st.plan; save(); }, 600);
}

// ---------------------------------------------------------------- the review
function drawReview(box: HTMLElement) {
  const P = st.plan;
  if (!P) { box.replaceChildren(h('div', { class: 'hint' }, 'Chưa có plan. Chat với AI ở bên trái, hoặc tạo plan từ kịch bản không cần AI.')); return; }
  persist();
  const nv = novelty(P, undefined, S.project), names = P.cast.map((c) => c.name);
  const people: Array<[string, string]> = [['', '(không ai)'], ...names.map((n) => [n, n] as [string, string])];
  box.replaceChildren(
    // overview
    h('div', { class: 'pcard' },
      h('div', { class: 'prow' }, field('Tên video', txt(P.title, (v) => { P.title = v; }, '', 'wide')), field('Nhịp nói (từ/giây)', nbox(P.pace, (v) => { P.pace = Math.max(2.6, Math.min(4.6, v)); }, 0.1)),
        field('Phụ đề', sel(String(P.captionWords), [['1', '1 từ một thẻ'], ['2', '1-2 từ (như video mẫu)'], ['3', '3 từ một thẻ']], (v) => { P.captionWords = +v; }))),
      field('Tóm tắt', txt(P.logline, (v) => { P.logline = v; }, 'Một câu về video', 'wide')),
      h('div', { class: 'novel ' + (nv.score >= 0.7 ? 'good' : nv.score >= 0.45 ? 'mid' : 'bad') },
        h('b', {}, `Độ khác biệt so với các video trước: ${Math.round(nv.score * 100)}%`), nv.closest ? h('span', { class: 'hint' }, ` (giống nhất: "${nv.closest}")`) : h('span', { class: 'hint' }, ' (chưa có video nào trước để so)'),
        ...nv.repeats.slice(0, 6).map((r) => h('div', { class: 'hint' }, `Trùng ${r.what.toLowerCase()} "${r.value}" với: ${r.videos.slice(0, 3).join(', ')}`)),
        nv.repeats.length ? h('button', { onclick: () => { for (const s of P.scenes) { s.light = freshPick(Object.keys(LIGHTS), usedRecently('lights'), Date.now() + s.id.length); s.look = freshPick(Object.keys(LOOKS), usedRecently('looks'), Date.now() * 7 + s.id.length); } rerender(); } }, 'Đổi ánh sáng và shader sang thứ chưa dùng') : null)),
    // cast
    h('h3', {}, `Nhân vật (${P.cast.length})`),
    h('div', { class: 'pgrid' }, ...P.cast.map((c, i) => castCard(P, c, i)),
      h('button', { class: 'padd', onclick: () => { P.cast.push({ name: `Nhân vật ${P.cast.length + 1}`, look: cleanLook(randomLook()) }); rerender(); } }, 'Thêm nhân vật')),
    // scenes and beats
    ...P.scenes.map((s, si) => sceneCard(P, s, si, people)),
    h('div', { class: 'row' }, h('button', { onclick: () => { P.scenes.push(cleanPlan({ cast: P.cast, scenes: [{ name: `Cảnh ${P.scenes.length + 1}`, beats: [{ who: names[0] || null, line: '', shot: 'wide' }] }] }).scenes[0]); P.scenes.forEach((s, i) => { s.id = `s${i + 1}`; }); rerender(); } }, 'Thêm cảnh')),
    // approve
    h('div', { class: 'pfinal' },
      h('div', { class: 'hint' }, `${P.scenes.reduce((n, s) => n + s.beats.length, 0)} phân đoạn, ${P.scenes.length} cảnh, khoảng ${estimate(P).toFixed(0)} giây.`),
      h('div', { class: 'wbtns' },
        h('button', { class: 'primary', onclick: () => approve(false) }, S.project ? `Dựng vào "${S.project}" để xem` : 'Tạo project và dựng'),
        h('button', { class: 'primary', onclick: () => approve(true) }, 'Duyệt và xuất video')),
      h('div', { class: 'hint' }, 'Dựng xong mọi thứ vẫn sửa được trên timeline. "Duyệt và xuất video" dựng rồi xuất MP4 luôn (tab Xuất video).')));
}
const estimate = (P: Plan) => P.scenes.reduce((t, s) => t + s.beats.reduce((u, b) => u + (b.line ? Math.max(0.9, b.line.split(/\s+/).length / P.pace) : 1.5) + 0.3, 0) + 0.4, 0.6);

function castCard(P: Plan, c: PlanChar, i: number) {
  const L = c.look, setL = (patch: Partial<typeof L>) => { Object.assign(L, patch); };
  const accBox = h('div', { class: 'chips' }, ...(ACC_NAMES as string[]).map((a) => h('label', { class: 'chip' + (L.acc.includes(a) ? ' on' : '') }, h('input', { type: 'checkbox', checked: L.acc.includes(a), onchange: (e: any) => { L.acc = e.target.checked ? [...L.acc, a].slice(-3) : L.acc.filter((x) => x !== a); rerender(); } }), ACC_VI[a] || a)));
  return h('div', { class: 'pcard' },
    h('div', { class: 'prow' }, txt(c.name, (v) => { const old = c.name, nn = v.replace(/:/g, '').trim() || old; c.name = nn; renameIn(P, old, nn); }, 'Tên', 'name'),
      sel(c.library || '', [['', 'Nhân vật mới (ngoại hình dưới đây)'], ...LIB.characters.map((x) => [x.name, 'Thư viện: ' + (x.data?.name || x.name)] as [string, string])], (v) => { c.library = v || undefined; }),
      h('button', { onclick: () => { c.look = cleanLook(randomLook()); c.library = undefined; rerender(); } }, 'Ngẫu nhiên'),
      h('button', { class: 'danger', onclick: () => { P.cast.splice(i, 1); rerender(); } }, 'Bỏ')),
    c.note ? h('div', { class: 'hint' }, c.note) : null,
    c.library ? h('div', { class: 'hint' }, 'Dùng ngoại hình đã lưu trong thư viện.') : h('div', { class: 'pfields' },
      field('Tóc', sel(L.style, opts(HAIR_STYLES as string[], HAIR_VI), (v) => setL({ style: v })), color(L.hair, (v) => setL({ hair: v }), 'Màu tóc')),
      field('Áo', sel(L.outfit, opts(OUTFIT_NAMES as string[], OUTFIT_VI), (v) => setL({ outfit: v })), color(L.shirt, (v) => setL({ shirt: v }), 'Màu áo'), color(L.shirt2 || '#fbf7ef', (v) => setL({ shirt2: v }), 'Màu áo trong')),
      field('Quần', color(L.pants, (v) => setL({ pants: v }), 'Màu quần')),
      field('Da', color(L.skin || '#f8f3ea', (v) => setL({ skin: v }), 'Màu da')),
      field('Dáng', sel(L.build, opts(BUILD_NAMES as string[], BUILD_VI), (v) => setL({ build: v }))),
      field('Kính cận', h('input', { type: 'checkbox', checked: !!L.glasses, onchange: (e: any) => { L.glasses = e.target.checked || undefined; rerender(); } })),
      field('Phụ kiện', accBox)));
}
function renameIn(P: Plan, old: string, nn: string) {
  for (const s of P.scenes) { for (const b of s.beats) { if (b.who === old) b.who = nn; if (b.on === old) b.on = nn; if (b.with === old) b.with = nn; } for (const q of s.blocking) if (q.who === old) q.who = nn; }
}

function sceneCard(P: Plan, s: PlanScene, si: number, people: Array<[string, string]>) {
  const st0 = s.set;
  const setFields: any[] = [field('Loại', sel(st0.type, (Object.keys(SET_VI) as SetType[]).filter((k) => k !== 'library' || LIB.backgrounds.length).map((k) => [k, SET_VI[k]]), (v) => { s.set = cleanPlan({ cast: P.cast, scenes: [{ set: { type: v, library: LIB.backgrounds[0]?.name } }] }).scenes[0].set; }))];
  if (st0.type === 'room') setFields.push(field('Phòng', sel(st0.kind, opts(ROOM_KINDS, ROOM_KIND_VI), (v) => { st0.kind = v; })), field('Tường', color(st0.wall, (v) => { st0.wall = v; })), field('Sàn', sel(st0.floor, opts(FLOORS, { wood: 'Gỗ', tile: 'Gạch', carpet: 'Thảm' }), (v) => { st0.floor = v; }), color(st0.floorColor || '#a8743e', (v) => { st0.floorColor = v; }, 'Màu sàn')), field('Ngoài cửa sổ', sel(st0.view, opts(VIEWS, VIEW_VI), (v) => { st0.view = v; })), field('Biến thể', nbox(st0.seed, (v) => { st0.seed = Math.round(v); }, 1)));
  if (st0.type === 'house') setFields.push(field('Tường nhà', color(st0.siding || '#d8cfc0', (v) => { st0.siding = v; })), field('Mái', color(st0.roofColor || '#5a4a44', (v) => { st0.roofColor = v; })), field('Cửa', color(st0.doorColor || '#a83a2a', (v) => { st0.doorColor = v; })), field('Số tầng', sel(String(st0.storeys || 1), [['1', '1'], ['2', '2']], (v) => { st0.storeys = +v; })), field('Biến thể', nbox(st0.seed, (v) => { st0.seed = Math.round(v); }, 1)));
  if (st0.type === 'floor') setFields.push(field('Màu sàn', color(st0.color, (v) => { st0.color = v; })));
  if (st0.type === 'library') setFields.push(field('Bối cảnh', sel(st0.library, LIB.backgrounds.map((b) => [b.name, b.data?.name || b.name]), (v) => { st0.library = v; })));
  const lightOpts = Object.entries(LIGHTS).map(([k, v]) => [k, v.label] as [string, string]), lookOpts = Object.entries(LOOKS).map(([k, v]) => [k, v.label] as [string, string]);
  return h('div', { class: 'pcard scene' },
    h('div', { class: 'prow' }, h('b', {}, `Cảnh ${si + 1}`), txt(s.name, (v) => { s.name = v || s.name; }, 'Tên cảnh', 'name'),
      P.scenes.length > 1 ? h('button', { class: 'danger', onclick: () => { P.scenes.splice(si, 1); P.scenes.forEach((q, i) => { q.id = `s${i + 1}`; }); rerender(); } }, 'Bỏ cảnh') : null),
    h('div', { class: 'pfields' },
      field('Bầu trời', sel(s.sky, opts(['day', 'dusk', 'night', 'rain'], SKY_VI), (v) => { s.sky = v as any; })),
      field('Ánh sáng', sel(s.light, lightOpts, (v) => { s.light = v; }), h('button', { class: 'rbtn', title: 'Đổi sang kiểu chưa dùng gần đây', onclick: () => { s.light = freshPick(Object.keys(LIGHTS), [...usedRecently('lights'), s.light]); rerender(); } }, 'Đổi')),
      field('Shader', sel(s.look, lookOpts, (v) => { s.look = v; }), h('button', { class: 'rbtn', title: 'Đổi sang kiểu chưa dùng gần đây', onclick: () => { s.look = freshPick(Object.keys(LOOKS), [...usedRecently('looks'), s.look]); rerender(); } }, 'Đổi')),
      ...setFields),
    h('div', { class: 'hint' }, `${LIGHTS[s.light]?.tip || ''} ${LOOKS[s.look]?.tip || ''}`),
    // props
    h('details', { open: s.props.length > 0 }, h('summary', {}, `Đồ vật thêm (${s.props.length})`),
      h('table', { class: 'ptable' }, h('tr', {}, ...['Loại', 'Chữ trên đó', 'Trái/phải', 'Trước/sau', 'Xoay', ''].map((x) => h('th', {}, x))),
        ...s.props.map((q, i) => h('tr', {}, h('td', {}, sel(q.type, opts(PROP_TYPES as string[]), (v) => { q.type = v; })), h('td', {}, txt(q.text, (v) => { q.text = v || undefined; })), h('td', {}, nbox(q.x, (v) => { q.x = v; })), h('td', {}, nbox(q.z, (v) => { q.z = v; })), h('td', {}, nbox(q.rotY ?? 0, (v) => { q.rotY = v; }, 5)), h('td', {}, h('button', { class: 'rbtn', onclick: () => { s.props.splice(i, 1); rerender(); } }, 'Xoá'))))),
      h('button', { onclick: () => { s.props.push({ type: 'sign', text: 'SALE', x: 1.2, z: -1 }); rerender(); } }, 'Thêm đồ vật')),
    // blocking
    h('details', {}, h('summary', {}, `Vị trí đứng (${s.blocking.length})`),
      h('table', { class: 'ptable' }, h('tr', {}, ...['Ai', 'Trái/phải', 'Trước/sau', 'Hướng (độ)'].map((x) => h('th', {}, x))),
        ...s.blocking.map((q) => h('tr', {}, h('td', {}, q.who), h('td', {}, nbox(q.x, (v) => { q.x = v; })), h('td', {}, nbox(q.z, (v) => { q.z = v; })), h('td', {}, nbox(q.face, (v) => { q.face = v; }, 5))))),
      h('div', { class: 'hint' }, 'Hướng -90 là nhìn về phía máy, -135 nhìn chéo trái, -45 chéo phải. Ai xuất hiện trong phân đoạn của cảnh sẽ tự có ở đây.')),
    // beats
    h('div', { class: 'beats' },
      h('table', { class: 'ptable beatst' },
        h('tr', {}, ...['#', 'Người nói', 'Câu thoại', 'Mặt', 'Tay', 'Hành động', 'Góc máy', 'Quay vào', 'Cùng với', 'Chuyển động máy', 'Chuyển', 'Hiệu ứng', ''].map((x) => h('th', {}, x))),
        ...s.beats.map((b, i) => beatRow(P, s, b, i, people))),
      h('button', { onclick: () => { const last = s.beats[s.beats.length - 1]; s.beats.push({ who: last?.who ?? null, line: '', expr: 'talk', arms: 'down', action: 'none', shot: 'medium', on: last?.on ?? null, with: null, move: 'push', transition: 'cut' }); rerender(); } }, 'Thêm phân đoạn')));
}
function beatRow(P: Plan, s: PlanScene, b: PlanBeat, i: number, people: Array<[string, string]>) {
  const fix = () => { cleanAfterEdit(P); };
  return h('tr', {},
    h('td', {}, String(i + 1)),
    h('td', {}, sel(b.who || '', people, (v) => { b.who = v || null; if (!b.on) b.on = b.who; fix(); })),
    h('td', { class: 'line' }, txt(b.line, (v) => { b.line = v; }, '(không thoại)')),
    h('td', {}, sel(b.expr, opts(EXPRS, EXPR_VI), (v) => { b.expr = v; })),
    h('td', {}, sel(b.arms, opts(ARMS, ARM_VI), (v) => { b.arms = v; })),
    h('td', {}, sel(b.action, opts(Object.keys(ACTION_VI), ACTION_VI as any), (v) => { b.action = v as Action; if (v === 'walk-to' && !b.to) b.to = [1, 0]; }),
      b.action === 'walk-to' ? h('span', { class: 'to' }, nbox(b.to?.[0] ?? 0, (v) => { b.to = [v, b.to?.[1] ?? 0]; }), nbox(b.to?.[1] ?? 0, (v) => { b.to = [b.to?.[0] ?? 0, v]; })) : null),
    h('td', {}, sel(b.shot, allShotIds().map((id) => [id, shotLabel(id)] as [string, string]), (v) => { b.shot = v; })),
    h('td', {}, sel(b.on || '', people, (v) => { b.on = v || null; fix(); })),
    h('td', {}, sel(b.with || '', people, (v) => { b.with = v || null; fix(); })),
    h('td', {}, sel(b.move, opts(MOVES, MOVE_VI as any), (v) => { b.move = v as Move; })),
    h('td', {}, sel(b.transition, [['cut', 'Cắt thẳng'], ['dissolve', 'Chuyển mờ']], (v) => { b.transition = v as any; })),
    h('td', {}, sel(b.fx || '', [['', '—'], ...(FX_NAMES as string[]).map((k) => [k, FX[k].label] as [string, string])], (v) => { b.fx = v || undefined; })),
    h('td', { class: 'rowbtns' },
      h('button', { class: 'rbtn', disabled: i === 0, onclick: () => { s.beats.splice(i - 1, 0, s.beats.splice(i, 1)[0]); rerender(); } }, 'Lên'),
      h('button', { class: 'rbtn', disabled: i === s.beats.length - 1, onclick: () => { s.beats.splice(i + 1, 0, s.beats.splice(i, 1)[0]); rerender(); } }, 'Xuống'),
      h('button', { class: 'rbtn', onclick: () => { s.beats.splice(i, 1); rerender(); } }, 'Xoá')));
}
/** After a person changes in a beat: everyone in a scene's beats has a place to stand (cleanPlan adds them). */
function cleanAfterEdit(P: Plan) { const c = cleanPlan(P); P.scenes.forEach((s, i) => { s.blocking = c.scenes[i].blocking; }); }

// ---------------------------------------------------------------- approve: build (and render)
async function approve(render: boolean) {
  const P = st.plan; if (!P) return;
  const plan = cleanPlan(P); st.plan = plan;
  if (!plan.scenes.some((s) => s.beats.length)) return toast('Plan chưa có phân đoạn nào.');
  let project = S.project;
  if (!project) {
    project = safeName((await ask('Tên project mới', plan.title)) || ''); if (!project || project === 'item') return;
    const list: string[] = (await (await fetch('/api/projects')).json()).map((p: any) => p.name);
    if (list.includes(project)) return toast(`Đã có project "${project}".`);
    const doc = buildFromPlan(plan, project); doc.chat = st.chat.slice(-40);
    await newProject(project, doc); st.project = project; document.getElementById('start')!.hidden = true;
  } else {
    if (S.doc.objects.some((o) => o.kind === 'char' || o.kind === 'camera') && S.doc.plan == null) {
      const ok = await ask(`Dựng sẽ thay toàn bộ cảnh của "${project}" bằng plan này (Ctrl+Z để quay lại). Gõ "ok" để tiếp tục.`); if (ok?.toLowerCase() !== 'ok') return;
    }
    const doc = buildFromPlan(plan, project); doc.chat = st.chat.slice(-40);
    edit((cur) => { Object.assign(cur, normalize({ ...doc, name: cur.name })); });
  }
  // remember it, so the next videos are told to be different
  await saveLibrary.plan(project, fingerprint(plan, project)).catch(() => {});
  await loadLibrary();
  await fetch(`/api/project-file?name=${encodeURIComponent(project)}&file=plan.json`, { method: 'PUT', body: JSON.stringify(plan, null, 1) }).catch(() => {});
  if (render) {
    S.ws = 'export'; emit('ws');
    const { startRender } = await import('./exportPanel'); await startRender(false, false);
    toast('Đã dựng theo plan và bắt đầu xuất video. Xem tiến độ ở tab Xuất video.', 6000);
  } else { S.ws = 'scene'; emit('ws'); fit(); toast(`Đã dựng theo plan: ${plan.scenes.length} cảnh, ${plan.scenes.reduce((n, s) => n + s.beats.length, 0)} cú máy. Bấm Phát để xem.`, 6000); }
}
export { planScript };
