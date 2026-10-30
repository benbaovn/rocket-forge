// Procedural Moon: far-field sphere (ShaderMaterial), near-field landing terrain patch
// (MeshStandardMaterial + onBeforeCompile) and a JS height function that matches the GPU
// displacement bit-for-bit in its hashing (integer hash, identical in JS and GLSL ES 3.0).
//
// Moon-fixed space = the sphere mesh's object space. All features are a function of the unit
// direction in that space, so they never swim.
import * as THREE from 'three';
import { R_M, R_SUN, R_MARS, R_VENUS, R_MERCURY, R_PHOBOS, R_DEIMOS, ASTEROID_BELT_INNER, ASTEROID_BELT_OUTER, BODIES } from '../sim/constants.js';
import { NOISE_GLSL } from './earth.js';

// --------------------------------------------------------------------------------------------
// Feature tables (shared by JS + generated GLSL so both always agree)
// cell = lattice cell size on the surface (m); crater radius = (0.08..0.29) * cell
// dr = depth / radius, nk = extra normal exaggeration for shading, ab = albedo boost of fresh craters
// --------------------------------------------------------------------------------------------
const DISP_NOISE = [ // displaced value-noise relief (±12.5 m)
  { cell: 8000, amp: 6.0, seed: 21 },
  { cell: 4000, amp: 3.5, seed: 22 },
  { cell: 2000, amp: 2.0, seed: 23 },
  { cell: 1000, amp: 1.0, seed: 24 },
];
const DISP_NOISE_NK = 3.0;
const DISP_CRATERS = [ // displaced craters (geometry + shading) – gentle (max ~ -25..+8 m total)
  { cell: 5000, dens: 0.75, dr: 0.012, nk: 6.0, seed: 11, ab: 0.02 },
  { cell: 2000, dens: 0.75, dr: 0.022, nk: 4.0, seed: 12, ab: 0.03 },
  { cell: 800, dens: 0.70, dr: 0.035, nk: 3.0, seed: 13, ab: 0.035 },
  { cell: 320, dens: 0.65, dr: 0.055, nk: 2.0, seed: 14, ab: 0.04 },
];
const BIG_CRATERS = [ // shading only, flat floors + central peaks
  { cell: 90000, dens: 0.6, dr: 0.07, seed: 1, ab: 0.015 },
  { cell: 36000, dens: 0.75, dr: 0.09, seed: 2, ab: 0.02 },
  { cell: 14000, dens: 0.85, dr: 0.11, seed: 3, ab: 0.03 },
];
const SMALL_CRATERS = [ // shading only, LOD-faded by pixel footprint
  { cell: 130, dens: 0.7, dr: 0.12, seed: 31, ab: 0.04 },
  { cell: 50, dens: 0.7, dr: 0.12, seed: 32, ab: 0.04 },
  { cell: 20, dens: 0.7, dr: 0.11, seed: 33, ab: 0.04 },
  { cell: 8, dens: 0.65, dr: 0.10, seed: 34, ab: 0.035 },
  { cell: 3, dens: 0.6, dr: 0.09, seed: 35, ab: 0.03 },
  { cell: 1.2, dens: 0.5, dr: 0.08, seed: 36, ab: 0.02 },
];
const HILLS = [ // shading-only highland relief
  { cell: 60000, amp: 3200, seed: 41 },
  { cell: 25000, amp: 1300, seed: 42 },
  { cell: 10000, amp: 450, seed: 43 },
];
// fresh rayed craters (Tycho / Copernicus style)
const FRESH = [
  { d: [0.35, -0.55, 0.76], r: 9000, seed: 51 },
  { d: [-0.62, 0.32, 0.72], r: 6500, seed: 52 },
  { d: [0.78, 0.47, -0.41], r: 5200, seed: 53 },
  { d: [-0.28, -0.22, -0.93], r: 7400, seed: 54 },
  { d: [0.93, -0.3, 0.2], r: 4200, seed: 55 },
].map((f) => { const l = Math.hypot(...f.d); return { ...f, d: f.d.map((v) => v / l) }; });

// --------------------------------------------------------------------------------------------
// JS mirror of the GLSL integer hash / value noise / crater layers
// --------------------------------------------------------------------------------------------
function mhash(cx, cy, cz, s) {
  let h = Math.imul((cx + 1048576) | 0, 0x8da6b343) ^ Math.imul((cy + 1048576) | 0, 0xd8163841) ^
    Math.imul((cz + 1048576) | 0, 0xcb1ab31f) ^ Math.imul(s, 0x9e3779b9);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return h >>> 0;
}
const vh = (x, y, z, s) => (mhash(x, y, z, s) >>> 8) * (2 / 16777216) - 1;

function vnoise(x, y, z, s) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
  const a = vh(ix, iy, iz, s), b = vh(ix + 1, iy, iz, s), c = vh(ix, iy + 1, iz, s), d = vh(ix + 1, iy + 1, iz, s);
  const e = vh(ix, iy, iz + 1, s), f = vh(ix + 1, iy, iz + 1, s), g = vh(ix, iy + 1, iz + 1, s), h = vh(ix + 1, iy + 1, iz + 1, s);
  const k1 = b - a, k2 = c - a, k3 = e - a, k4 = a - b - c + d, k5 = a - c - e + g, k6 = a - b - e + f, k7 = -a + b + c - d + e - f - g + h;
  return a + k1 * ux + k2 * uy + k3 * uz + k4 * ux * uy + k5 * uy * uz + k6 * uz * ux + k7 * ux * uy * uz;
}

function profileH(t, D, big) {
  const Rh = 0.3 * D;
  if (t < 1) {
    let hn = -D + (D + Rh) * t * t;
    if (big) { const fl = -0.62 * D; if (hn < fl) hn = fl; hn += 0.45 * D * Math.exp(-t * t * 40); }
    return hn;
  }
  const q = 1 - (t - 1) / 0.7;
  return Rh * q * q * q;
}

function layerH(x, y, z, L) {
  const freq = R_M / L.cell;
  const px = x * freq, py = y * freq, pz = z * freq;
  const fx0 = Math.floor(px), fy0 = Math.floor(py), fz0 = Math.floor(pz);
  const bx = fx0 + (px - fx0 >= 0.5 ? 1 : 0) - 1, by = fy0 + (py - fy0 >= 0.5 ? 1 : 0) - 1, bz = fz0 + (pz - fz0 >= 0.5 ? 1 : 0) - 1;
  let H = 0;
  for (let k = 0; k < 8; k++) {
    const cx = bx + (k & 1), cy = by + ((k >> 1) & 1), cz = bz + ((k >> 2) & 1);
    let h = mhash(cx, cy, cz, L.seed);
    const rnd = () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return (h >>> 8) / 16777216; };
    if (rnd() >= L.dens) continue;
    const ox = rnd(), oy = rnd(), oz = rnd(), rs = rnd(), fr = rnd();
    const dx = px - (cx + 0.25 + 0.5 * ox), dy = py - (cy + 0.25 + 0.5 * oy), dz = pz - (cz + 0.25 + 0.5 * oz);
    const rc = 0.08 + 0.21 * rs * rs;
    const t = Math.sqrt(dx * dx + dy * dy + dz * dz) / rc;
    if (t >= 1.7) continue;
    H += rc * L.cell * profileH(t, L.dr * (0.35 + 0.65 * fr), false);
  }
  return H;
}

export const OLYMPUS_PSI = 0.855;
export const OLYMPUS_DIR_X = Math.sin(OLYMPUS_PSI);
export const OLYMPUS_DIR_Y = Math.cos(OLYMPUS_PSI);

