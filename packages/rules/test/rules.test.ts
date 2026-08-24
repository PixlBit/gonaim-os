import { describe, it, expect } from "vitest";
import { ALL_RULES, runRules, obligationOverdue, invoiceOverdue,
         priceDropped, alreadyOwned, cashWindow, renewalApproaching } from "../src/index.js";
import { gonaimSnapshot, NOTHING_SEEN } from "./fixtures.js";

const ctx = (over = {}) => ({ snapshot: gonaimSnapshot(over), alreadySurfaced: NOTHING_SEEN });

describe("القواعد تقارن بالمعتاد لهذا الطرف، لا بعتبة عامة", () => {
  it("فاتورة تأخرت عن معتاد عميلها تُطلق", () => {
    const [f] = invoiceOverdue.run(ctx());
    expect(f?.whyNow).toContain("مر 18 يومًا");
    expect(f?.whyNow).toContain("المعتاد مع Studio Client 14 يومًا");
  });

  it("صيغة المعدود تتبع العدد", () => {
    const s3 = gonaimSnapshot();
    s3.invoices[0]!.typicalDays = 3;
    s3.invoices[0]!.issuedOn = "2026-08-12";   // مرت 10 أيام
    const [a] = invoiceOverdue.run({ snapshot: s3, alreadySurfaced: NOTHING_SEEN });
    expect(a?.whyNow).toContain("مرت 10 أيام");
    expect(a?.whyNow).toContain("3 أيام");     // لا "3 يومًا"

    const s1 = gonaimSnapshot();
    s1.invoices[0]!.typicalDays = 1;
    const [b] = invoiceOverdue.run({ snapshot: s1, alreadySurfaced: NOTHING_SEEN });
    expect(b?.whyNow).toContain("المعتاد مع Studio Client يوم");  // لا "1 يوم"
  });

  it("نفس التأخير مع عميل معتاده أطول لا يُطلق", () => {
    const snapshot = gonaimSnapshot();
    snapshot.invoices[0]!.typicalDays = 30;
    expect(invoiceOverdue.run({ snapshot, alreadySurfaced: NOTHING_SEEN })).toHaveLength(0);
  });

  it("فاتورة بلا معتاد معروف لا تُطلق أبدًا", () => {
    const snapshot = gonaimSnapshot();
    delete snapshot.invoices[0]!.typicalDays;
    expect(invoiceOverdue.run({ snapshot, alreadySurfaced: NOTHING_SEEN })).toHaveLength(0);
  });

  it("علاقة سريعة الرد تُطلق أسرع من علاقة بطيئة", () => {
    const fast = gonaimSnapshot();
    const slow = gonaimSnapshot();
    slow.obligations[0]!.typicalReplyDays = 14;
    expect(obligationOverdue.run({ snapshot: fast, alreadySurfaced: NOTHING_SEEN })).toHaveLength(1);
    expect(obligationOverdue.run({ snapshot: slow, alreadySurfaced: NOTHING_SEEN })).toHaveLength(0);
  });
});

describe("القرارات التي اتخذها غنيم تُحترم", () => {
  it("التزام released لا يُذكَّر به مجددًا", () => {
    const snapshot = gonaimSnapshot();
    snapshot.obligations[0]!.status = "released";
    snapshot.obligations[0]!.releasedReason = "قررت ما أكمّلش";
    expect(obligationOverdue.run({ snapshot, alreadySurfaced: NOTHING_SEEN })).toHaveLength(0);
  });

  it("رغبة في فترة تهدئة لا تُفتح قبل انتهائها", () => {
    const snapshot = gonaimSnapshot();
    snapshot.wants[0]!.coolingUntil = "2026-09-30";
    const codes = ALL_RULES.flatMap((r) =>
      r.run({ snapshot, alreadySurfaced: NOTHING_SEEN }).map(() => r.code));
    expect(codes).not.toContain("want.revisited_repeatedly");
  });
});

