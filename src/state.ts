// Studio state: the open document, selection, playhead, undo, saving. UI modules listen with on().
import { SceneDoc, normalize, emptyDoc } from './doc';
import { projectOpened } from './perf';

type Ev = 'doc' | 'select' | 'time' | 'play' | 'project' | 'keys' | 'ws';
export type Workspace = 'script' | 'scene' | 'camera' | 'library' | 'export';
const listeners: Record<string, Array<() => void>> = {};
export function on(ev: Ev, fn: () => void) { (listeners[ev] ||= []).push(fn); }
export function emit(ev: Ev) { for (const f of listeners[ev] || []) f(); }

export interface KeyRef { obj: string; track: string; t: number }

export const S = {
  doc: emptyDoc('Untitled') as SceneDoc,
  project: '' as string,
  sel: null as string | null,          // selected object id
  selKeys: [] as KeyRef[],             // selected keyframes
  selCut: -1, selCap: -1,
  selAud: -1,                          // selected audio clip (index)
  selSeg: null as { obj: string; a: number } | null,   // selected object clip on the timeline (its start time)
  setPart: -1,                         // the selected piece of a set (index among its pieces), -1 = the whole set
  focus: 'view' as 'view' | 'timeline',   // where the last click was: decides what Q / W / Delete act on
  t: 0,
  playing: false,
  autoKey: false,                      // (kept for the timeline) same as apply === 'key'
  apply: 'all' as 'all' | 'key',       // a change applies to the whole video, or makes a keyframe at the playhead
  tool: 'select' as 'select' | 'move' | 'rotate' | 'pose' | 'camera',
  tab: 'pos' as string,                // open part tab in the Inspector (characters)
  ws: 'scene' as Workspace,            // the workspace tab over the view
  view: 'camera' as 'camera' | 'free',
  handles: true,
  dirty: false,
};

// ---------------------------------------------------------------- undo
const undo: string[] = [], redo: string[] = [];
let inGesture = false, gestureSnap = false;
/** Call before changing S.doc. All changes inside one gesture (a drag) make one undo step. */
export function checkpoint() {
  if (inGesture) { if (gestureSnap) return; gestureSnap = true; }
  undo.push(JSON.stringify(S.doc)); if (undo.length > 200) undo.shift(); redo.length = 0;
}
export function beginGesture() { inGesture = true; gestureSnap = false; }
export function endGesture() { inGesture = false; gestureSnap = false; }
/** Change the doc: one undo step, then tell everyone and save. */
export function edit(fn: (d: SceneDoc) => void) { checkpoint(); fn(S.doc); changed(); }
export function changed() { S.dirty = true; emit('doc'); scheduleSave(); }
export function doUndo() { const s = undo.pop(); if (!s) return; redo.push(JSON.stringify(S.doc)); S.doc = normalize(JSON.parse(s)); fixSel(); changed(); }
export function doRedo() { const s = redo.pop(); if (!s) return; undo.push(JSON.stringify(S.doc)); S.doc = normalize(JSON.parse(s)); fixSel(); changed(); }
function fixSel() { if (S.sel && !S.doc.objects.find((o) => o.id === S.sel)) S.sel = null; S.selKeys = []; emit('select'); }

// ---------------------------------------------------------------- selection / time
export function select(id: string | null) { if (id !== S.sel) S.setPart = -1; S.sel = id; S.selKeys = []; S.selCut = -1; S.selCap = -1; S.selAud = -1; S.selSeg = null; emit('select'); }
export function setTime(t: number) { S.t = Math.max(0, Math.min(S.doc.duration, t)); emit('time'); }
export const selObj = () => S.doc.objects.find((o) => o.id === S.sel) || null;
export const snapT = (t: number) => Math.round(t * S.doc.fps) / S.doc.fps;

// ---------------------------------------------------------------- projects
let saveTimer = 0;
function scheduleSave() { clearTimeout(saveTimer); saveTimer = window.setTimeout(save, 800); }
export async function save() {
  if (!S.project) return;
  clearTimeout(saveTimer);
  const r = await fetch(`/api/project?name=${encodeURIComponent(S.project)}`, { method: 'PUT', body: JSON.stringify(S.doc, null, 1) });
  if (r.ok) { S.dirty = false; emit('project'); } else toast('Save failed: ' + (await r.text()));
}
export async function openProject(name: string, keepTime = false) {
  const t0 = performance.now(), fresh = !keepTime || S.project !== name;
  const r = await fetch(`/api/project?name=${encodeURIComponent(name)}`);
  if (!r.ok) { toast('Could not open ' + name); return false; }
  const doc = normalize(await r.json());
  if (S.project === name && keepTime) checkpoint(); else { undo.length = 0; redo.length = 0; }
  S.doc = doc; S.project = name; S.dirty = false;
  if (!keepTime) { S.t = 0; S.sel = null; }
  fixSel(); localStorage.setItem('2ds.last', name);
  emit('project'); emit('doc'); emit('time');
  if (fresh) projectOpened(name, performance.now() - t0);   // load + build every object
  return true;
}
export async function newProject(name: string, doc?: SceneDoc) {
  S.doc = doc || emptyDoc(name); S.doc.name = name; S.project = name; S.t = 0; S.sel = null; undo.length = 0; redo.length = 0;
  localStorage.setItem('2ds.last', name);
  await save(); emit('project'); emit('doc'); emit('time'); emit('select');
}

// ---------------------------------------------------------------- toast
export function toast(msg: string, ms = 2600) {
  const el = document.getElementById('toast')!; el.textContent = msg; el.classList.add('on');
  clearTimeout((el as any)._t); (el as any)._t = setTimeout(() => el.classList.remove('on'), ms);
}
