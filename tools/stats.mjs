// node tools/stats.mjs "<preset name or comma list>" : per-stage mass / thrust / dv
import { PRESETS, stackFromTypes, segments, segmentInfo } from '../src/rocket.js';
const name = process.argv[2] || 'Apollo (Mặt Trăng)';
const stack = stackFromTypes(PRESETS[name] || name.split(','));
const segs = segments(stack);
const infos = segs.map((i) => segmentInfo(stack, i));
let above = 0;
for (let k = 0; k < infos.length; k++) {
  const s = infos[k];
  const bm = (s.bDry + s.bFuel) || 0;
  const m0 = above + s.dry + s.fuel + bm, m1 = above + s.dry + bm;
  const isp = s.mdot ? s.tVac / s.mdot / 9.80665 : 0;
  const dv = isp ? isp * 9.80665 * Math.log(m0 / m1) : 0;
  console.log(`stage ${k}: dry ${s.dry.toFixed(1)} fuel ${s.fuel.toFixed(1)} above ${above.toFixed(1)} tSL ${s.tSL.toFixed(0)} tVac ${s.tVac.toFixed(0)} isp ${isp.toFixed(0)} dv ${dv.toFixed(0)} TWRvac ${(s.tVac / (m0 * 9.80665)).toFixed(2)} TWRsl ${(s.tSL / (m0 * 9.80665)).toFixed(2)} booster ${s.bFuel || 0}`);
  above += s.dry + s.fuel;
}
