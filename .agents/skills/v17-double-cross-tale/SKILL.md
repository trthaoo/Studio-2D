---
name: v17-double-cross-tale
description: "2D Studio video recipe 17 — con-trick: A historical safety device is set up as a horror mystery, the crowd dismisses the alarm, then it is revealed the 'victim' staged it as a scam and the trusted accomplice quietly double-crosses him and keeps everything. Use when the user types /v17-double-cross-tale, says 'skill v17', or wants a short about: Historical devices or customs retold as a scam with a betrayal twist: a message in a bottle that was really a ransom plan, a shipwreck insurance fraud where the partner kept the cargo, a lighthouse keeper's signal lamp used for smuggling, a fake kidnapping where the 'rescuer' walks off with the money, a dowsing rod con whose assistant sells the land. Always read video-studio first."
---

# v17-double-cross-tale · Mánh lừa

Recipe measured frame by frame from reference short #17 (59.6 s, 26 shots, 12 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** A historical safety device is set up as a horror mystery, the crowd dismisses the alarm, then it is revealed the 'victim' staged it as a scam and the trusted accomplice quietly double-crosses him and keeps everything
- **Fits topics like:** Historical devices or customs retold as a scam with a betrayal twist: a message in a bottle that was really a ransom plan, a shipwreck insurance fraud where the partner kept the cargo, a lighthouse keeper's signal lamp used for smuggling, a fake kidnapping where the 'rescuer' walks off with the money, a dowsing rod con whose assistant sells the land
- **Signature moves (keep these):**
  - Shock one-liner hook, then a cutaway diagram (soil cross-section) to explain the historical device
  - Comic crowd dismisses the alarm (you go check / no you go) and an expert explains it away
  - Cut to the one person who is not reacting, sitting still in the dark, to signal she knows
  - Echo question (wait, practised?) flips into a flashback reveal of the scam
  - Second twist told by time passing on her still face, ending on a sunrise payoff line

## Script
- **Length:** about 59.6 s (scale to what the user asks), ~220 words at **3.69 words/s** → plan `"pace": 3.7`; sentences ~12.2 words.
- **Voice:** third-person; tone: dark-comic gothic suspense with deadpan dialogue and a cold double-twist. Narrator says 93% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 3 s, shock-statement):** They [did a horrifying thing] to a man, with [odd device] attached to him.
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–5% | A man was buried alive wearing a bell on his finger |
| context | 5–17% | Explains the old fear of waking in a coffin and the bell-on-a-string safety graves |
| problem | 17–25% | His bell rings in the middle of the night; the neighbour blames the wind |
| escalation | 26–36% | Ringing speeds up, the street comes out, everyone pushes someone else to check |
| dismissal | 36–45% | Hauled-out doctor insists corpses twitch, he personally signed the death |
| twist | 46–60% | The wife is not outside; she sits in the dark with a shovel and recognises a rehearsed ring pattern |
| reveal | 60–77% | He faked death to escape debts; she was meant to dig him up and flee with him |
| second-twist | 77–90% | She stays seated all night as the ringing slows and stops at dawn |
| payoff | 91–100% | With him buried, the debts are buried too and the house is all hers |

- **Ending (double-twist-punchline):** With [schemer] gone for good, [his problem] vanished with him and [the accomplice] kept [the prize].
- **Devices:** neighbours bickering 'you go check' back and forth; doctor in pyjamas dismissing the alarm with smug certainty; a corpse grinning in the coffin, practising the bell signal; wife's totally unbothered face while the bell rings; flashback of the bribed death certificate; you see explainer aside; rhythmic signal pattern (three short, one long); echo question (wait, practised?); a list that slows down (quick, slower, then rare); pun-like closer: debts buried with him

## Camera (one plan beat = one shot)
- **26 shots, median 1.75 s, longest 6.06 s.** Split long narration into several beats of ~1.75 s so the picture changes that often.
- **Framing:** wide 35%, medium 35%, close 15%, medium-close 8%, extreme-wide 4%, insert-object 4%
- **Moves:** push-in 35%, static 31%, pull-out 15%, crane-down 4%, crane-up 4%, tilt 4%, truck 4%, orbit 4%
- **Transitions:** cut 42%, dissolve 27%, none 19%, fly-through 12%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** wide, eye angle, static, on smirking red-haired man in suit beside an open grave with a gravedigger.
- **Shot rhythm in studio ids** (a guide, not a must): wide › crane › crane › side › close › low › medium › close › wide › two › wide › medium › reveal › wide › close › xclose › medium › wide › close › reveal › wide › close › medium › high › low › orbit

## Places (12)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: autumn grass, open grave beside a dirt pile, wooden bell post, farmhouse and fence behind. Light: warm purple-orange dusk → `"light": "golden"`. Palette #C98A2E #7A4A2A #C9A6D8. Key props: open grave, coffin, bell post, string.
   Studio: code set (write `Library/code/<Name>.js`): graveyard: grass plot with open grave, dirt pile, bell posts with string, headstones, fence
