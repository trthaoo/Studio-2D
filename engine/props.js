// Prop library. Every prop is a function that returns a THREE.Group standing on y = 0, front facing +z, centred on x.
// Sizes are in metres at character scale (characters are about 1.2 m tall, so furniture is about 0.7 of real size).
// Text props redraw: sign.setText('...'), counter.set(n), screen.draw((g, w, h) => {...}).
// Gag props are usually a library prop plus new text: that is the cheap way to make a new joke.
import { paintedTree, paintedBush } from './scenery.js';
import { THREE, rng, canvas, ctex, clamp } from './core.js';
import { M, flat, box, puffTex } from './materials.js';
import { billTex } from './transitions.js';

export const K = 0.7; // furniture scale relative to real size
const grp = (...kids) => { const g = new THREE.Group(); for (const k of kids) g.add(k); return g; };
const cyl = (rt, rb, h, mat, seg = 20) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.castShadow = m.receiveShadow = true; return m; };
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };

// ------------------------------------------------------------------ text
// labelTex('TEXT' or ['line 1', 'line 2'], { w, h, bg, fg, size, border, align, font })
export function drawLabel(g, W, H, lines, o = {}) {
  lines = Array.isArray(lines) ? lines : [lines];
  g.fillStyle = o.bg ?? '#ffffff'; g.fillRect(0, 0, W, H);
  if (o.border !== false) { g.strokeStyle = o.borderColor ?? o.fg ?? '#111'; g.lineWidth = o.border ?? Math.max(4, H * 0.04); g.strokeRect(g.lineWidth / 2 + 4, g.lineWidth / 2 + 4, W - g.lineWidth - 8, H - g.lineWidth - 8); }
  // text size: fill the height, then shrink until the widest line fits inside the border with a margin (measured, not guessed)
  const font = (px) => `${o.weight ?? 800} ${px}px ${o.font ?? 'Cap, sans-serif'}`, maxW = W * (o.fit ?? 0.84);
  let size = o.size ?? H * 0.78 / lines.length / 1.08;
  g.font = font(size); const widest = Math.max(...lines.map((l) => g.measureText(l).width), 1);
  if (widest > maxW) size *= maxW / widest;
  g.fillStyle = o.fg ?? '#111'; g.font = font(size); g.textAlign = o.align ?? 'center'; g.textBaseline = 'middle';
  const x = g.textAlign === 'left' ? W * 0.08 : W / 2;
  lines.forEach((l, i) => g.fillText(l, x, H / 2 + (i - (lines.length - 1) / 2) * size * 1.08));
}
export function labelTex(lines, o = {}) { const c = canvas(o.w ?? 512, o.h ?? 256); drawLabel(c.getContext('2d'), c.width, c.height, lines, o); return ctex(c); }

