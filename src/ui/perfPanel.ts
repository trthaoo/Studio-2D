// Nhật ký hiệu năng: how the studio ran in every session on this machine (view frames a second, frame times, slow
// frames, CPU per frame, preview level, page freezes, memory) and how fast every video render went. Data: src/perf.ts
// (sessions) and the back end (renders), saved in Logs/perf/. CSV / JSON downloads for analysis elsewhere.
import { h } from './dom';
import { toast } from '../state';
import { session as live, summary, PerfSession } from '../perf';

const LEVEL_VI = ['0 (nét nhất)', '1', '2', '3', '4 (nhẹ nhất)'];
const LEVEL_COLOR = ['#2f6f4f', '#4f7a3a', '#8a7a2a', '#9a5a2a', '#9a3a3a'];
const num = (v: number | null | undefined, d = 1) => (v == null || !isFinite(v) ? '–' : v.toFixed(d));
const dur = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)} giờ ${Math.round((s % 3600) / 60)} phút` : s >= 60 ? `${Math.floor(s / 60)} phút ${Math.round(s % 60)} giây` : `${Math.round(s)} giây`);
const when = (iso: string) => { const d = new Date(iso); return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };

interface RenderRec { at: string; session: string; project: string; state: string; layers: boolean; layerCount: number | null; frames: number | null; framesDone: number; videoFps: number | null; from: number | null; to: number | null; width: number; height: number; loopSeconds: number | null; totalSeconds: number; renderFps: number | null; msPerFrame: number | null; realtime: number | null }
type SessionRow = Omit<PerfSession, 'samples'> & { sampleCount: number };

let back: HTMLElement | null = null, liveTimer = 0;
let data: { sessions: SessionRow[]; renders: RenderRec[] } = { sessions: [], renders: [] };
let picked = '';

export async function showPerf() {
  back?.remove();
  back = h('div', { class: 'modal-back', onclick: (e: MouseEvent) => { if (e.target === back) close(); } });
  document.body.append(back);
  picked = live.id;
  await load(); render();
  clearInterval(liveTimer); liveTimer = window.setInterval(() => { if (back?.isConnected) renderLive(); else clearInterval(liveTimer); }, 1000);
}
function close() { back?.remove(); back = null; clearInterval(liveTimer); }
async function load() {
  try { data = await (await fetch('/api/perf')).json(); } catch { data = { sessions: [], renders: [] }; }
  // this session from memory (the saved copy can be up to 15 s old)
  const { samples, ...cur } = live; cur.seconds = +(performance.now() / 1000).toFixed(1);
  data.sessions = [{ ...cur, sampleCount: samples.length }, ...data.sessions.filter((x) => x.id !== live.id)];
}

// ---------------------------------------------------------------- layout
const liveBox = h('div', { class: 'perf-tiles' });
function tile(label: string, value: string, sub = '', tone = '') { return h('div', { class: 'perf-tile ' + tone }, h('div', { class: 'pl' }, label), h('div', { class: 'pv' }, value), sub ? h('div', { class: 'ps' }, sub) : null); }
const tone = (v: number | null, ok: number, bad: number, lowIsGood = false) => v == null ? '' : (lowIsGood ? v <= ok : v >= ok) ? 'good' : (lowIsGood ? v >= bad : v <= bad) ? 'bad' : 'mid';

function renderLive() {
  const s = summary(live), T = live.totals, last = live.samples[live.samples.length - 1];
  liveBox.replaceChildren(
    tile('FPS khi chạy', num(s.fps, 0), 'khung/giây lúc phát, tua, kéo', tone(s.fps, 45, 25)),
    tile('Frame time', `${num(s.ms50, 0)} ms`, `p90 ${num(s.ms90, 0)} · p99 ${num(s.ms99, 0)} ms`, tone(s.ms90, 25, 45, true)),
    tile('Khung chậm', `${num(s.slowPct)} %`, 'trên 33 ms (dưới 30 khung/giây)', tone(s.slowPct, 5, 20, true)),
    tile('Khung giật', `${num(s.jankPct)} %`, 'trên 50 ms, thấy rõ bị khựng', tone(s.jankPct, 2, 10, true)),
    tile('CPU mỗi khung', `${num(s.cpu)} ms`, `khung đứng: ${num(T.stills ? T.stillCpuMs / T.stills : null)} ms`, tone(s.cpu, 8, 16, true)),
    tile('Mức xem trước', last ? String(last.lvl) : '–', last ? `${last.w}×${last.h} px · đổi mức ${T.levelChanges} lần` : 'chưa phát lần nào'),
    tile('Treo trang', String(T.longTasks), `tổng ${Math.round(T.longTaskMs)} ms (việc trên 50 ms)`, tone(T.longTasks, 5, 30, true)),
    tile('Bộ nhớ', T.heapMaxMB != null ? `${T.heapMaxMB} MB` : '–', 'cao nhất trong phiên'),
    tile('Đã chạy', dur(T.movingSeconds), `phát ${dur(T.playSeconds)} · ${T.frames} khung`),
    tile('Màn hình', `${live.machine.refreshHz} Hz`, `${live.machine.screen} · x${live.machine.dpr}`),
  );
}

function render() {
  if (!back) return;
  renderLive();
  const rs = data.renders;
  const sessRenders = (id: string) => rs.filter((r) => r.session === id);
  const rows = data.sessions.map((x) => {
    const s = summary(x as any), R = sessRenders(x.id).filter((r) => r.renderFps), rf = R.length ? R.reduce((a, r) => a + r.renderFps!, 0) / R.length : null;
    return h('tr', { class: x.id === picked ? 'on' : '', onclick: () => { picked = x.id; render(); } },
      h('td', {}, when(x.started) + (x.id === live.id ? ' (phiên này)' : '')), h('td', {}, dur(x.seconds)), h('td', { class: 'gpu', title: x.machine.gpu }, x.machine.gpu),
      h('td', {}, x.projects.join(', ') || '–'), h('td', {}, dur(x.totals.movingSeconds)),
      h('td', { class: 'n ' + tone(s.fps, 45, 25) }, num(s.fps, 0)), h('td', { class: 'n' }, `${num(s.ms50, 0)} / ${num(s.ms90, 0)} / ${num(s.ms99, 0)}`),
      h('td', { class: 'n ' + tone(s.slowPct, 5, 20, true) }, num(s.slowPct)), h('td', { class: 'n ' + tone(s.jankPct, 2, 10, true) }, num(s.jankPct)),
      h('td', { class: 'n' }, num(s.cpu)), h('td', { class: 'n' }, s.level == null ? '–' : String(s.level)),
      h('td', { class: 'n' }, `${x.totals.longTasks}`), h('td', { class: 'n' }, R.length ? `${sessRenders(x.id).length} · ${num(rf)}` : String(sessRenders(x.id).length)));
  });
  const box = h('div', { class: 'modal perf' },
    h('div', { class: 'perf-head' }, h('div', { class: 'title' }, 'Nhật ký hiệu năng'), h('span', { class: 'grow' }),
      h('button', { onclick: () => download('2d-studio-sessions.csv', sessionsCsv(), 'text/csv') }, 'Tải CSV các phiên'),
      h('button', { onclick: () => download('2d-studio-renders.csv', rendersCsv(), 'text/csv') }, 'Tải CSV xuất video'),
      h('button', { onclick: exportJson }, 'Tải JSON phiên đang chọn'),
      h('button', { onclick: clearAll }, 'Xoá nhật ký'),
      h('button', { class: 'primary', onclick: close }, 'Đóng')),
    h('div', { class: 'hint' }, `Mỗi lần mở studio là một phiên. Số đo của khung xem trước trong studio, tính lúc đang phát, tua hoặc kéo. Video xuất ra luôn ở 1080×1920 đầy đủ, tốc độ xuất ghi ở bảng cuối. Lưu tại Logs/perf trên máy này.`),
    h('h3', {}, 'Phiên này, đang chạy'), liveBox,
    h('h3', {}, `Các phiên (${data.sessions.length})`),
    h('div', { class: 'perf-scroll' }, h('table', { class: 'perf-table' },
      h('thead', {}, h('tr', {}, ...['Bắt đầu', 'Dài', 'Card đồ hoạ', 'Project', 'Đã chạy', 'FPS', 'ms p50/p90/p99', 'Chậm %', 'Giật %', 'CPU ms', 'Mức', 'Treo', 'Xuất (lần · khung/giây)'].map((c) => h('th', {}, c)))),
      h('tbody', {}, ...rows))),
    detail(),
    h('h3', {}, `Xuất video (${rs.length})`),
    rs.length ? h('div', { class: 'perf-scroll' }, h('table', { class: 'perf-table' },
      h('thead', {}, h('tr', {}, ...['Lúc', 'Project', 'Kết quả', 'Layer', 'Khung', 'Đoạn', 'Thời gian', 'Render rate', 'ms/khung', 'So với thời gian thực'].map((c) => h('th', {}, c)))),
      h('tbody', {}, ...rs.map((r) => h('tr', { class: r.session === picked ? 'on' : '' },
        h('td', {}, when(r.at)), h('td', {}, r.project), h('td', { class: r.state === 'done' ? 'good' : 'bad' }, r.state === 'done' ? 'Xong' : r.state === 'error' ? 'Lỗi / dừng' : r.state),
        h('td', {}, r.layers ? `có (${r.layerCount ?? '?'})` : 'không'), h('td', { class: 'n' }, `${r.framesDone}/${r.frames ?? '?'} @${r.videoFps ?? '?'}`),
        h('td', {}, r.from != null || r.to != null ? `${num(r.from ?? 0)}–${num(r.to)} s` : 'cả video'), h('td', { class: 'n' }, dur(r.totalSeconds)),
        h('td', { class: 'n' }, r.renderFps != null ? `${num(r.renderFps)} khung/giây` : '–'), h('td', { class: 'n' }, num(r.msPerFrame, 0)),
        h('td', { class: 'n' }, r.realtime != null ? `x${num(r.realtime, 2)}` : '–')))))) : h('div', { class: 'hint' }, 'Chưa xuất video nào.'),
  );
  back.replaceChildren(box);
}

// ---------------------------------------------------------------- one session: charts, machine, events
function detail() {
  const wrap = h('div', { class: 'perf-detail' }, h('div', { class: 'hint' }, 'Đang tải phiên...'));
  (async () => {
    let s: PerfSession | null = null;
    if (picked === live.id) s = live;
    else { try { const r = await fetch(`/api/perf?id=${picked}`); if (r.ok) s = await r.json(); } catch { /* shown below */ } }
    if (!s) { wrap.replaceChildren(h('div', { class: 'hint' }, 'Không đọc được phiên này.')); return; }
    const M = s.machine;
    const fpsCv = h('canvas', { class: 'perf-chart' }) as HTMLCanvasElement, histCv = h('canvas', { class: 'perf-chart' }) as HTMLCanvasElement;
    wrap.replaceChildren(
      h('h3', {}, `Phiên ${when(s.started)}`),
      h('div', { class: 'perf-machine' }, `${M.gpu} · ${M.cores ?? '?'} nhân CPU · RAM ${M.memoryGB != null ? M.memoryGB + ' GB' : '?'} · màn hình ${M.screen} x${M.dpr} ${M.refreshHz} Hz · ${M.browser} · ${M.platform}`),
      h('div', { class: 'perf-charts' },
        h('div', {}, h('div', { class: 'pl' }, 'FPS và frame time theo thời gian (nền: mức xem trước)'), fpsCv),
        h('div', {}, h('div', { class: 'pl' }, 'Phân bố frame time (ms)'), histCv)),
      h('div', { class: 'perf-levels' }, ...s.totals.levelSeconds.map((v, i) => h('span', {}, h('i', { style: { background: LEVEL_COLOR[i] } }), `Mức ${LEVEL_VI[i]}: ${dur(v)}`))),
      h('details', {}, h('summary', {}, `Sự kiện (${s.events.length})`),
        h('div', { class: 'perf-events' }, ...s.events.slice(-200).map((e) => h('div', {}, h('b', {}, `${e.t.toFixed(1)} s`), ` ${e.text}`)))),
    );
    requestAnimationFrame(() => { drawFps(fpsCv, s!); drawHist(histCv, s!); });
  })();
  return wrap;
}
function sizeCanvas(cv: HTMLCanvasElement) {
  const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = Math.max(10, r.width * d); cv.height = Math.max(10, r.height * d);
  const g = cv.getContext('2d')!; g.scale(d, d); return { g, w: r.width, hh: r.height };
}
function drawFps(cv: HTMLCanvasElement, s: PerfSession) {
  const { g, w, hh } = sizeCanvas(cv), S = s.samples, padL = 30, padB = 16, W = w - padL - 4, H = hh - padB - 6;
  g.fillStyle = '#1a1d23'; g.fillRect(0, 0, w, hh);
  g.font = '10px system-ui'; g.fillStyle = '#7d8696';
  if (!S.length) { g.fillText('Chưa có số liệu: bấm Phát (Space) để đo.', padL, hh / 2); return; }
  const maxF = Math.max(60, ...S.map((x) => x.fps)) * 1.05, x = (i: number) => padL + (S.length < 2 ? W / 2 : (i / (S.length - 1)) * W), y = (f: number) => 6 + H - (f / maxF) * H;
  // level bands (one sample = one second while moving: the axis is "seconds of movement", not wall time)
  S.forEach((p, i) => { g.fillStyle = LEVEL_COLOR[p.lvl] + '55'; g.fillRect(x(i) - W / Math.max(1, S.length) / 2, 6, W / Math.max(1, S.length) + 1, H); });
  for (const f of [30, 60]) { g.strokeStyle = '#3a404b'; g.beginPath(); g.moveTo(padL, y(f)); g.lineTo(padL + W, y(f)); g.stroke(); g.fillStyle = '#7d8696'; g.fillText(String(f), 4, y(f) + 3); }
  const line = (get: (p: typeof S[0]) => number, color: string) => { g.strokeStyle = color; g.lineWidth = 1.5; g.beginPath(); S.forEach((p, i) => (i ? g.lineTo(x(i), y(get(p))) : g.moveTo(x(i), y(get(p))))); g.stroke(); };
  line((p) => p.fps, '#5fd38a');
  line((p) => Math.min(maxF, 1000 / Math.max(1, p.p90)), '#f0b44a');   // p90 frame time as frames a second
  g.fillStyle = '#5fd38a'; g.fillText('FPS', padL + 4, hh - 4); g.fillStyle = '#f0b44a'; g.fillText('FPS theo p90 frame time', padL + 32, hh - 4);
  g.fillStyle = '#7d8696'; g.textAlign = 'right'; g.fillText(`${S.length} giây đang chạy`, padL + W, hh - 4); g.textAlign = 'left';
}
function drawHist(cv: HTMLCanvasElement, s: PerfSession) {
  const { g, w, hh } = sizeCanvas(cv), H = s.hist, padB = 16, n = Math.min(H.length, 50), bw = (w - 8) / n, max = Math.max(1, ...H.slice(0, n));
  g.fillStyle = '#1a1d23'; g.fillRect(0, 0, w, hh); g.font = '10px system-ui';
  for (let i = 0; i < n; i++) {
    const v = i === n - 1 ? H.slice(n - 1).reduce((a, b) => a + b, 0) : H[i], ms = i * 2;
    g.fillStyle = ms < 20 ? '#5fd38a' : ms < 34 ? '#d8c04a' : ms < 50 ? '#f0904a' : '#e05555';
    const bh = (v / max) * (hh - padB - 8); g.fillRect(4 + i * bw, hh - padB - bh, Math.max(1, bw - 1), bh);
  }
  g.fillStyle = '#7d8696'; for (const ms of [0, 16, 33, 50, 98]) g.fillText(ms === 98 ? '≥98' : String(ms), 4 + (ms / 2) * bw, hh - 4);
}

// ---------------------------------------------------------------- downloads
function csv(rows: (string | number | null | undefined | boolean)[][]) { return '﻿' + rows.map((r) => r.map((v) => { const s = v == null ? '' : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\n'); }
function sessionsCsv() {
  const head = ['session', 'started', 'seconds', 'gpu', 'gpu_vendor', 'cpu_cores', 'memory_gb', 'screen', 'dpr', 'refresh_hz', 'browser', 'platform', 'projects', 'moving_seconds', 'play_seconds', 'frames', 'still_frames', 'fps', 'frame_ms_p50', 'frame_ms_p90', 'frame_ms_p99', 'slow_pct_over_33ms', 'jank_pct_over_50ms', 'cpu_ms_per_frame', 'main_level', 'level_changes', 'level0_s', 'level1_s', 'level2_s', 'level3_s', 'level4_s', 'long_tasks', 'long_task_ms', 'heap_max_mb', 'renders', 'render_fps_avg'];
  return csv([head, ...data.sessions.map((x) => {
    const s = summary(x as any), T = x.totals, M = x.machine, R = data.renders.filter((r) => r.session === x.id), RF = R.filter((r) => r.renderFps);
    return [x.id, x.started, x.seconds, M.gpu, M.vendor, M.cores, M.memoryGB, M.screen, M.dpr, M.refreshHz, M.browser, M.platform, x.projects.join(' | '), T.movingSeconds, T.playSeconds, T.frames, T.stills,
      s.fps, s.ms50, s.ms90, s.ms99, s.slowPct, s.jankPct, s.cpu, s.level, T.levelChanges, ...[0, 1, 2, 3, 4].map((i) => T.levelSeconds[i] ?? 0), T.longTasks, T.longTaskMs, T.heapMaxMB,
      R.length, RF.length ? +(RF.reduce((a, r) => a + r.renderFps!, 0) / RF.length).toFixed(2) : null];
  })]);
}
function rendersCsv() {
  const head = ['at', 'session', 'project', 'state', 'layers', 'layer_count', 'frames', 'frames_done', 'video_fps', 'from', 'to', 'width', 'height', 'loop_seconds', 'total_seconds', 'render_fps', 'ms_per_frame', 'realtime_ratio'];
  return csv([head, ...data.renders.map((r) => [r.at, r.session, r.project, r.state, r.layers, r.layerCount, r.frames, r.framesDone, r.videoFps, r.from, r.to, r.width, r.height, r.loopSeconds, r.totalSeconds, r.renderFps, r.msPerFrame, r.realtime])]);
}
async function exportJson() {
  let s: any = picked === live.id ? live : null;
  if (!s) { try { s = await (await fetch(`/api/perf?id=${picked}`)).json(); } catch { return toast('Không đọc được phiên này.'); } }
  download(`2d-studio-session-${s.id}.json`, JSON.stringify({ ...s, renders: data.renders.filter((r) => r.session === s.id) }, null, 2), 'application/json');
}
function download(name: string, text: string, type: string) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL((a as HTMLAnchorElement).href), 2000);
}
async function clearAll() {
  if (!confirm('Xoá toàn bộ nhật ký hiệu năng trên máy này (mọi phiên và mọi lần xuất video)? Không lấy lại được.')) return;
  await fetch('/api/perf?all=1', { method: 'DELETE' }); await load(); picked = live.id; render(); toast('Đã xoá nhật ký. Phiên này vẫn tiếp tục được ghi.');
}
