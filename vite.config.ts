// 2D Studio: the dev server is the studio's back end too (projects, uploads, renders), like Rigging Studio.
import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import { spawn, type ChildProcess } from 'node:child_process';
import crypto from 'node:crypto';
import { aiStatus, aiText, saveKey, findCli } from './scripts/ai';
import { ttsStatus, ttsLine, saveTtsConfig, elevenVoices } from './scripts/tts';

const ROOT = __dirname;
const PROJECTS = path.join(ROOT, 'Projects');
const EXPORTS = path.join(ROOT, 'Exports');
const LIBRARY = path.join(ROOT, 'Library');
const LIB_TYPES: Record<string, string> = { characters: '.json', backgrounds: '.json', code: '.js', cameras: '.json', looks: '.json', vfx: '.js', plans: '.json' };   // plans: fingerprints of approved videos (variety)
const PORT = 5200;
const safe = (s: string) => String(s || '').replace(/[^\p{L}\p{N} _.\-()]/gu, '_').trim().slice(0, 80);

function body(req: any): Promise<Buffer> {
  return new Promise((res, rej) => { const parts: Buffer[] = []; req.on('data', (c: Buffer) => parts.push(c)); req.on('end', () => res(Buffer.concat(parts))); req.on('error', rej); });
}
function json(res: any, data: unknown, code = 200) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); }
const hash = (s: string | Buffer) => crypto.createHash('sha1').update(s).digest('hex');

interface Job { id: string; kind: 'render' | 'ref'; project: string; layers: boolean; state: 'running' | 'done' | 'error' | 'stopped'; stopped?: boolean; progress: string; log: string[]; out?: string; proc?: ChildProcess; started: number;
  session?: string; frames?: number; fps?: number; layerCount?: number; loopStart?: number; loopSeconds?: number; from?: number; to?: number }

