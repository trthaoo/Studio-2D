---
name: v02-paradox-twist-story
description: "2D Studio video recipe 02 — other:paradox-twist-story: Someone does a thing that seems pointless or self-defeating; the story piles up why it cannot work, then a hidden arrangement between unexpected partners reveals why it works perfectly. Use when the user types /v02-paradox-twist-story, says 'skill v02', or wants a short about: Stories where a seemingly pointless act hides a clever deal: a thief who returns what he steals, a worker who pays to go to work, a shop that sells below cost, a smuggler who declares everything, a gambler who always bets to lose. Always read video-studio first."
---

# v02-paradox-twist-story · paradox twist story

Recipe measured frame by frame from reference short #02 (55.4 s, 28 shots, 8 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** Someone does a thing that seems pointless or self-defeating; the story piles up why it cannot work, then a hidden arrangement between unexpected partners reveals why it works perfectly
- **Fits topics like:** Stories where a seemingly pointless act hides a clever deal: a thief who returns what he steals, a worker who pays to go to work, a shop that sells below cost, a smuggler who declares everything, a gambler who always bets to lose
- **Signature moves (keep these):**
  - Hook states an act that defeats its own purpose, then asks 'but why'
  - Narrator stacks logical objections so the audience is sure it cannot work
  - Escalating threat (a raid) where the reveal is that nothing is found
  - Late reveal that the authority figures are secret partners, shown with planted clues (CCTV, gift-bowed tool)
  - Cutaway diorama of the ground between two buildings to make geography instant

## Script
- **Length:** about 55.4 s (scale to what the user asks), ~217 words at **3.92 words/s** → plan `"pace": 3.9`; sentences ~15.5 words.
- **Voice:** third-person story; tone: wry, conspiratorial, deadpan storyteller with a dry punchline reveal. Narrator says 95% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 7.7 s, rule-break):** He did [daring act] to escape [place], yet it led not to [expected goal] but straight into [ironic destination]. But why?
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–13% | Escape effort ends up somewhere absurd instead of freedom |
| hook | 13–14% | Two-word question invites the viewer to solve it |
| problem | 14–32% | Lists why the plan is useless: still trapped, nothing to spend it on, will be found |
| attempt | 32–47% | He hauls loot back anyway; roommate makes a sarcastic quip |
| escalation | 47–54% | Hides it and keeps going back night after night |
| escalation | 55–67% | Surprise raid tears the block apart bed by bed until his |
| twist | 67–75% | Nothing is found; inspector declares it clean and walks on |
| explain | 75–88% | Reveal: the authorities supplied the tool and looked away so he would do the work |
| payoff | 88–100% | The loot leaves daily in staff lunch boxes, split, with his share waiting on release |

- **Ending (twist):** Reveal the [authority] was secretly the partner, smuggling the [loot] out through [mundane routine] and splitting it until [future day].
- **Devices:** deadpan roommate quip; first person ever to break back in; authority figure secretly corrupt; absurd routine (cash in lunch boxes); smug sunglasses on the prisoner; gift-bow on the shovel; question hook ('but why'); list of objections; repetition (bunk by bunk); reveal pivot 'you see'; half and half symmetry

## Camera (one plan beat = one shot)
- **28 shots, median 1.88 s, longest 3.5 s.** Split long narration into several beats of ~1.88 s so the picture changes that often.
- **Framing:** medium 39%, wide 39%, medium-close 11%, extreme-wide 4%, close 4%, insert-object 4%
- **Moves:** push-in 32%, static 29%, pan 11%, truck 11%, crane-down 7%, pull-out 7%, tilt 4%
- **Transitions:** cut 57%, dissolve 21%, fly-through 11%, whip 7%, none 4%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, high angle, push-in, on prisoner digs through the floor, hole cracks open.
- **Shot rhythm in studio ids** (a guide, not a must): high › crane › low › reveal › wide › high › two › ots › medium › high › high › close › medium › handheld › high › wide › wide › follow › ots › medium › low › wide › two › xclose › follow › side › follow › wide

## Places (8)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Interior**: pale blue-grey block walls, maroon floor, steel bunk bed left, tall slit window with light shafts, toilet; later night version with glowing hole. Light: day: cool sunbeams through slit window; night: deep blue with warm orange glow from the hole → `"light": "morning"`. Palette #9FB3C8 #6E2A3A #2B3A6B. Key props: bunk bed, mattress, shovel, hole in floor, coffee cup.
   Studio: code set (write `Library/code/<Name>.js`): prisonCell: block walls, bunk bed, slit window with beam, toilet, floor hole prop
