import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { XiaomiLogo } from './assets/svg';
import { createAutomation, type Automation } from './automation';
import { buildCues, Composition } from './composition/Composition';
import { LiveAudio } from './engine/audio';
import { FPS, fmtTime, HEIGHT, SCENES, sceneIndexAt, TOTAL_FRAMES, WIDTH } from './engine/timing';
import { contrastReport, type SafeViolation } from './qa/audit';

type Bench = ReturnType<Automation['bench']>;

export default function App() {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [muted, setMuted] = useState(false);
  const [safe, setSafe] = useState(false);
  const [scale, setScale] = useState(0.4);
  const [perf, setPerf] = useState({ fps: 0, dropped: 0, renderMs: 0 });
  const [bench, setBench] = useState<Bench | null>(null);
  const [audit, setAudit] = useState<{ checked: number; violations: SafeViolation[]; frameViolations: SafeViolation[] } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const audio = useMemo(() => new LiveAudio(), []);
  const cues = useMemo(() => buildCues(), []);
  const frameRef = useRef(0);
  frameRef.current = frame;
  const loopRef = useRef(loop);
  loopRef.current = loop;
  const clock = useRef({ t: 0, f: 0, lat: 0 });
  const stats = useRef({ frames: 0, dropped: 0, lastNow: 0, setAt: 0, renderMs: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<Automation | null>(null);

  const startClock = useCallback(
    (from: number) => {
      let lat = 0;
      try {
        lat = audio.start(from, cues);
      } catch {
        lat = 0;
      }
      clock.current = { t: performance.now(), f: from, lat };
    },
    [audio, cues],
  );

  const play = useCallback(() => {
    const from = frameRef.current >= TOTAL_FRAMES - 1 ? 0 : frameRef.current;
    if (from !== frameRef.current) setFrame(from);
    startClock(from);
    stats.current.lastNow = 0;
    setPlaying(true);
  }, [startClock]);

  const pause = useCallback(() => {
    audio.stop();
    setPlaying(false);
  }, [audio]);

  const seek = useCallback(
    (f: number) => {
      const c = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(f)));
      setFrame(c);
      if (playing) startClock(c);
    },
    [playing, startClock],
  );

  /* realtime clock: wall time → frame (audio is scheduled against the same origin) */
  useEffect(() => {
    if (!playing) return;
    let id = 0;
    const tick = (now: number) => {
      const s = stats.current;
      if (s.lastNow && now - s.lastNow > (1000 / 60) * 1.6) s.dropped++;
      s.lastNow = now;
      const { t, f: f0, lat } = clock.current;
      let f = f0 + (Math.max(0, now - t - lat) * FPS) / 1000;
      if (f >= TOTAL_FRAMES) {
        if (loopRef.current) {
          startClock(0);
          f = 0;
        } else {
          setFrame(TOTAL_FRAMES - 1);
          pause();
          return;
        }
      }
      const fi = Math.floor(f);
      if (fi !== frameRef.current) {
        s.setAt = performance.now();
        s.frames++;
        setFrame(fi);
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, pause, startClock]);

  useLayoutEffect(() => {
    const s = stats.current;
    if (s.setAt) s.renderMs = s.renderMs * 0.9 + (performance.now() - s.setAt) * 0.1;
  }, [frame]);

  /* perf HUD refresh (2×/s, never per frame) */
  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const s = stats.current;
      setPerf({ fps: Math.round((s.frames * 1000) / (now - last)), dropped: s.dropped, renderMs: +s.renderMs.toFixed(2) });
      s.frames = 0;
      last = now;
    }, 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => audio.setMuted(muted), [muted, audio]);

  /* fit 1080×1920 stage into the available box */
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setScale(Math.min(width / WIDTH, height / HEIGHT));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    autoRef.current = createAutomation(setFrame, () => document.getElementById('stage'));
    window.__xiaomi = autoRef.current;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (playing) pause();
        else play();
      } else if (e.code === 'ArrowRight') seek(frameRef.current + (e.shiftKey ? 10 : 1));
      else if (e.code === 'ArrowLeft') seek(frameRef.current - (e.shiftKey ? 10 : 1));
      else if (e.code === 'Home') seek(0);
      else if (e.key === 's') setSafe((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, play, pause, seek]);

  const runTool = async (name: string, fn: () => void | Promise<void>) => {
    pause();
    setBusy(name);
    await new Promise((r) => setTimeout(r, 30));
    const keep = frameRef.current;
    try {
      await fn();
    } finally {
      autoRef.current?.seek(keep);
      setBusy(null);
    }
  };

  const downloadWav = () =>
    runTool('wav', async () => {
      const blob = await autoRef.current!.wavBlob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'xiaomi-motion-soundtrack.wav';
      a.click();
    });

  const idx = sceneIndexAt(frame);
  const stage = useMemo(() => <Composition frame={frame} showSafe={safe} />, [frame, safe]);
  const contrastRows = useMemo(() => contrastReport(), []);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#07080b] text-white">
      {/* stage */}
      <div ref={boxRef} className="relative flex min-w-0 flex-1 items-center justify-center p-4">
        <div
          className="relative overflow-hidden rounded-[18px] shadow-[0_30px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
          style={{ width: WIDTH * scale, height: HEIGHT * scale }}
          onClick={() => (playing ? pause() : play())}
        >
          <div style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})`, transformOrigin: '0 0' }}>{stage}</div>
          {!playing && frame === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <div className="flex items-center gap-3 rounded-full bg-xi-orange px-6 py-3 font-bold text-xi-obsidian shadow-[0_0_40px_rgba(255,105,0,0.6)]">
                <PlayIcon /> Putar (Spasi)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* control panel */}
      <aside className="flex w-[400px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-white/10 bg-[#0d0f14] p-5">
        <header className="flex items-center gap-3">
          <XiaomiLogo size={38} />
          <div>
            <h1 className="text-[17px] leading-tight font-extrabold">Xiaomi Motion Generator</h1>
            <p className="font-mono text-[11px] text-white/55">Human × Car × Home · Inovasi untuk Semua Orang</p>
          </div>
        </header>
        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
          {['1080×1920', '9:16', '60 FPS', '30 detik', '1.800 frame'].map((t) => (
            <span key={t} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-white/75">
              {t}
            </span>
          ))}
        </div>

        {/* transport */}
        <section className="rounded-xl border border-white/10 bg-xi-panel p-3">
          <div className="mb-2 flex items-baseline justify-between font-mono">
            <span className="text-2xl font-bold tabular-nums">{fmtTime(frame)}</span>
            <span className="text-xs text-white/55 tabular-nums">
              f {String(frame).padStart(4, '0')} / {TOTAL_FRAMES}
            </span>
          </div>
          <Scrubber frame={frame} onSeek={seek} />
          <div className="mt-3 flex items-center gap-2">
            <button
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-xi-orange font-bold text-xi-obsidian hover:brightness-110"
              onClick={() => (playing ? pause() : play())}
            >
              {playing ? <PauseIcon /> : <PlayIcon />} {playing ? 'Jeda' : 'Putar'}
            </button>
            <Btn onClick={() => seek(0)} title="Ke awal (Home)">⏮</Btn>
            <Btn onClick={() => seek(frame - 1)} title="Mundur 1 frame (←)">‹</Btn>
            <Btn onClick={() => seek(frame + 1)} title="Maju 1 frame (→)">›</Btn>
          </div>
          <div className="mt-2 flex gap-2 text-xs">
            <Toggle on={loop} onClick={() => setLoop((v) => !v)} label="Loop" />
            <Toggle on={!muted} onClick={() => setMuted((v) => !v)} label={muted ? 'SFX mati' : 'SFX nyala'} />
            <Toggle on={safe} onClick={() => setSafe((v) => !v)} label="Safe zone (S)" />
          </div>
        </section>

        {/* scenes */}
        <section className="rounded-xl border border-white/10 bg-xi-panel p-2">
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => seek(s.start)}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[13px] ${i === idx ? 'bg-xi-orange/15 text-white' : 'text-white/70 hover:bg-white/5'}`}
            >
              <span className={`font-mono text-[11px] ${i === idx ? 'text-xi-orange' : 'text-white/45'}`}>{String(s.id).padStart(2, '0')}</span>
              <span className="flex-1 font-semibold">{s.name}</span>
              <span className="font-mono text-[11px] text-white/45">
                {(s.start / FPS).toFixed(1)}–{(s.end / FPS).toFixed(1)}s
              </span>
            </button>
          ))}
        </section>

        {/* QA */}
        <section className="rounded-xl border border-white/10 bg-xi-panel p-3 text-[13px]">
          <h2 className="mb-2 font-mono text-[11px] font-bold tracking-[0.2em] text-xi-orange">QUALITY ASSURANCE</h2>
          <div className="grid grid-cols-3 gap-2 font-mono">
            <Stat label="FPS live" value={playing ? String(perf.fps) : '–'} ok={!playing || perf.fps >= 58} />
            <Stat label="Drop vsync" value={String(perf.dropped)} ok={perf.dropped < 3} />
            <Stat label="Render" value={`${perf.renderMs}ms`} ok={perf.renderMs < 8} />
          </div>
          <div className="mt-3 flex gap-2">
            <Btn wide onClick={() => runTool('bench', () => setBench(autoRef.current!.bench()))}>
              {busy === 'bench' ? 'Mengukur…' : 'Benchmark'}
            </Btn>
            <Btn wide onClick={() => runTool('audit', () => setAudit(autoRef.current!.auditAll(6)))}>
              {busy === 'audit' ? 'Memeriksa…' : 'Audit safe margin'}
            </Btn>
          </div>
          {bench && (
            <p className={`mt-2 font-mono text-[12px] ${bench.p95 < 16.6 ? 'text-emerald-400' : 'text-amber-400'}`}>
              p50 {bench.p50}ms · p95 {bench.p95}ms · max {bench.max}ms (f{bench.worstFrame}) · {bench.over16} frame &gt;16,6ms
            </p>
          )}
          {audit && (
            <div className="mt-2 font-mono text-[12px]">
              <p className={audit.violations.length ? 'text-amber-400' : 'text-emerald-400'}>
                {audit.violations.length ? `⚠ ${audit.violations.length} di luar safe zone` : '✓ Safe zone bersih'} · {audit.frameViolations.length ? `⚠ ${audit.frameViolations.length} keluar frame` : '✓ tak ada teks keluar frame'} · {audit.checked} sampel
              </p>
              {[...audit.violations, ...audit.frameViolations].slice(0, 8).map((v, i) => (
                <button key={i} onClick={() => seek(v.frame)} className="block text-left text-white/70 hover:text-white">
                  f{v.frame} “{v.text}” [{v.x0},{v.y0}→{v.x1},{v.y1}]
                </button>
              ))}
            </div>
          )}
          <table className="mt-3 w-full font-mono text-[11px]">
            <tbody>
              {contrastRows.map((r) => (
                <tr key={r.name} className="border-t border-white/5">
                  <td className="py-1 pr-2 text-white/70">{r.name}</td>
                  <td className="py-1 text-right tabular-nums">{r.ratio}:1</td>
                  <td className={`py-1 pl-2 text-right ${r.pass ? 'text-emerald-400' : 'text-rose-400'}`}>{r.pass ? 'AA ✓' : 'tidak dipakai'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* export */}
        <section className="rounded-xl border border-white/10 bg-xi-panel p-3 text-[13px]">
          <h2 className="mb-2 font-mono text-[11px] font-bold tracking-[0.2em] text-xi-orange">EKSPOR</h2>
          <Btn wide onClick={downloadWav}>
            {busy === 'wav' ? 'Merender audio…' : 'Unduh soundtrack WAV (48 kHz)'}
          </Btn>
          <p className="mt-2 text-white/60">
            MP4 1080×1920 @60fps (frame-perfect + audio):
            <code className="mt-1 block rounded bg-black/40 px-2 py-1 font-mono text-[12px] text-xi-cyan">npm run render</code>
          </p>
        </section>
        <p className="font-mono text-[10px] leading-relaxed text-white/40">Spasi putar/jeda · ←/→ 1 frame · Shift 10 frame · S safe zone</p>
      </aside>
    </div>
  );
}

function Scrubber({ frame, onSeek }: { frame: number; onSeek: (f: number) => void }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 flex h-1.5 -translate-y-1/2 gap-[2px] overflow-hidden rounded-full">
        {SCENES.map((s) => {
          const w = ((s.end - s.start) / TOTAL_FRAMES) * 100;
          const fill = Math.min(1, Math.max(0, (frame - s.start) / (s.end - s.start)));
          return (
            <div key={s.id} className="relative h-full bg-white/15" style={{ width: `${w}%` }}>
              <div className="absolute inset-y-0 left-0 bg-xi-orange" style={{ width: `${fill * 100}%` }} />
            </div>
          );
        })}
      </div>
      <input
        type="range"
        className="scrub relative w-full"
        min={0}
        max={TOTAL_FRAMES - 1}
        value={frame}
        onChange={(e) => onSeek(Number(e.target.value))}
      />
    </div>
  );
}

function Btn({ children, onClick, title, wide }: { children: ReactNode; onClick: () => void; title?: string; wide?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-semibold hover:bg-white/10 ${wide ? 'flex-1' : 'w-10'}`}
    >
      {children}
    </button>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md border px-2 py-1.5 font-semibold ${on ? 'border-xi-cyan/50 bg-xi-cyan/10 text-xi-cyan' : 'border-white/10 bg-white/5 text-white/55'}`}
    >
      {label}
    </button>
  );
}

function Stat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-lg bg-black/30 px-2 py-1.5">
      <div className="text-[10px] text-white/50">{label}</div>
      <div className={`text-base font-bold tabular-nums ${ok ? 'text-white' : 'text-amber-400'}`}>{value}</div>
    </div>
  );
}

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 2.5v11l9-5.5z" />
  </svg>
);
const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 2h3v12H4zM9 2h3v12H9z" />
  </svg>
);
