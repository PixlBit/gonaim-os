# Tool Permission Matrix — GONAIM//OS

> **Source:** Master Blueprint §14.6، §30.1؛ Expansion §11، §12
> كل أداة يستطيع CORTEX استدعاءها مُعرَّفة هنا. **أداة غير مذكورة في هذا الملف
> غير موجودة** — الـWorker يرفض أي `tool_name` لا يطابق هذا السجل.

---

## 1. مستويات المخاطرة

| Risk tier | التعريف | التأكيد | سقف الاستقلال |
| --- | --- | --- | --- |
| `read` | قراءة metadata لمصدر مسموح | مرة عند الربط | L5 |
| `analyze` | إرسال محتوى محدد للنموذج | سياسة لكل folder/context | L4 |
| `draft` | صياغة نص دون إرسال | لا تأكيد | L4 |
| `write_reversible` | إنشاء شيء قابل للتراجع | أول مرة أو حسب القاعدة | L4 |
| `external_action` | إرسال/نشر/تقديم | **كل مرة** | **L3 — سقف صلب** |
| `destructive` | حذف/شراء/دفع | **تأكيد مزدوج صريح** | **L3 — سقف صلب** |

السقف الصلب مفروض في القاعدة نفسها (`hard_ceiling_on_dangerous_tools`)
ومُختبَر في `supabase/tests/0001_constraints_test.sql`. لا إعداد يرفعه.

---

## 2. السجل الكامل

### 2.1 ARCHIVIST — الذاكرة والأرشيف

| Tool | Risk | افتراضي | يصل إلى | لا يفعل |
| --- | --- | --- | --- | --- |
| `search_memory` | read | L5 | memories, entities | لا يقرأ `vaulted` |
| `get_entity_graph` | read | L5 | entities, relations | عمق ≤ 3 |
| `summarize_session` | analyze | L2 | events الجلسة | لا يكتب ذاكرة مباشرة |
| `propose_memory` | write_reversible | L2 | memory_candidates | **لا يكتب في `memories`** |
| `detect_duplicates` | read | L4 | assets metadata | لا يحذف |
| `backup_folder` | write_reversible | L4 | مجلد في allowlist | لا يمس المصدر |
| `merge_versions` | write_reversible | L2 | ملفات مشروع | يقترح فقط، لا ينفذ |

### 2.2 PRODUCER — المخرجات الإبداعية

| Tool | Risk | افتراضي | ملاحظة |
| --- | --- | --- | --- |
| `draft_creative_brief` | draft | L2 | مخرج نصي محلي |
| `build_reference_sheet` | draft | L2 | لا توليد صور تلقائي |
| `compare_versions` | analyze | L2 | يعرض الفرق، لا يختار |
| `draft_message` | draft | L2 | **لا إرسال** |

### 2.3 SCOUT — الفرص والمراقبة

| Tool | Risk | افتراضي | ملاحظة |
| --- | --- | --- | --- |
| `search_opportunities` | read | L2 | مصادر معتمدة فقط |
| `score_opportunity_fit` | analyze | L2 | يعرض النقص، لا يخفيه |
| `watch_product_price` | read | L4 | صفحة مثبتة فقط، لا scraping عدواني |
| `draft_application` | draft | L2 | **التقديم يدوي دائمًا** |
| `apply_to_job` | external_action | **L0 — معطّل** | لا يُفعَّل في MVP إطلاقًا |

### 2.4 CURATOR — التنظيم

| Tool | Risk | افتراضي |
| --- | --- | --- |
| `cluster_images` | analyze | L3 |
| `propose_collection` | write_reversible | L2 |
| `tag_asset` | write_reversible | L4 |
| `move_drive_file` | destructive | **L1 — اقتراح فقط** |

### 2.5 GUARDIAN — الحماية

