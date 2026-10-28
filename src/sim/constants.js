// Scaled Solar System (Kerbal-style) shared by physics, guidance and visuals.
// Planets (Mercury, Venus, Earth, Mars) orbit the Sun; Moon & ISS orbit Earth; Phobos & Deimos orbit Mars.
export const G0 = 9.80665;

// ---- Sun (Mặt Trời)
export const R_SUN = 2200e3;                 // radius (m)
export const G_SUN = 28.0;                   // surface gravity (m/s²)
export const MU_SUN = G_SUN * R_SUN * R_SUN; // gravitational parameter (m³/s²)
export const SUN_SOI = 830000e3;             // solar gravity sphere encompassing the entire Solar System out past Pluto (m)
export const OMEGA_SUN = (2 * Math.PI) / 120000;
export const ASTEROID_BELT_INNER = 98000e3;  // inner edge of Main Asteroid Belt (well outside Mars SOI = 89,200 km)
export const ASTEROID_BELT_OUTER = 126000e3; // outer edge of Main Asteroid Belt (well inside Jupiter SOI inner edge = 139,000 km)

// ---- Earth (Trái Đất - orbits Sun)
export const R_E = 600e3;                    // radius (m)
export const MU_E = G0 * R_E * R_E;          // gravitational parameter (m³/s²)
export const OMEGA_E = (2 * Math.PI) / 21600; // sidereal rotation (rad/s) – 6 h day, ~175 m/s at equator
export const ATM_H = 5600;                   // density scale height (m)
export const ATM_TOP = 70e3;                 // atmosphere considered vacuum above this (m)
export const RHO0 = 1.225;                   // sea-level density (kg/m³)
export const EARTH_A = 52000e3;              // orbit radius around Sun (m)
export const EARTH_N = Math.sqrt(MU_SUN / EARTH_A ** 3);
export const EARTH_SOI = 11500e3;            // Earth gravity sphere radius (m)
export const EARTH_PHASE0 = -1.94;           // Earth heliocentric angle at t=0

// ---- Moon (Mặt Trăng - orbits Earth, closer to Earth)
export const R_M = 200e3;
export const G_M = 1.63;
export const MU_M = G_M * R_M * R_M;
export const MOON_A = 5600e3;                // orbit radius around Earth centre (m)
export const MOON_N = Math.sqrt(MU_E / MOON_A ** 3); // mean motion around Earth (rad/s)
export const MOON_SOI = 1750e3;
export const MOON_PHASE0 = 1.9;              // Moon downrange angle at t=0 (rad, clockwise from +Y)

// ---- Mercury (Sao Thủy - 1st planet around Sun)
export const R_MERCURY = 240e3;
export const G_MERCURY = 3.70;
export const MU_MERCURY = G_MERCURY * R_MERCURY * R_MERCURY;
export const MERCURY_A = 16000e3;            // orbit radius around Sun (m)
export const MERCURY_N = Math.sqrt(MU_SUN / MERCURY_A ** 3);
export const MERCURY_SOI = 4800e3;
export const MERCURY_PHASE0 = 2.4;

// ---- Venus (Sao Kim - 2nd planet around Sun)
export const R_VENUS = 280e3;
export const G_VENUS = 8.87;
export const MU_VENUS = G_VENUS * R_VENUS * R_VENUS;
export const VENUS_A = 31000e3;              // orbit radius around Sun (m)
export const VENUS_N = Math.sqrt(MU_SUN / VENUS_A ** 3);
export const VENUS_SOI = 6400e3;
export const VENUS_PHASE0 = -0.85;

// ---- Mars (Sao Hỏa - 4th planet around Sun)
export const R_MARS = 340e3;
export const G_MARS = 3.72;
export const MU_MARS = G_MARS * R_MARS * R_MARS;
export const MARS_A = 80000e3;               // orbit radius around Sun (m)
export const MARS_N = Math.sqrt(MU_SUN / MARS_A ** 3);
export const MARS_SOI = 9200e3;
export const MARS_PHASE0 = -1.25;

// ---- Phobos (inner moon of Mars)
export const R_PHOBOS = 65e3;
export const G_PHOBOS = 0.45;
export const MU_PHOBOS = G_PHOBOS * R_PHOBOS * R_PHOBOS;
export const PHOBOS_A = 1450e3;              // orbit radius around Mars centre (m)
export const PHOBOS_N = Math.sqrt(MU_MARS / PHOBOS_A ** 3);
export const PHOBOS_SOI = 320e3;
export const PHOBOS_PHASE0 = 0.75;

// ---- Deimos (outer moon of Mars)
export const R_DEIMOS = 48e3;
export const G_DEIMOS = 0.30;
export const MU_DEIMOS = G_DEIMOS * R_DEIMOS * R_DEIMOS;
export const DEIMOS_A = 3100e3;              // orbit radius around Mars centre (m)
export const DEIMOS_N = Math.sqrt(MU_MARS / DEIMOS_A ** 3);
export const DEIMOS_SOI = 260e3;
export const DEIMOS_PHASE0 = 3.65;

