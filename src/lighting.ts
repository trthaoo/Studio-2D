// Lighting and picture style of a stage. Three layers, each optional, over the stage's mood (sky):
//   stage.lightPreset  a named lighting setup (LIGHTS), e.g. warm interior, neon night
//   stage.light        your own adjustments on top (sun colour, strength, direction, ambient, exposure, fog)
//   stage.look         a named shader style (LOOKS), e.g. bold ink, old film, pastel
//   stage.paint        your own shader adjustments on top (outline, saturation, grain, glow, vignette...)
// Lights and shader settings apply live (no rebuild); only a different sky rebuilds the stage.
import { MOODS } from 'engine/stage.js';
import type { Stage } from './doc';

export interface LightCfg {
  sun?: [string, number]; sunAz?: number; sunEl?: number;   // colour, strength; direction in degrees
  hemi?: [string, string, number];                             // sky colour, ground colour, ambient strength
  exposure?: number; charTint?: [number, number, number]; fog?: [string, number, number]; env?: number; grade?: string;
}
export interface LightPreset { label: string; tip: string; base?: 'day' | 'dusk' | 'night' | 'rain'; light: LightCfg; paint?: Record<string, any> }
export interface LookPreset { label: string; tip: string; paint: Record<string, any>; grade?: string }

export const LIGHTS: Record<string, LightPreset> = {
  noon: { label: 'Nắng trưa', tip: 'Nắng gắt trên đỉnh đầu, bóng ngắn, màu rõ.', base: 'day', light: { sun: ['#fff8e8', 4.2], sunAz: 40, sunEl: 72, hemi: ['#d6eaff', '#7c8c66', 1.1], exposure: 1.04 }, paint: { contrast: 1.06 } },
  morning: { label: 'Sáng sớm', tip: 'Nắng xiên, vàng nhạt, dịu.', base: 'day', light: { sun: ['#ffe2b8', 2.6], sunAz: 60, sunEl: 22, hemi: ['#cfe0ff', '#8a8f78', 1.15], charTint: [1, 0.98, 0.94] }, paint: { tintHigh: [0.02, 0.01, -0.005] } },
  golden: { label: 'Hoàng hôn vàng', tip: 'Nắng cam thấp, bóng dài, ấm.', base: 'dusk', light: { sun: ['#ffa040', 3.0], sunAz: -55, sunEl: 14, hemi: ['#c9a3ff', '#5a4a5e', 1.0], charTint: [1, 0.88, 0.76], env: 0.6 } },
  moon: { label: 'Đêm trăng', tip: 'Ánh trăng xanh lạnh, dịu.', base: 'night', light: { sun: ['#9fb8ff', 1.6], sunAz: 30, sunEl: 55, hemi: ['#6f8cff', '#1c2348', 1.35], exposure: 1.05, env: 0.45, charTint: [0.78, 0.84, 1] } },
  overcast: { label: 'Trời âm u', tip: 'Không có nắng rõ, xám, buồn.', base: 'rain', light: { sun: ['#d6e4f2', 0.9], sunEl: 70, hemi: ['#a9c2dc', '#3f4c56', 1.25] } },
  homeWarm: { label: 'Trong nhà ấm', tip: 'Đèn vàng trong nhà, ấm cúng.', base: 'day', light: { sun: ['#ffd9a0', 1.6], sunAz: 30, sunEl: 50, hemi: ['#ffe6c4', '#6b5040', 1.5], charTint: [1, 0.92, 0.8], env: 0.7, fog: ['#f0dcc0', 40, 400] }, paint: { tintShadow: [0.012, 0.004, 0] } },
  office: { label: 'Đèn văn phòng', tip: 'Đèn trần trắng, đều, hơi lạnh.', base: 'day', light: { sun: ['#f4f8ff', 1.4], sunAz: 10, sunEl: 80, hemi: ['#eef4ff', '#9aa3ad', 1.7] }, paint: { sat: 0.94 } },
  studio: { label: 'Studio sáng đều', tip: 'Sáng đều mọi phía, ít bóng, sạch.', base: 'day', light: { sun: ['#ffffff', 2.0], sunAz: 20, sunEl: 45, hemi: ['#ffffff', '#b8b8b8', 1.9] }, paint: { ao: 0.3 } },
  neon: { label: 'Neon đêm', tip: 'Hồng và xanh neon, phố đêm.', base: 'night', light: { sun: ['#ff4fd8', 1.8], sunAz: -50, sunEl: 35, hemi: ['#38e1ff', '#3a0f5e', 1.6], charTint: [1, 0.76, 1], env: 0.35, exposure: 0.95 }, paint: { bloom: 1.4, sat: 1.2 } },
  fire: { label: 'Ánh lửa, nến', tip: 'Cam đỏ từ một bên, xung quanh tối.', base: 'night', light: { sun: ['#ff8a3a', 2.2], sunAz: 70, sunEl: 20, hemi: ['#ff9c5a', '#200a05', 0.7], charTint: [1, 0.78, 0.58], exposure: 0.95, env: 0.3 } },
  horror: { label: 'Kinh dị', tip: 'Tối, xanh lạnh, đèn thấp, góc tối nặng.', base: 'night', light: { sun: ['#8fa8ff', 0.7], sunAz: 0, sunEl: 8, hemi: ['#3a4a6a', '#0a0a10', 0.6], exposure: 0.7, env: 0.25, charTint: [0.7, 0.76, 0.92] }, paint: { sat: 0.6, contrast: 1.2, vignette: [0.55, 0.25] } },
  alarm: { label: 'Báo động đỏ', tip: 'Đỏ rực, khẩn cấp.', base: 'night', light: { sun: ['#ff2a2a', 2.4], sunAz: 40, sunEl: 40, hemi: ['#ff5a5a', '#1a0505', 1.0], charTint: [1, 0.66, 0.66], env: 0.3 }, paint: { bloom: 1.2 } },
};

