// The timeline: every object is a row, every animated property a track. Keys drag in time; text and choice
// tracks (expression, arms, lines) show as clips like an editor. Cameras cut on their own row; captions and audio too.
import { S, on, emit, select, setTime, edit, beginGesture, endGesture, changed, checkpoint, snapT, selObj } from '../state';
import { PROPS, propDef, valueAt, setValue, sortKeys, SceneObject, Key, Value, contentEnd, ARM_VI, EXPR_VI, POSE_VI } from '../doc';
const VI: Record<string, string> = { ...ARM_VI, ...EXPR_VI, ...POSE_VI };
import { contextMenu, ask, fmtTime, KIND_COLOR, h } from './dom';
import { audioDuration } from './audio';

const cv = document.getElementById('tl') as HTMLCanvasElement;
const ctx = cv.getContext('2d')!;
const bar = document.getElementById('tlbar')!;
const NAME_W = 210, RULER = 26, ROW = 24;
let pps = 90, scrollX = 0, scrollY = 0;       // pixels per second, seconds at the left edge, px scrolled down
const expanded = new Set<string>();
let need = true; const redraw = () => { need = true; };

type Row =
  | { type: 'cuts' } | { type: 'caps' } | { type: 'audio' }
  | { type: 'obj'; o: SceneObject }
  | { type: 'track'; o: SceneObject; key: string };

function rows(): Row[] {
  const out: Row[] = [{ type: 'cuts' }, { type: 'caps' }, { type: 'audio' }];
  for (const st of S.doc.stages) for (const o of S.doc.objects.filter((x) => x.stage === st.id)) {
    out.push({ type: 'obj', o });
    if (expanded.has(o.id) || o.id === S.sel) {
      const defs = PROPS[o.kind];
      const keys = defs.map((d) => d.key).filter((k) => (o.tracks[k] || []).length);
      // the selected object also shows its main tracks even before they have keys
      if (o.id === S.sel) for (const k of mainTracks(o)) if (!keys.includes(k)) keys.push(k);
      keys.sort((a, b) => defs.findIndex((d) => d.key === a) - defs.findIndex((d) => d.key === b));
      for (const k of keys) out.push({ type: 'track', o, key: k });
    }
  }
  return out;
}
function mainTracks(o: SceneObject) {
  if (o.kind === 'char') return ['pos', 'rotY', 'armL', 'armR', 'expr', 'say', 'walk'];
  if (o.kind === 'camera') return ['pos', 'target', 'fov'];
  if (o.kind === 'car') return ['pos', 'rotY', 'brake'];
  return ['pos', 'visible'];
}

// ---------------------------------------------------------------- geometry
const xOf = (t: number) => NAME_W + (t - scrollX) * pps;
const tOf = (x: number) => (x - NAME_W) / pps + scrollX;
const dpr = () => window.devicePixelRatio || 1;
function size() {
  const r = cv.getBoundingClientRect();
  cv.width = Math.round(r.width * dpr()); cv.height = Math.round(r.height * dpr()); redraw();
}
new ResizeObserver(size).observe(cv);

// ---------------------------------------------------------------- draw
const camColor = (id: string) => { let hsh = 0; for (const c of id) hsh = (hsh * 31 + c.charCodeAt(0)) >>> 0; return `hsl(${hsh % 360} 55% 46%)`; };
function fmtVal(v: Value) { if (Array.isArray(v)) return v.map((n) => n.toFixed(2)).join(', '); if (typeof v === 'number') return (+v.toFixed(3)).toString(); return String(v); }
const isSel = (o: string, track: string, t: number) => S.selKeys.some((k) => k.obj === o && k.track === track && Math.abs(k.t - t) < 1e-6);

function diamond(x: number, y: number, r: number, fill: string, stroke = '#111') {
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke();
}
function clipText(s: string, x: number, y: number, w: number) {
  if (w < 14) return; ctx.save(); ctx.beginPath(); ctx.rect(x, y - 12, w, 16); ctx.clip(); ctx.fillText(s, x + 4, y); ctx.restore();
}

