import { memo } from 'react';
import { C, FONT_MONO, rgba } from '../assets/palette';
import { XiaomiLogo } from '../assets/svg';
import { clamp, Ease, interpolate } from '../engine/easing';
import { rng } from '../engine/random';
import { HEIGHT, SAFE_RECT, SCENES, sceneIndexAt, TOTAL_FRAMES, WIDTH } from '../engine/timing';

/* Directional (kinetic) blur filter bank: url(#mbx-N) / url(#mby-N) */
export const MotionBlurDefs = memo(function MotionBlurDefs() {
  const levels = Array.from({ length: 16 }, (_, i) => i + 1);
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        {levels.map((n) => (
          <filter key={`x${n}`} id={`mbx-${n}`} x="-40%" y="-10%" width="180%" height="120%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${n * 1.4} 0`} />
          </filter>
        ))}
        {levels.map((n) => (
          <filter key={`y${n}`} id={`mby-${n}`} x="-10%" y="-40%" width="120%" height="180%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`0 ${n * 1.4}`} />
          </filter>
        ))}
      </defs>
    </svg>
  );
});

/* Per-scene ambient accent [orange, cyan], interpolated between scene midpoints. */
const ACCENT: [number, number][] = [
  [0.55, 0.22],
  [0.95, 0.2],
  [0.5, 0.45],
  [0.75, 0.5],
  [0.35, 0.85],
  [0.25, 0.95],
  [0.65, 0.6],
  [0.8, 0.3],
  [0.95, 0.55],
  [0.85, 0.4],
];
const MIDS = SCENES.map((s) => (s.start + s.end) / 2);

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export function Background({ frame }: { frame: number }) {
  const o = interpolate(frame, MIDS, ACCENT.map((a) => a[0]), Ease.inOutCubic);
  const c = interpolate(frame, MIDS, ACCENT.map((a) => a[1]), Ease.inOutCubic);
  const t = frame / 60;
  const ox = 180 + Math.sin(t * 0.45) * 160;
  const oy = 520 + Math.cos(t * 0.37) * 220;
  const cx = 900 + Math.cos(t * 0.41) * 150;
  const cy = 1440 + Math.sin(t * 0.33) * 220;
  const r = rng(frame * 31 + 7);
  return (
    <div className="abs" style={{ inset: 0 }} data-audit-ignore>
      <div
        className="abs"
        style={{
          width: 1800,
          height: 1800,
          left: -900,
          top: -900,
          transform: `translate3d(${ox}px, ${oy}px, 0)`,
          background: `radial-gradient(circle at center, ${rgba(C.orange, 0.42)} 0%, ${rgba(C.orange, 0.12)} 32%, transparent 62%)`,
          opacity: o,
        }}
      />
      <div
        className="abs"
        style={{
          width: 1800,
          height: 1800,
          left: -900,
          top: -900,
          transform: `translate3d(${cx}px, ${cy}px, 0)`,
          background: `radial-gradient(circle at center, ${rgba(C.cyan, 0.32)} 0%, ${rgba(C.cyan, 0.08)} 34%, transparent 62%)`,
          opacity: c,
        }}
      />
      <div
        className="abs"
        style={{
          left: 0,
          top: 0,
          width: WIDTH,
          height: HEIGHT + 72,
          transform: `translate3d(0, ${-((frame * 0.6) % 72)}px, 0)`,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 50%, #000 30%, transparent 80%)',
          maskImage: 'radial-gradient(ellipse 70% 55% at 50% 50%, #000 30%, transparent 80%)',
        }}
      />
      <div
        className="abs"
        style={{
          left: -128,
          top: -128,
          width: WIDTH + 256,
          height: HEIGHT + 256,
          backgroundImage: GRAIN,
          opacity: 0.07,
          transform: `translate3d(${Math.floor(r() * 128)}px, ${Math.floor(r() * 128)}px, 0)`,
          mixBlendMode: 'overlay',
        }}
      />
      <div
        className="abs"
        style={{ inset: 0, background: 'radial-gradient(ellipse 85% 65% at 50% 48%, transparent 55%, rgba(0,0,0,0.6) 100%)' }}
      />
    </div>
  );
}

const BOUNDARIES = SCENES.slice(1).map((s) => s.start);

