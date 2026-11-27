---
name: v07-scam-origin-story
description: "2D Studio video recipe 07 — con-trick: A schemer exploits a rule everyone assumes (the one who looks guilty always gets the blame), repeats and scales the scam with growing greed, the payer grows suspicious but cannot prove anything, until one quiet target has a simple device that records the truth; the last line names that device's origin. Use when the user types /v07-scam-origin-story, says 'skill v07', or wants a short about: Clever scams that were eventually beaten by a simple invention, or the origin of everyday safety devices: why receipts say 'keep this copy', how store security tags started, why bank notes got a metal strip, why parcels get photographed on the doorstep, why casinos put cameras over every table. Always read video-studio first."
---

# v07-scam-origin-story · Mánh lừa

Recipe measured frame by frame from reference short #07 (62.3 s, 22 shots, 9 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** A schemer exploits a rule everyone assumes (the one who looks guilty always gets the blame), repeats and scales the scam with growing greed, the payer grows suspicious but cannot prove anything, until one quiet target has a simple device that records the truth; the last line names that device's origin
- **Fits topics like:** Clever scams that were eventually beaten by a simple invention, or the origin of everyday safety devices: why receipts say 'keep this copy', how store security tags started, why bank notes got a metal strip, why parcels get photographed on the doorstep, why casinos put cameras over every table
- **Signature moves (keep these):**
  - Cold open on the scam's key act and its first payout, with the hidden rule it exploits stated plainly
  - Greed ladder montage: repeat, pick better victims, add an accomplice, buy something just to wreck it
  - Comic suspicion beat (phone call, counter sign reset) where the scammer still wins
  - Quiet target who does nothing but point at a small object; scammer's sweaty close-up
  - Final line names the everyday invention as the origin, on a push-in to the device

## Script
- **Length:** about 62.3 s (scale to what the user asks), ~238 words at **3.82 words/s** → plan `"pace": 3.8`; sentences ~14 words.
- **Voice:** third-person with second-person asides; tone: brisk, sly, gleeful crime caper narrated deadpan, ending on a quiet mic-drop. Narrator says 94% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 4.4 s, shocking-act-in-media-res):** He deliberately did [reckless act] in [busy place], and [innocent person] [suffered the obvious consequence].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–7% | A driver brakes hard on purpose and gets rear-ended |
| mechanism | 7–29% | He fakes a neck injury because the rear driver is always blamed; their insurer pays for car, doctor and a fat cheque |
| escalation | 29–52% | He repeats it weekly, chooses distracted or nervous targets, adds an accomplice to block swerving, and buys a better car just to crash it |
| suspicion | 52–74% | Insurer phones about his fifth neck injury, he jokes back; it is his word against the other driver's and he relies on the blame rule |
| twist | 74–89% | Rainy morning, he targets a quiet man in an old car who stays calm and simply points at a small box on his windshield |
| payoff | 89–99% | It is a camera showing an empty road and a man braking for no reason; this is named as the origin of the dashcam |

- **Ending (origin-reveal):** The [simple object] recorded [the truth the scam depended on hiding], and that's how [everyday device] came to be.
- **Devices:** exaggerated fake limp and neck clutch; money raining and piling up in the driveway; buying a nicer car just to crash it; insurer phone call with a deadpan excuse reply; office sign counting days since his last neck injury resetting to zero; scammer lounging in a pool with a rubber duck; silent, unbothered victim versus sweating scammer; rule stated as common belief (the one behind always gets blamed); list of three target types; escalation ladder (again, accomplice, nicer car); short dialogue exchange as comic beat; contrast of quiet target against loud scammer; origin line as final sentence

## Camera (one plan beat = one shot)
- **22 shots, median 2.75 s, longest 5 s.** Split long narration into several beats of ~2.75 s so the picture changes that often.
- **Framing:** medium 59%, wide 23%, pov 14%, close 5%
- **Moves:** static 64%, truck 18%, pull-out 9%, push-in 9%
- **Transitions:** cut 68%, dissolve 14%, fly-through 9%, none 5%, wipe 5%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, high angle, static, on smirking driver in yellow shirt stomps the brake.
- **Shot rhythm in studio ids** (a guide, not a must): high › reveal › medium › pov › two › wide › two › side › follow › side › medium › wide › close › medium › two › wide › side › pov › high › close › pov › close

## Places (9)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Interior**: sporty red-and-black cabin with digital gauges, phone mount showing the time, sunlit windshield. Light: bright daylight through glass → `"light": "noon"`. Palette #C8202C #1A1A1E #4FA6E8. Key props: steering wheel, brake pedal, phone clock.
   Studio: code set (write `Library/code/<Name>.js`): carInterior: driver seat, wheel, dash gauges, windshield; reusable for both cars with colour swaps
