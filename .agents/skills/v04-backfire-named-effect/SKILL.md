---
name: v04-backfire-named-effect
description: "2D Studio video recipe 04 — science-of: A paradox where the obvious fix makes the problem worse, played as an escalating small-town comedy, then a named human instinct explains it and catches even the person who 'solved' it. Use when the user types /v04-backfire-named-effect, says 'skill v04', or wants a short about: Psychology or perception effects where the fix makes it worse: the cobra effect, the Streisand effect, why 'do not press' buttons get pressed, why warning labels increase misuse, why staring at a pothole makes you hit it. Always read video-studio first."
---

# v04-backfire-named-effect · Khoa học đằng sau

Recipe measured frame by frame from reference short #04 (59.5 s, 32 shots, 7 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** A paradox where the obvious fix makes the problem worse, played as an escalating small-town comedy, then a named human instinct explains it and catches even the person who 'solved' it
- **Fits topics like:** Psychology or perception effects where the fix makes it worse: the cobra effect, the Streisand effect, why 'do not press' buttons get pressed, why warning labels increase misuse, why staring at a pothole makes you hit it
- **Signature moves (keep these):**
  - You-scenario hook that sounds impossible
  - Escalation ladder of fixes that backfire, each with a visual counter or sign
  - Side character who profits from the problem as a running gag
  - The authority who solves it falls victim himself, twice
  - Switch to dark, moody POV shots for the explanation, with the effect's name as a road sign

## Script
- **Length:** about 59.5 s (scale to what the user asks), ~217 words at **3.65 words/s** → plan `"pace": 3.7`; sentences ~10.8 words.
- **Voice:** mixed; tone: tall-tale comedy with escalating absurdity, then calm explanation with a sting. All words are voice-over (every beat `"who": null`); the characters never speak, they act with faces and arms.
- **Hook (first 4.1 s, you-scenario):** If you put [harmless object] next to [empty place], people will [do the exact opposite of common sense] with it.
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–7% | Second-person claim that a lone object attracts accidents |
| setup | 7–20% | Empty straight landscape with one object, yet it gets hit every week |
| attempt | 20–28% | Town adds a huge warning sign; accidents double |
| escalation | 29–36% | Opportunist sets up a business profiting from the crashes |
| escalation | 37–48% | Authority drives out carefully and crashes anyway |
| attempt | 48–60% | Authority removes the object in rage; opportunist loses his business |
| twist | 60–70% | Authority returns to enjoy the fix and hits the leftover remains |
| explain | 71–76% | Question asked, then the phenomenon is named |
| mechanism | 77–92% | In emptiness the object stands out, the warning makes it louder, eyes lock on |
| payoff | 92–100% | Hands follow the eyes toward it, even when only a remnant is left |

- **Ending (callback):** The [instinct] keeps pulling people in, even when [the thing] has been reduced to [a tiny remnant].
- **Devices:** the fix backfires (warning sign doubles crashes); opportunist profiting in a lawn chair; careful authority crashes at low speed; rage chop with cartoon red eyes; crash into the stump after removing the tree; car flips vertical on the stump; you-scenario; escalation ladder; numbers (every week, fifteen miles an hour, doubled); irony; naming the phenomenon; simile (like a lighthouse); callback to the stump

## Camera (one plan beat = one shot)
- **32 shots, median 1.5 s, longest 4 s.** Split long narration into several beats of ~1.5 s so the picture changes that often.
- **Framing:** medium 41%, wide 31%, pov 9%, medium-close 6%, extreme-close 6%, extreme-wide 3%, insert-object 3%
- **Moves:** static 31%, push-in 28%, truck 13%, pull-out 9%, crane-up 6%, shake 6%, tilt 3%, pan 3%
- **Transitions:** cut 81%, none 9%, dissolve 3%, whip 3%, fly-through 3%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, static, on man plants a seed; tree shoots up.
- **Shot rhythm in studio ids** (a guide, not a must): medium › wide › medium › crane › low › side › xclose › low › reveal › low › low › low › behind › side › side › side › handheld › dutch › low › medium › side › crane › side › side › xclose › pov › behind › pov › close › xclose › pov › side

