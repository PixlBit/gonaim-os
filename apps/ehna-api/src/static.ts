import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import type { ServerResponse } from "node:http";

/**
 * خدمة الواجهة المبنية.
 *
 * الخادم يقدّم الـAPI والواجهة معًا: أصل واحد يعني كوكي واحدة بلا CORS
 * ولا ثغرة أصل متقاطع، ونشرًا بعملية واحدة على خادم واحد. في التطوير
 * تعمل Vite على منفذها وتوكّل الطلبات لهنا، فلا يتغير شيء في الكود.
 */

/**
 * ترويسات الأمان.
 *
 * تُضبط في الخادم نفسه لا في الوسيط: من ينشر بلا Caddy أو خلف وسيط آخر
 * يحصل على نفس الحماية. وأهمها `script-src 'self'` — الواجهة المبنية لا
 * تحمل سكربتًا سطريًا واحدًا، فأي سكربت مُحقَن لا يعمل أصلًا.
 *
 * `img-src https:` لأن الذكرى قد تحمل رابط صورة خارجية؛ والصورة لا تنفّذ
 * شيئًا. و`style-src 'unsafe-inline'` لأن الواجهة تستعمل `style` في
 * العناصر — وهو ما لا يُنفَّذ بدوره.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  // `unsafe-inline` للأنماط وحدها: React يكتب `style=` على العناصر، وهو
  // ليس ثغرة تنفيذ — أما `script-src` فبلا استثناء واحد.
  "style-src 'self' 'unsafe-inline'",
  // الخطوط داخل الحزمة منذ أن صارت مستضافة عندنا، فلا نطاق خارجي
  "font-src 'self'",
  "img-src 'self' data: blob: https:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

const SECURITY: Record<string, string> = {
  "content-security-policy": CSP,
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  // مساحة خاصة: لا فهرسة حتى لو تسرّب الرابط
  "x-robots-tag": "noindex, nofollow, noarchive",
};

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".webmanifest": "application/manifest+json",
};

export class Static {
  private readonly root: string;
  readonly available: boolean;

  constructor(root: string) {
    this.root = resolve(root);
    this.available = existsSync(join(this.root, "index.html"));
  }

  /** يعيد true إن خدم الطلب. */
  serve(pathname: string, res: ServerResponse): boolean {
    if (!this.available) return false;

    const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
    let file = join(this.root, rel);
    // خارج الجذر = محاولة خروج. لا تفسير آخر لها.
    if (!file.startsWith(this.root + sep) && file !== this.root) return false;

    if (!existsSync(file) || statSync(file).isDirectory()) {
      // تطبيق صفحة واحدة: أي مسار غير معروف يفتح نفس الصفحة، والتوجيه في المتصفح
      file = join(this.root, "index.html");
    }

    const ext = extname(file);
    const type = TYPES[ext] ?? "application/octet-stream";
    // الأصول مبصومة باسمها من Vite فتُخزَّن طويلًا؛ الصفحة نفسها لا تُخزَّن أبدًا
    const cache = ext === ".html"
      ? "no-store"
      // عامل الخدمة يحدّد ما يُخزَّن، فلا يصحّ أن يُخزَّن هو: نسخة قديمة منه
      // تبقى تخدم نسخة قديمة من كل شيء.
      : rel === "sw.js" ? "no-cache"
        : rel.startsWith("assets/") ? "public, max-age=31536000, immutable" : "public, max-age=3600";

    res.writeHead(200, {
      "content-type": type,
      "cache-control": cache,
      // الترويسات على الصفحة وحدها: الأصول لا تحتاجها ولا تُفسَّر كمستند
      ...(ext === ".html" ? SECURITY : {}),
    });
    createReadStream(file).pipe(res);
    return true;
  }
}
