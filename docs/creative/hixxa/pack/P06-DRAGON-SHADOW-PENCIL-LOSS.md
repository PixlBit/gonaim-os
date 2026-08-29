# P06 — ظل التنين / ضياع القلم الأحمر / الإمساك / مظلة الأربع صفحات

**HIXXA R2V 06 — DRAGON SHADOW / RED-PENCIL LOSS / CATCH / FOUR-PANEL CANOPY**

| | |
|---|---|
| المسار | `SEEDANCE 2.5 — MULTI-REFERENCE R2V` |
| المدة | `8.00s` — **جيل واحد** |
| البناء | 4 شوتات · 3 قطعات · 16:9 · 24fps |
| التاقات | @char_hixxa · @hixa-face · @dragon |

## مكانه في السلسلة

داخل من `P05`. خارج على: القلم الأحمر بقى مظلة بأربع صفحات وهي متعلّقة بيه.

## اللي اتظبط

- استُبدل بلوك الستايل بتاعهم بالكامل بـ **MASTER VISUAL STYLE — TIER 2 (OPERATIVE)** تحت بانر
  `MOOD AND RENDER CONTRACT`: العالم مجسّم بالكامل، الوجوه منحوتة بأسطح مظللة، الشعر كُتَل قابلة
  للقراءة، ظل هجين (إضاءة فراغية + أشكال ظل مرسومة)، الرسم **على** الأجسام مش فلتر فوق الصورة،
  لا كونتور موحّد، والـ CRITICAL DISTINCTION: العالم مجسّم والرسومات مسطّحة.
- أُضيف بلوك **HANDS**: تشريح اليد الصحيح + آثار الألوان الجافة على الجلد فقط، والأظافر تفضل نضيفة
  بدون لون على صفيحة الظفر.
- أُضيف بلوك **SCALE** بمرساة نسبية (الشيء + مقارنته بحاجة في الكادر)، مش أبعاد مطلقة لوحدها.
- أُضيف **AUDIO TIMELINE** بنوافذ زمنية مطابقة لنوافذ الشوتات بالظبط.
- العناوين اتحوّلت لصيغة `SHOT n — xx.xx–yy.yy` بدل `0:xx–0:yy`، والبانرات اتوحّدت.
- البرومبت ده **جيل واحد** (`8.00s`) — الـ SHOT عناوين قَطْع جوّه الكليب، مش برومبتات منفصلة.
- `@dragon` هنا **ظل** بس — مش جسم مجسّم في الكادر. مثبّت عشان ما يطلعش تنين كامل.
- تسلسل القلم اتفصّل: بيطير من شعرها ← بتاخده بالإيد ← بيتفرد أربع صفحات ← بيشيلها.
- ⚠️ **تعارض متعمَّد مع `B07-CHASM-AND-PAPER-COLUMNS`**: البيتين الاتنين فيهم لحظة ضياع القلم.
  دول **بدايل**، مش متتاليين. شوف الملاحظة تحت.

---

## المظلة مثبّتة — قرار محسوم

**المظلة ليست اختيارية ولا تُحذف من هذا البرومبت.** الإمساك بالقلم ثم تحوّله إلى مظلة بأربع
صفحات هو حدث هذا المقطع كله، وشوتا 3–4 مبنيان عليه. أي تعديل لاحق يمسّ الشوتين دول يكسر المقطع.

### علاقته بـ `B07`

الاتنين **مش بدايل** — دول نصّ الحدث الواحد مقسوم على مقطعين، بترتيب:

| | `beats/B07-CHASM-AND-PAPER-COLUMNS.md` | `pack/P06` (هذا الملف) |
|---|---|---|
| الدور | **الفقد** | **الاستعادة** |
| اللي بيحصل | تتحشر بين العمودين، القلم يطير من شعرها، وتقع في فضاء مفتوح | تمسك القلم، فيتفرد أربع صفحات ويصير مظلة تشيلها |
| المظلة | **مافيش** — مشيلة صراحة بسطر `NO CANOPY IN THIS CLIP` | **موجودة**، وهي الذروة |

**الشيء الوحيد اللي تنتبه له عند التوليد بالترتيب:** شوتا 1–2 في هذا الملف يحملان فقدًا ثانيًا
للقلم (ظل التنين ثم انفلاته). لو وُلِّد `B07` قبله فالقلم فُقد مرة بالفعل، فولّد من `P06`
**شوتَي 3–4 وحدهما** — الدفعة بالقدم، والإمساك، والمظلة. أما لو استُعمل `P06` وحده فيُولَّد كاملًا
بشوتاته الأربعة كما هو.

---

## البرومبت — انسخه كامل

