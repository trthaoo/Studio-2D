---
name: v26-loophole-walkthrough
description: "2D Studio video recipe 26 — loophole: Something is officially banned yet happens openly everywhere; walk the viewer through it as a participant, hit the dead end where the rule seems to bite, then follow an insider to the side door that makes it legal on paper. Use when the user types /v26-loophole-walkthrough, says 'skill v26', or wants a short about: Banned things that still happen in plain sight through a technicality: how speakeasies kept serving during prohibition, how sweepstakes cafes run slot games legally, how dry counties sell drinks through private clubs, how ticket resellers dodge price caps with 'free' tickets, how street vendors sell without a licence by 'gifting' goods. Always read video-studio first."
---

# v26-loophole-walkthrough · Lách luật

Recipe measured frame by frame from reference short #26 (45.1 s, 13 shots, 5 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** Something is officially banned yet happens openly everywhere; walk the viewer through it as a participant, hit the dead end where the rule seems to bite, then follow an insider to the side door that makes it legal on paper
- **Fits topics like:** Banned things that still happen in plain sight through a technicality: how speakeasies kept serving during prohibition, how sweepstakes cafes run slot games legally, how dry counties sell drinks through private clubs, how ticket resellers dodge price caps with 'free' tickets, how street vendors sell without a licence by 'gifting' goods
- **Signature moves (keep these):**
  - Paradox hook over a fly-up from the street to an aerial of the venues everywhere
  - Second-person walkthrough: you win, then hit the dead end where the rule seems to bite
  - Follow a cool insider out the door into an alley to the unmarked side business
  - Wide pull-out showing the two businesses side by side as the legal reveal
  - Close on the swap, then an official log ticked NONE as a deadpan punchline

## Script
- **Length:** about 45.1 s (scale to what the user asks), ~161 words at **3.57 words/s** → plan `"pace": 3.6`; sentences ~14.6 words.
- **Voice:** second-person; tone: wry, conspiratorial walkthrough that ends on a dry legal punchline. All words are voice-over (every beat `"who": null`); the characters never speak, they act with faces and arms.
- **Hook (first 4.2 s, paradox):** [Activity] is illegal in [place], yet there is a [venue for it] on nearly every [street/corner].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–9% | Paradox: the activity is banned but its venues are everywhere |
| setup | 11–30% | Inside, endless machines and players hauling buckets of balls; police walk by and do nothing |
| problem | 31–53% | You win and try to cash out, but the counter only offers snacks, toiletries or small tokens |
| follow | 53–71% | A regular takes the tokens outside and you trail him to an unmarked window in a wall |
| reveal | 71–90% | That window is legally a separate business that merely buys those tokens; the hall only hands out prizes |
| payoff | 90–100% | Tokens in, cash out, and officially no gambling ever took place |

- **Ending (ironic-punchline):** Show the swap in one quick action, then deadpan that, on paper, [banned thing] never happened.
- **Devices:** police stroll past the door unbothered; absurdly mundane prize list (snacks, shampoo); sunglasses fixer who clearly knows the trick; clipboard log ticked NONE; alley cat watching the deal; paradox opener; second-person walkthrough; list of prizes; 'you see' reveal pivot; technically / on paper legalism; follow-the-insider structure

## Camera (one plan beat = one shot)
- **13 shots, median 3 s, longest 7.5 s.** Split long narration into several beats of ~3 s so the picture changes that often.
- **Framing:** medium 69%, wide 15%, extreme-wide 8%, close 8%
- **Moves:** push-in 38%, truck 15%, static 15%, crane-up 8%, pan 8%, follow 8%, pull-out 8%
- **Transitions:** cut 69%, fly-through 15%, none 8%, whip 8%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, push-in, on lit token window in the dark alley, fixer and customers, cat and crates.
- **Shot rhythm in studio ids** (a guide, not a must): medium › crane › follow › low › side › follow › medium › two › follow › ots › reveal › close › two

