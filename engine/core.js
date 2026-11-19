// Core: helpers, the renderer, camera tracks, and run() which turns a shot list into window.draw / grab / check.
import * as THREE from 'three';
import { drawCaption } from './captions.js';
export { THREE };

export const W = 1080, H = 1920, FPS = 30;
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const ease = (t0, t1, t) => smooth((t - t0) / (t1 - t0));
export const DEG = Math.PI / 180;
export function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function ctex(c, repeat) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

// ------------------------------------------------------------------ renderer (one for all shots)
export const glCanvas = canvas(W, H);
export const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true, stencil: true });   // stencil: faces mask their own bodies (chars.js)
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;

// ------------------------------------------------------------------ painterly two-pass render
// Characters live on CHAR_LAYER. Pass 1 renders the world (layer 0) into a target; a full-screen pass paints it
// (Kuwahara oil-paint filter, lower saturation, distance haze, canvas grain) and writes its depth back; pass 2 draws
// the characters crisp on top, still hidden correctly behind cars and walls. Mood keys (all optional):
//   paint: { radius: brush radius in half-res px (3), detail: share of the unpainted image kept (0.22), sat: 0.8, bright: 0.95, contrast: 0.94, haze: [nearM, farM, amount], hazeColor: hex, grain: 0.035 }
//   ao: 0.55 (ambient-occlusion strength), aoRadius: 0.45 m, bloom: 0.8 (glow of HDR lights), bloomThreshold: 1.05
//   ink: 0.85 (world outline strength, 0 = off), inkColor, inkWidth: [px at 6 m, px at 90 m], inkCrease: null (no lines
//   inside objects; [deg start, deg full] turns crease lines on), inkFade: [m, m] (lines gone in the background), inkJump: [rel, rel]
//   inkId: 0 (off) | width factor: also ink every border between two different objects (an object-ID pass), so things
//   that touch a wall or the floor (frames, desks, posters) are outlined too. For interiors; not for foliage.
//   vignette: [strength, start radius], tintShadow / tintHigh: [r, g, b] offsets (split tone). grain defaults to 0:
//   reference shorts measure no grain, and grain doubles the file size and turns to mush on YouTube.
//   charTint: [r, g, b] multiplies character shading (night and rain read darker).
export const CHAR_LAYER = 1;
// Car glass is drawn LAST (after the inked world and the characters), so its tint and reflections sit over the inked
// cabin and the drivers like real glass; it is not in the world depth, so drivers behind it stay visible.
export const GLASS_LAYER = 2;
export const CHAR_UNI = { lightDir: { value: new THREE.Vector3(0.42, 0.78, 0.46).normalize() }, tint: { value: new THREE.Color(1, 1, 1) } };
export const PAINT_DEFAULT = { radius: 0, detail: 0.22, sat: 1.0, bright: 1.0, contrast: 1.0, haze: [10, 140, 0.32], grain: 0, ao: 0.55, aoRadius: 0.45, bloom: 0.8, bloomThreshold: 1.05,
  ink: 0.85, inkColor: 0x15120f, inkWidth: [2.6, 1.4], inkCrease: null, inkFade: [18, 60], inkJump: [0.05, 0.12], inkId: 0, vignette: [0.12, 0.45], tintShadow: [0, 0, 0], tintHigh: [0, 0, 0] };
const worldRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4, depthTexture: new THREE.DepthTexture(W, H) });   // 4x anti-aliasing
const brushRT = new THREE.WebGLRenderTarget(W / 2, H / 2, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
const quadVS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
// pass A (half resolution): generalized Kuwahara, 8 circular sectors with polynomial weights (Kyprianidis 2010):
// flat, soft brush patches that keep edges, without the blocky look of the square 4-quadrant filter.
const brushMat = new THREE.ShaderMaterial({
  uniforms: { tCol: { value: worldRT.texture }, px: { value: new THREE.Vector2(2 / W, 2 / H) }, radius: { value: 3 } },
  vertexShader: quadVS,
  fragmentShader: `
    uniform sampler2D tCol; uniform vec2 px; uniform float radius; varying vec2 vUv;
    void main(){
      const int R = 4; const float zeta = 0.5, eta = 0.33, q = 8.0;
      vec4 m[8]; vec3 s[8];
      for (int k = 0; k < 8; k++) { m[k] = vec4(0.0); s[k] = vec3(0.0); }
      float sc = radius / float(R);
      for (int j = -R; j <= R; j++) for (int i = -R; i <= R; i++) {
        vec2 v = vec2(float(i), float(j)) / float(R); if (dot(v, v) > 1.0) continue;
        vec3 c = min(texture2D(tCol, vUv + vec2(float(i), float(j)) * px * sc).rgb, vec3(4.0)); vec3 cc = c * c;
        float w[8]; float sum = 0.0; float z; float vxx = zeta - eta * v.x * v.x, vyy = zeta - eta * v.y * v.y;
        z = max(0.0, v.y + vxx); w[0] = z * z; z = max(0.0, -v.x + vyy); w[2] = z * z; z = max(0.0, -v.y + vxx); w[4] = z * z; z = max(0.0, v.x + vyy); w[6] = z * z;
        vec2 u = 0.70710678 * vec2(v.x - v.y, v.x + v.y); vxx = zeta - eta * u.x * u.x; vyy = zeta - eta * u.y * u.y;
        z = max(0.0, u.y + vxx); w[1] = z * z; z = max(0.0, -u.x + vyy); w[3] = z * z; z = max(0.0, -u.y + vxx); w[5] = z * z; z = max(0.0, u.x + vyy); w[7] = z * z;
        for (int k = 0; k < 8; k++) sum += w[k];
        float g = exp(-3.125 * dot(v, v)) / max(sum, 1e-4);
        for (int k = 0; k < 8; k++) { float wk = w[k] * g; m[k] += vec4(c * wk, wk); s[k] += cc * wk; }
      }
      vec4 o = vec4(0.0);
      for (int k = 0; k < 8; k++) {
        vec3 mu = m[k].rgb / max(m[k].w, 1e-5); vec3 sd = abs(s[k] / max(m[k].w, 1e-5) - mu * mu);
        float a = 1.0 / (1.0 + pow(1000.0 * (sd.r + sd.g + sd.b) / 3.0 + 1e-3, q * 0.5));
        o += vec4(mu * a, a);
      }
      gl_FragColor = vec4(o.rgb / max(o.w, 1e-5), 1.0);
    }`,
  depthTest: false, depthWrite: false,
});
// bloom: bright parts of the HDR world (lamps, headlights, brake lights, lit windows, gauges) at quarter resolution,
// blurred twice, added back in pass B.
const QW = W / 4, QH = H / 4, qOpt = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
const bloomA = new THREE.WebGLRenderTarget(QW, QH, qOpt), bloomB = new THREE.WebGLRenderTarget(QW, QH, qOpt);
const brightMat = new THREE.ShaderMaterial({
  uniforms: { tCol: { value: worldRT.texture }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, thr: { value: 1.05 } },
  vertexShader: quadVS,
  fragmentShader: `uniform sampler2D tCol; uniform vec2 px; uniform float thr; varying vec2 vUv;
    void main(){ vec3 c = vec3(0.0);
      for (int j = -1; j <= 2; j++) for (int i = -1; i <= 2; i++) c += min(texture2D(tCol, vUv + vec2(float(i), float(j)) * px).rgb, vec3(12.0));
      c /= 16.0; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * max(l - thr, 0.0) / max(l, 1e-4), 1.0); }`,
  depthTest: false, depthWrite: false,
});
const blurMat = new THREE.ShaderMaterial({
  uniforms: { tCol: { value: null }, dir: { value: new THREE.Vector2() } },
  vertexShader: quadVS,
  fragmentShader: `uniform sampler2D tCol; uniform vec2 dir; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tCol, vUv).rgb * 0.2270270;
      c += (texture2D(tCol, vUv + dir * 1.3846154).rgb + texture2D(tCol, vUv - dir * 1.3846154).rgb) * 0.3162162;
      c += (texture2D(tCol, vUv + dir * 3.2307692).rgb + texture2D(tCol, vUv - dir * 3.2307692).rgb) * 0.0702703;
      gl_FragColor = vec4(c, 1.0); }`,
  depthTest: false, depthWrite: false,
});
// ink outlines on the 3D world (method adapted from claude-animated-shorts, MIT; widths measured on reference shorts):
// black lines ~5 px near -> ~3.3 px far at 1080x1920 on silhouettes, depth jumps and creases. Characters are not in the
// world buffer, so they never get world ink (they carry their own outline). Normals are rebuilt from the depth buffer
// (no second scene render; cut-out leaves and grass keep their real shape), then an edge mask is drawn at full
// resolution and composited over the painted image in display space, so the lines stay crisp after the brush.
const fOpt = { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false };
const normRT = new THREE.WebGLRenderTarget(W, H, fOpt), inkRT = new THREE.WebGLRenderTarget(W, H, { ...fOpt, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
// object-ID pass: every visible solid mesh drawn in a flat colour made from its id (no blending, no MSAA)
const idRT = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const idMat = new THREE.ShaderMaterial({
  uniforms: { idc: { value: new THREE.Color() } },
  vertexShader: `#include <common>
    #include <skinning_pars_vertex>
    void main(){
      #include <begin_vertex>
      #include <skinning_vertex>
      #include <project_vertex>
    }`,
  fragmentShader: 'uniform vec3 idc; void main(){ gl_FragColor = vec4(idc, 1.0); }',
});
function idColor(id, c) { const h = Math.imul(id + 1, 2654435761) >>> 0; return c.setRGB(((h & 255) | 1) / 255, ((h >> 8) & 255) / 255, ((h >> 16) & 255) / 255, THREE.SRGBColorSpace); }
function renderIds(scene, camera) {
  const hidden = [], hooked = [];
  scene.traverse((o) => {
    if (!o.visible) return;
    const m = o.material, solid = o.isMesh && !(Array.isArray(m) ? m.some((x) => x.transparent || x.alphaTest > 0) : m && (m.transparent || m.alphaTest > 0));
    if (o.isSprite || o.isPoints || o.isLine || o.userData.noHit || o.userData.noInk || (o.isMesh && !solid)) { hidden.push(o); o.visible = false; return; }
    if (o.isMesh) { hooked.push([o, o.onBeforeRender]); const id = o.userData.inkGroup ?? o.id; o.onBeforeRender = () => { idColor(id, idMat.uniforms.idc.value); idMat.uniformsNeedUpdate = true; }; }
  });
  const bg = scene.background, ov = scene.overrideMaterial, au = renderer.shadowMap.autoUpdate, cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha();
  scene.background = null; scene.overrideMaterial = idMat; renderer.shadowMap.autoUpdate = false; renderer.setClearColor(0x000000, 1);
  renderer.setRenderTarget(idRT); renderer.clear(); renderer.render(scene, camera);
  scene.background = bg; scene.overrideMaterial = ov; renderer.shadowMap.autoUpdate = au; renderer.setClearColor(cc, ca);
  for (const o of hidden) o.visible = true; for (const [o, f] of hooked) o.onBeforeRender = f;
}
const DEPTH_GLSL = `uniform sampler2D tDep; uniform vec2 px, nearFar, pp;
    float vz(float d){ float zn = d * 2.0 - 1.0; return 2.0 * nearFar.x * nearFar.y / (nearFar.y + nearFar.x - zn * (nearFar.y - nearFar.x)); }
    float zAt(vec2 uv){ return vz(texture2D(tDep, uv).r); }
    vec3 vpos(vec2 uv, float z){ vec2 n = uv * 2.0 - 1.0; return vec3(n.x * z / pp.x, n.y * z / pp.y, -z); }`;
const normMat = new THREE.ShaderMaterial({
  uniforms: { tDep: { value: worldRT.depthTexture }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, nearFar: { value: new THREE.Vector2(0.1, 1000) }, pp: { value: new THREE.Vector2(1, 1) } },
  vertexShader: quadVS,
  fragmentShader: DEPTH_GLSL + `
    varying vec2 vUv;
    void main(){
      float d = texture2D(tDep, vUv).r; if (d >= 0.99999) { gl_FragColor = vec4(0.0); return; }
      float z = vz(d); vec3 P = vpos(vUv, z);
      vec2 ox = vec2(px.x, 0.0), oy = vec2(0.0, px.y);
      vec3 L = vpos(vUv - ox, zAt(vUv - ox)), R = vpos(vUv + ox, zAt(vUv + ox)), D = vpos(vUv - oy, zAt(vUv - oy)), U = vpos(vUv + oy, zAt(vUv + oy));
      vec3 dx = abs(R.z - P.z) < abs(P.z - L.z) ? R - P : P - L, dy = abs(U.z - P.z) < abs(P.z - D.z) ? U - P : P - D;
      vec3 n = normalize(cross(dx, dy)); if (dot(n, -P) < 0.0) n = -n;
      gl_FragColor = vec4(n, 1.0);
    }`,
  depthTest: false, depthWrite: false,
});
const inkMat = new THREE.ShaderMaterial({
  uniforms: { tDep: { value: worldRT.depthTexture }, tN: { value: normRT.texture }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, nearFar: { value: new THREE.Vector2(0.1, 1000) }, pp: { value: new THREE.Vector2(1, 1) },
    wNear: { value: 5.1 }, wFar: { value: 3.3 }, dNear: { value: 6 }, dFar: { value: 90 }, creaseScale: { value: 0.8 }, depthLo: { value: 0.01 }, depthHi: { value: 0.03 },
    cosLo: { value: Math.cos(35 * Math.PI / 180) }, cosHi: { value: Math.cos(50 * Math.PI / 180) }, concave: { value: 0.7 }, farOp: { value: 0.95 }, fade: { value: new THREE.Vector2(150, 450) }, creaseOn: { value: 1 },
    tId: { value: idRT.texture }, idOn: { value: 0 }, idScale: { value: 0.6 } },
  vertexShader: quadVS,
  fragmentShader: DEPTH_GLSL + `
    uniform sampler2D tN, tId; uniform float wNear, wFar, dNear, dFar, creaseScale, depthLo, depthHi, cosLo, cosHi, concave, farOp, creaseOn, idOn, idScale; uniform vec2 fade;
    varying vec2 vUv;
    float crease(vec3 n0, vec3 P0, float zc, vec2 uq, float zq){
      vec4 nq = texture2D(tN, uq);
      if (nq.a < 0.5 || abs(zq - zc) > zc * depthLo) return 0.0;
      float k = 1.0 - smoothstep(cosHi, cosLo, dot(n0, nq.xyz));
      if (dot(vpos(uq, zq) - P0, n0) > 0.0) k *= concave;
      return k;
    }
    void main(){
      vec4 nc = texture2D(tN, vUv); if (nc.a < 0.5) { gl_FragColor = vec4(0.0); return; }
      float zc = zAt(vUv);
      float t = clamp(log(zc / dNear) / log(dFar / dNear), 0.0, 1.0);
      float w = mix(wNear, wFar, t), hc = 0.5 * w * creaseScale, Wc = 1.0 / zc;
      vec3 n0 = nc.xyz, P0 = vpos(vUv, zc);
      float eD = 0.0, eN = 0.0, eI = 0.0; vec3 id0 = texture2D(tId, vUv).rgb;
      for (int a = 0; a < 4; a++) {
        vec2 st = a == 0 ? vec2(1.0, 0.0) : a == 1 ? vec2(0.0, 1.0) : a == 2 ? vec2(1.0, 1.0) : vec2(1.0, -1.0);
        float sl = a < 2 ? 1.0 : 1.41421;
        for (int r = 1; r <= 7; r++) {
          float dd = (float(r) - 0.5) * sl, cw = clamp(w + 0.5 - dd, 0.0, 1.0), ch = clamp(hc + 0.5 - dd, 0.0, 1.0), ci = clamp(w * idScale + 0.5 - dd, 0.0, 1.0) * idOn;
          if (cw <= 0.0 && ch <= 0.0 && ci <= 0.0) break;
          vec2 o = st * px * float(r);
          float z1 = zAt(vUv - o), z2 = zAt(vUv + o);
          float sd = (1.0 / z1 + 1.0 / z2 - 2.0 * Wc) / Wc;          // 2nd difference of 1/z: 0 on planes, < 0 on the near side of a jump
          eD = max(eD, smoothstep(depthLo, depthHi, -sd) * cw);
          if (ch > 0.0 && creaseOn > 0.5) eN = max(eN, max(crease(n0, P0, zc, vUv - o, z1), crease(n0, P0, zc, vUv + o, z2)) * ch);
          if (ci > 0.0) { vec3 a1 = texture2D(tId, vUv - o).rgb, a2 = texture2D(tId, vUv + o).rgb;   // a border between two objects
            if (max(distance(a1, id0), distance(a2, id0)) > 0.002) eI = max(eI, ci); }
        }
      }
      gl_FragColor = vec4(max(max(eD, eN), eI) * mix(1.0, farOp, t) * (1.0 - smoothstep(fade.x, fade.y, zc)), 0.0, 0.0, 1.0);
    }`,
  depthTest: false, depthWrite: false,
});
// pass B (full resolution, to the screen): brushed colour + distance haze + lower saturation + canvas grain; writes the
// world depth so the character pass is hidden correctly behind cars and walls.
const paintMat = new THREE.ShaderMaterial({
  uniforms: { tCol: { value: brushRT.texture }, tRaw: { value: worldRT.texture }, tDep: { value: worldRT.depthTexture }, px: { value: new THREE.Vector2(1 / W, 1 / H) },
    sat: { value: 0.8 }, bright: { value: 0.95 }, contrast: { value: 0.94 }, haze: { value: new THREE.Vector3(10, 140, 0.32) },
    hazeCol: { value: new THREE.Color() }, grain: { value: 0.035 }, nearFar: { value: new THREE.Vector2(0.1, 1000) }, detail: { value: 0.25 },
    tBloom: { value: bloomA.texture }, bloom: { value: 0.8 }, ao: { value: 0.55 }, aoR: { value: 0.45 }, focal: { value: 1000 },
    tInk: { value: inkRT.texture }, ink: { value: 1 }, inkCol: { value: new THREE.Color(0x0b0a0c) }, inkHaze: { value: 0.5 },
    vig: { value: new THREE.Vector2(0.12, 0.45) }, tintS: { value: new THREE.Vector3() }, tintH: { value: new THREE.Vector3() },
    dof: { value: new THREE.Vector3(0, 10, 24) } },
  vertexShader: quadVS,
  fragmentShader: `
    uniform sampler2D tCol, tRaw, tDep, tBloom, tInk; uniform vec2 px, nearFar, vig; uniform float sat, bright, contrast, grain, detail, bloom, ao, aoR, focal, ink, inkHaze; uniform vec3 haze, hazeCol, inkCol, tintS, tintH, dof;
    float vz(float d){ float zn = d * 2.0 - 1.0; return 2.0 * nearFar.x * nearFar.y / (nearFar.y + nearFar.x - zn * (nearFar.y - nearFar.x)); }
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    // thin-lens depth of field: CoC radius (px) = cInf * |1 - focus / depth| (x1.2 in front of the focus plane), clamped.
    float coc(float z){ float c = dof.x * (1.0 - dof.y / max(z, 1e-3)); if (c < 0.0) c *= 1.2; return clamp(c, -dof.z, dof.z); }
    vec3 base(vec2 uv){ return mix(texture2D(tCol, uv).rgb, texture2D(tRaw, uv).rgb, detail); }
    float inkTent(vec2 uv){ float a = 0.0; a = 4.0 * texture2D(tInk, uv).r + 2.0 * (texture2D(tInk, uv + vec2(px.x, 0.0)).r + texture2D(tInk, uv - vec2(px.x, 0.0)).r + texture2D(tInk, uv + vec2(0.0, px.y)).r + texture2D(tInk, uv - vec2(0.0, px.y)).r)
      + texture2D(tInk, uv + px).r + texture2D(tInk, uv - px).r + texture2D(tInk, uv + vec2(px.x, -px.y)).r + texture2D(tInk, uv + vec2(-px.x, px.y)).r; return a / 16.0; }
    void main(){
      float d = texture2D(tDep, vUv).r;
      float viewZ = vz(d);
      vec3 col = base(vUv); float inkA = inkTent(vUv);   // keep a little crisp detail (sign text, edges)
      if (dof.x > 0.25) {
        float z0 = d >= 0.99999 ? 1e4 : viewZ, R = abs(coc(z0));
        if (R > 0.6) {
          vec3 acc = col; float ia = inkA, ws = 1.0;
          for (int i = 0; i < 48; i++) {
            float rr = sqrt((float(i) + 0.5) / 48.0) * R, a = float(i) * 2.39996323;
            vec2 suv = vUv + vec2(cos(a), sin(a)) * rr * px;
            float ds = texture2D(tDep, suv).r, zs = ds >= 0.99999 ? 1e4 : vz(ds), rs = abs(coc(zs));
            if (zs > z0) rs = min(rs, R);                  // the background never bleeds over a nearer pixel
            float w = clamp(rs - rr + 0.5, 0.0, 1.0);      // does the sample's own blur disc reach this pixel?
            acc += base(suv) * w; ia += texture2D(tInk, suv).r * w; ws += w;
          }
          col = acc / ws; inkA = ia / ws;
        }
      }
      // ambient occlusion from the depth buffer: nearer neighbours within aoR metres darken this pixel (contact shadows)
      if (d < 0.99999 && ao > 0.0) {
        float rp = clamp(aoR * focal / viewZ, 2.0, 60.0), occ = 0.0, rot = hash(vUv / px) * 6.2832;
        for (int k = 0; k < 12; k++) {
          float fk = float(k), a = rot + fk * 2.3999632, rr = rp * sqrt((fk + 0.5) / 12.0);
          float sz = vz(texture2D(tDep, vUv + vec2(cos(a), sin(a)) * rr * px).r), dz = viewZ - sz;
          occ += smoothstep(0.03, 0.18, dz) * (1.0 - smoothstep(aoR, aoR * 2.5, dz));
        }
        col *= 1.0 - ao * occ / 12.0;
      }
      float hz = d >= 0.99999 ? haze.z * 0.6 : smoothstep(haze.x, haze.y, viewZ) * haze.z;
      col += texture2D(tBloom, vUv).rgb * bloom;
      col = mix(col, hazeCol, hz);
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, sat);
      col = (col - 0.18) * contrast + 0.18;
      vec2 cell = floor(vUv / px / 3.0);
      col *= bright * (1.0 + (hash(cell) - 0.5) * grain + (hash(floor(vUv / px / 11.0) + 7.0) - 0.5) * grain * 0.8);
      float ly = clamp(dot(col, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
      col += tintS * (1.0 - smoothstep(0.0, 0.35, ly)) + tintH * smoothstep(0.45, 1.0, ly);    // split tone
      vec2 pv = vUv * 2.0 - 1.0; col *= 1.0 - vig.x * smoothstep(vig.y, 1.0, length(pv) * 0.70710678);  // vignette
      gl_FragColor = vec4(max(col, 0.0), 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      if (ink > 0.0) {
        float a = inkA;
        vec3 ic = mix(inkCol, hazeCol, hz * inkHaze);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, pow(ic, vec3(1.0 / 2.2)), clamp(a * ink, 0.0, 1.0));
      }
      gl_FragDepth = d;
    }`,
  depthTest: true, depthWrite: true, depthFunc: THREE.AlwaysDepth,
});
const paintScene = new THREE.Scene(), brushScene = new THREE.Scene(), paintCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quadScene = new THREE.Scene(), quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), brightMat); quad.frustumCulled = false; quadScene.add(quad);
{ const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), paintMat); q.frustumCulled = false; paintScene.add(q);
  const b = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), brushMat); b.frustumCulled = false; brushScene.add(b); }
