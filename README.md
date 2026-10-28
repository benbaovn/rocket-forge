# 🚀 Rocket Forge — 3D Solar System & Spacecraft Simulator

**Rocket Forge** là trình mô phỏng lắp ráp tên lửa, máy bay, xe tự hành (Rover), tàu thuyền và thám hiểm Hệ Mặt Trời 3D thời gian thực chạy trực tiếp trên trình duyệt với đồ họa **Three.js WebGL2 PBR + Ray-Marched Atmosphere**.

---

## ✨ Tính năng nổi bật

- **🏗️ Xưởng lắp ráp phương tiện 3D (VAB)**:
  - Tự do kéo thả, lắp ghép phân tầng (multi-stage), gắn đối xứng bên hông và xoay linh kiện 3D theo 3 trục `X / Y / Z`.
  - Hỗ trợ đa dạng phương tiện: **Tên lửa nhiều tầng**, **Tàu vũ trụ tái sử dụng**, **Tiêm kích phản lực (Fighter Jet)**, **Xe địa hình (Planetary Rover 4x4)** và **Canô lướt sóng (Speedboat)**.
  - Hệ thống động cơ tiên tiến: **Động cơ Phản Trọng Lực Lượng Tử**, **Động cơ Lazer Năng Lượng Cao** và **Cục Pin Năng Lượng** chuyên dụng, cùng các mẫu tên lửa lịch sử (**Saturn V**, **Soyuz R-7**, **N1**, **Falcon 9**, **Starship**, **SLS Artemis**...).

- **🌌 Hệ Mặt Trời 3D rộng lớn & Bản đồ quỹ đạo trực quan (`M`)**:
  - Mô phỏng quỹ đạo Kepler & tích phân số RK4 thời gian thực với vùng trọng lực (SOI) bao phủ toàn bộ Hệ Mặt Trời:
    - **Mặt Trời (Sun)** và **Vành đai đá (Asteroid Belt)** giữa Sao Hỏa & Sao Mộc.
    - **Các hành tinh đá & hành tinh lùn**: Sao Thủy (*Mercury*), Sao Kim (*Venus*), Trái Đất (*Earth*), Sao Hỏa (*Mars*), Sao Diêm Vương (*Pluto*).
    - **Các hành tinh khí/băng khổng lồ đi xuyên qua được**: Sao Mộc (*Jupiter*), Sao Thổ (*Saturn* kèm vành đai 3D), Sao Thiên Vương (*Uranus* kèm vành đai), Sao Hải Vương (*Neptune*).
    - **20 Mặt trăng & Vệ tinh tự nhiên**: *Moon*, *Phobos*, *Deimos*, *Io*, *Europa*, *Ganymede*, *Callisto*, *Mimas*, *Enceladus*, *Tethys*, *Dione*, *Rhea*, *Titan*, *Iapetus*, *Miranda*, *Ariel*, *Umbriel*, *Titania*, *Oberon*, *Triton* cùng **Trạm Vũ Trụ Quốc Tế (ISS)**.

- **🤖 Hệ thống Lái tự động (Autopilot `G`) & 28 Nhiệm vụ**:
  - Tự động phóng lên quỹ đạo, thu hồi tầng đẩy hạ cánh xuống bãi đáp / sà lan trên biển như SpaceX, ghép nối cổng Docking với trạm ISS, chuyển quỹ đạo liên hành tinh và hạ cánh cắm cờ trên các hành tinh & mặt trăng.
  - Hỗ trợ song ngữ **Tiếng Việt (VI)** và **Tiếng Anh (EN)**.

---

## 🎮 Phím điều khiển

| Phím | Chức năng |
| :--- | :--- |
| `Space` | Bắt đầu đếm ngược / Phóng / Tách tầng tiếp theo |
| `W` / `S` / `A` / `D` hoặc `↑` `↓` `←` `→` | Điều khiển hướng mũi tàu 3D / Lái xe Rover, Thuyền, Máy bay |
| `Shift` / `Ctrl` | Tăng / Giảm mức ga (Throttle) |
| `Z` / `X` | Mở tối đa (100%) / Tắt hẳn (0%) động cơ |
| `G` | Bật / Tắt Lái tự động theo nhiệm vụ (Mission Autopilot) |
| `T` | Bật / Tắt hệ thống giữ hướng tự động (SAS) |
| `P` | Bung / Thu chân đáp, cánh lưới và dù hạ cánh |
| `I` `K` `J` `L` `H` `N` | Điều khiển động cơ đẩy phụ RCS khi ghép nối ISS |
| `,` / `.` | Giảm / Tăng tốc độ tua thời gian (Time Warp `1×` → `10000×`) |
| `M` | Mở / Đóng Bản đồ Quỹ đạo Hệ Mặt Trời 3D |
| `C` | Chuyển đổi góc nhìn Camera |
| `O` | Mở bảng Cài đặt đồ họa & Ngôn ngữ |

---

## 🛠️ Cài đặt & Chạy dự án

```bash
# 1. Cài đặt dependencies
npm install

# 2. Chạy server phát triển (Vite)
npm run dev

# 3. Build bản phân phối
npm run build
```

---

vibe code with Antigravity
