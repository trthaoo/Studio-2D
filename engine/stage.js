// A stage = one THREE.Scene + camera + painted sky + hemisphere and sun lights, set by a mood.
// Moods follow the three colour acts: day (act 1), dusk and night (act 2), rain (act 3).
// 'day' is the exact look of the approved 5 s test. The others are starting points: check a still.
import { THREE, W, H, V3, rng, canvas, ctex, renderer } from './core.js';

export const MOODS = {
  day: {
    sky: ['#0a55cf', '#1b84ee', '#6fbcff', '#c9e8ff'], ground: ['#9fb6a0', '#6e7a66', '#55585e'],
    cloud: ['#6f7fb8', '#e9eef8', '#c0c8e8', '#fdfbf6'], clouds: 30,
    fog: [0xb4dcff, 180, 1100], env: 0.9, hemi: [0xd6eaff, 0x7c8c66, 1.25], sun: [0xfff3dc, 3.3], sunDir: [0.42, 0.78, 0.46],
    grade: 'saturate(1.12) contrast(1.04)', exposure: 1.0,
    paint: { sat: 1.0, bright: 1.0, haze: [14, 170, 0.22], tintShadow: [0.004, 0, 0.022], tintHigh: [0.006, 0.003, 0], vignette: [0.12, 0.45] }, charTint: [1, 1, 1],
  },
  dusk: {
    sky: ['#2a2a7a', '#6b4fb8', '#e9849a', '#ffc58a'], ground: ['#8a7f8f', '#5a5466', '#3f3d4a'],
    cloud: ['#5a3f7a', '#f3c6d2', '#a983a8', '#ffe3d2'], clouds: 24,
    fog: [0xc79ab8, 150, 900], env: 0.75, hemi: [0xb9a3ff, 0x5a4a5e, 1.0], sun: [0xffb27a, 2.4], sunDir: [-0.55, 0.32, 0.4],
    grade: 'saturate(1.25) contrast(1.05)', exposure: 1.0,
    paint: { sat: 1.05, bright: 1.0, haze: [14, 160, 0.22], tintShadow: [0.012, 0, 0.04], tintHigh: [0.02, 0.008, -0.01], vignette: [0.2, 0.4] }, charTint: [1, 0.94, 0.96],
  },
  night: {
    sky: ['#040a26', '#0b1a4d', '#173073', '#2b4a8f'], ground: ['#1d2438', '#151a28', '#0e121c'],
    cloud: ['#0a1436', '#2b3f78', '#1f3062', '#3a5294'], clouds: 14,
    fog: [0x18286a, 80, 700], env: 0.6, hemi: [0x6f8cff, 0x1c2348, 1.35], sun: [0x9fb8ff, 1.6], sunDir: [0.3, 0.8, -0.4], stars: 500,
    grade: 'saturate(1.35) contrast(1.08)', exposure: 1.15,
    paint: { sat: 1.05, bright: 1.0, haze: [12, 140, 0.18], tintShadow: [0, 0.004, 0.03], vignette: [0.22, 0.4] }, charTint: [0.86, 0.9, 1.0],
  },
  rain: {
    sky: ['#2f4a66', '#4f6d8c', '#7f9bb5', '#a7bccd'], ground: ['#5f6f78', '#4d5a62', '#3e474e'],
    cloud: ['#3f5670', '#8aa0b6', '#6b829a', '#a2b5c6'], clouds: 60,
    fog: [0x7f97ad, 40, 420], env: 0.6, hemi: [0xa9c2dc, 0x3f4c56, 1.2], sun: [0xd6e4f2, 0.9], sunDir: [0.2, 0.9, 0.3],
    grade: 'saturate(0.8) contrast(0.98)', exposure: 0.95,
    paint: { sat: 0.78, bright: 1.0, haze: [6, 95, 0.36], tintShadow: [0, 0.004, 0.018], vignette: [0.18, 0.42] }, charTint: [0.88, 0.91, 0.96],
  },
};

