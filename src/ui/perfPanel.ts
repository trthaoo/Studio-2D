// Nhật ký hiệu năng: how the studio ran in every session on this machine (view frames a second, frame times, slow
// frames, CPU per frame, preview level, page freezes, memory) and how fast every video render went. Two ways to see
// it: a window inside the studio (showPerf, with the session that is running), and the dashboard page perf.html
// (mountPerfPage: totals over every session, trends, filters, refreshes itself). Data: Logs/perf/ via /api/perf.
// No studio state is imported here, so the dashboard page does not start a session of its own.
import { h } from './dom';
import { summary, histPct, BUCKET, PerfSession, RenderRec } from '../perfStats';

const LEVEL_VI = ['0 (nét nhất)', '1', '2', '3', '4 (nhẹ nhất)'];
const LEVEL_COLOR = ['#2f6f4f', '#4f7a3a', '#8a7a2a', '#9a5a2a', '#9a3a3a'];
const num = (v: number | null | undefined, d = 1) => (v == null || !isFinite(v) ? '–' : v.toFixed(d));
const dur = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)} giờ ${Math.round((s % 3600) / 60)} phút` : s >= 60 ? `${Math.floor(s / 60)} phút ${Math.round(s % 60)} giây` : `${Math.round(s)} giây`);
const when = (iso: string) => new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const day = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

type SessionRow = Omit<PerfSession, 'samples'> & { sampleCount: number };
type Range = '1' | '7' | '30' | 'all';

let live: PerfSession | null = null;           // the studio's running session (window mode only)
let host: HTMLElement | null = null, mode: 'modal' | 'page' = 'modal', timer = 0;
let data: { sessions: SessionRow[]; renders: RenderRec[] } = { sessions: [], renders: [] };
let picked = '', fGpu = '', fProject = '', fRange: Range = '30', auto = true, loadedAt = 0, showEmpty = false;
let note: (msg: string) => void = (m) => alert(m);

/** Inside the studio: a window over everything, with the running session at the top. */
export async function showPerf(running: PerfSession, toast?: (m: string) => void) {
  host?.remove(); live = running; mode = 'modal'; if (toast) note = toast;
  host = h('div', { class: 'modal-back', onclick: (e: MouseEvent) => { if (e.target === host) close(); } });
  document.body.append(host);
  picked = live.id; await load(); render();
  clearInterval(timer); timer = window.setInterval(() => { if (host?.isConnected) renderLive(); else clearInterval(timer); }, 1000);
}
/** perf.html: the whole page, reloading the logs every 10 seconds while "Tự làm mới" is on. */
export async function mountPerfPage(el: HTMLElement) {
  host = el; mode = 'page'; live = null;
  try { const q = new URLSearchParams(location.search); fRange = (q.get('range') as Range) || fRange; fGpu = q.get('gpu') || ''; fProject = q.get('project') || ''; } catch { /* defaults */ }
  await load(); picked = filtered()[0]?.id || ''; render();
  clearInterval(timer); timer = window.setInterval(async () => { if (!auto || document.hidden) return; await load(); render(); }, 10000);
}
function close() { if (mode === 'modal') { host?.remove(); host = null; clearInterval(timer); } }
async function load() {
  try { data = await (await fetch('/api/perf')).json(); } catch { data = { sessions: [], renders: [] }; }
  if (live) {   // the running session from memory (the saved copy can be up to 15 s old)
    const { samples, ...cur } = live; cur.seconds = +(performance.now() / 1000).toFixed(1);
    data.sessions = [{ ...cur, sampleCount: samples.length }, ...data.sessions.filter((x) => x.id !== live!.id)];
  }
  loadedAt = Date.now();
}
function filtered() {
  const since = fRange === 'all' ? 0 : Date.now() - +fRange * 86400000;
  const measured = (x: SessionRow) => x.totals.movingSeconds > 0 || x.id === live?.id || data.renders.some((r) => r.session === x.id);
  return data.sessions.filter((x) => (!fGpu || x.machine.gpu === fGpu) && (!fProject || x.projects.includes(fProject)) && new Date(x.started).getTime() >= since && (showEmpty || mode === 'modal' || measured(x)));
}

// ---------------------------------------------------------------- tiles
const liveBox = h('div', { class: 'perf-tiles' });
function tile(label: string, value: string, sub = '', tone = '') { return h('div', { class: 'perf-tile ' + tone }, h('div', { class: 'pl' }, label), h('div', { class: 'pv' }, value), sub ? h('div', { class: 'ps' }, sub) : null); }
const tone = (v: number | null, ok: number, bad: number, lowIsGood = false) => v == null ? '' : (lowIsGood ? v <= ok : v >= ok) ? 'good' : (lowIsGood ? v >= bad : v <= bad) ? 'bad' : 'mid';

function renderLive() {
  if (!live) return;
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
/** Totals over the sessions shown (the dashboard's headline). */
function totalsBox(rows: SessionRow[], renders: RenderRec[]) {
  const hist = new Array(101).fill(0); let moving = 0, frames = 0, cpu = 0, slow = 0, jank = 0, lt = 0;
  for (const x of rows) { x.hist.forEach((v, i) => { hist[i] += v; }); moving += x.totals.movingSeconds; frames += x.totals.frames; cpu += x.totals.cpuMs; slow += x.totals.slow; jank += x.totals.jank; lt += x.totals.longTasks; }
  const n = hist.reduce((a, b) => a + b, 0), fps = moving > 0 ? n / moving : null;
  const R = renders.filter((r) => r.renderFps), rf = R.length ? R.reduce((a, r) => a + r.renderFps!, 0) / R.length : null;
  const rt = R.filter((r) => r.realtime), rr = rt.length ? rt.reduce((a, r) => a + r.realtime!, 0) / rt.length : null;
  const machines = new Set(rows.map((x) => x.machine.gpu)).size;
  return h('div', { class: 'perf-tiles' },
    tile('FPS khi chạy', num(fps, 0), `trung bình ${rows.length} phiên`, tone(fps, 45, 25)),
    tile('Frame time', `${num(histPct(hist, 0.5), 0)} ms`, `p90 ${num(histPct(hist, 0.9), 0)} · p99 ${num(histPct(hist, 0.99), 0)} ms`, tone(histPct(hist, 0.9), 25, 45, true)),
    tile('Khung chậm', `${num(n ? slow / n * 100 : null)} %`, 'trên 33 ms', tone(n ? slow / n * 100 : null, 5, 20, true)),
    tile('Khung giật', `${num(n ? jank / n * 100 : null)} %`, 'trên 50 ms', tone(n ? jank / n * 100 : null, 2, 10, true)),
    tile('CPU mỗi khung', `${num(frames ? cpu / frames : null)} ms`, `${frames} khung đo được`, tone(frames ? cpu / frames : null, 8, 16, true)),
    tile('Treo trang', String(lt), 'việc trên 50 ms, cộng mọi phiên', tone(rows.length ? lt / rows.length : null, 5, 30, true)),
    tile('Render rate', rf != null ? `${num(rf)} khung/giây` : '–', `${renders.length} lần xuất · ${num(R.length ? R.reduce((a, r) => a + r.msPerFrame!, 0) / R.length : null, 0)} ms/khung`),
    tile('So với thời gian thực', rr != null ? `x${num(rr, 2)}` : '–', 'giây video / giây chờ xuất'),
    tile('Đã chạy', dur(moving), `${rows.length} phiên · ${machines} máy`),
  );
}

// ---------------------------------------------------------------- the view
function render() {
  if (!host) return;
  const rows = filtered(), ids = new Set(rows.map((x) => x.id));
  const rs = mode === 'page' ? data.renders.filter((r) => (!fProject || r.project === fProject) && (ids.has(r.session) || (!fGpu && inRange(r.at)))) : data.renders;
  if (!rows.some((x) => x.id === picked)) picked = rows[0]?.id || '';
  const sessRenders = (id: string) => data.renders.filter((r) => r.session === id);
  const gpus = [...new Set(data.sessions.map((x) => x.machine.gpu))], projects = [...new Set(data.sessions.flatMap((x) => x.projects))];
  const sel = (val: string, opts: [string, string][], on: (v: string) => void) => h('select', { onchange: (e: any) => { on(e.target.value); syncUrl(); render(); } }, ...opts.map(([v, l]) => h('option', { value: v, selected: v === val }, l)));
  const head = h('div', { class: 'perf-head' },
    mode === 'page' ? h('h1', {}, 'Hiệu năng 2D Studio') : h('div', { class: 'title' }, 'Nhật ký hiệu năng'), h('span', { class: 'grow' }),
    mode === 'page' ? h('label', { class: 'perf-auto' }, h('input', { type: 'checkbox', checked: auto, onchange: (e: any) => { auto = e.target.checked; } }), `Tự làm mới (${new Date(loadedAt).toLocaleTimeString('vi-VN')})`) : null,
    mode === 'page' ? h('button', { onclick: async () => { await load(); render(); } }, 'Làm mới') : h('button', { onclick: () => window.open('/perf.html', '_blank') }, 'Mở dashboard'),
    h('button', { onclick: () => download('2d-studio-sessions.csv', sessionsCsv(rows), 'text/csv') }, 'CSV các phiên'),
    h('button', { onclick: () => download('2d-studio-renders.csv', rendersCsv(rs), 'text/csv') }, 'CSV xuất video'),
    h('button', { onclick: exportJson }, 'JSON phiên đang chọn'),
    h('button', { onclick: clearAll }, 'Xoá nhật ký'),
    mode === 'modal' ? h('button', { class: 'primary', onclick: close }, 'Đóng') : h('a', { class: 'btnlink', href: '/' }, 'Mở studio'));
  const filters = mode === 'page' ? h('div', { class: 'perf-filters' },
    h('span', {}, 'Thời gian'), sel(fRange, [['1', 'Hôm nay (24 giờ)'], ['7', '7 ngày'], ['30', '30 ngày'], ['all', 'Tất cả']], (v) => { fRange = v as Range; }),
    h('span', {}, 'Máy'), sel(fGpu, [['', `Mọi máy (${gpus.length})`], ...gpus.map((g) => [g, g] as [string, string])], (v) => { fGpu = v; }),
    h('span', {}, 'Project'), sel(fProject, [['', 'Mọi project'], ...projects.map((p) => [p, p] as [string, string])], (v) => { fProject = v; }),
    h('label', { class: 'perf-auto' }, h('input', { type: 'checkbox', checked: showEmpty, onchange: (e: any) => { showEmpty = e.target.checked; render(); } }), 'Hiện cả phiên chưa đo gì')) : null;
  const trend = h('canvas', { class: 'perf-chart tall' }) as HTMLCanvasElement;
  const box = h('div', { class: mode === 'modal' ? 'modal perf' : 'perf-page' },
    head,
    h('div', { class: 'hint' }, 'Mỗi lần mở studio là một phiên. Số đo của khung xem trước trong studio, tính lúc đang phát, tua hoặc kéo. Video xuất ra luôn ở 1080×1920 đầy đủ, tốc độ xuất ghi ở bảng cuối. Dữ liệu ở Logs/perf trên máy này.'),
    filters,
    ...(mode === 'modal' ? [h('h3', {}, 'Phiên này, đang chạy'), liveBox] : [h('h3', {}, 'Tổng hợp'), totalsBox(rows, rs), h('h3', {}, 'Xu hướng theo phiên'), trend]),
    h('h3', {}, `Các phiên (${rows.length})`),
    rows.length ? h('div', { class: 'perf-scroll' }, h('table', { class: 'perf-table' },
      h('thead', {}, h('tr', {}, ...['Bắt đầu', 'Dài', 'Card đồ hoạ', 'Project', 'Đã chạy', 'FPS', 'ms p50/p90/p99', 'Chậm %', 'Giật %', 'CPU ms', 'Mức', 'Treo', 'Xuất (lần · khung/giây)'].map((c) => h('th', {}, c)))),
      h('tbody', {}, ...rows.map((x) => {
        const s = summary(x), R = sessRenders(x.id).filter((r) => r.renderFps), rf = R.length ? R.reduce((a, r) => a + r.renderFps!, 0) / R.length : null;
        return h('tr', { class: x.id === picked ? 'on' : '', onclick: () => { picked = x.id; render(); } },
          h('td', {}, when(x.started) + (x.id === live?.id ? ' (phiên này)' : '')), h('td', {}, dur(x.seconds)), h('td', { class: 'gpu', title: x.machine.gpu }, x.machine.gpu),
          h('td', {}, x.projects.join(', ') || '–'), h('td', {}, dur(x.totals.movingSeconds)),
          h('td', { class: 'n ' + tone(s.fps, 45, 25) }, num(s.fps, 0)), h('td', { class: 'n' }, `${num(s.ms50, 0)} / ${num(s.ms90, 0)} / ${num(s.ms99, 0)}`),
          h('td', { class: 'n ' + tone(s.slowPct, 5, 20, true) }, num(s.slowPct)), h('td', { class: 'n ' + tone(s.jankPct, 2, 10, true) }, num(s.jankPct)),
          h('td', { class: 'n' }, num(s.cpu)), h('td', { class: 'n' }, s.level == null ? '–' : String(s.level)),
          h('td', { class: 'n' }, `${x.totals.longTasks}`), h('td', { class: 'n' }, R.length ? `${sessRenders(x.id).length} · ${num(rf)}` : String(sessRenders(x.id).length)));
      })))) : h('div', { class: 'hint' }, 'Chưa có phiên nào trong khoảng này. Mở studio và bấm Phát để bắt đầu đo.'),
    picked ? detail() : null,
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
  if (mode === 'modal') { renderLive(); host.replaceChildren(box); }
  else { const y = window.scrollY; host.replaceChildren(box); window.scrollTo(0, y); requestAnimationFrame(() => drawTrend(trend, rows, rs)); }
}
const inRange = (iso: string) => fRange === 'all' || new Date(iso).getTime() >= Date.now() - +fRange * 86400000;
function syncUrl() {
  if (mode !== 'page') return;
  const q = new URLSearchParams(); if (fRange !== '30') q.set('range', fRange); if (fGpu) q.set('gpu', fGpu); if (fProject) q.set('project', fProject);
  history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
}

// ---------------------------------------------------------------- one session: charts, machine, events
function detail() {
  const wrap = h('div', { class: 'perf-detail' }, h('div', { class: 'hint' }, 'Đang tải phiên...'));
  const id = picked;
  (async () => {
    let s: PerfSession | null = null;
    if (live && id === live.id) s = live;
    else { try { const r = await fetch(`/api/perf?id=${id}`); if (r.ok) s = await r.json(); } catch { /* shown below */ } }
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
/** One point per session (oldest left): FPS, FPS from p90 frame time, and the render rate of its exports. */
function drawTrend(cv: HTMLCanvasElement, rows: SessionRow[], rs: RenderRec[]) {
  const { g, w, hh } = sizeCanvas(cv), padL = 30, padB = 18, W = w - padL - 8, H = hh - padB - 8;
  g.fillStyle = '#1a1d23'; g.fillRect(0, 0, w, hh); g.font = '10px system-ui';
  const S = rows.filter((x) => x.totals.movingSeconds > 0).slice().reverse();
  if (!S.length) { g.fillStyle = '#7d8696'; g.fillText('Chưa có phiên nào có số đo.', padL, hh / 2); return; }
  const pts = S.map((x) => { const s = summary(x), R = rs.filter((r) => r.session === x.id && r.renderFps); return { x, fps: s.fps || 0, p90: s.ms90 ? 1000 / s.ms90 : 0, jank: s.jankPct || 0, render: R.length ? R.reduce((a, r) => a + r.renderFps!, 0) / R.length : null }; });
  const maxF = Math.max(60, ...pts.map((p) => Math.max(p.fps, p.p90))) * 1.08;
  const X = (i: number) => padL + (pts.length < 2 ? W / 2 : (i / (pts.length - 1)) * W), Y = (f: number) => 8 + H - (f / maxF) * H;
  for (const f of [15, 30, 45, 60]) { g.strokeStyle = '#30353f'; g.beginPath(); g.moveTo(padL, Y(f)); g.lineTo(padL + W, Y(f)); g.stroke(); g.fillStyle = '#7d8696'; g.fillText(String(f), 6, Y(f) + 3); }
  // jank share as bars at the bottom
  pts.forEach((p, i) => { const bh = Math.min(1, p.jank / 30) * H * 0.35; g.fillStyle = 'rgba(224,85,85,0.45)'; g.fillRect(X(i) - 3, 8 + H - bh, 6, bh); });
  const line = (get: (p: typeof pts[0]) => number | null, color: string) => {
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 1.6; g.beginPath(); let on = false;
    pts.forEach((p, i) => { const v = get(p); if (v == null) { on = false; return; } if (on) g.lineTo(X(i), Y(v)); else g.moveTo(X(i), Y(v)); on = true; }); g.stroke();
    pts.forEach((p, i) => { const v = get(p); if (v != null) { g.beginPath(); g.arc(X(i), Y(v), 2.5, 0, 7); g.fill(); } });
  };
  line((p) => p.fps, '#5fd38a'); line((p) => p.p90, '#f0b44a'); line((p) => p.render, '#6aa8ff');
  const step = Math.max(1, Math.ceil(pts.length / 10)); g.fillStyle = '#7d8696';
  pts.forEach((p, i) => { if (i % step === 0) g.fillText(day(p.x.started), X(i) - 12, hh - 5); });
  let lx = padL + W - 330; for (const [c, t] of [['#5fd38a', 'FPS'], ['#f0b44a', 'FPS theo p90'], ['#6aa8ff', 'Render rate'], ['rgba(224,85,85,0.8)', '% khung giật']] as const) { g.fillStyle = c; g.fillRect(lx, 10, 10, 3); g.fillStyle = '#aeb6c3'; g.fillText(t, lx + 14, 14); lx += g.measureText(t).width + 30; }
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
    const v = i === n - 1 ? H.slice(n - 1).reduce((a, b) => a + b, 0) : H[i], ms = i * BUCKET;
    g.fillStyle = ms < 20 ? '#5fd38a' : ms < 34 ? '#d8c04a' : ms < 50 ? '#f0904a' : '#e05555';
    const bh = (v / max) * (hh - padB - 8); g.fillRect(4 + i * bw, hh - padB - bh, Math.max(1, bw - 1), bh);
  }
  g.fillStyle = '#7d8696'; for (const ms of [0, 16, 33, 50, 98]) g.fillText(ms === 98 ? '≥98' : String(ms), 4 + (ms / BUCKET) * bw, hh - 4);
}

// ---------------------------------------------------------------- downloads
function csv(rows: (string | number | null | undefined | boolean)[][]) { return '﻿' + rows.map((r) => r.map((v) => { const s = v == null ? '' : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\n'); }
function sessionsCsv(list: SessionRow[]) {
  const head = ['session', 'started', 'seconds', 'gpu', 'gpu_vendor', 'cpu_cores', 'memory_gb', 'screen', 'dpr', 'refresh_hz', 'browser', 'platform', 'projects', 'moving_seconds', 'play_seconds', 'frames', 'still_frames', 'fps', 'frame_ms_p50', 'frame_ms_p90', 'frame_ms_p99', 'slow_pct_over_33ms', 'jank_pct_over_50ms', 'cpu_ms_per_frame', 'main_level', 'level_changes', 'level0_s', 'level1_s', 'level2_s', 'level3_s', 'level4_s', 'long_tasks', 'long_task_ms', 'heap_max_mb', 'renders', 'render_fps_avg'];
  return csv([head, ...list.map((x) => {
    const s = summary(x), T = x.totals, M = x.machine, R = data.renders.filter((r) => r.session === x.id), RF = R.filter((r) => r.renderFps);
    return [x.id, x.started, x.seconds, M.gpu, M.vendor, M.cores, M.memoryGB, M.screen, M.dpr, M.refreshHz, M.browser, M.platform, x.projects.join(' | '), T.movingSeconds, T.playSeconds, T.frames, T.stills,
      s.fps, s.ms50, s.ms90, s.ms99, s.slowPct, s.jankPct, s.cpu, s.level, T.levelChanges, ...[0, 1, 2, 3, 4].map((i) => T.levelSeconds[i] ?? 0), T.longTasks, Math.round(T.longTaskMs), T.heapMaxMB,
      R.length, RF.length ? +(RF.reduce((a, r) => a + r.renderFps!, 0) / RF.length).toFixed(2) : null];
  })]);
}
function rendersCsv(list: RenderRec[]) {
  const head = ['at', 'session', 'project', 'state', 'layers', 'layer_count', 'frames', 'frames_done', 'video_fps', 'from', 'to', 'width', 'height', 'loop_seconds', 'total_seconds', 'render_fps', 'ms_per_frame', 'realtime_ratio'];
  return csv([head, ...list.map((r) => [r.at, r.session, r.project, r.state, r.layers, r.layerCount, r.frames, r.framesDone, r.videoFps, r.from, r.to, r.width, r.height, r.loopSeconds, r.totalSeconds, r.renderFps, r.msPerFrame, r.realtime])]);
}
async function exportJson() {
  if (!picked) return note('Chưa chọn phiên nào.');
  let s: any = live && picked === live.id ? live : null;
  if (!s) { try { s = await (await fetch(`/api/perf?id=${picked}`)).json(); } catch { return note('Không đọc được phiên này.'); } }
  download(`2d-studio-session-${s.id}.json`, JSON.stringify({ ...s, renders: data.renders.filter((r) => r.session === s.id) }, null, 2), 'application/json');
}
function download(name: string, text: string, type: string) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL((a as HTMLAnchorElement).href), 2000);
}
async function clearAll() {
  if (!confirm('Xoá toàn bộ nhật ký hiệu năng trên máy này (mọi phiên và mọi lần xuất video)? Không lấy lại được.')) return;
  await fetch('/api/perf?all=1', { method: 'DELETE' }); await load(); picked = live?.id || ''; render();
  note(live ? 'Đã xoá nhật ký. Phiên này vẫn tiếp tục được ghi.' : 'Đã xoá nhật ký.');
}
