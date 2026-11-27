---
name: v16-flaw-finder-story
description: "2D Studio video recipe 16 — true-story: An ordinary loser gets one small, suspicious result from a system, obsessively studies it until he finds a visible flaw, could exploit it for a fortune, but instead proves it to the owners and the system is shut down. Use when the user types /v16-flaw-finder-story, says 'skill v16', or wants a short about: A real person who beat a system by noticing a visible pattern: a man who predicted roulette wheels by their tilt, a student who found exam answers in the question numbering, a gamer who spotted a slot machine reset, a shopper who found coupon codes followed a sequence, an engineer who read keypad wear to guess codes. Always read video-studio first."
---

# v16-flaw-finder-story · Chuyện có thật

Recipe measured frame by frame from reference short #16 (63.3 s, 31 shots, 8 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** An ordinary loser gets one small, suspicious result from a system, obsessively studies it until he finds a visible flaw, could exploit it for a fortune, but instead proves it to the owners and the system is shut down
- **Fits topics like:** A real person who beat a system by noticing a visible pattern: a man who predicted roulette wheels by their tilt, a student who found exam answers in the question numbering, a gamer who spotted a slot machine reset, a shopper who found coupon codes followed a sequence, an engineer who read keypad wear to guess codes
- **Signature moves (keep these):**
  - Open on two identical objects, one glowing and one rotting, with the claim you can tell them apart
  - Underdog origin in one line (fired, five dollars), then a single suspicious question drives the plot
  - Macro insert of the object where the pattern lights up cell by cell until the rule is obvious
  - Temptation map shot (could clean out the whole state) followed by the anticlimax choice
  - Authority laughs it off, gets proven wrong, and the ending is the system quietly vanishing

## Script
- **Length:** about 63.3 s (scale to what the user asks), ~232 words at **3.66 words/s** → plan `"pace": 3.7`; sentences ~15.5 words.
- **Voice:** third-person; tone: wry, fast, admiring underdog storytelling with sarcastic asides and a clean anticlimax. All words are voice-over (every beat `"who": null`); the characters never speak, they act with faces and arms.
- **Hook (first 6.4 s, show-and-tease):** Look at these two [objects]: one is [valuable], one is [worthless], and there is a way to tell without [the normal test].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–10% | Two identical cards shown, one golden and one rotten; claim that you can tell them apart unopened |
| setup | 10–18% | Recently fired man spends his last few dollars on two cards on the way home |
| inciting | 18–27% | Small win makes him suspicious rather than happy |
| question | 27–35% | If winners are counted in advance, how does the printer know which cards they are |
| escalation | 35–50% | He sarcastically 'sanely' spends his whole severance on a mountain of cards and studies them on the floor |
| mechanism | 50–71% | Number grids on the front: most numbers repeat, singletons in a row mark a winner; he has cracked it |
| temptation | 71–76% | He could empty every gas station in the state |
| twist | 76–82% | Instead he phones the lottery, which flatly dismisses him |
| proof | 82–95% | He brings a box of unscratched cards pre-sorted and is right about nine in ten |
| payoff | 95–100% | Within a week the game is pulled from every shop |

- **Ending (consequence-punchline):** Close on the institution's swift, total reaction: within [short time] the [system] vanished from [everywhere].
- **Devices:** sarcastic 'what any sane person would do' before a reckless act; rotten, smelly loser card versus glowing golden winner; bored call-centre agent blowing a bubble while saying impossible; cards exploding out of the machine like confetti; anticlimax: he reports it instead of getting rich; show-and-tease opening; rhetorical question pivot (how does the machine know); so what does he do question then short answer; numbers (five bucks, 90 percent); rule of three in the mechanism (two or three times, once, three in a row)

## Camera (one plan beat = one shot)
- **31 shots, median 2 s, longest 6.5 s.** Split long narration into several beats of ~2 s so the picture changes that often.
- **Framing:** medium 35%, insert-object 23%, extreme-close 13%, wide 13%, medium-close 10%, close 6%
- **Moves:** push-in 42%, static 29%, pull-out 19%, zoom 3%, pan 3%, tilt 3%
- **Transitions:** cut 58%, dissolve 19%, zoom-through 10%, none 6%, whip 3%, match-cut 3%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, static, on fired man behind kitchen counter with two scratch cards.
- **Shot rhythm in studio ids** (a guide, not a must): medium › close › high › xclose › xclose › wide › medium › xclose › medium › xclose › reveal › crane › wide › medium › high › close › xclose › xclose › xclose › reveal › medium › high › medium › close › low › medium › reveal › close › two › medium › wide

