// Copied from Rigging Studio (Content/Rigging-3d-studio/src/look/vfxCode.ts) so VFX code is the same in both studios.
// 2D Studio runs it in the page (like Library/code objects), not in a worker; the camera maths stayed behind.
import type * as ThreeNS from 'three';

// Visual effects made by three.js code: sparks, fire, rings of light, impacts. The code builds the effect once and
// gives back an update(t) that sets it for any moment, so the studio can jump about the timeline, play it, and record
// it. It runs in a worker of its own (src/workers/vfxWorker.ts), cut off from the page, the projects and the network,
// which renders it with the studio's own camera, frame by frame. This file is the part with no browser in it: the rules,
// the examples, running the code, and the camera maths. The worker and the tests both use it.

type Three = typeof ThreeNS;

/** The rules a VFX's code follows: shown in the editor, and what a prompt that writes one is given. */
export const VFX_CONTRACT = `Write JavaScript that makes a visual effect with three.js: sparks, fire, smoke, magic, energy, impacts.
- THREE is already there (an import of 'three' is allowed and ignored). Nothing else can be imported. A helper, fx, is there too.
- Build the effect once, then end with: return { object, update };
    object: a THREE.Group (or any Object3D) holding the effect.
    update(t): called for every frame with t, the seconds since the effect started. Set everything from t alone: the
    studio jumps around its timeline, so the same t must always give the same picture. Never count frames or add up time.
- Or write: export default function vfx(THREE, fx) { ...; return { object, update }; }
- Units are metres, +Y is up. The effect is placed where it's put (a character's feet, chest, head or hand, or a spot in
  the scene): build it around 0, 0, 0, on y = 0 if it sits on the floor. +Z is the way the character it's on faces.
- fx.random() gives the same random numbers in the same order every time. fx.hash(n) is a random number from 0 to 1 for
  any number n, the same every time: use it inside update(t). fx.duration is how long the effect is on the timeline, in
  seconds. fx.fade(t, inSeconds, outSeconds) goes 0 to 1 at the start and back to 0 at the end of fx.duration.
- fx.dot() is a soft round glow texture and fx.ring() a soft ring: the map of a PointsMaterial, SpriteMaterial or MeshBasicMaterial.
- Light (sparks, fire, glows, energy) uses blending: THREE.AdditiveBlending, transparent: true, depthWrite: false.
  Smoke and dust use normal blending with transparent: true. PointsMaterial size is in metres.
- Use MeshBasicMaterial, PointsMaterial, SpriteMaterial or LineBasicMaterial. MeshStandardMaterial gets a soft light.
  A ShaderMaterial works; give it clipping: true and three's clipping chunks if it should go round behind a character.
- No network, no DOM, no timers. Under 200,000 particles and two million triangles.`;

/** Where an example sits best on a character, and how long it runs. */
export type VfxAt = 'feet' | 'hips' | 'chest' | 'head' | 'leftHand' | 'rightHand';

