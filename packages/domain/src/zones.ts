import { z } from "zod";

/**
 * مناطق الحساسية. الترتيب هنا ملزم: كل منطقة أضيق مما قبلها.
 * Source: docs/security/data-sensitivity-map.md §1
 */
export const SensitivityZone = z.enum([
  "open",
  "private",
  "sensitive",
  "vaulted",
  "ephemeral",
  "never_observe",
]);
export type SensitivityZone = z.infer<typeof SensitivityZone>;

/** ما الذي يجوز أن يغادر الجهاز في كل منطقة. */
const CLOUD_ELIGIBLE: Record<SensitivityZone, "full" | "redacted_summary" | "never"> = {
  open: "full",
  private: "full",
  sensitive: "redacted_summary",
  vaulted: "never",
  ephemeral: "never",
  never_observe: "never",
};

export function mayLeaveDevice(zone: SensitivityZone): boolean {
  return CLOUD_ELIGIBLE[zone] !== "never";
}

/**
 * ADR-0005: لا embedding سحابي للمناطق الحساسة. مفروض أيضًا كقيد في القاعدة
 * (`sensitive_has_no_cloud_embedding`) — هذه الدالة تمنع الوصول إلى القيد أصلًا.
 */
export function mayEmbedInCloud(zone: SensitivityZone): boolean {
  return zone === "open" || zone === "private";
}

/** عند الشك، الأضيق يفوز. تُستخدم عند دمج مصادر متعددة في حزمة سياق واحدة. */
export function strictest(...zones: SensitivityZone[]): SensitivityZone {
  const order = SensitivityZone.options;
  return zones.reduce((worst, z) =>
    order.indexOf(z) > order.indexOf(worst) ? z : worst,
  "open" as SensitivityZone);
}
