# Wireframe Inventory — GONAIM//OS

> **Source:** Master Blueprint §8، §9، §10، §25؛ Expansion §19، §31–§42
> جرد الشاشات: ما يُبنى، بأي أولوية، وما الحالات التي **يجب** أن تُصمَّم لكل شاشة.

---

## 1. الهيكل الثابت — Desktop Shell

| المنطقة | المقاس | المحتوى |
| --- | --- | --- |
| Left Rail | 72px | تنقل بالأيقونات، Label عند Hover |
| Top Signal Bar | 52px | الاتصال · وضع المراقبة · آخر Sync · Timecode · **Blackout** |
| Main Stage | مرن | العالم المفتوح |
| Right Intelligence Drawer | 360–440px | HANDLER BRIEF — CORTEX والتفسير والمصدر والفعل |
| Bottom Time Strip | 44–72px | THE TAIL — لا تظهر في كل شاشة |
| Command Field | overlay | `Ctrl+Space` |

**الكثافة:** مصممة لـ32" 4K. عرض المحتوى ديناميكي — **ممنوع** عمود 1280px ثابت
في منتصف شاشة ضخمة. وضعان: `Cinematic` و`Analytical`.

---

## 2. جرد الشاشات

الأولوية: **P0** = الشريحة الرأسية · **P1** = MVP · **P2** = V1 · **P3** = لاحقًا

| # | الشاشة | الاسم العملياتي | الأولوية | الحالة |
| --- | --- | --- | --- | --- |
| 01 | NOW | **LIVE FILE** | **P0** | مرجع مصوَّر متاح |
| 02 | Signals | **WATCH DESK** | **P0** | §9.3 |
| 03 | CORTEX Ask | — | **P0** | §13.1 |
| 04 | Quick Capture | **DEAD DROP** | **P0** | §24 |
| 05 | Control Room | **PERMISSION MAP** | **P0** | §30 |
| 06 | BLACKBOX | **ARCHIVE ZERO** | **P1** | §13.5 |
| 07 | ATLAS | **THE BOARD** | **P1** | §9.1 |
| 08 | LENS Side Panel | — | **P1** | مرجع مصوَّر متاح |
| 09 | VAULT | **EVIDENCE LOCKER** | P2 | §9.2 |
| 10 | Shadow Watch | **THE SHADOW** | P2 | مرجع مصوَّر متاح |
| 11 | DOSSIER | — | P2 | مرجع مصوَّر متاح |
| 12 | ASCENT | **RANK / CLEARANCE** | P2 | مرجع مصوَّر متاح |
| 13 | Time Mirror | **RECONSTRUCTION ROOM** | P2 | §9.5 |
| 14 | Dream Foundry | **CONCEPT LAB** | P2 | §9.7 |
| 15 | PATH | **OPERATIONS** | P3 | Expansion §7 |
| 16 | Future Branches | **WAR ROOM** | P3 | §9.8 |
| 17 | SANCTUM | **SAFEHOUSE** | P3 | Expansion §19 |
| 18 | PULSE | — | P3 | Expansion §9 |
| 19 | LEGACY | — | P3 | Expansion §18.6 |

---

## 3. تفصيل شاشات P0

### 01 — LIVE FILE (NOW)

**المرجع المصوَّر متاح.** ثلاثة أعمدة + شريط زمني.

| المنطقة | المحتوى |
| --- | --- |
| يسار — SENSE FEED | آخر Evidence من كل حاسة: Browser · Desktop · Cloud · Comms · Device. **آخر واحد فقط لكل حاسة**، لا سجل كامل |
| وسط — CURRENT OPERATION | الإطار الأساسي · Op ID · Timecode البدء · سطر واحد: "ما يظنه النظام يحدث" · الأدلة المتصلة |
| يمين — HANDLER BRIEF | What I saw · What it means · **What I did NOT access** · Confidence · **ONE move** · Permission needed |
| أسفل — THE TAIL | آخر 45 دقيقة، قابلة للـScrub |

**الحالات الإلزامية:**

| الحالة | ما يظهر |
| --- | --- |
| Cold start — لا بيانات | "لم أرَ شيئًا بعد" + طريق واضح للربط. **ليست شاشة خطأ** |
| Blackout نشط | كل الخطوط مطفأة · `LOCAL ONLY` · الـcaptures المحلية المعلقة معلنة |
| CORTEX صامت | `Nothing worth interrupting you for` — **حالة نجاح، لا فراغ** |
| سياق خاطئ | زر `Wrong context` بارز، وليس مخفيًا في قائمة |
| مصدر معطل | العقدة باقية بحالة `source_unavailable` + آخر بيانات معروفة وتاريخها |
| Reduced motion | نفس المحتوى، انتقالات فورية |

