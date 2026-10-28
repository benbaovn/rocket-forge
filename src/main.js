// Rocket Forge – entry point: renderer, post-processing pipeline, scene switching
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { createFinalPass, createClampPass } from './fx/postfx.js';
import { initMaterials } from './parts.js';
import { BuildScene } from './build/BuildScene.js';
import { LaunchScene } from './launch/LaunchScene.js';
import { audio } from './audio.js';
import { getLang, applyLanguage, tr } from './i18n.js';

/**
 * Renders the active scene into its own (optionally multisampled) HDR target, then soft-clamps it into the
 * composer's write buffer. Only this one target carries MSAA; the composer's ping-pong buffers stay single-sample,
 * which keeps VRAM use small at 4K (previously both ping-pong buffers were multisampled).
 */
class SceneClampPass extends Pass {
  constructor(app, samples, maxLum = 30.0) {
    super();
    this.app = app;
    this.needsSwap = true;
    this.sceneRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples });
    const clamp = createClampPass(maxLum);
    this.clampMat = clamp.material;
    this.quad = new FullScreenQuad(this.clampMat);
  }
  setSize(w, h) { this.sceneRT.setSize(w, h); }
  render(renderer, writeBuffer) {
    const sc = this.app.current;
    if (!sc) return;
    if (sc.render) {
      sc.render(renderer, this.sceneRT);
    } else {
      renderer.setRenderTarget(this.sceneRT);
      renderer.clear();
      renderer.render(sc.scene, sc.camera);
    }
    this.clampMat.uniforms.tDiffuse.value = this.sceneRT.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }
  dispose() { this.sceneRT.dispose(); this.clampMat.dispose(); this.quad.dispose(); }
}

/**
 * maxPixels caps the internal render resolution regardless of monitor size / Windows scaling.
 * On a 4K monitor at 150% scaling the old code rendered 4800×2700 with 8× MSAA (~2.6 GB of render targets).
 */
const QUALITY = {
  rtx:    { maxPixelRatio: 1.5,  maxPixels: 2560 * 1440, samples: 4, shadow: 4096, vabShadow: 2048, vabSpots: 2, particles: 1.25, skySteps: 20 },
  ultra:  { maxPixelRatio: 1.25, maxPixels: 2304 * 1296, samples: 4, shadow: 2048, vabShadow: 2048, vabSpots: 2, particles: 1.0,  skySteps: 16 },
  high:   { maxPixelRatio: 1.0,  maxPixels: 1920 * 1080, samples: 2, shadow: 2048, vabShadow: 1024, vabSpots: 1, particles: 0.75, skySteps: 12 },
  medium: { maxPixelRatio: 1.0,  maxPixels: 1600 * 900,  samples: 0, shadow: 1024, vabShadow: 1024, vabSpots: 1, particles: 0.45, skySteps: 8 },
};

