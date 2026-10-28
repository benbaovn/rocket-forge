// Procedural texture generation (no external assets needed)
import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function hash(x, y, s) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s + 1, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function vnoise(x, y, p, s) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const m = (a) => ((a % p) + p) % p;
  const a = hash(m(xi), m(yi), s), b = hash(m(xi + 1), m(yi), s);
  const c = hash(m(xi), m(yi + 1), s), d = hash(m(xi + 1), m(yi + 1), s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Tileable fbm. x,y in noise cells, period = integer cells for tiling */
export function fbm(x, y, period, oct = 4, seed = 0) {
  let s = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise(x * f, y * f, period * f, seed + i * 17);
    n += a; a *= 0.5; f *= 2;
  }
  return s / n;
}

function toTexture(canvas, { srgb = false, repeat = true } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 16;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

function grayCanvas(w, h, fn) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = Math.max(0, Math.min(255, fn(x, y) * 255));
    const i = (y * w + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function colorCanvas(w, h, fn) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const out = [0, 0, 0, 1];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    fn(x, y, out);
    const i = (y * w + x) * 4;
    img.data[i] = out[0] * 255; img.data[i + 1] = out[1] * 255; img.data[i + 2] = out[2] * 255;
    img.data[i + 3] = (out[3] ?? 1) * 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Height field (Float32Array w*h, tileable) -> normal map texture */
function heightToNormal(hf, w, h, strength) {
  return toTexture(colorCanvas(w, h, (x, y, o) => {
    const xl = (x - 1 + w) % w, xr = (x + 1) % w, yu = (y - 1 + h) % h, yd = (y + 1) % h;
    const dx = (hf[y * w + xr] - hf[y * w + xl]) * 0.5 * strength;
    const dv = (hf[yu * w + x] - hf[yd * w + x]) * 0.5 * strength; // canvas rows go down = -v
    let nx = -dx, ny = -dv, nz = 1;
    const l = Math.hypot(nx, ny, nz);
    o[0] = (nx / l) * 0.5 + 0.5; o[1] = (ny / l) * 0.5 + 0.5; o[2] = (nz / l) * 0.5 + 0.5; o[3] = 1;
  }));
}

const cache = {};

/** Riveted metal panel normal + roughness (for painted tanks) */
export function panelTextures() {
  if (cache.panel) return cache.panel;
  const S = 512;
  const hf = new Float32Array(S * S);
  const rows = 4, cols = 4;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let h = 0.5 + (fbm(x / 32, y / 32, 16, 3, 3) - 0.5) * 0.08;
    const row = Math.floor(y / (S / rows));
    const off = (row % 2) * (S / cols / 2);
    const ly = y % (S / rows);
    const lx = (x + off) % (S / cols);
    const dy = Math.min(ly, S / rows - ly), dx = Math.min(lx, S / cols - lx);
    const seam = Math.min(dx, dy);
    if (seam < 1.5) h -= 0.6 * (1 - seam / 1.5);
    // rivets along seams
    const rv = 12;
    const ry = Math.min(dy, 99), rx = Math.min(dx, 99);
    if (ry > 3 && ry < 7) { const t = (lx % rv) - rv / 2; const d = Math.hypot(t, ry - 5); if (d < 2) h += 0.5 * (1 - d / 2); }
    if (rx > 3 && rx < 7) { const t = (ly % rv) - rv / 2; const d = Math.hypot(t, rx - 5); if (d < 2) h += 0.5 * (1 - d / 2); }
    hf[y * S + x] = h;
  }
  const normal = heightToNormal(hf, S, S, 3.0);
  const rough = toTexture(grayCanvas(S, S, (x, y) => {
    const streak = fbm(x / 6, y / 90, Math.floor(S / 6), 3, 9);
    return 0.42 + (fbm(x / 24, y / 24, S / 24, 4, 5) - 0.5) * 0.35 + (streak - 0.5) * 0.25;
  }));
  cache.panel = { normal, rough };
  return cache.panel;
}

/** Saturn-V style black/white roll pattern */
export function checkerMap() {
  if (cache.checker) return cache.checker;
  const S = 256;
  cache.checker = toTexture(colorCanvas(S, S, (x, y, o) => {
    const top = y < S / 2;
    const left = x < S / 2;
    const black = top ? left : !left;
    const n = (fbm(x / 16, y / 16, 16, 3, 2) - 0.5) * 0.06;
    const v = black ? 0.035 + n * 0.3 : 0.9 + n;
    o[0] = v; o[1] = v; o[2] = v * 0.99; o[3] = 1;
  }), { srgb: true });
  return cache.checker;
}

/** Orange insulation foam (like shuttle ET) */
export function foamTextures() {
  if (cache.foam) return cache.foam;
  const S = 512;
  const map = toTexture(colorCanvas(S, S, (x, y, o) => {
    const n = fbm(x / 40, y / 40, S / 40, 5, 11);
    const s = fbm(x / 4, y / 60, S / 4, 3, 13);
    const k = 0.75 + n * 0.4 + (s - 0.5) * 0.15;
    o[0] = 0.78 * k; o[1] = 0.36 * k; o[2] = 0.13 * k; o[3] = 1;
  }), { srgb: true });
  const hf = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) hf[y * S + x] = fbm(x / 6, y / 6, S / 6, 4, 21);
  const normal = heightToNormal(hf, S, S, 2.0);
  cache.foam = { map, normal };
  return cache.foam;
}

