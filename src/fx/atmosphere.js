// Physically based single-scattering atmosphere (Rayleigh + Mie), GLSL + JS port
import * as THREE from 'three';

export const PLANET_R = 600e3;
export const ATMOS_R = 672e3;

export const ATMOS_GLSL = /* glsl */`
#define PI 3.141592653589793
#define R_PLANET 600e3
#define R_ATMOS 672e3
const vec3 kRlh = vec3(9.6e-6, 22.7e-6, 39.0e-6);
const float kMie = 34e-6;
const float shRlh = 6.2e3;
const float shMie = 1.0e3;
const float gMie = 0.758;

vec2 rsi(vec3 r0, vec3 rd, float sr) {
  float a = dot(rd, rd);
  float b = 2.0 * dot(rd, r0);
  float c = dot(r0, r0) - sr * sr;
  float d = b * b - 4.0 * a * c;
  if (d < 0.0) return vec2(1e5, -1e5);
  float s = sqrt(d);
  return vec2((-b - s) / (2.0 * a), (-b + s) / (2.0 * a));
}

// returns inscattered light; transmittance along view ray in 'trans'
vec3 atmosphere(vec3 r, vec3 r0, vec3 pSun, float iSun, float maxDist, int iSteps, int jSteps, out vec3 trans) {
  trans = vec3(1.0);
  vec2 p = rsi(r0, r, R_ATMOS);
  if (p.x > p.y) return vec3(0.0);
  p.x = max(p.x, 0.0);
  vec2 pg = rsi(r0, r, R_PLANET);
  if (pg.x < pg.y && pg.x > 0.0) p.y = min(p.y, pg.x);
  p.y = min(p.y, maxDist);
  float iStepSize = (p.y - p.x) / float(iSteps);
  float iTime = p.x;
  vec3 totalRlh = vec3(0.0), totalMie = vec3(0.0);
  float iOdRlh = 0.0, iOdMie = 0.0;
  float mu = dot(r, pSun);
  float mumu = mu * mu;
  float gg = gMie * gMie;
  float pRlh = 3.0 / (16.0 * PI) * (1.0 + mumu);
  float pMie = 3.0 / (8.0 * PI) * ((1.0 - gg) * (mumu + 1.0)) / (pow(max(1e-4, 1.0 + gg - 2.0 * mu * gMie), 1.5) * (2.0 + gg));
  for (int i = 0; i < 32; i++) {
    if (i >= iSteps) break;
    vec3 iPos = r0 + r * (iTime + iStepSize * 0.5);
    float iHeight = length(iPos) - R_PLANET;
    float odStepRlh = exp(-iHeight / shRlh) * iStepSize;
    float odStepMie = exp(-iHeight / shMie) * iStepSize;
    iOdRlh += odStepRlh; iOdMie += odStepMie;
    float jStepSize = rsi(iPos, pSun, R_ATMOS).y / float(jSteps);
    float jTime = 0.0, jOdRlh = 0.0, jOdMie = 0.0;
    // planet shadow
    vec2 sh = rsi(iPos, pSun, R_PLANET);
    bool shadowed = sh.x < sh.y && sh.x > 0.0;
    for (int j = 0; j < 16; j++) {
      if (j >= jSteps) break;
      vec3 jPos = iPos + pSun * (jTime + jStepSize * 0.5);
      float jHeight = length(jPos) - R_PLANET;
      jOdRlh += exp(-jHeight / shRlh) * jStepSize;
      jOdMie += exp(-jHeight / shMie) * jStepSize;
      jTime += jStepSize;
    }
    vec3 attn = exp(-(kMie * (iOdMie + jOdMie) + kRlh * (iOdRlh + jOdRlh)));
    if (shadowed) attn *= 0.0;
    totalRlh += odStepRlh * attn;
    totalMie += odStepMie * attn;
    iTime += iStepSize;
  }
  trans = exp(-(kMie * iOdMie + kRlh * iOdRlh));
  return iSun * (pRlh * kRlh * totalRlh + pMie * kMie * totalMie);
}
`;

// ---- JS port (used for fog color, sun light color, ambient) ----
const kR = [9.6e-6, 22.7e-6, 39.0e-6], kM = 34e-6, hR = 6.2e3, hM = 1.0e3, gM = 0.758;

function rsi(r0, rd, sr) {
  const b = 2 * (rd[0] * r0[0] + rd[1] * r0[1] + rd[2] * r0[2]);
  const c = r0[0] * r0[0] + r0[1] * r0[1] + r0[2] * r0[2] - sr * sr;
  const d = b * b - 4 * c;
  if (d < 0) return [1e5, -1e5];
  const s = Math.sqrt(d);
  return [(-b - s) / 2, (-b + s) / 2];
}

