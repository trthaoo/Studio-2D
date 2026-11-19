// The view: the finished frame through the cut camera (or a free view), with one tool at a time:
// Chọn (pick; clicking hair/face/clothes opens that part), Di chuyển, Xoay, Tạo dáng (joint dots), Camera.
import * as THREE from 'three';
import { Runtime, Part } from '../runtime';
import { S, on, emit, select, selObj, edit, beginGesture, endGesture, changed, checkpoint, setTime, toast } from '../state';
import { applyValue, valueAt, activeCut, JOINTS, JOINT_VI, Joint, Vec3, SceneObject } from '../doc';
import { audioPlay, audioPause, audioSync } from './audio';
import { h } from './dom';
import { setQuality, QUALITY, RW, RH } from 'engine/core.js';
import * as perf from '../perf';

export const rt = new Runtime();
const cv = document.getElementById('view') as HTMLCanvasElement;
const ctx = cv.getContext('2d')!;
const wrap = document.getElementById('viewwrap')!;
const msg = document.getElementById('viewmsg')!;
let need = true;
export const redraw = () => { need = true; };

// ---------------------------------------------------------------- tools
export type Tool = typeof S.tool;
const TOOLS: Array<{ id: Tool; label: string; key: string; hint: string }> = [
  { id: 'select', label: 'Chọn', key: 'Q', hint: 'Bấm vào thứ cần sửa. Bấm vào tóc, mặt hay áo của nhân vật là mở đúng phần đó ở bảng bên phải.' },
  { id: 'move', label: 'Di chuyển', key: 'W', hint: 'Kéo vật hoặc nhân vật để dời trên sàn. Giữ Shift khi kéo để nâng lên hoặc hạ xuống.' },
  { id: 'rotate', label: 'Xoay', key: 'E', hint: 'Kéo sang trái hoặc phải để xoay hướng nhân vật, đồ vật.' },
  { id: 'pose', label: 'Tạo dáng', key: 'R', hint: 'Chọn nhân vật, rồi kéo các chấm tròn ở tay, chân, hông, cổ để chỉnh dáng.' },
];
const CAM_HINT = 'Kéo để xoay camera quanh điểm nhìn. Kéo chuột phải hoặc Shift + kéo để dịch khung. Lăn chuột để tiến, lùi.';
export function setTool(t: Tool) { S.tool = t; if (S.ws !== 'scene') { S.ws = 'scene'; emit('ws'); } toolbar(); redraw(); }
const tbar = h('div', { class: 'vtools' }), hint = h('div', { class: 'vhint' }), modeBadge = h('div', { class: 'vmode' });
wrap.append(tbar, hint, modeBadge);
/** In the Camera workspace the view looks through the camera being edited (picked, or the one cut to at the playhead). */
export function viewedCam(): SceneObject | null {
  const sel = selObj(); if (sel?.kind === 'camera') return sel;
  const c = activeCut(S.doc, S.t).cur; return c ? S.doc.objects.find((o) => o.id === c.camera) || null : null;
}
function toolbar() {
  if (S.ws === 'camera') {
    const cams = S.doc.objects.filter((o) => o.kind === 'camera'), cur = viewedCam();
    tbar.replaceChildren(h('span', { class: 'vlabel' }, 'Nhìn qua'), ...cams.map((c) => h('button', { class: 'vtool' + (cur?.id === c.id ? ' on' : ''), onclick: () => select(c.id) }, c.name)));
    hint.textContent = CAM_HINT;
  } else {
    tbar.replaceChildren(...TOOLS.map((t) => h('button', { class: 'vtool' + (S.tool === t.id ? ' on' : ''), title: `${t.label} (phím ${t.key})`, onclick: () => setTool(t.id) }, t.label, h('span', { class: 'kbd' }, t.key))));
    hint.textContent = (S.view === 'free' ? 'Đang nhìn tự do, không phải khung video. ' : '') + TOOLS.find((t) => t.id === S.tool)!.hint;
  }
  modeBadge.className = 'vmode ' + S.apply;
  modeBadge.textContent = S.apply === 'all' ? 'Sửa cho cả video' : 'Sửa từ playhead (keyframe)';
  rt.forceCam = S.ws === 'camera' ? viewedCam()?.id || null : null;
  redraw();
}
on('select', toolbar); on('doc', toolbar); on('ws', toolbar); let lastViewed: string | null = null;   // in the Camera workspace, rebuild the bar only when the cut camera changes
on('time', () => { if (S.ws === 'camera' && selObj()?.kind !== 'camera') { const id = viewedCam()?.id || null; if (id !== lastViewed) { lastViewed = id; toolbar(); } } });
export const refreshToolbar = toolbar;

