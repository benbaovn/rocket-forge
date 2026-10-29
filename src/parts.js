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
  solarPanel: { name: 'Cánh pin mặt trời ×2', cat: 'Cấu trúc', kind: 'radial', count: 2, dry: 0.12, desc: 'Cặp cánh pin mặt trời đa tầng cung cấp điện năng cho tàu vũ trụ, tên lửa & xe' },
  gunLaser: { name: 'Súng Lazer Siêu Hạng ×2', cat: 'Vũ khí', kind: 'radial', count: 2, dry: 0.05, weapon: 'laser', desc: 'Cặp pháo Lazer xoay 360° bắn tia plasma tốc độ ánh sáng tiêu diệt Alien ngoài vũ trụ, trên hành tinh & mặt trăng (Phím V)' },
  waterCannon: { name: 'Máy Phun Nước 1,000,000 PSI ×2', cat: 'Vũ khí', kind: 'radial', count: 2, dry: 0.05, weapon: 'water', desc: 'Đại bác siêu áp lực 1,000,000 PSI bắn tia nước cắt kim cương đánh bay và nghiền nát Alien (Phím V)' },
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

// ---------------------------------------------------------------- SATURN V AUTHENTIC PARTS
let _saturnMats = null;
function getSaturnMaterials() {
  if (_saturnMats) return _saturnMats;

  const panel = TX.panelTextures();
  // Albedo (~0.38 linear) tuned so sun.intensity=7.0 in LaunchScene stays <1.0 (zero bloom haze) while ACES tone-mapping renders crisp bright white
  const whiteMat = physical({
    color: 0xa4aab4,
    roughness: 0.94,
    roughnessMap: panel.rough,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.26, 0.26),
    metalness: 0.02,
    clearcoat: 0.0,
  });
  const blackMat = physical({
    color: 0x07090d,
    roughness: 0.88,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(0.20, 0.20),
    metalness: 0.03,
    clearcoat: 0.0,
  });

  // Decal 1: Red vertical "U S A" + U.S. Flag panel for Stage 1 (S-IC)
  // Mapped onto fatter Saturn V cylinder (RS = R * 1.92 = 2.40 m):
  // arc width = 0.76 * 2.40 = 1.824 m, height = 15.65 m (aspect 1 : 8.58)
  // Using 256 x 2048 canvas -> 1m wide = 140 px, 1m tall = 131 px -> vertical scale factor = 131 / 140 = 0.935
  const cUsa = document.createElement('canvas');
  cUsa.width = 256; cUsa.height = 2048;
  const xUsa = cUsa.getContext('2d');
  xUsa.clearRect(0, 0, 256, 2048);

  const vScale = 0.935;
  // Draw horizontal U.S. Flag in upper-mid section (centered at x=128, y=740)
  xUsa.save();
  xUsa.translate(128, 740);
  xUsa.scale(1, vScale);
  const fw = 128, fh = 76;
  const fx = -fw / 2, fy = -fh / 2;
  xUsa.fillStyle = '#c8ced8';
  xUsa.fillRect(fx, fy, fw, fh);
  const sh = fh / 13;
  xUsa.fillStyle = '#9e1120';
  for (let s = 0; s < 13; s += 2) {
    xUsa.fillRect(fx, fy + s * sh, fw, sh);
  }
  const cw = fw * 0.44, ch = sh * 7;
  xUsa.fillStyle = '#0e2052';
  xUsa.fillRect(fx, fy, cw, ch);
  xUsa.fillStyle = '#cdd3dc';
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      xUsa.fillRect(fx + 4 + c * ((cw - 8) / 6), fy + 3.5 + r * ((ch - 7) / 5), 2.8, 2.8);
    }
  }
  xUsa.strokeStyle = 'rgba(0,0,0,0.35)';
  xUsa.lineWidth = 2;
  xUsa.strokeRect(fx, fy, fw, fh);
  xUsa.restore();

  // Bold crimson vertical "U S A" in lower white channel (y = 1440..1860)
  for (const [ch, cy] of [['U', 1470], ['S', 1650], ['A', 1830]]) {
    xUsa.save();
    xUsa.translate(128, cy);
    xUsa.scale(1, vScale);
    xUsa.fillStyle = '#a81020';
    xUsa.font = '900 80px "Orbitron", "Arial Black", "Arial", sans-serif';
    xUsa.textAlign = 'center';
    xUsa.textBaseline = 'middle';
    xUsa.fillText(ch, 0, 0);
    xUsa.restore();
  }

  const texUsa = new THREE.CanvasTexture(cUsa);
  texUsa.colorSpace = THREE.SRGBColorSpace;
  texUsa.anisotropy = 8;
  const usaDecalMat = new THREE.MeshPhysicalMaterial({
    map: texUsa,
    transparent: true,
    roughness: 0.9,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    depthWrite: false,
  });

  // Decal 2: Vertical "UNITED STATES" lettering for Stage 2 (S-II) upper white tank
  const cUS = document.createElement('canvas');
  cUS.width = 128; cUS.height = 1024;
  const xUS = cUS.getContext('2d');
  xUS.clearRect(0, 0, 128, 1024);
  const chars = 'UNITED STATES';
  for (let i = 0; i < chars.length; i++) {
    xUS.save();
    xUS.translate(64, 60 + i * 72);
    xUS.scale(1, 0.85);
    xUS.fillStyle = '#181c24';
    xUS.font = 'bold 34px "Orbitron", "Arial", sans-serif';
    xUS.textAlign = 'center';
    xUS.textBaseline = 'middle';
    xUS.fillText(chars[i], 0, 0);
    xUS.restore();
  }
  const texUS = new THREE.CanvasTexture(cUS);
  texUS.colorSpace = THREE.SRGBColorSpace;
  texUS.anisotropy = 8;
  const usDecalMat = new THREE.MeshPhysicalMaterial({
    map: texUS,
    transparent: true,
    roughness: 0.9,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    depthWrite: false,
  });

  _saturnMats = { whiteMat, blackMat, usaDecalMat, usDecalMat };
  return _saturnMats;
}

