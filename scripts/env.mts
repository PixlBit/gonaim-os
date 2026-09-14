/**
 * تحميل `.env`.
 *
 * `process.loadEnvFile` أصلية في Node 22 — بلا اعتماد خارجي. متغيرات
 * البيئة الحقيقية تفوز على الملف، فالتشغيل في CI أو بمتغير مؤقت يعمل
 * بلا تعديل الملف.
 */
import { existsSync } from "node:fs";

export function loadEnv(path = ".env"): boolean {
  if (!existsSync(path)) return false;
  const before = { ...process.env };
  process.loadEnvFile(path);
  for (const [k, v] of Object.entries(before)) {
    if (v !== undefined) process.env[k] = v;
  }
  return true;
}

export function databaseUrl(): string | undefined {
  return process.env["DATABASE_URL"];
}

export const OWNER =
  process.env["OWNER_ID"] ?? "00000000-0000-0000-0000-000000000001";
