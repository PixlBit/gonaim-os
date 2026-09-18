import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { seedSpace } from "@gonaim/couple";
import { FileStore } from "../src/file-store.js";
import { ConflictError, type Vault } from "../src/vault.js";
import { hashPassword, checkPassword, login, passwordProblem,
         readToken, signToken, touchSession, newSession } from "../src/auth.js";

const NOW = new Date("2026-01-10T12:00:00.000Z");

async function freshVault(): Promise<Vault> {
  const him = await hashPassword("gonaim-and-noor-2026");
  const her = await hashPassword("noor-and-gonaim-2026");
  return {
    rev: 0,
    space: seedSpace({ him: { name: "غنيم", handle: "gonaim" }, her: { name: "نور", handle: "noor" }, now: NOW, bare: true }),
    accounts: [
      { key: "him", handle: "gonaim", ...him, failed: 0, createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() },
      { key: "her", handle: "noor", ...her, failed: 0, createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() },
    ],
    sessions: [],
  };
}

let dir = "";
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "ehna-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

describe("المخزَن على ملف", () => {
  it("يُنشأ مرة واحدة ولا يُكتب فوقه", async () => {
    const store = new FileStore(dir);
    expect(store.exists()).toBe(false);
    const v = await store.create(await freshVault());
    expect(v.rev).toBe(1);
    expect(store.exists()).toBe(true);
    await expect(store.create(await freshVault())).rejects.toThrow("vault_exists");
  });

  it("الكتابة بنسخة قديمة تُرفض — الاتنين على تليفونين", async () => {
    const store = new FileStore(dir);
    const v = await store.create(await freshVault());

    const mine = await store.read();
    const hers = await store.read();

    const afterMine = await store.write({ ...mine, space: { ...mine.space, version: 9 } }, v.rev);
    expect(afterMine.rev).toBe(2);

    await expect(store.write({ ...hers, space: { ...hers.space, version: 99 } }, hers.rev))
      .rejects.toBeInstanceOf(ConflictError);

    expect((await store.read()).space.version).toBe(9);
  });

  it("الملف يبقى صالحًا للقراءة بالعين", async () => {
    const store = new FileStore(dir);
    await store.create(await freshVault());
    const raw = await readFile(join(dir, "vault.json"), "utf8");
    expect(raw.split("\n").length).toBeGreaterThan(10);
    expect(JSON.parse(raw).space.people.him.name).toBe("غنيم");
  });

  it("الصور تُحفظ وتُقرأ، والمسارات الملتوية تُرفض", async () => {
    const store = new FileStore(dir);
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0x01, 0x02]);
    const id = await store.putPhoto({ bytes, mime: "image/jpeg" });
    expect(id).toMatch(/^ph_[0-9a-f]{24}\.jpg$/);

    const back = await store.getPhoto(id);
    expect(back?.mime).toBe("image/jpeg");
    expect(Array.from(back?.bytes ?? [])).toEqual(Array.from(bytes));

    expect(await store.getPhoto("../vault.json")).toBeNull();
    expect(await store.getPhoto("ph_zzz.jpg")).toBeNull();
    await expect(store.putPhoto({ bytes, mime: "application/x-msdownload" })).rejects.toThrow("bad_mime");

    await store.removePhoto(id);
    expect(await store.getPhoto(id)).toBeNull();
  });

  it("الكتابات المتوازية تتسلسل ولا تضيع", async () => {
    const store = new FileStore(dir);
    let v = await store.create(await freshVault());
    // خمس كتابات تبدأ معًا: أربع منها لازم تُرفض لأن نسختها قديمة
    const results = await Promise.allSettled(
      [1, 2, 3, 4, 5].map((n) => store.write({ ...v, space: { ...v.space, version: n } }, v.rev)),
    );
    expect(results.filter((r) => r.status === "fulfilled").length).toBe(1);
    v = await store.read();
    expect(v.rev).toBe(2);
  });
});

