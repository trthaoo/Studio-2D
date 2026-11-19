// House kit: a suburban house with lawn, driveway, sidewalk and street, built from parameters.
// Layout (in the set's own space, add it at any x/z): the house front faces +z at z = 0 and goes back to z = -depth;
// lawn from z = 0 to 6, sidewalk 6 to 7.2, street 7.2 to 14 running along x. The camera usually stands on the
// sidewalk or street looking toward -z ("low wide on the house").
//
// addHouse(scene, { x, z, w, depth, storeys: 1|2, roof: 'front' | 'side' | 'hip' | 'flat', siding, roofColor, trim,
//   doorColor, garage: 'left' | 'right' | false, garageColor, porch, chimney, vent, shutters: hex | null,
//   lights (window glow + porch light, for night), dress (mailbox, bushes, tree, fence), fence, seed })
// -> { group, at: { door, porch, garage, driveway, drivewayStreet, lawn, lawnLeft, lawnRight, sidewalk, street,
//      mailbox, windows: [...] } }   (world positions on the ground, y = 0)
import { THREE, V3, rng, canvas, ctex } from '../core.js';
import { M, flat, box, noiseTex, grassTex, asphaltTex } from '../materials.js';
import { lamp } from '../stage.js';
import * as P from '../props.js';
import { houseRow, forest, bushRow, grassTufts } from '../scenery.js';

export const HOUSE_STYLES = { roof: ['front', 'side', 'hip', 'flat'], siding: [0xf2ece0, 0xcfe3f2, 0xf6e3b4, 0xd9e8cf, 0xf3d1c8, 0xc9ccd6, 0xe8dcc0], roofColor: [0x4a4f5a, 0x6b3a2e, 0x3a4a5a, 0x5a5048, 0x2f3540] };

