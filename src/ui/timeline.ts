// The timeline, laid out like CapCut: one lane per object with its clips as blocks (an object's clips are where it
// is visible; keyframes sit on the clip as small diamonds), lanes for the edit (camera shots), captions and audio,
// grouped by stage. Drag a block to move it with everything inside, drag its edges to trim, Ctrl/Cmd+B splits at the
// playhead, Q / W delete what is left / right of it, Delete removes, Up / Down jump between edit points.
// Two-finger swipe pans (sideways) and scrolls (up/down), pinch or Ctrl/Cmd + wheel zooms at the pointer.
// The arrow next to a name opens that object's tracks: one row per animated property, with draggable keyframes.
import { S, on, emit, select, setTime, edit, beginGesture, endGesture, changed, checkpoint, snapT, selObj } from '../state';
import { PROPS, propDef, valueAt, setValue, sortKeys, SceneObject, Key, Value, contentEnd, ARM_VI, EXPR_VI, POSE_VI, segmentsOf, writeSegments, shiftKeysIn, Seg, Caption, AudioClip, newId } from '../doc';
const VI: Record<string, string> = { ...ARM_VI, ...EXPR_VI, ...POSE_VI };
import { contextMenu, ask, fmtTime, KIND_COLOR, h } from './dom';
import { clipLength } from './audio';

const cv = document.getElementById('tl') as HTMLCanvasElement;
const ctx = cv.getContext('2d')!;
const bar = document.getElementById('tlbar')!;
const NAME_W = 200, RULER = 26, SB = 11;            // name column, time ruler, horizontal scrollbar
const H_CUTS = 30, H_CAPS = 28, H_AUDIO = 34, H_STAGE = 20, H_OBJ = 32, H_TRACK = 22;
let pps = 90, scrollX = 0, scrollY = 0;            // pixels per second, seconds at the left edge, px scrolled down
const expanded = new Set<string>();
let need = true; const redraw = () => { need = true; };

type Row =
  | { type: 'cuts' } | { type: 'caps' } | { type: 'audio' }
  | { type: 'stage'; id: string; name: string }
  | { type: 'obj'; o: SceneObject }
  | { type: 'track'; o: SceneObject; key: string };
type Laid = { r: Row; y: number; h: number };      // y: from the top of the lanes (before scrolling)

function rows(): Row[] {
  const out: Row[] = [{ type: 'cuts' }, { type: 'caps' }, { type: 'audio' }];
  const multi = S.doc.stages.length > 1;
  for (const st of S.doc.stages) {
    const objs = S.doc.objects.filter((x) => x.stage === st.id); if (!objs.length) continue;
    if (multi) out.push({ type: 'stage', id: st.id, name: st.name });
    for (const o of objs) {
      out.push({ type: 'obj', o });
      if (expanded.has(o.id)) {
        const defs = PROPS[o.kind];
        const keys = defs.map((d) => d.key).filter((k) => (o.tracks[k] || []).length);
        for (const k of mainTracks(o)) if (!keys.includes(k)) keys.push(k);
        keys.sort((a, b) => defs.findIndex((d) => d.key === a) - defs.findIndex((d) => d.key === b));
        for (const k of keys) out.push({ type: 'track', o, key: k });
      }
    }
  }
  return out;
}
const heightOf = (r: Row) => r.type === 'cuts' ? H_CUTS : r.type === 'caps' ? H_CAPS : r.type === 'audio' ? H_AUDIO : r.type === 'stage' ? H_STAGE : r.type === 'obj' ? H_OBJ : H_TRACK;
function layout(): Laid[] { let y = 0; return rows().map((r) => { const l = { r, y, h: heightOf(r) }; y += l.h; return l; }); }
function mainTracks(o: SceneObject) {
  if (o.kind === 'char') return ['pos', 'rotY', 'armL', 'armR', 'expr', 'say'];
  if (o.kind === 'camera') return ['pos', 'target', 'fov'];
  if (o.kind === 'car') return ['pos', 'rotY', 'brake'];
  return ['pos'];
}

// ---------------------------------------------------------------- geometry
const xOf = (t: number) => NAME_W + (t - scrollX) * pps;
const tOf = (x: number) => (x - NAME_W) / pps + scrollX;
const dpr = () => window.devicePixelRatio || 1;
const viewW = () => cv.width / dpr(), viewH = () => cv.height / dpr();
const lanesH = () => viewH() - RULER - SB;
function size() { const r = cv.getBoundingClientRect(); cv.width = Math.round(r.width * dpr()); cv.height = Math.round(r.height * dpr()); clamp(); redraw(); }
new ResizeObserver(size).observe(cv);
/** The longest the timeline needs to show. */
const span = () => Math.max(S.doc.duration, contentEnd(S.doc), 1);
const fitPps = () => Math.max(2, (viewW() - NAME_W - 30) / span());
function clamp() {
  pps = Math.max(fitPps() * 0.5, Math.min(2000, pps));
  const vis = (viewW() - NAME_W) / pps, maxX = Math.max(0, span() + 2 - vis);
  scrollX = Math.max(0, Math.min(maxX, scrollX));
  const L = layout(), total = L.length ? L[L.length - 1].y + L[L.length - 1].h : 0;
  scrollY = Math.max(0, Math.min(Math.max(0, total - lanesH() + 8), scrollY));
}

