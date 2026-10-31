// Rocket part definitions + procedural high-detail meshes
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as TX from './textures.js';

export const R = 1.25; // core stack radius (m)
export const G0 = 9.80665;

export const PARTS = {
  nose: { name: 'Mũi khí động', cat: 'Đầu', kind: 'stack', height: 3.4, dry: 0.2, desc: 'Giảm lực cản không khí' },
  capsule: { name: 'Khoang phi hành', cat: 'Đầu', kind: 'stack', height: 3.6, dry: 2.6, desc: 'Chở 3 phi hành gia + tháp thoát hiểm + dù hạ cánh' },
  dockPort: { name: 'Cổng docking', cat: 'Đầu', kind: 'stack', height: 0.8, dry: 0.3, desc: 'Ghép nối với trạm vũ trụ ISS' },
  tankS: { name: 'Bồn nhiên liệu S', cat: 'Nhiên liệu', kind: 'stack', height: 2.2, dry: 0.45, fuel: 4.0, desc: '4 tấn nhiên liệu' },
  tankM: { name: 'Bồn nhiên liệu M', cat: 'Nhiên liệu', kind: 'stack', height: 4.5, dry: 0.9, fuel: 9.0, desc: '9 tấn nhiên liệu' },
  tankL: { name: 'Bồn nhiên liệu L', cat: 'Nhiên liệu', kind: 'stack', height: 9.0, dry: 1.6, fuel: 18.0, desc: '18 tấn nhiên liệu' },
  batteryPack: { name: 'Cục Pin Năng Lượng', cat: 'Nhiên liệu', kind: 'stack', height: 3.2, dry: 0.65, fuel: 28.0, isBattery: true, desc: 'Pin lượng tử siêu tụ điện chuyên dụng cung cấp nguồn năng lượng cho Động cơ Lazer và Động cơ Phản Trọng Lực' },
  batteryPackL: { name: 'Cục Pin Năng Lượng Lớn (50 Tấn)', cat: 'Nhiên liệu', kind: 'stack', height: 6.8, dry: 1.35, fuel: 50.0, isBattery: true, desc: 'Siêu Pin Lượng Tử cỡ đại chứa 50 tấn năng lượng (chỉ dùng cho Động cơ Phản Trọng Lực và Động cơ Lazer, không dùng cho động cơ thường)' },
  engHeavy: { name: 'Động cơ Sấm Sét', cat: 'Động cơ', kind: 'stack', height: 2.6, dry: 2.4, thrustSL: 1000, thrustVac: 1120, ispSL: 280, ispVac: 310, engines: 4, desc: '4 buồng đốt, lực đẩy cực lớn' },
  engReuse: { name: 'Động cơ Đại Bàng', cat: 'Động cơ', kind: 'stack', height: 2.6, dry: 2.6, thrustSL: 1150, thrustVac: 1250, ispSL: 282, ispVac: 311, engines: 9, minThrottle: 0.4, restart: true, desc: 'Cụm 9 động cơ (octaweb), khởi động lại được – dùng cho tầng hạ cánh' },
  engMid: { name: 'Động cơ Đa Năng', cat: 'Động cơ', kind: 'stack', height: 2.5, dry: 1.2, thrustSL: 430, thrustVac: 490, ispSL: 285, ispVac: 325, engines: 1, desc: 'Cân bằng lực đẩy & hiệu suất' },
  engVac: { name: 'Động cơ Chân Không', cat: 'Động cơ', kind: 'stack', height: 3.4, dry: 0.7, thrustSL: 60, thrustVac: 190, ispSL: 140, ispVac: 360, engines: 1, desc: 'Hiệu suất cao ngoài không gian' },
  engAntiGrav: { name: 'Động cơ Phản Trọng Lực', cat: 'Động cơ', kind: 'stack', height: 2.8, dry: 1.5, thrustSL: 2600, thrustVac: 2600, ispSL: 5500, ispVac: 6500, engines: 1, restart: true, desc: 'Bắt buộc dùng Cục Pin Năng Lượng (không dùng bồn nhiên liệu thường) · Đẩy bằng trường phản trọng lực: trọng lực càng mạnh gia tốc càng nhanh' },
  engLaser: { name: 'Động cơ Lazer Năng Lượng Cao', cat: 'Động cơ', kind: 'stack', height: 3.0, dry: 1.4, thrustSL: 2400, thrustVac: 2600, ispSL: 4500, ispVac: 5500, engines: 1, restart: true, desc: 'Bắt buộc dùng Cục Pin Năng Lượng (không dùng bồn nhiên liệu thường) · Phóng tia lazer hội tụ: chỗ càng tối gia tốc càng nhanh' },
  decoupler: { name: 'Bộ tách tầng', cat: 'Cấu trúc', kind: 'stack', height: 0.45, dry: 0.12, desc: 'Tách tầng bằng phím SPACE' },
  fins: { name: 'Cánh ổn định ×4', cat: 'Cấu trúc', kind: 'radial', count: 4, dry: 0.08, desc: 'Gắn vào bồn – giữ tên lửa bay thẳng' },
  legs: { name: 'Chân hạ cánh ×4', cat: 'Cấu trúc', kind: 'radial', count: 4, dry: 0.25, desc: 'Gắn vào bồn dưới cùng của tầng – bung ra khi hạ cánh' },
  gridfins: { name: 'Cánh lưới ×4', cat: 'Cấu trúc', kind: 'radial', count: 4, dry: 0.06, desc: 'Gắn ở bồn trên cùng của tầng – điều hướng khi rơi về' },
  solarPanel: { name: 'Cánh pin mặt trời ×2', cat: 'Cấu trúc', kind: 'radial', count: 2, dry: 0.12, desc: 'Cặp cánh pin mặt trời đa tầng · Khi gắn vào Cục Pin Năng Lượng sẽ tự động sạc hồi năng lượng cho pin' },
  gunLaser: { name: 'Súng Lazer Siêu Hạng ×2', cat: 'Vũ khí', kind: 'radial', count: 2, dry: 0.05, weapon: 'laser', desc: 'Cặp pháo Lazer xoay 360° bắn tia plasma tốc độ ánh sáng tiêu diệt Alien ngoài vũ trụ, trên hành tinh & mặt trăng (Phím V)' },
  waterCannon: { name: 'Máy Phun Nước 1,000,000 PSI ×2', cat: 'Vũ khí', kind: 'radial', count: 2, dry: 0.05, weapon: 'water', desc: 'Đại bác siêu áp lực 1,000,000 PSI bắn tia nước cắt kim cương đánh bay và nghiền nát Alien (Phím V)' },
  gunAcid: { name: 'Súng Acid Ăn Mòn ×2', cat: 'Vũ khí', kind: 'radial', count: 2, dry: 0.05, weapon: 'acid', desc: 'Cặp pháo phun Acid Siêu Ăn Mòn xoay 360° bắn tia dịch độc xanh lục làm tan chảy giáp và rút máu Alien liên tục (Phím V)' },
  gunElectric: { name: 'Súng Điện 1,000,000 WATT ×2', cat: 'Vũ khí', kind: 'radial', count: 2, dry: 0.05, weapon: 'electric', desc: 'Cặp pháo điện Tesla 1,000,000 WATT xoay 360° phóng tia hồ quang sấm sét giật tê liệt & truyền điện lan sang các Alien xung quanh (Phím V)' },
  booster: { name: 'Tên lửa đẩy phụ ×2', cat: 'Động cơ', kind: 'radial', count: 2, height: 11.8, dry: 1.8, fuel: 14, thrustSL: 1100, thrustVac: 1200, ispSL: 240, ispVac: 265, desc: 'Nhiên liệu rắn, tự tách khi cháy hết' },
  cockpitRover: { name: 'Cabin xe Rover', cat: 'Xe & Thuyền', kind: 'stack', height: 1.6, dry: 0.7, desc: 'Khoang lái thám hiểm với vòm kính quan sát và đèn pha' },
  chassisRover: { name: 'Khung gầm Rover', cat: 'Xe & Thuyền', kind: 'stack', height: 1.8, dry: 0.8, fuel: 1.2, desc: 'Khung gầm chịu lực tích hợp khối pin năng lượng và khớp gắn trục' },
  wheelsRover: { name: 'Bánh xe địa hình ×4', cat: 'Xe & Thuyền', kind: 'radial', count: 4, dry: 0.22, desc: '4 bánh xe lốp cao su gai bám đường địa hình hành tinh' },
  solarRover: { name: 'Tấm pin Rover ×2', cat: 'Xe & Thuyền', kind: 'radial', count: 2, dry: 0.06, desc: 'Cặp pin mặt trời tự động sạc điện khi di chuyển' },
  cabinBoat: { name: 'Cabin Canô lướt sóng', cat: 'Xe & Thuyền', kind: 'stack', height: 1.8, dry: 0.9, desc: 'Cabin lái khí động học của tàu thuyền cao tốc' },
  hullBoat: { name: 'Thân thuyền chữ V', cat: 'Xe & Thuyền', kind: 'stack', height: 3.2, dry: 1.3, fuel: 4.5, desc: 'Thân tàu đáy chữ V lướt sóng, giữ thăng bằng và nổi trên biển' },
  motorBoat: { name: 'Động cơ chân vịt canô', cat: 'Xe & Thuyền', kind: 'stack', height: 1.4, dry: 0.4, thrustSL: 260, thrustVac: 260, ispSL: 800, ispVac: 400, engines: 1, desc: 'Động cơ chân vịt / phản lực nước chuyên dụng cho thuyền' },
  floatsBoat: { name: 'Phao nổi canô ×2', cat: 'Xe & Thuyền', kind: 'radial', count: 2, dry: 0.18, desc: 'Cặp phao phụ hai bên sườn chống lật sóng trên biển' },
  cockpitPlane: { name: 'Cabin tiêm kích Jet', cat: 'Máy bay', kind: 'stack', height: 2.8, dry: 0.85, desc: 'Buồng lái tiêm kích tàng hình với kính vòm chống chói, HUD và mũi kim khí động' },
  fuselagePlane: { name: 'Thân máy bay Jet', cat: 'Máy bay', kind: 'stack', height: 3.8, dry: 1.1, fuel: 5.5, desc: 'Thân máy bay khí động học chứa thùng nhiên liệu JP-8 và cửa hút khí' },
  wingsPlane: { name: 'Cánh nâng phản lực ×2', cat: 'Máy bay', kind: 'radial', count: 2, dry: 0.45, desc: 'Cặp cánh swept-wing tạo lực nâng khí động học cất cánh và lượn trên trời' },
  tailPlane: { name: 'Đuôi đứng & Cánh lái', cat: 'Máy bay', kind: 'stack', height: 1.8, dry: 0.35, desc: 'Cụm đuôi chữ V đôi nghiêng và cánh lái ngang thăng bằng' },
  engJet: { name: 'Động cơ phản lực Afterburner', cat: 'Máy bay', kind: 'stack', height: 2.2, dry: 1.2, thrustSL: 450, thrustVac: 90, ispSL: 3200, ispVac: 300, engines: 1, desc: 'Động cơ tuốc-bin phản lực tăng lực siêu âm, lực đẩy cực mạnh trong khí quyển' },
  gearPlane: { name: 'Càng đáp máy bay 3 bánh', cat: 'Máy bay', kind: 'radial', count: 1, dry: 0.25, desc: 'Bộ 3 càng đáp bánh xe cao su chịu tải giúp chạy đà cất cánh & hạ cánh' },
  saturnApollo: { name: 'Tàu Chỉ Huy Apollo CM & Tháp LES (Tầng 8)', cat: 'Đầu', kind: 'stack', height: 6.2, dry: 1.4, fuel: 1.0, thrustSL: 85, thrustVac: 120, ispSL: 220, ispVac: 320, engines: 1, desc: 'Khoang chỉ huy Apollo (CM) bọc nón trắng + tháp thoát hiểm LES & dù hạ cánh' },
  saturnSM: { name: 'Khoang Dịch Vụ Apollo SM (Tầng 7)', cat: 'Nhiên liệu', kind: 'stack', height: 2.6, dry: 1.1, fuel: 3.2, thrustSL: 110, thrustVac: 220, ispSL: 230, ispVac: 345, engines: 1, autoStage: true, desc: 'Khoang dịch vụ Apollo SM có tấm tản nhiệt xám bạc, 4 cụm RCS và động cơ SPS' },
  saturnSLA: { name: 'Khoang Côn SLA & Tàu Đổ Bộ LM (Tầng 6)', cat: 'Nhiên liệu', kind: 'stack', height: 4.2, dry: 1.3, fuel: 4.5, thrustSL: 140, thrustVac: 260, ispSL: 235, ispVac: 350, engines: 1, autoStage: true, desc: 'Áo côn trắng SLA chứa tàu đổ bộ Mặt Trăng (Lunar Module) kèm động cơ' },
  saturnS4B: { name: 'Tầng Đẩy S-IVB · 1× J-2 (Tầng 5)', cat: 'Nhiên liệu', kind: 'stack', height: 8.6, dry: 1.8, fuel: 14.5, thrustSL: 240, thrustVac: 540, ispSL: 245, ispVac: 365, engines: 1, autoStage: true, desc: 'Tầng đẩy S-IVB thân trụ trắng có vòng đai ngang màu đen và 1 động cơ J-2' },
  saturnS4BInter: { name: 'Cổ Côn Chuyển Tầng S-IVB / S-II (Tầng 4)', cat: 'Cấu trúc', kind: 'stack', height: 3.6, dry: 0.9, fuel: 4.2, thrustSL: 240, thrustVac: 380, ispSL: 240, ispVac: 330, engines: 4, autoStage: true, desc: 'Cổ côn chuyển tầng sơn khối đen-trắng lệch bậc đặc trưng của Saturn V' },
  saturnS2: { name: 'Tầng Đẩy S-II · 5× J-2 (Tầng 3)', cat: 'Nhiên liệu', kind: 'stack', height: 11.4, dry: 2.8, fuel: 28.0, thrustSL: 980, thrustVac: 1320, ispSL: 275, ispVac: 345, engines: 5, autoStage: true, desc: 'Tầng đẩy S-II sơn trắng in chữ dọc UNITED STATES cùng cụm 5 động cơ J-2' },
  saturnS2Inter: { name: 'Vòng Chuyển Tầng S-II / S-IC (Tầng 2)', cat: 'Cấu trúc', kind: 'stack', height: 4.8, dry: 1.2, fuel: 7.5, thrustSL: 750, thrustVac: 960, ispSL: 255, ispVac: 320, engines: 8, autoStage: true, desc: 'Vòng chuyển tầng S-II/S-IC kẻ sọc dọc đen-trắng kèm 8 động cơ đẩy Ullage' },
  saturnS1: { name: 'Tầng Đẩy S-IC · 5× F-1 (Tầng 1)', cat: 'Động cơ', kind: 'stack', height: 17.6, dry: 5.8, fuel: 64.0, thrustSL: 4200, thrustVac: 4800, ispSL: 285, ispVac: 315, engines: 5, autoStage: true, hasFins: true, desc: 'Tầng 1 S-IC khổng lồ in cờ Mỹ, chữ USA đỏ, 4 cánh đuôi trắng và 5 siêu động cơ F-1' },
  apollo11CM: { name: 'Tàu Chỉ Huy Apollo 11 CM Bạc & Tháp Mắt Cáo LES (Tầng 8)', cat: 'Đầu', kind: 'stack', height: 6.2, dry: 1.4, fuel: 1.0, thrustSL: 85, thrustVac: 120, ispSL: 220, ispVac: 320, engines: 1, desc: 'Khoang chỉ huy Apollo 11 màu bạc kim loại kèm tháp thoát hiểm khung mắt cáo chữ X hở, đai đỏ và dù hạ cánh' },
  apollo11SM: { name: 'Khoang Dịch Vụ Apollo 11 SM Ánh Bạc (Tầng 7)', cat: 'Nhiên liệu', kind: 'stack', height: 2.6, dry: 1.1, fuel: 3.2, thrustSL: 110, thrustVac: 220, ispSL: 230, ispVac: 345, engines: 1, autoStage: true, desc: 'Khoang dịch vụ Apollo 11 màu bạc kim loại có 2 đai tản nhiệt trắng và 4 cụm động cơ điều hướng RCS đầu đỏ' },
  apollo11SLA: { name: 'Khoang Côn SLA Cắt Mở Lộ Tàu Đổ Bộ LM Eagle (Tầng 6)', cat: 'Nhiên liệu', kind: 'stack', height: 4.2, dry: 1.3, fuel: 4.5, thrustSL: 140, thrustVac: 260, ispSL: 235, ispVac: 350, engines: 1, autoStage: true, desc: 'Áo côn trắng SLA có ô cửa cắt chính diện để lộ Tàu đổ bộ Mặt Trăng (LM Eagle) bọc lá vàng bên trong kèm đai đáy đen gân dọc' },
  apollo11S4B: { name: 'Tầng Đẩy S-IVB Apollo 11 · Chữ Đỏ USA (Tầng 5)', cat: 'Nhiên liệu', kind: 'stack', height: 8.6, dry: 1.8, fuel: 14.5, thrustSL: 240, thrustVac: 540, ispSL: 245, ispVac: 365, engines: 1, autoStage: true, desc: 'Tầng đẩy S-IVB thân trắng in 2 cột chữ USA đỏ dọc thân, cổ gân dọc, 2 cụm động cơ APS chóp đỏ và đai đáy đen' },
  apollo11S4BInter: { name: 'Cổ Côn Chuyển Tầng Kẻ Ô Bàn Cờ 2 Tầng Apollo 11 (Tầng 4)', cat: 'Cấu trúc', kind: 'stack', height: 3.6, dry: 0.9, fuel: 4.2, thrustSL: 240, thrustVac: 380, ispSL: 240, ispVac: 330, engines: 4, autoStage: true, desc: 'Cổ hình nón cụt kẻ gân dọc chia 2 tầng ô bàn cờ Đen-Trắng đối xứng kèm các chóp cảm biến màu đỏ' },
  apollo11S2: { name: 'Tầng Đẩy S-II Apollo 11 · Chữ Đỏ UNITED STATES (Tầng 3)', cat: 'Nhiên liệu', kind: 'stack', height: 11.4, dry: 2.8, fuel: 28.0, thrustSL: 980, thrustVac: 1320, ispSL: 275, ispVac: 345, engines: 5, autoStage: true, desc: 'Tầng đẩy S-II sơn trắng có cổ trên kẻ gân, cột 8 vạch đen, chữ dọc UNITED STATES màu đỏ và đai đáy đen đậm' },
  apollo11S2Inter: { name: 'Vòng Chuyển Tầng S-II / S-IC Kẻ Gân & Ốp Ullage Apollo 11 (Tầng 2)', cat: 'Cấu trúc', kind: 'stack', height: 4.8, dry: 1.2, fuel: 7.5, thrustSL: 750, thrustVac: 960, ispSL: 255, ispVac: 320, engines: 8, autoStage: true, desc: 'Vòng chuyển tầng kẻ gân dọc sơn mảng Đen-Trắng xen kẽ kèm các ốp tên lửa Ullage chóp nhọn màu trắng' },
  apollo11S1: { name: 'Tầng 1 S-IC Apollo 11 · Cánh Đen-Trắng & 5× F-1 Kim Loại (Tầng 1)', cat: 'Động cơ', kind: 'stack', height: 17.6, dry: 5.8, fuel: 64.0, thrustSL: 4200, thrustVac: 4800, ispSL: 285, ispVac: 315, engines: 5, autoStage: true, hasFins: true, desc: 'Tầng 1 S-IC in 2 lá cờ Mỹ, chữ USA đỏ, 4 chụp côn & cánh đuôi sơn xen kẽ Đen-Trắng có thẻ chữ A/B/C/D và 5 loa phụt F-1 xám bạc có gân ngang' },
  soyuzNose: { name: 'Mũi Chóp Fairing & Tàu Soyuz (Tầng 5)', cat: 'Đầu', kind: 'stack', height: 5.8, dry: 1.1, fuel: 1.5, thrustSL: 95, thrustVac: 150, ispSL: 240, ispVac: 335, engines: 1, desc: 'Chóp mũi khí động trắng-bạc có ô cửa tròn + khoang tàu Soyuz & dù hạ cánh' },
  soyuzFairing: { name: 'Khoang Tải Trọng Soyuz & Đai Cam (Tầng 4)', cat: 'Nhiên liệu', kind: 'stack', height: 5.8, dry: 1.2, fuel: 3.4, thrustSL: 130, thrustVac: 230, ispSL: 245, ispVac: 345, engines: 1, autoStage: true, desc: 'Thân trụ trắng bảo vệ tàu Soyuz kèm cổ đai màu cam, ống dẫn trắng và ngàm bên' },
  soyuzBlockI: { name: 'Tầng Đẩy Block I · Đai Tản Nhiệt & Cam (Tầng 3)', cat: 'Nhiên liệu', kind: 'stack', height: 5.4, dry: 1.5, fuel: 9.5, thrustSL: 260, thrustVac: 460, ispSL: 255, ispVac: 358, engines: 4, autoStage: true, desc: 'Tầng 3 Block I màu xanh rêu, vòng tản nhiệt kẻ sọc bạc và đai đáy cam răng cưa' },
  soyuzCore: { name: 'Thân Chính Block A & Giàn Mắt Cáo (Tầng 2)', cat: 'Nhiên liệu', kind: 'stack', height: 11.2, dry: 2.4, fuel: 22.0, thrustSL: 780, thrustVac: 990, ispSL: 270, ispVac: 330, engines: 4, autoStage: true, desc: 'Thân lõi Block A loe rộng màu xanh rêu, đai ô vuông và giàn khung mắt cáo hở' },
  soyuzBooster: { name: 'Cụm 4 Tầng Đẩy Phụ Hình Nón R-7 & Đáy Cam (Tầng 1)', cat: 'Động cơ', kind: 'stack', height: 19.8, dry: 5.2, fuel: 54.0, thrustSL: 3600, thrustVac: 4150, ispSL: 280, ispVac: 315, engines: 20, autoStage: true, hasFins: true, desc: '4 khối đẩy phụ hình nón R-7 ôm thân chính, váy động cơ màu cam, tấm chắn bạc, 4 cánh đuôi và 20 loa phụt RD-107/108' },
  n1Tower: { name: 'Mũi Chóp Tàu LOK & Tháp Thoát Hiểm SAS N1 (Tầng 5)', cat: 'Đầu', kind: 'stack', height: 10.6, dry: 1.4, fuel: 2.0, thrustSL: 110, thrustVac: 180, ispSL: 240, ispVac: 340, engines: 1, desc: 'Chóp mũi trắng bảo vệ tàu Mặt Trăng LOK kèm tháp thoát hiểm SAS có đai động cơ đỏ sẫm & dù hạ cánh' },
  n1Fairing: { name: 'Khoang Tải Trọng L3 Trắng · Block G/D & LK (Tầng 4)', cat: 'Nhiên liệu', kind: 'stack', height: 12.0, dry: 2.0, fuel: 11.5, thrustSL: 280, thrustVac: 520, ispSL: 250, ispVac: 360, engines: 1, autoStage: true, desc: 'Khoang tải trọng Mặt Trăng L3 sơn trắng bóng có chân côn loe và 8 gân nổi khí động dọc' },
  n1BlockV: { name: 'Tầng 3 N1 (Block V) & Giàn Mắt Cáo Trên (Tầng 3)', cat: 'Nhiên liệu', kind: 'stack', height: 9.6, dry: 2.4, fuel: 18.5, thrustSL: 560, thrustVac: 880, ispSL: 265, ispVac: 355, engines: 4, autoStage: true, desc: 'Tầng đẩy hình nón xám kim loại Block V với 8 ống dẫn khí động nổi, giàn mắt cáo 2 tầng và 4 động cơ NK-21' },
  n1BlockB: { name: 'Tầng 2 N1 (Block B) & Giàn Mắt Cáo Giữa (Tầng 2)', cat: 'Nhiên liệu', kind: 'stack', height: 11.4, dry: 3.8, fuel: 36.0, thrustSL: 1450, thrustVac: 1880, ispSL: 275, ispVac: 340, engines: 8, autoStage: true, desc: 'Tầng 2 hình nón xám kim loại Block B kèm khung giàn mắt cáo rỗng 2 tầng lộ bồn cầu bên trong và 8 động cơ NK-15V' },
  n1BlockA: { name: 'Tầng 1 Siêu Nặng N1 (Block A · 30× NK-15) (Tầng 1)', cat: 'Động cơ', kind: 'stack', height: 15.4, dry: 6.8, fuel: 74.0, thrustSL: 5400, thrustVac: 6200, ispSL: 285, ispVac: 320, engines: 30, autoStage: true, hasFins: true, desc: 'Tầng 1 hình nón khổng lồ màu xám kim loại với 8 khối hộp khí động lớn, 4 cánh lưới chống ngang, váy đáy loe và vòng 30 động cơ NK-15' },
  buranNose: { name: 'Chóp Mũi Buran-Energia & Đai Gân Caro (Tầng 3)', cat: 'Đầu', kind: 'stack', height: 12.5, dry: 1.6, fuel: 9.5, thrustSL: 220, thrustVac: 380, ispSL: 260, ispVac: 365, engines: 1, hasFins: true, desc: 'Chóp mũi khí động màu xám xanh của hệ Buran, bồn trắng trên và đai gân dọc in 2 ô vuông caro đen + dù hạ cánh' },
  buranShuttle: { name: 'Tàu Con Thoi Buran & Thân Giữa Energia (Tầng 2)', cat: 'Nhiên liệu', kind: 'stack', height: 14.5, dry: 3.6, fuel: 34.0, thrustSL: 1350, thrustVac: 1820, ispSL: 280, ispVac: 365, engines: 4, autoStage: true, hasFins: true, desc: 'Tàu vũ trụ con thoi Buran gắn lưng Energia với buồng lái kính đen 6 ô, 2 cửa sổ nóc, mũi gạch chịu nhiệt đen, cánh tam giác kép viền đen, đuôi đứng & dù hạ cánh' },
  buranEnergia: { name: 'Tầng Đẩy Buran-Energia & 4 Booster Zenit (Tầng 1)', cat: 'Động cơ', kind: 'stack', height: 15.0, dry: 6.4, fuel: 72.0, thrustSL: 5200, thrustVac: 6000, ispSL: 290, ispVac: 335, engines: 20, autoStage: true, hasFins: true, desc: 'Thân dưới Energia kèm 4 tầng đẩy phụ Zenit (Block A) ốp sườn xám xanh, 4 siêu động cơ RD-0120 ở tâm và 4 cụm động cơ RD-170' },
  energiaNose: { name: 'Chóp Mũi Trắng ЭНЕРГИЯ & Đai Caro (Tầng 3)', cat: 'Đầu', kind: 'stack', height: 12.5, dry: 1.6, fuel: 9.5, thrustSL: 220, thrustVac: 380, ispSL: 260, ispVac: 365, engines: 1, hasFins: true, desc: 'Chóp mũi trắng của tên lửa siêu nặng Energia in chữ đỏ ЭНЕРГИЯ, đai gân xám in 2 ô vuông caro đen + dù hạ cánh' },
  energiaPolyus: { name: 'Trạm Vũ Trụ МИР-2 (Polyus) & Thân Giữa Energia (Tầng 2)', cat: 'Nhiên liệu', kind: 'stack', height: 14.5, dry: 3.6, fuel: 34.0, thrustSL: 1350, thrustVac: 1820, ispSL: 280, ispVac: 365, engines: 4, autoStage: true, hasFins: true, desc: 'Tàu/Trạm chiến đấu quỹ đạo Polyus (МИР-2) sơn đen tuyền gắn lưng Energia kèm 2 bình phụ bên hông, cổ tản nhiệt kẻ sọc bạc & dù hạ cánh' },
  energiaCore: { name: 'Tầng Đẩy Siêu Nặng Energia (Энергия) & 4 Booster (Tầng 1)', cat: 'Động cơ', kind: 'stack', height: 15.0, dry: 6.4, fuel: 72.0, thrustSL: 5200, thrustVac: 6000, ispSL: 290, ispVac: 335, engines: 20, autoStage: true, hasFins: true, desc: 'Thân dưới tên lửa Energia kèm 4 tầng đẩy phụ Zenit ốp khí động xám đá, 4 động cơ chính RD-0120 đai đen và 4 cụm RD-170' },
  cz5Fairing: { name: 'Chóp Mũi Trường Chinh 5 (Cờ CHN · Tầng 3)', cat: 'Đầu', kind: 'stack', height: 9.2, dry: 1.4, fuel: 8.5, thrustSL: 180, thrustVac: 340, ispSL: 260, ispVac: 365, engines: 2, hasFins: true, desc: 'Chóp mũi khí động Trường Chinh 5 (CZ-5) in Quốc kỳ Trung Quốc, chữ CHN, cổ chuyển tầng viền đồng và dù hạ cánh' },
  cz5Stage2: { name: 'Thân Giữa Trường Chinh 5 · 中国航天 & Logo 5 (Tầng 2)', cat: 'Nhiên liệu', kind: 'stack', height: 11.4, dry: 2.8, fuel: 28.0, thrustSL: 950, thrustVac: 1420, ispSL: 280, ispVac: 365, engines: 2, autoStage: true, hasFins: true, desc: 'Tầng đẩy trung tâm Trường Chinh 5 in logo CASC, dòng chữ dọc 中国航天, biểu tượng số 5 đỏ LONG MARCH và cặp động cơ YF-75D' },
  cz5Stage1: { name: 'Tầng 1 Trường Chinh 5 & 4 Booster CZ-5 (Tầng 1)', cat: 'Động cơ', kind: 'stack', height: 16.6, dry: 6.2, fuel: 70.0, thrustSL: 5100, thrustVac: 5900, ispSL: 290, ispVac: 335, engines: 10, autoStage: true, hasFins: true, desc: 'Tầng 1 lõi Trường Chinh 5 đáy bọc cách nhiệt nâu đỏ kèm 4 tầng đẩy phụ mũi vát nghiêng kẻ sọc caro đỏ CZ-5, cánh đuôi và 10 động cơ YF-77 / YF-100' },
  ariane5Fairing: { name: 'Chóp Mũi Ariane 5 (Arianespace & Cổ ESC-A · Tầng 3)', cat: 'Đầu', kind: 'stack', height: 11.2, dry: 1.3, fuel: 8.0, thrustSL: 160, thrustVac: 320, ispSL: 260, ispVac: 365, engines: 1, hasFins: true, desc: 'Chóp mũi khí động Ariane 5 ECA in logo Arianespace Service & Solutions, cổ chuyển tầng xám kim loại ESC-A và dù hạ cánh' },
  ariane5Stage2: { name: 'Thân Trên Ariane 5 EPC & Cụm Ống Dẫn (Tầng 2)', cat: 'Nhiên liệu', kind: 'stack', height: 8.2, dry: 2.2, fuel: 24.0, thrustSL: 820, thrustVac: 1280, ispSL: 280, ispVac: 365, engines: 1, autoStage: true, hasFins: true, desc: 'Phần trên bồn nhiên liệu lạnh EPC màu bạc xám kẻ gân kèm 4 ống dẫn nổi dọc thân, ngàm giữ booster và động cơ' },
  ariane5Stage1: { name: 'Tầng 1 Ariane 5 (Động cơ Vulcain 2 & 2 Booster EAP ESA/CNES)', cat: 'Động cơ', kind: 'stack', height: 16.2, dry: 5.8, fuel: 68.0, thrustSL: 4900, thrustVac: 5700, ispSL: 285, ispVac: 330, engines: 3, autoStage: true, hasFins: true, desc: 'Tầng 1 lõi EPC với siêu động cơ Vulcain 2 ở tâm + 2 tầng đẩy phụ EAP P241 mũi vát nghiêng in 12 cờ Châu Âu, logo ESA, CNES và 2 loa phụt lớn' },
  slsOrion: { name: 'Tàu Orion & Tháp Thoát Hiểm LAS Artemis (Tầng 3)', cat: 'Đầu', kind: 'stack', height: 11.6, dry: 1.4, fuel: 8.5, thrustSL: 180, thrustVac: 350, ispSL: 265, ispVac: 365, engines: 1, hasFins: true, desc: 'Tàu vũ trụ Orion kèm tháp thoát hiểm LAS nhọn, cờ Mỹ, logo NASA Meatball, NASA Worm, ESA, cổ chuyển tầng trắng và dù hạ cánh' },
  slsStage2: { name: 'Thân Trên SLS Artemis (Cổ Côn Cam LVSA & Bồn SOFI · Tầng 2)', cat: 'Nhiên liệu', kind: 'stack', height: 11.8, dry: 2.6, fuel: 28.0, thrustSL: 920, thrustVac: 1380, ispSL: 280, ispVac: 365, engines: 1, autoStage: true, hasFins: true, desc: 'Cổ côn chuyển tầng LVSA màu cam kẻ gân dọc + phần trên bồn nhiên liệu cam SOFI có đai vàng nghệ, ô mục tiêu caro và đỉnh ống dẫn LOX chóp trắng' },
  slsStage1: { name: 'Tầng 1 SLS Artemis (4× RS-25 & 2 Booster SRB 5 Đốt)', cat: 'Động cơ', kind: 'stack', height: 16.8, dry: 6.2, fuel: 72.0, thrustSL: 5300, thrustVac: 6100, ispSL: 290, ispVac: 335, engines: 6, autoStage: true, hasFins: true, desc: 'Thân dưới lõi cam SLS với đáy động cơ trắng, 4 động cơ RS-25 đen và 2 tầng đẩy phụ rắn SRB 5 đốt in vạch răng cưa caro, sọc đen lệch bậc & chữ NASA đỏ' },
  atlasVFairing: { name: 'Chóp Mũi Phồng Atlas V 5m (Cờ Mỹ & Cổ Gân · Tầng 3)', cat: 'Đầu', kind: 'stack', height: 9.8, dry: 1.3, fuel: 8.0, thrustSL: 170, thrustVac: 340, ispSL: 265, ispVac: 365, engines: 1, hasFins: true, desc: 'Chóp mũi khí động Atlas V 5m in Cờ Mỹ, hàng lỗ thoát âm, đai côn gân dọc, khoang phồng bảo vệ Centaur có đuôi côn thu (boat-tail) & dù hạ cánh' },
  atlasVStage2: { name: 'Khoang Chuyển Tầng Trắng Logo Atlas & Thân Trên Đồng CCB (Tầng 2)', cat: 'Nhiên liệu', kind: 'stack', height: 6.4, dry: 2.1, fuel: 22.0, thrustSL: 780, thrustVac: 1220, ispSL: 280, ispVac: 365, engines: 1, autoStage: true, hasFins: true, desc: 'Khoang chuyển tầng trắng in logo Atlas V / ULA nối liền phần trên bồn nhiên liệu màu đồng nâu (CCB) kèm đầu hộp trắng và ống dẫn màu xanh oliu' },
  atlasVStage1: { name: 'Tầng 1 Đồng Nâu Atlas V CCB & 2 Booster Trắng Mũi Vát (Tầng 1)', cat: 'Động cơ', kind: 'stack', height: 15.6, dry: 5.6, fuel: 66.0, thrustSL: 4850, thrustVac: 5600, ispSL: 290, ispVac: 335, engines: 5, autoStage: true, hasFins: true, desc: 'Thân chính màu đồng nâu Atlas V với ống dẫn xanh oliu, máng gân vàng nâu, váy đáy trắng và 2 tầng đẩy phụ trắng lớn mũi vát nghiêng có viền xanh đen & cụm loa phụt kép' },
  fhFairing: { name: 'Chóp Mũi Phồng Falcon Heavy (Arabsat-6A · Tầng 3)', cat: 'Đầu', kind: 'stack', height: 6.2, dry: 1.2, fuel: 7.5, thrustSL: 180, thrustVac: 350, ispSL: 265, ispVac: 370, engines: 1, hasFins: true, desc: 'Chóp mũi phồng đầu tròn đặc trưng của SpaceX Falcon Heavy in logo kim cương Arabsat-6A, đường ghép vỏ sò, cổ thu boat-tail và dù hạ cánh' },
  fhStage2: { name: 'Tầng 2 & Khoang Chuyển Tầng Trắng Falcon Heavy (Logo FH & Cờ Mỹ)', cat: 'Nhiên liệu', kind: 'stack', height: 6.8, dry: 2.0, fuel: 22.0, thrustSL: 820, thrustVac: 1280, ispSL: 285, ispVac: 370, engines: 1, autoStage: true, hasFins: true, desc: 'Thân trụ trắng mảnh Tầng 2 & Interstage của Falcon Heavy với ống dẫn nổi dọc thân, logo chim ưng FH, Quốc kỳ Mỹ và động cơ Merlin Vacuum' },
  fhStage1: { name: 'Tầng 1 Falcon Heavy (3 Lõi Booster Trắng, 12 Chân Đáp Đen & 27 Merlin 1D)', cat: 'Động cơ', kind: 'stack', height: 16.8, dry: 6.4, fuel: 74.0, thrustSL: 5400, thrustVac: 6200, ispSL: 290, ispVac: 340, engines: 27, autoStage: true, hasFins: true, desc: 'Cụm 3 lõi tên lửa đẩy Falcon Heavy màu trắng với 2 chóp mũi phụ tròn, thanh giằng ngang trắng, 12 cánh lưới Titanium đen, đường cáp dọc đen, 12 chân đáp đen gập sát đáy và 27 động cơ Merlin 1D' },
  f9Dragon: { name: 'Tàu Vũ Trụ Crew Dragon & Khoang Trunk Đen-Trắng (Falcon 9 · Tầng 3)', cat: 'Đầu', kind: 'stack', height: 5.8, dry: 1.1, fuel: 6.5, thrustSL: 160, thrustVac: 320, ispSL: 265, ispVac: 365, engines: 1, hasFins: true, desc: 'Tàu Crew Dragon đầu vòm trắng có 4 hốc động cơ thoát hiểm SuperDraco, Cờ Mỹ, nối liền khoang dịch vụ Trunk chia 2 nửa Đen-Trắng có 4 cánh ổn định và dù hạ cánh' },
  f9Stage2: { name: 'Tầng 2 Trắng & Khoang Interstage Đen Falcon 9 Block 5 (Tầng 2)', cat: 'Nhiên liệu', kind: 'stack', height: 8.2, dry: 1.9, fuel: 21.0, thrustSL: 800, thrustVac: 1250, ispSL: 285, ispVac: 370, engines: 1, autoStage: true, hasFins: true, desc: 'Bồn nhiên liệu Tầng 2 màu trắng bóng kết hợp khoang chuyển tầng Interstage sợi carbon đen tuyền đặc trưng của Falcon 9 Block 5 và động cơ Merlin Vacuum' },
  f9Stage1: { name: 'Tầng 1 Falcon 9 Block 5 (Logo FALCON 9, Chữ Dọc SPACEX & 9 Merlin 1D)', cat: 'Động cơ', kind: 'stack', height: 17.6, dry: 4.8, fuel: 62.0, thrustSL: 4650, thrustVac: 5350, ispSL: 290, ispVac: 340, engines: 9, autoStage: true, hasFins: true, desc: 'Tầng 1 Falcon 9 Block 5 màu trắng in logo cánh chim đỏ FALCON 9, Cờ Mỹ, dòng chữ dọc SPACEX xanh đậm, 4 cánh lưới Titanium đen, 4 chân đáp đen tạo khe chữ V trắng và 9 loa phụt Merlin 1D bạc' },
  shuttleNose: { name: 'Chóp Mũi Bồn Cam ET & Đai Gân Vàng Intertank (Space Shuttle · Tầng 3)', cat: 'Đầu', kind: 'stack', height: 12.5, dry: 1.5, fuel: 9.0, thrustSL: 200, thrustVac: 360, ispSL: 265, ispVac: 365, engines: 1, hasFins: true, desc: 'Chóp mũi khí động bồn nhiên liệu ngoài (External Tank) màu cam đất kèm cột thu lôi, đường ống cáp đen dọc mũi, cổ gân vàng nâu Intertank và dù hạ cánh' },
  shuttleOrbiter: { name: 'Tàu Con Thoi Discovery (STS) & Thân Giữa Bồn Cam ET (Tầng 2)', cat: 'Nhiên liệu', kind: 'stack', height: 14.5, dry: 3.5, fuel: 32.0, thrustSL: 1280, thrustVac: 1760, ispSL: 285, ispVac: 375, engines: 3, autoStage: true, hasFins: true, desc: 'Tàu vũ trụ con thoi Discovery gắn lưng bồn cam ET với mũi gạch đen RCC, cụm RCS mũi, kính buồng lái 6 ô, chữ United States + Cờ Mỹ + logo NASA + Discovery trên cánh tam giác kép và 3 động cơ chính RS-25 (SSME)' },
  shuttleSrb: { name: 'Đáy Bồn Cam ET & 2 Tên Lửa Đẩy Phụ Trắng SRB (Space Shuttle · Tầng 1)', cat: 'Động cơ', kind: 'stack', height: 15.0, dry: 6.2, fuel: 70.0, thrustSL: 5250, thrustVac: 6050, ispSL: 290, ispVac: 335, engines: 5, autoStage: true, hasFins: true, desc: 'Phần dưới bồn nhiên liệu ngoài màu cam đáy vòm tròn kèm 2 tên lửa đẩy nhiên liệu rắn SRB màu trắng mũi nhọn có đai đen-cam, 3 vòng gân vàng ở váy đáy và cặp loa phụt khổng lồ' },
  protonFairing: { name: 'Chóp Mũi Proton-M / Briz-M (Logo ESA ExoMars · Tầng 4)', cat: 'Đầu', kind: 'stack', height: 9.0, dry: 1.2, fuel: 6.5, thrustSL: 160, thrustVac: 320, ispSL: 265, ispVac: 365, engines: 1, hasFins: true, desc: 'Chóp mũi khí động Proton-M / Briz-M sơn trắng bóng in logo ESA xanh đậm, dải cờ sứ mệnh ExoMars, hàng ngàm tách dọc mũi, cổ chuyển tầng xám gân và dù hạ cánh' },
  protonStage3: { name: 'Tầng 3 Proton-M (Logo Roscosmos, Cờ Nga & Hốc Chữ U · Tầng 3)', cat: 'Nhiên liệu', kind: 'stack', height: 5.4, dry: 1.6, fuel: 15.0, thrustSL: 520, thrustVac: 860, ispSL: 275, ispVac: 360, engines: 1, autoStage: true, hasFins: true, desc: 'Tầng 3 tên lửa Proton-M màu trắng có đai gân dọc trên/dưới, in Quốc kỳ Nga, logo Roscosmos, hốc chữ U xám đen đặc trưng, ống cáp nổi và động cơ RD-0210' },
  protonStage2: { name: 'Tầng 2 Proton-M (Chữ Đỏ ПРОТОН-М & Giàn Mắt Cáo Chéo · Tầng 2)', cat: 'Nhiên liệu', kind: 'stack', height: 9.8, dry: 2.6, fuel: 28.0, thrustSL: 1120, thrustVac: 1620, ispSL: 285, ispVac: 360, engines: 4, autoStage: true, hasFins: true, desc: 'Thân trụ trắng Tầng 2 Proton-M in dòng chữ dọc đỏ rực ПРОТОН-М, cổ chữ ХРУНИЧЕВ, khung giàn mắt cáo chéo hở lộ vòm bồn xanh đen bên trong và 4 động cơ RD-0210' },
  protonStage1: { name: 'Tầng 1 Proton-M (Lõi Xám Gân, 6 Bình Trắng Đai Đen & 6× RD-275M)', cat: 'Động cơ', kind: 'stack', height: 12.2, dry: 5.8, fuel: 66.0, thrustSL: 4950, thrustVac: 5750, ispSL: 290, ispVac: 335, engines: 6, autoStage: true, hasFins: true, desc: 'Tầng 1 đặc trưng của Proton-M với thân lõi xám bạc kẻ gân dọc ở giữa, bao quanh bởi 6 bình nhiên liệu phụ màu trắng mũi côn nhọn có đai đáy đen tuyền, chụp hướng dòng và 6 động cơ RD-275M' },
  d4hFairing: { name: 'Chóp Mũi Trắng 5m Delta IV Heavy (Đầu Đen & Ngàm Tách · Tầng 3)', cat: 'Đầu', kind: 'stack', height: 8.8, dry: 1.2, fuel: 7.0, thrustSL: 170, thrustVac: 340, ispSL: 265, ispVac: 365, engines: 1, hasFins: true, desc: 'Chóp mũi tải trọng 5m màu trắng của Delta IV Heavy với chóp đỉnh đen, cụm cảm biến mũi, đường ghép dọc/ngang, đai đen ở đáy và dù hạ cánh' },
  d4hStage2: { name: 'Tầng 2 Cryogenic DCSS & Khoang Chuyển Tầng Trắng Đai Vàng (Delta IV Heavy · Tầng 2)', cat: 'Nhiên liệu', kind: 'stack', height: 6.4, dry: 1.9, fuel: 21.0, thrustSL: 780, thrustVac: 1260, ispSL: 285, ispVac: 375, engines: 1, autoStage: true, hasFins: true, desc: 'Khoang chuyển tầng và Tầng 2 DCSS màu trắng với 2 đai bọt cách nhiệt vàng nghệ ở cổ trên, ống cáp dọc thân và động cơ chân không RL10B-2' },
  d4hStage1: { name: 'Tầng 1 Delta IV Heavy (3 Lõi Cam CBC Ám Khói Đen, Đai Trắng Giữa & 3× RS-68A)', cat: 'Động cơ', kind: 'stack', height: 17.8, dry: 6.4, fuel: 74.0, thrustSL: 5350, thrustVac: 6150, ispSL: 290, ispVac: 340, engines: 3, autoStage: true, hasFins: true, desc: 'Cụm 3 lõi tên lửa đẩy Common Booster Core (CBC) màu cam SOFI đặc trưng với vệt ám khói đen ở đáy, đai trắng giữa viền vàng, 2 chóp mũi phụ trắng, cặp ống dẫn LOX trắng nổi dọc mặt trước, đáy côn xám bạc và 3 siêu động cơ RS-68A' },
  titan4Fairing: { name: 'Chóp Mũi Trắng Dài 5m Titan IV (4 Đốt Gân & Đáy Côn · Tầng 3)', cat: 'Đầu', kind: 'stack', height: 14.8, dry: 1.4, fuel: 8.0, thrustSL: 180, thrustVac: 350, ispSL: 265, ispVac: 370, engines: 1, hasFins: true, desc: 'Chóp mũi tải trọng 5m (PLF) trắng cao vút của Titan IVB chia 4 đốt trụ có gân dọc, đường ghép giữa, đáy côn thu boat-tail và dù hạ cánh' },
  titan4Stage2: { name: 'Tầng 2 Titan IV (Ốp Nâu Đỏ Chữ L, Phù Hiệu USAF & Khe Gió Đen · Tầng 2)', cat: 'Nhiên liệu', kind: 'stack', height: 8.2, dry: 2.1, fuel: 23.0, thrustSL: 820, thrustVac: 1320, ispSL: 285, ispVac: 365, engines: 1, autoStage: true, hasFins: true, desc: 'Tầng 2 Titan IV với tấm bọc cách nhiệt màu nâu đỏ hình chữ L, đai bạc хроm kèm phù hiệu Không quân Mỹ (USAF), cổ chuyển tầng gân trắng có 2 cụm khe thoát khí đen và động cơ LR91' },
  titan4Stage1: { name: 'Tầng 1 Titan IV (Lõi Bạc US AIR FORCE & 2 Booster Trắng SRMU · Tầng 1)', cat: 'Động cơ', kind: 'stack', height: 14.6, dry: 5.8, fuel: 68.0, thrustSL: 4950, thrustVac: 5750, ispSL: 290, ispVac: 335, engines: 3, autoStage: true, hasFins: true, desc: 'Thân lõi Tầng 1 bằng nhôm bạc sáng bóng in dòng chữ dọc US AIR FORCE, đáy côn nâu đỏ với loa phụt bạc LR87, kẹp giữa 2 tên lửa đẩy phụ rắn SRMU màu trắng kem có gân 3 vòng, khung giằng tam giác trắng và 2 loa phụt xám lớn' },
  starshipNose: { name: 'Mũi Tàu Starship Đen Gạch Chịu Nhiệt & 2 Cánh Vây Trước (Tầng 3)', cat: 'Đầu', kind: 'stack', height: 7.2, dry: 1.4, fuel: 10.0, thrustSL: 240, thrustVac: 420, ispSL: 280, ispVac: 380, engines: 1, hasFins: true, desc: 'Chóp mũi ogive của tàu Starship phủ gạch chịu nhiệt đen than chì kết hợp ánh thép không gỉ, 2 cánh vây khí động phía trước (Forward Flaps) và dù hạ cánh' },
  starshipShip: { name: 'Thân Tàu Starship (Đai Băng Trắng, 2 Cánh Vây Sau, Đai Hot-Stage & 6 Raptor · Tầng 2)', cat: 'Nhiên liệu', kind: 'stack', height: 10.4, dry: 2.8, fuel: 32.0, thrustSL: 1350, thrustVac: 1950, ispSL: 300, ispVac: 380, engines: 6, autoStage: true, hasFins: true, desc: 'Thân tàu Starship chia 2 nửa trắng phủ băng lạnh & đen gạch chịu nhiệt, váy đáy xám đen kèm 2 cánh vây lớn phía sau (Aft Flaps), vành tách tầng nóng (Hot-Staging Ring) và 6 động cơ Raptor' },
  starshipBooster: { name: 'Tầng Đẩy Super Heavy (Thép Không Gỉ, 4 Cánh Lưới, 4 Sống Khí Động & 33 Động Cơ Raptor)', cat: 'Động cơ', kind: 'stack', height: 20.6, dry: 6.8, fuel: 82.0, thrustSL: 6200, thrustVac: 7100, ispSL: 310, ispVac: 350, engines: 33, autoStage: true, hasFins: true, desc: 'Siêu tầng đẩy Super Heavy bằng thép không gỉ với 4 cánh lưới xòe ngang ở đỉnh, vệt băng trắng dọc sống lưng, 4 gờ khí động (chines) nổi dọc thân dưới và cụm 33 động cơ Raptor phát sáng rực rỡ ở đáy' },
  ufoSaucer: { name: 'Đĩa Bay UFO Siêu Cấp', cat: 'Đầu', kind: 'stack', height: 3.6, dry: 1.2, fuel: 55.0, isBattery: true, thrustSL: 3200, thrustVac: 3600, ispSL: 6500, ispVac: 8000, engines: 1, restart: true, hasFins: true, desc: 'Siêu Đĩa Bay UFO của người ngoài hành tinh tích hợp vòm kính phi công, vành đĩa plasma neon, pin lượng tử 55 tấn, dù hạ cánh và lõi phản trọng lực' },
};

export const MAT = {};

function physical(o) { return new THREE.MeshPhysicalMaterial(o); }

export function initMaterials() {
  if (MAT.white) return;
  const panel = TX.panelTextures();
  const foam = TX.foamTextures();
  const foil = TX.foilTextures();
  const brushed = TX.brushedRough();
  MAT.white = physical({ color: 0xf1f1ec, roughness: 1, roughnessMap: panel.rough, normalMap: panel.normal, normalScale: new THREE.Vector2(0.6, 0.6), clearcoat: 0.55, clearcoatRoughness: 0.28 });
  MAT.black = physical({ color: 0x141416, roughness: 0.55, normalMap: panel.normal, normalScale: new THREE.Vector2(0.5, 0.5), clearcoat: 0.3, clearcoatRoughness: 0.4 });
  MAT.checker = physical({ map: TX.checkerMap(), roughness: 1, roughnessMap: panel.rough, normalMap: panel.normal, normalScale: new THREE.Vector2(0.6, 0.6), clearcoat: 0.5, clearcoatRoughness: 0.3 });
  MAT.foam = physical({ map: foam.map, roughness: 0.85, normalMap: foam.normal, normalScale: new THREE.Vector2(0.9, 0.9) });
  MAT.metal = physical({ color: 0xbfc3c9, metalness: 1, roughness: 1, roughnessMap: brushed });
  MAT.darkMetal = physical({ color: 0x2c2d31, metalness: 0.85, roughness: 0.42 });
  MAT.silver = physical({ color: 0xd9dce1, metalness: 1, roughness: 0.18, normalMap: panel.normal, normalScale: new THREE.Vector2(0.25, 0.25) });
  MAT.gold = physical({ color: 0xffffff, map: foil.map, metalness: 1, roughness: 0.28, normalMap: foil.normal, normalScale: new THREE.Vector2(1, 1) });
  MAT.copper = physical({ color: 0xc27a4a, metalness: 1, roughness: 0.3 });
  MAT.glass = physical({ color: 0x05080d, metalness: 0.2, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02 });
  MAT.heatShield = physical({ color: 0x3a2a1e, roughness: 0.9, metalness: 0.1 });
  MAT.red = physical({ color: 0xb3221b, roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.2, normalMap: panel.normal, normalScale: new THREE.Vector2(0.3, 0.3) });
  MAT.decal = new THREE.MeshPhysicalMaterial({ map: TX.flagDecal(), transparent: true, roughness: 0.4, clearcoat: 0.5, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });
  MAT.titanium = physical({ color: 0x9a948c, metalness: 1, roughness: 0.5, roughnessMap: brushed });
  MAT.carbon = physical({ color: 0x0e0f11, roughness: 0.42, metalness: 0.15, normalMap: panel.normal, normalScale: new THREE.Vector2(0.35, 0.35), clearcoat: 0.6, clearcoatRoughness: 0.35 });
  MAT.engineDark = physical({ color: 0x1d1e21, metalness: 0.7, roughness: 0.55 });
  MAT.rubber = physical({ color: 0x18191c, roughness: 0.9, metalness: 0.06 });
  MAT.blue = physical({ color: 0x1565c0, roughness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  MAT.orange = physical({ color: 0xef6c00, roughness: 0.4, clearcoat: 0.5 });
  const solar = TX.solarTextures();
  MAT.solar = physical({
    color: 0xffffff,
    map: solar.map,
    normalMap: solar.normal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    emissive: new THREE.Color(0x0b2e66),
    emissiveIntensity: 0.38,
    roughness: 0.16,
    metalness: 0.22,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
  });
  MAT.stealth = physical({ color: 0x22262c, roughness: 0.65, metalness: 0.35, clearcoat: 0.25 });
}

/** Rescale a geometry's UVs (keeps panel textures at constant world scale) */
function scaleUV(geo, su, sv) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  return geo;
}

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

function bellMaterial(dark = false) {
  return new THREE.MeshPhysicalMaterial({
    color: dark ? 0x3c4048 : 0x4a423c, metalness: 0.9, roughness: 0.38,
    emissive: new THREE.Color(0xff4a12), emissiveIntensity: 0, side: THREE.DoubleSide,
  });
}

/** Rao-style bell, throat at top (y = len), exit at y=0 */
function bellGeometry(rt, re, len, segs = 64, t0 = 0, t1 = 1) {
  const pts = [];
  const N = 32;
  for (let i = 0; i <= N; i++) {
    const t = t0 + (t1 - t0) * (i / N); // 0 = exit, 1 = throat
    const s = 1 - t;                       // 0 = throat
    const r = rt + (re - rt) * Math.pow(s, 0.62);
    pts.push(new THREE.Vector2(r, t * len));
  }
  return new THREE.LatheGeometry(pts, segs);
}

function addNozzle(group, x, z, r, bellMats, style = 'default') {
  const n = new THREE.Object3D();
  n.name = 'nozzle';
  n.position.set(x, 0, z);
  n.userData.r = r;
  n.userData.style = style;
  group.add(n);
  group.userData.nozzles = group.userData.nozzles || [];
  group.userData.nozzles.push(n);
  group.userData.bellMats = group.userData.bellMats || [];
  for (const m of bellMats) if (!group.userData.bellMats.includes(m)) group.userData.bellMats.push(m);
}

function pipe(points, r, mat) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 24, r, 8), mat);
}

function engineChamber(g, x, z, rt, len, top) {
  // combustion chamber + injector dome + turbopump plumbing
  const chamberR = rt * 1.7;
  const ch = mesh(new THREE.CylinderGeometry(chamberR, chamberR, 0.42, 32), MAT.darkMetal, x, len + 0.21, z);
  const throat = mesh(new THREE.CylinderGeometry(chamberR, rt, 0.18, 32), MAT.darkMetal, x, len + 0.0, z);
  const dome = mesh(new THREE.SphereGeometry(chamberR, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), MAT.metal, x, len + 0.42, z);
  g.add(ch, throat, dome);
  // turbopump
  const tp = mesh(new THREE.CylinderGeometry(chamberR * 0.55, chamberR * 0.55, chamberR * 1.6, 20), MAT.metal, x + chamberR * 1.5, len + 0.45, z);
  tp.rotation.z = Math.PI / 2 * 0.15;
  g.add(tp);
  g.add(pipe([[x + chamberR * 1.5, len + 0.9, z], [x + chamberR * 1.2, top - 0.3, z + 0.1], [x + chamberR * 0.3, top - 0.05, z]], 0.05, MAT.copper));
  g.add(pipe([[x, len + 0.6, z + chamberR], [x - chamberR * 0.6, top - 0.4, z + chamberR * 1.1], [x - chamberR * 0.2, top - 0.05, z + chamberR * 0.4]], 0.045, MAT.gold));
  g.add(pipe([[x + chamberR * 1.5, len + 0.2, z], [x + chamberR * 1.1, len - 0.1, z + 0.05], [x + rt * 1.2, len - 0.25, z]], 0.035, MAT.copper));
}

function engineMount(g, top) {
  const plate = mesh(new THREE.CylinderGeometry(R, R * 0.92, 0.32, 64), MAT.darkMetal, 0, top - 0.16, 0);
  const skirt = mesh(new THREE.CylinderGeometry(R * 0.92, R * 0.62, 0.35, 48, 1, true), MAT.gold, 0, top - 0.5, 0);
  skirt.material = MAT.gold;
  g.add(plate, skirt);
  // truss struts
  const strutGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const s = mesh(strutGeo, MAT.metal, Math.cos(a) * R * 0.7, top - 0.8, Math.sin(a) * R * 0.7);
    s.rotation.z = Math.cos(a) * 0.35; s.rotation.x = -Math.sin(a) * 0.35;
    g.add(s);
  }
}

const builders = {
  nose() {
    const g = new THREE.Group();
    const H = PARTS.nose.height;
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      pts.push(new THREE.Vector2(Math.max(0.001, R * Math.pow(1 - Math.pow(t, 2.1), 0.6)), t * (H - 0.1)));
    }
    const geo = scaleUV(new THREE.LatheGeometry(pts, 64), 2, 1.2);
    g.add(mesh(geo, MAT.white));
    g.add(mesh(new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.35, 64, 1, true), MAT.black, 0, 0.175, 0));
    g.add(mesh(new THREE.SphereGeometry(0.06, 16, 8), MAT.metal, 0, H - 0.1, 0));
    return g;
  },

  capsule() {
    const g = new THREE.Group();
    // heat shield
    g.add(mesh(new THREE.CylinderGeometry(R * 1.0, R * 0.96, 0.22, 64), MAT.heatShield, 0, 0.11, 0));
    // conical body
    const pts = [new THREE.Vector2(R * 0.995, 0.22), new THREE.Vector2(R * 0.99, 0.32), new THREE.Vector2(0.58, 2.25), new THREE.Vector2(0.55, 2.32)];
    g.add(mesh(scaleUV(new THREE.LatheGeometry(pts, 64), 3, 2), MAT.silver));
    g.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.35, 32), MAT.darkMetal, 0, 2.5, 0));
    // escape tower (own sub-group so it can be hidden / jettisoned)
    const tower = new THREE.Group();
    tower.name = 'tower';
    g.add(tower);
    g.userData.tower = tower;
    const towerBase = 2.67;
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.0, 6);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const l = mesh(legGeo, MAT.red, Math.cos(a) * 0.22, towerBase + 0.5, Math.sin(a) * 0.22);
      l.rotation.z = -Math.cos(a) * 0.15; l.rotation.x = Math.sin(a) * 0.15;
      tower.add(l);
    }
    tower.add(mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.5, 20), MAT.white, 0, towerBase + 1.2, 0));
    const tip = mesh(new THREE.ConeGeometry(0.13, 0.35, 20), MAT.red, 0, towerBase + 1.62, 0);
    tower.add(tip);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      const nz = mesh(new THREE.ConeGeometry(0.05, 0.14, 10, 1, true), MAT.darkMetal, Math.cos(a) * 0.17, towerBase + 0.95, Math.sin(a) * 0.17);
      nz.rotation.z = Math.cos(a) * 0.6; nz.rotation.x = -Math.sin(a) * 0.6;
      tower.add(nz);
    }
    // windows
    const alpha = Math.atan((R - 0.58) / 2.0);
    for (const a of [-0.5, 0.5, Math.PI]) {
      const y = 1.45, r = R - (y - 0.3) * Math.tan(alpha) + 0.01;
      const w = mesh(new THREE.BoxGeometry(0.32, 0.26, 0.04), MAT.glass, Math.sin(a) * r, y, Math.cos(a) * r);
      w.rotation.set(-alpha, a, 0, 'YXZ');
      g.add(w);
      const frame = mesh(new THREE.BoxGeometry(0.38, 0.32, 0.02), MAT.darkMetal, Math.sin(a) * (r - 0.012), y, Math.cos(a) * (r - 0.012));
      frame.rotation.set(-alpha, a, 0, 'YXZ');
      g.add(frame);
    }
    // RCS quads
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const y = 1.0, r = R - (y - 0.3) * Math.tan(alpha) + 0.06;
      const b = mesh(new THREE.BoxGeometry(0.16, 0.16, 0.1), MAT.darkMetal, Math.sin(a) * r, y, Math.cos(a) * r);
      b.rotation.set(-alpha, a, 0, 'YXZ');
      g.add(b);
    }
    addParachutes(g, 2.7);
    return g;
  },

  dockPort() { return buildDockPort(); },
  engReuse() { return buildOctaweb(); },
  legs() { return buildLeg(); },
  gridfins() { return buildGridFin(); },
  solarPanel() { return buildSolarPanel(); },
  gunLaser() { return buildGunLaser(); },
  waterCannon() { return buildWaterCannon(); },
  gunAcid() { return buildGunAcid(); },
  gunElectric() { return buildGunElectric(); },

  tankS() { return tank(PARTS.tankS.height, MAT.white, true); },
  tankM() { return tank(PARTS.tankM.height, MAT.checker, false); },
  tankL() { return tank(PARTS.tankL.height, MAT.foam, true); },

  batteryPack() {
    const g = new THREE.Group();
    const H = PARTS.batteryPack.height;
    const cellCyan = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: new THREE.Color(0x00b8d4),
      emissiveIntensity: 1.75,
      roughness: 0.18,
      metalness: 0.3,
    });
    const cellEmerald = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: new THREE.Color(0x059669),
      emissiveIntensity: 1.45,
      roughness: 0.2,
      metalness: 0.3,
    });
    const cellRuby = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      emissive: new THREE.Color(0xd50000),
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.3,
    });

    // Top & bottom titanium bulkhead adapter rings
    g.add(mesh(new THREE.CylinderGeometry(R, R, 0.34, 64), MAT.darkMetal, 0, H - 0.17, 0));
    g.add(mesh(new THREE.CylinderGeometry(R * 1.01, R * 1.01, 0.10, 64), MAT.silver, 0, H - 0.06, 0));
    g.add(mesh(new THREE.CylinderGeometry(R, R, 0.34, 64), MAT.darkMetal, 0, 0.17, 0));
    g.add(mesh(new THREE.CylinderGeometry(R * 1.01, R * 1.01, 0.10, 64), MAT.silver, 0, 0.06, 0));

    // Inner carbon-armored quantum battery core cylinder
    g.add(mesh(new THREE.CylinderGeometry(R * 0.90, R * 0.90, H - 0.64, 56), MAT.carbon, 0, H * 0.5, 0));

    // 4 horizontal glowing charge-status & busbar rings (cyan for Anti-Grav, ruby/emerald for Laser & charge level)
    g.add(mesh(new THREE.CylinderGeometry(R * 0.935, R * 0.935, 0.18, 56), cellCyan, 0, H * 0.24, 0));
    g.add(mesh(new THREE.CylinderGeometry(R * 0.935, R * 0.935, 0.18, 56), cellEmerald, 0, H * 0.44, 0));
    g.add(mesh(new THREE.CylinderGeometry(R * 0.935, R * 0.935, 0.18, 56), cellEmerald, 0, H * 0.60, 0));
    g.add(mesh(new THREE.CylinderGeometry(R * 0.935, R * 0.935, 0.18, 56), cellRuby, 0, H * 0.78, 0));

    // Copper high-voltage induction coils between cells
    for (const yf of [0.34, 0.52, 0.69]) {
      g.add(mesh(new THREE.TorusGeometry(R * 0.94, 0.032, 12, 56).rotateX(Math.PI / 2), MAT.copper, 0, H * yf, 0));
    }

    // 6 vertical armored busbar ribs with glowing quantum energy strips
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = Math.cos(a) * (R * 0.95), pz = Math.sin(a) * (R * 0.95);
      const rib = mesh(new THREE.BoxGeometry(0.16, H - 0.56, 0.22), MAT.titanium, px, H * 0.5, pz);
      rib.rotation.y = -a;
      g.add(rib);

      const glowMat = i % 2 === 0 ? cellCyan : cellRuby;
      const bar = mesh(new THREE.BoxGeometry(0.06, H - 0.82, 0.24), glowMat, px * 1.02, H * 0.5, pz * 1.02);
      bar.rotation.y = -a;
      g.add(bar);
    }
    return g;
  },

  batteryPackL() {
    const g = new THREE.Group();
    const H = PARTS.batteryPackL.height;
    const cellCyan = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: new THREE.Color(0x00b8d4),
      emissiveIntensity: 1.9,
      roughness: 0.16,
      metalness: 0.32,
    });
    const cellEmerald = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: new THREE.Color(0x059669),
      emissiveIntensity: 1.6,
      roughness: 0.18,
      metalness: 0.3,
    });
    const cellRuby = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      emissive: new THREE.Color(0xd50000),
      emissiveIntensity: 1.7,
      roughness: 0.18,
      metalness: 0.3,
    });
    const cellGold = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: new THREE.Color(0xd97706),
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.4,
    });

    // Top, middle & bottom heavy titanium bulkhead adapter rings
    g.add(mesh(new THREE.CylinderGeometry(R, R, 0.40, 64), MAT.darkMetal, 0, H - 0.20, 0));
    g.add(mesh(new THREE.CylinderGeometry(R * 1.015, R * 1.015, 0.12, 64), MAT.silver, 0, H - 0.06, 0));
    g.add(mesh(new THREE.CylinderGeometry(R * 1.01, R * 1.01, 0.36, 64), MAT.darkMetal, 0, H * 0.5, 0));
    g.add(mesh(new THREE.CylinderGeometry(R, R, 0.40, 64), MAT.darkMetal, 0, 0.20, 0));
    g.add(mesh(new THREE.CylinderGeometry(R * 1.015, R * 1.015, 0.12, 64), MAT.silver, 0, 0.06, 0));

    // Inner carbon-armored 50-ton quantum battery core cylinder
    g.add(mesh(new THREE.CylinderGeometry(R * 0.91, R * 0.91, H - 0.72, 56), MAT.carbon, 0, H * 0.5, 0));

    // 8 horizontal glowing supercapacitor cell banks across both halves
    const ringData = [
      [0.12, cellCyan], [0.22, cellEmerald], [0.32, cellGold], [0.41, cellRuby],
      [0.59, cellCyan], [0.68, cellEmerald], [0.78, cellGold], [0.88, cellRuby],
    ];
    for (const [yf, mat] of ringData) {
      g.add(mesh(new THREE.CylinderGeometry(R * 0.945, R * 0.945, 0.22, 56), mat, 0, H * yf, 0));
    }

    // Heavy copper high-voltage induction coils between cells
    for (const yf of [0.17, 0.27, 0.365, 0.635, 0.73, 0.83]) {
      g.add(mesh(new THREE.TorusGeometry(R * 0.95, 0.036, 12, 56).rotateX(Math.PI / 2), MAT.copper, 0, H * yf, 0));
    }

    // 8 vertical armored busbar ribs with glowing quantum energy strips
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const px = Math.cos(a) * (R * 0.96), pz = Math.sin(a) * (R * 0.96);
      const rib = mesh(new THREE.BoxGeometry(0.17, H - 0.64, 0.22), MAT.titanium, px, H * 0.5, pz);
      rib.rotation.y = -a;
      g.add(rib);

      const glowMat = i % 2 === 0 ? cellCyan : cellRuby;
      const bar = mesh(new THREE.BoxGeometry(0.065, H - 0.92, 0.24), glowMat, px * 1.02, H * 0.5, pz * 1.02);
      bar.rotation.y = -a;
      g.add(bar);
    }
    return g;
  },

  engHeavy() {
    const g = new THREE.Group();
    const top = PARTS.engHeavy.height;
    engineMount(g, top);
    const len = 1.35, rt = 0.15, re = 0.5;
    const mats = [];
    for (const [x, z] of [[0.55, 0.55], [-0.55, 0.55], [0.55, -0.55], [-0.55, -0.55]]) {
      const m = bellMaterial();
      mats.push(m);
      g.add(mesh(bellGeometry(rt, re, len), m, x, 0, z));
      engineChamber(g, x, z, rt, len, top - 0.3);
      addNozzle(g, x, z, re, [m]);
    }
    return g;
  },

  engMid() {
    const g = new THREE.Group();
    const top = PARTS.engMid.height;
    engineMount(g, top);
    const m = bellMaterial();
    const len = 1.55, rt = 0.24, re = 0.88;
    g.add(mesh(bellGeometry(rt, re, len), m));
    // cooling tube rings
    for (let i = 1; i < 5; i++) {
      const t = i / 5, s = 1 - t;
      const r = rt + (re - rt) * Math.pow(s, 0.62);
      g.add(mesh(new THREE.TorusGeometry(r + 0.01, 0.018, 8, 48).rotateX(Math.PI / 2), MAT.copper, 0, t * len, 0));
    }
    engineChamber(g, 0, 0, rt, len, top - 0.3);
    addNozzle(g, 0, 0, re, [m]);
    return g;
  },

  engVac() {
    const g = new THREE.Group();
    const top = PARTS.engVac.height;
    engineMount(g, top);
    const mUpper = bellMaterial();
    const mExt = bellMaterial(true);
    const len = 2.5, rt = 0.18, re = 1.15;
    g.add(mesh(bellGeometry(rt, re, len, 64, 0.45, 1), mUpper));
    g.add(mesh(bellGeometry(rt, re, len, 64, 0, 0.45), mExt));
    engineChamber(g, 0, 0, rt, len, top - 0.3);
    addNozzle(g, 0, 0, re, [mUpper, mExt]);
    return g;
  },

  engAntiGrav() {
    const g = new THREE.Group();
    const H = PARTS.engAntiGrav.height;
    const cyanGlow = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: new THREE.Color(0x00e5ff),
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.3,
    });
    const violetGlow = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: new THREE.Color(0x9333ea),
      emissiveIntensity: 1.4,
      roughness: 0.25,
      metalness: 0.4,
    });
    // Upper structural adapter collar
    g.add(mesh(new THREE.CylinderGeometry(R, R * 0.96, 0.42, 64), MAT.darkMetal, 0, H - 0.21, 0));
    g.add(mesh(new THREE.CylinderGeometry(R * 1.01, R * 1.01, 0.12, 64), MAT.silver, 0, H - 0.08, 0));
    g.add(mesh(new THREE.CylinderGeometry(R * 0.94, R * 0.78, 0.36, 48), MAT.stealth, 0, H - 0.60, 0));

    // Central quantum graviton sphere core + energy rings
    g.add(mesh(new THREE.SphereGeometry(0.56, 36, 24), cyanGlow, 0, H * 0.52, 0));
    const cageRing1 = mesh(new THREE.TorusGeometry(0.68, 0.045, 14, 48), MAT.silver, 0, H * 0.52, 0);
    cageRing1.rotation.x = Math.PI / 3;
    const cageRing2 = mesh(new THREE.TorusGeometry(0.68, 0.045, 14, 48), MAT.silver, 0, H * 0.52, 0);
    cageRing2.rotation.x = -Math.PI / 3;
    g.add(cageRing1, cageRing2);

    // 6 magnetic containment pylons around the core
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = Math.cos(a) * (R * 0.84), pz = Math.sin(a) * (R * 0.84);
      const pylon = mesh(new THREE.BoxGeometry(0.16, 1.65, 0.24), MAT.stealth, px, H * 0.50, pz);
      pylon.rotation.y = -a;
      g.add(pylon);
      const strip = mesh(new THREE.BoxGeometry(0.06, 1.42, 0.26), cyanGlow, px * 1.02, H * 0.50, pz * 1.02);
      strip.rotation.y = -a;
      g.add(strip);
    }

    // 3 concentric levitation / graviton field torus coils at the base
    g.add(mesh(new THREE.TorusGeometry(R * 0.96, 0.11, 20, 64).rotateX(Math.PI / 2), MAT.darkMetal, 0, 0.88, 0));
    g.add(mesh(new THREE.TorusGeometry(R * 0.96, 0.045, 12, 64).rotateX(Math.PI / 2), cyanGlow, 0, 0.80, 0));

    g.add(mesh(new THREE.TorusGeometry(R * 0.78, 0.095, 18, 64).rotateX(Math.PI / 2), MAT.titanium, 0, 0.48, 0));
    g.add(mesh(new THREE.TorusGeometry(R * 0.78, 0.04, 12, 64).rotateX(Math.PI / 2), violetGlow, 0, 0.41, 0));

    g.add(mesh(new THREE.TorusGeometry(R * 0.56, 0.08, 16, 56).rotateX(Math.PI / 2), MAT.silver, 0, 0.16, 0));
    g.add(mesh(new THREE.CylinderGeometry(R * 0.48, R * 0.54, 0.14, 48), cyanGlow, 0, 0.12, 0));

    // High-intensity quantum field point light (turns on when engine opens, turns off when engine cuts off)
    const agLight = new THREE.PointLight(0x00e5ff, 0, 50, 2.0);
    agLight.position.set(0, H * 0.52, 0);
    g.add(agLight);
    g.userData.agLight = agLight;
    g.userData.cyanGlow = cyanGlow;
    g.userData.violetGlow = violetGlow;

    addNozzle(g, 0, 0, 0.95, [cyanGlow, violetGlow], 'antigrav');
    return g;
  },

  engLaser() {
    const g = new THREE.Group();
    const H = PARTS.engLaser.height;
    const rubyGlow = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      emissive: new THREE.Color(0xff1744),
      emissiveIntensity: 2.0,
      roughness: 0.15,
      metalness: 0.25,
    });
    const amberGlow = new THREE.MeshStandardMaterial({
      color: 0xff9100,
      emissive: new THREE.Color(0xff5252),
      emissiveIntensity: 1.4,
      roughness: 0.25,
      metalness: 0.5,
    });
    // Upper capacitor & power conditioning drum
    g.add(mesh(new THREE.CylinderGeometry(R, R, 0.72, 64), MAT.stealth, 0, H - 0.36, 0));
    g.add(mesh(new THREE.CylinderGeometry(R * 1.015, R * 1.015, 0.12, 64), MAT.gold, 0, H - 0.10, 0));
    g.add(mesh(new THREE.CylinderGeometry(R * 1.015, R * 1.015, 0.10, 64), MAT.silver, 0, H - 0.66, 0));

    // Mid optical resonator chamber
    g.add(mesh(new THREE.CylinderGeometry(R * 0.76, R * 0.68, 1.32, 48), MAT.darkMetal, 0, H - 1.38, 0));
    g.add(mesh(new THREE.CylinderGeometry(R * 0.79, R * 0.79, 0.16, 48), rubyGlow, 0, H - 1.15, 0));
    g.add(mesh(new THREE.CylinderGeometry(R * 0.75, R * 0.75, 0.14, 48), rubyGlow, 0, H - 1.62, 0));

    // 8 radial heat-sink fins & 4 laser pumping amplifier tubes
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const fx = Math.cos(a) * (R * 0.84), fz = Math.sin(a) * (R * 0.84);
      const fin = mesh(new THREE.BoxGeometry(0.06, 1.22, 0.32), MAT.silver, fx, H - 1.38, fz);
      fin.rotation.y = -a + Math.PI / 2;
      g.add(fin);
      if (i % 2 === 0) {
        const tx = Math.cos(a + Math.PI / 8) * (R * 0.86), tz = Math.sin(a + Math.PI / 8) * (R * 0.86);
        g.add(mesh(new THREE.CylinderGeometry(0.085, 0.085, 1.48, 16), MAT.copper, tx, H - 1.42, tz));
        g.add(mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.24, 16), amberGlow, tx, H - 1.42, tz));
      }
    }

    // Lower parabolic focusing nozzle + ruby crystal emitter lens
    g.add(mesh(new THREE.CylinderGeometry(R * 0.68, R * 0.92, 0.78, 56, 1, true), MAT.titanium, 0, 0.55, 0));
    g.add(mesh(new THREE.TorusGeometry(R * 0.92, 0.055, 14, 56).rotateX(Math.PI / 2), MAT.darkMetal, 0, 0.16, 0));
    g.add(mesh(new THREE.TorusGeometry(R * 0.82, 0.04, 12, 56).rotateX(Math.PI / 2), rubyGlow, 0, 0.12, 0));
    g.add(mesh(new THREE.SphereGeometry(0.46, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI), rubyGlow, 0, 0.34, 0));

    addNozzle(g, 0, 0, 0.78, [rubyGlow, amberGlow], 'laser');
    return g;
  },

  decoupler() {
    const g = new THREE.Group();
    const h = PARTS.decoupler.height;
    g.add(mesh(new THREE.CylinderGeometry(R, R, h, 64), MAT.darkMetal, 0, h / 2, 0));
    g.add(mesh(new THREE.CylinderGeometry(R + 0.015, R + 0.015, h * 0.45, 64, 1, true), MAT.gold, 0, h / 2, 0));
    const boltGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.06, 8).rotateX(Math.PI / 2);
    const bolts = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const b = boltGeo.clone();
      b.lookAt(new THREE.Vector3(Math.sin(a), 0, Math.cos(a)));
      b.translate(Math.sin(a) * (R + 0.02), h * 0.88, Math.cos(a) * (R + 0.02));
      bolts.push(b);
    }
    g.add(mesh(mergeGeometries(bolts), MAT.metal));
    return g;
  },

  fins() {
    // single fin, root along +x at radius R
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(1.45, -0.35);
    shape.lineTo(1.45, 0.45);
    shape.lineTo(0, 2.7);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
    geo.translate(0, 0, -0.035);
    const g = new THREE.Group();
    const f = mesh(geo, MAT.red, R - 0.02, 0, 0);
    g.add(f);
    // root fairing
    g.add(mesh(new THREE.BoxGeometry(0.12, 2.5, 0.16), MAT.darkMetal, R + 0.02, 1.25, 0));
    return g;
  },

  booster() {
    const g = new THREE.Group();
    const r = 0.6;
    // nozzle
    const m = bellMaterial();
    g.add(mesh(bellGeometry(0.16, 0.44, 0.7), m));
    // aft skirt
    g.add(mesh(new THREE.CylinderGeometry(r, r * 1.25, 0.9, 48, 1, true), MAT.white, 0, 1.0, 0));
    g.add(mesh(new THREE.CylinderGeometry(r * 1.26, r * 1.26, 0.08, 48), MAT.darkMetal, 0, 0.56, 0));
    // body
    g.add(mesh(scaleUV(new THREE.CylinderGeometry(r, r, 9, 48, 1, true), 1, 3.6), MAT.white, 0, 1.45 + 4.5, 0));
    for (const y of [1.6, 4.4, 7.4]) g.add(mesh(new THREE.CylinderGeometry(r + 0.012, r + 0.012, 0.18, 48, 1, true), MAT.darkMetal, 0, y, 0));
    g.add(mesh(new THREE.CylinderGeometry(r + 0.01, r + 0.01, 1.2, 48, 1, true), MAT.black, 0, 9.6, 0));
    // nose
    const pts = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector2(Math.max(0.001, r * Math.pow(1 - t * t, 0.55)), 10.45 + t * 1.35)); }
    g.add(mesh(new THREE.LatheGeometry(pts, 48), MAT.white));
    addNozzle(g, 0, 0, 0.44, [m]);
    return g;
  },
  cockpitRover() { return buildCockpitRover(); },
  chassisRover() { return buildChassisRover(); },
  wheelsRover() { return buildWheelsRover(); },
  solarRover() { return buildSolarRover(); },
  cabinBoat() { return buildCabinBoat(); },
  hullBoat() { return buildHullBoat(); },
  motorBoat() { return buildMotorBoat(); },
  floatsBoat() { return buildFloatsBoat(); },
  cockpitPlane() { return buildCockpitPlane(); },
  fuselagePlane() { return buildFuselagePlane(); },
  wingsPlane() { return buildWingsPlane(); },
  tailPlane() { return buildTailPlane(); },
  engJet() { return buildEngJet(); },
  gearPlane() { return buildGearPlane(); },
  saturnApollo() { return buildSaturnApollo(); },
  saturnSM() { return buildSaturnSM(); },
  saturnSLA() { return buildSaturnSLA(); },
  saturnS4B() { return buildSaturnS4B(); },
  saturnS4BInter() { return buildSaturnS4BInter(); },
  saturnS2() { return buildSaturnS2(); },
  saturnS2Inter() { return buildSaturnS2Inter(); },
  saturnS1() { return buildSaturnS1(); },
  apollo11CM() { return buildApollo11CM(); },
  apollo11SM() { return buildApollo11SM(); },
  apollo11SLA() { return buildApollo11SLA(); },
  apollo11S4B() { return buildApollo11S4B(); },
  apollo11S4BInter() { return buildApollo11S4BInter(); },
  apollo11S2() { return buildApollo11S2(); },
  apollo11S2Inter() { return buildApollo11S2Inter(); },
  apollo11S1() { return buildApollo11S1(); },
  soyuzNose() { return buildSoyuzNose(); },
  soyuzFairing() { return buildSoyuzFairing(); },
  soyuzBlockI() { return buildSoyuzBlockI(); },
  soyuzCore() { return buildSoyuzCore(); },
  soyuzBooster() { return buildSoyuzBooster(); },
  n1Tower() { return buildN1Tower(); },
  n1Fairing() { return buildN1Fairing(); },
  n1BlockV() { return buildN1BlockV(); },
  n1BlockB() { return buildN1BlockB(); },
  n1BlockA() { return buildN1BlockA(); },
  buranNose() { return buildBuranNose(); },
  buranShuttle() { return buildBuranShuttle(); },
  buranEnergia() { return buildBuranEnergia(); },
  energiaNose() { return buildEnergiaNose(); },
  energiaPolyus() { return buildEnergiaPolyus(); },
  energiaCore() { return buildEnergiaCore(); },
  cz5Fairing() { return buildCz5Fairing(); },
  cz5Stage2() { return buildCz5Stage2(); },
  cz5Stage1() { return buildCz5Stage1(); },
  ariane5Fairing() { return buildAriane5Fairing(); },
  ariane5Stage2() { return buildAriane5Stage2(); },
  ariane5Stage1() { return buildAriane5Stage1(); },
  slsOrion() { return buildSlsOrion(); },
  slsStage2() { return buildSlsStage2(); },
  slsStage1() { return buildSlsStage1(); },
  atlasVFairing() { return buildAtlasVFairing(); },
  atlasVStage2() { return buildAtlasVStage2(); },
  atlasVStage1() { return buildAtlasVStage1(); },
  fhFairing() { return buildFhFairing(); },
  fhStage2() { return buildFhStage2(); },
  fhStage1() { return buildFhStage1(); },
  f9Dragon() { return buildF9Dragon(); },
  f9Stage2() { return buildF9Stage2(); },
  f9Stage1() { return buildF9Stage1(); },
  shuttleNose() { return buildShuttleNose(); },
  shuttleOrbiter() { return buildShuttleOrbiter(); },
  shuttleSrb() { return buildShuttleSrb(); },
  protonFairing() { return buildProtonFairing(); },
  protonStage3() { return buildProtonStage3(); },
  protonStage2() { return buildProtonStage2(); },
  protonStage1() { return buildProtonStage1(); },
  d4hFairing() { return buildD4hFairing(); },
  d4hStage2() { return buildD4hStage2(); },
  d4hStage1() { return buildD4hStage1(); },
  titan4Fairing() { return buildTitan4Fairing(); },
  titan4Stage2() { return buildTitan4Stage2(); },
  titan4Stage1() { return buildTitan4Stage1(); },
  starshipNose() { return buildStarshipNose(); },
  starshipShip() { return buildStarshipShip(); },
  starshipBooster() { return buildStarshipBooster(); },
  ufoSaucer() { return buildUfoSaucer(); },
  gunAcid() { return buildGunAcid(); },
};

function tank(h, mat, decal) {
  const g = new THREE.Group();
  const body = mesh(scaleUV(new THREE.CylinderGeometry(R, R, h - 0.24, 72, 1, true), 2, (h - 0.24) / 2.5), mat, 0, h / 2, 0);
  g.add(body);
  for (const y of [0.12, h - 0.12]) {
    g.add(mesh(new THREE.CylinderGeometry(R + 0.018, R + 0.018, 0.24, 72), MAT.metal, 0, y, 0));
  }
  // cable raceway
  const race = mesh(new THREE.BoxGeometry(0.16, h - 0.4, 0.09), MAT.metal, 0, h / 2, 0);
  race.position.set(Math.sin(2.4) * (R + 0.04), h / 2, Math.cos(2.4) * (R + 0.04));
  race.rotation.y = 2.4;
  g.add(race);
  // feed line
  const fl = mesh(new THREE.CylinderGeometry(0.07, 0.07, h - 0.3, 12), MAT.metal);
  fl.position.set(Math.sin(-2.2) * (R + 0.09), h / 2, Math.cos(-2.2) * (R + 0.09));
  g.add(fl);
  if (decal && h > 2) {
    const dh = Math.min(2.2, h * 0.7);
    const dg = new THREE.CylinderGeometry(R + 0.022, R + 0.022, dh, 24, 1, true, -0.45, 0.9);
    g.add(mesh(dg, MAT.decal, 0, h / 2, 0));
  }
  return g;
}

// ---------------------------------------------------------------- parachutes
let chuteTex = null;
function chuteTexture() {
  if (chuteTex) return chuteTex;
  const W = 1024, H = 256, gores = 16;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  for (let i = 0; i < gores; i++) {
    x.fillStyle = i % 2 ? '#f3efe6' : '#e2561d';
    x.fillRect(i * W / gores, 0, W / gores + 1, H);
  }
  // radial seams / reinforcement tapes
  x.fillStyle = 'rgba(40,30,20,0.35)';
  for (let i = 0; i <= gores; i++) x.fillRect(i * W / gores - 1.5, 0, 3, H);
  // horizontal bands (v=0 rim -> v=1 vent) – canvas is flipped by the texture
  x.fillStyle = 'rgba(40,30,20,0.22)';
  for (const v of [0.04, 0.3, 0.55, 0.8]) x.fillRect(0, H - v * H - 2, W, 4);
  // vent band
  x.fillStyle = '#e2561d';
  x.fillRect(0, 0, W, H * 0.06);
  chuteTex = new THREE.CanvasTexture(c);
  chuteTex.colorSpace = THREE.SRGBColorSpace;
  chuteTex.anisotropy = 8;
  return chuteTex;
}

const CHUTE_R = 4.6;      // canopy radius (≈9.2 m diameter)
const CHUTE_GORES = 16;

function canopyGeometry() {
  const pts = [];
  const a = CHUTE_R, b = 2.9, th0 = 1.72, th1 = 0.085, N = 28;
  const y0 = b * Math.cos(th0);
  for (let i = 0; i <= N; i++) {
    const th = th0 + (th1 - th0) * (i / N);
    pts.push(new THREE.Vector2(a * Math.sin(th), b * Math.cos(th) - y0));
  }
  const geo = new THREE.LatheGeometry(pts, CHUTE_GORES * 4);
  // scalloped gores: pull the radial seams in slightly
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const phi = Math.atan2(x, z);
    const f = 1 - 0.045 * (1 - Math.abs(Math.sin(phi * CHUTE_GORES / 2)));
    p.setX(i, x * f); p.setZ(i, z * f);
  }
  geo.computeVertexNormals();
  return geo;
}

function addParachutes(g, attachY) {
  const chutes = new THREE.Group();
  chutes.name = 'parachutes';
  chutes.visible = false;
  g.add(chutes);
  const canopyMat = new THREE.MeshStandardMaterial({ map: chuteTexture(), side: THREE.DoubleSide, roughness: 0.82, metalness: 0 });
  const lineMat = new THREE.LineBasicMaterial({ color: 0xe8e2d4, transparent: true, opacity: 0.9 });
  const domeGeo = canopyGeometry();
  const riserGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 6).translate(0, 0.5, 0);
  const items = [];
  for (let k = 0; k < 3; k++) {
    const az = k * Math.PI * 2 / 3 + Math.PI / 6;
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(az) * 0.16, attachY, Math.sin(az) * 0.16);
    chutes.add(pivot);
    const riser = new THREE.Mesh(riserGeo, MAT.white);
    pivot.add(riser);
    const canopy = new THREE.Group();
    const dome = new THREE.Mesh(domeGeo, canopyMat);
    dome.rotation.y = k * 0.7;
    canopy.add(dome);
    pivot.add(canopy);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CHUTE_GORES * 2 * 3), 3));
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    lines.frustumCulled = false;
    pivot.add(lines);
    items.push({ az, pivot, riser, canopy, dome, lines });
  }
  // packed chutes: forward bay cover with 3 deployment bags underneath
  const packs = new THREE.Group();
  packs.name = 'chutePack';
  const coverPts = [new THREE.Vector2(0.575, 2.29), new THREE.Vector2(0.54, 2.5), new THREE.Vector2(0.47, 2.66), new THREE.Vector2(0.3, 2.75), new THREE.Vector2(0.001, 2.77)];
  packs.add(mesh(new THREE.LatheGeometry(coverPts, 48), MAT.silver));
  const bagMat = new THREE.MeshStandardMaterial({ color: 0xc8692e, roughness: 0.95 });
  for (let k = 0; k < 3; k++) {
    const az = k * Math.PI * 2 / 3 + Math.PI / 6;
    const bag = mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), bagMat, Math.cos(az) * 0.3, 2.68, Math.sin(az) * 0.3);
    bag.scale.set(1, 0.6, 1);
    packs.add(bag);
  }
  g.add(packs);
  g.userData.chutes = chutes;
  g.userData.chutePack = packs;

  const v = new THREE.Vector3();
  g.userData.setChute = (t) => {
    t = Math.max(0, Math.min(1, t || 0));
    if (t <= 0) { chutes.visible = false; packs.visible = true; return; }
    chutes.visible = true; packs.visible = false;
    let w, elong, D, tilt;
    if (t < 0.35) { // streaming / reefed
      const k = t / 0.35;
      w = 0.05 + 0.1 * k; elong = 2.4 - 0.4 * k; D = 16.5 * (0.5 + 0.5 * k); tilt = 0.04 + 0.06 * k;
    } else {        // disreef & inflate
      const u = (t - 0.35) / 0.65, e = 1 - Math.pow(1 - u, 3);
      w = 0.15 + 0.85 * e; elong = 2.0 - 1.0 * e; D = 16.5; tilt = 0.1 + 0.2 * e;
    }
    const riserL = Math.min(3.2, D * 0.2);
    for (const it of items) {
      const dir = v.set(Math.sin(tilt) * Math.cos(it.az), Math.cos(tilt), Math.sin(tilt) * Math.sin(it.az));
      it.pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      it.riser.scale.y = riserL;
      it.canopy.position.y = D;
      it.canopy.scale.set(w, elong, w);
      const pa = it.lines.geometry.attributes.position;
      for (let i = 0; i < CHUTE_GORES; i++) {
        const phi = (i / CHUTE_GORES) * Math.PI * 2 + it.dome.rotation.y;
        const rr = CHUTE_R * 0.955 * w;
        pa.setXYZ(i * 2, 0, riserL, 0);
        pa.setXYZ(i * 2 + 1, Math.sin(phi) * rr, D + 0.02, Math.cos(phi) * rr);
      }
      pa.needsUpdate = true;
    }
  };
}

// ---------------------------------------------------------------- docking port (NDS-style)
function buildDockPort() {
  const g = new THREE.Group();
  const H = PARTS.dockPort.height;
  // neck reaching down into the part below (covers the capsule's tower seat)
  g.add(mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.92, 40, 1, true), MAT.white, 0, -0.46, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.66, 0.62, 0.12, 64), MAT.darkMetal, 0, 0.06, 0));
  const adPts = [new THREE.Vector2(0.64, 0.12), new THREE.Vector2(0.63, 0.24), new THREE.Vector2(0.59, 0.34), new THREE.Vector2(0.58, 0.36)];
  g.add(mesh(new THREE.LatheGeometry(adPts, 64), MAT.white));
  // main ring body + inner tunnel
  g.add(mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.2, 64, 1, true), MAT.silver, 0, 0.46, 0));
  const tunnel = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.24, 48, 1, true), MAT.darkMetal, 0, 0.46, 0);
  tunnel.material = MAT.darkMetal;
  g.add(tunnel);
  const top = mesh(new THREE.RingGeometry(0.42, 0.58, 64, 1).rotateX(-Math.PI / 2), MAT.metal, 0, 0.56, 0);
  g.add(top);
  // hatch with handle
  g.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 48), MAT.white, 0, 0.38, 0));
  const handle = mesh(new THREE.TorusGeometry(0.12, 0.015, 8, 24, Math.PI), MAT.metal, 0, 0.4, 0);
  g.add(handle);
  // soft-capture seal
  g.add(mesh(new THREE.TorusGeometry(0.5, 0.022, 10, 72).rotateX(Math.PI / 2), MAT.black, 0, 0.565, 0));
  // 3 petal guides leaning inward
  const ps = new THREE.Shape();
  ps.moveTo(-0.22, 0); ps.lineTo(0.22, 0); ps.lineTo(0.07, 0.27); ps.quadraticCurveTo(0, 0.3, -0.07, 0.27); ps.closePath();
  const petalGeo = new THREE.ExtrudeGeometry(ps, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 });
  petalGeo.translate(0, 0, -0.015);
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    const p = mesh(petalGeo, MAT.metal, Math.sin(a) * 0.5, 0.555, Math.cos(a) * 0.5);
    p.rotation.set(-0.42, a, 0, 'YXZ');
    g.add(p);
  }
  // hooks / latches around the outer ring
  const latchGeo = new THREE.BoxGeometry(0.07, 0.1, 0.06);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.13;
    const l = mesh(latchGeo, MAT.darkMetal, Math.sin(a) * 0.6, 0.47, Math.cos(a) * 0.6);
    l.rotation.y = a;
    g.add(l);
  }
  // target / alignment lights
  const lightMats = [
    new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x33ff88, emissiveIntensity: 6 }),
    new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 6 }),
  ];
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + Math.PI / 3;
    g.add(mesh(new THREE.SphereGeometry(0.025, 10, 8), lightMats[i % 2], Math.sin(a) * 0.61, 0.3, Math.cos(a) * 0.61));
  }
  // docking target cross plate
  const tgt = mesh(new THREE.BoxGeometry(0.18, 0.18, 0.02), MAT.black, 0, 0.24, 0.62);
  g.add(tgt);
  g.add(mesh(new THREE.BoxGeometry(0.14, 0.02, 0.025), MAT.white, 0, 0.24, 0.63));
  g.add(mesh(new THREE.BoxGeometry(0.02, 0.14, 0.025), MAT.white, 0, 0.24, 0.63));
  const port = new THREE.Object3D();
  port.name = 'dockPort';
  port.position.set(0, H, 0);
  g.add(port);
  g.userData.port = port;
  return g;
}

// ---------------------------------------------------------------- 9-engine octaweb
function buildOctaweb() {
  const g = new THREE.Group();
  const H = PARTS.engReuse.height;
  const shieldY = 1.3;
  const len = 1.2, rt = 0.095, re = 0.3, ringR = 0.86;
  const pos = [[0, 0]];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; pos.push([Math.cos(a) * ringR, Math.sin(a) * ringR]); }
  // thrust plate + skirt
  g.add(mesh(new THREE.CylinderGeometry(R, R, 0.26, 72), MAT.darkMetal, 0, H - 0.13, 0));
  g.add(mesh(scaleUV(new THREE.CylinderGeometry(R + 0.01, R + 0.03, H - 0.26 - shieldY, 72, 1, true), 2, 0.6), MAT.engineDark, 0, shieldY + (H - 0.26 - shieldY) / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(R + 0.045, R + 0.045, 0.1, 72, 1, true), MAT.metal, 0, shieldY + 0.02, 0));
  g.add(mesh(new THREE.CylinderGeometry(R + 0.025, R + 0.025, 0.06, 72, 1, true), MAT.metal, 0, H - 0.29, 0));
  // stringers + access panels on the skirt
  const sGeo = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const b = new THREE.BoxGeometry(0.05, H - 0.36 - shieldY, 0.03);
    b.translate(0, 0, R + 0.03);
    b.rotateY(a);
    b.translate(0, shieldY + (H - 0.26 - shieldY) / 2, 0);
    sGeo.push(b);
  }
  g.add(mesh(mergeGeometries(sGeo), MAT.darkMetal));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4 + Math.PI / 16;
    const p = mesh(new THREE.BoxGeometry(0.28, 0.4, 0.02), MAT.black, Math.sin(a) * (R + 0.04), shieldY + 0.55, Math.cos(a) * (R + 0.04));
    p.rotation.y = a;
    g.add(p);
  }
  // heat shield plate with engine cut-outs
  const sh = new THREE.Shape();
  sh.absarc(0, 0, R + 0.03, 0, Math.PI * 2, false);
  for (const [x, z] of pos) { const hp = new THREE.Path(); hp.absarc(x, -z, 0.17, 0, Math.PI * 2, true); sh.holes.push(hp); }
  const shGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: false, curveSegments: 32 });
  shGeo.rotateX(-Math.PI / 2);
  g.add(mesh(shGeo, MAT.heatShield, 0, shieldY - 0.08, 0));
  // engines
  const bootGeo = new THREE.CylinderGeometry(0.16, 0.12, shieldY - len + 0.02, 20, 1, true);
  const ringGeo = new THREE.TorusGeometry(0.135, 0.018, 6, 20).rotateX(Math.PI / 2);
  const lipGeo = new THREE.TorusGeometry(re, 0.014, 6, 40).rotateX(Math.PI / 2);
  const bandGeo = new THREE.TorusGeometry(re * 0.78, 0.01, 6, 36).rotateX(Math.PI / 2);
  const ggGeo = new THREE.CylinderGeometry(0.028, 0.034, 0.7, 8);
  pos.forEach(([x, z], i) => {
    const m = bellMaterial(true);
    const bell = mesh(bellGeometry(rt, re, len, 40), m, x, 0, z);
    g.add(bell);
    g.add(mesh(lipGeo, MAT.metal, x, 0.005, z));
    g.add(mesh(bandGeo, MAT.darkMetal, x, len * 0.16, z));
    g.add(mesh(new THREE.CylinderGeometry(rt * 1.35, rt * 1.05, 0.14, 20), MAT.darkMetal, x, len + 0.02, z));
    g.add(mesh(bootGeo, MAT.black, x, len + (shieldY - len) / 2, z));
    g.add(mesh(ringGeo, MAT.darkMetal, x, len + (shieldY - len) * 0.5, z));
    if (i > 0) {
      // gas-generator exhaust, outboard of each outer engine
      const a = Math.atan2(z, x) + 0.3;
      const gg = mesh(ggGeo, MAT.engineDark, Math.cos(a) * (ringR + 0.2), shieldY - 0.4, Math.sin(a) * (ringR + 0.2));
      g.add(gg);
    }
    addNozzle(g, x, z, re, [m]);
  });
  g.userData.centerNozzle = g.userData.nozzles[0];
  return g;
}

// ---------------------------------------------------------------- landing leg (one per placement)
const LEG_FOOT_Y = -3.8, LEG_FOOT_R = 4.2;
function buildLeg() {
  const g = new THREE.Group();
  const HX = R + 0.22;               // hinge radius
  const PAD_T = 0.16, PAD_DROP = 0.16;
  const tipX = LEG_FOOT_R - HX, tipY = LEG_FOOT_Y + PAD_DROP + PAD_T / 2;
  const L = Math.hypot(tipX, tipY);
  const phiD = Math.atan2(tipX, tipY); // angle swept from 'up' to deployed
  // body-mounted hinge clevis + strut bracket
  for (const z of [-0.33, 0.33]) g.add(mesh(new THREE.BoxGeometry(0.26, 0.34, 0.07), MAT.darkMetal, R + 0.11, 0.02, z));
  g.add(mesh(new THREE.BoxGeometry(0.1, 0.5, 0.8), MAT.darkMetal, R + 0.03, 0.12, 0));
  const pin = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.76, 12).rotateX(Math.PI / 2), MAT.metal, HX, 0, 0);
  g.add(pin);
  const SA_Y = 1.0;
  g.add(mesh(new THREE.BoxGeometry(0.1, 0.24, 0.22), MAT.darkMetal, R + 0.04, SA_Y, 0));

  const pivot = new THREE.Group();
  pivot.position.set(HX, 0, 0);
  g.add(pivot);
  // carbon A-frame: tapered panel with two lightening cut-outs
  const w = (y) => 0.32 + (0.1 - 0.32) * (y + 0.12) / (L + 0.12);
  const s = new THREE.Shape();
  s.moveTo(-0.32, -0.12); s.lineTo(0.32, -0.12); s.lineTo(0.1, L); s.lineTo(-0.1, L); s.closePath();
  const hole = (y0, y1) => {
    const h = new THREE.Path();
    const i = 0.075;
    h.moveTo(-w(y0) + i, y0); h.lineTo(-w(y1) + i, y1); h.lineTo(w(y1) - i, y1); h.lineTo(w(y0) - i, y0); h.closePath();
    s.holes.push(h);
  };
  hole(0.28, L * 0.46);
  hole(L * 0.58, L * 0.84);
  const legGeo = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 });
  legGeo.rotateY(Math.PI / 2);
  legGeo.translate(-0.06, 0, 0);
  pivot.add(mesh(legGeo, MAT.carbon));
  // hinge lugs on the leg
  pivot.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.56, 16).rotateX(Math.PI / 2), MAT.carbon, 0, 0, 0));
  // metal edge rails along the outer face
  const railGeo = new THREE.BoxGeometry(0.025, L * 0.9, 0.03);
  for (const sgn of [-1, 1]) {
    const yM = L * 0.47, wz = w(yM) - 0.02;
    const r = mesh(railGeo, MAT.metal, 0.075, yM, sgn * wz);
    r.rotation.x = sgn * Math.atan((0.32 - 0.1) / (L + 0.12));
    pivot.add(r);
  }
  // strut fitting + tip fitting
  const PY = L * 0.52;
  pivot.add(mesh(new THREE.BoxGeometry(0.12, 0.2, 0.34), MAT.darkMetal, -0.06, PY, 0));
  pivot.add(mesh(new THREE.BoxGeometry(0.16, 0.22, 0.22), MAT.darkMetal, 0, L - 0.05, 0));
  // foot: crush-core + pad, kept level when deployed
  const padG = new THREE.Group();
  padG.position.set(0, L, 0);
  pivot.add(padG);
  padG.add(mesh(new THREE.CylinderGeometry(0.075, 0.075, PAD_DROP, 12), MAT.silver, 0, -PAD_DROP / 2, 0));
  padG.add(mesh(new THREE.CylinderGeometry(0.4, 0.46, PAD_T, 32), MAT.darkMetal, 0, -PAD_DROP, 0));
  padG.add(mesh(new THREE.TorusGeometry(0.4, 0.02, 6, 32).rotateX(Math.PI / 2), MAT.metal, 0, -PAD_DROP + PAD_T / 2, 0));
  // telescoping strut (body bracket -> leg fitting)
  const A = new THREE.Vector3(R + 0.06, SA_Y, 0);
  const Pl = new THREE.Vector2(-0.12, PY);
  const legPoint = (phi, out) => out.set(HX + Pl.x * Math.cos(phi) + Pl.y * Math.sin(phi), -Pl.x * Math.sin(phi) + Pl.y * Math.cos(phi), 0);
  const tmp = new THREE.Vector3();
  let dMin = Infinity, dMax = 0;
  for (let i = 0; i <= 20; i++) { const d = legPoint(phiD * i / 20, tmp).distanceTo(A); dMin = Math.min(dMin, d); dMax = Math.max(dMax, d); }
  const secL = dMin;
  const n = Math.max(2, Math.ceil((dMax - secL) / (secL * 0.8)) + 1);
  const secs = [];
  for (let i = 0; i < n; i++) {
    const r = Math.max(0.024, 0.06 - i * 0.012);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, secL, 14).translate(0, secL / 2, 0), i === 0 ? MAT.darkMetal : MAT.silver);
    g.add(c);
    secs.push(c);
  }
  const Y = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(), P = new THREE.Vector3();
  g.userData.footY = LEG_FOOT_Y;
  g.userData.footR = LEG_FOOT_R;
  g.userData.deploy = 0;
  g.userData.setDeploy = (t) => {
    t = Math.max(0, Math.min(1, t || 0));
    g.userData.deploy = t;
    const phi = phiD * t;
    pivot.rotation.z = -phi;
    padG.rotation.z = Math.PI / 2 + (phiD - Math.PI / 2) * t;
    legPoint(phi, P);
    const d = P.distanceTo(A);
    dir.subVectors(P, A).normalize();
    for (let i = 0; i < n; i++) {
      const off = d > secL ? i * (d - secL) / (n - 1) : 0;
      secs[i].position.copy(A).addScaledVector(dir, off);
      secs[i].quaternion.setFromUnitVectors(Y, dir);
      secs[i].scale.y = d > secL ? 1 : d / secL;
    }
  };
  g.userData.setDeploy(0);
  return g;
}

// ---------------------------------------------------------------- lattice grid fin (one per placement)
function buildGridFin() {
  const g = new THREE.Group();
  const HX = R + 0.1;
  // actuator housing on the body
  g.add(mesh(new THREE.BoxGeometry(0.14, 0.62, 0.5), MAT.darkMetal, R + 0.03, -0.12, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.62, 12).rotateX(Math.PI / 2), MAT.metal, HX, 0, 0));
  const pivot = new THREE.Group();
  pivot.position.set(HX, 0, 0);
  g.add(pivot);
  const W = 1.0, LEN = 1.2, D = 0.15, y0 = 0.24, x0 = 0.04 + D / 2;
  const geos = [];
  // diagonal crossed blades clipped to the frame (u = across / z, v = along / y)
  const pitch = 0.13, t = 0.012;
  const sq = Math.SQRT2;
  for (const sgn of [1, -1]) {
    for (let c = -W - LEN; c <= W + LEN; c += pitch * sq) {
      // line v = sgn*u + c
      let u0, u1;
      if (sgn > 0) { u0 = Math.max(-W / 2, -c); u1 = Math.min(W / 2, LEN - c); } else { u0 = Math.max(-W / 2, c - LEN); u1 = Math.min(W / 2, c); }
      if (u1 - u0 < 0.03) continue;
      const um = (u0 + u1) / 2, vm = sgn * um + c, l = (u1 - u0) * sq;
      const b = new THREE.BoxGeometry(D, l, t);
      b.rotateX(sgn * Math.PI / 4);
      b.translate(x0, y0 + vm, um);
      geos.push(b);
    }
  }
  const frameT = 0.045;
  const fr = (sx, sy, sz, x, y, z) => { const b = new THREE.BoxGeometry(sx, sy, sz); b.translate(x, y, z); geos.push(b); };
  fr(D + 0.01, LEN + frameT, frameT, x0, y0 + LEN / 2, -W / 2);
  fr(D + 0.01, LEN + frameT, frameT, x0, y0 + LEN / 2, W / 2);
  fr(D + 0.01, frameT, W + frameT, x0, y0, 0);
  fr(D + 0.01, frameT, W + frameT, x0, y0 + LEN, 0);
  const lattice = mesh(mergeGeometries(geos), MAT.titanium);
  pivot.add(lattice);
  // root arm + hinge shaft fitting
  const arm = new THREE.Shape();
  arm.moveTo(-0.32, y0); arm.lineTo(0.32, y0); arm.lineTo(0.09, 0); arm.lineTo(-0.09, 0); arm.closePath();
  const armGeo = new THREE.ExtrudeGeometry(arm, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 });
  armGeo.rotateY(Math.PI / 2);
  armGeo.translate(x0 - 0.035, 0, 0);
  pivot.add(mesh(armGeo, MAT.titanium));
  pivot.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.24, 14).rotateX(Math.PI / 2), MAT.darkMetal, 0.03, 0, 0));
  g.userData.deploy = 0;
  g.userData.setDeploy = (k) => {
    k = Math.max(0, Math.min(1, k || 0));
    g.userData.deploy = k;
    pivot.rotation.z = -k * Math.PI / 2;
  };
  g.userData.setDeploy(0);
  return g;
}

// ---------------------------------------------------------------- rover & boat builders
function buildCockpitRover() {
  const g = new THREE.Group();
  const H = PARTS.cockpitRover.height;
  // Cabin main body (aerodynamic explorer cab)
  const bodyGeo = new THREE.BoxGeometry(2.1, H - 0.2, 1.9);
  g.add(mesh(bodyGeo, MAT.white, 0, H / 2, 0));

  // Forward nose wedge
  const noseShape = new THREE.Shape();
  noseShape.moveTo(-1.05, 0);
  noseShape.lineTo(1.05, 0);
  noseShape.lineTo(0.85, 0.75);
  noseShape.lineTo(-0.85, 0.75);
  noseShape.closePath();
  const noseGeo = new THREE.ExtrudeGeometry(noseShape, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04 });
  noseGeo.rotateX(Math.PI / 2);
  const noseM = mesh(noseGeo, MAT.darkMetal, 0, 0.75, 0.95);
  g.add(noseM);

  // Large panoramic windshield (tilted glass dome)
  const winGeo = new THREE.CylinderGeometry(0.92, 1.02, 0.68, 32, 1, false, -Math.PI * 0.45, Math.PI * 0.9);
  const win = mesh(winGeo, MAT.glass, 0, H * 0.58, 0.1);
  win.rotation.x = 0.22;
  g.add(win);

  // Interior seats & dashboard
  const seatGeo = new THREE.BoxGeometry(0.46, 0.55, 0.46);
  g.add(mesh(seatGeo, MAT.darkMetal, -0.38, 0.48, 0.08));
  g.add(mesh(seatGeo, MAT.darkMetal, 0.38, 0.48, 0.08));

  // Roof tubular bars
  const barGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.7, 8);
  for (const sgn of [-1, 1]) {
    const bar = mesh(barGeo, MAT.darkMetal, sgn * 1.0, H - 0.05, 0);
    bar.rotation.x = Math.PI / 2;
    g.add(bar);
  }

  // Roof comm antenna dish
  const mast = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8), MAT.metal, 0.65, H + 0.22, -0.55);
  g.add(mast);
  const dish = mesh(new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), MAT.silver, 0.65, H + 0.46, -0.55);
  dish.rotation.x = -0.5;
  dish.material.side = THREE.DoubleSide;
  g.add(dish);

  // Dual high-power LED headlights
  const lampGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.08, 16).rotateX(Math.PI / 2);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xcfe8ff, emissiveIntensity: 3 });
  for (const sgn of [-1, 1]) {
    g.add(mesh(lampGeo, lampMat, sgn * 0.72, 0.42, 1.0));
    g.add(mesh(new THREE.TorusGeometry(0.13, 0.02, 8, 20), MAT.metal, sgn * 0.72, 0.42, 1.01));
  }

  // Side accents
  const decalGeo = new THREE.BoxGeometry(0.05, 0.3, 1.3);
  for (const sgn of [-1, 1]) g.add(mesh(decalGeo, MAT.orange, sgn * 1.06, H * 0.5, 0));

  return g;
}

function buildChassisRover() {
  const g = new THREE.Group();
  const H = PARTS.chassisRover.height;
  // Central core frame
  const frameGeo = new THREE.BoxGeometry(2.2, H - 0.1, 2.1);
  g.add(mesh(frameGeo, MAT.darkMetal, 0, H / 2, 0));

  // Skid plate underneath
  const skidGeo = new THREE.BoxGeometry(2.1, 0.08, 2.2);
  g.add(mesh(skidGeo, MAT.titanium, 0, 0.04, 0));

  // High capacity battery cells on flanks
  const battGeo = new THREE.BoxGeometry(0.32, 0.62, 1.6);
  for (const sgn of [-1, 1]) {
    g.add(mesh(battGeo, MAT.orange, sgn * 1.15, H / 2, 0));
    const indGeo = new THREE.BoxGeometry(0.02, 0.1, 1.1);
    const indMat = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 2 });
    g.add(mesh(indGeo, indMat, sgn * 1.32, H / 2, 0));
  }

  // Suspension crossbars
  const beamGeo = new THREE.CylinderGeometry(0.07, 0.07, 2.6, 12).rotateZ(Math.PI / 2);
  for (const z of [-0.65, 0.65]) g.add(mesh(beamGeo, MAT.metal, 0, 0.35, z));

  // Rear hazard stripes
  const hzGeo = new THREE.PlaneGeometry(1.5, 0.28);
  const hzM = mesh(hzGeo, new THREE.MeshStandardMaterial({ map: TX.hazardMap(), roughness: 0.5 }), 0, H * 0.6, -1.06);
  hzM.rotation.y = Math.PI;
  g.add(hzM);

  return g;
}

function buildWheelsRover() {
  const g = new THREE.Group();
  // Suspension arm extending from chassis outwards
  const armGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.52, 12).rotateZ(Math.PI / 2);
  g.add(mesh(armGeo, MAT.darkMetal, 0.24, 0, 0));

  // Shock absorber / spring
  const springGeo = new THREE.TorusGeometry(0.075, 0.022, 8, 24).rotateX(Math.PI / 2);
  for (let y = -0.14; y <= 0.14; y += 0.07) g.add(mesh(springGeo, MAT.orange, 0.22, y, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.48, 12), MAT.silver, 0.22, 0, 0));

  // Wheel hub & rotating wheel group
  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(0.5, 0, 0);
  g.add(wheelGroup);
  g.userData.wheelGroup = wheelGroup;

  // Off-road tire
  const tireRadius = 0.54, tireWidth = 0.36;
  const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 32, 1, false).rotateZ(Math.PI / 2);
  wheelGroup.add(mesh(tireGeo, MAT.rubber, 0, 0, 0));

  // Deep tire treads
  const treadGeo = new THREE.BoxGeometry(tireWidth * 0.9, 0.038, 0.08);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const tr = mesh(treadGeo, MAT.darkMetal, 0, Math.sin(a) * (tireRadius + 0.012), Math.cos(a) * (tireRadius + 0.012));
    tr.rotation.x = -a;
    wheelGroup.add(tr);
  }

  // Alloy rim & spokes
  const rimGeo = new THREE.CylinderGeometry(0.34, 0.34, tireWidth + 0.01, 24).rotateZ(Math.PI / 2);
  wheelGroup.add(mesh(rimGeo, MAT.metal, 0, 0, 0));

  // Hub cap & lug nuts
  const hubGeo = new THREE.CylinderGeometry(0.13, 0.13, tireWidth + 0.03, 16).rotateZ(Math.PI / 2);
  wheelGroup.add(mesh(hubGeo, MAT.titanium, 0, 0, 0));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const nut = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 6).rotateZ(Math.PI / 2), MAT.silver, tireWidth / 2 + 0.02, Math.sin(a) * 0.085, Math.cos(a) * 0.085);
    wheelGroup.add(nut);
  }

  return g;
}

function buildSolarRover() {
  const g = new THREE.Group();
  // Mounting bracket
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.24, 0.22), MAT.darkMetal, 0.07, 0, 0));
  // Pivot arm + actuator joint
  g.add(mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.44, 12).rotateZ(Math.PI / 2), MAT.metal, 0.28, 0, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.26, 12).rotateX(Math.PI / 2), MAT.silver, 0.34, 0, 0));

  // Tilted solar panel assembly (proper local group so frame and cells never clip)
  const panelGroup = new THREE.Group();
  panelGroup.position.set(0.76, 0.06, 0);
  panelGroup.rotation.z = -0.14;
  g.add(panelGroup);

  // Outer aluminum frame
  panelGroup.add(mesh(new THREE.BoxGeometry(0.84, 0.028, 1.32), MAT.silver, 0, 0, 0));
  panelGroup.add(mesh(new THREE.BoxGeometry(0.80, 0.032, 1.28), MAT.darkMetal, 0, 0, 0));

  // Photovoltaic cells (top face) with scaled UVs for crisp cell grid
  const cellGeo = scaleUV(new THREE.PlaneGeometry(0.76, 1.22), 1.5, 2.5);
  const cellTop = mesh(cellGeo, MAT.solar, 0, 0.019, 0);
  cellTop.rotation.x = -Math.PI / 2;
  panelGroup.add(cellTop);

  // Silver busbar divider strips across the top surface
  for (const z of [-0.3, 0, 0.3]) {
    panelGroup.add(mesh(new THREE.BoxGeometry(0.76, 0.006, 0.016), MAT.silver, 0, 0.02, z));
  }
  panelGroup.add(mesh(new THREE.BoxGeometry(0.018, 0.006, 1.22), MAT.silver, 0, 0.02, 0));

  // Gold kapton thermal foil backing (bottom face)
  const goldBack = mesh(cellGeo, MAT.gold, 0, -0.019, 0);
  goldBack.rotation.x = Math.PI / 2;
  panelGroup.add(goldBack);

  return g;
}

function buildSolarPanel() {
  const g = new THREE.Group();
  // Hull mounting bracket & motorized rotary gimbal (SADM)
  g.add(mesh(new THREE.BoxGeometry(0.18, 0.42, 0.38), MAT.darkMetal, 0.06, 0, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.24, 20).rotateZ(Math.PI / 2), MAT.titanium, 0.22, 0, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.36, 16).rotateZ(Math.PI / 2), MAT.silver, 0.38, 0, 0));

  // Yoke arms connecting gimbal to first solar panel segment
  for (const sgn of [-1, 1]) {
    const yoke = mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.48, 10), MAT.metal, 0.52, 0, sgn * 0.22);
    yoke.rotation.z = Math.PI / 2;
    yoke.rotation.y = sgn * 0.42;
    g.add(yoke);
  }

  // Articulated 4-segment solar array wing tilted slightly so it is clearly visible from all angles
  const wing = new THREE.Group();
  wing.position.set(0.68, 0, 0);
  wing.rotation.x = 0.38;
  g.add(wing);

  const segCount = 4;
  const segW = 0.72; // along +X
  const segH = 1.48; // span along Z
  const gap = 0.05;
  const cellGeo = scaleUV(new THREE.PlaneGeometry(segW - 0.06, segH - 0.08), 1.5, 3.0);

  for (let i = 0; i < segCount; i++) {
    const cx = i * (segW + gap) + segW / 2;
    // Structural carbon/silver frame
    wing.add(mesh(new THREE.BoxGeometry(segW, 0.028, segH), MAT.silver, cx, 0, 0));
    wing.add(mesh(new THREE.BoxGeometry(segW - 0.03, 0.032, segH - 0.03), MAT.darkMetal, cx, 0, 0));

    // Front/top photovoltaic wafer array
    const frontCell = mesh(cellGeo, MAT.solar, cx, 0.019, 0);
    frontCell.rotation.x = -Math.PI / 2;
    wing.add(frontCell);

    // Back/bottom photovoltaic wafer array (bifacial solar array + gold spine)
    const backCell = mesh(cellGeo, MAT.solar, cx, -0.019, 0);
    backCell.rotation.x = Math.PI / 2;
    wing.add(backCell);

    // Silver interconnect busbars on panel face
    for (const z of [-0.36, 0, 0.36]) {
      wing.add(mesh(new THREE.BoxGeometry(segW - 0.06, 0.006, 0.014), MAT.silver, cx, 0.02, z));
    }

    // Gold kapton thermal strip along central spine on underside
    wing.add(mesh(new THREE.BoxGeometry(segW - 0.04, 0.008, 0.22), MAT.gold, cx, -0.018, 0));

    // Inter-panel hinges
    if (i > 0) {
      const hx = i * (segW + gap) - gap / 2;
      for (const hz of [-0.48, 0.48]) {
        wing.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.14, 10).rotateX(Math.PI / 2), MAT.silver, hx, 0, hz));
      }
    }
  }

  // Extendable deployment truss boom along the back
  const totalLen = segCount * (segW + gap);
  wing.add(mesh(new THREE.CylinderGeometry(0.028, 0.028, totalLen, 12).rotateZ(Math.PI / 2), MAT.titanium, totalLen / 2, -0.045, 0));
  // End cap bar with gold tip accent
  wing.add(mesh(new THREE.BoxGeometry(0.045, 0.045, segH + 0.04), MAT.gold, totalLen - 0.01, 0, 0));

  return g;
}

function buildGunLaser() {
  const g = new THREE.Group();
  const rubyMat = new THREE.MeshStandardMaterial({
    color: 0xff1744,
    emissive: new THREE.Color(0xff0055),
    emissiveIntensity: 2.4,
    roughness: 0.15,
    metalness: 0.3,
  });
  const cyanMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: new THREE.Color(0x00b8d4),
    emissiveIntensity: 1.9,
    roughness: 0.2,
    metalness: 0.3,
  });

  // Armored side sponson pylon attaching to rocket hull
  g.add(mesh(new THREE.BoxGeometry(0.22, 0.56, 0.48), MAT.darkMetal, 0.08, 0, 0));
  g.add(mesh(new THREE.BoxGeometry(0.46, 0.28, 0.34), MAT.carbon, 0.36, -0.06, 0));
  // Glowing power conduit cables along pylon
  for (const sz of [-0.14, 0.14]) {
    g.add(mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.48, 12).rotateZ(Math.PI / 2), rubyMat, 0.34, 0.06, sz));
  }
  // Turret rotary pedestal base
  g.add(mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.18, 24), MAT.titanium, 0.62, -0.04, 0));
  g.add(mesh(new THREE.TorusGeometry(0.25, 0.025, 10, 28).rotateX(Math.PI / 2), cyanMat, 0.62, 0.05, 0));

  // Articulated 360-degree laser turret head
  const turret = new THREE.Group();
  turret.position.set(0.62, 0.14, 0);
  g.add(turret);

  // Armored turret housing + glowing ruby energy core
  turret.add(mesh(new THREE.BoxGeometry(0.38, 0.34, 0.44), MAT.darkMetal, 0, 0.08, 0));
  turret.add(mesh(new THREE.BoxGeometry(0.40, 0.16, 0.32), MAT.silver, 0, 0.14, 0));
  turret.add(mesh(new THREE.SphereGeometry(0.14, 18, 14), rubyMat, 0.06, 0.12, 0));

  // Twin high-energy plasma-laser barrels pointing forward (+Y by default)
  for (const sz of [-0.12, 0.12]) {
    turret.add(mesh(new THREE.CylinderGeometry(0.052, 0.064, 0.95, 18), MAT.titanium, 0.02, 0.62, sz));
    turret.add(mesh(new THREE.CylinderGeometry(0.036, 0.036, 1.12, 16), MAT.carbon, 0.02, 0.72, sz));
    // Glowing cooling coils along barrels
    for (const cy of [0.46, 0.68, 0.90]) {
      turret.add(mesh(new THREE.TorusGeometry(0.058, 0.014, 8, 20).rotateX(Math.PI / 2), rubyMat, 0.02, cy, sz));
    }
    // Focusing emitter lens at tip
    turret.add(mesh(new THREE.CylinderGeometry(0.055, 0.042, 0.10, 18), rubyMat, 0.02, 1.28, sz));
  }

  const muzzle = new THREE.Object3D();
  muzzle.position.set(0.02, 1.34, 0);
  turret.add(muzzle);

  g.userData.turret = turret;
  g.userData.muzzle = muzzle;
  g.userData.weaponType = 'laser';
  return g;
}

function buildWaterCannon() {
  const g = new THREE.Group();
  const hydroMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: new THREE.Color(0x0284c7),
    emissiveIntensity: 2.0,
    roughness: 0.15,
    metalness: 0.25,
  });
  const gaugeMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: new THREE.Color(0xeab308),
    emissiveIntensity: 1.2,
    roughness: 0.25,
    metalness: 0.4,
  });

  // Heavy-duty reinforced hydro-bracket
  g.add(mesh(new THREE.BoxGeometry(0.24, 0.64, 0.56), MAT.darkMetal, 0.08, 0, 0));
  g.add(mesh(new THREE.BoxGeometry(0.52, 0.30, 0.44), MAT.blue, 0.36, -0.08, 0));

  // Twin 1,000,000 PSI ultra-pressure water accumulator tanks on sides
  for (const sz of [-0.22, 0.22]) {
    g.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.62, 20), MAT.blue, 0.34, 0.12, sz));
    g.add(mesh(new THREE.SphereGeometry(0.11, 16, 12), MAT.silver, 0.34, 0.43, sz));
    g.add(mesh(new THREE.SphereGeometry(0.11, 16, 12), MAT.silver, 0.34, -0.19, sz));
    // Glowing cyan water pressure sight-glass bands
    g.add(mesh(new THREE.CylinderGeometry(0.114, 0.114, 0.14, 20), hydroMat, 0.34, 0.12, sz));
  }

  // 1,000,000 PSI pressure manifold & brass gauge dial
  g.add(mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.20, 24), MAT.titanium, 0.66, -0.02, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 18).rotateZ(Math.PI / 2), gaugeMat, 0.78, 0.04, 0));

  // Rotating 1,000,000 PSI Hydro-Blaster Turret
  const turret = new THREE.Group();
  turret.position.set(0.66, 0.14, 0);
  g.add(turret);

  // Pump chamber & reinforced stainless steel barrel
  turret.add(mesh(new THREE.BoxGeometry(0.38, 0.36, 0.38), MAT.silver, 0, 0.08, 0));
  turret.add(mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.52, 24), MAT.titanium, 0, 0.46, 0));
  turret.add(mesh(new THREE.CylinderGeometry(0.075, 0.10, 0.68, 24), MAT.silver, 0, 0.92, 0));
  // High-pressure reinforcement collars & diamond orifice tip
  for (const cy of [0.40, 0.66, 0.94, 1.18]) {
    turret.add(mesh(new THREE.TorusGeometry(0.095, 0.018, 10, 24).rotateX(Math.PI / 2), MAT.copper, 0, cy, 0));
  }
  turret.add(mesh(new THREE.CylinderGeometry(0.055, 0.088, 0.16, 24), hydroMat, 0, 1.32, 0));

  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 1.42, 0);
  turret.add(muzzle);

  g.userData.turret = turret;
  g.userData.muzzle = muzzle;
  g.userData.weaponType = 'water';
  return g;
}

function buildGunAcid() {
  const g = new THREE.Group();
  const acidMat = new THREE.MeshStandardMaterial({
    color: 0x84cc16,
    emissive: new THREE.Color(0x4ade80),
    emissiveIntensity: 2.35,
    roughness: 0.14,
    metalness: 0.2,
  });
  const hazardMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: new THREE.Color(0xca8a04),
    emissiveIntensity: 0.85,
    roughness: 0.28,
    metalness: 0.35,
  });
  const glassTankMat = new THREE.MeshPhysicalMaterial({
    color: 0xbef264,
    emissive: new THREE.Color(0x22c55e),
    emissiveIntensity: 1.45,
    roughness: 0.08,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
  });

  // Heavy bio-hazard side bracket
  g.add(mesh(new THREE.BoxGeometry(0.24, 0.62, 0.54), MAT.darkMetal, 0.08, 0, 0));
  g.add(mesh(new THREE.BoxGeometry(0.50, 0.28, 0.42), MAT.carbon, 0.35, -0.07, 0));
  g.add(mesh(new THREE.BoxGeometry(0.46, 0.06, 0.44), hazardMat, 0.35, -0.07, 0));

  // Twin glowing toxic-green pressurized acid canisters on sides
  for (const sz of [-0.21, 0.21]) {
    g.add(mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.58, 20), glassTankMat, 0.34, 0.13, sz));
    g.add(mesh(new THREE.SphereGeometry(0.115, 16, 12), MAT.darkMetal, 0.34, 0.42, sz));
    g.add(mesh(new THREE.SphereGeometry(0.115, 16, 12), MAT.darkMetal, 0.34, -0.16, sz));
    for (const ry of [0.02, 0.24]) {
      g.add(mesh(new THREE.TorusGeometry(0.118, 0.015, 8, 20).rotateX(Math.PI / 2), hazardMat, 0.34, ry, sz));
    }
  }

  // Acid pump manifold & rotary turret pedestal
  g.add(mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.19, 24), MAT.titanium, 0.64, -0.03, 0));
  g.add(mesh(new THREE.TorusGeometry(0.26, 0.024, 10, 28).rotateX(Math.PI / 2), acidMat, 0.64, 0.06, 0));

  // Rotating 360-degree Corrosive Acid Sprayer Turret
  const turret = new THREE.Group();
  turret.position.set(0.64, 0.14, 0);
  g.add(turret);

  // Chemical reaction chamber & dual-stage corrosion-proof barrel
  turret.add(mesh(new THREE.BoxGeometry(0.38, 0.35, 0.40), MAT.darkMetal, 0, 0.08, 0));
  turret.add(mesh(new THREE.SphereGeometry(0.15, 18, 14), acidMat, 0.05, 0.13, 0));
  turret.add(mesh(new THREE.CylinderGeometry(0.105, 0.135, 0.50, 22), MAT.titanium, 0, 0.45, 0));
  turret.add(mesh(new THREE.CylinderGeometry(0.072, 0.095, 0.66, 22), MAT.darkMetal, 0, 0.90, 0));

  // Glowing neon-green acid injector rings & flared bio-acid atomizer nozzle
  for (const cy of [0.42, 0.68, 0.94, 1.16]) {
    turret.add(mesh(new THREE.TorusGeometry(0.092, 0.018, 10, 22).rotateX(Math.PI / 2), acidMat, 0, cy, 0));
  }
  turret.add(mesh(new THREE.CylinderGeometry(0.095, 0.065, 0.18, 22), acidMat, 0, 1.31, 0));

  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 1.42, 0);
  turret.add(muzzle);

  g.userData.turret = turret;
  g.userData.muzzle = muzzle;
  g.userData.weaponType = 'acid';
  return g;
}

function buildGunElectric() {
  const g = new THREE.Group();
  const voltMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: new THREE.Color(0x00e5ff),
    emissiveIntensity: 2.65,
    roughness: 0.12,
    metalness: 0.25,
  });
  const sparkGoldMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: new THREE.Color(0xfacc15),
    emissiveIntensity: 2.2,
    roughness: 0.16,
    metalness: 0.35,
  });
  const insulatorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.32,
    metalness: 0.65,
  });

  // Heavy high-voltage transformer side bracket
  g.add(mesh(new THREE.BoxGeometry(0.24, 0.64, 0.56), MAT.darkMetal, 0.08, 0, 0));
  g.add(mesh(new THREE.BoxGeometry(0.52, 0.30, 0.44), MAT.carbon, 0.35, -0.07, 0));

  // Twin 1,000,000 WATT supercapacitor banks with ribbed ceramic insulators & copper coils
  for (const sz of [-0.21, 0.21]) {
    g.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.58, 20), insulatorMat, 0.34, 0.14, sz));
    for (const ry of [-0.06, 0.08, 0.22, 0.36]) {
      g.add(mesh(new THREE.TorusGeometry(0.118, 0.018, 8, 22).rotateX(Math.PI / 2), MAT.copper, 0.34, ry, sz));
    }
    g.add(mesh(new THREE.SphereGeometry(0.115, 16, 12), voltMat, 0.34, 0.44, sz));
  }

  // Rotary Tesla pedestal & magnetic induction ring
  g.add(mesh(new THREE.CylinderGeometry(0.26, 0.29, 0.20, 24), MAT.titanium, 0.65, -0.03, 0));
  g.add(mesh(new THREE.TorusGeometry(0.27, 0.025, 10, 28).rotateX(Math.PI / 2), sparkGoldMat, 0.65, 0.06, 0));

  // Rotating 360-degree 1,000,000 WATT Tesla Arc Turret
  const turret = new THREE.Group();
  turret.position.set(0.65, 0.14, 0);
  g.add(turret);

  // High-voltage generator housing & copper primary winding
  turret.add(mesh(new THREE.BoxGeometry(0.40, 0.36, 0.42), MAT.darkMetal, 0, 0.08, 0));
  turret.add(mesh(new THREE.SphereGeometry(0.16, 18, 14), voltMat, 0.05, 0.14, 0));
  turret.add(mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.54, 24), MAT.copper, 0, 0.46, 0));
  turret.add(mesh(new THREE.CylinderGeometry(0.075, 0.10, 0.68, 24), insulatorMat, 0, 0.92, 0));

  // Tesla resonator toroid rings & golden-cyan corona discharge rings along the barrel
  for (let i = 0; i < 5; i++) {
    const cy = 0.38 + i * 0.19;
    const rMat = i % 2 === 0 ? voltMat : sparkGoldMat;
    turret.add(mesh(new THREE.TorusGeometry(0.105 - i * 0.004, 0.018, 10, 24).rotateX(Math.PI / 2), rMat, 0, cy, 0));
  }

  // Top Tesla crown toroid & 1,000,000 WATT arc emitter sphere
  turret.add(mesh(new THREE.TorusGeometry(0.13, 0.032, 12, 28).rotateX(Math.PI / 2), MAT.silver, 0, 1.28, 0));
  turret.add(mesh(new THREE.SphereGeometry(0.095, 18, 14), sparkGoldMat, 0, 1.38, 0));

  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 1.46, 0);
  turret.add(muzzle);

  g.userData.turret = turret;
  g.userData.muzzle = muzzle;
  g.userData.weaponType = 'electric';
  return g;
}

function buildCabinBoat() {
  const g = new THREE.Group();
  const H = PARTS.cabinBoat.height;
  const pts = [
    new THREE.Vector2(1.15, 0),
    new THREE.Vector2(1.08, 0.5),
    new THREE.Vector2(0.82, 1.25),
    new THREE.Vector2(0.38, H),
    new THREE.Vector2(0, H),
  ];
  const dome = scaleUV(new THREE.LatheGeometry(pts, 48), 2, 1);
  g.add(mesh(dome, MAT.white, 0, 0, 0));

  // Wraparound curved glass
  const glassGeo = new THREE.CylinderGeometry(0.88, 1.02, 0.62, 32, 1, false, -Math.PI * 0.42, Math.PI * 0.84);
  const glass = mesh(glassGeo, MAT.glass, 0, 0.82, 0.18);
  glass.rotation.x = 0.24;
  g.add(glass);

  // Radar arch
  const arch = new THREE.Group();
  const archColGeo = new THREE.CylinderGeometry(0.038, 0.038, 1.05, 8);
  for (const sgn of [-1, 1]) {
    const col = mesh(archColGeo, MAT.white, sgn * 0.82, 1.05, -0.58);
    col.rotation.z = -sgn * 0.18;
    arch.add(col);
  }
  arch.add(mesh(new THREE.BoxGeometry(1.5, 0.07, 0.22), MAT.white, 0, 1.55, -0.58));
  arch.add(mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 20), MAT.white, 0, 1.68, -0.58));
  g.add(arch);

  // Navigation lights: Port = Red, Starboard = Green
  g.add(mesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff1111, emissiveIntensity: 3 }), -0.95, 0.65, 0.38));
  g.add(mesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshStandardMaterial({ color: 0x00ff44, emissive: 0x00ff44, emissiveIntensity: 3 }), 0.95, 0.65, 0.38));

  return g;
}

function buildHullBoat() {
  const g = new THREE.Group();
  const H = PARTS.hullBoat.height;
  const pts = [];
  const N = 32;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const r = Math.max(0.12, R * (0.38 + 0.68 * Math.sin(t * Math.PI * 0.62)));
    pts.push(new THREE.Vector2(r, t * H));
  }
  const hullGeo = scaleUV(new THREE.LatheGeometry(pts, 48), 2, 2);
  g.add(mesh(hullGeo, MAT.white, 0, 0, 0));

  // Blue nautical waterline band
  const bandGeo = new THREE.CylinderGeometry(R * 0.94, R * 0.84, 0.35, 48, 1, true);
  g.add(mesh(bandGeo, MAT.blue, 0, 0.85, 0));

  // Rub rail
  const railGeo = new THREE.TorusGeometry(R + 0.04, 0.038, 8, 64).rotateX(Math.PI / 2);
  g.add(mesh(railGeo, MAT.darkMetal, 0, H - 0.04, 0));

  // Non-skid deck insert
  g.add(mesh(new THREE.CylinderGeometry(R - 0.05, R - 0.05, 0.08, 48), MAT.titanium, 0, H - 0.04, 0));

  // Mooring cleats
  for (const a of [0.4, -0.4, Math.PI - 0.4, -Math.PI + 0.4]) {
    const cleat = mesh(new THREE.BoxGeometry(0.11, 0.035, 0.045), MAT.silver, Math.sin(a) * (R - 0.14), H + 0.02, Math.cos(a) * (R - 0.14));
    cleat.rotation.y = a;
    g.add(cleat);
  }

  // Stern transom plate
  g.add(mesh(new THREE.BoxGeometry(1.5, 1.1, 0.07), MAT.darkMetal, 0, 0.65, -R * 0.68));

  return g;
}

function buildMotorBoat() {
  const g = new THREE.Group();
  const H = PARTS.motorBoat.height;
  // Outboard motor cowling
  g.add(mesh(new THREE.BoxGeometry(0.76, 0.8, 1.05), MAT.darkMetal, 0, H - 0.48, 0));
  g.add(mesh(new THREE.BoxGeometry(0.78, 0.18, 1.07), MAT.orange, 0, H - 0.42, 0));

  // Drive leg
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.65, 0.42), MAT.metal, 0, 0.38, -0.08));

  // Torpedo bullet gearcase
  g.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.72, 16).rotateX(Math.PI / 2), MAT.metal, 0, 0.14, 0));

  // Skeg fin
  const skegShape = new THREE.Shape();
  skegShape.moveTo(-0.02, 0.08);
  skegShape.lineTo(-0.24, -0.2);
  skegShape.lineTo(0.14, -0.2);
  skegShape.lineTo(0.14, 0.08);
  skegShape.closePath();
  const skegGeo = new THREE.ExtrudeGeometry(skegShape, { depth: 0.028 });
  skegGeo.rotateY(Math.PI / 2);
  skegGeo.translate(-0.014, 0, 0);
  g.add(mesh(skegGeo, MAT.darkMetal));

  // Propeller group
  const propGroup = new THREE.Group();
  propGroup.position.set(0, 0.14, -0.4);
  g.add(propGroup);
  g.userData.propGroup = propGroup;

  propGroup.add(mesh(new THREE.ConeGeometry(0.085, 0.18, 16).rotateX(-Math.PI / 2), MAT.silver, 0, 0, 0));

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.quadraticCurveTo(0.11, 0.13, 0.05, 0.3);
  bladeShape.quadraticCurveTo(-0.07, 0.22, 0, 0);
  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.012 });
  for (let i = 0; i < 3; i++) {
    const b = mesh(bladeGeo, MAT.copper, 0, 0, 0);
    b.rotation.z = (i / 3) * Math.PI * 2;
    b.rotation.y = 0.4;
    propGroup.add(b);
  }

  // Water propulsion nozzle
  const bellM = bellMaterial(true);
  addNozzle(g, 0, -0.38, 0.24, [bellM]);

  return g;
}

function buildFloatsBoat() {
  const g = new THREE.Group();
  // Outrigger crossbar
  g.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.15, 12).rotateZ(Math.PI / 2), MAT.metal, 0.58, 0, 0));
  const brace = mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.85, 10), MAT.metal, 0.48, -0.18, 0);
  brace.rotation.z = -0.55;
  g.add(brace);

  // Hydrodynamic pontoon float
  const pontoonGroup = new THREE.Group();
  pontoonGroup.position.set(1.12, -0.28, 0);
  g.add(pontoonGroup);

  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const r = 0.26 * Math.sin(t * Math.PI);
    pts.push(new THREE.Vector2(Math.max(0.01, r), (t - 0.5) * 2.5));
  }
  const floatGeo = new THREE.LatheGeometry(pts, 24).rotateX(Math.PI / 2);
  pontoonGroup.add(mesh(floatGeo, MAT.white, 0, 0, 0));
  pontoonGroup.add(mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.38, 24).rotateX(Math.PI / 2), MAT.orange, 0, 0, 0.28));

  return g;
}

// ---------------------------------------------------------------- airplane builders
function buildCockpitPlane() {
  const g = new THREE.Group();
  const H = PARTS.cockpitPlane.height; // 2.8
  const pts = [];
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const r = Math.max(0.02, R * Math.pow(1 - t, 0.75));
    pts.push(new THREE.Vector2(r, t * H));
  }
  const bodyGeo = scaleUV(new THREE.LatheGeometry(pts, 48), 2, 1.2);
  g.add(mesh(bodyGeo, MAT.stealth, 0, 0, 0));

  // Pitot tube needle
  g.add(mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.5, 8), MAT.silver, 0, H + 0.25, 0));
  g.add(mesh(new THREE.ConeGeometry(0.015, 0.08, 8), MAT.titanium, 0, H + 0.54, 0));

  // Stealth bubble canopy
  const canopyGeo = new THREE.CylinderGeometry(0.48, 0.7, 1.35, 32, 1, false, -Math.PI * 0.45, Math.PI * 0.9);
  const canopy = mesh(canopyGeo, MAT.glass, 0, 1.1, 0.22);
  canopy.rotation.x = 0.22;
  g.add(canopy);

  // Ejection seat & HUD
  const seat = mesh(new THREE.BoxGeometry(0.36, 0.48, 0.36), MAT.darkMetal, 0, 0.95, 0.08);
  seat.rotation.x = 0.15;
  g.add(seat);
  const hudGlass = mesh(new THREE.PlaneGeometry(0.16, 0.12), new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff66, emissiveIntensity: 2, transparent: true, opacity: 0.8 }), 0, 1.3, 0.36);
  hudGlass.rotation.x = 0.3;
  g.add(hudGlass);

  // Forebody chine edges
  for (const sgn of [-1, 1]) {
    const chineShape = new THREE.Shape();
    chineShape.moveTo(0, 0);
    chineShape.lineTo(0.22, 0.55);
    chineShape.lineTo(0.02, 1.8);
    chineShape.lineTo(0, 0);
    chineShape.closePath();
    const chineGeo = new THREE.ExtrudeGeometry(chineShape, { depth: 0.035 });
    chineGeo.rotateY(sgn * Math.PI / 2);
    g.add(mesh(chineGeo, MAT.darkMetal, sgn * (R * 0.84), 0.3, 0));
  }

  return g;
}

function buildFuselagePlane() {
  const g = new THREE.Group();
  const H = PARTS.fuselagePlane.height; // 3.8
  const bodyGeo = scaleUV(new THREE.CylinderGeometry(R * 1.05, R * 0.96, H - 0.2, 48, 1, true), 2, 2);
  g.add(mesh(bodyGeo, MAT.stealth, 0, H / 2, 0));

  // Dorsal spine
  g.add(mesh(new THREE.BoxGeometry(0.62, H - 0.1, 0.32), MAT.darkMetal, 0, H / 2, 0.88));

  // Dual Caret air intakes on flanks
  for (const sgn of [-1, 1]) {
    const intakeGroup = new THREE.Group();
    intakeGroup.position.set(sgn * (R + 0.32), H * 0.55, 0);
    intakeGroup.rotation.y = -sgn * 0.1;

    intakeGroup.add(mesh(new THREE.BoxGeometry(0.52, 1.7, 0.68), MAT.stealth, 0, 0, 0));
    intakeGroup.add(mesh(new THREE.BoxGeometry(0.54, 0.08, 0.7), MAT.titanium, 0, 0.85, 0));

    const intGeo = new THREE.PlaneGeometry(0.46, 0.58).rotateX(-Math.PI / 2);
    intakeGroup.add(mesh(intGeo, new THREE.MeshBasicMaterial({ color: 0x06070a }), 0, 0.83, 0));
    g.add(intakeGroup);
  }

  // Vietnamese Air Force insignia
  const roundel = mesh(new THREE.CircleGeometry(0.32, 32), new THREE.MeshStandardMaterial({ color: 0xda251d, roughness: 0.4 }), 0, H * 0.65, 1.06);
  roundel.rotation.x = -0.15;
  g.add(roundel);
  const yellowStar = mesh(new THREE.CircleGeometry(0.16, 5), new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffdd00, emissiveIntensity: 0.6 }), 0, H * 0.65, 1.065);
  yellowStar.rotation.x = -0.15;
  yellowStar.rotation.z = Math.PI / 2;
  g.add(yellowStar);

  return g;
}

function buildWingsPlane() {
  const g = new THREE.Group();
  // Swept delta wing planform
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, -1.2);
  wingShape.lineTo(0, 1.5);
  wingShape.lineTo(3.2, 0.1);
  wingShape.lineTo(3.1, -0.6);
  wingShape.closePath();

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.075, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
  wingGeo.rotateX(Math.PI / 2);
  g.add(mesh(wingGeo, MAT.stealth, 0, 0, 0));

  // Aileron flap
  g.add(mesh(new THREE.BoxGeometry(1.9, 0.055, 0.22), MAT.darkMetal, 1.75, 0, -0.68));

  // Wingtip rail & formation light
  g.add(mesh(new THREE.BoxGeometry(0.07, 0.07, 1.15), MAT.titanium, 3.15, 0, -0.2));
  g.add(mesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshStandardMaterial({ color: 0x00ff44, emissive: 0x00ff44, emissiveIntensity: 3 }), 3.16, 0.05, -0.2));

  // Underwing pylon with external fuel tank
  g.add(mesh(new THREE.BoxGeometry(0.055, 0.15, 0.75), MAT.darkMetal, 1.45, -0.11, 0));
  const tankGeo = new THREE.CylinderGeometry(0.13, 0.13, 1.7, 16).rotateX(Math.PI / 2);
  g.add(mesh(tankGeo, MAT.silver, 1.45, -0.24, 0));

  return g;
}

function buildTailPlane() {
  const g = new THREE.Group();
  const H = PARTS.tailPlane.height; // 1.8
  g.add(mesh(new THREE.BoxGeometry(1.15, H, 0.85), MAT.stealth, 0, H / 2, 0));

  // Twin canted vertical stabilizers
  for (const sgn of [-1, 1]) {
    const finGroup = new THREE.Group();
    finGroup.position.set(sgn * 0.62, 0.2, -0.08);
    finGroup.rotation.z = -sgn * 0.42;

    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(-0.1, H * 0.9);
    finShape.lineTo(0.38, H * 0.85);
    finShape.lineTo(0.62, 0);
    finShape.closePath();

    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012 });
    finGeo.rotateY(Math.PI / 2);
    finGroup.add(mesh(finGeo, MAT.stealth, 0, 0, 0));
    finGroup.add(mesh(new THREE.BoxGeometry(0.055, H * 0.62, 0.18), MAT.darkMetal, 0, H * 0.38, -0.16));
    g.add(finGroup);
  }

  // All-moving horizontal tailplane elevators
  for (const sgn of [-1, 1]) {
    const stabShape = new THREE.Shape();
    stabShape.moveTo(0, -0.55);
    stabShape.lineTo(0, 0.55);
    stabShape.lineTo(1.35, -0.08);
    stabShape.lineTo(1.25, -0.48);
    stabShape.closePath();
    const stabGeo = new THREE.ExtrudeGeometry(stabShape, { depth: 0.038, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01 }).rotateX(Math.PI / 2);
    const stab = mesh(stabGeo, MAT.darkMetal, sgn * 0.68, 0.22, 0);
    stab.rotation.y = sgn > 0 ? 0 : Math.PI;
    g.add(stab);
  }

  return g;
}

function buildEngJet() {
  const g = new THREE.Group();
  const H = PARTS.engJet.height; // 2.2
  const pts = [
    new THREE.Vector2(0.9, 0),
    new THREE.Vector2(0.92, 0.28),
    new THREE.Vector2(0.98, 1.15),
    new THREE.Vector2(1.02, H),
  ];
  const cowlGeo = scaleUV(new THREE.LatheGeometry(pts, 48), 2, 1);
  g.add(mesh(cowlGeo, MAT.stealth, 0, 0, 0));

  // Nozzle petals
  const nozzleLength = 0.52;
  const petalCount = 18;
  const petalGeo = new THREE.BoxGeometry(0.13, nozzleLength, 0.028);
  for (let i = 0; i < petalCount; i++) {
    const a = (i / petalCount) * Math.PI * 2;
    const r = 0.7;
    const petal = mesh(petalGeo, i % 2 === 0 ? MAT.titanium : MAT.darkMetal, Math.cos(a) * r, nozzleLength / 2, Math.sin(a) * r);
    petal.rotation.y = -a;
    petal.rotation.x = 0.12;
    g.add(petal);
  }

  // Afterburner spray rings
  g.add(mesh(new THREE.TorusGeometry(0.46, 0.02, 8, 32).rotateX(Math.PI / 2), MAT.copper, 0, 0.62, 0));
  g.add(mesh(new THREE.TorusGeometry(0.26, 0.02, 8, 24).rotateX(Math.PI / 2), MAT.copper, 0, 0.62, 0));

  const bellM = bellMaterial(false);
  addNozzle(g, 0, 0, 0.4, [bellM]);

  return g;
}

function buildGearPlane() {
  const g = new THREE.Group();
  const legHeight = 1.05;
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.58, 12), MAT.darkMetal, 0, -0.28, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.48, 12), MAT.silver, 0, -0.62, 0));

  const link = mesh(new THREE.BoxGeometry(0.038, 0.2, 0.07), MAT.darkMetal, 0.055, -0.48, 0);
  link.rotation.z = 0.3;
  g.add(link);

  g.add(mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.34, 10).rotateZ(Math.PI / 2), MAT.silver, 0, -legHeight, 0));

  const wheelGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.11, 24).rotateZ(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.12, 16).rotateZ(Math.PI / 2);
  for (const sgn of [-1, 1]) {
    g.add(mesh(wheelGeo, MAT.rubber, sgn * 0.11, -legHeight, 0));
    g.add(mesh(hubGeo, MAT.metal, sgn * 0.11, -legHeight, 0));
  }

  const lamp = mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.055, 12).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3 }), 0, -0.38, 0.09);
  g.add(lamp);

  return g;
}

// ---------------------------------------------------------------- SATURN V / APOLLO 11 AUTHENTIC PARTS
let _saturnMats = null;
function getSaturnMaterials() {
  if (_saturnMats) return _saturnMats;

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xf4f5f8,
    roughness: 0.34,
    metalness: 0.06,
  });

  const softGreyMat = new THREE.MeshStandardMaterial({
    color: 0xd6dae2,
    roughness: 0.42,
    metalness: 0.12,
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x121418,
    roughness: 0.48,
    metalness: 0.16,
  });

  const smSilverMat = new THREE.MeshStandardMaterial({
    color: 0xb8bec8,
    roughness: 0.28,
    metalness: 0.72,
  });

  const f1MetalMat = new THREE.MeshStandardMaterial({
    color: 0x7c828d,
    roughness: 0.36,
    metalness: 0.68,
  });

  const f1DarkRingMat = new THREE.MeshStandardMaterial({
    color: 0x383c44,
    roughness: 0.44,
    metalness: 0.62,
  });

  const lesRedMat = new THREE.MeshStandardMaterial({
    color: 0xb81d24,
    roughness: 0.38,
    metalness: 0.14,
  });

  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xd49b2a,
    roughness: 0.32,
    metalness: 0.65,
  });

  const darkBayMat = new THREE.MeshStandardMaterial({
    color: 0x16181d,
    roughness: 0.75,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });

  function makeCanvasMat(drawFn, w = 512, h = 512) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.34,
      metalness: 0.06,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  }

  // 1. S-IVB Decal (Stage 5): Red Vertical "U S A" on left-front and right-front of white cylinder
  const s4bUsaDecalMat = makeCanvasMat((ctx, w, h) => {
    ctx.fillStyle = '#f4f5f8';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#b81d24';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 54px "Arial Black", Arial, sans-serif';
    for (const cx of [w * 0.24, w * 0.76]) {
      ctx.fillText('U', cx, h * 0.28);
      ctx.fillText('S', cx, h * 0.50);
      ctx.fillText('A', cx, h * 0.72);
    }
  }, 512, 512);

  // 2. S-II Decal (Stage 3): Vertical column of 8 Black Rectangular Dashes on left + Red Vertical "UNITED STATES" on right
  const s2DecalMat = makeCanvasMat((ctx, w, h) => {
    ctx.fillStyle = '#f4f5f8';
    ctx.fillRect(0, 0, w, h);

    // Left column (x = 0.28): 8 crisp black photogrammetry calibration dashes
    ctx.fillStyle = '#14161b';
    for (let i = 0; i < 8; i++) {
      const dy = h * 0.14 + i * (h * 0.058);
      ctx.fillRect(w * 0.27 - 8, dy, 16, 18);
    }

    // Right column (x = 0.60): Vertical Red "U N I T E D  S T A T E S"
    const chars = 'UNITED STATES';
    ctx.fillStyle = '#b81d24';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 34px "Arial Black", Arial, sans-serif';
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], w * 0.60, h * 0.12 + i * (h * 0.066));
    }
  }, 512, 1024);

  // 3. S-IC Upper White Tank Decal: Dual Crisp U.S. Flags on left-front and right-front
  const s1FlagsDecalMat = makeCanvasMat((ctx, w, h) => {
    ctx.fillStyle = '#f4f5f8';
    ctx.fillRect(0, 0, w, h);

    for (const cx of [w * 0.25, w * 0.75]) {
      const fw = 124;
      const fh = 72;
      const fx = cx - fw * 0.5;
      const fy = h * 0.50 - fh * 0.5;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx, fy, fw, fh);

      const sh = fh / 13;
      ctx.fillStyle = '#b81d24';
      for (let s = 0; s < 13; s += 2) {
        ctx.fillRect(fx, fy + s * sh, fw, sh + 0.3);
      }

      const cw = fw * 0.42;
      const ch = sh * 7;
      ctx.fillStyle = '#0c2340';
      ctx.fillRect(fx, fy, cw, ch);

      ctx.fillStyle = '#ffffff';
      for (let r = 0; r < 4; r++) {
        for (let col = 0; col < 5; col++) {
          const sx = fx + 7 + col * ((cw - 14) / 4);
          const sy = fy + 6 + r * ((ch - 12) / 3);
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(fx, fy, fw, fh);
    }
  }, 512, 512);

  // 4. S-IC Lower White Vertical Channel Decal: Bold Red Vertical "U S A"
  const s1UsaStripMat = makeCanvasMat((ctx, w, h) => {
    ctx.fillStyle = '#f4f5f8';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#b81d24';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 64px "Arial Black", Arial, sans-serif';
    ctx.fillText('U', w * 0.5, h * 0.26);
    ctx.fillText('S', w * 0.5, h * 0.50);
    ctx.fillText('A', w * 0.5, h * 0.74);
  }, 256, 512);

  _saturnMats = {
    whiteMat,
    softGreyMat,
    blackMat,
    smSilverMat,
    f1MetalMat,
    f1DarkRingMat,
    lesRedMat,
    goldFoilMat,
    darkBayMat,
    s4bUsaDecalMat,
    s2DecalMat,
    s1FlagsDecalMat,
    s1UsaStripMat,
  };
  return _saturnMats;
}

const RS = 2.04;              // Sleek authentic Saturn V main body radius (S-IC & S-II)
const RS_S4B = 1.34;          // S-IVB Stage 3 radius
const RS_SM = 0.82;           // Apollo Service/Command Module radius

// =========================================================================
// APOLLO 11 (CUTAWAY COLLECTOR EDITION — METALLIC SILVER CM/SM, OPEN LATTICE
// LES TOWER WITH RED RINGS, CUTAWAY SLA CONE REVEALING GOLD-FOIL LUNAR MODULE
// EAGLE, 2-TIER CHECKERBOARD FRUSTUM, RED "UNITED STATES" & ALTERNATING FINS)
// =========================================================================
function buildApollo11CM() {
  const g = new THREE.Group();
  const { whiteMat, smSilverMat, blackMat, lesRedMat } = getSaturnMaterials();
  const rSM = RS_SM; // 0.82 m

  // 1. Apollo Command Module (CM) Metallic Silver/White Cone (y = 0.0 -> 1.95)
  const cmCone = new THREE.CylinderGeometry(0.22, rSM, 1.95, 64);
  g.add(mesh(cmCone, smSilverMat, 0, 0.975, 0));
  // Bottom white/silver structural ring & dark crew hatch window details on front
  g.add(mesh(new THREE.CylinderGeometry(rSM + 0.012, rSM + 0.012, 0.10, 64), whiteMat, 0, 0.05, 0));
  const win1 = mesh(new THREE.BoxGeometry(0.16, 0.18, 0.05), blackMat, 0, 0.95, rSM * 0.62);
  win1.rotation.x = -0.32;
  g.add(win1);
  const win2 = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16).rotateX(Math.PI / 2), blackMat, 0.24, 1.05, rSM * 0.56);
  g.add(win2);

  // Crimson-red collar ring at top of Command Module (y = 1.95 -> 2.08)
  g.add(mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.13, 40), lesRedMat, 0, 2.01, 0));

  // 2. Launch Escape System (LES) Open Lattice Truss Tower & Spire Needle (y = 2.05 -> 6.20)
  const tower = new THREE.Group();
  tower.name = 'tower';
  g.add(tower);
  g.userData.tower = tower;

  const tBase = 2.06;
  const hTruss = 1.08;
  const legGeo = new THREE.CylinderGeometry(0.026, 0.032, hTruss, 8);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const leg = mesh(legGeo, smSilverMat, Math.sin(a) * 0.16, tBase + hTruss * 0.5, Math.cos(a) * 0.16);
    leg.rotation.z = -Math.cos(a) * 0.05;
    leg.rotation.x = Math.sin(a) * 0.05;
    tower.add(leg);
  }
  // Open Diagonal X Cross-Braces inside the 3-tier lattice tower (matching reference photo!)
  const braceGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.42, 6);
  for (let tier = 0; tier < 3; tier++) {
    const ty = tBase + 0.18 + tier * 0.34;
    for (let side = 0; side < 4; side++) {
      const sa = side * Math.PI / 2;
      for (const diag of [-1, 1]) {
        const br = mesh(braceGeo, smSilverMat, Math.sin(sa) * 0.15, ty, Math.cos(sa) * 0.15);
        br.rotation.y = sa;
        br.rotation.z = diag * 0.68;
        tower.add(br);
      }
    }
  }

  // Crimson-red escape motor nozzle skirt (y = 3.14 -> 3.36)
  tower.add(mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.22, 32), lesRedMat, 0, tBase + 1.18, 0));
  // White Cylindrical Solid Escape Motor Body (y = 3.36 -> 4.82)
  tower.add(mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.46, 32), whiteMat, 0, tBase + 2.02, 0));
  // Crimson-red upper band & conical Q-ball shoulder
  tower.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.10, 32), lesRedMat, 0, tBase + 2.78, 0));
  tower.add(mesh(new THREE.CylinderGeometry(0.065, 0.165, 0.38, 32), whiteMat, 0, tBase + 3.02, 0));
  // Tall pointed white Q-ball probe spire at the very tip (y = 5.25 -> 6.20)
  tower.add(mesh(new THREE.CylinderGeometry(0.022, 0.058, 1.05, 24), whiteMat, 0, tBase + 3.68, 0));

  // Parachutes & recessed nozzle for capsule return
  addParachutes(g, 1.55);
  const cmMat = bellMaterial(true);
  g.add(mesh(bellGeometry(0.12, 0.32, 0.45), cmMat, 0, 0.02, 0));
  addNozzle(g, 0, 0, 0.32, [cmMat]);

  return g;
}

// Stage 7: Metallic Silver Apollo 11 Service Module (SM) with White Radiator Bands & 4 Protruding RCS Quads
function buildApollo11SM() {
  const g = new THREE.Group();
  const { whiteMat, smSilverMat, blackMat, lesRedMat } = getSaturnMaterials();
  const H = PARTS.apollo11SM.height; // 2.6 m
  const rSM = RS_SM;                 // 0.82 m

  // 1. Main Metallic Silver Service Module Cylinder (y = 0 -> H)
  g.add(mesh(new THREE.CylinderGeometry(rSM, rSM, H, 64), smSilverMat, 0, H / 2, 0));

  // 2. Crisp White Radiator Collar Bands near bottom (y = 0.12 -> 0.58) and top (y = 2.18 -> 2.48)
  g.add(mesh(new THREE.CylinderGeometry(rSM + 0.008, rSM + 0.008, 0.46, 64), whiteMat, 0, 0.35, 0));
  g.add(mesh(new THREE.CylinderGeometry(rSM + 0.008, rSM + 0.008, 0.30, 64), whiteMat, 0, 2.33, 0));
  // Dark narrow ring seams framing the lower white radiator band
  g.add(mesh(new THREE.CylinderGeometry(rSM + 0.010, rSM + 0.010, 0.04, 64), blackMat, 0, 0.10, 0));
  g.add(mesh(new THREE.CylinderGeometry(rSM + 0.010, rSM + 0.010, 0.04, 64), blackMat, 0, 0.60, 0));

  // Fine vertical sector divider seams & dark circular inspection markings on the silver hull
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const seam = mesh(new THREE.BoxGeometry(0.018, H - 0.2, 0.018), blackMat, Math.sin(a) * (rSM + 0.005), H * 0.5, Math.cos(a) * (rSM + 0.005));
    seam.rotation.y = a;
    g.add(seam);
  }
  const bull = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 20).rotateX(Math.PI / 2), blackMat, -0.18, 1.42, rSM + 0.005);
  g.add(bull);

  // 3. 4 Protruding 4-Nozzle SM RCS Thruster Quads at y = 1.48
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const rx = Math.sin(a) * (rSM + 0.04);
    const rz = Math.cos(a) * (rSM + 0.04);
    const rcs = mesh(new THREE.BoxGeometry(0.14, 0.24, 0.12), smSilverMat, rx, 1.48, rz);
    rcs.rotation.y = a;
    g.add(rcs);
    const rcsCap = mesh(new THREE.BoxGeometry(0.15, 0.08, 0.13), lesRedMat, rx, 1.48, rz);
    rcsCap.rotation.y = a;
    g.add(rcsCap);
  }

  // SPS vacuum engine nozzle
  const spsMat = bellMaterial(true);
  g.add(mesh(bellGeometry(0.18, 0.52, 0.90), spsMat, 0, 0.02, 0));
  addNozzle(g, 0, 0, 0.52, [spsMat]);

  return g;
}

// Stage 6: White Conical Spacecraft-LM Adapter (SLA) with Front Cutaway Bay Revealing the Lunar Module
// ("Eagle") Inside + Bold Corrugated Black Base Band (matching reference photo!)
function buildApollo11SLA() {
  const g = new THREE.Group();
  const { whiteMat, softGreyMat, blackMat, smSilverMat, goldFoilMat, darkBayMat } = getSaturnMaterials();
  const H = PARTS.apollo11SLA.height; // 4.2 m
  const rBottom = RS_S4B;             // 1.34 m (matches top of S-IVB)
  const rTop = RS_SM;                 // 0.82 m (matches bottom of SM)

  const yBlackBandTop = 0.68;
  const hCone = H - yBlackBandTop;  // 3.52 m

  // 1. Bold Corrugated Matte-Black Collar Band at Base of SLA (y = 0.0 -> 0.68, r = 1.34)
  g.add(mesh(new THREE.CylinderGeometry(rBottom + 0.008, rBottom + 0.008, yBlackBandTop, 64), blackMat, 0, yBlackBandTop * 0.5, 0));
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const rib = mesh(
      new THREE.BoxGeometry(0.025, yBlackBandTop * 0.92, 0.025),
      blackMat,
      Math.sin(a) * (rBottom + 0.014),
      yBlackBandTop * 0.5,
      Math.cos(a) * (rBottom + 0.014)
    );
    rib.rotation.y = a;
    g.add(rib);
  }

  // 2. Conical White SLA Frustum with Front Cutaway Window (y = 0.68 -> 4.20)
  const cutArc = 0.84;
  const slaOuterGeo = new THREE.CylinderGeometry(
    rTop,
    rBottom,
    hCone,
    64,
    1,
    true,
    cutArc * 0.5,
    Math.PI * 2 - cutArc
  );
  g.add(mesh(slaOuterGeo, whiteMat, 0, yBlackBandTop + hCone * 0.5, 0));

  // Top and bottom white border collars of the conical section so the window has a crisp frame
  g.add(mesh(new THREE.CylinderGeometry(rTop + 0.006, rTop + 0.025, 0.22, 64), whiteMat, 0, H - 0.11, 0));
  g.add(mesh(new THREE.CylinderGeometry(rBottom - 0.015, rBottom + 0.006, 0.22, 64), whiteMat, 0, yBlackBandTop + 0.11, 0));

  // Dark Recessed Interior Bay Wall behind the front cutaway window
  const bayGeo = new THREE.CylinderGeometry(rTop * 0.92, rBottom * 0.92, hCone - 0.10, 48, 1, false);
  g.add(mesh(bayGeo, darkBayMat, 0, yBlackBandTop + hCone * 0.5, 0));

  // Crisp White Side Frame Strips along the left and right edges of the cutaway window
  const slopeAng = Math.atan2(rBottom - rTop, hCone);
  for (const sgn of [-1, 1]) {
    const edgeAng = sgn * (cutArc * 0.5);
    const rMid = (rBottom + rTop) * 0.5;
    const frame = mesh(
      new THREE.BoxGeometry(0.06, hCone * 0.94, 0.12),
      whiteMat,
      Math.sin(edgeAng) * (rMid - 0.02),
      yBlackBandTop + hCone * 0.5,
      Math.cos(edgeAng) * (rMid - 0.02)
    );
    frame.rotation.y = edgeAng;
    frame.rotation.x = -slopeAng;
    g.add(frame);
  }

  // 3. Detailed 3D Apollo Lunar Module ("Eagle") Nestled Inside the Front Cutaway Window!
  const lm = new THREE.Group();
  lm.position.set(0, yBlackBandTop + 0.22, 0.18);
  g.add(lm);

  // A. Octagonal Gold-Foil Descent Stage (y_local = 0.20 -> 1.05)
  lm.add(mesh(new THREE.CylinderGeometry(0.56, 0.58, 0.82, 8), goldFoilMat, 0, 0.62, 0));
  lm.add(mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.28, 20), blackMat, 0, 0.14, 0));
  for (const la of [-0.65, 0.65, -1.45, 1.45]) {
    const lx = Math.sin(la) * 0.62;
    const lz = Math.cos(la) * 0.62;
    const strut = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.95, 8), smSilverMat, lx, 0.68, lz);
    strut.rotation.y = la;
    strut.rotation.x = -0.18;
    lm.add(strut);
    lm.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 16), goldFoilMat, lx * 1.05, 0.22, lz * 1.05));
  }

  // B. Metallic Silver & Dark-Grey Ascent Stage Cabin (y_local = 1.05 -> 2.35)
  lm.add(mesh(new THREE.CylinderGeometry(0.46, 0.50, 1.05, 8), smSilverMat, 0, 1.58, 0));
  lm.add(mesh(new THREE.BoxGeometry(0.44, 0.88, 0.32), softGreyMat, 0, 1.60, 0.34));
  lm.add(mesh(new THREE.BoxGeometry(0.22, 0.24, 0.05), blackMat, 0, 1.36, 0.50));
  for (const sgn of [-1, 1]) {
    const wMesh = mesh(new THREE.BoxGeometry(0.14, 0.12, 0.05), blackMat, sgn * 0.15, 1.76, 0.49);
    wMesh.rotation.z = -sgn * 0.28;
    lm.add(wMesh);
    lm.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.68, 16).rotateZ(Math.PI / 2), smSilverMat, sgn * 0.42, 1.56, 0.05));
  }
  lm.add(mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.38, 20), smSilverMat, 0, 2.24, 0.05));
  lm.add(mesh(new THREE.CylinderGeometry(0.14, 0.04, 0.08, 16).rotateX(Math.PI / 2), whiteMat, 0.08, 2.18, 0.48));

  // Stage 6 propulsion nozzle
  const lmMat = bellMaterial(true);
  g.add(mesh(bellGeometry(0.20, 0.62, 1.05), lmMat, 0, 0.02, 0));
  addNozzle(g, 0, 0, 0.62, [lmMat]);

  return g;
}

// Stage 5: S-IVB Cylindrical Upper Stage with Dual Red Vertical "U S A" & Lower Black Band
function buildApollo11S4B() {
  const g = new THREE.Group();
  const { whiteMat, softGreyMat, blackMat, lesRedMat, s4bUsaDecalMat } = getSaturnMaterials();
  const H = PARTS.apollo11S4B.height; // 8.6 m
  const r3 = RS_S4B;                  // 1.34 m

  const yBotBlackTop = 1.15;

  // 1. Lower Matte-Black Horizontal Collar Band (y = 0.0 -> 1.15) with White Left-Front Panel Block
  g.add(mesh(new THREE.CylinderGeometry(r3 + 0.006, r3 + 0.006, yBotBlackTop, 64), blackMat, 0, yBotBlackTop * 0.5, 0));
  const whitePatch = new THREE.CylinderGeometry(r3 + 0.012, r3 + 0.012, yBotBlackTop * 0.92, 24, 1, true, -0.68, 0.52);
  g.add(mesh(whitePatch, whiteMat, 0, yBotBlackTop * 0.5, 0));

  // 2. Main White Cylindrical S-IVB Tank (y = 1.15 -> 8.60)
  const hWhite = H - yBotBlackTop;
  g.add(mesh(new THREE.CylinderGeometry(r3, r3, hWhite, 64), whiteMat, 0, yBotBlackTop + hWhite * 0.5, 0));

  // Fine vertical corrugation ribs around the upper aft skirt of S-IVB (y = 7.65 -> 8.60)
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const rib = mesh(
      new THREE.BoxGeometry(0.022, 0.90, 0.022),
      i % 2 === 0 ? whiteMat : softGreyMat,
      Math.sin(a) * (r3 + 0.008),
      8.12,
      Math.cos(a) * (r3 + 0.008)
    );
    rib.rotation.y = a;
    g.add(rib);
  }

  // Conformal Decal on Front (+Z) and Back (-Z): Dual Red Vertical "U S A" on left-front and right-front
  const arcSpan = 1.72;
  for (const rotY of [0, Math.PI]) {
    const decGeo = new THREE.CylinderGeometry(
      r3 + 0.011,
      r3 + 0.011,
      hWhite * 0.76,
      40,
      1,
      true,
      -arcSpan * 0.5,
      arcSpan
    );
    const decMesh = mesh(decGeo, s4bUsaDecalMat, 0, yBotBlackTop + hWhite * 0.46, 0);
    decMesh.rotation.y = rotY;
    g.add(decMesh);
  }

  // Protruding APS auxiliary propulsion thruster pods on left/right flanks near base (y = 0.75 -> 1.65)
  for (const sgn of [-1, 1]) {
    const podX = sgn * (r3 + 0.05);
    g.add(mesh(new THREE.BoxGeometry(0.14, 0.85, 0.22), whiteMat, podX, 1.25, 0.15));
    g.add(mesh(new THREE.ConeGeometry(0.09, 0.28, 12), lesRedMat, podX, 1.78, 0.15));
  }

  // Single J-2 vacuum engine
  const j2Mat = bellMaterial(true);
  g.add(mesh(bellGeometry(0.24, 0.78, 1.45), j2Mat, 0, 0.02, 0));
  addNozzle(g, 0, 0, 0.78, [j2Mat]);

  return g;
}

// Stage 4: Conical S-IVB / S-II Aft Interstage Frustum with 2-Tier Corrugated Black & White Checkerboard Pattern
function buildApollo11S4BInter() {
  const g = new THREE.Group();
  const { whiteMat, blackMat, lesRedMat } = getSaturnMaterials();
  const hFrustum = PARTS.apollo11S4BInter.height; // 3.6 m
  const rTop = RS_S4B;                            // 1.34 m
  const rBot = RS;                                // 2.04 m
  const rMid = (rTop + rBot) * 0.5;               // 1.69 m
  const hHalf = hFrustum * 0.5;                   // 1.80 m

  // Base white frustum core
  g.add(mesh(new THREE.CylinderGeometry(rTop, rBot, hFrustum, 72, 1, false), whiteMat, 0, hFrustum * 0.5, 0));

  // 2-Tier Checkerboard Pattern
  const nSectors = 6;
  const secArc = (Math.PI * 2) / nSectors;
  for (let s = 0; s < nSectors; s++) {
    const startAng = s * secArc;
    const isUpperBlack = (s % 2 === 1);
    if (isUpperBlack) {
      const upGeo = new THREE.CylinderGeometry(rTop + 0.012, rMid + 0.012, hHalf, 24, 1, true, startAng, secArc);
      g.add(mesh(upGeo, blackMat, 0, hHalf * 1.5, 0));
    } else {
      const loGeo = new THREE.CylinderGeometry(rMid + 0.012, rBot + 0.012, hHalf, 24, 1, true, startAng, secArc);
      g.add(mesh(loGeo, blackMat, 0, hHalf * 0.5, 0));
    }
  }

  // Fine vertical 3D corrugation ribs along the conical checkerboard frustum
  const tiltAng = Math.atan2(rBot - rTop, hFrustum);
  const ribLen = Math.hypot(hFrustum, rBot - rTop) * 0.96;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const rib = mesh(
      new THREE.BoxGeometry(0.022, ribLen, 0.022),
      i % 2 === 0 ? whiteMat : blackMat,
      Math.sin(a) * (rMid + 0.014),
      hFrustum * 0.5,
      Math.cos(a) * (rMid + 0.014)
    );
    rib.rotation.y = a;
    rib.rotation.x = -tiltAng;
    g.add(rib);
  }

  // Small red aerodynamic fairings at the mid-frustum ring (y = 1.80, matching reference photo!)
  for (const fa of [-0.62, 0.52, -1.45, 1.45]) {
    const fx = Math.sin(fa) * (rMid + 0.03);
    const fz = Math.cos(fa) * (rMid + 0.03);
    const fair = mesh(new THREE.ConeGeometry(0.055, 0.34, 10), lesRedMat, fx, hHalf + 0.08, fz);
    fair.rotation.y = fa;
    fair.rotation.x = -tiltAng;
    g.add(fair);
  }

  // 4 Ullage thrusters recessed inside interstage
  for (const [x, z] of [[0.68, 0.68], [-0.68, 0.68], [0.68, -0.68], [-0.68, -0.68]]) {
    const m = bellMaterial(true);
    g.add(mesh(bellGeometry(0.12, 0.32, 0.68), m, x, 0.02, z));
    addNozzle(g, x, z, 0.32, [m]);
  }

  return g;
}

// Stage 3: S-II Second Stage with Corrugated White Upper Collar, Vertical Red "UNITED STATES",
// Column of 8 Black Calibration Dashes & Solid Black Bottom Band
function buildApollo11S2() {
  const g = new THREE.Group();
  const { whiteMat, softGreyMat, blackMat, s2DecalMat } = getSaturnMaterials();
  const H = PARTS.apollo11S2.height; // 11.4 m

  const yBotBlackTop = 1.25;
  const yTopCorrugatedBot = 9.85;

  // 1. Solid Matte-Black Bottom Band (y = 0.0 -> 1.25, r = RS = 2.04)
  g.add(mesh(new THREE.CylinderGeometry(RS + 0.008, RS + 0.008, yBotBlackTop, 72), blackMat, 0, yBotBlackTop * 0.5, 0));

  // 2. Main Smooth White S-II Cylinder (y = 1.25 -> 11.40, r = RS = 2.04)
  const hWhite = H - yBotBlackTop;
  g.add(mesh(new THREE.CylinderGeometry(RS, RS, hWhite, 72), whiteMat, 0, yBotBlackTop + hWhite * 0.5, 0));

  // 3. Upper Corrugated White Skirt Collar (y = 9.85 -> 11.40) with 64 vertical ribs & black square target
  const hCorr = H - yTopCorrugatedBot;
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const rib = mesh(
      new THREE.BoxGeometry(0.026, hCorr * 0.94, 0.026),
      i % 2 === 0 ? whiteMat : softGreyMat,
      Math.sin(a) * (RS + 0.010),
      yTopCorrugatedBot + hCorr * 0.5,
      Math.cos(a) * (RS + 0.010)
    );
    rib.rotation.y = a;
    g.add(rib);
  }
  const sqTarget = mesh(new THREE.BoxGeometry(0.12, 0.14, 0.04), blackMat, 0.16, yTopCorrugatedBot + 0.16, RS + 0.012);
  g.add(sqTarget);

  for (const ry of [3.85, 6.85, yTopCorrugatedBot]) {
    g.add(mesh(new THREE.CylinderGeometry(RS + 0.006, RS + 0.006, 0.08, 72), softGreyMat, 0, ry, 0));
  }

  for (const rotY of [0, Math.PI]) {
    const a = rotY - 0.68;
    const race = mesh(new THREE.BoxGeometry(0.09, hWhite - 0.3, 0.09), whiteMat, Math.sin(a) * (RS + 0.03), yBotBlackTop + hWhite * 0.5, Math.cos(a) * (RS + 0.03));
    race.rotation.y = a;
    g.add(race);
  }

  // 4. Conformal Decal on Front (+Z) and Back (-Z): 8 Black Dashes on Left + Red Vertical "UNITED STATES" on Right
  const hDec = yTopCorrugatedBot - yBotBlackTop - 0.20;
  const arcSpan = 0.96;
  for (const rotY of [0, Math.PI]) {
    const decGeo = new THREE.CylinderGeometry(
      RS + 0.012,
      RS + 0.012,
      hDec,
      36,
      1,
      true,
      -arcSpan * 0.5,
      arcSpan
    );
    const decMesh = mesh(decGeo, s2DecalMat, 0, yBotBlackTop + 0.10 + hDec * 0.5, 0);
    decMesh.rotation.y = rotY;
    g.add(decMesh);
  }

  // 5 J-2 engines at the base (1 center + 4 outer quad)
  for (const [x, z] of [[0, 0], [0.78, 0.78], [-0.78, 0.78], [0.78, -0.78], [-0.78, -0.78]]) {
    const m = bellMaterial();
    g.add(mesh(bellGeometry(0.18, 0.54, 1.15), m, x, 0.02, z));
    addNozzle(g, x, z, 0.54, [m]);
  }

  return g;
}

// Stage 2: S-II / S-IC Corrugated Interstage Ring with Vertical Black/White Bars & White Ullage Fairings
function buildApollo11S2Inter() {
  const g = new THREE.Group();
  const { whiteMat, softGreyMat, blackMat } = getSaturnMaterials();
  const H = PARTS.apollo11S2Inter.height; // 4.8 m

  g.add(mesh(new THREE.CylinderGeometry(RS, RS, H, 72), whiteMat, 0, H * 0.5, 0));

  for (const rotY of [0, Math.PI]) {
    const midBlk = new THREE.CylinderGeometry(RS + 0.012, RS + 0.012, H, 24, 1, true, rotY - 0.24, 0.48);
    g.add(mesh(midBlk, blackMat, 0, H * 0.5, 0));
    const botStep = new THREE.CylinderGeometry(RS + 0.013, RS + 0.013, 1.25, 24, 1, true, rotY - 0.34, 0.68);
    g.add(mesh(botStep, blackMat, 0, 0.625, 0));

    for (const sgn of [-1, 1]) {
      const outStart = rotY + sgn * 0.92 - 0.24;
      const outBlk = new THREE.CylinderGeometry(RS + 0.012, RS + 0.012, H, 24, 1, true, outStart, 0.48);
      g.add(mesh(outBlk, blackMat, 0, H * 0.5, 0));
    }

    for (const sgn of [-1, 1]) {
      const ua = rotY + sgn * 0.56;
      const ux = Math.sin(ua) * (RS + 0.05);
      const uz = Math.cos(ua) * (RS + 0.05);
      const uBody = mesh(new THREE.BoxGeometry(0.14, 2.35, 0.16), whiteMat, ux, 2.25, uz);
      uBody.rotation.y = ua;
      g.add(uBody);
      const uCone = mesh(new THREE.ConeGeometry(0.09, 0.42, 12), whiteMat, ux, 3.62, uz);
      uCone.rotation.y = ua;
      g.add(uCone);
    }
  }

  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const rib = mesh(
      new THREE.BoxGeometry(0.024, H * 0.96, 0.024),
      i % 2 === 0 ? softGreyMat : blackMat,
      Math.sin(a) * (RS + 0.008),
      H * 0.5,
      Math.cos(a) * (RS + 0.008)
    );
    rib.rotation.y = a;
    g.add(rib);
  }

  for (const [x, z] of [[0.82, 0.82], [-0.82, 0.82], [0.82, -0.82], [-0.82, -0.82]]) {
    const m = bellMaterial();
    g.add(mesh(bellGeometry(0.14, 0.38, 0.78), m, x, 0.02, z));
    addNozzle(g, x, z, 0.38, [m]);
  }

  return g;
}

// Stage 1 (Bottom): Giant S-IC First Stage with Dual U.S. Flags, Black/White Roll Pattern,
// Red Vertical "U S A", Alternating White & Black Conical Fairings/Fins & 5 Ribbed Metallic F-1 Engines
function buildApollo11S1() {
  const g = new THREE.Group();
  const {
    whiteMat,
    softGreyMat,
    blackMat,
    smSilverMat,
    f1MetalMat,
    f1DarkRingMat,
    s1FlagsDecalMat,
    s1UsaStripMat,
  } = getSaturnMaterials();
  const H = PARTS.apollo11S1.height; // 17.6 m
  const engH = 1.95;
  const bodyH = H - engH;
  const yStripeTop = engH + 5.45;
  const yBlackBandTop = yStripeTop + 1.15;

  g.add(mesh(new THREE.CylinderGeometry(RS, RS, bodyH, 72), whiteMat, 0, engH + bodyH * 0.5, 0));

  for (const ry of [12.85, H - 0.35]) {
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const rib = mesh(
        new THREE.BoxGeometry(0.024, 0.62, 0.024),
        i % 2 === 0 ? whiteMat : softGreyMat,
        Math.sin(a) * (RS + 0.008),
        ry,
        Math.cos(a) * (RS + 0.008)
      );
      rib.rotation.y = a;
      g.add(rib);
    }
  }

  const flagArc = 1.68;
  for (const rotY of [0, Math.PI]) {
    const flagGeo = new THREE.CylinderGeometry(
      RS + 0.012,
      RS + 0.012,
      3.20,
      40,
      1,
      true,
      -flagArc * 0.5,
      flagArc
    );
    const flagMesh = mesh(flagGeo, s1FlagsDecalMat, 0, 11.45, 0);
    flagMesh.rotation.y = rotY;
    g.add(flagMesh);
  }

  const hLower = yStripeTop - engH;
  g.add(mesh(new THREE.CylinderGeometry(RS + 0.010, RS + 0.010, yBlackBandTop - yStripeTop, 72), blackMat, 0, (yStripeTop + yBlackBandTop) * 0.5, 0));

  for (const rotY of [0, Math.PI]) {
    const midBlk = new THREE.CylinderGeometry(RS + 0.012, RS + 0.012, hLower, 24, 1, true, rotY - 0.24, 0.48);
    g.add(mesh(midBlk, blackMat, 0, engH + hLower * 0.5, 0));

    for (const sgn of [-1, 1]) {
      const outStart = rotY + sgn * 0.92 - 0.24;
      const outBlk = new THREE.CylinderGeometry(RS + 0.012, RS + 0.012, hLower, 24, 1, true, outStart, 0.48);
      g.add(mesh(outBlk, blackMat, 0, engH + hLower * 0.5, 0));
    }

    for (const sgn of [-1, 1]) {
      const chAng = rotY + sgn * 0.46;
      const chArc = 0.42;
      const usaGeo = new THREE.CylinderGeometry(
        RS + 0.015,
        RS + 0.015,
        hLower * 0.86,
        20,
        1,
        true,
        chAng - chArc * 0.5,
        chArc
      );
      g.add(mesh(usaGeo, s1UsaStripMat, 0, engH + hLower * 0.46, 0));

      const stepWhite = new THREE.CylinderGeometry(
        RS + 0.015,
        RS + 0.015,
        0.58,
        16,
        1,
        true,
        chAng - 0.16,
        0.32
      );
      g.add(mesh(stepWhite, whiteMat, 0, yStripeTop + 0.25, 0));
    }
  }

  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const hTun = H - yBlackBandTop - 0.4;
    g.add(mesh(
      new THREE.CylinderGeometry(0.075, 0.075, hTun, 12),
      whiteMat,
      Math.sin(a) * (RS + 0.045),
      yBlackBandTop + 0.2 + hTun * 0.5,
      Math.cos(a) * (RS + 0.045)
    ));
  }

  g.add(mesh(new THREE.CylinderGeometry(RS + 0.02, RS + 0.02, 0.18, 72), f1DarkRingMat, 0, engH + 0.09, 0));

  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0.06);
  finShape.lineTo(1.38, -0.18);
  finShape.lineTo(1.38, 0.48);
  finShape.lineTo(0, 2.15);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.075,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.016,
    bevelSegments: 2,
  });
  finGeo.translate(0, 0, -0.0375);

  const finConfigs = [
    { ang: -0.62, isBlack: false },           // Front-left fairing & fin: WHITE
    { ang: 0.62, isBlack: true },             // Front-right fairing & fin: BLACK
    { ang: Math.PI - 0.62, isBlack: false },  // Back-right fairing & fin: WHITE
    { ang: Math.PI + 0.62, isBlack: true },   // Back-left fairing & fin: BLACK
  ];

  for (const fc of finConfigs) {
    const pivot = new THREE.Group();
    pivot.rotation.y = Math.PI / 2 - fc.ang;
    g.add(pivot);

    const mainMat = fc.isBlack ? blackMat : whiteMat;
    const fairGeo = new THREE.CylinderGeometry(0.10, 0.62, 3.10, 32);
    const fairing = mesh(fairGeo, mainMat, RS - 0.06, engH + 1.58, 0);
    fairing.rotation.z = 0.13;
    pivot.add(fairing);

    const collar = mesh(new THREE.CylinderGeometry(0.64, 0.68, 0.24, 32), mainMat, RS + 0.14, engH + 0.12, 0);
    pivot.add(collar);

    const finMesh = mesh(finGeo, mainMat, RS + 0.22, engH + 0.08, 0);
    pivot.add(finMesh);

    const tabFrame = mesh(new THREE.BoxGeometry(0.28, 0.26, 0.09), whiteMat, RS + 1.56, engH + 0.16, 0);
    pivot.add(tabFrame);
    const tabInner = mesh(new THREE.BoxGeometry(0.20, 0.18, 0.10), blackMat, RS + 1.56, engH + 0.16, 0);
    pivot.add(tabInner);
  }

  const f1Positions = [[0, 0]];
  for (const fc of finConfigs) {
    f1Positions.push([Math.sin(fc.ang) * 1.32, Math.cos(fc.ang) * 1.32]);
  }
  for (const [x, z] of f1Positions) {
    const mBell = bellMaterial(false);
    g.add(mesh(bellGeometry(0.26, 0.68, engH, 40, 0.42, 1.0), f1MetalMat, x, 0, z));
    g.add(mesh(bellGeometry(0.26, 0.68, engH, 40, 0.0, 0.42), f1DarkRingMat, x, 0, z));
    g.add(mesh(new THREE.TorusGeometry(0.50, 0.045, 10, 32).rotateX(Math.PI / 2), f1DarkRingMat, x, engH * 0.44, z));
    for (const bandFrac of [0.16, 0.28, 0.62, 0.78]) {
      const rBand = 0.68 - bandFrac * (0.68 - 0.26);
      g.add(mesh(new THREE.CylinderGeometry(rBand + 0.015, rBand + 0.015, 0.05, 32), smSilverMat, x, engH * bandFrac, z));
    }
    addNozzle(g, x, z, 0.68, [mBell]);
  }

  return g;
}

// =========================================================================
// CLASSIC SATURN V (FULL WHITE BOOST PROTECTIVE COVER, CLOSED SLA CONE,
// STEPPED ROLL PATTERN & ALL-WHITE FINS FOR 'Saturn V (Apollo)' PRESET)
// =========================================================================
function buildSaturnApollo() {
  const g = new THREE.Group();
  const { whiteMat } = getSaturnMaterials();
  const rSM = RS_SM;

  const cmCone = new THREE.CylinderGeometry(0.22, rSM, 2.05, 64);
  g.add(mesh(cmCone, whiteMat, 0, 1.025, 0));
  g.add(mesh(new THREE.CylinderGeometry(rSM + 0.012, rSM + 0.012, 0.10, 64), whiteMat, 0, 0.05, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.30, 0.24, 0.15, 48), whiteMat, 0, 2.05, 0));

  const tower = new THREE.Group();
  tower.name = 'tower';
  g.add(tower);
  g.userData.tower = tower;

  const tBase = 2.05;
  const legGeo = new THREE.CylinderGeometry(0.032, 0.038, 0.92, 8);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const leg = mesh(legGeo, whiteMat, Math.sin(a) * 0.18, tBase + 0.44, Math.cos(a) * 0.18);
    leg.rotation.z = -Math.cos(a) * 0.08;
    leg.rotation.x = Math.sin(a) * 0.08;
    tower.add(leg);
  }
  tower.add(mesh(new THREE.CylinderGeometry(0.19, 0.26, 0.24, 32), whiteMat, 0, tBase + 0.90, 0));
  tower.add(mesh(new THREE.CylinderGeometry(0.16, 0.19, 1.38, 32), whiteMat, 0, tBase + 1.68, 0));
  tower.add(mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.12, 32), whiteMat, 0, tBase + 2.40, 0));
  tower.add(mesh(new THREE.CylinderGeometry(0.068, 0.18, 0.46, 32), whiteMat, 0, tBase + 2.68, 0));
  tower.add(mesh(new THREE.CylinderGeometry(0.024, 0.058, 1.24, 24), whiteMat, 0, tBase + 3.53, 0));

  addParachutes(g, 1.55);
  const cmMat = bellMaterial(true);
  g.add(mesh(bellGeometry(0.12, 0.32, 0.45), cmMat, 0, 0.02, 0));
  addNozzle(g, 0, 0, 0.32, [cmMat]);

  return g;
}

function buildSaturnSM() {
  const g = new THREE.Group();
  const { whiteMat, smSilverMat } = getSaturnMaterials();
  const H = PARTS.saturnSM.height;
  const rSM = RS_SM;

  g.add(mesh(new THREE.CylinderGeometry(rSM, rSM, H, 64), whiteMat, 0, H / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(rSM + 0.012, rSM + 0.012, 0.12, 64), whiteMat, 0, 0.06, 0));

  for (let i = 0; i < 2; i++) {
    const ang = 0.52 + i * Math.PI + 0.36;
    const radPanel = mesh(
      new THREE.CylinderGeometry(rSM + 0.014, rSM + 0.014, 1.18, 24, 1, true, ang - 0.32, 0.64),
      smSilverMat,
      0,
      H - 0.68,
      0
    );
    g.add(radPanel);
  }
  for (let i = 0; i < 4; i++) {
    const a = 0.52 + i * Math.PI / 2 + Math.PI / 4;
    const rcs = mesh(new THREE.BoxGeometry(0.10, 0.18, 0.10), smSilverMat, Math.sin(a) * (rSM + 0.032), H - 0.62, Math.cos(a) * (rSM + 0.032));
    g.add(rcs);
  }

  const spsMat = bellMaterial(true);
  g.add(mesh(bellGeometry(0.18, 0.52, 0.90), spsMat, 0, 0.02, 0));
  addNozzle(g, 0, 0, 0.52, [spsMat]);

  return g;
}

function buildSaturnSLA() {
  const g = new THREE.Group();
  const { whiteMat } = getSaturnMaterials();
  const H = PARTS.saturnSLA.height;
  const rBottom = RS_S4B;
  const rTop = RS_SM;

  g.add(mesh(new THREE.CylinderGeometry(rTop, rBottom, H, 64, 1, false), whiteMat, 0, H / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(rBottom + 0.012, rBottom + 0.012, 0.16, 64), whiteMat, 0, 0.08, 0));

  const lmMat = bellMaterial(true);
  g.add(mesh(bellGeometry(0.20, 0.62, 1.05), lmMat, 0, 0.02, 0));
  addNozzle(g, 0, 0, 0.62, [lmMat]);

  return g;
}

function buildSaturnS4B() {
  const g = new THREE.Group();
  const { whiteMat, blackMat } = getSaturnMaterials();
  const H = PARTS.saturnS4B.height;
  const r3 = RS_S4B;

  g.add(mesh(new THREE.CylinderGeometry(r3, r3, H, 64), whiteMat, 0, H / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(r3 + 0.014, r3 + 0.014, 1.10, 64), blackMat, 0, 7.00, 0));
  g.add(mesh(new THREE.CylinderGeometry(r3 + 0.012, r3 + 0.012, 0.18, 64), whiteMat, 0, 0.09, 0));

  for (let i = 0; i < 4; i++) {
    const a = 0.52 + i * Math.PI / 2 + Math.PI / 4;
    const uf = mesh(new THREE.BoxGeometry(0.14, 0.85, 0.20), whiteMat, Math.sin(a) * (r3 + 0.025), 0.60, Math.cos(a) * (r3 + 0.025));
    uf.rotation.y = a;
    g.add(uf);
  }

  const j2Mat = bellMaterial(true);
  g.add(mesh(bellGeometry(0.24, 0.78, 1.45), j2Mat, 0, 0.02, 0));
  addNozzle(g, 0, 0, 0.78, [j2Mat]);

  return g;
}

function buildSaturnS4BInter() {
  const g = new THREE.Group();
  const { whiteMat, blackMat } = getSaturnMaterials();
  const hFrustum = PARTS.saturnS4BInter.height;
  const r3 = RS_S4B;
  const th0 = 0.52;

  g.add(mesh(new THREE.CylinderGeometry(r3, RS, hFrustum, 72, 1, false), whiteMat, 0, hFrustum / 2, 0));

  const yBotBlk = 0.44;
  const yTopBlk = hFrustum - 0.16;
  const yMidBlk = yBotBlk + (yTopBlk - yBotBlk) * 0.46;
  const rAt = (y) => RS + (r3 - RS) * (y / hFrustum) + 0.014;

  for (let i = 0; i < 2; i++) {
    const baseAng = th0 + i * Math.PI - 0.92;
    const fullH = yTopBlk - yBotBlk;
    g.add(mesh(new THREE.CylinderGeometry(rAt(yTopBlk), rAt(yBotBlk), fullH, 36, 1, true, baseAng, 1.12), blackMat, 0, (yTopBlk + yBotBlk) / 2, 0));
    const stepH = yTopBlk - yMidBlk;
    g.add(mesh(new THREE.CylinderGeometry(rAt(yTopBlk), rAt(yMidBlk), stepH, 24, 1, true, baseAng + 1.12, 0.46), blackMat, 0, (yTopBlk + yMidBlk) / 2, 0));
  }

  g.add(mesh(new THREE.CylinderGeometry(RS + 0.016, RS + 0.016, 0.38, 72), whiteMat, 0, 0.19, 0));

  for (const [x, z] of [[0.68, 0.68], [-0.68, 0.68], [0.68, -0.68], [-0.68, -0.68]]) {
    const m = bellMaterial(true);
    g.add(mesh(bellGeometry(0.12, 0.32, 0.68), m, x, 0.02, z));
    addNozzle(g, x, z, 0.32, [m]);
  }

  return g;
}

function buildSaturnS2() {
  const g = new THREE.Group();
  const { whiteMat, s2DecalMat } = getSaturnMaterials();
  const H = PARTS.saturnS2.height;

  g.add(mesh(new THREE.CylinderGeometry(RS, RS, H, 72, 1, false), whiteMat, 0, H / 2, 0));
  for (const ry of [0.16, H * 0.5, H - 0.18]) {
    g.add(mesh(new THREE.CylinderGeometry(RS + 0.016, RS + 0.016, 0.24, 72), whiteMat, 0, ry, 0));
  }

  const arcSpan = 0.92;
  for (const rotY of [0, Math.PI]) {
    const decGeo = new THREE.CylinderGeometry(RS + 0.012, RS + 0.012, 7.6, 36, 1, true, -arcSpan * 0.5, arcSpan);
    const decMesh = mesh(decGeo, s2DecalMat, 0, H * 0.52, 0);
    decMesh.rotation.y = rotY;
    g.add(decMesh);
  }

  for (const [x, z] of [[0, 0], [0.78, 0.78], [-0.78, 0.78], [0.78, -0.78], [-0.78, -0.78]]) {
    const m = bellMaterial();
    g.add(mesh(bellGeometry(0.18, 0.54, 1.15), m, x, 0.02, z));
    addNozzle(g, x, z, 0.54, [m]);
  }

  return g;
}

function buildSaturnS2Inter() {
  const g = new THREE.Group();
  const { whiteMat, blackMat } = getSaturnMaterials();
  const H = PARTS.saturnS2Inter.height;
  const th0 = 0.52;

  g.add(mesh(new THREE.CylinderGeometry(RS, RS, H, 72, 1, false), whiteMat, 0, H / 2, 0));

  for (let i = 0; i < 2; i++) {
    const base = th0 + i * Math.PI;
    for (const [sOff, sLen] of [[-0.90, 0.68], [0.16, 0.44], [0.84, 0.46]]) {
      const vBlk = new THREE.CylinderGeometry(RS + 0.014, RS + 0.014, 3.30, 24, 1, true, base + sOff, sLen);
      g.add(mesh(vBlk, blackMat, 0, 0.65 + 1.65, 0));
    }
    const hBand = new THREE.CylinderGeometry(RS + 0.014, RS + 0.014, 0.36, 36, 1, true, base - 0.90, 1.50);
    g.add(mesh(hBand, blackMat, 0, 4.30, 0));
  }

  for (const ry of [0.16, 0.56, H - 0.14]) {
    g.add(mesh(new THREE.CylinderGeometry(RS + 0.016, RS + 0.016, 0.22, 72), whiteMat, 0, ry, 0));
  }

  for (const [x, z] of [[0.82, 0.82], [-0.82, 0.82], [0.82, -0.82], [-0.82, -0.82]]) {
    const m = bellMaterial();
    g.add(mesh(bellGeometry(0.14, 0.38, 0.78), m, x, 0.02, z));
    addNozzle(g, x, z, 0.38, [m]);
  }

  return g;
}

function buildSaturnS1() {
  const g = new THREE.Group();
  const { whiteMat, blackMat, s1FlagsDecalMat, s1UsaStripMat } = getSaturnMaterials();
  const H = PARTS.saturnS1.height;
  const engH = 1.95;
  const bodyH = H - engH;
  const stripeH = 5.65;
  const th0 = 0.52;

  g.add(mesh(new THREE.CylinderGeometry(RS, RS, bodyH, 72, 1, false), whiteMat, 0, engH + bodyH / 2, 0));

  for (let i = 0; i < 4; i++) {
    const a = th0 + Math.PI / 4 + i * Math.PI / 2;
    const blkStripe = new THREE.CylinderGeometry(RS + 0.014, RS + 0.014, stripeH, 24, 1, true, a - 0.42, 0.84);
    g.add(mesh(blkStripe, blackMat, 0, engH + stripeH / 2, 0));
  }

  const flagArc = 1.68;
  for (const rotY of [0, Math.PI]) {
    const flagGeo = new THREE.CylinderGeometry(RS + 0.012, RS + 0.012, 3.20, 40, 1, true, -flagArc * 0.5, flagArc);
    const flagMesh = mesh(flagGeo, s1FlagsDecalMat, 0, 11.45, 0);
    flagMesh.rotation.y = rotY;
    g.add(flagMesh);
  }

  for (let i = 0; i < 4; i++) {
    const a = th0 + i * Math.PI / 2;
    const usaGeo = new THREE.CylinderGeometry(RS + 0.016, RS + 0.016, stripeH * 0.86, 20, 1, true, a - 0.22, 0.44);
    g.add(mesh(usaGeo, s1UsaStripMat, 0, engH + stripeH * 0.46, 0));
  }

  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0.06);
  finShape.lineTo(1.38, -0.18);
  finShape.lineTo(1.38, 0.48);
  finShape.lineTo(0, 2.15);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.075,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.016,
    bevelSegments: 2,
  });
  finGeo.translate(0, 0, -0.0375);

  for (let i = 0; i < 4; i++) {
    const a = th0 + Math.PI / 4 + i * Math.PI / 2;
    const pivot = new THREE.Group();
    pivot.rotation.y = Math.PI / 2 - a;
    g.add(pivot);

    const fairing = mesh(new THREE.CylinderGeometry(0.10, 0.62, 3.10, 32), blackMat, RS - 0.06, engH + 1.58, 0);
    fairing.rotation.z = 0.13;
    pivot.add(fairing);
    pivot.add(mesh(new THREE.CylinderGeometry(0.64, 0.68, 0.24, 32), whiteMat, RS + 0.14, engH + 0.12, 0));
    pivot.add(mesh(finGeo, whiteMat, RS + 0.22, engH + 0.08, 0));
  }

  const f1Positions = [[0, 0]];
  for (let i = 0; i < 4; i++) {
    const a = th0 + Math.PI / 4 + i * Math.PI / 2;
    f1Positions.push([Math.sin(a) * 1.32, Math.cos(a) * 1.32]);
  }
  for (const [x, z] of f1Positions) {
    const mUpper = bellMaterial(false);
    const mLower = bellMaterial(true);
    g.add(mesh(bellGeometry(0.26, 0.68, engH, 40, 0.42, 1.0), mUpper, x, 0, z));
    g.add(mesh(bellGeometry(0.26, 0.68, engH, 40, 0.0, 0.42), mLower, x, 0, z));
    g.add(mesh(new THREE.TorusGeometry(0.50, 0.045, 10, 32).rotateX(Math.PI / 2), MAT.copper, x, engH * 0.42, z));
    addNozzle(g, x, z, 0.68, [mUpper, mLower]);
  }

  return g;
}

// ---------------------------------------------------------------- SOYUZ / R-7 SEMYORKA AUTHENTIC PARTS
let _soyuzMats = null;
function getSoyuzMaterials() {
  if (_soyuzMats) return _soyuzMats;
  const panel = TX.panelTextures();
  // Crisp white-silver for payload fairing (albedo kept below 1.0 bloom threshold under sun.intensity=7.0)
  const whiteMat = physical({
    color: 0xa6acb6,
    roughness: 0.90,
    roughnessMap: panel.rough,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.22, 0.22),
    metalness: 0.06,
    clearcoat: 0.0,
  });
  // Authentic Soviet R-7 olive-drab khaki-green
  const oliveMat = physical({
    color: 0x7e8063,
    roughness: 0.86,
    roughnessMap: panel.rough,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.32, 0.32),
    metalness: 0.08,
    clearcoat: 0.0,
  });
  // Darker olive-grey for structural rings, ribs, waffle frames & open interstage truss
  const darkOliveMat = physical({
    color: 0x5c5e47,
    roughness: 0.84,
    metalness: 0.14,
    clearcoat: 0.0,
  });
  // Vibrant Soviet aerospace orange for engine skirts, Block I band & fairing collar
  const orangeMat = physical({
    color: 0xde7419,
    roughness: 0.74,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.20, 0.20),
    metalness: 0.06,
    clearcoat: 0.05,
  });
  // Metallic silver-grey for heat-shield cutouts, Block I corrugated radiator & umbilical fittings
  const silverMat = physical({
    color: 0x9aa2b0,
    roughness: 0.46,
    metalness: 0.52,
    clearcoat: 0.05,
  });
  const darkPortMat = physical({
    color: 0x454842,
    roughness: 0.75,
    metalness: 0.25,
  });
  _soyuzMats = { whiteMat, oliveMat, darkOliveMat, orangeMat, silverMat, darkPortMat };
  return _soyuzMats;
}

const R_SOYUZ_FAIR = 2.02;   // Payload fairing outer radius
const R_SOYUZ_BLKI = 1.80;   // Block I & upper Block A radius
const R_SOYUZ_WAIST = 1.32;  // Block A narrow waist where the 4 conical booster tips meet

/**
 * Creates a frustum of height `h` whose horizontal cross-sections stay parallel to the XZ plane
 * while shifting radially along +Z from `d0` (at y = -h/2, radius `r0`) to `d1` (at y = +h/2, radius `r1`).
 */
function tiltedFrustumGeo(r0, r1, d0, d1, h, segs = 48, openEnded = false, thetaStart = 0, thetaLength = Math.PI * 2) {
  const geo = new THREE.CylinderGeometry(r1, r0, h, segs, 1, openEnded, thetaStart, thetaLength);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = (y + h / 2) / Math.max(1e-6, h);
    pos.setZ(i, pos.getZ(i) + d0 + (d1 - d0) * t);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

// Stage 5 (Top): Soyuz Bi-Conic / Ogive Nose Cone & Spacecraft Module (H = 5.8m)
function buildSoyuzNose() {
  const g = new THREE.Group();
  const H = PARTS.soyuzNose.height; // 5.8
  const { whiteMat, silverMat, darkPortMat } = getSoyuzMaterials();

  const splitY = 4.25;
  const rMid = 0.74;
  const rTip = 0.07;

  // 1. Lower conical nose section (y = 0 -> 4.25, radius 2.02 -> 0.74)
  const lowerCone = new THREE.CylinderGeometry(rMid, R_SOYUZ_FAIR, splitY, 64);
  g.add(mesh(lowerCone, whiteMat, 0, splitY / 2, 0));

  // Base separation seam ring (y = 0.04) & upper cone seam ring (y = 4.25)
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_FAIR + 0.015, R_SOYUZ_FAIR + 0.015, 0.07, 64), silverMat, 0, 0.035, 0));
  g.add(mesh(new THREE.CylinderGeometry(rMid + 0.016, rMid + 0.016, 0.07, 64), silverMat, 0, splitY, 0));

  // 2. Iconic circular porthole / window ring in the middle of the lower nose cone (y = 2.62 on front +Z & back -Z)
  const portY = 2.62;
  const portRAtY = R_SOYUZ_FAIR + (rMid - R_SOYUZ_FAIR) * (portY / splitY);
  const coneSlope = Math.atan2(R_SOYUZ_FAIR - rMid, splitY);
  for (const sgn of [1, -1]) {
    const portGroup = new THREE.Group();
    portGroup.position.set(0, portY, sgn * (portRAtY + 0.01));
    portGroup.rotation.x = -sgn * coneSlope;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.024, 10, 32), silverMat);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.30, 32), whiteMat);
    glass.position.z = sgn * 0.004;
    if (sgn < 0) glass.rotation.y = Math.PI;
    portGroup.add(ring, glass);
    g.add(portGroup);
  }

  // 3. Upper steeper nose tip cap (y = 4.25 -> 5.74, radius 0.74 -> 0.07) + rounded apex dome
  const tipH = H - splitY - 0.06;
  g.add(mesh(new THREE.CylinderGeometry(rTip, rMid, tipH, 64), whiteMat, 0, splitY + tipH / 2, 0));
  g.add(mesh(new THREE.SphereGeometry(rTip * 1.15, 24, 16), silverMat, 0, H - 0.06, 0));

  // Subtle longitudinal rib lines on the upper nose cap (visible in the drawing!)
  const tipSlope = Math.atan2(rMid - rTip, tipH);
  const ribLen = Math.hypot(tipH, rMid - rTip);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 6;
    const rMidTip = (rMid + rTip) * 0.5;
    const rib = mesh(
      new THREE.CylinderGeometry(0.014, 0.018, ribLen, 8),
      silverMat,
      Math.sin(a) * (rMidTip + 0.008),
      splitY + tipH / 2,
      Math.cos(a) * (rMidTip + 0.008)
    );
    rib.rotation.order = 'YXZ';
    rib.rotation.y = a;
    rib.rotation.x = -tipSlope;
    g.add(rib);
  }

  // Internal Soyuz descent module heatshield & orbital thruster nozzle at y = 0
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_FAIR * 0.85, R_SOYUZ_FAIR * 0.85, 0.14, 48), darkPortMat, 0, 0.07, 0));
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.14, 0.36, 0.50, 32), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.36, [mBell]);
  addParachutes(g, 4.1);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 4: Soyuz Cylindrical White Payload Shroud & Orange Umbilical Collar (H = 5.8m)
function buildSoyuzFairing() {
  const g = new THREE.Group();
  const H = PARTS.soyuzFairing.height; // 5.8
  const { whiteMat, oliveMat, darkOliveMat, orangeMat, silverMat } = getSoyuzMaterials();

  const rCollar = R_SOYUZ_FAIR - 0.12; // 1.90

  // 1. Base olive-drab adapter step (y = 0 -> 0.28, flaring from R_SOYUZ_BLKI=1.80 to rCollar=1.90)
  g.add(mesh(new THREE.CylinderGeometry(rCollar + 0.02, R_SOYUZ_BLKI, 0.28, 64), oliveMat, 0, 0.14, 0));
  g.add(mesh(new THREE.CylinderGeometry(rCollar + 0.04, rCollar + 0.04, 0.08, 64), darkOliveMat, 0, 0.26, 0));
  // Protruding olive-grey side lugs at y = 0.14
  for (const sgn of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.20, 0.24, 0.38), darkOliveMat, sgn * (rCollar + 0.02), 0.14, 0));
  }

  // 2. Bright Soviet Orange Collar Band (y = 0.28 -> 1.18, radius = rCollar)
  const orangeH = 0.90;
  g.add(mesh(new THREE.CylinderGeometry(rCollar, rCollar, orangeH, 64), orangeMat, 0, 0.28 + orangeH / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(rCollar + 0.02, rCollar + 0.02, 0.06, 64), darkOliveMat, 0, 1.18, 0));

  // Two prominent vertical white/silver cylindrical umbilical tubes on the front-left of the orange collar (exact match to image!)
  for (const [ox, oz] of [
    [-0.74, rCollar - 0.10],
    [-0.32, rCollar - 0.01],
    [-0.74, -(rCollar - 0.10)],
    [-0.32, -(rCollar - 0.01)],
  ]) {
    g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.18, 20), whiteMat, ox, 0.72, oz));
    g.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.10, 20), silverMat, ox, 1.28, oz));
    g.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.10, 20), darkOliveMat, ox, 0.16, oz));
  }

  // Circular port ring on the front-right of the orange collar (x = 0.42, y = 0.72)
  for (const sgn of [1, -1]) {
    const pRing = mesh(new THREE.TorusGeometry(0.22, 0.028, 10, 28), darkOliveMat, 0.42, 0.72, sgn * (rCollar - 0.01));
    g.add(pRing);
  }

  // Two protruding white/silver external side fairing brackets ([ ]) on left & right profiles (x = +/- (rCollar + 0.08))
  for (const sgn of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.16, 1.08, 0.30), whiteMat, sgn * (rCollar + 0.07), 0.76, 0));
    g.add(mesh(new THREE.BoxGeometry(0.26, 0.14, 0.34), silverMat, sgn * (rCollar + 0.09), 1.26, 0));
    g.add(mesh(new THREE.BoxGeometry(0.26, 0.14, 0.34), silverMat, sgn * (rCollar + 0.09), 0.28, 0));
  }

  // 3. Stepped white shoulder (y = 1.18 -> 1.34, flaring from rCollar to R_SOYUZ_FAIR = 2.02)
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_FAIR, rCollar, 0.16, 64), whiteMat, 0, 1.26, 0));

  // 4. Main Cylindrical White-Silver Payload Shroud (y = 1.34 -> 5.80, radius = 2.02)
  const shroudH = H - 1.34;
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_FAIR, R_SOYUZ_FAIR, shroudH, 64), whiteMat, 0, 1.34 + shroudH / 2, 0));

  // Subtle vertical fairing split-seam strips on left & right (+/- X)
  for (const sgn of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.03, shroudH, 0.06), silverMat, sgn * (R_SOYUZ_FAIR + 0.008), 1.34 + shroudH / 2, 0));
  }

  // Spacecraft engine bell at y = 0 for Stage 4 propulsion
  const mBell = bellMaterial(false);
  g.add(mesh(bellGeometry(0.18, 0.44, 0.55, 32), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.44, [mBell]);

  return g;
}

// Stage 3: Soyuz Block I Upper Stage (Olive Tank + Corrugated Silver Radiator + Toothed Orange Band, H = 5.4m)
function buildSoyuzBlockI() {
  const g = new THREE.Group();
  const H = PARTS.soyuzBlockI.height; // 5.4
  const { oliveMat, darkOliveMat, orangeMat, silverMat } = getSoyuzMaterials();

  // 1. Bottom Orange Skirt Band (y = 0.42 -> 1.88, radius = 1.55)
  const orangeBot = 0.42;
  const orangeTop = 1.88;
  const orangeH = orangeTop - orangeBot;
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_BLKI + 0.01, R_SOYUZ_BLKI + 0.01, orangeH, 64), orangeMat, 0, orangeBot + orangeH / 2, 0));

  // Olive-drab lower structural ring + 16 castellation teeth along the bottom of the orange band (exact match to image!)
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_BLKI, R_SOYUZ_BLKI, 0.42, 64), darkOliveMat, 0, 0.21, 0));
  const toothCount = 16;
  for (let i = 0; i < toothCount; i++) {
    const a = (i / toothCount) * Math.PI * 2;
    const tooth = mesh(
      new THREE.BoxGeometry(0.26, 0.36, 0.08),
      oliveMat,
      Math.sin(a) * (R_SOYUZ_BLKI + 0.015),
      0.56,
      Math.cos(a) * (R_SOYUZ_BLKI + 0.015)
    );
    tooth.rotation.y = a;
    g.add(tooth);
  }

  // Dark olive border ring at top of orange band (y = 1.88)
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_BLKI + 0.03, R_SOYUZ_BLKI + 0.03, 0.10, 64), darkOliveMat, 0, orangeTop, 0));

  // 2. Corrugated Silver-Grey Radiator Collar (y = 1.92 -> 3.16, radius = 1.61)
  const radBot = 1.92;
  const radTop = 3.16;
  const radH = radTop - radBot;
  const rRad = R_SOYUZ_BLKI + 0.07;
  g.add(mesh(new THREE.CylinderGeometry(rRad, rRad, radH, 64), silverMat, 0, radBot + radH / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(rRad + 0.02, rRad + 0.02, 0.10, 64), silverMat, 0, radBot + 0.05, 0));
  g.add(mesh(new THREE.CylinderGeometry(rRad + 0.02, rRad + 0.02, 0.10, 64), silverMat, 0, radTop - 0.05, 0));

  // 36 vertical corrugation ribs around the silver radiator collar
  const ribCount = 36;
  const ribGeos = [];
  for (let i = 0; i < ribCount; i++) {
    const a = (i / ribCount) * Math.PI * 2;
    const rb = new THREE.BoxGeometry(0.055, radH - 0.16, 0.055);
    rb.translate(0, 0, rRad + 0.02);
    rb.rotateY(a);
    rb.translate(0, radBot + radH / 2, 0);
    ribGeos.push(rb);
  }
  g.add(mesh(mergeGeometries(ribGeos), darkOliveMat));

  // 3. Upper Olive-Drab Propellant Tank (y = 3.16 -> 5.40, radius = 1.54)
  const tankH = H - radTop;
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_BLKI, R_SOYUZ_BLKI, tankH, 64), oliveMat, 0, radTop + tankH / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_BLKI + 0.025, R_SOYUZ_BLKI + 0.025, 0.12, 64), darkOliveMat, 0, radTop + 0.08, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_BLKI + 0.05, R_SOYUZ_BLKI + 0.05, 0.18, 64), oliveMat, 0, H - 0.09, 0));

  // 4. 4× RD-0110 Engine Bells at the bottom (visible through the open lattice truss of Stage 2!)
  const bellOff = 0.56;
  for (const [x, z] of [[-bellOff, -bellOff], [bellOff, -bellOff], [-bellOff, bellOff], [bellOff, bellOff]]) {
    const mBell = bellMaterial(true);
    g.add(mesh(bellGeometry(0.12, 0.34, 0.72, 32), mBell, x, -0.30, z));
    addNozzle(g, x, z, 0.34, [mBell]);
  }

  return g;
}

// Stage 2: Soyuz Flared Olive-Drab Block A Core + Waffle Grid Band + Open Lattice Interstage Truss (H = 11.2m)
function buildSoyuzCore() {
  const g = new THREE.Group();
  const H = PARTS.soyuzCore.height; // 11.2
  const { oliveMat, darkOliveMat } = getSoyuzMaterials();

  const flareTopY = 7.95;
  const waffleTopY = 9.22;

  // 1. Flared Olive-Drab Block A Core Body (y = 0.0 -> 7.95, flaring from R_SOYUZ_WAIST=1.15 up to R_SOYUZ_BLKI=1.54)
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_BLKI, R_SOYUZ_WAIST, flareTopY, 64), oliveMat, 0, flareTopY / 2, 0));

  // 4 Vertical External Conduit Strips running up the flared Block A hull (0, 90, 180, 270 deg)
  const flareAngle = Math.atan2(R_SOYUZ_BLKI - R_SOYUZ_WAIST, flareTopY);
  const conduitLen = Math.hypot(flareTopY, R_SOYUZ_BLKI - R_SOYUZ_WAIST);
  const rMidCore = (R_SOYUZ_WAIST + R_SOYUZ_BLKI) * 0.5;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const cond = mesh(
      new THREE.BoxGeometry(0.11, conduitLen, 0.08),
      darkOliveMat,
      Math.sin(a) * (rMidCore + 0.025),
      flareTopY / 2,
      Math.cos(a) * (rMidCore + 0.025)
    );
    cond.rotation.order = 'YXZ';
    cond.rotation.y = a;
    cond.rotation.x = flareAngle;
    g.add(cond);
  }

  // 4 Upper Booster Attachment Fairing Brackets at the waist (y = 0.0 -> 1.15)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const brk = mesh(
      new THREE.BoxGeometry(0.24, 1.15, 0.22),
      oliveMat,
      Math.sin(a) * (R_SOYUZ_WAIST + 0.08),
      0.58,
      Math.cos(a) * (R_SOYUZ_WAIST + 0.08)
    );
    brk.rotation.y = a;
    g.add(brk);
  }
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_WAIST + 0.06, R_SOYUZ_WAIST + 0.06, 0.14, 64), darkOliveMat, 0, 0.18, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_WAIST + 0.09, R_SOYUZ_WAIST + 0.09, 0.14, 64), darkOliveMat, 0, 1.05, 0));

  // 2. Recessed Rectangular Waffle-Grid Band (y = 7.95 -> 9.22, radius = 1.54)
  const waffleH = waffleTopY - flareTopY;
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_BLKI - 0.035, R_SOYUZ_BLKI - 0.035, waffleH, 64), darkOliveMat, 0, flareTopY + waffleH / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_BLKI + 0.02, R_SOYUZ_BLKI + 0.02, 0.12, 64), oliveMat, 0, flareTopY + 0.06, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_BLKI + 0.02, R_SOYUZ_BLKI + 0.02, 0.12, 64), oliveMat, 0, waffleTopY - 0.06, 0));

  const waffleCols = 16;
  const wRibGeos = [];
  for (let i = 0; i < waffleCols; i++) {
    const a = (i / waffleCols) * Math.PI * 2;
    const wr = new THREE.BoxGeometry(0.09, waffleH, 0.09);
    wr.translate(0, 0, R_SOYUZ_BLKI - 0.01);
    wr.rotateY(a);
    wr.translate(0, flareTopY + waffleH / 2, 0);
    wRibGeos.push(wr);
  }
  g.add(mesh(mergeGeometries(wRibGeos), oliveMat));

  // 3. Open Diagonal V-Truss Interstage Cage (y = 9.22 -> 11.20)
  const trussH = H - waffleTopY;
  const rTruss = R_SOYUZ_BLKI - 0.02;

  // Conical top dome of the Block A propellant tank inside the lower half of the open truss (visible through the struts!)
  g.add(mesh(new THREE.CylinderGeometry(0.28, R_SOYUZ_BLKI - 0.06, 1.15, 48), oliveMat, 0, waffleTopY + 0.575, 0));

  // Top & mid horizontal rings of the open truss
  g.add(mesh(new THREE.TorusGeometry(rTruss, 0.06, 10, 64).rotateX(Math.PI / 2), oliveMat, 0, H - 0.06, 0));
  g.add(mesh(new THREE.TorusGeometry(rTruss, 0.045, 10, 64).rotateX(Math.PI / 2), darkOliveMat, 0, waffleTopY + trussH * 0.56, 0));

  // 12 V-pairs (24 diagonal tubular struts) forming the iconic open Soyuz interstage cage
  const nPairs = 12;
  const dAng = (Math.PI * 2) / (nPairs * 2);
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), mid = new THREE.Vector3(), dir = new THREE.Vector3();
  const upVec = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < nPairs * 2; i++) {
    const a0 = i * dAng;
    const a1 = (i + 1) * dAng;
    const yBot = waffleTopY + 0.04;
    const yTop = H - 0.06;
    const yA = i % 2 === 0 ? yBot : yTop;
    const yB = i % 2 === 0 ? yTop : yBot;
    p0.set(Math.sin(a0) * rTruss, yA, Math.cos(a0) * rTruss);
    p1.set(Math.sin(a1) * rTruss, yB, Math.cos(a1) * rTruss);
    const len = p0.distanceTo(p1);
    mid.addVectors(p0, p1).multiplyScalar(0.5);
    dir.subVectors(p1, p0).normalize();
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, len, 10), oliveMat);
    strut.position.copy(mid);
    strut.quaternion.setFromUnitVectors(upVec, dir);
    g.add(strut);
  }

  // 4. RD-108 Sustainer Engine Bells at y = 0 (active when Stage 1 boosters separate!)
  const bellOff = 0.45;
  for (const [x, z] of [[-bellOff, -bellOff], [bellOff, -bellOff], [-bellOff, bellOff], [bellOff, bellOff]]) {
    const mBell = bellMaterial(false);
    g.add(mesh(bellGeometry(0.14, 0.34, 0.70, 32), mBell, x, 0, z));
    addNozzle(g, x, z, 0.34, [mBell]);
  }

  return g;
}

// Stage 1 (Bottom): Soyuz 4× Conical Strap-On Boosters (Block B, V, G, D) + Central Core Base & 20 Engine Bells (H = 19.8m)
function buildSoyuzBooster() {
  const g = new THREE.Group();
  const H = PARTS.soyuzBooster.height; // 19.8
  const { oliveMat, darkOliveMat, orangeMat, silverMat, darkPortMat } = getSoyuzMaterials();

  const yNozzle = 0.85;    // Height of the 20 metallic RD-107/108 engine bells at the very bottom
  const yOrange = 3.65;    // Top of the bright Soviet orange base skirt
  const yRibbed = 4.25;    // Top of the ribbed dark-olive transition band
  const yMidRing = 7.15;   // Mid-booster double structural ring
  const yConeBreak = 15.60; // Transition to steeper upper booster nose cone
  const yTip = 19.65;      // Pointed tip of the 4 conical boosters meeting the core waist

  // =========================================================================
  // A. CENTRAL BLOCK A LOWER TRUNK (nestled inside the 4 strap-on boosters)
  // =========================================================================
  // 1. Central Core Orange Skirt (y = 0.85 -> 3.65, radius = 1.54)
  const cOrangeH = yOrange - yNozzle;
  g.add(mesh(new THREE.CylinderGeometry(1.54, 1.56, cOrangeH, 48), orangeMat, 0, yNozzle + cOrangeH / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.58, 1.58, 0.10, 48), darkOliveMat, 0, yNozzle + 0.05, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.56, 1.56, 0.08, 48), darkOliveMat, 0, yOrange, 0));

  // 2. Central Core Ribbed Olive Band (y = 3.65 -> 4.25)
  g.add(mesh(new THREE.CylinderGeometry(1.50, 1.54, yRibbed - yOrange, 48), darkOliveMat, 0, (yOrange + yRibbed) / 2, 0));

  // 3. Central Core Olive-Drab Trunk (y = 4.25 -> 19.80, tapering to R_SOYUZ_WAIST = 1.32)
  g.add(mesh(new THREE.CylinderGeometry(R_SOYUZ_WAIST, 1.50, H - yRibbed, 48), oliveMat, 0, yRibbed + (H - yRibbed) / 2, 0));

  // Central Core RD-108 4-Chamber Engine Cluster at y = 0 -> 0.85
  for (const [cx, cz] of [[-0.50, -0.50], [0.50, -0.50], [-0.50, 0.50], [0.50, 0.50]]) {
    const mBell = bellMaterial(true);
    g.add(mesh(bellGeometry(0.14, 0.34, yNozzle, 32), mBell, cx, 0, cz));
    g.add(mesh(new THREE.CylinderGeometry(0.35, 0.33, 0.12, 24), silverMat, cx, 0.06, cz));
    addNozzle(g, cx, cz, 0.34, [mBell]);
  }

  // =========================================================================
  // B. 4× SHEARED/TILTED CONICAL STRAP-ON BOOSTERS (Block B, V, G, D at 0, 90, 180, 270 deg)
  // =========================================================================
  // Cross-section stations (r = booster radius, d = radial offset from rocket centerline):
  // Note: 2*r > d at st0..st4 ensures zero gap between the front booster and side boosters in front view!
  const st0 = { y: yNozzle, r: 1.56, d: 2.86 };    // Bottom of orange skirt
  const st1 = { y: yOrange, r: 1.50, d: 2.74 };    // Top of orange skirt
  const st2 = { y: yRibbed, r: 1.48, d: 2.70 };    // Top of ribbed collar
  const st3 = { y: yMidRing, r: 1.40, d: 2.54 };   // Mid-body structural ring
  const st4 = { y: yConeBreak, r: 0.94, d: 1.80 }; // Upper cone break ring
  const st5 = { y: yTip, r: 0.05, d: 1.33 };       // Pointed nose tip against central core waist

  // Pre-build the 5 stacked sheared-frustum geometries for a booster along +Z
  const geoOrange = tiltedFrustumGeo(st0.r, st1.r, st0.d, st1.d, st1.y - st0.y, 48);
  const geoRibbed = tiltedFrustumGeo(st1.r, st2.r, st1.d, st2.d, st2.y - st1.y, 48);
  const geoLower = tiltedFrustumGeo(st2.r, st3.r, st2.d, st3.d, st3.y - st2.y, 48);
  const geoMainCone = tiltedFrustumGeo(st3.r, st4.r, st3.d, st4.d, st4.y - st3.y, 48);
  const geoNoseCone = tiltedFrustumGeo(st4.r, st5.r, st4.d, st5.d, st5.y - st4.y, 48);

  // Trapezoidal Soviet Orange Aerodynamic Fin geometry (extends from outer booster wall at y = 0.94 -> 2.40)
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0.0);
  finShape.lineTo(1.36, 0.0);
  finShape.lineTo(1.36, 0.16);
  finShape.lineTo(0, 1.46);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
  finGeo.rotateY(-Math.PI / 2);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2; // i=0: +Z (Front), i=1: +X (Right), i=2: -Z (Back), i=3: -X (Left)
    const bGroup = new THREE.Group();
    bGroup.rotation.y = a;
    g.add(bGroup);

    // 1. Orange Base Skirt (y = 0.85 -> 3.65)
    bGroup.add(mesh(geoOrange, orangeMat, 0, (st0.y + st1.y) / 2, 0));

    // Bottom dark heatshield lip & top orange border ring
    bGroup.add(mesh(tiltedFrustumGeo(st0.r + 0.025, st0.r + 0.025, st0.d, st0.d, 0.10, 48), darkOliveMat, 0, st0.y + 0.05, 0));
    bGroup.add(mesh(tiltedFrustumGeo(st1.r + 0.02, st1.r + 0.02, st1.d, st1.d, 0.09, 48), darkOliveMat, 0, st1.y, 0));

    // Curved Silver-Grey Heat-Shield Cutouts at the bottom of the orange skirt (y = 0.85 -> 2.57)
    const hShieldMax = 1.72;
    const hShieldMin = 0.68;
    const thMin = i === 1 || i === 3 ? 0.96 : 1.48;
    const thMax = 2.65;
    const thLen = thMax - thMin;
    for (const side of [1, -1]) {
      const thStart = side > 0 ? thMin : Math.PI * 2 - thMax;
      const shGeo = new THREE.CylinderGeometry(st0.r + 0.04, st0.r + 0.04, hShieldMax, 32, 1, true, thStart, thLen);
      const pos = shGeo.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        const vx = pos.getX(k);
        const vy = pos.getY(k);
        const vz = pos.getZ(k);
        const th = Math.atan2(vx, vz); // in [-pi, pi]
        const absTh = Math.abs(th);
        // u = 0 at inner seam (|th| >= 2.36) -> u = 1 at outer vertical edge of cutout (|th| = thMin)
        const u = Math.min(1, Math.max(0, (2.36 - absTh) / (2.36 - thMin)));
        const localTopH = hShieldMin + (hShieldMax - hShieldMin) * Math.pow(1 - u, 1.35);
        const isTop = vy > 0;
        const actualH = isTop ? localTopH : 0;
        const fracSkirt = actualH / (st1.y - st0.y);
        const rAtH = (st0.r + (st1.r - st0.r) * fracSkirt) + 0.04;
        const dAtH = st0.d + (st1.d - st0.d) * fracSkirt;
        pos.setXYZ(k, Math.sin(th) * rAtH, st0.y + actualH, Math.cos(th) * rAtH + dAtH);
      }
      pos.needsUpdate = true;
      shGeo.computeVertexNormals();
      bGroup.add(new THREE.Mesh(shGeo, silverMat));

      // Vertical seam line inside the silver heat-shield cutout
      const thSeam = side * (thMin + (2.36 - thMin) * 0.48);
      const hSeam = 1.22;
      const fracSeam = (hSeam * 0.5) / (st1.y - st0.y);
      const rSeam = st0.r + (st1.r - st0.r) * fracSeam + 0.046;
      const dSeam = st0.d + (st1.d - st0.d) * fracSeam;
      bGroup.add(
        mesh(
          new THREE.BoxGeometry(0.035, hSeam, 0.035),
          darkOliveMat,
          Math.sin(thSeam) * rSeam,
          st0.y + hSeam * 0.5,
          Math.cos(thSeam) * rSeam + dSeam
        )
      );
    }

    // Silver Rectangular Access Box & L-shaped Orange Pressurization Conduit on the orange skirt (matching drawing!)
    bGroup.add(mesh(new THREE.BoxGeometry(0.48, 0.40, 0.08), silverMat, 0.38, yNozzle + 1.85, st0.d + st0.r - 0.03));
    bGroup.add(mesh(new THREE.BoxGeometry(0.42, 0.34, 0.08), darkPortMat, 0.38, yNozzle + 1.85, st0.d + st0.r - 0.02));
    // Vertical centerline panel seam on the orange skirt
    bGroup.add(mesh(new THREE.BoxGeometry(0.035, st1.y - st0.y, 0.04), darkOliveMat, 0.0, (st0.y + st1.y) / 2, st0.d + st0.r - 0.04));
    // Horizontal & vertical conduit rib on the orange skirt
    bGroup.add(mesh(new THREE.BoxGeometry(1.32, 0.09, 0.09), orangeMat, 0.0, yNozzle + 1.32, st0.d + st0.r - 0.01));
    bGroup.add(mesh(new THREE.BoxGeometry(0.11, 0.58, 0.09), orangeMat, -0.60, yNozzle + 1.48, st0.d + st0.r - 0.01));

    // Trapezoidal Orange Aerodynamic Fin sticking out from the outer booster skirt (z = st0.d + st0.r)
    bGroup.add(mesh(finGeo, orangeMat, 0, yNozzle + 0.10, st0.d + st0.r - 0.06));
    bGroup.add(mesh(new THREE.BoxGeometry(0.10, 0.12, 1.38), darkOliveMat, 0, yNozzle + 0.08, st0.d + st0.r + 0.60));

    // 2. Ribbed Olive Transition Collar (y = 3.65 -> 4.25)
    bGroup.add(mesh(geoRibbed, darkOliveMat, 0, (st1.y + st2.y) / 2, 0));
    bGroup.add(mesh(tiltedFrustumGeo(st2.r + 0.02, st2.r + 0.02, st2.d, st2.d, 0.08, 48), oliveMat, 0, st2.y, 0));

    // 3. Lower Olive-Drab Booster Barrel (y = 4.25 -> 7.15)
    bGroup.add(mesh(geoLower, oliveMat, 0, (st2.y + st3.y) / 2, 0));

    // Dark Circular Port on the front booster at y = 6.05 (exact match to drawing!)
    if (i === 0 || i === 2) {
      const tPort = (6.05 - st2.y) / (st3.y - st2.y);
      const rP = st2.r + (st3.r - st2.r) * tPort;
      const dP = st2.d + (st3.d - st2.d) * tPort;
      const port = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 24).rotateX(Math.PI / 2), darkPortMat, -0.20, 6.05, dP + rP - 0.01);
      bGroup.add(port);
    }

    // Double Horizontal Structural Ring with small rectangular lugs at y = 6.95 & 7.22
    for (const ry of [st3.y - 0.18, st3.y + 0.08]) {
      const tR = (ry - st2.y) / (st3.y - st2.y);
      const rRing = st2.r + (st3.r - st2.r) * tR;
      const dRing = st2.d + (st3.d - st2.d) * tR;
      bGroup.add(mesh(tiltedFrustumGeo(rRing + 0.026, rRing + 0.026, dRing, dRing, 0.09, 48), darkOliveMat, 0, ry, 0));
    }
    for (const lx of [-0.75, 0, 0.75]) {
      const oz = Math.sqrt(Math.max(0.1, st3.r * st3.r - lx * lx));
      bGroup.add(mesh(new THREE.BoxGeometry(0.13, 0.24, 0.08), silverMat, lx, st3.y - 0.05, st3.d + oz + 0.01));
    }

    // 4. Main Sweeping Conical Booster Body (y = 7.15 -> 15.60)
    bGroup.add(mesh(geoMainCone, oliveMat, 0, (st3.y + st4.y) / 2, 0));
    bGroup.add(mesh(tiltedFrustumGeo(st4.r + 0.024, st4.r + 0.024, st4.d, st4.d, 0.10, 48), darkOliveMat, 0, st4.y, 0));

    // 5. Steeper Upper Conical Nose Cap (y = 15.60 -> 19.65)
    bGroup.add(mesh(geoNoseCone, oliveMat, 0, (st4.y + st5.y) / 2, 0));
    bGroup.add(mesh(new THREE.SphereGeometry(0.08, 16, 12), darkOliveMat, 0, st5.y, st5.d));

    // Upper tip aerodynamic attachment strut & collar bands (y = 18.5 -> 19.75)
    bGroup.add(mesh(new THREE.BoxGeometry(0.15, 1.35, 0.22), oliveMat, 0, st5.y - 0.45, st5.d + 0.10));
    bGroup.add(mesh(new THREE.BoxGeometry(0.24, 0.12, 0.28), darkOliveMat, 0, st5.y - 0.05, st5.d + 0.10));
    bGroup.add(mesh(new THREE.BoxGeometry(0.24, 0.12, 0.28), darkOliveMat, 0, st5.y - 0.85, st5.d + 0.14));

    // 6. 4× RD-107 Metallic Engine Bells + 2 Outer Vernier Nozzles under each Booster (y = 0 -> 0.85)
    const engCluster = [
      [-0.48, st0.d - 0.36],
      [0.48, st0.d - 0.36],
      [-0.48, st0.d + 0.44],
      [0.48, st0.d + 0.44],
    ];
    for (const [ex, ez] of engCluster) {
      const mBell = bellMaterial(false);
      bGroup.add(mesh(bellGeometry(0.13, 0.32, yNozzle, 28), mBell, ex, 0, ez));
      bGroup.add(mesh(new THREE.CylinderGeometry(0.33, 0.31, 0.14, 24), silverMat, ex, 0.07, ez));
      // Convert local (ex, ez) rotated by `a` to world nozzle coords on `g`
      const wx = ex * Math.cos(a) + ez * Math.sin(a);
      const wz = -ex * Math.sin(a) + ez * Math.cos(a);
      addNozzle(g, wx, wz, 0.32, [mBell]);
    }
    // 2 small outboard vernier thrusters on the outer edge of each booster
    for (const vx of [-0.30, 0.30]) {
      const vz = st0.d + st0.r - 0.14;
      bGroup.add(mesh(bellGeometry(0.06, 0.15, yNozzle * 0.78, 20), darkPortMat, vx, 0.08, vz));
      bGroup.add(mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.28, 16), darkOliveMat, vx, yNozzle * 0.78, vz));
    }
  }

  return g;
}

// =========================================================================
// SOVIET N1-L3 SUPER HEAVY MOON ROCKET (5 STAGES)
// =========================================================================
let _n1Mats = null;
function getN1Materials() {
  if (_n1Mats) return _n1Mats;
  const panel = TX.panelTextures();
  // Semi-gloss white for the upper L3 lunar payload shroud & SAS launch escape tower (balanced for outdoor bloom)
  const whiteMat = physical({
    color: 0xb4b8c2,
    roughness: 0.78,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.18, 0.18),
    metalness: 0.05,
    clearcoat: 0.06,
    clearcoatRoughness: 0.40,
  });
  // Signature glossy metallic gunmetal/slate grey of the N1 booster stages (Block A, B, V)
  const greyMat = physical({
    color: 0x6d7077,
    roughness: 0.34,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.20, 0.20),
    metalness: 0.48,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
  });
  // Darker charcoal-gunmetal for internal spherical tanks, structural rings & recessed vents
  const darkGreyMat = physical({
    color: 0x3f4147,
    roughness: 0.50,
    metalness: 0.45,
    clearcoat: 0.22,
  });
  // Dark crimson/maroon for the SAS escape motor nozzle skirt near the top tip
  const crimsonMat = physical({
    color: 0x6b1b19,
    roughness: 0.42,
    metalness: 0.28,
    clearcoat: 0.35,
  });
  // Bright chrome/silver for engine bells, base hub & fittings
  const chromeMat = physical({
    color: 0xd4d8e0,
    roughness: 0.20,
    metalness: 0.90,
  });
  // Warm bronze/copper for the 30 NK-15 engine bells at the base
  const bronzeMat = physical({
    color: 0xb67a4b,
    roughness: 0.28,
    metalness: 0.85,
  });
  _n1Mats = { whiteMat, greyMat, darkGreyMat, crimsonMat, chromeMat, bronzeMat };
  return _n1Mats;
}

// Continuous conical radius profile of the N1-L3 from base to fairing
const R_N1_BASE = 4.65;    // Flared base skirt bottom lip (Stage 1)
const R_N1_WAIST = 3.84;   // Grid-fin waist collar (Stage 1)
const R_N1_A_MID = 3.80;   // Base of the 10 large blisters on Stage 1
const R_N1_A_TOP = 3.26;   // Top of Stage 1 (Block A) / Bottom of Stage 2 Truss
const R_N1_B_BOT = 2.94;   // Top of Stage 2 Truss / Bottom of Stage 2 (Block B) Hull
const R_N1_V_BOT = 2.52;   // Top of Stage 2 (Block B) / Bottom of Stage 3 (Block V)
const R_N1_V_MID = 2.12;   // Top of Stage 3 (Block V) Hull / Bottom of Upper Truss
const R_N1_V_TOP = 1.94;   // Top of Upper Truss / Bottom of Stage 4 White Skirt
const R_N1_L3_CYL = 1.60;  // Cylindrical White L3 Payload Shroud radius

/**
 * Adds a 2-tier conical open diagonal V-truss interstage cage between yBot (rBot) and yTop (rTop).
 */
function addN1LatticeTruss(g, yBot, yTop, rBot, rTop, nPairs, strutR, greyMat, darkGreyMat) {
  const yMid = (yBot + yTop) * 0.5;
  const rMid = (rBot + rTop) * 0.5;

  // Horizontal structural rings at bottom, middle, and top of the 2-tier truss
  g.add(mesh(new THREE.CylinderGeometry(rBot + 0.03, rBot + 0.03, 0.18, 64, 1, true), greyMat, 0, yBot + 0.09, 0));
  g.add(mesh(new THREE.TorusGeometry(rMid, strutR * 1.25, 10, 64).rotateX(Math.PI / 2), greyMat, 0, yMid, 0));
  g.add(mesh(new THREE.CylinderGeometry(rTop + 0.03, rTop + 0.03, 0.18, 64, 1, true), greyMat, 0, yTop - 0.09, 0));

  const tiers = [
    { yb: yBot + 0.06, yt: yMid, rb: rBot - 0.01, rt: rMid - 0.01, phase: 0 },
    { yb: yMid, yt: yTop - 0.06, rb: rMid - 0.01, rt: rTop - 0.01, phase: Math.PI / nPairs },
  ];
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), mid = new THREE.Vector3(), dir = new THREE.Vector3();
  const upVec = new THREE.Vector3(0, 1, 0);

  for (const tier of tiers) {
    const dAng = (Math.PI * 2) / (nPairs * 2);
    for (let i = 0; i < nPairs * 2; i++) {
      const a0 = i * dAng + tier.phase;
      const a1 = (i + 1) * dAng + tier.phase;
      const even = i % 2 === 0;
      const yA = even ? tier.yb : tier.yt;
      const rA = even ? tier.rb : tier.rt;
      const yB = even ? tier.yt : tier.yb;
      const rB = even ? tier.rt : tier.rb;
      p0.set(Math.sin(a0) * rA, yA, Math.cos(a0) * rA);
      p1.set(Math.sin(a1) * rB, yB, Math.cos(a1) * rB);
      const len = p0.distanceTo(p1);
      mid.addVectors(p0, p1).multiplyScalar(0.5);
      dir.subVectors(p1, p0).normalize();
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(strutR, strutR, len, 8), greyMat);
      strut.position.copy(mid);
      strut.quaternion.setFromUnitVectors(upVec, dir);
      g.add(strut);
    }
  }

  // Internal recessed dark-grey core & spherical tank dome visible through the open lattice struts
  const hTruss = yTop - yBot;
  g.add(mesh(new THREE.CylinderGeometry(rTop * 0.78, rBot * 0.80, hTruss * 0.92, 48), darkGreyMat, 0, yMid, 0));
  g.add(mesh(new THREE.SphereGeometry(rBot * 0.84, 36, 24), darkGreyMat, 0, yBot + hTruss * 0.28, 0));
}

// Stage 5 (Top): N1 LOK Lunar Spacecraft Shroud & SAS Launch Escape Tower (H = 10.6m)
function buildN1Tower() {
  const g = new THREE.Group();
  const { whiteMat, greyMat, darkGreyMat, crimsonMat, chromeMat } = getN1Materials();

  // 1. Lower conical white fairing section (y = 0.0 -> 4.75, tapering from R_N1_L3_CYL=1.60 to 0.74)
  const yShoulder = 4.75;
  const rShoulder = 0.74;
  g.add(mesh(new THREE.CylinderGeometry(rShoulder, R_N1_L3_CYL, yShoulder, 64), whiteMat, 0, yShoulder / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_N1_L3_CYL + 0.015, R_N1_L3_CYL + 0.015, 0.09, 64), whiteMat, 0, 0.045, 0));
  g.add(mesh(new THREE.CylinderGeometry(rShoulder + 0.012, rShoulder + 0.012, 0.08, 48), whiteMat, 0, yShoulder, 0));

  // Small protruding silver/grey sensor & vent pods on the lower cone (matching reference photo!)
  const slope1 = Math.atan2(R_N1_L3_CYL - rShoulder, yShoulder);
  for (const [ang, py, sx, sy, sz] of [
    [-0.55, 0.58, 0.16, 0.36, 0.14],
    [Math.PI * 0.5, 0.65, 0.14, 0.30, 0.16],
    [-Math.PI * 0.5, 0.42, 0.14, 0.28, 0.16],
    [0.52, 4.35, 0.12, 0.26, 0.12],
    [-Math.PI * 0.48, 4.38, 0.12, 0.26, 0.12],
  ]) {
    const rAtY = R_N1_L3_CYL + (rShoulder - R_N1_L3_CYL) * (py / yShoulder);
    const pod = mesh(new THREE.BoxGeometry(sx, sy, sz), greyMat, Math.sin(ang) * rAtY, py, Math.cos(ang) * rAtY);
    pod.rotation.order = 'YXZ';
    pod.rotation.y = ang;
    pod.rotation.x = -slope1;
    g.add(pod);
  }

  // 2. Upper LOK capsule shroud barrel & conical cap (y = 4.75 -> 7.20)
  const yCapBot = 6.45;
  const rCapBot = 0.58;
  g.add(mesh(new THREE.CylinderGeometry(rCapBot, rShoulder, yCapBot - yShoulder, 48), whiteMat, 0, (yShoulder + yCapBot) / 2, 0));
  // Small protruding blister on upper-left of LOK shroud (visible at y ~ 5.2 in photo!)
  g.add(mesh(new THREE.BoxGeometry(0.12, 0.26, 0.14), greyMat, -0.64, 5.22, 0.18));

  const yMastBot = 7.20;
  const rMast = 0.14;
  g.add(mesh(new THREE.CylinderGeometry(rMast, rCapBot, yMastBot - yCapBot, 48), whiteMat, 0, (yCapBot + yMastBot) / 2, 0));

  // 3. SAS Launch Escape Tower (y = 7.20 -> 10.60)
  const tower = new THREE.Group();
  g.add(tower);
  g.userData.tower = tower;

  // Narrow white escape column (y = 7.20 -> 8.42)
  const yRedBot = 8.42;
  tower.add(mesh(new THREE.CylinderGeometry(0.11, rMast, yRedBot - yMastBot, 32), whiteMat, 0, (yMastBot + yRedBot) / 2, 0));

  // Iconic flared Dark Crimson/Maroon Escape Motor Nozzle Skirt (y = 8.42 -> 8.80, flaring to r = 0.38)
  const yRedTop = 8.80;
  const rRed = 0.38;
  tower.add(mesh(new THREE.CylinderGeometry(0.24, rRed, 0.24, 36), crimsonMat, 0, yRedBot + 0.12, 0));
  tower.add(mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 36), darkGreyMat, 0, yRedTop - 0.07, 0));
  // Ring of 8 tiny angled solid-rocket escape nozzles under the crimson skirt
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const nz = mesh(new THREE.CylinderGeometry(0.028, 0.052, 0.18, 12), darkGreyMat, Math.sin(a) * 0.28, yRedBot - 0.04, Math.cos(a) * 0.28);
    nz.rotation.order = 'YXZ';
    nz.rotation.y = a;
    nz.rotation.x = 0.35;
    tower.add(nz);
  }

  // Upper pointed white solid-rocket nose cone (y = 8.80 -> 10.60)
  const yTip = 10.60;
  tower.add(mesh(new THREE.CylinderGeometry(0.018, 0.24, yTip - yRedTop, 36), whiteMat, 0, (yRedTop + yTip) / 2, 0));

  // Internal LOK spacecraft heatshield & orbital engine at y = 0 + parachutes
  g.add(mesh(new THREE.CylinderGeometry(R_N1_L3_CYL * 0.84, R_N1_L3_CYL * 0.84, 0.14, 48), darkGreyMat, 0, 0.07, 0));
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.14, 0.36, 0.52, 32), mBell, 0, 0, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.37, 0.35, 0.10, 24), chromeMat, 0, 0.05, 0));
  addNozzle(g, 0, 0, 0.36, [mBell]);
  addParachutes(g, 6.0);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 4: N1 White L3 Lunar Payload Shroud (Block G, Block D & LK Lander Fairing, H = 12.0m)
function buildN1Fairing() {
  const g = new THREE.Group();
  const H = PARTS.n1Fairing.height; // 12.0
  const { whiteMat, greyMat, darkGreyMat } = getN1Materials();

  const ySkirtTop = 5.20;

  // 1. Lower Flared White Conical Skirt (y = 0.0 -> 5.20, tapering from R_N1_V_TOP=1.94 to R_N1_L3_CYL=1.60)
  g.add(mesh(new THREE.CylinderGeometry(R_N1_L3_CYL, R_N1_V_TOP, ySkirtTop, 64), whiteMat, 0, ySkirtTop / 2, 0));

  // Horizontal panel rings & rivet dots on the white skirt (y = 0.10, 0.90, 5.16)
  for (const ry of [0.08, 0.88, ySkirtTop - 0.04]) {
    const t = ry / ySkirtTop;
    const rRing = R_N1_V_TOP + (R_N1_L3_CYL - R_N1_V_TOP) * t;
    g.add(mesh(new THREE.CylinderGeometry(rRing + 0.018, rRing + 0.018, 0.08, 64), whiteMat, 0, ry, 0));
  }

  // 10 Raised White Vertical Capsule-Shaped Blisters around the lower white conical skirt (y = 1.15 -> 3.70)
  // Using 10 blisters at (i + 0.5) * 2pi/10 puts blisters right on the left & right silhouette edges (+/- 90 deg) as in the photo!
  const bBot = 1.15;
  const bTop = 3.70;
  const bH = bTop - bBot;
  const bMidY = (bBot + bTop) * 0.5;
  const rMidSkirt = R_N1_V_TOP + (R_N1_L3_CYL - R_N1_V_TOP) * (bMidY / ySkirtTop);
  const skirtSlope = Math.atan2(R_N1_V_TOP - R_N1_L3_CYL, ySkirtTop);
  for (let i = 0; i < 10; i++) {
    const a = (i + 0.5) * ((Math.PI * 2) / 10);
    const bGrp = new THREE.Group();
    bGrp.position.set(Math.sin(a) * rMidSkirt, bMidY, Math.cos(a) * rMidSkirt);
    bGrp.rotation.order = 'YXZ';
    bGrp.rotation.y = a;
    bGrp.rotation.x = -skirtSlope;
    const body = mesh(new THREE.CylinderGeometry(0.15, 0.16, bH, 20), whiteMat, 0, 0, 0.08);
    body.scale.set(1.0, 1.0, 0.90);
    const capT = mesh(new THREE.SphereGeometry(0.15, 16, 12), whiteMat, 0, bH / 2, 0.08);
    capT.scale.set(1.0, 1.6, 0.90);
    const capB = mesh(new THREE.SphereGeometry(0.16, 16, 12), whiteMat, 0, -bH / 2, 0.08);
    capB.scale.set(1.0, 1.6, 0.90);
    // Small dark vent dot at base of blister
    const dot = mesh(new THREE.BoxGeometry(0.12, 0.14, 0.08), darkGreyMat, 0, -bH / 2 - 0.18, 0.02);
    bGrp.add(body, capT, capB, dot);
    g.add(bGrp);
  }

  // 2. Upper Cylindrical White Payload Shroud (y = 5.20 -> 12.00, radius = R_N1_L3_CYL = 1.60)
  const cylH = H - ySkirtTop;
  g.add(mesh(new THREE.CylinderGeometry(R_N1_L3_CYL, R_N1_L3_CYL, cylH, 64), whiteMat, 0, ySkirtTop + cylH / 2, 0));

  // Subtle horizontal seam rings & small side sensor blisters on the cylindrical shroud
  for (const ry of [5.32, 8.60, H - 0.10]) {
    g.add(mesh(new THREE.CylinderGeometry(R_N1_L3_CYL + 0.015, R_N1_L3_CYL + 0.015, 0.07, 64), whiteMat, 0, ry, 0));
  }
  for (const sgn of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.13, 0.32, 0.15), greyMat, sgn * (R_N1_L3_CYL + 0.02), 5.65, 0));
    g.add(mesh(new THREE.BoxGeometry(0.11, 0.26, 0.13), greyMat, sgn * (R_N1_L3_CYL + 0.02), 11.45, 0));
  }

  // Block G/D Engine Bell at y = 0 for Stage 4 propulsion
  g.add(mesh(new THREE.CylinderGeometry(R_N1_V_TOP * 0.82, R_N1_V_TOP * 0.82, 0.16, 48), darkGreyMat, 0, 0.08, 0));
  const mBell = bellMaterial(false);
  g.add(mesh(bellGeometry(0.18, 0.46, 0.65, 32), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.46, [mBell]);

  return g;
}

// Stage 3: N1 Block V Conical Metallic-Grey Stage + Upper 2-Tier Open Lattice Interstage (H = 9.6m)
function buildN1BlockV() {
  const g = new THREE.Group();
  const H = PARTS.n1BlockV.height; // 9.6
  const { greyMat, darkGreyMat } = getN1Materials();

  const yHullTop = 6.60;

  // 1. Main Conical Metallic-Grey Block V Hull (y = 0.0 -> 6.60, tapering from R_N1_V_BOT=2.52 to R_N1_V_MID=2.12)
  g.add(mesh(new THREE.CylinderGeometry(R_N1_V_MID, R_N1_V_BOT, yHullTop, 64), greyMat, 0, yHullTop / 2, 0));

  // Horizontal structural collar rings at bottom, mid-lower, mid-upper, and top of Block V hull
  for (const ry of [0.10, 1.55, 5.10, yHullTop - 0.08]) {
    const t = ry / yHullTop;
    const rAtY = R_N1_V_BOT + (R_N1_V_MID - R_N1_V_BOT) * t;
    g.add(mesh(new THREE.CylinderGeometry(rAtY + 0.024, rAtY + 0.024, 0.10, 64), greyMat, 0, ry, 0));
  }

  // 10 Prominent Raised Half-Round Vertical Conduit Blisters around Block V (y = 1.65 -> 5.05)
  // Using 10 blisters at (i + 0.5) * 2pi/10 places blisters at +/- 18, +/- 54, and +/- 90 deg (breaking the left & right silhouette edges!)
  const bBot = 1.65;
  const bTop = 5.00;
  const bH = bTop - bBot;
  const bMidY = (bBot + bTop) * 0.5;
  const rMidV = R_N1_V_BOT + (R_N1_V_MID - R_N1_V_BOT) * (bMidY / yHullTop);
  const vSlope = Math.atan2(R_N1_V_BOT - R_N1_V_MID, yHullTop);

  for (let i = 0; i < 10; i++) {
    const a = (i + 0.5) * ((Math.PI * 2) / 10);
    const bGrp = new THREE.Group();
    bGrp.position.set(Math.sin(a) * rMidV, bMidY, Math.cos(a) * rMidV);
    bGrp.rotation.order = 'YXZ';
    bGrp.rotation.y = a;
    bGrp.rotation.x = -vSlope;

    const body = mesh(new THREE.CylinderGeometry(0.21, 0.23, bH, 20), greyMat, 0, 0, 0.13);
    body.scale.set(1.05, 1.0, 1.0);
    const capT = mesh(new THREE.SphereGeometry(0.21, 16, 12), greyMat, 0, bH / 2, 0.13);
    capT.scale.set(1.05, 1.8, 1.0);
    const capB = mesh(new THREE.SphereGeometry(0.23, 16, 12), greyMat, 0, -bH / 2, 0.13);
    capB.scale.set(1.05, 1.5, 1.0);
    // Dark recessed vent slot right below each blister (clearly visible in the photo!)
    const vent = mesh(new THREE.BoxGeometry(0.32, 0.34, 0.18), darkGreyMat, 0, -bH / 2 - 0.36, 0.06);
    bGrp.add(body, capT, capB, vent);
    g.add(bGrp);
  }

  // 2. Upper 2-Tier Open Diagonal Lattice Interstage Truss (y = 6.60 -> 9.60, tapering from 2.12 to 1.94)
  addN1LatticeTruss(g, yHullTop, H, R_N1_V_MID, R_N1_V_TOP, 14, 0.062, greyMat, darkGreyMat);

  // 3. 4× NK-21 Engine Bells at y = 0
  const bellOff = 0.78;
  for (const [x, z] of [[-bellOff, -bellOff], [bellOff, -bellOff], [-bellOff, bellOff], [bellOff, bellOff]]) {
    const mBell = bellMaterial(false);
    g.add(mesh(bellGeometry(0.15, 0.38, 0.72, 28), mBell, x, 0, z));
    addNozzle(g, x, z, 0.38, [mBell]);
  }

  return g;
}

// Stage 2: N1 Block B Conical Metallic-Grey Stage + Lower 2-Tier Open Lattice Interstage (H = 11.4m)
function buildN1BlockB() {
  const g = new THREE.Group();
  const H = PARTS.n1BlockB.height; // 11.4
  const { greyMat, darkGreyMat } = getN1Materials();

  const yTrussTop = 4.55;

  // 1. Lower 2-Tier Open Diagonal Lattice Interstage Truss (y = 0.0 -> 4.55, tapering from R_N1_A_TOP=3.26 to R_N1_B_BOT=2.94)
  addN1LatticeTruss(g, 0.0, yTrussTop, R_N1_A_TOP, R_N1_B_BOT, 16, 0.078, greyMat, darkGreyMat);

  // 2. Main Conical Metallic-Grey Block B Hull (y = 4.55 -> 11.40, tapering from R_N1_B_BOT=2.94 to R_N1_V_BOT=2.52)
  const hullH = H - yTrussTop;
  g.add(mesh(new THREE.CylinderGeometry(R_N1_V_BOT, R_N1_B_BOT, hullH, 64), greyMat, 0, yTrussTop + hullH / 2, 0));

  // Triple horizontal ribbed structural bands at bottom (y = 4.65..5.35), middle (y = 7.55..7.95), and top (y = 10.75..11.30)
  for (const ry of [4.68, 4.96, 5.24, 7.62, 7.86, 10.82, 11.08, 11.32]) {
    const t = (ry - yTrussTop) / hullH;
    const rAtY = R_N1_B_BOT + (R_N1_V_BOT - R_N1_B_BOT) * t;
    g.add(mesh(new THREE.CylinderGeometry(rAtY + 0.026, rAtY + 0.026, 0.09, 64), greyMat, 0, ry, 0));
  }

  // Vertical spine & stepped rectangular fairing pods on the flanks of Block B (matching reference photo!)
  const bSlope = Math.atan2(R_N1_B_BOT - R_N1_V_BOT, hullH);
  const rMidB = (R_N1_B_BOT + R_N1_V_BOT) * 0.5;
  const spineLen = Math.hypot(hullH, R_N1_B_BOT - R_N1_V_BOT);
  for (const ang of [0, Math.PI]) {
    const sp = mesh(new THREE.BoxGeometry(0.13, spineLen, 0.14), greyMat, Math.sin(ang) * (rMidB + 0.02), yTrussTop + hullH / 2, Math.cos(ang) * (rMidB + 0.02));
    sp.rotation.order = 'YXZ';
    sp.rotation.y = ang;
    sp.rotation.x = -bSlope;
    g.add(sp);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i + 0.5) * ((Math.PI * 2) / 6);
    const py = 6.95;
    const t = (py - yTrussTop) / hullH;
    const rAtY = R_N1_B_BOT + (R_N1_V_BOT - R_N1_B_BOT) * t;
    const pod = mesh(new THREE.BoxGeometry(0.32, 1.65, 0.28), greyMat, Math.sin(a) * (rAtY + 0.05), py, Math.cos(a) * (rAtY + 0.05));
    pod.rotation.order = 'YXZ';
    pod.rotation.y = a;
    pod.rotation.x = -bSlope;
    g.add(pod);
  }

  // 3. 8× NK-15V Engine Bells arranged in a ring for Stage 2 propulsion
  const engR = 1.65;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const ex = Math.sin(a) * engR;
    const ez = Math.cos(a) * engR;
    const mBell = bellMaterial(false);
    g.add(mesh(bellGeometry(0.14, 0.34, 0.72, 24), mBell, ex, 0, ez));
    addNozzle(g, ex, ez, 0.34, [mBell]);
  }

  return g;
}

// Stage 1 (Bottom): N1 Block A Giant Conical First Stage (10 Heavy Blisters, 4 Braced Grid Fins, Flared Skirt & 30× NK-15 Engines, H = 15.4m)
function buildN1BlockA() {
  const g = new THREE.Group();
  const H = PARTS.n1BlockA.height; // 15.4
  const { greyMat, darkGreyMat, chromeMat, bronzeMat } = getN1Materials();

  const yNozzle = 0.88;     // Height of the 30 metallic NK-15 engine bells at the very bottom
  const yWaist = 2.85;      // Recessed waist collar where the 4 braced stabilizer fins attach
  const yCollarTop = 4.95;  // Top of lower collar / base of the 10 large vertical blisters

  // 1. Flared Conical Base Engine Skirt (y = 0.88 -> 2.85, flaring from R_N1_WAIST=3.84 out to R_N1_BASE=4.65 at bottom)
  const skirtH = yWaist - yNozzle;
  g.add(mesh(new THREE.CylinderGeometry(R_N1_WAIST, R_N1_BASE, skirtH, 72), greyMat, 0, yNozzle + skirtH / 2, 0));
  // Bottom lip ring & waist ring
  g.add(mesh(new THREE.CylinderGeometry(R_N1_BASE + 0.02, R_N1_BASE + 0.02, 0.10, 72), darkGreyMat, 0, yNozzle + 0.05, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_N1_WAIST + 0.03, R_N1_WAIST + 0.03, 0.12, 72), darkGreyMat, 0, yWaist, 0));
  // Dark under-skirt engine bay heatshield plate at y = yNozzle
  g.add(mesh(new THREE.CylinderGeometry(R_N1_BASE - 0.06, R_N1_BASE - 0.06, 0.10, 64), darkGreyMat, 0, yNozzle + 0.05, 0));

  // 2. 4× Truss-Braced Stabilizer Vanes / Grid Fins at the waist (y = 2.85)
  // Placed at +/- pi/2 (left & right profile edges) and +/- 0.44 rad (front-left & front-right) to match the exact photo!
  const finAngles = [
    Math.PI * 0.5,
    -Math.PI * 0.5,
    0.44,
    -0.44,
  ];
  for (const a of finAngles) {
    const fGrp = new THREE.Group();
    fGrp.rotation.y = a;
    g.add(fGrp);

    // Flat aerodynamic vane / grid-fin panel extending radially outward along +Z local, tilted slightly upward
    const vaneLen = 1.78;
    const vane = mesh(new THREE.BoxGeometry(0.72, 0.065, vaneLen), greyMat, 0, yWaist + 0.08, R_N1_WAIST + vaneLen * 0.48);
    vane.rotation.x = -0.11;
    fGrp.add(vane);
    // Outer lattice frame rim on the vane
    const rim = mesh(new THREE.BoxGeometry(0.76, 0.08, 0.11), darkGreyMat, 0, yWaist + 0.18, R_N1_WAIST + vaneLen * 0.95);
    fGrp.add(rim);

    // Pair of diagonal V-support struts bracing the vane from the flared skirt below (y = 2.10 -> 2.90)
    for (const sx of [-0.26, 0.26]) {
      const st = mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.15, 8), chromeMat, sx, yWaist - 0.32, R_N1_WAIST + 0.54);
      st.rotation.x = 0.84;
      fGrp.add(st);
    }
  }

  // 3. Lower Cylindrical/Conical Collar Band (y = 2.85 -> 4.95, radius 3.84 -> 3.80)
  const collarH = yCollarTop - yWaist;
  g.add(mesh(new THREE.CylinderGeometry(R_N1_A_MID, R_N1_WAIST, collarH, 72), greyMat, 0, yWaist + collarH / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_N1_A_MID + 0.03, R_N1_A_MID + 0.03, 0.11, 72), darkGreyMat, 0, yCollarTop, 0));

  // 4. Upper Smooth Metallic-Grey Conical Hull (y = 4.95 -> 15.40, tapering from R_N1_A_MID=3.80 to R_N1_A_TOP=3.26)
  const upperH = H - yCollarTop;
  g.add(mesh(new THREE.CylinderGeometry(R_N1_A_TOP, R_N1_A_MID, upperH, 72), greyMat, 0, yCollarTop + upperH / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_N1_A_TOP + 0.025, R_N1_A_TOP + 0.025, 0.14, 72), greyMat, 0, H - 0.07, 0));

  // Continuous Vertical Center Conduit Spine running down the front (+Z) & back (-Z) of Block A (y = 0.90 -> 15.40)
  const fullSlope = Math.atan2(R_N1_A_MID - R_N1_A_TOP, upperH);
  for (const sgn of [1, -1]) {
    // Lower spine on skirt & collar
    g.add(mesh(new THREE.BoxGeometry(0.14, collarH + skirtH, 0.18), greyMat, 0, yNozzle + (collarH + skirtH) / 2, sgn * (R_N1_WAIST + 0.04)));
    g.add(mesh(new THREE.BoxGeometry(0.055, collarH + skirtH, 0.21), darkGreyMat, 0, yNozzle + (collarH + skirtH) / 2, sgn * (R_N1_WAIST + 0.05)));
    // Upper spine along the main cone
    const rMidU = (R_N1_A_MID + R_N1_A_TOP) * 0.5;
    const sp = mesh(new THREE.BoxGeometry(0.14, upperH, 0.18), greyMat, 0, yCollarTop + upperH / 2, sgn * (rMidU + 0.03));
    sp.rotation.x = -sgn * fullSlope;
    g.add(sp);
  }

  // 5. 10× Massive Raised 3D Faceted Vertical Blister Fairings around Block A (y = 4.05 -> 9.85)
  // Placed at (i + 0.5) * 2pi/10 (+/- 18, +/- 54, +/- 90 deg) so blisters sit right on the left & right silhouette edges AND flank the center spine!
  const blBot = 4.95;
  const blTop = 9.25;
  const blH = blTop - blBot;
  const blMidY = (blBot + blTop) * 0.5;
  const rMidBl = R_N1_A_MID + (R_N1_A_TOP - R_N1_A_MID) * ((blMidY - yCollarTop) / upperH);

  // Pre-build faceted 4-sided prism/pyramid geometries (rotated by pi/4 so faces are flat along X and Z)
  const blBodyGeo = new THREE.CylinderGeometry(0.50, 0.55, blH, 4);
  blBodyGeo.rotateY(Math.PI / 4);
  blBodyGeo.scale(1.08, 1.0, 0.98);

  const blTopCapGeo = new THREE.CylinderGeometry(0.05, 0.50, 0.85, 4);
  blTopCapGeo.rotateY(Math.PI / 4);
  blTopCapGeo.scale(1.08, 1.0, 0.98);

  const blLowerLegGeo = new THREE.CylinderGeometry(0.52, 0.44, 0.92, 4);
  blLowerLegGeo.rotateY(Math.PI / 4);
  blLowerLegGeo.scale(0.88, 1.0, 0.92);

  for (let i = 0; i < 10; i++) {
    const a = (i + 0.5) * ((Math.PI * 2) / 10);
    const bGrp = new THREE.Group();
    bGrp.position.set(Math.sin(a) * rMidBl, blMidY, Math.cos(a) * rMidBl);
    bGrp.rotation.order = 'YXZ';
    bGrp.rotation.y = a;
    bGrp.rotation.x = -fullSlope;

    bGrp.add(mesh(blBodyGeo, greyMat, 0, 0, 0.24));
    bGrp.add(mesh(blTopCapGeo, greyMat, 0, blH / 2 + 0.425, 0.16));
    // Lower rectangular extension leg below the y = 4.95 seam ring down to y = 4.03 (exact match to photo!)
    bGrp.add(mesh(blLowerLegGeo, greyMat, 0, -blH / 2 - 0.46, 0.22));
    // Horizontal dark seam line across the blister at y = 4.95
    bGrp.add(mesh(new THREE.BoxGeometry(0.82, 0.08, 0.62), darkGreyMat, 0, -blH / 2, 0.25));

    g.add(bGrp);

    // Small dark square/cross-shaped recessed vent port on the collar between the blister lower legs (at i * 2pi/10, y = 4.38)
    if (i !== 0 && i !== 5) {
      const aVent = i * ((Math.PI * 2) / 10);
      const vGrp = new THREE.Group();
      vGrp.position.set(Math.sin(aVent) * (R_N1_A_MID + 0.02), 4.38, Math.cos(aVent) * (R_N1_A_MID + 0.02));
      vGrp.rotation.y = aVent;
      vGrp.add(mesh(new THREE.BoxGeometry(0.34, 0.34, 0.14), darkGreyMat, 0, 0, 0));
      vGrp.add(mesh(new THREE.BoxGeometry(0.28, 0.06, 0.18), greyMat, 0, 0, 0.02));
      vGrp.add(mesh(new THREE.BoxGeometry(0.06, 0.28, 0.18), greyMat, 0, 0, 0.02));
      g.add(vGrp);
    }
  }

  // 6. 30× Metallic NK-15 Engine Bells at the Base (y = 0 -> 0.88)
  // Outer ring of 24 NK-15 nozzles (r = 4.04m) + Inner ring of 6 NK-15 nozzles (r = 1.92m) + Central silver hub post
  g.add(mesh(new THREE.CylinderGeometry(0.40, 0.44, yNozzle, 24), chromeMat, 0, yNozzle * 0.5, 0));

  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const ex = Math.sin(a) * 4.04;
    const ez = Math.cos(a) * 4.04;
    g.add(mesh(bellGeometry(0.14, 0.32, yNozzle * 0.78, 20), bronzeMat, ex, 0, ez));
    g.add(mesh(new THREE.CylinderGeometry(0.28, 0.26, yNozzle * 0.38, 20), chromeMat, ex, yNozzle * 0.72, ez));
    g.add(mesh(new THREE.CylinderGeometry(0.26, 0.30, 0.10, 20), darkGreyMat, ex, 0.05, ez));
    if (i % 3 === 0) {
      const mBell = bellMaterial(true);
      addNozzle(g, ex, ez, 0.38, [mBell]);
    }
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const ex = Math.sin(a) * 1.92;
    const ez = Math.cos(a) * 1.92;
    const mBell = bellMaterial(true);
    g.add(mesh(bellGeometry(0.15, 0.35, yNozzle * 0.82, 24), bronzeMat, ex, 0, ez));
    g.add(mesh(new THREE.CylinderGeometry(0.30, 0.28, yNozzle * 0.38, 20), chromeMat, ex, yNozzle * 0.72, ez));
    addNozzle(g, ex, ez, 0.38, [mBell]);
  }

  return g;
}

// =========================================================================
// SOVIET ENERGIA – BURAN SPACE SHUTTLE LAUNCH VEHICLE (3 STAGES)
// =========================================================================
let _buranMats = null;
function getBuranMaterials() {
  if (_buranMats) return _buranMats;
  const panel = TX.panelTextures();
  // Crisp off-white for the Energia core, Zenit booster bodies & Buran upper thermal blankets
  const whiteMat = physical({
    color: 0xc4c9d2,
    roughness: 0.72,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.18, 0.18),
    metalness: 0.04,
    clearcoat: 0.08,
    clearcoatRoughness: 0.38,
  });
  // Signature Soviet Energia cool steel blue-grey for nose cones & outer booster collars
  const blueGreyMat = physical({
    color: 0x7c8ea4,
    roughness: 0.48,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.16, 0.16),
    metalness: 0.16,
    clearcoat: 0.18,
    clearcoatRoughness: 0.30,
  });
  // Darker slate blue-grey for recessed collar steps, side tabs & structural seams
  const darkBlueGreyMat = physical({
    color: 0x5c6d82,
    roughness: 0.54,
    metalness: 0.22,
    clearcoat: 0.12,
  });
  // Matte charcoal-black for Buran thermal protection tiles (nose cap, leading edges, elevon stripes, RCS & checker squares)
  const blackTileMat = physical({
    color: 0x12151a,
    roughness: 0.78,
    metalness: 0.08,
    clearcoat: 0.05,
  });
  // Glossy dark aerospace glass for Buran's 6-pane V-windshield & 2 square overhead windows
  const windshieldMat = physical({
    color: 0x090c12,
    roughness: 0.12,
    metalness: 0.35,
    clearcoat: 0.95,
    clearcoatRoughness: 0.05,
  });
  // Metallic silver/steel for the upper powerheads/jackets of the 4 RD-0120 core engines
  const silverBellMat = physical({
    color: 0xa2a8b2,
    roughness: 0.28,
    metalness: 0.85,
  });
  // Dark gunmetal for the lower nozzle skirts & recessed mechanical bays
  const darkNozzleMat = physical({
    color: 0x1e2127,
    roughness: 0.46,
    metalness: 0.65,
  });
  _buranMats = {
    whiteMat,
    blueGreyMat,
    darkBlueGreyMat,
    blackTileMat,
    windshieldMat,
    silverBellMat,
    darkNozzleMat,
  };
  return _buranMats;
}

const R_EN_CORE = 1.95;    // Energia central core radius
const R_ZENIT_IN = 0.72;   // Inner-front Zenit strap-on booster radius
const R_ZENIT_OUT = 0.74;  // Outer-rear Zenit strap-on booster radius
const X_ZENIT_IN = 2.62;
const Z_ZENIT_IN = 0.40;
const X_ZENIT_OUT = 3.30;
const Z_ZENIT_OUT = -0.22;

/**
 * Builds a slanted/sheared conical frustum from (xBot, zBot, rBot) at y=0 to (xTop, zTop, rTop) at y=h,
 * with an ogive curve factor so the Zenit booster nose caps slope smoothly into the Energia core.
 */
function shearedBoosterConeGeo(rBot, rTop, xBot, xTop, zBot, zTop, h, curvePow = 0.78, segsR = 48, segsY = 20) {
  const geo = new THREE.CylinderGeometry(1, 1, h, segsR, segsY, false);
  geo.translate(0, h * 0.5, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vy = pos.getY(i);
    const t = Math.max(0, Math.min(1, vy / h));
    const rCurve = rBot + (rTop - rBot) * Math.pow(t, curvePow);
    const cx = xBot + (xTop - xBot) * Math.pow(t, 0.92);
    const cz = zBot + (zTop - zBot) * t;
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    pos.setX(i, vx * rCurve + cx);
    pos.setZ(i, vz * rCurve + cz);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Evaluates the 3D cross-section surface of the Buran Orbiter fuselage & nose cone.
 * Local y spans from yMin = -11.80 (aft base) to yMax = +13.10 (nose tip).
 */
function buranFuselageProfile(y) {
  const yShoulder = 6.00;
  const yTip = 13.10;
  let rx = 1.76;
  let rzTop = 1.18;
  let rzBot = 0.42;
  let zCenter = 2.38;
  if (y > yShoulder) {
    const u = Math.max(0, Math.min(1, (y - yShoulder) / (yTip - yShoulder)));
    const scale = Math.pow(Math.max(0.0005, 1 - Math.pow(u, 1.62)), 0.56);
    rx *= scale;
    rzTop *= Math.pow(scale, 0.92);
    rzBot *= scale;
    // Nose droops slightly toward the belly/center as it approaches the black nose cap
    zCenter = 2.38 - 0.14 * Math.pow(u, 1.35);
  }
  return { rx, rzTop, rzBot, zCenter };
}

function buranSurfaceZ(x, y) {
  const { rx, rzTop, zCenter } = buranFuselageProfile(y);
  if (rx <= 0.001) return zCenter;
  const nx = Math.max(-0.999, Math.min(0.999, x / rx));
  const c = Math.sqrt(Math.max(0, 1 - nx * nx));
  return zCenter + Math.pow(c, 0.82) * rzTop;
}

function buildBuranFuselageSectionGeo(yStart, yEnd, segsY = 32, segsTheta = 56) {
  const geo = new THREE.CylinderGeometry(1, 1, yEnd - yStart, segsTheta, segsY, false);
  geo.translate(0, yStart + (yEnd - yStart) * 0.5, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vy = pos.getY(i);
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    const rad = Math.hypot(vx, vz);
    const { rx, rzTop, rzBot, zCenter } = buranFuselageProfile(vy);
    if (rad < 1e-4) {
      // Endcap center vertex
      pos.setX(i, 0);
      pos.setZ(i, zCenter + rzTop * 0.15);
    } else {
      const s = vx / rad;
      const c = vz / rad;
      const px = s * rx * rad;
      const pz = c >= 0
        ? zCenter + Math.pow(c, 0.82) * rzTop * rad
        : zCenter - Math.pow(-c, 0.72) * rzBot * rad;
      pos.setX(i, px);
      pos.setZ(i, pz);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

// Stage 3 (Top): Energia Upper Nose Cone, Forward LH2 Tank & Ribbed Checkerboard Interstage (H = 12.5m)
function buildBuranNose() {
  const g = new THREE.Group();
  const H = PARTS.buranNose.height; // 12.5
  const {
    whiteMat,
    blueGreyMat,
    darkBlueGreyMat,
    blackTileMat,
    silverBellMat,
    darkNozzleMat,
  } = getBuranMaterials();

  const yRibTop = 3.10;
  const yWhiteTop = 6.35;
  const yGreyCollarTop = 6.95;
  const yOgiveTop = 11.88;

  // 1. Lower Ribbed White Interstage Collar (y = 0.0 -> 3.10)
  g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE + 0.01, R_EN_CORE + 0.01, yRibTop, 64), whiteMat, 0, yRibTop * 0.5, 0));

  // Horizontal structural rings on the ribbed collar (y = 0.06, 0.90, 3.05)
  for (const ry of [0.06, 0.90, yRibTop - 0.05]) {
    g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE + 0.032, R_EN_CORE + 0.032, 0.08, 64), whiteMat, 0, ry, 0));
  }
  g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE + 0.025, R_EN_CORE + 0.025, 0.04, 64), darkBlueGreyMat, 0, yRibTop, 0));

  // 72 fine vertical corrugation ribs around the interstage collar
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const rx = Math.sin(a) * (R_EN_CORE + 0.018);
    const rz = Math.cos(a) * (R_EN_CORE + 0.018);
    const rib = mesh(new THREE.BoxGeometry(0.038, yRibTop - 0.14, 0.028), whiteMat, rx, yRibTop * 0.5, rz);
    rib.rotation.y = a;
    g.add(rib);
  }

  // Iconic 2 Staggered Black Checkerboard Squares on the front (+Z) of the ribbed band (matching photo!)
  const sq1 = mesh(new THREE.BoxGeometry(0.45, 0.45, 0.04), blackTileMat, -0.22, 2.15, R_EN_CORE + 0.022);
  sq1.rotation.y = -0.11;
  g.add(sq1);
  const sq2 = mesh(new THREE.BoxGeometry(0.45, 0.45, 0.04), blackTileMat, 0.22, 1.70, R_EN_CORE + 0.022);
  sq2.rotation.y = 0.11;
  g.add(sq2);

  // Additional small black square marking on the left flank + vertical dark slots (visible in photo!)
  const sqLeft = mesh(new THREE.BoxGeometry(0.04, 0.40, 0.36), blackTileMat, -(R_EN_CORE + 0.02), 1.92, 0.35);
  g.add(sqLeft);
  for (const sgn of [-1, 1]) {
    const slot = mesh(new THREE.BoxGeometry(0.08, 0.34, 0.04), blackTileMat, sgn * 1.12, 1.32, Math.sqrt(R_EN_CORE * R_EN_CORE - 1.12 * 1.12) + 0.02);
    slot.rotation.y = sgn * 0.62;
    g.add(slot);
    // Side umbilical brackets at the base of the ribbed collar where booster nose tips meet the core
    g.add(mesh(new THREE.BoxGeometry(0.18, 0.65, 0.24), whiteMat, sgn * (R_EN_CORE + 0.05), 0.52, 0.12));
    g.add(mesh(new THREE.BoxGeometry(0.22, 0.20, 0.26), blueGreyMat, sgn * (R_EN_CORE + 0.07), 0.16, 0.12));
  }

  // Upper start of the 2 front vertical Buran-mount fairings (y = 0.0 -> 0.90)
  for (const sgn of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.26, 0.90, 0.38), whiteMat, sgn * 0.88, 0.45, R_EN_CORE - 0.05));
  }

  // 2. Smooth White Upper Tank Cylinder (y = 3.10 -> 6.35)
  const hWhite = yWhiteTop - yRibTop;
  g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE, R_EN_CORE, hWhite, 64), whiteMat, 0, yRibTop + hWhite * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE + 0.018, R_EN_CORE + 0.018, 0.05, 64), darkBlueGreyMat, 0, yWhiteTop, 0));

  // Ring of subtle dark rivet dots at y = 3.22 and y = 6.24
  for (const ry of [3.22, 6.24]) {
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      g.add(mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), darkBlueGreyMat, Math.sin(a) * (R_EN_CORE + 0.01), ry, Math.cos(a) * (R_EN_CORE + 0.01)));
    }
  }

  // 3. Bluish-Grey Ogive Nose Cone (y = 6.35 -> 12.50)
  // Lower bluish-grey cylindrical collar (y = 6.35 -> 6.95)
  const hCollar = yGreyCollarTop - yWhiteTop;
  g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE + 0.005, R_EN_CORE + 0.005, hCollar, 64), blueGreyMat, 0, yWhiteTop + hCollar * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE + 0.016, R_EN_CORE + 0.016, 0.04, 64), darkBlueGreyMat, 0, yGreyCollarTop, 0));

  // Smooth curved bluish-grey ogive dome (y = 6.95 -> 11.88)
  const ogivePts = [];
  const nOgive = 36;
  for (let i = 0; i <= nOgive; i++) {
    const t = i / nOgive;
    const r = 0.21 + (R_EN_CORE + 0.005 - 0.21) * Math.pow(1 - Math.pow(t, 1.52), 0.66);
    ogivePts.push(new THREE.Vector2(r, yGreyCollarTop + t * (yOgiveTop - yGreyCollarTop)));
  }
  g.add(mesh(new THREE.LatheGeometry(ogivePts, 64), blueGreyMat));

  // Pointed aerodynamic nose tip probe/cap (y = 11.88 -> 12.50)
  const hTip = H - yOgiveTop;
  g.add(mesh(new THREE.CylinderGeometry(0.045, 0.21, hTip, 36), blueGreyMat, 0, yOgiveTop + hTip * 0.5, 0));
  g.add(mesh(new THREE.SphereGeometry(0.048, 16, 12), blueGreyMat, 0, H - 0.02, 0));

  // Prominent vertical seam/cable rib on the left-front (-0.46 rad) running up the white tank & grey nose cone (visible in photo!)
  const seamAng = -0.46;
  const sxW = Math.sin(seamAng) * (R_EN_CORE + 0.022);
  const szW = Math.cos(seamAng) * (R_EN_CORE + 0.022);
  const whiteSeam = mesh(new THREE.BoxGeometry(0.055, yWhiteTop, 0.045), whiteMat, sxW, yWhiteTop * 0.5, szW);
  whiteSeam.rotation.y = seamAng;
  g.add(whiteSeam);
  const whiteSeamLine = mesh(new THREE.BoxGeometry(0.022, yWhiteTop, 0.052), darkBlueGreyMat, sxW, yWhiteTop * 0.5, szW);
  whiteSeamLine.rotation.y = seamAng;
  g.add(whiteSeamLine);

  // Curved seam rib along the bluish-grey ogive nose cone
  for (let i = 0; i < 18; i++) {
    const t0 = i / 18;
    const t1 = (i + 1) / 18;
    const tm = (t0 + t1) * 0.5;
    const y0 = yWhiteTop + t0 * (yOgiveTop - yWhiteTop);
    const y1 = yWhiteTop + t1 * (yOgiveTop - yWhiteTop);
    const ym = (y0 + y1) * 0.5;
    const rm = ym <= yGreyCollarTop
      ? R_EN_CORE + 0.015
      : 0.21 + (R_EN_CORE + 0.005 - 0.21) * Math.pow(1 - Math.pow((ym - yGreyCollarTop) / (yOgiveTop - yGreyCollarTop), 1.52), 0.66);
    const seg = mesh(new THREE.BoxGeometry(0.042, (y1 - y0) * 1.08, 0.042), darkBlueGreyMat, Math.sin(seamAng) * (rm + 0.01), ym, Math.cos(seamAng) * (rm + 0.01));
    seg.rotation.y = seamAng;
    seg.rotation.x = 0.28 * tm;
    g.add(seg);
  }

  // Internal orbital propulsion nozzle & landing parachutes
  g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE * 0.82, R_EN_CORE * 0.82, 0.14, 48), darkNozzleMat, 0, 0.07, 0));
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.16, 0.42, 0.58, 32), mBell, 0, 0, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.43, 0.40, 0.10, 24), silverBellMat, 0, 0.05, 0));
  addNozzle(g, 0, 0, 0.42, [mBell]);
  addParachutes(g, 11.6);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 2 (Middle): Piggyback Buran Space Shuttle Orbiter + Upper Energia Core & Slanted Booster Fairings (H = 14.5m)
function buildBuranShuttle() {
  const g = new THREE.Group();
  const H = PARTS.buranShuttle.height; // 14.5
  const {
    whiteMat,
    blueGreyMat,
    darkBlueGreyMat,
    blackTileMat,
    windshieldMat,
    silverBellMat,
    darkNozzleMat,
  } = getBuranMaterials();

  // =========================================================================
  // 1. UPPER ENERGIA CENTRAL CORE (y = 0.0 -> 14.50, centered at x = 0, z = 0)
  // =========================================================================
  g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE, R_EN_CORE, H, 64), whiteMat, 0, H * 0.5, 0));
  for (const ry of [0.08, 4.80, 9.60, H - 0.08]) {
    g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE + 0.016, R_EN_CORE + 0.016, 0.06, 64), whiteMat, 0, ry, 0));
  }
  // 2 front vertical structural fairings/columns cradling Buran's belly
  for (const sgn of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.26, H, 0.42), whiteMat, sgn * 0.88, H * 0.5, R_EN_CORE - 0.04));
    // Structural attachment struts between Energia core and Buran Orbiter
    for (const sy of [2.2, 8.8, 12.6]) {
      g.add(mesh(new THREE.BoxGeometry(0.22, 0.32, 0.75), darkBlueGreyMat, sgn * 0.88, sy, R_EN_CORE + 0.22));
    }
  }

  // =========================================================================
  // 2. UPPER 4× STRAP-ON ZENIT BOOSTERS (Left sgn = -1 & Right sgn = +1)
  // =========================================================================
  const yInCylTop = 10.80;
  const yOutWhiteTop = 6.75;
  const yOutGreyTop = 11.05;
  const yConeTop = 14.46;

  for (const sgn of [-1, 1]) {
    const xIn = sgn * X_ZENIT_IN;
    const zIn = Z_ZENIT_IN;
    const xOut = sgn * X_ZENIT_OUT;
    const zOut = Z_ZENIT_OUT;

    // A. Inner-Front White Booster Cylinder (y = 0.0 -> 10.80)
    g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_IN, R_ZENIT_IN, yInCylTop, 48), whiteMat, xIn, yInCylTop * 0.5, zIn));
    for (const ry of [2.60, 6.40, 9.95, yInCylTop - 0.06]) {
      g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_IN + 0.015, R_ZENIT_IN + 0.015, 0.06, 48), whiteMat, xIn, ry, zIn));
      g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_IN + 0.018, R_ZENIT_IN + 0.018, 0.03, 48), darkBlueGreyMat, xIn, ry + 0.04, zIn));
    }
    // Vertical row of black rivet dots on inner booster
    for (let yd = 0.8; yd < yInCylTop - 0.5; yd += 0.95) {
      g.add(mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), darkBlueGreyMat, xIn + sgn * 0.18, yd, zIn + R_ZENIT_IN));
    }

    // Upper mechanical attachment struts & shock-absorber collars on front of inner booster (y = 9.85 -> 12.85)
    g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_IN * 0.92, R_ZENIT_IN, 0.65, 36), blueGreyMat, xIn, yInCylTop + 0.32, zIn));
    g.add(mesh(new THREE.BoxGeometry(0.34, 2.55, 0.36), blueGreyMat, xIn - sgn * 0.16, 11.15, zIn + 0.52));
    g.add(mesh(new THREE.BoxGeometry(0.56, 0.24, 0.44), darkBlueGreyMat, xIn - sgn * 0.12, 10.55, zIn + 0.54));
    g.add(mesh(new THREE.BoxGeometry(0.52, 0.22, 0.42), darkBlueGreyMat, xIn - sgn * 0.14, 11.65, zIn + 0.52));
    g.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 2.85, 16), whiteMat, xIn + sgn * 0.14, 11.20, zIn + 0.58));
    g.add(mesh(new THREE.BoxGeometry(0.22, 1.45, 0.28), darkBlueGreyMat, sgn * (R_EN_CORE + 0.18), 11.80, zIn + 0.38));

    // B. Outer-Rear Booster Cylinder: White lower section (y = 0.0 -> 6.75) + Bluish-Grey Upper Shroud (y = 6.75 -> 11.05)
    g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_OUT, R_ZENIT_OUT, yOutWhiteTop, 48), whiteMat, xOut, yOutWhiteTop * 0.5, zOut));
    for (const ry of [1.80, 4.40]) {
      g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_OUT + 0.015, R_ZENIT_OUT + 0.015, 0.06, 48), whiteMat, xOut, ry, zOut));
    }
    for (let yd = 0.6; yd < yOutWhiteTop - 0.3; yd += 0.85) {
      g.add(mesh(new THREE.BoxGeometry(0.045, 0.045, 0.045), darkBlueGreyMat, xOut + sgn * 0.42, yd, zOut + R_ZENIT_OUT * 0.82));
    }

    // Prominent Bluish-Grey Upper Outer Collar/Shroud (y = 6.45 -> 11.05, r = 0.83) visible on left/right flanks in photo!
    const rShroud = R_ZENIT_OUT + 0.09;
    g.add(mesh(new THREE.CylinderGeometry(rShroud, R_ZENIT_OUT, 0.35, 48), darkBlueGreyMat, xOut, yOutWhiteTop - 0.17, zOut));
    const hShroud = yOutGreyTop - yOutWhiteTop;
    g.add(mesh(new THREE.CylinderGeometry(rShroud, rShroud, hShroud, 48), blueGreyMat, xOut, yOutWhiteTop + hShroud * 0.5, zOut));
    g.add(mesh(new THREE.CylinderGeometry(rShroud + 0.014, rShroud + 0.014, 0.06, 48), darkBlueGreyMat, xOut, yOutWhiteTop + hShroud * 0.48, zOut));
    // Vertical rectangular side pod on the bluish-grey collar
    g.add(mesh(new THREE.BoxGeometry(0.24, hShroud * 0.88, 0.52), darkBlueGreyMat, xOut + sgn * (rShroud - 0.04), yOutWhiteTop + hShroud * 0.46, zOut + 0.12));

    // C. Slanted Bluish-Grey Conical Booster Nose Cap sloping into the Energia Core (y = 10.80 -> 14.46)
    const coneH = yConeTop - yInCylTop;
    const coneGeo = shearedBoosterConeGeo(
      1.04,
      0.13,
      sgn * 3.06,
      sgn * (R_EN_CORE + 0.04),
      0.04,
      0.12,
      coneH,
      0.82,
      48,
      24
    );
    g.add(mesh(coneGeo, blueGreyMat, 0, yInCylTop, 0));
  }

  // =========================================================================
  // 3. COMPLETE 3D BURAN SPACE SHUTTLE ORBITER (y = -11.80 -> +13.10 on +Z)
  // =========================================================================
  const orbiter = new THREE.Group();
  g.add(orbiter);

  const yFuseBot = -11.80;
  const yBlackCapBot = 11.92;
  const yNoseTip = 13.10;

  // A. White Shuttle Fuselage & Forward Cabin (y = -11.80 -> +11.92) + Black Thermal Nose Cap (y = +11.92 -> +13.10)
  orbiter.add(mesh(buildBuranFuselageSectionGeo(yFuseBot, yBlackCapBot, 40, 64), whiteMat));
  orbiter.add(mesh(buildBuranFuselageSectionGeo(yBlackCapBot - 0.02, yNoseTip, 18, 48), blackTileMat));
  // Rounded black thermal nose tip sphere
  const tipProf = buranFuselageProfile(yNoseTip - 0.05);
  const noseSphere = mesh(new THREE.SphereGeometry(0.22, 24, 16), blackTileMat, 0, yNoseTip - 0.08, tipProf.zCenter);
  noseSphere.scale.set(1.05, 0.85, 0.95);
  orbiter.add(noseSphere);

  // Black thermal protection belly tile layer along the back/underbelly of the fuselage
  orbiter.add(mesh(new THREE.BoxGeometry(3.25, 20.5, 0.16), blackTileMat, 0, -1.2, 1.88));

  // B. Black RCS Thruster Dots on the Nose (just below the black nose cap, matching photo!)
  for (const [rx, ry, rr] of [
    [-0.22, 11.46, 0.068],
    [0.0, 11.50, 0.072],
    [0.22, 11.46, 0.068],
    [-0.74, 10.85, 0.062],
    [0.74, 10.85, 0.062],
  ]) {
    const rz = buranSurfaceZ(rx, ry);
    const dot = mesh(new THREE.CylinderGeometry(rr, rr, 0.05, 16).rotateX(Math.PI * 0.5), blackTileMat, rx, ry, rz + 0.01);
    dot.rotation.y = rx * 0.35;
    dot.rotation.x = -0.32;
    orbiter.add(dot);
  }

  // C. Iconic 6-Pane V-Shaped Black Cockpit Windshield (y = +8.55 -> +9.85)
  // 3 angled black glass panes per side forming the signature Soviet Buran chevron windscreen
  const windPanes = [
    // [xCenter, yCenter, width, height, rotZ, rotY, rotX]
    [0.27, 9.52, 0.38, 0.42, -0.46, 0.18, -0.26],
    [0.70, 9.24, 0.44, 0.44, -0.58, 0.44, -0.22],
    [1.12, 8.80, 0.42, 0.40, -0.68, 0.72, -0.16],
  ];
  for (const sgn of [-1, 1]) {
    for (const [wx, wy, ww, wh, rz, ry, rx] of windPanes) {
      const px = sgn * wx;
      const pz = buranSurfaceZ(px, wy);
      const pane = mesh(new THREE.BoxGeometry(ww, wh, 0.06), windshieldMat, px, wy, pz + 0.01);
      pane.rotation.order = 'YXZ';
      pane.rotation.y = sgn * ry;
      pane.rotation.x = rx;
      pane.rotation.z = sgn * rz;
      orbiter.add(pane);
    }
  }

  // D. 2 Square Black Overhead Cockpit Windows right behind the V-windshield (y = +7.92, x = +/-0.25)
  for (const sgn of [-1, 1]) {
    const ox = sgn * 0.25;
    const oy = 7.92;
    const oz = buranSurfaceZ(ox, oy);
    const owin = mesh(new THREE.BoxGeometry(0.35, 0.36, 0.05), windshieldMat, ox, oy, oz + 0.012);
    owin.rotation.x = -0.14;
    owin.rotation.y = sgn * 0.12;
    orbiter.add(owin);
  }

  // E. Crisp Black Payload Bay Panel Seam Lines on the White Upper Fuselage
  // Centerline longitudinal seam (y = -6.20 -> +7.35)
  const lenCenterSeam = 7.35 - (-6.20);
  orbiter.add(mesh(new THREE.BoxGeometry(0.036, lenCenterSeam, 0.03), blackTileMat, 0, (-6.20 + 7.35) * 0.5, buranSurfaceZ(0, 0) + 0.012));

  // Left & Right longitudinal payload bay hinge seams (x = +/-1.44, y = -8.40 -> +7.35)
  const lenSideSeam = 7.35 - (-8.40);
  for (const sgn of [-1, 1]) {
    const sx = sgn * 1.44;
    const sz = buranSurfaceZ(sx, 0);
    orbiter.add(mesh(new THREE.BoxGeometry(0.035, lenSideSeam, 0.035), blackTileMat, sx, (-8.40 + 7.35) * 0.5, sz + 0.01));
  }

  // 5 Horizontal Black Panel Seam Rings across the white fuselage (y = +7.35, +3.35, -0.85, -5.05, -8.40)
  for (const py of [7.35, 3.35, -0.85, -5.05, -8.40]) {
    const nSeg = 24;
    const { rx } = buranFuselageProfile(py);
    for (let i = 0; i < nSeg; i++) {
      const t0 = -0.92 + (1.84 * i) / nSeg;
      const t1 = -0.92 + (1.84 * (i + 1)) / nSeg;
      const xm = ((t0 + t1) * 0.5) * rx;
      const zm = buranSurfaceZ(xm, py);
      const dx = (t1 - t0) * rx;
      const dz = buranSurfaceZ(t1 * rx, py) - buranSurfaceZ(t0 * rx, py);
      const segLen = Math.hypot(dx, dz) * 1.08;
      const bar = mesh(new THREE.BoxGeometry(segLen, 0.038, 0.032), blackTileMat, xm, py, zm + 0.012);
      bar.rotation.y = -Math.atan2(dz, dx);
      orbiter.add(bar);
    }
  }

  // =========================================================================
  // F. DOUBLE-DELTA WINGS WITH BLACK THERMAL LEADING EDGES & ELEVON STRIPES
  // =========================================================================
  for (const sgn of [-1, 1]) {
    // 1. Full Wing Contour in Black Thermal Tile Material (forms black belly, black leading edge, wingtip, elevon hinge band & trailing lip)
    const blackWingShape = new THREE.Shape();
    blackWingShape.moveTo(sgn * 1.55, 4.55);
    blackWingShape.lineTo(sgn * 1.82, 4.55);
    blackWingShape.lineTo(sgn * 2.68, -1.55);   // Forward strake / chine kink
    blackWingShape.lineTo(sgn * 7.36, -6.72);   // 45-deg main delta leading edge to outer tip
    blackWingShape.lineTo(sgn * 7.64, -8.28);   // Curved/angled outer wingtip upper corner
    blackWingShape.lineTo(sgn * 7.64, -9.62);   // Outer wingtip trailing corner
    blackWingShape.lineTo(sgn * 1.55, -10.82);  // Trailing edge to fuselage root
    blackWingShape.closePath();

    const blackWingGeo = new THREE.ExtrudeGeometry(blackWingShape, {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 2,
    });
    orbiter.add(mesh(blackWingGeo, blackTileMat, 0, 0, 1.66));

    // 2. White Upper Main Wing Surface (inset from the leading edge & wingtip so the bold black RCC border frames it cleanly, stopping at y = -8.20 above the black elevon band!)
    const whiteWingShape = new THREE.Shape();
    whiteWingShape.moveTo(sgn * 1.62, 3.05);
    whiteWingShape.lineTo(sgn * 2.40, -1.78);   // Leaves crisp black strake border
    whiteWingShape.lineTo(sgn * 7.04, -6.92);   // Leaves bold 0.36m black leading-edge band
    whiteWingShape.lineTo(sgn * 7.42, -8.20);   // Leaves black wingtip border
    whiteWingShape.lineTo(sgn * 1.62, -8.20);   // Top edge of the horizontal black elevon band
    whiteWingShape.closePath();

    const whiteWingGeo = new THREE.ExtrudeGeometry(whiteWingShape, {
      depth: 0.14,
      bevelEnabled: false,
    });
    orbiter.add(mesh(whiteWingGeo, whiteMat, 0, 0, 1.80));

    // 3. White Inner & Outer Elevon Flaps below the horizontal black hinge band (y = -8.64 down to trailing edge, split by a vertical black seam at x = 4.66!)
    const inElevShape = new THREE.Shape();
    inElevShape.moveTo(sgn * 1.62, -8.64);
    inElevShape.lineTo(sgn * 4.62, -8.64);
    inElevShape.lineTo(sgn * 4.62, -10.14);
    inElevShape.lineTo(sgn * 1.62, -10.72);
    inElevShape.closePath();
    orbiter.add(mesh(new THREE.ExtrudeGeometry(inElevShape, { depth: 0.14, bevelEnabled: false }), whiteMat, 0, 0, 1.80));

    const outElevShape = new THREE.Shape();
    outElevShape.moveTo(sgn * 4.70, -8.64);
    outElevShape.lineTo(sgn * 7.46, -8.64);
    outElevShape.lineTo(sgn * 7.46, -9.55);
    outElevShape.lineTo(sgn * 4.70, -10.12);
    outElevShape.closePath();
    orbiter.add(mesh(new THREE.ExtrudeGeometry(outElevShape, { depth: 0.14, bevelEnabled: false }), whiteMat, 0, 0, 1.80));

    // Subtle panel seam line across the white main wing at y = -5.10
    orbiter.add(mesh(new THREE.BoxGeometry(3.85, 0.032, 0.03), blackTileMat, sgn * 3.60, -5.10, 1.95));
  }

  // =========================================================================
  // G. CENTRAL VERTICAL TAIL FIN (STABILIZER) & REAR OMS / RCS PODS
  // =========================================================================
  // Swept vertical tail fin in the YZ plane at x = 0 (protruding in +Z from z = 3.20 to 5.25, y = -5.75 down to -13.15)
  const tailBlackShape = new THREE.Shape();
  tailBlackShape.moveTo(3.15, -5.75);
  tailBlackShape.lineTo(3.62, -5.75);
  tailBlackShape.lineTo(5.28, -12.65);
  tailBlackShape.lineTo(5.05, -13.18);
  tailBlackShape.lineTo(3.15, -11.75);
  tailBlackShape.closePath();
  const tailBlackGeo = new THREE.ExtrudeGeometry(tailBlackShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
  tailBlackGeo.rotateY(-Math.PI * 0.5);
  tailBlackGeo.translate(0.08, 0, 0);
  orbiter.add(mesh(tailBlackGeo, blackTileMat));

  // White side panels of the vertical tail fin (inset from the front edge so the black leading edge is visible!)
  const tailWhiteShape = new THREE.Shape();
  tailWhiteShape.moveTo(3.15, -6.10);
  tailWhiteShape.lineTo(3.46, -6.10);
  tailWhiteShape.lineTo(5.02, -12.72);
  tailWhiteShape.lineTo(4.85, -13.08);
  tailWhiteShape.lineTo(3.15, -11.65);
  tailWhiteShape.closePath();
  const tailWhiteGeo = new THREE.ExtrudeGeometry(tailWhiteShape, {
    depth: 0.22,
    bevelEnabled: false,
  });
  tailWhiteGeo.rotateY(-Math.PI * 0.5);
  tailWhiteGeo.translate(0.11, 0, 0);
  orbiter.add(mesh(tailWhiteGeo, whiteMat));

  // Left & Right Rear OMS Pods with vertical columns of 4 black RCS thruster dots (y = -8.70 -> -11.80)
  for (const sgn of [-1, 1]) {
    // White OMS pod shoulder
    const pod = mesh(new THREE.BoxGeometry(0.76, 3.05, 0.92), whiteMat, sgn * 1.35, -10.25, 2.95);
    orbiter.add(pod);
    // Vertical column of 4 black circular RCS dots on outer rear corner + 2 inner dots (matching photo!)
    for (const dy of [-9.52, -9.86, -10.20, -10.54]) {
      orbiter.add(mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.05, 14).rotateX(Math.PI * 0.5), blackTileMat, sgn * 1.48, dy, 3.40));
    }
    for (const dy of [-10.75, -11.02]) {
      orbiter.add(mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.05, 12).rotateX(Math.PI * 0.5), blackTileMat, sgn * 1.24, dy, 3.40));
    }
  }

  // Dark recessed aft engine bay between the left & right OMS pods (y = -9.15 -> -11.80)
  orbiter.add(mesh(new THREE.BoxGeometry(1.90, 2.65, 0.95), darkNozzleMat, 0, -10.48, 2.85));
  orbiter.add(mesh(new THREE.CylinderGeometry(0.42, 0.52, 1.45, 24), silverBellMat, -0.45, -10.65, 2.65));
  orbiter.add(mesh(new THREE.CylinderGeometry(0.42, 0.52, 1.45, 24), silverBellMat, 0.45, -10.65, 2.65));

  // Stage 2 Propulsion Nozzles & Parachutes
  for (const [nx, nz] of [[-0.65, -0.55], [0.65, -0.55], [-0.65, 0.55], [0.65, 0.55]]) {
    const mBell = bellMaterial(false);
    g.add(mesh(bellGeometry(0.18, 0.44, 0.65, 28), mBell, nx, 0, nz));
    addNozzle(g, nx, nz, 0.44, [mBell]);
  }
  addParachutes(g, 13.0);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 1 (Bottom): Lower Energia Core, 4× Zenit Strap-on Boosters, 4× RD-0120 Core Nozzles & 4× RD-170 Booster Clusters (H = 15.0m)
function buildBuranEnergia() {
  const g = new THREE.Group();
  const H = PARTS.buranEnergia.height; // 15.0
  const {
    whiteMat,
    blueGreyMat,
    darkBlueGreyMat,
    blackTileMat,
    silverBellMat,
    darkNozzleMat,
  } = getBuranMaterials();

  const yCoreBot = 1.55;

  // =========================================================================
  // 1. LOWER ENERGIA CENTRAL CORE (y = 1.55 -> 15.00, r = R_EN_CORE = 1.95)
  // =========================================================================
  const hCore = H - yCoreBot;
  g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE, R_EN_CORE, hCore, 64), whiteMat, 0, yCoreBot + hCore * 0.5, 0));
  for (const ry of [2.40, 6.50, 10.80, H - 0.06]) {
    g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE + 0.016, R_EN_CORE + 0.016, 0.06, 64), whiteMat, 0, ry, 0));
  }
  // Dark metallic engine thrust frame at base of Energia core (y = 1.40 -> 2.40)
  g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE * 0.94, R_EN_CORE * 0.88, 1.0, 48), darkNozzleMat, 0, 1.90, 0));

  // =========================================================================
  // 2. 4× CENTRAL RD-0120 CRYOGENIC MAIN ENGINE BELLS (y = 0.0 -> 1.65)
  // Visible at the bottom center of the reference photo with silver upper domes & dark flared bells!
  // =========================================================================
  const rd0120Coords = [
    [-0.74, 0.58],
    [0.74, 0.58],
    [-0.74, -0.58],
    [0.74, -0.58],
  ];
  for (const [ex, ez] of rd0120Coords) {
    const mBell = bellMaterial(true);
    // Lower dark flared nozzle bell (y = 0.0 -> 0.88)
    g.add(mesh(bellGeometry(0.34, 0.58, 0.88, 36), mBell, ex, 0, ez));
    g.add(mesh(bellGeometry(0.33, 0.57, 0.86, 36), darkNozzleMat, ex, 0.01, ez));
    // Upper rounded metallic silver jacket / powerhead (y = 0.82 -> 1.68)
    g.add(mesh(new THREE.CylinderGeometry(0.56, 0.44, 0.82, 36), silverBellMat, ex, 1.22, ez));
    g.add(mesh(new THREE.SphereGeometry(0.56, 28, 16), silverBellMat, ex, 1.55, ez));
    for (const ty of [0.88, 1.08, 1.28]) {
      g.add(mesh(new THREE.TorusGeometry(0.50, 0.025, 10, 32).rotateX(Math.PI * 0.5), silverBellMat, ex, ty, ez));
    }
    addNozzle(g, ex, ez, 0.58, [mBell]);
  }

  // =========================================================================
  // 3. LOWER 4× STRAP-ON ZENIT BOOSTERS (Left sgn = -1 & Right sgn = +1)
  // =========================================================================
  const yNozTop = 0.92;
  const yInSkirtTop = 4.20;
  const yOutGreyBot = 1.42;
  const yOutGreyTop = 6.05;

  for (const sgn of [-1, 1]) {
    const xIn = sgn * X_ZENIT_IN;
    const zIn = Z_ZENIT_IN;
    const xOut = sgn * X_ZENIT_OUT;
    const zOut = Z_ZENIT_OUT;

    // A. Inner-Front Zenit Booster (y = 0.92 -> 15.00)
    // Main white upper cylinder (y = 4.20 -> 15.00)
    const hInWhite = H - yInSkirtTop;
    g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_IN, R_ZENIT_IN, hInWhite, 48), whiteMat, xIn, yInSkirtTop + hInWhite * 0.5, zIn));
    for (const ry of [7.60, 11.20, 13.80, H - 0.05]) {
      g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_IN + 0.015, R_ZENIT_IN + 0.015, 0.06, 48), whiteMat, xIn, ry, zIn));
      g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_IN + 0.018, R_ZENIT_IN + 0.018, 0.03, 48), darkBlueGreyMat, xIn, ry + 0.04, zIn));
    }
    // Small black target/sensor dot at y = 13.15 (visible on the white booster tube just above the wing root in the photo!)
    g.add(mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16).rotateX(Math.PI * 0.5), blackTileMat, xIn, 13.15, zIn + R_ZENIT_IN));

    // Stepped White Aft Skirt (y = 0.92 -> 4.20, r = 0.78) with 3 Vertical Ribbed Strakes (matching photo!)
    const rSkirt = R_ZENIT_IN + 0.06;
    const hSkirt = yInSkirtTop - yNozTop;
    g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_IN, rSkirt, 0.32, 48), whiteMat, xIn, yInSkirtTop - 0.16, zIn));
    g.add(mesh(new THREE.CylinderGeometry(rSkirt, rSkirt, hSkirt - 0.32, 48), whiteMat, xIn, yNozTop + (hSkirt - 0.32) * 0.5, zIn));
    g.add(mesh(new THREE.CylinderGeometry(rSkirt + 0.016, rSkirt + 0.016, 0.10, 48), darkBlueGreyMat, xIn, yNozTop + 0.06, zIn));
    g.add(mesh(new THREE.CylinderGeometry(rSkirt + 0.014, rSkirt + 0.014, 0.05, 48), darkBlueGreyMat, xIn, 3.35, zIn));

    // 3 vertical raised white strakes/ribs on the front of the inner booster aft skirt (y = 1.35 -> 3.15)
    for (const dx of [-0.22, 0.0, 0.22]) {
      g.add(mesh(new THREE.BoxGeometry(0.09, 1.75, 0.14), whiteMat, xIn + dx, 2.25, zIn + rSkirt - 0.02));
      g.add(mesh(new THREE.BoxGeometry(0.11, 0.12, 0.16), darkBlueGreyMat, xIn + dx, 3.05, zIn + rSkirt - 0.01));
      g.add(mesh(new THREE.BoxGeometry(0.11, 0.12, 0.16), darkBlueGreyMat, xIn + dx, 1.45, zIn + rSkirt - 0.01));
    }

    // B. Outer-Rear Zenit Booster (y = 0.92 -> 15.00)
    // Upper white section (y = 6.05 -> 15.00)
    const hOutWhite = H - yOutGreyTop;
    g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_OUT, R_ZENIT_OUT, hOutWhite, 48), whiteMat, xOut, yOutGreyTop + hOutWhite * 0.5, zOut));
    for (const ry of [9.50, 13.45]) {
      g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_OUT + 0.015, R_ZENIT_OUT + 0.015, 0.06, 48), whiteMat, xOut, ry, zOut));
    }
    for (let yd = 6.5; yd < H - 0.4; yd += 0.90) {
      g.add(mesh(new THREE.BoxGeometry(0.045, 0.045, 0.045), darkBlueGreyMat, xOut + sgn * 0.42, yd, zOut + R_ZENIT_OUT * 0.82));
    }

    // Small Horizontal Bluish-Grey Side Tab sticking out at y = 13.45 just above the wing leading edge (visible in photo!)
    g.add(mesh(new THREE.BoxGeometry(0.42, 0.22, 0.32), blueGreyMat, xOut + sgn * (R_ZENIT_OUT + 0.14), 13.45, zOut + 0.10));

    // Lower Bluish-Grey Outer Shroud/Band below the wing trailing edge (y = 1.42 -> 6.05, r = 0.82)
    const rLowShroud = R_ZENIT_OUT + 0.08;
    const hLowShroud = yOutGreyTop - yOutGreyBot;
    g.add(mesh(new THREE.CylinderGeometry(rLowShroud, rLowShroud, hLowShroud, 48), blueGreyMat, xOut, yOutGreyBot + hLowShroud * 0.5, zOut));
    g.add(mesh(new THREE.BoxGeometry(0.24, hLowShroud * 0.92, 0.48), darkBlueGreyMat, xOut + sgn * (rLowShroud - 0.03), yOutGreyBot + hLowShroud * 0.5, zOut + 0.10));
    // Stepped white/grey base ring below the bluish-grey band (y = 0.92 -> 1.42)
    g.add(mesh(new THREE.CylinderGeometry(rLowShroud, R_ZENIT_OUT + 0.04, yOutGreyBot - yNozTop, 48), whiteMat, xOut, yNozTop + (yOutGreyBot - yNozTop) * 0.5, zOut));
    g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_OUT + 0.06, R_ZENIT_OUT + 0.06, 0.10, 48), darkBlueGreyMat, xOut, yNozTop + 0.06, zOut));

    // Lower structural attachment struts connecting the boosters to the Energia core
    g.add(mesh(new THREE.BoxGeometry(1.10, 0.55, 0.55), darkBlueGreyMat, sgn * 2.15, 2.65, 0.10));

    // C. RD-170 4-Chamber Engine Nozzle Clusters at the bottom of both Inner & Outer Boosters (y = 0.0 -> 0.92)
    for (const [bx, bz] of [[xIn, zIn], [xOut, zOut]]) {
      const mBell = bellMaterial(true);
      // 4-chamber nozzle cluster per Zenit booster
      for (const [dx, dz] of [[-0.24, -0.22], [0.24, -0.22], [-0.24, 0.22], [0.24, 0.22]]) {
        g.add(mesh(bellGeometry(0.11, 0.25, yNozTop, 24), darkNozzleMat, bx + dx, 0, bz + dz));
        g.add(mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.12, 20), silverBellMat, bx + dx, 0.08, bz + dz));
      }
      addNozzle(g, bx, bz, 0.50, [mBell]);
    }
  }

  return g;
}

// =========================================================================
// SOVIET ENERGIA – POLYUS ("ЭНЕРГИЯ – МИР-2") SUPER-HEAVY LAUNCH VEHICLE
// =========================================================================
let _energiaMats = null;
function getEnergiaMaterials() {
  if (_energiaMats) return _energiaMats;
  const panel = TX.panelTextures();

  const whiteMat = physical({
    color: 0xc6cbd4,
    roughness: 0.76,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.16, 0.16),
    metalness: 0.04,
    clearcoat: 0.06,
    clearcoatRoughness: 0.40,
  });
  const lightGreyRibMat = physical({
    color: 0xa6acb6,
    roughness: 0.68,
    metalness: 0.12,
    clearcoat: 0.08,
  });
  // Warm stone-grey / taupe-grey for Zenit booster fairings, nose cones & pods (matching reference image!)
  const warmGreyMat = physical({
    color: 0x9b9990,
    roughness: 0.60,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.14, 0.14),
    metalness: 0.14,
    clearcoat: 0.10,
  });
  const darkWarmGreyMat = physical({
    color: 0x5c5b56,
    roughness: 0.56,
    metalness: 0.35,
  });
  // Deep matte charcoal-black for the Polyus ("МИР-2") orbital laser spacecraft
  const polyusBlackMat = physical({
    color: 0x1b1a19,
    roughness: 0.80,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.14, 0.14),
    metalness: 0.08,
    clearcoat: 0.05,
  });
  const polyusSeamMat = physical({
    color: 0x0e0d0c,
    roughness: 0.85,
    metalness: 0.05,
  });

  // Decal 1: Red Cyrillic "ЭНЕРГИЯ" on the upper white tank
  const cEn = document.createElement('canvas');
  cEn.width = 512;
  cEn.height = 256;
  const xEn = cEn.getContext('2d');
  xEn.clearRect(0, 0, 512, 256);
  xEn.fillStyle = '#c42b22';
  xEn.font = 'bold 68px "Arial", "Segoe UI", sans-serif';
  xEn.textAlign = 'center';
  xEn.textBaseline = 'middle';
  xEn.fillText('ЭНЕРГИЯ', 256, 128);
  const texEn = new THREE.CanvasTexture(cEn);
  texEn.colorSpace = THREE.SRGBColorSpace;
  texEn.anisotropy = 8;
  const energiaDecalMat = new THREE.MeshPhysicalMaterial({
    map: texEn,
    transparent: true,
    roughness: 0.78,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    depthWrite: false,
  });

  // Decal 2: White Cyrillic "МИР-2" + Upper Grey "U U" Brackets on the black Polyus hull
  const cMir = document.createElement('canvas');
  cMir.width = 512;
  cMir.height = 512;
  const xMir = cMir.getContext('2d');
  xMir.clearRect(0, 0, 512, 512);
  // Draw the two grey "U" bracket markings on left & right in upper half
  xMir.strokeStyle = '#787878';
  xMir.lineWidth = 10;
  for (const ux of [118, 394]) {
    xMir.beginPath();
    xMir.moveTo(ux - 22, 110);
    xMir.lineTo(ux - 22, 178);
    xMir.arc(ux, 178, 22, Math.PI, 0, true);
    xMir.lineTo(ux + 22, 110);
    xMir.stroke();
  }
  // Draw crisp white "МИР-2" in lower half
  xMir.fillStyle = '#e8ecf2';
  xMir.font = '900 84px "Arial Black", "Arial", sans-serif';
  xMir.textAlign = 'center';
  xMir.textBaseline = 'middle';
  xMir.fillText('МИР-2', 256, 365);
  const texMir = new THREE.CanvasTexture(cMir);
  texMir.colorSpace = THREE.SRGBColorSpace;
  texMir.anisotropy = 8;
  const mir2DecalMat = new THREE.MeshPhysicalMaterial({
    map: texMir,
    transparent: true,
    roughness: 0.78,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    depthWrite: false,
  });

  _energiaMats = {
    whiteMat,
    lightGreyRibMat,
    warmGreyMat,
    darkWarmGreyMat,
    polyusBlackMat,
    polyusSeamMat,
    energiaDecalMat,
    mir2DecalMat,
  };
  return _energiaMats;
}

// Stage 3 (Top): Energia White Nose Cone with Button Tip, Red "ЭНЕРГИЯ" Tank & Ribbed Checker Collar (H = 12.5m)
function buildEnergiaNose() {
  const g = new THREE.Group();
  const H = PARTS.energiaNose.height; // 12.5
  const {
    whiteMat,
    lightGreyRibMat,
    warmGreyMat,
    darkWarmGreyMat,
    polyusBlackMat,
    energiaDecalMat,
  } = getEnergiaMaterials();

  const yRibTop = 3.10;
  const yWhiteTop = 6.60;
  const yOgiveTop = 12.18;

  // 1. Lower Ribbed Light-Grey Interstage Collar (y = 0.0 -> 3.10)
  g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE + 0.01, R_EN_CORE + 0.01, yRibTop, 64), lightGreyRibMat, 0, yRibTop * 0.5, 0));
  for (const ry of [0.06, 0.36, yRibTop - 0.04]) {
    g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE + 0.026, R_EN_CORE + 0.026, 0.07, 64), warmGreyMat, 0, ry, 0));
  }

  // 64 vertical ribs around the interstage collar
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const rib = mesh(
      new THREE.BoxGeometry(0.042, yRibTop - 0.44, 0.028),
      whiteMat,
      Math.sin(a) * (R_EN_CORE + 0.016),
      0.38 + (yRibTop - 0.44) * 0.5,
      Math.cos(a) * (R_EN_CORE + 0.016)
    );
    rib.rotation.y = a;
    g.add(rib);
  }

  // Iconic 2 Staggered Black Checkerboard Squares in the center-front (+Z) right above the Polyus nose tip!
  const sq1 = mesh(new THREE.BoxGeometry(0.45, 0.45, 0.04), polyusBlackMat, -0.22, 2.22, R_EN_CORE + 0.024);
  sq1.rotation.y = -0.11;
  g.add(sq1);
  const sq2 = mesh(new THREE.BoxGeometry(0.45, 0.45, 0.04), polyusBlackMat, 0.22, 1.77, R_EN_CORE + 0.024);
  sq2.rotation.y = 0.11;
  g.add(sq2);

  // 2 thin vertical grey structural pipes on the front (+Z) flanking the black Polyus nose cone (y = 0.0 -> 1.85)
  for (const sgn of [-1, 1]) {
    g.add(mesh(new THREE.CylinderGeometry(0.065, 0.065, 1.85, 14), warmGreyMat, sgn * 0.88, 0.925, R_EN_CORE + 0.04));
    // Protruding angled side ears on the outer left/right edges of the ribbed collar (y = 0.65 -> 1.35)
    const ear = mesh(new THREE.BoxGeometry(0.18, 0.65, 0.24), lightGreyRibMat, sgn * (R_EN_CORE + 0.06), 0.98, 0.08);
    ear.rotation.z = sgn * 0.18;
    g.add(ear);
  }

  // 2. Middle White Cylindrical Tank with Red "ЭНЕРГИЯ" Lettering (y = 3.10 -> 6.60)
  const hWhite = yWhiteTop - yRibTop;
  g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE, R_EN_CORE, hWhite, 64), whiteMat, 0, yRibTop + hWhite * 0.5, 0));
  for (const ry of [3.52, 6.18, yWhiteTop]) {
    g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE + 0.015, R_EN_CORE + 0.015, 0.045, 64), lightGreyRibMat, 0, ry, 0));
  }

  // Conformal decal arc on the front (+Z) with bold red "ЭНЕРГИЯ"
  const decArc = 1.25;
  const decGeo = new THREE.CylinderGeometry(R_EN_CORE + 0.02, R_EN_CORE + 0.02, 2.50, 32, 1, true, -decArc * 0.5, decArc);
  g.add(mesh(decGeo, energiaDecalMat, 0, 4.85, 0));

  // 3. Upper White Ogive Nose Cone with Button Tip (y = 6.60 -> 12.50)
  const ogivePts = [];
  const nOgive = 36;
  for (let i = 0; i <= nOgive; i++) {
    const t = i / nOgive;
    const r = 0.18 + (R_EN_CORE - 0.18) * Math.pow(1 - Math.pow(t, 1.55), 0.65);
    ogivePts.push(new THREE.Vector2(r, yWhiteTop + t * (yOgiveTop - yWhiteTop)));
  }
  g.add(mesh(new THREE.LatheGeometry(ogivePts, 64), whiteMat));

  // Rounded white button cap at the apex (y = 12.18 -> 12.50, matching reference image!)
  g.add(mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.14, 32), whiteMat, 0, yOgiveTop + 0.07, 0));
  const tipSphere = mesh(new THREE.SphereGeometry(0.22, 24, 16), whiteMat, 0, yOgiveTop + 0.16, 0);
  tipSphere.scale.set(1.0, 0.75, 1.0);
  g.add(tipSphere);

  // Internal orbital propulsion nozzle & landing parachutes
  g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE * 0.82, R_EN_CORE * 0.82, 0.14, 48), darkWarmGreyMat, 0, 0.07, 0));
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.16, 0.42, 0.58, 32), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.42, [mBell]);
  addParachutes(g, 11.6);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 2 (Middle): Piggyback Black Polyus ("МИР-2") Spacecraft + Upper Energia Core & Warm-Grey Booster Fairings (H = 14.5m)
function buildEnergiaPolyus() {
  const g = new THREE.Group();
  const H = PARTS.energiaPolyus.height; // 14.5
  const {
    whiteMat,
    lightGreyRibMat,
    warmGreyMat,
    darkWarmGreyMat,
    polyusBlackMat,
    polyusSeamMat,
    mir2DecalMat,
  } = getEnergiaMaterials();

  // =========================================================================
  // 1. UPPER ENERGIA CENTRAL CORE (y = 0.0 -> 14.50, r = R_EN_CORE = 1.95)
  // =========================================================================
  g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE, R_EN_CORE, H, 64), whiteMat, 0, H * 0.5, 0));
  for (const ry of [0.06, 6.20, 12.10, 13.95, H - 0.05]) {
    g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE + 0.015, R_EN_CORE + 0.015, 0.05, 64), lightGreyRibMat, 0, ry, 0));
  }
  // Continuation of the 2 vertical grey front pipes down into the upper core (y = 11.5 -> 14.5)
  for (const sgn of [-1, 1]) {
    g.add(mesh(new THREE.CylinderGeometry(0.065, 0.065, 3.0, 14), warmGreyMat, sgn * 0.88, 13.0, R_EN_CORE + 0.04));
  }

  // =========================================================================
  // 2. UPPER 4× STRAP-ON ZENIT BOOSTERS WITH WARM-GREY FAIRINGS & PODS
  // =========================================================================
  const yInCylTop = 10.80;
  const yConeTop = 14.42;

  for (const sgn of [-1, 1]) {
    const xIn = sgn * X_ZENIT_IN;
    const zIn = Z_ZENIT_IN;
    const xOut = sgn * X_ZENIT_OUT;
    const zOut = Z_ZENIT_OUT;

    // A. Inner-Front White Booster Cylinder (y = 0.0 -> 10.80)
    g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_IN, R_ZENIT_IN, yInCylTop, 48), whiteMat, xIn, yInCylTop * 0.5, zIn));

    // Vertical Warm-Grey Strut Post on the front of the inner booster (y = 6.80 -> 11.45, matching reference image!)
    const hPost = 4.25;
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, hPost, 24), warmGreyMat, xIn + sgn * 0.18, 6.85 + hPost * 0.5, zIn + 0.58));
    g.add(mesh(new THREE.CylinderGeometry(0.02, 0.16, 0.45, 24), warmGreyMat, xIn + sgn * 0.18, 6.85 + hPost + 0.225, zIn + 0.58));
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.05, 0.30, 24), warmGreyMat, xIn + sgn * 0.18, 6.70, zIn + 0.58));

    // B. Outer-Rear White Booster Cylinder (y = 0.0 -> 10.80)
    g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_OUT, R_ZENIT_OUT, yInCylTop, 48), whiteMat, xOut, yInCylTop * 0.5, zOut));

    // C. Slanted Warm-Grey Conical Booster Nose Cap (y = 10.80 -> 14.42)
    const coneH = yConeTop - yInCylTop;
    const coneGeo = shearedBoosterConeGeo(
      1.04,
      0.13,
      sgn * 3.06,
      sgn * (R_EN_CORE + 0.04),
      0.04,
      0.12,
      coneH,
      0.82,
      48,
      24
    );
    g.add(mesh(coneGeo, warmGreyMat, 0, yInCylTop, 0));

    // Dark diagonal seam rings across the warm-grey nose cap (matching reference image!)
    for (const yf of [11.20, 13.05]) {
      const tf = (yf - yInCylTop) / coneH;
      const rf = 1.04 + (0.13 - 1.04) * Math.pow(tf, 0.82) + 0.015;
      const cxf = sgn * (3.06 + (R_EN_CORE + 0.04 - 3.06) * Math.pow(tf, 0.92));
      const ring = mesh(new THREE.CylinderGeometry(rf, rf, 0.05, 36), darkWarmGreyMat, cxf, yf, 0.08);
      ring.rotation.z = sgn * 0.32;
      g.add(ring);
    }

    // D. Curved Warm-Grey Upper Outer Fairing Pod hanging down the outer flank (y = 3.85 -> 11.10) with tapered bottom tip!
    const xPod = xOut + sgn * 0.22;
    const rPod = 0.62;
    const yPodBot = 4.55;
    const yPodTop = 10.95;
    const hPod = yPodTop - yPodBot;
    g.add(mesh(new THREE.CylinderGeometry(rPod, rPod, hPod, 36), warmGreyMat, xPod, yPodBot + hPod * 0.5, zOut));
    // Tapered conical bottom tip of the upper outer pod (y = 3.85 -> 4.55)
    g.add(mesh(new THREE.CylinderGeometry(rPod, 0.26, 0.70, 36), warmGreyMat, xPod, yPodBot - 0.35, zOut));
    // Rounded shoulder connecting the outer pod into the slanted nose cap (y = 10.85 -> 11.35)
    const shoulder = mesh(new THREE.SphereGeometry(rPod, 28, 18), warmGreyMat, xPod, yPodTop, zOut);
    shoulder.scale.set(1.0, 0.85, 1.0);
    g.add(shoulder);
    // Horizontal seam rings on the outer warm-grey pod
    for (const py of [4.55, 8.95, 10.75]) {
      g.add(mesh(new THREE.CylinderGeometry(rPod + 0.014, rPod + 0.014, 0.05, 36), darkWarmGreyMat, xPod, py, zOut));
    }
  }

  // =========================================================================
  // 3. COMPLETE PIGGYBACK BLACK POLYUS ("МИР-2") SPACECRAFT ON +Z
  // Spans from local y = +16.05 (y_world = 31.05) down to y = -13.45 (y_world = 1.55)
  // =========================================================================
  const polyus = new THREE.Group();
  const zPolyus = 2.48;
  const rPolyus = 1.08;
  g.add(polyus);

  // Structural struts connecting Polyus to the Energia central core
  for (const sy of [-9.5, -2.0, 5.5, 11.5]) {
    for (const sgn of [-1, 1]) {
      polyus.add(mesh(new THREE.BoxGeometry(0.20, 0.32, 0.70), darkWarmGreyMat, sgn * 0.62, sy, R_EN_CORE + 0.15));
    }
  }

  // A. Sharp Pointed Black Conical Nose Cone (y = +12.60 -> +16.10, pointing right below the 2 checkerboard squares!)
  const yNoseBot = 12.60;
  const yNoseTip = 16.10;
  const hNose = yNoseTip - yNoseBot;
  polyus.add(mesh(new THREE.CylinderGeometry(0.02, rPolyus, hNose, 48), polyusBlackMat, 0, yNoseBot + hNose * 0.5, zPolyus));
  polyus.add(mesh(new THREE.CylinderGeometry(rPolyus + 0.015, rPolyus + 0.015, 0.06, 48), polyusSeamMat, 0, yNoseBot, zPolyus));

  // B. Main Charcoal-Black Cylindrical Hull (y = -10.10 -> +12.60, r = 1.08)
  const yHullBot = -10.10;
  const hHull = yNoseBot - yHullBot;
  polyus.add(mesh(new THREE.CylinderGeometry(rPolyus, rPolyus, hHull, 56), polyusBlackMat, 0, yHullBot + hHull * 0.5, zPolyus));

  // Horizontal dark panel seam rings along the black hull
  for (const sy of [7.10, 6.50, 4.35, 2.65, 1.35, -0.75, -2.45, -3.15, -4.15, -5.80, -9.75]) {
    polyus.add(mesh(new THREE.CylinderGeometry(rPolyus + 0.016, rPolyus + 0.016, 0.055, 56), polyusSeamMat, 0, sy, zPolyus));
  }

  // 3 Stepped Protruding Black Blister / Cheek Bands (with 45-deg beveled top & bottom shoulders, matching silhouette!)
  const blisters = [
    // [yBot, yTop, rBlister]
    [1.35, 2.65, rPolyus + 0.13],     // Upper blister band above "U U"
    [-2.45, -0.75, rPolyus + 0.15],   // Middle blister band with white "МИР-2"
    [-4.15, -3.10, rPolyus + 0.12],   // Lower blister band
  ];
  for (const [yb, yt, rb] of blisters) {
    const bev = 0.22;
    const hm = (yt - yb) - bev * 2;
    polyus.add(mesh(new THREE.CylinderGeometry(rb, rPolyus, bev, 48), polyusBlackMat, 0, yb + bev * 0.5, zPolyus));
    polyus.add(mesh(new THREE.CylinderGeometry(rb, rb, hm, 48), polyusBlackMat, 0, (yb + yt) * 0.5, zPolyus));
    polyus.add(mesh(new THREE.CylinderGeometry(rPolyus, rb, bev, 48), polyusBlackMat, 0, yt - bev * 0.5, zPolyus));
  }

  // Conformal decal on the front (+Z) of Polyus with the 2 grey "U U" brackets & bold white "МИР-2" lettering!
  const mirArc = 1.45;
  const mirGeo = new THREE.CylinderGeometry(rPolyus + 0.165, rPolyus + 0.165, 4.20, 36, 1, true, -mirArc * 0.5, mirArc);
  polyus.add(mesh(mirGeo, mir2DecalMat, 0, -0.55, zPolyus));

  // C. 2 Lower Black Side Pods / Aux Tanks on the Left & Right Flanks of Polyus (y = -10.10 -> -4.95)
  const ySideBot = -10.10;
  const ySideCylTop = -6.20;
  const ySideConeTop = -4.95;
  const rSidePod = 0.35;
  for (const sgn of [-1, 1]) {
    const sx = sgn * (rPolyus + 0.16);
    const hSideCyl = ySideCylTop - ySideBot;
    polyus.add(mesh(new THREE.CylinderGeometry(rSidePod, rSidePod, hSideCyl, 32), polyusBlackMat, sx, ySideBot + hSideCyl * 0.5, zPolyus));
    // Slanted conical top cap sloping into the main black hull (y = -6.20 -> -4.95)
    const sideCone = shearedBoosterConeGeo(
      rSidePod,
      0.06,
      sx,
      sgn * (rPolyus - 0.08),
      zPolyus,
      zPolyus,
      ySideConeTop - ySideCylTop,
      0.85,
      32,
      12
    );
    polyus.add(mesh(sideCone, polyusBlackMat, 0, ySideCylTop, 0));
    // Crisp light-grey horizontal trim rings at top and bottom of each black side pod (matching reference image!)
    polyus.add(mesh(new THREE.CylinderGeometry(rSidePod + 0.015, rSidePod + 0.015, 0.09, 32), lightGreyRibMat, sx, ySideCylTop - 0.06, zPolyus));
    polyus.add(mesh(new THREE.CylinderGeometry(rSidePod + 0.015, rSidePod + 0.015, 0.10, 32), lightGreyRibMat, sx, ySideBot + 0.06, zPolyus));
  }

  // D. Bottom Vertically-Ribbed Silver/Grey Radiator Collar (y = -11.55 -> -9.85)
  const yRadBot = -11.55;
  const yRadTop = -9.85;
  const hRad = yRadTop - yRadBot;
  const rRad = 0.94;
  polyus.add(mesh(new THREE.CylinderGeometry(rRad, rRad, hRad, 48), lightGreyRibMat, 0, yRadBot + hRad * 0.5, zPolyus));
  // 20 vertical dark charcoal radiator slots around the silver-grey collar
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const slot = mesh(
      new THREE.BoxGeometry(0.085, hRad - 0.18, 0.04),
      polyusBlackMat,
      Math.sin(a) * (rRad + 0.01),
      yRadBot + hRad * 0.5,
      zPolyus + Math.cos(a) * (rRad + 0.01)
    );
    slot.rotation.y = a;
    polyus.add(slot);
  }

  // E. Bottom Tapered Light-Grey Conical Skirt (y = -13.45 -> -11.55)
  const ySkirtBot = -13.45;
  const hSkirt = yRadBot - ySkirtBot;
  polyus.add(mesh(new THREE.CylinderGeometry(rRad, 0.58, hSkirt, 48), lightGreyRibMat, 0, ySkirtBot + hSkirt * 0.5, zPolyus));
  polyus.add(mesh(new THREE.CylinderGeometry(0.54, 0.50, 0.22, 36), warmGreyMat, 0, ySkirtBot - 0.08, zPolyus));

  // Stage 2 Propulsion Nozzles & Parachutes
  for (const [nx, nz] of [[-0.65, -0.55], [0.65, -0.55], [-0.65, 0.55], [0.65, 0.55]]) {
    const mBell = bellMaterial(false);
    g.add(mesh(bellGeometry(0.18, 0.44, 0.65, 28), mBell, nx, 0, nz));
    addNozzle(g, nx, nz, 0.44, [mBell]);
  }
  addParachutes(g, 13.0);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 1 (Bottom): Lower Energia Core, 4× Zenit Boosters with Warm-Grey Outer Pods & 4× RD-0120 / RD-170 Engines (H = 15.0m)
function buildEnergiaCore() {
  const g = new THREE.Group();
  const H = PARTS.energiaCore.height; // 15.0
  const {
    whiteMat,
    lightGreyRibMat,
    warmGreyMat,
    darkWarmGreyMat,
    polyusBlackMat,
  } = getEnergiaMaterials();

  const yCoreBot = 2.75;

  // =========================================================================
  // 1. LOWER ENERGIA CENTRAL CORE (y = 2.75 -> 15.00, r = R_EN_CORE = 1.95)
  // =========================================================================
  const hCore = H - yCoreBot;
  g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE, R_EN_CORE, hCore, 64), whiteMat, 0, yCoreBot + hCore * 0.5, 0));
  for (const ry of [2.80, 8.80, H - 0.05]) {
    g.add(mesh(new THREE.CylinderGeometry(R_EN_CORE + 0.015, R_EN_CORE + 0.015, 0.05, 64), lightGreyRibMat, 0, ry, 0));
  }

  // =========================================================================
  // 2. 4× CENTRAL RD-0120 ENGINE FAIRINGS (WITH BLACK BANDS) & NOZZLE BELLS (y = 0.0 -> 2.75)
  // Matches the bottom center of the reference image!
  // =========================================================================
  const rd0120Coords = [
    [-0.78, 0.55],
    [0.78, 0.55],
    [-0.78, -0.55],
    [0.78, -0.55],
  ];
  for (const [ex, ez] of rd0120Coords) {
    const mBell = bellMaterial(true);
    // Upper cylindrical engine fairing (y = 1.80 -> 2.80, r = 0.58) with bold horizontal black band at y = 2.15!
    g.add(mesh(new THREE.CylinderGeometry(0.58, 0.58, 1.00, 36), warmGreyMat, ex, 2.30, ez));
    g.add(mesh(new THREE.CylinderGeometry(0.595, 0.595, 0.28, 36), polyusBlackMat, ex, 2.16, ez));
    // Tapered warm-grey conical collar (y = 1.15 -> 1.80)
    g.add(mesh(new THREE.CylinderGeometry(0.58, 0.40, 0.65, 36), warmGreyMat, ex, 1.475, ez));
    g.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.10, 36), polyusBlackMat, ex, 1.12, ez));
    // Flared dark-grey RD-0120 nozzle bell (y = 0.0 -> 1.12)
    g.add(mesh(new THREE.CylinderGeometry(0.38, 0.56, 1.12, 36), darkWarmGreyMat, ex, 0.56, ez));
    g.add(mesh(bellGeometry(0.34, 0.55, 1.08, 36), mBell, ex, 0, ez));
    g.add(mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.05, 36), polyusBlackMat, ex, 0.55, ez));
    addNozzle(g, ex, ez, 0.56, [mBell]);
  }

  // =========================================================================
  // 3. LOWER 4× STRAP-ON ZENIT BOOSTERS WITH LONG WARM-GREY OUTER PODS & SIDE BLOCKS
  // =========================================================================
  const yNozTop = 0.85;

  for (const sgn of [-1, 1]) {
    const xIn = sgn * X_ZENIT_IN;
    const zIn = Z_ZENIT_IN;
    const xOut = sgn * X_ZENIT_OUT;
    const zOut = Z_ZENIT_OUT;

    // A. Inner-Front White Booster Cylinder (y = 0.85 -> 15.00)
    const hBoost = H - yNozTop;
    g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_IN, R_ZENIT_IN, hBoost, 48), whiteMat, xIn, yNozTop + hBoost * 0.5, zIn));
    // Stepped white aft ring at bottom of inner booster (y = 0.85 -> 1.45)
    g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_IN + 0.05, R_ZENIT_IN + 0.05, 0.60, 48), whiteMat, xIn, yNozTop + 0.30, zIn));
    g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_IN + 0.06, R_ZENIT_IN + 0.06, 0.06, 48), lightGreyRibMat, xIn, yNozTop + 0.60, zIn));

    // B. Outer-Rear White Booster Cylinder (y = 0.85 -> 15.00)
    g.add(mesh(new THREE.CylinderGeometry(R_ZENIT_OUT, R_ZENIT_OUT, hBoost, 48), whiteMat, xOut, yNozTop + hBoost * 0.5, zOut));

    // C. Long Lower Outer Warm-Grey Fairing Pod (y = 0.85 -> 10.65) + Protruding Rectangular Side Block (y = 6.20 -> 8.45)
    // Lower wider warm-grey pod section (y = 0.85 -> 5.95, r = 0.60)
    const xPod = xOut + sgn * 0.22;
    const rPodLow = 0.60;
    const yPodMid = 5.95;
    const hPodLow = yPodMid - yNozTop;
    g.add(mesh(new THREE.CylinderGeometry(rPodLow, rPodLow, hPodLow, 36), warmGreyMat, xPod, yNozTop + hPodLow * 0.5, zOut));

    // Tapered transition (y = 5.95 -> 6.45) to narrower upper warm-grey tube (y = 6.45 -> 9.85, r = 0.44)
    const rPodUp = 0.44;
    g.add(mesh(new THREE.CylinderGeometry(rPodUp, rPodLow, 0.50, 36), warmGreyMat, xPod, yPodMid + 0.25, zOut));
    g.add(mesh(new THREE.CylinderGeometry(rPodUp, rPodUp, 3.40, 36), warmGreyMat, xPod, 6.45 + 1.70, zOut));
    // Conical top cap of the lower warm-grey pod (y = 9.85 -> 10.65)
    g.add(mesh(new THREE.CylinderGeometry(0.06, rPodUp, 0.80, 36), warmGreyMat, xPod, 9.85 + 0.40, zOut));

    // Horizontal dark seam lines on the lower warm-grey pod
    for (const py of [5.95, 8.85, 9.85]) {
      const rp = py <= 6.0 ? rPodLow + 0.015 : rPodUp + 0.015;
      g.add(mesh(new THREE.CylinderGeometry(rp, rp, 0.05, 36), darkWarmGreyMat, xPod, py, zOut));
    }

    // Protruding Warm-Grey Side Block sticking out on the outer silhouette at y = 6.20 -> 8.45 (matching reference image!)
    const blockShape = new THREE.Shape();
    blockShape.moveTo(0, 6.20);
    blockShape.lineTo(sgn * 0.42, 6.45);
    blockShape.lineTo(sgn * 0.42, 8.20);
    blockShape.lineTo(0, 8.45);
    blockShape.closePath();
    const blockGeo = new THREE.ExtrudeGeometry(blockShape, { depth: 0.46, bevelEnabled: false });
    blockGeo.translate(xPod + sgn * (rPodUp - 0.04), 0, zOut - 0.23);
    g.add(mesh(blockGeo, warmGreyMat));

    // D. Flared Dark-Grey RD-170 Booster Nozzles at the Base (y = 0.0 -> 0.85)
    for (const [bx, bz] of [[xIn, zIn], [xOut, zOut]]) {
      const mBell = bellMaterial(true);
      g.add(mesh(new THREE.CylinderGeometry(0.56, 0.68, yNozTop, 36), darkWarmGreyMat, bx, yNozTop * 0.5, bz));
      g.add(mesh(bellGeometry(0.36, 0.66, yNozTop * 0.95, 36), mBell, bx, 0, bz));
      g.add(mesh(new THREE.CylinderGeometry(0.60, 0.60, 0.08, 36), polyusBlackMat, bx, yNozTop - 0.04, bz));
      addNozzle(g, bx, bz, 0.66, [mBell]);
    }
  }

  return g;
}

// =========================================================================
// LONG MARCH 5 (CHANGZHENG 5 / CZ-5 / TRƯỜNG CHINH 5) HEAVY LAUNCH VEHICLE
// =========================================================================
const R_CZ5_CORE = 1.32;
const R_CZ5_FAIR = 1.38;
const R_CZ5_BOOST = 0.82;
const X_CZ5_BOOST_F = 2.15;
const Z_CZ5_BOOST_F = 0.22;
const X_CZ5_BOOST_B = 1.96;
const Z_CZ5_BOOST_B = -0.78;

let _cz5Mats = null;
function getCz5Materials() {
  if (_cz5Mats) return _cz5Mats;
  const panel = TX.panelTextures();

  const whiteMat = physical({
    color: 0xcfd4dc,
    roughness: 0.74,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.14, 0.14),
    metalness: 0.04,
    clearcoat: 0.08,
    clearcoatRoughness: 0.35,
  });
  const lightGreyMat = physical({
    color: 0xaeb4be,
    roughness: 0.68,
    metalness: 0.12,
  });
  const darkGreyBandMat = physical({
    color: 0x5c6068,
    roughness: 0.62,
    metalness: 0.22,
  });
  const boltDarkMat = physical({
    color: 0x2d3138,
    roughness: 0.55,
    metalness: 0.45,
  });
  const bronzeSeamMat = physical({
    color: 0x8a6428,
    roughness: 0.45,
    metalness: 0.65,
  });
  // Rust-orange / reddish-brown thermal protection curtain at the bottom of the central core
  const rustOrangeSkirtMat = physical({
    color: 0x8e3b1c,
    roughness: 0.82,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.22, 0.22),
    metalness: 0.06,
  });
  const darkNozzleMat = physical({
    color: 0x2b2e34,
    roughness: 0.42,
    metalness: 0.82,
  });

  // Helper to draw a 5-pointed star on a 2D canvas
  const drawStar = (ctx, cx, cy, rOut, rIn, rot = -Math.PI / 2) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? rOut : rIn;
      const a = rot + (i * Math.PI) / 5;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };

  // Decal 1: Payload Fairing Chinese Flag + "CHN"
  const cFlag = document.createElement('canvas');
  cFlag.width = 512;
  cFlag.height = 512;
  const xFlag = cFlag.getContext('2d');
  xFlag.clearRect(0, 0, 512, 512);
  // Red flag rectangle (280 x 186)
  const fx = 116, fy = 90, fw = 280, fh = 186;
  xFlag.fillStyle = '#d82215';
  xFlag.fillRect(fx, fy, fw, fh);
  // Golden stars
  xFlag.fillStyle = '#ffde00';
  drawStar(xFlag, fx + 46, fy + 46, 27, 10.5, -Math.PI / 2);
  const smallStars = [
    [fx + 93, fy + 19, -0.95],
    [fx + 112, fy + 38, -0.45],
    [fx + 112, fy + 66, 0.05],
    [fx + 93, fy + 85, 0.45],
  ];
  for (const [sx, sy, srot] of smallStars) {
    drawStar(xFlag, sx, sy, 9.2, 3.6, srot);
  }
  // "CHN" lettering below flag
  xFlag.fillStyle = '#2d323b';
  xFlag.font = 'bold 46px "Arial", "Segoe UI", sans-serif';
  xFlag.textAlign = 'center';
  xFlag.textBaseline = 'middle';
  xFlag.fillText('C H N', 256, 332);
  const texFlag = new THREE.CanvasTexture(cFlag);
  texFlag.colorSpace = THREE.SRGBColorSpace;
  texFlag.anisotropy = 8;
  const flagChnDecalMat = new THREE.MeshPhysicalMaterial({
    map: texFlag,
    transparent: true,
    roughness: 0.72,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    depthWrite: false,
  });

  // Decal 2: Stage 2 CASC Logo + Vertical "中国航天" + Red "5 LONG MARCH"
  const cSt2 = document.createElement('canvas');
  cSt2.width = 512;
  cSt2.height = 1024;
  const xSt2 = cSt2.getContext('2d');
  xSt2.clearRect(0, 0, 512, 1024);

  // A. Top CASC Circular Blue Emblem (cx = 256, cy = 118)
  const ecx = 256, ecy = 118;
  xSt2.strokeStyle = '#183f7c';
  xSt2.lineWidth = 5;
  xSt2.beginPath();
  xSt2.arc(ecx, ecy, 54, 0, Math.PI * 2);
  xSt2.stroke();
  xSt2.fillStyle = '#183f7c';
  xSt2.beginPath();
  xSt2.arc(ecx, ecy, 44, 0, Math.PI * 2);
  xSt2.fill();
  // White orbital ring arc inside CASC logo
  xSt2.strokeStyle = '#ffffff';
  xSt2.lineWidth = 4;
  xSt2.beginPath();
  xSt2.ellipse(ecx, ecy + 4, 34, 13, -0.22, 0, Math.PI * 2);
  xSt2.stroke();
  // White delta arrow pointing up
  xSt2.fillStyle = '#ffffff';
  xSt2.beginPath();
  xSt2.moveTo(ecx, ecy - 34);
  xSt2.lineTo(ecx + 20, ecy + 18);
  xSt2.lineTo(ecx, ecy + 4);
  xSt2.lineTo(ecx - 20, ecy + 18);
  xSt2.closePath();
  xSt2.fill();
  xSt2.fillStyle = '#183f7c';
  xSt2.font = 'bold 12px "Arial", sans-serif';
  xSt2.textAlign = 'center';
  xSt2.fillText('CASC', ecx, ecy + 34);

  // B. Vertical Navy-Blue "中国航天" Calligraphy (y = 295 .. 615)
  xSt2.fillStyle = '#12294d';
  xSt2.font = '900 76px "Microsoft YaHei", "SimHei", "PingFang SC", "Heiti SC", sans-serif';
  xSt2.textAlign = 'center';
  xSt2.textBaseline = 'middle';
  const chars = ['中', '国', '航', '天'];
  chars.forEach((ch, idx) => {
    xSt2.fillText(ch, 256, 300 + idx * 102);
  });

  // C. Lower Red Swirl "5" Emblem + "LONG MARCH" (cy = 815)
  const rcx = 250, rcy = 810;
  xSt2.fillStyle = '#d62618';
  xSt2.beginPath();
  xSt2.arc(rcx, rcy, 50, 0, Math.PI * 2);
  xSt2.fill();
  // Dynamic white swoosh arc & stylized "5"
  xSt2.strokeStyle = '#ffffff';
  xSt2.lineWidth = 5;
  xSt2.beginPath();
  xSt2.arc(rcx - 4, rcy + 4, 38, -0.8, 2.2);
  xSt2.stroke();
  xSt2.fillStyle = '#ffffff';
  xSt2.font = 'italic 900 68px "Arial Black", "Arial", sans-serif';
  xSt2.fillText('5', rcx + 4, rcy + 4);
  // "LONG MARCH" subtitle below the red 5
  xSt2.fillStyle = '#5c6068';
  xSt2.font = 'bold 21px "Arial", sans-serif';
  xSt2.fillText('LONG MARCH', 256, 892);

  const texSt2 = new THREE.CanvasTexture(cSt2);
  texSt2.colorSpace = THREE.SRGBColorSpace;
  texSt2.anisotropy = 8;
  const stage2DecalMat = new THREE.MeshPhysicalMaterial({
    map: texSt2,
    transparent: true,
    roughness: 0.72,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    depthWrite: false,
  });

  // Decal 3: Booster Vertical 2-Column Red/White Checkerboard + Vertical "CZ-5"
  const cBst = document.createElement('canvas');
  cBst.width = 256;
  cBst.height = 1024;
  const xBst = cBst.getContext('2d');
  xBst.clearRect(0, 0, 256, 1024);

  const drawCheckerBar = (yStart, rows) => {
    const sqW = 26, sqH = 30;
    const x0 = 128 - sqW;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 2; c++) {
        const isRed = (r + c) % 2 === 0;
        xBst.fillStyle = isRed ? '#c8241b' : '#dfe4ec';
        xBst.fillRect(x0 + c * sqW, yStart + r * sqH, sqW, sqH);
      }
    }
    xBst.strokeStyle = 'rgba(60,65,75,0.45)';
    xBst.lineWidth = 2;
    xBst.strokeRect(x0, yStart, sqW * 2, rows * sqH);
  };
  // Upper checkerboard bar (13 rows)
  drawCheckerBar(24, 13);
  // Middle vertical "CZ-5" lettering
  xBst.save();
  xBst.translate(128, 512);
  xBst.rotate(-Math.PI / 2);
  xBst.fillStyle = '#585e68';
  xBst.font = 'bold 38px "Arial", sans-serif';
  xBst.textAlign = 'center';
  xBst.textBaseline = 'middle';
  xBst.fillText('CZ-5', 0, 0);
  xBst.restore();
  // Lower checkerboard bar (13 rows)
  drawCheckerBar(600, 13);

  const texBst = new THREE.CanvasTexture(cBst);
  texBst.colorSpace = THREE.SRGBColorSpace;
  texBst.anisotropy = 8;
  const boosterCheckerDecalMat = new THREE.MeshPhysicalMaterial({
    map: texBst,
    transparent: true,
    roughness: 0.72,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    depthWrite: false,
  });

  _cz5Mats = {
    whiteMat,
    lightGreyMat,
    darkGreyBandMat,
    boltDarkMat,
    bronzeSeamMat,
    rustOrangeSkirtMat,
    darkNozzleMat,
    flagChnDecalMat,
    stage2DecalMat,
    boosterCheckerDecalMat,
  };
  return _cz5Mats;
}

// Stage 3 (Top): Long March 5 Payload Fairing with Ogive Nose, Chinese Flag & "CHN" (H = 9.2m)
function buildCz5Fairing() {
  const g = new THREE.Group();
  const H = PARTS.cz5Fairing.height; // 9.2
  const {
    whiteMat,
    lightGreyMat,
    boltDarkMat,
    bronzeSeamMat,
    flagChnDecalMat,
  } = getCz5Materials();

  const yBoatTop = 0.55;
  const yCylTop = 4.25;
  const yOgiveTop = 9.02;

  // 1. Lower Boattail Adapter Collar (y = 0.0 -> 0.55, stepping from R_CZ5_CORE to R_CZ5_FAIR)
  g.add(mesh(new THREE.CylinderGeometry(R_CZ5_CORE + 0.015, R_CZ5_CORE + 0.015, 0.08, 64), bronzeSeamMat, 0, 0.04, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_CZ5_FAIR, R_CZ5_CORE, yBoatTop - 0.08, 64), whiteMat, 0, 0.08 + (yBoatTop - 0.08) * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_CZ5_FAIR + 0.012, R_CZ5_FAIR + 0.012, 0.05, 64), lightGreyMat, 0, yBoatTop, 0));

  // 2. Cylindrical Fairing Barrel (y = 0.55 -> 4.25, r = R_CZ5_FAIR = 1.38)
  const hCyl = yCylTop - yBoatTop;
  g.add(mesh(new THREE.CylinderGeometry(R_CZ5_FAIR, R_CZ5_FAIR, hCyl, 64), whiteMat, 0, yBoatTop + hCyl * 0.5, 0));
  for (const ry of [1.18, yCylTop]) {
    g.add(mesh(new THREE.CylinderGeometry(R_CZ5_FAIR + 0.012, R_CZ5_FAIR + 0.012, 0.045, 64), lightGreyMat, 0, ry, 0));
  }
  // Small side fairing blisters visible on the fairing barrel in the reference photo
  for (const sgn of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.10, 0.16, 0.12), lightGreyMat, sgn * (R_CZ5_FAIR + 0.02), 0.86, 0.15));
    g.add(mesh(new THREE.BoxGeometry(0.08, 0.14, 0.10), boltDarkMat, sgn * (R_CZ5_FAIR - 0.04), 4.02, 0.42));
  }

  // Conformal Chinese Flag + "CHN" Decal on the front (+Z) of the fairing barrel
  const flagArc = 1.05;
  const flagGeo = new THREE.CylinderGeometry(R_CZ5_FAIR + 0.018, R_CZ5_FAIR + 0.018, 2.85, 36, 1, true, -flagArc * 0.5, flagArc);
  g.add(mesh(flagGeo, flagChnDecalMat, 0, 2.68, 0));

  // 3. Smooth Von Kármán / Tangent Ogive Nose Cone (y = 4.25 -> 9.02)
  const ogivePts = [];
  const nOgive = 40;
  for (let i = 0; i <= nOgive; i++) {
    const t = i / nOgive;
    const r = 0.15 + (R_CZ5_FAIR - 0.15) * Math.pow(1 - Math.pow(t, 1.62), 0.68);
    ogivePts.push(new THREE.Vector2(r, yCylTop + t * (yOgiveTop - yCylTop)));
  }
  g.add(mesh(new THREE.LatheGeometry(ogivePts, 64), whiteMat));

  // Smooth rounded nose cap dome at the apex (y = 9.02 -> 9.20)
  const tipCap = mesh(new THREE.SphereGeometry(0.165, 24, 16), whiteMat, 0, yOgiveTop + 0.04, 0);
  tipCap.scale.set(1.0, 0.88, 1.0);
  g.add(tipCap);

  // Internal orbital propulsion bells & parachutes
  g.add(mesh(new THREE.CylinderGeometry(R_CZ5_CORE * 0.82, R_CZ5_CORE * 0.82, 0.12, 48), boltDarkMat, 0, 0.06, 0));
  for (const sx of [-0.34, 0.34]) {
    const mBell = bellMaterial(true);
    g.add(mesh(bellGeometry(0.12, 0.32, 0.48, 28), mBell, sx, 0, 0));
    addNozzle(g, sx, 0, 0.32, [mBell]);
  }
  addParachutes(g, 8.3);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 2 (Middle): Long March 5 Upper/Mid Core with CASC Emblem, Vertical "中国航天" & Red "5 LONG MARCH" (H = 11.4m)
function buildCz5Stage2() {
  const g = new THREE.Group();
  const H = PARTS.cz5Stage2.height; // 11.4
  const {
    whiteMat,
    lightGreyMat,
    boltDarkMat,
    stage2DecalMat,
  } = getCz5Materials();

  // 1. Main White Core Cylinder (y = 0.0 -> 11.4, r = R_CZ5_CORE = 1.32)
  g.add(mesh(new THREE.CylinderGeometry(R_CZ5_CORE, R_CZ5_CORE, H, 64), whiteMat, 0, H * 0.5, 0));

  // Subtle horizontal panel weld rings matching reference image
  for (const ry of [0.06, 3.85, 6.28, 8.82, 9.18, H - 0.05]) {
    g.add(mesh(new THREE.CylinderGeometry(R_CZ5_CORE + 0.012, R_CZ5_CORE + 0.012, 0.045, 64), lightGreyMat, 0, ry, 0));
  }
  // Prominent interstage structural flange ring below the CASC logo (y = 8.98)
  g.add(mesh(new THREE.CylinderGeometry(R_CZ5_CORE + 0.032, R_CZ5_CORE + 0.032, 0.14, 64), whiteMat, 0, 8.98, 0));

  // Protruding umbilical / retro-thruster pods on the upper interstage collar (matching reference photo!)
  for (const sgn of [-1, 1]) {
    // Upper side blocks near top of interstage (y = 10.82)
    g.add(mesh(new THREE.BoxGeometry(0.14, 0.36, 0.18), whiteMat, sgn * (R_CZ5_CORE + 0.03), 10.82, 0.16));
    g.add(mesh(new THREE.BoxGeometry(0.08, 0.22, 0.12), boltDarkMat, sgn * (R_CZ5_CORE - 0.12), 10.86, 0.68));
    // Flanking vertical fairings on the structural ring (y = 8.98)
    g.add(mesh(new THREE.BoxGeometry(0.16, 0.42, 0.22), whiteMat, sgn * (R_CZ5_CORE + 0.04), 8.98, 0.12));
    g.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.35, 12), lightGreyMat, sgn * (R_CZ5_CORE - 0.18), 9.45, 0.65));
  }

  // 2. Conformal Front Decal (+Z): CASC Emblem + Vertical "中国航天" + Red "5 LONG MARCH"
  const st2Arc = 1.08;
  const st2Geo = new THREE.CylinderGeometry(R_CZ5_CORE + 0.018, R_CZ5_CORE + 0.018, 9.60, 36, 1, true, -st2Arc * 0.5, st2Arc);
  g.add(mesh(st2Geo, stage2DecalMat, 0, 6.20, 0));

  // Small dark optical target dot below "天" (y = 4.22) and vertical external LOX feedline pipe running down to Stage 1
  g.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 16).rotateX(Math.PI * 0.5), boltDarkMat, 0.0, 4.22, R_CZ5_CORE + 0.015));
  const hPipe = 4.35;
  g.add(mesh(new THREE.CylinderGeometry(0.048, 0.048, hPipe, 16), whiteMat, 0.22, hPipe * 0.5, R_CZ5_CORE + 0.028));
  g.add(mesh(new THREE.SphereGeometry(0.052, 12, 10), lightGreyMat, 0.22, hPipe, R_CZ5_CORE + 0.028));

  // 3. Stage 2 Dual YF-75D Vacuum Nozzles & Parachutes
  g.add(mesh(new THREE.CylinderGeometry(R_CZ5_CORE * 0.84, R_CZ5_CORE * 0.84, 0.12, 48), boltDarkMat, 0, 0.06, 0));
  for (const sx of [-0.42, 0.42]) {
    const mBell = bellMaterial(true);
    g.add(mesh(bellGeometry(0.16, 0.42, 0.62, 28), mBell, sx, 0, 0));
    addNozzle(g, sx, 0, 0.42, [mBell]);
  }
  addParachutes(g, 10.2);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 1 (Bottom): Long March 5 First Stage Core (with Rust-Orange Aft Skirt) + 4× Slanted-Nose CZ-5 Boosters (H = 16.6m)
function buildCz5Stage1() {
  const g = new THREE.Group();
  const H = PARTS.cz5Stage1.height; // 16.6
  const {
    whiteMat,
    lightGreyMat,
    darkGreyBandMat,
    boltDarkMat,
    rustOrangeSkirtMat,
    darkNozzleMat,
    boosterCheckerDecalMat,
  } = getCz5Materials();

  const yNozTop = 0.78;
  const yCoreRustTop = 2.42;

  // =========================================================================
  // 1. CENTRAL 5M CORE STAGE (y = 0.78 -> 16.60, r = R_CZ5_CORE = 1.32)
  // =========================================================================
  // Upper white core barrel (y = 2.42 -> 16.60)
  const hCoreWhite = H - yCoreRustTop;
  g.add(mesh(new THREE.CylinderGeometry(R_CZ5_CORE, R_CZ5_CORE, hCoreWhite, 64), whiteMat, 0, yCoreRustTop + hCoreWhite * 0.5, 0));
  for (const ry of [2.44, 6.20, 10.40, 14.20, H - 0.05]) {
    g.add(mesh(new THREE.CylinderGeometry(R_CZ5_CORE + 0.012, R_CZ5_CORE + 0.012, 0.045, 64), lightGreyMat, 0, ry, 0));
  }

  // Continuation of the vertical external LOX feedline/cable pipe down the front of the central core (y = 2.42 -> 16.60)
  g.add(mesh(new THREE.CylinderGeometry(0.048, 0.048, hCoreWhite, 16), whiteMat, 0.22, yCoreRustTop + hCoreWhite * 0.5, R_CZ5_CORE + 0.028));

  // Lower Rust-Orange / Reddish-Brown Thermal Insulation Skirt at the bottom of the central core (y = 0.78 -> 2.42, matching photo!)
  const hRust = yCoreRustTop - yNozTop;
  g.add(mesh(new THREE.CylinderGeometry(R_CZ5_CORE - 0.02, R_CZ5_CORE - 0.04, hRust, 56), rustOrangeSkirtMat, 0, yNozTop + hRust * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_CZ5_CORE, R_CZ5_CORE, 0.08, 56), boltDarkMat, 0, yNozTop + 0.04, 0));

  // Central Core Twin YF-77 Engine Nozzles (arranged front/back along Z so the center bell is clearly visible between the boosters!)
  for (const dz of [-0.32, 0.32]) {
    const mBell = bellMaterial(true);
    g.add(mesh(bellGeometry(0.18, 0.44, yNozTop, 32), darkNozzleMat, 0, 0, dz));
    g.add(mesh(new THREE.CylinderGeometry(0.45, 0.43, 0.08, 28), lightGreyMat, 0, 0.10, dz));
    addNozzle(g, 0, dz, 0.44, [mBell]);
  }

  // =========================================================================
  // 2. 4× 3.35M LIQUID STRAP-ON BOOSTERS WITH SLANTED NOSE CONES, RED CHECKERS, "CZ-5" & FINS
  // =========================================================================
  const yBstSkirtTop = 2.22;
  const yBstGreyTop = 2.90;
  const yBstCylTop = 14.35;
  const yBstConeTop = 17.85; // Extends 1.25m above H=16.6 onto the bottom of Stage 2, right below the red "5" logo!

  for (const sgn of [-1, 1]) {
    const boostersCfg = [
      { bx: sgn * X_CZ5_BOOST_F, bz: Z_CZ5_BOOST_F, isFront: true },
      { bx: sgn * X_CZ5_BOOST_B, bz: Z_CZ5_BOOST_B, isFront: false },
    ];

    for (const { bx, bz, isFront } of boostersCfg) {
      // A. Main White Booster Cylinder (y = 2.90 -> 14.35)
      const hBstWhite = yBstCylTop - yBstGreyTop;
      g.add(mesh(new THREE.CylinderGeometry(R_CZ5_BOOST, R_CZ5_BOOST, hBstWhite, 48), whiteMat, bx, yBstGreyTop + hBstWhite * 0.5, bz));

      // Upper collar ring & twin dark attachment bolt blocks (y = 14.12)
      g.add(mesh(new THREE.CylinderGeometry(R_CZ5_BOOST + 0.014, R_CZ5_BOOST + 0.014, 0.08, 48), lightGreyMat, bx, yBstCylTop - 0.04, bz));
      g.add(mesh(new THREE.CylinderGeometry(R_CZ5_BOOST + 0.012, R_CZ5_BOOST + 0.012, 0.05, 48), lightGreyMat, bx, 13.88, bz));
      if (isFront) {
        g.add(mesh(new THREE.BoxGeometry(0.11, 0.14, 0.12), boltDarkMat, bx - sgn * 0.52, 14.12, bz + R_CZ5_BOOST * 0.76));
        g.add(mesh(new THREE.BoxGeometry(0.10, 0.14, 0.12), boltDarkMat, bx + sgn * 0.56, 14.12, bz + R_CZ5_BOOST * 0.72));
      }

      // B. Conformal Red-and-White 2-Column Checkerboard + "CZ-5" Decal on outer-front of each booster
      const chkArc = 0.78;
      const chkRotY = sgn * 0.32;
      const chkGeo = new THREE.CylinderGeometry(
        R_CZ5_BOOST + 0.016,
        R_CZ5_BOOST + 0.016,
        10.75,
        28,
        1,
        true,
        -chkArc * 0.5 + chkRotY,
        chkArc
      );
      g.add(mesh(chkGeo, boosterCheckerDecalMat, bx, 8.42, bz));

      // C. Lower Dark-Grey Horizontal Band (y = 2.22 -> 2.90)
      const hGrey = yBstGreyTop - yBstSkirtTop;
      g.add(mesh(new THREE.CylinderGeometry(R_CZ5_BOOST + 0.01, R_CZ5_BOOST + 0.01, hGrey, 48), darkGreyBandMat, bx, yBstSkirtTop + hGrey * 0.5, bz));

      // D. White Aft Booster Skirt (y = 0.78 -> 2.22)
      const hSkirt = yBstSkirtTop - yNozTop;
      g.add(mesh(new THREE.CylinderGeometry(R_CZ5_BOOST, R_CZ5_BOOST + 0.03, hSkirt, 48), whiteMat, bx, yNozTop + hSkirt * 0.5, bz));
      g.add(mesh(new THREE.CylinderGeometry(R_CZ5_BOOST + 0.04, R_CZ5_BOOST + 0.04, 0.08, 48), lightGreyMat, bx, yNozTop + 0.04, bz));

      // E. Asymmetric Inward-Slanted White Booster Nose Cone (y = 14.35 -> 17.85)
      const coneH = yBstConeTop - yBstCylTop;
      const targetX = sgn * (R_CZ5_CORE + 0.08);
      const targetZ = isFront ? 0.10 : -0.35;
      const coneGeo = shearedBoosterConeGeo(
        R_CZ5_BOOST,
        0.11,
        bx,
        targetX,
        bz,
        targetZ,
        coneH,
        0.80,
        48,
        24
      );
      g.add(mesh(coneGeo, whiteMat, 0, yBstCylTop, 0));
      // Smooth rounded nose cap tip hugging the core
      const bTip = mesh(new THREE.SphereGeometry(0.115, 20, 14), whiteMat, targetX, yBstConeTop, targetZ);
      bTip.scale.set(1.0, 1.15, 1.0);
      g.add(bTip);

      // F. Outward-Swept Trapezoidal Aerodynamic Fins at the Booster Base (y = 0.78 -> 2.62)
      const finShape = new THREE.Shape();
      finShape.moveTo(0, 0);
      finShape.lineTo(0.76, 0);
      finShape.lineTo(0.76, 0.62);
      finShape.lineTo(0, 1.82);
      finShape.closePath();
      const finGeo = new THREE.ExtrudeGeometry(finShape, {
        depth: 0.06,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.015,
        bevelSegments: 2,
      });
      finGeo.translate(0, 0, -0.03);
      const finMesh = mesh(finGeo, whiteMat, bx + sgn * (R_CZ5_BOOST - 0.04), yNozTop, bz);
      if (sgn < 0) finMesh.rotation.y = Math.PI;
      g.add(finMesh);

      // Structural struts linking booster to core
      g.add(mesh(new THREE.BoxGeometry(0.85, 0.24, 0.28), lightGreyMat, bx - sgn * 0.65, 2.55, bz * 0.6));
      g.add(mesh(new THREE.BoxGeometry(0.85, 0.22, 0.26), lightGreyMat, bx - sgn * 0.65, 14.05, bz * 0.6));

      // G. Twin YF-100 Dark Metallic Engine Nozzles under each Booster (y = 0.0 -> 0.78)
      for (const dx of [-0.26, 0.26]) {
        const mBell = bellMaterial(true);
        g.add(mesh(bellGeometry(0.12, 0.27, yNozTop, 24), darkNozzleMat, bx + dx, 0, bz));
        g.add(mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.08, 20), lightGreyMat, bx + dx, 0.09, bz));
        addNozzle(g, bx + dx, bz, 0.27, [mBell]);
      }
    }
  }

  return g;
}

// =========================================================================
// ARIANE 5 ECA (ESA / CNES / ARIANESPACE / JAMES WEBB) HEAVY LAUNCH VEHICLE
// =========================================================================
const R_AR5_CORE = 1.32;
const R_AR5_BOOST = 0.80;
const X_AR5_BOOST = 2.28;

let _ar5Mats = null;
function getAriane5Materials() {
  if (_ar5Mats) return _ar5Mats;
  const panel = TX.panelTextures();

  const whiteMat = physical({
    color: 0xd0d5dd,
    roughness: 0.72,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.14, 0.14),
    metalness: 0.04,
    clearcoat: 0.10,
    clearcoatRoughness: 0.32,
  });
  // Brushed silver-grey for the EPC cryogenic core tank (matching the ribbed grey core in the reference photo!)
  const epcSilverGreyMat = physical({
    color: 0xaeb3bc,
    roughness: 0.62,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.20, 0.20),
    metalness: 0.18,
    clearcoat: 0.08,
  });
  // Darker metallic grey for the ESC-A upper interstage collar (below the arianespace logo)
  const escaDarkGreyMat = physical({
    color: 0x868c96,
    roughness: 0.54,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.18, 0.18),
    metalness: 0.32,
    clearcoat: 0.12,
  });
  // Warm golden-bronze for the circumferential segment weld rings
  const bronzeRingMat = physical({
    color: 0x8c733e,
    roughness: 0.46,
    metalness: 0.62,
  });
  const darkMetalMat = physical({
    color: 0x2f333a,
    roughness: 0.48,
    metalness: 0.68,
  });
  const eapNozzleMat = physical({
    color: 0x34383f,
    roughness: 0.52,
    metalness: 0.58,
  });
  const vulcainSilverMat = physical({
    color: 0x9aa0aa,
    roughness: 0.36,
    metalness: 0.82,
  });

  // Decal 1: Fairing "arianespace / service & solutions" + Upper Vent Dots & Port
  const cFair = document.createElement('canvas');
  cFair.width = 512;
  cFair.height = 512;
  const xFair = cFair.getContext('2d');
  xFair.clearRect(0, 0, 512, 512);

  // Upper row of black vent dots + subtle circular grey inspection port (y ≈ 130)
  xFair.fillStyle = 'rgba(130, 136, 148, 0.55)';
  xFair.beginPath();
  xFair.arc(256, 102, 16, 0, Math.PI * 2);
  xFair.fill();
  xFair.fillStyle = '#22262c';
  for (let i = -5; i <= 5; i++) {
    xFair.beginPath();
    xFair.arc(256 + i * 24, 142, 3.2, 0, Math.PI * 2);
    xFair.fill();
  }

  // Lower "arianespace" logo with blue orbital swoosh arc + "service & solutions" (y ≈ 355)
  xFair.strokeStyle = '#0066b3';
  xFair.lineWidth = 8;
  xFair.beginPath();
  xFair.ellipse(248, 326, 56, 20, -0.28, Math.PI * 0.95, Math.PI * 2.05);
  xFair.stroke();
  // Small blue triangle swoosh tip
  xFair.fillStyle = '#0088ce';
  xFair.beginPath();
  xFair.moveTo(185, 334);
  xFair.lineTo(212, 314);
  xFair.lineTo(205, 340);
  xFair.closePath();
  xFair.fill();

  xFair.fillStyle = '#14284b';
  xFair.font = 'bold 46px "Arial", "Segoe UI", sans-serif';
  xFair.textAlign = 'center';
  xFair.textBaseline = 'middle';
  xFair.fillText('arianespace', 256, 355);

  xFair.fillStyle = '#3d4654';
  xFair.font = 'bold 20px "Arial", "Segoe UI", sans-serif';
  xFair.fillText('service & solutions', 256, 392);

  const texFair = new THREE.CanvasTexture(cFair);
  texFair.colorSpace = THREE.SRGBColorSpace;
  texFair.anisotropy = 8;
  const fairingDecalMat = new THREE.MeshPhysicalMaterial({
    map: texFair,
    transparent: true,
    roughness: 0.70,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    depthWrite: false,
  });

  // Decal 2: EAP Booster Markings (12 European Flags + "e esa" Logo + Lower "cnes" Logo)
  const cBst = document.createElement('canvas');
  cBst.width = 512;
  cBst.height = 1024;
  const xBst = cBst.getContext('2d');
  xBst.clearRect(0, 0, 512, 1024);

  // Helper to draw a crisp mini European national flag (w=66, h=42)
  const drawFlag = (fx, fy, type) => {
    const fw = 68, fh = 42;
    xBst.save();
    xBst.beginPath();
    xBst.rect(fx, fy, fw, fh);
    xBst.clip();
    if (type === 'de') {
      // Germany (Black / Red / Gold horizontal)
      xBst.fillStyle = '#1a1a1a'; xBst.fillRect(fx, fy, fw, fh / 3);
      xBst.fillStyle = '#d01c1f'; xBst.fillRect(fx, fy + fh / 3, fw, fh / 3);
      xBst.fillStyle = '#f6c500'; xBst.fillRect(fx, fy + (2 * fh) / 3, fw, fh / 3);
    } else if (type === 'fr') {
      // France (Blue / White / Red vertical)
      xBst.fillStyle = '#002654'; xBst.fillRect(fx, fy, fw / 3, fh);
      xBst.fillStyle = '#ffffff'; xBst.fillRect(fx + fw / 3, fy, fw / 3, fh);
      xBst.fillStyle = '#ce1126'; xBst.fillRect(fx + (2 * fw) / 3, fy, fw / 3, fh);
    } else if (type === 'be') {
      // Belgium (Black / Yellow / Red vertical)
      xBst.fillStyle = '#1a1a1a'; xBst.fillRect(fx, fy, fw / 3, fh);
      xBst.fillStyle = '#fae042'; xBst.fillRect(fx + fw / 3, fy, fw / 3, fh);
      xBst.fillStyle = '#ed2939'; xBst.fillRect(fx + (2 * fw) / 3, fy, fw / 3, fh);
    } else if (type === 'dk') {
      // Denmark (Red with white Nordic cross)
      xBst.fillStyle = '#c60c30'; xBst.fillRect(fx, fy, fw, fh);
      xBst.fillStyle = '#ffffff';
      xBst.fillRect(fx + 18, fy, 8, fh);
      xBst.fillRect(fx, fy + fh / 2 - 4, fw, 8);
    } else if (type === 'it') {
      // Italy (Green / White / Red vertical)
      xBst.fillStyle = '#009246'; xBst.fillRect(fx, fy, fw / 3, fh);
      xBst.fillStyle = '#ffffff'; xBst.fillRect(fx + fw / 3, fy, fw / 3, fh);
      xBst.fillStyle = '#ce2b37'; xBst.fillRect(fx + (2 * fw) / 3, fy, fw / 3, fh);
    } else if (type === 'nl') {
      // Netherlands (Red / White / Blue horizontal)
      xBst.fillStyle = '#ae1c28'; xBst.fillRect(fx, fy, fw, fh / 3);
      xBst.fillStyle = '#ffffff'; xBst.fillRect(fx, fy + fh / 3, fw, fh / 3);
      xBst.fillStyle = '#21468b'; xBst.fillRect(fx, fy + (2 * fh) / 3, fw, fh / 3);
    } else if (type === 'es') {
      // Spain (Red / Yellow / Red horizontal)
      xBst.fillStyle = '#aa151b'; xBst.fillRect(fx, fy, fw, fh);
      xBst.fillStyle = '#f1bf00'; xBst.fillRect(fx, fy + fh * 0.25, fw, fh * 0.5);
    } else if (type === 'ch') {
      // Switzerland (Red with white cross)
      xBst.fillStyle = '#d52b1e'; xBst.fillRect(fx, fy, fw, fh);
      xBst.fillStyle = '#ffffff';
      xBst.fillRect(fx + fw / 2 - 5, fy + 7, 10, fh - 14);
      xBst.fillRect(fx + 17, fy + fh / 2 - 5, fw - 34, 10);
    } else if (type === 'se') {
      // Sweden (Blue with yellow Nordic cross)
      xBst.fillStyle = '#006aa7'; xBst.fillRect(fx, fy, fw, fh);
      xBst.fillStyle = '#fecc02';
      xBst.fillRect(fx + 18, fy, 8, fh);
      xBst.fillRect(fx, fy + fh / 2 - 4, fw, 8);
    } else if (type === 'no') {
      // Norway (Red with blue/white cross)
      xBst.fillStyle = '#ba0c2f'; xBst.fillRect(fx, fy, fw, fh);
      xBst.fillStyle = '#ffffff';
      xBst.fillRect(fx + 16, fy, 12, fh);
      xBst.fillRect(fx, fy + fh / 2 - 6, fw, 12);
      xBst.fillStyle = '#00205b';
      xBst.fillRect(fx + 19, fy, 6, fh);
      xBst.fillRect(fx, fy + fh / 2 - 3, fw, 6);
    } else if (type === 'at') {
      // Austria (Red / White / Red horizontal)
      xBst.fillStyle = '#ed2939'; xBst.fillRect(fx, fy, fw, fh / 3);
      xBst.fillStyle = '#ffffff'; xBst.fillRect(fx, fy + fh / 3, fw, fh / 3);
      xBst.fillStyle = '#ed2939'; xBst.fillRect(fx, fy + (2 * fh) / 3, fw, fh / 3);
    } else if (type === 'ie') {
      // Ireland (Green / White / Orange vertical)
      xBst.fillStyle = '#169b62'; xBst.fillRect(fx, fy, fw / 3, fh);
      xBst.fillStyle = '#ffffff'; xBst.fillRect(fx + fw / 3, fy, fw / 3, fh);
      xBst.fillStyle = '#ff883e'; xBst.fillRect(fx + (2 * fw) / 3, fy, fw / 3, fh);
    }
    xBst.strokeStyle = 'rgba(40,45,55,0.35)';
    xBst.lineWidth = 1.5;
    xBst.strokeRect(fx, fy, fw, fh);
    xBst.restore();
  };

  // 1. Upper 2x3 Flag Grid (y = 38 .. 134)
  const colsX = [134, 222, 310];
  drawFlag(colsX[0], 38, 'fr');
  drawFlag(colsX[1], 38, 'dk');
  drawFlag(colsX[2], 38, 'de');
  drawFlag(colsX[0], 90, 'be');
  drawFlag(colsX[1], 90, 'nl');
  drawFlag(colsX[2], 90, 'ie');

  // 2. Center "e esa" Logo (y = 218)
  const esaY = 216;
  xBst.fillStyle = '#4e6788';
  xBst.beginPath();
  xBst.arc(198, esaY, 40, 0, Math.PI * 2);
  xBst.fill();
  // White stylized "e" & dot inside the ESA circle
  xBst.strokeStyle = '#ffffff';
  xBst.lineWidth = 6.5;
  xBst.beginPath();
  xBst.arc(198, esaY, 22, 0.35, Math.PI * 1.88);
  xBst.stroke();
  xBst.fillStyle = '#ffffff';
  xBst.fillRect(196, esaY - 3, 25, 6);
  xBst.beginPath();
  xBst.arc(160, esaY - 12, 5.5, 0, Math.PI * 2);
  xBst.fill();
  // Bold "esa" lettering next to the roundel
  xBst.fillStyle = '#465d7c';
  xBst.font = 'bold 62px "Arial", "Segoe UI", sans-serif';
  xBst.textAlign = 'left';
  xBst.textBaseline = 'middle';
  xBst.fillText('esa', 252, esaY + 2);

  // 3. Lower 2x3 Flag Grid (y = 294 .. 390)
  drawFlag(colsX[0], 294, 'at');
  drawFlag(colsX[1], 294, 'es');
  drawFlag(colsX[2], 294, 'ch');
  drawFlag(colsX[0], 346, 'it');
  drawFlag(colsX[1], 346, 'no');
  drawFlag(colsX[2], 346, 'se');

  // 4. Lower "cnes" Logo in the bottom segment (y = 835)
  const cnesY = 835;
  xBst.fillStyle = '#164d84';
  xBst.beginPath();
  xBst.arc(210, cnesY, 22, 0, Math.PI * 2);
  xBst.fill();
  xBst.strokeStyle = '#164d84';
  xBst.lineWidth = 4;
  xBst.beginPath();
  xBst.moveTo(175, cnesY + 8);
  xBst.lineTo(245, cnesY - 16);
  xBst.stroke();
  xBst.fillStyle = '#164d84';
  xBst.font = 'bold 42px "Arial", "Segoe UI", sans-serif';
  xBst.textAlign = 'left';
  xBst.textBaseline = 'middle';
  xBst.fillText('cnes', 246, cnesY + 2);

  const texBst = new THREE.CanvasTexture(cBst);
  texBst.colorSpace = THREE.SRGBColorSpace;
  texBst.anisotropy = 8;
  const boosterDecalMat = new THREE.MeshPhysicalMaterial({
    map: texBst,
    transparent: true,
    roughness: 0.70,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    depthWrite: false,
  });

  _ar5Mats = {
    whiteMat,
    epcSilverGreyMat,
    escaDarkGreyMat,
    bronzeRingMat,
    darkMetalMat,
    eapNozzleMat,
    vulcainSilverMat,
    fairingDecalMat,
    boosterDecalMat,
  };
  return _ar5Mats;
}

// Stage 3 (Top): Ariane 5 Ogive Payload Fairing ("arianespace") + Brushed Metallic Grey ESC-A Collar (H = 11.2m)
function buildAriane5Fairing() {
  const g = new THREE.Group();
  const H = PARTS.ariane5Fairing.height; // 11.2
  const {
    whiteMat,
    escaDarkGreyMat,
    bronzeRingMat,
    darkMetalMat,
    fairingDecalMat,
  } = getAriane5Materials();

  const yLowWhiteTop = 0.50;
  const yEscaGreyTop = 2.40;
  const yBarrelTop = 6.75;
  const yOgiveTop = 11.02;

  // 1. Lower White Adapter Ring & Metallic Silver-Grey ESC-A Collar (y = 0.0 -> 2.40)
  g.add(mesh(new THREE.CylinderGeometry(R_AR5_CORE, R_AR5_CORE, yLowWhiteTop, 64), whiteMat, 0, yLowWhiteTop * 0.5, 0));
  const hEsca = yEscaGreyTop - yLowWhiteTop;
  g.add(mesh(new THREE.CylinderGeometry(R_AR5_CORE + 0.01, R_AR5_CORE + 0.01, hEsca, 64), escaDarkGreyMat, 0, yLowWhiteTop + hEsca * 0.5, 0));

  // Bronze/gold circumferential seam rings on ESC-A collar
  for (const ry of [0.04, yLowWhiteTop, 1.18, yEscaGreyTop]) {
    g.add(mesh(new THREE.CylinderGeometry(R_AR5_CORE + 0.018, R_AR5_CORE + 0.018, 0.045, 64), bronzeRingMat, 0, ry, 0));
  }
  // Small dark telemetry ports on the ESC-A collar
  g.add(mesh(new THREE.BoxGeometry(0.11, 0.09, 0.04), darkMetalMat, -0.42, 1.32, R_AR5_CORE + 0.01));
  g.add(mesh(new THREE.BoxGeometry(0.09, 0.09, 0.04), darkMetalMat, 0.35, 1.04, R_AR5_CORE + 0.01));

  // Protruding aerodynamic white/silver fairing blisters on the Left & Right flanks of the ESC-A collar (matching photo!)
  for (const sgn of [-1, 1]) {
    const blister = mesh(new THREE.CylinderGeometry(0.10, 0.14, 1.85, 20), whiteMat, sgn * (R_AR5_CORE + 0.02), 1.48, 0.0);
    g.add(blister);
    const bCap = mesh(new THREE.SphereGeometry(0.14, 16, 12), whiteMat, sgn * (R_AR5_CORE + 0.03), 0.58, 0.0);
    bCap.scale.set(0.85, 1.35, 0.85);
    g.add(bCap);
  }

  // 2. Cylindrical White Fairing Barrel (y = 2.40 -> 6.75)
  const hBarrel = yBarrelTop - yEscaGreyTop;
  g.add(mesh(new THREE.CylinderGeometry(R_AR5_CORE, R_AR5_CORE, hBarrel, 64), whiteMat, 0, yEscaGreyTop + hBarrel * 0.5, 0));
  for (const ry of [4.62, yBarrelTop]) {
    g.add(mesh(new THREE.CylinderGeometry(R_AR5_CORE + 0.016, R_AR5_CORE + 0.016, 0.045, 64), bronzeRingMat, 0, ry, 0));
  }

  // Conformal Front Decal (+Z) with Upper Vent Dots, Port & "arianespace / service & solutions"
  const fairArc = 1.15;
  const fairGeo = new THREE.CylinderGeometry(R_AR5_CORE + 0.018, R_AR5_CORE + 0.018, 4.20, 36, 1, true, -fairArc * 0.5, fairArc);
  g.add(mesh(fairGeo, fairingDecalMat, 0, 4.58, 0));

  // 3. Smooth Tangent Ogive Nose Cone (y = 6.75 -> 11.20)
  const ogivePts = [];
  const nOgive = 40;
  for (let i = 0; i <= nOgive; i++) {
    const t = i / nOgive;
    const r = 0.14 + (R_AR5_CORE - 0.14) * Math.pow(1 - Math.pow(t, 1.55), 0.70);
    ogivePts.push(new THREE.Vector2(r, yBarrelTop + t * (yOgiveTop - yBarrelTop)));
  }
  g.add(mesh(new THREE.LatheGeometry(ogivePts, 64), whiteMat));
  const noseCap = mesh(new THREE.SphereGeometry(0.15, 24, 16), whiteMat, 0, yOgiveTop + 0.03, 0);
  noseCap.scale.set(1.0, 0.90, 1.0);
  g.add(noseCap);

  // HM7B Orbital Upper Stage Nozzle & Parachutes
  g.add(mesh(new THREE.CylinderGeometry(R_AR5_CORE * 0.80, R_AR5_CORE * 0.80, 0.12, 48), darkMetalMat, 0, 0.06, 0));
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.14, 0.38, 0.55, 28), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.38, [mBell]);
  addParachutes(g, 10.2);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 2 (Middle): Ariane 5 Upper EPC Core Section & External Feedlines (H = 8.2m)
function buildAriane5Stage2() {
  const g = new THREE.Group();
  const H = PARTS.ariane5Stage2.height; // 8.2
  const {
    whiteMat,
    epcSilverGreyMat,
    bronzeRingMat,
    darkMetalMat,
  } = getAriane5Materials();

  const yGreyTankTop = 4.55;

  // 1. Lower Brushed Silver-Grey EPC Cryogenic Tank Section (y = 0.0 -> 4.55)
  g.add(mesh(new THREE.CylinderGeometry(R_AR5_CORE, R_AR5_CORE, yGreyTankTop, 64), epcSilverGreyMat, 0, yGreyTankTop * 0.5, 0));
  for (const ry of [0.05, 1.55, 3.05, yGreyTankTop]) {
    g.add(mesh(new THREE.CylinderGeometry(R_AR5_CORE + 0.012, R_AR5_CORE + 0.012, 0.04, 64), whiteMat, 0, ry, 0));
  }

  // 2. Upper White Forward Skirt Section (y = 4.55 -> 8.20)
  const hWhite = H - yGreyTankTop;
  g.add(mesh(new THREE.CylinderGeometry(R_AR5_CORE, R_AR5_CORE, hWhite, 64), whiteMat, 0, yGreyTankTop + hWhite * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_AR5_CORE + 0.016, R_AR5_CORE + 0.016, 0.045, 64), bronzeRingMat, 0, 6.45, 0));
  g.add(mesh(new THREE.BoxGeometry(0.08, 0.14, 0.04), darkMetalMat, 0.32, 4.95, R_AR5_CORE + 0.01));

  // Upper Booster Attachment Bracket Fairings on Left & Right flanks (x = ±1.42, y = 4.60 -> 5.85)
  for (const sgn of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.32, 1.15, 0.28), whiteMat, sgn * (R_AR5_CORE + 0.10), 5.15, 0.0));
    g.add(mesh(new THREE.BoxGeometry(0.36, 0.24, 0.32), darkMetalMat, sgn * (R_AR5_CORE + 0.12), 4.72, 0.0));
  }

  // 3. Prominent External Vertical Pipes & Cable Trays on Front (+Z) of the EPC Core (matching reference photo!)
  // Pipe 1 (Left-of-center thick pipe with black pointed cone tip at y = 5.65)
  const p1H = 5.45;
  g.add(mesh(new THREE.CylinderGeometry(0.065, 0.065, p1H, 16), whiteMat, -0.20, p1H * 0.5, R_AR5_CORE + 0.04));
  g.add(mesh(new THREE.ConeGeometry(0.068, 0.32, 16), darkMetalMat, -0.20, p1H + 0.16, R_AR5_CORE + 0.04));

  // Pipe 2 (Center-left rectangular cable tray reaching up to y = 6.35)
  const p2H = 6.35;
  g.add(mesh(new THREE.BoxGeometry(0.085, p2H, 0.075), whiteMat, -0.04, p2H * 0.5, R_AR5_CORE + 0.035));

  // Pipe 3 (Right-of-center pipe starting at y = 2.65 with dark rounded tip)
  const p3H = 2.65;
  g.add(mesh(new THREE.CylinderGeometry(0.058, 0.058, p3H, 16), epcSilverGreyMat, 0.20, p3H * 0.5, R_AR5_CORE + 0.038));
  g.add(mesh(new THREE.SphereGeometry(0.062, 14, 12), darkMetalMat, 0.20, p3H, R_AR5_CORE + 0.038));

  // Pipe 4 (Far-right thin pressurization line starting at y = 1.35)
  const p4H = 1.35;
  g.add(mesh(new THREE.CylinderGeometry(0.036, 0.036, p4H, 12), darkMetalMat, 0.52, p4H * 0.5, R_AR5_CORE + 0.01));

  // Stage 2 Nozzle & Parachutes
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.18, 0.44, 0.62, 28), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.44, [mBell]);
  addParachutes(g, 7.4);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 1 (Bottom): Ariane 5 EPC Main Cryogenic Stage, Vulcain 2 Engine & Twin EAP Solid Boosters with ESA/CNES & 12 Flags (H = 16.2m)
function buildAriane5Stage1() {
  const g = new THREE.Group();
  const H = PARTS.ariane5Stage1.height; // 16.2
  const {
    whiteMat,
    epcSilverGreyMat,
    bronzeRingMat,
    darkMetalMat,
    eapNozzleMat,
    vulcainSilverMat,
    boosterDecalMat,
  } = getAriane5Materials();

  const yCoreBot = 2.15;

  // =========================================================================
  // 1. CENTRAL EPC CRYOGENIC TANK (y = 2.15 -> 16.20, r = R_AR5_CORE = 1.32)
  // =========================================================================
  const hCore = H - yCoreBot;
  g.add(mesh(new THREE.CylinderGeometry(R_AR5_CORE, R_AR5_CORE, hCore, 64), epcSilverGreyMat, 0, yCoreBot + hCore * 0.5, 0));
  for (const ry of [2.55, 4.80, 7.10, 9.40, 11.70, 14.00, H - 0.05]) {
    g.add(mesh(new THREE.CylinderGeometry(R_AR5_CORE + 0.012, R_AR5_CORE + 0.012, 0.04, 64), whiteMat, 0, ry, 0));
  }

  // White Aft Thrust Frame Ring at the bottom of the EPC tank (y = 1.75 -> 2.45)
  g.add(mesh(new THREE.CylinderGeometry(R_AR5_CORE + 0.02, R_AR5_CORE * 0.90, 0.70, 56), whiteMat, 0, 2.10, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_AR5_CORE * 0.88, R_AR5_CORE * 0.65, 0.35, 48), darkMetalMat, 0, 1.58, 0));

  // Continuation of the 4 External Vertical Pipes & Cable Trays down the front (+Z) of the EPC Core (y = 2.15 -> 16.20)
  g.add(mesh(new THREE.CylinderGeometry(0.065, 0.065, hCore, 16), whiteMat, -0.20, yCoreBot + hCore * 0.5, R_AR5_CORE + 0.04));
  g.add(mesh(new THREE.BoxGeometry(0.085, hCore, 0.075), whiteMat, -0.04, yCoreBot + hCore * 0.5, R_AR5_CORE + 0.035));
  g.add(mesh(new THREE.CylinderGeometry(0.058, 0.058, hCore, 16), epcSilverGreyMat, 0.20, yCoreBot + hCore * 0.5, R_AR5_CORE + 0.038));
  g.add(mesh(new THREE.CylinderGeometry(0.036, 0.036, hCore, 12), darkMetalMat, 0.52, yCoreBot + hCore * 0.5, R_AR5_CORE + 0.01));

  // Flared White Aerodynamic Pipe Fairing Brackets at the base of the EPC tank (y = 1.75 -> 2.85, matching photo!)
  for (const px of [-0.20, 0.20, 0.56]) {
    g.add(mesh(new THREE.BoxGeometry(0.18, 0.95, 0.22), whiteMat, px, 2.22, R_AR5_CORE + 0.02));
  }

  // =========================================================================
  // 2. CENTRAL VULCAIN 2 CRYOGENIC ENGINE & SPHERICAL HELIUM POD (y = 0.0 -> 1.85)
  // =========================================================================
  // Metallic Spherical/Teardrop Liquid Helium Tank Pod on the right of the thrust frame (x = +0.74, y = 1.05, matching photo!)
  const heSphere = mesh(new THREE.SphereGeometry(0.32, 24, 18), vulcainSilverMat, 0.74, 1.02, 0.18);
  heSphere.scale.set(1.15, 0.92, 0.95);
  g.add(heSphere);
  g.add(mesh(new THREE.ConeGeometry(0.28, 0.42, 20).rotateZ(-Math.PI * 0.5), vulcainSilverMat, 0.45, 1.02, 0.18));
  g.add(mesh(new THREE.BoxGeometry(0.22, 0.42, 0.24), whiteMat, 0.58, 1.38, 0.18));

  // Curved Turbopump Exhaust / LOX Manifold Pipe on the left of the thrust frame (x = -0.68, y = 1.62, matching photo!)
  const loxPipe = mesh(new THREE.TorusGeometry(0.38, 0.085, 12, 24, Math.PI * 0.75), darkMetalMat, -0.58, 1.48, 0.12);
  loxPipe.rotation.z = 0.45;
  g.add(loxPipe);

  // Central Vulcain 2 Engine: Upper Silver-Grey Chamber (y = 0.82 -> 1.55) + Ribbed Flared Nozzle Bell (y = 0.0 -> 0.85)
  g.add(mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.72, 36), vulcainSilverMat, 0, 1.18, 0));
  for (const ry of [0.92, 1.15, 1.38]) {
    g.add(mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 36), darkMetalMat, 0, ry, 0));
  }
  const mVulcain = bellMaterial(false);
  g.add(mesh(bellGeometry(0.34, 0.62, 0.86, 40), vulcainSilverMat, 0, 0, 0));
  for (const ry of [0.18, 0.42, 0.66]) {
    const rr = 0.60 - ry * 0.28;
    g.add(mesh(new THREE.CylinderGeometry(rr, rr, 0.035, 36), darkMetalMat, 0, ry, 0));
  }
  addNozzle(g, 0, 0, 0.62, [mVulcain]);

  // =========================================================================
  // 3. TWIN EAP P241 SOLID ROCKET BOOSTERS ON LEFT & RIGHT (x = ±2.28, y = 0.0 -> 21.65)
  // Extends 5.45m above H=16.2 to hug Stage 2 seamlessly with zero seam!
  // =========================================================================
  const yBstNozTop = 0.86;
  const yBstSkirtTop = 1.50;
  const yBstCylTop = 18.25;
  const yBstConeTop = 21.65;

  for (const sgn of [-1, 1]) {
    const bx = sgn * X_AR5_BOOST;

    // A. Main White Booster Cylinder (y = 1.50 -> 18.25, r = R_AR5_BOOST = 0.80)
    const hBstCyl = yBstCylTop - yBstSkirtTop;
    g.add(mesh(new THREE.CylinderGeometry(R_AR5_BOOST, R_AR5_BOOST, hBstCyl, 48), whiteMat, bx, yBstSkirtTop + hBstCyl * 0.5, 0));

    // Authentic Golden-Bronze Segment Weld Rings along the EAP booster barrel (matching reference photo!)
    for (const ry of [4.25, 7.45, 10.85, 14.35, yBstCylTop]) {
      g.add(mesh(new THREE.CylinderGeometry(R_AR5_BOOST + 0.015, R_AR5_BOOST + 0.015, 0.05, 48), bronzeRingMat, bx, ry, 0));
    }

    // B. Conformal Front Decal (+Z): 12 European Flags + "e esa" Logo + "cnes" Logo (y = 4.35 -> 18.10)
    const bstArc = 1.32;
    const bstDecGeo = new THREE.CylinderGeometry(
      R_AR5_BOOST + 0.016,
      R_AR5_BOOST + 0.016,
      13.75,
      36,
      1,
      true,
      -bstArc * 0.5,
      bstArc
    );
    g.add(mesh(bstDecGeo, boosterDecalMat, bx, 11.22, 0));

    // C. Lower Booster Aft Ring (y = 4.05), External Hydraulic Pipes & Flared Aft Skirt (y = 0.86 -> 4.15)
    g.add(mesh(new THREE.CylinderGeometry(R_AR5_BOOST + 0.035, R_AR5_BOOST + 0.035, 0.22, 48), whiteMat, bx, 4.02, 0));
    // Heavy structural cross-struts connecting the lower booster ring to the EPC core thrust frame (y = 2.05 & y = 4.02)
    g.add(mesh(new THREE.BoxGeometry(0.95, 0.14, 0.18), whiteMat, bx - sgn * 0.58, 4.02, 0));
    g.add(mesh(new THREE.BoxGeometry(0.95, 0.22, 0.24), whiteMat, bx - sgn * 0.58, 2.05, 0));

    // 2 external vertical white/silver thrust-vectoring pipes on the lower booster barrel (y = 1.25 -> 4.05, matching photo!)
    for (const dx of [-0.22, 0.18]) {
      g.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.85, 14), whiteMat, bx + dx, 2.65, R_AR5_BOOST + 0.02));
      g.add(mesh(new THREE.BoxGeometry(0.14, 0.22, 0.14), whiteMat, bx + dx, 3.98, R_AR5_BOOST + 0.02));
    }

    // Flared White Aft Booster Skirt (y = 0.86 -> 1.50, widening from r = 0.80 to r = 0.94)
    g.add(mesh(new THREE.CylinderGeometry(R_AR5_BOOST, R_AR5_BOOST + 0.14, yBstSkirtTop - yBstNozTop, 48), whiteMat, bx, yBstNozTop + (yBstSkirtTop - yBstNozTop) * 0.5, 0));
    g.add(mesh(new THREE.CylinderGeometry(R_AR5_BOOST + 0.15, R_AR5_BOOST + 0.15, 0.12, 48), whiteMat, bx, yBstNozTop + 0.06, 0));
    // Small dark separation rocket pods on the flared aft skirt rim
    g.add(mesh(new THREE.BoxGeometry(0.14, 0.16, 0.18), darkMetalMat, bx + sgn * 0.72, yBstNozTop + 0.18, 0.55));
    g.add(mesh(new THREE.BoxGeometry(0.14, 0.16, 0.18), darkMetalMat, bx - sgn * 0.65, yBstNozTop + 0.18, 0.55));

    // D. Asymmetric Inward-Slanted White Booster Nose Cone (y = 18.25 -> 21.65)
    const coneH = yBstConeTop - yBstCylTop;
    const targetX = sgn * (R_AR5_CORE + 0.34);
    const coneGeo = shearedBoosterConeGeo(
      R_AR5_BOOST,
      0.16,
      bx,
      targetX,
      0,
      0,
      coneH,
      0.78,
      48,
      24
    );
    g.add(mesh(coneGeo, whiteMat, 0, yBstCylTop, 0));
    const bTip = mesh(new THREE.SphereGeometry(0.165, 20, 14), whiteMat, targetX, yBstConeTop - 0.02, 0);
    bTip.scale.set(1.0, 1.10, 1.0);
    g.add(bTip);

    // Upper forward attachment struts linking the booster nose cone base to Stage 2 core (y = 18.45 -> 19.65)
    g.add(mesh(new THREE.BoxGeometry(0.65, 0.22, 0.24), whiteMat, bx - sgn * 0.55, 18.55, 0.18));

    // E. Wide Dark-Charcoal EAP Solid Booster Nozzle (y = 0.0 -> 0.86)
    const mBell = bellMaterial(true);
    g.add(mesh(bellGeometry(0.54, 0.78, yBstNozTop, 40), eapNozzleMat, bx, 0, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.79, 0.77, 0.10, 40), darkMetalMat, bx, 0.06, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.08, 40), vulcainSilverMat, bx, 0.52, 0));
    addNozzle(g, bx, 0, 0.78, [mBell]);
  }

  return g;
}

// =========================================================================
// NASA SLS ARTEMIS 1 (SPACE LAUNCH SYSTEM BLOCK 1 & ORION) SUPER-HEAVY ROCKET
// =========================================================================
const R_SLS_CORE = 1.36;
const R_SLS_SRB = 0.76;
const X_SLS_SRB = 2.28;

let _slsMats = null;
function getSlsMaterials() {
  if (_slsMats) return _slsMats;
  const panel = TX.panelTextures();
  const foam = TX.foamTextures();

  const whiteMat = physical({
    color: 0xd4d6dc,
    roughness: 0.74,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.14, 0.14),
    metalness: 0.04,
    clearcoat: 0.08,
    clearcoatRoughness: 0.35,
  });
  // Warm cream-white for the aft engine section & SRB nozzles
  const creamWhiteMat = physical({
    color: 0xcac8be,
    roughness: 0.78,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.16, 0.16),
    metalness: 0.05,
  });
  // Authentic NASA SLS Spray-On Foam Insulation (SOFI) Burnt Orange
  const sofiOrangeMat = physical({
    color: 0xb5651d,
    roughness: 0.86,
    normalMap: foam.normal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    metalness: 0.02,
  });
  // Lighter Golden-Ochre / Tan for the SLS intertank & weld bands (matching reference photo!)
  const sofiGoldBandMat = physical({
    color: 0xcf8a2e,
    roughness: 0.82,
    normalMap: foam.normal,
    normalScale: new THREE.Vector2(0.25, 0.25),
    metalness: 0.03,
  });
  const darkMetalMat = physical({
    color: 0x262930,
    roughness: 0.52,
    metalness: 0.62,
  });
  const rs25BlackMat = physical({
    color: 0x1b1d22,
    roughness: 0.46,
    metalness: 0.72,
  });
  const srbNozzleGreyMat = physical({
    color: 0x9fa3aa,
    roughness: 0.68,
    metalness: 0.22,
  });

  // 2x2 Black-and-White Optical Target Checkerboard Texture
  const cTgt = document.createElement('canvas');
  cTgt.width = 128;
  cTgt.height = 128;
  const xTgt = cTgt.getContext('2d');
  xTgt.fillStyle = '#e8ecf2';
  xTgt.fillRect(0, 0, 128, 128);
  xTgt.fillStyle = '#141619';
  xTgt.fillRect(0, 0, 64, 64);
  xTgt.fillRect(64, 64, 64, 64);
  xTgt.strokeStyle = '#222';
  xTgt.lineWidth = 4;
  xTgt.strokeRect(2, 2, 124, 124);
  const texTgt = new THREE.CanvasTexture(cTgt);
  texTgt.colorSpace = THREE.SRGBColorSpace;
  const targetSquareMat = new THREE.MeshPhysicalMaterial({
    map: texTgt,
    roughness: 0.65,
    metalness: 0.05,
  });

  // Decal 1: Orion Crew & Service Module Fairing (US Flag + NASA Worm + NASA Meatball + ESA + Adapter Targets)
  const cOri = document.createElement('canvas');
  cOri.width = 512;
  cOri.height = 512;
  const xOri = cOri.getContext('2d');
  xOri.clearRect(0, 0, 512, 512);

  // A. US Flag on upper Orion shroud (y = 58)
  const ufx = 228, ufy = 44, ufw = 56, ufh = 32;
  xOri.fillStyle = '#ffffff';
  xOri.fillRect(ufx, ufy, ufw, ufh);
  xOri.fillStyle = '#bf0a30';
  for (let s = 0; s < 7; s++) {
    xOri.fillRect(ufx, ufy + s * (ufh / 13) * 2, ufw, ufh / 13 + 0.5);
  }
  xOri.fillStyle = '#002868';
  xOri.fillRect(ufx, ufy, ufw * 0.42, ufh * 0.54);

  // Thin red/maroon seam band below US flag (y = 92)
  xOri.fillStyle = '#8b261d';
  xOri.fillRect(20, 90, 472, 5);

  // B. Red "NASA" Worm Logo on upper-left of ESM barrel (x = 120, y = 142)
  xOri.fillStyle = '#d6281b';
  xOri.font = '900 28px "Orbitron", "Arial Black", sans-serif';
  xOri.textAlign = 'center';
  xOri.textBaseline = 'middle';
  xOri.fillText('NASA', 124, 142);

  // C. Blue Circular NASA "Meatball" Logo in center of ESM barrel (cx = 256, cy = 222)
  const mcx = 256, mcy = 220;
  xOri.fillStyle = '#0b3d91';
  xOri.beginPath();
  xOri.arc(mcx, mcy, 44, 0, Math.PI * 2);
  xOri.fill();
  // White orbital swoosh
  xOri.strokeStyle = '#ffffff';
  xOri.lineWidth = 2.5;
  xOri.beginPath();
  xOri.ellipse(mcx, mcy, 38, 12, -0.35, 0, Math.PI * 2);
  xOri.stroke();
  // Red V-wing chevron
  xOri.strokeStyle = '#fc3d21';
  xOri.lineWidth = 5.5;
  xOri.beginPath();
  xOri.moveTo(mcx - 32, mcy + 16);
  xOri.lineTo(mcx + 6, mcy - 26);
  xOri.lineTo(mcx + 30, mcy + 20);
  xOri.stroke();
  // White "NASA" text across meatball
  xOri.fillStyle = '#ffffff';
  xOri.font = 'bold 24px "Times New Roman", "Arial", serif';
  xOri.fillText('NASA', mcx, mcy + 2);

  // D. "e esa" Logo directly below NASA Meatball (cy = 295)
  xOri.fillStyle = '#1b355a';
  xOri.beginPath();
  xOri.arc(236, 295, 13, 0, Math.PI * 2);
  xOri.fill();
  xOri.fillStyle = '#ffffff';
  xOri.font = 'bold 16px "Arial", sans-serif';
  xOri.fillText('e', 236, 295);
  xOri.fillStyle = '#1b355a';
  xOri.font = 'bold 22px "Arial", sans-serif';
  xOri.fillText('esa', 272, 296);

  // E. Stepped Black Photogrammetry Target Bars on lower conical adapter (y = 395)
  xOri.fillStyle = '#181a1f';
  for (const bx of [118, 382]) {
    xOri.fillRect(bx, 378, 12, 16);
    xOri.fillRect(bx - 10, 394, 12, 16);
    xOri.fillRect(bx - 20, 410, 12, 16);
  }

  const texOri = new THREE.CanvasTexture(cOri);
  texOri.colorSpace = THREE.SRGBColorSpace;
  texOri.anisotropy = 8;
  const orionDecalMat = new THREE.MeshPhysicalMaterial({
    map: texOri,
    transparent: true,
    roughness: 0.70,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    depthWrite: false,
  });

  // Decal 2 & 3: Left & Right 5-Segment SRB Barrels (Sawtooth Zig-Zag Checkerboards + Stepped Black Stripes + Vertical Red "NASA")
  const makeSrbDecalMat = (isLeft) => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 1024;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 512, 1024);

    // Top nose-cone base collar band (y = 0 .. 26): bold black on Left SRB, warm grey on Right SRB (matching photo!)
    ctx.fillStyle = isLeft ? '#181a1f' : '#9a9688';
    ctx.fillRect(0, 4, 512, 22);

    // Helper for horizontal sawtooth/zig-zag checkerboard ring + field-joint grey stripe
    const drawZigZagBand = (yBand) => {
      ctx.fillStyle = '#c4c0b4';
      ctx.fillRect(0, yBand - 16, 512, 8);
      ctx.fillRect(0, yBand + 24, 512, 8);
      const sq = 10;
      for (let x = 0; x < 512; x += sq) {
        const col = Math.floor(x / sq);
        ctx.fillStyle = col % 2 === 0 ? '#181a1f' : '#e8ecf2';
        ctx.fillRect(x, yBand, sq, sq);
        ctx.fillStyle = col % 2 === 1 ? '#181a1f' : '#e8ecf2';
        ctx.fillRect(x, yBand + sq, sq, sq);
      }
    };

    // 3 Horizontal Sawtooth Checkerboard Bands along the 5-segment SRB
    drawZigZagBand(135);
    drawZigZagBand(485);
    drawZigZagBand(835);

    // Intermediate thin grey segment rings
    for (const gy of [250, 365, 600, 715, 955]) {
      ctx.fillStyle = '#b8b4a8';
      ctx.fillRect(0, gy, 512, 6);
    }

    // Iconic Vertical Stepped Black Photogrammetry Roll Stripes down the front of each SRB!
    ctx.fillStyle = '#181a1f';
    // Segment 1 (top, y = 40 .. 120)
    ctx.fillRect(210, 52, 14, 14);
    ctx.fillRect(295, 76, 12, 12);
    ctx.fillRect(195, 100, 12, 12);
    // Segment 2 (y = 175 .. 465)
    ctx.fillRect(228, 175, 16, 70);
    ctx.fillRect(244, 255, 16, 105);
    ctx.fillRect(260, 370, 16, 90);
    // Segment 3 (y = 525 .. 815)
    ctx.fillRect(228, 528, 16, 68);
    ctx.fillRect(244, 605, 16, 105);
    ctx.fillRect(260, 720, 16, 92);
    // Segment 4 (bottom, y = 865 .. 945)
    ctx.fillRect(195, 875, 14, 14);
    ctx.fillRect(212, 895, 14, 14);
    ctx.fillRect(230, 915, 14, 14);
    ctx.fillRect(295, 885, 14, 14);

    // Vertical Red "NASA" Worm Lettering on the outer flank of Left SRB / inner-right flank of Right SRB (y = 580 .. 760)
    ctx.save();
    const nasaX = isLeft ? 122 : 386;
    ctx.translate(nasaX, 675);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#d6281b';
    ctx.font = '900 44px "Orbitron", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N A S A', 0, 0);
    ctx.restore();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return new THREE.MeshPhysicalMaterial({
      map: tex,
      transparent: true,
      roughness: 0.72,
      metalness: 0.04,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      depthWrite: false,
    });
  };

  const srbLeftDecalMat = makeSrbDecalMat(true);
  const srbRightDecalMat = makeSrbDecalMat(false);

  _slsMats = {
    whiteMat,
    creamWhiteMat,
    sofiOrangeMat,
    sofiGoldBandMat,
    darkMetalMat,
    rs25BlackMat,
    srbNozzleGreyMat,
    targetSquareMat,
    orionDecalMat,
    srbLeftDecalMat,
    srbRightDecalMat,
  };
  return _slsMats;
}

// Stage 3 (Top): Orion Spacecraft, Launch Abort System (LAS) Tower & ESM Fairing (H = 11.6m)
function buildSlsOrion() {
  const g = new THREE.Group();
  const H = PARTS.slsOrion.height; // 11.6
  const {
    whiteMat,
    creamWhiteMat,
    darkMetalMat,
    orionDecalMat,
  } = getSlsMaterials();

  const rIcps = 0.96;
  const rEsm = 1.04;

  // 1. Lower Cylindrical White ICPS Skirt (y = 0.0 -> 1.35, r = 0.96)
  g.add(mesh(new THREE.CylinderGeometry(rIcps, rIcps, 1.35, 56), whiteMat, 0, 0.675, 0));
  g.add(mesh(new THREE.CylinderGeometry(rIcps + 0.015, rIcps + 0.015, 0.06, 56), creamWhiteMat, 0, 0.04, 0));
  g.add(mesh(new THREE.CylinderGeometry(rIcps + 0.014, rIcps + 0.014, 0.05, 56), creamWhiteMat, 0, 1.35, 0));

  // 2. Tapered Conical Orion Stage Adapter (y = 1.35 -> 2.15, widening from r = 0.96 up to r = 1.04)
  g.add(mesh(new THREE.CylinderGeometry(rEsm, rIcps, 0.80, 56), whiteMat, 0, 1.75, 0));

  // 3. Cylindrical Orion European Service Module (ESM) Fairing (y = 2.15 -> 4.65, r = 1.04)
  g.add(mesh(new THREE.CylinderGeometry(rEsm, rEsm, 2.50, 56), whiteMat, 0, 3.40, 0));
  // Raised white spacecraft umbilical blister on upper-right of ESM barrel (matching photo!)
  g.add(mesh(new THREE.BoxGeometry(0.24, 0.68, 0.12), whiteMat, 0.24, 4.18, rEsm - 0.02));

  // 4. Ogive Orion Crew Module Launch Shroud (y = 4.65 -> 6.35, tapering from r = 1.04 to r = 0.58)
  const cmPts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const r = 0.58 + (rEsm - 0.58) * Math.pow(1 - t, 0.78);
    cmPts.push(new THREE.Vector2(r, 4.65 + t * 1.70));
  }
  g.add(mesh(new THREE.LatheGeometry(cmPts, 56), whiteMat));

  // Conformal Front Decal (+Z) covering the Adapter, ESM Barrel & Crew Module Shroud (y = 1.40 -> 5.55)
  const oriArc = 1.45;
  const oriGeo = new THREE.CylinderGeometry(rEsm + 0.016, rEsm + 0.016, 4.15, 36, 1, true, -oriArc * 0.5, oriArc);
  g.add(mesh(oriGeo, orionDecalMat, 0, 3.48, 0));

  // 5. Launch Abort System (LAS) Escape Tower (y = 6.35 -> 11.60)
  const tower = new THREE.Group();
  tower.name = 'tower';
  g.add(tower);
  g.userData.tower = tower;

  // Flared conical LAS base skirt (y = 6.35 -> 8.35, tapering from r = 0.58 to r = 0.17)
  tower.add(mesh(new THREE.CylinderGeometry(0.17, 0.58, 2.00, 48), whiteMat, 0, 7.35, 0));
  // Flared LAS Abort Motor Nozzle Collar at y = 8.35 -> 8.75
  tower.add(mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.22, 36), creamWhiteMat, 0, 8.46, 0));
  tower.add(mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.20, 36), creamWhiteMat, 0, 8.66, 0));
  // 4 angled abort motor reverse-flow exhaust nozzles around the collar
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const noz = mesh(new THREE.ConeGeometry(0.065, 0.26, 14), darkMetalMat, Math.cos(a) * 0.22, 8.42, Math.sin(a) * 0.22);
    noz.rotation.z = Math.cos(a) * 0.55;
    noz.rotation.x = -Math.sin(a) * 0.55;
    tower.add(noz);
  }
  // Upper slender white LAS tower mast (y = 8.75 -> 11.10, r = 0.15)
  tower.add(mesh(new THREE.CylinderGeometry(0.145, 0.155, 2.35, 36), whiteMat, 0, 9.925, 0));
  tower.add(mesh(new THREE.CylinderGeometry(0.158, 0.158, 0.08, 36), creamWhiteMat, 0, 9.55, 0));
  // Sharp pointed conical tip at the very top of the LAS tower (y = 11.10 -> 11.60)
  tower.add(mesh(new THREE.ConeGeometry(0.145, 0.50, 36), whiteMat, 0, 11.35, 0));

  // Internal ICPS RL10B-2 Nozzle & Landing Parachutes
  g.add(mesh(new THREE.CylinderGeometry(rIcps * 0.80, rIcps * 0.80, 0.12, 48), darkMetalMat, 0, 0.06, 0));
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.16, 0.40, 0.58, 28), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.40, [mBell]);
  addParachutes(g, 6.1);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 2 (Middle): SLS Tapered Orange LVSA Frustum & Upper SOFI Foam Core Stage (H = 11.8m)
function buildSlsStage2() {
  const g = new THREE.Group();
  const H = PARTS.slsStage2.height; // 11.8
  const {
    whiteMat,
    sofiOrangeMat,
    sofiGoldBandMat,
    darkMetalMat,
    targetSquareMat,
  } = getSlsMaterials();

  const yCylTop = 7.60;
  const rTop = 0.96;

  // 1. Upper Cylindrical Burnt-Orange SOFI Core Barrel (y = 0.0 -> 7.60, r = R_SLS_CORE = 1.36)
  g.add(mesh(new THREE.CylinderGeometry(R_SLS_CORE, R_SLS_CORE, yCylTop, 64), sofiOrangeMat, 0, yCylTop * 0.5, 0));

  // Lighter Golden-Ochre Circumferential Intertank & Weld Bands (matching reference photo!)
  const goldBands = [
    [0.25, 0.50],
    [2.35, 0.65],
    [5.80, 0.72],
    [7.35, 0.48],
  ];
  for (const [by, bh] of goldBands) {
    g.add(mesh(new THREE.CylinderGeometry(R_SLS_CORE + 0.008, R_SLS_CORE + 0.008, bh, 64), sofiGoldBandMat, 0, by, 0));
  }
  // Fine vertical stringer ribs across the intertank band (y = 5.44 -> 6.16)
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const rib = mesh(new THREE.BoxGeometry(0.035, 0.72, 0.02), sofiGoldBandMat, Math.sin(a) * (R_SLS_CORE + 0.012), 5.80, Math.cos(a) * (R_SLS_CORE + 0.012));
    rib.rotation.y = a;
    g.add(rib);
  }

  // 3 small circular golden-tan markings above the lower-middle band (y = 3.05, matching photo!)
  for (const dx of [-0.62, -0.34, -0.06]) {
    const ring = mesh(new THREE.RingGeometry(0.08, 0.14, 20), sofiGoldBandMat, dx, 3.05, R_SLS_CORE + 0.015);
    ring.rotation.y = dx * 0.65;
    g.add(ring);
  }

  // Crisp 2x2 Black-and-White Optical Target Square at y = 7.32 + white plates (matching photo!)
  g.add(mesh(new THREE.BoxGeometry(0.32, 0.32, 0.03), targetSquareMat, 0.14, 7.32, R_SLS_CORE + 0.012));
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.24, 0.025), whiteMat, -0.38, 7.35, R_SLS_CORE + 0.01));
  g.add(mesh(new THREE.BoxGeometry(0.18, 0.26, 0.025), whiteMat, -0.38, 0.95, R_SLS_CORE + 0.01));

  // Top of the External Vertical Orange LOX Feedline with Bright White Conical/Domed Cap at y = 1.15!
  const hPipe = 1.05;
  g.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, hPipe, 20), sofiOrangeMat, 0.08, hPipe * 0.5, R_SLS_CORE + 0.05));
  const pipeCap = mesh(new THREE.ConeGeometry(0.115, 0.34, 20), whiteMat, 0.08, hPipe + 0.17, R_SLS_CORE + 0.05);
  g.add(pipeCap);

  // 2. Upper Tapered Orange LVSA Conical Frustum (y = 7.60 -> 11.80, tapering from r = 1.36 to r = 0.96)
  const hFrust = H - yCylTop;
  g.add(mesh(new THREE.CylinderGeometry(rTop, R_SLS_CORE, hFrust, 64), sofiOrangeMat, 0, yCylTop + hFrust * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(rTop + 0.012, rTop + 0.012, 0.10, 56), sofiGoldBandMat, 0, H - 0.05, 0));

  // 18 radial lighter-tan vertical stringer lines running up the conical frustum (matching photo!)
  const slopeAng = Math.atan2(R_SLS_CORE - rTop, hFrust);
  const slantLen = Math.hypot(R_SLS_CORE - rTop, hFrust) - 0.15;
  const rMid = (R_SLS_CORE + rTop) * 0.5 + 0.008;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const sLine = new THREE.Group();
    sLine.position.set(Math.sin(a) * rMid, yCylTop + hFrust * 0.5, Math.cos(a) * rMid);
    sLine.rotation.y = a;
    sLine.rotation.x = -slopeAng;
    sLine.add(mesh(new THREE.BoxGeometry(0.025, slantLen, 0.015), sofiGoldBandMat, 0, 0, 0));
    g.add(sLine);
  }

  // 2 dark circular umbilical ports on the lower half of the orange LVSA cone (y = 8.45, matching photo!)
  for (const sgn of [-1, 1]) {
    const port = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 20).rotateX(Math.PI * 0.5), darkMetalMat, sgn * 0.58, 8.45, 1.15);
    port.rotation.y = sgn * 0.45;
    g.add(port);
  }

  // Stage 2 Nozzle & Parachutes
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.18, 0.44, 0.62, 28), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.44, [mBell]);
  addParachutes(g, 10.8);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 1 (Bottom): SLS Lower Orange Core, White Engine Section, 4× RS-25 & Twin 5-Segment SRBs (H = 16.8m)
function buildSlsStage1() {
  const g = new THREE.Group();
  const H = PARTS.slsStage1.height; // 16.8
  const {
    whiteMat,
    creamWhiteMat,
    sofiOrangeMat,
    sofiGoldBandMat,
    darkMetalMat,
    rs25BlackMat,
    srbNozzleGreyMat,
    targetSquareMat,
    srbLeftDecalMat,
    srbRightDecalMat,
  } = getSlsMaterials();

  const yNozTop = 0.82;
  const yWhiteSecTop = 2.85;

  // =========================================================================
  // 1. CENTRAL BURNT-ORANGE SOFI CORE BARREL (y = 2.85 -> 16.80, r = R_SLS_CORE = 1.36)
  // =========================================================================
  const hOrange = H - yWhiteSecTop;
  g.add(mesh(new THREE.CylinderGeometry(R_SLS_CORE, R_SLS_CORE, hOrange, 64), sofiOrangeMat, 0, yWhiteSecTop + hOrange * 0.5, 0));

  // Golden-Ochre bands at bottom (y = 3.25) and top (y = 16.50) of the lower core barrel
  g.add(mesh(new THREE.CylinderGeometry(R_SLS_CORE + 0.008, R_SLS_CORE + 0.008, 0.75, 64), sofiGoldBandMat, 0, 3.25, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_SLS_CORE + 0.008, R_SLS_CORE + 0.008, 0.55, 64), sofiGoldBandMat, 0, H - 0.28, 0));

  // 2x2 Black-and-White Optical Target Square on lower-left of the central pipe (y = 5.85, matching photo!)
  g.add(mesh(new THREE.BoxGeometry(0.30, 0.30, 0.03), targetSquareMat, -0.18, 5.85, R_SLS_CORE + 0.012));

  // Continuous External Vertical Orange LOX Feedline / Systems Tunnel (x = +0.08, y = 1.35 -> 16.80)
  const hPipe = H - 1.35;
  g.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, hPipe, 20), sofiOrangeMat, 0.08, 1.35 + hPipe * 0.5, R_SLS_CORE + 0.05));
  for (let py = 3.2; py < H - 0.4; py += 1.65) {
    g.add(mesh(new THREE.BoxGeometry(0.26, 0.08, 0.14), sofiGoldBandMat, 0.08, py, R_SLS_CORE + 0.04));
  }

  // =========================================================================
  // 2. LOWER WHITE AFT ENGINE SECTION & 4× BLACK RS-25 ENGINES (y = 0.0 -> 2.85)
  // =========================================================================
  const hWhiteSec = yWhiteSecTop - yNozTop;
  g.add(mesh(new THREE.CylinderGeometry(R_SLS_CORE, R_SLS_CORE, hWhiteSec, 64), creamWhiteMat, 0, yNozTop + hWhiteSec * 0.5, 0));

  // Row of small dark vent dots around the top of the white engine section (y = 2.68)
  for (let i = -6; i <= 6; i++) {
    const a = i * 0.18;
    g.add(mesh(new THREE.SphereGeometry(0.025, 8, 8), darkMetalMat, Math.sin(a) * R_SLS_CORE, 2.68, Math.cos(a) * R_SLS_CORE));
  }

  // Twin recessed grey umbilical plates on the front of the white engine section (x = ±0.34, y = 1.58, matching photo!)
  for (const sgn of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.34, 0.42, 0.04), srbNozzleGreyMat, sgn * 0.36, 1.58, R_SLS_CORE + 0.01));
    g.add(mesh(new THREE.SphereGeometry(0.04, 10, 8), darkMetalMat, sgn * 0.36, 1.62, R_SLS_CORE + 0.03));
    // Side aerodynamic fairings on the left & right edges of the white engine section
    g.add(mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.45, 16), creamWhiteMat, sgn * (R_SLS_CORE - 0.02), 1.65, 0.15));
  }

  // 4× Black RS-25 Main Engines with White Domed Heatshield Pods (y = 0.0 -> 1.15)
  for (const [ex, ez] of [[-0.52, 0.38], [0.52, 0.38], [-0.52, -0.38], [0.52, -0.38]]) {
    // White rounded heatshield pod at base of core
    const pod = mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.36, 28), creamWhiteMat, ex, yNozTop + 0.12, ez);
    g.add(pod);
    // Dark charcoal-black RS-25 nozzle bell with silver stiffening rings
    const mBell = bellMaterial(true);
    g.add(mesh(bellGeometry(0.18, 0.40, yNozTop, 32), rs25BlackMat, ex, 0, ez));
    for (const ry of [0.16, 0.42, 0.66]) {
      const rr = 0.39 - ry * 0.22;
      g.add(mesh(new THREE.CylinderGeometry(rr, rr, 0.03, 28), srbNozzleGreyMat, ex, ry, ez));
    }
    addNozzle(g, ex, ez, 0.40, [mBell]);
  }

  // =========================================================================
  // 3. TWIN 5-SEGMENT SOLID ROCKET BOOSTERS ON LEFT & RIGHT (x = ±2.28, y = 0.0 -> 20.65)
  // Extends 3.85m above H=16.8 so the SRB nose cones frame the white-capped LOX pipe on Stage 2!
  // =========================================================================
  const ySrbSkirtTop = 2.05;
  const ySrbCylTop = 17.85;
  const ySrbConeTop = 20.65;

  for (const sgn of [-1, 1]) {
    const bx = sgn * X_SLS_SRB;
    const isLeft = sgn < 0;

    // A. Main White 5-Segment SRB Cylinder (y = 2.05 -> 17.85, r = R_SLS_SRB = 0.76)
    const hSrbCyl = ySrbCylTop - ySrbSkirtTop;
    g.add(mesh(new THREE.CylinderGeometry(R_SLS_SRB, R_SLS_SRB, hSrbCyl, 48), whiteMat, bx, ySrbSkirtTop + hSrbCyl * 0.5, 0));

    // Conformal Front Decal (+Z): Zig-Zag Checkerboards, Stepped Black Bars & Vertical Red "NASA"
    const srbArc = 1.65;
    const srbDecGeo = new THREE.CylinderGeometry(
      R_SLS_SRB + 0.015,
      R_SLS_SRB + 0.015,
      hSrbCyl,
      36,
      1,
      true,
      -srbArc * 0.5,
      srbArc
    );
    g.add(mesh(srbDecGeo, isLeft ? srbLeftDecalMat : srbRightDecalMat, bx, ySrbSkirtTop + hSrbCyl * 0.5, 0));

    // Structural attachment struts connecting SRB to SLS Core at top (y = 17.35) and bottom (y = 2.25)
    g.add(mesh(new THREE.BoxGeometry(0.65, 0.22, 0.24), darkMetalMat, bx - sgn * 0.52, 17.35, 0));
    g.add(mesh(new THREE.BoxGeometry(0.65, 0.26, 0.28), creamWhiteMat, bx - sgn * 0.52, 2.25, 0));

    // B. Pointed White Conical SRB Nose Cone (y = 17.85 -> 20.65)
    const hCone = ySrbConeTop - ySrbCylTop;
    g.add(mesh(new THREE.CylinderGeometry(0.05, R_SLS_SRB, hCone, 48), whiteMat, bx, ySrbCylTop + hCone * 0.5, 0));
    const srbTip = mesh(new THREE.SphereGeometry(0.055, 16, 12), creamWhiteMat, bx, ySrbConeTop, 0);
    g.add(srbTip);
    // Small grey stencil block near top of SRB nose cone
    g.add(mesh(new THREE.BoxGeometry(0.14, 0.18, 0.04), srbNozzleGreyMat, bx - sgn * 0.08, ySrbConeTop - 0.65, 0.24));

    // C. Flared White Aft SRB Skirt with Vertical Strakes & Black Checkerboard Blocks (y = 0.82 -> 2.05)
    const hSkirt = ySrbSkirtTop - yNozTop;
    const rSkirtBot = R_SLS_SRB + 0.30;
    g.add(mesh(new THREE.CylinderGeometry(R_SLS_SRB, rSkirtBot, hSkirt, 48), whiteMat, bx, yNozTop + hSkirt * 0.5, 0));
    // Dark-grey horizontal band at bottom of aft skirt (y = 0.82 -> 1.12)
    g.add(mesh(new THREE.CylinderGeometry(rSkirtBot - 0.04, rSkirtBot + 0.02, 0.30, 48), darkMetalMat, bx, yNozTop + 0.15, 0));
    // Raised vertical strake ribs & black photogrammetry squares on the flared aft skirt (matching photo!)
    for (const da of [-0.55, -0.25, 0.05, 0.35, 0.65]) {
      const rx = bx + Math.sin(da) * (R_SLS_SRB + 0.15);
      const rz = Math.cos(da) * (R_SLS_SRB + 0.15);
      const strake = mesh(new THREE.BoxGeometry(0.06, hSkirt * 0.82, 0.08), whiteMat, rx, yNozTop + hSkirt * 0.48, rz);
      strake.rotation.y = da;
      strake.rotation.x = -0.22;
      g.add(strake);
    }
    for (const [ca, cy] of [[-0.42, 1.55], [-0.15, 1.35], [0.22, 1.62], [0.48, 1.40]]) {
      const cx = bx + Math.sin(ca) * (R_SLS_SRB + 0.16);
      const cz = Math.cos(ca) * (R_SLS_SRB + 0.16);
      const blk = mesh(new THREE.BoxGeometry(0.14, 0.14, 0.06), rs25BlackMat, cx, cy, cz);
      blk.rotation.y = ca;
      g.add(blk);
    }

    // D. Wide Light-Grey / White Conical SRB Nozzle Bell (y = 0.0 -> 0.82)
    const mBell = bellMaterial(false);
    g.add(mesh(bellGeometry(0.54, 0.82, yNozTop, 40), creamWhiteMat, bx, 0, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.76, 0.72, 0.18, 40), srbNozzleGreyMat, bx, 0.48, 0));
    addNozzle(g, bx, 0, 0.82, [mBell]);
  }

  return g;
}

// =========================================================================
// ATLAS V (ULA / MARS PERSEVERANCE — 5m BULGED FAIRING, BRONZE-COPPER CCB
// CORE WITH OLIVE-GREEN CONDUIT & TAN CORRUGATED TUNNEL, TWIN SLANTED-NOSE
// WHITE BOOSTERS WITH DEEP NAVY BANDS & DUAL NOZZLES)
// =========================================================================
let _atlasVMats = null;
function getAtlasVMaterials() {
  if (_atlasVMats) return _atlasVMats;

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xf4f5f8,
    roughness: 0.34,
    metalness: 0.06,
  });

  const softGreyMat = new THREE.MeshStandardMaterial({
    color: 0xd9dce2,
    roughness: 0.42,
    metalness: 0.10,
  });

  // Warm bronze-copper metallic-matte finish of the Atlas V Common Core Booster (CCB)
  const copperCoreMat = new THREE.MeshStandardMaterial({
    color: 0xb77b55,
    roughness: 0.45,
    metalness: 0.22,
  });

  // Slightly darker bronze ring seams on the CCB tank
  const copperSeamMat = new THREE.MeshStandardMaterial({
    color: 0x9f6440,
    roughness: 0.50,
    metalness: 0.24,
  });

  // Golden-ochre lower aft adapter section & segmented tunnel base
  const ochreAftMat = new THREE.MeshStandardMaterial({
    color: 0xb98232,
    roughness: 0.48,
    metalness: 0.18,
  });

  // Tan-ochre corrugated cable tunnel body on the lower front-right of CCB
  const tanTunnelMat = new THREE.MeshStandardMaterial({
    color: 0xc99a60,
    roughness: 0.46,
    metalness: 0.16,
  });

  // Olive-green / yellow-green vertical conduit pipe running down the CCB core
  const olivePipeMat = new THREE.MeshStandardMaterial({
    color: 0x8ea946,
    roughness: 0.44,
    metalness: 0.14,
  });

  // Deep navy-blue horizontal bands at the top and bottom of the white boosters
  const navyBandMat = new THREE.MeshStandardMaterial({
    color: 0x0b1948,
    roughness: 0.36,
    metalness: 0.14,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x262930,
    roughness: 0.48,
    metalness: 0.55,
  });

  const nozzleSilverMat = new THREE.MeshStandardMaterial({
    color: 0xb4b8c2,
    roughness: 0.36,
    metalness: 0.62,
  });

  function makeCanvasMat(drawFn, w = 512, h = 512) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.34,
      metalness: 0.06,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  }

  // 1. Upper Fairing Decal: Symmetric Angled Rows of Dark Vent Dots + Crisp US Flag
  const fairingDecalMat = makeCanvasMat((ctx, w, h) => {
    ctx.fillStyle = '#f4f5f8';
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;

    // A. Two symmetric slightly-angled rows of 7 small dark acoustic vent dots near the top (y ~ 0.16..0.24)
    ctx.fillStyle = '#1e2229';
    for (let i = 0; i < 7; i++) {
      const dx = 42 + i * 20;
      const dy = h * 0.21 - i * 4.5;
      // Left row
      ctx.beginPath();
      ctx.arc(cx - dx, dy, 4.2, 0, Math.PI * 2);
      ctx.fill();
      // Right row
      ctx.beginPath();
      ctx.arc(cx + dx, dy, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Lower secondary pair of 3 small vent dots under the outer ends
    for (let i = 0; i < 3; i++) {
      const dx = 95 + i * 22;
      const dy = h * 0.26 - i * 3.5;
      ctx.beginPath();
      ctx.arc(cx - dx, dy, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + dx, dy, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Tiny vertical centerline mark between the vent rows
    ctx.fillStyle = '#5c626e';
    ctx.fillRect(cx - 2, h * 0.22, 4, 18);

    // B. Crisp US Flag centered on the upper fairing cylinder (y ~ 0.46..0.80)
    const fw = 276;
    const fh = 152;
    const fx = cx - fw * 0.5;
    const fy = h * 0.47;

    // White backing & subtle border
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(fx, fy, fw, fh);

    // 13 Red & White horizontal stripes
    const sh = fh / 13;
    ctx.fillStyle = '#bf1e2e';
    for (let s = 0; s < 13; s += 2) {
      ctx.fillRect(fx, fy + s * sh, fw, sh + 0.5);
    }

    // Blue Canton on top-left (7 stripes tall, 40% flag width)
    const cw = fw * 0.41;
    const ch = sh * 7;
    ctx.fillStyle = '#0c2340';
    ctx.fillRect(fx, fy, cw, ch);

    // 50 White Stars grid inside the blue canton
    ctx.fillStyle = '#ffffff';
    for (let r = 0; r < 5; r++) {
      for (let col = 0; col < 6; col++) {
        const sx = fx + 10 + col * ((cw - 20) / 5);
        const sy = fy + 9 + r * ((ch - 18) / 4);
        ctx.beginPath();
        ctx.arc(sx, sy, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 5; col++) {
        const sx = fx + 19 + col * ((cw - 20) / 5);
        const sy = fy + 18 + r * ((ch - 18) / 4);
        ctx.beginPath();
        ctx.arc(sx, sy, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, 512, 512);

  // 2. White Interstage Decal: Iconic Atlas V / ULA Emblem & Blue Typography
  const interstageDecalMat = makeCanvasMat((ctx, w, h) => {
    ctx.fillStyle = '#f4f5f8';
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;

    // A. Atlas V Square Mission Badge (Dark Navy/Teal Box with Stylized Green & Gold 'A' Star Swoosh)
    const bw = 112;
    const bh = 96;
    const bx = cx - bw * 0.5;
    const by = h * 0.20;

    ctx.fillStyle = '#0e2947';
    ctx.fillRect(bx, by, bw, bh);

    // Diagonal green/gold swoosh arc inside the badge
    ctx.strokeStyle = '#6db33f';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx + 12, by + bh * 0.78, 56, Math.PI * 1.08, Math.PI * 1.78);
    ctx.stroke();

    // Stylized white & gold "A" peak inside the badge
    ctx.strokeStyle = '#e8c547';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx - 28, by + bh - 14);
    ctx.lineTo(cx + 2, by + 16);
    ctx.lineTo(cx + 26, by + bh - 14);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 20, by + bh * 0.62);
    ctx.lineTo(cx + 22, by + bh * 0.52);
    ctx.stroke();

    // B. Two lines of crisp dark-blue text below the badge ("ATLAS V" / "UNITED LAUNCH ALLIANCE")
    ctx.fillStyle = '#153a6e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 24px "Arial Black", Impact, sans-serif';
    ctx.fillText('ATLAS V', cx, by + bh + 28);

    ctx.fillStyle = '#1d4d8c';
    ctx.font = 'bold 17px Arial, sans-serif';
    ctx.fillText('UNITED LAUNCH', cx, by + bh + 54);
  }, 512, 384);

  _atlasVMats = {
    whiteMat,
    softGreyMat,
    copperCoreMat,
    copperSeamMat,
    ochreAftMat,
    tanTunnelMat,
    olivePipeMat,
    navyBandMat,
    darkMetalMat,
    nozzleSilverMat,
    fairingDecalMat,
    interstageDecalMat,
  };
  return _atlasVMats;
}

const R_ATLAS_CORE = 0.94;
const R_ATLAS_WIDE = 1.18;
const R_ATLAS_UPPER = 0.96;
const R_ATLAS_SRB = 0.62;
const ATLAS_PIPE_ANG = 0.24; // Front-right angle of the olive-green vertical conduit & tan tunnel

// Stage 3: Atlas V 5m Bulged Payload Fairing with Boat-Tail, Corrugated Shoulder, US Flag & Vent Dots
function buildAtlasVFairing() {
  const g = new THREE.Group();
  const H = PARTS.atlasVFairing.height; // 9.8
  const {
    whiteMat,
    softGreyMat,
    darkMetalMat,
    fairingDecalMat,
  } = getAtlasVMaterials();

  const yBoattailTop = 1.15;
  const yWideTop = 3.35;
  const yShoulderTop = 4.05;
  const yUpperCylTop = 6.85;

  // 1. Conical Boat-Tail Adapter at bottom of Fairing (y = 0.0 -> 1.15, r: 0.94 -> 1.18)
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_WIDE, R_ATLAS_CORE, yBoattailTop, 64), whiteMat, 0, yBoattailTop * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_CORE + 0.006, R_ATLAS_CORE + 0.006, 0.06, 64), softGreyMat, 0, 0.03, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_WIDE + 0.006, R_ATLAS_WIDE + 0.006, 0.06, 64), softGreyMat, 0, yBoattailTop, 0));

  // 2. Wide Cylindrical Centaur Shroud Section (y = 1.15 -> 3.35, r = 1.18)
  const hWide = yWideTop - yBoattailTop;
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_WIDE, R_ATLAS_WIDE, hWide, 64), whiteMat, 0, yBoattailTop + hWide * 0.5, 0));
  // Subtle light-grey horizontal bands around the wide cylinder (matching reference photo)
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_WIDE + 0.006, R_ATLAS_WIDE + 0.006, 0.18, 64), softGreyMat, 0, 1.38, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_WIDE + 0.005, R_ATLAS_WIDE + 0.005, 0.07, 64), softGreyMat, 0, 2.42, 0));

  // 3. Corrugated Conical Shoulder Frustum (y = 3.35 -> 4.05, r: 1.18 -> 0.96)
  const hShoulder = yShoulderTop - yWideTop;
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_UPPER, R_ATLAS_WIDE, hShoulder, 64), whiteMat, 0, yWideTop + hShoulder * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_WIDE + 0.007, R_ATLAS_WIDE + 0.007, 0.06, 64), softGreyMat, 0, yWideTop, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_UPPER + 0.007, R_ATLAS_UPPER + 0.007, 0.06, 64), softGreyMat, 0, yShoulderTop, 0));

  // 48 Fine Vertical Corrugated Ribs around the conical shoulder frustum
  const rMidShoulder = (R_ATLAS_WIDE + R_ATLAS_UPPER) * 0.5 + 0.006;
  const tiltShoulder = Math.atan2(R_ATLAS_WIDE - R_ATLAS_UPPER, hShoulder);
  const ribLen = Math.hypot(hShoulder, R_ATLAS_WIDE - R_ATLAS_UPPER) * 0.92;
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const rib = mesh(
      new THREE.BoxGeometry(0.024, ribLen, 0.022),
      i % 2 === 0 ? whiteMat : softGreyMat,
      Math.sin(a) * rMidShoulder,
      yWideTop + hShoulder * 0.5,
      Math.cos(a) * rMidShoulder
    );
    rib.rotation.y = a;
    rib.rotation.x = -tiltShoulder;
    g.add(rib);
  }

  // 4. Upper Cylindrical Fairing Body (y = 4.05 -> 6.85, r = 0.96)
  const hUpper = yUpperCylTop - yShoulderTop;
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_UPPER, R_ATLAS_UPPER, hUpper, 64), whiteMat, 0, yShoulderTop + hUpper * 0.5, 0));

  // Conformal Decal on Front (+Z) and Back (-Z): Symmetric Vent Dots + US Flag
  const arcSpan = 1.48;
  for (const rotY of [0, Math.PI]) {
    const decGeo = new THREE.CylinderGeometry(
      R_ATLAS_UPPER + 0.011,
      R_ATLAS_UPPER + 0.011,
      hUpper * 0.92,
      40,
      1,
      true,
      -arcSpan * 0.5,
      arcSpan
    );
    const decMesh = mesh(decGeo, fairingDecalMat, 0, yShoulderTop + hUpper * 0.5, 0);
    decMesh.rotation.y = rotY;
    g.add(decMesh);
  }

  // 5. Sleek Pointed White Ogive Nose Cone (y = 6.85 -> 9.80, r: 0.96 -> 0)
  const hOgive = H - yUpperCylTop;
  const ogiveSlices = 24;
  for (let i = 0; i < ogiveSlices; i++) {
    const t0 = i / ogiveSlices;
    const t1 = (i + 1) / ogiveSlices;
    const r0 = R_ATLAS_UPPER * Math.pow(1 - t0, 0.64);
    const r1 = R_ATLAS_UPPER * Math.pow(1 - t1, 0.64);
    const sh = hOgive / ogiveSlices;
    const sy = yUpperCylTop + (t0 + t1) * 0.5 * hOgive;
    g.add(mesh(new THREE.CylinderGeometry(Math.max(0.02, r1), r0, sh + 0.008, 56), whiteMat, 0, sy, 0));
  }
  const noseTip = mesh(new THREE.SphereGeometry(0.035, 16, 12), softGreyMat, 0, H, 0);
  g.add(noseTip);

  // Recessed upper-stage thruster & parachutes
  const mBell = bellMaterial(true);
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_CORE * 0.88, R_ATLAS_CORE * 0.88, 0.14, 36), darkMetalMat, 0, 0.07, 0));
  g.add(mesh(bellGeometry(0.22, 0.34, 0.44, 24), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.34, [mBell]);
  addParachutes(g, H * 0.62);

  return g;
}

// Stage 2: White Interstage with Atlas V Logo & Upper Bronze-Copper CCB Core with Olive-Green Conduit
function buildAtlasVStage2() {
  const g = new THREE.Group();
  const H = PARTS.atlasVStage2.height; // 6.4
  const {
    whiteMat,
    softGreyMat,
    copperCoreMat,
    copperSeamMat,
    ochreAftMat,
    olivePipeMat,
    darkMetalMat,
    interstageDecalMat,
  } = getAtlasVMaterials();

  const yCopperTop = 4.45; // 0.0 -> 4.45 is Upper Bronze-Copper CCB; 4.45 -> 6.40 is White Interstage

  // 1. Upper Bronze-Copper Common Core Booster (CCB) Barrel (y = 0.0 -> 4.45, r = 0.94)
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_CORE, R_ATLAS_CORE, yCopperTop, 64), copperCoreMat, 0, yCopperTop * 0.5, 0));

  // Subtle bronze weld rings on the upper CCB barrel
  for (const ry of [0.06, 1.45, 2.95, yCopperTop - 0.05]) {
    g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_CORE + 0.006, R_ATLAS_CORE + 0.006, 0.07, 64), copperSeamMat, 0, ry, 0));
  }

  // Golden-tan transition collar at y = 4.45 where the bronze-copper core meets the white interstage
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_CORE + 0.010, R_ATLAS_CORE + 0.010, 0.10, 64), ochreAftMat, 0, yCopperTop, 0));

  // 2. External Conduit Assembly on Front-Right of Upper Bronze-Copper Core (angle = ATLAS_PIPE_ANG)
  const px = Math.sin(ATLAS_PIPE_ANG) * (R_ATLAS_CORE + 0.045);
  const pz = Math.cos(ATLAS_PIPE_ANG) * (R_ATLAS_CORE + 0.045);

  // A. White Rectangular/Half-Cylindrical Upper Cap Block near top of bronze tank (y = 3.42 -> 4.34)
  const topCap = mesh(new THREE.BoxGeometry(0.22, 0.92, 0.14), whiteMat, px, 3.88, pz);
  topCap.rotation.y = ATLAS_PIPE_ANG;
  g.add(topCap);
  // Narrower stepped white neck just below the upper block (y = 3.16 -> 3.42)
  const neckCap = mesh(new THREE.BoxGeometry(0.15, 0.26, 0.12), softGreyMat, px, 3.29, pz);
  neckCap.rotation.y = ATLAS_PIPE_ANG;
  g.add(neckCap);

  // B. Olive-Green Vertical Conduit Pipe running down from y = 3.16 to y = 0.0 (connects seamlessly to Stage 1!)
  const hPipe = 3.16;
  g.add(mesh(new THREE.CylinderGeometry(0.068, 0.068, hPipe, 20), olivePipeMat, px, hPipe * 0.5, pz));
  // Subtle clamp rings along the olive-green pipe
  for (const cy of [0.65, 1.55, 2.45]) {
    g.add(mesh(new THREE.CylinderGeometry(0.076, 0.076, 0.05, 20), olivePipeMat, px, cy, pz));
  }

  // 3. White Interstage Cylinder (y = 4.45 -> 6.40, r = 0.94)
  const hInter = H - yCopperTop;
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_CORE, R_ATLAS_CORE, hInter, 64), whiteMat, 0, yCopperTop + hInter * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_CORE + 0.006, R_ATLAS_CORE + 0.006, 0.06, 64), softGreyMat, 0, H - 0.03, 0));

  // Conformal Atlas V / ULA Emblem Decal on Front (+Z) and Back (-Z) of the White Interstage
  const arcSpan = 1.18;
  for (const rotY of [0, Math.PI]) {
    const decGeo = new THREE.CylinderGeometry(
      R_ATLAS_CORE + 0.011,
      R_ATLAS_CORE + 0.011,
      hInter * 0.88,
      36,
      1,
      true,
      -arcSpan * 0.5,
      arcSpan
    );
    const decMesh = mesh(decGeo, interstageDecalMat, 0, yCopperTop + hInter * 0.5, 0);
    decMesh.rotation.y = rotY;
    g.add(decMesh);
  }

  // Recessed Centaur RL10 Stage 2 Engine for staging flight
  const mBell = bellMaterial(true);
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_CORE * 0.88, R_ATLAS_CORE * 0.88, 0.14, 36), darkMetalMat, 0, 0.07, 0));
  g.add(mesh(bellGeometry(0.24, 0.38, 0.52, 24), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.38, [mBell]);
  addParachutes(g, H * 0.88);

  return g;
}

// Stage 1: Lower Bronze-Copper CCB Core with Olive-Green Conduit, Segmented Tan Tunnel,
// Golden-Ochre Aft Adapter, White Engine Skirt & Twin Slanted-Nose White Boosters with Dual Nozzles
function buildAtlasVStage1() {
  const g = new THREE.Group();
  const H = PARTS.atlasVStage1.height; // 15.6
  const {
    whiteMat,
    softGreyMat,
    copperCoreMat,
    copperSeamMat,
    ochreAftMat,
    tanTunnelMat,
    olivePipeMat,
    navyBandMat,
    darkMetalMat,
    nozzleSilverMat,
  } = getAtlasVMaterials();

  const yCoreSkirtBot = 0.42;
  const yWhiteSkirtTop = 1.65;
  const yOchreTop = 2.98;
  const yCreamBandTop = 3.20;

  // =========================================================================
  // 1. CENTRAL ATLAS V COMMON CORE BOOSTER (CCB) (y = 0.42 -> 15.60)
  // =========================================================================
  // A. Lower Bronze-Copper Core Barrel (y = 3.20 -> 15.60, r = 0.94)
  const hCopper = H - yCreamBandTop;
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_CORE, R_ATLAS_CORE, hCopper, 64), copperCoreMat, 0, yCreamBandTop + hCopper * 0.5, 0));

  // Subtle horizontal weld seams along the bronze-copper barrel
  for (const sy of [4.8, 6.8, 8.8, 10.8, 12.8, 14.6, H - 0.05]) {
    g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_CORE + 0.006, R_ATLAS_CORE + 0.006, 0.06, 64), copperSeamMat, 0, sy, 0));
  }

  // Two small circular sensor bullseyes on the center-front face of the bronze tank (matching photo!)
  const bull1 = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 20), ochreAftMat, -0.05, 8.55, R_ATLAS_CORE + 0.005);
  bull1.rotation.x = Math.PI / 2;
  g.add(bull1);
  const bull1In = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.035, 16), copperSeamMat, -0.05, 8.55, R_ATLAS_CORE + 0.006);
  bull1In.rotation.x = Math.PI / 2;
  g.add(bull1In);
  const bull2 = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16), darkMetalMat, -0.03, 9.35, R_ATLAS_CORE + 0.005);
  bull2.rotation.x = Math.PI / 2;
  g.add(bull2);

  // B. Continuous Olive-Green Conduit Pipe & Segmented Tan Tunnel on Front-Right (angle = ATLAS_PIPE_ANG)
  const px = Math.sin(ATLAS_PIPE_ANG) * (R_ATLAS_CORE + 0.045);
  const pz = Math.cos(ATLAS_PIPE_ANG) * (R_ATLAS_CORE + 0.045);

  // Olive-green vertical pipe from top of Stage 1 (y = 15.60) down to y = 8.35
  const yPipeBot = 8.35;
  const hPipe = H - yPipeBot;
  g.add(mesh(new THREE.CylinderGeometry(0.068, 0.068, hPipe, 20), olivePipeMat, px, yPipeBot + hPipe * 0.5, pz));
  for (const cy of [9.2, 10.6, 12.0, 13.4, 14.8]) {
    g.add(mesh(new THREE.CylinderGeometry(0.076, 0.076, 0.05, 20), olivePipeMat, px, cy, pz));
  }

  // White Conical Transition Cap widening from the olive-green pipe into the lower tan tunnel (y = 7.35 -> 8.35)
  const yConeBot = 7.35;
  const hTransCone = yPipeBot - yConeBot;
  const tx = Math.sin(ATLAS_PIPE_ANG) * (R_ATLAS_CORE + 0.055);
  const tz = Math.cos(ATLAS_PIPE_ANG) * (R_ATLAS_CORE + 0.055);
  g.add(mesh(new THREE.CylinderGeometry(0.068, 0.195, hTransCone, 24), whiteMat, tx, yConeBot + hTransCone * 0.5, tz));

  // Wide Segmented Tan-Ochre Half-Cylinder Tunnel (y = 2.85 -> 7.35) with 7 horizontal darker-tan ribs
  const yTunnelBot = 2.85;
  const hTunnel = yConeBot - yTunnelBot;
  g.add(mesh(new THREE.CylinderGeometry(0.195, 0.195, hTunnel, 24), tanTunnelMat, tx, yTunnelBot + hTunnel * 0.5, tz));
  for (let i = 0; i < 7; i++) {
    const ry = yTunnelBot + 0.35 + i * 0.62;
    g.add(mesh(new THREE.CylinderGeometry(0.203, 0.203, 0.10, 24), copperSeamMat, tx, ry, tz));
  }

  // Crisp White Rectangular Cap at the bottom of the tan tunnel (y = 2.38 -> 2.88)
  const botCap = mesh(new THREE.BoxGeometry(0.36, 0.50, 0.24), whiteMat, tx, 2.63, tz);
  botCap.rotation.y = ATLAS_PIPE_ANG;
  g.add(botCap);

  // C. Cream-White Horizontal Ring Band at bottom of bronze barrel (y = 2.98 -> 3.20)
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_CORE + 0.008, R_ATLAS_CORE + 0.008, yCreamBandTop - yOchreTop, 64), whiteMat, 0, (yOchreTop + yCreamBandTop) * 0.5, 0));

  // D. Golden-Ochre Aft Adapter Ring with Vertical Stringer Ribs (y = 1.65 -> 2.98)
  const hOchre = yOchreTop - yWhiteSkirtTop;
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_CORE - 0.01, R_ATLAS_CORE - 0.02, hOchre, 64), ochreAftMat, 0, yWhiteSkirtTop + hOchre * 0.5, 0));
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const rib = mesh(
      new THREE.BoxGeometry(0.035, hOchre * 0.88, 0.035),
      copperSeamMat,
      Math.sin(a) * (R_ATLAS_CORE - 0.005),
      yWhiteSkirtTop + hOchre * 0.5,
      Math.cos(a) * (R_ATLAS_CORE - 0.005)
    );
    rib.rotation.y = a;
    g.add(rib);
  }

  // E. White Cylindrical Aft Engine Skirt at base of Central Core (y = 0.42 -> 1.65, r = 0.90)
  const hWhiteSkirt = yWhiteSkirtTop - yCoreSkirtBot;
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_CORE - 0.02, R_ATLAS_CORE - 0.04, hWhiteSkirt, 64), whiteMat, 0, yCoreSkirtBot + hWhiteSkirt * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_CORE - 0.05, R_ATLAS_CORE - 0.05, 0.10, 48), darkMetalMat, 0, yCoreSkirtBot + 0.05, 0));

  // F. Central Core Engine Bell (RD-180) at (0, 0, 0)
  const mCoreBell = bellMaterial(false);
  g.add(mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.22, 32), nozzleSilverMat, 0, 0.42, 0));
  g.add(mesh(bellGeometry(0.36, 0.54, 0.45, 36), mCoreBell, 0, -0.08, 0));
  addNozzle(g, 0, 0, 0.54, [mCoreBell]);

  // =========================================================================
  // 2. TWIN LARGE WHITE STRAP-ON BOOSTERS WITH SLANTED NOSE CONES,
  //    NAVY-BLUE BANDS, VERTICAL WHITE SPINE & DUAL NOZZLES (x = ±1.60)
  // =========================================================================
  // Note: Boosters extend 5.05m above H = 15.60 up to y = 20.65 so their inward-slanted
  // nose cones reach right up to the white interstage & Atlas V logo on Stage 2!
  const bDist = R_ATLAS_CORE + R_ATLAS_SRB + 0.04; // 1.60
  const yBstSkirtBot = 0.36;
  const yBstSkirtTop = 2.04;
  const yBstCylTop = 17.85;
  const yBstTip = 20.65;

  for (const sgn of [-1, 1]) {
    const bx = sgn * bDist;

    // A. Stepped White Aft Booster Skirt (y = 0.36 -> 2.04, r = R_ATLAS_SRB + 0.035)
    const rAft = R_ATLAS_SRB + 0.035;
    const hAft = yBstSkirtTop - yBstSkirtBot;
    g.add(mesh(new THREE.CylinderGeometry(rAft, rAft + 0.015, hAft, 48), whiteMat, bx, yBstSkirtBot + hAft * 0.5, 0));
    g.add(mesh(new THREE.CylinderGeometry(rAft + 0.018, rAft + 0.018, 0.10, 48), softGreyMat, bx, yBstSkirtBot + 0.06, 0));

    // Bottom Deep Navy-Blue Horizontal Band at top of aft skirt (y = 1.78 -> 2.02)
    g.add(mesh(new THREE.CylinderGeometry(rAft + 0.008, rAft + 0.008, 0.24, 48), navyBandMat, bx, 1.90, 0));

    // Protruding vertical white avionics fairing pod & dark umbilical vents on front of aft skirt
    g.add(mesh(new THREE.BoxGeometry(0.16, hAft * 0.86, 0.14), whiteMat, bx - sgn * 0.06, yBstSkirtBot + hAft * 0.46, rAft));
    g.add(mesh(new THREE.BoxGeometry(0.11, 0.10, 0.05), darkMetalMat, bx - sgn * 0.24, 1.48, rAft - 0.02));
    g.add(mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), darkMetalMat, bx + sgn * 0.18, 1.48, rAft - 0.02));

    // B. Main Glossy White Cylindrical Booster Body (y = 2.04 -> 17.85, r = R_ATLAS_SRB = 0.62)
    const hCyl = yBstCylTop - yBstSkirtTop;
    g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_SRB, R_ATLAS_SRB, hCyl, 48), whiteMat, bx, yBstSkirtTop + hCyl * 0.5, 0));

    // Subtle grey segment rings along the white booster cylinder
    for (const ry of [5.2, 8.4, 11.6, 14.8]) {
      g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_SRB + 0.004, R_ATLAS_SRB + 0.004, 0.05, 48), softGreyMat, bx, ry, 0));
    }

    // Top Deep Navy-Blue Horizontal Band near top of cylinder (y = 17.42 -> 17.66) + white collar above
    g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_SRB + 0.008, R_ATLAS_SRB + 0.008, 0.24, 48), navyBandMat, bx, 17.54, 0));
    g.add(mesh(new THREE.CylinderGeometry(R_ATLAS_SRB + 0.005, R_ATLAS_SRB + 0.005, 0.06, 48), softGreyMat, bx, 17.82, 0));

    // Raised Vertical White Cable Spine running down the front face (+Z) of the booster
    g.add(mesh(new THREE.BoxGeometry(0.085, hCyl - 0.12, 0.065), whiteMat, bx - sgn * 0.05, yBstSkirtTop + hCyl * 0.5, R_ATLAS_SRB + 0.015));
    // Dark tie-down accent blocks where the vertical spine crosses the top and bottom navy bands
    g.add(mesh(new THREE.BoxGeometry(0.11, 0.26, 0.08), navyBandMat, bx - sgn * 0.05, 17.54, R_ATLAS_SRB + 0.018));
    g.add(mesh(new THREE.BoxGeometry(0.11, 0.26, 0.08), navyBandMat, bx - sgn * 0.05, 1.90, rAft + 0.018));

    // Heavy structural attachment struts linking booster to central CCB core
    g.add(mesh(new THREE.BoxGeometry(0.45, 0.20, 0.22), whiteMat, bx - sgn * 0.48, 17.45, 0));
    g.add(mesh(new THREE.BoxGeometry(0.45, 0.24, 0.26), darkMetalMat, bx - sgn * 0.48, 2.05, 0));

    // C. Inward-Slanted Conical White Nose Cone (y = 17.85 -> 20.65)
    // Slants inward toward the central white interstage so its tip nearly touches the Atlas V logo!
    const hNose = yBstTip - yBstCylTop;
    const cantX = -sgn * 0.50;
    const noseSlices = 20;
    for (let i = 0; i < noseSlices; i++) {
      const t0 = i / noseSlices;
      const t1 = (i + 1) / noseSlices;
      const r0 = R_ATLAS_SRB * Math.pow(1 - t0, 0.80);
      const r1 = R_ATLAS_SRB * Math.pow(1 - t1, 0.80);
      const x0 = bx + cantX * Math.pow(t0, 1.15);
      const x1 = bx + cantX * Math.pow(t1, 1.15);
      const sh = hNose / noseSlices;
      const sy = yBstCylTop + (t0 + t1) * 0.5 * hNose;
      const seg = mesh(new THREE.CylinderGeometry(Math.max(0.03, r1), r0, sh + 0.012, 40), whiteMat, (x0 + x1) * 0.5, sy, 0);
      seg.rotation.z = -Math.atan2(x1 - x0, sh);
      g.add(seg);
    }
    const tipSphere = mesh(new THREE.SphereGeometry(0.042, 14, 12), softGreyMat, bx + cantX, yBstTip, 0);
    g.add(tipSphere);

    // D. Twin Side-by-Side Engine Nozzles at the Base of Each Booster (2 nozzles per booster = 4 booster nozzles!)
    for (const nozSign of [-1, 1]) {
      const nx = bx + nozSign * 0.25;
      const nz = nozSign * 0.04;
      const mBell = bellMaterial(false);
      // Silver-grey upper nozzle collar emerging from the aft skirt
      g.add(mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.20, 28), nozzleSilverMat, nx, 0.34, nz));
      // Dark metallic engine bell below the collar
      g.add(mesh(bellGeometry(0.18, 0.28, 0.38, 28), mBell, nx, -0.06, nz));
      addNozzle(g, nx, nz, 0.34, [mBell]);
    }
  }

  return g;
}

// =========================================================================
// FALCON HEAVY (SPACEX — ARABSAT-6A EDITION: ROUNDED BULGED FAIRING,
// WHITE SECOND STAGE & INTERSTAGE WITH FH LOGO + US FLAG, TRIPLE WHITE
// CORES WITH HORIZONTAL CROSS-STRUT, 12 BLACK TITANIUM GRID FINS, DARK
// VERTICAL RACEWAYS, 12 FOLDED BLACK LANDING LEGS & 27 MERLIN 1D ENGINES)
// =========================================================================
let _fhMats = null;
function getFhMaterials() {
  if (_fhMats) return _fhMats;

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xf4f6f9,
    roughness: 0.30,
    metalness: 0.06,
  });

  const noseWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xe6eaef,
    roughness: 0.36,
    metalness: 0.08,
  });

  const softGreyMat = new THREE.MeshStandardMaterial({
    color: 0xd0d5dd,
    roughness: 0.42,
    metalness: 0.12,
  });

  // Matte-black carbon fiber for folded landing legs, vertical raceways & octaweb
  const carbonBlackMat = new THREE.MeshStandardMaterial({
    color: 0x1a191b,
    roughness: 0.55,
    metalness: 0.22,
  });

  // Dark titanium grey-black for grid fins & mounting brackets
  const gridFinBlackMat = new THREE.MeshStandardMaterial({
    color: 0x222428,
    roughness: 0.46,
    metalness: 0.48,
  });

  function makeCanvasMat(drawFn, w = 512, h = 512) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.30,
      metalness: 0.06,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  }

  // 1. Bulged Fairing Decal: Arabsat-6A Diamond Globe Emblem + Arabic & "ARABSAT" Typography
  const fairingDecalMat = makeCanvasMat((ctx, w, h) => {
    ctx.fillStyle = '#f4f6f9';
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.36;

    // A. Tilted Diamond / Globe Grid Emblem at top center
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = '#6c7a89';
    ctx.lineWidth = 4;
    ctx.strokeRect(-42, -42, 84, 84);
    ctx.fillStyle = 'rgba(130, 152, 175, 0.16)';
    ctx.fillRect(-38, -38, 76, 76);
    ctx.restore();

    // Inner orbital globe ring & "6A" inside the diamond
    ctx.strokeStyle = '#4a627a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 34, 18, -0.28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#2e4358';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('6A', cx, cy + 1);

    // B. Arabic Calligraphy & "ARABSAT" Text below the diamond
    ctx.fillStyle = '#3b4d5e';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('عرب سات', cx, cy + 78);

    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 25px Arial, sans-serif';
    ctx.fillText('ARABSAT', cx, cy + 108);

    // Subtle horizontal rule & mission subtext below ARABSAT
    ctx.fillStyle = '#7f8c9a';
    ctx.fillRect(cx - 72, cy + 125, 144, 2.5);
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('KINGDOM OF SAUDI ARABIA', cx, cy + 142);

    // Small dark vent/sensor dot below left of logo (matching photo!)
    ctx.fillStyle = '#22252a';
    ctx.beginPath();
    ctx.arc(cx - 88, cy + 172, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }, 512, 512);

  // 2. Stage 2 Lower Interstage Decal: Red/Blue Falcon Heavy "FH" Logo + US Flag
  const stage2DecalMat = makeCanvasMat((ctx, w, h) => {
    ctx.fillStyle = '#f4f6f9';
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;

    // A. Stylized Red/Blue Falcon Wing Swoosh at top of logo (y ~ 0.14..0.24)
    ctx.strokeStyle = '#c82333';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cx - 56, h * 0.22);
    ctx.quadraticCurveTo(cx - 8, h * 0.11, cx + 62, h * 0.18);
    ctx.stroke();

    ctx.strokeStyle = '#1d3c6a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 42, h * 0.25);
    ctx.quadraticCurveTo(cx + 5, h * 0.17, cx + 48, h * 0.22);
    ctx.stroke();

    // B. Bold "F H" Typography (y ~ 0.34)
    ctx.fillStyle = '#22262c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 42px "Arial Black", Impact, sans-serif';
    ctx.fillText('F H', cx, h * 0.35);

    // C. Small circular/bracket mission insignia between FH and US Flag (y ~ 0.49)
    ctx.strokeStyle = '#333840';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx - 26, h * 0.49, 12, 0.4, Math.PI * 1.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 26, h * 0.49, 12, -0.6, Math.PI * 0.6);
    ctx.stroke();
    ctx.fillStyle = '#333840';
    ctx.beginPath();
    ctx.arc(cx, h * 0.49, 5, 0, Math.PI * 2);
    ctx.fill();

    // D. Crisp US Flag directly below FH (y ~ 0.60..0.88)
    const fw = 156;
    const fh = 92;
    const fx = cx - fw * 0.5;
    const fy = h * 0.60;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(fx, fy, fw, fh);

    const sh = fh / 13;
    ctx.fillStyle = '#bf1e2e';
    for (let s = 0; s < 13; s += 2) {
      ctx.fillRect(fx, fy + s * sh, fw, sh + 0.4);
    }

    const cw = fw * 0.42;
    const ch = sh * 7;
    ctx.fillStyle = '#0c2340';
    ctx.fillRect(fx, fy, cw, ch);

    ctx.fillStyle = '#ffffff';
    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 5; col++) {
        const sx = fx + 8 + col * ((cw - 16) / 4);
        const sy = fy + 7 + r * ((ch - 14) / 3);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, 512, 512);

  _fhMats = {
    whiteMat,
    noseWhiteMat,
    softGreyMat,
    carbonBlackMat,
    gridFinBlackMat,
    fairingDecalMat,
    stage2DecalMat,
  };
  return _fhMats;
}

const R_FH_CORE = 0.86;
const R_FH_FAIRING = 1.24;

// Stage 3: SpaceX Falcon Heavy Bulged Rounded Fairing with Arabsat-6A Logo & Boat-Tail
function buildFhFairing() {
  const g = new THREE.Group();
  const H = PARTS.fhFairing.height; // 6.2
  const {
    whiteMat,
    softGreyMat,
    carbonBlackMat,
    fairingDecalMat,
  } = getFhMaterials();

  const yBoattailTop = 0.85;
  const yCylTop = 3.95;

  // 1. Inward-Tapering Conical Boat-Tail Base (y = 0.0 -> 0.85, r: 0.86 -> 1.24)
  g.add(mesh(new THREE.CylinderGeometry(R_FH_FAIRING, R_FH_CORE, yBoattailTop, 64), whiteMat, 0, yBoattailTop * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_FH_CORE + 0.008, R_FH_CORE + 0.008, 0.06, 64), softGreyMat, 0, 0.03, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_FH_FAIRING + 0.006, R_FH_FAIRING + 0.006, 0.05, 64), softGreyMat, 0, yBoattailTop, 0));

  // Small lateral separation push-rod fairings at lower corners of the boat-tail (matching photo!)
  for (const sgn of [-1, 1]) {
    const pod = mesh(new THREE.BoxGeometry(0.14, 0.42, 0.16), softGreyMat, sgn * (R_FH_FAIRING - 0.08), 0.62, 0.22);
    pod.rotation.z = sgn * 0.25;
    g.add(pod);
  }

  // 2. Wide Cylindrical Fairing Barrel (y = 0.85 -> 3.95, r = 1.24)
  const hCyl = yCylTop - yBoattailTop;
  g.add(mesh(new THREE.CylinderGeometry(R_FH_FAIRING, R_FH_FAIRING, hCyl, 64), whiteMat, 0, yBoattailTop + hCyl * 0.5, 0));

  // Vertical clamshell split seam & dark acoustic/latch notches along the left/right edges
  for (const sgn of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.03, hCyl + 0.8, 0.03), softGreyMat, sgn * (R_FH_FAIRING + 0.005), yBoattailTop + hCyl * 0.58, 0.18));
    for (const ly of [1.25, 2.05, 2.85, 3.65, 4.35]) {
      const lr = ly <= yCylTop ? R_FH_FAIRING : R_FH_FAIRING * 0.90;
      g.add(mesh(new THREE.BoxGeometry(0.05, 0.10, 0.06), carbonBlackMat, sgn * lr, ly, 0.20));
    }
  }

  // Conformal Arabsat-6A Decal on Front (+Z) and Back (-Z) of the Bulged Fairing
  const arcSpan = 1.38;
  for (const rotY of [0, Math.PI]) {
    const decGeo = new THREE.CylinderGeometry(
      R_FH_FAIRING + 0.011,
      R_FH_FAIRING + 0.011,
      hCyl * 0.92,
      40,
      1,
      true,
      -arcSpan * 0.5,
      arcSpan
    );
    const decMesh = mesh(decGeo, fairingDecalMat, 0, yBoattailTop + hCyl * 0.52, 0);
    decMesh.rotation.y = rotY;
    g.add(decMesh);
  }

  // 3. Blunt Rounded-Dome Ogive Nose Cap (y = 3.95 -> 6.20, r: 1.24 -> 0)
  // Uses a fuller dome curve so the crown is chubby and rounded exactly like SpaceX's fairing in the photo!
  const hDome = H - yCylTop;
  const domeSlices = 24;
  for (let i = 0; i < domeSlices; i++) {
    const t0 = i / domeSlices;
    const t1 = (i + 1) / domeSlices;
    const r0 = R_FH_FAIRING * Math.pow(1 - Math.pow(t0, 1.62), 0.54);
    const r1 = R_FH_FAIRING * Math.pow(1 - Math.pow(t1, 1.62), 0.54);
    const sh = hDome / domeSlices;
    const sy = yCylTop + (t0 + t1) * 0.5 * hDome;
    g.add(mesh(new THREE.CylinderGeometry(Math.max(0.04, r1), r0, sh + 0.008, 56), whiteMat, 0, sy, 0));
  }
  const crownCap = mesh(new THREE.SphereGeometry(0.18, 24, 16), whiteMat, 0, H - 0.12, 0);
  crownCap.scale.set(1.2, 0.65, 1.2);
  g.add(crownCap);

  // Recessed orbital thruster & parachutes
  const mBell = bellMaterial(true);
  g.add(mesh(new THREE.CylinderGeometry(R_FH_CORE * 0.88, R_FH_CORE * 0.88, 0.14, 36), carbonBlackMat, 0, 0.07, 0));
  g.add(mesh(bellGeometry(0.22, 0.34, 0.44, 24), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.34, [mBell]);
  addParachutes(g, H * 0.65);

  return g;
}

// Stage 2: Falcon Heavy White Second Stage & White Interstage with "FH" Logo + US Flag
function buildFhStage2() {
  const g = new THREE.Group();
  const H = PARTS.fhStage2.height; // 6.8
  const {
    whiteMat,
    softGreyMat,
    carbonBlackMat,
    stage2DecalMat,
  } = getFhMaterials();

  // 1. Slender Glossy White Stage 2 & Interstage Cylinder (y = 0.0 -> 6.80, r = R_FH_CORE = 0.86)
  g.add(mesh(new THREE.CylinderGeometry(R_FH_CORE, R_FH_CORE, H, 64), whiteMat, 0, H * 0.5, 0));

  // Subtle grey horizontal circumferential seam rings (interstage joint at y = 3.55, top & bottom collars)
  for (const ry of [0.05, 1.95, 3.55, 5.25, H - 0.04]) {
    g.add(mesh(new THREE.CylinderGeometry(R_FH_CORE + 0.005, R_FH_CORE + 0.005, 0.06, 64), softGreyMat, 0, ry, 0));
  }

  // Raised Vertical White Cable Raceway running down the front-left of Stage 2 (matching photo!)
  const rAng = -0.20;
  const rx = Math.sin(rAng) * (R_FH_CORE + 0.015);
  const rz = Math.cos(rAng) * (R_FH_CORE + 0.015);
  const raceway = mesh(new THREE.BoxGeometry(0.065, H - 2.05, 0.045), whiteMat, rx, 1.95 + (H - 2.05) * 0.5, rz);
  raceway.rotation.y = rAng;
  g.add(raceway);
  // Small dark sensor bracket on the Stage 2 raceway at y = 2.65
  const brk = mesh(new THREE.BoxGeometry(0.08, 0.16, 0.06), carbonBlackMat, rx, 2.65, rz);
  brk.rotation.y = rAng;
  g.add(brk);

  // 2. Conformal Decal near bottom of Stage 2 / Interstage (y = 0.12 -> 1.88):
  //    Red/Blue Falcon Swoosh + Bold "F H" + US Flag (positioned right above the horizontal cross-strut!)
  const hDecal = 1.78;
  const arcSpan = 1.24;
  for (const rotY of [0, Math.PI]) {
    const decGeo = new THREE.CylinderGeometry(
      R_FH_CORE + 0.011,
      R_FH_CORE + 0.011,
      hDecal,
      36,
      1,
      true,
      -arcSpan * 0.5,
      arcSpan
    );
    const decMesh = mesh(decGeo, stage2DecalMat, 0, 1.00, 0);
    decMesh.rotation.y = rotY;
    g.add(decMesh);
  }

  // 3. Recessed Merlin 1D Vacuum (MVac) Engine for Stage 2 flight
  const mBell = bellMaterial(true);
  g.add(mesh(new THREE.CylinderGeometry(R_FH_CORE * 0.88, R_FH_CORE * 0.88, 0.14, 36), carbonBlackMat, 0, 0.07, 0));
  g.add(mesh(bellGeometry(0.28, 0.42, 0.55, 28), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.42, [mBell]);
  addParachutes(g, H * 0.88);

  return g;
}

// Stage 1: Falcon Heavy Triple Booster Cores (Center Core + Left & Right Side Boosters with Rounded
// Nose Cones, Horizontal White Cross-Beam Strut, 12 Black Titanium Grid Fins, Dark Vertical Cable
// Raceways, 12 Folded Matte-Black Carbon-Fiber Landing Legs & 27 Merlin 1D Engines)
function buildFhStage1() {
  const g = new THREE.Group();
  const H = PARTS.fhStage1.height; // 16.8
  const {
    whiteMat,
    noseWhiteMat,
    softGreyMat,
    carbonBlackMat,
    gridFinBlackMat,
  } = getFhMaterials();

  const bDist = R_FH_CORE * 2 + 0.06; // 1.78 (tightly strapped 3-core layout)
  const yOctaBot = 0.38;
  const yLegTop = 3.70;

  // Helper to build one Falcon Heavy 1st-stage core at x = coreX
  function addFalconCore(coreX, isSideBooster, sideSign) {
    // 1. Main Glossy White Cylindrical Booster Tank (y = 0.42 -> 16.80, r = R_FH_CORE = 0.86)
    const hTank = H - yOctaBot;
    g.add(mesh(new THREE.CylinderGeometry(R_FH_CORE, R_FH_CORE, hTank, 56), whiteMat, coreX, yOctaBot + hTank * 0.5, 0));

    // Subtle horizontal weld rings along the white booster barrel
    for (const ry of [4.8, 8.2, 11.6, 14.8, H - 0.12]) {
      g.add(mesh(new THREE.CylinderGeometry(R_FH_CORE + 0.004, R_FH_CORE + 0.004, 0.05, 56), softGreyMat, coreX, ry, 0));
    }

    // 2. Side Booster Rounded-Ogive Nose Cone (extends 1.48m above H = 16.80 up to y = 18.28!)
    if (isSideBooster) {
      const hNose = 1.48;
      const noseSlices = 18;
      for (let i = 0; i < noseSlices; i++) {
        const t0 = i / noseSlices;
        const t1 = (i + 1) / noseSlices;
        const r0 = R_FH_CORE * Math.pow(1 - Math.pow(t0, 1.45), 0.58);
        const r1 = R_FH_CORE * Math.pow(1 - Math.pow(t1, 1.45), 0.58);
        const sh = hNose / noseSlices;
        const sy = H + (t0 + t1) * 0.5 * hNose;
        g.add(mesh(new THREE.CylinderGeometry(Math.max(0.04, r1), r0, sh + 0.008, 44), noseWhiteMat, coreX, sy, 0));
      }
      const domeTip = mesh(new THREE.SphereGeometry(0.14, 18, 12), noseWhiteMat, coreX, H + hNose - 0.08, 0);
      domeTip.scale.set(1.15, 0.65, 1.15);
      g.add(domeTip);
    }

    // 3. Stowed Black Titanium Grid Fins (4 per core = 12 grid fins total) near y = 15.85 -> 16.55
    const gridAngles = [0.38, -0.38, Math.PI - 0.38, Math.PI + 0.38];
    for (const ga of gridAngles) {
      const gx = coreX + Math.sin(ga) * (R_FH_CORE + 0.045);
      const gz = Math.cos(ga) * (R_FH_CORE + 0.045);
      // Mounting hinge block at top
      const hinge = mesh(new THREE.BoxGeometry(0.22, 0.24, 0.12), carbonBlackMat, gx, 16.48, gz);
      hinge.rotation.y = ga;
      g.add(hinge);
      // Folded waffle-textured Titanium Grid Fin paddle hanging below hinge
      const paddle = mesh(new THREE.BoxGeometry(0.34, 0.58, 0.07), gridFinBlackMat, gx, 16.06, gz);
      paddle.rotation.y = ga;
      g.add(paddle);
    }

    // 4. Dark-Grey / Matte-Black Vertical Cable Raceway Spine running down the front-left of each core
    //    Note: Right booster (sideSign > 0) has the thicker, prominent matte-black spine with bracket boxes!
    const raceAng = isSideBooster ? (sideSign > 0 ? -0.30 : -0.26) : -0.28;
    const raceW = (isSideBooster && sideSign > 0) ? 0.115 : 0.068;
    const raceD = (isSideBooster && sideSign > 0) ? 0.085 : 0.055;
    const rx = coreX + Math.sin(raceAng) * (R_FH_CORE + 0.018);
    const rz = Math.cos(raceAng) * (R_FH_CORE + 0.018);
    const hRace = 16.45 - (yLegTop - 0.35);
    const raceMesh = mesh(
      new THREE.BoxGeometry(raceW, hRace, raceD),
      carbonBlackMat,
      rx,
      (yLegTop - 0.35) + hRace * 0.5,
      rz
    );
    raceMesh.rotation.y = raceAng;
    g.add(raceMesh);

    // Extra black avionics fairing brackets on the prominent right-booster vertical raceway (matching photo!)
    if (isSideBooster && sideSign > 0) {
      const topBox = mesh(new THREE.BoxGeometry(0.24, 0.95, 0.11), carbonBlackMat, rx + 0.05, 15.85, rz);
      topBox.rotation.y = raceAng;
      g.add(topBox);
      const midBox = mesh(new THREE.BoxGeometry(0.22, 0.58, 0.10), carbonBlackMat, rx + 0.04, 5.75, rz);
      midBox.rotation.y = raceAng;
      g.add(midBox);
    }

    // 5. Four Tall Folded Matte-Black Carbon-Fiber Landing Legs per Core (y = 0.38 -> 3.70)
    //    Tapered upward with arched/pointed tips so white V-wedges of the tank peek between the black legs!
    const legAngles = [0.36, -0.36, Math.PI - 0.36, Math.PI + 0.36];
    const hLeg = yLegTop - yOctaBot; // 3.32
    const legSlices = 10;
    for (const la of legAngles) {
      for (let s = 0; s < legSlices; s++) {
        const t = (s + 0.5) / legSlices;
        // Wider at the bottom (0.64m), tapering smoothly to a pointed tip at the top (0.14m)
        const wSlice = 0.64 * (1 - 0.78 * Math.pow(t, 1.35));
        const dSlice = 0.14 * (1 - 0.45 * t);
        const sy = yOctaBot + t * hLeg;
        const rOut = R_FH_CORE + 0.035 * (1 - 0.4 * t);
        const lx = coreX + Math.sin(la) * rOut;
        const lz = Math.cos(la) * rOut;
        const seg = mesh(new THREE.BoxGeometry(wSlice, hLeg / legSlices + 0.02, dSlice), carbonBlackMat, lx, sy, lz);
        seg.rotation.y = la;
        g.add(seg);
      }
      // Rounded top fairing cap on each folded black landing leg
      const tipX = coreX + Math.sin(la) * (R_FH_CORE + 0.02);
      const tipZ = Math.cos(la) * (R_FH_CORE + 0.02);
      const legCap = mesh(new THREE.SphereGeometry(0.11, 12, 10), carbonBlackMat, tipX, yLegTop, tipZ);
      legCap.scale.set(1.0, 1.6, 0.65);
      legCap.rotation.y = la;
      g.add(legCap);
    }

    // 6. Dark Matte-Black Octaweb Base & 9 Merlin 1D Engine Nozzles (1 Center + 8 Outer Ring)
    g.add(mesh(new THREE.CylinderGeometry(R_FH_CORE + 0.02, R_FH_CORE - 0.04, 0.42, 48), carbonBlackMat, coreX, yOctaBot + 0.16, 0));

    // Central Merlin 1D Engine Bell
    const mCenterBell = bellMaterial(false);
    g.add(mesh(bellGeometry(0.16, 0.25, 0.40, 20), mCenterBell, coreX, -0.02, 0));
    addNozzle(g, coreX, 0, 0.36, [mCenterBell]);

    // 8 Outer Ring Merlin 1D Engine Bells arranged in the Octaweb circle
    const ringR = R_FH_CORE * 0.64;
    for (let e = 0; e < 8; e++) {
      const ea = (e / 8) * Math.PI * 2;
      const ex = coreX + Math.cos(ea) * ringR;
      const ez = Math.sin(ea) * ringR;
      const mOuterBell = bellMaterial(false);
      g.add(mesh(bellGeometry(0.14, 0.22, 0.38, 18), mOuterBell, ex, 0.0, ez));
      // Register 4 outer plume nozzles per core (plus center = 5 plume emitters per core, 15 total) for rich wide flame
      if (e % 2 === 0) {
        addNozzle(g, ex, ez, 0.30, [mOuterBell]);
      }
    }
  }

  // Build Center Core (x = 0) and Left/Right Side Boosters (x = ±1.78)
  addFalconCore(0, false, 0);
  addFalconCore(-bDist, true, -1);
  addFalconCore(bDist, true, 1);

  // =========================================================================
  // 7. PROMINENT WHITE HORIZONTAL CROSS-STRUT LINKAGE BEAM AT TOP OF STAGE 1
  //    (Spans across the front & back of all 3 cores right below the side booster
  //    nose cones & just below the US Flag on Stage 2 — exact match to photo!)
  // =========================================================================
  const yCross = H - 0.14; // 16.66
  for (const zSgn of [1, -1]) {
    const cz = zSgn * (R_FH_CORE + 0.065);
    // Main horizontal white cross-bar connecting Left Booster (-bDist), Center Core (0), and Right Booster (+bDist)
    g.add(mesh(new THREE.BoxGeometry(bDist * 2 + 0.18, 0.16, 0.14), whiteMat, 0, yCross, cz));

    // Diagonal white V-struts linking each side booster attachment node to the center core
    for (const xSgn of [-1, 1]) {
      const diag = mesh(new THREE.BoxGeometry(bDist * 0.92, 0.10, 0.10), softGreyMat, xSgn * (bDist * 0.5), yCross - 0.16, cz - zSgn * 0.02);
      diag.rotation.z = xSgn * 0.18;
      g.add(diag);
    }
  }

  // Lower heavy hold-down linkage struts between the 3 cores near y = 1.65
  for (const xSgn of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.42, 0.28, 0.32), carbonBlackMat, xSgn * (bDist * 0.5), 1.65, 0));
  }

  return g;
}

// =========================================================================
// FALCON 9 BLOCK 5 & CREW DRAGON (SPACEX — CREW DRAGON CAPSULE WITH
// SUPERDRACO NACELLES & HALF-BLACK / HALF-WHITE FINNED TRUNK, WHITE STAGE 2
// + MATTE-BLACK CARBON INTERSTAGE, WHITE STAGE 1 WITH RED FALCON 9 SWOOSH,
// US FLAG, VERTICAL BLUE "S P A C E X", BLACK LEGS WITH WHITE V-WEDGE &
// 9 SILVER-GREY MERLIN 1D ENGINE BELLS)
// =========================================================================
let _f9Mats = null;
function getF9Materials() {
  if (_f9Mats) return _f9Mats;

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xf6f7fa,
    roughness: 0.28,
    metalness: 0.06,
  });

  const softGreyMat = new THREE.MeshStandardMaterial({
    color: 0xd2d6de,
    roughness: 0.40,
    metalness: 0.12,
  });

  const carbonBlackMat = new THREE.MeshStandardMaterial({
    color: 0x111215,
    roughness: 0.52,
    metalness: 0.20,
  });

  const gridFinBlackMat = new THREE.MeshStandardMaterial({
    color: 0x1c1e22,
    roughness: 0.44,
    metalness: 0.48,
  });

  const merlinSilverMat = new THREE.MeshStandardMaterial({
    color: 0x9aa0aa,
    roughness: 0.34,
    metalness: 0.68,
  });

  function makeCanvasMat(drawFn, w = 512, h = 512) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.28,
      metalness: 0.06,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  }

  // 1. Crew Dragon Capsule Decal: US Flag on upper-right + dark vertical seam lines & thruster vents
  const dragonDecalMat = makeCanvasMat((ctx, w, h) => {
    ctx.fillStyle = '#f6f7fa';
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;

    // Fine vertical dark grey panel seam lines on the capsule cone
    ctx.strokeStyle = '#3a3e47';
    ctx.lineWidth = 3.5;
    for (const dx of [-130, 0, 130]) {
      ctx.beginPath();
      ctx.moveTo(cx + dx * 0.72, h * 0.12);
      ctx.lineTo(cx + dx, h * 0.92);
      ctx.stroke();
    }

    // Small US Flag on upper-right panel (matching reference photo!)
    const fw = 54;
    const fh = 32;
    const fx = cx + 38;
    const fy = h * 0.40;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(fx, fy, fw, fh);
    ctx.fillStyle = '#c81d25';
    const sh = fh / 13;
    for (let s = 0; s < 13; s += 2) {
      ctx.fillRect(fx, fy + s * sh, fw, sh + 0.3);
    }
    ctx.fillStyle = '#0c2340';
    ctx.fillRect(fx, fy, fw * 0.42, sh * 7);

    // Small dark RCS thruster ports near the base of the capsule
    ctx.fillStyle = '#1b1d22';
    for (const [px, py] of [[-76, 0.72], [-58, 0.75], [58, 0.75], [76, 0.72]]) {
      ctx.beginPath();
      ctx.ellipse(cx + px, h * py, 7, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 512, 384);

  // 2. Stage 1 Main Body Decal: Red Falcon Swoosh + "FALCON 9" + US Flag + Vertical Blue "S P A C E X"
  const f9BodyDecalMat = makeCanvasMat((ctx, w, h) => {
    ctx.fillStyle = '#f6f7fa';
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;

    // A. Red Falcon Wing Swoosh near the top (y ~ 0.05..0.09)
    ctx.fillStyle = '#d9232e';
    ctx.beginPath();
    ctx.moveTo(cx - 56, h * 0.052);
    ctx.quadraticCurveTo(cx - 8, h * 0.072, cx + 52, h * 0.082);
    ctx.quadraticCurveTo(cx + 8, h * 0.064, cx - 22, h * 0.078);
    ctx.quadraticCurveTo(cx - 32, h * 0.064, cx - 56, h * 0.052);
    ctx.fill();

    // Small red secondary wing tip
    ctx.beginPath();
    ctx.moveTo(cx - 12, h * 0.060);
    ctx.quadraticCurveTo(cx + 18, h * 0.066, cx + 44, h * 0.076);
    ctx.quadraticCurveTo(cx + 12, h * 0.072, cx - 12, h * 0.060);
    ctx.fill();

    // B. Spaced "F A L C O N" and bold "9" below the red swoosh (y ~ 0.095..0.125)
    ctx.fillStyle = '#4a4f58';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText('F  A  L  C  O  N', cx, h * 0.096);

    ctx.fillStyle = '#252930';
    ctx.font = 'bold 28px "Arial Black", Arial, sans-serif';
    ctx.fillText('9', cx, h * 0.118);

    // C. Crisp United States Flag below "FALCON 9" (y ~ 0.175..0.225)
    const fw = 128;
    const fh = 72;
    const fx = cx - fw * 0.5;
    const fy = h * 0.175;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(fx, fy, fw, fh);

    const sh = fh / 13;
    ctx.fillStyle = '#cc2229';
    for (let s = 0; s < 13; s += 2) {
      ctx.fillRect(fx, fy + s * sh, fw, sh + 0.3);
    }

    const cw = fw * 0.42;
    const ch = sh * 7;
    ctx.fillStyle = '#0c2340';
    ctx.fillRect(fx, fy, cw, ch);

    ctx.fillStyle = '#ffffff';
    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 5; col++) {
        const sx = fx + 7 + col * ((cw - 14) / 4);
        const sy = fy + 6 + r * ((ch - 12) / 3);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // D. Iconic Vertical Navy-Blue "S P A C E X" Lettering (y ~ 0.44..0.88)
    const sxColor = '#183661';
    ctx.fillStyle = sxColor;
    ctx.strokeStyle = sxColor;

    // 1. "S" (y = 0.45) — wide geometric SpaceX 'S'
    const sY = h * 0.455;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(cx + 32, sY - 20);
    ctx.lineTo(cx - 24, sY - 20);
    ctx.lineTo(cx - 30, sY - 2);
    ctx.lineTo(cx + 26, sY - 2);
    ctx.lineTo(cx + 30, sY + 20);
    ctx.lineTo(cx - 32, sY + 20);
    ctx.stroke();

    // 2. "P" (y = 0.535) — geometric SpaceX 'P'
    const pY = h * 0.538;
    ctx.beginPath();
    ctx.moveTo(cx - 28, pY + 24);
    ctx.lineTo(cx - 28, pY - 20);
    ctx.lineTo(cx + 24, pY - 20);
    ctx.lineTo(cx + 30, pY - 2);
    ctx.lineTo(cx - 16, pY - 2);
    ctx.stroke();

    // 3. "A" (y = 0.62) — futuristic chevron SpaceX 'A' with crossbar
    const aY = h * 0.622;
    ctx.beginPath();
    ctx.moveTo(cx - 34, aY + 22);
    ctx.lineTo(cx, aY - 22);
    ctx.lineTo(cx + 34, aY + 22);
    ctx.stroke();
    ctx.fillRect(cx - 16, aY + 4, 32, 9);

    // 4. "C" (y = 0.705) — wide geometric SpaceX 'C'
    const cY = h * 0.706;
    ctx.beginPath();
    ctx.moveTo(cx + 32, cY - 18);
    ctx.lineTo(cx - 26, cY - 18);
    ctx.lineTo(cx - 30, cY + 18);
    ctx.lineTo(cx + 32, cY + 18);
    ctx.stroke();

    // 5. "E" (y = 0.79) — detached 3-bar SpaceX 'E'
    const eY = h * 0.790;
    ctx.fillRect(cx - 32, eY - 22, 64, 9);
    ctx.fillRect(cx - 32, eY - 4, 50, 9);
    ctx.fillRect(cx - 32, eY + 14, 64, 9);
    ctx.fillRect(cx - 32, eY - 22, 11, 45);

    // 6. "X" with Sweeping SpaceX Orbital Swoosh (y = 0.875)
    const xY = h * 0.875;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(cx - 32, xY - 18);
    ctx.lineTo(cx + 30, xY + 22);
    ctx.stroke();

    // Long sweeping SpaceX swoosh from bottom-left of X sweeping far up-right!
    ctx.beginPath();
    ctx.moveTo(cx - 36, xY + 24);
    ctx.quadraticCurveTo(cx + 6, xY - 8, cx + 102, xY - 40);
    ctx.lineTo(cx + 102, xY - 33);
    ctx.quadraticCurveTo(cx + 14, xY + 2, cx - 24, xY + 24);
    ctx.closePath();
    ctx.fill();
  }, 512, 1536);

  _f9Mats = {
    whiteMat,
    softGreyMat,
    carbonBlackMat,
    gridFinBlackMat,
    merlinSilverMat,
    dragonDecalMat,
    f9BodyDecalMat,
  };
  return _f9Mats;
}

const R_F9_CORE = 0.88;
const R_F9_DRAGON = 0.94;

// Stage 3: SpaceX Crew Dragon Capsule with 4 SuperDraco Nacelles & Half-Black / Half-White Finned Trunk
function buildF9Dragon() {
  const g = new THREE.Group();
  const H = PARTS.f9Dragon.height; // 5.8
  const {
    whiteMat,
    softGreyMat,
    carbonBlackMat,
    dragonDecalMat,
  } = getF9Materials();

  const yTrunkTop = 2.75;
  const yCollarTop = 2.96;

  // =========================================================================
  // 1. CREW DRAGON TRUNK (y = 0.0 -> 2.75):
  //    Left Half (-X) is Matte Carbon-Black; Right Half (+X) is Glossy White with Vertical Ribs!
  // =========================================================================
  // Right Half (+X, theta = 0 -> Math.PI): Glossy White Trunk Half
  g.add(mesh(
    new THREE.CylinderGeometry(R_F9_DRAGON, R_F9_CORE + 0.04, yTrunkTop, 36, 1, false, 0, Math.PI),
    whiteMat,
    0,
    yTrunkTop * 0.5,
    0
  ));
  // Left Half (-X, theta = Math.PI -> Math.PI * 2): Matte Carbon-Black Trunk Half
  g.add(mesh(
    new THREE.CylinderGeometry(R_F9_DRAGON + 0.003, R_F9_CORE + 0.043, yTrunkTop, 36, 1, false, Math.PI, Math.PI),
    carbonBlackMat,
    0,
    yTrunkTop * 0.5,
    0
  ));

  // Fine vertical radiator ribs along the white right half of the trunk (+X)
  for (let i = 1; i < 16; i++) {
    const a = (i / 16) * Math.PI;
    const rMid = (R_F9_DRAGON + R_F9_CORE + 0.04) * 0.5 + 0.008;
    const rib = mesh(
      new THREE.BoxGeometry(0.024, yTrunkTop - 0.18, 0.024),
      i % 2 === 0 ? softGreyMat : whiteMat,
      Math.sin(a) * rMid,
      yTrunkTop * 0.5 + 0.04,
      Math.cos(a) * rMid
    );
    rib.rotation.y = a;
    g.add(rib);
  }

  // White/Grey bottom adapter ring at base of Trunk (y = 0.0 -> 0.14) with dark umbilical notches
  g.add(mesh(new THREE.CylinderGeometry(R_F9_CORE + 0.05, R_F9_CORE + 0.04, 0.14, 56), softGreyMat, 0, 0.07, 0));

  // 4 Aerodynamic Trunk Stabilization Fins (Left fins are Matte-Black, Right fins are Glossy White!)
  const finConfigs = [
    { ang: -Math.PI * 0.5, mat: carbonBlackMat }, // Left silhouette fin (Black)
    { ang: Math.PI * 0.5, mat: whiteMat },        // Right silhouette fin (White)
    { ang: -Math.PI * 0.18, mat: carbonBlackMat },
    { ang: Math.PI * 0.18, mat: whiteMat },
  ];
  const hFin = 2.15;
  const finSlices = 10;
  for (const fc of finConfigs) {
    for (let s = 0; s < finSlices; s++) {
      const t = (s + 0.5) / finSlices;
      // Trapezoidal fin profile: wide at bottom, angled taper at top (t > 0.65)
      const reach = t < 0.68 ? 0.34 : 0.34 * (1 - (t - 0.68) / 0.32);
      const rCenter = R_F9_CORE + 0.04 + reach * 0.5;
      const fx = Math.sin(fc.ang) * rCenter;
      const fz = Math.cos(fc.ang) * rCenter;
      const fy = 0.14 + t * hFin;
      const finSeg = mesh(
        new THREE.BoxGeometry(0.05, hFin / finSlices + 0.02, Math.max(0.04, reach)),
        fc.mat,
        fx,
        fy,
        fz
      );
      finSeg.rotation.y = fc.ang;
      g.add(finSeg);
    }
  }

  // =========================================================================
  // 2. MATTE-BLACK HEAT-SHIELD COLLAR RING (y = 2.75 -> 2.96)
  // =========================================================================
  g.add(mesh(
    new THREE.CylinderGeometry(R_F9_DRAGON + 0.01, R_F9_DRAGON + 0.01, yCollarTop - yTrunkTop, 56),
    carbonBlackMat,
    0,
    (yTrunkTop + yCollarTop) * 0.5,
    0
  ));

  // =========================================================================
  // 3. CREW DRAGON CAPSULE CONE & ROUNDED NOSE CAP (y = 2.96 -> 5.80)
  // =========================================================================
  const hCap = H - yCollarTop; // 2.84
  const capSlices = 22;
  for (let i = 0; i < capSlices; i++) {
    const t0 = i / capSlices;
    const t1 = (i + 1) / capSlices;
    const r0 = R_F9_DRAGON * Math.pow(1 - Math.pow(t0, 1.32), 0.66);
    const r1 = R_F9_DRAGON * Math.pow(1 - Math.pow(t1, 1.32), 0.66);
    const sh = hCap / capSlices;
    const sy = yCollarTop + (t0 + t1) * 0.5 * hCap;
    g.add(mesh(new THREE.CylinderGeometry(Math.max(0.04, r1), r0, sh + 0.008, 56), whiteMat, 0, sy, 0));
  }
  const noseDome = mesh(new THREE.SphereGeometry(0.18, 20, 14), whiteMat, 0, H - 0.10, 0);
  noseDome.scale.set(1.15, 0.72, 1.15);
  g.add(noseDome);
  // Subtle nose-cone hinge ring seam at y = 4.65
  g.add(mesh(new THREE.CylinderGeometry(0.58, 0.59, 0.03, 48), softGreyMat, 0, 4.65, 0));

  // Conformal Decal on Front (+Z) of Crew Dragon Capsule: US Flag, Panel Seams & RCS Ports
  const decGeo = new THREE.CylinderGeometry(
    R_F9_DRAGON * 0.62,
    R_F9_DRAGON + 0.012,
    hCap * 0.58,
    36,
    1,
    true,
    -0.75,
    1.50
  );
  g.add(mesh(decGeo, dragonDecalMat, 0, yCollarTop + hCap * 0.29, 0));

  // 4 Sculpted SuperDraco Launch Abort Nacelle Pods around the Crew Dragon Capsule
  for (const na of [-0.62, 0.62, Math.PI - 0.62, Math.PI + 0.62]) {
    const nr = R_F9_DRAGON - 0.04;
    const nx = Math.sin(na) * nr;
    const nz = Math.cos(na) * nr;
    const nac = mesh(new THREE.CylinderGeometry(0.06, 0.16, 1.25, 16), whiteMat, nx, yCollarTop + 0.66, nz);
    nac.rotation.y = na;
    nac.rotation.x = 0.22;
    g.add(nac);
    // Dark angled SuperDraco twin thruster openings at the bottom of each nacelle
    const port = mesh(new THREE.BoxGeometry(0.18, 0.12, 0.12), carbonBlackMat, nx * 1.03, yCollarTop + 0.14, nz * 1.03);
    port.rotation.y = na;
    g.add(port);
  }

  // Recessed orbital thruster & built-in parachutes
  const mBell = bellMaterial(true);
  g.add(mesh(new THREE.CylinderGeometry(R_F9_CORE * 0.88, R_F9_CORE * 0.88, 0.14, 36), carbonBlackMat, 0, 0.07, 0));
  g.add(mesh(bellGeometry(0.22, 0.34, 0.44, 24), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.34, [mBell]);
  addParachutes(g, H * 0.62);

  return g;
}

// Stage 2: Falcon 9 Block 5 White Second Stage Tank & Matte-Black Carbon-Fiber Interstage
function buildF9Stage2() {
  const g = new THREE.Group();
  const H = PARTS.f9Stage2.height; // 8.2
  const {
    whiteMat,
    softGreyMat,
    carbonBlackMat,
  } = getF9Materials();

  const yBlackInterTop = 3.65; // 0.0 -> 3.65 is Matte-Black Interstage; 3.65 -> 8.20 is White Stage 2 Tank

  // 1. Matte-Black Carbon-Fiber Interstage Cylinder (y = 0.0 -> 3.65, r = R_F9_CORE = 0.88)
  g.add(mesh(new THREE.CylinderGeometry(R_F9_CORE + 0.004, R_F9_CORE + 0.004, yBlackInterTop, 64), carbonBlackMat, 0, yBlackInterTop * 0.5, 0));

  // Subtle dark-grey circumferential rings on the black interstage
  for (const ry of [0.06, 1.82, yBlackInterTop - 0.04]) {
    g.add(mesh(new THREE.CylinderGeometry(R_F9_CORE + 0.010, R_F9_CORE + 0.010, 0.06, 64), carbonBlackMat, 0, ry, 0));
  }

  // Protruding black vertical raceway fairing along the right side (+X) of the black interstage
  g.add(mesh(new THREE.BoxGeometry(0.08, yBlackInterTop, 0.12), carbonBlackMat, R_F9_CORE + 0.02, yBlackInterTop * 0.5, 0));

  // 2. Glossy White Second Stage Fuel Tank (y = 3.65 -> 8.20, r = R_F9_CORE = 0.88)
  const hWhite = H - yBlackInterTop;
  g.add(mesh(new THREE.CylinderGeometry(R_F9_CORE, R_F9_CORE, hWhite, 64), whiteMat, 0, yBlackInterTop + hWhite * 0.5, 0));

  // Subtle grey weld rings on the white Stage 2 tank
  for (const ry of [yBlackInterTop + 0.05, 5.85, H - 0.05]) {
    g.add(mesh(new THREE.CylinderGeometry(R_F9_CORE + 0.005, R_F9_CORE + 0.005, 0.06, 64), softGreyMat, 0, ry, 0));
  }

  // White separation pusher brackets around the black-to-white interstage seam (y = 3.65)
  for (const a of [-0.65, 0.65, Math.PI - 0.65, Math.PI + 0.65]) {
    const bx = Math.sin(a) * (R_F9_CORE + 0.018);
    const bz = Math.cos(a) * (R_F9_CORE + 0.018);
    const brk = mesh(new THREE.BoxGeometry(0.09, 0.24, 0.06), whiteMat, bx, yBlackInterTop + 0.08, bz);
    brk.rotation.y = a;
    g.add(brk);
  }

  // Protruding white cable/COPV raceway fairing along the right edge (+X) of the white Stage 2 tank
  g.add(mesh(new THREE.BoxGeometry(0.07, 2.65, 0.11), whiteMat, R_F9_CORE + 0.015, yBlackInterTop + 1.45, 0));
  g.add(mesh(new THREE.BoxGeometry(0.05, 0.85, 0.08), softGreyMat, -R_F9_CORE - 0.01, yBlackInterTop + 2.55, 0));

  // 3. Recessed Merlin 1D Vacuum (MVac) Engine for Stage 2 flight
  const mBell = bellMaterial(true);
  g.add(mesh(new THREE.CylinderGeometry(R_F9_CORE * 0.88, R_F9_CORE * 0.88, 0.14, 36), carbonBlackMat, 0, 0.07, 0));
  g.add(mesh(bellGeometry(0.28, 0.42, 0.55, 28), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.42, [mBell]);
  addParachutes(g, H * 0.88);

  return g;
}

// Stage 1: Falcon 9 Block 5 First Stage (Red Falcon Swoosh + "FALCON 9" + US Flag + Vertical
// Blue "S P A C E X", 4 Black Titanium Grid Fins, 4 Folded Matte-Black Landing Legs with Sharp
// White Center V-Wedge, Black Octaweb & 9 Metallic Silver-Grey Merlin 1D Engine Bells)
function buildF9Stage1() {
  const g = new THREE.Group();
  const H = PARTS.f9Stage1.height; // 17.6
  const {
    whiteMat,
    softGreyMat,
    carbonBlackMat,
    gridFinBlackMat,
    merlinSilverMat,
    f9BodyDecalMat,
  } = getF9Materials();

  const yNozTop = 0.42;
  const yOctaTop = 1.05;
  const yLegTop = 4.45;
  const yTopBlackBand = 17.32;

  // 1. Main Glossy White First Stage Cylinder (y = 1.00 -> 17.32, r = R_F9_CORE = 0.88)
  const hWhite = yTopBlackBand - 1.00;
  g.add(mesh(new THREE.CylinderGeometry(R_F9_CORE, R_F9_CORE, hWhite, 64), whiteMat, 0, 1.00 + hWhite * 0.5, 0));

  // Top Matte-Black Collar Band (y = 17.32 -> 17.60) & 4 Stowed Black Titanium Grid Fins
  g.add(mesh(new THREE.CylinderGeometry(R_F9_CORE + 0.005, R_F9_CORE + 0.005, H - yTopBlackBand, 64), carbonBlackMat, 0, (yTopBlackBand + H) * 0.5, 0));

  const gridAngles = [0.45, -0.45, Math.PI - 0.45, Math.PI + 0.45];
  for (const ga of gridAngles) {
    const gx = Math.sin(ga) * (R_F9_CORE + 0.048);
    const gz = Math.cos(ga) * (R_F9_CORE + 0.048);
    const hinge = mesh(new THREE.BoxGeometry(0.22, 0.24, 0.12), carbonBlackMat, gx, 17.42, gz);
    hinge.rotation.y = ga;
    g.add(hinge);
    const paddle = mesh(new THREE.BoxGeometry(0.36, 0.62, 0.075), gridFinBlackMat, gx, 16.96, gz);
    paddle.rotation.y = ga;
    g.add(paddle);
  }

  // 2. Full-Height Conformal Front (+Z) and Back (-Z) Decal (y = 4.55 -> 16.95):
  //    Red Falcon Wing Swoosh + "FALCON 9" + US Flag + Vertical Navy-Blue "S P A C E X"
  const yDecBot = 4.55;
  const yDecTop = 16.95;
  const hDec = yDecTop - yDecBot;
  const arcSpan = 1.24;
  for (const rotY of [0, Math.PI]) {
    const decGeo = new THREE.CylinderGeometry(
      R_F9_CORE + 0.011,
      R_F9_CORE + 0.011,
      hDec,
      40,
      1,
      true,
      -arcSpan * 0.5,
      arcSpan
    );
    const decMesh = mesh(decGeo, f9BodyDecalMat, 0, yDecBot + hDec * 0.5, 0);
    decMesh.rotation.y = rotY;
    g.add(decMesh);
  }

  // 3. Matte-Black Vertical Raceway Conduit along the Right Silhouette Edge (+X)
  const hRace = yTopBlackBand - yLegTop + 0.6;
  g.add(mesh(new THREE.BoxGeometry(0.08, hRace, 0.14), carbonBlackMat, R_F9_CORE + 0.02, yLegTop - 0.3 + hRace * 0.5, 0));
  // Small black aerodynamic raceway bumps at y = 16.2 and y = 5.1 (matching reference photo!)
  g.add(mesh(new THREE.BoxGeometry(0.13, 0.55, 0.18), carbonBlackMat, R_F9_CORE + 0.035, 16.2, 0));
  g.add(mesh(new THREE.BoxGeometry(0.12, 0.48, 0.16), carbonBlackMat, R_F9_CORE + 0.03, 5.1, 0));

  // 4. Four Tall Folded Matte-Black Carbon-Fiber Landing Legs (y = 0.95 -> 4.45)
  //    Positioned at ±0.46 rad so a sharp bright-white V-shaped wedge of the tank extends all the way
  //    down the front center between the two front black legs to y = 1.05 (exact match to photo!)
  const legAngles = [0.46, -0.46, Math.PI - 0.46, Math.PI + 0.46];
  const hLeg = yLegTop - 0.95; // 3.50
  const legSlices = 14;
  for (const la of legAngles) {
    for (let s = 0; s < legSlices; s++) {
      const t = (s + 0.5) / legSlices;
      // Wide at base (0.76m) so outer edges wrap the cylinder, tapering upward (0.16m) to create the sharp white center V-wedge!
      const wSlice = 0.76 * (1 - 0.79 * Math.pow(t, 1.12));
      const dSlice = 0.15 * (1 - 0.42 * t);
      const sy = 0.95 + t * hLeg;
      const rOut = R_F9_CORE + 0.032 * (1 - 0.35 * t);
      const lx = Math.sin(la) * rOut;
      const lz = Math.cos(la) * rOut;
      const seg = mesh(new THREE.BoxGeometry(wSlice, hLeg / legSlices + 0.02, dSlice), carbonBlackMat, lx, sy, lz);
      seg.rotation.y = la;
      g.add(seg);
    }
    // Sculpted silver-grey latch tip at the top of each folded black landing leg (y = 4.45)
    const tipX = Math.sin(la) * (R_F9_CORE + 0.025);
    const tipZ = Math.cos(la) * (R_F9_CORE + 0.025);
    const latch = mesh(new THREE.BoxGeometry(0.14, 0.22, 0.09), softGreyMat, tipX, yLegTop - 0.06, tipZ);
    latch.rotation.y = la;
    g.add(latch);
  }

  // 5. Matte-Black Octaweb Base Skirt (y = 0.42 -> 1.05) with stepped bottom flange
  g.add(mesh(new THREE.CylinderGeometry(R_F9_CORE + 0.035, R_F9_CORE + 0.045, yOctaTop - yNozTop, 56), carbonBlackMat, 0, (yNozTop + yOctaTop) * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_F9_CORE + 0.065, R_F9_CORE + 0.055, 0.14, 56), carbonBlackMat, 0, yNozTop + 0.07, 0));

  // 6. Nine Metallic Silver-Grey Merlin 1D Engine Bells Protruding at the Base (y = 0.0 -> 0.42)
  const mCenterBell = bellMaterial(false);
  g.add(mesh(bellGeometry(0.16, 0.25, yNozTop, 24), merlinSilverMat, 0, 0, 0));
  addNozzle(g, 0, 0, 0.36, [mCenterBell]);

  const ringR = R_F9_CORE * 0.64;
  for (let e = 0; e < 8; e++) {
    const ea = (e / 8) * Math.PI * 2;
    const ex = Math.cos(ea) * ringR;
    const ez = Math.sin(ea) * ringR;
    const mOuterBell = bellMaterial(false);
    g.add(mesh(bellGeometry(0.14, 0.21, yNozTop, 20), merlinSilverMat, ex, 0, ez));
    if (e % 2 === 0) {
      addNozzle(g, ex, ez, 0.30, [mOuterBell]);
    }
  }

  return g;
}

// =========================================================================
// NASA SPACE SHUTTLE DISCOVERY (STS) — EXTERNAL TANK, ORBITER & TWIN SRBs
// Authentic replica matching reference image:
// - Stage 3 (shuttleNose): Burnt-Orange External Tank (ET) Ogive Nose Cone with
//   lightning rod tip, dark vertical cable tray / pressurization line, and
//   Golden-Tan Ribbed Intertank Collar with rectangular access door.
// - Stage 2 (shuttleOrbiter): Burnt-Orange External Tank (ET) Middle Barrel +
//   Piggyback Space Shuttle Orbiter "Discovery" with Matte-Black RCC Nose Cap,
//   3 circular nose RCS ports + white rectangular 4-port RCS block, 6-pane V-shaped
//   black cockpit windshield + 2 square overhead windows, "Discovery" cockpit side
//   title, row of black rectangular side vents, vertical "United States" + US Flag +
//   NASA Meatball fuselage decals, Double-Delta Wings with black RCC leading edges,
//   black corrugated elevon hinge band, NASA Meatball on left wing, US Flag +
//   "Discovery" on right wing, Swept Vertical Tail Fin, Cream-White OMS Pods with
//   black forward RCS patches, and 3 angled dark RS-25 (SSME) Main Engine Nozzles.
// - Stage 1 (shuttleSrb): Lower Burnt-Orange External Tank (ET) with rounded
//   ellipsoidal aft dome + Twin White Solid Rocket Boosters (SRBs) extending up
//   alongside Stage 2 with pointed white ogive nose cones (black collar band +
//   orange range-safety patch), black circumferential field-joint bands, flared
//   aft skirts with 3 golden-yellow stiffener rings, and wide grey SRB nozzles.
// =========================================================================
const R_STS_ET = 1.92;   // External Tank radius
const R_STS_SRB = 0.82;  // Solid Rocket Booster radius
const X_STS_SRB = 2.74;  // Left/Right SRB X offset
const Z_STS_SRB = -0.04; // Slight Z offset for SRBs

let _shuttleMats = null;
function getShuttleMaterials() {
  if (_shuttleMats) return _shuttleMats;
  const panel = TX.panelTextures();
  const foam = TX.foamTextures();

  // Burnt-orange SOFI insulating foam for the External Tank (ET) nose & main barrel
  const etOrangeMat = physical({
    color: 0xb85e19,
    roughness: 0.78,
    metalness: 0.04,
    normalMap: foam.normal,
    normalScale: new THREE.Vector2(0.45, 0.45),
  });

  // Darker burnt-orange/brown for ET structural rings & cable tray brackets
  const etDarkOrangeMat = physical({
    color: 0x8f430e,
    roughness: 0.82,
    metalness: 0.08,
  });

  // Golden-tan foam for the ribbed Intertank collar & SRB aft skirt stiffener rings
  const etIntertankGoldMat = physical({
    color: 0xb7883a,
    roughness: 0.72,
    metalness: 0.10,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.35, 0.35),
  });

  // Brighter golden-yellow for the 3 horizontal stiffener rings on the SRB aft skirts
  const srbYellowRingMat = physical({
    color: 0xc59a2d,
    roughness: 0.55,
    metalness: 0.22,
  });

  // Clean cool-white thermal blanket / tile material for the Orbiter fuselage & wings
  const orbiterWhiteMat = physical({
    color: 0xdedfe4,
    roughness: 0.52,
    metalness: 0.04,
    clearcoat: 0.18,
    clearcoatRoughness: 0.38,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.28, 0.28),
  });

  // Slightly warmer cream-white / off-white for the rear OMS pods (matching reference photo!)
  const omsCreamMat = physical({
    color: 0xd8d2ca,
    roughness: 0.58,
    metalness: 0.04,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.32, 0.32),
  });

  // Crisp bright white for the Twin Solid Rocket Boosters (SRBs)
  const srbWhiteMat = physical({
    color: 0xd8dce2,
    roughness: 0.46,
    metalness: 0.06,
    clearcoat: 0.24,
    clearcoatRoughness: 0.32,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.25, 0.25),
  });

  // Matte-black Reinforced Carbon-Carbon (RCC) & HRSI thermal tiles for nose cap, leading edges & belly
  const blackTileMat = physical({
    color: 0x181a1f,
    roughness: 0.72,
    metalness: 0.12,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.35, 0.35),
  });

  // Deep glossy black for the 6-pane V-shaped cockpit windshield & 2 overhead windows
  const windshieldMat = physical({
    color: 0x0b0d12,
    roughness: 0.12,
    metalness: 0.38,
    clearcoat: 0.95,
    clearcoatRoughness: 0.05,
  });

  // Dark gunmetal-black for the 3 RS-25 (SSME) main engine bells & field-joint rings
  const ssmeDarkMat = physical({
    color: 0x1c1f25,
    roughness: 0.44,
    metalness: 0.68,
  });

  // Metallic silver-grey for SSME nozzle cooling manifolds & lightning rod tip
  const silverMetalMat = physical({
    color: 0xa6acb6,
    roughness: 0.28,
    metalness: 0.84,
  });

  // Light grey for the wide flared SRB nozzles & Orbiter side hatch panel
  const srbNozzleGreyMat = physical({
    color: 0x9ca2ac,
    roughness: 0.52,
    metalness: 0.32,
  });

  // Helper to draw the classic blue NASA Meatball insignia onto a 2D canvas context
  function drawNasaMeatball(ctx, cx, cy, r) {
    ctx.save();
    // Deep NASA Blue circle
    ctx.fillStyle = '#0b3d91';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // White stars scattered in background
    ctx.fillStyle = '#ffffff';
    const stars = [
      [-0.45, -0.52, 0.045], [-0.22, -0.62, 0.035], [0.35, -0.55, 0.04],
      [-0.58, 0.28, 0.035], [0.48, 0.42, 0.045], [0.18, 0.60, 0.035],
    ];
    for (const [sx, sy, sr] of stars) {
      ctx.beginPath();
      ctx.arc(cx + sx * r, cy + sy * r, sr * r, 0, Math.PI * 2);
      ctx.fill();
    }

    // White elliptical orbit ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, r * 0.055);
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.86, r * 0.34, -0.42, 0, Math.PI * 2);
    ctx.stroke();

    // Red aerodynamic chevron vector V-wing
    ctx.strokeStyle = '#fc3d21';
    ctx.lineWidth = Math.max(2.5, r * 0.13);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.72, cy + r * 0.38);
    ctx.lineTo(cx + r * 0.12, cy - r * 0.56);
    ctx.lineTo(cx + r * 0.78, cy + r * 0.18);
    ctx.stroke();

    // Bold white "NASA" lettering across the center
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(r * 0.56)}px "Times New Roman", Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NASA', cx, cy + r * 0.04);
    ctx.restore();
  }

  // Helper to draw a crisp US Flag onto a 2D canvas context
  function drawUsFlag(ctx, x, y, w, h, cantonRight = false) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, w, h);
    const stripeH = h / 13;
    ctx.fillStyle = '#b22234';
    for (let s = 0; s < 13; s += 2) {
      ctx.fillRect(x, y + s * stripeH, w, stripeH);
    }
    const cw = w * 0.42;
    const ch = stripeH * 7;
    const cx = cantonRight ? (x + w - cw) : x;
    ctx.fillStyle = '#0a3161';
    ctx.fillRect(cx, y, cw, ch);
    ctx.fillStyle = '#ffffff';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        ctx.beginPath();
        ctx.arc(cx + (c + 0.5) * (cw / 6), y + (r + 0.5) * (ch / 5), Math.max(1.0, h * 0.022), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  function makeProcTex(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }

  // 1. Left Wing Decal: Classic Blue NASA Meatball Insignia on cool-white wing tile background
  const leftWingTex = makeProcTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#dedfe4';
    ctx.fillRect(0, 0, w, h);
    drawNasaMeatball(ctx, w * 0.50, h * 0.50, w * 0.34);
  });
  const leftWingDecalMat = physical({
    map: leftWingTex,
    roughness: 0.50,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  // 2. Right Wing Decal: US Flag above bold "Discovery" text (matching reference image!)
  const rightWingTex = makeProcTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#dedfe4';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w * 0.50, h * 0.52);
    ctx.rotate(-0.18); // Angled parallel to the elevon hinge line just like in the photo!
    drawUsFlag(ctx, -115, -105, 220, 118, false);
    ctx.fillStyle = '#1f232a';
    ctx.font = '700 54px "Arial", "Helvetica Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Discovery', 0, 62);
    ctx.restore();
  });
  const rightWingDecalMat = physical({
    map: rightWingTex,
    roughness: 0.50,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  // 3. Lower Fuselage Side Decal: US Flag + Vertical "United States" + NASA Meatball + Yellow/Black Inspection Marks
  const fuseSideTex = makeProcTex(256, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#dedfe4';
    ctx.fillRect(0, 0, w, h);

    // Top: US Flag (canton on upper-right/starboard side facing forward)
    ctx.save();
    ctx.translate(w * 0.52, 135);
    ctx.rotate(-Math.PI * 0.5);
    drawUsFlag(ctx, -72, -44, 144, 88, true);
    ctx.restore();

    // Middle: Bold black "United States" running vertically from bottom to top along the fuselage
    ctx.save();
    ctx.translate(w * 0.54, 495);
    ctx.rotate(-Math.PI * 0.5);
    ctx.fillStyle = '#1b1e24';
    ctx.font = '700 66px "Arial", "Helvetica Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('United States', 0, 0);
    ctx.restore();

    // Small black square tile vents along the upper edge of the decal strip (visible in photo!)
    ctx.fillStyle = '#181a1f';
    for (const vy of [32, 245, 365, 625, 735]) {
      ctx.fillRect(26, vy, 28, 36);
    }

    // Lower: Blue NASA Meatball rotated to match the fuselage side
    ctx.save();
    ctx.translate(w * 0.52, 825);
    ctx.rotate(-Math.PI * 0.5);
    drawNasaMeatball(ctx, 0, 0, 52);
    ctx.restore();

    // Bottom: Yellow & black technical inspection badges below the NASA logo (visible in photo!)
    ctx.fillStyle = '#c89224';
    ctx.fillRect(w * 0.34, 902, 74, 24);
    ctx.fillRect(w * 0.34, 936, 74, 22);
    ctx.fillStyle = '#23272e';
    ctx.fillRect(w * 0.36, 972, 68, 28);
  });
  const fuseSideDecalMat = physical({
    map: fuseSideTex,
    roughness: 0.50,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  // 4. Forward Crew Cabin Side Decal: "Discovery" title beside the cockpit + Crew Hatch Markings
  const cockpitSideTex = makeProcTex(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#dedfe4';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w * 0.55, h * 0.36);
    ctx.rotate(-Math.PI * 0.5);
    ctx.fillStyle = '#1c2026';
    ctx.font = '700 44px "Arial", "Helvetica Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Discovery', 0, 0);
    ctx.restore();

    // Black rectangular tile vents & crew hatch window below the cockpit
    ctx.fillStyle = '#181a1f';
    ctx.fillRect(38, 305, 42, 68);
    ctx.fillRect(110, 355, 34, 52);
  });
  const cockpitSideDecalMat = physical({
    map: cockpitSideTex,
    roughness: 0.50,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  _shuttleMats = {
    etOrangeMat,
    etDarkOrangeMat,
    etIntertankGoldMat,
    srbYellowRingMat,
    orbiterWhiteMat,
    omsCreamMat,
    srbWhiteMat,
    blackTileMat,
    windshieldMat,
    ssmeDarkMat,
    silverMetalMat,
    srbNozzleGreyMat,
    leftWingDecalMat,
    rightWingDecalMat,
    fuseSideDecalMat,
    cockpitSideDecalMat,
  };
  return _shuttleMats;
}

// Stage 3 (Top): Space Shuttle External Tank (ET) Burnt-Orange Ogive Nose Cone &
// Golden-Tan Ribbed Intertank Collar (H = 12.5m)
function buildShuttleNose() {
  const g = new THREE.Group();
  const H = PARTS.shuttleNose.height; // 12.5
  const {
    etOrangeMat,
    etDarkOrangeMat,
    etIntertankGoldMat,
    blackTileMat,
    silverMetalMat,
    srbNozzleGreyMat,
    ssmeDarkMat,
  } = getShuttleMaterials();

  const yIntertankTop = 4.10;
  const yOgiveTop = 12.05;

  // =========================================================================
  // 1. GOLDEN-TAN RIBBED INTERTANK COLLAR (y = 0.0 -> 4.10, r = R_STS_ET = 1.92)
  // =========================================================================
  g.add(mesh(new THREE.CylinderGeometry(R_STS_ET + 0.008, R_STS_ET + 0.008, yIntertankTop, 64), etIntertankGoldMat, 0, yIntertankTop * 0.5, 0));

  // Horizontal structural flange rings on the Intertank (bottom, middle, top)
  for (const ry of [0.07, 2.02, yIntertankTop - 0.06]) {
    g.add(mesh(new THREE.CylinderGeometry(R_STS_ET + 0.028, R_STS_ET + 0.028, 0.10, 64), etIntertankGoldMat, 0, ry, 0));
  }
  g.add(mesh(new THREE.CylinderGeometry(R_STS_ET + 0.022, R_STS_ET + 0.022, 0.05, 64), etDarkOrangeMat, 0, yIntertankTop, 0));

  // 76 fine vertical stringer ribs around the golden-tan Intertank collar
  for (let i = 0; i < 76; i++) {
    const a = (i / 76) * Math.PI * 2;
    const rx = Math.sin(a) * (R_STS_ET + 0.016);
    const rz = Math.cos(a) * (R_STS_ET + 0.016);
    const rib = mesh(new THREE.BoxGeometry(0.036, yIntertankTop - 0.12, 0.026), etIntertankGoldMat, rx, yIntertankTop * 0.5, rz);
    rib.rotation.y = a;
    g.add(rib);
  }

  // Rectangular Intertank access door panel on the upper-left-front (visible in reference photo!)
  const doorAng = -0.22;
  const dxDoor = Math.sin(doorAng) * (R_STS_ET + 0.024);
  const dzDoor = Math.cos(doorAng) * (R_STS_ET + 0.024);
  const doorFrame = mesh(new THREE.BoxGeometry(0.54, 0.78, 0.04), etDarkOrangeMat, dxDoor, 3.22, dzDoor);
  doorFrame.rotation.y = doorAng;
  g.add(doorFrame);
  const doorPanel = mesh(new THREE.BoxGeometry(0.44, 0.68, 0.048), etIntertankGoldMat, dxDoor, 3.22, dzDoor);
  doorPanel.rotation.y = doorAng;
  g.add(doorPanel);

  // Upper start of the External LOX Feedline / Pressurization Pipe on the Intertank front (y = 0.0 -> 2.75)
  const feedAng = -0.09;
  const fx = Math.sin(feedAng) * (R_STS_ET + 0.09);
  const fz = Math.cos(feedAng) * (R_STS_ET + 0.09);
  g.add(mesh(new THREE.CylinderGeometry(0.10, 0.10, 2.55, 20), etOrangeMat, fx, 1.28, fz));
  // Dark-grey conical aerodynamic fairing cap at the top of the intertank pipe (y = 2.55 -> 2.85, visible in photo!)
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.11, 0.32, 20), srbNozzleGreyMat, fx, 2.70, fz));
  // Dark horizontal pipe clamp bands along the intertank pipe
  for (const py of [0.35, 1.15, 1.95, 2.48]) {
    const clamp = mesh(new THREE.BoxGeometry(0.24, 0.09, 0.22), blackTileMat, fx, py, fz - 0.02);
    clamp.rotation.y = feedAng;
    g.add(clamp);
  }

  // =========================================================================
  // 2. BURNT-ORANGE OGIVE LOX NOSE CONE (y = 4.10 -> 12.05) + LIGHTNING ROD TIP
  // =========================================================================
  const ogivePts = [];
  const nOgive = 40;
  for (let i = 0; i <= nOgive; i++) {
    const t = i / nOgive;
    const r = 0.12 + (R_STS_ET - 0.12) * Math.pow(1 - Math.pow(t, 1.45), 0.68);
    ogivePts.push(new THREE.Vector2(r, yIntertankTop + t * (yOgiveTop - yIntertankTop)));
  }
  g.add(mesh(new THREE.LatheGeometry(ogivePts, 64), etOrangeMat));

  // Pointed aerodynamic nose cap & silver lightning rod spike at the very top (y = 12.05 -> 12.50)
  g.add(mesh(new THREE.CylinderGeometry(0.035, 0.12, 0.30, 28), srbNozzleGreyMat, 0, 12.20, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.012, 0.035, 0.20, 16), silverMetalMat, 0, 12.40, 0));

  // Prominent Dark-Brown / Black External Cable Tray & Pressurization Line running up the
  // front-left of the burnt-orange ogive nose cone from y = 2.80 all the way to the tip (y = 12.05)!
  const nTraySegs = 24;
  for (let i = 0; i < nTraySegs; i++) {
    const t0 = i / nTraySegs;
    const t1 = (i + 1) / nTraySegs;
    const tm = (t0 + t1) * 0.5;
    const y0 = 2.80 + t0 * (yOgiveTop - 2.80);
    const y1 = 2.80 + t1 * (yOgiveTop - 2.80);
    const ym = (y0 + y1) * 0.5;
    const rm = ym <= yIntertankTop
      ? R_STS_ET + 0.02
      : 0.12 + (R_STS_ET - 0.12) * Math.pow(1 - Math.pow((ym - yIntertankTop) / (yOgiveTop - yIntertankTop), 1.45), 0.68);
    const tx = Math.sin(feedAng) * (rm + 0.025);
    const tz = Math.cos(feedAng) * (rm + 0.025);
    const seg = mesh(new THREE.BoxGeometry(0.095, (y1 - y0) * 1.08, 0.075), blackTileMat, tx, ym, tz);
    seg.rotation.y = feedAng;
    seg.rotation.x = 0.24 * Math.pow(tm, 0.85);
    g.add(seg);
  }

  // Internal stage propulsion nozzle & recovery parachutes
  g.add(mesh(new THREE.CylinderGeometry(R_STS_ET * 0.82, R_STS_ET * 0.82, 0.14, 48), ssmeDarkMat, 0, 0.07, 0));
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.16, 0.42, 0.58, 32), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.42, [mBell]);
  addParachutes(g, 11.6);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 2 (Middle): Burnt-Orange External Tank (ET) Middle Barrel + Complete Piggyback
// Space Shuttle Orbiter "Discovery" (H = 14.5m)
function buildShuttleOrbiter() {
  const g = new THREE.Group();
  const H = PARTS.shuttleOrbiter.height; // 14.5
  const {
    etOrangeMat,
    etDarkOrangeMat,
    orbiterWhiteMat,
    omsCreamMat,
    blackTileMat,
    windshieldMat,
    ssmeDarkMat,
    silverMetalMat,
    srbNozzleGreyMat,
    leftWingDecalMat,
    rightWingDecalMat,
    fuseSideDecalMat,
    cockpitSideDecalMat,
  } = getShuttleMaterials();

  // =========================================================================
  // 1. BURNT-ORANGE EXTERNAL TANK (ET) MIDDLE BARREL (y = 0.0 -> 14.50)
  // =========================================================================
  g.add(mesh(new THREE.CylinderGeometry(R_STS_ET, R_STS_ET, H, 64), etOrangeMat, 0, H * 0.5, 0));

  // Horizontal foam structural ring ridges along the orange tank
  for (const ry of [0.08, 3.65, 7.25, 10.85, H - 0.08]) {
    g.add(mesh(new THREE.CylinderGeometry(R_STS_ET + 0.018, R_STS_ET + 0.018, 0.09, 64), etDarkOrangeMat, 0, ry, 0));
  }

  // External vertical LOX feedline & pressurization cable tray running down the front of the ET
  const feedAng = -0.09;
  const fx = Math.sin(feedAng) * (R_STS_ET + 0.09);
  const fz = Math.cos(feedAng) * (R_STS_ET + 0.09);
  g.add(mesh(new THREE.CylinderGeometry(0.10, 0.10, H, 20), etOrangeMat, fx, H * 0.5, fz));
  for (let py = 0.9; py < H; py += 1.65) {
    const clamp = mesh(new THREE.BoxGeometry(0.24, 0.09, 0.20), blackTileMat, fx, py, fz - 0.02);
    clamp.rotation.y = feedAng;
    g.add(clamp);
  }

  // Forward Bipod V-Struts connecting the ET (y = 11.20) to the Orbiter nose underside
  for (const sgn of [-1, 1]) {
    const strut = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 12), etDarkOrangeMat, sgn * 0.32, 11.25, R_STS_ET + 0.25);
    strut.rotation.x = Math.PI * 0.42;
    strut.rotation.z = sgn * 0.32;
    g.add(strut);
  }
  // Aft Orbiter-to-ET structural attachment struts (y = -8.20 & y = 1.80)
  for (const sgn of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.20, 0.30, 0.72), ssmeDarkMat, sgn * 0.86, 1.85, R_STS_ET + 0.20));
    g.add(mesh(new THREE.BoxGeometry(0.24, 0.36, 0.78), ssmeDarkMat, sgn * 0.92, -8.40, R_STS_ET + 0.22));
  }

  // =========================================================================
  // 2. COMPLETE 3D SPACE SHUTTLE ORBITER "DISCOVERY" (y = -11.80 -> +13.15 on +Z)
  // =========================================================================
  const orbiter = new THREE.Group();
  g.add(orbiter);

  const yFuseBot = -11.80;
  const yBlackCapBot = 11.82;
  const yNoseTip = 13.12;

  // A. Sculpted Cool-White Fuselage (y = -11.80 -> +11.82) + Matte-Black RCC Nose Cap (y = +11.82 -> +13.12)
  orbiter.add(mesh(buildBuranFuselageSectionGeo(yFuseBot, yBlackCapBot, 40, 64), orbiterWhiteMat));
  orbiter.add(mesh(buildBuranFuselageSectionGeo(yBlackCapBot - 0.02, yNoseTip, 18, 48), blackTileMat));
  const tipProf = buranFuselageProfile(yNoseTip - 0.05);
  const noseSphere = mesh(new THREE.SphereGeometry(0.22, 24, 16), blackTileMat, 0, yNoseTip - 0.08, tipProf.zCenter);
  noseSphere.scale.set(1.05, 0.85, 0.95);
  orbiter.add(noseSphere);

  // Matte-black thermal protection belly tile slab along the underbelly of the Orbiter
  orbiter.add(mesh(new THREE.BoxGeometry(3.26, 20.6, 0.18), blackTileMat, 0, -1.2, 1.88));

  // Stepped Matte-Black Chine / Cheek Thermal Tile Wrapping along the forward fuselage sides (y = 8.15 -> 11.85)
  // Matches the notched black tile boundary below the cockpit window in the reference photo!
  for (const sgn of [-1, 1]) {
    for (const [cy, ch, cw, czOff] of [
      [11.20, 1.35, 0.36, 2.42],
      [10.10, 1.15, 0.32, 2.32],
      [8.95, 1.25, 0.26, 2.20],
    ]) {
      const { rx } = buranFuselageProfile(cy);
      const cheek = mesh(new THREE.BoxGeometry(cw, ch, 0.48), blackTileMat, sgn * (rx - 0.06), cy, czOff);
      cheek.rotation.y = sgn * 0.22;
      orbiter.add(cheek);
    }
  }

  // B. Iconic Space Shuttle Forward Nose RCS Thruster Array (matching reference photo!):
  // 1) Upper grey/white-outlined nose patch (y = 12.10) with 3 circular black RCS ports in a row
  const rcsUpperZ = buranSurfaceZ(0, 12.12);
  const rcsUpperPatch = mesh(new THREE.BoxGeometry(0.68, 0.34, 0.05), srbNozzleGreyMat, 0, 12.12, rcsUpperZ + 0.008);
  rcsUpperPatch.rotation.x = -0.42;
  orbiter.add(rcsUpperPatch);
  for (const rx of [-0.20, 0.0, 0.20]) {
    const rz = buranSurfaceZ(rx, 12.12);
    const dot = mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.06, 16).rotateX(Math.PI * 0.5), blackTileMat, rx, 12.12, rz + 0.018);
    dot.rotation.x = -0.42;
    orbiter.add(dot);
  }

  // 2) White Rectangular Forward RCS Block (y = 11.28) right above the windshield with 4 black RCS ports!
  const rcsBlockZ = buranSurfaceZ(0, 11.28);
  const rcsWhiteBlock = mesh(new THREE.BoxGeometry(0.62, 0.56, 0.055), orbiterWhiteMat, 0, 11.28, rcsBlockZ + 0.012);
  rcsWhiteBlock.rotation.x = -0.34;
  orbiter.add(rcsWhiteBlock);
  const rcsBlockBorder = mesh(new THREE.BoxGeometry(0.66, 0.60, 0.045), blackTileMat, 0, 11.28, rcsBlockZ + 0.006);
  rcsBlockBorder.rotation.x = -0.34;
  orbiter.add(rcsBlockBorder);
  for (const [bx, by] of [[-0.14, 11.40], [0.14, 11.40], [-0.14, 11.16], [0.14, 11.16]]) {
    const bz = buranSurfaceZ(bx, by);
    const port = mesh(new THREE.BoxGeometry(0.11, 0.14, 0.06), blackTileMat, bx, by, bz + 0.02);
    port.rotation.x = -0.34;
    orbiter.add(port);
  }

  // Side nose RCS thruster ports on left & right nose cheeks (y = 10.95)
  for (const sgn of [-1, 1]) {
    for (const [rx, ry] of [[0.78, 11.05], [0.88, 10.75]]) {
      const px = sgn * rx;
      const pz = buranSurfaceZ(px, ry);
      const sPort = mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.06, 14).rotateX(Math.PI * 0.5), blackTileMat, px, ry, pz + 0.012);
      sPort.rotation.y = sgn * 0.45;
      sPort.rotation.x = -0.28;
      orbiter.add(sPort);
    }
  }

  // C. Iconic 6-Pane V-Shaped Black Cockpit Windshield (y = +8.65 -> +9.95) with crisp white window frames
  const windPanes = [
    [0.27, 9.56, 0.38, 0.42, -0.46, 0.18, -0.26],
    [0.70, 9.28, 0.44, 0.44, -0.58, 0.44, -0.22],
    [1.12, 8.84, 0.42, 0.40, -0.68, 0.72, -0.16],
  ];
  for (const sgn of [-1, 1]) {
    for (const [wx, wy, ww, wh, rz, ry, rx] of windPanes) {
      const px = sgn * wx;
      const pz = buranSurfaceZ(px, wy);
      const pane = mesh(new THREE.BoxGeometry(ww, wh, 0.06), windshieldMat, px, wy, pz + 0.012);
      pane.rotation.order = 'YXZ';
      pane.rotation.y = sgn * ry;
      pane.rotation.x = rx;
      pane.rotation.z = sgn * rz;
      orbiter.add(pane);
    }
  }

  // D. 2 Square Black Overhead Cockpit Windows right behind the V-windshield (y = +7.95, x = ±0.25)
  for (const sgn of [-1, 1]) {
    const ox = sgn * 0.25;
    const oy = 7.95;
    const oz = buranSurfaceZ(ox, oy);
    const owin = mesh(new THREE.BoxGeometry(0.35, 0.36, 0.05), windshieldMat, ox, oy, oz + 0.012);
    owin.rotation.x = -0.14;
    owin.rotation.y = sgn * 0.12;
    orbiter.add(owin);
  }

  // E. Forward Crew Cabin Side "Discovery" Title Decal & Row of Black Rectangular Side Vents
  for (const sgn of [-1, 1]) {
    const cx = sgn * 1.46;
    const cy = 8.45;
    const cz = buranSurfaceZ(cx, cy);
    const cDec = mesh(new THREE.BoxGeometry(0.55, 1.85, 0.03), cockpitSideDecalMat, cx, cy, cz + 0.015);
    cDec.rotation.y = sgn * 0.68;
    orbiter.add(cDec);

    // Row of black rectangular vent / tile markings along the lower side of the fuselage (y = 6.2 down to 0.4, matching photo!)
    for (const [vy, vh] of [[6.25, 0.42], [4.95, 0.36], [3.55, 0.46], [2.05, 0.44]]) {
      const vx = sgn * 1.56;
      const vz = buranSurfaceZ(vx, vy);
      const vent = mesh(new THREE.BoxGeometry(0.20, vh, 0.04), blackTileMat, vx, vy, vz + 0.015);
      vent.rotation.y = sgn * 0.72;
      orbiter.add(vent);
    }

    // Grey trapezoidal side access panel at y = 0.75 (visible on the fuselage side right above the US Flag!)
    const hx = sgn * 1.52;
    const hz = buranSurfaceZ(hx, 0.75);
    const hatch = mesh(new THREE.BoxGeometry(0.42, 1.15, 0.035), srbNozzleGreyMat, hx, 0.75, hz + 0.014);
    hatch.rotation.y = sgn * 0.68;
    orbiter.add(hatch);

    // F. Lower Fuselage Side Decal Panel (y = -8.35 -> -0.55):
    //    US Flag + Vertical "United States" + NASA Meatball + Yellow/Black Inspection Badges
    const fxDec = sgn * 1.48;
    const fyDec = -4.45;
    const fzDec = buranSurfaceZ(fxDec, fyDec);
    const sideDec = mesh(new THREE.BoxGeometry(0.86, 7.80, 0.035), fuseSideDecalMat, fxDec, fyDec, fzDec + 0.018);
    sideDec.rotation.y = sgn * 0.64;
    orbiter.add(sideDec);
  }

  // G. Crisp Black Payload Bay Panel Seam Lines & Yellow Hinge Latches on the White Upper Fuselage
  const lenCenterSeam = 7.35 - (-6.20);
  orbiter.add(mesh(new THREE.BoxGeometry(0.034, lenCenterSeam, 0.03), blackTileMat, 0, (-6.20 + 7.35) * 0.5, buranSurfaceZ(0, 0) + 0.012));

  const lenSideSeam = 7.35 - (-8.40);
  for (const sgn of [-1, 1]) {
    const sx = sgn * 1.32;
    const sz = buranSurfaceZ(sx, 0);
    orbiter.add(mesh(new THREE.BoxGeometry(0.032, lenSideSeam, 0.032), blackTileMat, sx, (-8.40 + 7.35) * 0.5, sz + 0.012));
  }

  // 5 Horizontal Black Panel Seam Rings across the white payload bay doors
  for (const py of [7.35, 3.35, -0.85, -5.05, -8.40]) {
    const nSeg = 24;
    const { rx } = buranFuselageProfile(py);
    for (let i = 0; i < nSeg; i++) {
      const t0 = -0.90 + (1.80 * i) / nSeg;
      const t1 = -0.90 + (1.80 * (i + 1)) / nSeg;
      const xm = ((t0 + t1) * 0.5) * rx;
      const zm = buranSurfaceZ(xm, py);
      const dx = (t1 - t0) * rx;
      const dz = buranSurfaceZ(t1 * rx, py) - buranSurfaceZ(t0 * rx, py);
      const segLen = Math.hypot(dx, dz) * 1.08;
      const bar = mesh(new THREE.BoxGeometry(segLen, 0.034, 0.030), blackTileMat, xm, py, zm + 0.012);
      bar.rotation.y = -Math.atan2(dz, dx);
      orbiter.add(bar);
    }
  }

  // =========================================================================
  // H. DOUBLE-DELTA WINGS WITH BLACK RCC LEADING EDGES, CORRUGATED ELEVON BAND,
  //    NASA MEATBALL ON LEFT WING & US FLAG + "DISCOVERY" ON RIGHT WING
  // =========================================================================
  for (const sgn of [-1, 1]) {
    // 1. Full Wing Contour in Matte-Black RCC / Tile Material
    const blackWingShape = new THREE.Shape();
    blackWingShape.moveTo(sgn * 1.55, 4.55);
    blackWingShape.lineTo(sgn * 1.82, 4.55);
    blackWingShape.lineTo(sgn * 2.68, -1.55);
    blackWingShape.lineTo(sgn * 7.36, -6.72);
    blackWingShape.lineTo(sgn * 7.64, -8.28);
    blackWingShape.lineTo(sgn * 7.64, -9.62);
    blackWingShape.lineTo(sgn * 1.55, -10.82);
    blackWingShape.closePath();

    const blackWingGeo = new THREE.ExtrudeGeometry(blackWingShape, {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 2,
    });
    orbiter.add(mesh(blackWingGeo, blackTileMat, 0, 0, 1.66));

    // 2. White Upper Main Wing Surface (inset from leading edge & stopping above the black elevon hinge band at y = -8.16)
    const whiteWingShape = new THREE.Shape();
    whiteWingShape.moveTo(sgn * 1.62, 3.05);
    whiteWingShape.lineTo(sgn * 2.40, -1.78);
    whiteWingShape.lineTo(sgn * 7.04, -6.92);
    whiteWingShape.lineTo(sgn * 7.42, -8.16);
    whiteWingShape.lineTo(sgn * 1.62, -8.16);
    whiteWingShape.closePath();

    const whiteWingGeo = new THREE.ExtrudeGeometry(whiteWingShape, {
      depth: 0.14,
      bevelEnabled: false,
    });
    orbiter.add(mesh(whiteWingGeo, orbiterWhiteMat, 0, 0, 1.80));

    // Vertical rib tick marks across the black corrugated elevon hinge band (y = -8.16 -> -8.66, visible in photo!)
    for (let tx = 1.95; tx <= 7.25; tx += 0.34) {
      orbiter.add(mesh(new THREE.BoxGeometry(0.08, 0.46, 0.04), srbNozzleGreyMat, sgn * tx, -8.41, 1.92));
    }

    // 3. White Inner & Outer Elevon Flaps below the black hinge band (y = -8.66 down to trailing edge)
    const inElevShape = new THREE.Shape();
    inElevShape.moveTo(sgn * 1.62, -8.66);
    inElevShape.lineTo(sgn * 4.62, -8.66);
    inElevShape.lineTo(sgn * 4.62, -10.14);
    inElevShape.lineTo(sgn * 1.62, -10.72);
    inElevShape.closePath();
    orbiter.add(mesh(new THREE.ExtrudeGeometry(inElevShape, { depth: 0.14, bevelEnabled: false }), orbiterWhiteMat, 0, 0, 1.80));

    const outElevShape = new THREE.Shape();
    outElevShape.moveTo(sgn * 4.70, -8.66);
    outElevShape.lineTo(sgn * 7.46, -8.66);
    outElevShape.lineTo(sgn * 7.46, -9.55);
    outElevShape.lineTo(sgn * 4.70, -10.12);
    outElevShape.closePath();
    orbiter.add(mesh(new THREE.ExtrudeGeometry(outElevShape, { depth: 0.14, bevelEnabled: false }), orbiterWhiteMat, 0, 0, 1.80));

    // Subtle panel seam line across the white main wing
    orbiter.add(mesh(new THREE.BoxGeometry(3.85, 0.030, 0.03), blackTileMat, sgn * 3.60, -5.10, 1.945));
  }

  // Left Wing Decal (x < 0): Classic Blue NASA Meatball Insignia (y = -6.55, x = -4.95)
  orbiter.add(mesh(new THREE.BoxGeometry(2.15, 2.15, 0.02), leftWingDecalMat, -4.85, -6.55, 1.945));

  // Right Wing Decal (x > 0): US Flag + "Discovery" lettering (y = -6.55, x = +3.95)
  orbiter.add(mesh(new THREE.BoxGeometry(2.65, 2.35, 0.02), rightWingDecalMat, 3.85, -6.45, 1.945));

  // =========================================================================
  // I. SWEPT VERTICAL TAIL FIN (STABILIZER), CREAM-WHITE OMS PODS & 3× RS-25 (SSME) NOZZLES
  // =========================================================================
  const tailBlackShape = new THREE.Shape();
  tailBlackShape.moveTo(3.15, -5.75);
  tailBlackShape.lineTo(3.62, -5.75);
  tailBlackShape.lineTo(5.32, -12.68);
  tailBlackShape.lineTo(5.06, -13.22);
  tailBlackShape.lineTo(3.15, -11.75);
  tailBlackShape.closePath();
  const tailBlackGeo = new THREE.ExtrudeGeometry(tailBlackShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
  tailBlackGeo.rotateY(-Math.PI * 0.5);
  tailBlackGeo.translate(0.08, 0, 0);
  orbiter.add(mesh(tailBlackGeo, blackTileMat));

  // White side panels of the vertical tail fin with split rudder/speedbrake seam lines
  const tailWhiteShape = new THREE.Shape();
  tailWhiteShape.moveTo(3.15, -6.10);
  tailWhiteShape.lineTo(3.46, -6.10);
  tailWhiteShape.lineTo(5.06, -12.75);
  tailWhiteShape.lineTo(4.86, -13.12);
  tailWhiteShape.lineTo(3.15, -11.65);
  tailWhiteShape.closePath();
  const tailWhiteGeo = new THREE.ExtrudeGeometry(tailWhiteShape, {
    depth: 0.22,
    bevelEnabled: false,
  });
  tailWhiteGeo.rotateY(-Math.PI * 0.5);
  tailWhiteGeo.translate(0.11, 0, 0);
  orbiter.add(mesh(tailWhiteGeo, orbiterWhiteMat));

  // Black seam lines on the vertical tail fin (rudder hinge line + horizontal panel ribs, visible in photo!)
  const rudderSeam = mesh(new THREE.BoxGeometry(0.24, 5.95, 0.045), blackTileMat, 0, -9.85, 4.18);
  rudderSeam.rotation.x = -0.24;
  orbiter.add(rudderSeam);
  for (const [ty, tz] of [[-7.85, 3.65], [-9.95, 4.15], [-11.65, 4.55]]) {
    const hSeam = mesh(new THREE.BoxGeometry(0.24, 0.045, 0.72), blackTileMat, 0, ty, tz);
    hSeam.rotation.x = 0.65;
    orbiter.add(hSeam);
  }

  // Left & Right Sculpted Cream-White OMS / RCS Pods (y = -7.75 -> -11.75) with Black Forward RCS Patches
  for (const sgn of [-1, 1]) {
    const px = sgn * 1.24;
    // Main rounded cream-white OMS pod body
    const omsBody = mesh(new THREE.CylinderGeometry(0.56, 0.64, 3.35, 28), omsCreamMat, px, -9.95, 2.88);
    omsBody.scale.set(0.88, 1.0, 1.12);
    orbiter.add(omsBody);

    // Rounded forward dome of the OMS pod (y = -8.28)
    const omsDome = mesh(new THREE.SphereGeometry(0.56, 24, 18), omsCreamMat, px, -8.28, 2.86);
    omsDome.scale.set(0.86, 1.15, 1.08);
    orbiter.add(omsDome);

    // Matte-Black Forward RCS Thruster Patch on the front tip of the OMS pod (matching reference photo!)
    const omsBlackCap = mesh(new THREE.SphereGeometry(0.54, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.48), blackTileMat, px, -8.12, 2.86);
    omsBlackCap.scale.set(0.84, 1.05, 1.05);
    omsBlackCap.rotation.x = 0.25;
    orbiter.add(omsBlackCap);

    // Aft side black RCS thruster grid patch on the outer rear of the OMS pod (y = -10.85)
    const aftRcsPatch = mesh(new THREE.BoxGeometry(0.12, 0.85, 0.42), blackTileMat, px + sgn * 0.46, -10.85, 3.05);
    aftRcsPatch.rotation.y = sgn * 0.18;
    orbiter.add(aftRcsPatch);

    // Dark OMS orbital maneuvering engine nozzle at the rear base of each OMS pod (y = -11.95)
    const omsNoz = mesh(bellGeometry(0.14, 0.28, 0.55, 20), ssmeDarkMat, px * 0.95, -12.10, 3.02);
    omsNoz.rotation.x = 0.16;
    orbiter.add(omsNoz);
  }

  // Dark recessed aft engine heat-shield base between the OMS pods (y = -10.20 -> -11.85)
  orbiter.add(mesh(new THREE.BoxGeometry(2.15, 1.85, 1.15), blackTileMat, 0, -11.05, 2.72));

  // 3× Iconic RS-25 (SSME) Space Shuttle Main Engine Nozzles at the stern of the Orbiter!
  // Arranged in a triangle: 1 upper-center nozzle (z = 3.22) + 2 lower-side nozzles (x = ±0.70, z = 2.45)
  const ssmeMounts = [
    [0.0, -11.95, 3.22, 0.24, 0.0],
    [-0.70, -12.25, 2.46, 0.18, -0.08],
    [0.70, -12.25, 2.46, 0.18, 0.08],
  ];
  for (const [mx, my, mz, rx, rz] of ssmeMounts) {
    const engGrp = new THREE.Group();
    engGrp.position.set(mx, my, mz);
    engGrp.rotation.x = rx;
    engGrp.rotation.z = rz;
    // White thermal gimbal boot at the top of the nozzle
    engGrp.add(mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.45, 24), omsCreamMat, 0, 0.55, 0));
    // Dark gunmetal-black contoured RS-25 nozzle bell
    engGrp.add(mesh(bellGeometry(0.32, 0.62, 1.25, 32), ssmeDarkMat, 0, -0.65, 0));
    // 3 silver cooling manifold rings around the RS-25 nozzle bell
    for (const [ry, rr] of [[-0.08, 0.44], [-0.36, 0.52], [-0.62, 0.60]]) {
      engGrp.add(mesh(new THREE.TorusGeometry(rr, 0.022, 10, 28).rotateX(Math.PI * 0.5), silverMetalMat, 0, ry, 0));
    }
    orbiter.add(engGrp);
  }

  // Stage 2 Propulsion Nozzles & Recovery Parachutes
  for (const [nx, nz] of [[0.0, 0.55], [-0.65, -0.35], [0.65, -0.35]]) {
    const mBell = bellMaterial(false);
    g.add(mesh(bellGeometry(0.18, 0.44, 0.65, 28), mBell, nx, 0, nz));
    addNozzle(g, nx, nz, 0.44, [mBell]);
  }
  addParachutes(g, 13.0);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 1 (Bottom): Lower Burnt-Orange External Tank (ET) with Rounded Aft Dome +
// Twin White Solid Rocket Boosters (SRBs) with Pointed Nose Cones, Black Field-Joint Bands,
// 3 Golden-Yellow Aft Skirt Stiffener Rings & Wide Flared SRB Nozzles (H = 15.0m)
function buildShuttleSrb() {
  const g = new THREE.Group();
  const H = PARTS.shuttleSrb.height; // 15.0
  const {
    etOrangeMat,
    etDarkOrangeMat,
    srbYellowRingMat,
    srbWhiteMat,
    blackTileMat,
    ssmeDarkMat,
    srbNozzleGreyMat,
  } = getShuttleMaterials();

  const yEtCylBot = 4.65;

  // =========================================================================
  // 1. LOWER BURNT-ORANGE EXTERNAL TANK (ET) & ROUNDED ELLIPSOIDAL AFT DOME
  //    (y = 3.15 -> 15.00, r = R_STS_ET = 1.92)
  // =========================================================================
  const hEtCyl = H - yEtCylBot;
  g.add(mesh(new THREE.CylinderGeometry(R_STS_ET, R_STS_ET, hEtCyl, 64), etOrangeMat, 0, yEtCylBot + hEtCyl * 0.5, 0));

  // Horizontal structural foam ring ridges on the lower ET barrel
  for (const ry of [yEtCylBot + 0.06, 8.10, 11.55, H - 0.06]) {
    g.add(mesh(new THREE.CylinderGeometry(R_STS_ET + 0.018, R_STS_ET + 0.018, 0.09, 64), etDarkOrangeMat, 0, ry, 0));
  }

  // Rounded Burnt-Orange Ellipsoidal Aft Dome at the bottom of the External Tank (y = 3.15 -> 4.65)
  const aftDome = mesh(new THREE.SphereGeometry(R_STS_ET, 48, 28, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), etOrangeMat, 0, yEtCylBot, 0);
  aftDome.scale.set(1.0, 0.78, 1.0);
  g.add(aftDome);
  // Dark circular manhole cap at the bottom center of the ET aft dome (y = 3.15)
  g.add(mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 24), etDarkOrangeMat, 0, 3.16, 0));

  // Continuation of the front External LOX Feedline & Cable Tray down to the aft Orbiter umbilical
  const feedAng = -0.09;
  const fx = Math.sin(feedAng) * (R_STS_ET + 0.09);
  const fz = Math.cos(feedAng) * (R_STS_ET + 0.09);
  g.add(mesh(new THREE.CylinderGeometry(0.10, 0.10, hEtCyl, 20), etOrangeMat, fx, yEtCylBot + hEtCyl * 0.5, fz));
  for (let py = 5.4; py < H; py += 1.65) {
    const clamp = mesh(new THREE.BoxGeometry(0.24, 0.09, 0.20), blackTileMat, fx, py, fz - 0.02);
    clamp.rotation.y = feedAng;
    g.add(clamp);
  }

  // =========================================================================
  // 2. TWIN WHITE SOLID ROCKET BOOSTERS (SRBs) ON LEFT & RIGHT (x = ±2.74)
  //    Extending continuously from y = 0.0 up to y = 26.85 (beside the ET Intertank!)
  // =========================================================================
  const yNozTop = 1.38;
  const ySkirtTop = 3.35;
  const ySrbCylTop = 23.60;
  const ySrbTip = 26.85;

  for (const sgn of [-1, 1]) {
    const bx = sgn * X_STS_SRB;
    const bz = Z_STS_SRB;

    // A. Wide Flared Light-Grey SRB Exhaust Nozzle (y = 0.0 -> 1.38, matching reference photo!)
    const mSrbBell = bellMaterial(true);
    g.add(mesh(new THREE.CylinderGeometry(0.56, 0.90, 0.72, 48), srbNozzleGreyMat, bx, 0.36, bz));
    g.add(mesh(new THREE.CylinderGeometry(0.48, 0.64, 0.74, 48), srbNozzleGreyMat, bx, 1.02, bz));
    // Horizontal ring seam around the middle of the grey SRB nozzle (y = 0.70)
    g.add(mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.07, 48), ssmeDarkMat, bx, 0.70, bz));
    g.add(mesh(bellGeometry(0.46, 0.88, yNozTop, 36), mSrbBell, bx, 0, bz));
    addNozzle(g, bx, bz, 0.88, [mSrbBell]);

    // B. Flared Conical White SRB Aft Skirt (y = 1.38 -> 3.35, rTop = 0.82 -> rBot = 1.18)
    const hSkirt = ySkirtTop - yNozTop;
    g.add(mesh(new THREE.CylinderGeometry(R_STS_SRB, 1.18, hSkirt, 48), srbWhiteMat, bx, yNozTop + hSkirt * 0.5, bz));
    // Dark reddish-brown / black horizontal band around the middle of the flared aft skirt (y = 2.42, visible in photo!)
    g.add(mesh(new THREE.CylinderGeometry(1.01, 1.03, 0.14, 48), etDarkOrangeMat, bx, 2.42, bz));
    g.add(mesh(new THREE.CylinderGeometry(1.19, 1.19, 0.09, 48), srbNozzleGreyMat, bx, yNozTop + 0.05, bz));

    // C. Main Segmented White SRB Cylinder (y = 3.35 -> 23.60, r = R_STS_SRB = 0.82)
    const hCyl = ySrbCylTop - ySkirtTop;
    g.add(mesh(new THREE.CylinderGeometry(R_STS_SRB, R_STS_SRB, hCyl, 48), srbWhiteMat, bx, ySkirtTop + hCyl * 0.5, bz));

    // 3 Iconic Golden-Yellow Structural Stiffener Rings near the base of the SRB barrel (y = 3.72, 4.46, 5.20, matching photo!)
    for (const yGold of [3.72, 4.46, 5.20]) {
      g.add(mesh(new THREE.CylinderGeometry(R_STS_SRB + 0.042, R_STS_SRB + 0.042, 0.16, 48), srbYellowRingMat, bx, yGold, bz));
      g.add(mesh(new THREE.CylinderGeometry(R_STS_SRB + 0.048, R_STS_SRB + 0.048, 0.04, 48), etDarkOrangeMat, bx, yGold - 0.07, bz));
    }

    // Raised white external system cable tunnel running up the front-inner face of each SRB
    const tunX = bx - sgn * 0.16;
    const tunZ = bz + R_STS_SRB + 0.02;
    g.add(mesh(new THREE.BoxGeometry(0.11, hCyl, 0.09), srbWhiteMat, tunX, ySkirtTop + hCyl * 0.5, tunZ));

    // Crisp Dark-Grey / Black Circumferential Field-Joint Bands along the white SRB cylinder (matching reference photo!)
    for (const yJoint of [6.20, 9.15, 12.10, 15.05, 18.00, 20.95, 22.95]) {
      g.add(mesh(new THREE.CylinderGeometry(R_STS_SRB + 0.016, R_STS_SRB + 0.016, 0.11, 48), blackTileMat, bx, yJoint, bz));
    }
    // Subtle light-grey intermediate structural rings between field joints
    for (const ySub of [7.68, 10.62, 13.58, 16.52, 19.48, 22.10]) {
      g.add(mesh(new THREE.CylinderGeometry(R_STS_SRB + 0.012, R_STS_SRB + 0.012, 0.07, 48), srbNozzleGreyMat, bx, ySub, bz));
    }

    // Lower SRB-to-ET Attachment Ring & Struts (y = 5.85)
    g.add(mesh(new THREE.CylinderGeometry(R_STS_SRB + 0.035, R_STS_SRB + 0.035, 0.22, 48), ssmeDarkMat, bx, 5.85, bz));
    g.add(mesh(new THREE.BoxGeometry(0.95, 0.28, 0.36), ssmeDarkMat, sgn * (R_STS_ET + 0.35), 5.85, bz));
    // Upper SRB-to-ET Forward Attachment Strut at the Intertank level (y = 22.95)
    g.add(mesh(new THREE.BoxGeometry(0.95, 0.24, 0.28), ssmeDarkMat, sgn * (R_STS_ET + 0.35), 22.95, bz));

    // D. Pointed White SRB Ogive Nose Cone (y = 23.60 -> 26.85) with Black Collar & Orange Patch!
    const srbConePts = [];
    const nCone = 28;
    for (let i = 0; i <= nCone; i++) {
      const t = i / nCone;
      const r = 0.04 + (R_STS_SRB - 0.04) * Math.pow(1 - Math.pow(t, 1.32), 0.76);
      srbConePts.push(new THREE.Vector2(r, ySrbCylTop + t * (ySrbTip - ySrbCylTop)));
    }
    const srbCone = mesh(new THREE.LatheGeometry(srbConePts, 48), srbWhiteMat);
    srbCone.position.set(bx, 0, bz);
    g.add(srbCone);
    g.add(mesh(new THREE.SphereGeometry(0.042, 16, 12), srbNozzleGreyMat, bx, ySrbTip, bz));

    // Bold Black Collar Ring near the base of the SRB nose cone (y = 23.85 -> 24.16) +
    // Bright Orange Rectangular Marking on the front face (super distinct in the reference image!)
    g.add(mesh(new THREE.CylinderGeometry(0.76, 0.80, 0.28, 48), blackTileMat, bx, 24.00, bz));
    g.add(mesh(new THREE.BoxGeometry(0.32, 0.26, 0.06), etOrangeMat, bx - sgn * 0.06, 24.00, bz + 0.77));

    // Small dark separation motor / vent dots near the top of the SRB nose cone (y = 25.85)
    g.add(mesh(new THREE.BoxGeometry(0.08, 0.14, 0.05), blackTileMat, bx - sgn * 0.12, 25.85, bz + 0.36));
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.10, 0.05), blackTileMat, bx + sgn * 0.14, 26.05, bz + 0.28));
  }

  // =========================================================================
  // 3. LAUNCH EXHAUST PLUMES FOR THE ORBITER'S 3× RS-25 (SSME) MAIN ENGINES
  //    So both the 2 SRBs and the 3 Orbiter SSMEs ignite simultaneously at liftoff!
  // =========================================================================
  for (const [sx, sy, sz] of [
    [0.0, 2.25, 3.22],
    [-0.70, 1.95, 2.46],
    [0.70, 1.95, 2.46],
  ]) {
    const mSsme = bellMaterial(true);
    const nNode = new THREE.Object3D();
    nNode.position.set(sx, sy, sz);
    nNode.userData.r = 0.56;
    nNode.userData.style = 'default';
    g.add(nNode);
    if (!g.userData.nozzles) g.userData.nozzles = [];
    g.userData.nozzles.push(nNode);
    if (!g.userData.bellMats) g.userData.bellMats = [];
    g.userData.bellMats.push(mSsme);
  }

  return g;
}

// =========================================================================
// RUSSIAN PROTON-M / BRIZ-M ("ПРОТОН-М") HEAVY-LIFT LAUNCH VEHICLE
// Authentic replica matching reference image:
// - Stage 4 (protonFairing): Glossy White Briz-M Payload Fairing with light-grey
//   ribbed lower adapter skirt, longitudinal row of grey separation latch blocks
//   along the barrel & conical nose, bold navy-blue "eesa" (ESA) logo, and the
//   ExoMars European flag-stripe + dark planetary horizon mission patch.
// - Stage 3 (protonStage3): White Third Stage cylinder with upper & lower vertically
//   ribbed collars, Roscosmos ("РОСКОСМОС") red-swoosh emblem, Russian Tricolor Flag,
//   2 signature dark-grey U-shaped recessed umbilical cutouts, and external cable ducts.
// - Stage 2 (protonStage2): Glossy White Second Stage barrel featuring bold red
//   vertical Cyrillic "ПРОТОН•М" lettering, navy "ХРУНИЧЕВ" lower collar text,
//   external longitudinal cable raceway with black tip, and the iconic Open Silver
//   Diagonal Lattice Truss Interstage revealing the dark-green internal tank dome!
// - Stage 1 (protonStage1): Exposed Central Light-Grey Vertically Ribbed Core Tank
//   with a matte-black conical bottom tail cap, surrounded by 6 Cylindrical White
//   Strap-On Propellant Tanks — each with a slanted pointed conical top, red stencil
//   marks, a bold matte-black lower band, white aerodynamic engine fairing scoops
//   with twin silver turbopump pods, and 6 dark-grey RD-275M engine nozzles.
// =========================================================================
const R_PROTON_CORE = 1.04;  // Stage 2 & Stage 3 radius
const R_PROTON_FAIR = 1.08;  // Payload fairing radius
const R_PROTON_S1_IN = 0.98; // Stage 1 exposed light-grey central core radius
const R_PROTON_TANK = 0.39;  // Radius of each of the 6 Stage 1 outer white tanks
const R_PROTON_RING = 1.32;  // Radial distance of the 6 Stage 1 outer white tanks

let _protonMats = null;
function getProtonMaterials() {
  if (_protonMats) return _protonMats;
  const panel = TX.panelTextures();

  // Crisp glossy white for Proton-M stages, payload fairing & 6 outer tanks
  const whiteMat = physical({
    color: 0xe4e7ec,
    roughness: 0.36,
    metalness: 0.06,
    clearcoat: 0.32,
    clearcoatRoughness: 0.24,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.24, 0.24),
  });

  // Light metallic silver-grey for the exposed Stage 1 central ribbed core, fairing adapter & lattice struts
  const coreGreyMat = physical({
    color: 0x9ea5b0,
    roughness: 0.44,
    metalness: 0.38,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.32, 0.32),
  });

  // Bright silver-white for the open diagonal lattice interstage struts & turbopump pods
  const strutSilverMat = physical({
    color: 0xd0d5de,
    roughness: 0.34,
    metalness: 0.52,
  });

  // Matte-black for the 6 outer tank lower bands & central bottom tail cone
  const blackBandMat = physical({
    color: 0x17191e,
    roughness: 0.64,
    metalness: 0.14,
  });

  // Dark gunmetal-grey for the 6 RD-275M nozzles & Stage 3 U-shaped recessed cutouts
  const nozzleGreyMat = physical({
    color: 0x444852,
    roughness: 0.48,
    metalness: 0.62,
  });

  // Deep olive-green / dark green for the recessed tank dome visible inside the Stage 2 lattice interstage!
  const internalGreenMat = physical({
    color: 0x1e3322,
    roughness: 0.68,
    metalness: 0.22,
  });

  // Crimson red for the small maintenance stencil marks on the 6 white outer tanks
  const redStencilMat = physical({
    color: 0xc92222,
    roughness: 0.45,
    metalness: 0.08,
  });

  function makeProcTex(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }

  // 1. Fairing Decal: Navy-Blue "eesa" (ESA) Logo + ExoMars Flag-Stripe & Dark Planetary Horizon Patch
  const fairingDecalTex = makeProcTex(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#e4e7ec';
    ctx.fillRect(0, 0, w, h);

    // Draw on front (+Z) and back (-Z)
    for (const cx of [w * 0.50, 0, w]) {
      ctx.save();
      ctx.translate(cx, h * 0.48);
      // Rotate -90 deg so "eesa" reads vertically along the fairing barrel just like in the reference image!
      ctx.rotate(-Math.PI * 0.5);

      // A. Navy-Blue ESA Logo ("e" circle with white dot + bold "esa" lettering)
      const esaY = -58;
      ctx.fillStyle = '#003399';
      ctx.beginPath();
      ctx.arc(-112, esaY, 34, 0, Math.PI * 2);
      ctx.fill();
      // White stylized 'e' cutout inside the blue circle
      ctx.strokeStyle = '#e4e7ec';
      ctx.lineWidth = 6.5;
      ctx.beginPath();
      ctx.arc(-112, esaY, 17, 0.25, Math.PI * 1.82);
      ctx.stroke();
      ctx.fillStyle = '#e4e7ec';
      ctx.fillRect(-112, esaY - 3, 22, 6);
      // White orbital dot on the left rim of the 'e' circle
      ctx.beginPath();
      ctx.arc(-144, esaY - 6, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Bold "esa" text
      ctx.fillStyle = '#003399';
      ctx.font = '900 76px "Arial Black", "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('esa', -68, esaY + 2);

      // B. ExoMars Flag-Stripe & Dark Planetary Horizon Mission Patch directly below "esa"
      const patchY = 12;
      // Left colorful European / Russian mission stripes (blue, white, red, cyan)
      ctx.fillStyle = '#0055b8';
      ctx.fillRect(-146, patchY, 48, 22);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-146, patchY + 22, 48, 14);
      ctx.fillStyle = '#d52b1e';
      ctx.fillRect(-146, patchY + 36, 48, 20);

      // Right dark space rectangular patch with Mars/Earth horizon curve
      ctx.fillStyle = '#12161f';
      ctx.fillRect(-94, patchY, 178, 56);
      // Subtle glowing orange/gold planetary horizon arc inside the dark patch
      ctx.strokeStyle = '#d97724';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(-5, patchY + 82, 68, -Math.PI * 0.78, -Math.PI * 0.22);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EXOMARS', -5, patchY + 22);

      ctx.restore();
    }
  });
  const fairingDecalMat = physical({
    map: fairingDecalTex,
    roughness: 0.36,
    metalness: 0.06,
    clearcoat: 0.32,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  // 2. Stage 3 Decal: Roscosmos ("РОСКОСМОС") Emblem + Russian Tricolor Flag + Dark U-Shaped Cutouts
  const stage3DecalTex = makeProcTex(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#e4e7ec';
    ctx.fillRect(0, 0, w, h);

    for (const cx of [w * 0.50, 0, w]) {
      // A. Upper Roscosmos Emblem (rotated -90 deg to match rocket axis)
      ctx.save();
      ctx.translate(cx, h * 0.32);
      ctx.rotate(-Math.PI * 0.5);
      // Grey outer orbital ring
      ctx.strokeStyle = '#7a828e';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, -14, 42, 0, Math.PI * 2);
      ctx.stroke();
      // Red Roscosmos chevron arrow swooping up
      ctx.fillStyle = '#d52b1e';
      ctx.beginPath();
      ctx.moveTo(-24, 8);
      ctx.lineTo(26, -14);
      ctx.lineTo(-24, -36);
      ctx.lineTo(-10, -14);
      ctx.closePath();
      ctx.fill();
      // Cyrillic "РОСКОСМОС" text
      ctx.fillStyle = '#222832';
      ctx.font = '700 16px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('РОСКОСМОС', 0, 44);
      ctx.restore();

      // B. Lower Russian Tricolor Flag (White / Blue / Red) near the bottom of Stage 3
      ctx.save();
      ctx.translate(cx - 56, h * 0.78);
      ctx.rotate(-Math.PI * 0.5);
      const fw = 54, fh = 92;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-fw * 0.5, -fh * 0.5, fw, fh / 3);
      ctx.fillStyle = '#0039a6';
      ctx.fillRect(-fw * 0.5, -fh * 0.5 + fh / 3, fw, fh / 3);
      ctx.fillStyle = '#d52b1e';
      ctx.fillRect(-fw * 0.5, -fh * 0.5 + (2 * fh) / 3, fw, fh / 3);
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-fw * 0.5, -fh * 0.5, fw, fh);
      ctx.restore();

      // C. 2 Signature Dark-Grey U-Shaped / Horseshoe Recessed Cutouts on Stage 3 (matching photo!)
      for (const [ux, uy] of [[cx + 12, h * 0.74], [cx + 118, h * 0.74]]) {
        ctx.save();
        ctx.translate(ux, uy);
        ctx.fillStyle = '#3d424b';
        ctx.beginPath();
        ctx.roundRect(-24, -42, 48, 84, [22, 22, 4, 4]);
        ctx.fill();
        ctx.fillStyle = '#e4e7ec';
        ctx.fillRect(-10, -16, 20, 58);
        ctx.restore();
      }
    }
  });
  const stage3DecalMat = physical({
    map: stage3DecalTex,
    roughness: 0.36,
    metalness: 0.06,
    clearcoat: 0.32,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  // 3. Stage 2 Decal: Bold Red Vertical Cyrillic "ПРОТОН•М" + Lower Collar "ХРУНИЧЕВ"
  const stage2DecalTex = makeProcTex(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#e4e7ec';
    ctx.fillRect(0, 0, w, h);

    // Subtle circumferential panel seam lines
    ctx.strokeStyle = 'rgba(90, 98, 110, 0.35)';
    ctx.lineWidth = 3;
    for (const sy of [120, 440, 760, 910]) {
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }

    for (const cx of [w * 0.50, 0, w]) {
      // A. Bold Red Vertical Cyrillic "ПРОТОН•М" reading from top-to-bottom along Stage 2 (matching photo!)
      ctx.save();
      ctx.translate(cx - 38, h * 0.45);
      ctx.rotate(Math.PI * 0.5);
      ctx.fillStyle = '#d91c1c';
      ctx.font = '900 88px "Arial Black", "Impact", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('П Р О Т О Н • М', 0, 0);
      ctx.restore();

      // B. Lower Collar Navy-Blue Cyrillic "ХРУНИЧЕВ" right above the open lattice interstage
      ctx.save();
      ctx.translate(cx, h * 0.945);
      ctx.fillStyle = '#14326e';
      ctx.font = '800 32px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Х Р У Н И Ч Е В', 0, 0);
      ctx.restore();
    }
  });
  const stage2DecalMat = physical({
    map: stage2DecalTex,
    roughness: 0.36,
    metalness: 0.06,
    clearcoat: 0.32,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  _protonMats = {
    whiteMat,
    coreGreyMat,
    strutSilverMat,
    blackBandMat,
    nozzleGreyMat,
    internalGreenMat,
    redStencilMat,
    fairingDecalMat,
    stage3DecalMat,
    stage2DecalMat,
  };
  return _protonMats;
}

// Stage 4 (Top): Proton-M / Briz-M Payload Fairing with ESA ExoMars Decal,
// Light-Grey Ribbed Adapter Skirt & Longitudinal Separation Latch Blocks (H = 9.0m)
function buildProtonFairing() {
  const g = new THREE.Group();
  const H = PARTS.protonFairing.height; // 9.0
  const {
    whiteMat,
    coreGreyMat,
    nozzleGreyMat,
    fairingDecalMat,
  } = getProtonMaterials();

  const ySkirtTop = 0.78;
  const yCylTop = 5.10;
  const yConeTop = 8.65;

  // 1. Lower Light-Grey Vertically Ribbed Adapter Skirt (y = 0.0 -> 0.78, rBot = 1.04 -> rTop = 1.08)
  g.add(mesh(new THREE.CylinderGeometry(R_PROTON_FAIR, R_PROTON_CORE, ySkirtTop, 64), coreGreyMat, 0, ySkirtTop * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_PROTON_CORE + 0.015, R_PROTON_CORE + 0.015, 0.06, 64), coreGreyMat, 0, 0.04, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_PROTON_FAIR + 0.014, R_PROTON_FAIR + 0.014, 0.06, 64), coreGreyMat, 0, ySkirtTop, 0));

  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2;
    const rm = (R_PROTON_CORE + R_PROTON_FAIR) * 0.5 + 0.008;
    const rib = mesh(new THREE.BoxGeometry(0.028, ySkirtTop - 0.08, 0.022), coreGreyMat, Math.sin(a) * rm, ySkirtTop * 0.5, Math.cos(a) * rm);
    rib.rotation.y = a;
    g.add(rib);
  }

  // 2. Cylindrical Glossy White Payload Fairing Barrel (y = 0.78 -> 5.10, r = R_PROTON_FAIR = 1.08)
  const hCyl = yCylTop - ySkirtTop;
  g.add(mesh(new THREE.CylinderGeometry(R_PROTON_FAIR, R_PROTON_FAIR, hCyl, 64), whiteMat, 0, ySkirtTop + hCyl * 0.5, 0));

  // Conformal ESA + ExoMars Decal Wrap on the Upper Fairing Barrel (y = 2.65 -> 5.05)
  const hDec = 2.40;
  g.add(mesh(new THREE.CylinderGeometry(R_PROTON_FAIR + 0.006, R_PROTON_FAIR + 0.006, hDec, 64, 1, true), fairingDecalMat, 0, 3.85, 0));

  // Subtle grey circumferential seam rings on the fairing cylinder
  for (const ry of [2.65, yCylTop - 0.03]) {
    g.add(mesh(new THREE.CylinderGeometry(R_PROTON_FAIR + 0.010, R_PROTON_FAIR + 0.010, 0.04, 64), coreGreyMat, 0, ry, 0));
  }

  // Longitudinal rows of small grey separation latch blocks along the fairing barrel (visible in photo!)
  for (const la of [-0.42, 0.78, Math.PI - 0.42, Math.PI + 0.78]) {
    for (let ly = 1.10; ly < yCylTop - 0.15; ly += 0.42) {
      const lx = Math.sin(la) * (R_PROTON_FAIR + 0.012);
      const lz = Math.cos(la) * (R_PROTON_FAIR + 0.012);
      const latch = mesh(new THREE.BoxGeometry(0.06, 0.14, 0.04), coreGreyMat, lx, ly, lz);
      latch.rotation.y = la;
      g.add(latch);
    }
  }

  // 3. Conical White Fairing Nose Cone (y = 5.10 -> 8.65) + Rounded Nose Tip Cap (y = 8.65 -> 9.00)
  const hCone = yConeTop - yCylTop;
  const rTipBase = 0.17;
  g.add(mesh(new THREE.CylinderGeometry(rTipBase, R_PROTON_FAIR, hCone, 64), whiteMat, 0, yCylTop + hCone * 0.5, 0));

  // Rounded aerodynamic nose tip cap (y = 8.65 -> 9.00)
  const tipPts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const r = rTipBase * Math.sqrt(Math.max(0, 1 - t * t));
    tipPts.push(new THREE.Vector2(r, yConeTop + t * (H - yConeTop)));
  }
  g.add(mesh(new THREE.LatheGeometry(tipPts, 36), whiteMat));

  // Longitudinal rows of small grey separation latch tabs climbing up the conical nose cone (matching photo!)
  const coneSlope = Math.atan2(R_PROTON_FAIR - rTipBase, hCone);
  for (const la of [-0.42, 0.78, Math.PI - 0.42, Math.PI + 0.78]) {
    for (let s = 0; s < 9; s++) {
      const t = (s + 0.5) / 9;
      const ly = yCylTop + t * hCone;
      const lr = R_PROTON_FAIR + (rTipBase - R_PROTON_FAIR) * t + 0.010;
      const latch = mesh(new THREE.BoxGeometry(0.055, 0.14, 0.035), coreGreyMat, Math.sin(la) * lr, ly, Math.cos(la) * lr);
      latch.rotation.y = la;
      latch.rotation.x = -coneSlope;
      g.add(latch);
    }
  }

  // Recessed Briz-M orbital propulsion bell & recovery parachutes
  g.add(mesh(new THREE.CylinderGeometry(R_PROTON_CORE * 0.86, R_PROTON_CORE * 0.86, 0.14, 40), nozzleGreyMat, 0, 0.07, 0));
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.16, 0.36, 0.50, 28), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.36, [mBell]);
  addParachutes(g, 8.2);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 3: Proton-M Third Stage with Roscosmos Emblem, Russian Flag,
// Ribbed Collars, 2 Dark U-Shaped Recessed Cutouts & External Cable Fairings (H = 5.4m)
function buildProtonStage3() {
  const g = new THREE.Group();
  const H = PARTS.protonStage3.height; // 5.4
  const {
    whiteMat,
    coreGreyMat,
    nozzleGreyMat,
    stage3DecalMat,
  } = getProtonMaterials();

  // 1. Main Cylindrical White Third Stage Body (y = 0.0 -> 5.40, r = R_PROTON_CORE = 1.04)
  g.add(mesh(new THREE.CylinderGeometry(R_PROTON_CORE, R_PROTON_CORE, H, 64), whiteMat, 0, H * 0.5, 0));

  // Conformal Stage 3 Decal Wrap (Roscosmos logo + Russian Flag + 2 dark U-shaped cutouts, y = 0.65 -> 4.65)
  g.add(mesh(new THREE.CylinderGeometry(R_PROTON_CORE + 0.006, R_PROTON_CORE + 0.006, 4.00, 64, 1, true), stage3DecalMat, 0, 2.65, 0));

  // Circumferential structural seam rings
  for (const ry of [0.05, 0.72, 2.75, 4.68, H - 0.05]) {
    g.add(mesh(new THREE.CylinderGeometry(R_PROTON_CORE + 0.012, R_PROTON_CORE + 0.012, 0.05, 64), coreGreyMat, 0, ry, 0));
  }

  // Fine vertical stringer ribs on the lower collar (y = 0.05 -> 0.72) and upper collar (y = 4.68 -> 5.35)
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const rx = Math.sin(a) * (R_PROTON_CORE + 0.008);
    const rz = Math.cos(a) * (R_PROTON_CORE + 0.008);
    const ribBot = mesh(new THREE.BoxGeometry(0.026, 0.62, 0.018), whiteMat, rx, 0.38, rz);
    ribBot.rotation.y = a;
    g.add(ribBot);
    const ribTop = mesh(new THREE.BoxGeometry(0.026, 0.62, 0.018), whiteMat, rx, 5.02, rz);
    ribTop.rotation.y = a;
    g.add(ribTop);
  }

  // Protruding white external cable/umbilical fairings on the lower half of Stage 3 (visible in reference photo!)
  for (const fa of [-0.72, 0.85, Math.PI - 0.72, Math.PI + 0.85]) {
    const fx = Math.sin(fa) * (R_PROTON_CORE + 0.035);
    const fz = Math.cos(fa) * (R_PROTON_CORE + 0.035);
    const duct = mesh(new THREE.BoxGeometry(0.14, 1.95, 0.09), whiteMat, fx, 1.02, fz);
    duct.rotation.y = fa;
    g.add(duct);
    // Conical top cap on each external cable fairing
    const cap = mesh(new THREE.CylinderGeometry(0.01, 0.065, 0.24, 12), coreGreyMat, fx, 2.10, fz);
    cap.rotation.y = fa;
    g.add(cap);
  }

  // Stage 3 RD-0210 / RD-0212 Main Engine Bell + 4 Vernier Nozzles
  g.add(mesh(new THREE.CylinderGeometry(R_PROTON_CORE * 0.88, R_PROTON_CORE * 0.88, 0.14, 40), nozzleGreyMat, 0, 0.07, 0));
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.22, 0.44, 0.62, 28), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.44, [mBell]);
  for (let v = 0; v < 4; v++) {
    const va = (v * Math.PI) / 2 + Math.PI / 4;
    g.add(mesh(bellGeometry(0.06, 0.12, 0.32, 16), nozzleGreyMat, Math.cos(va) * 0.72, 0, Math.sin(va) * 0.72));
  }
  addParachutes(g, H * 0.85);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 2: Proton-M Second Stage with Bold Red Vertical "ПРОТОН•М" Lettering,
// "ХРУНИЧЕВ" Collar & Iconic Open Diagonal Lattice Truss Interstage (H = 9.8m)
function buildProtonStage2() {
  const g = new THREE.Group();
  const H = PARTS.protonStage2.height; // 9.8
  const {
    whiteMat,
    coreGreyMat,
    strutSilverMat,
    blackBandMat,
    nozzleGreyMat,
    internalGreenMat,
    stage2DecalMat,
  } = getProtonMaterials();

  const yTrussTop = 2.12;

  // =========================================================================
  // 1. OPEN SILVER DIAGONAL LATTICE TRUSS INTERSTAGE (y = 0.0 -> 2.12, r = 1.04)
  //    With recessed dark-green internal fuel tank dome & engine plumbing inside!
  // =========================================================================
  // Recessed dark-green internal cylinder & rounded fuel tank dome inside the open truss (matching photo!)
  g.add(mesh(new THREE.CylinderGeometry(0.86, 0.88, yTrussTop - 0.10, 40), internalGreenMat, 0, yTrussTop * 0.5, 0));
  const dome = mesh(new THREE.SphereGeometry(0.90, 36, 20), internalGreenMat, 0, yTrussTop - 0.15, 0);
  dome.scale.set(1.0, 0.48, 1.0);
  g.add(dome);

  // Horizontal structural rings framing the 2-tier open lattice interstage (bottom, middle, top)
  for (const ry of [0.06, 1.08, yTrussTop - 0.04]) {
    g.add(mesh(new THREE.TorusGeometry(R_PROTON_CORE - 0.01, 0.036, 12, 56).rotateX(Math.PI * 0.5), strutSilverMat, 0, ry, 0));
  }

  // 2 Tiers × 18 Pairs of Crisscross Silver-White Diagonal Tubular Lattice Struts!
  const nBays = 18;
  const rTruss = R_PROTON_CORE - 0.012;
  const dTheta = (Math.PI * 2) / nBays;
  for (const [y0, y1] of [[0.06, 1.08], [1.08, yTrussTop - 0.04]]) {
    const dy = y1 - y0;
    const ym = (y0 + y1) * 0.5;
    const chord = 2 * rTruss * Math.sin(dTheta * 0.5);
    const strutLen = Math.hypot(chord, dy) * 1.04;
    const tilt = Math.atan2(chord, dy);

    for (let i = 0; i < nBays; i++) {
      const aMid = (i + 0.5) * dTheta;
      const sx = Math.sin(aMid) * rTruss;
      const sz = Math.cos(aMid) * rTruss;

      for (const sgn of [-1, 1]) {
        const s = mesh(new THREE.CylinderGeometry(0.024, 0.024, strutLen, 8), strutSilverMat, sx, ym, sz);
        s.rotation.order = 'YXZ';
        s.rotation.y = aMid;
        s.rotation.z = sgn * tilt;
        g.add(s);
      }
    }
  }

  // =========================================================================
  // 2. MAIN GLOSSY WHITE SECOND STAGE CYLINDER (y = 2.12 -> 9.80, r = 1.04)
  //    Featuring Bold Red Vertical "ПРОТОН•М" & Lower Collar "ХРУНИЧЕВ"
  // =========================================================================
  const hWhite = H - yTrussTop;
  g.add(mesh(new THREE.CylinderGeometry(R_PROTON_CORE, R_PROTON_CORE, hWhite, 64), whiteMat, 0, yTrussTop + hWhite * 0.5, 0));

  // Conformal Full-Height Stage 2 Decal ("ПРОТОН•М" + "ХРУНИЧЕВ", y = 2.14 -> 9.76)
  g.add(mesh(new THREE.CylinderGeometry(R_PROTON_CORE + 0.006, R_PROTON_CORE + 0.006, hWhite - 0.04, 64, 1, true), stage2DecalMat, 0, yTrussTop + hWhite * 0.5, 0));

  // Raised white structural seam rings along Stage 2
  for (const ry of [yTrussTop + 0.03, 2.68, 5.05, 7.42, H - 0.04]) {
    g.add(mesh(new THREE.CylinderGeometry(R_PROTON_CORE + 0.012, R_PROTON_CORE + 0.012, 0.05, 64), coreGreyMat, 0, ry, 0));
  }

  // External longitudinal cable raceway conduit running along the side of Stage 2 with a black lower tip (visible in photo!)
  for (const ca of [-0.72, Math.PI - 0.72]) {
    const cx = Math.sin(ca) * (R_PROTON_CORE + 0.035);
    const cz = Math.cos(ca) * (R_PROTON_CORE + 0.035);
    const cond = mesh(new THREE.BoxGeometry(0.11, hWhite - 0.45, 0.08), whiteMat, cx, yTrussTop + 0.25 + (hWhite - 0.45) * 0.5, cz);
    cond.rotation.y = ca;
    g.add(cond);
    // Matte-black rounded lower fairing tip at y = 2.45 (clearly visible on the lower edge of Stage 2 in the photo!)
    const blkTip = mesh(new THREE.BoxGeometry(0.12, 0.36, 0.09), blackBandMat, cx, yTrussTop + 0.32, cz);
    blkTip.rotation.y = ca;
    g.add(blkTip);
  }

  // 3. Four Clustered RD-0210 Second Stage Engine Nozzles
  for (const [nx, nz] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) {
    const mBell = bellMaterial(false);
    g.add(mesh(bellGeometry(0.16, 0.32, 0.55, 24), nozzleGreyMat, nx, 0, nz));
    addNozzle(g, nx, nz, 0.32, [mBell]);
  }
  addParachutes(g, H * 0.88);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 1 (Bottom): Proton-M First Stage — Exposed Light-Grey Vertically Ribbed Central Core
// with Matte-Black Conical Bottom Cap, Surrounded by 6 Cylindrical White Strap-On Fuel Tanks
// with Slanted Conical Tops, Matte-Black Lower Bands, White Engine Fairing Scoops & 6× RD-275M Nozzles (H = 12.2m)
function buildProtonStage1() {
  const g = new THREE.Group();
  const H = PARTS.protonStage1.height; // 12.2
  const {
    whiteMat,
    coreGreyMat,
    strutSilverMat,
    blackBandMat,
    nozzleGreyMat,
    redStencilMat,
  } = getProtonMaterials();

  const yNozTop = 0.82;
  const yBlackBot = 1.12;
  const yBlackTop = 2.12;
  const yTankCylTop = 9.85;
  const yConeTop = 12.14;

  // =========================================================================
  // 1. EXPOSED LIGHT-GREY VERTICALLY RIBBED CENTRAL CORE TANK
  //    (x = 0, z = 0, r = R_PROTON_S1_IN = 0.98, y = 0.95 -> 12.20)
  // =========================================================================
  const hCore = H - 0.95;
  g.add(mesh(new THREE.CylinderGeometry(R_PROTON_S1_IN, R_PROTON_S1_IN, hCore, 64), coreGreyMat, 0, 0.95 + hCore * 0.5, 0));

  // 64 vertical corrugation stringer ribs along the light-grey central core tank (visible between the 6 white tanks!)
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const rx = Math.sin(a) * (R_PROTON_S1_IN + 0.010);
    const rz = Math.cos(a) * (R_PROTON_S1_IN + 0.010);
    const rib = mesh(new THREE.BoxGeometry(0.032, hCore - 0.12, 0.024), coreGreyMat, rx, 0.95 + hCore * 0.5, rz);
    rib.rotation.y = a;
    g.add(rib);
  }

  // Horizontal structural ring frames around the light-grey central core tank
  for (const ry of [1.15, 3.35, 5.55, 7.75, 9.85, H - 0.06]) {
    g.add(mesh(new THREE.CylinderGeometry(R_PROTON_S1_IN + 0.024, R_PROTON_S1_IN + 0.024, 0.08, 64), strutSilverMat, 0, ry, 0));
  }

  // Iconic Matte-Black Conical Aerodynamic Tail Cone at the bottom center of the core between the 6 engines (y = 0.22 -> 0.98, visible in photo!)
  g.add(mesh(new THREE.CylinderGeometry(R_PROTON_S1_IN * 0.72, 0.12, 0.76, 36), blackBandMat, 0, 0.60, 0));
  g.add(mesh(new THREE.SphereGeometry(0.125, 16, 12), blackBandMat, 0, 0.22, 0));

  // =========================================================================
  // 2. 6× CYLINDRICAL WHITE STRAP-ON PROPELLANT TANKS AROUND THE GREY CORE
  //    (r = R_PROTON_TANK = 0.39, radial ring R_PROTON_RING = 1.32)
  // =========================================================================
  for (let k = 0; k < 6; k++) {
    // Offset by 18 deg so the wide gap between the front tanks exposes the ribbed grey central core clearly!
    const a = (k / 6) * Math.PI * 2 + 0.32;
    const tx = Math.sin(a) * R_PROTON_RING;
    const tz = Math.cos(a) * R_PROTON_RING;

    // A. RD-275M Gimbaled Dark-Grey Engine Bell Nozzle at the bottom of each tank (y = 0.0 -> 0.82)
    const mBell = bellMaterial(true);
    g.add(mesh(bellGeometry(0.18, 0.35, yNozTop, 28), nozzleGreyMat, tx, 0, tz));
    g.add(mesh(new THREE.CylinderGeometry(0.24, 0.20, 0.36, 24), nozzleGreyMat, tx, yNozTop + 0.14, tz));
    addNozzle(g, tx, tz, 0.35, [mBell]);

    // B. Sculpted White Aerodynamic Outer Engine Fairing Scoop (y = 0.52 -> 1.15) with Twin Silver Turbopump Pods!
    const rOutScoop = R_PROTON_RING + 0.12;
    const sx = Math.sin(a) * rOutScoop;
    const sz = Math.cos(a) * rOutScoop;
    const scoop = mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.64, 24, 1, false, -Math.PI * 0.55, Math.PI * 1.10), whiteMat, sx, 0.84, sz);
    scoop.rotation.y = a;
    g.add(scoop);
    // Flat white bottom lip of the engine scoop + 2 silver cylindrical vernier/turbopump housings inside the scoop (matching photo!)
    for (const side of [-1, 1]) {
      const pa = a + side * 0.19;
      const pr = R_PROTON_RING + 0.16;
      g.add(mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.42, 16), strutSilverMat, Math.sin(pa) * pr, 0.72, Math.cos(pa) * pr));
    }

    // C. Bold Matte-Black Cylindrical Lower Band on every white side tank (y = 1.12 -> 2.12, super iconic in photo!)
    const hBlack = yBlackTop - yBlackBot;
    g.add(mesh(new THREE.CylinderGeometry(R_PROTON_TANK + 0.006, R_PROTON_TANK + 0.006, hBlack, 36), blackBandMat, tx, yBlackBot + hBlack * 0.5, tz));
    // Crisp white lower ring below the black band (y = 1.00 -> 1.14)
    g.add(mesh(new THREE.CylinderGeometry(R_PROTON_TANK + 0.008, R_PROTON_TANK + 0.012, 0.14, 36), whiteMat, tx, 1.06, tz));

    // D. Main Glossy White Cylindrical Side Tank Barrel (y = 2.12 -> 9.85, r = 0.39)
    const hWhiteCyl = yTankCylTop - yBlackTop;
    g.add(mesh(new THREE.CylinderGeometry(R_PROTON_TANK, R_PROTON_TANK, hWhiteCyl, 36), whiteMat, tx, yBlackTop + hWhiteCyl * 0.5, tz));

    // Subtle grey/dark circumferential seam rings along each white side tank
    for (const ry of [yBlackTop + 0.03, 4.45, 6.85, 9.38, yTankCylTop - 0.03]) {
      g.add(mesh(new THREE.CylinderGeometry(R_PROTON_TANK + 0.008, R_PROTON_TANK + 0.008, 0.045, 36), coreGreyMat, tx, ry, tz));
    }

    // Small crimson-red horizontal maintenance stencil marks near the bottom (y = 2.32) and top (y = 9.52) of each white tank (visible in photo!)
    const rOutMark = R_PROTON_RING + R_PROTON_TANK + 0.006;
    for (const my of [2.32, 9.52]) {
      const mark = mesh(new THREE.BoxGeometry(0.16, 0.055, 0.02), redStencilMat, Math.sin(a) * rOutMark, my, Math.cos(a) * rOutMark);
      mark.rotation.y = a;
      g.add(mark);
    }

    // E. Slanted Pointed White Conical Nose Cap at the top of each side tank (y = 9.85 -> 12.14)
    //    Sloping inward from (tx, tz) to meet the Stage 2 lattice interstage perimeter at r = 1.01!
    const topX = Math.sin(a) * (R_PROTON_CORE - 0.03);
    const topZ = Math.cos(a) * (R_PROTON_CORE - 0.03);
    const coneH = yConeTop - yTankCylTop;
    const coneGeo = shearedBoosterConeGeo(
      R_PROTON_TANK,
      0.035,
      tx,
      topX,
      tz,
      topZ,
      coneH,
      0.86,
      36,
      18
    );
    g.add(mesh(coneGeo, whiteMat, 0, yTankCylTop, 0));
  }

  return g;
}

// =========================================================================
// ULA DELTA IV HEAVY — TRIPLE COMMON BOOSTER CORES (CBCs), DCSS & 5m FAIRING
// Authentic replica matching reference image:
// - Stage 3 (d4hFairing): 5m White Payload Fairing with matte-black conical nose
//   tip cap, front sensor bracket below the nose cone, horizontal & vertical panel
//   seam lines, rectangular side access door outline, and black base separation band.
// - Stage 2 (d4hStage2): White Cylindrical DCSS & Interstage with 2 horizontal
//   golden-yellow foam bands near the top, front vertical white cable raceway,
//   dark circular vent ports, and RL10B-2 vacuum engine.
// - Stage 1 (d4hStage1): 3 Side-by-Side Common Booster Cores (Left, Center, Right)
//   featuring burnt-orange SOFI foam tanks with authentic liftoff hydrogen-fireball
//   dark-brown/black scorch gradient on the lower barrel, wide white center intertank
//   band framed by golden-yellow foam bands and a dark rectangular target patch,
//   2 pointed white side booster nose cones with horizontal cross-struts, twin front
//   white vertical LOX feedline & cable raceway pipes per core, conical grey-silver
//   thermal base shields, and 3 dark-bronze RS-68A main engine bells with side
//   turbopump exhaust nozzles.
// =========================================================================
const R_D4H_CORE = 1.00;  // Radius of each Common Booster Core & Stage 2
const R_D4H_FAIR = 1.02;  // Radius of the 5m Payload Fairing
const X_D4H_SIDE = 2.12;  // Left/Right CBC X offset

let _d4hMats = null;
function getD4hMaterials() {
  if (_d4hMats) return _d4hMats;
  const panel = TX.panelTextures();
  const foam = TX.foamTextures();

  // Crisp white for the 5m Payload Fairing, Stage 2, booster nose cones & external feedlines
  const whiteMat = physical({
    color: 0xe3e7ed,
    roughness: 0.42,
    metalness: 0.05,
    clearcoat: 0.25,
    clearcoatRoughness: 0.30,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.24, 0.24),
  });

  // Golden-yellow insulating foam for the Stage 2 upper collar bands & CBC intertank borders
  const yellowFoamMat = physical({
    color: 0xd4a038,
    roughness: 0.72,
    metalness: 0.05,
    normalMap: foam.normal,
    normalScale: new THREE.Vector2(0.35, 0.35),
  });

  // Warm metallic grey-silver for the conical thermal base shields under the 3 CBCs
  const baseShieldGreyMat = physical({
    color: 0x8d8c8a,
    roughness: 0.52,
    metalness: 0.38,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.30, 0.30),
  });

  // Matte-black / dark charcoal for the fairing nose tip, seam rings & pipe clamps
  const blackTipMat = physical({
    color: 0x1b1e24,
    roughness: 0.58,
    metalness: 0.18,
  });

  // Dark ablative bronze-brown for the 3 RS-68A main engine bells
  const rs68BellMat = physical({
    color: 0x3b2618,
    roughness: 0.56,
    metalness: 0.42,
  });

  // Procedural full-height CBC barrel texture (y = 2.15 -> 17.80):
  // Top white/yellow collar -> Upper burnt-orange LOX tank -> Golden-yellow band ->
  // Wide white center intertank band with dark rectangular patch -> Golden-yellow band ->
  // Main burnt-orange LH2 tank -> Liftoff hydrogen fireball dark-brown/soot-black scorch
  // gradient -> Bottom white aft skirt with dark border band!
  const cbcCanvas = document.createElement('canvas');
  cbcCanvas.width = 512;
  cbcCanvas.height = 1024;
  const ctx = cbcCanvas.getContext('2d');
  const w = cbcCanvas.width;
  const h = cbcCanvas.height;

  // Vertical gradient for the main burnt-orange SOFI foam & lower black scorch zone
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.00, '#e3e7ed'); // Top white ring
  grad.addColorStop(0.022, '#e3e7ed');
  grad.addColorStop(0.025, '#d69f34'); // Top golden-yellow foam border
  grad.addColorStop(0.052, '#c57d26');
  grad.addColorStop(0.060, '#b05f1c'); // Upper burnt-orange LOX tank
  grad.addColorStop(0.185, '#b05f1c');
  grad.addColorStop(0.195, '#d8a238'); // Upper-middle golden-yellow band
  grad.addColorStop(0.228, '#e2b850');
  grad.addColorStop(0.232, '#e3e7ed'); // Wide white center intertank band
  grad.addColorStop(0.342, '#e3e7ed');
  grad.addColorStop(0.346, '#e2b850'); // Lower-middle golden-yellow band
  grad.addColorStop(0.380, '#d69f34');
  grad.addColorStop(0.392, '#b2611d'); // Main burnt-orange LH2 tank
  grad.addColorStop(0.680, '#ab5b19');
  grad.addColorStop(0.765, '#6e3812'); // Liftoff hydrogen fireball scorch transition
  grad.addColorStop(0.840, '#2c190e'); // Deep charred dark-brown / soot-black
  grad.addColorStop(0.892, '#18120e');
  grad.addColorStop(0.900, '#d8c598'); // Thin pale-tan border above white aft skirt
  grad.addColorStop(0.910, '#2b1d14'); // Crisp dark-brown/black band at top of aft skirt
  grad.addColorStop(0.922, '#e3e7ed'); // Bottom white cylindrical aft skirt
  grad.addColorStop(1.000, '#d8dce2');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle horizontal spray-foam application rings across the orange sections
  ctx.fillStyle = 'rgba(225, 165, 70, 0.18)';
  for (const fy of [0.09, 0.13, 0.16, 0.43, 0.48, 0.53, 0.58, 0.63, 0.68]) {
    ctx.fillRect(0, h * fy, w, 5);
  }
  ctx.fillStyle = 'rgba(70, 30, 8, 0.16)';
  for (const fy of [0.11, 0.15, 0.45, 0.51, 0.56, 0.61, 0.66, 0.71]) {
    ctx.fillRect(0, h * fy, w, 4);
  }

  // Subtle seam line & rivet dots inside the wide white center intertank band (y ~ 0.232..0.342)
  ctx.strokeStyle = 'rgba(70, 78, 90, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.287);
  ctx.lineTo(w, h * 0.287);
  ctx.stroke();

  // Signature dark-olive/black rectangular system target patch on the right-front of the white intertank band (matching photo!)
  for (const cx of [w * 0.50, 0, w]) {
    const px = cx + 38;
    const py = h * 0.282;
    ctx.fillStyle = '#2d3325';
    ctx.fillRect(px - 11, py - 18, 22, 36);
    ctx.fillStyle = '#c8c4a8';
    ctx.fillRect(px - 5, py - 8, 10, 16);
  }

  // Bottom dark seam line on the white aft skirt (y ~ 0.985)
  ctx.fillStyle = '#2a221c';
  ctx.fillRect(0, h * 0.986, w, 5);

  const cbcTex = new THREE.CanvasTexture(cbcCanvas);
  cbcTex.colorSpace = THREE.SRGBColorSpace;
  cbcTex.anisotropy = 8;
  cbcTex.needsUpdate = true;

  const cbcBodyMat = physical({
    map: cbcTex,
    roughness: 0.72,
    metalness: 0.06,
    normalMap: foam.normal,
    normalScale: new THREE.Vector2(0.32, 0.32),
  });

  _d4hMats = {
    whiteMat,
    yellowFoamMat,
    baseShieldGreyMat,
    blackTipMat,
    rs68BellMat,
    cbcBodyMat,
  };
  return _d4hMats;
}

// Stage 3 (Top): Delta IV Heavy 5m White Payload Fairing with Matte-Black Conical Tip,
// Front Sensor Bracket, Seam Lines & Black Base Separation Band (H = 8.8m)
function buildD4hFairing() {
  const g = new THREE.Group();
  const H = PARTS.d4hFairing.height; // 8.8
  const {
    whiteMat,
    baseShieldGreyMat,
    blackTipMat,
  } = getD4hMaterials();

  const yCylTop = 6.42;
  const yWhiteConeTop = 8.52;

  // 1. Cylindrical Glossy White 5m Payload Fairing Barrel (y = 0.0 -> 6.42, r = R_D4H_FAIR = 1.02)
  g.add(mesh(new THREE.CylinderGeometry(R_D4H_FAIR, R_D4H_FAIR, yCylTop, 64), whiteMat, 0, yCylTop * 0.5, 0));

  // Crisp Matte-Black Base Separation Ring at the bottom of the fairing (y = 0.06) + horizontal seam rings (y = 3.35, 6.40)
  g.add(mesh(new THREE.CylinderGeometry(R_D4H_FAIR + 0.012, R_D4H_FAIR + 0.012, 0.11, 64), blackTipMat, 0, 0.06, 0));
  for (const ry of [3.35, yCylTop - 0.02]) {
    g.add(mesh(new THREE.CylinderGeometry(R_D4H_FAIR + 0.008, R_D4H_FAIR + 0.008, 0.045, 64), baseShieldGreyMat, 0, ry, 0));
  }

  // Longitudinal panel split seam line running down the front-left of the fairing barrel (angle = -0.18 rad, visible in photo!)
  const splitAng = -0.18;
  const sx = Math.sin(splitAng) * (R_D4H_FAIR + 0.006);
  const sz = Math.cos(splitAng) * (R_D4H_FAIR + 0.006);
  const vSeam = mesh(new THREE.BoxGeometry(0.028, yCylTop, 0.02), baseShieldGreyMat, sx, yCylTop * 0.5, sz);
  vSeam.rotation.y = splitAng;
  g.add(vSeam);

  // Small dark acoustic/separation bolt dots near the base of the fairing (y = 0.55, visible in photo!)
  for (const ba of [-0.52, -0.18, 0.22, 0.65]) {
    g.add(mesh(new THREE.BoxGeometry(0.07, 0.12, 0.04), blackTipMat, Math.sin(ba) * (R_D4H_FAIR + 0.01), 0.55, Math.cos(ba) * (R_D4H_FAIR + 0.01)));
  }

  // Rectangular access panel outline on the right side of the lower fairing barrel (y = 0.95, visible in photo!)
  const doorAng = 0.68;
  const doorOutline = mesh(new THREE.BoxGeometry(0.42, 0.68, 0.025), baseShieldGreyMat, Math.sin(doorAng) * (R_D4H_FAIR + 0.006), 0.95, Math.cos(doorAng) * (R_D4H_FAIR + 0.006));
  doorOutline.rotation.y = doorAng;
  g.add(doorOutline);
  const doorInner = mesh(new THREE.BoxGeometry(0.36, 0.60, 0.030), whiteMat, Math.sin(doorAng) * (R_D4H_FAIR + 0.006), 0.95, Math.cos(doorAng) * (R_D4H_FAIR + 0.006));
  doorInner.rotation.y = doorAng;
  g.add(doorInner);

  // Small protruding dark-brown/black sensor bracket right at the top shoulder of the fairing cylinder (y = 6.42, matching photo!)
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.14, 0.14), blackTipMat, Math.sin(-0.14) * (R_D4H_FAIR + 0.03), yCylTop + 0.02, Math.cos(-0.14) * (R_D4H_FAIR + 0.03)));

  // 2. Conical White Nose Cone (y = 6.42 -> 8.52) + Matte-Black Conical Nose Cap Tip (y = 8.52 -> 8.80, matching photo!)
  const hWhiteCone = yWhiteConeTop - yCylTop;
  const rBlackBase = 0.23;
  g.add(mesh(new THREE.CylinderGeometry(rBlackBase, R_D4H_FAIR, hWhiteCone, 64), whiteMat, 0, yCylTop + hWhiteCone * 0.5, 0));

  // Matte-Black Conical Nose Tip Cap (y = 8.52 -> 8.80) with a tiny silver-white tip apex
  const hBlackTip = H - yWhiteConeTop;
  g.add(mesh(new THREE.CylinderGeometry(0.035, rBlackBase, hBlackTip, 36), blackTipMat, 0, yWhiteConeTop + hBlackTip * 0.5, 0));
  g.add(mesh(new THREE.SphereGeometry(0.036, 16, 12), whiteMat, 0, H - 0.01, 0));

  // Recessed orbital thruster & recovery parachutes
  g.add(mesh(new THREE.CylinderGeometry(R_D4H_CORE * 0.86, R_D4H_CORE * 0.86, 0.14, 40), blackTipMat, 0, 0.07, 0));
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.16, 0.36, 0.50, 28), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.36, [mBell]);
  addParachutes(g, 8.0);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 2: Delta IV Heavy Cryogenic Second Stage (DCSS) & White Interstage with
// 2 Golden-Yellow Upper Foam Bands & Vertical White Cable Raceway (H = 6.4m)
function buildD4hStage2() {
  const g = new THREE.Group();
  const H = PARTS.d4hStage2.height; // 6.4
  const {
    whiteMat,
    yellowFoamMat,
    baseShieldGreyMat,
    blackTipMat,
  } = getD4hMaterials();

  // 1. Main Cylindrical White DCSS & Interstage Barrel (y = 0.0 -> 6.40, r = R_D4H_CORE = 1.00)
  g.add(mesh(new THREE.CylinderGeometry(R_D4H_CORE, R_D4H_CORE, H, 64), whiteMat, 0, H * 0.5, 0));

  // 2 Signature Horizontal Golden-Yellow Foam Bands near the top of Stage 2 (y = 5.32 & y = 5.66, matching photo!)
  g.add(mesh(new THREE.CylinderGeometry(R_D4H_CORE + 0.012, R_D4H_CORE + 0.012, 0.24, 64), yellowFoamMat, 0, 5.32, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_D4H_CORE + 0.010, R_D4H_CORE + 0.010, 0.16, 64), yellowFoamMat, 0, 5.68, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_D4H_CORE + 0.014, R_D4H_CORE + 0.014, 0.04, 64), baseShieldGreyMat, 0, 5.50, 0));

  // Subtle grey circumferential seam rings along the white Stage 2 cylinder
  for (const ry of [0.06, 2.35, 4.95, H - 0.04]) {
    g.add(mesh(new THREE.CylinderGeometry(R_D4H_CORE + 0.008, R_D4H_CORE + 0.008, 0.04, 64), baseShieldGreyMat, 0, ry, 0));
  }

  // Vertical White Cable Raceway Conduit running down the front-center of Stage 2 (angle = -0.06 rad, visible in photo!)
  const raceAng = -0.06;
  const rx = Math.sin(raceAng) * (R_D4H_CORE + 0.035);
  const rz = Math.cos(raceAng) * (R_D4H_CORE + 0.035);
  const race = mesh(new THREE.BoxGeometry(0.11, H - 0.12, 0.08), whiteMat, rx, H * 0.5, rz);
  race.rotation.y = raceAng;
  g.add(race);
  for (const cy of [0.85, 2.15, 3.45, 4.75, 5.95]) {
    const clamp = mesh(new THREE.BoxGeometry(0.15, 0.06, 0.10), baseShieldGreyMat, rx, cy, rz);
    clamp.rotation.y = raceAng;
    g.add(clamp);
  }

  // Small dark circular vent/RCS ports on the sides of the white Stage 2 barrel (y = 1.65 & y = 2.15, visible in photo!)
  for (const [va, vy] of [[-0.55, 1.55], [0.42, 2.10], [0.68, 4.55]]) {
    g.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 14).rotateX(Math.PI * 0.5), blackTipMat, Math.sin(va) * (R_D4H_CORE + 0.006), vy, Math.cos(va) * (R_D4H_CORE + 0.006)));
  }

  // Recessed RL10B-2 Vacuum Engine Bell & recovery parachutes
  g.add(mesh(new THREE.CylinderGeometry(R_D4H_CORE * 0.88, R_D4H_CORE * 0.88, 0.14, 40), blackTipMat, 0, 0.07, 0));
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.24, 0.48, 0.65, 32), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.48, [mBell]);
  addParachutes(g, H * 0.86);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 1 (Bottom): Delta IV Heavy Triple Common Booster Cores (3× CBCs: Left, Center, Right)
// with Burnt-Orange SOFI Foam, Liftoff Black Scorch Gradient, White Center Intertank Bands,
// 2 White Pointed Booster Nose Cones, Twin Front White LOX Feedlines & 3× RS-68A Engines (H = 17.8m)
function buildD4hStage1() {
  const g = new THREE.Group();
  const H = PARTS.d4hStage1.height; // 17.8
  const {
    whiteMat,
    baseShieldGreyMat,
    blackTipMat,
    rs68BellMat,
    cbcBodyMat,
  } = getD4hMaterials();

  const yNozTop = 0.85;
  const yShieldTop = 2.15;
  const yCylTop = H; // 17.80
  const hCyl = yCylTop - yShieldTop; // 15.65
  const ySideConeTop = 20.65; // Side booster nose cones extend 2.85m alongside Stage 2!

  for (const cx of [-X_D4H_SIDE, 0, X_D4H_SIDE]) {
    const isSide = cx !== 0;

    // =========================================================================
    // 1. DARK-BRONZE RS-68A MAIN ENGINE NOZZLE & TURBOPUMP EXHAUST (y = 0.0 -> 0.85)
    // =========================================================================
    const mBell = bellMaterial(true);
    g.add(mesh(bellGeometry(0.32, 0.56, yNozTop, 36), rs68BellMat, cx, 0, 0));
    g.add(mesh(bellGeometry(0.31, 0.55, yNozTop - 0.02, 36), mBell, cx, 0, 0));
    addNozzle(g, cx, 0, 0.56, [mBell]);

    // Auxiliary RS-68A roll-control / turbopump exhaust pipe on the right side of each base shield (visible in photo!)
    g.add(mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.42, 16), rs68BellMat, cx + 0.44, 0.72, 0.22));

    // =========================================================================
    // 2. CONICAL WARM-GREY METALLIC THERMAL BASE SHIELD (y = 0.85 -> 2.15)
    // =========================================================================
    const hShield = yShieldTop - yNozTop;
    g.add(mesh(new THREE.CylinderGeometry(R_D4H_CORE, 0.58, hShield, 56), baseShieldGreyMat, cx, yNozTop + hShield * 0.5, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.60, 0.58, 0.10, 48), blackTipMat, cx, yNozTop + 0.05, 0));
    // Dark vent/bolt dots around the upper rim of the conical grey thermal shield (y = 1.95, visible in photo!)
    for (const va of [-0.55, 0.0, 0.55]) {
      g.add(mesh(new THREE.BoxGeometry(0.07, 0.09, 0.04), blackTipMat, cx + Math.sin(va) * 0.94, 1.95, Math.cos(va) * 0.94));
    }

    // =========================================================================
    // 3. MAIN CBC CYLINDER WITH BURNT-ORANGE SOFI FOAM, BLACK SCORCH BASE &
    //    WHITE CENTER INTERTANK BAND (y = 2.15 -> 17.80, r = R_D4H_CORE = 1.00)
    // =========================================================================
    g.add(mesh(new THREE.CylinderGeometry(R_D4H_CORE, R_D4H_CORE, hCyl, 64), cbcBodyMat, cx, yShieldTop + hCyl * 0.5, 0));

    // Raised structural ring ridges at the white aft skirt border (y = 3.42), intertank borders (y = 12.15, 14.25), and top collar (y = 17.65)
    for (const ry of [2.18, 3.42, 12.15, 14.25, H - 0.12]) {
      g.add(mesh(new THREE.CylinderGeometry(R_D4H_CORE + 0.012, R_D4H_CORE + 0.012, 0.06, 64), whiteMat, cx, ry, 0));
    }

    // =========================================================================
    // 4. PROMINENT TWIN FRONT WHITE VERTICAL LOX FEEDLINE & CABLE RACEWAY PIPES
    //    Running up the front (+Z) of every single CBC (super distinct in photo!)
    // =========================================================================
    // A. Right-Front White Cylindrical External LOX Feedline (y = 2.85 -> 13.05, elbowing into the white intertank band!)
    const hLoxPipe = 13.05 - 2.85;
    const lxPipe = cx + 0.14;
    const lzPipe = R_D4H_CORE + 0.065;
    g.add(mesh(new THREE.CylinderGeometry(0.085, 0.085, hLoxPipe, 20), whiteMat, lxPipe, 2.85 + hLoxPipe * 0.5, lzPipe));
    // Upper elbow fairing where the LOX feedline enters the white center intertank band (y = 13.05)
    g.add(mesh(new THREE.BoxGeometry(0.22, 0.34, 0.20), whiteMat, lxPipe, 13.08, R_D4H_CORE + 0.02));
    g.add(mesh(new THREE.BoxGeometry(0.24, 0.10, 0.22), blackTipMat, lxPipe, 12.95, R_D4H_CORE + 0.03));
    // Lower elbow fairing where the LOX feedline enters the white aft skirt (y = 2.85)
    g.add(mesh(new THREE.BoxGeometry(0.22, 0.36, 0.20), whiteMat, lxPipe, 2.82, R_D4H_CORE + 0.02));

    // Horizontal dark-grey support clamp rings along the white LOX feedline
    for (let py = 3.65; py < 12.6; py += 1.15) {
      g.add(mesh(new THREE.BoxGeometry(0.20, 0.06, 0.16), blackTipMat, lxPipe, py, lzPipe - 0.02));
    }

    // B. Left-Front Full-Height White Cable Raceway Conduit (y = 2.55 -> 17.75, running all the way to the top of the CBC!)
    const hRace = 17.75 - 2.55;
    const rxPipe = cx - 0.08;
    const rzPipe = R_D4H_CORE + 0.042;
    g.add(mesh(new THREE.BoxGeometry(0.095, hRace, 0.08), whiteMat, rxPipe, 2.55 + hRace * 0.5, rzPipe));
    for (let py = 3.20; py < 17.5; py += 1.25) {
      g.add(mesh(new THREE.BoxGeometry(0.13, 0.05, 0.10), blackTipMat, rxPipe, py, rzPipe));
    }

    // =========================================================================
    // 5. POINTED WHITE OGIVE NOSE CONES ON LEFT & RIGHT BOOSTERS (y = 17.80 -> 20.65)
    //    Plus Upper & Lower Inter-Core Attachment Struts!
    // =========================================================================
    if (isSide) {
      const sgn = Math.sign(cx);
      const conePts = [];
      const nCone = 28;
      for (let i = 0; i <= nCone; i++) {
        const t = i / nCone;
        const r = 0.04 + (R_D4H_CORE - 0.04) * Math.pow(1 - Math.pow(t, 1.35), 0.72);
        conePts.push(new THREE.Vector2(r, yCylTop + t * (ySideConeTop - yCylTop)));
      }
      const coneMesh = mesh(new THREE.LatheGeometry(conePts, 56), whiteMat);
      coneMesh.position.set(cx, 0, 0);
      g.add(coneMesh);
      g.add(mesh(new THREE.SphereGeometry(0.042, 16, 12), whiteMat, cx, ySideConeTop, 0));

      // Small dark sensor/vent dot on the front face of each white booster nose cone (y = 18.55, visible in photo!)
      g.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 12).rotateX(Math.PI * 0.5), blackTipMat, cx - sgn * 0.18, 18.55, 0.86));

      // Upper White Diagonal & Horizontal Thrust-Beam Cross-Struts connecting the side booster top to the center core (y = 17.75, matching photo!)
      const midX = sgn * (X_D4H_SIDE * 0.5);
      g.add(mesh(new THREE.CylinderGeometry(0.048, 0.048, 1.25, 12).rotateZ(Math.PI * 0.5), whiteMat, midX, 17.72, 0.88));
      const diag1 = mesh(new THREE.CylinderGeometry(0.042, 0.042, 1.35, 12), whiteMat, midX, 17.88, 0.88);
      diag1.rotation.z = sgn * 1.18;
      g.add(diag1);
      const diag2 = mesh(new THREE.CylinderGeometry(0.042, 0.042, 1.35, 12), whiteMat, midX, 17.88, -0.88);
      diag2.rotation.z = sgn * 1.18;
      g.add(diag2);

      // Lower White Aft Attachment Struts connecting the side booster aft skirt to the center core (y = 2.65)
      g.add(mesh(new THREE.BoxGeometry(0.45, 0.22, 0.42), whiteMat, midX, 2.65, 0.55));
      g.add(mesh(new THREE.BoxGeometry(0.45, 0.22, 0.42), whiteMat, midX, 2.65, -0.55));
    }
  }

  return g;
}

// =========================================================================
// USAF / LOCKHEED MARTIN TITAN IVB ("U S  A I R  F O R C E" · VOYAGER / CASSINI)
// Authentic replica matching reference image:
// - Stage 3 (titan4Fairing): Tall Pure-White 5-Meter Payload Fairing (PLF) with
//   conical boat-tail base, 4 cylindrical segments separated by raised rings,
//   center-front vertical trisector seam line, fine vertical ribs & bi-conic nose.
// - Stage 2 (titan4Stage2): Titan IV Second Stage & Interstage featuring the
//   signature L-shaped reddish-brown cork thermal protection panel on the right-front,
//   shiny chrome-silver mid-band with a black square panel, chrome-silver collar
//   bearing the U.S. Air Force Star-and-Bars roundel, and white corrugated interstage
//   with 2 symmetric clusters of black rectangular vent louvers + 5 circular holes.
// - Stage 1 (titan4Stage1): Polished Metallic Silver-Aluminium Core with vertical
//   black "U S  A I R  F O R C E" stencil lettering, white/tan ribbed aft collar,
//   reddish-brown conical boattail shroud & silver LR87 engine nozzle, flanked by
//   Twin Cream-White SRMU Solid Rocket Boosters with triple-ring field joints,
//   slanted blunted nose cones (with 3 circular ports on the right cone), aft skirt
//   thruster pods, white triangular A-frame attach trusses, and wide grey nozzles
//   with reddish-brown throat collars.
// =========================================================================
const R_T4_CORE = 0.86;  // Titan IV central core radius
const R_T4_PLF = 1.06;   // 5-meter Payload Fairing radius
const R_T4_SRB = 0.88;   // SRMU Solid Rocket Booster radius
const X_T4_SRB = 1.90;   // Left/Right SRMU X offset

let _titan4Mats = null;
function getTitan4Materials() {
  if (_titan4Mats) return _titan4Mats;
  const panel = TX.panelTextures();
  const brushed = TX.brushedRough();

  // Pure matte-satin white for the 5m Payload Fairing (PLF)
  const plfWhiteMat = physical({
    color: 0xf0f1ee,
    roughness: 0.46,
    metalness: 0.04,
    clearcoat: 0.18,
    clearcoatRoughness: 0.34,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.22, 0.22),
  });

  // Warm cream-white for the Twin SRMU Solid Rocket Boosters & aft trusses
  const srmuCreamMat = physical({
    color: 0xeceae2,
    roughness: 0.48,
    metalness: 0.04,
    clearcoat: 0.16,
    clearcoatRoughness: 0.36,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.24, 0.24),
  });

  // Cool off-white / light grey-white for the Stage 2 upper tank & ribbed interstage
  const stage2WhiteMat = physical({
    color: 0xe2e5ea,
    roughness: 0.44,
    metalness: 0.06,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.24, 0.24),
  });

  // Brushed metallic aluminium-silver for the Stage 1 Core & LR87 engine bell
  const coreSilverMat = physical({
    color: 0xc8ced8,
    roughness: 0.30,
    metalness: 0.84,
    roughnessMap: brushed,
    clearcoat: 0.25,
    clearcoatRoughness: 0.22,
  });

  // High-polish chrome-silver for the Stage 2 USAF roundel band & strut attach band
  const chromeSilverMat = physical({
    color: 0xd8dee8,
    roughness: 0.18,
    metalness: 0.92,
  });

  // Reddish-brown cork / ablative thermal protection material for the Stage 2 L-panel,
  // Stage 1 conical boattail shroud & SRB nozzle throat collars (matching photo!)
  const corkBrownMat = physical({
    color: 0x7d4427,
    roughness: 0.74,
    metalness: 0.08,
  });

  // Warm tan for the ribbed Stage 1 aft skirt collar
  const aftTanMat = physical({
    color: 0xc8b598,
    roughness: 0.64,
    metalness: 0.10,
  });

  // Matte-grey for the 2 wide flared SRMU booster nozzles
  const srbNozzleGreyMat = physical({
    color: 0x7c8189,
    roughness: 0.56,
    metalness: 0.28,
  });

  // Matte-black for Stage 2 interstage vent louvers & square panel
  const blackVentMat = physical({
    color: 0x16181d,
    roughness: 0.62,
    metalness: 0.15,
  });

  function makeProcTex(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }

  // 1. Stage 2 Full-Height Conformal Decal (y = 0.0 -> 8.20):
  //    - Top (y = 6.65 -> 8.20): Cool off-white upper tank collar
  //    - Middle (y = 3.08 -> 6.65): L-shaped reddish-brown cork panel on right-front +
  //      cool off-white on left-front, crossed at y = 4.80 by a shiny silver band & black square!
  //    - USAF Band (y = 2.38 -> 3.08): Metallic silver band with black-and-white USAF Star-and-Bars roundel!
  //    - Bottom Interstage (y = 0.0 -> 2.38): White vertically ribbed collar with 2 symmetric
  //      clusters of black rectangular vent louvers + 5 circular vent holes!
  const stage2Tex = makeProcTex(1024, 1024, (ctx, w, h) => {
    // Base cool off-white background
    ctx.fillStyle = '#e2e5ea';
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.50; // Front center (+Z)

    // A. L-Shaped Reddish-Brown Cork Thermal Panel (y = 0.19 -> 0.625 of canvas height)
    const yBrownTop = h * 0.190;
    const yBrownL = h * 0.545;
    const yBrownBot = h * 0.625;
    ctx.fillStyle = '#7d4427';
    // Horizontal lower leg of the L-panel across the front
    ctx.fillRect(cx - 165, yBrownL, 330, yBrownBot - yBrownL);
    // Broad vertical right leg of the L-panel extending up to yBrownTop
    ctx.fillRect(cx - 8, yBrownTop, 175, yBrownL - yBrownTop + 2);

    // Shiny silver horizontal strap & matte-black square panel at mid-height (y = 0.415) where booster struts meet
    const yMidBand = h * 0.415;
    ctx.fillStyle = '#c8cfd9';
    ctx.fillRect(cx - 165, yMidBand - 24, 158, 48);
    ctx.fillStyle = '#181a20';
    ctx.fillRect(cx - 42, yMidBand - 24, 36, 48);

    // B. Metallic Silver USAF Roundel Band (y = 0.625 -> 0.710)
    const yUsafTop = h * 0.625;
    const yUsafBot = h * 0.710;
    const yUsafMid = (yUsafTop + yUsafBot) * 0.5;
    ctx.fillStyle = '#bcc3ce';
    ctx.fillRect(0, yUsafTop, w, yUsafBot - yUsafTop);
    ctx.strokeStyle = '#6d7480';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, yUsafTop, w, yUsafBot - yUsafTop);

    // U.S. Air Force Star-and-Bars Roundel at front center (cx, yUsafMid)
    // White side bars with dark outline
    ctx.fillStyle = '#f4f6fa';
    ctx.fillRect(cx - 64, yUsafMid - 12, 128, 24);
    ctx.strokeStyle = '#1a1d24';
    ctx.lineWidth = 4;
    ctx.strokeRect(cx - 64, yUsafMid - 12, 128, 24);
    // Horizontal stripe inside side bars
    ctx.fillStyle = '#1a1d24';
    ctx.fillRect(cx - 62, yUsafMid - 3, 124, 6);
    // Dark circle behind the 5-pointed white star
    ctx.fillStyle = '#1a1d24';
    ctx.beginPath();
    ctx.arc(cx, yUsafMid, 24, 0, Math.PI * 2);
    ctx.fill();
    // 5-pointed white star in center
    ctx.fillStyle = '#f4f6fa';
    ctx.beginPath();
    for (let p = 0; p < 10; p++) {
      const rStar = p % 2 === 0 ? 20 : 8;
      const aStar = -Math.PI * 0.5 + (p * Math.PI) / 5;
      const sx = cx + Math.cos(aStar) * rStar;
      const sy = yUsafMid + Math.sin(aStar) * rStar;
      if (p === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();

    // C. Bottom White Corrugated Interstage Band (y = 0.710 -> 1.000) with 2 Symmetric Black Vent Louver Clusters!
    const yInterTop = h * 0.710;
    ctx.fillStyle = '#e6e8ed';
    ctx.fillRect(0, yInterTop, w, h - yInterTop);
    // Fine vertical corrugation lines across the interstage
    ctx.strokeStyle = 'rgba(130, 136, 145, 0.35)';
    ctx.lineWidth = 2;
    for (let rx = 0; rx < w; rx += 8) {
      ctx.beginPath();
      ctx.moveTo(rx, yInterTop);
      ctx.lineTo(rx, h);
      ctx.stroke();
    }

    // 2 Symmetric Black Vent Louver Grids on front-left (cx - 72) and front-right (cx + 72)
    for (const sgn of [-1, 1]) {
      const gx = cx + sgn * 74;
      ctx.fillStyle = '#14161b';
      // Row 1 (Upper): 4 tall vertical black rectangular louver slots
      for (let c = -1.5; c <= 1.5; c += 1) {
        ctx.fillRect(gx + c * 15 - 5, h * 0.775, 10, 52);
      }
      // Row 2 (Middle): 5 vertical black rectangular louver slots
      for (let c = -2; c <= 2; c += 1) {
        ctx.fillRect(gx + c * 15 - 5, h * 0.848, 10, 48);
      }
      // Row 3 (Bottom): 5 circular black vent holes
      for (let c = -2; c <= 2; c += 1) {
        ctx.beginPath();
        ctx.arc(gx + c * 15, h * 0.922, 4.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
  const stage2BodyMat = physical({
    map: stage2Tex,
    roughness: 0.42,
    metalness: 0.14,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.24, 0.24),
  });

  // 2. Stage 1 Central Silver Core Decal: Brushed Aluminium-Silver with Vertical Black
  //    "U S   A I R   F O R C E" Stencil Lettering & White Data Plate below it!
  const stage1CoreTex = makeProcTex(512, 1024, (ctx, w, h) => {
    // Metallic silver-aluminium base
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0.00, '#b8bfc9');
    grad.addColorStop(0.25, '#cfd5df');
    grad.addColorStop(0.50, '#dce2eb');
    grad.addColorStop(0.75, '#c6cdd7');
    grad.addColorStop(1.00, '#b8bfc9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle horizontal weld seams
    ctx.strokeStyle = 'rgba(90, 96, 106, 0.38)';
    ctx.lineWidth = 2.5;
    for (const sy of [0.18, 0.44, 0.72]) {
      ctx.beginPath();
      ctx.moveTo(0, h * sy);
      ctx.lineTo(w, h * sy);
      ctx.stroke();
    }

    // Vertical Black Stencil Lettering "U S   A I R   F O R C E" down the upper-front center (matching photo!)
    const letters = [
      ['U', 0.035],
      ['S', 0.072],
      ['A', 0.138],
      ['I', 0.175],
      ['R', 0.212],
      ['F', 0.278],
      ['O', 0.315],
      ['R', 0.352],
      ['C', 0.389],
      ['E', 0.426],
    ];
    ctx.fillStyle = '#1b1e24';
    ctx.font = '800 26px "Arial", "Helvetica Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = w * 0.50;
    for (const [ch, ly] of letters) {
      ctx.fillText(ch, cx - 8, h * ly);
    }

    // Small white rectangular stencil label right below the 'E' (y = 0.475, visible in photo!)
    ctx.fillStyle = '#f2f4f8';
    ctx.fillRect(cx - 32, h * 0.462, 52, 24);
  });
  const stage1CoreDecalMat = physical({
    map: stage1CoreTex,
    roughness: 0.28,
    metalness: 0.80,
    roughnessMap: brushed,
    clearcoat: 0.25,
    clearcoatRoughness: 0.22,
  });

  _titan4Mats = {
    plfWhiteMat,
    srmuCreamMat,
    stage2WhiteMat,
    coreSilverMat,
    chromeSilverMat,
    corkBrownMat,
    aftTanMat,
    srbNozzleGreyMat,
    blackVentMat,
    stage2BodyMat,
    stage1CoreDecalMat,
  };
  return _titan4Mats;
}

// Stage 3 (Top): Titan IVB Tall 5-Meter Pure-White Payload Fairing (PLF) with
// Conical Boat-Tail Base, 4 Cylindrical Segments, Center-Front Seam & Bi-Conic Nose (H = 14.8m)
function buildTitan4Fairing() {
  const g = new THREE.Group();
  const H = PARTS.titan4Fairing.height; // 14.8
  const {
    plfWhiteMat,
    stage2WhiteMat,
    coreSilverMat,
    blackVentMat,
  } = getTitan4Materials();

  const yBoatTop = 0.92;
  const yCylTop = 11.85;
  const yConeMid = 14.32;

  // 1. Conical Boat-Tail Base flaring from R_T4_CORE (0.86) to R_T4_PLF (1.06) (y = 0.0 -> 0.92)
  g.add(mesh(new THREE.CylinderGeometry(R_T4_PLF, R_T4_CORE, yBoatTop, 64), plfWhiteMat, 0, yBoatTop * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_T4_CORE + 0.012, R_T4_CORE + 0.012, 0.06, 64), stage2WhiteMat, 0, 0.03, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_T4_PLF + 0.012, R_T4_PLF + 0.012, 0.06, 64), plfWhiteMat, 0, yBoatTop, 0));

  // Fine vertical ribs around the boat-tail base
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const rm = (R_T4_CORE + R_T4_PLF) * 0.5 + 0.006;
    const rib = mesh(new THREE.BoxGeometry(0.024, yBoatTop - 0.06, 0.020), plfWhiteMat, Math.sin(a) * rm, yBoatTop * 0.5, Math.cos(a) * rm);
    rib.rotation.y = a;
    rib.rotation.x = Math.atan2(R_T4_PLF - R_T4_CORE, yBoatTop);
    g.add(rib);
  }

  // 2. Tall Pure-White Cylindrical 5m Payload Fairing Barrel (y = 0.92 -> 11.85, r = R_T4_PLF = 1.06)
  const hCyl = yCylTop - yBoatTop;
  g.add(mesh(new THREE.CylinderGeometry(R_T4_PLF, R_T4_PLF, hCyl, 64), plfWhiteMat, 0, yBoatTop + hCyl * 0.5, 0));

  // 4 Cylindrical Segments separated by crisp raised white horizontal rings (matching reference photo!)
  for (const ry of [3.65, 6.38, 9.12, yCylTop]) {
    g.add(mesh(new THREE.CylinderGeometry(R_T4_PLF + 0.014, R_T4_PLF + 0.014, 0.06, 64), plfWhiteMat, 0, ry, 0));
  }

  // Subtle vertical acoustic ribs around the fairing cylinder & prominent trisector split seams at 0, +120, -120 deg
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const isSplit = i % 20 === 0;
    const wRib = isSplit ? 0.036 : 0.022;
    const dRib = isSplit ? 0.028 : 0.014;
    const rib = mesh(new THREE.BoxGeometry(wRib, hCyl, dRib), plfWhiteMat, Math.sin(a) * (R_T4_PLF + 0.006), yBoatTop + hCyl * 0.5, Math.cos(a) * (R_T4_PLF + 0.006));
    rib.rotation.y = a;
    g.add(rib);
  }

  // 3. Pointed Bi-Conic White Nose Cone (y = 11.85 -> 14.80)
  const hCone1 = yConeMid - yCylTop;
  const rMid = 0.24;
  g.add(mesh(new THREE.CylinderGeometry(rMid, R_T4_PLF, hCone1, 64), plfWhiteMat, 0, yCylTop + hCone1 * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(rMid + 0.010, rMid + 0.010, 0.04, 48), plfWhiteMat, 0, yConeMid, 0));

  // Continuation of the 3 trisector split seam ribs up the nose cone
  const coneSlope = Math.atan2(R_T4_PLF - rMid, hCone1);
  for (const sa of [0, (Math.PI * 2) / 3, -(Math.PI * 2) / 3]) {
    const rm = (R_T4_PLF + rMid) * 0.5 + 0.008;
    const ym = yCylTop + hCone1 * 0.5;
    const sRib = mesh(new THREE.BoxGeometry(0.032, Math.hypot(hCone1, R_T4_PLF - rMid), 0.024), plfWhiteMat, Math.sin(sa) * rm, ym, Math.cos(sa) * rm);
    sRib.rotation.y = sa;
    sRib.rotation.x = -coneSlope;
    g.add(sRib);
  }

  // Smooth rounded nose cap tip (y = 14.32 -> 14.80)
  const tipPts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const r = rMid * Math.pow(Math.max(0, 1 - Math.pow(t, 1.45)), 0.65);
    tipPts.push(new THREE.Vector2(r, yConeMid + t * (H - yConeMid)));
  }
  g.add(mesh(new THREE.LatheGeometry(tipPts, 40), plfWhiteMat));

  // Recessed Centaur / IUS upper-stage nozzle & recovery parachutes
  g.add(mesh(new THREE.CylinderGeometry(R_T4_CORE * 0.86, R_T4_CORE * 0.86, 0.14, 40), blackVentMat, 0, 0.07, 0));
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.16, 0.36, 0.50, 28), coreSilverMat, 0, 0, 0));
  addNozzle(g, 0, 0, 0.36, [mBell]);
  addParachutes(g, 13.6);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 2: Titan IVB Second Stage & Corrugated Interstage with L-Shaped Reddish-Brown
// Cork Panel, Chrome-Silver USAF Roundel Band & Black Vent Louver Clusters (H = 8.2m)
function buildTitan4Stage2() {
  const g = new THREE.Group();
  const H = PARTS.titan4Stage2.height; // 8.2
  const {
    stage2WhiteMat,
    chromeSilverMat,
    corkBrownMat,
    blackVentMat,
    stage2BodyMat,
  } = getTitan4Materials();

  // 1. Main Cylindrical Stage 2 & Interstage Body with Conformal Full-Height Texture (y = 0.0 -> 8.20, r = R_T4_CORE = 0.86)
  g.add(mesh(new THREE.CylinderGeometry(R_T4_CORE, R_T4_CORE, H, 64), stage2BodyMat, 0, H * 0.5, 0));

  // 3D Raised Chrome-Silver Collar Edges around the USAF Roundel Band (y = 2.38 & y = 3.08)
  g.add(mesh(new THREE.CylinderGeometry(R_T4_CORE + 0.010, R_T4_CORE + 0.010, 0.05, 64), chromeSilverMat, 0, 2.38, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_T4_CORE + 0.010, R_T4_CORE + 0.010, 0.05, 64), chromeSilverMat, 0, 3.08, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_T4_CORE + 0.010, R_T4_CORE + 0.010, 0.05, 64), stage2WhiteMat, 0, 0.04, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_T4_CORE + 0.010, R_T4_CORE + 0.010, 0.05, 64), stage2WhiteMat, 0, H - 0.04, 0));

  // 3D Raised Vertical Reddish-Brown Cable Conduit along the right edge of Stage 2 (x = +0.52, z = +0.69)
  const condAng = 0.64;
  const cx = Math.sin(condAng) * (R_T4_CORE + 0.025);
  const cz = Math.cos(condAng) * (R_T4_CORE + 0.025);
  const cond = mesh(new THREE.BoxGeometry(0.09, 3.55, 0.07), corkBrownMat, cx, 4.85, cz);
  cond.rotation.y = condAng;
  g.add(cond);

  // Recessed Aerojet LR91 Liquid Propellant Second Stage Engine Bell & parachutes
  g.add(mesh(new THREE.CylinderGeometry(R_T4_CORE * 0.88, R_T4_CORE * 0.88, 0.14, 40), blackVentMat, 0, 0.07, 0));
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.22, 0.44, 0.62, 32), chromeSilverMat, 0, 0, 0));
  addNozzle(g, 0, 0, 0.44, [mBell]);
  addParachutes(g, H * 0.86);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 1 (Bottom): Titan IVB First Stage — Brushed Metallic Silver Core ("U S  A I R  F O R C E")
// with Reddish-Brown Conical Boattail Shroud & Silver LR87 Nozzle + Twin Cream-White SRMU
// Solid Rocket Boosters with Triple-Ring Field Joints, White A-Frame Trusses & Grey Nozzles (H = 14.6m)
function buildTitan4Stage1() {
  const g = new THREE.Group();
  const H = PARTS.titan4Stage1.height; // 14.6
  const {
    srmuCreamMat,
    coreSilverMat,
    chromeSilverMat,
    corkBrownMat,
    aftTanMat,
    srbNozzleGreyMat,
    stage1CoreDecalMat,
  } = getTitan4Materials();

  const yLr87Top = 0.64;
  const yBrownShroudTop = 1.54;
  const yRibCollarTop = 2.16;
  const hSilverCore = H - yRibCollarTop; // 12.44

  // =========================================================================
  // 1. CENTRAL METALLIC SILVER-ALUMINIUM FIRST STAGE CORE (x = 0, z = 0)
  // =========================================================================
  // A. Shiny Metallic-Silver Aerojet LR87 Engine Bell at the bottom center (y = 0.0 -> 0.64, matching photo!)
  const mCoreBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.22, 0.37, yLr87Top, 36), chromeSilverMat, 0, 0, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.38, 0.36, 0.06, 36), coreSilverMat, 0, 0.04, 0));
  addNozzle(g, 0, 0, 0.37, [mCoreBell]);

  // B. Reddish-Brown Tapered Conical Engine Boattail Heat Shield (y = 0.64 -> 1.54, matching photo!)
  const hBrownShroud = yBrownShroudTop - yLr87Top;
  g.add(mesh(new THREE.CylinderGeometry(0.64, 0.44, hBrownShroud, 48), corkBrownMat, 0, yLr87Top + hBrownShroud * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.46, 0.44, 0.08, 40), corkBrownMat, 0, yLr87Top + 0.04, 0));

  // C. Vertically Ribbed Warm-Tan & Cream-White Aft Skirt Collar (y = 1.54 -> 2.16, r = R_T4_CORE = 0.86)
  const hRibCollar = yRibCollarTop - yBrownShroudTop;
  g.add(mesh(new THREE.CylinderGeometry(R_T4_CORE, R_T4_CORE, hRibCollar * 0.65, 56), aftTanMat, 0, yBrownShroudTop + hRibCollar * 0.325, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_T4_CORE + 0.012, R_T4_CORE + 0.012, hRibCollar * 0.38, 56), srmuCreamMat, 0, yBrownShroudTop + hRibCollar * 0.82, 0));
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const rib = mesh(new THREE.BoxGeometry(0.026, hRibCollar * 0.62, 0.022), aftTanMat, Math.sin(a) * (R_T4_CORE + 0.008), yBrownShroudTop + hRibCollar * 0.32, Math.cos(a) * (R_T4_CORE + 0.008));
    rib.rotation.y = a;
    g.add(rib);
  }

  // D. Brushed Metallic Silver-Aluminium Core Tank with Vertical "U S  A I R  F O R C E" Stencil (y = 2.16 -> 14.60)
  g.add(mesh(new THREE.CylinderGeometry(R_T4_CORE, R_T4_CORE, hSilverCore, 64), stage1CoreDecalMat, 0, yRibCollarTop + hSilverCore * 0.5, 0));

  // Vertical metallic silver oxidizer/cable conduit along the right-front of the silver core (angle = +0.52 rad, visible in photo!)
  const pipeAng = 0.52;
  g.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, hSilverCore, 16), coreSilverMat, Math.sin(pipeAng) * (R_T4_CORE + 0.03), yRibCollarTop + hSilverCore * 0.5, Math.cos(pipeAng) * (R_T4_CORE + 0.03)));

  // =========================================================================
  // 2. TWIN CREAM-WHITE SRMU SOLID ROCKET BOOSTERS (x = ±1.90, r = 0.88)
  //    Extending continuously from y = 0.0 up to y = 20.65 alongside Stage 2!
  // =========================================================================
  const ySrbNozTop = 1.34;
  const ySrbThroatTop = 1.48;
  const ySrbCylTop = 18.25;
  const ySrbTip = 20.65;

  for (const sgn of [-1, 1]) {
    const bx = sgn * X_T4_SRB;

    // A. Wide Flared Matte-Grey Cantilevered SRMU Nozzle Bell (y = 0.0 -> 1.34, matching photo!)
    const mSrbBell = bellMaterial(true);
    const nozGrp = new THREE.Group();
    nozGrp.position.set(bx, 0, 0);
    nozGrp.rotation.z = -sgn * 0.045; // Slight outward cant of Titan IV SRMU nozzles!
    nozGrp.add(mesh(new THREE.CylinderGeometry(0.48, 0.78, ySrbNozTop, 48), srbNozzleGreyMat, 0, ySrbNozTop * 0.5, 0));
    nozGrp.add(mesh(bellGeometry(0.46, 0.76, ySrbNozTop - 0.02, 36), mSrbBell, 0, 0, 0));
    // Reddish-Brown Nozzle Throat Collar Ring right where the grey nozzle meets the white booster base (y = 1.30 -> 1.48, visible in photo!)
    nozGrp.add(mesh(new THREE.CylinderGeometry(0.58, 0.52, 0.20, 40), corkBrownMat, 0, ySrbNozTop + 0.06, 0));
    g.add(nozGrp);
    addNozzle(g, bx + sgn * 0.04, 0, 0.76, [mSrbBell]);

    // B. Tall Cream-White Cylindrical SRMU Barrel (y = 1.48 -> 18.25, r = R_T4_SRB = 0.88)
    const hSrbCyl = ySrbCylTop - ySrbThroatTop;
    g.add(mesh(new THREE.CylinderGeometry(R_T4_SRB, R_T4_SRB, hSrbCyl, 56), srmuCreamMat, bx, ySrbThroatTop + hSrbCyl * 0.5, 0));

    // Bottom base ring & Triple-Ring Circumferential Field-Joint Bands along the cream-white SRMU barrel (matching photo!)
    g.add(mesh(new THREE.CylinderGeometry(R_T4_SRB + 0.016, R_T4_SRB + 0.016, 0.10, 56), srmuCreamMat, bx, ySrbThroatTop + 0.05, 0));
    for (const yBand of [2.65, 6.85, 11.45, 14.85, 18.02]) {
      for (const dy of [-0.14, 0.0, 0.14]) {
        g.add(mesh(new THREE.CylinderGeometry(R_T4_SRB + 0.014, R_T4_SRB + 0.014, 0.045, 56), srmuCreamMat, bx, yBand + dy, 0));
      }
    }

    // Vertical external cable raceway strip running down the inner-front edge of each SRMU booster
    const raceX = bx - sgn * 0.58;
    const raceZ = Math.sqrt(Math.max(0, R_T4_SRB * R_T4_SRB - 0.58 * 0.58)) + 0.015;
    g.add(mesh(new THREE.BoxGeometry(0.08, hSrbCyl - 0.3, 0.05), srmuCreamMat, raceX, ySrbThroatTop + hSrbCyl * 0.5, raceZ));

    // C. Aft Skirt Outward-Projecting White Thruster/Strut Pods & Triangular Gussets (y = 1.48 -> 2.45, super distinct in photo!)
    // Outer side pod
    g.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.82, 20), srmuCreamMat, bx + sgn * (R_T4_SRB + 0.10), 1.96, 0));
    g.add(mesh(new THREE.SphereGeometry(0.18, 16, 12), srmuCreamMat, bx + sgn * (R_T4_SRB + 0.10), 2.36, 0));
    // Front-outer angled pod with triangular fin gussets (y = 1.42 -> 2.25)
    const podX = bx + sgn * 0.38;
    const podZ = R_T4_SRB + 0.06;
    g.add(mesh(new THREE.BoxGeometry(0.28, 0.78, 0.28), srmuCreamMat, podX, 1.82, podZ));
    for (const gs of [-1, 1]) {
      const gus = mesh(new THREE.BoxGeometry(0.05, 0.68, 0.26), srmuCreamMat, podX + gs * 0.18, 1.84, podZ);
      gus.rotation.z = gs * 0.38;
      g.add(gus);
    }

    // D. Crisp White Open Triangular A-Frame Truss Struts connecting each booster base to the core's ribbed aft collar (y = 1.58 -> 2.22, matching photo!)
    const inX = sgn * (R_T4_CORE + 0.02);
    const outX = bx - sgn * (R_T4_SRB - 0.05);
    const midX = (inX + outX) * 0.5;
    const zFront = 0.78;
    // Vertical inner post on the booster side
    g.add(mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.65, 10), srmuCreamMat, outX, 1.90, zFront));
    // Top horizontal bar from booster to core
    g.add(mesh(new THREE.CylinderGeometry(0.030, 0.030, Math.abs(outX - inX) + 0.18, 10).rotateZ(Math.PI * 0.5), srmuCreamMat, midX, 2.18, zFront));
    // Diagonal brace from bottom of booster post up to top of core collar
    const diagLen = Math.hypot(outX - inX, 0.58);
    const diagBrace = mesh(new THREE.CylinderGeometry(0.028, 0.028, diagLen, 10), srmuCreamMat, midX, 1.89, zFront);
    diagBrace.rotation.z = sgn * Math.atan2(outX - inX, 0.58);
    g.add(diagBrace);

    // Upper Horizontal Silver-White Attachment Strut Rod at y = 18.18 connecting the top of each SRMU cylinder to Stage 2 (visible in photo!)
    g.add(mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.85, 10).rotateZ(Math.PI * 0.5), chromeSilverMat, sgn * 1.15, 18.18, 0.72));

    // E. Slanted Blunted Cream-White SRMU Nose Cone (y = 18.25 -> 20.65)
    //    Canted slightly inward toward the central core just like in the reference image!
    const coneH = ySrbTip - ySrbCylTop;
    const coneGeo = shearedBoosterConeGeo(
      R_T4_SRB,
      0.16,
      bx,
      bx - sgn * 0.14,
      0,
      0,
      coneH,
      0.84,
      48,
      20
    );
    g.add(mesh(coneGeo, srmuCreamMat, 0, ySrbCylTop, 0));
    // Rounded blunted cap at the apex of each SRMU nose cone
    const tipCap = mesh(new THREE.SphereGeometry(0.162, 24, 16), srmuCreamMat, bx - sgn * 0.14, ySrbTip - 0.02, 0);
    tipCap.scale.set(1.0, 0.72, 1.0);
    g.add(tipCap);

    // Vertical row of 3 small circular dimples / attitude thruster ports near the top-inner face of the right booster nose cone (y = 19.85, 20.05, 20.25, visible in photo!)
    if (sgn > 0) {
      for (const [dy, dxOff, dzOff] of [
        [19.82, -0.26, 0.42],
        [20.04, -0.24, 0.36],
        [20.26, -0.22, 0.30],
      ]) {
        const port = mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.04, 14).rotateX(Math.PI * 0.5), srbNozzleGreyMat, bx + dxOff, dy, dzOff);
        port.rotation.y = -0.45;
        g.add(port);
      }
    }
  }

  return g;
}

// =========================================================================
// SPACEX STARSHIP & SUPER HEAVY FULL STACK (IFT FLIGHT CONFIGURATION)
// Authentic replica matching reference image:
// - Stage 3 (starshipNose): Ogive Starship Nose Cone in matte charcoal-black
//   thermal protection tiles with warm sunlit stainless-steel left edge, horizontal
//   weld rings, and 2 trapezoidal forward aero flaps (canards).
// - Stage 2 (starshipShip): Starship Main Barrel with bright cryogenic frost-white
//   leeward tank band & vertical dark raceway seam, matte-black windward heat-shield
//   tile wrap, dark charcoal-grey aft engine skirt with 2 large trapezoidal aft aero
//   flaps, vented hot-staging interstage ring, and 6 Raptor engines (3 RVac + 3 SL).
// - Stage 1 (starshipBooster): Super Heavy Stainless-Steel Booster featuring 4
//   deployed dark waffle grid fins at the top collar, 18 circumferential steel weld
//   rings, jagged white cryogenic frost trail along the front-left spine, 4 tall
//   protruding vertical aerodynamic chines/COPV fairings along the lower third, and
//   the iconic 33-Raptor engine cluster glowing in a golden-white honeycomb ring!
// =========================================================================
const R_SS_CORE = 1.22; // 9m Starship & Super Heavy scaled radius

let _starshipMats = null;
function getStarshipMaterials() {
  if (_starshipMats) return _starshipMats;
  const panel = TX.panelTextures();
  const brushed = TX.brushedRough();

  // Matte charcoal-black for thermal protection tiles, aero flaps & lower chine shadow faces
  const tileBlackMat = physical({
    color: 0x20242a,
    roughness: 0.72,
    metalness: 0.16,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.32, 0.32),
  });

  // Dark charcoal-grey blackened steel for Starship aft skirt, hot-staging ring & grid fins
  const darkSteelMat = physical({
    color: 0x2c3138,
    roughness: 0.52,
    metalness: 0.58,
    roughnessMap: brushed,
  });

  // Brushed stainless steel for structural rings, chines & Raptor outer jackets
  const stainlessMat = physical({
    color: 0x9aa1ab,
    roughness: 0.36,
    metalness: 0.78,
    roughnessMap: brushed,
    clearcoat: 0.20,
    clearcoatRoughness: 0.28,
  });

  // Warm sunlit stainless-steel highlight for left-edge chines & raceway caps
  const sunlitSteelMat = physical({
    color: 0xd8c6a6,
    roughness: 0.34,
    metalness: 0.68,
    roughnessMap: brushed,
  });

  // Incandescent golden-white emissive material for the 33 lit Raptor engine bells at the base!
  const raptorGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfff6dc,
    emissive: new THREE.Color(0xffb84d),
    emissiveIntensity: 2.8,
    roughness: 0.18,
    metalness: 0.10,
  });

  // Warm orange-gold emissive ring for the outer rim of the 33-Raptor engine cluster
  const raptorRimGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffd28a,
    emissive: new THREE.Color(0xff7b1a),
    emissiveIntensity: 2.2,
    roughness: 0.25,
    metalness: 0.15,
  });

  function makeProcTex(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }

  // 1. Starship Nose Cone Texture: Matte charcoal-black tiles with warm sunlit metallic
  //    highlight along the left-front edge (-X / +Z) and horizontal weld-ring seams!
  const noseTex = makeProcTex(512, 512, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0.00, '#1d2126');
    grad.addColorStop(0.28, '#282d34');
    grad.addColorStop(0.38, '#a89c88'); // Sunlit left-front metallic highlight (matching photo!)
    grad.addColorStop(0.45, '#54585e');
    grad.addColorStop(0.56, '#262a30');
    grad.addColorStop(0.80, '#1c2025');
    grad.addColorStop(1.00, '#1d2126');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle horizontal weld rings across the nose cone
    ctx.strokeStyle = 'rgba(20, 22, 26, 0.55)';
    ctx.lineWidth = 4;
    for (const sy of [0.22, 0.48, 0.74, 0.96]) {
      ctx.beginPath();
      ctx.moveTo(0, h * sy);
      ctx.lineTo(w, h * sy);
      ctx.stroke();
    }

    // Crisp dark vertical seam line down the left-front (x ~ 0.43)
    ctx.strokeStyle = '#14171b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(w * 0.43, 0);
    ctx.lineTo(w * 0.43, h);
    ctx.stroke();
  });
  const starshipNoseBodyMat = physical({
    map: noseTex,
    roughness: 0.62,
    metalness: 0.28,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.28, 0.28),
  });

  // 2. Starship Middle Barrel Texture (y = 0.65 -> 10.40):
  //    - Upper section (0.00 -> 0.67 of canvas): Bright Cryogenic Frost-White on front/left
  //      with warm golden sunlight edge, vertical dark raceway line & small black vents,
  //      and matte-black thermal tile wrap on the right/back!
  //    - Lower section (0.67 -> 1.00 of canvas): Dark charcoal-grey aft engine skirt!
  const shipMidTex = makeProcTex(1024, 1024, (ctx, w, h) => {
    const ySkirtSplit = h * 0.66;

    // A. Upper Cryogenic Frost-White + Right-Side Black Heat-Shield Wrap (0 -> ySkirtSplit)
    const upperGrad = ctx.createLinearGradient(0, 0, w, 0);
    upperGrad.addColorStop(0.00, '#1c2026');
    upperGrad.addColorStop(0.26, '#232830');
    upperGrad.addColorStop(0.32, '#f2d8a8'); // Warm sunlit left edge on the frost band
    upperGrad.addColorStop(0.40, '#e6e9ef'); // Bright cryogenic frost-white front-left
    upperGrad.addColorStop(0.56, '#c2c8d2'); // Shaded frost-white front-right
    upperGrad.addColorStop(0.62, '#22262c'); // Sharp transition to black heat-shield tiles on right!
    upperGrad.addColorStop(1.00, '#1c2026');
    ctx.fillStyle = upperGrad;
    ctx.fillRect(0, 0, w, ySkirtSplit);

    // B. Lower Dark Charcoal-Grey Aft Engine Skirt (ySkirtSplit -> h)
    const lowerGrad = ctx.createLinearGradient(0, 0, w, 0);
    lowerGrad.addColorStop(0.00, '#1b1f24');
    lowerGrad.addColorStop(0.32, '#2a2f36');
    lowerGrad.addColorStop(0.39, '#8c7e68'); // Subtle sunlit highlight on left of dark skirt
    lowerGrad.addColorStop(0.46, '#323740');
    lowerGrad.addColorStop(0.62, '#23272e');
    lowerGrad.addColorStop(1.00, '#1b1f24');
    ctx.fillStyle = lowerGrad;
    ctx.fillRect(0, ySkirtSplit, w, h - ySkirtSplit);

    // Horizontal steel weld rings
    ctx.strokeStyle = 'rgba(30, 34, 40, 0.55)';
    ctx.lineWidth = 4;
    for (const sy of [0.02, 0.22, 0.44, 0.66, 0.84, 0.98]) {
      ctx.beginPath();
      ctx.moveTo(0, h * sy);
      ctx.lineTo(w, h * sy);
      ctx.stroke();
    }

    // Prominent vertical dark raceway & seam line down the frost-white band (x ~ 0.435, matching photo!)
    ctx.fillStyle = '#252930';
    ctx.fillRect(w * 0.432, 0, 10, ySkirtSplit);
    ctx.fillStyle = '#383d46';
    ctx.fillRect(w * 0.415, 0, 5, ySkirtSplit);

    // Small dark rectangular RCS/vent markings on the frost-white band (visible in photo!)
    ctx.fillStyle = '#1e2228';
    ctx.fillRect(w * 0.402, h * 0.40, 12, 22);
    ctx.fillRect(w * 0.468, h * 0.26, 12, 18);
    ctx.fillRect(w * 0.515, h * 0.42, 10, 16);
  });
  const starshipMidBodyMat = physical({
    map: shipMidTex,
    roughness: 0.54,
    metalness: 0.24,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.26, 0.26),
  });

  // 3. Super Heavy Booster Barrel Texture (y = 0.35 -> 20.60):
  //    Brushed stainless-steel with warm golden sunlit left edge, 18 horizontal weld-ring
  //    seams, darker mid-bulkhead band, and the jagged white cryogenic frost trail down the center-left!
  const boosterTex = makeProcTex(1024, 2048, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0.00, '#363b42');
    grad.addColorStop(0.28, '#484e56');
    grad.addColorStop(0.34, '#f0d5a4'); // Bright sunlit golden-steel left edge (matching photo!)
    grad.addColorStop(0.41, '#c8c2b8');
    grad.addColorStop(0.48, '#8a919a'); // Brushed grey steel front-center
    grad.addColorStop(0.60, '#5e646d'); // Shaded steel front-right
    grad.addColorStop(0.75, '#3d424a');
    grad.addColorStop(1.00, '#363b42');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Darker top collar band under the hot-stage / grid-fin ring (0.00 -> 0.05)
    ctx.fillStyle = 'rgba(32, 36, 42, 0.55)';
    ctx.fillRect(0, 0, w, h * 0.048);

    // Darker mid-booster common bulkhead ring band around y = 0.43 (visible in photo!)
    ctx.fillStyle = 'rgba(38, 42, 48, 0.48)';
    ctx.fillRect(0, h * 0.425, w, h * 0.025);

    // Jagged Cryogenic White Frost Streak & Vertical Spine running down x ~ 0.44 from y = 0.04 to y = 0.66 (matching photo!)
    const frostX = w * 0.442;
    for (let fy = h * 0.03; fy < h * 0.65; fy += 6) {
      const t = (fy - h * 0.03) / (h * 0.62);
      const jitter = Math.sin(fy * 0.08) * 8 + Math.cos(fy * 0.23) * 5;
      const fw = (26 + Math.sin(fy * 0.15) * 10) * (1 - 0.25 * t);
      ctx.fillStyle = 'rgba(238, 241, 246, 0.85)';
      ctx.fillRect(frostX + jitter - fw * 0.5, fy, fw, 7);
      // Dark vertical shadow groove along the center of the raceway spine
      ctx.fillStyle = 'rgba(42, 46, 54, 0.72)';
      ctx.fillRect(frostX + jitter * 0.3 - 3, fy, 6, 7);
    }

    // 18 Horizontal Circumferential Stainless-Steel Weld-Ring Seams along the booster
    for (let r = 1; r <= 18; r++) {
      const ry = (r / 18.5) * h;
      ctx.fillStyle = 'rgba(35, 39, 46, 0.48)';
      ctx.fillRect(0, ry, w, 4);
      ctx.fillStyle = 'rgba(235, 225, 205, 0.24)';
      ctx.fillRect(0, ry + 4, w, 2);
    }
  });
  const superHeavyBodyMat = physical({
    map: boosterTex,
    roughness: 0.40,
    metalness: 0.65,
    roughnessMap: brushed,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.24, 0.24),
  });

  _starshipMats = {
    tileBlackMat,
    darkSteelMat,
    stainlessMat,
    sunlitSteelMat,
    raptorGlowMat,
    raptorRimGlowMat,
    starshipNoseBodyMat,
    starshipMidBodyMat,
    superHeavyBodyMat,
  };
  return _starshipMats;
}

// Stage 3 (Top): SpaceX Starship Ogive Nose Cone in Matte-Black Thermal Tiles &
// Sunlit Stainless Steel + 2 Trapezoidal Forward Aero Flaps (H = 7.2m)
function buildStarshipNose() {
  const g = new THREE.Group();
  const H = PARTS.starshipNose.height; // 7.2
  const {
    tileBlackMat,
    darkSteelMat,
    starshipNoseBodyMat,
  } = getStarshipMaterials();

  // 1. Sculpted Tangent-Ogive Starship Nose Cone (y = 0.0 -> 7.20, rBot = R_SS_CORE = 1.22)
  const ogivePts = [];
  const nOgive = 40;
  for (let i = 0; i <= nOgive; i++) {
    const t = i / nOgive;
    const r = 0.05 + (R_SS_CORE - 0.05) * Math.pow(1 - Math.pow(t, 1.48), 0.66);
    ogivePts.push(new THREE.Vector2(r, t * (H - 0.06)));
  }
  const noseMesh = mesh(new THREE.LatheGeometry(ogivePts, 64), starshipNoseBodyMat);
  g.add(noseMesh);
  // Rounded blunt metallic tip cap at apex (y = 7.16)
  g.add(mesh(new THREE.SphereGeometry(0.055, 16, 12), tileBlackMat, 0, H - 0.04, 0));

  // Subtle horizontal weld rings along the ogive nose cone
  for (const wy of [0.06, 1.85, 3.65, 5.35]) {
    const t = wy / (H - 0.06);
    const rw = 0.05 + (R_SS_CORE - 0.05) * Math.pow(1 - Math.pow(t, 1.48), 0.66) + 0.008;
    g.add(mesh(new THREE.CylinderGeometry(rw, rw, 0.04, 56), darkSteelMat, 0, wy, 0));
  }

  // 2. Two Trapezoidal Forward Aero Flaps (Canards) on Left (-X) & Right (+X) (y = 1.75 -> 5.45, matching photo!)
  for (const sgn of [-1, 1]) {
    const flapShape = new THREE.Shape();
    flapShape.moveTo(sgn * 0.92, 1.75);
    flapShape.lineTo(sgn * 1.76, 2.25); // Lower outer corner
    flapShape.lineTo(sgn * 1.56, 4.35); // Upper outer corner
    flapShape.lineTo(sgn * 0.48, 5.45); // Upper root apex near nose tip
    flapShape.closePath();

    const flapGeo = new THREE.ExtrudeGeometry(flapShape, {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    const flapMesh = mesh(flapGeo, tileBlackMat, 0, 0, -0.045);
    // Slight dihedral/sweep angle matching flight posture in photo
    flapMesh.rotation.y = -sgn * 0.14;
    g.add(flapMesh);

    // Cylindrical aerodynamic hinge root fairing along the forward flap base
    const hinge = mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.55, 16), tileBlackMat, sgn * 0.82, 3.55, 0.04);
    hinge.rotation.z = sgn * 0.24;
    g.add(hinge);
  }

  // Recessed orbital thruster & recovery parachutes
  g.add(mesh(new THREE.CylinderGeometry(R_SS_CORE * 0.86, R_SS_CORE * 0.86, 0.14, 40), darkSteelMat, 0, 0.07, 0));
  const mBell = bellMaterial(true);
  g.add(mesh(bellGeometry(0.18, 0.40, 0.52, 28), mBell, 0, 0, 0));
  addNozzle(g, 0, 0, 0.40, [mBell]);
  addParachutes(g, 6.4);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 2 (Middle): SpaceX Starship Main Barrel with Cryogenic Frost-White Band,
// Black Heat-Shield Wrap, Dark Aft Skirt, 2 Large Aft Aero Flaps, Hot-Staging Ring & 6 Raptors (H = 10.4m)
function buildStarshipShip() {
  const g = new THREE.Group();
  const H = PARTS.starshipShip.height; // 10.4
  const {
    tileBlackMat,
    darkSteelMat,
    stainlessMat,
    sunlitSteelMat,
    starshipMidBodyMat,
  } = getStarshipMaterials();

  const yHotRingTop = 0.65;
  const hMain = H - yHotRingTop; // 9.75

  // 1. Main Cylindrical Starship Barrel (y = 0.65 -> 10.40, r = R_SS_CORE = 1.22)
  //    Upper cryogenic frost-white band + lower dark charcoal-grey aft skirt!
  g.add(mesh(new THREE.CylinderGeometry(R_SS_CORE, R_SS_CORE, hMain, 64), starshipMidBodyMat, 0, yHotRingTop + hMain * 0.5, 0));

  // Circumferential weld-seam rings at key section breaks (y = 0.68, 3.95, 6.15, 8.35, 10.35)
  for (const ry of [0.68, 3.95, 6.15, 8.35, H - 0.04]) {
    g.add(mesh(new THREE.CylinderGeometry(R_SS_CORE + 0.010, R_SS_CORE + 0.010, 0.045, 64), darkSteelMat, 0, ry, 0));
  }

  // Prominent vertical raceway spine on the front-left of the dark aft skirt (y = 0.65 -> 3.85) with sunlit white top cap (visible in photo!)
  const spineAng = -0.14;
  const sx = Math.sin(spineAng) * (R_SS_CORE + 0.035);
  const sz = Math.cos(spineAng) * (R_SS_CORE + 0.035);
  const spine = mesh(new THREE.BoxGeometry(0.14, 3.15, 0.11), darkSteelMat, sx, 2.22, sz);
  spine.rotation.y = spineAng;
  g.add(spine);
  const spineCap = mesh(new THREE.BoxGeometry(0.15, 0.45, 0.12), sunlitSteelMat, sx, 3.65, sz);
  spineCap.rotation.y = spineAng;
  g.add(spineCap);

  // 2. Two Large Trapezoidal Aft Aero Flaps on Left (-X) & Right (+X) of the lower Starship skirt (y = 0.65 -> 4.55, matching photo!)
  for (const sgn of [-1, 1]) {
    const aftFlapShape = new THREE.Shape();
    aftFlapShape.moveTo(sgn * 1.18, 0.68);
    aftFlapShape.lineTo(sgn * 2.15, 1.05); // Lower outer corner
    aftFlapShape.lineTo(sgn * 2.02, 3.45); // Upper outer corner
    aftFlapShape.lineTo(sgn * 1.18, 4.55); // Upper root corner
    aftFlapShape.closePath();

    const aftFlapGeo = new THREE.ExtrudeGeometry(aftFlapShape, {
      depth: 0.11,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.018,
      bevelSegments: 2,
    });
    const aftFlapMesh = mesh(aftFlapGeo, tileBlackMat, 0, 0, -0.055);
    aftFlapMesh.rotation.y = -sgn * 0.12;
    g.add(aftFlapMesh);

    // Cylindrical aerodynamic hinge fairing along the root of each aft flap
    g.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 3.85, 16), tileBlackMat, sgn * (R_SS_CORE + 0.02), 2.60, 0));
  }

  // 3. Vented Stainless-Steel Hot-Staging Interstage Ring at the base of Starship (y = 0.0 -> 0.65)
  g.add(mesh(new THREE.CylinderGeometry(R_SS_CORE + 0.012, R_SS_CORE + 0.012, yHotRingTop, 64), darkSteelMat, 0, yHotRingTop * 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_SS_CORE + 0.024, R_SS_CORE + 0.024, 0.07, 64), stainlessMat, 0, yHotRingTop - 0.03, 0));
  g.add(mesh(new THREE.CylinderGeometry(R_SS_CORE + 0.024, R_SS_CORE + 0.024, 0.07, 64), stainlessMat, 0, 0.04, 0));
  // 36 vertical exhaust vent slots around the Hot-Staging Ring
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const slot = mesh(new THREE.BoxGeometry(0.08, yHotRingTop - 0.18, 0.04), tileBlackMat, Math.sin(a) * (R_SS_CORE + 0.015), yHotRingTop * 0.5, Math.cos(a) * (R_SS_CORE + 0.015));
    slot.rotation.y = a;
    g.add(slot);
  }

  // 4. Six Starship Raptor Engines (3 large RVac bells + 3 center sea-level Raptor bells) tucked inside the base
  for (let i = 0; i < 3; i++) {
    const aVac = (i / 3) * Math.PI * 2;
    const vx = Math.cos(aVac) * 0.72;
    const vz = Math.sin(aVac) * 0.72;
    const mVac = bellMaterial(true);
    g.add(mesh(bellGeometry(0.20, 0.38, 0.58, 28), darkSteelMat, vx, 0, vz));
    addNozzle(g, vx, vz, 0.38, [mVac]);

    const aSl = aVac + Math.PI / 3;
    const sxR = Math.cos(aSl) * 0.30;
    const szR = Math.sin(aSl) * 0.30;
    const mSl = bellMaterial(false);
    g.add(mesh(bellGeometry(0.12, 0.22, 0.44, 20), stainlessMat, sxR, 0, szR));
    addNozzle(g, sxR, szR, 0.22, [mSl]);
  }
  addParachutes(g, H * 0.88);
  if (g.userData.chutePack) g.remove(g.userData.chutePack);

  return g;
}

// Stage 1 (Bottom): SpaceX Super Heavy Booster (B7/B9/B11) in Brushed Stainless Steel
// with 4 Deployed Dark Waffle Grid Fins, Cryogenic Frost Spine, 4 Tall Lower Aerodynamic
// Chines / COPV Fairings & 33 Glowing Golden-White Raptor Engines at the Base (H = 20.6m)
function buildStarshipBooster() {
  const g = new THREE.Group();
  const H = PARTS.starshipBooster.height; // 20.6
  const {
    tileBlackMat,
    darkSteelMat,
    stainlessMat,
    sunlitSteelMat,
    raptorGlowMat,
    raptorRimGlowMat,
    superHeavyBodyMat,
  } = getStarshipMaterials();

  const yNozTop = 0.32;
  const hCyl = H - yNozTop; // 20.28

  // =========================================================================
  // 1. MAIN BRUSHED STAINLESS-STEEL SUPER HEAVY CYLINDER (y = 0.32 -> 20.60, r = 1.22)
  // =========================================================================
  g.add(mesh(new THREE.CylinderGeometry(R_SS_CORE, R_SS_CORE, hCyl, 64), superHeavyBodyMat, 0, yNozTop + hCyl * 0.5, 0));

  // Subtle 3D raised steel weld rings & mid-tank bulkhead ring (y = 11.85)
  for (const ry of [0.42, 7.25, 11.85, 16.20, 19.65, H - 0.05]) {
    g.add(mesh(new THREE.CylinderGeometry(R_SS_CORE + 0.010, R_SS_CORE + 0.010, 0.05, 64), stainlessMat, 0, ry, 0));
  }

  // 3D Raised Vertical Raceway & Cryogenic Frost Spine running down the front-left of the booster (y = 7.25 -> 20.50, matching photo!)
  const spineAng = -0.14;
  const spX = Math.sin(spineAng) * (R_SS_CORE + 0.032);
  const spZ = Math.cos(spineAng) * (R_SS_CORE + 0.032);
  const spineMesh = mesh(new THREE.BoxGeometry(0.14, 13.25, 0.09), sunlitSteelMat, spX, 7.25 + 13.25 * 0.5, spZ);
  spineMesh.rotation.y = spineAng;
  g.add(spineMesh);

  // =========================================================================
  // 2. 4 DEPLOYED DARK-STEEL WAFFLE GRID FINS AT THE TOP COLLAR (y = 20.15)
  //    Extending horizontally outward just below Starship's aft flaps (matching photo!)
  // =========================================================================
  for (const ga of [-1.32, -0.52, 0.52, 1.32]) {
    const finGrp = new THREE.Group();
    finGrp.position.set(Math.sin(ga) * (R_SS_CORE - 0.02), 20.12, Math.cos(ga) * (R_SS_CORE - 0.02));
    finGrp.rotation.y = ga;

    // Outer grid fin frame extending 0.78m radially outward in +Z of finGrp
    finGrp.add(mesh(new THREE.BoxGeometry(0.56, 0.14, 0.78), darkSteelMat, 0, 0, 0.39));
    // Internal crisscross waffle lattice ribs inside each grid fin
    for (const lx of [-0.18, 0.0, 0.18]) {
      finGrp.add(mesh(new THREE.BoxGeometry(0.03, 0.15, 0.76), tileBlackMat, lx, 0, 0.39));
    }
    for (const lz of [0.18, 0.38, 0.58]) {
      finGrp.add(mesh(new THREE.BoxGeometry(0.54, 0.15, 0.03), tileBlackMat, 0, 0, lz));
    }
    g.add(finGrp);
  }

  // =========================================================================
  // 3. 4 TALL PROTRUDING VERTICAL AERODYNAMIC CHINES / COPV FAIRINGS ALONG THE
  //    LOWER THIRD OF THE BOOSTER (y = 0.55 -> 7.25, super prominent in photo!)
  // =========================================================================
  const hChine = 6.70;
  const yChineMid = 0.55 + hChine * 0.5; // 3.90
  const chineConfigs = [
    // [angleRad, width, depth, isSunlitLeft]
    [-0.96, 0.24, 0.22, true],   // Left silhouette chine (bright sunlit outer edge + dark inner face!)
    [-0.22, 0.22, 0.20, false],  // Front-left chine (bold dark vertical bar with sunlit left lip!)
    [0.44, 0.24, 0.20, false],   // Front-right chine (bold dark vertical bar!)
    [1.18, 0.22, 0.18, false],   // Right silhouette chine
  ];
  for (const [ca, cw, cd, isSunlit] of chineConfigs) {
    const cx = Math.sin(ca) * (R_SS_CORE + cd * 0.42);
    const cz = Math.cos(ca) * (R_SS_CORE + cd * 0.42);
    // Main dark shadowed chine body
    const chineBox = mesh(new THREE.BoxGeometry(cw, hChine, cd), tileBlackMat, cx, yChineMid, cz);
    chineBox.rotation.y = ca;
    g.add(chineBox);

    // Sunlit metallic left edge strip on the chines (matching the bright golden-silver vertical edges in the photo!)
    const hlAng = ca - 0.06;
    const hlX = Math.sin(hlAng) * (R_SS_CORE + cd * 0.52);
    const hlZ = Math.cos(hlAng) * (R_SS_CORE + cd * 0.52);
    const hlStrip = mesh(new THREE.BoxGeometry(isSunlit ? 0.10 : 0.055, hChine, cd * 0.85), isSunlit ? sunlitSteelMat : stainlessMat, hlX, yChineMid, hlZ);
    hlStrip.rotation.y = ca;
    g.add(hlStrip);

    // Tapered aerodynamic top cap at y = 7.25
    const cap = mesh(new THREE.CylinderGeometry(0.02, cw * 0.55, 0.38, 12), darkSteelMat, cx, 7.25 + 0.19, cz);
    cap.rotation.y = ca;
    g.add(cap);
  }

  // =========================================================================
  // 4. BRILLIANT GLOWING 33-RAPTOR ENGINE CLUSTER BASE (y = 0.0 -> 0.42)
  //    Exact 3 Center + 10 Middle Ring + 20 Outer Ring Honeycomb Pattern!
  //    Glowing golden-white so the circular base looks identical to the reference photo!
  // =========================================================================
  // Outer protective stainless-steel engine skirt shroud around the 33 Raptors (y = 0.12 -> 0.55)
  g.add(mesh(new THREE.CylinderGeometry(R_SS_CORE + 0.02, R_SS_CORE + 0.035, 0.44, 64, 1, true), darkSteelMat, 0, 0.34, 0));
  // Glowing golden-orange recessed heat-shield baseplate behind the 33 nozzles (y = 0.24)
  g.add(mesh(new THREE.CylinderGeometry(R_SS_CORE - 0.02, R_SS_CORE - 0.02, 0.06, 56), raptorRimGlowMat, 0, 0.24, 0));

  // Helper to place each physical + glowing Raptor nozzle in the 33-engine cluster
  const addRaptor = (rx, rz, rBell, hBell, registerPlume) => {
    // Outer metallic nozzle lip
    g.add(mesh(new THREE.CylinderGeometry(rBell * 0.72, rBell, hBell, 16, 1, true), darkSteelMat, rx, hBell * 0.5, rz));
    // Brilliant incandescent golden-white glowing nozzle interior & exit disc (matching photo!)
    g.add(mesh(new THREE.CylinderGeometry(rBell * 0.68, rBell * 0.92, hBell - 0.02, 16), raptorGlowMat, rx, hBell * 0.5 - 0.01, rz));
    if (registerPlume) {
      const mBell = bellMaterial(true);
      addNozzle(g, rx, rz, rBell * 1.45, [mBell]);
    }
  };

  // Ring 1 (Center): 3 Gimbaled Center Raptors (rRing = 0.20)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    addRaptor(Math.cos(a) * 0.20, Math.sin(a) * 0.20, 0.105, 0.30, true);
  }

  // Ring 2 (Middle): 10 Gimbaled Middle-Ring Raptors (rRing = 0.56)
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.15;
    addRaptor(Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0.102, 0.30, i % 2 === 0);
  }

  // Ring 3 (Outer): 20 Fixed Outer-Ring Raptors (rRing = 0.98)
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    addRaptor(Math.cos(a) * 0.98, Math.sin(a) * 0.98, 0.096, 0.28, i % 4 === 0);
  }

  return g;
}

function buildUfoSaucer() {
  const g = new THREE.Group();
  const neonGreen = new THREE.MeshStandardMaterial({
    color: 0x4ade80,
    emissive: new THREE.Color(0x22c55e),
    emissiveIntensity: 2.2,
    roughness: 0.2,
    metalness: 0.2,
  });
  const neonCyan = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: new THREE.Color(0x0284c7),
    emissiveIntensity: 2.3,
    roughness: 0.2,
    metalness: 0.2,
  });
  const neonPurple = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    emissive: new THREE.Color(0x9333ea),
    emissiveIntensity: 2.0,
    roughness: 0.2,
    metalness: 0.2,
  });
  const alienPilotSkin = new THREE.MeshStandardMaterial({
    color: 0x4ade80,
    emissive: new THREE.Color(0x15803d),
    emissiveIntensity: 0.85,
    roughness: 0.35,
  });

  // 1. Lower Anti-Gravity Saucer Base (y = 0 -> 0.95)
  g.add(mesh(new THREE.CylinderGeometry(1.5, R, 0.36, 48), MAT.darkMetal, 0, 0.18, 0));
  g.add(mesh(new THREE.TorusGeometry(1.22, 0.08, 12, 48).rotateX(Math.PI / 2), neonCyan, 0, 0.18, 0));
  g.add(mesh(new THREE.CylinderGeometry(4.1, 1.5, 0.65, 64), MAT.silver, 0, 0.66, 0));

  // Underbelly glowing anti-gravity concentric rings
  g.add(mesh(new THREE.TorusGeometry(2.35, 0.07, 12, 56).rotateX(Math.PI / 2), neonCyan, 0, 0.45, 0));
  g.add(mesh(new THREE.TorusGeometry(3.25, 0.06, 12, 64).rotateX(Math.PI / 2), neonPurple, 0, 0.68, 0));

  // 2. Main Wide Flying Saucer Disc & Glowing Plasma Rim (y = 0.95 -> 1.85)
  g.add(mesh(new THREE.CylinderGeometry(4.2, 4.1, 0.24, 64), MAT.darkMetal, 0, 1.10, 0));
  g.add(mesh(new THREE.TorusGeometry(4.22, 0.16, 16, 64).rotateX(Math.PI / 2), neonGreen, 0, 1.10, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.85, 4.2, 0.68, 64), MAT.titanium, 0, 1.56, 0));
  g.add(mesh(new THREE.TorusGeometry(1.88, 0.07, 12, 48).rotateX(Math.PI / 2), neonCyan, 0, 1.90, 0));

  // 12 Glowing Plasma Orbs & Radial Rib Panels around the Saucer Disc
  const orbGeo = new THREE.SphereGeometry(0.24, 16, 12);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const mat = i % 3 === 0 ? neonCyan : (i % 2 === 0 ? neonGreen : neonPurple);
    g.add(mesh(orbGeo, mat, Math.cos(a) * 4.20, 1.12, Math.sin(a) * 4.20));
    const rib = mesh(new THREE.BoxGeometry(0.14, 0.12, 2.15), MAT.darkMetal, Math.cos(a) * 2.9, 1.58, Math.sin(a) * 2.9);
    rib.rotation.y = -a + Math.PI / 2;
    rib.rotation.x = 0.26;
    g.add(rib);
  }

  // 3. Pilot & Holographic Console inside the UFO Cockpit (y = 1.85 -> 3.2)
  g.add(mesh(new THREE.CylinderGeometry(1.65, 1.75, 0.18, 36), MAT.darkMetal, 0, 1.94, 0));
  g.add(mesh(new THREE.BoxGeometry(0.75, 0.35, 0.36), MAT.silver, 0, 2.15, 0.55));
  g.add(mesh(new THREE.BoxGeometry(0.62, 0.22, 0.04), neonCyan, 0, 2.38, 0.52));

  // Friendly Alien Pilot Commander inside the dome
  g.add(mesh(new THREE.CylinderGeometry(0.32, 0.45, 0.65, 18), alienPilotSkin, 0, 2.25, -0.05));
  const head = mesh(new THREE.SphereGeometry(0.58, 22, 16), alienPilotSkin, 0, 2.86, -0.02);
  head.scale.set(1.06, 1.22, 0.96);
  g.add(head);
  for (const sgn of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.19, 14, 12), MAT.black, sgn * 0.24, 2.92, 0.46);
    eye.scale.set(1.15, 0.78, 0.65);
    eye.rotation.z = -sgn * 0.32;
    eye.rotation.y = sgn * 0.35;
    g.add(eye);
    const ant = mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.42, 8), alienPilotSkin, sgn * 0.28, 3.45, 0.02);
    ant.rotation.z = -sgn * 0.35;
    g.add(ant);
    g.add(mesh(new THREE.SphereGeometry(0.08, 12, 10), neonCyan, sgn * 0.40, 3.65, 0.02));
  }

  // 4. Transparent Crystal Cockpit Dome (y = 1.90 -> 3.55)
  const domeMat = new THREE.MeshPhysicalMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.42,
    roughness: 0.06,
    metalness: 0.1,
    clearcoat: 1.0,
  });
  g.add(mesh(new THREE.SphereGeometry(1.78, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.52), domeMat, 0, 1.88, 0));

  // Built-in Parachutes & Anti-Gravity Propulsion Nozzle
  addParachutes(g, 3.4);
  const bellM = bellMaterial(true);
  const ufoAgLight = new THREE.PointLight(0x22c55e, 0, 55, 2.0);
  ufoAgLight.position.set(0, 0.45, 0);
  g.add(ufoAgLight);
  g.userData.agLight = ufoAgLight;
  g.userData.cyanGlow = neonCyan;
  g.userData.violetGlow = neonPurple;
  addNozzle(g, 0, 0, 0.95, [bellM, neonCyan, neonPurple], 'antigrav');

  return g;
}

function mergeGroupMeshesByMaterial(rootGroup, excludeSet = new Set()) {
  rootGroup.updateWorldMatrix(true, true);
  const rootInv = new THREE.Matrix4().copy(rootGroup.matrixWorld).invert();
  const byMat = new Map();
  const toRemove = [];

  function walk(node) {
    if (excludeSet.has(node)) return;
    if (node !== rootGroup && !node.visible) return;
    if (node.isMesh && !node.isInstancedMesh && node.geometry && !Array.isArray(node.material)) {
      const pos = node.geometry.getAttribute('position');
      if (pos && pos.count > 0) {
        const g = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
        const rel = new THREE.Matrix4().multiplyMatrices(rootInv, node.matrixWorld);
        g.applyMatrix4(rel);
        if (!g.getAttribute('normal')) g.computeVertexNormals();
        const vCount = g.getAttribute('position').count;
        if (!g.getAttribute('uv')) {
          g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(vCount * 2), 2));
        }
        for (const attrName of Object.keys(g.attributes)) {
          if (attrName !== 'position' && attrName !== 'normal' && attrName !== 'uv') {
            g.deleteAttribute(attrName);
          }
        }
        g.morphAttributes = {};
        let list = byMat.get(node.material);
        if (!list) {
          list = [];
          byMat.set(node.material, list);
        }
        list.push(g);
        toRemove.push(node);
      }
    }
    for (let i = 0; i < node.children.length; i++) {
      walk(node.children[i]);
    }
  }

  walk(rootGroup);

  for (const m of toRemove) {
    if (m.parent) m.parent.remove(m);
    m.geometry.dispose();
  }

  for (const [mat, geos] of byMat.entries()) {
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (geos.length > 1) {
      for (const gg of geos) gg.dispose();
    }
    if (merged) {
      const m = new THREE.Mesh(merged, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      rootGroup.add(m);
    }
  }
}

const DYNAMIC_PARTS = new Set(['legs', 'gridfins', 'wheelsRover', 'gearPlane', 'gunLaser', 'waterCannon', 'gunAcid', 'gunElectric']);

export function buildPart(type) {
  const g = builders[type]();
  if (!DYNAMIC_PARTS.has(type)) {
    const exclude = new Set();
    if (g.userData.tower) {
      mergeGroupMeshesByMaterial(g.userData.tower);
      exclude.add(g.userData.tower);
    }
    if (g.userData.chute) exclude.add(g.userData.chute);
    if (g.userData.chutes) exclude.add(g.userData.chutes);
    if (g.userData.chutePack) exclude.add(g.userData.chutePack);
    mergeGroupMeshesByMaterial(g, exclude);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.type = type;
  return g;
}

/** Positions for radial / side attachments (local to parent part) */
export function radialPlacements(type) {
  if (type === 'fins' || type === 'legs') return [0, 1, 2, 3].map((i) => ({ angle: Math.PI / 4 + i * Math.PI / 2, dist: 0 }));
  if (type === 'gridfins') return [0, 1, 2, 3].map((i) => ({ angle: i * Math.PI / 2, dist: 0 }));
  if (type === 'wheelsRover') {
    return [
      { angle: 0, dist: 1.18, offsetZ: 0.72 },
      { angle: 0, dist: 1.18, offsetZ: -0.72 },
      { angle: Math.PI, dist: 1.18, offsetZ: 0.72 },
      { angle: Math.PI, dist: 1.18, offsetZ: -0.72 },
    ];
  }
  if (type === 'floatsBoat') {
    return [
      { angle: 0, dist: 1.45, offsetZ: 0 },
      { angle: Math.PI, dist: 1.45, offsetZ: 0 },
    ];
  }
  if (type === 'solarRover') {
    return [
      { angle: 0, dist: 1.12, offsetZ: 0 },
      { angle: Math.PI, dist: 1.12, offsetZ: 0 },
    ];
  }
  if (type === 'solarPanel' || type === 'gunLaser' || type === 'waterCannon' || type === 'gunAcid' || type === 'gunElectric') {
    return [
      { angle: 0, dist: R - 0.05, offsetZ: 0 },
      { angle: Math.PI, dist: R - 0.05, offsetZ: 0 },
    ];
  }
  if (type === 'wingsPlane') {
    return [
      { angle: 0, dist: 1.15, offsetZ: 0 },
      { angle: Math.PI, dist: 1.15, offsetZ: 0 },
    ];
  }
  if (type === 'gearPlane') {
    return [
      { angle: 0, dist: 0.95, offsetZ: -0.8 },
      { angle: Math.PI, dist: 0.95, offsetZ: -0.8 },
      { angle: Math.PI / 2, dist: 0.0, offsetZ: 1.8 },
    ];
  }
  const def = PARTS[type];
  if (def && def.kind === 'stack') {
    return [
      { angle: 0, dist: R * 2 + 0.22, offsetZ: 0 },
      { angle: Math.PI, dist: R * 2 + 0.22, offsetZ: 0 },
    ];
  }
  return [0, 1].map((i) => ({ angle: i * Math.PI, dist: R + 0.62 }));
}