function draw() {
  const W = cv.width / dpr(), H = cv.height / dpr();
  ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0);
  ctx.fillStyle = '#1b1e24'; ctx.fillRect(0, 0, W, H);
  ctx.font = '12px system-ui, sans-serif'; ctx.textBaseline = 'middle';
  const R = rows(), dur = S.doc.duration;
  // rows
  R.forEach((r, i) => {
    const y = RULER + i * ROW - scrollY; if (y + ROW < RULER || y > H) return;
    const selRow = (r.type === 'obj' || r.type === 'track') && r.o.id === S.sel;
    ctx.fillStyle = i % 2 ? '#1f232a' : '#22262e'; if (selRow) ctx.fillStyle = r.type === 'obj' ? '#2d3340' : '#272c37';
    ctx.fillRect(0, y, W, ROW);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(xOf(dur), y, Math.max(0, W - xOf(dur)), ROW);   // past the end
    ctx.save(); ctx.beginPath(); ctx.rect(NAME_W, y, W - NAME_W, ROW); ctx.clip();
    drawRow(r, y);
    ctx.restore();
    // name column
    ctx.fillStyle = selRow ? '#2d3340' : '#191c22'; ctx.fillRect(0, y, NAME_W, ROW);
    ctx.fillStyle = '#c9ced8';
    if (r.type === 'cuts') { ctx.fillStyle = '#6fb6ff'; ctx.fillText('Cắt cảnh', 12, y + ROW / 2); }
    else if (r.type === 'caps') { ctx.fillStyle = '#e8e8e8'; ctx.fillText('Phụ đề', 12, y + ROW / 2); }
    else if (r.type === 'audio') { ctx.fillStyle = '#9be38a'; ctx.fillText('Âm thanh', 12, y + ROW / 2); }
    else if (r.type === 'obj') {
      const open = expanded.has(r.o.id) || r.o.id === S.sel;
      ctx.fillStyle = '#8a92a0'; ctx.beginPath(); if (open) { ctx.moveTo(6, y + 9); ctx.lineTo(14, y + 9); ctx.lineTo(10, y + 15); } else { ctx.moveTo(7, y + 8); ctx.lineTo(13, y + 12); ctx.lineTo(7, y + 16); } ctx.fill();
      ctx.fillStyle = KIND_COLOR[r.o.kind]; ctx.fillRect(20, y + 7, 3, ROW - 14);
      ctx.fillStyle = r.o.hidden ? '#6a707c' : '#e6e9ef'; ctx.fillText(r.o.name, 28, y + ROW / 2);
    } else {
      const d = propDef(r.o.kind, r.key); const has = (r.o.tracks[r.key] || []).length;
      ctx.fillStyle = has ? '#b9c0cc' : '#6d7480'; ctx.fillText(d?.label || r.key, 36, y + ROW / 2);
      // key-at-playhead toggle
      const k = (r.o.tracks[r.key] || []).find((q) => Math.abs(q.t - S.t) < 1 / 120);
      diamond(NAME_W - 14, y + ROW / 2, 5, k ? '#ffb02e' : '#3a404b', '#0d0f12');
    }
    ctx.strokeStyle = '#14161a'; ctx.beginPath(); ctx.moveTo(0, y + ROW - 0.5); ctx.lineTo(W, y + ROW - 0.5); ctx.stroke();
  });
  // ruler
  ctx.fillStyle = '#15171c'; ctx.fillRect(0, 0, W, RULER);
  const step = [1 / 30, 1 / 15, 0.1, 0.2, 0.5, 1, 2, 5, 10, 30].find((s) => s * pps >= 60) || 60;
  ctx.fillStyle = '#8a92a0'; ctx.strokeStyle = '#3a404b';
  for (let t = Math.floor(scrollX / step) * step; xOf(t) < W; t += step) {
    const x = xOf(t); if (x < NAME_W) continue;
    ctx.beginPath(); ctx.moveTo(x + 0.5, RULER - 8); ctx.lineTo(x + 0.5, RULER); ctx.stroke();
    ctx.fillText(step < 1 ? fmtTime(t, S.doc.fps) : `${Math.round(t)}s`, x + 3, 9);
  }
  ctx.fillStyle = '#ff5050'; ctx.fillRect(xOf(dur) - 1, 0, 2, RULER);
  ctx.fillStyle = '#15171c'; ctx.fillRect(0, 0, NAME_W, RULER);
  ctx.fillStyle = '#c9ced8'; ctx.fillText(`${fmtTime(S.t, S.doc.fps)}  /  ${fmtTime(dur, S.doc.fps)}`, 10, RULER / 2);
  // playhead
  const px = xOf(S.t);
  if (px >= NAME_W) { ctx.fillStyle = '#ff4d4d'; ctx.fillRect(px - 1, 0, 2, H); ctx.beginPath(); ctx.moveTo(px - 6, 0); ctx.lineTo(px + 6, 0); ctx.lineTo(px, 9); ctx.fill(); }
  // box selection
  if (boxSel) { ctx.strokeStyle = '#ffb02e'; ctx.setLineDash([4, 3]); ctx.strokeRect(Math.min(boxSel.x0, boxSel.x1), Math.min(boxSel.y0, boxSel.y1), Math.abs(boxSel.x1 - boxSel.x0), Math.abs(boxSel.y1 - boxSel.y0)); ctx.setLineDash([]); }
}

