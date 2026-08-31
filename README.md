# GONAIM//OS

> **Personal Intelligence Operating System** — نظام تشغيل شخصي خاص
> **Owner:** Ahmed Gonaim / غنيم
> **Status:** Architecture phase — لا كود إنتاج بعد

---

## ما هذا

نسخة رقمية واعية من حياة غنيم: ترى الإشارات المسموح بها، تتذكر سياقها بمصدره،
تربطها ببعضها، وتقترح ما يستحق فعله الآن — داخل حدود يختارها غنيم بنفسه.

**ما ليس هو:** Dashboard · To-do app · Journal · Notion · روبوت يرسل أو يشتري أو يحذف.

```text
GONAIM//OS = Private Web OS + Browser Companion + Cloud Intelligence
             + Optional Windows Companion
```

---

## التشغيل

```bash
npm ci
cp .env.example .env          # اضبط DATABASE_URL و ANTHROPIC_API_KEY

createdb gonaim
npm run migrate               # هجرات مرتّبة، مرة واحدة، بمجموع تحقّق

npm run dev:api               # الخادم — المفتاح يعيش هنا وحده
npm run dev                   # الواجهة
```

التحقق الكامل: `npm run ci` — أنواع، ٦٦ اختبارًا، بناء، وفحص أسرار في المخرَج.
اختبارات القاعدة تحتاج `DATABASE_URL` وتُتخطّى بدونه.

---

## حالة المستودع

المرحلة الحالية هي **المخرجات السبعة** التي يشترطها الـMaster Blueprint §42
قبل كتابة أي production code:

| # | المخرج | الملف |
| --- | --- | --- |
| 1 | Architecture decision records | [`docs/architecture/adr/`](docs/architecture/adr/) — ٩ قرارات |
| 2 | Data sensitivity map | [`docs/security/data-sensitivity-map.md`](docs/security/data-sensitivity-map.md) |
| 3 | Event taxonomy | [`docs/architecture/event-taxonomy.md`](docs/architecture/event-taxonomy.md) |
| 4 | Database schema | [`supabase/migrations/`](supabase/migrations/) — مطبَّقة ومختبَرة، بمشغّل هجرات |
| 5 | Tool permission matrix | [`docs/security/tool-permission-matrix.md`](docs/security/tool-permission-matrix.md) |
| 6 | Wireframe inventory | [`docs/design/wireframe-inventory.md`](docs/design/wireframe-inventory.md) |
| 7 | Vertical slice plan | [`docs/product/vertical-slice-plan.md`](docs/product/vertical-slice-plan.md) |

**المصدر:** [`docs/product/GONAIM_OS_MASTER_BLUEPRINT.md`](docs/product/GONAIM_OS_MASTER_BLUEPRINT.md)
و[`docs/product/GONAIM_OS_FUTURE_EXPANSION_V2.md`](docs/product/GONAIM_OS_FUTURE_EXPANSION_V2.md).

---

## المخطط مُختبَر، لا مكتوب فقط

الـschema ليست وثيقة — هي قيود مفروضة في القاعدة ومُثبتة باختبار:

```bash
createdb gonaim_test
psql -v ON_ERROR_STOP=1 -d gonaim_test -f supabase/migrations/0001_init.sql
psql -d gonaim_test -f supabase/tests/0001_constraints_test.sql
# المتوقع: ٩ رفض · ٤ قبول
```

ما تفرضه القاعدة نفسها — لا كود التطبيق ولا نداء نموذج يستطيع تجاوزه:

- ذاكرة بلا مصدر **مستحيلة** (`must_bind_something`)
- `sensitive` / `vaulted` لا يُولَّد لهما embedding سحابي (`sensitive_has_no_cloud_embedding`)
- فعل خارجي أو مدمر لا يتجاوز L3 مهما كان الإعداد (`hard_ceiling_on_dangerous_tools`)
- الملاحظة المباشرة ليست احتمالًا، والاستنتاج لا يكون بلا ثقة
- نفس الحدث لا يُسجَّل مرتين (`fingerprint`)
- RLS مفعّلة **و**مفروضة (`force`) على كل جدول

