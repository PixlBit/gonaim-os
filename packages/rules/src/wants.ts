import type { Rule, RuleFinding } from "./types.js";
import { daysSince } from "./dates.js";
import { count, DAY, TIME, STORE, type ArabicNoun } from "@gonaim/domain";

const VISIT: ArabicNoun = { one: "زيارة", two: "زيارتان", few: "زيارات", many: "زيارة" };

const WATCHING = new Set(["want", "considering", "watching_price"]);
const fmt = (n: number, c: string) => `${n.toLocaleString("en-US")} ${c}`;

/** أحدث رصد سعر، أو undefined لو لا يوجد. */
function latestPrice<T extends { observedAt: string }>(prices: readonly T[]): T | undefined {
  return [...prices].sort((a, b) => (a.observedAt < b.observedAt ? 1 : -1))[0];
}

export const revisitedRepeatedly: Rule = {
  code: "want.revisited_repeatedly",
  domain: "wants",
  titleAr: "اهتمام متكرر يستحق قرارًا",
  firesWhen: "زيارات متكررة من أكثر من متجر خلال ٣٠ يومًا",
  params: { minRevisits: 3, minStores: 2 },
  run({ snapshot }) {
    const out: RuleFinding[] = [];
    for (const w of snapshot.wants) {
      if (!WATCHING.has(w.state)) continue;
      if (w.revisits30d < this.params.minRevisits!) continue;
      if (w.distinctStores < this.params.minStores!) continue;
      // "لا تشترِ الآن" قرار محترم — لا نعيد فتحه قبل انتهاء المهلة
      if (w.coolingUntil && w.coolingUntil > snapshot.today) continue;
      const title = snapshot.entities.get(w.entityId)?.title ?? "عنصر";
      out.push({
        key: `${this.code}:${w.entityId}`,
        headline: `${title} — رجعت له ${count(w.revisits30d, TIME)} من ${count(w.distinctStores, STORE)}`,
        whyNow: `اهتمام متكرر منذ ${count(daysSince(w.firstSeenAt, snapshot.today), DAY)}. القرار مؤجَّل، لا محسوم.`,
        suggestedMove: w.targetPrice
          ? `تثبيت قاعدة: نبّهني تحت ${fmt(w.targetPrice, w.currency)}`
          : "تحديد سعر مستهدف، أو تأجيل صريح",
        sensitivity: "private",
        evidence: [
          { label: `${count(w.revisits30d, VISIT)} · ${count(w.distinctStores, STORE)}`, mode: "observed" },
          ...(w.whyWant.length ? [{ label: `السبب: ${w.whyWant.join(" · ")}`, mode: "observed" as const }] : []),
        ],
        urgency: 0.35,
        goalMatch: 0.5,
      });
    }
    return out;
  },
};

export const priceDropped: Rule = {
  code: "want.price_dropped",
  domain: "wants",
  titleAr: "انخفاض سعر حقيقي لعنصر مراقَب",
  firesWhen: "الانخفاض عن أعلى سعر مرصود تجاوز الحد الأدنى",
  params: { minDrop: 0.10 },
  run({ snapshot }) {
    const out: RuleFinding[] = [];
    for (const w of snapshot.wants) {
      if (!WATCHING.has(w.state) || w.prices.length < 2) continue;
      const now = latestPrice(w.prices);
      if (!now) continue;
      const peak = Math.max(...w.prices.map((p) => p.price));
      const drop = (peak - now.price) / peak;
      // لا تنبيه على تغيّر تافه — Blueprint §18.3
      if (drop < this.params.minDrop!) continue;
      const title = snapshot.entities.get(w.entityId)?.title ?? "عنصر";
      const hitTarget = w.targetPrice !== undefined && now.price <= w.targetPrice;
      out.push({
        key: `${this.code}:${w.entityId}:${now.price}`,
        headline: `${title} — نزل ${Math.round(drop * 100)}٪ إلى ${fmt(now.price, now.currency)}`,
        whyNow: hitTarget
          ? `وصل لسعرك المستهدف (${fmt(w.targetPrice!, w.currency)}) لأول مرة.`
          : `أعلى سعر رصدته كان ${fmt(peak, now.currency)}.`,
        sensitivity: "private",
        evidence: w.prices.slice(-3).map((p) => ({
          label: `${fmt(p.price, p.currency)} · ${p.store} · ${p.observedAt.slice(0, 10)}`,
          sourceUri: p.sourceUri,
          observedAt: p.observedAt,
          mode: "observed" as const,
        })),
        urgency: hitTarget ? 0.8 : 0.55,
        goalMatch: 0.55,
      });
    }
    return out;
  },
};

export const alreadyOwned: Rule = {
  code: "want.already_owned",
  domain: "wants",
  titleAr: "لديك ما يقوم بنفس الدور",
  firesWhen: "مقتنى بنفس الفئة وحالته سليمة",
  params: {},
  run({ snapshot }) {
    const out: RuleFinding[] = [];
    const healthy = snapshot.possessions.filter(
      (p) => p.condition === "new" || p.condition === "good",
    );
    for (const w of snapshot.wants) {
      if (!WATCHING.has(w.state)) continue;
      const wantCat = snapshot.entities.get(w.entityId)?.summary;
      const match = healthy.find((p) => p.category === wantCat);
      if (!match) continue;
      const owned = snapshot.entities.get(match.entityId)?.title ?? match.category;
      out.push({
        key: `${this.code}:${w.entityId}`,
        headline: `عندك ${owned} بالفعل وحالته ${match.condition === "new" ? "ممتازة" : "جيدة"}`,
        whyNow: "ملاحظة قبل القرار، لا اعتراض عليه.",
        sensitivity: "private",
        evidence: [{ label: `${owned} · ${match.acquiredOn ?? "تاريخ غير معروف"}`, mode: "observed" }],
        // أخف تدخل ممكن: تكلفة مقاطعة عالية عمدًا حتى تنزل لطبقة Whisper
        urgency: 0.15,
        goalMatch: 0.4,
      });
    }
    return out;
  },
};
