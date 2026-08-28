# HX-ESCALATION — V2 — BASKET IN THE REAR CORNER

> **البنية:** أربعة شوتات، كل شوت **توليدة مستقلة**، لقطة واحدة متصلة بلا قطع داخلي
> **المدد:** A = 6.0s · B = 8.0s · C = 5.0s · D = 5.0s — **الإجمالي 24.0 ثانية**
> **المعيار:** CINEDANCE Bible v2.0 — Dimensional Hand-Painted Cinematic
> **التاقات:** `@loc_location-room-1` `@char_hixxa` `@hixa-face` `@desk` `@EAR`
> **موضع السلة:** على الأرض في **الزاوية الخلفية world-left** خلف كتفها الأيسر بنحو مترين ونصف، كما في مرجع اللوكيشن
> **القوس الشعوري:** سكون → أول ضربة → بناء متمهل → فشل متكرر → تحذير لا يُجاب

---

## الفرق عن V1

| | V1 | V2 |
|---|---|---|
| موضع السلة | بجوار المكتب، داخل مدى الذراع | الزاوية الخلفية world-left، على بعد ~2.5 م |
| نوع الرمية | قذفة قصيرة منخفضة القوس (~0.5 م) | **رمية كاملة فوق الكتف** بدوران جذع حقيقي وقوس عالٍ |
| مسار الكرة | يخرج من الكادر بسرعة | **يعبر بركة نور اللمبة ثم يعتم داخل ظل الزاوية** قبل الارتطام |
| الشوت A | 5.0s — يبدأ على إيقاع ثابت بالفعل | **6.0s — يبدأ من سكون كامل**، القلم مرفوع، وأول ضربة تحدث داخل الكادر |
| توزيع النوافذ في A | 15 / 78 / 100 | **30 / 80 / 100** — مساحة تنفس أطول قبل البناء |
| التصعيد | يبدأ فورًا | مؤجَّل إلى الشوت B، فيقرأ التصاعد أوضح |

الشوتات B و C و D متطابقة في البنية مع V1 عدا محور المكتب–السلة وفيزياء الرمية الطويلة.

---

## طريقة الاستخدام

انسخ **`SEQUENCE CONTRACT`** أولًا، ثم ألصق تحته **بلوك الشوت** المطلوب.

---

## SEQUENCE CONTRACT

