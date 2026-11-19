# 2D Studio

Local studio for videos in the 3d-video-studio look where every object is editable on a timeline.
Vite + TypeScript + three.js (no framework), modeled on Rigging Studio (Desktop\Content\Rigging-3d-studio).

- Making or fixing a video: read `skill/SKILL.md`. Videos are `Projects/<name>/scene.json` (objects + keyframes).
  Never write per-video code; the studio reloads scene.json when it changes on disk.
- `npm start` → http://localhost:5200. `npm run typecheck`. Render: `node scripts/render.mjs "<project>" [--layers]`
  (needs the studio running; uses Edge/Chrome headless + ffmpeg-static).
- Code: `src/doc.ts` (scene format, keyframe evaluation), `src/runtime.ts` (doc → engine → frame), `src/ui/*`
  (viewport, timeline, panels), `src/renderPage.ts` + `scripts/render.mjs` (offline render, layer masks),
  `vite.config.ts` (the /api back end). `src/debugTurn.ts`: turnaround / head sheets of a character saved as
  snapshots, to check the engine from every side after changing `engine/chars.js` (hair, limbs, accessories). `engine/` is the skill's engine (three.js 0.187 pinned); `vendor/` is the
  original skill repo for reference.
