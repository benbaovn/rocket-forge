import fs from 'fs';
import puppeteer from 'puppeteer-core';

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

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--enable-gpu',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--window-size=1600,900',
    '--use-angle=d3d11',
  ],
  defaultViewport: { width: 1600, height: 900 },
});

const page = await browser.newPage();
page.on('console', (m) => {
  if (m.type() === 'error') console.log('[browser error]', m.text());
});

console.log('Navigating to http://localhost:5173/ ...');
await page.goto('http://localhost:5173/', { waitUntil: 'load' });
await page.waitForFunction('window.__app', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 2000));

// 1. Select F-22 preset in VAB
console.log('Selecting F-22 plane preset...');
await page.evaluate(() => {
  const sel = document.getElementById('preset');
  sel.value = 'Tiêm kích phản lực F-22';
  sel.dispatchEvent(new Event('change'));
});
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'tools/shots/vab_plane.png' });
console.log('Saved vab_plane.png');

// 2. Launch Plane
console.log('Launching Plane to runway...');
await page.evaluate(() => {
  document.getElementById('btn-launchpad').click();
});
await new Promise((r) => setTimeout(r, 2000));
await page.screenshot({ path: 'tools/shots/runway_plane.png' });
console.log('Saved runway_plane.png');

// 3. Accelerate and take off by holding KeyS (pitch up)
console.log('Full throttle acceleration and pitch up rotation...');
await page.keyboard.down('KeyS');
await new Promise((r) => setTimeout(r, 6000));

const status = await page.evaluate(() => {
  const app = window.__app;
  const P = app.launch.player;
  return {
    alt: P.alt,
    speed: P.vSurf ? Math.hypot(P.vSurf.e, P.vSurf.u) : 0,
    landed: !!P.landed,
    isPlane: P.isPlane,
    crashed: P.crashed,
    resultHidden: document.getElementById('result').classList.contains('hidden'),
  };
});

console.log('Flight status:', status);
await page.screenshot({ path: 'tools/shots/flight_plane.png' });
console.log('Saved flight_plane.png');
await page.keyboard.up('KeyS');

await browser.close();

if (status.crashed) {
  throw new Error('Plane crashed on takeoff!');
}
if (!status.resultHidden) {
  throw new Error('Result modal prematurely appeared!');
}
if (status.alt < 5) {
  throw new Error(`Plane did not achieve altitude (alt=${status.alt})!`);
}

console.log('Plane flight test passed with flying colors!');
