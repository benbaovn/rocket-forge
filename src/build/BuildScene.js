// Vehicle Assembly Building: drag & drop rocket construction
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PARTS, MAT, buildPart, radialPlacements } from '../parts.js';
import { MISSIONS, missionById } from '../missions.js';
import { buildRocket, computeStats, layout, newItem, cloneStack, stackFromTypes, PRESETS } from '../rocket.js';
import { latticeTower, lightCone } from '../env.js';
import * as TX from '../textures.js';
import { audio } from '../audio.js';
import { getLang, tr, PRESET_LABELS } from '../i18n.js';

const $ = (id) => document.getElementById(id);

export class BuildScene {
  constructor(app) {
    this.app = app;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 600);
    this.camera.position.set(22, 14, 30);
    this.controls = new OrbitControls(this.camera, app.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 180;
    this.controls.maxPolarAngle = Math.PI * 0.53;
    this.controls.target.set(0, 6, 0);
    this.controls.enabled = false;
    this.desiredTarget = new THREE.Vector3(0, 6, 0);
    this.post = { bloom: 0.55, bloomRadius: 0.5, threshold: 0.9, exposure: 1.0, ao: true, vignette: 0.4, aberration: 0.003, grain: 0.025 };

    this.stack = this.loadStack();
    this.history = [];
    this.selection = null;
    this.preview = null;
    this.rocket = null;
    this.time = 0;

    this.initEnvironment();
    this.initUI();
    this.rebuild(true);
  }

