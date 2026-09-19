import { describe, it, expect } from "vitest";
import { apply } from "../src/actions.js";
import { Actions } from "../src/schema.js";
import { seedSpace } from "../src/seed.js";
import { analyze, readiness } from "../src/analytics.js";
import { attend } from "../src/attention.js";
import { report } from "../src/report.js";
import { forViewer } from "../src/redact.js";
import { arSpan, daysBetween, weekKey } from "../src/dates.js";
import type { Item, Space } from "../src/types.js";

const NOW = new Date("2026-01-10T12:00:00.000Z");
const TODAY = "2026-01-10";

function base(): Space {
  return seedSpace({ him: { name: "غنيم", handle: "g" }, her: { name: "نور", handle: "n" }, now: NOW, bare: true });
}
function act(s: Space, raw: unknown, by: "him" | "her" = "him", now = NOW): Space {
  return apply(s, Actions.parse(raw), { by, now });
}
function item(p: Partial<Item>): Item {
  return {
    id: p.id ?? "i1", roomId: "r1", name: "x", status: p.status ?? "needed",
    priority: p.priority ?? 2, qty: p.qty ?? 1, addedBy: "him", createdAt: NOW.toISOString(),
    ...p,
  } as Item;
}

describe("الجاهزية موزونة بالأولوية", () => {
  it("الأساسي يزن ثلاثة أضعاف الكمالي", () => {
    // أساسي غير مشترى + كمالي مشترى = تقدم ضعيف رغم أن نصف العدد تم
    expect(readiness([
      item({ id: "a", priority: 1, status: "needed" }),
      item({ id: "b", priority: 3, status: "bought" }),
    ])).toBe(25);

    expect(readiness([
      item({ id: "a", priority: 1, status: "bought" }),
      item({ id: "b", priority: 3, status: "needed" }),
    ])).toBe(75);
  });

  it("الطلب تقدّم ولو مش شراء", () => {
    expect(readiness([item({ status: "ordered" })])).toBe(75);
    expect(readiness([item({ status: "chosen" })])).toBe(35);
    expect(readiness([])).toBe(0);
  });
});

describe("الفلوس", () => {
  it("المشترى ينزل في المصروف والباقي في المخطط", () => {
    let s = act(base(), { type: "settings.update", budget: 100000 });
    s = act(s, { type: "room.add", name: "النوم" });
    const roomId = s.rooms[0]!.id;
    s = act(s, { type: "item.add", roomId, name: "سرير", targetPrice: 20000, status: "bought", actualPrice: 23000, paidBy: "him" });
    s = act(s, { type: "item.add", roomId, name: "دولاب", targetPrice: 30000 });
    s = act(s, { type: "expense.add", title: "عربون قاعة", category: "فرح", amount: 15000, at: TODAY, paidBy: "both" });

    const r = analyze(s, TODAY, "him");
    expect(r.money.spent).toBe(38000);        // 23000 + 15000
    expect(r.money.committed).toBe(30000);
    expect(r.money.projected).toBe(68000);
    expect(r.money.left).toBe(62000);
    expect(r.money.gap).toBe(-32000);
    expect(r.money.paid.him).toBe(23000);
    expect(r.money.paid.both).toBe(15000);
    expect(r.money.drift).toBe(3000);
    expect(r.money.driftPct).toBe(15);
  });

  it("الكمية تضرب السعر", () => {
    let s = act(base(), { type: "room.add", name: "السفرة" });
    const roomId = s.rooms[0]!.id;
    s = act(s, { type: "item.add", roomId, name: "كرسي", qty: 6, targetPrice: 1500 });
    expect(analyze(s, TODAY, "him").money.committed).toBe(9000);
  });

  it("العنصر بلا سعر يُعَدّ ولا يُقدَّر", () => {
    let s = act(base(), { type: "room.add", name: "المطبخ" });
    const roomId = s.rooms[0]!.id;
    s = act(s, { type: "item.bulk", roomId, names: ["بوتاجاز", "ثلاجة", "شفاط", "حلل"] });
    const r = analyze(s, TODAY, "him");
    expect(r.money.unpriced).toBe(4);
    expect(r.money.committed).toBe(0);  // صفر لأنه مجهول، لا لأنه مجاني
  });

  it("معدّل الصرف الأسبوعي من آخر ٨ أسابيع فقط", () => {
    let s = act(base(), { type: "expense.add", title: "قديم", category: "×", amount: 80000, at: "2025-10-01" });
    s = act(s, { type: "expense.add", title: "قريب", category: "×", amount: 8000, at: "2026-01-05" });
    const r = analyze(s, TODAY, "him");
    expect(r.money.weeklyBurn).toBe(1000);   // 8000/8 — القديم خارج النافذة
    expect(r.money.spent).toBe(88000);        // لكنه داخل المصروف الكلي
  });
});

describe("سرعة الإنجاز", () => {
  it("تُحسب من آخر ٦ أسابيع وتتوقع النهاية", () => {
    let s = base();
    for (let i = 0; i < 6; i++) s = act(s, { type: "task.add", title: `مهمة ${i}` });
    const ids = s.tasks.map((t) => t.id);
    for (const id of ids.slice(0, 3)) {
      s = act(s, { type: "task.update", id, patch: { status: "done" } }, "him", new Date("2026-01-08T10:00:00.000Z"));
    }
    const r = analyze(s, TODAY, "him");
    expect(r.missions.done).toBe(3);
    expect(r.missions.open).toBe(3);
    expect(r.missions.velocity).toBe(0.5);
    expect(r.missions.finishInWeeks).toBe(6);
    expect(r.missions.doneByWeek).toEqual([{ week: weekKey("2026-01-08"), count: 3 }]);
  });

  it("سرعة صفر لا تنتج قسمة على صفر", () => {
    const s = act(base(), { type: "task.add", title: "مهمة" });
    expect(analyze(s, TODAY, "him").missions.finishInWeeks).toBeNull();
  });
});

