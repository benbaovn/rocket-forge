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
  await page.waitForFunction(() => !!window.__app && !!window.__app.build);
  await new Promise((r) => setTimeout(r, 400));

  // Select 'Soyuz / R-7 Semyorka' preset
  await page.select('#preset', 'Soyuz / R-7 Semyorka');
  await new Promise((r) => setTimeout(r, 400));

  const vabStats = await page.evaluate(() => {
    const build = window.__app.build;
    build.fitTime = 0;
    build.rocketHolder.rotation.y = 0.0;
    build.desiredTarget.set(0, 21.6, 0);
    build.controls.target.set(0, 21.6, 0);
    build.camera.position.set(0, 21.6, 86);
    build.controls.update();
    return {
      stackTypes: build.stack.map((s) => s.type),
      mass: document.getElementById('st-mass')?.textContent,
      height: document.getElementById('st-height')?.textContent,
      twr: document.getElementById('st-twr')?.textContent,
      dv: document.getElementById('st-dv')?.textContent,
      stages: build.stats.stages.length,
      warnings: build.stats.warnings,
    };
  });
  console.log('Soyuz VAB stats:', vabStats);

  await new Promise((r) => setTimeout(r, 250));
  await page.screenshot({ path: 'tools/shots/soyuz_vab.png' });

  // Go to Launchpad & capture full Soyuz rocket on pad
  await page.click('#btn-launchpad');
  await new Promise((r) => setTimeout(r, 450));

  await page.evaluate(() => {
    const launch = window.__app.launch;
    launch.camera.position.set(22, 1.5, 58);
    launch.controls.target.set(0, 1.5, 0);
    launch.controls.update();
  });

  await new Promise((r) => setTimeout(r, 250));
  await page.screenshot({ path: 'tools/shots/soyuz_launch.png' });

  if (errors.length) {
    throw new Error('Page errors: ' + errors.join('; '));
  }
  console.log('SOYUZ RENDER TEST PASSED!');
} finally {
  await browser.close();
}
