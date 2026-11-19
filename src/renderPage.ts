// Offline render page (opened by scripts/render.mjs in a headless browser). Same Runtime as the studio view, so
// the video is exactly what the studio shows. Layers: every object on its own transparent picture.
import { loadFonts } from './fonts';
import { Runtime } from './runtime';
import { normalize, SceneDoc } from './doc';
import { loadLibrary } from './library';

const W = 1080, H = 1920;
const q = new URLSearchParams(location.search);
const rt = new Runtime();
let doc: SceneDoc;

async function boot() {
  await loadFonts();
  await loadLibrary();
  const r = await fetch(`/api/project?name=${encodeURIComponent(q.get('project') || '')}`);
  if (!r.ok) throw new Error('project not found');
  doc = normalize(await r.json());
  rt.sync(doc);
  if (rt.errors.length) console.warn(rt.errors.join('\n'));
  rt.draw(0);   // warm up shaders and textures
  return true;
}
(window as any).__ready = boot();

/** Objects that get a layer of their own: everything you can see that is not the set itself. */
const layerObjs = () => doc.objects.filter((o) => (o.kind === 'char' || o.kind === 'car' || o.kind === 'prop') && !o.hidden);

(window as any).info = () => ({ duration: doc.duration, fps: doc.fps, name: doc.name, errors: rt.errors, audio: doc.audio, layers: layerObjs().map((o) => ({ id: o.id, name: o.name, kind: o.kind, parent: o.parent || null })) });

/** The finished frame (with captions) as JPEG. */
(window as any).renderFull = (t: number, quality = 0.93) => { rt.hideOnly.clear(); rt.draw(t, { captions: true }); return rt.frame.toDataURL('image/jpeg', quality); };

const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tctx = tmp.getContext('2d', { willReadFrequently: true })!;
function grab(): Uint8ClampedArray { tctx.clearRect(0, 0, W, H); tctx.drawImage(rt.frame, 0, 0); return tctx.getImageData(0, 0, W, H).data; }
function png(data: Uint8ClampedArray) { const im = new ImageData(new Uint8ClampedArray(data), W, H); tctx.putImageData(im, 0, 0); return tmp.toDataURL('image/png'); }

/**
 * Every layer of one frame. Each object's layer is the pixels that change when that object is left out (its body,
 * its shadow, what it lights), and every pixel belongs to one layer only (the object that changes it most), so
 * background + layers + captions stack back into the finished frame.
 */
(window as any).renderLayers = (t: number) => {
  const objs = layerObjs();
  rt.hideOnly.clear(); rt.draw(t, { captions: false }); const F = grab();
  // each object: the frame without it (G) against the frame with it in flat magenta (K). Where they differ is the
  // object itself (exact silhouette, even where it is the same colour as what is behind it) and its shadow.
  const D: Float32Array[] = [];
  for (const o of objs) {
    rt.hideOnly.clear(); rt.hideOnly.add(o.id); rt.draw(t, { captions: false }); const G = grab();
    rt.hideOnly.clear(); rt.tintOnly = o.id; rt.draw(t, { captions: false }); rt.tintOnly = null; const K = grab();
    const d = new Float32Array(W * H);
    for (let i = 0, p = 0; p < d.length; p++, i += 4) d[p] = Math.max(Math.abs(K[i] - G[i]), Math.abs(K[i + 1] - G[i + 1]), Math.abs(K[i + 2] - G[i + 2]));
    D.push(d);
  }
  // clean plate: everything left out
  rt.hideOnly.clear(); for (const o of objs) rt.hideOnly.add(o.id); rt.draw(t, { captions: false });
  const clean = rt.frame.toDataURL('image/jpeg', 0.93);
  rt.hideOnly.clear();
  // owner of each pixel, and its alpha (soft: a change of 24 levels or more is fully this object's)
  const layers: Record<string, string> = {};
  const owner = new Int16Array(W * H).fill(-1), alpha = new Float32Array(W * H);
  for (let p = 0; p < owner.length; p++) {
    let best = -1, bv = 3;   // ignore changes under 3 levels (noise)
    for (let k = 0; k < D.length; k++) if (D[k][p] > bv) { bv = D[k][p]; best = k; }
    owner[p] = best; alpha[p] = best < 0 ? 0 : Math.min(1, bv / 24);
  }
  objs.forEach((o, k) => {
    const out = new Uint8ClampedArray(W * H * 4); let any = false;
    for (let p = 0, i = 0; p < owner.length; p++, i += 4) if (owner[p] === k) { out[i] = F[i]; out[i + 1] = F[i + 1]; out[i + 2] = F[i + 2]; out[i + 3] = Math.round(alpha[p] * 255); any = true; }
    layers[o.id] = any ? png(out) : '';
  });
  // captions alone
  const cc = document.createElement('canvas'); cc.width = W; cc.height = H; const cx = cc.getContext('2d')!; rt.drawCaptions(cx, t);
  // the finished frame (captions on top) for the main video
  rt.draw(t, { captions: true });
  return { full: rt.frame.toDataURL('image/jpeg', 0.93), clean, captions: cc.toDataURL('image/png'), layers };
};