2. **Exterior**: diorama cut through the ground: orange and sand soil strata with pipes under a straight town street, prison one side, bank the other, church spire behind. Light: bright noon, flat clear sky → `"light": "noon"`. Palette #E0A050 #F2D8A0 #9BC4E8. Key props: tunnel, soil layers, pipes, bank building, prison wall.
   Studio: code set (write `Library/code/<Name>.js`): groundCutaway: soil strata slab under a street with two buildings and a tunnel tube
3. **Interior**: giant round gold vault door with wheel, sunburst marble floor, gold round floor seal over the tunnel, money stacks on carts, green columns. Light: warm gold key, blue fill, rich → `"light": "homeWarm"`. Palette #C9A23A #E8E0D0 #1F2E5A. Key props: vault door, floor seal, cash stacks, money sack, gold bars.
   Studio: code set (write `Library/code/<Name>.js`): bankVault: round gold vault door, sunburst floor, cash carts, floor hatch
4. **Interior**: round steel tables with stools under tiered cell galleries, purple TV on wall. Light: cool overhead spot, grey → `"light": "office"`. Palette #4A5568 #E8E2D6 #7B3FA0. Key props: round table, cake, TV.
   Studio: { "type": "room", "kind": "kitchen" } (recolour walls / floor to fit)
5. **Interior**: long row of teal barred cells with bunks, cream brick walls, steel double doors, numbered floor markers. Light: fluorescent day light; night version deep blue with warm cell lamps → `"light": "office"`. Palette #3FB8B0 #EDE3CF #4A4F5C. Key props: cell bars, bunks, double doors, clipboard.
   Studio: code set (write `Library/code/<Name>.js`): cellBlock: row of barred cells with bunks along a corridor, double doors at end
6. **Interior**: teal tiled wall of CCTV monitors with a REC feed, desk. Light: screen glow, office white → `"light": "office"`. Palette #2E3540 #56C0B0 #FFFFFF. Key props: CCTV monitors, donut, coffee.
   Studio: { "type": "room", "kind": "office" } (recolour walls / floor to fit)
7. **Interior**: navy wall with LANE 2 STAFF SCREENING sign, X-ray machine and conveyor, monitor with currency alert, clock, STAFF EXIT door to the street. Light: flat office white → `"light": "office"`. Palette #22335C #E9EEF2 #F2C230. Key props: X-ray machine, conveyor, lunch boxes, exit sign.
   Studio: { "type": "room", "kind": "shop" } (recolour walls / floor to fit)
8. **Exterior**: sidewalk outside the prison wall, bare autumn trees, street lamp, town street behind. Light: golden autumn morning, falling leaves → `"light": "golden"`. Palette #F3EEE2 #2B3A6B #C98A3A. Key props: stack of lunch boxes, falling leaves.
   Studio: { "type": "highway" }

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 118.3/255, colour saturation 15.8.

## Characters
- **prisoner (protagonist)**: brown top-knot hair, headlamp headband, orange jumpsuit; later black sunglasses; finale brown suit. Acting: big toothy grins, smug sunglasses, sweat drop under threat, wink-level calm during the raid.
- **cellmate**: black side-parted hair, white tank top over orange, holding coffee mug. Acting: deadpan half-lidded stare, dry delivery of a quip.
- **lead guard**: navy peaked cap, mirrored aviators, thick moustache, grey uniform, red plaid lunch box. Acting: angry teeth during the raid, blank nod when finding nothing.
- **other guards**: grey uniforms, caps; one older female guard in purple with grey bun. Acting: stern search faces, later friendly waves.
- **inmates**: orange jumpsuits; old one with glasses, one in grey beanie. Acting: sour faces at the table.
- **Extras:** small: 2-5 extras per scene (inmates at canteen, 3-4 guards in raids and screening, a few figures in the street cutaway)
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~11% · sign: BANK / savings sign identifies the ironic destination
- ~67% · label: cell number marks which bunk is his
- ~76% · screen: CCTV REC feed proves the guards already know
- ~79% · label: shovel tag marked as prison property hints the guards supplied it
- ~89% · sign: staff screening lane and X-ray currency alert show the smuggling route
- ~93% · sign: STAFF EXIT points the way the money leaves
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`dust`, `magic`, `confetti` (plan beats' `"fx"`). Seen: dust and debris burst, glowing hole light, floating cash, mattress stuffing flying, light shafts, falling leaves, dissolve.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v02-paradox-twist-story"` in the plan.

## Prompts the media team can use
- `/v02-paradox-twist-story tạo video về a thief who returns what he steals, thoại tiếng Việt, khoảng 55 giây`
- `Dùng skill v02-paradox-twist-story làm video "<chủ đề>", giọng kể hài hước, 45 giây`