function sstep(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/**
 * 3D elevation profile of Olympus Mons on Mars (shield volcano with basal cliff scarp,
 * radial lava channels, raised summit rim at r ≈ 455 m, and nested summit caldera).
 */
export function olympusMonsDisp(nx, ny, nz) {
  const dx = (nx - OLYMPUS_DIR_X) * R_MARS;
  const dy = (ny - OLYMPUS_DIR_Y) * R_MARS;
  const dz = nz * R_MARS;
  const r = Math.hypot(dx, dy, dz);
  if (r >= 2250.0) return { h: 0, dampen: 0, r };
  const scarp = 265.0 * sstep(2200.0, 1840.0, r);
  const tc = Math.max(0, Math.min(1, (1960.0 - r) / 1510.0));
  const cone = (tc * tc * (3.0 - 2.0 * tc) * 0.52 + Math.pow(Math.max(tc, 1e-6), 1.32) * 0.48) * 1115.0;
  const drRim = (r - 455.0) / 58.0;
  const rim = 48.0 * Math.exp(-drRim * drRim);
  const calOuter = -235.0 * sstep(435.0, 325.0, r);
  const calInner = -65.0 * sstep(135.0, 62.0, r);
  const u = dx * OLYMPUS_DIR_Y - dy * OLYMPUS_DIR_X;
  const v = dz;
  const flankMask = sstep(2160.0, 1720.0, r) * sstep(480.0, 660.0, r);
  const ribs = (Math.sin(u * 0.011 + v * 0.008) * Math.cos(v * 0.013 - u * 0.007) + 0.45 * Math.sin(u * 0.025 - v * 0.021)) * 18.0 * flankMask;
  const h = scarp + cone + rim + calOuter + calInner + ribs;
  const dampen = 0.88 * sstep(2220.0, 1700.0, r);
  return { h, dampen, r };
}

/**
 * Terrain height (metres) for a unit direction in body-fixed space.
 * Matches the vertex displacement of createMoonSurface() exactly (including Olympus Mons on Mars).
 */
export function moonHeight(x, y, z, body = 'moon') {
  const l = Math.hypot(x, y, z) || 1;
  x /= l; y /= l; z /= l;
  let H = 0;
  for (const N of DISP_NOISE) { const f = R_M / N.cell; H += N.amp * vnoise(x * f, y * f, z * f, N.seed); }
  for (const L of DISP_CRATERS) H += layerH(x, y, z, L);
  if (body === 'mars') {
    const om = olympusMonsDisp(x, y, z);
    H = H * (1 - om.dampen) + om.h;
  }
  return H;
}

// --------------------------------------------------------------------------------------------
// GLSL
// --------------------------------------------------------------------------------------------
const fl = (v) => { const s = String(+v); return /[.e]/.test(s) ? s : s + '.0'; };

const CORE_GLSL = /* glsl */`
#define MOON_R ${fl(R_M)}
#define MARS_R ${fl(R_MARS)}
#define OLYMPUS_X ${fl(OLYMPUS_DIR_X)}
#define OLYMPUS_Y ${fl(OLYMPUS_DIR_Y)}
vec2 marsOlympusDisp(vec3 n) {
  vec3 od = (n - vec3(OLYMPUS_X, OLYMPUS_Y, 0.0)) * MARS_R;
  float r = length(od);
  if (r >= 2250.0) return vec2(0.0, 0.0);
  float scarp = 265.0 * smoothstep(2200.0, 1840.0, r);
  float tc = clamp((1960.0 - r) / 1510.0, 0.0, 1.0);
  float cone = (tc * tc * (3.0 - 2.0 * tc) * 0.52 + pow(max(tc, 1e-6), 1.32) * 0.48) * 1115.0;
  float drRim = (r - 455.0) / 58.0;
  float rim = 48.0 * exp(-drRim * drRim);
  float calOuter = -235.0 * smoothstep(435.0, 325.0, r);
  float calInner = -65.0 * smoothstep(135.0, 62.0, r);
  float u = od.x * OLYMPUS_Y - od.y * OLYMPUS_X;
  float v = od.z;
  float flankMask = smoothstep(2160.0, 1720.0, r) * smoothstep(480.0, 660.0, r);
  float ribs = (sin(u * 0.011 + v * 0.008) * cos(v * 0.013 - u * 0.007) + 0.45 * sin(u * 0.025 - v * 0.021)) * 18.0 * flankMask;
  float h = scarp + cone + rim + calOuter + calInner + ribs;
  float dampen = 0.88 * smoothstep(2220.0, 1700.0, r);
  return vec2(h, dampen);
}
uint m_hash(ivec3 c, uint s) {
  uvec3 u = uvec3(c + 1048576);
  uint h = (u.x * 0x8da6b343u) ^ (u.y * 0xd8163841u) ^ (u.z * 0xcb1ab31fu) ^ (s * 0x9e3779b9u);
  h ^= h >> 15u; h *= 0x2c1b3c6du; h ^= h >> 12u; h *= 0x297a2d39u; h ^= h >> 15u;
  return h;
}
float m_rnd(inout uint h) { h = h * 1664525u + 1013904223u; return float(h >> 8u) * (1.0 / 16777216.0); }
float m_vh(ivec3 c, uint s) { return float(m_hash(c, s) >> 8u) * (2.0 / 16777216.0) - 1.0; }
// value noise in [-1,1] with analytic derivative: (v, dv/dx, dv/dy, dv/dz)
vec4 m_vnoise(vec3 x, uint s) {
  vec3 i = floor(x); vec3 f = x - i; ivec3 c = ivec3(i);
  vec3 u = f * f * (3.0 - 2.0 * f); vec3 du = 6.0 * f * (1.0 - f);
  float a = m_vh(c, s), b = m_vh(c + ivec3(1,0,0), s), cc = m_vh(c + ivec3(0,1,0), s), d = m_vh(c + ivec3(1,1,0), s);
  float e = m_vh(c + ivec3(0,0,1), s), ff = m_vh(c + ivec3(1,0,1), s), g = m_vh(c + ivec3(0,1,1), s), h = m_vh(c + ivec3(1,1,1), s);
  float k1 = b - a, k2 = cc - a, k3 = e - a, k4 = a - b - cc + d, k5 = a - cc - e + g, k6 = a - b - e + ff, k7 = -a + b + cc - d + e - ff - g + h;
  float v = a + k1 * u.x + k2 * u.y + k3 * u.z + k4 * u.x * u.y + k5 * u.y * u.z + k6 * u.z * u.x + k7 * u.x * u.y * u.z;
  vec3 dv = du * vec3(k1 + k4 * u.y + k6 * u.z + k7 * u.y * u.z,
                      k2 + k5 * u.z + k4 * u.x + k7 * u.z * u.x,
                      k3 + k6 * u.x + k5 * u.y + k7 * u.x * u.y);
  return vec4(v, dv);
}
void m_profile(float t, float D, float big, out float hn, out float dh) {
  float Rh = 0.3 * D;
  if (t < 1.0) {
    hn = -D + (D + Rh) * t * t; dh = 2.0 * (D + Rh) * t;
    if (big > 0.5) {
      float flr = -0.62 * D;
      if (hn < flr) { hn = flr; dh = 0.0; }
      float pk = 0.45 * D * exp(-t * t * 40.0);
      hn += pk; dh += pk * (-80.0 * t);
    }
  } else {
    float q = 1.0 - (t - 1.0) / 0.7;
    hn = Rh * q * q * q; dh = -3.0 * Rh * q * q / 0.7;
  }
}
// one cellular crater layer; H in metres, G = surface slope vector (Moon-fixed), A = albedo delta
void m_layer(vec3 n, float freq, float cellM, float dens, float dr, float nk, uint seed, float big, float ab, float w,
             inout float H, inout vec3 G, inout float A) {
  if (w <= 0.0) return;
  vec3 p = n * freq;
  vec3 c0 = floor(p);
  ivec3 base = ivec3(c0) + ivec3(step(vec3(0.5), p - c0)) - 1;
  for (int k = 0; k < 8; k++) {
    ivec3 cell = base + ivec3(k & 1, (k >> 1) & 1, (k >> 2) & 1);
    uint h = m_hash(cell, seed);
    if (m_rnd(h) >= dens) continue;
    float ox = m_rnd(h);
    float oy = m_rnd(h);
    float oz = m_rnd(h);
    float rs = m_rnd(h);
    float fr = m_rnd(h);
    vec3 d = p - (vec3(cell) + 0.25 + 0.5 * vec3(ox, oy, oz));
    float rc = 0.08 + 0.21 * rs * rs;
    float dist = length(d);
    float t = dist / rc;
    if (t >= 1.7) continue;
    float fresh = 0.35 + 0.65 * fr;
    float hn, dh;
    m_profile(t, dr * fresh, big, hn, dh);
    H += w * rc * cellM * hn;
    G += (w * nk * dh / max(dist, 1e-6)) * d;
    float f3 = fresh * fresh * fresh;
    A += w * ab * f3 * (t < 1.0 ? 0.55 + 0.45 * t * t : 1.0 - (t - 1.0) / 0.7);
  }
}
float moonDisp(vec3 n) {
  float H = 0.0; vec3 G = vec3(0.0); float A = 0.0;
${DISP_NOISE.map((N) => `  H += ${fl(N.amp)} * m_vnoise(n * ${fl(R_M / N.cell)}, ${N.seed}u).x;`).join('\n')}
${DISP_CRATERS.map((L) => `  m_layer(n, ${fl(R_M / L.cell)}, ${fl(L.cell)}, ${fl(L.dens)}, ${fl(L.dr)}, 0.0, ${L.seed}u, 0.0, 0.0, 1.0, H, G, A);`).join('\n')}
  return H;
}
`;

const SHADE_GLSL = /* glsl */`
${NOISE_GLSL}
float m_lod(float cellM, float fp) { return smoothstep(1.2 * fp, 4.0 * fp, 0.12 * cellM); }
float m_mare(vec3 n) {
  float m = fbm3(n * 1.55 + vec3(3.1, 1.7, 5.2), 6) + 0.11 * n.x - 0.04 * n.y;
  m += (fbm3(n * 9.0 + 11.0, 4) - 0.5) * 0.06;
  return smoothstep(0.535, 0.585, m);
}
vec3 m_tint(float mare) { return mix(vec3(1.0, 0.972, 0.94), vec3(0.93, 0.935, 0.965), mare); }
// Full surface: height (m, informational), slope G (Moon-fixed), albedo, mare mask
void moonShade(vec3 n, float fp, out float H, out vec3 G, out float alb, out float mare) {
  H = 0.0; G = vec3(0.0); float A = 0.0;
  mare = m_mare(n);
  float bigDens = 1.0 - 0.65 * mare;
  float w; vec4 v;
${BIG_CRATERS.map((L) => `  w = m_lod(${fl(L.cell)}, fp); m_layer(n, ${fl(R_M / L.cell)}, ${fl(L.cell)}, ${fl(L.dens)} * bigDens, ${fl(L.dr)}, 1.0, ${L.seed}u, 1.0, ${fl(L.ab)}, w, H, G, A);`).join('\n')}
${HILLS.map((N) => `  w = m_lod(${fl(N.cell)}, fp); if (w > 0.0) { v = m_vnoise(n * ${fl(R_M / N.cell)}, ${N.seed}u); G += (w * (1.0 - 0.85 * mare) * ${fl(N.amp / N.cell)}) * v.yzw; }`).join('\n')}
${DISP_NOISE.map((N) => `  w = m_lod(${fl(N.cell)}, fp); v = m_vnoise(n * ${fl(R_M / N.cell)}, ${N.seed}u); H += ${fl(N.amp)} * v.x; G += (w * ${fl(DISP_NOISE_NK * N.amp / N.cell)}) * v.yzw;`).join('\n')}
${DISP_CRATERS.map((L) => `  w = m_lod(${fl(L.cell)}, fp); m_layer(n, ${fl(R_M / L.cell)}, ${fl(L.cell)}, ${fl(L.dens)}, ${fl(L.dr)}, ${fl(L.nk)}, ${L.seed}u, 0.0, ${fl(L.ab)}, w, H, G, A);`).join('\n')}
${SMALL_CRATERS.map((L) => `  w = m_lod(${fl(L.cell)}, fp); m_layer(n, ${fl(R_M / L.cell)}, ${fl(L.cell)}, ${fl(L.dens)}, ${fl(L.dr)}, 1.0, ${L.seed}u, 0.0, ${fl(L.ab)}, w, H, G, A);`).join('\n')}
  // fresh rayed craters
  float rays = 0.0;
${FRESH.map((F) => `  {
    vec3 C = vec3(${F.d.map(fl).join(', ')});
    vec3 dv = n - C; float dc = length(dv) * MOON_R; float s = dc / ${fl(F.r)};
    if (s < 18.0) {
      if (s < 1.7) { float hn, dh; m_profile(s, 0.2, 1.0, hn, dh); H += ${fl(F.r)} * hn; G += dh * dv / max(length(dv), 1e-7); }
      vec3 t1 = normalize(cross(C, abs(C.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0))); vec3 t2 = cross(C, t1);
      float ang = atan(dot(n, t2), dot(n, t1));
      float r1 = m_vnoise(vec3(cos(ang) * 14.0, sin(ang) * 14.0, s * 0.18), ${F.seed}u).x;
      float r2 = m_vnoise(vec3(cos(ang) * 41.0, sin(ang) * 41.0, s * 0.5), ${F.seed + 100}u).x;
      float streak = smoothstep(0.15, 0.85, r1 * 0.65 + r2 * 0.45);
      float fall = exp(-s / 5.5) * smoothstep(0.9, 1.6, s);
      rays += 0.22 * streak * fall + 0.10 * exp(-max(s - 1.0, 0.0) * 1.3) * step(0.75, s) + (s < 1.0 ? 0.06 : 0.0);
    }
  }`).join('\n')}
  float hl = 0.27 * (0.8 + 0.4 * fbm3(n * 14.0 + 3.0, 5));
  float ma = 0.10 * (0.82 + 0.36 * fbm3(n * 23.0 + 9.0, 4));
  alb = max(mix(hl, ma, mare) + A + rays * (1.0 - 0.4 * mare), 0.02);
}
`;

// Lunar-Lambert direct diffuse for MeshStandardMaterial (matches the sphere shader exactly)
const LL_K = 0.8;
function lunarLightsChunk() {
  const src = THREE.ShaderChunk.lights_physical_pars_fragment;
  const target = 'reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );';
  if (!src.includes(target)) console.warn('[moon] lunar-lambert patch target not found');
  return src.replace(target, `{ float mu0L = dotNL; float muL = saturate( dot( geometryNormal, geometryViewDir ) );
    reflectedLight.directDiffuse += directLight.color * BRDF_Lambert( material.diffuseColor ) * ( ${fl(2 * LL_K)} * mu0L / ( mu0L + muL + 1e-4 ) + ${fl(1 - LL_K)} * mu0L ); }`);
}

// --------------------------------------------------------------------------------------------
// Far-field sphere
// --------------------------------------------------------------------------------------------
/**
 * Moon sphere, radius R_M, object space = Moon-fixed space.
 * uniforms: uSun (world unit vector toward the sun), uExposure (1), uSunIntensity (7, same as the
 * scene's directional light so the near patch matches), uBump (1, normal strength),
 * uHole (vec4 Moon-fixed dir xyz + cos(angular radius) in w; w > 1 disables) – discards the sphere
 * under the landing patch to avoid z-fighting. For a patch built around up U use
 * uHole = (U, cos(0.7 * 25000 / R_M)).
 */
export function createMoon() {
  const geo = new THREE.SphereGeometry(R_M, 384, 192);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uSun: { value: new THREE.Vector3(1, 0.3, 0.2).normalize() },
      uExposure: { value: 0.85 },
      uSunIntensity: { value: 4.2 },
      uBump: { value: 1 },
      uHole: { value: new THREE.Vector4(0, 1, 0, 2) },
      uEarthshine: { value: 0.003 },
    },
    vertexShader: /* glsl */`
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec3 vObj; varying vec3 vWorld; varying vec3 vNormalW; varying vec3 vM0; varying vec3 vM1; varying vec3 vM2;
      void main() {
        vObj = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vM0 = modelMatrix[0].xyz; vM1 = modelMatrix[1].xyz; vM2 = modelMatrix[2].xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <logdepthbuf_pars_fragment>
      ${CORE_GLSL}
      ${SHADE_GLSL}
      uniform vec3 uSun; uniform float uExposure; uniform float uSunIntensity; uniform float uBump;
      uniform vec4 uHole; uniform float uEarthshine;
      varying vec3 vObj; varying vec3 vWorld; varying vec3 vNormalW; varying vec3 vM0; varying vec3 vM1; varying vec3 vM2;
      void main() {
        #include <logdepthbuf_fragment>
        vec3 n = normalize(vObj);
        if (dot(n, uHole.xyz) > uHole.w) discard;
        float fp = max(length(fwidth(n)) * MOON_R, 0.05);
        float H; vec3 G; float alb; float mare;
        moonShade(n, fp, H, G, alb, mare);
        vec3 Gt = G - n * dot(G, n);
        vec3 Nf = normalize(n - Gt * uBump);
        mat3 m3 = mat3(vM0, vM1, vM2);
        vec3 N = normalize(m3 * Nf);
        vec3 Ng = normalize(vNormalW);
        vec3 V = normalize(cameraPosition - vWorld);
        float mu0 = max(dot(N, uSun), 0.0);
        float mu = max(dot(N, V), 0.0);
        float term = smoothstep(-0.015, 0.02, dot(Ng, uSun));
        float ll = ${fl(2 * LL_K)} * mu0 / (mu0 + mu + 1e-4) + ${fl(1 - LL_K)} * mu0;
        vec3 albedo = m_tint(mare) * alb;
        vec3 col = albedo * (uSunIntensity * RECIPROCAL_PI) * ll * term;
        col += albedo * uEarthshine * (0.4 + 0.6 * max(dot(Ng, -uSun), 0.0));
        gl_FragColor = vec4(col * uExposure, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'moon';
  return mesh;
}

/**
 * Procedural 3D Sun sphere with animated solar plasma granulation, sunspots, and glowing corona.
 */
export function createSunSphere() {
  const group = new THREE.Group();
  group.name = 'sun';

  const geo = new THREE.SphereGeometry(R_SUN, 128, 64);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */`
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec3 vObj; varying vec3 vWorld; varying vec3 vNormalW;
      void main() {
        vObj = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <logdepthbuf_pars_fragment>
      ${NOISE_GLSL}
      uniform float uTime;
      varying vec3 vObj; varying vec3 vWorld; varying vec3 vNormalW;
      void main() {
        #include <logdepthbuf_fragment>
        vec3 n = normalize(vObj);
        vec3 Ng = normalize(vNormalW);
        vec3 V = normalize(cameraPosition - vWorld);
        float mu = max(dot(Ng, V), 0.0);

        float g1 = fbm3(n * 6.5 + vec3(uTime * 0.015, -uTime * 0.012, uTime * 0.008), 5);
        float g2 = fbm3(n * 18.0 + vec3(-uTime * 0.025, uTime * 0.02, 1.7), 4);
        float spot = fbm3(n * 3.2 + vec3(2.1, 4.3, uTime * 0.004), 4);
        float plasma = clamp(g1 * 0.65 + g2 * 0.35, 0.0, 1.0);

        vec3 cCore = vec3(1.5, 1.32, 0.72);
        vec3 cMid = vec3(1.25, 0.72, 0.16);
        vec3 cEdge = vec3(0.95, 0.28, 0.05);
        vec3 col = mix(cMid, cCore, smoothstep(0.3, 0.8, plasma));
        // Limb darkening
        float limb = pow(mu, 0.45);
        col = mix(cEdge, col, limb);
        // Sunspots
        float spotMask = smoothstep(0.74, 0.82, spot) * step(abs(n.z), 0.55);
        col = mix(col, vec3(0.32, 0.10, 0.02), spotMask * 0.75);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const coreMesh = new THREE.Mesh(geo, mat);
  coreMesh.layers.set(1);
  group.add(coreMesh);

  // Outer Solar Corona Halo
  const coronaGeo = new THREE.SphereGeometry(R_SUN * 1.28, 64, 32);
  const coronaMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader: /* glsl */`
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec3 vNormalW; varying vec3 vWorld;
      void main() {
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <logdepthbuf_pars_fragment>
      varying vec3 vNormalW; varying vec3 vWorld;
      void main() {
        #include <logdepthbuf_fragment>
        vec3 V = normalize(cameraPosition - vWorld);
        float rim = max(0.0, dot(V, -normalize(vNormalW)));
        float glow = pow(rim, 2.8);
        vec3 col = mix(vec3(1.0, 0.38, 0.06), vec3(1.0, 0.88, 0.42), glow);
        gl_FragColor = vec4(col, glow * 0.85);
      }`,
  });
  const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
  coronaMesh.layers.set(1);
  group.add(coronaMesh);

  // Main Asteroid Belt between Mars and Jupiter in 3D space pass (layer 1)
  const beltRInner = ASTEROID_BELT_INNER;
  const beltROuter = ASTEROID_BELT_OUTER;
  const rockGeo = rockGeometry(1, 2.4);
  const rockMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const N_AST = 720;
  const astMesh = new THREE.InstancedMesh(rockGeo, rockMat, N_AST);
  astMesh.layers.set(1);
  astMesh.frustumCulled = false;
  const rnd = mulberry(4242);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  for (let i = 0; i < N_AST; i++) {
    const ang = rnd() * Math.PI * 2;
    const u = 0.5 + (rnd() - 0.5) * 0.65 + (rnd() - 0.5) * 0.35;
    const r = beltRInner + Math.max(0.02, Math.min(0.98, u)) * (beltROuter - beltRInner);
    const zOff = (rnd() - 0.5) * 1800e3;
    dummy.position.set(Math.sin(ang) * r, Math.cos(ang) * r, zOff);
    dummy.rotation.set(rnd() * Math.PI * 2, rnd() * Math.PI * 2, rnd() * Math.PI * 2);
    const sz = (rnd() < 0.06 ? 180e3 + rnd() * 140e3 : 45e3 + Math.pow(rnd(), 2.0) * 110e3);
    dummy.scale.set(sz * (0.75 + rnd() * 0.5), sz * (0.65 + rnd() * 0.45), sz * (0.75 + rnd() * 0.5));
    dummy.updateMatrix();
    astMesh.setMatrixAt(i, dummy.matrix);
    const b = 0.38 + rnd() * 0.36;
    col.setRGB(b + 0.04, b + 0.01, b - 0.02);
    astMesh.setColorAt(i, col);
  }
  astMesh.instanceMatrix.needsUpdate = true;
  if (astMesh.instanceColor) astMesh.instanceColor.needsUpdate = true;
  group.add(astMesh);

  group.userData.coreMat = mat;
  group.userData.asteroidBelt = astMesh;
  return group;
}

