// A production plan: the whole video as choices a person can read and change before anything is built: the cast
// (every part of each look), each scene (set and its options, sky, lighting, shader, props, where people stand) and
// each beat (line, face, gesture, action, camera shot and move, transition, effect). The AI writes it from a chat;
// the Kịch bản tab shows every parameter to edit and approve; buildFromPlan() turns it into an editable scene.
//
// Variety: every approved plan leaves a fingerprint in Library/plans (shared by the team through git). The AI gets
// the recent ones and must not repeat them; the review shows how different the plan is and what repeats.
import { SceneDoc, SceneObject, Key, Vec3, normalize, EXPRS, ARMS } from './doc';
import { LIGHTS, LOOKS } from './lighting';
import { SHOTS, Shot, Move, MOVE_VI, shotKeys, Limit } from './cameraShots';
import { LIB } from './library';
import { randomLook, rng, SHIRT_COLORS, PANTS_COLORS, SKIN_TONES } from './looks';
import { HAIR_STYLES, BUILD_NAMES, OUTFIT_NAMES, ACC_NAMES } from 'engine/chars.js';
import { PROPS as PROP_TYPES } from 'engine/props.js';
import { HAIR_COLORS } from 'engine/variety.js';
import { FX, FX_NAMES } from './vfx';
import { captionsFromWords } from 'engine/captions.js';

// ------------------------------------------------------------------ the format
export interface PlanLook { style: string; hair: string; hair2?: string; skin?: string; shirt: string; shirt2?: string; pants: string; outfit: string; build: string; acc: string[]; glasses?: boolean; R?: number }
export interface PlanChar { name: string; library?: string; look: PlanLook; note?: string }
export type SetType = 'room' | 'house' | 'highway' | 'floor' | 'library';
export interface PlanSet { type: SetType; kind?: string; library?: string; wall?: string; floor?: string; floorColor?: string; view?: string; seed?: number; siding?: string; roofColor?: string; doorColor?: string; storeys?: number; color?: string }
export interface PlanProp { type: string; text?: string; x: number; z: number; rotY?: number; scale?: number }
export interface PlanSpot { who: string; x: number; z: number; face: number }
export type Action = 'none' | 'walk-in' | 'walk-out' | 'walk-to' | 'turn';
export interface PlanBeat { who: string | null; line: string; expr: string; arms: string; action: Action; to?: [number, number]; shot: string; on: string | null; with: string | null; move: Move; speed?: number; transition: 'cut' | 'dissolve'; fx?: string }
export interface PlanScene { id: string; name: string; sky: 'day' | 'dusk' | 'night' | 'rain'; light: string; look: string; set: PlanSet; props: PlanProp[]; blocking: PlanSpot[]; beats: PlanBeat[] }
export interface Plan { version: 1; title: string; logline: string; pace: number; captionWords: number; cast: PlanChar[]; scenes: PlanScene[] }

// camera shots by short id (the built-in ones, in SHOTS order) and the ones saved in Library/cameras ("lib:<name>")
export const SHOT_IDS = ['wide', 'medium', 'close', 'xclose', 'threequarter', 'side', 'low', 'high', 'dutch', 'behind', 'two', 'ots', 'pov', 'orbit', 'reveal', 'crane', 'handheld', 'follow'];
export function shotOf(id: string): Shot | null {
  const i = SHOT_IDS.indexOf(id); if (i >= 0) return SHOTS[i];
  if (id.startsWith('lib:')) { const c = LIB.cameras.find((x) => x.name === id.slice(4)); if (c?.data) return c.data as Shot; }
  return null;
}
export const shotLabel = (id: string) => shotOf(id)?.name || id;
export const allShotIds = () => [...SHOT_IDS, ...LIB.cameras.map((c) => 'lib:' + c.name)];
export const MOVES = Object.keys(MOVE_VI) as Move[];
export const ROOM_KINDS = ['office', 'kitchen', 'living', 'shop', 'empty'];
export const ROOM_KIND_VI: Record<string, string> = { office: 'Văn phòng', kitchen: 'Bếp', living: 'Phòng khách', shop: 'Cửa hàng', empty: 'Phòng trống' };
export const VIEWS = ['skyline', 'skylineNight', 'trees', 'street'];
export const VIEW_VI: Record<string, string> = { skyline: 'Nhà cao tầng', skylineNight: 'Phố đêm', trees: 'Cây xanh', street: 'Đường phố' };
export const FLOORS = ['wood', 'tile', 'carpet'];
export const SET_VI: Record<SetType, string> = { room: 'Trong phòng', house: 'Trước nhà', highway: 'Lề đường cao tốc', floor: 'Sàn trống', library: 'Bối cảnh trong thư viện' };
export const ACTION_VI: Record<Action, string> = { none: 'Đứng tại chỗ', 'walk-in': 'Đi vào khung', 'walk-out': 'Đi ra khỏi khung', 'walk-to': 'Đi tới chỗ khác', turn: 'Quay về phía máy' };
export const SKY_VI: Record<string, string> = { day: 'Ban ngày', dusk: 'Hoàng hôn', night: 'Ban đêm', rain: 'Trời mưa' };
const STAND: Record<string, [number, number]> = { office: [0, -1.5], kitchen: [0, -1.2], living: [0, -1.3], shop: [0, -1.1], empty: [0, -1.6], house: [0, 3.2], highway: [0, 8.6], floor: [0, 0] };

