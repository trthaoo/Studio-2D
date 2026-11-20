// Runtime: builds the three.js world from a SceneDoc with the skill's engine, and draws any moment of it.
// Pure function of (doc, t): the studio view, the timeline scrub and the offline render all go through here.
import * as THREE from 'three';
import { renderStage, glCanvas, W, H, V3, DEG, RW, RH } from 'engine/core.js';
import { makeStage, lamp } from 'engine/stage.js';
import { makeChar, stand, sitOn, sit, exprAt, talkAt, WALK_STRIDE } from 'engine/chars.js';
import { buildCar, rollWheels, brakeLights } from 'engine/cars.js';
import * as P from 'engine/props.js';
import { lacquer } from 'engine/materials.js';
import { addRoom } from 'engine/sets/room.js';
import { addHouse } from 'engine/sets/house.js';
import { addHighway } from 'engine/sets/highway.js';
import { drawCaption } from 'engine/captions.js';
import { SceneDoc, SceneObject, Stage, valueAt, activeCut, wordsOf, JOINTS, Joint, Vec3, lookParams, lookValue } from './doc';
import { codeAsset, tryBuild, vfxCodeOf } from './library';
import { stageMood, skySig, applyLive } from './lighting';
import { buildFx, fxStart } from './vfx';

const GRADE = 'saturate(1.04) contrast(1.02)';
export type Part = 'hair' | 'face' | 'clothes' | 'pose';

export interface PosePoints { hip: THREE.Vector3; neck: THREE.Vector3; elbowL: THREE.Vector3; handL: THREE.Vector3; elbowR: THREE.Vector3; handR: THREE.Vector3; kneeL: THREE.Vector3; footL: THREE.Vector3; kneeR: THREE.Vector3; footR: THREE.Vector3 }

interface Built {
  obj: SceneObject;
  sig: string;              // params + stage + parent, to know when to rebuild
  root: THREE.Group;        // wrapper: position / turn / scale
  inner: any;               // the engine object (character, car, prop, set group)
  attach: THREE.Object3D;   // where children go (a car's body)
  light?: THREE.PointLight;
  lastText?: string;
  pose?: PosePoints;        // last pose, in root space (for the pose handles)
}
interface BuiltStage { def: Stage; sig: string; st: any }

export class Runtime {
  doc!: SceneDoc;
  stages = new Map<string, BuiltStage>();
  built = new Map<string, Built>();
  frame = document.createElement('canvas');      // the finished frame: 1080x1920, or smaller at a preview quality (engine RW x RH)
  ctx: CanvasRenderingContext2D;
  hideOnly = new Set<string>();                    // layer export: objects left out of this draw
  freeCam: THREE.PerspectiveCamera | null = null;  // studio free view instead of the cut camera
  freeStage: string | null = null;
  forceCam: string | null = null;                  // studio Camera workspace: look through this camera, whatever the cuts say
  lastStage: BuiltStage | null = null;             // what the last draw showed
  errors: string[] = [];

  constructor() { this.frame.width = W; this.frame.height = H; this.ctx = this.frame.getContext('2d')!; }

  // ---------------------------------------------------------------- building
  sync(doc: SceneDoc) {
    this.doc = doc; this.errors = [];
    // stages
    for (const s of doc.stages) {
      const m = stageMood(s), sig = skySig(m); const b = this.stages.get(s.id);
      if (!b || b.sig !== sig) {
        if (b) for (const o of [...this.built.values()]) if (o.obj.stage === s.id) this.drop(o.obj.id);
        const st = makeStage({ mood: m });
        st.moodName = s.mood;
        this.stages.set(s.id, { def: s, sig, st });
      } else { b.def = s; applyLive(b.st, m); }
    }
    for (const id of [...this.stages.keys()]) if (!doc.stages.find((s) => s.id === id)) this.stages.delete(id);
    // objects
    const ids = new Set(doc.objects.map((o) => o.id));
    for (const id of [...this.built.keys()]) if (!ids.has(id)) this.drop(id);
    for (const o of doc.objects) {
      if (o.kind === 'camera') continue;
      const sig = JSON.stringify([o.kind, o.kind === 'char' ? lookParams(doc, o) : o.params, o.stage, o.parent || null, o.params.type === 'code' ? (o.kind === 'fx' ? vfxCodeOf(o.params.code) ?? null : codeAsset(o.params.code)?.code ?? null) : null]);
      const b = this.built.get(o.id);
      if (b && b.sig === sig) { b.obj = o; continue; }
      if (b) this.drop(o.id);
      try { this.build(o, sig); } catch (e: any) { this.errors.push(`${o.name}: ${e.message}`); console.error(e); }
    }
    // parents (second pass: a parent may be built after its child)
    for (const b of this.built.values()) {
      const st = this.stages.get(b.obj.stage); if (!st) continue;
      const want: THREE.Object3D = (b.obj.parent && this.built.get(b.obj.parent)?.attach) || st.st.scene;
      if (b.root.parent !== want) want.add(b.root);
    }
  }