| Tool | Risk | افتراضي | ملاحظة |
| --- | --- | --- | --- |
| `classify_sensitivity` | read | L5 | يعمل قبل كل تخزين |
| `redact_payload` | read | L5 | **لا يمكن تعطيله** |
| `audit_permissions` | read | L5 | يقترح إلغاء صلاحيات قديمة |
| `revoke_token` | destructive | L1 | يقترح؛ التنفيذ بيد غنيم |
| `activate_blackout` | write_reversible | L5 | الفعل الوحيد الذي يُنفَّذ فورًا بلا نقاش |

### 2.6 أدوات لا توجد

| غير موجودة | السبب |
| --- | --- |
| `send_email` / `send_message` | لا إرسال تلقائي — V1 كـL3 فقط |
| `purchase_item` | لا شراء، أبدًا |
| `post_to_social` | لا نشر |
| `delete_external_file` | الحذف بيد غنيم في المصدر |
| `read_all_messages` | لا قراءة شاملة للرسائل |
| `score_person` | لا تقييم بشر |
| `access_bank_account` | خارج النطاق |

---

## 3. تعريف الأداة — العقد الإلزامي

```yaml
name: draft_creative_brief
agent: producer
risk: draft
allowed_sources: [entities, memories, events]
max_sensitivity: private          # لا يرى sensitive أو vaulted
forbidden_actions: [send, publish, purchase, delete]
memory_scope: read_only
time_budget_ms: 20000
token_budget: 8000
daily_limit: 20
approval_rule: none               # draft لا يحتاج موافقة
audit: always
```

**سبعة حقول إلزامية** لأي أداة جديدة: `risk`, `allowed_sources`, `max_sensitivity`,
`forbidden_actions`, `time_budget_ms`, `approval_rule`, `audit`.
أداة بلا واحد منها = فشل بناء، لا تحذير.

---

## 4. بطاقة الموافقة

كل فعل يحتاج موافقة يظهر بهذا الشكل — **لا زر `Allow` مجرد**:

```text
PROPOSED ACTION
Agent:        SCOUT
Action:       Draft application for Senior Editor — Riyadh
Why:          91% role fit · Riyadh · portfolio match
Will access:  LinkedIn profile · 3 selected portfolio links
Will NOT do:  submit · send · share contact details
Evidence:     3 items — [open]
Expires:      in 24 hours

[Approve]  [Edit first]  [Reject]  [Never allow this action]
```

- `Will NOT do` **إلزامي**. الموافقة تحتاج معرفة الحد، لا النية فقط.
- كل فعل ينتهي بعد 24 ساعة. الموافقة المتأخرة ليست موافقة.
- `Never allow this action` ينشئ قاعدة دائمة، لا رفضًا لمرة واحدة.

---

## 5. التصعيد الإلزامي

يُرفَع الفعل لموافقة صريحة بغض النظر عن مستوى الاستقلال إذا:

1. لمس بيانات `sensitive` أو `vaulted`.
2. تعارض مع بند في `personal_constitution`.
3. تجاوز `daily_limit`.
4. كان أول استخدام لهذه الأداة على هذا المصدر.
5. تغيّر `source_health` منذ آخر موافقة.
6. الـconfidence خلف الفعل < 0.70.

**البند 2 لا يُصعَّد — يُوقَف.** الدستور الشخصي أعلى من أي Goal أو Agent (Expansion §2.1)،
وGUARDIAN يرفض الفعل ويشرح البند المخالف.

---

## 6. الحالة الافتراضية عند التثبيت

| النطاق | المستوى |
| --- | --- |
| ARCHIVIST | L2 |
| PRODUCER | L2 |
| CURATOR | L2 |
| SCOUT | L1 |
| Money (كل الأدوات) | **L0 — مرآة فقط** |
| Social / Communication | **L0 — مرآة فقط** |
| GUARDIAN | L5 (حماية فقط، لا فعل خارجي) |

الترقية تحدث بفعل بشري في Control Room، ولا يستطيع النظام اقتراحها على نفسه.