// renderStage(stage): the painted world + crisp characters into glCanvas. stage.paint === false renders plainly.
export function renderStage(stage) {
  const { scene, camera } = stage, md = stage.mood || {};
  if (stage.paint === false || md.paint === false) { camera.layers.enableAll(); renderer.render(scene, camera); camera.layers.set(0); return; }
  const P = { ...PAINT_DEFAULT, ...(md.paint || {}) };
  camera.layers.set(0);
  renderer.shadowMap.autoUpdate = true;
  renderer.setRenderTarget(worldRT); renderer.clear(); renderer.render(scene, camera);
  // the oil-paint brush is optional (paint: { radius: 3 }); off by default: a clean 3D render with ink lines
  if (P.radius > 0) { brushMat.uniforms.radius.value = P.radius; renderer.setRenderTarget(brushRT); renderer.render(brushScene, paintCam); }
  if (P.bloom > 0) {
    quad.material = brightMat; brightMat.uniforms.thr.value = P.bloomThreshold; renderer.setRenderTarget(bloomA); renderer.render(quadScene, paintCam);
    quad.material = blurMat;
    for (const [src, dst, dx, dy] of [[bloomA, bloomB, 1, 0], [bloomB, bloomA, 0, 1], [bloomA, bloomB, 2.5, 0], [bloomB, bloomA, 0, 2.5]]) {
      blurMat.uniforms.tCol.value = src.texture; blurMat.uniforms.dir.value.set(dx / QW, dy / QH); renderer.setRenderTarget(dst); renderer.render(quadScene, paintCam);
    }
  }
  const pp = [camera.projectionMatrix.elements[0], camera.projectionMatrix.elements[5]];
  if (P.ink > 0) {
    for (const m of [normMat, inkMat]) { m.uniforms.nearFar.value.set(camera.near, camera.far); m.uniforms.pp.value.set(...pp); }
    const iu = inkMat.uniforms; iu.wNear.value = P.inkWidth[0]; iu.wFar.value = P.inkWidth[1];
    iu.creaseOn.value = P.inkCrease ? 1 : 0; if (P.inkCrease) { iu.cosLo.value = Math.cos(P.inkCrease[0] * DEG); iu.cosHi.value = Math.cos(P.inkCrease[1] * DEG); }
    iu.fade.value.set(...P.inkFade); iu.depthLo.value = P.inkJump[0]; iu.depthHi.value = P.inkJump[1];
    iu.idOn.value = P.inkId > 0 ? 1 : 0; iu.idScale.value = P.inkId || 0.6;
    if (P.inkId > 0) renderIds(scene, camera);
    quad.material = normMat; renderer.setRenderTarget(normRT); renderer.render(quadScene, paintCam);
    quad.material = inkMat; renderer.setRenderTarget(inkRT); renderer.render(quadScene, paintCam);
  }
  renderer.setRenderTarget(null);
  const u = paintMat.uniforms;
  { const D = stage._dof; u.dof.value.set(D ? D.cInf : 0, D ? D.focus : 10, D?.max ?? 24); }
  u.ink.value = P.ink; u.inkCol.value.set(P.inkColor); u.vig.value.set(...P.vignette); u.tintS.value.set(...P.tintShadow); u.tintH.value.set(...P.tintHigh);
  u.sat.value = P.sat; u.bright.value = P.bright; u.contrast.value = P.contrast; u.grain.value = P.grain; u.detail.value = P.radius > 0 ? P.detail : 1;
  u.bloom.value = P.bloom; u.ao.value = P.ao; u.aoR.value = P.aoRadius; u.focal.value = 0.5 * H * camera.projectionMatrix.elements[5];
  u.haze.value.set(...P.haze); u.hazeCol.value.set(P.hazeColor ?? (scene.fog ? scene.fog.color.getHex() : 0xbfd8ee));
  u.nearFar.value.set(camera.near, camera.far);
  renderer.clear(); renderer.render(paintScene, paintCam);
  if (stage.sunDir) CHAR_UNI.lightDir.value.copy(stage.sunDir);
  CHAR_UNI.tint.value.setRGB(...(md.charTint || [1, 1, 1]));
  const ac = renderer.autoClear; renderer.autoClear = false; renderer.shadowMap.autoUpdate = false;
  camera.layers.set(CHAR_LAYER); renderer.render(scene, camera);
  camera.layers.set(GLASS_LAYER); renderer.render(scene, camera);
  camera.layers.set(0); renderer.autoClear = ac; renderer.shadowMap.autoUpdate = true;
}

