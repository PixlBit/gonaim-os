import type { Item, PersonKey, Room, Space, Task } from "./types.js";
import { today } from "./dates.js";

/**
 * المساحة الأولى.
 *
 * منصة فارغة تُهجَر في أسبوع. فتبدأ المساحة بكشف تجهيز حقيقي — الغرف
 * وعناصرها والمهام الكبيرة — لأن أصعب خطوة ليست الشراء بل تذكّر ما يلزم.
 *
 * **بلا أسعار.** كل عنصر يبدأ بلا سعر مقصودًا: سعر أخترعه أنا يدخل
 * حساباتكم ويخرج في تقرير الميزانية كأنه معلومة. الأسعار تُكتب مرة واحدة
 * من السوق، والتحليلات تنبّه على كل عنصر ما زال بلا سعر بدل أن تخفيه.
 *
 * وكل ما يأتي من هنا مُعلَّم `seeded` — فيُمسح كله بفعل واحد لمن أراد
 * أن يبدأ من ورقة بيضاء.
 */

export interface SeedOptions {
  him: { name: string; handle: string };
  her: { name: string; handle: string };
  title?: string;
  currency?: string;
  now?: Date;
  /** بلا كشف التجهيز الافتراضي — مساحة فاضية تمامًا. */
  bare?: boolean;
}

interface RoomSeed { name: string; glyph: string; items: string[] }

/** كشف شقة مصرية. الترتيب ترتيب أولوية الاستعمال لا الأبجدية. */
const ROOM_SEEDS: RoomSeed[] = [
  {
    name: "غرفة النوم", glyph: "⌾",
    items: [
      "سرير", "مرتبة", "دولاب", "تسريحة", "كومودينو", "مرتبة سرير إضافية",
      "مراتب سرير (واقي)", "ملايات", "لحاف", "مخدات", "ستائر", "سجادة",
      "تكييف", "تليفزيون", "نجفة/إضاءة", "مرايا",
    ],
  },
  {
    name: "الريسبشن", glyph: "◈",
    items: [
      "أنتريه/كنب", "ترابيزة وسط", "ترابيزات جانبية", "مكتبة/وحدة تليفزيون",
      "تليفزيون", "سجادة", "ستائر", "نجفة", "تكييف", "لوحات/ديكور",
      "مراوح", "ترابيزة سفرة", "كراسي سفرة", "بوفيه",
    ],
  },
  {
    name: "المطبخ", glyph: "◧",
    items: [
      "مطبخ (وحدات)", "بوتاجاز", "ثلاجة", "ديب فريزر", "غسالة أطباق",
      "شفاط", "ميكروويف", "غلاية", "خلاط", "عجان", "محمصة", "مكنسة كهربائية",
      "حلل (طقم)", "أطباق (طقم)", "أطقم شوك وسكاكين", "أكواب", "صواني فرن",
      "برطمانات", "سلة قمامة", "ستارة مطبخ", "فوطة/مفارش", "أدوات تنظيف",
    ],
  },
  {
    name: "الحمام", glyph: "◍",
    items: [
      "سخان", "أطقم حمام (بورسلين)", "خلاطات", "مرايا", "دولاب حمام",
      "ستارة حمام", "فوط", "سلة غسيل", "شفاط حمام", "سجادة حمام",
      "أدوات نظافة", "غسالة ملابس", "حبل/منشر",
    ],
  },
  {
    name: "البلكونة", glyph: "◉",
    items: ["كراسي بلكونة", "ترابيزة بلكونة", "نباتات", "إضاءة", "مظلة/ستارة"],
  },
  {
    name: "أساسيات الشقة", glyph: "▣",
    items: [
      "عداد كهرباء", "عداد مياه", "عداد غاز", "إنترنت", "أبواب", "أقفال",
      "دهانات", "أرضيات", "كهرباء (تأسيس)", "سباكة (تأسيس)", "طفاية حريق",
      "شنطة إسعافات", "عدة صيانة", "مكواة", "منظم كهرباء",
    ],
  },
];

