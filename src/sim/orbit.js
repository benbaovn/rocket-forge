// Orbital mechanics core:
// - Heliocentric hierarchy: Sun -> (Mercury, Venus, Earth, Mars); Earth -> (Moon, ISS); Mars -> (Phobos, Deimos).
// - Physics integration runs in the Earth-centred non-rotating (ECI) frame so launchpad/Earth orbits have maximum precision,
//   with exact frame-acceleration transformation inside any planet/moon SOI.
import { MU_E, MU_M, R_E, R_M, MOON_A, MOON_N, MOON_PHASE0, MOON_SOI, OMEGA_E, ISS_R, ISS_N, ATM_TOP, BODIES, SATELLITE_BODIES } from './constants.js';

export const TAU = Math.PI * 2;

/** wrap angle to (-PI, PI] */
export function wrapPi(a) { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; }

/** downrange angle of a vector (clockwise from +Y) */
export function angOf(x, y) { return Math.atan2(x, y); }

// ---------------------------------------------------------------- hierarchical rails (Heliocentric + ECI)
export function bodyAngle(name, t) {
  const B = BODIES[name];
  if (!B || name === 'earth') return OMEGA_E * t;
  if (name === 'sun') return B.omega * t;
  return B.phase0 + B.n * t;
}

/** Position relative to the Sun (Heliocentric frame, Sun at 0,0,0) */
export function helioPos(name, t, out = { x: 0, y: 0, z: 0 }) {
  let x = 0, y = 0;
  let cur = BODIES[name];
  while (cur && cur.parent) {
    const a = cur.phase0 + cur.n * t;
    x += cur.a * Math.sin(a);
    y += cur.a * Math.cos(a);
    cur = BODIES[cur.parent];
  }
  out.x = x; out.y = y; out.z = 0;
  return out;
}

/** Velocity relative to the Sun (Heliocentric frame) */
export function helioVel(name, t, out = { x: 0, y: 0, z: 0 }) {
  let vx = 0, vy = 0;
  let cur = BODIES[name];
  while (cur && cur.parent) {
    const a = cur.phase0 + cur.n * t, s = cur.a * cur.n;
    vx += s * Math.cos(a);
    vy += -s * Math.sin(a);
    cur = BODIES[cur.parent];
  }
  out.x = vx; out.y = vy; out.z = 0;
  return out;
}

/** Acceleration relative to the Sun (Heliocentric frame) */
export function helioAcc(name, t, out = { x: 0, y: 0, z: 0 }) {
  let ax = 0, ay = 0;
  let cur = BODIES[name];
  while (cur && cur.parent) {
    const a = cur.phase0 + cur.n * t, c = -cur.a * cur.n * cur.n;
    ax += c * Math.sin(a);
    ay += c * Math.cos(a);
    cur = BODIES[cur.parent];
  }
  out.x = ax; out.y = ay; out.z = 0;
  return out;
}

const _ep = { x: 0, y: 0, z: 0 }, _ev = { x: 0, y: 0, z: 0 }, _ea = { x: 0, y: 0, z: 0 };

/** Position in Earth-centred inertial (ECI) frame */
export function bodyPos(name, t, out = { x: 0, y: 0, z: 0 }) {
  if (!name || name === 'earth' || !BODIES[name]) { out.x = 0; out.y = 0; out.z = 0; return out; }
  helioPos(name, t, out);
  helioPos('earth', t, _ep);
  out.x -= _ep.x; out.y -= _ep.y; out.z -= _ep.z;
  return out;
}

/** Velocity in Earth-centred inertial (ECI) frame */
export function bodyVel(name, t, out = { x: 0, y: 0, z: 0 }) {
  if (!name || name === 'earth' || !BODIES[name]) { out.x = 0; out.y = 0; out.z = 0; return out; }
  helioVel(name, t, out);
  helioVel('earth', t, _ev);
  out.x -= _ev.x; out.y -= _ev.y; out.z -= _ev.z;
  return out;
}

/** Rail acceleration in Earth-centred inertial (ECI) frame */
export function bodyAcc(name, t, out = { x: 0, y: 0, z: 0 }) {
  if (!name || name === 'earth' || !BODIES[name]) { out.x = 0; out.y = 0; out.z = 0; return out; }
  helioAcc(name, t, out);
  helioAcc('earth', t, _ea);
  out.x -= _ea.x; out.y -= _ea.y; out.z -= _ea.z;
  return out;
}

export function moonAngle(t) { return bodyAngle('moon', t); }
export function moonPos(t, out = { x: 0, y: 0, z: 0 }) { return bodyPos('moon', t, out); }
export function moonVel(t, out = { x: 0, y: 0, z: 0 }) { return bodyVel('moon', t, out); }

