import { describe, it, expect } from "vitest";
import { prepass, normalizeDigits, normalizeText, enforceSourceBinding } from "../src/index.js";

const TODAY = "2026-08-22";

describe("تطبيع الأرقام العربية", () => {
  it("٨٥٠٠ و 8500 نفس الرقم", () => {
    expect(normalizeDigits("٨٥٠٠")).toBe("8500");
    expect(normalizeDigits("مبلغ ١٢٣ ريال")).toBe("مبلغ 123 ريال");
  });

  it("يشيل التطويل وعلامات الاتجاه بلا مساس بالمعنى", () => {
    expect(normalizeText("مشـ__ـترك‏  في   OpenAI".replace(/__/g, ""))).toBe("مشترك في OpenAI");
  });
});

describe("استخلاص المبالغ", () => {
  it("يقرأ العربي واللاتيني بنفس النتيجة", () => {
    const a = prepass("مشترك بـ٧٥ ريال", TODAY);
    const b = prepass("subscribed for 75 SAR", TODAY);
    expect(a.money[0]?.amount).toBe(75);
    expect(b.money[0]?.amount).toBe(75);
    expect(a.money[0]?.currency).toBe(b.money[0]?.currency);
  });

  it("يقرأ الفاصلة الألفية", () => {
    expect(prepass("فاتورة 8,500 ريال", TODAY).money[0]?.amount).toBe(8500);
  });

  it("رقم بلا عملة ليس مبلغًا", () => {
    // "4 مرات" ليست أربعة ريالات — أهم حالة يخطئ فيها الاستخلاص الساذج
    expect(prepass("فتحتها 4 مرات", TODAY).money).toHaveLength(0);
  });

  it("يميّز العملات", () => {
    const p = prepass("دفعت 20 دولار وكمان 100 جنيه", TODAY);
    expect(p.money.map((m) => m.currency)).toEqual(["USD", "EGP"]);
  });
});

describe("حل التواريخ", () => {
  it("تاريخ صريح", () => {
    expect(prepass("يتجدد 2026-09-01", TODAY).dates[0]?.iso).toBe("2026-09-01");
  });

  it("يوم وشهر بالعربي", () => {
    expect(prepass("27 أغسطس", TODAY).dates[0]?.iso).toBe("2026-08-27");
  });

  it("«من أول أغسطس» تصير اليوم الأول", () => {
    expect(prepass("الفاتورة من أول أغسطس", TODAY).dates[0]?.iso).toBe("2026-08-01");
  });

  it("يوم بلا شهر يُحل لأقرب حدوث قادم ويُعلَّم تخمينًا", () => {
    const d = prepass("بيتجدد 27", TODAY).dates[0];
    expect(d?.iso).toBe("2026-08-27");
    expect(d?.kind).toBe("day_only");
  });

  it("يوم مضى هذا الشهر ينتقل للشهر القادم", () => {
    const d = prepass("بيتجدد 5", TODAY).dates[0];
    expect(d?.iso).toBe("2026-09-05");
  });

  it("شهر مضى بفارق كبير يُقرأ كالعام القادم", () => {
    // في أغسطس، "10 يناير" غالبًا يناير القادم لا الماضي
    expect(prepass("10 يناير", TODAY).dates[0]?.iso).toBe("2027-01-10");
  });

  it("كل تلميح يحمل موضعه في النص", () => {
    const p = prepass("مشترك بـ75 ريال يتجدد 27 أغسطس", TODAY);
    const m = p.money[0]!;
    expect(p.normalized.slice(m.start, m.end)).toContain("75");
  });
});

describe("بوابة ربط المصدر", () => {
  const source = "مشترك في openai بـ75 ريال بيتجدد 27";

  const candidate = (evidenceText: string) => ({
    kind: "subscription" as const,
    title: "OpenAI", provider: "OpenAI", amount: 75, currency: "SAR",
    cycle: "monthly" as const, renewsOn: "2026-08-27",
    creditIncluded: null, creditUsed: null, creditUnit: null,
    evidenceText, confidence: 0.9,
  });

  it("يقبل مرشحًا نصه الشاهد موجود فعلًا", () => {
    const { result, rejected } = enforceSourceBinding(
      { candidates: [candidate("مشترك في openai بـ75 ريال")], unresolved: [] }, source);
    expect(result.candidates).toHaveLength(1);
    expect(rejected).toHaveLength(0);
  });

  it("يرفض حقيقة معقولة لم تُقَل", () => {
    // النموذج «استنتج» أنه سنوي — معقول، لكنه غير مذكور
    const { result, rejected } = enforceSourceBinding(
      { candidates: [candidate("اشتراك سنوي بـ900 ريال")], unresolved: [] }, source);
    expect(result.candidates).toHaveLength(0);
    expect(rejected).toHaveLength(1);
  });

  it("المرفوض يظهر كفجوة معلنة، لا يختفي بصمت", () => {
    const { result } = enforceSourceBinding(
      { candidates: [candidate("كلام لم يُقَل")], unresolved: [] }, source);
    expect(result.unresolved).toHaveLength(1);
    expect(result.unresolved[0]?.whyUnresolved).toContain("غير موجود");
  });

  it("يرفض النص الشاهد الفارغ", () => {
    const { rejected } = enforceSourceBinding(
      { candidates: [candidate("   ")], unresolved: [] }, source);
    expect(rejected[0]?.reason).toContain("بلا نص شاهد");
  });
});
