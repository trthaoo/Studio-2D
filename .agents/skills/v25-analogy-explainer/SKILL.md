---
name: v25-analogy-explainer
description: "2D Studio video recipe 25 — science-of: Ask the naive question everyone has about how an everyday thing 'knows' what to do, follow the thing on its journey through the body or system, then explain it with one big household analogy that flips the assumption (it doesn't target anything; it affects everything and you only notice one change). Use when the user types /v25-analogy-explainer, says 'skill v25', or wants a short about: Everyday science where people assume something is 'smart': how sunscreen knows where the sun is, how antibiotics find the bad bacteria, how a fuse knows which device broke, how caffeine knows you're tired, how noise-cancelling headphones know which sound to cut. Always read video-studio first."
---

# v25-analogy-explainer · Khoa học đằng sau

Recipe measured frame by frame from reference short #25 (34.5 s, 21 shots, 7 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** Ask the naive question everyone has about how an everyday thing 'knows' what to do, follow the thing on its journey through the body or system, then explain it with one big household analogy that flips the assumption (it doesn't target anything; it affects everything and you only notice one change)
- **Fits topics like:** Everyday science where people assume something is 'smart': how sunscreen knows where the sun is, how antibiotics find the bad bacteria, how a fuse knows which device broke, how caffeine knows you're tired, how noise-cancelling headphones know which sound to cut
- **Signature moves (keep these):**
  - Open with a relatable sufferer and three rapid naive questions, one of them absurdly literal
  - Follow the object on its journey through a cartoon interior with joke signage at every stop
  - Restate the question with a gag label (no brain included), then hard switch to one big household analogy
  - Long push down an endless corridor to the one screaming room, then an army of the object silencing every room
  - Return to the opening character for a one-beat relieved payoff

## Script
- **Length:** about 34.5 s (scale to what the user asks), ~137 words at **3.97 words/s** → plan `"pace": 4`; sentences ~13.7 words.
- **Voice:** second; tone: curious, playful explainer with rapid rhetorical questions, settling into a vivid single analogy. All words are voice-over (every beat `"who": null`); the characters never speak, they act with faces and arms.
- **Hook (first 5.8 s, question):** How does [everyday thing] know where [the problem] is? You [use it], and then what? Does it [absurd literal idea]?
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–17% | Three quick questions: how does a pill find the pain, then what, does it use a map |
| setup | 17–31% | What we know: it dissolves in the stomach, enters the blood, and twenty minutes on the ache is gone |
| question | 32–42% | Restated: how can a brainless pill locate the single sore spot |
| analogy | 43–65% | Body as a house of countless rooms, each with a smoke alarm; injury sets one off, that is pain |
| mechanism | 66–85% | The painkiller bursts in and pulls the batteries from every alarm in the house |
| payoff | 85–99% | The rest were already quiet, so the only silence you notice is in your head |

- **Ending (reframe):** Every other [part] was already [normal], so the only [change] you notice is the one in [the problem spot].
- **Devices:** pill consulting a road map in the stomach; ACID SPA sign with pool rules; BRAIN NOT INCLUDED x-ray label; highway sign to HEADACHE 20 MIN; pill army kicking in the front door; FOR RENT sign in a quiet room; stacked rhetorical questions; second-person you-scenario; numbers (20 minutes, thousands of rooms); extended analogy (body as a house, pain as an alarm); assumption flip (not targeted, it hits everything); return to the opening character for the payoff

## Camera (one plan beat = one shot)
- **21 shots, median 1.25 s, longest 5.5 s.** Split long narration into several beats of ~1.25 s so the picture changes that often.
- **Framing:** wide 43%, medium 24%, close 19%, medium-close 10%, insert-object 5%
- **Moves:** static 43%, push-in 33%, follow 10%, pull-out 5%, pan 5%, truck 5%
- **Transitions:** cut 48%, fly-through 24%, dissolve 14%, whip 10%, none 5%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** medium, eye angle, push-in, on guy at a messy kitchen table clutching his throbbing head.
- **Shot rhythm in studio ids** (a guide, not a must): medium › close › follow › medium › medium › follow › wide › close › close › xclose › reveal › wide › follow › close › wide › low › medium › follow › wide › medium › close

## Places (7)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Interior**: cosy kitchen with white cabinets, window blinds, hanging pendant lamp, wooden table strewn with pizza box, overdue notice, pill bottle and water glass, stick-figure drawing on the wall. Light: warm pendant lamp and soft daylight → `"light": "homeWarm"`. Palette #E8E2D6 #7A3FC0 #C88A4A. Key props: table, pill bottle, water glass, pizza box, notice letter.
   Studio: { "type": "room", "kind": "kitchen" } (recolour walls / floor to fit)
