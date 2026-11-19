// Auto-build: script + cast + background (+ voice) -> a first scene, with every piece editable on the timeline.
// Rules from the 3d-video-studio skill, kept simple: an establishing wide, a close-up on whoever speaks, slow
// push-ins, faces react on ! and ?, lip-sync on every line, 1-2 word captions.
import { SceneDoc, SceneObject, normalize, Vec3, Key } from './doc';
import { LIB } from './library';
import { randomLook } from './looks';
import { captionsFromWords } from 'engine/captions.js';
import { BUILDS } from 'engine/chars.js';

export interface CastPick { from: 'library' | 'random' | 'role'; name: string }     // a saved character, or a new random one
export interface BgPick { from: 'builtin' | 'library'; name: string }    // builtin: office kitchen living shop empty house highway floor
export interface Brief {
  name: string; idea: string; script: string; mood: 'day' | 'dusk' | 'night' | 'rain';
  cast: Record<string, CastPick>; background: BgPick;
  audio?: { file: string; duration: number } | null;
  /** From a reference video: real start / end of each script line (same order and count), and its shot cuts. */
  lineTimes?: Array<{ s: number; e: number }> | null;
  refCuts?: number[] | null;
  ref?: { url?: string | null; duration: number } | null;
}
export interface Line { speaker: string | null; text: string }

const NARRATOR = /^(narrator|người dẫn|dẫn chuyện|lời dẫn|vo|voice ?over|kể)$/i;
export function parseScript(script: string): Line[] {
  return script.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = /^([^:：]{1,30})[:：]\s*(.+)$/.exec(l);
    if (m && !/^https?$/i.test(m[1].trim())) { const sp = m[1].trim(); return { speaker: NARRATOR.test(sp) ? null : sp, text: m[2].trim() }; }
    return { speaker: null, text: l };
  });
}
export const speakersOf = (script: string) => [...new Set(parseScript(script).map((l) => l.speaker).filter(Boolean) as string[])];

const BUILTIN: Record<string, { label: string; set: any; stand: [number, number]; spread: number }> = {
  office: { label: 'Văn phòng', set: { type: 'room', opts: { kind: 'office' } }, stand: [0, -1.5], spread: 0.95 },
  kitchen: { label: 'Bếp', set: { type: 'room', opts: { kind: 'kitchen' } }, stand: [0, -1.2], spread: 0.95 },
  living: { label: 'Phòng khách', set: { type: 'room', opts: { kind: 'living' } }, stand: [0, -1.3], spread: 0.95 },
  shop: { label: 'Cửa hàng', set: { type: 'room', opts: { kind: 'shop' } }, stand: [0, -1.1], spread: 0.95 },
  empty: { label: 'Phòng trống', set: { type: 'room', opts: { kind: 'empty' } }, stand: [0, -1.6], spread: 1.0 },
  house: { label: 'Trước nhà', set: { type: 'house', opts: { seed: 7 } }, stand: [0, 3.2], spread: 1.1 },
  highway: { label: 'Lề đường cao tốc', set: { type: 'highway', opts: {} }, stand: [0, 8.6], spread: 1.1 },
  floor: { label: 'Sàn trống', set: { type: 'floor', w: 40, d: 40 }, stand: [0, 0], spread: 1.0 },
};
export const BUILTIN_BG = Object.entries(BUILTIN).map(([k, v]) => ({ key: k, label: v.label }));


const r3 = (v: number) => Math.round(v * 1000) / 1000;
const K = (t: number, v: any, ease?: string): Key => ({ t: r3(t), v, ...(ease ? { ease: ease as any } : {}) });

