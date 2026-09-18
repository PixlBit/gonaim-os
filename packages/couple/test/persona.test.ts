import { describe, it, expect } from "vitest";
import { apply } from "../src/actions.js";
import { Actions } from "../src/schema.js";
import { seedSpace } from "../src/seed.js";
import { readPersona } from "../src/persona.js";
import { syncReport } from "../src/sync.js";
import { forecast, heartbeat } from "../src/rhythm.js";
import { report } from "../src/report.js";
import type { PersonKey, Space } from "../src/types.js";

const NOW = new Date("2026-01-10T12:00:00.000Z");
const TODAY = "2026-01-10";

function base(): Space {
  return seedSpace({
    him: { name: "غنيم", handle: "g" }, her: { name: "نور", handle: "n" },
    now: NOW, bare: true,
  });
}
function act(s: Space, raw: unknown, by: PersonKey = "him", now = NOW): Space {
  return apply(s, Actions.parse(raw), { by, now });
}

describe("لا درجة بلا دليل", () => {
  it("المحاور تبدأ فاضية وتقول ليه", () => {
    const p = readPersona(base(), "him");
    expect(p.axes.every((a) => a.score === null)).toBe(true);
    expect(p.axes.find((a) => a.id === "followThrough")?.evidence).toMatch(/بدري|مهمة/);
    expect(p.signature).toBeNull();
  });

  it("عيّنة أقل من الحد لا تنتج رقمًا", () => {
    let s = base();
    // مهمتان مقفولتان فقط — تحت الحد
    for (let i = 0; i < 2; i++) s = act(s, { type: "task.add", title: `م${i}` });
    for (const t of s.tasks) s = act(s, { type: "task.update", id: t.id, patch: { status: "done" } });
    const axis = readPersona(s, "him").axes.find((a) => a.id === "followThrough");
    expect(axis?.score).toBeNull();
    expect(axis?.n).toBe(2);
  });
});

describe("المبادرة نسبية بين الاتنين", () => {
  it("اللي بيفتح أكتر بياخد درجة أعلى، والمجموع مئة", () => {
    let s = base();
    for (let i = 0; i < 3; i++) s = act(s, { type: "task.add", title: `منه ${i}` }, "him");
    s = act(s, { type: "task.add", title: "منها" }, "her");

    const him = readPersona(s, "him").axes.find((a) => a.id === "initiative");
    const her = readPersona(s, "her").axes.find((a) => a.id === "initiative");
    expect(him?.score).toBe(75);
    expect(her?.score).toBe(25);
    expect(him?.evidence).toContain("3");
  });
});

describe("الإنفاق يُقاس بالفرق عن التقدير", () => {
  it("فوق التقدير يرفع الدرجة فوق الخمسين", () => {
    let s = act(base(), { type: "room.add", name: "النوم" });
    const roomId = s.rooms[0]!.id;
    for (const [name, target, actual] of [["سرير", 10000, 12000], ["دولاب", 10000, 11000], ["تسريحة", 10000, 13000]] as const) {
      s = act(s, {
        type: "item.add", roomId, name,
        targetPrice: target, actualPrice: actual, status: "bought", paidBy: "him",
      });
    }
    const axis = readPersona(s, "him").axes.find((a) => a.id === "spending");
    expect(axis?.n).toBe(3);
    expect(axis?.score).toBe(70);           // متوسط تجاوز 20٪
    expect(axis?.evidence).toContain("20");
  });
});

describe("الرد يُقاس من وقت القراءة", () => {
  it("القراءة السريعة ترفع الدرجة", () => {
    let s = base();
    for (let i = 0; i < 3; i++) {
      s = act(s, { type: "note.send", body: `رسالة ${i}` }, "her", new Date(`2026-01-0${i + 1}T10:00:00.000Z`));
    }
    for (const n of s.notes) {
      s = act(s, { type: "note.read", id: n.id }, "him", new Date(Date.parse(n.at) + 3_600_000));
    }
    const axis = readPersona(s, "him").axes.find((a) => a.id === "responsiveness");
    expect(axis?.n).toBe(3);
    expect(axis?.score).toBeGreaterThan(90);
    expect(axis?.evidence).toContain("ساعتين");
  });
});

describe("الأنماط يكتبها صاحبها", () => {
  it("الفعل بيتطبق على اللي عمله مهما كان", () => {
    const s = act(base(), { type: "persona.set", traits: { loveLanguage: "time", money: "saver" } }, "her");
    expect(s.people.her.traits?.loveLanguage).toBe("time");
    expect(s.people.her.traits?.updatedAt).toBe(NOW.toISOString());
    expect(s.people.him.traits).toBeUndefined();
  });

  it("null يمسح اختيارًا سابقًا", () => {
    let s = act(base(), { type: "persona.set", traits: { money: "spender" } });
    s = act(s, { type: "persona.set", traits: { money: null } });
    expect(s.people.him.traits?.money).toBeUndefined();
  });

  it("خيار مش من القائمة يُرفض قبل ما يوصل", () => {
    expect(Actions.safeParse({ type: "persona.set", traits: { loveLanguage: "شعر" } }).success).toBe(false);
  });
});