function drawRow(r: Row, y: number) {
  const mid = y + ROW / 2, dur = S.doc.duration;
  if (r.type === 'cuts') {
    const cuts = S.doc.cuts;
    cuts.forEach((c, i) => {
      const x0 = xOf(c.t), x1 = xOf(i + 1 < cuts.length ? cuts[i + 1].t : dur);
      const cam = S.doc.objects.find((o) => o.id === c.camera);
      ctx.fillStyle = camColor(c.camera); ctx.globalAlpha = i === S.selCut ? 1 : 0.75; ctx.fillRect(x0 + 1, y + 3, x1 - x0 - 2, ROW - 6); ctx.globalAlpha = 1;
      if (i === S.selCut) { ctx.strokeStyle = '#fff'; ctx.strokeRect(x0 + 1.5, y + 3.5, x1 - x0 - 3, ROW - 7); }
      if (c.dissolve) { const d = c.dissolve / S.doc.fps * pps / 2; ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(x0 - d, y + ROW - 3); ctx.lineTo(x0 + d, y + 3); ctx.lineTo(x0 + d, y + ROW - 3); ctx.fill(); }
      ctx.fillStyle = '#fff'; clipText(cam ? cam.name : '(camera đã xoá)', x0, mid, x1 - x0);
    });
  } else if (r.type === 'caps') {
    const caps = S.doc.captions;
    caps.forEach((c, i) => {
      if (!c.text) return;
      const x0 = xOf(c.t), x1 = xOf(i + 1 < caps.length ? caps[i + 1].t : Math.min(dur, c.t + 1.2));
      ctx.fillStyle = i === S.selCap ? '#f0f0f0' : '#a9adb5'; ctx.fillRect(x0 + 1, y + 4, Math.max(3, x1 - x0 - 2), ROW - 8);
      ctx.fillStyle = '#111'; clipText(c.text, x0, mid, x1 - x0);
    });
  } else if (r.type === 'audio') {
    for (const a of S.doc.audio) {
      const d = audioDuration(a.id, a.file) || 3, x0 = xOf(a.start), x1 = xOf(a.start + d);
      ctx.fillStyle = '#3f7f3a'; ctx.fillRect(x0, y + 3, x1 - x0, ROW - 6);
      ctx.strokeStyle = '#7fd17f'; ctx.beginPath();
      for (let x = x0 + 2; x < x1 - 2; x += 3) { const a2 = (Math.sin(x * 0.37) * Math.sin(x * 0.051) * 0.5 + 0.5) * (ROW - 10) / 2; ctx.moveTo(x, mid - a2); ctx.lineTo(x, mid + a2); }
      ctx.stroke(); ctx.fillStyle = '#eaffea'; clipText(a.name || a.file, x0, mid, x1 - x0);
    }
  } else if (r.type === 'obj') {
    const times = new Set<number>();
    for (const ks of Object.values(r.o.tracks)) for (const k of ks) times.add(k.t);
    ctx.strokeStyle = KIND_COLOR[r.o.kind]; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(NAME_W, mid); ctx.lineTo(xOf(dur), mid); ctx.stroke(); ctx.globalAlpha = 1;
    for (const t of times) diamond(xOf(t), mid, 4, '#9aa3b2', '#111');
  } else {
    const d = propDef(r.o.kind, r.key)!, keys = r.o.tracks[r.key] || [];
    if (d && (d.type === 'enum' || d.type === 'text' || d.type === 'bool')) {
      keys.forEach((k, i) => {
        const x0 = xOf(k.t), x1 = xOf(i + 1 < keys.length ? keys[i + 1].t : Math.max(dur, k.t + 0.5));
        const txt = String(k.v), empty = txt === '' || k.v === false;
        ctx.fillStyle = empty ? 'rgba(255,255,255,0.05)' : d.type === 'text' ? '#5b4a8a' : d.type === 'bool' ? '#3d6b4f' : '#3c5a86';
        ctx.fillRect(x0, y + 4, x1 - x0, ROW - 8);
        ctx.fillStyle = '#eef'; clipText(d.type === 'bool' ? (k.v ? 'bật' : 'tắt') : (VI[txt] || txt), x0 + 6, mid, x1 - x0 - 6);
        diamond(x0, mid, 5, isSel(r.o.id, r.key, k.t) ? '#ffb02e' : '#d9dde6');
      });
    } else {
      if (keys.length > 1) { ctx.strokeStyle = '#4a5160'; ctx.beginPath(); ctx.moveTo(xOf(keys[0].t), mid); ctx.lineTo(xOf(keys[keys.length - 1].t), mid); ctx.stroke(); }
      for (const k of keys) {
        const e = k.ease || 'auto';
        diamond(xOf(k.t), mid, 5, isSel(r.o.id, r.key, k.t) ? '#ffb02e' : e === 'step' ? '#c07070' : e === 'linear' ? '#9ad0ff' : '#d9dde6');
      }
      if (keys.length === 1) { ctx.fillStyle = '#7d8492'; ctx.fillText(fmtVal(keys[0].v), xOf(keys[0].t) + 10, mid); }
    }
  }
}

