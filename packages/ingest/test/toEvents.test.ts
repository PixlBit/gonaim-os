import { describe, it, expect } from "vitest";
import { toEvent, Signal, IngestBatch } from "../src/index.js";

const opts = { device: "iphone" };
const AT = "2026-08-24T09:30:00+03:00";

describe("الرسائل — الحد الذي تفرضه الوثيقة", () => {
  const sms = {
    kind: "sms" as const, at: AT, sender: "Layla — Riyadh Studio",
    body: "تمام نبعتلك العقد بكرة، وحوّل على SA0380000000608010167519",
  };

  it("النص لا يُخزَّن افتراضيًا", () => {
    const e = toEvent(sms, opts);
    expect(e.payload["body"]).toBeUndefined();
    expect(e.payload["bodyRetention"]).toBe("drop");
  });

  it("لكنه متاح للاستخلاص في الجلسة", () => {
    const e = toEvent(sms, opts);
    expect(e.transientText).toContain("العقد");
  });

  it("والتنقيح يسبق كل شيء — حتى النص العابر", () => {
    const e = toEvent(sms, opts);
    expect(e.transientText).not.toContain("608010167519");
    expect(e.transientText).toContain("[REDACTED_IBAN]");
  });

  it("المرسل يصير رمزًا ثابتًا لا اسمًا", () => {
    const a = toEvent(sms, opts);
    const b = toEvent({ ...sms, at: "2026-08-25T09:00:00+03:00" }, opts);
    expect(a.payload["sender"]).not.toContain("Layla");
    // نفس الشخص = نفس الرمز، فتبقى العلاقة مفهومة بلا كشف
    expect(a.payload["sender"]).toBe(b.payload["sender"]);
  });

  it("الاحتفاظ المنقّح خيار صريح لا افتراضي", () => {
    const e = toEvent(sms, { ...opts, bodyRetention: "redacted" });
    expect(e.payload["body"]).toContain("[REDACTED_IBAN]");
    expect(e.payload["body"]).not.toContain("608010167519");
  });

  it("الرسالة دائمًا sensitive", () => {
    expect(toEvent(sms, opts).sensitivity).toBe("sensitive");
  });
});

describe("الموقع — الدقة تُخفَّض ولا تُرفض", () => {
  const loc = {
    kind: "location" as const, at: AT, precision: "exact" as const,
    lat: 24.71355, lon: 46.67529, event: "arrive" as const, label: "المكتب",
  };

  it("طلب exact مع سقف city يسقط الإحداثيات", () => {
    const e = toEvent(loc, opts);   // الافتراضي city
    expect(e.payload["precision"]).toBe("city");
    expect(e.payload["lat"]).toBeUndefined();
    expect(e.payload["label"]).toBe("المكتب");
  });

  it("سقف area يقرّب لحوالي كيلومتر", () => {
    const e = toEvent(loc, { ...opts, maxLocationPrecision: "area" });
    expect(e.payload["lat"]).toBe(24.71);
    expect(e.payload["lon"]).toBe(46.68);
  });

  it("exact يمر كاملًا فقط عند السماح صراحة", () => {
    const e = toEvent(loc, { ...opts, maxLocationPrecision: "exact" });
    expect(e.payload["lat"]).toBe(24.71355);
  });
});

describe("الصور والملاحظات", () => {
  it("الصورة تبقى على الجهاز — نحفظ المعرّف لا البكسل", () => {
    const e = toEvent({ kind: "photo", at: AT, localId: "IMG_4821", place: "الرياض" }, opts);
    expect(e.payload["localId"]).toBe("IMG_4821");
    expect(JSON.stringify(e.payload)).not.toContain("base64");
  });

  it("الملاحظة تُنقَّح", () => {
    const e = toEvent({ kind: "note", at: AT, text: "المفتاح sk-ant-api03-AAAAAAAAAAAAAAAAAA" }, opts);
    expect(e.payload["text"]).not.toContain("sk-ant");
    expect(e.payload["redactedCount"]).toBe(1);
  });
});

describe("منع التكرار", () => {
  it("نفس الإشارة تعطي نفس البصمة", () => {
    const s = { kind: "photo" as const, at: AT, localId: "IMG_1" };
    expect(toEvent(s, opts).fingerprint).toBe(toEvent(s, opts).fingerprint);
  });

  it("إشارتان مختلفتان لا", () => {
    const a = toEvent({ kind: "photo", at: AT, localId: "IMG_1" }, opts);
    const b = toEvent({ kind: "photo", at: AT, localId: "IMG_2" }, opts);
    expect(a.fingerprint).not.toBe(b.fingerprint);
  });
});

describe("التحقق من المدخل", () => {
  it("يرفض نوعًا غير معروف", () => {
    expect(Signal.safeParse({ kind: "microphone", at: AT }).success).toBe(false);
  });

  it("يرفض إحداثيات خارج المدى", () => {
    expect(Signal.safeParse({
      kind: "location", at: AT, precision: "exact", event: "arrive", lat: 999, lon: 0,
    }).success).toBe(false);
  });

  it("يحدّ حجم الدفعة", () => {
    const one = { kind: "note", at: AT, text: "x" };
    expect(IngestBatch.safeParse({ device: "i", signals: Array(101).fill(one) }).success).toBe(false);
    expect(IngestBatch.safeParse({ device: "i", signals: [] }).success).toBe(false);
  });
});