describe("الانسجام", () => {
  it("مفيش ملاحظة عن لغة الحب قبل ما الاتنين يكتبوا", () => {
    let s = act(base(), { type: "persona.set", traits: { loveLanguage: "acts" } }, "him");
    expect(syncReport(s).insights.map((i) => i.code)).not.toContain("love.diff");

    s = act(s, { type: "persona.set", traits: { loveLanguage: "time" } }, "her");
    const hit = syncReport(s).insights.find((i) => i.code === "love.diff");
    expect(hit?.kind).toBe("friction");
    expect(hit?.why).toContain("نور");
    expect(hit?.move).toBeTruthy();
  });

  it("الاحتكاك يسبق التكامل في الترتيب", () => {
    let s = act(base(), { type: "persona.set", traits: { loveLanguage: "acts", planning: "planner", money: "saver" } }, "him");
    s = act(s, { type: "persona.set", traits: { loveLanguage: "words", planning: "flow", money: "spender" } }, "her");
    const kinds = syncReport(s).insights.map((i) => i.kind);
    expect(kinds[0]).toBe("friction");
    expect(kinds).toContain("complement");
  });

  it("عدّ ما أعلنه كل واحد", () => {
    const s = act(base(), { type: "persona.set", traits: { conflict: "soft", money: "balanced" } }, "her");
    expect(syncReport(s).declared).toEqual({ him: 0, her: 2 });
  });
});

describe("الأسابيع الجاية", () => {
  it("المحطة تثقّل أسبوعها، والفاضي يُرشَّح", () => {
    let s = act(base(), { type: "milestone.set", kind: "wedding", title: "الفرح", date: "2026-02-07" });
    s = act(s, { type: "appointment.add", title: "القاعة", at: "2026-02-05T18:00" });
    const f = forecast(s, TODAY, 1);

    const heavy = f.weeks.find((w) => w.milestones.length > 0);
    expect(heavy?.score).toBe(100);
    expect(heavy?.note).toContain("الفرح");
    expect(f.peak?.week).toBe(heavy?.week);
    expect(f.calm?.milestones).toEqual([]);
    expect(f.calm?.score).toBe(0);
  });

  it("المتأخر بيتحمل على الأسبوع الحالي وحده", () => {
    let s = act(base(), { type: "task.add", title: "متأخرة", due: "2025-12-01" });
    s = act(s, { type: "task.add", title: "متأخرة 2", due: "2025-12-02" });
    const f = forecast(s, TODAY, 1);
    expect(f.backlog).toBe(2);
    expect(f.weeks[0]!.score).toBeGreaterThan(f.weeks[1]!.score);
  });
});

describe("نبض العلاقة", () => {
  it("تجهيز بلا حياة = بارد", () => {
    let s = act(base(), { type: "room.add", name: "المطبخ" });
    const roomId = s.rooms[0]!.id;
    for (let i = 0; i < 9; i++) {
      s = act(s, { type: "item.add", roomId, name: `حاجة ${i}`, status: "bought", actualPrice: 100 },
        "him", new Date("2026-01-05T10:00:00.000Z"));
    }
    const hb = heartbeat(s, TODAY);
    expect(hb.verdict).toBe("cold");
    expect(hb.careShare).toBe(0);
    expect(hb.line).toContain("التجهيز");
  });

  it("الذكريات والرسايل بترفع النبض", () => {
    let s = act(base(), { type: "memory.add", date: "2026-01-04", title: "يوم حلو" });
    s = act(s, { type: "note.send", body: "وحشتيني" }, "him", new Date("2026-01-05T20:00:00.000Z"));
    s = act(s, { type: "expense.add", title: "قاعة", category: "فرح", amount: 100, at: "2026-01-06" });
    const hb = heartbeat(s, TODAY);
    expect(hb.verdict).toBe("warm");
    expect(hb.careShare).toBe(67);
    expect(hb.sinceCare).toBe(5);
  });

  it("مساحة فاضية لا تُوصَف", () => {
    expect(heartbeat(base(), TODAY).verdict).toBe("unknown");
  });
});

describe("التقرير الكامل", () => {
  it("يجمع الأرقام والأنماط والأسابيع والنبض", () => {
    let s = act(base(), { type: "settings.update", budget: 100000 });
    s = act(s, { type: "milestone.set", kind: "wedding", title: "الفرح", date: "2026-11-20" });
    const r = report(s, TODAY, "him");
    expect(r.sync.him.key).toBe("him");
    expect(r.forecast.weeks.length).toBe(8);
    expect(r.heartbeat.verdict).toBe("unknown");
    // الحكم محسوب بعد الطبقات كلها
    expect(Array.isArray(r.attention)).toBe(true);
  });

  it("التجهيز البارد بيطلع ملاحظة تقول اعملوا حاجة شخصية", () => {
    let s = act(base(), { type: "settings.update", budget: 100000 });
    s = act(s, { type: "milestone.set", kind: "wedding", title: "الفرح", date: "2026-11-20" });
    s = act(s, { type: "room.add", name: "المطبخ" });
    const roomId = s.rooms[1 - 1]!.id;
    for (let i = 0; i < 9; i++) {
      s = act(s, { type: "item.add", roomId, name: `حاجة ${i}`, status: "bought", actualPrice: 100 },
        "him", new Date("2026-01-05T10:00:00.000Z"));
    }
    const hit = report(s, TODAY, "him").attention.find((a) => a.code === "heart_cold");
    expect(hit?.screen).toBe("persona");
    expect(hit?.move).toContain("ذكرى");
  });
});
