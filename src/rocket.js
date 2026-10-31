// Rocket data model: stack layout, staging, stats, mesh assembly
import * as THREE from 'three';
import { PARTS, MAT, G0, R, buildPart, radialPlacements } from './parts.js';
import { tr } from './i18n.js';

let uidCounter = 1;
export function newItem(type) { return { id: uidCounter++, type, attach: [], rot: [0, 0, 0], attachRot: {} }; }

export function cloneStack(stack) {
  return stack.map((s) => ({
    id: s.id,
    type: s.type,
    attach: [...s.attach],
    rot: s.rot ? [...s.rot] : [0, 0, 0],
    attachRot: s.attachRot ? JSON.parse(JSON.stringify(s.attachRot)) : {}
  }));
}

export function stackFromTypes(list) {
  return list.map((e) => {
    const [type, ...att] = e.split('+');
    const it = newItem(type);
    it.attach = att;
    return it;
  });
}

export const PRESETS = {
  'Tên lửa Tốt Nhất (2 Tầng Siêu Cấp)': ['capsule', 'batteryPackL+solarPanel+gunLaser+waterCannon+gunAcid+gunElectric', 'batteryPackL', 'engLaser', 'decoupler', 'batteryPackL', 'engAntiGrav'],
  'Saturn V (Apollo)': ['saturnApollo+gunLaser+waterCannon', 'saturnSM+gunLaser+waterCannon', 'saturnSLA', 'saturnS4B', 'saturnS4BInter', 'saturnS2', 'saturnS2Inter', 'saturnS1'],
  'Hai tầng (khuyên dùng)': ['capsule', 'tankM+gunLaser+waterCannon', 'engVac', 'decoupler', 'tankL', 'tankL+fins', 'engHeavy'],
  'Soyuz / R-7 Semyorka': ['soyuzNose+gunLaser+waterCannon', 'soyuzFairing+gunLaser+waterCannon', 'soyuzBlockI', 'soyuzCore', 'soyuzBooster'],
  'N1 Liên Xô (Mặt Trăng)': ['n1Tower+gunLaser+waterCannon', 'n1Fairing+gunLaser+waterCannon', 'n1BlockV', 'n1BlockB', 'n1BlockA'],
  'Titan IV (Tàu Voyager)': ['titan4Fairing+gunLaser+waterCannon', 'titan4Stage2', 'titan4Stage1'],
  'Tàu con thoi Space Shuttle': ['shuttleNose+gunLaser+waterCannon', 'shuttleOrbiter', 'shuttleSrb'],
  'Energia – Buran': ['buranNose+gunLaser+waterCannon', 'buranShuttle', 'buranEnergia'],
  'Tên lửa Energia (Мир-2 / Polyus)': ['energiaNose+gunLaser+waterCannon', 'energiaPolyus', 'energiaCore'],
  'Proton-M (Nga)': ['protonFairing+gunLaser+waterCannon', 'protonStage3', 'protonStage2', 'protonStage1'],
  'Ariane 5 (James Webb)': ['ariane5Fairing+gunLaser+waterCannon', 'ariane5Stage2', 'ariane5Stage1'],
  'Atlas V (Sao Hỏa)': ['atlasVFairing+gunLaser+waterCannon', 'atlasVStage2', 'atlasVStage1'],
  'Delta IV Heavy': ['d4hFairing+gunLaser+waterCannon', 'd4hStage2', 'd4hStage1'],
  'Trường Chinh 5 (Long March 5)': ['cz5Fairing+gunLaser+waterCannon', 'cz5Stage2', 'cz5Stage1'],
  'Falcon 9 (SpaceX)': ['f9Dragon+gunLaser+waterCannon', 'f9Stage2', 'f9Stage1'],
  'Falcon Heavy (SpaceX)': ['fhFairing+gunLaser+waterCannon', 'fhStage2', 'fhStage1'],
  'SLS Artemis (NASA)': ['slsOrion+gunLaser+waterCannon', 'slsStage2', 'slsStage1'],
  'Starship & Super Heavy': ['starshipNose+gunLaser+waterCannon', 'starshipShip', 'starshipBooster'],
  'Nhỏ gọn': ['nose', 'tankM+gunLaser+waterCannon', 'tankM+fins', 'engMid'],
  'Siêu nặng (lên quỹ đạo)': ['capsule', 'tankS+gunLaser+waterCannon', 'tankM', 'engVac', 'decoupler', 'tankL', 'tankL', 'tankL+booster+fins', 'engHeavy'],
  'Đại Bàng 9 (tái sử dụng)': ['capsule', 'tankM+gunLaser+waterCannon', 'engVac', 'decoupler', 'tankL+gridfins', 'tankL', 'tankL+legs', 'engReuse'],
  'Tàu chở khách (ISS)': ['dockPort', 'capsule', 'tankM+solarPanel+gunLaser+waterCannon', 'engVac', 'decoupler', 'tankL+gridfins', 'tankL', 'tankL', 'tankL+legs', 'engReuse'],
  'Apollo (Mặt Trăng)': ['apollo11CM+gunLaser+waterCannon', 'apollo11SM+gunLaser+waterCannon', 'apollo11SLA', 'apollo11S4B', 'apollo11S4BInter', 'apollo11S2', 'apollo11S2Inter', 'apollo11S1'],
  'Xe địa hình Rover 4x4': ['cockpitRover', 'chassisRover+wheelsRover+solarRover+gunLaser+waterCannon'],
  'Canô lướt sóng siêu tốc': ['cabinBoat', 'hullBoat+floatsBoat+gunLaser+waterCannon', 'motorBoat'],
  'Thuyền phản lực tên lửa': ['cabinBoat', 'hullBoat+floatsBoat+gunLaser+waterCannon', 'tankS', 'engReuse'],
  'Tiêm kích phản lực F-22': ['cockpitPlane', 'fuselagePlane+wingsPlane+gearPlane+gunLaser+waterCannon', 'tailPlane', 'engJet'],
  'Tàu Phản Trọng Lực Lượng Tử': ['dockPort', 'capsule', 'batteryPack+solarPanel+legs+gunLaser+waterCannon', 'engAntiGrav'],
  'Tàu Chiến Lazer Liên Hành Tinh': ['dockPort', 'capsule', 'batteryPack+solarPanel+legs+gunLaser+waterCannon', 'engLaser', 'decoupler', 'batteryPack+fins', 'engLaser'],
  'Chiến Hạm Diệt Alien (Lazer + Nước 1M PSI)': ['dockPort', 'capsule', 'batteryPackL+gunLaser+waterCannon+gunAcid+gunElectric+solarPanel+legs', 'engAntiGrav', 'decoupler', 'batteryPackL+fins', 'engLaser'],
  'Đĩa Bay UFO Siêu Cấp (Alien Saucer)': ['ufoSaucer+gunLaser+waterCannon+gunAcid+gunElectric+legs', 'engAntiGrav'],
};

