import type { Rule, RuleFinding } from "./types.js";
import type { Evidence } from "@gonaim/domain";
import { daysUntil, daysSince } from "./dates.js";

/**
 * القاعدة الجامعة — هي وحدها ما يجعل النظام يبدو مختلفًا عن تطبيق محاسبة.
 * مجال واحد لا يُظهر خيطًا. ADR-0010
 */
export const cashWindow: Rule = {
  code: "cross.cash_window",
  domain: "cross",
  titleAr: "نافذة سيولة — عدة مجالات تتقاطع",
  firesWhen: "ثلاثة مجالات أو أكثر تتقاطع في نفس النافذة الزمنية",
  params: { windowDays: 10, minDomains: 3 },
  run({ snapshot }) {
    const { windowDays, minDomains } = this.params as { windowDays: number; minDomains: number };
    const domains = new Set<string>();
    const evidence: Evidence[] = [];
    const subsumes: string[] = [];
    let outflow = 0;
    let receivable = 0;

    for (const s of snapshot.subscriptions) {
      if (s.cancelledAt || !s.autoRenews || !s.renewsOn) continue;
      const d = daysUntil(s.renewsOn, snapshot.today);
      if (d < 0 || d > windowDays) continue;
      domains.add("اشتراكات");
      outflow += s.amount;
      subsumes.push(`sub.renewal_approaching:${s.entityId}:${s.renewsOn}`);
      const title = snapshot.entities.get(s.entityId)?.title ?? s.provider;
      evidence.push({ label: `${title} · −${s.amount} ${s.currency} بعد ${d} أيام`, mode: "observed" });
    }

    for (const inv of snapshot.invoices) {
      if (inv.paidOn || inv.direction !== "incoming" || inv.typicalDays === undefined) continue;
      if (daysSince(inv.issuedOn, snapshot.today) <= inv.typicalDays) continue;
      domains.add("مستحقات");
      receivable += inv.amount;
      subsumes.push(`invoice.overdue_vs_typical:${inv.entityId}`);
      evidence.push({ label: `${inv.counterparty} · +${inv.amount} ${inv.currency} متأخرة`, mode: "observed" });
    }

    for (const w of snapshot.wants) {
      if (w.revisits30d < 3) continue;
      const latest = [...w.prices].sort((a, b) => (a.observedAt < b.observedAt ? 1 : -1))[0];
      if (!latest) continue;
      domains.add("رغبات");
      outflow += latest.price;
      subsumes.push(`want.revisited_repeatedly:${w.entityId}`);
      const title = snapshot.entities.get(w.entityId)?.title ?? "عنصر";
      evidence.push({ label: `${title} · −${latest.price} ${latest.currency} محتمل`, mode: "inferred" });
    }

    if (domains.size < minDomains) return [];

    const net = receivable - outflow;
    const pressure = net < 0;
    const finding: RuleFinding = {
      key: `${this.code}:${snapshot.today}`,
      headline: pressure
        ? `نافذة ضغط سيولة خلال ${windowDays} أيام — ${Math.abs(net).toLocaleString("en-US")} SAR`
        : `نافذة سيولة موجبة خلال ${windowDays} أيام — ${net.toLocaleString("en-US")} SAR`,
      whyNow: `${domains.size} مجالات تتقاطع في نفس النافذة: ${[...domains].join(" · ")}.`,
      suggestedMove: receivable > 0
        ? "متابعة المستحق قبل التجديد التلقائي"
        : "مراجعة التجديدات قبل السحب",
      sensitivity: "sensitive",
      evidence,
      subsumes,
      // الاستعجال من إغلاق النافذة، لا من إشارة صافيها. نافذة موجبة اليوم
      // تنقلب سالبة بعد السحب التلقائي — والقرار الآن، لا بعد التجديد.
      urgency: pressure ? 0.85 : 0.55,
      goalMatch: 0.9,
    };
    return [finding];
  },
};
