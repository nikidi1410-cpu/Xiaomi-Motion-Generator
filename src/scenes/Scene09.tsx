import { C, FONT_MONO, rgba } from '../assets/palette';
import { ArrowRight, Cursor } from '../assets/svg';
import type { Cue } from '../engine/audio';
import { clamp, Ease, spring } from '../engine/easing';
import { SAFE_RECT } from '../engine/timing';
import { CONTENT_W, Eyebrow, type SceneModule, type SceneProps } from './common';

/* S9 · 26.5–28.0s · Interactive CTA button with pulse ripples + neon glow */

const BW = 860;
const BH = 210;
const BX = 540 - BW / 2;
const BY = 860;
const ARROW_CX = BX + BW - 44 - 62;
const ARROW_CY = BY + BH / 2;
const TAP = 50;
const EXIT = 76;

function Component({ f }: SceneProps) {
  const hOp = Ease.outCubic(clamp((f - 2) / 14));
  const pop = spring(f - 4, { stiffness: 210, damping: 16 });
  const press = f >= TAP ? 0.94 + 0.06 * spring(f - TAP - 5, { stiffness: 420, damping: 15 }) : 1;
  const ex = Ease.inCubic(clamp((f - EXIT) / 14));
  const shine = clamp((f - 18) / 24);
  const nudge = f >= TAP ? Math.sin(clamp((f - TAP) / 14) * Math.PI) * 18 : Math.max(0, Math.sin(f / 5)) * 6;
  const glow = 0.6 + 0.4 * Math.sin(f / 6);
  const curT = Ease.inOutCubic(clamp((f - 24) / 22));
  const cx = 930 + (ARROW_CX + 8 - 930) * curT;
  const cy = 1420 + (ARROW_CY + 10 - 1420) * curT;
  const curOp = clamp((f - 24) / 6) * (1 - clamp((f - 64) / 10));

  return (
    <div className="abs" style={{ inset: 0 }}>
      <div style={{ opacity: 1 - ex }}>
        <Eyebrow y={600} op={hOp} center>
          SATU EKOSISTEM
        </Eyebrow>
        <div
          className="abs"
          style={{ left: SAFE_RECT.x0, width: CONTENT_W, top: 650, textAlign: 'center', fontSize: 84, fontWeight: 800, letterSpacing: '-0.035em', opacity: hOp, transform: `translateY(${(1 - hOp) * 40}px)` }}
        >
          Siap terhubung?
        </div>
      </div>

      {/* pulse ripples */}
      {[0, 1, 2, 3].map((k) => {
        const lf = f - 12 - k * 16;
        if (lf < 0 || lf > 44) return null;
        const t = lf / 44;
        return (
          <div
            key={k}
            className="abs"
            data-audit-ignore
            style={{
              left: BX,
              top: BY,
              width: BW,
              height: BH,
              borderRadius: BH / 2,
              border: `3px solid ${k % 2 ? C.cyan : C.orange}`,
              boxShadow: `0 0 30px ${rgba(k % 2 ? C.cyan : C.orange, 0.5)}`,
              transform: `scale(${1 + Ease.outCubic(t) * 0.1}, ${1 + Ease.outCubic(t) * 0.42})`,
              opacity: (1 - t) * 0.8 * (1 - ex),
            }}
          />
        );
      })}
      {/* neon glow */}
      <div
        className="abs"
        data-audit-ignore
        style={{
          left: BX - 120,
          top: BY - 120,
          width: BW + 240,
          height: BH + 240,
          borderRadius: 999,
          background: `radial-gradient(ellipse at center, ${rgba(C.orange, 0.55)}, transparent 65%)`,
          opacity: glow * clamp(pop) + ex,
          transform: `scale(${1 + ex * 0.6})`,
        }}
      />
      {/* button */}
      <div
        className="abs"
        style={{
          left: BX,
          top: BY,
          width: BW,
          height: BH,
          borderRadius: BH / 2,
          background: `linear-gradient(100deg, #FF8126, ${C.orange} 45%, #F25F00)`,
          boxShadow: `0 0 0 2px ${rgba('#FFFFFF', 0.25)} inset, 0 0 60px ${rgba(C.orange, 0.7)}, 0 0 140px ${rgba(C.orange, 0.35)}, 0 0 90px ${rgba(C.cyan, 0.18)}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 44px 0 70px',
          overflow: 'hidden',
          transform: `scale(${Math.max(0, pop) * press * (1 + ex * 0.08)})`,
          opacity: 1 - ex * 0.3,
        }}
      >
        <div
          className="abs"
          data-audit-ignore
          style={{ left: -200 + shine * (BW + 400), top: -40, width: 120, height: BH + 80, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)', transform: 'skewX(-20deg)', opacity: shine < 1 ? 1 : 0 }}
        />
        <div style={{ flex: 1, color: C.obsidian, lineHeight: 1.08 }}>
          <div style={{ fontSize: 44, fontWeight: 700 }}>Jelajahi Ekosistem</div>
          <div style={{ fontSize: 58, fontWeight: 800, letterSpacing: '-0.025em' }}>Xiaomi HyperOS</div>
        </div>
        <div
          style={{
            width: 124,
            height: 124,
            borderRadius: 62,
            background: C.obsidian,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 30px ${rgba(C.cyan, 0.4)}`,
          }}
        >
          <div style={{ transform: `translateX(${nudge}px)` }}>
            <ArrowRight size={60} color={C.orange} sw={4} />
          </div>
        </div>
        {f >= TAP && (
          <div
            className="abs"
            data-audit-ignore
            style={{
              left: ARROW_CX - BX - 500,
              top: BH / 2 - 500,
              width: 1000,
              height: 1000,
              borderRadius: '50%',
              background: rgba('#FFFFFF', 0.3),
              transform: `scale(${Ease.outExpo(clamp((f - TAP) / 24))})`,
              opacity: 1 - clamp((f - TAP) / 24),
            }}
          />
        )}
      </div>
      <div
        className="abs mono"
        style={{ left: SAFE_RECT.x0, width: CONTENT_W, top: 1130, textAlign: 'center', fontFamily: FONT_MONO, fontSize: 26, letterSpacing: '0.2em', color: C.muted, opacity: clamp((f - 20) / 12) * (1 - ex) }}
      >
        HUMAN × CAR × HOME
      </div>
      {curOp > 0 && (
        <div className="abs" data-audit-ignore style={{ left: cx - 3, top: cy - 3, opacity: curOp, filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.5))' }}>
          <Cursor size={52} pressed={f >= TAP && f < TAP + 7 ? 1 : 0} />
        </div>
      )}
      {/* white flash into finale */}
      <div className="abs" data-audit-ignore style={{ inset: 0, background: '#fff', opacity: Ease.inExpo(clamp((f - 80) / 10)) * 0.5, pointerEvents: 'none' }} />
    </div>
  );
}

const cues: Cue[] = [
  { frame: 4, type: 'pop', pitch: 1.2, gain: 0.9 },
  { frame: 6, type: 'chime', pitch: 1, gain: 0.45, dur: 0.9 },
  ...[0, 1, 2, 3].map((k) => ({ frame: 12 + k * 16, type: 'whoosh' as const, dur: 0.35, pitch: 1.8, gain: 0.12 })),
  { frame: TAP, type: 'click', gain: 1 },
  { frame: TAP + 2, type: 'chime', pitch: 1.5, gain: 0.7, dur: 1 },
  { frame: 76, type: 'riser', dur: 0.24, gain: 0.6 },
];

export const Scene09: SceneModule = { Component, cues };