// free view camera (orbit)
const free = { cam: new THREE.PerspectiveCamera(45, 9 / 16, 0.05, 2500), target: new THREE.Vector3(0, 1, 0), yaw: 0.6, pitch: 0.25, dist: 7 };
function placeFree() {
  const { target: t, yaw, pitch, dist } = free;
  free.cam.position.set(t.x + Math.sin(yaw) * Math.cos(pitch) * dist, t.y + Math.sin(pitch) * dist, t.z + Math.cos(yaw) * Math.cos(pitch) * dist);
  free.cam.lookAt(t); free.cam.updateMatrixWorld(true);
}
export function setView(v: 'camera' | 'free') {
  S.view = v;
  if (v === 'free') {
    const sel = selObj(); const cut = activeCut(S.doc, S.t).cur; const cam = cut && S.doc.objects.find((o) => o.id === cut.camera);
    rt.freeStage = sel?.stage || cam?.stage || S.doc.stages[0]?.id || null;
    if (cam) { const p = valueAt(cam, 'pos', S.t) as Vec3, tg = valueAt(cam, 'target', S.t) as Vec3; free.target.set(...tg); const d = new THREE.Vector3(...p).sub(free.target); free.dist = Math.max(1, d.length() * 1.6); free.yaw = Math.atan2(d.x, d.z); free.pitch = Math.max(0.05, Math.asin(d.y / d.length())); }
    placeFree(); rt.freeCam = free.cam;
  } else rt.freeCam = null;
  emit('play'); toolbar(); redraw();
}

// ---------------------------------------------------------------- layout: fit 9:16 in the area
let scale = 1, ox = 0, oy = 0;
function layout() {
  const r = wrap.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  cv.style.width = '100%'; cv.style.height = '100%';
  const fw = S.doc.width, fh = S.doc.height;
  const top = 44 * dpr, bottom = 30 * dpr;   // room for the tool bar and the hint line
  scale = Math.min(cv.width / fw, (cv.height - top - bottom) / fh) * 0.98; ox = (cv.width - fw * scale) / 2; oy = top + (cv.height - top - bottom - fh * scale) / 2;
  redraw();
}
new ResizeObserver(layout).observe(wrap);
on('ws', () => requestAnimationFrame(layout));

