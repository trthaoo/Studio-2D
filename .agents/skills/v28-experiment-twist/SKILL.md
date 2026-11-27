---
name: v28-experiment-twist
description: "2D Studio video recipe 28 — experiment: A researcher stages an extreme test of a popular belief; subjects insist the belief is true, a hidden measurement proves it false, and the real mechanism behind the feeling is explained. Use when the user types /v28-experiment-twist, says 'skill v28', or wants a short about: Popular beliefs that someone actually tested: can people taste the difference in expensive wine, does a full moon fill emergency rooms, can you feel someone staring at you, does music make plants grow, do placebo pills work even when labelled. Always read video-studio first."
---

# v28-experiment-twist · Thí nghiệm

Recipe measured frame by frame from reference short #28 (40.1 s, 17 shots, 7 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** A researcher stages an extreme test of a popular belief; subjects insist the belief is true, a hidden measurement proves it false, and the real mechanism behind the feeling is explained
- **Fits topics like:** Popular beliefs that someone actually tested: can people taste the difference in expensive wine, does a full moon fill emergency rooms, can you feel someone staring at you, does music make plants grow, do placebo pills work even when labelled
- **Signature moves (keep these):**
  - Shock-claim hook while the camera falls with the subject in the middle of the test
  - Dive through the subject's eye into a little control room inside the head
  - Show the hypothesis as a blueprint and the measuring gadget in extreme close-up
  - Testimony confirms the belief, then a giant unreadable answer exposes it
  - Explain the real mechanism back in the head room and match-cut to the opening setting

## Script
- **Length:** about 40.1 s (scale to what the user asks), ~143 words at **3.57 words/s** → plan `"pace": 3.6`; sentences ~15.9 words.
- **Voice:** third-person; tone: playful, slightly macabre science storytelling with a clean reversal. All words are voice-over (every beat `"who": null`); the characters never speak, they act with faces and arms.
- **Hook (first 5.2 s, shocking-claim):** A [researcher] did [outrageous thing to people] just to learn [what happens to X] right before [extreme moment].
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–13% | A scientist drops people from a tower to test time right before death |
| claim | 15–35% | Popular belief: terror speeds the brain so the world slows, crash survivors agree |
| setup | 36–50% | Before each fall, a wrist screen flashes digits too fast to read |
| hypothesis | 51–59% | If time truly slowed, they could read the digits mid-fall |
| result | 60–71% | Everyone says the fall felt much longer than it was |
| twist | 71–79% | None of them can name the number |
| explain | 80–100% | Fear makes the brain record extra detail, so the replay feels slow |

- **Ending (explanation-reframe):** Reframe the feeling: in [extreme state] the brain [does Y], so later [the memory] only feels like [the myth].
- **Devices:** pigeon and hat hanging in mid-air beside the screaming faller; panicking brain character at a drafting desk; support group re-enacting crashes with toy cars; blank faces before a giant number; NORMAL TUESDAY thin pile vs huge fear pile; bragging about it at a barbecue; shocking-claim hook; 'apparently' common belief; survivor testimony; if-then hypothesis; reversal 'but when he asked'; 'you see' explanation; callback to slow motion

## Camera (one plan beat = one shot)
- **17 shots, median 2 s, longest 6 s.** Split long narration into several beats of ~2 s so the picture changes that often.
- **Framing:** medium 47%, wide 29%, extreme-close 12%, close 6%, insert-object 6%
- **Moves:** push-in 59%, static 6%, follow 6%, tilt 6%, crane-down 6%, truck 6%, pull-out 6%, crane-up 6%
- **Transitions:** cut 65%, none 12%, zoom-through 6%, dissolve 6%, fly-through 6%, match-cut 6%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** wide, high angle, static, on scientist on the tower platform beside a harnessed volunteer who tips off.
- **Shot rhythm in studio ids** (a guide, not a must): wide › follow › xclose › reveal › low › high › medium › two › close › xclose › xclose › crane › follow › wide › reveal › medium › crane

## Places (7)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Exterior**: tall orange lattice drop tower with FREEFALL banner, platform with hazard stripes, amusement park, parking lot and fields far below. Light: bright noon sun, blue sky → `"light": "noon"`. Palette #F28A1C #2B56C9 #7DBF4A. Key props: lattice tower, platform, harness, pigeon, red cap.
   Studio: code set (write `Library/code/<Name>.js`): dropTower: tall orange lattice tower with banner and platform, fairground and parking far below
