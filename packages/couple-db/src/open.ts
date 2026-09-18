import { FileStore } from "./file-store.js";
import { PgStore } from "./pg-store.js";
import type { Store, Vault } from "./vault.js";

/**
 * اختيار التخزين.
 *
 * `EHNA_DATABASE_URL` موجود ⇦ Postgres. غير موجود ⇦ ملف في `EHNA_DIR`
 * (افتراضيًا `.ehna`). لا إعداد ثالث ولا وضع "تجريبي": الفرق بين التطوير
 * والنشر هو متغير بيئة واحد، والعقد واحد في الحالتين.
 */
export interface OpenedStore extends Store {
  create(vault: Vault): Promise<Vault>;
  replace(vault: Vault): Promise<Vault>;
  listPhotos(): Promise<string[]>;
}

export function openStore(env: NodeJS.ProcessEnv = process.env): OpenedStore {
  const url = env["EHNA_DATABASE_URL"];
  if (url) return new PgStore(url);
  return new FileStore(env["EHNA_DIR"] ?? ".ehna");
}
