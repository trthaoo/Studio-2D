// The scene document: everything in a video is data here, so every object can be edited on the timeline.
// Claude writes this (Projects/<name>/scene.json); the studio reads, edits and renders it. No per-video code.

export type Vec3 = [number, number, number];
export type Value = number | string | boolean | Vec3;
export type Ease = 'auto' | 'linear' | 'smooth' | 'step';
export interface Key { t: number; v: Value; ease?: Ease; d?: number }   // d: how long a "say" line lasts (lip-sync)

export type Kind = 'char' | 'car' | 'prop' | 'set' | 'camera' | 'lamp' | 'fx';

export interface SceneObject {
  id: string;
  name: string;
  kind: Kind;
  stage: string;                 // stage id
  parent?: string;               // another object's id (a driver in a car)
  params: Record<string, any>;   // how it is built (makeChar / buildCar / prop / set options)
  tracks: Record<string, Key[]>; // property -> keyframes
  hidden?: boolean;              // hidden in the studio AND in the video
  locked?: boolean;              // can't be picked in the view
}

export interface Stage { id: string; name: string; mood: 'day' | 'dusk' | 'night' | 'rain'; paint?: Record<string, any>; lightPreset?: string; light?: Record<string, any>; look?: string }
export interface Cut { t: number; camera: string; dissolve?: number }   // dissolve: frames (5..18)
export interface Caption { t: number; text: string }
export interface AudioClip { id: string; file: string; start: number; gain?: number; name?: string; tts?: string }   // tts: id of the character whose line this is (made by Breeze TTS, replaced when made again)

export interface SceneDoc {
  version: 1;
  name: string;
  fps: number;
  width: number;
  height: number;
  duration: number;
  stages: Stage[];
  objects: SceneObject[];
  cuts: Cut[];
  captions: Caption[];
  audio: AudioClip[];
  notes?: string;
  brief?: any;   // what the Kịch bản workspace built it from (idea, script, cast, background, voice)
}

// ------------------------------------------------------------------ properties per kind
export type PropType = 'vec3' | 'number' | 'bool' | 'enum' | 'text';
export interface PropDef { key: string; label: string; type: PropType; def: Value; options?: string[]; step?: number; min?: number; max?: number; group?: string; tip?: string }

export const ARMS = ['down', 'hips', 'wave', 'up', 'point', 'neck', 'phone', 'cross', 'shrug'];
export const ARM_VI: Record<string, string> = { down: 'Buông xuôi', hips: 'Chống hông', wave: 'Vẫy tay', up: 'Giơ lên', point: 'Chỉ', neck: 'Gãi cổ', phone: 'Nghe điện thoại', cross: 'Khoanh tay', shrug: 'Nhún vai' };
export const EXPRS = ['calm', 'smug', 'grit', 'grin', 'jolt', 'shock', 'dazed', 'flat', 'pain', 'innocent', 'stern', 'worried', 'talk'];
export const EXPR_VI: Record<string, string> = { calm: 'Bình thường', smug: 'Tự đắc', grit: 'Nghiến răng', grin: 'Cười toe', jolt: 'Giật mình (nhắm)', shock: 'Sốc (mắt to)', dazed: 'Choáng', flat: 'Vô cảm', pain: 'Đau', innocent: 'Ngây thơ', stern: 'Nghiêm/giận', worried: 'Lo lắng', talk: 'Đang nói' };
export const POSE_VI: Record<string, string> = { stand: 'Đứng', sitOn: 'Ngồi ghế', drive: 'Lái xe' };
export const JOINTS = ['hip', 'neck', 'elbowL', 'handL', 'elbowR', 'handR', 'kneeL', 'footL', 'kneeR', 'footR'] as const;
export type Joint = typeof JOINTS[number];
export const JOINT_VI: Record<string, string> = { hip: 'Hông', neck: 'Cổ / vai', elbowL: 'Khuỷu tay trái', handL: 'Bàn tay trái', elbowR: 'Khuỷu tay phải', handR: 'Bàn tay phải', kneeL: 'Đầu gối trái', footL: 'Bàn chân trái', kneeR: 'Đầu gối phải', footR: 'Bàn chân phải' };

