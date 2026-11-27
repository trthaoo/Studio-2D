---
name: v30-odd-ritual-why
description: "2D Studio video recipe 30 — science-of: A bizarre ritual sounds like self-sabotage; walk through it step by step, reveal a famous person did it on purpose, then explain the hidden brain state it exploits and the payoff. Use when the user types /v30-odd-ritual-why, says 'skill v30', or wants a short about: Strange habits that turn out to be smart: why some athletes nap just before a match, why chess players take walks between games, why writers work standing up, why divers hum before a deep dive, why pilots take exactly timed naps. Always read video-studio first."
---

# v30-odd-ritual-why · Khoa học đằng sau

Recipe measured frame by frame from reference short #30 (39.1 s, 11 shots, 5 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** A bizarre ritual sounds like self-sabotage; walk through it step by step, reveal a famous person did it on purpose, then explain the hidden brain state it exploits and the payoff
- **Fits topics like:** Strange habits that turn out to be smart: why some athletes nap just before a match, why chess players take walks between games, why writers work standing up, why divers hum before a deep dive, why pilots take exactly timed naps
- **Signature moves (keep these):**
  - Conditional promise hook on a smug face under a single spotlight
  - Deadpan step-by-step demo of the ritual on one minimal stage
  - X-ray body shot showing the moment the ritual triggers
  - Name-drop a famous user with a wink, then turn the hidden state into a labelled cross-section
  - Visualise the payoff (string board of ideas) and end on an object-swap pun

## Script
- **Length:** about 39.1 s (scale to what the user asks), ~145 words at **3.71 words/s** → plan `"pace": 3.7`; sentences ~14.5 words.
- **Voice:** second-person; tone: deadpan instructional with a playful twist and a neat wordplay ending. All words are voice-over (every beat `"who": null`); the characters never speak, they act with faces and arms.
- **Hook (first 4.6 s, promise):** If you [do odd ritual with odd objects], you might wake up [with a superpower].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–12% | Odd promise: a ritual with two steel balls could make you a genius |
| setup | 12–36% | Step-by-step: plates on the floor, sit above them, ball in each hand, drift off |
| problem | 36–48% | The weird part: falling asleep drops the balls and the crash wakes you |
| twist | 49–60% | Sounds terrible, but a famous inventor reportedly did it on purpose |
| mechanism | 60–83% | Before deep sleep the brain passes a halfway state that links unusual ideas |
| mechanism | 83–92% | Normally you sink past it and forget, but the crash pulls you out mid-state |
| payoff | 92–100% | Pun payoff: you come to with the idea in hand, not the steel balls |

- **Ending (wordplay-callback):** Swap line: you wake up holding [the payoff] instead of [the ritual object].
- **Devices:** smug confident face at the bizarre promise; worst-nap-ever aside; famous inventor winking; startled jolt with sound rings; object-swap pun ending; conditional promise hook; procedural steps (first, then); 'here's the weird part' pivot; authority name-drop; coined term with on-screen label; normally / but contrast; wordplay callback

## Camera (one plan beat = one shot)
- **11 shots, median 3 s, longest 6.5 s.** Split long narration into several beats of ~3 s so the picture changes that often.
- **Framing:** medium 36%, wide 27%, close 18%, pov 9%, insert-object 9%
- **Moves:** pull-out 27%, push-in 27%, static 27%, crane-down 9%, pan 9%
- **Transitions:** cut 91%, none 9%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, pull-out, on man under a bare bulb pulls back to reveal chair, plates and balls on a target rug, then back to his smug face.
- **Shot rhythm in studio ids** (a guide, not a must): reveal › wide › pov › wide › close › medium › crane › close › xclose › medium › medium

## Places (5)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Interior**: dark green panelled room, single bare bulb, wooden chair on a brown-and-cream target-ring rug, side stools, portrait frames. Light: single hanging bulb spotlight, deep shadow → `"light": "studio"`. Palette #1E2A24 #C98A3A #2E4FA0. Key props: bare bulb, wooden chair, steel balls, metal plates, target rug.
   Studio: { "type": "room", "kind": "empty" } (recolour walls / floor to fit)
2. **Interior**: old wooden workshop with shelves of jars, phonograph horns, stools, MENLO PARK sign, hanging bulbs. Light: warm tungsten bulbs, dusty glow → `"light": "homeWarm"`. Palette #5A3A1E #E8B060 #1A1410. Key props: phonograph horns, shelves, chair, plates.
   Studio: code set (write `Library/code/<Name>.js`): oldWorkshop: wooden lab with shelves of jars, phonograph horns, stools, hanging bulbs
3. **Exterior**: cross-section of deep water as sleep stages with depth ruler, labels and brainwave line, debris floating in a mystery band. Light: cool underwater caustics fading to dark → `"light": "moon"`. Palette #2E9CA8 #1A2A6A #6A4AB0. Key props: depth ruler, stage labels, brainwave trace, floating debris.
   Studio: code set (write `Library/code/<Name>.js`): depthDiagram: water cross-section with labelled layers, depth ruler and wave line
4. **Interior**: corkboard covered with pinned picture cards (key, boot, duck, truck, magnet) joined by red string. Light: warm even light → `"light": "homeWarm"`. Palette #C98A4A #F2E8D2 #D9342B. Key props: cards, red string, pins, MAGNET CAR card.
   Studio: { "type": "room", "kind": "office" } (recolour walls / floor to fit)
5. **Interior**: wood-panelled old lift with brass gate, floor dial marked by sleep stages, doors opening onto lit floors labelled HYPNAGOGIA and DEEP SLEEP. Light: warm ceiling lamp, purple glow from the open doors → `"light": "homeWarm"`. Palette #5A2A1A #C93A2A #6A4AB0. Key props: floor dial, brass gate, chair, plates.
   Studio: code set (write `Library/code/<Name>.js`): oldLift: panelled lift with brass gate, floor dial, doors opening onto labelled floors

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 72.3/255, colour saturation 15.5.

## Characters
- **napper (the 'you')**: brown side-parted hair, blue sweater, bean body. Acting: smug half-smile, sleepy eyes, startled jolt, annoyed deadpan, big grin.
- **famous inventor**: white swept-back hair, black suit, bow tie. Acting: dozing, sly wink.
- **Extras:** none
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~55% · sign: laboratory sign identifies the inventor's workshop
- ~61% · label: AWAKE / LIGHT SLEEP / DEEP SLEEP depth labels
- ~64% · label: BRAIN WAVES trace
- ~69% · label: HYPNAGOGIA names the state
- ~73% · label: picture cards name ideas being linked
- ~78% · label: MAGNET CAR card is the invented idea
- ~82% · label: lift floors labelled HYPNAGOGIA and DEEP SLEEP
- ~93% · label: MAGNET CAR sketch as the trophy
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`magic`, `splash` (plan beats' `"fx"`). Seen: x-ray body overlay, sound rings from the crash, glowing nerve jolt, underwater caustics, eyelid blink vignette, light bloom.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v30-odd-ritual-why"` in the plan.

## Prompts the media team can use
- `/v30-odd-ritual-why tạo video về why some athletes nap just before a match, thoại tiếng Việt, khoảng 39 giây`
- `Dùng skill v30-odd-ritual-why làm video "<chủ đề>", giọng kể hài hước, 45 giây`
