---
name: v13-forbidden-loop-fable
description: "2D Studio video recipe 13 — other:twist-fable: A whole community is built around one forbidden object; a curious youngster spots small unexplained clues, breaks the taboo on a dare, nothing seems to happen, then the world resets and the clues reveal he is part of an endless loop. Use when the user types /v13-forbidden-loop-fable, says 'skill v13', or wants a short about: Short twist fables about a taboo and a cycle: a door in the school basement no one may open, a clock tower nobody may wind, a lighthouse lamp that must never go out, a well no one may drink from, a tree no one may cut. Always read video-studio first."
---

# v13-forbidden-loop-fable · twist fable

Recipe measured frame by frame from reference short #13 (65.6 s, 24 shots, 5 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** A whole community is built around one forbidden object; a curious youngster spots small unexplained clues, breaks the taboo on a dare, nothing seems to happen, then the world resets and the clues reveal he is part of an endless loop
- **Fits topics like:** Short twist fables about a taboo and a cycle: a door in the school basement no one may open, a clock tower nobody may wind, a lighthouse lamp that must never go out, a well no one may drink from, a tree no one may cut
- **Signature moves (keep these):**
  - One-line taboo hook, then a sweeping crane-up revealing a whole world built around the object
  - Plant two odd clues, one numeric (a counter) and one personal (a familiar face)
  - Dare plus a ticking window, then an anticlimactic nothing-happens beat
  - Morning-after reveal from top-down wake-up to a giant crane-up of everyone standing in emptiness
  - End with the counter ticking up and a familiar figure repeating the original rule

## Script
- **Length:** about 65.6 s (scale to what the user asks), ~245 words at **3.74 words/s** → plan `"pace": 3.7`; sentences ~15.3 words.
- **Voice:** third; tone: quiet, eerie fairy-tale narration with a light schoolboy-dare tone, ending on a chilling loop reveal. Narrator says 96% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 3.4 s, forbidden-object):** There is a [tempting object] in the middle of [a place], and nobody is allowed to [use it].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–5% | A button sits in the town centre and pressing it is forbidden |
| world | 5–31% | Town laid out in rings facing it, glass case, two staring guards, an unclimbable wall, a glow beyond that fades each year |
| clues | 31–47% | Gary notices 47 unexplained scratches and a founder statue that looks like his mother |
| setup | 48–58% | Friends dare him for five bucks; a 30-second window when guards change shift |
| action | 58–68% | He lifts the glass and presses; nothing but a faint scratching |
| twist | 68–73% | Walking home, the light beyond the wall outshines ever |
| reveal | 74–88% | Next morning: houses, guards and wall gone, the whole town standing in an empty field staring at the button as if new |
| clue payoff | 88–91% | The scratches now number 48 |
| payoff | 92–100% | His mother steps forward, forbids touching it and founds the town on the spot: the loop restarts |

- **Ending (loop-reveal):** A familiar figure repeats the original rule word for word as if for the first time, showing the cycle has just begun again.
- **Devices:** guard who never stops staring while sipping coffee; five-buck dare stakes vs cosmic consequence; deadpan nothing-happens beat; forbidden-object hook; world-building list in rule of three; planted numeric clue that pays off (47 to 48); ticking window (30 seconds); ending line echoes the opening rule

## Camera (one plan beat = one shot)
- **24 shots, median 2.75 s, longest 5.07 s.** Split long narration into several beats of ~2.75 s so the picture changes that often.
- **Framing:** medium 46%, wide 13%, close 13%, extreme-wide 8%, extreme-close 8%, medium-close 4%, insert-object 4%, over-shoulder 4%
- **Moves:** static 33%, push-in 17%, crane-up 17%, truck 13%, tilt 13%, crane-down 4%, pull-out 4%
- **Transitions:** none 42%, cut 33%, dissolve 21%, fly-through 4%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium-close, eye angle, push-in, on staring guard beside grinning Gary who reaches toward the red button on its pedestal.
- **Shot rhythm in studio ids** (a guide, not a must): two › crane › crane › medium › low › close › low › reveal › medium › xclose › follow › low › medium › medium › ots › medium › xclose › wide › high › medium › crane › follow › high › two

