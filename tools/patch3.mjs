import fs from 'fs';
let f = 'src/main.js';
let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('missing: ' + a); s = s.replace(a, b); };
rep("import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';",
    "import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';\nimport { Pass } from 'three/addons/postprocessing/Pass.js';");
rep("const QUALITY = {", `/** lets a scene render itself (dual-layer far/near passes, picture-in-picture) into the HDR target */
class ScenePass extends Pass {
  constructor(app) { super(); this.app = app; this.needsSwap = false; }
  render(renderer, writeBuffer, readBuffer) {
    const sc = this.app.current;
    if (sc && sc.render) sc.render(renderer, this.renderToScreen ? null : readBuffer);
  }
}

const QUALITY = {`);
rep("    this.composer.addPass(this.renderPass);\n", "    this.composer.addPass(this.renderPass);\n    this.scenePass = new ScenePass(this);\n    this.scenePass.enabled = false;\n    this.composer.addPass(this.scenePass);\n");
rep("    this.renderPass.scene = sc.scene;", "    this.renderPass.enabled = !sc.render;\n    this.scenePass.enabled = !!sc.render;\n    this.renderPass.scene = sc.scene;");
rep("  goLaunch(stack) {\n    $('menu').classList.add('hidden');\n    this.launchStack = stack;\n    this.launch.setup(stack);",
    "  goLaunch(stack, missionId) {\n    $('menu').classList.add('hidden');\n    if (missionId) this.missionId = missionId;\n    this.launchStack = stack;\n    this.launch.setup(stack, this.missionId || 'free');");
rep("      this.goLaunch(this.build.stack.map((s) => ({ ...s, attach: [...s.attach] })));",
    "      if (qs.get('mission')) this.build.setMission && this.build.setMission(qs.get('mission'), true);\n      this.goLaunch(this.build.stack.map((s) => ({ ...s, attach: [...s.attach] })), qs.get('mission') || undefined);\n      if (qs.get('ap')) this.launch.pendingAP = true;");
rep("      if (qs.get('go')) this.launch.startCountdown();", "      if (qs.get('go')) this.launch.startCountdown();\n      if (qs.get('ap')) this.launch.toggleAutopilot();\n      if (qs.get('warp')) { this.launch.userWarp = +qs.get('warp'); }");
fs.writeFileSync(f, s);
console.log('main ok');
