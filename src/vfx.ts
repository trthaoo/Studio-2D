// VFX: particle effects as scene objects (kind 'fx'), editable on the timeline like everything else.
// Every effect is a pure function of time (any frame can be drawn on its own, scrubbing and rendering agree):
// particle i of an emitter is born at a fixed time and has fixed random numbers, so its place at t is computed.
// - looping effects (smoke, fire, rain...) run while the object is visible, `amount` sets how much (0 = off);
// - one-shot effects (explosion, dust burst, impact...) start when the object turns visible (a `visible` key: off,
//   then on at the moment of the bang); hide and show again to play it again.
// Sprites sit on the engine's glass layer: drawn after the characters, hidden behind walls, not outlined.
import * as THREE from 'three';
import { GLASS_LAYER } from 'engine/core.js';
import { puffTex } from 'engine/materials.js';
import { buildVfx, updateVfx } from './vfxCode';
import { vfxCodeOf, vfxHeader } from './library';

/** Where on a character an effect sits when it follows one (Rigging Studio's names). */
export const FX_AT = ['feet', 'hips', 'chest', 'head', 'leftHand', 'rightHand'] as const;
export const FX_AT_VI: Record<string, string> = { feet: 'Dưới chân', hips: 'Hông', chest: 'Ngực', head: 'Đầu', leftHand: 'Tay trái', rightHand: 'Tay phải' };
/** Where a preset sits best when added on a character. */
export const FX_DEFAULT_AT: Record<string, string> = { smoke: 'head', steam: 'head', fire: 'feet', sparks: 'rightHand', magic: 'chest', rain: 'feet', snow: 'feet', confetti: 'feet', hearts: 'head', bubbles: 'head', explosion: 'feet', dust: 'feet', impact: 'head', splash: 'feet', pop: 'chest', flash: 'chest' };

export interface FxDef { label: string; tip: string; burst?: boolean; color: string; additive?: boolean; tex?: 'puff' | 'star' | 'heart' | 'square' | 'streak' | 'ring'; n: number; life: number; rate?: number }
export const FX: Record<string, FxDef> = {
  smoke: { label: 'Khói', tip: 'Khói xám bốc lên, loang ra.', color: '#9a9aa2', n: 70, life: 3.2, rate: 18 },
  steam: { label: 'Hơi nước', tip: 'Hơi trắng mỏng bốc lên (cốc cà phê, nồi).', color: '#ffffff', n: 40, life: 1.8, rate: 18 },
  fire: { label: 'Lửa', tip: 'Ngọn lửa bập bùng, có tàn lửa.', color: '#ff7a1a', n: 90, life: 0.9, rate: 80 },
  sparks: { label: 'Tia lửa', tip: 'Tia lửa bắn lên rồi rơi (máy hàn, chập điện).', color: '#ffd23a', additive: true, tex: 'streak', n: 80, life: 0.9, rate: 70 },
  magic: { label: 'Lấp lánh phép thuật', tip: 'Ánh sao lấp lánh bay lên.', color: '#b98cff', additive: true, tex: 'star', n: 60, life: 1.6, rate: 30 },
  rain: { label: 'Mưa', tip: 'Mưa rơi trong một vùng (đặt ở giữa cảnh, chỉnh cỡ).', color: '#7d93b4', tex: 'streak', n: 400, life: 0.6, rate: 600 },
  snow: { label: 'Tuyết', tip: 'Tuyết rơi chậm, lắc nhẹ.', color: '#ffffff', n: 260, life: 5, rate: 50 },
  confetti: { label: 'Giấy kim tuyến rơi', tip: 'Giấy màu rơi xoay tròn, ăn mừng.', color: '#ffffff', tex: 'square', n: 180, life: 3.5, rate: 50 },
  hearts: { label: 'Tim bay', tip: 'Tim nhỏ bay lên (yêu, thích).', color: '#ff4f7a', tex: 'heart', n: 24, life: 2.2, rate: 7 },
  bubbles: { label: 'Bong bóng', tip: 'Bong bóng nổi lên.', color: '#bfeaff', tex: 'ring', n: 40, life: 2.6, rate: 10 },
  explosion: { label: 'Vụ nổ', tip: 'Chớp sáng, cầu lửa, khói đen, tàn bay ra.', burst: true, color: '#ff8a1a', n: 120, life: 2.6 },
  dust: { label: 'Bụi tung', tip: 'Vòng bụi tung ra sát đất (ngã, xe phanh, rơi).', burst: true, color: '#c9b79a', n: 50, life: 1.6 },
  impact: { label: 'Va chạm (kiểu truyện tranh)', tip: 'Ngôi sao chớp và vạch toả ra: cú đấm, va đầu.', burst: true, color: '#ffe14a', tex: 'star', n: 22, life: 0.45 },
  splash: { label: 'Nước bắn', tip: 'Giọt nước văng lên rồi rơi.', burst: true, color: '#7cc6ff', n: 60, life: 1.0 },
  pop: { label: 'Kim tuyến nổ', tip: 'Pháo giấy bung ra một lần.', burst: true, color: '#ffffff', tex: 'square', n: 120, life: 2.6 },
  flash: { label: 'Chớp sáng', tip: 'Một chớp sáng lớn (đèn flash, sét, phép).', burst: true, color: '#ffffff', additive: true, n: 1, life: 0.35 },
};
export const FX_NAMES = Object.keys(FX);

