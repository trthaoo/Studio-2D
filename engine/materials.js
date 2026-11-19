// Shared materials and small builders.
import { THREE, rng, canvas, ctex } from './core.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const M = {
  glass: new THREE.MeshStandardMaterial({ color: 0xa8d6ff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.20, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.6 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x1e1f25, roughness: 0.75 }),
  trim: new THREE.MeshStandardMaterial({ color: 0x343849, roughness: 0.6 }),
  tyre: new THREE.MeshStandardMaterial({ color: 0x17171b, roughness: 0.88 }),
  rim: new THREE.MeshStandardMaterial({ color: 0xd9dde4, roughness: 0.28, metalness: 0.85 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xe8ecf2, roughness: 0.15, metalness: 1 }),
  seat: new THREE.MeshStandardMaterial({ color: 0x525873, roughness: 0.8 }),
  liner: new THREE.MeshStandardMaterial({ color: 0x5a6072, roughness: 0.95 }),
  mat: new THREE.MeshStandardMaterial({ color: 0x41465a, roughness: 1 }),
  black: new THREE.MeshBasicMaterial({ color: 0x0c0c0e, toneMapped: false }),
  blackBack: new THREE.MeshBasicMaterial({ color: 0x0c0c0e, toneMapped: false, side: THREE.BackSide }),
};
// Glossy car paint.
export const paint = (c) => new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.35, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, side: THREE.DoubleSide });   // glossy metallic car paint
// Flat-shaded plain material for props and buildings.
export const flat = (c, rough = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: rough });

