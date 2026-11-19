// Scenery fill: everything that keeps a frame from looking empty. All instanced or merged, so a long road full of
// trees and houses stays cheap. The painted render pass (core.js) turns the leaf clumps and grass into brushwork.
//   forest(scene, { area: [x0, x1, z0, z1], count, seed, kinds: ['round', 'tall', 'pine'], scale: [a, b], avoid(x, z), tint })
//   houseRow(scene, { x0, x1, z, face: 1 (fronts look +z) | -1, spacing, seed, lights, depth })
//   guardrail(scene, { z, x0, x1 })     grassTufts(scene, { area, count, seed, colors })
//   powerLine(scene, { z, x0, x1, span })   bushRow(scene, { area, count, seed })
import { THREE, V3, rng, canvas, ctex } from './core.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const col = new THREE.Color();
function paintVerts(geo, f) { // f(x, y, z) -> THREE.Color, written as a vertex colour
  const p = geo.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const k = f(p.getX(i), p.getY(i), p.getZ(i)); c[i * 3] = k.r; c[i * 3 + 1] = k.g; c[i * 3 + 2] = k.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); return geo;
}
function lumpy(radius, seed, amp = 0.2, detail = 3) {
  let g = new THREE.IcosahedronGeometry(radius, detail); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g);
  const p = g.attributes.position, s = seed * 1.7;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), l = Math.hypot(x, y, z) || 1;
    const n = Math.sin(x * 4.1 / radius + s) * Math.sin(y * 3.7 / radius + s * 1.3) * Math.sin(z * 4.4 / radius + s * 0.7) + 0.5 * Math.sin(x * 9 / radius + y * 7 / radius + s);
    const k = 1 + amp * n; p.setXYZ(i, x / l * radius * k, y / l * radius * k * 0.9, z / l * radius * k);
  }
  g.computeVertexNormals(); return g;
}
const strip = (g) => { for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k); return g.index ? g.toNonIndexed() : g; };

