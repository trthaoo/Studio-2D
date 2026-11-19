// name: Cây nước nóng lạnh
// kind: prop
export default function build({ THREE, box, flat }, opts) {
  const g = new THREE.Group();
  const white = flat(0xf2f2ee, 0.4), grey = flat(0x8f97a6, 0.5);
  g.add(box(0.32, 0.78, 0.3, white, 0, 0.39, 0, 0.04));                 // thân
  g.add(box(0.2, 0.12, 0.04, grey, 0, 0.6, 0.15, 0.02));                 // hốc lấy nước
  for (const [x, c] of [[-0.05, 0x2f6fe0], [0.05, 0xe0302a]]) {          // hai vòi: lạnh, nóng
    g.add(box(0.03, 0.04, 0.04, flat(c, 0.4), x, 0.62, 0.17, 0.01));
  }
  g.add(box(0.18, 0.02, 0.1, grey, 0, 0.5, 0.13, 0.005));               // khay
  // bình nước úp ngược
  const glass = new THREE.MeshPhysicalMaterial({ color: opts.color ?? 0x7fc8ff, roughness: 0.1, transmission: 0.5, transparent: true, opacity: 0.75, thickness: 0.05 });
  const jug = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.36, 24), glass); jug.position.y = 0.98; g.add(jug);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.13, 0.08, 24), glass); neck.position.y = 0.8; g.add(neck);
  return g;
}
