// Chrome trace of the ascent phase: summarises main-thread time by event (GC, Layout, Paint, Composite, scripts)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--window-size=1920,1080', '--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist',
    '--disable-gpu-vsync', '--disable-frame-rate-limit'],
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => !!window.__app && !!window.__app.build, { timeout: 60000 });
  await sleep(500);
  await page.select('#preset', process.argv[2] || 'N1 Liên Xô (Mặt Trăng)');
  await sleep(400);
  await page.click('#btn-launchpad');
  await sleep(1200);
  await page.evaluate(() => window.__app.launch.startCountdown());
  await sleep(18000);

  // frame wall-time distribution over 4 s
  const dist = await page.evaluate(() => new Promise((res) => {
    const w = []; let last = performance.now(); const t0 = last;
    const tick = () => { const n = performance.now(); w.push(n - last); last = n; if (n - t0 < 4000) requestAnimationFrame(tick); else res(w); };
    requestAnimationFrame(tick);
  }));
  dist.sort((a, b) => a - b);
  const pct = (p) => dist[Math.min(dist.length - 1, Math.floor(dist.length * p))].toFixed(2);
  console.log(`frames=${dist.length} fps=${(dist.length / 4).toFixed(1)} p50=${pct(0.5)}ms p95=${pct(0.95)}ms p99=${pct(0.99)}ms max=${dist[dist.length - 1].toFixed(1)}ms  >16.7ms: ${dist.filter((x) => x > 16.7).length}  >33ms: ${dist.filter((x) => x > 33).length}`);

  await page.tracing.start({ path: 'tools/shots/ascent_trace.json', categories: ['devtools.timeline', 'v8', 'v8.gc', 'blink', 'cc', 'gpu', 'disabled-by-default-devtools.timeline'] });
  await sleep(3000);
  await page.tracing.stop();

  const trace = JSON.parse(fs.readFileSync('tools/shots/ascent_trace.json', 'utf8'));
  const events = trace.traceEvents || trace;
  // find renderer main thread
  const threadNames = {};
  for (const e of events) if (e.name === 'thread_name') threadNames[e.pid + ':' + e.tid] = e.args.name;
  const totals = {};
  for (const e of events) {
    if (e.ph !== 'X' || !e.dur) continue;
    const tn = threadNames[e.pid + ':' + e.tid] || '?';
    if (!/CrRendererMain|Compositor|VizCompositor|CrGpuMain/.test(tn)) continue;
    const key = tn + ' | ' + e.name;
    totals[key] = (totals[key] || 0) + e.dur / 1000;
  }
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 30);
  console.log('\nTop events over 3 s (ms total):');
  for (const [k, v] of top) console.log(v.toFixed(1).padStart(8), k);
} finally {
  await browser.close();
}
