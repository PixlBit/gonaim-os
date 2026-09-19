import type {
  Appointment, Capsule, Contribution, Decision, Expense, Item, LogEntry,
  Memory, Milestone, Note, PersonKey, Room, Space, Task, Wish,
} from "./types.js";
import { LOG_LIMIT } from "./types.js";
import type { Action } from "./schema.js";
import { newId } from "./ids.js";
import { money } from "./money.js";
import { T, enDate, type Text } from "./text.js";
import { arDate, arDayDate, arTime, day } from "./dates.js";

/**
 * تطبيق الأفعال.
 *
 * دالة نقية: نفس المساحة ونفس الفعل ونفس اللحظة تعطي نفس الناتج. لا شبكة
 * ولا قاعدة ولا `Date.now()` مخفي — الوقت يدخل من `ctx`. هذا ما يجعل كل
 * قاعدة هنا قابلة للاختبار بلا قاعدة بيانات، وما يجعل التخزين مجرد
 * "احفظ الناتج" لا منطقًا ثانيًا يجب أن يتفق مع الأول.
 *
 * وكل فعل ناجح يزيد `version` ويكتب سطرًا في السجل. لا كتابة صامتة: مساحة
 * بين اثنين تحتاج أن تُجيب دائمًا على "مين غيّر ده؟".
 */

export interface ActContext {
  by: PersonKey;
  now: Date;
}

export type ActErrorCode =
  | "not_found"      // المستهدَف غير موجود
  | "too_early"      // كبسولة قبل موعدها
  | "not_yours"      // فعل يخص الطرف الآخر
  | "not_allowed";   // قاعدة مجال تمنعه

/**
 * خطأ فعل — برسالته باللغتين.
 *
 * `Error.message` واحد لأن `Error` كذلك، ويُملأ بالعربية للسجل والتتبّع؛
 * و`text` يحمل الاثنين لما يخرج إلى الشاشة. فلا يضطر الخادم لأن يعرف لغة
 * القارئ قبل أن يرمي الخطأ.
 */
export class ActError extends Error {
  readonly text: Text;
  constructor(readonly code: ActErrorCode, ar: string, en: string = ar) {
    super(ar);
    this.text = T(ar, en);
    this.name = "ActError";
  }
}

/** يطبّق تعديلًا جزئيًا: `null` يحذف الحقل، والغياب لا يلمسه. */
function withPatch<T extends object>(base: T, patch: Record<string, unknown>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (v === null) delete out[k];
    else out[k] = v;
  }
  return out as T;
}

function find<T extends { id: string }>(list: readonly T[], id: string, what: string): T {
  const hit = list.find((x) => x.id === id);
  if (!hit) throw new ActError("not_found", `${what} غير موجود: ${id}`, `${what} not found: ${id}`);
  return hit;
}

function replace<T extends { id: string }>(list: readonly T[], next: T): T[] {
  return list.map((x) => (x.id === next.id ? next : x));
}

function drop<T extends { id: string }>(list: readonly T[], id: string): T[] {
  return list.filter((x) => x.id !== id);
}

const OWNER_AR: Record<string, string> = { him: "هو", her: "هي", both: "الاثنين" };

