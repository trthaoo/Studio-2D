---
name: v24-paradox-standoff
description: "2D Studio video recipe 24 — versus: A clever middleman sells two rival sides opposite 'unbeatable' items that logically cannot both exist; both sides freeze, each secretly asks him which is real, he gives the same dare to both, and the reveal is that both are fake and fear of testing them ends the conflict. Use when the user types /v24-paradox-standoff, says 'skill v24', or wants a short about: Paradoxes and stalemates told as a story: two rival shops both promised the lowest price, a bridge that two armies each think is trapped, a lock maker who sells an unpickable lock and an all-opening key, a duel where both pistols might be empty, a prisoner's dilemma between two smugglers. Always read video-studio first."
---

# v24-paradox-standoff · Đối đầu

Recipe measured frame by frame from reference short #24 (45.1 s, 16 shots, 6 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** A clever middleman sells two rival sides opposite 'unbeatable' items that logically cannot both exist; both sides freeze, each secretly asks him which is real, he gives the same dare to both, and the reveal is that both are fake and fear of testing them ends the conflict
- **Fits topics like:** Paradoxes and stalemates told as a story: two rival shops both promised the lowest price, a bridge that two armies each think is trapped, a lock maker who sells an unpickable lock and an all-opening key, a duel where both pistols might be empty, a prisoner's dilemma between two smugglers
- **Signature moves (keep these):**
  - Open on the trickster selling the two opposite 'unbeatable' items side by side, camera gliding between buyers
  - Running counter sign that sets the stakes and flips at the end
  - Symmetrical standoff framing with a time-lapse (cobwebs, bird nest) to show nobody moves
  - Both sides secretly ask the same question and get the same one-line answer in one shot
  - Blueprint insert with an IMPOSSIBLE stamp, then the cheap price-tag reveal

## Script
- **Length:** about 45.1 s (scale to what the user asks), ~165 words at **3.66 words/s** → plan `"pace": 3.7`; sentences ~16.5 words.
- **Voice:** third; tone: fable-like, calm and dry, a paradox puzzle told as a story with a clever con-man payoff. All words are voice-over (every beat `"who": null`); the characters never speak, they act with faces and arms.
- **Hook (first 6 s, paradox-setup):** [Maker] sold [an item that beats anything] to [one rival] and [an item nothing can beat] to [the other].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–13% | Smith sells an all-piercing spear to one king and an unpierceable shield to his enemy |
| stakes | 14–26% | A century-long war; both kings think they now hold the winning weapon |
| standoff | 26–41% | Both armies meet with spear and shield at the front, then nobody moves |
| escalation | 41–52% | A week passes with ten thousand soldiers staring at two bits of metal |
| question | 53–73% | Each king secretly asks the smith which is genuine; both get the same dare to attack and see |
| explain | 73–83% | The paradox: both claims cannot be true at once |
| payoff | 84–99% | Both were cheap iron; neither king dared test first, so the war ended |

- **Ending (twist-moral):** [Trickster] made both [cheap/fake], knowing neither side would dare [test first], and that's how [conflict ended].
- **Devices:** war counter ticking from 99 to 100 years; time-lapse standoff with cobwebs and a bird nesting on a crown; both messengers arrive at the same time and get the same answer; IMPOSSIBLE stamp on the blueprint; one-dollar price tags on the legendary weapons; counter flipping to days of peace; classic paradox (irresistible force vs immovable object); parallelism between the two kings; big numbers (a hundred years, 10,000 soldiers); short punch sentence (then nobody moved); you-see explanation pivot; callback ending to the war counter

## Camera (one plan beat = one shot)
- **16 shots, median 2.5 s, longest 6.5 s.** Split long narration into several beats of ~2.5 s so the picture changes that often.
- **Framing:** medium 44%, extreme-wide 19%, wide 19%, medium-close 13%, insert-object 6%
- **Moves:** static 31%, truck 25%, push-in 25%, crane-up 13%, crane-down 6%
- **Transitions:** cut 44%, none 19%, dissolve 19%, whip 6%, fly-through 6%, zoom-through 6%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, truck, on smith between the red king with the spear and the teal king with the shield, camera glides to each king in turn.
- **Shot rhythm in studio ids** (a guide, not a must): follow › medium › crane › crane › two › low › low › crane › medium › follow › medium › high › medium › close › close › medium

