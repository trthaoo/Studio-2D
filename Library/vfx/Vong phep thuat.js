// name: Vòng phép thuật
// at: feet
// dur: 4
// (ví dụ từ Rigging Studio)
// A magic circle on the floor: rings and runes turning, growing as it appears.
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

return { object: group, update };
