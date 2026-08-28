# HIXXA — ESCALATING DRAWING → LOW BATTERY → POWER LOSS

> **البنية:** خمسة شوتات، كل شوت **توليدة مستقلة**، لقطة واحدة متصلة بلا قطع داخلي
> **المدد:** 1 = 8.0s · 2 = 4.0s · 3 = 4.0s · 4 = 5.0s · 5 = 6.0s — **الإجمالي 27.0 ثانية**
> **المعيار:** `HIXXA_MASTER_CANON_V4` — §6A · §6B · §6E · §6F · §14A
> **التاقات:** `@char_hixxa` `@hixa-face` `@ear` `@basket` `@desk` `@loc_location-room-1`
> **السلة:** `@basket` **STAGE 2** — بين `B05` (فارغة → كرة واحدة) و`B06` (STAGE 3 → 4)

---

## الفجوة الأولى: كيف يرث الشوت الشوت الذي قبله؟

البرومبت يقول: **«Every following shot must continue from the physical endpoint of the previous shot»** — لكنه لا يقول **بأي آلية**. الشوت الأول `Strict I2V` من `@[Image 6]`، أما الشوتات 2–5 فليس لها فريم أول ولا مراجع هوية، فلا شيء يضمن الاستمرارية عمليًا.

**الحل المطبَّق:** كل شوت يعلن مساره صراحة.

| الشوت | المسار | الفريم الأول |
|---|---|---|
| 1 | `STRICT FIRST-FRAME I2V` | `@[Image 6]` |
| 2–5 | `STRICT FIRST-FRAME I2V` | **آخر فريم من الشوت السابق** |

وهذه هي الطريقة الوحيدة التي تجعل «لا تُعِد الحالة» أمرًا قابلًا للتنفيذ لا مجرد رجاء.

## الفجوة الثانية: بلا مدة

خمسة شوتات بنسب مئوية بلا زمن. النسبة بلا مدة لا تنتج إيقاعًا. المدد المقترحة حسب حمل كل شوت:

| الشوت | المدة | لماذا | `0–15%` | `15–78%` | `78–100%` |
|---|---|---|---|---|---|
| 1 الهياج | **8.0s** | يحمل دورات رسم ورفض متعددة | 0.00–1.20 | 1.20–6.24 | 6.24–8.00 |
| 2 التحذير | **4.0s** | حدث واحد: نبضة واحدة | 0.00–0.60 | 0.60–3.12 | 3.12–4.00 |
| 3 التجاهل | **4.0s** | نظرة، رفض، تسارع | 0.00–0.60 | 0.60–3.12 | 3.12–4.00 |
| 4 الموت | **5.0s** | الانقطاع والتجمّد | 0.00–0.75 | 0.75–3.90 | 3.90–5.00 |
| 5 الصمت | **6.0s** | الأداء الوجداني يحتاج تنفسًا | 0.00–0.90 | 0.90–4.68 | 4.68–6.00 |

النسب هي الصيغة داخل البرومبت كما كتبتها؛ الثواني للتحقق من الإيقاع قبل الصرف.

## الفجوة الثالثة: بلا عناصر

`@[Image 6]` وحده مسؤول عن الهوية والغرفة والسلة والسماعة معًا. في الشوتات 2–5 لا يوجد فريم أول من الصورة، فتضيع الهوية. أُضيفت ستة عناصر بحدود، ويبقى الفريم الأول أعلى سلطة على البيئة في الشوت 1.

---

## ⚠️ تناقض عبر السلسلة يحتاج قرارك

| الملف | السماعة |
|---|---|
| هذا البرومبت | **سماعتان** صغيرتان سلكيتان سوداوان |
| `B06` المونتاج | **سماعة واحدة** (`the same small vintage wired earpiece`) |
| الـMaster `PART I §19` | **سماعتا أذن صغيرتان** وكابل واحد مستمر |

اثنان من الثلاثة يقولان **سماعتين**. مشيت على السماعتين هنا، **وأقترح توحيد `B06` عليهما** — قل وأعدّله.