export function autoBuild(b: Brief): SceneDoc {
  const lines = parseScript(b.script);
  const speakers = speakersOf(b.script);
  // everyone in the scene: speakers first (their close-ups use the same index), then cast picked without lines
  const people = [...speakers, ...Object.keys(b.cast || {}).filter((k) => !speakers.includes(k))];
  const stage = 'stage1';
  const objects: SceneObject[] = [];

  // ---- background
  let stand: [number, number] = [0, 0], spread = 1;
  if (b.background.from === 'library') {
    const bg = LIB.backgrounds.find((x) => x.name === b.background.name)?.data;
    if (bg) {
      stand = bg.stand || [0, 0];
      bg.objects.forEach((o: SceneObject, i: number) => objects.push({ ...JSON.parse(JSON.stringify(o)), id: `bg${i}_${o.id}`.slice(0, 40), stage }));
    }
  } else {
    const B = BUILTIN[b.background.name] || BUILTIN.office;
    stand = B.stand; spread = B.spread;
    objects.push({ id: 'set', name: B.label, kind: 'set', stage, params: JSON.parse(JSON.stringify(B.set)), tracks: {} });
  }

  // ---- timing: 3.8 words/s with a gap between lines, or stretched to the voice
  let t = 0.4; const timed = lines.map((l) => { const n = l.text.split(/\s+/).filter(Boolean).length, d = Math.max(0.6, n / 3.8), s = t; t += d + 0.35; return { ...l, s, d }; });
  const speechEnd = t - 0.35;
  if (b.lineTimes && b.lineTimes.length === timed.length) {   // the reference's own timing, line by line
    timed.forEach((l, i) => { l.s = b.lineTimes![i].s; l.d = Math.max(0.3, b.lineTimes![i].e - b.lineTimes![i].s); });
  } else if (b.audio?.duration && speechEnd > 0) {
    const k = Math.max(0.3, (b.audio.duration - 0.5) / speechEnd);
    for (const l of timed) { l.s *= k; l.d *= k; }
  }
  const end = timed.length ? timed[timed.length - 1].s + timed[timed.length - 1].d : 3;
  const duration = r3(b.ref?.duration ? b.ref.duration : Math.max(end + 0.8, b.audio?.duration ? b.audio.duration + 0.2 : 0, 2));

  // ---- characters
  const n = Math.max(1, people.length), cx = stand[0], cz = stand[1];
  const xs = people.map((_, i) => cx + (i - (n - 1) / 2) * spread);
  const charId = (sp: string) => 'c_' + (people.indexOf(sp) + 1);
  people.forEach((sp, i) => {
    const pick = b.cast[sp] || { from: 'random', name: '' };
    let params: any, extra: Record<string, Key[]> = {};
    const saved = pick.from === 'library' ? LIB.characters.find((c) => c.name === pick.name)?.data : null;
    if (saved) { params = JSON.parse(JSON.stringify(saved.params)); extra = JSON.parse(JSON.stringify(saved.tracks || {})); }
    else params = randomLook();   // a new character, every part chosen at random
    const x = xs[i], turn = n > 1 ? Math.sign(cx - x) * 28 : 0;
    const my = timed.filter((l) => l.speaker === sp);
    const expr: Key[] = [K(0, 'calm')], armL: Key[] = [K(0, 'down')], armR: Key[] = [K(0, 'down')];
    for (const l of my) {
      const e = /[!！]\s*$/.test(l.text) ? (/\?|sao|gì|what|why/i.test(l.text) ? 'shock' : 'grin') : /[?？]\s*$/.test(l.text) ? 'worried' : 'smug';
      expr.push(K(Math.max(0, l.s - 0.05), e));
      if (e === 'grin' || e === 'shock') { armR.push(K(l.s, e === 'shock' ? 'shrug' : 'point')); armR.push(K(l.s + l.d + 0.2, 'down')); if (e === 'shock') { armL.push(K(l.s, 'shrug')); armL.push(K(l.s + l.d + 0.2, 'down')); } }
      expr.push(K(l.s + l.d + 0.25, 'calm'));
    }
    objects.push({
      id: charId(sp), name: sp, kind: 'char', stage, params,
      tracks: {
        ...extra,
        pos: [K(0, [r3(x), 0, cz])], rotY: [K(0, -90 + turn)],
        expr: dedupe(expr), armL: dedupe(armL), armR: dedupe(armR),
        ...(my.length ? { say: my.map((l) => ({ t: r3(l.s), v: l.text, d: r3(l.d) })) } : {}),
      },
    });
  });

  // ---- cameras: one wide on everyone, one close-up per speaker; every hold creeps in
  const halfW = ((n - 1) * spread) / 2 + 0.5, dist = Math.max(2.6, halfW / 0.262 + 0.4);
  const cam = (id: string, name: string, tx: number, ty: number, dz: number, h: number, fov: number, push: number): SceneObject => ({
    id, name, kind: 'camera', stage, params: {},
    tracks: { pos: [K(0, [r3(tx + 0.1), h, r3(cz + dz)], 'linear'), K(duration, [r3(tx + 0.1), r3(h - 0.03), r3(cz + dz * (1 - push))])], target: [K(0, [r3(tx), ty, r3(cz)])], fov: [K(0, fov)] },
  });
  const heads = people.map((sp) => headHeight(objects.find((o) => o.id === charId(sp))!.params));
  const top = Math.max(1.1, ...heads);
  objects.push(cam('wide', 'Toàn cảnh', cx, r3(top * 0.62), Math.max(dist, top * 2.4), r3(top * 0.98), 50, 0.12));
  // close-up: head in the upper third, chest in frame (talker head width ~40 % of the frame)
  speakers.forEach((sp, i) => objects.push(cam('close_' + (i + 1), 'Cận ' + sp, xs[i], r3(heads[i] - 0.2), 2.3, r3(heads[i] - 0.08), 34, 0.18)));

  // ---- the edit: wide first, then whoever speaks
  const cuts: { t: number; camera: string; dissolve?: number }[] = [{ t: 0, camera: 'wide' }];
  let prev: string | null = null;
  if (b.refCuts && b.refCuts.length > 1) {
    // the reference's cut rhythm: at each of its cuts, whoever is speaking then (close-up), else the wide; never the same twice
    for (const ct of b.refCuts.slice(1)) {
      const l = timed.find((q) => ct >= q.s - 0.2 && ct < q.s + q.d + 0.2) || timed.find((q) => q.s >= ct && q.s - ct < 1.2);   // speaking now, or about to
      let want = l?.speaker && speakers.length ? 'close_' + (speakers.indexOf(l.speaker) + 1) : 'wide';
      const last = cuts[cuts.length - 1].camera;
      if (want === last) want = last === 'wide' ? (speakers.length ? 'close_1' : 'wide') : 'wide';
      if (want !== last) cuts.push({ t: r3(ct), camera: want });
    }
  } else timed.forEach((l, i) => {
    const want = l.speaker && speakers.length && i > 0 ? 'close_' + (speakers.indexOf(l.speaker) + 1) : 'wide';
    const at = r3(Math.max(0, l.s - 0.12));
    const last = cuts[cuts.length - 1];
    if (want !== (prev ?? last.camera) && at - last.t >= 0.8) cuts.push({ t: at, camera: want });
    prev = cuts[cuts.length - 1].camera;
  });
  if (!b.refCuts && timed.length > 2 && cuts[cuts.length - 1].camera !== 'wide' && duration - end > 0.5) cuts.push({ t: r3(end + 0.15), camera: 'wide', dissolve: 9 });

  // ---- captions: 1-2 words a card, off between lines
  const captions: { t: number; text: string }[] = [];
  for (const l of timed) {
    const ws = l.text.split(/\s+/).filter(Boolean), step = l.d / ws.length;
    const cards = captionsFromWords(ws.map((w, i) => ({ w, s: l.s + i * step, e: l.s + (i + 0.85) * step })));
    cards.forEach(([ct, text]: [number, string], i: number) => captions.push({ t: r3(i === 0 ? l.s : ct), text }));
    captions.push({ t: r3(l.s + l.d + 0.15), text: '' });
  }

  return normalize({
    version: 1, name: b.name, fps: 60, width: 1080, height: 1920, duration,   // 60 frames a second: smoother motion
    stages: [{ id: stage, name: b.background.from === 'builtin' ? (BUILTIN[b.background.name]?.label || 'Sân khấu') : b.background.name, mood: b.mood }],
    objects, cuts, captions,
    audio: b.audio ? [{ id: 'voice', file: b.audio.file, start: 0, name: 'Giọng đọc' }] : [],
    notes: `Ý tưởng: ${b.idea}\n\nKịch bản:\n${b.script}`,
  });
}
/** Height of the head centre of a standing character (chars.js stand(): hip, spine, head above the neck). */
/** Hip height of a standing character (to lower the head when it sits). */
export function hipHeight(p: any) { const B = BUILDS[p.build] || BUILDS.average, k = (p.R ?? 0.2) / 0.2; return 0.64 * k * B.legs * (p.legs ?? 1); }
export function headHeight(p: any) {
  const B = BUILDS[p.build] || BUILDS.average, R = p.R ?? 0.2, k = R / 0.2;
  return 0.64 * k * B.legs * (p.legs ?? 1) + 0.36 * k * B.torso * (p.torso ?? 1) + 0.86 * R;
}
function dedupe(keys: Key[]) {
  const out: Key[] = [];
  for (const k of keys.sort((a, b) => a.t - b.t)) { const l = out[out.length - 1]; if (l && Math.abs(l.t - k.t) < 0.02) l.v = k.v; else if (!l || l.v !== k.v) out.push(k); }
  return out;
}

