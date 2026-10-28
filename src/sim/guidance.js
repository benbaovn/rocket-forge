// Autopilot programs: ascent to orbit, booster recovery, ISS rendezvous & docking, lunar/planetary mission legs.
import { elements, angOf, wrapPi, predict, moonPos, moonVel, bodyPos, bodyVel, bodyInfo } from './orbit.js';
import { MU_E, MU_M, R_E, R_M, MOON_A, MOON_N, ATM_TOP, ATM_H, RHO0, G0, LZ_X, BODIES } from './constants.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const D2R = Math.PI / 180;

/** osculating elements of a vessel about its reference body */
export function vesselElements(v) {
  const B = bodyInfo(v.ref);
  return elements(v.rRel.x, v.rRel.y, v.vRel.x, v.vRel.y, B.mu);
}

/** maximum available acceleration (m/s²) for the active stage at current throttle mode */
export function maxAccel(v, mode = v.engMode) {
  const info = v.info;
  if (!info || info.tVac <= 0 || v.ctx.fuel[v.activeSeg] <= 0) return 0;
  const B = bodyInfo(v.ref);
  const pr = B.atm > 0 && v.alt < B.atm ? Math.exp(-Math.max(0, v.alt) / (B.atmH || ATM_H)) : 0;
  const n = Math.max(1, info.engCount || 1);
  const frac = mode === 'center' ? 1 / n : mode === 'three' ? Math.min(1, 3 / n) : 1;
  return (info.tVac - (info.tVac - info.tSL) * pr) * frac / Math.max(0.1, v.mass || v.com.mass);
}

function surfaceG(v) { const B = bodyInfo(v.ref); return (B.g || G0) * (B.R / (B.R + Math.max(0, v.alt))) ** 2; }

/** beta (inertial attitude) for a local angle from vertical */
export const betaFromAng = (v, ang) => v.phi + ang;
export const progradeBeta = (v) => angOf(v.vRel.x, v.vRel.y);

/** quick flat-earth ballistic impact prediction with drag (for recovery guidance) */
export function predictImpact(v, cdA = 10, targetH = 0) {
  let x = v.sx, y = v.alt, ve = v.vSurf.e, vu = v.vSurf.u;
  const m = (v.mass || v.com.mass) * 1000;
  const g = surfaceG(v);
  let t = 0;
  for (let i = 0; i < 2000 && y > targetH; i++) {
    const h = y > 20000 ? 1.0 : 0.25;
    const rho = RHO0 * Math.exp(-Math.max(0, y) / ATM_H);
    const sp = Math.hypot(ve, vu);
    const k = 0.5 * rho * sp * cdA / m;
    ve -= k * ve * h; vu -= (k * vu + g) * h;
    x += ve * h; y += vu * h; t += h;
  }
  return { x, t, ve, vu };
}

// =====================================================================================
/** Powered-descent controller shared by booster landing and lunar landing. Returns true when burning. */
export function poweredDescent(v, o = {}) {
  const g = surfaceG(v);
  const h = (v.agl ?? v.alt) - (o.stopH ?? 1.2);
  const ve = v.vSurf.e, vu = v.vSurf.u;
  const sp = Math.hypot(ve, vu);
  let mode = 'all';
  if (o.multi) {
    const aC = maxAccel(v, 'center');
    const a3 = maxAccel(v, 'three');
    const brakeC = 0.75 * aC - g;
    const brake3 = 0.75 * a3 - g;

    if (h > 35 && (sp > 18 || vu < -8)) {
      mode = 'all';
    } else {
      mode = brakeC >= 1.0 && h < 15 ? 'center' : 'three';
    }
    if (v.engMode === 'center' && v._descBurn && brakeC > 0.5 && h < 30) mode = 'center';
  }
  let aMax = maxAccel(v, mode);
  if (aMax <= 0) return false;
  const aBrake = Math.max(1.0, 0.75 * aMax - g);
  let vuDes = -Math.max(1.5, Math.min(Math.sqrt(2 * aBrake * Math.max(h, 0)), 0.35 * Math.max(h, 0) + 1.5));
  // horizontal: kill drift and steer toward the target x
  let veDes = 0;
  if (o.targetX !== undefined) {
    const dx = v.sx - o.targetX;
    const maxV = h < 50 ? 3.0 : h < 120 ? 8.0 : 25;
    veDes = clamp(-dx * (h > 150 ? 0.15 : 0.25), -maxV, maxV) * clamp((h - 20) / 80, 0, 1);
  }
  const hStop = (vu * vu) / (2 * aBrake) + 15;
  if (!v._descBurn && vu < -2.0 && h <= hStop && h < (o.maxStartH ?? 1e9)) v._descBurn = true;
  if (!v._descBurn && vu < vuDes - 0.5 && h < (o.maxStartH ?? 1e9)) v._descBurn = true;
  if (!v._descBurn && o.horizontalFirst && Math.abs(ve) > 40) v._descBurn = true;
  const retroAng = Math.atan2(-ve, -vu);
  if (!v._descBurn) { v.engineOn = false; v.ctl.targetBeta = v.phi + retroAng; return false; }
  let aU = clamp(g + (vuDes - vu) * 3.5, 0, aMax);
  const lim = Math.min(Math.sqrt(Math.max(0, aMax * aMax - aU * aU)), o.horizontalFirst ? aMax : Math.max(aU * 0.7, 3.0));
  let aE = clamp((veDes - ve) * 1.8, -lim, lim);
  const tilt = h < 20 ? 0.05 : h < 60 ? 0.15 : h < 200 ? 0.4 : o.horizontalFirst ? 1.45 : 0.65;
  const mag = Math.hypot(aE, aU);
  let ang = mag > 0.08 * aMax ? Math.atan2(aE, aU) : clamp(retroAng, -0.3, 0.3);
  ang = clamp(ang, -tilt, tilt);
  // thrust
  const pointErr = Math.abs(wrapPi(v.phi + ang - v.beta));
  v.engMode = mode;
  v.engineOn = true;
  const pointFactor = pointErr > 0.6 ? 0.65 : pointErr > 0.3 ? 0.85 : 1.0;
  v.throttle = clamp(mag / aMax, 0.05, 1) * pointFactor;
  v.ctl.targetBeta = v.phi + ang;
  v.ctl.kp = 4.5; v.ctl.kd = 4.0;
  if (o.legsAt !== undefined && h < o.legsAt) v.legsTarget = 1;
  return true;
}

