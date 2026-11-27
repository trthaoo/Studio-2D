---
name: v05-con-double-reversal
description: "2D Studio video recipe 05 — con-trick: A desperate seller fakes the value of something worthless to fool a rich buyer; the expert catches the fake but the buyer laughs it off, and in a final reversal the buyer knows the thing is actually worth far more. Use when the user types /v05-con-double-reversal, says 'skill v05', or wants a short about: Historic cons and frauds with an ironic ending: fake antiques sold to a collector who knew better, padded horse sales, counterfeit art bought by a forger, rigged land sales where the land was valuable, fake treasure maps that led to real treasure. Always read video-studio first."
---

# v05-con-double-reversal · Mánh lừa

Recipe measured frame by frame from reference short #05 (61.1 s, 34 shots, 7 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** A desperate seller fakes the value of something worthless to fool a rich buyer; the expert catches the fake but the buyer laughs it off, and in a final reversal the buyer knows the thing is actually worth far more
- **Fits topics like:** Historic cons and frauds with an ironic ending: fake antiques sold to a collector who knew better, padded horse sales, counterfeit art bought by a forger, rigged land sales where the land was valuable, fake treasure maps that led to real treasure
- **Signature moves (keep these):**
  - Open mid-action on a bizarre act and let the sidekick voice the audience's confusion
  - Name the trick, then quick stakes setup with a headline prop
  - Expert catches the con in close-up evidence shots (pan, magnifier)
  - Mark laughs it off and pays; then reveals he is the smarter one
  - Final reveal measured with a visible distance marker beside the loser's abandoned gear

## Script
- **Length:** about 61.1 s (scale to what the user asks), ~231 words at **3.78 words/s** → plan `"pace": 3.8`; sentences ~11 words.
- **Voice:** third-person story; tone: folksy, comic western, crisp and confident narration with a smug double-twist. Narrator says 88% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 3.5 s, in-medias-res):** He put [valuable thing] into [weapon/tool] and fired it into [place that should already contain it].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–6% | Strange act shown mid-action: valuables shot into the place itself |
| hook | 6–15% | Sidekick asks the obvious incredulous question |
| rule | 15–17% | Trick is named |
| setup | 18–31% | Years of failure, a rich buyer arriving tomorrow, last money spent on the bait |
| problem | 31–42% | Buyer arrives, clumsy, but brings a sharp expert |
| problem | 42–58% | Expert tests a sample and finds proof it was faked |
| twist | 58–70% | Buyer laughs off the idea as insane; sidekick eagerly agrees |
| twist | 71–84% | Buyer pays, sellers flee, buyer reveals he came prepared to dig |
| escalation | 84–90% | Buyer blasts the tunnel casually and runs |
| payoff | 90–100% | A thick real vein sits just a short distance beyond where the seller quit |

