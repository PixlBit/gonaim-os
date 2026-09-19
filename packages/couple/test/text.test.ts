import { describe, expect, it } from "vitest";
import { seedSpace } from "../src/seed.js";
import { apply } from "../src/actions.js";
import { Actions } from "../src/schema.js";
import { report } from "../src/report.js";
import { enSpan, enCount, enDate, enDayDate, enTime, join, say, T } from "../src/text.js";
import type { Space } from "../src/types.js";

/**
 * اللغتان — عقد، لا ميزة.
 *
 * أسهل طريقة لإفساد منصة بلغتين أن يُضاف سطر عربي جديد بلا ترجمة، فيظهر
 * للقارئ الإنجليزي عربيًا وسط جملته. ولهذا يمشي الاختبار الأول على
 * **كل** ما يولّده التقرير ويرفض أي نص إنجليزي فيه حرف عربي واحد.
 *
 * وهو اختبار يتعب مع الوقت بمعنى جيد: من ينسى الترجمة يعرف قبل أن يدفع.
 */

const NOW = new Date("2026-01-05T09:00:00.000Z");
const TODAY = "2026-01-05";
const ARABIC = /[؀-ۿ]/;

function space(): Space {
  let s = seedSpace({
    him: { name: "غنيم", handle: "gonaim" },
    her: { name: "نور", handle: "nour" },
    now: NOW,
  });
  const act = (a: unknown, by: "him" | "her" = "him", now = NOW) => {
    s = apply(s, Actions.parse(a), { by, now });
  };
  // مساحة حيّة بما يكفي ليُنطق أغلب القواعد
  act({ type: "milestone.set", kind: "wedding", title: "الفرح", date: "2026-04-10" });
  act({ type: "settings.update", budget: 300000, together: "2023-01-05" });
  act({ type: "expense.add", title: "عربون", category: "قاعة", amount: 320000, at: "2026-01-02" });
  act({ type: "task.add", title: "نحجز المصور", priority: 1, due: "2025-12-20" });
  act({ type: "appointment.add", title: "القاعة", at: "2026-01-06T18:00", attendees: "both" });
  act({ type: "memory.add", date: "2025-09-01", title: "أول قعدة" });
  act({ type: "wish.add", title: "نتعشّى على النيل", kind: "date" }, "her", new Date("2025-08-01"));
  act({ type: "persona.set", traits: { loveLanguage: "words", money: "saver", planning: "planner" } }, "him");
  act({ type: "persona.set", traits: { loveLanguage: "time", money: "spender", planning: "flow" } }, "her");
  return s;
}

/** كل نص ثنائي يولّده التقرير، مسطَّحًا. */
function everyText(r: ReturnType<typeof report>): Array<[string, { ar: string; en: string }]> {
  const out: Array<[string, { ar: string; en: string }]> = [];
  r.attention.forEach((a, i) => {
    out.push([`attention[${i}].title`, a.title], [`attention[${i}].why`, a.why]);
    if (a.move) out.push([`attention[${i}].move`, a.move]);
  });
  r.sync.insights.forEach((x, i) => {
    out.push([`insight[${i}].title`, x.title], [`insight[${i}].why`, x.why]);
    if (x.move) out.push([`insight[${i}].move`, x.move]);
  });
  for (const p of [r.sync.him, r.sync.her]) {
    p.axes.forEach((a, i) => out.push([`${p.key}.axes[${i}].name`, a.name], [`${p.key}.axes[${i}].evidence`, a.evidence]));
    if (p.signature) out.push([`${p.key}.signature`, p.signature]);
  }
  r.forecast.weeks.forEach((w, i) => out.push([`week[${i}].label`, w.label], [`week[${i}].note`, w.note]));
  r.countdown.all.forEach((m, i) => out.push([`milestone[${i}].when`, m.when]));
  out.push(["heartbeat.line", r.heartbeat.line]);
  if (r.night) {
    out.push(["night.when", r.night.when], ["night.title", r.night.title]);
    r.night.why.forEach((w, i) => out.push([`night.why[${i}]`, w]));
  }
  r.onThisDay.forEach((m, i) => out.push([`onThisDay[${i}].line`, m.line]));
  if (r.anniversary) out.push(["anniversary.line", r.anniversary.line]);
  return out;
}