## Places (8)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Interior**: dark green wall, wood cabinets, black-white checker floor behind, wooden counter, desk lamp, wall phone. Light: warm lamp key from left, dim green fill; night → `"light": "homeWarm"`. Palette #1E3A33 #B8742E #F2B13C. Key props: scratch cards, counter, desk lamp, wall phone.
   Studio: { "type": "room", "kind": "kitchen" } (recolour walls / floor to fit)
2. **Interior**: full-frame purple and gold Vault Buster card with coin panels and number grids on dark background. Light: dark surround, cards glow from within; sparkles → `"light": "studio"`. Palette #2A2140 #E8A632 #C8302B. Key props: scratch card, coin, number grid, pencil.
   Studio: code set (write `Library/code/<Name>.js`): cardMacro: oversized flat card prop with coin panels and number grid texture that can light individual cells
3. **Interior**: glass-fronted tower lobby with 1200 above the doors, potted plants, guard. Light: golden sunset through glass → `"light": "golden"`. Palette #E0A458 #3A3A4A #F4E2C0. Key props: glass doors, desk-stuff box, guard.
   Studio: { "type": "room", "kind": "office" } (recolour walls / floor to fit)
4. **Interior**: white tiled store, colourful shelves, counter with LOTTERY ticket machine, queue of customers. Light: flat white fluorescent ceiling panels → `"light": "office"`. Palette #F2F2F2 #2B2F3A #D64032. Key props: lottery machine, counter, shelves, GAME CLOSED sign.
   Studio: { "type": "room", "kind": "shop" } (recolour walls / floor to fit)
5. **Interior**: blue factory wall with round window, yellow printing press, conveyor of cards, WINNERS counter board. Light: bright cheerful daylight from porthole window → `"light": "noon"`. Palette #3B5BA9 #F2B705 #E8792B. Key props: printing press, paper rolls, winners counter.
   Studio: code set (write `Library/code/<Name>.js`): printPlant: blue factory wall, yellow press, conveyor, rolls, winners counter board
6. **Interior**: navy striped wall, sunset painting, window blinds, floor covered in rows of cards. Light: night blue ambient with warm lamp pools → `"light": "moon"`. Palette #1C2A5E #E8792B #3A2E28. Key props: cards on floor, painting, table.
   Studio: { "type": "room", "kind": "living" } (recolour walls / floor to fit)
7. **Interior**: parchment road map with gas pump icons, red highways, STATE ROAD MAP label. Light: flat top-down → `"light": "studio"`. Palette #F4E3A8 #C8302B #E8A632. Key props: map, pointer, coins.
   Studio: { "type": "floor" }
8. **Interior**: white office with tall window to sky, navy desk with star seal, framed photos, red-backed chair. Light: bright daylight from window → `"light": "noon"`. Palette #1B2A6B #F4F4F4 #C8302B. Key props: headset, desk, box of cards, security plate.
   Studio: { "type": "room", "kind": "office" } (recolour walls / floor to fit)

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 108.2/255, colour saturation 21.3.

## Characters
- **fired office worker (protagonist)**: brown side-swept hair, yellow bean body with blue tie and ID lanyard. Acting: smug squint, suspicious side-eye, manic grin, wink, calm confidence when proving it.
- **lottery call agent**: black hair, headset, navy suit, red chair. Acting: lazy sneer, gum bubble, later nervous sweat.
- **press operator**: yellow hard hat, small figure on press platform. Acting: background worker.
- **security guard**: black cap and uniform. Acting: throws him out.
- **store customers**: assorted bean people, orange-shirted woman with bun. Acting: queue, stare, deadpan at closed sign.
- **Extras:** small store queue (3-5 people) and a few office background figures; story carried by one man
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~1% · prop: card brand Vault Buster names the object
- ~10% · sign: 1200 above tower door locates the old job
- ~13% · label: DESK STUFF box says he was fired
- ~31% · screen: WINNERS 400,000 counter shows winners are planned
- ~37% · prop: severance cheque
- ~71% · label: STATE ROAD MAP shows the scale of the opportunity
- ~88% · label: SECURITY plate and director nameplate mark the authority
- ~95% · sign: GAME CLOSED delivers the payoff
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`sparks`, `magic`, `explosion`, `pop` (plan beats' `"fx"`). Seen: golden glow and sparkles on winning card, green stink lines on losing card, number highlight glows, card explosion, reflection of number in glasses, coins popping on map, dissolves.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v16-flaw-finder-story"` in the plan.

## Prompts the media team can use
- `/v16-flaw-finder-story tạo video về a man who predicted roulette wheels by their tilt, thoại tiếng Việt, khoảng 63 giây`
- `Dùng skill v16-flaw-finder-story làm video "<chủ đề>", giọng kể hài hước, 45 giây`
