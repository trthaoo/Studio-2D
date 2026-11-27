---
name: v22-levels-arms-race
description: "2D Studio video recipe 22 — levels: Two rival sides escalate one kind of weapon or tool step by step; each level is shown being made or loaded, then its effect on the other side, until a technology shift makes the old levels useless and one final over-the-top level ends it. Use when the user types /v22-levels-arms-race, says 'skill v22', or wants a short about: Any two-sided escalation of one tool told as levels: levels of castle siege weapons, levels of bank vault security vs safecrackers, levels of medieval armour vs arrows, levels of spam filters vs spammers, levels of shop anti-theft tricks. Always read video-studio first."
---

# v22-levels-arms-race · Các cấp độ

Recipe measured frame by frame from reference short #22 (63.6 s, 36 shots, 9 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** Two rival sides escalate one kind of weapon or tool step by step; each level is shown being made or loaded, then its effect on the other side, until a technology shift makes the old levels useless and one final over-the-top level ends it
- **Fits topics like:** Any two-sided escalation of one tool told as levels: levels of castle siege weapons, levels of bank vault security vs safecrackers, levels of medieval armour vs arrows, levels of spam filters vs spammers, levels of shop anti-theft tricks
- **Signature moves (keep these):**
  - Paradox hook that the basic level is the lucky one, then show why the basics were already brutal
  - Alternate sides each level: show it being made or loaded, then its effect landing on the other side
  - Process montage for the signature level with a zoom-through into the furnace or the barrel and a nervous object character
  - Era-shift pivot shot (material morph) that makes every earlier level useless
  - Final level is absurdly huge, ends on a big explosion with a slapstick survivor gag

## Script
- **Length:** about 63.6 s (scale to what the user asks), ~221 words at **3.48 words/s** → plan `"pace": 3.5`; sentences ~15–20 words (the transcript joined sentences with commas; keep them short and spoken).
- **Voice:** mixed; tone: brisk, gleeful arms-race escalation with slapstick, part history lesson, part one-upmanship comedy. All words are voice-over (every beat `"who": null`); the characters never speak, they act with faces and arms.
- **Hook (first 3.8 s, paradox-you-scenario):** If [bad thing] happened to you, you'd actually be [lucky].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–6% | Being struck by a plain cannonball is called the lucky outcome |
| level-1 | 6–18% | Navy solid shot smashes the hull into a cloud of splinters that wounds half the crew |
| level-2 | 19–28% | Broke pirates answer with scrap junk, given a fancy name that just means rubbish |
| level-3 | 28–47% | Navy heats balls red in a furnace, carries them with tongs, loads behind a soaked plug |
| level-3-effect | 48–58% | The hot ball lodges in the hull and minutes later the ship glows from within |
| level-4 | 58–76% | Pirates retaliate with a hollow, holed ball full of burning tar that sets the navy ship ablaze |
| shift | 77–84% | Ships switch from wood to iron and the fire weapons just bounce off |
| final-level | 84–100% | A giant cannon firing a half-ton ball is built to sink an iron warship in one hit |

- **Ending (climax-level):** So [side] built [biggest version], made to [defeat the new defence] in [one shot].
- **Devices:** lucky-to-be-hit paradox; fancy word revealed as garbage (label swap on the barrel); a boot flying across the sea as ammunition; nervous gunpowder-bag character sweating as the hot ball lands; one-upping tone (not to be outdone); pirates survive bobbing in a barrel after the final blast; paradox hook; back-and-forth escalation between two sides; process steps (shovel, heat, carry, plug, drop); simile (like a giant lantern, into a torch); numbers and dates (1700s, over a thousand pounds); era shift pivot (eventually)

## Camera (one plan beat = one shot)
- **36 shots, median 1.5 s, longest 5 s.** Split long narration into several beats of ~1.5 s so the picture changes that often.
- **Framing:** medium 39%, wide 36%, close 14%, extreme-close 8%, insert-object 3%
- **Moves:** static 44%, push-in 22%, truck 8%, follow 8%, pull-out 8%, tilt 3%, shake 3%, crane-up 3%
- **Transitions:** cut 78%, none 6%, zoom-through 6%, fly-through 3%, wipe 3%, whip 3%, dissolve 3%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, truck, on navy officer and gunner beside a long cannon.
- **Shot rhythm in studio ids** (a guide, not a must): follow › follow › close › medium › low › wide › xclose › handheld › medium › wide › medium › follow › medium › xclose › medium › follow › wide › xclose › behind › high › xclose › close › side › wide › crane › two › wide › wide › side › reveal › low › wide › low › wide › follow › wide

## Places (9)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: warm wooden deck with a long grey cannon on a carriage, rigging and sails, flag at the rail, turquoise sea behind. Light: bright tropical noon → `"light": "noon"`. Palette #C98A4A #2BB0C8 #8C9098. Key props: cannon, rigging, flag, bucket.
   Studio: code set (write `Library/code/<Name>.js`): shipDeck: plank deck with cannons, barrels, masts and sails over a sea plane (reused for pirate deck)