const T: Record<string, PropDef> = {
  pos: { key: 'pos', label: 'Vị trí', type: 'vec3', def: [0, 0, 0], step: 0.05, group: 'Vị trí' },
  rotY: { key: 'rotY', label: 'Hướng quay (°)', type: 'number', def: 0, step: 1, min: -180, max: 180, group: 'Vị trí' },
  scale: { key: 'scale', label: 'Kích thước', type: 'number', def: 1, step: 0.01, min: 0.3, max: 2, group: 'Vị trí' },
  visible: { key: 'visible', label: 'Hiện', type: 'bool', def: true, group: 'Vị trí' },
};
const part = (key: string, label: string, group: string, min: number, max: number, def = 0, step = 0.01, tip = ''): PropDef => ({ key, label, type: 'number', def, min, max, step, group, tip });

export const PROPS: Record<Kind, PropDef[]> = {
  char: [
    T.pos, { ...T.rotY, def: -90, tip: '-90 = nhìn về camera' }, T.scale, T.visible,
    { key: 'pose', label: 'Tư thế', type: 'enum', def: 'stand', options: ['stand', 'sitOn', 'drive'], group: 'Dáng & tay' },
    { key: 'armL', label: 'Tay trái', type: 'enum', def: 'down', options: ARMS, group: 'Dáng & tay' },
    { key: 'armR', label: 'Tay phải', type: 'enum', def: 'down', options: ARMS, group: 'Dáng & tay' },
    { key: 'lean', label: 'Nghiêng người', type: 'number', def: 0, step: 0.01, min: -0.8, max: 0.8, group: 'Dáng & tay' },
    { key: 'walk', label: 'Bước đi (bước/giây)', type: 'number', def: 0, step: 0.1, min: 0, max: 4, group: 'Dáng & tay', tip: '0 = đứng yên. Kéo vị trí cùng lúc để đi thật.' },
    { key: 'seat', label: 'Độ cao ghế', type: 'number', def: 0.35, step: 0.01, min: 0.1, max: 0.8, group: 'Dáng & tay' },
    { key: 'expr', label: 'Biểu cảm', type: 'enum', def: 'calm', options: EXPRS, group: 'Mặt' },
    { key: 'say', label: 'Câu thoại', type: 'text', def: '', group: 'Mặt', tip: 'Miệng nhép theo câu này từ thời điểm của key' },
    { key: 'look', label: 'Hướng mắt nhìn', type: 'vec3', def: [1, 0, 0], step: 0.05, group: 'Mặt' },
    part('face.x', 'Mặt: sang trái/phải', 'Mặt', -0.4, 0.4), part('face.y', 'Mặt: lên/xuống', 'Mặt', -0.4, 0.4),
    part('eye.size', 'Mắt: to/nhỏ', 'Mặt', 0.4, 1.8, 1), part('eye.gap', 'Mắt: khoảng cách', 'Mặt', 0.5, 1.6, 1), part('eye.y', 'Mắt: lên/xuống', 'Mặt', -0.3, 0.3),
    part('brow.y', 'Lông mày: lên/xuống', 'Mặt', -0.2, 0.3), part('mouth.y', 'Miệng: lên/xuống', 'Mặt', -0.3, 0.3), part('mouth.size', 'Miệng: to/nhỏ', 'Mặt', 0.4, 2, 1),
    part('hair.x', 'Tóc: sang trái/phải', 'Tóc', -0.5, 0.5), part('hair.y', 'Tóc: lên/xuống', 'Tóc', -0.5, 0.5), part('hair.size', 'Tóc: to/nhỏ', 'Tóc', 0.6, 1.4, 1),
    part('hair.vol', 'Tóc: độ phồng', 'Tóc', -0.3, 0.4), part('hair.fringe', 'Mái: cao/thấp', 'Tóc', -0.3, 0.3, 0, 0.01, 'Dương = mái cao hơn'), part('hair.side', 'Tóc mai: dài/ngắn', 'Tóc', -0.3, 0.4),
    part('hair.part', 'Ngôi tóc: lệch trái/phải', 'Tóc', -0.6, 0.6),
    part('acc.x', 'Phụ kiện: sang trái/phải', 'Phụ kiện', -0.5, 0.5), part('acc.y', 'Phụ kiện: lên/xuống', 'Phụ kiện', -0.5, 0.5), part('acc.size', 'Phụ kiện: to/nhỏ', 'Phụ kiện', 0.5, 1.6, 1),
    ...JOINTS.map((j): PropDef => ({ key: 'j.' + j, label: JOINT_VI[j], type: 'vec3', def: [0, 0, 0], step: 0.01, group: 'Khớp' })),
  ],
  car: [
    T.pos, T.rotY, T.scale, T.visible,
    { key: 'brake', label: 'Đèn phanh', type: 'bool', def: false, group: 'Xe' },
    { key: 'dive', label: 'Chúi thân xe (°)', type: 'number', def: 0, step: 0.1, min: -8, max: 8, group: 'Xe' },
  ],
  prop: [T.pos, T.rotY, T.scale, T.visible, { key: 'text', label: 'Chữ (| = xuống dòng)', type: 'text', def: '', group: 'Đồ vật' }, { key: 'grow', label: 'Đống tiền: độ cao', type: 'number', def: 1, step: 0.01, min: 0, max: 1, group: 'Đồ vật' }],
  set: [T.pos, T.rotY, T.visible],
  lamp: [T.pos, T.visible, { key: 'intensity', label: 'Độ sáng', type: 'number', def: 30, step: 1, min: 0, max: 120, group: 'Đèn' }],
  fx: [T.pos, T.rotY, T.scale, { ...T.visible, tip: 'Hiệu ứng một lần (nổ, bụi...) bắt đầu lúc chuyển sang Hiện' },
    { key: 'amount', label: 'Cường độ', type: 'number', def: 1, step: 0.01, min: 0, max: 2, group: 'Hiệu ứng', tip: '0 = tắt' },
    { key: 'speed', label: 'Tốc độ', type: 'number', def: 1, step: 0.01, min: 0.1, max: 3, group: 'Hiệu ứng' }],
  camera: [
    { key: 'pos', label: 'Vị trí camera', type: 'vec3', def: [0, 1.4, 5], step: 0.05, group: 'Camera' },
    { key: 'target', label: 'Nhìn vào điểm', type: 'vec3', def: [0, 1.1, 0], step: 0.05, group: 'Camera' },
    { key: 'fov', label: 'Góc rộng (zoom)', type: 'number', def: 45, step: 0.5, min: 15, max: 90, group: 'Camera', tip: 'Nhỏ = zoom gần' },
    { key: 'roll', label: 'Nghiêng khung (°)', type: 'number', def: 0, step: 0.1, min: -20, max: 20, group: 'Camera' },
    { key: 'dof', label: 'Xoá phông', type: 'number', def: 0, step: 0.5, min: 0, max: 24, group: 'Camera' },
  ],
};

