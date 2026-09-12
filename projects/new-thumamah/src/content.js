/* محتوى المناطق: توزيع تصميمي مقترح داخل كل منطقة.
   الأعداد والمواقع تمثيلية — ليست سعة تشغيلية ولا مخططًا تنفيذيًا. */
(function (NT) {
  'use strict';
  const P = () => NT.props;

  // اتجاهات: rot=0 يواجه الشمال، +π/2 يواجه الغرب، -π/2 يواجه الشرق، π يواجه الجنوب.
  const NORTH = 0, WEST = Math.PI / 2, EAST = -Math.PI / 2, SOUTH = Math.PI;

  function build(kind, ctx) {
    const fn = builders[kind];
    if (fn) fn(ctx);
  }

  const builders = {
    /* ===== الوصول والاستقبال ===== */
    arrival(c) {
      const M = c.M, z = c.zone, THREE = window.THREE;
      c.pad(762, 150, 210, 160, M.track, 0.03);
      // بوابة على الحافة الجنوبية
      const pylon = new THREE.BoxGeometry(2.4, 5, 2.4);
      c.add(pylon, M.stone, c.at(742, 14, 0, 2.5));
      c.add(pylon, M.stone, c.at(778, 14, 0, 2.5));
      const beam = new THREE.BoxGeometry(15, 1.1, 1.4);
      c.add(beam, M.metalLight, c.at(760, 14, 0, 5.6));
      const sign = new THREE.BoxGeometry(7.5, 1.6, 0.3);
      c.add(sign, M.lamp, c.at(760, 14, 0, 5.4));

      // ساحة الإنزال ومظلة الاستقبال
      c.pad(760, 132, 74, 46, M.asphalt, 0.05);
      c.pad(650, 72, 68, 64, M.asphalt, 0.05);
      c.place(P().shadeStructure(M, 30, 14, 5.5), 760, 168, NORTH);
      c.place(P().buildingBlock(M, 14, 8, 4), 760, 190, SOUTH);
      c.place(P().buildingBlock(M, 14, 5, 3.2, M.plasterWarm), 676, 150, SOUTH); // دورات مياه
      c.place(P().buildingBlock(M, 10, 6, 3.4, M.plasterWarm), 872, 236, SOUTH); // خدمات خلفية

      // مواقف: 2.5 × 5 م لكل سيارة، ممر 6 م بين الصفوف
      const stalls = [], cars = [];
      let placed = 0;
      for (let row = 0; row < 5; row++) {
        for (let i = 0; i < 22; i++) {
          const x = 622 + i * 2.6, y = 46 + row * 11.5;
          stalls.push([x, y]);
          if (c.rnd() > 0.42 && placed < 74) { cars.push(c.at(x, y + 2.5, NORTH, 1)); placed++; }
        }
      }
      c.stripes(stalls, M.track);
      c.instances(P().car(M), cars, { pick: z.id });
      // مواقف حافلات
      for (let i = 0; i < 4; i++) c.pad(878, 60 + i * 14, 34, 3.6, M.track, 0.06);

      c.instances(P().lightPole(M, 6), c.grid([[640, 118], [700, 118], [820, 118], [880, 118], [700, 36], [820, 36]]));
      c.palms([[736, 40], [736, 70], [736, 100], [784, 40], [784, 70], [784, 100], [700, 206], [820, 206]]);
      c.trees(z, 14, 0.35);
    },

    /* ===== تجربة الخيل ===== */
    horses(c) {
      const M = c.M, z = c.zone, THREE = window.THREE;
      c.pad(300, 300, 420, 380, M.track, 0.04);
      // ميدان 70×35 م — المقاس القياسي، لا 324 م كما في النسخة السابقة
      const ax = 250, ay = 200;
      c.pad(ax, ay, 70, 35, M.arenaSand, 0.12);
      c.rail(ax, ay, 70, 35);
      c.place(P().buildingBlock(M, 4, 3, 3.2, M.plasterWarm), ax + 40, ay, EAST); // غرفة حكام
      // حلقة تمرين قطر 18 م
      c.ring(140, 330, 9);
      // مرابط: 12 بوكس 3.5×3.5 م تحت سقف واحد
      c.place(P().shadeStructure(M, 45, 12, 3.6, false), 330, 350, NORTH);
      const box = new THREE.BoxGeometry(3.4, 2.6, 7);
      for (let i = 0; i < 12; i++) c.add(box, i % 2 ? M.plaster : M.plasterWarm, c.at(330 - 20 + i * 3.6, 352, 0, 1));
      c.place(P().buildingBlock(M, 10, 7, 3.6), 400, 350, SOUTH); // مستودع علف وتجهيز
      // حظائر مسيّجة
      c.paddock(140, 430, 90, 55);
      c.paddock(250, 430, 90, 55);
      c.paddock(430, 180, 60, 120);
      // مسارات ركوب وخدمة
      c.ribbon([[520, 200], [470, 240], [420, 300], [380, 380], [330, 430]], 4, M.track, 0.05);
      c.place(P().shadeStructure(M, 14, 6, 3.4, false), 250, 150, NORTH); // مظلة مشاهدة
      const jump = new THREE.BoxGeometry(3.4, 0.16, 0.16);
      for (let i = 0; i < 5; i++) c.add(jump, M.timber, c.at(224 + i * 13, 218, 0, 1));
      const bale = new THREE.BoxGeometry(1.8, 1.2, 1.2);
      for (const b of [[392, 338], [392, 342], [394, 346]]) c.add(bale, M.foliageDry, c.at(b[0], b[1], 0, 1));
      c.instances(P().lightPole(M, 6), c.grid([[200, 150], [300, 150], [200, 250], [300, 250], [330, 300]]));
      c.palms([[100, 90], [140, 90], [180, 90], [220, 90], [90, 140], [90, 200], [90, 260]]);
      c.trees(z, 26, 0.5);
    },

    /* ===== الشركات والفعاليات ===== */
    events(c) {
      const M = c.M, z = c.zone;
      c.pad(1210, 320, 320, 400, M.track, 0.04);
      // قاعة قماشية مرنة 45×30 م بثلاث قمم
      c.place(P().tensileCanopy(M, 45, 30, 9, [[-0.5, 0], [0.5, -0.3], [0.1, 0.5]]), 1200, 300, NORTH);
      c.pad(1200, 300, 47, 32, M.track, 0.07);
      // جلسات جانبية
      const breakout = P().safariTent(M);
      c.instances(breakout, [[1120, 160], [1160, 150], [1240, 152], [1284, 164]].map((p) => c.at(p[0], p[1], NORTH, 1)), { pick: z.id });
      // ساحة فعاليات مفتوحة
      c.pad(1210, 430, 90, 64, M.track, 0.05);
      c.place(P().shadeStructure(M, 20, 10, 4.4, false), 1150, 430, NORTH);
      c.place(P().buildingBlock(M, 16, 9, 4), 1380, 120, WEST); // تحميل وخدمات
      c.pad(1370, 230, 46, 70, M.asphalt, 0.05);
      const cars = [];
      for (let row = 0; row < 3; row++) for (let i = 0; i < 8; i++) if (c.rnd() > 0.35) cars.push(c.at(1352 + row * 12, 202 + i * 6, EAST, 1));
      c.instances(P().car(M), cars, { pick: z.id });
      c.instances(P().lightPole(M, 7), c.grid([[1140, 240], [1260, 240], [1140, 360], [1260, 360], [1210, 480]]));
      c.majlisRing([[1120, 340], [1290, 360], [1130, 430], [1290, 440]]);
      // مظلات جانبية وطاولات حول الساحة
      for (const p of [[1120, 250], [1290, 250], [1120, 385], [1290, 385]]) c.place(P().shadeStructure(M, 9, 6, 3.2, false), p[0], p[1], NORTH);
      c.stage(1210, 500, 10, 6, NORTH);
      c.stringLights([[1120, 200], [1180, 190], [1250, 195], [1300, 215]], 5.4);
      c.trees(z, 30, 0.5);
      c.palms([[1040, 80], [1080, 80], [1120, 80], [1160, 80], [1200, 80], [1240, 80]]);
    },

    /* ===== العائلة والأطفال ===== */
    family(c) {
      const M = c.M, z = c.zone, THREE = window.THREE;
      c.pad(700, 500, 46, 34, M.track, 0.05);
      // مظلات لعب
      c.place(P().tensileCanopy(M, 26, 18, 5.5, [[-0.4, -0.2], [0.45, 0.3]]), 700, 500, NORTH);
      // هيكل تسلق وزحاليق
      const frame = new THREE.BoxGeometry(0.2, 2.4, 0.2);
      for (const p of [[688, 492], [712, 492], [688, 510], [712, 510]]) c.add(frame, M.timber, c.at(p[0], p[1], 0, 1.2));
      const platform = new THREE.BoxGeometry(8, 0.25, 6);
      c.add(platform, M.deck, c.at(700, 501, 0, 1));
      const slide = new THREE.BoxGeometry(1.2, 0.16, 5.2);
      const m = P().M4(c.wx(706), 1.3, c.wz(506), 0, 1);
      m.multiply(new THREE.Matrix4().makeRotationX(0.5));
      c.addMatrix(slide, M.metalLight, m);
      // مجلس الأهل بخط رؤية مباشر
      c.place(P().majlis(M, 5), 748, 520, NORTH);
      c.place(P().buildingBlock(M, 12, 5, 3.2, M.plasterWarm), 640, 430, SOUTH);
      // درب اكتشاف قصير
      c.ribbon([[660, 420], [690, 450], [735, 470], [760, 520], [730, 570], [670, 580], [640, 540], [650, 470]], 2.6, M.track, 0.05);
      c.instances(P().lightPole(M, 5), c.grid([[660, 470], [740, 470], [660, 545], [740, 545]]));
      for (const p of [[664, 520], [744, 470], [676, 452]]) c.place(P().shadeStructure(M, 6, 4, 2.8, false), p[0], p[1], NORTH);
      c.majlisRing([[672, 556]]);
      c.trees(z, 34, 0.85);
      c.palms([[620, 400], [620, 440], [620, 480], [900, 400], [900, 450]]);
    },

    /* ===== الغروب والضيافة — على الحافة الغربية ===== */
    sunset(c) {
      const M = c.M, z = c.zone;
      c.pad(250, 830, 300, 330, M.track, 0.05);
      // مطعم 40×16 م بواجهة زجاجية غربية
      c.place(P().buildingBlock(M, 40, 16, 5), 300, 800, WEST);
      // شرفة غروب خشبية ممتدة غربًا بدرابزين ودرج
      c.deck(190, 800, 46, 36);
      c.place(P().railing(M, 46, 36), 190, 800, NORTH);
      c.place(P().shadeStructure(M, 34, 8, 4.2), 240, 800, WEST);
      // منصة عزف تواجه الجلسات
      c.stage(210, 900, 12, 8, EAST);
      // مجالس ونيران موزعة على الحافة
      c.majlisRing([[170, 730], [168, 860], [200, 940], [250, 700], [260, 960]]);
      c.ribbon([[300, 640], [280, 700], [240, 760], [210, 830], [200, 900], [230, 970]], 3.2, M.track, 0.05);
      c.instances(P().lightPole(M, 5), c.grid([[150, 700], [150, 780], [150, 860], [150, 940], [330, 700], [330, 900]]));
      c.stringLights([[150, 690], [150, 780], [150, 870], [150, 960]], 4.6);
      c.palms([[350, 660], [390, 680], [430, 700], [350, 940], [390, 960], [120, 660], [120, 990]]);
      c.trees(z, 28, 0.7);
    },

    /* ===== الدروب والهايكنج ===== */
    trails(c) {
      const M = c.M, z = c.zone, trail = NT.data.trail;
      c.ribbon(trail.points, 2.2, M.track, 0.04);
      c.place(P().shadeStructure(M, 10, 6, 3.4, false), 640, 700, NORTH); // نقطة الانطلاق
      for (const v of trail.viewpoints) {
        c.place(P().shadeStructure(M, 5, 4, 2.9, false), v.at[0], v.at[1], NORTH);
        c.rocks(v.at[0], v.at[1], 26, 7);
      }
      c.rocks(600, 1000, 90, 26);
      c.rocks(660, 1300, 110, 30);
      c.trees(z, 44, 1.2);
    },

    /* ===== المخيمات ===== */
    camp(c) {
      const M = c.M, z = c.zone;
      const tent = P().safariTent(M), placements = [];
      const pods = [[870, 850], [1030, 840], [1150, 950], [880, 980]];
      for (const pod of pods) {
        c.disc(pod[0], pod[1], 40, M.arenaSand, 0.06);
        for (let i = 0; i < 6; i++) {
          const a = -Math.PI * 0.15 + (i / 6) * Math.PI * 1.5;
          const x = pod[0] + Math.cos(a) * 30, y = pod[1] + Math.sin(a) * 26;
          placements.push(c.at(x, y, -a + Math.PI / 2, 1));
        }
        c.place(P().firePit(M), pod[0], pod[1], NORTH);
        c.place(P().majlis(M, 4.6), pod[0], pod[1] + 1, NORTH);
        c.place(P().buildingBlock(M, 9, 4.5, 3, M.plasterWarm), pod[0] - 44, pod[1] - 6, SOUTH);
        c.place(P().shadeStructure(M, 8, 6, 3, false), pod[0] + 6, pod[1] - 24, NORTH);
        c.instances(P().lantern(M), c.grid([[pod[0] - 18, pod[1] + 20], [pod[0] + 20, pod[1] + 18], [pod[0] + 2, pod[1] - 30]]));
      }
      c.instances(tent, placements, { pick: z.id });
      c.ribbon([[980, 790], [930, 830], [880, 860], [900, 930], [960, 960], [1060, 940], [1130, 920]], 3, M.track, 0.05);
      c.instances(P().lightPole(M, 5), c.grid(pods.map((p) => [p[0] + 34, p[1] + 30])));
      c.trees(z, 30, 0.8);
      c.palms([[800, 790], [840, 800], [1200, 800], [1230, 830]]);
    },

    /* ===== ليلة القبة ===== */
    domes(c) {
      const M = c.M, z = c.zone;
      c.pad(232, 1290, 250, 330, M.arenaSand, 0.05);
      const dome = P().domeStay(M), placements = [], fires = [];
      // صفان متعرجان بمسافة تحفظ الخصوصية، والواجهات نحو الأفق الغربي
      for (let i = 0; i < 14; i++) {
        const row = i % 2, k = Math.floor(i / 2);
        const x = 140 + row * 92 + c.rnd() * 8;
        const y = 1150 + k * 44 + row * 18;
        placements.push(c.at(x, y, WEST - 0.22 + c.rnd() * 0.44, 1));
        if (i % 4 === 1) fires.push([x + 26, y + 8]);
      }
      c.instances(dome, placements, { pick: z.id });
      for (const f of fires) c.place(P().firePit(M), f[0], f[1], NORTH);
      c.place(P().shadeStructure(M, 14, 9, 4), 330, 1140, NORTH);      // نقطة الإفطار
      c.place(P().buildingBlock(M, 10, 6, 3.2, M.plasterWarm), 400, 1130, SOUTH);
      c.ribbon([[300, 1105], [270, 1160], [240, 1220], [220, 1300], [210, 1380], [230, 1440]], 2.6, M.track, 0.05);
      c.deckPath([[196, 1160], [196, 1240], [196, 1320], [196, 1400]], 2.2);
      c.instances(P().lantern(M), c.grid([[196, 1180], [196, 1260], [196, 1340], [196, 1420], [286, 1200], [286, 1300], [286, 1400]]));
      c.trees(z, 26, 0.9);
      c.palms([[120, 1120], [160, 1110], [420, 1200], [440, 1260]]);
    },

    /* ===== المبيت الخاص ===== */
    private(c) {
      const M = c.M, z = c.zone;
      const villa = P().privateVilla(M), placements = [];
      for (const s of [[1110, 1180], [1230, 1170], [1350, 1190], [1100, 1300], [1220, 1300], [1350, 1310], [1150, 1410], [1300, 1415]]) c.disc(s[0], s[1], 26, M.arenaSand, 0.05);
      const spots = [[1110, 1180], [1230, 1170], [1350, 1190], [1100, 1300], [1220, 1300], [1350, 1310], [1150, 1410], [1300, 1415]];
      for (const s of spots) placements.push(c.at(s[0], s[1], NORTH + (c.rnd() - 0.5) * 0.3, 1));
      c.instances(villa, placements, { pick: z.id });
      c.ribbon([[1240, 1120], [1180, 1160], [1120, 1230], [1140, 1330], [1220, 1380], [1320, 1360], [1380, 1280], [1360, 1190]], 5, M.track, 0.05);
      c.place(P().buildingBlock(M, 12, 7, 3.4, M.plasterWarm), 1420, 1130, SOUTH); // خدمة خلفية
      c.instances(P().lantern(M), c.grid(spots.map((s) => [s[0] - 9, s[1] - 8])));
      c.trees(z, 40, 1.1);
      c.palms(spots.map((s) => [s[0] + 10, s[1] + 6]));
    }
  };

  NT.content = { build, builders, NORTH, WEST, EAST, SOUTH };
})(window.NT = window.NT || {});