// ------------------------------------------------------------------ cleaning what the AI (or a person) wrote
const BIG_PROPS = ['tree', 'bush', 'streetLamp', 'shelf', 'fence', 'cabinet', 'hospitalBed', 'counter'];
const pickOf = <T,>(a: T[], v: any, d: T): T => (a.includes(v) ? v : d);
const hexOk = (v: any, d: string) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : d);
const num = (v: any, lo: number, hi: number, d: number) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
const str = (v: any, d = '') => (typeof v === 'string' ? v.trim() : d);

export function cleanLook(l: any, seed = 1): PlanLook {
  const r = randomLook(seed), L = l || {};
  return {
    style: pickOf(HAIR_STYLES as string[], L.style, r.style), hair: hexOk(L.hair, r.hair), hair2: L.hair2 ? hexOk(L.hair2, r.hair2) : r.hair2,
    skin: L.skin ? hexOk(L.skin, '#f8f3ea') : undefined, shirt: hexOk(L.shirt, r.shirt), shirt2: L.shirt2 ? hexOk(L.shirt2, '#fbf7ef') : undefined,
    pants: hexOk(L.pants, r.pants), outfit: pickOf(OUTFIT_NAMES as string[], L.outfit, r.outfit), build: pickOf(BUILD_NAMES as string[], L.build, r.build),
    acc: (Array.isArray(L.acc) ? L.acc : []).filter((a: any) => (ACC_NAMES as string[]).includes(a)).slice(0, 3), glasses: !!L.glasses || undefined,
    R: L.R != null ? num(L.R, 0.17, 0.24, 0.2) : undefined,
  };
}
/** Make any plan-shaped object safe to build: unknown names become allowed ones, numbers are clamped. */
export function cleanPlan(p: any): Plan {
  const P = p || {};
  const cast: PlanChar[] = (Array.isArray(P.cast) ? P.cast : []).slice(0, 8).map((c: any, i: number) => ({
    name: str(c?.name, `Nhân vật ${i + 1}`).replace(/:/g, '').slice(0, 30) || `Nhân vật ${i + 1}`,
    library: c?.library && LIB.characters.some((x) => x.name === c.library) ? c.library : undefined,
    look: cleanLook(c?.look, 1000 + i * 77), note: str(c?.note) || undefined,
  }));
  const names = cast.map((c) => c.name);
  const who = (v: any) => (typeof v === 'string' && names.includes(v) ? v : null);
  const scenes: PlanScene[] = (Array.isArray(P.scenes) && P.scenes.length ? P.scenes : [{}]).slice(0, 6).map((s: any, si: number) => {
    const S = s || {}, st = S.set || {};
    const type: SetType = pickOf(['room', 'house', 'highway', 'floor', 'library'] as SetType[], st.type, 'room');
    const set: PlanSet = { type };
    if (type === 'room') Object.assign(set, { kind: pickOf(ROOM_KINDS, st.kind, 'office'), wall: hexOk(st.wall, '#e8dcc0'), floor: pickOf(FLOORS, st.floor, 'wood'), floorColor: st.floorColor ? hexOk(st.floorColor, '#a8743e') : undefined, view: pickOf(VIEWS, st.view, 'skyline'), seed: Math.round(num(st.seed, 1, 9999, 1 + si)) });
    if (type === 'house') Object.assign(set, { seed: Math.round(num(st.seed, 1, 9999, 7)), siding: st.siding ? hexOk(st.siding, '#d8cfc0') : undefined, roofColor: st.roofColor ? hexOk(st.roofColor, '#5a4a44') : undefined, doorColor: st.doorColor ? hexOk(st.doorColor, '#a83a2a') : undefined, storeys: Math.round(num(st.storeys, 1, 2, 1)) });
    if (type === 'floor') set.color = hexOk(st.color, '#d9d2c0');
    if (type === 'library') { set.library = LIB.backgrounds.some((b) => b.name === st.library) ? st.library : LIB.backgrounds[0]?.name; if (!set.library) { set.type = 'room'; set.kind = 'office'; } }
    const beats: PlanBeat[] = (Array.isArray(S.beats) ? S.beats : []).slice(0, 60).map((b: any) => {
      const B = b || {}, w = who(B.who), on = who(B.on) || w;
      return {
        who: w, line: str(B.line).slice(0, 220), expr: pickOf(EXPRS, B.expr, w ? 'talk' : 'calm'), arms: pickOf(ARMS, B.arms, 'down'),
        action: pickOf(['none', 'walk-in', 'walk-out', 'walk-to', 'turn'] as Action[], B.action, 'none'),
        to: Array.isArray(B.to) && B.to.length === 2 ? [num(B.to[0], -2.5, 2.5, 0), num(B.to[1], -1.5, 2, 0)] as [number, number] : undefined,
        shot: allShotIds().includes(B.shot) ? B.shot : 'medium', on, with: who(B.with) && who(B.with) !== on ? who(B.with) : null,
        move: pickOf(MOVES, B.move, shotOf(B.shot)?.move || 'push'), speed: B.speed != null ? num(B.speed, 0, 40, 6) : undefined,
        transition: B.transition === 'dissolve' ? 'dissolve' : 'cut', fx: (FX_NAMES as string[]).includes(B.fx) ? B.fx : undefined,
      };
    });
    const inScene = [...new Set(beats.flatMap((b) => [b.who, b.on, b.with]).filter(Boolean) as string[])];
    const given = (Array.isArray(S.blocking) ? S.blocking : []).filter((q: any) => who(q?.who));
    const blocking: PlanSpot[] = inScene.map((n, i) => {
      const g = given.find((q: any) => q.who === n), dx = (i - (inScene.length - 1) / 2) * 0.95;
      return { who: n, x: num(g?.x, -2.5, 2.5, +dx.toFixed(2)), z: num(g?.z, -1.5, 2, 0), face: num(g?.face, -180, 180, -90 + (inScene.length > 1 ? Math.sign(-dx) * 28 : 0)) };
    });
    // people stand at least 0.9 m apart (closer, a close-up of one is the back of the other's head)
    const byX = [...blocking].sort((a, b) => a.x - b.x);
    for (let k = 1; k < byX.length; k++) if (Math.hypot(byX[k].x - byX[k - 1].x, byX[k].z - byX[k - 1].z) < 0.9) byX[k].x = +(byX[k - 1].x + 0.9).toFixed(2);
    if (byX.length > 1) { const mid = (byX[0].x + byX[byX.length - 1].x) / 2; for (const q of byX) q.x = +Math.max(-2.5, Math.min(2.5, q.x - mid)).toFixed(2); }
    return {
      id: `s${si + 1}`, name: str(S.name, `Cảnh ${si + 1}`).slice(0, 40), sky: pickOf(['day', 'dusk', 'night', 'rain'], S.sky, 'day') as PlanScene['sky'],
      light: pickOf(Object.keys(LIGHTS), S.light, 'studio'), look: pickOf(Object.keys(LOOKS), S.look, 'ink'), set,
      props: (Array.isArray(S.props) ? S.props : []).slice(0, 12).filter((q: any) => (PROP_TYPES as string[]).includes(q?.type)).map((q: any) => ({ type: q.type, text: str(q.text) || undefined, x: num(q.x, -3, 3, 0), z: num(q.z, -2.5, BIG_PROPS.includes(q.type) ? -0.9 : 2.5, -0.5) /* big things stay behind the actors, never between them and the lens */, rotY: q.rotY != null ? num(q.rotY, -180, 180, 0) : undefined, scale: q.scale != null ? num(q.scale, 0.3, 3, 1) : undefined })),
      blocking, beats,
    };
  });
  return { version: 1, title: str(P.title, 'Video mới').slice(0, 60), logline: str(P.logline).slice(0, 300), pace: num(P.pace, 2.6, 4.6, 3.6), captionWords: Math.round(num(P.captionWords, 1, 3, 2)), cast, scenes };
}

