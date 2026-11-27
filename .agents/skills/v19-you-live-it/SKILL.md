---
name: v19-you-live-it
description: "2D Studio video recipe 19 — hidden-job: A rule makes the obvious punishment impossible, so institutions invent a disguised alternative that looks like a reward; the viewer lives it in second person from paradise to isolation until a role model vanishes, then the loophole is named. Use when the user types /v19-you-live-it, says 'skill v19', or wants a short about: Hidden practices that punish without breaking a rule, told as 'imagine you': prisons that use silence instead of beatings, schools that seat troublemakers alone in a booth, sports teams that bench a star to force a trade, landlords who stop all repairs to push tenants out, armies that give a disgraced officer a meaningless post. Always read video-studio first."
---

# v19-you-live-it · Nghề ít ai biết

Recipe measured frame by frame from reference short #19 (60.6 s, 33 shots, 5 places). Make **new**
content in this shape for the user's topic. Never reuse the reference's topic, lines, characters or places unless the user
asks for that very topic. Read `../video-studio/SKILL.md` first (workflow, exact plan format, house style).

## The idea
- **Premise pattern:** A rule makes the obvious punishment impossible, so institutions invent a disguised alternative that looks like a reward; the viewer lives it in second person from paradise to isolation until a role model vanishes, then the loophole is named
- **Fits topics like:** Hidden practices that punish without breaking a rule, told as 'imagine you': prisons that use silence instead of beatings, schools that seat troublemakers alone in a booth, sports teams that bench a star to force a trade, landlords who stop all repairs to push tenants out, armies that give a disgraced officer a meaningless post
- **Signature moves (keep these):**
  - Paradox hook over a big symbolic prop (a giant FIRE button that cannot be pressed)
  - Second-person imagine walk-through: the 'reward' room looks like paradise at first
  - Escalating small signs of isolation in quick inserts (stares, empty inbox, someone else's photos)
  - A role model who seems happy, then one day his desk is empty and nobody explains
  - Explanation visualised with labelled props: law padlock on the alarm, breaker switches for friends and hope

## Script
- **Length:** about 60.6 s (scale to what the user asks), ~225 words at **3.72 words/s** → plan `"pace": 3.7`; sentences ~15 words.
- **Voice:** second-person; tone: playful you-scenario that sours into quiet psychological dread, ending on a cold explanation. Narrator says 97% of the words (beats with `"who": null`); characters speak only short lines (beats with their name).
- **Hook (first 4.2 s, paradox-claim):** It is impossible to [standard punishment] in [place], but [institutions] found something far worse.
- **Beats** (share of the runtime):

| role | when | what happens |
|---|---|---|
| hook | 0–7% | You cannot be fired there, yet companies found something worse |
| setup | 8–22% | Imagine your boss leads you to a tiny empty room with a clock and a relaxed veteran on his phone |
| rule | 23–35% | Your new job is nothing; you are paid to sit till six and it feels like paradise |
| escalation | 36–47% | Colleagues stare, emails dry up, a stranger's family photos sit on your old desk |
| ritual | 47–54% | Each Friday the smiling boss checks how you like the new role |
| false-comfort | 55–70% | The veteran has done this for years and seems happiest of all, so you join him |
| twist | 70–81% | One Monday he is gone, desk cleared, and nobody will say where |
| explain | 81–90% | Law makes firing nearly impossible but nothing bans making staff miserable |
| payoff | 90–100% | They strip work and friends and simply wait, since nobody lasts doing nothing |

- **Ending (chilling-explanation):** They remove [what you need] piece by piece and just wait, because nobody can endure [the empty reward] forever.
- **Devices:** giant red FIRE button that cracks when slammed; career development room sign on a storage closet; cobweb in the to-do tray; sunglasses-lounging top shot of two idle workers; boss's relentless cheerful head poking round the door; breaker switches labelled lunch, wi-fi, friends, hope; second-person imagine scenario; paradox hook (impossible to fire, something worse); inner-voice question (wait, I'm getting paid?); escalating small details (stares, emails, photos); you see explanation pivot; list of things taken away

## Camera (one plan beat = one shot)
- **33 shots, median 1.5 s, longest 4 s.** Split long narration into several beats of ~1.5 s so the picture changes that often.
- **Framing:** medium 48%, insert-object 21%, close 15%, wide 6%, extreme-close 3%, ots 3%, extreme-wide 3%
- **Moves:** static 39%, push-in 30%, pull-out 15%, tilt 6%, follow 6%, truck 3%
- **Transitions:** cut 64%, dissolve 18%, fly-through 9%, none 3%, zoom-through 3%, whip 3%. The studio has cut and dissolve: use `"transition": "dissolve"` for fly-throughs / zoom-throughs / dissolves, and a `"move": "push"` or `"reveal"` on the shot before or after to sell the fly-through.
- **Opening shot:** insert-object, high angle, static, on red FIRE EMPLOYEE button; a fist comes down on it.
- **Shot rhythm in studio ids** (a guide, not a must): xclose › xclose › high › xclose › medium › follow › medium › high › xclose › reveal › medium › ots › xclose › close › high › follow › xclose › reveal › xclose › close › low › reveal › two › wide › medium › high › medium › medium › xclose › reveal › medium › close › close

