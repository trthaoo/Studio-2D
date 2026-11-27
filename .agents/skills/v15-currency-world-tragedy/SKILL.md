---
name: v15-currency-world-tragedy
description: "2D Studio video recipe 15 — other:what-if-world: In a world where an intangible thing is literal currency, a poor hero sells more and more of it to save someone he loves; the final sale succeeds but costs him the very bond he was protecting. Use when the user types /v15-currency-world-tragedy, says 'skill v15', or wants a short about: What-if worlds where something intangible is money: time as currency, sleep sold to the rich, years of life traded for rent, voices sold to celebrities, dreams auctioned at night. Always read video-studio first."
---

# v15-currency-world-tragedy · what if world

Recipe measured frame by frame from reference short #15 (77.9 s, 32 shots, 7 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** In a world where an intangible thing is literal currency, a poor hero sells more and more of it to save someone he loves; the final sale succeeds but costs him the very bond he was protecting
- **Fits topics like:** What-if worlds where something intangible is money: time as currency, sleep sold to the rich, years of life traded for rent, voices sold to celebrities, dreams auctioned at night
- **Signature moves (keep these):**
  - One-line hook of the hero selling something priceless at a counter
  - Rapid world-rules montage with joke prices and a wall splitting rich and poor
  - A planted shared memory (photo, story) shown once in warm golden light
  - Escalating sales tracked by a prop (meter, passbook with SOLD stamps) as the loved one worsens
  - Bittersweet twist: the rescue works but erases the bond, shot in split warm and cold light

## Script
- **Length:** about 77.9 s (scale to what the user asks), ~295 words at **3.79 words/s** → plan `"pace": 3.8`; sentences ~11.3 words.
- **Voice:** third; tone: wry world-building with dark jokes, turning sombre and tragic; quiet gut-punch ending. Narrator says 94% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 3.2 s, absurd-action):** He sold his [most precious intangible] to a stranger behind a counter.
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–4% | He trades away his happiest memory at a shop counter |
| world | 4–16% | Memories are money: extraction shops on every corner, rent paid in birthdays, groceries cost a childhood milestone |
| world | 17–35% | A wall splits the city: the rich buy other people's summers (a man with 300 beach trips from his couch), the poor stare at photos of smiles they cannot recall |
| rule | 35–43% | Happier memories pay more; Jerry only sold one for rent |
| problem | 43–54% | His little brother falls ill and every night asks for the story of the giant frog summer at the lake |
| escalation | 54–64% | Medicine costs more; he trades away the summer memory for about a week, his best birthday for the surgery |
| escalation | 64–74% | He sells whole years until only bad days remain; the brother worsens to the last good year |
| climax | 74–84% | Even the dealer warns him there is nothing happy left; he sells it and it pays for everything |
| payoff | 84–100% | Cured, the brother asks for the frog story, and Jerry does not recognise him, because the brother was in every happy year |

- **Ending (tragic-twist):** The cure works, but [the person saved] asks for [the shared memory], and the hero no longer knows who they are, because they were part of everything he sold.
- **Devices:** rent paid in birthdays, groceries cost a bike-riding day; rich man has visited the Bahamas 300 times from his couch, tally counter; grinning hooded dealer like a pawnbroker; you-see world-rules exposition; concrete price list of intangibles; planted memory (frog story) that pays off; escalating sales in rule of three (summer, birthday, years); final two-line reveal with callback

## Camera (one plan beat = one shot)
- **32 shots, median 2.25 s, longest 5 s.** Split long narration into several beats of ~2.25 s so the picture changes that often.
- **Framing:** medium 53%, insert-object 16%, wide 16%, close 9%, medium-close 3%, extreme-close 3%
- **Moves:** push-in 47%, static 22%, pull-out 16%, truck 6%, tilt 6%, orbit 3%
- **Transitions:** cut 44%, dissolve 38%, none 13%, fly-through 3%, zoom-through 3%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, static, on red-haired Jerry at a dark counter, hooded dealer behind.
- **Shot rhythm in studio ids** (a guide, not a must): medium › high › close › reveal › medium › follow › low › wide › low › medium › reveal › high › medium › close › follow › two › xclose › wide › close › medium › high › medium › orbit › two › xclose › two › close › two › xclose › medium › close › two

## Places (7)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Interior**: cramped dark pawnshop: wooden counter, wall of small glowing drawers, extraction machine with a brass happiness gauge, chrome dome helmet on an arm, neon MEMORIES bought and sold sign. Light: low green-shaded lamp and warm machine glow in darkness → `"light": "horror"`. Palette #1E2440 #E8A040 #3A4A8A. Key props: counter, memory cards, drawer wall, happiness meter, helmet, neon sign.
   Studio: { "type": "room", "kind": "shop" } (recolour walls / floor to fit)