export class RailOrbit {
  /** circular orbit on rails around Earth (used for the ISS) */
  constructor(radius, phase0) { this.r = radius; this.n = Math.sqrt(MU_E / radius ** 3); this.phase0 = phase0; }
  angle(t) { return this.phase0 + this.n * t; }
  pos(t, out = { x: 0, y: 0, z: 0 }) { const a = this.angle(t); out.x = this.r * Math.sin(a); out.y = this.r * Math.cos(a); out.z = 0; return out; }
  vel(t, out = { x: 0, y: 0, z: 0 }) { const a = this.angle(t), s = this.r * this.n; out.x = s * Math.cos(a); out.y = -s * Math.sin(a); out.z = 0; return out; }
}

// ---------------------------------------------------------------- gravity & SOI
const _m = { x: 0, y: 0, z: 0 }, _ba = { x: 0, y: 0, z: 0 };

/** which body dominates: checks inner moons first (Phobos, Deimos, Moon), then planets & Sun, else 'earth' */
export function refBody(x, y, z, t) {
  for (let i = 0; i < SATELLITE_BODIES.length; i++) {
    const name = SATELLITE_BODIES[i];
    const B = BODIES[name];
    bodyPos(name, t, _m);
    const dx = x - _m.x, dy = y - _m.y, dz = z - _m.z;
    if (dx * dx + dy * dy + dz * dz < B.soi * B.soi) return name;
  }
  return 'earth';
}

/** gravitational acceleration at ECI position (x,y,z), time t → out */
export function gravity(x, y, z, t, out) {
  const ref = refBody(x, y, z, t);
  if (ref !== 'earth') {
    const B = BODIES[ref];
    bodyPos(ref, t, _m);
    bodyAcc(ref, t, _ba);
    const dx = x - _m.x, dy = y - _m.y, dz = z - _m.z;
    const d2 = dx * dx + dy * dy + dz * dz, d = Math.sqrt(d2);
    // Inside a gas giant (d < B.R), use smooth interior shell gravity (-mu / R^3) so spacecraft can pass straight through the center without a singularity
    const dEff = B.gasGiant ? Math.max(d, B.R) : Math.max(d, 1);
    const kB = -B.mu / (dEff * dEff * dEff);
    out.x = _ba.x + kB * dx;
    out.y = _ba.y + kB * dy;
    out.z = _ba.z + kB * dz;
    return out;
  }
  const r2 = x * x + y * y + z * z, r = Math.sqrt(r2);
  const kE = -MU_E / (r2 * r);
  let gx = kE * x, gy = kE * y, gz = kE * z;
  // Lunar 3-body tidal perturbation in Earth SOI
  bodyPos('moon', t, _m);
  const dx = x - _m.x, dy = y - _m.y, dz = z - _m.z;
  const d2 = dx * dx + dy * dy + dz * dz, d = Math.sqrt(d2);
  const kM = -MU_M / (d2 * d);
  const kI = MU_M / (MOON_A ** 3);
  gx += kM * dx + kI * _m.x;
  gy += kM * dy + kI * _m.y;
  gz += kM * dz;
  out.x = gx;
  out.y = gy;
  out.z = gz;
  return out;
}

export function bodyInfo(name) {
  return BODIES[name] || BODIES.earth;
}

/** body centre / velocity at time t in ECI */
export function bodyState(name, t, p = { x: 0, y: 0, z: 0 }, v = { x: 0, y: 0, z: 0 }) {
  if (name && name !== 'earth' && BODIES[name]) {
    bodyPos(name, t, p);
    bodyVel(name, t, v);
  } else {
    p.x = p.y = p.z = 0;
    v.x = v.y = v.z = 0;
  }
  return { p, v };
}

/** body rotation angle (clockwise) at t */
export function bodyRotation(name, t) {
  const B = BODIES[name];
  if (!B || name === 'earth') return OMEGA_E * t;
  if (name === 'mars' || name === 'sun') return B.omega * t;
  return bodyAngle(name, t);
}
export function bodyOmega(name) {
  const B = BODIES[name];
  return B ? B.omega : OMEGA_E;
}

// ---------------------------------------------------------------- orbital elements (in-plane)
/**
 * Osculating elements from relative position/velocity (2-D, z ignored).
 * Returns { a, e, pe, ap, period, energy, h, argPe, nu, tPe, tAp }  (pe/ap are radii)
 */