// =====================================================================================
/** Ascent: gravity turn → MECO at target apoapsis → coast → circularise. Works for Earth and Moon. */
export class AscentProgram {
  constructor(targetAlt, body = 'earth') {
    this.targetAlt = targetAlt; this.body = body; this.phase = 'ascent';
    this.label = 'Bay lên quỹ đạo';
  }
  status() { return { ascent: 'Quay trọng lực', coast: 'Bay quán tính tới viễn điểm', circ: 'Đốt tròn hoá quỹ đạo', done: 'Đã vào quỹ đạo' }[this.phase]; }
  update(v, sc) {
    const B = bodyInfo(this.body);
    const el = vesselElements(v);
    const apAlt = el.ap - B.R, peAlt = el.pe - B.R;
    v.engMode = 'all';
    if (v.ctx.fuel[v.activeSeg] <= 0) sc.autoStage(v);
    if (this.phase === 'ascent') {
      const altKm = Math.max(0, v.alt - (sc.startAlt || 0)) / 1000;
      let deg;
      if (this.body === 'earth') deg = 88 * Math.pow(clamp((altKm - 0.6) / 48, 0, 1), 0.5);
      else deg = altKm < 0.4 ? 0 : 85 * Math.pow(clamp((altKm - 0.4) / 6, 0, 1), 0.45);
      // after leaving the dense atmosphere, follow prograde if it is flatter than the profile
      if (this.body === 'earth' && v.alt > 40000) deg = Math.max(deg, Math.min(90, (wrapPi(progradeBeta(v) - v.phi)) / D2R));
      v.ctl.targetBeta = betaFromAng(v, deg * D2R);
      v.throttle = 1; v.engineOn = true;
      // recoverable first stage: separate early (Falcon-9 style) so it keeps fuel to fly home
      if (sc.isRecoverable && sc.isRecoverable(v)) {
        const k = v.activeSeg;
        const reserve = v.ctx.segInfo[k].dry * (Math.exp(620 / 2900) - 1);
        if (apAlt >= (this.body === 'earth' ? 42000 : 1e9) || v.ctx.fuel[k] <= reserve) {
          sc.autoStage(v, 'recover');
        }
      }
      if (apAlt >= this.targetAlt) { v.engineOn = false; this.phase = 'coast'; sc.event('Tắt động cơ – viễn điểm đạt ' + Math.round(apAlt / 1000) + ' km.'); }
    } else if (this.phase === 'coast') {
      v.engineOn = false;
      v.ctl.targetBeta = betaFromAng(v, 90 * D2R);
      // atmospheric drag can lower apoapsis – top it up
      if (apAlt < this.targetAlt - 1500 && v.alt < (B.atm || 0)) { v.engineOn = true; v.throttle = 0.4; }
      const vAp = Math.sqrt(Math.max(0, B.mu * (2 / el.ap - 1 / el.a)));
      const vCirc = Math.sqrt(B.mu / el.ap);
      const a = maxAccel(v, 'all') || 1;
      const burnT = (vCirc - vAp) / a;
      const ready = v.alt > (B.atm || 0) && el.tAp < burnT / 2 + 3;
      sc.requestWarp(ready || el.tAp < burnT / 2 + 25 ? 1 : v.alt > (B.atm || 0) ? 50 : 4);
      if (ready || (v.vOrb.u < -5 && v.alt > (B.atm || 0))) { this.phase = 'circ'; sc.event('Bắt đầu đốt tròn hoá quỹ đạo.'); }
    } else if (this.phase === 'circ') {
      // horizontal burn, pitch up a little if we are falling
      const pitch = clamp(-v.vOrb.u * 0.02, -0.25, 0.35);
      v.ctl.targetBeta = betaFromAng(v, (90 * D2R) - pitch);
      v.engineOn = true;
      const dv = Math.sqrt(B.mu / (B.R + v.alt)) - v.vOrb.e;
      const a = maxAccel(v, 'all') || 1;
      v.throttle = clamp(dv / a / 1.5, 0.05, 1);
      const minPe = Math.max(this.targetAlt - 4000, (B.atm || 0) + 4000);
      if (peAlt > minPe || (peAlt > (B.atm || 0) + 3000 && dv < 1)) {
        v.engineOn = false; this.phase = 'done';
        return 'done';
      }
    }
    return null;
  }
}

