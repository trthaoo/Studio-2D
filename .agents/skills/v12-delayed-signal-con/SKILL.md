---
name: v12-delayed-signal-con
description: "2D Studio video recipe 12 — con-trick: A mocked outsider waits all day without acting, then bets everything on the obvious loser; a hidden accomplice exploits a delay in how information travelled back then, and the room learns too late that he already knew the result. Use when the user types /v12-delayed-signal-con, says 'skill v12', or wants a short about: Historic scams that beat slow information: pigeon-post stock tips before the telegraph, semaphore market fraud, a lottery drawn before the shop closed, radio delay betting on boxing, pre-internet sports-score past-posting. Always read video-studio first."
---

# v12-delayed-signal-con · Mánh lừa

Recipe measured frame by frame from reference short #12 (64.1 s, 32 shots, 5 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** A mocked outsider waits all day without acting, then bets everything on the obvious loser; a hidden accomplice exploits a delay in how information travelled back then, and the room learns too late that he already knew the result
- **Fits topics like:** Historic scams that beat slow information: pigeon-post stock tips before the telegraph, semaphore market fraud, a lottery drawn before the shop closed, radio delay betting on boxing, pre-internet sports-score past-posting
- **Signature moves (keep these):**
  - Hook on an all-in bet on the obvious loser, then rewind to a full day of mocking
  - Split cutting between the waiting hero and the hidden accomplice watching through a lens
  - Running crowd gags that escalate (they bet on whether he'll ever bet, milk-cart jab)
  - A you-see pivot explaining the old information delay the con exploits
  - Final static wide on the room as the official signal spells the result and cash rains

## Script
- **Length:** about 64.1 s (scale to what the user asks), ~244 words at **3.8 words/s** → plan `"pace": 3.8`; sentences ~16.3 words.
- **Voice:** third; tone: wry, teasing heist narration with gag one-liners from the crowd, steady build to a smug reveal. Narrator says 91% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 3 s, absurd-action):** He bet [everything he owned] on [the option everyone knows will lose].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–12% | He stakes his savings on the slowest horse; the room mocks him because he has not bet all day |
| setup | 12–19% | He waits by the window smiling with a small mirror; an interjection asks what a mirror could do |
| setup | 20–28% | The track sits over a hill and his partner waits up there with an enormous mirror |
| escalation | 29–42% | Race after race the favourite wins, the hill stays dark, regulars start betting on whether he will ever bet and heckle him |
| escalation | 42–54% | Final race: the favourite is miles ahead, horse nine is hopelessly behind (comic exaggerations) |
| turn | 54–71% | The hill flashes; he puts every dollar on nine; the clerk pities him with a milk-cart joke |
| mechanism | 71–82% | Back then results arrived by telegraph wire, and until they did bets stayed open |
| reveal | 82–90% | The partner had already watched nine come from behind and win by a nose |
| payoff | 90–100% | As the wire clicks out the winner, the laughing room goes silent |

- **Ending (reversal):** While [the mockers] are still laughing, [the official signal] confirms the result and nobody laughs anymore.
- **Devices:** regulars bet on whether he will ever bet; heckler's mirror-wiping jab; jockey so far ahead he waves to his mom; slow horse practically in the parking lot; clerk's milk-cart insult with a double punchline; clerk dabs a tear with a banknote; absurd-stakes hook; listener interjection question; rule of three escalation of races; you-see pivot to the historical mechanism; callback to the laughing room at the end

## Camera (one plan beat = one shot)
- **32 shots, median 2 s, longest 6.13 s.** Split long narration into several beats of ~2 s so the picture changes that often.
- **Framing:** medium 41%, wide 31%, close 6%, medium-close 6%, extreme-close 6%, pov 6%, extreme-wide 3%
- **Moves:** static 47%, truck 19%, push-in 16%, pan 9%, zoom 6%, orbit 3%
- **Transitions:** cut 75%, dissolve 13%, zoom-through 6%, none 3%, whip 3%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, static, on hero smashes a piggy bank with a mallet on a trackside table.
- **Shot rhythm in studio ids** (a guide, not a must): medium › follow › wide › follow › close › two › xclose › crane › orbit › pov › medium › pov › medium › medium › two › follow › wide › close › wide › two › close › follow › wide › low › wide › medium › medium › wide › xclose › follow › side › wide

