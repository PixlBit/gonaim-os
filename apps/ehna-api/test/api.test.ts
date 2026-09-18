import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { seedSpace } from "@gonaim/couple";
import { FileStore, hashPassword, type Vault } from "@gonaim/couple-db";
import { createApp } from "../src/app.js";

/**
 * اختبار الخادم كما يراه المتصفح: طلبات حقيقية على منفذ حقيقي.
 * الضمانات التي تهم (الحجب، الملكية، الرفض) لا تُختبر إلا من هنا —
 * اختبار يستدعي الدوال مباشرة يتخطى بالضبط الطبقة التي تحرس.
 */

const SECRET = "x".repeat(40);
const ORIGIN = "http://localhost:5174";
const HIM_PW = "gonaim-and-noor-2026";
const HER_PW = "noor-and-gonaim-2026";

let dir = "", base = "", server: Server, store: FileStore;

async function makeVault(): Promise<Vault> {
  return {
    rev: 0,
    space: seedSpace({
      him: { name: "غنيم", handle: "gonaim" },
      her: { name: "نور", handle: "noor" },
      now: new Date("2026-01-10T12:00:00.000Z"), bare: true,
    }),
    accounts: [
      { key: "him", handle: "gonaim", ...(await hashPassword(HIM_PW)), failed: 0,
        createdAt: "2026-01-10T12:00:00.000Z", updatedAt: "2026-01-10T12:00:00.000Z" },
      { key: "her", handle: "noor", ...(await hashPassword(HER_PW)), failed: 0,
        createdAt: "2026-01-10T12:00:00.000Z", updatedAt: "2026-01-10T12:00:00.000Z" },
    ],
    sessions: [],
  };
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "ehna-api-"));
  store = new FileStore(dir);
  server = createApp({
    store, secret: SECRET, secure: false,
    webOrigins: [ORIGIN], staticRoot: join(dir, "no-site"),
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((done) => server.close(() => done()));
  await rm(dir, { recursive: true, force: true });
});

interface Client { cookie: string }
const client = (): Client => ({ cookie: "" });

