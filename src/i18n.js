// Bilingual localization (Vietnamese 'vi' <-> English 'en')
import { PARTS } from './parts.js';
import { MISSIONS } from './missions.js';
import { BODIES } from './sim/constants.js';

let currentLang = 'vi';
try {
  currentLang = (typeof localStorage !== 'undefined' && localStorage?.getItem && localStorage.getItem('rf-lang')) || 'vi';
} catch { /* ignore */ }
if (currentLang !== 'vi' && currentLang !== 'en') currentLang = 'vi';

export function getLang() {
  return currentLang;
}

export function isEn() {
  return currentLang === 'en';
}

export function tr(vi, en) {
  return currentLang === 'en' ? en : vi;
}

const PART_I18N = {
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
    vi: { name: 'Cánh pin mặt trời ×2', cat: 'Cấu trúc', desc: 'Cặp cánh pin mặt trời đa tầng cung cấp điện năng cho tàu vũ trụ, tên lửa & xe' },
    en: { name: 'Solar Array Wings ×2', cat: 'Structural', desc: 'Dual deployable solar arrays providing power for spacecraft & rovers' },
  },
  gunLaser: {
    vi: { name: 'Súng Lazer Siêu Hạng ×2', cat: 'Vũ khí', desc: 'Cặp pháo Lazer xoay 360° bắn tia plasma tốc độ ánh sáng tiêu diệt Alien ngoài vũ trụ, trên hành tinh & mặt trăng (Phím V)' },
    en: { name: 'Twin Plasma Laser Turrets ×2', cat: 'Weapons', desc: '360° gimbaled high-energy laser cannons that vaporize Aliens in space and on planets/moons (Press V to fire)' },
  },
  waterCannon: {
    vi: { name: 'Máy Phun Nước 1,000,000 PSI ×2', cat: 'Vũ khí', desc: 'Đại bác siêu áp lực 1,000,000 PSI bắn tia nước cắt kim cương đánh bay và nghiền nát Alien (Phím V)' },
    en: { name: '1,000,000 PSI Water Cannon ×2', cat: 'Weapons', desc: 'Ultra-high-pressure 1,000,000 PSI supersonic hydro-jet cannons that blast and shred Aliens (Press V to fire)' },
  },
  booster: {
    vi: { name: 'Tên lửa đẩy phụ ×2', cat: 'Động cơ', desc: 'Nhiên liệu rắn, tự tách khi cháy hết' },
    en: { name: 'Solid Rocket Boosters ×2', cat: 'Engines', desc: 'Solid fuel boosters, auto-jettison on burnout' },
  },
  cockpitRover: {
    vi: { name: 'Cabin xe Rover', cat: 'Xe & Thuyền', desc: 'Khoang lái thám hiểm với vòm kính quan sát và đèn pha' },
    en: { name: 'Rover Cockpit', cat: 'Rovers & Boats', desc: 'Exploration cabin with panoramic glass dome & headlights' },
  },
  chassisRover: {
    vi: { name: 'Khung gầm Rover', cat: 'Xe & Thuyền', desc: 'Khung gầm chịu lực tích hợp khối pin năng lượng và khớp gắn trục' },
    en: { name: 'Rover Chassis', cat: 'Rovers & Boats', desc: 'Heavy-duty chassis with integrated battery pack & axle mounts' },
  },
  wheelsRover: {
    vi: { name: 'Bánh xe địa hình ×4', cat: 'Xe & Thuyền', desc: '4 bánh xe lốp cao su gai bám đường địa hình hành tinh' },
    en: { name: 'Off-Road Wheels ×4', cat: 'Rovers & Boats', desc: '4 high-grip treaded planetary rover wheels' },
  },
  solarRover: {
    vi: { name: 'Tấm pin Rover ×2', cat: 'Xe & Thuyền', desc: 'Cặp pin mặt trời tự động sạc điện khi di chuyển' },
    en: { name: 'Rover Solar Panels ×2', cat: 'Rovers & Boats', desc: 'Twin solar panels recharging power on the move' },
  },
  cabinBoat: {
    vi: { name: 'Cabin Canô lướt sóng', cat: 'Xe & Thuyền', desc: 'Cabin lái khí động học của tàu thuyền cao tốc' },
    en: { name: 'Speedboat Cabin', cat: 'Rovers & Boats', desc: 'Aerodynamic helm cabin for high-speed watercraft' },
  },
  hullBoat: {
    vi: { name: 'Thân thuyền chữ V', cat: 'Xe & Thuyền', desc: 'Thân tàu đáy chữ V lướt sóng, giữ thăng bằng và nổi trên biển' },
    en: { name: 'V-Hull Boat Body', cat: 'Rovers & Boats', desc: 'Deep-V wave-piercing hull for buoyancy and stability at sea' },
  },
  motorBoat: {
    vi: { name: 'Động cơ chân vịt canô', cat: 'Xe & Thuyền', desc: 'Động cơ chân vịt / phản lực nước chuyên dụng cho thuyền' },
    en: { name: 'Marine Propeller Motor', cat: 'Rovers & Boats', desc: 'High-thrust waterjet / propeller outboard motor' },
  },
  floatsBoat: {
    vi: { name: 'Phao nổi canô ×2', cat: 'Xe & Thuyền', desc: 'Cặp phao phụ hai bên sườn chống lật sóng trên biển' },
    en: { name: 'Outrigger Pontoon Floats ×2', cat: 'Rovers & Boats', desc: 'Side stabilizing pontoons preventing capsizing' },
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
    en: { name: 'S-IVB / S-II Conical Interstage (Stage 4)', cat: 'Structure & Aero', desc: 'Tapered aft interstage frustum with stepped black-and-white roll pattern' },
  },
  saturnS2: {
    vi: { name: 'Tầng Đẩy S-II · 5× J-2 (Tầng 3)', cat: 'Nhiên liệu', desc: 'Tầng đẩy S-II sơn trắng in chữ dọc UNITED STATES cùng cụm 5 động cơ J-2' },
    en: { name: 'S-II Second Stage · 5× J-2 (Stage 3)', cat: 'Fuel Tanks', desc: 'White S-II stage with vertical UNITED STATES markings & 5 J-2 engines' },
  },
  saturnS2Inter: {
    vi: { name: 'Vòng Chuyển Tầng S-II / S-IC (Tầng 2)', cat: 'Cấu trúc', desc: 'Vòng chuyển tầng S-II/S-IC kẻ sọc dọc đen-trắng kèm 8 động cơ đẩy Ullage' },
    en: { name: 'S-II / S-IC Roll-Striped Interstage (Stage 2)', cat: 'Structure & Aero', desc: 'Black-and-white vertical roll-striped interstage with 8 ullage motors' },
  },
  saturnS1: {
    vi: { name: 'Tầng Đẩy S-IC · 5× F-1 (Tầng 1)', cat: 'Động cơ', desc: 'Tầng 1 S-IC khổng lồ in cờ Mỹ, chữ USA đỏ, 4 cánh đuôi trắng và 5 siêu động cơ F-1' },
    en: { name: 'S-IC First Stage · 5× F-1 (Stage 1)', cat: 'Engines', desc: 'Giant S-IC first stage with US Flag, red USA markings, 4 white fins & 5 F-1 engines' },
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
  ufoSaucer: {
    vi: { name: 'Đĩa Bay UFO Siêu Cấp', cat: 'Đầu', desc: 'Siêu Đĩa Bay UFO của người ngoài hành tinh tích hợp vòm kính phi công, vành đĩa plasma neon, pin lượng tử 55 tấn, dù hạ cánh và lõi phản trọng lực' },
    en: { name: 'Quantum UFO Flying Saucer', cat: 'Command & Nose', desc: 'Alien UFO flying saucer with crystal pilot dome, glowing plasma rim, 55-ton quantum battery, parachutes & anti-gravity core' },
  },
};

