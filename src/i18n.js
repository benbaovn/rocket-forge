// Bilingual localization (Vietnamese 'vi' <-> English 'en')
import { PARTS } from './parts.js';
import { MISSIONS, ROVER_LOOP_SPECS, PLANE_LOOP_SPECS } from './missions.js';
import { BODIES } from './sim/constants.js';

let currentLang = 'en';
try {
  currentLang = (typeof localStorage !== 'undefined' && localStorage?.getItem && localStorage.getItem('rf-lang-v2')) || 'en';
} catch { /* ignore */ }
if (currentLang !== 'vi' && currentLang !== 'en') currentLang = 'en';

export function getLang() {
  return currentLang;
}

export function isEn() {
  return currentLang === 'en';
}

export function tr(vi, en) {
  return currentLang === 'en' ? en : vi;
}

export const PART_I18N = {
  nose: {
    vi: { name: 'Mũi khí động', cat: 'Đầu', desc: 'Giảm lực cản không khí' },
    en: { name: 'Aerodynamic Nose Cone', cat: 'Command & Nose', desc: 'Reduces atmospheric drag' },
  },
  capsule: {
    vi: { name: 'Khoang phi hành', cat: 'Đầu', desc: 'Chở 3 phi hành gia + tháp thoát hiểm + dù hạ cánh' },
    en: { name: 'Crew Capsule', cat: 'Command & Nose', desc: 'Carries 3 astronauts + launch escape tower + parachute' },
  },
  dockPort: {
    vi: { name: 'Cổng docking', cat: 'Đầu', desc: 'Ghép nối với trạm vũ trụ ISS' },
    en: { name: 'Docking Port', cat: 'Command & Nose', desc: 'Docks with the ISS space station' },
  },
  tankS: {
    vi: { name: 'Bồn nhiên liệu S', cat: 'Nhiên liệu', desc: '4 tấn nhiên liệu' },
    en: { name: 'Fuel Tank S', cat: 'Fuel Tanks', desc: '4 tons of propellant' },
  },
  tankM: {
    vi: { name: 'Bồn nhiên liệu M', cat: 'Nhiên liệu', desc: '9 tấn nhiên liệu' },
    en: { name: 'Fuel Tank M', cat: 'Fuel Tanks', desc: '9 tons of propellant' },
  },
  tankL: {
    vi: { name: 'Bồn nhiên liệu L', cat: 'Nhiên liệu', desc: '18 tấn nhiên liệu' },
    en: { name: 'Fuel Tank L', cat: 'Fuel Tanks', desc: '18 tons of propellant' },
  },
  batteryPack: {
    vi: { name: 'Cục Pin Năng Lượng', cat: 'Nhiên liệu', desc: 'Pin lượng tử siêu tụ điện chuyên dụng cung cấp nguồn năng lượng cho Động cơ Lazer và Động cơ Phản Trọng Lực' },
    en: { name: 'Quantum Energy Battery', cat: 'Fuel Tanks', desc: 'High-capacity quantum supercapacitor battery cell powering Laser and Anti-Gravity engines' },
  },
  batteryPackL: {
    vi: { name: 'Cục Pin Năng Lượng Lớn (50 Tấn)', cat: 'Nhiên liệu', desc: 'Siêu Pin Lượng Tử cỡ đại chứa 50 tấn năng lượng (chỉ dùng cho Động cơ Phản Trọng Lực và Động cơ Lazer, không dùng cho động cơ thường)' },
    en: { name: 'Giant Quantum Battery Pack (50t)', cat: 'Fuel Tanks', desc: 'Massive 50-ton quantum supercapacitor battery bank (exclusively for Anti-Gravity and Laser engines)' },
  },
  engHeavy: {
    vi: { name: 'Động cơ Sấm Sét', cat: 'Động cơ', desc: '4 buồng đốt, lực đẩy cực lớn' },
    en: { name: 'Thunder Heavy Engine', cat: 'Engines', desc: '4 combustion chambers, massive liftoff thrust' },
  },
  engReuse: {
    vi: { name: 'Động cơ Đại Bàng', cat: 'Động cơ', desc: 'Cụm 9 động cơ (octaweb), khởi động lại được – dùng cho tầng hạ cánh' },
    en: { name: 'Falcon 9-Engine Cluster', cat: 'Engines', desc: '9-engine octaweb cluster, restartable for booster landing' },
  },
  engMid: {
    vi: { name: 'Động cơ Đa Năng', cat: 'Động cơ', desc: 'Cân bằng lực đẩy & hiệu suất' },
    en: { name: 'Versatile Mid Engine', cat: 'Engines', desc: 'Balanced thrust and efficiency' },
  },
  engVac: {
    vi: { name: 'Động cơ Chân Không', cat: 'Động cơ', desc: 'Hiệu suất cao ngoài không gian' },
    en: { name: 'Vacuum Engine', cat: 'Engines', desc: 'High specific impulse in outer space' },
  },
  engAntiGrav: {
    vi: { name: 'Động cơ Phản Trọng Lực', cat: 'Động cơ', desc: 'Bắt buộc dùng Cục Pin Năng Lượng (không dùng bồn nhiên liệu thường) · Đẩy bằng trường phản trọng lực: trọng lực càng mạnh gia tốc càng nhanh' },
    en: { name: 'Quantum Anti-Gravity Engine', cat: 'Engines', desc: 'Requires Quantum Energy Battery (cannot use regular fuel tanks) · Propels via gravity fields: stronger gravity yields faster acceleration' },
  },
  engLaser: {
    vi: { name: 'Động cơ Lazer Năng Lượng Cao', cat: 'Động cơ', desc: 'Bắt buộc dùng Cục Pin Năng Lượng (không dùng bồn nhiên liệu thường) · Phóng tia lazer hội tụ: chỗ càng tối gia tốc càng nhanh' },
    en: { name: 'High-Energy Laser Thruster', cat: 'Engines', desc: 'Requires Quantum Energy Battery (cannot use regular fuel tanks) · Collimated photon-plasma thruster: accelerates faster in darkness' },
  },
  decoupler: {
    vi: { name: 'Bộ tách tầng', cat: 'Cấu trúc', desc: 'Tách tầng bằng phím SPACE' },
    en: { name: 'Stage Decoupler', cat: 'Structural', desc: 'Separates stages with SPACE key' },
  },
  heatShield: {
    vi: { name: 'Khiên chống nhiệt', cat: 'Cấu trúc', desc: 'Khiên chống nhiệt màu vàng đậm chịu nhiệt độ cực cao · Chống cháy nổ do lực ma sát không khí và tăng lực cản phanh khí động mỗi khi rơi xuống bầu khí quyển' },
    en: { name: 'Atmospheric Heat Shield', cat: 'Structural', desc: 'Dark-yellow ablative thermal protection shield · Prevents atmospheric friction burn-up and boosts aerodynamic braking every time you descend into an atmosphere' },
  },
  fins: {
    vi: { name: 'Cánh ổn định ×4', cat: 'Cấu trúc', desc: 'Gắn vào bồn – giữ tên lửa bay thẳng' },
    en: { name: 'Stabilizer Fins ×4', cat: 'Structural', desc: 'Attaches to tank – keeps rocket aerodynamic' },
  },
  legs: {
    vi: { name: 'Chân hạ cánh ×4', cat: 'Cấu trúc', desc: 'Gắn vào bồn dưới cùng của tầng – bung ra khi hạ cánh' },
    en: { name: 'Landing Legs ×4', cat: 'Structural', desc: 'Attaches to bottom tank – deploys for landing' },
  },
  gridfins: {
    vi: { name: 'Cánh lưới ×4', cat: 'Cấu trúc', desc: 'Gắn ở bồn trên cùng của tầng – điều hướng khi rơi về' },
    en: { name: 'Grid Fins ×4', cat: 'Structural', desc: 'Attaches to top tank of booster – steers during descent' },
  },
  solarPanel: {
    vi: { name: 'Cánh pin mặt trời ×2', cat: 'Cấu trúc', desc: 'Cặp cánh pin mặt trời đa tầng · Khi gắn vào Cục Pin Năng Lượng sẽ tự động sạc hồi năng lượng cho pin' },
    en: { name: 'Solar Array Wings ×2', cat: 'Structural', desc: 'Dual deployable solar arrays · Automatically regenerates battery energy when attached to a Quantum Battery Pack' },
  },
  solarUfo: {
    vi: { name: 'Cánh Pin Mặt Trời UFO Cong Rực Rỡ ×4', cat: 'UFO', desc: 'Bộ 4 cánh pin mặt trời lượng tử UFO uốn cong mềm mại phát sáng cầu vồng rực rỡ · Tự động hấp thụ quang năng vũ trụ sạc hồi Pin siêu tốc cho UFO' },
    en: { name: 'Radiant Curved UFO Solar Wings ×4', cat: 'UFO', desc: 'Quad gently curved prismatic UFO quantum solar wings glowing with radiant multi-spectrum light · Rapidly regenerates UFO battery energy' },
  },
  solarUltra: {
    vi: { name: 'Pin Mặt Trời Siêu Nhỏ (Ultra) ×2', cat: 'Cấu trúc', desc: 'Cặp cánh pin mặt trời vi mô siêu nhỏ (0.004 tấn) · Chỉ gắn trực tiếp vào Pin Siêu Siêu Nhỏ (Gắn Súng) để tự động sạc hồi năng lượng pin' },
    en: { name: 'Ultra-Tiny Solar Panel ×2', cat: 'Structural', desc: 'Ultra-compact micro photovoltaic wings (0.004t) · Only attaches directly onto Ultra-Tiny Gun Batteries to automatically recharge battery energy' },
  },
  gunLaser: {
    vi: { name: 'Súng Lazer Siêu Hạng ×2', cat: 'Vũ khí', desc: 'Cặp pháo Lazer xoay 360° bắn tia plasma tốc độ ánh sáng tiêu diệt Alien · Súng chỉ xài Pin (gắn Pin Siêu Siêu Nhỏ cho tên lửa nhiên liệu thường, hoặc dùng Cục Pin Năng Lượng) (Phím V)' },
    en: { name: 'Twin Plasma Laser Turrets ×2', cat: 'Weapons', desc: '360° gimbaled high-energy laser cannons that vaporize Aliens · Guns only run on Battery (attach Ultra-Tiny Gun Battery on regular-fuel rockets, or use Quantum Battery Pack) (Press V)' },
  },
  waterCannon: {
    vi: { name: 'Máy Phun Nước 1,000,000 PSI ×2', cat: 'Vũ khí', desc: 'Đại bác siêu áp lực 1,000,000 PSI bắn tia nước cắt kim cương nghiền nát Alien · Súng chỉ xài Pin (gắn Pin Siêu Siêu Nhỏ cho tên lửa nhiên liệu thường, hoặc dùng Cục Pin Năng Lượng) (Phím V)' },
    en: { name: '1,000,000 PSI Water Cannon ×2', cat: 'Weapons', desc: 'Ultra-high-pressure 1,000,000 PSI supersonic hydro-jet cannons that shred Aliens · Guns only run on Battery (attach Ultra-Tiny Gun Battery on regular-fuel rockets, or use Quantum Battery Pack) (Press V)' },
  },
  gunAcid: {
    vi: { name: 'Súng Acid Ăn Mòn ×2', cat: 'Vũ khí', desc: 'Cặp pháo phun Acid Siêu Ăn Mòn xoay 360° làm tan chảy giáp và rút máu Alien liên tục · Súng chỉ xài Pin (gắn Pin Siêu Siêu Nhỏ cho tên lửa nhiên liệu thường, hoặc dùng Cục Pin Năng Lượng) (Phím V)' },
    en: { name: 'Corrosive Acid Cannon ×2', cat: 'Weapons', desc: '360° gimbaled bio-acid sprayers firing toxic acid streams · Guns only run on Battery (attach Ultra-Tiny Gun Battery on regular-fuel rockets, or use Quantum Battery Pack) (Press V)' },
  },
  gunElectric: {
    vi: { name: 'Súng Điện 1,000,000 WATT ×2', cat: 'Vũ khí', desc: 'Cặp pháo điện Tesla 1,000,000 WATT phóng tia hồ quang sấm sét giật tê liệt & truyền điện lan sang các Alien xung quanh · Súng chỉ xài Pin (gắn Pin Siêu Siêu Nhỏ cho tên lửa nhiên liệu thường, hoặc dùng Cục Pin Năng Lượng) (Phím V)' },
    en: { name: '1,000,000 WATT Electric Cannon ×2', cat: 'Weapons', desc: '360° gimbaled 1,000,000 WATT Tesla arc cannons that unleash chain lightning · Guns only run on Battery (attach Ultra-Tiny Gun Battery on regular-fuel rockets, or use Quantum Battery Pack) (Press V)' },
  },
  batteryGun: {
    vi: { name: 'Pin Siêu Siêu Nhỏ (Gắn Súng) ×2', cat: 'Vũ khí', desc: 'Cục pin vi mô siêu siêu nhỏ (0.005 tấn) gắn trực tiếp vào Súng (Lazer / Nước / Acid / Điện) dành riêng cho tên lửa xài nhiên liệu thường (vì súng chỉ hoạt động bằng pin)' },
    en: { name: 'Ultra-Tiny Gun Battery ×2', cat: 'Weapons', desc: 'Ultra-micro battery pack (0.005t) that attaches directly onto Guns (Laser / Water / Acid / Electric) for regular-fuel rockets (guns only run on battery power)' },
  },
  booster: {
    vi: { name: 'Tên lửa đẩy phụ ×2', cat: 'Động cơ', desc: 'Nhiên liệu rắn, tự tách khi cháy hết' },
    en: { name: 'Solid Rocket Boosters ×2', cat: 'Engines', desc: 'Solid fuel boosters, auto-jettison on burnout' },
  },
  cockpitRover: {
    vi: { name: 'Cabin xe Rover', cat: 'Xe', desc: 'Khoang lái thám hiểm với vòm kính quan sát và đèn pha' },
    en: { name: 'Rover Cockpit', cat: 'Rover', desc: 'Exploration cabin with panoramic glass dome & headlights' },
  },
  chassisRover: {
    vi: { name: 'Khung gầm Rover', cat: 'Xe', desc: 'Khung gầm chịu lực tích hợp khối pin năng lượng và khớp gắn trục' },
    en: { name: 'Rover Chassis', cat: 'Rover', desc: 'Heavy-duty chassis with integrated battery pack & axle mounts' },
  },
  wheelsRover: {
    vi: { name: 'Bánh xe địa hình ×4', cat: 'Xe', desc: '4 bánh xe lốp cao su gai bám đường địa hình hành tinh' },
    en: { name: 'Off-Road Wheels ×4', cat: 'Rover', desc: '4 high-grip treaded planetary rover wheels' },
  },
  solarRover: {
    vi: { name: 'Tấm pin Rover ×2', cat: 'Xe', desc: 'Cặp pin mặt trời tự động sạc điện khi di chuyển' },
    en: { name: 'Rover Solar Panels ×2', cat: 'Rover', desc: 'Twin solar panels recharging power on the move' },
  },
  cabinBoat: {
    vi: { name: 'Đài Chỉ Huy Thuyền To', cat: 'Thuyền', desc: 'Tầng thượng Thuyền to với buồng lái kính vòm panorama, mái năng lượng mặt trời và radar kép' },
    en: { name: 'Big Boat Bridge & Sky-Lounge', cat: 'Boat', desc: 'Big Boat upper deck with panoramic smart-glass bridge, solar canopy and dual radar domes' },
  },
  hullBoat: {
    vi: { name: 'Thân Thuyền To', cat: 'Thuyền', desc: 'Thân Thuyền to đa tầng có mũi rẽ sóng, hồ bơi vô cực Jacuzzi, bãi đáp trực thăng và dải đèn LED' },
    en: { name: 'Big Boat Hull', cat: 'Boat', desc: 'Multi-deck Big Boat hull with wave-piercing bow, infinity Jacuzzi pool, helipad and neon LED trim' },
  },
  motorBoat: {
    vi: { name: 'Động Cơ Thuyền To (Hydro-Jet & Chân Vịt Kép)', cat: 'Thuyền', desc: 'Đáy ngầm khí động học của Thuyền to tích hợp cặp chân vịt Azimuth Pod và họng đẩy phản lực nước Plasma' },
    en: { name: 'Big Boat Engine (Hydro-Jet & Twin Pods)', cat: 'Boat', desc: 'Hydrodynamic Big Boat keel with twin azimuth pods and plasma water-jet propulsion' },
  },
  floatsBoat: {
    vi: { name: 'Cánh Ngầm & Phao Thuyền To ×2', cat: 'Thuyền', desc: 'Cặp phao khí động Trimaran kết hợp cánh ngầm Hydrofoil phát sáng giúp Thuyền to lướt êm trên sóng' },
    en: { name: 'Big Boat Hydrofoil Sponsons ×2', cat: 'Boat', desc: 'Sleek trimaran sponsons with submerged carbon hydrofoil wings and neon LED strips for the Big Boat' },
  },
  cabinSailBoat: {
    vi: { name: 'Boong Lái & Cột Trụ Thuyền Nhỏ', cat: 'Thuyền', desc: 'Khoang kính hiện đại của Thuyền nhỏ, cặp vô-lăng carbon và cột trụ khí động không cánh buồm tích hợp radar & cảm biến laser' },
    en: { name: 'Small Boat Helm & Carbon Mast', cat: 'Boat', desc: 'Panoramic glass coachroof of the Small Boat, twin carbon helm wheels & sleek sail-free carbon mast with radar and laser wind sensors' },
  },
  hullSailBoat: {
    vi: { name: 'Thân Thuyền Nhỏ', cat: 'Thuyền', desc: 'Thân Thuyền nhỏ dáng thon gọn mũi rẽ sóng, sàn gỗ Teak & Carbon, buồng lái mở và dải đèn LED' },
    en: { name: 'Small Boat Hull', cat: 'Boat', desc: 'Sleek Small Boat hull with plumb wave-piercing bow, carbon bowsprit, slatted teak deck & LED trim' },
  },
  motorSailBoat: {
    vi: { name: 'Động Cơ Thuyền Nhỏ (Turbo Kép & Chân Vịt)', cat: 'Thuyền', desc: 'Cặp động cơ Turbo-Jet hiện đại gắn đuôi Thuyền nhỏ kèm chân vịt kép xoay ngược chiều, bánh lái đôi và sống đáy cân bằng' },
    en: { name: 'Small Boat Twin Turbo Engine', cat: 'Boat', desc: 'Twin modern stern-mounted turbo-jet marine engines for the Small Boat with counter-rotating propellers, twin rudders & bulb keel' },
  },
  cockpitPlane: {
    vi: { name: 'Cabin tiêm kích Jet', cat: 'Máy bay', desc: 'Buồng lái tiêm kích tàng hình với kính vòm chống chói, HUD và mũi kim khí động' },
    en: { name: 'Fighter Jet Cockpit', cat: 'Aircraft', desc: 'Stealth fighter canopy cockpit with HUD and nose pitot' },
  },
  fuselagePlane: {
    vi: { name: 'Thân máy bay Jet', cat: 'Máy bay', desc: 'Thân máy bay khí động học chứa thùng nhiên liệu JP-8 và cửa hút khí' },
    en: { name: 'Jet Fuselage', cat: 'Aircraft', desc: 'Aerodynamic airframe with JP-8 fuel bay and air intakes' },
  },
  wingsPlane: {
    vi: { name: 'Cánh nâng phản lực ×2', cat: 'Máy bay', desc: 'Cặp cánh swept-wing tạo lực nâng khí động học cất cánh và lượn trên trời' },
    en: { name: 'Swept Jet Wings ×2', cat: 'Aircraft', desc: 'Swept wings generating aerodynamic lift for flight' },
  },
  tailPlane: {
    vi: { name: 'Đuôi đứng & Cánh lái', cat: 'Máy bay', desc: 'Cụm đuôi chữ V đôi nghiêng và cánh lái ngang thăng bằng' },
    en: { name: 'Twin V-Tail & Elevators', cat: 'Aircraft', desc: 'Canted twin vertical stabilizers and pitch elevators' },
  },
  engJet: {
    vi: { name: 'Động cơ phản lực Afterburner', cat: 'Máy bay', desc: 'Động cơ tuốc-bin phản lực tăng lực siêu âm, lực đẩy cực mạnh trong khí quyển' },
    en: { name: 'Afterburning Turbofan Jet', cat: 'Aircraft', desc: 'Supersonic afterburning jet engine with high atmospheric thrust' },
  },
  gearPlane: {
    vi: { name: 'Càng đáp máy bay 3 bánh', cat: 'Máy bay', desc: 'Bộ 3 càng đáp bánh xe cao su chịu tải giúp chạy đà cất cánh & hạ cánh' },
    en: { name: 'Tricycle Landing Gear', cat: 'Aircraft', desc: '3-wheel landing gear assembly for runway takeoff and landing' },
  },
  saturnApollo: {
    vi: { name: 'Tàu Chỉ Huy Apollo CM & Tháp LES (Tầng 8)', cat: 'Đầu', desc: 'Khoang chỉ huy Apollo (CM) bọc nón trắng + tháp thoát hiểm LES & dù hạ cánh' },
    en: { name: 'Apollo Command Module & LES Tower (Stage 8)', cat: 'Command & Nose', desc: 'Apollo Command Module in white boost cover + Launch Escape Tower & parachutes' },
  },
  saturnSM: {
    vi: { name: 'Khoang Dịch Vụ Apollo SM (Tầng 7)', cat: 'Nhiên liệu', desc: 'Khoang dịch vụ Apollo SM có tấm tản nhiệt xám bạc, 4 cụm RCS và động cơ SPS' },
    en: { name: 'Apollo Service Module SM (Stage 7)', cat: 'Fuel Tanks', desc: 'Apollo Service Module with radiator panels, 4 RCS quads & SPS engine' },
  },
  saturnSLA: {
    vi: { name: 'Khoang Côn SLA & Tàu Đổ Bộ LM (Tầng 6)', cat: 'Nhiên liệu', desc: 'Áo côn trắng SLA chứa tàu đổ bộ Mặt Trăng (Lunar Module) kèm động cơ' },
    en: { name: 'SLA Cone & Lunar Module LM (Stage 6)', cat: 'Fuel Tanks', desc: 'White conical Spacecraft-LM Adapter housing the Apollo Lunar Module' },
  },
  saturnS4B: {
    vi: { name: 'Tầng Đẩy S-IVB · 1× J-2 (Tầng 5)', cat: 'Nhiên liệu', desc: 'Tầng đẩy S-IVB thân trụ trắng có vòng đai ngang màu đen và 1 động cơ J-2' },
    en: { name: 'S-IVB Upper Stage · 1× J-2 (Stage 5)', cat: 'Fuel Tanks', desc: 'S-IVB cylindrical stage with bold black band and single J-2 vacuum engine' },
  },
  saturnS4BInter: {
    vi: { name: 'Cổ Côn Chuyển Tầng S-IVB / S-II (Tầng 4)', cat: 'Cấu trúc', desc: 'Cổ côn chuyển tầng sơn khối đen-trắng lệch bậc đặc trưng của Saturn V' },
    en: { name: 'S-IVB / S-II Conical Interstage (Stage 4)', cat: 'Structural', desc: 'Tapered aft interstage frustum with stepped black-and-white roll pattern' },
  },
  saturnS2: {
    vi: { name: 'Tầng Đẩy S-II · 5× J-2 (Tầng 3)', cat: 'Nhiên liệu', desc: 'Tầng đẩy S-II sơn trắng in chữ dọc UNITED STATES cùng cụm 5 động cơ J-2' },
    en: { name: 'S-II Second Stage · 5× J-2 (Stage 3)', cat: 'Fuel Tanks', desc: 'White S-II stage with vertical UNITED STATES markings & 5 J-2 engines' },
  },
  saturnS2Inter: {
    vi: { name: 'Vòng Chuyển Tầng S-II / S-IC (Tầng 2)', cat: 'Cấu trúc', desc: 'Vòng chuyển tầng S-II/S-IC kẻ sọc dọc đen-trắng kèm 8 động cơ đẩy Ullage' },
    en: { name: 'S-II / S-IC Roll-Striped Interstage (Stage 2)', cat: 'Structural', desc: 'Black-and-white vertical roll-striped interstage with 8 ullage motors' },
  },
  saturnS1: {
    vi: { name: 'Tầng Đẩy S-IC · 5× F-1 (Tầng 1)', cat: 'Động cơ', desc: 'Tầng 1 S-IC khổng lồ in cờ Mỹ, chữ USA đỏ, 4 cánh đuôi trắng và 5 siêu động cơ F-1' },
    en: { name: 'S-IC First Stage · 5× F-1 (Stage 1)', cat: 'Engines', desc: 'Giant S-IC first stage with US Flag, red USA markings, 4 white fins & 5 F-1 engines' },
  },
  apollo11CM: {
    vi: { name: 'Tàu Chỉ Huy Apollo 11 CM Bạc & Tháp Mắt Cáo LES (Tầng 8)', cat: 'Đầu', desc: 'Khoang chỉ huy Apollo 11 màu bạc kim loại kèm tháp thoát hiểm khung mắt cáo chữ X hở, đai đỏ và dù hạ cánh' },
    en: { name: 'Apollo 11 Silver Command Module & Lattice LES Tower (Stage 8)', cat: 'Command & Nose', desc: 'Metallic silver Apollo 11 Command Module with open diagonal X-lattice escape tower, red collars & parachutes' },
  },
  apollo11SM: {
    vi: { name: 'Khoang Dịch Vụ Apollo 11 SM Ánh Bạc (Tầng 7)', cat: 'Nhiên liệu', desc: 'Khoang dịch vụ Apollo 11 màu bạc kim loại có 2 đai tản nhiệt trắng và 4 cụm động cơ điều hướng RCS đầu đỏ' },
    en: { name: 'Apollo 11 Silver Service Module SM (Stage 7)', cat: 'Fuel Tanks', desc: 'Metallic silver Apollo 11 Service Module with dual white radiator collars & 4 red-capped RCS thruster quads' },
  },
  apollo11SLA: {
    vi: { name: 'Khoang Côn SLA Cắt Mở Lộ Tàu Đổ Bộ LM Eagle (Tầng 6)', cat: 'Nhiên liệu', desc: 'Áo côn trắng SLA có ô cửa cắt chính diện để lộ Tàu đổ bộ Mặt Trăng (LM Eagle) bọc lá vàng bên trong kèm đai đáy đen gân dọc' },
    en: { name: 'Apollo 11 Cutaway SLA Cone & Lunar Module Eagle (Stage 6)', cat: 'Fuel Tanks', desc: 'White conical SLA adapter with front cutaway bay revealing the gold-foil Lunar Module (Eagle) inside & corrugated black base band' },
  },
  apollo11S4B: {
    vi: { name: 'Tầng Đẩy S-IVB Apollo 11 · Chữ Đỏ USA (Tầng 5)', cat: 'Nhiên liệu', desc: 'Tầng đẩy S-IVB thân trắng in 2 cột chữ USA đỏ dọc thân, cổ gân dọc, 2 cụm động cơ APS chóp đỏ và đai đáy đen' },
    en: { name: 'Apollo 11 S-IVB Stage · Red USA Markings (Stage 5)', cat: 'Fuel Tanks', desc: 'White S-IVB upper stage with dual red vertical USA columns, corrugated upper skirt, red-tipped APS pods & lower black band' },
  },
  apollo11S4BInter: {
    vi: { name: 'Cổ Côn Chuyển Tầng Kẻ Ô Bàn Cờ 2 Tầng Apollo 11 (Tầng 4)', cat: 'Cấu trúc', desc: 'Cổ hình nón cụt kẻ gân dọc chia 2 tầng ô bàn cờ Đen-Trắng đối xứng kèm các chóp cảm biến màu đỏ' },
    en: { name: 'Apollo 11 2-Tier Checkerboard Conical Interstage (Stage 4)', cat: 'Structural', desc: 'Corrugated conical S-IVB/S-II interstage with 2-tier alternating black-and-white checkerboard pattern & red sensor fairings' },
  },
  apollo11S2: {
    vi: { name: 'Tầng Đẩy S-II Apollo 11 · Chữ Đỏ UNITED STATES (Tầng 3)', cat: 'Nhiên liệu', desc: 'Tầng đẩy S-II sơn trắng có cổ trên kẻ gân, cột 8 vạch đen, chữ dọc UNITED STATES màu đỏ và đai đáy đen đậm' },
    en: { name: 'Apollo 11 S-II Stage · Red UNITED STATES & Black Dashes (Stage 3)', cat: 'Fuel Tanks', desc: 'White S-II second stage with corrugated upper collar, 8 black calibration dashes, red vertical UNITED STATES & black bottom band' },
  },
  apollo11S2Inter: {
    vi: { name: 'Vòng Chuyển Tầng S-II / S-IC Kẻ Gân & Ốp Ullage Apollo 11 (Tầng 2)', cat: 'Cấu trúc', desc: 'Vòng chuyển tầng kẻ gân dọc sơn mảng Đen-Trắng xen kẽ kèm các ốp tên lửa Ullage chóp nhọn màu trắng' },
    en: { name: 'Apollo 11 Corrugated S-II / S-IC Interstage & Ullage Pods (Stage 2)', cat: 'Structural', desc: 'Corrugated black-and-white vertical striped interstage with protruding white conical-tipped ullage fairings' },
  },
  apollo11S1: {
    vi: { name: 'Tầng 1 S-IC Apollo 11 · Cánh Đen-Trắng & 5× F-1 Kim Loại (Tầng 1)', cat: 'Động cơ', desc: 'Tầng 1 S-IC in 2 lá cờ Mỹ, chữ USA đỏ, 4 chụp côn & cánh đuôi sơn xen kẽ Đen-Trắng có thẻ chữ A/B/C/D và 5 loa phụt F-1 xám bạc có gân ngang' },
    en: { name: 'Apollo 11 S-IC Stage · Alternating Fins & 5× Metallic F-1 (Stage 1)', cat: 'Engines', desc: 'S-IC first stage with dual US Flags, red vertical USA, alternating white/black conical fairings & fins with letter tabs & 5 ribbed metallic F-1 bells' },
  },
  soyuzNose: {
    vi: { name: 'Mũi Chóp Fairing & Tàu Soyuz (Tầng 5)', cat: 'Đầu', desc: 'Chóp mũi khí động trắng-bạc có ô cửa tròn + khoang tàu Soyuz & dù hạ cánh' },
    en: { name: 'Soyuz Fairing Nose Cone & Spacecraft (Stage 5)', cat: 'Command & Nose', desc: 'White-silver bi-conic nose cone with circular porthole + Soyuz capsule & parachutes' },
  },
  soyuzFairing: {
    vi: { name: 'Khoang Tải Trọng Soyuz & Đai Cam (Tầng 4)', cat: 'Nhiên liệu', desc: 'Thân trụ trắng bảo vệ tàu Soyuz kèm cổ đai màu cam, ống dẫn trắng và ngàm bên' },
    en: { name: 'Soyuz Payload Shroud & Orange Collar (Stage 4)', cat: 'Fuel Tanks', desc: 'White cylindrical payload shroud with bright orange base collar, umbilical tubes & side brackets' },
  },
  soyuzBlockI: {
    vi: { name: 'Tầng Đẩy Block I · Đai Tản Nhiệt & Cam (Tầng 3)', cat: 'Nhiên liệu', desc: 'Tầng 3 Block I màu xanh rêu, vòng tản nhiệt kẻ sọc bạc và đai đáy cam răng cưa' },
    en: { name: 'Soyuz Block I Third Stage (Stage 3)', cat: 'Fuel Tanks', desc: 'Olive-drab Block I stage with corrugated silver radiator collar & toothed orange lower band' },
  },
  soyuzCore: {
    vi: { name: 'Thân Chính Block A & Giàn Mắt Cáo (Tầng 2)', cat: 'Nhiên liệu', desc: 'Thân lõi Block A loe rộng màu xanh rêu, đai ô vuông và giàn khung mắt cáo hở' },
    en: { name: 'Soyuz Block A Central Core & Truss (Stage 2)', cat: 'Fuel Tanks', desc: 'Flared olive-drab Block A core with waffle-grid band & open diagonal lattice interstage truss' },
  },
  soyuzBooster: {
    vi: { name: 'Cụm 4 Tầng Đẩy Phụ Hình Nón R-7 & Đáy Cam (Tầng 1)', cat: 'Động cơ', desc: '4 khối đẩy phụ hình nón R-7 ôm thân chính, váy động cơ màu cam, tấm chắn bạc, 4 cánh đuôi và 20 loa phụt RD-107/108' },
    en: { name: 'Soyuz 4× Conical Boosters Block B/V/G/D (Stage 1)', cat: 'Engines', desc: '4 iconic R-7 conical strap-on boosters, orange engine skirts, silver heatshields, 4 fins & 20 RD-107/108 nozzles' },
  },
  n1Tower: {
    vi: { name: 'Mũi Chóp Tàu LOK & Tháp Thoát Hiểm SAS N1 (Tầng 5)', cat: 'Đầu', desc: 'Chóp mũi trắng bảo vệ tàu Mặt Trăng LOK kèm tháp thoát hiểm SAS có đai động cơ đỏ sẫm & dù hạ cánh' },
    en: { name: 'N1 LOK Fairing Nose & SAS Escape Tower (Stage 5)', cat: 'Command & Nose', desc: 'White conical LOK lunar spacecraft shroud with SAS escape tower, crimson nozzle skirt & parachutes' },
  },
  n1Fairing: {
    vi: { name: 'Khoang Tải Trọng L3 Trắng · Block G/D & LK (Tầng 4)', cat: 'Nhiên liệu', desc: 'Khoang tải trọng Mặt Trăng L3 sơn trắng bóng có chân côn loe và 8 gân nổi khí động dọc' },
    en: { name: 'N1 White L3 Lunar Payload Shroud (Stage 4)', cat: 'Fuel Tanks', desc: 'Glossy white L3 lunar complex shroud with flared conical base skirt & 8 vertical aerodynamic blisters' },
  },
  n1BlockV: {
    vi: { name: 'Tầng 3 N1 (Block V) & Giàn Mắt Cáo Trên (Tầng 3)', cat: 'Nhiên liệu', desc: 'Tầng đẩy hình nón xám kim loại Block V với 8 ống dẫn khí động nổi, giàn mắt cáo 2 tầng và 4 động cơ NK-21' },
    en: { name: 'N1 Block V Third Stage & Upper Truss (Stage 3)', cat: 'Fuel Tanks', desc: 'Conical metallic-grey Block V stage with 8 raised conduit blisters, 2-tier lattice interstage & 4 NK-21 engines' },
  },
  n1BlockB: {
    vi: { name: 'Tầng 2 N1 (Block B) & Giàn Mắt Cáo Giữa (Tầng 2)', cat: 'Nhiên liệu', desc: 'Tầng 2 hình nón xám kim loại Block B kèm khung giàn mắt cáo rỗng 2 tầng lộ bồn cầu bên trong và 8 động cơ NK-15V' },
    en: { name: 'N1 Block B Second Stage & Mid Truss (Stage 2)', cat: 'Fuel Tanks', desc: 'Conical metallic-grey Block B stage with open 2-tier lattice interstage exposing internal spherical tank & 8 NK-15V engines' },
  },
  n1BlockA: {
    vi: { name: 'Tầng 1 Siêu Nặng N1 (Block A · 30× NK-15) (Tầng 1)', cat: 'Động cơ', desc: 'Tầng 1 hình nón khổng lồ màu xám kim loại với 8 khối hộp khí động lớn, 4 cánh lưới chống ngang, váy đáy loe và vòng 30 động cơ NK-15' },
    en: { name: 'N1 Block A Super-Heavy First Stage · 30× NK-15 (Stage 1)', cat: 'Engines', desc: 'Giant conical metallic-grey Block A stage with 8 large faceted blisters, 4 strut-braced fins, flared base skirt & 30 NK-15 engines' },
  },
  buranNose: {
    vi: { name: 'Chóp Mũi Buran-Energia & Đai Gân Caro (Tầng 3)', cat: 'Đầu', desc: 'Chóp mũi khí động màu xám xanh của hệ Buran, bồn trắng trên và đai gân dọc in 2 ô vuông caro đen + dù hạ cánh' },
    en: { name: 'Buran-Energia Nose Cone & Ribbed Checker Collar (Stage 3)', cat: 'Command & Nose', desc: 'Bluish-grey Energia aerodynamic nose cone, white upper tank & vertically ribbed interstage collar with 2 staggered black squares + parachutes' },
  },
  buranShuttle: {
    vi: { name: 'Tàu Con Thoi Buran & Thân Giữa Energia (Tầng 2)', cat: 'Nhiên liệu', desc: 'Tàu vũ trụ con thoi Buran gắn lưng Energia với buồng lái kính đen 6 ô, 2 cửa sổ nóc, mũi gạch chịu nhiệt đen, cánh tam giác kép viền đen, đuôi đứng & dù hạ cánh' },
    en: { name: 'Buran Space Shuttle Orbiter & Mid Energia Core (Stage 2)', cat: 'Fuel Tanks', desc: 'Piggyback Soviet Buran space shuttle orbiter with 6-pane black V-windshield, 2 overhead windows, black thermal nose cap, double-delta wings & vertical tail fin' },
  },
  buranEnergia: {
    vi: { name: 'Tầng Đẩy Buran-Energia & 4 Booster Zenit (Tầng 1)', cat: 'Động cơ', desc: 'Thân dưới Energia kèm 4 tầng đẩy phụ Zenit (Block A) ốp sườn xám xanh, 4 siêu động cơ RD-0120 ở tâm và 4 cụm động cơ RD-170' },
    en: { name: 'Buran-Energia Super-Heavy Core & 4× Zenit Boosters (Stage 1)', cat: 'Engines', desc: 'Lower Energia core with 4 strap-on Zenit (Block A) boosters in bluish-grey shrouds, 4 central RD-0120 cryogenic engines & 4 RD-170 clusters' },
  },
  energiaNose: {
    vi: { name: 'Chóp Mũi Trắng ЭНЕРГИЯ & Đai Caro (Tầng 3)', cat: 'Đầu', desc: 'Chóp mũi trắng của tên lửa siêu nặng Energia in chữ đỏ ЭНЕРГИЯ, đai gân xám in 2 ô vuông caro đen + dù hạ cánh' },
    en: { name: 'Energia White Nose Cone ("ЭНЕРГИЯ") & Checker Collar (Stage 3)', cat: 'Command & Nose', desc: 'White Energia nose cone with button tip, red ЭНЕРГИЯ markings, ribbed grey collar with 2 staggered black squares + parachutes' },
  },
  energiaPolyus: {
    vi: { name: 'Trạm Vũ Trụ МИР-2 (Polyus) & Thân Giữa Energia (Tầng 2)', cat: 'Nhiên liệu', desc: 'Tàu/Trạm chiến đấu quỹ đạo Polyus (МИР-2) sơn đen tuyền gắn lưng Energia kèm 2 bình phụ bên hông, cổ tản nhiệt kẻ sọc bạc & dù hạ cánh' },
    en: { name: 'Polyus ("МИР-2") Orbital Spacecraft & Mid Energia Core (Stage 2)', cat: 'Fuel Tanks', desc: 'Matte-black Polyus (МИР-2) spacecraft mounted piggyback on Energia with conical nose, white МИР-2 lettering, side pods & ribbed silver radiator' },
  },
  energiaCore: {
    vi: { name: 'Tầng Đẩy Siêu Nặng Energia (Энергия) & 4 Booster (Tầng 1)', cat: 'Động cơ', desc: 'Thân dưới tên lửa Energia kèm 4 tầng đẩy phụ Zenit ốp khí động xám đá, 4 động cơ chính RD-0120 đai đen và 4 cụm RD-170' },
    en: { name: 'Energia ("Энергия") Super-Heavy Core & 4× Zenit Boosters (Stage 1)', cat: 'Engines', desc: 'Lower Energia core with 4 Zenit strap-on boosters in stone-grey fairings, 4 central RD-0120 engines with black bands & 4 RD-170 nozzles' },
  },
  cz5Fairing: {
    vi: { name: 'Chóp Mũi Trường Chinh 5 (Cờ CHN · Tầng 3)', cat: 'Đầu', desc: 'Chóp mũi khí động Trường Chinh 5 (CZ-5) in Quốc kỳ Trung Quốc, chữ CHN, cổ chuyển tầng viền đồng và dù hạ cánh' },
    en: { name: 'Long March 5 Payload Fairing (CHN Flag · Stage 3)', cat: 'Command & Nose', desc: 'Aerodynamic Long March 5 (CZ-5) ogive payload fairing with PRC flag, CHN markings, bronze adapter seam & parachutes' },
  },
  cz5Stage2: {
    vi: { name: 'Thân Giữa Trường Chinh 5 · 中国航天 & Logo 5 (Tầng 2)', cat: 'Nhiên liệu', desc: 'Tầng đẩy trung tâm Trường Chinh 5 in logo CASC, dòng chữ dọc 中国航天, biểu tượng số 5 đỏ LONG MARCH và cặp động cơ YF-75D' },
    en: { name: 'Long March 5 Core Stage 2 · 中国航天 & Red 5 (Stage 2)', cat: 'Fuel Tanks', desc: 'Upper/middle 5m core stage with CASC emblem, vertical 中国航天 calligraphy, red 5 LONG MARCH logo & dual YF-75D engines' },
  },
  cz5Stage1: {
    vi: { name: 'Tầng 1 Trường Chinh 5 & 4 Booster CZ-5 (Tầng 1)', cat: 'Động cơ', desc: 'Tầng 1 lõi Trường Chinh 5 đáy bọc cách nhiệt nâu đỏ kèm 4 tầng đẩy phụ mũi vát nghiêng kẻ sọc caro đỏ CZ-5, cánh đuôi và 10 động cơ YF-77 / YF-100' },
    en: { name: 'Long March 5 Core Stage 1 & 4× CZ-5 Boosters (Stage 1)', cat: 'Engines', desc: 'Lower 5m core with rust-orange thermal skirt & 4 slanted-nose liquid boosters with red/white checkerboards, CZ-5 markings, fins & 10 YF-77/YF-100 engines' },
  },
  ariane5Fairing: {
    vi: { name: 'Chóp Mũi Ariane 5 (Arianespace & Cổ ESC-A · Tầng 3)', cat: 'Đầu', desc: 'Chóp mũi khí động Ariane 5 ECA in logo Arianespace Service & Solutions, cổ chuyển tầng xám kim loại ESC-A và dù hạ cánh' },
    en: { name: 'Ariane 5 Payload Fairing (Arianespace & ESC-A · Stage 3)', cat: 'Command & Nose', desc: 'Aerodynamic Ariane 5 ECA ogive fairing with Arianespace Service & Solutions logo, metallic-grey ESC-A interstage collar & parachutes' },
  },
  ariane5Stage2: {
    vi: { name: 'Thân Trên Ariane 5 EPC & Cụm Ống Dẫn (Tầng 2)', cat: 'Nhiên liệu', desc: 'Phần trên bồn nhiên liệu lạnh EPC màu bạc xám kẻ gân kèm 4 ống dẫn nổi dọc thân, ngàm giữ booster và động cơ' },
    en: { name: 'Ariane 5 Upper EPC Core & Feedlines (Stage 2)', cat: 'Fuel Tanks', desc: 'Upper brushed silver-grey EPC cryogenic tank section with 4 external vertical feedlines, booster mount struts & propulsion' },
  },
  ariane5Stage1: {
    vi: { name: 'Tầng 1 Ariane 5 (Động cơ Vulcain 2 & 2 Booster EAP ESA/CNES)', cat: 'Động cơ', desc: 'Tầng 1 lõi EPC với siêu động cơ Vulcain 2 ở tâm + 2 tầng đẩy phụ EAP P241 mũi vát nghiêng in 12 cờ Châu Âu, logo ESA, CNES và 2 loa phụt lớn' },
    en: { name: 'Ariane 5 EPC Core, Vulcain 2 & Twin EAP Boosters (Stage 1)', cat: 'Engines', desc: 'Lower EPC cryogenic core with central Vulcain 2 engine, spherical helium pod & twin EAP P241 solid boosters with 12 European flags, ESA & CNES logos' },
  },
  slsOrion: {
    vi: { name: 'Tàu Orion & Tháp Thoát Hiểm LAS (SLS Artemis · Tầng 3)', cat: 'Đầu', desc: 'Khoang tàu Orion bọc áo bảo vệ trắng kèm tháp thoát hiểm LAS 4 loa phụt, khoang dịch vụ ESM in Cờ Mỹ, logo NASA Meatball, NASA Worm, ESA & dù hạ cánh' },
    en: { name: 'Orion Spacecraft & LAS Escape Tower (SLS Artemis · Stage 3)', cat: 'Command & Nose', desc: 'Orion crew module shroud with Launch Abort System (LAS) tower, European Service Module fairing with US Flag, NASA Meatball, NASA Worm, ESA logos & parachutes' },
  },
  slsStage2: {
    vi: { name: 'Cổ Chuyển Tầng LVSA & Thân Trên Cam SLS ICPS (Tầng 2)', cat: 'Nhiên liệu', desc: 'Cổ chuyển tầng hình nón cụt LVSA kèm gân dọc & phần trên bồn nhiên liệu bọt cách nhiệt cam SOFI, vạch kẻ vàng cam, tâm ngắm quang học và đầu ống dẫn LOX' },
    en: { name: 'SLS LVSA Conical Adapter & Upper SOFI Core (Stage 2)', cat: 'Fuel Tanks', desc: 'Tapered orange Launch Vehicle Stage Adapter (LVSA) with vertical stringers, upper SOFI orange foam tank, ochre bands, optical targets & white-capped LOX feedline' },
  },
  slsStage1: {
    vi: { name: 'Tầng 1 Lõi Cam SLS (4× RS-25) & 2 Tên Lửa Đẩy Rắn 5 Đốt SRB', cat: 'Động cơ', desc: 'Thân chính bọt cam SOFI với đuôi trắng, 4 động cơ RS-25 đen & 2 tên lửa đẩy phụ 5 đốt SRB kẻ sọc caro đen-trắng răng cưa, chữ NASA đỏ dọc thân' },
    en: { name: 'SLS Core Stage (4× RS-25) & Twin 5-Segment SRB Boosters (Stage 1)', cat: 'Engines', desc: 'Orange SOFI core stage with white aft skirt, 4 black RS-25 engines & twin 5-segment Solid Rocket Boosters with sawtooth checkerboards and vertical red NASA worm' },
  },
  atlasVFairing: {
    vi: { name: 'Chóp Mũi Phồng Atlas V 5m (Cờ Mỹ & Cổ Gân · Tầng 3)', cat: 'Đầu', desc: 'Chóp mũi khí động Atlas V 5m in Cờ Mỹ, hàng lỗ thoát âm, đai côn gân dọc, khoang phồng bảo vệ Centaur có đuôi côn thu (boat-tail) & dù hạ cánh' },
    en: { name: 'Atlas V 5m Bulged Payload Fairing (US Flag · Stage 3)', cat: 'Command & Nose', desc: 'Aerodynamic Atlas V 5m payload fairing with US Flag, acoustic vent dot rows, corrugated shoulder frustum, wide Centaur shroud with boat-tail & parachutes' },
  },
  atlasVStage2: {
    vi: { name: 'Khoang Chuyển Tầng Trắng Logo Atlas & Thân Trên Đồng CCB (Tầng 2)', cat: 'Nhiên liệu', desc: 'Khoang chuyển tầng trắng in logo Atlas V / ULA nối liền phần trên bồn nhiên liệu màu đồng nâu (CCB) kèm đầu hộp trắng và ống dẫn màu xanh oliu' },
    en: { name: 'Atlas V White Interstage (ULA Logo) & Upper Bronze CCB (Stage 2)', cat: 'Fuel Tanks', desc: 'White cylindrical interstage with Atlas V / ULA mission badge above the upper bronze-copper CCB tank with white upper fairing cap & olive-green conduit' },
  },
  atlasVStage1: {
    vi: { name: 'Tầng 1 Đồng Nâu Atlas V CCB & 2 Booster Trắng Mũi Vát (Tầng 1)', cat: 'Động cơ', desc: 'Thân chính màu đồng nâu Atlas V với ống dẫn xanh oliu, máng gân vàng nâu, váy đáy trắng và 2 tầng đẩy phụ trắng lớn mũi vát nghiêng có viền xanh đen & cụm loa phụt kép' },
    en: { name: 'Atlas V Bronze CCB Core & Twin Slanted-Nose White Boosters (Stage 1)', cat: 'Engines', desc: 'Lower bronze-copper CCB core with olive-green conduit, segmented tan tunnel, white aft skirt & twin white strap-on boosters with navy bands, slanted noses & dual nozzles' },
  },
  fhFairing: {
    vi: { name: 'Chóp Mũi Phồng Falcon Heavy (Arabsat-6A · Tầng 3)', cat: 'Đầu', desc: 'Chóp mũi phồng đầu tròn đặc trưng của SpaceX Falcon Heavy in logo kim cương Arabsat-6A, đường ghép vỏ sò, cổ thu boat-tail và dù hạ cánh' },
    en: { name: 'Falcon Heavy Bulged Fairing (Arabsat-6A · Stage 3)', cat: 'Command & Nose', desc: 'Rounded-crown SpaceX Falcon Heavy payload fairing with Arabsat-6A diamond globe logo, clamshell seams, boat-tail base & parachutes' },
  },
  fhStage2: {
    vi: { name: 'Tầng 2 & Khoang Chuyển Tầng Trắng Falcon Heavy (Logo FH & Cờ Mỹ)', cat: 'Nhiên liệu', desc: 'Thân trụ trắng mảnh Tầng 2 & Interstage của Falcon Heavy với ống dẫn nổi dọc thân, logo chim ưng FH, Quốc kỳ Mỹ và động cơ Merlin Vacuum' },
    en: { name: 'Falcon Heavy White Stage 2 & Interstage (FH Logo & US Flag)', cat: 'Fuel Tanks', desc: 'Slender glossy white Stage 2 and interstage cylinder with vertical cable raceway, red/blue FH emblem, US Flag & Merlin Vacuum engine' },
  },
  fhStage1: {
    vi: { name: 'Tầng 1 Falcon Heavy (3 Lõi Booster Trắng, 12 Chân Đáp Đen & 27 Merlin 1D)', cat: 'Động cơ', desc: 'Cụm 3 lõi tên lửa đẩy Falcon Heavy màu trắng với 2 chóp mũi phụ tròn, thanh giằng ngang trắng, 12 cánh lưới Titanium đen, đường cáp dọc đen, 12 chân đáp đen gập sát đáy và 27 động cơ Merlin 1D' },
    en: { name: 'Falcon Heavy Triple White Cores, 12 Black Legs & 27× Merlin 1D (Stage 1)', cat: 'Engines', desc: 'Triple Falcon Heavy white booster cores with rounded side nose cones, white horizontal cross-strut, 12 black Titanium grid fins, dark raceways, 12 folded black landing legs & 27 Merlin 1D engines' },
  },
  f9Dragon: {
    vi: { name: 'Tàu Vũ Trụ Crew Dragon & Khoang Trunk Đen-Trắng (Falcon 9 · Tầng 3)', cat: 'Đầu', desc: 'Tàu Crew Dragon đầu vòm trắng có 4 hốc động cơ thoát hiểm SuperDraco, Cờ Mỹ, nối liền khoang dịch vụ Trunk chia 2 nửa Đen-Trắng có 4 cánh ổn định và dù hạ cánh' },
    en: { name: 'Crew Dragon Spacecraft & Split Black-White Trunk (Falcon 9 · Stage 3)', cat: 'Command & Nose', desc: 'Crew Dragon capsule with 4 SuperDraco abort nacelles & US Flag atop the half-black solar / half-white ribbed radiator Trunk with 4 stabilization fins & parachutes' },
  },
  f9Stage2: {
    vi: { name: 'Tầng 2 Trắng & Khoang Interstage Đen Falcon 9 Block 5 (Tầng 2)', cat: 'Nhiên liệu', desc: 'Bồn nhiên liệu Tầng 2 màu trắng bóng kết hợp khoang chuyển tầng Interstage sợi carbon đen tuyền đặc trưng của Falcon 9 Block 5 và động cơ Merlin Vacuum' },
    en: { name: 'Falcon 9 Block 5 White Stage 2 & Matte-Black Interstage (Stage 2)', cat: 'Fuel Tanks', desc: 'Glossy white Stage 2 propellant tank paired with the signature Falcon 9 Block 5 matte-black carbon-fiber interstage & Merlin Vacuum engine' },
  },
  f9Stage1: {
    vi: { name: 'Tầng 1 Falcon 9 Block 5 (Logo FALCON 9, Chữ Dọc SPACEX & 9 Merlin 1D)', cat: 'Động cơ', desc: 'Tầng 1 Falcon 9 Block 5 màu trắng in logo cánh chim đỏ FALCON 9, Cờ Mỹ, dòng chữ dọc SPACEX xanh đậm, 4 cánh lưới Titanium đen, 4 chân đáp đen tạo khe chữ V trắng và 9 loa phụt Merlin 1D bạc' },
    en: { name: 'Falcon 9 Block 5 First Stage (FALCON 9, Vertical SPACEX & 9× Merlin 1D)', cat: 'Engines', desc: 'White Falcon 9 Block 5 booster with red FALCON 9 swoosh, US Flag, vertical navy SPACEX lettering, 4 black Titanium grid fins, 4 folded black landing legs with white center V-wedge & 9 silver Merlin 1D bells' },
  },
  shuttleOrbiter: {
    vi: { name: 'Tàu Con Thoi Discovery (STS · Tầng 3 – Cuối)', cat: 'Đầu', desc: 'Tàu vũ trụ con thoi Discovery của NASA (Tầng 3 – Cuối) với mũi & bụng gạch chịu nhiệt đen RCC, cụm RCS mũi, kính buồng lái 6 ô, chữ United States + Cờ Mỹ + logo NASA + Discovery trên cánh tam giác kép, 3 động cơ chính RS-25 (SSME), 2 động cơ OMS và dù hạ cánh' },
    en: { name: 'Space Shuttle Orbiter Discovery (STS · Stage 3 – Final)', cat: 'Command & Nose', desc: 'NASA Space Shuttle Orbiter Discovery (Final Stage) with black RCC nose cap & thermal tile belly, forward RCS array, 6-pane cockpit windshield, United States + US Flag + NASA Meatball + Discovery wing markings, 3× RS-25 SSME + 2× OMS engines & parachutes' },
  },
  shuttleNose: {
    vi: { name: 'Bồn Nhiên Liệu Ngoài Cam ET & Đai Gân Intertank (Space Shuttle · Tầng 2)', cat: 'Nhiên liệu', desc: 'Thân chính và chóp mũi khí động bồn nhiên liệu ngoài (External Tank – ET) màu cam đất kèm cột thu lôi, đường ống LOX & cáp đen dọc thân, cổ gân vàng nâu Intertank và khung giằng đỡ tàu con thoi' },
    en: { name: 'Space Shuttle Burnt-Orange External Tank (ET) & Intertank (Stage 2)', cat: 'Fuel Tanks', desc: 'Burnt-orange External Tank (ET) main barrel, golden-tan ribbed Intertank collar, ogive LOX nose cone with lightning rod tip, external LOX feedline & Orbiter attachment struts' },
  },
  shuttleSrb: {
    vi: { name: 'Đáy Bồn Cam ET & 2 Tên Lửa Đẩy Phụ Trắng SRB (Space Shuttle · Tầng 1)', cat: 'Động cơ', desc: 'Phần dưới bồn nhiên liệu ngoài màu cam đáy vòm tròn kèm 2 tên lửa đẩy nhiên liệu rắn SRB màu trắng mũi nhọn có đai đen-cam, 3 vòng gân vàng ở váy đáy và cặp loa phụt khổng lồ' },
    en: { name: 'Lower External Tank & Twin White Solid Rocket Boosters (SRBs · Stage 1)', cat: 'Engines', desc: 'Lower burnt-orange External Tank with rounded aft dome & twin white Solid Rocket Boosters with pointed nose cones, black-orange collar bands, black field joints, 3 golden-yellow aft skirt rings & wide SRB nozzles' },
  },
  protonFairing: {
    vi: { name: 'Chóp Mũi Proton-M / Briz-M (Logo ESA ExoMars · Tầng 4)', cat: 'Đầu', desc: 'Chóp mũi khí động Proton-M / Briz-M sơn trắng bóng in logo ESA xanh đậm, dải cờ sứ mệnh ExoMars, hàng ngàm tách dọc mũi, cổ chuyển tầng xám gân và dù hạ cánh' },
    en: { name: 'Proton-M / Briz-M Payload Fairing (ESA ExoMars · Stage 4)', cat: 'Command & Nose', desc: 'Glossy white Briz-M payload fairing with navy ESA logo, ExoMars flag-stripe & horizon mission patch, longitudinal separation latch tabs, ribbed grey adapter skirt & parachutes' },
  },
  protonStage3: {
    vi: { name: 'Tầng 3 Proton-M (Logo Roscosmos, Cờ Nga & Hốc Chữ U · Tầng 3)', cat: 'Nhiên liệu', desc: 'Tầng 3 tên lửa Proton-M màu trắng có đai gân dọc trên/dưới, in Quốc kỳ Nga, logo Roscosmos, hốc chữ U xám đen đặc trưng, ống cáp nổi và động cơ RD-0210' },
    en: { name: 'Proton-M Third Stage (Roscosmos Emblem, Russian Flag & U-Cutouts · Stage 3)', cat: 'Fuel Tanks', desc: 'White Proton-M Third Stage with ribbed collars, Roscosmos red-arrow emblem, Russian Tricolor Flag, signature dark U-shaped recessed cutouts, external cable ducts & RD-0210 engine' },
  },
  protonStage2: {
    vi: { name: 'Tầng 2 Proton-M (Chữ Đỏ ПРОТОН-М & Giàn Mắt Cáo Chéo · Tầng 2)', cat: 'Nhiên liệu', desc: 'Thân trụ trắng Tầng 2 Proton-M in dòng chữ dọc đỏ rực ПРОТОН-М, cổ chữ ХРУНИЧЕВ, khung giàn mắt cáo chéo hở lộ vòm bồn xanh đen bên trong và 4 động cơ RD-0210' },
    en: { name: 'Proton-M Second Stage (Red ПРОТОН-М & Open Lattice Interstage · Stage 2)', cat: 'Fuel Tanks', desc: 'Glossy white Proton-M Second Stage with bold red vertical ПРОТОН•М lettering, ХРУНИЧЕВ collar, open silver diagonal lattice truss revealing the dark-green internal tank dome & 4× RD-0210 nozzles' },
  },
  protonStage1: {
    vi: { name: 'Tầng 1 Proton-M (Lõi Xám Gân, 6 Bình Trắng Đai Đen & 6× RD-275M)', cat: 'Động cơ', desc: 'Tầng 1 đặc trưng của Proton-M với thân lõi xám bạc kẻ gân dọc ở giữa, bao quanh bởi 6 bình nhiên liệu phụ màu trắng mũi côn nhọn có đai đáy đen tuyền, chụp hướng dòng và 6 động cơ RD-275M' },
    en: { name: 'Proton-M First Stage (Ribbed Grey Core, 6 Black-Banded White Tanks & 6× RD-275M)', cat: 'Engines', desc: 'Iconic Proton-M First Stage with exposed light-grey vertically ribbed central core, black bottom tail cone & 6 strap-on white fuel tanks with slanted conical tops, black lower bands, white engine scoops & 6 RD-275M engines' },
  },
  d4hFairing: {
    vi: { name: 'Chóp Mũi Trắng 5m Delta IV Heavy (Đầu Đen & Ngàm Tách · Tầng 3)', cat: 'Đầu', desc: 'Chóp mũi tải trọng 5m màu trắng của Delta IV Heavy với chóp đỉnh đen, cụm cảm biến mũi, đường ghép dọc/ngang, đai đen ở đáy và dù hạ cánh' },
    en: { name: 'Delta IV Heavy 5m White Payload Fairing (Black Tip & Seams · Stage 3)', cat: 'Command & Nose', desc: '5-meter white payload fairing of Delta IV Heavy with matte-black conical nose tip, shoulder sensor bracket, vertical/horizontal seam lines, black base separation band & parachutes' },
  },
  d4hStage2: {
    vi: { name: 'Tầng 2 Cryogenic DCSS & Khoang Chuyển Tầng Trắng Đai Vàng (Delta IV Heavy · Tầng 2)', cat: 'Nhiên liệu', desc: 'Khoang chuyển tầng và Tầng 2 DCSS màu trắng với 2 đai bọt cách nhiệt vàng nghệ ở cổ trên, ống cáp dọc thân và động cơ chân không RL10B-2' },
    en: { name: 'Delta IV Heavy White DCSS & Interstage with Yellow Foam Bands (Stage 2)', cat: 'Fuel Tanks', desc: 'White cylindrical DCSS and interstage barrel featuring 2 golden-yellow foam bands near the top, front vertical white cable raceway & RL10B-2 vacuum engine' },
  },
  d4hStage1: {
    vi: { name: 'Tầng 1 Delta IV Heavy (3 Lõi Cam CBC Ám Khói Đen, Đai Trắng Giữa & 3× RS-68A)', cat: 'Động cơ', desc: 'Cụm 3 lõi tên lửa đẩy Common Booster Core (CBC) màu cam SOFI đặc trưng với vệt ám khói đen ở đáy, đai trắng giữa viền vàng, 2 chóp mũi phụ trắng, cặp ống dẫn LOX trắng nổi dọc mặt trước, đáy côn xám bạc và 3 siêu động cơ RS-68A' },
    en: { name: 'Delta IV Heavy Triple Orange CBCs (Scorched Base, White Band & 3× RS-68A · Stage 1)', cat: 'Engines', desc: 'Triple Common Booster Cores with burnt-orange SOFI foam, liftoff hydrogen-fireball black scorch gradient at base, white center intertank band with golden-yellow borders, 2 white booster nose cones, twin front white LOX feedlines, conical grey base shields & 3 RS-68A engines' },
  },
  titan4Voyager: {
    vi: { name: 'Tàu Thăm Dò Vũ Trụ Voyager 1 / 2 · Titan IV (Tầng 4 – Cuối)', cat: 'Đầu', desc: 'Tàu thăm dò liên sao Voyager (không có động cơ đẩy) với chảo ăng-ten Parabol trắng 3.7m, thân 10 cạnh gắn Đĩa Vàng Golden Record, nguồn đồng vị phóng xạ RTG, cần camera khoa học, cần từ kế và dù hạ cánh' },
    en: { name: 'Voyager 1 / 2 Interplanetary Probe · Titan IV (Stage 4 – Final)', cat: 'Command & Nose', desc: 'Voyager interstellar probe (unpowered satellite) with 3.7m white High-Gain Parabolic Dish, decagonal bus with the Golden Record, MHW-RTG nuclear boom, science scan platform camera boom, magnetometer lattice boom & parachutes' },
  },
  titan4Fairing: {
    vi: { name: 'Chóp Mũi Trắng Dài 5m Titan IV (Khoang Chứa Tàu Voyager · Tầng 3)', cat: 'Nhiên liệu', desc: 'Chóp mũi tải trọng 5m (PLF) trắng cao vút của Titan IVB chia 4 đốt trụ có gân dọc, khoang bảo vệ tàu Voyager bên trong, đáy côn thu boat-tail và tầng đẩy Centaur' },
    en: { name: 'Titan IVB Tall 5m White Payload Fairing (Voyager Bay · Stage 3)', cat: 'Fuel Tanks', desc: 'Tall 5-meter white payload fairing (PLF) of Titan IVB with 4 cylindrical bays, Voyager payload bay cutaway, fine vertical ribs, conical boat-tail base & Centaur upper stage' },
  },
  titan4Stage2: {
    vi: { name: 'Tầng 2 Titan IV (Ốp Nâu Đỏ Chữ L, Phù Hiệu USAF & Khe Gió Đen · Tầng 2)', cat: 'Nhiên liệu', desc: 'Tầng 2 Titan IV với tấm bọc cách nhiệt màu nâu đỏ hình chữ L, đai bạc хроm kèm phù hiệu Không quân Mỹ (USAF), cổ chuyển tầng gân trắng có 2 cụm khe thoát khí đen và động cơ LR91' },
    en: { name: 'Titan IV Second Stage (L-Shaped Cork Panel, USAF Roundel & Black Vents · Stage 2)', cat: 'Fuel Tanks', desc: 'Titan IV Second Stage with L-shaped reddish-brown cork thermal panel, chrome-silver USAF roundel collar, white corrugated interstage with 2 black vent louver clusters & LR91 engine' },
  },
  titan4Stage1: {
    vi: { name: 'Tầng 1 Titan IV (Lõi Bạc US AIR FORCE & 2 Booster Trắng SRMU · Tầng 1)', cat: 'Động cơ', desc: 'Thân lõi Tầng 1 bằng nhôm bạc sáng bóng in dòng chữ dọc US AIR FORCE, đáy côn nâu đỏ với loa phụt bạc LR87, kẹp giữa 2 tên lửa đẩy phụ rắn SRMU màu trắng kem có gân 3 vòng, khung giằng tam giác trắng và 2 loa phụt xám lớn' },
    en: { name: 'Titan IV First Stage (Silver US AIR FORCE Core & Twin Cream-White SRMUs · Stage 1)', cat: 'Engines', desc: 'Brushed metallic silver-aluminium core with vertical US AIR FORCE stencil, reddish-brown conical shroud & silver LR87 bell, flanked by twin cream-white SRMU solid rocket boosters with triple-ring bands, white triangular A-frame trusses & wide grey nozzles' },
  },
  starshipNose: {
    vi: { name: 'Mũi Tàu Starship Đen Gạch Chịu Nhiệt & 2 Cánh Vây Trước (Tầng 3)', cat: 'Đầu', desc: 'Chóp mũi ogive của tàu Starship phủ gạch chịu nhiệt đen than chì kết hợp ánh thép không gỉ, 2 cánh vây khí động phía trước (Forward Flaps) và dù hạ cánh' },
    en: { name: 'Starship Black Thermal-Tile Ogive Nose Cone & 2 Forward Flaps (Stage 3)', cat: 'Command & Nose', desc: 'Ogive Starship nose cone in matte charcoal-black thermal protection tiles with sunlit stainless-steel highlight, 2 trapezoidal forward aero flaps & parachutes' },
  },
  starshipShip: {
    vi: { name: 'Thân Tàu Starship (Đai Băng Trắng, 2 Cánh Vây Sau, Đai Hot-Stage & 6 Raptor · Tầng 2)', cat: 'Nhiên liệu', desc: 'Thân tàu Starship chia 2 nửa trắng phủ băng lạnh & đen gạch chịu nhiệt, váy đáy xám đen kèm 2 cánh vây lớn phía sau (Aft Flaps), vành tách tầng nóng (Hot-Staging Ring) và 6 động cơ Raptor' },
    en: { name: 'Starship Main Barrel (Frost-White Band, 2 Aft Flaps, Hot-Stage Ring & 6× Raptor · Stage 2)', cat: 'Fuel Tanks', desc: 'Starship main barrel with cryogenic frost-white tank band, black windward heat-shield tiles, dark aft skirt with 2 large trapezoidal aft flaps, vented hot-staging ring & 6 Raptor engines' },
  },
  starshipBooster: {
    vi: { name: 'Tầng Đẩy Super Heavy (Thép Không Gỉ, 4 Cánh Lưới, 4 Sống Khí Động & 33 Động Cơ Raptor)', cat: 'Động cơ', desc: 'Siêu tầng đẩy Super Heavy bằng thép không gỉ với 4 cánh lưới xòe ngang ở đỉnh, vệt băng trắng dọc sống lưng, 4 gờ khí động (chines) nổi dọc thân dưới và cụm 33 động cơ Raptor phát sáng rực rỡ ở đáy' },
    en: { name: 'Super Heavy Stainless-Steel Booster (4 Grid Fins, 4 Lower Chines & 33 Glowing Raptors · Stage 1)', cat: 'Engines', desc: 'Super Heavy stainless-steel booster featuring 4 deployed dark waffle grid fins, 18 weld rings, vertical cryogenic frost spine, 4 tall lower aerodynamic chines & 33 glowing golden-white Raptor engines' },
  },
  ufoSaucer: {
    vi: { name: 'Đĩa Bay UFO Trinh Sát', cat: 'UFO', desc: 'Đĩa bay UFO Trinh Sát (Tốc độ Cấp 1 · Pin lượng tử 60 tấn) tích hợp vòm kính phi công Alien xanh lá, vành plasma lục bảo, dù hạ cánh và lõi phản trọng lực' },
    en: { name: 'Scout Alien UFO Saucer', cat: 'UFO', desc: 'Scout UFO flying saucer (Speed Tier 1 · 60-ton Quantum Battery) with crystal green-Alien pilot dome, emerald plasma rim, parachutes & anti-gravity core' },
  },
  ufoWarrior: {
    vi: { name: 'Đĩa Bay UFO Chiến Binh', cat: 'UFO', desc: 'Đĩa bay UFO Chiến Binh (Tốc độ Cấp 2 · Pin lượng tử 150 tấn) bọc giáp đen-tím, 8 lưỡi kiếm khí động, phi công Chiến Binh giáp kính và pin bền gấp đôi Trinh Sát' },
    en: { name: 'Warrior Alien UFO Saucer', cat: 'UFO', desc: 'Warrior UFO saucer (Speed Tier 2 · 150-ton Quantum Battery) with dark-purple armor, 8 swept combat blades, visor-armored Warrior Alien pilot & 2× battery endurance' },
  },
  ufoMother: {
    vi: { name: 'Đĩa Bay UFO Mẹ', cat: 'UFO', desc: 'Siêu Đĩa Bay UFO Mẹ cỡ đại rộng 19m (Tốc độ Cấp 3 · Pin khủng 350 tấn) hai tầng giáp đỏ-vàng, vòng hào quang khiên năng lượng xoay và chỉ huy Tàu Mẹ' },
    en: { name: 'Mothership Alien UFO Saucer', cat: 'UFO', desc: 'Large 19m-wide Mothership UFO saucer (Speed Tier 3 · 350-ton Quantum Battery) with crimson-gold double command deck, spinning energy halo shield & Commander pilot' },
  },
  ufoQueen: {
    vi: { name: 'Đĩa Bay UFO Hoàng Hậu (Khổng Lồ)', cat: 'UFO', desc: 'Đĩa Bay UFO Hoàng Hậu KHỔNG LỒ rộng ~39m (Tốc độ Cấp 4 · Siêu Pin 800 tấn) vỏ hồng kim cương, phi công Hoàng Hậu khổng lồ, 3 vòng hào quang hoàng gia và đại vương miện pha lê lơ lửng' },
    en: { name: 'Colossal Queen Alien UFO Saucer', cat: 'UFO', desc: 'Colossal ~39m-wide Royal Queen UFO saucer (Speed Tier 4 · 800-ton Quantum Battery) with rose-magenta metallic hull, giant Queen Alien pilot, triple royal halo rings & floating diamond crown' },
  },
  ufoKing: {
    vi: { name: 'Đĩa Bay UFO Vua (Siêu Khổng Lồ)', cat: 'UFO', desc: 'Chúa tể Đĩa Bay UFO Vua SIÊU KHỔNG LỒ rộng ~46m (Tốc độ Cấp 5 Tối Thượng · Đại Lò Pin 1,800 tấn) vỏ vàng ròng hoàng đế, phi công Vua Alien khổng lồ, 3 vòng hào quang hồng ngọc và đại vương miện vàng lơ lửng' },
    en: { name: 'Colossal King Alien UFO Saucer', cat: 'UFO', desc: 'Gargantuan ~46m-wide Supreme King UFO saucer (Speed Tier 5 · 1,800-ton Mega Battery) with solid-gold imperial hull, colossal King Alien pilot, triple ruby halo rings & floating golden royal crown' },
  },
};

