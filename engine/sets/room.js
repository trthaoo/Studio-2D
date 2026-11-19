// Room kit: an interior open toward +z (the camera side), floor at y = 0, back wall at z = -d, side walls at x = ±w/2.
// No ceiling by default, so a camera can sit high; the room gets its own light at mid height (a light near the top
// blows out the walls).
//
// addRoom(scene, { kind: 'office' | 'kitchen' | 'living' | 'shop' | 'empty', x, z, w, d, h, wall, floor: 'wood' | 'tile' | 'carpet',
//   floorColor, view: 'skyline' | 'skylineNight' | 'trees' | 'street', night (darkens the view, no daylight), ceiling: true,
//   window: true, frames: [portrait opts...],
//   sign: 'OPEN', seed, light })
// -> { group, at: { center, front, behindDesk, deskTop, window, counterTop, sofaSeat, door, wallSlots: [...] }, items: {...} }
// items holds the dressing props (desk, chair, phone, plate, counter, laptop, tv, ...) so a shot can move or relabel them.
import { THREE, V3, rng, canvas, ctex } from '../core.js';
import { M, flat, box, noiseTex } from '../materials.js';
import * as P from '../props.js';

const hex = (n) => '#' + n.toString(16).padStart(6, '0');
export const ROOM_STYLES = { wall: [0xe8dcc0, 0xd6e6ee, 0xf2e6d0, 0xdfe8d6, 0xf0d8d0, 0xcfd2dc], floor: ['wood', 'tile', 'carpet'] };

