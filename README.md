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

## حالة المستودع

المرحلة الحالية هي **المخرجات السبعة** التي يشترطها الـMaster Blueprint §42
قبل كتابة أي production code:

| # | المخرج | الملف |
| --- | --- | --- |
| 1 | Architecture decision records | [`docs/architecture/adr/`](docs/architecture/adr/) — ٩ قرارات |
| 2 | Data sensitivity map | [`docs/security/data-sensitivity-map.md`](docs/security/data-sensitivity-map.md) |
| 3 | Event taxonomy | [`docs/architecture/event-taxonomy.md`](docs/architecture/event-taxonomy.md) |
| 4 | Database schema | [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — مطبَّقة ومختبَرة |
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
