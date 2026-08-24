import { describe, it, expect, vi } from "vitest";
import { extract, buildUserMessage, prepass } from "../src/index.js";
import type Anthropic from "@anthropic-ai/sdk";

const TODAY = "2026-08-22";
const TEXT = "مشترك في OpenAI بـ٧٥ ريال بيتجدد ٢٧، وعندي فاتورة ٨٥٠٠ ريال عند Studio Client من أول أغسطس";

/** عميل مزيّف: يتيح اختبار الأسلاك كاملة بلا شبكة ولا مفتاح. */
function fakeClient(parsed: unknown, capture?: (req: unknown) => void) {
  return {
    messages: {
      parse: vi.fn(async (req: unknown) => {
        capture?.(req);
        return { parsed_output: parsed };
      }),
    },
  } as unknown as Anthropic;
}

describe("رسالة الطلب", () => {
  it("تحمل التلميحات المحسوبة واليوم والنص المطبَّع", () => {
    const msg = buildUserMessage(TEXT, prepass(TEXT, TODAY), TODAY);
    expect(msg).toContain("اليوم: 2026-08-22");
    expect(msg).toContain("75 SAR");
    expect(msg).toContain("8500 SAR");
    expect(msg).toContain("2026-08-01");
    expect(msg).toContain("يوم بلا شهر");   // التخمين معلَن للنموذج
  });

  it("التعليمات الثابتة وحدها مخبّأة — لا التاريخ ولا النص", async () => {
    let req: any;
    await extract(TEXT, { today: TODAY, client: fakeClient(
      { candidates: [], unresolved: [] }, (r) => { req = r; }) });

    const system = req.system as { text: string; cache_control?: unknown }[];
    const prefix = system[0]!;
    expect(prefix.cache_control).toBeDefined();
    // أي بايت متغيّر في البادئة يُبطل الـcache لكل ما بعده
    expect(prefix.text).not.toContain(TODAY);
    expect(prefix.text).not.toContain("OpenAI");
  });

  it("يطلب claude-opus-5 بتفكير تكيّفي", async () => {
    let req: any;
    await extract(TEXT, { today: TODAY, client: fakeClient(
      { candidates: [], unresolved: [] }, (r) => { req = r; }) });
    expect(req.model).toBe("claude-opus-5");
    expect(req.thinking).toEqual({ type: "adaptive" });
  });
});

describe("التنقيح قبل النموذج", () => {
  const DIRTY = "مشترك في OpenAI بـ٧٥ ريال، والمفتاح sk-ant-api03-AAAAAAAAAAAAAAAAAAAA وحوّلت على SA0380000000608010167519 لـlayla@studio.sa";

  it("لا سر ولا IBAN ولا بريد يغادر إلى النموذج", async () => {
    let req: any;
    await extract(DIRTY, { today: TODAY, client: fakeClient(
      { candidates: [], unresolved: [] }, (r) => { req = r; }) });

    const sent = JSON.stringify(req);
    expect(sent).not.toContain("sk-ant-api03");
    expect(sent).not.toContain("608010167519");
    expect(sent).not.toContain("layla@studio.sa");
  });

  it("النص المفيد يمر سليمًا رغم التنقيح", async () => {
    let req: any;
    await extract(DIRTY, { today: TODAY, client: fakeClient(
      { candidates: [], unresolved: [] }, (r) => { req = r; }) });
    const sent = JSON.stringify(req);
    expect(sent).toContain("OpenAI");
    expect(sent).toContain("75 SAR");
  });

  it("ما نُقِّح يُعاد للمالك ليعرف ما لم يره النموذج", async () => {
    const out = await extract(DIRTY, { today: TODAY,
      client: fakeClient({ candidates: [], unresolved: [] }) });
    expect(out.redactions.map((r) => r.kind).sort()).toEqual(["email", "iban", "secret"]);
  });

  it("الأصل غير المنقّح لا يُرسل ولو كمرجع", async () => {
    let req: any;
    await extract(DIRTY, { today: TODAY, client: fakeClient(
      { candidates: [], unresolved: [] }, (r) => { req = r; }) });
    // كان يُرسل نسخة "للرجوع" تلتف حول التنقيح كاملًا
    expect(JSON.stringify(req)).not.toContain("الأصل قبل التطبيع");
  });
});

describe("المسار كامل", () => {
  const good = {
    kind: "subscription", title: "OpenAI Plus", provider: "OpenAI",
    amount: 75, currency: "SAR", cycle: "monthly", renewsOn: "2026-08-27",
    creditIncluded: null, creditUsed: null, creditUnit: null,
    evidenceText: "مشترك في OpenAI بـ75 ريال", confidence: 0.92,
  };
  const invented = {
    ...good, title: "Adobe", provider: "Adobe", amount: 249,
    evidenceText: "مشترك في Adobe بـ249 ريال", confidence: 0.88,
  };

  it("يمرّر المرشح المسنود بنص قيل فعلًا", async () => {
    const out = await extract(TEXT, { today: TODAY,
      client: fakeClient({ candidates: [good], unresolved: [] }) });
    expect(out.result.candidates).toHaveLength(1);
    expect(out.rejected).toHaveLength(0);
  });

  it("يوقف حقيقة اخترعها النموذج ولو كانت متسقة تمامًا", async () => {
    const out = await extract(TEXT, { today: TODAY,
      client: fakeClient({ candidates: [good, invented], unresolved: [] }) });
    expect(out.result.candidates).toHaveLength(1);
    expect(out.result.candidates[0]).toMatchObject({ provider: "OpenAI" });
    expect(out.rejected).toHaveLength(1);
    // ولا يختفي بصمت
    expect(out.result.unresolved.some((u) => u.text.includes("Adobe"))).toBe(true);
  });

  it("رد فارغ لا يرمي استثناء", async () => {
    const out = await extract(TEXT, { today: TODAY, client: fakeClient(null) });
    expect(out.result.candidates).toEqual([]);
  });

  it("الـprepass متاح دائمًا مع النتيجة", async () => {
    const out = await extract(TEXT, { today: TODAY,
      client: fakeClient({ candidates: [], unresolved: [] }) });
    expect(out.prepass.money).toHaveLength(2);
    expect(out.prepass.dates.length).toBeGreaterThan(0);
  });
});