describe("لغتان في وقت واحد", () => {
  const r = report(space(), TODAY, "him");
  const all = everyText(r);

  it("التقرير يولّد نصوصًا كتيرة — وإلا فالاختبار بيمر على فراغ", () => {
    expect(all.length).toBeGreaterThan(30);
  });

  it("مفيش حرف عربي واحد في أي نص إنجليزي", () => {
    /*
     * الاستثناءات كلها من نوع واحد: **بيانات كتبها صاحبها**، لا واجهة.
     *
     * اسم الشخص، وعنوان المحطة، واسم المصروف — هذه لا تُترجَم ولا يجوز أن
     * تُترجَم: من كتب «الفرح» يريد أن يقرأ «الفرح». ومعها رمز العملة:
     * `settings.currency` حقل يكتبه الاثنان، فمن كتب «ج» يراها «ج» في
     * اللغتين. ولو ترجمناها إلى EGP لكنا اخترعنا عنه ما لم يقله — وهذا
     * أسوأ من حرف عربي في جملة إنجليزية.
     *
     * فما يبقى بعد الحذف هو نصّ المنصة وحده، وفيه لا يُغتفَر حرف واحد.
     */
    const data = [
      /غنيم/g, /نور/g, /الفرح/g, /عربون/g, /القاعة/g, /المصور/g,
      /أول قعدة/g, /نتعشّى على النيل/g, /قاعة/g, /نحجز/g,
      /ج/g,   // رمز العملة — حقل يكتبه صاحبه
    ];
    const strip = (text: string) => data.reduce((acc, re) => acc.replace(re, ""), text);

    const bad = all.filter(([, v]) => ARABIC.test(strip(v.en)));
    expect(bad.map(([k, v]) => `${k}: ${v.en}`)).toEqual([]);
  });

  it("مفيش نص فاضي في أي من اللغتين", () => {
    const empty = all.filter(([, v]) => v.ar.trim() === "" || v.en.trim() === "");
    expect(empty.map(([k]) => k)).toEqual([]);
  });

  it("النصّان مختلفان فعلًا — مش نسخة واحدة مكرّرة", () => {
    // بعضها يتطابق بحق (اسم عنصر، قائمة أسماء)، فالشرط على الأغلبية
    const same = all.filter(([, v]) => v.ar === v.en).length;
    expect(same / all.length).toBeLessThan(0.2);
  });
});

describe("صيغ الإنجليزية", () => {
  it("المدد تُقرأ، ولا تُقال بالأيام حين تطول", () => {
    expect(enSpan(0)).toBe("today");
    expect(enSpan(1)).toBe("a day");
    expect(enSpan(9)).toBe("9 days");
    expect(enSpan(21)).toBe("3 weeks");
    expect(enSpan(90)).toBe("3 months");
    expect(enSpan(365)).toBe("a year");
    expect(enSpan(400)).toBe("a year and a month");
    expect(enSpan(800)).toBe("2 years and 2 months");
  });

  it("الجمع لا يكتب «1 tasks»", () => {
    expect(enCount(1, "task")).toBe("1 task");
    expect(enCount(3, "task")).toBe("3 tasks");
    expect(enCount(2, "essential")).toBe("2 essentials");
  });

  it("التاريخ يبدأ بالرقم في اللغتين — فالسطر الواحد يُقرأ بأي منهما", () => {
    expect(enDate("2026-04-10")).toBe("10 April 2026");
    expect(enDayDate("2026-04-10")).toBe("Friday 10 April");
    expect(enTime("2026-04-10T19:30")).toBe("7:30 PM");
    expect(enTime("2026-04-10T00:05")).toBe("12:05 AM");
  });

  it("تاريخ مكسور يرجع كما جاء بدل ما يخترع يومًا", () => {
    expect(enDate("2026-99-10")).toBe("2026-99-10");
    expect(enTime("لا وقت")).toBe("");
  });

  it("`say` و`join` يشتغلوا على اللغتين", () => {
    const a = T("واحد", "one"), b = T("اتنين", "two");
    expect(say(a, "ar")).toBe("واحد");
    expect(say(a, "en")).toBe("one");
    expect(join([a, null, b])).toEqual({ ar: "واحد · اتنين", en: "one · two" });
  });
});