## Places (7)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: lush oak on a grass verge beside a two-lane road with yellow centre lines, wire fence, wheat fields; later a giant marquee arrow sign and days-since-crash counter. Light: bright noon, sun high, puffy clouds → `"light": "noon"`. Palette #5FA83A #3C3F46 #F2C230. Key props: oak tree, arrow marquee sign, crash counter sign, tow truck, lawn chair, stump.
   Studio: { "type": "highway" }
2. **Exterior**: endless straight road to the horizon between striped crop fields, one tree. Light: noon, clear → `"light": "noon"`. Palette #C9A960 #6FAE45 #9EC6EC. Key props: road, fields, lone tree.
   Studio: { "type": "highway" }
3. **Exterior**: small brick downtown with storefronts, green sheriff's office sign, factory smokestack in back. Light: noon → `"light": "noon"`. Palette #B85A3A #2F7A4A #9EC6EC. Key props: sheriff sign, cruiser, smokestack.
   Studio: code set (write `Library/code/<Name>.js`): smallTownStreet: row of brick storefronts, sheriff office sign, smokestack
4. **Exterior**: road edge with fields, YOUR SPEED radar sign. Light: noon → `"light": "noon"`. Palette #3C3F46 #F2C230 #D7E4F2. Key props: speed sign, cruiser.
   Studio: { "type": "highway" }
5. **Interior**: dark garage bay with red trim, car on stands. Light: overhead work lights → `"light": "office"`. Palette #2A2A2A #C8302B #EDE6D6. Key props: cruiser, jack stands.
   Studio: code set (write `Library/code/<Name>.js`): garageBay: dark bay with roll door, lifts, tool wall
6. **Exterior**: same highway at night in rain, wet asphalt with red tail-light reflections, glowing tree far ahead. Light: night storm, cold grey, headlight beams, tree glows like a beacon → `"light": "horror"`. Palette #2B3040 #C23A2A #E8E2C8. Key props: rain, headlights, arrow sign.
   Studio: { "type": "highway" }
7. **Interior**: dashboard with two round gauges and steering wheel, windshield with wipers, TARGET FIXATION overhead sign seen through glass. Light: warm amber dash glow vs cold rain outside → `"light": "horror"`. Palette #1E1E22 #D9A05A #5A6578. Key props: steering wheel, gauges, wipers, air freshener.
   Studio: code set (write `Library/code/<Name>.js`): carInterior: dashboard, steering wheel, windshield frame with wipers, camera at driver eye

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 112.3/255, colour saturation 14.5.

## Characters
- **tow-truck guy (opportunist)**: white-and-red trucker cap, teal shirt, slim; sunglasses later. Acting: smug grins, money-fanning, droopy disappointment when the tree goes.
- **sheriff**: brown cowboy hat with gold aviators on brim, bushy moustache, khaki uniform. Acting: nervous careful driving, red glowing rage eyes, dazed, hypnotised spiral eyes.
- **town workers**: orange hard hat and hi-vis vest, white hard hat. Acting: proud hands-on-hips beside their sign.
- **pedestrian with walker**: lilac clothes, white hair. Acting: slowly overtakes the cruiser (gag).
- **Extras:** almost none: 1-3 extras (workers, a walker, anonymous crash drivers in cars)
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~16% · sign: crash counter makes frequency a running gag
- ~19% · sign: counter resets to zero = punchline
- ~23% · sign: the warning sign is the failed fix
- ~29% · sign: cash-only towing sign reveals the profiteer
- ~37% · sign: introduces the authority
- ~41% · sign: speed display proves he is careful
- ~73% · title: names the phenomenon as a road sign
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`dust`, `confetti`, `splash`, `rain` (plan beats' `"fx"`). Seen: crash dust, flying tyre, flying cash, marquee bulbs, ground cracks, axe energy streaks, shockwave ring in sky, rain, headlight bloom, red rage eyes, dissolve.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v04-backfire-named-effect"` in the plan.

## Prompts the media team can use
- `/v04-backfire-named-effect tạo video về the cobra effect, thoại tiếng Việt, khoảng 60 giây`
- `Dùng skill v04-backfire-named-effect làm video "<chủ đề>", giọng kể hài hước, 45 giây`
