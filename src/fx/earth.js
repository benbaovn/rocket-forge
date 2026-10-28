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
        float h = fbm3(n * 3.2 + vec3(4.0), 7) - 0.5 - (n.x - 0.004) * 2.2 + 0.03;
        float detail = fbm3(n * 60.0, 5);
        vec3 col;
        float spec = 0.0;
        if (h < 0.0) {
          float depth = clamp(-h * 6.0, 0.0, 1.0);
          col = mix(vec3(0.03, 0.12, 0.16), vec3(0.004, 0.025, 0.07), depth);
          spec = 1.0;
        } else {
          float m = fbm3(n * 9.0 + 2.0, 6);
          vec3 green = mix(vec3(0.05, 0.10, 0.03), vec3(0.11, 0.14, 0.05), m);
          vec3 desert = vec3(0.32, 0.25, 0.15);
          col = mix(green, desert, smoothstep(0.55, 0.75, fbm3(n * 4.0 + 7.0, 4)));
          col *= 0.75 + 0.5 * detail;
          col = mix(vec3(0.55, 0.48, 0.38), col, smoothstep(0.0, 0.012, h)); // beaches
          col = mix(col, vec3(0.8), smoothstep(0.82, 0.9, abs(n.z)));
        }
        // clouds
        vec3 cp = n * 7.0 + vec3(uTime * 0.002, 0.0, uTime * 0.001);
        float c = fbm3(cp, 7);
        float cloud = smoothstep(0.52, 0.72, c);
        vec3 V = normalize(vWorld - cameraPosition);
        float ndl = dot(N, uSun);
        float lit = smoothstep(-0.08, 0.25, ndl) * max(ndl, 0.0) * 0.8 + smoothstep(-0.1, 0.1, ndl) * 0.05;
        vec3 surf = col * lit * 2.2;
        if (spec > 0.0) {
          vec3 Rf = reflect(V, N);
          surf += vec3(1.0, 0.85, 0.6) * pow(max(dot(Rf, uSun), 0.0), 180.0) * 4.0 * (1.0 - cloud) * step(0.0, ndl);
        }
        surf = mix(surf, vec3(1.0) * lit * 2.6, cloud * 0.92);
        // city lights on night side
        float night = smoothstep(0.05, -0.15, ndl);
        if (h > 0.0) surf += vec3(1.0, 0.6, 0.25) * night * pow(fbm3(n * 300.0, 3), 6.0) * 2.0 * (1.0 - cloud);
        // atmosphere between camera and surface
        float dist = length(vWorld - cameraPosition);
        vec3 tr;
        vec3 ins = atmosphere(V, uCamRel, uSun, 22.0, dist, 12, 6, tr);
        // sunlight reaching surface (approximate transmittance)
        float sunPath = 1.0 / max(ndl + 0.12, 0.05);
        vec3 sunT = exp(-kRlh * shRlh * sunPath - kMie * shMie * sunPath);
        vec3 color = surf * sunT * tr + ins;
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
