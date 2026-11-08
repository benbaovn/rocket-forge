// Mission definitions: objectives are evaluated against LaunchScene state every frame.
export const MISSIONS = [
  {
    id: 'free', icon: '🌌', name: 'Bay tự do', preset: null,
    desc: 'Tự do lắp ráp và bay. Lái tự động (G) đưa tên lửa lên quỹ đạo 80 km; tầng có chân hạ cánh sẽ tự bay về.',
    objectives: [],
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
    desc: 'Thám hiểm Titan – mặt trăng lớn nhất của Sao Thổ, vào quỹ đạo và đáp xuống bề mặt cam vàng đặc trưng.',
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
  {
    id: 'haumea', icon: '🥚', name: 'Thám hiểm Hành tinh lùn Haumea', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Bay tới Vành đai Kuiper ngoài Sao Diêm Vương, vào quỹ đạo và đáp xuống hành tinh lùn Haumea hình bầu dục có vành đai và đốm đỏ băng giá.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'haumeaSOI', text: 'Vào vùng hấp dẫn Haumea' },
      { id: 'haumeaOrbit', text: 'Vào quỹ đạo Haumea' },
      { id: 'haumeaLanded', text: 'Hạ cánh xuống Haumea' },
    ],
  },
  {
    id: 'makemake', icon: '🔶', name: 'Thám hiểm Hành tinh lùn Makemake', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Bay sâu vào Vành đai Kuiper ngoài Haumea, vào quỹ đạo và đáp xuống bề mặt băng mê-tan đỏ cam của hành tinh lùn Makemake.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'makemakeSOI', text: 'Vào vùng hấp dẫn Makemake' },
      { id: 'makemakeOrbit', text: 'Vào quỹ đạo Makemake' },
      { id: 'makemakeLanded', text: 'Hạ cánh xuống Makemake' },
    ],
  },
  {
    id: 'eris', icon: '💎', name: 'Chinh phục Hành tinh lùn Eris', preset: 'Tàu Phản Trọng Lực Lượng Tử',
    desc: 'Viễn chinh tới Đĩa Phân Tán ở rìa xa nhất Hệ Mặt Trời, vào quỹ đạo và đáp xuống bề mặt băng nitơ trắng sáng của hành tinh lùn nặng nhất Eris.',
    objectives: [
      { id: 'orbit', text: 'Vào quỹ đạo Trái Đất' },
      { id: 'erisSOI', text: 'Vào vùng hấp dẫn Eris' },
      { id: 'erisOrbit', text: 'Vào quỹ đạo Eris' },
      { id: 'erisLanded', text: 'Hạ cánh xuống Eris' },
    ],
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
    id: 'alien1500', icon: '👑', name: 'Hủy diệt 1500 Alien (Không tự lái)', preset: 'Chiến Hạm Diệt Alien (Lazer + Nước 1M PSI)',
    noAutopilot: true,
    desc: 'Cuộc chiến sinh tồn tối thượng: Tự tay lái chiến hạm tiêu diệt đủ 1500 UFO Alien trên khắp Hệ Mặt Trời và Không gian Liên sao bằng Súng Lazer, Máy Phun Nước, Súng Acid, Súng Điện hoặc Siêu Tân Tinh (Không có chế độ Lái tự động).',
    objectives: [
      { id: 'kill300', text: 'Tiêu diệt 300 UFO Alien' },
      { id: 'kill750', text: 'Tiêu diệt 750 UFO Alien' },
      { id: 'kill1500', text: 'Tiêu diệt toàn bộ 1500 UFO Alien' },
    ],
  },
  {
    id: 'alien5000', icon: '⚔️', name: 'Tiêu diệt 5000 Alien + Hoàng Hậu & Vua (Không tự lái)', preset: 'Chiến Hạm Diệt Alien (Lazer + Nước 1M PSI)',
    noAutopilot: true,
    desc: 'Thánh chiến tận thế: Tự tay lái chiến hạm tiêu diệt đủ 5000 UFO Alien trên khắp Hệ Mặt Trời và Không gian Liên sao, đồng thời hạ gục cả Siêu Trùm Alien Hoàng Hậu (90.500 HP) và Alien Vua (100.000 HP) ở độ cao 1.000.000.000 km (Không có chế độ Lái tự động).',
    objectives: [
      { id: 'kill1000', text: 'Tiêu diệt 1000 UFO Alien' },
      { id: 'kill2500', text: 'Tiêu diệt 2500 UFO Alien' },
      { id: 'kill5000', text: 'Tiêu diệt toàn bộ 5000 UFO Alien' },
      { id: 'killQueen', text: 'Tiêu diệt Siêu Trùm Alien Hoàng Hậu (90.500 HP)' },
      { id: 'killKing', text: 'Tiêu diệt Siêu Trùm Alien Vua (100.000 HP)' },
    ],
  },
  // ================= ROVER MISSIONS (Sorted Easiest -> Hardest) =================
  {
    id: 'rover_500km', icon: '🚙', name: 'Chạy 500 km (Không tự lái)', preset: 'Xe địa hình Rover 4x4',
    category: 'rover', noAutopilot: true, targetDistKm: 500,
    desc: 'Tự tay điều khiển Xe địa hình Rover 4x4 chạy trên bề mặt đạt tổng quãng đường 500 km (Không có chế độ Lái tự động).',
    objectives: [
      { id: 'roverDist100', text: 'Chạy đạt 100 km trên bề mặt', targetKm: 100 },
      { id: 'roverDist250', text: 'Chạy đạt 250 km trên bề mặt', targetKm: 250 },
      { id: 'roverDist500', text: 'Chạy hoàn thành đủ 500 km (Không tự lái)', targetKm: 500 },
    ],
  },
  {
    id: 'rover_1000km', icon: '🚙', name: 'Chạy 1000 km (Không tự lái)', preset: 'Xe địa hình Rover 4x4',
    category: 'rover', noAutopilot: true, targetDistKm: 1000,
    desc: 'Hành trình xuyên lục địa: Tự tay điều khiển Xe địa hình Rover 4x4 chạy trên bề mặt đạt tổng quãng đường 1000 km (Không có chế độ Lái tự động).',
    objectives: [
      { id: 'roverDist250', text: 'Chạy đạt 250 km trên bề mặt', targetKm: 250 },
      { id: 'roverDist500', text: 'Chạy đạt 500 km trên bề mặt', targetKm: 500 },
      { id: 'roverDist1000', text: 'Chạy hoàn thành đủ 1000 km (Không tự lái)', targetKm: 1000 },
    ],
  },
  {
    id: 'rover_2000km', icon: '🚙', name: 'Chạy 2000 km (Không tự lái)', preset: 'Xe địa hình Rover 4x4',
    category: 'rover', noAutopilot: true, targetDistKm: 2000,
    desc: 'Thử thách viễn chinh đường trường: Tự tay điều khiển Xe địa hình Rover 4x4 chạy trên bề mặt đạt tổng quãng đường 2000 km (Không có chế độ Lái tự động).',
    objectives: [
      { id: 'roverDist500', text: 'Chạy đạt 500 km trên bề mặt', targetKm: 500 },
      { id: 'roverDist1000', text: 'Chạy đạt 1000 km trên bề mặt', targetKm: 1000 },
      { id: 'roverDist2000', text: 'Chạy hoàn thành đủ 2000 km (Không tự lái)', targetKm: 2000 },
    ],
  },
  // ================= BOAT MISSIONS (Sorted Easiest -> Hardest) =================
  {
    id: 'boat_500km', icon: '🛥️', name: 'Đi 500 km trên biển', preset: 'Canô lướt sóng siêu tốc',
    category: 'boat', targetDistKm: 500,
    desc: 'Lái Canô lướt sóng siêu tốc rời cảng ra khơi đạt tổng hải trình 500 km trên mặt biển.',
    objectives: [
      { id: 'boatDist100', text: 'Đi đạt 100 km trên mặt biển', targetKm: 100 },
      { id: 'boatDist250', text: 'Đi đạt 250 km trên mặt biển', targetKm: 250 },
      { id: 'boatDist500', text: 'Đi hoàn thành đủ 500 km trên mặt biển', targetKm: 500 },
    ],
  },
  {
    id: 'boat_1000km', icon: '🛥️', name: 'Đi 1000 km trên biển', preset: 'Canô lướt sóng siêu tốc',
    category: 'boat', targetDistKm: 1000,
    desc: 'Hải trình viễn dương: Điều khiển Canô lướt sóng siêu tốc vượt sóng đạt tổng quãng đường 1000 km trên đại dương.',
    objectives: [
      { id: 'boatDist250', text: 'Đi đạt 250 km trên mặt biển', targetKm: 250 },
      { id: 'boatDist500', text: 'Đi đạt 500 km trên mặt biển', targetKm: 500 },
      { id: 'boatDist1000', text: 'Đi hoàn thành đủ 1000 km trên mặt biển', targetKm: 1000 },
    ],
  },
  {
    id: 'boat_2000km', icon: '🛥️', name: 'Đi 2000 km trên biển', preset: 'Canô lướt sóng siêu tốc',
    category: 'boat', targetDistKm: 2000,
    desc: 'Thử thách chinh phục đại dương: Lái Canô lướt sóng siêu tốc vượt qua tổng hải trình 2000 km trên biển khơi.',
    objectives: [
      { id: 'boatDist500', text: 'Đi đạt 500 km trên mặt biển', targetKm: 500 },
      { id: 'boatDist1000', text: 'Đi đạt 1000 km trên mặt biển', targetKm: 1000 },
      { id: 'boatDist2000', text: 'Đi hoàn thành đủ 2000 km trên mặt biển', targetKm: 2000 },
    ],
  },
];

