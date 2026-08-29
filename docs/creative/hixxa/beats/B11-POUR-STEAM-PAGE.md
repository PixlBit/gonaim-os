# HIXXA — POUR, STEAM, FRESH PAGE

> **المدة:** 8.0 ثوانٍ — **الشوتات:** 3 — **القطعات:** 2 — **برومبت واحد**
> **المعيار:** `HIXXA_MASTER_CANON_V4` — §6A · §6B · §6C · §6F · §6G(TIER 2) · §14B
> **التاقات:** `@char_hixxa` `@hixa-face` `@loc_location-room-1` `@desk`
> **الطقس:** صبّ → بخار → ورقة نظيفة — **بداية جديدة**

---

## الثغرة الوحيدة: من أين جاءت الورقة؟

الشوت B ينتهي على تجعيدة البخار، والشوت C يبدأ و**الورقة النظيفة محمولة فوق مساحة العمل بالفعل**. بين الفريمين التقطت ورقة — ولم يُكتب ذلك، فيقرؤه النموذج كـ**تجسّد ورقة في يدها**، وهو ما يمنعه البرومبت نفسه في سطره الأول.

القطعة عندك **مطابقة اتجاهية** (`FROM THE STEAM'S DIAGONAL TO THE PAPER MOVEMENT`)، وهي تسمح بقفزة زمنية صغيرة — لكن القفزة يجب أن تُعلن ويُذكر مصدر الورقة، وإلا صارت خرقًا لقانون التلامس.

**الحل المطبَّق:**

```
شوت B ينتهي بيدها تدخل الكادر من الأسفل متجهة إلى مكدّس الورق المعروف
  → المطابقة الاتجاهية تقع على هذه الحركة نفسها
  → شوت C يرث: «ورقة واحدة مأخوذة للتو من المكدّس المرئي، مستوية بين كفّيها»
```

فتصير القفزة **مسبَّبة ومُعلنة**، ويبقى المصدر معروفًا: `one sheet taken from the established visible stack`.

## الخطر الثاني: الشوت العلوي يسطّح الصورة

`35mm top-down planimetric` هي **أخطر زاوية على قفل المود**: المنظور العمودي يلغي الأفق والـparallax، فتقرأ الصورة كتصميم مسطّح — وهو بالضبط `flat 2D` الذي يمنعه §6G.

أُضيف سطر عمق محلي (§6C) خاص بها:

```
Even square to the surface, the frame stays dimensional: the mug and thermos keep visible
height and cast real contact shadows, her hands and forearms hold rounded volume above the
desk plane, and the sheet's edge lifts a hair before it settles.
```

## المدة

| الشوت | النافذة | المدة |
|---|---|---|
| A الصبّ | 0.00–3.00 | 3.00 |
| B البخار | 3.00–5.30 | 2.30 |
| C الورقة | 5.30–8.00 | 2.70 |

**المجموع 8.00.** الصبّ أطولها لأنه يحمل أكثر عدد من البيتات (ترقّب، ميل، صبّ، توقّف، اعتدال).

بنية `0–15 / 15–78 / 78–100` بتاعتك محفوظة كشكل داخلي — ترقّب، فعل، استقرار — لكن مكتوبة نثرًا لا كنظام زمن ثانٍ، منعًا لخلط الثواني بالنسب (§6F).

## ما اتصلح كمان

| المشكلة | التصحيح |
|---|---|
| **بلا `@` واحد** — «the exact character identity» بلا شخصية ولا مرجع | أربعة عناصر بحدود |
| **الترمس ليس في المكتبة** | وُضع تحت سلطة `@desk`، مع وصف مادي ومرساة مقياس. لو أضفت `@thermos` سيصير أقوى |
| بلا Mood / Lighting / Audio | الثلاثة مضافة |
| **البخار بلا إضاءة** — والبخار لا يُقرأ أصلًا إلا بضوء خلفي أو حافّي | نور الشباك خلف الكوب، والبخار يُرى بالانكسار لا بالتوهج |
| بلا بلوك اليدين | **حرج هنا تحديدًا:** اليد هي الكادر كله في الشوتات الثلاثة |

---