function loop() { requestAnimationFrame(loop); if (need) { need = false; draw(); } }
requestAnimationFrame(loop);
on('doc', () => { redraw(); toolbar(); }); on('time', () => { follow(); redraw(); }); on('select', () => { redraw(); toolbar(); }); on('play', toolbar);

function follow() {   // keep the playhead in view while playing
  const W = cv.width / dpr(); if (!S.playing) return;
  if (xOf(S.t) > W - 40) scrollX = S.t - (W - NAME_W) * 0.2 / pps;
  if (xOf(S.t) < NAME_W) scrollX = Math.max(0, S.t - 0.5);
}

// ---------------------------------------------------------------- hit testing
interface Hit { row: Row | null; ri: number; t: number; key?: Key; cut?: number; cutEdge?: boolean; cap?: number; aud?: number; name?: boolean; toggle?: boolean; keyBtn?: boolean }
function hitAt(x: number, y: number): Hit {
  const R = rows(), ri = Math.floor((y - RULER + scrollY) / ROW), row = y < RULER ? null : R[ri] || null, t = tOf(x);
  const hit: Hit = { row, ri, t };
  if (!row) return hit;
  if (x < NAME_W) { hit.name = true; hit.toggle = row.type === 'obj' && x < 18; hit.keyBtn = row.type === 'track' && x > NAME_W - 24; return hit; }
  const near = (tt: number) => Math.abs(xOf(tt) - x) <= 6;
  if (row.type === 'track') hit.key = (row.o.tracks[row.key] || []).find((k) => near(k.t));
  if (row.type === 'obj') { for (const ks of Object.values(row.o.tracks)) { const k = ks.find((q) => near(q.t)); if (k) { hit.key = k; break; } } }
  if (row.type === 'cuts') {
    const cuts = S.doc.cuts;
    for (let i = cuts.length - 1; i >= 0; i--) { if (i > 0 && near(cuts[i].t)) { hit.cut = i; hit.cutEdge = true; break; } if (t >= cuts[i].t) { hit.cut = i; break; } }
  }
  if (row.type === 'caps') { const caps = S.doc.captions; for (let i = caps.length - 1; i >= 0; i--) if (t >= caps[i].t - 2 / pps) { if (t <= (caps[i + 1]?.t ?? caps[i].t + 1.2)) hit.cap = i; break; } }
  if (row.type === 'audio') S.doc.audio.forEach((a, i) => { if (t >= a.start && t <= a.start + (audioDuration(a.id, a.file) || 3)) hit.aud = i; });
  return hit;
}

