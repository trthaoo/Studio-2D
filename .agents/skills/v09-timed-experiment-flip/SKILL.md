---
name: v09-timed-experiment-flip
description: "2D Studio video recipe 09 — experiment: Someone applies a fussy, oddly exact treatment with one strict timing rule; a test on the toughest subject gives an unexplainable, dramatic result; everyone adopts it; then one person breaks the timing rule by accident and the effect flips, revealing the hidden condition. Use when the user types /v09-timed-experiment-flip, says 'skill v09', or wants a short about: Odd experiments or treatments with a hidden time or dose limit: why classical music in shops calms then annoys, the bright-light office test, why ice baths help only briefly, the nap that makes you groggier if too long, the calming scent that backfires after an hour. Always read video-studio first."
---

# v09-timed-experiment-flip · Thí nghiệm

Recipe measured frame by frame from reference short #09 (65.3 s, 28 shots, 6 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** Someone applies a fussy, oddly exact treatment with one strict timing rule; a test on the toughest subject gives an unexplainable, dramatic result; everyone adopts it; then one person breaks the timing rule by accident and the effect flips, revealing the hidden condition
- **Fits topics like:** Odd experiments or treatments with a hidden time or dose limit: why classical music in shops calms then annoys, the bright-light office test, why ice baths help only briefly, the nap that makes you groggier if too long, the calming scent that backfires after an hour
- **Signature moves (keep these):**
  - Hook on something absurdly soft applied to a tough place, with fussy exact numbers
  - A strict timing rule shown with a stopwatch held up to camera
  - Toughest subject goes in laughing and comes out beaten by the weakest person, then a 'wait, what?' beat
  - Aerial crane-up across the country to show everyone adopting it
  - An accident breaks the rule: time-stamped escalation in the same set, then a reversal line over the rage close-up

## Script
- **Length:** about 65.3 s (scale to what the user asks), ~237 words at **3.63 words/s** → plan `"pace": 3.6`; sentences ~10.8 words.
- **Voice:** third-person; tone: light, teasing storyteller voice with comic disbelief, turning eerie, ending on a crisp warning. Narrator says 97% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 3.2 s, strange-act-in-media-res):** They [did something absurdly soft / out of place] to [the toughest place]. And not just any [version] of it.
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–5% | A jail cell gets painted pink, and a very specific pink |
| setup | 5–17% | A scientist measures an exact red-to-white ratio and orders a full repaint because the first coat was off |
| mockery | 17–22% | Guards joke that it looks like a doll's room |
| rule | 22–34% | One odd rule: every prisoner comes out after exactly fifteen minutes, timed at the door with a stopwatch |
| test | 34–55% | The biggest, toughest inmate goes in laughing; afterwards the weakest guard beats him at arm wrestling in seconds |
| reaction | 55–59% | Disbelieving aside; no one can explain it |
| spread | 59–65% | Within a year prisons nationwide paint cells pink in bulk |
| twist | 65–80% | A guard forgets a man inside; calm at fifteen, restless at twenty, tearing up the bench by the time the door opens |
| explain | 81–92% | The colour was claimed to sap aggression in fifteen minutes, so jails used it on their most violent inmates |
| payoff | 92–99% | It only works for that window; any longer and it does the reverse |

- **Ending (hidden-condition-reveal):** But [treatment] only works for [exact limit]. Go past it and it does the [exact opposite].
- **Devices:** guard's doll-house joke about the pink cell; scientist rejecting a coat for being the wrong shade; tiny guard beating a huge tattooed inmate in two seconds; narrator's 'wait, what?' double-take; calm inmate knitting a long pink striped scarf; red cartoon rage veins and cracking floor; precise numbers repeated (one pint to a gallon, 15 minutes, 2 seconds); 'and not just any' intensifier; time-stamped escalation (at 15, at 20, by the time); unexplained-result beat before the explanation; 'you see' pivot; reversal last line

## Camera (one plan beat = one shot)
- **28 shots, median 2 s, longest 6 s.** Split long narration into several beats of ~2 s so the picture changes that often.
- **Framing:** wide 46%, medium 32%, insert-object 7%, medium-close 4%, extreme-close 4%, extreme-wide 4%, close 4%
- **Moves:** push-in 46%, static 39%, crane-down 7%, crane-up 4%, pull-out 4%
- **Transitions:** cut 68%, dissolve 18%, none 11%, fly-through 4%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** wide, low angle, static, on guard rolls a bright pink stripe onto a grey cell wall.
- **Shot rhythm in studio ids** (a guide, not a must): low › xclose › wide › high › wide › close › two › wide › two › xclose › low › wide › reveal › two › high › two › crane › crane › crane › medium › wide › low › wide › wide › medium › wide › close › low