// Planetary & Lunar 1-Lap Rover Missions (Sorted from smallest circumference / easiest to largest / hardest)
export const ROVER_LOOP_SPECS = [
  { body: 'deimos', icon: '🪨', rKm: 48, viName: 'Deimos', enName: 'Deimos', viSub: 'Vệ tinh Sao Hỏa', enSub: 'Mars Moon' },
  { body: 'mimas', icon: '🪨', rKm: 55, viName: 'Mimas', enName: 'Mimas', viSub: 'Mặt trăng Sao Thổ', enSub: 'Saturn Moon' },
  { body: 'miranda', icon: '🪨', rKm: 60, viName: 'Miranda', enName: 'Miranda', viSub: 'Mặt trăng Sao Thiên Vương', enSub: 'Uranus Moon' },
  { body: 'phobos', icon: '🪨', rKm: 65, viName: 'Phobos', enName: 'Phobos', viSub: 'Vệ tinh Sao Hỏa', enSub: 'Mars Moon' },
  { body: 'enceladus', icon: '❄️', rKm: 70, viName: 'Enceladus', enName: 'Enceladus', viSub: 'Mặt trăng băng Sao Thổ', enSub: 'Saturn Icy Moon' },
  { body: 'tethys', icon: '⚪', rKm: 95, viName: 'Tethys', enName: 'Tethys', viSub: 'Mặt trăng Sao Thổ', enSub: 'Saturn Moon' },
  { body: 'ariel', icon: '🧊', rKm: 95, viName: 'Ariel', enName: 'Ariel', viSub: 'Mặt trăng Sao Thiên Vương', enSub: 'Uranus Moon' },
  { body: 'umbriel', icon: '🌑', rKm: 95, viName: 'Umbriel', enName: 'Umbriel', viSub: 'Mặt trăng Sao Thiên Vương', enSub: 'Uranus Moon' },
  { body: 'dione', icon: '⚪', rKm: 105, viName: 'Dione', enName: 'Dione', viSub: 'Mặt trăng Sao Thổ', enSub: 'Saturn Moon' },
  { body: 'iapetus', icon: '🌗', rKm: 125, viName: 'Iapetus', enName: 'Iapetus', viSub: 'Mặt trăng Sao Thổ', enSub: 'Saturn Moon' },
  { body: 'rhea', icon: '🌕', rKm: 130, viName: 'Rhea', enName: 'Rhea', viSub: 'Mặt trăng Sao Thổ', enSub: 'Saturn Moon' },
  { body: 'oberon', icon: '🌑', rKm: 130, viName: 'Oberon', enName: 'Oberon', viSub: 'Mặt trăng Sao Thiên Vương', enSub: 'Uranus Moon' },
  { body: 'ceres', icon: '🪨', rKm: 135, viName: 'Ceres', enName: 'Ceres', viSub: 'Hành tinh lùn Vành đai Tiểu hành tinh', enSub: 'Asteroid Belt Dwarf Planet' },
  { body: 'titania', icon: '🌕', rKm: 135, viName: 'Titania', enName: 'Titania', viSub: 'Mặt trăng lớn nhất Sao Thiên Vương', enSub: 'Largest Uranus Moon' },
  { body: 'makemake', icon: '🔶', rKm: 140, viName: 'Makemake', enName: 'Makemake', viSub: 'Hành tinh lùn Vành đai Kuiper', enSub: 'Kuiper Belt Dwarf Planet' },
  { body: 'haumea', icon: '🥚', rKm: 145, viName: 'Haumea', enName: 'Haumea', viSub: 'Hành tinh lùn Vành đai Kuiper', enSub: 'Kuiper Belt Dwarf Planet' },
  { body: 'europa', icon: '🧊', rKm: 160, viName: 'Europa', enName: 'Europa', viSub: 'Mặt trăng băng Sao Mộc', enSub: 'Jupiter Icy Moon' },
  { body: 'triton', icon: '❄️', rKm: 165, viName: 'Triton', enName: 'Triton', viSub: 'Mặt trăng lớn nhất Sao Hải Vương', enSub: 'Largest Neptune Moon' },
  { body: 'io', icon: '🌋', rKm: 185, viName: 'Io', enName: 'Io', viSub: 'Mặt trăng núi lửa Sao Mộc', enSub: 'Jupiter Volcanic Moon' },
  { body: 'eris', icon: '💎', rKm: 188, viName: 'Eris', enName: 'Eris', viSub: 'Hành tinh lùn Đĩa Phân Tán', enSub: 'Scattered Disc Dwarf Planet' },
  { body: 'pluto', icon: '🪐', rKm: 190, viName: 'Sao Diêm Vương (Pluto)', enName: 'Pluto', viSub: 'Hành tinh lùn rìa Hệ Mặt Trời', enSub: 'Kuiper Belt Dwarf Planet' },
  { body: 'moon', icon: '🌕', rKm: 200, viName: 'Mặt Trăng', enName: 'the Moon', viSub: 'Vệ tinh tự nhiên của Trái Đất', enSub: "Earth's Natural Satellite" },
  { body: 'mercury', icon: '⚪', rKm: 240, viName: 'Sao Thủy', enName: 'Mercury', viSub: 'Hành tinh gần Mặt Trời nhất', enSub: 'Innermost Rocky Planet' },
  { body: 'callisto', icon: '🌑', rKm: 240, viName: 'Callisto', enName: 'Callisto', viSub: 'Mặt trăng Sao Mộc', enSub: 'Jupiter Galilean Moon' },
  { body: 'titan', icon: '🟠', rKm: 255, viName: 'Titan', enName: 'Titan', viSub: 'Mặt trăng lớn nhất Sao Thổ', enSub: 'Largest Saturn Moon' },
  { body: 'ganymede', icon: '🌕', rKm: 260, viName: 'Ganymede', enName: 'Ganymede', viSub: 'Mặt trăng lớn nhất Hệ Mặt Trời (Sao Mộc)', enSub: 'Largest Moon in Solar System (Jupiter)' },
  { body: 'venus', icon: '🟡', rKm: 280, viName: 'Sao Kim', enName: 'Venus', viSub: 'Hành tinh thứ hai tính từ Mặt Trời', enSub: 'Second Planet from the Sun' },
  { body: 'mars', icon: '🔴', rKm: 340, viName: 'Sao Hỏa', enName: 'Mars', viSub: 'Hành tinh Đỏ có núi lửa Olympus Mons', enSub: 'The Red Planet' },
];

