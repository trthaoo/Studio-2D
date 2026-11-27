---
name: v14-reflex-paradox-why
description: "2D Studio video recipe 14 — why-explainer: A champion wins with a rule that sounds backwards; you are put in the loser's shoes and lose instantly; the champion is shown to be unremarkable, then an everyday reflex from your own life explains why waiting and reacting beats deciding. Use when the user types /v14-reflex-paradox-why, says 'skill v14', or wants a short about: Counter-intuitive performance rules explained by the body or brain: why goalkeepers should stay still on penalties, why chess masters move fast, why catching a dropped knife is a bad idea, why boxers watch the chest not the fists, why sprinters lose by anticipating the gun. Always read video-studio first."
---

# v14-reflex-paradox-why · Giải thích "Vì sao…"

Recipe measured frame by frame from reference short #14 (56.1 s, 27 shots, 4 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** A champion wins with a rule that sounds backwards; you are put in the loser's shoes and lose instantly; the champion is shown to be unremarkable, then an everyday reflex from your own life explains why waiting and reacting beats deciding
- **Fits topics like:** Counter-intuitive performance rules explained by the body or brain: why goalkeepers should stay still on penalties, why chess masters move fast, why catching a dropped knife is a bad idea, why boxers watch the chest not the fists, why sprinters lose by anticipating the gun
- **Signature moves (keep these):**
  - Paradox rule hook stated as a one-line code
  - Put the viewer in the loser's boots and lose instantly in a slow-mo faceplant
  - Undercut the champion with a tall-tale insult, then show the same defeat repeated in a row
  - Bridge to an everyday reflex the viewer has felt (catching a falling phone)
  - Visualise the brain as a little office with an operator who hesitates, then empties

## Script
- **Length:** about 56.1 s (scale to what the user asks), ~219 words at **3.9 words/s** → plan `"pace": 3.9`; sentences ~14.6 words.
- **Voice:** second; tone: punchy, playful second-person western with tall-tale jokes, sliding into a calm psychology explanation. All words are voice-over (every beat `"who": null`); the characters never speak, they act with faces and arms.
- **Hook (first 3.4 s, paradox-rule):** The best [role] in [arena] had one rule: never [do the thing everyone thinks wins].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–6% | The top gunslinger's rule is to never draw first |
| setup | 7–23% | You face a man nicknamed slow at noon; his hands hang loose and he politely lets you go first |
| problem | 23–37% | You draw at full speed but are face down before your gun clears; how? |
| escalation | 37–55% | He is not even fast (comic beer-race comparison), yet challengers from far away all fall the same way |
| clue | 55–63% | Only oddity: he watches your hand, never your face |
| analogy | 63–77% | Remember catching a phone sliding off a table before you knew it was falling: your body did it |
| mechanism | 77–86% | Drawing first means choosing the exact moment, and that decision slows you |
| payoff | 86–100% | He decides nothing; he waits for your twitch and lets reflex move his hand |

- **Ending (principle):** [The winner] never decides; he waits for [the trigger] and lets [automatic response] do the work.
- **Devices:** tall-tale insult (loses a race to a man carrying two beers); polite 'after you' before a gunfight; challengers flop over one by one like dominoes; dazed loser with tongue out and dirt-faced imprint; telegraph operator inside the head as a brain office; paradox rule hook; imagine-you second-person scenario; rhetorical question (how is that possible); everyday analogy (phone sliding off a table); contrast decide vs react

## Camera (one plan beat = one shot)
- **27 shots, median 1.5 s, longest 5 s.** Split long narration into several beats of ~1.5 s so the picture changes that often.
- **Framing:** medium 33%, wide 22%, close 19%, medium-close 11%, extreme-close 7%, over-shoulder 4%, pov 4%
- **Moves:** push-in 41%, static 22%, pull-out 11%, tilt 7%, truck 7%, follow 4%, shake 4%, zoom 4%
- **Transitions:** cut 59%, none 19%, dissolve 15%, zoom-through 4%, fly-through 4%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, static, on gunslinger in red fires his revolver into the air.
- **Shot rhythm in studio ids** (a guide, not a must): medium › follow › close › wide › ots › low › medium › xclose › handheld › low › follow › low › follow › two › two › close › high › close › high › close › xclose › pov › reveal › medium › wide › medium › wide