2. **Exterior**: rainy night tenement street with fire escapes, deli with red awning, memory shops with glowing windows, bus stop bench, hydrant, bunting, giant wall at the end. Light: blue rainy night with warm shop windows and street lamps → `"light": "moon"`. Palette #2A3A9C #E8A050 #B8302A. Key props: deli, bench, bike, hydrant, bus stop sign, wall.
   Studio: code set (write `Library/code/<Name>.js`): nightCityStreet: wet tenement street with fire escapes, lit shopfronts, awnings, bench, bus stop, giant wall at the end
3. **Exterior**: sunny resort pool, palms, pink flower hedges, terraced gold buildings, sun loungers, flamingo float. Light: bright noon sun → `"light": "noon"`. Palette #3AD0D8 #F2E2A0 #E84A8A. Key props: pool, loungers, palms, flamingo float, tray of cards.
   Studio: code set (write `Library/code/<Name>.js`): poolTerrace: pool plane, loungers, palms, flower hedges, terraced towers
4. **Interior**: white minimalist lounge, big window to the sea and pool, white couch, brass memory dome on a stand, tally counter on a tray. Light: airy daylight → `"light": "morning"`. Palette #F4F4F4 #3AB8E0 #C8902A. Key props: couch, memory dome, tally counter, window.
   Studio: { "type": "room", "kind": "living" } (recolour walls / floor to fit)
5. **Interior**: small ward with metal bed and red blanket, IV stand, medicine dose meter, bedside lamp, wall covered in photos of the brothers. Light: cold blue night, later warm morning sun stripe; split warm/cold at the end → `"light": "moon"`. Palette #2A3AA8 #F2C880 #B8302A. Key props: bed, IV stand, dose meter, photo wall, polaroid, passbook.
   Studio: code set (write `Library/code/<Name>.js`): hospitalRoom: bed, IV stand, monitor gauge, bedside lamp, photo wall
6. **Interior**: teal-tiled corridor, checker floor, double doors with OPERATING sign, coin-op payment box on a post. Light: cool fluorescent, red sign glow → `"light": "office"`. Palette #3A9A8A #E8F0E8 #D8302A. Key props: payment box, OPERATING sign, doors.
   Studio: code set (write `Library/code/<Name>.js`): hospitalCorridor: tiled corridor, double doors with lit sign, payment box
7. **Exterior**: golden sunset lake with a wooden dock, lily pads, reeds, distant trees, framed as a polaroid. Light: golden hour sun flare → `"light": "golden"`. Palette #F2C060 #3A7AC8 #7AB04A. Key props: dock, net, frog, lily pads.
   Studio: code set (write `Library/code/<Name>.js`): lakeDock: sunset lake plane, wooden dock, lily pads, reeds

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 96/255, colour saturation 24.6.

## Characters
- **Jerry (seller)**: spiky red-orange hair, mustard-yellow jacket with frog badge. Acting: nervous, tears, resolved, finally blank polite stranger.
- **little brother**: small, red-orange hair, green frog hat, hospital gown. Acting: laughing, sick and pale, cured and beaming.
- **memory dealer**: dark hood, huge white grin, later hood down: bald, worried. Acting: creepy grin, then genuine concern.
- **rich buyers**: sun hat and shades; snorkel mask and Hawaiian shirt; butler in white. Acting: blissful, lounging.
- **poor residents**: landlord with cap, woman in teal, elderly on a bench. Acting: blank stares at photos, handing over payment.
- **Extras:** no crowds; 2-4 characters per shot
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~8% · sign: MEMORIES storefront sells the world rule
- ~12% · sign: deli awning dresses the street
- ~26% · counter: counter at 300 punches the Bahamas joke
- ~32% · sign: bought-and-sold ad on the bench
- ~36% · gauge: HAPPINESS meter shows happier memories pay more
- ~50% · label: handwritten frog caption on the polaroid plants the story
- ~64% · sign: OPERATING light shows the surgery is paid for
- ~64% · sign: summers-wanted sign at the bus stop
- ~73% · document: passbook with SOLD stamps counts down the years
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`rain`, `magic`, `flash` (plan beats' `"fx"`). Seen: rain, neon glow, white flash, lens flare, memory chip glow, light flicker on face, dissolves, colour temperature shift warm to cold.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v15-currency-world-tragedy"` in the plan.

## Prompts the media team can use
- `/v15-currency-world-tragedy tạo video về time as currency, thoại tiếng Việt, khoảng 78 giây`
- `Dùng skill v15-currency-world-tragedy làm video "<chủ đề>", giọng kể hài hước, 45 giây`
