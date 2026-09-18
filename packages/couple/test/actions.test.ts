import { describe, it, expect } from "vitest";
import { apply, ActError } from "../src/actions.js";
import { Actions } from "../src/schema.js";
import { seedSpace, SEED_COUNTS } from "../src/seed.js";
import { LOG_LIMIT, type Space } from "../src/types.js";

const NOW = new Date("2026-01-10T12:00:00.000Z");

function space(bare = true): Space {
  return seedSpace({
    him: { name: "غنيم", handle: "gonaim" },
    her: { name: "نور", handle: "noor" },
    now: NOW, bare,
  });
}

/** يمر بالتحقق كما يمر الطلب الحقيقي — اختبار يتجاوز العقد لا يختبره. */
function act(s: Space, raw: unknown, by: "him" | "her" = "him", now = NOW): Space {
  return apply(s, Actions.parse(raw), { by, now });
}

describe("الكتابة تترك أثرًا", () => {
  it("كل فعل يزيد النسخة ويكتب سطرًا باسم صاحبه", () => {
    const s = act(space(), { type: "note.send", body: "وحشتيني" }, "her");
    expect(s.version).toBe(2);
    expect(s.log[0]?.summary).toBe("نور: بعت رسالة");
    expect(s.log[0]?.action).toBe("note.send");
  });

  it("السجل مقصوص عند حده — لا ينمو بلا سقف", () => {
    let s = space();
    for (let i = 0; i < LOG_LIMIT + 20; i++) {
      s = act(s, { type: "note.send", body: `رسالة ${i}` });
    }
    expect(s.log.length).toBe(LOG_LIMIT);
    expect(s.version).toBe(LOG_LIMIT + 21);
  });
});

describe("المهام", () => {
  it("«تمّت» تحمل مَن ومتى، وإلغاؤها يمسحهما", () => {
    let s = act(space(), { type: "task.add", title: "حجز القاعة" });
    const id = s.tasks[0]!.id;
    s = act(s, { type: "task.update", id, patch: { status: "done" } }, "her");
    expect(s.tasks[0]!.doneBy).toBe("her");
    expect(s.tasks[0]!.doneAt).toBe(NOW.toISOString());

    s = act(s, { type: "task.update", id, patch: { status: "doing" } });
    expect(s.tasks[0]!.doneBy).toBeUndefined();
    expect(s.tasks[0]!.doneAt).toBeUndefined();
  });

  it("null يمسح الحقل، وغيابه لا يلمسه", () => {
    let s = act(space(), { type: "task.add", title: "الدبل", due: "2026-03-01", note: "من الصاغة" });
    const id = s.tasks[0]!.id;
    s = act(s, { type: "task.update", id, patch: { priority: 1 } });
    expect(s.tasks[0]!.due).toBe("2026-03-01");
    s = act(s, { type: "task.update", id, patch: { due: null } });
    expect(s.tasks[0]!.due).toBeUndefined();
    expect(s.tasks[0]!.note).toBe("من الصاغة");
  });
});

describe("الشقة", () => {
  it("حذف الغرفة يشيل عناصرها ويقول كم شال", () => {
    let s = act(space(), { type: "room.add", name: "المطبخ" });
    const roomId = s.rooms[0]!.id;
    s = act(s, { type: "item.bulk", roomId, names: ["بوتاجاز", "ثلاجة", "شفاط"] });
    expect(s.items.length).toBe(3);
    s = act(s, { type: "room.remove", id: roomId });
    expect(s.items.length).toBe(0);
    expect(s.log[0]?.summary).toContain("3 عنصر");
  });

  it("اللصق المكرر لا يضاعف الكشف", () => {
    let s = act(space(), { type: "room.add", name: "المطبخ" });
    const roomId = s.rooms[0]!.id;
    s = act(s, { type: "item.bulk", roomId, names: ["بوتاجاز", "ثلاجة"] });
    s = act(s, { type: "item.bulk", roomId, names: ["بوتاجاز", "غسالة"] });
    expect(s.items.map((i) => i.name).sort()).toEqual(["بوتاجاز", "ثلاجة", "غسالة"]);
  });

  it("«اتشرى» يسجّل وقت الشراء، والرجوع عنه يمسحه", () => {
    let s = act(space(), { type: "room.add", name: "النوم" });
    const roomId = s.rooms[0]!.id;
    s = act(s, { type: "item.add", roomId, name: "سرير", targetPrice: 20000 });
    const id = s.items[0]!.id;
    s = act(s, { type: "item.update", id, patch: { status: "bought", actualPrice: 23500 } });
    expect(s.items[0]!.boughtAt).toBe(NOW.toISOString());
    expect(s.log[0]?.summary).toContain("23,500");
    s = act(s, { type: "item.update", id, patch: { status: "ordered" } });
    expect(s.items[0]!.boughtAt).toBeUndefined();
  });

  it("عنصر في غرفة غير موجودة يُرفض", () => {
    expect(() => act(space(), { type: "item.add", roomId: "room_x", name: "سرير" }))
      .toThrow(ActError);
  });
});

