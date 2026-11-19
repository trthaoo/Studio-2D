// Performance log: one session per studio page load. Measures how the view runs on this machine (frames a second,
// frame times, slow frames, CPU time per frame, preview quality, memory, long tasks of the page) and saves it to
// Logs/perf/sessions/<id>.json through the studio back end, every few seconds and when the page closes.
// Video renders (Xuất video) are logged by the back end against the session that started them.
import { renderer } from 'engine/core.js';

export interface PerfSample { t: number; fps: number; ms: number; p90: number; cpu: number; lvl: number; w: number; h: number; heap: number | null; play: boolean }
export interface PerfEvent { t: number; kind: string; text: string }
export interface PerfSession {
  id: string; started: string; ended: string; seconds: number;
  machine: { gpu: string; vendor: string; cores: number | null; memoryGB: number | null; dpr: number; screen: string; refreshHz: number; browser: string; platform: string };
  projects: string[];
  totals: {
    frames: number;            // frames drawn while something moved (playing, scrubbing, dragging)
    movingSeconds: number;     // time spent moving
    playSeconds: number;       // of which playing
    stills: number;            // single frames drawn (a click, a change)
    slow: number;              // moving frames slower than 33 ms (under 30 a second)
    jank: number;              // moving frames slower than 50 ms (a visible stutter)
    cpuMs: number;             // sum of CPU time to draw the moving frames
    stillCpuMs: number;
    longTasks: number; longTaskMs: number;   // page busy over 50 ms at a time (UI freezes)
    levelSeconds: number[];    // time moving at each preview level (0 = sharpest)
    levelChanges: number;
    heapMaxMB: number | null;
  };
  hist: number[];              // moving frame times: count per 2 ms (last bucket = 200 ms or more)
  samples: PerfSample[];       // one a second while moving
  events: PerfEvent[];
}

