import { createHash } from "node:crypto";
import { redact } from "@gonaim/security";
import type { SensitivityZone } from "@gonaim/domain";
import type { Signal } from "./schema.js";

/**
 * تحويل إشارة الهاتف إلى حدث.
 *
 * الحد الحاكم (data-sensitivity-map، §43):
 *   **محتوى الرسائل الخاصة = never_observe.**
 *
 * ورسالتك تحمل كلام شخص آخر لم يوافق. فالنظام يعامل نص الرسالة كـ
 * **مادة عابرة**: يمر عليها ليستخلص التزامك أنت، ثم لا يبقيها.
 *
 * `bodyRetention` يحكم ذلك:
 *   `drop`     — الافتراضي. النص يُستخدم في الجلسة ثم يُسقَط قبل التخزين.
 *   `redacted` — يُخزَّن منقّحًا لمدة محدودة، باختيارك الصريح.
 *
 * لا يوجد خيار "خزّن النص كما هو". الغياب مقصود.
 */
export type BodyRetention = "drop" | "redacted";

export interface EventDraft {
  eventType: string;
  occurredAt: string;
  source: string;
  sensitivity: SensitivityZone;
  observedOrInferred: "observed";
  payload: Record<string, unknown>;
  fingerprint: string;
  /** نص عابر: متاح للاستخلاص في هذه الجلسة، ولا يُكتب في القاعدة. */
  transientText?: string;
}

export interface ToEventsOptions {
  device: string;
  bodyRetention?: BodyRetention;
  /** دقة الموقع المسموح بها. أعلى من ذلك يُخفَّض، لا يُرفض. */
  maxLocationPrecision?: "city" | "area" | "exact";
}

const PRECISION_ORDER = { city: 0, area: 1, exact: 2 } as const;

export function toEvent(signal: Signal, opts: ToEventsOptions): EventDraft {
  const retention = opts.bodyRetention ?? "drop";
  const base = { source: `mobile:${opts.device}`, observedOrInferred: "observed" as const };

  switch (signal.kind) {
    case "sms": {
      const safe = redact(signal.body);
      // المرسل يصير رمزًا ثابتًا: تعرف أنه نفس الشخص بلا تخزين هويته
      const senderToken = `PERSON_${stable(signal.sender)}`;
      const payload: Record<string, unknown> = {
        sender: senderToken,
        length: signal.body.length,
        redactedCount: safe.redactions.length,
        bodyRetention: retention,
      };
      if (retention === "redacted") payload["body"] = safe.text;
      return {
        ...base,
        eventType: "message.received",
        occurredAt: signal.at,
        sensitivity: "sensitive",
        payload,
        fingerprint: fp("message.received", signal.at, senderToken, safe.text),
        // متاح للاستخلاص الآن، غير مكتوب في القاعدة
        transientText: safe.text,
      };
    }

    case "location": {
      const allowed = opts.maxLocationPrecision ?? "city";
      // الخفض بدل الرفض: إشارة أقل دقة أنفع من لا إشارة
      const precision = PRECISION_ORDER[signal.precision] > PRECISION_ORDER[allowed]
        ? allowed : signal.precision;
      const payload: Record<string, unknown> = { event: signal.event, precision };
      if (signal.label) payload["label"] = signal.label;
      if (precision === "exact" && signal.lat !== undefined && signal.lon !== undefined) {
        payload["lat"] = signal.lat;
        payload["lon"] = signal.lon;
      } else if (precision === "area" && signal.lat !== undefined && signal.lon !== undefined) {
        // ~1.1 كم — يكفي لمعرفة الحي ولا يكفي لمعرفة الباب
        payload["lat"] = round(signal.lat, 2);
        payload["lon"] = round(signal.lon, 2);
      }
      return {
        ...base,
        eventType: `location.${signal.event === "periodic" ? "sampled" : signal.event}`,
        occurredAt: signal.at,
        sensitivity: "private",
        payload,
        fingerprint: fp("location", signal.at, signal.event, String(payload["label"] ?? "")),
      };
    }

    case "photo":
      return {
        ...base,
        eventType: "photo.captured",
        occurredAt: signal.at,
        sensitivity: "private",
        // الصورة تبقى على الجهاز — نحفظ المعرّف لا البكسل
        payload: {
          localId: signal.localId,
          ...(signal.album ? { album: signal.album } : {}),
          ...(signal.place ? { place: signal.place } : {}),
          ...(signal.note ? { note: redact(signal.note).text } : {}),
        },
        fingerprint: fp("photo", signal.localId),
      };

    case "calendar":
      return {
        ...base,
        eventType: "calendar.event_seen",
        occurredAt: signal.at,
        sensitivity: "private",
        payload: {
          title: redact(signal.title).text,
          startsAt: signal.startsAt,
          ...(signal.endsAt ? { endsAt: signal.endsAt } : {}),
          ...(signal.location ? { location: signal.location } : {}),
        },
        fingerprint: fp("calendar", signal.startsAt, signal.title),
      };

    case "note": {
      const safe = redact(signal.text);
      return {
        ...base,
        eventType: "manual.capture.created",
        occurredAt: signal.at,
        sensitivity: "private",
        payload: { text: safe.text, redactedCount: safe.redactions.length },
        fingerprint: fp("note", signal.at, safe.text),
        transientText: safe.text,
      };
    }
  }
}

const round = (n: number, places: number): number =>
  Math.round(n * 10 ** places) / 10 ** places;

const stable = (s: string): string => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36).slice(0, 6);
};

const fp = (...parts: string[]): string =>
  "sha256:" + createHash("sha256").update(parts.join("|")).digest("hex");
