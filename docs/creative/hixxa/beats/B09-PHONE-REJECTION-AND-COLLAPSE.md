# HIXXA — PHONE REJECTION AND COLLAPSE

> **المدة:** 12.0 ثانية — **الشوتات:** 7 — **القطعات:** 6 — **برومبت واحد**
> **المعيار:** `HIXXA_MASTER_CANON_V4` — §6A · §6B · §6E · §6F · §6G · §14A · §14B
> **التاقات:** `@char_hixxa` `@hixa-face` `@EAR` `@basket` `@bag` `@desk` `@loc_location-room-1`
> **السلة:** `@basket` **STAGE 4** — مكوّمة حتى الحافة، المرحلة الأخيرة، من الفريم الأول
> **الشوتان الجديدان:** 6 رأسها على المكتب · 7 الكادر الواسع الختامي

---

## الشوتان الجديدان

**SHOT 6 — رأسها على المكتب.** بعد رمي التليفون مباشرة. الذراعان تنطويان على الخشب والرأس ينزل عليهما، والعينان تُغمضان. الكابل والسماعتان ما زالتا في قبضتها اليسرى، فيتدلّى من الطاولة. هذا هو **الانهيار**: لم تعد ترفض ورقة، هي توقفت.

**SHOT 7 — الكادر الواسع.** الغرفة كلها في لقطة واحدة: رأسها على المكتب، **السلة مكوّمة حتى الحافة**، الأوراق حول المكتب، التليفون اختفى في اتجاه السرير، والصمت. هذا الكادر هو **حصيلة اليوم كله في صورة واحدة** — ولهذا وجب أن تكون السلة في مرحلتها الأخيرة، لأنها هي البطل الصامت في الكادر.

## المدة: 12 ثانية

| الشوت | النافذة | المدة |
|---|---|---|
| 1 نزع السماعتين | 0.00–1.60 | 1.60 |
| 2 لمّ الكابل | 1.60–3.00 | 1.40 |
| 3 فصل القابس | 3.00–4.60 | 1.60 |
| 4 الرمية | 4.60–6.10 | 1.50 |
| 5 الطيران | 6.10–8.00 | 1.90 |
| **6 الرأس ينزل** | 8.00–10.20 | **2.20** |
| **7 الكادر الواسع** | 10.20–12.00 | **1.80** |

**المجموع 12.00**، بلا فراغ. الشوتان الأخيران أطول لأن الأداء الوجداني يحتاج تنفسًا (§6F).

**لو أردت 10 ثوانٍ:** أنظف تنازل هو **دمج لمّ الكابل في نهاية الشوت الأول** — تُلغى نافذة كاملة وتبقى السلسلة الميكانيكية سليمة. قل وأنفّذها.

---

## ⚠️ ترتيب السلسلة يحتاج قرارك

طلبك «السلة مليانة على آخرها» يكشف تعارضًا في الترتيب:

| الكليب | السلة | نهايته |
|---|---|---|
| `B08` موت البطارية | **STAGE 2** | يدها ترتفع نحو السماعة |
| `B06` المونتاج الهستيري | **STAGE 3 → 4** | السلة مكوّمة |
| **`B09` هذا** | **STAGE 4** | تبدأ بنزع السماعتين |

`B08` ينتهي بيدها مرتفعة نحو السماعة، و`B09` يبدأ بنزعها — فيبدو أنهما متتاليان. **لكن حينها تكون السلة STAGE 2 لا 4.**

**الترتيب الذي يحل ذلك وهو أقوى دراميًا:**

```
B08 موت البطارية → يدها ترتفع نحو السماعة … ثم تنزل وتعود للرسم
  → B06 الهياج بلا موسيقى (السلة تُملأ حتى الحافة)
  → B09 الآن فقط تنزعها فعلًا، وتنهار
```

الرفض الأخير أن تتوقف — قبل أن تتوقف. هذا يحتاج تعديلًا صغيرًا على نهاية `B08`: **تصل يدها إلى السماعة ثم تنزل وتعود للورقة** بدل أن تقف عند حافة النزع. قل وأنفّذه.

---

## ما اتصلح كمان

