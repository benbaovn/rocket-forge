# 🚀 Rocket Forge — 3D Solar System & Spacecraft Simulator

**Rocket Forge** is a real-time 3D rocket, aircraft, planetary rover, watercraft, and Solar System exploration simulator running directly in the browser, powered by **Three.js WebGL2 PBR + Ray-Marched Atmosphere**.

---

## ✨ Key Features

- **🏗️ 3D Vehicle Assembly Building (VAB)**:
  - Drag-and-drop multi-stage rocket assembly, radial side-mounting with symmetry, and full 3-axis 3D part rotation (`X / Y / Z`).
  - Build diverse vehicles: **Multi-Stage Orbital Rockets**, **Reusable Boosters**, **Supersonic Fighter Jets**, **4x4 Planetary Rovers**, and **High-Speed Watercraft**.
  - Advanced propulsion & power systems: **Quantum Anti-Gravity Engines**, **High-Energy Laser Thrusters**, and dedicated **Quantum Energy Batteries**, alongside historic and modern rocket presets (**Saturn V**, **Soyuz R-7**, **Soviet N1**, **Falcon 9**, **Falcon Heavy**, **Starship & Super Heavy**, **SLS Artemis**, and more).

- **🌌 Full 3D Solar System & Interactive Orbital Tracking Map (`M`)**:
  - Real-time Keplerian orbital mechanics & RK4 numerical trajectory integration with Spheres of Influence (SOI) spanning the entire Solar System:
    - **The Sun** and the **Main Asteroid Belt** between Mars and Jupiter.
    - **Terrestrial & Dwarf Planets**: *Mercury*, *Venus*, *Earth*, *Mars*, and *Pluto*.
    - **Pass-Through Gas & Ice Giants**: *Jupiter*, *Saturn* (with 3D planetary rings), *Uranus* (with 3D rings), and *Neptune*.
    - **20 Natural Moons**: *Moon*, *Phobos*, *Deimos*, *Io*, *Europa*, *Ganymede*, *Callisto*, *Mimas*, *Enceladus*, *Tethys*, *Dione*, *Rhea*, *Titan*, *Iapetus*, *Miranda*, *Ariel*, *Umbriel*, *Titania*, *Oberon*, and *Triton*, plus the **International Space Station (ISS)**.

- **🤖 Mission Autopilot (`G`) & 28 Guided Missions**:
  - Automated ascent to orbit, SpaceX-style first-stage boostback & pad/drone-ship landing recovery, ISS rendezvous & RCS docking, interplanetary transfers, and powered descents onto planets and moons across the Solar System.
  - Full bilingual support (**English** & **Vietnamese**).

---

## 🎮 Controls

| Key | Action |
| :--- | :--- |
| `Space` | Start countdown / Launch / Stage separation |
| `W` / `S` / `A` / `D` or `↑` `↓` `←` `→` | 3D attitude steering / Drive Rover, Boat, or Aircraft |
| `Shift` / `Ctrl` | Throttle Up / Throttle Down |
| `Z` / `X` | Full Throttle (100%) / Cut Engines (0%) |
| `G` | Toggle Mission Autopilot |
| `T` | Toggle Stability Assist System (SAS) |
| `P` | Deploy / Retract landing legs, grid fins, and parachutes |
| `I` `K` `J` `L` `H` `N` | RCS translational thrusters for ISS docking |
| `,` / `.` | Decrease / Increase Time Warp (`1×` → `10000×`) |
| `M` | Toggle 3D Solar System Orbital Map |
| `C` | Cycle Camera views |
| `O` | Open Graphics & Language Settings |

---

## 🛠️ Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Build for production
npm run build
```

---

vibe code with Antigravity
