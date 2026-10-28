import { C, FONT_MONO, rgba } from '../assets/palette';
import { SQUIRCLE_100, XiaomiLogo } from '../assets/svg';
import type { Cue } from '../engine/audio';
import { clamp, Ease, motionBlur, spring, springImpactFrame, velocity } from '../engine/easing';
import type { SceneModule, SceneProps } from './common';

/* S10 · 28.0–30.0s · Grand finale lockup with micro dolly-zoom (vertigo) */

const CX = 540;
const CY = 820;
const LOGO = 250;
const LOGO_SPRING = { stiffness: 160, damping: 12 };
const L_DELAY = 2;
const IMPACT = L_DELAY + springImpactFrame(LOGO_SPRING);
const WORD = 'Xiaomi';
const W_AT = 12;
const FADE = 100;

function Component({ f, dur }: SceneProps) {
  const dz = Ease.inOutCubic(clamp(f / dur));
  // Dolly-zoom: background pushes in while the subject counter-scales,
  // keeping the lockup almost the same size as perspective "stretches".
  const bgScale = 1 + dz * 0.6;
  const fgScale = 1.05 - dz * 0.07;
  const ls = spring(f - L_DELAY, LOGO_SPRING);
  const tagOp = Ease.outCubic(clamp((f - 34) / 18));
  const subOp = Ease.outCubic(clamp((f - 44) / 18));
  const end = Ease.inOutCubic(clamp((f - FADE) / (dur - FADE - 1)));
  const flashIn = 1 - clamp(f / 12);

  return (
    <div className="abs" style={{ inset: 0 }}>
      {/* background tunnel */}
      <div className="abs" data-audit-ignore style={{ inset: 0, transformOrigin: `${CX}px ${CY}px`, transform: `scale(${bgScale})`, opacity: 1 - end }}>
        <svg className="abs" width="1080" height="1920" style={{ left: 0, top: 0 }}>
          {Array.from({ length: 28 }, (_, i) => {
            const a = (i / 28) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={CX + Math.cos(a) * 220}
                y1={CY + Math.sin(a) * 220}
                x2={CX + Math.cos(a) * 1500}
                y2={CY + Math.sin(a) * 1500}
                stroke={i % 2 ? rgba(C.cyan, 0.12) : rgba(C.orange, 0.14)}
                strokeWidth="2"
              />
            );
          })}
          {Array.from({ length: 6 }, (_, k) => {
            const t = ((f / 80 + k / 6) % 1);
            const s = 0.6 + t * 6;
            return (
              <path
                key={k}
                d={SQUIRCLE_100}
                fill="none"
                stroke={k % 2 ? C.cyan : C.orange}
                strokeWidth={1.6 / s}
                opacity={Math.sin(Math.PI * t) * 0.45}
                transform={`translate(${CX - 50 * s * 1.6} ${CY - 50 * s * 1.6}) scale(${s * 1.6})`}
              />
            );
          })}
        </svg>
      </div>
      <div
        className="abs"
        data-audit-ignore
        style={{ left: CX - 600, top: CY - 600, width: 1200, height: 1200, background: `radial-gradient(circle, ${rgba(C.orange, 0.5)}, transparent 60%)`, opacity: clamp(ls) * (1 - end) }}
      />

      {/* foreground lockup */}
      <div className="abs" style={{ inset: 0, transformOrigin: `${CX}px ${CY + 160}px`, transform: `scale(${fgScale})`, opacity: 1 - end }}>
        <div
          className="abs"
          style={{ left: CX - LOGO / 2, top: CY - LOGO / 2, width: LOGO, height: LOGO, transform: `scale(${Math.max(0, ls)})`, filter: `drop-shadow(0 24px 50px ${rgba(C.orange, 0.5)})` }}
        >
          <XiaomiLogo size={LOGO} reveal={clamp((f - IMPACT) / 20)} />
        </div>
        <div
          className="abs"
          style={{ left: 0, width: 1080, top: 990, display: 'flex', justifyContent: 'center', fontSize: 150, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1 }}
        >
          {WORD.split('').map((ch, i) => {
            const lf = f - W_AT - i * 3;
            const yFn = (x: number) => (1 - Ease.outExpo(clamp(x / 22))) * 120;
            return (
              <span
                key={i}
                style={{ display: 'inline-block', opacity: clamp(lf / 8), transform: `translateY(${yFn(lf)}px)`, filter: motionBlur(velocity(yFn, lf), 'y', 0.5) }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div
          className="abs"
          style={{ left: 0, width: 1080, top: 1176, textAlign: 'center', fontSize: 50, fontWeight: 700, letterSpacing: '-0.01em', opacity: tagOp, transform: `translateY(${(1 - tagOp) * 24}px)` }}
        >
          Human <span style={{ color: C.orange }}>×</span> Car <span style={{ color: C.orange }}>×</span> Home
        </div>
        <div
          className="abs mono"
          style={{ left: 0, width: 1080, top: 1262, textAlign: 'center', fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700, letterSpacing: '0.3em', color: C.orange, opacity: subOp }}
        >
          INOVASI UNTUK SEMUA ORANG
        </div>
      </div>
      <div className="abs" data-audit-ignore style={{ inset: 0, background: '#fff', opacity: flashIn * 0.45 }} />
      <div className="abs" data-audit-ignore style={{ inset: 0, background: C.obsidian, opacity: end }} />
    </div>
  );
}

const cues: Cue[] = [
  { frame: 0, type: 'sub', dur: 1.6, gain: 0.8 },
  { frame: 2, type: 'chord', dur: 1.9, gain: 1 },
  { frame: IMPACT, type: 'impact', gain: 0.9 },
  { frame: IMPACT + 1, type: 'chime', pitch: 1, gain: 0.8, dur: 1.6 },
  ...WORD.split('').map((_, i) => ({ frame: W_AT + i * 3 + 2, type: 'tick' as const, pitch: 1 + i * 0.1, gain: 0.5 })),
  { frame: 36, type: 'chime', pitch: 2, gain: 0.5, dur: 1.4 },
];

export const Scene10: SceneModule = { Component, cues };
