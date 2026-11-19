// Audio clips on the timeline, played in step with the playhead.
import { S } from '../state';

const els = new Map<string, HTMLAudioElement>();
function el(id: string, file: string) {
  let a = els.get(id);
  const src = `/Projects/${encodeURIComponent(S.project)}/${file.split('/').map(encodeURIComponent).join('/')}`;
  if (!a || a.dataset.src !== src) { a = new Audio(src); a.dataset.src = src; a.preload = 'auto'; els.set(id, a); }
  return a;
}
export function audioDuration(id: string, file: string): number { const a = el(id, file); return Number.isFinite(a.duration) ? a.duration : 0; }
export function audioPlay(t: number) { audioSync(t, true); }
export function audioPause() { for (const a of els.values()) a.pause(); }
/** Keep every clip where the playhead says (force: seek even if close). */
export function audioSync(t: number, force = false) {
  if (!S.playing) return;
  for (const c of S.doc.audio) {
    const a = el(c.id, c.file), local = t - c.start;
    a.volume = Math.max(0, Math.min(1, Math.pow(10, (c.gain || 0) / 20)));
    if (local < 0 || (Number.isFinite(a.duration) && local >= a.duration)) { if (!a.paused) a.pause(); continue; }
    if (force || a.paused || Math.abs(a.currentTime - local) > 0.12) { a.currentTime = local; }
    if (a.paused) a.play().catch(() => {});
  }
}
