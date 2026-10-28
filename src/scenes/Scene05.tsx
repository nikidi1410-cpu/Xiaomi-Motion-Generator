import type { ReactNode } from 'react';
import { C, FONT_MONO, rgba } from '../assets/palette';
import { HyperOSIcon, PhoneIcon, SmartHomeIcon, SU7, WearableIcon } from '../assets/svg';
import type { Cue } from '../engine/audio';
import { clamp, Ease, spring } from '../engine/easing';
import { SAFE_RECT } from '../engine/timing';
import { CONTENT_W, Eyebrow, type SceneModule, type SceneProps } from './common';

/* S5 · 14.5–18.0s · HyperOS orbital diagram (SU7 · Smartphone · Smart Living · Wearable) */

const CX = 540;
const CY = 1010;
const R = 330;
const CORE = 130;
const SAT = 92;
const EXIT = 184;
const POP_SPRING = { stiffness: 230, damping: 12 };

interface Sat {
  label: string;
  ang: number;
  at: number;
  color: string;
  icon: (f: number) => ReactNode;
}
const SATS: Sat[] = [
  { label: 'Smartphone', ang: -90, at: 40, color: C.orange, icon: () => <PhoneIcon size={110} /> },
  { label: 'Wearable', ang: 0, at: 54, color: C.cyan, icon: (f) => <WearableIcon size={110} beat={Math.max(0, Math.sin(f / 4))} /> },
  { label: 'Xiaomi SU7', ang: 90, at: 68, color: C.cyan, icon: (f) => <SU7 width={160} wheelAngle={f * 6} glowAmt={0.5} /> },
  { label: 'Smart Living', ang: 180, at: 82, color: C.orange, icon: (f) => <SmartHomeIcon size={104} signal={clamp((f % 50) / 30)} /> },
];

