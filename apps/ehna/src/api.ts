import type { Action, FullReport, PersonKey, Space } from "@gonaim/couple";

export interface Brief {
  kind: OracleKind;
  system: string;
  text: string;
  title: string;
  withheld: string[];
}

export type OracleKind = "letter" | "advice" | "gift" | "week" | "story";

export interface OracleAnswer {
  brief: Brief;
  text: string;
  model?: string;
  offline?: boolean;
  used?: number;
  limit?: number;
}

/**
 * العميل.
 *
 * كل كتابة تمر بـ`act` — فعل موصوف يُرسَل إلى الخادم ويعود بالحالة كاملة.
 * لا يوجد هنا `PUT /space` ولا تعديل محلي يُرسَل بعد حين: المصدر الوحيد
 * للحقيقة هو ما يعيده الخادم، فلا تتفرّع نسختان لنفس المساحة على تليفونين.
 */

export interface State {
  features: { oracle: boolean; model: string | null };
  me: PersonKey;
  rev: number;
  space: Space;
  report: FullReport;
  sessions: Array<{ id: string; key: PersonKey; agent?: string; lastSeenAt: string; current: boolean }>;
}

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      credentials: "same-origin",
      ...init,
      headers: { ...(init?.body ? { "content-type": "application/json" } : {}), ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "offline", "الخادم مش رادّ. اتأكد إنه شغّال.");
  }

  const text = await res.text();
  const body = text ? safeJson(text) : {};
  if (!res.ok) {
    const code = typeof body["error"] === "string" ? body["error"] : "failed";
    const message = typeof body["message"] === "string" ? body["message"] : fallbackMessage(res.status);
    throw new ApiError(res.status, code, message);
  }
  return body as T;
}

function safeJson(text: string): Record<string, unknown> {
  try { return JSON.parse(text) as Record<string, unknown>; }
  catch { return {}; }
}

function fallbackMessage(status: number): string {
  if (status === 401) return "الجلسة انتهت.";
  if (status === 429) return "محاولات كتير. استنى شوية.";
  return "حصل خطأ.";
}

export const api = {
  health: () => call<{ ok: boolean; initialized: boolean; store: string }>("/health"),

  state: () => call<State>("/state"),

  login: (handle: string, password: string) =>
    call<State>("/login", { method: "POST", body: JSON.stringify({ handle, password }) }),

  logout: () => call<{ ok: true }>("/logout", { method: "POST" }),

  act: (action: Action) =>
    call<State>("/act", { method: "POST", body: JSON.stringify({ action }) }),

  revoke: (id: string) =>
    call<State>("/session/revoke", { method: "POST", body: JSON.stringify({ id }) }),

  /** يبني النص ويعرضه — بلا أي نداء خارجي. */
  brief: (kind: OracleKind, targetId?: string) =>
    call<{ brief: Brief; enabled: boolean }>("/oracle/brief", {
      method: "POST", body: JSON.stringify({ kind, ...(targetId ? { targetId } : {}) }),
    }),

  /** يبعت. الخادم يعيد بناء النص بنفسه — المتصفح بيطلب نوع، مش كلام. */
  oracle: (kind: OracleKind, targetId?: string) =>
    call<OracleAnswer>("/oracle/ask", {
      method: "POST", body: JSON.stringify({ kind, ...(targetId ? { targetId } : {}) }),
    }),

  password: (current: string, next: string) =>
    call<{ ok: true }>("/password", { method: "POST", body: JSON.stringify({ current, next }) }),

  /** الصورة تُصغَّر في المتصفح قبل الرفع — الخادم يحفظ ما وصله لا أكثر. */
  async photo(file: File): Promise<string> {
    const bytes = await shrink(file);
    const res = await fetch("/api/photo", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/octet-stream" },
      body: bytes,
    });
    const body = safeJson(await res.text());
    if (!res.ok) {
      throw new ApiError(res.status, String(body["error"] ?? "failed"),
        String(body["message"] ?? "الصورة مرفعتش."));
    }
    return String(body["id"]);
  },
};

export const photoUrl = (id: string): string =>
  id.startsWith("http") ? id : `/api/photo/${id}`;

/**
 * تصغير الصورة قبل الرفع.
 *
 * صورة التليفون اليوم 4–8 ميجا، وشاشة الذكريات لا تعرض منها أكثر من
 * 1600px. الرفع بحجمها الكامل يملأ القرص ويُبطئ الفتح بلا فرق يُرى —
 * فتُرسم على canvas بالحجم المطلوب وتُصدَّر JPEG.
 *
 * لو فشل أي جزء (صيغة غريبة، متصفح قديم) يُرفَع الأصل كما هو: التصغير
 * تحسين، وفقدانه لا يجوز أن يمنع الذكرى.
 */
const MAX_EDGE = 1600;

async function shrink(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 900_000) { bitmap.close(); return file; }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close(); return file; }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((done) =>
      canvas.toBlob(done, "image/jpeg", 0.86));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}
