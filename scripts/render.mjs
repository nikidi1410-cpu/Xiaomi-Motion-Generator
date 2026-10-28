/**
 * Frame-perfect MP4 export: 1080×1920 @ 60 fps, H.264 + AAC.
 * Each frame is seeked deterministically (no realtime capture → zero dropped
 * frames), screenshotted, and piped into ffmpeg; the soundtrack is mixed by
 * OfflineAudioContext with the exact same cue list as live playback.
 *
 *   npm run render                 → out/xiaomi-human-car-home.mp4
 *   npm run render -- --from 0 --to 300 --out out/preview.mp4
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import ffmpegPath from 'ffmpeg-static';
import { launch, openStage } from './browser.mjs';

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const FROM = Number(arg('from', 0));
const OUT = path.resolve(arg('out', 'out/xiaomi-human-car-home.mp4'));
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const browser = await launch();
try {
  const { page, fontsOk } = await openStage(browser);
  if (!fontsOk) console.warn('⚠ Fonts not confirmed loaded — check your internet connection (Google Fonts).');
  const total = await page.evaluate(() => window.__xiaomi.totalFrames);
  const TO = Math.min(total, Number(arg('to', total)));

  console.log('♪ Rendering soundtrack (OfflineAudioContext)…');
  const wavPath = OUT.replace(/\.mp4$/, '.wav');
  fs.writeFileSync(wavPath, Buffer.from(await page.evaluate(() => window.__xiaomi.wavBase64()), 'base64'));

  const ff = spawn(
    ffmpegPath,
    [
      '-y',
      '-f', 'image2pipe',
      '-framerate', '60',
      '-c:v', 'mjpeg',
      '-i', '-',
      '-ss', String(FROM / 60),
      '-t', String((TO - FROM) / 60),
      '-i', wavPath,
      '-map', '0:v', '-map', '1:a',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '17',
      '-pix_fmt', 'yuv420p',
      '-r', '60',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      OUT,
    ],
    { stdio: ['pipe', 'ignore', 'pipe'] },
  );
  let ffErr = '';
  ff.stderr.on('data', (d) => (ffErr = (ffErr + d).slice(-4000)));
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}\n${ffErr}`)))));

  const t0 = Date.now();
  for (let f = FROM; f < TO; f++) {
    await page.evaluate((x) => window.__xiaomi.seek(x), f);
    const jpg = await page.screenshot({ type: 'jpeg', quality: 95, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
    if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - FROM) % 60 === 0) {
      const el = (Date.now() - t0) / 1000;
      const rate = (f - FROM + 1) / el;
      process.stdout.write(`\r▶ frame ${f}/${TO}  ${rate.toFixed(1)} fps  ETA ${Math.round((TO - f) / rate)}s   `);
    }
  }
  ff.stdin.end();
  await done;
  console.log(`\n✓ ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB) in ${Math.round((Date.now() - t0) / 1000)}s`);
} finally {
  await browser.close();
}