// ------------------------------------------------------------------ motion tables
// Precompute 1-D motion (position along the road) at a fine step so any frame can be rendered on its own.
// table(dur, step) -> { arr: Float32Array, at(t) }  fill arr yourself, index i is time i*dt.
export function table(dur, dt = 1 / 600) {
  const n = Math.ceil((dur + 0.5) / dt) + 2, arr = new Float32Array(n);
  return { arr, dt, n, at: (t) => { const f = clamp(t, 0, dur + 0.45) / dt, i = Math.floor(f); return lerp(arr[i], arr[i + 1], f - i); } };
}

// ------------------------------------------------------------------ camera track
// keys: [[t, px, py, pz, lookX, lookY, lookZ, rollDeg, fov], ...] -> (t) => [px..fov], cubic Hermite.
export function track(keys) {
  const n = keys.length, dim = keys[0].length - 1;
  return (t) => {
    if (t <= keys[0][0]) return keys[0].slice(1); if (t >= keys[n - 1][0]) return keys[n - 1].slice(1);
    let i = 0; while (keys[i + 1][0] < t) i++;
    const t0 = keys[i][0], t1 = keys[i + 1][0], h = t1 - t0, u = (t - t0) / h, o = [];
    for (let d = 1; d <= dim; d++) {
      const p0 = keys[i][d], p1 = keys[i + 1][d];
      const m0 = i > 0 ? (p1 - keys[i - 1][d]) / (t1 - keys[i - 1][0]) : (p1 - p0) / h;
      const m1 = i < n - 2 ? (keys[i + 2][d] - p0) / (keys[i + 2][0] - t0) : (p1 - p0) / h;
      const u2 = u * u, u3 = u2 * u;
      o.push((2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * h * m1);
    }
    return o;
  };
}
// Place a camera from one track sample. base = world point the keys are relative to.
export function aim(camera, k, base) {
  camera.position.set(base.x + k[0], base.y + k[1], base.z + k[2]);
  camera.fov = k[7]; camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0); camera.lookAt(base.x + k[3], base.y + k[4], base.z + k[5]); camera.rotateZ(k[6] * DEG);
  camera.updateMatrixWorld(true);
}