export const propDef = (kind: Kind, key: string) => PROPS[kind].find((p) => p.key === key);

// ------------------------------------------------------------------ evaluation
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (u: number) => u * u * (3 - 2 * u);

function lerpV(a: Value, b: Value, u: number): Value {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * u;
  if (Array.isArray(a) && Array.isArray(b)) return [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * u) as Vec3;
  return u < 1 ? a : b;
}
function hermite(keys: Key[], i: number, u: number): Value {
  // Catmull-Rom style tangents (same as the engine's camera track)
  const k0 = keys[i], k1 = keys[i + 1], h = k1.t - k0.t;
  const comp = (d: (k: Key) => number) => {
    const p0 = d(k0), p1 = d(k1);
    const m0 = i > 0 ? (p1 - d(keys[i - 1])) / (k1.t - keys[i - 1].t) : (p1 - p0) / h;
    const m1 = i < keys.length - 2 ? (d(keys[i + 2]) - p0) / (keys[i + 2].t - k0.t) : (p1 - p0) / h;
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * h * m1;
  };
  if (typeof k0.v === 'number' && typeof k1.v === 'number') return comp((k) => k.v as number);
  if (Array.isArray(k0.v) && Array.isArray(k1.v)) return [0, 1, 2].map((c) => comp((k) => (Array.isArray(k.v) ? k.v[c] : 0))) as Vec3;
  return u < 1 ? k0.v : k1.v;
}

