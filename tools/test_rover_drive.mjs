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

console.log('Selecting Rover 4x4 preset...');
await page.evaluate(() => {
  const sel = document.getElementById('preset');
  sel.value = 'Xe địa hình Rover 4x4';
  sel.dispatchEvent(new Event('change'));
});
await new Promise((r) => setTimeout(r, 1000));

console.log('Launching Rover to pad...');
await page.evaluate(() => {
  document.getElementById('btn-launchpad').click();
});
await new Promise((r) => setTimeout(r, 1500));

const startState = await page.evaluate(() => {
  const P = window.__app.launch.player;
  return {
    sx: P.sx,
    z: P.s.z || 0,
    heading: P.heading || 0,
    rotY: P.root.rotation.y,
    camX: window.__app.launch.camera.position.x,
  };
});
console.log('Initial Rover state:', startState);

// 1. Test W (forward)
console.log('Testing KeyW (forward)...');
await page.keyboard.down('KeyW');
await new Promise((r) => setTimeout(r, 1500));
await page.keyboard.up('KeyW');

const afterW = await page.evaluate(() => {
  const P = window.__app.launch.player;
  return { sx: P.sx, z: P.s.z || 0, groundSpeed: P.groundSpeed, heading: P.heading || 0 };
});
console.log('After KeyW:', afterW);
if (afterW.sx <= startState.sx + 5) {
  throw new Error(`Expected KeyW to drive forward (+sx), got sx=${afterW.sx}`);
}

// 2. Test S (brake & reverse)
console.log('Testing KeyS (reverse)...');
await page.keyboard.down('KeyS');
await new Promise((r) => setTimeout(r, 2500));
await page.keyboard.up('KeyS');

const afterS = await page.evaluate(() => {
  const P = window.__app.launch.player;
  return { sx: P.sx, z: P.s.z || 0, groundSpeed: P.groundSpeed, heading: P.heading || 0 };
});
console.log('After KeyS:', afterS);
if (afterS.groundSpeed >= 0 || afterS.sx >= afterW.sx) {
  throw new Error(`Expected KeyS to reverse, got groundSpeed=${afterS.groundSpeed}, sx=${afterS.sx}`);
}

// Reset speed to 0 and test D alone (turn right & move)
await page.evaluate(() => {
  const P = window.__app.launch.player;
  P.groundSpeed = 0;
  P.heading = 0;
});

console.log('Testing KeyD alone (turn right & roll)...');
await page.keyboard.down('KeyD');
await new Promise((r) => setTimeout(r, 1500));
await page.keyboard.up('KeyD');

const afterD = await page.evaluate(() => {
  const P = window.__app.launch.player;
  return { sx: P.sx, z: P.s.z || 0, groundSpeed: P.groundSpeed, heading: P.heading || 0 };
});
console.log('After KeyD:', afterD);
if (afterD.heading >= -0.3 || afterD.groundSpeed <= 1 || afterD.z <= 1) {
  throw new Error(`Expected KeyD to turn right (heading < 0, z > 0) and move, got ${JSON.stringify(afterD)}`);
}

// Test A alone (turn left & move)
console.log('Testing KeyA alone (turn left & roll)...');
await page.keyboard.down('KeyA');
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: 'tools/shots/rover_driving.png' });
await page.keyboard.up('KeyA');

const afterA = await page.evaluate(() => {
  const P = window.__app.launch.player;
  return { sx: P.sx, z: P.s.z || 0, groundSpeed: P.groundSpeed, heading: P.heading || 0 };
});
console.log('After KeyA:', afterA);
if (afterA.heading <= 0.3 || afterA.groundSpeed <= 1) {
  throw new Error(`Expected KeyA to turn left (heading > 0) and move, got ${JSON.stringify(afterA)}`);
}

await browser.close();
console.log('ROVER 3D DRIVING & STEERING TEST PASSED WITH FLYING COLORS!');