// =====================================================================================
/** Booster recovery state machine (runs on a separated first stage). */
export class BoosterRecovery {
  constructor(v, sc) {
    this.v = v; this.sc = sc;
    this.phase = 'coast'; this.t = 0;
    this.site = null; this.targetX = 0;
    v.ctl.targetBeta = v.beta;
  }
  status() {
    return { coast: 'Tách tầng', flip: 'Lật đầu', boostback: 'Đốt quay về', fall: 'Rơi tự do – bung cánh lưới', entry: 'Đốt khi vào khí quyển', glide: 'Lướt bằng cánh lưới', landing: 'Đốt hạ cánh', done: 'Đã hạ cánh', lost: 'Mất tầng đẩy' }[this.phase];
  }
  update(dt) {
    const v = this.v, sc = this.sc;
    if (v.crashed) { this.phase = 'lost'; return; }
    if (v.landed) { this.phase = 'done'; v.engineOn = false; return; }
    this.t += dt;
    const retro = v.phi + Math.atan2(-v.vSurf.e, -v.vSurf.u);
    if (this.phase === 'coast') {
      v.engineOn = false;
      if (this.t > 2.5) {
        this.phase = 'flip'; this.t = 0;
        // choose recovery site
        const imp = predictImpact(v, 9);
        const dvBack = Math.abs(v.vSurf.e) * 2.2 + 350;
        const ve = 2900, md = v.mass - v.fuelTotal();
        const dvAvail = ve * Math.log(v.mass / Math.max(0.1, md));
        const shipOK = imp.x > sc.coastX + 4000;
        if (sc.recoveryMode !== 'asds' && (dvAvail > dvBack + 450 || !shipOK)) { this.site = 'lz'; this.targetX = LZ_X; }
        else { this.site = 'ship'; this.targetX = imp.x; sc.placeDroneShip(imp.x); }
        v.finsTarget = 1;
        sc.event(this.site === 'lz' ? 'Tầng 1: quay về bãi đáp LZ-1.' : 'Tầng 1: hạ cánh trên sà lan ngoài biển.', '');
      }
    } else if (this.phase === 'flip') {
      v.engineOn = false;
      const tgt = this.site === 'lz' ? v.phi - 75 * D2R : retro;
      v.ctl.targetBeta = tgt; v.ctl.kp = 1.6; v.ctl.kd = 2.0;
      if (Math.abs(wrapPi(tgt - v.beta)) < 0.12 || this.t > 14) { this.phase = this.site === 'lz' ? 'boostback' : 'fall'; this.t = 0; }
    } else if (this.phase === 'boostback') {
      v.ctl.targetBeta = v.phi - 80 * D2R;
      v.engMode = 'three'; v.throttle = 1; v.engineOn = true;
      const imp = predictImpact(v, 9);
      const aim = this.site === 'lz' ? this.targetX - 1635 : this.targetX;
      if (imp.x <= aim || v.fuelTotal() <= 0.2) { v.engineOn = false; this.phase = 'fall'; this.t = 0; sc.event('Tầng 1: kết thúc đốt quay về.'); }
    } else if (this.phase === 'fall') {
      v.engineOn = false;
      v.ctl.targetBeta = retro; v.ctl.kp = 2.0; v.ctl.kd = 2.5;
      const needEntry = this.site === 'ship' ? (v.speedSurf > 360 || v.alt < 28000) : (v.speedSurf > 680);
      if (v.alt < 42000 && v.alt > 18000 && v.vSurf.u < -150 && needEntry) {
        this.phase = 'entry';
        sc.event('Tầng 1: đốt khi vào lại khí quyển.', 'warn');
      } else if (v.alt < 20000 && v.vSurf.u < 0) {
        this.phase = 'glide';
      }
    } else if (this.phase === 'entry') {
      v.ctl.targetBeta = retro; v.engMode = 'three'; v.throttle = 1; v.engineOn = true;
      if (v.speedSurf < 260 || v.alt < 15000 || v.fuelTotal() < this.landingReserve()) {
        v.engineOn = false;
        this.phase = 'glide';
        if (this.site === 'ship') {
          const imp = predictImpact(v, 9 + v.finsT * 5);
          this.targetX = imp.x;
          sc.placeDroneShip(imp.x);
        }
      }
    } else if (this.phase === 'glide') {
      v.engineOn = false;
      v.finsTarget = 1;
      const imp = predictImpact(v, 9 + v.finsT * 5);
      if (this.site === 'ship' && v.alt < 16000 && !this.shipRefined) {
        this.shipRefined = true;
        this.targetX = imp.x;
        sc.placeDroneShip(imp.x);
      }
      const err = imp.x - this.targetX;
      const steer = clamp(err / 1800, -1, 1) * 0.28 * BoosterRecovery.steerSign;
      v.ctl.targetBeta = retro + steer;
      v.ctl.kp = 2.0; v.ctl.kd = 2.5;
      const started = poweredDescent(v, { multi: true, targetX: this.targetX, legsAt: 450 });
      if (started) { this.phase = 'landing'; sc.event('Tầng 1: đốt hạ cánh!', 'warn'); }
    } else if (this.phase === 'landing') {
      poweredDescent(v, { multi: true, targetX: this.targetX, legsAt: 450 });
      if (v.agl < 450) v.legsTarget = 1;
    }
  }
  landingReserve() { const md = this.v.mass - this.v.fuelTotal(); return md * (Math.exp(350 / 2800) - 1); }
}