// ---------------------------------------------------------------- draw
const camColor = (id: string) => { let hsh = 0; for (const c of id) hsh = (hsh * 31 + c.charCodeAt(0)) >>> 0; return `hsl(${hsh % 360} 50% 42%)`; };
function fmtVal(v: Value) { if (Array.isArray(v)) return v.map((n) => n.toFixed(2)).join(', '); if (typeof v === 'number') return (+v.toFixed(3)).toString(); return String(v); }
const isSel = (o: string, track: string, t: number) => S.selKeys.some((k) => k.obj === o && k.track === track && Math.abs(k.t - t) < 1e-6);
function diamond(x: number, y: number, r: number, fill: string, stroke = '#111') {
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke();
}
function clipText(s: string, x: number, y: number, w: number, pad = 6) {
  if (w < 16) return; ctx.save(); ctx.beginPath(); ctx.rect(x, y - 12, w, 24); ctx.clip(); ctx.fillText(s, Math.max(x, NAME_W) + pad, y); ctx.restore();
}
/** A CapCut block: rounded, filled, with a border when selected. */
function block(x0: number, x1: number, y: number, hh: number, fill: string, sel: 0 | 1 | 2 = 0) {
  const w = Math.max(3, x1 - x0 - 2), r = Math.min(5, w / 2);
  ctx.beginPath(); ctx.roundRect(x0 + 1, y, w, hh, r); ctx.fillStyle = fill; ctx.fill();
  if (sel) { ctx.lineWidth = sel === 2 ? 2 : 1; ctx.strokeStyle = sel === 2 ? '#ffffff' : 'rgba(255,255,255,0.45)'; ctx.stroke(); }
  if (sel === 2 && w > 14) { ctx.fillStyle = '#fff'; ctx.fillRect(x0 + 2, y + hh / 2 - 6, 3, 12); ctx.fillRect(x0 + w - 3, y + hh / 2 - 6, 3, 12); }   // trim handles
}
const dim = (hex: string, a = 0.78) => { const c = hex.replace('#', ''); const n = parseInt(c.length === 3 ? c.split('').map((q) => q + q).join('') : c, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };

function draw() {
  const W = viewW(), H = viewH();
  ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0);
  ctx.fillStyle = '#17191e'; ctx.fillRect(0, 0, W, H);
  ctx.font = '12px system-ui, sans-serif'; ctx.textBaseline = 'middle';
  const L = layout(), dur = S.doc.duration;
  ctx.save(); ctx.beginPath(); ctx.rect(0, RULER, W, lanesH()); ctx.clip();
  for (const l of L) {
    const y = RULER + l.y - scrollY, r = l.r; if (y + l.h < RULER || y > RULER + lanesH()) continue;
    const selRow = (r.type === 'obj' || r.type === 'track') && r.o.id === S.sel;
    ctx.fillStyle = r.type === 'stage' ? '#121419' : selRow ? '#232936' : r.type === 'track' ? '#1b1e24' : '#1e2128';
    ctx.fillRect(0, y, W, l.h);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(xOf(dur), y, Math.max(0, W - xOf(dur)), l.h);   // past the end
    ctx.save(); ctx.beginPath(); ctx.rect(NAME_W, y, W - NAME_W, l.h); ctx.clip(); drawRow(r, y, l.h); ctx.restore();
    // name column
    ctx.fillStyle = r.type === 'stage' ? '#121419' : selRow ? '#2a3140' : '#191c22'; ctx.fillRect(0, y, NAME_W, l.h);
    const mid = y + l.h / 2;
    if (r.type === 'cuts') { ctx.fillStyle = '#6fb6ff'; ctx.fillText('Cắt cảnh (camera)', 12, mid); }
    else if (r.type === 'caps') { ctx.fillStyle = '#e8e8e8'; ctx.fillText('Phụ đề', 12, mid); }
    else if (r.type === 'audio') { ctx.fillStyle = '#9be38a'; ctx.fillText('Âm thanh', 12, mid); }
    else if (r.type === 'stage') { ctx.fillStyle = '#8f99a8'; ctx.font = '600 11px system-ui, sans-serif'; ctx.fillText(r.name.toUpperCase(), 10, mid); ctx.font = '12px system-ui, sans-serif'; }
    else if (r.type === 'obj') {
      const open = expanded.has(r.o.id);
      ctx.fillStyle = '#8a92a0'; ctx.beginPath(); if (open) { ctx.moveTo(6, mid - 3); ctx.lineTo(14, mid - 3); ctx.lineTo(10, mid + 3); } else { ctx.moveTo(7, mid - 4); ctx.lineTo(13, mid); ctx.lineTo(7, mid + 4); } ctx.fill();
      ctx.fillStyle = KIND_COLOR[r.o.kind]; ctx.fillRect(20, y + 8, 3, l.h - 16);
      ctx.fillStyle = r.o.hidden ? '#6a707c' : '#e6e9ef'; clipName(r.o.name, 28, mid, NAME_W - 34);
    } else {
      const d = propDef(r.o.kind, r.key); const has = (r.o.tracks[r.key] || []).length;
      ctx.fillStyle = has ? '#b9c0cc' : '#6d7480'; clipName(d?.label || r.key, 36, mid, NAME_W - 60);
      const k = (r.o.tracks[r.key] || []).find((q) => Math.abs(q.t - S.t) < 1 / 120);
      diamond(NAME_W - 14, mid, 5, k ? '#ffb02e' : '#3a404b', '#0d0f12');
    }
    ctx.strokeStyle = '#111317'; ctx.beginPath(); ctx.moveTo(0, y + l.h - 0.5); ctx.lineTo(W, y + l.h - 0.5); ctx.stroke();
  }
  ctx.restore();
  // ruler
  ctx.fillStyle = '#121419'; ctx.fillRect(0, 0, W, RULER);
  const step = [1 / 30, 1 / 15, 0.1, 0.2, 0.5, 1, 2, 5, 10, 30, 60].find((s) => s * pps >= 64) || 120;
  ctx.fillStyle = '#8a92a0'; ctx.strokeStyle = '#3a404b';
  for (let t = Math.floor(scrollX / step) * step; xOf(t) < W; t += step) {
    const x = xOf(t); if (x < NAME_W) continue;
    ctx.beginPath(); ctx.moveTo(x + 0.5, RULER - 8); ctx.lineTo(x + 0.5, RULER); ctx.stroke();
    ctx.fillText(step < 1 ? fmtTime(t, S.doc.fps) : t >= 60 ? `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}` : `${Math.round(t)}s`, x + 3, 9);
    for (let i = 1; i < 4; i++) { const xs = xOf(t + step * i / 4); if (xs > NAME_W) { ctx.beginPath(); ctx.moveTo(xs + 0.5, RULER - 4); ctx.lineTo(xs + 0.5, RULER); ctx.stroke(); } }
  }
  ctx.fillStyle = '#ff5050'; ctx.fillRect(xOf(dur) - 1, 0, 2, RULER);
  ctx.fillStyle = '#121419'; ctx.fillRect(0, 0, NAME_W, RULER);
  ctx.fillStyle = '#c9ced8'; ctx.fillText(`${fmtTime(S.t, S.doc.fps)}  /  ${fmtTime(dur, S.doc.fps)}`, 10, RULER / 2);
  // snap guide while dragging
  if (snapLine != null) { const x = xOf(snapLine); ctx.fillStyle = '#ffd34d'; ctx.fillRect(x - 0.5, RULER, 1, lanesH()); }
  // playhead
  const px = xOf(S.t);
  if (px >= NAME_W) { ctx.fillStyle = '#ff4d4d'; ctx.fillRect(px - 1, 0, 2, RULER + lanesH()); ctx.beginPath(); ctx.moveTo(px - 6, 0); ctx.lineTo(px + 6, 0); ctx.lineTo(px, 9); ctx.fill(); }
  // horizontal scrollbar
  const sy = H - SB, vis = (W - NAME_W) / pps, total = Math.max(span() + 2, vis);
  ctx.fillStyle = '#121419'; ctx.fillRect(NAME_W, sy, W - NAME_W, SB);
  const tw = Math.max(30, (W - NAME_W) * vis / total), tx = NAME_W + (W - NAME_W - tw) * (total - vis > 0 ? scrollX / (total - vis) : 0);
  ctx.fillStyle = drag?.kind === 'hbar' ? '#7d8696' : '#4a5160'; ctx.beginPath(); ctx.roundRect(tx, sy + 2, tw, SB - 4, 4); ctx.fill();
  ctx.fillStyle = '#121419'; ctx.fillRect(0, sy, NAME_W, SB);
  // box selection
  if (boxSel) { ctx.strokeStyle = '#ffb02e'; ctx.setLineDash([4, 3]); ctx.strokeRect(Math.min(boxSel.x0, boxSel.x1), Math.min(boxSel.y0, boxSel.y1), Math.abs(boxSel.x1 - boxSel.x0), Math.abs(boxSel.y1 - boxSel.y0)); ctx.setLineDash([]); }
}
function clipName(s: string, x: number, y: number, w: number) { ctx.save(); ctx.beginPath(); ctx.rect(x, y - 10, w, 20); ctx.clip(); ctx.fillText(s, x, y); ctx.restore(); }

/** Where each caption card ends (the next card, or 1.2 s). */
const capEnd = (i: number) => { const c = S.doc.captions; return i + 1 < c.length ? c[i + 1].t : Math.min(S.doc.duration, c[i].t + 1.2); };
function objKeyTimes(o: SceneObject) { const s = new Set<number>(); for (const [k, ks] of Object.entries(o.tracks)) if (k !== 'visible') for (const q of ks) s.add(q.t); return [...s]; }

