// Launch site + flight simulation scene
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PARTS, G0, R as CORE_R } from '../parts.js';
import { buildRocket, segments, segmentInfo, layout } from '../rocket.js';
import { createSkyMaterial, atmosphereJS, sunTransmittance, PLANET_R } from '../fx/atmosphere.js';
import { createEarth, createStars, NOISE_GLSL } from '../fx/earth.js';
import { ParticleSystem } from '../fx/particles.js';
import { createPlume } from '../fx/plume.js';
import { latticeTower } from '../env.js';
import * as TX from '../textures.js';
import { audio } from '../audio.js';
import { Vessel } from './vessel.js';
import { RailOrbit, moonAngle, moonPos, moonVel, bodyPos, bodyAngle, wrapPi, angOf, predict, bodyRotation, bodyState, coastStep, rk4, refBody, bodyInfo } from '../sim/orbit.js';
import { R_E, R_M, ISS_R, MOON_PHASE0, OMEGA_E, LZ_X, COAST_X, G0 as G_E, MU_E, MU_M, ATM_TOP, BODIES, NON_EARTH_BODIES } from '../sim/constants.js';
import { AscentProgram, BoosterRecovery, RendezvousProgram, MoonProgram, vesselElements, progradeBeta } from '../sim/guidance.js';
import { MapView } from '../ui/MapView.js';
import { MISSIONS, missionById } from '../missions.js';
import { createISS } from '../env/iss.js';
import { createLandingZone, createDroneShip, createFlag } from '../env/sites.js';
import { createMoon, createSunSphere, createPlanetSphere, createMoonSurface, moonHeight } from '../fx/moon.js';
import { tr } from '../i18n.js';

const $ = (id) => document.getElementById(id);
const PAD_TOP = 9.0;       // rocket base height on the launch mount
const PAD_RADIUS = 45;
const BEND = 1 / (2 * R_E);
const SUN_ECI = new THREE.Vector3(0.62, 0.24, 0.75).normalize();
const fmt = (v, d = 0) => v.toLocaleString('vi-VN', { maximumFractionDigits: d, minimumFractionDigits: d });
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const WARPS = [1, 2, 4, 10, 50, 100, 1000, 10000];
const SAS_MODES_VI = ['Giữ hướng', 'Prograde', 'Retrograde', 'Hướng tâm ra', 'Hướng tâm vào', 'Mục tiêu', 'Ngược mục tiêu'];
const SAS_MODES_EN = ['Hold Attitude', 'Prograde', 'Retrograde', 'Radial Out', 'Radial In', 'Target', 'Anti-Target'];
const CAM_MODES_VI = ['Bám theo', 'Tháp quan sát', 'Gắn trên thân', 'Điện ảnh'];
const CAM_MODES_EN = ['Chase', 'Tracking Tower', 'Onboard', 'Cinematic'];

export class LaunchScene {
  constructor(app) {
    this.app = app;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.5, 3e5);
    this.camera.layers.enable(1);
    this.pipCamera = new THREE.PerspectiveCamera(45, 1.6, 0.5, 3e5);
    this.pipCamera.layers.enable(1);
    this.controls = new OrbitControls(this.camera, app.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 6000;
    this.controls.enabled = false;
    this.controls.enablePan = false;
    this.sunDir = SUN_ECI.clone();
    this.envSun = new THREE.Vector3(0, 1, 0);
    this.post = { bloom: 0.7, bloomRadius: 0.55, threshold: 1.0, exposure: 1.0, ao: false, vignette: 0.35, aberration: 0.004, grain: 0.03 };
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.time = 0;
    this.keys = {};
    this.shake = new THREE.Vector3();
    this.camMode = 0;
    this.camModes = ['Bám theo', 'Tháp quan sát', 'Gắn trên thân', 'Điện ảnh'];
    this.envBand = -1;
    this.debris = [];
    this.vessels = [];
    this.focus = null;
    this.mission = missionById('free');
    this.simT = 0;
    this.launchCounter = 0;
    this.stageCounter = 0;
    try {
      this.spaceObjects = JSON.parse(localStorage.getItem('rf-space-objects') || '[]') || [];
    } catch {
      this.spaceObjects = [];
    }
    this.map = new MapView($('map'), $('map-legend'));
    this.map.onDeleteObject = (id) => this.deleteSpaceObject(id);
    this.sasMode = 0;
    this.warp = 1; this.autoWarp = 1;

    this.initSky();
    this.initGround();
    this.initPad();
    this.initSites();
    this.initFX();
    this.initUI();
  }

  refreshLanguage() {
    this.camModes = tr(CAM_MODES_VI, CAM_MODES_EN);

    if (this.player) {
      this.renderMissionPanel(true);
      this.hudTimer = 0;
      this.updateHUD(0);
    }
  }

