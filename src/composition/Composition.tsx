import type { Cue } from '../engine/audio';
import { SCENES, sceneIndexAt, TOTAL_FRAMES } from '../engine/timing';
import type { SceneModule } from '../scenes/common';
import { Scene01 } from '../scenes/Scene01';
import { Scene02 } from '../scenes/Scene02';
import { Scene03 } from '../scenes/Scene03';
import { Scene04 } from '../scenes/Scene04';
import { Scene05 } from '../scenes/Scene05';
import { Scene06 } from '../scenes/Scene06';
import { Scene07 } from '../scenes/Scene07';
import { Scene08 } from '../scenes/Scene08';
import { Scene09 } from '../scenes/Scene09';
import { Scene10 } from '../scenes/Scene10';
import { Background, HUD, MotionBlurDefs, SafeOverlay, TransitionFX } from './Layers';

export const SCENE_MODULES: SceneModule[] = [Scene01, Scene02, Scene03, Scene04, Scene05, Scene06, Scene07, Scene08, Scene09, Scene10];

/** Full soundtrack: per-scene SFX (offset to global frames) + transition whooshes + music bed. */
export function buildCues(): Cue[] {
  const out: Cue[] = [];
  SCENE_MODULES.forEach((m, i) => {
    for (const c of m.cues) out.push({ ...c, frame: c.frame + SCENES[i].start });
  });
  // transition whoosh peaks right on every cut
  for (const s of SCENES.slice(1)) out.push({ frame: s.start - 15, type: 'whoosh', dur: 0.42, gain: 0.55 });
  // music bed: 120 BPM four-on-the-floor from the logo hit until the finale
  out.push({ frame: 0, type: 'pad', dur: 30, gain: 1 });
  for (let f = SCENES[1].start; f < SCENES[9].start; f += 30) {
    out.push({ frame: f, type: 'kick', gain: 0.55 });
    out.push({ frame: f + 15, type: 'hat', gain: 0.8 });
  }
  return out.filter((c) => c.frame >= 0 && c.frame < TOTAL_FRAMES).sort((a, b) => a.frame - b.frame);
}

export function Composition({ frame, showSafe = false }: { frame: number; showSafe?: boolean }) {
  const idx = sceneIndexAt(frame);
  const S = SCENES[idx];
  const Scene = SCENE_MODULES[idx].Component;
  return (
    <div className="stage" id="stage">
      <MotionBlurDefs />
      <Background frame={frame} />
      <div className="abs" style={{ inset: 0 }} data-scene={S.id}>
        <Scene f={frame - S.start} dur={S.end - S.start} />
      </div>
      <TransitionFX frame={frame} />
      <HUD frame={frame} />
      {showSafe && <SafeOverlay />}
    </div>
  );
}
