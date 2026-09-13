# نشر استوديو نيو ثمامة

الموقع يعمل من مصدره مباشرة: صفحة واحدة وسكربتات ونماذج، بلا خطوة بناء.
أي استضافة ملفات ثابتة تكفي.

## الخيار الأول: Cloudflare Pages

الأسرع عالميًا، وأفضل تخزينًا مؤقتًا لملفات النماذج لأنها كبيرة وثابتة.

1. من لوحة Cloudflare: **Workers & Pages ← Create ← Pages ← Connect to Git**
2. اختر مستودع `PixlBit/gonaim-os` والفرع `claude/neo-thamama-3d-upgrade-pzts6t`
3. الإعدادات:
   - **Framework preset:** None
   - **Build command:** اتركه فارغًا
   - **Build output directory:** `projects/new-thumamah`
4. Save and Deploy

الرابط: `https://<اسم-المشروع>.pages.dev`

لربط نطاقك: **Custom domains ← Set up a domain**، مجانًا وبشهادة تلقائية.

## الخيار الثاني: GitHub Pages

بلا حساب طرف ثالث. سير العمل جاهز في `.github/workflows/thumamah-pages.yml`.

1. من إعدادات المستودع: **Settings ← Pages**
2. **Source:** اختر **GitHub Actions**
3. ادفع أي تعديل، أو شغّل السير يدويًا من تبويب Actions

الرابط: `https://pixlbit.github.io/gonaim-os/`

سير العمل يشغّل `tools/verify.cjs` قبل النشر، فلا يُنشر مخطط لا يجتاز
تحقّق الحدود والمساحات وتسلسل الرحلة.

وينشر معه `offline.html`: نسخة بملف واحد مكتفٍ بذاته لمن يريد عرضًا بلا
إنترنت — تُفتح بالضغط المزدوج، وتصلح للاجتماعات المغلقة وللتسليم على USB.

## الخيار الثالث: ملف واحد

```
node tools/build.cjs
```

ينتج `dist/index.html` يحمل كل شيء بداخله. أرسله كما هو.
حجمه كبير لأنه يحمل النماذج مضمَّنة، فيبطئ فتحه أول مرة — الاستضافة
أفضل للعميل، وهذا للحالات التي لا إنترنت فيها.
