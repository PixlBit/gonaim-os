# HIXXA — HYSTERICAL DRAWING AND BASKET-OVERFILL MONTAGE

> **المدة:** 10.0 ثوانٍ — **الشوتات:** 7 (A–G) — **القطعات:** 6
> **المعيار:** `HIXXA_MASTER_CANON_V4` — §6A اليدين · §6B المقاييس · §6E `@basket` · §6F الزمن · §14A القالب
> **التاقات:** `@loc_location-room-1` `@desk` `@char_hixxa` `@hixa-face` `@ear` `@basket`
> **السلة:** `@basket` **STAGE 3 → STAGE 4** — على الأرض عند يمينها التشريحي
> **الوراثة:** بعد مراحل رفض كثيرة سابقة — **التسليم:** سلة ممتلئة حتى الحافة

---

## المشكلة الأولى: الحمل الزمني

الحساب على النسخة الأصلية:

| | |
|---|---|
| 7 شوتات ÷ 10 ثوانٍ | **1.43 ثانية للشوت** |
| البيتات المكتوبة في كل شوت رسم | **7** (ضربات أخيرة، توقف، إفلات القلم، إمساك، كرمشة، نقل للقبضة الرامية، رمية، ارتطام) |
| الزمن الفعلي للبيت الواحد | **0.20 ثانية** |
| الحد الأدنى في §6F للفعل الصغير الواضح | **0.80 ثانية** |
| **الفارق** | **محمّل بأربعة أضعاف** |

**لكن العشر ثوانٍ ليست خطأ.** الخطأ في عدد البيتات:

```
6 دورات × 3 بيتات × ~1.10s  +  تأسيس  +  POV ختامي  ≈  9.9s
```

فالحل ليس تمديد المدة ولا حذف رفضة من الست — بل **تقليص كل شوت إلى ثلاثة بيتات**: `آخر ضربات → كرمشة → رمية`، والارتطام يقع **على القطعة** لا داخل الشوت. وهذا هو نحو المونتاج الهستيري أصلًا: لا نرى الدورة كاملة، نرى ذروتها.

**ما نُقل من الشوتات إلى الأقسام العامة** (لأنه صحيح طوال الفيلم ولا يحتاج زمنًا خاصًا في كل شوت): نبض كتفيها، إفلات القلم، إزاحة الكرات المجاورة بسنتيمترات، ازدياد الكثافة، وثبات الكرات القديمة.

---

## المشكلة الثانية: تسرب الأدوار

النسخة الأصلية تعطي `@char_hixxa` سلطة على: «room geometry, desk layout, lighting, shelf placement, floor materials **and the exact mesh-basket design**».

هذا يكسر «وظيفة ضيقة واحدة لكل مرجع» (§48 وPART II §3): مرجع **شخصية** يتحكم في الغرفة والسلة. النتيجة المتوقعة: تنازع بين المراجع على المكان.

**بعد الفصل:** `@char_hixxa` الهوية · `@hixa-face` الوجه · `@loc_location-room-1` الغرفة والموضع · `@desk` المكتب · `@basket` جسم السلة ومرحلتها.

---

## المشكلة الثالثة: التكرار

قفل موضع السلة مكرر **أكثر من خمس عشرة مرة**، وقفل «ليس أبيض» عشر مرات بقائمة من عشرة مرادفات. وهذا بالضبط ما يحذّر منه §40A: **الأقفال ليست تراكمية** — التكرار يبعثر الانتباه بدل أن يقوّيه.

كل قفل صار مكتوبًا **مرة واحدة في مكانه الصحيح**، والشوتات تشير إليه ولا تعيده. الطول نزل إلى نحو الثلث والقوة زادت.

---

## ⚠️ تعارض يحتاج تأكيدك

`PART I §21` من الـMaster يقفل: **«اليد اليمنى للرسم. اليسار تنفذ الرمية بعد نقل الكرة إليها مرئيًا.»**

لكن برومبتك الحالي يضع السلة عند **يمينها التشريحي** ويطلب **رمية جانبية قصيرة** بأقل دوران جذع. رمية باليسار نحو اليمين تعني **عبور الجسم بالكامل** — وهذا يناقض «short lateral toss» و«only the small natural rotation needed».

