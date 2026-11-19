// Debug helper (dev only): a turnaround sheet of a character, saved as a snapshot, to check how it looks from every side.
// In the studio console: (await import('/src/debugTurn.ts')).turn({ ...params }, { arms: 'down' })
import { Runtime } from './runtime';
import { normalize } from './doc';
import { fullQuality } from 'engine/core.js';

/** Head close-ups: one row per hair style, one column per angle. */
export async function heads(base: any, styles: string[], angles: number[], file = 'heads', extra: any = {}) {
  const W = 130, H = 130, sheet = document.createElement('canvas'); sheet.width = W * angles.length; sheet.height = H * styles.length;
  const sx = sheet.getContext('2d')!;
  for (let r = 0; r < styles.length; r++) {
    const doc = normalize({ version: 1, name: 'p', fps: 30, width: 1080, height: 1920, duration: 1, stages: [{ id: 's', name: 's', mood: 'day' }],
      objects: [{ id: 'c', name: 'c', kind: 'char', stage: 's', params: { ...base, style: styles[r].split('|')[0], ...extra }, tracks: { rotY: [{ t: 0, v: -90 }], expr: [{ t: 0, v: styles[r].split('|')[1] || 'calm' }] } },
        { id: 'cam', name: 'cam', kind: 'camera', stage: 's', params: {}, tracks: { pos: [{ t: 0, v: [0, 1.15, 2.2] }], target: [{ t: 0, v: [0, 1.15, 0] }], fov: [{ t: 0, v: 22 }] } }],
      cuts: [{ t: 0, camera: 'cam' }], captions: [], audio: [] } as any);
    const rt = new Runtime(); rt.sync(doc);
    angles.forEach((a, i) => {
      (doc.objects[0].tracks as any).rotY = [{ t: 0, v: a }];
      const f = fullQuality(() => rt.draw(0, { captions: false }));
      sx.drawImage(f, 0, 380, 1080, 1080, i * W, r * H, W, H);
    });
  }
  const res = await fetch(`/api/snapshot?name=Demo%20office&file=${file}`, { method: 'POST', body: sheet.toDataURL('image/jpeg', 0.9) });
  return (await res.json()).file;
}

export async function turn(params: any, o: { arms?: string; armL?: string; armR?: string; expr?: string; walk?: number; angles?: number[]; file?: string; project?: string } = {}) {
  const angles = o.angles || [-90, -45, 0, 45, 90, 135, 180, -135];
  const W = 240, H = 380, sheet = document.createElement('canvas'); sheet.width = W * angles.length; sheet.height = H;
  const sx = sheet.getContext('2d')!;
  const doc = normalize({ version: 1, name: 'p', fps: 30, width: 1080, height: 1920, duration: 1, stages: [{ id: 's', name: 's', mood: 'day' }],
    objects: [
      { id: 'floor', name: 'f', kind: 'set', stage: 's', params: { type: 'floor', w: 60, d: 60, color: 0x9aa3b0 }, tracks: {} },
      { id: 'c', name: 'c', kind: 'char', stage: 's', params, tracks: { rotY: [{ t: 0, v: -90 }], armL: [{ t: 0, v: o.armL || o.arms || 'down' }], armR: [{ t: 0, v: o.armR || o.arms || 'down' }], expr: [{ t: 0, v: o.expr || 'calm' }], ...(o.walk ? { walk: [{ t: 0, v: o.walk }] } : {}) } },
      { id: 'cam', name: 'cam', kind: 'camera', stage: 's', params: {}, tracks: { pos: [{ t: 0, v: [0, 0.9, 3.4] }], target: [{ t: 0, v: [0, 0.75, 0] }], fov: [{ t: 0, v: 34 }] } },
    ], cuts: [{ t: 0, camera: 'cam' }], captions: [], audio: [] } as any);
  const rt = new Runtime(); rt.sync(doc);
  angles.forEach((a, i) => {
    (doc.objects[1].tracks as any).rotY = [{ t: 0, v: a }];
    const f = fullQuality(() => rt.draw(o.walk ? 0.4 : 0, { captions: false }));
    sx.drawImage(f, 140, 120, 800, 1267, i * W, 0, W, H);
    sx.fillStyle = '#000'; sx.font = '16px sans-serif'; sx.fillText(String(a), i * W + 6, 18);
  });
  const r = await fetch(`/api/snapshot?name=${encodeURIComponent(o.project || 'Demo office')}&file=${o.file || 'turn'}`, { method: 'POST', body: sheet.toDataURL('image/jpeg', 0.9) });
  return (await r.json()).file;
}