export const PRESET_ICONS = {
  'Tên lửa Tốt Nhất (2 Tầng Siêu Cấp)': '👑',
  'Hai tầng (khuyên dùng)': '🚀',
  'Saturn V (Apollo)': '🌕',
  'Soyuz / R-7 Semyorka': '⭐',
  'N1 Liên Xô (Mặt Trăng)': '🌒',
  'Titan IV (Tàu Voyager)': '📡',
  'Tàu con thoi Space Shuttle': '🛫',
  'Energia – Buran': '🛩️',
  'Tên lửa Energia (Мир-2 / Polyus)': '🛰️',
  'Proton-M (Nga)': '🛡️',
  'Ariane 5 (James Webb)': '🔭',
  'Atlas V (Sao Hỏa)': '🔴',
  'Delta IV Heavy': '🔥',
  'Trường Chinh 5 (Long March 5)': '🐉',
  'Falcon 9 (SpaceX)': '🦅',
  'Falcon Heavy (SpaceX)': '⚡',
  'SLS Artemis (NASA)': '🟠',
  'Starship & Super Heavy': '🦾',
  'Nhỏ gọn': '🧨',
  'Siêu nặng (lên quỹ đạo)': '🏋️',
  'Đại Bàng 9 (tái sử dụng)': '♻️',
  'Tàu chở khách (ISS)': '👨‍🚀',
  'Apollo (Mặt Trăng)': '🌖',
  'Xe địa hình Rover 4x4': '🛞',
  'Canô lướt sóng siêu tốc': '🛥️',
  'Thuyền nhỏ': '⛵',
  'Tiêm kích phản lực F-22': '✈️',
  'Tàu Phản Trọng Lực Lượng Tử': '⚛️',
  'Tàu Chiến Lazer Liên Hành Tinh': '🔫',
  'Chiến Hạm Diệt Alien (Lazer + Nước 1M PSI)': '👽',
  'Đĩa Bay UFO Siêu Cấp (Alien Saucer)': '🛸',
  'UFO Chiến Binh': '⚔️',
  'UFO Mẹ': '👾',
  'UFO Hoàng Hậu': '👸',
  'UFO Vua': '👑',
};