```text
################################################################
HIXXA — ESCALATION SEQUENCE — SHARED CONTRACT
################################################################

SEEDANCE 2.5 — MULTI-REFERENCE R2V — 16:9 — 24 FPS
REAL-TIME MOTION — NO SLOW MOTION — NO SPEED RAMPS
EACH SHOT IS ONE CONTINUOUS TAKE WITH ONE FIXED LENS AND NO INTERNAL CUT

REFERENCE ASSIGNMENTS

@loc_location-room-1 controls the exact attic architecture, ceiling angles, wall treatment,
exterior window geometry, the rear corner geometry, floor material, the metal waste basket
standing in that corner and all fixed background objects.
It does not control the camera angle or the shot size.

@char_hixxa controls HIXXA's exact single full-body identity, skin tone, body proportions,
curls and layered wardrobe. Identity and wardrobe stay stable from every angle.
It does not control the camera angle, the shot size or her moment-to-moment expression.

@hixa-face reinforces only the face of that same single HIXXA.
It never creates a second person and never drifts between shots.

@desk controls the exact desk construction, proportions, surface material and existing prop
layout: the desk lamp, the phone, the coffee cup and the stack of unused sheets.
It does not add, remove or reposition any desk prop.

@EAR controls the exact black wired earbuds. HIXXA wears exactly one pair throughout,
both buds seated, one physically continuous cable on its established route.
They never vanish, multiply or change design.

WORLD AND STAGING

The desk stays world-right beneath the attic window, and HIXXA sits facing it.
The metal waste basket stands on the floor in the rear world-left corner of the room, roughly
two and a half metres behind her left shoulder, in the exact corner position established by
the location reference. It stays in shadow, outside the lamp's pool, for the whole sequence.

The throw axis therefore runs diagonally from her seated shoulder, back across the room,
into that corner. Every throw is a full over-shoulder throw with real trunk rotation and a
high travelling arc, never a short toss. Preserve this axis in every shot and never mirror,
rotate or rebuild the geography.

The desk lamp stays in its fixed position and is the dominant warm interior source; it never
moves, pulses or changes output. The phone lies flat on the desk with its music waveform
running. The coffee cup stays where it is.

STATE LADDER — PAPER

Every sheet follows one continuous physical path with no step skipped:
[in the existing stack] → [pulled out by hand] → [drawn on] → [visibly rejected]
→ [crushed into a ball inside her fist] → [thrown over her shoulder] → [landed in the basket].

No sheet, ball, mark or prop ever materialises. Nothing enters frame without a hand.

COUNTS

Exactly one HIXXA. Exactly one metal basket. Exactly one desk lamp, one phone, one coffee cup.
The basket holds exactly four crumpled balls at frame zero from earlier work.
Exactly three fresh sheets are consumed across the whole sequence.
The basket ends holding exactly six balls with a seventh released and still airborne;
it is partially filled at all times and never overflows, and clear empty volume stays visible
above the balls.
Every throw lands inside the basket. No ball misses, bounces out, or comes to rest on the
floor. Failed loose sheets accumulate only on the available desk surface; the floor stays clear.

CRUMPLING AND FLIGHT PHYSICS

Crushing is a real physical event, not a shape change. The sheet buckles from the corners
inward, the fibres fold into irregular angular facets rather than smooth curves, and the
result is never a clean sphere: it keeps sharp creased ridges, flat crushed planes and a
visible seam where the last fold closed. The ball springs back a few millimetres when the
fist opens.

Because the basket sits across the room, each throw is a genuine long flight: her trunk
rotates, her shoulder drives, her wrist releases at the top of the arc, and the ball travels
with believable mass on a rising then falling path. In flight it tumbles two or three times
around an off-centre axis, passes once through the lamp's pool of warm light, then darkens as
it crosses into the corner shadow. On landing it strikes thin metal with one bright ring
softened by distance, rocks once against the balls already there and settles.

MOOD AND RENDER CONTRACT

Preserve the established HIXXA dimensional hand-painted cinematic animation language.

The image is fully constructed in three-dimensional space: volumetric characters,
modeled facial planes, rounded body forms, dimensional architecture, real perspective,
physical occlusion, natural parallax and clear foreground-to-background separation.

Render every character and object with convincing sculptural volume comparable to
high-end 3D animation, while treating every visible surface through controlled
hand-painted illustration: clean illustrated shapes, softly brushed shading,
painterly color transitions, subtly drawn edges, tactile material variation and
restrained authored texture.

Skin, curls, plaid cotton, canvas apron, desk wood, paper fibre, graphite, thin painted
metal, glass and rubber cable remain materially distinct and physically dimensional.
Each crumpled ball is a genuinely volumetric object with faceted relief and its own contact
shadow, never a flat cut-out disc, and it holds that volume through the entire flight.

The deep corner of the room reads as real recedable space: the distance between the desk in
the foreground and the basket at the rear is carried by perspective, occlusion, falloff and
restrained atmospheric depth, not by scale alone.

The result feels like a richly hand-painted cinematic frame occupying real
three-dimensional space: never flat 2D, never a paper cutout, never photoreal live
action and never glossy plastic or toy-like CGI.

Maintain stable facial volume, eye size, curl mass, body proportions, wardrobe construction
and material response across every lens and angle in the sequence.

LIGHTING AND VISUAL CONTINUITY

The desk lamp is the dominant warm interior source and stays physically fixed.
A cooler cyan exterior sits beyond the attic window as the secondary source.
The rear corner holding the basket stays outside both pools and remains the darkest area of
the room in every shot. The world direction, color temperature, exposure, shadow placement
and time of day of all sources remain identical in all four shots.
Any apparent change in rhythm comes from her hand crossing the lamp's stable pool of light,
never from the fixture itself.

Warm directional light wraps her curls, cheek planes and knuckles; the cyan window edge
separates her silhouette from the room behind her; falloff toward the rear corner carries the
room's depth. Use soft directional shadow, stable contact shadows and restrained atmospheric
perspective to preserve sculptural volume and real dimensional depth.
Colors remain rich and controlled without neon glow or excessive saturation.

No flat 2D or paper-cutout motion. No photoreal live action. No glossy plastic or toy-like
CGI. No waxy skin, generic game-render materials, watercolor bleed, unmotivated neon
lighting, heavy grain or style drift between shots.

AUDIO

No dialogue, narration, lyrics, captions or subtitles. No added music track.
A faint muffled bleed of her own music escapes the earbuds throughout; the room stays
dominant. Room tone, graphite friction, dry paper crackle on every crush, the soft rush of a
ball crossing the room, and one distance-softened metal ring per landing.
Every sound begins only after its visible physical cause.

SEQUENCE-WIDE LOCKS

Preserve HIXXA's exact identity, facial structure, hairstyle, wardrobe layers, earbuds and
cable route, and correct anatomical left and right in every shot.
She never looks into the lens, never speaks and never turns to watch the basket.
The desk lamp never pulses. The window glass never distorts. The room architecture never
changes. No duplicated silhouette, no duplicated hands, no extra fingers or limbs.
No text, logo, caption, brand name, notification message, watermark or subtitle.
No time-lapse morphing, no crawling motion, no replay after a transition, no pose reset.
Every join between shots is an in-camera motivated event or a direct hard cut.
No generated fade, dissolve, wipe effect, morph, flash, blur transition or interstitial frame.
```

