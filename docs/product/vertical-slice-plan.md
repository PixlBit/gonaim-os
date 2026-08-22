# Vertical Slice — خطة التنفيذ

> **Source:** Master Blueprint §33، §34، §35، §37، §42
> **الحكم الحاكم (§35):** *لو بدأ البناء من الأنيميشن قبل Memory/Event model،
> سيخرج Demo جميلًا لا عقلًا حقيقيًا.*
> لذلك الترتيب هنا يبدأ من الصلاحيات والأحداث، لا من الشاشات.

---

## 1. تعريف الشريحة

**سؤال واحد يجب أن يجيبه النظام من طرف إلى طرف:**

> غنيم يفتح ChatGPT ويبدأ حملة Paper World الثالثة.
> LENS يرى العنوان والرسالة بعد الإرسال. BLACKBOX يسترجع HIXXA وقواعد الاستمرارية
> ورفض الـidentity drift. CORTEX ينتظر حتى يظهر نقص حقيقي، ثم يقول جملة واحدة:
> *"أنت تبني عالمًا ثالثًا، ولغة الوحوش غير مثبتة."*
> زر واحد: `Build master reference brief`. PRODUCER يجهز الـBrief **ولا يرسل شيئًا**.

هذه الرحلة تلمس: حاسة → حدث → تصنيف → ذاكرة بمصدر → تسجيل → اقتراح → موافقة → تدقيق.
لو نجحت، الهيكل كله صحيح. لو فشلت، لا قيمة لأي شاشة إضافية.

---

## 2. المراحل

### M0 — الأساس والصلاحيات · 4–6 أيام

**قبل أي واجهة.**

- [ ] Monorepo (`apps/` · `packages/` · `workers/` · `supabase/`) — §36
- [ ] TypeScript strict · Zod على كل حد خارجي
- [ ] `supabase/migrations/0001_init.sql` مطبَّقة ✅ *(مكتملة ومختبَرة)*
- [ ] Cloudflare Access على الدومين
- [ ] Worker gateway — لا مفاتيح في أي عميل (ADR-0006)
- [ ] `packages/security`: redaction + تصنيف sensitivity + risk tiers
- [ ] Audit log يكتب من اليوم الأول

**قبول:** لا مفتاح في أي bundle (اختبار CI يفشل البناء) · RLS مُختبَرة بمستخدمين ·
كل جدول عليه `force row level security` · اختبار القيود يمر بـ٩ رفض و٤ قبول.

### M1 — الأحداث والذاكرة · 5–7 أيام

- [ ] `packages/domain`: مخططات الأحداث + الغلاف الموحد + fingerprinting
- [ ] Ingestion pipeline مع بوابة Blackout **أولًا** في السلسلة
- [ ] Memory Write Protocol — البوابات السبع (ADR-0004)
- [ ] Conflict Frames بدل الاستبدال الصامت
- [ ] Hybrid retrieval: keyword + vector + recency + pinned
- [ ] Purge receipts

**قبول:** لا ذاكرة بلا مصدر (مفروض في القاعدة ✅) · تناقض ينشئ Frame ولا يستبدل ·
Blackout يوقف الـingestion **فورًا** · `Forget` يخرج إيصالًا صادقًا.

### M2 — CORTEX · 4–6 أيام

- [ ] `buildContextBundle()` بميزانية سياق مفروضة (ADR-0003)
- [ ] Cached prompt prefix للثوابت
- [ ] Tool registry — الأداة غير المسجلة مرفوضة
- [ ] وضعا ASK و OBSERVE
- [ ] حالة `UNKNOWN` صريحة في المخرج
- [ ] `system.cortex.stayed_silent` كحدث حقيقي

**قبول:** كل إجابة تحمل `memory_id` و`source_uri` قابلين للفتح ·
لا يتجاوز السياق الميزانية · يقول UNKNOWN بدل الاختلاق (اختبار eval صريح).

### M3 — LIVE FILE + Capture · 5–7 أيام

