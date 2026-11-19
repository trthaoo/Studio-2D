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

async function launch() {
  const args = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'];
  for (const channel of ['msedge', 'chrome', undefined]) {
    try { return await chromium.launch({ channel, headless: true, args }); } catch (e) { if (!channel) throw e; }
  }
}

const browser = await launch();
let failed = false;
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log('[page]', m.text()); });
  page.on('pageerror', (e) => log('[page error]', e.message));
  await page.goto(`http://localhost:${port}/render.html?project=${encodeURIComponent(name)}`);
  await page.evaluate(() => window.__ready);
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
    if (!layersOn) await main.write(dataBuf(await page.evaluate((tt) => window.renderFull(tt), t)));
    else {
      const r = await page.evaluate((tt) => window.renderLayers(tt), t);
      await main.write(dataBuf(r.full)); await clean.write(dataBuf(r.clean)); await caps.write(dataBuf(r.captions));
      for (const l of info.layers) await per[l.id].write(dataBuf(r.layers[l.id] || blank));
    }
    if (i % 5 === 0 || i === n - 1) { const s = (Date.now() - t0) / 1000; log(`PROGRESS ${i + 1}/${n} (${s.toFixed(0)} s)`); }
  }
  const all = [main, clean, caps, ...Object.values(per)].filter(Boolean);
  for (const p of all) p.stdin.end();
  await Promise.all(all.map((p) => p.done));

  // sound: every clip at its time, mixed, muxed
  const out = base + '.mp4';
  const clips = (info.audio || []).filter((a) => fs.existsSync(path.join(ROOT, 'Projects', safe(name), a.file)));
  if (clips.length) {
    const ins = clips.flatMap((a) => ['-i', path.join(ROOT, 'Projects', safe(name), a.file)]);
    const fil = clips.map((a, i) => `[${i + 1}:a]atrim=start=${Math.max(0, from - a.start)},adelay=${Math.round(Math.max(0, a.start - from) * 1000)}:all=1,volume=${a.gain || 0}dB[a${i}]`).join(';')
      + `;${clips.map((_, i) => `[a${i}]`).join('')}amix=inputs=${clips.length}:normalize=0:duration=longest[mix]`;
    await ff(['-i', silent, ...ins, '-filter_complex', fil, '-map', '0:v', '-map', '[mix]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(to - from), '-movflags', '+faststart', out]).done;
    fs.rmSync(silent);
  } else fs.renameSync(silent, out);

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
