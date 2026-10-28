import { useEffect, useState } from 'react';
import { createAutomation } from './automation';
import { Composition } from './composition/Composition';

/** `?render` — bare 1080×1920 stage at 1:1, driven only by window.__xiaomi.seek(). */
export default function RenderView() {
  const params = new URLSearchParams(location.search);
  const [frame, setFrame] = useState(Number(params.get('frame') ?? 0));
  const safe = params.has('safe');

  useEffect(() => {
    document.body.style.background = '#0D0F14';
    window.__xiaomi = createAutomation(setFrame, () => document.getElementById('stage'));
  }, []);

  return <Composition frame={frame} showSafe={safe} />;
}
