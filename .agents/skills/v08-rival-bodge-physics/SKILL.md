---
name: v08-rival-bodge-physics
description: "2D Studio video recipe 08 — science-of: Two rivals build the same new machine; disaster strikes the night before launch and the hero bodges a fix by instinct, the rival sabotages him, and on launch day the hidden physics (explained by an everyday analogy) makes the bodge and the sabotage save the hero while the 'perfect' version fails. Use when the user types /v08-rival-bodge-physics, says 'skill v08', or wants a short about: Engineering shapes whose odd form hides physics: why highway exit ramps spiral, why dam walls curve, why bridges are arched instead of flat, why airplane windows are round, why ski jumps curve at the bottom, why racetracks bank their corners. Always read video-studio first."
---

# v08-rival-bodge-physics · Khoa học đằng sau

Recipe measured frame by frame from reference short #08 (63.2 s, 30 shots, 5 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** Two rivals build the same new machine; disaster strikes the night before launch and the hero bodges a fix by instinct, the rival sabotages him, and on launch day the hidden physics (explained by an everyday analogy) makes the bodge and the sabotage save the hero while the 'perfect' version fails
- **Fits topics like:** Engineering shapes whose odd form hides physics: why highway exit ramps spiral, why dam walls curve, why bridges are arched instead of flat, why airplane windows are round, why ski jumps curve at the bottom, why racetracks bank their corners
- **Signature moves (keep these):**
  - Hook on the hero 'ruining' his own creation, then a crushed test dummy the night before launch
  - Cartoon rivalry: copycat rival, a secret sabotage the audience sees and the hero does not
  - Pivot with 'you see' into an everyday analogy filmed as its own mini scene (car on a hairpin)
  - Glowing highlight drawn on the danger spot of the structure while the camera flies through it
  - Ironic finish: hero glides through, rival's perfect version explodes, smug look back

## Script
- **Length:** about 63.2 s (scale to what the user asks), ~236 words at **3.73 words/s** → plan `"pace": 3.7`; sentences ~13.9 words.
- **Voice:** third-person with second-person asides; tone: playful, cheeky rivalry tale with suspense, then a clear analogy-led physics explanation and an ironic punchline. All words are voice-over (every beat `"who": null`); the characters never speak, they act with faces and arms.
- **Hook (first 2.3 s, strange-act-in-media-res):** He deliberately [damaged / deformed] the [part that should be perfect] of his [invention].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–4% | A builder hammers his coaster loop out of shape |
| setup | 4–15% | It is the first ride to turn people upside down, it ruined him financially, and a rival copies it exactly |
| problem | 15–24% | Night before opening the test dummy returns crushed, yet he cannot postpone |
| fix | 24–33% | He beats the loop's bottom into a long gentle curve; narrator admits he has no real idea why |
| sabotage | 33–45% | The rival laughs, sneaks over and squeezes the loop tall and narrow so the first cart will break |
| climax | 45–65% | Opening morning: crowds line up at the rival's perfect circle, rival rides up front; the hero rides his own and only now sees the narrow loop, too late |
| explain | 65–82% | Analogy: a car takes a sharp bend slowly but flips at speed; a cart is fastest at a loop's bottom, where a circle puts the sharpest bend |
| mechanism | 82–91% | His gentle bottom plus the rival's squeeze moved the sharp bend to the top, where the cart is slow |
| payoff | 91–99% | He glides over safely while the competitor's car slams into the base of the perfect circle |

- **Ending (ironic-reversal):** The hero [comes through unharmed] thanks to [the sabotage + his bodge], just as the rival's [perfect version] [fails at the exact weak point explained].
- **Devices:** showing an empty wallet with a grin; narrator asks if he knows what he is doing and answers 'not really'; villainous rival with cigar and telescope; rival riding up front under a FIRST sign to show off; test dummy crushed like a can; mushroom-cloud explosion behind the smug hero; 'you see' pivots into explanation; everyday analogy with concrete speeds (slow vs fast on a hairpin); simile (crushed like a can, snap like a twig); dramatic irony: audience sees the sabotage, hero does not; callback to the crushed dummy; perfect vs imperfect contrast

