import fs from 'fs';
import puppeteer from 'puppeteer-core';

const [, , query = '', out = 'shot.png', wait = '6000', evalJs = ''] = process.argv;

const chromeCandidates = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const chromePath = chromeCandidates.find((p) => {
  try { return fs.existsSync(p); } catch { return false; }
}) || chromeCandidates[0];

const browserArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--enable-gpu',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
  '--window-size=1600,900',
];
if (process.platform === 'win32') browserArgs.push('--use-angle=d3d11');

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: browserArgs,
  defaultViewport: { width: 1600, height: 900 },
});
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); if (m.type() === 'error') m.args().forEach(async (a) => { try { errors.push('  >> ' + await a.evaluate((e) => (e && e.stack) || String(e))); } catch {} }); });
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
await page.goto('http://localhost:5173/' + query, { waitUntil: 'load' });
await page.waitForFunction('window.__app', { timeout: 90000 }).catch(() => errors.push('[timeout] app never initialised'));
await new Promise((r) => setTimeout(r, +wait));
if (evalJs) {
  const steps = evalJs.split('||');
  for (const s of steps) {
    const m = s.match(/^wait:(\d+)$/);
    if (m) { await new Promise((r) => setTimeout(r, +m[1])); continue; }
    const shot = s.match(/^shot:(.+)$/);
    if (shot) { await page.screenshot({ path: shot[1] }); continue; }
    try { const r = await page.evaluate(s); if (r !== undefined) console.log('eval:', JSON.stringify(r)); } catch (e) { errors.push('[eval] ' + e.message); }
  }
}
const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else res(n); }; requestAnimationFrame(f); }));
const gpu = await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); if (!gl) return 'no-gl'; const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; }).catch((e) => 'gpu-probe-failed');
await page.screenshot({ path: out });
console.log('GPU:', gpu, '| FPS:', fps);
console.log(errors.slice(0, 30).join('\n') || 'no console errors');
await browser.close();