2. **Exterior**: multi-lane grey highway with white dashes, concrete sound wall, power poles, trees, puffy clouds. Light: hard noon sun, deep blue sky → `"light": "noon"`. Palette #8E9096 #2F7BE0 #4C9A3A. Key props: red sedan, white SUV, teal hatchback, lane markings.
   Studio: { "type": "highway" }
3. **Exterior**: white clapboard houses, lawn, sidewalk, red car parked at the kerb. Light: sunny daylight → `"light": "noon"`. Palette #F2F2EE #4FAE3A #2F7BE0. Key props: PAID briefcase, hospital bed, cheque, cash shower.
   Studio: { "type": "house" }
4. **Exterior**: busy highway with traffic, guardrail, houses and pines beyond, purple-pink sky. Light: golden-violet sunset, headlights on → `"light": "golden"`. Palette #7A5BC8 #2B2440 #E8325A. Key props: red car, teal car, black pickup.
   Studio: { "type": "highway" }
5. **Exterior**: suburban house with round attic vent and open garage, driveway buried in stacks of cash. Light: first day, then night with garage and porch glow → `"light": "moon"`. Palette #1E2A6E #9ADB2E #5DA86A. Key props: money pile, green sports car with bow, white van, smoke.
   Studio: { "type": "house" }
6. **Interior**: wood-panelled office with framed photos, green desk, floor-to-ceiling window onto skyscrapers. Light: cool daylight from window → `"light": "office"`. Palette #8A4A2A #5BB5A8 #BFD6EE. Key props: desk phone, 'days since' counter sign, name plaque.
   Studio: { "type": "room", "kind": "office" } (recolour walls / floor to fit)
7. **Exterior**: night pool deck with string lights, house siding, palm, blue water. Light: warm string lights, blue pool glow → `"light": "moon"`. Palette #1A2A55 #2FC0E0 #F5C542. Key props: pool, rubber duck, string lights, phone.
   Studio: code set (write `Library/code/<Name>.js`): poolDeck: rectangular pool, deck, string lights, house wall
8. **Exterior**: wet grey highway in rain, trees, misty sky. Light: flat overcast with rain, red tail-lights → `"light": "overcast"`. Palette #5E7486 #2B3440 #C02020. Key props: old wood-panelled wagon, red car, dashcam overlay, wiper.
   Studio: { "type": "highway" }
9. **Interior**: beige cloth seats, old dashboard, small camera box taped to the windshield. Light: soft grey daylight through rain → `"light": "overcast"`. Palette #C9B994 #6A6E70 #3A70B8. Key props: dashcam, coffee cup, steering wheel.
   Studio: code set (write `Library/code/<Name>.js`): carInterior (old-car variant) with a small dashcam box on the windshield

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 103.6/255, colour saturation 23.4.

## Characters
- **scammer**: brown bowl hair, yellow shirt, later sunglasses on head. Acting: cocky smirk, theatrical pain wail, gleeful dancing, sweat drop and flat shock at the end.
- **rear drivers (victims)**: various: green shirt, glasses and green vest, nervous kid. Acting: panicked wide eyes, nervous sweating.
- **insurance agent**: slick black hair, navy suit and red tie. Acting: smug, then suspicious squint on the phone.
- **doctor**: white coat, grey hair. Acting: unimpressed side glance.
- **patrol officer**: campaign hat, grey uniform. Acting: stern frown, writing notes.
- **quiet driver (hero)**: dark curly hair, maroon jacket. Acting: half-lidded calm, sips coffee, simply points, tiny smirk at the end.
- **Extras:** light highway traffic of instanced cars; no crowds of people, cast of 2-3 per scene
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~1% · screen: dashboard phone clock grounds the moment
- ~17% · label: PAID on the insurer's briefcase shows the scam works
- ~53% · sign: 'days since neck injury' desk counter jokes about repeat claims, resets to 0
- ~89% · screen: dashcam REC, date and speed overlay proves the footage
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`confetti`, `smoke`, `rain`, `pop` (plan beats' `"fx"`). Seen: crash debris, money shower and piles, smoke from wreck, rain, wiper sweep, dashcam HUD overlay, sweat drop, dissolves, wipe.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v07-scam-origin-story"` in the plan.

## Prompts the media team can use
- `/v07-scam-origin-story tạo video về why receipts say 'keep this copy', thoại tiếng Việt, khoảng 62 giây`
- `Dùng skill v07-scam-origin-story làm video "<chủ đề>", giọng kể hài hước, 45 giây`
