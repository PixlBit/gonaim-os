# B12 — نقل السلة المليانة (تمهيد المونتاج)

**HIXXA — FULL-BASKET RELOCATION PRELUDE**

| | |
|---|---|
| المسار | `SEEDANCE 2.5 — MULTI-REFERENCE R2V` |
| المدة | `10.00s` — **جيل واحد** |
| البناء | 5 شوتات · 4 قطعات · 16:9 · 24fps |
| التاقات | `@char_hixxa` · `@hixa-face` · `@loc_location-room-1` · `@desk` · `@basket` · `@EAR` |

## مكانه في السلسلة

يقع **مباشرة قبل** `B06-HYSTERICAL-MONTAGE.md`. السلة تبدأ في زاوية الغرفة البعيدة (موضعها في
`B03·V2`) وتنتهي على الأرض **خلف كرسيها بشوي على يمينها** — وهو بالظبط موضعها في `B06`، فيمشي
التسليم بلا قفزة. آخر فريم هنا (يدها تنقضّ على الورقة التالية) هو أول فريم للمونتاج.

## اللي اتظبط

### 1. المسار كان غلط — ودي كانت هتفشّل التوليد

البرومبت كان مكتوب `Use @char_hixxa as the strict first-frame and absolute spatial reference`.
ودي حاجتين مالهمش لازمة:

- **`@char_hixxa` مش صورة فريم أول** — هو عنصر مرجعي. كلمة `strict first-frame` بتخلي سيدانس
  يستنى صورة مش موجودة. المسار الصح `MULTI-REFERENCE R2V`، واتكتب صراحة
  `Do not use a first-frame image or a last-frame image`.
- **`@char_hixxa` مالوش سلطة على المكان ولا على السلة.** البرومبت كان بيقول إن تصميم السلة
  وأبعادها وعلاقتها بحيطان الزاوية «تفضل متسقة مع `@char_hixxa`» — ده خرق لعقد السلطة (§5).

### 2. `@basket` ماكانش مستدعى أصلاً

أهم إصلاح في الملف. السلة هي بطلة المقطع وماكانش ليها تاق. اتظبطت السلطة كده:

| العنصر | بيحكم |
|---|---|
| `@basket` | **جسم السلة** — تصميمها، الشبك، النِسَب، البلى، **ومرحلة الامتلاء** |
| `@loc_location-room-1` | **فين واقفة** — هندسة الزاوية والحيطان والمسافة من المكتب |
| `@char_hixxa` | الهوية والتشريح ويمين/شمال — **لا غير** |

### 3. مافيش زمن خالص

خمس شوتات وأربع قطعات و«10 ثواني» بدون ولا نافذة زمنية واحدة. اتضافت نوافذ متلاصقة تجمع 10.00:

| الشوت | النافذة | المدة | البيتات |
|---|---|---|---|
| 1 — DECISION | 0.00–1.60 | 1.60 | نظرة للزاوية + دفع الكرسي والنهوض |
| 2 — CROSSING | 1.60–3.80 | 2.20 | عبور الغرفة + الوقوف على مسافة ذراع |
| 3 — GRIP | 3.80–5.20 | 1.40 | إطباق الأصابع + أول ميل وشد |
| 4 — DRAG | 5.20–7.60 | 2.40 | السحب للخلف + تفاعل الورق |
| 5 — PLACEMENT | 7.60–10.00 | 2.40 | الوضع النهائي + الجلوس + الانقضاض على الورقة |

**الشوت الأخير كان محمّل بثمن بيتات في 2 ثانية** (وصول، شدة أخيرة، وضع، إفلات، استقرار الورق،
الجلوس، توجيه الانتباه، الهجوم على الورقة). اتقصّ لتلات بيتات واضحة، مع إبقاء استقرار الورق
تفصيلة داخل الشدة الأخيرة مش بيت مستقل — قاعدة الحمل مقابل المدة (§6F).

### 4. السماعتين — اتنين مش واحدة

البرومبت كان بيقول `earpiece` مفردة و`a single physical wire`. الـCanon و`B08`/`B09` بيقولوا
**سماعتين، واحدة في كل ودن، بكابل أسود واحد متصل**. اتنقل بلوك `B08` الحرفي، وبقى فيه قفل اللون
الأسود كمان (كان ناقص، وده فشل مرصود: السماعة بتطلع بيضا مودرن).

### 5. تعارض حقيقي مع الماستر — واتحلّ

