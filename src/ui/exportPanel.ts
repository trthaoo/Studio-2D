// Workspace "Xuất video": cài đặt (cả video hay một đoạn, có tách layer không), tiến độ, và các file đã xuất để xem lại.
import { S, save, toast, snapT } from '../state';
import { h, fmtTime } from './dom';
import { session as perfSession } from '../perf';
import { makeVoices, speakers, ttsSetup, LICENSE_NOTE } from './voice';

let root: HTMLElement | null = null, layers = false, range: 'all' | 'part' = 'all', from = 0, to = 0, playing = '';
let job: any = null, timer = 0;

export async function exportPanel(el: HTMLElement) { root = el; if (!to) to = S.doc.duration; await poll(); }
export function onRenderChanged() { if (root && S.ws === 'export') poll(); }

async function poll() {
  clearTimeout(timer);
  try { job = await (await fetch('/api/render')).json(); } catch { job = null; }
  await render();
  if (job?.state === 'running') timer = window.setTimeout(poll, 1000);
}
let voices = (() => { try { return localStorage.getItem('2ds.ttsOnRender') === '1'; } catch { return false; } })();
let setupEl: HTMLElement | null = null;   // kept between redraws (it asks the server once)
export async function startRender(withLayers = layers, part = range === 'part') {
  if (!S.project) return;
  if (voices && speakers().length) {   // speech for every line first (Breeze TTS); lines already made come from the cache
    if (!(await makeVoices(speakers(), true))) { toast('Chưa xuất: tạo giọng đọc không được. Bỏ chọn "Tạo giọng đọc" để xuất không có giọng.', 7000); return; }
  }
  await save();
  // let go of the last video, so the new one can take its place on disk (Windows keeps an open file locked)
  if (playerEl) { playerEl.pause(); playerEl.removeAttribute('src'); playerEl.load(); playerEl = null; playerKey = ''; }
  const q = new URLSearchParams({ name: S.project, layers: withLayers ? '1' : '0', session: perfSession.id });
  if (part) { q.set('from', String(from)); q.set('to', String(to)); }
  const r = await fetch(`/api/render?${q}`, { method: 'POST' });
  const j = await r.json(); if (!r.ok) { toast(j.error || 'Không bắt đầu xuất được'); return; }
  toast(withLayers ? 'Đang xuất video và tách từng object ra layer riêng.' : 'Đang xuất video.'); poll();
}
let playerEl: HTMLVideoElement | null = null, playerKey = '';
function player(file: string, version: number) {   // kept between redraws, so it doesn't restart every second
  const key = file + '@' + version;
  if (!playerEl || playerKey !== key) { playerEl = h('video', { class: 'player', src: `/${file}?v=${version}`, controls: true }) as HTMLVideoElement; playerKey = key; }
  return playerEl;
}
/** A failed render: the reason up front (in plain words when known), the log below, a button to copy it. */
function errorBox(log: string[]) {
  const key = log.filter((l) => /RENDER FAILED|LỖI|Không mở được|không tạo được|Quá \d+ giây|\[page error\]|ffmpeg/i.test(l));
  const text = log.slice(-30).join('\n');
  return h('div', { class: 'errbox' },
    h('b', {}, 'Xuất video bị lỗi'),
    h('div', {}, (key[key.length - 1] || log[log.length - 1] || 'Không rõ lý do.').replace(/^RENDER FAILED:\s*/, '')),
    h('div', { class: 'hint' }, 'Bấm "Kiểm tra máy xuất video" ở dưới để xem máy này thiếu gì. Gửi log cho người hỗ trợ nếu vẫn lỗi.'),
    h('details', {}, h('summary', {}, 'Log'), h('pre', { class: 'log' }, text)),
    h('button', { onclick: () => navigator.clipboard.writeText(text).then(() => toast('Đã copy log.')) }, 'Copy log'));
}
let check: { busy: boolean; ok?: boolean; log?: string } = { busy: false };
/** Is this machine able to render (browser, WebGL, ffmpeg, one frame of this project)? */
function checkBox() {
  const run = async () => {
    check = { busy: true }; render();
    try { const r = await fetch(`/api/render/check?name=${encodeURIComponent(S.project)}`, { method: 'POST' }); const j = await r.json(); check = r.ok ? { busy: false, ok: j.ok, log: j.log } : { busy: false, ok: false, log: j.error }; }
    catch (e: any) { check = { busy: false, ok: false, log: e.message }; }
    render();
  };
  return h('div', { class: 'checkbox' },
    h('button', { disabled: check.busy || !S.project, onclick: run }, check.busy ? 'Đang kiểm tra (tới 1 phút)...' : 'Kiểm tra máy xuất video'),
    check.log ? h('div', { class: check.ok ? 'hint ok' : 'errbox' }, h('b', {}, check.ok ? 'Máy này xuất được video.' : 'Máy này chưa xuất được video:'), h('pre', { class: 'log' }, check.log),
      h('button', { onclick: () => navigator.clipboard.writeText(check.log || '').then(() => toast('Đã copy kết quả kiểm tra.')) }, 'Copy kết quả')) : null);
}
const mb = (n: number) => (n / 1048576).toFixed(n > 1048576 * 10 ? 0 : 1) + ' MB';

