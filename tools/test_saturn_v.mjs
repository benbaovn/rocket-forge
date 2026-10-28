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
  await page.evaluate(() => localStorage.removeItem('rf-stack'));
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#btn-launchpad');
  await new Promise((r) => setTimeout(r, 600));

  const vabStats = await page.evaluate(() => {
    const build = window.__app.build;
    build.rocketHolder.rotation.y = 0.0;
    build.controls.target.set(0, 29.5, 0);
    build.camera.position.set(46, 30.5, 80);
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
  console.log('Saturn V VAB stats:', vabStats);

  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: 'tools/shots/saturn_v_vab.png' });

  // Go to Launchpad & capture full rocket on pad / liftoff
  await page.click('#btn-launchpad');
  await new Promise((r) => setTimeout(r, 500));

  await page.evaluate(() => {
    const launch = window.__app.launch;
    launch.camera.position.set(36, 2.5, 64);
    launch.controls.target.set(0, 2.5, 0);
    launch.controls.update();
  });

  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: 'tools/shots/saturn_v_launch.png' });

  // Simulate an ocean crash after running stage 1 out of fuel without staging
  const crashInfo = await page.evaluate(() => {
    const launch = window.__app.launch;
    const p = launch.player;
    launch.lifted = true;
    launch.met = 142.5;
    launch.maxAlt = 28400;
    launch.maxVel = 920;
    launch.maxG = 3.8;
    // Empty current stage fuel while upper stages still have fuel
    launch.fuel[p.activeSeg] = 0;
    p.crashDetails = {
      sp: 185.4,
      vLim: 12.0,
      vertSp: 162.0,
      horizSp: 90.2,
      tiltDeg: 68,
      chuteOk: false,
      legsOk: false,
      hasCapsule: true,
      hasLegs: false,
      where: 'water',
    };
    launch.explode(p, 'Lao xuống biển!');
    launch.showResult(false, 'Lao xuống biển!');
    const reasonEl = document.getElementById('r-reason');
    return {
      hidden: reasonEl?.classList.contains('hidden'),
      text: reasonEl?.innerText,
    };
  });
  console.log('Crash reason info:', crashInfo);
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: 'tools/shots/crash_reason_modal.png' });

  if (errors.length) {
    throw new Error('Page errors: ' + errors.join('; '));
  }
  console.log('SATURN V RENDER TEST PASSED!');
} finally {
  await browser.close();
}