export const PRESET_LABELS = {
  'Tên lửa Tốt Nhất (2 Tầng Siêu Cấp)': { vi: 'Tên lửa Tốt Nhất (2 Tầng Siêu Cấp)', en: 'Best Rocket (2-Stage Ultimate)' },
  'Hai tầng (khuyên dùng)': { vi: 'Hai tầng (khuyên dùng)', en: 'Two-Stage (Recommended)' },
  'Saturn V (Apollo)': { vi: 'Saturn V (Apollo – Mặt Trăng)', en: 'Saturn V (Apollo – Moon)' },
  'Soyuz / R-7 Semyorka': { vi: 'Soyuz / R-7 Semyorka (Liên Xô)', en: 'Soyuz / R-7 Semyorka (USSR)' },
  'N1 Liên Xô (Mặt Trăng)': { vi: 'N1 Liên Xô (Siêu tên lửa Mặt Trăng)', en: 'Soviet N1 (Super Heavy Lunar)' },
  'Titan IV (Tàu Voyager)': { vi: 'Titan IV (Tàu thăm dò Voyager)', en: 'Titan IV (Voyager Probe)' },
  'Tàu con thoi Space Shuttle': { vi: 'Tàu con thoi Space Shuttle (NASA)', en: 'Space Shuttle (NASA)' },
  'Energia – Buran': { vi: 'Tàu con thoi Buran (Energia – Buran)', en: 'Energia – Buran (Space Shuttle)' },
  'Tên lửa Energia (Мир-2 / Polyus)': { vi: 'Tên lửa Energia (Энергия – Мир-2)', en: 'Energia – Polyus (Энергия – Мир-2)' },
  'Proton-M (Nga)': { vi: 'Proton-M (Nga – Trạm vũ trụ)', en: 'Proton-M (Russia)' },
  'Ariane 5 (James Webb)': { vi: 'Ariane 5 (Kính James Webb – ESA)', en: 'Ariane 5 (JWST – ESA)' },
  'Atlas V (Sao Hỏa)': { vi: 'Atlas V (Thám hiểm Sao Hỏa)', en: 'Atlas V (Mars Explorer)' },
  'Delta IV Heavy': { vi: 'Delta IV Heavy (ULA)', en: 'Delta IV Heavy (ULA)' },
  'Trường Chinh 5 (Long March 5)': { vi: 'Trường Chinh 5 (Long March 5)', en: 'Long March 5 (ChangZheng 5)' },
  'Falcon 9 (SpaceX)': { vi: 'Falcon 9 (SpaceX – Tái sử dụng)', en: 'Falcon 9 (SpaceX – Reusable)' },
  'Falcon Heavy (SpaceX)': { vi: 'Falcon Heavy (SpaceX – Siêu nặng)', en: 'Falcon Heavy (SpaceX)' },
  'SLS Artemis (NASA)': { vi: 'SLS Artemis (NASA – Mặt Trăng)', en: 'SLS Artemis (NASA – Moon)' },
  'Starship & Super Heavy': { vi: 'Starship & Super Heavy (SpaceX)', en: 'Starship & Super Heavy (SpaceX)' },
  'Nhỏ gọn': { vi: 'Nhỏ gọn', en: 'Compact Rocket' },
  'Siêu nặng (lên quỹ đạo)': { vi: 'Siêu nặng (lên quỹ đạo)', en: 'Super Heavy (Orbital)' },
  'Đại Bàng 9 (tái sử dụng)': { vi: 'Đại Bàng 9 (tái sử dụng)', en: 'Falcon 9 (Reusable)' },
  'Tàu chở khách (ISS)': { vi: 'Tàu chở khách (ISS)', en: 'Crew Dragon (ISS)' },
  'Apollo (Mặt Trăng)': { vi: 'Apollo (Mặt Trăng)', en: 'Apollo (Moon & Planets)' },
  'Xe địa hình Rover 4x4': { vi: 'Xe địa hình Rover 4x4', en: '4x4 Planetary Rover' },
  'Canô lướt sóng siêu tốc': { vi: 'Thuyền to', en: 'Big Boat' },
  'Thuyền nhỏ': { vi: 'Thuyền nhỏ', en: 'Small Boat' },
  'Tiêm kích phản lực F-22': { vi: 'Tiêm kích phản lực F-22', en: 'F-22 Raptor Fighter Jet' },
  'Tàu Phản Trọng Lực Lượng Tử': { vi: 'Tàu Phản Trọng Lực Lượng Tử', en: 'Quantum Anti-Gravity Ship' },
  'Tàu Chiến Lazer Liên Hành Tinh': { vi: 'Tàu Chiến Lazer Liên Hành Tinh', en: 'Interplanetary Laser Cruiser' },
  'Chiến Hạm Diệt Alien (Lazer + Nước 1M PSI)': { vi: 'Chiến Hạm Diệt Alien (Lazer + Nước 1,000,000 PSI)', en: 'Alien Hunter Warship (Laser + 1M PSI Water)' },
  'Đĩa Bay UFO Siêu Cấp (Alien Saucer)': { vi: 'UFO Trinh Sát', en: 'Scout UFO' },
  'UFO Chiến Binh': { vi: 'UFO Chiến Binh', en: 'Warrior UFO' },
  'UFO Mẹ': { vi: 'UFO Mẹ', en: 'Mothership UFO' },
  'UFO Hoàng Hậu': { vi: 'UFO Hoàng Hậu', en: 'Queen UFO' },
  'UFO Vua': { vi: 'UFO Vua', en: 'King UFO' },
};

