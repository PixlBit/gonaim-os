import type { LifeSnapshot, Signal, SensitivityZone } from "@gonaim/domain";

export interface RuleContext {
  snapshot: LifeSnapshot;
  /** الإشارات التي عُرضت سابقًا — تُستخدم لحساب Novelty وكبت التكرار. */
  alreadySurfaced: ReadonlySet<string>;
}

/** ناتج القاعدة قبل التسجيل. القاعدة تصف، والبوابة تقرر. */
export interface RuleFinding {
  /** مفتاح ثابت لنفس الملاحظة — يمنع تكرار نفس الإشارة كل تشغيل. */
  key: string;
  headline: string;
  whyNow: string;
  suggestedMove?: string;
  sensitivity: SensitivityZone;
  evidence: Signal["evidence"];
  urgency: number;
  goalMatch: number;
  /** خطر مؤكد بدليل مباشر — يتجاوز العتبة. لا يُستخدم مع استنتاج. */
  riskCritical?: boolean;
  /**
   * مفاتيح ملاحظات تشرحها هذه الملاحظة وتغني عن تكرارها.
   * التركيب يعلو على أجزائه: من يقرأ "نافذة سيولة" لا يحتاج قراءة كل
   * تجديد على حدة. الأجزاء تنزل إلى الوارد ولا تختفي.
   */
  subsumes?: string[];
}

export interface Rule {
  code: string;
  domain: string;
  titleAr: string;
  /** يظهر للمستخدم كـ"لماذا الآن" — لا تعليق داخلي. */
  firesWhen: string;
  params: Record<string, number>;
  run(ctx: RuleContext): RuleFinding[];
}