export function ensureStackHasWeapons(stack) {
  if (!Array.isArray(stack) || !stack.length) return stack;
  const hasWeapon = stack.some((it) => it.attach && (it.attach.includes('gunLaser') || it.attach.includes('waterCannon') || it.attach.includes('gunAcid') || it.attach.includes('gunElectric')));
  if (hasWeapon) return stack;
  // Find best upper-stage body/tank part to mount weapons
  let target = stack.find((it) => {
    const d = PARTS[it.type];
    return d && (d.cat === 'Nhiên liệu' || it.type === 'chassisRover' || it.type === 'hullBoat' || it.type === 'fuselagePlane');
  }) || stack[0];
  if (target) {
    if (!target.attach.includes('gunLaser')) target.attach.push('gunLaser');
    if (!target.attach.includes('waterCannon')) target.attach.push('waterCannon');
  }
  return stack;
}

/** y offsets (bottom of each part), top->bottom order preserved */
export function layout(stack) {
  let y = 0;
  const out = new Array(stack.length);
  for (let i = stack.length - 1; i >= 0; i--) {
    const def = PARTS[stack[i].type];
    out[i] = { item: stack[i], def, y, index: i };
    y += def.height;
  }
  return { parts: out, height: y };
}

/** split into segments by decouplers or self-staging Saturn V stages. segs[0] = top (last stage), segs[n-1] = first stage */
export function segments(stack) {
  const segs = [[]];
  stack.forEach((it, i) => {
    const def = PARTS[it.type];
    const isAutoStage = def && def.autoStage && i > 0 && stack[i - 1].type !== 'decoupler';
    if ((it.type === 'decoupler' || isAutoStage) && segs[segs.length - 1].length) segs.push([]);
    segs[segs.length - 1].push(i);
  });
  return segs;
}

function itemMass(it) {
  const d = PARTS[it.type];
  let m = d.dry + (d.fuel || 0);
  for (const a of it.attach) {
    const ad = PARTS[a];
    if (!ad) continue;
    const cnt = ad.count || 2;
    m += cnt * (ad.dry + (ad.fuel || 0));
  }
  return m;
}