function drawRow(r: Row, y: number, hh: number) {
  const mid = y + hh / 2, dur = S.doc.duration;
  if (r.type === 'cuts') {
    const cuts = S.doc.cuts;
    cuts.forEach((c, i) => {
      const x0 = xOf(c.t), x1 = xOf(i + 1 < cuts.length ? cuts[i + 1].t : dur);
      const cam = S.doc.objects.find((o) => o.id === c.camera);
      block(x0, x1, y + 3, hh - 6, camColor(c.camera), i === S.selCut ? 2 : 0);
      if (c.dissolve) { const d = c.dissolve / 30 * pps / 2; ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(x0 - d, y + hh - 3); ctx.lineTo(x0 + d, y + 3); ctx.lineTo(x0 + d, y + hh - 3); ctx.fill(); }
      ctx.fillStyle = '#fff'; clipText(cam ? cam.name : '(camera đã xoá)', x0, mid, x1 - x0);
    });
  } else if (r.type === 'caps') {
    S.doc.captions.forEach((c, i) => {
      if (!c.text) return;
      const x0 = xOf(c.t), x1 = xOf(capEnd(i));
      block(x0, x1, y + 3, hh - 6, i === S.selCap ? '#e9e9ec' : '#a9adb5', i === S.selCap ? 2 : 0);
      ctx.fillStyle = '#111'; clipText(c.text, x0, mid, x1 - x0);
    });
  } else if (r.type === 'audio') {
    S.doc.audio.forEach((a, i) => {
      const x0 = xOf(a.start), x1 = xOf(a.start + clipLength(a));
      block(x0, x1, y + 3, hh - 6, a.tts ? '#2f6f5a' : '#3f7f3a', i === S.selAud ? 2 : 0);
      ctx.strokeStyle = 'rgba(190,255,190,0.55)'; ctx.beginPath();
      for (let x = Math.max(x0 + 3, NAME_W); x < Math.min(x1 - 3, viewW()); x += 3) { const s = x - x0 + (a.offset || 0) * pps; const a2 = (Math.sin(s * 0.37) * Math.sin(s * 0.051) * 0.5 + 0.5) * (hh - 14) / 2; ctx.moveTo(x, mid + 3 - a2); ctx.lineTo(x, mid + 3 + a2); }
      ctx.stroke(); ctx.fillStyle = '#eaffea'; clipText(a.name || a.file, x0, y + 11, x1 - x0);
    });
  } else if (r.type === 'obj') {
    const o = r.o, segs = segmentsOf(o, dur), times = objKeyTimes(o), color = KIND_COLOR[o.kind] || '#888';
    for (const s of segs) {
      const x0 = xOf(s.a), x1 = xOf(s.b), selSeg = S.selSeg && S.selSeg.obj === o.id && Math.abs(S.selSeg.a - s.a) < 1e-4;
      block(x0, x1, y + 3, hh - 6, dim(color, o.hidden ? 0.3 : 0.62), selSeg ? 2 : o.id === S.sel ? 1 : 0);
      ctx.fillStyle = '#fff'; clipText(o.name, x0, y + 12, x1 - x0);
      for (const t of times) if (t >= s.a - 1e-6 && t <= s.b + 1e-6) diamond(xOf(t), y + hh - 9, 3.5, S.selKeys.some((k) => k.obj === o.id && Math.abs(k.t - t) < 1e-6) ? '#ffb02e' : '#e8ebf0', 'rgba(0,0,0,0.6)');
    }
  } else if (r.type === 'track') {
    const d = propDef(r.o.kind, r.key)!, keys = r.o.tracks[r.key] || [];
    if (d && (d.type === 'enum' || d.type === 'text' || d.type === 'bool')) {
      keys.forEach((k, i) => {
        const x0 = xOf(k.t), x1 = xOf(i + 1 < keys.length ? keys[i + 1].t : Math.max(dur, k.t + 0.5));
        const txt = String(k.v), empty = txt === '' || k.v === false;
        block(x0, x1, y + 3, hh - 6, empty ? 'rgba(255,255,255,0.05)' : d.type === 'text' ? '#5b4a8a' : d.type === 'bool' ? '#3d6b4f' : '#3c5a86');
        ctx.fillStyle = '#eef'; clipText(d.type === 'bool' ? (k.v ? 'bật' : 'tắt') : (VI[txt] || txt), x0 + 4, mid, x1 - x0 - 4);
        diamond(x0, mid, 4.5, isSel(r.o.id, r.key, k.t) ? '#ffb02e' : '#d9dde6');
      });
    } else {
      if (keys.length > 1) { ctx.strokeStyle = '#4a5160'; ctx.beginPath(); ctx.moveTo(xOf(keys[0].t), mid); ctx.lineTo(xOf(keys[keys.length - 1].t), mid); ctx.stroke(); }
      for (const k of keys) { const e = k.ease || 'auto'; diamond(xOf(k.t), mid, 4.5, isSel(r.o.id, r.key, k.t) ? '#ffb02e' : e === 'step' ? '#c07070' : e === 'linear' ? '#9ad0ff' : '#d9dde6'); }
      if (keys.length === 1) { ctx.fillStyle = '#7d8492'; ctx.fillText(fmtVal(keys[0].v), xOf(keys[0].t) + 10, mid); }
    }
  }
}

function loop() { requestAnimationFrame(loop); if (need) { need = false; draw(); } }
requestAnimationFrame(loop);
on('doc', () => { clamp(); redraw(); toolbar(); }); on('time', () => { follow(); redraw(); }); on('play', toolbar);
on('select', () => { reveal(S.sel); redraw(); toolbar(); });
on('project', () => { scrollY = 0; requestAnimationFrame(() => requestAnimationFrame(fit)); });   // a project opens fitted, from its start

function follow() {   // keep the playhead in view while playing
  if (!S.playing) return;
  const W = viewW();
  if (xOf(S.t) > W - 40) scrollX = S.t - (W - NAME_W) * 0.2 / pps;
  if (xOf(S.t) < NAME_W) scrollX = Math.max(0, S.t - 0.5);
  clamp();
}
/** Bring an object's lane into view (a click on it in the frame, the list, or the inspector). */
export function reveal(id: string | null) {
  if (!id) return;
  const l = layout().find((q) => (q.r.type === 'obj') && q.r.o.id === id); if (!l) return;
  const top = l.y - scrollY;
  if (top < 0 || top + l.h > lanesH()) { scrollY = l.y - lanesH() / 3; clamp(); }
  const o = S.doc.objects.find((x) => x.id === id);
  if (o) { const segs = segmentsOf(o, S.doc.duration), vis = (viewW() - NAME_W) / pps; if (segs.length && !segs.some((s) => s.b > scrollX && s.a < scrollX + vis)) { scrollX = Math.max(0, segs[0].a - 0.5); clamp(); } }
  redraw();
}

