# HIXXA — ESCALATING DRAWING → LOW BATTERY → POWER LOSS

> **المدة:** 10.0 ثوانٍ — **الشوتات:** 5 — **القطعات:** 4 — **برومبت واحد، توليدة واحدة**
> **المعيار:** `HIXXA_MASTER_CANON_V4` — §6A · §6B · §6E · §6F · §14A
> **التاقات:** `@char_hixxa` `@hixa-face` `@ear` `@basket` `@desk` `@loc_location-room-1`
> **السلة:** `@basket` **STAGE 2** — بين `B05` (فارغة → كرة واحدة) و`B06` (STAGE 3 → 4)

---

## تصحيح: برومبت واحد لا خمسة

النسخة السابقة قسمته إلى خمس توليدات مستقلة بـ27 ثانية. **هذا خطأ قراءة:** عناوين `SHOT` داخل برومبتاتك هي **بنية القطع داخل الكليب الواحد**، لا كليبات منفصلة. أُعيد إلى **توليدة واحدة، 10 ثوانٍ، خمسة شوتات، أربع قطعات**.

وهذا يغيّر شيئًا جوهريًا: لم يعد كل شوت يحتاج فريمًا أول ولا وراثة معلنة — **الاستمرارية داخلية لأنها داخل كليب واحد**، والفريم الأول واحد للكليب كله من `@[Image 6]`.

## توزيع العشر ثوانٍ

| الشوت | النافذة | المدة | لماذا |
|---|---|---|---|
| 1 الهياج | 0.00–2.60 | 2.60 | يحمل الرفضة والرمية |
| 2 التحذير | 2.60–4.00 | 1.40 | حدث واحد: نبضة واحدة |
| 3 التجاهل | 4.00–5.40 | 1.40 | نظرة ورفض وتسارع |
| 4 الموت | 5.40–7.40 | 2.00 | الانقطاع والتجمّد |
| 5 الصمت | 7.40–10.00 | 2.60 | الأداء الوجداني يحتاج تنفسًا |

**المجموع 10.00 بالضبط**، بلا فراغ.

### ما اضطررت لتحويله من فعل إلى حالة

في 2.60 ثانية لا تتسع دورات «draw → correct → reject → grab next → resume» المتعددة. لذلك **تراكم الأوراق الفاشلة صار حالة في الفريم الأول لا فعلًا يُؤدى**: الفوضى على المكتب موجودة أصلًا لأنها من جلسة طويلة سابقة، والشوت الأول ينفّذ **رفضة واحدة** فقط.

هذا يحفظ الإحساس الذي تريده — «هي في نصف نوبة من زمان» — بلا حشو زمني.

---

## ⚠️ تعارض عبر السلسلة يحتاج قرارك

| الملف | السماعة |
|---|---|
| هذا البرومبت | **سماعتان** صغيرتان سلكيتان سوداوان |
| `B06` المونتاج | **سماعة واحدة** |
| الـMaster `PART I §19` | **سماعتان** وكابل واحد مستمر |

اثنان من ثلاثة يقولان سماعتين. مشيت عليهما، **وأقترح توحيد `B06`**.

## ما اتصلح كمان

| المشكلة | التصحيح |
|---|---|
| **بلا مدة** — نسب مئوية فقط | نوافذ بالثواني، ولا تُخلط الصيغتان (§6F) |
| **بلا عناصر** — `@[Image 6]` وحده يحمل الهوية والغرفة والسلة والسماعة | ستة عناصر بحدود، والفريم الأول يبقى أعلى سلطة على البيئة |
| قفل الأسود مكرر بقائمة مرادفات في أربعة مواضع | مرة واحدة |
| صوت في الشوت 4 فقط | تايم لاين كامل — والصمت المفاجئ لا يُقرأ إلا إذا كان ما قبله مكتوبًا |
| `motion blur` كمحفّز انتقال | قطع مباشر على مغادرة الكرة؛ الـblur طبيعي داخل الشوت |
| محفّز 3→4 ملتبس | القطع يقع **والإيماءة مستمرة**، والتوقف داخل الشوت 4 |
| اتجاه الرمي غير محدد | **نفضة خلفية-يمينية** وفق §6E |

---

