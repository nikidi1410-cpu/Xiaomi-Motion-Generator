import { C, FONT_MONO, NUM, rgba } from '../assets/palette';
import { FactoryIcon, LeafIcon } from '../assets/svg';
import type { Cue } from '../engine/audio';
import { clamp, Ease, fmtID, spring } from '../engine/easing';
import { SAFE_RECT } from '../engine/timing';
import { CONTENT_W, Eyebrow, type SceneModule, type SceneProps } from './common';

/* S7 · 21.0–24.0s · HyperEngine V8s 27.200 RPM + carbon-neutral factory 2040 */

const RPM_MAX = 27_200;
const M0 = 12;
const MLEN = 96;
const MEND = M0 + MLEN;
const CARD = 64;
const BAR0 = 92;
const BAR1 = 146;
const EXIT = 162;
const MX = 540;
const MY = 636;
const GAUGE_R = 262;

const rpmAt = (f: number) => RPM_MAX * Ease.motor(clamp((f - M0) / MLEN));
/* rotor angle = integral of (capped, alias-safe) visual speed */
const ANG = (() => {
  const a = [0];
  for (let f = 1; f <= 200; f++) a.push(a[f - 1] + 17 * (rpmAt(f) / RPM_MAX) + 0.4);
  return a;
})();

const SLOTS = 36;

