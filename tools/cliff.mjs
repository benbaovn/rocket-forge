// Experiment: find the 4K performance cliff (MSAA samples x resolution x buffer type)
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--window-size=2560,1440', '--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'],
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 2560, height: 1440, deviceScaleFactor: 1.5 });
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => !!window.__app && !!window.__app.build, { timeout: 60000 });
  await sleep(800);
  const res = await page.evaluate(async () => {
    const THREE_RT = window.__app.composer.renderTarget1.constructor;
    const app = window.__app, gl = app.renderer.getContext();
    app.renderer.setAnimationLoop(null);
    const time = (n = 12) => { app.composer.render(0.016); gl.finish(); let t = 0; for (let i = 0; i < n; i++) { const t0 = performance.now(); app.composer.render(0.016); gl.finish(); t += performance.now() - t0; } return +(t / n).toFixed(2); };
    const out = [];
    const info = { maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), maxSamples: gl.getParameter(gl.MAX_SAMPLES), maxViewport: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS)) };
    for (const pr of [1.0, 1.25, 1.5]) {
      for (const samples of [0, 2, 4]) {
        app.qualityCfg = { ...app.qualityCfg, samples, pixelRatio: pr };
        app.renderer.setPixelRatio(pr); app.renderer.setSize(innerWidth, innerHeight);
        app.composer.dispose(); app.setupComposer(); app.setScene(app.build);
        app.composer.setPixelRatio(pr); app.composer.setSize(innerWidth, innerHeight);
        const ms = time();
        out.push({ pr, buf: `${app.renderer.domElement.width}x${app.renderer.domElement.height}`, samples, ms });
      }
    }
    // shadows off at 1.5 / 4 samples
    app.renderer.shadowMap.enabled = false;
    app.build.scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => (m.needsUpdate = true)); });
    time(3);
    out.push({ pr: 1.5, samples: 4, shadows: false, ms: time() });
    app.renderer.shadowMap.enabled = true;
    // canvas only (no composer) at 1.5
    app.renderer.setRenderTarget(null);
    const t0 = performance.now(); for (let i = 0; i < 8; i++) { app.renderer.render(app.build.scene, app.build.camera); gl.finish(); }
    out.push({ pr: 1.5, direct: true, ms: +((performance.now() - t0) / 8).toFixed(2) });
    return { info, out };
  });
  console.log(JSON.stringify(res.info));
  for (const r of res.out) console.log(JSON.stringify(r));
} finally {
  await browser.close();
}
