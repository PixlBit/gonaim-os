# ADR-0003 — Claude محرك تفكير، BLACKBOX هي الذاكرة

- **Status:** Accepted
- **Date:** 2026-08-22
- **Source:** Master Blueprint §13.2، §13.6، §13.7

## السياق

الإغراء المباشر: نرسل "كل حياة غنيم" في كل request ونترك النموذج يتصرف.
هذا يفشل لثلاثة أسباب متراكبة:

1. جودة الاستدعاء تنخفض كلما زاد السياق بلا انتقاء ([Context Windows](https://docs.anthropic.com/en/docs/build-with-claude/context-windows)).
2. التكلفة تتضاعف مع كل رسالة.
3. **الأخطر:** لو كانت الذاكرة داخل سياق النموذج، فلا يوجد مكان تُعرض فيه للمراجعة أو التصحيح أو الحذف — وهذا يهدم §5.3 (`Correct / Forget / Pin / Why do you know this?`).

## القرار

**المصدر الوحيد للحقيقة هو Postgres. Claude لا يخزن شيئًا.**

كل طلب يمر بـ`buildContextBundle()`:

```text
intent detection → retrieve (hybrid search, top-K + sensitivity filter)
  → redact → assemble bundle → call Claude → parse → log → (candidate memory?)
```

**ميزانية السياق لكل طلب** — سقوف صلبة، وليست إرشادية:

| القسم | السقف | ملاحظة |
| --- | --- | --- |
| Identity constants | ~800 tokens | ثابت، يدخل في cached prefix |
| Personal Constitution | ~600 tokens | ثابت، cached |
| Tool definitions | ~1,200 tokens | ثابت، cached |
| Recalled memories | 12 عنصرًا كحد أقصى | متغير، مرتّب بـhybrid score |
| Recent evidence | 8 عناصر | متغير |
| Active context | ~500 tokens | الحالة الحالية |

الثوابت الثلاثة الأولى تُوضع في **cached prompt prefix**
([Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching))
لتقليل التكلفة والـlatency في الطلبات المتكررة.

كل عنصر مسترجع يدخل الـbundle **ومعه `memory_id` و`source_uri` و`confidence`**.
لو استشهد CORTEX بمعلومة، الواجهة تستطيع فتح مصدرها — هذا شرط قبول في §37.3.

## النتائج

**إيجابية**
- `Export my mind` ممكن فعلًا: الذاكرة صفوف في قاعدة بيانات، لا أوزان في نموذج.
- تبديل النموذج لا يفقد الذاكرة (يمهّد لـ Expansion §25.2 — Model independence).
- كل إجابة قابلة للتتبع إلى مصدرها.

**سلبية**
- طبقة الاسترجاع تصبح أهم من الـprompt. Bug في الـranking = النظام يبدو غبيًا رغم أن النموذج ممتاز.
- تحتاج تقييمات (`tests/ai-evals`) للاسترجاع نفسه، لا لجودة اللغة فقط.

## البدائل المرفوضة

| البديل | سبب الرفض |
| --- | --- |
| ذاكرة داخل conversation state طويلة | لا مراجعة، لا حذف، لا مصدر، وتنهار عند تغيير النموذج |
| Fine-tuning على بيانات غنيم | الذاكرة تصبح غير قابلة للتصحيح أو النسيان — يخالف §5.3 مباشرة |
| RAG بلا فلترة sensitivity | يسرّب `vaulted` و`sensitive` إلى السحابة عبر التشابه الدلالي |
