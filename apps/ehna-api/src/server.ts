import { existsSync } from "node:fs";

// يقرأ .env من جذر المشروع — نفس سلوك بقية أدوات المستودع، بلا تصدير يدوي.
for (const p of [".env", "../../.env"]) {
  if (existsSync(p)) {
    const before = { ...process.env };
    process.loadEnvFile(p);
    for (const [k, v] of Object.entries(before)) if (v !== undefined) process.env[k] = v;
    break;
  }
}

import { openStore } from "@gonaim/couple-db";
import { createApp } from "./app.js";

/** نقطة التشغيل: تقرأ البيئة وتفتح المنفذ. المنطق كله في `app.ts`. */
const PORT = Number(process.env["EHNA_PORT"] ?? 8788);
const SECRET = process.env["EHNA_SECRET"] ?? "";
const store = openStore();

const server = createApp({
  store,
  secret: SECRET,
  secure: process.env["EHNA_SECURE_COOKIE"] === "1",
  webOrigins: (process.env["EHNA_WEB_ORIGIN"] ?? "http://localhost:5174")
    .split(",").map((s) => s.trim()).filter(Boolean),
  staticRoot: process.env["EHNA_STATIC"] ?? "apps/ehna/dist",
  // الطبقة الاختيارية: نفس مفتاح المستودع. غيابه لا يعطّل شيئًا سواها.
  oracle: {
    apiKey: process.env["ANTHROPIC_API_KEY"] ?? "",
    ...(process.env["EHNA_MODEL"] ? { model: process.env["EHNA_MODEL"] } : {}),
  },
});

server.listen(PORT, () => {
  console.log(`ehna//os → http://localhost:${PORT}`);
  console.log(`تخزين: ${store.describe()}`);
  if (SECRET.length < 32) {
    console.warn("⚠ EHNA_SECRET ناقص — الـAPI هيرفض كل طلب. شغّل npm run ehna:setup.");
  }
  console.log(process.env["ANTHROPIC_API_KEY"]
    ? `الطبقة الاختيارية: شغّالة (${process.env["EHNA_MODEL"] ?? "claude-opus-5"})`
    : "الطبقة الاختيارية: مقفولة — المنصة شغّالة كاملة من غيرها.");
});

const bye = () => { void store.close().finally(() => process.exit(0)); };
process.on("SIGINT", bye);
process.on("SIGTERM", bye);
