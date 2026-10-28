import { Ease } from './easing';
import { rng } from './random';
import { DURATION_S, FPS } from './timing';

/**
 * Procedural SFX — 100% Web Audio API, no sample files.
 * The same graph builders run on a live AudioContext (playback) and an
 * OfflineAudioContext (MP4 export), so audio is sample-accurate to frames.
 */
export type SfxType =
  | 'whoosh'
  | 'tick'
  | 'chime'
  | 'impact'
  | 'click'
  | 'pop'
  | 'riser'
  | 'motor'
  | 'kick'
  | 'hat'
  | 'sub'
  | 'chord'
  | 'pad';

export interface Cue {
  frame: number;
  type: SfxType;
  gain?: number;
  pitch?: number;
  /** seconds — used by sustained sounds (whoosh, riser, motor, chord, pad, sub) */
  dur?: number;
  pan?: number;
}

type Reg = AudioScheduledSourceNode[] | null;

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();
function noiseBuffer(ctx: BaseAudioContext) {
  let buf = noiseCache.get(ctx);
  if (!buf) {
    const r = rng(1410);
    buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
    noiseCache.set(ctx, buf);
  }
  return buf;
}

function noiseSrc(ctx: BaseAudioContext, t: number, len: number, reg: Reg) {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuffer(ctx);
  s.loop = true;
  s.start(t, (t * 7.31) % 1.5);
  s.stop(t + len + 0.05);
  reg?.push(s);
  return s;
}

function osc(ctx: BaseAudioContext, type: OscillatorType, freq: number, t: number, len: number, reg: Reg) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.start(t);
  o.stop(t + len + 0.05);
  reg?.push(o);
  return o;
}

/** Output stage with gain + stereo position. */
function voice(ctx: BaseAudioContext, dest: AudioNode, pan = 0) {
  const g = ctx.createGain();
  g.gain.value = 0;
  if (pan !== 0 && 'createStereoPanner' in ctx) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    g.connect(p).connect(dest);
  } else g.connect(dest);
  return g;
}

