// GPU-instanced billboard particle systems (lit smoke + additive fire)
import * as THREE from 'three';

const VERT = /* glsl */`
attribute vec3 iPos;
attribute vec4 iData;   // size, rotation, alpha, heat
attribute vec3 iColor;
varying vec2 vUv;
varying vec4 vData;
varying vec3 vColor;
varying float vFog;
uniform float uFogDensity;
void main() {
  vUv = uv;
  vData = iData;
  vColor = iColor;
  vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
  float c = cos(iData.y), s = sin(iData.y);
  vec2 q = position.xy;
  q = vec2(c * q.x - s * q.y, s * q.x + c * q.y) * iData.x;
  mv.xy += q;
  float d = length(mv.xyz);
  vFog = 1.0 - exp(-uFogDensity * uFogDensity * d * d);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG_SMOKE = /* glsl */`
uniform sampler2D uTex;
uniform vec3 uSunColor;
uniform vec3 uAmbient;
uniform vec3 uFogColor;
uniform vec3 uGlow;
varying vec2 vUv; varying vec4 vData; varying vec3 vColor; varying float vFog;
void main() {
  vec4 t = texture2D(uTex, vUv);
  float mask = smoothstep(0.5, 0.3, length(vUv - 0.5));
  float a = t.a * vData.z * mask;
  if (a < 0.003) discard;
  vec3 lit = vColor * (uAmbient + uSunColor * (0.35 + 0.65 * t.r));
  vec3 glow = uGlow * vData.w * (0.6 + 0.4 * t.r);
  vec3 col = lit + glow;
  col = mix(col, uFogColor, vFog);
  gl_FragColor = vec4(col * a, a); // premultiplied
}`;

const FRAG_FIRE = /* glsl */`
uniform sampler2D uTex;
varying vec2 vUv; varying vec4 vData; varying vec3 vColor; varying float vFog;
void main() {
  vec4 t = texture2D(uTex, vUv);
  float mask = smoothstep(0.5, 0.25, length(vUv - 0.5));
  float a = t.a * vData.z * mask;
  gl_FragColor = vec4(vColor * a * (1.0 - vFog * 0.7), 1.0);
}`;

export class ParticleSystem {
  constructor({ max = 4000, texture, additive = false, sort = false }) {
    this.max = max;
    this.count = 0;
    this.sort = sort;
    this.additive = additive;
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.attributes.position);
    g.setAttribute('uv', base.attributes.uv);
    this.aPos = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aData = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('iPos', this.aPos);
    g.setAttribute('iData', this.aData);
    g.setAttribute('iColor', this.aColor);
    g.instanceCount = 0;
    this.geometry = g;
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: additive ? FRAG_FIRE : FRAG_SMOKE,
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      uniforms: {
        uTex: { value: texture },
        uSunColor: { value: new THREE.Color(1, 0.9, 0.8) },
        uAmbient: { value: new THREE.Color(0.3, 0.35, 0.45) },
        uFogColor: { value: new THREE.Color(0.6, 0.65, 0.7) },
        uFogDensity: { value: 0.0 },
        uGlow: { value: new THREE.Color(4.0, 1.6, 0.5) },
      },
    });
    this.mesh = new THREE.Mesh(g, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = additive ? 6 : 5;
    // CPU state (SoA)
    this.p = new Float32Array(max * 3);
    this.v = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.size0 = new Float32Array(max);
    this.size1 = new Float32Array(max);
    this.rot = new Float32Array(max);
    this.rotV = new Float32Array(max);
    this.alpha = new Float32Array(max);
    this.heat = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.buoy = new Float32Array(max);
    this.col = new Float32Array(max * 3);
    this.order = new Uint32Array(max);
    this.dist = new Float32Array(max);
  }

  emit(px, py, pz, vx, vy, vz, o = {}) {
    let i = this.count;
    if (i >= this.max) {
      // recycle oldest-ish random slot
      i = (Math.random() * this.max) | 0;
    } else this.count++;
    this.p[i * 3] = px; this.p[i * 3 + 1] = py; this.p[i * 3 + 2] = pz;
    this.v[i * 3] = vx; this.v[i * 3 + 1] = vy; this.v[i * 3 + 2] = vz;
    this.life[i] = 0;
    this.maxLife[i] = o.life ?? 4;
    this.size0[i] = o.size0 ?? 2;
    this.size1[i] = o.size1 ?? 10;
    this.rot[i] = Math.random() * 6.283;
    this.rotV[i] = (Math.random() - 0.5) * (o.spin ?? 0.6);
    this.alpha[i] = o.alpha ?? 0.8;
    this.heat[i] = o.heat ?? 0;
    this.drag[i] = o.drag ?? 0.5;
    this.buoy[i] = o.buoy ?? 0.5;
    const c = o.color ?? [0.85, 0.84, 0.82];
    this.col[i * 3] = c[0]; this.col[i * 3 + 1] = c[1]; this.col[i * 3 + 2] = c[2];
  }

  update(dt, camPosLocal, groundY = -Infinity) {
    const { p, v, life, maxLife } = this;
    let n = this.count;
    for (let i = 0; i < n; i++) {
      life[i] += dt;
      if (life[i] >= maxLife[i]) {
        // swap-remove
        n--;
        this.copy(n, i);
        i--;
        continue;
      }
      const d = Math.exp(-this.drag[i] * dt);
      v[i * 3] *= d; v[i * 3 + 1] = v[i * 3 + 1] * d + this.buoy[i] * dt; v[i * 3 + 2] *= d;
      p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
      if (p[i * 3 + 1] < groundY + this.size0[i] * 0.3) { p[i * 3 + 1] = groundY + this.size0[i] * 0.3; if (v[i * 3 + 1] < 0) v[i * 3 + 1] *= -0.2; }
      this.rot[i] += this.rotV[i] * dt;
    }
    this.count = n;
    // order
    const ord = this.order;
    for (let i = 0; i < n; i++) ord[i] = i;
    if (this.sort && camPosLocal) {
      const ds = this.dist;
      for (let i = 0; i < n; i++) {
        const dx = p[i * 3] - camPosLocal.x, dy = p[i * 3 + 1] - camPosLocal.y, dz = p[i * 3 + 2] - camPosLocal.z;
        ds[i] = dx * dx + dy * dy + dz * dz;
      }
      const sub = ord.subarray(0, n);
      sub.sort((a, b) => ds[b] - ds[a]);
    }
    const P = this.aPos.array, D = this.aData.array, C = this.aColor.array;
    for (let k = 0; k < n; k++) {
      const i = ord[k];
      const t = life[i] / maxLife[i];
      const size = this.size0[i] + (this.size1[i] - this.size0[i]) * (1 - Math.pow(1 - t, 2.2));
      const fadeIn = Math.min(1, t * 12);
      const fadeOut = 1 - t * t;
      P[k * 3] = p[i * 3]; P[k * 3 + 1] = p[i * 3 + 1]; P[k * 3 + 2] = p[i * 3 + 2];
      D[k * 4] = size; D[k * 4 + 1] = this.rot[i]; D[k * 4 + 2] = this.alpha[i] * fadeIn * fadeOut;
      D[k * 4 + 3] = this.heat[i] * Math.exp(-life[i] * 2.5);
      if (this.additive) {
        const h = Math.max(0, 1 - t);
        C[k * 3] = this.col[i * 3] * h; C[k * 3 + 1] = this.col[i * 3 + 1] * h * h; C[k * 3 + 2] = this.col[i * 3 + 2] * h * h * h;
      } else {
        C[k * 3] = this.col[i * 3]; C[k * 3 + 1] = this.col[i * 3 + 1]; C[k * 3 + 2] = this.col[i * 3 + 2];
      }
    }
    this.geometry.instanceCount = n;
    this.aPos.needsUpdate = true; this.aData.needsUpdate = true; this.aColor.needsUpdate = true;
    this.aPos.addUpdateRange(0, n * 3); this.aData.addUpdateRange(0, n * 4); this.aColor.addUpdateRange(0, n * 3);
  }

  copy(from, to) {
    // no temporary arrays here: this runs thousands of times per second and used to churn the GC
    const p = this.p, v = this.v, c = this.col;
    const f3 = from * 3, t3 = to * 3;
    p[t3] = p[f3]; p[t3 + 1] = p[f3 + 1]; p[t3 + 2] = p[f3 + 2];
    v[t3] = v[f3]; v[t3 + 1] = v[f3 + 1]; v[t3 + 2] = v[f3 + 2];
    c[t3] = c[f3]; c[t3 + 1] = c[f3 + 1]; c[t3 + 2] = c[f3 + 2];
    this.life[to] = this.life[from]; this.maxLife[to] = this.maxLife[from];
    this.size0[to] = this.size0[from]; this.size1[to] = this.size1[from];
    this.rot[to] = this.rot[from]; this.rotV[to] = this.rotV[from];
    this.alpha[to] = this.alpha[from]; this.heat[to] = this.heat[from];
    this.drag[to] = this.drag[from]; this.buoy[to] = this.buoy[from];
  }

  clear() { this.count = 0; this.geometry.instanceCount = 0; }
}