> **`What I did NOT access` ليس تفصيلًا تجميليًا.** هو نصف قيمة الشاشة —
> يحوّل النظام من مراقِب إلى شيء تحت السيطرة.

### 02 — WATCH DESK (Signals)

كل Signal يعرض ستة عناصر إلزامية:
`What happened` · `Why now` · `Source trace` · `Relevance` · `Suggested move` · `[Review] [Dismiss] [Never this type]`

- عمود جانبي هادئ: `You may have missed` — Digest، لا قائمة لا تنتهي.
- منطقة `Below signal threshold` تعرض ما لم يجتز الحد. **الشفافية عن الصمت جزء من الثقة.**
- الترتيب بالـ`relevance`، لا بالزمن.

**الحالات:** لا Signals (نجاح) · كلها مقروءة · الميزانية نفدت · بعد `Never this type`.

### 03 — CORTEX Ask

- `Ctrl+Space` من أي شاشة.
- كل إجابة تحمل **مصادر قابلة للفتح**، لا نصًا حرًا.
- ثلاث حالات ظاهرة: `Recalling` · `Thinking` · `Waiting approval`.
- **حالة `UNKNOWN` مصممة بوضوح** — النظام يعلن الفجوة بدل ملئها (§37.3).

### 04 — DEAD DROP (Capture)

`Ctrl+Shift+Space`. الهدف: **أقل من 5 ثوانٍ** (§38).

- نص · صورة · رابط · صوت.
- التصنيف مستنتج ومعروض للتعديل، لا مطلوب مسبقًا.
- يعمل offline ويُزامن لاحقًا — الحالة معلنة.

### 05 — PERMISSION MAP (Control Room)

**أهم شاشة في المنتج من ناحية الثقة.**

- مصفوفة: كل مصدر × الأربعة مفاتيح (observe / remember / infer / act).
- مستوى الاستقلال لكل أداة، مع السقف الصلب ظاهرًا بوضوح كحد لا يُتجاوز.
- Kill switches الستة في مكان واحد.
- Audit log قابل للبحث.
- `Export my mind` · `Proof of Forgetting`.

---

## 4. قواعد بصرية ملزمة

| القاعدة | المصدر |
| --- | --- |
| Accentان نشطان كحد أقصى في منطقة واحدة | §37.2 |
| كل Glitch له سبب دلالي (تناقض أو فقد مصدر) — 60–120ms | §26.2 |
| لا Confetti عند Level-up: white flash + yellow burn فقط | §19.3 |
| لا كرة CORTEX عملاقة | §9.10 |
| Reduced motion يقدم تجربة **كاملة**، لا منقوصة | §37.2 |
| الزخرفة لا تتداخل مع النص أبدًا | §37.2 |
| RTL/LTR داخل نفس البطاقة؛ الـIDs وأسماء الأدوات تبقى LTR | §25.4 |
| الصور: Virtualization + Progressive loading | §9.2 |

### الممنوعات

Matrix code · كتابة عشوائية سريعة · Radar يدور · Cards تطفو ·
Camera shake · Glitch مستمر · particle rain · spring bounce ·
Avatar ثلاثي الأبعاد · Crosshair فوق وجوه بشر.

---

## 5. Design Tokens

```css
--void-950:        #050606;   /* الخلفية */
--graphite-900:    #0B0E10;   /* Panels */
--steel-800:       #161B1E;   /* الحدود */
--bone-100:        #F1EEE6;   /* النص والحقيقة الموثقة */
--muted-400:       #899397;   /* Metadata غير نشطة */
--signal-cyan:     #38D7DF;   /* اتصال ومصدر وعلاقة */
--electric-yellow: #F2C94C;   /* قرار · Playhead · مسار مختار */
--alert-red:       #EF574E;   /* خطر · تناقض · رفض — نادر */
--success-green:   #35C78A;   /* تنفيذ ناجح فقط */

/* من Expansion §33 — تظهر لحظيًا، لا كـTheme */
--night-vision:    #5D9E72;   /* Sensor mode فقط */
--evidence-paper:  #B9AD91;   /* مستند أو ذاكرة أرشيفية نادرة */
```

**الأصفر هو هوية غنيم** — بدونه تصبح الشاشة زرقاء عامة.
الأحمر إشارة نادرة، لا لون زخرفي.

### الحركة

| النوع | المدة |
| --- | --- |
| Micro feedback | 100–160ms |
| Panel transition | 220–320ms |
| Module transition | 420–650ms |
| Memory recall | 650–900ms |
| Boot / Level-up | 1.2–1.8s — نادر فقط |