§6E فيه بلوك بيقول عن السلة:

> `It is never held or moved, and its position is fixed for the whole film.`

والمقطع ده **كله** نقل للسلة. ده مش تناقض في الكتابة، ده قفل لازم يتخصّص: الغرض منه منع سيدانس
من تليبورت السلة بين الشوتات، مش منع مشهد نقل مقصود. الحل المسجّل في الماستر: **موضع السلة ثابت
داخل كل كليب إلا هذا الكليب، وحتى فيه لا تتحرك إلا بقبضة مرئية وتلامس أرضي متصل.**

### 6. الموضع النهائي اتصحّح

البرومبت كان بينهي بالسلة **جنبها** وفي متناول **ذراعها اليسرى**. مشكلتين:

- جدول هندسة الرمي في §6E بيقول عن «أمامها أو جانبها مباشرة»: **تجنّبه** — بيفرض رمية أمامية
  غير طبيعية أو عبور جسم.
- `B06` — اللي المقطع ده بيسلّم له — سلته **خلفها بشوي على يمينها**، وده كلامك انت.

فالسلة بتنزل في موضع `B06` بالظبط. السحب فضل باليد اليسرى زي ما كتبت (يد السحب مش يد الرمي).

### 7. الضغط — البرومبت كان أطول من اللازم بكتير

قفل ثبات السلة كان مكرر **خمس مرات** في خمس بلوكات، والسماعة أربع مرات، والورق أربع مرات، وفيه
بلوكين كاملين (`CONTINUITY AND PHYSICS LOCK` + `FINAL STATE LOCK` + `ABSOLUTE PRIORITIES`)
بيعيدوا نفس الكلام تالت وربع مرة. حسب §15 و§40A **الأقفال مش تراكمية** — التكرار بيولّد تشويش
مش التزام. كل قفل اتكتب **مرة واحدة** في بلوك `BASKET AND PAPER PHYSICS`، والحالة النهائية في
`OUTGOING CONTINUITY` وحدها.

### 8. الإضافات المعيارية

`HANDS` (تشريح + آثار ألوان على الجلد والأظافر نضيفة) · `SCALE` بمرساة نسبية ·
`MOOD AND RENDER CONTRACT` بـTIER 2 من الـMASTER VISUAL STYLE · `AUDIO TIMELINE` بنوافذ مطابقة.

### 9. حاجة صغيرة مهمة

`No handle may appear unless a handle physically exists in @char_hixxa` اتحوّلت لجملة حاسمة:
**السلة مالهاش يد ومش هتظهر لها يد**. الصيغة الشرطية بتفتح باب لسيدانس يخترع يد.

---

## البرومبت — انسخه كامل

