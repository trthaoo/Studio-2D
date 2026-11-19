// Cars from side-profile specs. Car-local axes: +x forward, +y up, +z the car's right.
// Left-hand drive: driver at z = -seatZ, passenger at +seatZ. The body is hollow so the camera can sit inside.
//
// makeCar(spec, colour) -> Group with .body (tilt this for brake dive), .wheels, .bumperF, .bumperR,
//   .tail (tail-light material: raise emissiveIntensity to 3 when braking), .glow (brake glow sprites: opacity 0.55)
// addInterior(car, interiorSpec, detail) adds seats, dash, wheel (car.wheelRig.rimPoint(angle) for hands);
//   with detail = true also pedals (car.brake), a can (car.can), a mirror charm (car.charm), a phone (car.phone),
//   gauges, a screen and two cabin lights.
// tintGlass(car) gives background traffic dark windows (no interior needed).
import { THREE, V3, canvas, ctex, GLASS_LAYER } from './core.js';
import { M, paint, flat, box, plateTex, puffTex } from './materials.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const COUPE = {
  halfW: 0.86, wheelR: 0.32, wheelX: [1.28, -1.25], archR: 0.41, yb: 0.21, belt: 0.9, mirror: [0.84, 0.94], seams: [0.96, -0.26], plate: 'OOPS 1',
  top: [[2.10, 0.21], [2.14, 0.48], [2.06, 0.66], [1.02, 0.86], [0.26, 1.27], [-0.86, 1.28], [-1.56, 0.93], [-2.06, 0.87], [-2.13, 0.50], [-2.08, 0.21]],
  ws: [3, 4], rw: [5, 6],
  windows: [[[0.90, 0.90], [0.27, 1.22], [-0.22, 1.22], [-0.22, 0.92]], [[-0.30, 0.92], [-0.30, 1.22], [-0.82, 1.23], [-1.38, 0.95]]],
};
export const SUV = {
  halfW: 0.95, wheelR: 0.38, wheelX: [1.50, -1.45], archR: 0.47, yb: 0.30, belt: 1.13, mirror: [1.22, 1.18], seams: [1.30, 0.05], plate: 'L8 4WRK',
  top: [[2.36, 0.30], [2.40, 0.72], [2.32, 0.98], [1.38, 1.08], [0.84, 1.72], [-2.12, 1.74], [-2.32, 1.58], [-2.38, 0.72], [-2.33, 0.30]],
  ws: [3, 4], rw: null,
  windows: [[[1.26, 1.13], [0.84, 1.65], [0.10, 1.66], [0.10, 1.15]], [[0.0, 1.15], [0.0, 1.66], [-1.0, 1.67], [-1.0, 1.16]], [[-1.1, 1.16], [-1.1, 1.67], [-2.05, 1.67], [-2.2, 1.17]]],
};
// Interior specs matching COUPE and SUV.
export const IC = { hw: 0.86, floorY: 0.25, fireX: 1.06, rearX: -0.80, shelfLen: 0.76, belt: 0.93, dashX: 0.68, dashY: 0.85, dashY0: 0.58, seatX: -0.15, seatY: 0.40, seatZ: 0.38, roofX: 0.14, roofY: 1.235, roofLen: 1.0, wheel: [0.40, 0.84], wheelR: 0.165, accent: 0xffb300 };
export const IS = { hw: 0.95, floorY: 0.34, fireX: 1.42, rearX: -2.25, shelfLen: 0.02, belt: 1.15, dashX: 1.05, dashY: 1.07, dashY0: 0.80, seatX: 0.22, seatY: 0.62, seatZ: 0.42, roofX: 0.7, roofY: 1.70, roofLen: 2.8, wheel: [0.80, 1.10], wheelR: 0.18, accent: 0x6fd6b5 };

