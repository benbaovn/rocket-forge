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

// Select small rocket preset
console.log('Selecting Nhỏ gọn preset...');
await page.evaluate(() => {
  const sel = document.getElementById('preset');
  sel.value = 'Nhỏ gọn';
  sel.dispatchEvent(new Event('change'));
});
await new Promise((r) => setTimeout(r, 1000));

// Select top part (nose cone)
console.log('Selecting nose cone part...');
await page.evaluate(() => {
  window.__app.build.select({ index: 0, attach: null });
});
await new Promise((r) => setTimeout(r, 500));

// Check angle readout
let angles = await page.evaluate(() => document.getElementById('sel-angles').textContent);
console.log('Initial angles:', angles);
if (angles !== 'X: 0° · Y: 0° · Z: 0°') throw new Error('Initial angle expected 0, got ' + angles);

// Click X rotation button
console.log('Clicking Rotate X button...');
await page.evaluate(() => {
  document.getElementById('btn-rot-x').click();
});
await new Promise((r) => setTimeout(r, 500));
angles = await page.evaluate(() => document.getElementById('sel-angles').textContent);
console.log('After Rotate X:', angles);
if (!angles.includes('X: 90°')) throw new Error('Expected X: 90°, got ' + angles);

// Click Y rotation button
console.log('Clicking Rotate Y button...');
await page.evaluate(() => {
  document.getElementById('btn-rot-y').click();
});
await new Promise((r) => setTimeout(r, 500));
angles = await page.evaluate(() => document.getElementById('sel-angles').textContent);
console.log('After Rotate Y:', angles);
if (!angles.includes('Y: 90°')) throw new Error('Expected Y: 90°, got ' + angles);

// Click Z rotation button on Quick-Rot bar
console.log('Clicking Rotate Z button on Quick-Rot bar...');
await page.evaluate(() => {
  document.getElementById('bar-rot-z').click();
});
await new Promise((r) => setTimeout(r, 500));
angles = await page.evaluate(() => document.getElementById('sel-angles').textContent);
console.log('After Rotate Z:', angles);
if (!angles.includes('Z: 90°')) throw new Error('Expected Z: 90°, got ' + angles);

// Capture screenshot with rotated part & UI visible
await page.screenshot({ path: 'tools/shots/vab_rotation.png' });
console.log('Saved vab_rotation.png');

// Test Reset button
console.log('Testing Reset button...');
await page.evaluate(() => {
  document.getElementById('btn-rot-reset').click();
});
await new Promise((r) => setTimeout(r, 500));
angles = await page.evaluate(() => document.getElementById('sel-angles').textContent);
console.log('After Reset:', angles);
if (angles !== 'X: 0° · Y: 0° · Z: 0°') throw new Error('Expected X: 0° · Y: 0° · Z: 0°, got ' + angles);

// Test keyboard shortcut '1' for X, '2' for Y, '3' for Z
console.log('Testing keyboard shortcut 1 (Rotate X)...');
await page.keyboard.press('Digit1');
await new Promise((r) => setTimeout(r, 500));
angles = await page.evaluate(() => document.getElementById('sel-angles').textContent);
console.log('After key 1:', angles);
if (!angles.includes('X: 90°')) throw new Error('Keyboard shortcut 1 failed: ' + angles);

await browser.close();
console.log('All 3D rotation tests passed successfully!');