// ------------------------------------------------------------------ trees
function treeVariant(kind, seed) {
  const r = rng(seed), parts = [], trunkParts = [];
  const bark = new THREE.Color(0x4a3222), h = kind === 'pine' ? 7.5 : kind === 'tall' ? 8 : 6.5;
  const trunk = new THREE.CylinderGeometry(0.14, 0.28, h * 0.5, 7); trunk.translate(0, h * 0.25, 0); trunkParts.push(trunk);
  if (kind !== 'pine') for (let i = 0; i < 3; i++) {
    const b = new THREE.CylinderGeometry(0.05, 0.1, h * 0.3, 5); b.translate(0, h * 0.15, 0);
    b.rotateZ((r() - 0.5) * 1.4); b.rotateY(r() * 6.28); b.translate(0, h * (0.42 + r() * 0.12), 0); trunkParts.push(b);
  }
  if (kind === 'pine') {
    for (let i = 0; i < 4; i++) { const c = new THREE.ConeGeometry(2.0 - i * 0.42, 2.6, 9, 2); c.translate(0, h * 0.3 + i * 1.35, 0); parts.push(paintVerts(strip(c), (x, y) => col.setHSL(0.37, 0.5, 0.18 + 0.06 * ((y - h * 0.3) / 6) + 0.03 * r()))); }
  } else {
    const n = kind === 'tall' ? 6 : 9, cy = h * 0.64;
    for (let i = 0; i < n; i++) {
      const rad = (kind === 'tall' ? 1.1 : 1.35) * (0.7 + r() * 0.5), a = r() * 6.28, d = (kind === 'tall' ? 0.7 : 1.4) * r();
      const g = lumpy(rad, seed * 13 + i, 0.22);
      const ox = Math.cos(a) * d, oz = Math.sin(a) * d, oy = (kind === 'tall' ? (i / n - 0.4) * 3.2 : (r() - 0.3) * 1.4);
      g.translate(ox, cy + oy, oz);
      parts.push(paintVerts(strip(g), (x, y, z) => { const up = (y - (cy + oy)) / rad; return col.setHSL(0.26 + 0.04 * r(), 0.58, 0.25 + 0.15 * up + 0.05 * r()); }));
    }
  }
  const crown = mergeGeometries(parts); const tr = mergeGeometries(trunkParts.map((g) => strip(g)));
  return { crown, trunk: paintVerts(tr, () => bark), h };
}
const VARIANTS = {};
function variants(kind) { if (!VARIANTS[kind]) VARIANTS[kind] = [0, 1, 2].map((i) => treeVariant(kind, 31 + i * 17 + kind.length)); return VARIANTS[kind]; }
const leafMat = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
export function forest(scene, o = {}) {
  const r = rng(o.seed ?? 5), [x0, x1, z0, z1] = o.area, kinds = o.kinds || ['round', 'round', 'tall', 'pine'], n = o.count ?? 200, sc = o.scale || [0.8, 1.35];
  const slots = []; for (const k of new Set(kinds)) variants(k).forEach((v, i) => slots.push({ k, v, list: [] }));
  for (let i = 0; i < n; i++) {
    let x, z, tries = 0; do { x = x0 + r() * (x1 - x0); z = z0 + r() * (z1 - z0); } while (o.avoid && o.avoid(x, z) && ++tries < 8);
    if (o.avoid && o.avoid(x, z)) continue;
    const k = kinds[Math.floor(r() * kinds.length)], cand = slots.filter((s) => s.k === k), s = cand[Math.floor(r() * cand.length)];
    s.list.push([x, z, sc[0] + r() * (sc[1] - sc[0]), r() * 6.28, 0.85 + r() * 0.3]);
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), tint = new THREE.Color(o.tint ?? 0xffffff), out = [];
  const lm = leafMat(), bm = leafMat();
  for (const s of slots) {
    if (!s.list.length) continue;
    const crowns = new THREE.InstancedMesh(s.v.crown, lm, s.list.length), trunks = new THREE.InstancedMesh(s.v.trunk, bm, s.list.length);
    s.list.forEach(([x, z, k, rot, shade], i) => { q.setFromAxisAngle(V3(0, 1, 0), rot); m4.compose(V3(x, 0, z), q, V3(k, k, k)); crowns.setMatrixAt(i, m4); trunks.setMatrixAt(i, m4); crowns.setColorAt(i, col.copy(tint).multiplyScalar(shade)); });
    crowns.castShadow = trunks.castShadow = !!o.shadows; crowns.receiveShadow = true;
    scene.add(crowns, trunks); out.push(crowns, trunks);
  }
  return out;
}
export function bushRow(scene, o = {}) {
  const r = rng(o.seed ?? 9), [x0, x1, z0, z1] = o.area, n = o.count ?? 60, g = paintVerts(strip(lumpy(0.6, 7, 0.25, 2)), (x, y) => col.setHSL(0.28, 0.42, 0.22 + 0.12 * (y / 0.6)));
  const m = new THREE.InstancedMesh(g, leafMat(), n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < n; i++) { const s = 0.6 + r() * 0.8; m4.compose(V3(x0 + r() * (x1 - x0), 0.25 * s, z0 + r() * (z1 - z0)), q.setFromAxisAngle(V3(0, 1, 0), r() * 6), V3(s * 1.3, s, s)); m.setMatrixAt(i, m4); m.setColorAt(i, col.setScalar(0.8 + r() * 0.35)); }
  m.receiveShadow = true; scene.add(m); return m;
}

// ------------------------------------------------------------------ grass tufts (crossed alpha cards)
let tuftTex;
function tuftTexture() {
  if (tuftTex) return tuftTex;
  const c = canvas(256, 256), g = c.getContext('2d'), r = rng(4);
  for (let i = 0; i < 90; i++) {
    const x = 20 + r() * 216, h = 120 + r() * 130, lean = (r() - 0.5) * 70, w = 4 + r() * 6;
    g.fillStyle = `hsl(${88 + r() * 30}, ${45 + r() * 20}%, ${24 + r() * 22}%)`;
    g.beginPath(); g.moveTo(x - w, 256); g.quadraticCurveTo(x + lean * 0.3, 256 - h * 0.6, x + lean, 256 - h); g.quadraticCurveTo(x + lean * 0.35 + w * 0.3, 256 - h * 0.55, x + w, 256); g.fill();
  }
  tuftTex = ctex(c); return tuftTex;
}
export function grassTufts(scene, o = {}) {
  const r = rng(o.seed ?? 3), [x0, x1, z0, z1] = o.area, n = o.count ?? 4000;
  const parts = []; for (let i = 0; i < 3; i++) { const p = new THREE.PlaneGeometry(0.7, 0.5); p.translate(0, 0.25, 0); p.rotateY(i * Math.PI / 3); parts.push(p); }
  const geo = mergeGeometries(parts);
  const mat = new THREE.MeshStandardMaterial({ map: tuftTexture(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1, color: o.color ?? 0xffffff });
  const m = new THREE.InstancedMesh(geo, mat, n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0), s = (o.avoid && o.avoid(x, z)) ? 0 : (o.size ?? 1) * (0.6 + r() * 0.9); m4.compose(V3(x, 0, z), q.setFromAxisAngle(V3(0, 1, 0), r() * 6.28), V3(s, s * (0.7 + r() * 0.7), s)); m.setMatrixAt(i, m4); m.setColorAt(i, col.setScalar(0.75 + r() * 0.4)); }
  m.receiveShadow = true; scene.add(m); return m;
}

