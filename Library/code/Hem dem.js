// name: Hẻm đêm sau tiệm
// kind: set
// A narrow back alley behind a corner shop: brick walls, a back door with a lamp, crates, a bin and a drain pipe.
// Open toward +z; people stand around z -0.5…-1.5. opts: { wall: hex, door: hex }
export default function build({ THREE, box, flat, labelTex }, opts) {
  const g = new THREE.Group();
  const brick = flat(opts.wall ?? 0x8a4a3a, 0.9), dark = flat(0x2a2a30, 0.8), wood = flat(0xa87a4a, 0.85);
  g.add(box(6, 0.1, 5, flat(0x3a3a42, 0.95), 0, -0.05, -1.5));            // wet asphalt
  g.add(box(6, 3.4, 0.2, brick, 0, 1.7, -3.6));                            // back wall
  g.add(box(0.2, 3.4, 5, brick, -2.6, 1.7, -1.4));                         // left wall
  g.add(box(0.2, 3.4, 5, flat(0x6a3a30, 0.9), 2.6, 1.7, -1.4));            // right wall (in shade)
  const door = box(1.0, 2.0, 0.08, flat(opts.door ?? 0x2f6f8f, 0.6), 0.6, 1.0, -3.46); g.add(door);
  g.add(box(0.08, 0.08, 0.1, flat(0xd9b030, 0.4), 0.98, 1.0, -3.4));       // handle
  const lampBox = box(0.3, 0.18, 0.25, dark, 0.6, 2.3, -3.35); g.add(lampBox);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe2a0 })); bulb.position.set(0.6, 2.18, -3.3); g.add(bulb);
  const light = new THREE.PointLight(0xffc870, 10, 7, 1.4); light.position.set(0.6, 2.1, -3.0); g.add(light);
  for (const [x, z, s] of [[-1.9, -2.9, 0.55], [-1.9, -2.3, 0.45], [-1.4, -3.0, 0.4]]) g.add(box(s, s, s, wood, x, s / 2, z));   // crates
  g.add(box(0.6, 0.9, 0.5, flat(0x2f7a4a, 0.7), 1.9, 0.45, -3.0));        // bin
  g.add(box(0.1, 3.2, 0.1, flat(0x6a6e78, 0.5), 2.45, 1.6, -3.3));         // drain pipe
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.4), new THREE.MeshBasicMaterial({ map: labelTex(['LỐI SAU'], { bg: '#d9342b', fg: '#ffffff', border: false }) }));
  sign.position.set(0.6, 2.65, -3.48); g.add(sign);
  return g;
}
