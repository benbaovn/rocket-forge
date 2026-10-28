// Procedural International Space Station (real-scale metres).
// Frame: +X = flight direction, +Y = radial up, +Z = orbit normal (truss axis).
// group.userData.port = docking interface centre (port axis points along -X).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function solarTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#0b1a3e'; g.fillRect(0, 0, 256, 512);
  for (let y = 0; y < 512; y += 16) for (let x = 0; x < 256; x += 16) {
    const s = 0.8 + 0.2 * Math.sin(x * 0.3 + y * 0.17);
    g.fillStyle = `rgb(${14 * s | 0},${34 * s | 0},${86 * s | 0})`; g.fillRect(x + 1, y + 1, 14, 14);
  }
  g.strokeStyle = 'rgba(190,150,70,0.55)'; g.lineWidth = 1;
  for (let x = 0; x <= 256; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
  for (let y = 0; y <= 512; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function createISS() {
  const group = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xe6e3da, roughness: 0.55, metalness: 0.35 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9923a, roughness: 0.35, metalness: 0.9 });
  const grey = new THREE.MeshStandardMaterial({ color: 0x8a8d93, roughness: 0.45, metalness: 0.8 });
  const rad = new THREE.MeshStandardMaterial({ color: 0xf4f4f2, roughness: 0.6, metalness: 0.1 });
  const panelMat = new THREE.MeshStandardMaterial({ map: solarTexture(), roughness: 0.28, metalness: 0.6, side: THREE.DoubleSide });
  const lampG = new THREE.MeshStandardMaterial({ color: 0, emissive: 0x39ff88, emissiveIntensity: 14 });
  const lampR = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff2a1a, emissiveIntensity: 14 });
  const lampW = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffffff, emissiveIntensity: 10 });
  const add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent = group) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  // pressurised stack along X (rear end at x = -12)
  const cyl = (r, len) => new THREE.CylinderGeometry(r, r, len, 28).rotateZ(Math.PI / 2);
  add(cyl(2.15, 9), white, 0.5, 0, 0);                 // Zvezda/Zarya core
  add(cyl(2.3, 8), white, 9, 0, 0);
  add(cyl(2.3, 7), white, 16.5, 0, 0);
  add(cyl(2.3, 7), white, 23.5, 0, 0);
  add(cyl(1.5, 4), white, 5, 0, 5.5, Math.PI / 2 * 0, 0, 0);
  add(new THREE.CylinderGeometry(1.8, 1.8, 7, 24).rotateX(Math.PI / 2), white, 9, 0, 5.4);
  add(new THREE.CylinderGeometry(1.8, 1.8, 7, 24).rotateX(Math.PI / 2), white, 9, 0, -5.4);
  add(new THREE.SphereGeometry(1.9, 24, 16), white, 5, 0, 0);
  // rear docking adapter, facing -X
  add(cyl(1.3, 3), grey, -5.3, 0, 0);
  add(new THREE.TorusGeometry(1.15, 0.14, 12, 40).rotateY(Math.PI / 2), grey, -7, 0, 0);
  add(new THREE.TorusGeometry(0.9, 0.08, 10, 32).rotateY(Math.PI / 2), gold, -7.25, 0, 0);
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3 + Math.PI / 2;
    add(new THREE.BoxGeometry(0.5, 0.05, 0.2), grey, -7.35, Math.cos(a) * 1.0, Math.sin(a) * 1.0, a, 0, 0);
    add(new THREE.SphereGeometry(0.07, 8, 6), lampW, -7.45, Math.cos(a + 0.5) * 1.1, Math.sin(a + 0.5) * 1.1);
  }
  const port = new THREE.Object3D(); port.position.set(-7.4, 0, 0); port.name = 'issPort';
  group.add(port);
  // integrated truss along Z
  const trussGeos = [];
  const bar = (x, y, z, sx, sy, sz) => { const g = new THREE.BoxGeometry(sx, sy, sz); g.translate(x, y, z); trussGeos.push(g); };
  for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bar(x * 1.0, y * 1.0 + 3.2, 0, 0.14, 0.14, 109);
  for (let z = -54; z <= 54; z += 2.7) {
    bar(0, 3.2, z, 2.1, 0.1, 0.1); bar(0, 3.2 + 1, z, 0.1, 0.1, 0.1); bar(0, 2.2, z, 2.1, 0.08, 0.08);
    bar(0, 3.2, z, 0.08, 2.1, 0.08);
  }
  add(mergeGeometries(trussGeos), grey);
  add(new THREE.BoxGeometry(2.4, 2.4, 2.4), white, 0, 3.2, 0);
  add(new THREE.BoxGeometry(1.2, 3.2, 1.2), grey, 0, 1.6, 0);
  // solar array wings (8) – rotate about the truss axis
  const wings = [];
  for (const z of [-48, -36, 36, 48]) {
    const w = new THREE.Group(); w.position.set(0, 3.2, z);
    for (const s of [1, -1]) {
      add(new THREE.PlaneGeometry(11.5, 34), panelMat, 0, s * 18.5, 0, 0, 0, 0, w);
      add(new THREE.BoxGeometry(0.25, 36, 0.25), gold, 5.8, s * 18.5, 0, 0, 0, 0, w);
      add(new THREE.BoxGeometry(0.25, 36, 0.25), gold, -5.8, s * 18.5, 0, 0, 0, 0, w);
    }
    add(new THREE.CylinderGeometry(0.5, 0.5, 2, 12), gold, 0, 0, 0, 0, 0, 0, w);
    group.add(w); wings.push(w);
  }
  // radiators
  for (const z of [-14, 14]) for (const y of [-1, 1]) add(new THREE.BoxGeometry(3.5, 0.06, 12), rad, 0, 3.2 + y * 5.5, z * 1.0);
  // handrails / antennas / blinking lights
  add(new THREE.CylinderGeometry(0.05, 0.05, 4, 6), grey, 24, 3, 0);
  add(new THREE.SphereGeometry(0.9, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), white, 14, 2.4, 0);
  const lights = [
    add(new THREE.SphereGeometry(0.18, 8, 6), lampG, 0, 3.2, 54.5),
    add(new THREE.SphereGeometry(0.18, 8, 6), lampR, 0, 3.2, -54.5),
    add(new THREE.SphereGeometry(0.18, 8, 6), lampW, 27, 0, 0),
  ];
  group.userData.port = port;
  group.userData.update = (t) => {
    const on = Math.sin(t * 2.4) > 0.55;
    lights[0].material.emissiveIntensity = on ? 16 : 0.5;
    lights[1].material.emissiveIntensity = on ? 0.5 : 16;
    lights[2].material.emissiveIntensity = Math.sin(t * 5) > 0.8 ? 14 : 0.5;
    for (const w of wings) w.rotation.z = t * 0.01;
  };
  return group;
}
