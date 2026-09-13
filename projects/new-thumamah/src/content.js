/* محتوى المناطق الست كما وردت في الملف المعتمد.
   الأعداد والمواقع والمقاسات مقترحات تصميمية، عدا ما نُقل بنصه من الملف. */
(function (NT) {
  'use strict';
  const P = () => NT.props;
  const A = () => NT.assets;
  const NORTH = 0, WEST = Math.PI / 2, EAST = -Math.PI / 2, SOUTH = Math.PI;

  function build(kind, ctx) {
    const fn = builders[kind];
    if (fn) fn(ctx);
  }

  const builders = {
    /* ===== ZON1 · ممر الخدمات: وقود وبنشر وبقالة ===== */
    service(c) {
      const M = c.M, z = c.zone, THREE = window.THREE;
      c.pad(800, 58, 210, 96, M.track, 0.08);
      c.pad(800, 58, 26, 96, M.asphalt, 0.1);
      c.place(c.model('fuelStation'), 742, 56, EAST);          // الواجهة نحو الطريق
      c.place(c.model('workshop'), 872, 34, WEST);
      c.place(c.model('grocery'), 874, 92, WEST);
      // لافتة مدخل الممر
      const mast = new THREE.CylinderGeometry(0.22, 0.26, 7, 10);
      const panel = new THREE.BoxGeometry(0.3, 2.6, 5.2);
      for (const x of [726, 874]) {
        c.add(mast, M.metal, c.atY(x, 8, 3.5));
        c.add(panel, M.lamp, c.atY(x, 8, 6.2));
      }
      c.lights([[734, 22], [734, 96], [866, 22], [866, 106]], 9, 1);
      c.vehicles([[752, 50, 0, 'sedan'], [752, 62, 0, 'suv'], [734, 50, 0, 'pickup'], [846, 100, Math.PI, 'sedan'], [812, 14, 0, 'suv']]);
      c.people([[758, 54], [746, 58], [868, 92, 'staff'], [860, 86], [744, 44, 'staff'], [866, 100], [852, 96, 'child']], { spread: 3 });
      c.place(A().roadSign(M, true), 786, 100, SOUTH);
      c.trees(z, 5, 0.4);
    },

    /* ===== ZON2 · البوابة والإدارة وسكن العمال والمواقف ===== */
    gateway(c) {
      const M = c.M, z = c.zone, THREE = window.THREE;
      // البوابة
      c.pad(800, 168, 210, 80, M.track, 0.08);
      c.pad(800, 168, 34, 80, M.asphalt, 0.1);
      c.place(c.model('gate'), 800, 168, NORTH);
      // لوحة الرسوم بجوار الكشك
      const board = new THREE.BoxGeometry(0.22, 1.5, 2.6);
      c.add(board, M.lamp, c.atY(776, 152, 1.9));

      // الإدارة وسكن العمال خلفها — جهة اليمين عند الدخول
      c.pad(1040, 258, 200, 168, M.track, 0.06);
      c.place(c.model('adminBlock', 26), 1006, 232, SOUTH);
      c.place(c.model('shadeStructure', 14), 1006, 212, SOUTH);
      c.place(P().buildingBlock(M, 32, 10, 3.6, M.plasterWarm), 1064, 306, SOUTH);   // سكن عمال
      c.place(P().buildingBlock(M, 14, 8, 3.4, M.plasterWarm), 1108, 262, WEST);     // خدمات
      c.instances(c.model('sedan'), [[1096, 214], [1108, 214], [1120, 214]].map((p) => c.at(p[0], p[1], 0, 1)), { pick: z.id });

      // مواقف الزوار: 1040 موقفًا بمقاس 2.5 × 5 م (نص الملف: تكفي 1000 سيارة)
      c.zone = z;
      const lot = c.parking(1230, 228, 130, 4, 0, 0.34);
      void lot;
      const poles = [];
      for (let i = 0; i < 12; i++) poles.push([1070 + i * 28, 196]);
      for (let i = 0; i < 12; i++) poles.push([1070 + i * 28, 262]);
      c.instances(c.model('lightPole'), c.grid(poles));
      // ممشى مظلل من المواقف إلى البوابة
      c.ribbon([[1062, 228], [1000, 226], [930, 222], [872, 205], [830, 186]], 4, M.track, 0.08);
      for (let i = 0; i < 4; i++) c.place(c.model('shadeStructure', 12), 1040 - i * 56, 226 - i * 4, NORTH);
      c.palms([[860, 128], [880, 128], [900, 132], [920, 136], [940, 140], [960, 144]]);
      // طابور الدخول وحافلات المجموعات
      c.vehicles([[792, 132, 0, 'sedan'], [804, 126, 0, 'suv'], [792, 112, 0, 'suv'], [806, 104, 0, 'pickup'], [794, 92, 0, 'sedan']]);
      c.vehicles([[884, 160, -Math.PI / 2, 'coach'], [884, 178, -Math.PI / 2, 'coach']]);
      c.people([[812, 156, 'staff'], [788, 156, 'staff'], [800, 140], [806, 134], [790, 126, 'child'], [862, 168], [868, 176, 'child'], [874, 164]], { spread: 3 });
      // مشاة على ممشى المواقف
      const walk = [];
      for (let i = 0; i < 26; i++) walk.push([1040 - i * 8 + c.rnd() * 6, 224 + (c.rnd() - 0.5) * 7]);
      c.people(walk, { spread: 2 });
      c.lights([[1062, 196], [1062, 262], [1180, 196], [1180, 262], [1300, 196], [1300, 262], [1400, 228]], 10, 2);
      c.place(A().roadSign(M, true), 856, 208, SOUTH);
      c.trees(z, 22, 0.5);
    },

    /* ===== ZON3 · المخيمات والكشتات ===== */
    camps(c) {
      const M = c.M, z = c.zone;
      // قطع مخيمات مسوّرة على حلقة الممر
      const plots = [
        [230, 330, 0.15], [330, 300, -0.1], [440, 320, 0.2], [520, 390, 0.35],
        [214, 452, -0.2], [330, 430, 0.05], [452, 470, 0.3],
        [190, 590, 0.1], [300, 570, -0.15], [420, 610, 0.25], [520, 560, -0.3],
        [230, 720, 0.2], [350, 730, -0.1], [470, 745, 0.15], [560, 690, 0.3],
        [280, 830, -0.2], [420, 840, 0.1]
      ];
      const tent = c.model('tent'), tents = [], cars = [];
      for (const p of plots) {
        const [x, y, rot] = p;
        c.disc(x, y, 22, M.arenaSand, 0.07);
        c.place(c.model('campScreen', 40), x, y, rot);
        tents.push(c.at(x - 9, y + 4, rot, 1));
        tents.push(c.at(x + 8, y + 5, rot + 0.1, 1));
        c.place(c.model('majlis'), x, y - 7, rot);
        cars.push(c.at(x + 14, y - 12, rot + 0.4, 1));
      }
      c.instances(tent, tents, { pick: z.id });
      c.instances(c.model('sedan'), cars, { pick: z.id });

      // كشتات مفتوحة على الرمل
      const kashta = c.model('kashta'), spots = [
        [150, 380], [160, 500], [140, 660], [175, 790], [260, 880],
        [390, 890], [500, 860], [560, 780], [575, 640], [545, 500]
      ];
      for (const s of spots) {
        c.place(kashta, s[0], s[1], c.rnd() * 6.28);
        c.fire(s[0], s[1] - 2.6);
      }
      c.instances(NT.models.has('suv') ? c.model('suv') : c.model('offRoader'), spots.map((s) => c.at(s[0] + 9, s[1] + 7, c.rnd() * 6.28, 1)), { pick: z.id });

      // خدمات ودورات مياه لكل مجموعة
      for (const p of [[300, 380], [280, 640], [400, 800]]) c.place(P().buildingBlock(M, 12, 5, 3.2, M.plasterWarm), p[0], p[1], SOUTH);
      c.lights([[300, 350], [430, 500], [250, 690], [470, 690], [350, 810]], 8, 1);
      // ناس حول المجالس والخيام والكشتات
      const campPeople = [];
      for (const p of plots) {
        const n = 2 + Math.floor(c.rnd() * 4);
        for (let i = 0; i < n; i++) campPeople.push([p[0] + (c.rnd() - 0.5) * 26, p[1] - 6 + (c.rnd() - 0.5) * 16]);
      }
      for (const sp of spots) {
        const n = 2 + Math.floor(c.rnd() * 3);
        for (let i = 0; i < n; i++) campPeople.push([sp[0] + (c.rnd() - 0.5) * 9, sp[1] + (c.rnd() - 0.5) * 8]);
      }
      c.people(campPeople, { spread: 1.5 });
      c.trees(z, 34, 0.9);
      c.palms([[560, 300], [575, 340], [120, 300], [120, 350]]);
    },

    /* ===== ZON4 · الفود تراك والأطفال والاسطبل ===== */
    family(c) {
      const M = c.M, z = c.zone, THREE = window.THREE;
      // ساحة الفود تراك: نودلز، بطاطس، كرك، أسر منتجة، حلويات
      c.pad(900, 655, 150, 120, M.track, 0.07);
      const tints = [M.plaster, M.canvasWarm, M.plasterWarm, M.canvasLight, M.plaster, M.canvasWarm];
      const arc = [[862, 612, 0.25], [900, 604, 0], [938, 612, -0.25], [956, 648, -0.6], [860, 700, 0.7], [900, 712, 1.0]];
      arc.forEach((p, i) => c.place(NT.models.has('foodTruck') ? c.model('foodTruck') : P().foodTruck(M, tints[i % tints.length]), p[0], p[1], p[2] + Math.PI));
      const sets = [];
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2, r = 16 + (i % 3) * 7;
        sets.push([900 + Math.cos(a) * r, 658 + Math.sin(a) * r * 0.8]);
      }
      for (const s of sets) c.place(c.model('diningSet'), s[0], s[1], c.rnd() * 6.28);
      c.place(c.model('shadeStructure', 26), 900, 662, NORTH);
      c.stringLights([[856, 626], [900, 618], [946, 630], [962, 668], [930, 700], [872, 704], [852, 664], [856, 626]], 5.2);
      c.instances(c.model('lightPole'), c.grid([[848, 600], [956, 600], [848, 716], [956, 716]]));

      // منطقة الأطفال ودورات المياه
      c.pad(1020, 648, 104, 96, M.track, 0.06);
      c.place(c.model('playSet'), 1014, 640, SOUTH);
      c.place(c.model('shadeStructure', 16), 1030, 664, NORTH);
      c.place(P().buildingBlock(M, 14, 6, 3.2, M.plasterWarm), 1062, 618, SOUTH);   // دورات مياه ومغاسل
      c.rail(1020, 648, 96, 88);
      const bench = new THREE.BoxGeometry(1.8, 0.42, 0.5);
      for (const p of [[996, 672], [1032, 676], [1046, 650]]) c.add(bench, M.timber, c.atY(p[0], p[1], 0.42));

      // اسطبل الخيل والحظائر وحلقة التمرين
      c.pad(940, 828, 200, 146, M.track, 0.05);
      c.place(c.model('stableRow'), 916, 856, NORTH);
      c.place(P().buildingBlock(M, 12, 8, 3.6, M.plasterWarm), 1016, 858, WEST);    // علف وتجهيز
      c.ring(1000, 800, 11);
      c.paddock(892, 790, 76, 44);
      c.instances(c.model('lightPole'), c.grid([[880, 812], [980, 880]]));
      const bale = new THREE.BoxGeometry(1.8, 1.2, 1.2);
      for (const b of [[1004, 878], [1004, 882], [1006, 886]]) c.add(bale, M.foliageDry, c.atY(b[0], b[1], 0.6));
      // زحام ساحة الفود تراك
      const crowd = [];
      for (let i = 0; i < 46; i++) {
        const a = c.rnd() * Math.PI * 2, r = 6 + Math.sqrt(c.rnd()) * 26;
        crowd.push([900 + Math.cos(a) * r, 658 + Math.sin(a) * r * 0.85]);
      }
      for (const p of [[862, 620, 'staff'], [900, 612, 'staff'], [938, 620, 'staff'], [956, 656, 'staff'], [860, 706, 'staff'], [900, 718, 'staff']]) crowd.push(p);
      c.people(crowd, { spread: 2 });
      // أطفال WOOSH
      const kids = [];
      for (let i = 0; i < 18; i++) kids.push([1014 + (c.rnd() - 0.5) * 40, 646 + (c.rnd() - 0.5) * 36, c.rnd() < 0.75 ? 'child' : 'abaya']);
      c.people(kids, { spread: 2 });
      // الاسطبل
      c.people([[926, 842, 'staff'], [938, 848], [1000, 806, 'child'], [994, 812], [908, 800]], { spread: 2 });
      c.vehicles([[1078, 690, 0.4, 'suv'], [1080, 706, 0.2, 'pickup'], [1064, 722, -0.3, 'sedan'], [836, 592, 0, 'suv']]);
      c.lights([[848, 600], [956, 600], [848, 716], [956, 716], [1062, 646]], 8, 1);
      c.floods([[930, 878]], 14);
      c.trees(z, 16, 0.6);
      c.palms([[790, 560], [812, 556], [1088, 560], [1088, 600]]);
    },

    /* ===== ZON5 · قمة الجبل: المطعم واللاونج والدومز ومواقف VIP ===== */
    summit(c) {
      const M = c.M, z = c.zone, THREE = window.THREE;
      // ساحة القمة: تبليط حجري ثم المبنى والحافة المطلّة
      c.pad(790, 1210, 330, 150, M.stone, 0.12);
      c.pad(780, 1214, 200, 90, M.track, 0.14);
      // حافة الإطلالة: جدار منخفض يتبع طرف الهضبة
      const rim = [];
      for (let x = 520; x <= 1040; x += 40) rim.push([x, 1140 + Math.sin(x / 90) * 8]);
      c.wall(rim, 1.05, 0.45, M.stone);
      for (let i = 0; i < rim.length; i += 3) c.place(c.model('lantern'), rim[i][0], rim[i][1] - 3, NORTH);
      c.place(c.model('summitRestaurant'), 780, 1222, SOUTH);
      // لاونج ومجالس على حافة القمة
      c.deck(892, 1178, 60, 34);
      c.place(c.model('railing', 60), 892, 1178, NORTH);
      c.majlisRing([[874, 1172], [912, 1184], [940, 1164]]);
      c.place(c.model('shadeStructure', 22), 892, 1192, NORTH);
      // شرفتا إطلالة بارزتان نحو المخيم
      c.deck(704, 1134, 26, 18);
      c.place(c.model('railing', 26), 704, 1134, NORTH);
      c.deck(946, 1132, 20, 14);
      c.place(c.model('railing', 20), 946, 1132, NORTH);
      c.majlisRing([[946, 1134]]);
      c.steps(856, 1152, 9, 7, 0.2, NORTH);
      c.instances(c.model('lantern'), c.grid([[692, 1138], [716, 1138], [692, 1154], [716, 1154]]));

      // الدومز: صفان متعرجان بإطلالة جنوبية غربية
      const dome = c.model('dome'), placements = [];
      for (let i = 0; i < 12; i++) {
        const row = i % 2, k = Math.floor(i / 2);
        const x = 520 + row * 74 + c.rnd() * 8;
        const y = 1216 + k * 38 + row * 16;
        placements.push(c.at(x, y, SOUTH - 0.35 + c.rnd() * 0.7, 1));
      }
      c.instances(dome, placements, { pick: z.id });
      c.place(c.model('shadeStructure', 14), 624, 1192, NORTH);            // إفطار الدومز
      c.place(P().buildingBlock(M, 10, 6, 3.2, M.plasterWarm), 666, 1180, SOUTH);
      c.ribbon([[562, 1182], [550, 1238], [558, 1292], [590, 1338], [642, 1366]], 3, M.track, 0.05);
      c.fire(600, 1258); c.fire(556, 1322);

      // مواقف VIP — تكفي 100 سيارة (نص الملف)
      c.zone = z;
      c.parking(985, 1150, 25, 2, 0, 0.4);
      c.instances(c.model('lightPole'), c.grid([[950, 1134], [1020, 1134], [950, 1170], [1020, 1170]]));
      c.instances(c.model('lightPole'), c.grid([[824, 1156], [764, 1160], [1014, 1192], [664, 1162]]));
      // سارية وأعلام عند مدخل القمة
      const mast = new THREE.CylinderGeometry(0.16, 0.2, 9, 10);
      for (const x of [946, 962, 978]) {
        c.add(mast, M.metalLight, c.atY(x, 1196, 4.5));
        c.add(new THREE.BoxGeometry(0.06, 1.1, 1.9), M.canvasLight, c.atY(x, 1196, 8));
      }
      // ناس على الشرفات وحول المطعم
      const summitPeople = [];
      for (let i = 0; i < 22; i++) summitPeople.push([892 + (c.rnd() - 0.5) * 54, 1178 + (c.rnd() - 0.5) * 30]);
      for (let i = 0; i < 10; i++) summitPeople.push([704 + (c.rnd() - 0.5) * 22, 1134 + (c.rnd() - 0.5) * 14]);
      for (let i = 0; i < 8; i++) summitPeople.push([946 + (c.rnd() - 0.5) * 16, 1132 + (c.rnd() - 0.5) * 12]);
      for (let i = 0; i < 12; i++) summitPeople.push([780 + (c.rnd() - 0.5) * 46, 1200 + (c.rnd() - 0.5) * 16]);
      for (let i = 0; i < 6; i++) summitPeople.push([560 + (c.rnd() - 0.5) * 70, 1240 + (c.rnd() - 0.5) * 60]);
      summitPeople.push([806, 1206, 'staff'], [762, 1210, 'staff'], [884, 1188, 'staff']);
      c.people(summitPeople, { spread: 2 });
      c.bollards(rim, 14);
      c.lights([[1010, 1196], [930, 1214], [840, 1220]], 8, 1);
      c.trees(z, 18, 0.5);
    },

    /* ===== ZON6 · العزم: مواقف وتطعيس ورماية ===== */
    azm(c) {
      const M = c.M, z = c.zone, THREE = window.THREE;
      // مواقف سيارات العزم
      c.pad(1165, 962, 140, 116, M.track, 0.07);
      const rides = [];
      for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) {
        if (c.rnd() < 0.25) continue;
        rides.push(c.at(1112 + i * 15, 930 + r * 30, 0, 1));
      }
      c.instances(NT.models.has('suv') ? c.model('suv') : c.model('offRoader'), rides, { pick: z.id });
      c.place(c.model('shadeStructure', 18), 1230, 962, NORTH);
      c.place(P().buildingBlock(M, 10, 6, 3.2, M.plasterWarm), 1236, 1000, SOUTH);

      // جبال التطعيس: مسارات على الكثبان وسيارات مائلة مع الميل
      c.ribbon([[1180, 1010], [1230, 1050], [1300, 1080], [1360, 1130], [1400, 1200]], 7, M.track, 0.04);
      c.ribbon([[1200, 980], [1270, 1000], [1340, 1040], [1410, 1090]], 6, M.track, 0.04);
      for (const p of [[1246, 1042, 0.6], [1318, 1086, 1.1], [1372, 1140, 0.3], [1214, 992, -0.4], [1392, 1060, 0.9]]) {
        c.slope(c.model('offRoader'), p[0], p[1], p[2], 1);
      }
      // أعلام تحديد المسار
      const pole = new THREE.CylinderGeometry(0.06, 0.07, 2.6, 6);
      const flag = new THREE.BoxGeometry(0.9, 0.5, 0.05);
      for (let i = 0; i < 14; i++) {
        const t = i / 13;
        const x = 1180 + t * 220 + Math.sin(i) * 14, y = 1010 + t * 190 + Math.cos(i) * 12;
        c.add(pole, M.metal, c.atY(x, y, 1.3));
        c.add(flag, i % 2 ? M.lamp : M.fire, c.atY(x + 0.5, y, 2.3));
      }

      // منطقة الرماية: خط رماية مظلل، أهداف، وسواتر ترابية
      c.pad(1305, 1315, 220, 176, M.track, 0.06);
      c.place(c.model('shadeStructure', 30), 1305, 1250, NORTH);
      const targets = [];
      for (let i = 0; i < 8; i++) targets.push([1240 + i * 18, 1360]);
      for (const t of targets) c.place(c.model('target'), t[0], t[1], SOUTH);
      c.place(P().berm(M, 200, 5.5), 1305, 1390, NORTH);        // ساتر خلفي
      c.place(P().berm(M, 150, 4), 1205, 1320, WEST);           // ساتر جانبي غربي
      c.place(P().berm(M, 150, 4), 1405, 1320, WEST);           // ساتر جانبي شرقي
      c.place(P().buildingBlock(M, 9, 6, 3.2, M.plasterWarm), 1355, 1246, SOUTH);  // إشراف وسلامة
      const warn = new THREE.BoxGeometry(0.2, 1.4, 2.2);
      for (const p of [[1215, 1240], [1395, 1240]]) c.add(warn, M.fire, c.atY(p[0], p[1], 1.6));
      c.instances(c.model('lightPole'), c.grid([[1250, 1240], [1360, 1240]]));
      // متفرجون على حافة مسار التطعيس، ورماة خلف خط الرماية
      const azmPeople = [];
      for (let i = 0; i < 14; i++) azmPeople.push([1165 + (c.rnd() - 0.5) * 120, 962 + (c.rnd() - 0.5) * 90]);
      for (let i = 0; i < 8; i++) azmPeople.push([1240 + (c.rnd() - 0.5) * 70, 1046 + (c.rnd() - 0.5) * 40]);
      for (let i = 0; i < 7; i++) azmPeople.push([1250 + i * 18, 1268 + (c.rnd() - 0.5) * 4, i % 3 === 0 ? 'staff' : 'thobe']);
      c.people(azmPeople, { spread: 2 });
      c.vehicles([[1112, 1010, 0.3, 'pickup'], [1146, 1022, -0.2, 'suv'], [1360, 1250, 0, 'suv']]);
      c.floods([[1240, 1238], [1372, 1238]], 14);
      c.lights([[1186, 930], [1244, 930]], 9, 1);
      c.rocks(1240, 1120, 90, 26);
      c.trees(z, 12, 0.4);
    }
  };

  NT.content = { build, builders, NORTH, WEST, EAST, SOUTH };
})(window.NT = window.NT || {});
