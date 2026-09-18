import type { IncomingMessage, ServerResponse } from "node:http";

/** أدوات HTTP صغيرة — لا إطار، لأن السطح الصغير أسهل في مراجعته من إطار. */

export interface Ctx {
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  cookies: Record<string, string>;
  ip: string;
}

export function json(res: ServerResponse, status: number, payload: unknown,
                     extra: Record<string, string | string[]> = {}): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...extra,
  });
  res.end(body);
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 1) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export interface CookieOptions {
  maxAgeSec: number;
  secure: boolean;
}

/**
 * كوكي الجلسة.
 *
 * `HttpOnly` يمنع أي سكربت من قراءتها — فلا تُسرَق بثغرة XSS.
 * `SameSite=Strict` يمنع المتصفح من إرسالها مع أي طلب قادم من موقع آخر،
 * وهو ما يُبطل CSRF من أصله بدل معالجته برموز إضافية.
 */
export function cookie(name: string, value: string, o: CookieOptions): string {
  const bits = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/", "HttpOnly", "SameSite=Strict",
    `Max-Age=${o.maxAgeSec}`,
  ];
  if (o.secure) bits.push("Secure");
  return bits.join("; ");
}

export async function readBody(req: IncomingMessage, max: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = chunk as Buffer;
    size += buf.length;
    if (size > max) { req.destroy(); throw new Error("too_large"); }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

/**
 * تحقق من نوع الصورة بالبايتات لا بالترويسة.
 *
 * `content-type` نص يكتبه العميل ويستطيع الكذب فيه. البايتات الأولى لا
 * تكذب: ملف تنفيذي بترويسة `image/png` يُرفض هنا.
 */
export function sniffImage(bytes: Buffer): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.subarray(0, 4).toString("ascii") === "GIF8") return "image/gif";
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

/** وصف مختصر للجهاز من `user-agent` — للتعرف على الجلسات لا للتتبع. */
export function deviceName(ua: string | undefined): string {
  if (!ua) return "جهاز";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Mac OS X/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "جهاز";
}
