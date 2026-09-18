import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres, { type Sql } from "postgres";
import { migrate } from "@gonaim/db";
import { seedSpace } from "@gonaim/couple";
import { PgStore } from "../src/pg-store.js";
import { ConflictError, type Vault } from "../src/vault.js";

/**
 * نفس عقد المخزَن، على قاعدة حقيقية.
 *
 * اختبارات المخزَن الأخرى تعمل على ملف، وهو المسار الافتراضي. وهذا الملف
 * يثبت أن المسار الثاني — المستعمَل عند النشر — يعطي **نفس الضمانات**:
 * كتابة بنسخة قديمة تُرفض، والصورة تعود ببايتاتها كما دخلت.
 *
 * يُتخطّى بلا `EHNA_DATABASE_URL` مثل بقية اختبارات القاعدة في المستودع:
 * اختبار يحتاج خدمة غير موجودة يجب أن يصمت، لا أن يفشل.
 */

const URL = process.env["EHNA_DATABASE_URL"];
const d = URL ? describe : describe.skip;
const NOW = new Date("2026-01-10T12:00:00.000Z");

let sql: Sql;
let store: PgStore;

function vault(): Vault {
  return {
    rev: 0,
    space: seedSpace({
      him: { name: "غنيم", handle: "g" }, her: { name: "نور", handle: "n" },
      now: NOW, bare: true,
    }),
    accounts: [],
    sessions: [],
  };
}

beforeAll(async () => {
  if (!URL) return;
  sql = postgres(URL, { max: 2, onnotice: () => {} });
  await sql`create schema if not exists auth`;
  await sql.unsafe(`create or replace function auth.uid() returns uuid
    language sql stable as $$ select '00000000-0000-0000-0000-000000000001'::uuid $$`);
  await migrate(sql, "supabase/migrations");
  await sql`delete from ehna_photo`;
  await sql`delete from ehna_vault`;
  store = new PgStore(URL);
  await store.create(vault());
});

afterAll(async () => {
  if (!URL) return;
  await store.close();
  await sql.end();
});

d("المخزَن على Postgres", () => {
  it("يقرأ ما كُتب، والنسخة تتقدّم", async () => {
    const read = await store.read();
    expect(read.space.people.him.name).toBe("غنيم");
    expect(read.rev).toBeGreaterThan(0);

    const saved = await store.write({ ...read, space: { ...read.space, version: 7 } }, read.rev);
    expect(saved.rev).toBe(read.rev + 1);
    expect((await store.read()).space.version).toBe(7);
  });

  it("الكتابة بنسخة قديمة تُرفض — نفس ضمان الملف", async () => {
    const mine = await store.read();
    const hers = await store.read();

    await store.write({ ...mine, space: { ...mine.space, version: 11 } }, mine.rev);
    await expect(store.write({ ...hers, space: { ...hers.space, version: 99 } }, hers.rev))
      .rejects.toBeInstanceOf(ConflictError);

    // ما كُتب أولًا هو الباقي — لا كتابة فوق كتابة
    expect((await store.read()).space.version).toBe(11);
  });

  it("الصورة تعود ببايتاتها كما دخلت", async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 250, 255, 0]);
    const id = await store.putPhoto({ bytes, mime: "image/png" });
    expect(id).toMatch(/^ph_[0-9a-f]{24}\.png$/);

    const back = await store.getPhoto(id);
    expect(back?.mime).toBe("image/png");
    expect(Array.from(back?.bytes ?? [])).toEqual(Array.from(bytes));
    expect(await store.listPhotos()).toContain(id);

    await store.removePhoto(id);
    expect(await store.getPhoto(id)).toBeNull();
  });

  it("صيغة غير مسموحة تُرفض قبل القاعدة", async () => {
    await expect(store.putPhoto({ bytes: new Uint8Array([1]), mime: "application/pdf" }))
      .rejects.toThrow("bad_mime");
  });

  it("معرّف غير موجود يعود فارغًا لا خطأ", async () => {
    expect(await store.getPhoto("ph_000000000000000000000000.png")).toBeNull();
  });
});