/**
 * Procedural 3D planet / moon sphere for Mars, Venus, Mercury, Phobos, or Deimos (rendered in space pass layer 1).
 */
export function createPlanetSphere(name) {
  const B = BODIES[name] || BODIES.mercury;
  const R = B.R || R_MERCURY;
  const isGasOrHaze = ['venus', 'jupiter', 'saturn', 'uranus', 'neptune', 'titan'].includes(name);
  const pMode = name === 'mars' ? 1 : isGasOrHaze ? 2 : name === 'mercury' ? 3 : name === 'phobos' ? 4 : name === 'ceres' ? 6 : 5;
  const c1 = new THREE.Color(B.hex || 0xcbd5e1);
  const c2 = c1.clone().multiplyScalar(0.65);
  if (name === 'venus' || name === 'titan') { c1.setRGB(0.98, 0.86, 0.58); c2.setRGB(0.76, 0.52, 0.22); }
  else if (name === 'jupiter') { c1.setRGB(0.96, 0.84, 0.68); c2.setRGB(0.75, 0.42, 0.22); }
  else if (name === 'saturn') { c1.setRGB(0.96, 0.88, 0.64); c2.setRGB(0.76, 0.64, 0.38); }
  else if (name === 'uranus') { c1.setRGB(0.62, 0.94, 0.98); c2.setRGB(0.36, 0.76, 0.86); }
  else if (name === 'neptune') { c1.setRGB(0.35, 0.62, 0.98); c2.setRGB(0.14, 0.34, 0.78); }
  const isMoon = B.parent && B.parent !== 'sun';
  const geo = new THREE.SphereGeometry(R, isMoon ? 96 : 160, isMoon ? 48 : 80);
  const mat = new THREE.ShaderMaterial({
    side: B.gasGiant ? THREE.DoubleSide : THREE.FrontSide,
    uniforms: {
      uSun: { value: new THREE.Vector3(1, 0.3, 0.2).normalize() },
      uExposure: { value: 0.85 },
      uSunIntensity: { value: 4.2 },
      uTime: { value: 0 },
      uMode: { value: pMode },
      uPlanetR: { value: R },
      uCol1: { value: c1 },
      uCol2: { value: c2 },
    },
    vertexShader: /* glsl */`
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec3 vObj; varying vec3 vWorld; varying vec3 vNormalW; varying vec3 vM0; varying vec3 vM1; varying vec3 vM2;
      void main() {
        vObj = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vM0 = modelMatrix[0].xyz; vM1 = modelMatrix[1].xyz; vM2 = modelMatrix[2].xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <logdepthbuf_pars_fragment>
      ${CORE_GLSL}
      ${SHADE_GLSL}
      uniform vec3 uSun; uniform float uExposure; uniform float uSunIntensity; uniform float uTime;
      uniform int uMode; uniform float uPlanetR; uniform vec3 uCol1; uniform vec3 uCol2;
      varying vec3 vObj; varying vec3 vWorld; varying vec3 vNormalW; varying vec3 vM0; varying vec3 vM1; varying vec3 vM2;
      void main() {
        #include <logdepthbuf_fragment>
        vec3 n = normalize(vObj);
        vec3 Ng = normalize(vNormalW);
        vec3 V = normalize(cameraPosition - vWorld);
        float fp = max(length(fwidth(n)) * uPlanetR, 0.2);

        if (uMode == 2) {
          // Banded atmospheric worlds (Venus, Jupiter, Saturn, Uranus, Neptune, Titan)
          float lat = asin(clamp(n.z, -1.0, 1.0));
          float lon = atan(n.y, n.x) + uTime * 0.008;
          vec3 q = vec3(cos(lon) * cos(lat) * 2.5, sin(lon) * cos(lat) * 2.5, lat * 8.5);
          float b1 = fbm3(q + vec3(1.2, 3.4, 5.6), 6);
          float b2 = sin(lat * 14.0 + b1 * 2.5) * 0.5 + 0.5;
          float swirl = smoothstep(0.2, 0.85, b1 * 0.55 + b2 * 0.45);
          vec3 albedo = mix(uCol2, uCol1, swirl) * 0.34;
          float ndl = max(dot(Ng, uSun), 0.0);
          float term = smoothstep(-0.08, 0.15, dot(Ng, uSun));
          float insideLight = gl_FrontFacing ? 0.0 : 0.25;
          float rim = gl_FrontFacing ? pow(1.0 - max(dot(Ng, V), 0.0), 3.2) : 0.12;
          vec3 col = albedo * (uSunIntensity * RECIPROCAL_PI) * max(0.75 * ndl + 0.25 * term, insideLight);
          col += uCol1 * rim * max(dot(Ng, uSun) + 0.2, insideLight) * 0.38;
          gl_FragColor = vec4(col * uExposure, 1.0);
          return;
        }

        float H; vec3 G; float alb; float mare;
        moonShade(n, fp, H, G, alb, mare);
        vec3 Gt = G - n * dot(G, n);
        vec3 Nf = normalize(n - Gt * (uMode == 1 ? 0.65 : uMode >= 4 ? 1.35 : 1.05));
        mat3 m3 = mat3(vM0, vM1, vM2);
        vec3 N = normalize(m3 * Nf);
        float mu0 = max(dot(N, uSun), 0.0);
        float mu = max(dot(N, V), 0.0);
        float term = smoothstep(-0.02, 0.03, dot(Ng, uSun));
        float ll = ${fl(2 * LL_K)} * mu0 / (mu0 + mu + 1e-4) + ${fl(1 - LL_K)} * mu0;

        if (uMode == 1) {
          // MARS: Rusty iron-oxide deserts, dark basaltic plains, polar ice caps, dusty salmon limb + OLYMPUS MONS
          float desert = fbm3(n * 3.8 + vec3(4.2, 1.9, 7.3), 6);
          vec3 rustHigh = vec3(0.88, 0.36, 0.16);
          vec3 ochreMid = vec3(0.95, 0.52, 0.26);
          vec3 darkBasalt = vec3(0.36, 0.18, 0.11);
          vec3 mCol = mix(rustHigh, ochreMid, smoothstep(0.35, 0.72, desert));
          mCol = mix(mCol, darkBasalt, mare * 0.75);
          // Planetary-scale Olympus Mons shield volcano & caldera visible from orbit
          vec3 omVec = n - vec3(OLYMPUS_X, OLYMPUS_Y, 0.0);
          float omAng = length(omVec);
          float omGlow = 0.0;
          if (omAng < 0.16) {
            float aureole = smoothstep(0.155, 0.125, omAng) * smoothstep(0.095, 0.12, omAng);
            float shield = smoothstep(0.13, 0.025, omAng);
            float rimFrost = smoothstep(0.036, 0.025, omAng) * smoothstep(0.014, 0.022, omAng);
            float caldera = smoothstep(0.022, 0.012, omAng);
            float lavaDot = smoothstep(0.011, 0.003, omAng);
            vec3 omDir = omVec / max(omAng, 1e-5);
            float omSlope = (smoothstep(0.14, 0.11, omAng) * 0.45 + shield * 0.55 - caldera * 1.25);
            vec3 NfOm = normalize(Nf + (omDir - n * dot(omDir, n)) * omSlope * 0.85);
            vec3 NOm = normalize(m3 * NfOm);
            float mu0Om = max(dot(NOm, uSun), 0.0);
            ll = ${fl(2 * LL_K)} * mu0Om / (mu0Om + mu + 1e-4) + ${fl(1 - LL_K)} * mu0Om;
            mCol = mix(mCol, vec3(1.08, 0.66, 0.36), aureole * 0.65);
            mCol = mix(mCol, vec3(0.54, 0.20, 0.10), shield * 0.72);
            mCol = mix(mCol, vec3(1.25, 1.15, 1.05), rimFrost * 0.85);
            mCol = mix(mCol, vec3(0.22, 0.10, 0.07), caldera * 0.82);
            omGlow = lavaDot;
          }
          // Polar ice caps
          float pole = smoothstep(0.84, 0.93, abs(n.z) + 0.04 * (desert - 0.5));
          vec3 albedo = mix(mCol * (0.14 + 0.44 * alb), vec3(0.85, 0.83, 0.80) * 0.32, pole);
          vec3 col = albedo * (uSunIntensity * RECIPROCAL_PI) * ll * term;
          col += vec3(1.6, 0.45, 0.08) * omGlow;
          float rim = pow(1.0 - max(dot(Ng, V), 0.0), 3.4);
          col += vec3(0.85, 0.40, 0.20) * rim * max(dot(Ng, uSun) + 0.18, 0.0) * 0.32;
          gl_FragColor = vec4(col * uExposure, 1.0);
          return;
        }

        if (uMode == 6) {
          // CERES: Dark carbonaceous chondrite regolith + bright sodium-carbonate salt deposits in Occator Crater (Cerealia & Vinalia Faculae)
          vec3 cHigh = vec3(0.46, 0.48, 0.52);
          vec3 cLow = vec3(0.26, 0.28, 0.32);
          vec3 baseTint = mix(cHigh, cLow, mare);
          vec3 albedo = baseTint * clamp(alb * 0.75, 0.04, 0.55);
          // Occator Crater & bright salt spots (Cerealia Facula + Vinalia Faculae)
          vec3 ocCenter = normalize(vec3(0.42, 0.88, 0.22));
          float ocDist = length(n - ocCenter);
          if (ocDist < 0.14) {
            float craterFloor = smoothstep(0.095, 0.055, ocDist);
            float craterRim = smoothstep(0.115, 0.092, ocDist) * smoothstep(0.068, 0.088, ocDist);
            float cerealia = smoothstep(0.026, 0.004, ocDist);
            vec3 vinDir = normalize(vec3(0.47, 0.85, 0.24));
            float vinalia = smoothstep(0.032, 0.008, length(n - vinDir)) * (0.55 + 0.45 * sin(n.x * 180.0 + n.z * 160.0));
            albedo = mix(albedo, vec3(0.12, 0.13, 0.16), craterFloor * 0.45);
            albedo = mix(albedo, vec3(0.36, 0.39, 0.44), craterRim * 0.40);
            albedo = mix(albedo, vec3(0.62, 0.66, 0.72), clamp(cerealia + vinalia * 0.75, 0.0, 1.0));
          }
          vec3 col = albedo * (uSunIntensity * RECIPROCAL_PI) * ll * term;
          col += albedo * 0.004 * (0.4 + 0.6 * max(dot(Ng, -uSun), 0.0));
          gl_FragColor = vec4(col * uExposure, 1.0);
          return;
        }

        if (uMode == 4 || uMode == 5) {
          // Moons & outer worlds with custom surface tint (toned down so icy moons don't glare)
          float grooves = sin((n.x * 22.0 + n.y * 14.0 + fbm3(n * 6.0, 3) * 2.5)) * 0.06;
          vec3 tint = mix(uCol1, uCol2, mare) * 0.72;
          vec3 albedo = tint * clamp(alb + (uMode == 4 ? grooves : 0.0), 0.04, 0.58);
          vec3 col = albedo * (uSunIntensity * RECIPROCAL_PI) * ll * term;
          col += albedo * 0.004 * (0.4 + 0.6 * max(dot(Ng, -uSun), 0.0));
          gl_FragColor = vec4(col * uExposure, 1.0);
          return;
        }

        // MERCURY: Heavily cratered slate-bronze regolith with high-contrast rayed basins
        vec3 mercTint = mix(vec3(0.82, 0.77, 0.70), vec3(0.66, 0.63, 0.60), mare);
        vec3 albedo = mercTint * alb * 0.72;
        vec3 col = albedo * (uSunIntensity * RECIPROCAL_PI) * ll * term;
        col += albedo * 0.003 * (0.4 + 0.6 * max(dot(Ng, -uSun), 0.0));
        gl_FragColor = vec4(col * uExposure, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  return mesh;
}

// --------------------------------------------------------------------------------------------
// Near-field landing terrain patch
// --------------------------------------------------------------------------------------------
const PATCH_R = 25000;

const PATCH_VERT_HEAD = /* glsl */`
uniform vec3 uEast; uniform vec3 uUp; uniform vec3 uNorth; uniform float uBodyR; uniform float uIsMars;
varying vec2 vLocal;
varying vec3 vBX; varying vec3 vBY; varying vec3 vBZ;
${CORE_GLSL}
`;
const PATCH_BEGIN = /* glsl */`
vec3 transformed;
{
  vec2 pl = position.xz;
  float s2 = dot(pl, pl);
  float Lm = sqrt(uBodyR * uBodyR + s2);
  vec3 fixedDir = (uBodyR * uUp + pl.x * uEast + pl.y * uNorth) / Lm;
  float hh = moonDisp(fixedDir);
  if (uIsMars > 0.5) {
    vec2 om = marsOlympusDisp(fixedDir);
    hh = hh * (1.0 - om.y) + om.x;
  }
  float kk = (uBodyR + hh) / Lm;
  float yv = uBodyR * (hh - s2 / (uBodyR + Lm)) / Lm;
  transformed = vec3(pl.x * kk, yv, pl.y * kk);
  vLocal = pl;
#ifndef DEPTH_ONLY
  vBX = normalize(normalMatrix * vec3(1.0, 0.0, 0.0));
  vBY = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));
  vBZ = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));
