import fs from 'fs';
const f = 'src/launch/LaunchScene.js';
let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('missing: ' + a); s = s.replace(a, b); };
rep("uniforms: { uTime: { value: 0 }, uSunCol:", "uniforms: { uOff: { value: this.groundUniforms.uOff.value }, uBend: { value: BEND }, uTime: { value: 0 }, uSunCol:");
rep("void main() { vP = position.xy; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
  "uniform vec2 uOff; uniform float uBend; varying vec2 vL;\n        void main() { vP = position.xy + uOff; vL = position.xy; vec4 w = modelMatrix * vec4(position, 1.0); w.y -= dot(w.xz, w.xz) * uBend; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }");
rep("varying vec2 vP; varying vec3 vW;\n        void main() {\n          vec2 p", "varying vec2 vP; varying vec3 vW; varying vec2 vL;\n        void main() {\n          vec2 p");
rep("length(vP)));", "length(vL)));");
rep("new THREE.PlaneGeometry(80000, 80000, 1, 1)", "new THREE.PlaneGeometry(80000, 80000, 80, 80)");
rep("new THREE.CircleGeometry(42000, 256)", "new THREE.RingGeometry(0.01, 42000, 160, 140)");
fs.writeFileSync(f, s);
console.log('ok');