## Camera (one plan beat = one shot)
- **30 shots, median 2 s, longest 5 s.** Split long narration into several beats of ~2 s so the picture changes that often.
- **Framing:** medium 43%, wide 43%, close 7%, pov 3%, extreme-wide 3%
- **Moves:** static 37%, push-in 30%, follow 10%, truck 7%, pull-out 3%, crane-up 3%, tilt 3%, orbit 3%, pan 3%
- **Transitions:** cut 80%, dissolve 13%, none 3%, fly-through 3%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, low angle, static, on builder in red cap and overalls swings a mallet at the track.
- **Shot rhythm in studio ids** (a guide, not a must): low › wide › crane › medium › close › wide › high › medium › wide › low › medium › low › wide › low › low › follow › wide › two › medium › follow › pov › medium › high › wide › side › follow › close › orbit › high › behind

## Places (5)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: dirt lot in green hills with a dark steel loop, wooden lift tower and platform; same set at night with string lights and full moon. Light: bright day sun; night scenes under a full moon with coloured bulbs → `"light": "noon"`. Palette #3B3F4A #5DA83A #C9643A. Key props: steel loop, wooden lift tower, red UPSIDE-DOWNER cart, mallet, chair.
   Studio: code set (write `Library/code/<Name>.js`): coasterSite: dirt lot in hills, editable loop track (circle / clothoid / squeezed), wooden lift tower, cart
2. **Exterior**: grassy fairground with a white lattice coaster, perfect circle loop, crane, ferris wheel and stalls. Light: clear midday sun; one night shot with lantern and bulbs → `"light": "noon"`. Palette #F2F4F7 #5BB83A #2F7BE0. Key props: perfect circle loop, blueprint easel, telescope, FIRST sign, ferris wheel.
   Studio: code set (write `Library/code/<Name>.js`): fairground: white lattice coaster with perfect loop, ferris wheel, stalls (shares coaster track code)
3. **Interior**: wooden station shed with plank floor, track pit, tin roof, OPENING TOMORROW banner. Light: night: warm bulb string under the roof, blue night outside → `"light": "moon"`. Palette #7A4A2A #1E2A55 #D8322F. Key props: banner, test cart, crushed dummy, tree-stump block, mallet.
   Studio: code set (write `Library/code/<Name>.js`): coasterStation: plank platform shed with roof, banner, track pit
4. **Exterior**: brick plaza with red carpet, striped stalls, flags, balloons, GRAND OPENING arch, ferris wheel. Light: bright morning sun, festive → `"light": "morning"`. Palette #C8242C #F5C542 #2F7BE0. Key props: red carpet, confetti, balloons, GRAND OPENING banner.
   Studio: code set (write `Library/code/<Name>.js`): midway: brick plaza, red carpet, stalls, balloons, entrance arch
5. **Exterior**: two-lane asphalt hairpin on a green hillside with guardrail and pines. Light: bright noon → `"light": "noon"`. Palette #5A5C63 #6DAA4A #F2C230. Key props: curve warning sign, vintage car, hot rod.
   Studio: { "type": "highway" }

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 107.2/255, colour saturation 27.3.

## Characters
- **builder (hero)**: red cap, brown hair, blue overalls with patches over yellow shirt. Acting: manic grin while hammering, proud wallet grin, sweat, shrug, calm upside down, final smirk.
- **rival**: slick dark hair, pale trench coat, cigar. Acting: villain grin, cackling laugh, sneaky crouch, arrogant wave from the front seat.
- **townsfolk**: assorted bean figures, one in blue uniform with a girl in a checked dress. Acting: smiling, queuing, background cheer.
- **drivers (analogy)**: grey-haired driver in a teal vintage car; red hot rod. Acting: cautious creep vs reckless flip.
- **Extras:** small queue of 6-10 townsfolk at the opening; otherwise two main characters
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~12% · label: copied blueprint on the rival's easel shows the theft
- ~16% · sign: OPENING TOMORROW banner sets the deadline
- ~47% · sign: GRAND OPENING arch marks launch day
- ~50% · sign: FIRST! placard mocks the show-off rival
- ~56% · label: UPSIDE-DOWNER on the cart names the ride
- ~66% · sign: hairpin warning sign anchors the analogy
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`sparks`, `magic`, `confetti`, `explosion` (plan beats' `"fx"`). Seen: hammer sparks, loop morph from round to skinny, glowing highlight on the dangerous bend, night string lights, confetti, crash debris, explosion and mushroom cloud, dissolves.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v08-rival-bodge-physics"` in the plan.

## Prompts the media team can use
- `/v08-rival-bodge-physics tạo video về why highway exit ramps spiral, thoại tiếng Việt, khoảng 63 giây`
- `Dùng skill v08-rival-bodge-physics làm video "<chủ đề>", giọng kể hài hước, 45 giây`