```text
################################################################
HIXXA — ESCALATING DRAWING → LOW BATTERY → POWER LOSS
################################################################

SEEDANCE 2.5 — STRICT FIRST-FRAME I2V — 10.0 SECONDS — 16:9 — 24 FPS

CONTROLLED FIVE-SHOT SEQUENCE — EXACTLY FOUR DIRECT HARD CUTS
REAL-TIME MOTION — NO SLOW MOTION — NO SPEED RAMPS — NO VISUAL TRANSITIONS

ACTION CHAIN

Frantic drawing → one more rejection → a low-battery warning pulses once → HIXXA glances and
ignores it → drawing speed increases → the phone dies → screen and waveform go black → music
cuts instantly → her drawing hand freezes → she slowly looks up → her jaw tightens → her right
hand begins rising toward one earbud.

START STATE

Start exactly from the first frame. Hold every visible object, object count, hand side, screen
direction, clothing layer, hairstyle, environment topology and material design.

She is already mid-session and already frustrated: rejected sheets are scattered across the
desk, the fresh stack is visibly reduced, and the wastebasket is already partially filled.
That accumulation is inherited state, not something performed during this clip. Both black
wired earbuds are already seated in her ears and connected to the same phone, and her music is
already playing.

REFERENCE ASSIGNMENTS

The first frame is the authority for room topology, desk layout, chair position, bed position,
lighting, materials and every established prop. The references below govern identity and the
specific objects named, and none of them overrides the first frame on the environment.

@loc_location-room-1 controls the exact room topology, materials, permanent light and the floor
position of the wastebasket. It does not control the camera angle or the shot size.

@desk controls the exact desk, work surface and existing prop layout including the phone, the
drawing tools and the sheet stack. It does not add or reposition any desk prop.

@char_hixxa controls HIXXA's exact single full-body identity, skin tone, body proportions,
curls and established wardrobe. It does not control the room, the desk, the lighting, the
camera angle or her moment-to-moment expression.

@hixa-face reinforces only the face of that same single HIXXA.
It never creates a second person and never drifts between shots.

@ear controls the earbuds completely: their small vintage wired design, their scale, their
seating in the ears, their material character, the inline control, the cable attachment point
and thickness, and their exact colour. It does not control anything else in frame.

@basket controls the exact metal mesh wastebasket: the wire weave, rolled rim, solid base and
the way crumpled paper sits inside it. The reference shows four fill levels side by side; this
clip uses only STAGE 2 — partially filled, a believable accumulation resting on the base,
nowhere near the rim. It never places more than one wastebasket in the room and never shows
the four-bin sheet itself. It does not control the camera angle.

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
same inline control, attachment point and side as the reference.

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

Both earbuds stay seated in her ears for the entire clip, including after the phone dies.
Losing power stops the audio electronically; it does not disconnect the cable.

PHONE

There is exactly one phone, and it powers the earbuds and the music throughout.
Before power loss its screen shows only a simple moving music waveform plus the specified
simple low-battery icon: no branding, no app logo, no readable brand text, no notifications and
no unrelated interface.

When the battery dies the screen goes completely black, the waveform disappears and the earbud
audio stops, all in the same single frame, with no fade, no gradual volume reduction and no
shutdown animation. The screen never comes back on, and the phone stays physically present and
still plugged in.

WORLD, PAPER AND THROW

The wastebasket stands on the floor slightly behind HIXXA and to her anatomical right, on a
short rear-right diagonal past the back corner of her chair. This is a body-relative
world-space position, not a screen position: camera angles may place it anywhere on screen, and
her anatomical right stays her anatomical right at every camera position.

Everything inside it is inert hand-crumpled paper: no origami, no creatures, no faces, no
living paper, no flat sheets, no tools or foreign objects. It never empties, never fills to the
rim, never duplicates, never changes scale or position and never gains paper on its own.

The one sheet rejected in this clip comes from the visible stack on the desk, is visibly
crushed by hand, and is thrown with a low release beside her hip and a short rear-right flick —
without turning around and without looking at the wastebasket.

Every drawn mark appears only under direct pencil contact, and no mark continues after contact
ends.

SCALE

HIXXA is about 165 centimetres and her hand is the scale reference.
The phone is an ordinary one-hand phone, no longer than her palm plus a finger joint; it is not
a tablet. The earbuds are small enough to sit inside the bowl of her ear. Each crumpled ball is
roughly a quarter of the wastebasket's inner width, and the wastebasket is knee-high beside her
seated position.

################################################################
TIMELINE
################################################################

SHOT 1 — 0.00–2.60 — 24mm WIDE

Frame zero is the start image: HIXXA mid-stroke at speed, the desk already messy, the
wastebasket already partially filled behind her right shoulder.

She drives the stroke to its end, stops dead, snatches the sheet up and crushes it between both
hands, then flicks it back and to her right. Use only a restrained four percent push or a short
lateral drift, preserving the full room staging, the desk axis, the wastebasket relationship
and her left-right anatomy.

End with the crumpled ball leaving the desk edge on a readable rear-right trajectory, still
airborne, and her hand already returning to the stack.

HARD CUT ON THE BALL LEAVING THE DESK EDGE.
The motion blur on that release is natural in-camera blur inside the shot; do not generate a
blur, streak or wipe across the cut.

SHOT 2 — 2.60–4.00 — 90mm MACRO PHONE DETAIL

Inherit the phone, cable and playback state exactly. This is a device shot: HIXXA stays present
and working behind the focal plane but is never the subject.

The waveform is moving steadily. A simple minimal low-battery icon appears on the interface and
pulses exactly once, then begins to dim, while the waveform continues uninterrupted beneath it.
She does not interact with the phone. Use a restrained three percent micro-push toward the
indicator and at most one motivated focus adjustment.

The macro perspective preserves real surface relief and tactile separation between the screen
glass, the phone body edge, the black cable and the desk wood beneath them.

End with the icon dim but still visible and the waveform still moving.

MATCH CUT ON THE WARNING SHAPE TO HER MOVING PENCIL.
A direct hard cut holding the same shape across the join: no morph, dissolve or blend.

SHOT 3 — 4.00–5.40 — 65mm TIGHT THREE-QUARTER

Inherit the unanswered warning and the continuing music. Frame her face and her drawing hand
together.

Her eyes flick toward the phone for half a beat — eyes only, no head turn, no hand leaving the
work — and she dismisses it immediately. Her eyes snap back to the page and her hand
accelerates past its previous speed. It reads as "I don't have time for this" with a brief
tightening at the brow and nothing else.

Keep the face fully dimensional through stable cheek volume, nose projection, jaw structure,
eyelid depth and natural light wrapping.

End with her eyes locked on the page, her hand faster than before, and her head carrying a
small rhythmic motion with the music she is still hearing.

HARD CUT WHILE HER HEAD IS STILL MOVING WITH THE MUSIC.

SHOT 4 — 5.40–7.40 — 75mm CHARACTER CLOSE

Inherit her maximum rhythm and that small head motion.

The battery reaches zero and the phone dies instantly: the screen goes completely black, the
waveform disappears and the earbud audio stops, all in the same single frame. Her head rhythm
stops on the next frame. Her drawing hand pulls up short and freezes about one centimetre above
the paper with the stroke unfinished, and no line appears after the pencil leaves contact.
Use a restrained micro-push and one motivated focus change from the stopped hand to her face.

End with her hand frozen a centimetre above the paper, the unfinished stroke visible beneath
it, the phone screen fully black and both earbuds still in her ears.

HARD CUT ON THE STILLNESS.

FINAL SHOT — 7.40–10.00 — 50mm MEDIUM-WIDE

Inherit the exact frozen state: hand above the paper, stroke unfinished, phone black but still
connected, both earbuds seated, cable almost still. The drawing motion never restarts.

She holds the stillness, then lifts only her eyes, slowly. Her jaw tightens and the expression
travels through confusion, then realisation, then annoyance — each stage readable, none
performed for camera. Her anatomical right hand begins rising toward one earbud and stops just
short of touching it. She does not remove it. Use only a restrained four percent push or a
short lateral drift, preserving the desk staging, the phone and wastebasket positions and the
room geography, then settle completely.

End on a locked stable frame: her right hand entered into the earbud-removal zone and stopped
before contact, both earbuds still in place, the phone still black, her drawing hand still
exactly where it froze, and the room unchanged.

################################################################
PHYSICS AND PERFORMANCE
################################################################

All movement is grounded and human: wrist-led drawing, real grip pressure, shoulder tension
rising with the rhythm, and a natural stop that decelerates through the wrist rather than
freezing the whole arm at once.

Crushing is a real physical event: the sheet buckles from the gripped edges inward, folds into
irregular angular facets rather than smooth curves, and keeps sharp creased ridges and one
closing seam. It is never a smooth sphere.

Her curls, sleeve fabric and the black cable each lag one beat behind her motion and settle.
At power loss the cable does not jump or swing; only the motion already in it decays.
No object moves before direct contact or a visible physical force.

################################################################
MOOD AND RENDER CONTRACT
################################################################

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

################################################################
LIGHTING AND VISUAL CONTINUITY
################################################################

The room's established practical source remains dominant and unchanged. Its world direction,
colour temperature, exposure, shadow placement and time of day stay identical across all five
shots and every cut.

The phone screen is a small secondary source lighting only the near desk surface and the
underside of her fingers. When the phone dies that small light disappears with it, and the desk
loses exactly that much illumination and no more: the room's own light does not change, dim or
shift colour at power loss.

Use soft directional shadow, stable contact shadows and restrained atmospheric perspective.
Colours stay rich and controlled without neon glow or excessive saturation.

################################################################
AUDIO
################################################################

No dialogue, narration, lyrics, captions or subtitles.

0.00–2.60: room tone with a thin muffled bleed of her music from the earbuds; hard fast pencil
strokes, one dry crush and the small sound of the ball leaving the wood.
2.60–4.00: the music bleed continues unbroken, her pencil working off frame. The warning is
visual only and makes no sound.
4.00–5.40: the bleed and room tone continue; strokes harden and quicken; her breathing is short
and working, not yet frustrated.
5.40–7.40: at power loss the music goes to absolute zero in one frame. What remains is faint
room tone and the smallest movement of clothing. The silence must feel unnaturally large
against the rhythm before it, and nothing is added to fill it.
7.40–10.00: room tone alone, larger than it should be, one long breath out through her nose,
and the faintest cloth movement as her hand rises.

Every sound begins only after its visible physical cause.

################################################################
PRESERVATION LOCKS
################################################################

Only one HIXXA appears. Preserve her exact face, body proportions, skin tone, hair mass,
wardrobe and anatomy. Her hands keep their five-finger anatomy, their worn dried paint stains
and their clean unpainted nails, and every object keeps the size given above.

Exactly one phone, one cable, two earbuds and one wastebasket. Exactly one sheet is rejected in
this clip, and no sheet or ball appears without being handled.
No duplicated sheets, no duplicated objects, no hand mirroring, no room-topology drift.

The low-battery warning pulses exactly once. The waveform continues during the warning. The
screen never resurrects after shutdown. No earbud is removed inside this clip.
No mark continues without physical tool contact.

Every angle change is a direct hard cut on a motivated physical event.
No fade, dissolve, wipe, morph, flash, blur transition, whip transition, animated overlay or
generated interstitial frame. No text, UI beyond the specified waveform and battery icon, logo,
caption, subtitle or watermark.

ENDPOINT AND HANDOFF

End with her right hand stopped just before the earbud, both earbuds still seated, the phone
black and still connected, and her drawing hand still frozen above the unfinished stroke.
Preserve this exact state as the inherited first frame of the next clip, in which she removes
the earbud.
```