/** Detect active WebGL2 hardware GPU and capabilities */
function detectGPU(renderer) {
  const gl = renderer.getContext();
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const rawRenderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  const rawVendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
  const maxTex = renderer.capabilities.maxTextureSize || 8192;
  const maxSamples = renderer.capabilities.maxSamples || 4;
  const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 16;

  // Parse clean GPU model name from ANGLE / driver string
  let cleanName = String(rawRenderer || 'Dedicated GPU');
  const angleMatch = cleanName.match(/ANGLE\s*\([^,]+,\s*([^,(]+)/i);
  if (angleMatch && angleMatch[1]) {
    cleanName = angleMatch[1].trim();
  } else {
    cleanName = cleanName.replace(/\s*\(0x[0-9a-fA-F]+\).*$/, '').trim();
  }
  cleanName = cleanName.replace(/\s+Direct3D.*$/i, '').replace(/\s+OpenGL.*$/i, '').trim();

  const rtxMatch = cleanName.match(/(RTX\s*\d{4}\s*(?:Ti|SUPER|M)?|GTX\s*\d{4}\s*(?:Ti|SUPER)?|Radeon\s*RX\s*\d{4}\s*(?:XT|XTX)?)/i);
  const shortName = rtxMatch ? rtxMatch[1].replace(/\s+/g, ' ').trim() : cleanName.replace(/^NVIDIA\s+GeForce\s+/i, '');
  const isHighEnd = /RTX\s*[2345]\d{3}|Radeon\s*RX\s*[6789]\d{3}|Arc\s*A7|Apple\s*M[1234]\s*(Pro|Max|Ultra)/i.test(rawRenderer);
  const apiBackend = /D3D12/i.test(rawRenderer) ? 'D3D12' : /D3D11/i.test(rawRenderer) ? 'D3D11' : /Vulkan/i.test(rawRenderer) ? 'Vulkan' : 'WebGL2';

  return {
    rawRenderer,
    rawVendor,
    cleanName,
    shortName,
    apiBackend,
    isHighEnd,
    maxTex,
    maxSamples,
    maxAniso,
  };
}

const $ = (id) => document.getElementById(id);
const setLoad = (p, txt) => { $('load-fill').style.width = p + '%'; if (txt) $('load-text').textContent = txt; };
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

class App {
  async init() {
    this.canvas = $('gl');
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('WebGL context lost. Đang giữ tài nguyên chờ phục hồi GPU...');
      this.paused = true;
    }, false);
    this.canvas.addEventListener('webglcontextrestored', () => {
      console.info('WebGL context restored. Đang phục hồi renderer và pipeline...');
      try {
        this.disposeComposer();
        this.setupComposer();
        this.applyQuality(this.qualityName, false);
        if (this.current) this.setScene(this.current);
      } catch (err) {
        console.error('Lỗi khi khôi phục WebGL:', err);
      }
      this.paused = false;
    }, false);

    const renderer = this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    renderer.setSize(innerWidth, innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.info.autoReset = false;

    this.gpuInfo = detectGPU(renderer);
    console.info(`[Rocket Forge GPU] Active: ${this.gpuInfo.cleanName} (${this.gpuInfo.apiBackend}) | MaxSamples: ${this.gpuInfo.maxSamples}x | MaxTex: ${this.gpuInfo.maxTex}`);

    const savedQ = localStorage.getItem('rf-quality');
    const manualQ = localStorage.getItem('rf-quality-manual') === '1';
    if (this.gpuInfo.isHighEnd && (!savedQ || !manualQ)) {
      this.qualityName = 'rtx';
    } else {
      this.qualityName = savedQ || (this.gpuInfo.isHighEnd ? 'rtx' : 'high');
    }
    if (!QUALITY[this.qualityName]) this.qualityName = this.gpuInfo.isHighEnd ? 'rtx' : 'high';
    this.qualityCfg = QUALITY[this.qualityName];
    this.renderScale = 1;          // dynamic resolution multiplier (0.6 … 1), adjusted from measured frame times
    this.frameTimes = [];
    this.goodWindows = 0;
    renderer.setPixelRatio(this.computePixelRatio());
    this.fpsAccum = 0;
    this.fpsFrames = 0;
    this.currentFps = 60;
    this.currentMs = 16.7;

    setLoad(10, tr('Đang tạo vật liệu PBR & texture…', 'Creating PBR materials & textures…'));
    await nextFrame();
    applyLanguage(getLang(), null);
    initMaterials();
    setLoad(35, tr('Đang dựng xưởng lắp ráp…', 'Building Vehicle Assembly Hangar…'));
    await nextFrame();
    this.build = new BuildScene(this);
    setLoad(65, tr('Đang dựng bệ phóng, bầu khí quyển & Trái Đất…', 'Building launchpad, atmosphere & planets…'));
    await nextFrame();
    this.launch = new LaunchScene(this);
    setLoad(85, tr('Đang biên dịch shader…', 'Compiling shaders…'));
    await nextFrame();
    this.setupComposer();
    this.applyQuality(this.qualityName, false);
    this.applyLanguage(getLang());

    window.addEventListener('resize', () => this.onResize());
    this.initMenus();
    this.clock = new THREE.Clock();
    this.goBuild();
    // pre-compile launch scene shaders to avoid hitch
    try { renderer.compile(this.launch.scene, this.launch.camera); } catch { /* ignore */ }
    setLoad(100, 'Sẵn sàng!');
    await nextFrame();
    $('loading').style.opacity = 0;
    setTimeout(() => $('loading').remove(), 900);
    renderer.setAnimationLoop(() => this.frame());

    // debug / automation hooks
    window.__app = this;
    const qs = new URLSearchParams(location.search);
    if (qs.get('scene') === 'launch') {
      if (qs.get('mission')) this.build.setMission && this.build.setMission(qs.get('mission'), true);
      this.goLaunch(this.build.stack.map((s) => ({ ...s, attach: [...s.attach] })), qs.get('mission') || undefined);
      if (qs.get('ap')) this.launch.pendingAP = true;
      if (qs.get('cam')) for (let i = 0; i < +qs.get('cam'); i++) this.launch.cycleCam();
      if (qs.get('go')) this.launch.startCountdown();
      if (qs.get('ap')) this.launch.toggleAutopilot();
      if (qs.get('warp')) { this.launch.userWarp = +qs.get('warp'); }
    }
  }

  /** Internal render pixel ratio: min(device DPR, quality cap, pixel-budget cap) × dynamic render scale */
  computePixelRatio() {
    const q = this.qualityCfg;
    const dpr = window.devicePixelRatio || 1;
    const cssPx = Math.max(1, innerWidth * innerHeight);
    const budget = Math.sqrt(q.maxPixels / cssPx);
    return Math.max(0.5, Math.min(dpr, q.maxPixelRatio, budget) * (this.renderScale || 1));
  }

  /** Resize renderer + all post-processing targets to the current pixel ratio */
  applyResolution() {
    const pr = this.computePixelRatio();
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(innerWidth, innerHeight);
    if (this.composer) {
      this.composer.setPixelRatio(pr);
      this.composer.setSize(innerWidth, innerHeight);
    }
    if (this.bloom) this.bloom.setSize(Math.max(1, Math.round(innerWidth * pr * 0.5)), Math.max(1, Math.round(innerHeight * pr * 0.5)));
  }

  disposeComposer() {
    if (!this.composer) return;
    for (const p of this.composer.passes) { try { p.dispose && p.dispose(); } catch { /* ignore */ } }
    this.composer.dispose();
    this.composer = null;
  }

  setupComposer() {
    const r = this.renderer;
    const size = r.getDrawingBufferSize(new THREE.Vector2());
    const maxHwSamples = this.gpuInfo ? this.gpuInfo.maxSamples : 4;
    const msaaSamples = Math.min(this.qualityCfg.samples || 0, maxHwSamples);
    // ping-pong buffers: single-sample (MSAA lives only in SceneClampPass.sceneRT)
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 0 });
    this.composer = new EffectComposer(r, rt);
    this.scenePass = new SceneClampPass(this, msaaSamples, 30.0);
    this.composer.addPass(this.scenePass);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(Math.max(1, size.x >> 1), Math.max(1, size.y >> 1)), 0.6, 0.5, 1.0);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.finalPass = createFinalPass();
    this.composer.addPass(this.finalPass);
  }

  applyQuality(name, rebuild = true, manual = false) {
    if (!QUALITY[name]) name = 'high';
    this.qualityName = name;
    this.qualityCfg = QUALITY[name];
    localStorage.setItem('rf-quality', name);
    if (manual) { localStorage.setItem('rf-quality-manual', '1'); this.renderScale = 1; this.goodWindows = 0; }
    const q = this.qualityCfg;
    if (rebuild) {
      const cur = this.current;
      this.disposeComposer();
      this.setupComposer();
      if (cur) this.setScene(cur);
    }
    this.applyResolution();

    // Update Launchpad sun shadow map (up to 8192x8192 on RTX 4070 Ti) & sky ray-marching steps
    const maxTex = this.gpuInfo ? this.gpuInfo.maxTex : 8192;
    const targetShadow = Math.min(q.shadow, maxTex);
    const sun = this.launch.sun;
    if (sun.shadow.mapSize.x !== targetShadow) {
      sun.shadow.mapSize.set(targetShadow, targetShadow);
      sun.shadow.bias = targetShadow >= 8192 ? -0.00012 : -0.0002;
      sun.shadow.normalBias = targetShadow >= 8192 ? 0.025 : 0.04;
      if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    }
    if (this.launch.skyMat && this.launch.skyMat.uniforms && this.launch.skyMat.uniforms.uSteps) {
      this.launch.skyMat.uniforms.uSteps.value = q.skySteps || 16;
    }

    // Update VAB Hangar spotlights (4x 4096x4096 shadow maps in RTX mode)
    if (this.build && this.build.spotLights) {
      const vabSh = Math.min(q.vabShadow || 2048, maxTex);
      const vabSp = q.vabSpots || 2;
      this.build.spotLights.forEach((sp, idx) => {
        sp.castShadow = idx < vabSp;
        if (sp.shadow.mapSize.x !== vabSh) {
          sp.shadow.mapSize.set(vabSh, vabSh);
          if (sp.shadow.map) { sp.shadow.map.dispose(); sp.shadow.map = null; }
        }
      });
    }

    document.querySelectorAll('[data-q]').forEach((b) => b.classList.toggle('on', b.dataset.q === name));
    this.updateGPUUI();
  }

  updateGPUUI() {
    const g = this.gpuInfo;
    if (!g) return;
    const q = this.qualityCfg;
    const msaa = Math.min(q.samples || 0, g.maxSamples || 8);
    const shSz = Math.min(q.shadow || 2048, g.maxTex || 8192);
    const tierLabel = this.qualityName === 'rtx' ? 'RTX EXTREME' : this.qualityName.toUpperCase();

    document.querySelectorAll('button.rtx-btn').forEach((btn) => {
      btn.textContent = `⚡ ${g.shortName || 'RTX Ultra'}`;
    });

    const bName = $('gpu-badge-name');
    if (bName) bName.textContent = `${g.shortName} · ${tierLabel}`;
    const lName = $('gpu-launch-name');
    if (lName) lName.textContent = `⚡ ${g.shortName}`;

    const mName = $('gpu-model-name');
    if (mName) mName.textContent = g.cleanName;
    const tTag = $('gpu-tier-tag');
    if (tTag) tTag.textContent = tierLabel;
    const caps = $('gpu-caps');
    if (caps) caps.textContent = `WebGL2 (${g.apiBackend}) · ${msaa}× MSAA · ${g.maxAniso}× Aniso`;
    const pipe = $('gpu-pipeline');
    if (pipe) {
      const bufSz = this.renderer.getDrawingBufferSize(new THREE.Vector2());
      const scalePct = Math.round((this.renderScale || 1) * 100);
      pipe.textContent = `${bufSz.x}×${bufSz.y} (${scalePct}%) · Shadow ${shSz}² · Sky ${q.skySteps}st`;
    }
  }

  applyLanguage(lang) {
    applyLanguage(lang, this);
    this.updateGPUUI();
  }

  setScene(sc) {
    if (this.current && this.current !== sc) this.current.exit();
    this.current = sc;
    this.scenePass.enabled = true;
    this.bloom.strength = sc.post.bloom;
    this.bloom.radius = sc.post.bloomRadius;
    this.bloom.threshold = sc.post.threshold;
    this.renderer.toneMappingExposure = sc.post.exposure;
    const u = this.finalPass.uniforms;
    u.uVignette.value = sc.post.vignette;
    u.uAberration.value = sc.post.aberration;
    u.uGrain.value = sc.post.grain;
    u.uHaze.value = 0;
    sc.onResize(innerWidth, innerHeight);
    sc.enter();
  }

  goBuild() {
    $('menu').classList.add('hidden');
    this.setScene(this.build);
  }

  goLaunch(stack, missionId) {
    $('menu').classList.add('hidden');
    if (missionId) this.missionId = missionId;
    this.launchStack = stack;
    this.launch.setup(stack, this.missionId || 'free');
    this.setScene(this.launch);
  }

  toggleMenu(force) {
    const m = $('menu');
    const show = force !== undefined ? force : m.classList.contains('hidden');
    m.classList.toggle('hidden', !show);
    const settingsOpen = !$('settings').classList.contains('hidden');
    this.paused = show || settingsOpen;
  }

  toggleSettings(force) {
    const s = $('settings');
    const show = force !== undefined ? force : s.classList.contains('hidden');
    s.classList.toggle('hidden', !show);
    if (this.current === this.launch) {
      const menuOpen = !$('menu').classList.contains('hidden');
      this.paused = show || menuOpen;
    }
    audio.click();
  }

  initMenus() {
    const act = (a) => {
      $('menu').classList.add('hidden');
      $('result').classList.add('hidden');
      this.paused = false;
      if (a === 'restart') this.goLaunch(this.launchStack);
      if (a === 'build') this.goBuild();
    };
    document.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => act(b.dataset.act)));
    document.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => this.applyQuality(b.dataset.q, true, true)));
    document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
      this.applyLanguage(b.dataset.lang);
      audio.click();
    }));
    $('btn-settings').onclick = () => this.toggleSettings(true);
    $('btn-settings-close').onclick = () => this.toggleSettings(false);
    if ($('gpu-badge')) $('gpu-badge').onclick = () => this.toggleSettings(true);
    if ($('gpu-launch-badge')) $('gpu-launch-badge').onclick = () => this.toggleSettings(true);
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') return;
      if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        this.toggleSettings();
      } else if (e.key === 'Escape' && !$('settings').classList.contains('hidden')) {
        e.preventDefault();
        this.toggleSettings(false);
      }
    });
    document.addEventListener('pointerdown', () => audio.init(), { once: true });
  }

  onResize() {
    this.applyResolution();
    this.build.onResize(innerWidth, innerHeight);
    this.launch.onResize(innerWidth, innerHeight);
    this.finalPass.uniforms.uAspect.value = innerWidth / innerHeight;
    this.updateGPUUI();
  }

  /**
   * Dynamic resolution: every ~1.5 s look at the median frame time. If the game can't hold ~45 FPS,
   * drop the render scale by 10 % (down to 60 %); after several smooth windows, raise it back slowly.
   */
  adaptResolution(rawDt) {
    if (this.paused || document.hidden || rawDt <= 0 || rawDt > 0.5) return;
    this.frameTimes.push(rawDt);
    this.adaptAccum = (this.adaptAccum || 0) + rawDt;
    if (this.adaptAccum < 1.5) return;
    this.adaptAccum = 0;
    const arr = this.frameTimes.sort((a, b) => a - b);
    const median = arr[arr.length >> 1];
    this.frameTimes = [];
    const prev = this.renderScale;
    if (median > 1 / 45 && this.renderScale > 0.6) {
      this.renderScale = Math.max(0.6, +(this.renderScale - 0.1).toFixed(2));
      this.goodWindows = 0;
    } else if (median < 1 / 55) {
      if (++this.goodWindows >= 4 && this.renderScale < 1) {
        this.renderScale = Math.min(1, +(this.renderScale + 0.05).toFixed(2));
        this.goodWindows = 0;
      }
    } else {
      this.goodWindows = 0;
    }
    if (this.renderScale !== prev) {
      this.applyResolution();
      this.updateGPUUI();
    }
  }

  frame() {
    try {
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const u = this.finalPass.uniforms;
      u.uTime.value += dt;
      u.uAspect.value = innerWidth / innerHeight;
      if (this.renderer.info) this.renderer.info.reset();
      if (!this.paused && this.current) this.current.update(dt);
      this.composer.render(dt);
      this.adaptResolution(rawDt);

      // Update live GPU FPS & Draw Call telemetry every 0.35s
      if (rawDt > 0) {
        this.fpsAccum += rawDt;
        this.fpsFrames += 1;
        if (this.fpsAccum >= 0.35) {
          this.currentFps = Math.round(this.fpsFrames / this.fpsAccum);
          this.currentMs = (this.fpsAccum / this.fpsFrames) * 1000;
          this.fpsAccum = 0;
          this.fpsFrames = 0;
          const fpsTxt = `${this.currentFps} FPS`;
          const bFps = $('gpu-badge-fps');
          if (bFps) bFps.textContent = fpsTxt;
          const lFps = $('gpu-launch-fps');
          if (lFps) lFps.textContent = fpsTxt;
          const perf = $('gpu-perf');
          if (perf && this.renderer.info) {
            const rInfo = this.renderer.info.render;
            const tris = rInfo.triangles >= 1000 ? (rInfo.triangles / 1000).toFixed(1) + 'k' : rInfo.triangles;
            perf.textContent = `${this.currentFps} FPS (${this.currentMs.toFixed(1)} ms) · ${rInfo.calls} draws · ${tris} tris`;
          }
        }
      }
    } catch (err) {
      console.warn('Frame render error (recovered):', err);
    }
  }
}

new App().init().catch((e) => {
  console.error(e);
  $('load-text').textContent = 'Lỗi khởi tạo: ' + e.message;
});
