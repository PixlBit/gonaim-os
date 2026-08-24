import { describe, it, expect } from "vitest";
import { count, inDays, elapsed, DAY, STORE, SIGNAL } from "../src/arabic.js";

describe("تمييز العدد", () => {
  it("المفرد والمثنى بلا رقم", () => {
    expect(count(1, DAY)).toBe("يوم");
    expect(count(2, DAY)).toBe("يومان");
  });

  it("٣–١٠ جمع", () => {
    expect(count(3, DAY)).toBe("3 أيام");
    expect(count(10, DAY)).toBe("10 أيام");
  });

  it("١١–٩٩ مفرد منصوب", () => {
    expect(count(11, DAY)).toBe("11 يومًا");
    expect(count(20, DAY)).toBe("20 يومًا");
    expect(count(99, DAY)).toBe("99 يومًا");
  });

  it("القاعدة على آخر خانتين", () => {
    expect(count(103, DAY)).toBe("103 أيام");
    expect(count(112, DAY)).toBe("112 يومًا");
    expect(count(100, DAY)).toBe("100 يوم");
  });

  it("الصفر يُقال لا يُرقَّم", () => {
    expect(count(0, DAY)).toBe("لا أيام");
    expect(count(0, SIGNAL)).toBe("لا إشارات");
  });

  it("يعمل على أسماء أخرى", () => {
    expect(count(2, STORE)).toBe("متجران");
    expect(count(4, STORE)).toBe("4 متاجر");
    expect(count(1, SIGNAL)).toBe("إشارة");
  });
});

describe("صيغ الزمن", () => {
  it("inDays", () => {
    expect(inDays(0)).toBe("اليوم");
    expect(inDays(1)).toBe("غدًا");
    expect(inDays(2)).toBe("بعد يومين");
    expect(inDays(5)).toBe("بعد 5 أيام");
    expect(inDays(20)).toBe("بعد 20 يومًا");
  });

  it("elapsed — الفعل يتبع المعدود", () => {
    expect(elapsed(1)).toBe("مر يوم");
    expect(elapsed(2)).toBe("مر يومان");
    expect(elapsed(5)).toBe("مرت 5 أيام");
    expect(elapsed(18)).toBe("مر 18 يومًا");
  });
});
