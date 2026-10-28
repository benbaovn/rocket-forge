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
await new Promise((r) => setTimeout(r, 1500));

// 1. Select F-22 plane preset
console.log('Selecting F-22 plane preset...');
await page.evaluate(() => {
  const sel = document.getElementById('preset');
  sel.value = 'Tiêm kích phản lực F-22';
  sel.dispatchEvent(new Event('change'));
});
await new Promise((r) => setTimeout(r, 1500));

// 2. Launch Plane
console.log('Launching Plane to runway...');
await page.evaluate(() => {
  document.getElementById('btn-launchpad').click();
});
await new Promise((r) => setTimeout(r, 1500));

// 3. Accelerate and take off
console.log('Accelerating and taking off...');
await page.keyboard.down('KeyS');
await new Promise((r) => setTimeout(r, 5000));
await page.keyboard.up('KeyS');

const flightStatus = await page.evaluate(() => {
  const P = window.__app.launch.player;
  return {
    alt: P.alt,
    speed: P.vSurf ? Math.hypot(P.vSurf.e, P.vSurf.u) : 0,
    heading: P.heading,
    bank: P.bank,
    vz: P.s.vz,
    z: P.s.z,
  };
});
console.log('Airborne status before turning:', flightStatus);

// 4. Test Turning Right (Hold KeyD + KeyS)
console.log('Testing turn right (holding KeyD)...');
await page.keyboard.down('KeyD');
await new Promise((r) => setTimeout(r, 2000));
await page.keyboard.up('KeyD');

const statusAfterD = await page.evaluate(() => {
  const P = window.__app.launch.player;
  return {
    heading: P.heading,
    bank: P.bank,
    vz: P.s.vz,
    z: P.s.z,
  };
});
console.log('Status after turn right (KeyD):', statusAfterD);

// 5. Test Turning Left (Hold KeyA)
console.log('Testing turn left (holding KeyA)...');
await page.keyboard.down('KeyA');
await new Promise((r) => setTimeout(r, 2500));
await page.keyboard.up('KeyA');

const statusAfterA = await page.evaluate(() => {
  const P = window.__app.launch.player;
  return {
    heading: P.heading,
    bank: P.bank,
    vz: P.s.vz,
    z: P.s.z,
  };
});
console.log('Status after turn left (KeyA):', statusAfterA);

// Screenshot
fs.mkdirSync('tools/shots', { recursive: true });
await page.screenshot({ path: 'tools/shots/plane_turning.png' });
console.log('Saved tools/shots/plane_turning.png');

await browser.close();

// Assertions
if (Math.abs(statusAfterD.heading) < 0.1) {
  throw new Error(`Airplane heading did not turn with KeyD! (heading=${statusAfterD.heading})`);
}
if (Math.abs(statusAfterD.vz) < 1.0 && Math.abs(statusAfterD.z) < 1.0) {
  throw new Error(`Airplane 3D velocity/position did not turn with KeyD! (vz=${statusAfterD.vz}, z=${statusAfterD.z})`);
}

console.log('PLANE 3D TURNING AND HEADING TEST PASSED WITH FLYING COLORS!');
