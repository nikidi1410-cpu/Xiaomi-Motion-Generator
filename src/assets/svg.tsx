import { memo, useId, type CSSProperties, type ReactNode } from 'react';
import { clamp, Ease } from '../engine/easing';
import { C } from './palette';

const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '');

/* ------------------------------------------------------------------ */
/* Superellipse (squircle) — |x/a|^n + |y/b|^n = 1, n≈3 like the 2021 */
/* Xiaomi identity.                                                    */
/* ------------------------------------------------------------------ */
export function squirclePath(cx: number, cy: number, r: number, n = 3, steps = 144) {
  const e = 2 / n;
  let d = '';
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = cx + r * Math.sign(c) * Math.abs(c) ** e;
    const y = cy + r * Math.sign(s) * Math.abs(s) ** e;
    d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d + 'Z';
}

export const SQUIRCLE_100 = squirclePath(50, 50, 50, 3);

/** "mi" letterform parts in a 100×100 box (stroke width 8, baseline y=68). */
const MI_ARCH = 'M24.5 68V32H43.5A18 18 0 0 1 61.5 50V68H53.5V50A10 10 0 0 0 43.5 40H32.5V68Z';
const MI_INNER = 'M39 46H47V68H39Z';
const MI_I = 'M67.5 32H75.5V68H67.5Z';

const rise = (p: number) => {
  const s = Math.max(0.0001, p);
  return `translate(0 ${68 * (1 - s)}) scale(1 ${s})`;
};

interface LogoProps {
  size: number;
  /** 0..1 reveal of the white letterforms (staggered rise). */
  reveal?: number;
  fill?: string;
  style?: CSSProperties;
}

/** Xiaomi squircle logo, pure math SVG. */
export const XiaomiLogo = memo(function XiaomiLogo({ size, reveal = 1, fill = C.orange, style }: LogoProps) {
  const id = safeId(useId());
  const r = reveal * 2.2;
  const a = Ease.outBack(clamp(r));
  const b = Ease.outBack(clamp(r - 0.6));
  const c = Ease.outBack(clamp(r - 1.2));
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style} aria-label="Xiaomi">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF8A33" />
          <stop offset="0.55" stopColor={fill} />
          <stop offset="1" stopColor="#E85A00" />
        </linearGradient>
      </defs>
      <path d={SQUIRCLE_100} fill={fill === C.orange ? `url(#g${id})` : fill} />
      <g fill="#fff">
        {a > 0.001 && <path d={MI_ARCH} transform={rise(a)} />}
        {b > 0.001 && <path d={MI_INNER} transform={rise(b)} />}
        {c > 0.001 && <path d={MI_I} transform={rise(c)} />}
      </g>
    </svg>
  );
});

/* ------------------------------------------------------------------ */
/* Xiaomi SU7 side silhouette (fastback sedan, facing right)          */
/* ------------------------------------------------------------------ */
const SU7_BODY =
  'M958 214C968 200 966 186 950 180C900 166 770 150 652 142C592 112 540 95 470 91C380 87 300 96 222 117' +
  'C172 130 112 141 70 148C50 152 42 160 42 176L44 204C46 219 60 226 80 226L152 226A78 78 0 0 1 308 226' +
  'L692 226A78 78 0 0 1 848 226L932 226C950 226 958 222 958 214Z';
const SU7_GLASS =
  'M634 146C588 121 540 105 474 102C402 100 332 108 266 126C252 130 254 139 268 140L618 151C638 152 645 150 634 146Z';
const SU7_SHOULDER = 'M944 184C820 170 640 160 470 160C330 160 190 160 64 160';
const SU7_SILL = 'M318 214L682 214';

function Wheel({ cx, cy, angle }: { cx: number; cy: number; angle: number }) {
  const spokes = [0, 72, 144, 216, 288];
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r="64" fill="#07080B" stroke="#262B36" strokeWidth="3" />
      <circle r="47" fill="#1A1E27" />
      <g transform={`rotate(${angle})`}>
        {spokes.map((s) => (
          <path
            key={s}
            transform={`rotate(${s})`}
            d="M-5 -9L-9 -44L-1 -45L3 -9ZM5 -9L9 -44L15 -42L9 -8Z"
            fill="#9AA3B5"
          />
        ))}
        <circle r="44" fill="none" stroke="#5A6375" strokeWidth="2" />
      </g>
      <path d="M30 -34A45 45 0 0 1 44 -6" stroke={C.orange} strokeWidth="9" strokeLinecap="round" fill="none" />
      <circle r="10" fill="#2B313D" stroke="#9AA3B5" strokeWidth="2" />
    </g>
  );
}