---

## فحص الاستمرارية والزمن

| القطعة | آخر فريم | أول فريم بعدها |
|---|---|---|
| 1→2 (2.60) | الكرة تغادر حافة المكتب وهي في الهواء | ماكرو على التليفون، نفس حالة التشغيل |
| 2→3 (4.00) | الأيقونة خافتة والموجة تتحرك | نفس التحذير النشط، وجهها ويدها في الكادر |
| 3→4 (5.40) | رأسها يتحرك مع الموسيقى ويدها في أقصى سرعة | نفس الإيقاع، والانقطاع داخل الشوت |
| 4→5 (7.40) | اليد متجمدة على سنتيمتر من الورق والشاشة سوداء | نفس التجمّد بالضبط |

**التوقيت:** 2.60 + 1.40 + 1.40 + 2.00 + 2.60 = **10.00** — بلا فراغ، والصوت كذلك.

## ترتيب السلسلة

| | السلة |
|---|---|
| `B05` أول رفض | فارغة → كرة واحدة |
| **`B08` هذا** | **STAGE 2** |
| `B06` المونتاج الهستيري | STAGE 3 → STAGE 4 |

الكليب يقع **بين الاثنين**، وهو **سبب** ما يليه: انقطاع الموسيقى هو ما يفتح باب الهياج.
