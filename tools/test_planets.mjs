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
  defaultViewport: { width: 1600, height: 900 },
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--enable-gpu',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--window-size=1600,900',
    '--use-angle=d3d11',
  ],
});

const page = await browser.newPage();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (msg) => {
  if (msg.type() === 'error' && !msg.text().includes('404')) errors.push(msg.text());
});

await page.goto('http://localhost:5173/', { waitUntil: 'load' });
await page.waitForFunction('window.__app', { timeout: 30000 });
await wait(1200);

// Click launchpad button to enter LaunchScene
await page.evaluate(() => {
  document.getElementById('btn-launchpad').click();
});
await wait(1200);

// Open Map View (M)
await page.keyboard.press('KeyM');
await wait(800);

// Check Sun, Planets, Moon, Phobos, Deimos
const mapCheck = await page.evaluate(() => {
  const sc = window.__app.launch;
  const map = sc.map;
  return {
    hasSunSphere: !!sc.sunSphere,
    planetsInFlight: Object.keys(sc.planets || {}),
    planetsInMap: Object.keys(map.planetGroups || {}),
    focusButtons: Array.from(document.querySelectorAll('.map-fbtn')).map((b) => b.dataset.focus),
    moonParentIsEarth: map.moonOrbitRing.parent === map.earthGroup,
    issParentIsEarth: map.issOrbitRing.parent === map.earthGroup,
  };
});
console.log('Solar System Hierarchy check:', mapCheck);

if (
  !mapCheck.hasSunSphere ||
  !mapCheck.planetsInFlight.includes('phobos') ||
  !mapCheck.planetsInFlight.includes('deimos') ||
  !mapCheck.moonParentIsEarth ||
  !mapCheck.issParentIsEarth
) {
  throw new Error('Missing Sun or Phobos/Deimos or hierarchy mismatch!');
}

// 1. Focus on Sun and take full Solar System screenshot
await page.click('.map-fbtn[data-focus="sun"]');
await wait(800);
await page.screenshot({ path: 'tools/shots/solar_system_map.png' });

// 2. Focus on Mars to see Mars + Phobos + Deimos orbiting Mars
await page.click('.map-fbtn[data-focus="mars"]');
await wait(800);
await page.screenshot({ path: 'tools/shots/mars_phobos_deimos_map.png' });

// 3. Focus on Earth to see Earth + ISS + Moon orbiting Earth
await page.click('.map-fbtn[data-focus="earth"]');
await wait(700);
await page.evaluate(() => {
  const map = window.__app.launch.map;
  map.camera.position.set(map.earthGroup.position.x, 14000, map.earthGroup.position.z + 20000);
  map.controls.update();
});
await wait(600);
await page.screenshot({ path: 'tools/shots/earth_moon_iss_map.png' });

if (errors.length > 0) {
  console.error('Errors:', errors);
  process.exit(1);
}

console.log('SUN, PLANETS, MOON, PHOBOS & DEIMOS VERIFIED SUCCESSFULLY!');
await browser.close();
