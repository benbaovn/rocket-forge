// 3D Orbital Tracking Station Map View (Three.js WebGL + 2D HUD Overlay)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { R_E, R_M, R_SUN, EARTH_A, EARTH_SOI, SUN_SOI, ASTEROID_BELT_INNER, ASTEROID_BELT_OUTER, MOON_A, MOON_SOI, ATM_TOP, ISS_R, BODIES, NON_EARTH_BODIES } from '../sim/constants.js';
import { moonPos, moonAngle, bodyPos, bodyAngle, helioPos } from '../sim/orbit.js';
import { tr, getLang } from '../i18n.js';

// 1 unit in 3D scene = 1 kilometre (1,000 metres)
const SCALE = 0.001;
const to3D = (x, y, z = 0, out = new THREE.Vector3()) => out.set(x * SCALE, (z || 0) * SCALE, -(y || 0) * SCALE);
const fmtKm = (m) => (m >= 1e6 ? (m / 1e6).toFixed(2) + ' Mm' : m >= 1e4 ? (m / 1000).toFixed(0) + ' km' : (m / 1000).toFixed(1) + ' km');
const fmt = (v, d = 0) => (typeof v === 'number' && isFinite(v) ? v.toLocaleString('vi-VN', { maximumFractionDigits: d, minimumFractionDigits: d }) : '—');

