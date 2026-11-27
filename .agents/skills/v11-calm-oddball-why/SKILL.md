---
name: v11-calm-oddball-why
description: "2D Studio video recipe 11 — why-explainer: Under a deadly threat, a calm oddball does something that looks absurd and steers everyone toward an even bigger danger; everyone mocks him, the danger peaks, then a kitchen-scale demo explains the real trick and the threat destroys the mockers instead. Use when the user types /v11-calm-oddball-why, says 'skill v11', or wants a short about: Odd old tricks that look crazy until explained: why miners carried canaries, why Vikings kept sunstones, why desert travellers wore black robes, why old ships carried cats, why sailors whistled for wind. Always read video-studio first."
---

# v11-calm-oddball-why · Giải thích "Vì sao…"

Recipe measured frame by frame from reference short #11 (64.6 s, 30 shots, 6 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** Under a deadly threat, a calm oddball does something that looks absurd and steers everyone toward an even bigger danger; everyone mocks him, the danger peaks, then a kitchen-scale demo explains the real trick and the threat destroys the mockers instead
- **Fits topics like:** Odd old tricks that look crazy until explained: why miners carried canaries, why Vikings kept sunstones, why desert travellers wore black robes, why old ships carried cats, why sailors whistled for wind
- **Signature moves (keep these):**
  - Open mid-chase on the hero doing something absurd and harmless-looking
  - A calm one-line refrain from the hero against everyone's panic and the villain's gloating
  - Escalate the threat in two steps until a single giant danger hangs over both sides
  - Cut to a cosy kitchen-scale demo with a labelled prop and a top-down zoom that dives back into the big scene
  - Payoff: the danger rolls past the hero and lands on the mockers

## Script
- **Length:** about 64.6 s (scale to what the user asks), ~246 words at **3.81 words/s** → plan `"pace": 3.8`; sentences ~13.7 words.
- **Voice:** third; tone: fast deadpan adventure narration, comic contempt from the villains, then a cosy kitchen explanation and a triumphant reversal. Narrator says 89% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 3.9 s, absurd-action):** He did [silly, harmless-looking act] while [lethal threat] was right behind them.
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–6% | The cook pours kitchen oil into the sea while pirates close in |
| setup | 6–17% | Pirates laugh; the captain grabs the cook and mocks him for cooking at a time like this; the cook stays calm |
| problem | 17–27% | The cook points at black clouds and says head into the storm; the captain says it is suicide |
| escalation | 27–41% | Cook just says to trust the oil; a grappling hook lands, the captain turns into the storm and the pirate captain gloats the storm will do his work |
| escalation | 41–60% | Waves grow taller than the mast, crew lash themselves down, cook keeps pouring on the windward side, pirates swing over to board |
| twist | 60–71% | A monster wave rises over both ships; narrator reveals this oil was a real sailor tool |
| mechanism | 71–87% | Named, then shown with a soup bowl: blowing ripples broth but oily spots stay flat because wind cannot grip them, so waves cannot build |
| payoff | 87–100% | The wave just lifts their ship over the slick and breaks fifty yards back, right onto the pirate deck |

- **Ending (reversal):** The danger the mockers counted on passes harmlessly under the hero and lands squarely on [the mockers].
- **Devices:** deadpan cook who never looks up; captain's exasperated soup jab; villain gloats the disaster will do his job for free; kitchen object used as the secret weapon; karmic wave lands on the laughers; in-media-res hook; repeated calm refrain (trust the oil); you-see pivot from story to fact; second-person everyday analogy (blowing on soup); precise number in the payoff (50 yards)

## Camera (one plan beat = one shot)
- **30 shots, median 2 s, longest 5.5 s.** Split long narration into several beats of ~2 s so the picture changes that often.
- **Framing:** wide 43%, medium 30%, close 7%, extreme-wide 7%, over-shoulder 3%, medium-close 3%, insert-object 3%, extreme-close 3%
- **Moves:** static 40%, push-in 27%, pull-out 10%, crane-up 7%, truck 7%, tilt 3%, orbit 3%, zoom 3%
- **Transitions:** cut 70%, dissolve 17%, zoom-through 7%, none 3%, whip 3%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, low angle, static, on cook in toque tips a copper pot of oil over the rail.
- **Shot rhythm in studio ids** (a guide, not a must): low › follow › reveal › two › crane › close › medium › high › ots › high › low › medium › low › behind › wide › high › two › orbit › crane › low › wide › wide › medium › close › high › xclose › low › follow › wide › wide

