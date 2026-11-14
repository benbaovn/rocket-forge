// A flying vehicle (player rocket, recovered booster, spent stage) simulated in the ECI frame.
// Attitude is a single in-plane angle `beta` (clockwise from ECI +Y); `ang` = beta − local-vertical angle.
import * as THREE from 'three';
import { PARTS, G0, R as CORE_R, isUfoPart } from '../parts.js';
import { rk4, keplerStep, coastStep, gravity, refBody, bodyInfo, bodyState, bodyPos, bodyRotation, bodyOmega, angOf, wrapPi } from '../sim/orbit.js';
import { ATM_H, ATM_TOP, RHO0, EARTH_A, R_SUN } from '../sim/constants.js';
import { tr } from '../i18n.js';

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
    this.legsT = this.isPlane ? 1 : 0; this.legsTarget = this.isPlane ? 1 : 0;
    this.finsT = 0; this.finsTarget = 0;
    this.chuteT = 0; this.chuteTarget = 0;
    this.landed = null;          // { body, psi, h } when resting on a surface
    this.crashed = false;
    this.clamped = false;        // held by launch clamps
    this.t = 0;
    this.thrustNow = 0; this.qNow = 0; this.accelNow = 1; this.machNow = 0; this.heatFlux = 0;
    this.descentGlow = 0; this.reentryTemp = 20; this.heatLoad = 0; this.atmFrictionNow = 0;
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
  hasHeatShield() { return this.segIdx.some((k) => this.ctx.segInfo[k]?.hasHeatShield); }
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
        const pH = p.height ?? p.def.height;
        const isBat = p.item.type === 'batteryPack' || p.def.isBattery;
        const canBurn = stInfo ? (isBat ? stInfo.useBatteryFuel : stInfo.useChemFuel) : true;
        const pm = p.def.dry + (p.def.fuel || 0) * (canBurn ? frac : 1);
        m += pm; my += pm * (p.y + pH / 2);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y + pH);
        if (p.item.attach && p.item.attach.includes('wheelsRover')) {
          minY = Math.min(minY, p.y - 0.205);
        }
        for (const a of p.item.attach) {
          if (a === 'booster') continue;
          const ad = PARTS[a];
          if (!ad) continue;
          const cnt = ad.count || 2;
          const aBat = a === 'batteryPack' || ad.isBattery;
          const aCanBurn = stInfo ? (aBat ? stInfo.useBatteryFuel : stInfo.useChemFuel) : true;
          const am = (ad.dry + (ad.fuel || 0) * (aCanBurn ? frac : 1)) * cnt;
          const y = a === 'gridfins' ? p.y + pH - 0.5 : a === 'legs' ? p.y + 1.0 : p.y + pH * 0.5;
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
      const foot = (d.objs[0]?.userData.footY ?? -3.8) * (d.objs[0]?.scale?.y || 1);
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
    if (this.isPlane) return (this.legsT ?? 1) > 0.1 ? 1.85 : 1.08;
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
    const altCyl = r - B.R;
    const zAltFrac = (this.landed || this.clamped || this.isSpecial || altCyl <= 70000)
      ? 0
      : altCyl >= 140000
        ? 1
        : ((altCyl - 70000) / 70000);
    const dzEff = dz * (zAltFrac * zAltFrac * (3 - 2 * zAltFrac));
    this.alt = Math.hypot(r, dzEff) - B.R;
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
    const chuteOpenRate = this.chuteT < 0.35 ? 0.20 : this.chuteT < 0.75 ? 0.11 : 0.08;
    this.chuteT += THREE.MathUtils.clamp(this.chuteTarget - this.chuteT, -h * 0.25, h * chuteOpenRate);

    const inAtm = (B.atm || 0) > 0 && this.alt < B.atm;
    const pr = inAtm ? Math.exp(-Math.max(0, this.alt) / (B.atmH || ATM_H)) : 0;
    const rho = (B.rho0 ?? RHO0) * pr;
    const { fuel, fuelMax, segInfo } = this.ctx;
    const k = this.activeSeg;
    const info = segInfo[k];
    const gLocal = (B.g || G0) * (B.R / (B.R + Math.max(0, this.alt))) ** 2;
    const gRatio = Math.max(0.005, gLocal / G0);
    const maxBatBoostCount = info.ufoTier ? 6 : 3;
    const batBoost = 1 + 0.25 * Math.min(maxBatBoostCount, info.batteryCount || 0);
    const ufoBatShield = info.ufoTier ? [1, 1.0, 0.55, 0.30, 0.16, 0.08][Math.min(5, info.ufoTier)] : 1.0;

    // Surrounding Aliens accelerate fuel & battery depletion (more Aliens around -> faster drain!)
    const alienDrainInfo = (env && env.getAlienFuelDrain) ? env.getAlienFuelDrain(this) : null;
    const nearbyAliens = alienDrainInfo ? (alienDrainInfo.count || 0) : 0;
    const alienDrainMul = alienDrainInfo ? (alienDrainInfo.drainMul || 1.0) : 1.0;
    this.nearbyAliens = nearbyAliens;
    this.alienDrainMul = alienDrainMul;

    // Compute local brightness / darkness for the Laser Engine (brighter -> slower, darker -> faster)
    let laserScale = 1.0;
    let solarChargeFactor = 1.0;
    const hasAnySolarBat = this.segIdx.some((sk) => segInfo[sk]?.solarOnBattery > 0 && segInfo[sk]?.batteryCount > 0);
    if (info.tLaser > 0 || hasAnySolarBat || (info.hasSolar && info.batteryCount > 0)) {
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
      solarChargeFactor = inShadow
        ? 0.55
        : THREE.MathUtils.clamp(0.75 + Math.min(2.0, solarIrradiance) * (0.55 + 0.45 * Math.max(0, cosZenith)), 0.75, 2.6);
      if (nearbyAliens > 0) {
        solarChargeFactor /= (1 + nearbyAliens * 0.22);
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
      // Higher-tier UFOs maintain a quantum-warp anti-gravity floor so higher-tier UFOs fly dramatically faster even in deep space
      // Laser thrust scales inversely with local brightness (brighter -> slower, darker -> faster)
      const ufoWarpFloor = info.ufoTier ? [0, 0.045, 0.08, 0.13, 0.19, 0.27][Math.min(5, info.ufoTier)] : 0;
      const agGRatio = Math.max(gRatio, ufoWarpFloor);
      const curThrust = (normVac - (normVac - normSL) * pr) + (agVac * agGRatio + lzVac * laserScale) * batBoost;
      const sciFiDrainScale = info.solarOnBattery > 0 ? 12.0 : 1.0;
      const curMdot = normMdot + (agMdot * Math.max(0.12, gRatio) + lzMdot * Math.max(0.18, laserScale * 0.75)) * sciFiDrainScale;
      thrust += curThrust * thr * engFrac;
      const planeFuelFloor = this.isPlane ? (fuelMax[k] || 0) * (nearbyAliens === 0 ? 0.25 : 0.15) : 0;
      const drainScale = this.isPlane ? 0.005 : 1.0;
      const effAlienDrainMul = 1 + (alienDrainMul - 1) * ufoBatShield;
      const fuelStepH = (this.isPlane && nearbyAliens > 0) ? Math.min(h, h / Math.max(1, this._warp || 1)) : h;
      fuel[k] = Math.max(planeFuelFloor, fuel[k] - curMdot * drainScale * effAlienDrainMul * thr * engFrac * fuelStepH);
      if (fuel[k] === 0 && !(info.solarOnBattery > 0 && info.batteryCount > 0)) {
        this.events.push(['fuelOut', k]);
      }
    }

    // Passive Alien energy/fuel siphon when surrounded by Aliens (more Aliens -> faster continuous drain!)
    if (nearbyAliens > 0 && !this.clamped && fuel[k] > 0 && (fuelMax[k] || 0) > 0) {
      const realDt = Math.min(h, h / Math.max(1, this._warp || 1));
      const passiveRate = (fuelMax[k] * 0.0028 * nearbyAliens * ufoBatShield) * (info.solarOnBattery > 0 ? 1.8 : 1.0);
      const prevF = fuel[k];
      const passiveFloor = this.isPlane ? (fuelMax[k] || 0) * 0.15 : 0;
      fuel[k] = Math.max(passiveFloor, fuel[k] - passiveRate * realDt);
      if (prevF > 0 && fuel[k] === 0 && !(info.solarOnBattery > 0 && info.batteryCount > 0)) {
        this.events.push(['fuelOut', k]);
      }
    }

    // Solar panels attached to a battery pack actively regenerate battery energy
    this.solarChargeRate = this.solarChargeRate || {};
    this.solarBoostMode = this.solarBoostMode || {};
    if (hasAnySolarBat && fuelMax) {
      for (const sk of this.segIdx) {
        const sInf = segInfo[sk];
        if (!sInf || !(sInf.solarOnBattery > 0) || !(sInf.batteryCount > 0) || !(fuelMax[sk] > 0)) {
          this.solarChargeRate[sk] = 0;
          continue;
        }
        const isFiringThisSeg = this.coreFiring && sk === k && thr > 0.35;
        if (fuel[sk] <= fuelMax[sk] * 0.88) {
          this.solarBoostMode[sk] = true;
        } else if (fuel[sk] >= fuelMax[sk] - 1e-4) {
          this.solarBoostMode[sk] = false;
        }
        if (fuel[sk] < fuelMax[sk]) {
          if (!isFiringThisSeg || this.solarBoostMode[sk]) {
            const chargeRate = (4.2 * sInf.solarOnBattery + fuelMax[sk] * 0.055) * solarChargeFactor;
            fuel[sk] = Math.min(fuelMax[sk], fuel[sk] + chargeRate * h);
            this.solarChargeRate[sk] = chargeRate;
          } else {
            const trickleRate = 0.25 * sInf.solarOnBattery * solarChargeFactor;
            fuel[sk] = Math.min(fuelMax[sk], fuel[sk] + trickleRate * h);
            this.solarChargeRate[sk] = trickleRate;
          }
        } else {
          this.solarChargeRate[sk] = 0;
        }
      }
    }
    this.boosterFiring = false;
    for (const b of this.boosters()) {
      if (b.seg !== k || !this.engineOn || b.fuel <= 0) continue;
      const d = PARTS.booster;
      thrust += (d.thrustVac - (d.thrustVac - d.thrustSL) * pr) * b.count;
      b.fuel = Math.max(0, b.fuel - b.count * d.thrustVac / (d.ispVac * G0) * alienDrainMul * h);
      this.boosterFiring = true;
      if (b.fuel === 0) this.events.push(['boosterOut', b]);
    }
    let mass = 0;
    for (const s of this.segIdx) mass += segInfo[s].dry + fuel[s];
    for (const b of this.boosters()) mass += b.dry + b.fuel;
    mass = Math.max(mass, 0.05);
    this.mass = mass;

    // ---------- aerodynamics (relative to the rotating atmosphere)
    const planeAtmLimit = (B.atm || 0) > 0 ? Math.max(2000, B.atm - 2000) : (B.gasGiant ? 34000 : 18000);
    const planeAtmFactor = this.isPlane ? THREE.MathUtils.clamp((planeAtmLimit - this.alt) / (planeAtmLimit * 0.22), 0, 1) : 1;
    // Air-breathing jet engines scale thrust, acceleration & max airspeed with local atmospheric density (thinner air -> slower in the air)
    const rhoRatio = Math.max(0, rho / RHO0);
    const planeRhoFactor = this.isPlane ? THREE.MathUtils.clamp(Math.pow(rhoRatio, 0.52), 0.32, 1.45) : 1;
    this.planeRhoFactor = planeRhoFactor;

    const ve = this.vSurf.e, vu = this.vSurf.u, vz = this.s.vz || 0;
    const v = Math.hypot(ve, vu);
    const v3D = this.isPlane ? Math.hypot(ve, vu, vz) : v;
    const vHoriz = this.isPlane ? Math.hypot(ve, vz) : Math.abs(ve);
    let area = Math.PI * CORE_R * CORE_R;
    for (const b of this.boosters()) area += b.count * Math.PI * 0.36;
    let aoa = 0;
    if (v > 1) aoa = wrapPi(this.ang - Math.atan2(ve, vu));
    const top = this.topType();
    const tailFirst = Math.abs(aoa) > Math.PI / 2;
    const hasShield = this.hasHeatShield();
    const isFallingInAtm = inAtm && vu < -1.5 && !this.landed && !this.clamped && !this.isPlane && !this.isRover && !this.isBoat;
    const cd0 = isUfoPart(top)
      ? (tailFirst ? 0.45 : 0.12)
      : (tailFirst ? 1.05 : top === 'nose' ? 0.28 : top === 'capsule' ? 0.42 : top === 'dockPort' ? 0.5 : 0.75);
    let bodyCdA = (cd0 + 1.4 * Math.sin(aoa) ** 2) * area;
    bodyCdA += this.legsT * 6 + this.finsT * 5.0;
    if (hasShield && vu < -5) bodyCdA += 9.5;
    const chute = this.capsule() ? this.chuteT : 0;
    let chuteCdA = 0;
    if (chute > 0) {
      if (chute < 0.35) {
        const u1 = chute / 0.35;
        chuteCdA = 6.0 * (u1 * u1);
      } else {
        const u2 = (chute - 0.35) / 0.65;
        chuteCdA = 6.0 + 420.0 * (u2 * u2 * (3 - 2 * u2));
      }
    }
    const cdA = bodyCdA + chuteCdA;
    const q = 0.5 * rho * v3D * v3D;
    this.qNow = q;
    const rhoNorm = rho > 0 ? Math.pow(Math.max(1e-5, rho / RHO0), 0.26) : 0;
    const downSpd = Math.max(0, -vu);
    const effDescentSpd = downSpd + 0.28 * Math.max(0, v3D - downSpd) * THREE.MathUtils.clamp(downSpd / 10, 0, 1);
    const spdNorm = isFallingInAtm ? Math.max(0, (effDescentSpd - 1.5) / 62.0) : 0;
    const targetDescentGlow = isFallingInAtm
      ? rhoNorm * (spdNorm * 1.15 + Math.pow(spdNorm, 1.75) * 2.25)
      : 0;
    this.descentGlow = (this.descentGlow ?? 0) + (targetDescentGlow - (this.descentGlow ?? 0)) * Math.min(1, h * 8.0);
    if (this.descentGlow < 0.002 || this.landed || this.clamped || !inAtm || vu >= -0.5) this.descentGlow = 0;

    const highSpdFlux = (inAtm && vu < -1.5) ? rhoNorm * Math.pow(v3D / 650, 2.3) : 0;
    this.heatFlux = rho > 0 ? Math.max(this.descentGlow, highSpdFlux) : 0;
    const targetTemp = 20 + this.heatFlux * 950;
    this.reentryTemp = (this.reentryTemp ?? 20) + (targetTemp - (this.reentryTemp ?? 20)) * Math.min(1, h * 2.5);
    if (hasShield) {
      this.heatLoad = Math.min(0.35, this.heatFlux * 0.12);
    } else if (isFallingInAtm && this.descentGlow > 0.90 && effDescentSpd > 52 && vu < -38 && chute < 0.25) {
      const heatRate = (this.descentGlow - 0.78) * 0.58 + (effDescentSpd > 95 ? 0.65 : 0);
      this.heatLoad = Math.min(1.0, (this.heatLoad || 0) + heatRate * h);
    } else {
      this.heatLoad = Math.max(0, (this.heatLoad || 0) - 0.45 * h);
    }
    this.machNow = v3D / (340 * Math.max(0.85, pr ** 0.05));
    let fe = 0, fu = 0, fz = 0;                           // aero force (kN) in local (east, up, z)
    this.atmFrictionNow = 0;
    if (v > 0.5 && q > 0 && !this.isPlane) {
      const bodyDragF = q * bodyCdA / 1000;
      let chuteDragF = 0;
      if (chuteCdA > 0) {
        const rawChuteAcc = (q * chuteCdA / 1000) / Math.max(0.1, mass);
        const chuteRamp = chute * chute * (3 - 2 * chute);
        const maxChuteAcc = (3.5 + 18.5 * chuteRamp) * (1 + Math.min(1.2, v / 180));
        const chuteAcc = (rawChuteAcc * maxChuteAcc) / Math.hypot(rawChuteAcc, maxChuteAcc);
        chuteDragF = chuteAcc * mass;
      }
      const dragF = bodyDragF + chuteDragF;
      fe -= dragF * ve / v; fu -= dragF * vu / v;
      if (isFallingInAtm) {
        const fallFactor = THREE.MathUtils.clamp((-vu - 8) / 55, 0, 1.8);
        const shieldBrake = hasShield ? 1.65 : 1.0;
        const frictionArea = area * (0.72 + 0.65 * fallFactor) * shieldBrake;
        const frictionF = (q * frictionArea) / 1000;
        fe -= frictionF * (ve / v);
        fu -= frictionF * (vu / v);
        this.atmFrictionNow = frictionF;
      }
      // body normal force (crossflow) – lets guidance steer with angle of attack
      const ax = Math.sin(this.ang), au = Math.cos(this.ang);
      const wx = -ve / v, wu = -vu / v;                   // air flow direction relative to body
      const wa = wx * ax + wu * au;
      const px = wx - wa * ax, pu = wu - wa * au;
      const kN = 0.9 + this.finsT * 0.8;
      const nF = q * area * kN * Math.abs(Math.sin(aoa)) / 1000;
      const pl = Math.hypot(px, pu);
      if (pl > 1e-4) { fe += nF * px / pl; fu += nF * pu / pl; }
    }

    // Airplane 3D aerodynamics & air-breathing intake drag in flight
    if (this.isPlane && v3D > 0.5) {
      const gamma = Math.atan2(vu, Math.max(0.5, vHoriz));
      const pitch = Math.PI / 2 - this.ang;
      const alpha = THREE.MathUtils.clamp(wrapPi(pitch - gamma), -0.65, 0.65);
      this.alpha = alpha;
      const hasWings = this.ctx.stack.some((it) => it.attach.includes('wingsPlane'));
      const wingArea = hasWings ? 24 : 8;
      const cl = THREE.MathUtils.clamp(alpha * 3.8 + 0.14, -1.3, 1.35);
      // Effective lift scales with speed relative to thin-air envelope so wings still support local weight at slower thin-air speeds
      const vLiftEff = v3D / Math.max(0.14, planeRhoFactor);
      const qLift = 0.5 * RHO0 * vLiftEff * vLiftEff * Math.max(0.32, gLocal / G0) * planeAtmFactor;
      const liftMag = qLift * wingArea * cl / 1000;
      const cosBank = Math.cos(this.bank || 0);
      const sinBank = Math.sin(this.bank || 0);
      // Upward lift perpendicular to 3D flight path
      const uLU = vHoriz / v3D;
      const uLH = -vu / v3D;
      const hDirE = vHoriz > 0.5 ? (ve / vHoriz) : Math.cos(this.heading || 0);
      const hDirZ = vHoriz > 0.5 ? (vz / vHoriz) : -Math.sin(this.heading || 0);
      fe += liftMag * cosBank * uLH * hDirE + liftMag * sinBank * Math.sin(this.heading || 0);
      fu += liftMag * cosBank * uLU;
      fz += liftMag * cosBank * uLH * hDirZ;
      this._lateralLift = liftMag * sinBank * Math.cos(this.heading || 0);

      // Air-breathing jet ram drag + thin-air speed ceiling (thinner air -> slower acceleration AND slower top speed in the air)
      const vMaxAir = Math.max(18, 235 * planeRhoFactor * Math.max(0.35, planeAtmFactor));
      const refJetThrust = Math.max(120, (info.tVac || 450) * planeRhoFactor * Math.max(0.25, planeAtmFactor));
      const ramDrag = refJetThrust * ((v3D / vMaxAir) ** 2) + (q * cdA / 1000) + Math.abs(liftMag * Math.sin(alpha)) * 0.28;
      fe -= ramDrag * (ve / v3D);
      fu -= ramDrag * (vu / v3D);
      fz -= ramDrag * (vz / v3D);
      if (v3D > vMaxAir) {
        const overBrake = (v3D - vMaxAir) * mass * 2.2;
        fe -= overBrake * (ve / v3D);
        fu -= overBrake * (vu / v3D);
        fz -= overBrake * (vz / v3D);
      }
    }

    // thrust (along the body axis in 3D)
    if (this.isPlane) thrust *= planeAtmFactor * planeRhoFactor;
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
      au_ += gLocal * 0.92 * thr * planeAtmFactor;
    }
    if (this.isPlane && this.alt >= planeAtmLimit * 0.88 && this.vSurf.u > 0) {
      au_ -= this.vSurf.u * 0.85;
    }
    // RCS translation (body frame: fwd, normal-in-plane, out-of-plane)
    let az = ((thrust * az_t) + fz + (this.isPlane ? (this._lateralLift || 0) : 0)) / mass;
    const [rf, rn, rz] = this.ctl.rcs;
    if (rf || rn || rz) {
      const A = 0.45;
      ae += A * (rf * ax + rn * au); au_ += A * (rf * au - rn * ax); az += A * rz;
    }

    // Weathercock vertical stabilizer alignment for plane in 3D horizontal flight
    if (this.isPlane && !this.clamped && !this.landed) {
      const vH = Math.hypot(ve, this.s.vz || 0);
      if (vH > 1) {
        const targetVe = vH * Math.cos(this.heading || 0);
        const targetVz = -vH * Math.sin(this.heading || 0);
        const curVz = this.s.vz || 0;
        const alignRate = Math.min(4.5, 1.8 + q / 400);
        ae += (targetVe - ve) * alignRate;
        az += (targetVz - curVz) * alignRate;
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
    // aerodynamic stability: fins (nose-first stable), grid fins deployed / heatShield / bare stages (tail-first stable)
    let stab = this.hasFins() ? 1.0 : -0.22;
    if (this.finsT > 0.5 || (hasShield && isFallingInAtm)) stab = -1.2;
    if (chute > 0.05) stab = -3.0 * (chute * chute);
    const aeroScale = this.ctl.targetBeta !== null && chute <= 0.05 ? 0.55 : 2.5;
    angAcc += -stab * q * Math.sin(aoa) * aeroScale / (mass * 1000) * (this.height / 20);

    // Airplane flight control authority (elevator pitch & aileron roll & rudder yaw)
    if (this.isPlane) {
      const warpScale = Math.max(1, this._warp || 1);
      const ctrlH = h > 0.25 ? (h / warpScale) : h;
      const qNorm = Math.min(2.5, Math.max(0.2, q / 1200));
      // W = +1 (pitch up -> negative angAcc), S = -1 (pitch down -> positive angAcc)
      const pitchInput = (this.ctl.drive || 0);
      const rollInput = this.ctl.input || 0; // A = -1 (bank/turn left), D = +1 (bank/turn right)
      this.bank = (this.bank || 0) + rollInput * 2.4 * ctrlH;
      this.bank *= Math.exp(-1.2 * ctrlH); // self-leveling bank damping
      this.bank = THREE.MathUtils.clamp(this.bank, -1.35, 1.35);

      // Pitch angular acceleration (negative angAcc decreases this.ang -> pitches nose UP)
      angAcc = -pitchInput * 1.8 * qNorm;
      // Pitch rate damping
      angAcc -= this.omega * Math.min(4.0, 1.2 + q / 600);
      // Aerodynamic pitch stability restoring towards flight path
      if (this.alpha !== undefined) {
        angAcc += this.alpha * 1.5 * qNorm;
      }

      // Yaw / Heading turning rate (A = -1 -> +turnYawRate = left; D = +1 -> -turnYawRate = right)
      const pullFactor = (pitchInput > 0) ? (1.0 + pitchInput * 1.6) : 1.0;
      const turnYawRate = -(Math.sin(this.bank) * 0.95 * pullFactor + rollInput * 0.5) * Math.min(2.4, Math.max(0.4, v / 30));
      this.turnYawRate = turnYawRate;
      this.heading = (this.heading || 0) + turnYawRate * ctrlH;
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
          const warpScale = Math.max(1, this._warp || 1);
          this.turnYawRate = turnYawRate;
          this.heading = (this.heading || 0) + (turnYawRate / warpScale) * h;
        } else {
          this.turnYawRate = 0;
        }
        const cosH = Math.cos(this.heading || 0), sinH = Math.sin(this.heading || 0);
        const prevSx = this.sx;
        const prevZ = this.s.z || 0;
        const sxFactor = this.ref === 'earth'
          ? cosH
          : (Math.abs(cosH) >= 0.4 ? cosH : (cosH >= -0.1 ? 0.65 : -0.65));
        let newSx = prevSx + this.groundSpeed * sxFactor * h;
        let newZ = prevZ - this.groundSpeed * sinH * h;
        if (this.ref !== 'earth') {
          newZ = THREE.MathUtils.clamp(newZ, -1200, 1200);
        }
        if (env.resolveBuilding) {
          const col = env.resolveBuilding(this, newSx, newZ, this.alt, 2.8);
          if (col && col.hit) {
            const intended = Math.hypot(newSx - prevSx, newZ - prevZ);
            const actual = Math.hypot(col.sx - prevSx, col.sz - prevZ);
            newSx = col.sx;
            newZ = col.sz;
            if (actual < intended * 0.25) this.groundSpeed = 0;
            else this.groundSpeed *= 0.85;
          }
        }
        const moveSign = this.groundSpeed >= 0 ? 1 : -1;
        let surf = env.surface({ ...this, sx: newSx, s: { ...this.s, z: newZ } });
        const surfEdge = env.surface({ ...this, sx: newSx + moveSign * 2.2 * cosH, s: { ...this.s, z: newZ - moveSign * 2.2 * sinH } });
        if (surf.water || surfEdge.water) {
          const surfX = env.surface({ ...this, sx: newSx, s: { ...this.s, z: prevZ } });
          const surfXEdge = env.surface({ ...this, sx: newSx + moveSign * 2.2 * cosH, s: { ...this.s, z: prevZ } });
          const surfZ = env.surface({ ...this, sx: prevSx, s: { ...this.s, z: newZ } });
          const surfZEdge = env.surface({ ...this, sx: prevSx, s: { ...this.s, z: newZ - moveSign * 2.2 * sinH } });
          if (!surfX.water && !surfXEdge.water) {
            newZ = prevZ;
            surf = surfX;
            this.groundSpeed *= 0.5;
          } else if (!surfZ.water && !surfZEdge.water) {
            newSx = prevSx;
            surf = surfZ;
            this.groundSpeed *= 0.5;
          } else {
            newSx = prevSx;
            newZ = prevZ;
            this.groundSpeed = 0;
            surf = env.surface({ ...this, sx: newSx, s: { ...this.s, z: newZ } });
          }
        }
        const stepDist = this.ref === 'earth'
          ? Math.hypot(newSx - prevSx, newZ - prevZ)
          : Math.abs(this.groundSpeed) * h;
        if (stepDist > 0) {
          this.roverDistTotal = (this.roverDistTotal || 0) + stepDist;
          if (!this.roverDistByBody) this.roverDistByBody = {};
          this.roverDistByBody[this.ref] = (this.roverDistByBody[this.ref] || 0) + stepDist;
        }
        const wheelLz = 0.72;
        const wheelLx = 1.50;
        const hF = env.surface({ ...this, sx: newSx + wheelLz * cosH, s: { ...this.s, z: newZ - wheelLz * sinH } }).h;
        const hB = env.surface({ ...this, sx: newSx - wheelLz * cosH, s: { ...this.s, z: newZ + wheelLz * sinH } }).h;
        const hL = env.surface({ ...this, sx: newSx - wheelLx * sinH, s: { ...this.s, z: newZ - wheelLx * cosH } }).h;
        const hR = env.surface({ ...this, sx: newSx + wheelLx * sinH, s: { ...this.s, z: newZ + wheelLx * cosH } }).h;
        const slopePitch = Math.atan2(hF - hB, 2 * wheelLz);
        const slopeRoll = THREE.MathUtils.clamp(Math.atan2(hL - hR, 2 * wheelLx), -0.55, 0.55);
        this.terrainRoll = slopeRoll;
        const pitchUp = THREE.MathUtils.clamp(slopePitch + drive * 0.025, -0.65, 0.65);
        const wheelPlaneH = (hF + hB + hL + hR) * 0.25;
        const baseSurfH = Math.max(surf.h, wheelPlaneH);
        const targetH = baseSurfH + this.bottomOffset() * Math.cos(pitchUp) * Math.cos(slopeRoll);
        const targetBeta = this.phi + pitchUp;
        this.beta = targetBeta;
        this.omega = 0;
        this.placeOnSurface(this.ref, newSx, targetH, t + h, this.beta);
        this.s.z = newZ;
        this.s.vz = -this.groundSpeed * sinH;
        this.s.vx += this.groundSpeed * cosH * this.east.x;
        this.s.vy += this.groundSpeed * cosH * this.east.y;
        this.updateFrame(t + h);
        this.landed = { body: this.ref, sx: newSx, sz: newZ, h: targetH, site: surf.site, how: 'rover' };
        this.landedLock = 0.2;
        return;
      }
      if (this.isBoat && !this.clamped) {
        const throttleDrive = (this.engineOn && this.throttle > 0) ? this.throttle : 0;
        const drive = this.ctl.drive !== 0 ? (this.ctl.drive || 0) : throttleDrive;
        const steer = this.ctl.input || 0;
        this.waterSpeed = this.waterSpeed || 0;
        if (drive !== 0) {
          const accRate = (drive * this.waterSpeed < 0) ? 75.0 : 48.0;
          this.waterSpeed = THREE.MathUtils.clamp(this.waterSpeed + drive * accRate * h, -35, 120);
        } else if (steer !== 0) {
          if (this.waterSpeed < 28) this.waterSpeed = Math.min(28, this.waterSpeed + 28.0 * h);
          else this.waterSpeed *= Math.exp(-0.8 * h);
        } else {
          this.waterSpeed *= Math.exp(-1.1 * h);
          if (Math.abs(this.waterSpeed) < 0.02) this.waterSpeed = 0;
        }
        if (steer !== 0) {
          const revSign = (drive < 0 && this.waterSpeed < -0.5) ? -1 : 1;
          const turnYawRate = -steer * 1.45 * revSign;
          const warpScale = Math.max(1, this._warp || 1);
          this.turnYawRate = turnYawRate;
          this.heading = (this.heading || 0) + (turnYawRate / warpScale) * h;
        } else {
          this.turnYawRate = 0;
        }
        const cosH = Math.cos(this.heading || 0), sinH = Math.sin(this.heading || 0);
        const prevSx = this.sx;
        const prevZ = this.s.z || 0;
        let newSx = prevSx + this.waterSpeed * cosH * h;
        let newZ = prevZ - this.waterSpeed * sinH * h;
        const moveSign = this.waterSpeed >= 0 ? 1 : -1;
        let surf = env.surface({ ...this, sx: newSx, s: { ...this.s, z: newZ } });
        const surfEdge = env.surface({ ...this, sx: newSx + moveSign * 4.5 * cosH, s: { ...this.s, z: newZ - moveSign * 4.5 * sinH } });
        if (this.ref === 'earth' && (!surf.water || !surfEdge.water)) {
          const surfX = env.surface({ ...this, sx: newSx, s: { ...this.s, z: prevZ } });
          const surfXEdge = env.surface({ ...this, sx: newSx + moveSign * 4.5 * cosH, s: { ...this.s, z: prevZ } });
          const surfZ = env.surface({ ...this, sx: prevSx, s: { ...this.s, z: newZ } });
          const surfZEdge = env.surface({ ...this, sx: prevSx, s: { ...this.s, z: newZ - moveSign * 4.5 * sinH } });
          if (surfX.water && surfXEdge.water) {
            newZ = prevZ;
            surf = surfX;
            this.waterSpeed *= 0.5;
          } else if (surfZ.water && surfZEdge.water) {
            newSx = prevSx;
            surf = surfZ;
            this.waterSpeed *= 0.5;
          } else {
            newSx = prevSx;
            newZ = prevZ;
            this.waterSpeed = 0;
            surf = env.surface({ ...this, sx: newSx, s: { ...this.s, z: newZ } });
          }
        }
        const stepDist = this.ref === 'earth'
          ? Math.hypot(newSx - prevSx, newZ - prevZ)
          : Math.abs(this.waterSpeed) * h;
        if (stepDist > 0) {
          this.boatDistTotal = (this.boatDistTotal || 0) + stepDist;
          if (!this.boatDistByBody) this.boatDistByBody = {};
          this.boatDistByBody[this.ref] = (this.boatDistByBody[this.ref] || 0) + stepDist;
        }
        const wave = Math.sin((t + h) * 2.5) * 0.06;
        const targetH = Math.max(surf.h, 0) + this.bottomOffset() - 0.35 + wave;
        const pitchUp = THREE.MathUtils.clamp(this.waterSpeed / 95 * 0.1, -0.05, 0.12);
        const targetBeta = this.phi + pitchUp;
        this.beta = targetBeta;
        this.omega = 0;
        this.placeOnSurface(this.ref, newSx, targetH, t + h, this.beta);
        this.s.z = newZ;
        this.s.vz = -this.waterSpeed * sinH;
        this.s.vx += this.waterSpeed * cosH * this.east.x;
        this.s.vy += this.waterSpeed * cosH * this.east.y;
        this.updateFrame(t + h);
        this.landed = { body: this.ref, sx: newSx, sz: newZ, h: targetH, site: surf.site, how: 'boat' };
        this.landedLock = 0.2;
        return;
      }
      if (this.isPlane && !this.clamped) {
        const rhoF = this.planeRhoFactor || 1;
        const drive = (this.engineOn && this.throttle > 0) ? this.throttle : 0;
        this.planeRollSpeed = this.planeRollSpeed || 0;
        const jetThrust = this.thrustNow > 0 ? this.thrustNow : (this.throttle * 450 * rhoF);
        const vMaxRoll = Math.max(18, 235 * rhoF);
        if (h > 0.25) {
          const targetRoll = drive > 0 ? vMaxRoll * Math.sqrt(drive) : 0;
          this.planeRollSpeed += (targetRoll - this.planeRollSpeed) * (1 - Math.exp(-h * 0.6));
          if (this.planeRollSpeed < 0.05 && drive === 0) this.planeRollSpeed = 0;
        } else {
          const rawAccel = (drive * jetThrust) / this.mass;
          const ramDragAccel = (rawAccel > 0 ? rawAccel : (450 * rhoF / this.mass)) * ((this.planeRollSpeed / vMaxRoll) ** 2);
          const rollFric = 0.35 * Math.min(1.0, rhoF);
          this.planeRollSpeed = Math.max(0, this.planeRollSpeed + (rawAccel - ramDragAccel - rollFric) * h);
          if (drive === 0) this.planeRollSpeed *= Math.exp(-0.8 * h);
          if (this.planeRollSpeed < 0.05 && drive === 0) this.planeRollSpeed = 0;
        }

        // Ground steering with A / D (A = -1 -> +heading = left; D = +1 -> -heading = right)
        const steer = this.ctl.input || 0;
        if (steer !== 0 && this.planeRollSpeed > 0.5) {
          const steerRate = THREE.MathUtils.clamp(-steer * 1.2 * Math.min(1.0, 18 / (this.planeRollSpeed + 5)), -0.8, 0.8);
          const steerH = h > 0.25 ? (h / Math.max(1, this._warp || 1)) : h;
          this.heading = (this.heading || 0) + steerRate * steerH;
        }

        const pitchControl = this.ctl.drive || 0; // W = +1 (pitch up), S = -1 (pitch down)
        const minRotateSpd = Math.max(10, 25 * rhoF);
        const minLiftoffSpd = Math.max(14, 35 * rhoF);
        const rotateUp = (this.planeRollSpeed > minRotateSpd && pitchControl > 0) ? (pitchControl * 0.16) : 0;
        const targetBeta = this.phi + Math.PI / 2 - rotateUp;

        const vRollEff = this.planeRollSpeed / Math.max(0.14, rhoF);
        const qRoll = 0.5 * RHO0 * vRollEff * vRollEff * Math.max(0.32, gLocal / G0);
        const hasWings = this.ctx.stack.some((it) => it.attach.includes('wingsPlane'));
        const wingArea = hasWings ? 24 : 8;
        const clRotate = (rotateUp > 0.02) ? 0.95 : 0.25;
        const liftForce = qRoll * wingArea * clRotate / 1000;
        const weightForce = this.mass * gLocal;

        const cosH = Math.cos(this.heading || 0), sinH = Math.sin(this.heading || 0);
        const prevZ = this.s.z || 0;
        let newSx = this.sx + this.planeRollSpeed * cosH * h;
        let newZ = prevZ - this.planeRollSpeed * sinH * h;
        if (env.resolveBuilding) {
          const col = env.resolveBuilding(this, newSx, newZ, this.alt, 4.4);
          if (col && col.hit) {
            newSx = col.sx;
            newZ = col.sz;
            this.planeRollSpeed = 0;
          }
        }
        const rollDist = Math.abs(this.planeRollSpeed || 0) * h;
        if (rollDist > 0) {
          this.planeDistTotal = (this.planeDistTotal || 0) + rollDist;
          if (!this.planeDistByBody) this.planeDistByBody = {};
          this.planeDistByBody[this.ref] = (this.planeDistByBody[this.ref] || 0) + rollDist;
        }

        if (liftForce > weightForce * 0.92 && this.planeRollSpeed > minLiftoffSpd) {
          this.landed = null;
          this.landedLock = 0;
          const surf = env.surface({ ...this, sx: newSx, s: { ...this.s, z: newZ } });
          const targetH = surf.h + this.bottomOffset() + 3.2;
          this.beta = this.phi + Math.PI / 2 - 0.16;
          this.omega = -0.05;
          this.placeOnSurface(this.ref, newSx, targetH, t + h, this.beta);
          this.s.z = newZ;
          this.s.vz = -this.planeRollSpeed * sinH;
          const climbV = Math.max(12, 15 * rhoF);
          this.vSurf.e = this.planeRollSpeed * cosH;
          this.vSurf.u = climbV;
          this.vSurf.z = this.s.vz;
          this.s.vx += this.vSurf.e * this.east.x + climbV * this.up.x;
          this.s.vy += this.vSurf.e * this.east.y + climbV * this.up.y;
          this.updateFrame(t + h);
          this.events.push(['liftoff']);
          return;
        }

        const surf = env.surface({ ...this, sx: newSx, s: { ...this.s, z: newZ } });
        if (surf.water) {
          this.landed = null;
          this.landedLock = 0;
          const crashH = Math.max(0, surf.h) + Math.max(0.8, Math.min(this.bottomOffset(), 4.0));
          this.placeOnSurface(this.ref, newSx, crashH, t + h, targetBeta);
          this.s.z = newZ;
          this.updateFrame(t + h);
          this.speedSurf = this.planeRollSpeed;
          this.agl = 0;
          this.crashAnchor = { mode: 'surface', body: this.ref, sx: newSx, sz: newZ, h: crashH, betaOff: wrapPi(targetBeta - this.phi) };
          this.crash(tr('Máy bay lao ra khỏi đảo rơi xuống biển!', 'Aircraft rolled off the island into the ocean!'), 'water', {
            sp: this.planeRollSpeed, vLim: 0, vertSp: 0, horizSp: this.planeRollSpeed, tiltDeg: 0,
            chuteOk: false, legsOk: true, hasCapsule: false, hasLegs: true, where: 'water',
          });
          return;
        }
        const targetH = surf.h + this.bottomOffset();
        this.beta = targetBeta;
        this.omega = 0;
        this.placeOnSurface(this.ref, newSx, targetH, t + h, this.beta);
        this.s.z = newZ;
        this.s.vz = -this.planeRollSpeed * sinH;
        this.s.vx += this.planeRollSpeed * cosH * this.east.x;
        this.s.vy += this.planeRollSpeed * cosH * this.east.y;
        this.updateFrame(t + h);
        this.landed = { body: this.ref, sx: newSx, sz: newZ, h: targetH, site: surf.site, how: 'plane' };
        this.landedLock = 0.2;
        return;
      }
      const up = au_ - (B.g || G0) * (B.R / (B.R + this.alt)) ** 2;
      if (this.clamped || up <= 0.05 || this.landedLock > 0) {
        this.landedLock = Math.max(0, (this.landedLock || 0) - h);
        // stay on the rotating surface
        const L = this.landed || this.clampSpot;
        if (L) {
          this.placeOnSurface(L.body, L.sx, L.h, t + h, this.beta + bodyOmega(L.body) * h);
          if (L.sz !== undefined) {
            this.s.z = L.sz;
            this.updateFrame(t + h);
          }
        }
        // settle upright
        if (this.landed && !this.clamped) { this.beta += wrapPi(this.phi - this.beta) * Math.min(1, h * 2); this.omega = 0; }
        return;
      }
      this.landed = null;
      this.events.push(['liftoff']);
    }

    const prevPhi = this.phi;
    const prevRef = this.ref, prevSx = this.sx, prevAlt = this.alt, prevZ = this.s.z || 0;

    // Unconditionally stable quasi-steady macro flight step for airplanes at extreme time warp (10,000x – 10,000,000x)
    if (this.isPlane && !this.clamped && !this.landed && h > 0.25) {
      const warpScale = Math.max(1, this._warp || 1);
      const ctrlH = h / warpScale;
      const vMaxAir = Math.max(18, 235 * planeRhoFactor * Math.max(0.35, planeAtmFactor));
      const targetSpd = (this.coreFiring && thr > 0) ? (vMaxAir * Math.sqrt(thr)) : 0;
      const vNew = v3D + (targetSpd - v3D) * (1 - Math.exp(-h * 0.45));
      const minFlySpd = Math.max(14, 32 * planeRhoFactor);
      const pitchInput = this.ctl.drive || 0;
      let dAlt = 0;
      if (vNew < minFlySpd) {
        dAlt = -Math.max(8, gLocal * 1.4) * h;
      } else if (pitchInput !== 0) {
        const manualClimbRate = Math.min(1800, Math.max(250, planeAtmLimit * 0.08));
        dAlt = pitchInput * manualClimbRate * ctrlH;
      } else if (typeof this._guidedTargetAlt === 'number') {
        dAlt = (this._guidedTargetAlt - this.alt) * (1 - Math.exp(-h * 0.12));
      } else if (!B.gasGiant) {
        const curSurf = env.surface(this);
        const safeFloor = (curSurf.water ? Math.max(0, curSurf.h) : curSurf.h) + 85;
        if (this.alt < safeFloor && this.alt > curSurf.h + 4) {
          dAlt = (safeFloor - this.alt) * (1 - Math.exp(-h * 0.2));
        }
      }
      let hitCeil = false;
      let newAlt = this.alt + dAlt;
      if (newAlt > planeAtmLimit) {
        newAlt = planeAtmLimit;
        hitCeil = true;
      }
      const vuEff = h > 1e-6 ? (newAlt - this.alt) / h : 0;
      const vHorizNew = Math.sqrt(Math.max(0, vNew * vNew - Math.min(vNew * vNew * 0.5, vuEff * vuEff)));
      const cosH = Math.cos(this.heading || 0), sinH = Math.sin(this.heading || 0);
      const newSx = wrapPi((this.sx + vHorizNew * cosH * h) / B.R) * B.R;
      const maxPolarZ = 0.48 * Math.PI * B.R;
      const newZ = THREE.MathUtils.clamp((this.s.z || 0) - vHorizNew * sinH * h, -maxPolarZ, maxPolarZ);
      const airDist = vHorizNew * h;
      if (airDist > 0) {
        this.planeDistTotal = (this.planeDistTotal || 0) + airDist;
        if (!this.planeDistByBody) this.planeDistByBody = {};
        this.planeDistByBody[this.ref] = (this.planeDistByBody[this.ref] || 0) + airDist;
      }
      const visPitch = pitchInput !== 0
        ? (pitchInput * 0.14)
        : THREE.MathUtils.clamp(Math.atan2(vuEff, Math.max(20, vHorizNew)), -0.18, 0.22);
      const psiNew = newSx / B.R + bodyRotation(this.ref, t + h);
      const betaNew = wrapPi(psiNew + Math.PI / 2 - visPitch);
      this.omega = 0;
      this.placeOnSurface(this.ref, newSx, newAlt, t + h, betaNew);
      this.s.z = newZ;
      this.s.vz = -vHorizNew * sinH;
      this.s.vx += vHorizNew * cosH * this.east.x + vuEff * this.up.x;
      this.s.vy += vHorizNew * cosH * this.east.y + vuEff * this.up.y;
      this.updateFrame(t + h);
      this.syncDir3DFromBeta();
      if (this.holdDir3D && this.dir3D) this.holdDir3D.copy(this.dir3D);
      if (hitCeil && (!this._ceilWarnT || t - this._ceilWarnT > 8)) {
        this._ceilWarnT = t;
        this.events.push(['atmCeiling']);
      }
    } else {
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
      if (this.isPlane && !this.clamped && !this.landed) {
        this.beta = wrapPi(this.beta + wrapPi(this.phi - prevPhi));
        this.syncDir3DFromBeta();
        if (this.holdDir3D && this.dir3D) this.holdDir3D.copy(this.dir3D);
        const airDist = Math.hypot(this.vSurf.e, this.s.vz || 0) * h;
        if (airDist > 0) {
          this.planeDistTotal = (this.planeDistTotal || 0) + airDist;
          if (!this.planeDistByBody) this.planeDistByBody = {};
          this.planeDistByBody[this.ref] = (this.planeDistByBody[this.ref] || 0) + airDist;
        }
      }
    }

    // Block airborne vessels from passing through solid buildings on Earth
    if (this.ref === 'earth' && !this.clamped && !this.landed && this.alt < 180 && env.resolveBuilding) {
      const col = env.resolveBuilding(this, this.sx, this.s.z || 0, this.alt, this.isPlane ? 4.4 : 2.8);
      if (col && col.hit) {
        const dx = col.sx - this.sx;
        this.s.x += this.east.x * dx;
        this.s.y += this.east.y * dx;
        this.s.z = col.sz;
        if (col.hitX !== 0 && this.vSurf.e * col.hitX < 0) {
          this.s.vx -= this.vSurf.e * this.east.x;
          this.s.vy -= this.vSurf.e * this.east.y;
        }
        if (col.hitZ !== 0 && (this.s.vz || 0) * col.hitZ < 0) {
          this.s.vz = 0;
        }
        this.updateFrame(t + h);
      }
    }

    // Prevent airplanes from ever leaving the atmosphere of any planet
    if (this.isPlane && !this.clamped && !this.landed && this.alt > planeAtmLimit) {
      bodyState(this.ref, t + h, _bp, _bv);
      const rCeil = B.R + planeAtmLimit;
      this.s.x = _bp.x + this.up.x * rCeil;
      this.s.y = _bp.y + this.up.y * rCeil;
      if (this.vSurf.u > 0) {
        this.s.vx -= this.vSurf.u * this.up.x;
        this.s.vy -= this.vSurf.u * this.up.y;
      }
      const curPitch = Math.PI / 2 - this.ang;
      if (curPitch > 0) {
        this.beta = wrapPi(this.phi + Math.PI / 2);
        this.omega = Math.min(0, this.omega);
        this.syncDir3DFromBeta();
      }
      this.updateFrame(t + h);
      if (!this._ceilWarnT || t - this._ceilWarnT > 8) {
        this._ceilWarnT = t;
        this.events.push(['atmCeiling']);
      }
    }

    // ---------- surface contact (gas giants Jupiter, Saturn, Uranus, Neptune have no solid surface and can be flown straight through)
    if (B.gasGiant) {
      this.agl = this.alt;
      return;
    }
    const surf = env.surface(this);
    const bottom = this.alt - this.bottomOffset() * Math.cos(this.ang) - surf.h;
    this.agl = bottom;
    if (bottom <= 0) {
      const vs = this.vSurf;
      const sp = Math.hypot(vs.e, vs.u);
      const tilt = Math.abs(this.ang);
      const isUfo = !!(info && info.ufoTier > 0);
      const legsOk = isUfo || (this.hasLegs() && this.legsT > 0.95);
      const chuteOk = this.capsule() && chute > 0.65;
      const vLim = chuteOk ? 14 : isUfo ? 12 : legsOk ? 8 : 6;
      const details = {
        sp,
        vLim: surf.water && (chuteOk || isUfo) ? 16 : vLim,
        vertSp: Math.abs(vs.u),
        horizSp: Math.abs(vs.e),
        tiltDeg: Math.round(tilt * 180 / Math.PI),
        chuteOk,
        legsOk,
        hasCapsule: !!this.capsule(),
        hasLegs: this.hasLegs() || isUfo,
        where: surf.water ? 'water' : 'ground',
      };
      const crashOnSurface = (reason, where) => {
        const preSpeedSurf = this.speedSurf;
        let impSx = this.sx;
        let impZ = this.s.z || 0;
        let impSurf = surf;
        if (prevRef === this.ref && prevAlt > surf.h && bottom < -10) {
          const prevBottom = prevAlt - this.bottomOffset() * Math.cos(this.ang) - surf.h;
          const frac = prevBottom > 0 ? THREE.MathUtils.clamp(prevBottom / (prevBottom - bottom), 0, 1) : 0;
          const dSx = wrapPi((this.sx - prevSx) / B.R) * B.R;
          if (Math.abs(dSx) < B.R * 0.5) {
            impSx = prevSx + dSx * frac;
            impZ = prevZ + (impZ - prevZ) * frac;
            impSurf = env.surface({ ...this, ref: this.ref, sx: impSx, phiRot: impSx / B.R, s: { ...this.s, z: impZ } });
          }
        }
        const crashH = (impSurf.water ? Math.max(0, impSurf.h) : impSurf.h) + Math.max(0.8, Math.min(this.bottomOffset(), 6.0));
        const keepBeta = this.beta;
        this.placeOnSurface(this.ref, impSx, crashH, t + h, keepBeta);
        if (impZ) {
          this.s.z = impZ;
          this.updateFrame(t + h);
        }
        this.speedSurf = preSpeedSurf;
        this.agl = 0;
        this.crashAnchor = { mode: 'surface', body: this.ref, sx: impSx, sz: impZ, h: crashH, betaOff: wrapPi(this.beta - this.phi) };
        this.crash(reason, where, details);
      };
      if (surf.water) {
        if (this.isBoat) {
          this.settle(surf, t, 'floating');
          return;
        }
        if ((chuteOk || isUfo) && sp < 16) this.settle(surf, t, 'splash');
        else crashOnSurface(sp > 40 ? tr('Lao xuống biển!', 'Plunged into the ocean!') : tr('Rơi xuống biển!', 'Crashed into the ocean!'), 'water');
      } else if (this.isRover) {
        if (sp < 55 && tilt < 0.7) {
          this.groundSpeed = vs.e;
          this.settle(surf, t, 'rover');
        } else crashOnSurface(sp > 60 ? tr('Lao xuống mặt đất!', 'Slammed into the ground!') : tr('Va chạm mạnh khi tiếp đất!', 'Hard impact on touchdown!'), 'ground');
      } else if (this.isBoat) {
        if (sp < 7) this.settle(surf, t, 'beached');
        else crashOnSurface(tr('Tàu va vào bờ đá!', 'Boat crashed into rocky shore!'), 'ground');
      } else if (this.isPlane) {
        if (vs.u > 0) return; // Climbing/taking off
        const vertRate = Math.abs(vs.u);
        const pitch = Math.abs(wrapPi(this.beta - this.phi - Math.PI / 2));
        if (vertRate < 16 && pitch < 0.45 && !surf.water) {
          this.planeRollSpeed = Math.max(0, vs.e);
          this.settle(surf, t, 'landed');
        } else if (surf.water) {
          crashOnSurface(tr('Máy bay rơi xuống biển!', 'Aircraft crashed into the ocean!'), 'water');
        } else {
          crashOnSurface(vertRate > 30 ? tr('Lao máy bay xuống mặt đất!', 'Aircraft slammed into the ground!') : tr('Va chạm mạnh khi hạ cánh!', 'Hard impact on landing!'), 'ground');
        }
      } else if (sp < vLim && Math.abs(vs.e) < (isUfo ? 8 : 4) && tilt < (isUfo ? 0.45 : legsOk ? 0.3 : 0.45)) this.settle(surf, t, 'landed');
      else crashOnSurface(sp > 60 ? tr('Lao xuống mặt đất!', 'Slammed into the ground!') : tr('Va chạm mạnh khi tiếp đất!', 'Hard impact on touchdown!'), 'ground');
    }
  }

  settle(surf, t, how) {
    const targetBeta = this.isPlane ? (this.phi + Math.PI / 2) : this.beta;
    const keepZ = this.s.z || 0;
    this.landed = { body: this.ref, sx: this.sx, sz: keepZ, h: surf.h + this.bottomOffset(), site: surf.site, how };
    this.landedLock = 1.0;
    this.omega = 0;
    this.placeOnSurface(this.ref, this.sx, this.landed.h, t, targetBeta);
    if (keepZ) {
      this.s.z = keepZ;
      this.updateFrame(t);
    }
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
