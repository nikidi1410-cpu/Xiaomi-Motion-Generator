import { C, FONT_MONO, NUM, rgba } from '../assets/palette';
import { Glyph, GLYPHS } from '../assets/svg';
import type { Cue } from '../engine/audio';
import { clamp, Ease, fmtID, spring } from '../engine/easing';
import { rng } from '../engine/random';
import { SAFE_RECT } from '../engine/timing';
import { Burst, CONTENT_W, counterTicks, Eyebrow, makeBurst, type SceneModule, type SceneProps } from './common';

/* S4 · 11.0–14.5s · Counter explodes to 600.000.000+ & 70-icon grid lights up */

const TARGET = 600_000_000;
const C0 = 14;
const CLEN = 110;
const BOOM = C0 + CLEN;
const EXIT = 190;
const COLS = 10;
const ROWS = 7;
const PITCH = 86;
const GRID_TOP = 790;
const GRID_LEFT = SAFE_RECT.x0;

const countP = (f: number) => Ease.outExpo(clamp((f - C0) / CLEN));

/* deterministic lighting order: each cell lights when the counter passes its threshold */
const CELLS = (() => {
  const r = rng(600);
  return Array.from({ length: COLS * ROWS }, (_, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const th = 0.02 + r() * 0.95;
    let litF = BOOM;
    for (let f = C0; f <= BOOM; f++) {
      if (countP(f) >= th) {
        litF = f;
        break;
      }
    }
    const dx = col - (COLS - 1) / 2;
    const dy = row - (ROWS - 1) / 2;
    return { col, row, glyph: Math.floor(r() * GLYPHS.length), litF, accent: r() > 0.62 ? C.cyan : C.orange, dist: Math.hypot(dx, dy) };
  });
})();

const PARTS = makeBurst(44, 54);

function Component({ f }: SceneProps) {
  const p = countP(f);
  const done = f >= BOOM;
  const val = done ? TARGET : Math.round(p * TARGET);
  const punch = done ? 1 + 0.1 * (1 - spring(f - BOOM, { stiffness: 320, damping: 13 })) : 1;
  const hOp = Ease.outCubic(clamp((f - 2) / 18));
  const out = Ease.inCubic(clamp((f - EXIT) / 20));
  const flash = done ? Math.exp(-(f - BOOM) / 10) : 0;
  const plus = done ? spring(f - BOOM, { stiffness: 260, damping: 11 }) : 0;
  const litCount = CELLS.filter((c) => f >= c.litF).length;

  return (
    <div className="abs" style={{ inset: 0, opacity: 1 - out, transform: `translateY(${-out * 80}px)` }}>
      <Eyebrow y={318} op={hOp} center>
        SKALA GLOBAL
      </Eyebrow>
      {/* flash glow */}
      <div
        className="abs"
        data-audit-ignore
        style={{
          left: 540 - 600,
          top: 470 - 600,
          width: 1200,
          height: 1200,
          background: `radial-gradient(circle, ${rgba(C.orange, 0.6)} 0%, ${rgba(C.cyan, 0.12)} 30%, transparent 60%)`,
          opacity: 0.25 + flash * 0.75,
          transform: `scale(${0.7 + flash * 0.5})`,
        }}
      />
      <div
        className="abs mono"
        style={{
          left: SAFE_RECT.x0,
          width: CONTENT_W,
          top: 404,
          textAlign: 'center',
          ...NUM,
          fontWeight: 800,
          fontSize: 118,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
          transform: `scale(${punch * (0.9 + 0.1 * Ease.outExpo(clamp(f / 20)))})`,
          opacity: clamp(f / 10),
          textShadow: `0 0 ${30 + flash * 60}px ${rgba(C.orange, 0.55 + flash * 0.4)}`,
        }}
      >
        <span>{fmtID(val)}</span>
        <span style={{ display: 'inline-block', color: C.orange, transform: `scale(${plus})`, width: plus > 0 ? undefined : 0 }}>+</span>
      </div>
      <div
        className="abs"
        style={{
          left: SAFE_RECT.x0,
          width: CONTENT_W,
          top: 548,
          textAlign: 'center',
          fontSize: 42,
          fontWeight: 700,
          color: C.white,
          opacity: Ease.outCubic(clamp((f - 16) / 18)),
        }}
      >
        perangkat aktif di seluruh dunia
      </div>
      <Burst parts={PARTS} t={f - BOOM} cx={540} cy={460} />

      {/* badge row */}
      <div
        className="abs"
        style={{
          left: GRID_LEFT,
          width: CONTENT_W,
          top: 686,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: Ease.outCubic(clamp((f - 24) / 18)),
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 22px',
            borderRadius: 999,
            border: `1.5px solid ${rgba(C.orange, 0.6)}`,
            background: rgba(C.orange, 0.1),
            fontFamily: FONT_MONO,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: C.white,
          }}
        >
          <span style={{ color: C.orange }}>60+</span> KATEGORI EKOSISTEM
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: C.muted }}>
          <span style={{ color: C.cyan, fontWeight: 700 }}>{String(litCount).padStart(2, '0')}</span>/{CELLS.length} AKTIF
        </div>
      </div>

      {/* icon grid */}
      {CELLS.map((c, i) => {
        const appear = Ease.outCubic(clamp((f - 10 - (c.row + c.col) * 1.2) / 14));
        const lt = clamp((f - c.litF) / 10);
        const pop = f >= c.litF ? spring(f - c.litF, { stiffness: 300, damping: 14 }) : 0;
        const wave = done ? Math.exp(-(((f - BOOM) - c.dist * 4) ** 2) / 30) : 0;
        const lit = lt > 0;
        return (
          <div
            key={i}
            className="abs"
            style={{
              left: GRID_LEFT + c.col * PITCH + 4,
              top: GRID_TOP + c.row * PITCH + 4,
              width: PITCH - 8,
              height: PITCH - 8,
              borderRadius: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: lit ? rgba(c.accent, 0.1 + 0.08 * lt + wave * 0.25) : 'rgba(255,255,255,0.035)',
              border: `1.5px solid ${lit ? rgba(c.accent, 0.35 + 0.4 * lt) : 'rgba(255,255,255,0.07)'}`,
              opacity: appear,
              transform: `scale(${(0.85 + 0.15 * appear) * (lit ? 0.9 + 0.1 * pop : 1) * (1 + wave * 0.08)})`,
            }}
          >
            <Glyph i={c.glyph} size={40} color={lit ? c.accent : 'rgba(255,255,255,0.28)'} sw={3} />
          </div>
        );
      })}
    </div>
  );
}

const cues: Cue[] = [
  ...counterTicks(C0, CLEN, Ease.outExpo, 1 / 30, 3),
  { frame: BOOM, type: 'impact', gain: 1 },
  { frame: BOOM, type: 'chime', pitch: 1.33, gain: 0.9, dur: 1.5 },
  { frame: BOOM + 1, type: 'sub', gain: 0.6, dur: 1 },
];

export const Scene04: SceneModule = { Component, cues };
