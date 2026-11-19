// Tạo nhân vật: chọn từng phần bằng nút trước / sau, xem trước trực tiếp ở giữa (đúng engine của video), lưu vào thư viện.
import { Runtime } from '../runtime';
import { normalize, SceneDoc, EXPRS, EXPR_VI, ARMS, ARM_VI } from '../doc';
import { S, edit, select, toast, emit } from '../state';
import { LIB, loadLibrary, saveLibrary, safeName } from '../library';
import { h } from './dom';
import { HAIR_STYLES, BUILD_NAMES, OUTFIT_NAMES, ACC_NAMES } from 'engine/chars.js';
import { HAIR_COLORS } from 'engine/variety.js';
import { randomLook, SHIRT_COLORS, PANTS_COLORS, SKIN_TONES } from '../looks';
import { newId } from '../doc';
import { framePoint } from './viewport';
import { stageForNew, pickItem } from './libraryPanel';

const HAIR_VI: Record<string, string> = { mess: 'Rối, có xoáy', bowl: 'Úp tô', side: 'Rẽ lệch', spiky: 'Dựng gai', curly: 'Xoăn', afro: 'Afro', bun: 'Búi tó', ponytail: 'Đuôi ngựa', long: 'Dài', flattop: 'Đầu bằng', buzz: 'Húi cua', bald: 'Hói' };
const BUILD_VI: Record<string, string> = { average: 'Trung bình', slim: 'Gầy', tall: 'Cao', short: 'Thấp', stout: 'Đậm', big: 'To con', kid: 'Trẻ con' };
const OUTFIT_VI: Record<string, string> = { plain: 'Trơn', tee: 'Áo phông', polo: 'Polo', shirt: 'Sơ mi', suit: 'Vest', uniform: 'Đồng phục', hoodie: 'Hoodie', jacket: 'Áo khoác', vest: 'Gi-lê', stripes: 'Kẻ sọc', plaid: 'Ca-rô', overalls: 'Quần yếm', apron: 'Tạp dề', sweater: 'Áo len', cardigan: 'Cardigan', hivis: 'Áo phản quang', tracksuit: 'Đồ thể thao', labcoat: 'Áo blouse', dress: 'Váy' };
const ACC_VI: Record<string, string> = { sunglasses: 'Kính râm', shadesUp: 'Kính trên trán', cap: 'Mũ lưỡi trai', ranger: 'Mũ rộng vành', beanie: 'Mũ len', headset: 'Tai nghe', mustache: 'Ria mép', beard: 'Râu', bandage: 'Băng dán', blush: 'Má hồng', neckbrace: 'Nẹp cổ' };
const hex = (n: any) => typeof n === 'number' ? '#' + n.toString(16).padStart(6, '0') : String(n || '#888888');
const SHIRTS = SHIRT_COLORS.slice(0, 20);

let rt: Runtime | null = null, raf = 0, spin = 0, drag: { x: number; a: number } | null = null, manual = -1;
let P: any = null, name = '', editing: string | null = null, expr = 'smug', arms = 'down';

let gen = 0;   // one preview loop at a time: an old loop stops itself when a newer one starts
export function stopCreator() { gen++; cancelAnimationFrame(raf); raf = 0; }

function previewDoc(): SceneDoc {
  return normalize({
    version: 1, name: 'preview', fps: 30, width: 1080, height: 1920, duration: 1,
    stages: [{ id: 's', name: 's', mood: 'day', paint: { vignette: [0.35, 0.35] } }],
    objects: [
      { id: 'floor', name: 'floor', kind: 'set', stage: 's', params: { type: 'floor', w: 60, d: 60, color: 0x9aa3b0 }, tracks: {} },
      { id: 'c', name: 'c', kind: 'char', stage: 's', params: P, tracks: { rotY: [{ t: 0, v: -90 }], expr: [{ t: 0, v: expr }], armL: [{ t: 0, v: arms }], armR: [{ t: 0, v: arms }] } },
      { id: 'cam', name: 'cam', kind: 'camera', stage: 's', params: {}, tracks: { pos: [{ t: 0, v: [0, 0.9, 3.4] }], target: [{ t: 0, v: [0, 0.8, 0] }], fov: [{ t: 0, v: 34 }] } },
    ],
    cuts: [{ t: 0, camera: 'cam' }], captions: [], audio: [],
  });
}

