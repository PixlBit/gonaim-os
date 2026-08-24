import type { Rule, RuleFinding } from "./types.js";
import { daysSince } from "./dates.js";
import { count, elapsed, DAY } from "@gonaim/domain";

export const obligationOverdue: Rule = {
  code: "obligation.overdue_vs_typical",
  domain: "social",
  titleAr: "رد أو وعد تجاوز المدة المعتادة",
  firesWhen: "الصمت تجاوز المعتاد في هذه العلاقة مضروبًا في العامل",
  params: { factor: 1.5 },
  run({ snapshot }) {
    const out: RuleFinding[] = [];
    for (const o of snapshot.obligations) {
      // released = قرر ألا يفعلها. لا يُذكَّر بها مجددًا — أبدًا.
      if (o.status !== "open") continue;
      if (!o.lastContactAt || o.typicalReplyDays === undefined) continue;
      const silent = daysSince(o.lastContactAt, snapshot.today);
      if (silent <= o.typicalReplyDays * this.params.factor!) continue;
      const person = o.personEntityId
        ? snapshot.entities.get(o.personEntityId)?.title
        : undefined;
      out.push({
        key: `${this.code}:${o.entityId}`,
        headline: person ? `${o.what} — ${person}` : o.what,
        whyNow: `${elapsed(silent)}، والمعتاد في هذه العلاقة ${count(o.typicalReplyDays, DAY)}.`,
        suggestedMove: "رد قصير الآن، أو إعلانه متروكًا",
        sensitivity: "sensitive",
        evidence: [{
          label: `مسجَّل من: ${o.notedFrom} · آخر تواصل ${o.lastContactAt.slice(0, 10)}`,
          ...(o.sourceUri ? { sourceUri: o.sourceUri } : {}),
          mode: "observed" as const,
        }],
        urgency: Math.min(1, silent / (o.typicalReplyDays * 3)),
        goalMatch: 0.7,
      });
    }
    return out;
  },
};
