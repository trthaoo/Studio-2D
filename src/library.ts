// The shared library (Library/ on disk, for every project): saved characters, saved backgrounds (a set with its props
// and lights), and objects made from code. Code objects are JS modules:
//
//   // name: Coffee machine
//   // kind: prop            (prop = an object to place; set = a whole background)
//   export default function build({ THREE, box, flat, paint, labelTex, rng, P }, opts) { const g = new THREE.Group(); ...; return g; }
//
// They run in the studio page (your own / your AI's code), get the engine helpers as the first argument, and return a
// THREE.Group standing on y = 0, front facing +z, in metres (a character is about 1.2 m tall).
import * as THREE from 'three';
import { V3, canvas, ctex, rng } from 'engine/core.js';
import { M, paint, flat, box, plateTex, noiseTex, lacquer } from 'engine/materials.js';
import * as P from 'engine/props.js';
import * as SC from 'engine/scenery.js';

export interface LibItem { name: string; file: string; modified: number; data?: any; code?: string; error?: string }
export interface CodeAsset { name: string; kind: 'prop' | 'set'; label: string; build?: (lib: any, opts: any) => any; error?: string; code: string }
export const LIB = { characters: [] as LibItem[], backgrounds: [] as LibItem[], code: [] as LibItem[], cameras: [] as LibItem[], looks: [] as LibItem[], vfx: [] as LibItem[], plans: [] as LibItem[] };
const assets = new Map<string, CodeAsset>();
const listeners: Array<() => void> = [];
export const onLibrary = (f: () => void) => listeners.push(f);

/** What a code object's build() gets. */
export const CODE_LIB = { THREE, V3, canvas, ctex, rng, M, paint, flat, box, plateTex, noiseTex, lacquer, labelTex: P.labelTex, drawLabel: P.drawLabel, panel: P.panel, sign: P.sign, P, scenery: SC };

export function headerOf(code: string) {
  const name = /\/\/\s*name:\s*(.+)/i.exec(code)?.[1]?.trim(), kind = /\/\/\s*kind:\s*(prop|set)/i.exec(code)?.[1]?.toLowerCase() as 'prop' | 'set' | undefined;
  return { name, kind: kind || 'prop' };
}
/** Compile a code object. Returns the build function or a readable error (with the line). */
export async function compile(code: string): Promise<{ build?: (lib: any, opts: any) => any; error?: string }> {
  let src = code.replace(/^\s*```(?:js|javascript)?\s*\n?/i, '').replace(/\n?```\s*$/, '');   // pasted with its code fence
  if (!/export\s+default/.test(src)) src += '\nexport default (typeof build === "function" ? build : undefined);';
  const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
  try {
    const m = await import(/* @vite-ignore */ url);
    if (typeof m.default !== 'function') return { error: 'Code phải có "export default function build(lib, opts) { ... return group; }"' };
    return { build: m.default };
  } catch (e: any) {
    const line = /:(\d+):\d+\)?$/m.exec(String(e.stack || ''))?.[1];
    return { error: `${e.message}${line ? ` (dòng ${line})` : ''}` };
  } finally { URL.revokeObjectURL(url); }
}
/** Run a build function once to check it makes something. */
export function tryBuild(build: (lib: any, opts: any) => any, opts: any = {}) {
  const g = build(CODE_LIB, opts);
  if (!g || !(g as any).isObject3D) throw new Error('build() phải trả về một THREE.Group / Object3D');
  return g;
}

export async function loadLibrary() {
  try {
    const r = await fetch('/api/library'); const j = await r.json();
    LIB.characters = j.characters || []; LIB.backgrounds = j.backgrounds || []; LIB.code = j.code || []; LIB.cameras = j.cameras || []; LIB.looks = j.looks || []; LIB.vfx = j.vfx || []; LIB.plans = j.plans || [];
  } catch (e) { console.warn('library', e); }
  assets.clear();
  for (const it of LIB.code) {
    const hd = headerOf(it.code || ''), c = await compile(it.code || '');
    assets.set(it.name, { name: it.name, kind: hd.kind, label: hd.name || it.name, build: c.build, error: c.error, code: it.code || '' });
  }
  for (const f of listeners) f();
}
export const codeAsset = (name: string) => assets.get(name);
export const codeAssets = () => [...assets.values()];

const put = (type: string, name: string, body: string) => fetch(`/api/library?type=${type}&name=${encodeURIComponent(name)}`, { method: 'PUT', body }).then(async (r) => { if (!r.ok) throw new Error((await r.json()).error); });
export const saveLibrary = {
  character: (name: string, data: any) => put('characters', name, JSON.stringify(data, null, 1)),
  background: (name: string, data: any) => put('backgrounds', name, JSON.stringify(data, null, 1)),
  code: (name: string, code: string) => put('code', name, code),
  camera: (name: string, data: any) => put('cameras', name, JSON.stringify(data, null, 1)),
  look: (name: string, data: any) => put('looks', name, JSON.stringify(data, null, 1)),
  vfx: (name: string, code: string) => put('vfx', name, code),
  plan: (name: string, data: any) => put('plans', name, JSON.stringify(data, null, 1)),
};
export const removeFromLibrary = (type: string, name: string) => fetch(`/api/library?type=${type}&name=${encodeURIComponent(name)}`, { method: 'DELETE' });
export const safeName = (s: string) => String(s || '').replace(/[^\p{L}\p{N} _.\-()]/gu, '_').trim().slice(0, 60) || 'item';

/** Header of a VFX code file in Library/vfx: // name: ..., // at: feet|hips|chest|head|leftHand|rightHand, // dur: seconds. */
export function vfxHeader(code: string) {
  const name = /\/\/\s*name:\s*(.+)/i.exec(code)?.[1]?.trim(), at = /\/\/\s*at:\s*(\w+)/i.exec(code)?.[1] as any, dur = parseFloat(/\/\/\s*dur:\s*([\d.]+)/i.exec(code)?.[1] || '');
  return { name, at: (['feet', 'hips', 'chest', 'head', 'leftHand', 'rightHand'].includes(at) ? at : 'feet') as 'feet' | 'hips' | 'chest' | 'head' | 'leftHand' | 'rightHand', dur: dur > 0 ? dur : 3 };
}
export const vfxCodeOf = (name: string) => LIB.vfx.find((x) => x.name === name)?.code;