describe("الانتباه — الصمت حالة نجاح", () => {
  it("مساحة مضبوطة لا تولّد ضجيجًا", () => {
    let s = act(base(), { type: "settings.update", budget: 200000 });
    s = act(s, { type: "milestone.set", kind: "wedding", title: "الفرح", date: "2026-11-20" });
    s = act(s, { type: "memory.add", date: "2026-01-09", title: "أول يوم" });
    const codes = report(s, TODAY, "him").attention.map((a) => a.code);
    expect(codes).toEqual([]);
  });

  it("بلا تاريخ وبلا ميزانية: ملاحظتان، لا قائمة", () => {
    const codes = report(base(), TODAY, "him").attention.map((a) => a.code);
    expect(codes).toEqual(["no_wedding_date", "no_budget"]);
  });

  it("التجاوز الفعلي يسبق التوقع", () => {
    let s = act(base(), { type: "settings.update", budget: 50000 });
    s = act(s, { type: "milestone.set", kind: "wedding", title: "الفرح", date: "2026-11-20" });
    s = act(s, { type: "expense.add", title: "قاعة", category: "فرح", amount: 60000, at: TODAY });
    const a = report(s, TODAY, "him").attention;
    expect(a[0]?.code).toBe("over_budget");
    expect(a[0]?.level).toBe("now");
    expect(a[0]?.title.ar).toContain("10,000");
    // نفس الرقم في اللغتين: الأرقام لاتينية، والجملة وحدها تتغيّر
    expect(a[0]?.title.en).toContain("10,000");
  });

  it("الأساسي الناقص يظهر قرب الفرح فقط", () => {
    let s = act(base(), { type: "settings.update", budget: 500000 });
    s = act(s, { type: "room.add", name: "النوم" });
    const roomId = s.rooms[0]!.id;
    s = act(s, { type: "item.add", roomId, name: "سرير", priority: 1, targetPrice: 20000 });
    s = act(s, { type: "milestone.set", kind: "wedding", title: "الفرح", date: "2027-06-01" });
    expect(report(s, TODAY, "him").attention.map((x) => x.code)).not.toContain("critical_missing");

    const near = act(s, { type: "milestone.set", id: s.milestones[0]!.id, kind: "wedding", title: "الفرح", date: "2026-02-20" });
    expect(report(near, TODAY, "him").attention.map((x) => x.code)).toContain("critical_missing");
  });

  it("الرسالة غير المقروءة تخص القارئ وحده", () => {
    let s = act(base(), { type: "settings.update", budget: 100 });
    s = act(s, { type: "milestone.set", kind: "wedding", title: "الفرح", date: "2026-11-20" });
    s = act(s, { type: "note.send", body: "وحشتني" }, "her");
    expect(report(s, TODAY, "him").attention.map((a) => a.code)).toContain("unread_notes");
    expect(report(s, TODAY, "her").attention.map((a) => a.code)).not.toContain("unread_notes");
  });

  it("الغياب الطويل عن الذكريات ملاحظة، لا تقصير", () => {
    let s = act(base(), { type: "settings.update", budget: 100 });
    s = act(s, { type: "milestone.set", kind: "wedding", title: "الفرح", date: "2026-11-20" });
    s = act(s, { type: "memory.add", date: "2025-11-01", title: "الخطوبة" });
    const hit = attend(s, analyze(s, TODAY, "him"), "him").find((a) => a.code === "memory_gap");
    expect(hit?.level).toBe("watch");
    expect(hit?.title.ar).toContain("شهرين");
    expect(hit?.title.en).toContain("2 months");
  });
});

describe("ما لا يُرسَل", () => {
  it("نص الكبسولة يُحجب عن الطرف الآخر قبل موعدها فقط", () => {
    const s = act(base(), { type: "capsule.write", title: "لبعد سنة", body: "سر", openAt: "2027-01-01" }, "him");
    const hers = forViewer(s, "her", NOW);
    expect(hers.capsules[0]!.body).toBe("");
    expect(hers.capsules[0]!.sealed).toBe(true);

    const his = forViewer(s, "him", NOW);
    expect(his.capsules[0]!.body).toBe("سر");

    const after = forViewer(s, "her", new Date("2027-01-02T00:00:00.000Z"));
    expect(after.capsules[0]!.body).toBe("سر");
  });

  it("الحجب لا ينسخ المساحة بلا داعٍ", () => {
    const s = base();
    expect(forViewer(s, "her", NOW)).toBe(s);
  });
});

describe("العربية تُقرأ", () => {
  it("المدد الطويلة تتحول من أيام إلى شهور وسنين", () => {
    expect(arSpan(0)).toBe("النهارده");
    expect(arSpan(1)).toBe("يوم");
    expect(arSpan(2)).toBe("يومين");
    expect(arSpan(9)).toBe("9 أيام");
    expect(arSpan(21)).toBe("3 أسابيع");
    expect(arSpan(90)).toBe("3 شهور");
    expect(arSpan(365)).toBe("سنة");
    expect(arSpan(430)).toBe("سنة وشهرين");
  });

  it("فرق الأيام لا يتأثر بالمنطقة الزمنية", () => {
    expect(daysBetween("2026-01-10", "2026-11-20")).toBe(314);
    expect(daysBetween("2026-03-27", "2026-03-28")).toBe(1);  // ليلة تغيير التوقيت الصيفي
  });
});
