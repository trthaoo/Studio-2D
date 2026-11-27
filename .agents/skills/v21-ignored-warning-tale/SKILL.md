---
name: v21-ignored-warning-tale
description: "2D Studio video recipe 21 — true-story: A misunderstood inventor gives a powerful ruler a strange device with a dire warning; the court mocks it, a false alarm makes it a joke and the inventor is exiled, then the device fires for real, the warning is ignored, disaster strikes, and only afterwards the hidden mechanism inside the device is revealed. Use when the user types /v21-ignored-warning-tale, says 'skill v21', or wants a short about: Old inventions or warnings that were laughed at until they came true: the canary in the coal mine, a ship designer's lifeboat warning, a village tsunami stone, an early storm-glass forecaster, a tide-gauge keeper warning of a flood. Always read video-studio first."
---

# v21-ignored-warning-tale · Chuyện có thật

Recipe measured frame by frame from reference short #21 (64.9 s, 31 shots, 11 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** A misunderstood inventor gives a powerful ruler a strange device with a dire warning; the court mocks it, a false alarm makes it a joke and the inventor is exiled, then the device fires for real, the warning is ignored, disaster strikes, and only afterwards the hidden mechanism inside the device is revealed
- **Fits topics like:** Old inventions or warnings that were laughed at until they came true: the canary in the coal mine, a ship designer's lifeboat warning, a village tsunami stone, an early storm-glass forecaster, a tide-gauge keeper warning of a flood
- **Signature moves (keep these):**
  - Cold open on the strange warning itself, then the whole court laughing
  - A false alarm where literally nothing happens, shown with a tiny still detail (no ripple in a cup), so the mockery doubles
  - Exile and lonely vigil, then a night-time trigger shown in threes (one, another, all of them)
  - Smash cut from mockery to the morning-after ruins
  - Explanation dives inside the device top-down, then ends on a giant cutaway showing the true scale right beneath them

## Script
- **Length:** about 64.9 s (scale to what the user asks), ~235 words at **3.62 words/s** → plan `"pace": 3.6`; sentences ~12.4 words.
- **Voice:** third; tone: fable-like comic storytelling with mounting dread, dry jokes at the ruler's expense, ending in a clear mechanical explanation and a chilling scale reveal. Narrator says 95% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 5 s, cold-open-warning):** [Outsider] puts [small odd object] into [strange device] and tells [powerful ruler]: if [tiny event] ever happens, [drastic action]!
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–8% | Inventor sets a ball in a dragon's jaw and warns the emperor to flee if it ever drops |
| reaction | 8–11% | Whole court laughs at the warning |
| setup | 11–20% | Describes the device: eight dragons round a bronze jar, each over a frog's open mouth |
| setup | 21–27% | The emperor commands the largest army and won't flee from pottery |
| false-alarm | 27–37% | Weeks later a ball drops yet nothing at all happens; the laughter doubles |
| exile | 37–50% | Emperor calls it a costly toy, banishes the inventor, who hauls the jar up a hill to live alone |
| twist | 51–57% | At night one ball drops, then another, then all eight together |
| escalation | 57–70% | He races to the gates shouting to evacuate; guards mock him and send him back |
| payoff | 71–74% | Next morning the palace lies in ruins |
| mechanism | 75–89% | Inside: a pendulum and rods; the faintest tremor swings it, a rod opens a jaw, the ball falls |
| payoff | 89–100% | One ball meant a distant tremor; all eight meant the biggest quake was directly below them |

- **Ending (reveal):** [One signal] meant [small, far-away event]; [every signal at once] meant [the catastrophe] was [right here].
- **Devices:** court laughing in escalating waves; nothing happens after the first alarm, not even a ripple in a wine cup; ruler dismisses a scientific instrument as an overpriced toy; guards heckle with a nickname and a frog joke; deadpan smash cut from mockery to rubble; cold-open quote of the warning; rule of three (one ball, another, all eight); time jumps (weeks later, one night, next morning); dramatic irony (audience suspects the device works); chain-of-cause explanation (nudge, pendulum, rod, jaw, ball); scale escalation ending (one vs all eight)

## Camera (one plan beat = one shot)
- **31 shots, median 2 s, longest 6 s.** Split long narration into several beats of ~2 s so the picture changes that often.
- **Framing:** wide 39%, medium 35%, extreme-close 13%, medium-close 3%, extreme-wide 3%, insert-object 3%, close 3%
- **Moves:** static 39%, push-in 19%, crane-down 13%, pull-out 10%, truck 10%, crane-up 6%, tilt 3%
- **Transitions:** cut 81%, dissolve 10%, none 6%, fly-through 3%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, static, on inventor beside the bronze jar, hand on a dragon head.
- **Shot rhythm in studio ids** (a guide, not a must): medium › xclose › crane › medium › low › reveal › crane › crane › low › wide › xclose › high › low › medium › close › wide › side › wide › close › reveal › close › low › follow › ots › wide › crane › xclose › xclose › wide › wide › crane

## Places (11)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Interior**: grand stone hall with arches and a rose window, red-and-gold throne with crest, blue patterned carpet, candelabras, the grey bronze jar with gold dragons and pewter frogs in front. Light: warm candle and window light, golden highlights on bronze → `"light": "homeWarm"`. Palette #B8322A #2B3A78 #D9A93A. Key props: throne, bronze dragon jar, frogs, wine cup, halberds, candelabras.
   Studio: code set (write `Library/code/<Name>.js`): throneHall: stone arches, rose window, red/gold throne on a dais, patterned carpet, candelabras
