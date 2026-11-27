// The view: the finished frame through the cut camera (or a free view), with one tool at a time:
// Chọn (pick; clicking hair/face/clothes opens that part), Di chuyển, Xoay, Tạo dáng (joint dots), Camera.
import * as THREE from 'three';
import { Runtime, Part } from '../runtime';
import { S, on, emit, select, selObj, edit, beginGesture, endGesture, changed, checkpoint, setTime, toast } from '../state';
import { applyValue, valueAt, activeCut, JOINTS, JOINT_VI, Joint, Vec3, SceneObject } from '../doc';
import { audioPlay, audioPause, audioSync } from './audio';
import { clipSelected } from './timeline';
import { h, ask, fmtTime } from './dom';
import { captionBox } from 'engine/captions.js';
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
const tbar = h('div', { class: 'vtools' }), hint = h('div', { class: 'vhint' }), modeBadge = h('div', { class: 'vmode' }), stageBar = h('div', { class: 'vstagebar' });
wrap.append(tbar, hint, modeBadge, stageBar);
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
    hint.textContent = S.view === 'free'
      ? 'Toàn cảnh: kéo chuột phải để xoay, Shift hoặc chuột giữa để dịch, lăn để tiến lùi. Bấm vào camera để chọn, kéo nó hoặc chấm điểm nhìn để dời. Bấm khung nhỏ để về khung video.'
      : TOOLS.find((t) => t.id === S.tool)!.hint;
  }
  // the overview: which stage, and fit it
  stageBar.style.display = S.view === 'free' && S.ws !== 'camera' ? '' : 'none';
  if (S.view === 'free') stageBar.replaceChildren(
    h('select', { class: 'vstage', title: 'Cảnh (sân khấu) đang xem', onchange: (e: any) => setFreeStage(e.target.value) }, ...S.doc.stages.map((s) => h('option', { value: s.id, selected: s.id === rt.freeStage }, `${s.name} (${S.doc.objects.filter((o) => o.kind === 'camera' && o.stage === s.id).length} camera)`))),
    h('button', { class: 'vtool', title: 'Nhìn hết cả cảnh', onclick: frameStage }, 'Nhìn hết cảnh'));
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
let seenFree = false;
export function setView(v: 'camera' | 'free') {
  S.view = v;
  if (v === 'free') {
    const sel = selObj(); const cut = activeCut(S.doc, S.t).cur; const cam = cut && S.doc.objects.find((o) => o.id === cut.camera);
    const stage = sel?.stage || cam?.stage || S.doc.stages[0]?.id || null, fresh = stage !== rt.freeStage || !seenFree;
    rt.freeStage = stage; rt.freeCam = free.cam;
    if (fresh) { seenFree = true; requestAnimationFrame(() => { layout(); frameStage(); }); } else placeFree();   // first time on this stage: the whole of it
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
function useLevel(i: number) {
  const L = LEVELS[i], q = { msaa: L.msaa, ao: L.ao, dof: L.dof, shadow: L.shadow };
  if (S.view === 'free') {   // the overview fills the whole area, at most ~1400 px on its long side
    const R = viewRect(), f = Math.min(1, 1400 / Math.max(R.w, R.h)) * L.k;
    setQuality({ ...q, scale: 1, w: R.w * f, h: R.h * f });
  } else setQuality({ ...q, scale: baseScale() * L.k });
}
/** Where the picture is drawn on the canvas (device px): the 9:16 video frame, or the whole area in the overview. */
function viewRect() {
  if (S.view === 'free') { const dpr = window.devicePixelRatio || 1, top = 44 * dpr, bottom = 30 * dpr; return { x: 0, y: top, w: cv.width, h: Math.max(10, cv.height - top - bottom) }; }
  return { x: ox, y: oy, w: S.doc.width * scale, h: S.doc.height * scale };
}
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
  const R = viewRect();
  try {
    if (S.view === 'free') { free.cam.aspect = R.w / R.h; free.cam.updateProjectionMatrix(); drawPip(); }
    rt.draw(S.t, { captions: true });
    msg.textContent = rt.errors.length ? 'Lỗi: ' + rt.errors.join(' · ') : '';
  } catch (e: any) { console.error(e); msg.textContent = 'Lỗi: ' + e.message; }
  ctx.fillStyle = '#16181d'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(rt.frame, R.x, R.y, R.w, R.h);
  ctx.strokeStyle = S.view === 'free' ? '#4fa3ff' : '#2a2e36'; ctx.lineWidth = S.view === 'free' ? 2 : 1; ctx.strokeRect(R.x - 0.5, R.y - 0.5, R.w + 1, R.h + 1);
  ctx.save(); ctx.beginPath(); ctx.rect(R.x - 12, R.y - 12, R.w + 24, R.h + 24); ctx.clip();
  if (S.view === 'free') gizmos();
  overlays();
  ctx.restore();
  if (S.view === 'free') pipOverlay(R);
  perf.frame({ interval: moving && since < 1000 ? since : 0, cpu: performance.now() - c0, moving, playing: S.playing, level: usedLevel, w: RW, h: RH, vsync });
}
requestAnimationFrame(loop);
on('time', redraw); on('doc', () => { rt.sync(S.doc); layout(); }); on('select', redraw);
on('play', () => { if (S.playing) audioPlay(S.t); else audioPause(); });

function project(p: THREE.Vector3): [number, number, boolean] | null {
  const cam = rt.camera; if (!cam) return null;
  const v = p.clone().project(cam); const behind = v.z > 1 || v.z < -1, R = viewRect();
  return [R.x + (v.x + 1) / 2 * R.w, R.y + (1 - v.y) / 2 * R.h, behind];
}

interface Handle { j: Joint; x: number; y: number; world: THREE.Vector3 }
let handles: Handle[] = [], hover: Joint | null = null;
// ---------------------------------------------------------------- captions on the frame
let capHover = -1;
const capsNow = () => S.doc.captions.map((c) => [c.t, c.text] as [number, string]);
/** The caption card under a canvas point (device px), in frame units, or null. */
function capHit(cx: number, cy: number) {
  if (!S.doc.captions.length || !rt.doc || S.view === 'free') return null;
  const b = captionBox(rt.ctx, capsNow(), S.t); if (!b) return null;
  const fx = (cx - ox) / scale, fy = (cy - oy) / scale;
  return fx >= b.x0 && fx <= b.x1 && fy >= b.y0 && fy <= b.y1 ? b : null;
}
async function editCaption(i: number) {
  const c = S.doc.captions[i]; if (!c) return;
  S.selCap = i; S.selCut = -1; emit('select'); redraw();
  const s = await ask(`Phụ đề lúc ${fmtTime(c.t, S.doc.fps)} (để trống = tắt phụ đề từ lúc này)`, c.text);
  if (s != null && s !== c.text) edit(() => { c.text = s; });
}
function captionOutline() {
  if (S.view === 'free') return;
  const b = capHover >= 0 || S.selCap >= 0 ? captionBox(rt.ctx, capsNow(), S.t) : null;
  if (!b || (b.index !== capHover && b.index !== S.selCap)) return;
  const dpr = window.devicePixelRatio || 1;
  ctx.save(); ctx.setLineDash([5 * dpr, 4 * dpr]); ctx.strokeStyle = b.index === S.selCap ? '#ffb02e' : 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.5 * dpr;
  ctx.strokeRect(ox + b.x0 * scale, oy + b.y0 * scale, (b.x1 - b.x0) * scale, (b.y1 - b.y0) * scale);
  if (b.index === capHover) { ctx.setLineDash([]); ctx.font = `600 ${11 * dpr}px system-ui`; ctx.fillStyle = 'rgba(10,12,16,0.85)'; const s = 'Bấm để sửa phụ đề', tw = ctx.measureText(s).width; ctx.fillRect(ox + (b.x0 + b.x1) / 2 * scale - tw / 2 - 5 * dpr, oy + b.y1 * scale + 4 * dpr, tw + 10 * dpr, 17 * dpr); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(s, ox + (b.x0 + b.x1) / 2 * scale, oy + b.y1 * scale + 16 * dpr); }
  ctx.restore();
}

function overlays() {
  handles = [];
  captionOutline();
  const o = selObj(); if (!o || o.kind === 'camera') return;
  const dpr = window.devicePixelRatio || 1;
  const b = rt.builtOf(o.id); if (!b || !b.root.visible) return;
  if (rt.lastStage && b.obj.stage !== rt.lastStage.def.id) return;
  const piece = o.kind === 'set' && S.setPart >= 0 ? rt.partsOf(o.id)[S.setPart] : null;
  if (o.kind !== 'set' || piece) {
    const box = new THREE.Box3().setFromObject(piece ? piece.obj : b.root, true);
    if (!box.isEmpty()) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, ok = false;
      for (let i = 0; i < 8; i++) {
        const c = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
        const p = project(c); if (!p || p[2]) continue; ok = true;
        x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
      }
      if (ok) {
        ctx.save(); ctx.setLineDash([6 * dpr, 4 * dpr]); ctx.strokeStyle = '#ffb02e'; ctx.lineWidth = 1.5 * dpr; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
        ctx.setLineDash([]); ctx.font = `600 ${12 * dpr}px system-ui`; const label = o.name + (o.kind === 'char' ? ` › ${TAB_NAME[S.tab] || ''}` : piece ? ` › ${piece.name}` : '');
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

// ---------------------------------------------------------------- overview (Toàn cảnh): cameras, paths, picture in picture
// The whole stage from outside, as wide as the area: every camera of the stage as a small frustum (blue = the one the
// video cuts to now, orange = selected), its path over the video, where it looks (dot), the paths of characters and
// cars, and in the corner what the video shows at the playhead. Click a camera to select it; drag it (or its dot) to
// move it (Shift: up / down); with "Sửa từ đây" on this makes a keyframe.
interface Giz { id: string; kind: 'cam' | 'target'; x: number; y: number }
let gizHits: Giz[] = [];
const v3 = (a: Vec3) => new THREE.Vector3(a[0], a[1], a[2]);
function gizmos() {
  gizHits = [];
  const stage = rt.freeStage, dpr = window.devicePixelRatio || 1, cur = activeCut(S.doc, S.t).cur?.camera;
  const line = (pts: Array<[number, number, boolean] | null>, color: string, width = 1.5, dash: number[] = []) => {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width * dpr; ctx.setLineDash(dash.map((d) => d * dpr)); ctx.beginPath(); let on = false;
    for (const p of pts) { if (!p || p[2]) { on = false; continue; } if (on) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); on = true; }
    ctx.stroke(); ctx.restore();
  };
  const dur = S.doc.duration, step = Math.max(dur / 160, 1 / 30);
  const pathOf = (o: SceneObject, key: string) => { const ks = o.tracks[key]; if (!ks || ks.length < 2) return null; const pts: Array<[number, number, boolean] | null> = []; for (let t = 0; t <= dur + 1e-6; t += step) pts.push(project(v3(valueAt(o, key, t) as Vec3))); return pts; };
  // characters and cars that move: their path on the floor
  for (const o of S.doc.objects) {
    if (o.stage !== stage || (o.kind !== 'char' && o.kind !== 'car') || o.parent) continue;
    const pts = pathOf(o, 'pos'); if (!pts) continue;
    line(pts, o.id === S.sel ? 'rgba(255,176,46,0.9)' : 'rgba(255,255,255,0.45)', 1.5, [5, 4]);
    const now = project(v3(valueAt(o, 'pos', S.t) as Vec3)); if (now && !now[2]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(now[0], now[1], 3 * dpr, 0, 7); ctx.fill(); }
  }
  for (const c of S.doc.objects) {
    if (c.kind !== 'camera' || c.stage !== stage) continue;
    const sel = c.id === S.sel, live = c.id === cur, col = sel ? '#ffb02e' : live ? '#4fd1ff' : '#c9ced8';
    const p = v3(valueAt(c, 'pos', S.t) as Vec3), tg = v3(valueAt(c, 'target', S.t) as Vec3), fov = (valueAt(c, 'fov', S.t) as number) * Math.PI / 180;
    const path = pathOf(c, 'pos'); if (path) line(path, col, 1.2, [3, 4]);
    // frustum: the 9:16 picture at a fixed distance in front of the lens
    const dir = tg.clone().sub(p).normalize(), right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(right, dir);
    const L = Math.max(0.35, free.dist * 0.07), hh = Math.tan(fov / 2) * L, ww = hh * 9 / 16, far = p.clone().addScaledVector(dir, L);
    const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => project(far.clone().addScaledVector(right, a * ww).addScaledVector(up, b * hh)));
    const P = project(p);
    for (const q of C) line([P, q], col, sel || live ? 1.8 : 1.2);
    line([...C, C[0]], col, sel || live ? 2 : 1.2);
    const top = project(far.clone().addScaledVector(up, hh * 1.35)); if (top && C[2] && C[3] && !top[2]) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(C[2]![0], C[2]![1]); ctx.lineTo(C[3]![0], C[3]![1]); ctx.fill(); }   // which way is up
    if (sel) { const T = project(tg); line([P, T], 'rgba(255,176,46,0.7)', 1, [2, 3]); if (T && !T[2]) { ctx.fillStyle = '#ffb02e'; ctx.beginPath(); ctx.arc(T[0], T[1], 5 * dpr, 0, 7); ctx.fill(); gizHits.push({ id: c.id, kind: 'target', x: T[0], y: T[1] }); } }
    if (P && !P[2]) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(P[0] - 7 * dpr, P[1] - 5 * dpr, 14 * dpr, 10 * dpr, 2 * dpr); ctx.fill(); ctx.strokeStyle = '#0d0f12'; ctx.lineWidth = dpr; ctx.stroke();
      ctx.font = `600 ${11 * dpr}px system-ui`; const s = c.name + (live ? ' · đang quay' : ''), tw = ctx.measureText(s).width;
      ctx.fillStyle = 'rgba(10,12,16,0.8)'; ctx.fillRect(P[0] + 9 * dpr, P[1] - 8 * dpr, tw + 8 * dpr, 16 * dpr); ctx.fillStyle = col; ctx.fillText(s, P[0] + 13 * dpr, P[1] + 4 * dpr);
      gizHits.push({ id: c.id, kind: 'cam', x: P[0], y: P[1] });
    }
  }
}
// picture in picture: the video (or the selected camera) at the playhead, redrawn at most 4 times a second while playing
const pip = document.createElement('canvas'); let pipAt = 0, pipLabel = '';
function drawPip() {
  const now = performance.now(); if (S.playing && now - pipAt < 250) return; pipAt = now;
  const sel = selObj(), camId = sel?.kind === 'camera' ? sel.id : null;
  const keepQ = { ...QUALITY }, keepFree = rt.freeCam, keepForce = rt.forceCam;
  try {
    setQuality({ scale: 0.24, msaa: 0, ao: 0, dof: 8, shadow: QUALITY.shadow });
    rt.freeCam = null; rt.forceCam = camId;
    const f = rt.draw(S.t, { captions: true });
    pip.width = f.width; pip.height = f.height; pip.getContext('2d')!.drawImage(f, 0, 0);
    pipLabel = camId ? `Nhìn qua ${sel!.name}` : 'Khung video lúc này';
  } finally { rt.freeCam = keepFree; rt.forceCam = keepForce; setQuality(keepQ); }
}
let pipRect = { x: 0, y: 0, w: 0, h: 0 };
function pipOverlay(R: { x: number; y: number; w: number; h: number }) {
  if (!pip.width) return;
  const dpr = window.devicePixelRatio || 1, h = Math.min(R.h * 0.42, 300 * dpr), w = h * 9 / 16, x = R.x + R.w - w - 12 * dpr, y = R.y + R.h - h - 12 * dpr;
  pipRect = { x, y, w, h };
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12 * dpr; ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h); ctx.restore();
  ctx.drawImage(pip, x, y, w, h); ctx.strokeStyle = '#4fd1ff'; ctx.lineWidth = 1.5 * dpr; ctx.strokeRect(x, y, w, h);
  ctx.font = `600 ${11 * dpr}px system-ui`; const lw = ctx.measureText(pipLabel).width + 12 * dpr;
  ctx.fillStyle = 'rgba(10,12,16,0.85)'; ctx.fillRect(x + w - lw, y - 18 * dpr, lw, 18 * dpr); ctx.fillStyle = '#cfe9ff'; ctx.fillText(pipLabel, x + w - lw + 6 * dpr, y - 5 * dpr);
}
/** Fit the whole stage (sets, characters, cameras) in the overview. */
export function frameStage() {
  const stage = rt.freeStage; if (!stage) return;
  const box = new THREE.Box3();
  for (const o of S.doc.objects) {
    if (o.stage !== stage) continue;
    if (o.kind === 'camera') { box.expandByPoint(v3(valueAt(o, 'pos', S.t) as Vec3)); continue; }
    const b = rt.builtOf(o.id); if (!b) continue;
    const bb = new THREE.Box3().setFromObject(b.root); if (!bb.isEmpty() && bb.getSize(new THREE.Vector3()).length() < 120) box.union(bb);
  }
  if (box.isEmpty()) box.setFromCenterAndSize(new THREE.Vector3(0, 1, 0), new THREE.Vector3(6, 2, 6));
  const size = box.getSize(new THREE.Vector3()).length();
  free.target.copy(box.getCenter(new THREE.Vector3())); free.dist = Math.max(3, size * 0.95 / Math.tan((free.cam.fov * Math.PI / 180) / 2) * 0.5);
  free.yaw = 0.55; free.pitch = 0.5; placeFree(); redraw();
}
function setFreeStage(id: string) { rt.freeStage = id; frameStage(); toolbar(); }