interface SU7Props {
  width: number;
  wheelAngle?: number;
  glow?: string;
  /** 0..1 strength of the neon edge + floor glow */
  glowAmt?: number;
  lights?: number;
  style?: CSSProperties;
}

export const SU7 = memo(function SU7({ width, wheelAngle = 0, glow = C.cyan, glowAmt = 0.7, lights = 1, style }: SU7Props) {
  const id = safeId(useId());
  return (
    <svg width={width} height={width * 0.32} viewBox="0 0 1000 320" style={{ overflow: 'visible', ...style }} aria-label="Xiaomi SU7">
      <defs>
        <linearGradient id={`body${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A5366" />
          <stop offset="0.35" stopColor="#262C39" />
          <stop offset="0.7" stopColor="#151922" />
          <stop offset="1" stopColor="#090A0E" />
        </linearGradient>
        <linearGradient id={`glass${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0A0C11" />
          <stop offset="0.55" stopColor="#1E2A3A" />
          <stop offset="1" stopColor="#0A0C11" />
        </linearGradient>
        <radialGradient id={`floor${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={glow} stopOpacity={0.55 * glowAmt} />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <filter id={`neon${id}`} x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <ellipse cx="500" cy="296" rx="520" ry="34" fill={`url(#floor${id})`} />
      <path d={SU7_BODY} fill="none" stroke={glow} strokeWidth="10" opacity={0.8 * glowAmt} filter={`url(#neon${id})`} />
      <path d={SU7_BODY} fill={`url(#body${id})`} />
      <path d={SU7_BODY} fill="none" stroke={glow} strokeOpacity={0.35 + 0.5 * glowAmt} strokeWidth="2.5" />
      <path d={SU7_GLASS} fill={`url(#glass${id})`} stroke="#3A4356" strokeWidth="2" />
      <path d="M432 101L436 146" stroke="#11141B" strokeWidth="9" />
      <path d="M520 112C560 120 590 132 610 144" stroke="#fff" strokeOpacity="0.22" strokeWidth="5" strokeLinecap="round" />
      <path d={SU7_SHOULDER} fill="none" stroke="#fff" strokeOpacity="0.16" strokeWidth="2.5" />
      <path d={SU7_SILL} stroke="#000" strokeOpacity="0.5" strokeWidth="6" />
      <path d="M600 146L622 140L630 152L606 156Z" fill="#1A1E27" />
      {/* headlight + light bar */}
      <path d="M904 177C924 179 942 183 952 189" stroke={C.cyan} strokeWidth="6" strokeLinecap="round" opacity={0.3 + 0.7 * lights} />
      <path d="M44 162L92 156" stroke={C.orange} strokeWidth="7" strokeLinecap="round" opacity={0.35 + 0.65 * lights} />
      <Wheel cx={230} cy={232} angle={wheelAngle} />
      <Wheel cx={770} cy={232} angle={wheelAngle} />
    </svg>
  );
});

/* ------------------------------------------------------------------ */
/* Ecosystem icons                                                    */
/* ------------------------------------------------------------------ */
export const HyperOSIcon = memo(function HyperOSIcon({ size, spin = 0 }: { size: number; spin?: number }) {
  const id = safeId(useId());
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="HyperOS">
      <defs>
        <linearGradient id={`h${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.orange} />
          <stop offset="1" stopColor={C.cyan} />
        </linearGradient>
      </defs>
      <g transform={`rotate(${spin} 50 50)`}>
        <circle cx="50" cy="50" r="42" fill="none" stroke={`url(#h${id})`} strokeWidth="5" strokeDasharray="200 64" strokeLinecap="round" />
      </g>
      <g transform={`rotate(${-spin * 1.6} 50 50)`}>
        <circle cx="50" cy="50" r="29" fill="none" stroke={C.cyan} strokeWidth="4" strokeDasharray="110 72" strokeLinecap="round" />
        <circle cx="50" cy="21" r="4" fill={C.orange} />
      </g>
      <circle cx="50" cy="50" r="12" fill="#fff" />
    </svg>
  );
});

export const PhoneIcon = memo(function PhoneIcon({ size }: { size: number }) {
  return (
    <svg width={size * 0.625} height={size} viewBox="0 0 100 160" aria-label="Smartphone flagship">
      <rect x="4" y="4" width="92" height="152" rx="20" fill="#1C2130" stroke="#4A5366" strokeWidth="3" />
      <rect x="14" y="14" width="50" height="50" rx="14" fill="#0D0F14" stroke="#4A5366" strokeWidth="2" />
      {[
        [28, 28],
        [50, 28],
        [28, 50],
        [50, 50],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="9" fill="#05060A" stroke="#6B7489" strokeWidth="2" />
          <circle cx={x - 2} cy={y - 2} r="2.5" fill={i === 0 ? C.cyan : '#3A4356'} />
        </g>
      ))}
      <circle cx="78" cy="22" r="4" fill="#FFE7C7" />
      <path d="M40 130H60" stroke="#6B7489" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
});

export const SmartHomeIcon = memo(function SmartHomeIcon({ size, signal = 1 }: { size: number; signal?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Smart Living">
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M${50 - 12 - i * 9} ${24 - i * 7}A${12 + i * 9} ${12 + i * 9} 0 0 1 ${50 + 12 + i * 9} ${24 - i * 7}`}
          fill="none"
          stroke={C.cyan}
          strokeWidth="4"
          strokeLinecap="round"
          opacity={clamp(signal * 3 - i) * (1 - i * 0.22)}
        />
      ))}
      <path d="M14 56L50 28L86 56V90H14Z" fill="#1C2130" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
      <rect x="40" y="62" width="20" height="28" rx="3" fill={C.orange} />
      <rect x="22" y="62" width="12" height="12" rx="2" fill="#FFE7C7" opacity="0.85" />
      <rect x="66" y="62" width="12" height="12" rx="2" fill="#FFE7C7" opacity="0.85" />
    </svg>
  );
});

export const WearableIcon = memo(function WearableIcon({ size, beat = 0 }: { size: number; beat?: number }) {
  return (
    <svg width={size * 0.6} height={size} viewBox="0 0 60 100" aria-label="Wearable">
      <path d="M18 4H42L40 24H20Z" fill="#2A3040" />
      <path d="M20 76H40L42 96H18Z" fill="#2A3040" />
      <rect x="8" y="20" width="44" height="60" rx="18" fill="#1C2130" stroke="#fff" strokeWidth="3" />
      <rect x="14" y="27" width="32" height="46" rx="12" fill="#05060A" />
      <path
        d={`M16 52H23L26 ${44 - beat * 6}L31 ${60 + beat * 4}L34 50H44`}
        fill="none"
        stroke={C.orange}
        strokeWidth="2.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <text x="30" y="40" fill="#fff" fontSize="9" fontFamily="JetBrains Mono" fontWeight="700" textAnchor="middle">
        09:41
      </text>
    </svg>
  );
});

/* ------------------------------------------------------------------ */
/* Line glyph set (48×48, stroke = currentColor) for the 60+ grid     */
/* ------------------------------------------------------------------ */
const G = (children: ReactNode) => children;
export const GLYPHS: ReactNode[] = [
  G(<><rect x="15" y="5" width="18" height="38" rx="4" /><path d="M21 38H27" /></>), // phone
  G(<><rect x="5" y="9" width="38" height="25" rx="3" /><path d="M16 41H32M24 34V41" /></>), // tv
  G(<><rect x="15" y="12" width="18" height="24" rx="6" /><path d="M18 12L19 5H29L30 12M18 36L19 43H29L30 36" /></>), // watch
  G(<><circle cx="16" cy="17" r="6" /><path d="M16 23V38" /><circle cx="32" cy="17" r="6" /><path d="M32 23V38" /></>), // buds
  G(<><rect x="6" y="27" width="36" height="12" rx="3" /><path d="M14 27L10 9M34 27L38 9M14 33H16M20 33H22" /></>), // router
  G(<><circle cx="24" cy="24" r="17" /><circle cx="24" cy="24" r="5" /><path d="M12 15H36" /></>), // robot vacuum
  G(<><circle cx="12" cy="38" r="4" /><circle cx="36" cy="38" r="4" /><path d="M12 38H30L33 9H39" /></>), // scooter
  G(<><rect x="14" y="5" width="20" height="38" rx="7" /><path d="M19 14H29M19 20H29M19 26H29" /></>), // purifier
  G(<><path d="M16 6H32L38 20H10Z" /><path d="M24 20V38M16 42H32" /></>), // lamp
  G(<><circle cx="24" cy="21" r="12" /><circle cx="24" cy="21" r="4" /><path d="M24 33V40M16 41H32" /></>), // camera
  G(<><rect x="13" y="5" width="22" height="38" rx="7" /><circle cx="24" cy="29" r="7" /><circle cx="24" cy="14" r="2.5" /></>), // speaker
  G(<><rect x="10" y="10" width="28" height="20" rx="2" /><path d="M4 36H44L41 40H7Z" /></>), // laptop
  G(<><path d="M6 31L10 21C11 18 13 17 16 17H32C35 17 37 18 38 21L42 31V36H6Z" /><circle cx="14" cy="36" r="3" /><circle cx="34" cy="36" r="3" /></>), // car
  G(<><circle cx="24" cy="24" r="3" /><path d="M24 21C22 12 26 6 31 9C34 13 30 19 26 22M26 26C34 30 36 37 31 39C26 39 24 32 24 27M21 25C13 29 7 25 9 20C12 16 18 19 21 23" /></>), // fan
  G(<><rect x="12" y="14" width="24" height="20" rx="6" /><path d="M19 7V14M29 7V14M24 34V42" /></>), // plug
  G(<><rect x="12" y="22" width="24" height="20" rx="4" /><path d="M16 22V16A8 8 0 0 1 32 16V22M24 30V34" /></>), // lock
  G(<><path d="M24 6A12 12 0 0 1 31 28V33H17V28A12 12 0 0 1 24 6Z" /><path d="M19 39H29" /></>), // bulb
  G(<><path d="M7 22L24 8L41 22V41H7Z" /><path d="M20 41V29H28V41" /></>), // home
  G(<><rect x="9" y="6" width="30" height="36" rx="4" /><path d="M20 37H28" /></>), // tablet
  G(<><path d="M10 40V18L24 8L38 18V40M17 40V26H31V40" /><path d="M10 40H38" /></>), // smart door
];

export const Glyph = memo(function Glyph({ i, size, color, sw = 3 }: { i: number; size: number; color: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {GLYPHS[i % GLYPHS.length]}
    </svg>
  );
});

/* ------------------------------------------------------------------ */
/* Misc UI symbols                                                    */
/* ------------------------------------------------------------------ */
export const ArrowRight = ({ size, color, sw = 4 }: { size: number; color: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 16H26M18 7L27 16L18 25" />
  </svg>
);

export const Cursor = ({ size, pressed = 0 }: { size: number; pressed?: number }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 30 42" style={{ overflow: 'visible' }}>
    <path
      d="M2 2L2 34L10 27L16 40L22 37L16 24L28 24Z"
      fill="#fff"
      stroke={C.obsidian}
      strokeWidth="2.4"
      strokeLinejoin="round"
      transform={`scale(${1 - pressed * 0.14})`}
    />
  </svg>
);

export const LeafIcon = ({ size, color = '#3DDC84' }: { size: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 38C8 22 18 10 40 8C40 30 28 40 12 38Z" fill={color} fillOpacity="0.18" />
    <path d="M10 38C18 28 24 22 32 16" />
  </svg>
);

export const FactoryIcon = ({ size, color = '#fff' }: { size: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
    <path d="M5 42V22L16 28V22L27 28V22L38 28V8H43V42Z" />
    <path d="M12 36H16M22 36H26M32 36H36" />
  </svg>
);

export const CapIcon = ({ size, color = '#fff' }: { size: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
    <path d="M3 18L24 8L45 18L24 28Z" fill={color} fillOpacity="0.15" />
    <path d="M12 23V33C18 39 30 39 36 33V23M42 19V31" />
  </svg>
);

export const FanIcon = ({ size, color, angle = 0 }: { size: number; color: string; angle?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill={color}>
    <g transform={`rotate(${angle} 24 24)`}>
      {[0, 120, 240].map((r) => (
        <path key={r} transform={`rotate(${r} 24 24)`} d="M24 21C21 13 23 5 30 6C35 8 32 16 26 21Z" />
      ))}
    </g>
    <circle cx="24" cy="24" r="4" />
  </svg>
);

export const BoltIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill={color}>
    <path d="M27 4L9 28H22L19 44L39 18H26Z" />
  </svg>
);

export const GlobeIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round">
    <circle cx="24" cy="24" r="18" />
    <path d="M6 24H42M24 6C30 12 30 36 24 42M24 6C18 12 18 36 24 42" />
  </svg>
);

export const ChartIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 40H42M10 32L20 22L27 28L40 12M32 12H40V20" />
  </svg>
);

export const TrophyIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 6H34V18A10 10 0 0 1 14 18Z M14 10H6C6 18 10 21 14 21M34 10H42C42 18 38 21 34 21M24 28V36M16 42H32" />
  </svg>
);
