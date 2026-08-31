import { createServer } from "node:http";
import { extract } from "@gonaim/intake";
import { connect, commitCandidates, loadSnapshot, exportMind, forget, listKnown,
         ingestEvents, isBlackout, type ConfirmedCandidate } from "@gonaim/db";
import { IngestBatch, toEvent } from "@gonaim/ingest";
import { timingSafeEqual } from "node:crypto";
import { ALL_RULES, runRules } from "@gonaim/rules";

/**
 * بوابة محلية. سبب وجودها واحد: المفتاح لا يدخل المتصفح أبدًا (ADR-0006).
 *
 * هذه نسخة التطوير المحلية. في النشر يحل محلها Cloudflare Worker خلف
 * Cloudflare Access — نفس العقد، مصادقة مختلفة.
 */
const PORT = Number(process.env["PORT"] ?? 8787);
/** أصول مسموحة. الافتراضي يغطي dev و preview — منفذان مختلفان لنفس التطبيق. */
const ORIGINS = (process.env["WEB_ORIGIN"] ?? "http://localhost:5173,http://localhost:4173")
  .split(",").map((o) => o.trim()).filter(Boolean);
const MAX_BODY = 32 * 1024;
const OWNER = process.env["OWNER_ID"] ?? "00000000-0000-0000-0000-000000000001";
const DB_URL = process.env["DATABASE_URL"];
/** توكن الهاتف. بدونه بوابة الاستقبال مقفلة — لا وضع "مفتوح للتجربة". */
const INGEST_TOKEN = process.env["INGEST_TOKEN"] ?? "";
const LOCATION_PRECISION =
  (process.env["LOCATION_PRECISION"] ?? "city") as "city" | "area" | "exact";
const BODY_RETENTION = (process.env["SMS_BODY_RETENTION"] ?? "drop") as "drop" | "redacted";
const db = DB_URL ? connect({ url: DB_URL, ownerId: OWNER }) : null;

