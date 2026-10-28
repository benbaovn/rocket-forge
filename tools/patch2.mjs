import fs from 'fs';
const f = 'src/launch/LaunchScene.js';
let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('missing: ' + a); s = s.replace(a, b); };
rep("import { RailOrbit, moonAngle, moonPos, moonVel, wrapPi, angOf, predict, bodyRotation, bodyState } from '../sim/orbit.js';",
    "import { RailOrbit, moonAngle, moonPos, moonVel, wrapPi, angOf, predict, bodyRotation, bodyState, coastStep, rk4, refBody, bodyInfo } from '../sim/orbit.js';");
rep("import { AscentProgram, BoosterRecovery, RendezvousProgram, MoonProgram, vesselElements } from '../sim/guidance.js';",
    "import { AscentProgram, BoosterRecovery, RendezvousProgram, MoonProgram, vesselElements, progradeBeta } from '../sim/guidance.js';");
rep("if (this.docked) this.checkDocking = this.checkDocking; else this.checkDocking();", "if (!this.docked) this.checkDocking();");
fs.writeFileSync(f, s);
console.log('ok', s.split('\n').length);