## Places (5)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: circular paved plaza with ring markings, grey octagonal pedestal with gold rim and red button under a glass dome, lamp posts, bronze founders statue, rows of identical blue suburban houses stacked in rings up to a giant wall; day and night. Light: soft overcast day under a dome-like wall; night with warm lamps and window glow → `"light": "overcast"`. Palette #3A5BA8 #E8DCC0 #F2B230. Key props: button pedestal, glass dome, statue, lamp posts, railing.
   Studio: code set (write `Library/code/<Name>.js`): ringTown: circular plaza with pedestal button under glass, houses in concentric rings rising to a tall circular wall, statue, lamps
2. **Exterior**: endless pale-blue tiled wall face with a tall aluminium ladder. Light: bright flat daylight, warm haze at the top → `"light": "noon"`. Palette #7AA0E0 #C8D8F0 #F2C890. Key props: ladder, wall.
   Studio: code set (write `Library/code/<Name>.js`): tallWall: huge tiled wall face with a long ladder
3. **Interior**: attic room of knotty wood, slanted skylight with tally marks, round striped rug, desk with lamp, framed town map. Light: warm desk lamp plus blue-orange glow through the skylight → `"light": "homeWarm"`. Palette #B8764A #3A5BC8 #E85A3A. Key props: skylight, tally marks, rug, desk lamp.
   Studio: { "type": "room", "kind": "living" } (recolour walls / floor to fit)
4. **Exterior**: curving sidewalk past pastel clapboard houses and white picket fences, tree, the wall rising behind. Light: night blue turning to orange glow from the sky → `"light": "moon"`. Palette #2A3A9C #F2A050 #9AC87A. Key props: picket fence, houses, street lamp.
   Studio: { "type": "house" }
5. **Exterior**: mown green field inside a plain pale circular wall, the button pedestal alone in the middle, crowd of townspeople. Light: flat bright morning → `"light": "morning"`. Palette #4AB03A #E8E4DA #F2B230. Key props: button, counter, crowd.
   Studio: { "type": "floor" }

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 122.1/255, colour saturation 28.9.

## Characters
- **Gary (curious kid)**: messy dark hair, red shirt (later red striped pyjamas). Acting: mischievous grin, side-eye, holds up two fingers, squeezes eyes shut, sweating confusion.
- **guards**: navy police caps and uniforms, one with moustache. Acting: unblinking stare, sipping coffee, shrug, flashlights at night.
- **Gary's mother**: brown hair bun, cat-eye glasses, teal cardigan. Acting: stern, steps forward, commanding gesture.
- **friends**: orange beanie purple body, yellow bike helmet green body. Acting: smirking dare, waving the bill.
- **townsfolk**: varied plaid shirts, glasses, cardigans. Acting: blank wide-eyed stare in unison.
- **Extras:** whole town (hundreds, instanced) standing in a ring in the field; plaza mostly empty
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~30% · label: tally marks on the skylight count the years
- ~37% · counter: tally counter shows 47 scratches (planted clue)
- ~46% · plaque: founders plaque under the statue
- ~90% · counter: counter shows 48: the payoff
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`magic`, `sparks`, `flash`, `pop` (plan beats' `"fx"`). Seen: sky glow ring with rays, sparks on scratch, orange sky bloom, light flash transition, sweat drops, dissolves.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v13-forbidden-loop-fable"` in the plan.

## Prompts the media team can use
- `/v13-forbidden-loop-fable tạo video về a door in the school basement no one may open, thoại tiếng Việt, khoảng 66 giây`
- `Dùng skill v13-forbidden-loop-fable làm video "<chủ đề>", giọng kể hài hước, 45 giây`