## Places (5)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: orange dirt oval, white rails, striped red-white grandstand packed with fans, HILLSIDE DOWNS banner, green hill behind, parking lot with old cars. Light: sunny afternoon, later warm sunset → `"light": "noon"`. Palette #D9622B #F4F4F4 #3E9A3A. Key props: grandstand, finish post, rails, racehorses, parked cars.
   Studio: code set (write `Library/code/<Name>.js`): racetrack: dirt oval with rails, striped grandstand with instanced crowd, finish post, banner, parking area
2. **Interior**: wooden betting parlour with big chalk odds boards on ladders, barrel tables, ticket litter on the floor, a long window bench looking out at the town street. Light: warm daylight through the window, later night blue with lamps → `"light": "homeWarm"`. Palette #6B4A2E #2B3A40 #3DB8A8. Key props: odds board, ladder, barrel table, window bench, telegraph sounder, betting slips.
   Studio: { "type": "room", "kind": "shop" } (recolour walls / floor to fit)
3. **Interior**: back room with red quilted walls, green felt counter piled with cash, notice sign above, milk bottle, hanging bulb. Light: single warm bulb, dim → `"light": "homeWarm"`. Palette #8A2A2A #1F5A3A #E8D6A0. Key props: counter, cash stacks, visor, milk bottle, sign.
   Studio: { "type": "room", "kind": "shop" } (recolour walls / floor to fit)
4. **Exterior**: old-west brick main street, dirt road with tyre ruts, Model-T cars, telegraph poles, shopfronts, green hill at the end. Light: noon sun; one view at golden dusk → `"light": "noon"`. Palette #C98A4A #8A3A2A #6FB04A. Key props: old cars, telegraph poles, storefronts, finish banner, milk cart.
   Studio: code set (write `Library/code/<Name>.js`): westTown: main street with storefronts, telegraph poles, vintage cars, hill at the end
5. **Exterior**: grassy hill crest with wildflowers, patchwork farmland below, a gilded mirror on an easel, crates and a chalk slate. Light: bright day; later pink-purple sunset → `"light": "golden"`. Palette #7BC04A #E8C060 #8AB8E8. Key props: giant mirror, sheet, spyglass on tripod, crates, slate.
   Studio: code set (write `Library/code/<Name>.js`): hilltop: grassy crest over farmland with an easel mirror and tripod spyglass

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 115.9/255, colour saturation 25.3.

## Characters
- **the bettor (hero)**: small straw boater, teal body, red polka-dot bow tie. Acting: serene half-smile, lazy pretzel munching, smug wink, never reacts to taunts.
- **accomplice on the hill**: wide straw sun hat, blue overalls, green shirt. Acting: squints through spyglass, deflates and sits when the favourite wins.
- **heckler regular**: brown derby, cigar, check waistcoat. Acting: leaning, sneering, jabbing, then stunned.
- **betting clerk**: green visor, purple shirt with pens, moustache. Acting: sweats, pities him, dabs a tear with money.
- **regular bettors**: mixed hats, feather band, glasses. Acting: laughing chorus, then open-mouthed silence.
- **jockeys and judge**: silks, visor. Acting: waving, racing.
- **Extras:** dense grandstand crowd of hundreds (instanced); 6-8 bettors in the parlour
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~5% · board: odds board shows horse 9 at 100-1: sets up the long shot
- ~10% · sign: BETS OPEN sign establishes the rule the con uses
- ~34% · board: race number 5 shows time passing
- ~48% · sign: mom's sign in the stands as a gag
- ~52% · sign: PARKING sign shows how far behind horse nine is
- ~61% · sign: counter notice disclaims errors
- ~69% · sign: FINISH banner and dairy cart lettering for the milk-cart gag
- ~80% · label: race 8 slips show the final race
- ~94% · board: board spells NINE as the reveal
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`dust`, `flash`, `rain` (plan beats' `"fx"`). Seen: piggy-bank shatter, dust trails, spyglass iris mask, mirror flash and lens glare, raining banknotes, ticket litter, dissolves.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v12-delayed-signal-con"` in the plan.

## Prompts the media team can use
- `/v12-delayed-signal-con tạo video về pigeon-post stock tips before the telegraph, thoại tiếng Việt, khoảng 64 giây`
- `Dùng skill v12-delayed-signal-con làm video "<chủ đề>", giọng kể hài hước, 45 giây`
