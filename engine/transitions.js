// In-world transitions: a burst of objects (bills, paper, leaves, confetti) flies at the camera, fills the frame,
// and clears to reveal the next shot. Drawn in its own scene on top of whatever shot is showing, so it works
// between any two shots. The shot underneath switches at shot.start, which is when the frame is fully covered.
//
//   { start, ..., in: { type: 'burst', frames: 18, fx: cashBurst() } }
//
// A burst can also be used inside a shot (cash raining on a lawn): call fx.render(u) yourself after rendering.
import { THREE, W, H, rng, canvas, ctex, clamp, lerp, smooth, renderer } from './core.js';

// makeBurst({ tex, n, size: [w, h] metres, seed, origin: [sx, sy] screen point -1..1 the burst comes from,
//             tint: [min, max] brightness spread, spin, cover })
// cover (0..1): how much of the frame is covered at the peak, u = 0.5.
export function makeBurst(o = {}) {
  const n = o.n || 900, [bw, bh] = o.size || [0.17, 0.075], origin = o.origin || [0, -0.75], spin = o.spin ?? 9;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, W / H, 0.05, 60);
  const tanY = Math.tan(25 * Math.PI / 180), tanX = tanY * W / H;
  const mat = new THREE.MeshBasicMaterial({ map: o.tex, side: THREE.DoubleSide, toneMapped: false, transparent: true, alphaTest: 0.05 });
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(bw, bh), mat, n);
  mesh.frustumCulled = false; scene.add(mesh);
  const r = rng(o.seed || 5), col = new THREE.Color(), B = [];
  const cover = o.cover ?? 1;
  for (let i = 0; i < n; i++) {
    const k = r();
    B.push({
      d: k * 0.3,                                  // arrive: starts at u = d, lasts 0.25
      e: 0.55 + r() * 0.22,                        // leave: starts at u = e, lasts 0.2, scattering outward
      sx: (r() * 2 - 1) * 1.15 * cover, sy: (r() * 2 - 1) * 1.15 * cover,   // where on screen it settles
      z1: -(0.9 + r() * 1.8),                      // settle depth (never so close it fills the frame alone)
      ax: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), rate: (0.4 + r()) * spin, ph: r() * 6.28,
      s: 1.2 + r() * 0.7, wob: r() * 6.28,
    });
    const t = lerp(o.tint?.[0] ?? 0.72, o.tint?.[1] ?? 1, r()); mesh.setColorAt(i, col.setRGB(t, t, t));
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), z0 = -9;
  function update(u) {
    for (let i = 0; i < n; i++) {
      const b = B[i], a = (u - b.d) / 0.25, x = (u - b.e) / 0.2;
      if (a <= 0 || x >= 1) { m4.makeScale(0, 0, 0); mesh.setMatrixAt(i, m4); continue; }
      const ea = smooth(clamp(a)), ex = x > 0 ? x * x : 0, out = 1 + 2.6 * ex;
      const z = lerp(z0, b.z1, ea) + 0.3 * ex;
      const sx = lerp(origin[0], b.sx, ea) * out, sy = lerp(origin[1], b.sy, ea) * out - 0.3 * ex;
      p.set(sx * tanX * -z, sy * tanY * -z, z);
      const lu = clamp(a) + Math.max(0, x);
      p.x += 0.05 * Math.sin(lu * 9 + b.wob); p.y += 0.04 * Math.cos(lu * 7 + b.wob);
      q.setFromAxisAngle(b.ax, b.ph + b.rate * lu);
      sc.setScalar(b.s); m4.compose(p, q, sc); mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  return {
    scene, camera: cam, update,
    // draw the burst over the frame already in the renderer
    render(u) { update(u); const ac = renderer.autoClear; renderer.autoClear = false; renderer.clearDepth(); renderer.render(scene, cam); renderer.autoClear = ac; },
  };
}

// Cartoon banknote (generic, not a real currency): green paper, dark border, pale oval, a big "$".
export function billTex() {
  const c = canvas(256, 112), g = c.getContext('2d');
  g.fillStyle = '#2f6b2a'; g.fillRect(0, 0, 256, 112);
  g.fillStyle = '#7cc463'; g.fillRect(6, 6, 244, 100);
  g.strokeStyle = '#3f8a35'; g.lineWidth = 3; g.strokeRect(14, 14, 228, 84);
  g.fillStyle = '#c4ebae'; g.beginPath(); g.ellipse(128, 56, 34, 38, 0, 0, 7); g.fill();
  g.strokeStyle = '#2f6b2a'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#2f6b2a'; g.font = 'bold 56px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 128, 59);
  g.font = 'bold 22px sans-serif'; for (const [x, y] of [[34, 30], [222, 30], [34, 84], [222, 84]]) g.fillText('100', x, y);
  return ctex(c);
}
// Ready-made bursts.
export const cashBurst = (o = {}) => makeBurst({ tex: billTex(), ...o });
export function paperTex() {
  const c = canvas(128, 160), g = c.getContext('2d'); g.fillStyle = '#f7f7f2'; g.fillRect(0, 0, 128, 160);
  g.fillStyle = '#b9c2cf'; for (let y = 24; y < 150; y += 14) g.fillRect(14, y, 100 - (y % 3) * 12, 4);
  g.fillStyle = '#d9342b'; g.font = 'bold 30px sans-serif'; g.fillText('PAID', 26, 150);
  return ctex(c);
}
export const paperBurst = (o = {}) => makeBurst({ tex: paperTex(), size: [0.12, 0.15], n: 700, spin: 6, ...o });