// ---------------------------------------------------------------- hit testing
interface Hit { row: Row | null; lane?: Laid; t: number; key?: Key; cut?: number; cutEdge?: boolean; cap?: number; aud?: number; seg?: Seg; edge?: 'L' | 'R'; name?: boolean; toggle?: boolean; keyBtn?: boolean; ruler?: boolean; hbar?: boolean }
function hitAt(x: number, y: number): Hit {
  const t = tOf(x);
  if (y < RULER) return { row: null, t, ruler: true };
  if (y >= viewH() - SB) return { row: null, t, hbar: x >= NAME_W };
  const ly = y - RULER + scrollY, lane = layout().find((l) => ly >= l.y && ly < l.y + l.h);
  const hit: Hit = { row: lane?.r || null, lane, t };
  const row = hit.row; if (!row || !lane) return hit;
  if (x < NAME_W) { hit.name = true; hit.toggle = row.type === 'obj' && x < 18; hit.keyBtn = row.type === 'track' && x > NAME_W - 24; return hit; }
  const near = (tt: number, px = 6) => Math.abs(xOf(tt) - x) <= px;
  const edgeOf = (a: number, b: number): 'L' | 'R' | undefined => (xOf(b) - xOf(a) > 18 ? (near(a, 6) ? 'L' : near(b, 6) ? 'R' : undefined) : undefined);
  if (row.type === 'track') hit.key = (row.o.tracks[row.key] || []).find((k) => near(k.t));
  if (row.type === 'obj') {
    const segs = segmentsOf(row.o, S.doc.duration), inLow = ly >= lane.y + lane.h - 15;
    hit.seg = segs.find((s) => t >= s.a - 6 / pps && t <= s.b + 6 / pps);
    if (hit.seg && inLow) { const kt = objKeyTimes(row.o).find((q) => near(q, 5)); if (kt != null) { hit.key = { t: kt, v: 0 }; } }
    if (hit.seg && !hit.key) hit.edge = edgeOf(hit.seg.a, hit.seg.b);
  }
  if (row.type === 'cuts') {
    const cuts = S.doc.cuts;
    for (let i = cuts.length - 1; i >= 0; i--) { if (i > 0 && near(cuts[i].t)) { hit.cut = i; hit.cutEdge = true; break; } if (t >= cuts[i].t) { hit.cut = i; break; } }
  }
  if (row.type === 'caps') { const caps = S.doc.captions; for (let i = caps.length - 1; i >= 0; i--) if (caps[i].text && t >= caps[i].t - 6 / pps && t <= capEnd(i) + 6 / pps) { hit.cap = i; hit.edge = edgeOf(caps[i].t, capEnd(i)); break; } }
  if (row.type === 'audio') S.doc.audio.forEach((a, i) => { if (t >= a.start - 6 / pps && t <= a.start + clipLength(a) + 6 / pps) { hit.aud = i; hit.edge = edgeOf(a.start, a.start + clipLength(a)); } });
  return hit;
}

// ---------------------------------------------------------------- snapping (the playhead, cuts, captions, clip edges)
let snapLine: number | null = null;
function snapPoints(skipObj?: string): number[] {
  const p = [0, S.doc.duration, S.t, ...S.doc.cuts.map((c) => c.t), ...S.doc.captions.map((c) => c.t)];
  for (const a of S.doc.audio) p.push(a.start, a.start + clipLength(a));
  for (const o of S.doc.objects) if (o.id !== skipObj && o.kind !== 'camera') for (const s of segmentsOf(o, S.doc.duration)) p.push(s.a, s.b);
  return p;
}
function snapTo(t: number, pts: number[], free: boolean) {
  if (free) { snapLine = null; return +t.toFixed(3); }
  let best = t, bd = 8 / pps; snapLine = null;
  for (const q of pts) { const d = Math.abs(q - t); if (d < bd) { bd = d; best = q; snapLine = q; } }
  return snapLine != null ? best : snapT(t);
}

// ---------------------------------------------------------------- input
type DragKind = 'scrub' | 'keys' | 'cut' | 'cap' | 'capL' | 'capR' | 'aud' | 'audL' | 'audR' | 'box' | 'seg' | 'segL' | 'segR' | 'hbar';
let drag: null | { kind: DragKind; x0: number; t0: number; moved?: boolean; orig?: Array<{ k: Key; t: number; o: SceneObject; track: string }>; idx?: number;
  obj?: SceneObject; seg?: Seg; segs?: Seg[]; tracks?: string; caps?: string; aud?: AudioClip; pts?: number[]; sx?: number } = null;
let boxSel: null | { x0: number; y0: number; x1: number; y1: number } = null;
const local = (e: MouseEvent) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

cv.addEventListener('contextmenu', (e) => e.preventDefault());
cv.addEventListener('pointerdown', (e) => {
  S.focus = 'timeline';
  if (S.playing) { S.playing = false; emit('play'); }
  const { x, y } = local(e); const hit = hitAt(x, y);
  if (e.button === 2) return rightClick(e, hit);
  if (e.button === 1) { drag = { kind: 'hbar', x0: x, t0: scrollX, sx: -1 }; cv.setPointerCapture(e.pointerId); return; }   // middle drag pans
  cv.setPointerCapture(e.pointerId);
  if (hit.ruler) { drag = { kind: 'scrub', x0: x, t0: 0 }; if (x >= NAME_W) setTime(snapT(tOf(x))); return; }
  if (hit.hbar) { drag = { kind: 'hbar', x0: x, t0: scrollX }; redraw(); return; }
  const row = hit.row; if (!row) { S.selKeys = []; redraw(); return; }
  if (hit.name) {
    if (row.type === 'obj') { if (hit.toggle) { expanded.has(row.o.id) ? expanded.delete(row.o.id) : expanded.add(row.o.id); clamp(); redraw(); } else select(row.o.id); }
    else if (row.type === 'track') { if (S.sel !== row.o.id) select(row.o.id); if (hit.keyBtn) toggleKeyAtPlayhead(row.o, row.key); }
    return;
  }
  // keyframes (in a track row, or the diamonds on an object's clip)
  if (hit.key && (row.type === 'track' || row.type === 'obj')) {
    const o = row.o; if (S.sel !== o.id) { S.sel = o.id; S.setPart = -1; emit('select'); }
    const refs = row.type === 'track' ? [{ track: row.key }] : Object.keys(o.tracks).filter((tk) => tk !== 'visible' && o.tracks[tk].some((k) => Math.abs(k.t - hit.key!.t) < 1e-6)).map((track) => ({ track }));
    const already = refs.every((r) => isSel(o.id, r.track, hit.key!.t));
    if (!e.shiftKey && !already) S.selKeys = [];
    for (const r of refs) if (!isSel(o.id, r.track, hit.key!.t)) S.selKeys.push({ obj: o.id, track: r.track, t: hit.key!.t });
    const orig = S.selKeys.map((s) => { const ob = S.doc.objects.find((q) => q.id === s.obj)!; return { k: (ob?.tracks[s.track] || []).find((k) => Math.abs(k.t - s.t) < 1e-6)!, t: s.t, o: ob, track: s.track }; }).filter((q) => q.k);
    beginGesture(); checkpoint();
    drag = { kind: 'keys', x0: x, t0: hit.t, orig, pts: snapPoints(o.id) }; emit('keys'); redraw(); return;
  }
  // an object's clip: select it; drag the body to move it with its animation, the edges to trim
  if (row.type === 'obj' && hit.seg) {
    const o = row.o; if (S.sel !== o.id) select(o.id);
    S.selSeg = { obj: o.id, a: hit.seg.a }; S.selKeys = []; S.selCut = -1; S.selCap = -1; S.selAud = -1;
    beginGesture(); checkpoint();
    drag = { kind: hit.edge === 'L' ? 'segL' : hit.edge === 'R' ? 'segR' : 'seg', x0: x, t0: hit.t, obj: o, seg: { ...hit.seg }, segs: segmentsOf(o, S.doc.duration), tracks: JSON.stringify(o.tracks), pts: snapPoints(o.id) };
    emit('select'); redraw(); return;
  }
  if (row.type === 'cuts' && hit.cut != null) {
    S.selCut = hit.cut; S.selCap = -1; S.selAud = -1; S.selSeg = null; const c = S.doc.cuts[hit.cut]; S.sel = c.camera; emit('select');
    if (hit.cutEdge) { beginGesture(); checkpoint(); drag = { kind: 'cut', x0: x, t0: c.t, idx: hit.cut, pts: snapPoints() }; }
    else { setTime(snapT(hit.t)); drag = { kind: 'scrub', x0: x, t0: 0 }; }
    redraw(); return;
  }
  if (row.type === 'caps' && hit.cap != null) {
    S.selCap = hit.cap; S.selCut = -1; S.selAud = -1; S.selSeg = null; beginGesture(); checkpoint();
    drag = { kind: hit.edge === 'L' ? 'capL' : hit.edge === 'R' ? 'capR' : 'cap', x0: x, t0: S.doc.captions[hit.cap].t, idx: hit.cap, caps: JSON.stringify(S.doc.captions), pts: snapPoints() };
    emit('select'); redraw(); return;
  }
  if (row.type === 'audio' && hit.aud != null) {
    S.selAud = hit.aud; S.selCap = -1; S.selCut = -1; S.selSeg = null; beginGesture(); checkpoint();
    drag = { kind: hit.edge === 'L' ? 'audL' : hit.edge === 'R' ? 'audR' : 'aud', x0: x, t0: S.doc.audio[hit.aud].start, idx: hit.aud, aud: { ...S.doc.audio[hit.aud] }, pts: snapPoints() };
    emit('select'); redraw(); return;
  }
  // empty space: move the playhead, or box-select keys with Shift / Ctrl
  if (e.shiftKey || e.ctrlKey || e.metaKey) { boxSel = { x0: x, y0: y, x1: x, y1: y }; drag = { kind: 'box', x0: x, t0: 0 }; return; }
  S.selKeys = []; S.selCut = -1; S.selCap = -1; S.selAud = -1; S.selSeg = null; setTime(snapT(hit.t)); drag = { kind: 'scrub', x0: x, t0: 0 }; redraw();
});

