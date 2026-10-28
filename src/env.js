// Shared environment props (lattice towers, light cones)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function beam(a, b, t) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const g = new THREE.BoxGeometry(t, len, t);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  m.compose(A.clone().add(B).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
  g.applyMatrix4(m);
  g.deleteAttribute('uv');
  return g;
}

/** Square lattice tower, base centered at origin */
export function latticeTower(height, width, material, { step = 3, t = 0.22, brace = 0.1 } = {}) {
  const geos = [];
  const w = width / 2;
  const corners = [[-w, -w], [w, -w], [w, w], [-w, w]];
  for (const [x, z] of corners) geos.push(beam([x, 0, z], [x, height, z], t));
  for (let y = 0; y < height - 0.01; y += step) {
    const y2 = Math.min(height, y + step);
    for (let i = 0; i < 4; i++) {
      const [x1, z1] = corners[i], [x2, z2] = corners[(i + 1) % 4];
      geos.push(beam([x1, y2, z1], [x2, y2, z2], t * 0.8));
      if ((Math.floor(y / step) + i) % 2) geos.push(beam([x1, y, z1], [x2, y2, z2], brace));
      else geos.push(beam([x2, y, z2], [x1, y2, z1], brace));
    }
  }
  const mesh = new THREE.Mesh(mergeGeometries(geos), material);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

/** Volumetric-looking additive light cone (fake god-ray) */
export function lightCone(length, radius, color = new THREE.Color(1, 0.95, 0.85), strength = 0.12) {
  const geo = new THREE.ConeGeometry(radius, length, 48, 1, true);
  geo.translate(0, -length / 2, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: color }, uStrength: { value: strength }, uLen: { value: length }, uTime: { value: 0 } },
    vertexShader: /* glsl */`
      varying float vT; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      uniform float uLen;
      void main() {
        vT = -position.y / uLen;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        vW = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying float vT; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      uniform vec3 uColor; uniform float uStrength; uniform float uTime;
      void main() {
        float edge = pow(abs(dot(vN, vV)), 2.0);
        float fall = (1.0 - vT) * smoothstep(0.0, 0.08, vT);
        float dust = 0.85 + 0.15 * sin(vW.x * 0.7 + vW.y * 0.5 + uTime * 0.3) * sin(vW.z * 0.6 - uTime * 0.2);
        gl_FragColor = vec4(uColor * edge * fall * uStrength * dust, 1.0);
      }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 8;
  return m;
}