export function apply(space: Space, action: Action, ctx: ActContext): Space {
  const at = ctx.now.toISOString();
  const me = space.people[ctx.by].name;
  const next = { ...space };
  let summary: string;

  switch (action.type) {
    case "settings.update": {
      const { type: _t, address, ...rest } = action;
      const settings = withPatch(space.settings, rest);
      next.settings = address
        ? { ...settings, address: withPatch(space.settings.address, address) }
        : settings;
      summary = "عدّل إعدادات المساحة";
      break;
    }

    case "person.update": {
      const { type: _t, key, ...rest } = action;
      next.people = { ...space.people, [key]: withPatch(space.people[key], rest) };
      summary = `عدّل بيانات ${space.people[key].name}`;
      break;
    }

    case "lang.set": {
      const me = space.people[ctx.by];
      next.people = { ...space.people, [ctx.by]: { ...me, lang: action.lang } };
      // السطر بالعربية كبقية السجل: السجل ذاكرة المساحة لا واجهة قارئ.
      summary = action.lang === "ar" ? "رجع للعربي" : "بدّل للإنجليزي";
      break;
    }

    case "persona.set": {
      const me = space.people[ctx.by];
      const traits = withPatch(me.traits ?? {}, { ...action.traits, updatedAt: at });
      next.people = { ...space.people, [ctx.by]: { ...me, traits } };
      summary = "حدّث أنماطه";
      break;
    }

    case "milestone.set": {
      const { type: _t, id, kind, title, date, note } = action;
      const existing = id ? space.milestones.find((m) => m.id === id) : undefined;
      const base: Milestone = existing
        ? { ...existing, kind, title, date }
        : { id: newId("ms", ctx.now), kind, title, date, done: false };
      const m = withPatch(base, { note });
      next.milestones = [...(existing ? drop(space.milestones, existing.id) : space.milestones), m]
        .sort((a, b) => a.date.localeCompare(b.date));
      summary = `${existing ? "عدّل" : "حدّد"} ${title}: ${arDate(date)}`;
      break;
    }

    case "milestone.done": {
      const m = find(space.milestones, action.id, "المحطة");
      next.milestones = replace(space.milestones, { ...m, done: action.done });
      summary = action.done ? `${m.title} — تمّت` : `${m.title} — رجعت قدّامنا`;
      break;
    }

    case "milestone.remove": {
      const m = find(space.milestones, action.id, "المحطة");
      next.milestones = drop(space.milestones, action.id);
      summary = `شال المحطة: ${m.title}`;
      break;
    }

    case "task.add": {
      const { type: _t, title, note, due, ...rest } = action;
      const task = withPatch<Task>({
        id: newId("task", ctx.now), title,
        owner: rest.owner, phase: rest.phase, priority: rest.priority,
        status: "todo", tags: rest.tags,
        createdBy: ctx.by, createdAt: at,
      }, { note, due });
      next.tasks = [task, ...space.tasks];
      summary = `مهمة جديدة: ${title}`;
      break;
    }

    case "task.update": {
      const t = find(space.tasks, action.id, "المهمة");
      let updated = withPatch(t, action.patch);
      // "تمّت" ليست حقلًا نصيًا — تحمل معها مَن ومتى، وإلغاؤها يمسحهما
      if (action.patch.status === "done" && t.status !== "done") {
        updated = { ...updated, doneAt: at, doneBy: ctx.by };
      } else if (action.patch.status !== undefined && action.patch.status !== "done") {
        updated = withPatch(updated, { doneAt: null, doneBy: null });
      }
      // مهمة لمسها إنسان لم تعد جزءًا من الكشف الافتراضي
      next.tasks = replace(space.tasks, withPatch(updated, { seeded: null }));
      summary = action.patch.status === "done"
        ? `خلّص: ${t.title}`
        : `عدّل المهمة: ${t.title}`;
      break;
    }

    case "task.remove": {
      const t = find(space.tasks, action.id, "المهمة");
      next.tasks = drop(space.tasks, action.id);
      summary = `شال المهمة: ${t.title}`;
      break;
    }

    case "room.add": {
      const room: Room = {
        id: newId("room", ctx.now), name: action.name, glyph: action.glyph,
        order: space.rooms.length,
      };
      next.rooms = [...space.rooms, room];
      summary = `أضاف غرفة: ${action.name}`;
      break;
    }

    case "room.update": {
      const r = find(space.rooms, action.id, "الغرفة");
      const { type: _t, id: _i, ...rest } = action;
      next.rooms = replace(space.rooms, withPatch(r, rest));
      summary = `عدّل الغرفة: ${r.name}`;
      break;
    }

    case "room.remove": {
      const r = find(space.rooms, action.id, "الغرفة");
      const inside = space.items.filter((i) => i.roomId === r.id);
      // الحذف يشيل ما بداخلها — والسجل يقول كم شال، فلا يختفي شيء بصمت
      next.rooms = drop(space.rooms, action.id);
      next.items = space.items.filter((i) => i.roomId !== r.id);
      summary = inside.length
        ? `شال غرفة ${r.name} ومعاها ${inside.length} عنصر`
        : `شال غرفة: ${r.name}`;
      break;
    }

    case "item.add": {
      const { type: _t, roomId, name, status, priority, qty, ...opt } = action;
      find(space.rooms, roomId, "الغرفة");
      const item = withPatch<Item>({
        id: newId("item", ctx.now), roomId, name, status, priority, qty,
        addedBy: ctx.by, createdAt: at,
      }, { ...opt, ...(status === "bought" ? { boughtAt: at } : {}) });
      next.items = [item, ...space.items];
      summary = `أضاف لـ${roomName(space, roomId)}: ${name}`;
      break;
    }

    case "item.update": {
      const it = find(space.items, action.id, "العنصر");
      if (action.patch.roomId) find(space.rooms, action.patch.roomId, "الغرفة");
      let updated = withPatch(it, action.patch);
      if (action.patch.status === "bought" && it.status !== "bought") {
        updated = { ...updated, boughtAt: at };
      } else if (action.patch.status !== undefined && action.patch.status !== "bought") {
        updated = withPatch(updated, { boughtAt: null });
      }
      next.items = replace(space.items, withPatch(updated, { seeded: null }));
      summary = action.patch.status === "bought"
        ? `اشترى: ${it.name}${priceOf(updated) ? ` — ${money(priceOf(updated), space.settings.currency)}` : ""}`
        : `عدّل: ${it.name}`;
      break;
    }

    case "item.remove": {
      const it = find(space.items, action.id, "العنصر");
      next.items = drop(space.items, action.id);
      summary = `شال: ${it.name}`;
      break;
    }

    case "item.bulk": {
      find(space.rooms, action.roomId, "الغرفة");
      const seen = new Set(
        space.items.filter((i) => i.roomId === action.roomId).map((i) => i.name.trim()),
      );
      // اللصق المكرر لا يضاعف الكشف — نفس الاسم في نفس الغرفة يُتجاهَل
      const fresh = action.names.filter((n) => !seen.has(n.trim()) && seen.add(n.trim()));
      const made: Item[] = fresh.map((name) => ({
        id: newId("item", ctx.now), roomId: action.roomId, name,
        status: "needed", priority: 2, qty: 1, addedBy: ctx.by, createdAt: at,
      }));
      next.items = [...made, ...space.items];
      summary = `أضاف ${made.length} عنصر لـ${roomName(space, action.roomId)}`;
      break;
    }

    case "contribution.add": {
      const { type: _t, note, ...rest } = action;
      const c = withPatch<Contribution>({
        id: newId("con", ctx.now), ...rest, createdBy: ctx.by, createdAt: at,
      }, { note });
      next.contributions = [c, ...space.contributions];
      summary = `دخل الصندوق ${money(action.amount, space.settings.currency)} من ${OWNER_AR[action.who]}`;
      break;
    }

    case "contribution.remove": {
      const c = find(space.contributions, action.id, "الإيداع");
      next.contributions = drop(space.contributions, action.id);
      summary = `شال إيداع ${money(c.amount, space.settings.currency)}`;
      break;
    }

    case "expense.add": {
      const { type: _t, note, ...rest } = action;
      const e = withPatch<Expense>({
        id: newId("exp", ctx.now), ...rest, createdBy: ctx.by, createdAt: at,
      }, { note });
      next.expenses = [e, ...space.expenses];
      summary = `مصروف: ${action.title} — ${money(action.amount, space.settings.currency)}`;
      break;
    }

    case "expense.update": {
      const e = find(space.expenses, action.id, "المصروف");
      next.expenses = replace(space.expenses, withPatch(e, action.patch));
      summary = `عدّل المصروف: ${e.title}`;
      break;
    }

    case "expense.remove": {
      const e = find(space.expenses, action.id, "المصروف");
      next.expenses = drop(space.expenses, action.id);
      summary = `شال المصروف: ${e.title}`;
      break;
    }

    case "appointment.add": {
      const { type: _t, title, at: when, attendees, ...opt } = action;
      const a = withPatch<Appointment>({
        id: newId("apt", ctx.now), title, at: when, attendees,
        status: "planned", createdBy: ctx.by, createdAt: at,
      }, opt);
      next.appointments = [...space.appointments, a].sort((x, y) => x.at.localeCompare(y.at));
      summary = `ميعاد: ${title} — ${arDayDate(when)} ${arTime(when)}`;
      break;
    }

    case "appointment.update": {
      const a = find(space.appointments, action.id, "الميعاد");
      next.appointments = replace(space.appointments, withPatch(a, action.patch))
        .sort((x, y) => x.at.localeCompare(y.at));
      summary = action.patch.status === "cancelled"
        ? `اتلغى ميعاد: ${a.title}`
        : `عدّل ميعاد: ${a.title}`;
      break;
    }

    case "appointment.remove": {
      const a = find(space.appointments, action.id, "الميعاد");
      next.appointments = drop(space.appointments, action.id);
      summary = `شال ميعاد: ${a.title}`;
      break;
    }

    case "memory.add": {
      const { type: _t, date, title, photos, tags, ...opt } = action;
      const m = withPatch<Memory>({
        id: newId("mem", ctx.now), date, title, photos, tags,
        by: ctx.by, createdAt: at,
      }, opt);
      next.memories = [m, ...space.memories].sort((x, y) => y.date.localeCompare(x.date));
      summary = `ذكرى: ${title} — ${arDate(date)}`;
      break;
    }

    case "memory.update": {
      const m = find(space.memories, action.id, "الذكرى");
      next.memories = replace(space.memories, withPatch(m, action.patch))
        .sort((x, y) => y.date.localeCompare(x.date));
      summary = `عدّل الذكرى: ${m.title}`;
      break;
    }

    case "memory.remove": {
      const m = find(space.memories, action.id, "الذكرى");
      next.memories = drop(space.memories, action.id);
      summary = `شال الذكرى: ${m.title}`;
      break;
    }

    case "wish.add": {
      const { type: _t, title, kind, ...opt } = action;
      const w = withPatch<Wish>({
        id: newId("wish", ctx.now), title, kind, status: "someday",
        by: ctx.by, createdAt: at,
      }, opt);
      next.wishes = [w, ...space.wishes];
      summary = `حاجة نعملها: ${title}`;
      break;
    }

    case "wish.update": {
      const w = find(space.wishes, action.id, "الأمنية");
      let updated = withPatch(w, action.patch);
      if (action.patch.status === "done" && w.status !== "done") {
        updated = { ...updated, doneAt: at };
      } else if (action.patch.status !== undefined && action.patch.status !== "done") {
        updated = withPatch(updated, { doneAt: null });
      }
      next.wishes = replace(space.wishes, updated);
      summary = action.patch.status === "done" ? `عملناها: ${w.title}` : `عدّل: ${w.title}`;
      break;
    }

    case "wish.remove": {
      const w = find(space.wishes, action.id, "الأمنية");
      next.wishes = drop(space.wishes, action.id);
      summary = `شال: ${w.title}`;
      break;
    }

    case "note.send": {
      const n: Note = { id: newId("note", ctx.now), from: ctx.by, body: action.body, at };
      next.notes = [n, ...space.notes];
      summary = "بعت رسالة";
      break;
    }

    case "note.read": {
      const n = find(space.notes, action.id, "الرسالة");
      // "قُرئت" شهادة من المستقبِل. الكاتب لا يشهد على قراءة نفسه.
      if (n.from === ctx.by) throw new ActError("not_yours", "دي رسالتك أنت.", "That note is your own.");
      next.notes = n.readAt ? space.notes : replace(space.notes, { ...n, readAt: at });
      summary = "قرأ رسالة";
      break;
    }

    case "note.pin": {
      const n = find(space.notes, action.id, "الرسالة");
      next.notes = replace(space.notes, withPatch(n, { pinned: action.pinned || null }));
      summary = action.pinned ? "ثبّت رسالة" : "شال تثبيت رسالة";
      break;
    }

    case "note.remove": {
      const n = find(space.notes, action.id, "الرسالة");
      if (n.from !== ctx.by) throw new ActError("not_yours", "مش رسالتك عشان تمسحها.", "Not your note to delete.");
      next.notes = drop(space.notes, action.id);
      summary = "مسح رسالة بعتها";
      break;
    }

    case "capsule.write": {
      const c: Capsule = {
        id: newId("cap", ctx.now), from: ctx.by,
        title: action.title, body: action.body, openAt: action.openAt, createdAt: at,
      };
      next.capsules = [c, ...space.capsules];
      summary = `كتب رسالة تتفتح ${arDate(action.openAt)}`;
      break;
    }

    case "capsule.open": {
      const c = find(space.capsules, action.id, "الرسالة");
      // القفل زمني لا اجتماعي: حتى كاتبها لا يفتحها قبل موعدها
      if (day(at) < c.openAt) {
        throw new ActError("too_early", `لسه بدري — بتتفتح ${arDate(c.openAt)}.`, `Too early — it opens on ${enDate(c.openAt)}.`);
      }
      next.capsules = c.openedAt ? space.capsules : replace(space.capsules, { ...c, openedAt: at });
      summary = `فتح: ${c.title}`;
      break;
    }

    case "capsule.remove": {
      const c = find(space.capsules, action.id, "الرسالة");
      if (c.from !== ctx.by) throw new ActError("not_yours", "مش رسالتك.", "Not your letter.");
      next.capsules = drop(space.capsules, action.id);
      summary = `شال رسالة: ${c.title}`;
      break;
    }

    case "decision.ask": {
      const d: Decision = {
        id: newId("dec", ctx.now), question: action.question,
        options: action.options.map((o, i) => withPatch({ id: `o${i + 1}`, label: o.label }, {
          note: o.note, cost: o.cost,
        })),
        votes: {}, createdBy: ctx.by, createdAt: at,
      };
      next.decisions = [d, ...space.decisions];
      summary = `سأل: ${action.question}`;
      break;
    }

    case "decision.vote": {
      const d = find(space.decisions, action.id, "القرار");
      if (!d.options.some((o) => o.id === action.option)) {
        throw new ActError("not_found", "الخيار ده مش موجود.", "That option does not exist.");
      }
      const votes = { ...d.votes, [ctx.by]: action.option };
      // لا حسم بصوت واحد ولا بأغلبية — اتفاق أو لا شيء
      const agreed = votes.him !== undefined && votes.him === votes.her;
      const updated: Decision = withPatch({ ...d, votes }, {
        chosen: agreed ? votes.him : null,
        resolvedAt: agreed ? at : null,
      });
      next.decisions = replace(space.decisions, updated);
      const label = d.options.find((o) => o.id === action.option)?.label ?? "";
      summary = agreed ? `اتفقنا: ${label}` : `صوّت: ${label}`;
      break;
    }

    case "decision.remove": {
      const d = find(space.decisions, action.id, "القرار");
      next.decisions = drop(space.decisions, action.id);
      summary = `شال القرار: ${d.question}`;
      break;
    }

    case "seed.clear": {
      const items = space.items.filter((i) => !i.seeded);
      const tasks = space.tasks.filter((t) => !t.seeded);
      const removed = (space.items.length - items.length) + (space.tasks.length - tasks.length);
      if (removed === 0) throw new ActError("not_allowed", "مفيش حاجة من الكشف الافتراضي باقية.", "Nothing is left from the default checklist.");
      next.items = items;
      next.tasks = tasks;
      summary = `مسح ${removed} سطر من الكشف الافتراضي`;
      break;
    }
  }

  const entry: LogEntry = {
    id: newId("log", ctx.now), at, by: ctx.by, action: action.type,
    summary: `${me}: ${summary}`,
  };

  next.version = space.version + 1;
  next.updatedAt = at;
  next.log = [entry, ...next.log].slice(0, LOG_LIMIT);
  return next;
}

function roomName(space: Space, roomId: string): string {
  return space.rooms.find((r) => r.id === roomId)?.name ?? "الشقة";
}

function priceOf(i: Item): number {
  return (i.actualPrice ?? i.targetPrice ?? 0) * (i.qty || 1);
}
