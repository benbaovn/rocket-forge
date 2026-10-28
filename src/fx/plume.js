// Rocket exhaust plume: layered additive shader cones with shock diamonds & vacuum expansion
import * as THREE from 'three';

const plumeVert = /* glsl */`
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;
uniform float uExpand;
uniform float uLen;
uniform float uStyle;
void main() {
  vUv = uv;
  vec3 p = position;
  // p.y in [-1, 0] (0 at nozzle). widen with distance & vacuum expansion
  float t = -p.y;
  float w = 1.0 + t * (0.25 + uExpand * 5.0) * (1.0 + uExpand) + pow(t, 2.0) * uExpand * 2.0;
  if (uStyle > 1.5) {
    // Laser beam: stays tightly collimated with minimal divergence
    w = 0.88 + t * (0.06 + uExpand * 0.12);
  } else if (uStyle > 0.5) {
    // Anti-gravity beam: smooth cylindrical-harmonic graviton column
    w = 1.0 + t * (0.35 + uExpand * 0.9) + 0.12 * sin(t * 22.0);
  }
  p.xz *= w;
  p.y *= uLen;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const plumeFrag = /* glsl */`
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;
uniform float uTime;
uniform float uThrottle;
uniform float uExpand;
uniform float uCore;
uniform vec3 uColA;
uniform vec3 uColB;
uniform float uSeed;
uniform float uStyle;
float h1(float n) { return fract(sin(n) * 43758.5453); }
float n1(float x) { float i = floor(x); float f = fract(x); return mix(h1(i), h1(i + 1.0), f * f * (3.0 - 2.0 * f)); }
void main() {
  float t = 1.0 - vUv.y;                 // 0 at nozzle, 1 at tail
  float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.0 + uCore * 2.5);
  float flick = 0.85 + 0.3 * n1(uTime * 30.0 + uSeed * 10.0 + t * 6.0);
  float fall = exp(-t * mix(3.2, 1.6, uExpand)) * smoothstep(1.0, 0.6, t);
  if (uStyle > 1.5) {
    // Laser: long coherent beam with rapid photon pulse nodes
    fall = exp(-t * 1.15) * smoothstep(1.0, 0.78, t);
    float pulse = 0.75 + 0.25 * sin(t * 65.0 - uTime * 55.0);
    float I = fall * pulse * edge * (0.92 + 0.08 * flick);
    vec3 col = mix(uColA, uColB, smoothstep(0.0, 0.85, t + (1.0 - edge) * 0.3));
    float a = I * uThrottle;
    gl_FragColor = vec4(col * a, 1.0);
    return;
  }
  if (uStyle > 0.5) {
    // Anti-gravity: standing graviton wave rings + cyan/violet phase shift
    fall = exp(-t * 1.8) * smoothstep(1.0, 0.65, t);
    float rings = pow(max(0.0, sin(t * 28.0 - uTime * 18.0)), 4.0) * exp(-t * 1.6);
    float I = (fall * 0.75 + rings * 1.65) * edge * (0.9 + 0.1 * flick);
    vec3 col = mix(uColA, uColB, smoothstep(0.0, 0.75, t + 0.25 * sin(uTime * 8.0 + t * 12.0)));
    float a = I * uThrottle;
    gl_FragColor = vec4(col * a, 1.0);
    return;
  }
  // shock diamonds (fade in vacuum)
  float diamonds = 0.0;
  float sl = 1.0 - uExpand;
  diamonds = pow(max(0.0, sin(t * 34.0 - uTime * 0.0)), 6.0) * exp(-t * 3.0) * sl;
  float turb = n1(t * 18.0 - uTime * 40.0 + vUv.x * 20.0 + uSeed * 3.0);
  float I = (fall * (0.7 + 0.3 * turb) + diamonds * 1.8 * uCore) * edge * flick;
  vec3 col = mix(uColA, uColB, smoothstep(0.0, 0.7, t + (1.0 - edge) * 0.4));
  // vacuum: fainter, bluish-white wide plume
  col = mix(col, vec3(0.6, 0.75, 1.3), uExpand * 0.55 * (1.0 - uCore));
  float a = I * uThrottle * mix(1.0, 0.45, uExpand);
  gl_FragColor = vec4(col * a, 1.0);
}`;

export function createPlume(radius, length = 1, seed = Math.random(), style = 'default') {
  const group = new THREE.Group();
  const isAntiGrav = style === 'antigrav';
  if (isAntiGrav) {
    // Anti-gravity engine emits nothing at all
    group.visible = false;
    return {
      group,
      update() {
        group.visible = false;
      },
    };
  }
  const isLaser = style === 'laser';
  const styleCode = isLaser ? 2.0 : 0.0;
  const layers = isLaser
    ? [
        { r: 0.42, len: 1.45, core: 1.2, a: new THREE.Color(12.0, 4.5, 6.2), b: new THREE.Color(9.5, 0.8, 2.6) },
        { r: 0.72, len: 2.10, core: 0.6, a: new THREE.Color(8.5, 0.3, 1.8), b: new THREE.Color(4.8, 0.08, 1.1) },
        { r: 1.05, len: 2.50, core: 0.1, a: new THREE.Color(3.2, 0.08, 0.65), b: new THREE.Color(0.8, 0.02, 0.22) },
      ]
    : [
        { r: 0.92, len: 0.55, core: 1.0, a: new THREE.Color(9, 8.2, 7.0), b: new THREE.Color(6, 2.8, 0.8) },
        { r: 1.0, len: 1.0, core: 0.5, a: new THREE.Color(6, 3.6, 1.4), b: new THREE.Color(2.5, 0.8, 0.15) },
        { r: 1.25, len: 1.7, core: 0.0, a: new THREE.Color(2.2, 1.0, 0.35), b: new THREE.Color(0.6, 0.15, 0.03) },
      ];
  const mats = [];
  for (const L of layers) {
    const geo = new THREE.CylinderGeometry(L.r * radius, L.r * radius * (isLaser ? 0.98 : 0.92), 1, 40, 24, true);
    geo.translate(0, -0.5, 0);
    const mat = new THREE.ShaderMaterial({
      vertexShader: plumeVert,
      fragmentShader: plumeFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 }, uThrottle: { value: 0 }, uExpand: { value: 0 },
        uCore: { value: L.core }, uColA: { value: L.a }, uColB: { value: L.b },
        uLen: { value: L.len * length * radius * 18 }, uSeed: { value: seed },
        uBaseLen: { value: L.len * length * radius * 18 },
        uStyle: { value: styleCode },
      },
    });
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.renderOrder = 7;
    group.add(m);
    mats.push(mat);
  }
  group.userData.mats = mats;
  group.visible = false;
  return {
    group,
    update(time, throttle, expand) {
      group.visible = throttle > 0.01;
      for (const m of mats) {
        m.uniforms.uTime.value = time;
        m.uniforms.uThrottle.value = throttle;
        m.uniforms.uExpand.value = expand;
        const expScale = isLaser ? (1 + expand * 0.35) : (1 + expand * 2.5);
        m.uniforms.uLen.value = m.uniforms.uBaseLen.value * (0.55 + 0.45 * throttle) * expScale;
      }
    },
  };
}