function bandShape(pts, t) {
  const n = pts.length, inner = [];
  for (let i = 0; i < n; i++) {
    let nx = 0, ny = 0;
    if (i > 0) { const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], l = Math.hypot(dx, dy); nx += -dy / l; ny += dx / l; }
    if (i < n - 1) { const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dy); nx += -dy / l; ny += dx / l; }
    const l = Math.hypot(nx, ny); inner.push([pts[i][0] + nx / l * t, pts[i][1] + ny / l * t]);
  }
  const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < n; i++) s.lineTo(pts[i][0], pts[i][1]);
  for (let i = n - 1; i >= 0; i--) s.lineTo(inner[i][0], inner[i][1]);
  s.closePath(); return s;
}
function quad(a, b, zw, mat) { // a,b: [x,y] ; spans z in [-zw, zw]
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([a[0], a[1], -zw, a[0], a[1], zw, b[0], b[1], zw, b[0], b[1], -zw], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return new THREE.Mesh(g, mat);
}
// ------------------------------------------------------------------ realism kit: textures and parts
const TX = {};
function honeycombTex() {
  if (TX.honey) return TX.honey; const c = canvas(256, 128), g = c.getContext('2d'); g.fillStyle = '#0b0b0d'; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = '#3a3c42'; g.lineWidth = 3;
  for (let y = 0; y < 9; y++) for (let x = 0; x < 18; x++) { const cx = x * 15 + (y % 2) * 7.5, cy = y * 14; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6; g.lineTo(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7); } g.closePath(); g.stroke(); }
  return (TX.honey = ctex(c, [3, 1]));
}
function grainTex(seed = 1, base = 128, amp = 40, n = 9000) { // greyscale grain for bump maps (leather, soft-touch plastic)
  const k = 'grain' + seed + base; if (TX[k]) return TX[k];
  const c = canvas(256, 256), g = c.getContext('2d'); g.fillStyle = `rgb(${base},${base},${base})`; g.fillRect(0, 0, 256, 256);
  let r = seed * 9301 + 49297; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) { const v = base + (rnd() - 0.5) * amp; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.arc(rnd() * 256, rnd() * 256, 0.8 + rnd() * 2.2, 0, 7); g.fill(); }
  return (TX[k] = ctex(c, [4, 4]));
}
// pleated, stitched leather for seat inserts: colour map + a bump map with the pleat grooves
function pleatTex(hex, rows = 7) {
  const k = 'pleat' + hex + rows; if (TX[k]) return TX[k];
  const mk = (bump) => { const c = canvas(256, 512), g = c.getContext('2d'), col = '#' + new THREE.Color(hex).getHexString();
    g.fillStyle = bump ? '#bbbbbb' : col; g.fillRect(0, 0, 256, 512);
    const h = 512 / rows;
    for (let i = 0; i < rows; i++) { const y = i * h;
      const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, bump ? 'rgba(40,40,40,0.9)' : 'rgba(0,0,0,0.35)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.0)'); gr.addColorStop(0.5, bump ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.10)'); gr.addColorStop(0.82, 'rgba(255,255,255,0)'); gr.addColorStop(1, bump ? 'rgba(40,40,40,0.9)' : 'rgba(0,0,0,0.35)');
      g.fillStyle = gr; g.fillRect(0, y, 256, h);
      if (!bump) { g.strokeStyle = 'rgba(255,240,220,0.35)'; g.setLineDash([6, 5]); g.lineWidth = 2; g.beginPath(); g.moveTo(0, y + 5); g.lineTo(256, y + 5); g.stroke(); g.setLineDash([]); } }
    return ctex(c); };
  return (TX[k] = { map: mk(false), bump: mk(true) });
}
function leather(hex, rough = 0.55) { return new THREE.MeshStandardMaterial({ color: hex, roughness: rough, bumpMap: grainTex(3, 128, 60), bumpScale: 0.6 }); }
function softTouch(hex) { return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.78, bumpMap: grainTex(7, 128, 30, 14000), bumpScale: 0.35 }); }
const MX = {
  alloy: new THREE.MeshStandardMaterial({ color: 0xc9ced6, roughness: 0.22, metalness: 0.9 }),
  alloyDark: new THREE.MeshStandardMaterial({ color: 0x2a2c31, roughness: 0.35, metalness: 0.7 }),
  disc: new THREE.MeshStandardMaterial({ color: 0x4a4c51, roughness: 0.55, metalness: 0.8 }),
  caliper: new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.4, metalness: 0.3 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.92 }),
  trimBlack: new THREE.MeshStandardMaterial({ color: 0x0d0e10, roughness: 0.35, metalness: 0.2 }),
  lens: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transmission: 0, transparent: true, opacity: 0.35, clearcoat: 1, depthWrite: false }),
  housing: new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.18, metalness: 1 }),
  gloss: new THREE.MeshPhysicalMaterial({ color: 0x0a0b0d, roughness: 0.12, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04, side: THREE.DoubleSide }),
  // tinted, reflective car glass (the cabin still reads through it); tintGlass() swaps it for opaque traffic glass
  carGlass: new THREE.MeshPhysicalMaterial({ color: 0x4a5f73, roughness: 0.02, metalness: 0.2, transparent: true, opacity: 0.42, envMapIntensity: 2.2, clearcoat: 1, side: THREE.FrontSide, depthWrite: false }),
  // the same glass seen from inside the cabin (POV and interior shots): nearly clear, faint reflection
  carGlassIn: new THREE.MeshStandardMaterial({ color: 0x9fb4c6, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.1, envMapIntensity: 0.3, side: THREE.BackSide, depthWrite: false }),
};
// tyre (rounded sidewall, lathe about z) + alloy rim with 5 twin spokes + brake disc. Returns { wheel, caliper }.
function tyreTex() { // bump map for the lathe tyre: u runs around the wheel, v along the profile (sidewall, tread, sidewall)
  if (TX.tyre) return TX.tyre;
  const c = canvas(1024, 128), g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, 1024, 128);
  for (let x = 0; x < 1024; x += 16) { g.fillStyle = '#2a2a2a'; g.fillRect(x, 50, 5, 28); g.fillRect(x + 8, 44, 3, 10); g.fillRect(x + 8, 74, 3, 10); }  // tread blocks
  g.fillStyle = '#3a3a3a'; g.fillRect(0, 58, 1024, 3); g.fillRect(0, 67, 1024, 3);                                                         // circumferential grooves
  for (const y of [22, 106]) for (let x = 0; x < 1024; x += 128) { g.fillStyle = '#9a9a9a'; g.fillRect(x + 20, y - 3, 60, 6); }          // raised sidewall lettering
  const t = ctex(c); t.wrapS = THREE.RepeatWrapping; return (TX.tyre = t);
}
// Tyre with a bulging sidewall, rounded shoulders and tread (lathe about z) + a recessed alloy rim (polished lip, 5 twin
// spokes, dark barrel behind the windows so they read as holes) + brake disc. Returns { wheel, caliper }.
function makeWheel(R, width) {
  const g = new THREE.Group(), rr = R * 0.6, w = width, hw2 = w / 2;
  if (!MX.tyre) MX.tyre = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.88, bumpMap: tyreTex(), bumpScale: 2.2 });
  const prof = [], side = (sgn) => {
    const pts = [[rr + 0.004, hw2 * 0.86], [rr + 0.02, hw2 + 0.004], [rr + (R - rr) * 0.45, hw2 + 0.018], [rr + (R - rr) * 0.8, hw2 + 0.01]];
    return pts.map(([r, z]) => [r, z * sgn]);
  };
  for (const [r, z] of side(-1)) prof.push(new THREE.Vector2(r, z));
  for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI / 2; prof.push(new THREE.Vector2(R - 0.05 - Math.sin(a) * 0.05, -hw2 + 0.05 + Math.cos(a) * 0.05)); } // front shoulder
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; prof.push(new THREE.Vector2(R - 0.05 + Math.sin(a) * 0.05, hw2 - 0.05 - Math.cos(a) * 0.05)); }       // back shoulder
  for (const [r, z] of side(1).reverse()) prof.push(new THREE.Vector2(r, z));
  // lathe sweeps around y with the profile's x as radius; we want the axle along z, so profile = (radius, axial) then rotate
  const tg = new THREE.LatheGeometry(prof.map((v) => new THREE.Vector2(v.x, v.y)), 64); tg.rotateX(Math.PI / 2);
  const ty = new THREE.Mesh(tg, MX.tyre); ty.castShadow = true; ty.receiveShadow = true; g.add(ty);
  const inner = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.9, side: THREE.DoubleSide });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, w - 0.02, 40, 1, true), inner); barrel.rotation.x = Math.PI / 2; g.add(barrel);
  for (const s of [-1, 1]) { const back = new THREE.Mesh(new THREE.CircleGeometry(rr, 40), inner); back.position.z = s * (hw2 - 0.11); if (s < 0) back.rotation.y = Math.PI; g.add(back); }
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(rr * 0.8, rr * 0.8, 0.022, 40), MX.disc); disc.rotation.x = Math.PI / 2; g.add(disc);
  for (const s of [-1, 1]) { const d2 = disc.clone(); d2.position.z = s * (hw2 - 0.095); g.add(d2); }
  // spoke face: rim ring with 10 windows between twin spokes, slightly dished (spokes lean inward toward the hub)
  const face = new THREE.Shape(); face.absarc(0, 0, rr * 0.96, 0, Math.PI * 2, false);
  for (let k = 0; k < 5; k++) for (const off of [-1, 1]) {
    const a0 = (k / 5) * Math.PI * 2, h = new THREE.Path(), r0 = rr * 0.34, r1 = rr * 0.84, half = off < 0 ? [-0.43, -0.1] : [0.1, 0.43];
    h.moveTo(Math.cos(a0 + half[0]) * r1, Math.sin(a0 + half[0]) * r1); h.absarc(0, 0, r1, a0 + half[0], a0 + half[1], false);
    h.lineTo(Math.cos(a0 + half[1] * 0.55) * r0, Math.sin(a0 + half[1] * 0.55) * r0); h.lineTo(Math.cos(a0 + half[0] * 0.55) * r0, Math.sin(a0 + half[0] * 0.55) * r0); h.closePath();
    face.holes.push(h);
  }
  const fg = new THREE.ExtrudeGeometry(face, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.007, bevelSegments: 3, curveSegments: 40 });
  { const p = fg.attributes.position; for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getY(i)); p.setZ(i, p.getZ(i) - 0.035 * (1 - r / rr)); } fg.computeVertexNormals(); }
  const spokeMat = MX.spoke || (MX.spoke = new THREE.MeshStandardMaterial({ color: 0x9da2aa, roughness: 0.28, metalness: 0.95, envMapIntensity: 1.4 }));
  const lipMat = MX.lip || (MX.lip = new THREE.MeshStandardMaterial({ color: 0xe4e7ec, roughness: 0.12, metalness: 1, envMapIntensity: 1.8 }));
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(fg, spokeMat); f.castShadow = true;
    if (s > 0) f.position.z = hw2 - 0.035; else { f.rotation.y = Math.PI; f.position.z = -(hw2 - 0.035); }
    g.add(f);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(rr * 0.98, 0.011, 8, 64), lipMat); lip.position.z = s * (hw2 - 0.01); g.add(lip);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(rr * 0.17, rr * 0.2, 0.03, 24), spokeMat); cap.rotation.x = Math.PI / 2; cap.position.z = s * (hw2 - 0.055); g.add(cap);
    const logo = new THREE.Mesh(new THREE.CircleGeometry(rr * 0.1, 20), MX.trimBlack); logo.position.z = s * (hw2 - 0.038); if (s < 0) logo.rotation.y = Math.PI; g.add(logo);
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + Math.PI / 5, nut = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.02, 6), lipMat); nut.rotation.x = Math.PI / 2; nut.position.set(Math.cos(a) * rr * 0.26, Math.sin(a) * rr * 0.26, s * (hw2 - 0.05)); g.add(nut); }
  }
  const caliper = new THREE.Mesh(new THREE.BoxGeometry(rr * 0.5, rr * 0.36, 0.07), MX.caliper);
  return { wheel: g, caliper };
}
function lightUnit(body, x, y, z, w, h, front, mat, facing) { // housing + emissive element + clear lens, on the car's nose or tail
  const g = new THREE.Group(); g.position.set(x, y, z); body.add(g);
  g.add(box(0.06, h + 0.02, w + 0.02, MX.trimBlack, 0, 0, 0, 0.02));
  if (front) {
    g.add(box(0.02, h * 0.7, w * 0.92, MX.housing, facing * 0.022, 0, 0, 0.01));
    for (const dz of [-w * 0.22, w * 0.22]) { const pj = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.26, h * 0.26, 0.02, 20), mat); pj.rotation.z = Math.PI / 2; pj.position.set(facing * 0.034, 0, dz); g.add(pj); }
    g.add(box(0.012, h * 0.14, w * 0.9, mat, facing * 0.036, -h * 0.36, 0, 0.004));    // LED strip (blooms)
  } else {
    g.add(box(0.02, h * 0.8, w * 0.95, mat, facing * 0.022, 0, 0, 0.012));
    g.add(box(0.012, h * 0.18, w * 0.9, mat, facing * 0.035, h * 0.12, 0, 0.004));
  }
  const lens = box(0.02, h + 0.01, w + 0.01, MX.lens, facing * 0.045, 0, 0, 0.012); lens.castShadow = false; g.add(lens);
  return g;
}
function trimPolygonX(body, x, y, z, w, h, t = 0.008) { for (const [dy, dz, L, vert] of [[h / 2, 0, w, 0], [-h / 2, 0, w, 0], [0, w / 2, h, 1], [0, -w / 2, h, 1]]) body.add(box(0.006, vert ? L : t, vert ? t : L, M.chrome, x, y + dy, z + dz)); }
function trimPolygon(body, pts, z, thick = 0.028, mat = MX.trimBlack) { // thin frame around a window polygon
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const m = box(L + thick, thick, 0.012, mat, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z); m.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]); m.castShadow = false; body.add(m);
  }
}
// ------------------------------------------------------------------ the car body, built like a real car
// A lower body shell (side profile with wheel arches, extruded across the width with big rounded bevels: the hood
// sloping down to the nose, the boot by car type), a separate narrower greenhouse leaning in toward the roof (side
// panels with real window openings, body-coloured A/C pillars, a black B pillar, a crowned roof panel with drip rails),
// glass inset as separate panes (drawn last, GLASS_LAYER), panel gaps (hood, doors, boot), door handles, wraparound
// bumpers, recessed lights and grille, mirrors on stalks, side skirts and belt trim.
function roundedOutline(pts, rad) {   // polyline -> Shape-ready list of [cmd, ...] with every corner rounded
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
    const la = Math.hypot(p[0] - a[0], p[1] - a[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]), r = Math.min(rad, la * 0.45, lb * 0.45);
    const p0 = [p[0] + (a[0] - p[0]) * r / (la || 1), p[1] + (a[1] - p[1]) * r / (la || 1)], p1 = [p[0] + (b[0] - p[0]) * r / (lb || 1), p[1] + (b[1] - p[1]) * r / (lb || 1)];
    out.push([p0, p, p1]);
  }
  return out;
}
function shapeFromRounded(rounded, arches) {   // arches: [{ x, r, y }] cut into the bottom edge (bottom = segment ending at index 0)
  const sh = new THREE.Shape();
  rounded.forEach(([p0, p, p1], i) => { if (i === 0) sh.moveTo(p0[0], p0[1]); else sh.lineTo(p0[0], p0[1]); sh.quadraticCurveTo(p[0], p[1], p1[0], p1[1]); });
  if (arches) for (const ar of arches) { sh.lineTo(ar.x + ar.r, ar.y); sh.absarc(ar.x, ar.cy, ar.r, 0, Math.PI, false); sh.lineTo(ar.x - ar.r, ar.y); }
  sh.closePath();
  return sh;
}
function beam(a, b, w, d, mat, rad = 0.012) {   // a rounded bar from point a to point b (pillars, rails)
  const dir = b.clone().sub(a), L = dir.length(), m = new THREE.Mesh(new RoundedBoxGeometry(L + w * 0.4, w, d, 2, Math.min(rad, w * 0.45, d * 0.45)), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V3(1, 0, 0), dir.normalize()); m.castShadow = true; return m;
}
function glassPane(body, geo) {   // tinted outside, nearly clear from inside, drawn after ink and characters
  for (const mat of [MX.carGlass, MX.carGlassIn]) { const m = new THREE.Mesh(geo, mat); m.layers.set(GLASS_LAYER); body.add(m); }
}
function quadGeo(c, outward) {   // 4 corners (Vector3) -> two triangles facing `outward`
  const g = new THREE.BufferGeometry(); g.setFromPoints([c[0], c[1], c[2], c[0], c[2], c[3]]);
  const n = c[1].clone().sub(c[0]).cross(c[2].clone().sub(c[0]));
  if (n.dot(outward) < 0) g.setFromPoints([c[0], c[2], c[1], c[0], c[3], c[2]]);
  g.computeVertexNormals(); return g;
}
export function makeCar(S, color) {
  const car = new THREE.Group(), body = new THREE.Group(); car.add(body); car.body = body; car.spec = S;
  const P = paint(color), hw = S.halfW, top = S.top, n = top.length, belt = S.belt, yb = S.yb;
  car.paintOuter = P;
  const xs = top.map((p) => p[0]), xf = Math.max(...xs), xr = Math.min(...xs), H = Math.max(...top.map((p) => p[1]));
  const [w0, w1] = S.ws, x3 = top[w0][0], x4 = top[w1][0];
  // ---- split the side profile at the belt: the lower body keeps everything up to the belt (+ a raised boot), the
  // greenhouse everything above it
  const lowCap = belt + 0.07, lower = [], cab = [];
  for (let i = 0; i <= w0; i++) lower.push(top[i]);
  let rearStart = S.rw ? S.rw[1] : -1;
  if (rearStart < 0) for (let i = w1 + 1; i < n; i++) if (top[i][1] <= lowCap) { rearStart = i; break; }
  if (rearStart < 0) rearStart = n - 1;
  const pPrev = top[rearStart - 1], pCur = top[rearStart];
  let rearCut = pCur;
  if (!S.rw && pPrev[1] > lowCap && pCur[1] < belt) { const u = (pPrev[1] - belt) / (pPrev[1] - pCur[1]); rearCut = [pPrev[0] + (pCur[0] - pPrev[0]) * u, belt]; lower.push(rearCut); }
  for (let i = rearStart; i < n; i++) lower.push(top[i]);
  for (let i = w0; i < rearStart; i++) cab.push(top[i]);
  if (!S.rw && rearCut !== pCur) cab.push(rearCut); else cab.push(top[rearStart]);
  // ---- lower body: rounded side profile with arches, extruded across the width with big rounded edges
  const BEV = 0.06, arches = [...S.wheelX].sort((a, b) => a - b).map((x) => ({ x, r: S.archR + BEV, cy: S.wheelR }));   // rear first (the bottom edge runs rear -> front)
  const lowPts = lower.map(([x, y]) => [x + (x > (xf + xr) / 2 ? -BEV : BEV) * (Math.abs(x - (xf + xr) / 2) > 0.3 * (xf - xr) ? 1 : 0.0), y > (yb + belt) / 2 ? y - BEV : y + BEV]);   // the bevel grows it back
  { // the side profile as one outline (bottom edge rear -> front through the arches), then three pieces like a real
    // car: a full-width hood block and rear block, and two side walls around the open cabin (so cameras inside the
    // cabin see the interior, not the inside of a solid)
    const sh = new THREE.Shape(), R = roundedOutline(lowPts, 0.16);
    R.forEach(([p0, p, p1], i) => { if (i === 0) sh.moveTo(p0[0], p0[1]); else sh.lineTo(p0[0], p0[1]); if (i > 0 && i < R.length - 1) sh.quadraticCurveTo(p[0], p[1], p1[0], p1[1]); else sh.lineTo(p[0], p[1]); });
    for (const ar of arches) { sh.lineTo(ar.x - ar.r, yb); sh.lineTo(ar.x - ar.r, ar.cy); sh.absarc(ar.x, ar.cy, ar.r, Math.PI, 0, true); sh.lineTo(ar.x + ar.r, yb); }
    sh.closePath();
    const poly = sh.getPoints(10).map((v) => [v.x, v.y]);
    const clipX = (pts, x0, x1) => {   // Sutherland-Hodgman against x >= x0 and x <= x1
      const side = (pts, keep, edge) => { const out = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], ka = keep(a), kb = keep(b);
        if (ka) out.push(a); if (ka !== kb) { const u = (edge - a[0]) / (b[0] - a[0]); out.push([edge, a[1] + (b[1] - a[1]) * u]); } } return out; };
      return side(side(pts, (p) => p[0] >= x0, x0), (p) => p[0] <= x1, x1);
    };
    const toShape = (pts) => { const q = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? q.lineTo(x, y) : q.moveTo(x, y))); q.closePath(); return q; };
    const block = (pts, depth, z0, bt = BEV * 1.6) => { if (pts.length < 3) return; const g = new THREE.ExtrudeGeometry(toShape(pts), { depth, bevelEnabled: true, bevelThickness: bt, bevelSize: BEV, bevelSegments: 6, curveSegments: 4 });
      g.translate(0, 0, z0); const m = new THREE.Mesh(g, P); m.castShadow = m.receiveShadow = true; body.add(m); return m; };
    const cabFront = x3 - 0.04, cabRear = S.rw ? top[S.rw[1]][0] + 0.04 : S.type === 'pickup' ? cab[cab.length - 1][0] - 0.02 : xr + 0.2;
    const inner = 2 * hw - 2 * BEV * 1.6;
    block(clipX(poly, cabFront, 99), inner, -(hw - BEV * 1.6));          // hood, nose, front wings
    block(clipX(poly, -99, cabRear), inner, -(hw - BEV * 1.6));          // boot / rear
    const WALL = 0.03, WB = 0.025;   // thin door walls: outer face at the body side, the cabin keeps its full width
    for (const s of [-1, 1]) block(clipX(poly, cabRear - 0.02, cabFront + 0.02), WALL, s > 0 ? hw - WB - WALL : -(hw - WB), WB);
    car.cabin = [cabRear, cabFront];
  }
  // ---- greenhouse: tilted side panels with window openings, pillars, roof, drip rails
  const roofRear = [...cab].reverse().find((p) => p[1] >= H - 0.02) || cab[cab.length - 2];
  const gwB = hw - 0.07, gwT = hw - 0.2, gz = (y) => gwB - (gwB - gwT) * clamp01((y - belt) / Math.max(0.05, H - belt));
  const cabShape = new THREE.Shape(); cabShape.moveTo(cab[0][0] + 0.02, belt - 0.02); for (const [x, y] of cab) cabShape.lineTo(x, Math.max(y, belt - 0.02)); cabShape.lineTo(cab[cab.length - 1][0], belt - 0.02); cabShape.closePath();
  for (const w of S.windows) { const h = new THREE.Path(); h.moveTo(w[0][0], w[0][1]); for (let i = 1; i < w.length; i++) h.lineTo(w[i][0], w[i][1]); h.closePath(); cabShape.holes.push(h); }
  const tilt = (g, s, inset = 0) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, s * (gz(p.getY(i)) - inset)); if (s < 0) { const ix = g.index; if (ix) { const a = ix.array; for (let k = 0; k < a.length; k += 3) { const t = a[k + 1]; a[k + 1] = a[k + 2]; a[k + 2] = t; } ix.needsUpdate = true; } } g.computeVertexNormals(); return g; };
  const panelMat = paint(color); panelMat.side = THREE.DoubleSide;
  for (const s of [-1, 1]) {
    const pm = new THREE.Mesh(tilt(new THREE.ShapeGeometry(cabShape, 16), s), panelMat); pm.castShadow = true; body.add(pm);
    for (const w of S.windows) {   // side glass, a hair inside the opening, with a black frame
      const sh = new THREE.Shape(); sh.moveTo(w[0][0], w[0][1]); for (let i = 1; i < w.length; i++) sh.lineTo(w[i][0], w[i][1]); sh.closePath();
      glassPane(body, tilt(new THREE.ShapeGeometry(sh), s, 0.012));
      for (let i = 0; i < w.length; i++) { const a = w[i], b = w[(i + 1) % w.length]; body.add(beam(V3(a[0], a[1], s * (gz(a[1]) + 0.004)), V3(b[0], b[1], s * (gz(b[1]) + 0.004)), 0.022, 0.016, MX.trimBlack, 0.006)); }
    }
    // A pillar (windshield edge), C/D pillar (rear edge), roof side rail: body-coloured bars give the cab its thickness
    const A0 = V3(x3 + 0.02, belt + 0.01, s * (gz(belt) - 0.01)), A1 = V3(x4, H - 0.02, s * (gz(H) - 0.01));
    body.add(beam(A0, A1, 0.075, 0.06, P, 0.025));
    const rEnd = cab[cab.length - 1], rTop = cab[S.rw ? cab.length - 2 : Math.max(1, cab.length - 2)];
    const C0 = V3(rTop[0], rTop[1] - 0.02, s * (gz(rTop[1]) - 0.01)), C1 = V3(rEnd[0] + 0.03, Math.max(rEnd[1], belt) + 0.01, s * (gz(Math.max(rEnd[1], belt)) - 0.01));
    body.add(beam(C0, C1, 0.09, 0.06, P, 0.025));
    body.add(beam(V3(x4, H - 0.01, s * (gz(H) - 0.005)), V3(rTop[0], H - 0.01, s * (gz(H) - 0.005)), 0.05, 0.05, P, 0.02));   // roof rail
    // B pillar (between the doors) in gloss black, and the chrome belt line under the windows
    if (S.windows.length > 1) { const w = S.windows[1], bx = (S.windows[0][3][0] + w[0][0]) / 2; body.add(beam(V3(bx, belt + 0.02, s * (gz(belt) + 0.003)), V3(bx + 0.03, H - 0.05, s * (gz(H - 0.05) + 0.003)), 0.07, 0.02, MX.gloss, 0.008)); }
    body.add(beam(V3(x3 - 0.02, belt + 0.012, s * (gz(belt) + 0.008)), V3(rEnd[0] + 0.04, belt + 0.012, s * (gz(belt) + 0.008)), 0.018, 0.012, M.chrome, 0.005));
  }
  // roof panel: crowned, spans the rails
  { const L = Math.max(0.3, x4 - roofRear[0]), g = new RoundedBoxGeometry(L + 0.05, 0.05, 2 * gz(H) + 0.02, 3, 0.02);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setY(i, p.getY(i) + 0.035 * (1 - (p.getZ(i) / gz(H)) ** 2)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, panelMat); m.position.set(x4 - L / 2 - 0.0, H - 0.03, 0); m.castShadow = true; body.add(m);
    const lin = new THREE.Mesh(new THREE.PlaneGeometry(L + 0.04, 2 * gz(H) - 0.02), MX.headliner || (MX.headliner = new THREE.MeshStandardMaterial({ color: 0x8e8a84, roughness: 1, side: THREE.DoubleSide })));
    lin.rotation.x = Math.PI / 2; lin.position.set(x4 - L / 2, H - 0.058, 0); body.add(lin); car.innerLiner = lin.material = lin.material.clone(); }
  // windshield and rear glass, inset between the pillars, with a black seal and the cowl
  const wsC = [V3(x3 + 0.03, belt + 0.03, -(gz(belt) - 0.05)), V3(x3 + 0.03, belt + 0.03, gz(belt) - 0.05), V3(x4 - 0.01, H - 0.03, gz(H) - 0.05), V3(x4 - 0.01, H - 0.03, -(gz(H) - 0.05))];
  glassPane(body, quadGeo(wsC, V3(1, 0.6, 0)));
  for (let i = 0; i < 4; i++) body.add(beam(wsC[i], wsC[(i + 1) % 4], 0.03, 0.012, MX.trimBlack, 0.006));
  body.add(beam(V3(x3 + 0.02, belt + 0.02, -(gz(belt) - 0.02)), V3(x3 + 0.02, belt + 0.02, gz(belt) - 0.02), 0.05, 0.04, MX.trimBlack, 0.012));   // cowl
  { const rTop = roofRear, rEnd = cab[cab.length - 1], yE = Math.max(rEnd[1], belt) + 0.03, yT = rTop[1] - 0.03;
    const rc = [V3(rTop[0] - 0.01, yT, gz(yT) - 0.05), V3(rTop[0] - 0.01, yT, -(gz(yT) - 0.05)), V3(rEnd[0] + 0.03, yE, -(gz(yE) - 0.05)), V3(rEnd[0] + 0.03, yE, gz(yE) - 0.05)];
    if (rTop[0] - rEnd[0] > 0.05 || yT - yE > 0.1) { glassPane(body, quadGeo(rc, V3(-1, 0.5, 0))); for (let i = 0; i < 4; i++) body.add(beam(rc[i], rc[(i + 1) % 4], 0.03, 0.012, MX.trimBlack, 0.006)); } }
  // ---- panel gaps: hood (along the fenders and across the nose), boot, doors; door handles
  const topAt = (x) => { for (let i = 0; i < w0; i++) { const a = top[i + 1], b = top[i]; if ((x - a[0]) * (x - b[0]) <= 0 && a[0] !== b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return belt; };
  const seamMat = MX.seam || (MX.seam = new THREE.MeshBasicMaterial({ color: 0x101114 }));
  const seamTube = (pts) => body.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(8, pts.length * 3), 0.005, 4, false), seamMat));
  const hx0 = top[2][0] - 0.02;
  for (const s of [-1, 1]) { const pts = []; for (let k = 0; k <= 10; k++) { const x = x3 - 0.03 + (hx0 - x3 + 0.03) * k / 10; pts.push(V3(x, topAt(x) + 0.055, s * (hw - 0.17))); } seamTube(pts); }
  { const pts = []; for (let k = 0; k <= 8; k++) { const z = -(hw - 0.17) + 2 * (hw - 0.17) * k / 8; pts.push(V3(hx0, topAt(hx0) + 0.05, z)); } seamTube(pts); }
  if (S.rw) { const bx = top[S.rw[1]][0] - 0.03, y = top[S.rw[1]][1] + 0.05; const pts = []; for (let k = 0; k <= 8; k++) pts.push(V3(bx, y, -(hw - 0.16) + 2 * (hw - 0.16) * k / 8)); seamTube(pts); }
  for (const s of [-1, 1]) {
    for (const dx of S.seams) seamTube([V3(dx, yb + 0.12, s * (hw + 0.003)), V3(dx + 0.01, (yb + belt) / 2, s * (hw + 0.006)), V3(dx + 0.02, belt + 0.02, s * (hw - 0.01))]);
    const doors = S.windows.length > 1 ? [S.seams[1] - 0.16, S.windows[S.windows.length - 1][3][0] + 0.02] : [S.seams[0] - 0.3];
    for (const hx of doors) body.add(box(0.12, 0.028, 0.025, M.chrome, hx, belt - 0.1, s * (hw + 0.012), 0.01));
    body.add(box(S.wheelX[0] - S.wheelX[1] - 2 * S.archR - 0.08, 0.07, 0.035, MX.trimBlack, (S.wheelX[0] + S.wheelX[1]) / 2, yb + 0.06, s * (hw - 0.005), 0.02));   // side skirt
  }
  // ---- wheels and arch liners
  car.wheels = [];
  const archG = new THREE.CylinderGeometry(S.archR + 0.005, S.archR + 0.005, 0.36, 28, 1, true, Math.PI / 2, Math.PI); archG.rotateX(Math.PI / 2);
  const archMat = new THREE.MeshStandardMaterial({ color: 0x101012, roughness: 1, side: THREE.DoubleSide });
  for (const wx of S.wheelX) for (const s of [-1, 1]) {
    const { wheel: wg, caliper } = makeWheel(S.wheelR, 0.24); wg.position.set(wx, S.wheelR, s * (hw - 0.13));
    car.add(wg); car.wheels.push(wg);
    caliper.position.set(wx + S.wheelR * 0.28, S.wheelR + S.wheelR * 0.2, s * (hw - 0.13) - s * 0.05); car.add(caliper);
    const ar = new THREE.Mesh(archG, archMat); ar.position.set(wx, S.wheelR, s * (hw - 0.2)); body.add(ar);
    const cap = new THREE.Mesh(new THREE.CircleGeometry(S.archR + 0.01, 24), archMat); cap.position.set(wx, S.wheelR, s * (hw - 0.38)); body.add(cap);
  }
  // ---- bumpers (wraparound, body colour with a black lower lip), grille, lights, plates, mirrors
  const hy = (top[1][1] + top[2][1]) / 2 + 0.005, ty2 = S.rw ? top[S.rw[1]][1] - 0.13 : belt - 0.07;
  car.bumperF = new THREE.Group(); car.bumperF.position.set(xf - 0.02, yb + 0.13, 0); body.add(car.bumperF);
  car.bumperF.add(box(0.2, 0.2, 2 * hw + 0.03, P, 0, 0, 0, 0.07)); car.bumperF.add(box(0.16, 0.07, 2 * hw - 0.1, MX.trimBlack, 0.04, -0.08, 0, 0.03));
  car.bumperF.add(box(0.02, 0.05, 2 * hw - 0.7, MX.trimBlack, 0.1, 0.02, 0, 0.015));
  car.bumperR = new THREE.Group(); car.bumperR.position.set(xr + 0.02, yb + 0.13, 0); body.add(car.bumperR);
  car.bumperR.add(box(0.2, 0.2, 2 * hw + 0.03, P, 0, 0, 0, 0.07)); car.bumperR.add(box(0.16, 0.07, 2 * hw - 0.1, MX.trimBlack, -0.04, -0.08, 0, 0.03));
  { const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 14, 1, true), M.chrome); ex.rotation.z = Math.PI / 2; ex.position.set(-0.08, -0.1, -(hw - 0.35)); car.bumperR.add(ex); }
  { const gr = new THREE.Mesh(new THREE.PlaneGeometry(2 * hw - 0.95, 0.14), new THREE.MeshStandardMaterial({ map: honeycombTex(), roughness: 0.5, metalness: 0.3 })); gr.position.set(xf - 0.055, hy - 0.01, 0); gr.rotation.y = Math.PI / 2; body.add(gr);
    body.add(box(0.03, 0.18, 2 * hw - 0.88, MX.housing, xf - 0.07, hy - 0.01, 0, 0.03)); body.add(box(0.04, 0.15, 2 * hw - 0.95, MX.trimBlack, xf - 0.075, hy - 0.01, 0, 0.02)); }
  const hl = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6dc, emissiveIntensity: 2.4, roughness: 0.2 });
  car.head = hl;
  car.tail = new THREE.MeshStandardMaterial({ color: 0xc81222, emissive: 0xff1a22, emissiveIntensity: 0.25, roughness: 0.3 });
  for (const s of [-1, 1]) {
    lightUnit(body, xf - 0.06, hy, s * (hw - 0.24), 0.36, 0.11, true, hl, 1);
    lightUnit(body, xr + 0.06, ty2, s * (hw - 0.25), 0.42, 0.11, false, car.tail, -1);
    { const mg = new THREE.Group(); mg.position.set(S.mirror[0], S.mirror[1], s * (gz(belt) + 0.02)); body.add(mg);
      mg.add(box(0.07, 0.03, 0.12, MX.trimBlack, 0, -0.01, s * 0.05, 0.012));
      mg.add(box(0.13, 0.09, 0.17, P, -0.01, 0.03, s * 0.15, 0.04));
      mg.add(box(0.012, 0.07, 0.14, M.chrome, -0.076, 0.03, s * 0.15, 0.01)); }
  }
  const pl = (tex, x, y, rot) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.17), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })); m.position.set(x, y, 0); m.rotation.y = rot; body.add(m); };
  pl(plateTex(S.plate, '#f4f1e6', '#1d2a55'), xf + 0.085, yb + 0.12, Math.PI / 2);
  pl(plateTex(S.plate, '#f4f1e6', '#1d2a55'), xr - 0.085, yb + 0.12, -Math.PI / 2);
  // ---- glow sprites (brake lights)
  car.glow = [];
  for (const s of [-1, 1]) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: 0xff2a2a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); sp.position.set(xr - 0.01, ty2, s * (hw - 0.27)); sp.scale.setScalar(0.9); body.add(sp); car.glow.push(sp); }
  // pickup bed walls and tailgate
  if (S.type === 'pickup') {
    const bi = top.findIndex((p, i) => i > w1 + 1 && Math.abs(p[1] - (belt + 0.05)) < 1e-6);
    if (bi > 0 && top[bi + 1]) { const bx0 = top[bi][0], bx1 = top[bi + 1][0], by = top[bi][1];
      for (const s of [-1, 1]) body.add(box(bx0 - bx1, 0.16, 0.05, P, (bx0 + bx1) / 2, by + 0.08, s * (hw - 0.04), 0.02));
      body.add(box(0.05, 0.16, 2 * hw - 0.06, P, bx1 + 0.03, by + 0.08, 0, 0.02)); body.add(box(bx0 - bx1, 0.01, 2 * hw - 0.12, MX.trimBlack, (bx0 + bx1) / 2, by + 0.005, 0)); }
  }
  return car;
}
const clamp01 = (x) => Math.max(0, Math.min(1, x));
// Turn wheels for distance travelled (metres).
export function rollWheels(car, dist) { for (const w of car.wheels) w.rotation.z = -dist / car.spec.wheelR; }
// Brake lights on/off.
export function brakeLights(car, on) { car.tail.emissiveIntensity = on ? 3.0 : 0.25; for (const g of car.glow) g.material.opacity = on ? 0.55 : 0; }

