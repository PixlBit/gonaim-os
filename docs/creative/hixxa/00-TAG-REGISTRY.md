# HIXXA — REFERENCE TAG REGISTRY

> **الإصدار:** 2.0 — DIMENSIONAL HAND-PAINTED CINEMATIC UPDATE
> **المرجع الحاكم:** `HIXXA — CINEDANCE 30-SECOND PROMPT BIBLE v2.0` — القسم 5 (نظام توزيع الـReferences)، القسم 13 (Mood and Render Bible)، القسم 16 (Canon).
> **الوظيفة:** هذا الملف يحوّل عناصر المكتبة الموجودة فعليًا إلى **عقود سلطة** (Authority Contracts) قابلة للنسخ داخل أي برومبت.

القاعدة الأساسية من الـBible: **وظيفة أساسية واحدة لكل Element**، بصيغة:

```text
@ELEMENT controls the exact [PRIMARY SUBJECT]: [identity traits].
Preserve [critical details].
It does not control [explicit boundary].
```

لا يُكتب أي `@tag` داخل برومبت من دون سطر الحدود (`It does not control...`)، لأن العنصر بلا حدود يبدأ يتنافس على الكاميرا أو المكان أو الشخصية.

---

## 1. جدول العناصر المعتمدة

| Tag | النوع | السلطة (يتحكم في) | الحد (لا يتحكم في) | يُستخدم في |
|---|---|---|---|---|
| `@char_hixxa` | Character | هوية HIXXA الكاملة الواحدة: البشرة، النسب، الشعر المجعد، الملابس المعتمدة | زاوية الكاميرا، التكوين، تعبير الوجه اللحظي | كل الأفلام |
| `@hixa-face` | Character | وجه نفس HIXXA فقط، تعزيزًا | لا يصنع شخصًا ثانيًا ولا يفرض حجم لقطة | كل الأفلام |
| `@loc_location-room-1` | Location | معمار الغرفة، الخامات، الجغرافيا الدائمة، الشباك الحقيقي | زاوية الكاميرا وحركة الشوت | 01, 02, 03 |
| `@outdoor` | Location | الممر خارج باب HIXXA: الحوائط، الأرضية الخشبية، اللوحات، الباب المكتوب عليه HIXXA، ونهاية السلّم | الكاميرا، اتجاه الحركة، وقت اليوم داخل الغرفة | 04, 05, 06 |
| `@desk` | Prop | المكتب وأدواته الثابتة: سطح الخشب، الأدراج، أدوات الرسم | لا يضيف أجهزة أو واجهات لم تطلبها القصة | 01, 02, 03 |
| `@taplet` | Prop | الجسم المادي للّوح: الإطار الخشبي، السُمك، الحواف، الشاشة المطفأة | محتوى الشاشة | 01, 02 |
| `@tapletui` | Prop | واجهة `CHOOSE YOUR WEAPON` كاملة: الهيدر، الكروت، السهم | جسم اللوح نفسه ولا زاوية الكادر | 02 |
| `@tapletui0` | Prop | حالة الواجهة البديلة/الثانية أثناء التصفح | لا يستبدل `@tapletui` في نفس الفريم | 02 |
| `@prop_tapletpen` | Prop | القلم الرقمي: الطول، الخامة، الحلقة المعدنية، لون السن | لا يتحول إلى قلم رصاص عادي ولا يتضاعف | 01, 02 |
| `@stage1weapon` | Prop | سلاح المرحلة الأولى: مسدس مدمج بخطوط تركواز ووردية | حجم الكادر ولا وضعية الحمل | 02 |
| `@stage2weapon` | Prop | سلاح المرحلة الثانية: قاذف متوسط بأربع طلقات مستديرة | لا يظهر في نفس الفريم مع Stage 1 كسلاح مادي | 02 |
| `@stage3weapon` | Prop | سلاح المرحلة الثالثة: مدفع طويل ثقيل | لا يتجسد ماديًا في فيلم 02 — يبقى داخل الشاشة | 02 |
| `@weaponribbon` | Prop | عصا سوداء نحيلة بشريط أبيض واحد متصل | لا يصير سيفًا ولا يتضاعف الشريط | 03 |
| `@weaponbrute` | Prop | قفازان حجريان/خشبيان ثقيلان بأحزمة حديد | لا يصير درعًا ولا يطفو | 04 |
| `@weaponrazor` | Prop | رمحان نحيلان طويلان بسن دقيق | لا يصير سيفًا مزدوجًا ولا ثلاثة | 05 |
| `@ribbon` | Character | كائن أبيض مجنّح بألواح مصقولة، شكل Ribbon المتجسد | لا يستبدل `@cat` قبل لحظة التحول | 03 |
| `@brute` | Character | عملاق كتلي من خشب وحجر، مفاصل ظاهرة | لا يظهر داخل الغرفة | 04 |
| `@razor` | Character | كائن شوكي شاحب ذو امتداد حاد وأجنحة صلبة | لا يظهر قبل فيلم 05 | 05 |
| `@monster` | Character | الكائن الزهري/الأبيض الحاد، تصميم غير مكتمل الحافة | لا يُعامل كتنين ولا يستبدل `@dragon` | 04, 06 |
| `@dragon` | Character | هوية التنين الحي: النسب، الأجنحة، العنق الأفعواني | لا يظهر كورقة دراسات داخل العالم | 01, 05 |
| `@cat` | Character | القط التركوازي: النسب، العلامات، الطوق | لا يصير قطًا واقعيًا فوتوغرافيًا | 01, 03 |
| `@fox` | Character | الثعلب البرتقالي: النسب، الذيل، علامات الوجه | لا يتضاعف ولا يصير كلبًا | 01, 02, 06 |
| `@HEROS` | Character | الثلاثي البطولي مجتمعًا: الثعلب، القط، الكائن المجنّح | لا يضيف بطلًا رابعًا | 06 |
| `@EAR` | Prop | السماعة السلكية: سماعتان داخل الأذن وكابل واحد متصل | لا wireless pods ولا over-ear | 01 |
| `@bag` | Prop | الحقيبة الجلدية: الحجم، السير، الإبزيم، اللون | لا تتضاعف ولا تتحرك بلا لمس | 01 (حالة موروثة) |

