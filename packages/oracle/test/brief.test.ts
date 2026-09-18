import { describe, it, expect } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { apply, report, seedSpace, Actions, type PersonKey, type Space } from "@gonaim/couple";
import { buildBrief } from "../src/brief.js";
import { ask, OracleError } from "../src/ask.js";
import { offline } from "../src/offline.js";

const NOW = new Date("2026-01-10T12:00:00.000Z");
const TODAY = "2026-01-10";

function act(s: Space, raw: unknown, by: PersonKey = "him", now = NOW): Space {
  return apply(s, Actions.parse(raw), { by, now });
}

/** مساحة فيها كل الأنواع — بما فيها ما يجب ألا يخرج أبدًا. */
function loaded(): Space {
  let s = seedSpace({
    him: { name: "غنيم", handle: "g" }, her: { name: "نور", handle: "n" },
    now: NOW, bare: true,
  });
  s = act(s, {
    type: "settings.update", budget: 300000, together: "2024-06-12",
    address: { label: "١٤ شارع مصطفى كامل", mapUrl: "https://maps.example/secret-home" },
  });
  s = act(s, { type: "milestone.set", kind: "wedding", title: "الفرح", date: "2026-11-20" });
  s = act(s, { type: "memory.add", date: "2026-01-04", title: "أول قعدة", story: "قعدنا لحد الفجر.", place: "الزمالك" });
  s = act(s, { type: "note.send", body: "NOTE-BODY-SECRET" }, "her");
  s = act(s, { type: "capsule.write", title: "لبعد سنة", body: "CAPSULE-BODY-SECRET", openAt: "2028-01-01" });
  s = act(s, { type: "persona.set", traits: { loveLanguage: "acts", money: "saver", joy: "الهدوء" } }, "him");
  s = act(s, { type: "persona.set", traits: { loveLanguage: "time", money: "spender", friction: "التأجيل" } }, "her");
  s = act(s, { type: "wish.add", title: "نسافر الغردقة" }, "her");
  s = act(s, { type: "task.add", title: "حجز المصور", due: "2026-01-12", priority: 1 });
  s = act(s, { type: "appointment.add", title: "معاينة القاعة", at: "2026-01-13T19:00" });
  return s;
}

function brief(kind: "letter" | "advice" | "gift" | "week" | "story", viewer: PersonKey = "him", targetId?: string) {
  const space = loaded();
  return buildBrief({
    space, report: report(space, TODAY, viewer), viewer, kind,
    ...(targetId === undefined ? {} : { targetId }),
  });
}

describe("البريف لا يسرّب", () => {
  it("مفيش نص رسالة ولا كبسولة في أي نوع", () => {
    for (const kind of ["letter", "advice", "gift", "week", "story"] as const) {
      const b = brief(kind);
      const all = `${b.system}\n${b.text}`;
      expect(all, kind).not.toContain("NOTE-BODY-SECRET");
      expect(all, kind).not.toContain("CAPSULE-BODY-SECRET");
      expect(all, kind).not.toContain("maps.example");
      expect(all, kind).not.toContain("مصطفى كامل");
    }
  });

  it("بيقول صراحة إيه اللي مابيتبعتش", () => {
    const b = brief("letter");
    expect(b.withheld.length).toBeGreaterThan(2);
    expect(b.withheld.join(" ")).toContain("كلمات السر");
  });
});

describe("كل نوع بياخد اللي يخصه", () => {
  it("رسالة الشهر: سجل ووقايع وأرقام", () => {
    const b = brief("letter");
    expect(b.title).toBe("رسالة الشهر");
    expect(b.text).toContain("أول قعدة");
    expect(b.text).toContain("جاهزية العش");
    expect(b.system).toContain("ممنوع اختراع");
  });

  it("النصيحة: المعلن من الاتنين والفروق الملاحَظة", () => {
    const b = brief("advice");
    expect(b.text).toContain("غنيم قال عن نفسه");
    expect(b.text).toContain("نور قال عن نفسه");
    expect(b.text).toContain("الهدوء");
    expect(b.text).toMatch(/احتكاك|تكامل|تشابه/);
  });

  it("الهدايا: بتقرا الطرف التاني لا نفسك", () => {
    const mine = brief("gift", "him");
    expect(mine.text.startsWith("الشريك: نور")).toBe(true);
    expect(mine.text).toContain("نسافر الغردقة");
    expect(mine.text).toContain("التأجيل");

    const hers = brief("gift", "her");
    expect(hers.text.startsWith("الشريك: غنيم")).toBe(true);
  });

  it("ترتيب الأسبوع: المهام والمواعيد وبس", () => {
    const b = brief("week");
    expect(b.text).toContain("حجز المصور");
    expect(b.text).toContain("معاينة القاعة");
    expect(b.text).toContain("ضغط الأسبوع");
  });

  it("الحكاية: الذكرى المختارة", () => {
    const space = loaded();
    const id = space.memories[0]!.id;
    const b = buildBrief({ space, report: report(space, TODAY, "him"), viewer: "him", kind: "story", targetId: id });
    expect(b.text).toContain("قعدنا لحد الفجر");
    expect(b.text).toContain("الزمالك");
  });
});

describe("النداء", () => {
  const stub = (text: string): Anthropic => ({
    messages: {
      create: async () => ({ content: [{ type: "text", text }] }),
    },
  } as unknown as Anthropic);

  it("بيرجّع النص والموديل", async () => {
    const answer = await ask({ apiKey: "k", client: stub("رسالة جميلة"), model: "claude-opus-5" }, brief("letter"));
    expect(answer.text).toBe("رسالة جميلة");
    expect(answer.model).toBe("claude-opus-5");
  });

  it("بلا مفتاح بيرفض بكود واضح", async () => {
    await expect(ask({ apiKey: "" }, brief("letter"))).rejects.toBeInstanceOf(OracleError);
  });

  it("رد فاضي مش بيعدي كأنه نجاح", async () => {
    await expect(ask({ apiKey: "k", client: stub("   ") }, brief("letter")))
      .rejects.toMatchObject({ code: "empty" });
  });
});

describe("البديل الحتمي", () => {
  it("بيدّي نفس الوقايع بلا نموذج", () => {
    const b = brief("letter");
    const text = offline(b);
    expect(text).toContain("أول قعدة");
    expect(text).toContain("حتمية");
    expect(text).not.toContain("NOTE-BODY-SECRET");
  });
});
