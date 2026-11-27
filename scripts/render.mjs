// Offline render: node scripts/render.mjs "<project>" [--port 5200] [--layers] [--from s] [--to s]
// Needs the studio running (npm start). Opens render.html in a headless Edge/Chrome, draws every frame with the same
// runtime as the studio, pipes frames to ffmpeg. Out: Exports/<project>/<project>.mp4, and with --layers one
// transparent .mov per object + background + captions + manifest.json, to fix things in any editor.
import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const name = argv[0];
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const port = +opt('--port', 5200), layersOn = argv.includes('--layers');
if (!name) { console.error('usage: node scripts/render.mjs "<project>" [--layers]'); process.exit(2); }
const safe = (s) => String(s).replace(/[^\p{L}\p{N} _.\-()]/gu, '_').trim();
const outDir = path.join(ROOT, 'Exports', safe(name));
fs.mkdirSync(outDir, { recursive: true });
const log = (...a) => console.log(...a);

function ff(args) {
  const p = spawn(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['pipe', 'inherit', 'pipe'] });
  let err = ''; p.stderr.on('data', (d) => { err += d; });
  p.done = new Promise((res, rej) => p.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg: ' + err.slice(-800))))));
  p.write = (buf) => new Promise((res) => { if (!p.stdin.write(buf)) p.stdin.once('drain', res); else res(); });
  return p;
}
const dataBuf = (url) => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
/** Move the finished file over the old one; when the old one is locked (open somewhere), retry, then use a new name. */
async function putInPlace(src, dst) {
  for (let i = 0; i < 8; i++) {
    try { if (fs.existsSync(dst)) fs.rmSync(dst); fs.renameSync(src, dst); return dst; }
    catch (e) { if (!/EPERM|EBUSY|EACCES/.test(e.code || e.message)) throw e; await new Promise((r) => setTimeout(r, 600)); }
  }
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  const alt = dst.replace(/\.mp4$/, ` ${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.mp4`);
  fs.renameSync(src, alt); log(`WARN File cũ đang được mở ở chỗ khác, video mới lưu thành: ${path.basename(alt)}`);
  return alt;
}

// The headless browser draws with the GPU through the system's own graphics API (Windows: Direct3D 11, macOS: Metal,
// Linux: OpenGL); when WebGL does not come up that way, it draws on the CPU (SwiftShader: slower, same picture).
const GPU_ARGS = { win32: ['--use-angle=d3d11'], darwin: ['--use-angle=metal'], linux: ['--use-angle=gl'] }[process.platform] || [];
const CPU_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`Quá ${Math.round(ms / 1000)} giây mà vẫn chưa ${what}.`)), ms))]);
async function openBrowser(args) {
  const tried = [];
  for (const channel of process.platform === 'win32' ? ['msedge', 'chrome', undefined] : ['chrome', 'msedge', undefined]) {
    try { const b = await chromium.launch({ channel, headless: true, args: [...args, '--enable-gpu', '--ignore-gpu-blocklist'] }); return { browser: b, name: channel || 'chromium (playwright)' }; }
    catch (e) { tried.push(`${channel || 'chromium'}: ${String(e.message).split('\n')[0]}`); }
  }
  throw new Error('Không mở được trình duyệt để xuất video. Cài Google Chrome, hoặc chạy lệnh: npx playwright install chromium\n' + tried.join('\n'));
}
/** A browser whose page has WebGL (the GPU first, then the CPU). */
async function launch() {
  const modes = [['GPU', GPU_ARGS], ['CPU (SwiftShader)', CPU_ARGS]];
  for (const [mode, args] of argv.includes('--cpu') ? modes.slice(1) : modes) {   // --cpu: skip the GPU
    const { browser, name: bn } = await openBrowser(args);
    const page = await browser.newPage();
    const gl = await page.evaluate(() => { const c = document.createElement('canvas'), g = c.getContext('webgl2'); if (!g) return null; const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER); }).catch(() => null);
    await page.close();
    if (gl) { log(`Trình duyệt: ${bn}, vẽ bằng ${mode}: ${gl}`); return browser; }
    log(`${bn}: không có WebGL khi vẽ bằng ${mode}, thử cách khác...`); await browser.close();
  }
  throw new Error('Trình duyệt không tạo được WebGL (cả GPU lẫn CPU). Cập nhật Google Chrome rồi thử lại.');
}