cv.addEventListener('pointermove', (e) => {
  const { x, y } = local(e);
  if (!drag) { const hit = hitAt(x, y); cv.style.cursor = hit.edge || hit.cutEdge ? 'ew-resize' : hit.key ? 'pointer' : hit.seg || hit.cap != null || hit.aud != null ? 'grab' : 'default'; return; }
  const dt = (x - drag.x0) / pps, free = e.altKey, dur = S.doc.duration;
  if (drag.kind === 'hbar') { const W = viewW(), vis = (W - NAME_W) / pps, total = Math.max(span() + 2, vis); scrollX = drag.sx === -1 ? drag.t0 - dt : drag.t0 + (x - drag.x0) * total / (W - NAME_W); clamp(); redraw(); return; }
  if (drag.kind === 'scrub') { setTime(snapT(Math.max(0, tOf(Math.max(NAME_W, x))))); return; }
  if (drag.kind === 'box') { boxSel!.x1 = x; boxSel!.y1 = y; redraw(); return; }
  drag.moved = true;
  if (drag.kind === 'keys') {
    const minT = Math.min(...drag.orig!.map((q) => q.t)); const lead = drag.orig![0].t;
    const d = Math.max(-minT, snapTo(lead + dt, drag.pts!, free) - lead);
    for (const q of drag.orig!) q.k.t = Math.max(0, +(q.t + d).toFixed(4));
    S.selKeys = drag.orig!.map((q) => ({ obj: q.o.id, track: q.track, t: q.k.t }));
    changed(); return;
  }
  if (drag.kind === 'seg' || drag.kind === 'segL' || drag.kind === 'segR') {
    const o = drag.obj!, s0 = drag.seg!, others = drag.segs!.filter((q) => Math.abs(q.a - s0.a) > 1e-6);
    const prevEnd = Math.max(0, ...others.filter((q) => q.b <= s0.a + 1e-6).map((q) => q.b)), nextStart = Math.min(Math.max(dur, s0.b), ...others.filter((q) => q.a >= s0.b - 1e-6).map((q) => q.a));
    o.tracks = JSON.parse(drag.tracks!);
    let ns: Seg;
    if (drag.kind === 'seg') {
      const len = s0.b - s0.a; let a = snapTo(s0.a + dt, drag.pts!, free); const b0 = snapTo(s0.b + dt, drag.pts!, free);
      if (Math.abs(b0 - (s0.b + dt)) < Math.abs(a - (s0.a + dt))) a = b0 - len;   // whichever edge snapped closer
      a = Math.max(prevEnd, Math.min(nextStart - len, a)); ns = { a, b: a + len };
      shiftKeysIn(o, s0.a, s0.b, a - s0.a, Math.abs(s0.b - dur) < 1e-4);
    } else if (drag.kind === 'segL') ns = { a: Math.max(prevEnd, Math.min(s0.b - 0.05, snapTo(s0.a + dt, drag.pts!, free))), b: s0.b };
    else ns = { a: s0.a, b: Math.min(nextStart, Math.max(s0.a + 0.05, snapTo(s0.b + dt, drag.pts!, free))) };
    writeSegments(o, [...others, ns], dur);
    S.selSeg = { obj: o.id, a: ns.a }; changed(); return;
  }
  if (drag.kind === 'cut') { S.doc.cuts[drag.idx!].t = Math.max(0, snapTo(drag.t0 + dt, drag.pts!, free)); changed(); return; }
  if (drag.kind === 'cap' || drag.kind === 'capL' || drag.kind === 'capR') {
    const caps: Caption[] = JSON.parse(drag.caps!), i = drag.idx!, c = caps[i];
    const prevT = i > 0 ? caps[i - 1].t + 0.05 : 0, endT = i + 1 < caps.length ? caps[i + 1].t : Math.min(dur, c.t + 1.2);
    if (drag.kind === 'cap') { const len = endT - c.t, nt = Math.max(prevT, snapTo(c.t + dt, drag.pts!, free)); c.t = nt; if (i + 1 < caps.length && !caps[i + 1].text) caps[i + 1].t = nt + len; }
    else if (drag.kind === 'capL') c.t = Math.max(prevT, Math.min(endT - 0.05, snapTo(c.t + dt, drag.pts!, free)));
    else {
      const ne = Math.max(c.t + 0.05, snapTo(endT + dt, drag.pts!, free)), nx = caps[i + 1];
      if (nx && !nx.text) nx.t = ne;                                    // the blank card that ends this one moves
      else if (nx) { if (ne < nx.t - 1e-3) caps.splice(i + 1, 0, { t: ne, text: '' }); }   // shorter: a blank card ends it
      else caps.push({ t: ne, text: '' });
    }
    S.doc.captions = caps.sort((a, b) => a.t - b.t); S.selCap = S.doc.captions.indexOf(c); changed(); return;
  }
  if (drag.kind === 'aud' || drag.kind === 'audL' || drag.kind === 'audR') {
    const a = S.doc.audio[drag.idx!], o = drag.aud!, len = clipLength(o);
    if (drag.kind === 'aud') a.start = Math.max(0, snapTo(o.start + dt, drag.pts!, free));
    else if (drag.kind === 'audL') { const d = Math.max(-(o.offset || 0), Math.min(len - 0.05, snapTo(o.start + dt, drag.pts!, free) - o.start)); a.start = o.start + d; a.offset = +((o.offset || 0) + d).toFixed(3); a.dur = +(len - d).toFixed(3); }
    else a.dur = +Math.max(0.05, snapTo(o.start + len + dt, drag.pts!, free) - o.start).toFixed(3);
    changed(); return;
  }
});
cv.addEventListener('pointerup', () => {
  snapLine = null;
  if (!drag) return;
  if (drag.kind === 'box' && boxSel) {
    const L = layout(), t0 = tOf(Math.min(boxSel.x0, boxSel.x1)), t1 = tOf(Math.max(boxSel.x0, boxSel.x1));
    const y0 = Math.min(boxSel.y0, boxSel.y1) - RULER + scrollY, y1 = Math.max(boxSel.y0, boxSel.y1) - RULER + scrollY;
    for (const l of L) {
      if (l.y + l.h < y0 || l.y > y1) continue; const r = l.r; if (r.type !== 'track' && r.type !== 'obj') continue;
      const tracks = r.type === 'track' ? [r.key] : Object.keys(r.o.tracks).filter((k) => k !== 'visible');
      for (const tk of tracks) for (const k of r.o.tracks[tk] || []) if (k.t >= t0 && k.t <= t1 && !isSel(r.o.id, tk, k.t)) S.selKeys.push({ obj: r.o.id, track: tk, t: k.t });
    }
    boxSel = null; redraw();
  }
  if (drag.kind !== 'scrub' && drag.kind !== 'box' && drag.kind !== 'hbar') {
    if (drag.kind === 'keys') for (const q of drag.orig!) sortKeys(q.o);
    if (drag.kind === 'cut') S.doc.cuts.sort((a, b) => a.t - b.t);
    endGesture(); if (drag.moved) changed();
  }
  drag = null; redraw();
});