## Places (5)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: narrow wet night alley: concrete walls, AC units, vending machine, crates of bottles, red lantern, small lit service window with no sign. Light: cool blue night with warm spill from the window and purple neon → `"light": "moon"`. Palette #2A2F6B #F4C46A #7A4FD0. Key props: service window, vending machine, bottle crates, lantern, cat, bicycle.
   Studio: code set (write `Library/code/<Name>.js`): nightAlley: narrow wet alley, AC units, vending machine, bottle crates, red lantern, small lit service window
2. **Exterior**: rain-slick city street at night, rows of buildings with vertical neon signs and down arrows, crossings, cars. Light: deep blue night, pink and yellow neon, wet reflections → `"light": "neon"`. Palette #0E1A4A #E8337A #F2C230. Key props: neon signs, arrow signs, parking sign, cars.
   Studio: code set (write `Library/code/<Name>.js`): neonStreet: city street at night with building rows, vertical neon signs and arrows, wet road
3. **Interior**: very long aisle of vertical pachinko machines with red stools, patterned red carpet, ceiling light strips converging to a vanishing point. Light: bright warm fluorescent strips, glowing machine screens → `"light": "office"`. Palette #8C1F1F #F3D9A4 #1A1A1A. Key props: pachinko machines, red stools, ball buckets, number signs.
   Studio: code set (write `Library/code/<Name>.js`): arcadeAisle: long aisle of upright machines with red stools, patterned carpet, ceiling light strips
4. **Exterior**: arcade storefront with PRIZE HALL and NEW MACHINES signs, glass doors showing the bright interior, posters. Light: purple dusk neon outside, warm light through the door → `"light": "neon"`. Palette #3A2A7A #C9A14A #E23A5A. Key props: PRIZE HALL sign, glass doors, posters.
   Studio: code set (write `Library/code/<Name>.js`): storefront: shop facade with big sign boards and glass doors showing a lit interior
5. **Interior**: prize booth inside the hall: shelves of colourful snacks and toiletries, glass case, PRIZE COUNTER sign, exit door with THANK YOU sign, welcome mat. Light: warm bright interior, counter glow → `"light": "homeWarm"`. Palette #F1E6D2 #E8402A #3BA0D8. Key props: prize shelves, cash register, tokens, shampoo bottle, exit door.
   Studio: { "type": "room", "kind": "shop" } (recolour walls / floor to fit)

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 89.5/255, colour saturation 21.8.

## Characters
- **player (the 'you')**: brown bowl haircut, orange hoodie, camera strap across chest. Acting: grin when winning, puzzled frown at the counter, side-eye, curious follow.
- **token regular / fixer**: black flat cap, dark sunglasses, purple jacket. Acting: cool smirk, unhurried walk, slides tokens through.
- **police officer**: blue peaked cap with star, blue uniform. Acting: content smile, strolls by, holds the log.
- **prize clerk**: black bob, dark vest, constant smile. Acting: cheerful, presents prizes.
- **players**: assorted bean-shaped patrons, old lady with white hair and glasses. Acting: background, carrying buckets, queuing at the window.
- **Extras:** rows of seated players filling the pachinko aisle; small queue at the alley window
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~6% · sign: neon arcade signs and arrows show venues everywhere
- ~10% · sign: machine number and price signs establish the hall
- ~23% · sign: PRIZE HALL / NEW MACHINES storefront names the place
- ~37% · sign: PRIZE COUNTER labels where cash should be paid
- ~53% · sign: THANK YOU exit sign marks the way out
- ~60% · sign: KARAOKE sign dresses the back alley
- ~91% · sign: small OPEN sign on the unmarked window
- ~96% · label: log reading GAMBLING: NONE with a tick is the punchline
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`magic` (plan beats' `"fx"`). Seen: neon glow and bloom, wet street reflections, pouring steel balls, depth-of-field blur, warm window light shaft.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v26-loophole-walkthrough"` in the plan.

## Prompts the media team can use
- `/v26-loophole-walkthrough tạo video về how speakeasies kept serving during prohibition, thoại tiếng Việt, khoảng 45 giây`
- `Dùng skill v26-loophole-walkthrough làm video "<chủ đề>", giọng kể hài hước, 45 giây`
