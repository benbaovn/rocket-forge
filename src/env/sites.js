// Recovery sites: landing zone LZ-1, drone ship, and the commemorative flag.
import * as THREE from 'three';

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
const shadowed = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

export function createLandingZone() {
  const g = new THREE.Group();
  const tex = canvasTex(1024, 1024, (c, w) => {
    c.fillStyle = '#9a9890'; c.fillRect(0, 0, w, w);
    for (let i = 0; i < 4000; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? 0 : 255},${Math.random() < 0.5 ? 0 : 255},255,0.025)`; c.fillRect(Math.random() * w, Math.random() * w, 3, 3); }
    c.strokeStyle = '#f2f2ee'; c.lineWidth = 26; c.beginPath(); c.arc(w / 2, w / 2, w * 0.42, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 40; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(w * 0.3, w * 0.3); c.lineTo(w * 0.7, w * 0.7); c.moveTo(w * 0.7, w * 0.3); c.lineTo(w * 0.3, w * 0.7); c.stroke();
    c.fillStyle = '#f2f2ee'; c.font = '900 90px "Orbitron", "Tektur", sans-serif'; c.textAlign = 'center'; c.fillText('LZ-1', w / 2, w * 0.2);
  });
  const top = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(45, 47, 0.3, 96), [new THREE.MeshStandardMaterial({ color: 0x8c8a84, roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }), new THREE.MeshStandardMaterial({ color: 0x8c8a84 })]));
  top.position.y = 0.15; g.add(top);
  const lampM = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffb040, emissiveIntensity: 12 });
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), lampM); l.position.set(Math.cos(a) * 44, 0.4, Math.sin(a) * 44); g.add(l); }
  const mastM = new THREE.MeshStandardMaterial({ color: 0x8a8d93, metalness: 0.7, roughness: 0.4 });
  const headM = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xfff1d6, emissiveIntensity: 20 });
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + 0.78;
    const p = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 18, 8), mastM)); p.position.set(Math.cos(a) * 56, 9, Math.sin(a) * 56); g.add(p);
    const h = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1, 0.4), headM); h.position.set(Math.cos(a) * 56, 18, Math.sin(a) * 56); h.lookAt(0, 8, 0); g.add(h);
  }
  g.userData.surfaceY = 0.3;
  return g;
}

export function createDroneShip() {
  const g = new THREE.Group();
  const deckTex = canvasTex(1024, 570, (c, w, h) => {
    c.fillStyle = '#2b2d31'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; c.fillRect(Math.random() * w, Math.random() * h, 4, 2); }
    c.strokeStyle = '#eeeeea'; c.lineWidth = 12; c.beginPath(); c.arc(w / 2, h / 2, h * 0.36, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 22; c.beginPath(); c.moveTo(w / 2 - 90, h / 2 - 90); c.lineTo(w / 2 + 90, h / 2 + 90); c.moveTo(w / 2 + 90, h / 2 - 90); c.lineTo(w / 2 - 90, h / 2 + 90); c.stroke();
    c.fillStyle = '#eeeeea'; c.font = '900 32px "Orbitron", "Tektur", sans-serif'; c.textAlign = 'center'; c.fillText('Dĩ nhiên tôi vẫn yêu bạn', w * 0.22, h * 0.9);
  });
  const hullM = new THREE.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.7, metalness: 0.4 });
  const hull = shadowed(new THREE.Mesh(new THREE.BoxGeometry(91, 9, 52), [hullM, hullM, new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.8 }), hullM, hullM, hullM]));
  hull.position.y = -1.5; g.add(hull);
  const yellow = new THREE.MeshStandardMaterial({ color: 0xe0b421, roughness: 0.6, metalness: 0.3 });
  for (const s of [-1, 1]) { const w = shadowed(new THREE.Mesh(new THREE.BoxGeometry(2, 9, 52), yellow)); w.position.set(s * 44.5, 7.5, 0); g.add(w); }
  const mastM = new THREE.MeshStandardMaterial({ color: 0xcfcfcf, metalness: 0.6, roughness: 0.4 });
  const lamp = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff2010, emissiveIntensity: 15 });
  const lampY = [];
  for (const [x, z] of [[-40, 24], [40, -24], [40, 24], [-40, -24]]) {
    const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(5, 4, 5), new THREE.MeshStandardMaterial({ color: 0x55585e, roughness: 0.6 }))); m.position.set(x, 5, z); g.add(m);
    const p = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 9, 6), mastM)); p.position.set(x, 11, z); g.add(p);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), lamp); l.position.set(x, 15.7, z); g.add(l); lampY.push(l);
  }
  g.userData.deckY = 3.0; g.userData.halfLength = 45; g.userData.halfWidth = 25;
  g.userData.update = (t) => { for (const l of lampY) l.material.emissiveIntensity = Math.sin(t * 3) > 0.5 ? 15 : 1; };
  return g;
}

export function createFlag() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2, 8), new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.8, roughness: 0.3 }));
  pole.position.y = 1; pole.castShadow = true; g.add(pole);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.2, 6).rotateZ(Math.PI / 2), pole.material);
  rod.position.set(0.6, 1.95, 0); g.add(rod);
  const tex = canvasTex(300, 200, (c, w, h) => {
    c.fillStyle = '#da251d'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffff00'; c.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 26 : 62, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); }
    c.closePath(); c.fill();
  });
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.73, 12, 1), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 }));
  cloth.position.set(0.6, 1.55, 0); cloth.castShadow = true; g.add(cloth);
  const base = cloth.geometry.attributes.position.array.slice();
  g.userData.update = () => { const p = cloth.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(base[i * 3] * 5) * 0.03); p.needsUpdate = true; };
  g.userData.update();
  return g;
}