cv.addEventListener('dblclick', async (e) => {
  const { x, y } = local(e); const hit = hitAt(x, y); const row = hit.row; if (!row || x < NAME_W) return;
  const t = snapT(hit.t);
  if (row.type === 'obj') { expanded.has(row.o.id) ? expanded.delete(row.o.id) : expanded.add(row.o.id); clamp(); redraw(); return; }
  if (row.type === 'track') {
    const d = propDef(row.o.kind, row.key)!;
    if (d.type === 'text' && hit.key) { const v = await ask(`${row.o.name}: ${d.label}`, String(hit.key.v), true); if (v != null) edit(() => { hit.key!.v = v; }); return; }
    const v = valueAt(row.o, row.key, t);
    if (d.type === 'text') { const s = await ask(`${row.o.name}: ${d.label} at ${fmtTime(t)}`, '', true); if (s == null) return; edit(() => setValue(row.o, row.key, t, s, true)); return; }
    edit(() => setValue(row.o, row.key, t, v, true));
  } else if (row.type === 'caps') {
    if (hit.cap != null) { const c = S.doc.captions[hit.cap]; const s = await ask('Phụ đề', c.text); if (s != null) edit(() => { c.text = s; }); return; }
    const s = await ask(`Phụ đề tại ${fmtTime(t)}`); if (s == null) return; edit((d) => { d.captions.push({ t, text: s }); d.captions.sort((a, b) => a.t - b.t); });
  } else if (row.type === 'cuts') addCutAt(t);
});

// two-finger swipe: sideways pans, up/down scrolls the lanes; pinch (= Ctrl + wheel) or Ctrl/Cmd + wheel zooms
cv.addEventListener('wheel', (e) => {
  e.preventDefault(); const { x } = local(e);
  const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? viewH() : 1, dx = e.deltaX * k, dy = e.deltaY * k;
  if (e.ctrlKey || e.metaKey) { const tAt = tOf(Math.max(NAME_W, x)); pps = pps * Math.exp(-dy * (e.ctrlKey && !e.metaKey && Math.abs(dy) < 50 ? 0.01 : 0.0015)); clamp(); scrollX = tAt - (Math.max(NAME_W, x) - NAME_W) / pps; }
  else if (e.shiftKey && !dx) scrollX += dy / pps;
  else { scrollX += dx / pps; scrollY += dy; }
  clamp(); redraw();
}, { passive: false });
// Safari's own pinch events
let gStart = 0;
cv.addEventListener('gesturestart', (e: any) => { e.preventDefault(); gStart = pps; });
cv.addEventListener('gesturechange', (e: any) => { e.preventDefault(); const r = cv.getBoundingClientRect(), x = e.clientX - r.left, tAt = tOf(Math.max(NAME_W, x)); pps = gStart * e.scale; clamp(); scrollX = tAt - (Math.max(NAME_W, x) - NAME_W) / pps; clamp(); redraw(); });

// ---------------------------------------------------------------- editing actions (also keyboard: see main.ts)
export function addCutAt(t: number) {
  const cams = S.doc.objects.filter((o) => o.kind === 'camera'); if (!cams.length) return;
  const sel = selObj(); const curIdx = S.doc.cuts.filter((c) => c.t <= t).length - 1, cur = S.doc.cuts[curIdx];
  const cam = sel?.kind === 'camera' && sel.id !== cur?.camera ? sel : cams[(cams.findIndex((c) => c.id === cur?.camera) + 1) % cams.length];
  edit((d) => { const same = d.cuts.find((c) => Math.abs(c.t - t) < 1e-3); if (same) same.camera = cam.id; else d.cuts.push({ t, camera: cam.id }); d.cuts.sort((a, b) => a.t - b.t); });
}
function toggleKeyAtPlayhead(o: SceneObject, key: string) {
  const t = snapT(S.t), keys = (o.tracks[key] ||= []), k = keys.find((q) => Math.abs(q.t - t) < 1 / 120);
  edit(() => { if (k) keys.splice(keys.indexOf(k), 1); else setValue(o, key, t, valueAt(o, key, t), true); });
}
const selSegObj = () => { const s = S.selSeg; if (!s) return null; const o = S.doc.objects.find((x) => x.id === s.obj); if (!o) return null; const seg = segmentsOf(o, S.doc.duration).find((q) => Math.abs(q.a - s.a) < 1e-4); return seg ? { o, seg } : null; };
/** Is a timeline clip selected (so Ctrl+B, Q, W, Delete act on it)? */
export const clipSelected = () => !!selSegObj() || S.selCap >= 0 || S.selAud >= 0 || S.selCut >= 0;