const MISSION_I18N = {
  free: {
    vi: {
      name: 'Bay tự do',
      desc: 'Tự do lắp ráp và bay. Lái tự động (G) đưa tên lửa lên quỹ đạo 80 km; tầng có chân hạ cánh sẽ tự bay về.',
      objs: {},
    },
    en: {
      name: 'Free Flight',
      desc: 'Build and fly freely. Autopilot (G) launches to an 80 km orbit; boosters with landing legs automatically recover.',
      objs: {},
    },
  },
  alien100: {
    vi: {
      name: 'Tiêu diệt 100 Alien (Không tự lái)',
      desc: 'Tự điều khiển tàu chiến lên vũ trụ hoặc các hành tinh/mặt trăng và tiêu diệt đủ 100 UFO Alien bằng Súng Lazer hoặc Máy Phun Nước 1,000,000 PSI (Không có chế độ Lái tự động).',
      objs: {
        kill25: 'Tiêu diệt 25 UFO Alien',
        kill50: 'Tiêu diệt 50 UFO Alien',
        kill100: 'Tiêu diệt đủ 100 UFO Alien',
      },
    },
    en: {
      name: 'Eliminate 100 Aliens (No Autopilot)',
      desc: 'Manually pilot your warship into space or to planets/moons and destroy 100 Alien UFOs using Laser Turrets or 1,000,000 PSI Water Cannons (No Autopilot mode).',
      objs: {
        kill25: 'Destroy 25 Alien UFOs',
        kill50: 'Destroy 50 Alien UFOs',
        kill100: 'Destroy all 100 Alien UFOs',
      },
    },
  },
  alien500: {
    vi: {
      name: 'Đại chiến 500 Alien (Không tự lái)',
      desc: 'Chiến dịch quy mô tổng lực: Tự tay lái chiến hạm tiêu diệt đủ 500 UFO Alien trên khắp Hệ Mặt Trời và Không gian Liên sao bằng Súng Lazer, Máy Phun Nước hoặc Siêu Tân Tinh (Không có chế độ Lái tự động).',
      objs: {
        kill100: 'Tiêu diệt 100 UFO Alien',
        kill250: 'Tiêu diệt 250 UFO Alien',
        kill500: 'Tiêu diệt toàn bộ 500 UFO Alien',
      },
    },
    en: {
      name: 'Galactic War: 500 Aliens (No Autopilot)',
      desc: 'All-out galactic campaign: Manually pilot your warship to eliminate 500 Alien UFOs across the Solar System and Interstellar Space using Lasers, Water Cannons, or Supernovas (No Autopilot mode).',
      objs: {
        kill100: 'Destroy 100 Alien UFOs',
        kill250: 'Destroy 250 Alien UFOs',
        kill500: 'Eliminate all 500 Alien UFOs',
      },
    },
  },
  alien1500: {
    vi: {
      name: 'Hủy diệt 1500 Alien (Không tự lái)',
      desc: 'Cuộc chiến sinh tồn tối thượng: Tự tay lái chiến hạm tiêu diệt đủ 1500 UFO Alien trên khắp Hệ Mặt Trời và Không gian Liên sao bằng Súng Lazer, Máy Phun Nước, Súng Acid, Súng Điện hoặc Siêu Tân Tinh (Không có chế độ Lái tự động).',
      objs: {
        kill300: 'Tiêu diệt 300 UFO Alien',
        kill750: 'Tiêu diệt 750 UFO Alien',
        kill1500: 'Tiêu diệt toàn bộ 1500 UFO Alien',
      },
    },
    en: {
      name: 'Annihilate 1500 Aliens (No Autopilot)',
      desc: 'Ultimate cosmic survival war: Manually pilot your warship to annihilate 1500 Alien UFOs across the Solar System and Interstellar Space using Lasers, Water Cannons, Acid, Electric Cannons, or Supernovas (No Autopilot mode).',
      objs: {
        kill300: 'Destroy 300 Alien UFOs',
        kill750: 'Destroy 750 Alien UFOs',
        kill1500: 'Annihilate all 1500 Alien UFOs',
      },
    },
  },
  alien5000: {
    vi: {
      name: 'Tiêu diệt 5000 Alien + Hoàng Hậu & Vua (Không tự lái)',
      desc: 'Thánh chiến tận thế: Tự tay lái chiến hạm tiêu diệt đủ 5000 UFO Alien trên khắp Hệ Mặt Trời và Không gian Liên sao, đồng thời hạ gục cả Siêu Trùm Alien Hoàng Hậu (90.500 HP) và Alien Vua (100.000 HP) ở độ cao 1.000.000.000 km (Không có chế độ Lái tự động).',
      objs: {
        kill1000: 'Tiêu diệt 1000 UFO Alien',
        kill2500: 'Tiêu diệt 2500 UFO Alien',
        kill5000: 'Tiêu diệt toàn bộ 5000 UFO Alien',
        killQueen: 'Tiêu diệt Siêu Trùm Alien Hoàng Hậu (90.500 HP)',
        killKing: 'Tiêu diệt Siêu Trùm Alien Vua (100.000 HP)',
      },
    },
    en: {
      name: 'Annihilate 5000 Aliens + Queen & King (No Autopilot)',
      desc: 'Apocalyptic cosmic crusade: Manually pilot your warship to annihilate 5000 Alien UFOs across the Solar System and Interstellar Space, and defeat both the Colossal Alien Queen (90,500 HP) and Alien King (100,000 HP) at 1,000,000,000 km altitude (No Autopilot mode).',
      objs: {
        kill1000: 'Destroy 1000 Alien UFOs',
        kill2500: 'Destroy 2500 Alien UFOs',
        kill5000: 'Annihilate all 5000 Alien UFOs',
        killQueen: 'Defeat the Colossal Alien Queen (90,500 HP)',
        killKing: 'Defeat the Colossal Alien King (100,000 HP)',
      },
    },
  },
  orbit: {
    vi: {
      name: 'Lên quỹ đạo',
      desc: 'Đưa tên lửa vào quỹ đạo ổn định quanh Trái Đất (cận điểm trên 70 km).',
      objs: {
        space: 'Vượt đường Kármán (70 km)',
        orbit: 'Vào quỹ đạo: cận điểm > 70 km',
      },
    },
    en: {
      name: 'Reach Orbit',
      desc: 'Place your rocket into a stable orbit around Earth (periapsis above 70 km).',
      objs: {
        space: 'Cross the Kármán Line (70 km)',
        orbit: 'Stable orbit: periapsis > 70 km',
      },
    },
  },
  recover: {
    vi: {
      name: 'Thu hồi tầng đẩy',
      desc: 'Phóng như SpaceX: tầng 1 tách sớm, lật đầu, đốt quay về và tự hạ cánh trên bãi đáp hoặc sà lan giữa biển.',
      objs: {
        sep: 'Tách tầng 1 có chân hạ cánh',
        boosterLanded: 'Tầng 1 hạ cánh an toàn',
        orbit: 'Tầng 2 vào quỹ đạo',
      },
    },
    en: {
      name: 'Booster Recovery',
      desc: 'Fly like SpaceX: separate Stage 1 early, flip, boostback and land on the pad or drone ship at sea.',
      objs: {
        sep: 'Separate Stage 1 with landing legs',
        boosterLanded: 'Land Stage 1 safely',
        orbit: 'Reach orbit with Stage 2',
      },
    },
  },
  iss: {
    vi: {
      name: 'Ghép nối ISS',
      desc: 'Lên quỹ đạo chờ, đuổi theo trạm ISS ở độ cao 400 km rồi ghép nối bằng cổng docking (RCS: I/K/J/L/H/N).',
      objs: {
        orbit: 'Vào quỹ đạo chờ',
        near: 'Tiếp cận ISS (< 1 km)',
        docked: 'Ghép nối thành công',
      },
    },
    en: {
      name: 'ISS Rendezvous & Docking',
      desc: 'Enter parking orbit, rendezvous with the ISS at 400 km altitude and dock using the docking port (RCS: I/K/J/L/H/N).',
      objs: {
        orbit: 'Enter parking orbit',
        near: 'Approach ISS (< 1 km)',
        docked: 'Dock with ISS successfully',
      },
    },
  },
  moon: {
    vi: {
      name: 'Lên Mặt Trăng',
      desc: 'Chuyến bay Apollo: quỹ đạo chờ → TLI → vào quỹ đạo Mặt Trăng → hạ cánh → cắm cờ → cất cánh → quay về Trái Đất và hạ dù.',
      objs: {
        orbit: 'Vào quỹ đạo Trái Đất',
        moonSOI: 'Vào vùng hấp dẫn Mặt Trăng',
        lunarOrbit: 'Vào quỹ đạo Mặt Trăng',
        moonLanded: 'Hạ cánh xuống Mặt Trăng',
        moonLeft: 'Cất cánh rời Mặt Trăng',
        home: 'Trở về Trái Đất an toàn',
      },
    },
    en: {
      name: 'Moon Landing (Apollo)',
      desc: 'Apollo mission: parking orbit → TLI → lunar orbit → land on the Moon → plant flag → liftoff → return to Earth.',
      objs: {
        orbit: 'Enter Earth orbit',
        moonSOI: 'Enter Moon Sphere of Influence',
        lunarOrbit: 'Enter Lunar orbit',
        moonLanded: 'Land safely on the Moon',
        moonLeft: 'Liftoff from the Moon',
        home: 'Return safely to Earth',
      },
    },
  },
  venus: {
    vi: {
      name: 'Thám hiểm Sao Kim',
      desc: 'Bay liên hành tinh tới Sao Kim (Venus), vào quỹ đạo và hạ cánh xuyên qua bầu khí quyển vàng rực.',
      objs: {
        orbit: 'Vào quỹ đạo Trái Đất',
        venusSOI: 'Vào vùng hấp dẫn Sao Kim',
        venusOrbit: 'Vào quỹ đạo Sao Kim',
        venusLanded: 'Hạ cánh xuống Sao Kim',
      },
    },
    en: {
      name: 'Explore Venus',
      desc: 'Interplanetary transfer to Venus, capture into Venusian orbit and descend through the golden atmosphere.',
      objs: {
        orbit: 'Enter Earth orbit',
        venusSOI: 'Enter Venus Sphere of Influence',
        venusOrbit: 'Enter Venus orbit',
        venusLanded: 'Land safely on Venus',
      },
    },
  },
  mars: {
    vi: {
      name: 'Chinh phục Sao Hỏa',
      desc: 'Hành trình tới Hành tinh Đỏ (Mars): chuyển quỹ đạo liên hành tinh, đốt hãm vào quỹ đạo Sao Hỏa và hạ cánh cắm cờ.',
      objs: {
        orbit: 'Vào quỹ đạo Trái Đất',
        marsSOI: 'Vào vùng hấp dẫn Sao Hỏa',
        marsOrbit: 'Vào quỹ đạo Sao Hỏa',
        marsLanded: 'Hạ cánh xuống Sao Hỏa',
      },
    },
    en: {
      name: 'Conquer Mars',
      desc: 'Journey to the Red Planet: interplanetary transfer, capture into Martian orbit and land on the surface.',
      objs: {
        orbit: 'Enter Earth orbit',
        marsSOI: 'Enter Mars Sphere of Influence',
        marsOrbit: 'Enter Mars orbit',
        marsLanded: 'Land safely on Mars',
      },
    },
  },
  phobos: {
    vi: {
      name: 'Vệ tinh Sao Hỏa (Phobos)',
      desc: 'Bay tới hệ vệ tinh Phobos & Deimos của Sao Hỏa, vào quỹ đạo và đáp xuống bề mặt Phobos trọng lực thấp.',
      objs: {
        orbit: 'Vào quỹ đạo Trái Đất',
        phobosSOI: 'Vào vùng hấp dẫn Phobos',
        phobosOrbit: 'Vào quỹ đạo Phobos',
        phobosLanded: 'Hạ cánh xuống Phobos',
      },
    },
    en: {
      name: 'Martian Moon (Phobos)',
      desc: 'Fly to Mars’s moons Phobos & Deimos, enter orbit and touch down on low-gravity Phobos.',
      objs: {
        orbit: 'Enter Earth orbit',
        phobosSOI: 'Enter Phobos Sphere of Influence',
        phobosOrbit: 'Enter Phobos orbit',
        phobosLanded: 'Land safely on Phobos',
      },
    },
  },
  deimos: {
    vi: {
      name: 'Hạ cánh lên Deimos',
      desc: 'Bay liên hành tinh tới hệ vệ tinh của Sao Hỏa, vào quỹ đạo và hạ cánh xuống bề mặt vệ tinh ngoài Deimos.',
      objs: {
        orbit: 'Vào quỹ đạo Trái Đất',
        deimosSOI: 'Vào vùng hấp dẫn Deimos',
        deimosOrbit: 'Vào quỹ đạo Deimos',
        deimosLanded: 'Hạ cánh xuống Deimos',
      },
    },
    en: {
      name: 'Land on Deimos',
      desc: 'Interplanetary flight to Mars’s outer moon Deimos, capture into orbit and touch down on its low-gravity surface.',
      objs: {
        orbit: 'Enter Earth orbit',
        deimosSOI: 'Enter Deimos Sphere of Influence',
        deimosOrbit: 'Enter Deimos orbit',
        deimosLanded: 'Land safely on Deimos',
      },
    },
  },
  ceres: {
    vi: {
      name: 'Thám hiểm Tiểu hành tinh Ceres',
      desc: 'Bay vào Vành đai Tiểu hành tinh chính giữa Sao Hỏa và Sao Mộc, vào quỹ đạo và đáp xuống tiểu hành tinh / hành tinh lùn Ceres với hố va chạm Occator sáng rực.',
      objs: {
        orbit: 'Vào quỹ đạo Trái Đất',
        ceresSOI: 'Vào vùng hấp dẫn Ceres',
        ceresOrbit: 'Vào quỹ đạo Ceres',
        ceresLanded: 'Hạ cánh xuống Ceres',
      },
    },
    en: {
      name: 'Ceres Asteroid Expedition',
      desc: 'Fly into the Main Asteroid Belt between Mars and Jupiter, enter orbit and land on the dwarf planet / asteroid Ceres and its bright Occator Crater.',
      objs: {
        orbit: 'Enter Earth orbit',
        ceresSOI: 'Enter Ceres Sphere of Influence',
        ceresOrbit: 'Enter Ceres orbit',
        ceresLanded: 'Land safely on Ceres',
      },
    },
  },
  mercury: {
    vi: {
      name: 'Hành trình Sao Thủy',
      desc: 'Bay xa tới Sao Thủy (Mercury), vào quỹ đạo và đáp xuống bề mặt đầy hố thiên thạch cổ đại.',
      objs: {
        orbit: 'Vào quỹ đạo Trái Đất',
        mercurySOI: 'Vào vùng hấp dẫn Sao Thủy',
        mercuryOrbit: 'Vào quỹ đạo Sao Thủy',
        mercuryLanded: 'Hạ cánh xuống Sao Thủy',
      },
    },
    en: {
      name: 'Mercury Expedition',
      desc: 'Voyage to the innermost planet Mercury, capture into orbit and touch down on its cratered surface.',
      objs: {
        orbit: 'Enter Earth orbit',
        mercurySOI: 'Enter Mercury Sphere of Influence',
        mercuryOrbit: 'Enter Mercury orbit',
        mercuryLanded: 'Land safely on Mercury',
      },
    },
  },
  io: {
    vi: {
      name: 'Hạ cánh lên Io',
      desc: 'Bay tới hệ vệ tinh Sao Mộc và hạ cánh xuống Io – mặt trăng núi lửa hoạt động mạnh nhất Hệ Mặt Trời.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', ioSOI: 'Vào vùng hấp dẫn Io', ioOrbit: 'Vào quỹ đạo Io', ioLanded: 'Hạ cánh xuống Io' },
    },
    en: {
      name: 'Land on Io',
      desc: 'Fly to the Jovian system and touch down on Io – the most volcanically active moon in the Solar System.',
      objs: { orbit: 'Enter Earth orbit', ioSOI: 'Enter Io Sphere of Influence', ioOrbit: 'Enter Io orbit', ioLanded: 'Land safely on Io' },
    },
  },
  europa: {
    vi: {
      name: 'Hạ cánh lên Europa',
      desc: 'Thám hiểm mặt trăng băng giá Europa của Sao Mộc, vào quỹ đạo và đáp xuống lớp vỏ băng nứt nẻ.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', europaSOI: 'Vào vùng hấp dẫn Europa', europaOrbit: 'Vào quỹ đạo Europa', europaLanded: 'Hạ cánh xuống Europa' },
    },
    en: {
      name: 'Land on Europa',
      desc: 'Explore Jupiter’s icy moon Europa, capture into orbit and land on its fractured ice crust.',
      objs: { orbit: 'Enter Earth orbit', europaSOI: 'Enter Europa Sphere of Influence', europaOrbit: 'Enter Europa orbit', europaLanded: 'Land safely on Europa' },
    },
  },
  ganymede: {
    vi: {
      name: 'Hạ cánh lên Ganymede',
      desc: 'Chinh phục Ganymede – mặt trăng lớn nhất Hệ Mặt Trời quay quanh Sao Mộc, vào quỹ đạo và hạ cánh an toàn.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', ganymedeSOI: 'Vào vùng hấp dẫn Ganymede', ganymedeOrbit: 'Vào quỹ đạo Ganymede', ganymedeLanded: 'Hạ cánh xuống Ganymede' },
    },
    en: {
      name: 'Land on Ganymede',
      desc: 'Conquer Ganymede – the largest moon in the Solar System orbiting Jupiter, enter orbit and land safely.',
      objs: { orbit: 'Enter Earth orbit', ganymedeSOI: 'Enter Ganymede Sphere of Influence', ganymedeOrbit: 'Enter Ganymede orbit', ganymedeLanded: 'Land safely on Ganymede' },
    },
  },
  callisto: {
    vi: {
      name: 'Hạ cánh lên Callisto',
      desc: 'Bay tới vệ tinh ngoài cùng trong nhóm Galileo của Sao Mộc (Callisto), vào quỹ đạo và đáp xuống bề mặt cổ đại.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', callistoSOI: 'Vào vùng hấp dẫn Callisto', callistoOrbit: 'Vào quỹ đạo Callisto', callistoLanded: 'Hạ cánh xuống Callisto' },
    },
    en: {
      name: 'Land on Callisto',
      desc: 'Fly to Jupiter’s outermost Galilean moon Callisto, enter orbit and touch down on its ancient cratered surface.',
      objs: { orbit: 'Enter Earth orbit', callistoSOI: 'Enter Callisto Sphere of Influence', callistoOrbit: 'Enter Callisto orbit', callistoLanded: 'Land safely on Callisto' },
    },
  },
  mimas: {
    vi: {
      name: 'Hạ cánh lên Mimas',
      desc: 'Bay tới hệ vành đai Sao Thổ, tiếp cận mặt trăng Mimas nổi tiếng với hố va chạm Herschel khổng lồ và hạ cánh.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', mimasSOI: 'Vào vùng hấp dẫn Mimas', mimasOrbit: 'Vào quỹ đạo Mimas', mimasLanded: 'Hạ cánh xuống Mimas' },
    },
    en: {
      name: 'Land on Mimas',
      desc: 'Fly to the Saturnian system, approach Mimas with its giant Herschel crater and land on the surface.',
      objs: { orbit: 'Enter Earth orbit', mimasSOI: 'Enter Mimas Sphere of Influence', mimasOrbit: 'Enter Mimas orbit', mimasLanded: 'Land safely on Mimas' },
    },
  },
  enceladus: {
    vi: {
      name: 'Hạ cánh lên Enceladus',
      desc: 'Đáp xuống mặt trăng băng trắng tinh khiết Enceladus của Sao Thổ với những mạch phun băng cực nam.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', enceladusSOI: 'Vào vùng hấp dẫn Enceladus', enceladusOrbit: 'Vào quỹ đạo Enceladus', enceladusLanded: 'Hạ cánh xuống Enceladus' },
    },
    en: {
      name: 'Land on Enceladus',
      desc: 'Touch down on Saturn’s bright icy moon Enceladus and its south-polar cryovolcanic geysers.',
      objs: { orbit: 'Enter Earth orbit', enceladusSOI: 'Enter Enceladus Sphere of Influence', enceladusOrbit: 'Enter Enceladus orbit', enceladusLanded: 'Land safely on Enceladus' },
    },
  },
  tethys: {
    vi: {
      name: 'Hạ cánh lên Tethys',
      desc: 'Bay tới mặt trăng băng Tethys của Sao Thổ, vào quỹ đạo và hạ cánh xuống thung lũng Ithaca Chasma.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', tethysSOI: 'Vào vùng hấp dẫn Tethys', tethysOrbit: 'Vào quỹ đạo Tethys', tethysLanded: 'Hạ cánh xuống Tethys' },
    },
    en: {
      name: 'Land on Tethys',
      desc: 'Fly to Saturn’s icy moon Tethys, enter orbit and land near the Ithaca Chasma canyon.',
      objs: { orbit: 'Enter Earth orbit', tethysSOI: 'Enter Tethys Sphere of Influence', tethysOrbit: 'Enter Tethys orbit', tethysLanded: 'Land safely on Tethys' },
    },
  },
  dione: {
    vi: {
      name: 'Hạ cánh lên Dione',
      desc: 'Tiếp cận mặt trăng Dione của Sao Thổ, vào quỹ đạo ổn định và đáp xuống những vách đá băng sáng.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', dioneSOI: 'Vào vùng hấp dẫn Dione', dioneOrbit: 'Vào quỹ đạo Dione', dioneLanded: 'Hạ cánh xuống Dione' },
    },
    en: {
      name: 'Land on Dione',
      desc: 'Approach Saturn’s moon Dione, enter a stable orbit and touch down on its bright ice cliffs.',
      objs: { orbit: 'Enter Earth orbit', dioneSOI: 'Enter Dione Sphere of Influence', dioneOrbit: 'Enter Dione orbit', dioneLanded: 'Land safely on Dione' },
    },
  },
  rhea: {
    vi: {
      name: 'Hạ cánh lên Rhea',
      desc: 'Bay tới Rhea – mặt trăng lớn thứ hai của Sao Thổ, vào quỹ đạo và hạ cánh xuống bề mặt băng giá.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', rheaSOI: 'Vào vùng hấp dẫn Rhea', rheaOrbit: 'Vào quỹ đạo Rhea', rheaLanded: 'Hạ cánh xuống Rhea' },
    },
    en: {
      name: 'Land on Rhea',
      desc: 'Fly to Rhea – Saturn’s second-largest moon, capture into orbit and land on its icy surface.',
      objs: { orbit: 'Enter Earth orbit', rheaSOI: 'Enter Rhea Sphere of Influence', rheaOrbit: 'Enter Rhea orbit', rheaLanded: 'Land safely on Rhea' },
    },
  },
  titan: {
    vi: {
      name: 'Hạ cánh lên Titan',
      desc: 'Thám hiểm Titan – mặt trăng lớn nhất của Sao Thổ, vào quỹ đạo và đáp xuống bề mặt cam vàng đặc trưng.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', titanSOI: 'Vào vùng hấp dẫn Titan', titanOrbit: 'Vào quỹ đạo Titan', titanLanded: 'Hạ cánh xuống Titan' },
    },
    en: {
      name: 'Land on Titan',
      desc: 'Explore Titan – Saturn’s largest moon, enter orbit and land safely on its golden-orange surface.',
      objs: { orbit: 'Enter Earth orbit', titanSOI: 'Enter Titan Sphere of Influence', titanOrbit: 'Enter Titan orbit', titanLanded: 'Land safely on Titan' },
    },
  },
  iapetus: {
    vi: {
      name: 'Hạ cánh lên Iapetus',
      desc: 'Bay tới mặt trăng hai màu sáng-tối kỳ bí Iapetus ở rìa hệ Sao Thổ, vào quỹ đạo và hạ cánh.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', iapetusSOI: 'Vào vùng hấp dẫn Iapetus', iapetusOrbit: 'Vào quỹ đạo Iapetus', iapetusLanded: 'Hạ cánh xuống Iapetus' },
    },
    en: {
      name: 'Land on Iapetus',
      desc: 'Fly to Saturn’s mysterious two-toned moon Iapetus, enter orbit and touch down on its surface.',
      objs: { orbit: 'Enter Earth orbit', iapetusSOI: 'Enter Iapetus Sphere of Influence', iapetusOrbit: 'Enter Iapetus orbit', iapetusLanded: 'Land safely on Iapetus' },
    },
  },
  miranda: {
    vi: {
      name: 'Hạ cánh lên Miranda',
      desc: 'Bay tới hệ Sao Thiên Vương và đáp xuống Miranda – mặt trăng có địa hình vách đá Verona Rupes cao nhất Hệ Mặt Trời.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', mirandaSOI: 'Vào vùng hấp dẫn Miranda', mirandaOrbit: 'Vào quỹ đạo Miranda', mirandaLanded: 'Hạ cánh xuống Miranda' },
    },
    en: {
      name: 'Land on Miranda',
      desc: 'Fly to the Uranian system and land on Miranda, home to the tallest cliff (Verona Rupes) in the Solar System.',
      objs: { orbit: 'Enter Earth orbit', mirandaSOI: 'Enter Miranda Sphere of Influence', mirandaOrbit: 'Enter Miranda orbit', mirandaLanded: 'Land safely on Miranda' },
    },
  },
  ariel: {
    vi: {
      name: 'Hạ cánh lên Ariel',
      desc: 'Thám hiểm mặt trăng sáng nhất của Sao Thiên Vương (Ariel), vào quỹ đạo và hạ cánh xuống các hẻm núi băng.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', arielSOI: 'Vào vùng hấp dẫn Ariel', arielOrbit: 'Vào quỹ đạo Ariel', arielLanded: 'Hạ cánh xuống Ariel' },
    },
    en: {
      name: 'Land on Ariel',
      desc: 'Explore Uranus’s brightest moon Ariel, capture into orbit and land in its icy canyons.',
      objs: { orbit: 'Enter Earth orbit', arielSOI: 'Enter Ariel Sphere of Influence', arielOrbit: 'Enter Ariel orbit', arielLanded: 'Land safely on Ariel' },
    },
  },
  umbriel: {
    vi: {
      name: 'Hạ cánh lên Umbriel',
      desc: 'Bay tới mặt trăng tối cổ đại Umbriel của Sao Thiên Vương, vào quỹ đạo và đáp xuống miệng hố Wunda sáng rực.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', umbrielSOI: 'Vào vùng hấp dẫn Umbriel', umbrielOrbit: 'Vào quỹ đạo Umbriel', umbrielLanded: 'Hạ cánh xuống Umbriel' },
    },
    en: {
      name: 'Land on Umbriel',
      desc: 'Fly to Uranus’s dark moon Umbriel, enter orbit and touch down near the bright Wunda crater ring.',
      objs: { orbit: 'Enter Earth orbit', umbrielSOI: 'Enter Umbriel Sphere of Influence', umbrielOrbit: 'Enter Umbriel orbit', umbrielLanded: 'Land safely on Umbriel' },
    },
  },
  titania: {
    vi: {
      name: 'Hạ cánh lên Titania',
      desc: 'Chinh phục Titania – mặt trăng lớn nhất của Sao Thiên Vương, vào quỹ đạo và hạ cánh cắm cờ.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', titaniaSOI: 'Vào vùng hấp dẫn Titania', titaniaOrbit: 'Vào quỹ đạo Titania', titaniaLanded: 'Hạ cánh xuống Titania' },
    },
    en: {
      name: 'Land on Titania',
      desc: 'Conquer Titania – the largest moon of Uranus, enter orbit and land on its surface.',
      objs: { orbit: 'Enter Earth orbit', titaniaSOI: 'Enter Titania Sphere of Influence', titaniaOrbit: 'Enter Titania orbit', titaniaLanded: 'Land safely on Titania' },
    },
  },
  oberon: {
    vi: {
      name: 'Hạ cánh lên Oberon',
      desc: 'Bay tới vệ tinh ngoài cùng Oberon của Sao Thiên Vương, vào quỹ đạo và hạ cánh xuống bề mặt băng đá.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', oberonSOI: 'Vào vùng hấp dẫn Oberon', oberonOrbit: 'Vào quỹ đạo Oberon', oberonLanded: 'Hạ cánh xuống Oberon' },
    },
    en: {
      name: 'Land on Oberon',
      desc: 'Fly to Uranus’s outermost major moon Oberon, enter orbit and land on its cratered icy terrain.',
      objs: { orbit: 'Enter Earth orbit', oberonSOI: 'Enter Oberon Sphere of Influence', oberonOrbit: 'Enter Oberon orbit', oberonLanded: 'Land safely on Oberon' },
    },
  },
  triton: {
    vi: {
      name: 'Hạ cánh lên Triton',
      desc: 'Bay tới hệ Sao Hải Vương và đáp xuống Triton – mặt trăng băng nitơ khổng lồ có mạch phun lạnh.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', tritonSOI: 'Vào vùng hấp dẫn Triton', tritonOrbit: 'Vào quỹ đạo Triton', tritonLanded: 'Hạ cánh xuống Triton' },
    },
    en: {
      name: 'Land on Triton',
      desc: 'Fly to the Neptunian system and touch down on Triton – the giant nitrogen-ice moon with cryogeysers.',
      objs: { orbit: 'Enter Earth orbit', tritonSOI: 'Enter Triton Sphere of Influence', tritonOrbit: 'Enter Triton orbit', tritonLanded: 'Land safely on Triton' },
    },
  },
  pluto: {
    vi: {
      name: 'Hạ cánh lên Pluto',
      desc: 'Hành trình tới rìa Hệ Mặt Trời, vào quỹ đạo Pluto và đáp xuống đồng bằng băng hình trái tim Sputnik Planitia.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', plutoSOI: 'Vào vùng hấp dẫn Pluto', plutoOrbit: 'Vào quỹ đạo Pluto', plutoLanded: 'Hạ cánh xuống Pluto' },
    },
    en: {
      name: 'Land on Pluto',
      desc: 'Voyage to the edge of the Solar System, capture into Pluto orbit and land on the heart-shaped Sputnik Planitia.',
      objs: { orbit: 'Enter Earth orbit', plutoSOI: 'Enter Pluto Sphere of Influence', plutoOrbit: 'Enter Pluto orbit', plutoLanded: 'Land safely on Pluto' },
    },
  },
  haumea: {
    vi: {
      name: 'Thám hiểm Hành tinh lùn Haumea',
      desc: 'Bay tới Vành đai Kuiper ngoài Sao Diêm Vương, vào quỹ đạo và đáp xuống hành tinh lùn Haumea hình bầu dục có vành đai và đốm đỏ băng giá.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', haumeaSOI: 'Vào vùng hấp dẫn Haumea', haumeaOrbit: 'Vào quỹ đạo Haumea', haumeaLanded: 'Hạ cánh xuống Haumea' },
    },
    en: {
      name: 'Explore Dwarf Planet Haumea',
      desc: 'Fly into the Kuiper Belt beyond Pluto, enter orbit and land on the ringed ellipsoid dwarf planet Haumea with its dark red spot.',
      objs: { orbit: 'Enter Earth orbit', haumeaSOI: 'Enter Haumea Sphere of Influence', haumeaOrbit: 'Enter Haumea orbit', haumeaLanded: 'Land safely on Haumea' },
    },
  },
  makemake: {
    vi: {
      name: 'Thám hiểm Hành tinh lùn Makemake',
      desc: 'Bay sâu vào Vành đai Kuiper ngoài Haumea, vào quỹ đạo và đáp xuống bề mặt băng mê-tan đỏ cam của hành tinh lùn Makemake.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', makemakeSOI: 'Vào vùng hấp dẫn Makemake', makemakeOrbit: 'Vào quỹ đạo Makemake', makemakeLanded: 'Hạ cánh xuống Makemake' },
    },
    en: {
      name: 'Explore Dwarf Planet Makemake',
      desc: 'Fly deep into the Kuiper Belt beyond Haumea, enter orbit and land on the reddish-amber methane-ice dwarf planet Makemake.',
      objs: { orbit: 'Enter Earth orbit', makemakeSOI: 'Enter Makemake Sphere of Influence', makemakeOrbit: 'Enter Makemake orbit', makemakeLanded: 'Land safely on Makemake' },
    },
  },
  eris: {
    vi: {
      name: 'Chinh phục Hành tinh lùn Eris',
      desc: 'Viễn chinh tới Đĩa Phân Tán ở rìa xa nhất Hệ Mặt Trời, vào quỹ đạo và đáp xuống bề mặt băng nitơ trắng sáng của hành tinh lùn nặng nhất Eris.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', erisSOI: 'Vào vùng hấp dẫn Eris', erisOrbit: 'Vào quỹ đạo Eris', erisLanded: 'Hạ cánh xuống Eris' },
    },
    en: {
      name: 'Conquer Dwarf Planet Eris',
      desc: 'Expedition to the Scattered Disc at the far edge of the Solar System, enter orbit and land on the brilliant white nitrogen-ice dwarf planet Eris.',
      objs: { orbit: 'Enter Earth orbit', erisSOI: 'Enter Eris Sphere of Influence', erisOrbit: 'Enter Eris orbit', erisLanded: 'Land safely on Eris' },
    },
  },
  rover_500km: {
    vi: {
      name: 'Chạy 500 km (Không tự lái)',
      desc: 'Tự tay điều khiển Xe địa hình Rover 4x4 chạy trên bề mặt đạt tổng quãng đường 500 km (Không có chế độ Lái tự động).',
      objs: {
        roverDist100: 'Chạy đạt 100 km trên bề mặt',
        roverDist250: 'Chạy đạt 250 km trên bề mặt',
        roverDist500: 'Chạy hoàn thành đủ 500 km (Không tự lái)',
      },
    },
    en: {
      name: 'Drive 500 km (No Autopilot)',
      desc: 'Manually drive the 4x4 Planetary Rover across the surface for a total distance of 500 km (Autopilot is disabled).',
      objs: {
        roverDist100: 'Drive 100 km on the surface',
        roverDist250: 'Drive 250 km on the surface',
        roverDist500: 'Complete 500 km drive (No Autopilot)',
      },
    },
  },
  rover_1000km: {
    vi: {
      name: 'Chạy 1000 km (Không tự lái)',
      desc: 'Hành trình xuyên lục địa: Tự tay điều khiển Xe địa hình Rover 4x4 chạy trên bề mặt đạt tổng quãng đường 1000 km (Không có chế độ Lái tự động).',
      objs: {
        roverDist250: 'Chạy đạt 250 km trên bề mặt',
        roverDist500: 'Chạy đạt 500 km trên bề mặt',
        roverDist1000: 'Chạy hoàn thành đủ 1000 km (Không tự lái)',
      },
    },
    en: {
      name: 'Drive 1000 km (No Autopilot)',
      desc: 'Cross-continental expedition: Manually drive the 4x4 Planetary Rover across the surface for a total distance of 1000 km (Autopilot is disabled).',
      objs: {
        roverDist250: 'Drive 250 km on the surface',
        roverDist500: 'Drive 500 km on the surface',
        roverDist1000: 'Complete 1000 km drive (No Autopilot)',
      },
    },
  },
  rover_2000km: {
    vi: {
      name: 'Chạy 2000 km (Không tự lái)',
      desc: 'Thử thách viễn chinh đường trường: Tự tay điều khiển Xe địa hình Rover 4x4 chạy trên bề mặt đạt tổng quãng đường 2000 km (Không có chế độ Lái tự động).',
      objs: {
        roverDist500: 'Chạy đạt 500 km trên bề mặt',
        roverDist1000: 'Chạy đạt 1000 km trên bề mặt',
        roverDist2000: 'Chạy hoàn thành đủ 2000 km (Không tự lái)',
      },
    },
    en: {
      name: 'Drive 2000 km (No Autopilot)',
      desc: 'Endurance rally challenge: Manually drive the 4x4 Planetary Rover across the surface for a total distance of 2000 km (Autopilot is disabled).',
      objs: {
        roverDist500: 'Drive 500 km on the surface',
        roverDist1000: 'Drive 1000 km on the surface',
        roverDist2000: 'Complete 2000 km drive (No Autopilot)',
      },
    },
  },
  boat_500km: {
    vi: {
      name: 'Đi 500 km trên biển',
      desc: 'Lái Thuyền to hoặc Thuyền nhỏ rời cảng ra khơi đạt tổng hải trình 500 km trên mặt biển.',
      objs: {
        boatDist100: 'Đi đạt 100 km trên mặt biển',
        boatDist250: 'Đi đạt 250 km trên mặt biển',
        boatDist500: 'Đi hoàn thành đủ 500 km trên mặt biển',
      },
    },
    en: {
      name: 'Sail 500 km at Sea',
      desc: 'Pilot the Big Boat or Small Boat out of the harbor and across the open ocean for a total distance of 500 km.',
      objs: {
        boatDist100: 'Sail 100 km across the ocean',
        boatDist250: 'Sail 250 km across the ocean',
        boatDist500: 'Complete 500 km ocean voyage',
      },
    },
  },
  boat_1000km: {
    vi: {
      name: 'Đi 1000 km trên biển',
      desc: 'Hải trình viễn dương: Điều khiển Thuyền to hoặc Thuyền nhỏ vượt sóng đạt tổng quãng đường 1000 km trên đại dương.',
      objs: {
        boatDist250: 'Đi đạt 250 km trên mặt biển',
        boatDist500: 'Đi đạt 500 km trên mặt biển',
        boatDist1000: 'Đi hoàn thành đủ 1000 km trên mặt biển',
      },
    },
    en: {
      name: 'Sail 1000 km at Sea',
      desc: 'Transoceanic voyage: Pilot the Big Boat or Small Boat across the open ocean for a total distance of 1000 km.',
      objs: {
        boatDist250: 'Sail 250 km across the ocean',
        boatDist500: 'Sail 500 km across the ocean',
        boatDist1000: 'Complete 1000 km ocean voyage',
      },
    },
  },
  boat_2000km: {
    vi: {
      name: 'Đi 2000 km trên biển',
      desc: 'Thử thách chinh phục đại dương: Lái Thuyền to hoặc Thuyền nhỏ vượt qua tổng hải trình 2000 km trên biển khơi.',
      objs: {
        boatDist500: 'Đi đạt 500 km trên mặt biển',
        boatDist1000: 'Đi đạt 1000 km trên mặt biển',
        boatDist2000: 'Đi hoàn thành đủ 2000 km trên mặt biển',
      },
    },
    en: {
      name: 'Sail 2000 km at Sea',
      desc: 'Ocean endurance challenge: Pilot the Big Boat or Small Boat across 2000 km of open ocean.',
      objs: {
        boatDist500: 'Sail 500 km across the ocean',
        boatDist1000: 'Sail 1000 km across the ocean',
        boatDist2000: 'Complete 2000 km ocean voyage',
      },
    },
  },
  boat_harbor_1: {
    vi: {
      name: 'Tới 1 cảng',
      desc: 'Lái Thuyền to hoặc Thuyền nhỏ (hoặc bật Lái tự động G) rời bến và di chuyển cập vào 1 cảng biển.',
      objs: {
        boatHarbor1: 'Di chuyển và cập bến an toàn tại 1 cảng biển',
      },
    },
    en: {
      name: 'Reach 1 Harbor',
      desc: 'Pilot the Big Boat or Small Boat (or enable Autopilot G) to depart and arrive safely at 1 harbor.',
      objs: {
        boatHarbor1: 'Sail and arrive safely at 1 harbor',
      },
    },
  },
  boat_harbor_2: {
    vi: {
      name: 'Tới 2 cảng',
      desc: 'Điều khiển Thuyền to hoặc Thuyền nhỏ (hoặc bật Lái tự động G) lần lượt di chuyển tới đủ 2 cảng biển.',
      objs: {
        boatHarbor1: 'Tới cảng biển thứ 1',
        boatHarbor2: 'Tới hoàn thành đủ 2 cảng biển',
      },
    },
    en: {
      name: 'Reach 2 Harbors',
      desc: 'Pilot the Big Boat or Small Boat (or enable Autopilot G) to sail and arrive at 2 harbors.',
      objs: {
        boatHarbor1: 'Reach the 1st harbor',
        boatHarbor2: 'Complete arrival at 2 harbors',
      },
    },
  },
  boat_harbor_3: {
    vi: {
      name: 'Tới 3 cảng',
      desc: 'Điều khiển Thuyền to hoặc Thuyền nhỏ (hoặc bật Lái tự động G) vượt sóng cập bến đủ 3 cảng biển.',
      objs: {
        boatHarbor1: 'Tới cảng biển thứ 1',
        boatHarbor2: 'Tới cảng biển thứ 2',
        boatHarbor3: 'Tới hoàn thành đủ 3 cảng biển',
      },
    },
    en: {
      name: 'Reach 3 Harbors',
      desc: 'Pilot the Big Boat or Small Boat (or enable Autopilot G) across the coast to reach 3 harbors.',
      objs: {
        boatHarbor1: 'Reach the 1st harbor',
        boatHarbor2: 'Reach the 2nd harbor',
        boatHarbor3: 'Complete arrival at 3 harbors',
      },
    },
  },
  boat_harbor_4: {
    vi: {
      name: 'Tới 4 cảng',
      desc: 'Hải trình liên cảng: Lái Thuyền to hoặc Thuyền nhỏ (hoặc bật Lái tự động G) di chuyển tới đủ 4 cảng biển.',
      objs: {
        boatHarbor1: 'Tới cảng biển thứ 1',
        boatHarbor2: 'Tới cảng biển thứ 2',
        boatHarbor3: 'Tới cảng biển thứ 3',
        boatHarbor4: 'Tới hoàn thành đủ 4 cảng biển',
      },
    },
    en: {
      name: 'Reach 4 Harbors',
      desc: 'Coastal harbor tour: Pilot the Big Boat or Small Boat (or enable Autopilot G) to reach 4 harbors.',
      objs: {
        boatHarbor1: 'Reach the 1st harbor',
        boatHarbor2: 'Reach the 2nd harbor',
        boatHarbor3: 'Reach the 3rd harbor',
        boatHarbor4: 'Complete arrival at 4 harbors',
      },
    },
  },
  boat_harbor_5: {
    vi: {
      name: 'Tới 5 cảng',
      desc: 'Chinh phục toàn bộ 5 cảng biển: Lái Thuyền to hoặc Thuyền nhỏ (hoặc bật Lái tự động G) cập bến cả 5 cảng biển!',
      objs: {
        boatHarbor1: 'Tới cảng biển thứ 1',
        boatHarbor2: 'Tới cảng biển thứ 2',
        boatHarbor3: 'Tới cảng biển thứ 3',
        boatHarbor4: 'Tới cảng biển thứ 4',
        boatHarbor5: 'Tới hoàn thành đủ 5 cảng biển',
      },
    },
    en: {
      name: 'Reach 5 Harbors',
      desc: 'Conquer all 5 harbors: Pilot the Big Boat or Small Boat (or enable Autopilot G) to reach all 5 harbors!',
      objs: {
        boatHarbor1: 'Reach the 1st harbor',
        boatHarbor2: 'Reach the 2nd harbor',
        boatHarbor3: 'Reach the 3rd harbor',
        boatHarbor4: 'Reach the 4th harbor',
        boatHarbor5: 'Complete arrival at all 5 harbors',
      },
    },
  },
  plane_airport_1: {
    vi: {
      name: 'Đáp lên 1 sân bay',
      desc: 'Lái Tiêm kích phản lực F-22 (hoặc bật Lái tự động G) cất cánh và hạ cánh an toàn xuống 1 sân bay.',
      objs: {
        planeAirport1: 'Cất cánh và đáp an toàn lên 1 sân bay',
      },
    },
    en: {
      name: 'Land on 1 Airport',
      desc: 'Pilot the F-22 Fighter Jet (or enable Autopilot G) to take off and land safely on 1 airport.',
      objs: {
        planeAirport1: 'Take off and land safely on 1 airport',
      },
    },
  },
  plane_airport_2: {
    vi: {
      name: 'Đáp lên 2 sân bay',
      desc: 'Điều khiển Tiêm kích phản lực F-22 (hoặc bật Lái tự động G) bay và hạ cánh an toàn lên đủ 2 sân bay.',
      objs: {
        planeAirport1: 'Đáp an toàn lên sân bay thứ 1',
        planeAirport2: 'Đáp hoàn thành đủ 2 sân bay',
      },
    },
    en: {
      name: 'Land on 2 Airports',
      desc: 'Pilot the F-22 Fighter Jet (or enable Autopilot G) to fly and land safely on 2 airports.',
      objs: {
        planeAirport1: 'Land safely on the 1st airport',
        planeAirport2: 'Complete landings on 2 airports',
      },
    },
  },
  plane_airport_3: {
    vi: {
      name: 'Đáp lên 3 sân bay',
      desc: 'Điều khiển Tiêm kích phản lực F-22 (hoặc bật Lái tự động G) bay chuyển tiếp và hạ cánh an toàn lên đủ 3 sân bay.',
      objs: {
        planeAirport1: 'Đáp an toàn lên sân bay thứ 1',
        planeAirport2: 'Đáp an toàn lên sân bay thứ 2',
        planeAirport3: 'Đáp hoàn thành đủ 3 sân bay',
      },
    },
    en: {
      name: 'Land on 3 Airports',
      desc: 'Pilot the F-22 Fighter Jet (or enable Autopilot G) to hop and land safely on 3 airports.',
      objs: {
        planeAirport1: 'Land safely on the 1st airport',
        planeAirport2: 'Land safely on the 2nd airport',
        planeAirport3: 'Complete landings on 3 airports',
      },
    },
  },
  plane_airport_4: {
    vi: {
      name: 'Đáp lên 4 sân bay',
      desc: 'Thử thách phi công: Lái Tiêm kích phản lực F-22 (hoặc bật Lái tự động G) hạ cánh chính xác lên đủ 4 sân bay.',
      objs: {
        planeAirport1: 'Đáp an toàn lên sân bay thứ 1',
        planeAirport2: 'Đáp an toàn lên sân bay thứ 2',
        planeAirport3: 'Đáp an toàn lên sân bay thứ 3',
        planeAirport4: 'Đáp hoàn thành đủ 4 sân bay',
      },
    },
    en: {
      name: 'Land on 4 Airports',
      desc: 'Pilot challenge: Fly the F-22 Fighter Jet (or enable Autopilot G) and land accurately on 4 airports.',
      objs: {
        planeAirport1: 'Land safely on the 1st airport',
        planeAirport2: 'Land safely on the 2nd airport',
        planeAirport3: 'Land safely on the 3rd airport',
        planeAirport4: 'Complete landings on 4 airports',
      },
    },
  },
  plane_airport_5: {
    vi: {
      name: 'Đáp lên 5 sân bay',
      desc: 'Chinh phục toàn bộ 5 sân bay: Lái Tiêm kích phản lực F-22 (hoặc bật Lái tự động G) hạ cánh an toàn lên cả 5 sân bay!',
      objs: {
        planeAirport1: 'Đáp an toàn lên sân bay thứ 1',
        planeAirport2: 'Đáp an toàn lên sân bay thứ 2',
        planeAirport3: 'Đáp an toàn lên sân bay thứ 3',
        planeAirport4: 'Đáp an toàn lên sân bay thứ 4',
        planeAirport5: 'Đáp hoàn thành đủ 5 sân bay',
      },
    },
    en: {
      name: 'Land on 5 Airports',
      desc: 'Conquer all 5 airports: Pilot the F-22 Fighter Jet (or enable Autopilot G) and land safely on all 5 airports!',
      objs: {
        planeAirport1: 'Land safely on the 1st airport',
        planeAirport2: 'Land safely on the 2nd airport',
        planeAirport3: 'Land safely on the 3rd airport',
        planeAirport4: 'Land safely on the 4th airport',
        planeAirport5: 'Complete landings on all 5 airports',
      },
    },
  },
};

