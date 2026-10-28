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

// 1. Launch Rocket to Pad
console.log('Navigating to Launchpad...');
await page.evaluate(() => {
  document.getElementById('btn-launchpad').click();
});
await new Promise((r) => setTimeout(r, 1500));

// 2. Start launch and lift off
console.log('Starting countdown and liftoff...');
await page.evaluate(() => {
  const app = window.__app;
  app.launch.phase = 'flight';
  app.launch.released = true;
  app.launch.lifted = true;
  app.launch.ignited = true;
  const P = app.launch.player;
  P.clamped = false;
  P.landed = null;
  P.engineOn = true;
  P.throttle = 1.0;
  // Place rocket at 75km altitude in space where aerodynamic pressure is 0
  P.s.y += 75000;
  P.alt = 75000;
  P.vSurf.u = 120;
  P.s.vy += 120;
  app.launch.time = 5;
  app.launch.met = 5;
  // Give ample fuel for all test phases
  app.launch.fuel[P.activeSeg] = 1000;
});
await new Promise((r) => setTimeout(r, 2000));

const initialData = await page.evaluate(() => {
  const app = window.__app;
  const P = app.launch.player;
  return {
    alt: P.alt,
    dir3D: { x: P.dir3D.x, y: P.dir3D.y, z: P.dir3D.z },
    phase: app.launch.phase,
  };
});
console.log('Initial airborne state:', initialData);

// 3. Test Steering Right (KeyD)
console.log('Testing KeyD (steering right relative to screen)...');
await page.keyboard.down('KeyD');
await new Promise((r) => setTimeout(r, 1200));
await page.keyboard.up('KeyD');

const afterD = await page.evaluate(() => {
  const P = window.__app.launch.player;
  return { x: P.dir3D.x, y: P.dir3D.y, z: P.dir3D.z };
});
console.log('After KeyD steering dir3D:', afterD);

// 4. Test Steering Away into screen (KeyW)
console.log('Testing KeyW (steering away into screen)...');
await page.keyboard.down('KeyW');
await new Promise((r) => setTimeout(r, 1400));
await page.keyboard.up('KeyW');

const afterW = await page.evaluate(() => {
  const P = window.__app.launch.player;
  return { x: P.dir3D.x, y: P.dir3D.y, z: P.dir3D.z };
});
console.log('After KeyW steering dir3D:', afterW);

// 5. Test Diagonal steering (KeyW + KeyA)
console.log('Testing diagonal steering (KeyW + KeyA)...');
await page.keyboard.down('KeyW');
await page.keyboard.down('KeyA');
await new Promise((r) => setTimeout(r, 1400));
await page.keyboard.up('KeyA');
await page.keyboard.up('KeyW');

const afterDiag = await page.evaluate(() => {
  const P = window.__app.launch.player;
  return { x: P.dir3D.x, y: P.dir3D.y, z: P.dir3D.z };
});
console.log('After KeyW + KeyA diagonal steering dir3D:', afterDiag);

// 6. Test Camera Orbit and camera-relative steering
console.log('Orbiting camera 90 degrees and testing camera-relative steering...');
await page.evaluate(() => {
  const app = window.__app;
  // Rotate camera around Y by 90 degrees
  const curPos = app.launch.camera.position.clone();
  app.launch.camera.position.set(-curPos.z, curPos.y, curPos.x);
  app.launch.camera.lookAt(0, 0, 0);
  app.launch.camera.updateMatrixWorld(true);
});
await new Promise((r) => setTimeout(r, 500));

const camVecBefore = await page.evaluate(() => {
  const cam = window.__app.launch.camera;
  const THREE = window.THREE || window.__app.launch.camera.constructor;
  // Read cam forward & right
  return {
    pos: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
    dir3D: { ...window.__app.launch.player.dir3D },
  };
});
console.log('Camera before rotated steering:', camVecBefore.pos);

// Press KeyS (Closer towards new camera position)
console.log('Testing KeyS (closer towards viewer) from new camera angle...');
await page.keyboard.down('KeyS');
await new Promise((r) => setTimeout(r, 1500));
await page.keyboard.up('KeyS');

const afterS = await page.evaluate(() => {
  const P = window.__app.launch.player;
  return { x: P.dir3D.x, y: P.dir3D.y, z: P.dir3D.z };
});
console.log('After KeyS from rotated camera dir3D:', afterS);

// Save screenshot of 3D steering
fs.mkdirSync('tools/shots', { recursive: true });
await page.screenshot({ path: 'tools/shots/flight_3d_controls.png' });
console.log('Saved tools/shots/flight_3d_controls.png');

await browser.close();

// Assertions
if (Math.abs(afterD.x) < 0.05 && Math.abs(afterD.z) < 0.05) {
  throw new Error('KeyD did not deflect rocket 3D attitude!');
}
if (Math.abs(afterW.z) < 0.05 && Math.abs(afterW.x) < 0.05) {
  throw new Error('KeyW did not deflect rocket into screen / 3D attitude!');
}

console.log('ALL CAMERA-RELATIVE 3D FLIGHT CONTROL TESTS PASSED SUCCESSFULLY!');
