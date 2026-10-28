import { C, FONT_MONO, NUM, rgba } from '../assets/palette';
import { CapIcon } from '../assets/svg';
import type { Cue } from '../engine/audio';
import { clamp, Ease, fmtID, spring } from '../engine/easing';
import { rng } from '../engine/random';
import { SAFE_RECT } from '../engine/timing';
import { Burst, CONTENT_W, counterTicks, Eyebrow, makeBurst, type SceneModule, type SceneProps } from './common';

/* S8 · 24.0–26.5s · Xiaomi Foundation social impact — 150.000+ scholarships */

const TARGET = 150_000;
const C0 = 12;
const CLEN = 88;
const DONE = C0 + CLEN;
const EXIT = 134;
const RX = 540;
const RY = 820;
const RR = 250;
const CHIPS = ['Riset', 'Sains Digital', 'Talenta Muda'];
const CHIP_AT = 58;

const countP = (f: number) => Ease.outExpo(clamp((f - C0) / CLEN));

const RISERS = (() => {
  const r = rng(150);
  return Array.from({ length: 34 }, () => ({ x: 120 + r() * 840, sp: 3 + r() * 5, off: r() * 1400, s: 4 + r() * 8, c: r() > 0.5 ? C.orange : '#fff' }));
})();
const PARTS = makeBurst(808, 40);

function Component({ f }: SceneProps) {
  const hOp = Ease.outCubic(clamp((f - 2) / 18));
  const p = countP(f);
  const done = f >= DONE;
  const val = done ? TARGET : Math.round(p * TARGET);
  const ringIn = spring(f - 2, { stiffness: 150, damping: 14 });
  const circ = 2 * Math.PI * RR;
  const flash = done ? Math.exp(-(f - DONE) / 12) : 0;
  const plus = done ? spring(f - DONE, { stiffness: 260, damping: 11 }) : 0;
  const ex = Ease.inCubic(clamp((f - EXIT) / 16));

  return (
    <div className="abs" style={{ inset: 0, opacity: 1 - ex, transform: `scale(${1 + ex * 0.06})` }}>
      {RISERS.map((q, i) => {
        const y = 1500 - ((f * q.sp + q.off) % 1300);
        const op = clamp((1500 - y) / 200) * clamp((y - 300) / 300) * 0.55;
        return <div key={i} className="abs" data-audit-ignore style={{ left: q.x, top: y, width: q.s, height: q.s, borderRadius: 99, background: q.c, opacity: op * clamp(f / 20) }} />;
      })}

      <Eyebrow y={318} op={hOp} center>
        XIAOMI FOUNDATION
      </Eyebrow>
      <div
        className="abs"
        style={{ left: SAFE_RECT.x0, width: CONTENT_W, top: 366, textAlign: 'center', fontSize: 64, fontWeight: 800, letterSpacing: '-0.03em', opacity: hOp, transform: `translateY(${(1 - hOp) * 30}px)` }}
      >
        Dampak sosial nyata
      </div>

      <div
        className="abs"
        data-audit-ignore
        style={{ left: RX - 450, top: RY - 450, width: 900, height: 900, background: `radial-gradient(circle, ${rgba(C.orange, 0.35)} 0%, transparent 60%)`, opacity: 0.4 + flash * 0.6 }}
      />
      <svg className="abs" width={RR * 2 + 60} height={RR * 2 + 60} style={{ left: RX - RR - 30, top: RY - RR - 30, transform: `scale(${Math.max(0, ringIn)})` }} data-audit-ignore>
        <g transform={`translate(${RR + 30} ${RR + 30}) rotate(-90)`}>
          <circle r={RR} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="20" />
          <circle
            r={RR}
            fill="none"
            stroke={C.orange}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={`${circ * p} ${circ}`}
            style={{ filter: `drop-shadow(0 0 ${12 + flash * 20}px ${rgba(C.orange, 0.8)})` }}
          />
          <circle r={RR - 34} fill="none" stroke={rgba(C.cyan, 0.3)} strokeWidth="2" strokeDasharray="3 12" transform={`rotate(${f * 0.8})`} />
        </g>
      </svg>
      <div className="abs" style={{ left: RX - 40, top: RY - 170, opacity: clamp((f - 6) / 12), transform: `translateY(${Math.sin(f / 10) * 6}px)` }}>
        <CapIcon size={80} color={C.orange} />
      </div>
      <div
        className="abs mono"
        style={{
          left: RX - 240,
          width: 480,
          top: RY - 56,
          textAlign: 'center',
          ...NUM,
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          transform: `scale(${done ? 1 + 0.16 * (1 - spring(f - DONE, { stiffness: 320, damping: 13 })) : 1})`,
          textShadow: `0 0 ${30 + flash * 50}px ${rgba(C.orange, 0.5)}`,
        }}
      >
        {fmtID(val)}
        <span style={{ display: 'inline-block', color: C.orange, transform: `scale(${plus})`, width: plus > 0 ? undefined : 0 }}>+</span>
      </div>
      <div className="abs mono" style={{ left: RX - 200, width: 400, top: RY + 60, textAlign: 'center', fontFamily: FONT_MONO, fontSize: 28, letterSpacing: '0.24em', color: C.muted }}>
        BEASISWA
      </div>
      <Burst parts={PARTS} t={f - DONE} cx={RX} cy={RY} />

      <div
        className="abs"
        style={{
          left: SAFE_RECT.x0,
          width: CONTENT_W,
          top: 1124,
          textAlign: 'center',
          fontSize: 44,
          fontWeight: 700,
          lineHeight: 1.25,
          opacity: Ease.outCubic(clamp((f - 30) / 18)),
          transform: `translateY(${(1 - Ease.outCubic(clamp((f - 30) / 18))) * 30}px)`,
        }}
      >
        untuk talenta riset &amp;
        <br />
        <span style={{ color: C.orange }}>sains digital</span> masa depan
      </div>
      <div className="abs" style={{ left: SAFE_RECT.x0, width: CONTENT_W, top: 1290, display: 'flex', justifyContent: 'center', gap: 16 }}>
        {CHIPS.map((c, i) => {
          const s = spring(f - CHIP_AT - i * 6, { stiffness: 260, damping: 13 });
          return (
            <div
              key={c}
              style={{
                padding: '14px 26px',
                borderRadius: 999,
                border: `1.5px solid ${i === 1 ? C.cyan : 'rgba(255,255,255,0.2)'}`,
                background: i === 1 ? rgba(C.cyan, 0.12) : 'rgba(255,255,255,0.05)',
                fontSize: 28,
                fontWeight: 700,
                color: i === 1 ? C.cyan : C.white,
                transform: `scale(${Math.max(0, s)})`,
              }}
            >
              {c}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const cues: Cue[] = [
  ...counterTicks(C0, CLEN, Ease.outExpo, 1 / 26, 3, 0.9, 1.5),
  { frame: DONE, type: 'impact', gain: 0.7 },
  { frame: DONE, type: 'chime', pitch: 1.125, gain: 0.85, dur: 1.4 },
  ...CHIPS.map((_, i) => ({ frame: CHIP_AT + i * 6 + 2, type: 'pop' as const, pitch: 1.1 + i * 0.12, gain: 0.5 })),
];

export const Scene08: SceneModule = { Component, cues };