  private drop(id: string) {
    const b = this.built.get(id); if (!b) return;
    b.root.removeFromParent();
    b.root.traverse((m: any) => { m.geometry?.dispose?.(); });
    this.built.delete(id);
  }

  private build(o: SceneObject, sig: string) {
    const root = new THREE.Group(); root.name = o.name; root.userData.docId = o.id;
    let inner: any, attach: THREE.Object3D = root, light: THREE.PointLight | undefined;
    const p = (o.kind === 'char' ? lookParams(this.doc, o) : o.params) || {};
    if (o.kind === 'char') {
      inner = makeChar({ R: 0.2, shirt: 0x2f6fe0, hair: '#1c1c24', hair2: '#3a3a48', style: 'mess', ...hexify(p) });
      root.add(inner);
    } else if (o.kind === 'car') {
      inner = buildCar({ type: 'sedan', color: 0xffbf0a, interior: 'modern', ...hexify(p) });
      root.add(inner); attach = inner.body || inner;
      if (p.shadow !== false) inner.add(P_blob(inner));
    } else if ((o.kind === 'prop' || o.kind === 'set') && p.type === 'code') {
      const a = codeAsset(p.code);
      if (!a) throw new Error(`không có "${p.code}" trong thư viện code`);
      if (!a.build) throw new Error(`code "${p.code}" lỗi: ${a.error}`);
      inner = tryBuild(a.build, hexify(p.opts || {}));
      if (o.kind === 'set') { lacquer(inner); root.userData.isSet = true; }
      inner.traverse((m: any) => { if (m.isMesh) { m.castShadow = m.castShadow || o.kind === 'prop'; m.receiveShadow = true; } });
      root.add(inner);
    } else if (o.kind === 'prop') {
      const fn = (P as any)[p.type || 'cone'];
      if (typeof fn !== 'function') throw new Error(`unknown prop "${p.type}"`);
      const opts = hexify(p.opts || {});
      if (p.type === 'sign' || p.type === 'deskPlate') inner = fn(p.text ?? 'SIGN', opts);
      else if (p.type === 'counter') inner = fn(p.text ?? 'DAYS SINCE', p.value ?? 0, opts);
      else if (p.type === 'paper') inner = fn(p.lines ?? [p.text ?? ''], opts);
      else if (p.type === 'panel') inner = fn(p.w ?? 0.6, p.h ?? 0.4, opts);
      else inner = fn(opts);
      root.add(inner);
    } else if (o.kind === 'set') {
      const g = new THREE.Group(); root.add(g);
      const opts = hexify(p.opts || {});
      if (p.type === 'room') { inner = addRoom(g, opts); lacquer(g); }
      else if (p.type === 'house') { inner = addHouse(g, opts); lacquer(g); }
      else if (p.type === 'highway') { addHighway(g, opts); inner = { group: g }; }
      else if (p.type === 'floor') {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w ?? 40, p.d ?? 40), new THREE.MeshStandardMaterial({ color: p.color ?? 0xd9d2c0, roughness: 0.9 }));
        m.rotation.x = -Math.PI / 2; m.receiveShadow = true; g.add(m); inner = { group: g };
      } else throw new Error(`unknown set "${p.type}"`);
      root.userData.isSet = true;
    } else if (o.kind === 'fx') {
      inner = buildFx(p); root.add(inner.group);
    } else if (o.kind === 'lamp') {
      const g = new THREE.Group(); root.add(g);
      const L = lamp(g, 0, 0, 0, hexify(p)); light = L.light; inner = g;
    }
    this.built.set(o.id, { obj: o, sig, root, inner, attach, light });
  }

  // ---------------------------------------------------------------- one moment
  /** Object transforms and states at t (everything but the pose, which needs the camera). */
  private applyObjects(stageId: string, t: number) {
    for (const b of this.built.values()) {
      const o = b.obj; if (o.stage !== stageId) continue;
      const pos = valueAt(o, 'pos', t) as Vec3;
      b.root.position.set(pos[0], pos[1], pos[2]);
      if (o.kind !== 'lamp') b.root.rotation.y = (valueAt(o, 'rotY', t) as number) * DEG;
      if (o.kind !== 'set' && o.kind !== 'lamp') b.root.scale.setScalar(valueAt(o, 'scale', t) as number);
      b.root.visible = !o.hidden && valueAt(o, 'visible', t) !== false && !this.hideOnly.has(o.id);
      if (o.kind === 'car' && b.inner.wheels) {
        brakeLights(b.inner, !!valueAt(o, 'brake', t));
        if (b.inner.body) b.inner.body.rotation.z = (valueAt(o, 'dive', t) as number) * DEG;
        rollWheels(b.inner, travelled(o, t));
      } else if (o.kind === 'prop') {
        const text = valueAt(o, 'text', t) as string;
        if (text && text !== b.lastText) {
          b.lastText = text;
          if (b.inner.setText) b.inner.setText(text.split('|'));
          else if (b.inner.set) b.inner.set(text);
          else if (b.inner.draw) b.inner.draw((c: any, w: number, h: number) => P.drawLabel(c, w, h, text.split('|'), { bg: '#1b2a6b', fg: '#fff', border: false }));
        }
        if (b.inner.grow) b.inner.grow(valueAt(o, 'grow', t));
      } else if (o.kind === 'lamp' && b.light) b.light.intensity = valueAt(o, 'intensity', t);
      if (o.kind === 'fx') { b.root.userData.offset = V3(pos[0], pos[1], pos[2]); b.root.userData.ownRotY = (valueAt(o, 'rotY', t) as number) * DEG; }
      if (o.kind === 'fx' && b.root.visible) b.inner.update(t, t - fxStart(o.tracks.visible, t), valueAt(o, 'amount', t) as number, valueAt(o, 'speed', t) as number);
    }
  }

  /** Base pose (from the presets) and the final pose (presets + joint offsets) of a character at t. */
  poseOf(b: Built, t: number): { base: PosePoints; final: PosePoints; face: THREE.Vector3; expr: any; drive: boolean } {
    const o = b.obj, ch = b.inner;
    const arms = [valueAt(o, 'armL', t), valueAt(o, 'armR', t)];
    const lean = valueAt(o, 'lean', t) as number, lk = valueAt(o, 'look', t) as Vec3;
    const face = V3(lk[0], lk[1], lk[2]); if (face.lengthSq() < 1e-6) face.set(1, 0, 0);
    const mode = valueAt(o, 'pose', t) as string;
    const exprKeys = (o.tracks.expr && o.tracks.expr.length ? o.tracks.expr : [{ t: 0, v: 'calm' }]).map((k) => [k.t, String(k.v)]);
    let expr = exprAt(exprKeys, t, { blink: o.params.blink !== false });
    const words = wordsOf(o.tracks.say); if (words.length) expr = talkAt(expr, words, t);
    let p: any; let drive = false;
    const parent = o.parent ? this.built.get(o.parent) : null;
    if (mode === 'drive' && parent?.inner?.I) { p = sit(ch, parent.inner.I, parent.inner.wheelRig, { side: o.params.side ?? -1, face, expr, lean: lean || undefined }); drive = true; }
    else {
      // A change of arm preset or of stand/sit is a short eased move (BLEND s), not a jump: the pose of the old values
      // and of the new are both made and the joints go from one to the other.
      const make = (armsV: any[], modeV: string) => {
        if (modeV === 'sitOn') return sitOn(ch, { seat: valueAt(o, 'seat', t), arms: armsV, lean, face, expr });
        const w = o.parent ? undefined : walkState(o, t, ch.R);
        return stand(ch, { arms: armsV, lean, face, expr, walk: w?.phase, walkAmt: w?.amt, walkDir: w?.dir, stride: o.params.stride, breath: o.params.breath === false ? 0 : Math.sin(t * 1.85 + idPhase(o.id)) });
      };
      p = make(arms, mode);
      const bL = enumBlend(o, 'armL', t), bR = enumBlend(o, 'armR', t), bP = enumBlend(o, 'pose', t);
      if (bL || bR || bP) {
        const q = make([bL ? bL.prev : arms[0], bR ? bR.prev : arms[1]], bP ? String(bP.prev) : mode);
        const wP = bP ? bP.w : 1, mix = (a: THREE.Vector3, b: THREE.Vector3, w: number) => a.clone().lerp(b, w);
        if (bP) { p.hip = mix(q.hip, p.hip, wP); p.neck = mix(q.neck, p.neck, wP); p.legs = p.legs.map((lg: any, i: number) => [mix(q.legs[i][0], lg[0], wP), mix(q.legs[i][1], lg[1], wP)]); }
        p.arms = p.arms.map((a: any, i: number) => { const b = i ? bR : bL, w = Math.min(wP, b ? b.w : 1); return w >= 1 ? a : [mix(q.arms[i][0], a[0], w), mix(q.arms[i][1], a[1], w)]; });
      }
    }
    const base: PosePoints = { hip: p.hip, neck: p.neck, elbowL: p.arms[0][0], handL: p.arms[0][1], elbowR: p.arms[1][0], handR: p.arms[1][1], kneeL: p.legs[0][0], footL: p.legs[0][1], kneeR: p.legs[1][0], footR: p.legs[1][1] };
    const off = (j: Joint) => { const v = valueAt(o, 'j.' + j, t) as Vec3; return V3(v[0], v[1], v[2]); };
    const fin: any = {}; for (const j of JOINTS) fin[j] = base[j].clone();
    // the hip carries the upper body (and half the knees); the neck carries the arms; then each joint its own
    const hipO = off('hip'), neckO = off('neck');
    for (const j of ['hip', 'neck', 'elbowL', 'handL', 'elbowR', 'handR'] as Joint[]) fin[j].add(hipO);
    fin.kneeL.addScaledVector(hipO, 0.5); fin.kneeR.addScaledVector(hipO, 0.5);
    for (const j of ['neck', 'elbowL', 'handL', 'elbowR', 'handR'] as Joint[]) fin[j].add(neckO);
    for (const j of ['elbowL', 'handL', 'elbowR', 'handR', 'kneeL', 'footL', 'kneeR', 'footR'] as Joint[]) fin[j].add(off(j));
    return { base, final: fin, face, expr, drive };
  }

  private poseChars(stageId: string, t: number, cam: THREE.Camera) {
    for (const b of this.built.values()) {
      if (b.obj.kind !== 'char' || b.obj.stage !== stageId || !b.root.visible) continue;
      const { final: f, face, expr } = this.poseOf(b, t);
      b.pose = f;
      const o = b.obj, v = (k: string) => lookValue(this.doc, o, k, t) as number;   // own part fixes, else the shared look's
      const adj = { hairX: v('hair.x'), hairY: v('hair.y'), hairSize: v('hair.size'), hairVol: v('hair.vol'), hairFringe: v('hair.fringe'), hairSide: v('hair.side'), hairPart: v('hair.part'),
        faceX: v('face.x'), faceY: v('face.y'), eyeSize: v('eye.size'), eyeGap: v('eye.gap'), eyeY: v('eye.y'), browY: v('brow.y'), mouthY: v('mouth.y'), mouthSize: v('mouth.size'),
        accX: v('acc.x'), accY: v('acc.y'), accSize: v('acc.size') };
      b.inner.pose({ hip: f.hip, neck: f.neck, face, expr, adj, arms: [[f.elbowL, f.handL], [f.elbowR, f.handR]], legs: [[f.kneeL, f.footL], [f.kneeR, f.footR]] }, cam);
    }
  }

  /** Put a stage's camera where a doc camera is at t. */
  aimCamera(st: any, camObj: SceneObject, t: number) {
    const cam: THREE.PerspectiveCamera = st.camera;
    const p = valueAt(camObj, 'pos', t) as Vec3, tg = valueAt(camObj, 'target', t) as Vec3;
    cam.position.set(p[0], p[1], p[2]); cam.fov = valueAt(camObj, 'fov', t); cam.near = camObj.params.near ?? 0.05; cam.updateProjectionMatrix();
    cam.up.set(0, 1, 0); cam.lookAt(tg[0], tg[1], tg[2]); cam.rotateZ((valueAt(camObj, 'roll', t) as number) * DEG); cam.updateMatrixWorld(true);
    const dof = valueAt(camObj, 'dof', t) as number;
    st._dof = dof > 0 ? { cInf: dof, focus: Math.max(0.3, Math.hypot(tg[0] - p[0], tg[1] - p[1], tg[2] - p[2])), max: 24 } : null;
    st.frame(); st.follow(tg[0], 0, tg[2]);
  }

  /** Draw one view (a stage through a camera) into glCanvas. */
  private drawView(stageId: string, t: number, camObj: SceneObject | null) {
    const bs = this.stages.get(stageId); if (!bs) return null;
    const st = bs.st;
    this.applyObjects(stageId, t);
    if (camObj) this.aimCamera(st, camObj, t);
    else if (this.freeCam) {
      st.camera.position.copy(this.freeCam.position); st.camera.quaternion.copy(this.freeCam.quaternion);
      st.camera.fov = this.freeCam.fov; st.camera.near = 0.05; st.camera.updateProjectionMatrix(); st.camera.updateMatrixWorld(true);
      st._dof = null; st.frame(); st.follow(this.freeCam.position.x, 0, this.freeCam.position.z - 6);
    }
    st.scene.updateMatrixWorld(true);
    this.poseChars(stageId, t, st.camera);
    this.placeFx(stageId);
    const undo = this.tintOnly ? this.flatten(this.tintOnly) : null;
    renderStage(st);
    if (undo) undo();
    this.lastStage = bs;
    return bs;
  }

  /** Layer masks: draw one object in a flat colour (same silhouette, depth and stencil), to see exactly its pixels. */
  tintOnly: string | null = null;
  private flatten(id: string) {
    const b = this.built.get(id); if (!b) return null;
    const swaps: Array<[any, any]> = [], made: THREE.Material[] = [];
    const flat = (m: any) => {
      if (!m || m.colorWrite === false) return m;
      const f = new THREE.MeshBasicMaterial({
        color: 0xff00ff, toneMapped: false, fog: false, side: m.side,
        map: m.alphaTest > 0 || m.transparent ? m.map ?? null : null, alphaTest: m.alphaTest || 0, transparent: !!m.transparent, opacity: m.opacity ?? 1,
        depthTest: m.depthTest, depthWrite: m.depthWrite, alphaToCoverage: !!m.alphaToCoverage,
        stencilWrite: m.stencilWrite, stencilRef: m.stencilRef, stencilFunc: m.stencilFunc, stencilZPass: m.stencilZPass, stencilFail: m.stencilFail, stencilZFail: m.stencilZFail,
      });
      made.push(f); return f;
    };
    b.root.traverse((o: any) => {
      if (o.isSprite && o.material && b.obj.kind === 'fx') {   // effect particles: same soft shape, flat colour
        const m = o.material, f = new THREE.SpriteMaterial({ map: m.map, color: 0xff00ff, transparent: true, opacity: m.opacity, depthWrite: false, depthTest: m.depthTest, fog: false, toneMapped: false, rotation: m.rotation });
        made.push(f); swaps.push([o, m]); o.material = f; return;
      }
      if (!o.isMesh || o.isSprite || !o.material) return;
      swaps.push([o, o.material]);
      o.material = Array.isArray(o.material) ? o.material.map(flat) : flat(o.material);
    });
    return () => { for (const [o, m] of swaps) o.material = m; for (const f of made) f.dispose(); };
  }

  /** Effects that follow a character: put them on its feet, hips, chest, head or a hand, turned the way it faces
   *  (+Z of the effect = where the character looks, as in Rigging Studio); the effect's `pos` is an offset from there. */
  private placeFx(stageId: string) {
    for (const b of this.built.values()) {
      const o = b.obj; if (o.kind !== 'fx' || o.stage !== stageId || !o.params.follow) continue;
      const c = this.built.get(o.params.follow); if (!c || !c.pose) continue;
      const P = c.pose, at = o.params.at || 'feet';
      c.root.updateMatrixWorld(true);
      let w: THREE.Vector3;
      if (at === 'head' && c.inner.headMesh) { c.inner.headMesh.updateMatrixWorld(true); w = c.inner.headMesh.getWorldPosition(V3(0, 0, 0)); }
      else {
        const local = at === 'hips' ? P.hip.clone() : at === 'chest' ? P.hip.clone().lerp(P.neck, 0.65) : at === 'leftHand' ? P.handL.clone() : at === 'rightHand' ? P.handR.clone() : P.footL.clone().add(P.footR).multiplyScalar(0.5).setY(0);
        w = c.root.localToWorld(local);
      }
      const q = c.root.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), Math.PI / 2 + (Number(b.root.userData.ownRotY) || 0)));
      const off = (b.root.userData.offset as THREE.Vector3 | undefined)?.clone().applyQuaternion(q) || V3(0, 0, 0);
      b.root.quaternion.copy(q); b.root.position.copy(w).add(off);
    }
  }

  /** Distance from `from` towards `to` before a wall or floor of a set is in the way (null: the way is clear). */
  obstacle(stageId: string, from: Vec3, to: Vec3): number | null {
    const bs = this.stages.get(stageId); if (!bs) return null;
    const a = V3(...from), b = V3(...to), dir = b.clone().sub(a), len = dir.length(); if (len < 1e-4) return null;
    bs.st.scene.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(a, dir.normalize(), 0.05, len); ray.layers.enableAll();
    const sets = [...this.built.values()].filter((x) => x.obj.stage === stageId && (x.obj.kind === 'set' || x.obj.params.kind === 'set') && x.root.visible).map((x) => x.root);
    for (const h of ray.intersectObjects(sets, true)) {
      const m: any = (h.object as any).material;
      if ((h.object as any).isSprite || (m && !Array.isArray(m) && (m.colorWrite === false || m.transparent && m.opacity < 0.5))) continue;
      let vis = true; for (let q: THREE.Object3D | null = h.object; q; q = q.parent) if (!q.visible) vis = false;
      if (vis) return h.distance;
    }
    return null;
  }

  cameraObj(id: string) { return this.doc.objects.find((o) => o.id === id && o.kind === 'camera') || null; }

  /** The finished frame at t into this.frame (and returned). captions: draw the caption cards. */
  draw(t: number, o: { captions?: boolean; clear?: boolean } = {}) {
    const ctx = this.ctx;
    // the frame is as big as the render (captions and everything else still draw in 1080x1920 units)
    if (this.frame.width !== RW || this.frame.height !== RH) { this.frame.width = RW; this.frame.height = RH; }
    ctx.setTransform(RW / W, 0, 0, RH / H, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
    if (o.clear) ctx.clearRect(0, 0, W, H); else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
    const forced = this.forceCam ? this.cameraObj(this.forceCam) : null;
    if (this.freeCam) {
      const sid = this.freeStage || this.doc.stages[0]?.id;
      const bs = this.drawView(sid, t, null); if (bs) ctx.drawImage(glCanvas, 0, 0, W, H);
    } else if (forced) {
      const bs = this.drawView(forced.stage, t, forced); if (bs) { ctx.filter = bs.st.grade || GRADE; ctx.drawImage(glCanvas, 0, 0, W, H); ctx.filter = 'none'; }
    } else {
      const { cur, prev, blend } = activeCut(this.doc, t);
      const views = prev ? [[prev, 1], [cur, blend]] as const : [[cur, 1]] as const;
      for (const [cut, a] of views) {
        const cam = cut ? this.cameraObj(cut.camera) : null; if (!cam) continue;
        const bs = this.drawView(cam.stage, t, cam); if (!bs) continue;
        ctx.globalAlpha = a; ctx.filter = bs.st.grade || GRADE; ctx.drawImage(glCanvas, 0, 0, W, H);
      }
      ctx.globalAlpha = 1; ctx.filter = 'none';
    }
    if (o.captions !== false) this.drawCaptions(ctx, t);
    return this.frame;
  }

  drawCaptions(ctx: CanvasRenderingContext2D, t: number) {
    const caps = this.doc.captions.map((c) => [c.t, c.text]);
    if (caps.length) drawCaption(ctx, caps, t);
  }

  /** The stage camera of the last draw (for picking and handles). */
  get camera(): THREE.PerspectiveCamera | null { return this.lastStage?.st.camera || null; }
  get scene(): THREE.Scene | null { return this.lastStage?.st.scene || null; }
  builtOf(id: string) { return this.built.get(id); }

  /** The doc object under a point of the frame (ndc -1..1). Things before sets; sets only when nothing else. */
  pick(nx: number, ny: number): string | null { return this.pickHit(nx, ny)?.id ?? null; }
  /** Same as pick, with the world point that was hit (to drag at that height). */
  pickHit(nx: number, ny: number): { id: string; point: THREE.Vector3; part?: Part } | null {
    const cam = this.camera, scene = this.scene; if (!cam || !scene) return null;
    const ray = new THREE.Raycaster(); ray.layers.enableAll(); ray.setFromCamera(new THREE.Vector2(nx, ny), cam);
    let setHit: { id: string; point: THREE.Vector3 } | null = null;
    for (const h of ray.intersectObject(scene, true)) {
      if ((h.object as any).isSprite) continue;
      const mat: any = (h.object as any).material; if (mat && !Array.isArray(mat) && mat.colorWrite === false) continue;
      let q: THREE.Object3D | null = h.object, vis = true;
      for (let a: THREE.Object3D | null = q; a; a = a.parent) if (!a.visible) vis = false;
      if (!vis) continue;
      while (q && !q.userData.docId) q = q.parent;
      if (!q) continue;
      const o = this.doc.objects.find((x) => x.id === q!.userData.docId);
      if (!o || o.locked) continue;
      if (o.kind === 'set') { setHit ||= { id: o.id, point: h.point.clone() }; continue; }
      return { id: o.id, point: h.point.clone(), part: o.kind === 'char' ? this.charPart(o, h) : undefined };
    }
    return setHit;
  }

  /** Which part of a character was clicked: the hair, the face, the clothes, or an arm/leg. */
  private charPart(o: SceneObject, h: THREE.Intersection): Part {
    const b = this.built.get(o.id)!, ch = b.inner;
    if (h.object === ch.headMesh && h.uv) {
      const cv: HTMLCanvasElement = ch.headMesh.material.map.image, S = cv.width;
      const x = Math.floor(h.uv.x * S), y = Math.floor((1 - h.uv.y) * S);
      const px = cv.getContext('2d', { willReadFrequently: true })!.getImageData(Math.max(0, Math.min(S - 1, x)), Math.max(0, Math.min(S - 1, y)), 1, 1).data;
      const near = (hex: any) => { if (!hex) return false; const c = new THREE.Color(typeof hex === 'string' ? hex : hex); return Math.abs(px[0] - c.r * 255) + Math.abs(px[1] - c.g * 255) + Math.abs(px[2] - c.b * 255) < 110; };
      const cx = S / 2, cy = S / 2, R = S * 0.3, dy = (y - cy) / R;
      const lp = lookParams(this.doc, o);
      if (near(lp.hair) || near(lp.hair2) || dy < -0.75 || Math.hypot(x - cx, y - cy) > R * 1.02) return 'hair';
      return 'face';
    }
    if (ch.children.indexOf(h.object) >= 0 && (h.object as any).geometry?.type === 'TubeGeometry') return 'pose';
    let q: THREE.Object3D | null = h.object; while (q && q.parent !== ch) q = q.parent;
    const idx = q ? ch.children.indexOf(q) : -1;
    return idx >= 0 && (q as any).geometry?.type !== 'SphereGeometry' ? 'clothes' : 'pose';
  }
}