// ------------------------------------------------------------------ run
// cfg = {
//   shots: [{ start, end, stage: {scene, camera}, update(t, lt), grade?, in?: {type: 'dissolve', frames: 5..12, slow?: true (up to 18)},
//             marks?: { name: { get: () => Vector3, R?: metres, size?: metres (things without R, default 2.5), when?: [t0, t1], y?: [a, b], w?: [a, b], caption?: false, hero?: true } },
//             type?: 'interior'|'pov'|'tracking'|'house'|'twoshot'|'talker'|'device'|'wide' (hero head-width range for check),
//             locked?: true (a deliberate locked-off camera: no camera-motion check) }],
//   captions: [[t, 'text'], ...], samples?: (t) => n, overlay?: (ctx, t) => {} }
// A dissolve is centred on the cut: it runs frames/2 before and after shot.start. update() of the outgoing
// shot is called past its end, so keep update a pure function of t. Motion-blur sub-frames are clamped into the
// shot's own range (widened by half a dissolve), so the frames next to a hard cut never mix the two shots.
export function run(cfg) {
  const out = document.getElementById('out'), ctx = out.getContext('2d');
  const comp = canvas(W, H), cctx = comp.getContext('2d');
  const shots = [...cfg.shots].sort((a, b) => a.start - b.start);
  const GRADE = 'saturate(1.04) contrast(1.02)';

  function layers(t) {
    let i = shots.findIndex((s) => t >= s.start && t < s.end);
    if (i < 0) i = t < shots[0].start ? 0 : shots.length - 1;
    const L = [[shots[i], 1]];
    const nx = shots[i + 1], cur = shots[i];
    if (nx && nx.in && nx.in.type === 'dissolve') { const d = nx.in.frames / FPS; if (t >= nx.start - d / 2) L.push([nx, ease(nx.start - d / 2, nx.start + d / 2, t)]); }
    if (i > 0 && cur.in && cur.in.type === 'dissolve') { const d = cur.in.frames / FPS; if (t < cur.start + d / 2) { L[0][1] = ease(cur.start - d / 2, cur.start + d / 2, t); L.unshift([shots[i - 1], 1]); } }
    return L;
  }
  // depth of field per shot: dof: { cInf: px blur at infinity (0 = off), focus: metres | mark name | (t) => metres, max?: px }
  function dofFor(s, t) {
    const D = typeof s.dof === 'function' ? s.dof(t) : s.dof; if (!D || !D.cInf) return null;
    let f = D.focus; const cam = s.stage.camera;
    if (typeof f === 'function') f = f(t);
    if (typeof f === 'string' || f == null) {
      const m = (s.marks || {})[f] || Object.values(s.marks || {})[0];
      const p = m ? m.get() : null; const fw = cam.getWorldDirection(new THREE.Vector3());
      f = p ? Math.max(0.3, p.clone().sub(cam.position).dot(fw)) : 10;
    }
    return { cInf: D.cInf, focus: f, max: D.max };
  }
  function render(s, t) { s.update(t, t - s.start); s.stage._dof = dofFor(s, t); renderStage(s.stage); }
  // in-world burst transitions: {type: 'burst', frames, fx}, centred on shot.start (frame fully covered there)
  function burst(t) {
    for (const s of shots) if (s.in && s.in.type === 'burst') { const d = s.in.frames / FPS, a = s.start - d / 2; if (t >= a && t < a + d) { s.in.fx.render((t - a) / d); return; } }
  }

  // The time range a shot may be drawn at: [start, end) for a hard cut, widened by half the dissolve on a side that
  // dissolves. Motion-blur sub-frames are clamped into it, so a frame next to a cut never blends in the other shot.
  const halfDiss = (s) => (s && s.in && s.in.type === 'dissolve' ? s.in.frames / FPS / 2 : 0);
  const spanOf = new Map(shots.map((s, i) => [s, [i === 0 ? -Infinity : s.start - halfDiss(s),
    i === shots.length - 1 ? Infinity : (halfDiss(shots[i + 1]) ? s.end + halfDiss(shots[i + 1]) : s.end - 1e-4)]]));
  const inSpan = (s, t) => { const [lo, hi] = spanOf.get(s); return Math.min(hi, Math.max(lo, t)); };

  window.draw = (t, samples = 1, shutter = 0.5) => {
    ctx.globalAlpha = 1; ctx.filter = 'none';
    const L = layers(t);   // the shots this frame shows and their dissolve weights, fixed for all its sub-frames
    for (let k = 0; k < samples; k++) {
      const ts = Math.max(0, t + (samples > 1 ? (k / samples - 0.5) * shutter / FPS : 0));
      if (L.length === 1) {
        render(L[0][0], inSpan(L[0][0], ts)); burst(ts);
        ctx.globalAlpha = 1 / (k + 1); ctx.filter = L[0][0].grade || GRADE; ctx.drawImage(glCanvas, 0, 0);
      } else {
        cctx.globalAlpha = 1; cctx.filter = 'none';
        for (const [s, a] of L) { render(s, inSpan(s, ts)); if (s === L[L.length - 1][0]) burst(ts); cctx.globalAlpha = a; cctx.filter = s.grade || GRADE; cctx.drawImage(glCanvas, 0, 0); }
        ctx.globalAlpha = 1 / (k + 1); ctx.filter = 'none'; ctx.drawImage(comp, 0, 0);
      }
    }
    ctx.globalAlpha = 1; ctx.filter = 'none';
    if (cfg.overlay) cfg.overlay(ctx, t);
    drawCaption(ctx, cfg.captions || [], t);
    return true;
  };
  window.grab = (q = 0.92) => out.toDataURL('image/jpeg', q);
  window.__shots = shots;   // for debugging tools (film.mjs eval)
  // Sound cue list for engine/audio/mix.py (node film.mjs cues <project> writes <project>/audio/cues.json).
  //   cfg.sound: [[t, 'name', { gain?: dB, pan?: -1..1, args?: {generator options}, why?: 'note' }], ...]
  //   cfg.music: { acts?: [[t0, t1, 'day'|'night'|'rain']], stops?: [t of each "But" turn], tag?: t, bpm?, gain?, on?: false }
  //   per shot:  bed: 'day'|'road'|'night'|'rain'|'rain_car'|'car'|'room'|'tv'|'none' (default from the stage mood)
  // Dissolves get a soft whoosh, bursts their own sound (in: { sound: 'cash_burst' | 'paper_burst' | ... }).
  window.__cues = () => {
    const end = cfg.end ?? shots[shots.length - 1].end, MOOD_BED = { day: 'day', dusk: 'road', night: 'night', rain: 'rain' };
    const MOOD_ACT = { day: 'day', dusk: 'night', night: 'night', rain: 'rain' };
    const events = (cfg.sound || []).map(([t, name, o]) => ({ t, name, ...(o || {}) }));
    for (const s of shots) if (s.in) {
      const t = s.start - (s.in.frames || 0) / FPS / 2;
      if (s.in.type === 'dissolve' && s.in.sound !== false) events.push({ t, name: s.in.sound || 'whoosh_soft', auto: true });
      if (s.in.type === 'burst') events.push({ t, name: s.in.sound || 'cash_burst', auto: true });
    }
    const beds = [];
    for (const s of shots) {
      const kind = s.bed || MOOD_BED[s.stage.moodName] || 'day', last = beds[beds.length - 1];
      if (last && last.kind === kind && Math.abs(last.t1 - s.start) < 0.05) last.t1 = s.end; else beds.push({ t0: s.start, t1: s.end, kind });
    }
    const M = cfg.music || {};
    let acts = M.acts?.map(([t0, t1, mood]) => ({ t0, t1, mood }));
    if (!acts) { acts = []; for (const s of shots) { const mood = MOOD_ACT[s.stage.moodName] || 'day', l = acts[acts.length - 1]; if (l && l.mood === mood) l.t1 = s.end; else acts.push({ t0: s.start, t1: s.end, mood }); } }
    const shotList = shots.map((s) => ({ t0: s.start, t1: s.end, in: s.in ? s.in.type : null, frames: s.in?.frames || 0 }));
    return { dur: end, events, beds, music: { ...M, acts }, shots: shotList };
  };
  window.samplesAt = cfg.samples || (() => 1);

  // Numeric checks: project each shot's marks into the frame. No pixels are read.
  window.check = (a, b, step = 0.25) => {
    const rows = [], v = new THREE.Vector3(), e = new THREE.Vector3(), r = new THREE.Vector3();
    for (let t = a; t <= b + 1e-6; t += step) {
      const L = layers(t), s = L[L.length - 1][0];
      s.update(t, t - s.start);
      const cam = s.stage.camera; cam.updateMatrixWorld(true);
      if (![cam.position.x, cam.position.y, cam.position.z].every(Number.isFinite)) { rows.push({ t, mark: 'camera', level: 'fail', rule: 'camera-nan', msg: 'camera position is NaN' }); continue; }
      s.stage.scene.updateMatrixWorld(true); curCam = cam; frameChecks(s, L, t, rows);
      for (const [name, m] of Object.entries(s.marks || {})) {
        if (m.when && (t < m.when[0] || t > m.when[1])) continue;
        const p = m.get(); v.copy(p).project(cam);
        const x = (v.x + 1) / 2, y = (1 - v.y) / 2, behind = v.z > 1 || cam.worldToLocal(e.copy(p)).z > 0;
        let level = 'ok', rule, msg = `x=${(100 * x).toFixed(0)}% y=${(100 * y).toFixed(0)}%`;
        const bad = (lv, why, rl) => { if (lv === 'fail' && level !== 'fail') rule = rl; if (level !== 'fail') level = lv; msg += '  ' + why; };
        if (behind || x < 0 || x > 1 || y < 0 || y > 1) bad('fail', behind ? 'BEHIND CAMERA' : 'OFF FRAME', 'off-frame');
        else {
          if (m.caption !== false && y > 0.66 && y < 0.76) bad('warn', 'in caption band (66-76%)');
          if (x < 0.06 || x > 0.94) bad('warn', 'at the side edge');
          if (m.y && (y < m.y[0] || y > m.y[1])) bad('warn', `y outside ${m.y.map((q) => q * 100 + '%').join('-')}`);
          if (m.R) {
            r.setFromMatrixColumn(cam.matrixWorld, 0).multiplyScalar(m.R).add(p).project(cam);
            const w = Math.abs(r.x - v.x); msg += ` head width=${(100 * w).toFixed(0)}%`;
            if (m.w && (w < m.w[0] || w > m.w[1])) bad('warn', `width outside ${m.w.map((q) => q * 100 + '%').join('-')}`);
          }
          const d = cam.position.distanceTo(p); if (d < cam.near * 1.5) bad('fail', `CLIPPED by near plane (${d.toFixed(2)} m)`, 'near-clip');
          let blk = blocker(s.stage.scene, cam.position, p, d - (m.R ? m.R * 1.3 : (m.size ?? 2.5)));   // size: the marked thing's own extent (a car's body is not its blocker)
          if (!blk && m.R) {   // a face also needs its mouth: test a point 0.45 R below the centre (only the hair showing = hidden)
            const pm = p.clone().addScaledVector(new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1), -0.45 * m.R);
            blk = blocker(s.stage.scene, cam.position, pm, cam.position.distanceTo(pm) - m.R * 1.3);
            if (blk) blk.label += ' (lower half of the face)';
          }
          if (blk) bad(blk.near ? 'fail' : 'warn', `HIDDEN behind ${blk.label} (${blk.dist.toFixed(2)} m from the lens)`, 'hidden');
          if (m.R) {   // another character's head in front of this face
            const f2 = cam.projectionMatrix.elements[5] * H / 2, rr = m.R * f2 / d, q = new THREE.Vector3();
            for (const hd of heads(s.stage.scene)) {
              hd.headMesh.getWorldPosition(q); if (q.distanceTo(p) < m.R * 0.8) continue;   // its own head
              const dq = cam.position.distanceTo(q); if (dq >= d || dq < Math.max(cam.near, hd.R)) continue;   // behind, or the lens is inside it (a POV)
              const hq = q.clone().project(cam), dx = (hq.x - v.x) * W / 2, dy = (hq.y - v.y) * H / 2, r2 = hd.R * f2 / dq;
              const cover = Math.max(0, Math.min(1, (r2 + rr - Math.hypot(dx, dy)) / (2 * rr)));
              if (cover > 0.5) { bad(cover > 0.8 ? 'fail' : 'warn', `${Math.round(cover * 100)}% behind another character's head`, 'head-cover'); break; }
            }
          }
        }
        rows.push({ t, mark: name, level, msg, rule });
      }
    }
    for (const s of shots) if (s.end > a && s.start <= b) shotChecks(s, a, b, rows);
    return rows.sort((p, q) => p.t - q.t);
  };
  // ---- frame checks used by window.check (all geometric, no pixels read)
  const ray = new THREE.Raycaster(); let curCam = null;
  const matOf = (h) => (Array.isArray(h.object.material) ? h.object.material[h.face?.materialIndex ?? 0] : h.object.material);
  const usable = (h) => {
    const o = h.object, mt = matOf(h);
    if (!o.isMesh || o.isSprite || !mt || mt.colorWrite === false || mt.visible === false) return false;
    if ((mt.transparent && (mt.opacity ?? 1) < 0.85) || mt.alphaTest > 0) return false;
    for (let q = o; q; q = q.parent) if (!q.visible || q.userData.noHit) return false;
    return true;
  };
  const label = (o) => {
    for (let q = o, k = 0; q && k < 4; q = q.parent, k++) if (q.name) return `"${q.name}"`;
    const mt = Array.isArray(o.material) ? o.material[0] : o.material, c = mt && mt.color ? '#' + mt.color.getHexString() : '';
    const bb = o.geometry ? (o.geometry.computeBoundingBox(), o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)) : null, ctr = bb ? bb.getCenter(new THREE.Vector3()) : null;
    return `${o.geometry?.type?.replace('Geometry', '') || 'mesh'} ${c}`.trim() + (ctr ? ` at (${ctr.x.toFixed(1)}, ${ctr.y.toFixed(1)}, ${ctr.z.toFixed(1)})` : '');
  };
  function firstHit(scene, from, dir, far, cam = curCam) {
    ray.camera = cam; ray.set(from, dir); ray.near = 0; ray.far = far; ray.layers.set(0);
    for (const h of ray.intersectObject(scene, true)) if (usable(h)) return h;
    return null;
  }
  function rayHits(scene, from, dir, far, cam = curCam) {   // every usable hit along a ray, nearest first
    ray.camera = cam; ray.set(from, dir); ray.near = 0; ray.far = far; ray.layers.set(0);
    return ray.intersectObject(scene, true).filter(usable);
  }
  // first opaque world object between the lens and point p (closer than `upTo` metres)
  function blocker(scene, from, p, upTo) {
    if (upTo <= 0.05) return null;
    const dir = p.clone().sub(from).normalize(), h = firstHit(scene, from, dir, upTo);
    return h ? { label: label(h.object), dist: h.distance, near: h.distance < 2.5 } : null;
  }
  const shown = (o) => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
  const heads = (scene) => { const a = []; scene.traverse((o) => { if (o.headMesh && o.R && shown(o.headMesh)) a.push(o); }); return a; };
  const texts = (scene) => scene.userData._texts || (scene.userData._texts = (() => { const a = []; scene.traverse((o) => { if (o.userData.text) a.push(o); }); return a; })());
  function frameChecks(s, L, t, rows) {
    const cam = s.stage.camera, scene = s.stage.scene, f = cam.projectionMatrix.elements[5] * H / 2; curCam = cam;
    // 1. one surface right in front of the lens covering the frame (a panel, a wall, the inside of a car body)
    if (L.length === 1) {
      const cnt = new Map(), NX = 6, NY = 10, dir = new THREE.Vector3();
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        dir.set(((i + 0.5) / NX) * 2 - 1, 1 - ((j + 0.5) / NY) * 2, 0.5).unproject(cam).sub(cam.position).normalize();
        const h = firstHit(scene, cam.position, dir, 2.0); if (!h) continue;
        const k = h.object; cnt.set(k, (cnt.get(k) || 0) + 1);
      }
      for (const [o, n] of cnt) { const fr = n / (NX * NY); if (fr >= 0.4) rows.push({ t, mark: 'frame', level: fr >= 0.55 ? 'fail' : 'warn', rule: 'covered-frame', msg: `${label(o)} covers ${(fr * 100).toFixed(0)}% of the frame within 2 m of the lens` }); }
    }
    // 1b. clipped art: a character whose head canvas (hair, hat, bun) is cut at its edge looks sliced flat
    for (const hd of heads(scene)) if (hd.clipped) rows.push({ t, mark: 'character', level: 'fail', rule: 'clipped-art', msg: `head art cut flat at its canvas edge (style ${hd.opts?.style}, acc ${(hd.opts?.acc || []).join(' ') || '-'}): the hair or hat is taller than the room above the head` });
    // 2. signs and boards: readable ones must sit fully inside the frame and not behind a head or an object
    const hs = heads(scene), c = new THREE.Vector3(), q = new THREE.Vector3(), nrm = new THREE.Vector3();
    for (const g of texts(scene)) {
      let vis = true; for (let o = g; o; o = o.parent) if (!o.visible) vis = false; if (!vis) continue;
      const tx = g.userData.text, face = tx.face || g; face.updateMatrixWorld(true);
      face.getWorldPosition(c); nrm.set(0, 0, 1).transformDirection(face.matrixWorld);
      if (nrm.dot(q.copy(cam.position).sub(c)) <= 0) continue;                       // seen from the back
      const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => new THREE.Vector3(a * tx.w / 2, b * tx.h / 2, 0).applyMatrix4(face.matrixWorld).project(cam));
      if (cs.some((p) => p.z > 1)) continue;
      const xs = cs.map((p) => (p.x + 1) / 2), ys = cs.map((p) => (1 - p.y) / 2);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      if (x1 < 0 || x0 > 1 || y1 < 0 || y0 > 1 || x1 - x0 < (tx.key ? 0.06 : 0.1)) continue;   // not in the shot, or too small to read
      // key text = the number or words the joke depends on (a price, a WINNER screen, a name): any cut or cover FAILs
      const key = typeof tx.key === 'function' ? !!tx.key(t) : !!tx.key, lvl = key ? 'fail' : 'warn', rule = key ? 'text-cut' : undefined;
      const name = `${key ? 'text' : 'sign'} "${tx.label}"`;
      // a label stuck on something (tx.on): every corner must sit on that surface, not hang in the air past its edge
      if (tx.on) {
        const owns = (o) => { for (let q2 = o; q2; q2 = q2.parent) if (q2 === tx.on) return true; return false; };
        const off = [[-1, -1], [1, -1], [1, 1], [-1, 1]].filter(([a, b]) => {
          const pw = new THREE.Vector3(a * tx.w / 2 * 0.95, b * tx.h / 2 * 0.95, 0).applyMatrix4(face.matrixWorld);
          const dist = cam.position.distanceTo(pw), dir = pw.clone().sub(cam.position).normalize();
          return !rayHits(scene, cam.position, dir, dist + 0.08).some((h) => owns(h.object) && Math.abs(h.distance - dist) < 0.04);   // the surface must be at the corner (within 4 cm along the ray)
        });
        if (off.length) rows.push({ t, mark: name, level: 'fail', rule: 'decal-overhang', msg: `${off.length} corner(s) of the label hang off the surface it is stuck on: make it smaller, curve it to the surface, or move it` });
      }
      if (x0 < 0 || x1 > 1 || y0 < 0 || y1 > 1) rows.push({ t, mark: name, level: lvl, rule, msg: `cut by the frame edge (x ${(x0 * 100).toFixed(0)}-${(x1 * 100).toFixed(0)}%, y ${(y0 * 100).toFixed(0)}-${(y1 * 100).toFixed(0)}%)` });
      const dS = cam.position.distanceTo(c);
      for (const hd of hs) {
        hd.headMesh.getWorldPosition(q); const dH = cam.position.distanceTo(q); if (dH >= dS) continue;
        const hp = q.clone().project(cam), hx = (hp.x + 1) / 2, hy = (1 - hp.y) / 2, r = hd.R * f / dH / W * 1.0, ry = hd.R * f / dH / H;
        const ox = Math.min(x1, hx + r) - Math.max(x0, hx - r), oy = Math.min(y1, hy + ry) - Math.max(y0, hy - ry);
        if (ox > 0 && oy > 0 && (ox * oy) / ((x1 - x0) * (y1 - y0)) > 0.12) rows.push({ t, mark: name, level: lvl, rule, msg: `${Math.round(100 * (ox * oy) / ((x1 - x0) * (y1 - y0)))}% of it is behind a character's head` });
      }
      const blk = blocker(scene, cam.position, c, dS - 0.06);
      if (blk) { let own = false; const hit = firstHit(scene, cam.position, c.clone().sub(cam.position).normalize(), dS - 0.06); for (let o = hit?.object; o; o = o.parent) if (o === g) own = true; if (!own) rows.push({ t, mark: name, level: lvl, rule, msg: `hidden behind ${blk.label}` }); }
    }
    // 3. camera speed: the subject's motion on screen between this frame and the next (px at 1080 wide)
    const nearCut = shots.some((sh) => t > sh.start - 3 / FPS && t < sh.start + 3 / FPS);
    if (L.length === 1 && !nearCut && t + 1 / FPS < s.end) {
      // the subject = an active mark (else any mark of the shot); without marks, the camera's own turn rate
      const ms = Object.values(s.marks || {}), mk = ms.find((m) => !m.when || (t >= m.when[0] && t <= m.when[1])) || ms[0];
      const a = mk ? mk.get().clone().project(cam) : null, d0 = cam.getWorldDirection(new THREE.Vector3());
      s.update(t + 1 / FPS, t + 1 / FPS - s.start); cam.updateMatrixWorld(true);
      const b = mk ? mk.get().clone().project(cam) : null, d1 = cam.getWorldDirection(new THREE.Vector3());
      s.update(t, t - s.start); cam.updateMatrixWorld(true);
      const pxf = a && a.z < 1 && b.z < 1 ? Math.hypot((b.x - a.x) * W / 2, (b.y - a.y) * H / 2) : d0.angleTo(d1) * f;
      if (pxf > 45) rows.push({ t, mark: 'camera', level: 'warn', msg: `subject moves ${pxf.toFixed(0)} px/frame: a snap. Glide over 18+ frames (peak about 22 px/frame) or make it a cut` });
    }
  }
  // ---- per-shot checks used by window.check, sampled every 0.1 s whatever the probe step:
  // camera motion, the hero's face size for the shot type, the dissolve length.
  const TYPE_W = { talker: [0.35, 0.65], device: [0.5, 0.8], twoshot: [0.15, 0.35], interior: [0.2, 0.4], house: [0.08, 0.15],
    wide: [0.06, 0.12], tracking: null, pov: null };
  const MOVE_FAIL = 2.5, MOVE_WARN = 3, MOVE_WIN = 1.0, SHOT_DT = 0.1;
  const heroOf = (s) => { const e = Object.entries(s.marks || {}); return e.find(([, m]) => m.hero) || e.find(([, m]) => m.R && m.caption !== false) || null; };
  const activeAt = (m, t) => !m.when || (t >= m.when[0] && t <= m.when[1]);
  function headWidth(cam, m) {   // head mark width as a share of the frame width (0 behind the camera)
    const p = m.get(); if (cam.worldToLocal(p.clone()).z > 0) return 0;
    const v = p.clone().project(cam), r = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0).multiplyScalar(m.R).add(p).project(cam);
    return Math.abs(r.x - v.x);
  }
  // distance (along the view) of what the camera is about: the hero mark, else any active mark, else what the centre ray hits
  function subjectDepth(s, cam, t, hero) {
    const fw = cam.getWorldDirection(new THREE.Vector3());
    for (const m of [hero && hero[1], ...Object.values(s.marks || {})]) {
      if (!m || !activeAt(m, t)) continue;
      const d = m.get().clone().sub(cam.position).dot(fw); if (d > 0.2) return d;
    }
    curCam = cam; const h = firstHit(s.stage.scene, cam.position, fw, 300);
    return h ? Math.max(0.3, h.distance) : 10;
  }
  // How much the picture changes because of the camera between two camera states A and B: a 5x5 grid of static world
  // points at the subject's depth, spread over the whole frame as seen from A, is re-projected through B. The result is
  // the mean on-screen shift of those points in frame widths (a pan of 5 % of the width = 0.05; a push-in that zooms the
  // picture Z reads about 0.53 Z, so a 5 %/s push = 2.7 %/s). With parts, also the fitted zoom / roll / shift.
  const GRID = []; for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) GRID.push([-0.8 + 0.4 * i, -0.8 + 0.4 * j]);
  function apparent(A, B, parts) {
    const c = new THREE.Vector3(), q = [], dd = [], k = H / W;
    let mean = 0;
    for (const [nx, ny] of GRID) {
      c.set(nx * A.tx * A.D, ny * A.ty * A.D, -A.D).applyMatrix4(A.mw).applyMatrix4(B.mwi);
      if (c.z > -0.02) return parts ? { mean: Infinity, D: A.D } : Infinity;   // the subject plane passed the lens: a big move
      c.applyMatrix4(B.pm);
      const qx = nx / 2, qy = ny / 2 * k, d = [c.x / 2 - qx, c.y / 2 * k - qy];
      q.push([qx, qy]); dd.push(d); mean += Math.hypot(d[0], d[1]) / GRID.length;
    }
    if (!parts) return mean;
    let tx = 0, ty = 0; for (const d of dd) { tx += d[0] / dd.length; ty += d[1] / dd.length; }
    let sa = 0, sb = 0, sq = 0;
    q.forEach(([x, y], n) => { const ex = dd[n][0] - tx, ey = dd[n][1] - ty; sa += x * ex + y * ey; sb += x * ey - y * ex; sq += x * x + y * y; });
    return { mean, zoom: sa / sq, roll: sb / sq, shift: Math.hypot(tx, ty), D: A.D };
  }
  function camState(s, t, hero) {   // after s.update(t): the camera and the subject depth at t
    const cam = s.stage.camera, pm = cam.projectionMatrix;
    return { t, mw: cam.matrixWorld.clone(), mwi: cam.matrixWorldInverse.clone(), pm: pm.clone(), tx: 1 / pm.elements[0], ty: 1 / pm.elements[5], D: subjectDepth(s, cam, t, hero) };
  }
  // debugging (film.mjs eval): the camera motion of shot i between t and t + dt, split into zoom / roll / shift per second
  window.__camMotion = (i, t, dt = 1) => {
    const s = shots[i], hero = heroOf(s), at = (u) => { s.update(u, u - s.start); s.stage.camera.updateMatrixWorld(true); s.stage.scene.updateMatrixWorld(true); return camState(s, u, hero); };
    const A = at(t), B = at(t + dt), p = apparent(A, B, true);
    return { pctPerS: 100 * p.mean / dt, zoomPct: 100 * p.zoom / dt, rollDegPerS: p.roll / dt / DEG, shiftPct: 100 * p.shift / dt, depth: p.D };
  };
  function shotChecks(s, a, b, rows) {
    const t0 = Math.max(a, s.start), t1 = Math.min(b, s.end), cam = s.stage.camera, tag = `shot ${s.start.toFixed(2)}-${s.end.toFixed(2)}`;
    // dissolve length (bursts and wipes are not dissolves)
    if (s.in && s.in.type === 'dissolve' && s.start >= a - 1e-6 && s.start <= b + 1e-6) {
      const fr = s.in.frames, hi = s.in.slow ? 18 : 12;
      if (!(fr >= 5 && fr <= hi)) rows.push({ t: s.start, mark: 'dissolve', level: 'fail', rule: 'dissolve-length', msg: `${tag}: ${fr}-frame dissolve; keep it 5-12 frames (in.slow: true allows up to 18, for the reveal or the final calm act)` });
    }
    if (s.type && !(s.type in TYPE_W)) rows.push({ t: s.start, mark: 'shot', level: 'warn', msg: `${tag}: unknown type '${s.type}' (${Object.keys(TYPE_W).join(' ')})` });
    const hero = heroOf(s), range = hero ? (hero[1].w || TYPE_W[s.type] || null) : null;
    const states = [], widths = [], n = Math.floor((t1 - 1 / FPS - t0) / SHOT_DT + 1e-6);
    let nOut = 0;
    for (let i = 0; i <= n; i++) {
      const t = t0 + i * SHOT_DT;
      s.update(t, t - s.start); cam.updateMatrixWorld(true); s.stage.scene.updateMatrixWorld(true);
      if (![cam.position.x, cam.position.y, cam.position.z].every(Number.isFinite)) continue;
      states.push(camState(s, t, hero));
      if (range && activeAt(hero[1], t)) { const w = headWidth(cam, hero[1]); widths.push(w); if (w < range[0] || w > range[1]) nOut++; }
    }
    // camera motion over every 1 s window; "sustained" = two or more windows in a row (more than 1 s)
    const kw = Math.round(MOVE_WIN / SHOT_DT), ms = [];
    for (let i = 0; i + kw < states.length; i++) ms.push([states[i].t, 100 * apparent(states[i], states[i + kw]) / (states[i + kw].t - states[i].t)]);
    let info = `${tag}${s.type ? ' ' + s.type : ''}${s.locked ? ' locked' : ''}`;
    if (ms.length) {
      const sorted = ms.map((m) => m[1]).sort((p, q) => p - q), med = sorted[sorted.length >> 1];
      const longest = (lim) => { let best = null, run = null; for (const [t, m] of ms) { if (m < lim) { run = run || [t, t]; run[1] = t; if (!best || run[1] - run[0] > best[1] - best[0]) best = [...run]; } else run = null; } return best; };
      info += `: camera ${sorted[0].toFixed(1)}-${Math.min(999, sorted[sorted.length - 1]).toFixed(1)} %/s (median ${Math.min(999, med).toFixed(1)})`;
      if (!s.locked) {
        const f = longest(MOVE_FAIL), w = longest(MOVE_WARN), dur = (r) => r[1] - r[0] + MOVE_WIN;
        const say = (r, lim) => `${tag}: the camera moves the picture under ${lim} % of the frame a second for ${dur(r).toFixed(1)} s from t=${r[0].toFixed(2)} (shot median ${med.toFixed(1)} %/s). The reference never holds still: push in harder (a zoom of 8 %/s, about 0.27 % a frame, reads 4.2 %/s here), pan or orbit, or set locked: true for a deliberate device view`;
        if (f && f[1] - f[0] > 1e-6) rows.push({ t: f[0], mark: 'camera', level: 'fail', rule: 'slow-camera', msg: say(f, MOVE_FAIL) });
        else if (w && w[1] - w[0] > 1e-6) rows.push({ t: w[0], mark: 'camera', level: 'warn', msg: say(w, MOVE_WARN) });
      }
    }
    if (range && widths.length) {
      const med = [...widths].sort((p, q) => p - q)[widths.length >> 1], pct = (x) => (100 * x).toFixed(0);
      info += `; hero "${hero[0]}" head ${pct(med)}% wide, wants ${range.map(pct).join('-')}%`;
      if (widths.length >= 3 && nOut / widths.length > 0.5) rows.push({ t: s.start, mark: hero[0], level: 'fail', rule: 'face-size',
        msg: `${tag}: hero head ${pct(med)}% of the frame width (median), outside ${range.map(pct).join('-')}% (${hero[1].w ? 'its w' : 'type ' + s.type}) for ${Math.round(100 * nOut / widths.length)}% of the shot` });
    }
    if (ms.length || widths.length) rows.push({ t: s.start, mark: 'shot', level: 'info', msg: info });
  }
  document.fonts.load('800 76px Cap').then(() => { window.ready = true; });
}