function Motor({ f }: { f: number }) {
  const rpm = rpmAt(f);
  const k = rpm / RPM_MAX;
  const ang = ANG[Math.max(0, Math.min(200, Math.floor(f)))];
  const arcLen = 2 * Math.PI * GAUGE_R * 0.75;
  const full = f >= MEND ? Math.exp(-(f - MEND) / 14) : 0;
  return (
    <svg className="abs" width="1080" height="760" viewBox="0 0 1080 760" style={{ left: 0, top: MY - 380 }} data-audit-ignore>
      <defs>
        <linearGradient id="gaugeG" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={C.orange} />
          <stop offset="1" stopColor={C.cyan} />
        </linearGradient>
        <radialGradient id="rotorG">
          <stop offset="0" stopColor="#2A3040" />
          <stop offset="1" stopColor="#0D0F14" />
        </radialGradient>
      </defs>
      <g transform={`translate(${MX} 380)`}>
        {/* gauge */}
        <circle r={GAUGE_R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="14" strokeDasharray={`${arcLen} 9999`} transform="rotate(135)" strokeLinecap="round" />
        <circle
          r={GAUGE_R}
          fill="none"
          stroke="url(#gaugeG)"
          strokeWidth="14"
          strokeDasharray={`${arcLen * k} 9999`}
          transform="rotate(135)"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 ${10 + full * 20}px ${rgba(C.cyan, 0.8)})` }}
        />
        {Array.from({ length: 28 }, (_, i) => {
          const a = ((135 + (270 * i) / 27) * Math.PI) / 180;
          const on = i / 27 <= k;
          const r0 = GAUGE_R - 30;
          const r1 = GAUGE_R - (i % 3 === 0 ? 50 : 40);
          return (
            <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke={on ? '#fff' : 'rgba(255,255,255,0.2)'} strokeWidth="3" strokeLinecap="round" />
          );
        })}
        {/* stator */}
        <circle r="196" fill="#11141B" stroke="#3A4152" strokeWidth="3" />
        {Array.from({ length: SLOTS }, (_, i) => (
          <rect key={i} x="-7" y="-192" width="14" height="40" rx="3" fill={i % 3 === 0 ? '#C77A3C' : '#B5693A'} opacity="0.85" transform={`rotate(${(360 * i) / SLOTS})`} />
        ))}
        <circle r="148" fill="#090B10" />
        {/* rotor */}
        <g transform={`rotate(${ang})`}>
          <circle r="140" fill="url(#rotorG)" stroke="#4A5366" strokeWidth="2" />
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d="M-34 -130A134 134 0 0 1 34 -130L26 -98A101 101 0 0 0 -26 -98Z"
              fill={i % 2 ? C.cyan : C.orange}
              opacity="0.9"
              transform={`rotate(${i * 45})`}
            />
          ))}
          <circle r="54" fill="#1C2130" stroke="#6B7489" strokeWidth="3" />
          {[0, 120, 240].map((r) => (
            <rect key={r} x="-5" y="-50" width="10" height="30" rx="3" fill="#6B7489" transform={`rotate(${r})`} />
          ))}
        </g>
        {/* speed smear */}
        <circle r="118" fill="none" stroke="#fff" strokeWidth="40" opacity={k * 0.12} />
        <circle r="134" fill="none" stroke={C.cyan} strokeWidth="6" opacity={k * 0.5} style={{ filter: `drop-shadow(0 0 12px ${C.cyan})` }} />
        <circle r="24" fill={C.orange} />
      </g>
    </svg>
  );
}

function Component({ f }: SceneProps) {
  const hOp = Ease.outCubic(clamp((f - 2) / 18));
  const ms = spring(f, { stiffness: 140, damping: 14 });
  const rpm = f >= MEND ? RPM_MAX : Math.round(rpmAt(f) / 10) * 10;
  const punch = f >= MEND ? 1 + 0.12 * (1 - spring(f - MEND, { stiffness: 320, damping: 12 })) : 1;
  const cIn = spring(f - CARD, { stiffness: 170, damping: 16 });
  const bar = Ease.inOutCubic(clamp((f - BAR0) / (BAR1 - BAR0)));
  const nz = f >= BAR1 ? spring(f - BAR1, { stiffness: 260, damping: 12 }) : 0;
  const ex = Ease.inCubic(clamp((f - EXIT) / 18));

  return (
    <div className="abs" style={{ inset: 0, opacity: 1 - ex, transform: `translateY(${-ex * 60}px)` }}>
      <Eyebrow y={300} op={hOp}>
        HYPERENGINE V8s
      </Eyebrow>
      <div className="abs" style={{ inset: 0, transformOrigin: `${MX}px ${MY}px`, transform: `scale(${0.75 + 0.25 * ms})`, opacity: clamp(ms * 1.4) }}>
        <Motor f={f} />
      </div>
      <div
        className="abs mono"
        style={{
          left: SAFE_RECT.x0,
          width: CONTENT_W,
          top: 900,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: 18,
          ...NUM,
          transform: `scale(${punch})`,
          opacity: clamp(f / 12),
        }}
      >
        <span style={{ fontSize: 124, fontWeight: 800, letterSpacing: '-0.03em', textShadow: `0 0 40px ${rgba(C.cyan, 0.45)}` }}>{fmtID(rpm)}</span>
        <span style={{ fontSize: 44, fontWeight: 700, color: C.cyan }}>RPM</span>
      </div>
      <div className="abs" style={{ left: SAFE_RECT.x0, width: CONTENT_W, top: 1080, textAlign: 'center', fontSize: 32, fontWeight: 600, color: C.muted, opacity: clamp((f - 20) / 16) }}>
        Motor listrik Xiaomi berkecepatan kelas dunia
      </div>

      {/* carbon-neutral factory card */}
      <div
        className="abs"
        style={{
          left: SAFE_RECT.x0,
          top: 1156,
          width: CONTENT_W,
          height: 300,
          borderRadius: 40,
          padding: '34px 40px',
          background: 'linear-gradient(160deg, rgba(61,220,132,0.10), rgba(255,255,255,0.025))',
          border: '1.5px solid rgba(61,220,132,0.3)',
          transform: `translateY(${(1 - cIn) * 260}px)`,
          opacity: clamp(cIn * 1.5),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ position: 'relative', width: 92, height: 92, borderRadius: 26, background: 'rgba(61,220,132,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="abs" style={{ opacity: 1 - bar }}>
              <FactoryIcon size={56} />
            </div>
            <div className="abs" style={{ opacity: bar, transform: `scale(${0.6 + 0.4 * bar}) rotate(${(1 - bar) * -40}deg)` }}>
              <LeafIcon size={58} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Pabrik bebas karbon</div>
            <div style={{ fontSize: 26, fontWeight: 500, color: C.muted, marginTop: 6 }}>Inisiatif netral karbon menuju 2040</div>
          </div>
        </div>
        <div style={{ position: 'relative', marginTop: 40, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.1)' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 7,
              background: 'linear-gradient(90deg, #3DDC84, #00E5FF)',
              transformOrigin: 'left',
              transform: `scaleX(${bar})`,
              boxShadow: '0 0 20px rgba(61,220,132,0.6)',
            }}
          />
          <div className="abs" style={{ left: `calc(${bar * 100}% - 13px)`, top: -6, width: 26, height: 26, borderRadius: 13, background: '#fff', boxShadow: '0 0 18px #3DDC84', opacity: clamp(bar * 10) }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, fontFamily: FONT_MONO, fontSize: 22, color: C.muted }}>
          <span>2026 · HARI INI</span>
          <span
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 999,
              background: '#3DDC84',
              color: C.obsidian,
              fontWeight: 800,
              transform: `scale(${0.4 + 0.6 * nz})`,
              opacity: clamp(nz * 2),
            }}
          >
            NET ZERO 2040
          </span>
        </div>
      </div>
    </div>
  );
}

const cues: Cue[] = [
  { frame: M0, type: 'motor', dur: MLEN / 60, gain: 1 },
  { frame: MEND, type: 'impact', gain: 0.8 },
  { frame: MEND, type: 'chime', pitch: 1.25, gain: 0.7, dur: 1.2 },
  { frame: CARD, type: 'whoosh', dur: 0.4, pitch: 1.3, gain: 0.35 },
  { frame: BAR0, type: 'tick', pitch: 1.1 },
  { frame: BAR1, type: 'pop', pitch: 1.3, gain: 0.8 },
  { frame: BAR1 + 1, type: 'chime', pitch: 1.5, gain: 0.6, dur: 1 },
];

export const Scene07: SceneModule = { Component, cues, hold: [100, 160] };
