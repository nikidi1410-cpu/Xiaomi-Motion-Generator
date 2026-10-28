import { C, FONT_MONO, rgba } from '../assets/palette';
import type { Cue } from '../engine/audio';
import { clamp, Ease, motionBlur, velocity } from '../engine/easing';
import { SAFE_RECT } from '../engine/timing';
import type { SceneModule, SceneProps } from './common';

/* S1 · 0.0–2.5s · Kinetic typography with directional motion blur */

interface Line {
  words: string[];
  at: number;
  size: number;
  weight: number;
  color: string;
  mono?: boolean;
  gapAfter: number;
}

const LINES: Line[] = [
  { words: ['SEJAK', '2010,'], at: 4, size: 34, weight: 700, color: C.orange, mono: true, gapAfter: 26 },
  { words: ['satu', 'keyakinan'], at: 12, size: 96, weight: 700, color: C.white, gapAfter: 0 },
  { words: ['yang', 'sama:'], at: 22, size: 96, weight: 700, color: C.muted, gapAfter: 34 },
  { words: ['Inovasi', 'untuk'], at: 38, size: 112, weight: 800, color: C.white, gapAfter: 0 },
  { words: ['Semua', 'Orang.'], at: 50, size: 112, weight: 800, color: C.orange, gapAfter: 0 },
];
const WORD_LEN = 30;
const STAGGER = 5;
const EXIT = 122;

const wordX = (lf: number) => (1 - Ease.outExpo(clamp(lf / WORD_LEN))) * 320;
const exitY = (f: number) => -170 * Ease.inExpo(clamp((f - EXIT) / 28));

function Component({ f }: SceneProps) {
  const ey = exitY(f);
  const eOp = 1 - Ease.inCubic(clamp((f - EXIT - 6) / 22));
  const exitBlur = motionBlur(velocity(exitY, f), 'y', 0.35);
  const pulse = 0.5 + 0.5 * Math.sin(f / 9);
  const under = Ease.outExpo(clamp((f - 78) / 26));
  const bigOp = clamp((f - 2) / 30) * 0.07 * eOp;

  return (
    <div className="abs" style={{ inset: 0 }}>
      {/* giant outlined year, parallax depth */}
      <div
        className="abs mono"
        data-audit-ignore
        style={{
          left: 0,
          width: 1080,
          top: 1150,
          textAlign: 'center',
          fontFamily: FONT_MONO,
          fontWeight: 800,
          fontSize: 400,
          lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: `3px ${C.white}`,
          opacity: bigOp,
          transform: `translateY(${-f * 0.6}px) scale(${1 + f * 0.0012})`,
        }}
      >
        2010
      </div>

      <div
        className="abs"
        style={{
          left: SAFE_RECT.x0,
          top: 640,
          transform: `translate3d(0, ${ey}px, 0)`,
          opacity: eOp,
          filter: exitBlur,
        }}
      >
        {LINES.map((ln, li) => (
          <div
            key={li}
            style={{
              position: 'relative',
              display: 'block',
              marginBottom: ln.gapAfter,
              fontFamily: ln.mono ? FONT_MONO : undefined,
              fontSize: ln.size,
              fontWeight: ln.weight,
              letterSpacing: ln.mono ? '0.3em' : '-0.025em',
              lineHeight: ln.mono ? 1.2 : 1.04,
              color: ln.color,
              whiteSpace: 'nowrap',
              textShadow: li === 4 ? `0 0 ${40 + pulse * 30}px ${rgba(C.orange, 0.45)}` : undefined,
            }}
          >
            {ln.words.map((w, wi) => {
              const lf = f - ln.at - wi * STAGGER;
              const x = wordX(lf);
              const v = velocity(wordX, lf);
              const op = clamp(lf / 7);
              const sc = li >= 3 ? 1 + 0.12 * (1 - Ease.outExpo(clamp(lf / 26))) : 1;
              return (
                <span
                  key={wi}
                  style={{
                    display: 'inline-block',
                    marginRight: wi < ln.words.length - 1 ? '0.26em' : 0,
                    opacity: op,
                    transform: `translate3d(${x}px,0,0) scale(${sc})`,
                    transformOrigin: 'left bottom',
                    filter: lf < WORD_LEN ? motionBlur(v, 'x', 0.5) : 'none',
                  }}
                >
                  {w}
                </span>
              );
            })}
            {li === 4 && (
              <span
                className="abs"
                style={{
                  left: 0,
                  bottom: -40,
                  height: 12,
                  width: '100%',
                  borderRadius: 6,
                  background: `linear-gradient(90deg, ${C.orange}, ${C.cyan})`,
                  transformOrigin: 'left',
                  transform: `scaleX(${under})`,
                  boxShadow: `0 0 24px ${rgba(C.orange, 0.7)}`,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const cues: Cue[] = [
  { frame: 0, type: 'whoosh', dur: 0.55, gain: 0.7 },
  ...LINES.flatMap((ln, li) =>
    ln.words.map((_, wi) => ({ frame: ln.at + wi * STAGGER + 2, type: 'tick' as const, pitch: 0.8 + li * 0.12, gain: 0.7 })),
  ),
  { frame: 52, type: 'pop', pitch: 1.1, gain: 0.8 },
  { frame: 78, type: 'chime', pitch: 1, gain: 0.55, dur: 1 },
  { frame: 98, type: 'riser', dur: 0.85, gain: 0.8 },
];

export const Scene01: SceneModule = { Component, cues, hold: [88, 120] };
