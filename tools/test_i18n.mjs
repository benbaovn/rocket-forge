import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--window-size=1440,900', '--use-gl=angle', '--ignore-gpu-blocklist'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.removeItem('rf-lang'));
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#btn-settings');

  // Open settings modal
  await page.click('#btn-settings');
  await new Promise((r) => setTimeout(r, 300));

  const viState = await page.evaluate(() => ({
    settingsTitle: document.querySelector('#settings h2')?.textContent,
    btnViText: document.getElementById('btn-lang-vi')?.textContent,
    btnEnText: document.getElementById('btn-lang-en')?.textContent,
    viActive: document.getElementById('btn-lang-vi')?.classList.contains('on'),
    launchpadBtn: document.getElementById('btn-launchpad')?.textContent,
    firstPartName: document.querySelector('#part-list .pc-name')?.textContent,
  }));
  console.log('Vietnamese state:', viState);

  if (!viState.viActive || !viState.btnViText.includes('Tiếng Việt')) {
    throw new Error('Vietnamese button state incorrect');
  }

  await page.screenshot({ path: 'tools/shots/settings_vi.png' });

  // Click Button 2 (#btn-lang-en) to switch to English
  await page.click('#btn-lang-en');
  await new Promise((r) => setTimeout(r, 300));

  const enState = await page.evaluate(() => ({
    settingsTitle: document.querySelector('#settings h2')?.textContent,
    btnViText: document.getElementById('btn-lang-vi')?.textContent,
    btnEnText: document.getElementById('btn-lang-en')?.textContent,
    enActive: document.getElementById('btn-lang-en')?.classList.contains('on'),
    launchpadBtn: document.getElementById('btn-launchpad')?.textContent,
    firstPartName: document.querySelector('#part-list .pc-name')?.textContent,
  }));
  console.log('English state:', enState);

  if (!enState.enActive || enState.settingsTitle !== 'Settings' || !enState.launchpadBtn.includes('TO LAUNCHPAD')) {
    throw new Error('English button state incorrect');
  }

  await page.screenshot({ path: 'tools/shots/settings_en.png' });

  // Click Button 1 (#btn-lang-vi) to switch back to Vietnamese
  await page.click('#btn-lang-vi');
  await new Promise((r) => setTimeout(r, 200));

  const backToVi = await page.evaluate(() => ({
    settingsTitle: document.querySelector('#settings h2')?.textContent,
    viActive: document.getElementById('btn-lang-vi')?.classList.contains('on'),
    launchpadBtn: document.getElementById('btn-launchpad')?.textContent,
  }));
  console.log('Back to Vietnamese state:', backToVi);

  if (!backToVi.viActive || backToVi.settingsTitle !== 'Cài đặt') {
    throw new Error('Switching back to Vietnamese failed');
  }

  if (errors.length) {
    throw new Error('Page errors: ' + errors.join('; '));
  }
  console.log('ALL I18N SETTINGS TESTS PASSED!');
} finally {
  await browser.close();
}
