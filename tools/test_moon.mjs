import { PRESETS, stackFromTypes, layout, segments, segmentInfo } from '../src/rocket.js';
import { Vessel } from '../src/launch/vessel.js';
import { MoonProgram, vesselElements } from '../src/sim/guidance.js';
import { moonPos, moonVel, bodyInfo, refBody, bodyState } from '../src/sim/orbit.js';
import { R_E, R_M, COAST_X, LZ_X } from '../src/sim/constants.js';

const presetName = 'Apollo (Mặt Trăng)';
const stack = stackFromTypes(PRESETS[presetName]);
const lay = layout(stack), segs = segments(stack);
const segInfo = segs.map((idx) => segmentInfo(stack, idx));
segInfo.forEach((s, k) => {
  if (s.engCount === undefined) s.engCount = segs[k].reduce((n, i) => n + ({ engHeavy: 4, engReuse: 9 }[stack[i].type] || (stack[i].type.startsWith('eng') ? 1 : 0)), 0);
});
const fuel = segInfo.map((s) => s.fuel), fuelMax = fuel.slice();
const fakeGroup = () => ({ position: { y: 0 } });
const boosters = [];
stack.forEach((it, i) => {
  if (it.attach.includes('booster')) {
    const k = segs.findIndex((s) => s.includes(i));
    boosters.push({ seg: k, objs: [{ position: { y: lay.parts[i].y + 0.15 } }], fuel: 28, dry: 3.6, count: 2, attached: true });
  }
});
const deployables = [];
stack.forEach((it, i) => {
  const k = segs.findIndex((s) => s.includes(i));
  for (const a of it.attach) {
    if (a === 'legs' || a === 'gridfins') deployables.push({ seg: k, type: a, objs: [{ userData: { footY: -3.8 } }], partIndex: i });
  }
});
const capsulePartIdx = stack.findIndex((s) => s.type === 'capsule');
const capsule = { seg: segs.findIndex((s) => s.includes(capsulePartIdx)) };
const rocket = { boosters, segGroups: segs.map(fakeGroup), deployables, capsule, dockPort: null };
const ctx = { stack, lay, segs, segInfo, fuel, fuelMax, rocket };
const v = new Vessel(ctx, segs.map((_, k) => k), null, 'player');

let t = 0;
v.placeOnSurface('earth', 0, 9 + v.bottomOffset(), t);
v.clamped = false; v.landed = { body: 'earth', sx: 0, h: 9 + v.bottomOffset() }; v.landedLock = 0;
v.engineOn = true; v.throttle = 1;

const events = [];
const sc = {
  get simT() { return t; },
  startAlt: v.alt, coastX: COAST_X, recoveryMode: 'auto',
  event: (m) => events.push(`[${t.toFixed(0)}s] ${m}`),
  requestWarp: (w) => { sc.warp = w; },
  isRecoverable: () => false,
  autoStage: (vv) => {
    if (vv.segIdx.length <= 1) return false;
    const k = vv.activeSeg;
    vv.segIdx.pop();
    vv.updateMass();
    events.push(`[${t.toFixed(0)}s] STAGE sep alt ${(vv.alt/1000).toFixed(1)}km activeSeg=${vv.activeSeg} fuelLeft=${vv.fuelTotal().toFixed(2)}t`);
    return true;
  },
  flag: (f) => events.push(`[${t.toFixed(0)}s] FLAG: ${f}`),
  jettisonToCapsule: (vv) => {
    let guard = 0;
    while (vv.segIdx.length > 1 && guard++ < 12) {
      vv.segIdx.pop();
      vv.updateMass();
    }
    events.push(`[${t.toFixed(0)}s] JETTISON to capsule, mass=${vv.mass.toFixed(2)}t`);
  },
  dockGeometry: () => ({}),
};

const prog = new MoonProgram();
const env = { surface: (vv) => ({ h: 0, water: vv.ref === 'earth' && vv.sx > COAST_X, site: vv.ref === 'moon' ? 'moon' : 'pad' }) };

let lastLog = -999;
let lastPhase = '';
for (let i = 0; i < 600000 && t < 120000 && prog.phase !== 'done' && !v.crashed; i++) {
  // auto-separate boosters if any
  for (const b of boosters) {
    if (b.attached && b.fuel <= 0) {
      b.attached = false;
      v.updateMass();
      events.push(`[${t.toFixed(0)}s] SRB sep`);
    }
  }

  const dt = (v.ref === 'earth' && v.alt < 70e3) || (v.ref === 'moon' && v.alt < 40e3) || v.engineOn ? 0.05 : 2.0;
  if (v.ref === 'earth' && v.alt < 50 && prog.phase === 'chutes') {
    const bottom = v.alt - v.bottomOffset() * Math.cos(v.ang) - 0;
    if (bottom <= 0.5) {
      const vs = v.vSurf;
      const sp = Math.hypot(vs.e, vs.u);
      const tilt = Math.abs(v.ang);
      const legsOk = v.legsT > 0.95;
      const chute = v.capsule() ? v.chuteT : 0;
      const vLim = legsOk ? 7 : chute > 0.9 ? 14 : 4;
      events.push(`[${t.toFixed(1)}s] TOUCH CHECK: bottom=${bottom.toFixed(2)} sp=${sp.toFixed(2)} vLim=${vLim} (chute=${chute.toFixed(2)}, cap=${!!v.capsule()}) ve=${Math.abs(vs.e).toFixed(2)} tilt=${tilt.toFixed(3)} cond=${sp < vLim && Math.abs(vs.e) < 4 && tilt < (legsOk ? 0.3 : 0.45)}`);
    }
  }
  prog.update(v, sc, dt);
  v.step(dt, t, env);
  t += dt;

  for (const e of v.events.splice(0)) {
    if (e[0] === 'crash') events.push(`[${t.toFixed(0)}s] CRASH: ${e[1]} (${e[2]})`);
    if (e[0] === 'landed') events.push(`[${t.toFixed(0)}s] LANDED on ${v.ref} (${e[1]})`);
  }

  if (prog.phase !== lastPhase || t - lastLog > 600) {
    lastLog = t;
    lastPhase = prog.phase;
    events.push(`   T=${t.toFixed(0)}s ph=${prog.phase} ref=${v.ref} alt=${(v.alt/1000).toFixed(1)}km vSurf=${v.speedSurf.toFixed(0)} fuel=${v.fuelTotal().toFixed(2)}t warp=${sc.warp}`);
  }
}

console.log(events.slice(0, 100).join('\n'));
if (events.length > 100) {
  console.log(`... (${events.length - 100} more events)`);
  console.log(events.slice(-30).join('\n'));
}
console.log(`Final: T=${t.toFixed(0)}s phase=${prog.phase} crashed=${v.crashed} landed=${!!v.landed}`);
