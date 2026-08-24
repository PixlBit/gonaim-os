import type { Rule, RuleFinding } from "./types.js";
import { daysUntil, daysSince } from "./dates.js";
import { count, inDays, elapsed, DAY } from "@gonaim/domain";

const fmt = (n: number, c: string) => `${n.toLocaleString("en-US")} ${c}`;

export const renewalApproaching: Rule = {
  code: "sub.renewal_approaching",
  domain: "money",
  titleAr: "اشتراك يقترب من التجديد",
  firesWhen: "التجديد خلال المهلة والتجديد التلقائي مفعّل",
  params: { leadDays: 5 },
  run({ snapshot }) {
    const out: RuleFinding[] = [];
    for (const s of snapshot.subscriptions) {
      if (s.cancelledAt || !s.autoRenews || !s.renewsOn) continue;
      const days = daysUntil(s.renewsOn, snapshot.today);
      if (days < 0 || days > this.params.leadDays!) continue;
      const title = snapshot.entities.get(s.entityId)?.title ?? s.provider;
      out.push({
        key: `${this.code}:${s.entityId}:${s.renewsOn}`,
        headline: `${title} يتجدد ${inDays(days)} — ${fmt(s.amount, s.currency)}`,
        whyNow: `التجديد التلقائي مفعّل، وباقي ${count(days, DAY)} على السحب.`,
        sensitivity: "sensitive",
        evidence: [{
          label: `مبلغ مؤكد من: ${s.amountSource} · آخر تحقق ${s.lastVerifiedAt.slice(0, 10)}`,
          mode: "observed",
        }],
        // الاستعجال يرتفع كلما اقترب التاريخ، لا قيمة ثابتة
        urgency: 1 - days / (this.params.leadDays! + 1),
        goalMatch: 0.7,
      });
    }
    return out;
  },
};

export const creditUnderused: Rule = {
  code: "sub.credit_underused",
  domain: "money",
  titleAr: "كريدت غير مستهلك قبل التجديد",
  firesWhen: "الاستهلاك تحت العتبة والتجديد قريب",
  params: { threshold: 0.30, leadDays: 7 },
  run({ snapshot }) {
    const out: RuleFinding[] = [];
    for (const s of snapshot.subscriptions) {
      if (s.cancelledAt || !s.renewsOn) continue;
      if (s.creditIncluded === undefined || s.creditUsed === undefined) continue;
      const ratio = s.creditUsed / s.creditIncluded;
      const days = daysUntil(s.renewsOn, snapshot.today);
      if (ratio >= this.params.threshold! || days < 0 || days > this.params.leadDays!) continue;
      const title = snapshot.entities.get(s.entityId)?.title ?? s.provider;
      const pct = Math.round(ratio * 100);
      out.push({
        key: `${this.code}:${s.entityId}:${s.renewsOn}`,
        headline: `${title} — استهلكت ${pct}٪ من الكريدت وباقي ${count(days, DAY)}`,
        whyNow: `تدفع ${fmt(s.amount, s.currency)} مقابل ${s.creditIncluded} ${s.creditUnit ?? "وحدة"}، واستخدمت ${s.creditUsed}.`,
        // الاقتراح ليس "ألغِ" — القرار له، والنظام يعرض الخيارين
        suggestedMove: "استغلال الكريدت قبل التجديد، أو مراجعة الخطة",
        sensitivity: "sensitive",
        evidence: [{ label: `${s.creditUsed} / ${s.creditIncluded} ${s.creditUnit ?? ""}`.trim(), mode: "observed" }],
        urgency: 0.5,
        goalMatch: 0.65,
      });
    }
    return out;
  },
};

export const invoiceOverdue: Rule = {
  code: "invoice.overdue_vs_typical",
  domain: "money",
  titleAr: "فاتورة تأخرت عن المعتاد لهذا الطرف",
  firesWhen: "التأخير تجاوز المعتاد مع هذا الطرف مضروبًا في العامل",
  params: { factor: 1.25 },
  run({ snapshot }) {
    const out: RuleFinding[] = [];
    for (const inv of snapshot.invoices) {
      if (inv.paidOn) continue;
      // بلا "معتاد" لهذا الطرف لا نطلق القاعدة. عتبة عامة تعني إزعاجًا،
      // لأن كل عميل له إيقاعه. ADR-0010
      if (inv.typicalDays === undefined) continue;
      const age = daysSince(inv.issuedOn, snapshot.today);
      const limit = inv.typicalDays * this.params.factor!;
      if (age <= limit) continue;
      const title = snapshot.entities.get(inv.entityId)?.title ?? `فاتورة ${inv.counterparty}`;
      out.push({
        key: `${this.code}:${inv.entityId}`,
        headline: `${title} — ${fmt(inv.amount, inv.currency)} من ${inv.counterparty}`,
        whyNow: `${elapsed(age)}، والمعتاد مع ${inv.counterparty} ${count(inv.typicalDays, DAY)}.`,
        suggestedMove: "متابعة مع العميل",
        sensitivity: "sensitive",
        evidence: [{ label: `صدرت ${inv.issuedOn} · المصدر: ${inv.amountSource}`, mode: "observed" }],
        urgency: Math.min(1, age / (inv.typicalDays * 2)),
        goalMatch: 0.85,
      });
    }
    return out;
  },
};
