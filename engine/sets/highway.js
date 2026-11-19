// Highway set: 4-lane road along x with a filled roadside: guardrails, grass tufts, a power line, rows of houses
// and painted trees on both sides, far hills. Lane centres z = -5.55, -1.85, 1.85, 5.55 (LANES). Road spans x -500..1000.
// opts: wet (rain asphalt), wall (old noise wall on the -z side, off by default), houses, rails, tufts, lines (all on),
//       trees (count, 420), lights (lit windows for night), x0/x1 (range to dress, default -320..920).
import { THREE, V3, rng, canvas, ctex } from '../core.js';
import { noiseTex, grassTex, asphaltTex } from '../materials.js';
import { forest, houseRow, guardrail, grassTufts, powerLine, bushRow } from '../scenery.js';

export const LANES = [-5.55, -1.85, 1.85, 5.55];

// opts.wet: darker, glossier asphalt for the rain act. opts.trees: count (300).
export function addHighway(scene, opts = {}) {
  const wet = !!opts.wet;
  const asphalt = new THREE.MeshStandardMaterial({ map: ctex(asphaltTex({ wet }), [250, 3]), roughness: wet ? 0.35 : 0.93, metalness: wet ? 0.1 : 0 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(1500, 19), asphalt); road.rotation.x = -Math.PI / 2; road.position.set(250, 0, 0); road.receiveShadow = true; scene.add(road);
  const grassMat = new THREE.MeshStandardMaterial({ map: ctex(grassTex({ seed: 5 }), [650, 125]), roughness: 1 });
  for (const s of [-1, 1]) {
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(2600, 500), grassMat); gp.rotation.x = -Math.PI / 2; gp.position.set(250, -0.02, s * (9.5 + 250)); gp.receiveShadow = true; scene.add(gp);
  }
  const mk = (color) => new THREE.MeshBasicMaterial({ color, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const white = mk(0xf2f2ee), yellow = mk(0xf2c224);
  const dashG = new THREE.PlaneGeometry(3, 0.16); dashG.rotateX(-Math.PI / 2);
  const dashes = new THREE.InstancedMesh(dashG, white, 3 * 110); const m4 = new THREE.Matrix4(); let k = 0;
  for (const z of [-3.7, 0, 3.7]) for (let i = 0; i < 110; i++) { m4.makeTranslation(-420 + i * 12, 0.012, z); dashes.setMatrixAt(k++, m4); }
  scene.add(dashes);
  for (const [z, mat] of [[-7.45, yellow], [7.45, white]]) {
    const e = new THREE.Mesh(new THREE.PlaneGeometry(1500, 0.16), mat); e.rotation.x = -Math.PI / 2; e.position.set(250, 0.012, z); scene.add(e);
  }
  const X0 = opts.x0 ?? -320, X1 = opts.x1 ?? 920;
  let wall = null;
  if (opts.wall) {   // the old noise wall on the far side
    const wc = canvas(256, 256), wg = wc.getContext('2d');
    wg.fillStyle = '#cfc8ba'; wg.fillRect(0, 0, 256, 256); wg.fillStyle = '#b9b1a2'; wg.fillRect(0, 0, 10, 256); wg.fillRect(0, 0, 256, 14);
    wg.fillStyle = '#ddd6c9'; wg.fillRect(10, 14, 246, 6); wg.strokeStyle = '#bfb8aa'; for (let y = 60; y < 256; y += 48) { wg.beginPath(); wg.moveTo(10, y); wg.lineTo(256, y); wg.stroke(); }
    wall = new THREE.Mesh(new THREE.BoxGeometry(1500, 4.2, 0.5), new THREE.MeshStandardMaterial({ map: ctex(wc, [250, 1]), roughness: 0.95 }));
    wall.position.set(250, 2.1, -15.5); wall.castShadow = true; wall.receiveShadow = true; scene.add(wall);
  }
  // guardrail on the far side only by default (the near shoulder is where characters stand and cameras go); rails: 'both'
  if (opts.rails !== false) for (const z of opts.rails === 'both' ? [-9.7, 9.7] : [-9.7]) guardrail(scene, { z, x0: X0 - 150, x1: X1 + 150, side: Math.sign(z) });
  if (opts.tufts !== false) for (const s of [-1, 1]) {
    grassTufts(scene, { area: [X0, X1, s * 9.9, s * 15], count: 9000, seed: 3 + s, size: 0.42 });
    grassTufts(scene, { area: [X0, X1, s * 15, s * 30], count: 9000, seed: 7 + s, size: 0.8 });
  }
  if (opts.lines !== false) powerLine(scene, { z: -12.6, x0: X0 - 100, x1: X1 + 100 });
  if (opts.houses !== false) {
    houseRow(scene, { x0: X0, x1: X1, z: -27, face: 1, seed: 12, lights: opts.lights });
    houseRow(scene, { x0: X0 + 8, x1: X1, z: 29, face: -1, seed: 41, lights: opts.lights });
    houseRow(scene, { x0: X0 - 4, x1: X1, z: -52, face: 1, seed: 77, lights: opts.lights });
    bushRow(scene, { area: [X0, X1, -24.5, -20], count: 260, seed: 4 }); bushRow(scene, { area: [X0, X1, 20, 25], count: 220, seed: 5 });
  }
  const NT = opts.trees ?? 420;
  forest(scene, { area: [X0, X1, -19.5, -14], count: Math.round(NT * 0.28), seed: 21, scale: [0.85, 1.3] });
  forest(scene, { area: [X0, X1, 15.5, 21], count: Math.round(NT * 0.24), seed: 22, scale: [0.85, 1.3] });
  forest(scene, { area: [X0 - 100, X1 + 100, -48, -36], count: Math.round(NT * 0.24), seed: 23, scale: [1.0, 1.6] });
  forest(scene, { area: [X0 - 100, X1 + 100, 36, 70], count: Math.round(NT * 0.24), seed: 24, scale: [1.0, 1.7] });
  const r = rng(21);
  // far hills
  const hillM = new THREE.MeshStandardMaterial({ color: 0x3f8a6a, roughness: 1 });
  for (let i = 0; i < 9; i++) { const hl = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), hillM); hl.scale.set(140 + r() * 120, 26 + r() * 30, 80); hl.position.set(-500 + i * 190 + r() * 60, -4, -330 - r() * 120); scene.add(hl); }
  return { LANES, road, wall };
}