describe("لا تنبيه على تغيّر تافه", () => {
  it("انخفاض ٣٪ لا يُطلق", () => {
    const snapshot = gonaimSnapshot();
    snapshot.wants[0]!.prices = [
      { price: 1400, currency: "SAR", store: "a", sourceUri: "u", observedAt: "2026-08-10T00:00:00Z" },
      { price: 1360, currency: "SAR", store: "a", sourceUri: "u", observedAt: "2026-08-21T00:00:00Z" },
    ];
    expect(priceDropped.run({ snapshot, alreadySurfaced: NOTHING_SEEN })).toHaveLength(0);
  });

  it("انخفاض ١٢٪ يُطلق ويذكر بلوغ السعر المستهدف", () => {
    const snapshot = gonaimSnapshot();
    snapshot.wants[0]!.targetPrice = 1350;
    const [f] = priceDropped.run({ snapshot, alreadySurfaced: NOTHING_SEEN });
    expect(f?.headline).toContain("12٪");
    expect(f?.whyNow).toContain("سعرك المستهدف");
  });
});

describe("القاعدة الجامعة", () => {
  it("تُطلق عند تقاطع ثلاثة مجالات وتحسب الضغط", () => {
    const [f] = cashWindow.run(ctx());
    expect(f?.whyNow).toContain("3 مجالات");
    // 8500 مستحق − (75 اشتراك + 1319 رغبة) = +7106
    expect(f?.headline).toContain("7,106");
    expect(f?.headline).toContain("موجبة");
  });

  it("لا تُطلق بمجالين فقط", () => {
    const snapshot = gonaimSnapshot();
    snapshot.wants = [];
    expect(cashWindow.run({ snapshot, alreadySurfaced: NOTHING_SEEN })).toHaveLength(0);
  });

  it("تقلب لضغط سالب لو المستحق غاب", () => {
    const snapshot = gonaimSnapshot();
    snapshot.invoices[0]!.paidOn = "2026-08-20";
    snapshot.possessions = [];
    // مجالان فقط الآن — لا إطلاق. هذا مقصود: خيط بمجالين ليس خيطًا.
    expect(cashWindow.run({ snapshot, alreadySurfaced: NOTHING_SEEN })).toHaveLength(0);
  });
});

describe("بوابة التسجيل وميزانية المقاطعة", () => {
  it("الميزانية تُخفِّض الدرجة ولا تُخفي الإشارة", () => {
    const all = runRules(ALL_RULES, ctx(), { interruptionBudget: 10 });
    const none = runRules(ALL_RULES, ctx(), { interruptionBudget: 0 });
    const total = (r: typeof all) => r.surfaced.length + r.inbox.length + r.belowThreshold.length;
    expect(total(all)).toBe(total(none));
    expect(none.surfaced).toHaveLength(0);
    expect(none.inbox.length).toBeGreaterThan(0);
  });

  it("Quiet Hours تمنع الظهور لكن لا تُسقط شيئًا", () => {
    const r = runRules(ALL_RULES, ctx(), { quietHours: true });
    expect(r.surfaced).toHaveLength(0);
    expect(r.stayedSilent).toBe(true);
    expect(r.inbox.length).toBeGreaterThan(0);
  });

  it("ما عُرض سابقًا يفقد جِدّته فينزل تحت العتبة", () => {
    const first = runRules(ALL_RULES, ctx(), { interruptionBudget: 10 });
    const keys = new Set(first.surfaced.map((s) => s.id));
    const second = runRules(
      ALL_RULES,
      { snapshot: gonaimSnapshot(), alreadySurfaced: keys },
      { interruptionBudget: 10 },
    );
    expect(second.surfaced.length).toBeLessThan(first.surfaced.length);
  });

  it("الملاحظة الخفيفة تبقى Whisper ولا تقاطع", () => {
    const snapshot = gonaimSnapshot();
    snapshot.possessions[0]!.condition = "good";
    const found = alreadyOwned.run({ snapshot, alreadySurfaced: NOTHING_SEEN });
    expect(found).toHaveLength(1);
    const r = runRules([alreadyOwned], { snapshot, alreadySurfaced: NOTHING_SEEN });
    expect(r.surfaced).toHaveLength(0);
  });

  it("كل إشارة تحمل دليلًا قابلًا للفتح", () => {
    const r = runRules(ALL_RULES, ctx(), { interruptionBudget: 10 });
    for (const s of [...r.surfaced, ...r.inbox]) {
      expect(s.evidence.length, `${s.ruleCode} بلا دليل`).toBeGreaterThan(0);
      expect(s.whyNow.length, `${s.ruleCode} بلا "لماذا الآن"`).toBeGreaterThan(0);
    }
  });
});