// ---------------------------------------------------------------- preview quality
// The view is much smaller than 1080x1920, so it renders only as many pixels as it shows. While something moves
// (playing, scrubbing, dragging) the quality adapts to the machine: when frames come too slowly it steps down
// (fewer pixels, less anti-aliasing, fewer shadow and blur samples), when there is room it steps back up. When
// everything stops, the still frame is drawn again sharp. Renders and snapshots are always full quality.
type QMode = 'auto' | 'high' | 'mid' | 'low';
const LEVELS = [   // k: share of the view's own resolution
  { k: 1.0, msaa: 4, ao: 12, dof: 48, shadow: 2048 },
  { k: 0.85, msaa: 4, ao: 12, dof: 32, shadow: 2048 },
  { k: 0.72, msaa: 2, ao: 0, dof: 20, shadow: 2048 },   // fewer contact-shadow samples look grainy: off instead
  { k: 0.6, msaa: 0, ao: 0, dof: 12, shadow: 1024 },
  { k: 0.48, msaa: 0, ao: 0, dof: 8, shadow: 1024 },
];
const Q_VI: Record<QMode, string> = { auto: 'Tự động', high: 'Cao', mid: 'Vừa', low: 'Thấp' };
const FIXED: Record<Exclude<QMode, 'auto'>, number> = { high: 0, mid: 2, low: 4 };
let qMode: QMode = (() => { try { const v = localStorage.getItem('2ds.quality') as QMode; return v in Q_VI ? v : 'auto'; } catch { return 'auto'; } })();
let level = 1;                 // the auto level while things move (starts one step down; climbs if the machine allows)
let holdUp = 0;                // no stepping up before this time (after a step up that was too slow)
let win: number[] = [], winStart = 0, goodWins = 0, lastStep = 0;
let fps = 0, fpsN = 0, fpsT = 0;
let lastDraw = 0, drewStill = true, vsync = 16.7;
/** Resolution of the frame as shown (device pixels): never render more than this. */
const baseScale = () => Math.min(1, Math.max(0.25, (S.doc.height * scale) / 1920 * 1.1));
function useLevel(i: number) { const L = LEVELS[i]; setQuality({ scale: baseScale() * L.k, msaa: L.msaa, ao: L.ao, dof: L.dof, shadow: L.shadow }); }
/** Frame times while moving: step the level up or down once a second. */
function measure(ts: number, interval: number) {
  if (qMode !== 'auto') return;
  if (!winStart) winStart = ts;
  win.push(interval);
  if (ts - winStart < 1000 || win.length < 12) return;
  const s = [...win].sort((a, b) => a - b), med = s[s.length >> 1], p90 = s[Math.floor(s.length * 0.9)];
  win = []; winStart = ts;
  const target = Math.max(vsync, 1000 / 60) * 1.3;   // ~45 frames a second or better
  if ((med > target || p90 > target * 1.8) && level < LEVELS.length - 1) {
    if (ts - lastStep < 3000) holdUp = ts + 15000;    // just stepped up and it was too much: stay down a while
    level++; lastStep = ts; goodWins = 0; useLevel(level);
  } else if (med < Math.max(vsync, 1000 / 60) * 1.08 && level > 0 && ts > holdUp) {
    if (++goodWins >= 3) { level--; lastStep = ts; goodWins = 0; useLevel(level); }
  } else goodWins = 0;
}
export function perfInfo() { return { mode: qMode, level, fps: Math.round(fps), scale: +QUALITY.scale.toFixed(2), size: [RW, RH], msaa: QUALITY.msaa, ao: QUALITY.ao, shadow: QUALITY.shadow }; }
const perfSel = h('select', { class: 'vperf-sel', title: 'Chất lượng xem trước. Chỉ ảnh hưởng khung xem trong studio, video xuất ra luôn ở chất lượng đầy đủ.' },
  ...(Object.keys(Q_VI) as QMode[]).map((m) => h('option', { value: m, selected: m === qMode }, 'Xem trước: ' + Q_VI[m]))) as HTMLSelectElement;
const perfFps = h('span', { class: 'vperf-fps' });
perfSel.onchange = () => { qMode = perfSel.value as QMode; perf.event('mode', 'Xem trước: ' + Q_VI[qMode]); try { localStorage.setItem('2ds.quality', qMode); } catch { /* private window */ } level = qMode === 'auto' ? 1 : FIXED[qMode]; holdUp = 0; drewStill = false; redraw(); };
wrap.append(h('div', { class: 'vperf' }, perfSel, perfFps));
perf.event('mode', 'Xem trước: ' + Q_VI[qMode]);

