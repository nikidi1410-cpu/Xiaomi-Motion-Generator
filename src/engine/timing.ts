export const FPS = 60;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION_S = 30;
export const TOTAL_FRAMES = FPS * DURATION_S; // 1800

/** TikTok / Reels safe zone (UI overlays: top bar, right action rail, caption area). */
export const SAFE = { top: 220, bottom: 400, left: 110, right: 110 } as const;
export const SAFE_RECT = {
  x0: SAFE.left,
  y0: SAFE.top,
  x1: WIDTH - SAFE.right,
  y1: HEIGHT - SAFE.bottom,
} as const;

export const sec = (s: number) => Math.round(s * FPS);

export interface SceneDef {
  id: number;
  name: string;
  start: number; // inclusive frame
  end: number; // exclusive frame
}

const def = (id: number, name: string, a: number, b: number): SceneDef => ({
  id,
  name,
  start: sec(a),
  end: sec(b),
});

export const SCENES: SceneDef[] = [
  def(1, 'Kinetic Opener', 0, 2.5),
  def(2, 'Logo Squircle', 2.5, 5.0),
  def(3, 'Timeline 2010–2026', 5.0, 11.0),
  def(4, '600 Juta Perangkat', 11.0, 14.5),
  def(5, 'Orbit HyperOS', 14.5, 18.0),
  def(6, 'Pre-cooling SU7', 18.0, 21.0),
  def(7, 'HyperEngine & 2040', 21.0, 24.0),
  def(8, 'Xiaomi Foundation', 24.0, 26.5),
  def(9, 'Call to Action', 26.5, 28.0),
  def(10, 'Grand Finale', 28.0, 30.0),
];

export function sceneIndexAt(frame: number): number {
  for (let i = 0; i < SCENES.length; i++) {
    if (frame >= SCENES[i].start && frame < SCENES[i].end) return i;
  }
  return SCENES.length - 1;
}

export const fmtTime = (frame: number) => {
  const s = frame / FPS;
  return `${s.toFixed(2).padStart(5, '0')}s`;
};
