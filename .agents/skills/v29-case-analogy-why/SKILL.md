---
name: v29-case-analogy-why
description: "2D Studio video recipe 29 — why-explainer: A cheater fakes data to look random and still gets caught; an everyday object models the hidden pattern real data follows, a second rule is added, and his fakes break both. Use when the user types /v29-case-analogy-why, says 'skill v29', or wants a short about: Hidden statistical tells that expose fakes or habits: why invented expense reports get flagged, why fake reviews are easy to spot, why people choose the same passwords, why forged signatures look too steady, why made-up alibis have too many details. Always read video-studio first."
---

# v29-case-analogy-why · Giải thích "Vì sao…"

Recipe measured frame by frame from reference short #29 (47.2 s, 17 shots, 6 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** A cheater fakes data to look random and still gets caught; an everyday object models the hidden pattern real data follows, a second rule is added, and his fakes break both
- **Fits topics like:** Hidden statistical tells that expose fakes or habits: why invented expense reports get flagged, why fake reviews are easy to spot, why people choose the same passwords, why forged signatures look too steady, why made-up alibis have too many details
- **Signature moves (keep these):**
  - You-warning hook on an extreme close of the fake being made, with a magnifier that makes it sweat
  - Quick true case: the scheme pays off, then the handcuffs arrive
  - 'But how?' pivot into a big physical analogy (a building's buttons) that the character walks through
  - Fly out of the analogy into a city-scale reveal where giant digits are sized by frequency
  - Second rule with a physical demo, then charts that show the cheat did the opposite, ending back at the cell

## Script
- **Length:** about 47.2 s (scale to what the user asks), ~165 words at **3.5 words/s** → plan `"pace": 3.5`; sentences ~13.8 words.
- **Voice:** mixed; tone: clever detective-style explainer with light crime-caper comedy. All words are voice-over (every beat `"who": null`); the characters never speak, they act with faces and arms.
- **Hook (first 3.4 s, you-scenario):** If you ever [fake X], there is a way to tell a [person] made it up.
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–7% | Warning that invented numbers can always be detected |
| case | 8–21% | A man steals millions with fake checks made to look random and is still caught |
| analogy | 21–32% | Question pivot, then picture a 19-floor building and its elevator buttons |
| mechanism | 33–51% | Floors 2-9 each start differently but 1 and 10-19 all start with 1: over half |
| generalize | 52–61% | Real numbers behave like that panel, so leading 1s dominate |
| mechanism | 61–75% | Second rule: real randomness is streaky, e.g. long runs of heads in coin flips |
| twist | 75–90% | His amounts mostly started with 7-9 and avoided repeats, the opposite of real data |
| payoff | 91–100% | However random you try to be, it can almost always be spotted |

- **Ending (callback):** Generalise back to the viewer: no matter how hard you try to [fake X], there is almost always a way to [detect it].
- **Devices:** digits sweating under the magnifier; car stuffed with cash at the drive-through; handcuffs delivered by the bank tube; smug grin collapsing into panic; carefully avoiding doubles to look random; you-scenario; true-case example; 'but how?' question pivot; concrete analogy (elevator); numbers and counts; 'on top of that' second rule; contrast 'the opposite'; callback to the hook

## Camera (one plan beat = one shot)
- **17 shots, median 2.5 s, longest 9 s.** Split long narration into several beats of ~2.5 s so the picture changes that often.
- **Framing:** medium 65%, insert-object 12%, wide 12%, extreme-wide 12%
- **Moves:** push-in 47%, static 18%, crane-down 12%, truck 12%, crane-up 6%, pull-out 6%
- **Transitions:** cut 65%, none 12%, fly-through 12%, dissolve 6%, whip 6%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** insert-object, high angle, static, on pen writes an amount on a check.
- **Shot rhythm in studio ids** (a guide, not a must): xclose › medium › low › crane › medium › medium › crane › two › medium › crane › reveal › wide › high › follow › close › follow › medium

## Places (6)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Interior**: teal office with window blinds, ACCOUNTS PAYABLE nameplate, wooden desk, employee-of-the-month frame, days-without counter. Light: warm sunlight through blinds → `"light": "morning"`. Palette #2E8C8C #E8A93A #7A4A2A. Key props: desk, check, pen, magnifier, nameplate.
   Studio: { "type": "room", "kind": "office" } (recolour walls / floor to fit)
2. **Exterior**: desert bank with mid-century canopy, pneumatic tube lane, video teller, LED money sign, peach car. Light: bright desert noon → `"light": "noon"`. Palette #F2A07A #2E8C8C #F2E2B8. Key props: pneumatic tube, video teller, LED sign, car full of cash, handcuffs.
   Studio: code set (write `Library/code/<Name>.js`): driveThruBank: bank canopy, tube lane with video teller, LED sign, car
3. **Interior**: holding cell with chain-link or bar wall, bench, numbers scribbled on the back wall. Light: flat cool overhead, warm wall glow → `"light": "office"`. Palette #5A6A8A #D9A05A #2A2A3A. Key props: bars, bench, scribbled numbers.
   Studio: code set (write `Library/code/<Name>.js`): jailCell: bars wall, bench, scribbled wall
4. **Exterior**: 19-storey retro tower with huge floor numbers down its face, glass elevator, THE ONE sign, desert town and palms around. Light: noon, later sunset over the desert → `"light": "noon"`. Palette #E8904A #2E9CA8 #F5D9A8. Key props: tower, floor numbers, glass elevator, giant digits, police car.
   Studio: code set (write `Library/code/<Name>.js`): numberTower: tall tower with painted floor numbers, glass elevator, desert town around
5. **Interior**: round brass glass elevator with ornate button panel (THE ONE), city view through glass. Light: warm daylight through glass → `"light": "noon"`. Palette #E8C08A #B36A2A #3AA8C8. Key props: button panel, brass rails.
   Studio: code set (write `Library/code/<Name>.js`): glassElevator: round glass car with brass rails and a tall button panel
6. **Interior**: top-floor office (floor 19) with tall windows on a sunset desert, AUDIT desk, coin board, bar charts of digits. Light: golden sunset through tall windows → `"light": "golden"`. Palette #F2A06A #7A4AB0 #5A3A2A. Key props: AUDIT desk, coin board, digit bar chart, lamp.
   Studio: { "type": "room", "kind": "office" } (recolour walls / floor to fit)

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 147.2/255, colour saturation 25.9.

## Characters
- **check fraudster**: dark side-swept hair, mustard jacket, striped tie. Acting: smug grin, sweat and wobbly mouth when caught, confident pointing, nervous writing.
- **auditor**: red bun, round glasses, purple suit. Acting: calm, knowing smile, explains charts, magnifier.
- **police officer**: blue cap, blue uniform. Acting: stern escort.
- **video teller**: small face on a screen. Acting: background.
- **Extras:** none; two or three characters per scene
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~0% · label: check amount being written
- ~1% · sign: ACCOUNTS PAYABLE nameplate names his job
- ~7% · screen: bank LED sign counts the stolen total up
- ~19% · label: VIDEO TELLER sign
- ~24% · label: floor numbers 1-19 on the tower face set the analogy
- ~31% · label: THE ONE elevator panel
- ~54% · label: giant digits 1-9 scaled by frequency
- ~61% · sign: AUDIT desk sign and floor 19
- ~68% · label: 10x10 coin board
- ~75% · label: digit axis on the bar chart
- ~83% · label: his made-up amount on paper
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`pop`, `magic` (plan beats' `"fx"`). Seen: sweat drops, magnifier distortion, button glow, sunset glow, dissolve, pencil ring highlight, growing bar chart.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v29-case-analogy-why"` in the plan.

## Prompts the media team can use
- `/v29-case-analogy-why tạo video về why invented expense reports get flagged, thoại tiếng Việt, khoảng 47 giây`
- `Dùng skill v29-case-analogy-why làm video "<chủ đề>", giọng kể hài hước, 45 giây`