// ---------------------------------------------------------------- helpers
import { MOODS } from 'engine/stage.js';
function MOOD_BASE(m: string) { return MOODS[m] || MOODS.day; }

/** "#ff8800" or "0xff8800" strings for the colour params the engine wants as numbers. */
const NUM_COLORS = new Set(['shirt', 'shirt2', 'pants', 'color', 'bow', 'frame', 'legColor', 'pot', 'blanket', 'cushion', 'top', 'wall', 'roofColor', 'trim', 'doorColor', 'siding', 'stripe']);
function hexify(p: Record<string, any>) {
  const o: any = Array.isArray(p) ? [...p] : { ...p };
  for (const k in o) {
    const v = o[k];
    if (typeof v === 'string' && NUM_COLORS.has(k) && /^(#|0x)[0-9a-f]{6}$/i.test(v)) o[k] = parseInt(v.replace('#', '').replace(/^0x/i, ''), 16);
    else if (v && typeof v === 'object' && !Array.isArray(v) && k !== 'head') o[k] = hexify(v);
  }
  return o;
}
function P_blob(car: any) {
  const L = car.spec?.L ?? 4.6, Wd = (car.spec?.hw ?? 0.9) * 2 + 0.4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(L * 1.05, Wd), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.01; m.userData.noHit = true; return m;
}
/** A different number per object (so two people breathing are not in step). */
function idPhase(id: string) { let h = 7; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return (h % 628) / 100; }

/** An enum track (arm preset, stand/sit) that changed less than BLEND s ago: the value before and how far along. */
const BLEND = 0.32;
function enumBlend(o: SceneObject, key: string, t: number): { prev: any; w: number } | null {
  const ks = o.tracks[key]; if (!ks || ks.length < 2) return null;
  let i = -1; for (let j = 0; j < ks.length; j++) if (ks[j].t <= t) i = j;
  if (i <= 0) return null;
  const k = ks[i], dt = t - k.t; if (dt >= BLEND) return null;
  const prev = valueAt(o, key, k.t - 1e-4);
  if (JSON.stringify(prev) === JSON.stringify(k.v)) return null;
  const u = dt / BLEND; return { prev, w: u * u * (3 - 2 * u) };
}

/**
 * Walking at t: phase (radians, PI per step), how much (0..1, eases in and out), direction in the character's space.
 * - a walk track (steps per second) walks on the spot or at that rate;
 * - otherwise a character whose position moves walks by itself, the phase driven by the distance covered, so each
 *   planted foot stays put on the floor (no skating), whatever the speed and in any direction (backwards too).
 * Set params.autoWalk = false to slide instead (a character on a moving walkway, a ghost).
 */
const walkCache = new Map<string, { sig: string; dt: number; ph: Float32Array }>();
const scaleOf = (o: SceneObject, t: number) => { const s = valueAt(o, 'scale', t) as any; return Array.isArray(s) ? s[1] || 1 : Number(s) || 1; };
function walkState(o: SceneObject, t: number, R = 0.2): { phase: number; amt: number; dir: [number, number] } | undefined {
  const wk = o.tracks.walk;
  if (wk && wk.some((k) => Number(k.v) !== 0)) {
    if (Math.abs(valueAt(o, 'walk', t) as number) < 0.05) return undefined;   // standing at this moment
    // phase = integral of the walk speed: a table built once per change of the track (not summed again every frame)
    const sig = 'w' + JSON.stringify(wk);
    let c = walkCache.get(o.id);
    if (!c || c.sig !== sig) {
      const dt = 1 / 120, end = Math.max(...wk.map((k) => k.t)) + 0.5, n = Math.ceil(end / dt) + 2, ph = new Float32Array(n);
      for (let i = 1; i < n; i++) ph[i] = ph[i - 1] + (valueAt(o, 'walk', (i - 0.5) * dt) as number) * Math.PI * dt;
      c = { sig, dt, ph }; walkCache.set(o.id, c);
    }
    const f = t / c.dt, n = c.ph.length, last = c.ph[n - 1];
    const phase = f >= n - 1 ? last + (t - (n - 1) * c.dt) * (valueAt(o, 'walk', t) as number) * Math.PI : c.ph[Math.floor(f)] + (c.ph[Math.floor(f) + 1] - c.ph[Math.floor(f)]) * (f - Math.floor(f));
    return { phase, amt: 1, dir: [1, 0] };
  }
  if (o.params.autoWalk === false) return undefined;
  const pk = o.tracks.pos; if (!pk || pk.length < 2) return undefined;
  const stride = (o.params.stride ?? WALK_STRIDE) * (R / 0.2);
  // phase table, rebuilt only when the movement changes
  const sig = JSON.stringify([pk, o.tracks.scale || null, stride]);
  let c = walkCache.get(o.id);
  if (!c || c.sig !== sig) {
    const dt = 1 / 120, end = Math.max(...pk.map((k) => k.t)) + 0.5, n = Math.ceil(end / dt) + 2, ph = new Float32Array(n);
    let prev = valueAt(o, 'pos', 0) as Vec3;
    for (let i = 1; i < n; i++) {
      const p = valueAt(o, 'pos', i * dt) as Vec3;
      ph[i] = ph[i - 1] + Math.PI * Math.hypot(p[0] - prev[0], p[2] - prev[2]) / scaleOf(o, i * dt) / stride; prev = p;
    }
    c = { sig, dt, ph }; walkCache.set(o.id, c);
  }
  const h = 0.06, a = valueAt(o, 'pos', Math.max(0, t - h)) as Vec3, b = valueAt(o, 'pos', t + h) as Vec3;
  const vx = (b[0] - a[0]) / (2 * h), vz = (b[2] - a[2]) / (2 * h), speed = Math.hypot(vx, vz) / scaleOf(o, t);
  const u = Math.min(1, Math.max(0, (speed - 0.04) / 0.22)), amt = u * u * (3 - 2 * u);
  if (amt < 0.002) return undefined;
  const f = Math.min(c.ph.length - 2, t / c.dt), i = Math.floor(f), phase = c.ph[i] + (c.ph[i + 1] - c.ph[i]) * (f - i);
  const ry = (valueAt(o, 'rotY', t) as number) * DEG;
  return { phase, amt, dir: [vx * Math.cos(ry) - vz * Math.sin(ry), vx * Math.sin(ry) + vz * Math.cos(ry)] };
}
/** Distance a car has driven along its own forward axis by t (for the wheels). */
function travelled(o: SceneObject, t: number) {
  const keys = o.tracks.pos; if (!keys || keys.length < 2) return 0;
  let d = 0, prev = valueAt(o, 'pos', 0) as Vec3; const dt = 1 / 30;
  for (let s = dt; s <= t + 1e-6; s += dt) {
    const p = valueAt(o, 'pos', s) as Vec3, a = (valueAt(o, 'rotY', s) as number) * DEG;
    d += (p[0] - prev[0]) * Math.cos(a) - (p[2] - prev[2]) * Math.sin(a); prev = p;
  }
  return d;
}
