---
name: 2d-studio
description: Make or fix a video in 2D Studio (the local studio in this folder). Writes the video as a scene document (Projects/<name>/scene.json) of objects and keyframes, never as code, so every character, prop, camera and caption stays editable on the studio's timeline. Use for a new video from an idea, a clone of a reference video, or a targeted fix ("make Dan wave at 2 s", "the boss should look angry earlier").
---

# 2D Studio

The studio (`npm start`, http://localhost:5200) shows, edits and renders `Projects/<name>/scene.json`. It reloads the
file by itself when you save it, and the user can undo your change with Ctrl+Z. **The scene file is the whole video.**
Do not write `video.js` or any per-video code: if something can't be said in the scene format, say so and ask.

The look and the engine are the 3d-video-studio skill's (`vendor/3d-video-studio`, engine copied to `engine/`):
flat-face cartoon characters with ink limbs in a lacquered 3D world, 1080x1920, 30 fps, 1–2 word captions.
For story craft (topic, hook, beats, script pace 3.8 words/s, camera rules, faces changing 0–3 frames before their
word) read `vendor/3d-video-studio/SKILL.md` and `vendor/3d-video-studio/story/*.md`: same rules, but the output is
scene.json.

## Golden rules
1. **Targeted edits.** When fixing, change only the objects/keys asked about. Never regenerate the file. Keep ids.
2. **Everything is keys.** Motion, faces, arms, lines, text on signs, cuts and captions are all time-keyed data.
3. **Keep it editable.** Few, meaningful keys (a human will drag them). Prefer presets (arms, expressions) over joint
   offsets; use joint offsets (`j.*`) for the one gesture a preset can't do.
4. **Check before you hand over.** In the studio tab: `studio.errors()` must be `[]`; look at frames with
   `studio.frame(t)` (data URL) at each cut and each key moment.
5. **Gates as in the original skill**: show the script / storyboard to the user before building, show a few frames
   before rendering.

## scene.json

```jsonc
{
  "version": 1, "name": "My video", "fps": 30, "width": 1080, "height": 1920, "duration": 6,
  "stages": [{ "id": "office", "name": "Office", "mood": "day", "lightPreset": "homeWarm", "look": "film" }],   // mood: day | dusk | night | rain (the sky); lighting and shader: see "Lighting and picture style"
  "objects": [ ...SceneObject ],
  "cuts": [{ "t": 0, "camera": "cam1" }, { "t": 2.0, "camera": "cam2", "dissolve": 9 }],   // dissolve: frames (5–18)
  "captions": [{ "t": 0.6, "text": "Boss," }, { "t": 1.75, "text": "" }],                 // "" clears; 1–3 words a card (a longer card shrinks to fit the width)
  "audio": [{ "id": "vo", "file": "audio/vo.wav", "start": 0, "gain": 0 }],               // files in Projects/<name>/audio/; a cut clip adds "offset" (s skipped in the file) and "dur" (s used)
  "notes": "free text"
}
```

A **stage** is a world of its own (mood, sky, its own sets). Every object belongs to one stage; a camera films its stage.

**One person in several stages = one look.** A character who appears in two stages (Act 1 street, Act 3 yard) needs
one object per stage. Give the look (build params) to the FIRST one only; every other one gets
`"params": { "same": "<first id>" }` (plus its own `side` / `autoWalk` / `stride` / `breath` if needed) and no
`hair.*` `face.*` `eye.*` `brow.*` `mouth.*` `acc.*` tracks: look, part fixes and voice come from the first. Never
write two different looks for one person. The studio warns on opening a project where same-named characters
differ, and Sửa > Đồng bộ ngoại hình nhân vật trùng tên links them (the first object's look wins).

### SceneObject
```jsonc
{ "id": "dan", "name": "Dan", "kind": "char", "stage": "office", "parent": "car1",   // parent optional
  "params": { ... how it is built ... },
  "tracks": { "pos": [[0, [2.3, 0, -1.3]], [1.4, [0.9, 0, -1.3], "smooth"]], "expr": [[0, "smug"], [3, "shock"]] },
  "hidden": false, "locked": false }
```
Track keys are `[t, value]` or `[t, value, ease]` (the studio saves them as `{ "t", "v", "ease" }`; both are read).
`ease` shapes the segment that LEAVES the key: `auto` (smooth curve through keys, default), `smooth` (ease in/out),
`linear`, `step` (hold). Text / choice / on-off tracks always hold until the next key. One key = a constant.

Units are metres. y is up. Characters are about 1.2 m tall. A character faces +x of its own space; `rotY` turns it
(degrees): **-90 faces the camera side (+z)**, -135 faces left-front, -45 right-front, 180 faces -x.

### Kinds, params and tracks

| kind | params (build) | tracks |
|---|---|---|
| `char` | makeChar options (no role presets: choose every part freely): `skin` "#hex" (default cream white), `head` {hw 0.78–1.06 face width, egg −0.24–0.02 chin}, `R` (head radius 0.18–0.22), `shirt` "#hex", `shirt2`, `pants`, `hair` "#hex", `hair2`, `style` (mess bowl side spiky curly afro bun ponytail long flattop buzz bald), `build` (average slim tall short stout big kid), `outfit` (plain tee polo shirt suit uniform hoodie jacket vest stripes plaid overalls apron sweater cardigan hivis tracksuit labcoat dress), `acc` [sunglasses shadesUp cap ranger beanie headset mustache beard bandage blush neckbrace], `glasses` true, `side` (-1 driver / 1 passenger when in a car) | `pos` [x,y,z], `rotY`, `scale`, `visible`, `pose` (stand / sitOn / drive), `armL` `armR` (down hips wave up point neck phone cross shrug; a change of arm preset or of `pose` eases over 0.32 s), `lean` (radians, + forward), `walk` (steps per second for walking on the spot; usually leave it out: a character whose `pos` moves walks by itself, feet planted, stride from the distance, in any direction; `params.autoWalk: false` slides instead, `params.stride` step length, default 0.27 at R 0.2; `params.breath: false` stops the idle breathing), `seat` (height for sitOn), `look` [x,y,z] (where the face looks, character space, [1,0,0] = forward), `expr` (calm smug grit grin jolt shock dazed flat pain innocent stern worried talk), `say` (a line spoken from the key's time: lip-sync at 3.8 words/s), `j.hip` `j.neck` `j.elbowL` `j.handL` `j.elbowR` `j.handR` `j.kneeL` `j.footL` `j.kneeR` `j.footR` (offsets in metres added to the preset pose; hip carries the upper body, neck carries the arms) |
| `char` parts (fix a broken detail, e.g. the hair) | `hairOpts` {cowlick, strands (false = none), behind (false = no bun/ponytail/back hair), hidden} | numbers, 0 / 1 = untouched, in head radii: `hair.x` `hair.y` (move the hair), `hair.size`, `hair.vol` (puff, added to the style's), `hair.fringe` (+ = fringe higher), `hair.side` (sideburn length), `hair.part`; `face.x` `face.y`, `eye.size` `eye.gap` `eye.y`, `brow.y`, `mouth.y` `mouth.size`; `acc.x` `acc.y` `acc.size` (hats, glasses on the head) |
| `car` | buildCar look: `type` (coupe sedan hatch wagon sports suv van pickup), `color` "#hex", `interior` (modern / old / false), `plate`, `skin` {wood, stripe, rack, rust, bow} | `pos`, `rotY` (car faces +x), `scale`, `visible`, `brake` (lights), `dive` (body tilt °). Wheels roll from the movement. A driver: a `char` with `"parent": "<car id>"` and `pose` "drive". |
| `prop` | `type`: sign deskPlate counter screen desk table chair shelf cabinet plant deskPhone laptop frame cashPile hospitalBed mailbox bin bush tree fence streetLamp cone parcel duck camBox sofa fridge counterUnit tv rug; `text` (sign / deskPlate / counter), `opts` {...engine options, e.g. sign: w h bg fg post} | `pos`, `rotY`, `scale`, `visible`, `text` (sign/screen/counter text over time, `|` = new line), `grow` (cashPile 0..1) |
| `set` | `type`: room (`opts.kind` office kitchen living shop empty, `seed`, `plate`, `view`, `w` `d` `h`), house (`opts.seed`, …), highway, floor | `pos`, `rotY`, `visible` |
| `lamp` | `color`, `range`, `glow` | `pos`, `visible`, `intensity` |
| `fx` (VFX) | `type`: smoke steam fire sparks magic rain snow confetti hearts bubbles (looping) / explosion dust impact splash pop flash (one-shot), or `code` with `code` = a file in Library/vfx; `follow` (a char id) + `at` (feet hips chest head leftHand rightHand); `color`, `size`, `seed`; code VFX: `loop`, `dur` | `pos` (offset from the followed spot, +z = where the character faces), `rotY`, `scale`, `visible` (one-shot and code effects START when it turns on: key false then true), `amount` (0 = off), `speed` |
| `camera` | `near` | `pos`, `target` (look-at point), `fov` (vertical °, 30–60), `roll` (°), `dof` (lens blur px, 0 off; 8–14 on close-ups) |

**Clips (the timeline).** An object's clips on the timeline are where its `visible` track is on (no track = one clip
over the whole video); two `true` keys in a row are a split. Users cut, trim and move clips like in CapCut, and moving
a clip moves the keys inside it.

**Pieces of a set.** Every set is made of pieces (room: Sàn, Tường sau, Tường trái/phải, Trần, Cảnh ngoài cửa sổ,
Khung cửa sổ, Bàn làm việc, Ghế, Laptop, Tủ, Cây cảnh, Khung ảnh 1–3...; their order is the build order). Edits per
piece, for the whole video: `params.parts: { "<index>": { "pos": [dx, dy, dz], "rotY": deg, "scale": 1.2, "color": "#hex", "hidden": true } }`.
Things standing on a piece (a laptop on the desk) are pieces of their own: move them together.

Room layout (`addRoom`): open toward +z, back wall at z = −4.2 (default d), walls at x = ±2.6, office desk around
z −2.3, standing room in front z −0.5 … −1.8. House: front faces +z at z 0, street at z 7–14. Highway: lanes at
z −5.55 −1.85 1.85 5.55, along x.

### Cameras and the edit
- Shot library (Camera tab, `src/cameraShots.ts`): built-in shots (wide, medium, talker close-up, extreme close-up,
  3/4, side, low, high, dutch, from behind, two-shot, over-the-shoulder, POV, orbit, pull-back reveal, crane,
  handheld, walking follow) placed relative to a character from the playhead to the next cut, with the move. Shots
  you save are in `Library/cameras/<name>.json`: `{ name, frame (head width share), az (deg from the face),
  h (eye heights above eye level), aim (look-at in eye heights), side, fov, roll, dof, move, speed }`. Moves: none push
  pull orbit crane drop truck shake reveal. The camera stays in front of the set's walls (it comes closer and widens).- Every shot is a camera object plus a cut. Big reframes are cuts; within a shot keep the camera creeping (a 6–10 %/s
  push-in: move `pos` toward `target` a little between the first and last key of the shot).
- Heads: talker close-ups head width 35–65 % of the frame (distance ≈ 1.5–2.5 m at fov 34); two-shots 15–35 %.
- Keep faces out of the caption band (66–76 % down the frame).

## Lighting and picture style (per stage, Scene tab with nothing selected)
- `lightPreset`: noon morning golden moon overcast homeWarm office studio neon fire horror alarm (sets `mood` too).
- `light`: your adjustments on top: `sun` ["#hex", strength 0-6], `sunAz` `sunEl` (degrees), `hemi` [sky "#hex",
  ground "#hex", ambient 0-3], `exposure`, `charTint` [r,g,b], `fog` ["#hex", near, far], `env`.
- `look`: ink noink oil film pastel vivid bw teal glow sketch.
- `paint`: shader adjustments on top: `ink` (outline 0-1.6), `inkWidth` [near, far], `inkColor`, `sat`, `contrast`,
  `bright`, `bloom`, `ao`, `grain`, `vignette` [amount, start], `radius` (oil brush 0-4), `tintShadow` `tintHigh` [r,g,b].
- VFX code: `Library/vfx/<name>.js`, Rigging Studio's contract (src/vfxCode.ts `VFX_CONTRACT`): header lines `// name:`, `// at:`, `// dur:`, then a function body given `THREE` and `fx` (random, hash, fade, dot, ring, duration, seed) ending `return { object, update }`; `update(t)` from t alone. Make one in Thư viện -> Tạo VFX mới (describe it, Tạo bằng AI).
- Saved combinations: `Library/looks/<name>.json` `{ name, mood, lightPreset, light, look, paint }`.
- Coloured lamps (`lamp` with `color`, keyframed `intensity` for flicker) add local light.

## The library (Library/, shared by every project)
- `Library/characters/<name>.json`: `{ "name", "params": {makeChar options}, "tracks": {part fixes as constants, e.g. "hair.vol": [{"t":0,"v":0.1}]} }`.
  Use one in a scene by copying `params` (and `tracks`) into a `char` object.
- `Library/backgrounds/<name>.json`: `{ "name", "mood", "stand": [x, z] (where people stand), "objects": [set / prop / lamp objects, constant tracks] }`.
- `Library/code/<name>.js`: an object made from code. Header lines `// name: Shown name` and `// kind: prop` (or `set`),
  then `export default function build(lib, opts) { ...; return group; }`. No imports: `lib` has `THREE`, `box(w,h,d,mat,x,y,z,round?)`
  (always pass x y z), `flat(color, rough)`, `paint(color)`, `labelTex(lines, {bg, fg, border:false})`, `canvas`, `ctex`,
  `rng`, `M` (chrome, glass, dark…), `P` (the prop library), `scenery`. Metres, standing on y = 0, front toward +z,
  centred on x = 0 (a character is ~1.2 m; furniture ~0.7 of real size). A set opens toward +z with standing room at
  z −0.5…−2. In a scene: `{"kind": "prop" | "set", "params": {"type": "code", "code": "<file name without .js>", "opts": {}}}`.
  In the studio, "Tạo mới bằng code" -> describe it -> "Tạo bằng AI" asks Claude (API key in ~/.2d-studio/ai.json or ANTHROPIC_API_KEY,
  else the signed-in Claude Code CLI), tries the code and sends errors back up to twice.
  The studio reloads the library when a file there changes, so "make me a X" = write `Library/code/X.js`, then check
  it with `studio.snapshot` after placing it.

## Briefs from "✨ Video mới"
The studio's new-video form writes `Projects/<name>/brief.md` (idea, script with speakers, chosen library characters
or roles, background, voice file and length) and an automatic draft in scene.json (same ids: characters `c_1…`,
cameras `wide`, `close_1…`). When asked to "dựng lại / làm đẹp" from a brief: keep the character ids, their `say`
lines and timings (they match the voice), and the captions; rework cameras, cuts, actions, faces, props and gags.

## Workflows
**From an idea.** Topic → script (gate) → cast + sets → storyboard of shots (gate) → write scene.json → check frames
(`studio.frame(t)`) → tell the user to review in the studio → they fix by hand or ask you → Render Video.

**Clone a reference video.** Get the reference into `Projects/<name>/ref/` (frames every 0.5 s: `node_modules/ffmpeg-static/ffmpeg.exe -i ref.mp4 -vf fps=2,scale=270:-1,tile=6x4 ref/sheet-%02d.png`). Read the
sheets: shot list (start, end, framing, who, action, faces), captions and their times. Rebuild the same beats as
cameras + cuts + keys (in your own words for the script). Audio of the reference can go in `audio` for timing.

**Fix.** Read scene.json, find the object by `name`, change the few keys, save. Say exactly what you changed.

## Render
The user presses **Render Video** (or File > Render video + layers). Or: `node scripts/render.mjs "<name>" [--layers]`
with the studio running. Out: `Exports/<name>/<name>.mp4`; with layers, `Exports/<name>/layers/`: `00_background.mp4`,
one ProRes 4444 `.mov` with alpha per character / car / prop, `99_captions.mov`, `manifest.json`.

**Plans (Kịch bản > Chat với AI).** The user chats with the AI (OpenAI / Anthropic / Claude Code, scripts/ai.ts); it
returns a production plan (`src/plan.ts`: cast looks, scenes with set + options, sky, `light` preset, `look` shader,
props, blocking, and beats: who, line, expr, arms, action, shot id, on, with, move, transition, fx). The user edits
every field in the review, then "Dựng" builds it (`buildFromPlan`: a stage per scene, a camera per beat, cuts,
captions) or "Duyệt và xuất video" builds and renders. The plan is kept in scene.json (`plan`, `chat`) and
`Projects/<name>/plan.json`; its fingerprint goes to `Library/plans/<name>.json`, and the next plans are told to
differ from the recent ones (sets, lighting, shader, opening shot, shot order, looks). When you make a video by hand,
also vary these: never reuse the last videos' combination.

**Voices: ElevenLabs or Breeze TTS 2.** The engine is chosen per machine (Xuất video > Giọng đọc, or a character's Mặt
tab), saved in `~/.2d-studio/tts.json` with the ElevenLabs key (never in the project). ElevenLabs: `params.voice.eleven`
= a voice id of the account (none = one picked per character), `speed` 0.7–1.2; models eleven_flash_v2_5 / v3 / v4
(all speak Vietnamese).

**Voices (Breeze TTS 2).** A character's lines (`say` keys) can be spoken by Breeze TTS 2, which runs as its own server
(Linux + NVIDIA GPU 12 GB+: `python -m breeze_infer.api BreezeBlue/breeze-tts-2 --host 0.0.0.0 --port 7860`); the
studio only stores its address (`~/.2d-studio/tts.json` or `BREEZE_TTS_URL`). Voice per character in
`params.voice`: `{ instruction: "English description of the voice", ref: "audio/x.wav", refText: "exact words in ref",
seed, cfg }` (no voice = a default description and a seed from the id). Making voices (Mặt tab, or "Tạo giọng ... trước
khi xuất" in Xuất video) writes `audio/tts/<hash>.wav`, adds `audio` clips `{ id: "tts_<char>_<ms>", tts: "<char id>" }`
at each line's time (replacing that character's old ones) and sets each key's `d` to the speech length (lip-sync).
Same words + same voice = cached, no new request. English and Chinese only; self-hosted output is research /
non-commercial only (BreezeBlue license) — say so if the user asks about publishing.

**Performance log.** Xem > Nhật ký hiệu năng: one session per studio page load (preview fps, frame times p50/p90/p99,
slow and janky frames, CPU per frame, preview level, long tasks, memory, machine) and every render (render fps,
ms/frame, x realtime), in `Logs/perf/` (per machine, not in git), with CSV / JSON downloads. Dashboard page:
http://localhost:5200/perf.html (totals, trend per session, filters by time / machine / project, refreshes itself).

## Driving the open studio (built-in browser at http://localhost:5200)
`studio.open(name)`, `studio.doc`, `studio.seek(t)`, `studio.select(id)`, `studio.key(id, prop, t, value)`,
`studio.value(id, prop, t)`, `studio.setDoc(doc)`, `studio.save()`, `studio.frame(t)`, `studio.errors()`,
`await studio.snapshot(t, 'name')` → saves `Exports/<project>/snapshots/name.jpg` (open it with Read to look at a frame).

The user works in a Vietnamese UI with workspace tabs in workflow order: Thư viện (character creator with live
preview, saved backgrounds, code objects) → Kịch bản (from an idea, or clone a reference video: link or file →
`Projects/<name>/ref/` with ref.mp4, sheet-NN.png, thumbs/, audio.wav, ref.json = cuts + lines with times; then cast,
background, build the draft) → Dựng cảnh (tools Chọn Q / Di chuyển W / Xoay E / Tạo dáng R; right panel part tabs Vị trí, Dáng &
tay, Mặt, Tóc, Quần áo, Phụ kiện; "Toàn cảnh" = the stage from outside with every camera, paths and a small video
picture; timeline like CapCut: blocks, Ctrl/Cmd+B split, Q / W delete left / right of the playhead) → Camera (look through a camera, edit it, list of cuts) → Thư viện (shared
characters, backgrounds, code objects; code editor) → Xuất video (MP4, layers, past exports). A switch "Cả video" /
"Từ … (keyframe)" decides whether a change is for the whole video or a key at the playhead. Answer in Vietnamese
using those names. The UI uses no icons or emoji; keep it that way.