for (const spec of ROVER_LOOP_SPECS) {
  const fullKm = Math.round(2 * Math.PI * spec.rKm);
  const halfKm = Math.round(Math.PI * spec.rKm);
  const b = spec.body;
  MISSION_I18N[`rover_loop_${b}`] = {
    vi: {
      name: `Chạy một vòng ${spec.viName} (Không tự lái)`,
      desc: `Tự tay lái Xe địa hình Rover 4x4 chạy trọn 1 vòng chu vi quanh ${spec.viName} (${spec.viSub} · Chu vi ${fullKm} km – Không có chế độ Lái tự động).`,
      objs: {
        [`${b}HalfLoop`]: `Chạy được nửa vòng ${spec.viName} (${halfKm} km)`,
        [`${b}FullLoop`]: `Chạy hoàn thành đủ 1 vòng ${spec.viName} (${fullKm} km)`,
      },
    },
    en: {
      name: `Drive 1 Lap Around ${spec.enName} (No Autopilot)`,
      desc: `Manually drive the 4x4 Planetary Rover a full circumference lap around ${spec.enName} (${spec.enSub} · Circumference ${fullKm} km – Autopilot is disabled).`,
      objs: {
        [`${b}HalfLoop`]: `Drive half a lap around ${spec.enName} (${halfKm} km)`,
        [`${b}FullLoop`]: `Complete 1 full lap around ${spec.enName} (${fullKm} km)`,
      },
    },
  };
}