/** Ctrl/Cmd+B: split the selected clip at the playhead (nothing selected: split the shot under the playhead). */
export function splitAtPlayhead() {
  const p = snapT(S.t), dur = S.doc.duration, ss = selSegObj();
  if (ss) {
    const { o, seg } = ss; if (p <= seg.a + 0.02 || p >= seg.b - 0.02) return false;
    edit(() => writeSegments(o, [...segmentsOf(o, dur).filter((q) => q !== seg && Math.abs(q.a - seg.a) > 1e-6), { a: seg.a, b: p }, { a: p, b: seg.b }], dur));
    S.selSeg = { obj: o.id, a: p }; return true;
  }
  if (S.selCap >= 0) {
    const i = S.selCap, c = S.doc.captions[i]; if (!c || p <= c.t + 0.02 || p >= capEnd(i) - 0.02) return false;
    edit((d) => { d.captions.push({ t: p, text: c.text }); d.captions.sort((a, b) => a.t - b.t); }); S.selCap = S.doc.captions.findIndex((q) => Math.abs(q.t - p) < 1e-6); return true;
  }
  if (S.selAud >= 0) {
    const a = S.doc.audio[S.selAud], len = clipLength(a), d = p - a.start; if (!a || d <= 0.02 || d >= len - 0.02) return false;
    edit((doc) => { const x = doc.audio[S.selAud]; doc.audio.push({ ...x, id: newId('aud'), start: p, offset: +((x.offset || 0) + d).toFixed(3), dur: +(len - d).toFixed(3) }); x.dur = +d.toFixed(3); });
    S.selAud = S.doc.audio.length - 1; return true;
  }
  // the edit itself: a new shot from the playhead with the same camera (pick another one with a right click)
  const cur = [...S.doc.cuts].reverse().find((c) => c.t <= p + 1e-6); if (!cur || Math.abs(cur.t - p) < 0.02) return false;
  edit((d) => { d.cuts.push({ t: p, camera: cur.camera }); d.cuts.sort((a, b) => a.t - b.t); }); S.selCut = S.doc.cuts.findIndex((c) => Math.abs(c.t - p) < 1e-6); return true;
}
/** Q / W: delete what is left / right of the playhead in the selected clip. */
export function trimAtPlayhead(side: 'L' | 'R') {
  const p = snapT(S.t), dur = S.doc.duration, ss = selSegObj();
  if (ss) {
    const { o, seg } = ss; if (p <= seg.a || p >= seg.b) return false;
    const ns = side === 'L' ? { a: p, b: seg.b } : { a: seg.a, b: p };
    edit(() => writeSegments(o, [...segmentsOf(o, dur).filter((q) => Math.abs(q.a - seg.a) > 1e-6), ns], dur)); S.selSeg = { obj: o.id, a: ns.a }; return true;
  }
  if (S.selCap >= 0) {
    const i = S.selCap, c = S.doc.captions[i]; if (!c || p <= c.t || p >= capEnd(i)) return false;
    edit((d) => { if (side === 'L') c.t = p; else { const nx = d.captions[i + 1]; if (nx && !nx.text) nx.t = p; else d.captions.push({ t: p, text: '' }); } d.captions.sort((a, b) => a.t - b.t); });
    S.selCap = S.doc.captions.indexOf(c); return true;
  }
  if (S.selAud >= 0) {
    const a = S.doc.audio[S.selAud], len = clipLength(a), d = p - a.start; if (!a || d <= 0 || d >= len) return false;
    edit((doc) => { const x = doc.audio[S.selAud]; if (side === 'L') { x.start = p; x.offset = +((x.offset || 0) + d).toFixed(3); x.dur = +(len - d).toFixed(3); } else x.dur = +d.toFixed(3); }); return true;
  }
  if (S.selCut >= 0) {
    const i = S.selCut; edit((d) => { if (side === 'L' && i > 0) d.cuts[i].t = p; else if (side === 'R' && d.cuts[i + 1]) d.cuts[i + 1].t = p; d.cuts.sort((a, b) => a.t - b.t); }); return true;
  }
  return false;
}
/** Up / Down: the previous / next edit point (cuts, captions, audio and clip edges). */
export function jumpEdit(dir: 1 | -1) {
  const pts = [...new Set(snapPoints().map((q) => +q.toFixed(3)))].sort((a, b) => a - b), t = S.t;
  const nx = dir > 0 ? pts.find((q) => q > t + 1e-3) : [...pts].reverse().find((q) => q < t - 1e-3);
  if (nx != null) { setTime(nx); const W = viewW(); if (xOf(nx) < NAME_W || xOf(nx) > W - 20) { scrollX = nx - (W - NAME_W) * 0.3 / pps; clamp(); } }
}
export function deleteSelectedKeys(): boolean {
  if (S.selKeys.length) {
    edit(() => { for (const s of S.selKeys) { const o = S.doc.objects.find((q) => q.id === s.obj); const ks = o?.tracks[s.track]; if (!ks) continue; const i = ks.findIndex((k) => Math.abs(k.t - s.t) < 1e-6); if (i >= 0) ks.splice(i, 1); if (!ks.length) delete o!.tracks[s.track]; } });
    S.selKeys = []; return true;
  }
  const ss = selSegObj();
  if (ss) {   // a clip of an object: it is no longer seen then (the last clip deletes the object: false here)
    const segs = segmentsOf(ss.o, S.doc.duration); if (segs.length <= 1) { S.selSeg = null; return false; }
    edit(() => writeSegments(ss.o, segs.filter((q) => Math.abs(q.a - ss.seg.a) > 1e-6), S.doc.duration)); S.selSeg = null; return true;
  }
  if (S.selAud >= 0) { const i = S.selAud; edit((d) => d.audio.splice(i, 1)); S.selAud = -1; return true; }
  if (S.selCut > 0) { const i = S.selCut; edit((d) => d.cuts.splice(i, 1)); S.selCut = -1; return true; }
  if (S.selCap >= 0) { const i = S.selCap; edit((d) => d.captions.splice(i, 1)); S.selCap = -1; return true; }
  return false;
}
function rightClick(e: PointerEvent, hit: Hit) {
  const row = hit.row; const items: any[] = [];
  if (row && (row.type === 'track' || row.type === 'obj') && hit.key) {
    const k = hit.key, o = row.o;
    if (row.type === 'track' && !isSel(o.id, row.key, k.t)) S.selKeys = [{ obj: o.id, track: row.key, t: k.t }];
    if (row.type === 'obj' && !S.selKeys.some((q) => q.obj === o.id && Math.abs(q.t - k.t) < 1e-6)) S.selKeys = Object.keys(o.tracks).filter((tk) => tk !== 'visible' && o.tracks[tk].some((q) => Math.abs(q.t - k.t) < 1e-6)).map((track) => ({ obj: o.id, track, t: k.t }));
    const targets = () => S.selKeys.map((s) => S.doc.objects.find((q) => q.id === s.obj)?.tracks[s.track]?.find((q) => Math.abs(q.t - s.t) < 1e-6)).filter(Boolean) as Key[];
    const k0 = targets()[0] || k;
    for (const ez of ['auto', 'smooth', 'linear', 'step'] as const) items.push({ label: { auto: 'Mượt (tự động)', smooth: 'Chậm-nhanh-chậm', linear: 'Đều', step: 'Giữ nguyên rồi nhảy' }[ez], checked: (k0.ease || 'auto') === ez, action: () => edit(() => { for (const q of targets()) q.ease = ez; }) });
    items.push({ sep: true }, { label: 'Xoá keyframe (Delete)', action: () => deleteSelectedKeys() });
    if (row.type === 'track' && propDef(o.kind, row.key)?.type === 'text') items.unshift({ label: 'Sửa chữ…', action: async () => { const v = await ask(propDef(o.kind, row.key)!.label, String(k.v), true); if (v != null) edit(() => { k.v = v; }); } }, { sep: true });
  } else if (row?.type === 'obj') {
    const o = row.o;
    if (hit.seg) { select(o.id); S.selSeg = { obj: o.id, a: hit.seg.a }; redraw(); }
    items.push({ label: 'Tách tại vạch đỏ (Ctrl/⌘ + B)', disabled: !hit.seg, action: () => splitAtPlayhead() },
      { label: 'Xoá phần bên trái vạch đỏ (Q)', disabled: !hit.seg, action: () => trimAtPlayhead('L') },
      { label: 'Xoá phần bên phải vạch đỏ (W)', disabled: !hit.seg, action: () => trimAtPlayhead('R') },
      { sep: true },
      { label: `Hiện từ ${fmtTime(snapT(hit.t))} đến hết`, action: () => { const t = snapT(hit.t), dur = S.doc.duration; edit(() => writeSegments(o, [...segmentsOf(o, dur).filter((q) => q.b <= t), { a: t, b: dur }], dur)); } },
      { label: expanded.has(o.id) ? 'Đóng chi tiết keyframe' : 'Mở chi tiết keyframe', action: () => { expanded.has(o.id) ? expanded.delete(o.id) : expanded.add(o.id); clamp(); redraw(); } });
    if (hit.seg && segmentsOf(o, S.doc.duration).length > 1) items.push({ label: 'Xoá clip này (Delete)', action: () => deleteSelectedKeys() });
  } else if (row?.type === 'cuts') {
    const t = snapT(hit.t);
    items.push({ label: `Cắt cảnh tại đây (${fmtTime(t)})`, action: () => addCutAt(t) });
    if (hit.cut != null) {
      const c = S.doc.cuts[hit.cut];
      items.push({ sep: true });
      for (const cam of S.doc.objects.filter((o) => o.kind === 'camera')) items.push({ label: `Quay bằng ${cam.name}`, checked: c.camera === cam.id, action: () => edit(() => { c.camera = cam.id; }) });
      if (hit.cut > 0) { items.push({ sep: true }); for (const f of [0, 6, 9, 12]) items.push({ label: f ? `Chuyển mờ ${f} khung` : 'Cắt thẳng', checked: (c.dissolve || 0) === f, action: () => edit(() => { if (f) c.dissolve = f; else delete c.dissolve; }) }); items.push({ sep: true }, { label: 'Xoá chỗ cắt', action: () => { const i = hit.cut!; edit((d) => d.cuts.splice(i, 1)); } }); }
    }
  } else if (row?.type === 'caps') {
    const t = snapT(hit.t);
    items.push({ label: 'Thêm phụ đề tại đây…', action: async () => { const s = await ask(`Phụ đề tại ${fmtTime(t)}`); if (s != null) edit((d) => { d.captions.push({ t, text: s }); d.captions.sort((a, b) => a.t - b.t); }); } });
    items.push({ label: 'Tắt phụ đề từ đây', action: () => edit((d) => { d.captions.push({ t, text: '' }); d.captions.sort((a, b) => a.t - b.t); }) });
    if (hit.cap != null) { const i = hit.cap; S.selCap = i; items.push({ sep: true }, { label: 'Sửa…', action: async () => { const s = await ask('Phụ đề', S.doc.captions[i].text); if (s != null) edit(() => { S.doc.captions[i].text = s; }); } }, { label: 'Tách tại vạch đỏ (Ctrl/⌘ + B)', action: () => splitAtPlayhead() }, { label: 'Xoá', action: () => edit((d) => d.captions.splice(i, 1)) }); }
  } else if (row?.type === 'audio' && hit.aud != null) {
    const i = hit.aud; S.selAud = i;
    items.push({ label: 'Âm lượng…', action: async () => { const s = await ask('Âm lượng (dB, 0 = giữ nguyên)', String(S.doc.audio[i].gain || 0)); if (s != null) edit((d) => { d.audio[i].gain = +s || 0; }); } },
      { label: 'Tách tại vạch đỏ (Ctrl/⌘ + B)', action: () => splitAtPlayhead() }, { label: 'Bỏ', action: () => edit((d) => d.audio.splice(i, 1)) });
  } else if (row?.type === 'track') {
    const o = row.o, key = row.key, t = snapT(hit.t);
    items.push({ label: `Thêm keyframe tại ${fmtTime(t)}`, action: () => edit(() => setValue(o, key, t, valueAt(o, key, t), true)) });
    if ((o.tracks[key] || []).length) items.push({ label: 'Xoá hết keyframe dòng này', action: () => edit(() => { delete o.tracks[key]; }) });
  }
  redraw();
  if (items.length) contextMenu(e.clientX, e.clientY, items);
}