| المشكلة | التصحيح |
|---|---|
| **بلا مدة** — خمس شوتات بنسب فقط | نوافذ بالثواني متلاصقة |
| `@char_hixxa` يحكم «room-topology, furniture-layout, desk-to-bed geography, lighting» | **تسرب أدوار:** الغرفة لـ`@loc`، المكتب لـ`@desk`، السرير والشنطة لـ`@bag`+`@loc` |
| `@basket` مذكور في سطر التاقات بلا سلطة ولا مرحلة | سلطة كاملة + **STAGE 4** |
| قفل الأسود مكرر بقائمة مرادفات مرتين | مرة واحدة |
| بلا Mood / Lighting / Audio | الثلاثة مضافة — **والصمت هنا موروث: التليفون ميت فلا تسريب موسيقى** |
| «SHOT 1 begins exactly from @char_hixxa 1» — مرجع شخصية ليس فريمًا أول | وُضّح: مسار `Strict I2V` بفريم أول، والمراجع تحكم الهوية |

---

```text
################################################################
HIXXA — PHONE REJECTION AND COLLAPSE
################################################################

SEEDANCE 2.5 — STRICT FIRST-FRAME I2V — 12.0 SECONDS — 16:9 — 24 FPS

CONTROLLED SEVEN-SHOT SEQUENCE — EXACTLY SIX DIRECT HARD CUTS
REAL-TIME MOTION — NO SLOW MOTION — NO SPEED RAMPS — NO VISUAL TRANSITIONS

ACTION CHAIN

Both black earbuds out → left hand gathers one loose cable loop → left hand unplugs the jack
while the right hand holds the phone → right hand throws the disconnected dead phone → the
same black-screen phone flies toward the bed and bag with less than one rotation → she folds
her arms on the desk and puts her head down → the room holds in one wide.

START STATE

Start exactly from the first frame, which is the authority for room topology, furniture layout,
the desk-to-bed geography, lighting and every established material.

She has already stopped drawing. The phone is dead and black, still plugged into the earbuds.
Rejected sheets lie across the desk, and the wastebasket behind her right side is packed to its
rim — this is the end of a long day, not the middle of one. There is no music anywhere in this
clip.

REFERENCE ASSIGNMENTS

@loc_location-room-1 controls the exact room topology, furniture layout, the desk-to-bed
geography, wall and floor materials, permanent light and the floor position of the wastebasket.
It does not control the camera angle or the shot size, and it does not control the bag object,
which belongs entirely to @bag.

@desk controls the exact desk, chair and work surface with its existing prop layout.
It does not add or reposition any desk prop.

@char_hixxa controls HIXXA's exact single full-body identity, skin tone, body proportions,
curls and established wardrobe. It does not control the room, the furniture, the lighting, the
camera angle or her moment-to-moment expression.

@hixa-face reinforces only the face of that same single HIXXA.
It never creates a second person and never drifts between shots.

@EAR controls the earbud assembly completely: two small vintage wired earbuds, the inline
control, the visible repair-tape section, the cable and the 3.5mm plug, with their exact scale,
material character and colour. It does not control anything else in frame.

@bag controls the bag COMPLETELY and is its only authority: the exact shape and proportions,
the leather grain and colour, the stitching along every seam, the flap, the strap and the point
where the strap meets the body, the buckle and every piece of metal hardware, the edge wear and
the way the leather creases where it has been carried.

@loc_location-room-1 also shows a bag lying on the bed, but that reference supplies only WHERE
it lies and how the blanket sits under it. The object itself always comes from @bag. Where the
two disagree, or where the room reference is too small, too soft or too low in detail to read a
feature, @bag WINS: take the feature from @bag, never from the room reference, never invented
and never averaged between the two. It is never simplified into a generic featureless bag
shape, and its small details are never dropped because it sits in the background.

In this clip it lies OPEN on the bed with its opening facing the room. It stays where it lies
and is never moved, closed or duplicated.

@basket controls the exact metal mesh wastebasket: the wire weave, rolled rim, solid base and
the way crumpled paper sits inside it. The reference shows four fill levels side by side; this
clip is STAGE 4 throughout — heaped to the upper rim, the final level, with no room left.
It never places more than one wastebasket in the room and never shows the four-bin sheet
itself. It does not control the camera angle.

HANDS

Her hands are a working artist's hands: five fingers with one opposing thumb, correct joint
count and proportion, natural knuckle relief and tendon lines, and grips that close with real
contact against what they hold.

Dried paint is worn into the skin from long working days — soft pale blue and cyan along the
sides of the thumb and across the finger pads, a little dusty pink, cream flecks over the
knuckles. It is matte, faded and absorbed, following the skin's own creases and sitting under
the shading rather than on top of it. The fingernails stay clean bare nail: no colour on the
nail plate. The stains live on skin only.

HAND OCCUPANCY

The logic never changes and no hand performs two incompatible actions at once:
her anatomical LEFT hand removes both earbuds, gathers and controls the loose cable, and grips
the rigid plug housing to disconnect it; her anatomical RIGHT hand grips the phone, keeps it
stable through the unplug, and throws it. After the throw the left hand still holds the earbuds,
cable and loose plug. No hand swapping between cuts and no mirrored anatomy at any camera angle.

EARBUDS AND CABLE

Exactly TWO small old-fashioned wired earbuds, both BLACK, on one continuous BLACK cable with
one dark inline control, one visible repair-tape section and one 3.5mm plug — a single physical
assembly. They stay unmistakably black under every angle and lighting condition; specular
highlights may brighten but the material never reads as white, cream, beige, ivory, pale grey,
silver or translucent. Black is a hard prop attribute, not a lighting interpretation.

They are never AirPods, wireless earbuds, headphones, a headset or ear cups, and never gain a
headband.

The cable never duplicates, disappears, splits, switches sides, stretches elastically, shortens,
knots itself, or passes through her face, hands, clothing, the desk or the phone. Its slack
responds to gravity, hand movement and inertia. The inline control and the repair tape keep
their exact positions along it.

The plug stays physically seated in the same phone until the unplug in shot 3, and stays
completely separated from it afterwards.

PHONE

The same single phone throughout. Its screen stays completely black and inactive: no wake, no
notification, no interface, no glow. It is never duplicated and its case is never redesigned.
It carries no cable at all from the moment it is unplugged.

SCALE

HIXXA is about 165 centimetres and her hand is the scale reference.
The phone is an ordinary one-hand phone, no longer than her palm plus a finger joint; it is not
a tablet. The earbuds are small enough to sit inside the bowl of her ear. The wastebasket is
knee-high beside her seated position, and each crumpled ball is just under a third of its inner
width.

################################################################
TIMELINE
################################################################

SHOT 1 — 0.00–1.60 — 70mm TIGHT FRONT THREE-QUARTER

Frame zero holds every visible object, count, hand side, screen direction, clothing layer,
hairstyle and material as established.

Her left hand rises and catches both earbuds, pulling them free in one quick coordinated
movement. They clear her ears almost together, still attached to the same cable. She does not
rip or overstretch the wire. The movement reads as immediate frustration, not careful removal.
Restrained acceleration follows the gesture, then settles.

Keep the face fully dimensional through stable cheek volume, nose projection, jaw structure,
eyelid depth and natural light wrapping.

End with both black earbuds fully out and dangling from her closed left fist, still connected
to the phone, the cable swinging.

HARD CUT ON THE CABLE SWING.

SHOT 2 — 1.60–3.00 — 85mm MACRO DETAIL

Inherit the earbuds out and the swing decaying. Do not reset them into her ears.

The same left hand catches one loose section of cable and forms a single imperfect loop around
her fingers — impatient but mechanically readable, never a perfect automatic coil and never a
knot that ties itself. The inline control and the repair-tape section stay exactly where they
are along the cable.

Use a restrained five to eight degree micro-arc or a three percent push, never losing the cable
contact point, with one rack focus only.

The macro perspective preserves real surface relief and tactile separation between skin, black
rubber, the tape's matte edge and the desk beneath.

End with one loose loop controlled in the left hand and the plug still visibly seated in the
phone.

HARD CUT ALONG THE CABLE LINE TOWARD THE PLUG.

SHOT 3 — 3.00–4.60 — 60mm MACRO DETAIL

Inherit the controlled loop. Her right hand now grips the same black-screen phone and holds it
stable.

Her left fingers slide off the cable and pinch the rigid plug housing itself — not the flexible
cable — and pull the jack straight out of the port with the small real resistance of a jack
releasing. The cable is never pulled from a distance and never stretches.

Same restrained micro-arc or push, one rack focus from the seated connection to the freed plug.

End on unmistakable separation with visible air between them: her right hand holds only the
dead phone, her left holds the two earbuds, the cable and the loose plug.

HARD CUT AS HER RIGHT ARM LOADS TOWARD THE BED.

SHOT 4 — 4.60–6.10 — 28mm WIDE

Inherit the clean separation. Her left hand keeps the earbuds and cable clear of the throw path
for the whole shot.

Her right shoulder and forearm load the short diagonal, then accelerate and release the dead
phone once along the established desk-to-bed line. Her torso follows through naturally but she
stays beside the chair: she does not step toward the bed and does not chase it.
Use only a restrained four percent push or a short lateral drift, preserving the full room
staging and the desk-to-bed axis.

End with the phone airborne and fully clear of the desk edge, her left hand still holding the
cable behind her.

HARD CUT ON THE PHONE'S AIRBORNE ROTATION.

SHOT 5 — 6.10–8.00 — 65mm TELEPHOTO

Inherit the exact velocity, orientation and spin. The phone is not relaunched and its direction
is not altered.

The same black-screen phone travels one clean ballistic arc through compressed depth, turning
less than one full rotation across the whole visible flight. It follows gravity and the
inherited release velocity only: no mid-air acceleration, no hovering, no steering and no
attraction toward the bag. The open bag is the clear destination in depth, with the burgundy
blanket beneath it as the landing zone.

Use one slow motivated focus pull or a restrained lateral drift, then settle.

End with the phone descending over the burgundy blanket, aligned naturally toward the bag
opening and still airborne.

HARD CUT ON THE DARK PHONE SILHOUETTE MATCHING THE BAG OPENING.

SHOT 6 — 8.00–10.20 — 50mm MEDIUM

Inherit her body still turned from the throw, her right arm at the end of its follow-through
and the earbuds and cable in her closed left fist.

Her arm comes down. She turns back to the desk and stops, looking at nothing. Then she folds
both forearms onto the desk wood among the rejected sheets and lowers her head onto them, face
turned aside, eyes closing. The left fist stays closed on the earbuds so the cable and the loose
plug hang over the desk edge and swing once before going still.

Her shoulders drop on one long breath out. Nothing else in the room moves.
Use only a restrained push or a short lateral drift, then settle completely.

End with her head down on her forearms, eyes closed, the cable hanging still from her closed
left fist.

HARD CUT ON HER SHOULDERS SETTLING.

FINAL SHOT — 10.20–12.00 — 24mm WIDE

Inherit her exact posture. The camera is back at full room width and does not move.

The whole day is in one frame: HIXXA face down on her forearms at the desk, rejected sheets
across the surface around her head, the wastebasket on the floor behind her right side heaped
to its rim with no room left, the bed and the open bag in depth with the phone gone into that
direction, and the cable hanging motionless from her closed fist.

The wide framing carries real depth between her at the desk, the packed wastebasket on the
floor and the bed beyond, so the room reads as one continuous space rather than layered planes.

End on a locked stable frame with nothing moving except the slow rise and fall of her back.

################################################################
PHYSICS AND PERFORMANCE
################################################################

All movement is grounded and human: real grip pressure, believable wrist and shoulder mechanics,
trunk follow-through on the throw, and a body that decelerates through joints rather than
stopping dead.

The cable behaves as one real length of rubber-sheathed wire: it swings with inertia, decays
naturally, bends and never becomes rigid or elastic. The jack releases with a short physical
resistance, not a slide. The phone has real mass in flight and follows gravity alone.

Her collapse onto the desk is weight, not a pose: the forearms take the load, the sheets beneath
them shift and crease slightly, the chair takes her shifted weight, and her curls settle after
her head does.

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

Skin, curls, plaid cotton, canvas apron, desk wood, paper fibre, black rubber cable, phone
glass, leather and woven wire mesh remain materially distinct and physically dimensional.
Each crumpled ball in the wastebasket is a genuinely volumetric object with faceted relief and
its own fold pattern; balls resting together never repeat each other's creases.

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

The room's established practical source remains dominant and unchanged. Its world direction,
colour temperature, exposure, shadow placement and time of day stay identical across all seven
shots and every cut.

The phone screen is dead and emits nothing at any point; it is lit only by the room.
In the final wide, light falls across the desk and her lowered head while the wastebasket on the
floor sits lower in the room's natural falloff, its packed paper catching just enough light to
read as many separate objects rather than one mass.

Use soft directional shadow, stable contact shadows and restrained atmospheric perspective.
Colours stay rich and controlled without neon glow or excessive saturation.

################################################################
AUDIO
################################################################

No dialogue, narration, lyrics, captions or subtitles. There is no music anywhere in this clip:
the phone is dead and nothing bleeds from the earbuds.

0.00–3.00: room tone, larger than it should be. Two small taps as the earbuds leave her ears,
the cable swinging through air, then rubber sliding across her fingers.
3.00–4.60: the short mechanical release of the jack leaving the port.
4.60–6.10: cloth snapping on the throw and the phone passing through air.
6.10–8.00: air alone, thinning as the phone travels away from camera.
8.00–10.20: the chair taking her weight, forearms landing on wood, sheets creasing under them,
one long breath out, then the cable swinging once and going still.
10.20–12.00: room tone only, and her breathing.

Every sound begins only after its visible physical cause.

################################################################
PRESERVATION LOCKS
################################################################

Only one HIXXA appears. Preserve her exact face, body proportions, skin tone, hair mass,
wardrobe and anatomy. Her hands keep their five-finger anatomy, their worn dried paint stains
and their clean unpainted nails, and every object keeps the size given above.

Exactly two black earbuds, one continuous black cable with one inline control, one repair-tape
section and one 3.5mm plug, and exactly one phone.
The plug stays connected until shot 3 and completely separated afterwards.
No cable stretching, teleportation, duplication or self-tying knot. No hand swapping, no
mirrored anatomy, no phone duplication, no repeated release and no repeated unplugging.

The wastebasket is heaped to its rim from the first frame to the last: it never empties, never
gains room, never spills, never moves and never duplicates. No new paper is thrown in this clip.

The phone screen stays black throughout and never wakes.
No object resets between shots and the room topology never drifts.

Every angle change is a direct hard cut on a motivated physical event.
No fade, dissolve, wipe, morph, flash, blur transition, whip transition, animated overlay or
generated interstitial frame. No text, UI, logo, caption, subtitle or watermark.

ENDPOINT

A locked wide frame: HIXXA face down on her forearms at the desk with her eyes closed, the
earbud cable hanging motionless from her closed left fist, rejected sheets around her head, the
wastebasket packed to its rim behind her right side, and the bed and open bag in depth with the
phone gone into that direction. Nothing moves except her breathing.
```

---

## فحص الاستمرارية والزمن

| القطعة | آخر فريم | أول فريم بعدها |
|---|---|---|
| 1→2 (1.60) | السماعتان خارج الأذنين والكابل يتأرجح | نفس التأرجح وهو يخمد |
| 2→3 (3.00) | لفة واحدة في القبضة والقابس مركّب | نفس اللفة، اليمنى تمسك التليفون |
| 3→4 (4.60) | فصل تام وهواء بين الاثنين | نفس الفصل، الذراع تُحمَّل |
| 4→6.10 | التليفون في الهواء خارج حافة المكتب | نفس السرعة والدوران |
| 5→6 (8.00) | التليفون ينزل فوق البطانية | نفس الجسد بعد الاندفاع |
| 6→7 (10.20) | الرأس على الساعدين والكابل ساكن | نفس الوضع في الكادر الواسع |

**التوقيت:** 1.60 + 1.40 + 1.60 + 1.50 + 1.90 + 2.20 + 1.80 = **12.00** — بلا فراغ، والصوت كذلك.