/** Effects to start from: each one runs as it is. */
export const VFX_EXAMPLES: { name: string; at: VfxAt; dur: number; offset?: [number, number, number]; code: string }[] = [
  {
    name: 'Sparkle Burst',
    at: 'chest',
    dur: 2.5,
    code: `// A burst of sparkles: they fly out, slow down, fall and twinkle out.
const COUNT = 600;
const pos = new Float32Array(COUNT * 3), col = new Float32Array(COUNT * 3);
const base = [], dir = [], speed = [], life = [];
const gold = new THREE.Color(0xffd36b), pink = new THREE.Color(0xff6bd5);
for (let i = 0; i < COUNT; i++) {
  // Anywhere on a sphere, at its own speed, lasting its own time.
  const u = fx.random() * 2 - 1, a = fx.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
  dir.push([r * Math.cos(a), u, r * Math.sin(a)]);
  speed.push(1.5 + fx.random() * 3);
  life.push(0.8 + fx.random() * 1.4);
  base.push(gold.clone().lerp(pink, fx.random()));
}
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
const mat = new THREE.PointsMaterial({ size: 0.07, map: fx.dot(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
const points = new THREE.Points(geo, mat);
points.frustumCulled = false;
const group = new THREE.Group();
group.add(points);

function update(t) {
  // Out fast, slowed by the air, and falling.
  const out = (1 - Math.exp(-3 * t)) / 3;
  for (let i = 0; i < COUNT; i++) {
    const d = speed[i] * out;
    pos[i * 3] = dir[i][0] * d;
    pos[i * 3 + 1] = dir[i][1] * d - 0.5 * t * t;
    pos[i * 3 + 2] = dir[i][2] * d;
    const left = Math.max(0, 1 - t / life[i]);
    const twinkle = 0.55 + 0.45 * Math.sin(t * 25 + i * 1.7);
    const k = left * left * twinkle * Math.min(1, t * 20);
    col[i * 3] = base[i].r * k;
    col[i * 3 + 1] = base[i].g * k;
    col[i * 3 + 2] = base[i].b * k;
  }
  geo.attributes.position.needsUpdate = true;
  geo.attributes.color.needsUpdate = true;
}

return { object: group, update };`,
  },
  {
    name: 'Energy Rings',
    at: 'feet',
    dur: 4,
    code: `// Rings of light rising round whoever it's on, and sparks spiralling up with them.
const group = new THREE.Group();
const rings = [];
for (let i = 0; i < 4; i++) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: fx.ring(), color: 0x3ad7ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2;
  group.add(m);
  rings.push(m);
}

const COUNT = 260;
const pos = new Float32Array(COUNT * 3);
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const sparks = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.05, map: fx.dot(), color: 0xa8f0ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
sparks.frustumCulled = false;
group.add(sparks);
const spark = [];
for (let i = 0; i < COUNT; i++) spark.push({ a: fx.random() * Math.PI * 2, r: 0.35 + fx.random() * 0.25, rise: 0.5 + fx.random() * 0.9, h: fx.random() * 2.2, turn: 1.5 + fx.random() * 2 });

function update(t) {
  const f = fx.fade(t, 0.4, 0.6);
  rings.forEach((m, i) => {
    // Each ring's own life, one after another: wide at the floor, rising and closing in, fading at the top.
    const p = (t * 0.6 + i / rings.length) % 1;
    const s = 1.6 - p * 0.7;
    m.scale.set(s, s, 1);
    m.position.y = 0.03 + p * 1.9;
    m.material.opacity = Math.sin(p * Math.PI) * f;
  });
  for (let i = 0; i < COUNT; i++) {
    const s = spark[i], h = (s.h + t * s.rise) % 2.2, a = s.a + t * s.turn;
    pos[i * 3] = Math.cos(a) * s.r;
    pos[i * 3 + 1] = h;
    pos[i * 3 + 2] = Math.sin(a) * s.r;
  }
  geo.attributes.position.needsUpdate = true;
  sparks.material.opacity = f;
}

return { object: group, update };`,
  },
  {
    name: 'Fire',
    at: 'feet',
    dur: 5,
    offset: [0, 0, 0.9],
    code: `// A fire on the floor: flames rising and flickering, cooling from yellow to orange to deep red.
const group = new THREE.Group();
const dot = fx.dot();
const flames = [];
for (let i = 0; i < 150; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xffaa33, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  group.add(s);
  flames.push({ s, x: (fx.random() - 0.5) * 0.5, z: (fx.random() - 0.5) * 0.5, phase: fx.random(), life: 0.6 + fx.random() * 0.6, size: 0.22 + fx.random() * 0.22 });
}
const hot = new THREE.Color(0xfff2b0), mid = new THREE.Color(0xff7a1a), cool = new THREE.Color(0x7a1404);

function update(t) {
  const f = fx.fade(t, 0.3, 0.5);
  for (const p of flames) {
    // 0 to 1 over each flame's life, over and over: up, in towards the middle, smaller and cooler.
    const k = (t / p.life + p.phase) % 1;
    const sway = Math.sin(t * 7 + p.phase * 40) * 0.05 * k;
    p.s.position.set(p.x * (1 - k * 0.7) + sway, k * 1.1, p.z * (1 - k * 0.7));
    const size = p.size * (1 - k * 0.55);
    p.s.scale.set(size, size * 1.4, 1);
    if (k < 0.35) p.s.material.color.copy(hot).lerp(mid, k / 0.35);
    else p.s.material.color.copy(mid).lerp(cool, (k - 0.35) / 0.65);
    p.s.material.opacity = Math.sin(Math.PI * Math.min(1, k * 1.25)) * 0.75 * f;
  }
}

return { object: group, update };`,
  },
  {
    name: 'Magic Circle',
    at: 'feet',
    dur: 4,
    code: `// A magic circle on the floor: rings and runes turning, growing as it appears.
const group = new THREE.Group();
const light = (color, opacity = 1) => {
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  m.userData.opacity = opacity;
  return m;
};
const flat = (geometry, material) => {
  const m = new THREE.Mesh(geometry, material);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.01;
  return m;
};
const outer = new THREE.Group(), inner = new THREE.Group();
outer.add(flat(new THREE.RingGeometry(0.97, 1.0, 128), light(0xb07bff)));
outer.add(flat(new THREE.RingGeometry(0.8, 0.82, 128), light(0xb07bff)));
// Runes round the ring: short and long marks.
for (let i = 0; i < 36; i++) {
  const a = (i / 36) * Math.PI * 2;
  const m = flat(new THREE.PlaneGeometry(0.035, i % 3 ? 0.06 : 0.12), light(0xe2ccff));
  m.position.set(Math.cos(a) * 0.89, 0.012, Math.sin(a) * 0.89);
  m.rotation.z = -a + Math.PI / 2;
  outer.add(m);
}
// A six-pointed star inside.
const star = [];
for (let i = 0; i <= 6; i++) {
  const a = (i / 6) * Math.PI * 2, b = ((i + 0.5) / 6) * Math.PI * 2;
  star.push(new THREE.Vector3(Math.cos(a) * 0.78, 0.015, Math.sin(a) * 0.78));
  if (i < 6) star.push(new THREE.Vector3(Math.cos(b) * 0.45, 0.015, Math.sin(b) * 0.45));
}
inner.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(star), new THREE.LineBasicMaterial({ color: 0xd6b8ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
inner.add(flat(new THREE.RingGeometry(0.42, 0.44, 96), light(0xb07bff)));
// A soft glow under it all.
const glow = flat(new THREE.PlaneGeometry(2.6, 2.6), light(0x7b3cff, 0.5));
glow.material.map = fx.dot();
group.add(glow, outer, inner);

function update(t) {
  const f = fx.fade(t, 0.5, 0.7);
  const grow = 1 - Math.pow(1 - Math.min(1, t / 0.8), 3);
  group.scale.setScalar(0.25 + 0.75 * grow);
  outer.rotation.y = t * 0.4;
  inner.rotation.y = -t * 0.8;
  const shimmer = 0.85 + 0.15 * Math.sin(t * 9);
  group.traverse((o) => { if (o.material) o.material.opacity = f * shimmer * (o.material.userData.opacity ?? 1); });
}

return { object: group, update };`,
  },
  {
    name: 'Fireball in the Hand',
    at: 'rightHand',
    dur: 3,
    code: `// A fireball held in the hand: a hot core, a glow round it, and sparks swirling about.
const group = new THREE.Group();
const dot = fx.dot();
const sprite = (color) => new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
const halo = sprite(0xff4a0a), core = sprite(0xffe6a0);
group.add(halo, core);

const COUNT = 220;
const pos = new Float32Array(COUNT * 3);
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const sparks = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.025, map: dot, color: 0xffb347, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
sparks.frustumCulled = false;
group.add(sparks);
// Each spark on a tilted orbit of its own.
const orbit = [];
for (let i = 0; i < COUNT; i++) {
  const axis = new THREE.Vector3(fx.random() - 0.5, fx.random() - 0.5, fx.random() - 0.5).normalize();
  orbit.push({ q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis), r: 0.07 + fx.random() * 0.12, a: fx.random() * Math.PI * 2, speed: 4 + fx.random() * 6 });
}
const v = new THREE.Vector3();

function update(t) {
  const f = fx.fade(t, 0.25, 0.35);
  const pulse = 1 + 0.12 * Math.sin(t * 14) + 0.06 * Math.sin(t * 31);
  core.scale.setScalar(0.14 * pulse * f);
  halo.scale.setScalar(0.4 * pulse * f);
  for (let i = 0; i < COUNT; i++) {
    const o = orbit[i], a = o.a + t * o.speed, r = o.r * (0.85 + 0.15 * Math.sin(t * 3 + i));
    v.set(Math.cos(a) * r, 0, Math.sin(a) * r).applyQuaternion(o.q);
    pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
  }
  geo.attributes.position.needsUpdate = true;
  sparks.material.opacity = f;
}

return { object: group, update };`,
  },
  {
    name: 'Impact',
    at: 'feet',
    dur: 1.6,
    code: `// An impact on the floor: a flash, a shockwave racing out, and dust kicked up.
const group = new THREE.Group();
const dot = fx.dot();
const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xfff4d0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
flash.position.y = 0.3;
const wave = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: fx.ring(), color: 0xfff0c0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
wave.rotation.x = -Math.PI / 2;
wave.position.y = 0.02;
group.add(flash, wave);
// Dust: soft brown puffs, drawn as smoke is, not as light.
const puffs = [];
for (let i = 0; i < 40; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xb8a690, transparent: true, depthWrite: false }));
  puffs.push({ s, a: fx.random() * Math.PI * 2, far: 0.6 + fx.random() * 0.9, up: 0.1 + fx.random() * 0.4, size: 0.3 + fx.random() * 0.4 });
  group.add(s);
}

function update(t) {
  flash.material.opacity = Math.max(0, 1 - t / 0.25);
  flash.scale.setScalar(0.6 + t * 4);
  const p = Math.min(1, t / 0.6);
  wave.scale.setScalar(0.2 + (1 - Math.pow(1 - p, 3)) * 4);
  wave.material.opacity = 1 - p;
  const out = 1 - Math.exp(-4 * t), k = Math.min(1, t / fx.duration);
  for (const d of puffs) {
    d.s.position.set(Math.cos(d.a) * d.far * out, 0.12 + d.up * out, Math.sin(d.a) * d.far * out);
    d.s.scale.setScalar(d.size * (0.5 + k));
    d.s.material.opacity = 0.5 * (1 - k) * Math.min(1, t * 12);
  }
}

return { object: group, update };`,
  },
];