// ---------------------------------------------------------------- textures
function tex(draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; draw(g, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const TEX: Record<string, THREE.Texture> = {};
const once = (k: string, f: () => THREE.Texture) => (): THREE.Texture => (TEX[k] ||= f());
const texOf: Record<string, () => THREE.Texture> = {
  puff: () => puffTex,
  star: once('star', () => tex((g, s) => { g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.18 : s * 0.48, a = (i / 10) * Math.PI * 2 - Math.PI / 2; g.lineTo(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r); } g.fill(); })),
  heart: once('heart', () => tex((g, s) => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(s / 2, s * 0.85); g.bezierCurveTo(s * 0.05, s * 0.5, s * 0.2, s * 0.08, s / 2, s * 0.32); g.bezierCurveTo(s * 0.8, s * 0.08, s * 0.95, s * 0.5, s / 2, s * 0.85); g.fill(); })),
  square: once('square', () => tex((g, s) => { g.fillStyle = '#fff'; g.fillRect(s * 0.2, s * 0.32, s * 0.6, s * 0.36); })),
  streak: once('streak', () => tex((g, s) => { const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(s * 0.44, 0, s * 0.12, s); })),
  ring: once('ring', () => tex((g, s) => { g.strokeStyle = '#fff'; g.lineWidth = s * 0.07; g.beginPath(); g.arc(s / 2, s / 2, s * 0.4, 0, Math.PI * 2); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(s * 0.36, s * 0.36, s * 0.07, 0, Math.PI * 2); g.fill(); })),
};