---

## ما اتصلح كمان

| المشكلة | التصحيح |
|---|---|
| قفل الأسود مكرر بقائمة مرادفات في أربعة مواضع | مرة واحدة في بلوك `EARBUDS` |
| بلا Mood / Lighting | مضافان |
| صوت في الشوت 4 فقط | تايم لاين صوتي لكل شوت — والصمت المفاجئ لا يُقرأ إلا إذا كان ما قبله مكتوبًا |
| `motion blur` كمحفّز انتقال | وُصف كـ**قطع مباشر على مغادرة الكرة للحافة**؛ الـblur طبيعي داخل الشوت لا مؤثر انتقال |
| محفّز 3→4 ملتبس (الإيماءة تتوقف مع انقطاع الكهرباء، والانقطاع في الشوت 4) | القطع يقع **والإيماءة ما زالت مستمرة**، والتوقف يحدث داخل الشوت 4 |
| اتجاه الرمي غير محدد | **نفضة خلفية-يمينية** وفق جدول §6E |

---

## SEQUENCE CONTRACT

انسخ هذا البلوك أولًا، ثم ألصق تحته بلوك الشوت المطلوب.

```text
################################################################
HIXXA — ESCALATING DRAWING → LOW BATTERY → POWER LOSS
SHARED CONTRACT
################################################################

SEEDANCE 2.5 — 16:9 — 24 FPS
REAL-TIME MOTION — NO SLOW MOTION — NO SPEED RAMPS — NO VISUAL TRANSITIONS
EACH SHOT IS ONE CONTINUOUS TAKE WITH ONE FIXED LENS AND NO INTERNAL CUT

ACTION CHAIN

Frantic drawing escalates → rejections accumulate → a low-battery warning pulses once →
HIXXA glances and ignores it → drawing speed increases → the phone dies → screen and waveform
go black → music cuts instantly → her drawing hand freezes → she slowly looks up → her jaw
tightens → her right hand begins rising toward one earbud.

REFERENCE ASSIGNMENTS

@loc_location-room-1 controls the exact room topology, architecture, materials, permanent light
and the floor position of the wastebasket. It does not control the camera angle or the shot size.

@desk controls the exact desk, chair position, work surface and existing prop layout including
the phone, the drawing tools and the sheet stack. It does not add or reposition any desk prop.

@char_hixxa controls HIXXA's exact single full-body identity, skin tone, body proportions,
curls and established wardrobe. It does not control the room, the desk, the lighting, the
camera angle or her moment-to-moment expression.

@hixa-face reinforces only the face of that same single HIXXA.
It never creates a second person and never drifts between shots.

@ear controls the earbuds completely: their small vintage wired design, their scale, their
seating in the ears, their material character, the inline control, the cable attachment point
and thickness, and their exact colour. It does not control anything else in frame.

@basket controls the exact metal mesh wastebasket: the wire weave, rolled rim, solid base, its
proportions and the way crumpled paper sits inside it. The reference shows four fill levels
side by side; this sequence uses only STAGE 2 — partially filled, a believable accumulation
resting on the base, nowhere near the rim. It never places more than one wastebasket in the
room and never shows the four-bin sheet itself. It does not control the camera angle.

HANDS

Her hands are a working artist's hands: five fingers with one opposing thumb, correct joint
count and proportion, natural knuckle relief and tendon lines, and grips that close with real
contact against what they hold.

Dried paint is worn into the skin from long working days — soft pale blue and cyan along the
sides of the thumb and across the finger pads, a little dusty pink, cream flecks over the
knuckles. It is matte, faded and absorbed, following the skin's own creases and sitting under
the shading rather than on top of it. The fingernails stay clean bare nail: no colour on the
nail plate. The stains live on skin only.

EARBUDS

HIXXA wears exactly TWO small vintage wired earbuds, one in each ear, seated exactly as in
@ear, joined by one physically continuous black cable running to one single phone with the
same inline control, the same attachment point and the same side as the reference.

Both earbud bodies and the whole cable are BLACK and stay unmistakably black under every
lighting condition. Highlights may brighten, but the material never reads as white, cream,
ivory, beige, silver, pale grey or translucent, and never becomes modern white plastic. When
lighting makes the colour ambiguous, take it from @ear rather than from generic earbud priors.

They are never enlarged into headphones, never given a headband or ear cups, and never become
wireless earbuds or a headset.

The cable hangs under gravity and may sway with delayed motion during frantic drawing and head
movement, but it stays one continuous object: it never disappears, duplicates, teleports,
switches sides, detaches from the phone, stretches elastically, or passes through her face,
neck, clothing, arms or the desk.

Both earbuds stay seated in her ears for the entire sequence, including after the phone dies.
Losing power stops the audio electronically; it does not disconnect the cable.

PHONE

There is exactly one phone, and it powers the earbuds and the music throughout.

Before power loss its screen shows only a restrained functional playback state — a simple
moving music waveform — plus the specified simple low-battery icon. No branding, no app logo,
no readable brand text, no notifications and no unrelated interface.

When the battery dies the screen goes completely black, the waveform disappears and the earbud
audio stops, all in the same instant, with no fade, no gradual volume reduction and no shutdown
animation. The screen never comes back on afterwards, and the phone stays physically present
and still plugged in.

WORLD, PAPER AND THROW

The wastebasket stands on the floor slightly behind HIXXA and to her anatomical right, on a
short rear-right diagonal past the back corner of her chair. This is a body-relative
world-space position, not a screen position: camera angles may place it anywhere on screen, and
her anatomical right stays her anatomical right at every camera position.

It is partially filled with ordinary hand-crumpled paper balls at @basket STAGE 2 — a believable
accumulation from a long session, nowhere near the rim. It never empties, never fills to the
rim, never duplicates, never changes scale or position, and never gains paper on its own.
Everything inside it is inert crumpled paper: no origami, no creatures, no faces, no living
paper, no flat sheets, no tools or foreign objects.

Every rejected sheet comes from a physically visible sheet on the desk, is visibly crushed by
hand, and is thrown with the same motion: a low release beside her hip and a short rear-right
flick, without turning around and without looking at the wastebasket.

Every drawn mark appears only under direct pencil contact, and no mark continues after contact
ends.

SCALE

HIXXA is about 165 centimetres and her hand is the scale reference.
The phone is an ordinary one-hand phone, no longer than her palm plus a finger joint; it is not
a tablet. The earbuds are small enough to sit inside the bowl of her ear. Each crumpled ball is
roughly a quarter of the wastebasket's inner width. The wastebasket is knee-high beside her
seated position.

MOOD AND RENDER CONTRACT

Preserve the established HIXXA look: cinematic sculptural 3D animation with true volumetric
form, depth, parallax and spatial lighting, finished entirely with controlled hand-painted
digital surfaces and softly illustrated edges. Never flatten into 2D/cel art and never drift
into glossy PBR, plastic CGI or photorealism.

Skin, curls, plaid cotton, canvas apron, desk wood, paper fibre, graphite, phone glass, black
rubber cable and woven wire mesh remain materially distinct and physically dimensional.
Each crumpled ball is a genuinely volumetric object with faceted relief and its own contact
shadow, never a flat cut-out disc.

CRITICAL DISTINCTION: the world is dimensional, the drawings are not. Every drawing on every
sheet exists only as flat graphite bonded to a dimensional sheet — no thickness, no volume, no
lift, no shadow of its own — and none of them ever animates or reacts.

LIGHTING AND VISUAL CONTINUITY

The room's established practical source remains dominant and unchanged. Its world direction,
colour temperature, exposure, shadow placement and time of day stay identical across all five
shots and every cut.

The phone screen is a small secondary source lighting only the near desk surface and the
underside of her fingers. When the phone dies that small light disappears with it, and the
desk loses exactly that much illumination and no more — the room's own light does not change,
dim or shift colour at power loss.

Use soft directional shadow, stable contact shadows and restrained atmospheric perspective.
Colours stay rich and controlled without neon glow or excessive saturation.

SEQUENCE-WIDE LOCKS

Only one HIXXA appears. Preserve her exact face, body proportions, skin tone, hair mass,
wardrobe and anatomy. Her hands keep their five-finger anatomy, their worn dried paint stains
and their clean unpainted nails, and every object keeps the size given above.

Exactly one phone, one cable, two earbuds and one wastebasket.
No duplicated sheets, no duplicated objects, no hand mirroring, no room-topology drift, and no
sheet or ball that appears without being handled.
No text, UI beyond the specified waveform and battery icon, logo, caption, subtitle or watermark.
Each shot is one continuous take. No fade, dissolve, wipe, morph, flash, blur transition, whip
transition, animated overlay or generated interstitial frame.
```