export function elements(rx, ry, vx, vy, mu) {
  const r = Math.hypot(rx, ry), v2 = vx * vx + vy * vy;
  const energy = v2 / 2 - mu / r;
  const h = rx * vy - ry * vx;                    // z of r×v  (negative = clockwise / prograde for us)
  const rv = rx * vx + ry * vy;
  const ex = ((v2 - mu / r) * rx - rv * vx) / mu;
  const ey = ((v2 - mu / r) * ry - rv * vy) / mu;
  const e = Math.hypot(ex, ey);
  const p = h * h / mu;
  const pe = p / (1 + e);
  const a = Math.abs(energy) > 1e-9 ? -mu / (2 * energy) : Infinity;
  const ap = e < 1 ? p / (1 - e) : Infinity;
  const period = e < 1 ? TAU * Math.sqrt(a ** 3 / mu) : Infinity;
  // true anomaly (sign follows the direction of motion)
  const argPe = Math.atan2(ex, ey);
  let nu = angOf(rx, ry) - argPe;
  if (h > 0) nu = -nu;                             // counter-clockwise orbits: flip
  nu = wrapPi(nu);
  // time from periapsis
  let tPe = Infinity, tAp = Infinity;
  if (e < 1 && e > 1e-6) {
    const E = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(nu / 2));
    const M = E - e * Math.sin(E);
    const n = TAU / period;
    let tSince = M / n; if (tSince < 0) tSince += period;
    tPe = period - tSince;                          // time until next periapsis
    tAp = (period / 2 - tSince + period) % period;  // time until apoapsis
  } else if (e >= 1) {
    const F = 2 * Math.atanh(Math.sqrt((e - 1) / (e + 1)) * Math.tan(nu / 2));
    const M = e * Math.sinh(F) - F;
    const n = Math.sqrt(mu / Math.abs(a) ** 3);
    tPe = -M / n; // negative if periapsis already passed
  }
  return { a, e, pe, ap, period, energy, h, argPe, nu, tPe, tAp };
}

// ---------------------------------------------------------------- integration
const _a = { x: 0, y: 0, z: 0 };
/**
 * RK4 step of a point mass under gravity + constant extra acceleration (ax,ay,az).
 * s = { x,y,z, vx,vy,vz } mutated in place.
 */
export function rk4(s, t, h, ax = 0, ay = 0, az = 0) {
  const { x, y, z, vx, vy, vz } = s;
  gravity(x, y, z, t, _a);
  const k1x = vx, k1y = vy, k1z = vz, k1vx = _a.x + ax, k1vy = _a.y + ay, k1vz = _a.z + az;
  gravity(x + k1x * h / 2, y + k1y * h / 2, z + k1z * h / 2, t + h / 2, _a);
  const k2x = vx + k1vx * h / 2, k2y = vy + k1vy * h / 2, k2z = vz + k1vz * h / 2;
  const k2vx = _a.x + ax, k2vy = _a.y + ay, k2vz = _a.z + az;
  gravity(x + k2x * h / 2, y + k2y * h / 2, z + k2z * h / 2, t + h / 2, _a);
  const k3x = vx + k2vx * h / 2, k3y = vy + k2vy * h / 2, k3z = vz + k2vz * h / 2;
  const k3vx = _a.x + ax, k3vy = _a.y + ay, k3vz = _a.z + az;
  gravity(x + k3x * h, y + k3y * h, z + k3z * h, t + h, _a);
  const k4x = vx + k3vx * h, k4y = vy + k3vy * h, k4z = vz + k3vz * h;
  const k4vx = _a.x + ax, k4vy = _a.y + ay, k4vz = _a.z + az;
  s.x += h / 6 * (k1x + 2 * k2x + 2 * k3x + k4x);
  s.y += h / 6 * (k1y + 2 * k2y + 2 * k3y + k4y);
  s.z += h / 6 * (k1z + 2 * k2z + 2 * k3z + k4z);
  s.vx += h / 6 * (k1vx + 2 * k2vx + 2 * k3vx + k4vx);
  s.vy += h / 6 * (k1vy + 2 * k2vy + 2 * k3vy + k4vy);
  s.vz += h / 6 * (k1vz + 2 * k2vz + 2 * k3vz + k4vz);
}

/** a sensible coast step size for the current position */
export function coastStep(x, y, z, t) {
  const r = Math.hypot(x, y, z);
  let tMin = Math.sqrt(r ** 3 / MU_E);
  for (let i = 0; i < SATELLITE_BODIES.length; i++) {
    const name = SATELLITE_BODIES[i];
    const B = BODIES[name];
    bodyPos(name, t, _m);
    const d = Math.max(B.R * 0.4, Math.hypot(x - _m.x, y - _m.y, z - _m.z));
    const tB = Math.sqrt(d ** 3 / B.mu);
    if (tB < tMin) tMin = tB;
  }
  return Math.max(0.05, tMin * 0.012);
}