- **Ending (twist):** When [the dust settles], the real [treasure] was just [tiny distance] past where [the loser] gave up.
- **Devices:** absurd act (shooting gold into a gold mine); rich guy bonks head on a beam; sidekick over-eager agreement; buyer pulls a whole jacket of dynamite; wink before running; dramatic irony of the con backfiring; in-medias-res; naming the trick ('it's called'); numbers (ten years, last hundred bucks, ten feet); repetition of 'insane'; simile (like a firecracker, as thick as your arm); reversal

## Camera (one plan beat = one shot)
- **34 shots, median 1.5 s, longest 5.5 s.** Split long narration into several beats of ~1.5 s so the picture changes that often.
- **Framing:** medium 50%, wide 18%, close 9%, extreme-close 9%, medium-close 6%, insert-object 6%, pov 3%
- **Moves:** static 44%, push-in 32%, truck 12%, pan 9%, pull-out 3%
- **Transitions:** cut 79%, none 9%, whip 6%, zoom-through 3%, dissolve 3%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, static, on miner under a lamp cone holding a shotgun.
- **Shot rhythm in studio ids** (a guide, not a must): medium › low › xclose › close › follow › medium › low › wide › follow › two › medium › xclose › wide › low › wide › medium › high › xclose › medium › pov › xclose › medium › low › two › medium › wide › low › xclose › behind › follow › medium › wide › reveal › reveal

## Places (7)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Interior**: rough ochre rock tunnel with timber frames and plank walls, rail track down the middle, candle sconces, lantern, wash tub, crates. Light: warm candle and lantern light, amber key, deep brown shadows → `"light": "fire"`. Palette #C9874A #7A4A24 #F2C46A. Key props: rails, timber beams, candles, wash tub, gold pan, ore cart, dynamite.
   Studio: code set (write `Library/code/<Name>.js`): mineTunnel: rock tube with timber frames, plank walls, rail track, candles, lantern, tub, ore cart
2. **Interior**: corner of the tunnel with candle crates, coffee pot, lantern, tree-stump stool. Light: warm candle glow from the side → `"light": "fire"`. Palette #C9874A #3E8C8A #E8D2A0. Key props: coffee pot, candle crates, stool.
   Studio: code set (write `Library/code/<Name>.js`): mineTunnel variant: side nook with crates, coffee pot, stool
3. **Exterior**: sunny canyon cliff, rail track, pile of rubble, red ore cart named NELLIE, timber shacks with flag. Light: bright noon desert sun → `"light": "noon"`. Palette #D9B080 #C8402A #9EC6EC. Key props: ore cart, rubble, newspaper, shacks.
   Studio: code set (write `Library/code/<Name>.js`): canyonYard: cliff backdrop, rails, rubble pile, ore cart, shacks
4. **Interior**: wooden counter with brass scale, tin ceiling, shelves with price boards. Light: warm homey lamp light → `"light": "homeWarm"`. Palette #7A4A24 #2F6A3A #E8C060. Key props: scale, cash, gold dust dish, clerk visor.
   Studio: { "type": "room", "kind": "shop" } (recolour walls / floor to fit)
5. **Exterior**: dirt road under a cliff with pine forest and golden aspens. Light: golden morning → `"light": "golden"`. Palette #C9A87A #3E6A4A #E8D070. Key props: vintage open car.
   Studio: { "type": "highway" }
6. **Exterior**: timber portal in a cliff with SURE THING MINE sign and bunting, rails leading in, tool rack. Light: noon, soft → `"light": "noon"`. Palette #B3876A #E8DCC0 #C8302B. Key props: mine sign, bunting, rails, pick rack.
   Studio: code set (write `Library/code/<Name>.js`): minePortal: timber portal in a cliff with name sign and bunting, rails in
7. **Interior**: cave-like dead end with rubble, a thick glowing gold vein in the wall, chalk 10 FT mark on the floor. Light: warm golden glow from the vein, dusty haze → `"light": "golden"`. Palette #C98A3A #F2C230 #5A3A1E. Key props: gold vein, chalk mark, old hat, pickaxe.
   Studio: code set (write `Library/code/<Name>.js`): mineTunnel dead-end with glowing gold vein strip and rubble

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 102.2/255, colour saturation 24.5.

## Characters
- **miner (con man)**: brown wide-brim hat with headlamp badge, red plaid vest over shirt, suspenders. Acting: smug wink, toothy grin, nervous nod.
- **buddy (sidekick)**: mustard knit beanie, teal shirt, short dark hair. Acting: flat incredulous looks, mouth open questions, over-eager nodding.
- **rich buyer**: tall white top hat, white double-breasted suit, red rose, black handlebar moustache. Acting: closed-eye belly laughs, sly grin, wink, proud pose.
- **expert**: black bowler hat, round glasses, maroon coat, grey side hair. Acting: suspicious squint, pointing, frustrated shout.
- **store clerk**: green visor, black vest. Acting: neutral background.
- **Extras:** none: a cast of 4-5 named characters only
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~20% · label: name painted on the ore cart adds character
- ~24% · sign: newspaper headline delivers the deadline and stakes
- ~35% · sign: ironic mine name above the entrance
- ~86% · label: dynamite label identifies the object
- ~98% · label: chalk distance mark quantifies how close the loser came
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`magic`, `dust`, `sparks`, `explosion` (plan beats' `"fx"`). Seen: lamp light cone, glowing gold projectile trail, rock impact dust, gold flake sparkle, fuse sparks, explosion, dust cloud fill, glowing gold vein.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v05-con-double-reversal"` in the plan.

## Prompts the media team can use
- `/v05-con-double-reversal tạo video về fake antiques sold to a collector who knew better, thoại tiếng Việt, khoảng 61 giây`
- `Dùng skill v05-con-double-reversal làm video "<chủ đề>", giọng kể hài hước, 45 giây`
