// Camera shots: reusable camera angles, placed relative to a character (and a second one for two-shots and
// over-the-shoulder), with the camera move. Built-in shots follow the skill's setup types (look/setup-types.md):
// head width as a share of the frame, eye-level push-ins of 6-10 % a second, lens blur by shot size. Shots you make
// yourself are saved in Library/cameras, relative to the character, so they fit any character in any video.
import { SceneDoc, SceneObject, Key, valueAt, Vec3 } from './doc';
import { headHeight, hipHeight } from './autobuild';

export type Move = 'none' | 'push' | 'pull' | 'orbit' | 'crane' | 'drop' | 'truck' | 'shake' | 'reveal';
export interface Shot {
  name: string; tip?: string;
  frame: number;      // head width as a share of the frame width (sets the distance); two-shot: the pair's share
  az?: number;        // degrees around the subject from its front (0 = facing it, 90 = its side, 180 = behind)
  h?: number;         // camera height from eye level, in eye heights (-0.7 = knee height, +1 = high above)
  aim?: number;       // look-at height in eye heights (1 = the eyes)
  side?: number;      // subject off centre, in head widths (rule of thirds)
  fov?: number; roll?: number; dof?: number;
  move?: Move; speed?: number;   // push/pull: zoom % a second; orbit: degrees a second; crane: eye heights a second
  two?: 'two' | 'ots'; pov?: boolean;
  follow?: boolean;   // keep the subject framed when it moves
  saved?: string;     // file name in Library/cameras (saved shots)
}
export const MOVE_VI: Record<Move, string> = { none: 'Đứng yên', push: 'Đẩy vào (zoom in)', pull: 'Kéo ra (zoom out)', orbit: 'Xoay quanh', crane: 'Cẩu lên', drop: 'Hạ xuống', truck: 'Trượt ngang', shake: 'Cầm tay (rung nhẹ)', reveal: 'Kéo lùi ra toàn cảnh' };

export const SHOTS: Shot[] = [
  { name: 'Toàn cảnh', tip: 'Thấy cả nơi chốn và mọi người. Đẩy vào chậm.', frame: 0.08, h: 0.1, aim: 0.6, fov: 50, dof: 0, move: 'push', speed: 4 },
  { name: 'Trung cảnh', tip: 'Từ hông trở lên, nói chuyện bình thường.', frame: 0.22, h: 0, aim: 0.88, fov: 40, dof: 10, move: 'push', speed: 6 },
  { name: 'Cận mặt (người nói)', tip: 'Mặt lớn ở giữa khung, đẩy vào 6%/giây như video mẫu.', frame: 0.45, h: 0, aim: 0.95, fov: 34, dof: 12, move: 'push', speed: 6 },
  { name: 'Đặc tả mặt', tip: 'Mặt gần kín khung, cho khoảnh khắc mạnh.', frame: 0.7, h: 0, aim: 1, fov: 30, dof: 16, move: 'push', speed: 3 },
  { name: 'Nghiêng 3/4', tip: 'Lệch 35 độ, mặt vẫn rõ, có chiều sâu.', frame: 0.3, az: 35, h: 0.02, aim: 0.92, side: 0.6, fov: 36, dof: 11, move: 'push', speed: 6 },
  { name: 'Ngang người', tip: 'Thấy dáng nghiêng, hợp lúc đi bộ.', frame: 0.16, az: 90, h: 0, aim: 0.7, fov: 40, dof: 8, move: 'none', follow: true },
  { name: 'Góc thấp', tip: 'Máy ngang đầu gối nhìn lên: nhân vật to lớn, oai.', frame: 0.16, h: -0.7, aim: 0.85, fov: 46, dof: 6, move: 'push', speed: 5 },
  { name: 'Góc cao', tip: 'Nhìn từ trên xuống: nhân vật nhỏ bé, yếu thế.', frame: 0.14, h: 1.1, aim: 0.55, fov: 44, dof: 6, move: 'push', speed: 4 },
  { name: 'Khung nghiêng', tip: 'Nghiêng khung 12 độ: căng thẳng, lạ.', frame: 0.36, az: 15, h: 0, aim: 0.95, fov: 34, roll: 12, dof: 12, move: 'push', speed: 6 },
  { name: 'Sau lưng', tip: 'Từ phía sau nhân vật, thấy thứ nó đang nhìn.', frame: 0.12, az: 160, h: 0.15, aim: 0.8, fov: 44, dof: 0, move: 'push', speed: 4 },
  { name: 'Hai người', tip: 'Hai nhân vật cùng khung, máy chéo 20 độ, không xếp thẳng hàng.', frame: 0.75, az: 20, h: 0.05, aim: 0.85, fov: 40, dof: 6, move: 'push', speed: 5, two: 'two' },
  { name: 'Qua vai', tip: 'Sau vai người nghe, nhìn vào mặt người nói (cần chọn người thứ hai).', frame: 0.38, h: 0.05, aim: 0.95, fov: 34, dof: 10, move: 'push', speed: 4, two: 'ots' },
  { name: 'Góc nhìn nhân vật', tip: 'Máy ở mắt nhân vật, thấy đúng thứ nó thấy.', frame: 0, fov: 60, dof: 0, move: 'shake', pov: true },
  { name: 'Xoay quanh', tip: 'Máy đi vòng quanh nhân vật, kịch tính.', frame: 0.26, az: -25, h: 0.05, aim: 0.88, fov: 38, dof: 8, move: 'orbit', speed: 16 },
  { name: 'Kéo lùi tiết lộ', tip: 'Bắt đầu cận mặt rồi lùi ra toàn cảnh: lộ ra điều bất ngờ xung quanh.', frame: 0.45, h: 0, aim: 0.95, fov: 36, dof: 10, move: 'reveal' },
  { name: 'Cẩu lên', tip: 'Máy bay lên cao dần, hợp cảnh mở đầu hoặc kết.', frame: 0.1, h: -0.3, aim: 0.6, fov: 46, dof: 0, move: 'crane', speed: 0.35 },
  { name: 'Cầm tay', tip: 'Rung nhẹ như quay tay, hợp cảnh hỗn loạn, phóng sự.', frame: 0.28, h: 0, aim: 0.9, fov: 36, dof: 9, move: 'shake' },
  { name: 'Theo bước đi', tip: 'Máy trượt theo nhân vật đang đi, giữ nó trong khung.', frame: 0.16, az: 70, h: 0.02, aim: 0.7, fov: 40, dof: 6, move: 'none', follow: true },
];

