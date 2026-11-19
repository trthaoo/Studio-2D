// Variety: seeded cast and car looks that avoid what recent videos used (engine/registry.json).
// No three.js here, so cast.mjs (Node) and video.js (browser) can both import it.
// Output feeds makeChar(opts) and buildCar(look) directly.

export function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function hashSeed(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const pick = (r, a) => a[Math.floor(r() * a.length)];
const range = (r, [a, b]) => +(a + (b - a) * r()).toFixed(3);
export function hueBucket(hex) { // 12 buckets of 30°, plus 'grey' for low saturation
  const R = (hex >> 16 & 255) / 255, G = (hex >> 8 & 255) / 255, B = (hex & 255) / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn;
  if (d < 0.12 || mx < 0.15) return mx > 0.75 ? 'white' : mx < 0.3 ? 'black' : 'grey';
  let h = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; h = (h * 60 + 360) % 360;
  return 'h' + Math.floor(h / 30);
}

// One palette per video. loud = the schemer and his world, muted = the quiet victim, dark = authority.
export const PALETTES = [
  { name: 'candy', loud: [0xffc928, 0xff5a8a, 0xa65cff, 0x31d16b, 0xff7a2a], muted: [0x7a2236, 0x4f5d6b, 0x6b5a3a, 0x3c5a4a], dark: [0x1f2a44, 0x24324f, 0x2b2b33], paints: [0xffbf0a, 0xe0202a, 0x2f6fe0, 0x31d16b, 0xff5a8a], mutedPaints: [0xd9cfb2, 0x8f97a6, 0x6b7f6b, 0xb8a58a] },
  { name: 'citrus', loud: [0xffb300, 0x8bd12f, 0xff6a3d, 0x2fd0c8, 0xf2e13a], muted: [0x5a4a3a, 0x50606e, 0x7a5a4a, 0x445544], dark: [0x22283a, 0x2e2a2a, 0x1c3040], paints: [0xff9f1c, 0x8bd12f, 0xe8372c, 0x2fd0c8, 0xf2e13a], mutedPaints: [0xc9c0a8, 0x9aa3ab, 0x7d6e5a, 0xa8b49a] },
  { name: 'berry', loud: [0xe0307a, 0x7a45e0, 0xff8a5c, 0x3cc2ff, 0xffd23f], muted: [0x5e3a4a, 0x4a5262, 0x6e6450, 0x3e4e5e], dark: [0x1c1f33, 0x2a2238, 0x202a2a], paints: [0xc8186a, 0x6a3ad0, 0xff7043, 0x1fa8f0, 0xffcf2e], mutedPaints: [0xd6cbb8, 0x8c94a0, 0x7b6f63, 0xa59a8c] },
  { name: 'retro', loud: [0xf2a03a, 0x3aa6a0, 0xe5533c, 0xc9d64a, 0x6f8cff], muted: [0x6b4e3a, 0x55626b, 0x8a7a5a, 0x4e5a48], dark: [0x262a33, 0x332a24, 0x1f2e36], paints: [0xf28c28, 0x2f9c95, 0xd9432f, 0xb8c43a, 0x5a7ae8], mutedPaints: [0xe3d3b0, 0xa09888, 0x7a8a76, 0xc0a880] },
  { name: 'ocean', loud: [0x2fa7ff, 0x19d3a2, 0xffc23a, 0xff5f6d, 0x9b6bff], muted: [0x3e5160, 0x5a5048, 0x485a52, 0x6a5560], dark: [0x162236, 0x1f2a30, 0x26263a], paints: [0x1e88e5, 0x14b88a, 0xffb300, 0xf2454f, 0x8a5cf0], mutedPaints: [0xc8cfd3, 0x8e9aa2, 0x9a8f80, 0x6f7d80] },
  { name: 'sunset', loud: [0xff7b39, 0xffd24a, 0xd94ea0, 0x56c26f, 0x4a9bff], muted: [0x6a3e3a, 0x4d4f63, 0x6e5c46, 0x3f5548], dark: [0x2a1f2e, 0x1f2638, 0x2c2a24], paints: [0xff6a2a, 0xffc72e, 0xc93a8e, 0x3fae5a, 0x3a86f0], mutedPaints: [0xd8c2a8, 0x8d8a9a, 0x8a7560, 0xb0a090] },
];
export const HAIR_COLORS = [['#1c1c24', '#3a3a48'], ['#5a3a22', '#7a5232'], ['#c8862c', '#e0a24a'], ['#2a1a10', '#40281a'], ['#9a9aa2', '#b5b5bd'], ['#d9722b', '#f09a52'], ['#6b3a1a', '#8a5226'], ['#111116', '#2a2a33'], ['#e8c35a', '#f5da86']];
export const STYLES = ['mess', 'bowl', 'side', 'spiky', 'curly', 'afro', 'bun', 'ponytail', 'long', 'flattop', 'buzz', 'bald'];
export const PLATES = ['OOPS 1', 'L8 4WRK', 'NO RUSH', 'B4CKUP', '2 FAST', 'HONK 2X', 'MY BAD', 'BRAKE 4', 'ZOOM', 'SLOW 1', 'I WIN', 'CASH 1', 'NOT ME', 'OK BOOM', 'YIKES', 'RU SURE'];

// Character roles. shirt: which palette list; styles, acc options; builds (chars.js BUILDS, no two alike in one cast when possible); R, girth (small jitter on the build), legs ranges.
export const CHAR_ROLES = {
  schemer: { shirt: 'loud', styles: ['mess', 'spiky', 'side', 'flattop', 'curly', 'afro'], acc: [[], [], ['shadesUp'], ['sunglasses']], R: [0.19, 0.21], girth: [0.96, 1.04], builds: ['average', 'slim', 'stout', 'short'] },
  quiet: { shirt: 'muted', styles: ['side', 'bowl', 'buzz', 'bald', 'flattop'], acc: [[], ['glasses'], ['beard'], ['mustache']], R: [0.19, 0.21], girth: [0.96, 1.04], builds: ['short', 'slim', 'average'] },
  victim: { shirt: 'any', styles: STYLES, acc: [[], ['glasses'], ['cap'], ['beanie'], ['blush'], []], R: [0.18, 0.22], girth: [0.96, 1.04], builds: ['average', 'stout', 'slim', 'tall', 'short', 'big'] },
  buddy: { shirt: 'loud', styles: ['buzz', 'flattop', 'spiky', 'bald', 'mess'], acc: [['cap'], ['sunglasses'], ['beanie'], ['beard', 'cap']], R: [0.2, 0.22], girth: [0.96, 1.04], builds: ['big', 'stout'] },
  officer: { shirt: 'dark', styles: ['buzz', 'flattop', 'bald', 'side'], acc: [['ranger'], ['ranger', 'mustache'], ['cap:#1f2a44', 'sunglasses']], R: [0.2, 0.22], girth: [0.96, 1.04], builds: ['stout', 'tall', 'big'] },
  agent: { shirt: 'dark', styles: ['bun', 'long', 'side', 'ponytail', 'buzz'], acc: [['headset'], ['headset', 'glasses'], []], R: [0.19, 0.21], girth: [0.96, 1.04], builds: ['tall', 'slim', 'average'] },
  doctor: { shirt: 'white', styles: ['side', 'bald', 'bun', 'curly'], acc: [['glasses'], [], ['mustache']], R: [0.19, 0.21], girth: [0.96, 1.04], builds: ['tall', 'average', 'slim'] },
  extra: { shirt: 'any', styles: STYLES, acc: [[], [], ['glasses'], ['cap'], ['beanie'], ['mustache'], ['blush']], R: [0.18, 0.22], girth: [0.96, 1.04], builds: ['average', 'slim', 'tall', 'short', 'stout', 'big'] },
};
// Car roles: body types, paint list, skin options, interior.
export const CAR_ROLES = {
  schemer: { types: ['coupe', 'sedan', 'hatch'], paint: 'paints', skins: [{}, { stripe: 0xffffff }, {}], interior: 'modern' },
  upgrade: { types: ['sports'], paint: 'paints', skins: [{ bow: 0xe0202a }, { stripe: 0x111111, bow: 0xe0202a }], interior: false },
  quiet: { types: ['wagon', 'sedan', 'wagon'], paint: 'mutedPaints', skins: [{ wood: true }, { wood: true, rack: true }, {}], interior: 'old' },
  buddy: { types: ['pickup', 'suv', 'van'], paint: 'dark', skins: [{}, { rack: true }, { rust: true }], interior: false },
  victim: { types: ['suv', 'sedan', 'hatch', 'van', 'wagon'], paint: 'any', skins: [{}, {}, { rack: true }], interior: 'modern' },
  traffic: { types: ['sedan', 'hatch', 'suv', 'van', 'pickup', 'coupe', 'wagon'], paint: 'mutedPaints', skins: [{}], interior: false, traffic: true },
};

function colourFrom(r, pal, kind) {
  if (kind === 'white') return 0xf4f4f0;
  if (kind === 'any') return pick(r, [...pal.loud, ...pal.muted]);
  return pick(r, pal[kind] || pal.loud);
}
// cast({ seed, chars: ['schemer', 'quiet', ...], cars: [...], recent: registry.videos.slice(-5), palette?: name })
export function cast(o) {
  const seed = o.seed >>> 0, r = rng(seed), recent = o.recent || [];
  const used = new Set(recent.flatMap((v) => v.signatures || []));
  // also block the same silhouette per role (hairstyle, body type) from recent videos, while options remain
  const shape = (sig) => sig.split('|').slice(0, 2).join('|');
  const usedShape = new Set([...used].map(shape));
  const fresh = (sig, tries) => !used.has(sig) && (tries >= 25 || !usedShape.has(shape(sig)));
  const lastPal = recent.length ? recent[recent.length - 1].palette : null;
  const pal = o.palette ? PALETTES.find((p) => p.name === o.palette) : pick(r, PALETTES.filter((p) => p.name !== lastPal));
  const out = { seed, palette: pal.name, characters: {}, cars: {}, signatures: [] };
  const name = (obj, role) => { let k = role, i = 2; while (obj[k]) k = `${role}_${i++}`; return k; };
  const inCast = new Set();
  for (const role of o.chars || []) {
    const R = CHAR_ROLES[role] || CHAR_ROLES.extra; let best;
    for (let tries = 0; tries < 40; tries++) {
      const shirt = colourFrom(r, pal, R.shirt), style = pick(r, R.styles), [hair, hair2] = pick(r, HAIR_COLORS);
      const build = pick(r, R.builds || ['average']);
      const sig = `${role}|${style}|${hueBucket(shirt)}`, local = [`s:${style}`, `c:${hueBucket(shirt)}`, `b:${build}`];
      best = { sig, local, opts: { R: range(r, R.R), shirt, hair, hair2, style, build, acc: [...pick(r, R.acc)], girth: range(r, R.girth), legs: range(r, [0.97, 1.03]) } };
      if (fresh(sig, tries) && !local.some((l) => inCast.has(l))) break;
    }
    best.local.forEach((l) => inCast.add(l));
    if (best.opts.acc.includes('glasses')) best.opts.glasses = true;
    out.characters[name(out.characters, role)] = { role, ...best.opts }; out.signatures.push(best.sig);
  }
  const carLocal = new Set(), plates = PLATES.slice().sort(() => r() - 0.5);
  for (const role of o.cars || []) {
    const R = CAR_ROLES[role] || CAR_ROLES.traffic; let best;
    for (let tries = 0; tries < 40; tries++) {
      const type = pick(r, R.types), color = R.paint === 'any' ? pick(r, [...pal.paints, ...pal.mutedPaints]) : R.paint === 'dark' ? pick(r, [...pal.dark, 0x3a3f4a, 0x5a2a2a]) : pick(r, pal[R.paint]);
      const sig = `${role}|${type}|${hueBucket(color)}`, local = `${type}|${hueBucket(color)}`;
      best = { sig, local, look: { role, type, color, skin: { ...pick(r, R.skins) }, interior: R.interior, traffic: !!R.traffic, plate: plates[Object.keys(out.cars).length % plates.length],
        shape: { L: undefined, H: undefined } } };
      if (fresh(sig, tries) && !carLocal.has(local)) break;
    }
    carLocal.add(best.local);
    // small proportion changes so the same body type is never quite the same car twice
    best.look.shape = { jitter: +(r() * 2 - 1).toFixed(3), jitter2: +(r() * 2 - 1).toFixed(3) };
    out.cars[name(out.cars, role)] = best.look; out.signatures.push(best.sig);
  }
  return out;
}
