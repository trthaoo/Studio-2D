---
name: v20-slow-squeeze-con
description: "2D Studio video recipe 20 — con-trick: A stranger commits a bizarre, tiny, repeated act that seems pointless; it slowly escalates until the victims break and give up something valuable, and the final line reveals the stranger engineered it to get that exact thing cheaply. Use when the user types /v20-slow-squeeze-con, says 'skill v20', or wants a short about: Cons where tiny repeated nuisances force a cheap sale or surrender: a neighbour who nudges a fence a little each week to claim land, a landlord who adds one small noise nightly until tenants leave, a rival who swaps one ingredient at a time to ruin a bakery, a trader who leaks a rumour drip by drip to crash a price, a fake ghost haunting to buy an inn cheaply. Always read video-studio first."
---

# v20-slow-squeeze-con · Mánh lừa

Recipe measured frame by frame from reference short #20 (58.4 s, 24 shots, 9 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** A stranger commits a bizarre, tiny, repeated act that seems pointless; it slowly escalates until the victims break and give up something valuable, and the final line reveals the stranger engineered it to get that exact thing cheaply
- **Fits topics like:** Cons where tiny repeated nuisances force a cheap sale or surrender: a neighbour who nudges a fence a little each week to claim land, a landlord who adds one small noise nightly until tenants leave, a rival who swaps one ingredient at a time to ruin a bakery, a trader who leaks a rumour drip by drip to crash a price, a fake ghost haunting to buy an inn cheaply
- **Signature moves (keep these):**
  - Hook states a bizarre micro-crime with a precise unit (one inch) shown on a ruler insert
  - Time ladder escalation: first night, end of week, end of month, each with a bigger visual consequence
  - Authority mocks the complaint in one incredulous line, seen leaving through a peephole
  - Top-down time-lapse of furniture creeping and a hero waking up moved with it
  - Sale scene where the buyer is the culprit, then a photo flashback to the kept key

## Script
- **Length:** about 58.4 s (scale to what the user asks), ~237 words at **4.06 words/s** → plan `"pace": 4.1`; sentences ~16.9 words.
- **Voice:** third-person; tone: creepy-comic slow-burn mystery with a dry punchline reveal. Narrator says 96% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 5.2 s, bizarre-act):** A man [broke in] every night and did [something tiny and pointless] to [everything].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–9% | Intruder sneaks in nightly and shifts every object a single inch |
| setup | 9–15% | First night nobody notices because nobody measures furniture |
| escalation | 15–23% | After a week the fridge blocks the back door and dad doubts his sanity |
| dismissal | 24–40% | Police officer mocks the idea of a furniture-moving burglar and leaves laughing |
| escalation | 40–52% | Locks do nothing; things keep creeping until the bed hits the wall |
| horror | 52–59% | Daughter hears something sliding across the floor in the small hours |
| climax | 60–74% | Dad stakes out the couch with a bat, wakes up still on it, moved one inch |
| break | 74–87% | Couch halfway across the room, family gives up and sells at half price to the culprit |
| reveal | 87–100% | He had sold them the house and kept a key, so a month of sliding bought it back cheap |

- **Ending (reveal-punchline):** He had [prior connection] and kept [one small advantage], so [small repeated act] was all it took to get [the prize] back at a discount.
- **Devices:** officer's incredulous one-line recap of the crime; fridge with a DON'T MOVE note blocking the door; dad wakes up moved along with the couch; cat as the only witness; buyer is obviously the burglar behind a fake beard; precise measure repeated (one inch); time ladder (first night, end of the week, end of the month); rhetorical question (who measures their couch); you see explanation pivot; short punchline sentence (the buyer is him)

## Camera (one plan beat = one shot)
- **24 shots, median 1.5 s, longest 6.5 s.** Split long narration into several beats of ~1.5 s so the picture changes that often.
- **Framing:** medium 42%, medium-close 17%, wide 17%, insert-object 8%, close 8%, pov 4%, extreme-close 4%
- **Moves:** static 46%, push-in 29%, tilt 13%, follow 4%, orbit 4%, pull-out 4%
- **Transitions:** cut 58%, dissolve 29%, none 4%, fly-through 4%, zoom-through 4%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, follow, on burglar in balaclava climbs the AC unit to the window.
- **Shot rhythm in studio ids** (a guide, not a must): follow › reveal › low › xclose › medium › low › wide › low › low › pov › two › high › medium › low › medium › xclose › orbit › medium › two › close › xclose › medium › close › reveal