export class VfxCodeError extends Error { constructor(message: string, readonly line?: number) { super(message); } }

/** What an effect's code gives back once it's run: the effect, and what sets it for a moment. */
export interface BuiltVfx {
  object: ThreeNS.Object3D;
  update: ((t: number) => void) | null;
  /** fx.duration and the rest, which the studio changes as the effect is trimmed. */
  fx: VfxHelpers;
  stats: { meshes: number; particles: number; triangles: number };
}

export interface VfxHelpers {
  random: () => number;
  hash: (n: number) => number;
  fade: (t: number, inSeconds?: number, outSeconds?: number) => number;
  dot: (size?: number) => ThreeNS.DataTexture;
  ring: (size?: number) => ThreeNS.DataTexture;
  duration: number;
  seed: number;
}

/** The same numbers in the same order for the same seed: what fx.random() gives. */
export function seededRandom(seed: number) {
  let a = (Math.floor(seed) >>> 0) || 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random number from 0 to 1 for any number, the same every time: what fx.hash(n) gives. */
export function hashNumber(n: number, seed = 0) {
  let h = Math.imul((Math.floor(n * 1000) | 0) ^ 0x27d4eb2d, 0x165667b1) ^ Math.imul(seed | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca77);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae3d);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** The helpers an effect's code is given as `fx`. */
export function vfxHelpers(THREE: Three, seed: number, duration: number): VfxHelpers {
  const textures = new Map<string, ThreeNS.DataTexture>();
  /** A white texture whose alpha is `alpha(r)` at each distance from the middle (1 at the edge). */
  const radial = (key: string, size: number, alpha: (r: number) => number) => {
    const k = `${key}:${size}`;
    let tex = textures.get(k);
    if (tex) return tex;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x + 0.5) / size * 2 - 1, dy = (y + 0.5) / size * 2 - 1, r = Math.sqrt(dx * dx + dy * dy);
        const i = (y * size + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = 255;
        data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, r >= 1 ? 0 : alpha(r))));
      }
    }
    tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    textures.set(k, tex);
    return tex;
  };
  const smooth = (x: number) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); };
  const fx: VfxHelpers = {
    random: seededRandom(seed),
    hash: (n: number) => hashNumber(n, seed),
    fade: (t: number, inSeconds = 0.3, outSeconds = 0.3) => {
      const a = inSeconds > 0 ? smooth(t / inSeconds) : 1;
      const b = outSeconds > 0 ? smooth((fx.duration - t) / outSeconds) : 1;
      return Math.min(a, b);
    },
    dot: (size = 64) => radial('dot', size, (r) => Math.pow(1 - r, 2) * 0.75 + Math.pow(Math.max(0, 1 - r * 2.2), 2) * 0.5),
    ring: (size = 128) => radial('ring', size, (r) => Math.exp(-(((r - 0.82) / 0.07) ** 2)) + 0.25 * Math.exp(-(((r - 0.78) / 0.22) ** 2))),
    duration,
    seed,
  };
  return fx;
}

