// name: Vòng năng lượng
// at: feet
// dur: 4
// (ví dụ từ Rigging Studio)
// Rings of light rising round whoever it's on, and sparks spiralling up with them.
const group = new THREE.Group();
const rings = [];
for (let i = 0; i < 4; i++) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: fx.ring(), color: 0x3ad7ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2;
  group.add(m);
  rings.push(m);
}

const COUNT = 260;
const pos = new Float32Array(COUNT * 3);
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const sparks = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.05, map: fx.dot(), color: 0xa8f0ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
sparks.frustumCulled = false;
group.add(sparks);
const spark = [];
for (let i = 0; i < COUNT; i++) spark.push({ a: fx.random() * Math.PI * 2, r: 0.35 + fx.random() * 0.25, rise: 0.5 + fx.random() * 0.9, h: fx.random() * 2.2, turn: 1.5 + fx.random() * 2 });

function update(t) {
  const f = fx.fade(t, 0.4, 0.6);
  rings.forEach((m, i) => {
    // Each ring's own life, one after another: wide at the floor, rising and closing in, fading at the top.
    const p = (t * 0.6 + i / rings.length) % 1;
    const s = 1.6 - p * 0.7;
    m.scale.set(s, s, 1);
    m.position.y = 0.03 + p * 1.9;
    m.material.opacity = Math.sin(p * Math.PI) * f;
  });
  for (let i = 0; i < COUNT; i++) {
    const s = spark[i], h = (s.h + t * s.rise) % 2.2, a = s.a + t * s.turn;
    pos[i * 3] = Math.cos(a) * s.r;
    pos[i * 3 + 1] = h;
    pos[i * 3 + 2] = Math.sin(a) * s.r;
  }
  geo.attributes.position.needsUpdate = true;
  sparks.material.opacity = f;
}

return { object: group, update };
