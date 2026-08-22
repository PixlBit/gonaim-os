import { createServer } from "node:http";
import { extract } from "@gonaim/intake";

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
  if (req.method !== "POST" || req.url !== "/api/extract") {
    return json(res, 404, cors, { error: "not_found" });
  }

  let raw = "";
  try {
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > MAX_BODY) { req.destroy(); return json(res, 413, cors, { error: "too_large" }); }
    }
  } catch { return json(res, 400, cors, { error: "read_failed" }); }

  let body: { text?: unknown; today?: unknown };
  try { body = JSON.parse(raw); } catch { return json(res, 400, cors, { error: "bad_json" }); }

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
      prepass: { money: out.prepass.money, dates: out.prepass.dates },
    });
  } catch (err) {
    // لا يُسرَّب تفصيل المزوّد إلى العميل
    console.error("[extract]", err);
    return json(res, 502, cors, { error: "extraction_failed" });
  }
});

function json(res: import("node:http").ServerResponse, status: number,
              headers: Record<string, string>, payload: unknown) {
  res.writeHead(status, { ...headers, "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

server.listen(PORT, () => console.log(`gonaim api → http://localhost:${PORT}`));