const RS = R * 1.92;          // Saturn V fat main body radius = 2.40 m (4.80 m diameter!)
const RS_S4B = RS * 0.65;     // S-IVB Stage 3 radius = 1.56 m
const RS_SM = RS * 0.40;      // Apollo Service/Command Module radius = 0.96 m

// Stage 8 (Top): Apollo Command Module (CM) in white Boost Protective Cover + Launch Escape System (LES) tower
function buildSaturnApollo() {
  const g = new THREE.Group();
  const { whiteMat } = getSaturnMaterials();
  const rSM = RS_SM; // 0.96 m

  // 1. Apollo Command Module (CM) white Boost Protective Cover cone (y = 0.0 -> 2.05)
  const cmCone = new THREE.CylinderGeometry(0.24, rSM, 2.05, 64);
  g.add(mesh(cmCone, whiteMat, 0, 1.025, 0));
  g.add(mesh(new THREE.CylinderGeometry(rSM + 0.012, rSM + 0.012, 0.10, 64), whiteMat, 0, 0.05, 0));
  // Flared white collar at top of CM cone (y = 2.05)
  g.add(mesh(new THREE.CylinderGeometry(0.34, 0.27, 0.15, 48), whiteMat, 0, 2.05, 0));

  // 2. Launch Escape System (LES) white tower & spire needle (y = 2.05 -> 6.20)
  const tower = new THREE.Group();
  tower.name = 'tower';
  g.add(tower);
  g.userData.tower = tower;

  const tBase = 2.05;
  const legGeo = new THREE.CylinderGeometry(0.038, 0.045, 0.92, 8);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const leg = mesh(legGeo, whiteMat, Math.sin(a) * 0.20, tBase + 0.44, Math.cos(a) * 0.20);
    leg.rotation.z = -Math.cos(a) * 0.08;
    leg.rotation.x = Math.sin(a) * 0.08;
    tower.add(leg);
  }
  // Flared skirt / 4 downward escape nozzles
  tower.add(mesh(new THREE.CylinderGeometry(0.21, 0.29, 0.24, 32), whiteMat, 0, tBase + 0.90, 0));
  // Escape motor body
  tower.add(mesh(new THREE.CylinderGeometry(0.18, 0.21, 1.38, 32), whiteMat, 0, tBase + 1.68, 0));
  // Tower mid collar & conical Q-ball shoulder
  tower.add(mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.12, 32), whiteMat, 0, tBase + 2.40, 0));
  tower.add(mesh(new THREE.CylinderGeometry(0.075, 0.195, 0.46, 32), whiteMat, 0, tBase + 2.68, 0));
  // Tall white Q-ball probe spire at the very tip (y = 4.96 -> 6.20)
  tower.add(mesh(new THREE.CylinderGeometry(0.028, 0.062, 1.24, 24), whiteMat, 0, tBase + 3.53, 0));

  // Parachutes & recessed nozzle for capsule return
  addParachutes(g, 1.55);
  const cmMat = bellMaterial(true);
  g.add(mesh(bellGeometry(0.12, 0.34, 0.45), cmMat, 0, 0.02, 0));
  addNozzle(g, 0, 0, 0.34, [cmMat]);

  return g;
}