// =====================================================================================
/** Rendezvous with a target on rails (ISS) and docking. sc provides target info. */
export class RendezvousProgram {
  constructor(target, parkAlt = 100e3) {
    this.target = target; this.parkAlt = parkAlt;
    this.phase = 'ascent';
    this.ascent = new AscentProgram(parkAlt, 'earth');
    this.label = 'Ghép nối ISS';
  }
  status() {
    return {
      ascent: 'Lên quỹ đạo chờ – ' + this.ascent.status(), phasing: 'Chờ góc pha để chuyển quỹ đạo', transfer: 'Đốt chuyển quỹ đạo Hohmann',
      coastT: 'Bay tới điểm gặp', brake: 'Phanh – khớp vận tốc', approach: 'Tiếp cận bằng RCS', final: 'Tiếp cận cuối – căn tâm cổng', docked: 'Đã ghép nối',
    }[this.phase];
  }
  update(v, sc, dt) {
    if (sc.docked) {
      this.phase = 'docked';
      v.engineOn = false;
      v.ctl.rcs = [0, 0, 0];
      return 'done';
    }
    const T = this.target, t = sc.simT;
    if (v.ctx.fuel[v.activeSeg] <= 0 && this.phase !== 'approach' && this.phase !== 'final') sc.autoStage(v);
    if (this.phase === 'ascent') {
      if (this.ascent.update(v, sc) === 'done') { this.phase = 'phasing'; sc.event('Vào quỹ đạo chờ. Đang chờ góc pha tới ISS.'); }
      return;
    }
    const el = vesselElements(v);
    const rT = T.r;
    const tp = T.pos(t), tv = T.vel(t);
    const relX = tp.x - v.s.x, relY = tp.y - v.s.y, relZ = -v.s.z;
    const dist = Math.hypot(relX, relY, relZ);
    if (this.phase === 'phasing') {
      v.engineOn = false;
      v.ctl.targetBeta = progradeBeta(v);
      const r1 = v.rRel.r;
      const aT = (r1 + rT) / 2;
      const tTr = Math.PI * Math.sqrt(aT ** 3 / MU_E);
      const lead = wrapPi(Math.PI - T.n * tTr);
      const phase = wrapPi(T.angle(t) - v.phi);
      const err = wrapPi(phase - lead);
      const rate = Math.sqrt(MU_E / r1 ** 3) - T.n;          // closing rate (rad/s), >0 when we are lower
      const wait = err > 0 ? err / rate : (err + 2 * Math.PI) / rate;
      sc.requestWarp(wait > 600 ? 1000 : wait > 120 ? 100 : wait > 25 ? 10 : 1);
      this.wait = wait;
      if (Math.abs(err) < 0.004 || (err < 0 && err > -0.02)) { this.phase = 'transfer'; sc.event('Đốt chuyển quỹ đạo tới ISS.'); }
    } else if (this.phase === 'transfer') {
      v.ctl.targetBeta = progradeBeta(v);
      v.engineOn = true;
      const a = maxAccel(v) || 1;
      const need = Math.sqrt(MU_E * (2 / v.rRel.r - 2 / (v.rRel.r + rT))) - v.speedOrb;
      v.throttle = clamp(need / a / 0.5, 0.03, 1);
      if (el.ap >= rT - 50) { v.engineOn = false; this.phase = 'coastT'; }
    } else if (this.phase === 'coastT') {
      v.engineOn = false;
      v.ctl.targetBeta = progradeBeta(v);
      sc.requestWarp(dist > 150e3 ? 100 : dist > 50e3 ? 50 : dist > 15e3 ? 10 : 1);
      if (dist < 12000 || (el.tAp < 25 && el.tAp < el.period / 2)) { this.phase = 'brake'; sc.event('Gần ISS – khớp vận tốc.'); }
    } else if (this.phase === 'brake') {
      const rvx = v.s.vx - tv.x, rvy = v.s.vy - tv.y;
      const rv = Math.hypot(rvx, rvy);
      // desired closing velocity toward the station
      const vc = clamp(dist * 0.01, 2, 60);
      const dvx = relX / dist * vc - rvx, dvy = relY / dist * vc - rvy;
      const dv = Math.hypot(dvx, dvy);
      v.ctl.targetBeta = angOf(dvx, dvy);
      const aligned = Math.abs(wrapPi(v.ctl.targetBeta - v.beta)) < 0.08;
      const a = maxAccel(v) || 1;
      v.engineOn = aligned && dv > 1.5;
      v.throttle = clamp(dv / a / 1.2, 0.02, 1);
      if ((dv < 2 && dist < 2500) || dist < 400) { v.engineOn = false; this.phase = 'approach'; sc.event('Chuyển sang RCS – tiếp cận ISS.'); }
      this.rv = rv;
    } else if (this.phase === 'approach' || this.phase === 'final') {
      v.engineOn = false;
      const res = dockingGuidance(v, sc, this.phase === 'final');
      if (this.phase === 'approach' && res.standDist < 3 && res.relSpeed < 0.4) { this.phase = 'final'; sc.event('Tiếp cận cuối cùng.'); }
    }
  }
}

