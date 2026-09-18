import { mkdirSync, existsSync } from "node:fs";
import { readFile, writeFile, rename, unlink, readdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { join, resolve } from "node:path";
import { ConflictError, type Photo, type Store, type Vault } from "./vault.js";

/**
 * التخزين على ملف.
 *
 * ليس "وضع تجريبي". لاثنين ومساحة واحدة، ملف JSON على قرص محلي مع كتابة
 * ذرّية أصدق من قاعدة بيانات نصف مضبوطة: يُنسخ بـ`cp`، ويُقرأ بعد عشر
 * سنين بأي محرر، ولا يحتاج خادمًا يعمل ليحتفظ بالبيانات.
 *
 * الكتابة تمر بملف مؤقت ثم `rename` — وهي عملية ذرّية على نفس نظام الملفات.
 * الكتابة المباشرة تترك ملفًا نصفه قديم ونصفه جديد إذا انقطعت الكهرباء في
 * أسوأ لحظة ممكنة، وهي لحظة تحدث.
 */

const VAULT = "vault.json";
const PHOTOS = "photos";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
};
const MIME: Record<string, string> = Object.fromEntries(
  Object.entries(EXT).map(([m, e]) => [e, m]),
);

export class FileStore implements Store {
  private readonly dir: string;
  /** الكتابات تتسلسل: قراءة-تعديل-كتابة متوازية تفقد إحداهما. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(dir: string) {
    this.dir = resolve(dir);
    mkdirSync(join(this.dir, PHOTOS), { recursive: true });
  }

  get path(): string { return join(this.dir, VAULT); }

  describe(): string { return `ملف: ${this.path}`; }

  exists(): boolean { return existsSync(this.path); }

  async read(): Promise<Vault> {
    const raw = await readFile(this.path, "utf8");
    return JSON.parse(raw) as Vault;
  }

  async write(next: Vault, expectedRev: number): Promise<Vault> {
    return this.serial(async () => {
      const current = await this.read();
      if (current.rev !== expectedRev) throw new ConflictError();
      const saved: Vault = { ...next, rev: current.rev + 1 };
      await this.overwrite(saved);
      return saved;
    });
  }

  /** الكتابة الأولى — تُنشئ المخزَن ولا تكتب فوق موجود. */
  async create(vault: Vault): Promise<Vault> {
    return this.serial(async () => {
      if (this.exists()) throw new Error("vault_exists");
      const saved: Vault = { ...vault, rev: 1 };
      await this.overwrite(saved);
      return saved;
    });
  }

  /** كتابة بلا فحص نسخة — لسطر الأوامر وحده (تغيير كلمة سر، إصلاح). */
  async replace(vault: Vault): Promise<Vault> {
    return this.serial(async () => {
      const saved: Vault = { ...vault, rev: vault.rev + 1 };
      await this.overwrite(saved);
      return saved;
    });
  }

  private async overwrite(v: Vault): Promise<void> {
    const tmp = `${this.path}.${randomBytes(4).toString("hex")}.tmp`;
    await writeFile(tmp, JSON.stringify(v, null, 2), { mode: 0o600 });
    await rename(tmp, this.path);
  }

  async putPhoto(photo: Photo): Promise<string> {
    const ext = EXT[photo.mime];
    if (!ext) throw new Error("bad_mime");
    const id = `ph_${randomBytes(12).toString("hex")}.${ext}`;
    await writeFile(join(this.dir, PHOTOS, id), photo.bytes, { mode: 0o600 });
    return id;
  }

  async getPhoto(id: string): Promise<Photo | null> {
    if (!safeId(id)) return null;
    const ext = id.slice(id.lastIndexOf(".") + 1);
    const mime = MIME[ext];
    if (!mime) return null;
    try {
      const bytes = await readFile(join(this.dir, PHOTOS, id));
      return { bytes, mime };
    } catch { return null; }
  }

  async removePhoto(id: string): Promise<void> {
    if (!safeId(id)) return;
    await unlink(join(this.dir, PHOTOS, id)).catch(() => {});
  }

  /** الصور الموجودة على القرص — لتنظيف ما لم تعد أي ذكرى تشير إليه. */
  async listPhotos(): Promise<string[]> {
    return readdir(join(this.dir, PHOTOS)).catch(() => []);
  }

  async close(): Promise<void> { await this.queue.catch(() => {}); }

  private serial<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn);
    // الطابور لا ينكسر بفشل عملية — وإلا توقفت كل كتابة بعدها
    this.queue = run.catch(() => {});
    return run;
  }
}

/** يمنع `../` وأي مسار خارج مجلد الصور. */
function safeId(id: string): boolean {
  return /^ph_[0-9a-f]{24}\.(jpg|png|webp|gif)$/.test(id);
}