// ------------------------------------------------------------------ variety: fingerprints of past videos
export interface Fingerprint { project: string; at: string; title: string; sets: string[]; lights: string[]; looks: string[]; skies: string[]; open: string; shots: string[]; moves: string[]; outfits: string[]; hairs: string[]; pace: number }
export function fingerprint(p: Plan, project = ''): Fingerprint {
  const beats = p.scenes.flatMap((s) => s.beats);
  return {
    project, at: new Date().toISOString(), title: p.title,
    sets: p.scenes.map((s) => [s.set.type, s.set.kind || s.set.library || '', s.set.wall || s.set.siding || '', s.set.floor || ''].filter(Boolean).join('/')),
    lights: p.scenes.map((s) => s.light), looks: p.scenes.map((s) => s.look), skies: p.scenes.map((s) => s.sky),
    open: beats[0] ? `${beats[0].shot}/${beats[0].move}` : '', shots: beats.map((b) => b.shot), moves: beats.map((b) => b.move),
    outfits: p.cast.map((c) => `${c.look.outfit}/${c.look.shirt}`), hairs: p.cast.map((c) => `${c.look.style}/${c.look.hair}`), pace: p.pace,
  };
}
export const history = (): Fingerprint[] => LIB.plans.map((x) => x.data).filter(Boolean).sort((a: any, b: any) => (a.at < b.at ? 1 : -1));
const jac = (a: string[], b: string[]) => { const A = new Set(a), B = new Set(b); if (!A.size && !B.size) return 0; let i = 0; for (const x of A) if (B.has(x)) i++; return i / (A.size + B.size - i); };
/** Order-aware likeness of two shot lists: shared runs of 2 shots in a row. */
const runs = (a: string[]) => a.slice(1).map((x, i) => a[i] + '>' + x);
export interface Novelty { score: number; closest: string | null; repeats: Array<{ what: string; value: string; videos: string[] }> }
/** How different a plan is from the recent videos (1 = nothing alike), and which choices repeat. */
export function novelty(p: Plan, hist = history().slice(0, 12), skipProject = ''): Novelty {
  const f = fingerprint(p), H = hist.filter((h) => h.project !== skipProject);
  let worst = 0, closest: string | null = null;
  for (const h of H) {
    const sim = 0.18 * jac(f.sets, h.sets) + 0.14 * jac(f.lights, h.lights) + 0.14 * jac(f.looks, h.looks) + 0.06 * jac(f.skies, h.skies) + 0.1 * (f.open === h.open ? 1 : 0)
      + 0.14 * jac(f.shots, h.shots) + 0.1 * jac(runs(f.shots), runs(h.shots)) + 0.06 * jac(f.moves, h.moves) + 0.04 * jac(f.outfits, h.outfits) + 0.04 * jac(f.hairs, h.hairs);
    if (sim > worst) { worst = sim; closest = h.title || h.project; }
  }
  const repeats: Novelty['repeats'] = [];
  const check = (what: string, mine: string[], key: keyof Fingerprint, label = (v: string) => v) => {
    for (const v of new Set(mine)) { const vids = H.slice(0, 6).filter((h) => (h[key] as any as string[]).includes(v)).map((h) => h.title || h.project); if (vids.length) repeats.push({ what, value: label(v), videos: vids }); }
  };
  check('Ánh sáng', f.lights, 'lights', (v) => LIGHTS[v]?.label || v);
  check('Shader', f.looks, 'looks', (v) => LOOKS[v]?.label || v);
  check('Bối cảnh', f.sets, 'sets');
  if (f.open) { const vids = H.slice(0, 6).filter((h) => h.open === f.open).map((h) => h.title || h.project); if (vids.length) repeats.push({ what: 'Cú máy mở đầu', value: f.open.split('/').map((x, i) => (i ? MOVE_VI[x as Move] || x : shotLabel(x))).join(', '), videos: vids }); }
  return { score: Math.round((1 - worst) * 100) / 100, closest, repeats };
}
/** Fresh values nobody used in the recent videos (for the "Đổi" buttons in the review). */
export function freshPick<T extends string>(all: T[], used: string[], seed = Date.now()): T {
  const r = rng(seed >>> 0), free = all.filter((x) => !used.includes(x)), from = free.length ? free : all;
  return from[Math.floor(r() * from.length)];
}
export const usedRecently = (key: 'lights' | 'looks' | 'shots' | 'moves', n = 6) => history().slice(0, n).flatMap((h) => h[key] as string[]);

