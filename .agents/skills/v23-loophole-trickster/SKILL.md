---
name: v23-loophole-trickster
description: "2D Studio video recipe 23 — loophole: Someone who profits from selling a dubious permission is outsmarted by a customer who buys the permission in advance for an unnamed act; the act turns out to be against the seller himself, and the seller's own document protects the trickster. Use when the user types /v23-loophole-trickster, says 'skill v23', or wants a short about: Clever loopholes where the rule-maker gets beaten by his own rule: a tenant who prepays rent in a currency about to change, a soldier with a pass signed for any gate, a gambler who bets on the bookie closing, a contractor paid per brick who builds a wall of tiny bricks, an heir who reads a will literally. Always read video-studio first."
---

# v23-loophole-trickster · Lách luật

Recipe measured frame by frame from reference short #23 (40.7 s, 21 shots, 5 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** Someone who profits from selling a dubious permission is outsmarted by a customer who buys the permission in advance for an unnamed act; the act turns out to be against the seller himself, and the seller's own document protects the trickster
- **Fits topics like:** Clever loopholes where the rule-maker gets beaten by his own rule: a tenant who prepays rent in a currency about to change, a soldier with a pass signed for any gate, a gambler who bets on the bookie closing, a contractor paid per brick who builds a wall of tiny bricks, an heir who reads a will literally
- **Signature moves (keep these):**
  - Paradox hook in one sentence (paying for something not done yet)
  - Plant the document early with a readable insert shot, then return to it as the punchline
  - Comic world-building of the racket: a sin price board that cranes up into the sky
  - Time skip with an aerial fly-over and a dive through the treetops to the ambush
  - End on the victim's tantrum, the calm reveal of the paper, then a sunset walk-off gag

## Script
- **Length:** about 40.7 s (scale to what the user asks), ~158 words at **3.88 words/s** → plan `"pace": 3.9`; sentences ~15.8 words.
- **Voice:** third; tone: wry medieval trickster tale, quick and dry, building to a satisfying turn-the-tables punchline. All words are voice-over (every beat `"who": null`); the characters never speak, they act with faces and arms.
- **Hook (first 3.3 s, paradox-statement):** [Character] paid [authority] to [permit/forgive] [something] he hadn't done yet.
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–8% | A knight pays a priest to absolve a crime not yet committed |
| setup | 9–29% | Travelling priest sells forgiveness with a price list, bigger sins costing more |
| setup | 30–39% | Crowds queue for hours to fill his huge iron chest |
| deal | 40–59% | Knight asks to be pardoned for something planned next week; priest hesitates, overcharges, stamps it |
| setup | 60–73% | Days later the priest leaves through the forest with a chest so heavy two men carry it |
| twist | 73–86% | The knight is waiting and takes every coin; the priest threatens him with damnation |
| payoff | 87–100% | Knight raises the pardon: the pre-forgiven crime was robbing its seller |

- **Ending (punchline):** The [act] he'd [bought permission] for was [doing it to the one who sold it].
- **Devices:** price list of sins that towers into the sky; priest's greedy hesitation then overcharging; worried face reflected in the knight's sword; little devils popping out of cracks as the priest curses; knight calmly holding up the stamped paper; priest left sitting in the empty chest at sunset; paradox hook; list with escalation (lying, stealing, worse sins cost more); planted object payoff (the pardon paper); time skip (a few days later); ironic reversal ending

## Camera (one plan beat = one shot)
- **21 shots, median 2 s, longest 4.5 s.** Split long narration into several beats of ~2 s so the picture changes that often.
- **Framing:** medium 48%, wide 14%, close 14%, insert-object 10%, extreme-close 10%, extreme-wide 5%
- **Moves:** push-in 38%, static 29%, truck 19%, crane-up 5%, crane-down 5%, pull-out 5%
- **Transitions:** cut 76%, dissolve 10%, none 5%, wipe 5%, fly-through 5%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, push-in, on knight and priest at the Pardons stall, camera pushes to the smug knight.
- **Shot rhythm in studio ids** (a guide, not a must): two › xclose › side › side › crane › wide › medium › two › xclose › dutch › two › crane › crane › side › ots › low › medium › close › reveal › xclose › behind

## Places (5)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: medieval village square, wooden stall with red-white striped awning and gold Pardons sign, crossed-key banner, cottages with red roofs and a church spire, tall Price of Sins board. Light: bright clear daylight → `"light": "noon"`. Palette #C8302B #F2E6C8 #6BB0E0. Key props: Pardons stall, pardon papers, stamp, iron chest, price board, quill.
   Studio: { "type": "room", "kind": "shop" } (recolour walls / floor to fit)
2. **Exterior**: side-on scrolling road past thatched cottages, a harbour with sailboats, and a snowy rooftop town at night. Light: daylight then cool starry night → `"light": "morning"`. Palette #E0B860 #3A8AD0 #3A3F7A. Key props: donkey cart, coin barrel, drum.
   Studio: { "type": "highway" }
3. **Exterior**: ring-walled town with orange roofs and a dirt plaza in the middle of a dense round-tree forest, gatehouse with pennants. Light: soft noon → `"light": "noon"`. Palette #4E9A3A #D98A3A #C8B090. Key props: town wall, gatehouse, forest canopy.
   Studio: code set (write `Library/code/<Name>.js`): walledTown: ring wall, roofs and plaza inside a dense tree forest, for aerial fly-overs
4. **Exterior**: tall pale tree trunks with sun shafts, dirt path with leaves, green undergrowth. Light: warm hazy sunbeams through trees → `"light": "morning"`. Palette #D9B470 #8AA84A #F5EAC8. Key props: chest on pole, wheelbarrow, devils, fire cracks, pardon scroll.
   Studio: code set (write `Library/code/<Name>.js`): forestPath: tall trunks, dirt path, leaf litter, sun shafts
5. **Exterior**: fenced country road leading to a silhouetted castle and windmill under a huge setting sun. Light: golden sunset backlight, long shadows → `"light": "golden"`. Palette #F5A04A #C8607A #5A3A6A. Key props: empty chest, fence, castle silhouette.
   Studio: { "type": "highway" }

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 135.1/255, colour saturation 28.6.

## Characters
- **knight (trickster)**: full silver plate armour with open helmet, blue tabard and cape, sword. Acting: smug half-smile, cheeky grin, wink, calm paper raise.
- **priest (seller)**: red robe with gold stripes and a stole, bald round head. Acting: salesman pointing, greedy grin, hesitation, red-faced screaming, dejected slump.
- **villagers**: simple coloured tunics, varied hair. Acting: queueing patiently.
- **porters**: hooded green and brown tunics. Acting: straining under the pole, then knocked out.
- **Extras:** a queue of about 6 villagers; otherwise 2-4 characters per shot
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~0% · sign: Pardons sign names the business
- ~9% · label: pardon paper plants the key object: one crime, next week, forgiven, price crossed out and raised
- ~18% · sign: Price of Sins board with per-sin prices shows forgiveness is for sale
- ~28% · sign: 1000 at the top of the board escalates the joke
- ~90% · label: pardon paper again as the punchline proof
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`sparks` (plan beats' `"fx"`). Seen: coin sparkle, rack focus on the quill, reflection in the sword blade, face turning red, fiery cracks with little devils, dissolves, sun rays through trees.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v23-loophole-trickster"` in the plan.

## Prompts the media team can use
- `/v23-loophole-trickster tạo video về a tenant who prepays rent in a currency about to change, thoại tiếng Việt, khoảng 41 giây`
- `Dùng skill v23-loophole-trickster làm video "<chủ đề>", giọng kể hài hước, 45 giây`