// ---- Jupiter (Sao Mộc - 5th planet around Sun) & Galilean Moons
export const R_JUPITER = 1350e3;
export const G_JUPITER = 24.79;
export const MU_JUPITER = G_JUPITER * R_JUPITER * R_JUPITER;
export const JUPITER_A = 165000e3;           // gap from Mars (80,000 km) = 85,000 km
export const JUPITER_N = Math.sqrt(MU_SUN / JUPITER_A ** 3);
export const JUPITER_SOI = 26000e3;
export const JUPITER_PHASE0 = 0.85;

// ---- Saturn (Sao Thổ - 6th planet around Sun) & Major Moons
export const R_SATURN = 1120e3;
export const G_SATURN = 10.44;
export const MU_SATURN = G_SATURN * R_SATURN * R_SATURN;
export const SATURN_A = 275000e3;            // gap from Jupiter = 110,000 km
export const SATURN_N = Math.sqrt(MU_SUN / SATURN_A ** 3);
export const SATURN_SOI = 30000e3;
export const SATURN_PHASE0 = -2.35;

// ---- Uranus (Sao Thiên Vương - 7th planet around Sun) & Major Moons
export const R_URANUS = 780e3;
export const G_URANUS = 8.69;
export const MU_URANUS = G_URANUS * R_URANUS * R_URANUS;
export const URANUS_A = 415000e3;            // gap from Saturn = 140,000 km
export const URANUS_N = Math.sqrt(MU_SUN / URANUS_A ** 3);
export const URANUS_SOI = 22000e3;
export const URANUS_PHASE0 = 1.55;

// ---- Neptune (Sao Hải Vương - 8th planet around Sun) & Triton
export const R_NEPTUNE = 750e3;
export const G_NEPTUNE = 11.15;
export const MU_NEPTUNE = G_NEPTUNE * R_NEPTUNE * R_NEPTUNE;
export const NEPTUNE_A = 585000e3;           // gap from Uranus = 170,000 km
export const NEPTUNE_N = Math.sqrt(MU_SUN / NEPTUNE_A ** 3);
export const NEPTUNE_SOI = 20000e3;
export const NEPTUNE_PHASE0 = -0.45;

// ---- Pluto (Sao Diêm Vương - 9th body around Sun)
export const R_PLUTO = 190e3;
export const G_PLUTO = 0.62;
export const MU_PLUTO = G_PLUTO * R_PLUTO * R_PLUTO;
export const PLUTO_A = 785000e3;             // gap from Neptune = 200,000 km
export const PLUTO_N = Math.sqrt(MU_SUN / PLUTO_A ** 3);
export const PLUTO_SOI = 8500e3;
export const PLUTO_PHASE0 = 2.65;

function defMoon(name, label, icon, color, hex, parent, parentMu, R, g, a, soi, phase0, atm = 0, atmH = 1, rho0 = 0) {
  const mu = g * R * R;
  const n = Math.sqrt(parentMu / a ** 3);
  return { name, label, icon, color, hex, parent, R, g, mu, a, n, phase0, soi, atm, atmH, rho0, omega: n };
}

