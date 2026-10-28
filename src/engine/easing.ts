import { FPS } from './timing';

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type EaseFn = (t: number) => number;

/**
 * CSS-compatible cubic-bezier solver (Newton-Raphson with bisection fallback),
 * same maths as browsers use for `transition-timing-function`.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EaseFn {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dsx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  const solveX = (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-6) return t;
      const d = dsx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    while (lo < hi) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) return t;
      if (x > v) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
      if (hi - lo < 1e-7) break;
    }
    return t;
  };

  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return sy(solveX(t));
  };
}

export const Ease = {
  linear: (t: number) => t,
  outCubic: cubicBezier(0.33, 1, 0.68, 1),
  inCubic: cubicBezier(0.32, 0, 0.67, 0),
  inOutCubic: cubicBezier(0.65, 0, 0.35, 1),
  outExpo: cubicBezier(0.16, 1, 0.3, 1),
  inExpo: cubicBezier(0.7, 0, 0.84, 0),
  inOutExpo: cubicBezier(0.87, 0, 0.13, 1),
  outBack: cubicBezier(0.34, 1.56, 0.64, 1),
  inBack: cubicBezier(0.36, 0, 0.66, -0.56),
  outQuint: cubicBezier(0.22, 1, 0.36, 1),
  snap: cubicBezier(0.2, 0.9, 0.1, 1),
  motor: cubicBezier(0.55, 0, 0.15, 1),
};

export interface SpringConfig {
  mass?: number;
  stiffness?: number;
  damping?: number;
}

/**
 * Closed-form damped harmonic oscillator, evaluated at an exact frame
 * (deterministic: identical output in realtime playback and offline render).
 */
export function spring(frame: number, cfg: SpringConfig = {}, from = 0, to = 1): number {
  if (frame <= 0) return from;
  const m = cfg.mass ?? 1;
  const k = cfg.stiffness ?? 100;
  const c = cfg.damping ?? 10;
  const t = frame / FPS;
  const w0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
  let x: number;
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    x = 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  } else {
    x = 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  }
  return from + (to - from) * x;
}

/** First frame at which a spring reaches/overshoots its target — used to sync impact SFX. */
export function springImpactFrame(cfg: SpringConfig, maxFrames = 120): number {
  for (let f = 1; f < maxFrames; f++) if (spring(f, cfg) >= 1) return f;
  return maxFrames;
}

/** Piecewise interpolation with clamping and optional easing per segment. */
export function interpolate(
  x: number,
  input: number[],
  output: number[],
  ease: EaseFn = Ease.linear,
): number {
  if (x <= input[0]) return output[0];
  const n = input.length - 1;
  if (x >= input[n]) return output[n];
  let i = 0;
  while (i < n - 1 && x > input[i + 1]) i++;
  const t = (x - input[i]) / (input[i + 1] - input[i]);
  return lerp(output[i], output[i + 1], ease(t));
}

/** Eased 0..1 progress for a window starting at `start` lasting `len` frames. */
export const prog = (f: number, start: number, len: number, ease: EaseFn = Ease.outCubic) =>
  ease(clamp((f - start) / len));

/** Scene envelope: `i` = entrance progress, `o` = exit progress. */
export function sceneIO(f: number, dur: number, inLen = 20, outLen = 16) {
  return {
    i: Ease.outExpo(clamp(f / inLen)),
    o: Ease.inCubic(clamp((f - (dur - outLen)) / outLen)),
  };
}

/** Numerical velocity (units/frame) of any frame→value function — drives kinetic blur. */
export const velocity = (fn: (f: number) => number, f: number) => fn(f + 0.5) - fn(f - 0.5);

/** Maps a velocity to one of the pre-built SVG directional blur filters. */
export function motionBlur(v: number, axis: 'x' | 'y' = 'x', gain = 0.45): string {
  const q = Math.min(16, Math.round(Math.abs(v) * gain));
  return q <= 0 ? 'none' : `url(#mb${axis}-${q})`;
}

/** Indonesian thousands separator: 600000000 -> "600.000.000" */
export const fmtID = (n: number) =>
  String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