// Stage 7: Apollo Service Module (SM) with silver/grey radiator panel block, RCS quads & SPS engine
function buildSaturnSM() {
  const g = new THREE.Group();
  const { whiteMat } = getSaturnMaterials();
  const H = PARTS.saturnSM.height; // 2.6 m
  const rSM = RS_SM;               // 0.96 m
  const th0 = 0.52;

  g.add(mesh(new THREE.CylinderGeometry(rSM, rSM, H, 64), whiteMat, 0, H / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(rSM + 0.012, rSM + 0.012, 0.12, 64), whiteMat, 0, 0.06, 0));

  // Distinct dark silver/grey rectangular radiator / panel block on the upper right side of SM (matching the photo)
  for (let i = 0; i < 2; i++) {
    const ang = th0 + i * Math.PI + 0.36;
    const radPanel = mesh(
      new THREE.CylinderGeometry(rSM + 0.018, rSM + 0.018, 1.18, 24, 1, true, ang - 0.32, 0.64),
      MAT.darkMetal,
      0,
      H - 0.68,
      0
    );
    g.add(radPanel);
  }
  // 4 SM RCS thruster quads
  for (let i = 0; i < 4; i++) {
    const a = th0 + i * Math.PI / 2 + Math.PI / 4;
    const rcs = mesh(new THREE.BoxGeometry(0.11, 0.20, 0.11), MAT.silver, Math.sin(a) * (rSM + 0.038), H - 0.62, Math.cos(a) * (rSM + 0.038));
    g.add(rcs);
  }

  // SPS vacuum engine nozzle
  const spsMat = bellMaterial(true);
  g.add(mesh(bellGeometry(0.18, 0.56, 0.95), spsMat, 0, 0.02, 0));
  addNozzle(g, 0, 0, 0.56, [spsMat]);

  return g;
}

// Stage 6: Spacecraft-LM Adapter (SLA) white conical frustum + Lunar Module propulsion
function buildSaturnSLA() {
  const g = new THREE.Group();
  const { whiteMat } = getSaturnMaterials();
  const H = PARTS.saturnSLA.height; // 4.2 m
  const rBottom = RS_S4B;           // 1.56 m (matches top of S-IVB)
  const rTop = RS_SM;               // 0.96 m (matches bottom of SM)

  const slaGeo = new THREE.CylinderGeometry(rTop, rBottom, H, 64, 1, false);
  g.add(mesh(slaGeo, whiteMat, 0, H / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(rBottom + 0.014, rBottom + 0.014, 0.16, 64), whiteMat, 0, 0.08, 0));

  const lmMat = bellMaterial(true);
  g.add(mesh(bellGeometry(0.20, 0.68, 1.15), lmMat, 0, 0.02, 0));
  addNozzle(g, 0, 0, 0.68, [lmMat]);

  return g;
}