#endif
}
`;
const PATCH_FRAG_HEAD = /* glsl */`
uniform vec3 uEast; uniform vec3 uUp; uniform vec3 uNorth; uniform float uRadius; uniform float uBump; uniform vec3 uTint; uniform float uBodyR; uniform float uIsMars;
varying vec2 vLocal;
varying vec3 vBX; varying vec3 vBY; varying vec3 vBZ;
${CORE_GLSL}
${SHADE_GLSL}
// close-up regolith: undulations + pebbles, in local metres (slope in local x/z, albedo factor)
void m_micro(vec2 x, float fp, inout vec2 Gl, inout float Am) {
  vec4 v; float w;
  w = smoothstep(1.2 * fp, 4.0 * fp, 0.5);  v = m_vnoise(vec3(x / 3.0, 7.5), 61u);  Gl += w * 0.08 * v.yz / 3.0;  Am += w * 0.05 * v.x;
  w = smoothstep(1.2 * fp, 4.0 * fp, 0.18); v = m_vnoise(vec3(x / 0.9, 3.5), 62u);  Gl += w * 0.03 * v.yz / 0.9;  Am += w * 0.04 * v.x;
  w = smoothstep(1.2 * fp, 4.0 * fp, 0.05); v = m_vnoise(vec3(x / 0.25, 1.5), 63u); Gl += w * 0.01 * v.yz / 0.25; Am += w * 0.05 * v.x;
  w = smoothstep(1.2 * fp, 4.0 * fp, 0.015); v = m_vnoise(vec3(x / 0.07, 2.5), 64u); Gl += w * 0.003 * v.yz / 0.07; Am += w * 0.06 * v.x;
  // pebbles (2 scales)
  for (int L = 0; L < 2; L++) {
    float cs = L == 0 ? 0.7 : 0.22;
    w = smoothstep(1.2 * fp, 4.0 * fp, cs * 0.12);
    if (w <= 0.0) continue;
    vec2 p = x / cs; vec2 c0 = floor(p);
    ivec2 base = ivec2(c0) + ivec2(step(vec2(0.5), p - c0)) - 1;
    for (int k = 0; k < 4; k++) {
      ivec2 cell = base + ivec2(k & 1, k >> 1);
      uint h = m_hash(ivec3(cell, 77 + L), 91u);
      if (m_rnd(h) > (L == 0 ? 0.28 : 0.45)) continue;
      float ox = m_rnd(h); float oy = m_rnd(h); float rr = m_rnd(h); float ab = m_rnd(h);
      vec2 d = p - (vec2(cell) + 0.25 + 0.5 * vec2(ox, oy));
      float rc = 0.06 + 0.17 * rr * rr;
      float t = length(d) / rc;
      if (t >= 1.0) continue;
      float sl = t / sqrt(max(1.0 - t * t, 0.04)) * 0.7;
      Gl -= w * sl * normalize(d + 1e-6);
      Am += w * (ab - 0.45) * 0.6 * smoothstep(1.0, 0.7, t);
      // dark contact ring / micro shadow
      Am -= w * 0.25 * smoothstep(0.85, 1.0, t);
    }
  }
}
float m_ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
`;
const PATCH_MAP = /* glsl */`
vec3 mDir = normalize(uBodyR * uUp + vLocal.x * uEast + vLocal.y * uNorth);
float mR = length(vLocal) / uRadius;
if (1.0 - smoothstep(0.8, 1.0, mR) < m_ign(gl_FragCoord.xy)) discard;
float mFp = max(length(fwidth(vLocal)), 0.002);
float mH; vec3 mG; float mAlb; float mMare;
moonShade(mDir, mFp, mH, mG, mAlb, mMare);
vec2 mGl = vec2(0.0); float mAm = 0.0;
m_micro(vLocal, mFp, mGl, mAm);
mG += mGl.x * uEast + mGl.y * uNorth;
diffuseColor.rgb = m_tint(mMare) * uTint * mAlb * clamp(1.0 + mAm, 0.45, 1.35) * 0.72;
if (uIsMars > 0.5) {
  vec3 od = (mDir - vec3(OLYMPUS_X, OLYMPUS_Y, 0.0)) * MARS_R;
  float omR = length(od);
  if (omR < 2260.0) {
    float eps = 2.0 / MARS_R;
    float h0 = marsOlympusDisp(mDir).x;
    float hx = marsOlympusDisp(normalize(mDir + uEast * eps)).x;
    float hz = marsOlympusDisp(normalize(mDir + uNorth * eps)).x;
    vec2 omSlope = vec2(hx - h0, hz - h0) * 0.5;
    mG = mG * (1.0 - 0.82 * smoothstep(2220.0, 1700.0, omR)) + omSlope.x * uEast + omSlope.y * uNorth;
    float shieldMask = smoothstep(2220.0, 1850.0, omR);
    float scarpBand = smoothstep(2210.0, 2040.0, omR) * smoothstep(1770.0, 1950.0, omR);
    float frostRim = smoothstep(565.0, 465.0, omR) * smoothstep(350.0, 435.0, omR);
    float calWall = smoothstep(445.0, 380.0, omR) * smoothstep(260.0, 330.0, omR);
    float calFloor = smoothstep(360.0, 275.0, omR);
    float lavaCore = smoothstep(138.0, 42.0, omR);
    float u = od.x * OLYMPUS_Y - od.y * OLYMPUS_X;
    float v = od.z;
    float lavaStreak = smoothstep(0.32, 0.85, sin(u * 0.015 + v * 0.011) * cos(v * 0.016 - u * 0.009));
    vec3 colShield = mix(vec3(0.94, 0.36, 0.16), vec3(0.32, 0.14, 0.09), lavaStreak * 0.68);
    float strata = 0.5 + 0.5 * sin(h0 * 0.18 + u * 0.006);
    vec3 colScarp = mix(vec3(0.42, 0.17, 0.09), vec3(1.06, 0.52, 0.25), strata);
    vec3 omCol = mix(diffuseColor.rgb, colShield * clamp(0.65 + 0.35 * mAlb * 3.2, 0.5, 1.3), shieldMask);
    omCol = mix(omCol, colScarp, scarpBand * 0.88);
    omCol = mix(omCol, vec3(1.22, 1.08, 0.98), frostRim * 0.72);
    omCol = mix(omCol, vec3(0.26, 0.12, 0.08), calWall * 0.78);
    omCol = mix(omCol, vec3(0.20, 0.10, 0.07), calFloor * 0.72);
    float magmaCrack = smoothstep(0.22, 0.82, sin(u * 0.085 + v * 0.055) * cos(u * 0.065 - v * 0.095) + 0.5 * sin(omR * 0.12));
    omCol = mix(omCol, vec3(1.45, 0.38, 0.06), lavaCore * (0.45 + 0.55 * magmaCrack));
    diffuseColor.rgb = omCol;
    totalEmissiveRadiance += vec3(3.2, 0.75, 0.08) * lavaCore * (0.35 + 0.65 * magmaCrack);
  }
}
`;
const PATCH_NORMAL = /* glsl */`
{
  vec3 Gt = mG - mDir * dot(mG, mDir);
  vec3 Nf = normalize(mDir - Gt * uBump);
  normal = normalize(vBX * dot(Nf, uEast) + vBY * dot(Nf, uUp) + vBZ * dot(Nf, uNorth));
}
`;

function patchGeometry(R, NR, NA) {
  const pos = new Float32Array((1 + NR * NA) * 3);
  const nrm = new Float32Array((1 + NR * NA) * 3);
  for (let i = 0; i < nrm.length; i += 3) nrm[i + 1] = 1;
  for (let i = 1; i <= NR; i++) {
    const r = R * (i / NR) ** 2;
    for (let j = 0; j < NA; j++) {
      const a = (j / NA) * Math.PI * 2;
      const k = (1 + (i - 1) * NA + j) * 3;
      pos[k] = Math.cos(a) * r; pos[k + 2] = Math.sin(a) * r;
    }
  }
  const idx = [];
  for (let j = 0; j < NA; j++) idx.push(0, 1 + ((j + 1) % NA), 1 + j);
  for (let i = 1; i < NR; i++) {
    const a0 = 1 + (i - 1) * NA, b0 = 1 + i * NA;
    for (let j = 0; j < NA; j++) {
      const j1 = (j + 1) % NA;
      idx.push(a0 + j, a0 + j1, b0 + j, a0 + j1, b0 + j1, b0 + j);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -400, 0), R * 1.08);
  g.boundingBox = new THREE.Box3(new THREE.Vector3(-R, -1700, -R), new THREE.Vector3(R, 3200, R));
  return g;
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function rockGeometry(detail, seed) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    let d = 1 + 0.35 * vnoise(n.x * 1.6 + seed, n.y * 1.6, n.z * 1.6, 70) + 0.15 * vnoise(n.x * 4 + seed, n.y * 4, n.z * 4, 71) + 0.05 * vnoise(n.x * 9, n.y * 9 + seed, n.z * 9, 72);
    // a couple of flat fracture planes
    const f1 = n.x * 0.6 + n.y * 0.5 + n.z * 0.62; if (f1 > 0.55) d *= 0.55 / f1 + (1 - 0.55 / f1) * 0.25;
    const f2 = -n.x * 0.7 + n.z * 0.7; if (f2 > 0.6) d *= 0.6 / f2 + (1 - 0.6 / f2) * 0.3;
    v.copy(n).multiplyScalar(d);
    v.y *= 0.62;
    if (v.y < -0.25) v.y = -0.25 + (v.y + 0.25) * 0.3;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); // non-indexed => faceted, rock-like
  return g;
}

/**
 * Near-field landing terrain: a 25 km disc lying exactly on the curved Moon surface, centred at
 * the local origin with +Y up. Local frame: x = uEast, y = uUp, z = uNorth (Moon-fixed basis).
 * To place it in the world: position = moonWorldCentre + R_M * (moon rotation * uUp) and orient
 * it so local axes map to the rotated (uEast, uUp, uNorth).
 *
 * mesh.userData.uniforms: { uEast, uUp, uNorth, uRadius, uBump }
 * mesh.userData.rebuildRocks(): call after changing uEast/uUp/uNorth (rocks are re-placed with
 *   moonHeight so they sit on the displaced surface; rock layout is seeded by the basis).
 * mesh.userData.setBasis(up[, east]): convenience – builds an orthonormal basis from a Moon-fixed
 *   up vector (east = normalize(Ypole x up) by default), updates uniforms and rebuilds rocks.
 * mesh.userData.localHeight(x, z): local y of the surface at local (x, z) (same math as the GPU).
 */
export function createMoonSurface() {
  const uniforms = {
    uEast: { value: new THREE.Vector3(1, 0, 0) },
    uUp: { value: new THREE.Vector3(0, 1, 0) },
    uNorth: { value: new THREE.Vector3(0, 0, 1) },
    uRadius: { value: PATCH_R },
    uBump: { value: 1 },
    uTint: { value: new THREE.Vector3(1, 1, 1) },
    uBodyR: { value: R_M },
    uIsMars: { value: 0 },
  };
  const geo = patchGeometry(PATCH_R, 420, 520);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, envMapIntensity: 0 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\n${PATCH_VERT_HEAD}`)
      .replace('#include <begin_vertex>', PATCH_BEGIN);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${PATCH_FRAG_HEAD}`)
      .replace('#include <map_fragment>', PATCH_MAP)
      .replace('#include <normal_fragment_maps>', PATCH_NORMAL)
      .replace('#include <lights_physical_pars_fragment>', lunarLightsChunk());
  };
  mat.customProgramCacheKey = () => 'moon-patch-v2';

  const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  depthMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\n#define DEPTH_ONLY\n${PATCH_VERT_HEAD}`)
      .replace('#include <begin_vertex>', PATCH_BEGIN);
  };
  depthMat.customProgramCacheKey = () => 'moon-patch-depth-v2';

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'moonSurface';
  mesh.customDepthMaterial = depthMat;
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  mesh.userData.uniforms = uniforms;

  const localHeight = (x, z) => {
    const E = uniforms.uEast.value, U = uniforms.uUp.value, N = uniforms.uNorth.value;
    const Rb = uniforms.uBodyR.value || R_M;
    const body = uniforms.uIsMars.value > 0.5 ? 'mars' : 'moon';
    const s2 = x * x + z * z;
    const L = Math.sqrt(Rb * Rb + s2);
    const dx = (Rb * U.x + x * E.x + z * N.x) / L, dy = (Rb * U.y + x * E.y + z * N.y) / L, dz = (Rb * U.z + x * E.z + z * N.z) / L;
    const h = moonHeight(dx, dy, dz, body);
    return Rb * (h - s2 / (Rb + L)) / L;
  };
  mesh.userData.localHeight = localHeight;

  // ---- rock / boulder field
  const rockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0, envMapIntensity: 0, flatShading: true });
  rockMat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_physical_pars_fragment>', lunarLightsChunk());
  };
  rockMat.customProgramCacheKey = () => 'moon-rock-v1';
  const shapesS = [rockGeometry(1, 0.0), rockGeometry(1, 3.7), rockGeometry(1, 7.1)];
  const shapesB = [rockGeometry(2, 1.3), rockGeometry(2, 5.9)];
  const NS = 1600, NB = 140;
  const smallRocks = shapesS.map((g) => new THREE.InstancedMesh(g, rockMat, NS));
  const boulders = shapesB.map((g) => new THREE.InstancedMesh(g, rockMat, NB));
  for (const im of [...smallRocks, ...boulders]) {
    im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
    im.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.add(im);
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  const col = new THREE.Color();
  const sizeDraw = (u, smin, smax, k) => smin / Math.pow(1 - u * (1 - Math.pow(smin / smax, k)), 1 / k);
  const place = (im, i, rnd, x, z, s) => {
    const y = localHeight(x, z);
    e.set((rnd() - 0.5) * 0.5, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.5);
    q.setFromEuler(e);
    const ax = 0.8 + rnd() * 0.5, az = 0.8 + rnd() * 0.5;
    sc.set(s * ax, s * (0.7 + rnd() * 0.5), s * az);
    ps.set(x, y + s * 0.12, z);
    m4.compose(ps, q, sc);
    im.setMatrixAt(i, m4);
    const b = 0.22 + rnd() * 0.12;
    col.setRGB(b, b * 0.975, b * 0.95);
    im.setColorAt(i, col);
  };
  const rebuildRocks = () => {
    const U = uniforms.uUp.value;
    const rnd = mulberry(Math.floor((U.x * 73856093 + U.y * 19349663 + U.z * 83492791) * 1000));
    // clusters near young craters + a sparse background
    const clusters = [];
    for (let c = 0; c < 26; c++) {
      const r = 1500 * Math.sqrt(rnd()), a = rnd() * Math.PI * 2;
      clusters.push([Math.cos(a) * r, Math.sin(a) * r, 25 + rnd() * 110]);
    }
    for (const im of smallRocks) {
      for (let i = 0; i < NS; i++) {
        let x, z;
        if (rnd() < 0.55) {
          const r = 900 * Math.pow(rnd(), 1.6), a = rnd() * Math.PI * 2; x = Math.cos(a) * r; z = Math.sin(a) * r;
        } else {
          const cl = clusters[Math.floor(rnd() * clusters.length)];
          const r = cl[2] * Math.sqrt(rnd()), a = rnd() * Math.PI * 2; x = cl[0] + Math.cos(a) * r; z = cl[1] + Math.sin(a) * r;
        }
        place(im, i, rnd, x, z, sizeDraw(rnd(), 0.06, 1.2, 2.2));
      }
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
    for (const im of boulders) {
      for (let i = 0; i < NB; i++) {
        const cl = clusters[Math.floor(rnd() * clusters.length)];
        let x, z;
        if (rnd() < 0.6) { const r = cl[2] * 1.2 * Math.sqrt(rnd()), a = rnd() * Math.PI * 2; x = cl[0] + Math.cos(a) * r; z = cl[1] + Math.sin(a) * r; }
        else { const r = 2500 * Math.sqrt(rnd()), a = rnd() * Math.PI * 2; x = Math.cos(a) * r; z = Math.sin(a) * r; }
        // keep a clear 40 m landing area at the centre
        if (Math.hypot(x, z) < 40) { x += 60; }
        place(im, i, rnd, x, z, sizeDraw(rnd(), 0.8, 5.5, 1.8));
      }
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
  };
  mesh.userData.rebuildRocks = rebuildRocks;
  mesh.userData.setBasis = (up, east) => {
    const U = uniforms.uUp.value.copy(up).normalize();
    const E = uniforms.uEast.value;
    if (east) E.copy(east); else E.set(0, 1, 0).cross(U);
    if (E.lengthSq() < 1e-8) E.set(1, 0, 0).cross(U);
    E.sub(U.clone().multiplyScalar(E.dot(U))).normalize();
    uniforms.uNorth.value.copy(E).cross(U).negate(); // right-handed: x=E, y=U, z=N with E x U = -N -> N = U x E
    rebuildRocks();
  };
  rebuildRocks();
  return mesh;
}

function makeMarsSignTexture(title, sub, badge, borderHex = '#f97316') {
  const cv = document.createElement('canvas');
  cv.width = 1024;
  cv.height = 384;
  const ctx = cv.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 0, cv.height);
  g.addColorStop(0, '#1c100c');
  g.addColorStop(0.5, '#2b140d');
  g.addColorStop(1, '#140906');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cv.width, cv.height);

  ctx.strokeStyle = borderHex;
  ctx.lineWidth = 14;
  ctx.strokeRect(14, 14, cv.width - 28, cv.height - 28);

  ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
  ctx.lineWidth = 4;
  ctx.strokeRect(28, 28, cv.width - 56, cv.height - 56);

  ctx.fillStyle = '#fde047';
  ctx.font = '900 66px system-ui, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, cv.width / 2, 118);

  ctx.fillStyle = '#fed7aa';
  ctx.font = '700 36px system-ui, Segoe UI, sans-serif';
  ctx.fillText(sub, cv.width / 2, 196);

  ctx.fillStyle = 'rgba(249, 115, 22, 0.28)';
  ctx.fillRect(90, 244, cv.width - 180, 82);
  ctx.strokeStyle = '#fb923c';
  ctx.lineWidth = 4;
  ctx.strokeRect(90, 244, cv.width - 180, 82);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 38px system-ui, Segoe UI, sans-serif';
  ctx.fillText(badge, cv.width / 2, 298);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 3D landmarks for Olympus Mons on Mars:
 * 1) Base Camp Overlook Signpost & Trailhead Beacons (near r = 2,225 m)
 * 2) West Summit Caldera Rim Landing Pad & Obelisk Monument (at r = 455 m, h ≈ 1,428 m)
 * 3) Central Caldera Molten Lava Lake & Fumarole Vents (at r = 0 m, h ≈ 1,080 m)
 */