/** Crinkled gold foil (MLI blanket) faceted normal map */
export function foilTextures() {
  if (cache.foil) return cache.foil;
  const S = 512, G = 24, cell = S / G;
  const pts = [];
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    pts.push({ x: (i + hash(i, j, 1)) * cell, y: (j + hash(i, j, 2)) * cell, a: (hash(i, j, 3) - 0.5) * 0.25, b: (hash(i, j, 4) - 0.5) * 0.25 });
  }
  const hf = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const ci = Math.floor(x / cell), cj = Math.floor(y / cell);
    let best = 1e9, bp = null, bdx = 0, bdy = 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ii = (ci + di + G) % G, jj = (cj + dj + G) % G;
      const p = pts[jj * G + ii];
      let dx = x - (p.x + (ci + di - ii) * cell * 0 + (ci + di < 0 ? -S : ci + di >= G ? S : 0));
      let dy = y - (p.y + (cj + dj < 0 ? -S : cj + dj >= G ? S : 0));
      const d = dx * dx + dy * dy;
      if (d < best) { best = d; bp = p; bdx = dx; bdy = dy; }
    }
    hf[y * S + x] = bp.a * bdx + bp.b * bdy;
  }
  const normal = heightToNormal(hf, S, S, 1.0);
  const map = toTexture(colorCanvas(S, S, (x, y, o) => {
    const n = fbm(x / 20, y / 20, S / 20, 3, 31);
    o[0] = 0.85 + n * 0.15; o[1] = 0.62 + n * 0.12; o[2] = 0.22 + n * 0.05; o[3] = 1;
  }), { srgb: true });
  cache.foil = { normal, map };
  return cache.foil;
}

/** Brushed metal roughness */
export function brushedRough() {
  if (cache.brushed) return cache.brushed;
  const S = 512;
  cache.brushed = toTexture(grayCanvas(S, S, (x, y) => 0.25 + fbm(x / 1.5, y / 80, S / 1.5, 3, 41) * 0.25 + fbm(x / 30, y / 30, S / 30, 3, 43) * 0.15));
  return cache.brushed;
}

/** Soft smoke puff sprite (RGBA) */
export function smokeSprite() {
  if (cache.smoke) return cache.smoke;
  const S = 256;
  const c = colorCanvas(S, S, (x, y, o) => {
    const u = x / S - 0.5, v = y / S - 0.5;
    const r = Math.hypot(u, v) * 2;
    const n = fbm(x / 22, y / 22, S / 22, 5, 51);
    const n2 = fbm(x / 9, y / 9, S / 9, 3, 53);
    let a = Math.max(0, 1 - r) ** 1.4 * (0.35 + 1.1 * n) * (0.8 + 0.4 * n2);
    a = Math.min(1, Math.max(0, (a - 0.08) * 1.6));
    const shade = 0.72 + 0.28 * (1 - y / S) + (n2 - 0.5) * 0.2; // fake top lighting
    o[0] = o[1] = o[2] = Math.min(1, shade); o[3] = a;
  });
  cache.smoke = toTexture(c, { repeat: false });
  return cache.smoke;
}

/** Bright fire/glow sprite */
export function fireSprite() {
  if (cache.fire) return cache.fire;
  const S = 128;
  const c = colorCanvas(S, S, (x, y, o) => {
    const u = x / S - 0.5, v = y / S - 0.5;
    const r = Math.hypot(u, v) * 2;
    const n = fbm(x / 12, y / 12, S / 12, 4, 61);
    const a = Math.max(0, 1 - r) ** 2 * (0.6 + 0.8 * n);
    o[0] = o[1] = o[2] = 1; o[3] = Math.min(1, a);
  });
  cache.fire = toTexture(c, { repeat: false });
  return cache.fire;
}

