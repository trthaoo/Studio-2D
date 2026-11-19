// name: Lửa dưới chân
// at: feet
// dur: 5
// (ví dụ từ Rigging Studio)
// A fire on the floor: flames rising and flickering, cooling from yellow to orange to deep red.
const group = new THREE.Group();
const dot = fx.dot();
const flames = [];
for (let i = 0; i < 150; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xffaa33, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  group.add(s);
  flames.push({ s, x: (fx.random() - 0.5) * 0.5, z: (fx.random() - 0.5) * 0.5, phase: fx.random(), life: 0.6 + fx.random() * 0.6, size: 0.22 + fx.random() * 0.22 });
}
const hot = new THREE.Color(0xfff2b0), mid = new THREE.Color(0xff7a1a), cool = new THREE.Color(0x7a1404);

function update(t) {
  const f = fx.fade(t, 0.3, 0.5);
  for (const p of flames) {
    // 0 to 1 over each flame's life, over and over: up, in towards the middle, smaller and cooler.
    const k = (t / p.life + p.phase) % 1;
    const sway = Math.sin(t * 7 + p.phase * 40) * 0.05 * k;
    p.s.position.set(p.x * (1 - k * 0.7) + sway, k * 1.1, p.z * (1 - k * 0.7));
    const size = p.size * (1 - k * 0.55);
    p.s.scale.set(size, size * 1.4, 1);
    if (k < 0.35) p.s.material.color.copy(hot).lerp(mid, k / 0.35);
    else p.s.material.color.copy(mid).lerp(cool, (k - 0.35) / 0.65);
    p.s.material.opacity = Math.sin(Math.PI * Math.min(1, k * 1.25)) * 0.75 * f;
  }
}

return { object: group, update };