export function segmentInfo(stack, idx) {
  const s = {
    dry: 0, fuel: 0, chemFuel: 0, batteryFuel: 0,
    tSL: 0, tVac: 0, mdot: 0,
    tChemSL: 0, tChemVac: 0, mdotChem: 0, chemEngines: 0,
    tAntiGrav: 0, mdotAntiGrav: 0, tLaser: 0, mdotLaser: 0,
    batteryCount: 0, hasSolar: false, solarOnBattery: 0,
    bDry: 0, bFuel: 0, bTSL: 0, bTVac: 0, bMdot: 0,
    fins: false, engines: 0, engCount: 0, restart: false,
    legs: false, gridfins: false, antiGrav: false, laser: false,
    needsBattery: false, needsChemFuel: false,
    useChemFuel: false, useBatteryFuel: false,
  };
  for (const i of idx) {
    const it = stack[i];
    const d = PARTS[it.type];
    s.dry += d.dry;
    if (it.type === 'batteryPack' || it.type === 'batteryPackL' || d.isBattery) {
      s.batteryCount += (it.type === 'batteryPackL' || it.type === 'ufoSaucer') ? 2 : 1;
      s.batteryFuel += d.fuel || 0;
    } else {
      s.chemFuel += d.fuel || 0;
    }
    if (d.hasFins) s.fins = true;
    if (it.type === 'engAntiGrav' || it.type === 'ufoSaucer') {
      s.antiGrav = true;
      s.tAntiGrav += d.thrustVac;
      s.mdotAntiGrav += d.thrustVac / (d.ispVac * G0);
    } else if (it.type === 'engLaser') {
      s.laser = true;
      s.tLaser += d.thrustVac;
      s.mdotLaser += d.thrustVac / (d.ispVac * G0);
    } else if (d.thrustVac) {
      s.tChemSL += d.thrustSL;
      s.tChemVac += d.thrustVac;
      s.mdotChem += d.thrustVac / (d.ispVac * G0);
      s.chemEngines++;
    }
    if (d.thrustVac) {
      s.engines++;
      s.engCount += d.engines || 1;
      if (d.restart) s.restart = true;
    }
    const isBatPart = it.type === 'batteryPack' || it.type === 'batteryPackL' || d.isBattery || it.type === 'chassisRover';
    const hasRadialBat = it.attach.some((a) => a === 'batteryPack' || a === 'batteryPackL' || PARTS[a]?.isBattery);
    for (const a of it.attach) {
      const ad = PARTS[a];
      if (!ad) continue;
      const cnt = ad.count || 2;
      if (a === 'solarPanel' || a === 'solarRover') {
        s.hasSolar = true;
        if (isBatPart || hasRadialBat) s.solarOnBattery += 1;
      }
      if (a === 'booster') {
        s.bDry += ad.dry * cnt; s.bFuel += ad.fuel * cnt;
        s.bTSL += ad.thrustSL * cnt; s.bTVac += ad.thrustVac * cnt;
        s.bMdot += cnt * ad.thrustVac / (ad.ispVac * G0);
      } else {
        s.dry += ad.dry * cnt;
        if (a === 'batteryPack' || a === 'batteryPackL' || ad.isBattery) {
          s.batteryCount += cnt * (a === 'batteryPackL' ? 2 : 1);
          s.batteryFuel += (ad.fuel || 0) * cnt;
        } else {
          s.chemFuel += (ad.fuel || 0) * cnt;
        }
        if (a === 'engAntiGrav') {
          s.antiGrav = true;
          s.tAntiGrav += ad.thrustVac * cnt;
          s.mdotAntiGrav += (cnt * ad.thrustVac) / (ad.ispVac * G0);
        } else if (a === 'engLaser') {
          s.laser = true;
          s.tLaser += ad.thrustVac * cnt;
          s.mdotLaser += (cnt * ad.thrustVac) / (ad.ispVac * G0);
        } else if (ad.thrustVac) {
          s.tChemSL += ad.thrustSL * cnt;
          s.tChemVac += ad.thrustVac * cnt;
          s.mdotChem += (cnt * ad.thrustVac) / (ad.ispVac * G0);
          s.chemEngines += cnt;
        }
        if (ad.thrustVac) {
          s.engines += cnt;
          s.engCount += (ad.engines || 1) * cnt;
          if (ad.restart) s.restart = true;
        }
        if (a === 'fins') s.fins = true;
        if (a === 'legs') s.legs = true;
        if (a === 'gridfins') { s.gridfins = true; s.fins = true; }
      }
    }
  }
  const hasSciFi = s.antiGrav || s.laser;
  if (hasSciFi && s.batteryFuel <= 0) {
    // Laser & Anti-Gravity engines ONLY work with batteryPack (never with regular fuel tanks)
    s.needsBattery = true;
    s.tAntiGrav = 0; s.mdotAntiGrav = 0;
    s.tLaser = 0; s.mdotLaser = 0;
  }
  if (s.chemEngines > 0 && s.chemFuel <= 0) {
    // Regular engines ONLY work with regular fuel tanks (never with batteryPack)
    if (s.batteryFuel > 0) s.needsChemFuel = true;
    s.tChemSL = 0; s.tChemVac = 0; s.mdotChem = 0;
  }
  s.useBatteryFuel = hasSciFi && s.batteryFuel > 0;
  s.useChemFuel = s.chemEngines > 0 && s.chemFuel > 0;
  // Unusable fuel in this stage (e.g. regular fuel tank attached to a Laser/Anti-Grav engine) counts as dead dry mass
  if (s.useBatteryFuel) s.fuel += s.batteryFuel;
  else s.dry += s.batteryFuel;
  if (s.useChemFuel) s.fuel += s.chemFuel;
  else s.dry += s.chemFuel;

  // Keep engine thrust visible in VAB when no fuel at all is attached yet, EXCEPT when wrong fuel type is used or sci-fi engine lacks battery
  const sciFiSL = (s.tAntiGrav ? 2600 * (s.tAntiGrav / 2600) : 0) + (s.tLaser ? 2400 * (s.tLaser / 2600) : 0);
  const sciFiVac = s.tAntiGrav + s.tLaser;
  const sciFiMdot = s.mdotAntiGrav + s.mdotLaser;
  s.tSL = s.tChemSL + sciFiSL;
  s.tVac = s.tChemVac + sciFiVac;
  s.mdot = s.mdotChem + sciFiMdot;
  s.mass = s.dry + s.fuel + s.bDry + s.bFuel;
  return s;
}

