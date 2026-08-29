# HIXXA — DRAW / CRUMPLE / THROW TIMELAPSE → EXHAUSTED HERO HOLD

> **المدة:** 10.0 ثوانٍ — **الشوتات:** 6 (A–F) — **القطعات:** 5 — **برومبت واحد**
> **المعيار:** `HIXXA_MASTER_CANON_V4` — §6A · §6B · §6E · §6F · §6G(TIER 1) · §14B
> **التاقات:** `@char_hixxa` `@hixa-face` `@loc_location-room-1` `@desk` `@basket` `@ear` `@bag`
> **السلة:** تدخل قرب الامتلاء وتنتهي **STAGE 4** مكوّمة
> **التسليم:** الفريم الأول الصارم لبرومبت الدوّامة والحلم

**التوقيت في نسختك صحيح تمامًا:** 2.35 + 1.30 + 1.20 + 1.25 + 2.15 + 1.75 = **10.00**، متلاصق، وخمس قطعات لست شوتات. لم أمسّه.

---

## ⚠️ المشكلة الأولى: «ثلاثون كرة» لا تملأ السلة

السلة في الـCanon **30 سم قطرًا و35 سم ارتفاعًا**، والكرة **ربع العرض الداخلي ≈ 7.5 سم**. بهذه الأرقام:

| | |
|---|---|
| حجم السلة | ≈ 24,700 سم³ |
| حجم الكرة الواحدة | ≈ 221 سم³ |
| كفاءة رصّ الورق المكرمش | 55–60% |
| **الكرات اللازمة للوصول إلى الحافة** | **62–67** |
| التاج فوق الحافة (5–8 سم) | **+11** |

**ثلاثون كرة تملأ 46% فقط** — أي أقل من النصف. ولو أردنا للثلاثين أن تملأها، لوجب أن يكون قطر الكرة **9.7 سم = ثلث العرض الداخلي** — وهذا يكسر قفل §6E الذي يمنع الثلث صراحةً (وهو القفل الذي وضعناه أصلًا لأن الورق كان يخرج ضخمًا).

**الحل المطبَّق — والأهم:** عند STAGE 4 **يتوقف العدّاد عن كونه عددًا**. التعليمة المقروءة هي **«لا فجوة مرئية من القاعدة إلى الحافة»**، لا رقم. الرقم المنخفض يدعو النموذج إلى ملء ناقص، والرقم العالي لا يُعدّ بصريًا أصلًا. وكُتب الترتيب من الحجم: **عشرات الكرات، بترتيب الستين إلى السبعين**، ثم القاعدة المقروءة.

## المشكلة الثانية: هل تكفي خمس كرات؟

البرومبت يقول إن السلة تبدأ بما ورثته من `@video` وتنتهي **ممتلئة تمامًا**. لكن هذا الكليب يضيف **خمس كرات فقط** (ثلاث مضغوطة في الشوت A، واحدة في B، والأخيرة عبر C→D).

**فخمس كرات لا تملأ سلة إلا إذا دخلت قرب الامتلاء أصلًا.** لذلك أُضيف شرط صريح:

```
The incoming basket must already be near capacity — STAGE 3, filled close to the rim with only
the top layer still compressible. Five more balls complete it. If the incoming frame shows a
half-empty basket, this clip cannot fill it and the shot count must change.
```

## المشكلة الثالثة: `@video` ليس مسارًا

`MULTI-REFERENCE R2V EXTENSION` ليس مسارًا في Seedance، و`@video` ليس عنصرًا في مكتبتك. والبرومبت نفسه يصف ما يريده بدقة: **«reproduce the exact final frame pixel-faithfully»** — وهذا **`STRICT FIRST-FRAME I2V`** من آخر فريم مُصدَّر كصورة.

اعتمدتُ ذلك لأنه أضبط: الفريم الأول يصير سلطة حرفية بدل أن يستنتج النموذج حالة من فيديو كامل، ويزول خطر «نسخ حركة سابقة من `@video`» الذي اضطررت لمنعه صراحةً.

---

## ما اتصلح كمان