function perc(param: AudioParam, t: number, attack: number, peak: number, decay: number) {
  param.setValueAtTime(0.0001, t);
  param.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

export function scheduleCue(
  ctx: BaseAudioContext,
  dest: AudioNode,
  cue: Cue,
  t: number,
  reg: Reg = null,
  offset = 0,
) {
  const G = cue.gain ?? 1;
  const P = cue.pitch ?? 1;
  switch (cue.type) {
    case 'whoosh': {
      const d = cue.dur ?? 0.5;
      const src = noiseSrc(ctx, t, d, reg);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 1.1;
      bp.frequency.setValueAtTime(260 * P, t);
      bp.frequency.exponentialRampToValueAtTime(3400 * P, t + d * 0.6);
      bp.frequency.exponentialRampToValueAtTime(600 * P, t + d);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.55 * G, t + d * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      const pan = ctx.createStereoPanner();
      pan.pan.setValueAtTime(-0.7, t);
      pan.pan.linearRampToValueAtTime(0.7, t + d);
      src.connect(bp).connect(g).connect(pan).connect(dest);
      break;
    }
    case 'tick': {
      const v = voice(ctx, dest, cue.pan ?? 0);
      const o = osc(ctx, 'triangle', 2300 * P, t, 0.06, reg);
      const o2 = osc(ctx, 'sine', 1150 * P, t, 0.06, reg);
      o.connect(v);
      o2.connect(v);
      perc(v.gain, t, 0.002, 0.16 * G, 0.04);
      break;
    }
    case 'chime': {
      const d = cue.dur ?? 1.4;
      const base = 880 * P;
      const partials: [number, number][] = [
        [1, 1],
        [2, 0.42],
        [3.01, 0.2],
        [4.18, 0.09],
      ];
      for (const [mul, amp] of partials) {
        const v = voice(ctx, dest, cue.pan ?? 0);
        osc(ctx, 'sine', base * mul, t, d, reg).connect(v);
        perc(v.gain, t, 0.004, 0.16 * G * amp, d / mul ** 0.35);
      }
      break;
    }
    case 'impact': {
      const v = voice(ctx, dest);
      const o = osc(ctx, 'sine', 150, t, 0.6, reg);
      o.frequency.exponentialRampToValueAtTime(36, t + 0.38);
      o.connect(v);
      perc(v.gain, t, 0.004, 0.95 * G, 0.55);
      const nv = voice(ctx, dest);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2400, t);
      lp.frequency.exponentialRampToValueAtTime(200, t + 0.25);
      noiseSrc(ctx, t, 0.3, reg).connect(lp).connect(nv);
      perc(nv.gain, t, 0.002, 0.45 * G, 0.22);
      break;
    }
    case 'click': {
      for (const [dt, amp] of [
        [0, 1],
        [0.075, 0.55],
      ] as const) {
        const v = voice(ctx, dest, cue.pan ?? 0.15);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2600;
        noiseSrc(ctx, t + dt, 0.03, reg).connect(hp).connect(v);
        perc(v.gain, t + dt, 0.001, 0.5 * G * amp, 0.016);
        const ov = voice(ctx, dest);
        osc(ctx, 'square', 1700 * P, t + dt, 0.03, reg).connect(ov);
        perc(ov.gain, t + dt, 0.001, 0.05 * G * amp, 0.02);
      }
      break;
    }
    case 'pop': {
      const v = voice(ctx, dest, cue.pan ?? 0);
      const o = osc(ctx, 'sine', 320 * P, t, 0.2, reg);
      o.frequency.exponentialRampToValueAtTime(1000 * P, t + 0.06);
      o.connect(v);
      perc(v.gain, t, 0.003, 0.42 * G, 0.13);
      break;
    }
    case 'riser': {
      const d = cue.dur ?? 1;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 2;
      bp.frequency.setValueAtTime(300, t);
      bp.frequency.exponentialRampToValueAtTime(7000, t + d);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4 * G, t + d);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.06);
      noiseSrc(ctx, t, d + 0.1, reg).connect(bp).connect(g).connect(dest);
      break;
    }
    case 'motor': {
      // Frequency curve uses the exact easing of the on-screen RPM counter.
      const d = cue.dur ?? 1.6;
      const N = 128;
      const curve = new Float32Array(N);
      for (let i = 0; i < N; i++) curve[i] = 45 + 1150 * P * Ease.motor(i / (N - 1));
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(500, t);
      lp.frequency.exponentialRampToValueAtTime(6000, t + d);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13 * G, t + 0.25);
      g.gain.setValueAtTime(0.13 * G, t + d);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.7);
      const o1 = osc(ctx, 'sawtooth', 45, t, d + 0.8, reg);
      const o2 = osc(ctx, 'sine', 90, t, d + 0.8, reg);
      o1.frequency.setValueCurveAtTime(curve, t, d);
      o2.frequency.setValueCurveAtTime(curve.map((x) => x * 2.01), t, d);
      o1.connect(lp);
      o2.connect(lp);
      lp.connect(g).connect(dest);
      break;
    }
    case 'kick': {
      const v = voice(ctx, dest);
      const o = osc(ctx, 'sine', 165, t, 0.4, reg);
      o.frequency.exponentialRampToValueAtTime(46, t + 0.11);
      o.connect(v);
      perc(v.gain, t, 0.002, 0.5 * G, 0.3);
      break;
    }
    case 'hat': {
      const v = voice(ctx, dest, cue.pan ?? 0.25);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 8000;
      noiseSrc(ctx, t, 0.06, reg).connect(hp).connect(v);
      perc(v.gain, t, 0.001, 0.09 * G, 0.04);
      break;
    }
    case 'sub': {
      const d = cue.dur ?? 1.4;
      const v = voice(ctx, dest);
      const o = osc(ctx, 'sine', 62, t, d, reg);
      o.frequency.exponentialRampToValueAtTime(33, t + d);
      o.connect(v);
      perc(v.gain, t, 0.01, 0.7 * G, d);
      break;
    }
    case 'chord': {
      const d = cue.dur ?? 2.4;
      const notes = [130.81, 196.0, 261.63, 329.63, 392.0, 493.88, 587.33]; // Cmaj9 spread
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(600, t);
      lp.frequency.exponentialRampToValueAtTime(3800, t + 0.35);
      lp.frequency.exponentialRampToValueAtTime(700, t + d);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11 * G, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      lp.connect(g).connect(dest);
      notes.forEach((n, i) => {
        for (const det of [-6, 6]) {
          const o = osc(ctx, 'sawtooth', n * P, t, d, reg);
          o.detune.value = det + i;
          o.connect(lp);
        }
      });
      break;
    }
    case 'pad': {
      const total = cue.dur ?? DURATION_S;
      const d = total - offset;
      if (d <= 0.1) break;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      const lfo = osc(ctx, 'sine', 0.18, t, d, reg);
      const lfoAmt = ctx.createGain();
      lfoAmt.gain.value = 160;
      lfo.connect(lfoAmt).connect(lp.frequency);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05 * G, t + Math.min(1.2, d / 2));
      g.gain.setValueAtTime(0.05 * G, t + Math.max(0, d - 1.4));
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      lp.connect(g).connect(dest);
      for (const [f, det] of [
        [55, -7],
        [55, 7],
        [82.41, -4],
        [110, 5],
      ] as const) {
        const o = osc(ctx, 'sawtooth', f * P, t, d, reg);
        o.detune.value = det;
        o.connect(lp);
      }
      break;
    }
  }
}