---

## SHOT 1 — ESCALATING DRAWING FRENZY — 24mm — 8.0s

```text
################################################################
SHOT 1 — ESCALATING DRAWING FRENZY
################################################################

STRICT FIRST-FRAME I2V — FIRST FRAME IS @[Image 6] — 8.0 SECONDS
24mm — ONE CONTINUOUS WIDE SHOT — NO CUT, NO LENS CHANGE

START STATE

Start exactly from the first frame and hold every visible object, object count, hand side,
screen direction, clothing layer, hairstyle, environment topology and material design.
The wastebasket is already partially filled with rejected crumpled papers. Both black wired
earbuds are already seated in her ears and connected to the same phone.

0–15%: a readable continuation of the work rhythm already in progress. Nothing is created
spontaneously; the mess on the desk is the mess she has already made.

15–78%: her rhythm accelerates through a repeating physical loop — draw, correct, reject, pull
the next sheet from the visible stack, resume immediately. Her strokes gain weight and speed,
her shoulders tighten, and rejected sheets accumulate across the available desk area only.
The desk becomes visibly messier while its topology stays consistent, and the wastebasket stays
partially filled. Use only a restrained four percent push or a short controlled lateral drift,
preserving the full room staging, the desk axis, the wastebasket relationship, the chair and
phone positions and her left-right anatomy.

78–100%: she rejects one fresh attempt hard, crushes it in her hands and flicks it back and to
her right. Settle on the endpoint.

End with the newly crumpled ball leaving the desk edge on a physically readable rear-right
trajectory, still airborne, and her hand already returning toward the stack.

AUDIO

Room tone under everything, with a thin muffled bleed of her music from the earbuds.
Pencil strokes that shorten and harden as the rhythm accelerates, sheets dragged and snapped,
one dry crush at the end and the small sound of the ball leaving the wood.

HARD CUT ON THE BALL LEAVING THE DESK EDGE.
The motion blur on that release is natural in-camera blur inside the shot, not a transition
effect; do not generate a blur, streak or wipe across the cut.

SHOT-SPECIFIC EXCLUSIONS
No cut within the shot, no whip-pan, no lens change, no sheet or ball appearing without being
handled, no overflowing wastebasket, no floor clutter, no room-topology drift.
```

