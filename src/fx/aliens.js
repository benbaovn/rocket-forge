// 3D Alien UFO / Bio-Mech Invaders & Weapon Beam Meshes (Laser Gun + 1,000,000 PSI Water Cannon)
import * as THREE from 'three';

let _sharedGeos = null;
let _sharedMats = null;

function ensureShared() {
  if (_sharedGeos) return;
  _sharedGeos = {
    saucerOuter: new THREE.CylinderGeometry(1.9, 3.8, 0.65, 32),
    saucerLower: new THREE.CylinderGeometry(3.8, 1.5, 0.55, 32),
    saucerRim: new THREE.TorusGeometry(3.78, 0.16, 12, 36).rotateX(Math.PI / 2),
    orb: new THREE.SphereGeometry(0.24, 12, 10),
    dome: new THREE.SphereGeometry(1.55, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
    alienHead: new THREE.SphereGeometry(0.62, 18, 14),
    alienEye: new THREE.SphereGeometry(0.20, 12, 10),
    alienBody: new THREE.CylinderGeometry(0.28, 0.42, 0.65, 14),
    antennaStalk: new THREE.CylinderGeometry(0.025, 0.035, 0.45, 8),
    antennaTip: new THREE.SphereGeometry(0.08, 10, 8),
    coreRing: new THREE.TorusGeometry(1.15, 0.12, 10, 24).rotateX(Math.PI / 2),
    tentacleSeg: new THREE.CylinderGeometry(0.11, 0.06, 1.15, 10),
    hpBg: new THREE.PlaneGeometry(3.6, 0.34),
    hpFg: new THREE.PlaneGeometry(3.48, 0.24),
  };

  _sharedMats = {
    hullDark: new THREE.MeshStandardMaterial({ color: 0x1e2230, metalness: 0.88, roughness: 0.26 }),
    hullChrome: new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.92, roughness: 0.18 }),
    neonGreen: new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: new THREE.Color(0x22c55e),
      emissiveIntensity: 2.2,
      roughness: 0.2,
    }),
    neonPurple: new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: new THREE.Color(0x9333ea),
      emissiveIntensity: 2.0,
      roughness: 0.2,
    }),
    neonCyan: new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 2.1,
      roughness: 0.2,
    }),
    neonRed: new THREE.MeshStandardMaterial({
      color: 0xfb7185,
      emissive: new THREE.Color(0xe11d48),
      emissiveIntensity: 2.4,
      roughness: 0.18,
    }),
    neonGold: new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: new THREE.Color(0xd97706),
      emissiveIntensity: 2.2,
      roughness: 0.2,
    }),
    alienSkin: new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: new THREE.Color(0x15803d),
      emissiveIntensity: 0.85,
      roughness: 0.35,
      metalness: 0.1,
    }),
    alienSkinPurple: new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: new THREE.Color(0x6b21a8),
      emissiveIntensity: 0.95,
      roughness: 0.35,
      metalness: 0.15,
    }),
    alienSkinBoss: new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: new THREE.Color(0x9f1239),
      emissiveIntensity: 1.15,
      roughness: 0.3,
      metalness: 0.2,
    }),
    alienEyeMat: new THREE.MeshStandardMaterial({
      color: 0x050508,
      roughness: 0.05,
      metalness: 0.8,
    }),
    domeGlass: new THREE.MeshPhysicalMaterial({
      color: 0x86efac,
      transparent: true,
      opacity: 0.42,
      roughness: 0.08,
      metalness: 0.1,
      clearcoat: 1.0,
    }),
    hpBgMat: new THREE.MeshBasicMaterial({ color: 0x090d16, transparent: true, opacity: 0.78, side: THREE.DoubleSide }),
  };
}

