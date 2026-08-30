# P01 — صحيان السلة / انسكاب الثلاثين كرة

**HIXXA R2V 01 — BASKET AWAKENING / THIRTY-BALL FLOOR SWARM**

| | |
|---|---|
| المسار | `SEEDANCE 2.5 — MULTI-REFERENCE R2V` |
| المدة | `8.00s` — **جيل واحد** |
| البناء | 4 شوتات · 3 قطعات · 16:9 · 24fps |
| التاقات | @char_hixxa · @hixa-face · @loc_location-room-1 · @desk · @basket · @bag · @EAR |

## مكانه في السلسلة

داخل من `B10-TIMELAPSE-AND-HERO-HOLD` (نايمة على الديسك والسلة في المرحلة الرابعة مليانة للحافة). خارج على: السلة مقلوبة فاضية والثلاثين كرة بتلف على الأرض.

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
- السلة في المرحلة الرابعة (`STAGE 4`) من `@basket` — مليانة للحافة بتاج فوقها.
- **ONE-BASKET WORLD LOCK** اتساب زي ما هو لأنه بيحل فشل حقيقي: السلة الفاضية في الرفرنس
  بتتنسخ كأنها سلة تانية. البلوك ده بيمنع ده صراحة.
- الموبايل ميّت على الشنطة، والسمّاعتين ساكتين على الديسك — ولا واحدة في ودنها.

### قرار السعة (مهم — اتطبّق على البَاك كله)

البَاك مبني على **بالظبط ثلاثين كرة** (كرة لكل رسمة اترمت) والسلة مليانة للحافة. بالمقاسات القديمة
(سلة 30×35 سم، كرة 7.5 سم) الثلاثين كرة بتملأ **46%** بس من السلة — يعني السلة كانت هتطلع نص فاضية
والرقم يكدّب الصورة.

الحل: الرقم ثلاثين رقم **قصة** مش رقم ديكور، فمنزّلناش الرقم — نزّلنا السلة:

| | قديم | جديد |
|---|---|---|
| السلة (عرض × ارتفاع) | 30 × 35 سم | **25 × 28 سم** |
| الكرة المكرمشة | 7.5 سم | **8 سم** |
| الكرة ÷ عرض السلة الداخلي | 0.25 | **0.32** |
| عدد الكرات للحافة | 65 | **30** |

الكرة فضلت أقل من ثلث عرض السلة (شرط §6E) وفي نفس الوقت الثلاثين بيملوا السلة للحافة ويعملوا التاج.
المقاس ده اتسجّل في الريجستري وفي الماستر §6B/§6E.

---

## البرومبت — انسخه كامل