- [ ] Desktop Shell بالمناطق الست
- [ ] Design tokens ولغة الحركة
- [ ] شاشة LIVE FILE بكل حالاتها الست
- [ ] Quick Capture < 5 ثوانٍ، يعمل offline
- [ ] Command field
- [ ] PWA + service worker

**قبول:** 55–60fps على 4K · Reduced motion كامل · Cold start ليس شاشة خطأ ·
`What I did NOT access` ظاهر بجانب كل استنتاج.

### M4 — LENS · 6–8 أيام

- [ ] Manifest V3 + Side Panel
- [ ] Optional permissions لكل domain — **لا `<all_urls>`**
- [ ] Ambient · Focus · Pause
- [ ] محوّلات ChatGPT/Claude: **بعد الإرسال فقط**
- [ ] Redaction محلي قبل أي إرسال
- [ ] مؤشر رؤية دائم

**قبول:** لا keystroke يغادر الصفحة (اختبار صريح) · تعطيل تلقائي على البنوك
وبوابات الدفع والوضع الخفي · Blackout من الـPWA يوقف الإضافة فورًا.

### M5 — Signals · 4–5 أيام

- [ ] محرك القواعد الحتمية **أولًا** (تجديد · فاتورة · تعارض نسخ · backup ناقص)
- [ ] الطبقة الدلالية بعده
- [ ] بوابة التسجيل + ميزانية المقاطعة (ADR-0008)
- [ ] Quiet Hours السياقية
- [ ] Signal Inbox + `Below signal threshold`
- [ ] حلقة الـfeedback الخمسة

**قبول:** لا اقتراح بلا Evidence قابل للفتح · الميزانية مفروضة فعلًا ·
`Useful/Wrong` يغيّر الترتيب **قابل للإثبات** · لا Interrupt من استنتاج بلا دليل قوي.

### M6 — التصليب · 3–4 أيام

- [ ] `tests/security`: RLS · redaction · حدود الصلاحيات · Blackout
- [ ] `tests/ai-evals`: دقة الاسترجاع · صدق UNKNOWN · معايرة الثقة
- [ ] `tests/e2e`: الرحلة الكاملة من §1
- [ ] Observability مع redaction (Sentry/OTel)
- [ ] `Export my mind`

**المجموع التقريبي: 5–7 أسابيع** لفرد واحد يستخدم AI coding بفاعلية.

---

## 3. ما هو **خارج** الشريحة

| مؤجَّل | إلى |
| --- | --- |
| Windows Companion | V2 — ADR-0001 |
| Gmail / Instagram / GitHub | بعد استقرار Drive و Telegram |
| ATLAS graph بصريًا | M7 |
| Time Mirror · Foundry · ASCENT · DOSSIER · Future Branches | بعد المرحلة الأساسية |
| Agent swarm متزامن | لا يوجد — الوكلاء Workers عند الحاجة |
| أي إرسال أو نشر أو شراء | لا يدخل MVP |
| بيانات صحية | اختياري ويدوي، لاحقًا |
| Embedding للمناطق الحساسة | V2 مع Windows Companion — ADR-0005 |

---

## 4. مؤشرات القبول النهائية

من §38 — هذه **معايير قبول**، لا طموحات:

| المؤشر | الهدف |
| --- | --- |
| Useful Signal Rate | ≥ 60% |
| False urgent alerts | < 2% |
| Memory answer with source | ≥ 95% |
| Capture | < 5 ثوانٍ |
| Frame rate على 4K | 55–60fps |

---

## 5. الترتيب الذي لا يُخالَف

```text
1. الصلاحيات وملكية البيانات
2. نموذج الأحداث
3. الذاكرة بمصادرها
4. LIVE FILE
5. Capture
6. Browser Ambient
7. تسجيل Signals
8. Drive و Telegram
9. Foundry و Atlas
10. وضع Co-pilot
11. الأفعال والوكلاء
12. Levels والمحاكاة
```

القفز إلى 4 قبل إتمام 1–3 هو الطريقة الوحيدة المضمونة لإفشال المشروع.