let tinted;
export function tintGlass(car) {
  const tm = () => tinted || (tinted = new THREE.MeshStandardMaterial({ color: 0x1b2836, roughness: 0.08, metalness: 0.2, side: THREE.DoubleSide }));
  const isG = (x) => x === M.glass || x === MX.carGlass || x === MX.carGlassIn;
  car.traverse((m) => { if (isG(m.material)) m.material = tm(); else if (Array.isArray(m.material)) m.material = m.material.map((x) => (isG(x) ? tm() : x)); });
  return car;
}

export function wheelRig(center, normal, R) {
  const g = new THREE.Group(); g.position.copy(center); g.quaternion.setFromUnitVectors(V3(0, 0, 1), normal.clone().normalize());
  const wl = leather(0x1b1b1e, 0.48);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, R * 0.135, 14, 56), wl); rim.castShadow = true; g.add(rim);
  for (const [a, L] of [[0, R * 0.9], [Math.PI, R * 0.9], [-Math.PI / 2, R * 0.86]]) {
    const sp = box(L, R * 0.22, 0.03, MX.alloyDark, Math.cos(a) * L / 2, Math.sin(a) * L / 2, -0.005, 0.01); sp.rotation.z = a; g.add(sp);
    const st = box(L * 0.7, R * 0.05, 0.034, M.chrome, Math.cos(a) * L * 0.55, Math.sin(a) * L * 0.55, -0.003, 0.005); st.rotation.z = a; g.add(st);
  }
  g.add(box(R * 0.78, R * 0.6, 0.07, wl, 0, -R * 0.05, 0.01, 0.025));
  const logo = new THREE.Mesh(new THREE.CircleGeometry(R * 0.11, 20), M.chrome); logo.position.set(0, -R * 0.03, 0.047); g.add(logo);
  for (const [dx, col] of [[-0.62, 0x2a2c31], [0.62, 0x2a2c31]]) for (let k = 0; k < 3; k++) g.add(box(R * 0.09, R * 0.07, 0.012, flat(col, 0.4), R * dx + (k - 1) * R * 0.1, R * 0.02, 0.022, 0.006));
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), M.dark); col.rotation.x = Math.PI / 2; col.position.z = -0.21; g.add(col);
  const e1 = V3(0, 0, 1), e2 = normal.clone().normalize().cross(e1).normalize();
  g.rimPoint = (a) => center.clone().addScaledVector(e1, R * Math.cos(a)).addScaledVector(e2, R * Math.sin(a));
  return g;
}
// Modern cluster like the reference: two dials with glowing blue rings, white ticks, red needles, a small centre screen.
export function glowGaugeTex() {
  const c = canvas(768, 288), g = c.getContext('2d'); g.fillStyle = '#05070c'; g.fillRect(0, 0, 768, 288);
  for (const [cx, a] of [[200, -0.3], [568, 0.7]]) {
    const gr = g.createRadialGradient(cx, 150, 70, cx, 150, 130); gr.addColorStop(0, 'rgba(40,140,255,0)'); gr.addColorStop(0.75, 'rgba(40,160,255,0.55)'); gr.addColorStop(1, 'rgba(40,160,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, 150, 130, 0, 7); g.fill();
    g.strokeStyle = '#3fb4ff'; g.lineWidth = 7; g.beginPath(); g.arc(cx, 150, 112, Math.PI * 0.72, Math.PI * 2.28); g.stroke();
    g.strokeStyle = '#eef4ff'; for (let i = 0; i <= 24; i++) { const an = Math.PI * 0.75 + i * Math.PI * 1.5 / 24, L = i % 3 ? 10 : 20; g.lineWidth = i % 3 ? 2 : 4; g.beginPath(); g.moveTo(cx + Math.cos(an) * (100 - L), 150 + Math.sin(an) * (100 - L)); g.lineTo(cx + Math.cos(an) * 100, 150 + Math.sin(an) * 100); g.stroke(); }
    g.fillStyle = '#eef4ff'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center';
    for (let i = 0; i <= 8; i++) { const an = Math.PI * 0.75 + i * Math.PI * 1.5 / 8; g.fillText(String(i * (cx < 300 ? 1 : 20)), cx + Math.cos(an) * 66, 158 + Math.sin(an) * 66); }
    g.strokeStyle = '#ff2a2a'; g.lineWidth = 6; g.shadowColor = '#ff2a2a'; g.shadowBlur = 12; g.beginPath(); g.moveTo(cx, 150); g.lineTo(cx + Math.cos(a - 1.6) * 92, 150 + Math.sin(a - 1.6) * 92); g.stroke(); g.shadowBlur = 0;
    g.fillStyle = '#1a1d24'; g.beginPath(); g.arc(cx, 150, 18, 0, 7); g.fill();
  }
  g.fillStyle = '#0d1a2e'; g.fillRect(330, 80, 108, 130); g.fillStyle = '#9fd4ff'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.fillText('D', 384, 140); g.font = '20px sans-serif'; g.fillText('21°C', 384, 180);
  return ctex(c);
}
function ventTex() {
  if (TX.vent) return TX.vent; const c = canvas(128, 64), g = c.getContext('2d'); g.fillStyle = '#08090b'; g.fillRect(0, 0, 128, 64);
  for (let y = 6; y < 64; y += 9) { g.fillStyle = '#3a3d44'; g.fillRect(4, y, 120, 4); g.fillStyle = '#5a5e66'; g.fillRect(4, y, 120, 1); }
  return (TX.vent = ctex(c));
}
function speakerTex() {
  if (TX.spk) return TX.spk; const c = canvas(128, 128), g = c.getContext('2d'); g.fillStyle = '#16171a'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill();
  g.fillStyle = '#2c2e33'; for (let y = 8; y < 128; y += 8) for (let x = 8; x < 128; x += 8) if ((x - 64) ** 2 + (y - 64) ** 2 < 54 ** 2) { g.beginPath(); g.arc(x + (y % 16 ? 4 : 0), y, 2, 0, 7); g.fill(); }
  return (TX.spk = ctex(c));
}
function stickerTex() {
  if (TX.stk) return TX.stk; const c = canvas(128, 96), g = c.getContext('2d'); g.fillStyle = '#f2d43a'; g.fillRect(0, 0, 128, 96); g.fillStyle = '#1a1a1a';
  g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.fillText('! WARNING', 64, 24); g.font = '10px sans-serif'; for (let i = 0; i < 5; i++) g.fillRect(14, 36 + i * 11, 100 - (i % 2) * 24, 4);
  return (TX.stk = ctex(c));
}
export function gaugeTex() {
  const c = canvas(512, 192), g = c.getContext('2d'); g.fillStyle = '#0c0d12'; g.fillRect(0, 0, 512, 192);
  for (const [cx, col, a] of [[140, '#ff8a2a', -0.4], [372, '#3fd0ff', 0.9]]) {
    g.strokeStyle = '#dfe6f0'; g.lineWidth = 6; g.beginPath(); g.arc(cx, 100, 74, 0, 7); g.stroke();
    g.lineWidth = 4; for (let i = 0; i <= 10; i++) { const an = Math.PI * 0.8 + i * Math.PI * 1.4 / 10; g.beginPath(); g.moveTo(cx + Math.cos(an) * 58, 100 + Math.sin(an) * 58); g.lineTo(cx + Math.cos(an) * 70, 100 + Math.sin(an) * 70); g.stroke(); }
    g.strokeStyle = col; g.lineWidth = 8; g.beginPath(); g.moveTo(cx, 100); g.lineTo(cx + Math.cos(a - 1.6) * 60, 100 + Math.sin(a - 1.6) * 60); g.stroke();
    g.fillStyle = col; g.beginPath(); g.arc(cx, 100, 10, 0, 7); g.fill();
  }
  return ctex(c);
}
function screenTex() {
  const c = canvas(384, 224), g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 384, 224); gr.addColorStop(0, '#1b2a6b'); gr.addColorStop(1, '#0d5c8f'); g.fillStyle = gr; g.fillRect(0, 0, 384, 224);
  g.fillStyle = '#fff'; g.font = 'bold 34px sans-serif'; g.fillText('Road Mix', 28, 58); g.font = '22px sans-serif'; g.fillStyle = '#bfe3ff'; g.fillText('Track 4  of 12', 28, 92);
  g.fillStyle = '#ffd23f'; for (let i = 0; i < 14; i++) g.fillRect(28 + i * 24, 190 - (20 + ((i * 37) % 70)), 14, 20 + ((i * 37) % 70));
  return ctex(c);
}
function phoneTex() {
  const c = canvas(256, 512), g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 256, 512); gr.addColorStop(0, '#ff7ab8'); gr.addColorStop(0.5, '#8a5cff'); gr.addColorStop(1, '#2b2f9e'); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 84px sans-serif'; g.fillText('7:42', 128, 170); g.font = '26px sans-serif'; g.fillText('Thursday 12', 128, 212);
  g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(24, 300, 208, 70); g.fillStyle = '#fff'; g.font = '22px sans-serif'; g.fillText('2 new messages', 128, 343);
  return ctex(c);
}
export function addInterior(car, I, detail) {
  const b = car.body, hw = I.hw, fy = I.floorY;
  const SEAT = leather(I.seat ?? 0x2b2c31, I.seat ? 0.62 : 0.5), TRIM = softTouch(I.trim ?? 0x2e3036), LINER = new THREE.MeshStandardMaterial({ color: I.liner ?? 0x8e8a84, roughness: 1, bumpMap: grainTex(11, 140, 50, 20000), bumpScale: 0.5 });
  const props = detail === true || (detail && detail.props);
  b.add(box(0.04, I.dashY - fy + 0.02, 2 * hw - 0.1, M.dark, I.fireX, (I.dashY + fy) / 2, 0));
  b.add(box(0.04, I.belt - fy, 2 * hw - 0.1, M.dark, I.rearX, (I.belt + fy) / 2, 0));
  b.add(box(I.shelfLen, 0.03, 2 * hw - 0.1, M.dark, I.rearX - I.shelfLen / 2, I.belt - 0.01, 0));
  b.add(box(I.fireX - I.rearX, 0.012, 2 * hw - 0.12, M.mat, (I.fireX + I.rearX) / 2, fy + 0.006, 0));
  { const sh = new THREE.Shape(), x0 = I.dashX, x1 = I.fireX, y0 = I.dashY0, y1 = I.dashY;
    sh.moveTo(x1, y0 - 0.04); sh.lineTo(x1, y1 + 0.02); sh.quadraticCurveTo((x0 + x1) / 2, y1 + 0.05, x0 + 0.06, y1 + 0.01); sh.quadraticCurveTo(x0 - 0.04, y1 - 0.01, x0 - 0.02, y1 - 0.08);
    sh.quadraticCurveTo(x0 + 0.02, (y0 + y1) / 2, x0 + 0.05, y0); sh.closePath();
    const dg = new THREE.ExtrudeGeometry(sh, { depth: 2 * hw - 0.14, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 3, curveSegments: 14 }); dg.translate(0, 0, -(hw - 0.07));
    const dash = new THREE.Mesh(dg, TRIM); dash.castShadow = dash.receiveShadow = true; b.add(dash);
    const pl = I.wood ? new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.45 }) : new THREE.MeshStandardMaterial({ color: 0x8d939c, roughness: 0.25, metalness: 0.9 });
    b.add(box(0.015, 0.03, 2 * hw - 0.2, pl, x0 - 0.022, y1 - 0.075, 0, 0.006)); }   // trim strip across the dash
  // A-pillars along the windshield, both sides
  const loft = car.spec && car.spec.loft !== false;   // the lofted body has its own gloss pillars (seen from inside too)
  if (car.innerLiner) car.innerLiner.color.set(I.liner ?? 0x8e8a84);
  if (!loft) { const a = [I.fireX - 0.02, I.belt + 0.02], c2 = [I.roofX + 0.12, I.roofY - 0.02], L = Math.hypot(c2[0] - a[0], c2[1] - a[1]), ang = Math.atan2(c2[1] - a[1], c2[0] - a[0]);
    for (const s of [-1, 1]) { const pm = box(L, 0.08, 0.07, TRIM, (a[0] + c2[0]) / 2, (a[1] + c2[1]) / 2, s * (hw * 0.84 - 0.05), 0.02); pm.rotation.z = ang; b.add(pm); } }
  const accent = new THREE.MeshStandardMaterial({ color: I.accent, roughness: 0.6 });
  const PT = pleatTex(I.accent), INSERT = new THREE.MeshStandardMaterial({ color: 0xffffff, map: PT.map, bumpMap: PT.bump, bumpScale: 2.0, roughness: 0.55 });
  for (const s of [-1, 1]) {
    const z = s * I.seatZ;
    b.add(box(0.50, 0.14, 0.50, SEAT, I.seatX, I.seatY - 0.01, z, 0.06));
    for (const bz of [-0.205, 0.205]) b.add(box(0.46, 0.09, 0.1, SEAT, I.seatX + 0.01, I.seatY + 0.065, z + bz, 0.045));
    b.add(box(0.38, 0.02, 0.3, INSERT, I.seatX + 0.02, I.seatY + 0.07, z, 0.008));
    const bk = new THREE.Group(); bk.position.set(I.seatX - 0.31, I.seatY + 0.36, z); bk.rotation.z = 0.2; b.add(bk);
    bk.add(box(0.13, 0.64, 0.48, SEAT, 0, 0, 0, 0.06));
    for (const bz of [-0.2, 0.2]) bk.add(box(0.17, 0.56, 0.1, SEAT, 0.03, -0.02, bz, 0.045));
    bk.add(box(0.02, 0.46, 0.27, INSERT, 0.072, -0.02, 0, 0.008));
    bk.add(box(0.11, 0.18, 0.27, SEAT, -0.03, 0.43, 0, 0.05));
    for (const pz of [-0.07, 0.07]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8), M.chrome); post.position.set(-0.03, 0.33, pz); bk.add(post); }
    b.add(box(I.fireX - I.rearX - 0.05, I.belt - fy - 0.04, 0.04, TRIM, (I.fireX + I.rearX) / 2, (I.belt + fy) / 2, s * (hw - 0.075)));
    if (detail) { b.add(box(0.5, 0.06, 0.07, SEAT, I.seatX + 0.15, I.seatY + 0.22, s * (hw - 0.12), 0.02)); b.add(box(0.9, 0.035, 0.012, accent, I.seatX + 0.25, I.belt - 0.13, s * (hw - 0.098)));
      b.add(box(0.1, 0.03, 0.02, M.chrome, I.seatX + 0.42, I.belt - 0.08, s * (hw - 0.1), 0.01));
      { const sp = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), new THREE.MeshStandardMaterial({ map: speakerTex(), roughness: 0.7 })); sp.position.set(I.seatX + 0.45, I.floorY + 0.18, s * (hw - 0.096)); sp.rotation.y = s > 0 ? Math.PI : 0; b.add(sp); }
      const vz = box(0.17, 0.014, loft ? 0.34 : 0.40, LINER, I.roofX - (loft ? 0.12 : 0), I.roofY - (loft ? 0.07 : 0.035), z * (loft ? 0.9 : 1), 0.006); vz.rotation.z = -0.5; b.add(vz);   // sun visors stay inside the roof
      if (s < 0) { const st = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.075), new THREE.MeshStandardMaterial({ map: stickerTex(), roughness: 0.6 })); st.rotation.x = Math.PI / 2; st.position.set(0, -0.009, 0.06); vz.add(st); } }
  }
  if (loft) b.add(box(Math.max(0.3, I.roofLen - 0.2), 0.012, 2 * hw * 0.64, LINER, I.roofX - I.roofLen / 2 + 0.02, I.roofY - 0.06, 0));   // headliner tucked inside the crowned roof
  else b.add(box(I.roofLen, 0.012, 2 * hw * 0.78, LINER, I.roofX - I.roofLen / 2 + 0.12, I.roofY - 0.03, 0));
  const wr = wheelRig(V3(I.wheel[0], I.wheel[1], -I.seatZ), V3(-0.9, 0.42, 0), I.wheelR); b.add(wr); car.wheelRig = wr;
  if (detail) {
    b.add(box(0.72, 0.24, 0.2, TRIM, I.seatX - 0.05, fy + 0.12, 0, 0.03));
    { const knob = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 12), leather(0x18181b, 0.45)); knob.position.set(I.seatX + 0.2, fy + 0.33, 0); b.add(knob);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.011, 0.08, 10), M.chrome); stem.position.set(I.seatX + 0.2, fy + 0.285, 0); b.add(stem);
      b.add(box(0.12, 0.012, 0.09, M.chrome, I.seatX + 0.2, fy + 0.245, 0, 0.004)); }
    // seatbelt across the driver (car.seatbelt; hide it with car.seatbelt.visible = false)
    { const belt = new THREE.Group(), A = V3(I.seatX - 0.3, I.belt + 0.42, -hw + 0.13), B2 = V3(I.seatX + 0.06, I.seatY + 0.16, -I.seatZ + 0.21), d = B2.clone().sub(A);
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.012, d.length(), 0.055), new THREE.MeshStandardMaterial({ color: 0x2a2b2f, roughness: 0.9 }));
      strap.position.copy(A).add(B2).multiplyScalar(0.5); strap.quaternion.setFromUnitVectors(V3(0, 1, 0), d.clone().normalize()); belt.add(strap);
      belt.add(box(0.06, 0.03, 0.05, M.chrome, B2.x, B2.y, B2.z, 0.006)); b.add(belt); car.seatbelt = belt; }
    { // carpet: dark, fine-grained, with a rubber driver's mat
      const fm = box(I.fireX - I.rearX - 0.1, 0.01, 2 * hw - 0.2, new THREE.MeshStandardMaterial({ color: I.carpet ?? 0x2c2d33, roughness: 1, bumpMap: grainTex(13, 120, 70, 30000), bumpScale: 1.2 }), (I.fireX + I.rearX) / 2, fy + 0.018, 0); fm.castShadow = false; b.add(fm);
      const mat = box(0.55, 0.008, 0.42, new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.85, bumpMap: honeycombTex(), bumpScale: 1.5 }), I.fireX - 0.38, fy + 0.026, -I.seatZ, 0.02); mat.castShadow = false; b.add(mat); }
    if (props) { const cg = new THREE.CylinderGeometry(0.033, 0.033, 0.12, 20); cg.rotateX(Math.PI / 2);
      const cc = canvas(128, 64), g = cc.getContext('2d'); g.fillStyle = '#e8362c'; g.fillRect(0, 0, 128, 64); g.fillStyle = '#fff'; g.fillRect(0, 22, 128, 16); g.fillStyle = '#e8362c'; g.fillRect(20, 26, 40, 8);
      car.can = new THREE.Mesh(cg, [new THREE.MeshStandardMaterial({ map: ctex(cc), roughness: 0.3, metalness: 0.5 }), M.chrome, M.chrome]); car.can.castShadow = true; b.add(car.can); }
    b.add(box(0.12, 0.11, 0.40, M.trim, I.dashX + 0.02, I.dashY + 0.035, -I.seatZ, 0.03));
    const gmM = new THREE.MeshBasicMaterial({ map: I.analog ? analogTex() : glowGaugeTex(), toneMapped: false }); if (!I.analog) gmM.color.setScalar(1.7);   // > 1: the rings bloom
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.158), gmM); gm.position.set(I.dashX - 0.045, I.dashY + 0.03, -I.seatZ); gm.rotation.y = -Math.PI / 2; b.add(gm);
    b.add(box(0.14, 0.035, 0.44, TRIM, I.dashX + 0.02, I.dashY + 0.11, -I.seatZ, 0.015));   // hood over the gauges
    if (I.wood) { const wm = new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.5 }); b.add(box(0.02, 0.05, 2 * hw - 0.16, wm, I.dashX - 0.008, I.dashY - 0.03, 0)); }
    if (!I.analog) {
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.15), new THREE.MeshBasicMaterial({ map: screenTex(), toneMapped: false })); sm.position.set(I.dashX - 0.006, I.dashY - 0.11, 0.03); sm.rotation.y = -Math.PI / 2; b.add(sm);
    b.add(box(0.02, 0.17, 0.28, M.dark, I.dashX - 0.002, I.dashY - 0.11, 0.03, 0.008));
    for (const z of [0.5, 0.25, -0.12, -0.7]) { const v = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.055), new THREE.MeshStandardMaterial({ map: ventTex(), roughness: 0.5, metalness: 0.4 })); v.position.set(I.dashX - 0.025, I.dashY - 0.06, z); v.rotation.y = -Math.PI / 2; b.add(v);
      trimPolygonX(b, I.dashX - 0.027, I.dashY - 0.06, z, 0.14, 0.065); }
    for (const kz of [-0.03, 0.09]) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.025, 20), M.chrome); k.rotation.z = Math.PI / 2; k.position.set(I.dashX - 0.01, I.dashY - 0.21, kz); b.add(k); }
    } else { const rd = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.06), new THREE.MeshBasicMaterial({ map: plateTex('AM 88', '#1a1208', '#ffb347'), toneMapped: false })); rd.position.set(I.dashX - 0.006, I.dashY - 0.1, 0.03); rd.rotation.y = -Math.PI / 2; b.add(rd); }
    // pedals
    const pedalMat = new THREE.MeshStandardMaterial({ color: 0x9aa0aa, roughness: 0.35, metalness: 0.8 });
    car.brake = new THREE.Group(); car.brake.position.set(I.fireX - 0.03, fy + 0.36, -I.seatZ - 0.03);
    const arm = box(0.02, 0.26, 0.025, M.dark, -0.06, -0.12, 0); arm.rotation.z = -0.45; car.brake.add(arm);
    const pad = box(0.02, 0.085, 0.12, pedalMat, -0.125, -0.235, 0, 0.006); pad.rotation.z = -0.45; car.brake.add(pad); b.add(car.brake);
    car.brakePad = pad;
    const acc = box(0.02, 0.17, 0.06, pedalMat, I.fireX - 0.14, fy + 0.12, -I.seatZ + 0.13, 0.006); acc.rotation.z = -0.5; b.add(acc);
    // mirror with a hanging charm
    b.add(box(0.03, 0.07, 0.22, M.dark, I.roofX + 0.14, I.roofY - 0.11, 0, 0.012));
    car.mirrorAt = V3(I.roofX + 0.14, I.roofY - 0.11, 0);
    if (props) {
    car.charm = new THREE.Group(); car.charm.position.set(I.roofX + 0.14, I.roofY - 0.15, 0);
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.14, 5), M.dark); str.position.y = -0.07; car.charm.add(str);
    const ch = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), new THREE.MeshStandardMaterial({ color: 0x35e0c0, roughness: 0.2, metalness: 0.3 })); ch.position.y = -0.165; car.charm.add(ch); b.add(car.charm);
    }
    // phone on the passenger seat
    if (props) {
    car.phone = new THREE.Group(); const pb = box(0.155, 0.011, 0.078, M.dark, 0, 0, 0, 0.004); car.phone.add(pb);
    const pg = new THREE.PlaneGeometry(0.068, 0.145); pg.rotateX(-Math.PI / 2); pg.rotateY(Math.PI / 2); const ps = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ map: phoneTex(), toneMapped: false })); ps.position.y = 0.0062; car.phone.add(ps); b.add(car.phone); }
    const pl = new THREE.PointLight(0xfff0dc, 2.0, 3.2, 1.5); pl.position.set(I.seatX + 0.30, 0.80, 0.12); b.add(pl);
    const pl2 = new THREE.PointLight(0xdfe8ff, 1.5, 1.8, 1.4); pl2.position.set(0.55, 0.52, 0.05); b.add(pl2);
  }
}

