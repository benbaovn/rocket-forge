// Realistic Earth seen from Cape Canaveral, Florida to orbit, with real continents, biomes, atmosphere & clouds
import * as THREE from 'three';
import { ATMOS_GLSL, PLANET_R } from './atmosphere.js';

export const NOISE_GLSL = /* glsl */`
vec3 hash33(vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p.zxy, p.yxz + 19.19);
  return fract(vec3(p.x * p.y, p.z * p.x, p.y * p.z)) * 2.0 - 1.0;
}
float gnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(mix(dot(hash33(i), f), dot(hash33(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                 mix(dot(hash33(i + vec3(0,1,0)), f - vec3(0,1,0)), dot(hash33(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
             mix(mix(dot(hash33(i + vec3(0,0,1)), f - vec3(0,0,1)), dot(hash33(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                 mix(dot(hash33(i + vec3(0,1,1)), f - vec3(0,1,1)), dot(hash33(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z) * 0.5 + 0.5;
}
float fbm3(vec3 p, int oct) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 10; i++) { if (i >= oct) break; s += a * gnoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s / (1.0 - pow(0.5, float(oct)));
}
`;

// Cape Canaveral Space Force Station / Kennedy Space Center, Florida
export const FLORIDA_LAT_DEG = 28.55;
export const FLORIDA_LON_DEG = -80.56;