// ---------------------------------------------------------------- toolbar
const KEYS_HELP = 'Phím tắt (giống CapCut): Space phát/dừng · Ctrl/⌘+B tách tại vạch đỏ · Q / W xoá phần trái / phải vạch đỏ · Delete xoá · ← → từng khung · ↑ ↓ điểm cắt trước / sau · Ctrl/⌘ + / − phóng to / thu nhỏ · Shift+Z vừa màn hình · Ctrl/⌘+Z hoàn tác · Ctrl/⌘+D nhân bản. Chuột: kéo khối để dời, kéo mép để cắt bớt, giữ Alt khi kéo để không hút. Touchpad: 2 ngón vuốt ngang để kéo trái phải, chụm/mở 2 ngón để thu phóng.';
function toolbar() {
  bar.replaceChildren(
    h('button', { title: 'Về đầu (Home)', onclick: () => setTime(0) }, 'Về đầu'),
    h('button', { class: 'play', title: 'Phát / dừng (Space)', onclick: () => { S.playing = !S.playing; emit('play'); } }, S.playing ? 'Dừng' : 'Phát'),
    h('span', { class: 'seg small', title: 'Khi sửa: đúng cho cả video, hay tạo keyframe tại vạch đỏ' },
      h('button', { class: S.apply === 'all' ? 'on' : '', onclick: () => { S.apply = 'all'; S.autoKey = false; emit('select'); toolbar(); } }, 'Sửa cả video'),
      h('button', { class: S.apply === 'key' ? 'on' : '', onclick: () => { S.apply = 'key'; S.autoKey = true; emit('select'); toolbar(); } }, 'Sửa từ đây (keyframe)')),
    h('span', { class: 'sep' }),
    h('button', { title: 'Tách khối đang chọn tại vạch đỏ (Ctrl/⌘ + B). Không chọn gì: tách cảnh quay.', onclick: () => splitAtPlayhead() }, 'Tách'),
    h('button', { title: 'Xoá phần bên trái vạch đỏ của khối đang chọn (Q)', onclick: () => trimAtPlayhead('L') }, 'Xoá trái'),
    h('button', { title: 'Xoá phần bên phải vạch đỏ của khối đang chọn (W)', onclick: () => trimAtPlayhead('R') }, 'Xoá phải'),
    h('button', { title: 'Chuyển sang camera khác tại vạch đỏ', onclick: () => addCutAt(snapT(S.t)) }, 'Cắt cảnh'),
    h('button', { title: 'Thêm phụ đề tại vạch đỏ', onclick: async () => { const t = snapT(S.t); const s = await ask(`Phụ đề tại ${fmtTime(t)}`); if (s != null) edit((d) => { d.captions.push({ t, text: s }); d.captions.sort((a, b) => a.t - b.t); }); } }, 'Phụ đề'),
    h('span', { class: 'sep' }),
    h('label', {}, 'Độ dài ', h('input', { type: 'number', step: 0.1, min: 0.5, value: S.doc.duration, class: 'num', onchange: (e: any) => edit((d) => { d.duration = Math.max(0.5, +e.target.value || d.duration); }) }), ' s'),
    h('button', { title: 'Độ dài vừa tới keyframe cuối', onclick: () => edit((d) => { d.duration = Math.max(1, +(contentEnd(d) + 0.5).toFixed(2)); }) }, 'Vừa'),
    h('span', { class: 'grow' }),
    h('span', { class: 'hint keyshelp', title: KEYS_HELP }, 'Phím tắt'),
    h('button', { title: 'Thu nhỏ (Ctrl/⌘ −)', onclick: () => zoom(1 / 1.4) }, '−'),
    h('input', { type: 'range', class: 'tlzoom', min: 0, max: 1000, value: zoomSlider(), title: 'Thu phóng timeline', oninput: (e: any) => { const f = +e.target.value / 1000, lo = Math.log(fitPps() * 0.5), hi = Math.log(2000); const W = viewW(), tAt = Math.max(scrollX, Math.min(S.t, tOf(W))), xAt = xOf(tAt); pps = Math.exp(lo + (hi - lo) * f); clamp(); scrollX = tAt - (xAt - NAME_W) / pps; clamp(); redraw(); } }),
    h('button', { title: 'Phóng to (Ctrl/⌘ +)', onclick: () => zoom(1.4) }, '+'),
    h('button', { title: 'Vừa màn hình (Shift+Z)', onclick: fit }, 'Vừa khung'),
  );
}
function zoomSlider() { const lo = Math.log(fitPps() * 0.5), hi = Math.log(2000); return Math.round(1000 * (Math.log(pps) - lo) / Math.max(1e-6, hi - lo)); }
function syncSlider() { const z = bar.querySelector('.tlzoom') as HTMLInputElement | null; if (z && document.activeElement !== z) z.value = String(zoomSlider()); }
export function zoom(f: number) { const W = viewW(); const tAt = Math.max(scrollX, Math.min(S.t, tOf(W))); const xAt = xOf(tAt); pps = pps * f; clamp(); scrollX = tAt - (xAt - NAME_W) / pps; clamp(); syncSlider(); redraw(); }
export function fit() { pps = fitPps(); scrollX = 0; clamp(); syncSlider(); redraw(); }
export function expand(id: string) { expanded.add(id); clamp(); redraw(); }
setInterval(syncSlider, 400);
