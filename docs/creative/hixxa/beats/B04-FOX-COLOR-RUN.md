# HX-DRAW-FOX-02 — COLOR RUN; THE FINISHED FOX

> **المدة:** 8.0 ثوانٍ — **الشوتات:** 4 — **القطعات:** 3، كلها بعد 4.00 ثانية
> **المعيار:** CINEDANCE Bible v2.0 — Dimensional Hand-Painted Cinematic
> **التاقات:** `@loc_location-room-1` `@desk` `@char_hixxa` `@hixa-face` `@EAR` `@fox`
> **الوراثة:** يبدأ من فريم التسليم النهائي لـ`HX-DRAW-FOX-01` — **التسليم:** إلى `HX-DRAW-FOX-03`

**التوقيت الأصلي محفوظ بالكامل:** 4.00 + 1.15 + 1.40 + 1.45 = **8.00**، والقطعات الثلاث في مواضعها 4.00 / 5.15 / 6.55.

---

## الثغرة الأهم: ثلاثة ألوان وفرشاة واحدة

شوت A لقطة **واحدة متصلة بلا قطع**، وفيها تمر ثلاثة ألوان:

`rust-orange` (0.55–2.20) → `lighter accents` (2.20) → `matte black wing` (2.20–4.00)

والبرومبت يقول: **«Nothing materializes, moves or disappears except the one brush»**. معناه أن تغيير اللون لا بد أن يكون **فعلًا مرئيًا** داخل الكادر — وإلا فالفرشاة تبدّل لونها من تلقاء نفسها، وهذا كسر مباشر لقانون التلامس ولقاعدتك أنت.

**الحل المطبَّق:** غمستان مرئيتان في البالتة الموجودة أصلًا على المكتب، ومقسومتان داخل نافذتك `2.20–4.00` نفسها بلا تغيير حدودها الخارجية:

| النافذة | الأصل | بعد الضبط |
|---|---|---|
| 2.20–3.05 | ضمن نافذة واحدة | غمسة مرئية للون الفاتح ← الخطم والصدر والذيل |
| 3.05–4.00 | ضمن نفس النافذة | غمسة مرئية للأسود ← بداية الجناح الأول من الجذر |

ولا غمسة واحدة تحدث خارج الكادر أو بين القطعات.

---

## باقي ما اتصلح

| المشكلة | التصحيح |
|---|---|
| **`@hixa-face` غير موجود** | أُضيف؛ و`@cc22fe7c…` صار مسمّى `@[char_hixxa](cc22fe7c…)` كباقي العناصر |
| حدود ناقصة على عناصر الهوية | كل عنصر له سطر `It does not control…` |
| **بلا `MOOD AND RENDER CONTRACT`** | مضاف، وفيه الفصل الحاسم: **العالم مجسّم، والرسمة صبغة مسطحة على ورق مجسّم** |
| **بلا قسم إضاءة** — البرومبت يقول «light direction» موروث بلا تعريف المصدر أصلًا | مصدر محدد بالاتجاه العالمي وحرارة اللون والتعريض وظلال الاتصال |
| صوت في سطر واحد | تايم لاين صوتي سببي على النوافذ |
| **Endpoint غير قابل للرسم** في الشوتات B و C و D | كل شوت له `End with` بفريم واحد محدد |
| `one-frame brush wipe` قد يُفهم كانتقال مولَّد | وُصف كـ**مرور فرشاة حقيقية أمام العدسة**، والقطع يقع عليه — لا تصنيع wipe |
| بلا سلّم حالات للطلاء | سلّم كامل، فتصير الوراثة عند كل قطعة قابلة للفحص |

---

