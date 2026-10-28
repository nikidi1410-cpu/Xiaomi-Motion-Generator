import type { CSSProperties, ReactNode } from 'react';
import { C, FONT_MONO, rgba } from '../assets/palette';
import type { Cue } from '../engine/audio';
import { clamp, Ease } from '../engine/easing';
import { rng } from '../engine/random';
import { SAFE_RECT } from '../engine/timing';

export interface SceneProps {
  /** local frame (0 = first frame of this scene) */
  f: number;
  dur: number;
}

export interface SceneModule {
  Component: (p: SceneProps) => ReactNode;
  /** SFX cues in local frames */
  cues: Cue[];
  /** local [from, to) window where the layout is settled — audited strictly against SAFE */
  hold?: [number, number];
}

export const CONTENT_W = SAFE_RECT.x1 - SAFE_RECT.x0;

/** Small orange monospace kicker label with a leading dot. */
export function Eyebrow({ children, y, op = 1, center = false, style }: { children: ReactNode; y: number; op?: number; center?: boolean; style?: CSSProperties }) {
  return (
    <div
      className="abs"
      style={{
        top: y,
        left: SAFE_RECT.x0,
        width: CONTENT_W,
        display: 'flex',
        justifyContent: center ? 'center' : 'flex-start',
        alignItems: 'center',
        gap: 14,
        opacity: op,
        transform: `translateY(${(1 - op) * 18}px)`,
        ...style,
      }}
    >
      <span style={{ width: 12, height: 12, borderRadius: 4, background: C.orange, boxShadow: `0 0 18px ${rgba(C.orange, 0.8)}` }} />
      <span style={{ fontFamily: FONT_MONO, fontSize: 26, fontWeight: 700, letterSpacing: '0.24em', color: C.orange }}>{children}</span>
    </div>
  );
}

/**
 * Tick cues that follow an eased counter: a tick each time progress advances
 * by `step`, never closer than `minGap` frames — so the clicks slow down
 * exactly as the numbers do.
 */
export function counterTicks(start: number, len: number, ease: (t: number) => number, step = 1 / 28, minGap = 3, pitchFrom = 0.85, pitchTo = 1.45): Cue[] {
  const out: Cue[] = [];
  let lastP = -1;
  let lastF = -99;
  for (let f = start; f <= start + len; f++) {
    const p = ease(clamp((f - start) / len));
    if (p - lastP >= step && f - lastF >= minGap) {
      out.push({ frame: f, type: 'tick', pitch: pitchFrom + (pitchTo - pitchFrom) * p, gain: 0.8 });
      lastP = p;
      lastF = f;
    }
  }
  return out;
}

export interface Particle {
  a: number;
  v: number;
  s: number;
  c: string;
  r0: number;
  spin: number;
}
export function makeBurst(seed: number, n: number): Particle[] {
  const r = rng(seed);
  const colors = [C.orange, C.cyan, '#fff', C.orange];
  return Array.from({ length: n }, () => ({
    a: r() * Math.PI * 2,
    v: 9 + r() * 16,
    s: 6 + r() * 12,
    c: colors[Math.floor(r() * colors.length)],
    r0: r() * 360,
    spin: (r() - 0.5) * 18,
  }));
}

/** Radial particle explosion, deterministic per frame. */
export function Burst({ parts, t, cx, cy }: { parts: Particle[]; t: number; cx: number; cy: number }) {
  if (t < 0 || t > 60) return null;
  return (
    <div className="abs" style={{ left: 0, top: 0 }} data-audit-ignore>
      {parts.map((p, i) => {
        const d = p.v * 16 * (1 - Math.exp(-t / 16));
        const op = clamp(1 - t / 55) * clamp(t / 2);
        return (
          <div
            key={i}
            className="abs"
            style={{
              left: cx,
              top: cy,
              width: p.s,
              height: p.s,
              borderRadius: i % 3 === 0 ? 999 : 3,
              background: p.c,
              opacity: op,
              boxShadow: `0 0 12px ${p.c}`,
              transform: `translate3d(${Math.cos(p.a) * d * 1.25}px, ${Math.sin(p.a) * d}px, 0) rotate(${p.r0 + p.spin * t}deg) scale(${1 - Ease.inCubic(clamp(t / 60)) * 0.6})`,
            }}
          />
        );
      })}
    </div>
  );
}