---

## 2. تحذيرات تسمية

- `@taplet` و`@tapletui` و`@tapletui0` ثلاثة عناصر مختلفة وليست نسخًا: **الجسم / الواجهة / حالة الواجهة**. اذكر دائمًا أيها يحكم الشاشة وأيها يحكم الخشب.
- `@dragon` و`@monster` ليسا نفس الكائن. التنين مخلوق مكتمل التصميم؛ الـmonster تصميم غير مكتمل الحافة، وهذا الفرق هو أصل قصة فيلم 06.
- `@ribbon` / `@brute` / `@razor` شخصيات، و`@weaponribbon` / `@weaponbrute` / `@weaponrazor` أسلحتها. لا تخلط التاق في سطر واحد.
- `@HEROS` مرجع جماعي؛ عند الحاجة لبطل منفرد استخدم تاقه الخاص بدلًا منه.

---

## 3. إضافات Canon لهذه المجموعة

هذه ثوابت تخص أفلام السكتش الحي، وتُقرأ فوق Canon الغرفة الأصلي:

### 3.1 قانون المخلوق المرسوم — نسخة v2.0

المخلوق الحي **جسم مجسّم**، والفحم معالجة سطح فوقه؛ ليس رسمة واقفة على الحافة.

```text
The living sketches are volumetric creatures, not drawings standing upright:
real skeletal structure, rounded muscle mass, modeled facial planes and believable weight.
Their surfaces carry a hand-painted charcoal treatment — brushed graphite shading,
softly drawn contour edges and a faint pigment grain that follows the form in three
dimensions instead of sitting flat on top of it.
They are fully opaque, they occlude what is behind them, they cast stable contact shadows
and they hold their volume from every angle.
They never glow, never emit particles, are never translucent holograms
and never flatten into paper cutouts.
```

هذا القانون يحمي من خطأين متعاكسين معًا: تحويل المخلوق إلى تأثير نيون/هولوجرام من ناحية، وتسطيحه إلى قصاصة ورق 2D من الناحية الأخرى — والثاني هو الخطر الأكبر بعد تحديث v2.0.

### 3.2 مقاييس ثابتة

