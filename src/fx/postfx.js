// Final cinematic pass: heat haze, chromatic aberration, vignette, film grain
import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uHazePos: { value: new THREE.Vector2(0.5, 0.3) },
    uHazeDir: { value: new THREE.Vector2(0, -1) },
    uHaze: { value: 0 },
    uHazeRadius: { value: 0.1 },
    uAberration: { value: 0.004 },
    uVignette: { value: 0.35 },
    uGrain: { value: 0.03 },
    uFlash: { value: 0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime, uAspect, uHaze, uHazeRadius, uAberration, uVignette, uGrain, uFlash;
    uniform vec2 uHazePos, uHazeDir;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      if (uHaze > 0.001) {
        // capsule-shaped region trailing from the nozzle along exhaust direction
        vec2 d = uv - uHazePos; d.x *= uAspect;
        vec2 dir = normalize(uHazeDir * vec2(uAspect, 1.0));
        float along = dot(d, dir);
        float across = length(d - dir * along);
        float m = smoothstep(uHazeRadius, 0.0, across) * smoothstep(-uHazeRadius * 0.3, uHazeRadius * 0.5, along) * smoothstep(uHazeRadius * 7.0, uHazeRadius, along);
        float n = sin(uv.y * 160.0 + uTime * 31.0) * 0.6 + sin(uv.x * 110.0 - uTime * 23.0 + uv.y * 50.0) * 0.4;
        float n2 = sin(uv.x * 230.0 + uTime * 41.0 + uv.y * 90.0);
        uv += vec2(n, n2) * 0.0035 * uHaze * m;
      }
      vec2 c = uv - 0.5;
      float r2 = dot(c, c);
      vec3 col;
      col.r = texture2D(tDiffuse, uv - c * uAberration * r2 * 4.0).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv + c * uAberration * r2 * 4.0).b;
      vec2 vc = c * vec2(uAspect, 1.0) / max(uAspect, 1.0);
      float vig = smoothstep(0.85, 0.2, length(vc) * 1.1);
      col *= mix(1.0, vig, uVignette);
      col += (hash(vUv * 1000.0 + fract(uTime) * 100.0) - 0.5) * uGrain;
      col += uFlash * vec3(1.0, 0.85, 0.6);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function createFinalPass() {
  return new ShaderPass(FinalShader);
}

/** Soft-clamps extreme HDR values (keeps hue) so bloom stays smooth */
export function createClampPass(maxLum = 24.0) {
  return new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uMax: { value: maxLum } },
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tDiffuse; uniform float uMax; varying vec2 vUv;
      void main() {
        vec4 c = texture2D(tDiffuse, vUv);
        float l = max(max(c.r, c.g), c.b);
        if (l > uMax * 0.5) { float k = uMax * 0.5 + (uMax * 0.5) * (1.0 - exp(-(l - uMax * 0.5) / (uMax * 0.5))); c.rgb *= k / l; }
        gl_FragColor = vec4(max(c.rgb, 0.0), 1.0);
      }`,
  });
}