```text
################################################################
HIXXA R2V 06 — DRAGON SHADOW / RED-PENCIL LOSS / CATCH / FOUR-PANEL CANOPY

################################################################

SEEDANCE 2.5 — MULTI-REFERENCE R2V — 8.0 SECONDS — 16:9 — 24 FPS

CONTROLLED FOUR-SHOT SEQUENCE — EXACTLY THREE DIRECT HARD CUTS
REAL-TIME MOTION — NO SLOW MOTION — NO SPEED RAMPS — NO VISUAL TRANSITIONS

################################################################
SCENE AND MODE
################################################################

Construct the starting state from Elements and explicit continuity. Do not use first-frame or last-frame images. Use four coherent shots and exactly three cuts. The moving cast shadow triggers an evasive compression; a paper ridge removes only HIXXA's single red pencil; she performs one wall push, one lateral jump, one right-hand catch and one immediate mechanical four-panel canopy deployment.

################################################################
REFERENCE ASSIGNMENTS
################################################################

Use @char_hixxa and @hixa-face for one exact HIXXA and the exact small red pencil originally tucked into her curls. Use @dragon only to define the design language of the non-living cast shadow on the far wall, never a physical dragon.

################################################################
HANDS
################################################################

Her hands are a working artist's hands: five fingers with one opposing thumb, correct joint
count and proportion, natural knuckle relief and tendon lines, and grips that close with real
contact against what they hold.

Dried paint is worn into the skin from long working days — soft pale blue and cyan along the
sides of the thumb and across the finger pads, a little dusty pink, cream flecks over the
knuckles. It is matte, faded and absorbed, following the skin's own creases and sitting under
the shading rather than on top of it. The fingernails stay clean bare nail: no colour on the
nail plate. The stains live on skin only.

################################################################
SCALE
################################################################

HIXXA is about 165 centimetres and her body is the scale reference.
The red pencil is a short stub about as long as her index finger — the smallest object in frame
and the one the whole clip is about. The slot between the ridges is just wide enough for her
shoulders turned. Each canopy panel is a large cream sheet; four of them together open wider
than her shoulders but never as wide as the chasm.

################################################################
STARTING CONTINUITY
################################################################

HIXXA falls feet-first through one open torn-paper chasm. A huge asymmetric dragon-shaped shadow already lies across the far cream wall with one complete wing silhouette and one broken skeletal construction side. It is a cast shadow from fixed torn layers, not a creature.

The exact single red pencil remains tucked into HIXXA's curls. Exactly thirty crumpled-paper balls maintain several dense downward lanes. Both ears are bare; no cable, bag, tablet or weapon is present.

################################################################
CONTROLLED FOUR-SHOT TIMELINE
################################################################

SHOT 1 — 0.00–1.55 — SHADOW SWEEP

28 mm wide same-side descent from the shadow side of HIXXA. Camera tracks parallel without rotating around the fall axis.

Changing overlap between fixed torn-paper layers moves the dragon-shaped shadow across the far wall as HIXXA falls. Her eyes track the dark wing; the shadow remains flat, perspective-correct and wall-bound. The thirty-ball lanes preserve spacing.

HARD CUT at 1.55 through the moving shadow edge.

SHOT 2 — 1.55–3.30 — CLOSING SLOT / PENCIL RELEASE

35 mm close front three-quarter on the same axis side. Two compressed-paper ridges narrow ahead. HIXXA draws both knees upward, compacts her silhouette and turns one shoulder through the slot without touching her head.

As her curls clear the upper ridge, one folded edge catches only the exact red pencil and pulls it free. The pencil begins one readable end-over-end tumble approximately one meter ahead and camera-right. Her curls remain intact; no hair is pulled and no second pencil remains.

Her apron and overshirt clear the ridges and snap back into the gravity stream. Balls divide around the slot and rejoin.

MATCH CUT at 3.30 as the tumbling pencil crosses a cream ridge.

SHOT 3 — 3.30–5.45 — LEFT-SHOE PUSH / RIGHT-HAND CATCH

24 mm wide from slightly below. The single red pencil remains ahead on the same downward trajectory.

HIXXA plants her anatomical LEFT red high-top once against the camera-left compressed-paper ridge. The shoe compresses against the surface; her LEFT knee loads and drives one lateral jump camera-right while she continues descending. Her RIGHT arm reaches across the gap and her correct fingers close firmly around the middle of the same pencil at 5.10.

The LEFT shoe leaves the ridge immediately after the push. Only one plant, one jump and one catch occur.

HARD CUT at 5.45 on the caught pencil crossing camera.

SHOT 4 — 5.45–8.00 — IMMEDIATE FOUR-PANEL DEPLOYMENT

32 mm side three-quarter. Deployment begins at the exact catch impact with no pause, glow buildup or hidden replacement.

The red pencil telescopes only enough to become a load-bearing central handle while remaining unmistakably the same pencil. A compressed cream-paper collar at its upper tip opens. Exactly four connected cream-paper panels swing outward on visible folded hinges in a sequential cross pattern and mechanically lock into one broad canopy above HIXXA.

HIXXA adds her LEFT hand beneath the RIGHT on the same handle. Her shoulders absorb the sudden drag; body swings once and settles directly beneath the canopy. Downward speed reduces but never stops. The thirty balls bend into wider lanes around the canopy without collision, trapping or count change.

A smooth vertical black inkfall becomes visible ahead, occupying one side of the chasm rather than materializing beneath her.

################################################################
CAUSALITY AND OBJECT LOCKS
################################################################

Exactly one HIXXA, one red pencil and one canopy exist.
The pencil begins in her hair, leaves once, tumbles once, is caught once and becomes the only canopy.
Exactly four connected cream panels deploy from the pencil collar. No fifth panel, manufactured umbrella, metal ribs, separate handle or duplicate pencil.
No pencil remains in her curls while deployed.
The dragon remains a non-living cast shadow.
Exactly thirty paper balls persist and curve around the wider canopy.
No slow motion, floaty parachute behavior, repeated jump, repeated catch, liquid morph, glow, camera roll or axis reversal.

################################################################
LIGHTING AND AUDIO
################################################################

Keep the cast-shadow source geometrically consistent. Let cream panels catch designed warm highlights and cool graphic undersides, without neon rims.

Audio: falling wind, paper-ridge scrape, pencil release whistle, shoe compression, catch impact, four distinct hinge snaps and one canopy load thump. No animal roar, dialogue, narration, captions or subtitles.

################################################################
MOOD AND RENDER CONTRACT
################################################################

Premium stylized 3D animation finished as a moving hand-painted illustration. The world,
characters, props and camera are fully dimensional — real perspective, depth, spatial parallax,
sculpted anatomy and cinematic lens behavior — but the final image never reads as conventional
CGI.

Faces stay dimensional with modeled cheekbones, brows, nose, lips and jaw planes, shaded in
deliberate planes with painted tonal variation rather than smooth photoreal skin. Hair is built
from large readable sculpted locks, not individual strands. Shading is hybrid: dimensional
lighting plus deliberately designed graphic shadow shapes, with readable light planes and
selective hard shadow boundaries — never flat two-tone cel, never glossy PBR.

The painting exists ON the objects. Do not lay a paper grain, watercolor wash or canvas filter
over the image.

There is no uniform cartoon outline. Silhouettes read through value separation, painted edges
and dimensional lighting, with only selective drawn accents and dark graphic creases where
naturally motivated.

Skin, curls, plaid cotton, canvas apron, red high-top rubber, cream paper, painted pencil
lacquer and graphite remain materially distinct and physically dimensional.

CRITICAL DISTINCTION: the world is dimensional, the drawings are not. Every fox, cat and dragon
study exists only as flat ink and graphite bonded to a dimensional page — no thickness, no
volume, no lift, no shadow of its own — and none of them ever animates, detaches or becomes a
creature.

Maintain stable facial volume, eye size, curl mass, body proportions, wardrobe construction and
material response across every lens and angle.

Animation is authored pose to pose: strong silhouettes, clear anticipation, physical weight,
clean arcs and expressive facial acting — intentionally animated, never motion-captured or
mechanically interpolated. Fast actions may carry controlled pose compression, natural
directional blur and brief animation deformation; these are drawing craft inside the shot and
are never a speed ramp, slow motion, a blur transition across a cut, or a morph of any object.

Avoid photorealism, glossy or plastic CGI, waxy skin, game-render materials, flat 2D or cel
art, uniform outlines, watercolor or canvas overlays, muddy colour, airbrushed softness,
excessive bloom, unmotivated neon rim light and AI-smoothed faces.

################################################################
OUTGOING CONTINUITY
################################################################

HIXXA descends beneath one fully load-bearing four-panel cream canopy built around the same red-pencil handle. Both hands grip the handle. Exactly thirty balls curve around her in widened lanes. A smooth vertical black inkfall waits directly ahead.

################################################################
AUDIO TIMELINE
################################################################

0.00–1.55: falling air in a large paper space, dry layers sliding overhead.
1.55–3.30: the air tightening as the ridges narrow, then one small snag as the pencil leaves her hair.
3.30–5.45: a shoe compressing paper, one push-off, air, then a firm catch closing on wood.
5.45–8.00: four hinges releasing in sequence, panels snapping taut, and the drag loading against her arms.

Every sound begins only after its visible physical cause.
No dialogue, narration, lyrics, captions or subtitles.
```