const hex = (n) => '#' + n.toString(16).padStart(6, '0');
function sidingTex(col, w, h) {
  const c = canvas(256, 256), g = c.getContext('2d'); g.fillStyle = hex(col); g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) { g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(0, y + 28, 256, 4); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, y, 256, 3); }
  return ctex(c, [w / 2, h / 1.0]);
}
function shingleTex(col, w, h) {
  const c = canvas(256, 256), g = c.getContext('2d'); g.fillStyle = hex(col); g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 8; r++) for (let i = 0; i < 9; i++) { const x = i * 32 - (r % 2) * 16, y = r * 32; g.fillStyle = `rgba(0,0,0,${0.08 + ((i * 7 + r * 3) % 5) * 0.03})`; g.fillRect(x + 1, y + 1, 30, 30); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, y + 29, 32, 3); }
  return ctex(c, [w / 1.2, h / 1.2]);
}
function garageTex(col) {
  const c = canvas(256, 192), g = c.getContext('2d'); g.fillStyle = hex(col); g.fillRect(0, 0, 256, 192);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(10 + i * 61, 8 + r * 46, 54, 38); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(10 + i * 61, 8 + r * 46, 54, 3); }
  return ctex(c);
}
function ventTex() {
  const c = canvas(128, 128), g = c.getContext('2d'); g.fillStyle = '#f4f1ea'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill();
  g.fillStyle = '#3a3f48'; g.beginPath(); g.arc(64, 64, 50, 0, 7); g.fill(); g.fillStyle = '#d9d4c8'; for (let y = 22; y < 110; y += 13) g.fillRect(14, y, 100, 6);
  return ctex(c);
}
function windowMesh(w, h, o, glow) {
  const g = new THREE.Group(), trim = flat(o.trim, 0.5);
  const glass = new THREE.MeshStandardMaterial({ color: glow ? 0xffe2a8 : 0x8fb6d6, roughness: 0.1, metalness: 0.2, emissive: glow ? 0xffc870 : 0x000000, emissiveIntensity: glow ? 1.1 : 0 });
  g.add(box(w + 0.14, h + 0.14, 0.06, trim, 0, 0, 0)); const gl = box(w, h, 0.02, glass, 0, 0, 0.03); gl.castShadow = false; g.add(gl);
  g.add(box(0.04, h, 0.03, trim, 0, 0, 0.05)); g.add(box(w, 0.04, 0.03, trim, 0, 0, 0.05)); g.add(box(w + 0.26, 0.06, 0.12, trim, 0, -h / 2 - 0.09, 0.05));
  if (o.shutters != null) for (const s of [-1, 1]) g.add(box(w * 0.42, h + 0.1, 0.04, flat(o.shutters, 0.6), s * (w / 2 + w * 0.26), 0, 0.02));
  return g;
}
// gable roof over a block of width w (x), depth d (z), wall top at y; ridge along z ('front' gable faces +z) or x.
function gable(group, w, d, y, rh, along, roofMat, wallMat, ov = 0.35) {
  const g = new THREE.Group(); group.add(g); g.position.y = y;
  const W = along === 'z' ? w : d, D = along === 'z' ? d : w; if (along !== 'z') g.rotation.y = Math.PI / 2;
  const tri = new THREE.Shape(); tri.moveTo(-W / 2, 0); tri.lineTo(W / 2, 0); tri.lineTo(0, rh); tri.closePath();
  const inf = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: D, bevelEnabled: false }), wallMat); inf.position.z = -D / 2; inf.castShadow = inf.receiveShadow = true; g.add(inf);
  // each slab runs from the eave (W/2 + ov out, ov*tan(a) below the wall top) up to the ridge
  const a = Math.atan2(rh, W / 2), ex = W / 2 + ov, ey = -ov * Math.tan(a), L = Math.hypot(ex, rh - ey) + 0.08;
  for (const s of [-1, 1]) {
    const sl = box(L, 0.12, D + 2 * ov, roofMat, 0, 0, 0); sl.rotation.z = -s * a;
    sl.position.set(s * ex / 2 + s * Math.sin(a) * 0.06, (rh + ey) / 2 + Math.cos(a) * 0.06, 0); g.add(sl);
  }
  return g;
}
export function addHouse(scene, o = {}) {
  const r = rng(o.seed ?? 1), pick = (a) => a[Math.floor(r() * a.length)];
  o = { w: 8, depth: 7, storeys: 1, roof: 'front', siding: pick(HOUSE_STYLES.siding), roofColor: pick(HOUSE_STYLES.roofColor), trim: 0xffffff, doorColor: pick([0xc8342c, 0x2f5a8a, 0x2f6a4a, 0x3a3a42, 0xe0a020]),
    garage: 'left', garageColor: 0xf4f1ea, porch: true, chimney: r() < 0.5, vent: true, shutters: r() < 0.5 ? pick([0x2f3a4a, 0x3a5a3a, 0x6b2a2a]) : null, lights: false, dress: true, fence: r() < 0.5, ...o };
  const G = new THREE.Group(); G.position.set(o.x ?? 0, 0, o.z ?? 0); scene.add(G);
  const SH = 2.4, wallH = SH * o.storeys, W = o.w, D = o.depth;
  const wallM = new THREE.MeshStandardMaterial({ map: sidingTex(o.siding, W, wallH), roughness: 0.85 });
  const roofM = new THREE.MeshStandardMaterial({ map: shingleTex(o.roofColor, W, D), roughness: 0.9 }), trimM = flat(o.trim, 0.5);
  // ground: lawn, sidewalk, street, driveway
  const grass = new THREE.MeshStandardMaterial({ map: ctex(grassTex({ seed: (o.seed ?? 1) + 2, hue: 96, light: 38 }), [24, 18]), roughness: 1 });
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), grass); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, -0.01, -20); lawn.receiveShadow = true; G.add(lawn);
  const concrete = new THREE.MeshStandardMaterial({ map: ctex(noiseTex(256, '#cfcac0', ['#bdb8ae', '#ddd8ce', '#c4bfb5'], 9), [40, 2]), roughness: 0.95 });
  const walk = box(80, 0.1, 1.2, concrete, 0, 0.0, 6.6); walk.castShadow = false; G.add(walk);
  const curb = box(80, 0.16, 0.18, flat(0xbdb8ae, 0.9), 0, 0.0, 7.25); curb.castShadow = false; G.add(curb);
  const asphalt = new THREE.MeshStandardMaterial({ map: ctex(asphaltTex({ wet: !!o.lights, seed: 4 }), [16, 1.6]), roughness: o.lights ? 0.6 : 0.93 });
  const street = new THREE.Mesh(new THREE.PlaneGeometry(80, 7), asphalt); street.rotation.x = -Math.PI / 2; street.position.set(0, -0.005, 10.75); street.receiveShadow = true; G.add(street);
  const gs = o.garage === 'right' ? 1 : -1, GW = 3.6, gx = gs * (W / 2 + GW / 2);
  if (o.garage) { const dw = box(3.0, 0.04, 6.0, concrete, gx, 0.0, 3.0); dw.castShadow = false; G.add(dw); }
  else { const pw = box(1.0, 0.04, 6.0, concrete, 0, 0.0, 3.0); pw.castShadow = false; G.add(pw); }
  // main block
  const main = box(W, wallH, D, wallM, 0, wallH / 2, -D / 2); G.add(main);
  G.add(box(W + 0.1, 0.25, D + 0.1, flat(0x9a9488, 0.9), 0, 0.12, -D / 2)); // foundation
  for (const s of [-1, 1]) G.add(box(0.12, wallH, 0.12, trimM, s * W / 2, wallH / 2, 0.01)); // corner boards
  const rh = o.roof === 'flat' ? 0 : Math.min(W, D) * 0.32;
  if (o.roof === 'front' || o.roof === 'side') gable(G, W, D, wallH, rh, o.roof === 'front' ? 'z' : 'x', roofM, wallM).position.z = -D / 2;
  else if (o.roof === 'hip') { const c = new THREE.Mesh(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4), roofM); c.rotation.y = Math.PI / 4; c.scale.set(W + 0.7, rh, D + 0.7); c.position.set(0, wallH + rh / 2, -D / 2); c.castShadow = true; G.add(c); }
  else { G.add(box(W + 0.3, 0.18, D + 0.3, flat(o.roofColor, 0.9), 0, wallH + 0.09, -D / 2)); G.add(box(W + 0.3, 0.3, 0.12, trimM, 0, wallH + 0.2, 0.15)); }
  if (o.vent && o.roof === 'front') { const v = new THREE.Mesh(new THREE.CircleGeometry(0.42, 28), new THREE.MeshStandardMaterial({ map: ventTex(), roughness: 0.6 })); v.position.set(0, wallH + rh * 0.42, 0.02); G.add(v); }
  if (o.chimney && o.roof !== 'flat') G.add(box(0.7, rh + 1.0, 0.7, flat(0x9a4a3a, 0.9), W * 0.28, wallH + (rh + 1.0) / 2, -D * 0.6));
  // facade: door, windows
  const at = { windows: [] }, wpos = (x, y) => { at.windows.push(V3(x + (o.x ?? 0), y, (o.z ?? 0) + 0.03)); };
  const doorX = o.garage ? -gs * W * 0.18 : 0, doorM = flat(o.doorColor, 0.45);
  G.add(box(0.95, 1.7, 0.08, trimM, doorX, 0.85 + 0.25, 0.02)); G.add(box(0.8, 1.55, 0.06, doorM, doorX, 0.78 + 0.25, 0.06));
  G.add(box(0.5, 0.5, 0.02, flat(o.doorColor, 0.3), doorX, 1.25 + 0.2, 0.1)); G.add(box(0.06, 0.06, 0.08, M.chrome, doorX + 0.28, 0.95, 0.12));
  G.add(box(1.4, 0.12, 0.6, concrete, doorX, 0.06, 0.32)); G.add(box(1.2, 0.12, 0.35, concrete, doorX, 0.18, 0.15));
  const glowing = (i) => o.lights && ((i * 7 + 3) % 5) < 3;
  const winXs = []; for (const x of [-W * 0.32, W * 0.32, gs * W * 0.18 === doorX ? null : gs * W * 0.18]) if (x != null && Math.abs(x - doorX) > 1.0) winXs.push(x);
  let wi = 0;
  for (let s = 0; s < o.storeys; s++) for (const x of (s === 0 ? winXs : [-W * 0.32, 0, W * 0.32])) {
    const y = s * SH + 1.35; const wm = windowMesh(0.85, 1.0, o, glowing(wi++)); wm.position.set(x, y, 0.03); G.add(wm); wpos(x, y);
  }
  if (o.porch) {
    const py = 2.05; G.add(box(1.8, 0.08, 1.1, trimM, doorX, py, 0.55));
    for (const s of [-1, 1]) G.add(box(0.1, py, 0.1, trimM, doorX + s * 0.8, py / 2, 1.0));
    G.add(box(2.0, 0.1, 1.3, roofM, doorX, py + 0.1, 0.55));
  }
  if (o.lights) { lamp(G, doorX + 0.6, 1.75, 0.25, { intensity: 14, range: 7, glow: 0.5 }); }
  // garage
  if (o.garage) {
    const gh = SH; G.add(box(GW, gh, D * 0.85, wallM, gx, gh / 2, -D * 0.85 / 2));
    gable(G, GW, D * 0.85, gh, 0.9, 'x', roofM, wallM, 0.25).position.set(gx, gh, -D * 0.85 / 2);
    G.add(box(GW - 0.5 + 0.14, 1.95 + 0.07, 0.06, trimM, gx, 0.98, 0.02));
    const gd = new THREE.Mesh(new THREE.PlaneGeometry(GW - 0.5, 1.95), new THREE.MeshStandardMaterial({ map: garageTex(o.garageColor), roughness: 0.6 })); gd.position.set(gx, 0.975, 0.06); G.add(gd);
    if (o.lights) lamp(G, gx, 2.15, 0.25, { intensity: 10, range: 6, glow: 0.4 });
  }
  // dressing
  const W0 = (x, z) => V3(x + (o.x ?? 0), 0, z + (o.z ?? 0));
  at.door = W0(doorX, 0.4); at.porch = W0(doorX, 1.2); at.lawn = W0(o.garage ? -gs * W * 0.25 : W * 0.25, 3.2);
  at.lawnLeft = W0(-W / 2 + 0.5 + (gs < 0 && o.garage ? -GW : 0) * 0, 3.2); at.lawnRight = W0(W / 2 - 0.5, 3.2);
  at.garage = W0(o.garage ? gx : doorX, 1.2); at.driveway = W0(o.garage ? gx : 0, 3.2); at.drivewayStreet = W0(o.garage ? gx : 0, 6.0);
  at.sidewalk = W0(0, 6.6); at.street = W0(0, 10.75); at.mailbox = W0((o.garage ? gx : 0) - gs * 2.0, 6.0);
  if (o.dress) {
    const mb = P.mailbox({ color: pick([0x2f6fe0, 0x222228, 0xc8342c]) }); mb.position.copy(at.mailbox).sub(G.position); mb.rotation.y = Math.PI / 2; G.add(mb);
    for (const x of [-W * 0.32, W * 0.32]) if (Math.abs(x - doorX) > 0.9) { const b = P.bush({ seed: (o.seed ?? 1) * 7 + x * 10, r: 0.5 }); b.position.set(x, 0, 0.55); G.add(b); }
    const t = P.tree({ h: 4.5 + r() * 1.5, seed: (o.seed ?? 1) + 5 }); t.position.set(-gs * (W / 2 + 1.6), 0, 3.5); G.add(t);
  }
  if (o.fence) { const f = P.fence({ len: 4 }); f.position.set(-gs * (W / 2 + 2.2), 0, 0.3); f.rotation.y = Math.PI / 2; G.add(f); }
  // surroundings (on by default, surround: false to skip): neighbours, a back row of rooftops, a treeline, street trees
  if (o.surround !== false) {
    const left = -(W / 2 + (gs < 0 && o.garage ? GW : 0) + 7.8), right = W / 2 + (gs > 0 && o.garage ? GW : 0) + 7.8;
    houseRow(G, { x0: left, x1: left, z: 0, face: 1, seed: (o.seed ?? 1) * 3 + 1, lights: o.lights });
    houseRow(G, { x0: right, x1: right, z: 0, face: 1, seed: (o.seed ?? 1) * 3 + 2, lights: o.lights });
    houseRow(G, { x0: -38, x1: 38, z: -21, face: 1, seed: (o.seed ?? 1) * 3 + 5, lights: o.lights, spacing: 13 });
    forest(G, { area: [-45, 45, -34, -60], count: 70, seed: (o.seed ?? 1) + 40, scale: [1.0, 1.5] });
    forest(G, { area: [-45, 45, -9, -16], count: 14, seed: (o.seed ?? 1) + 41, scale: [0.8, 1.1], avoid: (x) => Math.abs(x) < W / 2 + GW + 2 });
    for (const sx of [-1, 1]) { const t = P.tree({ h: 5.5, seed: (o.seed ?? 1) + 60 + sx }); t.position.set(sx * 13.5, 0, 5.2); G.add(t); }
    bushRow(G, { area: [-40, 40, -0.2, 0.6], count: 26, seed: (o.seed ?? 1) + 9 });
    grassTufts(G, { area: [-40, 40, 0.3, 1.2], count: 700, seed: (o.seed ?? 1) + 3, size: 0.32, avoid: (x) => (o.garage && Math.abs(x - gx) < 1.8) || Math.abs(x - doorX) < 0.9 });
  }
  return { group: G, at, opts: o };
}