2. **Exterior**: turquoise sea between tall green-topped limestone sea stacks and arches with waterfalls, sailing ships on the water. Light: noon sun, later purple-orange dusk → `"light": "noon"`. Palette #1FA6C9 #E7C79A #5A9A3A. Key props: sea stacks, frigate, pirate ship, iron steamship, smoke.
   Studio: code set (write `Library/code/<Name>.js`): seaStacks: ocean plane with limestone stacks, arches, waterfalls, sailing ships (wood and iron variants)
3. **Exterior**: dark brown hull planks with gunports above the waterline. Light: side sun, ember glow → `"light": "golden"`. Palette #5A2E1A #2A6A9A #F5A030. Key props: hull planks, embedded ball.
   Studio: code set (write `Library/code/<Name>.js`): shipDeck hull-side close-up
4. **Interior**: wooden below-deck room with barrels, lanterns and a chest. Light: warm interior lantern light → `"light": "homeWarm"`. Palette #B8763A #7A4A22 #F2C24A. Key props: barrels, beer mug, chest.
   Studio: { "type": "room", "kind": "living" } (recolour walls / floor to fit)
5. **Exterior**: plank deck with cannons, barrels and crates, sails overhead, sea stacks on the horizon. Light: noon sun, later purple-gold dusk → `"light": "noon"`. Palette #C9874A #E9E0C8 #4AA8C8. Key props: cannons, barrels with labels, SHOT chest, CARCASS crate, tar pot.
   Studio: code set (write `Library/code/<Name>.js`): shipDeck pirate variant with labelled barrels, chest, crate
6. **Exterior**: sandy island yard with paving, a red-brick dome furnace and chimney with HOT SHOT sign, palms, piles of black balls, a cannon facing the sea. Light: bright noon → `"light": "noon"`. Palette #D9663A #E8D7B0 #3AA0C8. Key props: brick furnace, ball pile, giant tongs, cannon.
   Studio: code set (write `Library/code/<Name>.js`): furnaceYard: sandy paving, brick dome furnace with chimney and sign, ball pile, cannon
7. **Interior**: long brick tunnel lined with glowing coals and a row of red-hot cannonballs. Light: fire glow from below → `"light": "fire"`. Palette #F07A1A #B8331A #FFD27A. Key props: coals, glowing balls, tongs.
   Studio: code set (write `Library/code/<Name>.js`): furnaceTunnel: brick tunnel of glowing coals with a row of hot balls
8. **Interior**: inside the dark metal barrel looking at a round wet wad and a burlap powder bag marked POWDER. Light: dim, glow from the hot ball → `"light": "studio"`. Palette #5A4A7A #D9B46A #2A2238. Key props: wet plug, powder bag.
   Studio: code set (write `Library/code/<Name>.js`): barrelInside: dark cylinder, wad plug, powder-bag character
9. **Exterior**: grey stone gun platform on a green headland with a flag, a massive cannon and a wooden tripod hoist. Light: clear noon → `"light": "noon"`. Palette #9A9EA6 #5BB04A #2A3A5A. Key props: giant cannon, tripod hoist, huge ball, flag.
   Studio: code set (write `Library/code/<Name>.js`): coastFort: stone gun platform on grass headland, giant cannon, tripod hoist, flag

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 122/255, colour saturation 29.7.

## Characters
- **navy gunners**: white heads, blue coats, round hats or bandanas, one in a safari-style helmet. Acting: stern focus, determined frowns, team effort with tongs.
- **pirate (red bandana)**: red polka-dot bandana, red-and-white striped shirt. Acting: cheerful toasting, wincing at splinters, smug grins.
- **pirate captain**: black tricorn with skull, maroon coat. Acting: glum at empty chest, sly grin with the carcass, laughs as he fires.
- **gunpowder bag**: burlap sack tied at the top with a face. Acting: moustached calm, then wide eyes and sweat, nervous smile.
- **fort gunner**: blue kepi and blue uniform, bushy moustache. Acting: proud grin, swings on the hoist rope.
- **Extras:** small crews of 2-4 per ship; no large crowds
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~20% · label: SHOT chest is empty: pirates cannot afford ammo
- ~25% · label: barrel label gives the fancy term, then swaps to GARBAGE as the joke
- ~31% · sign: HOT SHOT sign names the next level
- ~42% · label: date stamped on the cannon sets the era
- ~45% · label: POWDER on the bag identifies the danger
- ~58% · label: CARCASS / keep from flame crate names the pirate level
- ~91% · caption: 1000 lbs caption stresses the final level's scale
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`smoke`, `magic`, `sparks`, `fire`, `pop` (plan beats' `"fx"`). Seen: muzzle flash and smoke clouds, splinter storm particles, glowing red-hot metal, embers and sparks, ship lit from inside, fire and flames, material morph wood to iron, spark ricochet, cartoon explosion and smoke column, sweat drops.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v22-levels-arms-race"` in the plan.

## Prompts the media team can use
- `/v22-levels-arms-race tạo video về levels of castle siege weapons, thoại tiếng Việt, khoảng 64 giây`
- `Dùng skill v22-levels-arms-race làm video "<chủ đề>", giọng kể hài hước, 45 giây`