export function atmosphereJS(dir, altitude, sun, iSun = 22, steps = 12, jSteps = 6) {
  const r0 = [0, PLANET_R + altitude, 0];
  let p = rsi(r0, dir, ATMOS_R);
  if (p[0] > p[1]) return [0, 0, 0];
  p[0] = Math.max(p[0], 0);
  const pg = rsi(r0, dir, PLANET_R);
  if (pg[0] < pg[1] && pg[0] > 0) p[1] = Math.min(p[1], pg[0]);
  const ss = (p[1] - p[0]) / steps;
  let t = p[0];
  const tR = [0, 0, 0], tM = [0, 0, 0];
  let oR = 0, oM = 0;
  const mu = dir[0] * sun[0] + dir[1] * sun[1] + dir[2] * sun[2];
  const pR = 3 / (16 * Math.PI) * (1 + mu * mu);
  const gg = gM * gM;
  const pM = 3 / (8 * Math.PI) * ((1 - gg) * (mu * mu + 1)) / (Math.pow(Math.max(1e-4, 1 + gg - 2 * mu * gM), 1.5) * (2 + gg));
  for (let i = 0; i < steps; i++) {
    const pos = [r0[0] + dir[0] * (t + ss / 2), r0[1] + dir[1] * (t + ss / 2), r0[2] + dir[2] * (t + ss / 2)];
    const h = Math.hypot(pos[0], pos[1], pos[2]) - PLANET_R;
    const dR = Math.exp(-h / hR) * ss, dM = Math.exp(-h / hM) * ss;
    oR += dR; oM += dM;
    const js = rsi(pos, sun, ATMOS_R)[1] / jSteps;
    let jt = 0, jR = 0, jM = 0;
    for (let j = 0; j < jSteps; j++) {
      const jp = [pos[0] + sun[0] * (jt + js / 2), pos[1] + sun[1] * (jt + js / 2), pos[2] + sun[2] * (jt + js / 2)];
      const jh = Math.hypot(jp[0], jp[1], jp[2]) - PLANET_R;
      jR += Math.exp(-jh / hR) * js; jM += Math.exp(-jh / hM) * js;
      jt += js;
    }
    for (let c = 0; c < 3; c++) {
      const a = Math.exp(-(kM * (oM + jM) + kR[c] * (oR + jR)));
      tR[c] += dR * a; tM[c] += dM * a;
    }
    t += ss;
  }
  return [0, 1, 2].map((c) => iSun * (pR * kR[c] * tR[c] + pM * kM * tM[c]));
}

/** Transmittance from altitude toward the sun (sunlight color) */
export function sunTransmittance(altitude, sun, steps = 16) {
  const r0 = [0, PLANET_R + altitude, 0];
  const pg = rsi(r0, sun, PLANET_R);
  if (pg[0] < pg[1] && pg[0] > 0) return [0, 0, 0];
  const L = rsi(r0, sun, ATMOS_R)[1];
  if (L <= 0) return [1, 1, 1];
  const ss = L / steps;
  let oR = 0, oM = 0;
  for (let i = 0; i < steps; i++) {
    const d = (i + 0.5) * ss;
    const h = Math.hypot(r0[0] + sun[0] * d, r0[1] + sun[1] * d, r0[2] + sun[2] * d) - PLANET_R;
    oR += Math.exp(-h / hR) * ss; oM += Math.exp(-h / hM) * ss;
  }
  return [0, 1, 2].map((c) => Math.exp(-(kM * oM * 1.1 + kR[c] * oR)));
}

/** Sky dome material (camera-centered sphere) */
export function createSkyMaterial(sunDir) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uSun: { value: sunDir.clone() },
      uAlt: { value: 10 },
      uSteps: { value: 16 },
      uExposure: { value: 1.0 },
      uStarFade: { value: 0 },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
        vec4 p = projectionMatrix * viewMatrix * vec4((modelMatrix * vec4(position, 1.0)).xyz, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */`
      ${ATMOS_GLSL}
      uniform vec3 uSun; uniform float uAlt; uniform int uSteps; uniform float uExposure;
      varying vec3 vDir;
      void main() {
        vec3 dir = normalize(vDir);
        vec3 r0 = vec3(0.0, R_PLANET + max(uAlt, 1.0), 0.0);
        vec3 tr;
        vec3 col = atmosphere(dir, r0, uSun, 22.0, 1e9, uSteps, max(4, uSteps / 2), tr);
        // sun disc
        float cs = dot(dir, uSun);
        vec2 pg = rsi(r0, dir, R_PLANET);
        bool hitPlanet = pg.x < pg.y && pg.x > 0.0;
        if (!hitPlanet) {
          float disc = smoothstep(0.99996, 0.99999, cs);
          col += disc * tr * 60.0;
          col += tr * pow(max(cs, 0.0), 600.0) * 3.0;
        } else {
          col += vec3(0.0); // planet drawn separately
        }
        gl_FragColor = vec4(col * uExposure, 1.0);
      }`,
  });
}