// ---------------------------------------------------------------- drawing
let lastTs = 0;
function loop(ts: number) {
  requestAnimationFrame(loop);
  const interval = lastTs ? ts - lastTs : 0, dt = Math.min(0.1, interval / 1000); lastTs = ts;
  if (S.playing) {
    let t = S.t + dt; if (t >= S.doc.duration) { t = 0; audioSync(0, true); }
    S.t = t; emit('time'); audioSync(t); need = true;
  }
  const moving = S.playing || !!drag || ts - lastDraw < 130;   // frames asked for one after another
  if (!need && !moving && !drewStill && ts - lastDraw > 220) need = true;   // things stopped: draw the still frame sharp
  if (!need || !rt.doc) {
    // an idle frame tells how fast the screen refreshes (60, 120, 144 Hz)
    if (interval > 3 && interval < 40) vsync = vsync * 0.95 + interval * 0.05;
    return;
  }
  need = false;
  const still = qMode === 'auto' ? !moving : true, usedLevel = qMode === 'auto' ? (still ? 0 : level) : FIXED[qMode];
  useLevel(usedLevel);
  if (moving && lastDraw && ts - lastDraw < 250) measure(ts, ts - lastDraw);
  if (!moving) { fpsN = 0; fpsT = ts; perfFps.textContent = ''; }
  else if (++fpsN && ts - fpsT > 500) { fps = (fpsN - 1) * 1000 / (ts - fpsT); fpsN = 1; fpsT = ts; perfFps.textContent = `${Math.round(fps)} khung/giây`; }
  const since = lastDraw ? ts - lastDraw : 0;
  lastDraw = ts; drewStill = still;
  const c0 = performance.now();
  try {
    rt.draw(S.t, { captions: true });
    msg.textContent = rt.errors.length ? 'Lỗi: ' + rt.errors.join(' · ') : '';
  } catch (e: any) { console.error(e); msg.textContent = 'Lỗi: ' + e.message; }
  ctx.fillStyle = '#16181d'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(rt.frame, ox, oy, S.doc.width * scale, S.doc.height * scale);
  ctx.strokeStyle = S.view === 'free' ? '#4fa3ff' : '#2a2e36'; ctx.lineWidth = S.view === 'free' ? 2 : 1; ctx.strokeRect(ox - 0.5, oy - 0.5, S.doc.width * scale + 1, S.doc.height * scale + 1);
  ctx.save(); ctx.beginPath(); ctx.rect(ox - 12, oy - 12, S.doc.width * scale + 24, S.doc.height * scale + 24); ctx.clip();
  overlays();
  ctx.restore();
  perf.frame({ interval: moving && since < 1000 ? since : 0, cpu: performance.now() - c0, moving, playing: S.playing, level: usedLevel, w: RW, h: RH, vsync });
}
requestAnimationFrame(loop);
on('time', redraw); on('doc', () => { rt.sync(S.doc); layout(); }); on('select', redraw);
on('play', () => { if (S.playing) audioPlay(S.t); else audioPause(); });

const toCv = (x: number, y: number) => [ox + x * scale, oy + y * scale];
function project(p: THREE.Vector3): [number, number, boolean] | null {
  const cam = rt.camera; if (!cam) return null;
  const v = p.clone().project(cam); const behind = v.z > 1;
  const [x, y] = toCv((v.x + 1) / 2 * S.doc.width, (1 - v.y) / 2 * S.doc.height);
  return [x, y, behind];
}

