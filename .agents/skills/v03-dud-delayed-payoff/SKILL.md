---
name: v03-dud-delayed-payoff
description: "2D Studio video recipe 03 — how-it-worked: An underdog's invention is dismissed as a failure, the enemy treats it as harmless and plays with it, then the hidden mechanism inside reveals it was working all along. Use when the user types /v03-dud-delayed-payoff, says 'skill v03', or wants a short about: Clever historical devices or tricks that only work after a delay: a time-lock safe, a slow-acting poison test, a trick lock that seals itself, a decoy that waits for the enemy to act, a trap that springs when opened. Always read video-studio first."
---

# v03-dud-delayed-payoff · Cách nó từng hoạt động

Recipe measured frame by frame from reference short #03 (59.1 s, 25 shots, 7 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** An underdog's invention is dismissed as a failure, the enemy treats it as harmless and plays with it, then the hidden mechanism inside reveals it was working all along
- **Fits topics like:** Clever historical devices or tricks that only work after a delay: a time-lock safe, a slow-acting poison test, a trick lock that seals itself, a decoy that waits for the enemy to act, a trap that springs when opened
- **Signature moves (keep these):**
  - Hook says the weapon was made NOT to work, creating a puzzle
  - Rejection by the boss, then a secret night delivery
  - Enemy relaxes and turns the device into a game, escalating attempts as a ticking clock
  - Exploded-view cutaway of the device with a simple everyday simile
  - Payoff lands on the most arrogant character's biggest swing, with a reaction shot from the hero far away

## Script
- **Length:** about 59.1 s (scale to what the user asks), ~213 words at **3.6 words/s** → plan `"pace": 3.6`; sentences ~14.2 words.
- **Voice:** third-person story; tone: playful suspense, dry narrator, slow-burn ticking-bomb comedy. Narrator says 95% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 3.7 s, rule-break):** He sent [dangerous device] into [enemy place], but made sure it would [not do the obvious thing].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–6% | Weapon delivered to enemy but deliberately inert |
| setup | 7–14% | Huge army camped outside the city, attack due at dawn |
| problem | 15–26% | Superior rejects the invention as useless with an angry line |
| attempt | 27–35% | Inventor sneaks out at night and delivers it himself |
| twist | 35–43% | Enemy dives for cover; nothing happens |
| escalation | 44–54% | One enemy picks it up and assumes treasure inside |
| escalation | 55–69% | Weapons fail to open it; whole camp gathers and bets, swing after swing |
| mechanism | 70–83% | Name revealed; inside is a slow fuse wound around a core like thread |
| mechanism | 84–92% | The fuse has been creeping the whole time instead of burning fast |
| payoff | 92–100% | Just as the biggest enemy raises a hammer, it reaches the powder: huge blast watched from the wall |

- **Ending (punchline):** Right as [the most confident enemy] does [the final attempt], the [hidden mechanism] finally [triggers].
- **Devices:** boss rejects the invention angrily; everyone dives then nothing happens; greed fantasy (imagined gold inside); sword snaps comically; betting crowd; biggest guy gets the blast; numbers (ten thousand); question pivot to explanation; simile (thread on a spool); contrast seconds vs whole time; ticking-clock suspense; dramatic irony

## Camera (one plan beat = one shot)
- **25 shots, median 2.25 s, longest 4.5 s.** Split long narration into several beats of ~2.25 s so the picture changes that often.
- **Framing:** medium 36%, wide 28%, medium-close 12%, extreme-close 12%, extreme-wide 4%, close 4%, insert-object 4%
- **Moves:** static 48%, push-in 28%, truck 8%, crane-up 4%, orbit 4%, crane-down 4%, pull-out 4%
- **Transitions:** cut 80%, fly-through 8%, none 4%, zoom-through 4%, match-cut 4%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, static, on inventor bowls the bomb downhill.
- **Shot rhythm in studio ids** (a guide, not a must): medium › follow › crane › reveal › wide › ots › low › follow › low › wide › medium › close › low › wide › high › wide › low › orbit › two › xclose › xclose › high › low › xclose › behind

