// Headless flight-physics test: node tools/simtest.mjs [preset] [program]
import { PRESETS, stackFromTypes, layout, segments, segmentInfo } from '../src/rocket.js';
import { Vessel } from '../src/launch/vessel.js';
import { AscentProgram, BoosterRecovery, vesselElements } from '../src/sim/guidance.js';
import { R_E, COAST_X } from '../src/sim/constants.js';

const presetName = process.argv[2] || 'Hai tầng (khuyên dùng)';
const stack = stackFromTypes(PRESETS[presetName] || presetName.split(','));
const lay = layout(stack), segs = segments(stack);
const segInfo = segs.map((idx) => segmentInfo(stack, idx));
segInfo.forEach((s, k) => { if (s.engCount === undefined) s.engCount = segs[k].reduce((n, i) => n + ({ engHeavy: 4, engReuse: 9 }[stack[i].type] || (stack[i].type.startsWith('eng') ? 1 : 0)), 0); });
const fuel = segInfo.map((s) => s.fuel), fuelMax = fuel.slice();
const fakeGroup = () => ({ position: { y: 0 } });
const boosters = [];
stack.forEach((it, i) => { if (it.attach.includes('booster')) { const k = segs.findIndex((s) => s.includes(i)); boosters.push({ seg: k, objs: [{ position: { y: lay.parts[i].y + 0.15 } }], fuel: 28, dry: 3.6, count: 2, attached: true }); } });
const deployables = [];
stack.forEach((it, i) => { const k = segs.findIndex((s) => s.includes(i)); for (const a of it.attach) if (a === 'legs' || a === 'gridfins') deployables.push({ seg: k, type: a, objs: [{ userData: { footY: -3.8 } }], partIndex: i }); });
const rocket = { boosters, segGroups: segs.map(fakeGroup), deployables, capsule: null, dockPort: null };
const ctx = { stack, lay, segs, segInfo, fuel, fuelMax, rocket };
const v = new Vessel(ctx, segs.map((_, k) => k), null, 'player');
let t = 0;
v.placeOnSurface('earth', 0, 9 + v.bottomOffset(), t);
const startAlt = v.alt;
v.clamped = false; v.landed = { body: 'earth', sx: 0, h: 9 + v.bottomOffset() }; v.landedLock = 0;
v.engineOn = true; v.throttle = 1;
const events = [];
const sc = {
  startAlt, simT: 0, coastX: COAST_X, recoveryMode: 'auto',
  event: (m) => events.push(`[${t.toFixed(0)}s] ${m}`), requestWarp: (w) => { sc.warp = w; },
  placeDroneShip: (x) => events.push(`ship at ${(x / 1000).toFixed(1)} km`),
};
const env = { surface: (vv) => ({ h: Math.abs(vv.sx) < 43 ? 9 : 0, water: vv.sx > COAST_X && !(sc.shipX && Math.abs(vv.sx - sc.shipX) < 45), site: null }) };
BoosterRecovery.steerSign = -1;
const prog = new AscentProgram(80e3, 'earth');
let booster = null, rec = null;
let maxQ = 0, lastLog = -999;
sc.isRecoverable = (vv) => vv.segIdx.length > 1 && deployables.some((d) => d.seg === vv.activeSeg && d.type === 'legs');
sc.autoStage = () => { sc.stageReq = true; return true; };
sc.placeDroneShip = (x) => { sc.shipX = x; events.push(`ship at ${(x / 1000).toFixed(1)} km`); };
function doStage() {
  const k = v.activeSeg;
  const legs = deployables.some((d) => d.seg === k && d.type === 'legs');
  v.segIdx.pop();
  const b = new Vessel(ctx, [k], null, 'booster');
  b.s = { ...v.s }; b.beta = v.beta; b.omega = 0; b.updateMass(); b.updateFrame(t);
  v.updateMass();
  if (legs) { booster = b; rec = new BoosterRecovery(b, sc); events.push(`[${t.toFixed(0)}s] STAGE sep: alt ${(v.alt / 1000).toFixed(1)}km vSurf e=${v.vSurf.e.toFixed(0)} u=${v.vSurf.u.toFixed(0)} boosterFuel=${fuel[k].toFixed(2)}t`); }
  else events.push(`[${t.toFixed(0)}s] STAGE sep alt ${(v.alt / 1000).toFixed(1)}km`);
}
for (let i = 0; i < 400000 && t < 2400; i++) {
  const fine = v.alt < 70e3 || v.engineOn || (booster && !booster.landed && !booster.crashed);
  const h = fine ? 0.02 : 1.0;
  const r = prog.phase !== 'done' ? prog.update(v, sc) : null;
  // staging: auto when stage empty, or keep reserve when legs present
  const k = v.activeSeg;
  const st = segInfo[k];
  const legs = deployables.some((d) => d.seg === k && d.type === 'legs');
  const reserve = legs ? (st.dry) * (Math.exp(600 / 2900) - 1) : 0;
  if (v.segIdx.length > 1 && (fuel[k] <= reserve + 1e-6)) sc.autoStage(v);
  if (sc.stageReq) { sc.stageReq = false; doStage(); }
  for (const b of boosters) if (b.attached && b.fuel <= 0) { b.attached = false; v.updateMass(); events.push(`[${t.toFixed(0)}s] SRB sep`); }
  v.step(h, t, env);
  if (booster && !booster.landed && !booster.crashed) { rec.update(h); booster.step(h, t, env); }
  if (booster) for (const e of booster.events.splice(0)) if (e[0] !== 'fuelOut') events.push(`[${t.toFixed(0)}s] booster ${e.join(' ')} sx=${booster.sx.toFixed(0)} target=${rec.targetX.toFixed(0)} v=${booster.speedSurf.toFixed(1)}`);
  for (const e of v.events.splice(0)) if (e[0] === 'crash') events.push(`[${t.toFixed(0)}s] PLAYER ${e.join(' ')}`);
  t += h; sc.simT = t;
  maxQ = Math.max(maxQ, v.qNow);
  if (rec && (rec.phase === 'landing' ? t - lastLog > 1 : t - lastLog > 20) && !booster.landed && !booster.crashed) { lastLog = t; events.push(`   b[${t.toFixed(0)}] ${rec.phase} alt=${(booster.alt / 1000).toFixed(2)}km agl=${(booster.agl ?? 0).toFixed(0)} sx=${(booster.sx / 1000).toFixed(2)}km ve=${booster.vSurf.e.toFixed(0)} vu=${booster.vSurf.u.toFixed(0)} fuel=${booster.fuelTotal().toFixed(2)} mode=${booster.engMode} thr=${booster.throttle.toFixed(2)} on=${booster.engineOn} ang=${(booster.ang * 57.3).toFixed(0)} tgtAng=${booster.ctl.targetBeta === null ? '-' : ((booster.ctl.targetBeta - booster.phi) * 57.3).toFixed(0)} acc=${booster.accelNow.toFixed(2)}`); }
  if (r === 'done' && !sc.doneAt) sc.doneAt = t;
  if (v.crashed) break;
  if (prog.phase === 'done' && (!booster || booster.landed || booster.crashed) && t > (sc.doneAt || 0) + 5) break;
}
const el = vesselElements(v);
console.log(events.join('\n'));
console.log(`T=${t.toFixed(0)}s phase=${prog.phase} alt=${(v.alt / 1000).toFixed(1)}km Ap=${((el.ap - R_E) / 1000).toFixed(1)} Pe=${((el.pe - R_E) / 1000).toFixed(1)} maxQ=${(maxQ / 1000).toFixed(1)}kPa fuelLeft=${v.fuelTotal().toFixed(2)}t`);
if (booster) console.log(`booster: ${rec.phase} landed=${!!booster.landed} crashed=${booster.crashed} sx=${booster.sx.toFixed(0)} target=${rec.targetX.toFixed(0)}`);
