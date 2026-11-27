---
name: v06-odd-prep-reveal
description: "2D Studio video recipe 06 — how-it-worked: A lone oddball makes a baffling, meticulous preparation while everyone else gets ready the normal way and mocks him; each step gets weirder and he guards it obsessively; at the moment of maximum danger he triggers it, and the narration reveals the mechanism, with the payoff hinging on a detail planted earlier. Use when the user types /v06-odd-prep-reveal, says 'skill v06', or wants a short about: Clever historical inventions or tactics whose purpose is hidden until used: why castle stairs spiral clockwise, the sailor who greased the anchor chain before a storm, the farmer who planted rows of mirrors, the medieval cook who buried barrels before a siege, the lighthouse keeper who painted stripes. Always read video-studio first."
---

# v06-odd-prep-reveal · Cách nó từng hoạt động

Recipe measured frame by frame from reference short #06 (66.9 s, 35 shots, 3 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** A lone oddball makes a baffling, meticulous preparation while everyone else gets ready the normal way and mocks him; each step gets weirder and he guards it obsessively; at the moment of maximum danger he triggers it, and the narration reveals the mechanism, with the payoff hinging on a detail planted earlier
- **Fits topics like:** Clever historical inventions or tactics whose purpose is hidden until used: why castle stairs spiral clockwise, the sailor who greased the anchor chain before a storm, the farmer who planted rows of mirrors, the medieval cook who buried barrels before a siege, the lighthouse keeper who painted stripes
- **Signature moves (keep these):**
  - Cold open on a strange, oddly numbered action while a huge threat approaches
  - Everyone mocks the hero; each step gets weirder and he guards it fiercely (slap, lying on it in the rain)
  - Hold the trigger until the enemy is packed close, with a countdown of distance
  - Reveal shot dives into the device (spark splits, fly-through the fuses) to show the mechanism
  - Last line flips the device's weakness into strength; hero smug in front of the explosion

## Script
- **Length:** about 66.9 s (scale to what the user asks), ~235 words at **3.51 words/s** → plan `"pace": 3.5`; sentences ~16.8 words.
- **Voice:** third-person; tone: dry, wry storyteller voice building slow suspense, quick comic asides, then an explosive matter-of-fact reveal. Narrator says 93% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 5.5 s, strange-act-in-media-res):** He did [oddly precise action with a number] to [ordinary object], because [overwhelming threat] was heading straight for him.
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–8% | A man bores a precise number of holes in a board while an army marches up the valley |
| setup | 8–19% | Everyone else readies blades; he keeps drilling in the corner and the commander mocks him with a kitchen joke |
| mystery | 19–36% | It gets stranger: board goes on a cart, a paper-wrapped stick with a string fills each hole, all strings braided into one cord |
| rule | 36–43% | Nobody may touch the cord; a curious soldier gets slapped so hard the whole fort hears |
| escalation | 43–54% | Night rain; he covers the cart with his coat and lies on it, warning that one drop would kill them all |
| tension | 55–72% | Dawn assault; everyone begs him to act but he waits until the attackers are packed tight and close |
| reveal | 72–81% | He uncovers the cart and lights the cord; the spark splits into one flame per hole |
| mechanism | 81–89% | Each flame reaches a powder tube tied to an arrow, making every arrow a rocket |
| payoff | 89–99% | All launch at once in random directions, yet the crowded army means none can miss |

- **Ending (twist-payoff):** The apparent flaw of [invention] ([random/inaccurate]) stops mattering because of [the detail he waited for], so [result] is total.
- **Devices:** commander mocks the device with a kitchen-chore comparison; 'but it gets weirder' aside; slap so loud it cracks the ground across the fort; inventor lying on the cart as a human umbrella; deadpan smug hero with arms crossed in front of a giant fireball; exaggerated grinning enemy faces; precise number repeated (82) as a hook and a payoff; escalating 'and then' list of odd steps; stakes line from the hero (one drop and we are dead); slow-build countdown of distance (closer and closer, see their teeth); delayed reveal: purpose withheld until the trigger; reversal last line