export const PRESET_LABELS = {
  'Hai tầng (khuyên dùng)': { vi: 'Hai tầng (khuyên dùng)', en: 'Two-Stage (Recommended)' },
  'Saturn V (Apollo)': { vi: '🚀 Saturn V (Apollo – Mặt Trăng)', en: '🚀 Saturn V (Apollo – Moon)' },
  'Soyuz / R-7 Semyorka': { vi: '🚀 Soyuz / R-7 Semyorka (Liên Xô)', en: '🚀 Soyuz / R-7 Semyorka (USSR)' },
  'N1 Liên Xô (Mặt Trăng)': { vi: '🚀 N1 Liên Xô (Siêu tên lửa Mặt Trăng)', en: '🚀 Soviet N1 (Super Heavy Lunar)' },
  'Titan IV (Tàu Voyager)': { vi: '🚀 Titan IV (Tàu thăm dò Voyager)', en: '🚀 Titan IV (Voyager Probe)' },
  'Tàu con thoi Space Shuttle': { vi: '🚀 Tàu con thoi Space Shuttle (NASA)', en: '🚀 Space Shuttle (NASA)' },
  'Energia – Buran': { vi: '🚀 Energia – Buran (Liên Xô)', en: '🚀 Energia – Buran (USSR)' },
  'Proton-M (Nga)': { vi: '🚀 Proton-M (Nga – Trạm vũ trụ)', en: '🚀 Proton-M (Russia)' },
  'Ariane 5 (James Webb)': { vi: '🚀 Ariane 5 (Kính James Webb – ESA)', en: '🚀 Ariane 5 (JWST – ESA)' },
  'Atlas V (Sao Hỏa)': { vi: '🚀 Atlas V (Thám hiểm Sao Hỏa)', en: '🚀 Atlas V (Mars Explorer)' },
  'Delta IV Heavy': { vi: '🚀 Delta IV Heavy (ULA)', en: '🚀 Delta IV Heavy (ULA)' },
  'Trường Chinh 5 (Long March 5)': { vi: '🚀 Trường Chinh 5 (Long March 5)', en: '🚀 Long March 5 (ChangZheng 5)' },
  'Falcon 9 (SpaceX)': { vi: '🚀 Falcon 9 (SpaceX – Tái sử dụng)', en: '🚀 Falcon 9 (SpaceX – Reusable)' },
  'Falcon Heavy (SpaceX)': { vi: '🚀 Falcon Heavy (SpaceX – Siêu nặng)', en: '🚀 Falcon Heavy (SpaceX)' },
  'SLS Artemis (NASA)': { vi: '🚀 SLS Artemis (NASA – Mặt Trăng)', en: '🚀 SLS Artemis (NASA – Moon)' },
  'Starship & Super Heavy': { vi: '🚀 Starship & Super Heavy (SpaceX)', en: '🚀 Starship & Super Heavy (SpaceX)' },
  'Nhỏ gọn': { vi: 'Nhỏ gọn', en: 'Compact Rocket' },
  'Siêu nặng (lên quỹ đạo)': { vi: 'Siêu nặng (lên quỹ đạo)', en: 'Super Heavy (Orbital)' },
  'Đại Bàng 9 (tái sử dụng)': { vi: 'Đại Bàng 9 (tái sử dụng)', en: 'Falcon 9 (Reusable)' },
  'Tàu chở khách (ISS)': { vi: 'Tàu chở khách (ISS)', en: 'Crew Dragon (ISS)' },
  'Apollo (Mặt Trăng)': { vi: 'Apollo (Mặt Trăng)', en: 'Apollo (Moon & Planets)' },
  'Xe địa hình Rover 4x4': { vi: 'Xe địa hình Rover 4x4', en: '4x4 Planetary Rover' },
  'Xe thám hiểm phản lực': { vi: 'Xe thám hiểm phản lực', en: 'Rocket-Powered Rover' },
  'Canô lướt sóng siêu tốc': { vi: 'Canô lướt sóng siêu tốc', en: 'High-Speed Wave Boat' },
  'Thuyền phản lực tên lửa': { vi: 'Thuyền phản lực tên lửa', en: 'Rocket Hydroplane Boat' },
  'Tiêm kích phản lực F-22': { vi: 'Tiêm kích phản lực F-22', en: 'F-22 Raptor Fighter Jet' },
  'Tàu lượn phản lực siêu âm': { vi: 'Tàu lượn phản lực siêu âm', en: 'Hypersonic Rocket Plane' },
  'Tàu Phản Trọng Lực Lượng Tử': { vi: '🛸 Tàu Phản Trọng Lực Lượng Tử', en: '🛸 Quantum Anti-Gravity Ship' },
  'Tàu Chiến Lazer Liên Hành Tinh': { vi: '⚡ Tàu Chiến Lazer Liên Hành Tinh', en: '⚡ Interplanetary Laser Cruiser' },
  'Chiến Hạm Diệt Alien (Lazer + Nước 1M PSI)': { vi: '👽 Chiến Hạm Diệt Alien (Lazer + Nước 1,000,000 PSI)', en: '👽 Alien Hunter Warship (Laser + 1M PSI Water)' },
  'Đĩa Bay UFO Siêu Cấp (Alien Saucer)': { vi: '🛸 Đĩa Bay UFO Siêu Cấp (Alien Saucer)', en: '🛸 Super Alien UFO Flying Saucer' },
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
      desc: 'Thám hiểm Titan – mặt trăng lớn nhất của Sao Thổ có bầu khí quyển dày màu cam vàng và hồ khí mê-tan lỏng.',
      objs: { orbit: 'Vào quỹ đạo Trái Đất', titanSOI: 'Vào vùng hấp dẫn Titan', titanOrbit: 'Vào quỹ đạo Titan', titanLanded: 'Hạ cánh xuống Titan' },
    },
    en: {
      name: 'Land on Titan',
      desc: 'Explore Titan – Saturn’s largest moon with a dense golden-orange atmosphere and hydrocarbon lakes.',
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
};