2. **Exterior**: side cutaway: grass strip, orange soil layers with worms and stones, coffins below, row of bell posts against a sunset. Light: flat diagram light, sunset sky → `"light": "studio"`. Palette #D9682A #3B5BA9 #6FB04A. Key props: coffins, bell posts, strings, neighbour's window.
   Studio: code set (write `Library/code/<Name>.js`): graveCutaway: side cutaway of soil layers with coffins and bell posts above
3. **Exterior**: snowy cemetery, picket fence, headstones, blue houses, wooden bell post with nameplate. Light: blue moonlight, snowfall → `"light": "moon"`. Palette #1E3A8C #E8EEF8 #D9A62E. Key props: bell, nameplate, headstones.
   Studio: code set (write `Library/code/<Name>.js`): graveyard (snow variant)
4. **Interior**: sloped wooden attic, patchwork quilt bed, candles on nightstand, frosty window. Light: warm candlelight against blue window → `"light": "homeWarm"`. Palette #8A5A32 #D64032 #F2C25A. Key props: bed, quilt, candles, nightcap.
   Studio: { "type": "room", "kind": "living" } (recolour walls / floor to fit)
5. **Exterior**: row of colourful Victorian houses in snow, lit porches, pine trees, doctor's sign. Light: blue night with warm porch lights → `"light": "moon"`. Palette #2B49B5 #F2F2FA #E8A632. Key props: lanterns, houses, death certificate.
   Studio: { "type": "house" }
6. **Exterior**: wooden front porch with hanging lanterns, railing, view down the lit street. Light: warm lantern light → `"light": "homeWarm"`. Palette #3E7A6E #C8302B #F2B13C. Key props: lantern, shovel.
   Studio: { "type": "house" }
7. **Exterior**: dark purple house with bay window, notice on door, steps, picket fence in snow. Light: dark blue night, no porch light → `"light": "moon"`. Palette #2A2A6E #4B4BA0 #E8EEF8. Key props: bay window, door notice.
   Studio: { "type": "house" }
8. **Interior**: floral wallpaper, rocking chair on round rag rug, side table with tea, stove, shovel by door, wall bell and notes. Light: dark blue with a sliver of moonlight across faces, stove glow → `"light": "moon"`. Palette #3A2F6E #6E2A4A #E8A632. Key props: rocking chair, shovel, bell, tea set.
   Studio: { "type": "room", "kind": "living" } (recolour walls / floor to fit)
9. **Interior**: same parlour in daylight: open coffin on sawhorses, colourful rug, sunny window. Light: bright daylight → `"light": "noon"`. Palette #9FD0E8 #C9883E #E85A3A. Key props: coffin, practice bell, certificate, banknote.
   Studio: { "type": "room", "kind": "living" } (recolour walls / floor to fit)
10. **Exterior**: sunny lawn with vegetable beds and a long queue of townsfolk, houses behind. Light: bright noon → `"light": "noon"`. Palette #6FB04A #9FD0F0 #E8792B. Key props: crowd, garden beds.
   Studio: { "type": "floor" }
11. **Exterior**: purple house, white picket fence, dirt bed with cabbages, WEST signpost. Light: bright sunny day → `"light": "noon"`. Palette #7A4A9A #6FB04A #8A5A32. Key props: dirt grave, shovel, WEST sign.
   Studio: { "type": "house" }
12. **Exterior**: snowy cemetery at sunrise, fresh mound, bell post, green and red houses behind. Light: soft pink-gold sunrise → `"light": "morning"`. Palette #F2C2C8 #7A2A4A #F2E8E0. Key props: mound, shovel, bell, bluebird.
   Studio: code set (write `Library/code/<Name>.js`): graveyard (snow variant)

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 106.6/255, colour saturation 30.4.

## Characters
- **debtor who fakes his death**: orange swoop hair, handlebar moustache, black suit. Acting: sly grin, gleeful practice ringing, wink.
- **widow (double-crosser)**: dark bun, plum high-necked dress. Acting: completely still, half-lidded calm, faint smile at the end.
- **neighbour**: striped nightcap and pyjamas. Acting: startled eyes, shrug, back to sleep.
- **doctor**: round glasses, striped pyjamas. Acting: dragged, then smug lecturing with certificate.
- **porch neighbours**: moustached man in red coat, woman in teal and pink with lantern, child. Acting: sweat drop, arguing.
- **gravedigger**: brown hat, blue overalls. Acting: deadpan.
- **Extras:** small groups on porches and around the doctor (3-5); one queue of 12+ creditors on the town green
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~17% · label: nameplate S. HOLT with dates ties the bell to the dead man
- ~44% · prop: CERTIFICATE OF DEATH is the doctor's proof
- ~59% · prop: handwritten signal code note reveals the rehearsal
- ~67% · prop: certificate with banknote reveals the bribe
- ~76% · sign: WEST signpost shows the planned escape
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`snow`, `magic` (plan beats' `"fx"`). Seen: snowfall, bell swing, dirt particles, flying papers and debt notes, light band across eyes, dissolves for time passing, sunrise glow.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v17-double-cross-tale"` in the plan.

## Prompts the media team can use
- `/v17-double-cross-tale tạo video về a message in a bottle that was really a ransom plan, thoại tiếng Việt, khoảng 60 giây`
- `Dùng skill v17-double-cross-tale làm video "<chủ đề>", giọng kể hài hước, 45 giây`
