---
name: v18-caught-by-sting
description: "2D Studio video recipe 18 — how-it-worked: Someone in a trusted position quietly steals a windfall, enjoys the fantasy, goes to collect and is caught by a trap; only then the narrator explains the real statistical anomaly and the sting the institution invented to catch people like him. Use when the user types /v18-caught-by-sting, says 'skill v18', or wants a short about: Petty cheats caught by clever institutional traps: hotel staff caught by marked minibar bottles, delivery drivers caught by GPS bait parcels, shoplifters caught by dye packs, exam cheats caught by planted fake answer keys, mechanics caught by mystery-shopper cars. Always read video-studio first."
---

# v18-caught-by-sting · Cách nó từng hoạt động

Recipe measured frame by frame from reference short #18 (57.8 s, 25 shots, 9 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** Someone in a trusted position quietly steals a windfall, enjoys the fantasy, goes to collect and is caught by a trap; only then the narrator explains the real statistical anomaly and the sting the institution invented to catch people like him
- **Fits topics like:** Petty cheats caught by clever institutional traps: hotel staff caught by marked minibar bottles, delivery drivers caught by GPS bait parcels, shoplifters caught by dye packs, exam cheats caught by planted fake answer keys, mechanics caught by mystery-shopper cars
- **Signature moves (keep these):**
  - Hook starts mid-crime: the insider sees the jackpot and lies to the owner's face
  - Comic greed montage: bin dive, spotlight grin, fantasy splurge that pulls back to a sad reality
  - Collection scene: overly nice clerk, a wait, and a door opening behind the hero
  - The victim returns in uniform; frame freezes into a polaroid on an investigation board
  - Explain the real statistic with visual columns, end on the next agent walking into the next shop

## Script
- **Length:** about 57.8 s (scale to what the user asks), ~200 words at **3.46 words/s** → plan `"pace": 3.5`; sentences ~20 words.
- **Voice:** third-person; tone: cheeky crime-caper storytelling that turns into a crisp real-world explanation. Narrator says 93% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 5.6 s, action-in-progress):** He [checked the valuable thing], saw it was [worth a fortune], and told its owner it was [worthless].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–10% | Cashier scans a million-dollar ticket and lies that it lost |
| setup | 10–16% | Customer shrugs it off as typical bad luck and leaves |
| crime | 16–29% | Cashier dives into the bin, retrieves the ticket and pockets it as his own |
| fantasy | 30–39% | By midnight he has spent it all on a boat, mansion and friends, in his imagination |
| approach | 39–56% | Long drive to the claims office; the clerk congratulates him and asks him to wait |
| suspense | 56–65% | Minutes pass, then a door opens behind him |
| twist | 65–75% | The 'customer' returns in a suit with a badge, flanked by two officers |
| explain | 76–88% | In reality lotteries spotted that clerks won suspiciously more than everyone else |
| mechanism | 89–100% | So they print bait winning tickets and send undercover agents posing as shoppers |

- **Ending (loop-back):** Explain the sting, and end on the next undercover agent walking up to the next unsuspecting [insider].
- **Devices:** poker-face lie while sweating; cashier upside down in the trash can, legs kicking; lavish fantasy yacht that shrinks into a poster above a bare mattress; clerk smiles while secretly pressing the security button; triumphant arms-up waiting that melts into a frozen grin; understatement: statistically a little suspicious; in-medias-res hook; list of three (boat, mansion, friends) with a deflating tag; countdown of time (five minutes, then ten); you see, in real life pivot to explanation; visual statistics (photo columns clerks vs everyone else)

## Camera (one plan beat = one shot)
- **25 shots, median 2 s, longest 4.5 s.** Split long narration into several beats of ~2 s so the picture changes that often.
- **Framing:** medium 28%, insert-object 28%, wide 16%, close 12%, ots 12%, medium-close 4%
- **Moves:** static 52%, push-in 24%, pull-out 12%, pan 4%, tilt 4%, follow 4%
- **Transitions:** cut 56%, dissolve 28%, none 4%, zoom-through 4%, match-cut 4%, whip 4%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, push-in, on cashier at the register under lottery boards.
- **Shot rhythm in studio ids** (a guide, not a must): medium › high › close › close › ots › high › close › high › close › wide › reveal › medium › ots › medium › medium › wide › medium › reveal › high › high › xclose › high › behind › wide › ots

## Places (9)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Interior**: green wall with lottery scratch-card boards, wood panelling, counter with register and scanner, pendant lamp, BAIT sign on counter front. Light: warm pendant lamp and flat store light → `"light": "homeWarm"`. Palette #7DAA6A #C98A2E #D64032. Key props: register, scanner, lottery boards, trash can, wallet.
   Studio: { "type": "room", "kind": "shop" } (recolour walls / floor to fit)