| المشكلة | التصحيح |
|---|---|
| بلا بلوك اليدين | مضاف — واليد هي الكادر في الشوت B العلوي |
| بلا بلوك مقاييس | مضاف، ومنه جاء اكتشاف تعارض الثلاثين |
| `REAL-TIME MOTION` غير معلن، والـtimelapse تلاعب زمني | **عقد سرعة صريح:** A–D مضغوطة زمنيًا عمدًا، E–F زمن حقيقي — والحد بينهما مكتوب |
| «several rhythmic cycles» بلا عدد | **ثلاث دورات مضغوطة في A**، واحدة في B، والأخيرة عبر C→D = خمس كرات |
| بلا تايم لاين صوتي | نوافذ تغطي 10.00 |

**الستايل:** أبقيت نسختك **الكاملة (TIER 1)** لأن هذا كليب Hero Hold ويستحقها. لو ضاقت مساحة البرومبت في Higgsfield، استبدلها بـTIER 2 من §6G بلا خسارة تُذكر.

---

```text
################################################################
HIXXA — DRAW / CRUMPLE / THROW TIMELAPSE → EXHAUSTED HERO HOLD
################################################################

SEEDANCE 2.5 — STRICT FIRST-FRAME I2V — 10.0 SECONDS — 16:9 — 24 FPS

CONTROLLED SIX-SHOT SEQUENCE — EXACTLY FIVE DIRECT HARD CUTS

MOTION SPEED CONTRACT
Shots A through D are a deliberate, disciplined time compression: elapsed work is conveyed by
clean pose sampling and rhythmic action density, never by speed ramps, ghosting, clones,
transparent trails, duplicate limbs or simultaneous versions of HIXXA.
Shots E and F return to full real-time performance and stay there.
No slow motion anywhere. No visual transitions anywhere.

STORY OBJECTIVE

She works through the last of her paper, fills the basket to its limit, runs out of energy and
puts her head down.

FRAME ZERO — STRICT LAST-FRAME HANDOFF

Reproduce the supplied final frame faithfully before any action begins: every visible object,
count, overlap, pose, hand side, paper state, basket contents, screen direction, light
direction and material design. Begin immediately from that state with no pre-roll, reset or
alternate opening. Do not reproduce any earlier motion from the source clip; continue only from
its last physical state.

The dead phone already lies flat on top of the fully closed bag on the burgundy blanket across
the established desk-to-bed diagonal. Its screen is black and unbranded. It does not begin on
the desk and it does not move at any point in this clip.

HIXXA is already at the drawing position. Her anatomical RIGHT hand holds the one established
drawing tool; her anatomical LEFT hand stabilises and turns the active sheet. Both compact black
earbuds are already seated inside her ears.

INCOMING BASKET STATE — REQUIRED

The basket arrives already near capacity: filled close to the rim with only the top layer still
compressible, and it holds exactly the count and arrangement shown in the incoming frame.
Five more balls are added during this clip and they complete it.
It does not begin empty, and it is not pre-filled to its final state.

REFERENCE ASSIGNMENTS

The first frame is the authority wherever it shows the current state of anything.

@char_hixxa controls one exact HIXXA: identity, body proportions, skin tone, sculpted curly
hairstyle, wardrobe and anatomical left and right. It does not control the room, the furniture,
the lighting or the camera, and it never produces a duplicate HIXXA during the time compression.

@hixa-face reinforces only the same single mature dimensional face and its facial planes.
It never creates a second person and never changes the incoming expression before motion begins.

@loc_location-room-1 controls the attic bedroom studio topology, window, shelf, bed, chair,
floor, desk-to-bed geography, burgundy blanket, furniture relationships, materials and warm
practical light. It does not control the camera angle or the shot size.

@desk controls the exact desk design, dimensions, worn finish, scratches, drawing surface and
tool layout.

@basket controls one exact mesh wastebasket fixed on the floor beside HIXXA's anatomical RIGHT
side: its design, scale, rim, mesh material, worn finish, world position and orientation.
The reference shows four fill levels side by side; this clip runs from STAGE 3 to STAGE 4 and
never shows the four-bin sheet itself. The basket shell never changes size — "the basket grows"
means only that the paper inside it rises. It does not control the camera angle.

@ear controls the same two old compact black wired in-ear earbuds, both already fitted deeply
and naturally enough to read as small realistic earbuds rather than oversized headphones.
One complete black cable: two short branches leave the ears, join below the collarbone, pass
through the inline control and the repair-tape section, then continue as one main lead to the
free 3.5mm plug resting on the desk, disconnected. The earbuds emit no light and stay worn
through the final pose.

@bag controls the exact fully CLOSED bag on the burgundy blanket. It stays closed, stationary
and never shows an opening or an interior.

No inactive reference influences the generation. No new phone, bag, basket, person, drawing
tool or earbud appears.

HANDS

Her hands are a working artist's hands: five fingers with one opposing thumb, correct joint
count and proportion, natural knuckle relief and tendon lines, and grips that close with real
contact against what they hold.

Dried paint is worn into the skin from long working days — soft pale blue and cyan along the
sides of the thumb and across the finger pads, a little dusty pink, cream flecks over the
knuckles. It is matte, faded and absorbed, following the skin's own creases and sitting under
the shading rather than on top of it. The fingernails stay clean bare nail: no colour on the
nail plate. The stains live on skin only.

HAND AND PROP LEDGER

Her anatomical RIGHT hand draws and performs every throw.
Her anatomical LEFT hand anchors and turns the active sheet.
She places the single drawing tool into its established rest zone before every two-handed
crumple; the tool never duplicates and never stays in her hand while she crumples.
Both hands visibly contribute to compressing one sheet into one ball.
Each ball leaves the RIGHT hand once, follows one clean arc and stays in the basket.
The phone stays on the closed bag for the full ten seconds and she never looks at, reaches for,
lifts, touches or throws it.
Both earbuds stay seated; the cable moves only with passive secondary motion from her torso and
arms, and the disconnected plug stays on the desk, clear of her arms and the paper path.
At the endpoint both hands are empty, relaxed and partly hidden beneath her head and forearms.

PAPER CAUSALITY

Every rise in the basket comes from one completed cycle:
draw on one existing flat sheet → stop → place the tool in its rest zone → crumple that exact
sheet with both hands → throw the single ball with the RIGHT hand → the ball lands and stays in
the basket → take the next visible flat sheet.

Exactly FIVE balls are added in this clip: three compressed cycles in Shot A, one full cycle in
Shot B, and the final cycle carried across Shots C and D.

Time compression may shorten the in-between, but every visible rise in paper level has a
matching completed throw. No ball appears inside the basket on its own, and no sheet duplicates,
teleports or becomes a ball before she physically crumples it.

All rejected balls are ordinary inert crumpled paper: angular, faceted, each with its own fold
pattern, never repeating each other's creases, and never retaining an animal silhouette, face,
limbs, ears, wings or any recognisable creature shape.

SCALE

HIXXA is about 165 centimetres and her hand is the scale reference.
The basket is knee-high beside her seated position, about a third of a metre across at the rim.
Each crumpled ball is roughly a quarter of the basket's inner width — small enough that several
sit side by side on the base — and never a third or more of it.
One landscape sheet is a little wider than her two hands set side by side.
The earbuds are small enough to sit inside the bowl of her ear.

################################################################
TIMELINE
################################################################

SHOT A — 0.00–2.35 — MATCHED HANDOFF, LOCKED TIME COMPRESSION

Match the exact camera position, framing and lens character of the incoming frame and keep the
camera physically locked for the whole shot: no push, pan, orbit, reframe or axis change.

Hold the incoming frame for a readable fraction of a second, then accelerate into the time
compression. She completes THREE rhythmic rejection cycles at the same desk position: strokes
accumulate, the tool returns to its rest zone, the sheet collapses between both hands, the RIGHT
arm throws, and the next sheet replaces it.

Her animation is authored pose to pose: sharper pencil attacks, tighter shoulders, faster
crumples and shorter pauses. It never becomes a mechanical loop — fatigue accumulates visibly in
her spine, her wrist and her face across the three cycles.

The basket rises through three clear physical stages while its mesh body, rim height and world
position stay unchanged. The phone stays flat and motionless on the closed bag in every sampled
moment. The cable follows her torso without duplicating or whipping across the drawing.

End with her RIGHT hand pulling a new sheet flat.

DIRECT HARD CUT ON THE RIGHT HAND PULLING THE NEW SHEET FLAT.

SHOT B — 2.35–3.65 — OVERHEAD DRAW AND CRUMPLE GEOMETRY

32mm planimetric overhead looking squarely down onto her hands, the active sheet, the tool rest
zone, the paper stack, the desk edge and the upper rim of the basket beside her anatomical RIGHT
side. Camera completely locked: no drift, no rotation. Left and right anatomy and desk geography
are never mirrored.

Inherit the new flat sheet. The RIGHT hand fills it with fast angular marks while the LEFT
fingertips rotate it once. She sets the tool precisely into its rest zone, crushes that same
sheet between both hands, transfers the ball to the RIGHT hand and throws it toward the basket.

The overhead angle preserves real surface relief and tactile separation between skin, paper,
desk grain and the tool, and the cable stays routed along the centre of her torso and clear of
both forearms while the plug stays fixed near the safe desk edge.

End as the ball exits the overhead frame toward the basket.

DIRECT HARD CUT ON THE BALL LEAVING FRAME.

SHOT C — 3.65–4.85 — COMPRESSED PROFILE, THE LAST FRANTIC DRAWING

85mm compressed side profile close. Align the drawing tip, her tense eye, her cheek plane and
the small black earbud in the near ear into one readable depth stack. Use a restrained five
percent micro-push and one motivated focus transfer from the tip to her eye; no arc, no axis
crossing.

Inherit the reduced stack. She attacks one last fresh sheet with fast angular strokes, her RIGHT
wrist stable and her LEFT fingertips pinning the paper. The near earbud stays small, dark and
non-glowing, its cable dropping naturally from the ear without floating.

Her eyes compare the marks, her brow tightens and her jaw sets. She stops abruptly, places the
tool in the same rest zone, grips the rejected sheet with both hands and begins one final
forceful crumple. No other sheet moves.

Keep the face fully dimensional through stable cheek volume, nose projection, jaw structure,
eyelid depth and natural light wrapping.

End with the paper collapsing between her hands.

DIRECT HARD CUT ON THE PAPER COLLAPSING.

SHOT D — 4.85–6.10 — BASKET-RIM IMPACT, FINAL CAPACITY

24mm rectilinear, positioned on the floor just outside the basket and slightly below its rim,
never inside it. The worn mesh and the existing paper crown dominate the near foreground while
she stays legible at the desk behind. One short tilt following the incoming ball, stopping on
impact.

Inherit the final crumple. She finishes compressing the sheet, loads her RIGHT elbow and throws
the single ball. It passes through the upper frame, crosses the rim and lands on the supported
layer. The balls it touches compress and settle a few millimetres; none escapes.

This ball completes the basket. It is now full from mesh base to rim with no visible gap
anywhere, plus one dense physically supported crown rising five to eight centimetres above the
rim. At this scale that reads as many dozens of balls — on the order of sixty to seventy — but
the instruction is the absence of gaps, not a count: fill it until nothing more would fit.
Nothing spills onto the floor. The basket shell does not grow, bulge, slide, rotate or change
design.

End on the final ball's micro-settle.

DIRECT HARD CUT ON THE MICRO-SETTLE.

SHOT E — 6.10–8.25 — FRONTAL EXHAUSTION, THE LAST LINE DIES

55mm natural-perspective frontal medium across the desk, framing her face, both worn earbuds,
shoulders, forearms, cable route and the drawing area while preserving the background geography.
A restrained three percent push that stops as her energy goes.

Real-time motion resumes here and stays. She pulls one final clean sheet into position and tries
to draw again. The RIGHT hand makes only two weak strokes. Her wrist slows, the tool tip stays
planted for a beat, and the room goes still around her.

Her eyes move from the unfinished marks to the full basket, then back to the sheet. The
frustration drains into fatigue rather than anger: heavy eyelids, collapsing shoulders, a
released jaw and one long quiet exhale.

She deliberately places the tool in its established rest zone. The final unfinished sheet stays
flat and uncrumpled — nothing else could fit in the basket anyway. She guides the cable with one
small forearm adjustment so it lies slack between her arms rather than under a wrist, brings
both empty forearms together horizontally and begins lowering her head.

End on the downward head vector.

DIRECT HARD CUT ON THE DOWNWARD HEAD VECTOR.

FINAL SHOT — 8.25–10.00 — HERO WIDE, HEAD DOWN, DREAM-READY HOLD

24mm rectilinear hero wide from a low angle about thirty-five centimetres above the floor near
the desk corner. The basket fills the lower foreground beside her anatomical RIGHT side, HIXXA
occupies the desk midground, and the bed with the closed bag and its stationary phone stays
legible in the background. One restrained three percent settling push that stops completely by
9.40.

Inherit her exact downward momentum. Her forehead and cheek settle onto both folded forearms
with believable weight; sleeves and sculpted hair compress slightly at contact. Both earbuds
stay correctly seated, and the cable forms one natural relaxed curve from the ears to the
junction and the desk, with enough slack for the resting pose and no tension across her neck.
Her shoulders release, her spine softens, and her eyelids close only after her head is fully
supported.

The low wide reveals real depth between the packed basket in the foreground, HIXXA at the desk
and the bed beyond, so the room reads as one continuous space.

The composition is heroic through scale and hierarchy, not through a triumphant pose: the full
basket towers in the foreground as the evidence of the day, while she is small, exhausted and
still behind it.

From 9.40 to 10.00 hold completely clean, with slow breathing the only movement.

End on a locked stable frame: HIXXA at rest with her head on her forearms, the basket packed
base to rim with its crown, the phone dead on the closed bag, both earbuds worn and the
disconnected plug stable on the desk.

################################################################
PHYSICS AND PERFORMANCE
################################################################

All movement is grounded and human: real grip pressure, wrist-led drawing, shoulder loading on
each throw and a body that decelerates through joints. Fatigue is cumulative and physical — it
shows in her spine, her wrist and her breathing before it shows in her face.

Crushing is a real physical event: the sheet buckles from the gripped edges inward, folds into
irregular angular facets rather than smooth curves, and keeps sharp creased ridges and one
closing seam. It is never a smooth sphere.

Inside the basket the existing balls are inert unless struck. On each impact the contacted balls
compress and settle a few millimetres; the lower layers stay supported by the base and mesh
walls. No whole-pile movement, no fountain, no levitation and no sudden change in basket volume.

Her collapse is weight, not a pose: the forearms take the load, the sheets beneath them crease,
the chair takes her shifted weight, and her curls settle after her head does.

No object moves before direct contact or a visible physical force.

################################################################
MASTER VISUAL STYLE — HAND-PAINTED STYLIZED 3D
################################################################

Premium stylized 3D character animation rendered through a hand-painted illustrative finish.
The underlying world, characters, props and camera are fully dimensional and volumetric 3D,
with convincing perspective, depth, spatial parallax, sculpted anatomy and cinematic lens
behavior; however, the final image must read as a moving hand-painted illustration rather than
conventional CGI.

CHARACTER RENDERING
Characters use strongly sculpted, graphic forms with elegant stylized proportions and controlled
anatomical exaggeration. Faces are dimensional and expressive, with clearly modeled cheekbones,
brows, noses, lips and jaw planes. Eyes may be slightly amplified for expressive readability
while remaining grounded and mature, never generic anime.
Use deliberate planar facial shading, painted tonal variation and selective illustrated detail
instead of smooth photorealistic skin rendering. Skin must feel hand-painted over dimensional
form: subtle brush-shaped tonal breakup, controlled warm/cool variation, crisp shadow shapes and
selectively simplified highlights.

HAIR
Hair is constructed from large, readable sculpted locks and graphic clumps with dimensional
volume. Individual strands are secondary. Avoid photorealistic hair simulation, fuzzy strand
rendering or perfectly smooth plastic hair.

SURFACE TREATMENT
Every 3D surface receives a controlled hand-painted finish. Use painterly color transitions,
selective brush-like texture, graphic value grouping, restrained surface irregularity and
illustrated material definition while preserving clean dimensional form. The painting exists ON
the objects; do not place a paper texture, watercolor wash or canvas filter over the entire
image.

SHADING
Use hybrid illustrative shading: dimensional 3D lighting combined with deliberately designed
graphic shadow shapes. Favor readable light planes, selective hard shadow boundaries and
restrained soft transitions. Forms must remain sculptural and three-dimensional while avoiding
physically perfect CGI shading. Do not use flat two-tone cel shading. Do not use glossy PBR
realism.

LINEWORK
No uniform cartoon outline around characters. Allow only subtle selective drawn accents, dark
graphic creases, painted edge definition and occasional hand-inked detail where naturally
motivated. Most silhouette definition must come from value separation, painted edges and
dimensional lighting.

ENVIRONMENT
Environments remain fully dimensional with real perspective, depth and camera parallax but
receive the same illustrated hand-painted treatment as the characters. Background detail may
simplify progressively with distance, producing the feeling of animated production concept art
rather than a photorealistic 3D set.

CINEMATIC IMAGE
Feature-animation cinematography with intentional focal hierarchy, atmospheric depth, controlled
depth of field, strong foreground / midground / background separation and carefully shaped
practical lighting. Preserve rich dimensionality without revealing a conventional CG-render
aesthetic.

ANIMATION FEEL
Full-body dimensional character animation with confident pose-to-pose staging, strong
silhouettes, clear anticipation, physical weight, clean arcs and expressive facial acting.
Motion should feel intentionally animated rather than motion-captured or mechanically
interpolated. Fast actions may use controlled pose compression, directional motion blur, brief
deformation and strong readable impact poses. These are drawing craft inside the shot: they are
never a speed ramp, never a blur transition across a cut and never a morph of any object.
Camera movement exists naturally inside the dimensional environment with true parallax and
perspective change.

ABSOLUTELY AVOID
Photorealism, live-action appearance, conventional glossy CGI, plastic skin, wax skin, PBR
showcase rendering, Unreal Engine look, Blender-render look, hyper-detailed pores, photorealistic
hair strands, generic Pixar-like smoothness, flat 2D anime, flat cel-shading, uniform black
cartoon outlines, watercolor, gouache wash, paper-grain overlay, canvas texture overlay, fuzzy
painterly edges, muddy colors, overly soft airbrushed shading, excessive bloom, neon rim light
everywhere, AI-smoothed faces, rubbery motion, motion-capture stiffness.

################################################################
LIGHTING AND VISUAL CONTINUITY
################################################################

The established warm late-afternoon window light stays the dominant source. Preserve the
incoming lit side, the cooler shadow side, the contact shadows and the exposure across every
cut. Elapsed time is communicated by action density, never by changing daylight: the room does
not shift colour, dim or brighten during the compression, and it does not darken when she rests.

Shape a controlled highlight across the basket's rising paper so the increasing fill stays
readable as many separate objects rather than one mass — light, not glow.
No fantasy aura, no pervasive neon rim, no excessive bloom.

################################################################
AUDIO
################################################################

No dialogue, narration, lyrics, ad-libs, captions or subtitles.
There is no music and no earbud playback at any point: the 3.5mm plug is disconnected on the
desk, so nothing is feeding the earbuds.

0.00–2.35: rhythmic causal Foley compressed into a tightening pattern — pencil scratches, the
tool tapping into its rest zone, paper snapping, two-handed crumples, an arm swish and a dry
basket impact, three times, each cycle shorter than the last. The sounds never overlap into
impossible duplicates.
2.35–4.85: the same pattern continuing at its tightest, then one longer, harder crumple.
4.85–6.10: the throw, the ball crossing the rim, and one dense settle into packed paper.
6.10–8.25: the pattern loses a beat and stops. Two weak strokes, the tool set down, one long
exhale, and room tone opening underneath.
8.25–10.00: room tone alone, sleeve on wood, the chair settling, the cable brushing cloth once,
then only slow breathing.

Every sound begins only after its visible physical cause.

################################################################
PRESERVATION LOCKS
################################################################

Only one HIXXA appears, and no duplicate, ghost, clone or transparent version of her appears at
any point in the time compression. Preserve her exact face, body proportions, skin tone, hair
mass, wardrobe and anatomy. Her hands keep their five-finger anatomy, their worn dried paint
stains and their clean unpainted nails, and every object keeps the size given above.

Exactly one phone: it begins and ends flat on the closed bag, its screen completely black with
no interface, notification, logo, light, flicker or relight, and she never interacts with it.
The bag stays fully closed and stationary; no opening or interior appears.

Exactly two small black wired earbuds, worn from frame zero through the final hold, with two
branches joining below the collarbone through one inline control and one repair-tape section
into one main lead ending at the disconnected free plug on the desk. The cable shows only
restrained passive motion, keeps safe slack through the head descent, and never reconnects,
stretches, duplicates, vanishes, glows, tangles around her neck or enters the paper action.

The basket stays fixed beside her anatomical RIGHT side in its inherited world position.
Its shell never scales or changes design. Exactly five balls are added, each from one sheet she
physically drew on, crumpled and threw. No ball floats, crawls, unfolds, leaves, duplicates or
appears outside the basket, and no paper is shaped like a cat, fox, dragon, monster or character.

The desk, chair, basket, bed, bag, shelf and window stay fixed in world space through every cut.
The one drawing tool moves only between her RIGHT hand and its rest zone. The unfinished final
sheet stays flat on the desk at the endpoint. She stays at the chair and desk and never
approaches the bed.

STOP BEFORE TRANSFORMATION
No basket shake, floating paper, vortex, aperture, tunnel, levitation, living drawing, folding
desk, folding chair, lighting failure or supernatural event occurs inside this clip.

Every angle change is a direct hard cut on a motivated physical event.
No fade, dissolve, wipe, morph, flash, blur transition, whip transition, animated overlay or
generated interstitial frame. No text, UI, logo, caption, subtitle or watermark.

CONTINUITY OUT

At 10.00: one HIXXA rests with her head fully supported on both folded forearms at the desk;
both hands empty and relaxed; the drawing tool in its established rest zone; one unfinished flat
sheet on the drawing surface; both black earbuds seated with the cable slack and the
disconnected plug on the desk; the dead phone flat on the fully closed bag; the basket fixed
beside her anatomical RIGHT side and completely full from base to rim with its dense supported
crown five to eight centimetres above it; no ball outside the basket and no capacity left; warm
room lighting and all room geometry unchanged; and nothing yet transforming.

This exact endpoint is the strict first frame of the following paper-vortex and dream-aperture
prompt.
```

---

## فحص الاستمرارية والزمن

| القطعة | آخر فريم | أول فريم بعدها |
|---|---|---|
| A→B (2.35) | اليمنى تسحب ورقة جديدة مستوية | نفس الورقة تحت الكادر العلوي |
| B→C (3.65) | الكرة تخرج من الكادر ناحية السلة | المكدس نقص، ورقة أخيرة جديدة |
| C→D (4.85) | الورقة تنهار بين كفّيها | نفس الكرمشة تكتمل |
| D→E (6.10) | الكرة تستقر والسلة اكتملت | نفس السلة الممتلئة خلف نظرها |
| E→F (8.25) | متجه الرأس نازل | نفس الاندفاع، الكادر الواسع |

**التوقيت:** 2.35 + 1.30 + 1.20 + 1.25 + 2.15 + 1.75 = **10.00** — بلا فراغ، والصوت كذلك.

## ملاحظة على ترتيب السلسلة

هذا الكليب **لا يحتاج مشهد الموبايل** ليعمل. كل ما يرثه هو حالة ساكنة: **التليفون ميت فوق الشنطة المغلقة، والقابس مفصول على المكتب.** فلو ألغيت `B09`، يكفي أن يصل الفريم الأول بهذه الحالة من أي كليب سابق.