// ------------------------------------------------------------------ car generator
// Base shapes as parameters, so new videos get new silhouettes, not just new paint.
// L length, H roof height, hw half width, wR wheel radius, hood bonnet length, ws windshield run (horizontal),
// belt beltline height, yb sill height, bh bumper height, rear style, roof roof length (trunk/fastback),
// rearRun rear-glass run (trunk), cab cab length (pickup), ohF/ohR overhangs as a fraction of L.
export const CAR_TYPES = {
  coupe:  { L: 4.25, H: 1.28, hw: 0.86, wR: 0.32, hood: 1.10, ws: 0.76, belt: 0.88, yb: 0.21, bh: 0.27, rear: 'trunk', roof: 1.12, rearRun: 0.70 },
  sedan:  { L: 4.55, H: 1.40, hw: 0.88, wR: 0.33, hood: 1.18, ws: 0.70, belt: 0.92, yb: 0.22, bh: 0.27, rear: 'trunk', roof: 1.40, rearRun: 0.58 },
  hatch:  { L: 3.90, H: 1.46, hw: 0.85, wR: 0.31, hood: 0.92, ws: 0.70, belt: 0.92, yb: 0.22, bh: 0.27, rear: 'hatch' },
  wagon:  { L: 4.75, H: 1.42, hw: 0.88, wR: 0.33, hood: 1.18, ws: 0.66, belt: 0.92, yb: 0.22, bh: 0.27, rear: 'wagon' },
  sports: { L: 4.35, H: 1.12, hw: 0.92, wR: 0.33, hood: 1.30, ws: 0.88, belt: 0.78, yb: 0.17, bh: 0.24, rear: 'fastback', roof: 0.75 },
  suv:    { L: 4.75, H: 1.74, hw: 0.95, wR: 0.38, hood: 0.98, ws: 0.54, belt: 1.10, yb: 0.30, bh: 0.40, rear: 'box' },
  van:    { L: 4.95, H: 2.00, hw: 0.98, wR: 0.36, hood: 0.62, ws: 0.56, belt: 1.04, yb: 0.28, bh: 0.40, rear: 'box' },
  pickup: { L: 5.25, H: 1.80, hw: 0.98, wR: 0.40, hood: 1.30, ws: 0.50, belt: 1.12, yb: 0.34, bh: 0.40, rear: 'bed', cab: 1.55 },
};
// carSpec(type, overrides) -> spec for makeCar (and spec.I, a matching interior spec for addInterior)
export function carSpec(type = 'sedan', ov = {}) {
  const P = { ...CAR_TYPES[type], ...ov };
  if (ov.jitter) { P.L *= 1 + 0.04 * ov.jitter; P.roof && (P.roof *= 1 + 0.06 * ov.jitter); }
  if (ov.jitter2) { P.hood *= 1 + 0.07 * ov.jitter2; P.H *= 1 + 0.03 * ov.jitter2; P.ws *= 1 - 0.05 * ov.jitter2; }
  const { L, H, hw, wR, hood, ws, belt, yb, bh } = P;
  const xf = L / 2, xr = -L / 2, top = [];
  top.push([xf - 0.04, yb], [xf, yb + bh], [xf - 0.08, yb + bh + (belt - yb - bh) * 0.6]);
  const x3 = xf - hood, x4 = x3 - ws; top.push([x3, belt], [x4, H]);
  let x5, rw = null, x6 = null, y6 = null;
  if (P.rear === 'trunk') { x5 = x4 - P.roof; x6 = x5 - P.rearRun; y6 = belt + 0.05; top.push([x5, H], [x6, y6], [xr + 0.07, belt], [xr, yb + 0.29], [xr + 0.05, yb]); rw = [5, 6]; }
  else if (P.rear === 'fastback') { x5 = x4 - P.roof; x6 = xr + 0.35; y6 = belt + 0.08; top.push([x5, H], [x6, y6], [xr + 0.03, belt + 0.02], [xr, yb + 0.27], [xr + 0.05, yb]); rw = [5, 6]; }
  else if (P.rear === 'hatch') { x5 = xr + 0.42; x6 = xr + 0.08; y6 = belt + 0.12; top.push([x5, H], [x6, y6], [xr, yb + 0.3], [xr + 0.05, yb]); rw = [5, 6]; }
  else if (P.rear === 'wagon') { x5 = xr + 0.22; x6 = xr + 0.08; y6 = belt + 0.06; top.push([x5, H], [x6, y6], [xr, yb + 0.3], [xr + 0.05, yb]); rw = [5, 6]; }
  else if (P.rear === 'box') { x5 = xr + 0.26; top.push([x5, H], [xr + 0.06, H - 0.16], [xr, yb + 0.42], [xr + 0.05, yb]); }
  else { x5 = x4 - P.cab; const bedY = belt + 0.05; top.push([x5, H], [x5 - 0.06, H - 0.06], [x5 - 0.08, bedY], [xr + 0.05, bedY], [xr, yb + 0.35], [xr + 0.05, yb]); }
  // side windows
  const wt = H - 0.06, wb = belt + 0.03, xw = (y) => x3 + (y - belt) / (H - belt) * (x4 - x3);
  const fB = xw(wb) - 0.12, fT = xw(wt) - 0.07;
  let rB, rT;
  if (rw) { const yb2 = Math.max(wb, y6 + 0.02), xrr = (y) => x5 + (H - y) / (H - y6) * (x6 - x5); rB = xrr(yb2) + 0.16; rT = xrr(wt) + 0.1; }
  else if (P.rear === 'box') { rB = rT = x5 + 0.04; }
  else { rB = rT = x5 + 0.1; }
  const n = fB - rB > 2.6 ? 3 : 2, splits = [];
  for (let i = 1; i < n; i++) splits.push(fB + (rB - fB) * i / n);
  const windows = [];
  for (let i = 0; i < n; i++) {
    const fb = i === 0 ? fB : splits[i - 1] - 0.04, ft = i === 0 ? fT : splits[i - 1] - 0.04;
    const rb = i === n - 1 ? rB : splits[i] + 0.04, rt = i === n - 1 ? Math.min(rT, ft - 0.1) : splits[i] + 0.04;
    windows.push([[fb, wb], [ft, wt], [rt, wt], [rb, wb]]);
  }
  const wheelX = [xf - (P.ohF ?? 0.2) * L, xr + (P.ohR ?? 0.205) * L];
  const spec = { halfW: hw, wheelR: wR, wheelX, archR: wR + 0.09, yb, belt, mirror: [x3 - 0.18, belt + 0.06], seams: [x3 - 0.06, splits[0]],
    plate: ov.plate || 'NEW 1', top, ws: [3, 4], rw, windows, type };
  const dashX = x3 - 0.34, dashY = belt - 0.03, floorY = yb + 0.04, rearX = (P.rear === 'trunk' || P.rear === 'fastback') ? x5 + 0.06 : P.rear === 'bed' ? x5 + 0.04 : xr + 0.13;
  spec.I = { hw, floorY, fireX: x3 + 0.04, rearX, shelfLen: rw && P.rear === 'trunk' ? Math.max(0.02, rearX - x6) : 0.02, belt: belt + 0.05,
    dashX, dashY, dashY0: dashY - 0.27, seatX: dashX - 0.83, seatY: floorY + 0.15 + (H - 1.28) * 0.28, seatZ: hw * 0.44,
    roofX: x4 - 0.12, roofY: H - 0.045, roofLen: Math.max(0.4, x4 - x5 - 0.14), wheel: [dashX - 0.27, dashY], wheelR: 0.17, accent: 0x8e2328 };
  return spec;
}