function Component({ f }: SceneProps) {
  const hOp = Ease.outCubic(clamp((f - 2) / 18));
  const rot = -7 + 14 * Ease.inOutCubic(clamp(f / 200));
  const ring = Ease.outCubic(clamp((f - 10) / 42));
  const core = spring(f - 4, { stiffness: 160, damping: 12 });
  const ex = Ease.inCubic(clamp((f - EXIT) / 26));
  const circ = 2 * Math.PI * R;

  return (
    <div className="abs" style={{ inset: 0 }}>
      <div style={{ opacity: 1 - ex }}>
        <Eyebrow y={318} op={hOp}>
          HYPEROS · SATU SISTEM
        </Eyebrow>
        <div
          className="abs"
          style={{
            left: SAFE_RECT.x0,
            top: 366,
            width: CONTENT_W,
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            opacity: hOp,
            transform: `translateY(${(1 - hOp) * 30}px)`,
          }}
        >
          Satu OS.
          <br />
          <span style={{ color: C.cyan }}>Semua terhubung.</span>
        </div>
      </div>

      <div
        className="abs"
        style={{
          inset: 0,
          transformOrigin: `${CX}px ${CY + R}px`,
          transform: `scale(${1 + ex * 1.8})`,
          opacity: 1 - ex,
        }}
      >
        {/* orbit rings */}
        <svg className="abs" data-audit-ignore width="1080" height="1920" style={{ left: 0, top: 0 }}>
          <defs>
            <linearGradient id="orbitG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={C.orange} />
              <stop offset="1" stopColor={C.cyan} />
            </linearGradient>
          </defs>
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="url(#orbitG)"
            strokeOpacity="0.55"
            strokeWidth="3"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - ring)}
            transform={`rotate(${-90 + rot} ${CX} ${CY})`}
          />
          <circle
            cx={CX}
            cy={CY}
            r={R - 120}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2"
            strokeDasharray="4 14"
            transform={`rotate(${f * 0.6} ${CX} ${CY})`}
            opacity={ring}
          />
          <circle cx={CX} cy={CY} r={R + 70} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" opacity={ring} />
          {/* connections + data pulses */}
          {SATS.map((s, i) => {
            const lf = f - s.at;
            if (lf < 0) return null;
            const a = ((s.ang + rot) * Math.PI) / 180;
            const draw = Ease.outCubic(clamp(lf / 14));
            const x0 = CX + Math.cos(a) * CORE;
            const y0 = CY + Math.sin(a) * CORE;
            const x1 = CX + Math.cos(a) * (CORE + (R - SAT - CORE) * draw);
            const y1 = CY + Math.sin(a) * (CORE + (R - SAT - CORE) * draw);
            return (
              <g key={i}>
                <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={s.color} strokeOpacity="0.5" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
                {draw >= 1 &&
                  [0, 0.5].map((k) => {
                    const ph = ((lf - 14) / 34 + k + i * 0.13) % 1;
                    const dir = k === 0 ? ph : 1 - ph;
                    const d = CORE + (R - SAT - CORE) * dir;
                    return (
                      <circle
                        key={k}
                        cx={CX + Math.cos(a) * d}
                        cy={CY + Math.sin(a) * d}
                        r="7"
                        fill={k === 0 ? C.cyan : C.orange}
                        opacity={Math.sin(Math.PI * ph)}
                        style={{ filter: `drop-shadow(0 0 8px ${k === 0 ? C.cyan : C.orange})` }}
                      />
                    );
                  })}
              </g>
            );
          })}
        </svg>

        {/* core pulses */}
        {[0, 1].map((k) => {
          const t = ((f + k * 30) % 60) / 60;
          return (
            <div
              key={k}
              className="abs"
              data-audit-ignore
              style={{
                left: CX - CORE,
                top: CY - CORE,
                width: CORE * 2,
                height: CORE * 2,
                borderRadius: '50%',
                border: `2px solid ${C.cyan}`,
                opacity: (1 - t) * 0.5 * clamp(core),
                transform: `scale(${1 + t * 1.3})`,
              }}
            />
          );
        })}
        {/* core */}
        <div
          className="abs"
          style={{
            left: CX - CORE,
            top: CY - CORE,
            width: CORE * 2,
            height: CORE * 2,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, #262C3A, ${C.obsidian} 70%)`,
            border: `2px solid ${rgba(C.cyan, 0.6)}`,
            boxShadow: `0 0 80px ${rgba(C.cyan, 0.35)}, inset 0 0 40px ${rgba(C.orange, 0.15)}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transform: `scale(${Math.max(0, core)})`,
          }}
        >
          <HyperOSIcon size={112} spin={f * 2.2} />
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.01em' }}>HyperOS</div>
        </div>

        {/* satellites */}
        {SATS.map((s, i) => {
          const lf = f - s.at;
          const sc = spring(lf, POP_SPRING);
          if (lf < 0) return null;
          const a = ((s.ang + rot) * Math.PI) / 180;
          const x = CX + Math.cos(a) * R;
          const y = CY + Math.sin(a) * R;
          return (
            // non-car satellites fade first so focus pulls onto the SU7 during the push-in
            <div key={i} className="abs" style={{ left: x, top: y, opacity: s.ang === 90 ? 1 : 1 - clamp(ex * 4) }}>
              <div
                className="abs"
                style={{
                  left: -SAT,
                  top: -SAT,
                  width: SAT * 2,
                  height: SAT * 2,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 40% 30%, #222838, ${C.panel})`,
                  border: `2.5px solid ${s.color}`,
                  boxShadow: `0 0 50px ${rgba(s.color, 0.4)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${Math.max(0, sc)})`,
                }}
              >
                {s.icon(f)}
              </div>
              <div
                className="abs"
                style={{
                  left: -150,
                  width: 300,
                  top: SAT + 16,
                  textAlign: 'center',
                  fontFamily: FONT_MONO,
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: C.white,
                  // labels clear out before the camera push-in
                  opacity: clamp((lf - 6) / 10) * (1 - clamp(ex * 6)),
                  transform: `translateY(${(1 - clamp((lf - 6) / 10)) * 16}px)`,
                }}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const NOTES = [1, 1.125, 1.25, 1.5];
const cues: Cue[] = [
  { frame: 4, type: 'pop', pitch: 0.8, gain: 0.8 },
  { frame: 6, type: 'chime', pitch: 0.75, gain: 0.5, dur: 1.2 },
  ...SATS.flatMap((s, i) => [
    { frame: s.at + 2, type: 'pop' as const, pitch: 1 + i * 0.15, gain: 0.6 },
    { frame: s.at + 3, type: 'chime' as const, pitch: NOTES[i], gain: 0.6, dur: 1.1, pan: [-0.1, 0.5, 0.1, -0.5][i] },
  ]),
];

export const Scene05: SceneModule = { Component, cues, hold: [100, 184] };