2. **Exterior**: neon-purple lake with lily pads, huge pink moon, castle mansion on a rock, yacht. Light: pink moon glow, fairy lights → `"light": "neon"`. Palette #6B3FA0 #F2C2E0 #2B49B5. Key props: yacht, mansion, fireworks, friends.
   Studio: code set (write `Library/code/<Name>.js`): dreamLake: purple water plane, big moon disc, yacht, island castle
3. **Interior**: bare blue room, mattress on floor, pizza box, fishbowl, bare bulb, poster. Light: bare bulb at night, then warm morning → `"light": "moon"`. Palette #2B3FA0 #F2E0B0 #D64032. Key props: mattress, poster, pizza box, bulb.
   Studio: { "type": "room", "kind": "empty" } (recolour walls / floor to fit)
4. **Exterior**: straight road through fields under pink sunrise. Light: pink-gold dawn → `"light": "golden"`. Palette #F2A0B0 #D64032 #6E7A3A. Key props: red jeep.
   Studio: { "type": "highway" }
5. **Interior**: teal counter with glass window, STATE LOTTERY PRIZE CLAIMS banner with stars, employee photos, red security button, claim form. Light: bright cool office light → `"light": "office"`. Palette #3EB8C8 #1B2A6B #F2B705. Key props: glass window, security button, claim form, computer.
   Studio: { "type": "room", "kind": "office" } (recolour walls / floor to fit)
6. **Interior**: yellow wall with OUR WINNERS banner and photos, teal and coral chairs, fish tank, door at back. Light: bright flat ceiling lamps → `"light": "office"`. Palette #F2C230 #3EB8C8 #F07A6A. Key props: chairs, winner photos, door, fish tank.
   Studio: { "type": "room", "kind": "office" } (recolour walls / floor to fit)
7. **Interior**: cork board on blue wall with polaroid columns CLERKS vs EVERYONE ELSE, blinds shadows. Light: venetian-blind shadow stripes, cool blue → `"light": "studio"`. Palette #3B5BD9 #C98A2E #F4F4F4. Key props: polaroids, labels, cork board.
   Studio: code set (write `Library/code/<Name>.js`): corkBoard: wall board with photo cards in columns and labels
8. **Interior**: wood floor top-down, small printer, green double-door cabinet stacked with winning tickets. Light: warm overhead → `"light": "homeWarm"`. Palette #8A5A32 #2E7A5A #3B8FD9. Key props: printer, cabinet, bait tickets.
   Studio: { "type": "floor" }
9. **Exterior**: blue clapboard storefront with BAIT GAS sign, glass door, lit window. Light: dusky blue with warm window glow → `"light": "golden"`. Palette #2B5BA9 #F2E0B0 #E8792B. Key props: door, sign, tackle box.
   Studio: { "type": "house" }

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 129.1/255, colour saturation 29.3.

## Characters
- **dishonest cashier**: brown quiff with curl, red shop polo with name tag and fish logo. Acting: sweat drop, poker face, smug closed-eye smile, singing, arms-up glee, frozen panic.
- **undercover agent posing as fisherman**: olive bucket hat covered in lures, moustache, yellow raincoat; later navy suit with badge. Acting: glum shrug, later stern.
- **claims clerk**: orange curly hair, glasses with chain, teal top. Acting: big fake smile, discreet button press.
- **police officers**: navy caps and uniforms. Acting: stern stares.
- **new trainee cashier**: brown hair, red polo with TRAINEE tag. Acting: innocent smile.
- **Extras:** imagined party friends on the yacht; otherwise 1-4 characters per shot
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~3% · prop: ticket says win up to $1,000,000
- ~4% · screen: register WINNER $1,000,000 confirms the stakes
- ~26% · prop: driver licence in wallet with his name
- ~30% · label: boat name Finders Keepers is the joke about his ethics
- ~45% · sign: STATE LOTTERY PRIZE CLAIMS banner locates the office
- ~57% · sign: OUR WINNERS banner sets false hope
- ~75% · label: polaroid caption with his name and store
- ~78% · label: CLERKS vs EVERYONE ELSE labels make the statistic visual
- ~93% · sign: GONE FISHIN tag and BAIT GAS sign close the loop
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`pop`, `fire` (plan beats' `"fx"`). Seen: scanner beam, sweat drops, spotlight vignette, fireworks, fairy lights, freeze-frame to polaroid, blind shadows, dissolves, time-lapse light change.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v18-caught-by-sting"` in the plan.

## Prompts the media team can use
- `/v18-caught-by-sting tạo video về hotel staff caught by marked minibar bottles, thoại tiếng Việt, khoảng 58 giây`
- `Dùng skill v18-caught-by-sting làm video "<chủ đề>", giọng kể hài hước, 45 giây`