---

## SHOT 2 — LOW-BATTERY WARNING — 90mm macro — 4.0s

```text
################################################################
SHOT 2 — LOW-BATTERY WARNING
################################################################

STRICT FIRST-FRAME I2V — FIRST FRAME IS THE FINAL FRAME OF SHOT 1 — 4.0 SECONDS
90mm MACRO PHONE DETAIL — ONE CONTINUOUS SHOT — NO CUT, NO LENS CHANGE

START STATE

Inherit the exact phone, cable and playback state from the end of Shot 1. Nothing resets.
The same phone is still powering the same two black wired earbuds.
This is a device-detail shot, not a facial close-up: HIXXA stays present and drawing behind the
focal plane but is never the subject.

0–15%: the existing playback state is stable, the waveform moving steadily.

15–78%: a simple minimal low-battery icon appears on the interface and performs exactly one
restrained pulse while the waveform continues uninterrupted beneath it. There is no brand
identity, no text explanation and no percentage animation. HIXXA does not interact with the
phone. Use a restrained three percent micro-push toward the battery indicator and at most one
motivated focus adjustment, keeping the phone body, screen plane and cable connection
physically coherent.

78–100%: the warning dims slightly, still unanswered, while playback continues. Settle.

The macro perspective preserves real surface relief and tactile separation between the screen
glass, the phone body edge, the black cable and the desk wood beneath them.

End with the battery icon dim but still visible and the waveform still moving.

AUDIO

Her music bleeding from the earbuds continues without interruption, room tone beneath it, and
her pencil still working off frame. No alert tone: the warning is visual only.

MATCH CUT ON THE WARNING SHAPE TO HER MOVING PENCIL.
This is a direct hard cut holding the same shape across the join, with no morph, dissolve or
blend.

SHOT-SPECIFIC EXCLUSIONS
No orbit, no cut, no lens change, no second pulse, no brand name, no text, no logo, no
notification message, no hand reaching for the phone, no music interruption.
```