// Stage 5: S-IVB Cylindrical Upper Stage with bold horizontal black band & 1x J-2 engine
function buildSaturnS4B() {
  const g = new THREE.Group();
  const { whiteMat, blackMat } = getSaturnMaterials();
  const H = PARTS.saturnS4B.height; // 8.6 m
  const r3 = RS_S4B;                // 1.56 m
  const th0 = 0.52;

  // Cylindrical S-IVB tank
  g.add(mesh(new THREE.CylinderGeometry(r3, r3, H, 64), whiteMat, 0, H / 2, 0));

  // Bold horizontal black band near top of S-IVB (y = 6.45 -> 7.55)
  g.add(mesh(new THREE.CylinderGeometry(r3 + 0.016, r3 + 0.016, 1.10, 64), blackMat, 0, 7.00, 0));

  // Bottom white structural ring & small white APS / ullage thruster fairings
  g.add(mesh(new THREE.CylinderGeometry(r3 + 0.014, r3 + 0.014, 0.18, 64), whiteMat, 0, 0.09, 0));
  for (let i = 0; i < 4; i++) {
    const a = th0 + i * Math.PI / 2 + Math.PI / 4;
    const uf = mesh(new THREE.BoxGeometry(0.16, 0.85, 0.22), whiteMat, Math.sin(a) * (r3 + 0.03), 0.60, Math.cos(a) * (r3 + 0.03));
    uf.rotation.y = a;
    g.add(uf);
  }

  // Single J-2 vacuum engine
  const j2Mat = bellMaterial(true);
  g.add(mesh(bellGeometry(0.24, 0.88, 1.65), j2Mat, 0, 0.02, 0));
  addNozzle(g, 0, 0, 0.88, [j2Mat]);

  return g;
}

// Stage 4: Conical S-IVB / S-II Aft Interstage Frustum with stepped black-and-white roll pattern
function buildSaturnS4BInter() {
  const g = new THREE.Group();
  const { whiteMat, blackMat } = getSaturnMaterials();
  const hFrustum = PARTS.saturnS4BInter.height; // 3.6 m
  const r3 = RS_S4B;                            // 1.56 m
  const th0 = 0.52;

  const frustumGeo = new THREE.CylinderGeometry(r3, RS, hFrustum, 72, 1, false);
  g.add(mesh(frustumGeo, whiteMat, 0, hFrustum / 2, 0));

  // Conformal 3D black roll-pattern blocks on the conical frustum (matching the stepped black block in the photo)
  const yBotBlk = 0.44;
  const yTopBlk = hFrustum - 0.16;
  const yMidBlk = yBotBlk + (yTopBlk - yBotBlk) * 0.46;
  const rAt = (y) => RS + (r3 - RS) * (y / hFrustum) + 0.016;

  for (let i = 0; i < 2; i++) {
    const baseAng = th0 + i * Math.PI - 0.92;
    const fullH = yTopBlk - yBotBlk;
    const fullGeo = new THREE.CylinderGeometry(
      rAt(yTopBlk),
      rAt(yBotBlk),
      fullH,
      36,
      1,
      true,
      baseAng,
      1.12
    );
    g.add(mesh(fullGeo, blackMat, 0, (yTopBlk + yBotBlk) / 2, 0));

    const stepH = yTopBlk - yMidBlk;
    const stepGeo = new THREE.CylinderGeometry(
      rAt(yTopBlk),
      rAt(yMidBlk),
      stepH,
      24,
      1,
      true,
      baseAng + 1.12,
      0.46
    );
    g.add(mesh(stepGeo, blackMat, 0, (yTopBlk + yMidBlk) / 2, 0));
  }

  // Crisp white structural collar at bottom of frustum
  g.add(mesh(new THREE.CylinderGeometry(RS + 0.018, RS + 0.018, 0.38, 72), whiteMat, 0, 0.19, 0));

  // 4 Ullage thrusters recessed inside interstage
  for (const [x, z] of [[0.78, 0.78], [-0.78, 0.78], [0.78, -0.78], [-0.78, -0.78]]) {
    const m = bellMaterial(true);
    g.add(mesh(bellGeometry(0.12, 0.35, 0.75), m, x, 0.02, z));
    addNozzle(g, x, z, 0.35, [m]);
  }

  return g;
}

