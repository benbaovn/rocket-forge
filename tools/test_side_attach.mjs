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
  await page.waitForSelector('#btn-launchpad');

  // Test 1: Test dragging a stack part (e.g. tankM, engHeavy, nose) to the side of the rocket via findCandidate
  const sideCandTest = await page.evaluate(() => {
    const build = window.__app.build;
    const lay = build.rocket.layout;
    // Get screen coordinates of a middle part on the rocket
    const midPart = lay.parts[Math.floor(lay.parts.length / 2)];
    const [sx, sy] = build.screenOf(midPart.y + midPart.def.height / 2);

    // Dragging tankM 70px to the right of the rocket center -> should return { attach: midPart.index }
    const candTank = build.findCandidate('tankM', sx + 70, sy);
    const candEng = build.findCandidate('engHeavy', sx - 70, sy);
    const candNose = build.findCandidate('nose', sx + 65, sy);
    // Dragging tankM at the center (sx, sy) -> should return { insert: ... }
    const candCenter = build.findCandidate('tankM', sx, sy);

    return { candTank, candEng, candNose, candCenter };
  });
  console.log('Side candidate test:', sideCandTest);

  if (sideCandTest.candTank?.attach === undefined || sideCandTest.candEng?.attach === undefined || sideCandTest.candNose?.attach === undefined) {
    throw new Error('Stack parts did not resolve to side attachment when dragged to the sides');
  }
  if (sideCandTest.candCenter?.insert === undefined) {
    throw new Error('Center drag did not resolve to stack insertion');
  }

  // Test 2: Test the #btn-side-toggle button in VAB and Falcon Heavy preset with side-mounted tanks/engines/noses
  const presetAndToggleTest = await page.evaluate(() => {
    const build = window.__app.build;
    const sel = document.getElementById('preset');
    sel.value = 'Falcon Heavy (SpaceX)';
    sel.dispatchEvent(new Event('change'));

    // Select top capsule and test #btn-side-toggle visibility
    build.select({ index: 1, attach: null });
    const btnVisible = !document.getElementById('btn-side-toggle').classList.contains('hidden');

    return {
      btnVisible,
      mass: document.getElementById('st-mass').textContent,
      twr: document.getElementById('st-twr').textContent,
      dv: document.getElementById('st-dv').textContent,
      nozzleCount: build.rocket.nozzles.length,
    };
  });
  console.log('Falcon Heavy & Side Toggle test:', presetAndToggleTest);

  if (!presetAndToggleTest.btnVisible || presetAndToggleTest.nozzleCount < 3) {
    throw new Error('Side-attached nozzles or toggle button failed');
  }

  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: 'tools/shots/side_attached_parts_vab.png' });

  if (errors.length) {
    throw new Error('Page errors: ' + errors.join('; '));
  }
  console.log('ALL SIDE ATTACHMENT TESTS PASSED!');
} finally {
  await browser.close();
}