export const LOOKS: Record<string, LookPreset> = {
  ink: { label: 'Nét đậm truyện tranh', tip: 'Viền đen dày, màu tươi, tương phản.', paint: { ink: 1.2, inkWidth: [3.8, 2.0], contrast: 1.08, sat: 1.08 } },
  noink: { label: 'Không viền, 3D mềm', tip: 'Bỏ viền mực, đổ bóng mềm.', paint: { ink: 0, ao: 0.75 } },
  oil: { label: 'Sơn dầu', tip: 'Mảng màu như nét cọ.', paint: { radius: 3, detail: 0.25, grain: 0.03 } },
  film: { label: 'Phim cũ', tip: 'Hạt phim, màu ngả vàng, tối góc.', paint: { grain: 0.09, sat: 0.75, contrast: 1.06, vignette: [0.45, 0.3], tintShadow: [0.02, 0.01, 0], tintHigh: [0.03, 0.015, -0.01], bloom: 0.5 } },
  pastel: { label: 'Pastel mơ màng', tip: 'Màu nhạt, sáng, phát sáng nhẹ.', paint: { sat: 0.78, bright: 1.06, contrast: 0.9, bloom: 1.3, bloomThreshold: 0.85 } },
  vivid: { label: 'Rực rỡ', tip: 'Màu đậm, nổi, kiểu quảng cáo.', paint: { sat: 1.3, contrast: 1.06, bloom: 1.0 } },
  bw: { label: 'Đen trắng', tip: 'Đen trắng, hạt, tối góc.', paint: { sat: 0, contrast: 1.15, grain: 0.05, vignette: [0.35, 0.35] } },
  teal: { label: 'Điện ảnh xanh-cam', tip: 'Vùng tối xanh, vùng sáng cam, như phim chiếu rạp.', paint: { tintShadow: [-0.01, 0.015, 0.035], tintHigh: [0.035, 0.012, -0.02], contrast: 1.08, vignette: [0.3, 0.35] } },
  glow: { label: 'Phát sáng mạnh', tip: 'Đèn và chỗ sáng toả hào quang.', paint: { bloom: 2.0, bloomThreshold: 0.7 } },
  sketch: { label: 'Phác chì', tip: 'Gần như không màu, nét đậm, như bản phác thảo.', paint: { sat: 0.15, ink: 1.4, inkWidth: [2.2, 1.3], bright: 1.08, contrast: 0.85, grain: 0.06 } },
};

const hexNum = (s: string | number) => (typeof s === 'number' ? s : parseInt(String(s).replace('#', ''), 16));
const DEG = Math.PI / 180;
export function sunDirOf(az: number, el: number): [number, number, number] { return [Math.cos(el * DEG) * Math.sin(az * DEG), Math.sin(el * DEG), Math.cos(el * DEG) * Math.cos(az * DEG)]; }
export function sunAngles(d: number[]): { az: number; el: number } { const l = Math.hypot(d[0], d[1], d[2]) || 1; return { az: Math.round(Math.atan2(d[0], d[2]) / DEG), el: Math.round(Math.asin(d[1] / l) / DEG) }; }

/** The full mood object for a stage: its sky mood, the lighting preset, your lighting, the look, your shader settings. */
export function stageMood(s: Stage): any {
  const base: any = (MOODS as any)[s.mood] || (MOODS as any).day;
  const m: any = { ...base, paint: { ...(base.paint || {}) } };
  const put = (L?: LightCfg) => {
    if (!L) return;
    if (L.sun) m.sun = [hexNum(L.sun[0]), L.sun[1]];
    if (L.sunAz != null || L.sunEl != null) { const cur = sunAngles(m.sunDir); m.sunDir = sunDirOf(L.sunAz ?? cur.az, L.sunEl ?? cur.el); }
    if (L.hemi) m.hemi = [hexNum(L.hemi[0]), hexNum(L.hemi[1]), L.hemi[2]];
    if (L.exposure != null) m.exposure = L.exposure;
    if (L.charTint) m.charTint = L.charTint;
    if (L.fog) m.fog = [hexNum(L.fog[0]), L.fog[1], L.fog[2]];
    if (L.env != null) m.env = L.env;
    if (L.grade) m.grade = L.grade;
  };
  const pre = s.lightPreset ? LIGHTS[s.lightPreset] : null;
  if (pre) { put(pre.light); Object.assign(m.paint, pre.paint || {}); }
  put(s.light as LightCfg);
  const look = s.look ? LOOKS[s.look] : null;
  if (look) { Object.assign(m.paint, look.paint); if (look.grade) m.grade = look.grade; }
  Object.assign(m.paint, s.paint || {});
  return m;
}
/** What needs a rebuild (the painted sky); everything else is applied live. */
export const skySig = (m: any) => JSON.stringify([m.sky, m.ground, m.cloud, m.clouds, m.stars, m.wisps]);

/** Put a mood's lights, fog, exposure and shader settings on a built stage without rebuilding it. */
export function applyLive(st: any, m: any) {
  st.mood = m; st.grade = m.grade;
  st.hemi.color.setHex(m.hemi[0]); st.hemi.groundColor.setHex(m.hemi[1]); st.hemi.intensity = m.hemi[2];
  st.sun.color.setHex(m.sun[0]); st.sun.intensity = m.sun[1];
  st.sunDir.set(m.sunDir[0], m.sunDir[1], m.sunDir[2]).normalize();
  if (st.scene.fog) { st.scene.fog.color.setHex(m.fog[0]); st.scene.fog.near = m.fog[1]; st.scene.fog.far = m.fog[2]; }
  st.scene.environmentIntensity = m.env;
}