for (const spec of PLANE_LOOP_SPECS) {
  const fullKm = Math.round(2 * Math.PI * spec.rKm);
  const halfKm = Math.round(Math.PI * spec.rKm);
  const b = spec.body;
  MISSION_I18N[`plane_loop_${b}`] = {
    vi: {
      name: `Bay một vòng ${spec.viName}`,
      desc: `Lái Tiêm kích phản lực F-22 (hoặc bật Lái tự động G) bay trọn 1 vòng chu vi trong bầu khí quyển quanh ${spec.viName} (${spec.viSub} · Chu vi ${fullKm} km).`,
      objs: {
        [`${b}PlaneHalfLoop`]: `Bay được nửa vòng ${spec.viName} (${halfKm} km)`,
        [`${b}PlaneFullLoop`]: `Bay hoàn thành đủ 1 vòng ${spec.viName} (${fullKm} km)`,
      },
    },
    en: {
      name: `Fly 1 Lap Around ${spec.enName}`,
      desc: `Pilot the F-22 Fighter Jet (or enable Autopilot G) for a full circumference lap through the atmosphere of ${spec.enName} (${spec.enSub} · Circumference ${fullKm} km).`,
      objs: {
        [`${b}PlaneHalfLoop`]: `Fly half a lap around ${spec.enName} (${halfKm} km)`,
        [`${b}PlaneFullLoop`]: `Complete 1 full lap around ${spec.enName} (${fullKm} km)`,
      },
    },
  };
}

