// Effects driven purely by time: smoke/steam/dust puffs, skid marks, ballistic debris.
import { THREE, rng } from './core.js';
import { M, box, puffTex } from './materials.js';

// puffs(scene, n) -> { begin(), add(x, y, z, size, opacity, colourHex), end() }
// Call begin() each frame, add() every visible puff, then end() hides the unused sprites.
export function puffs(scene, n = 230) {
  const pool = []; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: 0xf2f2f2, transparent: true, opacity: 0, depthWrite: false })); s.visible = false; scene.add(s); pool.push(s); }
  let pi = 0;
  return {
    pool,
    begin() { pi = 0; },
    add(x, y, z, s, o, c) { if (pi >= pool.length) return; const p = pool[pi++]; p.visible = true; p.position.set(x, y, z); p.scale.setScalar(s); p.material.opacity = o; p.material.color.setHex(c); },
    end() { for (; pi < pool.length; pi++) pool[pi].visible = false; },
  };
}
// Tyre smoke trail behind a braking car. at(t) = car x on the road; emits from t0 to min(t, t1).
// offs = [front wheel x offset, rear wheel x offset], hwz = half track, z = lane centre, op = opacity.
export function tyreSmoke(P, at, t, t0, t1, dt, offs, hwz, op, z) {
  for (let te = t0, j = 0; te < Math.min(t, t1); te += dt, j++) {
    const age = t - te; if (age > 1.5) continue;
    const fd = Math.min(1, age / 0.07) * (1 - age / 1.5), side = (j >> 1) % 2 ? 1 : -1, jz = ((j * 37) % 11) / 11 - 0.5;
    P.add(at(te) + offs[j % 2] - 0.4 * age, 0.2 + 0.8 * age, z + side * (hwz + 0.45 * age) + jz * 0.25, 0.6 + 2.4 * age, op * fd, 0xf0f0f0);
  }
}
// skids(scene, n) -> [mesh]; set with skid(m, at, t, t0, t1, xOffset, z, width)
export function skids(scene, n = 4) {
  const mat = new THREE.MeshBasicMaterial({ color: 0x18181b, transparent: true, opacity: 0.42, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6, depthWrite: false });
  const out = []; for (let i = 0; i < n; i++) { const g = new THREE.PlaneGeometry(1, 0.2); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, mat); m.visible = false; scene.add(m); out.push(m); }
  return out;
}
export function skid(m, at, t, t0, t1, off, z, wd) {
  if (t <= t0) { m.visible = false; return; }
  const a = at(t0) + off, b = at(Math.min(t, t1)) + off; m.visible = true; m.scale.set(Math.max(0.01, b - a), 1, wd); m.position.set((a + b) / 2, 0.013, z);
}
// debris(scene, mats, n, seed) -> { update(ti, x0, z0) }  pieces fly from (x0, z0) at ti = time since impact, bounce, slide.
export function debris(scene, mats, n = 30, seed = 99) {
  const r = rng(seed), list = [];
  for (let i = 0; i < n; i++) {
    const m = box(0.08 + r() * 0.2, 0.02 + r() * 0.03, 0.06 + r() * 0.14, mats[i % mats.length], 0, 0, 0); m.visible = false; scene.add(m);
    m.userData = { z0: (r() - 0.5) * 1.5, y0: 0.35 + r() * 0.5, v: [9 + r() * 6 - (i % 3) * 3.5, 1.8 + r() * 4.6, (r() - 0.5) * 8], sp: [r() * 14, r() * 14, r() * 14] }; list.push(m);
  }
  return {
    list,
    update(ti, cx0, lane) {
      for (const d of list) {
        if (ti <= 0) { d.visible = false; continue; } d.visible = true;
        const u = d.userData, tl = (u.v[1] + Math.sqrt(u.v[1] * u.v[1] + 19.62 * (u.y0 - 0.03))) / 9.81, a = Math.min(ti, tl), sl = ti > tl ? (1 - Math.exp(-3.5 * (ti - tl))) / 3.5 : 0;
        d.position.set(cx0 + u.v[0] * (a + sl * 0.6), Math.max(0.03, u.y0 + u.v[1] * a - 4.905 * a * a), lane + u.z0 + u.v[2] * (a + sl * 0.6));
        const ra = a + sl * 0.3; d.rotation.set(u.sp[0] * ra, u.sp[1] * ra, ti > tl ? 0 : u.sp[2] * ra);
      }
    },
  };
}
export const lightMats = { tail: () => new THREE.MeshStandardMaterial({ color: 0xd01525, emissive: 0x550008, roughness: 0.3 }), glassShard: () => new THREE.MeshStandardMaterial({ color: 0xe8f4ff, roughness: 0.1 }), trim: () => M.trim };
