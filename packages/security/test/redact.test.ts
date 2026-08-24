import { describe, it, expect } from "vitest";
import { redact, assertClean } from "../src/index.js";

describe("مفاتيح المزوّدين", () => {
  it("مفتاح Anthropic يختفي", () => {
    const { text } = redact("المفتاح sk-ant-api03-AbCdEf1234567890XyZ وخلاص");
    expect(text).not.toContain("sk-ant");
    expect(text).toContain("[REDACTED_SECRET]");
  });

  it("توكن GitHub و Google و Slack", () => {
    const out = redact("ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ01234 و AIzaSyD-1234567890abcdefghijklmnopqrs و xoxb-123456789-abcdefgh");
    expect(out.text).not.toMatch(/ghp_|AIza|xoxb-/);
    expect(out.redactions.filter((r) => r.kind === "secret")).toHaveLength(3);
  });

  it("JWT حقيقي يُنقَّح، ونص يشبهه لا", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.abcdefghijk";
    expect(redact(jwt).text).toBe("[REDACTED_JWT]");
    // ليس JWT — الرأس لا يفك إلى JSON فيه alg
    expect(redact("eyJnotreal.notreal2.notreal3").text).toContain("eyJnotreal");
  });
});

describe("أرقام البطاقات — Luhn وليس الطول", () => {
  it("رقم صحيح يُنقَّح مع إبقاء آخر أربعة", () => {
    const { text } = redact("البطاقة 4539 1488 0343 6467 اتخصمت");
    expect(text).toContain("[REDACTED_CARD_6467]");
    expect(text).not.toContain("4539");
  });

  it("رقم طويل لا يجتاز Luhn لا يُنقَّح", () => {
    // أهم حالة: مبلغ أو معرّف طويل ليس بطاقة
    const { text } = redact("رقم المشروع 1234567890123456");
    expect(text).toContain("1234567890123456");
  });

  it("مبلغ عادي لا يُمس", () => {
    const { text } = redact("فاتورة 8500 ريال");
    expect(text).toBe("فاتورة 8500 ريال");
  });
});

describe("IBAN", () => {
  it("IBAN سعودي صحيح يختفي", () => {
    const { text } = redact("حوّل على SA0380000000608010167519");
    expect(text).toContain("[REDACTED_IBAN]");
    expect(text).not.toContain("608010167519");
  });

  it("سلسلة تشبه IBAN لكن checksum غلط تُترك", () => {
    expect(redact("الكود SA9999999999999999999999").text).toContain("SA99");
  });
});

describe("الهوية والهاتف والبريد", () => {
  it("رقم إقامة/هوية سعودي", () => {
    expect(redact("الإقامة 2345678901").text).toBe("الإقامة [REDACTED_NATIONAL_ID]");
  });

  it("الهاتف يُبقي آخر رقمين للسياق", () => {
    const { text } = redact("كلمني على +966512345678");
    expect(text).toContain("[REDACTED_PHONE_…78]");
    expect(text).not.toContain("51234");
  });

  it("البريد يصير رمزًا ثابتًا لنفس الشخص", () => {
    const a = redact("راسل layla@studio.sa").text;
    const b = redact("رد على layla@studio.sa بسرعة").text;
    const token = a.match(/\[PERSON_[a-z0-9]+\]/)?.[0];
    expect(token).toBeDefined();
    // نفس الشخص = نفس الرمز، فتبقى العلاقة مفهومة بلا كشف
    expect(b).toContain(token!);
    expect(redact("c@d.com").text).not.toContain(token!);
  });
});

describe("التداخل والسلامة", () => {
  it("نمط أطول يفوز — لا يُنقَّح جزء من IBAN كبطاقة", () => {
    const { redactions } = redact("SA0380000000608010167519");
    expect(redactions).toHaveLength(1);
    expect(redactions[0]?.kind).toBe("iban");
  });

  it("عدة أسرار في نص واحد", () => {
    const { redactions } = redact("sk-ant-api03-AAAAAAAAAAAAAAAAAA و 2345678901 و layla@x.com");
    expect(redactions.map((r) => r.kind)).toEqual(["secret", "national_id", "email"]);
  });

  it("مواضع التنقيح تشير للنص الناتج لا الأصل", () => {
    const { text, redactions } = redact("قبل sk-ant-api03-AAAAAAAAAAAAAAAAAA بعد");
    const r = redactions[0]!;
    expect(text.slice(r.start, r.end)).toBe(r.placeholder);
  });

  it("النص النظيف يمر كما هو", () => {
    const s = "مشترك في OpenAI بـ75 ريال بيتجدد 27";
    expect(redact(s).text).toBe(s);
  });
});

describe("الطبقة الثانية", () => {
  it("assertClean ترفض نصًا غير منقّح", () => {
    expect(() => assertClean("المفتاح sk-ant-api03-AAAAAAAAAAAAAAAAAA"))
      .toThrow(/redaction_failed/);
  });

  it("assertClean تمرّ على مخرَج redact — التنقيح ثابت لا يتكرر", () => {
    const once = redact("sk-ant-api03-AAAAAAAAAAAAAAAAAA و 4539148803436467").text;
    expect(() => assertClean(once)).not.toThrow();
  });
});