const BODY_LABELS = {
  sun: { vi: 'Mặt Trời', en: 'Sun' },
  mercury: { vi: 'Sao Thủy', en: 'Mercury' },
  venus: { vi: 'Sao Kim', en: 'Venus' },
  earth: { vi: 'Trái Đất', en: 'Earth' },
  moon: { vi: 'Mặt Trăng', en: 'Moon' },
  mars: { vi: 'Sao Hỏa', en: 'Mars' },
  phobos: { vi: 'Phobos', en: 'Phobos' },
  deimos: { vi: 'Deimos', en: 'Deimos' },
  ceres: { vi: 'Ceres', en: 'Ceres' },
  jupiter: { vi: 'Sao Mộc', en: 'Jupiter' },
  io: { vi: 'Io', en: 'Io' },
  europa: { vi: 'Europa', en: 'Europa' },
  ganymede: { vi: 'Ganymede', en: 'Ganymede' },
  callisto: { vi: 'Callisto', en: 'Callisto' },
  saturn: { vi: 'Sao Thổ', en: 'Saturn' },
  mimas: { vi: 'Mimas', en: 'Mimas' },
  enceladus: { vi: 'Enceladus', en: 'Enceladus' },
  tethys: { vi: 'Tethys', en: 'Tethys' },
  dione: { vi: 'Dione', en: 'Dione' },
  rhea: { vi: 'Rhea', en: 'Rhea' },
  titan: { vi: 'Titan', en: 'Titan' },
  iapetus: { vi: 'Iapetus', en: 'Iapetus' },
  uranus: { vi: 'Sao Thiên Vương', en: 'Uranus' },
  miranda: { vi: 'Miranda', en: 'Miranda' },
  ariel: { vi: 'Ariel', en: 'Ariel' },
  umbriel: { vi: 'Umbriel', en: 'Umbriel' },
  titania: { vi: 'Titania', en: 'Titania' },
  oberon: { vi: 'Oberon', en: 'Oberon' },
  neptune: { vi: 'Sao Hải Vương', en: 'Neptune' },
  triton: { vi: 'Triton', en: 'Triton' },
  pluto: { vi: 'Sao Diêm Vương', en: 'Pluto' },
  haumea: { vi: 'Haumea', en: 'Haumea' },
  makemake: { vi: 'Makemake', en: 'Makemake' },
  eris: { vi: 'Eris', en: 'Eris' },
};