// box(w, h, d, mat, x, y, z, roundRadius?) with shadows on.
export function box(w, h, d, mat, x, y, z, rad) {
  const g = rad ? new RoundedBoxGeometry(w, h, d, 3, rad) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
// Text on a small card (number plates, signs, desk plates).
export function plateTex(text, bg, fg) {
  const c = canvas(256, 128), g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(6, 6, 244, 116); g.fillStyle = fg; g.font = 'bold 70px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 68);
  return ctex(c);
}
// Grainy texture: asphalt, grass (strokes = true), concrete.
export function noiseTex(size, base, vary, seed, strokes) {
  const c = canvas(size, size), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  for (let i = 0; i < size * size * 0.35; i++) {
    const v = vary[Math.floor(r() * vary.length)];
    g.fillStyle = v; g.globalAlpha = 0.25 + r() * 0.5;
    const s = 1 + r() * 2.2; g.fillRect(r() * size, r() * size, s, strokes ? s * (2 + r() * 4) : s);
  }
  g.globalAlpha = 1; return c;
}
// Soft round sprite used for smoke, steam, dust and light glows.
export const puffTex = (() => { const c = canvas(128, 128), g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return ctex(c); })();

// Soft dark ellipse under a car or character. Add it to the object: obj.add(blobShadow(L, W)).
let blobMat;
export function blobShadow(L, Wd, y = 0.016) {
  if (!blobMat) {
    const c = canvas(256, 128), g = c.getContext('2d'), gr = g.createRadialGradient(128, 64, 8, 128, 64, 126);
    gr.addColorStop(0, 'rgba(0,0,0,0.62)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.translate(128, 64); g.scale(1, 0.5); g.translate(-128, -64); g.fillStyle = gr; g.fillRect(0, -64, 256, 256); g.restore();
    blobMat = new THREE.MeshBasicMaterial({ map: ctex(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 });
  }
  const gm = new THREE.PlaneGeometry(L, Wd); gm.rotateX(-Math.PI / 2); const m = new THREE.Mesh(gm, blobMat); m.position.y = y; return m;
}
// Ground textures with soft colour blotches + fine detail (they read as painted ground after the brush pass, not as
// magnified noise squares). grassTex({ hue, light, seed }), asphaltTex({ wet, seed }). Return canvases (wrap with ctex).
export function grassTex(o = {}) {
  const S = 1024, c = canvas(S, S), g = c.getContext('2d'), r = rng(o.seed ?? 5), h = o.hue ?? 98, L = o.light ?? 34;
  g.fillStyle = `hsl(${h}, 48%, ${L}%)`; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) { const x = r() * S, y = r() * S, rad = 60 + r() * 180, gr = g.createRadialGradient(x, y, 0, x, y, rad), dl = (r() - 0.5) * 12;
    gr.addColorStop(0, `hsla(${h + (r() - 0.5) * 16}, 50%, ${L + dl}%, 0.55)`); gr.addColorStop(1, `hsla(${h}, 50%, ${L + dl}%, 0)`); g.fillStyle = gr;
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2); }
  g.lineCap = 'round';
  for (let i = 0; i < 26000; i++) { const x = r() * S, y = r() * S, len = 4 + r() * 9, a = -Math.PI / 2 + (r() - 0.5) * 0.9;
    g.strokeStyle = `hsla(${h + (r() - 0.5) * 24}, ${42 + r() * 20}%, ${L + (r() - 0.45) * 22}%, ${0.35 + r() * 0.45})`; g.lineWidth = 1 + r() * 1.3;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke(); }
  return c;
}
export function asphaltTex(o = {}) {
  const S = 1024, c = canvas(S, S), g = c.getContext('2d'), r = rng(o.seed ?? 3), base = o.wet ? 30 : 41;
  g.fillStyle = `hsl(230, 5%, ${base}%)`; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 50; i++) { const x = r() * S, y = r() * S, rad = 80 + r() * 220, gr = g.createRadialGradient(x, y, 0, x, y, rad), dl = (r() - 0.55) * 8;
    gr.addColorStop(0, `hsla(230, 5%, ${base + dl}%, 0.5)`); gr.addColorStop(1, `hsla(230, 5%, ${base + dl}%, 0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  for (let i = 0; i < 60000; i++) { g.fillStyle = `hsla(230, 6%, ${base + (r() - 0.5) * 26}%, ${0.25 + r() * 0.4})`; const s = 0.8 + r() * 1.6; g.fillRect(r() * S, r() * S, s, s); }
  g.strokeStyle = `hsla(230, 6%, ${base - 12}%, 0.55)`; g.lineWidth = 1.4;
  for (let i = 0; i < 14; i++) { let x = r() * S, y = r() * S; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
  return c;
}

// The glassy house look: a clear lacquer over everything solid (floors show the room's light in soft streaks, plastic
// chairs a long highlight, posters and boxes a faint sheen). lacquer(root, { coat 0.8, coatRough 0.12, rough 0.5,
// env 1.1, floors 1 }) upgrades every MeshStandardMaterial under root to a clear-coated MeshPhysicalMaterial in place.
// Skips glass, glows, transparent cut-outs (leaves, grass), unlit materials, car paint (already glossy) and anything
// with userData.matte (cloth, sky, a sign that must stay flat). Floors (a horizontal plane facing up) get `floors`;
// upright planes (posters, boards, photos) only a quarter of the coat, rough, so a highlight never covers their text.
export function lacquer(root, o = {}) {
  const coat = o.coat ?? 0.8, cr = o.coatRough ?? 0.12, rmax = o.rough ?? 0.5, env = o.env ?? 1.1, fl = o.floors ?? 1;
  const done = new Map();
  root.traverse((m) => {
    if (!m.isMesh || m.userData.matte) return;
    const one = (mat) => {
      if (!mat || !mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial || mat.transparent || mat.alphaTest > 0 || mat.userData.matte) return mat;
      if (mat.emissiveIntensity > 0.5 && mat.emissive && mat.emissive.getHex()) return mat;
      const plane = m.geometry?.type === 'PlaneGeometry', floor = plane && Math.abs(m.rotation.x + Math.PI / 2) < 0.01, print = plane && !floor, key = mat.uuid + (floor ? 'f' : print ? 'p' : '');
      if (done.has(key)) return done.get(key);
      const p = new THREE.MeshPhysicalMaterial();
      THREE.MeshStandardMaterial.prototype.copy.call(p, mat);
      p.roughness = Math.min(mat.roughness, rmax); p.clearcoat = floor ? fl : print ? coat * 0.25 : coat; p.clearcoatRoughness = floor ? cr * 0.6 : print ? 0.45 : cr;   // posters and boards: a faint sheen, never a glare over the text
      p.envMapIntensity = Math.max(mat.envMapIntensity ?? 1, env); p.userData.lacquered = true; done.set(key, p); return p;
    };
    m.material = Array.isArray(m.material) ? m.material.map(one) : one(m.material);
  });
  return root;
}