export function computeStats(stack) {
  const lay = layout(stack);
  const segs = segments(stack);
  const infos = segs.map((idx) => segmentInfo(stack, idx));
  const totalMass = stack.reduce((m, it) => m + itemMass(it), 0);
  const stages = [];
  let massAbove = 0;
  for (let k = 0; k < infos.length; k++) {
    if (k > 0) massAbove += infos[k - 1].mass;
  }
  // iterate first stage (bottom) -> top
  let remainingAbove = totalMass;
  let totalDv = 0;
  for (let k = infos.length - 1; k >= 0; k--) {
    const s = infos[k];
    const first = k === infos.length - 1;
    const m0 = remainingAbove;
    const vacMix = first ? 0.45 : 1; // first stage: blend sea-level & vacuum
    const coreT = s.tSL + (s.tVac - s.tSL) * vacMix;
    const boostT = s.bTSL + (s.bTVac - s.bTSL) * vacMix;
    let dv = 0, t = 0, m = m0;
    let fuelLeft = s.fuel;
    if (s.bMdot > 0) {
      const tA = s.bFuel / s.bMdot;
      const coreUsed = Math.min(fuelLeft, s.mdot * tA);
      const ve = (coreT + boostT) / (s.mdot + s.bMdot);
      const m1 = m - s.bFuel - coreUsed;
      dv += ve * Math.log(m / m1);
      m = m1 - s.bDry; fuelLeft -= coreUsed; t += tA;
    }
    if (s.mdot > 0 && fuelLeft > 0) {
      const ve = coreT / s.mdot;
      dv += ve * Math.log(m / (m - fuelLeft));
      t += fuelLeft / s.mdot;
    }
    const thrust = first ? s.tSL + s.bTSL : s.tVac + s.bTVac;
    stages.push({ num: infos.length - k, dv, twr: thrust / (m0 * G0), burn: t, thrust, mass: m0, segIndex: k, solarOnBattery: s.solarOnBattery || 0 });
    totalDv += dv;
    remainingAbove -= s.mass;
  }
  const isRover = stack.some((it) => it.type.includes('Rover') || it.attach.some((a) => a.includes('Rover')));
  const isBoat = stack.some((it) => it.type.includes('Boat') || it.attach.some((a) => a.includes('Boat')));
  const isPlane = stack.some((it) => it.type.includes('Plane') || it.attach.some((a) => a.includes('Plane')) || it.type === 'engJet');
  const warnings = [];
  const st1 = stages[0];
  if (!stack.length) warnings.push(tr('Hãy thêm linh kiện để bắt đầu lắp ráp.', 'Add parts to start building your rocket.'));
  else if (isRover) {
    if (!stack.some((it) => it.type === 'cockpitRover')) warnings.push(tr('Xe Rover nên có Cabin xe để điều khiển.', 'Rover should have a Rover Cockpit to steer.'));
    if (!stack.some((it) => it.attach.includes('wheelsRover'))) warnings.push(tr('Xe Rover cần gắn Bánh xe địa hình ×4 để di chuyển.', 'Rover needs Off-Road Wheels ×4 to drive.'));
  } else if (isBoat) {
    if (!stack.some((it) => it.type === 'cabinBoat')) warnings.push(tr('Thuyền nên có Cabin canô để lái.', 'Boat should have a Speedboat Cabin to steer.'));
    if (!stack.some((it) => it.type === 'hullBoat')) warnings.push(tr('Thuyền cần có Thân thuyền chữ V để nổi và lướt sóng.', 'Boat needs a V-Hull Boat Body to float on water.'));
  } else if (isPlane) {
    if (!stack.some((it) => it.type === 'cockpitPlane')) warnings.push(tr('Máy bay nên có Buồng lái tiêm kích để quan sát và điều khiển.', 'Aircraft should have a Fighter Jet Cockpit.'));
    if (!stack.some((it) => it.attach.includes('wingsPlane'))) warnings.push(tr('Máy bay cần gắn Cánh nâng phản lực ×2 để tạo lực nâng cất cánh.', 'Aircraft needs Swept Jet Wings ×2 for lift.'));
    if (!stack.some((it) => it.type === 'engJet' || PARTS[it.type]?.thrustSL > 0)) warnings.push(tr('Máy bay cần Động cơ phản lực để tạo lực đẩy cất cánh.', 'Aircraft needs a Jet Engine for thrust.'));
  } else {
    const st1Info = infos[infos.length - 1];
    if (!st1 || (st1.thrust <= 0 && (!st1Info || st1Info.engines === 0))) warnings.push(tr('Tầng 1 chưa có động cơ!', 'Stage 1 has no engine!'));
    else if (st1.thrust > 0 && st1.twr < 1) warnings.push(tr('TWR < 1: tên lửa quá nặng, không thể cất cánh.', 'TWR < 1: rocket is too heavy to lift off.'));
    infos.forEach((s, k) => {
      const stNum = infos.length - k;
      if (s.needsBattery) {
        warnings.push(tr(
          `Tầng ${stNum}: Động cơ Lazer / Phản Trọng Lực chỉ chạy bằng Cục Pin Năng Lượng (không dùng được nhiên liệu thường)!`,
          `Stage ${stNum}: Laser / Anti-Gravity Engine requires a Quantum Energy Battery (cannot use regular fuel tanks)!`
        ));
      } else if (s.needsChemFuel) {
        warnings.push(tr(
          `Tầng ${stNum}: Động cơ thường cần Bồn nhiên liệu (không chạy bằng Cục Pin Năng Lượng)!`,
          `Stage ${stNum}: Chemical engine requires a regular Fuel Tank (cannot run on Quantum Energy Battery)!`
        ));
      } else if (s.engines > 0 && s.fuel <= 0) {
        warnings.push(tr(`Tầng ${stNum} có động cơ nhưng không có nhiên liệu.`, `Stage ${stNum} has an engine but no fuel.`));
      }
    });
    if (!infos.some((s) => s.fins) && lay.height > 14) warnings.push(tr('Không có cánh ổn định – tên lửa dễ bị lật.', 'No stabilizer fins – rocket may flip in flight.'));
    const bottom = stack[stack.length - 1];
    if (bottom && !PARTS[bottom.type].thrustVac) warnings.push(tr('Phần dưới cùng nên là động cơ.', 'The bottom part should be an engine.'));
  }
  if (stack.length && !stack.some((it) => it.attach && (it.attach.includes('gunLaser') || it.attach.includes('waterCannon') || it.attach.includes('gunAcid') || it.attach.includes('gunElectric')))) {
    warnings.push(tr('Tên lửa chưa có vũ khí (Súng Lazer / Máy Phun Nước 1M PSI / Súng Acid / Súng Điện 1M WATT) để bắn Alien!', 'Rocket has no weapons (Laser Gun / 1M PSI Water Cannon / Acid Gun / 1M WATT Electric Gun) to shoot Aliens!'));
  }
  return { totalMass, height: lay.height, stages, totalDv, warnings, segments: segs, infos };
}