export function applyLanguage(lang, app) {
  if (lang !== 'vi' && lang !== 'en') lang = 'en';
  currentLang = lang;
  try {
    localStorage.setItem('rf-lang-v2', lang);
    localStorage.setItem('rf-lang', lang);
  } catch { /* ignore */ }
  document.documentElement.lang = lang;
  document.title = lang === 'en' ? 'Rocket Forge – 3D Spaceflight Simulator' : 'Rocket Forge – Lắp ráp & Phóng tên lửa';

  // 1. Update PARTS in-place
  for (const [k, def] of Object.entries(PARTS)) {
    const t = PART_I18N[k]?.[lang];
    if (t) {
      def.name = t.name;
      def.cat = t.cat;
      def.desc = t.desc;
    }
  }

  // 2. Update MISSIONS in-place
  for (const m of MISSIONS) {
    const t = MISSION_I18N[m.id]?.[lang];
    if (t) {
      m.name = t.name;
      m.desc = t.desc;
      for (const o of m.objectives) {
        if (t.objs[o.id]) o.text = t.objs[o.id];
      }
    }
  }

  // 3. Update BODIES labels in-place
  for (const [k, b] of Object.entries(BODIES)) {
    if (BODY_LABELS[k]?.[lang]) {
      b.label = BODY_LABELS[k][lang];
    }
  }

  // 4. Update active state on language buttons in Settings & Pause modals
  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.classList.toggle('on', btn.dataset.lang === lang);
  });

  // 5. Translate static DOM elements
  const setTxt = (sel, vi, en) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = lang === 'en' ? en : vi;
  };
  const setHtml = (sel, vi, en) => {
    const el = document.querySelector(sel);
    if (el) el.innerHTML = lang === 'en' ? en : vi;
  };
  const setAttr = (sel, attr, vi, en) => {
    const el = document.querySelector(sel);
    if (el) el.setAttribute(attr, lang === 'en' ? en : vi);
  };

  // Build UI (Minimalist Icon Labels)
  setTxt('#load-tip', '💡 Nên chơi toàn màn hình (F11)', '💡 Recommended: Fullscreen (F11)');
  setTxt('#btn-undo', '↶', '↶');
  setTxt('#btn-clear', '🗑', '🗑');
  setTxt('#btn-preset', '🚀', '🚀');
  setAttr('#btn-mission', 'title', 'Chọn nhiệm vụ', 'Select Mission');
  setAttr('#btn-preset', 'title', 'Mẫu tên lửa', 'Rocket Presets');
  setAttr('#btn-undo', 'title', 'Hoàn tác (Ctrl+Z)', 'Undo (Ctrl+Z)');
  setAttr('#btn-clear', 'title', 'Xóa tất cả', 'Clear All');
  setAttr('#btn-settings', 'title', 'Cài đặt (O)', 'Settings (O)');
  setTxt('#preset-modal-title', '🚀 Mẫu Tên Lửa', '🚀 Select Rocket Preset');
  setTxt('#btn-preset-close', 'Đóng', 'Close');
  setAttr('#btn-preset-x', 'title', 'Đóng (Esc)', 'Close (Esc)');
  setTxt('#palette h3', '🧩 Linh kiện', '🧩 Parts');
  setAttr('#preset-search', 'placeholder', 'Gõ tìm tên lửa (VD: Apollo, Starship, UFO…)', 'Type to search rockets (e.g. Apollo, Starship, UFO…)');
  setAttr('#preset-search-clear', 'title', 'Xóa tìm kiếm', 'Clear search');
  setAttr('#part-search', 'placeholder', 'Tìm linh kiện, tên lửa…', 'Search parts, rockets…');
  setAttr('#part-search-clear', 'title', 'Xóa tìm kiếm', 'Clear search');
  setTxt('#stats h3', '📊 Thông số', '📊 Specs');
  setTxt('#rocket-name-label', '🏷️ Tên tên lửa', '🏷️ Rocket Name');
  setAttr('#rocket-name-input', 'placeholder', 'Đặt tên tên lửa…', 'Enter rocket name…');
  setAttr('#btn-rocket-rename', 'title', 'Đặt lại tên tên lửa', 'Rename rocket');
  setAttr('#hud-rocket-name-input', 'placeholder', 'Đặt tên tên lửa…', 'Enter rocket name…');
  setAttr('#btn-hud-rename', 'title', 'Đặt lại tên tên lửa', 'Rename rocket');

  const statLabels = document.querySelectorAll('#stats .stat-grid .stat label');
  if (statLabels.length >= 4) {
    statLabels[0].textContent = tr('⚖ Khối lượng', '⚖ Mass');
    statLabels[1].textContent = tr('📏 Chiều cao', '📏 Height');
    statLabels[2].textContent = tr('🚀 TWR', '🚀 TWR');
    statLabels[3].textContent = tr('⚡ Tổng Δv', '⚡ Total Δv');
  }
  const dvMarks = document.querySelectorAll('#stats .dv-bar i');
  if (dvMarks.length >= 2) {
    dvMarks[0].setAttribute('data-l', tr('Vũ trụ', 'Space'));
    dvMarks[1].setAttribute('data-l', tr('Quỹ đạo', 'Orbit'));
  }
  setTxt('#stats h4', 'Các tầng', 'Stages');

  setTxt('#btn-rot-x', '🔴 X 90°', '🔴 X 90°');
  setTxt('#btn-rot-y', '🟢 Y 90°', '🟢 Y 90°');
  setTxt('#btn-rot-z', '🔵 Z 90°', '🔵 Z 90°');
  setTxt('#btn-rot-reset', '↺ 0°', '↺ 0°');
  setAttr('#btn-rot-x', 'title', 'Xoay trục X 90° (Phím 1 / X)', 'Rotate X 90° (Key 1 / X)');
  setAttr('#btn-rot-y', 'title', 'Xoay trục Y 90° (Phím 2 / Y)', 'Rotate Y 90° (Key 2 / Y)');
  setAttr('#btn-rot-z', 'title', 'Xoay trục Z 90° (Phím 3 / Z)', 'Rotate Z 90° (Key 3 / Z)');
  setAttr('#btn-rot-reset', 'title', 'Đặt lại góc xoay (0°)', 'Reset rotation (0°)');
  setTxt('#btn-side-toggle', '↔ Gắn 2 bên', '↔ Side Mount ×2');
  setTxt('#btn-del', '🗑 Xóa (Del)', '🗑 Delete (Del)');

  setTxt('#quick-rot-bar .rot-bar-title', '📐 3D:', '📐 3D:');
  setTxt('#bar-rot-x', '🔴 X 90°', '🔴 X 90°');
  setTxt('#bar-rot-y', '🟢 Y 90°', '🟢 Y 90°');
  setTxt('#bar-rot-z', '🔵 Z 90°', '🔵 Z 90°');
  setAttr('#bar-rot-x', 'title', 'Xoay trục X 90° (Phím 1 / X)', 'Rotate X 90° (Key 1 / X)');
  setAttr('#bar-rot-y', 'title', 'Xoay trục Y 90° (Phím 2 / Y)', 'Rotate Y 90° (Key 2 / Y)');
  setAttr('#bar-rot-z', 'title', 'Xoay trục Z 90° (Phím 3 / Z)', 'Rotate Z 90° (Key 3 / Z)');
  setAttr('#bar-rot-reset', 'title', 'Đặt lại góc xoay (0°)', 'Reset rotation (0°)');

  setHtml(
    '#build-ui .hint',
    '🖱 Kéo linh kiện · Click chọn · <kbd>1/2/3</kbd> Xoay · <kbd>Del</kbd> Xóa · <kbd>Ctrl+Z</kbd> Hoàn tác',
    '🖱 Drag parts · Click select · <kbd>1/2/3</kbd> Rotate · <kbd>Del</kbd> Delete · <kbd>Ctrl+Z</kbd> Undo'
  );
  setTxt('#btn-launchpad', '🚀 PHÓNG', '🚀 LAUNCH');

  // Launch UI (Minimalist Icon-Driven Telemetry)
  const leftReadouts = document.querySelectorAll('#launch-ui .hud-left .big-readout label');
  if (leftReadouts.length >= 1) leftReadouts[0].textContent = tr('⛰ ĐỘ CAO', '⛰ ALT');
  setTxt('#h-vel-l', '⚡ VẬN TỐC', '⚡ VEL');

  const leftRowGroups = document.querySelectorAll('#launch-ui .hud-left > .rows');
  const leftSpans = leftRowGroups[0] ? leftRowGroups[0].querySelectorAll('div span') : [];
  if (leftSpans.length >= 7) {
    leftSpans[0].textContent = '↕ VS';
    leftSpans[1].textContent = '↔ HS';
    leftSpans[2].textContent = '🔥 M';
    leftSpans[3].textContent = '⊕ G';
    leftSpans[4].textContent = '💨 Q';
    leftSpans[5].textContent = tr('📐 Góc', '📐 ANG');
    leftSpans[6].textContent = '⏱ MET';
  }
  const orbitHeader = document.querySelector('#launch-ui .hud-left h4.sub');
  if (orbitHeader) {
    const bodySpan = document.getElementById('h-body');
    const curBody = bodySpan ? bodySpan.textContent : tr('Trái Đất', 'Earth');
    orbitHeader.innerHTML = `🪐 <span id="h-body">${curBody}</span>`;
  }
  const orbitSpans = leftRowGroups[1] ? leftRowGroups[1].querySelectorAll('div span') : [];
  if (orbitSpans.length >= 3) {
    orbitSpans[0].textContent = '▲ Ap';
    orbitSpans[1].textContent = '▼ Pe';
    orbitSpans[2].textContent = '⟳ T';
  }
  const targetSpans = document.querySelectorAll('#h-target-box .rows div span');
  if (targetSpans.length >= 2) {
    targetSpans[0].textContent = tr('📏 Cách', '📏 Dist');
    targetSpans[1].textContent = tr('⚡ Tốc', '⚡ Rel');
  }

  setTxt('#launch-ui .hud-right h4', '⛽ CÁC TẦNG', '⛽ STAGES');
  const rightSpans = document.querySelectorAll('#launch-ui .hud-right .rows div span');
  if (rightSpans.length >= 5) {
    rightSpans[0].textContent = '🧭 SAS';
    rightSpans[1].textContent = '🎯';
    rightSpans[2].textContent = '🤖 AP';
    rightSpans[3].textContent = '⏩';
    rightSpans[4].textContent = '🎥';
    if (rightSpans[5]) rightSpans[5].textContent = '👽';
    if (rightSpans[6]) rightSpans[6].textContent = tr('👨‍🚀 ĐH', '👨‍🚀 Crew');
  }
  setTxt('#astro-bar-title', '👨‍🚀', '👨‍🚀');
  setTxt('#btn-astro-add-1', '+1', '+1');
  setTxt('#btn-astro-add-2', '+2', '+2');
  setTxt('#btn-astro-add-3', '+3', '+3');
  setTxt('#btn-astro-add-4', '+4', '+4');
  setTxt('#btn-astro-add-5', '+5', '+5');
  setTxt('#btn-astro-deploy', '👨‍🚀 Thả', '👨‍🚀 Deploy');
  setHtml('#btn-autopilot', '🤖 Tự lái <kbd>G</kbd>', '🤖 Auto <kbd>G</kbd>');
  setHtml('#btn-toggle-map', '🌐 Bản đồ <kbd>M</kbd>', '🌐 Map <kbd>M</kbd>');
  setHtml('#btn-teleport', '🪐 Dịch <kbd>Y</kbd>', '🪐 Warp <kbd>Y</kbd>');

  // Teleport Quick-Bar & Modal
  setTxt('#tp-bar-title', '🪐', '🪐');
  setTxt('#btn-tp-expand', '⊞ Y', '⊞ Y');
  setAttr('#btn-tp-mode', 'title', 'Đổi chế độ: Bề mặt / Quỹ đạo', 'Switch mode: Surface or Orbit');
  setAttr('#btn-tp-expand', 'title', 'Mở bảng dịch chuyển (Y)', 'Open teleport panel (Y)');
  setTxt('#tp-bar-btns [data-tp="earth"]', '🌍 Trái Đất', '🌍 Earth');
  setTxt('#tp-bar-btns [data-tp="iss"]', '🛰️ ISS', '🛰️ ISS');
  setTxt('#tp-bar-btns [data-tp="moon"]', '🌕 Mặt Trăng', '🌕 Moon');
  setTxt('#tp-bar-btns [data-tp="mercury"]', '⚪ Sao Thủy', '⚪ Mercury');
  setTxt('#tp-bar-btns [data-tp="venus"]', '🟡 Sao Kim', '🟡 Venus');
  setTxt('#tp-bar-btns [data-tp="mars"]', '🔴 Sao Hỏa', '🔴 Mars');
  setTxt('#tp-bar-btns [data-tp="olympus"]', '🌋 Olympus', '🌋 Olympus');
  setTxt('#tp-bar-btns [data-tp="phobos"]', '🪨 Phobos', '🪨 Phobos');
  setTxt('#tp-bar-btns [data-tp="deimos"]', '🪨 Deimos', '🪨 Deimos');
  setTxt('#tp-bar-btns [data-tp="ceres"]', '🪨 Ceres', '🪨 Ceres');
  setTxt('#tp-bar-btns [data-tp="jupiter"]', '🟠 Sao Mộc', '🟠 Jupiter');
  setTxt('#tp-bar-btns [data-tp="io"]', '🌋 Io', '🌋 Io');
  setTxt('#tp-bar-btns [data-tp="europa"]', '🧊 Europa', '🧊 Europa');
  setTxt('#tp-bar-btns [data-tp="ganymede"]', '🌕 Ganymede', '🌕 Ganymede');
  setTxt('#tp-bar-btns [data-tp="callisto"]', '🪨 Callisto', '🪨 Callisto');
  setTxt('#tp-bar-btns [data-tp="saturn"]', '🪐 Sao Thổ', '🪐 Saturn');
  setTxt('#tp-bar-btns [data-tp="mimas"]', '🪨 Mimas', '🪨 Mimas');
  setTxt('#tp-bar-btns [data-tp="enceladus"]', '❄️ Enceladus', '❄️ Enceladus');
  setTxt('#tp-bar-btns [data-tp="tethys"]', '🧊 Tethys', '🧊 Tethys');
  setTxt('#tp-bar-btns [data-tp="dione"]', '🌕 Dione', '🌕 Dione');
  setTxt('#tp-bar-btns [data-tp="rhea"]', '🌕 Rhea', '🌕 Rhea');
  setTxt('#tp-bar-btns [data-tp="titan"]', '🟠 Titan', '🟠 Titan');
  setTxt('#tp-bar-btns [data-tp="iapetus"]', '🌓 Iapetus', '🌓 Iapetus');
  setTxt('#tp-bar-btns [data-tp="uranus"]', '🩵 Thiên Vương', '🩵 Uranus');
  setTxt('#tp-bar-btns [data-tp="miranda"]', '🪨 Miranda', '🪨 Miranda');
  setTxt('#tp-bar-btns [data-tp="ariel"]', '🧊 Ariel', '🧊 Ariel');
  setTxt('#tp-bar-btns [data-tp="umbriel"]', '🌑 Umbriel', '🌑 Umbriel');
  setTxt('#tp-bar-btns [data-tp="titania"]', '🌕 Titania', '🌕 Titania');
  setTxt('#tp-bar-btns [data-tp="oberon"]', '🪨 Oberon', '🪨 Oberon');
  setTxt('#tp-bar-btns [data-tp="neptune"]', '🔵 Hải Vương', '🔵 Neptune');
  setTxt('#tp-bar-btns [data-tp="triton"]', '❄️ Triton', '❄️ Triton');
  setTxt('#tp-bar-btns [data-tp="pluto"]', '🟤 Diêm Vương', '🟤 Pluto');
  setTxt('#tp-bar-btns [data-tp="haumea"]', '🥚 Haumea', '🥚 Haumea');
  setTxt('#tp-bar-btns [data-tp="makemake"]', '🔶 Makemake', '🔶 Makemake');
  setTxt('#tp-bar-btns [data-tp="eris"]', '💎 Eris', '💎 Eris');
  setTxt('#tp-bar-btns [data-tp="oort"]', '☄️ Đám mây Oort', '☄️ Oort Cloud');
  setTxt('#tp-bar-btns [data-tp="sun"]', '☀️ Mặt Trời', '☀️ Sun');
  setTxt('#tp-bar-btns [data-tp="interstellar"]', '🌌 Liên Sao', '🌌 Deep Space');
  setTxt('#tp-bar-btns [data-tp="royal1b"]', '👑 1 Tỷ km', '👑 1B km');

  setTxt('#tp-modal-title', '🪐 Dịch chuyển', '🪐 Teleport');
  setTxt('#tp-mode-lbl', 'Chế độ:', 'Mode:');
  setTxt('#btn-tpmode-surf', '🛬 Bề Mặt', '🛬 Surface');
  setTxt('#btn-tpmode-orb', '🛰️ Quỹ Đạo', '🛰️ Orbit');
  setTxt('#btn-teleport-close', 'Đóng', 'Close');
  setAttr('#btn-teleport-x', 'title', 'Đóng (Esc / Y)', 'Close (Esc / Y)');

  // Map UI
  setTxt('#map-focus-bar [data-focus="vessel"]', '🚀 Tàu', '🚀 Craft');
  setTxt('#map-focus-bar [data-focus="sun"]', '☀️ Mặt Trời', '☀️ Sun');
  setTxt('#map-focus-bar [data-focus="mercury"]', '⚪ Sao Thủy', '⚪ Mercury');
  setTxt('#map-focus-bar [data-focus="venus"]', '🟡 Sao Kim', '🟡 Venus');
  setTxt('#map-focus-bar [data-focus="earth"]', '🌍 Trái Đất', '🌍 Earth');
  setTxt('#map-focus-bar [data-focus="iss"]', '🛰️ ISS', '🛰️ ISS');
  setTxt('#map-focus-bar [data-focus="moon"]', '🌕 Mặt Trăng', '🌕 Moon');
  setTxt('#map-focus-bar [data-focus="mars"]', '🔴 Sao Hỏa', '🔴 Mars');
  setTxt('#map-focus-bar [data-focus="phobos"]', '🪨 Phobos', '🪨 Phobos');
  setTxt('#map-focus-bar [data-focus="deimos"]', '🪨 Deimos', '🪨 Deimos');
  setTxt('#map-focus-bar [data-focus="ceres"]', '🪨 Ceres', '🪨 Ceres');
  setTxt('#map-focus-bar [data-focus="jupiter"]', '🟠 Sao Mộc', '🟠 Jupiter');
  setTxt('#map-focus-bar [data-focus="saturn"]', '🪐 Sao Thổ', '🪐 Saturn');
  setTxt('#map-focus-bar [data-focus="uranus"]', '🩵 Thiên Vương', '🩵 Uranus');
  setTxt('#map-focus-bar [data-focus="neptune"]', '🔵 Hải Vương', '🔵 Neptune');
  setTxt('#map-focus-bar [data-focus="pluto"]', '🟤 Diêm Vương', '🟤 Pluto');
  setTxt('#map-focus-bar [data-focus="haumea"]', '🥚 Haumea', '🥚 Haumea');
  setTxt('#map-focus-bar [data-focus="makemake"]', '🔶 Makemake', '🔶 Makemake');
  setTxt('#map-focus-bar [data-focus="eris"]', '💎 Eris', '💎 Eris');
  setTxt('#map-focus-bar [data-focus="oort"]', '☄️ Đám mây Oort', '☄️ Oort Cloud');

  setTxt('#map-telemetry h4', 'QUỸ ĐẠO', 'ORBITAL TELEMETRY');
  setTxt('#btn-map-delete', '🗑️ Xóa', '🗑️ Delete');
  setAttr('#map-close-btn', 'title', 'Đóng (M)', 'Close (M)');

  setHtml(
    '#map-legend',
    `<span>🖱 <kbd>LMB</kbd> 3D</span>
     <span>🖱 <kbd>RMB</kbd> Lia</span>
     <span>📜 <kbd>Cuộn</kbd> Zoom</span>
     <span><kbd>, .</kbd> Tua</span>
     <span><kbd>Tab</kbd> Tâm</span>
     <span><kbd>M</kbd> Đóng</span>`,
    `<span>🖱 <kbd>LMB</kbd> 3D</span>
     <span>🖱 <kbd>RMB</kbd> Pan</span>
     <span>📜 <kbd>Scroll</kbd> Zoom</span>
     <span><kbd>, .</kbd> Warp</span>
     <span><kbd>Tab</kbd> Focus</span>
     <span><kbd>M</kbd> Close</span>`
  );

  // Bottom HUD
  setTxt('#launch-ui .hud-bottom .throttle label', '⚡ GA', '⚡ THR');
  setHtml(
    '#launch-ui .hud-bottom .keys',
    `<span title="Tăng/giảm ga"><kbd>⇧/⌃</kbd> ⚡</span>
     <span title="Ga tối đa / tắt"><kbd>Z/X</kbd> 🔥</span>
     <span title="Lái 3D"><kbd>WASD</kbd> 🕹️</span>
     <span title="Tách tầng"><kbd>Space</kbd> 🚀</span>
     <span title="Bắn vũ khí"><kbd>V</kbd> 🔫</span>
     <span title="Tự lái"><kbd>G</kbd> 🤖</span>
     <span title="Bản đồ 3D"><kbd>M</kbd> 🌐</span>
     <span title="Dịch chuyển"><kbd>Y</kbd> 🪐</span>
     <span title="SAS & Chế độ"><kbd>T/F</kbd> 🧭</span>
     <span title="Đổi Camera"><kbd>C</kbd> 🎥</span>
     <span title="Tua thời gian"><kbd>, .</kbd> ⏩</span>
     <span title="Dù / Chân đáp"><kbd>P</kbd> 🪂</span>
     <span title="Menu"><kbd>Esc</kbd> ⚙</span>`,
    `<span title="Throttle Up/Down"><kbd>⇧/⌃</kbd> ⚡</span>
     <span title="Max / Cut Throttle"><kbd>Z/X</kbd> 🔥</span>
     <span title="3D Attitude Steer"><kbd>WASD</kbd> 🕹️</span>
     <span title="Stage Separation"><kbd>Space</kbd> 🚀</span>
     <span title="Fire Weapons"><kbd>V</kbd> 🔫</span>
     <span title="Autopilot"><kbd>G</kbd> 🤖</span>
     <span title="3D Orbital Map"><kbd>M</kbd> 🌐</span>
     <span title="Teleport"><kbd>Y</kbd> 🪐</span>
     <span title="SAS & Mode"><kbd>T/F</kbd> 🧭</span>
     <span title="Camera"><kbd>C</kbd> 🎥</span>
     <span title="Time Warp"><kbd>, .</kbd> ⏩</span>
     <span title="Chute / Legs"><kbd>P</kbd> 🪂</span>
     <span title="Menu"><kbd>Esc</kbd> ⚙</span>`
  );

  setTxt('#btn-go', '▶ PHÓNG', '▶ LAUNCH');
  setTxt('#btn-back', '← VAB', '← VAB');

  // Modals: Mission, Pause (#menu), Settings (#settings), Result (#result)
  setTxt('#mission-modal h2', '🎯 Nhiệm vụ', '🎯 Select Mission');
  setTxt('#btn-mcat-rocket', '🚀 Nhiệm vụ Tên lửa & Vũ trụ', '🚀 Space & Rocket Missions');
  setTxt('#btn-mcat-rover', '🚙 Nhiệm vụ Xe Rover', '🚙 Rover Missions');
  setTxt('#btn-mcat-plane', '✈️ Nhiệm vụ Máy bay', '✈️ Airplane Missions');
  setTxt('#btn-mcat-boat', '🛥️ Nhiệm vụ Thuyền', '🛥️ Boat Missions');
  setTxt('#btn-mission-close', 'Đóng', 'Close');
  setAttr('#btn-mission-x', 'title', 'Đóng (Esc)', 'Close (Esc)');

  setTxt('#menu h2', '⚙️ Tùy chọn', '⚙️ Options');
  setAttr('#btn-menu-x', 'title', 'Đóng (Esc)', 'Close (Esc)');
  setAttr('#hud-tg-opt', 'title', 'Tùy chọn / Tạm dừng (Esc)', 'Options / Menu (Esc)');
  setTxt('#menu [data-act="resume"]', '▶ Tiếp tục', '▶ Resume');
  setTxt('#menu [data-act="restart"]', '🔁 Phóng lại', '🔁 Relaunch');
  setTxt('#menu [data-act="build"]', '🛠️ Về VAB', '🛠️ Back to VAB');
  setTxt('#menu [data-act="settings"]', '📊 Thông tin GPU & Cài đặt', '📊 GPU & Settings');
  setTxt('#lbl-volume-1', '🔊 Âm lượng', '🔊 Volume');
  setAttr('#btn-mute-1', 'title', 'Tắt / Bật âm thanh', 'Mute / Unmute');
  setTxt('#lbl-quality-1', 'Đồ họa', 'Graphics Quality');
  setTxt('#lbl-lang-1', 'Ngôn ngữ', 'Language');

  setTxt('#settings h2', '⚙ Cài đặt', '⚙ Settings');
  setTxt('#lbl-volume-2', '🔊 Âm lượng', '🔊 Volume');
  setAttr('#btn-mute-2', 'title', 'Tắt / Bật âm thanh', 'Mute / Unmute');
  setTxt('#lbl-quality-2', 'Đồ họa', 'Graphics Quality');
  setTxt('#lbl-lang-2', 'Ngôn ngữ', 'Language');
  setTxt('#lbl-gpu-api', 'Phần cứng', 'API & Hardware');
  setTxt('#lbl-gpu-pipe', 'Luồng dựng hình', 'Render Pipeline');
  setTxt('#lbl-gpu-perf', 'Hiệu năng', 'Live Performance');
  setAttr('#gpu-badge', 'title', 'Thông tin GPU & Cài đặt', 'GPU & Graphics Info');
  setAttr('#gpu-launch-badge', 'title', 'GPU & FPS (O)', 'GPU & FPS (O)');
  setTxt('#btn-settings-close', 'Đóng', 'Close');

  document.querySelectorAll('[data-q="ultra"]').forEach((el) => { el.textContent = lang === 'en' ? 'Ultra' : 'Siêu cao'; });
  document.querySelectorAll('[data-q="high"]').forEach((el) => { el.textContent = lang === 'en' ? 'High' : 'Cao'; });
  document.querySelectorAll('[data-q="medium"]').forEach((el) => { el.textContent = lang === 'en' ? 'Medium' : 'Trung bình'; });

  setTxt('#btn-lang-vi', '🇻🇳 Tiếng Việt', '🇻🇳 Vietnamese');
  setTxt('#btn-lang-en', '🇬🇧 Tiếng Anh', '🇬🇧 English');
  setTxt('#btn-menu-lang-vi', '🇻🇳 Tiếng Việt', '🇻🇳 Vietnamese');
  setTxt('#btn-menu-lang-en', '🇬🇧 Tiếng Anh', '🇬🇧 English');

  const resLabels = document.querySelectorAll('#result .stat-grid .stat label');
  if (resLabels.length >= 4) {
    resLabels[0].textContent = tr('⛰ Độ cao max', '⛰ Max Alt');
    resLabels[1].textContent = tr('⚡ Vận tốc max', '⚡ Max Vel');
    resLabels[2].textContent = tr('⏱ Thời gian', '⏱ Flight Time');
    resLabels[3].textContent = tr('⊕ G tối đa', '⊕ Max G');
  }
  setTxt('#result [data-act="restart"]', '🔁 Phóng lại', '🔁 Relaunch');
  setTxt('#result [data-act="build"]', '🔧 Sửa', '🔧 Edit');
  setTxt('#result [data-act="continue"]', '👁 Xem tiếp', '👁 Watch');

  // 6. Refresh active scenes if app is initialized
  if (app) {
    if (app.build && app.build.refreshLanguage) app.build.refreshLanguage();
    if (app.launch && app.launch.refreshLanguage) app.launch.refreshLanguage();
  }
}