// ---------------------------------------------------------------- input
let drag: null | { kind: 'scrub' | 'keys' | 'cut' | 'cap' | 'aud' | 'box'; x0: number; t0: number; moved?: boolean; orig?: Array<{ k: Key; t: number; o: SceneObject; track: string }>; idx?: number } = null;
let boxSel: null | { x0: number; y0: number; x1: number; y1: number } = null;
const local = (e: MouseEvent) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

cv.addEventListener('contextmenu', (e) => e.preventDefault());
cv.addEventListener('pointerdown', (e) => {
  if (S.playing) { S.playing = false; emit('play'); }
  const { x, y } = local(e); const hit = hitAt(x, y);
  if (e.button === 2) return rightClick(e, hit);
  cv.setPointerCapture(e.pointerId);
  if (y < RULER) { drag = { kind: 'scrub', x0: x, t0: 0 }; if (x >= NAME_W) setTime(snapT(tOf(x))); return; }
  const row = hit.row; if (!row) { S.selKeys = []; redraw(); return; }
  if (hit.name) {
    if (row.type === 'obj') { if (hit.toggle) { expanded.has(row.o.id) ? expanded.delete(row.o.id) : expanded.add(row.o.id); redraw(); } else select(row.o.id); }
    else if (row.type === 'track') { if (S.sel !== row.o.id) select(row.o.id); if (hit.keyBtn) toggleKeyAtPlayhead(row.o, row.key); }
    return;
  }
  if (row.type === 'obj' || row.type === 'track') { if (S.sel !== row.o.id) { S.sel = row.o.id; emit('select'); } }
  if (hit.key && (row.type === 'track' || row.type === 'obj')) {
    const o = row.o;
    const refs = row.type === 'track' ? [{ track: row.key }] : Object.keys(o.tracks).filter((tk) => o.tracks[tk].some((k) => Math.abs(k.t - hit.key!.t) < 1e-6)).map((track) => ({ track }));
    const already = refs.every((r) => isSel(o.id, r.track, hit.key!.t));
    if (!e.shiftKey && !already) S.selKeys = [];
    for (const r of refs) if (!isSel(o.id, r.track, hit.key!.t)) S.selKeys.push({ obj: o.id, track: r.track, t: hit.key!.t });
    const orig = S.selKeys.map((s) => { const ob = S.doc.objects.find((q) => q.id === s.obj)!; return { k: (ob?.tracks[s.track] || []).find((k) => Math.abs(k.t - s.t) < 1e-6)!, t: s.t, o: ob, track: s.track }; }).filter((q) => q.k);
    beginGesture(); checkpoint();
    drag = { kind: 'keys', x0: x, t0: hit.t, orig }; emit('keys'); redraw(); return;
  }
  if (row.type === 'cuts' && hit.cut != null) {
    S.selCut = hit.cut; S.selCap = -1; const c = S.doc.cuts[hit.cut]; S.sel = c.camera; emit('select');
    if (hit.cutEdge) { beginGesture(); checkpoint(); drag = { kind: 'cut', x0: x, t0: c.t, idx: hit.cut }; }
    else { setTime(snapT(hit.t)); drag = { kind: 'scrub', x0: x, t0: 0 }; }
    redraw(); return;
  }
  if (row.type === 'caps' && hit.cap != null) { S.selCap = hit.cap; S.selCut = -1; beginGesture(); checkpoint(); drag = { kind: 'cap', x0: x, t0: S.doc.captions[hit.cap].t, idx: hit.cap }; redraw(); return; }
  if (row.type === 'audio' && hit.aud != null) { beginGesture(); checkpoint(); drag = { kind: 'aud', x0: x, t0: S.doc.audio[hit.aud].start, idx: hit.aud }; return; }
  // empty space: move the playhead, or box-select keys with Shift / Ctrl
  if (e.shiftKey || e.ctrlKey) { boxSel = { x0: x, y0: y, x1: x, y1: y }; drag = { kind: 'box', x0: x, t0: 0 }; return; }
  S.selKeys = []; S.selCut = -1; S.selCap = -1; setTime(snapT(hit.t)); drag = { kind: 'scrub', x0: x, t0: 0 }; redraw();
});