/**
 * Build a Three.js rocket.
 * Returns { root, segGroups, partObjs, nozzles, boosters, layout, segs, deployables, capsule, dockPort, wheels }
 *  - deployables: [{ seg, type: 'legs'|'gridfins', objs, partIndex }] (each obj has userData.setDeploy(t))
 *  - capsule: { obj, seg } | null  (first capsule; obj.userData.setChute(t), obj.userData.tower)
 *  - dockPort: { obj, seg } | null (obj.userData.port = docking reference node)
 *  - nozzles[i].center === true for the engReuse centre engine
 * Coordinates: y = 0 at very bottom of stack.
 */
export function buildRocket(stack) {
  const root = new THREE.Group();
  const lay = layout(stack);
  const segs = segments(stack);
  const segOf = new Map();
  segs.forEach((idx, k) => idx.forEach((i) => segOf.set(i, k)));
  const segGroups = segs.map(() => { const g = new THREE.Group(); root.add(g); return g; });
  const partObjs = [];
  const nozzles = [];
  const boosters = [];
  const deployables = [];
  const roverWheels = [];
  const weapons = [];
  let capsule = null, dockPort = null;
  for (const p of lay.parts) {
    const k = segOf.get(p.index);
    const obj = buildPart(p.item.type);
    const rot = p.item.rot || [0, 0, 0];
    const halfH = p.def.height / 2;
    const partContainer = new THREE.Group();
    partContainer.position.set(0, p.y + halfH, 0);
    partContainer.rotation.set(rot[0], rot[1], rot[2]);
    obj.position.set(0, -halfH, 0);
    partContainer.add(obj);

    partContainer.userData.index = p.index;
    partContainer.userData.itemId = p.item.id;
    obj.userData.index = p.index;
    obj.userData.itemId = p.item.id;

    segGroups[k].add(partContainer);
    partObjs.push({ index: p.index, obj, container: partContainer, seg: k, def: p.def, y: p.y });
    if (obj.userData.nozzles) for (const n of obj.userData.nozzles) nozzles.push({ seg: k, node: n, r: n.userData.r, style: n.userData.style || 'default', def: p.def, bellMats: obj.userData.bellMats, booster: null, center: n === obj.userData.centerNozzle, agLight: obj.userData.agLight, cyanGlow: obj.userData.cyanGlow, violetGlow: obj.userData.violetGlow });
    if (p.item.type === 'capsule' || p.item.type === 'saturnApollo' || p.item.type === 'apollo11CM' || p.item.type === 'soyuzNose' || p.item.type === 'n1Tower' || p.item.type === 'buranNose' || p.item.type === 'buranShuttle' || p.item.type === 'energiaNose' || p.item.type === 'energiaPolyus' || p.item.type === 'cz5Fairing' || p.item.type === 'cz5Stage2' || p.item.type === 'ariane5Fairing' || p.item.type === 'ariane5Stage2' || p.item.type === 'slsOrion' || p.item.type === 'slsStage2' || p.item.type === 'atlasVFairing' || p.item.type === 'atlasVStage2' || p.item.type === 'fhFairing' || p.item.type === 'fhStage2' || p.item.type === 'f9Dragon' || p.item.type === 'f9Stage2' || p.item.type === 'shuttleNose' || p.item.type === 'shuttleOrbiter' || p.item.type === 'protonFairing' || p.item.type === 'protonStage3' || p.item.type === 'd4hFairing' || p.item.type === 'd4hStage2' || p.item.type === 'titan4Fairing' || p.item.type === 'titan4Stage2' || p.item.type === 'starshipNose' || p.item.type === 'starshipShip' || p.item.type === 'ufoSaucer') {
      if (p.index > 0 && obj.userData.tower) obj.userData.tower.visible = false; // something mounted above
      if (!capsule) capsule = { obj, seg: k };
    }
    if (p.item.type === 'dockPort' && !dockPort) dockPort = { obj, seg: k };
    const att = p.item.attach;
    for (const a of att) {
      if (!PARTS[a]) continue;
      const attRot = (p.item.attachRot && p.item.attachRot[a]) || [0, 0, 0];
      let places = radialPlacements(a);
      // avoid overlaps when several radial types share one tank
      if (a === 'fins' && att.includes('legs')) places = [0, 1, 2, 3].map((i) => ({ angle: i * Math.PI / 2, dist: 0 }));
      if (a === 'gridfins' && att.includes('booster') && !att.includes('legs')) places = [0, 1, 2, 3].map((i) => ({ angle: Math.PI / 4 + i * Math.PI / 2, dist: 0 }));
      const group = [];
      for (const pl of places) {
        const ao = buildPart(a);
        ao.userData.index = p.index;
        ao.userData.attach = a;
        ao.userData.itemId = p.item.id;
        let posX = 0, posY = p.y, posZ = 0;
        if (a === 'fins') {
          posX = 0; posY = p.y + 0.05; posZ = 0;
        } else if (a === 'legs') {
          posX = 0; posY = p.y; posZ = 0;
        } else if (a === 'gridfins') {
          posX = 0; posY = p.y + p.def.height - 0.5; posZ = 0;
        } else if (a === 'wheelsRover') {
          posX = Math.cos(pl.angle) * pl.dist; posY = p.y + 0.35; posZ = Math.sin(pl.angle) * pl.dist + (pl.offsetZ || 0);
          ao.userData.sideSign = Math.cos(pl.angle) >= 0 ? 1 : -1;
          ao.userData.isFront = (pl.offsetZ || 0) > 0;
          roverWheels.push(ao);
        } else if (a === 'floatsBoat') {
          posX = Math.cos(pl.angle) * pl.dist; posY = p.y + 0.45; posZ = Math.sin(pl.angle) * pl.dist + (pl.offsetZ || 0);
        } else if (a === 'solarRover') {
          posX = Math.cos(pl.angle) * pl.dist; posY = p.y + p.def.height * 0.65; posZ = Math.sin(pl.angle) * pl.dist + (pl.offsetZ || 0);
        } else if (a === 'solarPanel') {
          posX = Math.cos(pl.angle) * pl.dist; posY = p.y + p.def.height * 0.55; posZ = Math.sin(pl.angle) * pl.dist + (pl.offsetZ || 0);
        } else if (a === 'gunLaser') {
          const isUfo = p.item.type === 'ufoSaucer';
          const isBuran = p.item.type.startsWith('buran') || p.item.type.startsWith('energia') || p.item.type.startsWith('shuttle');
          const isCz5 = p.item.type.startsWith('cz5') || p.item.type.startsWith('ariane5') || p.item.type === 'slsStage2' || p.item.type === 'slsStage1' || p.item.type === 'fhFairing' || p.item.type.startsWith('starship');
          const isSlsOrion = p.item.type === 'slsOrion' || p.item.type.startsWith('atlasV') || p.item.type.startsWith('f9') || p.item.type === 'fhStage2' || p.item.type.startsWith('proton') || p.item.type.startsWith('d4h') || p.item.type.startsWith('titan4');
          const effDist = isUfo ? 3.85 : isBuran ? 1.98 : isCz5 ? 1.36 : isSlsOrion ? 1.06 : pl.dist;
          const effH = (p.item.type === 'saturnApollo' || p.item.type === 'apollo11CM' || p.item.type === 'soyuzNose' || p.item.type === 'n1Tower' || p.item.type === 'buranNose' || p.item.type === 'energiaNose' || p.item.type === 'cz5Fairing' || p.item.type === 'ariane5Fairing' || p.item.type === 'slsOrion' || p.item.type === 'atlasVFairing' || p.item.type === 'fhFairing' || p.item.type === 'f9Dragon' || p.item.type === 'shuttleNose' || p.item.type === 'protonFairing' || p.item.type === 'd4hFairing' || p.item.type === 'titan4Fairing' || p.item.type === 'starshipNose') ? 3.6 : p.def.height;
          posX = Math.cos(pl.angle) * effDist; posY = isUfo ? (p.y + 1.32) : (p.y + effH * 0.72); posZ = Math.sin(pl.angle) * effDist + (pl.offsetZ || 0);
        } else if (a === 'waterCannon') {
          const isUfo = p.item.type === 'ufoSaucer';
          const isBuran = p.item.type.startsWith('buran') || p.item.type.startsWith('energia') || p.item.type.startsWith('shuttle');
          const isCz5 = p.item.type.startsWith('cz5') || p.item.type.startsWith('ariane5') || p.item.type === 'slsStage2' || p.item.type === 'slsStage1' || p.item.type === 'fhFairing' || p.item.type.startsWith('starship');
          const isSlsOrion = p.item.type === 'slsOrion' || p.item.type.startsWith('atlasV') || p.item.type.startsWith('f9') || p.item.type === 'fhStage2' || p.item.type.startsWith('proton') || p.item.type.startsWith('d4h') || p.item.type.startsWith('titan4');
          const effDist = isUfo ? 3.15 : isBuran ? 1.98 : isCz5 ? 1.36 : isSlsOrion ? 1.06 : pl.dist;
          const effH = (p.item.type === 'saturnApollo' || p.item.type === 'apollo11CM' || p.item.type === 'soyuzNose' || p.item.type === 'n1Tower' || p.item.type === 'buranNose' || p.item.type === 'energiaNose' || p.item.type === 'cz5Fairing' || p.item.type === 'ariane5Fairing' || p.item.type === 'slsOrion' || p.item.type === 'atlasVFairing' || p.item.type === 'fhFairing' || p.item.type === 'f9Dragon' || p.item.type === 'shuttleNose' || p.item.type === 'protonFairing' || p.item.type === 'd4hFairing' || p.item.type === 'titan4Fairing' || p.item.type === 'starshipNose') ? 3.6 : p.def.height;
          posX = Math.cos(pl.angle) * effDist; posY = isUfo ? (p.y + 0.62) : (p.y + effH * 0.28); posZ = Math.sin(pl.angle) * effDist + (pl.offsetZ || 0);
        } else if (a === 'gunAcid') {
          const isUfo = p.item.type === 'ufoSaucer';
          const isBuran = p.item.type.startsWith('buran') || p.item.type.startsWith('energia') || p.item.type.startsWith('shuttle');
          const isCz5 = p.item.type.startsWith('cz5') || p.item.type.startsWith('ariane5') || p.item.type === 'slsStage2' || p.item.type === 'slsStage1' || p.item.type === 'fhFairing' || p.item.type.startsWith('starship');
          const isSlsOrion = p.item.type === 'slsOrion' || p.item.type.startsWith('atlasV') || p.item.type.startsWith('f9') || p.item.type === 'fhStage2' || p.item.type.startsWith('proton') || p.item.type.startsWith('d4h') || p.item.type.startsWith('titan4');
          const effDist = isUfo ? 3.50 : isBuran ? 1.98 : isCz5 ? 1.36 : isSlsOrion ? 1.06 : pl.dist;
          const effH = (p.item.type === 'saturnApollo' || p.item.type === 'apollo11CM' || p.item.type === 'soyuzNose' || p.item.type === 'n1Tower' || p.item.type === 'buranNose' || p.item.type === 'energiaNose' || p.item.type === 'cz5Fairing' || p.item.type === 'ariane5Fairing' || p.item.type === 'slsOrion' || p.item.type === 'atlasVFairing' || p.item.type === 'fhFairing' || p.item.type === 'f9Dragon' || p.item.type === 'shuttleNose' || p.item.type === 'protonFairing' || p.item.type === 'd4hFairing' || p.item.type === 'titan4Fairing' || p.item.type === 'starshipNose') ? 3.6 : p.def.height;
          posX = Math.cos(pl.angle) * effDist; posY = isUfo ? (p.y + 0.98) : (p.y + effH * 0.56); posZ = Math.sin(pl.angle) * effDist + (pl.offsetZ || 0);
        } else if (a === 'gunElectric') {
          const isUfo = p.item.type === 'ufoSaucer';
          const isBuran = p.item.type.startsWith('buran') || p.item.type.startsWith('energia') || p.item.type.startsWith('shuttle');
          const isCz5 = p.item.type.startsWith('cz5') || p.item.type.startsWith('ariane5') || p.item.type === 'slsStage2' || p.item.type === 'slsStage1' || p.item.type === 'fhFairing' || p.item.type.startsWith('starship');
          const isSlsOrion = p.item.type === 'slsOrion' || p.item.type.startsWith('atlasV') || p.item.type.startsWith('f9') || p.item.type === 'fhStage2' || p.item.type.startsWith('proton') || p.item.type.startsWith('d4h') || p.item.type.startsWith('titan4');
          const effDist = isUfo ? 3.30 : isBuran ? 1.98 : isCz5 ? 1.36 : isSlsOrion ? 1.06 : pl.dist;
          const effH = (p.item.type === 'saturnApollo' || p.item.type === 'apollo11CM' || p.item.type === 'soyuzNose' || p.item.type === 'n1Tower' || p.item.type === 'buranNose' || p.item.type === 'energiaNose' || p.item.type === 'cz5Fairing' || p.item.type === 'ariane5Fairing' || p.item.type === 'slsOrion' || p.item.type === 'atlasVFairing' || p.item.type === 'fhFairing' || p.item.type === 'f9Dragon' || p.item.type === 'shuttleNose' || p.item.type === 'protonFairing' || p.item.type === 'd4hFairing' || p.item.type === 'titan4Fairing' || p.item.type === 'starshipNose') ? 3.6 : p.def.height;
          posX = Math.cos(pl.angle) * effDist; posY = isUfo ? (p.y + 0.80) : (p.y + effH * 0.42); posZ = Math.sin(pl.angle) * effDist + (pl.offsetZ || 0);
        } else if (a === 'wingsPlane') {
          posX = Math.cos(pl.angle) * pl.dist; posY = p.y + p.def.height * 0.4; posZ = Math.sin(pl.angle) * pl.dist + (pl.offsetZ || 0);
        } else if (a === 'gearPlane') {
          posX = Math.cos(pl.angle) * pl.dist; posY = p.y + 0.1; posZ = Math.sin(pl.angle) * pl.dist + (pl.offsetZ || 0);
        } else if (PARTS[a].kind === 'stack') {
          const ad = PARTS[a];
          posX = Math.cos(pl.angle) * pl.dist;
          posZ = Math.sin(pl.angle) * pl.dist + (pl.offsetZ || 0);
          if (ad.thrustVac && !p.def.thrustVac) {
            posY = p.y - ad.height;
          } else if ((a === 'nose' || a === 'capsule' || a === 'dockPort') && p.item.type !== 'nose' && p.item.type !== 'capsule' && p.item.type !== 'dockPort') {
            posY = p.y + p.def.height;
          } else {
            posY = p.y + (p.def.height - (ad.height || 2.0)) * 0.5;
          }
          // Side structural struts connecting the side-mounted part to the central core
          const strutLen = Math.max(0.25, pl.dist - R * 1.65);
          const sg = new THREE.CylinderGeometry(0.055, 0.055, strutLen, 8).rotateZ(Math.PI / 2);
          const hPart = ad.height || 2.0;
          const strutYs = hPart >= 3.2 ? [hPart * 0.25, hPart * 0.75] : [hPart * 0.5];
          for (const sy of strutYs) {
            const s = new THREE.Mesh(sg, MAT.darkMetal || MAT.metal);
            s.position.set(-R - strutLen * 0.35, sy, 0);
            ao.add(s);
          }
        } else {
          posX = Math.cos(pl.angle) * pl.dist; posY = p.y + 0.15; posZ = Math.sin(pl.angle) * pl.dist;
          // struts for radial boosters
          const sg = new THREE.CylinderGeometry(0.05, 0.05, pl.dist - R - 0.5 + 0.2, 8).rotateZ(Math.PI / 2);
          const strutMat = (ao.children[1] && ao.children[1].material) || MAT.darkMetal || MAT.metal;
          for (const sy of [2.0, 8.5]) {
            const s = new THREE.Mesh(sg, strutMat);
            s.position.set(-Math.sign(Math.cos(pl.angle)) * 0.45, sy, 0);
            ao.add(s);
          }
        }

        const pivot = new THREE.Group();
        pivot.position.set(posX, posY, posZ);
        pivot.rotation.y = -pl.angle;
        pivot.userData.index = p.index;
        pivot.userData.attach = a;
        pivot.userData.itemId = p.item.id;

        ao.rotation.set(attRot[0], attRot[1], attRot[2]);
        pivot.add(ao);

        segGroups[k].add(pivot);
        group.push(ao);
        if (a === 'booster') {
          for (const n of ao.userData.nozzles) nozzles.push({ seg: k, node: n, r: n.userData.r, def: PARTS.booster, bellMats: ao.userData.bellMats, booster: ao });
        } else if (ao.userData.nozzles) {
          for (const n of ao.userData.nozzles) nozzles.push({ seg: k, node: n, r: n.userData.r, style: n.userData.style || 'default', def: PARTS[a], bellMats: ao.userData.bellMats, booster: null, center: false });
        }
      }
      if (a === 'booster') {
        const ad = PARTS.booster;
        boosters.push({ seg: k, objs: group, fuel: ad.fuel * ad.count, dry: ad.dry * ad.count, count: ad.count, attached: true });
      }
      if (a === 'legs' || a === 'gridfins') deployables.push({ seg: k, type: a, objs: group, partIndex: p.index });
      if (a === 'gunLaser' || a === 'waterCannon' || a === 'gunAcid' || a === 'gunElectric') {
        for (const ao of group) {
          weapons.push({ seg: k, type: a, weaponType: PARTS[a].weapon, obj: ao, muzzle: ao.userData.muzzle, turret: ao.userData.turret });
        }
      }
    }
  }
  return { root, segGroups, partObjs, nozzles, boosters, layout: lay, segs, deployables, capsule, dockPort, wheels: roverWheels, weapons };
}

/** Center of mass (y) of the given set of segments, including fuel state */
export function centerOfMass(stack, segIdxList, fuelFrac = null, boosterState = null) {
  const lay = layout(stack);
  const segs = segments(stack);
  let m = 0, my = 0, minY = Infinity, maxY = -Infinity;
  for (const k of segIdxList) {
    for (const i of segs[k]) {
      const p = lay.parts[i];
      const d = p.def;
      const f = fuelFrac ? fuelFrac[k] : 1;
      const pm = d.dry + (d.fuel || 0) * f;
      m += pm; my += pm * (p.y + d.height / 2);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y + d.height);
      for (const a of p.item.attach) {
        const ad = PARTS[a];
        if (!ad) continue;
        if (a === 'booster' && boosterState && !boosterState.attached(k)) continue;
        const cnt = ad.count || 2;
        const am = cnt * (ad.dry + (ad.fuel || 0));
        m += am; my += am * (p.y + (ad.height || 2.5) / 2);
      }
    }
  }
  return { mass: m, y: m > 0 ? my / m : 0, minY, maxY };
}