/**
 * RCS docking guidance: hold attitude along the station prograde axis, fly to a stand-off point
 * 30 m behind the port, then straight in at 0.25 m/s. Returns diagnostics.
 */
export function dockingGuidance(v, sc, final) {
  const d = sc.dockGeometry();      // { portV:{x,y,z}, portS:{x,y,z}, axisS:{x,y} (port outward), velS:{x,y,z}, beta }
  v.ctl.targetBeta = d.beta; v.ctl.kp = 2.5; v.ctl.kd = 3;
  const stand = final ? 0 : 30;
  const tx = d.portS.x + d.axisS.x * stand, ty = d.portS.y + d.axisS.y * stand, tz = d.portS.z;
  const ex = tx - d.portV.x, ey = ty - d.portV.y, ez = tz - d.portV.z;
  const e = Math.hypot(ex, ey, ez);
  const rvx = v.s.vx - d.velS.x, rvy = v.s.vy - d.velS.y, rvz = v.s.vz - d.velS.z;
  // along-axis / lateral split for the final approach
  let vmax = final ? 0.25 : clamp(e * 0.08, 0.3, 20);
  // closing speed the thrusters can still cancel (a ≈ 0.15 m/s² design margin)
  const vcmd = final ? 0 : Math.min(vmax, Math.sqrt(0.3 * e), e * 0.1 + 0.3);
  let dvx = ex / (e || 1) * (final ? Math.min(vmax, e * 0.15) : vcmd) - rvx;
  let dvy = ey / (e || 1) * (final ? Math.min(vmax, e * 0.15) : vcmd) - rvy;
  let dvz = ez / (e || 1) * (final ? Math.min(vmax, e * 0.15) : vcmd) - rvz;
  if (final) {
    // lateral error relative to port axis gets corrected harder
    const ax = -d.axisS.x, ay = -d.axisS.y;     // approach direction
    const along = ex * ax + ey * ay;
    const latx = ex - along * ax, laty = ey - along * ay;
    dvx = ax * 0.25 + latx * 0.4 - rvx; dvy = ay * 0.25 + laty * 0.4 - rvy; dvz = ez * 0.4 - rvz;
  }
  const A = 0.45;
  const gain = 1.2;
  const axb = Math.sin(v.beta), ayb = Math.cos(v.beta);
  const fwd = (dvx * axb + dvy * ayb) * gain / A;
  const nrm = (dvx * ayb - dvy * axb) * gain / A;
  v.ctl.rcs = [clamp(fwd, -1, 1), clamp(nrm, -1, 1), clamp(dvz * gain / A, -1, 1)];
  return { standDist: e, relSpeed: Math.hypot(rvx, rvy, rvz) };
}

