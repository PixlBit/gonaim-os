import { describe, expect, it } from "vitest";
import { seedSpace } from "../src/seed.js";
import { apply } from "../src/actions.js";
import { Actions } from "../src/schema.js";
import { report } from "../src/report.js";
import type { Space } from "../src/types.js";

/**
 * الليلة تُختبر بالصمت قبل الكلام.
 *
 * أسهل ما في ميزة كهذه أن تقترح دائمًا — وهذا بالضبط ما يجعلها بلا قيمة.
 * فالاختبارات هنا تسأل أولًا: متى **لا** تقترح؟ ثم تسأل عن الدليل.
 */

const NOW = new Date("2026-01-05T09:00:00.000Z");   // الإثنين
const TODAY = "2026-01-05";

function space(): Space {
  return seedSpace({
    him: { name: "غنيم", handle: "g" },
    her: { name: "نور", handle: "n" },
    now: NOW, bare: true,
  });
}

function act(s: Space, a: unknown, now = NOW): Space {
  return apply(s, Actions.parse(a), { by: "him", now });
}

describe("ليلتنا", () => {
  it("بلا أسبوع هادئ مقاس لا اقتراح", () => {
    // مساحة فاضية: التوقّع بلا محطات، والأسبوع الهادئ موجود — لكن بلا أمنية
    // يظل الاقتراح صالحًا. نملأ الأفق بمحطات حتى لا يبقى أسبوع بلا محطة.
    let s = space();
    for (let w = 1; w <= 8; w++) {
      const date = new Date(Date.UTC(2026, 0, 5 + w * 7)).toISOString().slice(0, 10);
      s = act(s, { type: "milestone.set", kind: "custom", title: `محطة ${w}`, date });
    }
    expect(report(s, TODAY, "him").night).toBeNull();
  });

  it("يختار الخميس — ليلة الجمعة، لا يومًا عشوائيًا", () => {
    const night = report(space(), TODAY, "him").night;
    expect(night).not.toBeNull();
    // الأسبوع الهادئ يبدأ بإثنين، والخميس بعده بثلاثة أيام
    expect(new Date(`${night!.date}T00:00:00Z`).getUTCDay()).toBe(4);
  });

  it("يتخطّى الليلة المشغولة ولا يقترح فوق ميعاد", () => {
    const first = report(space(), TODAY, "him").night!;
    const busy = act(space(), {
      type: "appointment.add", title: "الكوافير", at: `${first.date}T18:00`, attendees: "both",
    });
    const after = report(busy, TODAY, "him").night!;
    expect(after.date).not.toBe(first.date);
  });

  it("يأخذ أمنية الطرف التاني لا أمنيتك", () => {
    let s = space();
    s = apply(s, Actions.parse({ type: "wish.add", title: "نتعشّى على النيل", kind: "date" }),
      { by: "her", now: new Date("2025-09-01T10:00:00.000Z") });
    s = apply(s, Actions.parse({ type: "wish.add", title: "نتفرّج على فيلم", kind: "date" }),
      { by: "him", now: new Date("2025-08-01T10:00:00.000Z") });

    // هو يقرأ → تُقترح أمنيتها، مع إنها الأحدث
    const his = report(s, TODAY, "him").night!;
    expect(his.wish?.title).toBe("نتعشّى على النيل");
    expect(his.wish?.by).toBe("her");

    // هي تقرأ → تُقترح أمنيته
    const hers = report(s, TODAY, "her").night!;
    expect(hers.wish?.by).toBe("him");
  });

  it("لا يقترح سفرًا في ليلة", () => {
    let s = space();
    s = apply(s, Actions.parse({ type: "wish.add", title: "نسافر اليابان", kind: "travel" }),
      { by: "her", now: NOW });
    expect(report(s, TODAY, "him").night!.wish).toBeNull();
  });

  it("الدليل مكتوب باللغتين ويذكر الضغط", () => {
    const night = report(space(), TODAY, "him").night!;
    expect(night.why.length).toBeGreaterThan(0);
    for (const line of night.why) {
      expect(line.ar.length).toBeGreaterThan(0);
      expect(line.en.length).toBeGreaterThan(0);
    }
    expect(night.why[0]!.ar).toMatch(/٪/);
    expect(night.why[0]!.en).toMatch(/%/);
  });
});