// ---- Unified Celestial Bodies Registry
export const BODIES = {
  sun: {
    name: 'sun', label: 'Mặt Trời', icon: '☀️', color: '#fde047', hex: 0xfacc15,
    parent: null,
    R: R_SUN, g: G_SUN, mu: MU_SUN, a: 0, n: 0, phase0: 0, soi: 8500e3, outerSoi: SUN_SOI,
    atm: 150e3, atmH: 18000, rho0: 0.5, omega: OMEGA_SUN,
  },
  mercury: {
    name: 'mercury', label: 'Sao Thủy', icon: '⚪', color: '#cbd5e1', hex: 0xcbd5e1,
    parent: 'sun',
    R: R_MERCURY, g: G_MERCURY, mu: MU_MERCURY, a: MERCURY_A, n: MERCURY_N, phase0: MERCURY_PHASE0, soi: MERCURY_SOI,
    atm: 0, atmH: 1, rho0: 0, omega: MERCURY_N,
  },
  venus: {
    name: 'venus', label: 'Sao Kim', icon: '🟡', color: '#fbbf24', hex: 0xfbbf24,
    parent: 'sun',
    R: R_VENUS, g: G_VENUS, mu: MU_VENUS, a: VENUS_A, n: VENUS_N, phase0: VENUS_PHASE0, soi: VENUS_SOI,
    atm: 55e3, atmH: 6000, rho0: 2.2, omega: VENUS_N,
  },
  earth: {
    name: 'earth', label: 'Trái Đất', icon: '🌍', color: '#38bdf8', hex: 0x38bdf8,
    parent: 'sun',
    R: R_E, g: G0, mu: MU_E, a: EARTH_A, n: EARTH_N, phase0: EARTH_PHASE0, soi: Infinity,
    atm: ATM_TOP, atmH: ATM_H, rho0: RHO0, omega: OMEGA_E,
  },
  moon: {
    name: 'moon', label: 'Mặt Trăng', icon: '🌕', color: '#f1f5f9', hex: 0x94a3b8,
    parent: 'earth',
    R: R_M, g: G_M, mu: MU_M, a: MOON_A, n: MOON_N, phase0: MOON_PHASE0, soi: MOON_SOI,
    atm: 0, atmH: 1, rho0: 0, omega: MOON_N,
  },
  mars: {
    name: 'mars', label: 'Sao Hỏa', icon: '🔴', color: '#f97316', hex: 0xf97316,
    parent: 'sun',
    R: R_MARS, g: G_MARS, mu: MU_MARS, a: MARS_A, n: MARS_N, phase0: MARS_PHASE0, soi: MARS_SOI,
    atm: 50e3, atmH: 4500, rho0: 0.08, omega: (2 * Math.PI) / 22200,
  },
  phobos: {
    name: 'phobos', label: 'Phobos', icon: '🪨', color: '#d6d3d1', hex: 0xa8a29e,
    parent: 'mars',
    R: R_PHOBOS, g: G_PHOBOS, mu: MU_PHOBOS, a: PHOBOS_A, n: PHOBOS_N, phase0: PHOBOS_PHASE0, soi: PHOBOS_SOI,
    atm: 0, atmH: 1, rho0: 0, omega: PHOBOS_N,
  },
  deimos: {
    name: 'deimos', label: 'Deimos', icon: '🪨', color: '#e7e5e4', hex: 0xd6d3d1,
    parent: 'mars',
    R: R_DEIMOS, g: G_DEIMOS, mu: MU_DEIMOS, a: DEIMOS_A, n: DEIMOS_N, phase0: DEIMOS_PHASE0, soi: DEIMOS_SOI,
    atm: 0, atmH: 1, rho0: 0, omega: DEIMOS_N,
  },
  jupiter: {
    name: 'jupiter', label: 'Sao Mộc', icon: '🟠', color: '#fb923c', hex: 0xfb923c,
    parent: 'sun', gasGiant: true,
    R: R_JUPITER, g: G_JUPITER, mu: MU_JUPITER, a: JUPITER_A, n: JUPITER_N, phase0: JUPITER_PHASE0, soi: JUPITER_SOI,
    atm: 0, atmH: 14000, rho0: 0, omega: (2 * Math.PI) / 14000,
  },
  io: defMoon('io', 'Io', '🌋', '#fde047', 0xfacc15, 'jupiter', MU_JUPITER, 185e3, 1.80, 4200e3, 950e3, 0.4),
  europa: defMoon('europa', 'Europa', '🧊', '#bae6fd', 0x7dd3fc, 'jupiter', MU_JUPITER, 160e3, 1.31, 7400e3, 1050e3, 2.1),
  ganymede: defMoon('ganymede', 'Ganymede', '🌕', '#d6d3d1', 0xa8a29e, 'jupiter', MU_JUPITER, 260e3, 1.43, 11800e3, 1450e3, -1.3),
  callisto: defMoon('callisto', 'Callisto', '🪨', '#a8a29e', 0x78716c, 'jupiter', MU_JUPITER, 240e3, 1.24, 17500e3, 1600e3, 3.2),

  saturn: {
    name: 'saturn', label: 'Sao Thổ', icon: '🪐', color: '#fcd34d', hex: 0xfbbf24,
    parent: 'sun', gasGiant: true,
    R: R_SATURN, g: G_SATURN, mu: MU_SATURN, a: SATURN_A, n: SATURN_N, phase0: SATURN_PHASE0, soi: SATURN_SOI,
    atm: 0, atmH: 13000, rho0: 0, omega: (2 * Math.PI) / 15500,
  },
  mimas: defMoon('mimas', 'Mimas', '🪨', '#e2e8f0', 0xcbd5e1, 'saturn', MU_SATURN, 55e3, 0.38, 3400e3, 380e3, 0.5),
  enceladus: defMoon('enceladus', 'Enceladus', '❄️', '#f8fafc', 0xe2e8f0, 'saturn', MU_SATURN, 70e3, 0.42, 5200e3, 440e3, 1.8),
  tethys: defMoon('tethys', 'Tethys', '🧊', '#e2e8f0', 0xcbd5e1, 'saturn', MU_SATURN, 95e3, 0.55, 7400e3, 560e3, -0.9),
  dione: defMoon('dione', 'Dione', '🌕', '#cbd5e1', 0x94a3b8, 'saturn', MU_SATURN, 105e3, 0.62, 10000e3, 640e3, 2.7),
  rhea: defMoon('rhea', 'Rhea', '🌕', '#d6d3d1', 0xa8a29e, 'saturn', MU_SATURN, 130e3, 0.76, 13200e3, 780e3, -2.2),
  titan: defMoon('titan', 'Titan', '🟠', '#f59e0b', 0xf59e0b, 'saturn', MU_SATURN, 255e3, 1.35, 18000e3, 1650e3, 1.1, 65e3, 8000, 1.5),
  iapetus: defMoon('iapetus', 'Iapetus', '🌓', '#d6d3d1', 0xa8a29e, 'saturn', MU_SATURN, 125e3, 0.68, 23500e3, 950e3, -3.0),

  uranus: {
    name: 'uranus', label: 'Sao Thiên Vương', icon: '🩵', color: '#67e8f9', hex: 0x22d3ee,
    parent: 'sun', gasGiant: true,
    R: R_URANUS, g: G_URANUS, mu: MU_URANUS, a: URANUS_A, n: URANUS_N, phase0: URANUS_PHASE0, soi: URANUS_SOI,
    atm: 0, atmH: 11000, rho0: 0, omega: (2 * Math.PI) / 24000,
  },
  miranda: defMoon('miranda', 'Miranda', '🪨', '#cbd5e1', 0x94a3b8, 'uranus', MU_URANUS, 60e3, 0.35, 2800e3, 380e3, 0.8),
  ariel: defMoon('ariel', 'Ariel', '🧊', '#e2e8f0', 0xcbd5e1, 'uranus', MU_URANUS, 95e3, 0.58, 5200e3, 560e3, 2.3),
  umbriel: defMoon('umbriel', 'Umbriel', '🌑', '#94a3b8', 0x64748b, 'uranus', MU_URANUS, 95e3, 0.56, 8000e3, 600e3, -1.5),
  titania: defMoon('titania', 'Titania', '🌕', '#d6d3d1', 0xa8a29e, 'uranus', MU_URANUS, 135e3, 0.82, 11600e3, 850e3, 1.4),
  oberon: defMoon('oberon', 'Oberon', '🪨', '#a8a29e', 0x78716c, 'uranus', MU_URANUS, 130e3, 0.78, 15800e3, 920e3, -2.6),

  neptune: {
    name: 'neptune', label: 'Sao Hải Vương', icon: '🔵', color: '#60a5fa', hex: 0x3b82f6,
    parent: 'sun', gasGiant: true,
    R: R_NEPTUNE, g: G_NEPTUNE, mu: MU_NEPTUNE, a: NEPTUNE_A, n: NEPTUNE_N, phase0: NEPTUNE_PHASE0, soi: NEPTUNE_SOI,
    atm: 0, atmH: 11000, rho0: 0, omega: (2 * Math.PI) / 23000,
  },
  triton: defMoon('triton', 'Triton', '❄️', '#fbcfe8', 0xf472b6, 'neptune', MU_NEPTUNE, 165e3, 0.78, 6800e3, 1250e3, 1.7),

  pluto: {
    name: 'pluto', label: 'Sao Diêm Vương', icon: '🟤', color: '#fdba74', hex: 0xd97706,
    parent: 'sun',
    R: R_PLUTO, g: G_PLUTO, mu: MU_PLUTO, a: PLUTO_A, n: PLUTO_N, phase0: PLUTO_PHASE0, soi: PLUTO_SOI,
    atm: 0, atmH: 1, rho0: 0, omega: PLUTO_N,
  },
};

export const PLANET_LIST = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
export const EXTRA_MOON_LIST = [
  'phobos', 'deimos',
  'io', 'europa', 'ganymede', 'callisto',
  'mimas', 'enceladus', 'tethys', 'dione', 'rhea', 'titan', 'iapetus',
  'miranda', 'ariel', 'umbriel', 'titania', 'oberon',
  'triton',
];
export const NON_EARTH_BODIES = [...PLANET_LIST, ...EXTRA_MOON_LIST];

// Moons first so refBody() checks inner satellite SOIs before parent planet SOIs
export const SATELLITE_BODIES = [...EXTRA_MOON_LIST, 'moon', ...PLANET_LIST, 'sun'];

// ---- Space station (orbits Earth)
export const ISS_ALT = 400e3;
export const ISS_R = R_E + ISS_ALT;
export const ISS_N = Math.sqrt(MU_E / ISS_R ** 3);

// ---- Recovery sites (surface "unrolled" downrange coordinate, metres east of the pad)
export const LZ_X = -1600;                   // land landing zone (west of pad, inland)
export const COAST_X = 2600;                 // approximate coastline (ocean to the east)
