import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { apply, Actions, seedSpace } from "@gonaim/couple";
import { FileStore } from "../src/file-store.js";
import { backup, listBackups, prune, restore } from "../src/backup.js";
import type { Vault } from "../src/vault.js";

/**
 * النسخة تُختبر بالرجوع، لا بالوجود.
 *
 * أن يُكتب ملف ليس دليلًا على شيء؛ الدليل أن مساحة فاضية تعود بعده كما
 * كانت — بالخزنة والصور ومعرّفاتها.
 */

const NOW = new Date("2026-01-10T12:00:00.000Z");
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 9, 8, 7, 255, 0, 13]);

let home = "", away = "", backups = "";

function vault(): Vault {
  let space = seedSpace({
    him: { name: "غنيم", handle: "g" }, her: { name: "نور", handle: "n" },
    now: NOW, bare: true,
  });
  space = apply(space, Actions.parse({ type: "memory.add", date: "2026-01-04", title: "أول قعدة" }),
    { by: "him", now: NOW });
  return {
    rev: 0,
    space,
    accounts: [{
      key: "him", handle: "g", hash: "deadbeef", salt: "cafe", failed: 0,
      createdAt: NOW.toISOString(), updatedAt: NOW.toISOString(),
    }],
    sessions: [{
      id: "old-session", key: "him",
      createdAt: NOW.toISOString(), lastSeenAt: NOW.toISOString(),
      expiresAt: "2099-01-01T00:00:00.000Z",
    }],
  };
}

beforeEach(async () => {
  home = await mkdtemp(join(tmpdir(), "ehna-home-"));
  away = await mkdtemp(join(tmpdir(), "ehna-away-"));
  backups = await mkdtemp(join(tmpdir(), "ehna-bk-"));
});
afterEach(async () => {
  for (const d of [home, away, backups]) await rm(d, { recursive: true, force: true });
});

describe("النسخة والرجوع", () => {
  it("مساحة فاضية تعود كما كانت — بالصور ومعرّفاتها", async () => {
    const source = new FileStore(home);
    await source.create(vault());
    const photoId = await source.putPhoto({ bytes: PNG, mime: "image/png" });

    // تُربَط الصورة بذكرى حتى يكون الاسترجاع مرئيًا في المساحة لا في المجلد
    const live = await source.read();
    const memory = live.space.memories[0]!;
    live.space.memories = [{ ...memory, photos: [photoId] }];
    await source.write(live, live.rev);

    const made = await backup(source, backups, NOW);
    expect(made.photos).toBe(1);
    expect(made.rev).toBeGreaterThan(0);

    // مساحة تانية فاضية تمامًا
    const target = new FileStore(away);
    await target.create({ ...vault(), space: { ...vault().space, memories: [] } });
    expect((await target.read()).space.memories.length).toBe(0);

    const back = await restore(target, made.path);
    expect(back.photos).toBe(1);

    const after = await target.read();
    expect(after.space.memories[0]?.title).toBe("أول قعدة");
    expect(after.space.memories[0]?.photos).toEqual([photoId]);
    expect(after.accounts[0]?.hash).toBe("deadbeef");

    // نفس المعرّف ونفس البايتات — وإلا فالألبوم يرجع فاضي
    const photo = await target.getPhoto(photoId);
    expect(Array.from(photo?.bytes ?? [])).toEqual(Array.from(PNG));
  });

  it("الجلسات لا ترجع — توكن جهاز قديم لا يُحيا بنسخة", async () => {
    const source = new FileStore(home);
    await source.create(vault());
    const made = await backup(source, backups, NOW);

    const target = new FileStore(away);
    await target.create(vault());
    await restore(target, made.path);

    expect((await target.read()).sessions).toEqual([]);
  });

  it("الصورة الموجودة بنفس المعرّف لا تُكتب فوقها", async () => {
    const source = new FileStore(home);
    await source.create(vault());
    const id = await source.putPhoto({ bytes: PNG, mime: "image/png" });
    const made = await backup(source, backups, NOW);

    const back = await restore(source, made.path);
    expect(back.photos).toBe(0);
    expect(back.photosKept).toBe(1);
    expect(Array.from((await source.getPhoto(id))?.bytes ?? [])).toEqual(Array.from(PNG));
  });

  it("نسخة بلا خزنة تُرفض بوضوح", async () => {
    const target = new FileStore(away);
    await target.create(vault());
    await expect(restore(target, backups)).rejects.toThrow(/no_vault_in_backup/);
  });

  it("التقليم يبقي الأحدث ويحذف ما قبله", async () => {
    const source = new FileStore(home);
    await source.create(vault());
    for (let i = 0; i < 5; i++) {
      await backup(source, backups, new Date(NOW.getTime() + i * 86_400_000));
    }
    expect((await listBackups(backups)).length).toBe(5);

    const dropped = await prune(backups, 2);
    expect(dropped.length).toBe(3);

    const left = await listBackups(backups);
    expect(left.length).toBe(2);
    // الأحدث أولًا، والباقي هو الأحدث فعلًا
    expect(left[0]).toContain("2026-01-14");
    expect((await readdir(backups)).length).toBe(2);
  });
});