/** Value of a track at time t. Strings and booleans hold until the next key. The ease of a key shapes the
 * segment that LEAVES it. */
export function evalKeys(keys: Key[] | undefined, t: number, def: Value): Value {
  if (!keys || !keys.length) return def;
  if (t <= keys[0].t) return keys[0].v;
  const n = keys.length;
  if (t >= keys[n - 1].t) return keys[n - 1].v;
  let i = 0; while (keys[i + 1].t <= t) i++;
  const k0 = keys[i], k1 = keys[i + 1];
  if (typeof k0.v === 'string' || typeof k0.v === 'boolean') return k0.v;
  const u = clamp01((t - k0.t) / (k1.t - k0.t)), e = k0.ease || 'auto';
  if (e === 'step') return k0.v;
  if (e === 'linear') return lerpV(k0.v, k1.v, u);
  if (e === 'smooth') return lerpV(k0.v, k1.v, smooth(u));
  return hermite(keys, i, u);
}

export function valueAt(o: SceneObject, key: string, t: number): any {
  const d = propDef(o.kind, key);
  return evalKeys(o.tracks[key], t, d ? d.def : 0);
}

/** Set a value at time t. A track with 0 or 1 keys (a constant) is changed in place unless `autoKey` is on. */
export function setValue(o: SceneObject, key: string, t: number, v: Value, autoKey: boolean) {
  const keys = (o.tracks[key] ||= []);
  t = Math.round(t * 1000) / 1000;
  if (!autoKey && keys.length <= 1) { if (keys.length) keys[0].v = v; else keys.push({ t: 0, v }); return; }
  const hit = keys.find((k) => Math.abs(k.t - t) < 1 / 120);
  if (hit) hit.v = v; else { keys.push({ t, v }); keys.sort((a, b) => a.t - b.t); }
}

/**
 * The studio's one way to change a property. mode 'key': a keyframe at t (animates). mode 'all': the whole video
 * changes: a constant becomes the new value; an animated number / position keeps its animation and moves by the
 * same amount everywhere; an animated choice / text becomes one value.
 */
export function applyValue(o: SceneObject, key: string, t: number, v: Value, mode: 'all' | 'key') {
  const keys = o.tracks[key] || [];
  if (mode === 'key') {
    // first key on a still property: keep the old value until just before t (0.25 s ease), so it changes FROM here
    if (keys.length <= 1 && t > 0.01) {
      const old = valueAt(o, key, t), held = typeof old === 'string' || typeof old === 'boolean' ? 0 : Math.max(0, t - 0.25);
      o.tracks[key] = [{ t: 0, v: old, ease: 'linear' }];
      if (held > 0) o.tracks[key].push({ t: Math.round(held * 1000) / 1000, v: old, ease: 'smooth' });
    }
    setValue(o, key, t, v, true); return;
  }
  if (keys.length <= 1) { o.tracks[key] = [{ t: 0, v }]; return; }
  const cur = valueAt(o, key, t);
  if (typeof v === 'number' && typeof cur === 'number') { const d = v - cur; for (const k of keys) k.v = +((k.v as number) + d).toFixed(4); return; }
  if (Array.isArray(v) && Array.isArray(cur)) { const d = v.map((x, i) => x - (cur as Vec3)[i]); for (const k of keys) k.v = (k.v as Vec3).map((x, i) => +(x + d[i]).toFixed(4)) as Vec3; return; }
  o.tracks[key] = [{ t: 0, v }];
}
export function isAnimated(o: SceneObject, key: string) { return (o.tracks[key] || []).length > 1; }

export function sortKeys(o: SceneObject) { for (const k of Object.values(o.tracks)) k.sort((a, b) => a.t - b.t); }