/**
 * Predict a coasting trajectory.
 * opts: { maxTime, maxSteps, target: RailOrbit|null, stopAtSurface: true }
 * Returns { pts: [{x,y,t,ref}], moonCA: {d,t,i}, bodyCA, soiT, soiBody, impact: {body,t,i}|null, targetCA: {d,t,i}, earthPe }
 */
export function predict(x, y, z, vx, vy, vz, t0, opts = {}) {
  const maxTime = opts.maxTime ?? 20000, maxSteps = opts.maxSteps ?? 3000;
  const s = { x, y, z, vx, vy, vz };
  const startRef = refBody(x, y, z, t0);
  const pts = [{ x, y, z, t: t0, ref: startRef }];
  let t = t0;
  const bodyCA = {};
  for (let k = 0; k < SATELLITE_BODIES.length; k++) {
    bodyCA[SATELLITE_BODIES[k]] = { d: Infinity, t: 0, i: 0 };
  }
  const targetCA = { d: Infinity, t: 0, i: 0, rv: 0 };
  let soiT = null, soiBody = null, impact = null, earthPe = Infinity;
  const bp = { x: 0, y: 0, z: 0 }, tp = { x: 0, y: 0, z: 0 }, tv = { x: 0, y: 0, z: 0 };
  const sampleEvery = opts.sampleEvery ?? 1;
  for (let i = 1; i <= maxSteps && t - t0 < maxTime; i++) {
    let h = coastStep(s.x, s.y, s.z, t) * (opts.stepScale ?? 1);
    if (opts.target) h = Math.min(h, opts.targetStep ?? h);
    rk4(s, t, h);
    t += h;
    const r = Math.hypot(s.x, s.y, s.z);
    earthPe = Math.min(earthPe, r);

    let curRef = 'earth';
    let refBx = 0, refBy = 0, refBz = 0;
    let hitBody = null;

    for (let k = 0; k < SATELLITE_BODIES.length; k++) {
      const name = SATELLITE_BODIES[k];
      const B = BODIES[name];
      bodyPos(name, t, bp);
      const db = Math.hypot(s.x - bp.x, s.y - bp.y, s.z - bp.z);
      const ca = bodyCA[name];
      if (db < ca.d) { ca.d = db; ca.t = t; ca.i = pts.length; }
      if ( curRef === 'earth' && db < B.soi) {
        curRef = name;
        refBx = bp.x; refBy = bp.y; refBz = bp.z;
        if (soiT === null && startRef !== name) { soiT = t; soiBody = name; }
      }
      if (db < B.R && !B.gasGiant) hitBody = { body: name, bx: bp.x, by: bp.y, bz: bp.z };
    }

    if (opts.target) {
      opts.target.pos(t, tp); opts.target.vel(t, tv);
      const dt = Math.hypot(s.x - tp.x, s.y - tp.y, s.z - tp.z);
      if (dt < targetCA.d) { targetCA.d = dt; targetCA.t = t; targetCA.i = pts.length; targetCA.rv = Math.hypot(s.vx - tv.x, s.vy - tv.y, s.vz - tv.z); }
    }
    if (i % sampleEvery === 0) {
      pts.push({ x: s.x, y: s.y, z: s.z, t, ref: curRef, mx: refBx, my: refBy, mz: refBz });
    }
    if (opts.stopAtSurface !== false) {
      if (r < R_E + (opts.earthStopAlt ?? 0)) {
        impact = { body: 'earth', t, i: pts.length - 1, x: s.x, y: s.y, z: s.z };
        pts.push({ x: s.x, y: s.y, z: s.z, t, ref: 'earth' });
        break;
      }
      if (hitBody) {
        impact = { body: hitBody.body, t, i: pts.length - 1, x: s.x, y: s.y, z: s.z };
        pts.push({ x: s.x, y: s.y, z: s.z, t, ref: hitBody.body, mx: hitBody.bx, my: hitBody.by, mz: hitBody.bz });
        break;
      }
    }
  }
  const moonCA = bodyCA.moon;
  return { pts, moonCA, bodyCA, soiT, soiBody, impact, targetCA, earthPe, end: s, tEnd: t };
}

export { R_E, R_M, MU_E, MU_M, MOON_SOI, ISS_R, ISS_N, BODIES, SATELLITE_BODIES };