// A flat panel showing a canvas you can redraw (signs, screens, HUD panels in the world).
// panel(w, h, { px: canvas width, glow: true for screens, draw(g, W, H) })
export function panel(w, h, o = {}) {
  const W = o.px ?? 512, H = Math.round(W * h / w), c = canvas(W, H), g = c.getContext('2d'), tex = ctex(c);
  const mat = o.glow ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.draw = (fn) => { g.clearRect(0, 0, W, H); fn(g, W, H); tex.needsUpdate = true; };
  if (o.draw) m.draw(o.draw);
  return m;
}
// readable(mesh, label, { key, w, h, on }): register any flat printed thing (a panel, screen, ticket, poster) with film.mjs
// check, like a sign. key = the joke depends on reading it (a number, WINNER, a name): if it is cut by the frame edge,
// covered by a head or hidden behind an object, the check FAILs (rule text-cut). key can be a function of t, so a
// screen counts only while it shows the gag. w/h default to the PlaneGeometry size. on = the object the label is stuck to
// (a can, a bin, a car door): the check FAILs (decal-overhang) if a corner hangs off that surface.
export function readable(mesh, label, o = {}) {
  const p = mesh.geometry?.parameters || {};
  mesh.userData.text = { w: o.w ?? p.width ?? 0.3, h: o.h ?? p.height ?? 0.2, face: mesh, label, key: o.key, on: o.on };
  return mesh;
}
// sign('NO PARKING', { w, h, bg, fg, post: true, postH, key }) -> .setText(lines)
export function sign(text, o = {}) {
  const w = o.w ?? 0.9, h = o.h ?? 0.5, g = new THREE.Group();
  const board = box(w + 0.04, h + 0.04, 0.03, flat(o.frame ?? 0x333842), 0, 0, 0, 0.01);
  const face = panel(w, h, { draw: (c, W, H) => drawLabel(c, W, H, text, o) }); face.position.z = 0.017;
  const top = o.post === false ? h / 2 : (o.postH ?? 1.1);
  board.position.y = face.position.y = top; g.add(board, face);
  g.userData.text = { w, h, face, label: (Array.isArray(text) ? text : [text]).join(' '), key: o.key };   // film.mjs check: readable signs must be fully in frame (key: cut = FAIL)
  if (o.post !== false) g.add(at(box(0.05, top - h / 2, 0.05, flat(0x8a9099, 0.4)), 0, (top - h / 2) / 2, -0.02));
  g.setText = (t, o2 = {}) => { g.userData.text.label = (Array.isArray(t) ? t : [t]).join(' '); face.draw((c, W, H) => drawLabel(c, W, H, t, { ...o, ...o2 })); };
  return g;
}
// Desk name plate: deskPlate('CLAIMS DEPT')
export function deskPlate(text, o = {}) {
  const g = new THREE.Group(), w = o.w ?? 0.32, h = 0.08;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, w, 3), flat(0x3a2a1a, 0.4)); body.rotation.z = Math.PI / 2; body.position.y = 0.035; g.add(body);
  const f = panel(w * 0.92, h * 0.7, { px: 384, draw: (c, W, H) => drawLabel(c, W, H, text, { bg: o.bg ?? '#d9b45a', fg: o.fg ?? '#2a1a08', border: false }) });
  f.position.set(0, 0.05, 0.023); f.rotation.x = -0.52; g.add(f); return g;
}
// "DAYS SINCE ..." counter: counter('DAYS SINCE LAST NECK INJURY', 2) -> .set(n)
export function counter(label, value = 0, o = {}) {
  const g = new THREE.Group(), w = o.w ?? 0.3, h = o.h ?? 0.36;
  g.add(at(box(w, h, 0.04, flat(o.color ?? 0xd9b45a, 0.5), 0, 0, 0, 0.015), 0, h / 2, 0));
  const f = panel(w * 0.9, h * 0.9, { px: 320 }); f.position.set(0, h / 2, 0.021); g.add(f);
  g.set = (n) => f.draw((c, W, H) => { c.fillStyle = '#f4ead2'; c.fillRect(0, 0, W, H); c.fillStyle = '#1a1a1a'; c.fillRect(W * 0.2, H * 0.06, W * 0.6, H * 0.5);
    c.fillStyle = '#fff'; c.font = `800 ${H * 0.42}px Cap, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(n), W / 2, H * 0.32);
    c.fillStyle = '#2a1a08'; const words = String(label).split(' '), lines = []; let cur = '';
    for (const w2 of words) { if ((cur + ' ' + w2).length > 13 && cur) { lines.push(cur); cur = w2; } else cur = cur ? cur + ' ' + w2 : w2; } lines.push(cur);
    c.font = `800 ${H * 0.085}px Cap, sans-serif`; lines.slice(0, 4).forEach((l, i) => c.fillText(l, W / 2, H * (0.66 + i * 0.09))); });
  g.set(value); return g;
}
// Screen on a stand or wall: screen({ w, h, lines | draw }) -> .draw(fn)
export function screen(o = {}) {
  const w = o.w ?? 0.45, h = o.h ?? 0.28, g = new THREE.Group();
  g.add(at(box(w + 0.04, h + 0.04, 0.03, M.dark, 0, 0, 0, 0.01), 0, h / 2 + (o.y ?? 0), 0));
  const p = panel(w, h, { glow: true, draw: o.draw ?? ((c, W, H) => drawLabel(c, W, H, o.lines ?? [''], { bg: o.bg ?? '#1b2a6b', fg: o.fg ?? '#ffffff', border: false })) });
  p.position.set(0, h / 2 + (o.y ?? 0), 0.017); g.add(p); g.draw = p.draw; return g;
}
// Paper / document / cheque lying flat or held: paper(['PAID'], { w, h, stamp: '#d9342b' })
export function paper(lines = [''], o = {}) {
  const w = o.w ?? 0.21, h = o.h ?? 0.28;
  const p = panel(w, h, { px: 256, draw: (c, W, H) => { c.fillStyle = o.bg ?? '#f7f7f2'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#b9c2cf'; for (let y = H * 0.12; y < H * 0.9; y += H * 0.07) c.fillRect(W * 0.1, y, W * (0.55 + ((y * 7) % 30) / 100), H * 0.018);
    if (lines.length && lines[0]) { c.save(); c.translate(W / 2, H * 0.55); c.rotate(-0.25); c.strokeStyle = c.fillStyle = o.stamp ?? '#d9342b'; c.lineWidth = W * 0.03; c.font = `800 ${W * 0.2}px Cap, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      const tw = c.measureText(lines[0]).width; c.strokeRect(-tw / 2 - W * 0.05, -W * 0.13, tw + W * 0.1, W * 0.26); c.fillText(lines[0], 0, 0); c.restore(); } } });
  p.material.side = THREE.DoubleSide; return grp(p);
}