const ASPECT = 1080 / 1920, DEG = Math.PI / 180;
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const tanH = (fov: number) => Math.tan((fov * DEG) / 2) * ASPECT;

/** Where a character's head is at t (world), its facing (unit, xz), and its head width. */
export function subjectAt(o: SceneObject, t: number) {
  const p = valueAt(o, 'pos', t) as Vec3, a = (valueAt(o, 'rotY', t) as number) * DEG;
  const sc = valueAt(o, 'scale', t) as any, s = Array.isArray(sc) ? sc[1] || 1 : Number(sc) || 1;
  let eye = headHeight(o.params);
  if (valueAt(o, 'pose', t) === 'sitOn') eye -= hipHeight(o.params) - ((valueAt(o, 'seat', t) as number) + 0.06 * ((o.params.R ?? 0.2) / 0.2));
  return { x: p[0], z: p[2], y0: p[1], eye: p[1] + eye * s, f: [Math.cos(a), -Math.sin(a)] as [number, number], headW: 2 * (o.params.R ?? 0.2) * s * 0.95 };
}
const rot = (v: [number, number], deg: number): [number, number] => { const b = deg * DEG, c = Math.cos(b), s = Math.sin(b); return [v[0] * c + v[1] * s, -v[0] * s + v[1] * c]; };