// Real-world continent & island polygons in [lon, lat] degrees
const LAND_POLYGONS = [
  // North America (with high-detail Florida peninsula, Cape Canaveral, Gulf of Mexico, Baja, US East/West coasts, Alaska & Canada)
  [
    [-168.0, 65.6], [-161.0, 70.3], [-156.5, 71.3], [-141.0, 69.6], [-135.0, 69.4], [-128.0, 70.5],
    [-118.0, 68.5], [-105.0, 68.2], [-95.0, 69.5], [-86.0, 68.0], [-82.5, 64.0], [-92.0, 62.5],
    [-94.5, 58.8], [-89.0, 56.8], [-82.3, 55.0], [-79.5, 51.5], [-78.5, 55.5], [-77.5, 58.5],
    [-78.0, 62.5], [-72.0, 61.5], [-66.5, 58.8], [-64.5, 60.3], [-60.0, 55.5], [-55.6, 52.0],
    [-59.0, 50.2], [-64.5, 49.8], [-68.5, 48.5], [-64.5, 47.0], [-61.0, 45.5], [-63.5, 44.5],
    [-66.0, 43.5], [-65.5, 45.2], [-67.0, 45.0], [-70.2, 43.6], [-70.8, 42.2], [-70.0, 41.7],
    [-71.8, 41.3], [-74.0, 40.5], [-74.8, 39.0], [-75.5, 38.5], [-76.3, 39.2], [-76.4, 37.0],
    [-75.9, 36.8], [-75.5, 35.2], [-76.5, 34.7], [-77.9, 34.0], [-79.9, 32.8], [-81.1, 32.0],
    [-81.45, 30.75], [-81.28, 29.90], [-80.95, 29.15],
    // Cape Canaveral & Merritt Island jutting into the Atlantic
    [-80.80, 28.82], [-80.53, 28.60], [-80.52, 28.44], [-80.58, 28.20],
    // South Florida (Melbourne -> West Palm Beach -> Miami -> Key Largo -> Everglades)
    [-80.42, 27.60], [-80.04, 26.75], [-80.12, 25.78], [-80.38, 25.22], [-80.85, 25.12],
    [-81.15, 25.18], [-81.38, 25.60], [-81.82, 26.15], [-82.18, 26.68], [-82.58, 27.35],
    // Tampa Bay & Florida West Coast
    [-82.76, 27.65], [-82.46, 27.86], [-82.82, 28.05], [-82.68, 28.88], [-83.15, 29.35],
    [-83.75, 29.95], [-84.40, 29.92], [-84.98, 29.68], [-85.40, 29.72], [-85.75, 30.15],
    [-86.50, 30.38], [-87.45, 30.32],
    // Gulf of Mexico (Alabama, Mississippi Delta, Louisiana, Texas, Mexico, Yucatan)
    [-88.10, 30.25], [-89.15, 30.35], [-89.60, 29.45], [-89.15, 29.02], [-90.25, 29.15],
    [-91.80, 29.58], [-93.85, 29.70], [-94.80, 29.32], [-96.40, 28.45], [-97.20, 27.75],
    [-97.15, 25.95], [-97.75, 24.20], [-97.85, 22.25], [-97.35, 20.95], [-96.15, 19.20],
    [-94.50, 18.15], [-92.45, 18.45], [-90.50, 19.85], [-90.40, 21.25], [-88.10, 21.60],
    [-86.80, 21.20], [-87.45, 19.60], [-88.30, 18.05], [-88.20, 15.75], [-85.95, 15.95],
    [-83.15, 14.95], [-83.55, 11.50], [-83.00, 10.00], [-81.50, 8.85], [-79.50, 9.15],
    [-77.60, 8.40], [-77.90, 7.45], [-80.40, 7.40], [-82.90, 8.20], [-85.65, 10.00],
    [-87.85, 13.00], [-90.80, 13.90], [-92.25, 14.55], [-95.15, 16.15], [-98.50, 16.30],
    [-101.55, 17.60], [-105.45, 20.40], [-105.80, 22.50], [-109.10, 25.55], [-111.00, 28.00],
    [-113.15, 30.20], [-114.80, 31.80],
    // Baja California Peninsula
    [-115.20, 30.80], [-114.20, 28.80], [-112.50, 26.80], [-110.80, 24.20], [-109.90, 22.88],
    [-112.25, 24.75], [-114.40, 27.20], [-115.85, 30.15], [-117.12, 32.55],
    // California, Oregon, Washington, British Columbia, Alaska
    [-118.45, 33.95], [-120.60, 34.55], [-121.90, 36.60], [-122.50, 37.80], [-123.80, 39.40],
    [-124.40, 40.45], [-124.10, 43.30], [-124.00, 46.25], [-124.70, 48.38], [-123.15, 49.25],
    [-127.80, 50.80], [-130.50, 54.20], [-134.50, 57.50], [-137.50, 58.90], [-141.50, 60.05],
    [-146.50, 60.45], [-151.30, 59.65], [-154.50, 58.10], [-158.80, 56.10], [-163.20, 54.80],
    [-166.50, 53.90], [-161.80, 55.90], [-158.50, 58.65], [-161.80, 59.10], [-165.40, 61.50],
    [-162.50, 63.30], [-166.20, 65.20],
  ],
  // Florida Keys chain
  [
    [-80.35, 25.25], [-80.55, 24.92], [-81.05, 24.72], [-81.82, 24.54],
    [-81.85, 24.64], [-81.10, 24.84], [-80.60, 25.04], [-80.42, 25.28],
  ],
  // Grand Bahama & Great Abaco
  [[-79.00, 26.68], [-77.80, 26.60], [-77.05, 26.95], [-77.15, 26.00], [-77.85, 26.40], [-78.98, 26.52]],
  // Andros Island (Bahamas)
  [[-78.25, 25.15], [-77.70, 24.95], [-77.52, 24.00], [-77.95, 23.75], [-78.30, 24.45]],
  // Eleuthera, Cat Island, Long Island & Great Exuma (Bahamas)
  [[-76.80, 25.45], [-76.15, 25.10], [-75.35, 24.20], [-74.85, 23.05], [-75.25, 22.85], [-76.00, 23.60], [-76.60, 24.75]],
  // Great Inagua & Turks/Caicos
  [[-73.70, 21.18], [-72.90, 21.15], [-71.60, 21.85], [-71.40, 21.45], [-73.00, 20.92], [-73.68, 20.95]],
  // Cuba
  [
    [-84.95, 21.86], [-83.80, 22.85], [-82.38, 23.14], [-80.80, 23.18], [-79.20, 22.55],
    [-77.20, 21.60], [-75.60, 20.75], [-74.13, 20.22], [-75.20, 19.90], [-77.72, 19.85],
    [-77.05, 20.65], [-78.40, 21.10], [-79.95, 21.68], [-81.15, 22.10], [-82.10, 22.55],
    [-83.55, 22.20], [-84.45, 21.75],
  ],
  // Jamaica
  [[-78.38, 18.25], [-77.80, 18.52], [-76.20, 18.15], [-76.35, 17.85], [-77.75, 17.72], [-78.35, 18.10]],
  // Hispaniola (Haiti & Dominican Republic)
  [
    [-73.40, 19.65], [-71.80, 19.88], [-69.90, 19.65], [-68.32, 18.60], [-68.65, 18.20],
    [-70.10, 18.22], [-71.45, 17.62], [-72.30, 18.25], [-74.45, 18.42], [-74.10, 18.65],
    [-72.75, 18.55], [-72.80, 19.45],
  ],
  // Puerto Rico
  [[-67.28, 18.48], [-65.60, 18.42], [-65.62, 17.95], [-67.25, 17.92]],
  // Newfoundland, Baffin, Victoria, Ellesmere, Vancouver Island
  [[-59.4, 47.6], [-56.0, 51.5], [-52.6, 47.5], [-55.5, 46.8], [-59.2, 47.8]],
  [[-85.0, 73.5], [-75.0, 72.5], [-66.0, 66.5], [-61.5, 65.0], [-65.0, 62.0], [-72.0, 64.0], [-78.0, 68.0], [-84.0, 70.5]],
  [[-118.0, 73.0], [-104.0, 73.2], [-101.0, 69.5], [-114.0, 69.0], [-117.5, 71.0]],
  [[-88.0, 81.5], [-64.0, 82.5], [-72.0, 76.5], [-86.0, 76.5]],
  [[-128.4, 50.8], [-125.0, 49.8], [-123.3, 48.4], [-125.5, 48.6], [-128.0, 50.2]],

  // South America
  [
    [-77.60, 8.40], [-75.50, 10.80], [-71.80, 12.40], [-71.20, 10.80], [-68.00, 10.60],
    [-62.00, 10.70], [-59.80, 8.40], [-57.00, 6.00], [-52.50, 4.90], [-50.00, 1.50],
    [-48.20, -0.80], [-44.20, -2.50], [-38.50, -3.70], [-35.20, -5.50], [-34.80, -8.00],
    [-38.50, -13.00], [-39.00, -18.00], [-41.00, -22.00], [-43.20, -23.00], [-48.50, -26.00],
    [-48.80, -28.50], [-52.10, -32.00], [-53.50, -33.80], [-56.00, -35.00], [-58.20, -34.50],
    [-56.80, -36.80], [-57.50, -38.00], [-62.20, -39.00], [-63.00, -41.00], [-65.00, -43.00],
    [-65.80, -45.00], [-67.50, -46.20], [-65.80, -47.80], [-68.50, -50.20], [-68.40, -52.40],
    [-66.50, -54.80], [-68.80, -55.40], [-73.50, -53.20], [-75.20, -49.50], [-74.00, -45.00],
    [-73.60, -41.50], [-73.20, -37.00], [-71.60, -33.00], [-71.40, -29.00], [-70.50, -23.50],
    [-70.20, -18.40], [-75.50, -15.00], [-77.20, -12.00], [-79.20, -8.00], [-81.30, -4.70],
    [-79.90, -2.20], [-80.80, -0.50], [-78.80, 1.50], [-77.30, 4.00], [-77.80, 7.20],
  ],
  // Falkland Islands
  [[-61.2, -51.3], [-57.7, -51.3], [-58.0, -52.3], [-61.0, -52.2]],

  // Greenland & Iceland & Svalbard
  [
    [-72.0, 78.0], [-60.0, 81.5], [-35.0, 83.4], [-18.0, 81.5], [-18.5, 76.0], [-22.0, 70.5],
    [-28.0, 68.2], [-37.0, 65.8], [-42.5, 60.5], [-44.5, 59.8], [-48.5, 61.0], [-51.5, 64.2],
    [-53.5, 68.5], [-56.0, 73.5], [-60.0, 75.8], [-68.5, 76.5],
  ],
  [[-24.2, 65.5], [-20.0, 66.4], [-13.6, 65.2], [-15.0, 63.8], [-19.5, 63.4], [-22.8, 63.9], [-24.5, 64.8]],
  [[11.0, 79.8], [26.0, 80.2], [22.0, 77.2], [14.0, 76.8]],

  // Great Britain & Ireland
  [[-5.7, 50.1], [-5.2, 51.8], [-3.2, 51.5], [-4.8, 53.3], [-3.0, 54.5], [-5.0, 55.2], [-5.8, 57.5], [-5.0, 58.6], [-3.1, 58.6], [-1.8, 57.5], [-2.8, 56.0], [-1.5, 55.0], [-0.1, 53.5], [1.7, 52.7], [1.4, 51.3], [0.2, 50.8], [-2.0, 50.6], [-3.8, 50.2]],
  [[-10.2, 51.6], [-9.8, 53.5], [-8.4, 55.3], [-6.0, 55.2], [-5.5, 54.4], [-6.1, 53.3], [-6.4, 52.2], [-8.5, 51.7]],

  // Eurasia (Europe + Asia)
  [
    // Iberia (Portugal & Spain)
    [-9.30, 38.70], [-8.90, 42.10], [-9.20, 43.30], [-1.80, 43.40],
    // France, Low Countries, Jutland (Denmark), Germany, Poland, Baltic
    [-1.20, 46.00], [-4.75, 48.40], [-1.60, 49.65], [1.60, 50.90], [4.50, 52.40], [8.50, 53.90],
    [8.20, 57.00], [10.60, 57.70], [10.20, 55.00], [12.10, 54.10], [14.50, 54.00], [18.80, 54.50],
    [21.10, 55.80], [24.10, 57.00], [24.80, 59.40], [28.20, 59.90], [29.80, 60.20], [24.50, 60.10],
    [21.50, 61.50], [25.20, 65.50], [22.20, 65.80], [19.80, 63.50], [17.50, 60.60], [18.20, 59.20],
    [16.00, 56.20], [12.80, 55.50], [11.80, 57.80], [10.60, 59.80], [7.00, 58.00], [5.10, 60.40],
    [6.50, 62.80], [12.50, 66.00], [16.50, 69.00], [21.00, 70.20], [28.00, 71.10], [31.50, 69.80],
    // Kola Peninsula, White Sea, Russian Arctic, Siberia
    [40.50, 67.80], [36.50, 66.00], [38.00, 64.50], [44.00, 66.50], [43.50, 68.50], [54.00, 68.80],
    [60.50, 69.80], [68.50, 69.00], [70.00, 73.00], [73.50, 72.50], [75.00, 68.00], [78.00, 72.50],
    [86.00, 74.00], [104.00, 77.60], [114.00, 73.50], [128.00, 73.20], [140.00, 72.80], [150.00, 71.20],
    [162.00, 69.60], [178.00, 68.80], [179.80, 65.50], [171.00, 60.50], [163.50, 59.80],
    // Kamchatka Peninsula & Sea of Okhotsk
    [163.00, 56.00], [156.60, 51.00], [156.00, 54.50], [158.50, 58.50], [155.00, 59.50],
    [143.00, 59.30], [136.50, 54.50], [141.20, 52.50], [139.00, 47.00], [135.00, 43.50],
    [131.80, 43.10],
    // Korean Peninsula
    [129.40, 38.50], [129.50, 35.10], [126.40, 34.50], [126.50, 37.50], [124.50, 39.80],
    // China Coast (Bohai, Shandong, Shanghai, Fujian, Guangdong, Hainan)
    [121.20, 38.80], [122.20, 40.50], [119.50, 39.80], [117.80, 38.50], [119.50, 37.50],
    [122.60, 37.40], [120.40, 36.00], [121.80, 31.20], [121.80, 29.80], [120.50, 27.50],
    [118.50, 24.50], [116.50, 23.00], [114.10, 22.30], [110.20, 21.50], [109.80, 20.20],
    [108.50, 21.60],
    // Vietnam & Indochina & Malay Peninsula
    [106.60, 20.80], [105.80, 18.80], [108.20, 16.10], [109.30, 13.00], [109.10, 11.60],
    [106.80, 10.40], [104.80, 8.60], [104.50, 10.40], [102.50, 12.20], [100.60, 13.50],
    [99.20, 10.50], [100.20, 8.20], [103.50, 4.50], [104.20, 1.35], [101.50, 2.80],
    [100.10, 5.50], [98.40, 8.00], [98.20, 12.50], [97.50, 16.50], [94.30, 16.00],
    [92.20, 20.80], [90.50, 22.20],
    // India & Bay of Bengal & Arabian Sea
    [88.20, 21.80], [85.80, 19.80], [82.20, 16.80], [80.30, 13.10], [79.80, 10.30],
    [77.55, 8.08], [76.20, 10.00], [74.80, 12.90], [72.80, 19.00], [72.60, 21.60],
    [69.00, 22.30], [70.20, 23.00], [68.50, 23.80], [67.00, 24.90],
    // Iran, Persian Gulf, Arabian Peninsula, Red Sea, Levant, Anatolia (Turkey)
    [61.50, 25.20], [56.50, 27.10], [54.00, 26.80], [50.20, 30.00], [48.00, 29.90],
    [50.10, 26.50], [51.50, 25.90], [54.50, 24.40], [56.30, 26.20], [59.80, 22.50],
    [55.00, 17.00], [49.00, 14.50], [43.40, 12.60], [42.60, 16.80], [39.10, 21.50],
    [36.80, 25.50], [34.50, 28.00], [32.60, 29.90], [34.50, 31.50], [35.80, 34.50],
    [36.10, 36.60], [32.80, 36.10], [27.40, 36.80], [26.20, 40.00], [29.00, 41.20],
    // Black Sea, Greece, Balkans, Italy, Mediterranean France & Spain
    [35.00, 42.00], [41.60, 41.60], [39.00, 44.50], [33.50, 44.50], [30.80, 46.40],
    [28.60, 44.20], [27.90, 42.00], [26.00, 40.80], [23.00, 40.50], [24.00, 38.00],
    [22.50, 36.50], [21.20, 38.00], [19.50, 40.50], [18.50, 42.50], [14.50, 45.30],
    [12.30, 45.40], [12.60, 44.00], [16.10, 41.90], [18.50, 40.10], [16.80, 39.80],
    [15.60, 38.00], [15.80, 39.80], [14.20, 40.80], [11.80, 42.00], [10.30, 43.70],
    [8.90, 44.40], [7.20, 43.70], [5.30, 43.30], [3.20, 42.50], [0.80, 40.80],
    [-0.40, 39.40], [-0.70, 37.60], [-2.20, 36.70], [-5.40, 36.05], [-6.30, 36.50],
    [-8.90, 37.00],
  ],
  // Sicily, Sardinia, Corsica, Crete, Cyprus
  [[12.4, 37.8], [15.6, 38.2], [15.1, 36.7], [12.6, 37.6]],
  [[8.2, 41.2], [9.8, 41.1], [9.6, 39.0], [8.4, 38.9]],
  [[8.6, 43.0], [9.5, 42.8], [9.2, 41.4], [8.6, 41.6]],
  [[23.5, 35.6], [26.3, 35.2], [26.0, 34.9], [23.6, 35.2]],
  [[32.3, 35.1], [34.6, 35.7], [34.0, 34.6], [32.4, 34.7]],

  // Africa
  [
    [-5.80, 35.80], [-0.50, 35.80], [3.00, 36.80], [8.50, 37.00], [10.80, 37.10],
    [11.10, 33.50], [15.20, 32.40], [19.80, 30.30], [20.10, 32.80], [25.20, 31.60],
    [29.90, 31.20], [32.50, 31.30], [33.80, 27.80], [35.50, 24.00], [37.30, 21.00],
    [39.00, 18.00], [41.50, 15.00], [43.30, 11.80], [48.00, 11.20], [51.40, 11.90],
    [50.00, 8.00], [45.30, 2.00], [41.00, -1.50], [39.50, -6.50], [40.60, -11.00],
    [40.80, -15.00], [36.80, -18.00], [34.90, -20.00], [35.50, -24.00], [32.80, -26.00],
    [31.00, -29.80], [28.00, -32.80], [25.50, -34.00], [20.00, -34.80], [18.40, -34.30],
    [17.90, -29.50], [15.00, -26.50], [14.40, -22.50], [11.80, -17.00], [13.20, -12.50],
    [12.20, -6.00], [9.40, -1.00], [9.50, 3.80], [5.50, 4.50], [3.40, 6.40],
    [-2.00, 4.80], [-7.70, 4.40], [-10.80, 6.30], [-13.30, 8.50], [-16.60, 12.30],
    [-17.50, 14.75], [-16.50, 19.50], [-17.00, 21.00], [-14.50, 26.20], [-11.50, 28.50],
    [-9.80, 31.50], [-7.60, 33.60],
  ],
  // Madagascar
  [[49.3, -12.0], [50.4, -15.3], [49.5, -19.0], [47.0, -25.0], [44.5, -25.5], [43.3, -22.0], [44.2, -16.5], [47.8, -13.5]],
  // Sri Lanka
  [[79.8, 9.6], [81.8, 7.5], [80.6, 5.9], [79.8, 7.2]],
  // Hainan & Taiwan
  [[108.6, 19.2], [110.9, 20.0], [110.4, 18.2], [108.9, 18.3]],
  [[120.2, 23.0], [121.6, 25.2], [121.5, 22.8], [120.7, 21.9]],
  // Sakhalin
  [[141.8, 53.8], [143.4, 51.0], [143.2, 46.5], [141.9, 47.0], [142.0, 51.5]],

  // Japan (Hokkaido, Honshu, Shikoku, Kyushu)
  [[140.0, 41.5], [141.5, 45.4], [145.5, 43.4], [143.2, 42.0], [140.8, 41.8]],
  [[130.9, 34.0], [133.0, 35.5], [136.8, 37.3], [139.8, 39.5], [141.5, 41.4], [142.0, 39.5], [140.8, 35.8], [139.0, 34.8], [136.8, 34.5], [135.2, 33.5], [132.5, 34.2]],
  [[132.2, 33.4], [134.6, 34.2], [134.2, 33.2], [132.5, 32.8]],
  [[129.6, 33.3], [131.6, 33.5], [131.4, 31.3], [130.2, 31.2]],

  // Philippines (Luzon, Visayas, Mindanao, Palawan)
  [[120.2, 18.5], [122.4, 18.2], [122.2, 15.0], [124.2, 12.8], [123.0, 13.0], [120.8, 14.2], [119.9, 16.2]],
  [[121.8, 11.8], [125.6, 11.2], [124.0, 9.5], [122.2, 10.2]],
  [[124.0, 8.6], [126.5, 8.2], [126.2, 5.8], [124.2, 6.0], [122.0, 7.0], [123.2, 8.2]],
  [[117.2, 8.5], [119.6, 11.2], [119.8, 10.6], [117.6, 8.4]],

  // Indonesia & New Guinea (Sumatra, Java, Borneo, Sulawesi, New Guinea)
  [[95.3, 5.6], [99.8, 3.2], [103.8, 0.5], [106.0, -3.0], [105.8, -5.9], [104.0, -5.5], [100.2, -1.5], [96.5, 2.5]],
  [[105.2, -6.5], [110.5, -6.8], [114.5, -7.8], [114.4, -8.7], [108.5, -7.8], [105.5, -7.0]],
  [[108.9, 1.0], [111.5, 3.0], [115.5, 5.8], [118.8, 5.2], [117.8, 1.0], [116.2, -3.5], [114.0, -3.5], [110.2, -2.8]],
  [[119.8, 1.0], [125.0, 1.5], [122.0, 0.2], [123.2, -1.5], [122.8, -5.2], [120.2, -5.5], [119.0, -2.5]],
  [[130.8, -1.0], [134.5, -0.8], [141.0, -2.6], [147.8, -6.0], [150.8, -10.5], [147.0, -9.5], [143.2, -8.2], [138.5, -8.4], [135.0, -4.5], [132.0, -2.8]],

  // Australia, Tasmania & New Zealand
  [
    [113.5, -22.0], [122.2, -17.5], [126.8, -14.0], [130.8, -12.4], [136.8, -12.2],
    [136.0, -15.5], [140.8, -17.5], [142.5, -10.7], [145.5, -15.0], [149.2, -21.0],
    [153.6, -28.0], [151.2, -33.8], [149.9, -37.5], [146.5, -39.0], [144.0, -38.5],
    [139.0, -35.8], [136.5, -34.8], [135.0, -33.2], [131.5, -31.5], [124.0, -33.8],
    [118.0, -35.0], [115.0, -34.2], [115.6, -32.0], [114.0, -26.0],
  ],
  [[144.6, -40.7], [148.3, -41.0], [147.8, -43.5], [145.4, -43.2]],
  // New Zealand (North & South Islands)
  [[172.6, -34.4], [175.8, -36.8], [178.5, -37.7], [176.8, -39.8], [174.8, -41.5], [173.8, -39.2], [174.2, -36.8]],
  [[172.7, -40.5], [174.2, -41.6], [172.8, -43.8], [170.5, -46.0], [167.5, -46.6], [166.5, -45.5], [169.5, -43.2]],

  // Hawaiian Islands
  [[-156.0, 20.2], [-154.8, 19.5], [-155.7, 18.9], [-156.1, 19.7]],
  [[-158.3, 21.7], [-156.0, 20.6], [-156.6, 20.5], [-158.2, 21.3]],

  // Antarctica
  [
    [-180.0, -90.0], [-180.0, -72.0], [-150.0, -74.0], [-120.0, -73.5], [-95.0, -72.5],
    [-75.0, -70.0], [-60.0, -63.5], [-57.0, -64.5], [-60.0, -73.0], [-40.0, -77.5],
    [-15.0, -71.5], [15.0, -69.8], [45.0, -67.5], [72.0, -68.5], [105.0, -66.5],
    [138.0, -66.5], [168.0, -71.5], [172.0, -77.5], [180.0, -77.5], [180.0, -90.0],
  ],
];