2. **Interior**: round room inside the head: porthole windows as eyes, drafting desk piled with sketches, rainbow rug, lamp, PANIC button. Light: warm interior, sky light through portholes; later red-orange alarm tint → `"light": "homeWarm"`. Palette #E9C9A0 #F06A3A #3B8FE0. Key props: drafting desk, portholes, sketch stacks, PANIC button, brain character.
   Studio: code set (write `Library/code/<Name>.js`): brainOffice: round room inside a head with porthole eyes, drafting desk, rainbow rug
3. **Interior**: community hall with a circle of wooden chairs on a round rug, CRASH SURVIVORS banner, snack table, flag. Light: flat fluorescent office light → `"light": "office"`. Palette #E8E2D2 #C93A3A #3E6FB0. Key props: circle of chairs, banner, toy cars, snack table.
   Studio: { "type": "room", "kind": "living" } (recolour walls / floor to fit)
4. **Exterior**: foot of the drop tower: landing net, orange railings, rubber floor, LONE STAR banner, Ferris wheel and rollercoaster behind. Light: bright noon sun → `"light": "noon"`. Palette #F28A1C #2B56C9 #3A3A3A. Key props: landing net, wrist screen, stopwatch, banner.
   Studio: code set (write `Library/code/<Name>.js`): dropTower base: landing net, railings, rubber floor, Ferris wheel behind
5. **Interior**: blue blueprint pinned on a clipboard: tower sketch, falling figure, hypothesis notes, title block. Light: even soft light → `"light": "studio"`. Palette #1E4FA3 #E8EEF8 #D9342B. Key props: blueprint, clipboard.
   Studio: { "type": "room", "kind": "office" } (recolour walls / floor to fit)
6. **Interior**: dark lounge with pendant lamps, back wall of giant red LED digits. Light: dim warm pendants, red glow from digits → `"light": "office"`. Palette #3A2618 #D9342B #E8D2A8. Key props: giant LED number, pendant lamps, clipboard.
   Studio: { "type": "room", "kind": "empty" } (recolour walls / floor to fit)
7. **Exterior**: backyard barbecue at sunset: string lights, folding chairs, red pickup, dog. Light: golden-hour sunset, warm string lights → `"light": "golden"`. Palette #F07A3A #7A3A8C #F2C230. Key props: paper stack, folding chairs, pickup truck, dog.
   Studio: { "type": "house" }

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 135.6/255, colour saturation 26.8.

## Characters
- **scientist**: black hair, round glasses, mustache, white lab coat. Acting: calm, clinical, straps on devices, holds stopwatch.
- **volunteer**: red cap, round glasses, orange harness jumpsuit. Acting: screaming bug eyes in the fall, dazed spiral eyes, then smug storyteller.
- **brain**: pink brain with glasses and tiny limbs. Acting: sweating, frantic sketching.
- **survivor storyteller**: grey bun, glasses, pink outfit. Acting: animated re-enactment with toy cars.
- **other volunteers**: matching harness jumpsuits, mixed hair. Acting: queue, shrug, blank faces.
- **Extras:** support group circle of about eight; queue and lineup of about five volunteers; party guests
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~0% · sign: STAR THRILLS banner sets the fairground
- ~4% · sign: FREEFALL lettering names the tower
- ~27% · sign: CRASH SURVIVORS banner labels the group
- ~42% · screen: wrist display flashes digits
- ~49% · label: CHRONO-2 device label
- ~51% · label: HYPOTHESIS blueprint states the test
- ~71% · screen: giant number nobody could read
- ~82% · label: NORMAL TUESDAY pile vs fear pile compares detail
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`pop`, `sparks` (plan beats' `"fx"`). Seen: slow-motion floating objects, sweat drops, motion blur in the fall, dissolve, toy car crash sparks, growing paper stack.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v28-experiment-twist"` in the plan.

## Prompts the media team can use
- `/v28-experiment-twist tạo video về can people taste the difference in expensive wine, thoại tiếng Việt, khoảng 40 giây`
- `Dùng skill v28-experiment-twist làm video "<chủ đề>", giọng kể hài hước, 45 giây`