/** The code as the body of a function given THREE and fx: imports of three dropped, a default export returned. */
export function prepareVfxCode(code: string) {
  let s = code
    .replace(/^\s*import\s+\*\s+as\s+THREE\s+from\s+['"]three['"];?\s*$/gm, '')
    .replace(/^\s*import\s+(?:\{[^}]*\}|\w+)\s+from\s+['"]three['"];?\s*$/gm, '');
  if (/^\s*import\s/m.test(s)) throw new VfxCodeError('Only three.js itself can be imported. Write everything else in the code.');
  if (/\bexport\s+default\b/.test(s)) s = `${s.replace(/\bexport\s+default\b/, 'const __default =')}\n;return typeof __default === 'function' ? __default(THREE, fx) : __default;`;
  return `'use strict';\n${s}`;
}

/** The line of the effect's code an error came from, when its stack says (the code starts three lines into its function). */
export function vfxErrorLine(err: unknown): number | undefined {
  const at = err instanceof Error ? err.stack?.match(/<anonymous>:(\d+):(\d+)/) : null;
  return at ? Math.max(1, +at[1] - 3) : undefined;
}

/** An error from the effect's code, as one the studio can show: its message and line. */
export function asVfxError(err: unknown, where = ''): VfxCodeError {
  if (err instanceof VfxCodeError) return err;
  const e = err instanceof Error ? err : new Error(String(err));
  return new VfxCodeError(`${where}${e.message}`, vfxErrorLine(e));
}

const MAX_PARTICLES = 200_000, MAX_TRIANGLES = 2_000_000;

/** Runs an effect's code: what it built, checked, and its update(t). Throws a VfxCodeError with the line when it can. */
export function buildVfx(THREE: Three, code: string, o: { seed?: number; duration?: number } = {}): BuiltVfx {
  const fx = vfxHelpers(THREE, o.seed ?? 1, o.duration ?? 3);
  let out: unknown;
  try {
    const fn = new Function('THREE', 'fx', prepareVfxCode(code)) as (three: Three, h: VfxHelpers) => unknown;
    out = fn(THREE, fx);
    if (typeof out === 'function') out = (out as (three: Three, h: VfxHelpers) => unknown)(THREE, fx);
  } catch (err) { throw asVfxError(err); }
  const r = out as { object?: ThreeNS.Object3D; update?: unknown; isObject3D?: boolean } | undefined;
  let object: ThreeNS.Object3D | undefined, update: ((t: number) => void) | null = null;
  if (r?.isObject3D) object = r as ThreeNS.Object3D;
  else if (r?.object?.isObject3D) {
    object = r.object;
    if (r.update !== undefined && typeof r.update !== 'function') throw new VfxCodeError('update has to be a function: update(t) { ... }, given the seconds since the effect started.');
    update = (r.update as ((t: number) => void) | undefined) ?? null;
  }
  if (!object) throw new VfxCodeError('The code has to end with: return { object, update }; object a THREE.Group (or any Object3D), update(t) a function that sets the effect for t seconds in.');
  const stats = { meshes: 0, particles: 0, triangles: 0 };
  let shown = 0;
  object.traverse((x) => {
    const m = x as ThreeNS.Mesh & ThreeNS.Points & ThreeNS.Sprite & ThreeNS.Line;
    if (m.isPoints) { shown++; stats.particles += m.geometry.getAttribute('position')?.count ?? 0; }
    else if (m.isSprite) { shown++; stats.particles++; }
    else if (m.isMesh) {
      shown++; stats.meshes++;
      const g = m.geometry;
      stats.triangles += (g.index ? g.index.count : g.getAttribute('position')?.count ?? 0) / 3;
    } else if (m.isLine) shown++;
  });
  stats.triangles = Math.round(stats.triangles);
  if (!shown) throw new VfxCodeError('The effect has nothing in it to see. Add THREE.Points, Sprites, Meshes or Lines to the object.');
  if (stats.particles > MAX_PARTICLES) throw new VfxCodeError(`The effect has ${stats.particles.toLocaleString()} particles: keep it under ${MAX_PARTICLES.toLocaleString()}.`);
  if (stats.triangles > MAX_TRIANGLES) throw new VfxCodeError(`The effect has ${stats.triangles.toLocaleString()} triangles: keep it under two million.`);
  return { object, update, fx, stats };
}

/** Sets the effect for a moment, its errors as the studio shows them. */
export function updateVfx(built: BuiltVfx, t: number) {
  if (!built.update) return;
  try { built.update(t); } catch (err) { throw asVfxError(err, `At ${t.toFixed(2)} s: `); }
}