```text
################################################################
HIXXA — FULL-BASKET RELOCATION PRELUDE

################################################################

SEEDANCE 2.5 — MULTI-REFERENCE R2V — 10.0 SECONDS — 16:9 — 24 FPS

CONTROLLED FIVE-SHOT SEQUENCE — EXACTLY FOUR DIRECT HARD CUTS
REAL-TIME MOTION — NO SLOW MOTION — NO SPEED RAMPS — NO VISUAL TRANSITIONS

################################################################
SCENE AND MODE
################################################################

Construct the starting shot from the assigned Elements. Do not use a first-frame image or a
last-frame image.

An irritated HIXXA stops drawing, crosses the real distance to the already-full wastebasket
standing in the room's far corner, grips its rim, and drags it back across the floor to her
throwing position behind her chair. The only thing that changes in this room is where that one
basket stands, and it changes only because she physically drags it.

Use exactly five coherent shots and four direct hard cuts. End on her hand attacking the next
sheet, as the direct action handoff into the hysterical drawing montage.

################################################################
REFERENCE ASSIGNMENTS
################################################################

Use @char_hixxa for one exact HIXXA: identity, face, proportions, skin tone, sculpted curly
high puff, wardrobe and anatomical left/right. It does not control the room, the furniture or
any prop. Use @hixa-face only to reinforce the same single face.

Use @loc_location-room-1 for the exact attic bedroom/studio topology: wall and corner geometry,
door position, window, shelf, bed, chair, floor material, desk-to-corner distance and the
lighting relationships. It governs WHERE the basket stands and how far it is; it does not
control the basket object itself, which belongs to @basket.

Use @desk for the exact worn desk and its established tool layout.

Use @basket for the exact wire-mesh wastebasket: its design, mesh construction, proportions,
wear and fill stage. Take its filled state from the reference stage that is packed to just
below the rim with no crown above it. Its empty reference state must not be reproduced as a
second object anywhere in this room.

Use @EAR for the two small old black wired earbuds and their single continuous cable.

No animal, weapon, tablet, monster or outdoor reference influences this generation.

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
EARBUDS
################################################################

HIXXA wears exactly TWO small vintage wired earbuds, one in each ear, seated exactly as in
@EAR, joined by one physically continuous black cable running down to the single phone.

Both earbud bodies and the whole cable are BLACK and stay unmistakably black under every
lighting condition. Highlights may brighten, but the material never reads as white, cream,
ivory, silver, pale grey or translucent. When lighting makes the colour ambiguous, take it from
@EAR rather than from generic earbud priors. They are never enlarged into headphones, never
given a headband or ear cups, and never become wireless earbuds or a headset.

Because she stands, walks quickly, bends, drags and sits again, the cable may sway with delayed
secondary motion and settle — but it stays one continuous object across every cut, and never
passes through her neck, clothing, arms, the chair, the desk or the basket.

################################################################
SCALE
################################################################

HIXXA is about 165 centimetres and her hand is the scale reference.

The wire-mesh basket is knee-high beside her seated position, about 25 centimetres across the
rim and 28 tall — her hand closes over its rim with fingers wrapping well past the metal. Each
crumpled ball inside is about 8 centimetres, under a third of that inner width, and at this
size the basket packed to just below the rim holds roughly thirty of them.

################################################################
WORLD AND AXIS MAP
################################################################

The desk stands against its established wall with HIXXA seated at it. The full basket stands on
the floorboards in the far corner of the room, hard against the two adjoining walls, with its
own contact shadow. It is not beside the door and not beside the desk.

There is exactly one basket in this room and exactly one in this video.

Hold one consistent action axis for the whole clip: CORNER → CHAIR. She walks out along it and
drags back along it, and screen direction never reverses.

The distance is real and must read as real: the corner is a walk away, not a reach away. Never
shorten it, never let the camera make the basket suddenly closer, and never let the basket move
before her hand is on it.

Her destination is the established throwing position: on the floor SLIGHTLY BEHIND HER CHAIR
AND TO HER ANATOMICAL RIGHT, low enough that its rim sits far below the desk surface. She does
not place it in front of her or directly at her side.

################################################################
STARTING CONTINUITY
################################################################

HIXXA sits at @desk mid-drawing with a failed sheet in front of her, both earbuds in, the cable
running down to the phone. The basket stands full and upright in the far corner, untouched. The
chair is pulled in. Nothing in the room is moving.

################################################################
SHOT TIMELINE
################################################################

SHOT 1 — 0.00–1.60 — 65mm FRONT THREE-QUARTER CLOSE — DECISION

HIXXA's drawing hand stops on the sheet. Her eyes cut sharply from the failed drawing across
the room toward the full basket in the corner, and she exhales through a tightened jaw.

She plants her right hand flat on the desk and pushes the chair back with her legs, rising. The
chair carries real weight and scrapes against the floor.

The basket stays completely still, and nothing inside it moves while it is untouched.

HARD CUT ON THE CHAIR'S BACKWARD SCRAPE.

SHOT 2 — 1.60–3.80 — 24mm LOW REAR THREE-QUARTER TRACKING — CROSSING

Inherit her rise mid-motion. She takes quick irritated steps away from the desk toward the
corner. The camera tracks behind her at knee height along the same axis, holding desk, walking
HIXXA and corner basket in one readable depth relationship so the distance is unmistakable.

Her feet carry believable weight transfer and floor contact. Her curls and the earbud cable
trail one beat behind her without exaggeration.

She closes the distance and comes to a stop within natural arm's length of the basket before
reaching for it. No stretched limbs, no reaching from across the room, no basket sliding to
meet her.

HARD CUT ON HER LEFT HAND STARTING DOWN TOWARD THE RIM.

SHOT 3 — 3.80–5.20 — 85mm TIGHT FLOOR-LEVEL INSERT — THE GRIP

Inherit her descending left hand. Her fingers close one after another around the exposed near
section of the metal rim until the grip is complete and load-bearing. She grips the rim only —
she does not touch the paper and does not reach inside. No handle exists on this basket and
none appears.

She tilts it a few degrees and takes the first pull. The lower rim stays in contact with the
floor. The mesh flexes very slightly under her grip and the packed weight, and the top layer of
paper shifts a beat late toward the trailing side without leaving the basket.

HARD CUT ON THE FIRST SCRAPE OF METAL ACROSS THE FLOOR.

SHOT 4 — 5.20–7.60 — 28mm LOW LATERAL TRACKING — THE WEIGHTED DRAG

Inherit that first scrape. HIXXA walks briskly backward toward the desk, dragging the same full
basket by its rim with her left hand. The camera tracks laterally alongside the basket's real
floor path.

The basket reads heavy: its lower edge scrapes continuously across the floorboards, the mesh
vibrates faintly with the floor texture, and the basket trails slightly behind her hand rather
than staying locked to her arm. It stays upright and in contact with the floor for every frame
— it never bounces, rolls, hovers or leaves the ground.

Inside, the crumpled balls jostle against each other, compress toward the trailing side on
acceleration, and resettle after each correction. Their motion is local and physical, and the
pile keeps the same volume and density throughout.

Her backward footwork stays balanced. The basket clears the existing furniture without
colliding with it or passing through it.

HARD CUT AS THE BASKET REACHES THE CHAIR AREA.

SHOT 5 — 7.60–10.00 — 35mm DESK-SIDE WIDE THREE-QUARTER — PLACEMENT AND RETURN

Inherit the basket arriving on the same floor trajectory with no jump in position. One last
short controlled pull sets it upright on the floor slightly behind the chair on her anatomical
right, and she releases the rim only once it has completely stopped. She never lifts it.

The packed paper gives one final small settling shift and goes still, still filled to just
below the rim with nothing spilled.

She drops back into the chair and her attention snaps to the drawing surface. Her frustration
does not release between actions.

End on her drawing hand attacking the next sheet — the direct handoff into the montage.

################################################################
BASKET AND PAPER PHYSICS
################################################################

The basket moves ONLY through her visible grip and continuous floor drag, along one unbroken
trajectory: CORNER → GRIP → FLOOR DRAG → CHAIR AREA → FINAL PLACEMENT. It never teleports,
duplicates, jumps ahead along that path, moves before it is touched, or appears near the desk
early. Its design, scale, orientation and mesh construction stay identical from first frame to
last.

The pile keeps the same quantity and density from beginning to end. No new paper appears, none
disappears, none spills, floats, unfolds, multiplies or flattens. Every piece stays an ordinary
irregular hand-crumpled ball of cream drawing paper with wrinkles, graphite smudges and
occasional restrained colour fragments — never a flat sheet, never neatly folded, never
origami, never a creature, and never other rubbish. Each ball carries its own fold pattern;
balls resting together never repeat each other's creases.

@desk, the chair after its initial push, the bed, shelf, door, phone, mug and every other object
in the room stay exactly where they are. Only HIXXA, the chair during that push, the dragged
basket and its reacting contents move.

################################################################
LIGHTING AND AUDIO
################################################################

Hold the room's stable warm lighting and its established shadow direction across all five
shots. No colour shift, no flicker, no lighting change of any kind.

Music continues underneath from her earbuds. Synchronize the chair scrape, quick irritated
footsteps, fingers meeting metal, a dry mesh rattle, the weighted metal-on-floor drag, paper
rustling inside it, the basket's final stop, her body settling into the chair, and one sharp
first pencil scratch. No dialogue, narration, lyrics, captions or subtitles.

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

HIXXA is seated at @desk with her hand already on the next sheet, both earbuds in and the cable
settled. The same single basket now stands upright on the floor slightly behind her chair on
her anatomical right, still packed to just below the rim with no crown above it, nothing
spilled. The far corner is empty. The room is otherwise unchanged.

################################################################
AUDIO TIMELINE
################################################################

0.00–1.60: room tone under the music bed, her pencil stopping, one sharp exhale, the chair
scraping backward.
1.60–3.80: quick irritated footsteps crossing the room, fabric movement, the steps slowing to
a stop.
3.80–5.20: fingers meeting metal, a dry mesh rattle, packed paper shifting, the first scrape
of the rim on the floor.
5.20–7.60: a continuous weighted metal-on-wood drag, faint mesh vibration, paper rustling and
resettling inside.
7.60–10.00: the drag stopping short, one last settle of paper, her body dropping into the
chair, and one sharp pencil scratch on the final beat.
```
