// name: Lấp lánh bung ra
// at: chest
// dur: 2.5
// (ví dụ từ Rigging Studio)
// A burst of sparkles: they fly out, slow down, fall and twinkle out.
const COUNT = 600;
const pos = new Float32Array(COUNT * 3), col = new Float32Array(COUNT * 3);
const base = [], dir = [], speed = [], life = [];
const gold = new THREE.Color(0xffd36b), pink = new THREE.Color(0xff6bd5);
for (let i = 0; i < COUNT; i++) {
  // Anywhere on a sphere, at its own speed, lasting its own time.
  const u = fx.random() * 2 - 1, a = fx.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
  dir.push([r * Math.cos(a), u, r * Math.sin(a)]);
  speed.push(1.5 + fx.random() * 3);
  life.push(0.8 + fx.random() * 1.4);
  base.push(gold.clone().lerp(pink, fx.random()));
}
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
const mat = new THREE.PointsMaterial({ size: 0.07, map: fx.dot(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
const points = new THREE.Points(geo, mat);
points.frustumCulled = false;
const group = new THREE.Group();
group.add(points);

function update(t) {
  // Out fast, slowed by the air, and falling.
  const out = (1 - Math.exp(-3 * t)) / 3;
  for (let i = 0; i < COUNT; i++) {
    const d = speed[i] * out;
    pos[i * 3] = dir[i][0] * d;
    pos[i * 3 + 1] = dir[i][1] * d - 0.5 * t * t;
    pos[i * 3 + 2] = dir[i][2] * d;
    const left = Math.max(0, 1 - t / life[i]);
    const twinkle = 0.55 + 0.45 * Math.sin(t * 25 + i * 1.7);
    const k = left * left * twinkle * Math.min(1, t * 20);
    col[i * 3] = base[i].r * k;
    col[i * 3 + 1] = base[i].g * k;
    col[i * 3 + 2] = base[i].b * k;
  }
  geo.attributes.position.needsUpdate = true;
  geo.attributes.color.needsUpdate = true;
}

return { object: group, update };
