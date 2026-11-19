// name: Máy pha cà phê
// kind: prop
// Đồ vật đứng trên sàn (y = 0), mặt trước hướng +z, đơn vị mét (nhân vật cao ~1.2 m).
export default function build({ THREE, box, flat, labelTex }, opts) {
  const g = new THREE.Group();
  const body = flat(opts.color ?? 0x2b2f3a, 0.5), steel = flat(0xd9dde4, 0.25);
  g.add(box(0.36, 0.42, 0.3, body, 0, 0.21, 0, 0.03));          // thân máy
  g.add(box(0.3, 0.06, 0.26, steel, 0, 0.45, 0, 0.02));          // nắp
  g.add(box(0.14, 0.04, 0.12, steel, 0, 0.03, 0.12, 0.01));      // khay
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.07, 16), flat(0xffffff, 0.4));
  cup.position.set(0, 0.085, 0.12); cup.castShadow = true; g.add(cup);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.08), new THREE.MeshBasicMaterial({ map: labelTex(['COFFEE'], { bg: '#c9781a', fg: '#fff', border: false }) }));
  label.position.set(0, 0.3, 0.151); g.add(label);
  return g;
}