for (const spec of ROVER_LOOP_SPECS) {
  const fullKm = Math.round(2 * Math.PI * spec.rKm);
  const halfKm = Math.round(Math.PI * spec.rKm);
  const b = spec.body;
  MISSIONS.push({
    id: `rover_loop_${b}`,
    icon: spec.icon,
    name: `Chạy một vòng ${spec.viName} (Không tự lái)`,
    preset: 'Xe địa hình Rover 4x4',
    category: 'rover',
    noAutopilot: true,
    targetBody: b,
    targetDistKm: fullKm,
    halfDistKm: halfKm,
    desc: `Tự tay lái Xe địa hình Rover 4x4 chạy trọn 1 vòng chu vi quanh ${spec.viName} (${spec.viSub} · Chu vi ${fullKm} km – Không có chế độ Lái tự động).`,
    objectives: [
      { id: `${b}HalfLoop`, text: `Chạy được nửa vòng ${spec.viName} (${halfKm} km)`, targetKm: halfKm, body: b },
      { id: `${b}FullLoop`, text: `Chạy hoàn thành đủ 1 vòng ${spec.viName} (${fullKm} km)`, targetKm: fullKm, body: b },
    ],
  });
}

// Atmospheric Planetary & Lunar (Titan, Triton) 1-Lap Airplane Missions (Sorted Easiest -> Hardest, with Autopilot)
export const PLANE_LOOP_SPECS = [
  { body: 'triton', icon: '❄️', rKm: 165, viName: 'Triton', enName: 'Triton', viSub: 'Mặt trăng có khí quyển của Sao Hải Vương', enSub: 'Atmospheric Moon of Neptune' },
  { body: 'pluto', icon: '🪐', rKm: 190, viName: 'Sao Diêm Vương (Pluto)', enName: 'Pluto', viSub: 'Hành tinh lùn có khí quyển nitơ', enSub: 'Atmospheric Dwarf Planet' },
  { body: 'titan', icon: '🟠', rKm: 255, viName: 'Titan', enName: 'Titan', viSub: 'Mặt trăng khí quyển dày đặc của Sao Thổ', enSub: 'Dense-Atmosphere Moon of Saturn' },
  { body: 'venus', icon: '🟡', rKm: 280, viName: 'Sao Kim', enName: 'Venus', viSub: 'Hành tinh thứ hai tính từ Mặt Trời', enSub: 'Second Planet from the Sun' },
  { body: 'mars', icon: '🔴', rKm: 340, viName: 'Sao Hỏa', enName: 'Mars', viSub: 'Hành tinh Đỏ có núi lửa Olympus Mons', enSub: 'The Red Planet' },
  { body: 'neptune', icon: '🔵', rKm: 420, viName: 'Sao Hải Vương', enName: 'Neptune', viSub: 'Hành tinh băng khổng lồ', enSub: 'Outer Ice Giant Planet' },
  { body: 'uranus', icon: '🩵', rKm: 440, viName: 'Sao Thiên Vương', enName: 'Uranus', viSub: 'Hành tinh băng nghiêng', enSub: 'Tilted Ice Giant Planet' },
  { body: 'earth', icon: '🌍', rKm: 600, viName: 'Trái Đất', enName: 'Earth', viSub: 'Hành tinh xanh của chúng ta', enSub: 'Our Home Planet' },
  { body: 'saturn', icon: '🪐', rKm: 620, viName: 'Sao Thổ', enName: 'Saturn', viSub: 'Hành tinh vành đai khổng lồ', enSub: 'Ringed Gas Giant Planet' },
  { body: 'jupiter', icon: '🟠', rKm: 720, viName: 'Sao Mộc', enName: 'Jupiter', viSub: 'Hành tinh khí khổng lồ lớn nhất Hệ Mặt Trời', enSub: 'Largest Gas Giant Planet in Solar System' },
];