// --check: is this machine able to render? (browser, WebGL, ffmpeg, and one frame of the project)
if (argv.includes('--check')) {
  let ok = true;
  log(`Máy: ${process.platform} ${process.arch}, Node ${process.version}`);
  try { const v = await new Promise((res, rej) => { const p = spawn(ffmpegPath, ['-version']); let o = ''; p.stdout.on('data', (d) => (o += d)); p.on('error', rej); p.on('close', (c) => (c === 0 ? res(o.split('\n')[0]) : rej(new Error('ffmpeg exit ' + c)))); }); log('ffmpeg: ' + v); }
  catch (e) { ok = false; log('LỖI ffmpeg: ' + e.message + ' (chạy lại: npm install)'); }
  let b = null;
  try {
    b = await launch();
    const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    page.on('pageerror', (e) => log('[page error]', e.message));
    await withTimeout(page.goto(`http://localhost:${port}/render.html?project=${encodeURIComponent(name)}`), 60000, 'mở được trang xuất video (studio có đang chạy không?)');
    await withTimeout(page.evaluate(() => window.__ready), 120000, 'dựng xong cảnh');
    const info = await page.evaluate(() => window.info());
    if (info.errors.length) log('Cảnh có lỗi: ' + info.errors.join(' | '));
    const t0 = Date.now(); const url = await withTimeout(page.evaluate(() => window.renderFull(0)), 60000, 'vẽ xong khung đầu');
    log(`Vẽ một khung: ${Date.now() - t0} ms, ${Math.round(url.length * 0.75 / 1024)} KB. Video ${info.duration}s, ${info.fps} khung/giây.`);
  } catch (e) { ok = false; log('LỖI: ' + e.message); }
  finally { await b?.close().catch(() => {}); }
  log(ok ? 'CHECK OK: máy này xuất được video.' : 'CHECK FAILED');
  process.exit(ok ? 0 : 1);
}