---

## SHOT 3 — SHE IGNORES THE WARNING — 65mm — 4.0s

```text
################################################################
SHOT 3 — SHE IGNORES THE WARNING
################################################################

STRICT FIRST-FRAME I2V — FIRST FRAME IS THE FINAL FRAME OF SHOT 2 — 4.0 SECONDS
65mm TIGHT THREE-QUARTER — ONE CONTINUOUS SHOT — NO CUT, NO LENS CHANGE

START STATE

Inherit the active but unanswered battery warning, the continuing music and her drawing rhythm.
Frame both her face and her active drawing hand.

0–15%: the frantic drawing rhythm already established continues without change.

15–78%: her eyes flick toward the phone for half a beat — eyes only, no head turn, no hand
leaving the work. She dismisses it immediately, her eyes snap back to the page, and her hand
accelerates past its previous speed. The performance reads as "I don't have time for this"
without dialogue: a brief tightening at the brow, then nothing but work.
Use restrained camera acceleration only to support the eye-line transition, preserving the
established axis.

78–100%: her eyes are locked back on the page and her drawing hand is moving faster than
before. Settle for the final fifteen percent.

Keep the face fully dimensional through stable cheek volume, nose projection, jaw structure,
eyelid depth and natural light wrapping.

End as she fully recommits to the drawing, her head carrying a small rhythmic motion with the
music she is still hearing.

AUDIO

The music bleed and room tone continue unchanged. Pencil strokes harden and quicken.
Her breathing is short and working, not yet frustrated.

HARD CUT WHILE HER HEAD IS STILL MOVING WITH THE MUSIC.

SHOT-SPECIFIC EXCLUSIONS
No cut inside the shot, no whip-pan, no lens change, no full head turn toward the phone, no
hand reaching for the device, no dialogue, no lip movement.
```

---

## SHOT 4 — PHONE DIES, MUSIC CUTS — 75mm — 5.0s

