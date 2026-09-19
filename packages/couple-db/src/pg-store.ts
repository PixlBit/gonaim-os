import postgres, { type Sql } from "postgres";
import { randomBytes } from "node:crypto";
import { ConflictError, type Photo, type Store, type Vault } from "./vault.js";

/**
 * التخزين على Postgres.
 *
 * نفس العقد بالضبط، لأجل النشر: قرص الخادم يضيع، والقاعدة المُدارة تُنسخ
 * احتياطيًا وحدها. المخزَن سطر واحد في جدول واحد — والتزامن محكوم بـ
 * `where rev = $expected`، وهي ذرّية في Postgres بلا قفل صريح.
 */
export class PgStore implements Store {
  private readonly sql: Sql;

  constructor(url: string) {
    this.sql = postgres(url, { max: 4, onnotice: () => {} });
  }

  describe(): string { return "Postgres: ehna_vault"; }

  async read(): Promise<Vault> {
    const rows = await this.sql<{ rev: string; doc: Vault }[]>`
      select rev::text, doc from ehna_vault where id = 1`;
    const row = rows[0];
    if (!row) throw new Error("no_vault");
    return { ...row.doc, rev: Number(row.rev) };
  }

  async write(next: Vault, expectedRev: number): Promise<Vault> {
    const rev = expectedRev + 1;
    const { rev: _drop, ...doc } = next;
    const rows = await this.sql`
      update ehna_vault set doc = ${this.sql.json(doc as never)}, rev = ${rev}, updated_at = now()
      where id = 1 and rev = ${expectedRev}
      returning rev`;
    if (rows.length === 0) throw new ConflictError();
    return { ...next, rev };
  }

  async create(vault: Vault): Promise<Vault> {
    const { rev: _drop, ...doc } = vault;
    await this.sql`
      insert into ehna_vault (id, rev, doc) values (1, 1, ${this.sql.json(doc as never)})
      on conflict (id) do nothing`;
    return this.read();
  }

  async replace(vault: Vault): Promise<Vault> {
    const current = await this.read().catch(() => null);
    if (!current) return this.create(vault);
    return this.write(vault, current.rev);
  }

  async putPhoto(photo: Photo): Promise<string> {
    const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" } as Record<string, string>)[photo.mime];
    if (!ext) throw new Error("bad_mime");
    const id = `ph_${randomBytes(12).toString("hex")}.${ext}`;
    await this.sql`
      insert into ehna_photo (id, mime, bytes)
      values (${id}, ${photo.mime}, ${Buffer.from(photo.bytes)})`;
    return id;
  }

  async putPhotoAs(id: string, photo: Photo): Promise<boolean> {
    const rows = await this.sql`
      insert into ehna_photo (id, mime, bytes)
      values (${id}, ${photo.mime}, ${Buffer.from(photo.bytes)})
      on conflict (id) do nothing
      returning id`;
    return rows.length > 0;
  }

  async getPhoto(id: string): Promise<Photo | null> {
    const rows = await this.sql<{ mime: string; bytes: Buffer }[]>`
      select mime, bytes from ehna_photo where id = ${id}`;
    const row = rows[0];
    return row ? { mime: row.mime, bytes: new Uint8Array(row.bytes) } : null;
  }

  async removePhoto(id: string): Promise<void> {
    await this.sql`delete from ehna_photo where id = ${id}`;
  }

  async listPhotos(): Promise<string[]> {
    const rows = await this.sql<{ id: string }[]>`select id from ehna_photo`;
    return rows.map((r) => r.id);
  }

  async close(): Promise<void> { await this.sql.end(); }
}