/** Camera pose for a shot at time t and move progress u (0..1). */
function poseOf(shot: Shot, A: SceneObject, B: SceneObject | null, t: number, u: number, durS: number, camNow?: Vec3) {
  const a = subjectAt(A, t), fov = shot.fov ?? 40, move = shot.move ?? 'none', sp = shot.speed ?? 6;
  let az = shot.az ?? 0, h = shot.h ?? 0, aim = shot.aim ?? 0.9, frame = shot.frame, roll = shot.roll ?? 0, dof = shot.dof ?? 0;
  // the move
  if (move === 'orbit') az += (u - 0.5) * sp * durS;
  if (move === 'crane') h += u * sp * durS;
  if (move === 'drop') h -= u * sp * durS;
  if (move === 'push') frame *= 1 / Math.max(0.4, 1 - (sp / 100) * durS * u);
  if (move === 'pull') frame *= 1 / (1 + (sp / 100) * durS * u);
  if (move === 'reveal') { const e = u * u * (3 - 2 * u); frame = frame * Math.pow(0.08 / frame, e); aim += (0.6 - aim) * e; dof *= 1 - e; }
  const eyeH = a.eye - a.y0 || 1;
  if (shot.pov) {
    const fw: [number, number] = a.f, p: Vec3 = [a.x + fw[0] * 0.15, a.eye + 0.02, a.z + fw[1] * 0.15];
    return { pos: p, target: [a.x + fw[0] * 3, a.eye - 0.1, a.z + fw[1] * 3] as Vec3, fov, roll, dof };
  }
  if (shot.two === 'ots' && B) {   // behind B's shoulder, on A's face
    const b = subjectAt(B, t), vx = b.x - a.x, vz = b.z - a.z, L = Math.hypot(vx, vz) || 1, v: [number, number] = [vx / L, vz / L], side: [number, number] = [-v[1], v[0]];
    const back = 0.35 + b.headW, lat = b.headW * 1.2;
    const pos: Vec3 = [b.x + v[0] * back + side[0] * lat, b.eye + h * eyeH + 0.04, b.z + v[1] * back + side[1] * lat];
    // pull back along the line until A's head is the wanted share of the frame
    const want = a.headW / (frame * 2 * tanH(fov)), dist = Math.hypot(pos[0] - a.x, pos[2] - a.z), k = Math.max(1, want / dist);
    const P: Vec3 = [a.x + (pos[0] - a.x) * k, pos[1], a.z + (pos[2] - a.z) * k];
    return { pos: P, target: [a.x, a.y0 + aim * eyeH, a.z] as Vec3, fov, roll, dof };
  }
  let cx = a.x, cz = a.z, cy = a.eye, base: [number, number] = a.f, dist = a.headW / (frame * 2 * tanH(fov));
  if (shot.two === 'two' && B) {   // the pair: centre between them, camera on the side they face
    const b = subjectAt(B, t), sx = b.x - a.x, sz = b.z - a.z, s = Math.hypot(sx, sz) || 0.01;
    cx = (a.x + b.x) / 2; cz = (a.z + b.z) / 2; cy = (a.eye + b.eye) / 2;
    let n: [number, number] = [-sz / s, sx / s];
    const fs: [number, number] = [a.f[0] + b.f[0], a.f[1] + b.f[1]];
    // the side the scene is filmed from (where the other cameras are: a set is open on that side), else where they face
    const pref = camNow ? n[0] * (camNow[0] - cx) + n[1] * (camNow[2] - cz) : n[0] * fs[0] + n[1] * fs[1];
    if (pref < 0) n = [-n[0], -n[1]];
    base = n; dist = (s + a.headW * 4) / (frame * 2 * tanH(fov));
  }
  const d = rot(base, az), right: [number, number] = [d[1], -d[0]], off = (shot.side ?? 0) * a.headW;
  let pos: Vec3 = [cx + d[0] * dist, cy + h * eyeH, cz + d[1] * dist];
  let target: Vec3 = [cx + right[0] * off, a.y0 + aim * eyeH, cz + right[1] * off];
  if (shot.two === 'two' && B) target[1] = cy - (1 - aim) * eyeH;
  if (move === 'truck') { const m = (u - 0.5) * sp * durS * a.headW; pos = [pos[0] + right[0] * m, pos[1], pos[2] + right[1] * m]; target = [target[0] + right[0] * m, target[1], target[2] + right[1] * m]; }
  return { pos, target, fov, roll, dof };
}
/** Keep the camera inside the set: if a wall is between the subject and the camera, come in front of the wall and
 *  widen the lens so the framing stays about the same. */
function unblock<T extends { pos: Vec3; target: Vec3; fov: number }>(pz: T, from: Vec3, limit?: Limit): T {
  if (!limit) return pz;
  const hit = limit(from, pz.pos); if (hit == null) return pz;
  const D = Math.hypot(pz.pos[0] - from[0], pz.pos[1] - from[1], pz.pos[2] - from[2]), nd = Math.max(0.4, hit - 0.2), k = nd / D;
  const pos = pz.pos.map((v, i) => from[i] + (v - from[i]) * k) as Vec3;
  const fov = Math.min(78, (2 * Math.atan(Math.tan((pz.fov * DEG) / 2) / k)) / DEG);
  return { ...pz, pos, fov: Math.round(fov * 10) / 10 };
}
export type Limit = (from: Vec3, to: Vec3) => number | null;

