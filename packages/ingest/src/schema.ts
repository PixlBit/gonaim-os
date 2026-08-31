import { z } from "zod";

/**
 * ما يرسله الهاتف.
 *
 * كل حمولة تصف **ملاحظة**، لا حقيقة. الملاحظة تصير حدثًا، والحدث قد يصير
 * مرشَّحًا، والمرشَّح لا يصير حقيقة إلا بتأكيدك (ADR-0004). الهاتف لا يكتب
 * في القاعدة مباشرة أبدًا.
 */

const at = z.string().datetime({ offset: true });

export const SmsSignal = z.object({
  kind: z.literal("sms"),
  at,
  /** اسم المرسل كما يظهر لك. يُنقَّح ويُستبدل برمز ثابت قبل التخزين. */
  sender: z.string().max(200),
  body: z.string().max(4000),
});

export const LocationSignal = z.object({
  kind: z.literal("location"),
  at,
  /** الدقة اختيارك: city يكفي للسياق، exact نادرًا ما يلزم. */
  precision: z.enum(["city", "area", "exact"]),
  label: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  event: z.enum(["arrive", "leave", "periodic"]),
});

export const PhotoSignal = z.object({
  kind: z.literal("photo"),
  at,
  /** معرّف الأصل على الجهاز. الصورة نفسها تبقى مكانها (ADR-0009). */
  localId: z.string().max(200),
  album: z.string().max(200).optional(),
  place: z.string().max(200).optional(),
  /** وصف كتبته أنت، لا تحليل تلقائي. */
  note: z.string().max(1000).optional(),
});

export const CalendarSignal = z.object({
  kind: z.literal("calendar"),
  at,
  title: z.string().max(300),
  startsAt: at,
  endsAt: at.optional(),
  location: z.string().max(200).optional(),
});

export const NoteSignal = z.object({
  kind: z.literal("note"),
  at,
  text: z.string().max(4000),
});

export const Signal = z.discriminatedUnion("kind", [
  SmsSignal, LocationSignal, PhotoSignal, CalendarSignal, NoteSignal,
]);
export type Signal = z.infer<typeof Signal>;

/** الهاتف قد يجمّع عدة إشارات في نداء واحد لتوفير البطارية. */
export const IngestBatch = z.object({
  device: z.string().max(100),
  signals: z.array(Signal).min(1).max(100),
});
export type IngestBatch = z.infer<typeof IngestBatch>;
