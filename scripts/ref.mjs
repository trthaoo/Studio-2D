// Reference video analysis for cloning: node scripts/ref.mjs "<project>" [--url <link>] [--lang en|auto]
// Input: a link (downloaded with yt-dlp) or Projects/<project>/ref/ref.mp4 already uploaded.
// Out in Projects/<project>/ref/: ref.mp4, sheet-NN.png (a frame every 0.5 s, time-stamped, 40 per sheet),
// thumbs/shot-NN.jpg (one frame per shot), audio.wav, and ref.json: duration, size, shot cuts, words and lines
// with times (faster-whisper). The studio's Kịch bản tab turns that into a script, a voice and the cut rhythm.
import ffmpegPath from 'ffmpeg-static';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2), name = argv[0];
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const safe = (s) => String(s).replace(/[^\p{L}\p{N} _.\-()]/gu, '_').trim();
const out = path.join(ROOT, 'Projects', safe(name), 'ref');
fs.mkdirSync(out, { recursive: true });
const step = (s) => console.log('PROGRESS ' + s);
const ff = (args) => spawnSync(ffmpegPath, ['-hide_banner', '-v', 'error', ...args], { encoding: 'utf8', maxBuffer: 1 << 26 });
const py = (code, args = []) => spawnSync('python', ['-I', '-c', code, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });

try {
  const video = path.join(out, 'ref.mp4'), url = opt('--url');
  if (url) {
    step('Đang tải video từ link');
    fs.rmSync(video, { force: true });
    const r = spawnSync('python', ['-I', '-m', 'yt_dlp', '-q', '--no-playlist', '--no-progress', '-f', 'mp4/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best', '--merge-output-format', 'mp4', '--ffmpeg-location', ffmpegPath, '-o', video, url], { encoding: 'utf8' });
    if (r.status !== 0 || !fs.existsSync(video)) throw new Error('Không tải được video: ' + (r.stderr || r.stdout).slice(-500));
  }
  if (!fs.existsSync(video)) throw new Error('Chưa có video tham khảo (dán link hoặc chọn file).');

  step('Đang đọc video');
  const probe = spawnSync(ffmpegPath, ['-hide_banner', '-i', video], { encoding: 'utf8' }).stderr;
  const d = probe.match(/Duration: (\d+):(\d+):([\d.]+)/), size = probe.match(/, (\d{2,5})x(\d{2,5})/);
  const duration = d ? +d[1] * 3600 + +d[2] * 60 + +d[3] : 0;
  const hasAudio = /Audio:/.test(probe);

  step('Đang tìm các chỗ cắt cảnh');
  const sc = spawnSync(ffmpegPath, ['-hide_banner', '-i', video, '-vf', "select='gt(scene,0.32)',showinfo", '-an', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 }).stderr;
  const cuts = [0];
  for (const m of sc.matchAll(/pts_time:([\d.]+)/g)) { const t = +(+m[1]).toFixed(2); if (t - cuts[cuts.length - 1] >= 0.4 && duration - t > 0.2) cuts.push(t); }

  step('Đang chụp frame');
  for (const f of fs.readdirSync(out)) if (/^sheet-\d+\.png$/.test(f)) fs.rmSync(path.join(out, f));
  const per = 40, n = Math.ceil(duration / 0.5), sheets = Math.max(1, Math.ceil(n / per));
  for (let s = 0; s < sheets; s++) {
    const from = s * per * 0.5;
    ff(['-y', '-ss', String(from), '-t', String(per * 0.5), '-i', video, '-vf',
      `fps=2,scale=216:-2,drawtext=text='%{eif\\:t+${from}\\:d}.%{eif\\:mod((t+${from})*10\\,10)\\:d}s':x=4:y=4:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.7,tile=8x5`,
      '-frames:v', '1', path.join(out, `sheet-${String(s + 1).padStart(2, '0')}.png`)]);
  }
  const thumbs = path.join(out, 'thumbs'); fs.rmSync(thumbs, { recursive: true, force: true }); fs.mkdirSync(thumbs);
  cuts.forEach((c, i) => { const mid = Math.min(duration - 0.05, (c + (cuts[i + 1] ?? duration)) / 2); ff(['-y', '-ss', String(mid), '-i', video, '-frames:v', '1', '-vf', 'scale=240:-2', path.join(thumbs, `shot-${String(i + 1).padStart(2, '0')}.jpg`)]); });

  let words = [], lines = [], lang = null, transcriptError = null;
  if (hasAudio) {
    step('Đang tách âm thanh');
    ff(['-y', '-i', video, '-vn', '-ac', '1', '-ar', '44100', path.join(out, 'audio.wav')]);
    step('Đang nghe lời thoại (có thể mất 1-3 phút)');
    const pcm = path.join(out, 'audio.f32');
    ff(['-y', '-i', video, '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', pcm]);
    const model = opt('--lang', 'en') === 'en' ? 'small.en' : 'small';
    const r = py(`import json, sys, numpy as np
from faster_whisper import WhisperModel
audio = np.fromfile(sys.argv[1], dtype=np.float32)
m = WhisperModel(sys.argv[2], device='cpu', compute_type='int8')
segs, info = m.transcribe(audio, word_timestamps=True, vad_filter=True, beam_size=5, language=None if sys.argv[2] == 'small' else 'en')
segs = list(segs)
print(json.dumps({'lang': info.language, 'lines': [{'s': round(s.start, 3), 'e': round(s.end, 3), 'text': s.text.strip(), 'words': [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)} for w in (s.words or [])]} for s in segs]}))`, [pcm, model]);
    try { fs.unlinkSync(pcm); } catch {}
    if (r.status === 0) { const j = JSON.parse(r.stdout); lang = j.lang; lines = j.lines; words = lines.flatMap((l) => l.words); }
    else transcriptError = (r.stderr || '').slice(-600);
  }
  const info = { video: 'ref/ref.mp4', url: url || null, duration: +duration.toFixed(3), width: size ? +size[1] : null, height: size ? +size[2] : null, hasAudio, audio: hasAudio ? 'ref/audio.wav' : null,
    cuts, sheets, sheetEvery: 0.5, lang, lines, words: words.length, transcriptError, made: new Date().toISOString() };
  fs.writeFileSync(path.join(out, 'ref.json'), JSON.stringify(info, null, 1));
  console.log(`OUT ref/ref.json  ${duration.toFixed(1)} s, ${cuts.length} cảnh, ${lines.length} câu`);
  process.exit(0);
} catch (e) { console.error('LỖI: ' + e.message); process.exit(1); }