// ------------------------------------------------------------------ cuts and words
export function activeCut(doc: SceneDoc, t: number): { cur: Cut | null; prev: Cut | null; blend: number } {
  const cuts = [...doc.cuts].sort((a, b) => a.t - b.t);
  if (!cuts.length) {
    const cam = doc.objects.find((o) => o.kind === 'camera');
    return { cur: cam ? { t: 0, camera: cam.id } : null, prev: null, blend: 1 };
  }
  let i = 0; while (i < cuts.length - 1 && cuts[i + 1].t <= t) i++;
  const cur = cuts[i];
  // a dissolve is centred on its cut
  const nx = cuts[i + 1];
  if (nx && nx.dissolve) { const d = nx.dissolve / 30 / 2; if (t >= nx.t - d) return { cur: nx, prev: cur, blend: smooth(clamp01((t - (nx.t - d)) / (2 * d))) }; }
  if (i > 0 && cur.dissolve) { const d = cur.dissolve / 30 / 2; if (t < cur.t + d) return { cur, prev: cuts[i - 1], blend: smooth(clamp01((t - (cur.t - d)) / (2 * d))) }; }
  return { cur, prev: null, blend: 1 };
}

export interface Word { w: string; s: number; e: number }
/** Words for lip-sync from a "say" track: each key's text spoken from its time at ~3.8 words/s, or spread over `d`. */
export function wordsOf(keys: Key[] | undefined): Word[] {
  const out: Word[] = [];
  for (const k of keys || []) {
    const text = String(k.v || '').trim(); if (!text) continue;
    const ws = text.split(/\s+/), step = k.d ? k.d / ws.length : 1 / 3.8;
    ws.forEach((w, i) => out.push({ w, s: k.t + i * step, e: k.t + i * step + step * 0.85 }));
  }
  return out;
}

// ------------------------------------------------------------------ new things
let seq = 0;
export const newId = (p: string) => `${p}${Date.now().toString(36).slice(-4)}${(seq++).toString(36)}`;

export function emptyDoc(name: string): SceneDoc {
  const stage: Stage = { id: 'stage1', name: 'Stage 1', mood: 'day' };
  const cam: SceneObject = { id: 'cam1', name: 'Camera 1', kind: 'camera', stage: stage.id, params: {}, tracks: { pos: [{ t: 0, v: [0, 1.3, 4.5] }], target: [{ t: 0, v: [0, 1.0, 0] }], fov: [{ t: 0, v: 40 }] } };
  return { version: 1, name, fps: 60, width: 1080, height: 1920, duration: 5, stages: [stage], objects: [cam], cuts: [{ t: 0, camera: cam.id }], captions: [], audio: [] };
}

/** Fill in anything an older or hand-written file left out. */
export function normalize(doc: any): SceneDoc {
  doc.version = 1; doc.fps ||= 30; doc.width ||= 1080; doc.height ||= 1920; doc.duration ||= 5;
  doc.stages ||= [{ id: 'stage1', name: 'Stage 1', mood: 'day' }];
  doc.objects ||= []; doc.cuts ||= []; doc.captions ||= []; doc.audio ||= [];
  for (const o of doc.objects) {
    o.params ||= {}; o.tracks ||= {}; o.stage ||= doc.stages[0].id; o.name ||= o.id;
    for (const [k, keys] of Object.entries(o.tracks)) {
      if (!Array.isArray(keys)) { o.tracks[k] = [{ t: 0, v: keys as Value }]; continue; }   // "pos": [1,0,2] shorthand is a constant
      if (keys.length && typeof keys[0] !== 'object') o.tracks[k] = [{ t: 0, v: keys as unknown as Value }];
      else if (keys.length && Array.isArray(keys[0])) o.tracks[k] = (keys as any[]).map((a) => ({ t: a[0], v: a[1], ...(a[2] ? { ease: a[2] } : {}) }));   // [[t, v, ease?]] shorthand
    }
    sortKeys(o);
  }
  doc.cuts.sort((a: Cut, b: Cut) => a.t - b.t);
  doc.captions.sort((a: Caption, b: Caption) => a.t - b.t);
  return doc as SceneDoc;
}

/** The end of the last key, cut, caption: what the video needs at least. */
export function contentEnd(doc: SceneDoc) {
  let e = 0;
  for (const o of doc.objects) for (const k of Object.values(o.tracks)) for (const q of k) e = Math.max(e, q.t);
  for (const c of doc.cuts) e = Math.max(e, c.t);
  for (const c of doc.captions) e = Math.max(e, c.t);
  return e;
}