interface Handle { j: Joint; x: number; y: number; world: THREE.Vector3 }
let handles: Handle[] = [], hover: Joint | null = null;
function overlays() {
  handles = [];
  const o = selObj(); if (!o || o.kind === 'camera') return;
  const dpr = window.devicePixelRatio || 1;
  const b = rt.builtOf(o.id); if (!b || !b.root.visible) return;
  if (rt.lastStage && b.obj.stage !== rt.lastStage.def.id) return;
  if (o.kind !== 'set') {
    const box = new THREE.Box3().setFromObject(b.root, true);
    if (!box.isEmpty()) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, ok = false;
      for (let i = 0; i < 8; i++) {
        const c = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
        const p = project(c); if (!p || p[2]) continue; ok = true;
        x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
      }
      if (ok) {
        ctx.save(); ctx.setLineDash([6 * dpr, 4 * dpr]); ctx.strokeStyle = '#ffb02e'; ctx.lineWidth = 1.5 * dpr; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
        ctx.setLineDash([]); ctx.font = `600 ${12 * dpr}px system-ui`; const label = o.name + (o.kind === 'char' ? ` › ${TAB_NAME[S.tab] || ''}` : '');
        const tw = ctx.measureText(label).width; ctx.fillStyle = '#ffb02e'; ctx.fillRect(x0, y0 - 18 * dpr, tw + 10 * dpr, 17 * dpr); ctx.fillStyle = '#1a1206'; ctx.fillText(label, x0 + 5 * dpr, y0 - 5 * dpr); ctx.restore();
      }
    }
  }
  if (o.kind === 'char' && S.tool === 'pose' && b.pose) {
    const P = b.pose as any;
    const sp: Record<string, [number, number]> = {};
    for (const j of JOINTS) { const w = b.root.localToWorld(P[j].clone()); const p = project(w); if (!p || p[2]) continue; sp[j] = [p[0], p[1]]; handles.push({ j, x: p[0], y: p[1], world: w }); }
    ctx.save(); ctx.strokeStyle = 'rgba(80,200,255,0.75)'; ctx.lineWidth = 2 * dpr;
    for (const [a, c] of [['hip', 'neck'], ['neck', 'elbowL'], ['elbowL', 'handL'], ['neck', 'elbowR'], ['elbowR', 'handR'], ['hip', 'kneeL'], ['kneeL', 'footL'], ['hip', 'kneeR'], ['kneeR', 'footR']]) {
      if (!sp[a] || !sp[c]) continue; ctx.beginPath(); ctx.moveTo(...sp[a]); ctx.lineTo(...sp[c]); ctx.stroke();
    }
    for (const hd of handles) {
      const hasKey = (o.tracks['j.' + hd.j] || []).length > 0, r = (hd.j === 'hip' || hd.j === 'neck' ? 9 : 7) * dpr, active = drag?.joint === hd.j || hover === hd.j;
      ctx.beginPath(); ctx.arc(hd.x, hd.y, active ? r * 1.25 : r, 0, 7); ctx.fillStyle = active ? '#ffb02e' : hasKey ? '#4fd1ff' : '#ffffff'; ctx.fill();
      ctx.strokeStyle = '#0b2533'; ctx.lineWidth = 2 * dpr; ctx.stroke();
    }
    if (hover || drag?.joint) { const j = (drag?.joint || hover)!, hd = handles.find((q) => q.j === j); if (hd) { ctx.font = `600 ${12 * dpr}px system-ui`; const s = JOINT_VI[j], tw = ctx.measureText(s).width; ctx.fillStyle = 'rgba(10,12,16,0.85)'; ctx.fillRect(hd.x + 12 * dpr, hd.y - 10 * dpr, tw + 10 * dpr, 20 * dpr); ctx.fillStyle = '#fff'; ctx.fillText(s, hd.x + 17 * dpr, hd.y + 4 * dpr); } }
    ctx.restore();
  }
}
export const TAB_NAME: Record<string, string> = { pos: 'Vị trí', pose: 'Dáng & tay', face: 'Mặt', hair: 'Tóc', clothes: 'Quần áo', acc: 'Phụ kiện' };

// ---------------------------------------------------------------- input
interface Drag { kind: 'move' | 'rotate' | 'joint' | 'orbit' | 'pan' | 'camOrbit' | 'camPan'; x: number; y: number; joint?: Joint; obj?: SceneObject; plane?: THREE.Plane; start?: THREE.Vector3; startPos?: Vec3; startOff?: Vec3; startRot?: number; vertical?: boolean; cam?: SceneObject; camPos?: Vec3; camTg?: Vec3; root?: THREE.Object3D }
let drag: Drag | null = null;

function ndc(e: PointerEvent | WheelEvent | MouseEvent) {
  const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const x = ((e.clientX - r.left) * dpr - ox) / (S.doc.width * scale), y = ((e.clientY - r.top) * dpr - oy) / (S.doc.height * scale);
  return { nx: x * 2 - 1, ny: 1 - y * 2, cx: (e.clientX - r.left) * dpr, cy: (e.clientY - r.top) * dpr };
}
function rayAt(nx: number, ny: number) { const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(nx, ny), rt.camera!); return ray.ray; }
function activeCam() { if (S.ws === 'camera') return viewedCam(); const c = activeCut(S.doc, S.t).cur; return c ? S.doc.objects.find((o) => o.id === c.camera) || null : null; }
const PART_TAB: Record<Part, string> = { hair: 'hair', face: 'face', clothes: 'clothes', pose: 'pose' };
const set = (o: SceneObject, key: string, v: any) => applyValue(o, key, S.t, v, S.apply);

