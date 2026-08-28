# HX-DRAW-FOX-01 — THE FOX TAKES SHAPE

> **المدة:** 5 ثوانٍ (كانت 8) — **الشوتات:** لقطة واحدة متصلة — **القطعات:** صفر
> **المعيار:** CINEDANCE Bible v2.0 — Dimensional Hand-Painted Cinematic
> **المكان:** غرفة HIXXA، المكتب
> **التاقات:** `@loc_location-room-1` `@desk` `@char_hixxa` `@hixa-face` `@EAR` `@fox`
> **القوس الشعوري:** قياس الفراغ → أول تماس → بناء متصاعد → جناحان → رفع القلم
> **التسليم:** الحالة النهائية تُورَّث كما هي إلى `HX-DRAW-FOX-02`

---

## قرار الضغط من 8 إلى 5 ثوانٍ

النسخة الأصلية فيها **ست مراحل بناء** موزعة على 7.15 ثانية رسم فعلي. عند 5 ثوانٍ يتبقى **4.50 ثانية رسم**، أي أن الضغط الزمني وحده يعطي كل مرحلة أقل من 0.75 ثانية — وهذا تحت الحد الأدنى في القسم 10 من الـBible (الفعل الصغير الواضح 0.8–1.5 ثانية)، ونتيجته المباشرة هي الخطأ الذي تقفله بنفسك: خطوط تزحف وحدها لتلحق بالزمن.

فالحل كان **تقليل المراحل، لا تسريعها**:

| المرحلة | 8 ثوانٍ | 5 ثوانٍ |
|---|---|---|
| أول تماس | ✅ 0.80s | ✅ 0.50s |
| Gesture من الخطم للذيل | ✅ | ✅ 1.10s |
| إهليجيات الجمجمة والقفص والورك | ✅ | ✅ 0.95s |
| محاور الأرجل ودوائر المفاصل | ✅ | ✅ 0.90s |
| جذرا الجناحين والأعمدة | ✅ | ✅ 0.95s |
| الكونتور الخارجي | ✅ منفصل | مدمج مع رفع القلم 0.60s |
| خط منتصف الوجه، الأذنان، كتلة الذيل | ✅ منفصلة | **حُذفت كمراحل مستقلة** — الأذنان والخطم داخل الـgesture، وكتلة الذيل داخل الكونتور |
| بيت التأمل الأخير | ✅ 0.85s | **حُذف** — لا تتسع له 5 ثوانٍ، ويلتقطه FOX-02 من فريم التسليم |
| membrane guide-lines للجناح | ✅ | **حُذفت** — يبقى الجذر والعمود فقط |

الناتج ما زال **construction drawing كامل ومقروء** بجناحين، لكن بعدد ضربات أقل وأجرأ.

---

## ما اتصلح كمان

| المشكلة | التصحيح |
|---|---|
| **`@char_hixxa` و`@hixa-face` غير موجودين** — سطر «HIXXA: exact identity» نص حر بلا عنصر يحكمه | أُضيف العنصران بسلطة وحدود صريحة |
| حركة الكاميرا مصمَّمة لـ8 ثوانٍ (تبدأ من 70 سم) | البداية من **55 سم** حتى تكتمل نفس الحركة القوسية بسرعة طبيعية في 5 ثوانٍ |
| بلا `MOOD AND RENDER CONTRACT` ولا قسم إضاءة | القسمان مضافان بمعيار v2.0 |
| صوت في سطر واحد بلا توقيت | تايم لاين صوتي سببي |
| **تعارض محتمل خطير مع v2.0** — «الصورة مجسّمة أبدًا» مقابل «الرسمة مسطحة على الورقة» | فُصل صراحةً: **العالم مجسّم، والرسمة أثر جرافيت مسطح على سطح ورقة مجسّمة** |

**التوقيت:** 0.50 + 1.10 + 0.95 + 0.90 + 0.95 + 0.60 = **5.00** بالضبط.

> **قبل النسخ:** الصق مُعرّفَي `@char_hixxa` و`@hixa-face` من مكتبتك بنفس صيغة `@[name](uuid)` المستخدمة في باقي العناصر.

---