// =====================================================================================
/** Full lunar / planetary mission: parking orbit → transfer burn → capture → landing → (optional return). */
export class MoonProgram {
  constructor(targetBody = 'moon') {
    this.targetBody = targetBody;
    this.B = BODIES[targetBody] || BODIES.moon;
    this.phase = 'ascent';
    this.ascent = new AscentProgram(85e3, 'earth');
    this.label = 'Bay tới ' + this.B.label;
    this.predT = 0;
  }
  status() {
    const nm = this.B.label;
    return {
      ascent: 'Quỹ đạo chờ – ' + this.ascent.status(), tliWait: 'Chờ cửa sổ phóng tới ' + nm, tli: 'Đốt chuyển quỹ đạo tới ' + nm,
      cruise: 'Bay tới ' + nm, capture: 'Đốt hãm – vào quỹ đạo ' + nm, deorbit: 'Rời quỹ đạo – chuẩn bị hạ cánh', descent: 'Hạ cánh tự động xuống ' + nm,
      surface: 'Trên bề mặt ' + nm, lunarAscent: 'Cất cánh khỏi ' + nm + ' – ' + (this.lAscent ? this.lAscent.status() : ''), teiWait: 'Chờ thời điểm quay về',
      tei: 'Đốt quay về Trái Đất', returnCruise: 'Bay về Trái Đất', reentry: 'Vào lại khí quyển', chutes: 'Hạ dù', done: 'Hoàn thành',
    }[this.phase];
  }
  update(v, sc, dt) {
    const t = sc.simT;
    const TB = this.B;
    if (this.phase !== 'reentry' && this.phase !== 'chutes' && v.ctx.fuel[v.activeSeg] <= 0) sc.autoStage(v);
    if (this.phase === 'ascent') {
      if (this.ascent.update(v, sc) === 'done') { this.phase = 'tliWait'; sc.event('Vào quỹ đạo chờ quanh Trái Đất.'); }
      return;
    }
    const el = vesselElements(v);
    if (this.phase === 'tliWait') {
      v.engineOn = false; v.ctl.targetBeta = progradeBeta(v);
      const bp = bodyPos(this.targetBody, t);
      const rT = Math.hypot(bp.x, bp.y) || TB.a;
      const r1 = v.rRel.r, aT = (r1 + rT) / 2;
      const tTr = Math.PI * Math.sqrt(aT ** 3 / MU_E);
      const bpFuture = bodyPos(this.targetBody, t + tTr);
      const targetAng = angOf(bpFuture.x, bpFuture.y);
      const err = wrapPi((targetAng - Math.PI) - v.phi);
      const rate = Math.max(1e-5, Math.sqrt(MU_E / r1 ** 3));
      const wait = (err > 0 ? err : err + 2 * Math.PI) / rate;
      this.wait = wait;
      sc.requestWarp(wait > 800 ? 1000 : wait > 150 ? 100 : wait > 30 ? 10 : 1);
      if (err < 0.008 && err > -0.035) {
        this.phase = 'tli';
        this.rT = Math.hypot(bpFuture.x, bpFuture.y) || rT;
        sc.event('Đốt chuyển quỹ đạo tới ' + TB.label + '!', 'warn');
      }
    } else if (this.phase === 'tli') {
      v.ctl.targetBeta = progradeBeta(v); v.engineOn = true; v.throttle = 1;
      const bp = bodyPos(this.targetBody, t);
      const rT = this.rT || Math.hypot(bp.x, bp.y) || TB.a;
      if (el.ap > rT * 0.8) {
        v.throttle = 0.25;
        this.predT -= dt;
        if (this.predT <= 0) {
          this.predT = 0.15;
          const maxTime = Math.max(60000, Math.PI * Math.sqrt(((rT + R_E) / 2) ** 3 / MU_E) * 1.35);
          const p = predict(v.s.x, v.s.y, v.s.z, v.s.vx, v.s.vy, v.s.vz, t, { maxTime, maxSteps: 2200 });
          const ca = p.bodyCA && p.bodyCA[this.targetBody] ? p.bodyCA[this.targetBody].d : p.moonCA.d;
          this.ca = ca;
          if (ca < TB.R + Math.max(40e3, TB.atm + 30e3) || el.ap > rT * 1.05 || v.fuelTotal() <= 0) {
            v.engineOn = false; this.phase = 'cruise'; sc.event('Kết thúc đốt – đang bay tới ' + TB.label + '.');
          }
        }
      }
      if (v.ctx.fuel[v.activeSeg] <= 0) sc.autoStage(v);
    } else if (this.phase === 'cruise') {
      if (v.ref !== this.targetBody) {
        const bp = bodyPos(this.targetBody, t);
        const bv = bodyVel(this.targetBody, t);
        const dx = bp.x - v.s.x, dy = bp.y - v.s.y;
        const dist = Math.hypot(dx, dy) || 1;
        const rAim = TB.R + Math.max(20e3, (TB.atm || 0) + 14e3);
        const ux = dx / dist, uy = dy / dist;
        const ax = dx - uy * rAim, ay = dy + ux * rAim;
        const ad = Math.hypot(ax, ay) || 1;
        const rvx = v.s.vx - bv.x, rvy = v.s.vy - bv.y;
        const vClose = (rvx * ax + rvy * ay) / ad;
        const vLat = Math.abs(rvx * ay - rvy * ax) / ad;
        const miss = ad * (vLat / Math.max(10, vClose));
        const farFromEarth = v.rRel.r > R_E * 2.4 || v.ref !== 'earth';
        const needCorr = farFromEarth && (vClose < 220 || miss > Math.max(TB.R * 0.45, TB.soi * 0.22));
        if (needCorr || this._mccBurning) {
          const vDesMag = clamp(ad * 0.00038, 280, 1950);
          const dvx = bv.x + (ax / ad) * vDesMag - v.s.vx;
          const dvy = bv.y + (ay / ad) * vDesMag - v.s.vy;
          const dv = Math.hypot(dvx, dvy);
          this._mccBurning = dv > 12;
          if (this._mccBurning) {
            v.ctl.targetBeta = angOf(dvx, dvy);
            const aligned = Math.abs(wrapPi(v.ctl.targetBeta - v.beta)) < 0.14;
            const a = maxAccel(v) || 1;
            v.engineOn = aligned;
            v.throttle = aligned ? clamp(dv / a / 1.2, 0.05, 1) : 0;
            sc.requestWarp(1);
            return;
          }
        }
        v.engineOn = false;
        v.ctl.targetBeta = progradeBeta(v);
        sc.requestWarp(dist > 45000e3 ? 10000 : dist > 15000e3 ? 5000 : dist > 4000e3 ? 1000 : dist > 1200e3 ? 200 : dist > 350e3 ? 40 : 8);
      } else {
        this._mccBurning = false;
        v.engineOn = false;
        v.ctl.targetBeta = progradeBeta(v) + Math.PI;
        const a = maxAccel(v) || 1;
        const rPe = Math.max(el.pe, TB.R + Math.max(15e3, (TB.atm || 0) + 10e3));
        const vPe = Math.sqrt(Math.max(0, TB.mu * (2 / rPe - 1 / el.a)));
        const burnT = Math.max(5, (vPe - Math.sqrt(TB.mu / rPe)) / a);
        const tPe = isFinite(el.tPe) ? el.tPe : 0;
        sc.requestWarp(tPe > burnT / 2 + 600 ? 1000 : tPe > burnT / 2 + 60 ? 50 : tPe > burnT / 2 + 8 ? 4 : 1);
        if (tPe < burnT / 2 + 4 || (el.pe - TB.R < Math.max(12e3, (TB.atm || 0) + 8e3) && v.alt < Math.max(60e3, (TB.atm || 0) + 25e3))) {
          this.phase = 'capture'; sc.event('Đốt hãm vào quỹ đạo ' + TB.label + '.', 'warn');
        }
      }
    } else if (this.phase === 'capture') {
      const minSafeAlt = Math.max(14e3, (TB.atm || 0) + 10e3);
      if (el.pe - TB.R < minSafeAlt && v.vOrb.u < 0) {
        // Pitch slightly radially outward while braking so periapsis stays above atmosphere/surface
        const retro = progradeBeta(v) + Math.PI;
        v.ctl.targetBeta = wrapPi(retro + wrapPi(v.phi - retro) * 0.35);
      } else {
        v.ctl.targetBeta = progradeBeta(v) + Math.PI;
      }
      v.engineOn = true;
      const a = maxAccel(v) || 1;
      const dv = Math.max(10, v.speedOrb - Math.sqrt(TB.mu / v.rRel.r));
      v.throttle = clamp(dv / a, 0.08, 1);
      if ((el.e < 0.12 && el.pe - TB.R > Math.max(8e3, TB.atm || 0)) || (el.e < 0.65 && el.ap - TB.R < Math.max(120e3, (TB.atm || 0) + 60e3) && el.pe - TB.R > Math.max(8e3, TB.atm || 0))) {
        v.engineOn = false; this.phase = 'deorbit'; this.t = 0; sc.event('Đã vào quỹ đạo ' + TB.label + '!');
        sc.flag(this.targetBody === 'moon' ? 'lunarOrbit' : this.targetBody + 'Orbit');
      }
      if (v.ctx.fuel[v.activeSeg] <= 0) sc.autoStage(v);
    } else if (this.phase === 'deorbit') {
      // hand over to the lander only if an upper stage actually has landing legs
      if (!this.handover && v.ctx.rocket && v.ctx.rocket.deployables && v.ctx.rocket.deployables.some((d) => d.type === 'legs' && v.owns(d.seg) && d.seg !== v.activeSeg) && !v.ctx.rocket.deployables.some((d) => d.type === 'legs' && d.seg === v.activeSeg)) {
        this.handover = true;
        sc.autoStage(v);
      }
      this.t = (this.t || 0) + dt;
      v.ctl.targetBeta = progradeBeta(v) + Math.PI;
      const aligned = Math.abs(wrapPi(v.ctl.targetBeta - v.beta)) < 0.1;
      v.engineOn = aligned && this.t > 3; v.throttle = 0.5;
      if (el.pe - TB.R < 4000) { v.engineOn = false; this.phase = 'descent'; v._descBurn = false; sc.event('Bắt đầu hạ cánh xuống ' + TB.label + '.'); }
      if (v.ctx.fuel[v.activeSeg] <= 0) sc.autoStage(v);
    } else if (this.phase === 'descent') {
      sc.requestWarp(v.alt > Math.max(25000, TB.atm) && !v._descBurn ? 10 : 1);
      poweredDescent(v, { legsAt: 1500, horizontalFirst: true });
      if (TB.atm > 0 && v.alt < 9000 && v.speedSurf < 350 && v.capsule()) v.chuteTarget = 1;
      if (v.ctx.fuel[v.activeSeg] <= 0) sc.autoStage(v);
      if (v.landed) {
        this.phase = this.targetBody === 'moon' ? 'surface' : 'done';
        this.t = 0; v.engineOn = false;
        if (this.phase === 'done') return 'done';
      }
    } else if (this.phase === 'surface') {
      this.t += dt; v.engineOn = false;
      if (this.t > 12) { this.phase = 'lunarAscent'; this.lAscent = new AscentProgram(25e3, 'moon'); sc.event('Cất cánh khỏi Mặt Trăng!', 'warn'); }
    } else if (this.phase === 'lunarAscent') {
      if (this.lAscent.update(v, sc) === 'done') { this.phase = 'teiWait'; sc.event('Vào quỹ đạo Mặt Trăng – chờ quay về.'); }
    } else if (this.phase === 'teiWait') {
      v.engineOn = false; v.ctl.targetBeta = progradeBeta(v);
      const vr = Math.hypot(v.vRel.x, v.vRel.y) || 1;
      const vEsc = Math.sqrt(2 * TB.mu / v.rRel.r);
      const dvT = Math.max(0, vEsc * 1.1 - vr);
      sc.requestWarp(this.earthPe !== undefined && this.earthPe < R_E + 4000e3 ? 10 : 50);
      this.predT -= dt;
      if (this.predT <= 0) {
        this.predT = 0.05;
        const p = predict(v.s.x, v.s.y, v.s.z, v.s.vx + dvT * v.vRel.x / vr, v.s.vy + dvT * v.vRel.y / vr, v.s.vz, t, { maxTime: 90000, maxSteps: 2000, earthStopAlt: 30e3 });
        this.earthPe = p.earthPe;
        if (p.earthPe < R_E + 40e3) { this.phase = 'tei'; sc.event('Đốt quay về Trái Đất!', 'warn'); }
      }
    } else if (this.phase === 'tei') {
      v.ctl.targetBeta = progradeBeta(v); v.engineOn = true;
      v.throttle = el.e < 0.95 ? 1 : 0.3;
      this.predT -= dt;
      if (el.e >= 0.95 && this.predT <= 0) {
        this.predT = 0.15;
        const p = predict(v.s.x, v.s.y, v.s.z, v.s.vx, v.s.vy, v.s.vz, t, { maxTime: 90000, maxSteps: 2000, earthStopAlt: 30e3 });
        this.earthPe = p.earthPe;
        if (p.earthPe < R_E + 40e3) { v.engineOn = false; this.phase = 'returnCruise'; sc.event('Quỹ đạo quay về Trái Đất đã khớp.'); }
      }
      if (v.ctx.fuel[v.activeSeg] <= 0) { if (!sc.autoStage(v)) { v.engineOn = false; this.phase = 'returnCruise'; } }
    } else if (this.phase === 'returnCruise') {
      v.engineOn = false; v.ctl.targetBeta = progradeBeta(v);
      sc.requestWarp(v.ref !== 'earth' ? 1000 : v.alt > 400e3 ? 10000 : v.alt > 90e3 ? 50 : 1);
      if (v.ref === 'earth' && v.alt < 90e3) {
        this.phase = 'reentry';
        sc.jettisonToCapsule(v);
        sc.event('Tách khoang – chuẩn bị vào lại khí quyển.', 'warn');
      }
    } else if (this.phase === 'reentry') {
      v.engineOn = false;
      v.ctl.targetBeta = v.phi + Math.atan2(-v.vSurf.e, -v.vSurf.u); // nose retrograde → heat shield first
      if (v.alt < 7000 && v.speedSurf < 320) { v.chuteTarget = 1; this.phase = 'chutes'; sc.event('Bung dù!', ''); }
    } else if (this.phase === 'chutes') {
      v.ctl.targetBeta = null;
      if (v.landed) this.phase = 'done';
    }
  }
}

BoosterRecovery.steerSign = 1;