// Inland lakes & enclosed waters to carve out inside continents [lon, lat]
const LAKE_POLYGONS = [
  // Lake Okeechobee (Florida!)
  [[-81.10, 27.18], [-80.62, 27.15], [-80.62, 26.70], [-81.08, 26.72]],
  // Banana River / Indian River Lagoon (Cape Canaveral, Florida!)
  [[-80.82, 28.80], [-80.62, 28.72], [-80.60, 28.20], [-80.76, 28.22]],
  // Great Lakes (Superior, Michigan, Huron, Erie, Ontario)
  [[-92.1, 46.8], [-88.0, 48.8], [-84.5, 46.5], [-88.0, 46.5]],
  [[-87.8, 45.8], [-86.0, 45.8], [-86.2, 41.6], [-87.9, 42.0]],
  [[-84.0, 46.0], [-80.0, 45.2], [-82.2, 43.0], [-83.8, 43.8]],
  [[-83.4, 41.8], [-78.9, 42.9], [-79.2, 42.1], [-83.0, 41.4]],
  [[-79.8, 43.6], [-76.1, 44.1], [-76.2, 43.2], [-79.6, 43.2]],
  // Caspian Sea
  [[47.0, 46.5], [53.5, 46.0], [54.0, 37.2], [49.0, 37.0], [49.8, 40.5], [47.2, 43.5]],
  // Lake Victoria & Lake Tanganyika (Africa)
  [[31.6, -0.5], [34.8, -0.3], [34.2, -3.0], [31.6, -2.8]],
  [[29.1, -3.5], [30.8, -6.5], [31.1, -8.8], [29.5, -8.5]],
];

