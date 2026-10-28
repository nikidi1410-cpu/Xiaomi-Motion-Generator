export const C = {
  orange: '#FF6900', // Xiaomi Orange
  obsidian: '#0D0F14', // Obsidian Dark
  white: '#FFFFFF', // Pure White
  cyan: '#00E5FF', // SU7 Cyan
  panel: '#151922',
  panel2: '#1C2130',
  stroke: '#2A3040',
  muted: 'rgba(255,255,255,0.72)',
  dim: 'rgba(255,255,255,0.45)',
  line: 'rgba(255,255,255,0.10)',
} as const;

export const FONT_SANS = "'Plus Jakarta Sans', sans-serif";
export const FONT_MONO = "'JetBrains Mono', monospace";

/** Big counters: Jakarta tabular figures — no dotted zeros, no full-width "." gaps. */
export const NUM = {
  fontFamily: FONT_SANS,
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum" 1',
} as const;

export const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