## Places (5)
The reference used these. For a new topic, keep the **number of places, the interior/exterior mix, the light contrast between
places and the one "reveal" place** (the inside view / cutaway), and invent places that fit the topic.
1. **Interior**: wood-panelled executive office, calligraphy scroll, shoji window with city tower, green-topped desk with big red button. Light: warm desk light against cool blue window → `"light": "homeWarm"`. Palette #8A4A2A #2B3FA0 #D64032. Key props: FIRE button, scroll, STORAGE key, desk.
   Studio: { "type": "room", "kind": "office" } (recolour walls / floor to fit)
2. **Interior**: white walls and ceiling tiles, blue carpet, rows of desks and monitors, lucky-cat figure, city windows. Light: bright flat fluorescent → `"light": "office"`. Palette #F4F4F4 #1E40C8 #E8792B. Key props: desks, monitors, family photo, lucky cat.
   Studio: { "type": "room", "kind": "office" } (recolour walls / floor to fit)
3. **Interior**: small green-tiled closet, two bare desks, wall clock, calendar, boxes, bookshelf, yellow sunbeam. Light: single yellow sunbeam across a cool room → `"light": "morning"`. Palette #7FBF7A #F2C230 #4A6ED9. Key props: clock, empty desk, calendar, phone, to-do tray.
   Studio: { "type": "room", "kind": "empty" } (recolour walls / floor to fit)
4. **Exterior**: glass skyscraper grid of blue lit floors at dusk, one warm window. Light: dusk blue with interior glow → `"light": "golden"`. Palette #1B2A8C #3E7AD9 #F2B13C. Key props: windows, city skyline.
   Studio: code set (write `Library/code/<Name>.js`): officeTower: tall facade grid of lit windows with one highlighted window
5. **Interior**: dim blue hallway, door with CAREER DEVELOPMENT ROOM sign, wall lamp, fire alarm, breaker panel, lucky cat. Light: dark blue with a single warm wall lamp → `"light": "moon"`. Palette #1E2A9C #F2C25A #D64032. Key props: fire alarm, padlock, breaker panel, door sign.
   Studio: { "type": "room", "kind": "office" } (recolour walls / floor to fit)

Picture style (shader): `"look": "ink"` (others seen: ink). Brightness of the reference 130/255, colour saturation 28.5.

## Characters
- **you, the sidelined worker**: black bowl-cut hair, light blue shirt and tie, ID badge. Acting: nervous sweat, delight, sunglasses lounging, unease, alone at the end.
- **smiling boss**: grey side-parted hair, navy suit, red tie. Acting: permanent closed-eye grin, peeks round doors, playful waves.
- **veteran idler**: brown hair, teal jacket. Acting: feet up, scrolling, blissful smile, then gone.
- **coworkers**: assorted office bean people. Acting: stares, silent avoidance.
- **Extras:** office background of 4-8 coworkers; tower exterior shows tiny figures in many windows
Give each a distinct silhouette (hair style + outfit colour) so a viewer can follow them at a glance; the same person in
another scene keeps the same look (the studio does this automatically from `cast`).

## Text on screen (signs, screens, labels: they carry the story)
- ~1% · prop: FIRE EMPLOYEE button states the impossible option
- ~6% · label: STORAGE key tag hints the real nature of the new job
- ~12% · sign: CAREER DEVELOPMENT ROOM euphemism
- ~14% · label: TO DO tray empty
- ~31% · screen: pay deposit on phone
- ~41% · screen: inbox zero shows the isolation
- ~48% · prop: calendar Friday ritual and later Monday
- ~84% · label: LABOR LAW padlock on the fire alarm makes the law visual
- ~90% · label: breaker switches named after what is taken away
Use `sign`, `screen`, `counter`, `deskPlate` props with short CAPITAL words, or text on a code set.

## Effects
`sparks`, `pop`, `magic` (plan beats' `"fx"`). Seen: button crack sparks, sweat drops, sunbeam, cobwebs, dissolves, dimming lights, red alarm glow.

## Captions
1 word per card (plan `"captionWords": 1`), bold white sans, thin black outline, 1-2 words per card synced to speech, centred, about 70% down the frame.

## Not the same video twice
- Read `Library/plans/*.json`: change the set type / colours, the light and the shader from the last videos, and open on a different shot.
- New cast looks every time (hair style, outfit, colours). Keep the recipe's *shape*, never its surface.
- Set `"skill": "v19-you-live-it"` in the plan.

## Prompts the media team can use
- `/v19-you-live-it tạo video về prisons that use silence instead of beatings, thoại tiếng Việt, khoảng 61 giây`
- `Dùng skill v19-you-live-it làm video "<chủ đề>", giọng kể hài hước, 45 giây`