  // ------------------------------------------------------------------ environment
  initEnvironment() {
    const s = this.scene;
    const pmrem = new THREE.PMREMGenerator(this.app.renderer);
    s.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    s.environmentIntensity = 0.55;
    s.background = new THREE.Color(0x05070b);
    s.fog = new THREE.Fog(0x06080c, 70, 190);

    const conc = TX.concreteTextures();
    conc.map.repeat.set(10, 10); conc.rough.repeat.set(10, 10);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshPhysicalMaterial({
      map: conc.map, roughnessMap: conc.rough, roughness: 1, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.15,
    }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.6;
    floor.receiveShadow = true;
    s.add(floor);

    // hazard ring
    const hz = TX.hazardMap();
    const hzMat = new THREE.MeshStandardMaterial({ map: hz, roughness: 0.6 });
    hz.repeat.set(24, 1);
    const ring = new THREE.Mesh(new THREE.RingGeometry(5.4, 6.0, 128, 1), hzMat);
    ring.rotation.x = -Math.PI / 2; ring.position.y = -0.595; ring.receiveShadow = true;
    s.add(ring);

    // turntable pedestal
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.9, 0.6, 96), MAT.darkMetal);
    ped.position.y = -0.3; ped.receiveShadow = true; ped.castShadow = true;
    s.add(ped);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.04, 96), new THREE.MeshPhysicalMaterial({ color: 0x1a1d22, metalness: 0.9, roughness: 0.25 }));
    top.position.y = 0.0; top.receiveShadow = true;
    s.add(top);
    this.glowRing = new THREE.Mesh(new THREE.TorusGeometry(3.62, 0.035, 12, 160), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x4fd8ff, emissiveIntensity: 6 }));
    this.glowRing.rotation.x = Math.PI / 2; this.glowRing.position.y = 0.0;
    s.add(this.glowRing);

    // hangar walls
    const wall = TX.wallTextures();
    wall.map.repeat.set(12, 4); wall.normal.repeat.set(12, 4);
    const room = new THREE.Mesh(new THREE.BoxGeometry(160, 90, 160), new THREE.MeshStandardMaterial({ map: wall.map, normalMap: wall.normal, roughness: 0.7, metalness: 0.6, side: THREE.BackSide }));
    room.position.y = 43.4; room.receiveShadow = true;
    s.add(room);
    // columns & ceiling trusses
    const colMat = new THREE.MeshStandardMaterial({ color: 0x2a2e36, metalness: 0.8, roughness: 0.45 });
    const colGeo = new THREE.BoxGeometry(1.4, 90, 1.4);
    const cols = new THREE.InstancedMesh(colGeo, colMat, 32);
    let ci = 0;
    const m4 = new THREE.Matrix4();
    for (let i = -3; i <= 4 && ci < 32; i++) {
      for (const side of [[i * 20 - 10, -79], [i * 20 - 10, 79], [-79, i * 20 - 10], [79, i * 20 - 10]]) {
        if (ci >= 32) break;
        m4.makeTranslation(side[0], 44.4, side[1]); cols.setMatrixAt(ci++, m4);
      }
    }
    cols.castShadow = true; cols.receiveShadow = true;
    s.add(cols);
    for (let i = -3; i <= 3; i++) {
      const tr = latticeTower(150, 2.4, colMat, { step: 3, t: 0.3, brace: 0.14 });
      tr.rotation.z = Math.PI / 2; tr.position.set(75, 72, i * 22);
      s.add(tr);
    }

    // ceiling light strips
    const stripMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xfff2e0, emissiveIntensity: 9 });
    for (let i = -3; i <= 3; i++) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(120, 0.25, 0.8), stripMat);
      strip.position.set(0, 70, i * 22 + 11);
      s.add(strip);
    }
    // wall accent strips (cyan)
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x2aa8ff, emissiveIntensity: 5 });
    for (const z of [-79.3, 79.3]) {
      const a = new THREE.Mesh(new THREE.BoxGeometry(150, 0.15, 0.15), accentMat);
      a.position.set(0, 2.5, z); s.add(a);
    }
    for (const x of [-79.3, 79.3]) {
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 150), accentMat);
      a.position.set(x, 2.5, 0); s.add(a);
    }

    // scaffold towers
    const scafMat = new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.6, roughness: 0.5 });
    const platMat = new THREE.MeshStandardMaterial({ color: 0x3a3d44, metalness: 0.7, roughness: 0.5 });
    const lampMat = new THREE.MeshStandardMaterial({ emissive: 0xff3322, emissiveIntensity: 8, color: 0 });
    const platGeo = new THREE.BoxGeometry(5, 0.15, 2.6);
    const lampGeo = new THREE.SphereGeometry(0.12, 8, 8);
    for (const x of [-11, 11]) {
      const t = latticeTower(64, 2.6, scafMat, { step: 2.6, t: 0.16, brace: 0.07 });
      t.position.set(x, -0.6, -4);
      s.add(t);
      for (let y = 6; y < 64; y += 8) {
        const plat = new THREE.Mesh(platGeo, platMat);
        plat.position.set(x - Math.sign(x) * 3.8, y, -4); plat.castShadow = true; plat.receiveShadow = true;
        s.add(plat);
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.set(x, y + 0.6, -2.6);
        s.add(lamp);
      }
    }

    // lights
    s.add(new THREE.HemisphereLight(0x8fa8d0, 0x1a1612, 0.35));
    const spotPos = [[-22, 44, 18], [24, 46, 16], [-18, 42, -24], [20, 40, -22]];
    this.cones = [];
    this.spotLights = [];
    const qCfg = this.app.qualityCfg || { vabSpots: 2, vabShadow: 2048 };
    spotPos.forEach((p, i) => {
      const sp = new THREE.SpotLight(i === 1 ? 0xfff0dc : 0xe6efff, 5200, 0, 0.32, 0.65, 2);
      sp.position.set(...p);
      sp.target.position.set(0, 7, 0);
      sp.castShadow = i < (qCfg.vabSpots || 2);
      const shSz = qCfg.vabShadow || 2048;
      sp.shadow.mapSize.set(shSz, shSz);
      sp.shadow.bias = -0.00015;
      sp.shadow.normalBias = 0.018;
      sp.shadow.camera.near = 10; sp.shadow.camera.far = 120;
      s.add(sp, sp.target);
      this.spotLights.push(sp);
      const dir = new THREE.Vector3(0, 7, 0).sub(sp.position);
      const len = dir.length() * 1.15;
      const cone = lightCone(len, Math.tan(0.32) * len, new THREE.Color(i === 1 ? 0xffe6c8 : 0xd6e4ff), 0.1);
      cone.position.copy(sp.position);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
      s.add(cone);
      this.cones.push(cone);
      // lamp housing
      const lampHouse = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 1.4, 24), colMat);
      lampHouse.position.copy(sp.position); lampHouse.quaternion.copy(cone.quaternion);
      s.add(lampHouse);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(1.15, 24), new THREE.MeshStandardMaterial({ emissive: 0xffffff, emissiveIntensity: 30, color: 0 }));
      lens.position.copy(sp.position).add(dir.clone().multiplyScalar(0.72));
      lens.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().negate());
      s.add(lens);
    });

    // dust motes
    const N = 700;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 40; pos[i * 3 + 1] = Math.random() * 45; pos[i * 3 + 2] = (Math.random() - 0.5) * 40; }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xfff4e0, size: 0.035, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.add(this.dust);

    this.rocketHolder = new THREE.Group();
    s.add(this.rocketHolder);

    this.holoMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x4fd8ff, emissiveIntensity: 1.6, transparent: true, opacity: 0.45, depthWrite: false });
    this.selMat = new Map();

    // insertion indicator
    this.indicator = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.05, 8, 96), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffaa33, emissiveIntensity: 8 }));
    this.indicator.rotation.x = Math.PI / 2;
    this.indicator.visible = false;
    s.add(this.indicator);
  }

  // ------------------------------------------------------------------ persistence
  loadStack() {
    try {
      const raw = JSON.parse(localStorage.getItem('rf-stack') || 'null');
      if (Array.isArray(raw) && raw.every((r) => typeof r === 'string' && PARTS[r.split('+')[0]])) return stackFromTypes(raw);
    } catch { /* ignore */ }
    return stackFromTypes(Object.values(PRESETS)[0]);
  }

  saveStack() {
    localStorage.setItem('rf-stack', JSON.stringify(this.stack.map((s) => [s.type, ...s.attach].join('+'))));
  }

  pushHistory() {
    this.history.push(cloneStack(this.stack));
    if (this.history.length > 60) this.history.shift();
  }

  // ------------------------------------------------------------------ UI
  renderPalette() {
    const list = $('part-list');
    list.innerHTML = '';
    const cats = {};
    for (const [type, def] of Object.entries(PARTS)) (cats[def.cat] = cats[def.cat] || []).push(type);
    const thumbs = this.thumbs || (this.thumbs = this.makeThumbnails());
    for (const [cat, types] of Object.entries(cats)) {
      const h = document.createElement('div');
      h.className = 'cat';
      h.textContent = cat;
      list.appendChild(h);
      for (const type of types) {
        const def = PARTS[type];
        const card = document.createElement('div');
        card.className = 'part-card';
        const meta = [];
        meta.push(`${(def.dry + (def.fuel || 0)).toFixed(2)} t${def.kind === 'radial' ? tr(' mỗi chiếc', ' each') : ''}`);
        if (def.thrustVac) meta.push(`${def.thrustSL}–${def.thrustVac} kN · Isp ${def.ispVac}s`);
        card.innerHTML = `<img src="${thumbs[type]}" alt=""><div><div class="pc-name">${def.name}</div><div class="pc-meta">${meta.join('<br>')}<br>${def.desc}</div></div>`;
        card.addEventListener('pointerdown', (e) => this.startDrag(e, type, thumbs[type]));
        list.appendChild(card);
      }
    }
  }

  renderPresets() {
    const sel = $('preset');
    const lang = getLang();
    sel.innerHTML = `<option value="">${tr('📐 Mẫu tên lửa…', '📐 Rocket Presets…')}</option>`;
    for (const name of Object.keys(PRESETS)) {
      const o = document.createElement('option');
      o.value = name;
      o.textContent = PRESET_LABELS[name]?.[lang] || name;
      sel.appendChild(o);
    }
  }

  renderMissionCards() {
    const cards = $('mission-cards');
    cards.innerHTML = MISSIONS.map((m) => `<div class="mission-card" data-id="${m.id}"><div class="mc-ico">${m.icon}</div><div><div class="mc-name">${m.name}</div><div class="mc-desc">${m.desc}</div>${m.objectives.length ? '<ul>' + m.objectives.map((o) => '<li>' + o.text + '</li>').join('') + '</ul>' : ''}</div></div>`).join('');
    cards.querySelectorAll('.mission-card').forEach((el) => el.addEventListener('click', () => { this.setMission(el.dataset.id, true); $('mission-modal').classList.add('hidden'); audio.click(); }));
    const curM = missionById(this.missionId || 'free');
    const nm = $('mission-name');
    if (nm && curM) nm.textContent = curM.name;
  }

  refreshLanguage() {
    this.renderPalette();
    this.renderPresets();
    this.renderMissionCards();
    if (this.selection) this.select(this.selection);
    this.updateStats();
  }

  initUI() {
    this.thumbs = this.makeThumbnails();
    this.renderPalette();
    this.renderPresets();
    const sel = $('preset');
    sel.addEventListener('change', () => {
      if (!sel.value) return;
      this.pushHistory();
      this.stack = stackFromTypes(PRESETS[sel.value]);
      sel.value = '';
      this.select(null);
      this.rebuild(true);
      audio.click();
    });
    $('btn-undo').onclick = () => this.undo();
    $('btn-clear').onclick = () => { this.pushHistory(); this.stack = []; this.select(null); this.rebuild(true); };
    $('btn-del').onclick = () => this.deleteSelection();
    if ($('btn-side-toggle')) $('btn-side-toggle').onclick = () => this.toggleSideAttach();
    $('btn-launchpad').onclick = () => { audio.init(); this.app.goLaunch(cloneStack(this.stack), this.missionId); };

    // 3D rotation buttons
    $('btn-rot-x').onclick = (e) => this.rotateSelection('x', e.shiftKey ? -Math.PI / 2 : Math.PI / 2);
    $('btn-rot-y').onclick = (e) => this.rotateSelection('y', e.shiftKey ? -Math.PI / 2 : Math.PI / 2);
    $('btn-rot-z').onclick = (e) => this.rotateSelection('z', e.shiftKey ? -Math.PI / 2 : Math.PI / 2);
    $('btn-rot-reset').onclick = () => this.resetSelectionRot();

    $('bar-rot-x').onclick = (e) => this.rotateSelection('x', e.shiftKey ? -Math.PI / 2 : Math.PI / 2);
    $('bar-rot-y').onclick = (e) => this.rotateSelection('y', e.shiftKey ? -Math.PI / 2 : Math.PI / 2);
    $('bar-rot-z').onclick = (e) => this.rotateSelection('z', e.shiftKey ? -Math.PI / 2 : Math.PI / 2);
    $('bar-rot-reset').onclick = () => this.resetSelectionRot();

    // mission picker
    this.missionId = 'free';
    this.renderMissionCards();
    $('btn-mission').onclick = () => $('mission-modal').classList.remove('hidden');
    $('btn-mission-close').onclick = () => $('mission-modal').classList.add('hidden');

    window.addEventListener('pointermove', (e) => this.onDragMove(e));
    window.addEventListener('pointerup', (e) => this.onDragEnd(e));
    const c = this.app.canvas;
    c.addEventListener('pointerdown', (e) => { this.downPos = [e.clientX, e.clientY]; });
    c.addEventListener('pointerup', (e) => {
      if (!this.active || this.drag || !this.downPos) return;
      if (Math.hypot(e.clientX - this.downPos[0], e.clientY - this.downPos[1]) < 5 && e.button === 0) this.pickAt(e.clientX, e.clientY);
    });
    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.selection) { this.deleteSelection(); e.preventDefault(); }
      if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) { this.undo(); e.preventDefault(); return; }
      if (e.key === 'Escape') this.select(null);

      // 3-axis rotation shortcuts
      const k = e.key.toLowerCase();
      const delta = e.shiftKey ? -Math.PI / 2 : Math.PI / 2;
      if (k === 'x' || e.key === '1') {
        this.rotateSelection('x', delta);
        e.preventDefault();
      } else if (k === 'y' || e.key === '2') {
        this.rotateSelection('y', delta);
        e.preventDefault();
      } else if (k === 'r' || (k === 'z' && !e.ctrlKey && !e.metaKey) || e.key === '3') {
        this.rotateSelection('z', delta);
        e.preventDefault();
      }
    });
  }

  makeThumbnails() {
    const out = {};
    const S = 144;
    const r = this.app.renderer;
    const rt = new THREE.WebGLRenderTarget(S, S, { samples: 4, type: THREE.FloatType });
    const sc = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r);
    sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    const dl = new THREE.DirectionalLight(0xffffff, 2.5); dl.position.set(3, 5, 4); sc.add(dl);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const px = new Float32Array(S * S * 4);
    const cv = document.createElement('canvas'); cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(S, S);
    const prevTM = r.toneMapping;
    for (const type of Object.keys(PARTS)) {
      let obj;
      if (type === 'fins') { obj = new THREE.Group(); for (let i = 0; i < 4; i++) { const f = buildPart('fins'); f.rotation.y = i * Math.PI / 2 + Math.PI / 4; obj.add(f); } }
      else if (type === 'legs' || type === 'gridfins') {
        obj = new THREE.Group();
        for (let i = 0; i < 4; i++) { const f = buildPart(type); f.rotation.y = i * Math.PI / 2 + Math.PI / 4; f.userData.setDeploy(1); obj.add(f); }
      }
      else if (type === 'wheelsRover') {
        obj = new THREE.Group();
        for (const pl of radialPlacements('wheelsRover')) {
          const w = buildPart('wheelsRover');
          w.position.set(Math.cos(pl.angle) * 0.7, 0, (pl.offsetZ || 0) * 0.7);
          w.rotation.y = -pl.angle;
          obj.add(w);
        }
      }
      else if (type === 'floatsBoat') {
        obj = new THREE.Group();
        for (const pl of radialPlacements('floatsBoat')) {
          const fl = buildPart('floatsBoat');
          fl.position.set(Math.cos(pl.angle) * 0.7, 0, 0);
          fl.rotation.y = -pl.angle;
          obj.add(fl);
        }
      }
      else if (type === 'solarRover' || type === 'solarPanel') {
        obj = new THREE.Group();
        for (const pl of radialPlacements(type)) {
          const sl = buildPart(type);
          sl.position.set(Math.cos(pl.angle) * 0.45, 0, 0);
          sl.rotation.y = -pl.angle;
          obj.add(sl);
        }
      }
      else if (type === 'wingsPlane') {
        obj = new THREE.Group();
        for (const pl of radialPlacements('wingsPlane')) {
          const w = buildPart('wingsPlane');
          w.position.set(Math.cos(pl.angle) * 0.5, 0, 0);
          w.rotation.y = -pl.angle;
          obj.add(w);
        }
      }
      else if (type === 'gearPlane') {
        obj = new THREE.Group();
        for (const pl of radialPlacements('gearPlane')) {
          const gp = buildPart('gearPlane');
          gp.position.set(Math.cos(pl.angle) * 0.45, 0, (pl.offsetZ || 0) * 0.45);
          gp.rotation.y = -pl.angle;
          obj.add(gp);
        }
      }
      else obj = buildPart(type);
      sc.add(obj);
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
      const d = Math.max(size.x, size.y, size.z) / (2 * Math.tan((cam.fov * Math.PI / 180) / 2)) * 1.25;
      cam.position.set(ctr.x + d * 0.62, ctr.y + d * 0.35, ctr.z + d * 0.72);
      cam.lookAt(ctr);
      try {
        r.setRenderTarget(rt);
        r.setClearColor(0x000000, 0);
        r.clear();
        r.render(sc, cam);
        r.readRenderTargetPixels(rt, 0, 0, S, S, px);
        const aces = (x) => { x *= 1.1; const v = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14); return Math.min(1, Math.max(0, v)); };
        const srgb = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255;
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
          const si = ((S - 1 - y) * S + x) * 4, di = (y * S + x) * 4;
          img.data[di] = srgb(aces(px[si])); img.data[di + 1] = srgb(aces(px[si + 1])); img.data[di + 2] = srgb(aces(px[si + 2]));
          img.data[di + 3] = Math.min(255, px[si + 3] * 255);
        }
        ctx.putImageData(img, 0, 0);
        out[type] = cv.toDataURL();
      } catch (e) { console.warn('thumbnail failed', type, e); out[type] = ''; }
      sc.remove(obj);
    }
    r.setRenderTarget(null);
    r.toneMapping = prevTM;
    pm.dispose();
    rt.dispose();
    return out;
  }

  // ------------------------------------------------------------------ drag & drop
  /** choose a mission; optionally load its recommended rocket */
  setMission(id, loadPreset = false) {
    const m = missionById(id);
    this.missionId = m.id;
    this.app.missionId = m.id;
    const nm = document.getElementById('mission-name');
    if (nm) nm.textContent = m.name;
    if (loadPreset && m.preset && PRESETS[m.preset]) {
      this.pushHistory();
      this.stack = stackFromTypes(PRESETS[m.preset]);
      this.select(null);
      this.rebuild(true);
    }
  }

  startDrag(e, type, thumb) {
    if (e.button !== 0) return;
    e.preventDefault();
    audio.init();
    const ghost = document.createElement('img');
    ghost.src = thumb; ghost.className = 'drag-ghost';
    ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
    document.body.appendChild(ghost);
    this.drag = { type, ghost, start: [e.clientX, e.clientY], moved: false, cand: null };
  }

  onDragMove(e) {
    const d = this.drag;
    if (!d) return;
    d.ghost.style.left = e.clientX + 'px'; d.ghost.style.top = e.clientY + 'px';
    if (Math.hypot(e.clientX - d.start[0], e.clientY - d.start[1]) > 6) d.moved = true;
    const overCanvas = document.elementFromPoint(e.clientX, e.clientY) === this.app.canvas;
    const cand = overCanvas ? this.findCandidate(d.type, e.clientX, e.clientY) : null;
    const key = cand ? JSON.stringify(cand) : null;
    if (key !== d.candKey) {
      d.candKey = key; d.cand = cand;
      this.showPreview(d.type, cand);
    }
    d.ghost.style.opacity = cand ? 0.25 : 0.85;
  }

  onDragEnd(e) {
    const d = this.drag;
    if (!d) return;
    d.ghost.remove();
    this.drag = null;
    this.indicator.visible = false;
    if (d.cand) this.applyCandidate(d.type, d.cand);
    else if (!d.moved) this.smartAdd(d.type);
    else this.rebuild();
  }

  screenOf(y) {
    const v = new THREE.Vector3(0, y, 0).project(this.camera);
    return [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight];
  }

  findCandidate(type, mx, my) {
    const def = PARTS[type];
    const lay = layout(this.stack);
    // 1. Pure radial parts can attach to any part on the rocket
    if (def.kind === 'radial') {
      let best = null, bd = 1e9;
      lay.parts.forEach((p) => {
        if (p.item.attach.includes(type)) return;
        const [sx, sy] = this.screenOf(p.y + p.def.height / 2);
        const d = Math.hypot(sx - mx, sy - my);
        if (d < bd) { bd = d; best = { attach: p.index }; }
      });
      return bd < 280 ? best : null;
    }

    // 2. Stack parts: if dragged to the LEFT or RIGHT side of any existing part on the rocket, attach to BOTH SIDES!
    if (this.stack.length > 0) {
      let sideBest = null, sideBd = 1e9;
      lay.parts.forEach((p) => {
        if (p.item.attach.includes(type)) return;
        const [sx, sy] = this.screenOf(p.y + p.def.height / 2);
        const dx = Math.abs(mx - sx);
        const dy = Math.abs(my - sy);
        if (dx >= 24 && dx < 280 && dy < 105) {
          const d = Math.hypot(dx - 55, dy * 1.2);
          if (d < sideBd) { sideBd = d; sideBest = { attach: p.index }; }
        }
      });
      if (sideBest) return sideBest;
    }

    // 3. Otherwise insert vertically into the center stack
    const n = this.stack.length;
    let best = null, bd = 1e9;
    for (let k = 0; k <= n; k++) {
      const y = k === n ? 0 : lay.parts[k].y + lay.parts[k].def.height;
      const [sx, sy] = this.screenOf(y);
      const d = Math.hypot((sx - mx) * 0.35, sy - my);
      if (d < bd) { bd = d; best = { insert: k, y }; }
    }
    return bd < 300 ? best : null;
  }

  showPreview(type, cand) {
    if (!cand) { this.indicator.visible = false; this.rebuild(); return; }
    const st = cloneStack(this.stack);
    let hiIndex, hiAttach = null;
    if (cand.attach !== undefined) { st[cand.attach].attach.push(type); hiIndex = cand.attach; hiAttach = type; }
    else { st.splice(cand.insert, 0, newItem(type)); hiIndex = cand.insert; }
    this.rebuild(false, st, { index: hiIndex, attach: hiAttach });
    const lay = layout(st);
    const p = lay.parts[hiIndex];
    this.indicator.visible = true;
    this.indicator.position.y = cand.attach !== undefined ? p.y + p.def.height / 2 : p.y + p.def.height / 2;
    this.indicator.scale.setScalar(cand.attach !== undefined ? 1.6 : 1);
  }

  applyCandidate(type, cand) {
    this.pushHistory();
    if (cand.attach !== undefined) this.stack[cand.attach].attach.push(type);
    else this.stack.splice(cand.insert, 0, newItem(type));
    audio.click();
    this.rebuild(true);
  }

  smartAdd(type) {
    const def = PARTS[type];
    const st = this.stack;
    this.pushHistory();
    const isTank = (i) => !!PARTS[st[i].type].fuel;
    // stage ranges (top -> bottom), split at decouplers
    const stages = [];
    st.forEach((it, i) => { if (!stages.length || (it.type === 'decoupler' && stages[stages.length - 1].length)) stages.push([]); stages[stages.length - 1].push(i); });
    let placed = false;
    if (type === 'legs') {
      // lowest tank of the bottom-most stage that has no legs yet
      for (let s = stages.length - 1; s >= 0 && !placed; s--) {
        const idx = stages[s];
        if (idx.some((i) => st[i].attach.includes('legs'))) continue;
        for (let j = idx.length - 1; j >= 0; j--) if (isTank(idx[j])) { st[idx[j]].attach.push('legs'); placed = true; break; }
      }
    } else if (type === 'gridfins') {
      // topmost tank of the bottom stage (directly below the lowest decoupler)
      const idx = stages[stages.length - 1] || [];
      for (const i of idx) if (isTank(i)) { if (!st[i].attach.includes('gridfins')) { st[i].attach.push('gridfins'); placed = true; } break; }
    } else if (type === 'solarPanel') {
      // prefer upper-stage tank or capsule/cabin first
      for (let i = 0; i < st.length; i++) {
        if (isTank(i) && !st[i].attach.includes('solarPanel')) { st[i].attach.push('solarPanel'); placed = true; break; }
      }
      if (!placed) {
        for (let i = 0; i < st.length; i++) {
          const t = st[i].type;
          if ((t === 'capsule' || t.startsWith('cockpit') || t.startsWith('cabin')) && !st[i].attach.includes('solarPanel')) {
            st[i].attach.push('solarPanel'); placed = true; break;
          }
        }
      }
    }
    if (placed) { /* done */ } else if (def.kind === 'radial') {
      // lowest tank without this attachment, or fallback to any part in stack
      for (let i = st.length - 1; i >= 0; i--) {
        if (PARTS[st[i].type].fuel && !st[i].attach.includes(type)) { st[i].attach.push(type); placed = true; break; }
      }
      if (!placed) {
        for (let i = st.length - 1; i >= 0; i--) {
          if (!st[i].attach.includes(type)) { st[i].attach.push(type); placed = true; break; }
        }
      }
    } else if (type === 'nose' || type === 'capsule' || type === 'dockPort') st.unshift(newItem(type));
    else if (def.thrustVac || type === 'decoupler') st.push(newItem(type));
    else {
      // tanks: above the bottom engine
      let k = st.length;
      if (k && PARTS[st[k - 1].type].thrustVac) k--;
      st.splice(k, 0, newItem(type));
    }
    audio.click();
    this.rebuild(true);
  }

  // ------------------------------------------------------------------ selection
  pickAt(x, y) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1), this.camera);
    const hits = ray.intersectObject(this.rocketHolder, true);
    if (!hits.length) { this.select(null); return; }
    let o = hits[0].object;
    while (o && o.userData.index === undefined) o = o.parent;
    if (!o) { this.select(null); return; }
    this.select({ index: o.userData.index, attach: o.userData.attach || null });
    audio.click();
  }

  select(sel) {
    this.selection = sel;
    this.applyHighlight();
    const box = $('sel-box');
    if (!sel) {
      box.classList.add('hidden');
      this.updateRotUI();
      return;
    }
    const it = this.stack[sel.index];
    if (!it) { box.classList.add('hidden'); return; }
    const def = PARTS[sel.attach || it.type];
    $('sel-name').textContent = def.name;
    $('sel-desc').textContent = def.desc;
    const sideBtn = $('btn-side-toggle');
    if (sideBtn) {
      if (sel.attach) {
        if (PARTS[sel.attach]?.kind === 'stack') {
          sideBtn.classList.remove('hidden');
          sideBtn.textContent = tr('↕ Đưa vào trục giữa', '↕ Move to Center Stack');
        } else {
          sideBtn.classList.add('hidden');
        }
      } else if (this.stack.length > 1) {
        sideBtn.classList.remove('hidden');
        sideBtn.textContent = tr('↔ Gắn sang 2 bên', '↔ Attach to Both Sides');
      } else {
        sideBtn.classList.add('hidden');
      }
    }
    this.updateRotUI();
    box.classList.remove('hidden');
  }

  toggleSideAttach() {
    const sel = this.selection;
    if (!sel) return;
    const it = this.stack[sel.index];
    if (!it) return;
    if (sel.attach) {
      const aType = sel.attach;
      if (PARTS[aType]?.kind !== 'stack') return;
      this.pushHistory();
      it.attach.splice(it.attach.indexOf(aType), 1);
      if (it.attachRot) delete it.attachRot[aType];
      const newIdx = sel.index + 1;
      this.stack.splice(newIdx, 0, newItem(aType));
      this.select({ index: newIdx, attach: null });
      audio.click();
      this.rebuild(true);
    } else if (this.stack.length > 1) {
      const partType = it.type;
      // Pick an adjacent part to attach onto (prefer tank or part above/below)
      let hostIdx = sel.index > 0 ? sel.index - 1 : sel.index + 1;
      for (const candIdx of [sel.index - 1, sel.index + 1]) {
        if (candIdx >= 0 && candIdx < this.stack.length && !this.stack[candIdx].attach.includes(partType)) {
          hostIdx = candIdx;
          if (PARTS[this.stack[candIdx].type]?.fuel) break;
        }
      }
      if (this.stack[hostIdx].attach.includes(partType)) return;
      this.pushHistory();
      this.stack[hostIdx].attach.push(partType);
      this.stack.splice(sel.index, 1);
      const finalHostIdx = hostIdx > sel.index ? hostIdx - 1 : hostIdx;
      this.select({ index: finalHostIdx, attach: partType });
      audio.click();
      this.rebuild(true);
    }
  }

  getSelectionRot() {
    if (!this.selection) return [0, 0, 0];
    const sel = this.selection;
    const it = this.stack[sel.index];
    if (!it) return [0, 0, 0];
    if (sel.attach) {
      return (it.attachRot && it.attachRot[sel.attach]) || [0, 0, 0];
    }
    return it.rot || [0, 0, 0];
  }

  updateRotUI() {
    const [rx, ry, rz] = this.getSelectionRot();
    const toDeg = (rad) => {
      const deg = Math.round((((rad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * 180 / Math.PI);
      return deg === 360 ? 0 : deg;
    };
    const degX = toDeg(rx);
    const degY = toDeg(ry);
    const degZ = toDeg(rz);
    const text = `X: ${degX}° · Y: ${degY}° · Z: ${degZ}°`;
    const angleEl = $('sel-angles');
    if (angleEl) angleEl.textContent = text;
  }

  rotateSelection(axis, delta = Math.PI / 2) {
    let sel = this.selection;
    if (!sel) {
      if (this.stack.length > 0) {
        sel = { index: this.stack.length - 1, attach: null };
        this.select(sel);
      } else return;
    }
    this.pushHistory();
    const it = this.stack[sel.index];
    if (!it) return;
    const axisIdx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;

    const norm = (a) => {
      const twoPi = Math.PI * 2;
      let res = a % twoPi;
      if (res < -1e-5) res += twoPi;
      if (Math.abs(res) < 1e-5 || Math.abs(res - twoPi) < 1e-5) return 0;
      return res;
    };

    if (sel.attach) {
      if (!it.attachRot) it.attachRot = {};
      if (!it.attachRot[sel.attach]) it.attachRot[sel.attach] = [0, 0, 0];
      const r = it.attachRot[sel.attach];
      r[axisIdx] = norm(r[axisIdx] + delta);
    } else {
      if (!it.rot) it.rot = [0, 0, 0];
      it.rot[axisIdx] = norm(it.rot[axisIdx] + delta);
    }

    this.rebuild(true, this.stack, this.selection);
    this.updateRotUI();
    audio.click();
  }

  resetSelectionRot() {
    let sel = this.selection;
    if (!sel) {
      if (this.stack.length > 0) {
        sel = { index: this.stack.length - 1, attach: null };
        this.select(sel);
      } else return;
    }
    this.pushHistory();
    const it = this.stack[sel.index];
    if (!it) return;
    if (sel.attach) {
      if (it.attachRot && it.attachRot[sel.attach]) {
        it.attachRot[sel.attach] = [0, 0, 0];
      }
    } else {
      it.rot = [0, 0, 0];
    }
    this.rebuild(true, this.stack, this.selection);
    this.updateRotUI();
    audio.click();
  }

  applyHighlight() {
    if (!this.rocket) return;
    const sel = this.selection;
    this.rocket.root.traverse((o) => {
      if (!o.isMesh) return;
      if (o.userData.origMat) { o.material = o.userData.origMat; delete o.userData.origMat; }
    });
    if (!sel) return;
    this.rocket.root.traverse((o) => {
      if (!o.isMesh) return;
      let p = o;
      while (p && p.userData.index === undefined) p = p.parent;
      if (!p || p.userData.index !== sel.index || (p.userData.attach || null) !== sel.attach) return;
      o.userData.origMat = o.material;
      let m = this.selMat.get(o.material);
      if (!m) { m = o.material.clone(); m.emissive = new THREE.Color(0x4fd8ff); m.emissiveIntensity = 0.35; this.selMat.set(o.material, m); }
      o.material = m;
    });
  }

  deleteSelection() {
    const sel = this.selection;
    if (!sel) return;
    this.pushHistory();
    if (sel.attach) {
      const a = this.stack[sel.index].attach;
      a.splice(a.indexOf(sel.attach), 1);
      if (this.stack[sel.index].attachRot) delete this.stack[sel.index].attachRot[sel.attach];
    } else this.stack.splice(sel.index, 1);
    this.select(null);
    audio.click();
    this.rebuild(true);
  }

  undo() {
    if (!this.history.length) return;
    this.stack = this.history.pop();
    this.select(null);
    this.rebuild(true);
    audio.click();
  }

  // ------------------------------------------------------------------ rebuild
  rebuild(commit = false, stack = this.stack, highlight = null) {
    if (this.rocket) {
      this.rocketHolder.remove(this.rocket.root);
      this.rocket.root.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
    }
    this.rocket = buildRocket(stack);
    this.rocketHolder.add(this.rocket.root);
    if (highlight) {
      this.rocket.root.traverse((o) => {
        if (!o.isMesh) return;
        let p = o;
        while (p && p.userData.index === undefined) p = p.parent;
        if (p && p.userData.index === highlight.index && (p.userData.attach || null) === highlight.attach) o.material = this.holoMat;
      });
    } else this.applyHighlight();
    const h = this.rocket.layout.height;
    this.desiredTarget.set(0, Math.max(3, h * 0.45), 0);
    if (commit) {
      this.saveStack();
      this.updateStats();
      this.fitTime = 0.8;
      this.desiredDist = Math.max(16, h * 1.72 + 8);
      if (!this.active) {
        this.controls.target.copy(this.desiredTarget);
        const off = this.camera.position.clone().sub(this.controls.target);
        const d = off.length() || 1;
        this.camera.position.copy(this.controls.target).add(off.multiplyScalar(this.desiredDist / d));
        this.controls.update();
      }
    }
  }

  updateStats() {
    const st = computeStats(this.stack);
    $('st-mass').textContent = st.totalMass.toFixed(1) + ' t';
    $('st-height').textContent = st.height.toFixed(1) + ' m';
    const twr = st.stages[0] ? st.stages[0].twr : 0;
    const twrEl = $('st-twr');
    twrEl.textContent = st.stages.length ? twr.toFixed(2) : '–';
    twrEl.style.color = twr >= 1.2 ? 'var(--ok)' : twr >= 1 ? '#ffd23d' : 'var(--danger)';
    $('st-dv').textContent = Math.round(st.totalDv) + ' m/s';
    $('dv-fill').style.width = Math.min(100, (st.totalDv / 9000) * 100) + '%';
    $('stage-list').innerHTML = st.stages.map((s) => `<div class="stage-row"><span class="sn">${tr('Tầng', 'Stage')} ${s.num}</span><span>Δv ${Math.round(s.dv)}</span><span>TWR ${s.twr.toFixed(2)}</span></div>`).join('');
    const w = $('warnings');
    w.innerHTML = st.warnings.length ? st.warnings.map((x) => `<div>⚠ ${x}</div>`).join('') : `<div class="ok">✔ ${tr('Tên lửa sẵn sàng phóng!', 'Rocket is ready for launch!')}</div>`;
    $('btn-launchpad').disabled = !this.stack.length;
    this.stats = st;
  }

  // ------------------------------------------------------------------ lifecycle
  enter() {
    this.active = true;
    this.controls.enabled = true;
    $('build-ui').classList.remove('hidden');
    this.updateStats();
    audio.ambience(true);
  }

  exit() {
    this.active = false;
    this.controls.enabled = false;
    $('build-ui').classList.add('hidden');
    this.select(null);
    audio.ambience(false);
  }

  onResize(w, h) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }

  update(dt) {
    this.time += dt;
    this.controls.target.lerp(this.desiredTarget, 1 - Math.exp(-dt * 5));
    if (this.fitTime > 0) {
      this.fitTime -= dt;
      const off = this.camera.position.clone().sub(this.controls.target);
      const d = off.length();
      const nd = d + (this.desiredDist - d) * (1 - Math.exp(-dt * 6));
      this.camera.position.copy(this.controls.target).add(off.multiplyScalar(nd / d));
    }
    this.controls.update();
    this.rocketHolder.rotation.y += dt * (this.drag ? 0 : 0.06);
    this.glowRing.material.emissiveIntensity = 5 + Math.sin(this.time * 2) * 1.5;
    this.indicator.material.emissiveIntensity = 6 + Math.sin(this.time * 10) * 3;
    for (const c of this.cones) c.material.uniforms.uTime.value = this.time;
    const p = this.dust.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) + dt * 0.15 * Math.sin(i + this.time * 0.3);
      if (y > 45) y = 0; if (y < 0) y = 45;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.sin(this.time * 0.2 + i) * dt * 0.05);
    }
    p.needsUpdate = true;
  }
}