// ------------------------------------------------------------------ the AI's instructions
export function planSystem(): string {
  const H = history().slice(0, 10);
  return `Bạn là đạo diễn của 2D Studio: video dọc 1080x1920, nhân vật hoạt hình mặt phẳng tay chân nét mực trong thế giới 3D sơn mài.
Bạn viết một PLAN cho video theo mong muốn của người dùng, dưới dạng JSON. Mỗi video phải KHÁC HẲN các video trước: khác bối cảnh, ánh sáng, shader, cách mở đầu, nhịp cắt, góc máy và ngoại hình nhân vật. Đừng lặp một khuôn (ví dụ toàn cảnh rồi cận người nói xen kẽ) nếu video trước đã dùng.

Trả lời: 1-3 câu tiếng Việt nói ngắn bạn đã làm gì, rồi MỘT khối \`\`\`json chứa toàn bộ plan (không bỏ trường nào, không chú thích trong JSON).

Định dạng plan:
{ "title": "...", "logline": "một câu", "pace": 3.6 (từ/giây khi nói, 2.8-4.4), "captionWords": 1|2|3 (số từ mỗi thẻ phụ đề),
  "cast": [ { "name": "Tên", "library": "<tên nhân vật trong thư viện, hoặc bỏ>", "note": "tính cách",
     "look": { "style": ${HAIR_STYLES.join('|')}, "hair": "#hex", "hair2": "#hex", "skin": "#hex (hoặc bỏ)", "shirt": "#hex", "shirt2": "#hex (áo trong, hoặc bỏ)", "pants": "#hex",
               "outfit": ${OUTFIT_NAMES.join('|')}, "build": ${BUILD_NAMES.join('|')}, "acc": [${ACC_NAMES.join(', ')}] (0-2 món), "glasses": true|false, "R": 0.18-0.23 (cỡ đầu) } } ],
  "scenes": [ { "name": "...", "sky": day|dusk|night|rain,
     "light": ${Object.entries(LIGHTS).map(([k, v]) => `${k} (${v.label})`).join(', ')},
     "look": ${Object.entries(LOOKS).map(([k, v]) => `${k} (${v.label})`).join(', ')},
     "set": { "type": room|house|highway|floor${LIB.backgrounds.length ? '|library' : ''},
              room: "kind": ${ROOM_KINDS.join('|')}, "wall": "#hex", "floor": wood|tile|carpet, "floorColor": "#hex", "view": ${VIEWS.join('|')} (ngoài cửa sổ), "seed": số
              house: "seed": số, "siding": "#hex", "roofColor": "#hex", "doorColor": "#hex", "storeys": 1|2
              floor: "color": "#hex"${LIB.backgrounds.length ? `\n              library: "library": ${LIB.backgrounds.map((b) => `"${b.name}"`).join(', ')}` : ''} },
     "props": [ { "type": ${PROP_TYPES.join('|')}, "text": "chữ trên biển (sign/screen/counter)", "x": -2..2, "z": -2..2, "rotY": độ } ] (đồ vật thêm, gây cười hoặc kể chuyện),
     "blocking": [ { "who": "Tên", "x": -2..2 (trái/phải), "z": -1.5..1.5 (+ = gần máy), "face": độ (-90 = nhìn về máy, -135 nhìn trái-trước, -45 phải-trước) } ],
     "beats": [ { "who": "người nói hoặc null (lời dẫn / không thoại)", "line": "câu thoại", "expr": ${EXPRS.join('|')}, "arms": ${ARMS.join('|')},
                  "action": none|walk-in|walk-out|walk-to|turn, "to": [x, z] (khi walk-to),
                  "shot": ${SHOT_IDS.map((id, i) => `${id} (${SHOTS[i].name})`).join(', ')}${LIB.cameras.length ? ', ' + LIB.cameras.map((c) => `lib:${c.name}`).join(', ') : ''},
                  "on": "nhân vật máy quay vào", "with": "người thứ hai (two, ots) hoặc null",
                  "move": ${MOVES.join('|')}, "transition": cut|dissolve, "fx": ${FX_NAMES.join('|')} hoặc bỏ } ] } ] }

Quy tắc: mỗi beat là một câu (hoặc một khoảnh khắc không thoại) và một cú máy. Câu ngắn, có nhịp hài. 1-4 cảnh, 6-24 beat. Ngôn ngữ câu thoại theo yêu cầu người dùng (mặc định tiếng Việt).
Dùng đủ loại góc máy, có lý do kể chuyện; không lặp cùng một góc hai beat liền nhau trừ khi cố ý. Khuôn mặt tránh dải phụ đề ở 66-76% chiều cao khung.
${H.length ? `\nCÁC VIDEO GẦN ĐÂY (phải khác chúng):\n${H.map((h) => `- "${h.title}": bối cảnh ${h.sets.join(', ')}; ánh sáng ${h.lights.join(', ')}; shader ${h.looks.join(', ')}; mở đầu ${h.open}; góc máy ${h.shots.join(' > ')}; áo ${h.outfits.join(', ')}`).join('\n')}` : ''}`;
}
/** The prompt of one chat turn: the conversation so far, the current plan, the new message. */
export function planPrompt(chat: Array<{ role: 'user' | 'ai'; text: string }>, current: Plan | null, msg: string) {
  const past = chat.slice(-8).map((m) => `${m.role === 'user' ? 'Người dùng' : 'Bạn'}: ${m.text}`).join('\n');
  return `${past ? `Cuộc trò chuyện trước:\n${past}\n\n` : ''}${current ? `Plan hiện tại (sửa theo yêu cầu mới, giữ những gì người dùng không nhắc tới):\n\`\`\`json\n${JSON.stringify(current)}\n\`\`\`\n\n` : ''}Yêu cầu mới: ${msg}`;
}
/** The reply's words and plan. */
export function parseReply(text: string): { say: string; plan: Plan | null; error?: string } {
  const m = /```(?:json)?\s*\n?([\s\S]*?)```/i.exec(text);
  const say = text.replace(/```[\s\S]*?```/g, '').trim();
  const raw = m ? m[1] : (/\{[\s\S]*\}/.exec(text) || [''])[0];
  try { return { say, plan: cleanPlan(JSON.parse(raw)) }; } catch (e: any) { return { say, plan: null, error: e.message }; }
}

/** A plan without AI, from a script ("Tên: câu" lines), choosing everything so it differs from the recent videos. */
export function localPlan(script: string, title = 'Video mới', seed = Date.now()): Plan {
  const r = rng(seed >>> 0), pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const lines = script.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => { const m = /^([^:：]{1,30})[:：]\s*(.+)$/.exec(l); return m ? { who: m[1].trim(), line: m[2].trim() } : { who: null as string | null, line: l }; });
  const names = [...new Set(lines.map((l) => l.who).filter(Boolean) as string[])];
  const recentShots = usedRecently('shots'), lights = Object.keys(LIGHTS), looks = Object.keys(LOOKS);
  const shotPool = SHOT_IDS.filter((s) => s !== 'pov');
  let last = '';
  const beats: PlanBeat[] = lines.map((l, i) => {
    let shot = i === 0 ? freshPick(['wide', 'crane', 'reveal', 'low', 'high', 'behind', 'orbit'], usedRecently('shots', 3).slice(0, 3), seed + i) : pick(shotPool.filter((s) => s !== last && (r() < 0.5 || !recentShots.includes(s))));
    if ((shot === 'two' || shot === 'ots') && names.length < 2) shot = 'medium';
    last = shot;
    const e = /[!！]\s*$/.test(l.line) ? pick(['grin', 'shock', 'jolt']) : /[?？]\s*$/.test(l.line) ? pick(['worried', 'innocent']) : pick(['talk', 'smug', 'stern', 'calm']);
    const other = names.find((n) => n !== l.who) || null;
    return { who: l.who, line: l.line, expr: e, arms: r() < 0.3 ? pick(['point', 'shrug', 'hips', 'wave', 'cross']) : 'down', action: 'none', shot, on: l.who || names[0] || null, with: shot === 'two' || shot === 'ots' ? other : null, move: shotOf(shot)?.move || 'push', transition: r() < 0.12 ? 'dissolve' : 'cut' } as PlanBeat;
  });
  const type = pick(['room', 'room', 'house', 'floor'] as SetType[]);
  return cleanPlan({
    title, logline: '', pace: +(3.2 + r() * 0.9).toFixed(2), captionWords: pick([1, 2, 2, 3]),
    cast: names.map((n, i) => ({ name: n, look: randomLook((seed + i * 131) >>> 0) })),
    scenes: [{ name: 'Cảnh 1', sky: pick(['day', 'dusk', 'night', 'rain']), light: freshPick(lights, usedRecently('lights'), seed + 3), look: freshPick(looks, usedRecently('looks'), seed + 5),
      set: { type, kind: pick(ROOM_KINDS), wall: pick(['#e8dcc0', '#d6e6ee', '#f2e6d0', '#dfe8d6', '#f0d8d0', '#cfd2dc', '#f4d6a6', '#c9e4d6']), floor: pick(FLOORS), view: pick(VIEWS), seed: Math.floor(r() * 999) + 1, color: pick(['#d9d2c0', '#9fb39a', '#c7b8a6']) },
      props: [], blocking: [], beats }],
  });
}

// ------------------------------------------------------------------ building the scene
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const K = (t: number, v: any, ease?: string): Key => ({ t: r3(t), v, ...(ease ? { ease: ease as any } : {}) });
const hexN = (s?: string) => (s ? parseInt(s.replace('#', ''), 16) : undefined);
function setObject(s: PlanScene): { objs: SceneObject[]; stand: [number, number]; room?: { w: number; d: number; h: number } } {
  const st = s.set, id = `set_${s.id}`;
  if (st.type === 'library') {
    const bg = LIB.backgrounds.find((b) => b.name === st.library)?.data;
    if (bg) return { objs: bg.objects.map((o: SceneObject, i: number) => ({ ...JSON.parse(JSON.stringify(o)), id: `${s.id}_bg${i}`, stage: s.id })), stand: bg.stand || [0, 0] };
  }
  if (st.type === 'house') return { objs: [{ id, name: 'Ngôi nhà', kind: 'set', stage: s.id, params: { type: 'house', opts: { seed: st.seed, siding: hexN(st.siding), roofColor: hexN(st.roofColor), doorColor: hexN(st.doorColor), storeys: st.storeys } }, tracks: {} }], stand: STAND.house };
  if (st.type === 'highway') return { objs: [{ id, name: 'Đường cao tốc', kind: 'set', stage: s.id, params: { type: 'highway', opts: {} }, tracks: {} }], stand: STAND.highway };
  if (st.type === 'floor') return { objs: [{ id, name: 'Sàn', kind: 'set', stage: s.id, params: { type: 'floor', w: 40, d: 40, color: hexN(st.color) }, tracks: {} }], stand: STAND.floor };
  const kind = st.kind || 'office';
  return { objs: [{ id, name: ROOM_KIND_VI[kind] || 'Phòng', kind: 'set', stage: s.id, params: { type: 'room', opts: { kind, wall: hexN(st.wall), floor: st.floor, floorColor: hexN(st.floorColor), view: st.view, seed: st.seed } }, tracks: {} }], stand: STAND[kind] || STAND.office, room: { w: 5.2, d: 4.2, h: 3.2 } };
}
/** Inside a room the camera stays in front of the walls and under the ceiling (the open side is +z). */
function roomLimit(R: { w: number; d: number; h: number }): Limit {
  return (from, to) => {
    const dir = [to[0] - from[0], to[1] - from[1], to[2] - from[2]], len = Math.hypot(dir[0], dir[1], dir[2]); if (len < 1e-4) return null;
    let s = Infinity; const m = 0.18;
    const plane = (i: number, v: number) => { if (Math.abs(dir[i]) < 1e-6) return; const k = (v - from[i]) / dir[i]; if (k > 0 && k < 1) s = Math.min(s, k); };
    plane(0, -R.w / 2 + m); plane(0, R.w / 2 - m); plane(2, -R.d + m); plane(1, R.h - m); plane(1, 0.15);
    return s < Infinity ? s * len : null;
  };
}
/** The scene the plan describes: stages, set, props, characters with their moves and lines, a camera per beat, cuts, captions. */
export function buildFromPlan(p: Plan, name: string): SceneDoc {
  const objects: SceneObject[] = [], cuts: { t: number; camera: string; dissolve?: number }[] = [], captions: { t: number; text: string }[] = [];
  const castId = (n: string) => 'c' + (p.cast.findIndex((c) => c.name === n) + 1);
  const firstObj = new Map<string, string>();   // a person's first object: later scenes share its look
  let t = 0.3;
  for (const s of p.scenes) {
    const { objs, stand, room } = setObject(s); objects.push(...objs);
    const at = (x: number, z: number): Vec3 => [r3(stand[0] + x), 0, r3(stand[1] + z)];
    s.props.forEach((q, i) => objects.push({ id: `${s.id}_p${i}`, name: q.text ? `${q.type}: ${q.text}`.slice(0, 30) : q.type, kind: 'prop', stage: s.id, params: { type: q.type, ...(q.text ? { text: q.text } : {}) }, tracks: { pos: [K(0, at(q.x, q.z))], rotY: [K(0, q.rotY ?? 0)], ...(q.scale ? { scale: [K(0, q.scale)] } : {}) } }));
    // timing of this scene's beats
    const sceneStart = t;
    const timed = s.beats.map((b) => { const n = b.line.split(/\s+/).filter(Boolean).length, d = b.line ? Math.max(0.9, n / p.pace) : (b.action === 'none' ? 1.4 : 1.8), st = t; t += d + 0.3; return { ...b, s: st, d }; });
    // characters of the scene
    const chars = new Map<string, SceneObject>();
    for (const spot of s.blocking) {
      const c = p.cast.find((x) => x.name === spot.who); if (!c) continue;
      const lib = c.library ? LIB.characters.find((x) => x.name === c.library)?.data : null;
      const id = firstObj.has(c.name) ? `${castId(c.name)}_${s.id}` : castId(c.name);
      const params = firstObj.has(c.name) ? { same: firstObj.get(c.name) } : lib ? JSON.parse(JSON.stringify(lib.params)) : { ...c.look, acc: [...c.look.acc] };
      for (const k of Object.keys(params)) if (params[k] === undefined) delete params[k];
      const o: SceneObject = { id, name: p.scenes.length > 1 ? `${c.name} (${s.name})` : c.name, kind: 'char', stage: s.id, params, tracks: { ...(lib && !firstObj.has(c.name) ? JSON.parse(JSON.stringify(lib.tracks || {})) : {}), pos: [], rotY: [K(0, spot.face)], expr: [K(0, 'calm')], armL: [K(0, 'down')], armR: [K(0, 'down')], say: [] } };
      if (!firstObj.has(c.name)) firstObj.set(c.name, id);
      chars.set(c.name, o); objects.push(o);
    }
    // where everyone is through the scene (walks), faces, gestures, lines
    const where = new Map<string, Vec3>();
    for (const spot of s.blocking) {
      const firstAct = timed.find((b) => (b.who || b.on) === spot.who && b.action !== 'none');
      const start = firstAct?.action === 'walk-in' ? at(spot.x + (spot.x <= 0 ? -3.4 : 3.4), spot.z) : at(spot.x, spot.z);
      chars.get(spot.who)?.tracks.pos.push(K(0, start)); where.set(spot.who, start);
    }
    for (const b of timed) {
      const actor = b.who || b.on, o = actor ? chars.get(actor) : null, spot = s.blocking.find((q) => q.who === actor);
      if (o && spot && b.action !== 'none') {
        const from = where.get(actor!) || at(spot.x, spot.z);
        let to: Vec3 = from;
        if (b.action === 'walk-in') to = at(spot.x, spot.z);
        if (b.action === 'walk-out') to = [r3(from[0] + (from[0] <= stand[0] ? -3.6 : 3.6)), 0, from[2]];
        if (b.action === 'walk-to' && b.to) to = at(b.to[0], b.to[1]);
        if (b.action === 'turn') o.tracks.rotY.push(K(b.s, -90, 'smooth'));
        if (to !== from) {
          const dist = Math.hypot(to[0] - from[0], to[2] - from[2]), dur = Math.max(0.8, dist / 1.6);
          o.tracks.pos.push(K(Math.max(0, b.s - 0.1), from, 'smooth'), K(b.s - 0.1 + dur, to));
          o.tracks.rotY.push(K(Math.max(0, b.s - 0.15), to[0] > from[0] ? 0 : 180), K(b.s - 0.1 + dur + 0.1, spot.face));
          where.set(actor!, to);
        }
      }
      const sp = b.who ? chars.get(b.who) : null;
      if (sp) {
        if (b.line) sp.tracks.say.push({ t: r3(b.s), v: b.line, d: r3(b.d) });
        sp.tracks.expr.push(K(Math.max(0, b.s - 0.05), b.expr), K(b.s + b.d + 0.25, 'calm'));
        if (b.arms !== 'down') {
          const both = ['shrug', 'cross', 'hips', 'up', 'neck'].includes(b.arms);
          sp.tracks.armR.push(K(b.s, b.arms), K(b.s + b.d + 0.2, 'down'));
          if (both) sp.tracks.armL.push(K(b.s, b.arms), K(b.s + b.d + 0.2, 'down'));
        }
      }
      if (b.fx && o) {
        const burst = !!FX[b.fx]?.burst;
        objects.push({ id: `${s.id}_fx${objects.length}`, name: FX[b.fx]?.label || b.fx, kind: 'fx', stage: s.id, params: { type: b.fx, follow: o.id, at: b.fx === 'magic' || b.fx === 'hearts' ? 'chest' : 'feet' }, tracks: { pos: [K(0, [0, 0, 0])], visible: burst ? [K(0, false), K(b.s, true)] : [K(0, false), K(b.s, true), K(b.s + b.d + 0.3, false)] } });
      }
    }
    for (const o of chars.values()) { for (const k of ['pos', 'rotY', 'expr', 'armL', 'armR', 'say']) { o.tracks[k].sort((a, b) => a.t - b.t); if (!o.tracks[k].length) delete o.tracks[k]; } }
    // a camera per beat, framed on its subject, with its move (kept inside a room)
    const limit = room ? roomLimit(room) : undefined, front: Vec3 = [stand[0], 1.5, stand[1] + 6];
    timed.forEach((b, i) => {
      const t0 = Math.max(sceneStart, b.s - 0.12), t1 = i + 1 < timed.length ? Math.max(t0 + 0.3, timed[i + 1].s - 0.12) : b.s + b.d + 0.9;
      const A = (b.on && chars.get(b.on)) || (b.who && chars.get(b.who)) || [...chars.values()][0] || null;
      const B = b.with ? chars.get(b.with) || null : [...chars.values()].find((c) => c !== A) || null;
      const shot = { ...(shotOf(b.shot) || SHOTS[1]), move: b.move, ...(b.speed != null ? { speed: b.speed } : {}) };
      const id = `${s.id}_cam${i + 1}`, label = `${s.name} · ${i + 1}. ${shotLabel(b.shot)}${A ? ' · ' + (b.on || b.who) : ''}`;
      let tracks: Record<string, Key[]>;
      if (A) tracks = shotKeys(shot, A, (shot.two ? B : null), t0, t1, front, limit);
      else tracks = { pos: [K(t0, [stand[0], 1.6, stand[1] + 6], 'linear'), K(t1, [stand[0], 1.55, stand[1] + 5.4])], target: [K(t0, [stand[0], 1.0, stand[1]])], fov: [K(t0, 45)] };
      objects.push({ id, name: label.slice(0, 48), kind: 'camera', stage: s.id, params: {}, tracks });
      cuts.push({ t: r3(cuts.length ? t0 : 0), camera: id, ...(b.transition === 'dissolve' && cuts.length ? { dissolve: 9 } : {}) });
    });
    // captions for the lines
    for (const b of timed) {
      if (!b.line) continue;
      const ws = b.line.split(/\s+/).filter(Boolean), step = b.d / ws.length;
      if (p.captionWords === 2) captionsFromWords(ws.map((w, i) => ({ w, s: b.s + i * step, e: b.s + (i + 0.85) * step }))).forEach(([ct, text]: [number, string], i: number) => captions.push({ t: r3(i === 0 ? b.s : ct), text }));
      else for (let i = 0; i < ws.length; i += p.captionWords) captions.push({ t: r3(b.s + i * step), text: ws.slice(i, i + p.captionWords).join(' ') });
      captions.push({ t: r3(b.s + b.d + 0.15), text: '' });
    }
    t += 0.4;   // a breath between scenes
  }
  const duration = r3(Math.max(2, t + 0.4));
  return normalize({
    version: 1, name, fps: 60, width: 1080, height: 1920, duration,
    stages: p.scenes.map((s) => ({ id: s.id, name: s.name, mood: s.sky, lightPreset: s.light, look: s.look })),
    objects, cuts: cuts.sort((a, b) => a.t - b.t), captions: captions.sort((a, b) => a.t - b.t), audio: [],
    notes: `Plan: ${p.title}\n${p.logline}`, plan: p,
  });
}
/** Lines of the plan as a "Tên: câu" script (for the brief and the Kịch bản box). */
export const planScript = (p: Plan) => p.scenes.flatMap((s) => s.beats.filter((b) => b.line).map((b) => (b.who ? `${b.who}: ${b.line}` : b.line))).join('\n');
export const SKINS = SKIN_TONES, SHIRTS = SHIRT_COLORS, PANTS = PANTS_COLORS, HAIRS = HAIR_COLORS as string[][];
