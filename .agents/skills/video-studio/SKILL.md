---
name: video-studio
description: Base skill for making a vertical short with 2D Studio (this repo). Read it whenever another video skill (v01-v30) is used, or when the user asks to make, plan or fix a video in 2D Studio. Explains how to write a plan the studio shows for review, the measured house style (pacing, shots, captions, voice-over, sets, light), and how to add new sets and props as code.
---

# 2D Studio: making a short from a skill

The user works in **2D Studio** (this folder; `npm start` -> http://localhost:5200). You do not render video yourself.
You write a **plan**; the studio shows every parameter of it for review (tab *Kịch bản*), the user edits and approves,
then the studio builds the scene and exports the MP4. Every recipe skill (`v01-…` to `v30-…`) tells you WHAT to make;
this skill tells you HOW.

## Steps (always)
1. Read the recipe skill the user named, and this file. If the user gave no skill, read `video-menu` and pick one.
2. Read `skill/SKILL.md` (scene format) only if you need code sets/props or to edit a built scene.
3. Check what exists: `Library/code/*.js` (sets and props made from code), `Library/characters/*.json`,
   `Library/plans/*.json` (fingerprints of past videos: do NOT repeat their set + light + shader + opening shot).
4. Write the script first (in the user's language; default Vietnamese), following the recipe's beat structure and
   timing. Original words only: never copy lines from the reference channel.
5. If the story needs a place or object the studio lacks (a spaceship, a prison cell, a bank vault, a casino), write it
   as code: `Library/code/<Name>.js` (see "New sets and props"). Keep it simple, readable, lacquered-toy look.
6. Write the plan to `Projects/<Project name>/scene.json` as `{ "version": 1, "name": "<Project name>", "plan": { … } }`
   (create the folder). Nothing else is needed: the studio opens it on the review.
7. Tell the user: open the project in 2D Studio, review on the right, press **Dựng** to preview or **Duyệt và xuất
   video** to render. Mention anything you could not do.

## The plan (exact format, everything optional has a default)
```jsonc
{
  "title": "…", "logline": "one sentence", "skill": "v07-…",          // the recipe used (for variety tracking)
  "pace": 3.6,              // spoken words per second (2.8–4.4). House style: see "Measured style".
  "captionWords": 1,        // words per caption card: 1 | 2 | 3
  "voice": "Warm, slightly amused male storyteller, mid-30s, quick and clear",   // the narrator (voice-over)
  "cast": [ { "name": "…", "note": "role / personality",
              "look": { "style": "mess|bowl|side|spiky|curly|afro|bun|ponytail|long|flattop|buzz|bald", "hair": "#hex", "hair2": "#hex",
                        "skin": "#hex", "shirt": "#hex", "shirt2": "#hex", "pants": "#hex",
                        "outfit": "plain|tee|polo|shirt|suit|uniform|hoodie|jacket|vest|stripes|plaid|overalls|apron|sweater|cardigan|hivis|tracksuit|labcoat|dress",
                        "build": "average|slim|tall|short|stout|big|kid", "acc": ["cap|beanie|ranger|sunglasses|shadesUp|headset|mustache|beard|bandage|blush|neckbrace"], "glasses": false } } ],
  "scenes": [ {
      "name": "…", "sky": "day|dusk|night|rain",
      "light": "noon|morning|golden|moon|overcast|homeWarm|office|studio|neon|fire|horror|alarm",
      "look": "ink|noink|oil|film|pastel|vivid|bw|teal|glow|sketch",
      "set": { "type": "room", "kind": "office|kitchen|living|shop|empty", "wall": "#hex", "floor": "wood|tile|carpet", "floorColor": "#hex", "view": "skyline|skylineNight|trees|street", "seed": 3 }
          // or { "type": "house", "seed", "siding", "roofColor", "doorColor", "storeys": 1|2 } | { "type": "highway" } | { "type": "floor", "color" }
          // or { "type": "code", "code": "<Library/code file name>", "opts": { "stand": [x, z] } }   <- any place you wrote as code
      "props": [ { "type": "sign|deskPlate|counter|screen|paper|panel|desk|table|chair|shelf|cabinet|plant|deskPhone|laptop|frame|cashPile|hospitalBed|mailbox|bin|bush|tree|fence|streetLamp|cone|parcel|duck|camBox"
                   /* or "code:<Library/code prop name>" */, "text": "WORDS ON IT", "x": 0, "z": -1, "rotY": 0 } ],
      "blocking": [ { "who": "Name", "x": 0, "z": 0, "face": -90 } ],   // metres from the set's standing spot; -90 = faces camera
      "beats": [ {
          "who": null,               // null = the narrator says the line (voice-over); a cast name = that character speaks (lip-sync)
          "line": "…",               // one sentence or a clause; "" for a silent moment
          "expr": "calm|smug|grit|grin|jolt|shock|dazed|flat|pain|innocent|stern|worried|talk",
          "arms": "down|hips|wave|up|point|neck|phone|cross|shrug",
          "action": "none|walk-in|walk-out|walk-to|turn", "to": [x, z],
          "shot": "wide|medium|close|xclose|threequarter|side|low|high|dutch|behind|two|ots|pov|orbit|reveal|crane|handheld|follow",
          "on": "Name", "with": "Name",   // who the camera frames (and the second person for two / ots)
          "move": "none|push|pull|orbit|crane|drop|truck|shake|reveal",
          "transition": "cut|dissolve",
          "fx": "smoke|steam|fire|sparks|magic|rain|snow|confetti|hearts|bubbles|explosion|dust|impact|splash|pop|flash" } ] } ]
}
```
Choosing shots well (the studio cannot fix these for you):
- `pov` and `behind` look where the character looks: use them when the character faces INTO the set (e.g. `face` 90 or
  180, toward the back wall / the thing they look at), not when they face the camera. Inside a set the studio swaps them
  for a close-up / over-the-shoulder when they would look out at nothing.
- Keep signs, lamps, trees and other tall props away from the line between the camera and the subject (props at the
  sides or behind the actors: `x` beyond ±1.4, or `z` below -1).
- `walk-in` / `walk-out`: inside a room or code set people enter and leave through the open front (toward the camera);
  outside they walk in from the side. The camera waits on the spot they walk to.
- After building, open the review frames (Dựng cảnh) and swap any shot that does not read: change its `shot` in the
  plan and press Dựng again.

Rules the studio enforces: people stand ≥ 0.9 m apart; big props (tree, bush, lamp, shelf, fence, cabinet, counter)
stay behind the actors; each beat = one camera shot; the beat lasts as long as its line at `pace` (silent beats 1.4 s).
The narrator's lines get a voice in *Xuất video > Giọng đọc* (ElevenLabs or Breeze) like the characters'.

## Measured style (from 30 reference shorts)
<!-- MEASURED -->
Measured on 30 reference shorts (medians; per-recipe numbers are in each recipe):
- **Length 60.6 s**, 220 words, **3.7 words/s** (plan `pace`), sentences ~14.5 words.
  The voice starts at 0.0 s (no intro, no title card) and ends ~0.3 s before the video ends.
- **Narrator** says 96% of the words; characters say short lines. Hook in the first 4.1 s.
- **Shots: 27 per video, median 2 s** (the picture changes every ~2 s; nothing holds over ~5.5 s).
  In the plan: one beat per shot, so 27 beats for ~60.6 s; split a long narrated sentence over 2–3 beats.
- **Framing mix:** medium 41%, wide 26%, close 8%, insert-object 7%, extreme-close 5%, medium-close 5%, extreme-wide 4%, pov 2%, ots 1%, over-shoulder 0%.
- **Camera moves:** static 36%, push-in 30%, pull-out 9%, truck 9%, tilt 3%, crane-up 3%, crane-down 3%, pan 2%, follow 2%, zoom 1%, orbit 1%, shake 1%.
- **Transitions:** cut 66%, dissolve 14%, none 9%, fly-through 5%, zoom-through 3%, whip 3%, match-cut 1%, wipe 0%. Fly-through / zoom-through → `"transition": "dissolve"` + a push or reveal move.
- **Places per video: 7** (many short visits, interiors and exteriors mixed, one "inside view" or cutaway that explains the mechanism).
- **Characters:** 3–5 named, each a distinct colour silhouette; few extras. Faces act every beat (smug, shock, sweat, side-eye); arms point / shrug on key words.
- **Text on screen** in almost every video: screens, signs, badges in CAPITALS state the rule, the number, the alarm.
- **Captions:** 1 word per card, bold white with a thin black outline, ~70% down the frame (plan `"captionWords": 1`).
- **Light** (studio presets chosen per place): noon 28%, moon 16%, homeWarm 14%, golden 10%, office 9%, studio 7%, morning 6%, fire 4%, horror 2%, overcast 2%, neon 2%, alarm 1%. **Shader:** ink 100%. Each video mixes 2–4 lighting moods
  (a bright place against a dark or night one).
- **Formats:** Giải thích "Vì sao…" 5, Khoa học đằng sau 5, Mánh lừa 5, Cách nó từng hoạt động 3, Thí nghiệm 2, Chuyện có thật 2, Lách luật 2, paradox twist story 1, twist fable 1, what if world 1, Nghề ít ai biết 1, Các cấp độ 1, Đối đầu 1.

### Keep the rhythm, change the surface
The references all use the `ink` shader and similar toy-like worlds. The user wants every video to look different, so:
keep what makes the format work (hook in 4 s, a shot every ~2 s, 7-ish places, voice-over, 1-word captions, text on
screen, faces acting) and **change the surface every time**: pick the shader among `ink`, `vivid`, `pastel`, `teal`,
`film`, `glow`, `sketch` (not the one the last videos used), a different light per place, a new palette, new places and
new cast looks. The studio's review shows a "difference from past videos" score; aim for 70% or more.

## New sets and props as code
`Library/code/<Name>.js` (the file name is the name you use in the plan):
```js
// name: Space station toilet
// kind: set            (set = a whole place; prop = one object)
export default function build({ THREE, box, flat, paint, labelTex, rng, P, M }, opts) {
  const g = new THREE.Group();
  // metres; y = 0 is the floor; the set is open toward +z (the camera side); people stand around z -0.5…-2
  g.add(box(5.2, 0.1, 4.2, flat(0xf2f2f2), 0, -0.05, -1.5));        // floor (box(w, h, d, material, x, y, z))
  g.add(box(5.2, 3.0, 0.12, flat(0x2a3550), 0, 1.5, -3.6));         // back wall
  // … furniture from P (P.desk(), P.chair(), P.shelf(), P.screen({lines:['GO']}) …) or boxes and cylinders
  return g;
}
```
Toy-like proportions (furniture ~0.7 of real size, a character ~1.2 m), saturated flat colours, a few readable signs
(`labelTex(['NO FLUSHING','TONIGHT'], { bg: '#d9342b', fg: '#fff' })` on a plane) do most of the storytelling.
Check it: open the project, press Dựng, look at the frame; fix and save, the studio reloads.

## After building (optional polish, only if the user asks)
Edit `Projects/<name>/scene.json` objects/keys following `skill/SKILL.md` (targeted edits, keep ids). Do not
regenerate the file once the user has started editing it in the studio.