**الحسم المطبَّق:** بترتيب السلطة في §2، البند الأول هو «آخر تصحيح صريح من المستخدم» — وهو هندستك الحالية. فالبرومبت مكتوب بـ**رمية اليد اليمنى** نحو السلة اليمنى، والقلم يُفلت أولًا لتتحرر اليد.

**البديل لو أردت الالتزام بـ§21:** انقل السلة إلى **يسارها التشريحي**، وتعود الرمية لليسار بلا عبور جسم. قل أيهما وأثبّته في كل السلسلة.

---

```text
################################################################
HIXXA — HYSTERICAL DRAWING AND BASKET-OVERFILL MONTAGE
################################################################

SEEDANCE 2.5 — MULTI-REFERENCE R2V — 10.0 SECONDS — 16:9 — 24 FPS

CONTROLLED SEVEN-SHOT MONTAGE — EXACTLY SIX DIRECT HARD CUTS
REAL-TIME MOTION — NO SLOW MOTION — NO SPEED RAMPS — NO VISUAL TRANSITIONS
ESCALATING FRANTIC PACING AT NATURAL SPEED

STORY OBJECTIVE

Six drawings are rejected in a rising panic, and an already-full wastebasket is packed to
its rim.

REFERENCE ASSIGNMENTS

@loc_location-room-1 controls the exact room geography, architecture, floor material, shelf
placement, permanent light and where the wastebasket stands on the floor.
It does not control the wastebasket object itself, which belongs to @basket, and it does not
control the camera angle or the shot size.

@desk controls the exact desk, work surface and existing prop layout: the phone and its cable,
the coffee mug and the drawing tools. It does not add, remove or reposition any desk prop.

@char_hixxa controls HIXXA's exact single full-body identity, skin tone, body proportions,
curls and established wardrobe. It does not control the room, the desk, the lighting, the
wastebasket, the camera angle or her moment-to-moment expression.

@hixa-face reinforces only the face of that same single HIXXA.
It never creates a second person and never drifts between shots.

@ear controls the earpiece completely: its small vintage wired design, its scale, its exact
seating in the ear, its material character, its cable attachment point and thickness, and its
exact body colour. It does not control anything else in frame.

@basket controls the exact metal mesh wastebasket: the wire weave, rolled rim, solid base,
its proportions, and the way crumpled paper sits inside it.
The reference shows four fill levels side by side; this film begins at STAGE 3 and ends at
STAGE 4. It never places more than one wastebasket in the room and never shows the four-bin
sheet itself. It does not control the camera angle.

HANDS

Her hands are a working artist's hands: five fingers with one opposing thumb, correct joint
count and proportion, natural knuckle relief and tendon lines, and grips that close with real
contact against what they hold.

Dried paint is worn into the skin from long working days — soft pale blue and cyan along the
sides of the thumb and across the finger pads, a little dusty pink, cream flecks over the
knuckles. It is matte, faded and absorbed, following the skin's own creases and sitting under
the shading rather than on top of it. The fingernails stay clean bare nail: no colour on the
nail plate. The stains live on skin only.

EARPIECE

HIXXA wears the same small vintage wired earpiece throughout, seated naturally in the ear
exactly as in @ear, with one physically continuous wire leaving it and hanging downward under
gravity from the same attachment point on the same side.

Its body keeps the exact non-white colour of the reference under every lighting angle.
Specular highlights may brighten, but the material colour never reads as white, off-white,
cream or pale grey, and never becomes modern white plastic. When lighting makes the colour
ambiguous, take it from @ear rather than from generic earphone priors.

It is never enlarged into headphones, never given a headband or ear cups, and never becomes
wireless earbuds or a headset. The wire never disappears, duplicates, switches sides, detaches,
or passes through her neck, clothing, arm, the desk, the chair or the wastebasket. Because she
draws, crushes and throws hard, the wire may sway with delayed secondary motion and settle.

WORLD AND AXIS MAP

The wastebasket stands on the floor directly beside HIXXA's ANATOMICAL RIGHT, alongside her
chair and immediately adjacent to the desk, within short comfortable throwing reach.
This is a body-relative world-space position, not a screen position.

It is never in front of her, never behind her, never on her anatomical left, never under or on
the desk, never on a shelf and never raised off the floor. Its base stays fully supported by
the floor and it never slides, rotates, relocates, grows, shrinks or duplicates.
There is exactly one wastebasket in the room.

Camera angles may place it anywhere on screen. Screen-right is not anatomical-right: when the
camera moves behind her or crosses the axis, preserve real-world topology and never mirror her
body or the room to match the frame.

SCALE

HIXXA is about 165 centimetres and her hand is the scale reference; where a stated size and a
hand-relative anchor seem to disagree, the anchor wins.

The wastebasket is knee-high beside her seated position, standing on the floor.
Ball-to-bin scale comes from @basket: each ball is roughly a quarter of the bin's inner width.
One landscape sheet is a little wider than her two hands set side by side.
The earpiece is small enough to sit inside the bowl of her ear.

THROW PATH

Every ball travels the same route: her hand releases low, the ball carries rightward and
downward on a short lateral arc, crosses the rim and enters the wastebasket beside her.
No throw goes straight forward, backward, over her shoulder or across the room, and no ball
leaves her hand into open space and lands by coincidence. Her torso performs only the small
natural rotation a side toss needs; she never turns around to throw behind herself.

Her anatomical right hand draws and, once the pencil is out of it, throws.
Her anatomical left hand keeps the working sheet planted and joins the crush.

STARTING STATE AND PROGRESSION

At frame zero the wastebasket is already heavily filled with many ordinary crumpled rejected
drawings, matching @basket STAGE 3: densely populated, the top pile close to the rim, but with
compressible space still left above it. It never starts empty, never starts with a few
isolated balls, and never starts half empty.

Six fresh sheets rest in the established drawing position on the desk and are rejected in this
order: mechanical cat, mechanical fox, mechanical dragon, second cat, second fox, second dragon.
The stack visibly reduces after each rejection, every next sheet comes from that same physical
stack, and no page appears, reappears or duplicates.

Each rejection adds exactly one new ball, so fullness reads as incremental density rather than
a counted number: ALREADY FULL → FULLER → DENSER → MORE COMPRESSED → NEAR RIM → PACKED TO RIM.
Earlier balls stay physically present throughout and never vanish to make room.

################################################################
TIMELINE
################################################################

Each drawing shot carries three beats only — final strokes, crush, toss — and the impact lands
on the cut. Everything else about the pile, the pencil and her body is governed globally below.

SHOT A — 0.00–1.70 — 35mm HIGH OBLIQUE TOP SHOT

Frame zero already shows her pencil in contact with the mechanical cat sheet, her left hand
planting it flat, and the wastebasket clearly visible on the floor beside her anatomical right,
already crowded to near its rim.

She drives three fast final strokes into the sheet, stops dead, and crushes the sheet between
both hands through visible folds into one ball. She releases it low on the short rightward arc.

End with the ball airborne on that arc, close to the rim.

HARD CUT ON IMPACT.

SHOT B — 1.70–3.00 — 65mm TIGHT FRONT THREE-QUARTER, past stationary desk tools

Inherit the settled pile and the reduced stack, the mechanical fox sheet now on top.

She scratches two rapid final lines, snaps the sheet inward and crushes it through hard folds,
then tosses it on the same short rightward arc.

End with her arm at full follow-through and the ball already past her hand.

ACTION CUT ON THE FOLLOW-THROUGH.

SHOT C — 3.00–4.50 — 24mm WIDE SIDE ANGLE

This shot establishes the spatial truth in one readable composition: HIXXA seated at the desk,
the wastebasket on the floor immediately beside her anatomical right, both in frame together.

Inherit the fuller pile. She attacks the mechanical dragon sheet with frantic but controlled
strokes, her eyes locked on the pencil's contact point, then crushes it and makes a compact
right-side toss that crosses the short lateral distance in full view.

End with the ball entering the crowded pile and the whole spatial relationship legible.

HARD CUT ON IMPACT.

SHOT D — 4.50–5.70 — 50mm REAR OVER-THE-SHOULDER, restrained lateral slide

Inherit the denser pile. The camera is behind her; the wastebasket is still on her anatomical
right and has not moved.

She scribbles furious correction strokes into the second cat sheet, crushes it in one fast
motion and tosses it sideways to her right. The ball never travels backward relative to her body.

End with the ball dropping past the rim and nothing spilling.

ACTION CUT AS SHE REACHES FOR THE NEXT SHEET.

SHOT E — 5.70–7.10 — 28mm LOW BASKET-SIDE ANGLE looking back toward the desk

The camera sits low on the floor beside the real wastebasket at her anatomical right. The bin
dominates the foreground; its world position is unchanged. HIXXA is visible beyond it.

Inherit the pile now very close to the rim. She finishes the second fox sheet, crushes it and
throws on the same arc. The ball grows in perspective as it genuinely approaches the lens, then
crosses the rim into the packed balls.

End with the top layer visibly compressing and the pile a finger's width from the rim.

HARD CUT ON IMPACT.

SHOT F — 7.10–8.40 — 40mm LOW DESK-EDGE DUTCH ANGLE

Inherit the last sheet alone on the desk. Her jaw is tight, her shoulders are up and her
breathing is fast; the frustration is at its peak and stays physical, not theatrical.

She scratches at the second dragon sheet, gives up abruptly, and crushes it through forceful
folding into one compact ball, then makes the final short right-side toss.

End as the ball crosses the fixed rim.

IMPACT CUT TO INSIDE THE WASTEBASKET.

SHOT G — 8.40–10.00 — 14mm FIXED BASKET POV

The camera is inside that same wastebasket, low against the inner mesh wall and looking up
across the packed pile toward the rim, with the room beyond it.

Inherit the final ball on its exact trajectory from Shot F. It crosses the rim, lands on the
crowded upper layer and makes one small physically plausible rebound before settling into the
last compressed space. Only the balls it touches react.

End on a locked frame: the wastebasket naturally packed to its upper rim at @basket STAGE 4,
nothing spilled outside, nothing floating, and the mesh still.

################################################################
PHYSICS AND PERFORMANCE
################################################################

Her energy rises because she is losing patience, never because the footage is accelerated.
Between beats her shoulders pulse with nervous frustrated energy, her breathing shortens across
the montage and her jaw tightens. She drops or plants the pencil before every crush so the
throwing hand is free.

Crushing is a real physical event: the sheet buckles from the gripped edges inward, the fibres
fold into irregular angular facets rather than smooth curves, and the ball keeps sharp creased
ridges, flat crushed planes and one closing seam. It is never a smooth sphere. Each ball has
its own fold pattern; balls resting together never repeat each other's creases. A crushed sheet
shows only random ink fragments, broken strokes and unreadable portions on its outer facets —
no complete animal stays recognisable.

Every mark on every sheet appears only under direct pencil contact. Every sheet is visibly
crushed before it becomes a ball; no cut jumps from a flat drawing to a finished ball.

Inside the bin, the existing balls are inert unless a new ball strikes them. On each impact the
contacted balls compress, roll a few centimetres and shift into small available gaps; lower
balls stay supported by the base and mesh walls. There is no whole-pile explosion, no paper
fountain, no levitation and no sudden increase in volume or bin size.

Her curls, sleeve fabric and the earpiece wire lag one beat behind her motion and settle.
No object moves before direct contact or a visible physical force.

################################################################
MOOD AND RENDER CONTRACT
################################################################

Preserve the established HIXXA look: cinematic sculptural 3D animation with true volumetric
form, depth, parallax and spatial lighting, finished entirely with controlled hand-painted
digital surfaces and softly illustrated edges. Never flatten into 2D/cel art and never drift
into glossy PBR, plastic CGI or photorealism.

Skin, curls, plaid cotton, canvas apron, desk wood, paper fibre, graphite, woven wire mesh and
the earpiece's cable rubber remain materially distinct and physically dimensional. Each crumpled
ball is a genuinely volumetric object with faceted relief and its own contact shadow, never a
flat cut-out disc.

CRITICAL DISTINCTION: the world is dimensional, the artwork is not.
Every cat, fox and dragon exists only as flat static pigment and graphite bonded to the surface
of a dimensional sheet. They never animate, blink, breathe, move, react, gain volume or become
creatures, and no ball unfolds, transforms, merges with another or carries an image across to
a different sheet.

################################################################
LIGHTING AND VISUAL CONTINUITY
################################################################

The room's established practical source remains dominant and unchanged. Its world direction,
colour temperature, exposure, shadow placement and time of day stay identical across all seven
shots and every cut, including the interior basket POV, where the same light falls from above
through the mesh onto the pile.

Warm directional light wraps her curls, cheek planes and knuckles, and separates the crumpled
balls' facets by shadow so the pile reads as many distinct objects rather than one mass.
Use soft directional shadow, stable contact shadows and restrained atmospheric perspective.
Colours stay rich and controlled without neon glow or excessive saturation.

################################################################
AUDIO
################################################################

No dialogue, narration, lyrics, captions or subtitles.

0.00–1.70: room tone, fast pencil scratches, one sharp crumple, one soft basket impact.
1.70–4.50: the rhythm tightens — shorter scratches, harder paper snaps, two impacts.
4.50–7.10: her breathing becomes audible and frustrated between crumples; packed paper rustles
after each landing.
7.10–8.40: the hardest, longest crumple of the six.
8.40–10.00: heard from inside the bin — the ball crossing the rim, one landing on packed paper,
a short rebound, dense rustling that damps, then room tone and her breath alone.

Every sound begins only after its visible physical cause.

################################################################
PRESERVATION LOCKS
################################################################

Only one HIXXA appears. Preserve her exact face, body proportions, skin tone, hair mass,
wardrobe and anatomy. Her hands keep their five-finger anatomy, their worn dried paint stains
and their clean unpainted nails, and every object keeps the size given above.

Her anatomical orientation is continuous: her anatomical right stays her anatomical right at
every camera position. No mirrored limbs, no hand switching, no reversed room geography.

Exactly six fresh sheets are consumed and exactly six new balls enter the bin.
Everything inside the bin is an ordinary hand-crumpled paper ball: no flat sheets, no folded
pages, no open drawings, no origami, no animal or face shapes, no tools, pencils, cups or any
other object.

The phone, phone cable, coffee mug, desk tools, shelf, furniture, desk and wastebasket stay
where they are unless HIXXA's direct contact moves them. No duplicated wastebasket, no
environment rebuilt between cuts.

Every angle change is a direct hard cut on a motivated physical event.
No fade, dissolve, wipe, morph, flash, blur transition, whip transition, animated overlay or
generated interstitial frame. No text, UI, logo, caption, subtitle or watermark.

FINAL STATE

HIXXA at the same desk, the room unchanged, one wastebasket still on the floor at her
anatomical right, packed naturally to its rim with nothing spilled, every rejected sheet
accounted for as one ball, and the same small vintage wired earpiece in its exact reference
colour with its cable continuous and attached.
```

---

## فحص الاستمرارية والزمن

| القطعة | آخر فريم | أول فريم بعدها |
|---|---|---|
| A→B (1.70) | الكرة في الهواء قرب الحافة | الكومة استقرت، الورقة التالية على القمة |
| B→C (3.00) | الذراع في نهاية اندفاعها | الكومة أكثر امتلاءً، الكادر الواسع |
| C→D (4.50) | الكرة تدخل الكومة | نفس الكومة من خلف الكتف |
| D→E (5.70) | الكرة تنزل تحت الحافة | الكومة قرب الحافة، كاميرا عند السلة |
| E→F (7.10) | الطبقة العليا تنضغط | الورقة الأخيرة وحدها |
| F→G (8.40) | الكرة تعبر الحافة | نفس المسار من داخل السلة |

**التوقيت:** 1.70 + 1.30 + 1.50 + 1.20 + 1.40 + 1.30 + 1.60 = **10.00** — بلا فراغ، والصوت كذلك.

**الشوتات الأطول عن قصد:** A (تأسيس السلة) · C (الكادر الواسع الذي يثبت العلاقة المكانية) · G (الذروة). والشوتات الأقصر هي دورات الرفض الصرفة.
