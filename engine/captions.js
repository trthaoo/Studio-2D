// Captions: one card at a time, instant on/off, centred at 1372 px (71% of 1920), Poppins 800 76 px,
// white with a black outline and a soft shadow. caps: [[t, 'text'], ...] sorted by time.
export function drawCaption(ctx, caps, t) {
  if (!caps.length) return;
  let s = caps[0][1]; for (const [ct, w] of caps) if (t >= ct) s = w;
  if (!s) return;
  const W = ctx.canvas.width;
  ctx.save(); ctx.font = '800 76px Cap'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
  ctx.strokeStyle = '#000'; ctx.lineWidth = 13; ctx.strokeText(s, W / 2, 1372);
  ctx.shadowColor = 'transparent'; ctx.fillStyle = '#fff'; ctx.fillText(s, W / 2, 1372); ctx.restore();
}

// Sentence start times from word timings: S[0] is sentence 1. Use them for shot starts so a new take retimes the edit.
export function sentenceStarts(words) {
  const out = []; let start = true;
  for (const w of words) { if (start) out.push(w.s); start = /[.?!]["']?$/.test(w.w); }
  return out;
}
// Time of the first word matching text (case-insensitive) at or after time `from`. For cutting on a word ("buys").
export function wordTime(words, text, from = 0) {
  const k = text.toLowerCase(); const w = words.find((w) => w.s >= from && w.w.toLowerCase().replace(/[^a-z0-9']/g, '') === k);
  return w ? w.s : null;
}
// Before the voice exists: fake word timings from the script at a steady pace (3.8 words/s), so the preview and the
// storyboard can be built first. script = array of sentences.
export function estimateWords(script, wps = 3.8, gap = 0.35) {
  const out = []; let t = 0.15;
  for (const s of script) { for (const w of s.split(/\s+/).filter(Boolean)) { const d = 1 / wps; out.push({ w, s: t, e: t + d * 0.85 }); t += d; } t += gap; }
  return out;
}

// Word timings ([{w, s, e}] from kit/words.py) -> caption cards. Mostly single words; short function words
// are joined to the next word ("the car", "on an"). About 3 cards a second.
const GLUE = new Set(['a', 'an', 'the', 'on', 'in', 'of', 'to', 'at', 'his', 'her', 'my', 'your', 'their', 'is', 'it', 'and', 'so', 'but', 'for', 'with', 'he', 'she', 'i']);
export function captionsFromWords(words, minDur = 0.22) {
  const out = []; let i = 0;
  while (i < words.length) {
    let text = words[i].w, s = words[i].s, j = i + 1;
    if (GLUE.has(text.toLowerCase().replace(/[^a-z']/g, '')) && j < words.length && !/[.,!?]$/.test(text)) { text += ' ' + words[j].w; j++; }
    out.push([out.length ? s : 0, text]);
    i = j;
  }
  for (let k = out.length - 1; k > 0; k--) if (out[k][0] - out[k - 1][0] < minDur) { out[k - 1][1] += ' ' + out[k][1]; out.splice(k, 1); }
  return out;
}