---

## SHOT A — STILLNESS BEFORE RHYTHM — 135mm — 6.0s

```text
################################################################
SHOT A — STILLNESS BEFORE RHYTHM
################################################################

135mm — 6.0 SECONDS — ONE CONTINUOUS COMPRESSED EXTERIOR WINDOW SHOT
VIEWED THROUGH REAL GLASS — NO CUT, NO LENS CHANGE

Frame zero already shows HIXXA at the desk inside the attic, compressed by the long lens and
seen through authentic window glass, with real exterior reflections layered over her.
Her pencil is raised and motionless above the page. She is not drawing yet.
The desk lamp, her raised hand and her silhouette stay spatially consistent with the room
established behind the glass.

0.00–1.80: stillness. She holds the pencil above the page and breathes twice, her shoulders
falling slightly on the second breath. Her gaze stays down on the paper. The exterior
reflections drift across the glass in one slow restrained movement. Nothing else in the frame
changes; no new object appears and the reflection never resolves into a second figure.

1.80–4.80: the first stroke lands, and the tempo builds from nothing. Each successive stroke
is a little faster and a little more weighted than the last, her hand beginning to pass in
and out of the lamp's stable pool of light. The lamp itself remains physically fixed and its
output never changes; the entire apparent rhythm comes from her hand repeatedly crossing that
illumination. Her forearm carries the build while her shoulder stays low and controlled — the
escalation is only beginning here, and never reaches its peak inside this shot.
Execute one restrained compressed push toward the window, preserving the window axis and the
real depth of the glass.

4.80–6.00: her hand completes one full stroke exactly as it enters the brightest part of the
lamp's pool, landing a clear visual synchronisation between the light and the drawing rhythm.
The camera settles completely and holds for the remainder.

The compressed long-lens perspective keeps three readable depth layers: the reflected exterior
on the glass surface, the glass itself, and HIXXA's dimensional body in the room beyond it.
The reflection never flattens her into the glass plane.

End on a clean usable hold with motion headroom, her hand at the brightest point of the pool
and the new tempo established but not yet urgent.

TRANSITION OUT — IN-CAMERA, NOT GENERATED
Allow one authentic exterior reflection to travel across the glass and cover the frame as a
motivated natural wipe into the attic interior. This is a real reflection moving on real
glass, photographed in camera. Do not synthesise a wipe, dissolve, morph, flash or any
overlay transition effect.

SHOT-SPECIFIC EXCLUSIONS
No cut within the shot, no whip-pan, no lens change, no pulsing or moving lamp fixture,
no distorted or warped glass, no duplicated silhouette, no altered room architecture,
no new object entering the reflection, no throwing action inside this shot.
```