2. **Exterior**: white stone balustrade with a griffin statue and red banner, overlooking a vast courtyard packed with an army in rows, castle walls and snowy mountains behind. Light: bright midday sun, blue sky, crisp → `"light": "noon"`. Palette #9CC8EE #E9E4DA #B02A2A. Key props: balustrade, statue, banners, army ranks.
   Studio: code set (write `Library/code/<Name>.js`): palaceBalcony: balustrade with statue overlooking a courtyard of instanced soldiers, castle walls, mountains
3. **Interior**: long white-clothed table with roast and candles, courtiers seated on benches, stone pillars and red banners. Light: warm interior daylight and candle glow → `"light": "homeWarm"`. Palette #C9A46A #7A2A22 #F1E7D2. Key props: long table, roast, candlesticks, banners.
   Studio: { "type": "room", "kind": "kitchen" } (recolour walls / floor to fit)
4. **Exterior**: pale stone gatehouse with towers, red banners and crest, dirt road with cart ruts, market stalls and townsfolk either side. Light: flat noon sun → `"light": "noon"`. Palette #D8CBB4 #B5302A #8FB8E0. Key props: gate arch, banners, stalls, jar.
   Studio: code set (write `Library/code/<Name>.js`): cityGate: stone gatehouse with towers, banners, dirt road, side stalls (also night variant with portcullis and rampart)
5. **Exterior**: steep dark hillside in silhouette, pink hills and a huge setting sun with rays behind. Light: strong golden backlight, silhouettes → `"light": "golden"`. Palette #F5A35A #E86A7A #3A2340. Key props: cart, jar.
   Studio: { "type": "floor" }
6. **Exterior**: grassy hilltop with a twisted tree, small campfire, laundry line and veg patch beside the jar; distant castle and terraced valley. Light: golden dusk/morning, also deep blue moonlit night version → `"light": "golden"`. Palette #7DAA4A #F2B36A #2E3E8C. Key props: jar, campfire, tree, frogs, lantern.
   Studio: { "type": "floor" }
7. **Exterior**: portcullis gate lit by torches, stone rampart walkway with a tower, moonlit hills; outer gate with wooden door and hay. Light: cool blue moonlight with warm torch pools → `"light": "moon"`. Palette #2C3A8C #B9A0C8 #F0A040. Key props: portcullis, torches, rampart, lantern.
   Studio: code set (write `Library/code/<Name>.js`): cityGate night variant: portcullis, torches, rampart walkway
8. **Exterior**: distant walled city in haze, palace collapsed into rubble with a tall brown smoke column. Light: hazy warm morning → `"light": "golden"`. Palette #F2C48A #B9876A #8AA65A. Key props: rubble, smoke column.
   Studio: code set (write `Library/code/<Name>.js`): cityVista: distant walled city on a plain with collapsible palace and smoke column
9. **Interior**: cylindrical riveted metal chamber, brass pendulum bob hanging centre, eight radial rods with yellow tips, porthole lights. Light: warm interior glow, bright portholes → `"light": "studio"`. Palette #3A4250 #E3A23A #F5E3B0. Key props: pendulum, rods, rivets.
   Studio: code set (write `Library/code/<Name>.js`): mechanismInterior: cylinder chamber with pendulum and radial rods (generic machine-inside set)
10. **Exterior**: lone pale striated peak against a peach sky. Light: soft hazy dawn → `"light": "golden"`. Palette #F3C9A8 #E8E2E8 #C79AA0. Key props: mountain, dust puff.
   Studio: { "type": "floor" }
11. **Exterior**: cutaway of colourful rock strata under a ruined half-timbered town, water pocket, buried fossil, glowing yellow fault line rising to the surface. Light: dusky surface light, glowing fault emissive → `"light": "fire"`. Palette #E86A3A #6A3A9C #F7E08A. Key props: rock layers, fault crack, ruined houses.
   Studio: code set (write `Library/code/<Name>.js`): groundCutaway: layered strata block with a glowing fault under a small town

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 111.9/255, colour saturation 23.1.

## Characters
- **inventor (ignored expert)**: round white head, black topknot with gold hairpin, blue robe with white collar and gold sash. Acting: calm and serious, sweat drop, wide panicked eyes, screaming at the gate, slumped walk home.
- **emperor**: moustache, tall black-and-gold court hat, dark purple robe with red and gold trim. Acting: smug side-eye, tearful belly laugh, haughty sneer, bored cup lift.
- **palace guards**: grey helmets, scale armour, red tunics, halberds. Acting: laughing behind the emperor; rampart guard points and teases with a cheeky grin.
- **courtiers and townsfolk**: simple robes, varied hats. Acting: doubling over with laughter, jeering.
- **Extras:** huge army in ordered ranks in the courtyard (instanced), banquet courtiers, a handful of townsfolk at the gate; otherwise 2-3 characters per shot
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- none
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`pop`, `explosion`, `smoke`, `dust`, `magic` (plan beats' `"fx"`). Seen: falling ball and frog catch, Z sleep symbols, sweat drops, dust and debris explosion of the palace, rising smoke column, dust puff on mountain, glowing fault crack, dissolves, sunset god rays.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v21-ignored-warning-tale"` in the plan.

## Prompts the media team can use
- `/v21-ignored-warning-tale tạo video về the canary in the coal mine, thoại tiếng Việt, khoảng 65 giây`
- `Dùng skill v21-ignored-warning-tale làm video "<chủ đề>", giọng kể hài hước, 45 giây`