export function characterCreator(root: HTMLElement, existing?: string) {
  stopCreator();
  if (existing !== undefined || !P || editing !== (existing ?? null)) {
    const it = existing ? LIB.characters.find((c) => c.name === existing)?.data : null;
    editing = existing ?? null;
    if (it) { P = JSON.parse(JSON.stringify(it.params)); delete P.role; name = it.name || existing!; }
    else { P = randomLook(); name = ''; }
  }
  rt = new Runtime(); let doc = previewDoc(); rt.sync(doc);
  const cv = h('canvas', { class: 'ccview' }) as HTMLCanvasElement;
  const rebuild = () => { doc = previewDoc(); rt!.sync(doc); paintOptions(); };

  // ---- option rows
  const opts = h('div', { class: 'ccopts' });
  const cycle = (label: string, list: string[], get: () => string, set: (v: string) => void, names: Record<string, string>) => {
    const cur = get(), i = Math.max(0, list.indexOf(cur));
    const go = (d: number) => { set(list[(i + d + list.length) % list.length]); rebuild(); };
    return h('div', { class: 'ccrow' }, h('div', { class: 'cclabel' }, label),
      h('div', { class: 'stepper' }, h('button', { onclick: () => go(-1), title: 'Trước' }, '‹'), h('div', { class: 'stepval' }, names[cur] || cur || 'mặc định'), h('button', { onclick: () => go(1), title: 'Sau' }, '›')));
  };
  const swatches = (label: string, list: string[], get: () => string, set: (v: string) => void) => h('div', { class: 'ccrow' }, h('div', { class: 'cclabel' }, label),
    h('div', { class: 'swatches' }, ...list.map((c) => h('button', { class: 'sw' + (hex(get()).toLowerCase() === c.toLowerCase() ? ' on' : ''), style: { background: c }, title: c, onclick: () => { set(c); rebuild(); } })),
      h('input', { type: 'color', value: hex(get()), title: 'Màu khác', onchange: (e: any) => { set(e.target.value); rebuild(); } })));
  const slider = (label: string, key: string, min: number, max: number, def: number, step = 0.01) => {
    const r = h('input', { type: 'range', min, max, step, value: P[key] ?? def }) as HTMLInputElement;
    r.addEventListener('input', () => { P[key] = +(+r.value).toFixed(3); doc = previewDoc(); rt!.sync(doc); });
    return h('div', { class: 'ccrow' }, h('div', { class: 'cclabel' }, label), r);
  };
  function paintOptions() {
    const acc: string[] = P.acc || [];
    const head = P.head || {};
    const headSlider = (label: string, key: string, min: number, max: number, def: number) => {
      const r = h('input', { type: 'range', min, max, step: 0.01, value: head[key] ?? def }) as HTMLInputElement;
      r.addEventListener('input', () => { P.head = { ...(P.head || {}), [key]: +(+r.value).toFixed(3) }; doc = previewDoc(); rt!.sync(doc); });
      return h('div', { class: 'ccrow' }, h('div', { class: 'cclabel' }, label), r);
    };
    opts.replaceChildren(
      h('div', { class: 'ccgroup' }, 'Mặt'),
      swatches('Màu da', SKIN_TONES, () => P.skin || SKIN_TONES[0], (v) => { if (v === SKIN_TONES[0]) delete P.skin; else P.skin = v; }),
      headSlider('Mặt rộng / hẹp', 'hw', 0.78, 1.06, 0.92), headSlider('Cằm nhọn / tròn', 'egg', -0.24, 0.02, -0.1),
      h('div', { class: 'ccgroup' }, 'Tóc'),
      cycle('Kiểu tóc', HAIR_STYLES, () => P.style || 'mess', (v) => { P.style = v; }, HAIR_VI),
      swatches('Màu tóc', HAIR_COLORS.map((c: string[]) => c[0]), () => P.hair, (v) => { P.hair = v; const pair = HAIR_COLORS.find((c: string[]) => c[0] === v); P.hair2 = pair ? pair[1] : v; }),
      h('div', { class: 'ccgroup' }, 'Dáng người'),
      cycle('Vóc dáng', BUILD_NAMES, () => P.build || 'average', (v) => { P.build = v; }, BUILD_VI),
      slider('Cỡ đầu', 'R', 0.16, 0.25, 0.2, 0.005), slider('Độ béo', 'girth', 0.75, 1.4, 1), slider('Dài chân', 'legs', 0.8, 1.25, 1),
      h('div', { class: 'ccgroup' }, 'Trang phục'),
      cycle('Kiểu áo', OUTFIT_NAMES, () => P.outfit || 'plain', (v) => { P.outfit = v; }, OUTFIT_VI),
      swatches('Màu áo', SHIRTS, () => P.shirt, (v) => { P.shirt = v; }),
      swatches('Màu áo trong', ['#fbf7ef', '#f2f2f2', '#e8dcc0', ...SHIRTS.slice(0, 7)], () => P.shirt2 ?? '#fbf7ef', (v) => { P.shirt2 = v; }),
      swatches('Màu quần', PANTS_COLORS, () => P.pants ?? '#2b2f3a', (v) => { P.pants = v; }),
      h('div', { class: 'ccgroup' }, 'Phụ kiện'),
      h('div', { class: 'chips' }, h('button', { class: 'chip' + (P.glasses ? ' on' : ''), onclick: () => { P.glasses = !P.glasses || undefined; rebuild(); } }, 'Kính cận'),
        ...ACC_NAMES.map((a: string) => { const on = acc.some((x) => x.split(':')[0] === a); return h('button', { class: 'chip' + (on ? ' on' : ''), onclick: () => { P.acc = on ? acc.filter((x) => x.split(':')[0] !== a) : [...acc, a]; rebuild(); } }, ACC_VI[a] || a); })),
      ...acc.filter((x) => !['blush', 'bandage', 'neckbrace'].includes(x.split(':')[0])).map((x) => {
        const [a, col] = x.split(':');
        return swatches('Màu ' + (ACC_VI[a] || a).toLowerCase(), ['#15151a', '#d8342c', '#2f7de0', '#ffcf2e', '#31d16b', '#8a6a3a', '#f4f4f0', '#a65cff'], () => col || (a === 'mustache' || a === 'beard' ? hex(P.hair) : a === 'cap' ? '#d8342c' : a === 'beanie' ? '#2f7de0' : a === 'ranger' ? '#8a6a3a' : '#15151a'), (v) => { P.acc = acc.map((y) => (y.split(':')[0] === a ? `${a}:${v}` : y)); });
      }),
      h('div', { class: 'ccgroup' }, 'Xem thử (không lưu)'),
      cycle('Biểu cảm', EXPRS, () => expr, (v) => { expr = v; }, EXPR_VI),
      cycle('Tay', ARMS, () => arms, (v) => { arms = v; }, ARM_VI),
    );
  }
  const desc = h('div', { class: 'ccdesc' });
  const nameIn = h('input', { class: 'ccname', value: name, placeholder: 'Tên nhân vật', oninput: (e: any) => { name = e.target.value; } }) as HTMLInputElement;
  async function saveIt(andAdd: boolean) {
    const n = (name || '').trim(); if (!n) { toast('Đặt tên cho nhân vật trước.'); nameIn.focus(); return; }
    const file = editing || safeName(n);
    if (!editing && LIB.characters.some((c) => c.name === file)) { toast(`Đã có "${n}" trong thư viện. Đặt tên khác.`); return; }
    const prev = editing ? LIB.characters.find((c) => c.name === editing)?.data : null;
    await saveLibrary.character(file, { name: n, params: { ...P }, tracks: prev?.tracks || {}, savedFrom: S.project });
    editing = file; pickItem({ type: 'characters', name: file }); await loadLibrary(); toast(`Đã lưu "${n}" vào thư viện.`);
    if (andAdd) {
      const o = { id: newId('char'), name: n, kind: 'char' as const, stage: stageForNew(), params: JSON.parse(JSON.stringify(P)), tracks: { ...(prev?.tracks || {}), pos: [{ t: 0, v: framePoint() }], rotY: [{ t: 0, v: -90 }] } };
      edit((d) => d.objects.push(o)); select(o.id); S.ws = 'scene'; emit('ws');
    }
  }
  root.replaceChildren(h('div', { class: 'creator' },
    h('div', { class: 'cchead' }, h('h1', {}, editing ? `Sửa nhân vật: ${name}` : 'Tạo nhân vật'), desc),
    h('div', { class: 'ccbody' },
      opts,
      h('div', { class: 'ccstage' }, cv, h('div', { class: 'cchint' }, h('span', { class: 'hint' }, 'Kéo ngang để xoay. Thả ra một lúc thì tự quay.'), h('span', { class: 'viewbtns' }, ...[['Trước', 0], ['Nghiêng', 90], ['Sau', 180], ['Nghiêng kia', 270]].map(([l, a]) => h('button', { onclick: () => { manual = a as number; spin = a as number; } }, l as string)), h('button', { onclick: () => { manual = -1; } }, 'Tự quay')))),
      h('div', { class: 'ccside' },
        h('div', { class: 'cclabel' }, 'Tên'), nameIn,
        h('button', { onclick: () => { P = randomLook(); rebuild(); }, title: 'Mọi phần chọn ngẫu nhiên, độc lập với nhau' }, 'Ngẫu nhiên tất cả'),
        h('div', { class: 'hint' }, 'Hoặc chọn từng phần ở cột trái. Không có khuôn vai sẵn: tóc, mặt, dáng, áo, phụ kiện đều tự do.'),
        h('div', { class: 'grow' }),
        h('button', { onclick: () => saveIt(false) }, editing ? 'Lưu thay đổi' : 'Lưu vào thư viện'),
        h('button', { class: 'primary big', onclick: () => saveIt(true) }, 'Lưu và đưa vào cảnh')))));
  paintOptions();

  // ---- preview loop: the real engine, the same look as the video
  const ctx = cv.getContext('2d')!;
  cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); drag = { x: e.clientX, a: manual >= 0 ? manual : spin }; });
  cv.addEventListener('pointermove', (e) => { if (drag) manual = drag.a + (e.clientX - drag.x) * 0.6; });
  cv.addEventListener('pointerup', () => { drag = null; setTimeout(() => { if (!drag && manual >= 0) { spin = manual; manual = -1; } }, 2500); });
  let last = 0;
  const my = gen;
  const loop = (ts: number) => {
    if (my !== gen) return;
    raf = requestAnimationFrame(loop);
    if (!cv.isConnected) return;
    if (ts - last < 33) return; last = ts;
    if (manual < 0 && !drag) spin += 0.8;   // a slow full turn: front, side, back
    const ang = manual >= 0 ? manual : spin;
    doc.objects[1].tracks.rotY = [{ t: 0, v: -90 + (((ang % 360) + 540) % 360) - 180 }];
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
    let f: HTMLCanvasElement;
    try { f = rt!.draw(0, { captions: false }); } catch (e) { console.error('creator preview', e); return; }
    // the whole 9:16 frame, as large as fits, centred (a card on the stage)
    const s = Math.min(cv.width / f.width, cv.height / f.height) * 0.96, w = f.width * s, hh = f.height * s;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 24 * dpr; ctx.shadowOffsetY = 8 * dpr;
    ctx.drawImage(f, (cv.width - w) / 2, (cv.height - hh) / 2, w, hh); ctx.restore();
  };
  raf = requestAnimationFrame(loop);
}
