import { z } from "zod";

/**
 * عقد الكتابة.
 *
 * كل تغيير في المساحة يمر من هنا: فعل واحد موصوف، يُتحقَّق منه على الخادم
 * قبل أن يلمس أي بيانات. الواجهة لا تُرسل "المساحة بعد التعديل" أبدًا —
 * ترسل ما تريد فعله. الفرق أمني لا أسلوبي: عميل مخترَق يستطيع إرسال حالة
 * كاملة مزوّرة، ولا يستطيع تجاوز فعل مُتحقَّق منه.
 *
 * `null` في أي حقل اختياري تعني **احذف القيمة**؛ غياب الحقل يعني **لا تلمسه**.
 * بدون هذا التمييز لا توجد طريقة لمسح تاريخ أو ملاحظة بعد كتابتها.
 */

const id = z.string().min(1).max(64);
const text = (max: number) => z.string().trim().min(1).max(max);
const optText = (max: number) => z.string().trim().max(max).nullish();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ غير صالح");
const localTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "وقت غير صالح");
/** المبالغ غير سالبة ومحدودة — رقم بلا سقف يكسر كل رسم بياني. */
const amount = z.number().finite().min(0).max(1e12);
const person = z.enum(["him", "her"]);
const actor = z.enum(["him", "her", "both"]);
const priority = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const tags = z.array(z.string().trim().min(1).max(40)).max(12);
const url = z.string().trim().url().max(2000);