export function createAlienMesh(tier = 'warrior') {
  ensureShared();
  const G = _sharedGeos;
  const M = _sharedMats;

  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const isBoss = tier === 'boss';
  const isWarrior = tier === 'warrior';
  const glowMat = isBoss ? M.neonRed : (isWarrior ? M.neonPurple : M.neonGreen);
  const baseSkin = isBoss ? M.alienSkinBoss : (isWarrior ? M.alienSkinPurple : M.alienSkin);
  const skinMat = baseSkin.clone();
  const baseEmissiveHex = isBoss ? 0x9f1239 : (isWarrior ? 0x6b21a8 : 0x15803d);

  // Spinning saucer disc
  const saucer = new THREE.Group();
  bodyGroup.add(saucer);

  const upper = new THREE.Mesh(G.saucerOuter, M.hullDark);
  upper.position.y = 0.22;
  saucer.add(upper);

  const lower = new THREE.Mesh(G.saucerLower, M.hullChrome);
  lower.position.y = -0.25;
  saucer.add(lower);

  const rim = new THREE.Mesh(G.saucerRim, glowMat);
  rim.position.y = 0.0;
  saucer.add(rim);

  if (isBoss) {
    // Extra golden shield ring for high-HP Boss UFO
    const bossHalo = new THREE.Mesh(G.saucerRim, M.neonGold);
    bossHalo.scale.setScalar(1.18);
    bossHalo.position.y = 0.15;
    saucer.add(bossHalo);
  }

  // 8 perimeter plasma orbs around the flying saucer
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const orbMat = isBoss ? (i % 2 === 0 ? M.neonRed : M.neonGold) : (i % 2 === 0 ? M.neonGreen : M.neonPurple);
    const orb = new THREE.Mesh(G.orb, orbMat);
    orb.position.set(Math.cos(a) * 3.75, 0.02, Math.sin(a) * 3.75);
    saucer.add(orb);
  }

  // Underbelly anti-gravity core ring
  const coreRing = new THREE.Mesh(G.coreRing, M.neonCyan);
  coreRing.position.y = -0.52;
  saucer.add(coreRing);

  // 4 bio-mechanical alien tentacles beneath the saucer
  const tentacles = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const tPivot = new THREE.Group();
    tPivot.position.set(Math.cos(a) * 1.35, -0.45, Math.sin(a) * 1.35);
    tPivot.rotation.y = -a;
    const seg1 = new THREE.Mesh(G.tentacleSeg, skinMat);
    seg1.position.y = -0.55;
    tPivot.add(seg1);
    const seg2 = new THREE.Mesh(G.tentacleSeg, glowMat);
    seg2.position.y = -1.45;
    seg2.scale.set(0.75, 0.85, 0.75);
    tPivot.add(seg2);
    bodyGroup.add(tPivot);
    tentacles.push({ pivot: tPivot, phase: i * 1.57 });
  }

  // Alien pilot inside the cockpit dome
  const pilot = new THREE.Group();
  pilot.position.y = 0.45;
  bodyGroup.add(pilot);

  const torso = new THREE.Mesh(G.alienBody, skinMat);
  torso.position.y = 0.28;
  pilot.add(torso);

  const head = new THREE.Mesh(G.alienHead, skinMat);
  head.position.y = 0.92;
  head.scale.set(1.05, 1.22, 0.95);
  pilot.add(head);

  // Two large slanted black alien eyes
  for (const sgn of [-1, 1]) {
    const eye = new THREE.Mesh(G.alienEye, M.alienEyeMat);
    eye.position.set(sgn * 0.26, 0.98, 0.50);
    eye.scale.set(1.15, 0.78, 0.65);
    eye.rotation.z = -sgn * 0.32;
    eye.rotation.y = sgn * 0.35;
    pilot.add(eye);

    // Alien feeler / antenna
    const stalk = new THREE.Mesh(G.antennaStalk, skinMat);
    stalk.position.set(sgn * 0.28, 1.58, 0.05);
    stalk.rotation.z = -sgn * 0.35;
    pilot.add(stalk);

    const tip = new THREE.Mesh(G.antennaTip, glowMat);
    tip.position.set(sgn * 0.42, 1.80, 0.05);
    pilot.add(tip);
  }

  // Transparent cockpit dome
  const dome = new THREE.Mesh(G.dome, M.domeGlass);
  dome.position.y = 0.48;
  bodyGroup.add(dome);

  // Overhead HP bar billboard
  const hpGroup = new THREE.Group();
  hpGroup.position.y = 3.15;
  root.add(hpGroup);

  const hpBg = new THREE.Mesh(G.hpBg, M.hpBgMat);
  hpGroup.add(hpBg);

  const hpFgMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide });
  const hpFg = new THREE.Mesh(G.hpFg, hpFgMat);
  hpFg.position.z = 0.02;
  hpGroup.add(hpFg);

  const hpBarScaleX = isBoss ? 1.55 : (isWarrior ? 1.1 : 0.78);
  hpGroup.scale.set(hpBarScaleX, isBoss ? 1.35 : 1.0, 1);

  const scale = isBoss ? 1.92 : (isWarrior ? 1.36 : 0.92);
  root.scale.setScalar(scale);

  root.userData = {
    bodyGroup,
    saucer,
    pilot,
    tentacles,
    skinMat,
    hpGroup,
    hpFg,
    hpFgMat,
    setHp(frac) {
      const f = Math.max(0, Math.min(1, frac));
      hpFg.scale.x = Math.max(0.001, f);
      hpFg.position.x = -(1 - f) * 1.74;
      if (f > 0.5) hpFgMat.color.setHex(0x4ade80);
      else if (f > 0.25) hpFgMat.color.setHex(0xfacc15);
      else hpFgMat.color.setHex(0xef4444);
    },
    animate(time, hitFlash = 0, camQuat = null) {
      saucer.rotation.y = time * 2.8;
      pilot.rotation.y = Math.sin(time * 1.9) * 0.45;
      for (const t of tentacles) {
        t.pivot.rotation.z = 0.25 + Math.sin(time * 4.2 + t.phase) * 0.28;
      }
      if (hitFlash > 0) {
        skinMat.emissive.setHex(0xffffff);
        skinMat.emissiveIntensity = 3.5;
      } else {
        skinMat.emissive.setHex(baseEmissiveHex);
        skinMat.emissiveIntensity = 0.95;
      }
      if (camQuat) {
        hpGroup.quaternion.copy(camQuat);
      }
    },
  };

  return root;
}