// ------------------------------------------------------------------ guardrail and power line
export function guardrail(scene, o = {}) {
  const z = o.z, x0 = o.x0 ?? -500, x1 = o.x1 ?? 1000, L = x1 - x0, g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xb8bec6, metalness: 0.55, roughness: 0.38 }), dark = new THREE.MeshStandardMaterial({ color: 0x6d737c, metalness: 0.4, roughness: 0.5 });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(L, 0.32, 0.06), metal); rail.position.set((x0 + x1) / 2, 0.6, z); rail.castShadow = rail.receiveShadow = true; g.add(rail);
  const groove = new THREE.Mesh(new THREE.BoxGeometry(L, 0.05, 0.07), dark); groove.position.set((x0 + x1) / 2, 0.6, z); g.add(groove);
  const n = Math.floor(L / 2.5), post = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.75, 0.12), dark, n), m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m4.makeTranslation(x0 + i * 2.5, 0.37, z + (o.side ?? 1) * 0.09); post.setMatrixAt(i, m4); }
  post.castShadow = true; g.add(post); scene.add(g); return g;
}
export function powerLine(scene, o = {}) {
  const z = o.z, x0 = o.x0 ?? -500, x1 = o.x1 ?? 1000, span = o.span ?? 42, h = o.h ?? 9.5, n = Math.floor((x1 - x0) / span) + 1;
  const wood = new THREE.MeshStandardMaterial({ color: 0x5b4634, roughness: 1 });
  const pg = new THREE.CylinderGeometry(0.11, 0.16, h, 7); pg.translate(0, h / 2, 0);
  const poles = new THREE.InstancedMesh(pg, wood, n), bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.12, 2.2), wood, n), m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m4.makeTranslation(x0 + i * span, 0, z); poles.setMatrixAt(i, m4); m4.makeTranslation(x0 + i * span, h - 0.5, z); bars.setMatrixAt(i, m4); }
  scene.add(poles, bars);
  const pts = [];
  for (const dz of [-0.95, 0, 0.95]) for (let i = 0; i < n - 1; i++) for (let k = 0; k < 10; k++) {
    const u0 = k / 10, u1 = (k + 1) / 10, sag = (u) => -1.1 * 4 * u * (1 - u), xa = x0 + i * span;
    pts.push(V3(xa + u0 * span, h - 0.42 + sag(u0), z + dz), V3(xa + u1 * span, h - 0.42 + sag(u1), z + dz));
  }
  const wires = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x2a2a2e }));
  scene.add(wires); return { poles, bars, wires };
}