// Painted clouds (no outlines): each cloud is drawn on its own small canvas from many soft radial puffs, then shaded
// top-to-bottom (sunlit top, grey-blue flat base) and faded out at the base before it goes onto the sky.
// col = [deep shade, body, base shade, sunlit top]. kind 'cu' = cumulus heap, 'st' = long thin wisp (like the reference).
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixC = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, k) => Math.round(v + (B[k] - v) * t)).join(',')})`; };
function drawCloud(c, x, y, s, seed, col, kind = 'cu', alpha = 1) {
  const r = rng(seed), wide = kind === 'st';
  const cw = Math.ceil(s * (wide ? 9 : 4.2)), ch = Math.ceil(s * (wide ? 1.1 : 2.7)), oc = canvas(cw, ch), g = oc.getContext('2d');
  const puff = (px, py, rad, a) => { const gr = g.createRadialGradient(px, py, 0, px, py, rad); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.55, `rgba(255,255,255,${a * 0.75})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(px - rad, py - rad, rad * 2, rad * 2); };
  const base = ch * (wide ? 0.62 : 0.8);
  if (wide) {   // long flat wisp: stretched puffs along a gently curving line
    g.save(); g.scale(1, 0.32);
    const n = 26 + Math.floor(r() * 14);
    for (let i = 0; i < n; i++) { const u = r(), px = cw * (0.06 + 0.88 * u), bump = Math.sin(u * Math.PI); puff(px, (base - bump * s * 0.25 + (r() - 0.5) * s * 0.3) / 0.32, s * (0.3 + 0.5 * bump) * (0.6 + r() * 0.6), 0.45 + r() * 0.35); }
    g.restore();
  } else {      // cumulus: a heap of puffs, bigger in the middle, flat at the base
    const n = 22 + Math.floor(r() * 16);
    for (let i = 0; i < n; i++) {
      const u = r(), b = Math.sin(u * Math.PI), rad = s * (0.28 + 0.5 * b) * (0.7 + r() * 0.5);
      const px = cw * (0.12 + 0.76 * u), py = Math.min(base - rad * 0.35, base - b * s * (0.35 + r() * 0.55) - r() * s * 0.2);
      puff(px, py, rad, 0.7 + r() * 0.3);
    }
  }
  // shading: tint the alpha shape (sunlit top -> body -> grey-blue base)
  g.globalCompositeOperation = 'source-atop';
  const gr = g.createLinearGradient(0, base - s * (wide ? 0.7 : 1.6), 0, base);
  gr.addColorStop(0, col[3]); gr.addColorStop(0.45, col[1]); gr.addColorStop(0.85, mixC(col[2], col[0], 0.35)); gr.addColorStop(1, mixC(col[2], col[0], 0.6));
  g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
  // fade the base out (soft, slightly flat underside) instead of a hard cut
  g.globalCompositeOperation = 'destination-out';
  const fo = g.createLinearGradient(0, base - s * 0.12, 0, base + s * 0.18); fo.addColorStop(0, 'rgba(0,0,0,0)'); fo.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = fo; g.fillRect(0, base - s * 0.12, cw, ch);
  c.save(); c.globalAlpha = alpha; c.drawImage(oc, x - cw / 2, y - base); c.restore();
}
export function skyCanvas(m) {
  const SW = 4096, SH = 2048, c = canvas(SW, SH), g = c.getContext('2d');
  let gr = g.createLinearGradient(0, 0, 0, SH / 2);
  gr.addColorStop(0, m.sky[0]); gr.addColorStop(0.55, m.sky[1]); gr.addColorStop(0.88, m.sky[2]); gr.addColorStop(1, m.sky[3]);
  g.fillStyle = gr; g.fillRect(0, 0, SW, SH / 2);
  gr = g.createLinearGradient(0, SH / 2, 0, SH);
  gr.addColorStop(0, m.ground[0]); gr.addColorStop(0.2, m.ground[1]); gr.addColorStop(1, m.ground[2]);
  g.fillStyle = gr; g.fillRect(0, SH / 2, SW, SH / 2);
  if (m.stars) { const r = rng(3); g.fillStyle = '#ffffff'; for (let i = 0; i < m.stars; i++) { g.globalAlpha = 0.3 + r() * 0.7; g.fillRect(r() * SW, r() * SH * 0.42, 2, 2); } g.globalAlpha = 1; }
  // clouds: smaller and more numerous near the horizon (perspective), long thin wisps higher up, a few heaps low down
  const r = rng(7), wisp = m.wisps ?? Math.round(m.clouds * 0.6);
  const list = [];
  for (let i = 0; i < m.clouds; i++) { const el = 0.02 + r() ** 1.6 * 0.3; list.push(['cu', r() * SW, el, 14 + el * 150 + r() * 22, 0.92]); }
  for (let i = 0; i < wisp; i++) { const el = 0.05 + r() * 0.32; list.push(['st', r() * SW, el, 18 + el * 120 + r() * 20, 0.55 + r() * 0.35]); }
  list.sort((a, b) => b[2] - a[2]);   // far (low) clouds last so they overlap the high ones like real layers
  list.forEach(([kind, x, el, sz, a], i) => { const y = SH / 2 - el * SH / 2 * 1.25; for (const dx of [-SW, 0, SW]) drawCloud(g, x + dx, y, sz, 100 + i, m.cloud, kind, a); });
  return c;
}