```text
################################################################
HX-DRAW-FOX-02 — COLOR RUN; THE FINISHED FOX
################################################################

SEEDANCE 2.5 — MULTI-REFERENCE R2V — 8.0 SECONDS — 16:9 — 24 FPS

CONTROLLED FOUR-SHOT COLORING SEQUENCE
The first half is one uninterrupted shot. Use exactly three editorial cuts, all after 4.00
seconds. Every new shot inherits the exact wet-paint progress, sheet orientation, hand
assignment, body position, light direction and desk state from the preceding frame.
REAL-TIME MOTION — NO SLOW MOTION — NO SPEED RAMPS

REFERENCE ASSIGNMENTS

Use @[loc_location-room-1](9f40a957-b4c1-400d-8cb4-12a8399ccb9a) for the exact room geography,
architecture, materials, practical light and fixed background.
It does not control the camera angle or the shot size.

Use @[desk](089414cf-1c73-4963-a04c-0b101123c787) for the exact desk, work surface and
existing prop arrangement, including the palette and water already present.
Nothing materializes, moves or disappears except the one brush HIXXA holds and the color she
lays onto the active sheet.

Use @[char_hixxa](cc22fe7c-87ac-4716-a382-79878df17e3a) for the one HIXXA identity, skin tone,
body proportions, curls, layered wardrobe and the small red pencil still secured in her hair.
It does not control the camera angle, the shot size or her moment-to-moment expression.

Use @hixa-face to reinforce only the face of that same single HIXXA.
It never creates a second person and never drifts between shots.

HANDS AND PAINT STAINS

Both of HIXXA's hands carry permanent dried paint stains from long working days, and those
stains are part of her identity in every shot: soft pale-blue and cyan patches worn into the
sides of the thumb and across the finger pads, a smaller lilac or dusty-pink patch near one or
two nail beds, scattered cream and white flecks over the knuckles and the backs of the
fingers, and faint colour caught in the cuticle edges.

They read as dried, absorbed and worn — thin, matte, slightly faded, and following the skin's
own creases and folds. They are never wet paint, never fresh droplets, never glossy, raised,
wet-looking or glowing. The stains sit beneath the skin's hand-painted shading rather than on
top of it, so the hand keeps its full sculptural volume, knuckle relief and tendon structure.

The nails stay clean and natural with a visible pale nail plate; colour gathers around the
nail edges and cuticles, not across the nail surface.

The pattern is soft and irregular and never resolves into a graphic shape, a logo, a glove, a
tattoo, a bruise, a wound or dirt. Its placement, colours and density stay consistent across
every shot, lens and angle, and it never washes off, spreads or changes colour within a film.

PROP SCALE LOCK

HIXXA stands about 165 centimetres tall and her hand is the scale reference for this entire
film. Every object below is locked to both a real dimension and a hand-relative anchor.
Where the two seem to disagree, the hand-relative anchor wins. No object is rendered larger or
smaller than its stated relationship to her hand or body, and no object changes size between
shots, lenses or angles.

SKETCH SHEET — one landscape sheet about 30 centimetres wide and 21 tall, a little wider than
her two hands set side by side. It is never poster-sized and never notebook-small.

PAINTBRUSH — a small round brush about 18 centimetres long with a ferrule under 6 millimetres
wide. Held like a pencil, its handle ends near the base of her thumb.

PALETTE — a small hand-sized tray no wider than her spread fingers, lying flat on the desk.

EARBUDS — tiny in-ear units, each one smaller than the concha bowl of her ear and no wider
than her little fingernail. They are never ear-cups, never headset-sized, never large discs
and never protrude beyond her ear silhouette. The cable is a thin 2-millimetre cord.

SMALL RED PENCIL IN HER CURLS — a short stub about 9 centimetres long and pencil-thin,
roughly the length of her index finger. It never becomes a full-length pencil, brush or rod.

When she is actively painting, fresh wet colour may additionally appear on her fingertips only
after visible contact with pigment; it never replaces or covers the permanent dried stains.

Use @[EAR](449e8116-6279-4951-adf6-56a5f43a670b) for exactly one pair of black wired earbuds,
both worn throughout with one continuous cable. They never vanish, multiply or change design.

Use @[fox](98900fd0-3b3a-47b9-a9e9-401406dde49f) only for the final design, markings and
palette of exactly one fox illustration: rust-orange body, its reference-specific lighter
areas and graphite accents, and exactly two completely black wings.
Do not copy the turnaround grid, multiple poses, captions or reference background.
The animal exists only as flat artwork on paper.

FIRST FRAME AND CONTINUITY IN

At 0.00 HIXXA remains seated at the same desk with the same landscape cream sheet held flat in
the same orientation. It already carries the complete graphite construction sketch from
HX-DRAW-FOX-01: muzzle toward the sheet's left edge, tail toward the right, exactly two open
wings. Her anatomical left fingertips anchor the upper edge. Her anatomical right hand holds
one existing small paintbrush, already loaded with rust-orange, just above the fox's shoulder.
No colored region exists before the first brush contact.

PAINT STATE LADDER

The artwork progresses through one continuous state and never skips or reorders a stage:
[graphite construction only]
→ [rust-orange laid from tail and hindquarters into the torso]
→ [lighter muzzle, chest and tail accents established]
→ [first wing begun in matte black from the root outward]
→ [eye, muzzle markings and ear accents defined]
→ [both wings completed to uniform matte black to their outer contours]
→ [final tail markings added]
→ [complete illustration, brush withdrawn].

Every colour change on the brush is a visible dip into the palette already on the desk,
performed inside frame. No reload, rinse or colour change ever happens off-screen or across a
cut. Color appears only under bristle contact and only inside the drawn design.

COUNTS

Exactly one HIXXA, one active sheet, one paintbrush, one fox, exactly two wings,
one wired earbud pair with one continuous cable, and one small red pencil in her curls that is
never touched or used. No second sheet, second brush or additional artwork appears.

################################################################
TIMELINE
################################################################

SHOT A — 0.00–4.00s — UNINTERRUPTED PAGE-LEVEL TRACK

Natural 40mm perspective. Begin 12 centimeters above the desk at the sheet's tail-side edge,
looking laterally across the paper toward HIXXA so her focused face, earbuds, desk and room
remain layered behind the artwork. Track slowly parallel to the sheet from tail toward muzzle
at matched speed with her working hand; no tilt, orbit, optical zoom or cut.

The low lateral track reveals restrained parallax between the sheet in the near foreground,
her working hand, her face and the room behind her, and the paper reads as a physical surface
lying on a physical desk throughout the move.

0.00–0.55: a tiny wrist anticipation, then the loaded brush touches the page.

0.55–2.20: rust-orange paint is laid from tail and hindquarters toward the torso in visible
directional strokes, the bristles splaying slightly under pressure and recovering on each
lift, leaving useful graphite construction lines readable beneath the colour.

2.20–3.05: she lifts the brush, dips it visibly into the lighter tone in the existing palette
and establishes the muzzle, chest and tail accents in short placed strokes.

3.05–4.00: she lifts again, dips visibly into the matte black, and begins the first wing from
its root outward in one broad confident pass.

End with the brush still in contact on the first wing, roughly a third of that wing filled
black, the rust-orange body complete, the lighter accents in place and the second wing still
bare graphite.

CUT 1 at 4.00s — the black-loaded brush passes close across the lens on its natural working
path, and the cut lands on that pass. This is the real brush crossing in front of the camera,
not a synthesised wipe: do not generate a wipe, dissolve, morph, flash or overlay.

SHOT B — 4.00–5.15s — FOX FACE MACRO

100mm macro from the sheet's left edge. HIXXA's right fingertips and a soft fragment of her
face remain behind the focal plane.

The first frame inherits the identical brush movement, black-loaded bristles and paint state:
body complete, accents placed, first wing a third filled, second wing bare.

She defines the eye, muzzle markings and ear accents with three precise strokes, her wrist
leading and her forearm steady against the desk. One rack focus moves from the wet eye stroke
to her concentrated eye, then returns to the paper before the cut.

The macro perspective preserves real surface relief and tactile separation between wet
pigment, dry graphite and the paper tooth beneath both.

End with the three facial strokes complete and still wet, and the brush lifting away on a
clean upward vector.

HARD CUT at 5.15s on the brush lifting in the same upward vector.

SHOT C — 5.15–6.55s — WING AND TAIL OBLIQUE

65mm high three-quarter detail from the window side. The same sheet has not rotated or moved.
Her left hand remains at its upper edge; her right hand remains the painting hand.

Inherit the completed face markings, the partially filled first wing and the bare second wing.

She finishes the second wing and deepens both wings to uniform matte black all the way to
their outer contours; no orange, gray or unpainted patch remains inside either wing. She adds
the final tail markings without covering the construction character of the drawing.

End with both wings solid matte black to their outer edges, the tail markings placed, and the
brush clear of the paper above the outer wing edge.

MATCH CUT at 6.55s on the diagonal outer wing edge — a direct hard cut holding the same
diagonal across the join, with no morph, dissolve or blend.

SHOT D — 6.55–8.00s — COMPLETE ILLUSTRATION REVEAL

26mm rectilinear wide from the opposite desk corner. Begin close on the matched diagonal wing
edge, then execute one single continuous move that retreats 45 centimeters while rising gently
into a stable over-desk three-quarter composition.

Inherit the finished illustration, her posture, the brush in her right hand and the unchanged
light. The complete flat colored fox drawing fills the lower center; HIXXA, the desk and the
recognizable room remain clearly present behind it.

She withdraws the brush from over the page and gives the result a silent measuring look, her
shoulders lowering once. No further paint changes.

End fully settled on a locked frame: the completed rust-orange fox with exactly two solid
black wings lying flat on the same uncreased sheet, her left hand still at the upper edge, the
brush held clear and still, and the room unchanged behind her.

################################################################
PHYSICS AND PERFORMANCE
################################################################

All movement is grounded and human: wrist-led brushwork, the forearm riding on the desk,
believable pressure changes through each stroke and restrained micro-motion between passes.
Her performance is quiet and internal — placing, judging, continuing — with no theatrical
gesture and no lip movement.

Paint behaves as thin real pigment on absorbent cream paper: limited wet sheen, short bristle
trails, visible directionality in each stroke, no liquid flood and no paint flying through
space. Bristles splay under pressure and recover on the lift. Wet areas stay wet within this
short span and never dry, bloom or spread on their own.

The sheet stays flat and stationary under her left fingertips and never slides, rotates,
wrinkles or duplicates. Her curls, sleeve fabric and the earbud cable lag one beat behind her
motion and settle; the cable bends elastically and never becomes rigid.

No object moves before direct contact or a visible physical force.

################################################################
MOOD AND RENDER CONTRACT
################################################################

Preserve the established HIXXA dimensional hand-painted cinematic animation language.

The image is fully constructed in three-dimensional space: volumetric characters, modeled
facial planes, rounded body forms, dimensional architecture, real perspective, physical
occlusion, natural parallax and clear foreground-to-background separation.

Render every character and object with convincing sculptural volume comparable to high-end 3D
animation, while treating every visible surface through controlled hand-painted illustration:
clean illustrated shapes, softly brushed shading, painterly color transitions, subtly drawn
edges, tactile material variation and restrained authored texture.

Skin, curls, plaid cotton, canvas apron, desk wood, cream paper fibre, dry graphite, wet
pigment, brush bristle and rubber cable remain materially distinct and physically dimensional.

CRITICAL DISTINCTION: the world is dimensional, the artwork is not.
The room, HIXXA, the desk, her hands, the brush and the sheet itself all carry full sculptural
volume, perspective and contact shadow. The fox exists only as flat pigment and graphite
bonded to the surface of that dimensional sheet: it has no thickness, no volume, no lift off
the paper and no shadow of its own. The paper may catch a faint tooth relief and the wet paint
a limited sheen; the depicted animal never does.

The result feels like a richly hand-painted cinematic frame occupying real three-dimensional
space: never flat 2D, never a paper cutout, never photoreal live action and never glossy
plastic or toy-like CGI.

Maintain stable facial volume, eye size, curl mass, body proportions, wardrobe construction
and material response across every lens and angle in the sequence.

################################################################
LIGHTING AND VISUAL CONTINUITY
################################################################

The room's established warm practical source remains dominant and unchanged.
Its world direction, color temperature, exposure, shadow placement and time of day stay
identical across all four shots and across every cut, including the macro and the final wide.

Warm directional light wraps her curls, cheek planes and knuckles, rakes across the sheet so
the paper's tooth reads as surface relief, and catches a limited sheen on the wet pigment only
where it is still fresh. Her hand and the brush cast a stable contact shadow onto the page
that travels correctly as the camera moves.

Use soft directional shadow, stable contact shadows and restrained atmospheric perspective to
preserve sculptural volume and real dimensional depth.
Colors remain rich and controlled without neon glow or excessive saturation; the rust-orange
stays a pigment colour and never becomes emissive.

No flat 2D or paper-cutout motion. No photoreal live action. No glossy plastic or toy-like
CGI. No waxy skin, generic game-render materials, watercolor bleed, unmotivated neon lighting,
heavy grain or style drift between shots.

################################################################
AUDIO
################################################################

No dialogue, narration, lyrics, captions or subtitles. No added music track.
A faint muffled bleed of her own music escapes the earbuds throughout; the room stays dominant.

0.00–0.55: steady room tone, subtle cloth movement, one soft bristle contact on paper.
0.55–2.20: continuous damp brush drag that changes texture with stroke direction.
2.20–4.00: two small ceramic palette taps as she reloads, then shorter placed strokes and one
broader pass as the black goes down.
4.00–5.15: three short precise strokes with near silence between them.
5.15–6.55: a broader filling drag across the wings, one further palette tap, then the brush
lifting clear.
6.55–8.00: the brush withdrawn, room tone alone and one quiet breath.

Every sound begins only after its visible physical cause.

################################################################
PRESERVATION LOCKS
################################################################

Only one HIXXA appears. Preserve her exact face, body proportions, skin tone, hair mass,
layered wardrobe and anatomy, including correct five-finger hands.
The right hand is always the painting hand; the left always stabilizes the same sheet. Preserve the permanent dried paint stains on both of her hands exactly as established: same placement, same colours, same density, dried and matte, in every shot and at every lens. Every object holds the exact size given in the prop scale lock, measured against her hand, in every shot and at every lens.

The drawing never animates, blinks, changes pose, becomes a live fox, rises from the sheet,
gains volume or turns into folded sculpture. Only one fox is depicted.
The page never slides, rotates, wrinkles or duplicates.

Exactly two wings, and both finish uniformly matte black to their outer contours with no
orange, gray or unpainted patch remaining inside either one.
The graphite construction stays partly readable beneath the colour and is never fully buried.

No cuts before 4.00s; exactly three cuts afterward, at 4.00, 5.15 and 6.55.
Each is a direct hard cut on a motivated physical event.
No fade, dissolve, wipe effect, morph, flash, blur transition, whip transition, animated
overlay or generated interstitial frame.

No text, UI, logo, subtitle, watermark or additional paper artwork.
No brush change, no second brush, no off-screen reload, no paint appearing without bristle
contact.

ENDPOINT AND HANDOFF

Hold on the fully finished rust-orange fox illustration with exactly two completely black
wings, still flat on the same uncreased sheet, the brush withdrawn and still.
Preserve this exact sheet orientation, camera framing and paint state as the inherited first
frame of HX-DRAW-FOX-03.
```