cv.addEventListener('contextmenu', (e) => e.preventDefault());
cv.addEventListener('pointerdown', (e) => {
  if (S.playing) { S.playing = false; emit('play'); }
  const { nx, ny, cx, cy } = ndc(e); cv.setPointerCapture(e.pointerId);
  const camTool = S.ws === 'camera';
  // looking around in the free view: right / middle drag always, left drag with the camera tool
  if (S.view === 'free' && (e.button === 2 || e.button === 1 || (camTool && e.button === 0))) { drag = { kind: e.button === 1 || e.shiftKey || (camTool && e.button === 2) ? 'pan' : 'orbit', x: e.clientX, y: e.clientY }; return; }
  // moving the video camera
  if (S.view === 'camera' && (camTool || e.altKey)) {
    const cam = activeCam(); if (!cam) return;
    beginGesture(); checkpoint(); if (S.sel !== cam.id) select(cam.id);
    drag = { kind: e.button === 0 && !e.shiftKey ? 'camOrbit' : 'camPan', x: e.clientX, y: e.clientY, cam, camPos: valueAt(cam, 'pos', S.t), camTg: valueAt(cam, 'target', S.t) };
    return;
  }
  if (e.button !== 0 || !rt.camera) return;
  const dpr = window.devicePixelRatio || 1;
  // a joint dot (Tạo dáng)
  const hd = S.tool === 'pose' ? handles.find((q) => Math.hypot(q.x - cx, q.y - cy) < 14 * dpr) : null;
  const o = selObj();
  if (hd && o) {
    const n = rt.camera.getWorldDirection(new THREE.Vector3());
    beginGesture(); checkpoint();
    drag = { kind: 'joint', x: e.clientX, y: e.clientY, joint: hd.j, obj: o, plane: new THREE.Plane().setFromNormalAndCoplanarPoint(n, hd.world), start: hd.world.clone(), startOff: valueAt(o, 'j.' + hd.j, S.t), root: rt.builtOf(o.id)!.root };
    redraw(); return;
  }
  const hit = rt.pickHit(nx, ny), id = hit?.id ?? null;
  if (id !== S.sel) select(id);
  const p = selObj();
  if (p?.kind === 'char' && hit?.part && S.tool === 'select') { S.tab = PART_TAB[hit.part]; emit('select'); }
  if (!p || p.locked || p.kind === 'camera' || !hit) return;
  const b = rt.builtOf(p.id); if (!b) return;
  if (S.tool === 'move') {
    const wp = hit.point, camDir = rt.camera.getWorldDirection(new THREE.Vector3()), vertical = e.shiftKey;
    const plane = vertical ? new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(camDir.x, 0, camDir.z).normalize(), wp) : new THREE.Plane(new THREE.Vector3(0, 1, 0), -wp.y);
    const start = rayAt(nx, ny).intersectPlane(plane, new THREE.Vector3()); if (!start) return;
    beginGesture(); checkpoint();
    drag = { kind: 'move', x: e.clientX, y: e.clientY, obj: p, plane, start, startPos: valueAt(p, 'pos', S.t), vertical, root: b.root };
  } else if (S.tool === 'rotate' && p.kind !== 'set') {
    beginGesture(); checkpoint();
    drag = { kind: 'rotate', x: e.clientX, y: e.clientY, obj: p, startRot: valueAt(p, 'rotY', S.t) };
  } else if (S.tool === 'pose' && p.kind !== 'char') toast('Tạo dáng chỉ dùng cho nhân vật');
});