2. **Interior**: glossy red-pink fleshy tube with streaks. Light: soft red glow → `"light": "horror"`. Palette #C8403A #F08070 #7A1A2A. Key props: pill.
   Studio: code set (write `Library/code/<Name>.js`): fleshTunnel: glossy curved tube for fly-through falls (shared with blood vessel)
3. **Interior**: red cavern with a bubbling green acid pool, ACID SPA sign, TO BLOOD grates, floating pizza slice. Light: warm red ambient with green pool glow → `"light": "homeWarm"`. Palette #B8302A #8CC83A #1A3A6A. Key props: acid pool, ACID SPA sign, road map, drain grates.
   Studio: code set (write `Library/code/<Name>.js`): stomachSpa: red cavern with acid pool, signs, drain grates
4. **Interior**: pink-red vessel tunnel with ring arches, red blood cells as discs, green motorway sign; a cavern of glowing round body-part rooms stacked like a pyramid. Light: warm pink glow, rim light on arches → `"light": "studio"`. Palette #E0605A #F5B0A0 #2A8A4A. Key props: blood cells, highway sign, body-part rooms, x-ray overlay.
   Studio: code set (write `Library/code/<Name>.js`): bloodHighway: arched vessel tunnel with blood-cell discs and road signs; body-room pyramid backdrop
5. **Exterior**: blue clapboard two-storey house with porch, glowing windows, picket fence, path, street lamp, reddish night sky. Light: night with warm window glow → `"light": "moon"`. Palette #5A6AC8 #F5D08A #7A2A4A. Key props: front door, porch, picket fence, street lamp.
   Studio: { "type": "house" }
6. **Interior**: endless arched corridor with white doors on both sides, red carpet with gold edging, wall sconces, smoke alarm per room, stairs up to a HEAD door at the end. Light: warm sconce light, turning alarm red near the end → `"light": "alarm"`. Palette #E06A5A #F5D8C8 #8A1A1A. Key props: doors, smoke alarms, HEAD door, FOR RENT sign, carpet.
   Studio: code set (write `Library/code/<Name>.js`): endlessHallway: repeating arched corridor of doors with alarms, carpet, stairs to an end door
7. **Interior**: pale pink room with round windows and a round smoke alarm high on the wall. Light: soft diffuse pink → `"light": "studio"`. Palette #F0C8C0 #E08070 #FFFFFF. Key props: smoke alarm, round windows.
   Studio: { "type": "room", "kind": "empty" } (recolour walls / floor to fit)

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 114.7/255, colour saturation 33.4.

## Characters
- **everyday guy with a headache (you)**: brown bowl-cut hair, purple T-shirt, round white head. Acting: rubbing temple with pain lines, squeezed-shut eyes, gulping a pill, relaxed smile.
- **painkiller pill**: capsule with clear teal top full of beads and white bottom, tiny legs and face. Acting: cheerful bathing, puzzled map reading, determined marching, door kicking.
- **Extras:** an army of about 20 identical pill characters marching and climbing; otherwise one character
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~0% · label: props (pizza box, overdue notice, pain-relief bottle) set an ordinary stressful day
- ~13% · sign: ACID SPA sign turns the stomach into a joke location
- ~14% · screen: HUMAN BODY road map dramatises the 'does it use a map' question
- ~22% · sign: TO BLOOD sign shows the next step of the journey
- ~26% · sign: HEADACHE 20 MIN highway sign matches the time in the narration
- ~36% · label: BRAIN NOT INCLUDED stresses the pill can't know anything
- ~39% · label: room labels (HEAD, limbs) map the body
- ~52% · sign: FOR RENT sign gag in a silent room
- ~93% · sign: HEAD door marks the destination
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`bubbles`, `magic`, `pop` (plan beats' `"fx"`). Seen: pain lines on the head, acid bubbles and splash, x-ray overlay, red pulsing alarm glow, dissolves, sweat drops.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v25-analogy-explainer"` in the plan.

## Prompts the media team can use
- `/v25-analogy-explainer tạo video về how sunscreen knows where the sun is, thoại tiếng Việt, khoảng 35 giây`
- `Dùng skill v25-analogy-explainer làm video "<chủ đề>", giọng kể hài hước, 45 giây`
