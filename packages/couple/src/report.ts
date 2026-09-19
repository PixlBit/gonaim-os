import type { PersonKey, Space } from "./types.js";
import type { Report } from "./analytics.js";
import { analyze } from "./analytics.js";
import { attend } from "./attention.js";
import { forecast, heartbeat, type Forecast, type Heartbeat } from "./rhythm.js";
import { nightPlan, type NightPlan } from "./night.js";
import { onThisDay, nextAnniversary, type OnThisDay } from "./moment.js";
import { syncReport, type SyncReport } from "./sync.js";

/**
 * التقرير الكامل — ما يستهلكه الخادم في كل طلب.
 *
 * الترتيب مقصود: الأرقام أولًا، ثم الطبقات التي تُبنى عليها (الأسابيع
 * الجاية تحتاج سرعة الإنجاز)، ثم **الحكم** أخيرًا — لأن ما يستحق المقاطعة
 * لا يُعرف إلا بعد أن يُعرف كل شيء آخر.
 *
 * وكله يُحسب في كل طلب. المساحة لاثنين، والحساب كله أقل من ميلي ثانية،
 * وثمن التخزين المؤقت أغلى: رقم محفوظ يصير كذبة عند أول تعديل.
 */
export interface FullReport extends Report {
  sync: SyncReport;
  forecast: Forecast;
  heartbeat: Heartbeat;
  /** ليلة مقترحة بدليل — أو `null` حين لا دليل. */
  night: NightPlan | null;
  /** ذكريات وقعت في مثل هذا اليوم من سنة ماضية. */
  onThisDay: OnThisDay[];
  /** ذكرى سنوية تقترب خلال أسبوع. */
  anniversary: ReturnType<typeof nextAnniversary>;
}

export function report(space: Space, todayStr: string, viewer: PersonKey): FullReport {
  const base = analyze(space, todayStr, viewer);
  const depth = {
    sync: syncReport(space),
    forecast: forecast(space, todayStr, base.missions.velocity),
    heartbeat: heartbeat(space, todayStr),
  };
  return {
    ...base,
    ...depth,
    // بعد العمق لا قبله: الليلة تُبنى على التوقّع والنبض معًا
    night: nightPlan(space, todayStr, viewer, depth),
    onThisDay: onThisDay(space, todayStr),
    anniversary: nextAnniversary(space, todayStr),
    attention: attend(space, base, viewer, depth),
  };
}