cv.addEventListener('pointermove', (e) => {
  if (!drag) {   // hover on joint dots
    if (S.tool === 'pose' && handles.length) { const { cx, cy } = ndc(e), dpr = window.devicePixelRatio || 1; const hd = handles.find((q) => Math.hypot(q.x - cx, q.y - cy) < 14 * dpr); const j = hd?.j || null; if (j !== hover) { hover = j; cv.style.cursor = j ? 'grab' : ''; redraw(); } }
    return;
  }
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (drag.kind === 'orbit') { free.yaw -= dx * 0.008; free.pitch = Math.max(-1.4, Math.min(1.45, free.pitch + dy * 0.008)); drag.x = e.clientX; drag.y = e.clientY; placeFree(); redraw(); return; }
  if (drag.kind === 'pan') {
    const k = free.dist * 0.0018, r = new THREE.Vector3().setFromMatrixColumn(free.cam.matrixWorld, 0), u = new THREE.Vector3().setFromMatrixColumn(free.cam.matrixWorld, 1);
    free.target.addScaledVector(r, -dx * k).addScaledVector(u, dy * k); drag.x = e.clientX; drag.y = e.clientY; placeFree(); redraw(); return;
  }
  if (drag.kind === 'rotate') { const o = drag.obj!; let r = drag.startRot! + dx * 0.6; r = ((r + 180) % 360 + 360) % 360 - 180; set(o, 'rotY', Math.round(r)); changed(); return; }
  const { nx, ny } = ndc(e);
  if (drag.kind === 'camOrbit' || drag.kind === 'camPan') {
    const cam = drag.cam!, p0 = new THREE.Vector3(...drag.camPos!), t0 = new THREE.Vector3(...drag.camTg!);
    let p = p0.clone(), tg = t0.clone();
    if (drag.kind === 'camOrbit') {
      const off = p0.clone().sub(t0), sph = new THREE.Spherical().setFromVector3(off);
      sph.theta -= dx * 0.005; sph.phi = Math.max(0.05, Math.min(3.09, sph.phi - dy * 0.005));
      p = t0.clone().add(new THREE.Vector3().setFromSpherical(sph));
    } else {
      const c = rt.camera!; const r = new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 0), u = new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 1), k = p0.distanceTo(t0) * 0.0015;
      const d = r.multiplyScalar(-dx * k).add(u.multiplyScalar(dy * k)); p.add(d); tg.add(d);
    }
    set(cam, 'pos', p.toArray().map((v) => +v.toFixed(3)) as Vec3); set(cam, 'target', tg.toArray().map((v) => +v.toFixed(3)) as Vec3);
    changed(); return;
  }
  const hit = rayAt(nx, ny).intersectPlane(drag.plane!, new THREE.Vector3()); if (!hit) return;
  const o = drag.obj!;
  if (drag.kind === 'move') {
    const parent = drag.root!.parent!;
    const a = parent.worldToLocal(drag.start!.clone()), c = parent.worldToLocal(hit.clone()), d = c.sub(a), sp = drag.startPos!;
    const v: Vec3 = drag.vertical ? [sp[0], +(sp[1] + d.y).toFixed(3), sp[2]] : [+(sp[0] + d.x).toFixed(3), sp[1], +(sp[2] + d.z).toFixed(3)];
    set(o, 'pos', v); changed();
  } else if (drag.kind === 'joint') {
    const root = drag.root!; const a = root.worldToLocal(drag.start!.clone()), c = root.worldToLocal(hit.clone()), d = c.sub(a), so = drag.startOff!;
    set(o, 'j.' + drag.joint, [+(so[0] + d.x).toFixed(3), +(so[1] + d.y).toFixed(3), +(so[2] + d.z).toFixed(3)]);
    changed();
  }
});
const endDrag = () => { if (drag && drag.kind !== 'orbit' && drag.kind !== 'pan') endGesture(); drag = null; redraw(); };
cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);

cv.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (S.view === 'free') { free.dist = Math.max(0.5, Math.min(400, free.dist * Math.exp(e.deltaY * 0.0012))); placeFree(); redraw(); return; }
  if (S.ws === 'camera' || e.altKey) {   // dolly the video camera toward its target
    const cam = activeCam(); if (!cam) return;
    const p = new THREE.Vector3(...(valueAt(cam, 'pos', S.t) as Vec3)), tg = new THREE.Vector3(...(valueAt(cam, 'target', S.t) as Vec3));
    const np = tg.clone().add(p.sub(tg).multiplyScalar(Math.exp(e.deltaY * 0.001)));
    edit(() => set(cam, 'pos', np.toArray().map((v) => +v.toFixed(3)) as Vec3));
  }
}, { passive: false });

window.addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).closest?.('input,textarea,select,[contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  const t = TOOLS.find((q) => q.key.toLowerCase() === k); if (t) { setTool(t.id); return; }
  if (k === 't') { S.ws = 'camera'; emit('ws'); return; }
  if (k === 'f') {
    const o = selObj(); if (!o || S.view !== 'free') return;
    const b = rt.builtOf(o.id); if (!b) return;
    const box = new THREE.Box3().setFromObject(b.root, true); free.target.copy(box.getCenter(new THREE.Vector3())); free.dist = Math.max(1.2, box.getSize(new THREE.Vector3()).length() * 1.6); placeFree(); redraw();
  }
});

export function framePoint() {
  const cam = activeCam(); if (!cam) return [0, 0, 0] as Vec3;
  const tg = valueAt(cam, 'target', S.t) as Vec3; return [+tg[0].toFixed(2), 0, +tg[2].toFixed(2)] as Vec3;
}
toolbar();
export { toast, setTime };