## Places (6)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: wooden deck of a red-and-cream merchant ship, striped red-white sails, ship's wheel, teal railing, coiled rope, life ring; daytime then rainy night. Light: bright noon sun at first, later dark blue storm with lanterns → `"light": "noon"`. Palette #C98A3E #C8302B #2B4FA8. Key props: ship's wheel, copper pot, railing, life ring, mast.
   Studio: code set (write `Library/code/<Name>.js`): shipDeck: planked deck with wheel, masts with striped sails, railings, lanterns, life ring; day and storm variants
2. **Exterior**: red and cream hull planks with brass portholes running down to bright blue water. Light: sunny, crisp shadows → `"light": "noon"`. Palette #C8302B #F2E6C8 #2A9BE0. Key props: hull, portholes, oil stream, splash.
   Studio: code set (write `Library/code/<Name>.js`): shipHull: painted wooden hull with portholes meeting a water plane
3. **Exterior**: turquoise sea, islands on horizon, black pirate ship with orange patched sails and a dog-skull flag and figurehead. Light: noon sun, clear sky → `"light": "noon"`. Palette #2A9BE0 #F07A1A #1A1A1A. Key props: pirate ship, dog figurehead, skull sail, grappling hook.
   Studio: code set (write `Library/code/<Name>.js`): openSea: animated water plane, sky with islands, second ship (pirate) with patched sails and figurehead
4. **Exterior**: red-railed pirate deck with stacked cannonballs, powder kegs, pirates with mugs, overcast sky. Light: grey overcast, storm darkening behind → `"light": "overcast"`. Palette #C8202B #B8864A #2A2E3A. Key props: cannonballs, mugs, parrot, feathered hat.
   Studio: code set (write `Library/code/<Name>.js`): shipDeck variant: red rails, cannonball stack, kegs
5. **Exterior**: night ocean of huge stylised blue waves, rain streaks, two ships tiny under a cresting wave wall. Light: deep blue moonlight, white god-rays at the climax, lantern glints → `"light": "moon"`. Palette #1A2A9C #3A6BE0 #E8F0FF. Key props: giant wave, oil slick, two ships, rain.
   Studio: code set (write `Library/code/<Name>.js`): stormSea: night ocean with tall wave meshes, rain, god-ray light, wave wall that can curl
6. **Interior**: warm wooden ship kitchen: plank walls, brass porthole with storm outside, stove with orange pot, counter with soup bowl and STORM OIL can, hanging lantern. Light: warm lantern and window glow, cosy → `"light": "homeWarm"`. Palette #C88A4A #F2D8A0 #C8302B. Key props: porthole, stove, soup bowl, STORM OIL can, lantern.
   Studio: { "type": "room", "kind": "kitchen" } (recolour walls / floor to fit)

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 105.1/255, colour saturation 42.5.

## Characters
- **ship's cook (calm hero)**: tall white chef's toque, white apron, bean body, flat unimpressed half-lidded eyes. Acting: never flinches, eyes closed, slight smirk, pours slowly, explains with a can like a cooking show.
- **merchant captain**: blue bicorne with red roundel, blue double-breasted coat, big moustache. Acting: grabs collar, sweat drops, yells, spins the wheel.
- **pirate captain**: red-and-gold coat, black tricorne with huge white feather. Acting: smug gloating speech, hands on hips.
- **pirate crew**: bandana, mugs, one with parrot, orange shirts. Acting: laughing, toasting, swinging on ropes, then floating in the wreckage.
- **merchant crew**: red bandana sailor, yellow raincoat sailor. Acting: clinging and tied to posts, gritted teeth.
- **Extras:** small pirate crew of 4-5 and 2-3 merchant sailors; no large crowd
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~72% · label: STORM OIL can names the real tool
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`splash`, `rain`, `magic`, `bubbles`, `smoke`, `pop` (plan beats' `"fx"`). Seen: oil stream and splash, rain streaks, giant stylised wave, oil slick glow, god-rays, soup ripple rings, bubbles, cartoon explosion and smoke, sweat drops, dissolves.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v11-calm-oddball-why"` in the plan.

## Prompts the media team can use
- `/v11-calm-oddball-why tạo video về why miners carried canaries, thoại tiếng Việt, khoảng 65 giây`
- `Dùng skill v11-calm-oddball-why làm video "<chủ đề>", giọng kể hài hước, 45 giây`
