// Scene half of the look check (film.mjs lookcheck). For the frame at time t it reads the 3D scene, not the pixels:
//   kind     indoor (a ceiling within 6 m above the camera) | outdoor | studio (shot.look = 'studio': cast lineups)
//   gloss    share of the solid world meshes in view that carry the clear coat (lacquer() or car paint)
//   inkOk    the ink settings fit the kind (indoor: ink >= 0.9 and crease lines on; outdoor: crease lines off)
//   lights   light sources visible in frame (glowing bulbs, lamp heads, lit windows: unlit or emissive meshes above 1.2)
//   dof      the lens blur fits the framing (subject within 3 m: cInf 8-16, except ultra-wide lenses of 80 degrees or more;
//            a wide with the subject past 4.5 m: off)
//   regions  for the pixel half (tools/look_score.py): head circles, and in-focus and background tiles found by
//            casting one ray per 60 px tile, so the script can compare sharpness by depth.
import { THREE, PAINT_DEFAULT, CHAR_LAYER } from './core.js';

const ray = new THREE.Raycaster(); ray.layers.enableAll();
const frustum = new THREE.Frustum(), pm = new THREE.Matrix4(), sph = new THREE.Sphere(), v = new THREE.Vector3();

function hitDist(scene, cam, nx, ny) {
  ray.setFromCamera({ x: nx, y: ny }, cam); ray.camera = cam; ray.near = cam.near; ray.far = 400;
  const fw = cam.getWorldDirection(new THREE.Vector3());
  for (const h of ray.intersectObject(scene, true)) {
    let ok = true; for (let q = h.object; q; q = q.parent) if (!q.visible || q.userData.noHit) { ok = false; break; }
    const m = h.object.material; if (!ok || (m && m.transparent && m.opacity < 0.5) || h.object.isSprite) continue;
    return h.point.clone().sub(cam.position).dot(fw);
  }
  return Infinity;
}
const visibleChain = (o) => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };

export function lookcheck(t) {
  const shots = window.__shots, s = shots.find((x) => t >= x.start && t < x.end) || shots[shots.length - 1];
  const st = s.stage, scene = st.scene, cam = st.camera, P = { ...PAINT_DEFAULT, ...((st.mood || {}).paint || {}) };
  scene.updateMatrixWorld(true); cam.updateMatrixWorld(true);
  pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); frustum.setFromProjectionMatrix(pm);
  // kind
  ray.camera = cam;   // sprites need it
  let open = 0; for (let i = 0; i < 6; i++) for (let j = 0; j < 10; j++) if (hitDist(scene, cam, (i + 0.5) / 3 - 1, 1 - (j + 0.5) / 5) > 200) open++;
  const kind = s.look || (open > 3 ? 'outdoor' : 'indoor');   // indoor: almost no ray reaches the sky
  // gloss and lights over the meshes in view
  let solid = 0, coated = 0, lights = 0; const lightNames = [];
  scene.traverse((o) => {
    if (!o.isMesh || !visibleChain(o) || o.userData.noHit || o.layers.isEnabled(CHAR_LAYER) && !o.layers.isEnabled(0)) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    sph.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld); if (!frustum.intersectsSphere(sph)) return;
    for (const m of [].concat(o.material)) {
      if (!m) continue;
      const glow = (m.isMeshBasicMaterial && m.toneMapped === false && Math.max(m.color.r, m.color.g, m.color.b) > 1.2) ||
        (m.emissive && m.emissiveIntensity * Math.max(m.emissive.r, m.emissive.g, m.emissive.b) > 1.2);
      if (glow) { lights++; if (lightNames.length < 4) lightNames.push(o.name || o.geometry.type); continue; }
      if (!m.isMeshStandardMaterial || m.transparent || m.alphaTest > 0 || m.userData.matte) continue;
      if (sph.radius > 30) continue;   // ground planes, sky-sized things
      solid++; if (m.isMeshPhysicalMaterial && m.clearcoat >= 0.5) coated++;
    }
  });
  const inkOk = kind === 'outdoor' ? P.ink >= 0.85 && !P.inkCrease : kind === 'studio' ? P.ink >= 0.85 : P.ink >= 0.9 && !!P.inkCrease;
  // characters on screen, nearest subject
  const heads = [], W = 1080, H = 1920; let near = Infinity;
  scene.traverse((o) => {
    if (typeof o.headWorld !== 'function' || !visibleChain(o)) return;
    const p = o.headWorld(), d = p.distanceTo(cam.position); v.copy(p).project(cam);
    if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) return;
    const e = p.clone().add(new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0).multiplyScalar(o.R)).project(cam);
    heads.push([Math.round((v.x + 1) / 2 * W), Math.round((1 - v.y) / 2 * H), Math.round(Math.abs(e.x - v.x) / 2 * W)]); near = Math.min(near, d);
  });
  const D = st._dof, cInf = D ? D.cInf : 0;
  let dofOk = true, dofMsg = cInf ? `blur ${cInf} px, focus ${D.focus.toFixed(2)} m` : 'no blur';
  const ultra = cam.fov >= 80;   // an ultra-wide lens keeps everything in focus: no blur asked for
  if (near < 3 && !ultra && !(cInf >= 8 && cInf <= 16) && kind !== 'studio') { dofOk = false; dofMsg += ` (subject at ${near.toFixed(1)} m: use cInf 8-16)`; }
  if (near > 4.5 && near < Infinity && cInf > 4) { dofOk = false; dofMsg += ` (wide, subject at ${near.toFixed(1)} m: blur off)`; }
  // depth tiles for the pixel half
  const focus = [], background = [];
  if (D && D.cInf) {
    const T = 60;
    for (let y = 0; y < H; y += T) for (let x = 0; x < W; x += T) {
      const d = hitDist(scene, cam, (x + T / 2) / W * 2 - 1, 1 - (y + T / 2) / H * 2);
      if (Math.abs(d - D.focus) < D.focus * 0.15) focus.push([x, y, x + T, y + T]);
      else if (d > D.focus * 1.8) background.push([x, y, x + T, y + T]);
    }
  }
  const wide = !(D && D.cInf) && (near > 3 || ultra);
  return { t, kind, wide, gloss: solid ? coated / solid : null, solid, inkOk, ink: P.ink, inkCrease: P.inkCrease, lights, lightNames, dofOk, dofMsg, near,
    regions: { kind, mood: st.moodName, heads, focus, background } };
}
