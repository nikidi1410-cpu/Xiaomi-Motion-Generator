/**
 * Autonomous QA loop:
 *  1. safe-margin audit over every scene
 *  2. per-frame render benchmark (all 1.800 frames)
 *  3. WCAG contrast table
 *  4. realtime playback probe (rAF cadence in the real player)
 *  5. keyframe screenshots → qa-out/
 */
import fs from 'node:fs';
import path from 'node:path';
import { BASE, launch, openStage } from './browser.mjs';

const OUT = path.resolve('qa-out');
fs.mkdirSync(OUT, { recursive: true });
const shots = (process.env.SHOTS ?? '60,110,175,250,330,420,560,700,790,860,950,1040,1150,1220,1320,1420,1500,1560,1620,1650,1730,1785')
  .split(',')
  .map(Number);

const browser = await launch();
try {
  const { page, fontsOk } = await openStage(browser);
  console.log(`fonts loaded: ${fontsOk}`);

  const audit = await page.evaluate(() => window.__xiaomi.auditAll(4));
  const report = (title, list) => {
    console.log(`\n[${title}] ${list.length} violations`);
    const grouped = new Map();
    for (const v of list) {
      if (!grouped.has(v.text)) grouped.set(v.text, []);
      grouped.get(v.text).push(v);
    }
    for (const [k, vs] of grouped) console.log(`  "${k}" ×${vs.length} e.g. f${vs[0].frame} [${vs[0].x0},${vs[0].y0} → ${vs[0].x1},${vs[0].y1}] op=${vs[0].opacity}`);
  };
  console.log(`\n[AUDIT] ${audit.checked} frame samples`);
  report('SAFE ZONE (settled holds)', audit.violations);
  report('FRAME 1080x1920 (all frames)', audit.frameViolations);

  const bench = await page.evaluate(() => window.__xiaomi.bench());
  console.log(`\n[BENCH] ${JSON.stringify(bench)}`);

  const contrast = await page.evaluate(() => window.__xiaomi.contrast());
  console.log('\n[CONTRAST]');
  for (const r of contrast) console.log(`  ${r.pass ? 'PASS' : 'FAIL'} ${r.ratio.toFixed(2).padStart(6)}:1  ${r.name}`);

  for (const f of shots) {
    await page.evaluate((x) => window.__xiaomi.seek(x), f);
    await page.screenshot({ path: path.join(OUT, `f${String(f).padStart(4, '0')}.png`) });
  }
  console.log(`\n[SHOTS] ${shots.length} → ${OUT}`);
  await page.close();

  // realtime probe in the actual player UI
  const p2 = await browser.newPage();
  await p2.setViewport({ width: 1400, height: 1000 });
  await p2.goto(BASE, { waitUntil: 'networkidle0' });
  await p2.evaluate(() => window.__xiaomi.ready());
  await p2.keyboard.press('Space');
  const probe = await p2.evaluate(
    () =>
      new Promise((res) => {
        const gaps = [];
        let last = 0;
        const t0 = performance.now();
        const loop = (now) => {
          if (last) gaps.push(now - last);
          last = now;
          if (now - t0 < 6000) requestAnimationFrame(loop);
          else {
            gaps.sort((a, b) => a - b);
            res({ samples: gaps.length, p50: +gaps[Math.floor(gaps.length / 2)].toFixed(2), p99: +gaps[Math.floor(gaps.length * 0.99)].toFixed(2), long: gaps.filter((g) => g > 26).length });
          }
        };
        requestAnimationFrame(loop);
      }),
  );
  console.log(`\n[REALTIME 6s] rAF gaps ${JSON.stringify(probe)}`);
  await p2.screenshot({ path: path.join(OUT, 'player-ui.png') });

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ fontsOk, audit, bench, contrast, probe }, null, 2));
} finally {
  await browser.close();
}
