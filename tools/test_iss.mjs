import { PRESETS, stackFromTypes, layout, segments, segmentInfo } from '../src/rocket.js';
import { Vessel } from '../src/launch/vessel.js';
import { RendezvousProgram, vesselElements } from '../src/sim/guidance.js';
import { RailOrbit, angOf } from '../src/sim/orbit.js';
import { ISS_R, ISS_ALT, COAST_X } from '../src/sim/constants.js';

const presetName = 'Tàu chở khách (ISS)';
const stack = stackFromTypes(PRESETS[presetName]);
const lay = layout(stack), segs = segments(stack);
const segInfo = segs.map((idx) => segmentInfo(stack, idx));
segInfo.forEach((s, k) => {
  if (s.engCount === undefined) s.engCount = segs[k].reduce((n, i) => n + ({ engHeavy: 4, engReuse: 9 }[stack[i].type] || (stack[i].type.startsWith('eng') ? 1 : 0)), 0);
});
const fuel = segInfo.map((s) => s.fuel), fuelMax = fuel.slice();
const fakeGroup = () => ({ position: { y: 0 } });
const boosters = [];
const deployables = [];
stack.forEach((it, i) => {
  const k = segs.findIndex((s) => s.includes(i));
  for (const a of it.attach) {
    if (a === 'legs' || a === 'gridfins') deployables.push({ seg: k, type: a, objs: [{ userData: { footY: -3.8 } }], partIndex: i });
  }
});
const dockPartIdx = stack.findIndex((s) => s.type === 'dockPort');
const dockPort = { seg: segs.findIndex((s) => s.includes(dockPartIdx)), obj: { position: { y: lay.parts[dockPartIdx].y } } };
const rocket = { boosters, segGroups: segs.map(fakeGroup), deployables, capsule: null, dockPort };
const ctx = { stack, lay, segs, segInfo, fuel, fuelMax, rocket };
const v = new Vessel(ctx, segs.map((_, k) => k), null, 'player');

let t = 0;
v.placeOnSurface('earth', 0, 9 + v.bottomOffset(), t);
v.clamped = false; v.landed = { body: 'earth', sx: 0, h: 9 + v.bottomOffset() }; v.landedLock = 0;
v.engineOn = true; v.throttle = 1;

const issOrbit = new RailOrbit(ISS_R, 1.4);
const events = [];
let docked = false;

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
    events.push(`[${t.toFixed(0)}s] STAGE sep alt ${(vv.alt/1000).toFixed(1)}km`);
    return true;
  },
  flag: (f) => events.push(`[${t.toFixed(0)}s] FLAG: ${f}`),
  dockGeometry: () => {
    const ip = issOrbit.pos(t), iv = issOrbit.vel(t);
    const a = issOrbit.angle(t), ex = Math.sin(a), ey = Math.cos(a);
    const portS = { x: ip.x - ex * 18, y: ip.y - ey * 18, z: 0 };
    const portOff = v.bottomOffset() + (lay.parts[dockPartIdx].y - lay.parts[v.segIdx[0] ? segs[v.segIdx[0]][0] : 0].y + 0.4);
    const ax = Math.sin(v.beta), ay = Math.cos(v.beta);
    const portV = { x: v.s.x + ax * portOff, y: v.s.y + ay * portOff, z: v.s.z };
    const L = 1.0;
    return { portV, portS, axisS: { x: -ex, y: -ey }, velS: iv, beta: angOf(ex, ey), L };
  }
};

const prog = new RendezvousProgram(issOrbit, 80e3);
const env = { surface: () => ({ h: 0, water: false, site: null }) };

let lastLog = -999;
let lastPhase = '';
for (let i = 0; i < 500000 && t < 15000 && !docked && !v.crashed; i++) {
  const dt = 0.05;
  prog.update(v, sc, dt);
  v.step(dt, t, env);
  t += dt;

  // Check docking condition like LaunchScene
  const dg = sc.dockGeometry();
  const e = Math.hypot(dg.portV.x - dg.portS.x, dg.portV.y - dg.portS.y, dg.portV.z - dg.portS.z);
  const rv = Math.hypot(v.s.vx - dg.velS.x, v.s.vy - dg.velS.y, v.s.vz - dg.velS.z);
  if (e < 0.6 && rv < 0.3) {
    docked = true;
    events.push(`[${t.toFixed(0)}s] DOCKED! dist=${e.toFixed(3)} relV=${rv.toFixed(3)}`);
    break;
  }

  if (prog.phase !== lastPhase || t - lastLog > 120) {
    lastLog = t;
    lastPhase = prog.phase;
    const ip = issOrbit.pos(t);
    const dist = Math.hypot(ip.x - v.s.x, ip.y - v.s.y, v.s.z);
    events.push(`   T=${t.toFixed(0)}s ph=${prog.phase} alt=${(v.alt/1000).toFixed(1)}km issDist=${(dist/1000).toFixed(1)}km fuel=${v.fuelTotal().toFixed(2)}t warp=${sc.warp}`);
  }
}

console.log(events.join('\n'));
console.log(`Final: T=${t.toFixed(0)}s docked=${docked} crashed=${v.crashed}`);
