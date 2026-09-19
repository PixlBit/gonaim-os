import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { OpenedStore } from "./open.js";
import type { Vault } from "./vault.js";

/**
 * النسخ الاحتياطي والاسترجاع.
 *
 * النسخة التي لا تعرف كيف ترجع ليست نسخة احتياطية — هي ملف يريح صاحبه.
 * فالاثنان هنا في ملف واحد، ويُختبران معًا: نسخة ثم استرجاع ثم مقارنة.
 *
 * والنسخة **كاملة**: الخزنة والصور. ألبوم بلا صوره ليس ألبومًا، وقد رأينا
 * كم يسهل أن تُنسى الصور لأنها لا تعيش في نفس الملف.
 *
 * والمعرّفات تُحفظ كما هي (`putPhotoAs`): الذكرى تشير إلى صورتها باسمها،
 * فاسترجاع يعيد تسميتها يعيد ألبومًا فارغًا.
 *
 * وهي تعمل عبر عقد المخزَن لا عبر القرص، فتنسخ من ملف وتسترجع إلى
 * Postgres والعكس — وهو الطريق الذي سيسلكه أي أحد ينتقل من جهازه إلى خادم.
 */

export interface BackupReport {
  path: string;
  photos: number;
  /** نسخة المخزَن وقت أخذ النسخة — يُعرف بها ما فاتها. */
  rev: number;
}

export interface RestoreReport {
  rev: number;
  photos: number;
  /** صور كانت موجودة بنفس المعرّف فلم تُكتب فوقها. */
  photosKept: number;
}

const STAMP = /^ehna-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/;

function stamp(now: Date): string {
  return `ehna-${now.toISOString().slice(0, 19).replace(/:/g, "-")}`;
}

export async function backup(store: OpenedStore, into: string, now: Date = new Date()): Promise<BackupReport> {
  const vault = await store.read();
  const dir = resolve(join(into, stamp(now)));
  await mkdir(join(dir, "photos"), { recursive: true });

  // المخزَن كاملًا — بما فيه بصمات كلمات السر. النسخة تُعامَل كالمخزَن نفسه:
  // 0600، وخارج المستودع، ولا تُرفع.
  await writeFile(join(dir, "vault.json"), JSON.stringify(vault, null, 2), { mode: 0o600 });

  let photos = 0;
  for (const id of await store.listPhotos()) {
    const photo = await store.getPhoto(id);
    if (!photo) continue;
    await writeFile(join(dir, "photos", id), photo.bytes, { mode: 0o600 });
    photos += 1;
  }

  return { path: dir, photos, rev: vault.rev };
}

export async function restore(store: OpenedStore, from: string): Promise<RestoreReport> {
  const dir = resolve(from);
  const file = join(dir, "vault.json");
  if (!existsSync(file)) throw new Error(`no_vault_in_backup: ${file}`);

  const vault = JSON.parse(await readFile(file, "utf8")) as Vault;
  if (!vault.space || !Array.isArray(vault.accounts)) throw new Error("bad_backup");

  // الجلسات لا تُسترجَع: توكن من جهاز قديم لا يجوز أن يُحيا بنسخة احتياطية.
  const restored: Vault = { ...vault, sessions: [] };
  await store.replace(restored);

  let photos = 0, photosKept = 0;
  const names = await readdir(join(dir, "photos")).catch(() => []);
  for (const id of names) {
    const bytes = await readFile(join(dir, "photos", id));
    const written = await store.putPhotoAs(id, { bytes, mime: mimeOf(id) });
    if (written) photos += 1; else photosKept += 1;
  }

  const after = await store.read();
  return { rev: after.rev, photos, photosKept };
}

/** يبقي أحدث `keep` نسخة ويحذف ما قبلها. يعيد ما حُذف. */
export async function prune(into: string, keep: number): Promise<string[]> {
  const dir = resolve(into);
  const all = (await readdir(dir).catch(() => []))
    .filter((name) => STAMP.test(name))
    .sort();                       // الاسم مؤرَّخ، فالفرز الأبجدي زمني
  const old = all.slice(0, Math.max(0, all.length - keep));
  for (const name of old) await rm(join(dir, name), { recursive: true, force: true });
  return old;
}

export async function listBackups(into: string): Promise<string[]> {
  return (await readdir(resolve(into)).catch(() => []))
    .filter((name) => STAMP.test(name))
    .sort()
    .reverse();
}

function mimeOf(id: string): string {
  const ext = id.slice(id.lastIndexOf(".") + 1);
  return ({ jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" } as Record<string, string>)[ext]
    ?? "image/jpeg";
}
