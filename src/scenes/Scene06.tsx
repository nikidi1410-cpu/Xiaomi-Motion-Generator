import { C, FONT_MONO, NUM, rgba } from '../assets/palette';
import { Cursor, FanIcon, SU7 } from '../assets/svg';
import type { Cue } from '../engine/audio';
import { clamp, Ease, lerp, spring } from '../engine/easing';
import { SAFE_RECT } from '../engine/timing';
import { CONTENT_W, Eyebrow, type SceneModule, type SceneProps } from './common';

/* S6 · 18.0–21.0s · HyperOS UI mockup — cursor activates SU7 cabin pre-cooling (21,5 °C) */

const PHONE = { x: 240, y: 410, w: 600, h: 1060 };
const BEZEL = 14;
const SCR = { x: PHONE.x + BEZEL, y: PHONE.y + BEZEL, w: PHONE.w - BEZEL * 2, h: PHONE.h - BEZEL * 2 };
const BTN = { x: 36, y: 836, w: SCR.w - 72, h: 118 }; // screen-local
const BTN_CX = SCR.x + BTN.x + BTN.w / 2;
const BTN_CY = SCR.y + BTN.y + BTN.h / 2;

const MOVE0 = 24;
const MOVE1 = 62;
const CLICK = 66;
const ACTIVE = 70;
const COOL0 = 78;
const COOL1 = 148;
const TOAST = 150;
const EXIT = 166;
const T_FROM = 34.0;
const T_TO = 21.5;

const tempAt = (f: number) => T_FROM - (T_FROM - T_TO) * Ease.inOutCubic(clamp((f - COOL0) / (COOL1 - COOL0)));
const fmtTemp = (t: number) => t.toFixed(1).replace('.', ',');

function cursorPos(f: number) {
  const t = Ease.inOutCubic(clamp((f - MOVE0) / (MOVE1 - MOVE0)));
  // quadratic bezier from bottom-right → button
  const p0 = { x: 930, y: 1470 };
  const p1 = { x: 940, y: 1250 };
  const p2 = { x: BTN_CX + 90, y: BTN_CY + 6 };
  let x = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
  let y = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
  const away = Ease.inOutCubic(clamp((f - 96) / 34));
  x += away * 120;
  y += away * 150;
  return { x, y };
}