---

## SHOT B — ESCALATING FAILURE LOOP — 24mm — 8.0s

```text
################################################################
SHOT B — ESCALATING FAILURE LOOP
################################################################

24mm — 8.0 SECONDS — ONE CONTINUOUS INTERIOR WIDE SHOT — NO CUT, NO LENS CHANGE

Frame zero already shows the full room staging in one wide: HIXXA seated at the desk
world-right with the existing stack of unused sheets within reach, and the metal basket
standing in the shadowed rear world-left corner holding exactly four crumpled balls from
earlier work. The lamp is fixed, the phone and coffee cup are undisturbed, and the complete
diagonal desk-to-corner throw axis is visible in frame.

0.00–1.20: she finishes the stroke she is already making, lifts the pencil and reaches toward
the existing stack with a tense micro-settle in her shoulders. No new object appears.

1.20–6.25: her workflow escalates through exactly three physically continuous cycles.

  CYCLE ONE — she pulls one sheet from the stack, draws across it with fast weighted strokes,
  stops, rejects it, crushes it in her fist, then rotates her trunk and throws it back over
  her shoulder toward the corner. The ball crosses the room on a high arc, passes once
  through the lamp's light, darkens into the corner shadow and rings the metal.
  The basket now holds five.

  CYCLE TWO — she pulls the next sheet, draws harder and faster, rejects it sooner, crushes it
  and throws again with more shoulder behind it. Second flight, second ring, second settle.
  The basket now holds six, still with clear empty volume above the balls.

  CYCLE THREE — she pulls the third sheet, draws with the most aggressive speed of the three,
  and stops mid-stroke. She begins to crush it.

She never turns to look at the basket; every throw is made blind, over the shoulder, from
muscle memory. Between cycles, two clearly failed loose sheets accumulate on the available
desk surface only. Her earbuds stay seated, the cable stays connected on its route, and
neither the phone nor the coffee moves at any point. Use only a restrained four percent push
or a short lateral drift, preserving the full staging and the throw axis for the whole shot.

6.25–8.00: she completes the crush on the third sheet and releases the fresh ball at the top
of her throwing arc. It leaves her hand travelling back across the room toward the corner
while her arm follows through and her trunk unwinds. The camera settles on the release. The
ball is still travelling at the final frame and is never frozen unnaturally in the air.

End with the ball airborne on the diagonal between her shoulder and the corner, exactly six
balls resting in the basket, two failed sheets on the desk and her arm at the end of its
follow-through.

HARD CUT ON THE PAPER BALL LEAVING HER HAND.

SHOT-SPECIFIC EXCLUSIONS
No cut within the shot, no lens change, no time-lapse morphing, no magically appearing paper,
no sheet pulled from outside the visible stack, no overflowing basket, no missed throw,
no ball bouncing out or resting on the floor, no floor clutter, no duplicated hands,
no disturbed desk objects, no fourth cycle, no head turn toward the basket.
```

---

## SHOT C — ATTIC-WINDOW ACCELERATION — 50mm — 5.0s

