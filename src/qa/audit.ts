import { C } from '../assets/palette';
import { HEIGHT, SAFE_RECT, WIDTH } from '../engine/timing';

/* ------------------------------------------------------------------ */
/* Safe-margin audit: every visible text glyph must sit inside SAFE   */
/* ------------------------------------------------------------------ */
export interface SafeViolation {
  frame: number;
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  opacity: number;
}

function effectiveOpacity(el: Element | null, stage: Element): number {
  let o = 1;
  while (el && el !== stage) {
    const cs = getComputedStyle(el);
    o *= parseFloat(cs.opacity || '1');
    if (cs.visibility === 'hidden' || cs.display === 'none') return 0;
    if (o < 0.01) return 0;
    el = el.parentElement;
  }
  return o;
}

export interface Bounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
export const FRAME_RECT: Bounds = { x0: 0, y0: 0, x1: WIDTH, y1: HEIGHT };

/** Visible part of a client rect after every overflow-clipping ancestor (odometer columns, cards…). */
function clipToAncestors(r: DOMRect, el: Element | null, stage: Element) {
  let { left, top, right, bottom } = r;
  while (el && el !== stage) {
    const cs = getComputedStyle(el);
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
      const c = el.getBoundingClientRect();
      left = Math.max(left, c.left);
      top = Math.max(top, c.top);
      right = Math.min(right, c.right);
      bottom = Math.min(bottom, c.bottom);
      if (right <= left || bottom <= top) return null;
    }
    el = el.parentElement;
  }
  return { left, top, right, bottom };
}

export function auditSafeArea(stage: HTMLElement, frame: number, bounds: Bounds = SAFE_RECT, minOpacity = 0.35): SafeViolation[] {
  const sr = stage.getBoundingClientRect();
  const k = sr.width / WIDTH;
  const out: SafeViolation[] = [];
  const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const txt = n.textContent?.trim();
    if (!txt) continue;
    const parent = n.parentElement;
    if (!parent || parent.closest('[data-audit-ignore]')) continue;
    const op = effectiveOpacity(parent, stage);
    if (op < minOpacity) continue;
    range.selectNodeContents(n);
    const raw = range.getBoundingClientRect();
    if (raw.width === 0 || raw.height === 0) continue;
    const r = clipToAncestors(raw, parent, stage);
    if (!r) continue;
    const x0 = (r.left - sr.left) / k;
    const x1 = (r.right - sr.left) / k;
    // glyph boxes include line-height leading; shrink vertically to the ink-ish area
    const pad = ((r.bottom - r.top) / k) * 0.12;
    const y0 = (r.top - sr.top) / k + pad;
    const y1 = (r.bottom - sr.top) / k - pad;
    const tol = 1;
    if (x0 < bounds.x0 - tol || x1 > bounds.x1 + tol || y0 < bounds.y0 - tol || y1 > bounds.y1 + tol) {
      out.push({ frame, text: txt.slice(0, 40), x0: Math.round(x0), y0: Math.round(y0), x1: Math.round(x1), y1: Math.round(y1), opacity: +op.toFixed(2) });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* WCAG 2.1 contrast for every text/background pairing used           */
/* ------------------------------------------------------------------ */
const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const blend = (fg: number[], bg: number[], a: number) => fg.map((c, i) => c * a + bg[i] * (1 - a));
const lum = (rgb: number[]) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: number[], b: number[]) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

export interface ContrastRow {
  name: string;
  fg: string;
  bg: string;
  ratio: number;
  /** "large" = ≥ 24px regular / ≥ 18.7px bold (AA needs 3:1), else 4.5:1 */
  large: boolean;
  pass: boolean;
}

export function contrastReport(): ContrastRow[] {
  const ob = hex(C.obsidian);
  const panel = hex(C.panel);
  const rows: [string, number[], number[], boolean, string, string][] = [
    ['Teks putih / Obsidian', hex(C.white), ob, false, C.white, C.obsidian],
    ['Teks muted 72% / Obsidian', blend(hex(C.white), ob, 0.72), ob, false, 'white·72%', C.obsidian],
    ['Xiaomi Orange / Obsidian', hex(C.orange), ob, false, C.orange, C.obsidian],
    ['SU7 Cyan / Obsidian', hex(C.cyan), ob, false, C.cyan, C.obsidian],
    ['Teks putih / Panel', hex(C.white), panel, false, C.white, C.panel],
    ['Muted 72% / Panel', blend(hex(C.white), panel, 0.72), panel, false, 'white·72%', C.panel],
    ['Obsidian / Orange (CTA, tombol)', ob, hex(C.orange), false, C.obsidian, C.orange],
    ['Obsidian / Cyan (badge)', ob, hex(C.cyan), false, C.obsidian, C.cyan],
    ['Obsidian / Hijau (NET ZERO)', ob, hex('#3DDC84'), false, C.obsidian, '#3DDC84'],
    ['Cyan / tombol aktif (cyan 14%)', hex(C.cyan), blend(hex(C.cyan), hex('#090B10'), 0.14), false, C.cyan, 'cyan·14%'],
    ['Orange / panel oranye 10%', hex(C.white), blend(hex(C.orange), ob, 0.1), false, C.white, 'orange·10%'],
    ['(ditolak) Putih / Orange', hex(C.white), hex(C.orange), true, C.white, C.orange],
  ];
  return rows.map(([name, fg, bg, large, fgS, bgS]) => {
    const ratio = contrast(fg, bg);
    return { name, fg: fgS, bg: bgS, ratio: +ratio.toFixed(2), large, pass: ratio >= (large ? 3 : 4.5) };
  });
}