for (const spec of PLANE_LOOP_SPECS) {
  const fullKm = Math.round(2 * Math.PI * spec.rKm);
  const halfKm = Math.round(Math.PI * spec.rKm);
  const b = spec.body;
  MISSIONS.push({
    id: `plane_loop_${b}`,
    icon: spec.icon,
    name: `Bay một vòng ${spec.viName}`,
    preset: 'Tiêm kích phản lực F-22',
    category: 'plane',
    targetBody: b,
    targetDistKm: fullKm,
    halfDistKm: halfKm,
    desc: `Lái Tiêm kích phản lực F-22 (hoặc bật Lái tự động G) bay trọn 1 vòng chu vi trong bầu khí quyển quanh ${spec.viName} (${spec.viSub} · Chu vi ${fullKm} km).`,
    objectives: [
      { id: `${b}PlaneHalfLoop`, text: `Bay được nửa vòng ${spec.viName} (${halfKm} km)`, targetKm: halfKm, body: b },
      { id: `${b}PlaneFullLoop`, text: `Bay hoàn thành đủ 1 vòng ${spec.viName} (${fullKm} km)`, targetKm: fullKm, body: b },
    ],
  });
}

export const missionById = (id) => MISSIONS.find((m) => m.id === id) || MISSIONS[0];

const COMPLETED_MISSIONS_KEY = 'rf-completed-missions';

export function getCompletedMissions() {
  try {
    const raw = localStorage.getItem(COMPLETED_MISSIONS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function isMissionCompleted(id) {
  if (!id || id === 'free') return false;
  return getCompletedMissions().has(id);
}

export function markMissionCompleted(id) {
  if (!id || id === 'free') return false;
  try {
    const set = getCompletedMissions();
    set.add(id);
    localStorage.setItem(COMPLETED_MISSIONS_KEY, JSON.stringify([...set]));
    return true;
  } catch {
    return false;
  }
}