```text
################################################################
SHOT C — ATTIC-WINDOW ACCELERATION
################################################################

50mm — 5.0 SECONDS — ONE CONTINUOUS EXTERIOR WIDE SHOT — NO CUT, NO LENS CHANGE

Frame zero already shows the established building exterior with exactly one attic window
glowing warm and cyan. HIXXA is a small but clearly recognisable silhouette drawing at the
correctly positioned desk inside. The attic's window placement, ceiling angles, furniture
layout and internal architecture stay exactly as established.

0.00–0.75: the exterior is still. Her tiny silhouette finishes a drawing motion behind the
glass. No new object appears and no other window lights.

0.75–3.90: her silhouette draws at escalating speed, then her throwing arm loads and
accelerates back across the illuminated interior toward the unlit corner, her trunk rotating
with it. Shoulder rotation and arm force read clearly at this scale without her body
enlarging, stretching or distorting. Use only a restrained four percent push or a short
lateral drift, preserving the wide exterior staging and the established axis.

3.90–5.00: her arm reaches its fastest acceleration behind the glass. The warm and cyan attic
window remains the only illuminated opening on the whole building. The exterior camera
settles completely.

The wide exterior perspective keeps the building's real volume and roof geometry, with the lit
window reading as a deep opening into a dimensional room rather than a bright rectangle
painted on a flat facade. The far corner of that room stays dark behind her.

End on a clean usable hold with motion headroom around the attic window.

TRANSITION OUT — IN-CAMERA, NOT GENERATED
Begin one slow optically motivated telephoto push toward that same window, using the phone's
screen glow inside the room as the target. This is a continuous camera move, not an effect.
Do not synthesise a zoom blur, morph, flash, dissolve or overlay transition.

SHOT-SPECIFIC EXCLUSIONS
No cut within the shot, no lens change, no additional glowing windows, no changing building
geometry, no oversized or distorted silhouette, no object passing through the glass,
no reflection becoming a second figure, no visible ball leaving the building.
```

---

## SHOT D — UNANSWERED LOW-BATTERY WARNING — 90mm macro — 5.0s

```text
################################################################
SHOT D — UNANSWERED LOW-BATTERY WARNING
################################################################

90mm MACRO — 5.0 SECONDS — ONE CONTINUOUS CHARACTER CLOSE SHOT — NO CUT, NO LENS CHANGE

Frame zero already shows the phone screen in sharp foreground detail with HIXXA's unchanged
face, eye line and rapid drawing motion spatially readable behind it. She never looks toward
the phone and never touches it at any point.

0.00–0.75: the existing music waveform continues moving steadily on the screen while she
draws in the background. No new interface element appears.

0.75–3.90: one simple low-battery icon already present on the interface brightens and pulses
exactly once, then begins to fade. The waveform continues uninterrupted throughout,
confirming the music is still playing. Use a restrained micro-push and one motivated rack
focus travelling from her concentrated face to the phone warning.

3.90–5.00: the low-battery warning dims, unanswered. The waveform continues. HIXXA stays
absorbed in drawing with her eye line fixed on the paper. The camera settles completely.

The macro perspective preserves real surface relief and tactile separation between the glass
screen, the phone body edge and the desk wood beneath it, and the rack focus reveals genuine
depth between her face and the foreground device rather than sliding between flat planes.

End on the dim unanswered battery warning with the waveform still active and HIXXA still
drawing behind it. Hold cleanly for the next escalation beat.

SHOT-SPECIFIC EXCLUSIONS
No cut within the shot, no lens change, no brand name, no text, no logo, no notification
message, no second pulse, no hand reaching for the phone, no music stopping, no eye contact
with the phone or the lens, no facial-identity drift.
```

---

## أولويات التوليد

> Across the sequence, prioritise HIXXA's identity, accurate room and window continuity,
> visible paper causality, the exact basket fill level, the shadowed corner's depth,
> undisturbed phone and coffee, readable escalation and clean real-time motion over spectacle.

## فحص الاستمرارية

| الوصلة | آخر فريم | أول فريم بعدها |
|---|---|---|
| A→B | انعكاس حقيقي يعبر الزجاج ويغطي الكادر | داخل الغرفة، هي تنهي نفس الضربة |
| B→C | الكرة في الهواء على القطر نحو الزاوية | صورة خارجية، الذراع في نهاية اندفاعها |
| C→D | دفعة تليفوتو نحو الشباك مستهدفة وهج التليفون | الشاشة في المقدمة والوجه خلفها |

**السلة:** 4 كرات → 5 → 6 + واحدة في الهواء. كل رمية تدخل السلة، والأرض تفضل نضيفة.