// ------------------------------------------------------------------ furniture
export function desk(o = {}) {
  const w = o.w ?? 1.6 * K, d = o.d ?? 0.8 * K, h = o.h ?? 0.76 * K, top = flat(o.color ?? 0x6b4a2e, 0.5), leg = flat(o.legColor ?? 0x3a2a1a, 0.6), g = new THREE.Group();
  g.add(at(box(w, 0.05, d, top, 0, 0, 0, 0.01), 0, h - 0.025, 0));
  if (o.front !== false) g.add(at(box(w - 0.04, h - 0.1, 0.03, top), 0, (h - 0.05) / 2, d / 2 - 0.03)); // modesty panel facing +z
  for (const s of [-1, 1]) g.add(at(box(0.05, h - 0.05, d - 0.06, leg), s * (w / 2 - 0.04), (h - 0.05) / 2, 0));
  g.top = h; return g;
}
export function table(o = {}) {
  const w = o.w ?? 1.0 * K, d = o.d ?? 0.7 * K, h = o.h ?? 0.74 * K, top = flat(o.color ?? 0xe8e2d4, 0.4), leg = flat(o.legColor ?? 0x6b6f78, 0.5), g = new THREE.Group();
  g.add(at(box(w, 0.04, d, top, 0, 0, 0, 0.01), 0, h - 0.02, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(at(box(0.04, h - 0.04, 0.04, leg), sx * (w / 2 - 0.05), (h - 0.04) / 2, sz * (d / 2 - 0.05)));
  g.top = h; return g;
}
export function chair(o = {}) {
  const c = flat(o.color ?? 0x2f6fe0, 0.6), s = o.office ? 1 : 0, g = new THREE.Group(), h = 0.45 * K;
  g.add(at(box(0.44 * K, 0.06, 0.44 * K, c, 0, 0, 0, 0.02), 0, h, 0));
  g.add(at(box(0.44 * K, 0.5 * K, 0.06, c, 0, 0, 0, 0.02), 0, h + 0.25 * K, -0.2 * K));
  if (s) { g.add(at(cyl(0.025, 0.025, h - 0.06, M.dark), 0, h / 2, 0)); for (let i = 0; i < 5; i++) { const l = box(0.3 * K, 0.03, 0.04, M.dark); l.rotation.y = i * 1.2566; l.position.set(Math.cos(i * 1.2566) * 0.1, 0.03, -Math.sin(i * 1.2566) * 0.1); g.add(l); } }
  else for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(at(box(0.035, h, 0.035, M.dark), sx * 0.19 * K, h / 2, sz * 0.19 * K));
  g.seat = h + 0.03; return g;
}
export function shelf(o = {}) {
  const w = o.w ?? 1.0 * K, h = o.h ?? 1.6 * K, d = 0.32 * K, m = flat(o.color ?? 0x8a6a4a, 0.6), g = new THREE.Group(), n = o.levels ?? 4, r = rng(o.seed ?? 3);
  for (const s of [-1, 1]) g.add(at(box(0.03, h, d, m), s * w / 2, h / 2, 0));
  for (let i = 0; i <= n; i++) {
    const y = 0.02 + i * (h - 0.04) / n; g.add(at(box(w, 0.025, d, m), 0, y, 0));
    if (i < n && o.items !== false) { let x = -w / 2 + 0.06; while (x < w / 2 - 0.1) { const bw = 0.04 + r() * 0.05, bh = (h / n) * (0.55 + r() * 0.3); g.add(at(box(bw, bh, d * 0.75, flat([0xd9342b, 0x2f6fe0, 0xffc928, 0x31d16b, 0xe8e2d4, 0x6b4a2e][Math.floor(r() * 6)], 0.7)), x + bw / 2, y + 0.012 + bh / 2, 0)); x += bw + 0.008 + (r() < 0.15 ? 0.1 : 0); } }
  }
  return g;
}
export function cabinet(o = {}) {
  const w = o.w ?? 0.45 * K, h = o.h ?? 1.3 * K, d = 0.6 * K, m = flat(o.color ?? 0x8f97a6, 0.45), g = new THREE.Group(), n = o.drawers ?? 4;
  g.add(at(box(w, h, d, m, 0, 0, 0, 0.01), 0, h / 2, 0));
  for (let i = 0; i < n; i++) { const y = (i + 0.5) * h / n; g.add(at(box(w - 0.04, h / n - 0.03, 0.01, flat(o.color ?? 0x8f97a6, 0.35)), 0, y, d / 2 + 0.005)); g.add(at(box(0.08, 0.015, 0.02, M.chrome), 0, y + 0.03, d / 2 + 0.015)); }
  return g;
}
export function plant(o = {}) {
  const h = o.h ?? 0.8, g = new THREE.Group(), r = rng(o.seed ?? 5), leaf = flat(o.color ?? 0x3fa243, 0.8);
  g.add(at(cyl(0.13, 0.1, 0.22, flat(o.pot ?? 0xc8603a, 0.7)), 0, 0.11, 0));
  for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.11 + r() * 0.06, 8, 6), leaf); l.scale.set(1, 1.6, 0.5); l.position.set((r() - 0.5) * 0.25, 0.25 + r() * (h - 0.35), (r() - 0.5) * 0.25); l.rotation.set(r(), r() * 6, r()); l.castShadow = true; g.add(l); }
  return g;
}
export function deskPhone(o = {}) {
  const m = flat(o.color ?? 0x222228, 0.5), g = new THREE.Group();
  g.add(at(box(0.2, 0.06, 0.16, m, 0, 0, 0, 0.02), 0, 0.03, 0)); g.add(at(box(0.22, 0.04, 0.06, m, 0, 0, 0, 0.02), 0, 0.08, -0.03));
  for (let i = 0; i < 9; i++) g.add(at(box(0.025, 0.01, 0.02, M.chrome), -0.03 + (i % 3) * 0.035, 0.065, 0.02 + Math.floor(i / 3) * 0.028));
  return g;
}
export function laptop(o = {}) {
  const g = new THREE.Group(), m = flat(o.color ?? 0xb9bec8, 0.3);
  g.add(at(box(0.34, 0.015, 0.24, m, 0, 0, 0, 0.005), 0, 0.008, 0));
  const lid = new THREE.Group(); lid.position.set(0, 0.015, -0.12); lid.rotation.x = -0.25; g.add(lid);
  lid.add(at(box(0.34, 0.22, 0.012, m, 0, 0, 0, 0.005), 0, 0.11, 0));
  const s = panel(0.31, 0.19, { glow: true, draw: o.draw ?? ((c, W, H) => drawLabel(c, W, H, o.lines ?? [''], { bg: '#2b4fd6', fg: '#fff', border: false })) }); s.position.set(0, 0.11, 0.007); lid.add(s);
  g.draw = s.draw; return g;
}
// Picture frame on a wall: frame({ w, h, draw(g, W, H) | photoOf: { shirt, hair } })
export function frame(o = {}) {
  const w = o.w ?? 0.34, h = o.h ?? 0.44, g = new THREE.Group();
  g.add(box(w + 0.05, h + 0.05, 0.03, flat(o.frame ?? 0x2a1a10, 0.5), 0, 0, 0, 0.008));
  const p = panel(w, h, { px: 256, draw: o.draw ?? ((c, W, H) => portrait(c, W, H, o.photoOf ?? {})) }); p.position.z = 0.017; g.add(p); return g;
}
// A tiny portrait of a character (for framed photos): flat colour background, white head, shirt.
export function portrait(c, W, H, who = {}) {
  c.fillStyle = who.bg ?? '#7fb8e6'; c.fillRect(0, 0, W, H);
  const hex = (n) => '#' + (n ?? 0xffc928).toString(16).padStart(6, '0');
  c.fillStyle = hex(who.shirt); c.strokeStyle = '#111'; c.lineWidth = W * 0.03; c.beginPath(); c.roundRect(W * 0.3, H * 0.55, W * 0.4, H * 0.5, W * 0.2); c.fill(); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(W / 2, H * 0.4, W * 0.22, 0, 7); c.fill(); c.stroke();
  c.fillStyle = who.hair ?? '#5a3a22'; c.beginPath(); c.ellipse(W / 2, H * 0.24, W * 0.2, H * 0.06, 0, 0, 7); c.fill();
  c.fillStyle = '#111'; for (const s of [-1, 1]) { c.beginPath(); c.arc(W / 2 + s * W * 0.07, H * 0.4, W * 0.02, 0, 7); c.fill(); }
  c.beginPath(); c.arc(W / 2, H * 0.45, W * 0.07, 0.2, Math.PI - 0.2); c.stroke();
}