// Stage 3: S-II Upper White Cylindrical Tank with vertical "UNITED STATES" lettering & 5x J-2 engines
function buildSaturnS2() {
  const g = new THREE.Group();
  const { whiteMat, usDecalMat } = getSaturnMaterials();
  const H = PARTS.saturnS2.height; // 11.4 m
  const th0 = 0.52;

  // Main S-II full-radius white cylinder (RS = 2.40 m)
  const bodyGeo = new THREE.CylinderGeometry(RS, RS, H, 72, 1, false);
  g.add(mesh(bodyGeo, whiteMat, 0, H / 2, 0));

  // Crisp white structural rings at bottom and top of S-II
  for (const ry of [0.16, H * 0.5, H - 0.18]) {
    g.add(mesh(new THREE.CylinderGeometry(RS + 0.018, RS + 0.018, 0.24, 72), whiteMat, 0, ry, 0));
  }

  // External vertical white cable raceway on the S-II body
  for (let i = 0; i < 4; i++) {
    const a = th0 + Math.PI / 4 + i * Math.PI / 2;
    const race = mesh(new THREE.BoxGeometry(0.14, H - 0.5, 0.14), whiteMat, Math.sin(a) * (RS + 0.045), H / 2, Math.cos(a) * (RS + 0.045));
    race.rotation.y = a;
    g.add(race);
  }

  // Vertical "UNITED STATES" decals on the white cylinder (flanking left & right as in the photo)
  for (let i = 0; i < 4; i++) {
    for (const off of [-0.36, 0.44]) {
      const a = th0 + i * Math.PI / 2 + off;
      const decGeo = new THREE.CylinderGeometry(RS + 0.02, RS + 0.02, 6.6, 16, 1, true, a - 0.13, 0.26);
      g.add(mesh(decGeo, usDecalMat, 0, H * 0.52, 0));
    }
  }

  // 5 J-2 engines at the base (1 center + 4 outer quad scaled to RS)
  for (const [x, z] of [[0, 0], [0.92, 0.92], [-0.92, 0.92], [0.92, -0.92], [-0.92, -0.92]]) {
    const m = bellMaterial();
    g.add(mesh(bellGeometry(0.20, 0.62, 1.35), m, x, 0.02, z));
    addNozzle(g, x, z, 0.62, [m]);
  }

  return g;
}

