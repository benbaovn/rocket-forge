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
  await page.evaluate(() => localStorage.removeItem('rf-space-objects'));
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#btn-launchpad');
  await page.click('#btn-launchpad');
  await new Promise((r) => setTimeout(r, 700));

  // Step 1: Put rocket #1 into space (140 km altitude) and separate Stage 1
  const step1 = await page.evaluate(() => {
    const app = window.__app;
    const launch = app.launch;
    const P = launch.player;
    P.clamped = false;
    P.landed = null;
    launch.phase = 'flight';
    launch.released = true;
    launch.ignited = true;

    const R_E = 600e3;
    const MU_E = 9.80665 * R_E * R_E;
    const r = R_E + 140e3;
    const vOrb = Math.sqrt(MU_E / r);
    P.s.x = r;
    P.s.y = 0;
    P.s.z = 0;
    P.s.vx = 0;
    P.s.vy = -vOrb;
    P.s.vz = 0;
    P.updateFrame(launch.simT);

    // Separate stage 1 in space
    const sepStage = launch.stageVessel(P);
    // Advance simulation by 50 seconds
    for (let i = 0; i < 50; i++) launch.simStep(1.0);

    return {
      vesselCount: launch.vessels.length,
      stageLabel: sepStage ? sepStage.label : null,
      stageOrbitStabilized: sepStage ? !!sepStage.orbitStabilized : false,
      stageAltKm: sepStage ? sepStage.alt / 1000 : 0,
    };
  });
  console.log('Step 1 (Flight 1 stage separation in space):', step1);
  if (!step1.stageOrbitStabilized || step1.vesselCount < 2) {
    throw new Error('Separated stage did not stabilize in space');
  }

  // Step 2: Return to VAB and start Flight 2 -> Flight 1's rocket & separated stage must persist in spaceObjects
  await page.evaluate(() => {
    const app = window.__app;
    const stack = app.launch.stack;
    app.goBuild();
    app.goLaunch(stack);
  });
  await new Promise((r) => setTimeout(r, 500));

  // Also put Flight 2 into space (220 km) and separate another stage, then open Map
  const step2 = await page.evaluate(() => {
    const app = window.__app;
    const launch = app.launch;
    const P = launch.player;
    P.clamped = false;
    P.landed = null;
    launch.phase = 'flight';
    launch.released = true;
    launch.ignited = true;

    const R_E = 600e3;
    const MU_E = 9.80665 * R_E * R_E;
    const r = R_E + 220e3;
    const vOrb = Math.sqrt(MU_E / r);
    P.s.x = 0;
    P.s.y = r;
    P.s.z = 0;
    P.s.vx = vOrb;
    P.s.vy = 0;
    P.s.vz = 0;
    P.updateFrame(launch.simT);

    launch.stageVessel(P);
    for (let i = 0; i < 20; i++) launch.simStep(1.0);

    launch.map.toggle(true);
    launch.map.setFocus('earth');
    launch.updateMap();

    return {
      persistedCount: launch.spaceObjects.length,
      persistedNames: launch.spaceObjects.map((o) => o.name),
      mapOthersCount: launch.map.lastState.others.length,
      mapOtherNames: launch.map.lastState.others.map((o) => o.name),
      hudTargets: launch.map.hudTargets.filter((t) => t.deletable),
    };
  });
  console.log('Step 2 (Persisted + live space objects on Map):', step2);

  if (step2.persistedCount < 2) {
    throw new Error(`Expected >= 2 persisted objects, got ${step2.persistedCount}`);
  }
  if (step2.mapOthersCount < 3) {
    throw new Error(`Expected >= 3 total space objects on map, got ${step2.mapOthersCount}`);
  }

  // Step 3: Click on one of the space objects on the Map canvas and verify the Delete popup appears
  const targetToClick = step2.hudTargets.find((t) => t.objId !== 'vessel');
  if (!targetToClick) throw new Error('No clickable space object badge found on Map HUD');

  await page.mouse.click(targetToClick.bx + 20, targetToClick.by + 12);
  await new Promise((r) => setTimeout(r, 300));

  const popupState = await page.evaluate(() => {
    const popup = document.getElementById('map-obj-popup');
    const name = document.getElementById('mop-name')?.textContent;
    const meta = document.getElementById('mop-meta')?.textContent;
    const delBtn = document.getElementById('btn-map-delete');
    return {
      visible: popup && !popup.classList.contains('hidden'),
      name,
      meta,
      delBtnText: delBtn ? delBtn.textContent.trim() : null,
    };
  });
  console.log('Step 3 (Popup after clicking object on Map):', popupState);
  if (!popupState.visible) {
    throw new Error('Delete popup did not appear when clicking space object on Map');
  }

  await page.screenshot({ path: 'tools/shots/space_objects_map_popup.png' });

  // Step 4: Click the Delete button (#btn-map-delete) and verify the object is removed
  await page.click('#btn-map-delete');
  await new Promise((r) => setTimeout(r, 300));

  const afterDelete = await page.evaluate(() => {
    const launch = window.__app.launch;
    launch.updateMap();
    const popup = document.getElementById('map-obj-popup');
    return {
      popupHidden: popup.classList.contains('hidden'),
      mapOthersCount: launch.map.lastState.others.length,
      mapOtherNames: launch.map.lastState.others.map((o) => o.name),
    };
  });
  console.log('Step 4 (After clicking Delete button):', afterDelete);

  if (!afterDelete.popupHidden || afterDelete.mapOthersCount !== step2.mapOthersCount - 1) {
    throw new Error('Object was not deleted after clicking #btn-map-delete');
  }

  if (errors.length) {
    throw new Error('Page errors: ' + errors.join('; '));
  }
  console.log('ALL SPACE OBJECT & MAP DELETE TESTS PASSED!');
} finally {
  await browser.close();
}