// Surface details ("skin") on a built car. skin: { wood, stripe: hex, rack, rust, bow: hex }
function woodTex() {
  const c = canvas(512, 128), g = c.getContext('2d'); g.fillStyle = '#8a5a2b'; g.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 40; i++) { g.strokeStyle = i % 3 ? 'rgba(60,32,12,0.35)' : 'rgba(190,130,70,0.35)'; g.lineWidth = 2 + (i % 4); g.beginPath(); const y = (i * 37) % 128; g.moveTo(0, y); g.bezierCurveTo(170, y + 8, 340, y - 8, 512, y + 3); g.stroke(); }
  g.strokeStyle = '#e8d9b8'; g.lineWidth = 8; g.strokeRect(4, 4, 504, 120); return ctex(c);
}
function analogTex() {
  const c = canvas(512, 192), g = c.getContext('2d'); g.fillStyle = '#2a1e12'; g.fillRect(0, 0, 512, 192);
  for (const [cx, a] of [[140, -0.2], [372, 0.6]]) {
    g.fillStyle = '#efe6cf'; g.beginPath(); g.arc(cx, 100, 76, 0, 7); g.fill(); g.strokeStyle = '#c8a24a'; g.lineWidth = 6; g.stroke();
    g.strokeStyle = '#222'; g.lineWidth = 3; for (let i = 0; i <= 12; i++) { const an = Math.PI * 0.75 + i * Math.PI * 1.5 / 12; g.beginPath(); g.moveTo(cx + Math.cos(an) * 56, 100 + Math.sin(an) * 56); g.lineTo(cx + Math.cos(an) * 68, 100 + Math.sin(an) * 68); g.stroke(); }
    g.strokeStyle = '#c0262b'; g.lineWidth = 5; g.beginPath(); g.moveTo(cx, 100); g.lineTo(cx + Math.cos(a - 1.6) * 58, 100 + Math.sin(a - 1.6) * 58); g.stroke();
    g.fillStyle = '#222'; g.beginPath(); g.arc(cx, 100, 8, 0, 7); g.fill();
  }
  return ctex(c);
}
function sideShapeBand(S, x0, x1, yTop, yLow) {
  const sh = new THREE.Shape(); sh.moveTo(x1, yTop); sh.lineTo(x0, yTop); sh.lineTo(x0, yLow);
  for (const wx of [...S.wheelX].sort((a, b) => a - b)) {
    const ar = S.archR + 0.03; if (wx - ar < x0 || wx + ar > x1) continue;
    sh.lineTo(wx - ar, yLow); sh.lineTo(wx - ar, S.wheelR); sh.absarc(wx, S.wheelR, ar, Math.PI, 0, true); sh.lineTo(wx + ar, yLow);
  }
  sh.lineTo(x1, yLow); sh.closePath(); return new THREE.ShapeGeometry(sh, 16);
}
export function applySkin(car, sk = {}) {
  const S = car.spec, hw = S.halfW, b = car.body, x3 = S.top[3][0], xr = S.top[S.top.length - 1][0];
  if (sk.wood) {
    const g = sideShapeBand(S, xr + 0.18, x3 - 0.08, S.belt - 0.05, Math.min(S.yb + 0.12, S.wheelR));
    const m = new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.55, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
    g.computeBoundingBox(); const bb = g.boundingBox, uv = g.attributes.uv, pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
    for (const s of [-1, 1]) { const w = new THREE.Mesh(g, m); w.position.z = s * (hw + 0.018); b.add(w); }
  }
  if (sk.stripe != null) {
    const m = flat(sk.stripe, 0.4), L = x3 - xr - 0.3;
    for (const s of [-1, 1]) b.add(box(L, 0.05, 0.006, m, (x3 + xr) / 2 - 0.05, S.belt - 0.13, s * (hw + 0.02)));
  }
  if (sk.rack) {
    const x4 = S.top[4][0], x5 = S.top[5][0], y = S.top[5][1] + 0.05;
    for (const s of [-1, 1]) b.add(box(x4 - x5 - 0.2, 0.04, 0.04, M.dark, (x4 + x5) / 2, y, s * (hw - 0.12)));
    for (const x of [x4 - 0.25, x5 + 0.25]) b.add(box(0.04, 0.04, 2 * hw - 0.24, M.dark, x, y + 0.02, 0));
  }
  if (sk.rust) {
    const c = canvas(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 6, 64, 64, 60);
    gr.addColorStop(0, 'rgba(120,60,20,0.95)'); gr.addColorStop(0.6, 'rgba(150,80,30,0.6)'); gr.addColorStop(1, 'rgba(150,80,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const m = new THREE.MeshStandardMaterial({ map: ctex(c), transparent: true, depthWrite: false, roughness: 1, side: THREE.DoubleSide });
    const spots = [[S.wheelX[0] + S.archR * 0.9, S.wheelR + S.archR * 0.6, 0.22], [S.wheelX[1] - S.archR, S.yb + 0.16, 0.3], [x3 - 0.5, S.belt - 0.25, 0.16]];
    for (const s of [-1, 1]) for (const [x, y, r] of spots) { const q = new THREE.Mesh(new THREE.PlaneGeometry(r, r * 0.8), m); q.position.set(x, y, s * (hw + 0.022)); b.add(q); }
  }
  if (sk.bow != null) { // gift bow on the roof
    const m = flat(sk.bow, 0.4), x = (S.top[4][0] + S.top[5][0]) / 2, y = S.top[4][1] + 0.12;
    b.add(box(0.12, 0.12, 2 * hw + 0.02, m, x, y - 0.1, 0)); b.add(box(S.top[4][0] - S.top[5][0] + 0.02, 0.12, 0.12, m, x, y - 0.1, 0));
    for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 16), m); l.position.set(x, y + 0.08, s * 0.14); l.rotation.y = Math.PI / 2; l.rotation.x = s * 0.5; b.add(l); }
  }
  return car;
}
// buildCar(look) — look = { type, color, skin?, shape? (carSpec overrides), plate?, interior?: 'modern'|'old'|false, detail? }
// interior 'old': tan vinyl seats, wood strip, analogue gauges, radio. detail: true adds the 5 s test's clutter.
export function buildCar(look) {
  const spec = carSpec(look.type, { ...(look.shape || {}), plate: look.plate });
  const car = makeCar(spec, look.color);
  if (look.interior) {
    const I = { ...spec.I, ...(look.interior === 'old' ? { seat: 0xb9874f, trim: 0x6b4a2e, liner: 0xcdbb98, analog: true, wood: true, accent: 0x8a5a2b } : {}), ...(look.I || {}) };
    addInterior(car, I, look.detail ?? { props: false }); car.I = I;
  }
  applySkin(car, look.skin || {});
  if (look.traffic) tintGlass(car);
  return car;
}
