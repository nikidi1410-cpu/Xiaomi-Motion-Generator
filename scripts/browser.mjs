import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

export const BASE = process.env.APP_URL ?? 'http://localhost:5173';

export async function launch() {
  const executablePath = CANDIDATES.find((p) => fs.existsSync(p));
  if (!executablePath) throw new Error('Chrome/Edge tidak ditemukan. Set CHROME_PATH.');
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--hide-scrollbars', '--force-device-scale-factor=1', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling'],
  });
}

/** Opens the bare 1:1 render stage and waits for fonts + automation API. */
export async function openStage(browser, query = '') {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  page.on('console', (m) => m.type() === 'error' && console.error('[console]', m.text()));
  await page.goto(`${BASE}/?render${query}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !!window.__xiaomi);
  const fontsOk = await page.evaluate(() => window.__xiaomi.ready());
  return { page, fontsOk };
}
