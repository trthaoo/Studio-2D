// 2D Studio entry: wires the panels, shortcuts, live reload of scene.json, and window.studio for automation.
import { loadFonts } from './fonts';
import { loadLibrary } from './library';
import { S, emit, on, openProject, save, doUndo, doRedo, setTime, select, selObj, edit, toast, snapT } from './state';
import { rt, setView, redraw, perfInfo } from './ui/viewport';
import { fullQuality } from 'engine/core.js';
import { zoom, fit } from './ui/timeline';
import { showStart, duplicate, deleteSelection, pollRender } from './ui/panels';
import { onRenderChanged } from './ui/workspaces';
import { setValue, valueAt, normalize, SceneDoc } from './doc';

await loadFonts();
await loadLibrary();

// ---------------------------------------------------------------- keys
window.addEventListener('keydown', (e) => {
  const typing = (e.target as HTMLElement).closest?.('input,textarea,select,[contenteditable]');
  const k = e.key.toLowerCase(), ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && k === 's') { e.preventDefault(); save(); return; }
  if (typing) return;
  if (ctrl && k === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
  if (ctrl && (k === 'y' || k === 'r')) { e.preventDefault(); doRedo(); return; }
  if (ctrl && k === 'd') { e.preventDefault(); const o = selObj(); if (o) duplicate(o); return; }
  if (k === ' ') { e.preventDefault(); S.playing = !S.playing; emit('play'); return; }
  if (k === 'arrowleft') { e.preventDefault(); setTime(snapT(S.t - (e.shiftKey ? 1 : 1 / S.doc.fps))); return; }
  if (k === 'arrowright') { e.preventDefault(); setTime(snapT(S.t + (e.shiftKey ? 1 : 1 / S.doc.fps))); return; }
  if (k === 'home') { setTime(0); return; }
  if (k === 'end') { setTime(S.doc.duration); return; }
  if (k === 'delete' || k === 'backspace') { e.preventDefault(); deleteSelection(); return; }
  if (k === 'escape') { select(null); return; }
  if (k === 'c' && !ctrl) { setView('camera'); return; }
  if (k === 'v' && !ctrl) { setView('free'); return; }
  if (k === '-') { zoom(1 / 1.4); return; }
  if (k === '=' || k === '+') { zoom(1.4); return; }
});
window.addEventListener('beforeunload', (e) => { if (S.dirty) { save(); e.preventDefault(); } });

// ---------------------------------------------------------------- Claude (or anyone) changed scene.json on disk
if (import.meta.hot) {
  import.meta.hot.on('project-changed', async ({ name }: { name: string }) => {
    if (name !== S.project) return;
    await openProject(name, true);
    toast('Claude (hoặc ai đó) vừa sửa scene: đã tải lại. Ctrl+Z để bỏ thay đổi đó.', 4000);
  });
  import.meta.hot.on('render-done', () => { pollRender(); onRenderChanged(); });
  import.meta.hot.on('library-changed', async () => { await loadLibrary(); rt.sync(S.doc); emit('doc'); });
}

// ---------------------------------------------------------------- window.studio: drive the studio from code / Claude
(window as any).studio = {
  get doc() { return S.doc; }, get project() { return S.project; }, get t() { return S.t; },
  runtime: rt,
  open: (name: string) => openProject(name),
  save,
  seek: (t: number) => setTime(t),
  select: (id: string | null) => select(id),
  /** Replace the whole scene (one undo step). */
  setDoc: (d: SceneDoc) => edit(() => { Object.assign(S.doc, normalize(JSON.parse(JSON.stringify(d)))); }),
  /** Set one property at a time (adds a key). */
  key: (id: string, prop: string, t: number, v: any) => { const o = S.doc.objects.find((x) => x.id === id); if (!o) throw new Error('no object ' + id); edit(() => setValue(o, prop, t, v, true)); },
  value: (id: string, prop: string, t = S.t) => { const o = S.doc.objects.find((x) => x.id === id); return o ? valueAt(o, prop, t) : undefined; },
  /** The finished frame at t as a data URL (for checking a frame). */
  frame: (t = S.t, q = 0.9) => fullQuality(() => { rt.draw(t); return rt.frame.toDataURL('image/jpeg', q); }),
  /** Save the frame at t to Exports/<project>/snapshots/<file>.jpg (so Claude can look at it). Always full quality. */
  snapshot: async (t = S.t, file = `t${t.toFixed(2)}`) => { const body = fullQuality(() => { rt.draw(t); return rt.frame.toDataURL('image/jpeg', 0.9); }); redraw(); const r = await fetch(`/api/snapshot?name=${encodeURIComponent(S.project)}&file=${encodeURIComponent(file)}`, { method: 'POST', body }); return (await r.json()).file; },
  /** Preview speed: the quality the viewport uses now and the measured frames per second. */
  perf: () => perfInfo(),
  errors: () => rt.errors,
};

// ---------------------------------------------------------------- start
on('project', () => { document.title = S.project ? `${S.project} — 2D Studio` : '2D Studio'; });
const last = localStorage.getItem('2ds.last');
if (last && (await openProject(last))) { fit(); } else { emit('doc'); showStart(); }
pollRender();