## Places (9)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: blue clapboard house wall, window, AC unit, bush, pumpkin, stepping stones on grass. Light: blue moonlight with a cool spot from the right → `"light": "moon"`. Palette #1E2A8C #3E7AD9 #2E7A3A. Key props: AC unit, window, pumpkin.
   Studio: { "type": "house" }
2. **Interior**: same living room in darkness: red armchair and couch, floor lamp, window to the street, wall pictures. Light: dark blue with a warm torch-like pool → `"light": "moon"`. Palette #1E2A9C #C8302B #F2C25A. Key props: armchair, couch, floor lamp, ruler.
   Studio: { "type": "room", "kind": "living" } (recolour walls / floor to fit)
3. **Interior**: cream wallpaper with framed pictures, yellow curtains, red couch, side table lamp, plant, shag rug, window to suburban street. Light: bright warm daylight → `"light": "noon"`. Palette #F2E6D0 #C8302B #F2B705. Key props: couch, rug dents, boxes, cat.
   Studio: { "type": "room", "kind": "living" } (recolour walls / floor to fit)
4. **Interior**: yellow walls, teal cabinets, teal and white checker floor, retro blue fridge, red wall phone, back door. Light: bright cheerful daylight, pendant lamp → `"light": "morning"`. Palette #F2C230 #1FA0A8 #F4F4F4. Key props: fridge, DON'T MOVE note, wall phone, coffee mug.
   Studio: { "type": "room", "kind": "kitchen" } (recolour walls / floor to fit)
5. **Exterior**: fisheye circle view of the front path, suburban street and police car, black vignette. Light: daylight, heavy vignette → `"light": "noon"`. Palette #111111 #6FB04A #C8302B. Key props: police car, path.
   Studio: { "type": "house" }
6. **Interior**: top-down: big bed with orange headboard, nightstand with lamp, two parents under the quilt. Light: night blue with lamp warmth → `"light": "moon"`. Palette #3B4BC8 #F2A040 #F4F0E8. Key props: bed, nightstand, lamp.
   Studio: { "type": "room", "kind": "empty" } (recolour walls / floor to fit)
7. **Interior**: dark blue room with star wallpaper, bunny clock, bed with quilt, door with light beneath. Light: night blue, warm light spill under the door → `"light": "moon"`. Palette #1E40C8 #2AB0B0 #E8792B. Key props: bunny clock, quilt, door.
   Studio: { "type": "room", "kind": "empty" } (recolour walls / floor to fit)
8. **Interior**: floor-level wooden hallway with red rug and warm wall light. Light: warm hall light → `"light": "homeWarm"`. Palette #E8792B #C8302B #2B3FA0. Key props: rug, cat.
   Studio: { "type": "room", "kind": "empty" } (recolour walls / floor to fit)
9. **Exterior**: teal clapboard house with red door number 27, flower beds, lawn, FOR SALE sign. Light: bright sunny noon → `"light": "noon"`. Palette #7FC8D0 #E85A3A #5FB04A. Key props: FOR SALE sign, photo, spare key.
   Studio: { "type": "house" }

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 136.5/255, colour saturation 30.

## Characters
- **burglar / former owner**: black balaclava and dark suit; as buyer grey beanie, yellow jacket, fake beard. Acting: sneaky tiptoe, effortful pushing, smug wink, lounging.
- **dad**: round glasses, brown hair, teal sweater. Acting: confused, sweaty, frazzled hair, headlamp vigilance, exhausted.
- **police officer**: navy cap with star, blue uniform. Acting: deadpan disbelief, laughs.
- **mom**: brown bun, pink dress. Acting: worried, packing.
- **daughter**: dark hair, under a blue quilt. Acting: peeks in fear.
- **family cat**: orange tabby. Acting: silent witness, ends cuddled by the burglar.
- **Extras:** none; a family of three plus one officer and the culprit
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~8% · prop: ruler marks the one-inch move
- ~15% · prop: DON'T MOVE note on the fridge
- ~38% · label: POLICE on the car
- ~82% · sign: FOR SALE 50% OFF shows the forced discount
- ~89% · prop: SOLD welcome-home photo proves the earlier sale
- ~97% · sign: SOLD sign in window seals the reveal
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`pop` (plan beats' `"fx"`). Seen: fisheye peephole lens, time-lapse day-night dissolves, headlamp beam, sweat drops, carpet dent marks, light spill under door.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v20-slow-squeeze-con"` in the plan.

## Prompts the media team can use
- `/v20-slow-squeeze-con tạo video về a neighbour who nudges a fence a little each week to claim land, thoại tiếng Việt, khoảng 58 giây`
- `Dùng skill v20-slow-squeeze-con làm video "<chủ đề>", giọng kể hài hước, 45 giây`
