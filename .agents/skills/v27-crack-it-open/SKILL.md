---
name: v27-crack-it-open
description: "2D Studio video recipe 27 — science-of: You keep suffering a near-miss that feels personal; open up the machine and show the hidden table that makes the near-miss far more common than the win. Use when the user types /v27-crack-it-open, says 'skill v27', or wants a short about: Everyday frustrations secretly built into a device: why claw machines drop the prize, why scratch cards show so many near wins, why loot boxes nearly give the rare item, why the crosswalk button seems to do nothing, why printers say the ink is empty early. Always read video-studio first."
---

# v27-crack-it-open · Khoa học đằng sau

Recipe measured frame by frame from reference short #27 (31 s, 14 shots, 2 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** You keep suffering a near-miss that feels personal; open up the machine and show the hidden table that makes the near-miss far more common than the win
- **Fits topics like:** Everyday frustrations secretly built into a device: why claw machines drop the prize, why scratch cards show so many near wins, why loot boxes nearly give the rare item, why the crosswalk button seems to do nothing, why printers say the ink is empty early
- **Signature moves (keep these):**
  - Second-person near-miss hook on an extreme close of the result, then the player's grin collapsing
  - Repeat the frustration once and add a friend with confident bad advice
  - Say 'let's open it' and zoom straight through the front into the device's insides
  - Turn the hidden rule into a physical printout with a tally counter racing up
  - Morph the printout into a wheel inside an x-ray of the machine, then pull back to the deadpan player

## Script
- **Length:** about 31 s (scale to what the user asks), ~112 words at **3.62 words/s** → plan `"pace": 3.6`; sentences ~11.2 words.
- **Voice:** second-person; tone: relatable, mildly sarcastic, then a calm inside-the-machine explanation. Narrator says 96% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 4.4 s, you-scenario):** You just saw [two of the winning symbols] land and the [last one] stop [a hair] short.
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–14% | You nearly win: two jackpot symbols and the third stops just off |
| setup | 15–26% | Next machine, identical near-miss |
| escalation | 27–42% | A friend claims the machine is just warming up, so you feed it more money |
| suspicion | 42–57% | It feels deliberate, so the narrator proposes opening the machine |
| mechanism | 59–74% | Inside is a list of every stopping place for the last reel; the jackpot appears only once |
| mechanism | 75–83% | The just-missed position is listed again and again |
| payoff | 83–100% | So each spin is far likelier to stop just short than to hit |

- **Ending (comparison-punchline):** State the rigging as a comparison: every [try], the [machine] is far likelier to land on [near-miss] than on [prize].
- **Devices:** friend's confident bad advice; grin collapsing to deadpan; machine treated as a teasing person; tally counter racing up while stamps pile on; player growling at the machine; you-scenario; repetition (over and over); let's-open-it-up pivot; once vs many contrast; comparative conclusion

## Camera (one plan beat = one shot)
- **14 shots, median 2.25 s, longest 4 s.** Split long narration into several beats of ~2.25 s so the picture changes that often.
- **Framing:** medium 43%, insert-object 29%, extreme-close 14%, wide 7%, close 7%
- **Moves:** push-in 36%, pull-out 21%, static 21%, crane-down 7%, tilt 7%, zoom 7%
- **Transitions:** cut 57%, none 21%, whip 7%, zoom-through 7%, match-cut 7%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** insert-object, eye angle, pull-out, on reels stop: two sevens on the line, third just off.
- **Shot rhythm in studio ids** (a guide, not a must): xclose › low › crane › two › dutch › xclose › low › close › reveal › xclose › reveal › xclose › medium › reveal

## Places (2)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Interior**: rows of red-and-gold LUCKY 7s slot machines with red stools, patterned carpet, giant progressive jackpot LED ticker, coffered ceiling with spotlights. Light: warm amber casino glow, bulb marquees, glowing reels → `"light": "neon"`. Palette #B3201C #F2B632 #2A1A14. Key props: slot machines, red stools, jackpot ticker, SPIN button, bill slot.
   Studio: code set (write `Library/code/<Name>.js`): casinoFloor: rows of slot machines with reels and jackpot marquees, red stools, patterned carpet, LED ticker
2. **Interior**: plywood inside of the slot cabinet: three-reel unit, green circuit board, wires, bill validator, long printed stop list. Light: warm glow from behind the reels, soft amber → `"light": "homeWarm"`. Palette #E6B86A #2E8B3A #E8402A. Key props: reel unit, paper strip, tally counter, stamp, circuit board.
   Studio: code set (write `Library/code/<Name>.js`): slotInterior: plywood cabinet interior with reel unit, circuit board, wires and a printed stop list

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 109.1/255, colour saturation 34.6.

## Characters
- **gambler (the 'you')**: spiky black hair, teal shirt with yellow leaf print, red tie, lanyard badge. Acting: wide grin, flat disappointed stare, suspicious side-eye, angry growl, deadpan.
- **buddy**: red backwards cap, sunglasses, gold chain, beige suit. Acting: leans in with a knowing smirk and wink.
- **Extras:** none; a background patron or two in the machine rows
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~0% · screen: PLAY 3 CREDITS panel sets the slot machine
- ~18% · screen: progressive jackpot ticker climbing raises the stakes
- ~37% · label: SPIN button and $100 bill show money going in
- ~44% · screen: CREDITS 95 shows money draining
- ~58% · label: REEL UNIT label marks the inside of the machine
- ~63% · label: REEL 3: EVERY STOP list is the mechanism
- ~68% · label: 7 JACKPOT x1 highlights the single winning stop
- ~74% · label: ONE CLICK SHORT stamps with counter x00 to x14 show the repetition
- ~84% · label: wheel slices labelled ONE CLICK SHORT show the odds
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`magic` (plan beats' `"fx"`). Seen: bulb marquee glow, motion-blurred spinning reels, x-ray wireframe overlay, strip-to-wheel morph, depth-of-field blur.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v27-crack-it-open"` in the plan.

## Prompts the media team can use
- `/v27-crack-it-open tạo video về why claw machines drop the prize, thoại tiếng Việt, khoảng 31 giây`
- `Dùng skill v27-crack-it-open làm video "<chủ đề>", giọng kể hài hước, 45 giây`