export function createOlympusMonsLandmarks() {
  const group = new THREE.Group();
  group.name = 'olympusMonsLandmarks';
  group.visible = false;

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.78, roughness: 0.32 });
  const darkRockMat = new THREE.MeshStandardMaterial({ color: 0x3b1d14, roughness: 0.92, metalness: 0.08, flatShading: true });
  const goldGlowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf97316, emissiveIntensity: 3.5, roughness: 0.25 });
  const cyanGlowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 3.8, roughness: 0.2 });

  // ---- 1. Base Overlook Signboard & Trail Beacons
  const basePsi = OLYMPUS_PSI - 2225 / R_MARS;
  const baseZ = -16;
  const baseH = moonHeight(Math.sin(basePsi), Math.cos(basePsi), baseZ / R_MARS, 'mars');
  const baseNode = new THREE.Group();
  group.add(baseNode);

  const signGroup = new THREE.Group();
  signGroup.rotation.y = -0.35;
  baseNode.add(signGroup);

  for (const sx of [-4.2, 4.2]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 6.2, 12), metalMat);
    post.position.set(sx, 3.1, 0);
    post.castShadow = true;
    signGroup.add(post);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), goldGlowMat);
    lamp.position.set(sx, 6.4, 0);
    signGroup.add(lamp);
  }
  const boardTex = makeMarsSignTexture(
    '🌋 NÚI LỬA OLYMPUS MONS',
    'CAO 21,9 KM · RỘNG 600 KM · LỚN NHẤT HỆ MẶT TRỜI',
    '⬆️ ĐƯỜNG LÊN ĐỈNH & MIỆNG NÚI LỬA CALDERA →',
    '#f97316'
  );
  const boardMat = new THREE.MeshStandardMaterial({
    map: boardTex,
    emissive: 0xffffff,
    emissiveMap: boardTex,
    emissiveIntensity: 0.45,
    roughness: 0.4,
    metalness: 0.2,
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(10.4, 3.9, 0.32), [metalMat, metalMat, metalMat, metalMat, boardMat, boardMat]);
  board.position.set(0, 4.2, 0);
  board.castShadow = true;
  signGroup.add(board);

  // ---- 2. Summit Caldera Rim Landing Pad & Monument Obelisk (r = 455 m west of center)
  const rimPsi = OLYMPUS_PSI - 455 / R_MARS;
  const rimZ = 0;
  const rimH = moonHeight(Math.sin(rimPsi), Math.cos(rimPsi), 0, 'mars');
  const rimNode = new THREE.Group();
  group.add(rimNode);

  const padRing = new THREE.Mesh(
    new THREE.RingGeometry(12.5, 14.2, 48),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
  );
  padRing.rotation.x = -Math.PI / 2;
  padRing.position.y = 0.25;
  rimNode.add(padRing);

  const padInnerRing = new THREE.Mesh(
    new THREE.RingGeometry(6.2, 7.0, 36),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
  );
  padInnerRing.rotation.x = -Math.PI / 2;
  padInnerRing.position.y = 0.26;
  rimNode.add(padInnerRing);

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), i % 2 === 0 ? cyanGlowMat : goldGlowMat);
    led.position.set(Math.cos(a) * 14.2, 0.4, Math.sin(a) * 14.2);
    rimNode.add(led);
  }

  // Summit Obelisk & Signboard at z = -19 m on the rim
  const obeliskGroup = new THREE.Group();
  obeliskGroup.position.set(0, 0, -19);
  rimNode.add(obeliskGroup);

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.6, 1.8, 8), darkRockMat);
  plinth.position.y = 0.9;
  obeliskGroup.add(plinth);

  const obelisk = new THREE.Mesh(new THREE.ConeGeometry(1.45, 12.5, 4), metalMat);
  obelisk.position.y = 8.0;
  obelisk.castShadow = true;
  obeliskGroup.add(obelisk);

  const summitCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.35, 0), goldGlowMat);
  summitCrystal.position.y = 15.6;
  obeliskGroup.add(summitCrystal);

  const rimTex = makeMarsSignTexture(
    '🏆 ĐỈNH OLYMPUS MONS',
    'ĐỘ CAO ĐỈNH: 21.900 M · MIỆNG NÚI LỬA CALDERA',
    '🎯 BÃI ĐÁP ĐỈNH NÚI LỬA SAO HỎA',
    '#eab308'
  );
  const rimBoardMat = new THREE.MeshStandardMaterial({
    map: rimTex,
    emissive: 0xffffff,
    emissiveMap: rimTex,
    emissiveIntensity: 0.5,
    roughness: 0.35,
    metalness: 0.25,
  });
  const rimBoard = new THREE.Mesh(new THREE.BoxGeometry(8.8, 3.3, 0.28), [metalMat, metalMat, metalMat, metalMat, rimBoardMat, rimBoardMat]);
  rimBoard.position.set(0, 3.6, 3.2);
  obeliskGroup.add(rimBoard);

  // ---- 3. Central Caldera Molten Lava Lake & Volcanic Vents (at OLYMPUS_PSI)
  const calPsi = OLYMPUS_PSI;
  const calH = moonHeight(Math.sin(calPsi), Math.cos(calPsi), 0, 'mars');
  const calNode = new THREE.Group();
  group.add(calNode);

  const lavaMat = new THREE.MeshBasicMaterial({
    color: 0xff4500,
    side: THREE.DoubleSide,
  });
  const lavaLake = new THREE.Mesh(new THREE.CircleGeometry(68, 48), lavaMat);
  lavaLake.rotation.x = -Math.PI / 2;
  lavaLake.position.y = 1.2;
  calNode.add(lavaLake);

  const lavaCoreMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    side: THREE.DoubleSide,
  });
  const lavaCore = new THREE.Mesh(new THREE.CircleGeometry(28, 36), lavaCoreMat);
  lavaCore.rotation.x = -Math.PI / 2;
  lavaCore.position.y = 1.45;
  calNode.add(lavaCore);

  const lavaRingMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const lavaRing = new THREE.Mesh(new THREE.RingGeometry(42, 52, 48), lavaRingMat);
  lavaRing.rotation.x = -Math.PI / 2;
  lavaRing.position.y = 1.35;
  calNode.add(lavaRing);

  // Jagged volcanic fumarole cones around the lava lake
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    const rad = 64 + (i % 3) * 14;
    const hSpire = 9 + (i % 4) * 5;
    const spire = new THREE.Mesh(new THREE.ConeGeometry(4.5 + (i % 3) * 1.8, hSpire, 6), darkRockMat);
    spire.position.set(Math.cos(a) * rad, hSpire * 0.42, Math.sin(a) * rad);
    calNode.add(spire);
  }

  const spots = [
    { id: 'base', psi: basePsi, z: baseZ, h: baseH, node: baseNode },
    { id: 'rim', psi: rimPsi, z: rimZ, h: rimH, node: rimNode },
    { id: 'caldera', psi: calPsi, z: 0, h: calH, node: calNode },
  ];

  const update = (t) => {
    summitCrystal.rotation.y = t * 1.6;
    summitCrystal.position.y = 15.6 + Math.sin(t * 2.5) * 0.45;
    const pulse = 0.85 + 0.15 * Math.sin(t * 3.2);
    lavaCore.scale.setScalar(0.92 + 0.12 * Math.sin(t * 2.4));
    lavaRing.scale.setScalar(0.96 + 0.08 * Math.cos(t * 1.9));
    lavaRingMat.opacity = 0.65 * pulse;
  };

  return { group, spots, update, rimPsi, rimH, calPsi, calH, basePsi, baseH };
}