```text
################################################################
HX-DRAW-FOX-01 — THE FOX TAKES SHAPE
################################################################

SEEDANCE 2.5 — MULTI-REFERENCE R2V — 5.0 SECONDS — 16:9 — 24 FPS

CONTROLLED SINGLE-TAKE SEQUENCE — ONE CONTINUOUS SHOT — ZERO CUTS
REAL-TIME MOTION — NO SLOW MOTION — NO SPEED RAMPS — NO VISUAL TRANSITIONS

REFERENCE ASSIGNMENTS

Use @[loc_location-room-1](9f40a957-b4c1-400d-8cb4-12a8399ccb9a) strictly for the exact room
geography, architecture, materials, practical light and fixed background objects.
Release its original camera angle; it does not control the camera.

Use @[desk](089414cf-1c73-4963-a04c-0b101123c787) strictly for the exact desk construction,
proportions, surface material and existing prop layout.
No desk prop is added, removed or repositioned.

Use @char_hixxa for HIXXA's exact single full-body identity, skin tone, body proportions,
dense dark curls, layered wardrobe and the small red pencil secured in her hair.
Identity and wardrobe remain stable from every angle.
It does not control the camera angle, the shot size or her moment-to-moment expression.

Use @hixa-face to reinforce only the face of that same single HIXXA.
It never creates a second person.

Use @[EAR](449e8116-6279-4951-adf6-56a5f43a670b) only for the exact black wired earbuds.
HIXXA wears exactly one pair throughout, both buds in place, one physically continuous cable.
They never vanish, multiply or change design.

Use @[fox](98900fd0-3b3a-47b9-a9e9-401406dde49f) only for the fox's anatomy, proportions,
silhouette, facial design, tail and exact two-wing construction.
It controls the design of one drawing on paper only.
Do not import its turnaround grid, extra poses, labels, background or additional foxes.
Do not show the reference sheet itself.

HANDS

Her hands are a working artist's hands: five fingers with one opposing thumb, correct joint
count and proportion, natural knuckle relief and tendon lines, fingers resting in a soft
natural curl, and grips that close with real contact against what they hold.

Dried paint is worn into the skin from long working days — soft pale blue and cyan along the
sides of the thumb and across the finger pads, a little dusty pink, cream flecks over the
knuckles. It is matte, faded and absorbed, following the skin's own creases and sitting under
the shading rather than on top of it. The fingernails stay clean bare nail: no colour on the
nail plate. The stains live on skin only.

SCALE

HIXXA is about 165 centimetres and her hand is the scale reference; where a stated size and a
hand-relative anchor seem to disagree, the anchor wins.

One landscape sheet a little wider than her two hands set side by side.
The drawing pencil is full length; its tip clears her grip by about a palm's width.
The earbuds are tiny in-ear units, each smaller than the bowl of her ear.
The red pencil in her curls is a short stub about as long as her index finger.

SCENE STATE

HIXXA sits naturally at the desk inside the room, leaning over one landscape-oriented blank
cream sketch sheet centred in the clear working area. The room and desk remain recognisably
present throughout. Her anatomical right hand holds one ordinary dark graphite drawing pencil
taken from the desk; her left fingertips pin the sheet's upper edge.
The small red pencil stays in her curls and is never touched, used or duplicated.

The active sheet is completely blank at 0.00: no faint underdrawing, printed animal,
watermark or hidden image.

The sheet progresses through one continuous state:
[blank] → [single gesture line] → [gesture plus three mass ellipses]
→ [plus four leg axes] → [plus two wing roots and spars] → [plus a closed loose contour].
Nothing is ever erased, and no stage is skipped or reordered.

DRAWING TARGET

Create exactly one hand-drawn fox construction sketch in a readable three-quarter crouch:
muzzle toward the sheet's left edge, long tail sweeping toward the right edge, and exactly
two wings opening diagonally above the back. Match the fox reference in anatomy and wing
placement.

"Construction drawing" means a traditional flat graphite animator's under-drawing: gesture
spine, skull and rib-cage ellipses, centrelines, perspective axes, joint circles, wing spars
and loose searching contour scaffolding. It is not a digital mesh, glowing hologram, CGI wire
model or raised paper object.

################################################################
TIMELINE — ONE CONTINUOUS SHOT
################################################################

SHOT 01 — 0.00–5.00
32mm NATURAL RECTILINEAR PERSPECTIVE, one unbroken camera move, no cuts.

Frame zero already shows the camera 55 centimetres behind HIXXA's camera-right shoulder at
her seated eye height, wide enough to establish her profile, the earbuds and cable, the desk
and the recognisable room, with the blank sheet already in the lower frame.

CAMERA — ONE MOVE ONLY
As the pencil touches down, glide forward and descend in one smooth crescent over her right
shoulder, keeping her cheek, curls and earbud cable along the near frame edge while the page
grows dominant. Continue the same single physical move into a high oblique and ease to a stop
55 degrees above the sheet, with the full page, both hands and enough desk and room context
still visible. Never cross the drawing-hand axis, orbit, zoom, whip, cut or change lens.

The dimensional crescent move reveals restrained parallax between her cheek, curls, the
pencil, the sheet and the room behind her, and the page stays a physical surface on a
physical desk throughout the descent.

MOTION TIMELINE

0.00–0.50: her shoulders and breathing settle, her eyes measure the empty page, and the
graphite tip lowers into first contact. No mark exists before contact.

0.50–1.60: in one confident continuous stroke the right hand lays the gesture from muzzle
through spine to tail tip, the wrist leading and the forearm riding lightly on the desk.
The left hand keeps the sheet flat and stationary.

1.60–2.55: she adds the skull, rib-cage and hip ellipses in three separate quick passes,
each one landing on the gesture line already present.

2.55–3.45: she lays four leg axes with joint circles into the crouch, the pencil lifting
briefly between limbs.

3.45–4.40: she constructs exactly two wing roots and their spars, opening diagonally above
the back, drawn from root outward.

4.40–5.00: one loose searching pass closes the outer contour around the whole construction,
then the pencil lifts clear of the paper.

Every graphite segment appears only directly beneath the moving pencil tip, at the moment the
tip passes over that point. No line appears ahead of the tip, extends after it, or draws
itself while the tip is elsewhere. No shading, solid fill or erasing at any point.

End on a clean hold of the complete graphite construction drawing with the pencil lifted
above the fox's right wing spar, the left hand still pinning the sheet, the page orientation
unchanged and the camera stopped at its high oblique.

################################################################
PHYSICS AND PERFORMANCE
################################################################

All movement is grounded and human: real wrist-led drawing mechanics, the forearm riding on
the desk, believable pressure changes through each stroke and restrained micro-motion between
passes. Her performance is quiet and internal — measuring, committing, continuing — with no
theatrical gesture and no lip movement.

The sheet stays flat and stationary under the left fingertips and never slides, lifts or
curls. The pencil is a rigid wooden rod with a real tip that maintains contact pressure and
leaves fine graphite friction behind it. The earbud cable hangs in an elastic curve, sways
once with her shoulder settle and never becomes a rigid rod. Curls and sleeve fabric lag one
beat behind her motion and settle.

No object moves before direct contact or a visible physical force.

################################################################
MOOD AND RENDER CONTRACT
################################################################

Preserve the established HIXXA dimensional hand-painted cinematic animation language.

The image is fully constructed in three-dimensional space: volumetric characters,
modeled facial planes, rounded body forms, dimensional architecture, real perspective,
physical occlusion, natural parallax and clear foreground-to-background separation.

Render every character and object with convincing sculptural volume comparable to
high-end 3D animation, while treating every visible surface through controlled
hand-painted illustration: clean illustrated shapes, softly brushed shading,
painterly color transitions, subtly drawn edges, tactile material variation and
restrained authored texture.

Skin, curls, plaid cotton, canvas apron, desk wood, cream paper fibre, graphite and rubber
cable remain materially distinct and physically dimensional.

CRITICAL DISTINCTION: the world is dimensional, the drawing is not.
The room, HIXXA, the desk, her hands and the sheet itself all carry full sculptural volume,
perspective and contact shadow. The fox exists only as flat graphite pigment bonded to the
surface of that dimensional sheet: it has no thickness, no volume, no lift off the paper and
no shadow of its own. The paper may catch a faint tooth relief; the drawn lines never do.

The result feels like a richly hand-painted cinematic frame occupying real
three-dimensional space: never flat 2D, never a paper cutout, never photoreal live
action and never glossy plastic or toy-like CGI.

Maintain stable facial volume, eye size, curl mass, body proportions, wardrobe
construction and material response across every lens position in the move.

################################################################
LIGHTING AND VISUAL CONTINUITY
################################################################

The room's established warm practical source remains dominant and unchanged.
Its world direction, color temperature, exposure, shadow placement and time of day stay
constant through the entire camera move, including the final high oblique.

Warm directional light wraps her curls, cheek planes and knuckles, and rakes across the sheet
so the paper's tooth reads as surface relief while the graphite stays a flat matte deposit.
Her hand and the pencil cast a stable contact shadow onto the page that travels correctly as
the camera descends.

Use soft directional shadow, stable contact shadows and restrained atmospheric perspective to
preserve sculptural volume and real dimensional depth.
Colors remain rich and controlled without neon glow or excessive saturation.

No flat 2D or paper-cutout motion. No photoreal live action. No glossy plastic or toy-like
CGI. No waxy skin, generic game-render materials, watercolor bleed, unmotivated neon lighting,
heavy grain or style drift across the move.

################################################################
AUDIO
################################################################

No dialogue, narration, lyrics, captions or subtitles. No added music.

0.00–0.50: quiet room tone slightly damped by the worn earbuds, one soft breath,
and the first dry tick of graphite meeting paper.
0.50–2.55: intimate dry graphite scratches that change texture with stroke direction,
faint sleeve friction against the desk.
2.55–4.40: shorter separated strokes with small gaps of near silence as the tip lifts
between limbs and wing spars.
4.40–5.00: one longer searching stroke, then the pencil lifting clear, then room tone alone.

Every sound begins only after its visible physical cause.

################################################################
PRESERVATION LOCKS
################################################################

Only one HIXXA appears.
Preserve her exact face, body proportions, skin tone, hair mass, layered wardrobe and anatomy,
including correct five-finger hands, the right-hand pencil grip and the left-hand paper
contact. Her hands keep their five-finger anatomy, their worn dried paint stains and their clean unpainted nails, and every object keeps the size given above.

Exactly one active sheet and exactly one drawn fox, with exactly two wings.
Exactly one graphite pencil in her hand and exactly one small red pencil in her curls;
the two are never confused and the red pencil is never used.
Exactly one wired earbud pair with one continuous cable.

The fox remains pigment lines bonded to one flat sheet. It never blinks, breathes, twitches,
moves independently, rises, extrudes, folds into a creature or becomes three-dimensional.
No auto-drawing, no crawling lines, no magical reveal, no line appearing without the tip.

No color, paint, black wing fill, shading, text, logo, caption or signature at any point.
The page orientation and all desk props stay exactly as established.

The room keeps its exact geography and fixed background objects; it is never mirrored,
rotated or rebuilt as the camera descends.

This is one continuous take.
No cut, fade, dissolve, wipe, morph, flash, blur transition, whip transition, crossfade,
animated overlay or generated interstitial frame.
No camera shake, no lens change, no orbit, no zoom, no axis crossing.
No identity drift, no face redesign, no extra fingers or limbs, no duplicate heroine,
no floating tool, no temporal grain crawl, no flicker, no dust burst, no watermark.

ENDPOINT AND HANDOFF

End on a clean hold of the complete graphite construction drawing, pencil lifted above the
fox's right wing spar, left hand still pinning the sheet.
Preserve this exact sheet orientation, camera height and drawing state as the inherited first
frame of HX-DRAW-FOX-02.
```

---

## نقطتان تحتاجان قرارك

1. **بيت التأمل الأخير حُذف.** في 5 ثوانٍ آخر 0.60 ثانية بتروح على الكونتور ورفع القلم، ومفيش مساحة تنفس بعدها. لو البيت ده مهم عندك دراميًا، أرشح **6 ثوانٍ** بدل 5 — يديك 0.80 ثانية hold حقيقي بلا ما تلمس أي مرحلة رسم.
2. **الكونتور مدموج مع رفع القلم** في نافذة واحدة 0.60s. لو طلع مزحومًا في التوليد، أسهل تنازل هو حذف **دوائر المفاصل** من نافذة الأرجل ونقل 0.20s للكونتور.

الملف: `docs/creative/hixxa/beats/B02-FOX-TAKES-SHAPE.md`