/** المهام الكبيرة التي تُنسى: الورق والمواعيد لا العفش. */
const TASK_SEEDS: Array<Pick<Task, "title" | "phase" | "priority" | "owner"> & { note?: string }> = [
  { title: "تحديد ميعاد الفرح", phase: "engagement", priority: 1, owner: "both" },
  { title: "الاتفاق على الميزانية وحدودها", phase: "engagement", priority: 1, owner: "both",
    note: "رقم واحد متفق عليه أهم من مئة تفصيلة." },
  { title: "عقد الشقة / الإيجار", phase: "engagement", priority: 1, owner: "him" },
  { title: "قائمة المنقولات", phase: "prep", priority: 1, owner: "both" },
  { title: "حجز القاعة", phase: "prep", priority: 1, owner: "both" },
  { title: "الشبكة", phase: "engagement", priority: 1, owner: "him" },
  { title: "الدبل", phase: "prep", priority: 2, owner: "both" },
  { title: "فستان الفرح", phase: "prep", priority: 1, owner: "her" },
  { title: "بدلة العريس", phase: "prep", priority: 2, owner: "him" },
  { title: "المصور (فوتو وفيديو)", phase: "prep", priority: 1, owner: "both" },
  { title: "الكوافير", phase: "prep", priority: 2, owner: "her" },
  { title: "الدي جي / الفرقة", phase: "prep", priority: 2, owner: "both" },
  { title: "الكوشة والتنسيق", phase: "prep", priority: 2, owner: "both" },
  { title: "قائمة المعازيم", phase: "prep", priority: 1, owner: "both" },
  { title: "الدعوات", phase: "prep", priority: 3, owner: "both" },
  { title: "الفحص الطبي وورق الجواز", phase: "prep", priority: 1, owner: "both" },
  { title: "المأذون", phase: "prep", priority: 1, owner: "him" },
  { title: "حجز شهر العسل", phase: "wedding", priority: 2, owner: "both" },
  { title: "تحويل عداد الكهرباء والغاز للاسم", phase: "after", priority: 3, owner: "him" },
  { title: "أول عزومة في بيتنا", phase: "after", priority: 3, owner: "both" },
];

export function seedSpace(opts: SeedOptions): Space {
  const now = opts.now ?? new Date();
  const at = now.toISOString();
  const by: PersonKey = "him";

  const rooms: Room[] = [];
  const items: Item[] = [];

  if (!opts.bare) {
    ROOM_SEEDS.forEach((r, i) => {
      const roomId = `room_${i + 1}`;
      rooms.push({ id: roomId, name: r.name, glyph: r.glyph, order: i });
      r.items.forEach((name, j) => {
        items.push({
          id: `item_${i + 1}_${j + 1}`,
          roomId, name,
          status: "needed",
          // الأولوية الافتراضية وسط: ما يُولَد "عاجلًا" يفقد معنى العجلة.
          priority: 2,
          qty: 1,
          addedBy: by,
          createdAt: at,
          seeded: true,
        });
      });
    });
  }

  const tasks: Task[] = opts.bare ? [] : TASK_SEEDS.map((t, i) => ({
    id: `task_${i + 1}`,
    title: t.title,
    ...(t.note === undefined ? {} : { note: t.note }),
    owner: t.owner,
    phase: t.phase,
    status: "todo" as const,
    priority: t.priority,
    tags: [],
    createdBy: by,
    createdAt: at,
    seeded: true,
  }));

  return {
    schema: 1,
    version: 1,
    updatedAt: at,
    people: {
      him: { key: "him", name: opts.him.name, handle: opts.him.handle, accent: "#A855F7" },
      her: { key: "her", name: opts.her.name, handle: opts.her.handle, accent: "#F472B6" },
    },
    settings: {
      title: opts.title ?? "إحنا",
      currency: opts.currency ?? "ج",
      budget: 0,
      address: {},
    },
    milestones: [],
    tasks,
    rooms,
    items,
    contributions: [],
    expenses: [],
    appointments: [],
    memories: [],
    wishes: [],
    notes: [],
    capsules: [],
    decisions: [],
    log: [{
      id: "log_1",
      at,
      by,
      action: "space.create",
      summary: `بدأت المساحة — ${today(now)}`,
    }],
  };
}

/** عدد ما يولده الكشف الافتراضي — يُستخدم في الاختبار وفي شاشة الإعداد. */
export const SEED_COUNTS = {
  rooms: ROOM_SEEDS.length,
  items: ROOM_SEEDS.reduce((n, r) => n + r.items.length, 0),
  tasks: TASK_SEEDS.length,
};