function masterChain(ctx: BaseAudioContext, out: AudioNode) {
  const input = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 8;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.2;
  input.connect(comp).connect(out);
  return input;
}

const SUSTAINED: SfxType[] = ['pad'];

/** Live, gesture-unlocked playback with precise look-ahead scheduling. */
export class LiveAudio {
  ctx: AudioContext | null = null;
  private vol: GainNode | null = null;
  private bus: GainNode | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  muted = false;

  private ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext({ latencyHint: 'interactive' });
      this.vol = this.ctx.createGain();
      this.vol.gain.value = this.muted ? 0 : 0.9;
      this.vol.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  /** Schedules every cue from `fromFrame`. Returns the A/V latency (ms) visuals should wait. */
  start(fromFrame: number, cues: Cue[]): number {
    const ctx = this.ensure();
    void ctx.resume();
    this.stop();
    const bus = masterChain(ctx, this.vol!);
    this.bus = bus;
    const lead = 0.04;
    const t0 = ctx.currentTime + lead;
    for (const c of cues) {
      if (c.frame >= fromFrame) {
        scheduleCue(ctx, bus, c, t0 + (c.frame - fromFrame) / FPS, this.sources);
      } else if (SUSTAINED.includes(c.type)) {
        const elapsed = (fromFrame - c.frame) / FPS;
        scheduleCue(ctx, bus, c, t0, this.sources, elapsed);
      }
    }
    return (lead + (ctx.outputLatency || ctx.baseLatency || 0)) * 1000;
  }

  stop() {
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    this.sources = [];
    if (this.bus) {
      this.bus.disconnect();
      this.bus = null;
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.vol && this.ctx) this.vol.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.02);
  }
}

/** Offline mixdown of the full 30 s soundtrack (used by export + "Unduh WAV"). */
export async function renderSoundtrack(cues: Cue[], sampleRate = 48000): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.ceil(sampleRate * DURATION_S), sampleRate);
  const bus = masterChain(ctx, ctx.destination);
  for (const c of cues) scheduleCue(ctx, bus, c, c.frame / FPS);
  return ctx.startRendering();
}

export function encodeWav(buf: AudioBuffer): ArrayBuffer {
  const ch = buf.numberOfChannels;
  const len = buf.length;
  const out = new ArrayBuffer(44 + len * ch * 2);
  const v = new DataView(out);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + len * ch * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, ch, true);
  v.setUint32(24, buf.sampleRate, true);
  v.setUint32(28, buf.sampleRate * ch * 2, true);
  v.setUint16(32, ch * 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, len * ch * 2, true);
  const chans = Array.from({ length: ch }, (_, i) => buf.getChannelData(i));
  let o = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return out;
}
