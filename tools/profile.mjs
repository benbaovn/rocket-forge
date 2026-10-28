// Frame profiler: measures CPU update time, per-pass GPU time (via gl.finish), draw calls, without vsync cap
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--window-size=1920,1080', '--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist',
    '--disable-gpu-vsync', '--disable-frame-rate-limit', '--enable-gpu-rasterization'],
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  const page = await browser.newPage();
  const VW = +(process.env.VW || 2560), VH = +(process.env.VH || 1440), DPR = +(process.env.DPR || 1.5);
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DPR });
  console.log(`Viewport ${VW}x${VH} @ dpr ${DPR}`);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push('[console] ' + m.text()); });
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => !!window.__app && !!window.__app.build, { timeout: 60000 });
  await sleep(500);

  const preset = process.argv[2] || 'N1 Liên Xô (Mặt Trăng)';
  await page.select('#preset', preset);
  await sleep(500);

  // Install instrumentation
  await page.evaluate(() => {
    const app = window.__app;
    const gl = app.renderer.getContext();
    window.__prof = { on: false, frames: 0, upd: 0, passes: {}, total: 0, wall: [], updParts: {} };
    const P = window.__prof;
    const wrapScene = (sc) => {
      const orig = sc.update.bind(sc);
      sc.update = (dt) => {
        if (!P.on) return orig(dt);
        const t0 = performance.now(); orig(dt); P.upd += performance.now() - t0;
      };
    };
    wrapScene(app.build); wrapScene(app.launch);
    // wrap selected launch methods for CPU breakdown
    for (const name of ['updateEffects', 'updateCamera', 'updateHUD', 'placeScene', 'envForView', 'updateAtmosphere', 'stepPhysics', 'physics', 'simulate', 'updateVessels']) {
      const L = app.launch;
      if (typeof L[name] !== 'function') continue;
      const o = L[name].bind(L);
      L[name] = (...a) => {
        if (!P.on) return o(...a);
        const t0 = performance.now(); const r = o(...a); P.updParts[name] = (P.updParts[name] || 0) + performance.now() - t0; return r;
      };
    }
    // particle update
    for (const ps of [app.launch.smoke, app.launch.fire]) {
      const o = ps.update.bind(ps);
      ps.update = (...a) => {
        if (!P.on) return o(...a);
        const t0 = performance.now(); const r = o(...a); P.updParts['particles.update'] = (P.updParts['particles.update'] || 0) + performance.now() - t0; return r;
      };
    }
    const wrapPasses = () => {
      app.composer.passes.forEach((p, i) => {
        if (p.__wrapped) return; p.__wrapped = true;
        const o = p.render.bind(p);
        const key = i + ':' + p.constructor.name;
        p.render = (...a) => {
          if (!P.on || !p.enabled) return o(...a);
          gl.finish();
          const t0 = performance.now(); o(...a); gl.finish();
          P.passes[key] = (P.passes[key] || 0) + performance.now() - t0;
        };
      });
    };
    window.__wrapPasses = wrapPasses;
    wrapPasses();
    const origFrame = app.frame.bind(app);
    let last = performance.now();
    app.frame = () => {
      const t0 = performance.now();
      origFrame();
      if (P.on) { P.frames++; P.total += performance.now() - t0; P.wall.push(t0 - last); }
      last = t0;
    };
    app.renderer.setAnimationLoop(() => app.frame());
  });

  const measure = async (label, ms = 3000) => {
    await page.evaluate(() => { window.__wrapPasses(); const P = window.__prof; P.on = false; P.frames = 0; P.upd = 0; P.passes = {}; P.total = 0; P.wall = []; P.updParts = {}; });
    // free-running fps without instrumentation first
    const fpsRaw = await page.evaluate((ms) => new Promise((res) => {
      let n = 0; const t0 = performance.now();
      const tick = () => { n++; if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res(n / ((performance.now() - t0) / 1000)); };
      requestAnimationFrame(tick);
    }), 1500);
    await page.evaluate(() => { window.__prof.on = true; });
    await sleep(ms);
    const r = await page.evaluate(() => {
      const P = window.__prof; P.on = false;
      const app = window.__app;
      const n = Math.max(1, P.frames);
      const passes = Object.fromEntries(Object.entries(P.passes).map(([k, v]) => [k, +(v / n).toFixed(2)]));
      const parts = Object.fromEntries(Object.entries(P.updParts).map(([k, v]) => [k, +(v / n).toFixed(2)]));
      const info = app.renderer.info;
      let meshes = 0, tris = 0;
      app.current.scene.traverse((o) => { if (o.isMesh && o.visible) { meshes++; } });
      return {
        frames: P.frames, avgFrameMs: +(P.total / n).toFixed(2), updateMs: +(P.upd / n).toFixed(2),
        updateParts: parts, passesMs: passes, calls: info.render.calls, tris: info.render.triangles,
        programs: info.programs ? info.programs.length : '?', geometries: info.memory.geometries, textures: info.memory.textures,
        meshesInScene: meshes, smoke: app.launch.smoke.count, fire: app.launch.fire.count,
        drawBuf: [app.renderer.domElement.width, app.renderer.domElement.height],
        quality: app.qualityName,
      };
    });
    console.log(`\n=== ${label} ===  raw FPS (no vsync): ${fpsRaw.toFixed(1)}`);
    console.log(JSON.stringify(r, null, 1));
  };

  await measure('VAB');
  await page.click('#btn-launchpad');
  await sleep(1500);
  await measure('LAUNCHPAD idle');

  // GPU cost attribution: time the ScenePass with individual components disabled
  const attrib = await page.evaluate(async () => {
    const app = window.__app, L = app.launch, gl = app.renderer.getContext();
    const frameGpu = (n = 40) => {
      let t = 0;
      for (let i = 0; i < n; i++) { gl.finish(); const t0 = performance.now(); app.composer.render(0.016); gl.finish(); t += performance.now() - t0; }
      return t / n;
    };
    app.renderer.setAnimationLoop(null);
    const base = frameGpu();
    const out = { baseline: +base.toFixed(2) };
    const toggles = {
      sky: [L.sky], clouds: [L.clouds], ground: [L.ground], trees: [L.trees], earth: [L.earth], smoke: [L.smoke.mesh, L.fire.mesh],
    };
    for (const [k, objs] of Object.entries(toggles)) {
      const prev = objs.map((o) => o && o.visible);
      const origPlace = L.placeScene.bind(L);
      L.placeScene = (F) => { origPlace(F); objs.forEach((o) => o && (o.visible = false)); };
      objs.forEach((o) => o && (o.visible = false));
      out['-' + k] = +(base - frameGpu()).toFixed(2);
      L.placeScene = origPlace;
      objs.forEach((o, i) => o && (o.visible = prev[i]));
    }
    // shadows
    app.renderer.shadowMap.enabled = false; app.renderer.shadowMap.needsUpdate = true;
    L.scene.traverse((o) => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true)); } });
    frameGpu(5);
    out['-shadows'] = +(base - frameGpu()).toFixed(2);
    app.renderer.shadowMap.enabled = true;
    L.scene.traverse((o) => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true)); } });
    frameGpu(5);
    // resolution scaling
    const pr = app.renderer.getPixelRatio();
    for (const s of [1.0, 0.75]) {
      app.renderer.setPixelRatio(s); app.composer.setPixelRatio(s); app.composer.setSize(innerWidth, innerHeight);
      frameGpu(5);
      out['pixelRatio=' + s] = +frameGpu().toFixed(2);
    }
    app.renderer.setPixelRatio(pr); app.composer.setPixelRatio(pr); app.composer.setSize(innerWidth, innerHeight);
    app.renderer.setAnimationLoop(() => app.frame());
    return out;
  });
  console.log('\n=== GPU cost attribution (ms saved when removed) ===');
  console.log(JSON.stringify(attrib, null, 1));
  await page.evaluate(() => window.__app.launch.startCountdown());
  await sleep(14000);
  await measure('LIFTOFF (engines + smoke)');
  await sleep(8000);
  await measure('ASCENT +8s');
  if (errors.length) console.log('\nErrors/warnings:', errors.slice(0, 15));
} finally {
  await browser.close();
}