// Stage 2: S-II / S-IC Interstage Ring with vertical black-and-white roll stripes, horizontal black bar & ullage rockets
function buildSaturnS2Inter() {
  const g = new THREE.Group();
  const { whiteMat, blackMat } = getSaturnMaterials();
  const H = PARTS.saturnS2Inter.height; // 4.8 m
  const th0 = 0.52;

  const bodyGeo = new THREE.CylinderGeometry(RS, RS, H, 72, 1, false);
  g.add(mesh(bodyGeo, whiteMat, 0, H / 2, 0));

  // Conformal 3D black-and-white roll pattern (matching the photo!)
  for (let i = 0; i < 2; i++) {
    const base = th0 + i * Math.PI;
    // Left wide vertical black block, right vertical black block, and far-right edge black block
    for (const [sOff, sLen] of [[-0.90, 0.68], [0.16, 0.44], [0.84, 0.46]]) {
      const vBlk = new THREE.CylinderGeometry(RS + 0.016, RS + 0.016, 3.30, 24, 1, true, base + sOff, sLen);
      g.add(mesh(vBlk, blackMat, 0, 0.65 + 1.65, 0));
    }
    // Continuous upper horizontal black band above the narrow white separator line
    const hBand = new THREE.CylinderGeometry(RS + 0.016, RS + 0.016, 0.36, 36, 1, true, base - 0.90, 1.50);
    g.add(mesh(hBand, blackMat, 0, 4.30, 0));
  }

  // Crisp white structural rings at bottom and top of interstage
  for (const ry of [0.16, 0.56, H - 0.14]) {
    g.add(mesh(new THREE.CylinderGeometry(RS + 0.018, RS + 0.018, 0.22, 72), whiteMat, 0, ry, 0));
  }

  // Protruding vertical ullage fairings on the left/right edges of the S-II interstage
  for (let i = 0; i < 4; i++) {
    const a = th0 + Math.PI / 4 + i * Math.PI / 2;
    const uf = mesh(new THREE.BoxGeometry(0.18, 2.45, 0.22), whiteMat, Math.sin(a) * (RS + 0.07), 2.40, Math.cos(a) * (RS + 0.07));
    uf.rotation.y = a;
    g.add(uf);
  }

  // Ullage solid rocket nozzles at base
  for (const [x, z] of [[0.95, 0.95], [-0.95, 0.95], [0.95, -0.95], [-0.95, -0.95]]) {
    const m = bellMaterial();
    g.add(mesh(bellGeometry(0.14, 0.42, 0.85), m, x, 0.02, z));
    addNozzle(g, x, z, 0.42, [m]);
  }

  return g;
}

