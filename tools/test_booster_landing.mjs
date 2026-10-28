import { PRESETS, stackFromTypes, layout, segments, segmentInfo } from '../src/rocket.js';
import { Vessel } from '../src/launch/vessel.js';
import { AscentProgram, BoosterRecovery, vesselElements, poweredDescent } from '../src/sim/guidance.js';
import { R_E, COAST_X, LZ_X } from '../src/sim/constants.js';

function runBoosterTest(recoveryMode = 'auto') {
  const presetName = 'Đại Bàng 9 (tái sử dụng)';
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
  const rocket = { boosters, segGroups: segs.map(fakeGroup), deployables, capsule: null, dockPort: null };
  const ctx = { stack, lay, segs, segInfo, fuel, fuelMax, rocket };
  const v = new Vessel(ctx, segs.map((_, k) => k), null, 'player');

  let t = 0;
  v.placeOnSurface('earth', 0, 9 + v.bottomOffset(), t);
  v.clamped = false; v.landed = { body: 'earth', sx: 0, h: 9 + v.bottomOffset() }; v.landedLock = 0;
  v.engineOn = true; v.throttle = 1;

  const events = [];
  let droneShipX = null;
  const sc = {
    startAlt: v.alt,
    get simT() { return t; },
    coastX: COAST_X,
    recoveryMode,
    event: (m) => events.push(`[${t.toFixed(0)}s] ${m}`),
    requestWarp: (w) => {},
    placeDroneShip: (x) => {
      droneShipX = x;
      sc.shipX = x;
      events.push(`[${t.toFixed(0)}s] ship placed at ${(x / 1000).toFixed(1)} km`);
    },
    isRecoverable: (vv) => vv.segIdx.length > 1 && deployables.some((d) => d.seg === vv.activeSeg && d.type === 'legs'),
    autoStage: () => { sc.stageReq = true; return true; },
  };

  const env = {
    surface: (vv) => {
      const sx = vv.sx;
      if (Math.abs(sx) < 43) return { h: 9, water: false, site: 'pad' };
      if (Math.abs(sx - LZ_X) < 45) return { h: 0.3, water: false, site: 'lz' };
      if (droneShipX !== null && Math.abs(sx - droneShipX) < 45) return { h: 3.0, water: false, site: 'ship' };
      if (sx > COAST_X) return { h: 0, water: true, site: 'sea' };
      return { h: 0, water: false, site: 'land' };
    }
  };

  const prog = new AscentProgram(80e3, 'earth');
  let booster = null, rec = null;

  function doStage() {
    const k = v.activeSeg;
    const legs = deployables.some((d) => d.seg === k && d.type === 'legs');
    v.segIdx.pop();
    const b = new Vessel(ctx, [k], null, 'booster');
    b.s = { ...v.s }; b.beta = v.beta; b.omega = 0; b.updateMass(); b.updateFrame(t);
    v.updateMass();
    if (legs) {
      booster = b;
      rec = new BoosterRecovery(b, sc);
      events.push(`[${t.toFixed(0)}s] STAGE sep: alt ${(v.alt / 1000).toFixed(1)}km vSurf e=${v.vSurf.e.toFixed(0)} u=${v.vSurf.u.toFixed(0)} boosterFuel=${fuel[k].toFixed(2)}t`);
    }
  }

  for (let i = 0; i < 400000 && t < 2400; i++) {
    const fine = v.alt < 70e3 || v.engineOn || (booster && !booster.landed && !booster.crashed);
    const h = fine ? 0.02 : 1.0;
    if (prog.phase !== 'done') prog.update(v, sc);
    if (sc.stageReq) { sc.stageReq = false; doStage(); }

    v.step(h, t, env);
    if (booster && !booster.landed && !booster.crashed) {
      rec.update(h);
      if (rec.phase === 'landing') {
        const agl = booster.agl ?? booster.alt;
        if (agl < 100 && (Math.floor(t * 10) % 5 === 0 || agl < 10)) {
          events.push(`      [b landing ${t.toFixed(1)}s] agl=${agl.toFixed(1)} sp=${booster.speedSurf.toFixed(1)} ve=${booster.vSurf.e.toFixed(1)} vu=${booster.vSurf.u.toFixed(1)} sx=${booster.sx.toFixed(0)} dist=${(booster.sx - rec.targetX).toFixed(1)} thr=${booster.throttle.toFixed(2)} mode=${booster.engMode} fuel=${booster.fuelTotal().toFixed(2)} legsT=${booster.legsT.toFixed(2)} ang=${booster.ang.toFixed(2)}`);
        }
      }
      booster.step(h, t, env);
    }
    if (booster) {
      for (const e of booster.events.splice(0)) {
        events.push(`[${t.toFixed(0)}s] BOOSTER EVENT: ${e.join(' ')}`);
      }
    }
    t += h;
    if (booster && (booster.landed || booster.crashed)) {
      events.push(`[${t.toFixed(0)}s] Booster finished: landed=${!!booster.landed} crashed=${booster.crashed} site=${booster.landed?.site || 'none'} distToTarget=${Math.abs(booster.sx - rec.targetX).toFixed(1)}m`);
      break;
    }
  }

  console.log(`=== Mode: ${recoveryMode} ===`);
  console.log(events.slice(0, 40).join('\n'));
  if (events.length > 40) console.log(events.slice(-25).join('\n'));
  return { booster, rec };
}

runBoosterTest('auto');
runBoosterTest('asds');