/** Create a visual 3D beam connecting `startPos` to `endPos` for Laser Gun or 1,000,000 PSI Water Cannon */
export function createBeamVisual(type, startPos, endPos) {
  const diff = new THREE.Vector3().subVectors(endPos, startPos);
  const len = Math.max(0.5, diff.length());
  const mid = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);

  const group = new THREE.Group();
  group.position.copy(mid);
  const up = new THREE.Vector3(0, 1, 0);
  group.quaternion.setFromUnitVectors(up, diff.clone().normalize());

  if (type === 'water') {
    // 1,000,000 PSI Supersonic Hydro-Jet (bright cyan-white core + expanding high-pressure spray sheath)
    const coreGeo = new THREE.CylinderGeometry(0.16, 0.07, len, 12, 1, true);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const outerGeo = new THREE.CylinderGeometry(0.48, 0.14, len, 12, 1, true);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    group.add(new THREE.Mesh(coreGeo, coreMat));
    group.add(new THREE.Mesh(outerGeo, outerMat));
    group.userData = { coreGeo, outerGeo, coreMat, outerMat, life: 0.18, maxLife: 0.18 };
  } else if (type === 'alienLaser') {
    // Alien Bio-Plasma Beam (neon green core + purple outer aura) for warrior/boss Alien brawls
    const coreGeo = new THREE.CylinderGeometry(0.08, 0.08, len, 10, 1, true);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x86efac,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const outerGeo = new THREE.CylinderGeometry(0.24, 0.24, len, 12, 1, true);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.68,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    group.add(new THREE.Mesh(coreGeo, coreMat));
    group.add(new THREE.Mesh(outerGeo, outerMat));
    group.userData = { coreGeo, outerGeo, coreMat, outerMat, life: 0.16, maxLife: 0.16 };
  } else {
    // High-Energy Plasma-Ruby Laser Beam
    const coreGeo = new THREE.CylinderGeometry(0.09, 0.09, len, 10, 1, true);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const outerGeo = new THREE.CylinderGeometry(0.28, 0.28, len, 12, 1, true);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xff1744,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    group.add(new THREE.Mesh(coreGeo, coreMat));
    group.add(new THREE.Mesh(outerGeo, outerMat));
    group.userData = { coreGeo, outerGeo, coreMat, outerMat, life: 0.15, maxLife: 0.15 };
  }

  return group;
}