// Shallow turquoise coral banks & continental shelves [lon, lat, rxDeg, ryDeg]
const SHALLOW_BANKS = [
  [-78.0, 24.5, 3.8, 2.8],  // Great Bahama Bank & Florida Straits
  [-81.2, 24.8, 2.2, 1.2],  // Florida Keys & Dry Tortugas Reef
  [-82.8, 27.5, 1.8, 2.8],  // West Florida Shelf (Gulf of Mexico)
  [-89.5, 21.8, 2.8, 1.8],  // Campeche Bank (Yucatan)
  [-81.5, 16.5, 4.5, 2.2],  // Caribbean Banks
  [107.0, 2.5, 7.5, 6.5],   // Sunda Shelf (South China Sea / Java Sea)
  [136.0, -10.5, 6.5, 4.5], // Arafura / Sahul Shelf (N. Australia)
  [148.5, -18.5, 3.2, 5.5], // Great Barrier Reef (Australia)
  [52.5, 26.2, 3.8, 2.2],   // Persian Gulf
  [39.0, 20.5, 2.2, 5.5],   // Red Sea Coral Reefs
  [2.5, 54.5, 4.5, 3.0],    // North Sea
];

// Major desert belts [lon, lat, rxDeg, ryDeg, strength]
const DESERT_ZONES = [
  [12.0, 23.5, 26.0, 8.5, 1.0],   // Sahara Desert
  [45.0, 23.0, 11.0, 7.5, 0.95],  // Arabian Desert
  [56.0, 32.0, 9.0, 5.5, 0.80],   // Iranian / Lut Desert
  [65.0, 42.0, 11.0, 5.5, 0.78],  // Kyzylkum / Karakum
  [96.0, 42.5, 16.0, 6.0, 0.88],  // Gobi & Taklamakan Deserts
  [71.5, 27.0, 4.5, 3.8, 0.75],   // Thar Desert
  [21.0, -24.0, 6.5, 6.5, 0.85],  // Kalahari & Namib Deserts
  [131.0, -24.5, 14.5, 6.8, 0.95],// Australian Outback Red Center
  [-111.5, 32.5, 7.5, 6.5, 0.85], // Sonoran, Mojave & Chihuahuan Deserts (US SW & N. Mexico)
  [-69.5, -23.5, 3.2, 8.5, 0.90], // Atacama Desert & Puna
  [-68.0, -45.0, 3.5, 6.5, 0.72], // Patagonian Steppe
];