cv.addEventListener('pointermove', (e) => {
  const { x, y } = local(e);
  if (!drag) { const hit = hitAt(x, y); cv.style.cursor = hit.key || hit.cutEdge ? 'ew-resize' : hit.cap != null || hit.aud != null ? 'grab' : 'default'; return; }
  const dt = (x - drag.x0) / pps;
  const snap = (t: number) => (e.altKey ? +t.toFixed(3) : snapT(t));
  if (drag.kind === 'scrub') { setTime(snapT(Math.max(0, tOf(Math.max(NAME_W, x))))); return; }
  if (drag.kind === 'box') { boxSel!.x1 = x; boxSel!.y1 = y; redraw(); return; }
  if (drag.kind === 'keys') {
    const minT = Math.min(...drag.orig!.map((q) => q.t)); const d = Math.max(-minT, dt);
    for (const q of drag.orig!) q.k.t = Math.max(0, snap(q.t + d));
    S.selKeys = drag.orig!.map((q) => ({ obj: q.o.id, track: q.track, t: q.k.t }));
    drag.moved = true; changed(); return;
  }
  if (drag.kind === 'cut') { S.doc.cuts[drag.idx!].t = Math.max(0, snap(drag.t0 + dt)); drag.moved = true; changed(); return; }
  if (drag.kind === 'cap') { S.doc.captions[drag.idx!].t = Math.max(0, snap(drag.t0 + dt)); drag.moved = true; changed(); return; }
  if (drag.kind === 'aud') { S.doc.audio[drag.idx!].start = Math.max(0, snap(drag.t0 + dt)); drag.moved = true; changed(); return; }
});
cv.addEventListener('pointerup', () => {
  if (!drag) return;
  if (drag.kind === 'box' && boxSel) {
    const R = rows(), t0 = tOf(Math.min(boxSel.x0, boxSel.x1)), t1 = tOf(Math.max(boxSel.x0, boxSel.x1));
    const r0 = Math.floor((Math.min(boxSel.y0, boxSel.y1) - RULER + scrollY) / ROW), r1 = Math.floor((Math.max(boxSel.y0, boxSel.y1) - RULER + scrollY) / ROW);
    for (let i = Math.max(0, r0); i <= Math.min(R.length - 1, r1); i++) {
      const r = R[i]; if (r.type !== 'track' && r.type !== 'obj') continue;
      const tracks = r.type === 'track' ? [r.key] : Object.keys(r.o.tracks);
      for (const tk of tracks) for (const k of r.o.tracks[tk] || []) if (k.t >= t0 && k.t <= t1 && !isSel(r.o.id, tk, k.t)) S.selKeys.push({ obj: r.o.id, track: tk, t: k.t });
    }
    boxSel = null; redraw();
  }
  if (drag.kind === 'keys' || drag.kind === 'cut' || drag.kind === 'cap' || drag.kind === 'aud') {
    if (drag.kind === 'keys') for (const q of drag.orig!) sortKeys(q.o);
    if (drag.kind === 'cut') S.doc.cuts.sort((a, b) => a.t - b.t);
    if (drag.kind === 'cap') S.doc.captions.sort((a, b) => a.t - b.t);
    endGesture(); if (drag.moved) changed();
  }
  drag = null;
});