## Places (4)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: old-west main street of wooden false-front stores (feed and livery, bank, photographs), sandy road, telegraph wires, red mesas beyond; noon, sunset and night versions. Light: hard noon sun; later orange sunset with long shadows; final blue night → `"light": "noon"`. Palette #E8C890 #3A6BC8 #8A3A2A. Key props: storefronts, hitching rails, telegraph poles, revolvers, horses.
   Studio: code set (write `Library/code/<Name>.js`): westStreet: sandy main street lined with false-front stores, poles and wires, mesas backdrop
2. **Exterior**: covered boardwalk outside a red saloon with swinging doors, barber pole, beer sign, water trough. Light: bright day, porch shade → `"light": "noon"`. Palette #B8402A #E8D8B0 #3A8AC8. Key props: swinging doors, barber pole, beer mugs, trough.
   Studio: code set (write `Library/code/<Name>.js`): westStreet variant: covered boardwalk with saloon doors, barber pole, trough
3. **Interior**: dim red-papered saloon with round wooden card table, cards and chips, chili bowls, lamps. Light: warm lamp glow, dark corners → `"light": "homeWarm"`. Palette #5A1E2A #B8763A #E8A040. Key props: card table, playing cards, chips, phone, bowls.
   Studio: { "type": "room", "kind": "living" } (recolour walls / floor to fit)
4. **Interior**: teal wooden telegraph office inside the head: two big round porthole windows as eyes, desk with telegraph key and oil lamp, wanted poster, sign above. Light: warm lamp by day, cold blue when empty → `"light": "office"`. Palette #2A7A7A #C88A4A #E8D8A0. Key props: round windows, telegraph key, oil lamp, wanted poster, sign.
   Studio: code set (write `Library/code/<Name>.js`): brainOffice: small wooden room with two big round windows as eyes, telegraph desk, lamp

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 111.7/255, colour saturation 27.3.

## Characters
- **the challenger (you)**: black flat-brim hat, red bib-front shirt, holster. Acting: sweaty nerves, glowing power-up, comic faceplant, dazed tongue-out, smug catch.
- **Slow Eddie (champion)**: tan cowboy hat, moustache, straw in mouth, teal shirt, brown duster. Acting: half-lidded calm, tiny nod, never moves except a minimal draw, slow stroll.
- **brain operator**: green visor, red shirt, moustache. Acting: hesitates, panics, slumps on the desk.
- **duelists**: assorted hats and shirts, on horses. Acting: arrive in a line, fall like dominoes.
- **saloon card players**: purple and yellow shirts, hats. Acting: open-mouthed gasp.
- **beer carrier**: green shirt, white hat. Acting: strolls past Eddie holding two mugs.
- **Extras:** line of 4-6 duelists on horses; otherwise 2-4 characters per shot
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~38% · sign: BEER sign sets up the beer-race joke
- ~55% · sign: PHOTOGRAPHS storefront as street dressing
- ~81% · sign: sign in the brain office warns to think before drawing: the wrong rule
- ~84% · poster: wanted poster of Slow Eddie
- ~97% · sign: FIRST BANK facade marks the street at night
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`flash`, `dust`, `sparks` (plan beats' `"fx"`). Seen: muzzle flash, bullet trail and slow-motion, flaming power-up aura, dust puffs and face imprint in sand, spark glints, dissolves, lighting shift day to night.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v14-reflex-paradox-why"` in the plan.

## Prompts the media team can use
- `/v14-reflex-paradox-why tạo video về why goalkeepers should stay still on penalties, thoại tiếng Việt, khoảng 56 giây`
- `Dùng skill v14-reflex-paradox-why làm video "<chủ đề>", giọng kể hài hước, 45 giây`
