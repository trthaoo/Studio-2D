// name: Va chạm mặt đất
// at: feet
// dur: 1.6
// (ví dụ từ Rigging Studio)
// An impact on the floor: a flash, a shockwave racing out, and dust kicked up.
const group = new THREE.Group();
const dot = fx.dot();
const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xfff4d0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
flash.position.y = 0.3;
const wave = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: fx.ring(), color: 0xfff0c0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
wave.rotation.x = -Math.PI / 2;
wave.position.y = 0.02;
group.add(flash, wave);
// Dust: soft brown puffs, drawn as smoke is, not as light.
const puffs = [];
for (let i = 0; i < 40; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xb8a690, transparent: true, depthWrite: false }));
  puffs.push({ s, a: fx.random() * Math.PI * 2, far: 0.6 + fx.random() * 0.9, up: 0.1 + fx.random() * 0.4, size: 0.3 + fx.random() * 0.4 });
  group.add(s);
}

function update(t) {
  flash.material.opacity = Math.max(0, 1 - t / 0.25);
  flash.scale.setScalar(0.6 + t * 4);
  const p = Math.min(1, t / 0.6);
  wave.scale.setScalar(0.2 + (1 - Math.pow(1 - p, 3)) * 4);
  wave.material.opacity = 1 - p;
  const out = 1 - Math.exp(-4 * t), k = Math.min(1, t / fx.duration);
  for (const d of puffs) {
    d.s.position.set(Math.cos(d.a) * d.far * out, 0.12 + d.up * out, Math.sin(d.a) * d.far * out);
    d.s.scale.setScalar(d.size * (0.5 + k));
    d.s.material.opacity = 0.5 * (1 - k) * Math.min(1, t * 12);
  }
}

return { object: group, update };