## Places (7)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: grassy slope with tall grass, hanging lantern, big full moon low on the horizon. Light: moonlight, cool blue key from behind, warm lantern accent → `"light": "moon"`. Palette #2E3A5C #6E7A4A #F2EEDC. Key props: bomb, lantern, moon.
   Studio: { "type": "floor" }
2. **Exterior**: dirt path to a fire ring with cooking pot, bench and barrels, three guards seated, banners and tents behind. Light: night: cool moon fill, strong orange firelight key from low front → `"light": "fire"`. Palette #3A4566 #C9823A #B8462E. Key props: campfire, pot, bench, barrels, spears, banners.
   Studio: code set (write `Library/code/<Name>.js`): warCamp: dirt ground, fire ring with pot, benches, barrels, tents, banners, torches, spears
3. **Exterior**: wide night valley full of campfires and tents, roads, trees, town with lit windows beyond. Light: moonlit, scattered warm points → `"light": "moon"`. Palette #2A3452 #5B6B4A #F2C46A. Key props: tents, fires, town.
   Studio: code set (write `Library/code/<Name>.js`): valleyArmy: large terrain with instanced tents and fire points, town lights
4. **Exterior**: stone parapet with crenellations overlooking the valley, moon behind. Light: moon backlight; finale lit by explosion glow → `"light": "moon"`. Palette #B39A78 #2E3A5C #F2EEDC. Key props: parapet, bomb.
   Studio: code set (write `Library/code/<Name>.js`): castleWall: stone parapet strip with crenellations
5. **Interior**: canvas tent with gold piping, red patterned rug, armour stand, brazier, low desk, open flap showing moonlit wall. Light: warm homey lamp light, cosy → `"light": "homeWarm"`. Palette #C9B8A6 #B3262E #2B3E7A. Key props: rug, armour, brazier, scrolls.
   Studio: code set (write `Library/code/<Name>.js`): commandTent: canvas tent interior, rug, armour stand, brazier, low desk
6. **Interior**: stone archway with studded wooden gate, hanging lanterns, guard on a stool. Light: warm lantern light in darkness → `"light": "fire"`. Palette #5A3A24 #E8B060 #2A2A2A. Key props: gate, lanterns, spear.
   Studio: code set (write `Library/code/<Name>.js`): gateArch: stone arch, wooden studded doors, lanterns
7. **Exterior**: trampled dirt among tents and banners, a stool for the bomb, torches, hills behind. Light: night: moon plus torches; mechanism section turns twilight-blue with neutral sky → `"light": "fire"`. Palette #2E3A5C #7A5A3A #D94A2A. Key props: stool, torches, banners, broken swords, hammer, spool.
   Studio: code set (write `Library/code/<Name>.js`): warCamp variant: open clearing with stool, torches

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 82.9/255, colour saturation 14.6.

## Characters
- **inventor (hero)**: black top-knot bun, mint-green striped robe with brown sash, slim. Acting: smug half-lidded confidence, toothy grin, sneaky tiptoe.
- **captain**: red-and-black lacquered hat with plume, goatee, purple robe with red sash. Acting: furious shouting with pointing, then dozing.
- **camp guards**: orange-red lamellar armour, bald top-knots, spears. Acting: googly panic eyes, diving, sweat drops, greedy grins.
- **tall-hat swordsman**: tall white conical hat, white robe with red stripes. Acting: big effort swing, blank stare.
- **biggest warrior**: black lacquered armour with gold antler helmet, heavy build. Acting: red glowing eyes, villain grin, then sweat drop.
- **Extras:** 15-20 samurai extras gather around the bomb as a laughing, betting crowd; aerial shows hundreds of tiny tents and fires to sell the army size
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- none
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`fire`, `smoke`, `sparks`, `flash`, `explosion`, `pop` (plan beats' `"fx"`). Seen: campfire flames, smoke columns, sword snap, sparks, lightning crackle, exploded-view parts, fuse sparks, white flash, mushroom-cloud explosion, sweat drops.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v03-dud-delayed-payoff"` in the plan.

## Prompts the media team can use
- `/v03-dud-delayed-payoff tạo video về a time-lock safe, thoại tiếng Việt, khoảng 59 giây`
- `Dùng skill v03-dud-delayed-payoff làm video "<chủ đề>", giọng kể hài hước, 45 giây`