function Component({ f }: SceneProps) {
  const hOp = Ease.outCubic(clamp((f - 2) / 18));
  const ph = spring(f - 2, { stiffness: 120, damping: 15 });
  const ex = Ease.inCubic(clamp((f - EXIT) / 14));
  const on = Ease.outCubic(clamp((f - ACTIVE) / 14));
  const cool = clamp((f - COOL0) / (COOL1 - COOL0));
  const temp = f < COOL0 ? T_FROM : tempAt(f);
  const pressed = f >= CLICK && f < CLICK + 7 ? 1 : 0;
  const btnScale = f >= CLICK ? 0.95 + 0.05 * spring(f - CLICK - 4, { stiffness: 400, damping: 16 }) : 1;
  const cur = cursorPos(f);
  const curOp = clamp((f - MOVE0) / 8) * (1 - clamp((f - 112) / 18));
  const toast = f >= TOAST ? spring(f - TOAST, { stiffness: 220, damping: 16 }) : 0;
  const carGlow = lerp(0.35, 1, on);
  const glowColor = cool > 0.05 ? C.cyan : C.orange;

  return (
    <div className="abs" style={{ inset: 0, opacity: 1 - ex, transform: `scale(${1 - ex * 0.08})` }}>
      <Eyebrow y={300} op={hOp}>
        HYPEROS × XIAOMI SU7
      </Eyebrow>
      <div className="abs" style={{ left: SAFE_RECT.x0, width: CONTENT_W, top: 338, fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em', opacity: hOp }}>
        Kabin sejuk sebelum Anda tiba.
      </div>

      {/* ambient cool glow behind phone */}
      <div
        className="abs"
        data-audit-ignore
        style={{
          left: 540 - 600,
          top: 940 - 600,
          width: 1200,
          height: 1200,
          background: `radial-gradient(circle, ${rgba(C.cyan, 0.35)} 0%, transparent 60%)`,
          opacity: on * 0.9,
        }}
      />

      {/* phone */}
      <div
        className="abs"
        style={{
          left: PHONE.x,
          top: PHONE.y,
          width: PHONE.w,
          height: PHONE.h,
          borderRadius: 84,
          background: 'linear-gradient(150deg, #3A4152, #12151C 40%, #2A303D)',
          boxShadow: `0 60px 120px rgba(0,0,0,0.6), 0 0 0 2px #454D60, 0 0 80px ${rgba(glowColor, 0.15 + on * 0.2)}`,
          transform: `perspective(1600px) translateY(${(1 - ph) * 260}px) rotateX(${(1 - ph) * 24}deg)`,
          opacity: clamp(ph * 1.5),
        }}
      >
        <div
          className="abs"
          style={{ left: BEZEL, top: BEZEL, width: SCR.w, height: SCR.h, borderRadius: 70, background: '#090B10', overflow: 'hidden' }}
        >
          {/* status bar */}
          <div className="abs mono" style={{ left: 50, top: 26, fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700 }}>
            09:41
          </div>
          <div className="abs" style={{ left: SCR.w / 2 - 13, top: 24, width: 26, height: 26, borderRadius: 13, background: '#000', border: '2px solid #1C2130' }} />
          <div className="abs" style={{ right: 50, top: 30, display: 'flex', gap: 4, alignItems: 'flex-end' }}>
            {[8, 12, 16, 20].map((h) => (
              <div key={h} style={{ width: 5, height: h, borderRadius: 2, background: '#fff' }} />
            ))}
            <div style={{ marginLeft: 10, width: 38, height: 20, borderRadius: 6, border: '2px solid #fff', padding: 2 }}>
              <div style={{ width: '80%', height: '100%', borderRadius: 3, background: '#3DDC84' }} />
            </div>
          </div>

          {/* app header */}
          <div className="abs" style={{ left: 40, top: 86 }}>
            <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em' }}>Xiaomi SU7</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 22, fontWeight: 600, color: C.cyan }}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: C.cyan, boxShadow: `0 0 10px ${C.cyan}` }} />
              Terhubung via HyperOS
            </div>
          </div>

          {/* car card */}
          <div
            className="abs"
            style={{
              left: 28,
              top: 196,
              width: SCR.w - 56,
              height: 236,
              borderRadius: 36,
              background: `radial-gradient(ellipse at 50% 85%, ${rgba(glowColor, 0.2 + on * 0.18)}, #12151D 70%)`,
              border: '1.5px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}
          >
            {/* cool airflow streaks */}
            {on > 0 &&
              Array.from({ length: 7 }, (_, k) => {
                const t = ((f - ACTIVE) / 40 + k / 7) % 1;
                return (
                  <div
                    key={k}
                    className="abs"
                    data-audit-ignore
                    style={{
                      left: -120 + t * 640,
                      top: 40 + ((k * 37) % 120),
                      width: 120,
                      height: 3,
                      borderRadius: 2,
                      background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`,
                      opacity: Math.sin(Math.PI * t) * on * 0.8,
                    }}
                  />
                );
              })}
            <div className="abs" style={{ left: (SCR.w - 56 - 470) / 2, top: 70 }}>
              <SU7 width={470} glow={glowColor} glowAmt={carGlow} lights={on} />
            </div>
          </div>

          {/* chips */}
          <div className="abs" style={{ left: 28, top: 452, display: 'flex', gap: 12 }}>
            {['Baterai 82%', 'Jarak 640 km', 'Terkunci'].map((t) => (
              <div
                key={t}
                style={{
                  padding: '12px 18px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.08)',
                  fontFamily: FONT_MONO,
                  fontSize: 19,
                  fontWeight: 500,
                  color: C.white,
                }}
              >
                {t}
              </div>
            ))}
          </div>

          {/* climate card */}
          <div
            className="abs"
            style={{
              left: 28,
              top: 530,
              width: SCR.w - 56,
              height: 280,
              borderRadius: 36,
              padding: '30px 34px',
              background: 'linear-gradient(160deg, #171B25, #10131A)',
              border: `1.5px solid ${on > 0 ? rgba(C.cyan, 0.2 + on * 0.35) : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: C.muted }}>Suhu kabin</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 20, color: on ? C.cyan : C.muted }}>TARGET 21,5°C</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <div
                className="mono"
                style={{
                  ...NUM,
                  fontSize: 120,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.1,
                  color: cool > 0.98 ? C.cyan : C.white,
                  textShadow: cool > 0.98 ? `0 0 40px ${rgba(C.cyan, 0.6)}` : undefined,
                }}
              >
                {fmtTemp(temp)}
                <span style={{ fontSize: 48, color: C.muted }}>°C</span>
              </div>
              <div style={{ opacity: 0.35 + on * 0.65 }}>
                <FanIcon size={84} color={on > 0 ? C.cyan : '#4A5366'} angle={on > 0 ? (f - ACTIVE) ** 1.35 * 2.2 : 0} />
              </div>
            </div>
            <div style={{ marginTop: 18, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 5,
                  background: `linear-gradient(90deg, ${C.orange}, ${C.cyan})`,
                  transformOrigin: 'left',
                  transform: `scaleX(${1 - cool * 0.62})`,
                }}
              />
            </div>
          </div>

          {/* activation button */}
          <div
            className="abs"
            style={{
              left: BTN.x,
              top: BTN.y,
              width: BTN.w,
              height: BTN.h,
              borderRadius: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              fontSize: 34,
              fontWeight: 800,
              background: on > 0.5 ? rgba(C.cyan, 0.14) : C.orange,
              color: on > 0.5 ? C.cyan : C.obsidian,
              border: `2.5px solid ${on > 0.5 ? C.cyan : C.orange}`,
              boxShadow: on > 0.5 ? `0 0 50px ${rgba(C.cyan, 0.45)}` : `0 0 50px ${rgba(C.orange, 0.5)}`,
              transform: `scale(${btnScale})`,
              overflow: 'hidden',
            }}
          >
            {on > 0.5 && <FanIcon size={40} color={C.cyan} angle={(f - ACTIVE) * 9} />}
            {on > 0.5 ? 'Pre-cooling Aktif' : 'Aktifkan Pre-cooling'}
            {f >= CLICK && (
              <div
                className="abs"
                data-audit-ignore
                style={{
                  left: BTN.w / 2 + 90 - 200,
                  top: BTN.h / 2 - 200,
                  width: 400,
                  height: 400,
                  borderRadius: '50%',
                  background: rgba(C.white, 0.35),
                  transform: `scale(${Ease.outExpo(clamp((f - CLICK) / 26))})`,
                  opacity: 1 - clamp((f - CLICK) / 26),
                }}
              />
            )}
          </div>

          <div className="abs" style={{ left: SCR.w / 2 - 80, top: SCR.h - 30, width: 160, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.6)' }} />

          {/* toast */}
          {toast > 0 && (
            <div
              className="abs"
              style={{
                left: 28,
                top: 20,
                width: SCR.w - 56,
                height: 96,
                borderRadius: 34,
                padding: '0 26px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                background: 'rgba(28,33,48,0.96)',
                border: `1.5px solid ${rgba(C.cyan, 0.5)}`,
                boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 40px ${rgba(C.cyan, 0.3)}`,
                transform: `translateY(${(1 - toast) * -140}px)`,
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 16, background: C.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.obsidian} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5L10 17L19 7" />
                </svg>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>
                Kabin siap · <span className="mono" style={{ fontFamily: FONT_MONO, color: C.cyan }}>21,5°C</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* tap ripple ring (stage space) */}
      {f >= CLICK && f < CLICK + 30 && (
        <div
          className="abs"
          data-audit-ignore
          style={{
            left: BTN_CX + 90 - 60,
            top: BTN_CY + 6 - 60,
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: `4px solid ${C.white}`,
            transform: `scale(${0.3 + Ease.outExpo(clamp((f - CLICK) / 30)) * 1.4})`,
            opacity: 1 - clamp((f - CLICK) / 30),
          }}
        />
      )}
      {/* cursor */}
      {curOp > 0 && (
        <div className="abs" data-audit-ignore style={{ left: cur.x - 3, top: cur.y - 3, opacity: curOp, filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.5))' }}>
          <Cursor size={52} pressed={pressed} />
        </div>
      )}
    </div>
  );
}

/* one tick per whole degree the cabin drops */
const tempTicks: Cue[] = [];
{
  let last = Math.floor(T_FROM);
  for (let f = COOL0; f <= COOL1; f++) {
    const d = Math.floor(tempAt(f));
    if (d < last) {
      tempTicks.push({ frame: f, type: 'tick', pitch: 1.5 - (d - 21) * 0.04, gain: 0.7 });
      last = d;
    }
  }
}

const cues: Cue[] = [
  { frame: 4, type: 'pop', pitch: 0.7, gain: 0.6 },
  { frame: CLICK, type: 'click', gain: 1 },
  { frame: ACTIVE, type: 'pop', pitch: 1.4, gain: 0.6 },
  { frame: ACTIVE + 2, type: 'whoosh', dur: 0.9, pitch: 1.6, gain: 0.35 },
  ...tempTicks,
  { frame: TOAST, type: 'chime', pitch: 1.5, gain: 0.8, dur: 1.2 },
  { frame: TOAST + 6, type: 'chime', pitch: 2, gain: 0.45, dur: 1 },
];

export const Scene06: SceneModule = { Component, cues };
