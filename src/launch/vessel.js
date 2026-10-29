// A flying vehicle (player rocket, recovered booster, spent stage) simulated in the ECI frame.
// Attitude is a single in-plane angle `beta` (clockwise from ECI +Y); `ang` = beta − local-vertical angle.
import * as THREE from 'three';
import { PARTS, G0, R as CORE_R } from '../parts.js';
import { rk4, keplerStep, coastStep, gravity, refBody, bodyInfo, bodyState, bodyPos, bodyRotation, bodyOmega, angOf, wrapPi } from '../sim/orbit.js';
import { ATM_H, ATM_TOP, RHO0, EARTH_A, R_SUN } from '../sim/constants.js';

const _g = { x: 0, y: 0, z: 0 };
const _bp = { x: 0, y: 0, z: 0 }, _bv = { x: 0, y: 0, z: 0 }, _sp = { x: 0, y: 0, z: 0 };
let VID = 1;

export class Vessel {
  /**
   * ctx: shared rocket data { stack, lay, segs, segInfo, fuel, fuelMax, rocket }
   * segIdx: owned segment indices (ascending: top → bottom), root: THREE.Group holding the seg groups
   */
  constructor(ctx, segIdx, root, kind = 'player') {
    this.id = VID++;
    this.ctx = ctx;
    this.segIdx = segIdx.slice().sort((a, b) => a - b);
    this.root = root;
    this.kind = kind;
    this.s = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };   // ECI state
    this.beta = 0; this.omega = 0;
    this.dir3D = new THREE.Vector3(0, 1, 0);
    this.holdDir3D = new THREE.Vector3(0, 1, 0);
    this.heading = 0; this.turnYawRate = 0;
    this.throttle = 1;
    this.engineOn = false;
    this.engMode = 'all';
    this.ctl = { input: 0, targetBeta: null, rcs: [0, 0, 0], hold: false };
    this.legsT = 0; this.legsTarget = 0;
    this.finsT = 0; this.finsTarget = 0;
    this.chuteT = 0; this.chuteTarget = 0;
    this.landed = null;          // { body, psi, h } when resting on a surface
    this.crashed = false;
    this.clamped = false;        // held by launch clamps
    this.t = 0;
    this.thrustNow = 0; this.qNow = 0; this.accelNow = 1; this.machNow = 0; this.heatFlux = 0;
    this.coreFiring = false; this.boosterFiring = false;
    this.events = [];
    this.updateMass();
    this.updateFrame(0);
  }

  // ------------------------------------------------------------- structure helpers
  get activeSeg() { return this.segIdx[this.segIdx.length - 1]; }
  get info() { return this.ctx.segInfo[this.activeSeg]; }
  owns(k) { return this.segIdx.includes(k); }
  boosters() { return this.ctx.rocket.boosters.filter((b) => b.attached && this.owns(b.seg)); }
  deployables(type) { return (this.ctx.rocket.deployables || []).filter((d) => d.type === type && this.owns(d.seg)); }
  hasLegs() { return this.deployables('legs').length > 0; }
  hasGridFins() { return this.deployables('gridfins').length > 0; }
  hasFins() { return this.segIdx.some((k) => this.ctx.segInfo[k].fins); }
  capsule() { const c = this.ctx.rocket.capsule; return c && this.owns(c.seg) ? c : null; }
  dockPort() { const d = this.ctx.rocket.dockPort; return d && this.owns(d.seg) ? d : null; }
  topType() { const i = this.ctx.segs[this.segIdx[0]][0]; return this.ctx.stack[i].type; }
  fuelTotal() { let f = 0; for (const k of this.segIdx) f += this.ctx.fuel[k]; return f; }
  get isRover() { return this.ctx.stack.some((it) => it.type.includes('Rover') || it.attach.some((a) => a.includes('Rover'))); }
  get isBoat() { return this.ctx.stack.some((it) => it.type.includes('Boat') || it.attach.some((a) => a.includes('Boat'))); }
  get isPlane() { return this.ctx.stack.some((it) => it.type.includes('Plane') || it.attach.some((a) => a.includes('Plane')) || it.type === 'engJet'); }
  get isSpecial() { return this.isRover || this.isBoat || this.isPlane; }

  syncBetaFromDir3D() {
    if (!this.dir3D) return;
    this.dir3D.normalize();
    const inPlaneAng = Math.atan2(this.dir3D.x, this.dir3D.y);
    this.beta = wrapPi(this.phi + inPlaneAng);
    this.ang = wrapPi(this.beta - this.phi);
  }

  syncDir3DFromBeta() {
    if (!this.dir3D) this.dir3D = new THREE.Vector3(0, 1, 0);
    const inPlaneAng = wrapPi(this.beta - this.phi);
    this.dir3D.set(Math.sin(inPlaneAng), Math.cos(inPlaneAng), 0).normalize();
  }

  updateMass() {
    const { lay, segs, segInfo, fuel, fuelMax, rocket } = this.ctx;
    let m = 0, my = 0, minY = Infinity, maxY = -Infinity;
    for (const k of this.segIdx) {
      const frac = fuelMax[k] > 0 ? fuel[k] / fuelMax[k] : 0;
      const stInfo = segInfo?.[k];
      for (const i of segs[k]) {
        const p = lay.parts[i];
        const isBat = p.item.type === 'batteryPack' || p.def.isBattery;
        const canBurn = stInfo ? (isBat ? stInfo.useBatteryFuel : stInfo.useChemFuel) : true;
        const pm = p.def.dry + (p.def.fuel || 0) * (canBurn ? frac : 1);
        m += pm; my += pm * (p.y + p.def.height / 2);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y + p.def.height);
        for (const a of p.item.attach) {
          if (a === 'booster') continue;
          const ad = PARTS[a];
          if (!ad) continue;
          const cnt = ad.count || 2;
          const aBat = a === 'batteryPack' || ad.isBattery;
          const aCanBurn = stInfo ? (aBat ? stInfo.useBatteryFuel : stInfo.useChemFuel) : true;
          const am = (ad.dry + (ad.fuel || 0) * (aCanBurn ? frac : 1)) * cnt;
          const y = a === 'gridfins' ? p.y + p.def.height - 0.5 : a === 'legs' ? p.y + 1.0 : p.y + p.def.height * 0.5;
          m += am; my += am * y;
        }
      }
    }
    for (const b of rocket.boosters) {
      if (!b.attached || !this.owns(b.seg)) continue;
      const bm = b.dry + b.fuel, y = b.objs[0].position.y + 5.5;
      m += bm; my += bm * y;
      minY = Math.min(minY, b.objs[0].position.y);
    }
    // deployed landing legs extend below the engines
    this.legBottom = Infinity;
    for (const d of this.deployables('legs')) {
      const p = lay.parts[d.partIndex];
      const foot = d.objs[0]?.userData.footY ?? -3.8;
      this.legBottom = Math.min(this.legBottom, p.y + foot);
    }
    const prevY = this.com ? this.com.y : null;
    this.com = { mass: Math.max(m, 0.05), y: my / Math.max(m, 1e-6), minY, maxY };
    for (const k of this.segIdx) rocket.segGroups[k].position.y = -this.com.y;
    this.height = maxY - minY;
    return prevY;
  }

  /** distance from COM down to the lowest point (legs count once mostly deployed) */
  bottomOffset() {
    if (this.isPlane) return 1.15;
    let low = this.com.minY;
    const lt = THREE.MathUtils.smoothstep(this.legsT, 0.0, 1.0);
    if (this.legBottom < Infinity && lt > 0) low = Math.min(low, this.com.minY + (this.legBottom - this.com.minY) * lt);
    return this.com.y - low;
  }

  // ------------------------------------------------------------- frames
  /** recompute derived local-frame quantities */
  updateFrame(t) {
    const s = this.s;
    this.ref = refBody(s.x, s.y, s.z, t);
    const B = bodyInfo(this.ref);
    this.body = B;
    bodyState(this.ref, t, _bp, _bv);
    const dx = s.x - _bp.x, dy = s.y - _bp.y, dz = s.z - _bp.z;
    const r = Math.max(1e-3, Math.hypot(dx, dy));
    this.rRel = { x: dx, y: dy, z: dz, r };
    this.phi = angOf(dx, dy);                       // ECI downrange angle about ref body
    this.up = { x: dx / r, y: dy / r };
    this.east = { x: this.up.y, y: -this.up.x };
    this.alt = Math.hypot(dx, dy, dz) - B.R;
    this.ang = wrapPi(this.beta - this.phi);
    // velocity relative to the body (inertial) and to its rotating surface
    const vrx = s.vx - _bv.x, vry = s.vy - _bv.y;
    this.vOrb = { e: vrx * this.east.x + vry * this.east.y, u: vrx * this.up.x + vry * this.up.y };
    const w = bodyOmega(this.ref);
    const sx = vrx - w * dy, sy = vry + w * dx;     // subtract ω×r (clockwise spin)
    this.vSurf = { e: sx * this.east.x + sy * this.east.y, u: sx * this.up.x + sy * this.up.y, z: s.vz - _bv.z };
    this.speedSurf = Math.hypot(this.vSurf.e, this.vSurf.u, this.vSurf.z || 0);
    this.speedOrb = Math.hypot(vrx, vry, s.vz);
    this.phiRot = wrapPi(this.phi - bodyRotation(this.ref, t));
    this.sx = this.phiRot * B.R;                    // unrolled surface coordinate (m)
    this.vRel = { x: vrx, y: vry };
  }

  /** set state from a surface location (unrolled coordinate sx, altitude) at rest on the rotating body */
  placeOnSurface(body, sx, alt, t, beta = null) {
    const B = bodyInfo(body);
    const psi = sx / B.R + bodyRotation(body, t);
    bodyState(body, t, _bp, _bv);
    const r = B.R + alt, w = bodyOmega(body);
    const ux = Math.sin(psi), uy = Math.cos(psi);
    const s = this.s;
    s.x = _bp.x + ux * r; s.y = _bp.y + uy * r; s.z = 0;
    s.vx = _bv.x + w * uy * r; s.vy = _bv.y - w * ux * r; s.vz = 0;
    if (beta === null) this.beta = psi; else this.beta = beta;
    this.updateFrame(t);
    this.syncDir3DFromBeta();
    if (this.holdDir3D) this.holdDir3D.copy(this.dir3D);
  }

  /** world direction of the vessel nose (ECI, in-plane) */
  axis() { return { x: Math.sin(this.beta), y: Math.cos(this.beta) }; }

  // ------------------------------------------------------------- physics
  /**
   * Advance by h seconds. env: { surface(v) → {h, water, site}, sasGain }
   */
  step(h, t, env) {
    this.t = t;
    if (this.crashed) return;
    this.updateFrame(t);
    const B = this.body;
    // deploy animations (real time-ish)
    const dRate = h * 0.6;
    this.legsT += THREE.MathUtils.clamp(this.legsTarget - this.legsT, -dRate, dRate);
    this.finsT += THREE.MathUtils.clamp(this.finsTarget - this.finsT, -h * 1.5, h * 1.5);
    this.chuteT += THREE.MathUtils.clamp(this.chuteTarget - this.chuteT, -h * 0.25, h * (this.chuteT < 0.35 ? 0.5 : 0.18));

    const inAtm = (B.atm || 0) > 0 && this.alt < B.atm;
    const pr = inAtm ? Math.exp(-Math.max(0, this.alt) / (B.atmH || ATM_H)) : 0;
    const rho = (B.rho0 ?? RHO0) * pr;
    const { fuel, fuelMax, segInfo } = this.ctx;
    const k = this.activeSeg;
    const info = segInfo[k];
    const gLocal = (B.g || G0) * (B.R / (B.R + Math.max(0, this.alt))) ** 2;
    const gRatio = Math.max(0.005, gLocal / G0);
    const batBoost = 1 + 0.25 * Math.min(3, info.batteryCount || 0);

    // Compute local brightness / darkness for the Laser Engine (brighter -> slower, darker -> faster)
    let laserScale = 1.0;
    if (info.tLaser > 0 || (info.hasSolar && info.batteryCount > 0)) {
      bodyPos('sun', t, _sp);
      const sx = _sp.x - this.s.x, sy = _sp.y - this.s.y, sz = (_sp.z || 0) - (this.s.z || 0);
      const dSun = Math.max(R_SUN, Math.hypot(sx, sy, sz));
      const solarIrradiance = (EARTH_A / dSun) ** 2;
      const cosZenith = this.ref === 'sun' ? 1.0 : (this.up.x * (sx / dSun) + this.up.y * (sy / dSun));
      const perpDist = this.rRel.r * Math.sqrt(Math.max(0, 1 - cosZenith * cosZenith));
      const inShadow = this.ref !== 'sun' && cosZenith < 0 && perpDist < B.R * 1.08;
      const sunVis = cosZenith >= 0 ? (0.65 + 0.35 * cosZenith) : (inShadow ? 0.03 : 0.20);
      const atmBright = pr * 1.25;
      const lightLevel = solarIrradiance * sunVis + atmBright;
      laserScale = THREE.MathUtils.clamp(1.65 / (0.42 + lightLevel * 1.35), 0.08, 3.25);
      // Solar panels trickle-charge quantum battery packs when not firing
      if (!this.engineOn && info.hasSolar && info.batteryCount > 0 && fuelMax && fuel[k] < fuelMax[k] && !inShadow) {
        fuel[k] = Math.min(fuelMax[k], fuel[k] + 0.04 * Math.min(2.5, solarIrradiance) * h);
      }
    }

    let thrust = 0;
    const thr = this.throttle;
    const engFrac = this.engMode === 'center' ? 1 / Math.max(1, info.engCount || 1) : this.engMode === 'three' ? Math.min(1, 3 / Math.max(1, info.engCount || 1)) : 1;
    this.coreFiring = this.engineOn && fuel[k] > 0 && info.tVac > 0 && thr > 0;
    if (this.coreFiring) {
      const hasBat = info.batteryCount > 0 && info.useBatteryFuel;
      const agVac = hasBat ? (info.tAntiGrav || 0) : 0;
      const agMdot = hasBat ? (info.mdotAntiGrav || 0) : 0;
      const lzVac = hasBat ? (info.tLaser || 0) : 0;
      const lzMdot = hasBat ? (info.mdotLaser || 0) : 0;
      const normVac = info.useChemFuel ? Math.max(0, info.tChemVac || 0) : 0;
      const normSL = info.useChemFuel ? Math.max(0, info.tChemSL || 0) : 0;
      const normMdot = info.useChemFuel ? Math.max(0, info.mdotChem || 0) : 0;
      // Anti-gravity thrust scales directly with local gravity (stronger gravity -> faster, weaker gravity -> slower)
      // Laser thrust scales inversely with local brightness (brighter -> slower, darker -> faster)
      const curThrust = (normVac - (normVac - normSL) * pr) + (agVac * gRatio + lzVac * laserScale) * batBoost;
      const curMdot = normMdot + agMdot * Math.max(0.05, gRatio) + lzMdot * Math.max(0.15, laserScale * 0.75);
      thrust += curThrust * thr * engFrac;
      fuel[k] = Math.max(0, fuel[k] - curMdot * thr * engFrac * h);
      if (fuel[k] === 0) this.events.push(['fuelOut', k]);
    }
    this.boosterFiring = false;
    for (const b of this.boosters()) {
      if (b.seg !== k || !this.engineOn || b.fuel <= 0) continue;
      const d = PARTS.booster;
      thrust += (d.thrustVac - (d.thrustVac - d.thrustSL) * pr) * b.count;
      b.fuel = Math.max(0, b.fuel - b.count * d.thrustVac / (d.ispVac * G0) * h);
      this.boosterFiring = true;
      if (b.fuel === 0) this.events.push(['boosterOut', b]);
    }
    let mass = 0;
    for (const s of this.segIdx) mass += segInfo[s].dry + fuel[s];
    for (const b of this.boosters()) mass += b.dry + b.fuel;
    mass = Math.max(mass, 0.05);
    this.mass = mass;

    // ---------- aerodynamics (relative to the rotating atmosphere)
    const ve = this.vSurf.e, vu = this.vSurf.u;
    const v = Math.hypot(ve, vu);
    let area = Math.PI * CORE_R * CORE_R;
    for (const b of this.boosters()) area += b.count * Math.PI * 0.36;
    let aoa = 0;
    if (v > 1) aoa = wrapPi(this.ang - Math.atan2(ve, vu));
    const top = this.topType();
    const tailFirst = Math.abs(aoa) > Math.PI / 2;
    const cd0 = tailFirst ? 1.05 : top === 'nose' ? 0.28 : top === 'capsule' ? 0.42 : top === 'dockPort' ? 0.5 : 0.75;
    let cdA = (cd0 + 1.4 * Math.sin(aoa) ** 2) * area;
    cdA += this.legsT * 6 + this.finsT * 5.0;
    const chute = this.capsule() ? this.chuteT : 0;
    cdA += chute < 0.35 ? chute * 25 : 9 + (chute - 0.35) / 0.65 * 420;
    const q = 0.5 * rho * v * v;
    this.qNow = q;
    this.heatFlux = rho > 0 ? Math.sqrt(rho / RHO0) * (v / 1000) ** 3 : 0;   // ~relative stagnation heating
    this.machNow = v / (340 * Math.max(0.85, pr ** 0.05));
    let fe = 0, fu = 0;                                   // aero force (kN) in local (east, up)
    if (v > 0.5 && q > 0) {
      const dragF = q * cdA / 1000;
      fe -= dragF * ve / v; fu -= dragF * vu / v;
      // body normal force (crossflow) – lets guidance steer with angle of attack
      const ax = Math.sin(this.ang), au = Math.cos(this.ang);
      const wx = -ve / v, wu = -vu / v;                   // air flow direction relative to body
      const wa = wx * ax + wu * au;
      const px = wx - wa * ax, pu = wu - wa * au;
      const kN = 0.9 + this.finsT * 0.8;
      const nF = q * area * kN * Math.abs(Math.sin(aoa)) / 1000;
      const pl = Math.hypot(px, pu);
      if (pl > 1e-4) { fe += nF * px / pl; fu += nF * pu / pl; }

      // Airplane aerodynamic lift from wings
      if (this.isPlane) {
        const gamma = Math.atan2(vu, ve);
        const pitch = Math.PI / 2 - this.ang;
        const alpha = wrapPi(pitch - gamma);
        this.alpha = alpha;
        const hasWings = this.ctx.stack.some((it) => it.attach.includes('wingsPlane'));
        const wingArea = hasWings ? 24 : 8;
        const cl = THREE.MathUtils.clamp(alpha * 3.8, -1.3, 1.3);
        const liftMag = q * wingArea * cl / 1000;
        const cosBank = Math.cos(this.bank || 0);
        const sinBank = Math.sin(this.bank || 0);
        // Lift vector perpendicular to velocity, pointing upwards
        const uLE = -vu / v, uLU = ve / v;
        fe += liftMag * cosBank * uLE;
        fu += liftMag * cosBank * uLU;
        // Lateral lift component turning the plane horizontally
        this._lateralLift = -liftMag * sinBank;
        // Induced drag
        const indDrag = Math.abs(liftMag * Math.sin(alpha)) * 0.35;
        fe -= indDrag * ve / v;
        fu -= indDrag * vu / v;
      }
    }
    // thrust (along the body axis in 3D)
    let ax = this.dir3D ? this.dir3D.x : Math.sin(this.ang);
    let au = this.dir3D ? this.dir3D.y : Math.cos(this.ang);
    let az_t = this.dir3D ? this.dir3D.z : 0;
    if (this.isPlane) {
      const pitch = Math.PI / 2 - this.ang;
      const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
      const cosH = Math.cos(this.heading || 0), sinH = Math.sin(this.heading || 0);
      ax = cosP * cosH;
      au = sinP;
      az_t = -cosP * sinH;
    }
    let ae = (thrust * ax + fe) / mass, au_ = (thrust * au + fu) / mass;
    if (info && info.antiGrav && this.coreFiring) {
      // Anti-gravity field neutralizes local planetary gravity directly while firing
      au_ += gLocal * 0.92 * thr;
    }
    // RCS translation (body frame: fwd, normal-in-plane, out-of-plane)
    let az = ((thrust * az_t) + (this.isPlane ? (this._lateralLift || 0) : 0)) / mass;
    const [rf, rn, rz] = this.ctl.rcs;
    if (rf || rn || rz) {
      const A = 0.45;
      ae += A * (rf * ax + rn * au); au_ += A * (rf * au - rn * ax); az += A * rz;
    }

    // Weathercock vertical stabilizer damping for plane
    if (this.isPlane && !this.clamped && !this.landed) {
      const vH = Math.hypot(ve, this.s.vz || 0);
      if (vH > 1) {
        const targetVz = -vH * Math.sin(this.heading || 0);
        const curVz = this.s.vz || 0;
        az += (targetVz - curVz) * Math.min(5.0, 1.5 + q / 300);
      }
    }
    this.thrustNow = thrust;
    this.accelNow = Math.hypot(ae, au_, az) / G0;

    // ---------- attitude
    const input = this.ctl.input;
    const gimbal = thrust > 0 ? 0.75 : 0;
    const finAuth = this.finsT * Math.min(1.6, q / 15000);
    const baseAuth = this.ctl.targetBeta !== null ? 0.45 : 0.25;
    const auth = (baseAuth + gimbal + finAuth) * Math.min(2.2, Math.max(this.ctl.targetBeta !== null ? 0.65 : 0.35, 55 / mass));
    let angAcc = input * auth * 0.55;
    if (this.ctl.targetBeta !== null && input === 0 && !this.isPlane) {
      const err = wrapPi(this.ctl.targetBeta - this.beta);
      const kp = this.ctl.kp ?? 2.6, kd = this.ctl.kd ?? 3.1;
      angAcc += THREE.MathUtils.clamp(err * kp - this.omega * kd, -auth, auth);
    }
    // aerodynamic stability: fins (nose-first stable), grid fins deployed / bare stages (tail-first stable)
    let stab = this.hasFins() ? 1.0 : -0.22;
    if (this.finsT > 0.5) stab = -1.0;
    if (chute > 0.05) stab = -3.0 * chute;
    const aeroScale = this.ctl.targetBeta !== null && chute <= 0.05 ? 0.55 : 2.5;
    angAcc += -stab * q * Math.sin(aoa) * aeroScale / (mass * 1000) * (this.height / 20);

    // Airplane flight control authority (elevator pitch & aileron roll & rudder yaw)
    if (this.isPlane) {
      const qNorm = Math.min(2.5, Math.max(0.2, q / 1200));
      // S = -1 (pitch up -> negative angAcc), W = +1 (pitch down -> positive angAcc)
      const pitchInput = (this.ctl.drive || 0);
      const rollInput = this.ctl.input || 0; // D = +1 (bank right), A = -1 (bank left)
      this.bank = (this.bank || 0) + rollInput * 2.4 * h;
      this.bank *= Math.exp(-1.2 * h); // self-leveling bank damping
      this.bank = THREE.MathUtils.clamp(this.bank, -1.35, 1.35);

      // Pitch angular acceleration
      angAcc = pitchInput * 1.8 * qNorm;
      // Pitch rate damping
      angAcc -= this.omega * Math.min(4.0, 1.2 + q / 600);
      // Aerodynamic pitch stability restoring towards flight path
      if (this.alpha !== undefined) {
        angAcc += this.alpha * 1.5 * qNorm;
      }

      // Yaw / Heading turning rate (Coordinated turn from bank angle + rudder/roll input)
      const pullFactor = (pitchInput < 0) ? (1.0 + (-pitchInput) * 1.6) : 1.0;
      const turnYawRate = (Math.sin(this.bank) * 0.95 * pullFactor + rollInput * 0.5) * Math.min(2.4, Math.max(0.4, v / 30));
      this.turnYawRate = turnYawRate;
      this.heading = (this.heading || 0) + turnYawRate * h;
    }
    this.aoa = aoa;

    // ---------- landed / clamped
    if (this.clamped || this.landed) {
      if (this.isRover && !this.clamped) {
        const drive = this.ctl.drive || 0;
        const steer = this.ctl.input || 0;
        this.groundSpeed = this.groundSpeed || 0;
        if (drive !== 0) {
          const accRate = (drive * this.groundSpeed < 0) ? 42.0 : 18.0;
          this.groundSpeed = THREE.MathUtils.clamp(this.groundSpeed + drive * accRate * h, -18, 42);
        } else if (steer !== 0) {
          if (this.groundSpeed < 12) this.groundSpeed = Math.min(12, this.groundSpeed + 12.0 * h);
          else this.groundSpeed *= Math.exp(-1.5 * h);
        } else {
          this.groundSpeed *= Math.exp(-2.5 * h);
          if (Math.abs(this.groundSpeed) < 0.02) this.groundSpeed = 0;
        }
        if (steer !== 0) {
          const revSign = (drive < 0 && this.groundSpeed < -0.5) ? -1 : 1;
          const turnYawRate = -steer * 1.35 * revSign;
          this.turnYawRate = turnYawRate;
          this.heading = (this.heading || 0) + turnYawRate * h;
        } else {
          this.turnYawRate = 0;
        }
        const cosH = Math.cos(this.heading || 0), sinH = Math.sin(this.heading || 0);
        const newSx = this.sx + this.groundSpeed * cosH * h;
        const newZ = (this.s.z || 0) - this.groundSpeed * sinH * h;
        const surf = env.surface({ ...this, sx: newSx, s: { ...this.s, z: newZ } });
        const targetH = surf.h + this.bottomOffset();
        const pitchUp = THREE.MathUtils.clamp(drive * 0.025, -0.04, 0.04);
        const targetBeta = this.phi + pitchUp;
        this.beta = targetBeta;
        this.omega = 0;
        this.placeOnSurface(this.ref, newSx, targetH, t + h, this.beta);
        this.s.z = newZ;
        this.s.vz = -this.groundSpeed * sinH;
        this.s.vx += this.groundSpeed * cosH * this.east.x;
        this.s.vy += this.groundSpeed * cosH * this.east.y;
        this.updateFrame(t + h);
        this.landed = { body: this.ref, sx: newSx, h: targetH, site: surf.site, how: 'rover' };
        this.landedLock = 0.2;
        return;
      }
      if (this.isBoat && !this.clamped) {
        const throttleDrive = (this.engineOn && this.throttle > 0) ? this.throttle : 0;
        const drive = this.ctl.drive !== 0 ? (this.ctl.drive || 0) : throttleDrive;
        const steer = this.ctl.input || 0;
        this.waterSpeed = this.waterSpeed || 0;
        if (drive !== 0) {
          const accRate = (drive * this.waterSpeed < 0) ? 28.0 : 14.0;
          this.waterSpeed = THREE.MathUtils.clamp(this.waterSpeed + drive * accRate * h, -12, 38);
        } else if (steer !== 0) {
          if (this.waterSpeed < 10) this.waterSpeed = Math.min(10, this.waterSpeed + 10.0 * h);
          else this.waterSpeed *= Math.exp(-0.8 * h);
        } else {
          this.waterSpeed *= Math.exp(-1.1 * h);
          if (Math.abs(this.waterSpeed) < 0.02) this.waterSpeed = 0;
        }
        if (steer !== 0) {
          const revSign = (drive < 0 && this.waterSpeed < -0.5) ? -1 : 1;
          const turnYawRate = -steer * 1.15 * revSign;
          this.turnYawRate = turnYawRate;
          this.heading = (this.heading || 0) + turnYawRate * h;
        } else {
          this.turnYawRate = 0;
        }
        const cosH = Math.cos(this.heading || 0), sinH = Math.sin(this.heading || 0);
        const newSx = this.sx + this.waterSpeed * cosH * h;
        const newZ = (this.s.z || 0) - this.waterSpeed * sinH * h;
        const surf = env.surface({ ...this, sx: newSx, s: { ...this.s, z: newZ } });
        const wave = Math.sin((t + h) * 2.5) * 0.06;
        const targetH = Math.max(surf.h, 0) + this.bottomOffset() - 0.35 + wave;
        const pitchUp = THREE.MathUtils.clamp(this.waterSpeed / 36 * 0.1, -0.05, 0.12);
        const targetBeta = this.phi + pitchUp;
        this.beta = targetBeta;
        this.omega = 0;
        this.placeOnSurface(this.ref, newSx, targetH, t + h, this.beta);
        this.s.z = newZ;
        this.s.vz = -this.waterSpeed * sinH;
        this.s.vx += this.waterSpeed * cosH * this.east.x;
        this.s.vy += this.waterSpeed * cosH * this.east.y;
        this.updateFrame(t + h);
        this.landed = { body: this.ref, sx: newSx, h: targetH, site: surf.site, how: 'boat' };
        this.landedLock = 0.2;
        return;
      }
      if (this.isPlane && !this.clamped) {
        const drive = (this.engineOn && this.throttle > 0) ? this.throttle : 0;
        this.planeRollSpeed = this.planeRollSpeed || 0;
        const jetThrust = this.thrustNow > 0 ? this.thrustNow : (this.throttle * 450);
        const accel = (drive * jetThrust) / this.mass;
        const rollFric = 0.35;
        this.planeRollSpeed = Math.max(0, this.planeRollSpeed + (accel - rollFric) * h);
        if (drive === 0) this.planeRollSpeed *= Math.exp(-0.8 * h);
        if (this.planeRollSpeed < 0.05 && drive === 0) this.planeRollSpeed = 0;

        // Ground steering with A / D
        const steer = this.ctl.input || 0; // A = -1 (left), D = +1 (right)
        if (steer !== 0 && this.planeRollSpeed > 0.5) {
          const steerRate = THREE.MathUtils.clamp(steer * 1.2 * Math.min(1.0, 18 / (this.planeRollSpeed + 5)), -0.8, 0.8);
          this.heading = (this.heading || 0) + steerRate * h;
        }

        const pitchControl = this.ctl.drive || 0; // S = -1 (pitch up), W = +1 (pitch down)
        const rotateUp = (this.planeRollSpeed > 25 && pitchControl < 0) ? (-pitchControl * 0.16) : 0;
        const targetBeta = this.phi + Math.PI / 2 - rotateUp;

        const qRoll = 0.5 * rho * this.planeRollSpeed * this.planeRollSpeed;
        const hasWings = this.ctx.stack.some((it) => it.attach.includes('wingsPlane'));
        const wingArea = hasWings ? 24 : 8;
        const clRotate = (rotateUp > 0.02) ? 0.95 : 0.22;
        const liftForce = qRoll * wingArea * clRotate / 1000;
        const weightForce = this.mass * G0;

        const cosH = Math.cos(this.heading || 0), sinH = Math.sin(this.heading || 0);

        if (liftForce > weightForce * 0.92 && this.planeRollSpeed > 35) {
          this.landed = null;
          this.landedLock = 0;
          const newSx = this.sx + this.planeRollSpeed * cosH * h;
          const surf = env.surface({ ...this, sx: newSx });
          const targetH = surf.h + this.bottomOffset() + 0.6;
          this.beta = this.phi + Math.PI / 2 - 0.16;
          this.omega = -0.05;
          this.placeOnSurface(this.ref, newSx, targetH, t + h, this.beta);
          this.s.z += -this.planeRollSpeed * sinH * h;
          this.s.vz = -this.planeRollSpeed * sinH;
          this.vSurf.e = this.planeRollSpeed * cosH;
          this.vSurf.u = 5.5;
          this.vSurf.z = this.s.vz;
          this.s.vx += this.vSurf.e * this.east.x + 5.5 * this.up.x;
          this.s.vy += this.vSurf.e * this.east.y + 5.5 * this.up.y;
          this.updateFrame(t + h);
          this.events.push(['liftoff']);
          return;
        }

        const newSx = this.sx + this.planeRollSpeed * cosH * h;
        const surf = env.surface({ ...this, sx: newSx });
        const targetH = surf.h + this.bottomOffset();
        this.beta = targetBeta;
        this.omega = 0;
        this.placeOnSurface(this.ref, newSx, targetH, t + h, this.beta);
        this.s.z += -this.planeRollSpeed * sinH * h;
        this.s.vz = -this.planeRollSpeed * sinH;
        this.s.vx += this.planeRollSpeed * cosH * this.east.x;
        this.s.vy += this.planeRollSpeed * cosH * this.east.y;
        this.updateFrame(t + h);
        this.landed = { body: this.ref, sx: newSx, h: targetH, site: surf.site, how: 'plane' };
        this.landedLock = 0.2;
        return;
      }
      const up = au_ - (B.g || G0) * (B.R / (B.R + this.alt)) ** 2;
      if (this.clamped || up <= 0.05 || this.landedLock > 0) {
        this.landedLock = Math.max(0, (this.landedLock || 0) - h);
        // stay on the rotating surface
        const L = this.landed || this.clampSpot;
        if (L) this.placeOnSurface(L.body, L.sx, L.h, t + h, this.beta + bodyOmega(L.body) * h);
        // settle upright
        if (this.landed && !this.clamped) { this.beta += wrapPi(this.phi - this.beta) * Math.min(1, h * 2); this.omega = 0; }
        return;
      }
      this.landed = null;
      this.events.push(['liftoff']);
    }

    if (!this.isSpecial && !this.clamped && !this.landed && this.kind === 'player' && this.ctl.targetBeta === null) {
      this.omega = 0;
      this.syncBetaFromDir3D();
    } else {
      this.omega += angAcc * h;
      this.omega *= Math.exp(-(inAtm ? 0.35 : 0.08) * h);
      this.beta += this.omega * h;
      this.syncDir3DFromBeta();
      if (this.holdDir3D && this.dir3D) this.holdDir3D.copy(this.dir3D);
    }

    // ---------- translate (local accel → ECI)
    const E = this.east, U = this.up;
    const axE = ae * E.x + au_ * U.x, ayE = ae * E.y + au_ * U.y;
    const maxSafe = coastStep(this.s.x, this.s.y, this.s.z, t) * 4.5;
    if (!inAtm && Math.abs(axE) < 1e-6 && Math.abs(ayE) < 1e-6 && Math.abs(az) < 1e-6 && h > maxSafe) {
      if (!keplerStep(this.s, this.ref, t, h)) {
        const nSub = Math.min(80, Math.ceil(h / maxSafe));
        const hs = h / nSub;
        for (let i = 0; i < nSub; i++) rk4(this.s, t + i * hs, hs, 0, 0, 0);
      }
    } else {
      rk4(this.s, t, h, axE, ayE, az);
    }
    this.updateFrame(t + h);

    // ---------- surface contact (gas giants Jupiter, Saturn, Uranus, Neptune have no solid surface and can be flown straight through)
    if (B.gasGiant) {
      this.agl = Math.max(0, this.alt);
      return;
    }
    const surf = env.surface(this);
    const bottom = this.alt - this.bottomOffset() * Math.cos(this.ang) - surf.h;
    this.agl = bottom;
    if (bottom <= 0) {
      const vs = this.vSurf;
      const sp = Math.hypot(vs.e, vs.u);
      const tilt = Math.abs(this.ang);
      const legsOk = this.hasLegs() && this.legsT > 0.95;
      const chuteOk = this.capsule() && chute > 0.9;
      const vLim = chuteOk ? 14 : legsOk ? 8 : 6;
      const details = {
        sp,
        vLim: surf.water && chuteOk ? 16 : vLim,
        vertSp: Math.abs(vs.u),
        horizSp: Math.abs(vs.e),
        tiltDeg: Math.round(tilt * 180 / Math.PI),
        chuteOk,
        legsOk,
        hasCapsule: !!this.capsule(),
        hasLegs: this.hasLegs(),
        where: surf.water ? 'water' : 'ground',
      };
      if (surf.water) {
        if (this.isBoat) {
          this.settle(surf, t, 'floating');
          return;
        }
        if (chuteOk && sp < 16) this.settle(surf, t, 'splash');
        else this.crash(sp > 40 ? 'Lao xuống biển!' : 'Rơi xuống biển!', 'water', details);
      } else if (this.isRover) {
        if (sp < 55 && tilt < 0.7) {
          this.groundSpeed = vs.e;
          this.settle(surf, t, 'rover');
        } else this.crash(sp > 60 ? 'Lao xuống mặt đất!' : 'Va chạm mạnh khi tiếp đất!', 'ground', details);
      } else if (this.isBoat) {
        if (sp < 7) this.settle(surf, t, 'beached');
        else this.crash('Tàu va vào bờ đá!', 'ground', details);
      } else if (this.isPlane) {
        if (vs.u > 0) return; // Climbing/taking off
        const vertRate = Math.abs(vs.u);
        const pitch = Math.abs(wrapPi(this.beta - this.phi - Math.PI / 2));
        if (vertRate < 16 && pitch < 0.45 && !surf.water) {
          this.planeRollSpeed = Math.max(0, vs.e);
          this.settle(surf, t, 'landed');
        } else if (surf.water) {
          this.crash('Máy bay rơi xuống biển!', 'water', details);
        } else {
          this.crash(vertRate > 30 ? 'Lao máy bay xuống mặt đất!' : 'Va chạm mạnh khi hạ cánh!', 'ground', details);
        }
      } else if (sp < vLim && Math.abs(vs.e) < 4 && tilt < (legsOk ? 0.3 : 0.45)) this.settle(surf, t, 'landed');
      else this.crash(sp > 60 ? 'Lao xuống mặt đất!' : 'Va chạm mạnh khi tiếp đất!', 'ground', details);
    }
  }

  settle(surf, t, how) {
    const targetBeta = this.isPlane ? (this.phi + Math.PI / 2) : this.beta;
    this.landed = { body: this.ref, sx: this.sx, h: surf.h + this.bottomOffset(), site: surf.site, how };
    this.landedLock = 1.0;
    this.omega = 0;
    this.placeOnSurface(this.ref, this.sx, this.landed.h, t, targetBeta);
    this.events.push(['landed', how, surf.site]);
  }

  crash(reason, where, details = null) {
    this.crashed = true;
    this.engineOn = false;
    this.crashDetails = details;
    this.events.push(['crash', reason, where, details]);
  }

  /** ECI gravity magnitude at current position */
  gLocal(t) { gravity(this.s.x, this.s.y, this.s.z, t, _g); return Math.hypot(_g.x, _g.y); }
}
