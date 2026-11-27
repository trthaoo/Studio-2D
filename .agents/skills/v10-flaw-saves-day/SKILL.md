---
name: v10-flaw-saves-day
description: "2D Studio video recipe 10 — why-explainer: An underdog insists on a deliberate flaw that everyone mocks and that costs him the race; a slow natural change over time quietly erases the flaw, the boss gloats, and at the peak of that change the flawless rival version fails catastrophically, revealing the flaw was the safeguard. Use when the user types /v10-flaw-saves-day, says 'skill v10', or wants a short about: Deliberate 'flaws' in engineering that prevent disaster: why sidewalks have cracks cut in them, why skyscrapers sway, why bridges have toothed expansion joints, why power lines sag, why ships are built to flex, why guitar necks have a truss rod. Always read video-studio first."
---

# v10-flaw-saves-day · Giải thích "Vì sao…"

Recipe measured frame by frame from reference short #10 (65.2 s, 35 shots, 6 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** An underdog insists on a deliberate flaw that everyone mocks and that costs him the race; a slow natural change over time quietly erases the flaw, the boss gloats, and at the peak of that change the flawless rival version fails catastrophically, revealing the flaw was the safeguard
- **Fits topics like:** Deliberate 'flaws' in engineering that prevent disaster: why sidewalks have cracks cut in them, why skyscrapers sway, why bridges have toothed expansion joints, why power lines sag, why ships are built to flex, why guitar necks have a truss rod
- **Signature moves (keep these):**
  - Hook on someone deliberately putting a flaw into something that should be perfect, with an exact measurement
  - Boss rage beat (purple face, steam) and a public cost: rival wins, papers mock, customers leave
  - Measured time-lapse on one tiny detail (coin, then paper) with calendar inserts
  - Cross-cut to the 'perfect' rival straining (glowing, groaning) while the boss gloats
  - Silent payoff: perfect version fails at the worst moment, mechanism left for the viewer to infer

## Script
- **Length:** about 65.2 s (scale to what the user asks), ~218 words at **3.34 words/s** → plan `"pace": 3.3`; sentences ~10.4 words.
- **Voice:** third-person with second-person asides; tone: folksy, wry western tall tale with comic insults, slow-burn suspense and a silent visual punchline. Narrator says 94% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 3.2 s, strange-act-in-media-res):** He deliberately cut [flaws] into [thing that should be seamless] every [precise interval].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–5% | A man saws gaps into a railroad at an exact spacing |
| stakes | 5–17% | Two companies race to bridge a bottomless canyon; the winner takes the whole nation's trade |
| conflict | 18–33% | Youngest engineer; the supervisor notices a narrow gap at every joint, turns purple and yells, but he refuses to close any |
| cost | 33–55% | The rival lays seamless rail, finishes first and runs silent trains; his trains clatter, papers mock the line and passengers switch |
| clue | 55–73% | Summer: the gaps shrink month by month, a coin then a sheet of paper; the boss gloats |
| foreshadow | 74–83% | On the seamless line the rails groan in the afternoon heat, pressing against each other |
| turn | 83–91% | On the hottest day his gaps finally close, rail meeting rail |
| payoff | 91–100% | Mid-canyon the seamless track buckles sideways like a snake just as a train rolls on |

- **Ending (catastrophe-payoff):** And at the worst possible spot, the [perfect version] [fails dramatically] just as [the stakes arrive]; the reason is left for the viewer to connect.
- **Devices:** boss turns purple with steam puffing from his head; train-car passengers bouncing and sweating on the clattering line; newspaper nickname mocking the noisy line; boss gloating that even the gaps know he was wrong; tycoon lounging in a deck chair under a parasol, hat popping off; workers lunching on a beam over the abyss; precise number in the hook (every 39 feet); hyperbole (a bottomless-looking gorge); onomatopoeia (clickety-clack) used as a running label; month-by-month measurement countdown (coin, then paper); personification and simile (rails want to get out, kicks like a snake); show-don't-tell ending: mechanism implied, never stated

## Camera (one plan beat = one shot)
- **35 shots, median 1.5 s, longest 6 s.** Split long narration into several beats of ~1.5 s so the picture changes that often.
- **Framing:** medium 46%, wide 26%, extreme-wide 11%, insert-object 6%, extreme-close 6%, medium-close 3%, close 3%
- **Moves:** static 46%, push-in 26%, truck 9%, pull-out 6%, crane-down 3%, crane-up 3%, shake 3%, pan 3%, tilt 3%
- **Transitions:** cut 74%, dissolve 11%, whip 9%, none 3%, zoom-through 3%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, low angle, static, on engineer in striped cap saws a gap in the rail as a smoking train approaches.
- **Shot rhythm in studio ids** (a guide, not a must): low › wide › crane › crane › wide › two › close › low › close › two › high › low › xclose › wide › medium › high › handheld › close › medium › wide › medium › xclose › medium › xclose › two › low › close › low › low › xclose › wide › high › low › side › two