// ------------------------------------------------------------------ story props
// Pile of cash bundles. cashPile({ r, h, n, seed }) -> .grow(u) 0..1 (bundles appear bottom-up)
export function cashPile(o = {}) {
  const n = o.n ?? 400, R = o.r ?? 0.9, Hh = o.h ?? 0.8, r = rng(o.seed ?? 7);
  const bill = billTex(), side = flat(0x6fb85a, 0.7), topM = new THREE.MeshStandardMaterial({ map: bill, roughness: 0.7 }), band = flat(0xf2f2ea, 0.6);
  const geo = new THREE.BoxGeometry(0.17, 0.05, 0.075), mesh = new THREE.InstancedMesh(geo, [side, side, topM, side, band, band], n);
  mesh.castShadow = mesh.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), P = [];
  for (let i = 0; i < n; i++) { const a = r() * 6.283, rr = Math.sqrt(r()) * R, y = Math.max(0.025, Hh * (1 - (rr / R) ** 1.6) * (0.6 + r() * 0.4));
    e.set((r() - 0.5) * 0.5, r() * 6.283, (r() - 0.5) * 0.5); q.setFromEuler(e); P.push({ m: new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr), q.clone(), new THREE.Vector3(1, 1, 1)), y }); }
  P.sort((a, b) => a.y - b.y); P.forEach((p, i) => mesh.setMatrixAt(i, p.m));
  const g = grp(mesh); g.grow = (u) => { mesh.count = Math.round(clamp(u) * n); }; return g;
}
export function hospitalBed(o = {}) {
  const g = new THREE.Group(), frameM = flat(0xdfe6ee, 0.3), L = 1.4, W = 0.65, h = 0.42;
  g.add(at(box(W, 0.1, L, flat(0xf4f4f0, 0.8), 0, 0, 0, 0.04), 0, h, 0)); g.add(at(box(W * 0.9, 0.08, 0.28, flat(0xffffff, 0.8), 0, 0, 0, 0.04), 0, h + 0.08, -L / 2 + 0.2));
  g.add(at(box(W * 0.96, 0.05, L * 0.6, flat(o.blanket ?? 0x7fc8e8, 0.8), 0, 0, 0, 0.02), 0, h + 0.07, 0.2));
  for (const z of [-L / 2, L / 2]) { g.add(at(box(W, 0.5, 0.04, frameM, 0, 0, 0, 0.02), 0, h + 0.1, z)); for (const s of [-1, 1]) g.add(at(cyl(0.02, 0.02, h + 0.3, frameM), s * W / 2, (h + 0.3) / 2, z)); }
  for (const s of [-1, 1]) g.add(at(box(0.03, 0.18, L * 0.5, frameM), s * W / 2, h + 0.15, 0.05));
  g.top = h + 0.1; return g;
}
export function mailbox(o = {}) {
  const g = new THREE.Group(), m = flat(o.color ?? 0x2f6fe0, 0.4);
  g.add(at(box(0.07, 0.8, 0.07, flat(0x6b4a2e, 0.8)), 0, 0.4, 0));
  g.add(box(0.24, 0.22, 0.42, m, 0, 0.88, 0, 0.09)); g.add(at(box(0.02, 0.16, 0.05, flat(0xe0202a, 0.5)), 0.13, 0.95, 0.1)); return g;
}
export function bin(o = {}) { const g = new THREE.Group(), m = flat(o.color ?? 0x3a7f3a, 0.6); g.add(at(cyl(0.2, 0.17, 0.62, m), 0, 0.31, 0)); g.add(at(cyl(0.22, 0.22, 0.05, m), 0, 0.64, 0)); return g; }
export function bush(o = {}) { return paintedBush(o); }
export function tree(o = {}) { return paintedTree(o); }
export function fence(o = {}) {
  const g = new THREE.Group(), L = o.len ?? 4, h = o.h ?? 0.75, m = flat(o.color ?? 0xf4f1ea, 0.6);
  for (let x = -L / 2; x <= L / 2 + 1e-6; x += 0.16) g.add(at(box(0.08, h, 0.025, m), x, h / 2, 0));
  for (const y of [h * 0.3, h * 0.75]) g.add(at(box(L + 0.08, 0.05, 0.02, m), 0, y, -0.02));
  return g;
}
// Street lamp; pass the scene to add its light: streetLamp({ on: true, scene, h })
export function streetLamp(o = {}) {
  const g = new THREE.Group(), h = o.h ?? 4.2, m = flat(0x3a3f48, 0.4);
  g.add(at(cyl(0.06, 0.09, h, m, 10), 0, h / 2, 0)); g.add(at(box(0.08, 0.06, 0.9, m), 0, h, 0.42));
  const head = at(box(0.3, 0.1, 0.18, new THREE.MeshStandardMaterial({ color: 0xfff2c8, emissive: 0xffd78a, emissiveIntensity: o.on ? 2 : 0 })), 0, h - 0.05, 0.85); g.add(head);
  if (o.on) { const l = new THREE.PointLight(0xffd08a, o.intensity ?? 40, o.range ?? 14, 1.6); l.position.set(0, h - 0.2, 0.85); g.add(l);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: 0xffd08a, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); s.position.copy(l.position); s.scale.setScalar(1.2); g.add(s); }
  return g;
}
export function cone() { const g = new THREE.Group(); g.add(at(cyl(0.02, 0.16, 0.5, flat(0xff6a1a, 0.5), 16), 0, 0.27, 0)); g.add(at(cyl(0.075, 0.115, 0.08, flat(0xffffff, 0.5), 16), 0, 0.3, 0)); g.add(at(box(0.36, 0.03, 0.36, flat(0xff6a1a, 0.5)), 0, 0.015, 0)); return g; }
// Parcel with a label: parcel({ w, h, d, label: ['FRAGILE'] })
export function parcel(o = {}) {
  const w = o.w ?? 0.4, h = o.h ?? 0.3, d = o.d ?? 0.3, g = new THREE.Group(), m = flat(o.color ?? 0xc8955a, 0.9);
  g.add(at(box(w, h, d, m), 0, h / 2, 0)); g.add(at(box(w + 0.005, 0.02, 0.06, flat(0xd9c49a, 0.5)), 0, h + 0.001, 0));
  if (o.label) { const p = panel(w * 0.5, h * 0.35, { px: 256, draw: (c, W, H) => drawLabel(c, W, H, o.label, { bg: '#ffffff', fg: '#d9342b' }) }); p.position.set(0, h * 0.55, d / 2 + 0.002); g.add(p); }
  return g;
}
// Rubber duck (pool, bath, desk gag).
export function duck(o = {}) {
  const g = new THREE.Group(), y = flat(o.color ?? 0xffd02a, 0.35), s = o.size ?? 0.25;
  const body = new THREE.Mesh(new THREE.SphereGeometry(s * 0.5, 16, 12), y); body.scale.set(1.25, 0.8, 1); body.position.y = s * 0.35; body.castShadow = true; g.add(body);
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(s * 0.3, 16, 12), y), s * 0.32, s * 0.78, 0));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(s * 0.1, s * 0.22, 10), flat(0xff7a1a, 0.4)); beak.rotation.z = -Math.PI / 2; beak.position.set(s * 0.6, s * 0.74, 0); g.add(beak);
  for (const z of [-1, 1]) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(s * 0.04, 8, 6), M.black), s * 0.5, s * 0.86, z * s * 0.13));
  return g;
}
// Small camera box with a red light (dash cam, doorbell cam, CCTV): camBox({ on: true })
export function camBox(o = {}) {
  const g = new THREE.Group(), m = flat(o.color ?? 0x222228, 0.35);
  g.add(box(0.12, 0.07, 0.07, m, 0, 0, 0, 0.012)); const lens = cyl(0.025, 0.025, 0.02, flat(0x0c0c10, 0.1), 16); lens.rotation.x = Math.PI / 2; lens.position.z = 0.04; g.add(lens);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2020, toneMapped: false })); led.position.set(0.04, 0.02, 0.036); g.add(led); g.led = led;
  if (o.on !== false) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: 0xff3030, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })); s.position.copy(led.position); s.scale.setScalar(0.05); g.add(s); g.glow = s; }
  return g;
}
export const PROPS = ['sign', 'deskPlate', 'counter', 'screen', 'paper', 'panel', 'desk', 'table', 'chair', 'shelf', 'cabinet', 'plant', 'deskPhone', 'laptop', 'frame', 'cashPile', 'hospitalBed', 'mailbox', 'bin', 'bush', 'tree', 'fence', 'streetLamp', 'cone', 'parcel', 'duck', 'camBox'];

