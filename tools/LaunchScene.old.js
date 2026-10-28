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

const $ = (id) => document.getElementById(id);
const PAD_TOP = 9.0;       // rocket base height on the launch mount
const PAD_RADIUS = 45;
const fmt = (v, d = 0) => v.toLocaleString('vi-VN', { maximumFractionDigits: d, minimumFractionDigits: d });

export class LaunchScene {
  constructor(app) {
    this.app = app;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.5, 6e7);
    this.controls = new OrbitControls(this.camera, app.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 4000;
    this.controls.enabled = false;
    this.controls.enablePan = false;
    this.sunDir = new THREE.Vector3(0.62, 0.24, 0.75).normalize();
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

    this.initSky();
    this.initGround();
    this.initPad();
    this.initFX();
    this.initUI();
  }

  // =================================================================== SKY & LIGHT
  initSky() {
    this.skyMat = createSkyMaterial(this.sunDir);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 64, 32), this.skyMat);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -1;
    this.scene.add(this.sky);

    this.envScene = new THREE.Scene();
    this.envSky = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), this.skyMat);
    this.envScene.add(this.envSky);
    this.pmrem = new THREE.PMREMGenerator(this.app.renderer);

    this.stars = createStars();
    this.scene.add(this.stars);

    this.earth = createEarth(this.sunDir);
    this.scene.add(this.earth);

    this.sun = new THREE.DirectionalLight(0xffffff, 6);
    this.sun.castShadow = true;
    const sc = this.sun.shadow.camera;
    sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 600;
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
    if (band !== this.envBand) {
      this.envBand = band;
      this.skyMat.uniforms.uAlt.value = Math.max(bands[band], 1);
      const rt = this.pmrem.fromScene(this.envScene, 0, 0.1, 200);
      if (this.envRT) this.envRT.dispose();
      this.envRT = rt;
      this.scene.environment = rt.texture;
    }
  }

  // =================================================================== GROUND
  initGround() {
    this.groundUniforms = { uTime: { value: 0 } };
    const gmat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0, transparent: true });
    gmat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = this.groundUniforms.uTime;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vLocal;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position.xy;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\nvarying vec2 vLocal;\nuniform float uTime;\n${NOISE_GLSL}\n
          float segDist(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }`)
        .replace('vec4 diffuseColor = vec4( diffuse, opacity );', /* glsl */`
          vec2 p = vLocal;
          float coast = 2600.0 + (fbm3(vec3(p * 0.00022, 1.3), 5) - 0.5) * 3200.0;
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
    const ground = new THREE.Mesh(new THREE.CircleGeometry(42000, 256), gmat);
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
      uniforms: { uTime: { value: 0 }, uSunCol: { value: new THREE.Color(1, 0.9, 0.8) }, uFogColor: { value: new THREE.Color() }, uSun: { value: this.sunDir } },
      vertexShader: /* glsl */`
        varying vec2 vP; varying vec3 vW;
        void main() { vP = position.xy; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        ${NOISE_GLSL}
        uniform float uTime; uniform vec3 uSunCol; uniform vec3 uFogColor; uniform vec3 uSun;
        varying vec2 vP; varying vec3 vW;
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
          float a = dens * 0.92 * (1.0 - smoothstep(25000.0, 38000.0, length(vP)));
          gl_FragColor = vec4(col, a);
        }`,
    });
    const clouds = new THREE.Mesh(new THREE.PlaneGeometry(80000, 80000, 1, 1), this.cloudMat);
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
    const hole = new THREE.Path(); hole.absarc(0, 0, 2.6, 0, Math.PI * 2, true); ringShape.holes.push(hole);
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
    const reach = -this.towerX - 3 - CORE_R;
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
  }

  // =================================================================== FX
  initFX() {
    this.smoke = new ParticleSystem({ max: 14000, texture: TX.smokeSprite(), sort: true });
    this.fire = new ParticleSystem({ max: 3000, texture: TX.fireSprite(), additive: true });
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
      if (k === 't') { this.sas = !this.sas; this.sasTarget = this.ang; }
      if (k === 'g') { this.autopilot = !this.autopilot; this.sasTarget = this.ang; this.event(this.autopilot ? 'Bật lái tự động (quay trọng lực).' : 'Tắt lái tự động.'); }
      if (k === 'c') this.cycleCam();
      if (k === 'z') this.throttle = 1;
      if (k === 'x') this.throttle = 0;
      if (k === '.') this.setWarp(1);
      if (k === ',') this.setWarp(-1);
      if (e.key === 'Escape') this.app.toggleMenu();
      if (e.key === 'Shift' || e.key === 'Control') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
    $('btn-go').onclick = () => { audio.init(); this.startCountdown(); };
    $('btn-back').onclick = () => this.app.goBuild();
  }

  setWarp(d) {
    const W = [1, 2, 4, 10, 50];
    let i = W.indexOf(this.warp) + d;
    i = Math.max(0, Math.min(W.length - 1, i));
    this.warp = W[i];
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

  // =================================================================== SETUP
  setup(stack) {
    this.stack = stack;
    // cleanup previous
    if (this.rocket) { this.scene.remove(this.rocket.root); }
    for (const d of this.debris) d.obj.parent && d.obj.parent.remove(d.obj);
    this.debris = [];
    this.smoke.clear(); this.fire.clear();
    $('events').innerHTML = '';
    $('result').classList.add('hidden');

    this.rocket = buildRocket(stack);
    this.scene.add(this.rocket.root);
    this.segs = segments(stack);
    this.segInfo = this.segs.map((idx) => segmentInfo(stack, idx));
    this.lay = layout(stack);
    this.attachedSegs = this.segs.map((_, k) => k);
    this.activeSeg = this.segs.length - 1;
    this.fuel = this.segInfo.map((s) => s.fuel);
    this.fuelMax = this.segInfo.map((s) => s.fuel);
    for (const b of this.rocket.boosters) { b.fuelMax = b.fuel; }
    // plumes
    this.plumes = this.rocket.nozzles.map((nz) => {
      const p = createPlume(nz.r, nz.booster ? 1.3 : 1.0);
      nz.node.add(p.group);
      return { ...p, nz, heat: 0, prev: null };
    });
    this.rocketHeight = this.lay.height;
    this.updateCOM();
    this.buildArms(this.rocketHeight);

    // state
    this.pos = new THREE.Vector2(0, PAD_TOP + (this.com.y - this.com.minY));
    this.startY = this.pos.y;
    this.lifted = false;
    this.vel = new THREE.Vector2();
    this.ang = 0; this.angVel = 0;
    this.throttle = 1; this.sas = true; this.warp = 1; this.sasTarget = 0; this.autopilot = false;
    this.phase = 'ready';
    this.met = -10;
    this.ignited = false; this.released = false;
    this.maxAlt = 0; this.maxVel = 0; this.maxG = 1; this.maxQ = 0; this.maxQPassed = false;
    this.flags = {};
    this.gNow = 1; this.qNow = 0;
    this.resultShown = false;
    this.camMode = 0; this.controls.enabled = true;
    this.camera.fov = 50; this.camera.updateProjectionMatrix();
    const h = this.rocketHeight;
    this.camera.position.set(h * 1.1 + 14, -h * 0.25 + 4, h * 1.9 + 26);
    this.controls.target.set(0, 0, 0);
    this.envBand = -1;
    this.flash = 0;
    this.rocket.root.visible = true;
    this.clamps.forEach((c) => { c.rotation.set(0, 0, 0); });
    $('btn-go').classList.remove('hidden');
    $('countdown').textContent = '';
    this.event('Tên lửa đã lên bệ phóng. Sẵn sàng!');
  }

  updateCOM() {
    // mass & centre of mass of attached segments (y measured from stack bottom)
    let m = 0, my = 0, minY = Infinity, maxY = -Infinity;
    for (const k of this.attachedSegs) {
      const frac = this.fuelMax[k] > 0 ? this.fuel[k] / this.fuelMax[k] : 0;
      for (const i of this.segs[k]) {
        const p = this.lay.parts[i];
        const pm = p.def.dry + (p.def.fuel || 0) * frac;
        m += pm; my += pm * (p.y + p.def.height / 2);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y + p.def.height);
        for (const a of p.item.attach) if (a === 'fins') { const am = PARTS.fins.dry * 4; m += am; my += am * (p.y + 1.2); }
      }
    }
    for (const b of this.rocket.boosters) {
      if (!b.attached) continue;
      const bm = b.dry + b.fuel;
      const y = b.objs[0].position.y + 5.5;
      m += bm; my += bm * y;
      minY = Math.min(minY, b.objs[0].position.y);
    }
    const prev = this.com ? this.com.y : null;
    this.com = { mass: m, y: my / Math.max(m, 1e-6), minY, maxY };
    for (const g of this.rocket.segGroups) g.position.y = -this.com.y;
    return prev;
  }

  hasFins() {
    return this.attachedSegs.some((k) => this.segInfo[k].fins);
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

  stage() {
    if (!(this.phase === 'flight' || this.phase === 'countdown' && this.ignited)) return;
    if (this.attachedSegs.length <= 1) return;
    const k = this.attachedSegs.pop();
    const g = this.rocket.segGroups[k];
    this.spawnDebris(g, new THREE.Vector3(0, -1, 0), 3.5);
    for (const b of this.rocket.boosters) if (b.seg === k) b.attached = false;
    const oldCom = this.com.y;
    this.updateCOM();
    // keep remaining rocket fixed in space: COM moved up
    const up = new THREE.Vector2(Math.sin(this.ang), Math.cos(this.ang));
    this.pos.addScaledVector(up, this.com.y - oldCom);
    this.activeSeg = this.attachedSegs[this.attachedSegs.length - 1];
    // separation puff
    this.burstAt(new THREE.Vector3(0, this.com.minY - this.com.y, 0), 40, 2.5);
    audio.thunk(0.9);
    this.event(`Tách tầng ${this.segs.length - k}! Kích hoạt tầng ${this.segs.length - this.activeSeg}.`, 'warn');
  }

  jettisonBooster(b) {
    b.attached = false;
    for (const o of b.objs) this.spawnDebris(o, null, 6);
    const oldCom = this.com.y;
    this.updateCOM();
    const up = new THREE.Vector2(Math.sin(this.ang), Math.cos(this.ang));
    this.pos.addScaledVector(up, this.com.y - oldCom);
    audio.thunk(0.6);
    this.event('Tên lửa đẩy phụ cháy hết – tách ra!', 'warn');
  }

  /** Convert a rocket-attached object into free-flying debris */
  spawnDebris(obj, localPushDir, pushSpeed) {
    const wpos = new THREE.Vector3();
    obj.getWorldPosition(wpos);
    const rootPos = new THREE.Vector3();
    this.rocket.root.getWorldPosition(rootPos);
    this.world.attach(obj);
    const v = new THREE.Vector3(this.vel.x, this.vel.y, 0);
    let push;
    if (localPushDir) push = localPushDir.clone().applyQuaternion(this.rocket.root.quaternion);
    else { push = wpos.clone().sub(rootPos); const up = new THREE.Vector3(Math.sin(this.ang), Math.cos(this.ang), 0); push.addScaledVector(up, -push.dot(up)).normalize(); }
    v.addScaledVector(push, pushSpeed);
    const av = new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3 + (localPushDir ? 0 : -Math.sign(push.x) * 0.25));
    this.debris.push({ obj, vel: v, angVel: av, life: 0 });
    // turn off its plumes
    for (const p of this.plumes) {
      let o = p.nz.node, isChild = false;
      while (o) { if (o === obj) { isChild = true; break; } o = o.parent; }
      if (isChild) p.detached = true;
    }
  }

  burstAt(localPos, n, size) {
    const wp = localPos.clone().applyQuaternion(this.rocket.root.quaternion);
    const base = new THREE.Vector3(this.pos.x + wp.x, this.pos.y + wp.y, wp.z);
    const k = this.airDensity();
    for (let i = 0; i < n; i++) {
      const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(8 + Math.random() * 10);
      this.smoke.emit(base.x, base.y, base.z, this.vel.x + d.x, this.vel.y + d.y, d.z, { life: 3 + Math.random() * 2, size0: size, size1: size * (4 + 10 * (1 - k)), alpha: 0.5, drag: 0.6 * k + 0.02, buoy: 0, color: [0.9, 0.9, 0.9] });
    }
  }

  airDensity() { return Math.exp(-Math.max(0, this.pos.y) / 8500); }

  explode(reason) {
    if (this.phase === 'crashed') return;
    this.phase = 'crashed';
    this.ignited = false;
    this.event('💥 ' + reason, 'bad');
    const base = new THREE.Vector3(this.pos.x, this.pos.y, 0);
    const airy = this.airDensity();
    for (let i = 0; i < 500; i++) {
      const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar(Math.random() * 45);
      this.fire.emit(base.x + d.x * 0.1, base.y + d.y * 0.1, base.z + d.z * 0.1, this.vel.x * 0.5 + d.x, this.vel.y * 0.5 + d.y, d.z, { life: 0.8 + Math.random() * 1.4, size0: 5, size1: 22 + Math.random() * 20, alpha: 1, drag: 1.5, buoy: 3, color: [6, 3, 1.2] });
    }
    for (let i = 0; i < 260; i++) {
      const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.2, Math.random() - 0.5).normalize().multiplyScalar(Math.random() * 30);
      this.smoke.emit(base.x + d.x * 0.2, base.y + d.y * 0.2, base.z + d.z * 0.2, this.vel.x * 0.4 + d.x, this.vel.y * 0.4 + d.y, d.z, { life: 8 + Math.random() * 8, size0: 8, size1: 45 + Math.random() * 40, alpha: 0.85, drag: 0.8 * airy + 0.05, buoy: 2.5 * airy, heat: 1.2, color: [0.28, 0.26, 0.25] });
    }
    // break apart into debris
    for (const g of [...this.rocket.segGroups]) {
      for (const child of [...g.children]) {
        if (!child.parent || child.parent === this.world) continue;
        this.spawnDebris(child, new THREE.Vector3((Math.random() - 0.5) * 2, Math.random(), (Math.random() - 0.5) * 2).normalize(), 10 + Math.random() * 25);
        const d = this.debris[this.debris.length - 1];
        d.angVel.multiplyScalar(12);
      }
    }
    this.flash = 1;
    this.flashLight.position.copy(base);
    this.shakeBoost = 3;
    audio.explosion(1);
    audio.silenceEngine();
    setTimeout(() => this.showResult(false, reason), 3500);
  }

  showResult(success, sub) {
    if (this.resultShown) return;
    this.resultShown = true;
    const alt = this.maxAlt;
    let rank = 'F';
    if (this.flags.orbit) rank = 'S';
    else if (alt >= 100000) rank = 'A';
    else if (alt >= 50000) rank = 'B';
    else if (alt >= 10000) rank = 'C';
    else if (alt >= 1000) rank = 'D';
    $('r-title').textContent = success ? 'NHIỆM VỤ THÀNH CÔNG' : 'KẾT THÚC CHUYẾN BAY';
    $('r-rank').textContent = rank;
    $('r-sub').textContent = sub || '';
    $('r-alt').textContent = alt >= 10000 ? fmt(alt / 1000, 1) + ' km' : fmt(alt) + ' m';
    $('r-vel').textContent = fmt(this.maxVel) + ' m/s';
    $('r-time').textContent = fmt(Math.max(0, this.met)) + ' s';
    $('r-g').textContent = fmt(this.maxG, 1) + ' G';
    $('result').classList.remove('hidden');
  }

  // =================================================================== LIFECYCLE
  enter() {
    this.active = true;
    this.controls.enabled = this.camMode === 0;
    $('launch-ui').classList.remove('hidden');
  }

  exit() {
    this.active = false;
    this.controls.enabled = false;
    $('launch-ui').classList.add('hidden');
    $('result').classList.add('hidden');
    audio.silenceEngine();
  }

  onResize(w, h) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }

  // =================================================================== SIMULATION
  physicsStep(h) {
    const alt = this.pos.y;
    const pr = Math.exp(-Math.max(0, alt) / 8500);       // pressure ratio
    const rho = 1.225 * pr;
    const firing = this.ignited && this.phase !== 'crashed';
    let thrust = 0;
    const k = this.activeSeg;
    const info = this.segInfo[k];
    const thr = this.throttle;
    // core engines of active stage
    if (firing && this.fuel[k] > 0 && info.tVac > 0 && thr > 0) {
      const T = (info.tVac - (info.tVac - info.tSL) * pr) * thr;
      const mdot = info.mdot * thr;
      thrust += T;
      this.fuel[k] = Math.max(0, this.fuel[k] - mdot * h);
      if (this.fuel[k] === 0 && !this.flags['out' + k]) { this.flags['out' + k] = true; this.pendingEvents.push([`Tầng ${this.segs.length - k} hết nhiên liệu.`, 'warn']); }
    }
    this.coreFiring = firing && this.fuel[k] > 0 && info.tVac > 0 && thr > 0;
    // boosters
    this.boosterFiring = false;
    for (const b of this.rocket.boosters) {
      if (!b.attached || b.seg !== k || !firing) continue;
      if (b.fuel > 0) {
        const d = PARTS.booster;
        thrust += (d.thrustVac - (d.thrustVac - d.thrustSL) * pr) * b.count;
        b.fuel = Math.max(0, b.fuel - b.count * d.thrustVac / (d.ispVac * G0) * h);
        this.boosterFiring = true;
        if (b.fuel === 0) this.pendingJettison.push(b);
      }
    }
    // mass (tonnes)
    let mass = 0;
    for (const s of this.attachedSegs) mass += this.segInfo[s].dry + this.fuel[s];
    for (const b of this.rocket.boosters) if (b.attached) mass += b.dry + b.fuel; else if (this.attachedSegs.includes(b.seg)) mass += 0;
    // boosters' mass counted in segInfo? segInfo.dry excludes boosters, so ok
    this.mass = mass;
    const up = new THREE.Vector2(Math.sin(this.ang), Math.cos(this.ang));
    const v = this.vel.length();
    // aerodynamics
    let area = Math.PI * CORE_R * CORE_R;
    for (const b of this.rocket.boosters) if (b.attached) area += b.count * Math.PI * 0.36;
    let aoa = 0;
    if (v > 1) aoa = Math.atan2(Math.sin(this.ang - Math.atan2(this.vel.x, this.vel.y)), Math.cos(this.ang - Math.atan2(this.vel.x, this.vel.y)));
    const topType = this.stack[0] ? this.stack[0].type : '';
    const cd0 = topType === 'nose' ? 0.28 : topType === 'capsule' ? 0.42 : 0.75;
    const cd = cd0 + 1.4 * Math.sin(aoa) ** 2;
    const q = 0.5 * rho * v * v;
    this.qNow = q;
    const dragF = q * cd * area / 1000; // kN
    const ax = (thrust * up.x - (v > 0 ? dragF * this.vel.x / v : 0)) / mass;
    let ay = (thrust * up.y - (v > 0 ? dragF * this.vel.y / v : 0)) / mass;
    const rr = PLANET_R + Math.max(alt, 0);
    const g = G0 * (PLANET_R / rr) ** 2;
    ay += -g + (this.vel.x * this.vel.x) / rr;
    this.thrustNow = thrust;
    this.accelNow = Math.hypot(ax, ay + g) / G0;

    // rotation
    const input = (this.keys['d'] || this.keys['arrowright'] ? 1 : 0) - (this.keys['a'] || this.keys['arrowleft'] ? 1 : 0);
    const gimbal = thrust > 0 ? 0.7 : 0.0;
    const auth = (0.25 + gimbal) * Math.min(2, Math.max(0.35, 40 / mass));
    let angAcc = input * auth * 0.55;
    if (input !== 0) { this.sasTarget = this.ang; if (this.autopilot) { this.autopilot = false; this.pendingEvents.push(['Tắt lái tự động.', 'warn']); } }
    if (this.autopilot) {
      const altKm = Math.max(0, alt - this.startY) / 1000;
      const prof = Math.pow(THREE.MathUtils.clamp((altKm - 0.8) / 55, 0, 1), 0.55);
      this.sasTarget = THREE.MathUtils.degToRad(prof * 84);
    }
    if ((this.sas || this.autopilot) && input === 0) {
      const err = Math.atan2(Math.sin(this.sasTarget - this.ang), Math.cos(this.sasTarget - this.ang));
      angAcc += THREE.MathUtils.clamp(err * 2.2 - this.angVel * 2.8, -auth, auth);
    }
    // aero stability torque
    const stab = this.hasFins() ? 1.0 : -0.22;
    angAcc += -stab * q * Math.sin(aoa) * 2.5 / (mass * 1000) * (this.rocketHeight / 20);
    if (this.released) {
      this.angVel += angAcc * h;
      this.angVel *= Math.exp(-0.3 * h);
      this.ang += this.angVel * h;
    }

    if (!this.released) { this.vel.set(0, 0); return; }

    this.vel.x += ax * h; this.vel.y += ay * h;
    this.pos.x += this.vel.x * h; this.pos.y += this.vel.y * h;

    // ground contact
    const below = (this.com.y - this.com.minY);
    const bottomY = this.pos.y - below * Math.cos(this.ang);
    const ground = Math.abs(this.pos.x) < PAD_RADIUS - 2 ? PAD_TOP : 0;
    if (bottomY <= ground) {
      if (!this.lifted) {
        this.pos.y = ground + below * Math.cos(this.ang);
        this.vel.set(0, 0); this.angVel = 0;
      } else {
        const sp = this.vel.length();
        if (sp > 12 || Math.abs(this.ang) > 0.5) this.pendingExplode = 'Tên lửa rơi xuống đất!';
        else { this.pos.y = ground + below; this.vel.set(0, 0); if (this.phase === 'flight') { this.phase = 'landed'; this.pendingEvents.push(['Hạ cánh an toàn!?', '']); } }
      }
    } else if (!this.lifted && bottomY > ground + 1.0) {
      this.lifted = true;
      this.pendingEvents.push(['🚀 CẤT CÁNH!', '']);
    }
    // structural failure
    if (this.lifted && q > 35000 && Math.abs(aoa) > 0.4) this.pendingExplode = 'Vỡ cấu trúc do áp suất khí động!';
    if (this.lifted && Math.abs(aoa) > 1.2 && q > 8000) this.pendingExplode = 'Tên lửa lật nhào và vỡ tung!';
  }

  update(dt) {
    this.time += dt;
    const t = this.time;
    if (!this.rocket) return;
    this.pendingEvents = []; this.pendingJettison = []; this.pendingExplode = null;
    const kb = this.keys;
    if (kb['shift']) this.throttle = Math.min(1, this.throttle + dt * 0.8);
    if (kb['control']) this.throttle = Math.max(0, this.throttle - dt * 0.8);

    // countdown
    if (this.phase === 'countdown') {
      this.met += dt;
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
        const st = this.segInfo[this.activeSeg];
        if (st.tVac > 0 || this.rocket.boosters.some((b) => b.seg === this.activeSeg)) { this.ignited = true; this.event('Đánh lửa động cơ chính!', 'warn'); }
        else if (!this.flags.noEngine) { this.flags.noEngine = true; this.event('Không có động cơ ở tầng 1!', 'bad'); }
      }
      if (this.met >= 0) {
        this.phase = 'flight';
        this.released = true;
        this.clamps.forEach((c, i) => { c.rotation.z = (i % 2 ? 1 : -1) * 0.9; });
        this.event('Nhả kẹp giữ!');
        setTimeout(() => { $('countdown').textContent = ''; }, 900);
        const w = this.thrustTotalSL() / (this.com.mass * G0);
        if (w < 1) this.event('Lực đẩy không đủ để cất cánh (TWR < 1)!', 'bad');
      }
    } else if (this.phase === 'flight' || this.phase === 'landed') {
      this.met += dt * this.warp;
    }
    // warp limit while thrusting in atmosphere
    if (this.warp > 4 && (this.coreFiring || this.boosterFiring)) this.warp = 4;

    // physics substeps
    const simDt = dt * (this.phase === 'countdown' ? 1 : this.warp);
    const steps = Math.max(1, Math.ceil(simDt / 0.008));
    if (this.phase !== 'crashed') for (let i = 0; i < steps; i++) this.physicsStep(simDt / steps);
    for (const b of this.pendingJettison) if (b.attached) this.jettisonBooster(b);
    for (const [txt, cls] of this.pendingEvents) this.event(txt, cls);
    if (this.pendingExplode) this.explode(this.pendingExplode);

    const alt = this.pos.y;
    const speed = this.vel.length();
    if (this.phase === 'flight') {
      this.maxAlt = Math.max(this.maxAlt, alt);
      this.maxVel = Math.max(this.maxVel, speed);
      this.maxG = Math.max(this.maxG, this.accelNow || 1);
      if (this.qNow > this.maxQ) this.maxQ = this.qNow;
      else if (!this.maxQPassed && this.maxQ > 8000 && this.qNow < this.maxQ * 0.9) { this.maxQPassed = true; this.event(`Vượt Max Q (${fmt(this.maxQ / 1000, 1)} kPa).`); }
      const ms = [[1000, '1 km', null], [10000, '10 km', 'Vượt tầng đối lưu'], [50000, '50 km', 'Tầng bình lưu – bầu trời tối dần'], [100000, 'ĐƯỜNG KÁRMÁN', 'Chào mừng đến với không gian! 100 km']];
      for (const [h, big, small] of ms) {
        if (alt >= h && !this.flags['alt' + h]) {
          this.flags['alt' + h] = true;
          this.event(`Đạt độ cao ${big === 'ĐƯỜNG KÁRMÁN' ? '100 km' : big}.`);
          if (small) this.milestone(big, small);
        }
      }
      const vOrb = Math.sqrt(G0 * (PLANET_R / (PLANET_R + alt)) ** 2 * (PLANET_R + alt));
      if (alt > 70000 && this.vel.x >= vOrb * 0.98 && !this.flags.orbit) {
        this.flags.orbit = true;
        this.milestone('VÀO QUỸ ĐẠO!', `Vận tốc ${fmt(this.vel.x)} m/s – bạn đã bay vòng quanh Trái Đất!`);
        this.event('🛰 Đã vào quỹ đạo ổn định!');
        setTimeout(() => this.showResult(true, 'Tên lửa của bạn đã vào quỹ đạo Trái Đất!'), 5000);
      }
      // suborbital space flight completed
      if (this.flags.alt100000 && this.vel.y < -50 && alt < 90000 && !this.flags.orbit && !this.flags.sub) {
        this.flags.sub = true;
        setTimeout(() => this.showResult(true, 'Bay dưới quỹ đạo thành công – đã chạm tới không gian!'), 1500);
      }
    }
    if (this.phase === 'landed' && !this.resultShown) this.showResult(this.maxAlt > 1000, 'Tên lửa đã hạ xuống mặt đất.');
    if (this.phase === 'flight' && !this.lifted && this.met > 8 && !this.resultShown) {
      this.ignited = false;
      this.showResult(false, 'Tên lửa không đủ lực đẩy để rời bệ phóng. Hãy giảm khối lượng hoặc thêm động cơ!');
    }

    // -------------------------------------------------- transforms (floating origin)
    this.rocket.root.rotation.z = -this.ang;
    this.world.position.set(-this.pos.x, -this.pos.y, 0);
    for (const a of this.arms) a.pivot.rotation.y += ((a.target ? 1.3 : 0) - a.pivot.rotation.y) * (1 - Math.exp(-dt * 0.8));

    // debris
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      const sd = simDt;
      d.life += sd;
      const p = d.obj.position;
      const rhoD = Math.exp(-Math.max(0, p.y) / 8500);
      d.vel.y -= G0 * sd;
      d.vel.multiplyScalar(Math.exp(-0.02 * rhoD * Math.min(1, d.vel.length() / 200) * sd * 3));
      p.addScaledVector(d.vel, sd);
      d.obj.rotation.x += d.angVel.x * sd; d.obj.rotation.y += d.angVel.y * sd; d.obj.rotation.z += d.angVel.z * sd;
      if (p.y < 1 && d.vel.y < 0) {
        if (!d.landed && d.vel.length() > 30) {
          for (let j = 0; j < 30; j++) this.fire.emit(p.x, 2, p.z, (Math.random() - 0.5) * 30, Math.random() * 25, (Math.random() - 0.5) * 30, { life: 1.2, size0: 6, size1: 20, alpha: 1, drag: 1.2, buoy: 4, color: [6, 3, 1] });
          for (let j = 0; j < 25; j++) this.smoke.emit(p.x, 3, p.z, (Math.random() - 0.5) * 15, Math.random() * 10, (Math.random() - 0.5) * 15, { life: 10, size0: 8, size1: 40, alpha: 0.7, drag: 0.5, buoy: 2, color: [0.3, 0.28, 0.26], heat: 0.8 });
        }
        p.y = 1; d.vel.set(0, 0, 0); d.angVel.set(0, 0, 0); d.landed = true;
      }
      if (d.life > 120 || (p.y < 1.01 && d.landed && d.life > 30)) {
        d.obj.parent && d.obj.parent.remove(d.obj);
        this.debris.splice(i, 1);
      }
    }

    // -------------------------------------------------- engines & effects
    this.updateEffects(dt, simDt);

    // -------------------------------------------------- camera
    this.updateCamera(dt);

    // -------------------------------------------------- environment
    const camAlt = alt + this.camera.position.y;
    this.updateAtmosphere(Math.max(0, camAlt));
    this.skyMat.uniforms.uAlt.value = Math.max(1, camAlt);
    this.skyMat.uniforms.uSteps.value = this.app.qualityCfg.skySteps;
    this.sky.position.copy(this.camera.position);
    this.stars.position.copy(this.camera.position);
    this.stars.material.uniforms.uFade.value = THREE.MathUtils.smoothstep(camAlt, 30000, 90000);
    this.stars.material.uniforms.uPR.value = this.app.renderer.getPixelRatio();
    this.earth.position.set(0, -(PLANET_R + this.pos.y), 0);
    this.earth.rotation.z = this.pos.x / PLANET_R;
    this.earth.material.uniforms.uCamRel.value.copy(this.camera.position).sub(this.earth.position);
    this.earth.material.uniforms.uOpacity.value = THREE.MathUtils.smoothstep(camAlt, 5000, 22000);
    this.earth.material.uniforms.uTime.value = t;
    this.earth.visible = camAlt > 4000;
    const gOp = 1 - THREE.MathUtils.smoothstep(camAlt, 12000, 32000);
    this.groundMat.opacity = gOp;
    this.ground.visible = gOp > 0.001;
    const nearGround = camAlt < 45000;
    this.pad.visible = nearGround; this.trees.visible = camAlt < 20000;
    this.clouds.visible = camAlt < 60000;
    this.cloudMat.uniforms.uTime.value = t;
    this.groundUniforms.uTime.value = t;
    // sun & shadows follow rocket
    this.sun.position.copy(this.sunDir).multiplyScalar(300);
    this.sun.target.position.set(0, 0, 0);
    const blink = (Math.sin(t * 3) > 0.6) ? 20 : 0.5;
    this.beacons[0].material.emissiveIntensity = blink;

    // smoke & fire simulation (in world coords)
    const camLocal = this.camera.position.clone().sub(this.world.position);
    this.smoke.update(simDt, camLocal, 0);
    this.fire.update(simDt, camLocal, 0);

    // flash
    this.flash = Math.max(0, this.flash - dt * 1.5);
    this.flashLight.intensity = this.flash * 4e6;

    this.updateHUD(dt);
  }

  thrustTotalSL() {
    const k = this.activeSeg;
    let T = this.segInfo[k].tSL;
    for (const b of this.rocket.boosters) if (b.seg === k && b.attached) T += PARTS.booster.thrustSL * b.count;
    return T;
  }

  updateEffects(dt, simDt) {
    const pr = this.airDensity();
    const expand = THREE.MathUtils.clamp(1 - pr * 1.6, 0, 1);
    const qual = this.app.qualityCfg.particles;
    let totalThr = 0;
    const rootPos = new THREE.Vector3();
    const tmp = new THREE.Vector3();
    const exhaustDir = new THREE.Vector3(-Math.sin(this.ang), -Math.cos(this.ang), 0);
    const ignitionRamp = this.phase === 'countdown' ? THREE.MathUtils.clamp((this.met + 3) / 2.5, 0, 1) : 1;
    let nozzleAvg = new THREE.Vector3(), nozzleN = 0, sumR2 = 0;
    for (const p of this.plumes) {
      const nz = p.nz;
      let on = 0;
      if (!p.detached && this.ignited && this.phase !== 'crashed' && nz.seg === this.activeSeg) {
        if (nz.booster) {
          const b = this.rocket.boosters.find((bb) => bb.objs.includes(nz.booster));
          on = b && b.attached && b.fuel > 0 ? 1 : 0;
        } else on = this.fuel[nz.seg] > 0 ? this.throttle : 0;
      }
      on *= ignitionRamp;
      const flick = on > 0 ? 0.92 + Math.random() * 0.08 : 0;
      p.update(this.time, on * flick, expand);
      p.heat += ((on > 0 ? 0.5 + on * 0.5 : 0) - p.heat) * (1 - Math.exp(-dt * (on > 0 ? 0.6 : 0.15)));
      for (const m of nz.bellMats) m.emissiveIntensity = Math.pow(p.heat, 2) * 2.5;
      totalThr += on * (nz.booster ? 0.8 : 1) * nz.r;
      if (on <= 0) { p.prev = null; continue; }
      // world position of the nozzle exit
      nz.node.getWorldPosition(tmp);
      nozzleAvg.add(tmp); nozzleN++;
      const wx = tmp.x + this.pos.x, wy = tmp.y + this.pos.y, wz = tmp.z;
      const heightAboveGround = wy - (Math.abs(wx) < PAD_RADIUS ? 6 : 0);
      sumR2 += nz.r * nz.r * on;
      // flame sparks
      const nf = this.poisson(40 * on * nz.r * qual * simDt);
      for (let i = 0; i < nf; i++) {
        const sp = 60 + Math.random() * 80;
        this.fire.emit(wx, wy, wz, this.vel.x + exhaustDir.x * sp + (Math.random() - 0.5) * 10, this.vel.y + exhaustDir.y * sp + (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10,
          { life: 0.15 + Math.random() * 0.25, size0: nz.r * 2.2, size1: nz.r * 5, alpha: 0.6, drag: 2, buoy: 0, color: [5, 2.6, 1.0] });
      }
      // ground interaction
      if (heightAboveGround < 120) {
        const prox = 1 - heightAboveGround / 120;
        const gY = Math.abs(wx) < PAD_RADIUS ? 6.5 : 0.5;
        const nG = this.poisson(150 * on * prox * qual * nz.r * simDt);
        const onPad = Math.abs(wx) < PAD_RADIUS && heightAboveGround < 30;
        for (let i = 0; i < nG; i++) {
          let vx, vz, x0 = wx, z0 = wz, y0 = gY;
          if (onPad && Math.random() < 0.65) {
            // out of the flame trench exits
            const side = Math.random() < 0.5 ? -1 : 1;
            x0 = side * (PAD_RADIUS + 8); y0 = 2; z0 = (Math.random() - 0.5) * 6;
            vx = side * (35 + Math.random() * 45); vz = (Math.random() - 0.5) * 30;
          } else {
            const a = Math.random() * Math.PI * 2, s = 20 + Math.random() * 45;
            vx = Math.cos(a) * s; vz = Math.sin(a) * s;
          }
          this.smoke.emit(x0, y0, z0, vx, 4 + Math.random() * 10, vz, { life: 9 + Math.random() * 9, size0: 7, size1: 32 + Math.random() * 30, alpha: 0.75, drag: 0.55, buoy: 1.4, heat: 1.0, spin: 0.3, color: [0.86, 0.85, 0.84] });
        }
        const nGF = this.poisson(70 * on * prox * qual * nz.r * simDt);
        for (let i = 0; i < nGF; i++) {
          const a = Math.random() * Math.PI * 2, s = 30 + Math.random() * 50;
          this.fire.emit(wx, gY + 1, wz, Math.cos(a) * s, 2 + Math.random() * 6, Math.sin(a) * s, { life: 0.35 + Math.random() * 0.4, size0: 4, size1: 14, alpha: 0.7, drag: 2.5, buoy: 2, color: [5, 2.4, 0.9] });
        }
      }
    }
    // continuous exhaust trail from the engine cluster (distance-spaced so it never breaks up)
    if (nozzleN > 0 && sumR2 > 0) {
      const c = nozzleAvg.clone().multiplyScalar(1 / nozzleN);
      const rEff = Math.sqrt(sumR2);
      const cur = [c.x + this.pos.x, c.y + this.pos.y, c.z];
      const prev = this.trailPrev || cur;
      this.trailPrev = cur;
      const dist = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
      const spacing = Math.max(rEff * 0.8, 0.6) / Math.max(0.35, qual);
      const growth = 1 + (1 - pr) * 5;
      let n = Math.min(14, Math.floor(dist / spacing + Math.random()));
      if (this.phase === 'countdown') n = 0;
      const ap = 0.5 * Math.min(1, pr * 1.6 + 0.12);
      for (let i = 0; i < n; i++) {
        const f = (i + Math.random()) / Math.max(n, 1);
        const s = 4 + 6 * pr;
        this.smoke.emit(
          prev[0] + (cur[0] - prev[0]) * f + exhaustDir.x * rEff * 3, prev[1] + (cur[1] - prev[1]) * f + exhaustDir.y * rEff * 3, prev[2] + (cur[2] - prev[2]) * f,
          exhaustDir.x * 25 + (Math.random() - 0.5) * s, exhaustDir.y * 25 + (Math.random() - 0.5) * s, (Math.random() - 0.5) * s,
          { life: 12 + Math.random() * 10, size0: rEff * 3.2, size1: rEff * (16 + Math.random() * 12) * growth, alpha: ap, drag: 1.2 * pr + 0.03, buoy: 0.5 * pr, heat: 1.0, spin: 0.25, color: [0.93, 0.92, 0.9] });
      }
    } else this.trailPrev = null;
    // countdown venting (white LOX vapor)
    if (this.phase === 'countdown' && !this.ignited || this.phase === 'ready') {
      if (Math.random() < 0.35 * qual) {
        const y = this.pos.y + (this.com.maxY - this.com.y) * 0.6;
        this.smoke.emit(this.pos.x + CORE_R, y, (Math.random() - 0.5), 2 + Math.random() * 2, -1.5, (Math.random() - 0.5) * 2, { life: 3, size0: 0.6, size1: 4, alpha: 0.35, drag: 1, buoy: -0.6, color: [1, 1, 1] });
      }
    }
    // engine light
    const lowest = new THREE.Vector3(0, this.com.minY - this.com.y - 3, 0).applyQuaternion(this.rocket.root.quaternion);
    this.engineLight.position.copy(lowest);
    this.engineLight.intensity = totalThr * 2.2e4 * (0.9 + Math.random() * 0.2);
    this.thrNorm = Math.min(1, totalThr / 2);
    // audio
    const camDist = this.camera.position.length();
    const near = THREE.MathUtils.clamp(1.4 - camDist / 1500, 0.25, 1);
    audio.engine(Math.min(1, totalThr / 1.6), pr, near);
    audio.wind(this.qNow);
    // heat haze
    const fx = this.app.finalPass.uniforms;
    if (nozzleN > 0 && this.camMode !== 2) {
      nozzleAvg.multiplyScalar(1 / nozzleN);
      const p1 = nozzleAvg.clone().project(this.camera);
      const p2 = nozzleAvg.clone().addScaledVector(exhaustDir, 10).project(this.camera);
      if (p1.z < 1 && p1.z > -1) {
        fx.uHazePos.value.set(p1.x * 0.5 + 0.5, p1.y * 0.5 + 0.5);
        fx.uHazeDir.value.set(p2.x - p1.x, p2.y - p1.y).normalize();
        const dist = nozzleAvg.distanceTo(this.camera.position);
        fx.uHazeRadius.value = THREE.MathUtils.clamp((CORE_R * 2.2 / dist) / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * 0.5, 0.005, 0.3);
        fx.uHaze.value = Math.min(1, totalThr) * (0.3 + 0.7 * pr);
      } else fx.uHaze.value = 0;
    } else fx.uHaze.value = 0;
    fx.uFlash.value = this.flash * 0.6;
  }

  poisson(lambda) {
    // fast approximate: integer part + bernoulli
    const n = Math.floor(lambda);
    return n + (Math.random() < lambda - n ? 1 : 0);
  }

  updateCamera(dt) {
    const cam = this.camera;
    cam.position.sub(this.shake);
    const h = this.rocketHeight;
    if (this.camMode === 0) {
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    } else if (this.camMode === 1) {
      // fixed tower camera on the ground (world coords) with telephoto zoom
      const wp = new THREE.Vector3(-260, 14, 380);
      cam.position.set(wp.x - this.pos.x, wp.y - this.pos.y, wp.z);
      cam.lookAt(0, 0, 0);
      const dist = cam.position.length();
      cam.fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan((h * 2.2 + 30) / dist)), 0.3, 50);
      cam.updateProjectionMatrix();
    } else if (this.camMode === 2) {
      // onboard: mounted on the side, looking down along the body
      const root = this.rocket.root;
      const top = this.com.maxY - this.com.y;
      const p = root.localToWorld(new THREE.Vector3(CORE_R + 0.5, top - 3, 0.9));
      const look = root.localToWorld(new THREE.Vector3(CORE_R + 0.2, this.com.minY - this.com.y - 40, 0.2));
      cam.position.copy(p);
      cam.up.set(Math.sin(this.ang), Math.cos(this.ang), 0);
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
    // shake
    const pr = this.airDensity();
    const groundProx = THREE.MathUtils.clamp(1 - this.pos.y / 600, 0, 1);
    this.shakeBoost = Math.max(0, (this.shakeBoost || 0) - dt * 1.2);
    let amp = (this.thrNorm || 0) * (0.05 + 0.4 * groundProx * pr) + Math.min(0.3, this.qNow / 120000) + this.shakeBoost;
    if (this.camMode === 1) amp *= 0.2 * (this.camera.fov / 50);
    const s = this.shake.set((Math.random() - 0.5) * amp, (Math.random() - 0.5) * amp, (Math.random() - 0.5) * amp);
    if (this.camMode === 2) s.multiplyScalar(0.2);
    cam.position.add(s);
  }

  updateHUD(dt) {
    this.hudTimer = (this.hudTimer || 0) - dt;
    if (this.hudTimer > 0) return;
    this.hudTimer = 0.066;
    const alt = Math.max(0, this.pos.y - this.startY);
    const altEl = $('h-alt');
    if (alt >= 10000) { altEl.textContent = fmt(alt / 1000, 2); $('h-alt-u').textContent = 'km'; }
    else { altEl.textContent = fmt(alt, 0); $('h-alt-u').textContent = 'm'; }
    $('h-vel').textContent = fmt(this.vel.length());
    $('h-vs').textContent = fmt(this.vel.y, 1) + ' m/s';
    $('h-hs').textContent = fmt(this.vel.x, 1) + ' m/s';
    const sos = 340 * Math.max(0.85, Math.exp(-this.pos.y / 60000));
    $('h-mach').textContent = fmt(this.vel.length() / sos, 2);
    $('h-g').textContent = fmt(this.released ? this.accelNow || 0 : 1, 2) + ' G';
    $('h-q').textContent = fmt(this.qNow / 1000, 1) + ' kPa';
    $('h-pitch').textContent = fmt(THREE.MathUtils.radToDeg(this.ang), 1) + '°';
    $('h-apo').textContent = this.maxAlt >= 10000 ? fmt(this.maxAlt / 1000, 1) + ' km' : fmt(this.maxAlt) + ' m';
    const m = this.met;
    $('h-met').textContent = `T${m < 0 ? '-' : '+'}${String(Math.floor(Math.abs(m) / 60)).padStart(2, '0')}:${String(Math.floor(Math.abs(m)) % 60).padStart(2, '0')}`;
    $('h-sas').textContent = this.sas ? 'BẬT' : 'TẮT';
    $('h-sas').style.color = this.sas ? 'var(--ok)' : 'var(--danger)';
    $('h-ap').textContent = this.autopilot ? 'BẬT' : 'TẮT';
    $('h-ap').style.color = this.autopilot ? 'var(--ok)' : 'var(--muted)';
    $('h-warp').textContent = this.warp + '×';
    $('h-cam').textContent = this.camModes[this.camMode];
    $('h-thr').style.width = this.throttle * 100 + '%';
    $('h-thr-v').textContent = Math.round(this.throttle * 100) + '%';
    // stages
    let html = '';
    for (let k = this.segs.length - 1; k >= 0; k--) {
      const attached = this.attachedSegs.includes(k);
      const active = k === this.activeSeg && attached;
      const f = this.fuelMax[k] > 0 ? this.fuel[k] / this.fuelMax[k] : 0;
      html += `<div class="fuel-row ${active ? 'active' : ''} ${attached ? '' : 'gone'}"><div class="fr-top"><span>Tầng ${this.segs.length - k}${active ? ' ▶' : ''}</span><span>${this.fuelMax[k] > 0 ? fmt(this.fuel[k], 1) + ' t' : '—'}</span></div><div class="fr-bar"><div style="width:${f * 100}%"></div></div>`;
      for (const b of this.rocket.boosters) if (b.seg === k) {
        html += `<div class="fr-top" style="margin-top:4px;font-size:11px;opacity:${b.attached ? 1 : 0.35}"><span>↳ Đẩy phụ</span><span>${fmt(b.fuel, 1)} t</span></div><div class="fr-bar boost"><div style="width:${(b.fuel / b.fuelMax) * 100}%"></div></div>`;
      }
      html += '</div>';
    }
    $('h-stages').innerHTML = html;
  }
}