/** Keyframes for a shot from t0 to t1 (camera tracks pos, target, fov, roll, dof). */
export function shotKeys(shot: Shot, A: SceneObject, B: SceneObject | null, t0: number, t1: number, camNow?: Vec3, limit?: Limit) {
  const dur = Math.max(0.1, t1 - t0), move = shot.move ?? 'none';
  const sample = !!shot.follow || move === 'orbit' || move === 'shake';
  const n = sample ? Math.max(2, Math.ceil(dur / 0.25) + 1) : 2;
  const out: Record<string, Key[]> = { pos: [], target: [], fov: [], roll: [], dof: [] };
  let seed = 9;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
  const ease = move === 'reveal' || move === 'orbit' ? 'smooth' : 'linear';
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), t = t0 + u * dur;
    const ts = shot.follow ? t : t0, sa = subjectAt(A, ts), sb = B && shot.two === 'two' ? subjectAt(B, ts) : null;
    const from: Vec3 = sb ? [(sa.x + sb.x) / 2, (sa.eye + sb.eye) / 2, (sa.z + sb.z) / 2] : [sa.x, sa.eye, sa.z];
    const pz = shot.pov ? poseOf(shot, A, B, ts, u, dur, camNow) : unblock(poseOf(shot, A, B, ts, u, dur, camNow), from, limit);
    if (move === 'shake' && i > 0 && i < n - 1) { const amp = Math.hypot(pz.pos[0] - pz.target[0], pz.pos[2] - pz.target[2]) * 0.006; pz.pos = pz.pos.map((v, k) => v + rnd() * amp * (k === 1 ? 0.6 : 1)) as Vec3; pz.target = pz.target.map((v) => v + rnd() * amp * 1.4) as Vec3; }
    const e = n === 2 ? ease : undefined;
    out.pos.push({ t: r3(t), v: pz.pos.map(r3) as Vec3, ...(e ? { ease: e as any } : {}) });
    out.target.push({ t: r3(t), v: pz.target.map(r3) as Vec3, ...(e ? { ease: e as any } : {}) });
    if (i === 0 || i === n - 1) { out.fov.push({ t: r3(t), v: pz.fov }); out.roll.push({ t: r3(t), v: pz.roll }); out.dof.push({ t: r3(t), v: r3(pz.dof) }); }
  }
  return out;
}

/** Write a shot's keys into a camera between t0 and t1 (replacing what was there in that span). */
export function applyShotKeys(cam: SceneObject, keys: Record<string, Key[]>, t0: number, t1: number) {
  for (const [k, ks] of Object.entries(keys)) {
    const old = (cam.tracks[k] || []).filter((q) => q.t < t0 - 1e-3 || q.t > t1 + 1e-3);
    cam.tracks[k] = [...old, ...ks].sort((a, b) => a.t - b.t);
  }
}

/** The shot a camera makes at t, relative to a character: to save it and reuse it on anyone. */
export function shotFromCamera(cam: SceneObject, A: SceneObject, t: number, name: string, move: Move, speed?: number): Shot {
  const a = subjectAt(A, t), p = valueAt(cam, 'pos', t) as Vec3, tg = valueAt(cam, 'target', t) as Vec3, fov = valueAt(cam, 'fov', t) as number;
  const eyeH = a.eye - a.y0 || 1, dx = p[0] - a.x, dz = p[2] - a.z, dist = Math.hypot(dx, dz) || 1;
  const az = (Math.atan2(-(a.f[0] * dz - a.f[1] * dx), a.f[0] * dx + a.f[1] * dz) / DEG);
  const d = rot(a.f, az), right: [number, number] = [d[1], -d[0]];
  const side = ((tg[0] - a.x) * right[0] + (tg[2] - a.z) * right[1]) / a.headW;
  return { name, frame: r3(a.headW / (dist * 2 * tanH(fov))), az: Math.round(az), h: r3((p[1] - a.eye) / eyeH), aim: r3((tg[1] - a.y0) / eyeH), side: r3(side),
    fov: r3(fov), roll: r3(valueAt(cam, 'roll', t) as number), dof: r3(valueAt(cam, 'dof', t) as number), move, ...(speed != null ? { speed } : {}) };
}

/** Next cut after t (end of the shot by default). */
export function nextCutAfter(doc: SceneDoc, t: number) { const c = doc.cuts.find((q) => q.t > t + 1e-3); return c ? c.t : doc.duration; }