// Major mountain chains [lon, lat, rxDeg, ryDeg, height]
const MOUNTAIN_ZONES = [
  [-111.0, 44.0, 7.5, 14.0, 0.85], // Rocky Mountains
  [-70.5, -18.0, 3.5, 28.0, 0.95], // Andes Mountains
  [10.5, 46.5, 5.5, 2.5, 0.85],    // European Alps
  [-4.0, 32.5, 6.5, 2.2, 0.70],    // Atlas Mountains
  [39.0, 9.5, 4.5, 4.5, 0.75],     // Ethiopian Highlands
  [44.5, 42.0, 4.5, 2.2, 0.80],    // Caucasus
  [50.0, 33.5, 5.5, 4.0, 0.72],    // Zagros Mountains
  [86.0, 32.5, 14.0, 6.5, 1.00],   // Himalayas & Tibetan Plateau
  [60.0, 58.0, 2.5, 9.0, 0.65],    // Ural Mountains
  [170.0, -43.5, 2.2, 3.2, 0.80],  // New Zealand Southern Alps
];

let _cachedOrbitalEarthTex = null;
let _cachedMapEarthTex = null;

/**
 * Generates a realistic 2048x1024 Earth equirectangular texture with real continents,
 * Cape Canaveral / Florida peninsula, Bahamas turquoise banks, Sahara, Amazon, Himalayas, etc.
 */