/** A brief for Claude, next to scene.json, so it can rebuild the draft properly with the skill. */
export function briefMarkdown(b: Brief) {
  return `# Brief: ${b.name}

## Ý tưởng
${b.idea || '(không có)'}

## Kịch bản (mỗi dòng "Tên: câu", không tên = lời dẫn)
${b.script}

## Nhân vật
${Object.entries(b.cast).map(([sp, c]) => `- ${sp}: ${c.from === 'library' ? `nhân vật đã lưu "${c.name}" (Library/characters/${c.name}.json)` : 'nhân vật mới (ngoại hình ngẫu nhiên)'}`).join('\n') || '- (chỉ có lời dẫn)'}

## Bối cảnh
${b.background.from === 'library' ? `Bối cảnh đã lưu "${b.background.name}" (Library/backgrounds/${b.background.name}.json)` : `Có sẵn: ${BUILTIN[b.background.name]?.label || b.background.name}`}, không khí: ${b.mood}

## Giọng đọc
${b.audio ? `${b.audio.file} (${b.audio.duration.toFixed(1)} s), đã đặt ở 0 s` : 'Chưa có (thời gian ước 3.8 từ/giây)'}

${b.ref ? `## Video tham khảo (clone)
${b.ref.url ? `Link: ${b.ref.url}\n` : ''}File: Projects/${b.name}/ref/ref.mp4 (${b.ref.duration.toFixed(1)} s). Phân tích: Projects/${b.name}/ref/ref.json (các chỗ cắt cảnh, lời thoại và thời gian).
Xem các frame: Projects/${b.name}/ref/sheet-NN.png (mỗi 0.5 s một frame, có ghi giây) và ref/thumbs/shot-NN.jpg (mỗi cảnh một ảnh).
Clone: giữ cùng nhịp, cùng các cảnh và hành động như video tham khảo, nhưng bằng nhân vật và bối cảnh của studio.

` : ''}## Việc cần làm
scene.json đã có bản nháp tự động (cùng nhân vật, bối cảnh, câu thoại, phụ đề). Dựng lại cho đẹp và đúng ý tưởng
theo skill/SKILL.md: góc máy, cắt cảnh, hành động, biểu cảm, đồ vật gây cười. Giữ nguyên id nhân vật và câu thoại.
`;
}