// performance log (src/perf.ts): one JSON per studio session, one line per video render. Per machine, not in git.
const PERF = path.join(ROOT, 'Logs', 'perf'), PERF_SESSIONS = path.join(PERF, 'sessions'), PERF_RENDERS = path.join(PERF, 'renders.jsonl');
const perfId = (s: string | null) => (s && /^[0-9]{8}-[0-9]{6}-[a-z0-9]{1,8}$/.test(s) ? s : '');
function logRender(job: Job) {
  if (job.kind !== 'render') return;
  const total = (Date.now() - job.started) / 1000, done = Number((job.progress.match(/^(\d+)\//) || [])[1] || 0);
  const rec = { at: new Date(job.started).toISOString(), session: job.session || '', project: job.project, state: job.state, layers: job.layers, layerCount: job.layerCount ?? null,
    frames: job.frames ?? null, framesDone: done, videoFps: job.fps ?? null, from: job.from ?? null, to: job.to ?? null, width: 1080, height: 1920,
    loopSeconds: job.loopSeconds ?? null, totalSeconds: +total.toFixed(1),
    renderFps: job.loopSeconds && done ? +(done / job.loopSeconds).toFixed(2) : null,          // frames drawn + encoded a second
    msPerFrame: job.loopSeconds && done ? +(job.loopSeconds * 1000 / done).toFixed(1) : null,
    realtime: job.loopSeconds && done && job.fps ? +((done / job.fps) / total).toFixed(3) : null };   // seconds of video per second of waiting
  try { fs.mkdirSync(PERF, { recursive: true }); fs.appendFileSync(PERF_RENDERS, JSON.stringify(rec) + '\n'); } catch { /* logging must never break a render */ }
}

function studioApi(): Plugin {
  const written = new Map<string, string>();   // file -> hash of what the studio itself saved (so we don't echo our own saves)
  const jobs: Job[] = [];
  return {
    name: 'studio-api',
    configureServer(server: ViteDevServer) {
      /** Run a node script as a job: PROGRESS / OUT lines from its output, a ws event when it ends. */
      const runJob = (job: Job, args: string[]) => {
        job.proc = spawn(process.execPath, args, { cwd: ROOT });
        const onLine = (s: string) => { for (const l of s.split(/\r?\n/).filter(Boolean)) {
          job.log.push(l); if (job.log.length > 400) job.log.shift();
          if (l.startsWith('PROGRESS ')) { job.progress = l.slice(9); if (job.loopStart) job.loopSeconds = +((Date.now() - job.loopStart) / 1000).toFixed(2); }
          if (l.startsWith('OUT ')) job.out = l.slice(4);
          const m = l.match(/^Rendering ".*" (\d+) frames at ([\d.]+) fps(?:, (\d+) layers)?/); if (m) { job.frames = +m[1]; job.fps = +m[2]; job.layerCount = m[3] ? +m[3] : undefined; job.loopStart = Date.now(); }
        } };
        job.proc.stdout!.on('data', (d) => onLine(d.toString())); job.proc.stderr!.on('data', (d) => onLine(d.toString()));
        job.proc.on('close', (code) => { job.state = code === 0 ? 'done' : job.stopped ? 'stopped' : 'error'; job.proc = undefined; logRender(job); server.ws.send({ type: 'custom', event: job.kind === 'ref' ? 'ref-done' : 'render-done', data: { id: job.id, state: job.state, out: job.out, project: job.project } }); });
        jobs.push(job);
      };
      fs.mkdirSync(PROJECTS, { recursive: true }); fs.mkdirSync(EXPORTS, { recursive: true });
      // someone else (Claude, an editor) changed a scene.json: tell the open studio to reload it
      server.watcher.add(PROJECTS);
      const norm = (p: string) => path.resolve(p).toLowerCase();
      const onFile = (file: string) => {
        file = path.resolve(file);
        if (!file.endsWith('scene.json') || !norm(file).startsWith(norm(PROJECTS))) return;
        let text = ''; try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
        if (written.get(norm(file)) === hash(text)) return;
        const name = path.basename(path.dirname(file));
        server.ws.send({ type: 'custom', event: 'project-changed', data: { name } });
      };
      server.watcher.on('change', onFile); server.watcher.on('add', onFile);
      // the shared library (characters, backgrounds, code objects): tell the studio when anything in it changes
      for (const t of Object.keys(LIB_TYPES)) fs.mkdirSync(path.join(LIBRARY, t), { recursive: true });
      server.watcher.add(LIBRARY);
      let libTimer: any = null;
      const onLib = (file: string) => { if (!path.resolve(file).toLowerCase().startsWith(LIBRARY.toLowerCase())) return; clearTimeout(libTimer); libTimer = setTimeout(() => server.ws.send({ type: 'custom', event: 'library-changed', data: {} }), 250); };
      server.watcher.on('change', onLib); server.watcher.on('add', onLib); server.watcher.on('unlink', onLib);

      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = new URL(req.url, 'http://x');
        if (!url.pathname.startsWith('/api/')) return next();
        // AI routes spend money with a saved key: only the studio page itself may call them (no other website, no
        // other machine). A custom header forces a CORS preflight, which other origins cannot pass.
        if (url.pathname.startsWith('/api/ai/') || url.pathname.startsWith('/api/tts/')) {   // tts: uses a GPU server, and its address is ours to set
          const origin = String(req.headers.origin || ''), local = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/;
          const addr = String(req.socket?.remoteAddress || '');
          if ((origin && !local.test(origin)) || req.headers['x-2d-studio'] !== '1' || !/^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(addr)) return json(res, { error: 'forbidden' }, 403);
        }
        try {
          const name = safe(url.searchParams.get('name') || '');
          const dir = path.join(PROJECTS, name), file = path.join(dir, 'scene.json');
          switch (`${req.method} ${url.pathname}`) {
            case 'GET /api/projects': {
              const list = fs.readdirSync(PROJECTS, { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(PROJECTS, d.name, 'scene.json'))).map((d) => {
                const f = path.join(PROJECTS, d.name, 'scene.json'), st = fs.statSync(f);
                let info: any = {}; try { const j = JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, '')); info = { duration: j.duration, objects: (j.objects || []).length }; } catch { info = { broken: true }; }
                const exp = path.join(EXPORTS, d.name, d.name + '.mp4');
                return { name: d.name, modified: st.mtimeMs, ...info, rendered: fs.existsSync(exp) ? fs.statSync(exp).mtimeMs : null };
              }).sort((a, b) => b.modified - a.modified);
              return json(res, list);
            }
            case 'GET /api/project': {
              if (!fs.existsSync(file)) return json(res, { error: 'no such project' }, 404);
              res.setHeader('Content-Type', 'application/json'); return res.end(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
            }
            case 'PUT /api/project': {
              if (!name) return json(res, { error: 'name' }, 400);
              const buf = await body(req); JSON.parse(buf.toString('utf8'));   // must be JSON
              fs.mkdirSync(dir, { recursive: true });
              if (fs.existsSync(file)) fs.copyFileSync(file, path.join(dir, 'scene.json.bak'));
              written.set(path.resolve(file).toLowerCase(), hash(buf.toString('utf8'))); fs.writeFileSync(file, buf);
              return json(res, { ok: true });
            }
            case 'DELETE /api/project': {
              if (!name || !fs.existsSync(dir)) return json(res, { error: 'no such project' }, 404);
              fs.rmSync(dir, { recursive: true, force: true }); return json(res, { ok: true });
            }
            case 'POST /api/upload': {   // raw body -> Projects/<name>/<audio|ref>/<file>
              const sub = url.searchParams.get('dir') === 'ref' ? 'ref' : 'audio';
              const fname = sub === 'ref' ? 'ref.mp4' : safe(url.searchParams.get('file') || 'audio.wav');
              fs.mkdirSync(path.join(dir, sub), { recursive: true });
              fs.writeFileSync(path.join(dir, sub, fname), await body(req));
              return json(res, { ok: true, file: `${sub}/${fname}` });
            }
            case 'POST /api/ref': {   // analyse the reference video (download it first when a link is given)
              if (!name) return json(res, { error: 'name' }, 400);
              if (jobs.some((j) => j.state === 'running' && j.kind === 'ref')) return json(res, { error: 'Đang phân tích một video khác.' }, 409);
              const job: Job = { id: Date.now().toString(36), kind: 'ref', project: name, layers: false, state: 'running', progress: 'Đang bắt đầu', log: [], started: Date.now() };
              const args = [path.join(ROOT, 'scripts', 'ref.mjs'), name, '--lang', url.searchParams.get('lang') === 'auto' ? 'auto' : 'en'];
              const link = url.searchParams.get('url'); if (link) args.push('--url', link);
              runJob(job, args); return json(res, { id: job.id });
            }
            case 'GET /api/ref': {
              const j = [...jobs].reverse().find((q) => q.kind === 'ref' && q.project === name);
              const f = path.join(dir, 'ref', 'ref.json');
              const info = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
              const thumbs = fs.existsSync(path.join(dir, 'ref', 'thumbs')) ? fs.readdirSync(path.join(dir, 'ref', 'thumbs')).sort().map((t) => `Projects/${name}/ref/thumbs/${t}`) : [];
              return json(res, { job: j ? { state: j.state, progress: j.progress, log: j.log.slice(-12) } : null, info, thumbs, hasVideo: fs.existsSync(path.join(dir, 'ref', 'ref.mp4')) });
            }
            case 'POST /api/render': {
              const layers = url.searchParams.get('layers') === '1';
              if (jobs.some((j) => j.state === 'running' && j.kind === 'render')) return json(res, { error: 'Đang xuất một video khác.' }, 409);
              const job: Job = { id: Date.now().toString(36), kind: 'render', project: name, layers, state: 'running', progress: 'starting', log: [], started: Date.now(), session: perfId(url.searchParams.get('session')) };
              const args = [path.join(ROOT, 'scripts', 'render.mjs'), name, '--port', String(server.config.server.port || PORT)];
              if (layers) args.push('--layers');
              const from = url.searchParams.get('from'), to = url.searchParams.get('to');
              if (from) args.push('--from', from); if (to) args.push('--to', to);
              if (from) job.from = +from; if (to) job.to = +to;
              runJob(job, args); return json(res, { id: job.id });
            }
            case 'GET /api/render': {
              const j = [...jobs].reverse().find((q) => q.kind === 'render'); if (!j) return json(res, null);
              const { proc, ...rest } = j; return json(res, { ...rest, log: j.log.slice(-30) });
            }
            case 'POST /api/render/check': {   // can this machine render? browser, WebGL, ffmpeg, one frame of the project
              if (jobs.some((j) => j.state === 'running' && j.kind === 'render')) return json(res, { error: 'Đang xuất một video, đợi xong rồi kiểm tra.' }, 409);
              const p = spawn(process.execPath, [path.join(ROOT, 'scripts', 'render.mjs'), name || 'Demo office', '--check', '--port', String(server.config.server.port || PORT)], { cwd: ROOT });
              let out = ''; p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d));
              const timer = setTimeout(() => { p.kill(); out += '\nLỖI: kiểm tra quá 4 phút, đã dừng.'; }, 240000);
              const code: number = await new Promise((r) => p.on('close', (c) => r(c ?? 1))); clearTimeout(timer);
              return json(res, { ok: code === 0, log: out.trim() });
            }
            case 'DELETE /api/render': {
              const j = jobs.find((q) => q.state === 'running' && q.kind === 'render'); if (j?.proc) { j.stopped = true; j.proc.kill(); } return json(res, { ok: true });
            }
            // ---- Breeze TTS (scripts/tts.ts)
            case 'GET /api/tts/status': return json(res, await ttsStatus());
            case 'PUT /api/tts/config': {   // { engine?, url?, elevenKey?, elevenModel? }; the key is kept on this machine only
              try { saveTtsConfig(JSON.parse((await body(req)).toString('utf8'))); } catch (e: any) { return json(res, { error: e.message }, 400); }
              return json(res, await ttsStatus());
            }
            case 'GET /api/tts/voices': {
              try { return json(res, await elevenVoices()); } catch (e: any) { return json(res, { error: e.message }, 502); }
            }
            case 'POST /api/tts/line': {   // ?name=<project>, body { text, instruction, ref, refText, seed, cfg }
              if (!name || !fs.existsSync(dir)) return json(res, { error: 'no such project' }, 404);
              try { return json(res, await ttsLine(dir, JSON.parse((await body(req)).toString('utf8')))); }
              catch (e: any) { return json(res, { error: e.message }, 502); }
            }
            // ---- performance log
            case 'PUT /api/perf':
            case 'POST /api/perf': {   // the studio saves its session (POST: sendBeacon when the page closes)
              const id = perfId(url.searchParams.get('id')); if (!id) return json(res, { error: 'id' }, 400);
              const buf = await body(req); if (buf.length > 8e6) return json(res, { error: 'too big' }, 413);
              const j = JSON.parse(buf.toString('utf8')); if (j.id !== id) return json(res, { error: 'id' }, 400);
              fs.mkdirSync(PERF_SESSIONS, { recursive: true }); fs.writeFileSync(path.join(PERF_SESSIONS, id + '.json'), buf);
              return json(res, { ok: true });
            }
            case 'GET /api/perf': {   // ?id= one whole session; without: every session (no samples) and every render
              const id = perfId(url.searchParams.get('id'));
              if (id) { const f = path.join(PERF_SESSIONS, id + '.json'); if (!fs.existsSync(f)) return json(res, { error: 'not found' }, 404); res.setHeader('Content-Type', 'application/json'); return res.end(fs.readFileSync(f)); }
              const sessions = fs.existsSync(PERF_SESSIONS) ? fs.readdirSync(PERF_SESSIONS).filter((f) => f.endsWith('.json')).map((f) => {
                try { const { samples, ...rest } = JSON.parse(fs.readFileSync(path.join(PERF_SESSIONS, f), 'utf8')); return { ...rest, sampleCount: (samples || []).length }; } catch { return null; }
              }).filter(Boolean).sort((a: any, b: any) => (a.started < b.started ? 1 : -1)) : [];
              const renders = fs.existsSync(PERF_RENDERS) ? fs.readFileSync(PERF_RENDERS, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).reverse() : [];
              return json(res, { sessions, renders });
            }
            case 'DELETE /api/perf': {   // one session, or ?all=1 everything
              if (url.searchParams.get('all') === '1') { fs.rmSync(PERF, { recursive: true, force: true }); return json(res, { ok: true }); }
              const id = perfId(url.searchParams.get('id')); if (!id) return json(res, { error: 'id' }, 400);
              fs.rmSync(path.join(PERF_SESSIONS, id + '.json'), { force: true }); return json(res, { ok: true });
            }
            case 'GET /api/library': {   // everything in Library/, with file contents
              const out: Record<string, any[]> = {};
              for (const [t, ext] of Object.entries(LIB_TYPES)) {
                const dir = path.join(LIBRARY, t);
                out[t] = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => {
                  const text = fs.readFileSync(path.join(dir, f), 'utf8').replace(/^﻿/, '');
                  const item: any = { name: f.slice(0, -ext.length), file: `Library/${t}/${f}`, modified: fs.statSync(path.join(dir, f)).mtimeMs };
                  if (ext === '.json') { try { item.data = JSON.parse(text); } catch (e: any) { item.error = e.message; } } else item.code = text;
                  return item;
                }) : [];
              }
              return json(res, out);
            }
            case 'PUT /api/library': {
              const t = url.searchParams.get('type') || '', ext = LIB_TYPES[t];
              if (!ext || !name) return json(res, { error: 'type / name' }, 400);
              const buf = await body(req); if (ext === '.json') JSON.parse(buf.toString('utf8'));
              fs.mkdirSync(path.join(LIBRARY, t), { recursive: true }); fs.writeFileSync(path.join(LIBRARY, t, name + ext), buf);
              return json(res, { ok: true, file: `Library/${t}/${name}${ext}` });
            }
            case 'DELETE /api/library': {   // moved to Library/Removed, never deleted
              const t = url.searchParams.get('type') || '', ext = LIB_TYPES[t], f = path.join(LIBRARY, t, name + (ext || ''));
              if (!ext || !fs.existsSync(f)) return json(res, { error: 'not found' }, 404);
              const rm = path.join(LIBRARY, 'Removed', t); fs.mkdirSync(rm, { recursive: true });
              fs.renameSync(f, path.join(rm, `${name}-${Date.now().toString(36)}${ext}`)); return json(res, { ok: true });
            }
            case 'PUT /api/project-file': {   // a text file next to a project's scene.json (brief.md)
              const fname = safe(url.searchParams.get('file') || 'brief.md');
              fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, fname), await body(req));
              return json(res, { ok: true, file: `Projects/${name}/${fname}` });
            }
            case 'GET /api/exports': {   // what has been rendered for a project
              const base = path.join(EXPORTS, name), out: any[] = [];
              const walk = (d: string) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { const st = fs.statSync(p); out.push({ file: path.relative(ROOT, p).replace(/\\/g, '/'), rel: path.relative(base, p).replace(/\\/g, '/'), size: st.size, modified: st.mtimeMs }); } } };
              walk(base); return json(res, out.sort((a, b) => a.rel.localeCompare(b.rel)));
            }
            case 'POST /api/snapshot': {   // body: data URL of a frame -> Exports/<name>/snapshots/<file>.jpg (for checking frames)
              const fname = safe(url.searchParams.get('file') || 'frame') + '.jpg';
              const d = (await body(req)).toString('utf8'); const b64 = d.slice(d.indexOf(',') + 1);
              const out = path.join(EXPORTS, name, 'snapshots'); fs.mkdirSync(out, { recursive: true });
              fs.writeFileSync(path.join(out, fname), Buffer.from(b64, 'base64'));
              return json(res, { ok: true, file: path.relative(ROOT, path.join(out, fname)).replace(/\\/g, '/') });
            }
            case 'GET /api/ai/status': return json(res, await aiStatus());
            case 'PUT /api/ai/key': {   // the key goes to ~/.2d-studio/ai.json; it is never sent back to the page
              try { saveKey((await body(req)).toString('utf8')); } catch (e: any) { return json(res, { error: e.message }, 400); }
              return json(res, await aiStatus());
            }
            case 'POST /api/ai/login': {   // open Claude Code in a console window so the user can sign in with /login
              const exe = findCli(); if (!exe) return json(res, { error: 'Không tìm thấy Claude Code trên máy.' }, 404);
              spawn('cmd', ['/c', 'start', 'Claude', exe], { detached: true, cwd: ROOT }); return json(res, { ok: true });
            }
            case 'POST /api/ai/text': {
              const q = JSON.parse((await body(req)).toString('utf8'));
              try { return json(res, { text: await aiText(String(q.system || ''), String(q.prompt || '')) }); }
              catch (e: any) { return json(res, { error: e.message === 'NO_AI' ? 'NO_AI' : e.message }, e.message === 'NO_AI' ? 412 : 500); }
            }
            case 'POST /api/open-folder': {   // show an export folder in Explorer
              const p = path.join(EXPORTS, name); fs.mkdirSync(p, { recursive: true });
              spawn('explorer', [p], { detached: true }); return json(res, { ok: true });
            }
          }
          return json(res, { error: 'unknown api ' + url.pathname }, 404);
        } catch (e: any) { return json(res, { error: e.message }, 500); }
      });
    },
  };
}

export default defineConfig({
  root: ROOT,
  resolve: { alias: { engine: path.join(ROOT, 'engine') } },
  server: { port: PORT, strictPort: true, watch: { ignored: ['**/Exports/**', '**/vendor/**', '**/Projects/**/audio/**', '**/Projects/**/ref/**', '**/Library/Removed/**'] } },
  build: { rollupOptions: { input: { main: path.join(ROOT, 'index.html'), render: path.join(ROOT, 'render.html'), perf: path.join(ROOT, 'perf.html') } } },
  plugins: [studioApi()],
});