cv.addEventListener('dblclick', async (e) => {
  const { x, y } = local(e); const hit = hitAt(x, y); const row = hit.row; if (!row || x < NAME_W) return;
  const t = snapT(hit.t);
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

cv.addEventListener('wheel', (e) => {
  e.preventDefault(); const { x } = local(e);
  if (e.ctrlKey) { const tAt = tOf(x); pps = Math.max(8, Math.min(2000, pps * Math.exp(-e.deltaY * 0.0015))); scrollX = Math.max(0, tAt - (x - NAME_W) / pps); }
  else if (e.shiftKey) scrollX = Math.max(0, scrollX + e.deltaY / pps);
  else { const max = Math.max(0, rows().length * ROW - (cv.height / dpr() - RULER - 10)); scrollY = Math.max(0, Math.min(max, scrollY + e.deltaY * 0.5)); }
  redraw();
}, { passive: false });

// ---------------------------------------------------------------- actions
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
export function deleteSelectedKeys(): boolean {
  if (S.selKeys.length) {
    edit(() => { for (const s of S.selKeys) { const o = S.doc.objects.find((q) => q.id === s.obj); const ks = o?.tracks[s.track]; if (!ks) continue; const i = ks.findIndex((k) => Math.abs(k.t - s.t) < 1e-6); if (i >= 0) ks.splice(i, 1); if (!ks.length) delete o!.tracks[s.track]; } });
    S.selKeys = []; return true;
  }
  if (S.selCut > 0) { const i = S.selCut; edit((d) => d.cuts.splice(i, 1)); S.selCut = -1; return true; }
  if (S.selCap >= 0) { const i = S.selCap; edit((d) => d.captions.splice(i, 1)); S.selCap = -1; return true; }
  return false;
}
function rightClick(e: PointerEvent, hit: Hit) {
  const row = hit.row; const items: any[] = [];
  if (row && (row.type === 'track' || row.type === 'obj') && hit.key) {
    const k = hit.key, o = row.o;
    if (!isSel(o.id, row.type === 'track' ? row.key : '', k.t) && row.type === 'track') S.selKeys = [{ obj: o.id, track: row.key, t: k.t }];
    const targets = () => S.selKeys.map((s) => S.doc.objects.find((q) => q.id === s.obj)?.tracks[s.track]?.find((q) => Math.abs(q.t - s.t) < 1e-6)).filter(Boolean) as Key[];
    for (const ez of ['auto', 'smooth', 'linear', 'step'] as const) items.push({ label: { auto: 'Mượt (tự động)', smooth: 'Chậm-nhanh-chậm', linear: 'Đều', step: 'Giữ nguyên rồi nhảy' }[ez], checked: (k.ease || 'auto') === ez, action: () => edit(() => { for (const q of targets()) q.ease = ez; }) });
    items.push({ sep: true }, { label: 'Xoá keyframe', action: () => deleteSelectedKeys() });
    if (row.type === 'track' && propDef(o.kind, row.key)?.type === 'text') items.unshift({ label: 'Sửa chữ…', action: async () => { const v = await ask(propDef(o.kind, row.key)!.label, String(k.v), true); if (v != null) edit(() => { k.v = v; }); } }, { sep: true });
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
    if (hit.cap != null) { const i = hit.cap; items.push({ sep: true }, { label: 'Sửa…', action: async () => { const s = await ask('Phụ đề', S.doc.captions[i].text); if (s != null) edit(() => { S.doc.captions[i].text = s; }); } }, { label: 'Xoá', action: () => edit((d) => d.captions.splice(i, 1)) }); }
  } else if (row?.type === 'audio' && hit.aud != null) {
    const i = hit.aud; items.push({ label: 'Âm lượng…', action: async () => { const s = await ask('Âm lượng (dB, 0 = giữ nguyên)', String(S.doc.audio[i].gain || 0)); if (s != null) edit((d) => { d.audio[i].gain = +s || 0; }); } }, { label: 'Bỏ', action: () => edit((d) => d.audio.splice(i, 1)) });
  } else if (row?.type === 'track') {
    const o = row.o, key = row.key, t = snapT(hit.t);
    items.push({ label: `Thêm keyframe tại ${fmtTime(t)}`, action: () => edit(() => setValue(o, key, t, valueAt(o, key, t), true)) });
    if ((o.tracks[key] || []).length) items.push({ label: 'Xoá hết keyframe dòng này', action: () => edit(() => { delete o.tracks[key]; }) });
  }
  if (items.length) contextMenu(e.clientX, e.clientY, items);
}

// ---------------------------------------------------------------- toolbar
function toolbar() {
  bar.replaceChildren(
    h('button', { title: 'Về đầu (Home)', onclick: () => setTime(0) }, 'Về đầu'),
    h('button', { class: 'play', title: 'Phát / dừng (Space)', onclick: () => { S.playing = !S.playing; emit('play'); } }, S.playing ? 'Dừng' : 'Phát'),
    h('span', { class: 'seg small', title: 'Khi sửa: đúng cho cả video, hay tạo keyframe tại vạch đỏ' },
      h('button', { class: S.apply === 'all' ? 'on' : '', onclick: () => { S.apply = 'all'; S.autoKey = false; emit('select'); toolbar(); } }, 'Sửa cả video'),
      h('button', { class: S.apply === 'key' ? 'on' : '', onclick: () => { S.apply = 'key'; S.autoKey = true; emit('select'); toolbar(); } }, 'Sửa từ đây (keyframe)')),
    h('span', { class: 'sep' }),
    h('button', { title: 'Chuyển sang camera khác tại vạch đỏ', onclick: () => addCutAt(snapT(S.t)) }, 'Cắt cảnh tại đây'),
    h('button', { title: 'Thêm phụ đề tại vạch đỏ', onclick: async () => { const t = snapT(S.t); const s = await ask(`Phụ đề tại ${fmtTime(t)}`); if (s != null) edit((d) => { d.captions.push({ t, text: s }); d.captions.sort((a, b) => a.t - b.t); }); } }, 'Thêm phụ đề'),
    h('span', { class: 'sep' }),
    h('label', {}, 'Độ dài ', h('input', { type: 'number', step: 0.1, min: 0.5, value: S.doc.duration, class: 'num', onchange: (e: any) => edit((d) => { d.duration = Math.max(0.5, +e.target.value || d.duration); }) }), ' s'),
    h('button', { title: 'Độ dài vừa tới keyframe cuối', onclick: () => edit((d) => { d.duration = Math.max(1, +(contentEnd(d) + 0.5).toFixed(2)); }) }, 'Vừa'),
    h('span', { class: 'grow' }),
    h('span', { class: 'hint' }, 'Kéo vạch đỏ để tua. Bấm tên để mở chi tiết. Kéo keyframe để dời. Bấm đúp ô màu để sửa. Chuột phải để xem thêm. Ctrl + lăn để phóng to.'),
    h('button', { title: 'Thu nhỏ (-)', onclick: () => zoom(1 / 1.4) }, 'Thu'),
    h('button', { title: 'Vừa màn hình', onclick: fit }, 'Vừa'),
    h('button', { title: 'Phóng to (=)', onclick: () => zoom(1.4) }, 'Phóng'),
  );
}
export function zoom(f: number) { const W = cv.width / dpr(); const tAt = Math.max(scrollX, Math.min(S.t, tOf(W))); const xAt = xOf(tAt); pps = Math.max(8, Math.min(2000, pps * f)); scrollX = Math.max(0, tAt - (xAt - NAME_W) / pps); redraw(); }
export function fit() { const W = cv.getBoundingClientRect().width || 800; pps = Math.max(8, (W - NAME_W - 30) / Math.max(1, S.doc.duration)); scrollX = 0; redraw(); }
export function expand(id: string) { expanded.add(id); redraw(); }
