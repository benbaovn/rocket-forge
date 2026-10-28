import fs from 'fs';
let f = 'src/build/BuildScene.js';
let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('missing: ' + a); s = s.replace(a, b); };
rep("import { buildRocket,", "import { MISSIONS, missionById } from '../missions.js';\nimport { buildRocket,");
rep("    $('btn-launchpad').onclick = () => { audio.init(); this.app.goLaunch(cloneStack(this.stack)); };",
`    $('btn-launchpad').onclick = () => { audio.init(); this.app.goLaunch(cloneStack(this.stack), this.missionId); };
    // mission picker
    this.missionId = 'free';
    const cards = $('mission-cards');
    cards.innerHTML = MISSIONS.map((m) => \`<div class="mission-card" data-id="\${m.id}"><div class="mc-ico">\${m.icon}</div><div><div class="mc-name">\${m.name}</div><div class="mc-desc">\${m.desc}</div>\${m.objectives.length ? '<ul>' + m.objectives.map((o) => '<li>' + o.text + '</li>').join('') + '</ul>' : ''}</div></div>\`).join('');
    cards.querySelectorAll('.mission-card').forEach((el) => el.addEventListener('click', () => { this.setMission(el.dataset.id, true); $('mission-modal').classList.add('hidden'); audio.click(); }));
    $('btn-mission').onclick = () => $('mission-modal').classList.remove('hidden');
    $('btn-mission-close').onclick = () => $('mission-modal').classList.add('hidden');`);
rep("  startDrag(", `  /** choose a mission; optionally load its recommended rocket */
  setMission(id, loadPreset = false) {
    const m = missionById(id);
    this.missionId = m.id;
    this.app.missionId = m.id;
    const nm = document.getElementById('mission-name');
    if (nm) nm.textContent = m.name;
    if (loadPreset && m.preset && PRESETS[m.preset]) {
      this.pushHistory();
      this.stack = stackFromTypes(PRESETS[m.preset]);
      this.select(null);
      this.rebuild(true);
    }
  }

  startDrag(`);
fs.writeFileSync(f, s);
console.log('build ok');