/** Polished concrete floor */
export function concreteTextures() {
  if (cache.concrete) return cache.concrete;
  const S = 1024;
  const map = toTexture(colorCanvas(S, S, (x, y, o) => {
    const n = fbm(x / 64, y / 64, S / 64, 5, 71);
    const n2 = fbm(x / 8, y / 8, S / 8, 3, 73);
    let k = 0.42 + (n - 0.5) * 0.25 + (n2 - 0.5) * 0.06;
    // slab joints
    const jx = x % 256, jy = y % 256;
    if (jx < 2 || jy < 2) k *= 0.55;
    o[0] = k * 0.98; o[1] = k * 0.98; o[2] = k; o[3] = 1;
  }), { srgb: true });
  const rough = toTexture(grayCanvas(S, S, (x, y) => 0.18 + fbm(x / 40, y / 40, S / 40, 4, 77) * 0.35));
  cache.concrete = { map, rough };
  return cache.concrete;
}

/** Wall panel texture for hangar */
export function wallTextures() {
  if (cache.wall) return cache.wall;
  const S = 512;
  const hf = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const corr = Math.sin((x / S) * Math.PI * 2 * 16);
    hf[y * S + x] = corr * 0.5 + (y % 128 < 2 ? -1 : 0);
  }
  const normal = heightToNormal(hf, S, S, 2.0);
  const map = toTexture(colorCanvas(S, S, (x, y, o) => {
    const n = fbm(x / 30, y / 30, S / 30, 4, 81);
    const streak = fbm(x / 3, y / 70, S / 3, 3, 83);
    const k = 0.2 + n * 0.12 - streak * 0.05;
    o[0] = k * 0.95; o[1] = k; o[2] = k * 1.08; o[3] = 1;
  }), { srgb: true });
  cache.wall = { normal, map };
  return cache.wall;
}

/** Vietnamese flag + label decal */
export function flagDecal() {
  if (cache.flag) return cache.flag;
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);
  // flag
  ctx.fillStyle = '#da251d';
  ctx.fillRect(96, 40, 320, 213);
  ctx.fillStyle = '#ffcd00';
  const cx = 256, cy = 146, R = 64, r = R * 0.382;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? r : R;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 74px "Be Vietnam Pro", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VIỆT NAM', 256, 350);
  ctx.font = 'bold 44px Orbitron, Arial, sans-serif';
  ctx.fillText('ROCKET FORGE', 256, 420);
  const t = toTexture(c, { srgb: true, repeat: false });
  cache.flag = t;
  return t;
}

/** Yellow/black hazard stripes */
export function hazardMap() {
  if (cache.hazard) return cache.hazard;
  const S = 256;
  cache.hazard = toTexture(colorCanvas(S, S, (x, y, o) => {
    const s = ((x + y) % 64) < 32;
    const n = fbm(x / 10, y / 10, S / 10, 3, 91) * 0.15;
    if (s) { o[0] = 0.9 - n; o[1] = 0.65 - n; o[2] = 0.05; } else { o[0] = o[1] = o[2] = 0.04 + n * 0.2; }
    o[3] = 1;
  }), { srgb: true });
  return cache.hazard;
}

/** Photovoltaic solar cell grid texture (deep blue silicon wafers + silver busbars) */
export function solarTextures() {
  if (cache.solar) return cache.solar;
  const S = 512;
  const hf = new Float32Array(S * S);
  const map = toTexture(colorCanvas(S, S, (x, y, o) => {
    const cellW = 64, cellH = 64;
    const cx = x % cellW, cy = y % cellH;
    const border = cx < 3 || cx >= cellW - 2 || cy < 3 || cy >= cellH - 2;
    // Diamond corner interconnects typical of monocrystalline solar wafers
    const corner = (cx + cy < 9) || ((cellW - cx) + cy < 9) || (cx + (cellH - cy) < 9) || ((cellW - cx) + (cellH - cy) < 9);
    // Silver busbars & fine finger grid lines
    const busbar = Math.abs(cx - cellW * 0.28) <= 1.2 || Math.abs(cx - cellW * 0.72) <= 1.2;
    const finger = (cy % 8 === 0) && !border;
    const n = fbm(x / 24, y / 24, S / 24, 3, 97);

    if (border || corner) {
      o[0] = 0.75; o[1] = 0.80; o[2] = 0.88; o[3] = 1;
      hf[y * S + x] = -0.8;
    } else if (busbar) {
      o[0] = 0.82; o[1] = 0.86; o[2] = 0.94; o[3] = 1;
      hf[y * S + x] = 0.4;
    } else if (finger) {
      o[0] = 0.25; o[1] = 0.46; o[2] = 0.78; o[3] = 1;
      hf[y * S + x] = 0.15;
    } else {
      // Rich photovoltaic royal/navy blue with subtle crystalline shimmer
      const shimmer = 0.88 + n * 0.24;
      o[0] = 0.05 * shimmer;
      o[1] = 0.22 * shimmer;
      o[2] = 0.56 * shimmer;
      o[3] = 1;
      hf[y * S + x] = 0.0;
    }
  }), { srgb: true });
  const normal = heightToNormal(hf, S, S, 2.2);
  cache.solar = { map, normal };
  return cache.solar;
}
