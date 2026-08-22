# ADR-0006 — لا أسرار في المتصفح

- **Status:** Accepted
- **Date:** 2026-08-22
- **Source:** Master Blueprint §28.5، §30.2، §30.3

## السياق

ثلاث قنوات عميلة (PWA، Extension، Tauri لاحقًا) تحتاج كلها نتائج من Claude ومن
Google APIs. أسهل طريق — وأسوأه — هو وضع المفاتيح في العميل.

الـExtension أخطرها: كودها قابل للقراءة الكاملة من أي شخص يفتح `chrome-extension://`.

## القرار

**كل** نداء خارجي يمر عبر Cloudflare Worker. لا استثناء.

```text
PWA / Extension / Tauri
        │  (session cookie عبر Cloudflare Access)
        ▼
Cloudflare Worker  ──►  Claude API      (key = Worker secret)
        │            ──►  Google APIs    (refresh token مشفر في Supabase Vault)
        ▼
Supabase Postgres (RLS مفعّلة على كل جدول)
```

القواعد المُلزِمة:

1. مفتاح Claude في Worker secret فقط. لا يظهر في أي bundle.
2. `service_role` الخاص بـSupabase لا يصل إلى أي عميل — Supabase توثق التحذير صراحة ([Function Secrets](https://supabase.com/docs/guides/functions/secrets)).
3. Google refresh tokens مشفرة في [Supabase Vault](https://supabase.com/docs/guides/database/vault)، منفصلة عن جداول البيانات العادية.
4. Cloudflare Access يفحص كل طلب قبل وصوله إلى الـWorker ([Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)).
5. **Redaction تحدث في العميل قبل الإرسال، وتتكرر في الـWorker.** طبقتان — لأن الطبقة الأولى في الـExtension قابلة للتعطيل من متصفح مخترق.
6. اختبار CI يفشل البناء لو ظهر أي نمط مفتاح (`sk-`, `AIza`, `eyJ`) في `dist/`.

## النتائج

**إيجابية** — سطح الهجوم يتقلص إلى الـWorker. سحب صلاحية أو تدوير مفتاح يحدث في مكان واحد ويسري فورًا على كل القنوات.

**سلبية** — قفزة شبكة إضافية في كل نداء AI، والـWorker يصبح نقطة فشل واحدة. مقبول: الـlatency الغالب هو زمن النموذج نفسه، لا القفزة.

## البدائل المرفوضة

| البديل | سبب الرفض |
| --- | --- |
| مفتاح Claude في الـExtension | ينكشف لأي شخص يفتح ملفات الإضافة |
| `anon key` + RLS فقط بلا Worker | لا يحل مفتاح Claude، ولا يسمح بـredaction من جانب الخادم |
| BYO key يدخله المستخدم في الواجهة | يظل في `localStorage` — نفس الانكشاف بخطوة إضافية |
