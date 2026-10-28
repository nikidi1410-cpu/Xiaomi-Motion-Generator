import { flushSync } from 'react-dom';
import { buildCues, SCENE_MODULES } from './composition/Composition';
import { encodeWav, renderSoundtrack } from './engine/audio';
import { SCENES, TOTAL_FRAMES } from './engine/timing';
import { auditSafeArea, contrastReport, FRAME_RECT, type SafeViolation } from './qa/audit';

/**
 * Frame-accurate automation API (used by the QA panel, scripts/qa.mjs and
 * scripts/render.mjs). `setFrame` must commit synchronously.
 */
export interface Automation {
  seek: (f: number) => void;
  auditAll: (step?: number) => { checked: number; violations: SafeViolation[]; frameViolations: SafeViolation[] };
  bench: () => { p50: number; p95: number; max: number; over16: number; worstFrame: number; frames: number };
  wavBase64: () => Promise<string>;
  wavBlob: () => Promise<Blob>;
  contrast: typeof contrastReport;
  ready: () => Promise<boolean>;
  totalFrames: number;
}

export function createAutomation(setFrame: (f: number) => void, stage: () => HTMLElement | null): Automation {
  const seek = (f: number) => flushSync(() => setFrame(Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(f)))));

  /**
   * Two-layer audit:
   *  - strict: every scene's settled "hold" window must keep all text inside SAFE
   *  - frame:  every `step`-th frame of the whole video (transitions included)
   *            must keep visible text inside the 1080×1920 canvas
   */
  const auditAll = (step = 6) => {
    const violations: SafeViolation[] = [];
    const frameViolations: SafeViolation[] = [];
    let checked = 0;
    SCENES.forEach((s, i) => {
      const [a, b] = SCENE_MODULES[i].hold ?? [12, s.end - s.start - 12];
      for (let f = s.start + a; f < s.start + b; f += step) {
        seek(f);
        const el = stage();
        if (!el) continue;
        violations.push(...auditSafeArea(el, f));
        checked++;
      }
    });
    for (let f = 0; f < TOTAL_FRAMES; f += Math.max(1, Math.round(step / 2))) {
      seek(f);
      const el = stage();
      if (!el) continue;
      frameViolations.push(...auditSafeArea(el, f, FRAME_RECT));
      checked++;
    }
    return { checked, violations, frameViolations };
  };

  const bench = () => {
    const times: number[] = [];
    let worstFrame = 0;
    let max = 0;
    for (let f = 0; f < TOTAL_FRAMES; f++) {
      const t0 = performance.now();
      seek(f);
      // force style + layout so the measurement includes them, not just React
      void stage()?.getBoundingClientRect();
      void document.body.offsetHeight;
      const dt = performance.now() - t0;
      times.push(dt);
      if (dt > max) {
        max = dt;
        worstFrame = f;
      }
    }
    const sorted = [...times].sort((a, b) => a - b);
    const q = (p: number) => +sorted[Math.floor(p * (sorted.length - 1))].toFixed(2);
    return { p50: q(0.5), p95: q(0.95), max: +max.toFixed(2), over16: times.filter((t) => t > 16.6).length, worstFrame, frames: times.length };
  };

  const wavBlob = async () => new Blob([encodeWav(await renderSoundtrack(buildCues()))], { type: 'audio/wav' });

  const wavBase64 = async () => {
    const buf = new Uint8Array(await (await wavBlob()).arrayBuffer());
    let s = '';
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(s);
  };

  const ready = async () => {
    await document.fonts.ready;
    await Promise.all([
      document.fonts.load("800 100px 'Plus Jakarta Sans'"),
      document.fonts.load("700 100px 'Plus Jakarta Sans'"),
      document.fonts.load("500 100px 'Plus Jakarta Sans'"),
      document.fonts.load("800 100px 'JetBrains Mono'"),
      document.fonts.load("700 100px 'JetBrains Mono'"),
      document.fonts.load("500 100px 'JetBrains Mono'"),
    ]);
    return document.fonts.check("800 100px 'Plus Jakarta Sans'") && document.fonts.check("800 100px 'JetBrains Mono'");
  };

  return { seek, auditAll, bench, wavBase64, wavBlob, contrast: contrastReport, ready, totalFrames: TOTAL_FRAMES };
}

declare global {
  interface Window {
    __xiaomi?: Automation;
  }
}
