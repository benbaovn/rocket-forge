// Mission definitions: objectives are evaluated against LaunchScene state every frame.
export const MISSIONS = [
  {
    id: 'free', icon: '🌌', name: 'Bay tự do', preset: null,
    desc: 'Tự do lắp ráp và bay. Lái tự động (G) đưa tên lửa lên quỹ đạo 80 km; tầng có chân hạ cánh sẽ tự bay về.',
    objectives: [],
  },
  {
    id: 'alien100', icon: '👽', name: 'Tiêu diệt 100 Alien (Không tự lái)', preset: 'Chiến Hạm Diệt Alien (Lazer + Nước 1M PSI)',
    noAutopilot: true,
    desc: 'Tự điều khiển tàu chiến lên vũ trụ hoặc các hành tinh/mặt trăng và tiêu diệt đủ 100 UFO Alien bằng Súng Lazer hoặc Máy Phun Nước 1,000,000 PSI (Không có chế độ Lái tự động).',
    objectives: [
      { id: 'kill25', text: 'Tiêu diệt 25 UFO Alien' },
      { id: 'kill50', text: 'Tiêu diệt 50 UFO Alien' },
      { id: 'kill100', text: 'Tiêu diệt đủ 100 UFO Alien' },
    ],
  },
  {
    id: 'alien500', icon: '👾', name: 'Đại chiến 500 Alien (Không tự lái)', preset: 'Chiến Hạm Diệt Alien (Lazer + Nước 1M PSI)',
    noAutopilot: true,
    desc: 'Chiến dịch quy mô tổng lực: Tự tay lái chiến hạm tiêu diệt đủ 500 UFO Alien trên khắp Hệ Mặt Trời và Không gian Liên sao bằng Súng Lazer, Máy Phun Nước hoặc Siêu Tân Tinh (Không có chế độ Lái tự động).',
    objectives: [
      { id: 'kill100', text: 'Tiêu diệt 100 UFO Alien' },
      { id: 'kill250', text: 'Tiêu diệt 250 UFO Alien' },
      { id: 'kill500', text: 'Tiêu diệt toàn bộ 500 UFO Alien' },
    ],
  },
  {
    id: 'orbit', icon: '🛰', name: 'Lên quỹ đạo', preset: 'Hai tầng (khuyên dùng)',
    desc: 'Đưa tên lửa vào quỹ đạo ổn định quanh Trái Đất (cận điểm trên 70 km).',
    objectives: [
      { id: 'space', text: 'Vượt đường Kármán (70 km)' },
      { id: 'orbit', text: 'Vào quỹ đạo: cận điểm > 70 km' },
    ],
  },
  {
    id: 'recover', icon: '🦅', name: 'Thu hồi tầng đẩy', preset: 'Đại Bàng 9 (tái sử dụng)',
    desc: 'Phóng như SpaceX: tầng 1 tách sớm, lật đầu, đốt quay về và tự hạ cánh trên bãi đáp hoặc sà lan giữa biển.',
    objectives: [
      { id: 'sep', text: 'Tách tầng 1 có chân hạ cánh' },
      { id: 'boosterLanded', text: 'Tầng 1 hạ cánh an toàn' },
      { id: 'orbit', text: 'Tầng 2 vào quỹ đạo' },
    ],
  },
  {
    id: 'iss', icon: '🛸', name: 'Ghép nối ISS', preset: 'Tàu chở khách (ISS)',
    desc: 'Lên quỹ đạo chờ, đuổi theo trạm ISS ở độ cao 400 km rồi ghép nối bằng cổng docking (RCS: I/K/J/L/H/N).',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo chờ' },
      { id: 'near', text: 'Tiếp cận ISS (< 1 km)' },
      { id: 'docked', text: 'Ghép nối thành công' },
    ],
  },
  {
    id: 'moon', icon: '🌕', name: 'Lên Mặt Trăng', preset: 'Apollo (Mặt Trăng)',
    desc: 'Chuyến bay Apollo: quỹ đạo chờ → TLI → vào quỹ đạo Mặt Trăng → hạ cánh → cắm cờ → cất cánh → quay về Trái Đất và hạ dù.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'moonSOI', text: 'Vào vùng hấp dẫn Mặt Trăng' },
      { id: 'lunarOrbit', text: 'Vào quỹ đạo Mặt Trăng' },
      { id: 'moonLanded', text: 'Hạ cánh xuống Mặt Trăng' },
      { id: 'moonLeft', text: 'Cất cánh rời Mặt Trăng' },
      { id: 'home', text: 'Trở về Trái Đất an toàn' },
    ],
  },
  {
    id: 'venus', icon: '🟡', name: 'Thám hiểm Sao Kim', preset: 'Apollo (Mặt Trăng)',
    desc: 'Bay liên hành tinh tới Sao Kim (Venus), vào quỹ đạo và hạ cánh xuyên qua bầu khí quyển vàng rực.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'venusSOI', text: 'Vào vùng hấp dẫn Sao Kim' },
      { id: 'venusOrbit', text: 'Vào quỹ đạo Sao Kim' },
      { id: 'venusLanded', text: 'Hạ cánh xuống Sao Kim' },
    ],
  },
  {
    id: 'mars', icon: '🔴', name: 'Chinh phục Sao Hỏa', preset: 'Apollo (Mặt Trăng)',
    desc: 'Hành trình tới Hành tinh Đỏ (Mars): chuyển quỹ đạo liên hành tinh, đốt hãm vào quỹ đạo Sao Hỏa và hạ cánh cắm cờ.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'marsSOI', text: 'Vào vùng hấp dẫn Sao Hỏa' },
      { id: 'marsOrbit', text: 'Vào quỹ đạo Sao Hỏa' },
      { id: 'marsLanded', text: 'Hạ cánh xuống Sao Hỏa' },
    ],
  },
  {
    id: 'phobos', icon: '🪨', name: 'Vệ tinh Sao Hỏa (Phobos)', preset: 'Apollo (Mặt Trăng)',
    desc: 'Bay tới hệ vệ tinh Phobos & Deimos của Sao Hỏa, vào quỹ đạo và đáp xuống bề mặt Phobos trọng lực thấp.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'phobosSOI', text: 'Vào vùng hấp dẫn Phobos' },
      { id: 'phobosOrbit', text: 'Vào quỹ đạo Phobos' },
      { id: 'phobosLanded', text: 'Hạ cánh xuống Phobos' },
    ],
  },
  {
    id: 'deimos', icon: '🪨', name: 'Hạ cánh lên Deimos', preset: 'Apollo (Mặt Trăng)',
    desc: 'Bay liên hành tinh tới hệ vệ tinh của Sao Hỏa, vào quỹ đạo và hạ cánh xuống bề mặt vệ tinh ngoài Deimos.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'deimosSOI', text: 'Vào vùng hấp dẫn Deimos' },
      { id: 'deimosOrbit', text: 'Vào quỹ đạo Deimos' },
      { id: 'deimosLanded', text: 'Hạ cánh xuống Deimos' },
    ],
  },
  {
    id: 'ceres', icon: '🪨', name: 'Thám hiểm Tiểu hành tinh Ceres', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Bay vào Vành đai Tiểu hành tinh chính giữa Sao Hỏa và Sao Mộc, vào quỹ đạo và đáp xuống tiểu hành tinh / hành tinh lùn Ceres với hố va chạm Occator sáng rực.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'ceresSOI', text: 'Vào vùng hấp dẫn Ceres' },
      { id: 'ceresOrbit', text: 'Vào quỹ đạo Ceres' },
      { id: 'ceresLanded', text: 'Hạ cánh xuống Ceres' },
    ],
  },
  {
    id: 'mercury', icon: '⚪', name: 'Hành trình Sao Thủy', preset: 'Apollo (Mặt Trăng)',
    desc: 'Bay xa tới Sao Thủy (Mercury), vào quỹ đạo và đáp xuống bề mặt đầy hố thiên thạch cổ đại.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'mercurySOI', text: 'Vào vùng hấp dẫn Sao Thủy' },
      { id: 'mercuryOrbit', text: 'Vào quỹ đạo Sao Thủy' },
      { id: 'mercuryLanded', text: 'Hạ cánh xuống Sao Thủy' },
    ],
  },
  {
    id: 'io', icon: '🌋', name: 'Hạ cánh lên Io', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Bay tới hệ vệ tinh Sao Mộc và hạ cánh xuống Io – mặt trăng núi lửa hoạt động mạnh nhất Hệ Mặt Trời.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'ioSOI', text: 'Vào vùng hấp dẫn Io' },
      { id: 'ioOrbit', text: 'Vào quỹ đạo Io' },
      { id: 'ioLanded', text: 'Hạ cánh xuống Io' },
    ],
  },
  {
    id: 'europa', icon: '🧊', name: 'Hạ cánh lên Europa', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Thám hiểm mặt trăng băng giá Europa của Sao Mộc, vào quỹ đạo và đáp xuống lớp vỏ băng nứt nẻ.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'europaSOI', text: 'Vào vùng hấp dẫn Europa' },
      { id: 'europaOrbit', text: 'Vào quỹ đạo Europa' },
      { id: 'europaLanded', text: 'Hạ cánh xuống Europa' },
    ],
  },
  {
    id: 'ganymede', icon: '🌕', name: 'Hạ cánh lên Ganymede', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Chinh phục Ganymede – mặt trăng lớn nhất Hệ Mặt Trời quay quanh Sao Mộc, vào quỹ đạo và hạ cánh an toàn.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'ganymedeSOI', text: 'Vào vùng hấp dẫn Ganymede' },
      { id: 'ganymedeOrbit', text: 'Vào quỹ đạo Ganymede' },
      { id: 'ganymedeLanded', text: 'Hạ cánh xuống Ganymede' },
    ],
  },
  {
    id: 'callisto', icon: '🌑', name: 'Hạ cánh lên Callisto', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Bay tới vệ tinh ngoài cùng trong nhóm Галилео của Sao Mộc (Callisto), vào quỹ đạo và đáp xuống bề mặt cổ đại.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'callistoSOI', text: 'Vào vùng hấp dẫn Callisto' },
      { id: 'callistoOrbit', text: 'Vào quỹ đạo Callisto' },
      { id: 'callistoLanded', text: 'Hạ cánh xuống Callisto' },
    ],
  },
  {
    id: 'mimas', icon: '🪨', name: 'Hạ cánh lên Mimas', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Bay tới hệ vành đai Sao Thổ, tiếp cận mặt trăng Mimas nổi tiếng với hố va chạm Herschel khổng lồ và hạ cánh.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'mimasSOI', text: 'Vào vùng hấp dẫn Mimas' },
      { id: 'mimasOrbit', text: 'Vào quỹ đạo Mimas' },
      { id: 'mimasLanded', text: 'Hạ cánh xuống Mimas' },
    ],
  },
  {
    id: 'enceladus', icon: '❄️', name: 'Hạ cánh lên Enceladus', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Đáp xuống mặt trăng băng trắng tinh khiết Enceladus của Sao Thổ với những mạch phun băng cực nam.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'enceladusSOI', text: 'Vào vùng hấp dẫn Enceladus' },
      { id: 'enceladusOrbit', text: 'Vào quỹ đạo Enceladus' },
      { id: 'enceladusLanded', text: 'Hạ cánh xuống Enceladus' },
    ],
  },
  {
    id: 'tethys', icon: '⚪', name: 'Hạ cánh lên Tethys', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Bay tới mặt trăng băng Tethys của Sao Thổ, vào quỹ đạo và hạ cánh xuống thung lũng Ithaca Chasma.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'tethysSOI', text: 'Vào vùng hấp dẫn Tethys' },
      { id: 'tethysOrbit', text: 'Vào quỹ đạo Tethys' },
      { id: 'tethysLanded', text: 'Hạ cánh xuống Tethys' },
    ],
  },
  {
    id: 'dione', icon: '⚪', name: 'Hạ cánh lên Dione', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Tiếp cận mặt trăng Dione của Sao Thổ, vào quỹ đạo ổn định và đáp xuống những vách đá băng sáng.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'dioneSOI', text: 'Vào vùng hấp dẫn Dione' },
      { id: 'dioneOrbit', text: 'Vào quỹ đạo Dione' },
      { id: 'dioneLanded', text: 'Hạ cánh xuống Dione' },
    ],
  },
  {
    id: 'rhea', icon: '🌕', name: 'Hạ cánh lên Rhea', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Bay tới Rhea – mặt trăng lớn thứ hai của Sao Thổ, vào quỹ đạo và hạ cánh xuống bề mặt băng giá.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'rheaSOI', text: 'Vào vùng hấp dẫn Rhea' },
      { id: 'rheaOrbit', text: 'Vào quỹ đạo Rhea' },
      { id: 'rheaLanded', text: 'Hạ cánh xuống Rhea' },
    ],
  },
  {
    id: 'titan', icon: '🟠', name: 'Hạ cánh lên Titan', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Thám hiểm Titan – mặt trăng lớn nhất của Sao Thổ có bầu khí quyển dày màu cam vàng và hồ khí mê-tan lỏng.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'titanSOI', text: 'Vào vùng hấp dẫn Titan' },
      { id: 'titanOrbit', text: 'Vào quỹ đạo Titan' },
      { id: 'titanLanded', text: 'Hạ cánh xuống Titan' },
    ],
  },
  {
    id: 'iapetus', icon: '🌗', name: 'Hạ cánh lên Iapetus', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Bay tới mặt trăng hai màu sáng-tối kỳ bí Iapetus ở rìa hệ Sao Thổ, vào quỹ đạo và hạ cánh.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'iapetusSOI', text: 'Vào vùng hấp dẫn Iapetus' },
      { id: 'iapetusOrbit', text: 'Vào quỹ đạo Iapetus' },
      { id: 'iapetusLanded', text: 'Hạ cánh xuống Iapetus' },
    ],
  },
  {
    id: 'miranda', icon: '🪨', name: 'Hạ cánh lên Miranda', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Bay tới hệ Sao Thiên Vương và đáp xuống Miranda – mặt trăng có địa hình vách đá Verona Rupes cao nhất Hệ Mặt Trời.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'mirandaSOI', text: 'Vào vùng hấp dẫn Miranda' },
      { id: 'mirandaOrbit', text: 'Vào quỹ đạo Miranda' },
      { id: 'mirandaLanded', text: 'Hạ cánh xuống Miranda' },
    ],
  },
  {
    id: 'ariel', icon: '🧊', name: 'Hạ cánh lên Ariel', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Thám hiểm mặt trăng sáng nhất của Sao Thiên Vương (Ariel), vào quỹ đạo và hạ cánh xuống các hẻm núi băng.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'arielSOI', text: 'Vào vùng hấp dẫn Ariel' },
      { id: 'arielOrbit', text: 'Vào quỹ đạo Ariel' },
      { id: 'arielLanded', text: 'Hạ cánh xuống Ariel' },
    ],
  },
  {
    id: 'umbriel', icon: '🌑', name: 'Hạ cánh lên Umbriel', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Bay tới mặt trăng tối cổ đại Umbriel của Sao Thiên Vương, vào quỹ đạo và đáp xuống miệng hố Wunda sáng rực.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'umbrielSOI', text: 'Vào vùng hấp dẫn Umbriel' },
      { id: 'umbrielOrbit', text: 'Vào quỹ đạo Umbriel' },
      { id: 'umbrielLanded', text: 'Hạ cánh xuống Umbriel' },
    ],
  },
  {
    id: 'titania', icon: '🌕', name: 'Hạ cánh lên Titania', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Chinh phục Titania – mặt trăng lớn nhất của Sao Thiên Vương, vào quỹ đạo và hạ cánh cắm cờ.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'titaniaSOI', text: 'Vào vùng hấp dẫn Titania' },
      { id: 'titaniaOrbit', text: 'Vào quỹ đạo Titania' },
      { id: 'titaniaLanded', text: 'Hạ cánh xuống Titania' },
    ],
  },
  {
    id: 'oberon', icon: '🌑', name: 'Hạ cánh lên Oberon', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Bay tới vệ tinh ngoài cùng Oberon của Sao Thiên Vương, vào quỹ đạo và hạ cánh xuống bề mặt băng đá.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'oberonSOI', text: 'Vào vùng hấp dẫn Oberon' },
      { id: 'oberonOrbit', text: 'Vào quỹ đạo Oberon' },
      { id: 'oberonLanded', text: 'Hạ cánh xuống Oberon' },
    ],
  },
  {
    id: 'triton', icon: '❄️', name: 'Hạ cánh lên Triton', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Bay tới hệ Sao Hải Vương và đáp xuống Triton – mặt trăng băng nitơ khổng lồ có mạch phun lạnh.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'tritonSOI', text: 'Vào vùng hấp dẫn Triton' },
      { id: 'tritonOrbit', text: 'Vào quỹ đạo Triton' },
      { id: 'tritonLanded', text: 'Hạ cánh xuống Triton' },
    ],
  },
  {
    id: 'pluto', icon: '🪐', name: 'Hạ cánh lên Pluto', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Hành trình tới rìa Hệ Mặt Trời, vào quỹ đạo Pluto và đáp xuống đồng bằng băng hình trái tim Sputnik Planitia.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'plutoSOI', text: 'Vào vùng hấp dẫn Pluto' },
      { id: 'plutoOrbit', text: 'Vào quỹ đạo Pluto' },
      { id: 'plutoLanded', text: 'Hạ cánh xuống Pluto' },
    ],
  },
];

export const missionById = (id) => MISSIONS.find((m) => m.id === id) || MISSIONS[0];