// ---------------------------------------------------------------- input
interface Drag { kind: 'move' | 'piece' | 'rotate' | 'joint' | 'orbit' | 'pan' | 'camOrbit' | 'camPan' | 'gizmo' | 'gizmoTarget'; x: number; y: number; joint?: Joint; obj?: SceneObject; plane?: THREE.Plane; start?: THREE.Vector3; startPos?: Vec3; startOff?: Vec3; startRot?: number; vertical?: boolean; cam?: SceneObject; camPos?: Vec3; camTg?: Vec3; root?: THREE.Object3D }
let drag: Drag | null = null;

function ndc(e: PointerEvent | WheelEvent | MouseEvent) {
  const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1, R = viewRect();
  const x = ((e.clientX - r.left) * dpr - R.x) / R.w, y = ((e.clientY - r.top) * dpr - R.y) / R.h;
  return { nx: x * 2 - 1, ny: 1 - y * 2, cx: (e.clientX - r.left) * dpr, cy: (e.clientY - r.top) * dpr };
}
function rayAt(nx: number, ny: number) { const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(nx, ny), rt.camera!); return ray.ray; }
function activeCam() { if (S.ws === 'camera') return viewedCam(); const c = activeCut(S.doc, S.t).cur; return c ? S.doc.objects.find((o) => o.id === c.camera) || null : null; }
const PART_TAB: Record<Part, string> = { hair: 'hair', face: 'face', clothes: 'clothes', pose: 'pose' };
const set = (o: SceneObject, key: string, v: any) => applyValue(o, key, S.t, v, S.apply);