const BUCKET = 2, NB = 101;
const now = () => performance.now();
const pad = (n: number) => String(n).padStart(2, '0');
function newId() { const d = new Date(); return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${Math.random().toString(36).slice(2, 6)}`; }
function gpuInfo() {
  try {
    const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    const g = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    const v = String(ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR));
    return { gpu: g.replace(/^ANGLE \((.*)\)$/, '$1'), vendor: v };
  } catch { return { gpu: 'unknown', vendor: '' }; }
}
function browserName() {
  const ua = navigator.userAgent, m = ua.match(/Edg\/(\d+)/) || ua.match(/Chrome\/(\d+)/) || ua.match(/Firefox\/(\d+)/) || ua.match(/Version\/(\d+).*Safari/);
  return m ? `${/Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : 'Safari'} ${m[1]}` : ua.slice(0, 60);
}
const heapMB = () => { const m = (performance as any).memory; return m ? Math.round(m.usedJSHeapSize / 1048576) : null; };

const t0 = now();
export const session: PerfSession = {
  id: newId(), started: new Date().toISOString(), ended: '', seconds: 0,
  machine: { ...gpuInfo(), cores: navigator.hardwareConcurrency || null, memoryGB: (navigator as any).deviceMemory ?? null, dpr: window.devicePixelRatio || 1,
    screen: `${screen.width}x${screen.height}`, refreshHz: 60, browser: browserName(), platform: (navigator as any).userAgentData?.platform || navigator.platform || '' },
  projects: [],
  totals: { frames: 0, movingSeconds: 0, playSeconds: 0, stills: 0, slow: 0, jank: 0, cpuMs: 0, stillCpuMs: 0, longTasks: 0, longTaskMs: 0, levelSeconds: [0, 0, 0, 0, 0], levelChanges: 0, heapMaxMB: heapMB() },
  hist: new Array(NB).fill(0), samples: [], events: [],
};
const secs = () => +((now() - t0) / 1000).toFixed(2);
let dirty = true;
export function event(kind: string, text: string) { session.events.push({ t: secs(), kind, text }); if (session.events.length > 500) session.events.shift(); dirty = true; }

// the current second while moving
let sec = { start: 0, n: 0, times: [] as number[], cpu: 0, play: false, lvl: 0, w: 0, h: 0 };
let curLevel = -1;
function flushSecond() {
  if (sec.n >= 2 && sec.times.length) {
    const s = [...sec.times].sort((a, b) => a - b), span = (sec.times.reduce((a, b) => a + b, 0)) / 1000;
    session.samples.push({ t: +((sec.start - t0) / 1000).toFixed(1), fps: +(sec.times.length / Math.max(0.05, span)).toFixed(1), ms: +s[s.length >> 1].toFixed(1), p90: +s[Math.floor(s.length * 0.9)].toFixed(1),
      cpu: +(sec.cpu / sec.n).toFixed(2), lvl: sec.lvl, w: sec.w, h: sec.h, heap: heapMB(), play: sec.play });
    if (session.samples.length > 7200) session.samples.splice(0, session.samples.length - 7200);
    dirty = true;
  }
  sec = { start: 0, n: 0, times: [], cpu: 0, play: false, lvl: 0, w: 0, h: 0 };
}

/** Every frame the view draws. interval: ms since the previous drawn frame (0 if none); moving: part of a run of frames. */
export function frame(o: { interval: number; cpu: number; moving: boolean; playing: boolean; level: number; w: number; h: number; vsync: number }) {
  const T = session.totals, ts = now();
  session.machine.refreshHz = Math.round(1000 / o.vsync);
  if (!o.moving) { T.stills++; T.stillCpuMs += o.cpu; if (sec.n) flushSecond(); dirty = true; return; }
  if (o.level !== curLevel) { if (curLevel >= 0) { T.levelChanges++; event('quality', `Mức ${curLevel} → ${o.level} (${o.w}x${o.h})`); } curLevel = o.level; }
  T.frames++; T.cpuMs += o.cpu;
  if (o.interval > 0 && o.interval < 1000) {
    T.movingSeconds += o.interval / 1000; if (o.playing) T.playSeconds += o.interval / 1000;
    T.levelSeconds[o.level] = (T.levelSeconds[o.level] || 0) + o.interval / 1000;
    session.hist[Math.min(NB - 1, Math.floor(o.interval / BUCKET))]++;
    if (o.interval > 33.4) T.slow++; if (o.interval > 50) T.jank++;
  }
  if (!sec.n) sec.start = ts;
  sec.n++; sec.cpu += o.cpu; sec.play ||= o.playing; sec.lvl = Math.max(sec.lvl, o.level); sec.w = o.w; sec.h = o.h;
  if (o.interval > 0 && o.interval < 1000) sec.times.push(o.interval);
  if (ts - sec.start >= 1000) flushSecond();
}
export function projectOpened(name: string, ms: number) {
  if (name && !session.projects.includes(name)) session.projects.push(name);
  event('project', `Mở "${name}" (${Math.round(ms)} ms)`);
}

// page freezes (long tasks) and memory
try {
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { session.totals.longTasks++; session.totals.longTaskMs += e.duration; } dirty = true; }).observe({ type: 'longtask', buffered: true });
} catch { /* not supported */ }

// ---------------------------------------------------------------- saving
function snapshot(): PerfSession {
  session.seconds = secs(); session.ended = new Date().toISOString();
  const h = heapMB(); if (h != null) session.totals.heapMaxMB = Math.max(session.totals.heapMaxMB || 0, h);
  const T = session.totals; T.cpuMs = +T.cpuMs.toFixed(1); T.stillCpuMs = +T.stillCpuMs.toFixed(1); T.longTaskMs = Math.round(T.longTaskMs);
  T.movingSeconds = +T.movingSeconds.toFixed(2); T.playSeconds = +T.playSeconds.toFixed(2); T.levelSeconds = T.levelSeconds.map((x) => +x.toFixed(2));
  return session;
}
async function save() {
  if (!dirty) return; dirty = false;
  try { await fetch(`/api/perf?id=${session.id}`, { method: 'PUT', body: JSON.stringify(snapshot()) }); } catch { dirty = true; }
}
setInterval(save, 15000);
setInterval(() => { const h = heapMB(); if (h != null && h > (session.totals.heapMaxMB || 0)) { session.totals.heapMaxMB = h; dirty = true; } }, 5000);
window.addEventListener('pagehide', () => { if (sec.n) flushSecond(); navigator.sendBeacon(`/api/perf?id=${session.id}`, new Blob([JSON.stringify(snapshot())], { type: 'application/json' })); });
event('start', `Mở studio (${session.machine.gpu})`);

/** Summary numbers of a session (also used for the table and the CSV). */
export function summary(s: PerfSession) {
  const T = s.totals, n = s.hist.reduce((a, b) => a + b, 0);
  const pct = (q: number) => { if (!n) return null; let c = 0; for (let i = 0; i < s.hist.length; i++) { c += s.hist[i]; if (c >= q * n) return (i + 0.5) * BUCKET; } return null; };
  const lvl = T.levelSeconds.indexOf(Math.max(...T.levelSeconds));
  return {
    fps: T.movingSeconds > 0 ? +(n / T.movingSeconds).toFixed(1) : null,
    ms50: pct(0.5), ms90: pct(0.9), ms99: pct(0.99),
    slowPct: n ? +(T.slow / n * 100).toFixed(1) : null, jankPct: n ? +(T.jank / n * 100).toFixed(1) : null,
    cpu: T.frames ? +(T.cpuMs / T.frames).toFixed(2) : null,
    level: T.movingSeconds > 0 ? lvl : null,
  };
}