  // =================================================================== SKY & LIGHT
  initSky() {
    this.skyMat = createSkyMaterial(this.sunDir);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 64, 32), this.skyMat);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -1;
    this.sky.layers.set(1);
    this.scene.add(this.sky);

    this.envScene = new THREE.Scene();
    this.envSky = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), this.skyMat);
    this.envScene.add(this.envSky);
    this.pmrem = new THREE.PMREMGenerator(this.app.renderer);

    this.stars = createStars();
    this.stars.layers.set(1);
    this.scene.add(this.stars);

    this.earth = createEarth(this.sunDir);
    this.earth.layers.set(1);
    this.scene.add(this.earth);

    this.sunSphere = createSunSphere();
    this.scene.add(this.sunSphere);

    this.moon = createMoon();
    this.moon.layers.set(1);
    this.scene.add(this.moon);
    this.planets = {};
    for (const name of NON_EARTH_BODIES) {
      const pm = createPlanetSphere(name);
      pm.layers.set(1);
      this.scene.add(pm);
      this.planets[name] = pm;
    }
    this.moonPatch = createMoonSurface();
    this.moonPatch.visible = false;
    this.moonPatchPsi = null;
    this.scene.add(this.moonPatch);

    this.sun = new THREE.DirectionalLight(0xffffff, 6);
    this.sun.castShadow = true;
    const sc = this.sun.shadow.camera;
    sc.left = -60; sc.right = 60; sc.top = 60; sc.bottom = -60; sc.near = 1; sc.far = 700;
    this.sun.shadow.mapSize.set(4096, 4096);
    this.sun.shadow.bias = -0.0002;
    this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight(0x8899bb, 0x2a2418, 0.6);
    this.scene.add(this.hemi);
    this.scene.fog = new THREE.FogExp2(0x9aa6b8, 5e-5);
  }

  updateAtmosphere(alt) {
    const sun = this.sunDir.toArray();
    // sun light colour
    const T = sunTransmittance(Math.max(alt, 0), sun);
    const k = 7.0;
    this.sun.color.setRGB(T[0], T[1], T[2]);
    this.sun.intensity = k;
    // fog colour: horizon toward view-ish direction (average of two azimuths)
    const a1 = atmosphereJS([0.72, 0.03, -0.69], Math.max(alt, 1), sun);
    const a2 = atmosphereJS([-0.9, 0.03, 0.42], Math.max(alt, 1), sun);
    const fog = this.scene.fog;
    fog.color.setRGB((a1[0] + a2[0]) * 0.5, (a1[1] + a2[1]) * 0.5, (a1[2] + a2[2]) * 0.5);
    fog.density = 4.2e-5 * Math.exp(-Math.max(alt, 0) / 7000);
    const up = atmosphereJS([0, 1, 0], Math.max(alt, 1), sun);
    this.hemi.color.setRGB(up[0] * 1.6 + 0.02, up[1] * 1.6 + 0.02, up[2] * 1.6 + 0.03);
    this.hemi.groundColor.setRGB(0.12 * T[0], 0.1 * T[1], 0.07 * T[2]);
    this.hemi.intensity = 0.9;
    // smoke lighting
    const sm = this.smoke.material.uniforms;
    sm.uSunColor.value.setRGB(T[0] * 1.15, T[1] * 1.1, T[2] * 1.05);
    sm.uAmbient.value.setRGB(up[0] * 0.9 + 0.05, up[1] * 0.9 + 0.05, up[2] * 0.9 + 0.06);
    sm.uFogColor.value.copy(fog.color);
    sm.uFogDensity.value = fog.density;
    this.fire.material.uniforms.uFogDensity.value = fog.density * 0.5;
    this.cloudMat.uniforms.uSunCol.value.setRGB(T[0] * 1.3, T[1] * 1.25, T[2] * 1.2);
    this.cloudMat.uniforms.uFogColor.value.copy(fog.color);
    // environment map refresh by altitude band
    const bands = [0, 2500, 6000, 12000, 20000, 32000, 50000, 75000, 110000];
    let band = 0;
    while (band < bands.length - 1 && alt > bands[band + 1]) band++;
    if (band !== this.envBand || (this.sunDir.angleTo(this.envSun) > 0.1 && this.time - (this.envT || 0) > 0.5)) {
      this.envBand = band; this.envT = this.time; this.envSun.copy(this.sunDir);
      this.skyMat.uniforms.uAlt.value = Math.max(bands[band], 1);
      this.skyMat.uniforms.uSun.value.copy(this.sunDir);
      const rt = this.pmrem.fromScene(this.envScene, 0, 0.1, 200);
      if (this.envRT) this.envRT.dispose();
      this.envRT = rt;
      this.scene.environment = rt.texture;
    }
  }

  // =================================================================== GROUND
  initGround() {
    this.groundUniforms = { uTime: { value: 0 }, uOff: { value: new THREE.Vector2() }, uBend: { value: BEND } };
    const gmat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0, transparent: true });
    gmat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = this.groundUniforms.uTime;
      sh.uniforms.uOff = this.groundUniforms.uOff;
      sh.uniforms.uBend = this.groundUniforms.uBend;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vLocal;\nuniform vec2 uOff;\nuniform float uBend;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position.xy + uOff;')
        .replace('#include <project_vertex>', `
          vec4 mvPosition = vec4( transformed, 1.0 );
          vec4 wpB = modelMatrix * mvPosition;
          wpB.y -= dot(wpB.xz, wpB.xz) * uBend;
          mvPosition = viewMatrix * wpB;
          gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\nvarying vec2 vLocal;\nuniform float uTime;\n${NOISE_GLSL}\n
          float segDist(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }`)
        .replace('vec4 diffuseColor = vec4( diffuse, opacity );', /* glsl */`
          vec2 p = vLocal;
          float coast = 2600.0;
          float land = smoothstep(coast + 30.0, coast - 30.0, p.x);
          float n1 = fbm3(vec3(p * 0.0011, 2.0), 6);
          float n2 = fbm3(vec3(p * 0.011, 3.0), 4);
          float n3 = fbm3(vec3(p * 0.09, 5.0), 3);
          vec3 grass = mix(vec3(0.055, 0.085, 0.03), vec3(0.15, 0.15, 0.06), n1);
          grass = mix(grass, vec3(0.19, 0.16, 0.10), smoothstep(0.55, 0.72, n2) * 0.7);
          grass = mix(grass, vec3(0.03, 0.06, 0.025), smoothstep(0.6, 0.8, fbm3(vec3(p * 0.004, 8.0), 4)) * 0.8);
          vec3 sand = vec3(0.6, 0.53, 0.4);
          float beach = smoothstep(coast - 15.0, coast - 160.0, p.x);
          vec3 landCol = mix(sand, grass, beach);
          // marsh / lagoons inland
          float lagoon = smoothstep(0.66, 0.68, fbm3(vec3(p * 0.0007, 11.0), 5)) * step(p.x, coast - 300.0);
          // roads
          float road = min(segDist(p, vec2(0.0), vec2(-1500.0, 2500.0)), segDist(p, vec2(-1500.0, 2500.0), vec2(-6000.0, 2600.0)));
          road = min(road, segDist(p, vec2(-200.0, -900.0), vec2(-200.0, 6000.0)));
          landCol = mix(landCol, vec3(0.33, 0.31, 0.28), smoothstep(16.0, 12.0, road));
          float pad = smoothstep(${(PAD_RADIUS + 70).toFixed(1)}, ${(PAD_RADIUS + 55).toFixed(1)}, length(p));
          landCol = mix(landCol, vec3(0.4, 0.39, 0.37) * (0.85 + 0.3 * n2), pad);
          landCol *= 0.78 + 0.44 * n3;
          float distOff = clamp((p.x - coast) / 4000.0, 0.0, 1.0);
          vec3 ocean = mix(vec3(0.02, 0.075, 0.085), vec3(0.006, 0.025, 0.055), distOff);
          float oceanMask = max(1.0 - land, lagoon);
          vec3 col = mix(landCol, ocean, oceanMask);
          // surf line
          col = mix(col, vec3(0.75), smoothstep(30.0, 0.0, abs(p.x - coast - 25.0 - sin(p.y * 0.01 + uTime) * 6.0)) * 0.5 * land);
          vec4 diffuseColor = vec4(col, opacity);
        `)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.06, oceanMask);')
        .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
          if (oceanMask > 0.01) {
            vec3 q = vec3(p * 0.045, uTime * 0.35);
            float e = 0.6;
            float h0 = fbm3(q, 4);
            float hx = fbm3(q + vec3(e * 0.045, 0.0, 0.0), 4);
            float hy = fbm3(q + vec3(0.0, e * 0.045, 0.0), 4);
            vec3 wn = vec3(-(hx - h0) * 9.0, 0.0, (hy - h0) * 9.0);
            normal = normalize(normal + mat3(viewMatrix) * wn * oceanMask);
          }`);
    };
    this.groundMat = gmat;
    const ground = new THREE.Mesh(new THREE.RingGeometry(0.01, 42000, 160, 140), gmat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.renderOrder = 2;
    this.ground = ground;
    this.world.add(ground);

    // trees (instanced pines)
    const trunk = new THREE.CylinderGeometry(0.15, 0.2, 2, 5).translate(0, 1, 0);
    const crown1 = new THREE.ConeGeometry(1.6, 4, 7).translate(0, 3.6, 0);
    const crown2 = new THREE.ConeGeometry(1.2, 3, 7).translate(0, 5.4, 0);
    for (const g of [trunk, crown1, crown2]) g.deleteAttribute('uv');
    const colorize = (g, c) => { const n = g.attributes.position.count; const a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(c, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
    const treeGeo = mergeGeometries([colorize(trunk, [0.25, 0.17, 0.1]), colorize(crown1, [0.06, 0.13, 0.05]), colorize(crown2, [0.07, 0.15, 0.06])]);
    const N = 9000;
    const trees = new THREE.InstancedMesh(treeGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), N);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3();
    let n = 0;
    for (let tries = 0; n < N && tries < N * 4; tries++) {
      const ang = Math.random() * Math.PI * 2, dist = 160 + Math.pow(Math.random(), 0.7) * 2800;
      const x = Math.cos(ang) * dist, z = Math.sin(ang) * dist;
      if (x > 1800) continue;                      // near coast/ocean
      if (Math.abs(z + x * 2500 / 1500 * (x < 0 ? 1 : 0)) < 25 && x < 0 && x > -1500) continue;
      const cluster = TX.fbm(x / 300 + 50, z / 300 + 50, 1000, 3, 7);
      if (cluster < 0.48) continue;
      const sc = 0.7 + Math.random() * 0.9;
      v.set(x, 0, z); s.set(sc, sc * (0.8 + Math.random() * 0.5), sc);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * 6.28);
      m.compose(v, q, s);
      trees.setMatrixAt(n++, m);
    }
    trees.count = n;
    trees.castShadow = true; trees.receiveShadow = true;
    this.trees = trees;
    this.world.add(trees);

    // cloud layer
    this.cloudMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uOff: { value: this.groundUniforms.uOff.value }, uBend: { value: BEND }, uTime: { value: 0 }, uSunCol: { value: new THREE.Color(1, 0.9, 0.8) }, uFogColor: { value: new THREE.Color() }, uSun: { value: this.sunDir } },
      vertexShader: /* glsl */`
        varying vec2 vP; varying vec3 vW;
        uniform vec2 uOff; uniform float uBend; varying vec2 vL;
        void main() { vP = position.xy + uOff; vL = position.xy; vec4 w = modelMatrix * vec4(position, 1.0); w.y -= dot(w.xz, w.xz) * uBend; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        ${NOISE_GLSL}
        uniform float uTime; uniform vec3 uSunCol; uniform vec3 uFogColor; uniform vec3 uSun;
        varying vec2 vP; varying vec3 vW; varying vec2 vL;
        void main() {
          vec2 p = vP + vec2(uTime * 6.0, uTime * 2.0);
          float c = fbm3(vec3(p * 0.00028, 0.5), 7);
          float big = fbm3(vec3(p * 0.00006, 2.5), 3);
          float dens = smoothstep(0.56, 0.78, c + (big - 0.5) * 0.5);
          if (dens < 0.01) discard;
          float above = step(vW.y, cameraPosition.y);
          float shade = fbm3(vec3((p + uSun.xz * 300.0) * 0.00028, 0.5), 5);
          float lightAmt = clamp(1.0 - (shade - c) * 6.0, 0.25, 1.0);
          vec3 col = uSunCol * mix(0.55, 1.0, lightAmt) * mix(0.55, 1.05, above) + vec3(0.1, 0.13, 0.18);
          float dist = length(vW - cameraPosition);
          float fog = 1.0 - exp(-dist * dist * 1.2e-10);
          col = mix(col, uFogColor, fog * 0.85);
          float a = dens * 0.92 * (1.0 - smoothstep(25000.0, 38000.0, length(vL)));
          gl_FragColor = vec4(col, a);
        }`,
    });
    const clouds = new THREE.Mesh(new THREE.PlaneGeometry(80000, 80000, 80, 80), this.cloudMat);
    clouds.rotation.x = -Math.PI / 2;
    clouds.position.y = 2800;
    clouds.renderOrder = 3;
    this.clouds = clouds;
    this.world.add(clouds);
  }

  // =================================================================== PAD
  initPad() {
    const conc = TX.concreteTextures();
    const concMat = new THREE.MeshStandardMaterial({ map: conc.map.clone(), roughness: 0.85, color: 0xd8d4cc });
    concMat.map.repeat.set(6, 6); concMat.map.needsUpdate = true;
    const pad = new THREE.Group();
    this.pad = pad;
    this.world.add(pad);
    // mound
    const mound = new THREE.Mesh(new THREE.CylinderGeometry(PAD_RADIUS, PAD_RADIUS + 22, 6, 96), concMat);
    mound.position.y = 3; mound.receiveShadow = true; mound.castShadow = true;
    pad.add(mound);
    // flame trench (dark slot along x)
    const trenchMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 1 });
    const trench = new THREE.Mesh(new THREE.BoxGeometry(PAD_RADIUS * 2 - 4, 0.1, 7), trenchMat);
    trench.position.y = 6.0; pad.add(trench);
    // launch mount
    const mountMat = new THREE.MeshStandardMaterial({ color: 0x55585e, metalness: 0.7, roughness: 0.5 });
    const legs = [[-5, -5], [5, -5], [5, 5], [-5, 5]];
    for (const [x, z] of legs) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3, 1.6), mountMat);
      l.position.set(x, 7.5, z); l.castShadow = true; l.receiveShadow = true; pad.add(l);
    }
    const ringGeo = new THREE.RingGeometry(2.4, 7.5, 4, 1);
    const ringShape = new THREE.Shape();
    ringShape.moveTo(-7, -7); ringShape.lineTo(7, -7); ringShape.lineTo(7, 7); ringShape.lineTo(-7, 7); ringShape.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 0, 3.2, 0, Math.PI * 2, true); ringShape.holes.push(hole);
    const deck = new THREE.Mesh(new THREE.ExtrudeGeometry(ringShape, { depth: 1, bevelEnabled: false }), mountMat);
    deck.rotation.x = -Math.PI / 2; deck.position.y = PAD_TOP - 1.0 - 0.01;
    deck.castShadow = true; deck.receiveShadow = true;
    pad.add(deck);
    ringGeo.dispose();
    // hold-down clamps
    this.clamps = [];
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.6), new THREE.MeshStandardMaterial({ color: 0xd4a62a, metalness: 0.5, roughness: 0.4 }));
      c.position.set(Math.cos(a) * 2.2, PAD_TOP + 0.6, Math.sin(a) * 2.2);
      c.castShadow = true;
      pad.add(c); this.clamps.push(c);
    }
    // umbilical tower
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xa63b22, metalness: 0.5, roughness: 0.55 });
    this.towerX = -13;
    const tower = latticeTower(80, 6, towerMat, { step: 3.2, t: 0.35, brace: 0.16 });
    tower.position.set(this.towerX, 6, 0);
    pad.add(tower);
    for (let y = 14; y < 86; y += 12) {
      const deckT = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 7), towerMat);
      deckT.position.set(this.towerX, y, 0); deckT.castShadow = true; pad.add(deckT);
    }
    const lampMat = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff2010, emissiveIntensity: 20 });
    this.beacons = [];
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8), lampMat);
    beacon.position.set(this.towerX, 87, 0); pad.add(beacon); this.beacons.push(beacon);
    // swing arms (rebuilt per rocket)
    this.arms = [];
    // lightning masts
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x8a8d93, metalness: 0.7, roughness: 0.4 });
    for (const [x, z] of [[-75, -60], [75, -60], [10, 85]]) {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.6, 110, 10), mastMat);
      mast.position.set(x, 55, z); mast.castShadow = true; pad.add(mast);
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), lampMat); b.position.set(x, 110.5, z); pad.add(b); this.beacons.push(b);
    }
    // water tower
    const wt = new THREE.Group();
    const wtMat = new THREE.MeshStandardMaterial({ color: 0xd9dbe0, metalness: 0.5, roughness: 0.35 });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 16), wtMat); sphere.position.y = 55; wt.add(sphere);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 50, 8), mastMat); leg.position.set(Math.cos(a) * 6, 25, Math.sin(a) * 6); wt.add(leg); }
    wt.position.set(140, 0, -170);
    wt.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.world.add(wt);
    // flood light poles
    const headMat = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xfff1d6, emissiveIntensity: 25 });
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + 0.4;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 40, 8), mastMat);
      pole.position.set(Math.cos(a) * 95, 20, Math.sin(a) * 95); pole.castShadow = true;
      const head = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 0.6), headMat);
      head.position.set(Math.cos(a) * 95, 40, Math.sin(a) * 95); head.lookAt(0, 20, 0);
      this.world.add(pole, head);
    }
    // Vehicle Assembly Building (far)
    const vabMat = new THREE.MeshStandardMaterial({ color: 0xc8c6c0, roughness: 0.8 });
    const vab = new THREE.Mesh(new THREE.BoxGeometry(160, 160, 130), vabMat);
    vab.position.set(-1500, 80, -2500); vab.castShadow = true; vab.receiveShadow = true;
    this.world.add(vab);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(40, 140), new THREE.MeshStandardMaterial({ color: 0x55575c, roughness: 0.6 }));
    door.position.set(-1500, 72, -2434.9); this.world.add(door);
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ map: TX.flagDecal(), transparent: true }));
    stripe.position.set(-1460 + 30, 120, -2434.8); this.world.add(stripe);
    // small buildings
    const bMat = new THREE.MeshStandardMaterial({ color: 0xb0aea8, roughness: 0.8 });
    for (let i = 0; i < 18; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(20 + Math.random() * 40, 8 + Math.random() * 20, 20 + Math.random() * 30), bMat);
      b.position.set(-700 - Math.random() * 1600, 0, -1200 - Math.random() * 1400);
      b.position.y = b.geometry.parameters.height / 2;
      b.castShadow = true; b.receiveShadow = true;
      this.world.add(b);
    }
    pad.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
  }

  buildArms(height) {
    for (const a of this.arms) this.pad.remove(a.pivot);
    this.arms = [];
    const mat = new THREE.MeshStandardMaterial({ color: 0x9c3a22, metalness: 0.5, roughness: 0.55 });
    const ys = [height * 0.35, height * 0.7, height - 2.5].filter((y) => y > 4 && y < 80);
    const isSaturn = this.stack && this.stack.some((s) => s.type.startsWith('saturn'));
    const isSoyuz = this.stack && this.stack.some((s) => s.type.startsWith('soyuz'));
    const isN1 = this.stack && this.stack.some((s) => s.type.startsWith('n1'));
    const coreR = isN1 ? 3.05 : isSaturn ? CORE_R * 1.92 : isSoyuz ? 2.45 : CORE_R;
    const reach = -this.towerX - 3 - coreR;
    for (const y of ys) {
      const pivot = new THREE.Group();
      pivot.position.set(this.towerX + 3, PAD_TOP + y, 2.0);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(reach, 1.2, 1.6), mat);
      arm.position.set(reach / 2, 0, -2.0);
      arm.castShadow = true;
      pivot.add(arm);
      this.pad.add(pivot);
      this.arms.push({ pivot, target: 0 });
    }
    const clampR = isN1 ? 4.65 : isSoyuz ? 3.65 : isSaturn ? 2.95 : 2.2;
    this.clamps.forEach((c, i) => {
      const a = i * Math.PI / 2 + Math.PI / 4;
      c.position.set(Math.cos(a) * clampR, PAD_TOP + 0.6, Math.sin(a) * clampR);
    });
  }

  // =================================================================== FX
  initFX() {
    this.smoke = new ParticleSystem({ max: 28000, texture: TX.smokeSprite(), sort: true });
    this.fire = new ParticleSystem({ max: 6000, texture: TX.fireSprite(), additive: true });
    this.world.add(this.smoke.mesh, this.fire.mesh);
    this.engineLight = new THREE.PointLight(0xff8a3a, 0, 0, 2);
    this.scene.add(this.engineLight);
    this.flashLight = new THREE.PointLight(0xffaa55, 0, 0, 2);
    this.world.add(this.flashLight);
  }

  // =================================================================== UI
  initUI() {
    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      const k = e.key.toLowerCase();
      this.keys[k] = true;
      if (e.code === 'Space') { e.preventDefault(); if (this.phase === 'ready') this.startCountdown(); else this.stage(); }
      if (k === 't') { this.sas = !this.sas; if (this.player) this.holdAttitude(); }
      if (k === 'f') {
        const sasModes = tr(SAS_MODES_VI, SAS_MODES_EN);
        this.sasMode = (this.sasMode + 1) % sasModes.length;
        this.sas = true;
        this.event(tr('Chế độ SAS: ', 'SAS Mode: ') + sasModes[this.sasMode]);
      }
      if (k === 'g') this.toggleAutopilot();
      if (k === 'c') this.cycleCam();
      if (k === 'm') this.map.toggle();
      if (k === 'tab') { e.preventDefault(); this.map.cycleFocus(); }
      if (k === 'b') this.toggleBoosterFocus();
      if (k === 'p') this.toggleDeploy();
      if (k === 'z' && !this.docked) this.throttle = 1;
      if (k === 'x') this.throttle = 0;
      if (k === '.') this.setWarp(1);
      if (k === ',') this.setWarp(-1);
      if (e.key === 'Escape' && $('settings').classList.contains('hidden')) this.app.toggleMenu();
      if (e.key === 'Shift' || e.key === 'Control') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
    $('btn-go').onclick = () => { audio.init(); this.startCountdown(); };
    $('btn-back').onclick = () => this.app.goBuild();
    const btnAp = $('btn-autopilot');
    if (btnAp) btnAp.onclick = () => { audio.init(); this.toggleAutopilot(); };
    const btnMap = $('btn-toggle-map');
    if (btnMap) btnMap.onclick = () => this.map.toggle();
  }

  setWarp(d) {
    let i = WARPS.indexOf(this.warp) + d;
    i = Math.max(0, Math.min(WARPS.length - 1, i));
    this.warp = WARPS[i];
    this.userWarp = this.warp;
  }

  cycleCam() {
    if (this.camMode === 0) this.savedOffset = this.camera.position.clone();
    this.camMode = (this.camMode + 1) % this.camModes.length;
    this.controls.enabled = this.camMode === 0;
    if (this.camMode === 0) {
      this.camera.fov = 50; this.camera.updateProjectionMatrix();
      this.camera.position.copy(this.savedOffset || new THREE.Vector3(30, 5, 60));
    }
    this.cineAngle = Math.atan2(this.camera.position.z, this.camera.position.x);
  }

  event(text, cls = '') {
    const box = $('events');
    const d = document.createElement('div');
    d.className = 'ev ' + cls;
    const t = this.met;
    const s = `T${t < 0 ? '-' : '+'}${String(Math.floor(Math.abs(t) / 60)).padStart(2, '0')}:${String(Math.floor(Math.abs(t)) % 60).padStart(2, '0')}`;
    d.innerHTML = `<span class="t">${s}</span>${text}`;
    box.prepend(d);
    while (box.children.length > 7) box.lastChild.remove();
  }

  milestone(big, small) {
    const m = $('milestone');
    m.innerHTML = `<div class="m1">${big}</div><div class="m2">${small || ''}</div>`;
    m.classList.add('show');
    clearTimeout(this.msTimer);
    this.msTimer = setTimeout(() => m.classList.remove('show'), 4500);
  }


  // =================================================================== SITES (LZ, ship, ISS, flag)
  initSites() {
    this.lz = createLandingZone();
    this.lz.position.set(LZ_X, 0, 0);
    this.world.add(this.lz);
    this.ship = createDroneShip();
    this.ship.visible = false;
    this.shipX = null;
    this.world.add(this.ship);
    this.flagObj = createFlag();
    this.flagObj.visible = false;
    this.scene.add(this.flagObj);
    this.flagSpot = null;
    this.issOrbit = new RailOrbit(ISS_R, -0.3);
    this.iss = createISS();
    this.iss.visible = false;
    this.scene.add(this.iss);
    this.issPortLocal = this.iss.userData.port.position.clone();
    // static scenery bends with planetary curvature (same math as the ground shader)
    this.worldStatic = this.world.children.filter((c) => c !== this.ground && c !== this.clouds);
    const seen = new Set();
    for (const c of this.worldStatic) c.traverse((o) => {
      if (!o.material) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (seen.has(m)) continue; seen.add(m);
        const prev = m.onBeforeCompile;
        m.onBeforeCompile = (sh, r) => {
          if (prev) prev.call(m, sh, r);
          sh.uniforms.uBend = this.groundUniforms.uBend;
          sh.vertexShader = 'uniform float uBend;\n' + sh.vertexShader.replace('#include <project_vertex>', `
            vec4 mvPosition = vec4( transformed, 1.0 );
            #ifdef USE_INSTANCING
              mvPosition = instanceMatrix * mvPosition;
            #endif
            vec4 wpB = modelMatrix * mvPosition;
            wpB.y -= dot(wpB.xz, wpB.xz) * uBend;
            mvPosition = viewMatrix * wpB;
            gl_Position = projectionMatrix * mvPosition;`);
        };
        m.customProgramCacheKey = () => 'bend';
      }
    });
  }

  // =================================================================== PERSISTENT SPACE OBJECTS
  saveSpaceObjects() {
    try { localStorage.setItem('rf-space-objects', JSON.stringify(this.spaceObjects)); } catch { /* ignore */ }
  }

  /** Ensure a vessel in outer space has a non-decaying closed orbit around its reference body */
  stabilizeSpaceVessel(v) {
    const B = v.body || bodyInfo(v.ref);
    const minSafeR = B.R + Math.max((B.atm || 0) + 12000, v.ref === 'earth' ? 78000 : 12000);
    const bp = { x: 0, y: 0, z: 0 }, bv = { x: 0, y: 0, z: 0 };
    bodyState(v.ref, this.simT, bp, bv);
    if (v.rRel.r < minSafeR) {
      v.s.x = bp.x + v.up.x * minSafeR;
      v.s.y = bp.y + v.up.y * minSafeR;
      v.updateFrame(this.simT);
    }
    const el = vesselElements(v);
    if (el.pe < minSafeR || el.e >= 0.92 || !isFinite(el.a)) {
      const rNow = Math.max(v.rRel.r, minSafeR);
      const vCirc = Math.sqrt(B.mu / rNow);
      const sign = v.vOrb.e >= -15 ? 1 : -1;
      v.s.vx = bv.x + v.east.x * vCirc * sign;
      v.s.vy = bv.y + v.east.y * vCirc * sign;
      v.updateFrame(this.simT);
    }
  }

  /** Save any in-space rockets or separated stages to persistent orbital storage across launches */
  archiveSpaceVessels() {
    if (!this.vessels || !this.vessels.length) return;
    let changed = false;
    for (const v of this.vessels) {
      if (!v || v.dead || v.crashed || v.archived || v.clamped) continue;
      const inSpace = v.ref !== 'earth' || v.alt >= 45000 || v.orbitStabilized || v.destinedForSpace;
      if (!inSpace) continue;
      if (v === this.player && v.landed && v.ref === 'earth') continue;
      v.archived = true;
      this.stabilizeSpaceVessel(v);
      const el = vesselElements(v);
      const isPlayer = v === this.player;
      if (isPlayer) this.launchCounter = (this.launchCounter || 0) + 1;
      const name = v.label || (isPlayer ? `Tên lửa #${this.launchCounter}` : `Tầng tách #${++this.stageCounter}`);
      this.spaceObjects.push({
        id: v.mapId || ('pers_' + Date.now() + '_' + Math.floor(Math.random() * 10000)),
        name,
        kind: isPlayer ? 'vessel' : 'stage',
        ref: v.ref || 'earth',
        a: isFinite(el.a) && el.a > 0 ? el.a : v.rRel.r,
        e: isFinite(el.e) && el.e < 0.85 ? el.e : 0.005,
        argPe: isFinite(el.argPe) ? el.argPe : v.phi,
        nu0: isFinite(el.nu) ? el.nu : 0,
        hSign: el.h <= 0 ? 1 : -1,
        t0: this.simT,
        beta: v.beta,
      });
      changed = true;
    }
    if (changed) this.saveSpaceObjects();
  }

  /** Evaluate position, altitude, velocity & orbital elements of a persisted space object at time t */
  evalSpaceObject(obj, t) {
    const B = BODIES[obj.ref] || BODIES.earth;
    const a = Math.max(obj.a || (B.R + 100e3), B.R + 20e3);
    const e = clamp(obj.e || 0, 0, 0.88);
    const period = Math.PI * 2 * Math.sqrt(a ** 3 / B.mu);
    const n = (Math.PI * 2) / period;
    const E0 = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan((obj.nu0 || 0) / 2));
    const M0 = E0 - e * Math.sin(E0);
    const M = M0 + n * (t - (obj.t0 || 0));
    let E = M;
    for (let k = 0; k < 4; k++) {
      E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    }
    const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    const p = a * (1 - e * e);
    const r = p / (1 + e * Math.cos(nu));
    const hSign = obj.hSign || 1;
    const th = (obj.argPe || 0) + hSign * nu;
    const bp = bodyPos(obj.ref || 'earth', t);
    const x = bp.x + r * Math.sin(th);
    const y = bp.y + r * Math.cos(th);
    const z = bp.z || 0;
    const alt = r - B.R;
    const speedOrb = Math.sqrt(Math.max(0, B.mu * (2 / r - 1 / a)));
    const beta = th + (hSign > 0 ? Math.PI / 2 : -Math.PI / 2);
    return {
      x, y, z, alt, speedOrb, beta,
      el: { a, e, argPe: obj.argPe || 0, pe: a * (1 - e), ap: a * (1 + e), period },
    };
  }

  /** Delete a persistent or active space object by ID when requested by the player on the Map */
  deleteSpaceObject(id) {
    if (!id) return;
    const idx = this.spaceObjects.findIndex((o) => o.id === id);
    if (idx !== -1) {
      const [removed] = this.spaceObjects.splice(idx, 1);
      this.saveSpaceObjects();
      this.event(`🗑️ Đã xóa "${removed.name}" khỏi vũ trụ.`);
      if (this.map.visible) this.updateMap();
      return;
    }
    const v = this.vessels.find((vv) => vv !== this.player && !vv.dead && (vv.mapId === id || ('live_' + vv.id) === id));
    if (v) {
      v.dead = true;
      v.archived = true;
      if (v.root && v.root.parent) v.root.parent.remove(v.root);
      this.vessels = this.vessels.filter((vv) => vv !== v);
      if (this.focus === v) this.focus = this.player;
      this.event(`🗑️ Đã xóa "${v.label || 'Tầng tách'}" khỏi vũ trụ.`);
      if (this.map.visible) this.updateMap();
      return;
    }
    if (id === 'vessel' && this.player && !this.player.clamped) {
      this.player.archived = true;
      this.event('🗑️ Đã xóa tên lửa hiện tại khỏi vũ trụ.');
      this.map.toggle(false);
      this.app.goBuild();
    }
  }

  // =================================================================== SETUP
  setup(stack, missionId) {
    this.archiveSpaceVessels();
    this.stack = stack;
    this.mission = missionById(missionId || this.app.missionId || 'free');
    // free GPU buffers of the previous rocket, its separated stages, plumes & debris (they leaked on every relaunch)
    const freeGPU = (root) => {
      if (!root) return;
      root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && o.material.isShaderMaterial) [].concat(o.material).forEach((m) => m.dispose());
      });
    };
    const roots = new Set();
    for (const v of this.vessels) if (v.root) roots.add(v.root);
    if (this.rocket) roots.add(this.rocket.root);
    for (const d of this.debris) if (d.obj) roots.add(d.obj);
    for (const r of roots) { r.parent && r.parent.remove(r); freeGPU(r); }
    this.debris = []; this.vessels = [];
    this.smoke.clear(); this.fire.clear();
    $('events').innerHTML = '';
    $('result').classList.add('hidden');

    this.rocket = buildRocket(stack);
    this.scene.add(this.rocket.root);
    this.segs = segments(stack);
    this.segInfo = this.segs.map((idx) => segmentInfo(stack, idx));
    this.lay = layout(stack);
    this.fuel = this.segInfo.map((s) => s.fuel);
    this.fuelMax = this.segInfo.map((s) => s.fuel);
    for (const b of this.rocket.boosters) b.fuelMax = b.fuel;
    this.ctx = { stack, lay: this.lay, segs: this.segs, segInfo: this.segInfo, fuel: this.fuel, fuelMax: this.fuelMax, rocket: this.rocket };
    this.plumes = this.rocket.nozzles.map((nz) => {
      const p = createPlume(nz.r, nz.booster ? 1.3 : 1.0, Math.random(), nz.style || 'default');
      nz.node.add(p.group);
      return { ...p, nz, heat: 0, prev: null };
    });
    this.rocketHeight = this.lay.height;
    BoosterRecovery.steerSign = -1;

    this.simT = this.simT || 0;
    this.player = new Vessel(this.ctx, this.segs.map((_, k) => k), this.rocket.root, 'player');
    this.vessels = [this.player];
    this.focus = this.player;

    if (this.player.isBoat) {
      const seaX = COAST_X + 160;
      this.player.placeOnSurface('earth', seaX, this.player.bottomOffset() - 0.35, this.simT);
      this.player.clamped = false;
      this.player.clampSpot = { body: 'earth', sx: seaX, h: this.player.bottomOffset() - 0.35 };
      this.player.landed = { body: 'earth', sx: seaX, h: this.player.bottomOffset() - 0.35, site: 'sea', how: 'boat' };
      this.phase = 'flight';
      this.ignited = true;
      this.released = true;
      this.met = 0;
      this.event('🛥️ Canô đã hạ thủy ra biển! Nhấn W/S hoặc tăng ga để lướt sóng, A/D bẻ lái.');
    } else if (this.player.isRover) {
      const roverX = 18;
      const surfH = 6 + this.player.bottomOffset();
      this.player.placeOnSurface('earth', roverX, surfH, this.simT);
      this.player.clamped = false;
      this.player.clampSpot = { body: 'earth', sx: roverX, h: surfH };
      this.player.landed = { body: 'earth', sx: roverX, h: surfH, site: 'pad', how: 'rover' };
      this.phase = 'flight';
      this.ignited = true;
      this.released = true;
      this.met = 0;
      this.event('🚙 Xe Rover đã sẵn sàng! Nhấn W/S để chạy tiến/lùi, A/D để quẹo trái/phải.');
    } else if (this.player.isPlane) {
      this.player.placeOnSurface('earth', 0, PAD_TOP + this.player.bottomOffset(), this.simT);
      this.player.beta = this.player.phi + Math.PI / 2;
      this.player.updateFrame(this.simT);
      this.player.syncDir3DFromBeta();
      this.player.clamped = false;
      this.player.clampSpot = { body: 'earth', sx: 0, h: PAD_TOP + this.player.bottomOffset() };
      this.player.landed = { body: 'earth', sx: 0, h: PAD_TOP + this.player.bottomOffset(), site: 'runway', how: 'plane' };
      this.phase = 'flight';
      this.ignited = true;
      this.released = true;
      this.met = 0;
      this.event('✈️ Tiêm kích phản lực đã vào đường băng! Tăng ga bằng Shift / Z để chạy đà, nhấn S để ngóc mũi cất cánh.');
    } else {
      this.player.placeOnSurface('earth', 0, PAD_TOP + this.player.bottomOffset(), this.simT);
      this.player.clamped = true;
      this.player.clampSpot = { body: 'earth', sx: 0, h: PAD_TOP + this.player.bottomOffset() };
      this.phase = 'ready';
      this.met = -10;
    }

    this.player.engineOn = this.player.isPlane; this.player.throttle = 1;
    this.startAlt = this.player.alt;
    this.buildArms(this.rocketHeight);
    if (this.player.isBoat || this.player.isRover || this.player.isPlane) {
      this.arms.forEach((a) => (a.target = 1));
      this.clamps.forEach((c) => { c.visible = false; });
    }
    for (const d of this.rocket.deployables) for (const o of d.objs) o.userData.setDeploy && o.userData.setDeploy(0);

    this.throttle = 1; this.sas = true; this.sasMode = 0; this.warp = 1; this.userWarp = 1; this.autoWarp = 1;
    this.reqWarpNext = null; this.reqWarpPrev = 1;
    this.holdBeta = this.player.beta;
    if (this.player.dir3D) this.player.holdDir3D.copy(this.player.dir3D);
    this.program = null; this.programDone = false;
    this.docked = null;
    this.ignited = this.player.isBoat || this.player.isRover || this.player.isPlane;
    this.released = this.player.isBoat || this.player.isRover || this.player.isPlane;
    this.lifted = this.player.isBoat || this.player.isRover || this.player.isPlane;
    this.maxAlt = 0; this.maxVel = 0; this.maxG = 1; this.maxQ = 0; this.maxQPassed = false;
    this.flags = {};
    this.boosterReleased = false; this.mecoWarned = false; this.towerGone = false;
    this.resultShown = false; this.completeTimer = null; this.lastCrashSnapshot = null;
    this.flagSpot = null; this.flagObj.visible = false; this.moonLandT = null;
    this.camMode = 0; this.controls.enabled = true;
    this.camera.fov = 50; this.camera.updateProjectionMatrix();
    const isSpecial = this.player.isBoat || this.player.isRover || this.player.isPlane;
    const h = this.rocketHeight;
    if (this.player.isRover || this.player.isBoat) {
      this.camera.position.set(-13, 4.5, 0);
      this.controls.minDistance = 2;
    } else if (this.player.isPlane) {
      this.camera.position.set(12, 4, 16);
      this.controls.minDistance = 2;
    } else {
      this.camera.position.set(h * 0.68 + 12, 1.5, h * 1.18 + 20);
      this.controls.minDistance = 6;
    }
    this.controls.target.set(0, 1.5, 0);
    this.envBand = -1;
    this.flash = 0;
    this.pipKeep = 0;
    this.clamps.forEach((c) => { c.rotation.set(0, 0, 0); });
    this.ship.visible = false; this.shipX = null;
    this.map.toggle(false);
    if (isSpecial) {
      $('btn-go').classList.add('hidden');
    } else {
      $('btn-go').classList.remove('hidden');
      this.event('Tên lửa đã lên bệ phóng. Sẵn sàng!');
    }
    $('countdown').textContent = '';
    $('mission-panel').classList.toggle('hidden', !this.mission.objectives.length);
    this.renderMissionPanel(true);
    this.sc = this.makeContext();
    if (this.mission.id !== 'free' && !isSpecial) this.event('Nhiệm vụ: ' + this.mission.name + ' – nhấn G để bật lái tự động.');
  }

  /** guidance context (see sim/guidance.js) */
  makeContext() {
    const self = this;
    return {
      get simT() { return self.simT; },
      startAlt: this.startAlt, coastX: COAST_X, recoveryMode: 'auto',
      event: (t, c) => self.event(t, c || ''),
      requestWarp: (w) => { self.reqWarpNext = w; },
      placeDroneShip: (x) => { self.shipX = x; self.ship.position.x = x; self.ship.visible = true; },
      isRecoverable: (v) => v === self.player && !self.boosterReleased && v.segIdx.length > 1 && (self.mission.id === 'recover' || v.deployables('legs').some((d) => d.seg === v.activeSeg)),
      autoStage: (v, mode) => self.autoStage(v, mode),
      flag: (n) => self.setFlag(n),
      jettisonToCapsule: (v) => self.jettisonToCapsule(v),
      dockGeometry: () => self.dockGeometry(),
      get docked() { return self.docked; },
    };
  }

  autoStage(v, mode) {
    if (v.segIdx.length <= 1) return false;
    if (mode === 'recover') {
      this.stageVessel(v);
      if (this.ignited) v.engineOn = true;
      return true;
    }
    if (this.checkAutoStage(v)) return true;
    this.stageVessel(v);
    if (this.ignited) v.engineOn = true;
    return true;
  }

  checkAutoStage(v = this.player) {
    if (!v || v.crashed || v.dead || v.clamped) return false;
    if (!(this.phase === 'flight' || (this.phase === 'countdown' && this.ignited))) return false;
    let staged = false;
    let guard = 0;
    while (v.segIdx.length > 1 && guard++ < 12) {
      const k = v.activeSeg;
      const info = this.segInfo[k];
      const fuelLeft = this.fuel[k] || 0;
      const boosterFuel = v.boosters().reduce((s, b) => s + (b.seg === k ? b.fuel : 0), 0);
      const hasPropulsion = (info && info.tVac > 0) || v.boosters().some((b) => b.seg === k);
      const outOfFuel = fuelLeft <= 1e-4 && boosterFuel <= 1e-4;
      const nextK = v.segIdx[v.segIdx.length - 2];
      const nextInfo = this.segInfo[nextK];
      const nextHasEngine = (nextInfo && nextInfo.tVac > 0 && (this.fuel[nextK] || 0) > 1e-4) ||
        v.boosters().some((b) => b.seg === nextK && b.fuel > 1e-4);
      const isReentry = v.ref === 'earth' && v.alt < 95000 && v.vSurf && v.vSurf.u < -5 && this.met > 30;
      if ((!hasPropulsion || outOfFuel) && (nextHasEngine || isReentry || v.segIdx.length > 2)) {
        this.stageVessel(v);
        if (this.ignited) v.engineOn = true;
        staged = true;
      } else {
        break;
      }
    }
    return staged;
  }

  setFlag(n) { if (!this.flags[n]) { this.flags[n] = true; this.renderMissionPanel(); } }

  jettisonToCapsule(v) {
    let guard = 0;
    while (v.segIdx.length > 1 && guard++ < 12) this.stageVessel(v, true);
  }

  // =================================================================== CONTROL FLOW
  startCountdown() {
    if (this.phase !== 'ready') return;
    this.phase = 'countdown';
    this.met = -10;
    this.lastCount = 11;
    $('btn-go').classList.add('hidden');
    this.event('Bắt đầu đếm ngược!');
  }

  holdAttitude() {
    this.holdBeta = this.player.beta;
    if (this.player && this.player.dir3D) this.player.holdDir3D.copy(this.player.dir3D);
  }

  toggleAutopilot() {
    if (!this.player || this.player.crashed || this.docked) return;
    if (this.program) {
      this.program = null;
      this.player.ctl.targetBeta = null;
      this.player.ctl.rcs = [0, 0, 0];
      this.holdAttitude();
      this.event(tr('Tắt lái tự động.', 'Autopilot OFF.'));
      return;
    }
    const id = this.mission.id;
    if (id === 'iss') this.program = new RendezvousProgram(this.issOrbit, 85e3);
    else if (BODIES[id] && id !== 'earth' && id !== 'sun' && !BODIES[id].gasGiant) this.program = new MoonProgram(id);
    else this.program = new AscentProgram(85e3, 'earth');
    if (this.mission && this.mission.id !== 'free') {
      this.program.label = `${this.mission.icon} ${this.mission.name}`;
    } else {
      this.program.label = tr('Bay lên quỹ đạo', 'Ascent to Orbit');
    }
    this.programDone = false;
    this.event(tr('🤖 Bật lái tự động theo nhiệm vụ: ', '🤖 Mission Autopilot ON: ') + this.program.label + '.');
    if (this.phase === 'ready') {
      this.startCountdown();
    }
  }

  toggleBoosterFocus() {
    const b = this.vessels.find((v) => v.kind === 'booster' && !v.crashed && !v.dead);
    if (!b) return;
    this.focus = this.focus === b ? this.player : b;
    this.event(this.focus === b ? 'Camera: tầng 1.' : 'Camera: tàu chính.');
  }

  toggleDeploy() {
    const v = this.focus;
    if (!v || v.crashed) return;
    const on = !(v.legsTarget || v.chuteTarget || v.finsTarget);
    if (v.hasLegs()) v.legsTarget = on ? 1 : 0;
    if (v.hasGridFins()) v.finsTarget = on ? 1 : 0;
    if (v.capsule()) v.chuteTarget = on ? 1 : 0;
    this.event(on ? 'Bung chân / cánh / dù.' : 'Thu chân / cánh / dù.');
  }

  stage() {
    if (!this.player || this.player.crashed) return;
    if (!(this.phase === 'flight' || this.phase === 'countdown' && this.ignited)) return;
    if (this.player.segIdx.length <= 1) return;
    this.stageVessel(this.player);
  }

  /** split the lowest stage off vessel v into its own vessel */
  stageVessel(v, junk = false) {
    if (v.segIdx.length <= 1) return null;
    const T = this.simT;
    const k = v.segIdx[v.segIdx.length - 1];
    const ax = v.axis();
    const oldCom = v.com.y;
    v.segIdx.pop();
    const root = new THREE.Group();
    this.scene.add(root);
    root.add(this.rocket.segGroups[k]);
    const nv = new Vessel(this.ctx, [k], root, 'debris');
    nv.s = { ...v.s }; nv.beta = v.beta; nv.omega = v.omega * 0.5;
    if (v.dir3D) {
      nv.dir3D.copy(v.dir3D);
      nv.holdDir3D.copy(v.dir3D);
    }
    nv.updateMass(); v.updateMass();
    nv.s.x += ax.x * (nv.com.y - oldCom); nv.s.y += ax.y * (nv.com.y - oldCom);
    v.s.x += ax.x * (v.com.y - oldCom); v.s.y += ax.y * (v.com.y - oldCom);
    nv.s.vx -= ax.x * 3; nv.s.vy -= ax.y * 3;
    nv.landed = v.landed ? null : null;
    nv.updateFrame(T); v.updateFrame(T);
    nv.engineOn = false; nv.throttle = 0;
    nv.ctl.targetBeta = null;
    this.stageCounter = (this.stageCounter || 0) + 1;
    nv.mapId = `stage_${Date.now()}_${this.stageCounter}`;
    nv.label = `Tầng ${this.segs.length - k} (#${this.stageCounter})`;
    const nvEl = vesselElements(nv);
    const inSpaceNow = nv.ref !== 'earth' || nv.alt >= 45000;
    const goingToSpace = inSpaceNow || nv.alt >= 30000 || (nvEl && nvEl.ap > R_E + 65000);
    const recoverable = !junk && !inSpaceNow && ((this.mission.id === 'recover' && !this.boosterReleased) || nv.deployables('legs').some((d) => d.seg === k)) && nv.info.tVac > 0 && this.fuel[k] > 0.3;
    if (recoverable) {
      nv.kind = 'booster';
      nv.rec = new BoosterRecovery(nv, this.sc);
      this.boosterReleased = true;
      this.setFlag('sep');
      this.event('Tách tầng 1 – bắt đầu quy trình thu hồi.', 'warn');
    } else {
      nv.kind = 'stage';
      if (goingToSpace) {
        nv.destinedForSpace = true;
        if (inSpaceNow) {
          this.stabilizeSpaceVessel(nv);
          nv.orbitStabilized = true;
        }
        this.event(`Tách ${nv.label} – tiếp tục bay theo quỹ đạo vũ trụ!`, 'warn');
      } else {
        this.event(`Tách tầng ${this.segs.length - k}!`, 'warn');
      }
    }
    this.vessels.push(nv);
    if (v === this.player) {
      this.player.ctl.rcs = [0, 0, 0];
      if (!this.program) this.player.engineOn = this.ignited && this.throttle > 0;
      if (!v.hasLegs()) { v.legsTarget = 0; v.legsT = 0; }
      if (!v.hasGridFins()) { v.finsTarget = 0; v.finsT = 0; }
    }
    this.burstAt(nv, 40, 2.5);
    audio.thunk(0.9);
    return nv;
  }

  /** free-flying light debris (SRBs, escape tower, wreckage) simulated in ECI */
  makeDebris(v, obj, pushSpeed, spin = 1) {
    v.root.updateMatrixWorld(true);
    obj.updateWorldMatrix(true, false);
    const inv = new THREE.Matrix4().copy(v.root.matrixWorld).invert().multiply(obj.matrixWorld);
    const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    inv.decompose(p, q, sc);
    const b = v.beta, ax = Math.sin(b), ay = Math.cos(b), ex = Math.cos(b), ey = -Math.sin(b);
    const s = { x: v.s.x + ex * p.x + ax * p.y, y: v.s.y + ey * p.x + ay * p.y, z: v.s.z + p.z, vx: v.s.vx, vy: v.s.vy, vz: v.s.vz };
    let dx = p.x, dz = p.z; const dl = Math.hypot(dx, dz) || 1;
    s.vx += (ex * dx / dl) * pushSpeed; s.vy += (ey * dx / dl) * pushSpeed; s.vz += (dz / dl) * pushSpeed;
    this.scene.add(obj);
    obj.position.set(0, 0, 0); obj.quaternion.copy(q); obj.scale.copy(sc);
    this.debris.push({ obj, s, beta: b, q0: q.clone(), av: new THREE.Vector3((Math.random() - 0.5) * 0.4 * spin, (Math.random() - 0.5) * 0.4 * spin, (Math.random() - 0.5) * 0.4 * spin + (dx > 0 ? -0.2 : 0.2) * spin), life: 0, landed: false, dq: new THREE.Quaternion() });
    for (const pl of this.plumes) { let o = pl.nz.node; while (o) { if (o === obj) { pl.detached = true; break; } o = o.parent; } }
    return this.debris[this.debris.length - 1];
  }

  jettisonBooster(v, b) {
    b.attached = false;
    const oldCom = v.com.y, ax = v.axis();
    for (const o of b.objs) this.makeDebris(v, o, 6);
    v.updateMass();
    v.s.x += ax.x * (v.com.y - oldCom); v.s.y += ax.y * (v.com.y - oldCom);
    audio.thunk(0.6);
    if (v === this.player) this.event('Tên lửa đẩy phụ cháy hết – tách ra!', 'warn');
  }

  burstAt(v, n, size) {
    if (v.ref !== 'earth' && v.ref !== 'moon') return;
    const k = v.ref === 'earth' ? Math.exp(-Math.max(0, v.alt) / 5600) : 0;
    const x = v.sx, y = Math.max(v.alt, 1), z = v.s.z;
    for (let i = 0; i < n; i++) {
      const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(8 + Math.random() * 10);
      this.smoke.emit(x, y, z, v.vSurf.e + d.x, v.vSurf.u + d.y, d.z, { life: 3 + Math.random() * 2, size0: size, size1: size * (4 + 10 * (1 - k)), alpha: 0.5, drag: 0.6 * k + 0.02, buoy: 0, color: [0.9, 0.9, 0.9] });
    }
  }

  explode(v, reason) {
    if (v.dead) return;
    const isPlayer = v === this.player;
    if (isPlayer) {
      const a = Math.abs(v.aoa || 0);
      const offDeg = Math.round(Math.min(a, Math.PI - a) * 180 / Math.PI);
      this.lastCrashSnapshot = {
        reason,
        qNow: v.qNow || 0,
        offDeg,
        activeFuel: this.fuel[v.activeSeg] || 0,
        totalFuel: v.fuelTotal(),
        segRemaining: v.segIdx.length,
        activeStageNum: this.segs.length - v.activeSeg,
        throttle: this.throttle,
        wasEngineOn: v.engineOn,
        details: v.crashDetails || null,
        alt: v.alt - this.startAlt,
        speedSurf: v.speedSurf || Math.hypot(v.vSurf?.e || 0, v.vSurf?.u || 0),
        tiltDeg: Math.round(Math.abs(v.ang || 0) * 180 / Math.PI),
      };
      this.phase = 'crashed';
      this.program = null;
    }
    v.crashed = true; v.engineOn = false;
    this.event('💥 ' + (isPlayer ? '' : (v.kind === 'booster' ? 'Tầng 1: ' : 'Tầng bỏ: ')) + reason, 'bad');
    const big = isPlayer || v.kind === 'booster';
    if (v.ref === 'earth' || v.ref === 'moon') {
      const x = v.sx, y = Math.max(v.alt, 1), z = v.s.z;
      const air = v.ref === 'earth' ? Math.exp(-Math.max(0, v.alt) / 5600) : 0;
      const nF = big ? 500 : 140, nS = big ? 260 : 70;
      for (let i = 0; i < nF; i++) {
        const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar(Math.random() * 45);
        this.fire.emit(x + d.x * 0.1, y + d.y * 0.1, z + d.z * 0.1, v.vSurf.e * 0.3 + d.x, v.vSurf.u * 0.3 + d.y, d.z, { life: 0.8 + Math.random() * 1.4, size0: 5, size1: 22 + Math.random() * 20, alpha: 1, drag: 1.5, buoy: 3, color: [6, 3, 1.2] });
      }
      for (let i = 0; i < nS; i++) {
        const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.2, Math.random() - 0.5).normalize().multiplyScalar(Math.random() * 30);
        this.smoke.emit(x + d.x * 0.2, y + d.y * 0.2, z + d.z * 0.2, v.vSurf.e * 0.3 + d.x, v.vSurf.u * 0.3 + d.y, d.z, { life: 8 + Math.random() * 8, size0: 8, size1: 45 + Math.random() * 40, alpha: 0.85, drag: 0.8 * air + 0.05, buoy: 2.5 * air, heat: 1.2, color: [0.28, 0.26, 0.25] });
      }
    }
    for (const k of v.segIdx) {
      const g = this.rocket.segGroups[k];
      for (const child of [...g.children]) {
        const d = this.makeDebris(v, child, 10 + Math.random() * 25, 12);
        d.s.vx += (Math.random() - 0.5) * 8; d.s.vy += (Math.random() - 0.5) * 8;
      }
    }
    for (const d of this.rocket.deployables) if (v.owns(d.seg)) for (const o of d.objs) if (o.parent && o.parent !== this.scene) this.makeDebris(v, o, 6, 8);
    v.dead = true;
    if (v.root) v.root.visible = false;
    if (big) { this.flash = 1; this.flashPos = { x: v.sx, y: v.alt, z: v.s.z }; this.shakeBoost = 3; audio.explosion(1); }
    if (isPlayer) { audio.silenceEngine(); setTimeout(() => this.showResult(false, reason), 3500); }
  }

  // =================================================================== SURFACE MODEL
  surfaceAt(v) {
    if (v.ref !== 'earth') return { h: moonHeight(Math.sin(v.phiRot), Math.cos(v.phiRot), 0), water: false, site: v.ref };
    const sx = v.sx, sz = v.s ? (v.s.z || 0) : 0;
    const dist = Math.hypot(sx, sz);
    if (!v.isRover && Math.abs(sx) < 7 && Math.abs(sz) < 7) return { h: PAD_TOP, water: false, site: 'pad' };
    if (dist < PAD_RADIUS) return { h: 6, water: false, site: 'pad' };
    if (dist < PAD_RADIUS + 22) return { h: 6 * (1 - (dist - PAD_RADIUS) / 22), water: false, site: 'pad' };
    if (this.shipX !== null && Math.abs(sx - this.shipX) < 44) return { h: 3.0, water: false, site: 'ship' };
    if (Math.abs(sx - LZ_X) < 44) return { h: 0.3, water: false, site: 'lz' };
    if (sx > COAST_X) return { h: 0, water: true, site: 'sea' };
    return { h: 0, water: false, site: 'land' };
  }

  // =================================================================== MISSION TRACKING
  renderMissionPanel(force) {
    const objs = this.mission.objectives;
    if (!objs.length) return;
    const sig = objs.map((o) => (this.flags[o.id] ? 1 : 0)).join('');
    if (!force && sig === this.missionSig) return;
    this.missionSig = sig;
    $('mp-title').textContent = this.mission.icon + ' ' + this.mission.name;
    $('mp-list').innerHTML = objs.map((o) => `<div class="mp-row ${this.flags[o.id] ? 'done' : ''}"><i>${this.flags[o.id] ? '✔' : '○'}</i>${o.text}</div>`).join('');
  }

  checkObjectives() {
    const v = this.player;
    if (!v || this.phase === 'crashed') return;
    const F = this.flags;
    if (v.ref === 'earth' && v.alt > ATM_TOP && !F.space) { this.setFlag('space'); this.setFlag('alt70'); }
    if (v.ref === 'earth' && v.alt > ATM_TOP && !F.orbit) {
      const el = vesselElements(v);
      if (el.e < 1 && el.pe - R_E > ATM_TOP) {
        this.setFlag('orbit');
        this.milestone('VÀO QUỸ ĐẠO!', `Cận điểm ${fmt((el.pe - R_E) / 1000)} km · viễn điểm ${fmt((el.ap - R_E) / 1000)} km`);
        this.event('🛰 Đã vào quỹ đạo ổn định!');
      }
    }
    if (v.ref !== 'earth') {
      const B = BODIES[v.ref] || BODIES.moon;
      const soiKey = v.ref + 'SOI';
      const orbKey = v.ref === 'moon' ? 'lunarOrbit' : v.ref + 'Orbit';
      if (!F[soiKey]) { this.setFlag(soiKey); this.milestone(B.label.toUpperCase(), 'Đã vào vùng hấp dẫn của ' + B.label); }
      if (!F[orbKey] && v.alt > Math.max(10e3, B.atm)) {
        const el = vesselElements(v);
        if (el.e < 1 && el.pe - B.R > Math.max(8e3, B.atm)) this.setFlag(orbKey);
      }
    }
    if (this.iss.visible || this.mission.id === 'iss') {
      const d = this.issDistance();
      if (d < 1000 && !F.near) { this.setFlag('near'); this.event('Đã tiếp cận ISS (< 1 km).'); }
    }
    // mission completion
    const objs = this.mission.objectives;
    if (objs.length && objs.every((o) => F[o.id]) && !this.completeTimer && !this.resultShown) {
      this.completeTimer = setTimeout(() => this.showResult(true, 'Hoàn thành nhiệm vụ: ' + this.mission.name + '!'), 4500);
      this.milestone('NHIỆM VỤ HOÀN THÀNH', this.mission.name);
    }
    if (!objs.length && F.orbit && !this._freeOrbitNotified) {
      this._freeOrbitNotified = true;
      this.event('🛰 Chúc mừng! Bạn có thể tự do điều khiển tàu trong quỹ đạo hoặc bấm menu để về xưởng.');
    }
  }

  issDistance() {
    const ip = this.issOrbit.pos(this.simT), s = this.player.s;
    return Math.hypot(ip.x - s.x, ip.y - s.y, -s.z);
  }

  dockPortOffset() {
    const dp = this.rocket.dockPort;
    const v = this.player;
    if (dp && v.owns(dp.seg)) {
      const part = this.lay.parts.find((p) => p.item.type === 'dockPort');
      const top = (part ? part.y : dp.obj.position.y) + (dp.obj.userData.port ? dp.obj.userData.port.position.y : 0.8);
      return Math.max(top, v.com.maxY) - v.com.y;
    }
    return v.com.maxY - v.com.y;
  }

  dockGeometry() {
    const t = this.simT, T = this.issOrbit, a = T.angle(t);
    const ip = T.pos(t), iv = T.vel(t);
    const ex = Math.cos(a), ey = -Math.sin(a), ux = Math.sin(a), uy = Math.cos(a);
    const lx = this.issPortLocal.x, ly = this.issPortLocal.y;
    const portS = { x: ip.x + ex * lx + ux * ly, y: ip.y + ey * lx + uy * ly, z: 0 };
    const dxp = portS.x - ip.x, dyp = portS.y - ip.y;
    const velS = { x: iv.x + dyp * T.n, y: iv.y - dxp * T.n, z: 0 };
    const v = this.player, L = this.dockPortOffset();
    const portV = { x: v.s.x + Math.sin(v.beta) * L, y: v.s.y + Math.cos(v.beta) * L, z: v.s.z };
    return { portV, portS, axisS: { x: -ex, y: -ey }, velS, beta: angOf(ex, ey), L };
  }

  checkDocking() {
    const v = this.player;
    if (!v || this.docked || v.crashed || v.ref !== 'earth') return;
    const d = this.dockGeometry();
    const e = Math.hypot(d.portV.x - d.portS.x, d.portV.y - d.portS.y, d.portV.z - d.portS.z);
    this.dockDist = e;
    if (e > 25) return;
    const rv = Math.hypot(v.s.vx - d.velS.x, v.s.vy - d.velS.y, v.s.vz - d.velS.z);
    const att = Math.abs(wrapPi(v.beta - d.beta));
    if (e < 0.95 && rv < 1.5 && att < 0.30) {
      this.docked = { beta: d.beta, L: d.L };
      this.throttle = 0;
      if (this.program) {
        if (this.program.phase !== undefined) this.program.phase = 'docked';
        this.programDone = true;
        this.program = null;
      }
      this.applyDockLock();
      this.setFlag('docked');
      this.event('🛰 GHÉP NỐI THÀNH CÔNG! Tên lửa đã khóa chặt vào cổng ISS và bay cùng trạm.', '');
      this.milestone('GHÉP NỐI THÀNH CÔNG', 'Tên lửa đã gắn vào ISS và bay cùng quỹ đạo trạm');
      audio.thunk(0.5);
    } else if (e < 0.95 && !this.dockWarned) { this.dockWarned = true; this.event('Cổng đã chạm nhưng sai tư thế/vận tốc – giảm tốc độ!', 'warn'); }
    else if (e > 1.5) this.dockWarned = false;
  }

  // =================================================================== LIFECYCLE
  enter() {
    this.active = true;
    this.controls.enabled = this.camMode === 0;
    $('launch-ui').classList.remove('hidden');
  }

  exit() {
    this.archiveSpaceVessels();
    this.active = false;
    this.controls.enabled = false;
    $('launch-ui').classList.add('hidden');
    $('result').classList.add('hidden');
    this.map.toggle(false);
    audio.silenceEngine();
    clearTimeout(this.completeTimer);
  }

  onResize(w, h) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }

  buildFailureReasons(sub) {
    const reasons = [];
    const snap = this.lastCrashSnapshot;
    const P = this.player;
    const d = snap?.details || P?.crashDetails || null;

    if (!this.lifted && this.met > 35) {
      const twr = this.thrustTotalSL() / ((P?.com?.mass || 1) * G_E);
      if (this.thrustTotalSL() <= 0) {
        reasons.push(tr(
          'Tầng dưới cùng chưa được lắp động cơ nên không có lực đẩy khi phóng.',
          'The bottom stage has no engine installed, producing zero liftoff thrust.'
        ));
      } else if (twr < 1) {
        reasons.push(tr(
          `Tỉ lệ Lực đẩy / Trọng lượng (TWR = ${twr.toFixed(2)}) nhỏ hơn 1.0 nên tên lửa quá nặng để nhấc khỏi bệ phóng.`,
          `Thrust-to-Weight Ratio (TWR = ${twr.toFixed(2)}) is below 1.0, so the rocket is too heavy to lift off.`
        ));
      } else if (this.throttle < 0.5) {
        reasons.push(tr(
          `Mức ga (Throttle = ${Math.round(this.throttle * 100)}%) để quá thấp, chưa đủ lực nâng tên lửa.`,
          `Throttle (${Math.round(this.throttle * 100)}%) was set too low to lift the rocket.`
        ));
      }
      return reasons;
    }

    if (snap && (sub?.includes('áp suất khí động') || sub?.includes('lật nhào'))) {
      reasons.push(tr(
        `Áp suất khí động đạt ${(snap.qNow / 1000).toFixed(1)} kPa kết hợp góc lệch hướng bay lớn (${snap.offDeg}°) vượt ngưỡng chịu lực làm gãy thân tên lửa.`,
        `High dynamic pressure (${(snap.qNow / 1000).toFixed(1)} kPa) combined with a large angle of attack (${snap.offDeg}°) exceeded structural limits.`
      ));
      reasons.push(tr(
        'Mẹo: Giữ mũi tên lửa bám sát hướng bay (chế độ SAS Prograde) hoặc giảm bớt ga khi vượt vùng Max-Q (độ cao 8–15 km).',
        'Tip: Keep the nose aligned with Prograde or throttle down slightly through Max-Q (8–15 km altitude).'
      ));
      return reasons;
    }

    if (d) {
      if (d.sp > d.vLim) {
        reasons.push(tr(
          `Vận tốc va chạm quá lớn: ${fmt(d.sp, 0)} m/s (giới hạn hạ cánh an toàn ≤ ${d.vLim} m/s).`,
          `Impact speed was too high: ${fmt(d.sp, 0)} m/s (safe landing limit ≤ ${d.vLim} m/s).`
        ));
      }
      if (d.where === 'water' && !P?.isBoat) {
        if (!d.chuteOk) {
          if (d.hasCapsule) {
            reasons.push(tr(
              'Chưa bung dù hạ cánh trước khi tiếp nước (nhấn phím P khi rơi xuống thấp để bung dù).',
              'Parachutes were not deployed before splashdown (press P during descent to deploy parachutes).'
            ));
          } else {
            reasons.push(tr(
              'Tên lửa lao xuống biển mà không có khoang chỉ huy mang dù hạ cánh.',
              'Rocket impacted the ocean without a crew capsule equipped with parachutes.'
            ));
          }
        }
      } else if (d.where === 'ground' && !P?.isRover && !P?.isPlane && !P?.isBoat) {
        if (!d.chuteOk && !d.legsOk) {
          if (d.hasCapsule || d.hasLegs) {
            reasons.push(tr(
              'Chưa bung dù hoặc chân đáp trước khi chạm đất (nhấn phím P để bung dù/chân hạ cánh).',
              'Parachutes or landing legs were not deployed before touchdown (press P to deploy).'
            ));
          } else {
            reasons.push(tr(
              'Tầng chạm đất không có dù hạ cánh hoặc chân đáp giảm chấn.',
              'The stage hit the ground without parachutes or landing legs.'
            ));
          }
        }
        if (d.sp <= d.vLim && d.horizSp >= 4) {
          reasons.push(tr(
            `Vận tốc trượt ngang khi tiếp đất quá cao (${fmt(d.horizSp, 1)} m/s, cần phanh ngang < 4 m/s).`,
            `Horizontal speed at touchdown was too high (${fmt(d.horizSp, 1)} m/s, must be < 4 m/s).`
          ));
        }
        if (d.tiltDeg > 25) {
          reasons.push(tr(
            `Góc nghiêng thân tàu khi chạm bề mặt quá lớn (${d.tiltDeg}° so với phương thẳng đứng).`,
            `Vehicle tilt angle at impact was too steep (${d.tiltDeg}° from vertical).`
          ));
        }
      }
    }

    if (snap) {
      if (snap.activeFuel <= 0.02 && snap.segRemaining > 1) {
        reasons.push(tr(
          `Tầng ${snap.activeStageNum} đã cháy hết nhiên liệu nhưng chưa nhấn phím SPACE để tách tầng và kích hoạt tầng tiếp theo.`,
          `Stage ${snap.activeStageNum} ran out of fuel, but SPACE was not pressed to stage and ignite the next stage.`
        ));
      } else if (snap.totalFuel <= 0.02) {
        reasons.push(tr(
          'Tên lửa đã đốt cạn toàn bộ nhiên liệu trước khi đạt đủ vận tốc quỹ đạo nên rơi trở lại.',
          'All propellant was exhausted before reaching orbital velocity, causing the rocket to fall back down.'
        ));
      } else if ((!snap.wasEngineOn || snap.throttle < 0.1) && snap.totalFuel > 0.1 && this.maxAlt < 50000) {
        reasons.push(tr(
          'Động cơ bị tắt hoặc mức ga (Throttle) quá thấp khi chưa lên quỹ đạo khiến tên lửa mất sức nâng và rơi xuống.',
          'Engines were shut off or throttled too low before reaching orbit, causing the rocket to fall.'
        ));
      } else if (this.maxAlt < 18000 && snap.tiltDeg > 55) {
        reasons.push(tr(
          `Tên lửa nghiêng mũi quá sớm (${snap.tiltDeg}°) khi còn ở độ cao thấp (${fmt(this.maxAlt, 0)} m) khiến quỹ đạo lao chúc xuống.`,
          `Rocket pitched over too steeply (${snap.tiltDeg}°) at low altitude (${fmt(this.maxAlt, 0)} m), driving its trajectory downward.`
        ));
      }
    }

    if (!reasons.length && sub) {
      reasons.push(tr(
        `Sự cố: ${sub} Hãy kiểm tra lại lực đẩy, nhiên liệu các tầng hoặc nhấn phím G để bật Lái tự động.`,
        `Incident: ${sub} Check stage thrust/fuel or press G to enable Autopilot.`
      ));
    }
    return reasons;
  }

  showResult(success, sub) {
    if (this.resultShown) return;
    this.resultShown = true;
    const isSpecial = this.player && (this.player.isRover || this.player.isBoat || this.player.isPlane);
    const alt = this.maxAlt;
    let rank = 'F';
    const objs = this.mission.objectives;
    if (isSpecial) {
      rank = success ? 'S' : 'A';
    } else if (objs.length) {
      const done = objs.filter((o) => this.flags[o.id]).length;
      rank = done === objs.length ? 'S' : done / objs.length > 0.6 ? 'A' : done / objs.length > 0.3 ? 'B' : done > 0 ? 'C' : 'D';
    } else if (this.flags.orbit) rank = 'S';
    else if (alt >= 100000) rank = 'A';
    else if (alt >= 50000) rank = 'B';
    else if (alt >= 10000) rank = 'C';
    else if (alt >= 1000) rank = 'D';
    const title = success
      ? tr('NHIỆM VỤ THÀNH CÔNG', 'MISSION ACCOMPLISHED')
      : (this.player?.isRover
        ? tr('KẾT THÚC LÁI XE', 'DRIVE ENDED')
        : this.player?.isBoat
          ? tr('KẾT THÚC LƯỚT SÓNG', 'CRUISE ENDED')
          : tr('KẾT THÚC CHUYẾN BAY', 'FLIGHT ENDED'));
    $('r-title').textContent = title;
    $('r-rank').textContent = rank;
    $('r-sub').textContent = sub || '';
    const reasonEl = $('r-reason');
    if (reasonEl) {
      if (!success) {
        const reasons = this.buildFailureReasons(sub);
        if (reasons.length) {
          reasonEl.innerHTML = `<div class="rr-title">⚠️ ${tr('Nguyên nhân chi tiết', 'Detailed Cause')}</div><ul>${reasons.map((r) => `<li>${r}</li>`).join('')}</ul>`;
          reasonEl.classList.remove('hidden');
        } else {
          reasonEl.classList.add('hidden');
        }
      } else {
        reasonEl.classList.add('hidden');
      }
    }
    $('r-alt').textContent = alt >= 10000 ? fmt(alt / 1000, 1) + ' km' : fmt(alt) + ' m';
    $('r-vel').textContent = fmt(this.maxVel) + ' m/s';
    $('r-time').textContent = fmt(Math.max(0, this.met)) + ' s';
    $('r-g').textContent = fmt(this.maxG, 1) + ' G';
    $('result').classList.remove('hidden');
  }

  // =================================================================== SIMULATION
  get env() {
    return this._env || (this._env = { surface: (v) => this.surfaceAt(v) });
  }

  effectiveWarp() {
    let w = this.program ? (this.reqWarpPrev || 1) : this.userWarp;
    if (this.phase === 'countdown') w = 1;
    let cap = Infinity;
    for (const v of this.vessels) {
      if (v.dead || v.crashed) continue;
      const atm = v.ref === 'earth' && v.alt < ATM_TOP;
      if (atm && (v.engineOn || v.coreFiring || v.boosterFiring)) cap = Math.min(cap, 4);
      if (v.kind === 'booster' && v.rec && v.rec.phase !== 'done' && v.rec.phase !== 'lost') cap = Math.min(cap, 4);
      if (v === this.player && atm && v.alt < 30000 && v.vSurf.u < 0) cap = Math.min(cap, 10);
      if (v === this.player && v.ref !== 'earth' && !v.landed && v.alt < Math.max(40e3, (v.body?.atm || 0) + 10e3)) cap = Math.min(cap, 10);
    }
    if (this.player && this.mission.id === 'iss' && this.flags.orbit && !this.docked && this.issDistance() < 2500) cap = Math.min(cap, 4);
    return Math.min(w, cap);
  }

  needsFine() {
    for (const v of this.vessels) {
      if (v.dead) continue;
      if (v.engineOn || (v.clamped && this.phase === 'countdown')) return true;
      if (v.ref === 'earth' && !v.clamped && !v.landed && v.alt < ATM_TOP) return true;
      if (v.ref !== 'earth' && !v.landed && v.alt < Math.max(50e3, (v.body?.atm || 0) + 15e3)) return true;
      const r = v.ctl.rcs; if (r[0] || r[1] || r[2]) return true;
    }
    if (this.mission.id === 'iss' && this.flags.orbit && !this.docked && this.issDistance() < 800) return true;
    return false;
  }

  applyControls(h) {
    const v = this.player;
    if (!v || v.crashed) return;
    const kb = this.keys;
    const input = (kb['d'] || kb['arrowright'] ? 1 : 0) - (kb['a'] || kb['arrowleft'] ? 1 : 0);
    v.ctl.input = input;
    const drive = (kb['w'] || kb['arrowup'] ? 1 : 0) - (kb['s'] || kb['arrowdown'] ? 1 : 0);
    v.ctl.drive = drive;
    // Special vehicles (Rover, Boat, Plane) or non-flight phases use specialized 2D controls
    const isSpecial = v.isSpecial;

    if (!isSpecial && this.phase === 'flight') {
      if (!this.program) v.ctl.targetBeta = null;
      const screenRight = input;
      const screenAway = drive;

      if (screenRight !== 0 || screenAway !== 0) {
        if (this.program) this.toggleAutopilot();

        const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);

        const steer = new THREE.Vector3();
        if (screenRight !== 0) steer.addScaledVector(camRight, screenRight);
        if (screenAway !== 0) steer.addScaledVector(camForward, screenAway);
        steer.normalize();

        if (!v.dir3D) v.dir3D = new THREE.Vector3(0, 1, 0);
        const dot = v.dir3D.dot(steer);
        let tangent = steer.clone().sub(v.dir3D.clone().multiplyScalar(dot));
        if (tangent.lengthSq() > 1e-6) {
          tangent.normalize();
        } else {
          tangent = camRight.clone().sub(v.dir3D.clone().multiplyScalar(v.dir3D.dot(camRight))).normalize();
        }

        const thrust = v.thrustNow || 0;
        const gimbal = thrust > 0 ? 0.35 : 0;
        const finAuth = (v.finsT || 0) * Math.min(0.8, (v.qNow || 0) / 15000);
        const rcsAuth = (v.ctl.rcs[0] || v.ctl.rcs[1] || v.ctl.rcs[2]) ? 0.25 : 0.05;
        const auth = (0.28 + gimbal + finAuth + rcsAuth) * Math.min(1.5, Math.max(0.35, 35 / v.mass));
        const turnRate = THREE.MathUtils.clamp(auth * 0.6, 0.22, 0.75);

        v.dir3D.addScaledVector(tangent, turnRate * h).normalize();
        if (v.holdDir3D) v.holdDir3D.copy(v.dir3D);
        v.syncBetaFromDir3D();
        this.holdBeta = v.beta;
      } else if (this.sas && !this.program) {
        let targetDir = null;
        if (this.sasMode === 0) {
          targetDir = v.holdDir3D || v.dir3D;
        } else if (this.sasMode === 1 || this.sasMode === 2) {
          const vs = v.vSurf;
          const low = v.ref === 'earth' && v.alt < 40000;
          let vel = low ? new THREE.Vector3(vs.e, vs.u, vs.z) : new THREE.Vector3(v.vOrb.e, v.vOrb.u, v.s.vz);
          if (vel.length() > 0.5) {
            targetDir = vel.normalize();
            if (this.sasMode === 2) targetDir.negate();
          }
        } else if (this.sasMode === 3) {
          targetDir = new THREE.Vector3(0, 1, 0);
        } else if (this.sasMode === 4) {
          targetDir = new THREE.Vector3(0, -1, 0);
        } else if (this.sasMode === 5 || this.sasMode === 6) {
          const ip = this.issOrbit.pos(this.simT);
          const E = v.east, U = v.up, S = v.s;
          const dx = ip.x - S.x, dy = ip.y - S.y, dz = (ip.z || 0) - S.z;
          const tDir = new THREE.Vector3(dx * E.x + dy * E.y, dx * U.x + dy * U.y, dz);
          if (tDir.length() > 1) {
            targetDir = tDir.normalize();
            if (this.sasMode === 6) targetDir.negate();
          }
        }

        if (targetDir) {
          const d = THREE.MathUtils.clamp(v.dir3D.dot(targetDir), -1, 1);
          if (d < 0.9999) {
            const tangent = targetDir.clone().sub(v.dir3D.clone().multiplyScalar(d)).normalize();
            const alignRate = Math.min(1.2, Math.acos(d) * 1.8);
            v.dir3D.addScaledVector(tangent, alignRate * h).normalize();
            if (this.sasMode === 0 && v.holdDir3D) v.holdDir3D.copy(v.dir3D);
            v.syncBetaFromDir3D();
            this.holdBeta = v.beta;
          }
        }
      }
    } else {
      if (input !== 0) {
        this.holdBeta = v.beta;
        if (this.program && this.phase === 'flight') this.toggleAutopilot();
      }
      // manual flight for rover/boat/plane
      if (this.sas && input === 0 && this.phase !== 'ready') {
        v.ctl.targetBeta = this.sasTarget(v);
        v.ctl.kp = 2.2;
        v.ctl.kd = 2.8;
      } else {
        v.ctl.targetBeta = null;
      }
      v.syncDir3DFromBeta();
      if (v.holdDir3D) v.holdDir3D.copy(v.dir3D);
    }

    // RCS
    const dockAuto = this.program && this.program.phase && (this.program.phase === 'approach' || this.program.phase === 'final');
    if (!dockAuto && !this.docked) {
      const rf = (kb['i'] ? 1 : 0) - (kb['k'] ? 1 : 0), rn = (kb['l'] ? 1 : 0) - (kb['j'] ? 1 : 0), rz = (kb['h'] ? 1 : 0) - (kb['n'] ? 1 : 0);
      if (!this.program || rf || rn || rz) v.ctl.rcs = [rf, rn, rz];
    }
    if (this.program && this.phase === 'flight') return;

    if (this.phase === 'flight' || this.phase === 'countdown') {
      v.throttle = this.throttle;
      let on = this.ignited && this.throttle > 0;
      const k = v.activeSeg;
      if (on && v.segIdx.length > 1 && !this.boosterReleased && v.deployables('legs').some((d) => d.seg === k)) {
        const reserve = this.segInfo[k].dry * (Math.exp(600 / 2900) - 1);
        if (this.fuel[k] <= reserve + 1e-3) {
          on = false;
          if (!this.mecoWarned) { this.mecoWarned = true; this.event('Tầng 1 dừng ở mức nhiên liệu dự trữ để hạ cánh – nhấn SPACE để tách tầng.', 'warn'); }
        }
      }
      v.engineOn = on;
    }
  }

  sasTarget(v) {
    switch (this.sasMode) {
      case 1: return v.ref === 'earth' && v.alt < 40000 ? v.phi + Math.atan2(v.vSurf.e, v.vSurf.u) : progradeBeta(v);
      case 2: return (v.ref === 'earth' && v.alt < 40000 ? v.phi + Math.atan2(v.vSurf.e, v.vSurf.u) : progradeBeta(v)) + Math.PI;
      case 3: return v.phi;
      case 4: return v.phi + Math.PI;
      case 5: case 6: {
        const ip = this.issOrbit.pos(this.simT);
        const a = angOf(ip.x - v.s.x, ip.y - v.s.y);
        return this.sasMode === 5 ? a : a + Math.PI;
      }
      default: return this.holdBeta;
    }
  }

  handleEvents(v) {
    for (const e of v.events.splice(0)) {
      const type = e[0];
      if (type === 'fuelOut') {
        if (v === this.player) {
          if (!this.fuelNote?.[e[1]]) {
            (this.fuelNote ||= {})[e[1]] = true;
            this.event(`Tầng ${this.segs.length - e[1]} hết nhiên liệu.`, 'warn');
          }
          if (this.program) this.checkAutoStage(v);
        }
      } else if (type === 'boosterOut') this.jettisonBooster(v, e[1]);
      else if (type === 'liftoff') {
        if (v === this.player) {
          if (!this.lifted) { this.lifted = true; this.event('🚀 CẤT CÁNH!'); }
          else if (v.ref === 'moon' && this.flags.moonLanded) { this.setFlag('moonLeft'); this.event('Cất cánh khỏi Mặt Trăng!'); }
        }
      } else if (type === 'landed') this.onLanded(v, e[1], e[2]);
      else if (type === 'crash') this.explode(v, e[1]);
    }
  }

  onLanded(v, how, site) {
    if (v === this.player) {
      if (v.ref !== 'earth') {
        const B = BODIES[v.ref] || BODIES.moon;
        this.event('Hạ cánh xuống ' + B.label + ' an toàn!');
        this.setFlag(v.ref + 'Landed');
        this.milestone('MỘT BƯỚC NHỎ', 'Hạ cánh thành công xuống ' + B.label + '!');
        this.moonLandT = this.simT;
      } else if (this.lifted && this.simT - (this.launchT || 0) > 30) {
        this.event(how === 'splash' ? 'Hạ thủy an toàn!' : 'Hạ cánh an toàn!');
        if (this.mission.id === 'moon' && this.flags.moonLeft) { this.setFlag('home'); this.milestone('VỀ NHÀ', 'Trở về Trái Đất an toàn!'); }
        else if (this.mission.id === 'orbit' && !v.isPlane && !v.isRover && !v.isBoat) setTimeout(() => this.showResult(this.maxAlt > 1000, 'Tên lửa đã hạ xuống an toàn.'), 2500);
      }
    } else if (v.kind === 'booster') {
      this.setFlag('boosterLanded');
      this.pipKeep = 9;
      this.event(site === 'ship' ? '🚢 Tầng 1 hạ cánh trên sà lan!' : site === 'lz' ? '🎯 Tầng 1 hạ cánh trên bãi đáp LZ-1!' : 'Tầng 1 hạ cánh (ngoài bãi đáp).');
      this.milestone('TẦNG 1 ĐÃ HẠ CÁNH', site === 'ship' ? 'Sà lan "Dĩ nhiên tôi vẫn yêu bạn"' : 'Sẵn sàng tái sử dụng!');
    }
  }

  applyDockLock() {
    const v = this.player;
    if (!v || !this.docked) return;
    const d = this.dockGeometry();
    const L = this.dockPortOffset();
    this.docked.L = L;
    this.docked.beta = d.beta;
    v.beta = d.beta;
    v.omega = 0;
    v.s.x = d.portS.x + d.axisS.x * L;
    v.s.y = d.portS.y + d.axisS.y * L;
    v.s.z = d.portS.z || 0;
    v.s.vx = d.velS.x;
    v.s.vy = d.velS.y;
    v.s.vz = d.velS.z || 0;
    v.ctl.rcs = [0, 0, 0];
    v.ctl.input = 0;
    v.ctl.drive = 0;
    v.ctl.targetBeta = d.beta;
    v.engineOn = false;
    v.coreFiring = false;
    v.boosterFiring = false;
    v.thrustNow = 0;
    v.qNow = 0;
    v.accelNow = 0;
    v.updateFrame(this.simT);
    v.syncDir3DFromBeta();
    if (v.holdDir3D && v.dir3D) v.holdDir3D.copy(v.dir3D);
    this.holdBeta = v.beta;
  }

  frameOf(s, t) {
    const ref = refBody(s.x, s.y, s.z, t), B = bodyInfo(ref);
    const bp = { x: 0, y: 0, z: 0 };
    bodyState(ref, t, bp, { x: 0, y: 0, z: 0 });
    const dx = s.x - bp.x, dy = s.y - bp.y, r = Math.hypot(dx, dy);
    return { ref, B, dx, dy, r, alt: Math.hypot(dx, dy, s.z - bp.z) - B.R, phi: angOf(dx, dy), phiRot: wrapPi(angOf(dx, dy) - bodyRotation(ref, t)) };
  }

  stepDebris(d, h) {
    const T = this.simT;
    const fr = this.frameOf(d.s, T);
    d.life += h;
    const surf = this.surfaceAt({ ref: fr.ref, sx: fr.phiRot * fr.B.R, phiRot: fr.phiRot });
    if (d.landed) {
      if (d.life - d.landT > 45) d.dead = true;
      return;
    }
    let ax = 0, ay = 0;
    if (fr.ref === 'earth' && fr.alt < ATM_TOP) {
      const rho = 1.225 * Math.exp(-Math.max(0, fr.alt) / 5600);
      const vrx = d.s.vx + OMEGA_E * fr.dy, vry = d.s.vy - OMEGA_E * (d.s.x);
      const sp = Math.hypot(vrx, vry);
      const k = 0.5 * rho * sp * 0.006;
      ax = -k * vrx; ay = -k * vry;
    }
    const nsub = Math.max(1, Math.ceil(h / 0.1));
    for (let i = 0; i < nsub; i++) rk4(d.s, T, h / nsub, ax, ay, 0);
    d.dq.setFromEuler(new THREE.Euler(d.av.x * h, d.av.y * h, d.av.z * h));
    d.q0.multiply(d.dq);
    const fr2 = this.frameOf(d.s, T);
    if (fr2.alt < surf.h + 0.8 && !d.landed) {
      d.landed = true; d.landT = d.life;
      const sp = Math.hypot(d.s.vx, d.s.vy);
      d.av.set(0, 0, 0);
      if (surf.water) { d.dead = true; return; }
      d.landSx = fr2.phiRot * fr2.B.R; d.landRef = fr2.ref; d.landH = surf.h + 0.6;
      if (sp > 40) this.puffAtDebris(fr2, surf.h);
    }
    if (fr2.alt < -50 || d.life > 240) d.dead = true;
  }

  puffAtDebris(fr, h) {
    const x = fr.phiRot * fr.B.R;
    for (let j = 0; j < 14; j++) this.fire.emit(x, h + 1, 0, (Math.random() - 0.5) * 25, Math.random() * 18, (Math.random() - 0.5) * 25, { life: 1, size0: 3, size1: 11, alpha: 0.9, drag: 1.2, buoy: 3, color: [6, 3, 1] });
    for (let j = 0; j < 14; j++) this.smoke.emit(x, h + 1.5, 0, (Math.random() - 0.5) * 12, Math.random() * 8, (Math.random() - 0.5) * 12, { life: 8, size0: 5, size1: 24, alpha: 0.6, drag: 0.5, buoy: 1.5, color: [0.3, 0.28, 0.26], heat: 0.5 });
  }

  /** fix landed debris onto the rotating surface */
  pinDebris(d) {
    const T = this.simT, B = bodyInfo(d.landRef), bp = { x: 0, y: 0, z: 0 }, bv = { x: 0, y: 0, z: 0 };
    bodyState(d.landRef, T, bp, bv);
    const psi = d.landSx / B.R + bodyRotation(d.landRef, T), r = B.R + d.landH;
    d.s.x = bp.x + Math.sin(psi) * r; d.s.y = bp.y + Math.cos(psi) * r; d.s.z = 0;
    d.s.vx = d.s.vy = d.s.vz = 0;
  }

  simStep(h) {
    const T = this.simT;
    if (!this.docked) this.applyControls(h);
    const P = this.player;
    if (!this.docked && this.program && (this.phase === 'flight' || (this.phase === 'countdown' && this.ignited)) && !P.crashed) {
      this.checkAutoStage(P);
      if (this.phase === 'flight') {
        const k = P.activeSeg;
        if (P.segIdx.length === 1 && this.fuelMax[k] > 0 && this.fuel[k] < this.fuelMax[k] * 0.15) {
          this.fuel[k] = this.fuelMax[k] * 0.15;
        }
        const r = this.program.update(P, this.sc, h);
        this.checkAutoStage(P);
        if (r === 'done' && !this.programDone) {
          this.programDone = true; this.program = null; P.ctl.targetBeta = null; this.holdAttitude(); P.engineOn = false;
          this.event(tr('Lái tự động hoàn tất nhiệm vụ.', 'Autopilot mission completed.'));
        }
      }
    }
    for (const v of this.vessels) if (v.rec && !v.crashed && !v.dead) v.rec.update(h);
    for (const v of this.vessels.slice()) {
      if (v.dead) continue;
      if (v === P && this.docked) {
        const dRate = h * 0.6;
        v.legsT += THREE.MathUtils.clamp(v.legsTarget - v.legsT, -dRate, dRate);
        v.finsT += THREE.MathUtils.clamp(v.finsTarget - v.finsT, -h * 1.5, h * 1.5);
        continue;
      }
      v.step(h, T, this.env);
      if (v !== P && !v.rec && !v.crashed && !v.landed) {
        if (v.ref !== 'earth' || v.alt >= 45000 || (v.destinedForSpace && v.vSurf.u <= 0 && v.alt >= 25000)) {
          if (!v.orbitStabilized) {
            this.stabilizeSpaceVessel(v);
            v.orbitStabilized = true;
          }
        }
      }
      this.handleEvents(v);
    }
    for (const d of this.debris) { if (d.landed && d.landRef) this.pinDebris(d); else this.stepDebris(d, h); }
    this.simT += h;
    if (this.phase !== 'ready') this.met += h;
    if (this.docked) this.applyDockLock();
    else this.checkDocking();
  }

  update(dt) {
    this.time += dt;
    const t = this.time;
    if (!this.rocket || !this.player) return;
    const kb = this.keys;
    if (!this.docked) {
      if (kb['shift']) this.throttle = Math.min(1, this.throttle + dt * 0.8);
      if (kb['control']) this.throttle = Math.max(0, this.throttle - dt * 0.8);
    }
    const P = this.player;

    // countdown & release
    if (this.phase === 'countdown') {
      const n = Math.ceil(-this.met);
      if (n !== this.lastCount && n >= 0) {
        this.lastCount = n;
        const cd = $('countdown');
        cd.textContent = n > 0 ? n : 'PHÓNG!';
        cd.classList.remove('pop'); void cd.offsetWidth; cd.classList.add('pop');
        audio.beep(n > 0 ? 880 : 1320, n > 0 ? 0.12 : 0.5, 0.25);
        if (n === 8) { this.event('Thu cần tiếp nhiên liệu.'); this.arms.forEach((a) => (a.target = 1)); }
        if (n === 6) this.event('Hệ thống phun nước giảm thanh kích hoạt.');
      }
      if (this.met >= -3 && !this.ignited) {
        const st = this.segInfo[P.activeSeg];
        if (st.tVac > 0 || this.rocket.boosters.some((b) => b.seg === P.activeSeg)) { this.ignited = true; P.engineOn = true; P.throttle = this.throttle; this.event('Đánh lửa động cơ chính!', 'warn'); }
        else if (!this.flags.noEngine) { this.flags.noEngine = true; this.event('Không có động cơ ở tầng 1!', 'bad'); }
      }
      if (this.met >= 0) {
        this.phase = 'flight'; this.released = true; this.launchT = this.simT;
        P.clamped = false;
        P.landed = { body: 'earth', sx: 0, h: P.clampSpot.h, site: 'pad', how: 'pad' }; P.landedLock = 0;
        this.clamps.forEach((c, i) => { c.rotation.z = (i % 2 ? 1 : -1) * 0.9; });
        this.event('Nhả kẹp giữ!');
        setTimeout(() => { $('countdown').textContent = ''; }, 900);
        const w = this.thrustTotalSL() / (P.com.mass * G_E);
        if (w < 1) this.event('Lực đẩy không đủ để cất cánh (TWR < 1)!', 'bad');
      }
    }

    // time warp
    const eff = this.effectiveWarp();
    this.warp = eff;
    let remaining = dt * eff;
    let guard = 0;
    const fine = this.needsFine();
    while (remaining > 1e-9 && guard++ < 700) {
      let h = fine ? 0.02 : Math.min(coastStep(P.s.x, P.s.y, P.s.z, this.simT) * 2, 30);
      h = Math.min(h, remaining);
      this.simStep(h);
      remaining -= h;
    }
    const simDt = dt * eff;
    this.reqWarpPrev = this.reqWarpNext || 1; this.reqWarpNext = null;
    this.vessels = this.vessels.filter((v) => !v.dead || v === this.player);
    this.debris = this.debris.filter((d) => { if (d.dead) { d.obj.parent && d.obj.parent.remove(d.obj); return false; } return true; });
    if (this.focus.dead) this.focus = P;
    if (!this.docked) this.checkDocking();

    // structural limits
    for (const v of this.vessels) {
      if (v.dead || v.crashed || v.chuteT > 0.05 || v.ref !== 'earth' || v.isPlane || v.isRover || v.isBoat) continue;
      const a = Math.abs(v.aoa || 0), off = Math.min(a, Math.PI - a);
      if (v.qNow > 50000 && off > 0.75) this.explode(v, 'Vỡ cấu trúc do bẻ lái gắt ở áp suất khí động cao!');
      else if (v.qNow > 18000 && off > 1.4) this.explode(v, 'Tên lửa lật nhào và vỡ tung!');
      else if (v.qNow > 22000 && off > 0.45 && !this._qWarn) {
        this._qWarn = true;
        this.event('⚠️ CẢNH BÁO: Áp suất khí động cao (Max-Q), hãy giữ hướng ổn định!', 'warn');
        setTimeout(() => { this._qWarn = false; }, 3500);
      }
    }
    // escape tower
    if (!this.towerGone && this.rocket.capsule && P.owns(this.rocket.capsule.seg) && P.alt > 25000 && this.rocket.capsule.obj.userData.tower && this.rocket.capsule.obj.userData.tower.visible) {
      this.towerGone = true;
      this.makeDebris(P, this.rocket.capsule.obj.userData.tower, 8, 1);
      this.event('Thả tháp thoát hiểm.');
    }

    // statistics
    if (this.phase === 'flight' && !P.crashed) {
      const alt = P.ref === 'earth' ? P.alt - this.startAlt : P.alt;
      this.maxAlt = Math.max(this.maxAlt, P.ref === 'earth' ? alt : 0, P.ref === 'moon' ? this.maxAlt : 0);
      this.maxVel = Math.max(this.maxVel, P.speedOrb);
      this.maxG = Math.max(this.maxG, P.accelNow || 1);
      if (P.qNow > this.maxQ) this.maxQ = P.qNow;
      else if (!this.maxQPassed && this.maxQ > 8000 && P.qNow < this.maxQ * 0.9) { this.maxQPassed = true; this.event(`Vượt Max Q (${fmt(this.maxQ / 1000, 1)} kPa).`); }
      const ms = [[1000, '1 km', null], [10000, '10 km', 'Vượt tầng đối lưu'], [30000, '30 km', 'Bầu trời tối dần'], [70000, 'ĐƯỜNG KÁRMÁN', 'Chào mừng đến với không gian! 70 km']];
      for (const [hh, big, small] of ms) {
        if (alt >= hh && !this.flags['alt' + hh]) {
          this.flags['alt' + hh] = true;
          this.event(`Đạt độ cao ${big === 'ĐƯỜNG KÁRMÁN' ? '70 km' : big}.`);
          if (small) this.milestone(big, small);
        }
      }
      if (this.moonLandT !== null && !this.flagSpot && this.simT - this.moonLandT > 4 && P.landed && P.ref !== 'earth') {
        const B = BODIES[P.ref] || BODIES.moon;
        const psi = P.phiRot + 14 / B.R;
        this.flagSpot = { body: P.ref, psi, h: moonHeight(Math.sin(psi), Math.cos(psi), 0) };
        this.event('🇻🇳 Cắm cờ Việt Nam trên ' + B.label + '!');
        this.milestone('CẮM CỜ', 'Lá cờ Việt Nam đã tung bay trên ' + B.label);
      }
      this.checkObjectives();
    }
    if (this.phase === 'flight' && !this.lifted && this.met > 8 && !this._padWarn && !P.crashed && !P.isRover && !P.isBoat && !P.isPlane) {
      this._padWarn = true;
      this.event('⚠️ Tên lửa chưa rời bệ: Bấm Shift để tăng ga hoặc kiểm tra lực đẩy động cơ!', 'warn');
    }
    if (this.phase === 'flight' && !this.lifted && this.met > 40 && !this.resultShown && !P.crashed && !P.isRover && !P.isBoat && !P.isPlane) {
      P.engineOn = false;
      this.showResult(false, 'Tên lửa không đủ lực đẩy để rời bệ phóng sau 40 giây.');
    }
    if (this.phase === 'crashed' && !this.resultShown && !this.flagSpot) { /* result scheduled by explode() */ }

    // scene animation
    for (const a of this.arms) a.pivot.rotation.y += ((a.target ? 1.3 : 0) - a.pivot.rotation.y) * (1 - Math.exp(-dt * 0.8));
    this.animateParts();
    this.placeScene(this.focus);
    this.scene.updateMatrixWorld(true);
    this.updateCamera(dt);
    const F = this.focus;
    const camAlt = Math.max(0, F.alt + this.camera.position.y);
    if (F.ref === 'earth') this.updateAtmosphere(camAlt); else this.spaceLighting();
    this.envForView(this.camera, F);
    this.updateEffects(dt, simDt);
    const camLocal = this.camera.position.clone().sub(this.world.position);
    const pdt = Math.min(simDt, 1);
    this.smoke.update(pdt, camLocal, 0);
    this.fire.update(pdt, camLocal, 0);
    for (const c of this.clamps) c.visible = this.phase === 'ready' || this.phase === 'countdown' || this.simT < (this.launchT || 0) + 4;
    this.groundUniforms.uTime.value = t;
    this.cloudMat.uniforms.uTime.value = t;
    this.beacons[0].material.emissiveIntensity = Math.sin(t * 3) > 0.6 ? 20 : 0.5;
    if (this.iss.userData.update) this.iss.userData.update(this.simT);
    if (this.ship.userData.update) this.ship.userData.update(t);
    if (this.flagObj.userData.update && this.flagObj.visible && Math.floor(t * 10) % 3 === 0) this.flagObj.userData.update(t);
    this.flash = Math.max(0, this.flash - dt * 1.5);
    this.flashLight.intensity = this.flash * 4e6;
    if (this.flashPos) this.flashLight.position.set(this.flashPos.x, this.flashPos.y, this.flashPos.z);
    this.updateHUD(dt);
  }

  thrustTotalSL() {
    const v = this.player, k = v.activeSeg;
    let T = this.segInfo[k].tSL;
    for (const b of v.boosters()) if (b.seg === k) T += PARTS.booster.thrustSL * b.count;
    return T;
  }

  animateParts() {
    const owner = {};
    for (const v of this.vessels) for (const k of v.segIdx) owner[k] = v;
    for (const d of this.rocket.deployables) {
      const v = owner[d.seg]; if (!v) continue;
      const t = d.type === 'legs' ? v.legsT : v.finsT;
      for (const o of d.objs) if (o.userData.setDeploy && o.userData._dt !== t) { o.userData._dt = t; o.userData.setDeploy(t); }
    }
    const cap = this.rocket.capsule;
    if (cap) {
      const v = owner[cap.seg];
      const t = v ? v.chuteT : 0;
      if (cap.obj.userData.setChute && cap.obj.userData._ct !== t) { cap.obj.userData._ct = t; cap.obj.userData.setChute(t); }
    }
    // Rover wheel rotation & front-wheel steering
    if (this.rocket.wheels) {
      const v = this.player;
      const spd = v ? (v.groundSpeed || (v.vSurf ? v.vSurf.e : 0)) : 0;
      const steer = v && v.ctl ? (v.ctl.input || 0) : 0;
      for (const wo of this.rocket.wheels) {
        const wg = wo.userData.wheelGroup;
        if (wg) {
          wg.rotation.order = 'YXZ';
          const sideSign = wo.userData.sideSign || 1;
          wg.rotation.x += spd * 0.05 * sideSign;
          const targetSteer = wo.userData.isFront ? (-steer * 0.42) : 0;
          wg.rotation.y += (targetSteer - wg.rotation.y) * 0.25;
        }
      }
    }
    // Boat propeller rotation
    if (this.rocket.partObjs) {
      const v = this.player;
      const spd = v ? (v.waterSpeed || 0) : 0;
      const running = v && (v.engineOn || Math.abs(spd) > 0.05);
      if (running) {
        for (const po of this.rocket.partObjs) {
          if (po.obj.userData.propGroup) po.obj.userData.propGroup.rotation.z += (Math.abs(spd) * 0.4 + 12) * 0.08;
        }
      }
    }
  }

  // =================================================================== SCENE PLACEMENT (floating origin at the focus vessel)
  placeScene(F) {
    const t = this.simT;
    const E = F.east, U = F.up, S = F.s, phi = F.phi;
    const proj = (x, y, z, out) => out.set((x - S.x) * E.x + (y - S.y) * E.y, (x - S.x) * U.x + (y - S.y) * U.y, z - S.z);
    this._proj = proj;
    for (const v of this.vessels) {
      if (v.dead) continue;
      proj(v.s.x, v.s.y, v.s.z, v.root.position);
      if (v.isPlane) {
        const qBase = this._qPlaneBase || (this._qPlaneBase = new THREE.Quaternion(0.5, 0.5, 0.5, -0.5));
        const pitch = (phi + Math.PI / 2) - v.beta;
        const bank = v.bank || 0;
        const heading = v.heading || 0;
        const qYaw = (this._qYaw || (this._qYaw = new THREE.Quaternion())).setFromAxisAngle(this._yAxis || (this._yAxis = new THREE.Vector3(0, 1, 0)), heading);
        const qPitch = (this._qPitch || (this._qPitch = new THREE.Quaternion())).setFromAxisAngle(this._zAxis || (this._zAxis = new THREE.Vector3(0, 0, 1)), pitch);
        const qBank = (this._qBank || (this._qBank = new THREE.Quaternion())).setFromAxisAngle(this._xAxis || (this._xAxis = new THREE.Vector3(1, 0, 0)), bank);
        v.root.quaternion.copy(qYaw).multiply(qPitch).multiply(qBank).multiply(qBase);
      } else if (v.isRover || v.isBoat) {
        const pitch = v.beta - phi;
        const yaw = Math.PI / 2 + (v.heading || 0);
        const roll = (v.ctl?.input || 0) * 0.06;
        v.root.rotation.set(-pitch, yaw, roll, 'YXZ');
      } else {
        if (v.dir3D) {
          const _up = this._vUp || (this._vUp = new THREE.Vector3(0, 1, 0));
          v.root.quaternion.setFromUnitVectors(_up, v.dir3D);
        } else {
          v.root.rotation.set(0, 0, -(v.beta - phi));
        }
      }
    }
    for (const d of this.debris) {
      proj(d.s.x, d.s.y, d.s.z, d.obj.position);
      d.obj.quaternion.setFromAxisAngle(this._zAxis || (this._zAxis = new THREE.Vector3(0, 0, 1)), phi - d.beta).multiply(d.q0);
    }
    // sun in the focus frame
    this.sunDir.set(SUN_ECI.x * E.x + SUN_ECI.y * E.y, SUN_ECI.x * U.x + SUN_ECI.y * U.y, SUN_ECI.z).normalize();
    this.skyMat.uniforms.uSun.value.copy(this.sunDir);
    this.earth.material.uniforms.uSun.value.copy(this.sunDir);
    if (this.moon.material.uniforms.uSun) this.moon.material.uniforms.uSun.value.copy(this.sunDir);
    // celestial bodies
    const _v = this._tv || (this._tv = new THREE.Vector3());
    const sp = bodyPos('sun', t);
    if (this.sunSphere) {
      proj(sp.x, sp.y, sp.z, this.sunSphere.position);
      this.sunSphere.rotation.set(0, 0, phi - bodyRotation('sun', t));
      if (this.sunSphere.userData.coreMat) this.sunSphere.userData.coreMat.uniforms.uTime.value = this.time;
      if (this.sunSphere.userData.asteroidBelt) this.sunSphere.userData.asteroidBelt.visible = (F.ref === 'sun');
    }
    proj(0, 0, 0, this.earth.position);
    this.earth.rotation.set(0, 0, phi - OMEGA_E * t);
    const mp = moonPos(t);
    proj(mp.x, mp.y, mp.z, this.moon.position);
    this.moon.rotation.set(0, 0, phi - moonAngle(t));
    this.moon.visible = F.ref === 'moon';
    for (const name of NON_EARTH_BODIES) {
      const pm = this.planets[name];
      if (!pm) continue;
      pm.visible = F.ref === name;
      if (!pm.visible) continue;
      const bp = bodyPos(name, t);
      proj(bp.x, bp.y, bp.z, pm.position);
      pm.rotation.set(0, 0, phi - bodyRotation(name, t));
      if (pm.material.uniforms.uSun) pm.material.uniforms.uSun.value.copy(this.sunDir);
      if (pm.material.uniforms.uTime) pm.material.uniforms.uTime.value = this.time;
    }
    this.stars.rotation.set(0, 0, phi);
    // ISS
    const ip = this.issOrbit.pos(t);
    proj(ip.x, ip.y, 0, this.iss.position);
    const issAng = phi - this.issOrbit.angle(t);
    this.iss.rotation.set(0, 0, issAng);
    this.iss.visible = (F.ref === 'earth' && F.alt > 40e3 && F.alt < 1200e3) || !!this.docked;
    if (this.docked && this.player && !this.player.dead) {
      const L = this.docked.L ?? this.dockPortOffset();
      const lx = this.issPortLocal.x - L, ly = this.issPortLocal.y;
      const c = Math.cos(issAng), s = Math.sin(issAng);
      this.player.root.position.set(
        this.iss.position.x + lx * c - ly * s,
        this.iss.position.y + lx * s + ly * c,
        this.iss.position.z
      );
      this.player.root.rotation.set(0, 0, issAng - Math.PI / 2);
    }
    // planetary / lunar surface patch + flag (disabled for gas giants so vessels can fly straight through)
    const onBody = F.ref !== 'earth' && F.ref !== 'sun' && !BODIES[F.ref]?.gasGiant && F.alt < 60e3;
    this.moonPatch.visible = onBody;
    if (onBody) {
      const psi = F.phiRot, snap = Math.round(psi / 0.012) * 0.012;
      const bodyR = (BODIES[F.ref] || BODIES.moon).R;
      const u = this.moonPatch.userData.uniforms;
      if (u.uBodyR) u.uBodyR.value = bodyR;
      if (u.uTint) {
        if (F.ref === 'mars') u.uTint.value.set(1.45, 0.58, 0.32);
        else if (F.ref === 'venus') u.uTint.value.set(1.32, 1.02, 0.52);
        else if (F.ref === 'mercury') u.uTint.value.set(1.05, 0.96, 0.86);
        else if (F.ref === 'phobos') u.uTint.value.set(0.84, 0.75, 0.68);
        else if (F.ref === 'deimos') u.uTint.value.set(0.95, 0.88, 0.78);
        else if (F.ref !== 'moon' && BODIES[F.ref]?.hex) {
          const tc = new THREE.Color(BODIES[F.ref].hex);
          u.uTint.value.set(tc.r * 1.15, tc.g * 1.15, tc.b * 1.15);
        } else u.uTint.value.set(1.0, 1.0, 1.0);
      }
      if (this.moonPatchPsi !== snap || this.moonPatchBody !== F.ref) {
        this.moonPatchPsi = snap;
        this.moonPatchBody = F.ref;
        u.uUp.value.set(Math.sin(snap), Math.cos(snap), 0);
        u.uEast.value.set(Math.cos(snap), -Math.sin(snap), 0);
        u.uNorth.value.set(0, 0, 1);
        if (F.alt < 4000) { this.moonPatch.userData.rebuildRocks(); this.rocksFresh = true; } else this.rocksFresh = false;
      } else if (F.alt < 4000 && !this.rocksFresh) { this.moonPatch.userData.rebuildRocks(); this.rocksFresh = true; }
      for (const c of this.moonPatch.children) c.visible = F.alt < 4000;
      const th = snap - psi;
      const bodyMesh = F.ref === 'moon' ? this.moon : (this.planets[F.ref] || this.moon);
      this.moonPatch.position.set(bodyMesh.position.x + bodyR * Math.sin(th), bodyMesh.position.y + bodyR * Math.cos(th), bodyMesh.position.z);
      this.moonPatch.rotation.set(0, 0, -th);
    }
    if (this.flagSpot) {
      const fBody = this.flagSpot.body || 'moon';
      const fR = (BODIES[fBody] || BODIES.moon).R;
      const bodyMesh = fBody === 'moon' ? this.moon : (this.planets[fBody] || this.moon);
      const th = this.flagSpot.psi - (F.ref === fBody ? F.phiRot : 0);
      const ok = F.ref === fBody && Math.abs(th) * fR < 120e3;
      this.flagObj.visible = ok;
      if (ok) {
        this.flagObj.position.set(bodyMesh.position.x + (fR + this.flagSpot.h) * Math.sin(th), bodyMesh.position.y + (fR + this.flagSpot.h) * Math.cos(th), bodyMesh.position.z);
        this.flagObj.rotation.set(0, 0, -th);
      }
    }
    // unrolled-surface world (ground, pad, sites, particles)
    this.world.position.set(-F.sx, -F.alt, -S.z);
    const near = F.ref === 'earth' && F.alt < 60000;
    for (const c of this.worldStatic) c.visible = near;
    this.ship.visible = near && this.shipX !== null;
    this.trees.visible = near && F.alt < 20000;
    this.clouds.visible = near;
    const gx = Math.round(F.sx / 500) * 500;
    this.ground.position.x = gx; this.clouds.position.x = gx;
    this.groundUniforms.uOff.value.set(gx, 0);
    // sun light follows the focus
    this.sun.position.copy(this.sunDir).multiplyScalar(400);
    this.sun.target.position.set(0, 0, 0);
    this.sun.target.updateMatrixWorld();
  }

  envForView(cam, F) {
    const earthRef = F.ref === 'earth';
    const camAlt = Math.max(0, F.alt + cam.position.y);
    this.viewCamAlt = camAlt;
    this.skyMat.uniforms.uAlt.value = earthRef ? Math.max(1, camAlt) : 1e7;
    this.skyMat.uniforms.uSteps.value = earthRef ? this.app.qualityCfg.skySteps : 4;
    this.sky.position.copy(cam.position);
    this.stars.position.copy(cam.position);
    this.stars.material.uniforms.uFade.value = earthRef ? THREE.MathUtils.smoothstep(camAlt, 30000, 90000) : 1;
    this.stars.material.uniforms.uPR.value = this.app.renderer.getPixelRatio();
    const eu = this.earth.material.uniforms;
    eu.uCamRel.value.copy(cam.position).sub(this.earth.position);
    eu.uOpacity.value = earthRef ? THREE.MathUtils.smoothstep(camAlt, 5000, 22000) : 1;
    eu.uTime.value = this.time;
    this.earth.visible = earthRef && camAlt > 4000;
    const gOp = earthRef ? 1 - THREE.MathUtils.smoothstep(camAlt, 12000, 32000) : 0;
    this.groundMat.opacity = gOp;
    this.ground.visible = gOp > 0.001 && F.alt < 60000 && earthRef;
    this.nearPlane = THREE.MathUtils.clamp(camAlt * 0.25, 1, 5e4);
  }

  spaceLighting() {
    this.sun.color.setRGB(1, 0.98, 0.94);
    this.sun.intensity = 7.5;
    this.hemi.color.setRGB(0.25, 0.3, 0.4); this.hemi.groundColor.setRGB(0.12, 0.1, 0.08);
    this.hemi.intensity = 0.12;
    this.scene.fog.density = 0;
    const sm = this.smoke.material.uniforms;
    sm.uSunColor.value.setRGB(1, 0.98, 0.94); sm.uAmbient.value.setRGB(0.05, 0.05, 0.06); sm.uFogDensity.value = 0;
    this.fire.material.uniforms.uFogDensity.value = 0;
    this.scene.environmentIntensity = 0.06;
  }

  /** dual-layer render: far pass (sky, stars, planets) then near pass (ground, vessels) */
  renderView(renderer, target, cam, F, rect) {
    this.placeScene(F);
    this.scene.updateMatrixWorld(true);
    this.envForView(cam, F);
    if (F.ref === 'earth') this.scene.environmentIntensity = 1;
    const prevAuto = renderer.autoClear, prevShadow = renderer.shadowMap.autoUpdate;
    const oldNear = cam.near, oldFar = cam.far;
    if (rect) {
      target.viewport.set(rect.x, rect.y, rect.w, rect.h);
      target.scissor.set(rect.x, rect.y, rect.w, rect.h);
      target.scissorTest = true;
    }
    renderer.setRenderTarget(target);
    renderer.autoClear = false;
    renderer.clear(true, true, true);
    // far pass
    cam.layers.disableAll(); cam.layers.enable(1);
    cam.near = this.nearPlane; cam.far = 2e9; cam.updateProjectionMatrix();
    renderer.shadowMap.autoUpdate = false;
    renderer.render(this.scene, cam);
    renderer.shadowMap.autoUpdate = prevShadow;
    renderer.clearDepth();
    // near pass
    cam.layers.disableAll(); cam.layers.enable(0);
    cam.near = Math.min(0.5, this.nearPlane); cam.far = 3e5; cam.updateProjectionMatrix();
    renderer.render(this.scene, cam);
    cam.layers.enable(1);
    cam.near = oldNear; cam.far = oldFar; cam.updateProjectionMatrix();
    renderer.autoClear = prevAuto;
    if (rect) { target.scissorTest = false; target.viewport.set(0, 0, target.width, target.height); target.scissor.set(0, 0, target.width, target.height); }
  }

  /** called by the compositor instead of a plain RenderPass */
  render(renderer, target) {
    this.renderView(renderer, target, this.camera, this.focus, null);
    // picture-in-picture: booster (or ship) view
    const pip = this.pipTarget;
    const el = $('pip');
    if (pip && !pip.dead && !el.classList.contains('hidden') && target) {
      const pr = renderer.getPixelRatio();
      const r = el.getBoundingClientRect();
      const rect = { x: Math.round(r.left * pr), y: Math.round((innerHeight - r.bottom) * pr), w: Math.round(r.width * pr), h: Math.round(r.height * pr) };
      const pc = this.pipCamera;
      pc.aspect = rect.w / Math.max(1, rect.h); pc.updateProjectionMatrix();
      const dist = clamp((pip.height || 40) * 1.6 + 20, 30, 140);
      const ang = this.time * 0.15;
      pc.position.set(Math.cos(ang) * dist * 0.55, dist * 0.12, Math.sin(ang) * dist * 0.55 + dist * 0.8);
      pc.lookAt(0, 0, 0);
      const keep = this.focus;
      this.renderView(renderer, target, pc, pip, rect);
      this.placeScene(keep);
    }
  }

  // =================================================================== EFFECTS
  airRatio(v) { return v.ref === 'earth' ? Math.exp(-Math.max(0, v.alt) / 5600) : 0; }

  updateEffects(dt, simDt) {
    const F = this.focus, P = this.player;
    const qual = this.app.qualityCfg.particles;
    const owner = {};
    for (const v of this.vessels) { if (v.dead) continue; for (const k of v.segIdx) owner[k] = v; }
    for (const v of this.vessels) if (!v.dead) v._plist = this.plumes.filter((pp) => pp.nz.seg === v.activeSeg && !pp.nz.booster);
    const ramp = this.phase === 'countdown' ? THREE.MathUtils.clamp((this.met + 3) / 2.5, 0, 1) : 1;
    const tmp = new THREE.Vector3(), haze = new THREE.Vector3();
    let hazeN = 0, focusThr = 0, trailN = 0;
    const trails = new Map();
    const fsx = F.sx, fal = F.alt, fz = F.s.z;
    const sameBody = (v) => v.ref === F.ref;
    for (const p of this.plumes) {
      const nz = p.nz, v = owner[nz.seg];
      let on = 0;
      if (v && !p.detached && !v.crashed && v.engineOn && nz.seg === v.activeSeg) {
        if (nz.booster) {
          const b = this.rocket.boosters.find((bb) => bb.objs.includes(nz.booster));
          on = b && b.attached && b.fuel > 0 ? 1 : 0;
        } else if (v.coreFiring) {
          const list = v._plist, hasC = list.some((x) => x.nz.center);
          let ok = true;
          if (hasC && v.engMode === 'center') ok = !!nz.center;
          else if (hasC && v.engMode === 'three') ok = list.indexOf(p) < 3;
          on = ok ? v.throttle : 0;
        }
      }
      if (v === P) on *= ramp;
      const pr = v ? this.airRatio(v) : 0;
      const expand = THREE.MathUtils.clamp(1 - pr * 1.6, 0, 1);
      const flick = on > 0 ? 0.92 + Math.random() * 0.08 : 0;
      p.update(this.time, on * flick, expand);
      p.heat += ((on > 0 ? 0.5 + on * 0.5 : 0) - p.heat) * (1 - Math.exp(-dt * (on > 0 ? 0.6 : 0.15)));
      for (const m of nz.bellMats) m.emissiveIntensity = Math.pow(p.heat, 2) * 2.5;
      if (on <= 0 || !v || nz.style === 'antigrav') continue;
      if (v === F) focusThr += on * (nz.booster ? 0.8 : 1) * nz.r;
      nz.node.getWorldPosition(tmp);
      if (v === F) { haze.add(tmp); hazeN++; }
      if (!sameBody(v)) continue;
      const wx = tmp.x + fsx, wy = tmp.y + fal, wz = tmp.z + fz;
      const axisA = v.beta - F.phi;
      const exX = v.dir3D ? -v.dir3D.x : -Math.sin(axisA);
      const exY = v.dir3D ? -v.dir3D.y : -Math.cos(axisA);
      const exZ = v.dir3D ? -v.dir3D.z : 0;
      const vE = v.vSurf.e, vU = v.vSurf.u;
      const earth = v.ref === 'earth';
      const groundH = earth ? (Math.abs(wx) < PAD_RADIUS ? 6 : 0) : 0;
      const hag = wy - groundH;
      const isSciFi = nz.style === 'antigrav' || nz.style === 'laser';
      if (!isSciFi) {
        const tr = trails.get(v) || { x: 0, y: 0, z: 0, n: 0, r2: 0 };
        tr.x += wx; tr.y += wy; tr.z += wz; tr.n++; tr.r2 += nz.r * nz.r * on; trails.set(v, tr);
      }
      if (earth && pr > 0.0005) {
        const nf = this.poisson((isSciFi ? 22 : 40) * on * nz.r * qual * simDt);
        const fCol = nz.style === 'antigrav' ? [0.6, 4.8, 7.2] : nz.style === 'laser' ? [7.5, 0.8, 2.2] : [5, 2.6, 1.0];
        for (let i = 0; i < nf; i++) {
          const sp = (isSciFi ? 95 : 60) + Math.random() * 80;
          this.fire.emit(wx, wy, wz, vE + exX * sp + (Math.random() - 0.5) * 10, vU + exY * sp + (Math.random() - 0.5) * 10, exZ * sp + (Math.random() - 0.5) * 10, { life: 0.15 + Math.random() * 0.25, size0: nz.r * (isSciFi ? 1.5 : 2.2), size1: nz.r * (isSciFi ? 3.2 : 5), alpha: 0.6, drag: 2, buoy: 0, color: fCol });
        }
      }
      const range = earth ? 120 : 90;
      if (!isSciFi && hag < range && (earth || hag > -5)) {
        const prox = clamp(1 - hag / range, 0, 1);
        const gY = earth ? (Math.abs(wx) < PAD_RADIUS ? 6.5 : 0.5) : Math.max(0, wy - hag);
        const nG = this.poisson((earth ? 150 : 110) * on * prox * qual * nz.r * simDt);
        const onPad = earth && Math.abs(wx) < PAD_RADIUS && hag < 30;
        for (let i = 0; i < nG; i++) {
          let vx, vz, x0 = wx, z0 = wz, y0 = gY;
          if (onPad && Math.random() < 0.65) {
            const side = Math.random() < 0.5 ? -1 : 1;
            x0 = side * (PAD_RADIUS + 8); y0 = 2; z0 = (Math.random() - 0.5) * 6;
            vx = side * (35 + Math.random() * 45); vz = (Math.random() - 0.5) * 30;
          } else {
            const a = Math.random() * Math.PI * 2, s = (earth ? 20 : 30) + Math.random() * 45;
            vx = Math.cos(a) * s; vz = Math.sin(a) * s;
          }
          if (earth) this.smoke.emit(x0, y0, z0, vx, 4 + Math.random() * 10, vz, { life: 9 + Math.random() * 9, size0: 7, size1: 32 + Math.random() * 30, alpha: 0.75, drag: 0.55, buoy: 1.4, heat: 1.0, spin: 0.3, color: [0.86, 0.85, 0.84] });
          else this.smoke.emit(x0, y0 + 0.5, z0, vx * 1.4, 2 + Math.random() * 14, vz * 1.4, { life: 14 + Math.random() * 10, size0: 2.5, size1: 10 + Math.random() * 10, alpha: 0.5 * prox + 0.1, drag: 0.04, buoy: -1.63, color: [0.5, 0.48, 0.45] });
        }
        if (earth) {
          const nGF = this.poisson(70 * on * prox * qual * nz.r * simDt);
          for (let i = 0; i < nGF; i++) {
            const a = Math.random() * Math.PI * 2, s = 30 + Math.random() * 50;
            this.fire.emit(wx, gY + 1, wz, Math.cos(a) * s, 2 + Math.random() * 6, Math.sin(a) * s, { life: 0.35 + Math.random() * 0.4, size0: 4, size1: 14, alpha: 0.7, drag: 2.5, buoy: 2, color: [5, 2.4, 0.9] });
          }
        }
      }
    }
    // continuous exhaust trail (earth atmosphere only)
    this.trailPrev = this.trailPrev || new Map();
    for (const [v, tr] of trails) {
      if (v.ref !== 'earth' || this.phase === 'countdown') continue;
      const pr = this.airRatio(v);
      if (pr < 0.002) continue;
      const cur = [tr.x / tr.n, tr.y / tr.n, tr.z / tr.n], rEff = Math.sqrt(tr.r2);
      const prev = this.trailPrev.get(v) || cur;
      this.trailPrev.set(v, cur);
      const dist = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
      const spacing = Math.max(rEff * 0.8, 0.6) / Math.max(0.35, qual);
      const growth = 1 + (1 - pr) * 5;
      const n = Math.min(14, Math.floor(dist / spacing + Math.random()));
      const ap = 0.5 * Math.min(1, pr * 1.6 + 0.12);
      const axisA = v.beta - F.phi;
      const exX = v.dir3D ? -v.dir3D.x : -Math.sin(axisA);
      const exY = v.dir3D ? -v.dir3D.y : -Math.cos(axisA);
      const exZ = v.dir3D ? -v.dir3D.z : 0;
      const s = 4 + 6 * pr;
      for (let i = 0; i < n; i++) {
        const f = (i + Math.random()) / Math.max(n, 1);
        this.smoke.emit(prev[0] + (cur[0] - prev[0]) * f + exX * rEff * 3, prev[1] + (cur[1] - prev[1]) * f + exY * rEff * 3, prev[2] + (cur[2] - prev[2]) * f + exZ * rEff * 3,
          exX * 25 + (Math.random() - 0.5) * s, exY * 25 + (Math.random() - 0.5) * s, exZ * 25 + (Math.random() - 0.5) * s,
          { life: 12 + Math.random() * 10, size0: rEff * 3.2, size1: rEff * (16 + Math.random() * 12) * growth, alpha: ap, drag: 1.2 * pr + 0.03, buoy: 0.5 * pr, heat: 1.0, spin: 0.25, color: [0.93, 0.92, 0.9] });
      }
    }
    for (const v of [...this.trailPrev.keys()]) if (!trails.has(v)) this.trailPrev.delete(v);
    // re-entry plasma
    for (const v of this.vessels) {
      if (v.dead || v.crashed || v.ref !== F.ref || v.ref !== 'earth' || v.heatFlux < 0.5 || v.alt > 95e3) continue;
      const hf = Math.min(3, v.heatFlux);
      const n = this.poisson(hf * 60 * qual * simDt);
      for (let i = 0; i < n; i++) {
        const sp = (Math.random() - 0.5) * 20;
        this.fire.emit(v.sx + (Math.random() - 0.5) * 3, v.alt + (Math.random() - 0.5) * 3, v.s.z + (Math.random() - 0.5) * 3, v.vSurf.e * 0.05 + sp, v.vSurf.u * 0.05 + sp, sp, { life: 0.8 + Math.random() * 1.2, size0: 5, size1: 16 + hf * 6, alpha: 0.8, drag: 1.2, buoy: 0, color: [5, 2.2 + Math.random(), 0.9] });
      }
      if (v === F) this.heatGlow = hf;
    }
    if (!(F.heatFlux > 0.5)) this.heatGlow = 0;
    // countdown venting
    if ((this.phase === 'countdown' && !this.ignited) || this.phase === 'ready') {
      if (Math.random() < 0.35 * qual) {
        const y = P.alt + (P.com.maxY - P.com.y) * 0.6;
        this.smoke.emit(P.sx + CORE_R, y, (Math.random() - 0.5), 2 + Math.random() * 2, -1.5, (Math.random() - 0.5) * 2, { life: 3, size0: 0.6, size1: 4, alpha: 0.35, drag: 1, buoy: -0.6, color: [1, 1, 1] });
      }
    }
    // engine light & audio & haze
    const fInfo = F.info;
    if (fInfo && fInfo.antiGrav) this.engineLight.color.setHex(0x38bdf8);
    else if (fInfo && fInfo.laser) this.engineLight.color.setHex(0xff2a55);
    else this.engineLight.color.setHex(0xff8a3a);
    const lowest = new THREE.Vector3(0, F.com.minY - F.com.y - 3, 0).applyQuaternion(F.root.quaternion);
    this.engineLight.position.copy(lowest);
    this.engineLight.intensity = focusThr * 2.2e4 * (0.9 + Math.random() * 0.2);
    this.thrNorm = Math.min(1, focusThr / 2);
    const pr = this.airRatio(F);
    const near = THREE.MathUtils.clamp(1.4 - this.camera.position.length() / 1500, 0.25, 1);
    audio.engine(Math.min(1, focusThr / 1.6), pr, near);
    audio.wind(F.qNow || 0);
    const fx = this.app.finalPass.uniforms;
    if (hazeN > 0 && this.camMode !== 2) {
      haze.multiplyScalar(1 / hazeN);
      const exh = F.dir3D ? F.dir3D.clone().negate() : new THREE.Vector3(-Math.sin(F.beta - F.phi), -Math.cos(F.beta - F.phi), 0);
      const p1 = haze.clone().project(this.camera), p2 = haze.clone().addScaledVector(exh, 10).project(this.camera);
      if (p1.z < 1 && p1.z > -1) {
        fx.uHazePos.value.set(p1.x * 0.5 + 0.5, p1.y * 0.5 + 0.5);
        fx.uHazeDir.value.set(p2.x - p1.x, p2.y - p1.y).normalize();
        const dist = haze.distanceTo(this.camera.position);
        fx.uHazeRadius.value = THREE.MathUtils.clamp((CORE_R * 2.2 / dist) / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * 0.5, 0.005, 0.3);
        fx.uHaze.value = Math.min(1, focusThr) * (0.3 + 0.7 * pr);
      } else fx.uHaze.value = 0;
    } else fx.uHaze.value = 0;
    fx.uFlash.value = this.flash * 0.6 + (this.heatGlow || 0) * 0.08;
  }

  poisson(lambda) {
    const n = Math.floor(lambda);
    return n + (Math.random() < lambda - n ? 1 : 0);
  }

  // =================================================================== CAMERA
  updateCamera(dt) {
    const cam = this.camera, F = this.focus;
    cam.position.sub(this.shake);
    const h = F.height || this.rocketHeight;
    let mode = this.camMode;
    if (mode === 1 && !(F.ref === 'earth' && Math.abs(F.sx) < 5000 && F.alt < 40000)) mode = 0;
    if (mode === 0) {
      if ((F.isPlane || F.isRover || F.isBoat) && F.turnYawRate) {
        const followFactor = (F.isRover || F.isBoat) ? 0.75 : 1.0;
        cam.position.applyAxisAngle(this._yAxis || (this._yAxis = new THREE.Vector3(0, 1, 0)), F.turnYawRate * followFactor * dt);
      }
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    } else if (mode === 1) {
      const dx = -260 - F.sx, dz = 380 - F.s.z;
      cam.position.set(dx, 14 - F.alt - (dx * dx + dz * dz) * BEND, dz);
      cam.lookAt(0, 0, 0);
      const dist = cam.position.length();
      cam.fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan((h * 2.2 + 30) / dist)), 0.3, 50);
      cam.updateProjectionMatrix();
    } else if (mode === 2) {
      const root = F.root;
      const top = F.com.maxY - F.com.y;
      const p = root.localToWorld(new THREE.Vector3(CORE_R + 0.5, top - 3, 0.9));
      const look = root.localToWorld(new THREE.Vector3(CORE_R + 0.2, F.com.minY - F.com.y - 40, 0.2));
      cam.position.copy(p);
      const a = F.beta - F.phi;
      cam.up.set(Math.sin(a), Math.cos(a), 0);
      cam.lookAt(look);
      cam.up.set(0, 1, 0);
      if (cam.fov !== 70) { cam.fov = 70; cam.updateProjectionMatrix(); }
    } else {
      this.cineAngle = (this.cineAngle || 0) + dt * 0.12;
      const r = h * 2.2 + 40;
      cam.position.set(Math.cos(this.cineAngle) * r, Math.sin(this.time * 0.2) * h * 0.4 - h * 0.2, Math.sin(this.cineAngle) * r);
      cam.lookAt(0, 0, 0);
      if (cam.fov !== 45) { cam.fov = 45; cam.updateProjectionMatrix(); }
    }
    if (mode !== 1 && this.camMode === 1 && cam.fov !== 50) { cam.fov = 50; cam.updateProjectionMatrix(); }
    const pr = this.airRatio(F);
    const groundProx = THREE.MathUtils.clamp(1 - (F.agl ?? F.alt) / 600, 0, 1);
    this.shakeBoost = Math.max(0, (this.shakeBoost || 0) - dt * 1.2);
    let amp = (this.thrNorm || 0) * (0.05 + 0.4 * groundProx * pr) + Math.min(0.3, (F.qNow || 0) / 120000) + this.shakeBoost;
    if (mode === 1) amp *= 0.2 * (cam.fov / 50);
    const s = this.shake.set((Math.random() - 0.5) * amp, (Math.random() - 0.5) * amp, (Math.random() - 0.5) * amp);
    if (mode === 2) s.multiplyScalar(0.2);
    cam.position.add(s);
  }

  // =================================================================== HUD
  updateMap() {
    const P = this.player, t = this.simT;
    const el = vesselElements(P);
    this.mapT = (this.mapT || 0) - 1;
    if (this.mapT <= 0) {
      this.mapT = 12;
      if (P.landed || P.crashed || P.clamped) this.mapPred = null;
      else {
        const isClosed = el.e < 1 && isFinite(el.period);
        const maxTime = isClosed
          ? el.period * 1.05
          : Math.max(5e7, (Math.hypot(P.s.x, P.s.y) / Math.max(100, P.speedOrb || 1000)) * 50);
        const baseStep = Math.max(0.5, coastStep(P.s.x, P.s.y, P.s.z, t));
        const stepScale = isClosed
          ? Math.max(1.8, (el.period / 2600) / baseStep)
          : 3.5;
        const useIssTarget = this.mission.id === 'iss' && P.ref === 'earth' && el.ap < R_E + 2000e3;
        this.mapPred = predict(P.s.x, P.s.y, P.s.z, P.s.vx, P.s.vy, P.s.vz, t, {
          maxTime,
          maxSteps: 3600,
          stepScale,
          target: useIssTarget ? this.issOrbit : null,
          targetStep: 20,
        });
      }
    }
    const pred = this.mapPred;
    const bp = { x: 0, y: 0, z: 0 };
    bodyState(P.ref, t, bp, { x: 0, y: 0, z: 0 });
    const markers = [];
    const R = P.body.R;
    if (el.e < 1) {
      const sa = Math.sin(el.argPe), ca = Math.cos(el.argPe);
      markers.push({ x: bp.x - sa * el.ap, y: bp.y - ca * el.ap, z: bp.z, type: 'ap', text: 'Ap ' + fmt((el.ap - R) / 1000, 0) + ' km', color: '#ffb347' });
      markers.push({ x: bp.x + sa * el.pe, y: bp.y + ca * el.pe, z: bp.z, type: 'pe', text: 'Pe ' + fmt((el.pe - R) / 1000, 0) + ' km', color: '#7dffc8' });
    }
    const ip = this.issOrbit.pos(t);
    const liveOthers = this.vessels
      .filter((v) => v !== P && !v.dead && !v.crashed && !v.archived)
      .map((v) => ({
        id: v.mapId || ('live_' + v.id),
        x: v.s.x,
        y: v.s.y,
        z: v.s.z || 0,
        alt: v.alt,
        speedOrb: v.speedOrb,
        beta: v.beta,
        ref: v.ref || 'earth',
        kind: v.kind === 'booster' ? 'booster' : 'stage',
        name: v.label || (v.kind === 'booster' ? 'Tầng 1' : 'Tầng tách'),
        color: '#ff7a3a',
        el: vesselElements(v),
        deletable: true,
      }));
    const persistedOthers = (this.spaceObjects || []).map((obj) => {
      const st = this.evalSpaceObject(obj, t);
      return {
        id: obj.id,
        x: st.x,
        y: st.y,
        z: st.z || 0,
        alt: st.alt,
        speedOrb: st.speedOrb,
        beta: st.beta,
        ref: obj.ref || 'earth',
        kind: obj.kind || 'vessel',
        name: obj.name || 'Tên lửa vũ trụ',
        color: obj.kind === 'vessel' ? '#a78bfa' : '#ff7a3a',
        el: st.el,
        deletable: true,
      };
    });
    const others = [...liveOthers, ...persistedOthers];
    const refLabel = (BODIES[P.ref] || BODIES.earth).label;
    const info = [`Quanh ${refLabel} · độ cao ${fmt(P.alt / 1000, 1)} km`, `Vận tốc quỹ đạo ${fmt(P.speedOrb)} m/s`];
    if (pred && pred.bodyCA && P.ref === 'earth') {
      for (const name of Object.keys(pred.bodyCA)) {
        if (name === 'sun') continue;
        const ca = pred.bodyCA[name];
        const B = BODIES[name];
        if (B && ca && ca.d < B.soi * 2.5) info.push(`Tiếp cận ${B.label}: ${fmt((ca.d - B.R) / 1000, 0)} km (sau ${fmt((ca.t - t) / 3600, 1)} giờ)`);
      }
    }
    if (pred && pred.targetCA && pred.targetCA.d < 1e7 && this.mission.id === 'iss') info.push(`Tiếp cận ISS: ${fmt(pred.targetCA.d / 1000, 1)} km (sau ${fmt((pred.targetCA.t - t) / 60, 1)} phút)`);
    this.map.draw({ t, vessel: { x: P.s.x, y: P.s.y, z: P.s.z || 0, vx: P.s.vx, vy: P.s.vy, vz: P.s.vz, alt: P.alt, speedOrb: P.speedOrb, phi: P.phi, beta: P.beta, deletable: !P.clamped }, beta: P.beta, name: 'Tàu hiện tại', ref: P.ref, apR: el.e < 1 ? el.ap : 4e7, soiT: pred ? pred.soiT : null, sun: { x: SUN_ECI.x, y: SUN_ECI.y, z: SUN_ECI.z }, padAngle: OMEGA_E * t, iss: { r: ISS_R, x: ip.x, y: ip.y, z: ip.z || 0 }, pred, markers, others, info, el });
  }

  fmtTime(sec) {
    if (!isFinite(sec)) return '—';
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    if (m >= 60) return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  }

  updateHUD(dt) {
    if (this.map.visible) this.updateMap();
    if (this.pipKeep > 0) this.pipKeep -= dt;
    const P = this.player;
    const b = this.vessels.find((v) => v.kind === 'booster' && !v.dead);
    let showPip = false;
    this.pipTarget = null;
    if (b && this.phase !== 'ready') {
      const active = b.rec && b.rec.phase !== 'done' && b.rec.phase !== 'lost' && !b.crashed;
      showPip = active || this.pipKeep > 0;
      this.pipTarget = this.focus === b ? P : b;
    }
    $('pip').classList.toggle('hidden', !showPip);
    this.hudTimer = (this.hudTimer || 0) - dt;
    if (this.hudTimer > 0) return;
    this.hudTimer = 0.066;
    if (showPip && b) {
      $('pip-label').textContent = this.focus === b ? 'TÀU CHÍNH' : 'TẦNG 1';
      const tgt = this.pipTarget;
      $('pip-status').textContent = `${b.rec ? b.rec.status() : ''} · ${tgt === b ? fmt(b.alt / 1000, 1) + ' km' : fmt(b.alt) + ' m'} · ${fmt(b.speedSurf)} m/s`;
    }
    const low = (P.ref === 'earth' && P.alt < ATM_TOP) || (P.ref !== 'earth' && P.alt < Math.max(30000, P.body.atm || 0));
    let altV = P.ref === 'earth' ? Math.max(0, P.alt - this.startAlt) : Math.max(0, P.alt);
    if (P.ref !== 'earth' && P.agl !== undefined && P.agl < 20000) altV = Math.max(0, P.agl);
    const altEl = $('h-alt');
    if (altV >= 10000) { altEl.textContent = fmt(altV / 1000, 2); $('h-alt-u').textContent = 'km'; }
    else { altEl.textContent = fmt(altV, 0); $('h-alt-u').textContent = 'm'; }
    $('h-vel-l').textContent = low ? tr('VẬN TỐC (so với mặt đất)', 'VELOCITY (surface)') : tr('VẬN TỐC (quỹ đạo)', 'VELOCITY (orbital)');
    $('h-vel').textContent = fmt(low ? P.speedSurf : P.speedOrb);
    const vu = low ? P.vSurf.u : P.vOrb.u, ve = low ? Math.hypot(P.vSurf.e, P.vSurf.z || 0) : P.vOrb.e;
    $('h-vs').textContent = fmt(vu, 1) + ' m/s';
    $('h-hs').textContent = fmt(ve, 1) + ' m/s';
    $('h-mach').textContent = fmt(P.machNow || 0, 2);
    $('h-g').textContent = fmt(this.released ? P.accelNow || 0 : 1, 2) + ' G';
    $('h-q').textContent = fmt((P.qNow || 0) / 1000, 1) + ' kPa';
    $('h-pitch').textContent = fmt(THREE.MathUtils.radToDeg(P.ang), 1) + '°';
    const m = this.met;
    $('h-met').textContent = `T${m < 0 ? '-' : '+'}${String(Math.floor(Math.abs(m) / 3600)).padStart(2, '0')}:${String(Math.floor(Math.abs(m) / 60) % 60).padStart(2, '0')}:${String(Math.floor(Math.abs(m)) % 60).padStart(2, '0')}`;
    // orbit
    const el = vesselElements(P), R = P.body.R;
    $('h-body').textContent = (BODIES[P.ref] || BODIES.earth).label;
    $('h-ap-alt').textContent = el.e < 1 ? fmt((el.ap - R) / 1000, 1) + ' km' : '∞';
    $('h-pe-alt').textContent = (el.pe - R < 0 ? '−' : '') + fmt(Math.abs(el.pe - R) / 1000, 1) + ' km';
    $('h-period').textContent = el.e < 1 ? this.fmtTime(el.period) : '—';
    // target
    const showT = (this.mission.id === 'iss' && !!this.flags.orbit) || !!this.docked;
    $('h-target-box').classList.toggle('hidden', !showT);
    if (showT) {
      const ip = this.issOrbit.pos(this.simT), iv = this.issOrbit.vel(this.simT);
      const d = this.docked ? 0 : Math.hypot(ip.x - P.s.x, ip.y - P.s.y, P.s.z);
      const rv = this.docked ? 0 : Math.hypot(P.s.vx - iv.x, P.s.vy - iv.y, P.s.vz);
      $('h-target-name').textContent = this.docked ? '🛰 ĐÃ GẮN VÀO ISS' : 'Mục tiêu · ISS';
      $('h-tdist').textContent = this.docked ? '0.0 m (Đã khóa)' : (d >= 10000 ? fmt(d / 1000, 1) + ' km' : fmt(d, d < 100 ? 1 : 0) + ' m');
      $('h-trel').textContent = fmt(rv, rv < 10 ? 2 : 0) + ' m/s';
    }
    // docking HUD
    const dockShow = (this.mission.id === 'iss' && !!this.flags.orbit && (this.docked || (this.dockDist !== undefined && this.dockDist < 600))) || !!this.docked;
    $('dock-hud').classList.toggle('hidden', !dockShow);
    if (dockShow) {
      const g = this.dockGeometry();
      const ex = g.portV.x - g.portS.x, ey = g.portV.y - g.portS.y, ez = g.portV.z - g.portS.z;
      const a = this.issOrbit.angle(this.simT), ux = Math.sin(a), uy = Math.cos(a);
      const latY = ex * ux + ey * uy, along = ex * g.axisS.x + ey * g.axisS.y;
      const rv = Math.hypot(P.s.vx - g.velS.x, P.s.vy - g.velS.y, P.s.vz - g.velS.z);
      const att = THREE.MathUtils.radToDeg(wrapPi(P.beta - g.beta));
      const sc = clamp(90 / Math.max(2, Math.abs(along), Math.abs(latY) * 3, Math.abs(ez) * 3), 0.5, 40);
      $('dk-dot').style.transform = `translate(${clamp(ez * sc, -90, 90)}px, ${clamp(-latY * sc, -90, 90)}px)`;
      $('dk-info').innerHTML = this.docked ? '🛰 ĐÃ GHÉP NỐI · ĐANG BAY CÙNG ISS' : `Khoảng cách <b>${fmt(Math.max(0, along), 1)} m</b> · lệch <b>${fmt(Math.hypot(latY, ez), 2)} m</b> · tốc độ <b>${fmt(rv, 2)} m/s</b> · góc <b>${fmt(att, 1)}°</b>`;
    }
    // systems
    const sasModes = tr(SAS_MODES_VI, SAS_MODES_EN);
    const camModes = tr(CAM_MODES_VI, CAM_MODES_EN);
    $('h-sas').textContent = this.sas ? tr('BẬT', 'ON') : tr('TẮT', 'OFF');
    $('h-sas').style.color = this.sas ? 'var(--ok)' : 'var(--danger)';
    $('h-sasmode').textContent = sasModes[this.sasMode];
    $('h-ap').textContent = this.program ? tr('BẬT', 'ON') : tr('TẮT', 'OFF');
    $('h-ap').style.color = this.program ? 'var(--ok)' : 'var(--muted)';
    const btnAp = $('btn-autopilot');
    if (btnAp) {
      btnAp.textContent = this.program
        ? tr('🤖 ĐANG TỰ LÁI NHIỆM VỤ (G)', '🤖 AUTOPILOT ACTIVE (G)')
        : tr('🤖 TỰ LÁI NHIỆM VỤ (G)', '🤖 MISSION AUTOPILOT (G)');
      btnAp.style.background = this.program ? 'rgba(74,222,128,0.32)' : 'rgba(74,222,128,0.16)';
      btnAp.style.borderColor = this.program ? 'rgba(74,222,128,0.85)' : 'rgba(74,222,128,0.45)';
    }
    $('h-warp').textContent = this.warp + '×';
    $('h-cam').textContent = camModes[this.camMode];
    const thr = this.docked ? 0 : (this.program ? (P.engineOn ? P.throttle : 0) : this.throttle);
    $('h-thr').style.width = thr * 100 + '%';
    $('h-thr-v').textContent = Math.round(thr * 100) + '%';
    const prog = $('h-prog');
    const lines = [];
    if (this.docked) lines.push(`<b>🛰 ${tr('Đã gắn kết với ISS', 'Docked with ISS')}</b><br>${tr('Đang bay cùng quỹ đạo Trạm Vũ Trụ Quốc Tế', 'Orbiting together with the Space Station')}`);
    else if (this.program && this.program.status) lines.push(`<b>${this.program.label || tr('Lái tự động', 'Autopilot')}</b><br>${this.program.status() || ''}${this.program.wait && (this.program.phase === 'phasing' || this.program.phase === 'tliWait') ? ' · ' + this.fmtTime(this.program.wait) : ''}`);
    if (b && b.rec) lines.push(`<b>${tr('Tầng 1', 'Stage 1')}</b><br>${b.rec.status()}`);
    prog.innerHTML = lines.join('<hr>');
    prog.classList.toggle('hidden', !lines.length);
    // stages
    let html = '';
    const attached = (k) => P.owns(k);
    for (let k = this.segs.length - 1; k >= 0; k--) {
      const att = attached(k);
      const active = k === P.activeSeg && att;
      const f = this.fuelMax[k] > 0 ? this.fuel[k] / this.fuelMax[k] : 0;
      html += `<div class="fuel-row ${active ? 'active' : ''} ${att ? '' : 'gone'}"><div class="fr-top"><span>${tr('Tầng', 'Stage')} ${this.segs.length - k}${active ? ' ▶' : ''}</span><span>${this.fuelMax[k] > 0 ? fmt(this.fuel[k], 1) + ' t' : '—'}</span></div><div class="fr-bar"><div style="width:${f * 100}%"></div></div>`;
      for (const bb of this.rocket.boosters) if (bb.seg === k) {
        html += `<div class="fr-top" style="margin-top:4px;font-size:11px;opacity:${bb.attached ? 1 : 0.35}"><span>↳ ${tr('Đẩy phụ', 'Boosters')}</span><span>${fmt(bb.fuel, 1)} t</span></div><div class="fr-bar boost"><div style="width:${(bb.fuel / bb.fuelMax) * 100}%"></div></div>`;
      }
      html += '</div>';
    }
    $('h-stages').innerHTML = html;
  }
}