export function createRealEarthTexture({ forMapView = false } = {}) {
  if (forMapView && _cachedMapEarthTex) return _cachedMapEarthTex;
  if (!forMapView && _cachedOrbitalEarthTex) return _cachedOrbitalEarthTex;

  const w = 2048, h = 1024;
  const maskCv = document.createElement('canvas');
  maskCv.width = w; maskCv.height = h;
  const mctx = maskCv.getContext('2d');

  // Helper to convert (lonDeg, latDeg) to canvas pixel (x, y)
  const lonToX = (lon) => ((lon + 180) / 360) * w;
  const latToY = (lat) => ((90 - lat) / 180) * h;

  mctx.fillStyle = '#000';
  mctx.fillRect(0, 0, w, h);

  // Draw blurred coastal shelf / elevation halo in green channel, sharp land mask in red channel
  const drawPolys = (polys, fillStyle) => {
    mctx.fillStyle = fillStyle;
    for (const poly of polys) {
      if (!poly || poly.length < 3) continue;
      mctx.beginPath();
      mctx.moveTo(lonToX(poly[0][0]), latToY(poly[0][1]));
      for (let i = 1; i < poly.length; i++) {
        mctx.lineTo(lonToX(poly[i][0]), latToY(poly[i][1]));
      }
      mctx.closePath();
      mctx.fill();
    }
  };

  // Smooth coastal shelf & inland elevation gradient using strokes
  mctx.lineJoin = 'round';
  mctx.lineCap = 'round';
  for (const [lw, alpha] of [[26, 0.14], [14, 0.22], [7, 0.35], [3, 0.50]]) {
    mctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
    mctx.lineWidth = lw;
    for (const poly of LAND_POLYGONS) {
      mctx.beginPath();
      mctx.moveTo(lonToX(poly[0][0]), latToY(poly[0][1]));
      for (let i = 1; i < poly.length; i++) mctx.lineTo(lonToX(poly[i][0]), latToY(poly[i][1]));
      mctx.closePath();
      mctx.stroke();
    }
  }

  // Crisp land mask in Red + Green
  drawPolys(LAND_POLYGONS, 'rgb(255, 220, 0)');
  // Carve out lakes (Okeechobee, Banana River, Great Lakes, Caspian, Victoria, Tanganyika)
  drawPolys(LAKE_POLYGONS, 'rgb(0, 90, 0)');

  const maskData = mctx.getImageData(0, 0, w, h).data;

  const outCv = document.createElement('canvas');
  outCv.width = w; outCv.height = h;
  const ctx = outCv.getContext('2d');
  const outImg = ctx.createImageData(w, h);
  const data = outImg.data;

  for (let y = 0; y < h; y++) {
    const latDeg = 90 - (y + 0.5) / h * 180;
    const latRad = latDeg * Math.PI / 180;
    const absLat = Math.abs(latDeg);
    const cosLat = Math.cos(latRad);

    for (let x = 0; x < w; x++) {
      // For MapView SphereGeometry, shift longitude so Cape Canaveral (-80.56°) sits at u = 0.75 (padMarker at pa = 0)
      const rawLonDeg = (x + 0.5) / w * 360 - 180;
      const lonDeg = forMapView
        ? ((((rawLonDeg - (90 - FLORIDA_LON_DEG)) + 540) % 360) - 180)
        : rawLonDeg;
      const mx = Math.min(w - 1, Math.max(0, Math.floor(((lonDeg + 180) / 360) * w)));
      const mIdx = (y * w + mx) * 4;
      const landR = maskData[mIdx] / 255;
      const shelfG = maskData[mIdx + 1] / 255;

      // Multi-frequency deterministic coastline & terrain variation
      const lonRad = lonDeg * Math.PI / 180;
      const nx = cosLat * Math.cos(lonRad);
      const ny = cosLat * Math.sin(lonRad);
      const nz = Math.sin(latRad);
      const n1 = Math.sin(nx * 19.3 + ny * 17.1 + nz * 15.7) * 0.5 + 0.5;
      const n2 = Math.sin(nx * 47.0 - ny * 41.3 + nz * 37.9) * 0.5 + 0.5;
      const n3 = Math.sin(nx * 113.0 + ny * 97.0 - nz * 89.0) * 0.5 + 0.5;
      const noise = n1 * 0.52 + n2 * 0.31 + n3 * 0.17;

      const isLand = (landR + (noise - 0.5) * 0.18) > 0.48;
      const idx = (y * w + x) * 4;

      if (!isLand) {
        // Check shallow coral banks (Bahamas, Florida Keys, Yucatan, Caribbean, Sunda, Great Barrier Reef)
        let bankBoost = 0;
        for (let b = 0; b < SHALLOW_BANKS.length; b++) {
          const sb = SHALLOW_BANKS[b];
          const dx = (lonDeg - sb[0]) / sb[2];
          const dy = (latDeg - sb[1]) / sb[3];
          const d2 = dx * dx + dy * dy;
          if (d2 < 1.8) bankBoost = Math.max(bankBoost, Math.exp(-d2 * 1.9));
        }
        const shallow = Math.min(1, shelfG * 0.95 + bankBoost * 0.85);
        // Sea ice near extreme poles
        const seaIce = absLat > 78 ? Math.min(1, (absLat - 78) / 7 + (noise - 0.5) * 0.25) : 0;

        // Deep ocean -> continental shelf -> glowing turquoise Bahama/Florida reef water
        let r = 5 + shallow * 18 + bankBoost * 24 + (noise - 0.5) * 4;
        let g = 24 + shallow * 72 + bankBoost * 68 + (noise - 0.5) * 6;
        let bCol = 64 + shallow * 76 + bankBoost * 42 + (noise - 0.5) * 8;

        if (seaIce > 0.05) {
          r = r * (1 - seaIce) + 225 * seaIce;
          g = g * (1 - seaIce) + 238 * seaIce;
          bCol = bCol * (1 - seaIce) + 248 * seaIce;
        }
        data[idx] = Math.max(0, Math.min(255, Math.round(r)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
        data[idx + 2] = Math.max(0, Math.min(255, Math.round(bCol)));
        // Alpha < 128 encodes ocean depth (used by 3D orbital shader for specular & coastal shelf)
        data[idx + 3] = Math.max(4, Math.min(124, Math.round(40 + shallow * 80)));
      } else {
        // Compute desert & mountain weights from real-world geographic zones
        let desertW = 0;
        for (let d = 0; d < DESERT_ZONES.length; d++) {
          const dz = DESERT_ZONES[d];
          const dx = (lonDeg - dz[0]) / dz[2];
          const dy = (latDeg - dz[1]) / dz[3];
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 2.2) {
            desertW = Math.max(desertW, Math.exp(-dist2 * 1.35) * dz[4]);
          }
        }
        // Carve lush green Nile River & Delta through the Sahara!
        if (latDeg > 15 && latDeg < 31.6 && Math.abs(lonDeg - 31.2 - Math.sin(latDeg * 0.5) * 0.7) < (latDeg > 29.8 ? 1.4 : 0.45)) {
          desertW *= 0.05;
        }

        let mtnW = 0;
        for (let m = 0; m < MOUNTAIN_ZONES.length; m++) {
          const mz = MOUNTAIN_ZONES[m];
          const dx = (lonDeg - mz[0]) / mz[2];
          const dy = (latDeg - mz[1]) / mz[3];
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 2.2) {
            mtnW = Math.max(mtnW, Math.exp(-dist2 * 1.45) * mz[4]);
          }
        }

        // Greenland & Antarctica ice sheets + high polar snow
        const isGreenland = lonDeg > -73 && lonDeg < -12 && latDeg > 60 && latDeg < 84;
        const isAntarctica = latDeg < -61;
        const snowW = Math.min(1, Math.max(
          isGreenland ? 0.94 : 0,
          isAntarctica ? 0.96 : 0,
          absLat > 66 ? (absLat - 66) / 14 + (noise - 0.5) * 0.2 : 0,
          mtnW > 0.62 ? (mtnW - 0.58) * 1.8 * n2 : 0
        ));

        // Base vegetation color by latitude (equatorial rainforest -> subtropical Florida/SE Asia -> temperate -> boreal taiga)
        const eqLush = Math.exp(-Math.pow(absLat / 18, 2));
        const subtropFlorida = (lonDeg > -88 && lonDeg < -75 && latDeg > 18 && latDeg < 34) ? 0.65 : 0;
        const lush = Math.min(1, eqLush * 0.85 + subtropFlorida + (noise - 0.35) * 0.35);

        // Rich satellite green palette
        let r = 34 + (1 - lush) * 38 + (noise - 0.5) * 18;
        let g = 88 + lush * 32 - Math.max(0, absLat - 48) * 1.1 + (noise - 0.5) * 22;
        let bCol = 28 + (1 - lush) * 14 + (noise - 0.5) * 10;

        // Blend desert (golden Sahara / Arabian / red-ochre Australian Outback)
        if (desertW > 0.02) {
          const isOutback = lonDeg > 112 && lonDeg < 146 && latDeg < -15;
          const dR = isOutback ? 196 : 204;
          const dG = isOutback ? 116 : 166;
          const dB = isOutback ? 74 : 102;
          const dw = Math.min(1, desertW * (0.82 + 0.35 * noise));
          r = r * (1 - dw) + dR * dw;
          g = g * (1 - dw) + dG * dw;
          bCol = bCol * (1 - dw) + dB * dw;
        }

        // Blend mountain rock (Andes, Rockies, Alps, Himalayas)
        if (mtnW > 0.05) {
          const mw = Math.min(1, mtnW * (0.75 + 0.4 * n2));
          r = r * (1 - mw) + 112 * mw;
          g = g * (1 - mw) + 98 * mw;
          bCol = bCol * (1 - mw) + 84 * mw;
        }

        // Blend snow & ice sheets
        if (snowW > 0.02) {
          r = r * (1 - snowW) + 238 * snowW;
          g = g * (1 - snowW) + 244 * snowW;
          bCol = bCol * (1 - snowW) + 252 * snowW;
        }

        data[idx] = Math.max(0, Math.min(255, Math.round(r)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
        data[idx + 2] = Math.max(0, Math.min(255, Math.round(bCol)));
        // Alpha >= 132 encodes land + elevation (132 = coast, 255 = high mountain peak)
        const elevByte = Math.round(136 + Math.min(1, shelfG * 0.4 + mtnW * 0.8 + noise * 0.2) * 115);
        data[idx + 3] = Math.max(132, Math.min(255, elevByte));
      }
    }
  }

  ctx.putImageData(outImg, 0, 0);

  const tex = new THREE.CanvasTexture(outCv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  if (forMapView) {
    tex.colorSpace = THREE.SRGBColorSpace;
    _cachedMapEarthTex = tex;
  } else {
    _cachedOrbitalEarthTex = tex;
  }
  return tex;
}

export function createEarth(sunDir) {
  const geo = new THREE.SphereGeometry(PLANET_R, 384, 192);
  const earthTex = createRealEarthTexture({ forMapView: false });
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uSun: { value: sunDir.clone() },
      uCamRel: { value: new THREE.Vector3() },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uExposure: { value: 1 },
      uEarthTex: { value: earthTex },
    },
    vertexShader: /* glsl */`
      varying vec3 vObj; varying vec3 vWorld; varying vec3 vNormalW;
      void main() {
        vObj = normalize(position);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      ${ATMOS_GLSL}
      ${NOISE_GLSL}
      uniform vec3 uSun; uniform vec3 uCamRel; uniform float uOpacity; uniform float uTime; uniform float uExposure;
      uniform sampler2D uEarthTex;
      varying vec3 vObj; varying vec3 vWorld; varying vec3 vNormalW;

      // Convert sphere point vObj to real-world (lon, lat) with Cape Canaveral, Florida (28.55°N, -80.56°W) at (0, 1, 0)
      vec2 sphereToEarthUV(vec3 n, out float latRad, out float lonRad) {
        const float LAT0 = 0.4982915; // 28.55 deg in radians (Cape Canaveral, Florida)
        const float LON0 = -1.406037; // -80.56 deg in radians
        const float sLat0 = 0.4779255;
        const float cLat0 = 0.8784004;
        // At n = (0, 1, 0): lat = LAT0 (28.55°N), lon = LON0 (-80.56°W).
        // +n.x = East (Atlantic Ocean), -n.x = West (Florida Peninsula & Gulf of Mexico),
        // -n.z = North (US East Coast), +n.z = South (Miami, Florida Keys, Bahamas, Cuba & South America).
        vec3 g = vec3(
          n.x,
          n.y * sLat0 - n.z * cLat0,
          n.y * cLat0 + n.z * sLat0
        );
        latRad = asin(clamp(g.y, -1.0, 1.0));
        lonRad = mod(LON0 + atan(g.x, g.z) + PI, 2.0 * PI) - PI;
        return vec2(lonRad / (2.0 * PI) + 0.5, 0.5 - latRad / PI);
      }

      void main() {
        vec3 n = normalize(vObj);
        vec3 N = normalize(vNormalW);

        // Multi-scale procedural coastline & terrain detail so Florida & continents stay razor-sharp at any altitude
        float detail = fbm3(n * 85.0, 5);
        float micro = fbm3(n * 320.0, 4);
        float ultra = fbm3(n * 1100.0, 3);
        vec3 coastWarp = vec3(detail - 0.5, micro - 0.5, ultra - 0.5) * 0.0028;

        float latRad, lonRad;
        vec2 uv = sphereToEarthUV(normalize(n + coastWarp), latRad, lonRad);
        vec4 texSample = texture2D(uEarthTex, uv);

        // Signed elevation h from real-world continent mask + local Cape Canaveral launchpad beach alignment
        float mapH = (texSample.a - 0.502) * 1.8 + (detail - 0.5) * 0.055 + (micro - 0.5) * 0.022;
        float padDist2 = dot(n.xz, n.xz) + (1.0 - max(n.y, 0.0)) * 2.0;
        float padZone = exp(-padDist2 * 1800.0);
        // At Cape Canaveral (0, 1, 0), Atlantic beach is at n.x ≈ 0.0043 (2.6 km east of LC-39A)
        float padH = (detail - 0.5) * 0.14 - (n.x - 0.0043) * 2.2;
        float h = mix(mapH, padH, padZone);

        vec3 col;
        float spec = 0.0;
        if (h < 0.0) {
          float depth = clamp(-h * 3.6, 0.0, 1.0);
          float shelf = exp(h * 28.0);
          // Blend real-world bathymetry (glowing turquoise Bahamas & Florida Keys reefs vs deep Atlantic/Pacific)
          vec3 mapWater = pow(texSample.rgb, vec3(1.15)) * 0.95;
          vec3 shallowCol = vec3(0.04, 0.44, 0.50);
          vec3 deepOcean = vec3(0.008, 0.045, 0.13);
          col = mix(mapWater, deepOcean, smoothstep(0.25, 0.95, depth) * 0.55);
          col = mix(col, shallowCol, shelf * 0.65);
          spec = 1.0;
        } else {
          float elev = clamp(h * 1.8, 0.0, 1.0);
          // Real-world satellite biome color from texture + high-resolution procedural foliage/soil/rock detail
          vec3 mapLand = pow(texSample.rgb, vec3(1.12)) * 1.18;
          // Near Cape Canaveral padZone, ensure lush Florida coastal greenery even if coastWarp shifted UV slightly over water
          vec3 floridaGreen = mix(vec3(0.10, 0.34, 0.10), vec3(0.22, 0.44, 0.14), detail);
          col = mix(mapLand, floridaGreen, padZone * 0.75);

          // Mountain ridges & river network detail
          float ridge = pow(1.0 - abs(fbm3(n * 26.0 + vec3(3.3), 5) * 2.0 - 1.0), 2.2);
          float riverNoise = abs(fbm3(n * 24.0 + vec3(6.1, 1.8, 4.4), 4) - 0.5);
          float river = (1.0 - smoothstep(0.0018, 0.0075, riverNoise)) * (1.0 - smoothstep(0.0, 0.35, elev)) * step(abs(latRad), 1.05);
          col = mix(col, vec3(0.04, 0.26, 0.36), river * 0.75);

          // Fine terrain texture & sandy Florida / continental beaches
          col *= 0.76 + 0.48 * (detail * 0.55 + micro * 0.30 + ultra * 0.15);
          vec3 beachCol = vec3(0.78, 0.70, 0.54);
          col = mix(beachCol, col, smoothstep(0.0, 0.016, h));

          // 3D topographic bump relief shading on mountains & hills
          float eps = 0.0007;
          float hx = fbm3((n + vec3(eps, 0.0, 0.0)) * 32.0, 5) - fbm3((n - vec3(eps, 0.0, 0.0)) * 32.0, 5);
          float hy = fbm3((n + vec3(0.0, eps, 0.0)) * 32.0, 5) - fbm3((n - vec3(0.0, eps, 0.0)) * 32.0, 5);
          vec3 bumpN = normalize(N + normalize(vec3(hx, hy, 0.0) + 1e-5) * length(vec2(hx, hy)) * 2.5 * (0.35 + elev + ridge * 0.25));
          float relief = clamp(dot(bumpN, uSun) / max(dot(N, uSun), 0.12), 0.72, 1.32);
          col *= relief;
        }

        // Wispy dynamic cloud formations (kept light & semi-transparent so Florida and all continents are clearly visible)
        vec3 cp = n * 6.5 + vec3(uTime * 0.0018, -uTime * 0.0007, uTime * 0.001);
        float cSwirl = fbm3(cp * 0.8 + vec3(5.2), 4) - 0.5;
        float c = fbm3(cp + cSwirl * 0.9, 6);
        // Keep sky right over Florida relatively clear so the player always sees Florida clearly on ascent & orbit
        float clearFlorida = 1.0 - 0.55 * exp(-padDist2 * 35.0);
        float cloud = smoothstep(0.60, 0.80, c) * clearFlorida;

        vec3 V = normalize(vWorld - cameraPosition);
        float ndl = dot(N, uSun);
        float lit = smoothstep(-0.08, 0.22, ndl) * max(ndl, 0.0) * 0.88 + smoothstep(-0.12, 0.12, ndl) * 0.06;
        vec3 surf = col * lit * 1.75;
        if (spec > 0.0) {
          vec3 Rf = reflect(V, N);
          surf += vec3(1.0, 0.88, 0.65) * pow(max(dot(Rf, uSun), 0.0), 160.0) * 1.5 * (1.0 - cloud) * step(0.0, ndl);
        }
        surf = mix(surf, vec3(0.95, 0.97, 1.0) * lit * 1.45, cloud * 0.58);

        // City lights on night side (concentrated on non-polar, non-desert land like Florida, US East Coast, Europe, Asia)
        float night = smoothstep(0.06, -0.14, ndl);
        if (h > 0.0 && abs(latRad) < 1.08) {
          float cityCluster = smoothstep(0.52, 0.70, fbm3(n * 24.0 + vec3(1.7), 4));
          float cityGrid = pow(fbm3(n * 290.0, 3), 5.0);
          surf += vec3(1.0, 0.68, 0.30) * night * cityCluster * cityGrid * 2.8 * (1.0 - cloud * 0.8);
        }

        // Atmosphere between camera and surface (crystal-clear nadir view over continents, glowing blue limb at horizon)
        float dist = length(vWorld - cameraPosition);
        vec3 tr;
        vec3 ins = atmosphere(V, uCamRel, uSun, 20.0, dist, 12, 6, tr);
        float viewNadir = clamp(dot(N, -V), 0.0, 1.0);
        float hazeWeight = mix(1.0, 0.30, pow(viewNadir, 0.65));
        float sunPath = 1.0 / max(ndl + 0.15, 0.06);
        vec3 sunT = exp((-kRlh * shRlh * sunPath - kMie * shMie * sunPath) * 0.62);
        vec3 transEff = mix(vec3(1.0), tr, hazeWeight);
        vec3 color = surf * sunT * transEff + ins * hazeWeight;
        gl_FragColor = vec4(color * uExposure, uOpacity);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  return mesh;
}

export function createStars() {
  const N = 9000;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const size = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = 1;
    // concentrate some stars in a milky-way band
    let x = s * Math.cos(a), y = u, z = s * Math.sin(a);
    if (i < N * 0.4) { const b = (Math.random() - 0.5) * 0.25; const t = Math.random() * Math.PI * 2; x = Math.cos(t); y = b + Math.sin(t) * 0.5; z = Math.sin(t) * 0.86; const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l; }
    pos.set([x * r, y * r, z * r], i * 3);
    const tcol = Math.random();
    const c = tcol < 0.2 ? [0.7, 0.8, 1.0] : tcol < 0.35 ? [1.0, 0.85, 0.7] : [1, 1, 1];
    const b = Math.pow(Math.random(), 6) * 6 + 0.2;
    col.set(c.map((v) => v * b), i * 3);
    size[i] = 1.0 + Math.pow(Math.random(), 8) * 3.0;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.BufferAttribute(size, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uFade: { value: 0 }, uPR: { value: 1 } },
    vertexShader: /* glsl */`
      attribute vec3 color; attribute float size; varying vec3 vC;
      uniform float uPR;
      void main() { vC = color; vec4 p = projectionMatrix * viewMatrix * vec4((modelMatrix * vec4(position * 1e7, 1.0)).xyz, 1.0); gl_Position = p.xyww; gl_PointSize = size * uPR * 1.5; }`,
    fragmentShader: /* glsl */`
      varying vec3 vC; uniform float uFade;
      void main() { vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(d)); gl_FragColor = vec4(vC * a * uFade, 1.0); }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  pts.renderOrder = -0.5;
  return pts;
}
