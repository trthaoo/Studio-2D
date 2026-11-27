// Audio clips on the timeline, played in step with the playhead.
import { S } from '../state';
import type { AudioClip } from '../doc';

const els = new Map<string, HTMLAudioElement>();
function el(id: string, file: string) {
  let a = els.get(id);
  const src = `/Projects/${encodeURIComponent(S.project)}/${file.split('/').map(encodeURIComponent).join('/')}`;
  if (!a || a.dataset.src !== src) { a = new Audio(src); a.dataset.src = src; a.preload = 'auto'; els.set(id, a); }
  return a;
}
export function audioDuration(id: string, file: string): number { const a = el(id, file); return Number.isFinite(a.duration) ? a.duration : 0; }
/** Length of a clip on the timeline: its cut length, else the file from its in-point (3 s while still loading). */
export function clipLength(c: AudioClip): number { if (c.dur != null) return c.dur; const d = audioDuration(c.id, c.file); return d ? Math.max(0.05, d - (c.offset || 0)) : 3; }
export function audioPlay(t: number) { audioSync(t, true); }
export function audioPause() { for (const a of els.values()) a.pause(); }
/** Keep every clip where the playhead says (force: seek even if close). */
export function audioSync(t: number, force = false) {
  if (!S.playing) return;
  for (const c of S.doc.audio) {
    const a = el(c.id, c.file), local = t - c.start, off = c.offset || 0;
    a.volume = Math.max(0, Math.min(1, Math.pow(10, (c.gain || 0) / 20)));
    if (local < 0 || (Number.isFinite(a.duration) && local >= clipLength(c))) { if (!a.paused) a.pause(); continue; }
    if (force || a.paused || Math.abs(a.currentTime - (local + off)) > 0.12) { a.currentTime = local + off; }
    if (a.paused) a.play().catch(() => {});
  }
}