## Camera (one plan beat = one shot)
- **35 shots, median 2 s, longest 3.5 s.** Split long narration into several beats of ~2 s so the picture changes that often.
- **Framing:** medium 37%, wide 26%, extreme-wide 11%, close 11%, insert-object 6%, extreme-close 6%, medium-close 3%
- **Moves:** static 43%, push-in 29%, truck 14%, crane-up 9%, pull-out 3%, tilt 3%
- **Transitions:** cut 80%, dissolve 11%, none 3%, zoom-through 3%, fly-through 3%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, static, on inventor in red tunic cranks a drill into a tall board by the stone wall.
- **Shot rhythm in studio ids** (a guide, not a must): medium › xclose › crane › low › medium › wide › two › two › medium › high › xclose › medium › high › wide › crane › close › medium › wide › low › medium › low › two › high › wide › close › two › low › xclose › crane › behind › two › side › high › high › low

## Places (3)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: grass courtyard inside grey stone walls with blue dragon banners, arched gate, wooden carts, grindstone, a red-roofed round tower beyond. Light: bright midday sun with long soft shadows; one scene shifts to purple dusk → `"light": "noon"`. Palette #7A7A78 #4E8F2A #1F3A8C. Key props: perforated board, hand drill, two-wheeled cart, grindstone, banners, braided cord.
   Studio: code set (write `Library/code/<Name>.js`): fortYard: grass courtyard ringed by stone walls with banners, arched gate, round red-roofed tower, carts
2. **Exterior**: rolling green valley with patchwork fields, winding dirt road and mountains; massed army with yellow shields and boar banners, general on a palanquin under a parasol. Light: clear blue sky, hard sun, dust haze → `"light": "noon"`. Palette #4FA33A #E8B91E #3D7FD9. Key props: parasol palanquin, yellow shields, boar banners, ladders, smoke trails, explosions.
   Studio: code set (write `Library/code/<Name>.js`): valley: rolling green fields with dirt road, mountains, room for an instanced army and a palanquin
3. **Exterior**: stone wall walk with crenellations, pagoda-roofed gatehouse, paving slabs; the rocket cart parked at the parapet overlooking the valley. Light: three states: night rain with warm lanterns, golden sunrise, then bright noon → `"light": "moon"`. Palette #C9B48A #2A3350 #F2A93B. Key props: rocket cart, coat, lanterns, torch, arrow rockets.
   Studio: code set (write `Library/code/<Name>.js`): rampart: paved wall walk with crenellations and pagoda gatehouse, overlooking the valley

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 112.3/255, colour saturation 21.1.

## Characters
- **inventor (oddball hero)**: white bean head, dark spiky hair with headband, red quilted tunic and belt, later a beige coat. Acting: flat unbothered half-lidded stare, fierce glare when guarding, wide alarmed eyes in rain, smug arms-crossed finish.
- **commander**: silver helmet with red plume, beard, blue studded armour with red skirt. Acting: scowling, mocking open-mouth laugh, yelling with torch.
- **soldiers**: kettle helmets or hoods, green and blue tunics, one orange-bearded. Acting: smirks, curiosity, shocked eyes after the slap, holding lanterns.
- **enemy general**: black armour, horned helmet, carried on a red palanquin under an orange parasol. Acting: points sword forward, shouting.
- **enemy army**: dozens of identical soldiers with spiked helmets and yellow chevron shields. Acting: marching, charging, grinning toothy faces.
- **Extras:** large instanced enemy army (hundreds) in the valley and packed close; 4-8 defenders around the hero inside the fort
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- none
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`dust`, `rain`, `magic`, `sparks`, `smoke`, `fire` (plan beats' `"fx"`). Seen: sawdust, dust clouds behind the army, red slap burst, ground crack spreading, rain, lantern glow, fuse sparks splitting, rocket smoke trails, explosions and mushroom fireball, dissolves.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v06-odd-prep-reveal"` in the plan.

## Prompts the media team can use
- `/v06-odd-prep-reveal tạo video về why castle stairs spiral clockwise, thoại tiếng Việt, khoảng 67 giây`
- `Dùng skill v06-odd-prep-reveal làm video "<chủ đề>", giọng kể hài hước, 45 giây`
