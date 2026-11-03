// Procedural Earth seen from altitude, with atmosphere in-scattering, clouds, ocean glint
import * as THREE from 'three';
import { ATMOS_GLSL, PLANET_R } from './atmosphere.js';

export const NOISE_GLSL = /* glsl */`
vec3 hash33(vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p.zxy, p.yxz + 19.19);
  return fract(vec3(p.x * p.y, p.z * p.x, p.y * p.z)) * 2.0 - 1.0;
}
float gnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(mix(dot(hash33(i), f), dot(hash33(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                 mix(dot(hash33(i + vec3(0,1,0)), f - vec3(0,1,0)), dot(hash33(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
             mix(mix(dot(hash33(i + vec3(0,0,1)), f - vec3(0,0,1)), dot(hash33(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                 mix(dot(hash33(i + vec3(0,1,1)), f - vec3(0,1,1)), dot(hash33(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z) * 0.5 + 0.5;
}
float fbm3(vec3 p, int oct) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 10; i++) { if (i >= oct) break; s += a * gnoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s / (1.0 - pow(0.5, float(oct)));
}
`;

export function createEarth(sunDir) {
  const geo = new THREE.SphereGeometry(PLANET_R, 384, 192);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uSun: { value: sunDir.clone() },
      uCamRel: { value: new THREE.Vector3() },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uExposure: { value: 1 },
    },
    vertexShader: /* glsl */`
      varying vec3 vObj; varying vec3 vWorld; varying vec3 vNormalW;
      void main() {
        vObj = normalize(position);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      ${ATMOS_GLSL}
      ${NOISE_GLSL}
      uniform vec3 uSun; uniform vec3 uCamRel; uniform float uOpacity; uniform float uTime; uniform float uExposure;
      varying vec3 vObj; varying vec3 vWorld; varying vec3 vNormalW;
      void main() {
        vec3 n = normalize(vObj);
        vec3 N = normalize(vNormalW);

        // Domain-warped global continents + archipelagos all around the orbital track
        vec3 warp = vec3(
          fbm3(n * 2.4 + vec3(1.3, 4.7, 2.1), 4) - 0.5,
          fbm3(n * 2.4 + vec3(8.2, 2.9, 5.4), 4) - 0.5,
          fbm3(n * 2.4 + vec3(3.7, 7.1, 9.3), 4) - 0.5
        );
        vec3 nw = normalize(n + warp * 0.38);
        float cont = (fbm3(nw * 2.5 + vec3(4.0, 1.5, 2.8), 6) - 0.492) * 2.4;
        float subCont = (fbm3(nw * 6.5 + vec3(9.1, 3.4, 6.2), 5) - 0.495) * 0.95;
        float islands = (fbm3(n * 18.0 + vec3(2.3, 5.1, 7.7), 4) - 0.51) * 0.42;
        float globalH = cont + subCont + islands + 0.025;

        // Keep launchpad local coastline at n.x ≈ 0.004 near (0, 1, 0), blending smoothly into global continents
        float padDist2 = dot(n.xz, n.xz) + (1.0 - max(n.y, 0.0)) * 2.0;
        float padZone = exp(-padDist2 * 900.0);
        float padH = (fbm3(n * 3.2 + vec3(4.0), 6) - 0.5) * 0.4 - (n.x - 0.004) * 2.2;
        float h = mix(globalH, padH, padZone);

        float detail = fbm3(n * 75.0, 5);
        float micro = fbm3(n * 240.0, 4);
        vec3 col;
        float spec = 0.0;
        if (h < 0.0) {
          float depth = clamp(-h * 3.8, 0.0, 1.0);
          float shelf = exp(h * 26.0); // bright turquoise continental shelf near coastlines
          vec3 shallowCol = vec3(0.04, 0.42, 0.48);
          vec3 midOcean = vec3(0.02, 0.14, 0.28);
          vec3 deepOcean = vec3(0.008, 0.045, 0.13);
          col = mix(midOcean, deepOcean, smoothstep(0.15, 0.9, depth));
          col = mix(col, shallowCol, shelf * 0.75);
          spec = 1.0;
        } else {
          float elev = clamp(h * 1.9, 0.0, 1.0);
          float moisture = fbm3(nw * 4.2 + vec3(7.0, 2.0, 5.0), 5);
          float temp = 1.0 - smoothstep(0.25, 0.88, abs(n.z)) - elev * 0.45;

          // Vibrant biome palette: tropical/temperate forests, grasslands, savannas, deserts, rock, snow
          vec3 lushForest = vec3(0.09, 0.34, 0.09);
          vec3 grassland = vec3(0.22, 0.46, 0.14);
          vec3 savanna = vec3(0.48, 0.47, 0.20);
          vec3 desert = vec3(0.76, 0.60, 0.36);
          vec3 redArid = vec3(0.64, 0.38, 0.24);
          vec3 highland = vec3(0.36, 0.31, 0.25);
          vec3 snowPeak = vec3(0.92, 0.95, 0.98);

          vec3 veg = mix(lushForest, grassland, smoothstep(0.35, 0.68, fbm3(n * 14.0 + 2.0, 5)));
          vec3 arid = mix(desert, redArid, smoothstep(0.45, 0.72, fbm3(n * 11.0 + 9.0, 4)));
          float dryMask = smoothstep(0.44, 0.64, moisture);
          col = mix(veg, savanna, smoothstep(0.36, 0.52, moisture));
          col = mix(col, arid, dryMask);

          // Mountain ridges & rocky highlands
          float ridge = pow(1.0 - abs(fbm3(n * 22.0 + vec3(3.3), 5) * 2.0 - 1.0), 2.2);
          float mtnMask = smoothstep(0.18, 0.52, elev + ridge * 0.22);
          col = mix(col, highland, mtnMask * 0.82);

          // Snow caps on high mountain peaks and polar latitudes
          float snowMask = max(
            smoothstep(0.48, 0.72, elev + ridge * 0.25 - temp * 0.15),
            smoothstep(0.76, 0.88, abs(n.z) + (detail - 0.5) * 0.08)
          );
          col = mix(col, snowPeak, snowMask);

          // Major river networks cutting through lowlands
          float riverNoise = abs(fbm3(nw * 19.0 + vec3(6.1, 1.8, 4.4), 4) - 0.5);
          float river = (1.0 - smoothstep(0.002, 0.009, riverNoise)) * (1.0 - smoothstep(0.0, 0.35, elev)) * (1.0 - snowMask);
          col = mix(col, vec3(0.05, 0.28, 0.38), river * 0.85);

          // Fine terrain texture & coastal sandy beaches
          col *= 0.78 + 0.46 * (detail * 0.65 + micro * 0.35);
          vec3 beachCol = vec3(0.78, 0.70, 0.52);
          col = mix(beachCol, col, smoothstep(0.0, 0.018, h));

          // Topographic bump shading on land so mountain chains & valleys have crisp 3D relief from orbit
          float eps = 0.0008;
          float hx = fbm3((n + vec3(eps, 0.0, 0.0)) * 28.0, 5) - fbm3((n - vec3(eps, 0.0, 0.0)) * 28.0, 5);
          float hy = fbm3((n + vec3(0.0, eps, 0.0)) * 28.0, 5) - fbm3((n - vec3(0.0, eps, 0.0)) * 28.0, 5);
          vec3 bumpN = normalize(N + normalize(vec3(hx, hy, 0.0) + 1e-5) * length(vec2(hx, hy)) * 2.4 * (0.4 + elev));
          float relief = clamp(dot(bumpN, uSun) / max(dot(N, uSun), 0.12), 0.72, 1.32);
          col *= relief;
        }

        // Wispy dynamic cloud formations (semi-transparent so continents remain clearly visible underneath)
        vec3 cp = n * 6.5 + vec3(uTime * 0.0018, -uTime * 0.0007, uTime * 0.001);
        float cSwirl = fbm3(cp * 0.8 + vec3(5.2), 4) - 0.5;
        float c = fbm3(cp + cSwirl * 0.9, 6);
        float cloud = smoothstep(0.58, 0.78, c);

        vec3 V = normalize(vWorld - cameraPosition);
        float ndl = dot(N, uSun);
        float lit = smoothstep(-0.08, 0.22, ndl) * max(ndl, 0.0) * 0.88 + smoothstep(-0.12, 0.12, ndl) * 0.06;
        vec3 surf = col * lit * 1.75;
        if (spec > 0.0) {
          vec3 Rf = reflect(V, N);
          surf += vec3(1.0, 0.88, 0.65) * pow(max(dot(Rf, uSun), 0.0), 160.0) * 1.5 * (1.0 - cloud) * step(0.0, ndl);
        }
        surf = mix(surf, vec3(0.95, 0.97, 1.0) * lit * 1.45, cloud * 0.62);

        // City lights on night side
        float night = smoothstep(0.06, -0.14, ndl);
        if (h > 0.0) {
          float cityCluster = smoothstep(0.54, 0.72, fbm3(n * 22.0 + vec3(1.7), 4));
          float cityGrid = pow(fbm3(n * 280.0, 3), 5.0);
          surf += vec3(1.0, 0.68, 0.30) * night * cityCluster * cityGrid * 2.6 * (1.0 - cloud * 0.8);
        }

        // Atmosphere between camera and surface (clear nadir view over continents, glowing blue limb at horizon)
        float dist = length(vWorld - cameraPosition);
        vec3 tr;
        vec3 ins = atmosphere(V, uCamRel, uSun, 20.0, dist, 12, 6, tr);
        float viewNadir = clamp(dot(N, -V), 0.0, 1.0);
        float hazeWeight = mix(1.0, 0.34, pow(viewNadir, 0.65));
        float sunPath = 1.0 / max(ndl + 0.15, 0.06);
        vec3 sunT = exp((-kRlh * shRlh * sunPath - kMie * shMie * sunPath) * 0.65);
        vec3 transEff = mix(vec3(1.0), tr, hazeWeight);
        vec3 color = surf * sunT * transEff + ins * hazeWeight;
        gl_FragColor = vec4(color * uExposure, uOpacity);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  return mesh;
}

export function createStars() {
  const N = 9000;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const size = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = 1;
    // concentrate some stars in a milky-way band
    let x = s * Math.cos(a), y = u, z = s * Math.sin(a);
    if (i < N * 0.4) { const b = (Math.random() - 0.5) * 0.25; const t = Math.random() * Math.PI * 2; x = Math.cos(t); y = b + Math.sin(t) * 0.5; z = Math.sin(t) * 0.86; const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l; }
    pos.set([x * r, y * r, z * r], i * 3);
    const tcol = Math.random();
    const c = tcol < 0.2 ? [0.7, 0.8, 1.0] : tcol < 0.35 ? [1.0, 0.85, 0.7] : [1, 1, 1];
    const b = Math.pow(Math.random(), 6) * 6 + 0.2;
    col.set(c.map((v) => v * b), i * 3);
    size[i] = 1.0 + Math.pow(Math.random(), 8) * 3.0;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.BufferAttribute(size, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uFade: { value: 0 }, uPR: { value: 1 } },
    vertexShader: /* glsl */`
      attribute vec3 color; attribute float size; varying vec3 vC;
      uniform float uPR;
      void main() { vC = color; vec4 p = projectionMatrix * viewMatrix * vec4((modelMatrix * vec4(position * 1e7, 1.0)).xyz, 1.0); gl_Position = p.xyww; gl_PointSize = size * uPR * 1.5; }`,
    fragmentShader: /* glsl */`
      varying vec3 vC; uniform float uFade;
      void main() { vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(d)); gl_FragColor = vec4(vC * a * uFade, 1.0); }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  pts.renderOrder = -0.5;
  return pts;
}