## Places (6)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: single track on gravel ballast hugging a striped red-orange canyon wall, telegraph poles, a green crate with calendar and a blue flag. Light: harsh desert sun, heat haze in summer scenes → `"light": "noon"`. Palette #C8452A #F08A2E #7A6A5E. Key props: rails with gaps, saw, calipers, calendar, thermometer, cane.
   Studio: code set (write `Library/code/<Name>.js`): canyonTrack: rail line on ballast beside a striped red-rock wall; rail segments with editable gap size and heat glow
2. **Exterior**: sheer layered red-rock walls dropping into a deep blue void, half-built steel trestles reaching from both sides. Light: bright sky above, deep blue shadow below → `"light": "noon"`. Palette #1E3FA8 #D2502E #F2B24A. Key props: trestles, girder, crane, arch bridge.
   Studio: code set (write `Library/code/<Name>.js`): canyonGorge: deep layered red-rock chasm with trestle and arch bridge pieces spanning it
3. **Exterior**: flat orange desert with mesas and a distant town. Light: hazy midday sun → `"light": "noon"`. Palette #F0A85A #9CC4EE #C2603A. Key props: mesas, distant station.
   Studio: { "type": "floor" }
4. **Interior**: glass-and-iron train shed in front of a red-brick terminal with clock tower, checker floor, wooden platform, banners. Light: warm daylight through the glass roof → `"light": "morning"`. Palette #A83A2A #E8D8B8 #3A70C8. Key props: FIRST LINE banner, money bags, newspaper, ALL ABOARD sign, trains.
   Studio: code set (write `Library/code/<Name>.js`): trainStation: glass-roof train shed, brick terminal with clock tower, platform, banners
5. **Exterior**: wooden-decked trestle with seamless rails and lamp posts across the canyon, later a steel arch bridge at sunset. Light: midday sun, then pink-orange sunset → `"light": "golden"`. Palette #8A5A4A #E8426A #F5C06A. Key props: seamless rails, golden spike, parasol and deck chair, steam locomotive.
   Studio: code set (write `Library/code/<Name>.js`): trestleDeck: wooden-deck bridge with continuous rails and lamp posts; buckle deformation for the payoff
6. **Interior**: rival car: red velvet seats, lamps, side table with tea; hero car: plain wooden carriage with arched windows. Light: warm lamp glow / daylight through windows → `"light": "homeWarm"`. Palette #C8242C #6A3A2A #F2C46A. Key props: teacup, velvet seats, window frame, line name lettering.
   Studio: code set (write `Library/code/<Name>.js`): carriage: train car interior with seats and windows, posh and plain variants

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 114.9/255, colour saturation 30.6.

## Characters
- **young engineer (hero)**: blue-and-white striped cap, teal waistcoat with red neckerchief. Acting: calm half-smile, stubborn side-eye, nervous sweat in the heat, wide shocked eyes at the end.
- **boss**: black bowler, grey-white hair tuft, gold waistcoat, cane. Acting: squinting inspection, purple face with steam, sweating embarrassment, smug gloating.
- **rival tycoon**: black top hat, black and gold striped suit. Acting: smug wink, blissful tea sipping, lounging, hat flying off in shock.
- **rival crew and passengers**: blue-capped conductor, workers in hats, commuters in bowlers and coats. Acting: busy laying track, lunching on a beam, reading papers, walking off.
- **Extras:** small groups (5-10) of commuters in the station and workers on the beam; no large crowd
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~16% · sign: FIRST LINE IN GETS IT ALL banner states the stakes
- ~41% · label: line name on the rival carriage
- ~44% · label: railway name lettered along the passing train
- ~48% · label: newspaper headline mocks the clattering line
- ~54% · sign: ALL ABOARD placard shows passengers switching
- ~55% · label: MAY calendar marks the season change
- ~58% · label: chalked measurement on the sleeper
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`sparks`, `smoke`, `steam`, `magic`, `fire` (plan beats' `"fx"`). Seen: sawing sparks, train smoke, steam puffs from the boss's head, spike sparks, heat glow on rails, heat haze, rail buckling deformation, derailment fireball, dissolves, whip pans, zoom streaks.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v10-flaw-saves-day"` in the plan.

## Prompts the media team can use
- `/v10-flaw-saves-day tạo video về why sidewalks have cracks cut in them, thoại tiếng Việt, khoảng 65 giây`
- `Dùng skill v10-flaw-saves-day làm video "<chủ đề>", giọng kể hài hước, 45 giây`