/* Light-streak + flash bridging every scene cut. */
export function TransitionFX({ frame }: { frame: number }) {
  const b = BOUNDARIES.find((x) => Math.abs(frame - x) <= 12);
  if (b === undefined) return null;
  const t = clamp((frame - (b - 12)) / 24);
  const x = interpolate(t, [0, 1], [-1500, 1500], Ease.inOutCubic);
  const flash = Math.max(0, 1 - Math.abs(frame - b) / 6);
  return (
    <div className="abs" style={{ inset: 0, pointerEvents: 'none' }} data-audit-ignore>
      <div
        className="abs"
        style={{
          left: -200,
          top: 900,
          width: 1480,
          height: 140,
          transform: `translate3d(${x}px,0,0) rotate(-9deg)`,
          background: `linear-gradient(90deg, transparent, ${rgba(C.orange, 0.32)} 35%, ${rgba(C.cyan, 0.38)} 65%, transparent)`,
          borderRadius: 999,
        }}
      />
      <div
        className="abs"
        style={{
          left: -200,
          top: 966,
          width: 1480,
          height: 4,
          transform: `translate3d(${x * 1.15}px,0,0) rotate(-9deg)`,
          background: `linear-gradient(90deg, transparent, #fff 50%, transparent)`,
        }}
      />
      <div className="abs" style={{ inset: 0, background: '#fff', opacity: flash * 0.08 }} />
    </div>
  );
}

export function HUD({ frame }: { frame: number }) {
  const op = clamp((frame - 24) / 24) * (1 - clamp((frame - 1690) / 30));
  if (op <= 0) return null;
  const idx = sceneIndexAt(frame);
  const total = SAFE_RECT.x1 - SAFE_RECT.x0;
  const gap = 8;
  const usable = total - gap * (SCENES.length - 1);
  let x = SAFE_RECT.x0;
  return (
    <div className="abs" style={{ inset: 0, opacity: op }}>
      <div className="abs" style={{ left: SAFE_RECT.x0, top: 236, display: 'flex', alignItems: 'center', gap: 16 }}>
        <XiaomiLogo size={40} />
        <span style={{ fontFamily: FONT_MONO, fontSize: 22, letterSpacing: '0.18em', color: C.muted, fontWeight: 500 }}>
          HUMAN × CAR × HOME
        </span>
      </div>
      <div
        className="abs"
        style={{ right: WIDTH - SAFE_RECT.x1, top: 244, fontFamily: FONT_MONO, fontSize: 22, color: C.muted, letterSpacing: '0.12em' }}
      >
        <span style={{ color: C.orange, fontWeight: 700 }}>{String(idx + 1).padStart(2, '0')}</span> / 10
      </div>
      {SCENES.map((s, i) => {
        const w = (usable * (s.end - s.start)) / TOTAL_FRAMES;
        const fill = clamp((frame - s.start) / (s.end - s.start));
        const left = x;
        x += w + gap;
        return (
          <div key={s.id} className="abs" style={{ left, top: 1494, width: w, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: i === idx ? C.orange : '#fff', opacity: i === idx ? 1 : 0.55, transformOrigin: 'left', transform: `scaleX(${fill})` }} />
          </div>
        );
      })}
    </div>
  );
}

export function SafeOverlay() {
  const { x0, y0, x1, y1 } = SAFE_RECT;
  const shade = 'rgba(255,0,80,0.16)';
  return (
    <div className="abs" style={{ inset: 0, pointerEvents: 'none', zIndex: 50 }} data-audit-ignore>
      <div className="abs" style={{ left: 0, top: 0, width: WIDTH, height: y0, background: shade }} />
      <div className="abs" style={{ left: 0, top: y1, width: WIDTH, height: HEIGHT - y1, background: shade }} />
      <div className="abs" style={{ left: 0, top: y0, width: x0, height: y1 - y0, background: shade }} />
      <div className="abs" style={{ left: x1, top: y0, width: WIDTH - x1, height: y1 - y0, background: shade }} />
      <div className="abs" style={{ left: x0, top: y0, width: x1 - x0, height: y1 - y0, border: '3px dashed #FF2D6F' }} />
      <div className="abs" style={{ left: x0 + 12, top: y0 + 10, fontFamily: FONT_MONO, fontSize: 22, color: '#FF2D6F' }}>
        SAFE ZONE {x1 - x0}×{y1 - y0}
      </div>
    </div>
  );
}
