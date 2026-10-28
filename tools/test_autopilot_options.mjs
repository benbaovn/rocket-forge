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
  await new Promise((r) => setTimeout(r, 400));

  // 1. Test pressing 'o' in VAB toggles #settings modal
  await page.keyboard.press('KeyO');
  await new Promise((r) => setTimeout(r, 150));
  const settingsOpenInVab = await page.evaluate(() => !document.getElementById('settings').classList.contains('hidden'));
  console.log('Settings open after pressing O in VAB:', settingsOpenInVab);
  if (!settingsOpenInVab) throw new Error('Settings modal did not open on pressing O in VAB');

  await page.screenshot({ path: 'tools/shots/options_o_key.png' });

  await page.keyboard.press('KeyO');
  await new Promise((r) => setTimeout(r, 150));
  const settingsClosedInVab = await page.evaluate(() => document.getElementById('settings').classList.contains('hidden'));
  console.log('Settings closed after pressing O again in VAB:', settingsClosedInVab);
  if (!settingsClosedInVab) throw new Error('Settings modal did not close on pressing O again in VAB');

  // 2. Select 'mars' mission ("Chinh phục Sao Hỏa") or 'orbit' mission and go to Launchpad with Saturn V
  await page.evaluate(() => {
    window.__app.build.setMission('moon', false);
  });
  await page.click('#btn-launchpad');
  await new Promise((r) => setTimeout(r, 300));

  // Test pressing 'o' in LaunchScene toggles #settings modal
  await page.keyboard.press('KeyO');
  await new Promise((r) => setTimeout(r, 100));
  const settingsOpenInLaunch = await page.evaluate(() => !document.getElementById('settings').classList.contains('hidden'));
  await page.keyboard.press('KeyO');
  await new Promise((r) => setTimeout(r, 100));
  const settingsClosedInLaunch = await page.evaluate(() => document.getElementById('settings').classList.contains('hidden'));
  console.log('Launch scene O key open/close:', { settingsOpenInLaunch, settingsClosedInLaunch });
  if (!settingsOpenInLaunch || !settingsClosedInLaunch) {
    throw new Error('Settings modal did not toggle properly in LaunchScene');
  }

  // 3. Press 'g' to activate Autopilot from 'ready' state -> should auto-start countdown, auto-stage, and follow mission!
  await page.keyboard.press('KeyG');
  await new Promise((r) => setTimeout(r, 100));

  const simResult = await page.evaluate(() => {
    const launch = window.__app.launch;
    const initialStages = launch.player.segIdx.length;
    const phaseAfterG = launch.phase;
    const progLabel = launch.program?.label;

    // Fast-forward countdown and ascent to orbit
    for (let i = 0; i < 6500; i++) {
      launch.update(0.05);
      if (launch.flags.orbit) break;
    }

    return {
      phaseAfterG,
      progLabel,
      initialStages,
      remainingStagesAtOrbit: launch.player.segIdx.length,
      orbitReached: !!launch.flags.orbit,
      altKm: Math.round(launch.player.alt / 1000),
      pitchDeg: Math.round((launch.player.ang * 180) / Math.PI),
      progPhase: launch.program?.phase,
      crashed: launch.player.crashed,
    };
  });
  console.log('Autopilot simulation result:', simResult);

  if (simResult.phaseAfterG !== 'countdown') {
    throw new Error('Pressing G on pad did not auto-start countdown');
  }
  if (!simResult.orbitReached) {
    throw new Error('Autopilot did not reach orbit');
  }
  if (simResult.remainingStagesAtOrbit >= simResult.initialStages) {
    throw new Error('Autopilot did not auto-stage when stages ran out of fuel');
  }

  await page.screenshot({ path: 'tools/shots/autopilot_orbit.png' });

  if (errors.length) {
    throw new Error('Page errors: ' + errors.join('; '));
  }
  console.log('ALL TESTS PASSED!');
} finally {
  await browser.close();
  process.exit(0);
}