const browser = await launch().catch((e) => { console.error('RENDER FAILED: ' + e.message); process.exit(1); });
let failed = false;
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log('[page]', m.text()); });
  page.on('pageerror', (e) => log('[page error]', e.message));
  await withTimeout(page.goto(`http://localhost:${port}/render.html?project=${encodeURIComponent(name)}`), 60000, 'mở được trang xuất video (studio có đang chạy không?)');
  await withTimeout(page.evaluate(() => window.__ready), 120000, 'dựng xong cảnh');
  const info = await page.evaluate(() => window.info());
  if (info.errors.length) log('WARN build errors:', info.errors.join(' | '));
  const fps = info.fps, from = +opt('--from', 0), to = Math.min(info.duration, +opt('--to', info.duration));
  const n = Math.max(1, Math.round((to - from) * fps));
  log(`Rendering "${name}" ${n} frames at ${fps} fps${layersOn ? `, ${info.layers.length} layers` : ''}`);

  const base = path.join(outDir, safe(name));
  const silent = base + '.video.mp4';
  const x264 = (out) => ['-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out];
  const prores = (out) => ['-f', 'image2pipe', '-c:v', 'png', '-framerate', String(fps), '-i', '-', '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0', out];
  const main = ff(x264(silent));
  let clean, caps, per = {};
  const layerDir = path.join(outDir, 'layers');
  const files = {};
  if (layersOn) {
    fs.rmSync(layerDir, { recursive: true, force: true }); fs.mkdirSync(layerDir, { recursive: true });
    clean = ff(x264(path.join(layerDir, '00_background.mp4')));
    caps = ff(prores(path.join(layerDir, '99_captions.mov')));
    info.layers.forEach((l, i) => { const f = `${String(i + 1).padStart(2, '0')}_${safe(l.name)}.mov`; files[l.id] = f; per[l.id] = ff(prores(path.join(layerDir, f))); });
  }
  const blank = layersOn ? await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; return c.toDataURL('image/png'); }) : null;
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const t = from + i / fps;
    if (!layersOn) await main.write(dataBuf(await withTimeout(page.evaluate((tt) => window.renderFull(tt), t), 90000, `vẽ xong khung ${i + 1}`)));
    else {
      const r = await withTimeout(page.evaluate((tt) => window.renderLayers(tt), t), 300000, `vẽ xong khung ${i + 1} (kèm layer)`);
      await main.write(dataBuf(r.full)); await clean.write(dataBuf(r.clean)); await caps.write(dataBuf(r.captions));
      for (const l of info.layers) await per[l.id].write(dataBuf(r.layers[l.id] || blank));
    }
    if (i % 5 === 0 || i === n - 1) { const s = (Date.now() - t0) / 1000; log(`PROGRESS ${i + 1}/${n} (${s.toFixed(0)} s)`); }
  }
  const all = [main, clean, caps, ...Object.values(per)].filter(Boolean);
  for (const p of all) p.stdin.end();
  await Promise.all(all.map((p) => p.done));

  // sound: every clip at its time, mixed, muxed (into a temporary file first)
  let out = base + '.mp4';
  const done = base + '.done.mp4';
  const clips = (info.audio || []).filter((a) => fs.existsSync(path.join(ROOT, 'Projects', safe(name), a.file)));
  const missing = (info.audio || []).length - clips.length; if (missing) log(`WARN ${missing} đoạn âm thanh không có file, bỏ qua.`);
  if (clips.length) {
    const ins = clips.flatMap((a) => ['-i', path.join(ROOT, 'Projects', safe(name), a.file)]);
    // offset / dur: clips cut or trimmed on the timeline use only part of their file
    const trim = (a) => { const off = a.offset || 0, s = off + Math.max(0, from - a.start); return `atrim=start=${s}${a.dur != null ? `:end=${off + a.dur}` : ''},asetpts=PTS-STARTPTS`; };
    const fil = clips.map((a, i) => `[${i + 1}:a]${trim(a)},adelay=${Math.round(Math.max(0, a.start - from) * 1000)}:all=1,volume=${a.gain || 0}dB[a${i}]`).join(';')
      + `;${clips.map((_, i) => `[a${i}]`).join('')}amix=inputs=${clips.length}:normalize=0:duration=longest[mix]`;
    await ff(['-i', silent, ...ins, '-filter_complex', fil, '-map', '0:v', '-map', '[mix]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(to - from), '-movflags', '+faststart', done]).done;
    fs.rmSync(silent);
  } else fs.renameSync(silent, done);
  // the last video may still be open (the studio's player, a video app, OneDrive syncing): wait for it, else a new name
  out = await putInPlace(done, out);

  if (layersOn) {
    const manifest = {
      project: name, fps, width: 1080, height: 1920, from, to,
      howTo: 'Stack bottom to top: 00_background.mp4, then every object .mov (any order: each pixel belongs to one layer), then 99_captions.mov. Each .mov is ProRes 4444 with alpha.',
      layers: [{ file: '00_background.mp4', name: 'Background (sets, lights, empty world)' }, ...info.layers.map((l) => ({ file: files[l.id], id: l.id, name: l.name, kind: l.kind })), { file: '99_captions.mov', name: 'Captions' }],
    };
    fs.writeFileSync(path.join(layerDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  }
  log(`OUT ${path.relative(ROOT, out).replace(/\\/g, '/')}`);
  log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
} catch (e) { failed = true; console.error('RENDER FAILED:', e.message); }
finally { await browser.close(); }
process.exit(failed ? 1 : 0);