// deterministic random numbers for particle i
const hash = (i: number, k: number) => { let x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const CONFETTI = ['#ff4f7a', '#ffd23a', '#38e1ff', '#7be36b', '#b98cff', '#ff8a3a'];

export interface FxObj { group: THREE.Group; update(t: number, age: number, amount: number, speed: number): void; pool: THREE.Sprite[] }

/** A code effect from Library/vfx (Rigging Studio's contract: return { object, update(t) }). It starts when the object
 *  turns visible and runs `dur` seconds (the file's `// dur:`, or params.dur), over and over when params.loop. */
function buildCodeFx(p: Record<string, any>): FxObj {
  const code = p.codeText ?? vfxCodeOf(p.code); if (code == null) throw new Error(`không có VFX "${p.code}" trong thư viện`);
  const dur = p.dur ?? vfxHeader(code).dur;
  const built = buildVfx(THREE as any, code, { seed: p.seed ?? 1, duration: dur });
  const group = new THREE.Group(); group.add(built.object);
  const toGlass = () => built.object.traverse((o) => { o.layers.set(GLASS_LAYER); o.userData.noHit = true; });
  toGlass();
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  handle.position.y = 0.1; group.add(handle);
  return {
    group, pool: [],
    update(_t, age, amount, sp) {
      let a = age * sp; if (p.loop) a = ((a % dur) + dur) % dur;
      const on = amount > 0 && a >= 0 && a <= dur;
      built.object.visible = on; if (!on) return;
      updateVfx(built, a); toGlass();
    },
  };
}

/** Build an effect. params: type (a preset, or 'code' with params.code = a Library/vfx file), color, size, seed. */
export function buildFx(p: Record<string, any>): FxObj {
  if (p.type === 'code') return buildCodeFx(p);
  const def = FX[p.type] || FX.smoke, group = new THREE.Group();
  const map = (texOf[def.tex || 'puff'] || texOf.puff)();
  const base = new THREE.Color(p.color || def.color), size = p.size ?? 1, seed = p.seed ?? 1;
  const pool: THREE.Sprite[] = [];
  for (let i = 0; i < def.n; i++) {
    const m = new THREE.SpriteMaterial({ map, color: base.clone(), transparent: true, opacity: 0, depthWrite: false, fog: false, blending: def.additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    const s = new THREE.Sprite(m); s.visible = false; s.layers.set(GLASS_LAYER); s.userData.noHit = true; group.add(s); pool.push(s);
  }
  // an invisible handle so the object can be clicked and moved in the viewport
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.12 * size, 8, 6), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  handle.position.y = 0.1; group.add(handle);
  const col = new THREE.Color();
  const put = (s: THREE.Sprite, x: number, y: number, z: number, sc: number, op: number, c?: THREE.Color | string, rot = 0, sx = 1) => {
    s.visible = op > 0.003; if (!s.visible) return;
    s.position.set(x * size, y * size, z * size); s.scale.set(sc * size * sx, sc * size, 1);
    const m = s.material as THREE.SpriteMaterial; m.opacity = Math.min(1, op); m.rotation = rot;
    if (c) m.color.set(c as any); else m.color.copy(base);
  };
  const T = (i: number) => seed * 1000 + i;

  function update(t: number, age: number, amount: number, sp: number) {
    for (const s of pool) s.visible = false;
    if (amount <= 0) return;
    const tt = t * sp;
    if (!def.burst) {
      // looping: particle k is born at k / rate; the pool slots are reused round-robin
      const rate = (def.rate || 20) * Math.min(2, amount), life = def.life, first = Math.max(0, Math.floor((tt - life) * rate)), last = Math.floor(tt * rate);
      for (let k = Math.max(first, last - def.n + 1); k <= last; k++) {
        const a = tt - k / rate; if (a < 0 || a > life) continue;
        const u = a / life, s = pool[k % def.n], r1 = hash(T(k), 1), r2 = hash(T(k), 2), r3 = hash(T(k), 3), r4 = hash(T(k), 4);
        switch (p.type) {
          case 'smoke': put(s, (r1 - 0.5) * 0.3 + Math.sin(a * 1.3 + r2 * 6) * 0.12 * u + 0.25 * u * u, a * 0.55, (r3 - 0.5) * 0.3, 0.25 + 1.1 * u, 0.55 * Math.sin(Math.PI * Math.min(1, u * 1.4)) * (1 - u), col.copy(base).multiplyScalar(0.8 + 0.3 * r4)); break;
          case 'steam': put(s, (r1 - 0.5) * 0.08 + Math.sin(a * 3 + r2 * 6) * 0.04, a * 0.35, (r3 - 0.5) * 0.08, 0.06 + 0.22 * u, 0.4 * Math.sin(Math.PI * u)); break;
          case 'fire': { const hot = 1 - u; put(s, (r1 - 0.5) * 0.25 * (1 - u * 0.6) + Math.sin(a * 9 + r2 * 6) * 0.03, a * (0.7 + r3 * 0.5), (r4 - 0.5) * 0.2, 0.32 * (1 - u * 0.7), 0.9 * Math.sin(Math.PI * Math.min(1, u * 3)) * hot, col.setRGB(1, 0.35 + 0.6 * hot * hot, 0.08 + 0.4 * hot ** 4)); break; }
          case 'sparks': { const vx = (r1 - 0.5) * 1.6, vy = 1.4 + r2 * 1.6, vz = (r3 - 0.5) * 1.6; const x = vx * a, y = vy * a - 4.9 * a * a, z = vz * a; if (y < -0.02) break; put(s, x, y, z, 0.07, 1 - u, undefined, Math.atan2(vx, vy - 9.8 * a), 0.35); break; }
          case 'magic': put(s, (r1 - 0.5) * 0.5 + Math.sin(a * 2 + r2 * 6) * 0.1, a * 0.5 + r3 * 0.2, (r4 - 0.5) * 0.5, 0.05 + 0.06 * Math.abs(Math.sin(a * 8 + r1 * 6)), Math.sin(Math.PI * u), undefined, a * 2); break;
          case 'rain': { const x = (r1 - 0.5) * 6, z = (r2 - 0.5) * 4, y = 4 - u * 4.2; if (y < 0) break; put(s, x - u * 0.3, y, z, 0.32, 0.75, undefined, 0.07, 0.14); break; }
          case 'snow': put(s, (r1 - 0.5) * 6 + Math.sin(a * 1.2 + r3 * 6) * 0.2, 4 - u * 4.1, (r2 - 0.5) * 4, 0.05 + r4 * 0.04, 0.9 * Math.min(1, (1 - u) * 6)); break;
          case 'confetti': put(s, (r1 - 0.5) * 4 + Math.sin(a * 2 + r3 * 6) * 0.25, 3.6 - u * 3.7, (r2 - 0.5) * 3, 0.09, Math.min(1, (1 - u) * 8), CONFETTI[k % CONFETTI.length], a * (4 + r4 * 6), 0.4 + 0.6 * Math.abs(Math.cos(a * 6 + r1 * 6))); break;
          case 'hearts': put(s, (r1 - 0.5) * 0.4 + Math.sin(a * 2.5 + r2 * 6) * 0.08, a * 0.45, (r3 - 0.5) * 0.2, 0.09 + 0.05 * Math.sin(Math.min(1, u * 4) * Math.PI / 2), Math.min(1, (1 - u) * 3), undefined, Math.sin(a * 3) * 0.2); break;
          case 'bubbles': put(s, (r1 - 0.5) * 0.5 + Math.sin(a * 2 + r2 * 6) * 0.06, a * 0.5, (r3 - 0.5) * 0.4, 0.05 + r4 * 0.07, 0.85 * Math.min(1, (1 - u) * 5)); break;
        }
      }
      return;
    }
    // one-shot: everything is a function of the time since it appeared
    const a = age * sp; if (a < 0 || a > def.life) return;
    const u = a / def.life;
    for (let i = 0; i < def.n; i++) {
      const s = pool[i], r1 = hash(T(i), 1), r2 = hash(T(i), 2), r3 = hash(T(i), 3), r4 = hash(T(i), 4);
      const dir = new THREE.Vector3(r1 - 0.5, r2 * 0.9 + 0.1, r3 - 0.5).normalize();
      switch (p.type) {
        case 'explosion': {
          if (i === 0) { put(s, 0, 0.5, 0, 1.2 + 2.5 * Math.min(1, a / 0.08), Math.max(0, 1 - a / 0.25), '#fff6c8'); s.material.blending = THREE.AdditiveBlending; break; }
          if (i < 45) { const e = 1 - Math.exp(-a * 6), hot = Math.max(0, 1 - a / 0.7); put(s, dir.x * 1.1 * e, 0.4 + dir.y * 0.9 * e + a * 0.25, dir.z * 1.1 * e, 0.4 + 0.6 * e, Math.max(0, 1 - a / 1.0) * 0.95, col.setRGB(1, 0.3 + 0.6 * hot, 0.05 + 0.3 * hot * hot)); break; }
          if (i < 85) { const e = 1 - Math.exp(-a * 3); put(s, dir.x * 1.4 * e, 0.4 + dir.y * 1.0 * e + a * 0.45, dir.z * 1.4 * e, 0.5 + 1.0 * e, a < 0.15 ? 0 : 0.7 * (1 - u), col.setRGB(0.18 + 0.1 * r4, 0.17 + 0.1 * r4, 0.17 + 0.1 * r4)); break; }
          { const v = 3 + r4 * 4, x = dir.x * v * a, z = dir.z * v * a, y = 0.4 + dir.y * v * a - 4.9 * a * a; if (y < 0) break; put(s, x, y, z, 0.05, 1 - u, '#ffcf5a', 0, 1); s.material.blending = THREE.AdditiveBlending; break; }
        }
        case 'dust': { const ang = (i / def.n) * Math.PI * 2 + r1 * 0.3, e = 1 - Math.exp(-a * 3.5), R = 0.2 + 1.1 * e * (0.7 + r2 * 0.5); put(s, Math.cos(ang) * R, 0.08 + r3 * 0.15 + a * 0.12, Math.sin(ang) * R, 0.25 + 0.5 * e, 0.6 * (1 - u) * Math.min(1, a * 12), col.copy(base).multiplyScalar(0.85 + 0.3 * r4)); break; }
        case 'impact': {
          if (i === 0) { put(s, 0, 0, 0, 0.35 + 0.4 * Math.sin(Math.min(1, u * 2) * Math.PI / 2), 1 - u * u, undefined, r1); break; }
          const ang = (i / (def.n - 1)) * Math.PI * 2, R = 0.22 + 0.5 * u; put(s, Math.cos(ang) * R, Math.sin(ang) * R, 0, 0.1, 1 - u, '#ffffff', -ang + Math.PI / 2, 0.25); break;
        }
        case 'splash': { const v = 1.6 + r4 * 1.4, x = dir.x * v * 0.5 * a, z = dir.z * v * 0.5 * a, y = dir.y * v * a * 1.4 - 4.9 * a * a; if (y < -0.01) break; put(s, x, y, z, 0.05 + r2 * 0.04, 0.9 * (1 - u)); break; }
        case 'pop': { const v = 2.4 + r4 * 2.5, drag = (1 - Math.exp(-a * 3)) / 3, x = dir.x * v * drag + Math.sin(a * 3 + r1 * 6) * 0.1 * a, z = dir.z * v * drag, y = 0.2 + dir.y * v * drag * 1.3 - 0.9 * a * a; if (y < 0) break; put(s, x, y, z, 0.09, Math.min(1, (1 - u) * 5), CONFETTI[i % CONFETTI.length], a * (5 + r2 * 6), 0.4 + 0.6 * Math.abs(Math.cos(a * 7 + r3 * 6))); break; }
        case 'flash': put(s, 0, 0.5, 0, 3 + 2 * u, (1 - u) ** 2); break;
      }
    }
  }
  return { group, update, pool };
}

/** When a one-shot effect started: the latest moment at or before t it turned visible (0 if it always was). */
export function fxStart(keys: Array<{ t: number; v: any }> | undefined, t: number) {
  if (!keys || !keys.length) return 0;
  let start = keys[0].v !== false ? 0 : -1;
  const ks = [...keys].sort((a, b) => a.t - b.t);
  for (let i = 0; i < ks.length && ks[i].t <= t; i++) { const prev = i ? ks[i - 1].v !== false : false; if (ks[i].v !== false && (!prev || i === 0)) start = i === 0 ? (ks[0].t > 0 ? ks[0].t : 0) : ks[i].t; }
  return start;
}
