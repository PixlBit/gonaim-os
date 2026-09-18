import type { Capsule, PersonKey, Space } from "./types.js";
import { today as todayOf } from "./dates.js";

/**
 * ما لا يُرسَل.
 *
 * الكبسولة وعد: "الرسالة دي متتقريش قبل يوم كذا". الوعد الذي تحرسه الواجهة
 * وحدها ليس وعدًا — من يفتح أدوات المتصفح يقرأ كل شيء. فالحجب يحدث هنا،
 * قبل أن تغادر البيانات الخادم: نص الكبسولة غير المفتوحة لا يُرسَل لغير
 * كاتبها، ويُستبدل بعلامة `sealed`.
 *
 * (الكاتب يرى نصه لأنه كتبه — إخفاؤه عنه يخفي معلومة يملكها بالفعل.)
 */
export function forViewer(space: Space, viewer: PersonKey, now: Date = new Date()): Space {
  const t = todayOf(now);
  let touched = false;
  const capsules = space.capsules.map((c): Capsule => {
    const readable = c.from === viewer || c.openAt <= t;
    if (readable) return c;
    touched = true;
    const { body: _body, ...rest } = c;
    return { ...rest, body: "", sealed: true };
  });
  return touched ? { ...space, capsules } : space;
}