/**
 * 3D Overhead Asteroid Belt canopy for Ceres so Ceres sits directly underneath the rocky Asteroid Belt in 3D flight view.
 */
export function createCeresAsteroidBelt() {
  const group = new THREE.Group();
  group.name = 'ceresAsteroidBelt';
  group.visible = false;

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0.08,
    flatShading: true,
  });

  const rnd = mulberry(98765);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  const N_PER_SHAPE = 180;

  for (let sIdx = 0; sIdx < 3; sIdx++) {
    const g = rockGeometry(1, 3.1 + sIdx * 2.7);
    const im = new THREE.InstancedMesh(g, rockMat, N_PER_SHAPE);
    im.frustumCulled = false;
    for (let i = 0; i < N_PER_SHAPE; i++) {
      const x = (rnd() - 0.5) * 32000;
      const z = (rnd() - 0.5) * 18000;
      const archDrop = (x * x) / (2 * 95000);
      const y = 950 + Math.pow(rnd(), 1.35) * 6800 - archDrop;
      dummy.position.set(x, y, z);
      dummy.rotation.set(rnd() * Math.PI * 2, rnd() * Math.PI * 2, rnd() * Math.PI * 2);
      const sz = rnd() < 0.08 ? 85 + rnd() * 115 : 16 + Math.pow(rnd(), 1.8) * 64;
      dummy.scale.set(
        sz * (0.75 + rnd() * 0.55),
        sz * (0.62 + rnd() * 0.45),
        sz * (0.75 + rnd() * 0.55)
      );
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);

      const shade = 0.52 + rnd() * 0.42;
      const warm = (rnd() - 0.3) * 0.08;
      col.setRGB(shade + warm, shade + warm * 0.4, shade - warm * 0.3);
      im.setColorAt(i, col);
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    group.add(im);
  }

  return group;
}