/** Procedural high-contrast Earth surface texture (equirectangular) */
function createEarthTexture() {
  const w = 1024, h = 512;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');

  const img = ctx.createImageData(w, h);
  const data = img.data;

  for (let y = 0; y < h; y++) {
    const lat = (y / h - 0.5) * Math.PI; // -PI/2 to PI/2
    const cosLat = Math.cos(lat);
    for (let x = 0; x < w; x++) {
      const lon = (x / w - 0.5) * Math.PI * 2; // -PI to PI
      const idx = (y * w + x) * 4;

      const nx = cosLat * Math.sin(lon);
      const ny = Math.sin(lat);
      const nz = cosLat * Math.cos(lon);

      // Continent & ocean harmonics
      let n = Math.sin(nx * 2.6 + 0.8) * Math.cos(ny * 2.3) + Math.sin(nz * 2.7) * 0.45;
      n += Math.sin(nx * 5.2 + ny * 4.1) * 0.22;
      n += Math.sin(nx * 11.5 + nz * 9.2) * 0.11;
      n += Math.sin(nx * 23.0 + ny * 21.0) * 0.05;

      const isPolar = Math.abs(lat) > 1.42;
      const isIceEdge = Math.abs(lat) > 1.34;

      if (isPolar || (isIceEdge && n > -0.15)) {
        // Ice caps
        data[idx] = 230; data[idx + 1] = 242; data[idx + 2] = 250; data[idx + 3] = 255;
      } else if (n > 0.08) {
        // Land
        const elev = (n - 0.08) / 0.8;
        if (elev > 0.55) {
          // Mountains
          data[idx] = 145; data[idx + 1] = 135; data[idx + 2] = 120; data[idx + 3] = 255;
        } else if (elev > 0.28) {
          // Savanna / Desert
          data[idx] = 175; data[idx + 1] = 150; data[idx + 2] = 95; data[idx + 3] = 255;
        } else {
          // Forest & plains
          data[idx] = 34; data[idx + 1] = 92; data[idx + 2] = 42; data[idx + 3] = 255;
        }
      } else if (n > 0.0) {
        // Coast / Shallows
        data[idx] = 20; data[idx + 1] = 105; data[idx + 2] = 150; data[idx + 3] = 255;
      } else {
        // Ocean depth gradient
        const d = Math.min(1, -n * 2.2);
        data[idx] = Math.round(12 * (1 - d) + 4 * d);
        data[idx + 1] = Math.round(38 * (1 - d) + 16 * d);
        data[idx + 2] = Math.round(72 * (1 - d) + 40 * d);
        data[idx + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);

  // Soft atmospheric clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  for (let i = 0; i < 40; i++) {
    const cx = (i * 93) % w;
    const cy = 60 + ((i * 127) % (h - 120));
    const rw = 40 + (i % 7) * 14;
    const rh = 12 + (i % 5) * 6;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rw, rh, (i % 6) * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Procedural lunar surface texture */
function createMoonTexture() {
  const w = 512, h = 256;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');

  const img = ctx.createImageData(w, h);
  const data = img.data;
  for (let y = 0; y < h; y++) {
    const lat = (y / h - 0.5) * Math.PI;
    const cosLat = Math.cos(lat);
    for (let x = 0; x < w; x++) {
      const lon = (x / w - 0.5) * Math.PI * 2;
      const idx = (y * w + x) * 4;

      const nx = cosLat * Math.sin(lon);
      const ny = Math.sin(lat);
      const nz = cosLat * Math.cos(lon);

      let n = Math.sin(nx * 3.0 + 1.2) * Math.cos(ny * 3.0) + Math.sin(nz * 2.5) * 0.38;
      n += Math.sin(nx * 7.5) * Math.cos(ny * 8.2) * 0.18;
      n += Math.sin(nx * 20.0 + nz * 18.0) * 0.08;

      let v = 155 + n * 45;
      if (n < -0.12) v = 80 + (n + 0.12) * 28; // lunar maria
      v = Math.max(45, Math.min(240, v));

      data[idx] = v; data[idx + 1] = v * 0.98; data[idx + 2] = v * 0.95; data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Lunar impact craters
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillStyle = 'rgba(30, 30, 30, 0.35)';
  for (let i = 0; i < 30; i++) {
    const cx = (i * 71) % w;
    const cy = (i * 113) % h;
    const r = 3 + (i % 6) * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Thick screen-space Orbit Ring Line2 that never gets occluded and is visible from all angles */
function createOrbitLine2(radius, color = 0x38bdf8, linewidth = 2.0, opacity = 0.5, segments = 160) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const th = (i / segments) * Math.PI * 2;
    pts.push(Math.cos(th) * radius, 0, Math.sin(th) * radius);
  }
  const geo = new LineGeometry();
  geo.setPositions(pts);
  const mat = new LineMaterial({
    color,
    linewidth,
    transparent: true,
    opacity,
    depthTest: false,
    depthWrite: false,
  });
  mat.resolution.set(innerWidth, innerHeight);
  const line = new Line2(geo, mat);
  line.frustumCulled = false;
  line.renderOrder = 992;
  return line;
}

export class MapView {
  constructor(containerOrCanvas, legend) {
    this.container = containerOrCanvas;
    this.legend = legend;
    this.visible = false;
    this.focus = 'vessel'; // 'vessel' | 'earth' | 'moon' | 'iss'
    this.lastState = null;
    this.lineMaterials = [];

    // Resolve DOM elements
    if (this.container.tagName === 'CANVAS') {
      this.glCanvas = this.container;
      this.hudCanvas = document.createElement('canvas');
      this.hudCanvas.id = 'map-hud';
      this.container.parentElement.appendChild(this.hudCanvas);
    } else {
      this.glCanvas = this.container.querySelector('#map-gl') || this.container.querySelector('canvas');
      this.hudCanvas = this.container.querySelector('#map-hud');
      this.focusBar = this.container.querySelector('#map-focus-bar');
      this.telemetryBox = this.container.querySelector('#map-tel-rows');
      this.objListBox = this.container.querySelector('#map-obj-list');
      this.objPopup = this.container.querySelector('#map-obj-popup');
      this.mopName = this.container.querySelector('#mop-name');
      this.mopMeta = this.container.querySelector('#mop-meta');
      this.btnDeleteObj = this.container.querySelector('#btn-map-delete');
      this.closeBtn = this.container.querySelector('#map-close-btn');
    }
    this.selectedObjectId = null;
    this.onDeleteObject = null;
    this.otherPool = [];

    if (!this.hudCanvas) {
      this.hudCanvas = document.createElement('canvas');
      this.hudCanvas.id = 'map-hud';
      this.container.appendChild(this.hudCanvas);
    }
    this.hudCtx = this.hudCanvas.getContext('2d');

    // Setup Three.js WebGL Scene
    this.initThree();

    // Hook DOM UI events
    this.initEvents();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02050e);

    // Camera
    const aspect = innerWidth / innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 5, 1e12);
    this.camera.position.set(0, 15000, 25000);
    this.maxOrbitExtent = 1e6;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.glCanvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(innerWidth, innerHeight);
    // second WebGL context: keep it at 1× pixel ratio and shrink to 1×1 while hidden to save VRAM
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(1, 1, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Controls
    this.controls = new OrbitControls(this.camera, this.glCanvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 5;
    this.controls.maxDistance = Infinity;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;

    // Lights
    this.ambientLight = new THREE.AmbientLight(0x4b6584, 1.15);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.PointLight(0xfff4d6, 3.2, 0, 0);
    this.sunLight.position.set(0, 0, 0);
    this.scene.add(this.sunLight);

    this.camLight = new THREE.DirectionalLight(0xe2e8f0, 1.1);
    this.scene.add(this.camLight);

    // Starfield
    this.initStarfield();

    // Celestial Bodies & Hierarchical Solar System
    this.initSun();
    this.initEarth();
    this.initMoon();
    this.initPlanets();
    this.initISS();
    this.initGrid();
    this.initVesselMarker();
    this.initTrajectoryObjects();

    // Dynamic targets registry for HUD projection
    this.hudTargets = [];
  }

  initStarfield() {
    const starCount = 2200;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(starCount * 3);
    const col = new Float32Array(starCount * 3);
    const r = 1.3e6;

    for (let i = 0; i < starCount; i++) {
      const u = Math.random(), v = Math.random();
      const th = u * Math.PI * 2, ph = Math.acos(2 * v - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph);

      const tint = 0.75 + Math.random() * 0.25;
      col[i * 3] = tint * 0.95;
      col[i * 3 + 1] = tint * 0.98;
      col[i * 3 + 2] = tint;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: 2.2, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: 0.8, depthTest: false, depthWrite: false });
    this.starfield = new THREE.Points(geo, mat);
    this.starfield.frustumCulled = false;
    this.starfield.renderOrder = -10;
    this.scene.add(this.starfield);
  }

  initSun() {
    this.sunGroup = new THREE.Group();
    this.scene.add(this.sunGroup);

    const sunR = R_SUN * SCALE;
    const sunGeo = new THREE.SphereGeometry(sunR, 64, 32);
    const sunTex = this.createPlanetTexture('sun');
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTex,
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunGroup.add(this.sunMesh);

    // Glowing Solar Corona Halo
    const coronaGeo = new THREE.SphereGeometry(sunR * 1.38, 48, 24);
    const coronaMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorld;
        void main() {
          vNormal = normalize(mat3(modelMatrix) * normal);
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorld = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vWorld;
        void main() {
          vec3 V = normalize(cameraPosition - vWorld);
          float rim = max(0.0, dot(V, -normalize(vNormal)));
          float glow = pow(rim, 2.5);
          vec3 col = mix(vec3(1.0, 0.42, 0.08), vec3(1.0, 0.92, 0.45), glow);
          gl_FragColor = vec4(col, glow * 0.9);
        }
      `,
    });
    this.sunCorona = new THREE.Mesh(coronaGeo, coronaMat);
    this.sunGroup.add(this.sunCorona);

    // Sun Sphere of Influence (SOI) 3D wireframe shell encompassing the entire Solar System
    const sunSoiGeo = new THREE.SphereGeometry(SUN_SOI * SCALE, 44, 22);
    const sunSoiMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
      depthTest: false,
    });
    this.sunSOI = new THREE.Mesh(sunSoiGeo, sunSoiMat);
    this.sunSOI.renderOrder = 983;
    this.sunGroup.add(this.sunSOI);

    // Main Asteroid Belt between Mars (67,000 km) and Jupiter (115,000 km)
    this.initAsteroidBelt();
  }

  initAsteroidBelt() {
    this.asteroidBeltGroup = new THREE.Group();
    this.sunGroup.add(this.asteroidBeltGroup);

    const rInner = ASTEROID_BELT_INNER * SCALE;
    const rOuter = ASTEROID_BELT_OUTER * SCALE;

    // 1. Dusty concentric gravel/debris band with Kirkwood gaps
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 32;
    const ctx = cv.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0.0, 'rgba(168,162,158,0)');
    grad.addColorStop(0.14, 'rgba(180,168,152,0.22)');
    grad.addColorStop(0.32, 'rgba(214,211,209,0.34)');
    grad.addColorStop(0.41, 'rgba(90,85,80,0.06)'); // Kirkwood gap
    grad.addColorStop(0.55, 'rgba(195,184,168,0.36)');
    grad.addColorStop(0.71, 'rgba(100,94,88,0.08)'); // Kirkwood gap
    grad.addColorStop(0.84, 'rgba(175,166,154,0.26)');
    grad.addColorStop(1.0, 'rgba(168,162,158,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 32);
    const beltTex = new THREE.CanvasTexture(cv);

    const bandGeo = new THREE.RingGeometry(rInner, rOuter, 144, 2);
    const pos = bandGeo.attributes.position;
    const uv = bandGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i), vy = pos.getY(i);
      const u = (Math.hypot(vx, vy) - rInner) / Math.max(1e-5, rOuter - rInner);
      uv.setXY(i, u, 0.5);
    }
    bandGeo.rotateX(-Math.PI / 2);
    const bandMat = new THREE.MeshBasicMaterial({
      map: beltTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    this.asteroidBeltGroup.add(new THREE.Mesh(bandGeo, bandMat));

    // 2. 3D Faceted Rocky Asteroids (InstancedMesh)
    const makeRockGeo = (seed) => {
      const g = new THREE.IcosahedronGeometry(1, 1);
      const p = g.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        const n = v.clone().normalize();
        const noise =
          1 +
          0.32 * Math.sin(n.x * 3.7 + seed) * Math.cos(n.y * 4.1 - seed) +
          0.18 * Math.cos(n.z * 6.3 + seed * 1.7);
        v.copy(n).multiplyScalar(noise);
        v.y *= 0.68;
        p.setXYZ(i, v.x, v.y, v.z);
      }
      g.computeVertexNormals();
      return g;
    };

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.12,
      flatShading: true,
    });

    let seed = 1337;
    const rnd = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const N_PER_SHAPE = 380;
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    for (let sIdx = 0; sIdx < 3; sIdx++) {
      const geo = makeRockGeo(sIdx * 4.3 + 1.1);
      const im = new THREE.InstancedMesh(geo, rockMat, N_PER_SHAPE);
      for (let i = 0; i < N_PER_SHAPE; i++) {
        const ang = rnd() * Math.PI * 2;
        // Concentrate slightly toward middle of belt with natural radial spread
        const u = 0.5 + (rnd() - 0.5) * 0.65 + (rnd() - 0.5) * 0.35;
        const r = rInner + Math.max(0.02, Math.min(0.98, u)) * (rOuter - rInner);
        const ySpread = (rnd() - 0.5) * (rOuter - rInner) * 0.14;
        dummy.position.set(Math.cos(ang) * r, ySpread, Math.sin(ang) * r);
        dummy.rotation.set(rnd() * Math.PI * 2, rnd() * Math.PI * 2, rnd() * Math.PI * 2);
        // Power-law size distribution with a few large dwarf/Ceres-like boulders
        const sizeBase = rnd() < 0.04 ? 260 + rnd() * 220 : 48 + Math.pow(rnd(), 2.2) * 190;
        dummy.scale.set(
          sizeBase * (0.75 + rnd() * 0.6),
          sizeBase * (0.65 + rnd() * 0.5),
          sizeBase * (0.75 + rnd() * 0.6)
        );
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);

        const shade = 0.48 + rnd() * 0.42;
        const warm = rnd() * 0.08;
        col.setRGB(shade + warm, shade + warm * 0.4, shade - warm * 0.3);
        im.setColorAt(i, col);
      }
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      this.asteroidBeltGroup.add(im);
    }
  }

  initEarth() {
    this.earthGroup = new THREE.Group();
    this.scene.add(this.earthGroup);

    // Earth Orbit Ring around the Sun
    this.earthOrbitRing = createOrbitLine2(EARTH_A * SCALE, 0x38bdf8, 2.2, 0.55, 240);
    this.lineMaterials.push(this.earthOrbitRing.material);
    this.scene.add(this.earthOrbitRing);

    const earthR = R_E * SCALE;
    const earthGeo = new THREE.SphereGeometry(earthR, 64, 32);
    const earthTex = createEarthTexture();
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.7,
      metalness: 0.1,
    });
    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.earthGroup.add(this.earthMesh);

    // Earth Sphere of Influence (SOI) 3D wireframe shell (single large gravity sphere)
    const earthSoiGeo = new THREE.SphereGeometry(EARTH_SOI * SCALE, 32, 16);
    const earthSoiMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      depthTest: false,
    });
    this.earthSOI = new THREE.Mesh(earthSoiGeo, earthSoiMat);
    this.earthSOI.renderOrder = 985;
    this.earthGroup.add(this.earthSOI);

    // Atmospheric limb glow
    const atmoGeo = new THREE.SphereGeometry(earthR * 1.025, 48, 24);
    const atmoMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color(0x38bdf8) },
        uSunDir: { value: new THREE.Vector3(1, 0, 0) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorld;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorld = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uSunDir;
        varying vec3 vNormal;
        varying vec3 vWorld;
        void main() {
          vec3 V = normalize(cameraPosition - vWorld);
          float rim = 1.0 - max(0.0, dot(V, -vNormal));
          rim = pow(rim, 3.2);
          gl_FragColor = vec4(uColor, rim * 0.75);
        }
      `,
    });
    this.earthAtmo = new THREE.Mesh(atmoGeo, atmoMat);
    this.earthGroup.add(this.earthAtmo);

    // Launch Pad 3D Marker
    const padPinGeo = new THREE.CylinderGeometry(8, 2, 45, 12);
    padPinGeo.translate(0, 22.5, 0);
    const padPinMat = new THREE.MeshBasicMaterial({ color: 0xff7a3a, depthTest: false });
    this.padMarker = new THREE.Mesh(padPinGeo, padPinMat);
    this.padMarker.renderOrder = 999;
    this.scene.add(this.padMarker);
  }

  initMoon() {
    this.moonGroup = new THREE.Group();
    this.scene.add(this.moonGroup);

    const moonR = R_M * SCALE;
    const moonGeo = new THREE.SphereGeometry(moonR, 48, 24);
    const moonTex = createMoonTexture();
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTex,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonGroup.add(this.moonMesh);

    // Moon Orbit Loop in 3D centered on EarthGroup so it travels with Earth around the Sun
    this.moonOrbitRing = createOrbitLine2(MOON_A * SCALE, 0x94a3b8, 2.0, 0.5, 192);
    this.lineMaterials.push(this.moonOrbitRing.material);
    this.earthGroup.add(this.moonOrbitRing);

    // Moon Sphere of Influence (SOI) 3D Shell
    const soiGeo = new THREE.SphereGeometry(MOON_SOI * SCALE, 32, 16);
    const soiMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      depthTest: false,
    });
    this.moonSOI = new THREE.Mesh(soiGeo, soiMat);
    this.moonSOI.renderOrder = 985;
    this.moonGroup.add(this.moonSOI);
  }

  createPlanetTexture(name) {
    const B = BODIES[name];
    const isMoon = B && B.parent && B.parent !== 'sun';
    const w = isMoon ? 256 : 512, h = isMoon ? 128 : 256;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(w, h);
    const data = img.data;
    for (let y = 0; y < h; y++) {
      const lat = (y / h - 0.5) * Math.PI;
      const cosLat = Math.cos(lat);
      for (let x = 0; x < w; x++) {
        const lon = (x / w - 0.5) * Math.PI * 2;
        const idx = (y * w + x) * 4;
        const nx = cosLat * Math.sin(lon);
        const ny = Math.sin(lat);
        const nz = cosLat * Math.cos(lon);
        let n = Math.sin(nx * 3.2 + 0.9) * Math.cos(ny * 2.8) + Math.sin(nz * 2.6) * 0.4;
        n += Math.sin(nx * 8.0 + ny * 6.5) * 0.2;
        n += Math.sin(nx * 18.0 + nz * 15.0) * 0.08;

        if (name === 'sun') {
          const g = Math.sin(nx * 14.0 + ny * 12.0) * 0.25 + Math.cos(nz * 16.0 - nx * 9.0) * 0.25 + n * 0.4;
          const k = Math.max(0, Math.min(1, 0.55 + g * 0.55));
          data[idx] = 255;
          data[idx + 1] = Math.round(165 + k * 85);
          data[idx + 2] = Math.round(35 + k * 145);
          data[idx + 3] = 255;
        } else if (name === 'mars') {
          const isPolar = Math.abs(lat) > 1.38;
          if (isPolar) {
            data[idx] = 240; data[idx + 1] = 236; data[idx + 2] = 232; data[idx + 3] = 255;
          } else if (n < -0.15) {
            data[idx] = 115; data[idx + 1] = 56; data[idx + 2] = 36; data[idx + 3] = 255;
          } else {
            const k = Math.max(0, Math.min(1, (n + 0.15) / 1.1));
            data[idx] = Math.round(185 + k * 55);
            data[idx + 1] = Math.round(78 + k * 55);
            data[idx + 2] = Math.round(38 + k * 30);
            data[idx + 3] = 255;
          }
        } else if (name === 'venus' || name === 'titan') {
          const band = Math.sin(lat * 10.0 + Math.sin(lon * 2.0) * 1.2) * 0.5 + 0.5;
          const swirl = Math.max(0, Math.min(1, 0.5 + n * 0.35 + (band - 0.5) * 0.35));
          data[idx] = Math.round((name === 'titan' ? 215 : 205) + swirl * 40);
          data[idx + 1] = Math.round((name === 'titan' ? 140 : 160) + swirl * 55);
          data[idx + 2] = Math.round((name === 'titan' ? 45 : 75) + swirl * 55);
          data[idx + 3] = 255;
        } else if (name === 'jupiter') {
          const b1 = Math.sin(lat * 18.0 + Math.sin(lon * 3.0 + lat * 4.0) * 0.45);
          const b2 = Math.cos(lat * 9.0 - Math.sin(lon * 2.0) * 0.3);
          const spotDist = Math.hypot((lon - 0.6) * 0.7, (lat + 0.38) * 1.8);
          const isGRS = spotDist < 0.28;
          if (isGRS) {
            const s = 1 - spotDist / 0.28;
            data[idx] = Math.round(215 + s * 35);
            data[idx + 1] = Math.round(85 + s * 25);
            data[idx + 2] = Math.round(48 + s * 18);
          } else if (b1 > 0.25) {
            data[idx] = Math.round(238 + n * 14);
            data[idx + 1] = Math.round(218 + n * 16);
            data[idx + 2] = Math.round(186 + n * 18);
          } else if (b2 < -0.2) {
            data[idx] = Math.round(168 + n * 22);
            data[idx + 1] = Math.round(98 + n * 18);
            data[idx + 2] = Math.round(58 + n * 14);
          } else {
            data[idx] = Math.round(212 + n * 20);
            data[idx + 1] = Math.round(152 + n * 20);
            data[idx + 2] = Math.round(102 + n * 16);
          }
          data[idx + 3] = 255;
        } else if (name === 'saturn') {
          const b = Math.sin(lat * 16.0 + n * 0.6) * 0.5 + 0.5;
          data[idx] = Math.round(210 + b * 38);
          data[idx + 1] = Math.round(182 + b * 42);
          data[idx + 2] = Math.round(118 + b * 45);
          data[idx + 3] = 255;
        } else if (name === 'uranus') {
          const b = Math.sin(lat * 8.0 + n * 0.35) * 0.5 + 0.5;
          data[idx] = Math.round(125 + b * 45);
          data[idx + 1] = Math.round(220 + b * 30);
          data[idx + 2] = Math.round(235 + b * 20);
          data[idx + 3] = 255;
        } else if (name === 'neptune') {
          const b = Math.sin(lat * 12.0 + Math.cos(lon * 2.0) * 0.4 + n * 0.5) * 0.5 + 0.5;
          data[idx] = Math.round(38 + b * 45);
          data[idx + 1] = Math.round(96 + b * 68);
          data[idx + 2] = Math.round(205 + b * 48);
          data[idx + 3] = 255;
        } else if (name === 'pluto') {
          const heart = Math.hypot((lon - 0.3) * 0.9, (lat - 0.1) * 1.4) < 0.42;
          if (heart) {
            data[idx] = 242; data[idx + 1] = 232; data[idx + 2] = 216;
          } else {
            const k = Math.max(0, Math.min(1, 0.5 + n * 0.45));
            data[idx] = Math.round(145 + k * 68);
            data[idx + 1] = Math.round(105 + k * 56);
            data[idx + 2] = Math.round(78 + k * 46);
          }
          data[idx + 3] = 255;
        } else if (name === 'io') {
          const k = Math.max(0, Math.min(1, 0.5 + n * 0.55));
          data[idx] = Math.round(220 + k * 35);
          data[idx + 1] = Math.round(145 + k * 85);
          data[idx + 2] = Math.round(25 + k * 45);
          data[idx + 3] = 255;
        } else if (name === 'europa' || name === 'enceladus') {
          const crack = Math.abs(Math.sin(lon * 9.0 + lat * 11.0 + n * 2.0)) < 0.08;
          if (crack) {
            data[idx] = name === 'europa' ? 168 : 95;
            data[idx + 1] = name === 'europa' ? 112 : 195;
            data[idx + 2] = name === 'europa' ? 88 : 245;
          } else {
            const v = Math.round(225 + n * 22);
            data[idx] = Math.min(255, v);
            data[idx + 1] = Math.min(255, v + 4);
            data[idx + 2] = Math.min(255, v + 10);
          }
          data[idx + 3] = 255;
        } else if (name === 'triton') {
          const v = Math.max(140, Math.min(245, 205 + n * 35));
          data[idx] = Math.round(v * 1.04);
          data[idx + 1] = Math.round(v * 0.92);
          data[idx + 2] = Math.round(v * 0.96);
          data[idx + 3] = 255;
        } else if (name === 'iapetus') {
          const darkSide = lon > -0.8 && lon < 0.8 && Math.abs(lat) < 1.1;
          const v = darkSide ? (65 + n * 25) : (210 + n * 30);
          data[idx] = Math.round(v); data[idx + 1] = Math.round(v * 0.96); data[idx + 2] = Math.round(v * 0.90);
          data[idx + 3] = 255;
        } else if (name === 'phobos' || name === 'deimos' || isMoon) {
          const groove = Math.sin(lon * 12.0 + lat * 8.0) * 10;
          const baseV = (name === 'umbriel' || name === 'callisto' || name === 'oberon') ? 105 : 162;
          let v = baseV + n * 42 + groove;
          v = Math.max(45, Math.min(235, v));
          data[idx] = Math.round(v * 1.03);
          data[idx + 1] = Math.round(v * 0.98);
          data[idx + 2] = Math.round(v * 0.93);
          data[idx + 3] = 255;
        } else {
          // mercury
          let v = 135 + n * 48;
          if (n < -0.1) v = 88 + (n + 0.1) * 30;
          v = Math.max(50, Math.min(225, v));
          data[idx] = Math.round(v * 1.04);
          data[idx + 1] = Math.round(v * 0.98);
          data[idx + 2] = Math.round(v * 0.90);
          data[idx + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    const hasAtmClouds = ['sun', 'venus', 'jupiter', 'saturn', 'uranus', 'neptune', 'titan'].includes(name);
    if (!hasAtmClouds) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.26)';
      ctx.fillStyle = 'rgba(25, 20, 18, 0.26)';
      for (let i = 0; i < 22; i++) {
        const cx = (i * 79) % w;
        const cy = 18 + ((i * 107) % (h - 36));
        const r = (isMoon ? 2 : 3) + (i % 5) * 1.8;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  initPlanets() {
    this.planetGroups = {};
    this.planetMeshes = {};
    this.planetSOIs = {};
    // Create planets first (in NON_EARTH_BODIES, PLANET_LIST comes before EXTRA_MOON_LIST)
    for (const name of NON_EARTH_BODIES) {
      const B = BODIES[name];
      const isMoon = B.parent && B.parent !== 'sun';
      const g = new THREE.Group();
      this.scene.add(g);
      this.planetGroups[name] = g;

      const pR = B.R * SCALE;
      const geo = new THREE.SphereGeometry(pR, isMoon ? 32 : 48, isMoon ? 16 : 24);
      const tex = this.createPlanetTexture(name);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: (B.atm || 0) > 0 ? 0.55 : 0.82,
        metalness: 0.05,
      });
      const mesh = new THREE.Mesh(geo, mat);
      if (name === 'phobos' || name === 'deimos') {
        mesh.scale.set(1.18, 0.88, 0.96);
      }
      g.add(mesh);
      this.planetMeshes[name] = mesh;

      // Iconic planetary ring systems for Saturn and Uranus
      if (name === 'saturn' || name === 'uranus') {
        const innerR = pR * (name === 'saturn' ? 1.32 : 1.45);
        const outerR = pR * (name === 'saturn' ? 2.38 : 1.78);
        const rGeo = new THREE.RingGeometry(innerR, outerR, 96);
        rGeo.rotateX(Math.PI / 2);
        const rMat = new THREE.MeshBasicMaterial({
          color: name === 'saturn' ? 0xfde68a : 0x67e8f9,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: name === 'saturn' ? 0.62 : 0.28,
          depthWrite: false,
        });
        const rMesh = new THREE.Mesh(rGeo, rMat);
        rMesh.rotation.z = name === 'saturn' ? 0.42 : 1.25;
        g.add(rMesh);
      }

      // Orbit ring around parent body (Sun for planets, parent planet for moons)
      const ring = createOrbitLine2(B.a * SCALE, B.hex, isMoon ? 1.6 : 2.2, isMoon ? 0.55 : 0.55, isMoon ? 128 : 240);
      this.lineMaterials.push(ring.material);
      if (isMoon && this.planetGroups[B.parent]) {
        this.planetGroups[B.parent].add(ring);
      } else {
        this.scene.add(ring);
      }

      // SOI wireframe shell
      const soiGeo = new THREE.SphereGeometry(B.soi * SCALE, isMoon ? 20 : 28, isMoon ? 10 : 14);
      const soiMat = new THREE.MeshBasicMaterial({
        color: B.hex,
        wireframe: true,
        transparent: true,
        opacity: isMoon ? 0.16 : 0.14,
        depthTest: false,
      });
      const soiMesh = new THREE.Mesh(soiGeo, soiMat);
      soiMesh.renderOrder = 985;
      g.add(soiMesh);
      this.planetSOIs[name] = soiMesh;
    }
  }

  initISS() {
    // ISS Orbit Ring centered on EarthGroup (alt 400 km) so it moves with Earth around the Sun
    this.issOrbitRing = createOrbitLine2(ISS_R * SCALE, 0x34d399, 2.5, 0.7, 140);
    this.lineMaterials.push(this.issOrbitRing.material);
    this.earthGroup.add(this.issOrbitRing);

    // ISS 3D marker
    this.issGroup = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(8, 8, 28, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    this.issGroup.add(body);

    // Solar panels
    const panelGeo = new THREE.BoxGeometry(45, 1, 14);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.6, roughness: 0.2 });
    const panels = new THREE.Mesh(panelGeo, panelMat);
    this.issGroup.add(panels);

    this.scene.add(this.issGroup);
  }

  initGrid() {
    this.gridGroup = new THREE.Group();
    this.scene.add(this.gridGroup);

    // Faint solar-system ecliptic reference rings around the Sun
    const rings = [
      { r: 50000, col: 0x475569, op: 0.08 },
      { r: 100000, col: 0x475569, op: 0.08 },
      { r: 150000, col: 0x334155, op: 0.06 },
    ];

    for (const r of rings) {
      const ring = createOrbitLine2(r.r, r.col, 1.1, r.op, 128);
      this.lineMaterials.push(ring.material);
      this.gridGroup.add(ring);
    }

    // Cross axes
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-450000, 0, 0), new THREE.Vector3(450000, 0, 0),
      new THREE.Vector3(0, 0, -450000), new THREE.Vector3(0, 0, 450000),
    ]);
    const axisMat = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.22, depthTest: false });
    const axisLines = new THREE.LineSegments(axisGeo, axisMat);
    axisLines.renderOrder = 980;
    this.gridGroup.add(axisLines);
  }

  initVesselMarker() {
    this.vesselGroup = new THREE.Group();

    // Stylized 3D spacecraft mesh
    const bodyGeo = new THREE.CylinderGeometry(5, 7, 30, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 15;
    this.vesselGroup.add(body);

    const noseGeo = new THREE.ConeGeometry(5, 12, 16);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.y = 36;
    this.vesselGroup.add(nose);

    // Wings
    const finGeo = new THREE.BoxGeometry(22, 1.5, 6);
    const finMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 });
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.y = 8;
    this.vesselGroup.add(fin);

    // Attitude direction cone / beam
    const beamGeo = new THREE.ConeGeometry(3, 20, 8);
    beamGeo.translate(0, 10, 0);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75, depthTest: false });
    this.vesselBeam = new THREE.Mesh(beamGeo, beamMat);
    this.vesselBeam.renderOrder = 999;
    this.vesselGroup.add(this.vesselBeam);

    this.scene.add(this.vesselGroup);

    // Pool for separated stages & persistent space vessels
    this.othersRoot = new THREE.Group();
    this.scene.add(this.othersRoot);
  }

  ensureOtherSlot(idx) {
    while (this.otherPool.length <= idx) {
      const group = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff7a3a, roughness: 0.35, metalness: 0.4, depthTest: false });
      const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.8, 26, 12), bodyMat);
      bodyMesh.position.y = 13;
      bodyMesh.renderOrder = 999;
      group.add(bodyMesh);

      const noseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, depthTest: false });
      const noseMesh = new THREE.Mesh(new THREE.ConeGeometry(4.5, 9, 12), noseMat);
      noseMesh.position.y = 30.5;
      noseMesh.renderOrder = 999;
      group.add(noseMesh);

      group.renderOrder = 999;
      group.visible = false;
      this.othersRoot.add(group);

      const orbitGeo = new LineGeometry();
      orbitGeo.setPositions([0, 0, 0, 1, 0, 1]);
      const orbitMat = new LineMaterial({
        color: 0xff7a3a,
        linewidth: 2.2,
        transparent: true,
        opacity: 0.72,
        depthTest: false,
        depthWrite: false,
      });
      orbitMat.resolution.set(innerWidth, innerHeight);
      this.lineMaterials.push(orbitMat);
      const orbitLine = new Line2(orbitGeo, orbitMat);
      orbitLine.frustumCulled = false;
      orbitLine.renderOrder = 994;
      orbitLine.visible = false;
      this.othersRoot.add(orbitLine);

      this.otherPool.push({ group, bodyMat, noseMesh, orbitGeo, orbitMat, orbitLine });
    }
    return this.otherPool[idx];
  }

  initTrajectoryObjects() {
    // 1. Predicted Trajectory Core Line2 (depthTest: false ensures 100% visibility from ANY angle)
    this.trajGeo = new LineGeometry();
    this.trajGeo.setPositions([0, 0, 0, 1, 0, 1]);
    this.trajGeo.setColors([1, 1, 1, 1, 1, 1]);

    this.trajMat = new LineMaterial({
      linewidth: 3.8, // crisp thick line on screen
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      depthWrite: false,
    });
    this.trajMat.resolution.set(innerWidth, innerHeight);
    this.lineMaterials.push(this.trajMat);

    this.trajLine = new Line2(this.trajGeo, this.trajMat);
    this.trajLine.frustumCulled = false;
    this.trajLine.renderOrder = 999;
    this.scene.add(this.trajLine);

    // Glowing bloom halo around the predicted path
    this.trajGlowMat = new LineMaterial({
      linewidth: 8.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });
    this.trajGlowMat.resolution.set(innerWidth, innerHeight);
    this.lineMaterials.push(this.trajGlowMat);

    this.trajGlowLine = new Line2(this.trajGeo, this.trajGlowMat);
    this.trajGlowLine.frustumCulled = false;
    this.trajGlowLine.renderOrder = 998;
    this.scene.add(this.trajGlowLine);

    // 2. Full Closed Keplerian Orbit Ellipse Line2
    this.keplerGeo = new LineGeometry();
    this.keplerGeo.setPositions([0, 0, 0, 1, 0, 1]);

    this.keplerMat = new LineMaterial({
      color: 0x38bdf8,
      linewidth: 3.2,
      transparent: true,
      opacity: 0.85,
      depthTest: false,
      depthWrite: false,
    });
    this.keplerMat.resolution.set(innerWidth, innerHeight);
    this.lineMaterials.push(this.keplerMat);

    this.keplerLine = new Line2(this.keplerGeo, this.keplerMat);
    this.keplerLine.frustumCulled = false;
    this.keplerLine.renderOrder = 996;
    this.keplerLine.visible = false;
    this.scene.add(this.keplerLine);

    // Glow for closed Keplerian ellipse
    this.keplerGlowMat = new LineMaterial({
      color: 0x38bdf8,
      linewidth: 7.0,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });
    this.keplerGlowMat.resolution.set(innerWidth, innerHeight);
    this.lineMaterials.push(this.keplerGlowMat);

    this.keplerGlowLine = new Line2(this.keplerGeo, this.keplerGlowMat);
    this.keplerGlowLine.frustumCulled = false;
    this.keplerGlowLine.renderOrder = 995;
    this.keplerGlowLine.visible = false;
    this.scene.add(this.keplerGlowLine);

    // 3. Impact 3D Marker (depthTest: false so it's never occluded on horizon)
    const impGeo = new THREE.RingGeometry(8, 24, 20);
    impGeo.rotateX(-Math.PI / 2);
    const impMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, depthTest: false });
    this.impactMarker = new THREE.Mesh(impGeo, impMat);
    this.impactMarker.renderOrder = 999;
    this.impactMarker.visible = false;
    this.scene.add(this.impactMarker);
  }

  initEvents() {
    // Focus buttons click handling
    if (this.focusBar) {
      this.focusBar.querySelectorAll('.map-fbtn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const target = btn.dataset.focus;
          if (target) this.setFocus(target);
        });
      });
    }

    // Close button
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle(false);
      });
    }

    // Delete button in popup
    if (this.btnDeleteObj) {
      this.btnDeleteObj.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.selectedObjectId && this.onDeleteObject) {
          const idToDel = this.selectedObjectId;
          this.selectedObjectId = null;
          if (this.objPopup) this.objPopup.classList.add('hidden');
          if (this.focus === 'obj:' + idToDel || (idToDel === 'vessel' && this.focus === 'vessel')) {
            this.setFocus('earth');
          }
          this.onDeleteObject(idToDel);
        }
      });
    }

    // Delegated click handler on object list in telemetry panel
    if (this.objListBox) {
      this.objListBox.addEventListener('click', (e) => {
        const delBtn = e.target.closest('[data-del-id]');
        if (delBtn) {
          e.stopPropagation();
          const delId = delBtn.dataset.delId;
          if (delId && this.onDeleteObject) {
            if (this.selectedObjectId === delId) {
              this.selectedObjectId = null;
              if (this.objPopup) this.objPopup.classList.add('hidden');
            }
            if (this.focus === 'obj:' + delId) this.setFocus('earth');
            this.onDeleteObject(delId);
          }
          return;
        }
        const item = e.target.closest('[data-obj-id]');
        if (item) {
          e.stopPropagation();
          const objId = item.dataset.objId;
          if (objId) {
            this.setFocus(objId === 'vessel' ? 'vessel' : 'obj:' + objId, true);
          }
        }
      });
    }

    // Canvas click to select target if clicking on a HUD badge pill or marker dot
    this.glCanvas.addEventListener('click', (e) => {
      const rect = this.glCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      let hit = null;
      // 1. Check exact badge pill bounding boxes first
      for (let i = this.hudTargets.length - 1; i >= 0; i--) {
        const t = this.hudTargets[i];
        const inPill = t.bx !== undefined && mx >= t.bx - 4 && mx <= t.bx + t.bw + 4 && my >= t.by - 4 && my <= t.by + t.bh + 4;
        if (inPill && t.focus) {
          hit = t;
          break;
        }
      }
      // 2. Fallback to marker dot radius
      if (!hit) {
        for (let i = this.hudTargets.length - 1; i >= 0; i--) {
          const t = this.hudTargets[i];
          const inDot = Math.hypot(mx - t.x, my - t.y) < 24;
          if (inDot && t.focus) {
            hit = t;
            break;
          }
        }
      }
      if (hit) {
        this.setFocus(hit.focus, true);
      }
    });

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    if (!this.visible) return;
    const w = innerWidth, h = innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.hudCanvas.width = w * dpr;
    this.hudCanvas.height = h * dpr;

    // Update screen resolution for all Line2 materials
    for (const m of this.lineMaterials) {
      if (m && m.resolution) m.resolution.set(w, h);
    }
  }

  toggle(on = !this.visible) {
    this.visible = on;
    this.container.classList.toggle('hidden', !on);
    this.legend.classList.toggle('hidden', !on);

    if (on) {
      this.onResize();
      this.zoomToTarget(true);
    } else {
      // release the map's full-screen drawing buffer while it is closed
      this.renderer.setSize(1, 1, false);
    }
  }

  cycleFocus() {
    const list = ['vessel', 'sun', 'mercury', 'venus', 'earth', 'iss', 'moon', ...NON_EARTH_BODIES.filter((b) => b !== 'mercury' && b !== 'venus')];
    const idx = (list.indexOf(this.focus) + 1) % list.length;
    this.setFocus(list[idx]);
  }

  setFocus(name, fromUserClick = false) {
    this.focus = name;
    if (this.focusBar) {
      this.focusBar.querySelectorAll('.map-fbtn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.focus === name);
      });
    }
    if (name && name.startsWith('obj:')) {
      this.selectedObjectId = name.slice(4);
    } else if (name === 'vessel' && fromUserClick && this.lastState && this.lastState.vessel && this.lastState.vessel.deletable) {
      this.selectedObjectId = 'vessel';
    } else {
      this.selectedObjectId = null;
    }
    this.updateObjectPopup(this.lastState);
    this.zoomToTarget(false);
  }

  zoomToTarget(instant = false) {
    const targetPos = this.getTargetWorldPos(this.focus);
    if (!targetPos) return;

    let dist = 1800;
    if (this.focus === 'sun') dist = 780000;
    else if (this.focus === 'earth') dist = 14000;
    else if (this.focus === 'moon') dist = 2600;
    else if (this.focus === 'iss') dist = 900;
    else if (BODIES[this.focus]) {
      const B = BODIES[this.focus];
      dist = Math.max(B.R * SCALE * 5.5, B.soi * SCALE * 1.25);
    } else if (this.focus && this.focus.startsWith('obj:')) {
      dist = 2200;
    } else if (this.focus === 'vessel') {
      const r = this.lastState && this.lastState.vessel ? Math.hypot(this.lastState.vessel.x, this.lastState.vessel.y) : R_E;
      dist = r > 2.5e6 ? 14000 : 2200;
    }

    const S = this.lastState;
    let parentName = 'sun';
    if (this.focus === 'vessel') {
      parentName = S && S.ref ? S.ref : 'earth';
    } else if (this.focus && this.focus.startsWith('obj:')) {
      const objId = this.focus.slice(4);
      const found = S && S.others ? S.others.find((o) => o.id === objId) : null;
      parentName = found && found.ref ? found.ref : 'earth';
    } else if (BODIES[this.focus] && BODIES[this.focus].parent) {
      parentName = BODIES[this.focus].parent;
    }
    const bodyCenter = this.focus === 'sun' ? new THREE.Vector3(0, 0, 0) : this.getTargetWorldPos(parentName);
    const isCraft = this.focus === 'vessel' || this.focus === 'iss' || (this.focus && this.focus.startsWith('obj:'));
    // Position camera toward the sunlit / parent-facing side of the planet
    const viewDir = isCraft
      ? targetPos.clone().sub(bodyCenter)
      : bodyCenter.clone().sub(targetPos);

    if (viewDir.lengthSq() < 100) {
      viewDir.set(0.15, 0.72, 0.68).normalize();
    } else {
      viewDir.normalize();
    }

    const camOffset = viewDir.clone().multiplyScalar(dist);
    camOffset.y += dist * (this.focus === 'sun' ? 0.62 : 0.42);
    camOffset.x += dist * 0.2;

    this.controls.target.copy(targetPos);
    this.camera.position.copy(targetPos).add(camOffset);
    this.controls.update();
  }

  getTargetWorldPos(focusName) {
    const S = this.lastState;
    const t = S ? S.t : 0;
    if (focusName === 'sun') return new THREE.Vector3(0, 0, 0);
    if (BODIES[focusName]) {
      const hp = helioPos(focusName, t);
      return to3D(hp.x, hp.y, hp.z);
    }
    const ep = helioPos('earth', t);
    if (focusName && focusName.startsWith('obj:') && S && S.others) {
      const objId = focusName.slice(4);
      const found = S.others.find((o) => o.id === objId);
      if (found) return to3D(found.x + ep.x, found.y + ep.y, found.z || 0);
    }
    if (focusName === 'iss' && S && S.iss) {
      return to3D(S.iss.x + ep.x, S.iss.y + ep.y, S.iss.z || 0);
    }
    if (focusName === 'vessel' && S && S.vessel) {
      return to3D(S.vessel.x + ep.x, S.vessel.y + ep.y, S.vessel.z || 0);
    }
    return to3D(ep.x, ep.y, ep.z);
  }

  draw(S) {
    if (!this.visible) return;
    this.lastState = S;

    const t = S.t;
    const ep = helioPos('earth', t);
    const earthV3 = to3D(ep.x, ep.y, ep.z);
    const mp = helioPos('moon', t);
    const moonV3 = to3D(mp.x, mp.y, mp.z);

    // Sun rotation & central light at (0, 0, 0)
    this.sunMesh.rotation.y = bodyAngle('sun', t);
    this.sunLight.position.set(0, 0, 0);
    if (this.asteroidBeltGroup) {
      this.asteroidBeltGroup.rotation.y = -t * 1.15e-5;
    }

    // Earth position (around Sun) & rotation
    this.earthGroup.position.copy(earthV3);
    if (this.earthAtmo.material.uniforms) {
      this.earthAtmo.material.uniforms.uSunDir.value.copy(earthV3).negate().normalize();
    }

    if (S.padAngle !== undefined) {
      this.earthMesh.rotation.y = S.padAngle;
      const pa = S.padAngle;
      const px = Math.sin(pa) * R_E, py = Math.cos(pa) * R_E;
      to3D(ep.x + px, ep.y + py, 0, this.padMarker.position);
      this.padMarker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to3D(px, py, 0).normalize());
    }

    // Moon position (around Earth) & rotation
    this.moonGroup.position.copy(moonV3);
    this.moonMesh.rotation.y = moonAngle(t);
    if (this.moonSOI) {
      this.moonSOI.visible = this.camera.position.distanceTo(moonV3) > MOON_SOI * SCALE * 1.4;
    }

    // Planets (around Sun) + Planetary Moons (around Mars, Jupiter, Saturn, Uranus, Neptune)
    const planetV3s = {};
    for (const name of NON_EARTH_BODIES) {
      const hp = helioPos(name, t);
      const pv3 = to3D(hp.x, hp.y, hp.z);
      planetV3s[name] = pv3;
      if (this.planetGroups[name]) {
        this.planetGroups[name].position.copy(pv3);
        this.planetMeshes[name].rotation.y = bodyAngle(name, t);
      }
      if (this.planetSOIs && this.planetSOIs[name]) {
        const B = BODIES[name];
        this.planetSOIs[name].visible = this.camera.position.distanceTo(pv3) > B.soi * SCALE * 1.4;
      }
    }

    // ISS position (around Earth)
    let issV3 = null;
    if (S.iss) {
      issV3 = to3D(S.iss.x + ep.x, S.iss.y + ep.y, S.iss.z || 0);
      this.issGroup.position.copy(issV3);
      this.issGroup.visible = true;
      this.issGroup.lookAt(earthV3);
    } else {
      this.issGroup.visible = false;
    }

    // Vessel position & orientation
    const v = S.vessel;
    const vPos3D = to3D(v.x + ep.x, v.y + ep.y, v.z || 0);
    this.vesselGroup.position.copy(vPos3D);

    // Adaptive scale so the rocket remains easily visible without dwarfing the planet
    const camDist = this.camera.position.distanceTo(vPos3D);
    const s = Math.max(0.6, Math.min(camDist * 0.0006, 16));
    this.vesselGroup.scale.set(s, s, s);

    // Attitude orientation
    if (S.beta !== undefined) {
      this.vesselGroup.rotation.set(0, -S.beta, 0);
    }

    // Separated stages & persistent space objects (3D meshes + orbital rings)
    const others = S.others || [];
    const tmpV3 = new THREE.Vector3();
    for (let i = 0; i < others.length; i++) {
      const o = others[i];
      const slot = this.ensureOtherSlot(i);
      const oPos = to3D(o.x + ep.x, o.y + ep.y, o.z || 0);
      slot.group.position.copy(oPos);
      const os = Math.max(0.55, Math.min(this.camera.position.distanceTo(oPos) * 0.00055, 14));
      slot.group.scale.set(os, os, os);
      if (o.beta !== undefined) slot.group.rotation.set(0, -o.beta, 0);
      const isSelected = this.selectedObjectId === o.id || this.focus === 'obj:' + o.id;
      slot.bodyMat.color.set(isSelected ? '#ffffff' : (o.color || '#ff7a3a'));
      slot.noseMesh.visible = o.kind === 'vessel';
      slot.group.visible = true;

      // Closed Keplerian orbit ring for this space object
      const oEl = o.el;
      const oRef = o.ref || 'earth';
      const refB = BODIES[oRef] || BODIES.earth;
      if (oEl && isFinite(oEl.a) && oEl.a > 0 && oEl.e < 1.0 && oEl.ap > refB.R + 8000) {
        const hp = helioPos(oRef, S.t);
        const segs = 240;
        const pts = [];
        const sq = Math.sqrt(Math.max(0, 1 - oEl.e * oEl.e));
        for (let k = 0; k <= segs; k++) {
          const E = (k / segs) * Math.PI * 2;
          const cosE = Math.cos(E), sinE = Math.sin(E);
          const r = oEl.a * (1 - oEl.e * cosE);
          const nu = Math.atan2(sq * sinE, cosE - oEl.e);
          const th = (oEl.argPe || 0) + nu;
          to3D(hp.x + r * Math.sin(th), hp.y + r * Math.cos(th), hp.z || 0, tmpV3);
          pts.push(tmpV3.x, tmpV3.y, tmpV3.z);
        }
        slot.orbitGeo.setPositions(pts);
        slot.orbitMat.color.set(isSelected ? '#38bdf8' : (o.color || '#ff7a3a'));
        slot.orbitMat.linewidth = isSelected ? 3.2 : 2.0;
        slot.orbitMat.opacity = isSelected ? 0.92 : 0.62;
        slot.orbitLine.visible = true;
      } else {
        slot.orbitLine.visible = false;
      }
    }
    for (let i = others.length; i < this.otherPool.length; i++) {
      this.otherPool[i].group.visible = false;
      this.otherPool[i].orbitLine.visible = false;
    }

    // Update 3D Orbits: Full Closed Keplerian Ellipse + Numerical Predicted Trajectory
    this.maxOrbitExtent = 1e6;
    this.updateKeplerOrbit(S, ep);
    this.updateTrajectory(S, ep);

    // Dynamic Camera Focus Tracking
    const curTargetPos = this.getTargetWorldPos(this.focus);
    const deltaTarget = curTargetPos.clone().sub(this.controls.target);
    this.controls.target.add(deltaTarget);
    this.camera.position.add(deltaTarget);
    this.controls.update();

    // Expand camera frustum dynamically so orbits of ANY length are never clipped
    const camDistTarget = this.camera.position.distanceTo(this.controls.target);
    const camDistOrigin = this.camera.position.length();
    const neededFar = Math.max(1e9, camDistTarget * 50, camDistOrigin * 20, (this.maxOrbitExtent || 0) * 4);
    const neededNear = Math.max(2, Math.min(2000, camDistTarget * 1e-4));
    if (Math.abs(this.camera.far - neededFar) > neededFar * 0.05 || Math.abs(this.camera.near - neededNear) > neededNear * 0.05) {
      this.camera.near = neededNear;
      this.camera.far = neededFar;
      this.camera.updateProjectionMatrix();
    }
    if (this.starfield) {
      this.starfield.position.copy(this.camera.position);
      this.starfield.scale.setScalar(Math.max(1, camDistTarget / 1e5));
    }
    if (this.camLight) {
      this.camLight.position.copy(this.camera.position);
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);

    // Render 2D Screen-space HUD & Overlays
    this.renderHUD(S, vPos3D, earthV3, moonV3, issV3, planetV3s, ep);
  }

  updateKeplerOrbit(S, ep) {
    const el = S.el;
    if (!el || !el.pe || !isFinite(el.pe)) {
      this.keplerLine.visible = false;
      this.keplerGlowLine.visible = false;
      return;
    }

    const refB = BODIES[S.ref] || BODIES.earth;
    const R = refB.R;
    // Show orbit when apoapsis is above surface (or on hyperbolic escape)
    if (el.e < 1.0 && (!isFinite(el.a) || el.ap < R + 5000)) {
      this.keplerLine.visible = false;
      this.keplerGlowLine.visible = false;
      return;
    }

    const hp = helioPos(S.ref || 'earth', S.t);
    const count = 360;
    const pts = [];
    const v3 = new THREE.Vector3();

    if (el.e < 1.0) {
      // Sample uniformly in Eccentric Anomaly E so even extreme elongated ellipses (e -> 1) are smooth at apoapsis
      const sq = Math.sqrt(Math.max(0, 1 - el.e * el.e));
      for (let i = 0; i <= count; i++) {
        const E = (i / count) * Math.PI * 2;
        const cosE = Math.cos(E), sinE = Math.sin(E);
        const r = el.a * (1 - el.e * cosE);
        const nu = Math.atan2(sq * sinE, cosE - el.e);
        const th = el.argPe + nu;
        const sx = hp.x + r * Math.sin(th);
        const sy = hp.y + r * Math.cos(th);
        const sz = hp.z || 0;

        to3D(sx, sy, sz, v3);
        pts.push(v3.x, v3.y, v3.z);
        const d3 = v3.length();
        if (d3 > this.maxOrbitExtent) this.maxOrbitExtent = d3;
      }
    } else {
      // Hyperbolic / Parabolic escape orbit (e >= 1): draw full escape branch out to ultra-far distance
      const e = Math.max(1.0001, el.e);
      const p = el.pe * (1 + e);
      const vDist = S.vessel ? Math.hypot(S.vessel.x, S.vessel.y) : R;
      const maxR = Math.max(5e10, vDist * 40);
      const cosNuMin = Math.max(-1 + 1e-6, Math.min(1, (p / maxR - 1) / e));
      const nuMax = Math.acos(cosNuMin);
      const dirSign = (el.h !== undefined && el.h > 0) ? -1 : 1;
      const nuStart = el.pe < R ? Math.max(-nuMax, el.nu || 0) : -nuMax * 0.35;
      for (let i = 0; i <= count; i++) {
        const u = i / count;
        // Concentrate points near periapsis curve and stretch smoothly to maxR
        const s = u < 0.5 ? 0.5 * Math.pow(u * 2, 1.5) : 1 - 0.5 * Math.pow((1 - u) * 2, 2.2);
        const nu = (nuStart + (nuMax - nuStart) * s) * dirSign;
        const denom = Math.max(1e-6, 1 + e * Math.cos(nu));
        const r = Math.min(maxR, p / denom);
        const th = el.argPe + nu;
        const sx = hp.x + r * Math.sin(th);
        const sy = hp.y + r * Math.cos(th);
        const sz = hp.z || 0;

        to3D(sx, sy, sz, v3);
        pts.push(v3.x, v3.y, v3.z);
        const d3 = v3.length();
        if (d3 > this.maxOrbitExtent) this.maxOrbitExtent = d3;
      }
    }

    this.keplerGeo.setPositions(pts);

    // Color based on reference body
    const mainColor = S.ref === 'earth' ? 0x38bdf8 : (refB.hex || 0xfbbf24);
    this.keplerMat.color.setHex(mainColor);
    this.keplerGlowMat.color.setHex(mainColor);

    // If periapsis is below surface (suborbital on solid body), make line dimmer
    const isSuborbital = !refB.gasGiant && el.pe < R;
    this.keplerMat.opacity = isSuborbital ? 0.45 : 0.85;
    this.keplerGlowMat.opacity = isSuborbital ? 0.15 : 0.35;

    this.keplerLine.visible = true;
    this.keplerGlowLine.visible = true;
  }

  updateTrajectory(S, ep) {
    if (!S.pred || !S.pred.pts || S.pred.pts.length < 2) {
      this.trajLine.visible = false;
      this.trajGlowLine.visible = false;
      this.impactMarker.visible = false;
      return;
    }

    const pts = S.pred.pts;
    const count = Math.min(pts.length, 4000);
    const pos = [];
    const col = [];
    const v3 = new THREE.Vector3();

    const curHelio = {};
    for (const k of Object.keys(BODIES)) {
      curHelio[k] = helioPos(k, S.t);
    }

    for (let i = 0; i < count; i++) {
      const p = pts[i];
      let x = p.x + ep.x, y = p.y + ep.y, z = p.z || 0;
      if (p.ref && p.ref !== 'earth' && p.mx !== undefined && curHelio[p.ref]) {
        const ch = curHelio[p.ref];
        x = p.x - p.mx + ch.x;
        y = p.y - p.my + ch.y;
        z = (p.z || 0) - (p.mz || 0) + (ch.z || 0);
      }
      to3D(x, y, z, v3);
      pos.push(v3.x, v3.y, v3.z);
      const d3 = v3.length();
      if (d3 > this.maxOrbitExtent) this.maxOrbitExtent = d3;

      if (p.ref === 'mars' || p.ref === 'phobos' || p.ref === 'deimos') {
        col.push(0.98, 0.45, 0.09);
      } else if (p.ref === 'venus' || p.ref === 'sun') {
        col.push(0.98, 0.82, 0.22);
      } else if (p.ref === 'mercury') {
        col.push(0.85, 0.88, 0.94);
      } else if (p.ref === 'moon') {
        col.push(0.98, 0.75, 0.14);
      } else {
        // Electric Blue / Cyan inside Earth SOI
        col.push(0.22, 0.74, 0.97);
      }
    }

    this.trajGeo.setPositions(pos);
    this.trajGeo.setColors(col);

    this.trajLine.visible = true;
    this.trajGlowLine.visible = true;

    // Impact marker (depthTest: false ensures it is never occluded)
    if (S.pred.impact) {
      const lastP = pts[pts.length - 1];
      let x = lastP.x + ep.x, y = lastP.y + ep.y, z = lastP.z || 0;
      const impBody = S.pred.impact.body || 'earth';
      if (impBody !== 'earth' && lastP.mx !== undefined && curHelio[impBody]) {
        const ch = curHelio[impBody];
        x = lastP.x - lastP.mx + ch.x;
        y = lastP.y - lastP.my + ch.y;
      }
      to3D(x, y, z, this.impactMarker.position);
      const center = curHelio[impBody]
        ? to3D(curHelio[impBody].x, curHelio[impBody].y, curHelio[impBody].z)
        : to3D(ep.x, ep.y, ep.z);
      this.impactMarker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.impactMarker.position.clone().sub(center).normalize());
      this.impactMarker.visible = true;
    } else {
      this.impactMarker.visible = false;
    }
  }

  projectToScreen(vec3, W, H) {
    const v = vec3.clone().project(this.camera);
    if (v.z > 1.0) return null; // Behind camera
    return {
      x: (v.x * 0.5 + 0.5) * W,
      y: (-(v.y * 0.5) + 0.5) * H,
    };
  }

  renderHUD(S, vPos3D, earthV3, moonV3, issV3, planetV3s = {}, ep = { x: 0, y: 0, z: 0 }) {
    const cv = this.hudCanvas;
    const ctx = this.hudCtx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = innerWidth, H = innerHeight;

    if (cv.width !== W * dpr || cv.height !== H * dpr) {
      cv.width = W * dpr;
      cv.height = H * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    this.hudTargets = [];

    // Sun badge at (0, 0, 0)
    const sunP = this.projectToScreen(new THREE.Vector3(0, 0, 0), W, H);
    if (sunP) {
      const br = this.drawBadge(ctx, sunP.x, sunP.y, `☀️ ${BODIES.sun.label}`, '#fde047', this.focus === 'sun');
      this.hudTargets.push({ x: sunP.x, y: sunP.y, ...br, focus: 'sun' });
    }

    // Earth badge
    const earthP = this.projectToScreen(earthV3, W, H);
    if (earthP) {
      const br = this.drawBadge(ctx, earthP.x, earthP.y, `🌍 ${BODIES.earth.label}`, '#38bdf8', this.focus === 'earth');
      this.hudTargets.push({ x: earthP.x, y: earthP.y, ...br, focus: 'earth' });
    }

    // Moon badge
    const moonP = this.projectToScreen(moonV3, W, H);
    if (moonP) {
      const br = this.drawBadge(ctx, moonP.x, moonP.y, `🌕 ${BODIES.moon.label}`, '#f1f5f9', this.focus === 'moon');
      this.hudTargets.push({ x: moonP.x, y: moonP.y, ...br, focus: 'moon' });
    }

    // Planets & Moons HUD badges
    const focusParent = BODIES[this.focus] ? BODIES[this.focus].parent : null;
    for (const name of NON_EARTH_BODIES) {
      const B = BODIES[name];
      const isMoon = B.parent && B.parent !== 'sun';
      if (isMoon) {
        const parentV3 = planetV3s[B.parent];
        const parentB = BODIES[B.parent];
        const camToParent = parentV3 ? this.camera.position.distanceTo(parentV3) : Infinity;
        const showMoon = this.focus === name || this.focus === B.parent || focusParent === B.parent || camToParent < (parentB ? parentB.soi * SCALE * 3.2 : 45000);
        if (!showMoon) continue;
      }
      const pv3 = planetV3s[name];
      if (!pv3) continue;
      const pp = this.projectToScreen(pv3, W, H);
      if (pp) {
        const br = this.drawBadge(ctx, pp.x, pp.y, `${B.icon} ${B.label}`, B.color, this.focus === name);
        this.hudTargets.push({ x: pp.x, y: pp.y, ...br, focus: name });
      }
    }

    // Asteroid Belt label between Mars and Jupiter
    const beltAngle = (S.t || 0) * 1.15e-5 + 0.85;
    const beltR = ((ASTEROID_BELT_INNER + ASTEROID_BELT_OUTER) * 0.5) * SCALE;
    const beltV3 = new THREE.Vector3(Math.sin(beltAngle) * beltR, 0, Math.cos(beltAngle) * beltR);
    const beltP = this.projectToScreen(beltV3, W, H);
    if (beltP) {
      this.drawBadge(ctx, beltP.x, beltP.y, tr('🪨 Vành đai đá (Tiểu hành tinh)', '🪨 Asteroid Belt'), '#d6d3d1', false);
    }

    if (issV3) {
      const issP = this.projectToScreen(issV3, W, H);
      if (issP) {
        const br = this.drawBadge(ctx, issP.x, issP.y, '🛰️ ISS', '#34d399', this.focus === 'iss');
        this.hudTargets.push({ x: issP.x, y: issP.y, ...br, focus: 'iss' });
      }
    }

    // Separated stages & persistent space objects badges
    for (const o of S.others || []) {
      const oV3 = to3D(o.x + ep.x, o.y + ep.y, o.z || 0);
      const op = this.projectToScreen(oV3, W, H);
      if (op) {
        const fKey = 'obj:' + o.id;
        const isFocused = this.focus === fKey || this.selectedObjectId === o.id;
        const oAltKm = o.alt !== undefined ? `${(o.alt / 1000).toFixed(1)} km` : null;
        const icon = o.kind === 'vessel' ? '🚀' : '🛰️';
        const br = this.drawBadge(ctx, op.x, op.y, `${icon} ${o.name}`, o.color || '#ff7a3a', isFocused, oAltKm, true);
        this.hudTargets.push({
          x: op.x,
          y: op.y,
          ...br,
          focus: fKey,
          objId: o.id,
          deletable: !!o.deletable,
        });
      }
    }

    const vesselP = this.projectToScreen(vPos3D, W, H);
    if (vesselP) {
      const vAltKm = S.vessel.alt ? (S.vessel.alt / 1000).toFixed(1) : null;
      const sub = vAltKm ? `${vAltKm} km` : null;
      const br = this.drawBadge(ctx, vesselP.x, vesselP.y, '🚀 ' + (S.name || 'Tàu vũ trụ'), '#38bdf8', this.focus === 'vessel', sub, true);
      this.hudTargets.push({
        x: vesselP.x,
        y: vesselP.y,
        ...br,
        focus: 'vessel',
        objId: 'vessel',
        deletable: !!(S.vessel && S.vessel.deletable),
      });
    }

    // Apoapsis & Periapsis Badges (show once in flight/orbit)
    const inFlight = S.vessel && (S.vessel.alt > 3000 || S.vessel.speedOrb > 1000);
    if (inFlight) {
      for (const m of S.markers || []) {
        const mPos = to3D(m.x + ep.x, m.y + ep.y, m.z || 0);
        const mp = this.projectToScreen(mPos, W, H);
        if (mp) {
          this.drawBadge(ctx, mp.x, mp.y, m.text, m.color, false);
        }
      }
    }

    // Impact Badge
    if (S.pred && S.pred.impact && this.impactMarker.visible) {
      const impP = this.projectToScreen(this.impactMarker.position, W, H);
      if (impP) {
        const impLabel = (BODIES[S.pred.impact.body] || BODIES.earth).label;
        this.drawBadge(ctx, impP.x, impP.y, '⚠️ Va chạm (' + impLabel + ')', '#ef4444', false);
      }
    }

    // Telemetry Panel & Selected Space Object Popup Update
    this.updateTelemetryCard(S);
    this.updateObjectPopup(S);
  }

  drawBadge(ctx, x, y, text, color, active = false, subtitle = null, avoidOverlap = false) {
    ctx.save();
    ctx.font = '600 12px "Be Vietnam Pro", sans-serif';

    const textWidth = ctx.measureText(text).width;
    const subWidth = subtitle ? ctx.measureText(subtitle).width : 0;
    const badgeW = Math.max(textWidth, subWidth) + 20;
    const badgeH = subtitle ? 34 : 22;

    let bx = x + 14;
    let by = y - badgeH / 2;

    if (avoidOverlap && this.hudTargets && this.hudTargets.length) {
      for (let pass = 0; pass < 8; pass++) {
        const hit = this.hudTargets.find(
          (t) =>
            t.bx !== undefined &&
            bx < t.bx + t.bw + 4 &&
            bx + badgeW + 4 > t.bx &&
            by < t.by + t.bh + 4 &&
            by + badgeH + 4 > t.by
        );
        if (!hit) break;
        by = hit.by + hit.bh + 5;
      }
    }

    const cy = by + badgeH / 2;

    // Leader line from target point to badge
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = active ? '#ffffff' : color;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(bx - 3, cy);
    ctx.stroke();

    // Badge Background Pill
    ctx.fillStyle = active ? 'rgba(15, 23, 42, 0.92)' : 'rgba(10, 15, 28, 0.82)';
    ctx.strokeStyle = active ? '#38bdf8' : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = active ? 1.5 : 1;
    ctx.shadowColor = active ? color : 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = active ? 12 : 6;

    ctx.beginPath();
    ctx.roundRect(bx, by, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Text Label
    ctx.fillStyle = active ? '#ffffff' : color;
    ctx.fillText(text, bx + 10, by + (subtitle ? 15 : 15));

    if (subtitle) {
      ctx.font = '500 10.5px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(subtitle, bx + 10, by + 28);
    }

    ctx.restore();
    return { bx, by, bw: badgeW, bh: badgeH };
  }

  updateObjectPopup(S) {
    if (!this.objPopup) return;
    if (!S || !this.selectedObjectId) {
      this.objPopup.classList.add('hidden');
      return;
    }
    let name = '';
    let meta = '';
    if (this.selectedObjectId === 'vessel') {
      if (!S.vessel || !S.vessel.deletable) {
        this.objPopup.classList.add('hidden');
        return;
      }
      const refB = BODIES[S.ref] || BODIES.earth;
      name = '🚀 ' + tr('Tàu hiện tại', 'Current Craft');
      meta = `${tr('Quanh', 'Orbiting')} ${refB.label} · ${tr('Độ cao', 'Alt')} ${fmt((S.vessel.alt || 0) / 1000, 1)} km · ${fmt(S.vessel.speedOrb || 0, 0)} m/s`;
    } else {
      const found = (S.others || []).find((o) => o.id === this.selectedObjectId);
      if (!found) {
        this.selectedObjectId = null;
        this.objPopup.classList.add('hidden');
        return;
      }
      const refB = BODIES[found.ref] || BODIES.earth;
      const icon = found.kind === 'vessel' ? '🚀' : '🛰️';
      name = `${icon} ${found.name}`;
      meta = `${tr('Quỹ đạo', 'Orbit')} ${refB.label} · ${tr('Độ cao', 'Alt')} ${fmt((found.alt || 0) / 1000, 1)} km · ${fmt(found.speedOrb || 0, 0)} m/s`;
    }
    if (this.mopName) this.mopName.textContent = name;
    if (this.mopMeta) this.mopMeta.textContent = meta;
    this.objPopup.classList.remove('hidden');
  }

  updateTelemetryCard(S) {
    if (!this.telemetryBox) return;
    const P = S.vessel;
    const el = S.el;
    const pred = S.pred;
    const refB = BODIES[S.ref] || BODIES.earth;

    const rows = [
      { label: tr('Thân chủ', 'Reference Body'), val: refB.label },
      { label: tr('Độ cao', 'Altitude'), val: P.alt !== undefined ? fmt(P.alt / 1000, 1) + ' km' : '—' },
      { label: tr('Vận tốc QĐ', 'Orbital Speed'), val: P.speedOrb !== undefined ? fmt(P.speedOrb, 0) + ' m/s' : '—' },
    ];

    if (el) {
      if (el.e < 1) {
        const R = refB.R;
        rows.push({ label: tr('Viễn điểm (Ap)', 'Apoapsis (Ap)'), val: fmt((el.ap - R) / 1000, 0) + ' km' });
        rows.push({ label: tr('Cận điểm (Pe)', 'Periapsis (Pe)'), val: fmt((el.pe - R) / 1000, 0) + ' km' });
        rows.push({ label: tr('Độ dẹt (e)', 'Eccentricity (e)'), val: el.e.toFixed(4) });
        if (el.period && isFinite(el.period)) {
          const min = Math.floor(el.period / 60);
          rows.push({ label: tr('Chu kỳ', 'Period'), val: min >= 60 ? (min / 60).toFixed(1) + tr(' giờ', ' hr') : min + tr(' phút', ' min') });
        }
      } else {
        rows.push({ label: tr('Quỹ đạo', 'Trajectory'), val: tr('Thoát ly (Hyperbolic)', 'Escape (Hyperbolic)') });
        rows.push({ label: tr('Độ dẹt (e)', 'Eccentricity (e)'), val: el.e.toFixed(3) });
      }
    }

    if (pred && pred.bodyCA && S.ref === 'earth') {
      for (const name of ['moon', ...NON_EARTH_BODIES]) {
        const ca = pred.bodyCA[name];
        const B = BODIES[name];
        if (ca && B && ca.d < B.soi * 3) {
          rows.push({ label: tr('Tiếp cận ', 'Closest ') + B.label, val: fmt((ca.d - B.R) / 1000, 0) + ' km' });
        }
      }
    }

    if (pred && pred.targetCA && pred.targetCA.d < 1e7 && S.iss) {
      rows.push({ label: tr('Tiếp cận ISS', 'ISS Approach'), val: fmt(pred.targetCA.d / 1000, 1) + ' km' });
    }

    let focusDisplay = this.focus;
    if (this.focus === 'vessel') focusDisplay = tr('Tàu vũ trụ', 'Spacecraft');
    else if (this.focus === 'iss') focusDisplay = 'ISS';
    else if (BODIES[this.focus]) {
      const fB = BODIES[this.focus];
      const pB = fB.parent && fB.parent !== 'sun' ? BODIES[fB.parent] : null;
      focusDisplay = pB ? `${fB.label} (${pB.label})` : fB.label;
    }
    if (this.focus && this.focus.startsWith('obj:')) {
      const fObj = (S.others || []).find((o) => 'obj:' + o.id === this.focus);
      if (fObj) focusDisplay = fObj.name;
    }
    rows.push({ label: tr('Tâm quan sát', 'Camera Focus'), val: focusDisplay });

    let html = '';
    for (const r of rows) {
      html += `<div class="tel-row"><span>${r.label}</span><b>${r.val}</b></div>`;
    }
    this.telemetryBox.innerHTML = html;

    // Render list of persistent/active space objects in the telemetry card
    if (this.objListBox) {
      const others = S.others || [];
      const sig = `${getLang()}|` + others.map((o) => `${o.id}:${o.name}:${Math.round((o.alt || 0) / 5000)}:${this.selectedObjectId === o.id ? 1 : 0}`).join('|');
      if (this._objListSig !== sig) {
        this._objListSig = sig;
        if (!others.length) {
          this.objListBox.innerHTML = '';
        } else {
          let listHtml = `<div class="mol-title">${tr('VẬT THỂ TRONG VŨ TRỤ', 'OBJECTS IN SPACE')} (${others.length})</div>`;
          for (const o of others) {
            const sel = this.selectedObjectId === o.id || this.focus === 'obj:' + o.id;
            const icon = o.kind === 'vessel' ? '🚀' : '🛰️';
            const altStr = o.alt !== undefined ? `${fmt(o.alt / 1000, 0)} km` : '';
            listHtml += `<div class="map-obj-item ${sel ? 'active' : ''}" data-obj-id="${o.id}">
              <span class="moi-name">${icon} ${o.name}</span>
              <span class="moi-alt">${altStr}</span>
            </div>`;
          }
          this.objListBox.innerHTML = listHtml;
        }
      }
    }
  }
}