---

## فحص الاستمرارية

| القطعة | آخر فريم | أول فريم بعدها |
|---|---|---|
| A→B (4.00) | فرشاة محمّلة أسود ملامسة الجناح الأول (ثلثه ممتلئ)، الجسم كامل، الجناح الثاني جرافيت خام | نفس حالة الطلاء ونفس حركة الفرشاة، ماكرو على الوجه |
| B→C (5.15) | ثلاث ضربات وجه مبلولة، الفرشاة ترتفع على متجه صاعد | نفس المتجه، ونفس الجناح الأول ناقص والثاني خام |
| C→D (6.55) | جناحان أسودان مصمتان، علامات الذيل، الفرشاة فوق الحافة الخارجية | نفس القطر الخارجي للجناح في بداية الكادر الواسع |

**التوقيت:** 4.00 + 1.15 + 1.40 + 1.45 = **8.00** — بلا فراغ، والقطعات الثلاث كلها بعد 4.00 كما اشترطت.

## نقطة تحتاج قرارك

**ثلاث ألوان في 4 ثوانٍ داخل لقطة واحدة** يعني غمستين مرئيتين تأكلان ~0.3 ثانية من زمن الرسم الفعلي. لو طلع الجناح الأسود ناقصًا في التوليد، أنظف تنازل هو **تأجيل اللون الفاتح كله إلى شوت B** — تبقى غمسة واحدة في شوت A، والوجه والأكسنتات مع بعض في الماكرو. قول وأعدّلها.