// makeStage({ mood: 'day' | 'dusk' | 'night' | 'rain' | {...custom}, fov, near, far })
// -> { scene, camera, sky, hemi, sun, sunDir, mood, follow(x, y, z) }  follow() keeps the sun's shadow box on the action.
export function makeStage(o = {}) {
  const m = typeof o.mood === 'object' ? o.mood : MOODS[o.mood || 'day'];
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(m.fog[0], m.fog[1], m.fog[2]);
  const camera = new THREE.PerspectiveCamera(o.fov || 60, W / H, o.near || 0.03, o.far || 2500);
  const skyTex = ctex(skyCanvas(m));
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false }));
  sky.renderOrder = -10; sky.userData.noHit = true; scene.add(sky);
  {
    const envTex = ctex(skyTex.image); envTex.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromEquirectangular(envTex).texture; scene.environmentIntensity = m.env;
  }
  const hemi = new THREE.HemisphereLight(m.hemi[0], m.hemi[1], m.hemi[2]); hemi.layers.enableAll(); scene.add(hemi);
  const sun = new THREE.DirectionalLight(m.sun[0], m.sun[1]);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.layers.enableAll(); sun.shadow.camera.layers.enableAll();   // characters (CHAR_LAYER) cast shadows too
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 170 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025;
  scene.add(sun); scene.add(sun.target);
  const sunDir = V3(...m.sunDir).normalize();
  const st = {
    scene, camera, sky, hemi, sun, sunDir, mood: m, moodName: typeof o.mood === 'string' ? o.mood : (o.mood?.name || 'day'), grade: m.grade,
    follow(x, y, z) { sun.target.position.set(Math.round(x * 2) / 2, y, z); sun.position.copy(sun.target.position).addScaledVector(sunDir, 80); },
    // call once per frame after the camera moves: sky follows the camera, near plane and exposure set.
    frame() { sky.position.copy(camera.position); renderer.toneMappingExposure = (this.mood || m).exposure; },   // 2D Studio: mood can change live
  };
  return st;
}

// A pool of light (street lamp, porch light, string-light bulb): point light + soft additive glow.
// lamp(scene, x, y, z, { color, intensity, range, glow }) -> { light, sprite }
import { puffTex } from './materials.js';
export function lamp(scene, x, y, z, o = {}) {
  const color = o.color ?? 0xffd08a;
  const light = new THREE.PointLight(color, o.intensity ?? 30, o.range ?? 14, 1.6); light.position.set(x, y, z); light.layers.enableAll(); scene.add(light);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  sprite.position.set(x, y, z); sprite.scale.setScalar(o.glow ?? 1.4); scene.add(sprite);
  return { light, sprite };
}