| الكائن | الطول/الارتفاع المعتمد | مرجع المقارنة |
|---|---|---|
| HIXXA | ~165 سم | الأصل |
| `@fox` | ~35 سم عند الكتف | يقف على المكتب بلا ازدحام |
| `@cat` | ~30 سم عند الكتف | نفس مساحة المكتب |
| `@dragon` | جسم ~160 سم، باع جناحي ~120 سم | يلتف حول عارضة السقف |
| `@ribbon` | ~110 سم واقفًا | أقصر من HIXXA بوضوح |
| `@brute` | ~160 سم وكتلة عريضة | بعرض الممر تقريبًا |
| `@razor` | ~140 سم وامتداد شوكي ~200 سم | يملأ ارتفاع الممر |
| `@monster` | ~220 سم طولًا | أضخم من كل الأبطال |

### 3.3 ضوء المكانين

```text
ROOM: the real window beside the desk is the dominant warm late-afternoon source, world-right.
Its world direction, color temperature, exposure, shadow placement and time of day remain
unchanged across every angle. Warm directional light wraps her curls, cheek planes, hands and
clothing folds, and rakes across the desk wood so its grain reads as relief rather than pattern.
There is no mirror in this room.

CORRIDOR: one warm ceiling fixture near HIXXA's door is the dominant source at the near end;
a cooler daylight leak arrives from the stairwell at the far end.
The world direction, color temperature, exposure and time of day of both remain unchanged
across every angle. The warm key sculpts her cheek planes and curls at the near end while
raking light along the floorboards holds the corridor's depth readable from every angle.
```

في الحالتين: ظل اتصال ثابت تحت كل جسم ملامس، ظل موجّه لين ينحت الحجم من دون سحق تفاصيل الوجه، وatmospheric perspective مضبوط يحفظ العمق.

### 3.4 أعداد مقفولة افتراضيًا

```text
Exactly one HIXXA.
Exactly one fox, one cat, one dragon.
Exactly one weapon of the chosen stage.
One wired earbud set with one continuous cable.
Exactly one small red pencil in her curls.
```

### 3.5 عقد المود الملزم

هذا البلوك يُنسخ حرفيًا في كل فيلم تحت عنوان `MOOD AND RENDER CONTRACT`، ويُملأ سطر الخامات وحده حسب المشهد:

```text
Preserve the established HIXXA dimensional hand-painted cinematic animation language.

The image is fully constructed in three-dimensional space: volumetric characters,
modeled facial planes, rounded body forms, dimensional architecture, real perspective,
physical occlusion, natural parallax and clear foreground-to-background separation.

Render every character and object with convincing sculptural volume comparable to
high-end 3D animation, while treating every visible surface through controlled
hand-painted illustration: clean illustrated shapes, softly brushed shading,
painterly color transitions, subtly drawn edges, tactile material variation and
restrained authored texture.

[SCENE MATERIAL LIST] remain materially distinct and physically dimensional.

The result feels like a richly hand-painted cinematic frame occupying real
three-dimensional space: never flat 2D, never a paper cutout, never photoreal live
action and never glossy plastic or toy-like CGI.

Maintain stable facial volume, eye size, curl mass, body proportions, wardrobe
construction and material response across every lens and angle.
```

### 3.6 جمل العمق المحلية

تُستخدم **عند الحاجة فقط** داخل الشوت الذي فيه حركة كاميرا أو ماكرو أو بورتريه، ولا تُنسخ الثلاثة في كل شوت:

| الحالة | الجملة |
|---|---|
| حركة كاميرا | `The dimensional camera move reveals restrained parallax between [A], [B] and [C] without flattening the image.` |
| ماكرو / إنسرت | `The macro perspective preserves real surface relief and tactile separation between [A], [B] and [C].` |
| بورتريه | `Keep the face fully dimensional through stable cheek volume, nose projection, jaw structure, eyelid depth and natural light wrapping.` |

---

## 4. بلوك جاهز للنسخ

```text
REFERENCE ASSIGNMENTS

@loc_location-room-1 controls the exact room architecture, permanent geography,
materials and the real window. It does not control the camera angle.

@char_hixxa controls HIXXA's exact single full-body identity, skin tone,
body proportions, curly hairstyle and established wardrobe.

@hixa-face reinforces only the face of that same single HIXXA.
It never creates a second person.

@desk controls the exact desk surface, wood grain and permanent tools.
It does not introduce any additional device or interface.

@[CREATURE] controls the exact identity, proportions and markings of that creature.
It never appears as a reference sheet, poster or drawn page inside the world.

@[WEAPON] controls the exact weapon identity, dimensions, materials and scale.
It does not duplicate and does not change type between shots.
```
