---
name: v01-rule-break-why
description: "2D Studio video recipe 01 — why-explainer: An everyday act in an extreme place has a hidden, disastrous side effect; a newcomer ignores the rule, the consequence looks like a mystery, then the physics behind the rule is explained. Use when the user types /v01-rule-break-why, says 'skill v01', or wants a short about: Strict rules in odd places whose reason is hidden: why divers must not hold their breath going up, why pilots dump fuel before landing, why submarines ban whistling, why you cannot light a match on a gas tanker, why mountaineers do not shout on certain slopes. Always read video-studio first."
---

# v01-rule-break-why · Giải thích "Vì sao…"

Recipe measured frame by frame from reference short #01 (61.3 s, 25 shots, 9 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** An everyday act in an extreme place has a hidden, disastrous side effect; a newcomer ignores the rule, the consequence looks like a mystery, then the physics behind the rule is explained
- **Fits topics like:** Strict rules in odd places whose reason is hidden: why divers must not hold their breath going up, why pilots dump fuel before landing, why submarines ban whistling, why you cannot light a match on a gas tanker, why mountaineers do not shout on certain slopes
- **Signature moves (keep these):**
  - Open on a 'you do X, you never Y' warning over a punchy establishing fly-out
  - Rookie mocks the rule in one line, breaks it in secret, and the result first appears as an eerie mystery
  - Authority bursts in with an alarm screen and a 'who did it' line
  - Second half dives literally inside the object (through floor, through nozzle) to show the physics step by step
  - Ending folds the explanation back onto the opening image

## Script
- **Length:** about 61.3 s (scale to what the user asks), ~204 words at **3.33 words/s** → plan `"pace": 3.3`; sentences ~10.7 words.
- **Voice:** mixed; tone: deadpan, brisk, comic-suspense storytelling that turns into a crisp physical explanation. Narrator says 94% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 3.6 s, you-scenario):** If you do [ordinary act] in [extreme place], you will [catastrophic, out-of-proportion consequence].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–6% | Second-person warning that a mundane act in an extreme place dooms you |
| rule | 6–13% | Authority controls exactly when the act is allowed (countdown, GO) |
| setup | 13–22% | Order says not tonight; the rookie scoffs at it |
| problem | 22–28% | Rookie secretly breaks the rule while the crew sleeps |
| twist | 29–41% | Next morning strange new lights appear that match no chart |
| escalation | 42–53% | Ground control reports they are off course; who did it; every hour costs distance |
| explain | 54–61% | Question asked aloud, then the first fact: no plumbing up here |
| mechanism | 62–71% | Waste vents outside and acts like a small thruster pushing the craft |
| mechanism | 72–90% | Vented liquid freezes into glittering crystals that look exactly like stars |
| payoff | 90–100% | With no satellite navigation, fake stars ruin the only way home |

- **Ending (callback):** Close by tying the mechanism back to the opening mystery: the [fake thing] defeats the [only method] for [getting home/solving it].
- **Devices:** rookie dismisses the rule with a one-line sarcastic quip; absurd scale gap (tiny act, huge consequence); accusing one-liner from authority; guilty sweating face in a porthole; exploded comedic toilet reveal; you-scenario; countdown (3, 1, GO); numbers (hundreds, thousands of miles, millions); question pivot to explanation; simile (like a tiny rocket); callback to the stars

## Camera (one plan beat = one shot)
- **25 shots, median 2 s, longest 5.5 s.** Split long narration into several beats of ~2 s so the picture changes that often.
- **Framing:** medium 28%, wide 28%, extreme-wide 8%, medium-close 8%, insert-object 8%, extreme-close 8%, pov 8%, close 4%
- **Moves:** pull-out 24%, static 20%, push-in 20%, truck 12%, zoom 8%, crane-down 4%, shake 4%, orbit 4%, tilt 4%
- **Transitions:** cut 64%, fly-through 12%, none 8%, zoom-through 8%, dissolve 4%, whip 4%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, static, on rookie astronaut beside the toilet.
- **Shot rhythm in studio ids** (a guide, not a must): medium › reveal › wide › reveal › follow › low › close › crane › xclose › xclose › low › reveal › wide › crane › xclose › side › handheld › orbit › xclose › wide › two › pov › low › pov › behind

## Places (9)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Interior**: small dark-navy compartment, black-and-white checker floor, white toilet centre, sink counter and plant left, round porthole with Earth behind. Light: cool white overheads plus blue earth-light from the window; clean and bright → `"light": "studio"`. Palette #1B2440 #F4F4F4 #111111. Key props: toilet, porthole, checker floor, towel.
   Studio: code set (write `Library/code/<Name>.js`): spaceBathroom: navy panel walls, checker floor, toilet, sink counter, round porthole with Earth
2. **Exterior**: black starfield, big blue-green Earth below, long grey ship with yellow modules and blue solar dishes. Light: hard white sun key from top-left, deep black fill → `"light": "moon"`. Palette #05081A #2E6FD8 #F2C230. Key props: spaceship, Earth, engine flare, sun.
   Studio: code set (write `Library/code/<Name>.js`): orbit: starfield sky, large Earth sphere below, long modular spaceship with solar dishes and engine glow
