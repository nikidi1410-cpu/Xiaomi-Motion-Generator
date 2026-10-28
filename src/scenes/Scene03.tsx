import type { ReactNode } from 'react';
import { C, FONT_MONO, NUM, rgba } from '../assets/palette';
import { ChartIcon, Glyph, GlobeIcon, HyperOSIcon, TrophyIcon, XiaomiLogo } from '../assets/svg';
import type { Cue } from '../engine/audio';
import { clamp, Ease, interpolate, lerp, motionBlur } from '../engine/easing';
import { SAFE_RECT } from '../engine/timing';
import { CONTENT_W, Eyebrow, type SceneModule, type SceneProps } from './common';

/* S3 · 5.0–11.0s · Horizontal timeline scrubber 2010 → 2026 */

interface Milestone {
  year: number;
  title: string;
  desc: string;
  icon: ReactNode;
}

const MS: Milestone[] = [
  { year: 2010, title: 'Xiaomi lahir', desc: 'Didirikan di Beijing. MIUI pertama dirilis untuk komunitas.', icon: <XiaomiLogo size={64} /> },
  { year: 2011, title: 'Mi 1', desc: 'Smartphone pertama: spesifikasi flagship, harga jujur.', icon: <Glyph i={0} size={56} color={C.obsidian} sw={3.4} /> },
  { year: 2014, title: 'Hadir di Indonesia', desc: 'Ekspansi global dimulai, termasuk pasar Indonesia.', icon: <GlobeIcon size={56} color={C.obsidian} /> },
  { year: 2018, title: 'IPO Hong Kong', desc: 'Melantai di bursa HKEX, tumbuh bersama penggemar.', icon: <ChartIcon size={56} color={C.obsidian} /> },
  { year: 2019, title: 'Fortune Global 500', desc: 'Perusahaan termuda dalam daftar pada tahun itu.', icon: <TrophyIcon size={56} color={C.obsidian} /> },
  { year: 2021, title: 'Langkah ke mobil', desc: 'Xiaomi mengumumkan masuk ke industri mobil listrik.', icon: <Glyph i={12} size={56} color={C.obsidian} sw={3.4} /> },
  { year: 2023, title: 'HyperOS', desc: 'Satu sistem operasi untuk Human × Car × Home.', icon: <HyperOSIcon size={64} spin={0} /> },
  { year: 2024, title: 'Xiaomi SU7', desc: 'Sedan listrik pertama Xiaomi resmi meluncur.', icon: <Glyph i={12} size={56} color={C.obsidian} sw={3.4} /> },
  { year: 2026, title: 'Satu ekosistem', desc: 'Manusia, mobil, dan rumah terhubung mulus.', icon: <Glyph i={17} size={56} color={C.obsidian} sw={3.4} /> },
];

const T0 = 30;
const STEP = 34;
const MOVE = 16;
const EXIT = 340;
const PX = 150; // px per year
const arrive = (i: number) => T0 + i * STEP;

/** Continuous playhead year (eased hops between milestones). */
function yearAt(f: number): number {
  if (f < T0) return interpolate(f, [2, T0], [2005.5, 2010], Ease.outExpo);
  for (let i = MS.length - 1; i >= 1; i--) {
    const a = arrive(i);
    if (f >= a - MOVE) return lerp(MS[i - 1].year, MS[i].year, Ease.snap(clamp((f - (a - MOVE)) / MOVE)));
  }
  return 2010;
}

/** Odometer digit position for transitions (0..9 continuous). */
function digitsAt(f: number): number[] {
  let i = 0;
  let t = 1;
  for (let k = MS.length - 1; k >= 1; k--) {
    const a = arrive(k);
    if (f >= a - MOVE) {
      i = k;
      t = Ease.snap(clamp((f - (a - MOVE)) / MOVE));
      break;
    }
  }
  const to = String(MS[i].year).split('').map(Number);
  const from = String(MS[Math.max(0, i - 1)].year).split('').map(Number);
  return to.map((d, k) => lerp(i === 0 ? d : from[k], d, t));
}

const DIGIT_H = 240;

