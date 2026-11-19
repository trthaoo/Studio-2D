// Shapes and summary maths of the performance log (no side effects: used by the studio and by perf.html).
export interface PerfSample { t: number; fps: number; ms: number; p90: number; cpu: number; lvl: number; w: number; h: number; heap: number | null; play: boolean }
export interface PerfEvent { t: number; kind: string; text: string }
export interface PerfSession {
  id: string; started: string; ended: string; seconds: number;
  machine: { gpu: string; vendor: string; cores: number | null; memoryGB: number | null; dpr: number; screen: string; refreshHz: number; browser: string; platform: string };
  projects: string[];
  totals: {
    frames: number;            // frames drawn while something moved (playing, scrubbing, dragging)
    movingSeconds: number;     // time spent moving
    playSeconds: number;       // of which playing
    stills: number;            // single frames drawn (a click, a change)
    slow: number;              // moving frames slower than 33 ms (under 30 a second)
    jank: number;              // moving frames slower than 50 ms (a visible stutter)
    cpuMs: number;             // sum of CPU time to draw the moving frames
    stillCpuMs: number;
    longTasks: number; longTaskMs: number;   // page busy over 50 ms at a time (UI freezes)
    levelSeconds: number[];    // time moving at each preview level (0 = sharpest)
    levelChanges: number;
    heapMaxMB: number | null;
  };
  hist: number[];              // moving frame times: count per BUCKET ms (last bucket = 200 ms or more)
  samples: PerfSample[];       // one a second while moving
  events: PerfEvent[];
}
export interface RenderRec { at: string; session: string; project: string; state: string; layers: boolean; layerCount: number | null; frames: number | null; framesDone: number; videoFps: number | null; from: number | null; to: number | null; width: number; height: number; loopSeconds: number | null; totalSeconds: number; renderFps: number | null; msPerFrame: number | null; realtime: number | null }

export const BUCKET = 2, NB = 101;

/** Percentile of a frame-time histogram (ms), null when empty. */
export function histPct(hist: number[], q: number) {
  const n = hist.reduce((a, b) => a + b, 0); if (!n) return null;
  let c = 0; for (let i = 0; i < hist.length; i++) { c += hist[i]; if (c >= q * n) return (i + 0.5) * BUCKET; }
  return null;
}
/** Summary numbers of a session (also used for the tables and the CSV). */
export function summary(s: Pick<PerfSession, 'totals' | 'hist'>) {
  const T = s.totals, n = s.hist.reduce((a, b) => a + b, 0);
  const lvl = T.levelSeconds.indexOf(Math.max(...T.levelSeconds));
  return {
    fps: T.movingSeconds > 0 ? +(n / T.movingSeconds).toFixed(1) : null,
    ms50: histPct(s.hist, 0.5), ms90: histPct(s.hist, 0.9), ms99: histPct(s.hist, 0.99),
    slowPct: n ? +(T.slow / n * 100).toFixed(1) : null, jankPct: n ? +(T.jank / n * 100).toFixed(1) : null,
    cpu: T.frames ? +(T.cpuMs / T.frames).toFixed(2) : null,
    level: T.movingSeconds > 0 ? lvl : null,
  };
}