```text
################################################################
HIXXA — POUR, STEAM, FRESH PAGE
################################################################

SEEDANCE 2.5 — MULTI-REFERENCE R2V — 8.0 SECONDS — 16:9 — 24 FPS

CONTROLLED THREE-SHOT SEQUENCE — EXACTLY TWO DIRECT HARD CUTS
REAL-TIME MOTION — NO SLOW MOTION — NO SPEED RAMPS — NO VISUAL TRANSITIONS
EACH SHOT IS ONE UNINTERRUPTED MOVE WITH ITS OWN FIXED LENS

STORY OBJECTIVE

A quiet reset: she pours a drink, lets it settle, and lays down a clean sheet.

REFERENCE ASSIGNMENTS

@loc_location-room-1 controls the room geography, materials and the warm practical light.
It does not control the camera angle or the shot size.

@desk controls the exact desk, work surface and the existing prop layout, including the thermos,
the mug and the visible stack of clean sheets. It does not add, remove or reposition any prop.

@char_hixxa controls HIXXA's exact single identity, skin tone, body proportions, hands and
established wardrobe, including correct anatomical left and right.
It does not control the room, the lighting, the camera angle or her expression.

@hixa-face reinforces only the face of that same single HIXXA if it enters frame.
It never creates a second person.

All required objects already exist in the first frame. Nothing materialises, disappears,
duplicates or changes position without a visible physical cause.

HANDS

Her hands are a working artist's hands: five fingers with one opposing thumb, correct joint
count and proportion, natural knuckle relief and tendon lines, and grips that close with real
contact against what they hold. They are the subject of all three shots and must hold up at
detail and macro scale.

Dried paint is worn into the skin from long working days — soft pale blue and cyan along the
sides of the thumb and across the finger pads, a little dusty pink, cream flecks over the
knuckles. It is matte, faded and absorbed, following the skin's own creases and sitting under
the shading rather than on top of it. The fingernails stay clean bare nail: no colour on the
nail plate. The stains live on skin only, and they do not transfer to the thermos, the mug or
the paper.

PROPS AND SCALE

HIXXA is about 165 centimetres and her hand is the scale reference.

The thermos is an ordinary insulated flask, roughly as long as her forearm, held one-handed
around its body. The mug is an ordinary mug about the height of her palm, which her hand can
close around comfortably. One clean sheet is a little wider than her two hands set side by side.
Their designs, proportions and finishes never change between shots, and the liquid level only
ever rises during the pour and holds afterwards.

CONTINUITY

The desk geometry, the mug and thermos positions, the established pouring side and every
left-right relationship stay fixed across all three shots. The camera never mirrors the layout
to suit a frame.

The clean sheet in Shot C comes from the visible stack already on the desk. She takes it during
the directional match cut out of Shot B, which is why Shot B ends with her hand moving toward
that stack: the sheet is never in her hands before it is taken, and it never appears from
outside frame without a source.

################################################################
TIMELINE
################################################################

SHOT A — 0.00–3.00 — 50mm CONTINUOUS DETAIL

Frame zero already shows the mug resting firmly on the work surface with the thermos held above
it in one anatomically correct hand, on the established pouring side.

The shot opens on a readable anticipation and micro-settle, nothing new entering frame. The hand
then tilts the thermos and pours one coherent stream into the mug: credible wrist rotation,
liquid weight, accurate stream-to-mug contact and restrained fluid response, with the stream
staying attached to the spout and to the surface it lands on.

Use a five to eight degree micro-arc or at most a three percent push that never loses the
pouring contact point, with exactly one motivated rack focus between the spout and the rising
level.

The detail perspective preserves real surface relief and tactile separation between skin,
brushed metal, glazed ceramic and the liquid surface.

The mug reaches a practical working level well before any overflow; the stream narrows and stops
cleanly, then the thermos rotates upright while the wrist visibly absorbs its weight. Settle
completely for the last beat.

End with the thermos upright, the stream finished and the last drop falling toward the mug.

HARD CUT FOLLOWING THE LAST DROP.

SHOT B — 3.00–5.30 — 100mm MACRO, LOCKED

Inherit the same mug at the exact liquid level and desk position, on the same axis and lighting
direction. The camera is locked.

The hot surface settles after the pour with subtle residual motion while the existing steam
organises naturally; nothing new enters frame. Heat then drives one delicate stream of steam
upward, bending gradually with believable convection and staying visually attached to the hot
liquid rather than behaving like smoke or a solid ribbon. Allow only a two percent breathing
push and one motivated rack focus from the mug rim to the steam.

The macro perspective preserves real surface relief and tactile separation between the liquid
surface, the glazed rim and the air above it.

The liquid goes still and the steam resolves into one clean diagonal curl above the mug.
As it holds, her hand enters low in frame and moves off toward the established sheet stack.

End on that composition: the diagonal curl above the still surface, her hand travelling toward
the stack.

HARD CUT MATCHING THE STEAM'S DIAGONAL TO THE PAPER'S MOVEMENT.

FINAL SHOT — 5.30–8.00 — 35mm TOP-DOWN, CONTINUOUS OVERHEAD

Inherit one clean sheet taken from that visible stack, already held flat between both hands
above the working area. The mug and thermos keep their established positions and the work
surface stays planimetric and spatially consistent, with exact left-right hand geography.

Both palms and fingers stabilise the sheet on a readable anticipation and micro-settle. The
hands then lower and slide it into position with believable friction, coordinated pressure and
accurate fingertip contact, keeping it flat and structurally stable without stretching, folding
or changing dimensions. The camera may drift no more than six degrees while holding a true
overhead view.

Even square to the surface, the frame stays dimensional: the mug and thermos keep visible height
and cast real contact shadows, her hands and forearms hold rounded volume above the desk plane,
and the sheet's far edge lifts a hair before it settles flat.

The sheet arrives precisely centred in the working area; both palms release naturally and
withdraw symmetrically without disturbing it.

End square to the action on a held centred composition: one clean sheet centred and flat, the
mug and thermos untouched in their places, and both hands withdrawn to the frame edges.

################################################################
PHYSICS AND PERFORMANCE
################################################################

All movement is grounded and human: real grip pressure, wrist-led control of the thermos, the
forearm carrying its weight and a natural settle at the end of every action.

The liquid is a real fluid with weight: the stream holds together, meets the surface at the
correct point, raises the level in proportion to what has poured, and produces only restrained
surface motion. It never splashes out, never floats free of the spout and never separates into
droplets in mid-air. Nothing spills at any point.

Steam is hot air made visible, not smoke: it rises from the liquid, bends with convection,
thins as it climbs and never forms a solid ribbon, a second plume or a swirl on its own.

Paper stays stiff and flat: it slides on the desk with dry friction, resists a little, and
settles without stretching, folding, wrinkling or changing size.

No object moves before direct contact or a visible physical force.

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

Skin, brushed metal, glazed ceramic, the liquid surface, desk wood and paper fibre remain
materially distinct and physically dimensional. The liquid and the steam are hand-painted too:
shaped highlights and designed value groups rather than photoreal fluid simulation or
volumetric fog.

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
LIGHTING AND VISUAL CONTINUITY
################################################################

The room's established warm practical source stays dominant and unchanged. Its world direction,
colour temperature, exposure, shadow placement and time of day are identical across all three
shots and both cuts.

The mug sits so that the light comes from behind and slightly above it: the steam is legible
because it refracts and catches that light against a darker background, not because it glows.
The same light rakes the desk so the wood grain reads as relief, gives the metal a shaped
highlight rather than a mirror, and separates the clean sheet from the surface by shadow.

Use soft directional shadow, stable contact shadows and restrained atmospheric perspective.
Colours stay rich and controlled without neon glow or excessive saturation.

################################################################
AUDIO
################################################################

No dialogue, narration, lyrics, captions or subtitles. No music.

0.00–3.00: room tone, the small metallic shift of the thermos as it tilts, then a continuous
pour whose pitch rises as the mug fills — the clearest sign that the level is really changing —
narrowing to a last drop and one soft knock as the thermos returns upright.
3.00–5.30: near silence. Only room tone and the faintest settle of liquid. Steam makes no sound.
5.30–8.00: one sheet lifting from the stack, dry paper sliding across desk wood, and two soft
palm releases as her hands withdraw.

Every sound begins only after its visible physical cause.

################################################################
PRESERVATION LOCKS
################################################################

Only one HIXXA appears. Preserve her exact hands and anatomy: five fingers with one opposing
thumb, correct joint count, correct anatomical left and right, and no mirrored hands at any
camera angle. Her hands keep their worn dried paint stains and their clean unpainted nails.

Exactly one thermos, one mug and one clean sheet in play. Their designs, proportions and
finishes never change. The liquid level rises only during the pour and holds afterwards; it
never drops, refills or overflows.

The sheet comes from the visible stack and is never in her hands before it is taken.
Nothing materialises, disappears, duplicates or moves without a visible physical cause.

No spilled liquid, no floating stream, no droplets suspended in air, no second steam plume, no
fog, no artificial swirling, no sliding desk objects and no paper deformation.

Every angle change is a direct hard cut on a motivated physical event.
No fade, dissolve, wipe, morph, flash, blur transition, whip transition, animated overlay or
generated interstitial frame. No text, UI, logo, caption, subtitle or watermark.

Across the sequence, prioritise identity, topology, correct hand anatomy, liquid and steam
continuity, object permanence, accurate contact and clean real-time motion over spectacle.
```

---

## فحص الاستمرارية

| القطعة | آخر فريم | أول فريم بعدها |
|---|---|---|
| A→B (3.00) | الترمس معتدل والقطرة الأخيرة نازلة | نفس الكوب ونفس المستوى بالضبط |
| B→C (5.30) | تجعيدة البخار القطرية، ويدها متجهة إلى المكدّس | ورقة واحدة **مأخوذة للتو من نفس المكدّس**، مستوية بين كفّيها |

**التوقيت:** 3.00 + 2.30 + 2.70 = **8.00** — بلا فراغ، والصوت كذلك.

## سؤال عن موضع الكليب

هذا طقس **بداية**: شراب يُسكب وورقة نظيفة تُوضع في المنتصف. وهو يقرأ بقوة في موضعين مختلفين تمامًا:

- **قبل كل شيء** — افتتاح اليوم، والورقة النظيفة وعد.
- **بعد `B10`** — تستيقظ من على المكتب، والسلة ما زالت ممتلئة خلفها، فتبدأ من جديد. عندها تصير الورقة النظيفة **إصرارًا**، وهو أقوى.

الفرق الإخراجي الوحيد بينهما: هل السلة مرئية في الشوت العلوي وبأي مرحلة. قل أيهما وأضبطه.