// Stage 1 (Bottom): Giant S-IC First Stage with U.S. Flag, red vertical "U S A", 4 black stripes, 4 fins & 5x F-1 engines
function buildSaturnS1() {
  const g = new THREE.Group();
  const { whiteMat, blackMat, usaDecalMat } = getSaturnMaterials();
  const H = PARTS.saturnS1.height; // 17.6 m
  const engH = 1.95;               // Exposed height of the 5 massive F-1 engine bells at the base
  const bodyH = H - engH;          // 15.65 m cylindrical S-IC tank body
  const stripeH = 5.65;            // Height of the 4 lower vertical black stripes
  const th0 = 0.52;                // Camera-facing center angle (~30 deg)

  // 1. Main S-IC cylindrical white body (y = engH -> H, radius RS = 2.40 m)
  const bodyGeo = new THREE.CylinderGeometry(RS, RS, bodyH, 72, 1, false);
  g.add(mesh(bodyGeo, whiteMat, 0, engH + bodyH / 2, 0));

  // 2. 4 Conformal 3D vertical black stripes at th0 +/- 45 deg (so two black stripes frame the left & right edges of the center white "USA" panel!)
  for (let i = 0; i < 4; i++) {
    const a = th0 + Math.PI / 4 + i * Math.PI / 2;
    const thetaLen = 0.84;
    const blkStripe = new THREE.CylinderGeometry(
      RS + 0.016,
      RS + 0.016,
      stripeH,
      24,
      1,
      true,
      a - thetaLen / 2,
      thetaLen
    );
    g.add(mesh(blkStripe, blackMat, 0, engH + stripeH / 2, 0));
  }

  // 3. 4 Decals with U.S. Flag (mid-upper white tank) + Red vertical "U S A" (centered at th0 + i*90 deg, facing the camera!)
  for (let i = 0; i < 4; i++) {
    const a = th0 + i * Math.PI / 2;
    const decArc = 0.76;
    const decGeo = new THREE.CylinderGeometry(
      RS + 0.022,
      RS + 0.022,
      bodyH,
      24,
      1,
      true,
      a - decArc / 2,
      decArc
    );
    g.add(mesh(decGeo, usaDecalMat, 0, engH + bodyH / 2, 0));
  }

  // Base heat shield plate at y = engH
  g.add(mesh(new THREE.CylinderGeometry(RS + 0.03, RS + 0.03, 0.22, 72), MAT.heatShield, 0, engH + 0.11, 0));
  // Mid-tank & top white structural rings
  g.add(mesh(new THREE.CylinderGeometry(RS + 0.022, RS + 0.022, 0.22, 72), whiteMat, 0, engH + stripeH + 0.11, 0));
  g.add(mesh(new THREE.CylinderGeometry(RS + 0.022, RS + 0.022, 0.22, 72), whiteMat, 0, engH + bodyH * 0.72, 0));
  g.add(mesh(new THREE.CylinderGeometry(RS + 0.022, RS + 0.022, 0.26, 72), whiteMat, 0, H - 0.13, 0));

  // External white LOX feedline tunnels along the 4 black stripe axes on the upper white section
  const tunnelH = bodyH - stripeH - 0.4;
  for (let i = 0; i < 4; i++) {
    const a = th0 + Math.PI / 4 + i * Math.PI / 2;
    const conduit = mesh(
      new THREE.CylinderGeometry(0.09, 0.09, tunnelH, 12),
      whiteMat,
      Math.sin(a) * (RS + 0.06),
      engH + stripeH + 0.20 + tunnelH / 2,
      Math.cos(a) * (RS + 0.06)
    );
    g.add(conduit);
  }

  // 4. 4 Conical Aerodynamic F-1 Engine Fairings + 4 White Swept Trapezoidal Saturn V Fins aligned with the 4 black stripes (th0 +/- 45 deg)
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0.08);
  finShape.lineTo(1.78, -0.22);
  finShape.lineTo(1.78, 0.65);
  finShape.lineTo(0, 2.45);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.09,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  finGeo.translate(0, 0, -0.045);

  for (let i = 0; i < 4; i++) {
    const a = th0 + Math.PI / 4 + i * Math.PI / 2;
    const pivot = new THREE.Group();
    pivot.rotation.y = Math.PI / 2 - a;
    g.add(pivot);

    // Conical fairing flaring out over the outer F-1 engine mount (y = engH -> engH + 3.65)
    const fairGeo = new THREE.CylinderGeometry(0.14, 0.78, 3.55, 32);
    const fairing = mesh(fairGeo, blackMat, RS - 0.06, engH + 1.82, 0);
    fairing.rotation.z = 0.13;
    pivot.add(fairing);

    // White base collar at the bottom of the conical fairing (just like the photo!)
    const collar = mesh(new THREE.CylinderGeometry(0.80, 0.84, 0.30, 32), whiteMat, RS + 0.18, engH + 0.15, 0);
    pivot.add(collar);

    // Iconic white swept Saturn V fin extending outward from the fairing
    const finMesh = mesh(finGeo, whiteMat, RS + 0.28, engH + 0.10, 0);
    pivot.add(finMesh);
  }

  // 5. 5 Massive F-1 Engine Bells at the bottom (1 center + 4 outer aligned with the 4 fairings)
  const f1Positions = [[0, 0]];
  for (let i = 0; i < 4; i++) {
    const a = th0 + Math.PI / 4 + i * Math.PI / 2;
    f1Positions.push([Math.sin(a) * 1.56, Math.cos(a) * 1.56]);
  }
  for (const [x, z] of f1Positions) {
    const mUpper = bellMaterial(false);
    const mLower = bellMaterial(true);
    g.add(mesh(bellGeometry(0.30, 0.82, engH, 48, 0.42, 1.0), mUpper, x, 0, z));
    g.add(mesh(bellGeometry(0.30, 0.82, engH, 48, 0.0, 0.42), mLower, x, 0, z));
    g.add(mesh(new THREE.TorusGeometry(0.60, 0.048, 10, 32).rotateX(Math.PI / 2), MAT.copper, x, engH * 0.42, z));
    addNozzle(g, x, z, 0.82, [mUpper, mLower]);
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

const DYNAMIC_PARTS = new Set(['legs', 'gridfins', 'wheelsRover', 'gearPlane', 'gunLaser', 'waterCannon']);

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
  if (type === 'solarPanel' || type === 'gunLaser' || type === 'waterCannon') {
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
