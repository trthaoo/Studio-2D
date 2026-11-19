// name: Cầu lửa trên tay
// at: rightHand
// dur: 3
// (ví dụ từ Rigging Studio)
// A fireball held in the hand: a hot core, a glow round it, and sparks swirling about.
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

return { object: group, update };
