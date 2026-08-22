# ADR-0001 — شكل المنصة

- **Status:** Accepted
- **Date:** 2026-08-22
- **Source:** Master Blueprint §1، §11، §28

## السياق

النظام يحتاج ثلاث قدرات متعارضة في متطلباتها:

1. واجهة كثيفة سينمائية تتطور بسرعة وتُفتح من أكثر من جهاز موثوق.
2. رؤية مستمرة لنشاط التصفح — الـIntent الحقيقي يظهر في المتصفح، لا في التطبيق.
3. رؤية مجلدات Windows وملفات المشاريع (After Effects / Premiere / ComfyUI outputs).

لا توجد تقنية واحدة تغطي الثلاثة بكفاءة. الويب لا يقرأ نظام الملفات باستمرار ولا يرى
تبويبات المتصفح. تطبيق Desktop كامل يبطئ التطوير ويحبس الوصول في جهاز واحد.

## القرار

نبني **ثلاث قطع منفصلة تشترك في نفس الـdomain layer**:

| القطعة | التقنية | الدور | المرحلة |
| --- | --- | --- | --- |
| `apps/web` | React + TS + Vite، مثبتة كـPWA | الواجهة الكاملة والعقل | MVP |
| `apps/extension` | Manifest V3 + Side Panel API | حاسة الويب (LENS) | MVP |
| `apps/desktop` | Tauri 2 | حاسة الملفات المحلية | V2 |

المرجع: [MDN — PWA installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)،
[Tauri Capabilities](https://v2.tauri.app/security/capabilities/)،
[Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel).

الواجهة تُصمم لكثافة Desktop حقيقية (32" 4K) وتظل صالحة على 1440p. **ليست** Mobile-first.
الموبايل يدخل لاحقًا كـCapture فقط عبر Telegram bot، لا كنسخة مصغرة من الشاشة.

## النتائج

**إيجابية**
- قاعدة كود واحدة للواجهة، تُعاد داخل Tauri لاحقًا بلا إعادة كتابة.
- كل حاسة تُطفأ منفردة — Blackout للمتصفح لا يعطل الويب.
- التحديث فوري للـPWA دون دورة توزيع تطبيق.

**سلبية / تكلفة مقبولة**
- ثلاث قنوات صلاحيات منفصلة يجب اختبارها منفردة ومجتمعة.
- الـExtension تحتاج مراجعة متجر عند كل تحديث بصلاحيات جديدة.
- حالة "المستخدم فتح الـPWA لكن الـExtension مطفأة" حالة أولى الدرجة، لا حالة خطأ.

## البدائل المرفوضة

| البديل | سبب الرفض |
| --- | --- |
| Web app فقط | لا يرى المتصفح ولا الملفات — يتحول لـNotion بلون أسود |
| Electron/Tauri فقط من البداية | يبطئ التطوير، ويحبس الوصول في جهاز واحد، ولا يحل رؤية المتصفح أصلًا |
| Native mobile أولًا | غنيم يعمل على 4K desktop؛ الموبايل ليس مكان العمل الحقيقي |