async function call(c: Client, path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(c.cookie ? { cookie: c.cookie } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const set = res.headers.get("set-cookie");
  if (set) c.cookie = set.split(";")[0] ?? "";
  return res;
}

const act = (c: Client, action: unknown) =>
  call(c, "/api/act", { method: "POST", body: JSON.stringify({ action }) });

describe("قبل الإعداد", () => {
  it("الصحة تقول إن المساحة مش متعملة", async () => {
    const r = await (await call(client(), "/api/health")).json();
    expect(r.initialized).toBe(false);
  });

  it("كل شيء آخر مقفول", async () => {
    expect((await call(client(), "/api/state")).status).toBe(401);
    const r = await call(client(), "/api/login", {
      method: "POST", body: JSON.stringify({ handle: "gonaim", password: HIM_PW }),
    });
    expect(r.status).toBe(503);
    expect((await r.json()).error).toBe("not_initialized");
  });
});

describe("الدخول", () => {
  beforeAll(async () => { await store.create(await makeVault()); });

  it("بيانات غلط لا تفتح جلسة", async () => {
    const c = client();
    const r = await call(c, "/api/login", {
      method: "POST", body: JSON.stringify({ handle: "gonaim", password: "غلط خالص" }),
    });
    expect(r.status).toBe(401);
    expect(c.cookie).toBe("");
  });

  it("الدخول الصحيح يعطي المساحة والتقرير", async () => {
    const c = client();
    const r = await call(c, "/api/login", {
      method: "POST", body: JSON.stringify({ handle: "GONAIM", password: HIM_PW }),
    });
    expect(r.status).toBe(200);
    expect(r.headers.get("set-cookie")).toContain("HttpOnly");
    expect(r.headers.get("set-cookie")).toContain("SameSite=Strict");
    const body = await r.json();
    expect(body.me).toBe("him");
    expect(body.space.people.her.name).toBe("نور");
    expect(body.report.attention.map((a: { code: string }) => a.code)).toContain("no_wedding_date");
    // البصمات لا تغادر الخادم
    expect(JSON.stringify(body)).not.toContain("salt");
  });

  it("أصل غريب يُرفض قبل أي شيء", async () => {
    const r = await call(client(), "/api/state", { headers: { origin: "https://evil.example" } });
    expect(r.status).toBe(403);
  });

  it("أصلنا نفسه مسموح — الصفحة تحمّل ملفاتها", async () => {
    // Vite تضع crossorigin على وسم السكربت فيرسل المتصفح Origin لطلب
    // من نفس الأصل؛ رفضه كان يمنع الواجهة من التحميل أصلًا
    const self = base.replace("http://", "");
    const r = await call(client(), "/api/health", { headers: { origin: `http://${self}` } });
    expect(r.status).toBe(200);
  });

  it("توكن مزوّر لا يمر", async () => {
    const r = await call({ cookie: "ehna_s=abc.def" }, "/api/state");
    expect(r.status).toBe(401);
  });
});

describe("الأفعال", () => {
  let him: Client;

  beforeAll(async () => {
    him = client();
    await call(him, "/api/login", {
      method: "POST", body: JSON.stringify({ handle: "gonaim", password: HIM_PW }),
    });
  });

  it("الفعل الصحيح يكتب ويعيد الحالة كاملة", async () => {
    const r = await act(him, { type: "task.add", title: "حجز القاعة", priority: 1 });
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.space.tasks[0].title).toBe("حجز القاعة");
    expect(body.space.log[0].summary).toBe("غنيم: مهمة جديدة: حجز القاعة");
    expect(body.rev).toBeGreaterThan(1);
  });

  it("الفعل الفاسد يُرفض بوصف يفيد", async () => {
    const r = await act(him, { type: "task.add", title: "" });
    expect(r.status).toBe(400);
    const body = await r.json();
    expect(body.error).toBe("bad_action");
    expect(body.issues.length).toBeGreaterThan(0);
  });

  it("فعل غير معروف لا يُنفَّذ", async () => {
    expect((await act(him, { type: "vault.dump" })).status).toBe(400);
  });

  it("قاعدة المجال تُرفض بكود واضح", async () => {
    await act(him, { type: "capsule.write", title: "لبعدين", body: "سر بينا SEALED-77", openAt: "2030-01-01" });
    const state = await (await call(him, "/api/state")).json();
    const id = state.space.capsules[0].id;
    const r = await act(him, { type: "capsule.open", id });
    expect(r.status).toBe(409);
    expect((await r.json()).error).toBe("too_early");
  });

  it("الكبسولة المقفولة لا يصل نصها للطرف الآخر أصلًا", async () => {
    const her = client();
    await call(her, "/api/login", {
      method: "POST", body: JSON.stringify({ handle: "noor", password: HER_PW }),
    });
    const raw = await (await call(her, "/api/state")).text();
    // العلامة لاتينية عمدًا: كلمة عربية قصيرة تظهر مصادفة داخل كلمات أخرى
    expect(raw).not.toContain("SEALED-77");
    const state = JSON.parse(raw);
    expect(state.space.capsules[0].sealed).toBe(true);
    expect(state.space.capsules[0].body).toBe("");
  });
});

