// A new character with a random look, every part chosen on its own (no role presets): hair, colours, build,
// clothes, accessories. Used by "Ngẫu nhiên" in Tạo nhân vật, new characters from the Kịch bản tab, and the
// quick-add list.
import { HAIR_STYLES, BUILD_NAMES, OUTFIT_NAMES } from 'engine/chars.js';
import { HAIR_COLORS, PALETTES } from 'engine/variety.js';

const hex = (n: any) => (typeof n === 'number' ? '#' + n.toString(16).padStart(6, '0') : String(n));
export const SHIRT_COLORS: string[] = [...new Set(PALETTES.flatMap((p: any) => [...p.loud, ...p.muted, ...p.dark]).map(hex))] as string[];
export const PANTS_COLORS = ['#2b2f3a', '#3a4a6b', '#4a3a2a', '#6b6f78', '#1f2a44', '#5a4632', '#2a2a2a', '#7a8090', '#3d5a3a', '#7a2e2e'];
export const SKIN_TONES = ['#f8f3ea', '#f6e3cf', '#efd2b4', '#e2b893', '#c99a72', '#a87452', '#7d5238', '#ffe0e0', '#dfe9f2', '#cfe8c8'];
export const HATS = ['cap', 'beanie', 'ranger'];
const FACE_ACC = ['sunglasses', 'shadesUp', 'headset', 'mustache', 'beard', 'bandage', 'blush'];

export function rng(seed: number) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function randomLook(seed = (Math.random() * 1e9) >>> 0) {
  const r = rng(seed), pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const [hair, hair2] = pick(HAIR_COLORS as string[][]);
  const acc: string[] = [];
  if (r() < 0.3) acc.push(pick(HATS));
  const n = r() < 0.45 ? 0 : r() < 0.8 ? 1 : 2;
  for (let i = 0; i < n; i++) { const a = pick(FACE_ACC); if (!acc.includes(a) && !(a === 'shadesUp' && acc.includes('sunglasses')) && !(a === 'sunglasses' && acc.includes('shadesUp'))) acc.push(a); }
  const look: any = {
    R: +(0.18 + r() * 0.045).toFixed(3), style: pick(HAIR_STYLES as string[]), hair, hair2,
    build: pick((BUILD_NAMES as string[]).filter((b) => b !== 'kid')), outfit: pick(OUTFIT_NAMES as string[]),
    shirt: pick(SHIRT_COLORS), pants: pick(PANTS_COLORS), acc,
    girth: +(0.95 + r() * 0.1).toFixed(3), legs: +(0.97 + r() * 0.06).toFixed(3),
  };
  if (r() < 0.5) look.skin = pick(SKIN_TONES.slice(1, 7));
  if (r() < 0.25) look.glasses = true;
  if (r() < 0.5) look.shirt2 = pick(['#fbf7ef', '#f2f2f2', '#e8dcc0', ...SHIRT_COLORS.slice(0, 6)]);
  return look;
}