const server = createServer(async (req, res) => {
  // الصدى يقتصر على أصل مطابق. أصل غير معروف لا يحصل على رأس، فيمنعه المتصفح.
  const origin = req.headers.origin;
  const allowed = origin && ORIGINS.includes(origin) ? origin : ORIGINS[0]!;
  const cors = {
    "access-control-allow-origin": allowed,
    vary: "Origin",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") { res.writeHead(204, cors).end(); return; }

  // القراءة: لقطة الحياة والإشارات المحسوبة منها
  if (req.method === "GET" && req.url === "/api/signals") {
    if (!db) return json(res, 503, cors, { error: "no_database", message: "DATABASE_URL غير مضبوط." });
    try {
      const today = new Date().toISOString().slice(0, 10);
      const snapshot = await loadSnapshot(db, OWNER, today);
      const result = runRules(ALL_RULES, { snapshot, alreadySurfaced: new Set() });
      return json(res, 200, cors, {
        today,
        surfaced: result.surfaced, inbox: result.inbox,
        belowThreshold: result.belowThreshold,
        stayedSilent: result.stayedSilent,
        counts: {
          subscriptions: snapshot.subscriptions.length, invoices: snapshot.invoices.length,
          wants: snapshot.wants.length, obligations: snapshot.obligations.length,
          possessions: snapshot.possessions.length,
        },
      });
    } catch (err) {
      console.error("[signals]", err);
      return json(res, 502, cors, { error: "load_failed" });
    }
  }

  // ما تعرفه القاعدة عنك — شرط لأي حذف واعٍ
  if (req.method === "GET" && req.url === "/api/known") {
    if (!db) return json(res, 503, cors, { error: "no_database", message: "DATABASE_URL غير مضبوط." });
    try {
      return json(res, 200, cors, { entities: await listKnown(db, OWNER) });
    } catch (err) {
      console.error("[known]", err);
      return json(res, 502, cors, { error: "load_failed" });
    }
  }

  // §5.6: البيانات ملك غنيم. الوعد لا يُختبر إلا بتصدير يعمل.
  if (req.method === "GET" && req.url === "/api/export") {
    if (!db) return json(res, 503, cors, { error: "no_database", message: "DATABASE_URL غير مضبوط." });
    try {
      return json(res, 200, cors, await exportMind(db, OWNER));
    } catch (err) {
      console.error("[export]", err);
      return json(res, 502, cors, { error: "export_failed" });
    }
  }

  if (req.method !== "POST" || !["/api/extract", "/api/commit", "/api/forget", "/api/ingest"].includes(req.url ?? "")) {
    return json(res, 404, cors, { error: "not_found" });
  }

  let raw = "";
  try {
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > MAX_BODY) { req.destroy(); return json(res, 413, cors, { error: "too_large" }); }
    }
  } catch { return json(res, 400, cors, { error: "read_failed" }); }

  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return json(res, 400, cors, { error: "bad_json" }); }

  if (req.url === "/api/ingest") {
    if (!db) return json(res, 503, cors, { error: "no_database" });
    if (!INGEST_TOKEN) {
      return json(res, 503, cors, {
        error: "ingest_disabled",
        message: "INGEST_TOKEN غير مضبوط. بوابة الهاتف مقفلة حتى يُضبط.",
      });
    }
    // مقارنة ثابتة الزمن: مقارنة عادية تسرّب التوكن حرفًا حرفًا
    const given = String(req.headers["x-gonaim-token"] ?? "");
    if (!sameToken(given, INGEST_TOKEN)) {
      return json(res, 401, cors, { error: "bad_token" });
    }

    const parsed = IngestBatch.safeParse(body);
    if (!parsed.success) {
      return json(res, 400, cors, { error: "bad_signal", issues: parsed.error.issues.slice(0, 5) });
    }

    try {
      const blackout = await isBlackout(db, OWNER);
      const drafts = parsed.data.signals.map((sig) => toEvent(sig, {
        device: parsed.data.device,
        bodyRetention: BODY_RETENTION,
        maxLocationPrecision: LOCATION_PRECISION,
      }));
      const out = await ingestEvents(db, OWNER, drafts, blackout);
      return json(res, blackout ? 202 : 200, cors, out);
    } catch (err) {
      console.error("[ingest]", err);
      return json(res, 502, cors, { error: "ingest_failed" });
    }
  }

  if (req.url === "/api/forget") {
    if (!db) return json(res, 503, cors, { error: "no_database", message: "DATABASE_URL غير مضبوط." });
    const ids = Array.isArray(body["entityIds"]) ? body["entityIds"] as string[] : null;
    if (!ids?.length) return json(res, 400, cors, { error: "no_targets" });
    try {
      const reason = typeof body["reason"] === "string" ? body["reason"] : undefined;
      return json(res, 200, cors, await forget(db, OWNER, ids, reason));
    } catch (err) {
      console.error("[forget]", err);
      const code = err instanceof Error && err.message === "not_found" ? 404 : 502;
      return json(res, code, cors, { error: code === 404 ? "not_found" : "forget_failed" });
    }
  }

  if (req.url === "/api/commit") {
    if (!db) return json(res, 503, cors, { error: "no_database", message: "DATABASE_URL غير مضبوط." });
    const candidates = Array.isArray(body.candidates) ? body.candidates as ConfirmedCandidate[] : null;
    if (!candidates?.length) return json(res, 400, cors, { error: "no_candidates" });
    try {
      const out = await commitCandidates(db, OWNER, candidates, {
        capturedAt: new Date().toISOString(),
        redactedCount: typeof body.redactedCount === "number" ? body.redactedCount : 0,
      });
      return json(res, 200, cors, out);
    } catch (err) {
      console.error("[commit]", err);
      return json(res, 502, cors, { error: "commit_failed" });
    }
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const today = typeof body.today === "string" ? body.today : new Date().toISOString().slice(0, 10);
  if (!text) return json(res, 400, cors, { error: "empty_text" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) return json(res, 400, cors, { error: "bad_date" });

  // بعد التحقق: طلب بايظ خطأ عميل مهما كان إعداد الخادم.
  // المفتاح يُقرأ هنا فقط، ولا يُعاد في أي رد.
  if (!process.env["ANTHROPIC_API_KEY"]) {
    return json(res, 503, cors, {
      error: "no_credentials",
      message: "ANTHROPIC_API_KEY غير مضبوط على الخادم. المدخل معطّل حتى يُضبط.",
    });
  }

  try {
    const out = await extract(text, { today });
    return json(res, 200, cors, {
      candidates: out.result.candidates,
      unresolved: out.result.unresolved,
      rejectedCount: out.rejected.length,
      redactionCount: out.redactions.length,
      prepass: { money: out.prepass.money, dates: out.prepass.dates },
    });
  } catch (err) {
    // لا يُسرَّب تفصيل المزوّد إلى العميل
    console.error("[extract]", err);
    return json(res, 502, cors, { error: "extraction_failed" });
  }
});

function sameToken(a: string, b: string): boolean {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  // الأطوال المختلفة تُقارَن بطول ثابت حتى لا يتسرب الطول نفسه
  if (ba.length !== bb.length) { timingSafeEqual(bb, bb); return false; }
  return timingSafeEqual(ba, bb);
}

function json(res: import("node:http").ServerResponse, status: number,
              headers: Record<string, string>, payload: unknown) {
  res.writeHead(status, { ...headers, "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

server.listen(PORT, () => console.log(`gonaim api → http://localhost:${PORT}`));