let _snGeos = null;
function ensureSupernovaGeos() {
  if (_snGeos) return;
  _snGeos = {
    core: new THREE.SphereGeometry(1.8, 28, 22),
    shellInner: new THREE.SphereGeometry(1.0, 32, 24),
    shellOuter: new THREE.IcosahedronGeometry(1.0, 3),
    ringMain: new THREE.RingGeometry(0.78, 1.0, 64),
    ringTorus: new THREE.TorusGeometry(1.0, 0.045, 14, 64),
    grbCone: new THREE.ConeGeometry(0.26, 1.0, 20, 1, true),
    ejectaShard: new THREE.OctahedronGeometry(0.45, 0),
  };
}

/**
 * Create a 3D multi-stage Supernova Explosion (Vụ nổ Siêu Tân Tinh):
 * - Core collapse -> blinding hyper-flash -> spinning Pulsar remnant
 * - 3 relativistic expanding shockwave rings (cyan / magenta / solar gold)
 * - Expanding multi-layered plasma nebula shell
 * - Bipolar Gamma-Ray Burst (GRB) relativistic jets
 * - 36 high-velocity glowing stellar ejecta fragments
 */
export function createSupernovaMesh(scale = 1.0) {
  ensureSupernovaGeos();
  const G = _snGeos;
  const root = new THREE.Group();
  root.scale.setScalar(scale);

  const mats = [];
  const makeMat = (color, opacity = 1.0, wireframe = false) => {
    const m = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      wireframe,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    mats.push(m);
    return m;
  };

  // 1. Blinding Stellar Core / Neutron Pulsar
  const coreMat = makeMat(0xffffff, 1.0);
  const coreMesh = new THREE.Mesh(G.core, coreMat);
  root.add(coreMesh);

  // 2. Inner High-Energy Cyan-Blue Plasma Fireball
  const innerMat = makeMat(0x38bdf8, 0.92);
  const innerShell = new THREE.Mesh(G.shellInner, innerMat);
  root.add(innerShell);

  // 3. Outer Supernova Remnant Nebula (Magenta-Gold filamentary shell + solid glow)
  const outerMat = makeMat(0xf43f5e, 0.55);
  const outerShell = new THREE.Mesh(G.shellInner, outerMat);
  root.add(outerShell);

  const webMat = makeMat(0xfacc15, 0.65, true);
  const webShell = new THREE.Mesh(G.shellOuter, webMat);
  root.add(webShell);

  // 4. Three Relativistic Shockwave Rings
  const ring1Mat = makeMat(0x7dd3fc, 0.95);
  const ring1 = new THREE.Mesh(G.ringMain, ring1Mat);
  ring1.rotation.x = Math.PI / 2;
  root.add(ring1);

  const ring2Mat = makeMat(0xe879f9, 0.88);
  const ring2 = new THREE.Mesh(G.ringTorus, ring2Mat);
  ring2.rotation.set(Math.PI / 2 + 0.55, 0.35, 0);
  root.add(ring2);

  const ring3Mat = makeMat(0xfbbf24, 0.85);
  const ring3 = new THREE.Mesh(G.ringTorus, ring3Mat);
  ring3.rotation.set(Math.PI / 2 - 0.65, -0.45, 0.2);
  root.add(ring3);

  // 5. Bipolar Gamma-Ray Burst (GRB) Relativistic Jets
  const grbGroup = new THREE.Group();
  grbGroup.rotation.z = 0.22;
  grbGroup.rotation.x = -0.15;
  root.add(grbGroup);

  const grbMat = makeMat(0xa5f3fc, 0.85);
  const jetTop = new THREE.Mesh(G.grbCone, grbMat);
  jetTop.position.y = 0.5;
  jetTop.rotation.x = Math.PI;
  grbGroup.add(jetTop);

  const jetBot = new THREE.Mesh(G.grbCone, grbMat);
  jetBot.position.y = -0.5;
  grbGroup.add(jetBot);

  // 6. 36 Stellar Ejecta Shards flying outward
  const ejectaColors = [0x38bdf8, 0xf43f5e, 0xfacc15, 0xc084fc, 0xffffff];
  const ejectaMats = ejectaColors.map((c) => makeMat(c, 0.95));
  const ejecta = [];
  for (let i = 0; i < 36; i++) {
    const m = ejectaMats[i % ejectaMats.length];
    const shard = new THREE.Mesh(G.ejectaShard, m);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const dir = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi)
    );
    const speed = 18 + Math.random() * 48;
    shard.scale.setScalar(0.6 + Math.random() * 1.4);
    root.add(shard);
    ejecta.push({ mesh: shard, dir, speed, rotSpd: (Math.random() - 0.5) * 8 });
  }

  root.userData = {
    animate(age, maxLife) {
      const p = Math.min(1, Math.max(0, age / maxLife));
      // Rapid initial cataclysmic burst over the first ~6s, followed by sustained long-duration cosmic expansion (100x lifetime)
      const burstP = Math.min(1, Math.max(0, age / 6.0));
      const expP = 0.65 * Math.pow(burstP, 0.5) + 0.35 * Math.pow(p, 0.7);
      const pulse = 0.92 + 0.08 * Math.sin(age * 3.2);
      const fade = (p < 0.75
        ? 1.0 - p * 0.16
        : Math.pow(Math.max(0, (1 - p) / 0.25), 1.35) * 0.88) * pulse;

      // Core implosion in first 0.45s, then violent rebound & pulsar spin
      const coreScale = age < 0.45
        ? 2.8 - (age / 0.45) * 1.8
        : 1.2 + Math.sin(age * 28) * 0.25 + (1 - p) * 2.4;
      coreMesh.scale.setScalar(Math.max(0.4, coreScale));
      coreMat.opacity = Math.min(1, fade * 1.35);

      // Expanding inner plasma fireball & outer nebula shell
      const rInner = 1.5 + Math.pow(expP, 0.52) * 38;
      innerShell.scale.setScalar(rInner);
      innerMat.opacity = Math.max(0, fade * 0.78);

      const rOuter = 2.0 + Math.pow(expP, 0.6) * 58;
      outerShell.scale.setScalar(rOuter);
      outerMat.opacity = Math.max(0, fade * 0.48);

      webShell.scale.setScalar(rOuter * 1.06);
      webShell.rotation.y = age * 0.85;
      webShell.rotation.x = age * 0.52;
      webMat.opacity = Math.max(0, fade * 0.62);

      // Relativistic shockwave rings
      const rRing1 = 2.5 + Math.pow(expP, 0.48) * 92;
      ring1.scale.setScalar(rRing1);
      ring1.rotation.z = age * 1.6;
      ring1Mat.opacity = Math.max(0, fade * 0.92);

      const rRing2 = 2.0 + Math.pow(expP, 0.54) * 76;
      ring2.scale.setScalar(rRing2);
      ring2.rotation.z = -age * 1.2;
      ring2Mat.opacity = Math.max(0, fade * 0.85);

      const rRing3 = 1.8 + Math.pow(expP, 0.58) * 66;
      ring3.scale.setScalar(rRing3);
      ring3.rotation.z = age * 1.0;
      ring3Mat.opacity = Math.max(0, fade * 0.8);

      // Gamma-Ray Burst polar jets
      const jetLen = 4 + Math.pow(expP, 0.42) * 125;
      const jetRad = 2.5 + expP * 14;
      jetTop.scale.set(jetRad, jetLen, jetRad);
      jetTop.position.y = jetLen * 0.5;
      jetBot.scale.set(jetRad, jetLen, jetRad);
      jetBot.position.y = -jetLen * 0.5;
      grbGroup.rotation.y = age * 2.4;
      grbMat.opacity = Math.max(0, fade * 0.75);

      // Stellar ejecta shards
      const ejectaProgress = 3.85 * Math.pow(expP, 0.78);
      for (const ej of ejecta) {
        const dist = ej.speed * ejectaProgress;
        ej.mesh.position.copy(ej.dir).multiplyScalar(dist);
        ej.mesh.rotation.x += ej.rotSpd * 0.016;
        ej.mesh.rotation.y += ej.rotSpd * 0.022;
      }
      for (const em of ejectaMats) em.opacity = Math.max(0, fade * 0.95);
    },
    dispose() {
      for (const m of mats) m.dispose();
    },
  };

  return root;
}