function Odometer({ f, op }: { f: number; op: number }) {
  const digits = digitsAt(f);
  const prev = digitsAt(f - 1);
  return (
    <div
      className="abs"
      style={{
        left: 0,
        width: 1080,
        top: 500,
        height: DIGIT_H,
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: op,
        WebkitMaskImage: 'linear-gradient(transparent, #000 22%, #000 78%, transparent)',
        maskImage: 'linear-gradient(transparent, #000 22%, #000 78%, transparent)',
      }}
    >
      {digits.map((d, k) => (
        <div
          key={k}
          style={{
            width: 0.6 * DIGIT_H,
            height: DIGIT_H,
            ...NUM,
            fontWeight: 800,
            fontSize: DIGIT_H,
            lineHeight: `${DIGIT_H}px`,
            textAlign: 'center',
            color: k >= 2 ? C.orange : C.white,
            textShadow: k >= 2 ? `0 0 50px ${rgba(C.orange, 0.5)}` : undefined,
            transform: `translate3d(0, ${-d * DIGIT_H}px, 0)`,
            filter: motionBlur((d - prev[k]) * DIGIT_H, 'y', 0.16),
          }}
        >
          {Array.from({ length: 10 }, (_, n) => (
            <div key={n} style={{ height: DIGIT_H }}>
              {n}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Ruler({ f, op }: { f: number; op: number }) {
  const yr = yearAt(f);
  const base = 540 - (yr - 2010) * PX;
  const ticks: ReactNode[] = [];
  for (let y = 2004; y <= 2032; y++) {
    const x = base + (y - 2010) * PX;
    if (x < -160 || x > 1240) continue;
    const ms = MS.find((m) => m.year === y);
    const passed = y <= yr + 0.01 && y >= 2010;
    const near = clamp(1 - Math.abs(x - 540) / 360);
    ticks.push(
      <div key={y} className="abs" style={{ left: x, top: 0 }}>
        <div
          className="abs mono"
          style={{
            left: -60,
            width: 120,
            top: -60,
            textAlign: 'center',
            fontFamily: FONT_MONO,
            fontSize: ms ? 28 : 22,
            fontWeight: ms ? 700 : 500,
            color: ms && passed ? C.orange : `rgba(255,255,255,${0.35 + near * 0.45})`,
          }}
        >
          {y}
        </div>
        <div className="abs" style={{ left: -1.5, top: 0, width: 3, height: 34, background: `rgba(255,255,255,${0.3 + near * 0.5})`, borderRadius: 2 }} />
        {ms && (
          <div
            className="abs"
            style={{
              left: -13,
              top: 58,
              width: 26,
              height: 26,
              borderRadius: 9,
              background: passed ? C.orange : C.panel2,
              border: `3px solid ${passed ? C.orange : 'rgba(255,255,255,0.3)'}`,
              boxShadow: passed ? `0 0 24px ${rgba(C.orange, 0.8)}` : undefined,
            }}
          />
        )}
        {[0.25, 0.5, 0.75].map((q) => (
          <div key={q} className="abs" style={{ left: q * PX - 1, top: 0, width: 2, height: q === 0.5 ? 20 : 12, background: 'rgba(255,255,255,0.2)' }} />
        ))}
      </div>,
    );
  }
  const fillW = Math.max(0, 540 - base);
  return (
    <div
      className="abs"
      data-audit-ignore
      style={{
        left: 0,
        top: 880,
        width: 1080,
        height: 140,
        opacity: op,
        WebkitMaskImage: 'linear-gradient(90deg, transparent 2%, #000 22%, #000 78%, transparent 98%)',
        maskImage: 'linear-gradient(90deg, transparent 2%, #000 22%, #000 78%, transparent 98%)',
      }}
    >
      <div className="abs" style={{ left: 0, top: 70, width: 1080, height: 4, background: 'rgba(255,255,255,0.12)' }} />
      <div
        className="abs"
        style={{ left: base, top: 69, width: fillW, height: 6, background: `linear-gradient(90deg, ${rgba(C.orange, 0.2)}, ${C.orange})`, borderRadius: 3 }}
      />
      {ticks}
    </div>
  );
}

function Card({ i, f }: { i: number; f: number }) {
  const m = MS[i];
  const enter = Ease.outExpo(clamp((f - (arrive(i) - 8)) / 20));
  const exitAt = i < MS.length - 1 ? arrive(i + 1) - MOVE : EXIT;
  const ex = Ease.inCubic(clamp((f - exitAt) / 10));
  if (enter <= 0 || ex >= 1) return null;
  const x = (1 - enter) * 50 - ex * 50;
  return (
    <div
      className="abs"
      style={{
        left: SAFE_RECT.x0,
        top: 1068,
        width: CONTENT_W,
        height: 330,
        borderRadius: 40,
        padding: '40px 44px',
        background: 'linear-gradient(160deg, rgba(255,255,255,0.075), rgba(255,255,255,0.02))',
        border: '1.5px solid rgba(255,255,255,0.1)',
        opacity: enter * (1 - ex),
        transform: `translate3d(${x}px,0,0)`,
        filter: motionBlur(enter < 1 ? (1 - enter) * 40 : ex * 60, 'x', 0.35),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 28,
            background: i === 0 || i === 6 ? C.panel2 : C.orange,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 40px ${rgba(C.orange, 0.35)}`,
          }}
        >
          {m.icon}
        </div>
        <div style={{ flex: 1, fontSize: 58, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{m.title}</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.muted, alignSelf: 'flex-start' }}>
          {String(i + 1).padStart(2, '0')}/{MS.length}
        </div>
      </div>
      <div style={{ marginTop: 30, fontSize: 36, fontWeight: 500, lineHeight: 1.35, color: C.muted }}>{m.desc}</div>
    </div>
  );
}

function Component({ f }: SceneProps) {
  const hOp = Ease.outCubic(clamp((f - 2) / 20));
  const out = Ease.inCubic(clamp((f - EXIT) / 20));
  const op = (1 - out) * clamp(f / 14);
  return (
    <div className="abs" style={{ inset: 0, opacity: 1 - out * 0.999, transform: `scale(${1 - out * 0.06})` }}>
      <Eyebrow y={318} op={hOp}>
        PERJALANAN 2010 → 2026
      </Eyebrow>
      <div
        className="abs"
        style={{
          left: SAFE_RECT.x0,
          top: 366,
          width: CONTENT_W,
          fontSize: 64,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          opacity: hOp,
          transform: `translateY(${(1 - hOp) * 30}px)`,
        }}
      >
        Tonggak sejarah Xiaomi
      </div>
      <Odometer f={f} op={op} />
      <Ruler f={f} op={op} />
      {/* playhead */}
      <div className="abs" data-audit-ignore style={{ left: 540 - 2, top: 800, width: 4, height: 190, opacity: op }}>
        <div style={{ width: 4, height: '100%', background: C.cyan, borderRadius: 2, boxShadow: `0 0 18px ${C.cyan}, 0 0 40px ${rgba(C.cyan, 0.6)}` }} />
        <div
          className="abs"
          style={{ left: -16, top: -18, width: 36, height: 36, borderRadius: 12, background: C.cyan, boxShadow: `0 0 30px ${C.cyan}`, transform: 'rotate(45deg)' }}
        />
      </div>
      {MS.map((_, i) => (
        <Card key={i} i={i} f={f} />
      ))}
    </div>
  );
}

const cues: Cue[] = [
  { frame: 4, type: 'tick', pitch: 0.9 },
  ...MS.slice(1).map((_, k) => ({ frame: arrive(k + 1) - MOVE, type: 'tick' as const, pitch: 1 + k * 0.05, gain: 1 })),
  ...MS.map((_, i) => ({ frame: arrive(i), type: 'pop' as const, pitch: 0.9 + i * 0.04, gain: 0.45 })),
  { frame: arrive(MS.length - 1), type: 'chime', pitch: 1.5, gain: 0.7, dur: 1.2 },
];

export const Scene03: SceneModule = { Component, cues, hold: [40, 338] };
