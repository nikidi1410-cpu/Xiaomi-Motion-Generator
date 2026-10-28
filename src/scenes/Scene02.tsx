import { C, FONT_MONO, rgba } from '../assets/palette';
import { SQUIRCLE_100, XiaomiLogo } from '../assets/svg';
import type { Cue } from '../engine/audio';
import { clamp, Ease, motionBlur, spring, springImpactFrame, velocity } from '../engine/easing';
import type { SceneModule, SceneProps } from './common';

/* S2 · 2.5–5.0s · Elastic squircle logo bounce + "Human × Car × Home" */

const LOGO_SPRING = { stiffness: 170, damping: 10.5, mass: 1 };
const DELAY = 4;
const IMPACT = DELAY + springImpactFrame(LOGO_SPRING);
const WORD_SPRING = { stiffness: 240, damping: 15 };
const TAG = ['Human', '×', 'Car', '×', 'Home'];
const TAG_AT = IMPACT + 30;
const SUB_AT = IMPACT + 66;
const EXIT = 124;
const LOGO = 380;
const CX = 540;
const CY = 800;

const exitZoom = (f: number) => 1 + Ease.inExpo(clamp((f - EXIT) / 26)) * 7;

function Component({ f }: SceneProps) {
  const s = spring(f - DELAY, LOGO_SPRING);
  const rot = (1 - s) * -38;
  const reveal = clamp((f - IMPACT - 2) / 28);
  const z = exitZoom(f);
  const zOp = 1 - Ease.inCubic(clamp((f - EXIT - 8) / 18));
  const textOut = Ease.inCubic(clamp((f - EXIT) / 16));
  const glow = clamp(s) * (0.75 + 0.25 * Math.sin(f / 8));
  const subOp = clamp((f - SUB_AT) / 18);

  return (
    <div className="abs" style={{ inset: 0 }}>
      {/* ambient glow */}
      <div
        className="abs"
        data-audit-ignore
        style={{
          left: CX - 520,
          top: CY - 520,
          width: 1040,
          height: 1040,
          background: `radial-gradient(circle, ${rgba(C.orange, 0.55)} 0%, ${rgba(C.orange, 0.15)} 35%, transparent 65%)`,
          opacity: glow * zOp,
          transform: `scale(${0.6 + 0.4 * clamp(s) + (z - 1) * 0.3})`,
        }}
      />
      {/* impact ripples */}
      {[0, 1, 2].map((k) => {
        const rf = f - IMPACT - k * 9;
        if (rf < 0 || rf > 60) return null;
        const sc = 1 + Ease.outExpo(clamp(rf / 55)) * (1.4 + k * 0.35);
        return (
          <svg
            key={k}
            className="abs"
            data-audit-ignore
            width={LOGO}
            height={LOGO}
            viewBox="0 0 100 100"
            style={{ left: CX - LOGO / 2, top: CY - LOGO / 2, transform: `scale(${sc})`, opacity: (1 - rf / 60) * 0.7, overflow: 'visible' }}
          >
            <path d={SQUIRCLE_100} fill="none" stroke={k === 1 ? C.cyan : C.orange} strokeWidth={1.2 / sc} />
          </svg>
        );
      })}
      {/* logo */}
      <div
        className="abs"
        style={{
          left: CX - LOGO / 2,
          top: CY - LOGO / 2,
          width: LOGO,
          height: LOGO,
          transform: `scale(${Math.max(0, s) * z}) rotate(${rot}deg)`,
          opacity: zOp,
          // drop the shadow during the zoom-through: blurring a 3000px layer would cost frames
          filter: z > 1.02 ? 'none' : `drop-shadow(0 30px 60px ${rgba(C.orange, 0.45)})`,
        }}
      >
        <XiaomiLogo size={LOGO} reveal={reveal} />
      </div>

      {/* tagline */}
      <div
        className="abs"
        style={{
          left: 0,
          width: 1080,
          top: 1110,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: 22,
          fontSize: 80,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          opacity: 1 - textOut,
          transform: `translateY(${textOut * 60}px)`,
        }}
      >
        {TAG.map((w, i) => {
          const lf = f - TAG_AT - i * 6;
          const ws = spring(lf, WORD_SPRING);
          const yFn = (x: number) => (1 - spring(x, WORD_SPRING)) * 90;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                color: w === '×' ? C.orange : C.white,
                fontWeight: w === '×' ? 600 : 800,
                opacity: clamp(lf / 6),
                transform: `translateY(${yFn(lf)}px) scale(${0.6 + 0.4 * Math.min(1.2, ws)})`,
                filter: motionBlur(velocity(yFn, lf), 'y', 0.6),
                textShadow: w === '×' ? `0 0 30px ${rgba(C.orange, 0.8)}` : undefined,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      <div
        className="abs"
        style={{
          left: 0,
          width: 1080,
          top: 1238,
          textAlign: 'center',
          fontFamily: FONT_MONO,
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: '0.32em',
          color: C.muted,
          opacity: subOp * (1 - textOut),
          transform: `translateY(${(1 - subOp) * 20}px)`,
        }}
      >
        INOVASI UNTUK SEMUA ORANG
      </div>
    </div>
  );
}

const cues: Cue[] = [
  { frame: IMPACT, type: 'impact', gain: 1 },
  { frame: IMPACT, type: 'sub', dur: 1.2, gain: 0.7 },
  { frame: IMPACT + 2, type: 'chime', pitch: 1, dur: 1.6, gain: 0.8 },
  ...TAG.map((w, i) => ({ frame: TAG_AT + i * 6 + 3, type: 'pop' as const, pitch: w === '×' ? 1.5 : 1 + i * 0.08, gain: w === '×' ? 0.4 : 0.7 })),
  { frame: SUB_AT, type: 'tick', pitch: 1.2 },
];

export const Scene02: SceneModule = { Component, cues, hold: [100, 124] };