const BODY_LABELS = {
  sun: { vi: 'Mặt Trời', en: 'Sun' },
  mercury: { vi: 'Sao Thủy', en: 'Mercury' },
  venus: { vi: 'Sao Kim', en: 'Venus' },
  earth: { vi: 'Trái Đất', en: 'Earth' },
  moon: { vi: 'Mặt Trăng', en: 'Moon' },
  mars: { vi: 'Sao Hỏa', en: 'Mars' },
  phobos: { vi: 'Phobos', en: 'Phobos' },
  deimos: { vi: 'Deimos', en: 'Deimos' },
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
};

export function applyLanguage(lang, app) {
  if (lang !== 'vi' && lang !== 'en') lang = 'vi';
  currentLang = lang;
  try { localStorage.setItem('rf-lang', lang); } catch { /* ignore */ }
  document.documentElement.lang = lang;
  document.title = lang === 'en' ? 'Rocket Forge – Build & Launch Rockets' : 'Rocket Forge – Lắp ráp & Phóng tên lửa';

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

  // Build UI
  setTxt('#build-ui .crumb', 'Xưởng lắp ráp · VAB', 'Vehicle Assembly · VAB');
  setTxt('#btn-undo', '↶ Hoàn tác', '↶ Undo');
  setTxt('#btn-clear', '🗑 Xóa hết', '🗑 Clear All');
  setAttr('#btn-settings', 'title', 'Cài đặt (O)', 'Settings (O)');
  setTxt('#palette h3', 'Linh kiện', 'Parts');
  setTxt('#stats h3', 'Thông số', 'Specifications');

  const statLabels = document.querySelectorAll('#stats .stat-grid .stat label');
  if (statLabels.length >= 4) {
    statLabels[0].textContent = tr('Khối lượng', 'Total Mass');
    statLabels[1].textContent = tr('Chiều cao', 'Height');
    statLabels[2].textContent = tr('TWR cất cánh', 'Liftoff TWR');
    statLabels[3].textContent = tr('Tổng Δv', 'Total Δv');
  }
  const dvMarks = document.querySelectorAll('#stats .dv-bar i');
  if (dvMarks.length >= 2) {
    dvMarks[0].setAttribute('data-l', tr('Không gian', 'Space'));
    dvMarks[1].setAttribute('data-l', tr('Quỹ đạo', 'Orbit'));
  }
  setTxt('#stats h4', 'Các tầng', 'Stages');

  setTxt('#btn-rot-x', '🔴 Xoay X (90°)', '🔴 Rotate X (90°)');
  setTxt('#btn-rot-y', '🟢 Xoay Y (90°)', '🟢 Rotate Y (90°)');
  setTxt('#btn-rot-z', '🔵 Xoay Z (90°)', '🔵 Rotate Z (90°)');
  setTxt('#btn-rot-reset', '↺ Đặt lại', '↺ Reset');
  setTxt('#btn-side-toggle', '↔ Gắn sang 2 bên', '↔ Attach to Both Sides');
  setTxt('#btn-del', 'Xóa linh kiện (Del)', 'Delete Part (Del)');

  setTxt('#quick-rot-bar .rot-bar-title', '📐 XOAY 3D:', '📐 3D ROTATE:');
  setTxt('#bar-rot-x', '🔴 Trục X (90°)', '🔴 X Axis (90°)');
  setTxt('#bar-rot-y', '🟢 Trục Y (90°)', '🟢 Y Axis (90°)');
  setTxt('#bar-rot-z', '🔵 Trục Z (90°)', '🔵 Z Axis (90°)');

  setHtml(
    '#build-ui .hint',
    '🖱 Kéo linh kiện vào <b>giữa</b> hoặc <b>2 bên hông</b> tên lửa · Click chọn · <b>Phím 1/2/3 (X/Y/Z)</b> xoay 3D · <kbd>O</kbd> cài đặt · <kbd>Del</kbd> xóa',
    '🖱 Drag parts to <b>center</b> or <b>both sides</b> of rocket · Click to select · <b>Keys 1/2/3 (X/Y/Z)</b> 3D rotate · <kbd>O</kbd> options · <kbd>Del</kbd> delete'
  );
  setTxt('#btn-launchpad', '🚀 RA BỆ PHÓNG', '🚀 TO LAUNCHPAD');

  // Launch UI
  const leftReadouts = document.querySelectorAll('#launch-ui .hud-left .big-readout label');
  if (leftReadouts.length >= 1) leftReadouts[0].textContent = tr('ĐỘ CAO', 'ALTITUDE');
  setTxt('#h-vel-l', 'VẬN TỐC', 'VELOCITY');

  const leftSpans = document.querySelectorAll('#launch-ui .hud-left > .rows:nth-of-type(1) div span');
  if (leftSpans.length >= 7) {
    leftSpans[0].textContent = tr('Vận tốc đứng', 'Vertical Speed');
    leftSpans[1].textContent = tr('Vận tốc ngang', 'Horizontal Speed');
    leftSpans[2].textContent = 'Mach';
    leftSpans[3].textContent = tr('Gia tốc', 'Acceleration');
    leftSpans[4].textContent = tr('Áp suất động', 'Dynamic Pressure');
    leftSpans[5].textContent = tr('Góc nghiêng', 'Pitch Angle');
    leftSpans[6].textContent = tr('Thời gian bay', 'Flight Time');
  }
  const orbitHeader = document.querySelector('#launch-ui .hud-left h4.sub');
  if (orbitHeader) {
    const bodySpan = document.getElementById('h-body');
    const curBody = bodySpan ? bodySpan.textContent : tr('Trái Đất', 'Earth');
    orbitHeader.innerHTML = `${tr('Quỹ đạo', 'Orbit')} · <span id="h-body">${curBody}</span>`;
  }
  const orbitSpans = document.querySelectorAll('#launch-ui .hud-left > .rows:nth-of-type(2) div span');
  if (orbitSpans.length >= 3) {
    orbitSpans[0].textContent = tr('Viễn điểm (Ap)', 'Apoapsis (Ap)');
    orbitSpans[1].textContent = tr('Cận điểm (Pe)', 'Periapsis (Pe)');
    orbitSpans[2].textContent = tr('Chu kỳ', 'Orbital Period');
  }
  const targetSpans = document.querySelectorAll('#h-target-box .rows div span');
  if (targetSpans.length >= 2) {
    targetSpans[0].textContent = tr('Khoảng cách', 'Distance');
    targetSpans[1].textContent = tr('Vận tốc tương đối', 'Relative Velocity');
  }

  setTxt('#launch-ui .hud-right h4', 'Tầng & nhiên liệu', 'Stages & Fuel');
  const rightSpans = document.querySelectorAll('#launch-ui .hud-right .rows div span');
  if (rightSpans.length >= 5) {
    rightSpans[0].textContent = 'SAS';
    rightSpans[1].textContent = tr('Chế độ SAS', 'SAS Mode');
    rightSpans[2].textContent = tr('Lái tự động', 'Autopilot');
    rightSpans[3].textContent = tr('Tua nhanh', 'Time Warp');
    rightSpans[4].textContent = 'Camera';
  }
  setTxt('#btn-autopilot', '🤖 TỰ LÁI NHIỆM VỤ (G)', '🤖 MISSION AUTOPILOT (G)');
  setTxt('#btn-toggle-map', '🌐 BẢN ĐỒ QUỸ ĐẠO 3D (M)', '🌐 3D ORBITAL MAP (M)');
  setTxt('#btn-teleport', '🪐 DỊCH CHUYỂN HÀNH TINH / MẶT TRĂNG (Y)', '🪐 TELEPORT PLANETS / MOONS (Y)');

  // Teleport Quick-Bar & Modal
  setTxt('#tp-bar-title', '🪐 DỊCH CHUYỂN:', '🪐 TELEPORT:');
  setTxt('#btn-tp-expand', '📋 Mở bảng (Y)', '📋 All Bodies (Y)');
  setAttr('#btn-tp-mode', 'title', 'Đổi chế độ dịch chuyển: Đáp bề mặt hoặc Vào quỹ đạo', 'Switch teleport mode: Land on Surface or Enter Orbit');
  setAttr('#btn-tp-expand', 'title', 'Mở bảng dịch chuyển chi tiết (Y)', 'Open full teleport panel (Y)');
  setTxt('#tp-bar-btns [data-tp="earth"]', '🌍 Trái Đất', '🌍 Earth');
  setTxt('#tp-bar-btns [data-tp="iss"]', '🛰️ ISS', '🛰️ ISS');
  setTxt('#tp-bar-btns [data-tp="moon"]', '🌕 Mặt Trăng', '🌕 Moon');
  setTxt('#tp-bar-btns [data-tp="mercury"]', '⚪ Sao Thủy', '⚪ Mercury');
  setTxt('#tp-bar-btns [data-tp="venus"]', '🟡 Sao Kim', '🟡 Venus');
  setTxt('#tp-bar-btns [data-tp="mars"]', '🔴 Sao Hỏa', '🔴 Mars');
  setTxt('#tp-bar-btns [data-tp="phobos"]', '🪨 Phobos', '🪨 Phobos');
  setTxt('#tp-bar-btns [data-tp="deimos"]', '🪨 Deimos', '🪨 Deimos');
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
  setTxt('#tp-bar-btns [data-tp="sun"]', '☀️ Mặt Trời', '☀️ Sun');

  setTxt('#tp-modal-title', '🪐 Dịch chuyển tới Hành Tinh & Mặt Trăng', '🪐 Teleport to Planets & Moons');
  setTxt('#tp-mode-lbl', 'Chế độ điểm đến:', 'Destination Mode:');
  setTxt('#btn-tpmode-surf', '🛬 Đáp Bề Mặt (Surface)', '🛬 Land on Surface');
  setTxt('#btn-tpmode-orb', '🛰️ Vào Quỹ Đạo (Orbit)', '🛰️ Enter Orbit');
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

  setTxt('#map-telemetry h4', 'THÔNG SỐ QUỸ ĐẠO', 'ORBITAL TELEMETRY');
  setTxt('#btn-map-delete', '🗑️ Xóa vật thể', '🗑️ Delete Object');
  setAttr('#map-close-btn', 'title', 'Đóng bản đồ (M)', 'Close Map (M)');

  setHtml(
    '#map-legend',
    `<span>🖱 <kbd>Chuột trái</kbd> Xoay 3D</span>
     <span>🖱 <kbd>Chuột phải</kbd> Lia</span>
     <span>📜 <kbd>Cuộn</kbd> Thu phóng</span>
     <span><kbd>,</kbd>/<kbd>.</kbd> Tua thời gian</span>
     <span><kbd>Tab</kbd> Đổi tâm</span>
     <span><kbd>M</kbd> Đóng</span>`,
    `<span>🖱 <kbd>Left Click</kbd> Rotate 3D</span>
     <span>🖱 <kbd>Right Click</kbd> Pan</span>
     <span>📜 <kbd>Scroll</kbd> Zoom</span>
     <span><kbd>,</kbd>/<kbd>.</kbd> Time Warp</span>
     <span><kbd>Tab</kbd> Switch Focus</span>
     <span><kbd>M</kbd> Close</span>`
  );

  // Bottom HUD
  setTxt('#launch-ui .hud-bottom .throttle label', 'GA', 'THR');
  setHtml(
    '#launch-ui .hud-bottom .keys',
    `<span><kbd>Shift</kbd>/<kbd>Ctrl</kbd> ga</span>
     <span><kbd>Z</kbd>/<kbd>X</kbd> max/tắt</span>
     <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> lái 3D theo camera</span>
     <span><kbd>Space</kbd> tách tầng</span>
     <span><kbd>V</kbd> bắn Alien</span>
     <span><kbd>Y</kbd> dịch chuyển</span>
     <span><kbd>T</kbd> SAS</span>
     <span><kbd>F</kbd> chế độ SAS</span>
     <span><kbd>G</kbd> tự lái</span>
     <span><kbd>M</kbd> bản đồ</span>
     <span><kbd>B</kbd> xem tầng 1</span>
     <span><kbd>C</kbd> camera</span>
     <span><kbd>,</kbd>/<kbd>.</kbd> tua</span>
     <span><kbd>I</kbd><kbd>K</kbd><kbd>J</kbd><kbd>L</kbd><kbd>H</kbd><kbd>N</kbd> RCS</span>
     <span><kbd>P</kbd> dù/chân</span>
     <span><kbd>O</kbd> cài đặt</span>
     <span><kbd>Esc</kbd> menu</span>`,
    `<span><kbd>Shift</kbd>/<kbd>Ctrl</kbd> throttle</span>
     <span><kbd>Z</kbd>/<kbd>X</kbd> max/cut</span>
     <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> 3D steer</span>
     <span><kbd>Space</kbd> stage</span>
     <span><kbd>V</kbd> fire</span>
     <span><kbd>Y</kbd> teleport</span>
     <span><kbd>T</kbd> SAS</span>
     <span><kbd>F</kbd> SAS mode</span>
     <span><kbd>G</kbd> autopilot</span>
     <span><kbd>M</kbd> map</span>
     <span><kbd>B</kbd> stage 1 cam</span>
     <span><kbd>C</kbd> camera</span>
     <span><kbd>,</kbd>/<kbd>.</kbd> warp</span>
     <span><kbd>I</kbd><kbd>K</kbd><kbd>J</kbd><kbd>L</kbd><kbd>H</kbd><kbd>N</kbd> RCS</span>
     <span><kbd>P</kbd> chute/legs</span>
     <span><kbd>O</kbd> options</span>
     <span><kbd>Esc</kbd> menu</span>`
  );

  setTxt('#btn-go', '▶ BẮT ĐẦU ĐẾM NGƯỢC', '▶ START COUNTDOWN');
  setTxt('#btn-back', '← Về xưởng', '← Back to VAB');

  // Modals: Mission, Pause (#menu), Settings (#settings), Result (#result)
  setTxt('#mission-modal h2', 'Chọn nhiệm vụ', 'Select Mission');
  setTxt('#btn-mission-close', 'Đóng', 'Close');
  setAttr('#btn-mission-x', 'title', 'Đóng (Esc)', 'Close (Esc)');

  setTxt('#menu h2', 'Tạm dừng', 'Paused');
  setTxt('#menu [data-act="resume"]', 'Tiếp tục', 'Resume');
  setTxt('#menu [data-act="restart"]', 'Phóng lại', 'Relaunch');
  setTxt('#menu [data-act="build"]', 'Về xưởng lắp ráp', 'Back to VAB');
  setTxt('#lbl-quality-1', 'Chất lượng đồ họa', 'Graphics Quality');
  setTxt('#lbl-lang-1', 'Ngôn ngữ / Language', 'Language / Ngôn ngữ');

  setTxt('#settings h2', 'Cài đặt', 'Settings');
  setTxt('#lbl-quality-2', 'Chất lượng đồ họa', 'Graphics Quality');
  setTxt('#lbl-lang-2', 'Ngôn ngữ / Language', 'Language / Ngôn ngữ');
  setTxt('#lbl-gpu-api', 'API & Phần cứng', 'API & Hardware');
  setTxt('#lbl-gpu-pipe', 'Pipeline Đồ họa', 'Render Pipeline');
  setTxt('#lbl-gpu-perf', 'Hiệu năng thực tế', 'Live Performance');
  setAttr('#gpu-badge', 'title', 'Thông tin GPU & Đồ họa (Click để mở cài đặt)', 'GPU & Graphics Info (Click to open settings)');
  setAttr('#gpu-launch-badge', 'title', 'Đồ họa GPU & FPS (O)', 'GPU Graphics & FPS (O)');
  setTxt('#btn-settings-close', 'Đóng', 'Close');

  setTxt('#btn-lang-vi', '🇻🇳 Tiếng Việt', '🇻🇳 Tiếng Việt (Vietnamese)');
  setTxt('#btn-lang-en', '🇬🇧 Tiếng Anh', '🇬🇧 English (Tiếng Anh)');
  setTxt('#btn-menu-lang-vi', '🇻🇳 Tiếng Việt', '🇻🇳 Tiếng Việt (Vietnamese)');
  setTxt('#btn-menu-lang-en', '🇬🇧 Tiếng Anh', '🇬🇧 English (Tiếng Anh)');

  const resLabels = document.querySelectorAll('#result .stat-grid .stat label');
  if (resLabels.length >= 4) {
    resLabels[0].textContent = tr('Độ cao tối đa', 'Max Altitude');
    resLabels[1].textContent = tr('Vận tốc tối đa', 'Max Velocity');
    resLabels[2].textContent = tr('Thời gian bay', 'Flight Time');
    resLabels[3].textContent = tr('G tối đa', 'Max G-Load');
  }
  setTxt('#result [data-act="restart"]', '🔁 Phóng lại', '🔁 Relaunch');
  setTxt('#result [data-act="build"]', '🔧 Sửa tên lửa', '🔧 Edit Rocket');
  setTxt('#result [data-act="continue"]', '👁 Xem tiếp', '👁 Continue Watching');

  // 6. Refresh active scenes if app is initialized
  if (app) {
    if (app.build && app.build.refreshLanguage) app.build.refreshLanguage();
    if (app.launch && app.launch.refreshLanguage) app.launch.refreshLanguage();
  }
}
