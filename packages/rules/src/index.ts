export * from "./types.js";
export * from "./dates.js";
export * from "./engine.js";

import { renewalApproaching, creditUnderused, invoiceOverdue } from "./money.js";
import { revisitedRepeatedly, priceDropped, alreadyOwned } from "./wants.js";
import { obligationOverdue } from "./social.js";
import { cashWindow } from "./cross.js";
import type { Rule } from "./types.js";

/**
 * ترتيب التسجيل لا يؤثر على النتيجة — البوابة ترتب بالـrelevance.
 * لكن القاعدة الجامعة تُقيَّم أخيرًا لأنها تقرأ نفس البيانات مجمّعة.
 */
export const ALL_RULES: readonly Rule[] = [
  renewalApproaching,
  creditUnderused,
  invoiceOverdue,
  revisitedRepeatedly,
  priceDropped,
  alreadyOwned,
  obligationOverdue,
  cashWindow,
];

export {
  renewalApproaching, creditUnderused, invoiceOverdue,
  revisitedRepeatedly, priceDropped, alreadyOwned,
  obligationOverdue, cashWindow,
};