describe("الكشف الافتراضي", () => {
  it("يبدأ ممتلئًا، وما يلمسه إنسان يخرج منه", () => {
    let s = space(false);
    expect(s.items.length).toBe(SEED_COUNTS.items);
    expect(s.tasks.length).toBe(SEED_COUNTS.tasks);

    const kept = s.items[0]!.id;
    s = act(s, { type: "item.update", id: kept, patch: { targetPrice: 15000 } });
    expect(s.items.find((i) => i.id === kept)!.seeded).toBeUndefined();

    s = act(s, { type: "seed.clear" });
    expect(s.items.length).toBe(1);
    expect(s.items[0]!.id).toBe(kept);
    expect(s.tasks.length).toBe(0);
  });

  it("الكشف بلا أسعار مخترعة", () => {
    const s = space(false);
    expect(s.items.every((i) => i.targetPrice === undefined && i.actualPrice === undefined)).toBe(true);
  });
});

describe("بينا — قواعد لا تُكسر من الواجهة", () => {
  it("الكبسولة لا تُفتح قبل يومها", () => {
    const s = act(space(), {
      type: "capsule.write", title: "لأول سنة", body: "…", openAt: "2027-01-10",
    });
    const id = s.capsules[0]!.id;
    expect(() => act(s, { type: "capsule.open", id })).toThrow(/لسه بدري/);

    const later = apply(s, Actions.parse({ type: "capsule.open", id }),
      { by: "her", now: new Date("2027-01-10T08:00:00.000Z") });
    expect(later.capsules[0]!.openedAt).toBeTruthy();
  });

  it("الكاتب لا يشهد على قراءة رسالته", () => {
    const s = act(space(), { type: "note.send", body: "بحبك" }, "him");
    const id = s.notes[0]!.id;
    expect(() => act(s, { type: "note.read", id }, "him")).toThrow(/رسالتك/);
    const read = act(s, { type: "note.read", id }, "her");
    expect(read.notes[0]!.readAt).toBeTruthy();
  });

  it("لا يمسح رسالة غيره", () => {
    const s = act(space(), { type: "note.send", body: "…" }, "her");
    const id = s.notes[0]!.id;
    expect(() => act(s, { type: "note.remove", id }, "him")).toThrow(/مش رسالتك/);
  });

  it("القرار لا يُحسم بصوت واحد", () => {
    let s = act(space(), {
      type: "decision.ask", question: "فين شهر العسل؟",
      options: [{ label: "الغردقة" }, { label: "دهب" }],
    });
    const id = s.decisions[0]!.id;
    s = act(s, { type: "decision.vote", id, option: "o1" }, "him");
    expect(s.decisions[0]!.chosen).toBeUndefined();

    s = act(s, { type: "decision.vote", id, option: "o2" }, "her");
    expect(s.decisions[0]!.chosen).toBeUndefined();

    s = act(s, { type: "decision.vote", id, option: "o2" }, "him");
    expect(s.decisions[0]!.chosen).toBe("o2");
    expect(s.decisions[0]!.resolvedAt).toBeTruthy();
    expect(s.log[0]?.summary).toContain("اتفقنا");
  });

  it("تغيير رأي بعد الاتفاق يفتح القرار تاني", () => {
    let s = act(space(), {
      type: "decision.ask", question: "قاعة ولا حديقة؟",
      options: [{ label: "قاعة" }, { label: "حديقة" }],
    });
    const id = s.decisions[0]!.id;
    s = act(s, { type: "decision.vote", id, option: "o1" }, "him");
    s = act(s, { type: "decision.vote", id, option: "o1" }, "her");
    expect(s.decisions[0]!.chosen).toBe("o1");
    s = act(s, { type: "decision.vote", id, option: "o2" }, "her");
    expect(s.decisions[0]!.chosen).toBeUndefined();
    expect(s.decisions[0]!.resolvedAt).toBeUndefined();
  });
});

describe("العقد يرفض قبل أن يصل", () => {
  it("مبلغ سالب", () => {
    expect(Actions.safeParse({ type: "expense.add", title: "قاعة", category: "فرح", amount: -5, at: "2026-01-01" }).success)
      .toBe(false);
  });
  it("تاريخ مش تاريخ", () => {
    expect(Actions.safeParse({ type: "milestone.set", kind: "wedding", title: "الفرح", date: "قريب" }).success)
      .toBe(false);
  });
  it("قرار بخيار واحد", () => {
    expect(Actions.safeParse({ type: "decision.ask", question: "؟", options: [{ label: "أ" }] }).success)
      .toBe(false);
  });
  it("فعل مش موجود", () => {
    expect(Actions.safeParse({ type: "space.drop" }).success).toBe(false);
  });
});
