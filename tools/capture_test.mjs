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

// 1. Select Rover preset in VAB
console.log('Selecting Rover preset...');
await page.evaluate(() => {
  const sel = document.getElementById('preset');
  sel.value = 'Xe địa hình Rover 4x4';
  sel.dispatchEvent(new Event('change'));
});
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'tools/shots/vab_rover.png' });
console.log('Saved vab_rover.png');

// 2. Launch Rover
console.log('Launching Rover to pad/surface...');
await page.evaluate(() => {
  document.getElementById('btn-launchpad').click();
});
await new Promise((r) => setTimeout(r, 2000));

// Drive Rover with W key for 12 seconds (testing past the old 8s threshold)
console.log('Driving Rover for 12 seconds...');
await page.keyboard.down('KeyW');
await new Promise((r) => setTimeout(r, 12000));
const resultHidden = await page.evaluate(() => document.getElementById('result').classList.contains('hidden'));
console.log('Is result popup hidden after 12s of driving?', resultHidden);
if (!resultHidden) throw new Error('Result failure modal erroneously popped up while driving!');
await page.screenshot({ path: 'tools/shots/launch_rover_long.png' });
console.log('Saved launch_rover_long.png');
await page.keyboard.up('KeyW');

// 3. Return to VAB and select Boat preset
console.log('Returning to VAB...');
await page.evaluate(() => {
  window.__app.goBuild();
});
await new Promise((r) => setTimeout(r, 1500));

console.log('Selecting Boat preset...');
await page.evaluate(() => {
  const sel = document.getElementById('preset');
  sel.value = 'Canô lướt sóng siêu tốc';
  sel.dispatchEvent(new Event('change'));
});
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'tools/shots/vab_boat.png' });
console.log('Saved vab_boat.png');

// 4. Launch Boat to sea
console.log('Launching Boat to sea...');
await page.evaluate(() => {
  document.getElementById('btn-launchpad').click();
});
await new Promise((r) => setTimeout(r, 2500));

// Cruise Boat with W key / throttle
console.log('Cruising boat...');
await page.keyboard.down('KeyW');
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: 'tools/shots/launch_boat.png' });
console.log('Saved launch_boat.png');
await page.keyboard.up('KeyW');

await browser.close();
console.log('All screenshots captured successfully!');