3. **Interior**: blue room, giant wall screen (world map, trajectory, countdown, alerts), row of consoles with seated controllers, director standing front. Light: cool blue screen glow, office overheads; busy, serious → `"light": "office"`. Palette #2A3A8C #1A2250 #F5A623. Key props: wall screen, mission clocks, consoles, headsets.
   Studio: { "type": "room", "kind": "office" } (recolour walls / floor to fit)
4. **Interior**: off-white tile walls, quilted floor, wall monitor relaying mission control, HEAD sign, stools and table. Light: neutral white overhead, soft shadows → `"light": "office"`. Palette #D9D4CC #C8302B #3DB8C8. Key props: wall monitor, HEAD sign, orange cases.
   Studio: { "type": "room", "kind": "kitchen" } (recolour walls / floor to fit)
5. **Interior**: dark blue corridor, crew in hanging sleeping bags, small windows to space, door to bathroom at back. Light: night: dim blue, a little cool spill from windows → `"light": "moon"`. Palette #0E1640 #2B49B5 #3CB043. Key props: sleeping bags, windows.
   Studio: code set (write `Library/code/<Name>.js`): shipBunks: dark blue corridor with hanging sleeping bags and small windows
6. **Interior**: glass canopy nose, orange-striped seats, control panels, taped star chart. Light: starlight through glass, amber instrument glow → `"light": "moon"`. Palette #1A1F2E #E8792B #9FB4D9. Key props: canopy, seats, radio, star chart, sextant, phone.
   Studio: code set (write `Library/code/<Name>.js`): shipCockpit: faceted glass canopy, 3 seats, console, radio, taped chart
7. **Exterior**: faceted glass canopy seen from outside with crew inside, starfield around. Light: white rim light from sun, glints on glass → `"light": "moon"`. Palette #2B2F3A #C9D6EE #05081A. Key props: canopy glass, crystals.
   Studio: { "type": "room", "kind": "empty" } (recolour walls / floor to fit)
8. **Exterior**: dark grey hull panels with orange stripe, row of lit windows, LODESTAR lettering, hazard-striped vent. Light: hard sunlight, deep space shadow → `"light": "noon"`. Palette #2B2F3A #F07A1A #E8E8F0. Key props: vent nozzle, windows, name lettering, ice crystals.
   Studio: code set (write `Library/code/<Name>.js`): shipHull: panelled hull with stripe, window row, name lettering, vent nozzle
9. **Interior**: crawl space under the bathroom: yellow insulation, corrugated hose to an outlet, WASTE VENT label. Light: cool fill, glowing outlet → `"light": "studio"`. Palette #C79A1C #2B2F3A #BFC7D5. Key props: hose, outlet, labels.
   Studio: { "type": "room", "kind": "empty" } (recolour walls / floor to fit)

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 69.9/255, colour saturation 12.9.

## Characters
- **rookie astronaut (rule breaker)**: swoopy light-brown hair, yellow jumpsuit with NEW GUY name badge, standard bean build. Acting: smug half-smile, eye roll, cocky grin, then sweat drop and wide guilty eyes.
- **flight director**: short black hair, headset, white shirt and tie. Acting: points at screen, stern brows, shouting mouth, arm raised.
- **captain**: blue peaked cap, red jumpsuit, stocky. Acting: unimpressed side-eye, glare from the doorway.
- **navigator**: brown bun with goggles strapped on, purple jumpsuit. Acting: googly shocked eyes, open mouth; later confident with sextant.
- **mission controllers**: four seated staff in blue shirts with headsets, mixed hair. Acting: background reactions, wide eyes.
- **Extras:** 4 seated controllers as background in mission control; otherwise a cast of 4 named characters
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~7% · screen: mission clock sets the controlled, high-stakes world
- ~11% · screen: countdown and GO show the rule is precisely timed
- ~15% · screen: states the rule as an order (NO FLUSHING TONIGHT)
- ~17% · sign: HEAD sign labels the bathroom
- ~42% · screen: incoming call light signals trouble
- ~44% · screen: OFF COURSE alert names the consequence
- ~48% · label: ship name on hull establishes identity
- ~62% · label: vent label points to the mechanism
- ~92% · screen: phone says No GPS Signal: removes the easy solution
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`splash`, `snow`, `pop` (plan beats' `"fx"`). Seen: engine flare, starfield, ice crystal particles, water droplet boil and freeze, snowflake crystal, sun glare, sweat drop, screen shake, dissolve.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v01-rule-break-why"` in the plan.

## Prompts the media team can use
- `/v01-rule-break-why tạo video về why divers must not hold their breath going up, thoại tiếng Việt, khoảng 61 giây`
- `Dùng skill v01-rule-break-why làm video "<chủ đề>", giọng kể hài hước, 45 giây`