## Places (6)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: smith's stall on a stone bridge: anvil on a stump, barrels of spears, red and teal banners, round split red/teal emblem on the paving, castles and mountains behind; a wooden war counter sign. Light: bright clear noon → `"light": "noon"`. Palette #C8382E #2A8F98 #E8D3A8. Key props: anvil, spear, shield, banners, war counter, helmets with flowers.
   Studio: code set (write `Library/code/<Name>.js`): bridgeStall: stone bridge deck with anvil stump, weapon barrels, two-colour banners, flip-counter sign
2. **Exterior**: long straight river canal through patchwork fields, stone bridge, red army on one bank and teal army on the other, forested hills. Light: soft noon → `"light": "noon"`. Palette #6CB0E0 #7FB04A #C8382E. Key props: bridge, armies, river.
   Studio: code set (write `Library/code/<Name>.js`): riverValley: straight river through patchwork fields with a bridge and two instanced armies
3. **Exterior**: wide flower meadow split by a straight dirt track with a small red/teal crate, lines of red and teal soldiers on each side, distant castles. Light: noon, with a time-lapse to purple night and golden haze → `"light": "noon"`. Palette #7CB04A #C8A06A #8FC8F0. Key props: dirt track, marker crate, army ranks, spear, shield.
   Studio: { "type": "floor" }
4. **Interior**: red-and-pink striped tent with curtains, table map of the border with army markers, candle. Light: warm candle glow → `"light": "homeWarm"`. Palette #C8483A #F5C890 #5A3A6A. Key props: battle map, candle, army markers.
   Studio: code set (write `Library/code/<Name>.js`): warTent: striped tent interior with a map table and candle
5. **Exterior**: half-timbered blacksmith house with chimney smoke by a moonlit lake, little bridge, tents beside. Light: blue moonlight with warm window and lantern glow → `"light": "moon"`. Palette #2A3A8C #8A90C8 #F5C86A. Key props: BLACKSMITH sign, lanterns, bridge.
   Studio: { "type": "house" }
6. **Interior**: timber workshop with SPEARS and SHIELDS racks, crest banner, anvil, glowing brick forge, a work table with a blue blueprint. Light: warm forge and candle light, dark surrounds → `"light": "fire"`. Palette #3A3050 #F08A2A #2A5AC8. Key props: anvil, forge, blueprint, price tags, candle.
   Studio: { "type": "room", "kind": "shop" } (recolour walls / floor to fit)

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 125.9/255, colour saturation 26.

## Characters
- **blacksmith (trickster)**: round head, moustache, brown leather apron; striped nightcap at night. Acting: salesman grin, sly calm, mischievous smile while forging.
- **red king**: gold crown, goatee, red robe, holds the spear. Acting: confident smirk, frozen stare, sweating fear.
- **teal king**: silver spiked crown, grey beard, teal cape, round shield. Acting: smug, then frozen and sweating.
- **messengers**: hooded red and teal cloaks. Acting: nervous whispers, side-eye at each other.
- **old soldier**: white beard, brown tunic. Acting: weary beside the war counter.
- **Extras:** two armies of thousands as instanced formations (aerial arrows and background ranks)
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~16% · sign: YEARS AT WAR counter 099 to 100 sets the stakes
- ~58% · sign: BLACKSMITH sign identifies where both messengers go
- ~62% · sign: SPEARS and SHIELDS shop signs show he sells to both
- ~73% · label: blueprint states both claims side by side
- ~81% · label: IMPOSSIBLE stamp delivers the logic
- ~89% · label: plain old iron $1 tags reveal the con
- ~99% · sign: counter flips to DAYS OF PEACE 001 as the ending
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`sparks`, `pop` (plan beats' `"fx"`). Seen: metal glints on spear and shield, time-lapse day/night cycle, cobwebs growing, stamp slam and paper crack, forge sparks, dissolves, sweat drops, flip-counter animation.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v24-paradox-standoff"` in the plan.

## Prompts the media team can use
- `/v24-paradox-standoff tạo video về two rival shops both promised the lowest price, thoại tiếng Việt, khoảng 45 giây`
- `Dùng skill v24-paradox-standoff làm video "<chủ đề>", giọng kể hài hước, 45 giây`