export const Actions = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("settings.update"),
    title: optText(80),
    currency: optText(8),
    budget: amount.nullish(),
    together: date.nullish(),
    address: z.object({
      label: optText(120), area: optText(80), city: optText(80),
      floor: optText(40), mapUrl: url.nullish(), note: optText(500),
    }).partial().nullish(),
  }),

  z.object({
    type: z.literal("person.update"),
    key: person,
    name: text(40).optional(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    line: optText(160),
  }),

  /**
   * اللغة.
   *
   * بلا `key` — كـ`persona.set` تمامًا: لا شكل للطلب يبدّل به أحدهما لغة
   * قراءة الآخر. والملكية مفروضة بالتركيب لا بفحص، فلا مكان لثغرة نسيان.
   */
  z.object({ type: z.literal("lang.set"), lang: z.enum(["ar", "en"]) }),

  /**
   * أنماط الشخصية.
   *
   * بلا `key`: الفعل يطبَّق على صاحبه دائمًا. الملكية مفروضة بالتركيب لا
   * بفحص لاحق — فلا يوجد شكل للطلب أصلًا يعدّل به أحدهما ملف الآخر.
   */
  z.object({
    type: z.literal("persona.set"),
    traits: z.object({
      loveLanguage: z.enum(["words", "time", "gifts", "acts", "touch"]).nullish(),
      decisionStyle: z.enum(["fast", "research", "consult", "avoid"]).nullish(),
      stressStyle: z.enum(["talk", "space", "fix", "distract"]).nullish(),
      energyTime: z.enum(["morning", "day", "night"]).nullish(),
      conflict: z.enum(["direct", "soft", "delay"]).nullish(),
      planning: z.enum(["planner", "flow"]).nullish(),
      money: z.enum(["saver", "balanced", "spender"]).nullish(),
      recharge: optText(200),
      joy: optText(200),
      friction: optText(200),
    }).partial(),
  }),

  z.object({
    type: z.literal("milestone.set"),
    id: id.optional(),
    kind: z.enum(["engagement", "katb", "wedding", "honeymoon", "move", "custom"]),
    title: text(60),
    date,
    note: optText(300),
  }),
  z.object({ type: z.literal("milestone.done"), id, done: z.boolean() }),
  z.object({ type: z.literal("milestone.remove"), id }),

  z.object({
    type: z.literal("task.add"),
    title: text(120),
    note: optText(1000),
    owner: actor.default("both"),
    phase: z.enum(["engagement", "prep", "wedding", "after"]).default("prep"),
    priority: priority.default(2),
    due: date.nullish(),
    tags: tags.default([]),
  }),
  z.object({
    type: z.literal("task.update"),
    id,
    patch: z.object({
      title: text(120), note: optText(1000), owner: actor,
      phase: z.enum(["engagement", "prep", "wedding", "after"]),
      status: z.enum(["todo", "doing", "done", "blocked"]),
      priority, due: date.nullish(), tags,
    }).partial(),
  }),
  z.object({ type: z.literal("task.remove"), id }),

  z.object({ type: z.literal("room.add"), name: text(40), glyph: z.string().trim().max(4).default("◇") }),
  z.object({ type: z.literal("room.update"), id, name: text(40).optional(), glyph: z.string().trim().max(4).optional() }),
  z.object({ type: z.literal("room.remove"), id }),

  z.object({
    type: z.literal("item.add"),
    roomId: id,
    name: text(120),
    status: z.enum(["needed", "chosen", "ordered", "bought"]).default("needed"),
    priority: priority.default(2),
    qty: z.number().int().min(1).max(999).default(1),
    targetPrice: amount.nullish(),
    actualPrice: amount.nullish(),
    paidBy: actor.nullish(),
    store: optText(80),
    url: url.nullish(),
    note: optText(500),
  }),
  z.object({
    type: z.literal("item.update"),
    id,
    patch: z.object({
      roomId: id, name: text(120),
      status: z.enum(["needed", "chosen", "ordered", "bought"]),
      priority, qty: z.number().int().min(1).max(999),
      targetPrice: amount.nullish(), actualPrice: amount.nullish(),
      paidBy: actor.nullish(), store: optText(80), url: url.nullish(), note: optText(500),
    }).partial(),
  }),
  z.object({ type: z.literal("item.remove"), id }),
  /** لصق قائمة كاملة سطرًا سطرًا — أسرع طريق لإدخال كشف مكتوب على ورق. */
  z.object({
    type: z.literal("item.bulk"),
    roomId: id,
    names: z.array(text(120)).min(1).max(120),
  }),

  z.object({
    type: z.literal("contribution.add"),
    who: actor, amount, at: date, note: optText(200),
  }),
  z.object({ type: z.literal("contribution.remove"), id }),

  z.object({
    type: z.literal("expense.add"),
    title: text(120), category: text(40), amount, at: date,
    paidBy: actor.default("both"), note: optText(500),
  }),
  z.object({
    type: z.literal("expense.update"),
    id,
    patch: z.object({
      title: text(120), category: text(40), amount, at: date,
      paidBy: actor, note: optText(500),
    }).partial(),
  }),
  z.object({ type: z.literal("expense.remove"), id }),

  z.object({
    type: z.literal("appointment.add"),
    title: text(120), at: localTime,
    durationMin: z.number().int().min(0).max(1440).nullish(),
    place: optText(160), mapUrl: url.nullish(), with: optText(80),
    attendees: actor.default("both"), note: optText(500),
  }),
  z.object({
    type: z.literal("appointment.update"),
    id,
    patch: z.object({
      title: text(120), at: localTime,
      durationMin: z.number().int().min(0).max(1440).nullish(),
      place: optText(160), mapUrl: url.nullish(), with: optText(80),
      attendees: actor, status: z.enum(["planned", "done", "cancelled"]),
      note: optText(500),
    }).partial(),
  }),
  z.object({ type: z.literal("appointment.remove"), id }),

  z.object({
    type: z.literal("memory.add"),
    date, title: text(120), story: optText(4000), place: optText(160),
    photos: z.array(z.string().max(300)).max(12).default([]),
    tags: tags.default([]),
  }),
  z.object({
    type: z.literal("memory.update"),
    id,
    patch: z.object({
      date, title: text(120), story: optText(4000), place: optText(160),
      photos: z.array(z.string().max(300)).max(12), tags,
      pinned: z.boolean(),
    }).partial(),
  }),
  z.object({ type: z.literal("memory.remove"), id }),

  z.object({
    type: z.literal("wish.add"),
    title: text(160),
    kind: z.enum(["date", "travel", "experience", "habit", "buy"]).default("experience"),
    note: optText(1000), plannedFor: date.nullish(), cost: amount.nullish(),
  }),
  z.object({
    type: z.literal("wish.update"),
    id,
    patch: z.object({
      title: text(160), kind: z.enum(["date", "travel", "experience", "habit", "buy"]),
      status: z.enum(["someday", "planned", "done"]),
      note: optText(1000), plannedFor: date.nullish(), cost: amount.nullish(),
    }).partial(),
  }),
  z.object({ type: z.literal("wish.remove"), id }),

  z.object({ type: z.literal("note.send"), body: text(2000) }),
  z.object({ type: z.literal("note.read"), id }),
  z.object({ type: z.literal("note.pin"), id, pinned: z.boolean() }),
  z.object({ type: z.literal("note.remove"), id }),

  z.object({
    type: z.literal("capsule.write"),
    title: text(120), body: text(6000), openAt: date,
  }),
  z.object({ type: z.literal("capsule.open"), id }),
  z.object({ type: z.literal("capsule.remove"), id }),

  z.object({
    type: z.literal("decision.ask"),
    question: text(200),
    options: z.array(z.object({
      label: text(80), note: optText(200), cost: amount.nullish(),
    })).min(2).max(6),
  }),
  z.object({ type: z.literal("decision.vote"), id, option: id }),
  z.object({ type: z.literal("decision.remove"), id }),

  /** يمسح كل ما جاء من الكشف الافتراضي ولم يُلمس. */
  z.object({ type: z.literal("seed.clear") }),
]);

export type Action = z.infer<typeof Actions>;
export type ActionType = Action["type"];