```text
################################################################
SHOT 4 — PHONE DIES, MUSIC CUTS
################################################################

STRICT FIRST-FRAME I2V — FIRST FRAME IS THE FINAL FRAME OF SHOT 3 — 5.0 SECONDS
75mm CHARACTER CLOSE — ONE CONTINUOUS SHOT — NO CUT, NO LENS CHANGE

START STATE

Inherit her maximum drawing rhythm and the small rhythmic head motion still running with the
music. The phone is still connected to both black earbuds.

0–15%: the maximum rhythm continues; her head is still moving with the track.

15–78%: the battery reaches zero and the phone dies instantly. The screen goes completely
black, the waveform disappears and the earbud audio stops — all in the same single frame, with
no fade, no gradual reduction and no shutdown animation. Her head rhythm stops on the next
frame. Her drawing hand pulls up short and freezes about one centimetre above the paper with
the stroke unfinished; no line appears after the pencil leaves contact.
Use a restrained micro-push and one motivated focus change from the abruptly stopped hand to
her face.

78–100%: hard stillness. Settle completely.

End with her hand frozen roughly one centimetre above the paper, the unfinished stroke visible
beneath it, the phone screen fully black and both earbuds still in her ears.

AUDIO

At power loss the music goes to absolute zero in one frame. What remains is faint room tone,
the smallest movement of clothing, and the established environmental ambience — nothing else.
The silence must feel unnaturally large against the rhythm that preceded it, and nothing is
added to fill it.

HARD CUT ON THE STILLNESS.

SHOT-SPECIFIC EXCLUSIONS
No cut, no lens change, no fade-out of the music, no shutdown animation, no screen coming back
on, no cable detaching, no earbud falling out, no line continuing without contact.
```

---

## SHOT 5 — IRRITATED SILENCE — 50mm — 6.0s

```text
################################################################
SHOT 5 — IRRITATED SILENCE
################################################################

STRICT FIRST-FRAME I2V — FIRST FRAME IS THE FINAL FRAME OF SHOT 4 — 6.0 SECONDS
50mm MEDIUM-WIDE — ONE CONTINUOUS SHOT — NO CUT, NO LENS CHANGE

START STATE

Inherit the exact frozen endpoint: her hand a centimetre above the paper, the stroke unfinished,
the phone black and dead but still connected, both black earbuds still seated in her ears, and
the cable hanging almost still. The drawing motion does not restart at any point.

0–15%: complete post-power-loss stillness. Only her breathing moves.

15–78%: she lifts only her eyes, slowly. Her jaw tightens. The expression travels through
confusion, then realisation, then annoyance — each stage readable, none performed for camera.
The room reads as suddenly far too quiet. The cable hangs nearly motionless.
Use only a restrained four percent push or a short controlled lateral drift, preserving the
full desk staging, the phone and wastebasket positions and the room geography.

78–100%: her anatomical right hand begins rising toward one earbud and stops just short of
touching it. She does not remove it. Settle completely.

End on a clean stable frame with her right hand entered into the earbud-removal zone and
stopped before contact, both earbuds still in place, the phone still black, and her drawing
hand still exactly where it froze.

AUDIO

Room tone alone, and larger than it should be. One long breath out through her nose partway
through. The faintest cloth movement as her hand rises. No music, no alert, no ambience added
to soften the silence.

CUT ON THE HAND ENTERING FRAME TOWARD THE EAR.

SHOT-SPECIFIC EXCLUSIONS
No cut inside the shot, no lens change, no restarted drawing, no earbud removed, no screen
resurrection, no music returning, no dialogue.
```

---

## فحص الاستمرارية

| الوصلة | آخر فريم | أول فريم بعدها |
|---|---|---|
| 1→2 | الكرة تغادر حافة المكتب وهي في الهواء | ماكرو على التليفون، نفس حالة التشغيل |
| 2→3 | أيقونة البطارية خافتة والموجة تتحرك | نفس التحذير النشط، وجهها ويدها في الكادر |
| 3→4 | رأسها يتحرك مع الموسيقى ويدها في أقصى سرعة | نفس الإيقاع، والانقطاع يحدث داخل الشوت |
| 4→5 | اليد متجمدة على سنتيمتر من الورق والشاشة سوداء | نفس التجمّد بالضبط |

## ترتيب السلسلة

| | السلة |
|---|---|
| `B05` أول رفض | فارغة → كرة واحدة |
| **`B08` هذا** | **STAGE 2** — تراكم معقول |
| `B06` المونتاج الهستيري | STAGE 3 → STAGE 4 |

فهذا الكليب يقع **بين الاثنين** زمنيًا، وهو أيضًا **سبب** ما يليه: انقطاع الموسيقى هو ما يفتح الباب للهياج.