## Places (6)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Interior**: small cinder-block cell with barred high window, steel bench and floor drain; starts grey, then painted bubble-gum pink. Light: soft daylight beam from the window, fluorescent tube overhead → `"light": "studio"`. Palette #F06AA8 #D9D9DE #8A8F99. Key props: steel bench, barred window, paint roller, P-618 swatch, tally marks, knitting.
   Studio: code set (write `Library/code/<Name>.js`): jailCell: cinder-block cell with barred window, bench, drain; wall colour editable (grey to pink)
2. **Interior**: workshop with shelves of paint cans, PAINT SHOP sign, wood bench with green cutting mat and digital scale. Light: bright window daylight → `"light": "morning"`. Palette #E8E4DA #3FA878 #C8242C. Key props: paint cans, scale, stir stick, recipe tape.
   Studio: { "type": "room", "kind": "shop" } (recolour walls / floor to fit)
3. **Interior**: two-tier blue prison block with railings, POD C sign, row of cell doors, steel tables and benches, yellow floor line. Light: cool daylight shafts from high windows; one night scene in deep blue → `"light": "noon"`. Palette #6F9CC8 #2B3E66 #F2D23A. Key props: cell doors, steel tables, stopwatch, POD C sign.
   Studio: code set (write `Library/code/<Name>.js`): cellBlock: two-tier block with railings, row of cell doors, steel tables, POD sign
4. **Exterior**: patchwork farmland with circular fields, river, small towns, clouds below the camera. Light: clear high sun → `"light": "noon"`. Palette #7DBE4A #E2C94A #3A8FD0. Key props: fields, river, clouds.
   Studio: { "type": "floor" }
5. **Exterior**: prison wall with guard tower, asphalt yard with parking lines, loading door. Light: bright day → `"light": "noon"`. Palette #5C5F66 #E8D8C8 #F2A0C8. Key props: pink paint truck, guard tower, paint cans.
   Studio: code set (write `Library/code/<Name>.js`): prisonYard: wall with guard tower, asphalt yard, loading door, truck
6. **Interior**: glassed-in booth with orange desk, green mat, CRT monitor, shift board. Light: warm desk lamp in a dark blue night → `"light": "moon"`. Palette #1E2A55 #E07A2A #3FA878. Key props: monitor, stopwatch, mug, shift board.
   Studio: { "type": "room", "kind": "office" } (recolour walls / floor to fit)

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 131.5/255, colour saturation 24.7.

## Characters
- **scientist**: brown side-parted hair, white shirt, brown striped tie. Acting: unimpressed half-lidded stare, smug little smile with stopwatch, calm explainer.
- **guards**: navy caps with gold star, navy uniforms; one skinny with glasses. Acting: laughing and joking, gritted-teeth effort, dozing, alarmed stare.
- **big inmate**: huge round bald body, white striped tank top, anchor tattoo. Acting: mocking laugh, demonic red eyes, then blissed-out closed-eye smile, knitting, final rage.
- **forgotten inmate**: curly red hair, blue prison jumpsuit with number. Acting: calm, then fidgety, panicked teeth, bench-ripping fury.
- **Extras:** a handful of guards and inmates in the cell block as background; no large crowd
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~4% · label: P-618 recipe sheet with exact ratio and 'EXACTLY!' stresses precision
- ~8% · sign: PAINT SHOP sign labels the room
- ~15% · label: P-618 swatch checks the shade
- ~18% · sign: POD C sign establishes the cell block
- ~21% · sign: C-4 door label marks the pink cell
- ~64% · label: P-618 on the paint truck shows nationwide adoption
- ~72% · label: tally marks on the wall show time passing
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
none needed. Seen: red rage veins, floor cracks, concrete debris burst, light shafts, aerial clouds, dissolves, looming shadow.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v09-timed-experiment-flip"` in the plan.

## Prompts the media team can use
- `/v09-timed-experiment-flip tạo video về why classical music in shops calms then annoys, thoại tiếng Việt, khoảng 65 giây`
- `Dùng skill v09-timed-experiment-flip làm video "<chủ đề>", giọng kể hài hước, 45 giây`