// ------------------------------------------------------------------ simple houses (background rows)
const SIDING = [0xf2ece0, 0xcfe3f2, 0xf6e3b4, 0xd9e8cf, 0xf3d1c8, 0xc9ccd6, 0xe8dcc0, 0xbfa98a];
const ROOFS = [0x4a4f5a, 0x6b3a2e, 0x3a4a5a, 0x5a5048, 0x7a4a3a, 0x2f3540];
export function houseRow(scene, o = {}) {
  const r = rng(o.seed ?? 12), face = o.face ?? 1, sp = o.spacing ?? 17, D = o.depth ?? 7.5, parts = [], wins = [], doors = [];
  const shadeCol = (hex, k) => new THREE.Color(hex).multiplyScalar(k);
  for (let x = o.x0; x <= o.x1; x += sp * (0.85 + r() * 0.3)) {
    if (o.avoid && o.avoid(x)) continue;
    const w = 7 + r() * 3, st = r() < 0.45 ? 2 : 1, h = 2.7 * st, rh = 1.6 + r() * 1.2, siding = SIDING[Math.floor(r() * SIDING.length)], roof = ROOFS[Math.floor(r() * ROOFS.length)];
    const fz = o.z, cz = fz - face * D / 2;                     // front wall at z = o.z
    const body = new THREE.BoxGeometry(w, h, D); body.translate(x, h / 2, cz);
    parts.push(paintVerts(strip(body), (px, py, pz) => shadeCol(siding, (pz - cz) * face > D / 2 - 0.01 ? 1 : 0.82)));
    const tri = new THREE.Shape(); tri.moveTo(-w / 2 - 0.45, 0); tri.lineTo(w / 2 + 0.45, 0); tri.lineTo(0, rh); tri.closePath();
    const rg = new THREE.ExtrudeGeometry(tri, { depth: D + 0.7, bevelEnabled: false }); rg.translate(x, h, cz - (D + 0.7) / 2);
    parts.push(paintVerts(strip(rg), (px, py) => shadeCol(roof, py > h + 0.02 ? 1 : 0.6)));
    if (r() < 0.5) { const ch = new THREE.BoxGeometry(0.7, rh + 1, 0.7); ch.translate(x + w * 0.25, h + (rh + 1) / 2, cz - face * D * 0.2); parts.push(paintVerts(strip(ch), () => shadeCol(0x9a4a3a, 1))); }
    const ncol = Math.max(2, Math.floor(w / 2.4));
    for (let s = 0; s < st; s++) for (let i = 0; i < ncol; i++) { const wx = x - w / 2 + (i + 0.5) * (w / ncol); if (s === 0 && i === Math.floor(ncol / 2)) { doors.push([wx, fz]); continue; } wins.push([wx, s * 2.7 + 1.5, fz, r() < 0.55]); }
  }
  const out = new THREE.Group(); scene.add(out);
  if (!parts.length) return out;
  const mesh = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })); mesh.castShadow = true; mesh.receiveShadow = true; out.add(mesh);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), face > 0 ? 0 : Math.PI);
  const winGeo = new THREE.PlaneGeometry(0.95, 1.1), frameGeo = new THREE.PlaneGeometry(1.15, 1.3);
  const lit = wins.filter((w) => o.lights && w[3]), dark = wins.filter((w) => !(o.lights && w[3]));
  const glassM = new THREE.MeshStandardMaterial({ color: 0x7f9fbd, roughness: 0.15, metalness: 0.3 }), litM = new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffc870, emissiveIntensity: 1.2 });
  const frames = new THREE.InstancedMesh(frameGeo, new THREE.MeshStandardMaterial({ color: 0xf6f3ec, roughness: 0.6 }), wins.length);
  wins.forEach(([x, y, z], i) => { m4.compose(V3(x, y, z + face * 0.02), q, V3(1, 1, 1)); frames.setMatrixAt(i, m4); }); out.add(frames);
  for (const [list, mat] of [[dark, glassM], [lit, litM]]) { if (!list.length) continue; const im = new THREE.InstancedMesh(winGeo, mat, list.length); list.forEach(([x, y, z], i) => { m4.compose(V3(x, y, z + face * 0.04), q, V3(1, 1, 1)); im.setMatrixAt(i, m4); }); out.add(im); }
  if (doors.length) { const dm = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.95, 1.95), new THREE.MeshStandardMaterial({ roughness: 0.5 }), doors.length);
    doors.forEach(([x, z], i) => { m4.compose(V3(x, 0.98, z + face * 0.03), q, V3(1, 1, 1)); dm.setMatrixAt(i, m4); dm.setColorAt(i, col.setHex([0xc8342c, 0x2f5a8a, 0x2f6a4a, 0x3a3a42, 0xe0a020][i % 5])); }); out.add(dm); }
  return out;
}

// Single painted tree / bush as a Group (props.tree / props.bush use these).
export function paintedTree(o = {}) {
  const v = variants(o.kind || 'round')[(o.seed ?? 0) % 3], g = new THREE.Group(), k = (o.h ?? 4.5) / v.h;
  const c = new THREE.Mesh(v.crown, leafMat()), t = new THREE.Mesh(v.trunk, leafMat()); c.castShadow = t.castShadow = true; c.receiveShadow = true;
  g.add(c, t); g.scale.setScalar(k); g.rotation.y = ((o.seed ?? 0) * 1.3) % 6.28; return g;
}
export function paintedBush(o = {}) {
  const R = o.r ?? 0.45, base = new THREE.Color(o.color ?? 0x3f9a3f), hsl = {}; base.getHSL(hsl);
  const geo = paintVerts(strip(lumpy(1, (o.seed ?? 11) % 97, 0.25, 2)), (x, y) => col.setHSL(hsl.h, hsl.s * 0.8, hsl.l * (0.65 + 0.35 * (y + 1) / 2)));
  const m = new THREE.Mesh(geo, leafMat()); m.scale.set(R * 1.25, R, R * 1.1); m.position.y = R * 0.75; m.castShadow = true; m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m); return g;
}