// ------------------------------------------------------------------ room furniture (used by sets/room.js)
export function sofa(o = {}) {
  const w = o.w ?? 2.0 * K, m = flat(o.color ?? 0x5a7ae8, 0.85), g = new THREE.Group(), d = 0.85 * K;
  g.add(box(w, 0.28, d, m, 0, 0.22, 0, 0.06)); g.add(box(w, 0.5, 0.2, m, 0, 0.5, -d / 2 + 0.1, 0.06));
  for (const s of [-1, 1]) g.add(box(0.18, 0.42, d, m, s * (w / 2 - 0.09), 0.36, 0, 0.06));
  for (const s of [-1, 1]) g.add(box(w / 2 - 0.2, 0.1, d - 0.25, flat(o.cushion ?? (o.color ?? 0x5a7ae8), 0.9), s * (w / 4 - 0.05), 0.41, 0.08, 0.04));
  g.seat = 0.46; return g;
}
export function fridge(o = {}) {
  const g = new THREE.Group(), m = flat(o.color ?? 0xeef0f2, 0.3), h = o.h ?? 1.5;
  g.add(box(0.62, h, 0.6, m, 0, h / 2, 0, 0.04)); g.add(box(0.6, 0.012, 0.01, M.dark, 0, h * 0.68, 0.302));
  for (const y of [h * 0.82, h * 0.45]) g.add(box(0.03, 0.22, 0.04, M.chrome, 0.24, y, 0.32));
  return g;
}
export function counterUnit(o = {}) {
  const w = o.w ?? 2.4, g = new THREE.Group(), h = 0.62, d = 0.48, top = flat(o.top ?? 0xe8e2d4, 0.25), body = flat(o.color ?? 0x7fa88a, 0.6);
  g.add(box(w, h - 0.04, d, body, 0, (h - 0.04) / 2, 0)); g.add(box(w + 0.04, 0.04, d + 0.04, top, 0, h - 0.02, 0.01));
  for (let x = -w / 2 + 0.3; x < w / 2; x += 0.6) { g.add(box(0.56, h - 0.12, 0.01, flat(o.color ?? 0x7fa88a, 0.45), x, (h - 0.04) / 2, d / 2 + 0.005)); g.add(box(0.12, 0.02, 0.02, M.chrome, x, h - 0.14, d / 2 + 0.02)); }
  g.top = h; return g;
}
export function tv(o = {}) { const t = screen({ w: o.w ?? 0.8, h: o.h ?? 0.46, lines: o.lines ?? ['NEWS'], bg: o.bg ?? '#1f3a8a', draw: o.draw }); return t; }
export function rug(o = {}) {
  const w = o.w ?? 2, d = o.d ?? 1.4, c = canvas(256, 180), g = c.getContext('2d');
  g.fillStyle = o.color ?? '#b5473a'; g.fillRect(0, 0, 256, 180); g.strokeStyle = o.trim ?? '#f2d9a0'; g.lineWidth = 10; g.strokeRect(14, 14, 228, 152); g.lineWidth = 4; g.strokeRect(34, 34, 188, 112);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: ctex(c), roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.005; m.receiveShadow = true; return grp(m);
}
PROPS.push('sofa', 'fridge', 'counterUnit', 'tv', 'rug');
// Hanging pendant lamp (the reference's interiors light every scene from visible lamps): a dome shade on a cord, a
// glowing bulb that blooms, and a warm pool of light under it. pendant({ color, cord 0.6, r 0.26, on true, intensity 9, range 6 })
// Put its top at the ceiling height; the light hangs `cord` below.
export function pendant(o = {}) {
  const g = new THREE.Group(), r = o.r ?? 0.26, cord = o.cord ?? 0.6, sh = flat(o.color ?? 0x2f6b4a, 0.35);
  g.add(at(cyl(0.008, 0.008, cord, M.dark, 6), 0, -cord / 2, 0));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), sh); dome.material.side = THREE.DoubleSide;
  dome.position.y = -cord - r; dome.castShadow = true; g.add(dome);   // top of the dome at the cord's end, rim 0.75 r below
  const rimY = dome.position.y + r * Math.cos(Math.PI * 0.42), by = rimY + r * 0.02, on = o.on ?? true;
  g.add(at(new THREE.Mesh(new THREE.TorusGeometry(r * Math.sin(Math.PI * 0.42), r * 0.035, 8, 32).rotateX(Math.PI / 2), flat(0xf2ead8, 0.5)), 0, rimY, 0));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(r * 0.22, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff1c8).multiplyScalar(on ? 2.2 : 0.9), toneMapped: false }));
  bulb.position.y = by; g.add(bulb);
  if (on) { const l = new THREE.PointLight(0xffe3b0, o.intensity ?? 9, o.range ?? 6, 1.5); l.position.y = by - 0.05; l.castShadow = !!o.shadow; g.add(l); g.light = l;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: 0xffd9a0, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); s.position.y = by; s.scale.setScalar(r * 2.6); g.add(s); }
  return g;
}