describe("الدخول", () => {
  it("كلمة السر لا تُخزَّن — بصمتها فقط", async () => {
    const v = await freshVault();
    const acc = v.accounts[0]!;
    expect(acc.hash).not.toContain("gonaim-and-noor-2026");
    expect(acc.salt.length).toBe(32);
    expect(await checkPassword("gonaim-and-noor-2026", acc)).toBe(true);
    expect(await checkPassword("gonaim-and-noor-2025", acc)).toBe(false);
  });

  it("الدخول الصحيح يفتح جلسة وينظّف المنتهي", async () => {
    const v = await freshVault();
    v.sessions.push({ ...newSession("her", new Date("2025-01-01T00:00:00.000Z")), expiresAt: "2025-02-01T00:00:00.000Z" });
    const r = await login(v, "GONAIM", "gonaim-and-noor-2026", { now: NOW, agent: "iPhone" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.session.key).toBe("him");
    expect(r.vault.sessions.length).toBe(1);
    expect(r.vault.sessions[0]?.agent).toBe("iPhone");
  });

  it("خمس محاولات غلط تقفل الحساب ربع ساعة", async () => {
    const v = await freshVault();
    for (let i = 0; i < 4; i++) {
      const bad = await login(v, "gonaim", "غلط", { now: NOW });
      expect(bad).toEqual({ ok: false, reason: "wrong" });
    }
    expect(v.accounts[0]?.failed).toBe(4);

    const fifth = await login(v, "gonaim", "غلط", { now: NOW });
    expect(fifth).toMatchObject({ ok: false, reason: "locked", retryAfterMin: 15 });

    // حتى الصحيحة لا تعمل أثناء القفل
    const during = await login(v, "gonaim", "gonaim-and-noor-2026", { now: new Date(NOW.getTime() + 60_000) });
    expect(during).toMatchObject({ ok: false, reason: "locked" });

    const after = await login(v, "gonaim", "gonaim-and-noor-2026", { now: new Date(NOW.getTime() + 16 * 60_000) });
    expect(after.ok).toBe(true);
    expect(v.accounts[0]?.failed).toBe(0);
    expect(v.accounts[0]?.lockedUntil).toBeUndefined();
  });

  it("حساب غير موجود لا يُفرَّق عن كلمة سر غلط في الرد", async () => {
    const v = await freshVault();
    const r = await login(v, "someone", "whatever-long-pass", { now: NOW });
    expect(r).toEqual({ ok: false, reason: "unknown" });
  });

  it("كلمة سر ضعيفة تُرفض عند الإعداد", () => {
    expect(passwordProblem("12345678901")).toMatch(/أرقام/);
    expect(passwordProblem("short")).toMatch(/10/);
    expect(passwordProblem("noor-w-gonaim")).toBeNull();
  });
});

describe("التوكن", () => {
  const secret = "s".repeat(40);

  it("يُقرأ بالمفتاح الصحيح وحده", () => {
    const t = signToken("abc123", secret);
    expect(readToken(t, secret)).toBe("abc123");
    expect(readToken(t, "x".repeat(40))).toBeNull();
    expect(readToken(`${t}x`, secret)).toBeNull();
    expect(readToken("abc123", secret)).toBeNull();
    expect(readToken("", secret)).toBeNull();
  });

  it("الجلسة المنتهية لا تُقبل", () => {
    const v: Vault = { rev: 1, space: {} as never, accounts: [], sessions: [] };
    const live = newSession("him", NOW);
    const dead = { ...newSession("her", NOW), expiresAt: "2025-01-01T00:00:00.000Z" };
    v.sessions = [live, dead];
    expect(touchSession(v, live.id, NOW)?.key).toBe("him");
    expect(touchSession(v, dead.id, NOW)).toBeNull();
    expect(touchSession(v, "ghost", NOW)).toBeNull();
  });

  it("آخر ظهور يُحدَّث كل ساعة لا كل طلب", () => {
    const s = newSession("him", NOW);
    const v: Vault = { rev: 1, space: {} as never, accounts: [], sessions: [s] };
    touchSession(v, s.id, new Date(NOW.getTime() + 60_000));
    expect(v.sessions[0]?.lastSeenAt).toBe(NOW.toISOString());
    touchSession(v, s.id, new Date(NOW.getTime() + 7_200_000));
    expect(v.sessions[0]?.lastSeenAt).not.toBe(NOW.toISOString());
  });
});