describe("الصور", () => {
  let him: Client;
  const PNG = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(64, 7),
  ]);
  /** رأس ملف تنفيذي — ترويسته تقول "صورة" وبايتاته تقول غير ذلك. */
  const NOT_IMAGE = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff]);

  beforeAll(async () => {
    him = client();
    await call(him, "/api/login", {
      method: "POST", body: JSON.stringify({ handle: "gonaim", password: HIM_PW }),
    });
  });

  it("ما ليس صورة يُرفض مهما قالت الترويسة", async () => {
    const r = await call(him, "/api/photo", {
      method: "POST", headers: { "content-type": "image/png" }, body: NOT_IMAGE,
    });
    expect(r.status).toBe(415);
  });

  it("الصورة تُرفع وتُقرأ، ولا تُقرأ بلا جلسة", async () => {
    const up = await call(him, "/api/photo", {
      method: "POST", headers: { "content-type": "application/octet-stream" }, body: PNG,
    });
    expect(up.status).toBe(200);
    const { id } = await up.json();
    expect(id).toMatch(/\.png$/);

    const get = await call(him, `/api/photo/${id}`);
    expect(get.status).toBe(200);
    expect(get.headers.get("content-type")).toBe("image/png");
    expect(Buffer.from(await get.arrayBuffer()).equals(PNG)).toBe(true);

    expect((await call(client(), `/api/photo/${id}`)).status).toBe(401);
  });
});

describe("الطبقة الاختيارية", () => {
  let him: Client;

  beforeAll(async () => {
    him = client();
    await call(him, "/api/login", {
      method: "POST", body: JSON.stringify({ handle: "gonaim", password: HIM_PW }),
    });
  });

  it("الحالة بتقول إنها مقفولة — الواجهة مش بتخمّن", async () => {
    const body = await (await call(him, "/api/state")).json();
    expect(body.features.oracle).toBe(false);
    expect(body.features.model).toBeNull();
  });

  it("البريف بيتعرض كامل قبل أي نداء، ومعاه اللي مابيتبعتش", async () => {
    const r = await call(him, "/api/oracle/brief", {
      method: "POST", body: JSON.stringify({ kind: "letter" }),
    });
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.brief.title).toBe("رسالة الشهر");
    expect(body.brief.text).toContain("غنيم");
    expect(body.brief.withheld.join(" ")).toContain("الكبسولات");
    // الكبسولة المكتوبة في الاختبار السابق نصها مايخرجش
    expect(JSON.stringify(body)).not.toContain("SEALED-77");
  });

  it("من غير مفتاح بيرجّع الوقايع الحتمية مش خطأ", async () => {
    const r = await call(him, "/api/oracle/ask", {
      method: "POST", body: JSON.stringify({ kind: "week" }),
    });
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.offline).toBe(true);
    expect(body.text).toContain("حتمية");
  });

  it("نوع مش معروف يُرفض", async () => {
    const r = await call(him, "/api/oracle/ask", {
      method: "POST", body: JSON.stringify({ kind: "الدردشة" }),
    });
    expect(r.status).toBe(400);
  });

  it("بلا جلسة مفيش بريف", async () => {
    const r = await call(client(), "/api/oracle/brief", {
      method: "POST", body: JSON.stringify({ kind: "letter" }),
    });
    expect(r.status).toBe(401);
  });
});

describe("الخروج والتصدير", () => {
  it("التصدير يحمل المساحة بلا حسابات", async () => {
    const c = client();
    await call(c, "/api/login", {
      method: "POST", body: JSON.stringify({ handle: "noor", password: HER_PW }),
    });
    const r = await call(c, "/api/export");
    expect(r.headers.get("content-disposition")).toContain("ehna-");
    const body = await r.json();
    expect(body.space.people.him.name).toBe("غنيم");
    expect(body.accounts).toBeUndefined();
    expect(body.sessions).toBeUndefined();
  });

  it("الخروج يقفل الجلسة فورًا", async () => {
    const c = client();
    await call(c, "/api/login", {
      method: "POST", body: JSON.stringify({ handle: "noor", password: HER_PW }),
    });
    expect((await call(c, "/api/state")).status).toBe(200);
    const out = await call(c, "/api/logout", { method: "POST" });
    expect(out.status).toBe(200);
    // الكوكي المُمحاة لا تُقبل، حتى لو أُعيد إرسال القديمة
    expect((await call(c, "/api/state")).status).toBe(401);
  });
});