cv.addEventListener('contextmenu', (e) => e.preventDefault());
cv.addEventListener('pointerdown', (e) => {
  S.focus = 'view';
  if (S.playing) { S.playing = false; emit('play'); }
  const { nx, ny, cx, cy } = ndc(e); cv.setPointerCapture(e.pointerId);
  const camTool = S.ws === 'camera';
  if (S.view === 'free' && e.button === 0) {
    // the small video picture: back to the video frame
    if (cx >= pipRect.x && cx <= pipRect.x + pipRect.w && cy >= pipRect.y && cy <= pipRect.y + pipRect.h) { setView('camera'); return; }
    // a camera (or the point it looks at) in the overview: select it, drag to move it
    const dpr = window.devicePixelRatio || 1, g = [...gizHits].reverse().find((q) => Math.hypot(q.x - cx, q.y - cy) < 11 * dpr);
    if (g) {
      const cam = S.doc.objects.find((o) => o.id === g.id)!; if (S.sel !== cam.id) select(cam.id);
      const key = g.kind === 'cam' ? 'pos' : 'target', at = v3(valueAt(cam, key, S.t) as Vec3), vertical = e.shiftKey;
      const camDir = rt.camera!.getWorldDirection(new THREE.Vector3());
      const plane = vertical ? new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(camDir.x, 0, camDir.z).normalize(), at) : new THREE.Plane(new THREE.Vector3(0, 1, 0), -at.y);
      const start = rayAt(nx, ny).intersectPlane(plane, new THREE.Vector3()); if (!start) return;
      beginGesture(); checkpoint();
      drag = { kind: g.kind === 'cam' ? 'gizmo' : 'gizmoTarget', x: e.clientX, y: e.clientY, obj: cam, plane, start, startPos: at.toArray() as Vec3, vertical };
      return;
    }
  }
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
  // the caption card on the frame: click to edit its words (it is also selected on the timeline's Phụ đề row)
  const cap = S.tool !== 'pose' ? capHit(cx, cy) : null;
  if (cap) { editCaption(cap.index); return; }
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
  if (p?.kind === 'set') { const np = hit?.piece ?? -1; if (np !== S.setPart) { S.setPart = np; emit('select'); } }   // a piece of the set: shelf, window, wall...
  if (!p || p.locked || p.kind === 'camera' || !hit) return;
  const b = rt.builtOf(p.id); if (!b) return;
  if (S.tool === 'move' && p.kind === 'set' && S.setPart >= 0) {   // drag one piece of the set
    const pc = rt.partsOf(p.id)[S.setPart]; if (!pc) return;
    const wp = hit.point, vertical = e.shiftKey, camDir = rt.camera.getWorldDirection(new THREE.Vector3());
    const plane = vertical ? new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(camDir.x, 0, camDir.z).normalize(), wp) : new THREE.Plane(new THREE.Vector3(0, 1, 0), -wp.y);
    const start = rayAt(nx, ny).intersectPlane(plane, new THREE.Vector3()); if (!start) return;
    beginGesture(); checkpoint();
    const cur = (p.params.parts?.[S.setPart]?.pos || [0, 0, 0]) as Vec3;
    drag = { kind: 'piece', x: e.clientX, y: e.clientY, obj: p, plane, start, startPos: [...cur] as Vec3, vertical, root: pc.obj.parent as any };
  } else if (S.tool === 'move') {
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
  if (!drag) {   // hover on joint dots, or on the caption card
    if (S.tool === 'pose' && handles.length) { const { cx, cy } = ndc(e), dpr = window.devicePixelRatio || 1; const hd = handles.find((q) => Math.hypot(q.x - cx, q.y - cy) < 14 * dpr); const j = hd?.j || null; if (j !== hover) { hover = j; cv.style.cursor = j ? 'grab' : ''; redraw(); } }
    else { const { cx, cy } = ndc(e), c = S.tool !== 'pose' && !(S.view === 'camera' && (S.ws === 'camera' || e.altKey)) ? capHit(cx, cy) : null, on = c ? c.index : -1; if (on !== capHover) { capHover = on; cv.style.cursor = c ? 'text' : ''; redraw(); } }
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
  if (drag.kind === 'gizmo' || drag.kind === 'gizmoTarget') {   // a camera or its look-at point, in the overview
    const d = hit.clone().sub(drag.start!), sp = drag.startPos!;
    const v: Vec3 = drag.vertical ? [sp[0], +(sp[1] + d.y).toFixed(3), sp[2]] : [+(sp[0] + d.x).toFixed(3), sp[1], +(sp[2] + d.z).toFixed(3)];
    set(o, drag.kind === 'gizmo' ? 'pos' : 'target', v); changed();
  } else if (drag.kind === 'piece') {   // offset of a set piece, in the set's own space
    const parent = drag.root!;
    const a = parent.worldToLocal(drag.start!.clone()), c = parent.worldToLocal(hit.clone()), d = c.sub(a), sp = drag.startPos!;
    const v: Vec3 = drag.vertical ? [sp[0], +(sp[1] + d.y).toFixed(3), sp[2]] : [+(sp[0] + d.x).toFixed(3), sp[1], +(sp[2] + d.z).toFixed(3)];
    const parts = (o.params.parts ||= {}); parts[S.setPart] = { ...(parts[S.setPart] || {}), pos: v }; changed();
  } else if (drag.kind === 'move') {
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
  if ((k === 'q' || k === 'w') && S.focus === 'timeline' && clipSelected()) return;   // CapCut Q / W on the timeline (main.ts)
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