async function render() {
  if (!root || S.ws !== 'export') return;
  const files: any[] = S.project ? await (await fetch(`/api/exports?name=${encodeURIComponent(S.project)}`)).json() : [];
  const main = files.filter((f) => f.rel.endsWith('.mp4') && !f.rel.includes('/'));
  const layerFiles = files.filter((f) => f.rel.startsWith('layers/'));
  const snaps = files.filter((f) => f.rel.startsWith('snapshots/'));
  if (!playing && main.length) playing = main[0].file;
  const running = job?.state === 'running' && job.project === S.project;
  const pct = running && /^(\d+)\/(\d+)/.test(job.progress) ? (() => { const m = /^(\d+)\/(\d+)/.exec(job.progress)!; return (100 * +m[1]) / +m[2]; })() : 0;
  const radio = (name: string, val: string, cur: string, label: string, on: () => void) => h('label', { class: 'radio' }, h('input', { type: 'radio', name, checked: cur === val, onchange: on }), label);
  root.replaceChildren(h('div', { class: 'wsdoc' },
    h('div', { class: 'wshead' }, h('h1', {}, 'Xuất video'), h('p', { class: 'hint' }, `MP4 1080 × 1920, ${S.doc.fps} khung hình/giây, kèm âm thanh trên timeline. File nằm trong Exports/${S.project}.`)),
    h('div', { class: 'wcols' },
      h('div', {},
        h('section', { class: 'wsec' }, h('div', { class: 'wsec-h' }, 'Phạm vi'),
          radio('rng', 'all', range, `Cả video (${fmtTime(S.doc.duration, S.doc.fps)})`, () => { range = 'all'; render(); }),
          radio('rng', 'part', range, 'Một đoạn', () => { range = 'part'; render(); }),
          range === 'part' ? h('div', { class: 'row' },
            h('label', {}, 'Từ giây ', h('input', { type: 'number', class: 'num', step: 0.1, value: from, onchange: (e: any) => { from = Math.max(0, +e.target.value); } })),
            h('label', {}, ' đến ', h('input', { type: 'number', class: 'num', step: 0.1, value: to || S.doc.duration, onchange: (e: any) => { to = Math.min(S.doc.duration, +e.target.value); } })),
            h('button', { onclick: () => { from = snapT(S.t); render(); } }, 'Lấy playhead làm điểm đầu')) : null),
        h('section', { class: 'wsec' }, h('div', { class: 'wsec-h' }, 'Tách layer'),
          h('label', { class: 'radio' }, h('input', { type: 'checkbox', checked: layers, onchange: (e: any) => { layers = e.target.checked; } }), 'Tách mỗi nhân vật, xe, đồ vật ra một file riêng có nền trong suốt'),
          h('div', { class: 'hint' }, 'Ra thêm thư mục layers: nền (00_background.mp4), mỗi object một file .mov ProRes 4444 có alpha, phụ đề riêng, và manifest.json. Ghép chồng lại được đúng video gốc. Chậm hơn xuất thường vài lần.')),
        h('section', { class: 'wsec' }, h('div', { class: 'wsec-h' }, 'Giọng đọc (ElevenLabs hoặc Breeze TTS)'),
          h('label', { class: 'radio' }, h('input', { type: 'checkbox', checked: voices, onchange: (e: any) => { voices = e.target.checked; try { localStorage.setItem('2ds.ttsOnRender', voices ? '1' : '0'); } catch { /* private window */ } } }),
            `Tạo giọng cho mọi câu thoại trước khi xuất (${speakers().reduce((a, o) => a + (o.tracks.say || []).filter((k) => String(k.v || '').trim()).length, 0)} câu)`),
          h('div', { class: 'hint' }, 'Mỗi nhân vật dùng giọng chọn ở thẻ Mặt. Câu nào không đổi thì dùng lại giọng đã tạo, không gọi máy chủ lại. Giọng nằm trên hàng Âm thanh, sửa được như mọi đoạn âm thanh khác.'),
          setupEl ||= ttsSetup(),
          h('div', { class: 'hint' }, LICENSE_NOTE)),
        h('section', { class: 'wsec' },
          running ? h('div', {}, h('div', { class: 'pbar' }, h('div', { style: { width: pct + '%' } })),
              h('div', { class: 'hint' }, job.progress === 'starting' ? `Đang mở trình duyệt và dựng cảnh... ${(job.log || []).filter((l: string) => !l.startsWith('[page]')).slice(-1)[0] || ''}` : `Đang xuất ${job.layers ? 'kèm layer ' : ''}${job.progress}`),
              h('button', { onclick: () => fetch('/api/render', { method: 'DELETE' }).then(poll) }, 'Dừng'))
            : h('button', { class: 'primary big', disabled: !S.project, onclick: () => startRender() }, layers ? 'Xuất video và layer' : 'Xuất video'),
          job?.state === 'error' && job.project === S.project ? errorBox(job.log || []) : null,
          job?.state === 'stopped' && job.project === S.project ? h('div', { class: 'hint' }, `Đã dừng ở ${job.progress}.`) : null,
          job?.state === 'done' && job.project === S.project && job.out ? h('div', { class: 'hint ok' }, `Xong: ${job.out}`) : null,
          checkBox())),
      h('div', {},
        h('section', { class: 'wsec' }, h('div', { class: 'wsec-h' }, 'Đã xuất'),
          playing ? player(playing, main.find((f) => f.file === playing)?.modified || 0) : h('div', { class: 'hint' }, 'Chưa xuất video nào cho project này.'),
          ...main.map((f) => h('div', { class: 'frow' + (f.file === playing ? ' on' : ''), onclick: () => { playing = f.file; render(); } }, h('span', {}, f.rel), h('span', { class: 'hint' }, `${mb(f.size)}, ${new Date(f.modified).toLocaleString('vi-VN')}`))),
          layerFiles.length ? h('div', { class: 'wsec-h sub' }, `Layer (${layerFiles.length} file)`) : null,
          ...layerFiles.map((f) => h('div', { class: 'frow' }, h('a', { href: '/' + f.file, target: '_blank' }, f.rel.replace('layers/', '')), h('span', { class: 'hint' }, mb(f.size)))),
          snaps.length ? h('div', { class: 'wsec-h sub' }, `Ảnh chụp frame (${snaps.length})`) : null,
          ...snaps.slice(-6).map((f) => h('div', { class: 'frow' }, h('a', { href: '/' + f.file, target: '_blank' }, f.rel.replace('snapshots/', '')))),
          h('button', { onclick: () => fetch(`/api/open-folder?name=${encodeURIComponent(S.project)}`, { method: 'POST' }) }, 'Mở thư mục trong Explorer'))))));
}