function floorTex(kind, col) {
  const c = canvas(512, 512), g = c.getContext('2d');
  if (kind === 'tile') { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? hex(col ?? 0xe8e8e2) : '#3a3f4a'; g.fillRect(i * 64, j * 64, 64, 64); } return ctex(c, [4, 4]); }
  if (kind === 'carpet') return ctex(noiseTex(512, hex(col ?? 0x5a6a8a), ['#4f5e7c', '#66779a', '#53627f'], 13), [6, 6]);
  g.fillStyle = hex(col ?? 0xa8743e); g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) { const off = (y / 64) % 2 ? 0 : 170; g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, y, 512, 3); for (let x = off; x < 512; x += 340) g.fillRect(x, y, 3, 64);
    for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(60,30,10,${0.06 + k * 0.02})`; g.fillRect(0, y + 8 + k * 9, 512, 2); } }
  return ctex(c, [3, 3]);
}
// Painted view behind the window (unlit, so it stays bright).
export function viewTex(kind = 'skyline', seed = 4, dark = false) {
  const W = 1024, H = 640, c = canvas(W, H), g = c.getContext('2d'), r = rng(seed), night = kind === 'skylineNight';
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, night ? '#0b1a4d' : '#3d8fe8'); gr.addColorStop(1, night ? '#2b4a8f' : '#bfe3ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (kind === 'trees' || kind === 'street') {
    g.fillStyle = '#5fae4a'; g.fillRect(0, H * 0.62, W, H); for (let i = 0; i < 14; i++) { g.fillStyle = ['#3f8a3a', '#4fa043', '#2f7a34'][i % 3]; g.beginPath(); g.arc(r() * W, H * (0.5 + r() * 0.1), 60 + r() * 60, 0, 7); g.fill(); }
    if (kind === 'street') { g.fillStyle = '#6b6b76'; g.fillRect(0, H * 0.8, W, H * 0.2); g.fillStyle = '#f2f2ee'; for (let x = 20; x < W; x += 120) g.fillRect(x, H * 0.89, 60, 6); }
    if (dark) { g.globalCompositeOperation = 'multiply'; g.fillStyle = '#28366e'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
    return ctex(c);
  }
  for (let layer = 0; layer < 2; layer++) {
    let x = -20; while (x < W) {
      const bw = 70 + r() * 110, bh = H * (layer ? 0.35 + r() * 0.35 : 0.2 + r() * 0.25), y = H - bh;
      g.fillStyle = layer ? (night ? '#1a2550' : '#8aa8c8') : (night ? '#2a3a6e' : '#b7cde2'); g.fillRect(x, y, bw, bh);
      g.fillStyle = night ? 'rgba(255,214,120,0.85)' : 'rgba(255,255,255,0.45)';
      for (let wy = y + 14; wy < H - 10; wy += 22) for (let wx = x + 10; wx < x + bw - 12; wx += 18) if (!night || r() < 0.45) g.fillRect(wx, wy, 9, 12);
      x += bw + 6;
    }
  }
  // one tall stepped tower
  const tx = W * (0.3 + r() * 0.4); g.fillStyle = night ? '#24346a' : '#9fb7d2';
  g.fillRect(tx - 50, H * 0.25, 100, H * 0.75); g.fillRect(tx - 34, H * 0.15, 68, H * 0.1); g.fillRect(tx - 18, H * 0.07, 36, H * 0.08); g.fillRect(tx - 3, H * 0.0, 6, H * 0.07);
  return ctex(c);
}

export function addRoom(scene, o = {}) {
  const r = rng(o.seed ?? 2), pick = (a) => a[Math.floor(r() * a.length)];
  o = { kind: 'office', w: 5.2, d: 4.2, h: 3.2, ceiling: true, night: o.view === 'skylineNight', wall: pick(ROOM_STYLES.wall), floor: o.kind === 'kitchen' ? 'tile' : o.kind === 'office' ? 'carpet' : 'wood', view: 'skyline', window: true, light: true, ...o };
  const G = new THREE.Group(); G.position.set(o.x ?? 0, 0, o.z ?? 0); scene.add(G);
  const { w, d, h } = o, wallM = flat(o.wall, 0.9), trimM = flat(0xf4f1ea, 0.6);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d + 2), new THREE.MeshStandardMaterial({ map: floorTex(o.floor, o.floorColor), roughness: o.floor === 'tile' ? 0.4 : 0.9 }));
  fl.rotation.x = -Math.PI / 2; fl.position.z = -d / 2 + 1; fl.receiveShadow = true; G.add(fl);
  // back wall with a window hole
  const ww = Math.min(2.2, w * 0.42), wh = 1.3, wy = 1.45, wxc = o.kind === 'office' ? w * 0.18 : 0;
  const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.lineTo(-w / 2, h); sh.closePath();
  if (o.window) { const hole = new THREE.Path(); hole.moveTo(wxc - ww / 2, wy - wh / 2); hole.lineTo(wxc + ww / 2, wy - wh / 2); hole.lineTo(wxc + ww / 2, wy + wh / 2); hole.lineTo(wxc - ww / 2, wy + wh / 2); hole.closePath(); sh.holes.push(hole); }
  const back = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }), wallM); back.position.z = -d - 0.12; back.receiveShadow = back.castShadow = true; G.add(back);
  for (const s of [-1, 1]) G.add(box(0.12, h, d + 0.6, wallM, s * (w / 2 + 0.06), h / 2, -d / 2 + 0.3));
  if (o.ceiling) { const ce = box(w + 0.24, 0.1, d + 0.6, flat(o.ceilingColor ?? 0xdedad0, 0.95), 0, h + 0.05, -d / 2 + 0.3); ce.castShadow = false; G.add(ce); }
  G.add(box(w, 0.12, 0.03, trimM, 0, 0.06, -d + 0.015)); for (const s of [-1, 1]) G.add(box(0.03, 0.12, d + 0.6, trimM, s * (w / 2 - 0.015), 0.06, -d / 2 + 0.3));
  const at = { center: V3(0, 0, -d / 2), front: V3(0, 0, -0.3), window: V3(wxc, wy, -d), wallSlots: [] }, items = {};
  if (o.window) {
    const view = new THREE.Mesh(new THREE.PlaneGeometry(ww * 2.4, wh * 2.4), new THREE.MeshBasicMaterial({ map: viewTex(o.view, o.seed ?? 4, o.night && o.view !== 'skylineNight'), toneMapped: false, fog: false }));
    view.position.set(wxc, wy, -d - 1.2); G.add(view);
    G.add(box(ww + 0.12, 0.08, 0.2, trimM, wxc, wy - wh / 2 - 0.04, -d + 0.04)); G.add(box(ww + 0.12, 0.06, 0.05, trimM, wxc, wy + wh / 2 + 0.03, -d - 0.02));
    for (const s of [-1, 1]) G.add(box(0.06, wh, 0.05, trimM, wxc + s * (ww / 2 + 0.03), wy, -d - 0.02));
    G.add(box(0.04, wh, 0.03, trimM, wxc, wy, -d - 0.05)); G.add(box(ww, 0.04, 0.03, trimM, wxc, wy, -d - 0.05));
    if (!o.night && o.view !== 'skylineNight') { const l = new THREE.PointLight(0xfff4e0, 6, 6, 1.4); l.position.set(wxc, wy, -d + 0.6); G.add(l); }
  }
  if (o.light) { const l = new THREE.PointLight(0xfff0dc, 14, 9, 1.3); l.position.set(0, h * 0.55, -d * 0.35); G.add(l); }
  // wall slots: spots on the back wall either side of the window, and on the side walls
  const slotXs = o.window ? [-w * 0.34, -w * 0.18 + (wxc ? -0.3 : 0), wxc + ww / 2 + 0.45].filter((x) => x - 0.25 > -w / 2 && x + 0.25 < w / 2) : [-w * 0.3, 0, w * 0.3];
  for (const x of slotXs) at.wallSlots.push(V3(x, 1.5, -d + 0.02));
  for (const s of [-1, 1]) at.wallSlots.push(V3(s * (w / 2 - 0.01), 1.5, -d * 0.5));
  const placeFrames = (list) => list.forEach((who, i) => { const sl = at.wallSlots[i % at.wallSlots.length]; const f = P.frame({ photoOf: who }); f.position.copy(sl); if (Math.abs(sl.x) > w / 2 - 0.1) { f.rotation.y = -Math.sign(sl.x) * Math.PI / 2; } G.add(f); (items.frames ||= []).push(f); });
  const add = (k, obj, x, y, z, ry = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; G.add(obj); items[k] = obj; return obj; };
  // dressing by kind
  if (o.kind === 'office') {
    const dk = add('desk', P.desk({ color: 0x6b4a2e, w: 1.5 }), -0.35, 0, -d * 0.55);
    add('chair', P.chair({ office: true, color: 0x222228 }), -0.35, 0, -d * 0.55 - 0.5);
    add('phone', P.deskPhone(), 0.05, dk.top, -d * 0.55 + 0.05); add('laptop', P.laptop({ lines: [''] }), -0.6, dk.top, -d * 0.55 - 0.05, 0.25);
    add('plate', P.deskPlate(o.plate ?? 'CLAIMS'), -0.3, dk.top, -d * 0.55 + 0.17);
    add('cabinet', P.cabinet(), w / 2 - 0.4, 0, -d + 0.5, -Math.PI / 2); add('plant', P.plant({ h: 0.9 }), -w / 2 + 0.45, 0, -d + 0.45);
    at.behindDesk = V3(-0.35, 0, -d * 0.55 - 0.5); at.deskTop = V3(-0.35, dk.top, -d * 0.55 + 0.1);
    placeFrames(o.frames ?? [{ shirt: 0x7a45e0 }, { shirt: 0x2f6fe0, bg: '#e6a07f' }, { shirt: 0x31d16b, bg: '#f2d27a' }]);
  } else if (o.kind === 'kitchen') {
    const cu = add('counter', P.counterUnit({ w: w * 0.7, color: pick([0x7fa88a, 0xd9a05a, 0x8aa0c8, 0xf4f1ea]) }), -w * 0.1, 0, -d + 0.26);
    add('fridge', P.fridge(), w / 2 - 0.45, 0, -d + 0.35); const tb = add('table', P.table({ w: 1.0, d: 0.75 }), 0, 0, -d * 0.4);
    add('chair', P.chair({ color: 0xc8603a }), -0.5, 0, -d * 0.4, Math.PI / 2); add('chair2', P.chair({ color: 0xc8603a }), 0.5, 0, -d * 0.4, -Math.PI / 2);
    at.counterTop = V3(-w * 0.1, cu.top, -d + 0.3); at.deskTop = V3(0, tb.top, -d * 0.4);
    if (o.frames) placeFrames(o.frames);
  } else if (o.kind === 'living') {
    const so = add('sofa', P.sofa({ color: pick([0x5a7ae8, 0xc8603a, 0x6b8a5a, 0x8a5a9a]) }), 0, 0, -d + 0.6);
    add('rug', P.rug(), 0, 0, -d * 0.45); add('coffeeTable', P.table({ w: 0.9, d: 0.5, h: 0.32 }), 0, 0, -d * 0.45);
    add('tv', P.tv({ lines: o.tvText ?? ['NEWS'] }), w / 2 - 0.15, 0.9, -d * 0.45, -Math.PI / 2); add('plant', P.plant(), -w / 2 + 0.45, 0, -d + 0.45);
    at.sofaSeat = V3(0, so.seat, -d + 0.65); placeFrames(o.frames ?? [{ shirt: 0xffc928 }, { shirt: 0xff5a8a, bg: '#9fd2a8' }]);
  } else if (o.kind === 'shop') {
    const cu = add('counter', P.counterUnit({ w: 2.0, color: 0x3a5a8a }), 0, 0, -d * 0.45);
    for (const s of [-1, 1]) add(s < 0 ? 'shelfL' : 'shelfR', P.shelf({ w: 1.4, h: 1.8, seed: s + 5 }), s * (w / 2 - 0.25), 0, -d * 0.5, -s * Math.PI / 2);
    add('sign', P.sign(o.sign ?? 'OPEN', { post: false, w: 1.0, h: 0.4, bg: '#d9342b', fg: '#ffffff' }), 0, 2.0 - 0.2, -d + 0.04);
    at.counterTop = V3(0, cu.top, -d * 0.45); at.behindDesk = V3(0, 0, -d * 0.45 - 0.6);
  }
  // world positions
  const off = G.position; for (const k of Object.keys(at)) { if (Array.isArray(at[k])) at[k] = at[k].map((v) => v.clone().add(off)); else at[k] = at[k].clone().add(off); }
  return { group: G, at, items, opts: o };
}