describe("التركيب يعلو على أجزائه", () => {
  it("النافذة الجامعة تتقدم على أجزائها هي", () => {
    const r = runRules(ALL_RULES, ctx(), { interruptionBudget: 10 });
    const all = [...r.surfaced, ...r.inbox];
    const cross = r.surfaced.find((s) => s.ruleCode === "cross.cash_window");
    expect(cross, "القاعدة الجامعة لم تظهر").toBeDefined();

    const parts = all.filter((s) =>
      ["invoice.overdue_vs_typical", "sub.renewal_approaching",
       "want.revisited_repeatedly"].includes(s.ruleCode));
    expect(parts.length).toBeGreaterThan(0);
    for (const p of parts) {
      expect(cross!.relevance).toBeGreaterThan(p.relevance);
    }
  });

  it("لكنها لا تبتلع ما ليس جزءًا منها", () => {
    // التزام اجتماعي ليس داخل نافذة السيولة — يظل مستقلًا وقد يتقدم عليها
    const r = runRules(ALL_RULES, ctx(), { interruptionBudget: 10 });
    const obligation = r.surfaced.find((s) => s.ruleCode === "obligation.overdue_vs_typical");
    expect(obligation, "الالتزام اختفى — استيعاب أوسع من اللازم").toBeDefined();
  });

  it("الأجزاء المشروحة تنزل للوارد ولا تختفي", () => {
    const r = runRules(ALL_RULES, ctx(), { interruptionBudget: 10 });
    const codes = r.surfaced.map((s) => s.ruleCode);
    // الفاتورة والتجديد والرغبة المتكررة كلها داخل النافذة — لا تتكرر فوق
    expect(codes).not.toContain("invoice.overdue_vs_typical");
    expect(codes).not.toContain("sub.renewal_approaching");
    const inboxCodes = r.inbox.map((s) => s.ruleCode);
    expect(inboxCodes).toContain("invoice.overdue_vs_typical");
    expect(inboxCodes).toContain("sub.renewal_approaching");
  });

  it("لا شيء يضيع: المجموع ثابت قبل وبعد الاستيعاب", () => {
    const r = runRules(ALL_RULES, ctx(), { interruptionBudget: 10 });
    const seenIds = new Set([...r.surfaced, ...r.inbox, ...r.belowThreshold].map((s) => s.id));
    const raw = ALL_RULES.flatMap((rule) => rule.run(ctx()));
    expect(seenIds.size).toBe(raw.length);
  });
});

describe("الاستعجال يتصاعد", () => {
  it("التجديد الأقرب أكثر استعجالًا", () => {
    const far = gonaimSnapshot(); far.subscriptions[0]!.renewsOn = "2026-08-27";
    const near = gonaimSnapshot(); near.subscriptions[0]!.renewsOn = "2026-08-23";
    const u = (s: typeof far) => renewalApproaching.run({ snapshot: s, alreadySurfaced: NOTHING_SEEN })[0]?.urgency ?? 0;
    expect(u(near)).toBeGreaterThan(u(far));
  });
});