---

## الطبقات الثلاث

```text
SENSES   →  Browser · Drive · Telegram · Desktop لاحقًا
MEMORY   →  Nodes · Events · Sources · Relations · Confidence · Retention
JUDGMENT →  CORTEX: متى يصمت · متى يقترح · متى يحتاج موافقة
```

الحكم في §43: لو نجحت الطبقات الثلاث، تتحول الواجهات التخيلية من صور جميلة
إلى نظام شخصي حقيقي. ولو بدأ البناء من الأنيميشن قبل نموذج الذاكرة والأحداث،
يخرج Demo جميل بلا عقل.

---

## ما هو مبنيّ الآن

| الحزمة | الدور |
| --- | --- |
| `packages/domain` | الأنواع، مناطق الحساسية، تمييز العدد العربي |
| `packages/ingest` | إشارات الهاتف → أحداث، بحدود مفروضة |
| `packages/security` | التنقيح — طبقتان، لا يُبطَّل بإعداد |
| `packages/rules` | ثماني قواعد حتمية + بوابة التسجيل + ميزانية المقاطعة |
| `packages/intake` | تطبيع، حل تواريخ، استخلاص، بوابة ربط المصدر |
| `packages/db` | مشغّل هجرات، حفظ، قراءة، سجل تدقيق، تصدير |
| `apps/api` | بوابة محلية — المفتاح لا يغادرها |
| `apps/web` | DOSSIER والمدخل |

---

## البيانات ملك غنيم

`Export my mind` يخرج عشرة ملفات في ثلاث صيغ: JSON لإعادة الاستيراد،
Markdown لقراءة بشرية بعد سنوات بلا أي أداة، وCSV للجداول.

وفيه قسم **«ما ليس في هذا التصدير»** — الملفات الأصلية تبقى في مصادرها
(ADR-0009)، والمفاتيح لا تُصدَّر أبدًا، وما نُقِّح عند الاستقبال غير موجود
أصلًا ليُصدَّر. تصدير يوحي بالاكتمال وهو ناقص أسوأ من ناقص معلَن.

والنسيان توأمه. `forget` يحذف فعلًا، ويخرج **إيصالًا** يقول ما حُذف وما بقي
ولماذا. وكلمة "نُسي" لا تظهر إلا إذا لم يبقَ أثر — وهذا نادر: سجل التدقيق
لا يُحذف (وإلا ضاع الدليل على أن الحذف حدث)، والأصل الخارجي خارج قدرة النظام
فيُسمّى ويُطلب منك فعل.

---

## الهاتف

آيفون عبر **Shortcuts** — بلا ماك ولا Xcode ولا App Store.
الدليل: [`docs/connectors/iphone-shortcuts.md`](docs/connectors/iphone-shortcuts.md).

الحد الحاكم: نص الرسائل `never_observe` في وثيقتك، ورسالتك تحمل كلام شخص لم
يوافق. فالنص يُنقَّح، يُستخلص منه التزامك أنت، ثم **يُسقَط**. المخزَّن رمز
ثابت للمرسل وطول ونعدّ ما نُقِّح — لا اسم ولا نص. ولا يوجد خيار "خزّنه كما هو".

---

## الخطوة التالية

**M0 — الأساس والصلاحيات** ([الخطة](docs/product/vertical-slice-plan.md#m0--الأساس-والصلاحيات--46-أيام)):
monorepo · Cloudflare Access · Worker gateway · طبقة الأمان · Audit log.

لا واجهة قبل أن تمر اختبارات RLS والـredaction وحدود الصلاحيات.

---

## الحدود

هذه ليست إعدادات — هي حدود المنتج:

❌ لا keylogging · لا اختراق حسابات · لا تتبع أشخاص آخرين · لا تسجيل سري ·
لا تقييم بشر · لا شراء أو دفع أو نشر أو إرسال تلقائي · لا تشخيص صحي ·
لا ذاكرة بلا مصدر · لا استنتاج يُعرض كحقيقة.

> **GONAIM//OS لا يجمع حياتك فقط. هو يريك الخيط الذي لم تكن شايفه بين أجزائها.**
