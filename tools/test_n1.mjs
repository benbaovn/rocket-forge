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

  // Select 'N1 Liên Xô (Mặt Trăng)' preset
  await page.select('#preset', 'N1 Liên Xô (Mặt Trăng)');
  await new Promise((r) => setTimeout(r, 400));

  const vabStats = await page.evaluate(() => {
    const build = window.__app.build;
    build.fitTime = 0;
    build.rocketHolder.rotation.y = 0.0;
    build.desiredTarget.set(0, 26.2, 0);
    build.controls.target.set(0, 26.2, 0);
    build.camera.position.set(0, 25.0, 105);
    build.controls.update();
    return {
      gpu: window.__app.gpuInfo,
      qualityName: window.__app.qualityName,
      qualityCfg: window.__app.qualityCfg,
      badgeName: document.getElementById('gpu-badge-name')?.textContent,
      stackTypes: build.stack.map((s) => s.type),
      mass: document.getElementById('st-mass')?.textContent,
      height: document.getElementById('st-height')?.textContent,
      twr: document.getElementById('st-twr')?.textContent,
      dv: document.getElementById('st-dv')?.textContent,
      stages: build.stats.stages.length,
      warnings: build.stats.warnings,
    };
  });
  console.log('N1 VAB & GPU stats:', vabStats);

  await new Promise((r) => setTimeout(r, 450));
  await page.screenshot({ path: 'tools/shots/n1_vab.png' });

  // Open Settings modal via GPU badge to verify RTX 4070 Ti panel
  await page.click('#gpu-badge');
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: 'tools/shots/rtx_settings.png' });
  await page.click('#btn-settings-close');
  await new Promise((r) => setTimeout(r, 200));

  // Go to Launchpad & capture full N1 rocket on pad
  await page.click('#btn-launchpad');
  await new Promise((r) => setTimeout(r, 450));

  await page.evaluate(() => {
    const launch = window.__app.launch;
    launch.camera.position.set(22, 6.0, 82);
    launch.controls.target.set(0, 6.0, 0);
    launch.controls.update();
  });

  await new Promise((r) => setTimeout(r, 250));
  await page.screenshot({ path: 'tools/shots/n1_launch.png' });

  if (errors.length) {
    throw new Error('Page errors: ' + errors.join('; '));
  }
  console.log('N1 RENDER TEST PASSED!');
} finally {
  await browser.close();
}