```text
################################################################
HIXXA R2V 01 — BASKET AWAKENING / THIRTY-BALL FLOOR SWARM

################################################################

SEEDANCE 2.5 — MULTI-REFERENCE R2V — 8.0 SECONDS — 16:9 — 24 FPS

CONTROLLED FOUR-SHOT SEQUENCE — EXACTLY THREE DIRECT HARD CUTS
REAL-TIME MOTION — NO SLOW MOTION — NO SPEED RAMPS — NO VISUAL TRANSITIONS

################################################################
SCENE AND MODE
################################################################

Construct the starting shot from the assigned Elements. Do not use a first-frame image or last-frame image. This is a direct narrative continuation after HIXXA threw the dead phone onto the closed bag, drove herself through one final hysterical drawing montage, filled the basket completely and fell asleep with her head on her folded forearms.

Use exactly four coherent shots and three direct hard cuts. Begin in suspended exhaustion, escalate through tactile micro-movement, then release all existing crumpled papers onto the floor. Stop before the floor transforms or any portal opens.

################################################################
REFERENCE ASSIGNMENTS
################################################################

Use @char_hixxa for one exact HIXXA: identity, proportions, skin tone, sculpted curly high puff, wardrobe and anatomical left/right. Use @hixa-face only to reinforce the same single face.

Use @loc_location-room-1 for the exact attic bedroom/studio topology, window, shelf, bed, chair, floor, desk-to-bed geography, burgundy blanket, lighting and material relationships. Use @desk for the exact worn desk and established tool layout. Use @basket for one exact mesh basket fixed beside HIXXA's anatomical RIGHT side. Use @bag for the exact fully closed bag on the bed. @bag is the only authority for the bag itself — its shape, leather grain, stitching, flap, strap attachment, buckle and hardware; @loc_location-room-1 supplies only where it lies, and where the two disagree or the room reference is too soft to read a detail, @bag wins. Never simplify it into a generic bag shape. Use @EAR only for the two small old black wired earbuds and complete disconnected cable assembly lying inert on the desk; neither earbud is worn.

No inactive character, animal, weapon, tablet or outdoor reference influences this generation.

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

HIXXA is about 165 centimetres and her hand is the scale reference.

The mesh basket is knee-high beside her seated position, about 25 centimetres across the rim
and 28 tall. Each crumpled ball is about 8 centimetres — under a third of that inner width, and
small enough that three sit side by side across the base. At this size exactly thirty balls fill
the basket from base to rim and form the crown; the count and the capacity agree.

################################################################
ABSOLUTE ONE-BASKET WORLD LOCK — NON-NEGOTIABLE
################################################################

There is exactly one basket in the entire room and exactly one basket in the entire video. It is the single mesh basket identified by @basket. The empty basket visible in the @basket reference supplies design, mesh construction, wear, scale, orientation and original world position only; its empty reference-state must not be reproduced as an additional object.

At frame zero, place that same sole basket once—at its exact established original position beside HIXXA's anatomical RIGHT side—and override only its contents: it is already packed to the rim with exactly thirty crumpled-paper balls. Do not render the empty reference basket anywhere else. Do not keep an empty basket at the original position while generating a second full basket. Do not place another basket in the foreground, background, beneath the desk, beside the bed or outside the room.

Across every camera angle and every hard cut, preserve one continuous basket identity and one continuous world-space position. Screen position may change only through camera perspective. The same single full basket rocks, tips and releases its own thirty balls; only after those balls physically leave it does that very same basket become visibly empty on its side. This is a state change of one persistent object, never a swap, replacement, duplicate or second basket.

################################################################
STARTING CONTINUITY
################################################################

HIXXA sits at @desk with her forehead and cheek fully supported on both folded forearms. Her eyes are closed, shoulders released and breathing slow. Both ears are bare. One drawing tool rests in its established desk zone and one unfinished flat sheet remains on the drawing surface.

The one and only @basket is upright, fixed at the exact original basket-reference world position beside HIXXA's anatomical RIGHT side and completely full with exactly thirty ordinary inert crumpled-paper balls. The paper fills the basket from base to rim and forms one dense supported crown 5–8 centimeters above the rim. The basket shell retains its exact referenced scale and shape. No empty duplicate from the reference is present anywhere in the room.

The same dead black-screen phone lies flat on top of the fully closed @bag on the burgundy blanket. The two black earbuds and their complete disconnected cable assembly remain together on the desk, outside HIXXA's forearms and the paper path.

################################################################
SHOT TIMELINE
################################################################

SHOT 1 — 0.00–1.55 — HERO WIDE / FIRST TWITCH

24 mm rectilinear low wide from approximately 35 centimeters above the floor near the desk corner. Keep the full basket dominant in the lower foreground, HIXXA asleep at the desk in the midground and the bed with the closed bag and stationary phone readable behind her. Use a locked camera with only natural room parallax from breathing.

Hold the exhausted composition for a brief beat. One paper ball at the top of the basket crown compresses inward once and releases with a dry paper tick. It does not jump or change shape. HIXXA remains asleep. Every other prop stays still.

HARD CUT on the tiny paper recoil at 1.55.

SHOT 2 — 1.55–3.25 — BASKET MACRO / INTERNAL AWAKENING

85 mm compressed close shot at rim height. Frame the exact twitching ball, surrounding crown, mesh rim and a soft fragment of HIXXA in the background. Use one restrained 4% micro-push and a single focus transfer from the top ball to the mesh contact.

The same ball rotates a few degrees around its own crumpled axis. Two adjacent balls answer with irregular micro-movements. The response travels downward through the real paper pile: local compression, friction, tiny rebounds and mesh contact. The basket begins vibrating from internal paper motion while its base remains planted.

No paper levitates yet. No new paper appears. The phone, closed bag, earbuds, cable, furniture and sleeping HIXXA remain inert.

HARD CUT on the first audible mesh rattle at 3.25.

SHOT 3 — 3.25–5.30 — LOW SIDE / BASKET TIP AND RELEASE

28 mm rectilinear floor-level side shot on the established action-axis side. Frame the basket, HIXXA's chair legs and a broad area of open floor. Use a short camera-right track parallel to the desk front, then stop before impact.

The basket rocks twice on its lower rim under the shifting paper mass, tips toward the open floor and strikes once with believable lightweight metal momentum. It remains immediately beside its original world position; it does not teleport or slide across the room.

All thirty existing balls spill sequentially from the open rim. Each ball bounces and rolls independently with irregular rotation and real floor friction. The lower balls emerge last. The basket becomes physically empty in exact proportion to the spill.

HIXXA's shoulders tense at the metal impact but her head remains on her forearms.

HARD CUT as the final ball clears the rim at 5.30.

SHOT 4 — 5.30–8.00 — HIGH THREE-QUARTER / DENSE FLOOR SWARM

32 mm high three-quarter view from above the desk corner, not fully overhead. Keep HIXXA, chair, tipped empty basket and all floor geography readable. Use a restrained descending push that ends at chair-back height.

The thirty balls spread across the floor in a dense, clearly populated field around HIXXA and the chair. They do not settle into a neat ring. Front balls cross near the camera, middle balls populate both sides of the chair and rear balls remain visible beneath the desk and toward the bed-side floor. Preserve open air gaps between them so they remain individually readable.

Natural rolling slows—then every ball changes direction through one synchronized but physically staggered curve. The scattered field begins becoming one broad clockwise circulation around HIXXA. Complete only the first half-revolution in this prompt. The balls remain on the floor, rolling and spinning around their own crumpled axes; none levitates.

HIXXA lifts her head only a few centimeters at the new surrounding sound. Her eyes open toward the nearest moving ball while both forearms remain planted on the desk.

End with the tipped basket empty near its original location, exactly thirty balls densely distributed across the floor around HIXXA, and the first broad clockwise circulation clearly underway.

################################################################
PAPER AND OBJECT PHYSICS
################################################################

Exactly thirty balls exist from start to finish. No duplication, merging, disappearance or infinite generation.
Every ball remains ordinary crumpled cream drawing paper with wrinkles, graphite smudges and occasional restrained color fragments. No faces, eyes, mouths, limbs, wings, creatures or origami animals.
Exactly one basket exists. The full upright basket at the start and the empty tipped basket after the spill are the same persistent @basket at two consecutive physical states—not two baskets.
Never render a second basket, spare basket, background basket, empty reference-state copy, alternate container, wastebasket or basket-shaped shadow/reflection.
The sole basket shell never grows, shrinks, levitates, duplicates, swaps or relocates. It tips once and remains on its side beside its original floor position.
The floor remains a normal intact room surface. No graphite circle, crease, paper layer, aperture, vortex or black negative space appears yet.
@desk, chair, bed, bag, shelf and room architecture remain fixed.
The phone stays dead and motionless on the closed bag. The earbuds and cable stay inert on the desk.

################################################################
LIGHTING AND AUDIO
################################################################

Maintain the stable warm room lighting and incoming shadow direction. No electrical failure, color shift, glow or premature fantasy lighting.

Begin with room tone and HIXXA's breathing. Synchronize one dry paper tick, localized paper friction, increasing mesh rattle, one light metal-floor impact and thirty staggered rolling sounds. Let the rolling field develop a low rhythmic circular cadence. No dialogue, phone audio, narration, lyrics, captions or subtitles.

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

Skin, curls, plaid cotton, canvas apron, desk wood, cream paper fibre, graphite, woven wire
mesh and the room's painted plaster remain materially distinct and physically dimensional.
Each crumpled ball is a genuinely volumetric object with faceted relief, its own fold pattern
and its own contact shadow; balls resting together never repeat each other's creases.

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

HIXXA is still seated at the desk with her head lifted slightly and both forearms planted. @basket is empty, tipped on its side beside its original location. Exactly thirty paper balls densely cover the floor around her and have begun one broad clockwise circulation. The room floor is still intact and no paper iris has formed.

Only this one tipped basket exists in the outgoing state; there is no upright, full or empty duplicate remaining at the reference position or anywhere else in the room.

################################################################
AUDIO TIMELINE
################################################################

0.00–1.55: room tone and her slow sleeping breath, then one dry paper tick from the crown.
1.55–3.25: localized paper friction, small rebounds travelling down the pile, a rising mesh rattle.
3.25–5.30: the basket rocking on its lower rim, one light metal impact on the floor, then thirty staggered rolls beginning.
5.30–8.00: the rolling field settling into a low circular cadence, and her sharp inhale as she lifts her head.

Every sound begins only after its visible physical cause.
No dialogue, narration, lyrics, captions or subtitles.
```
