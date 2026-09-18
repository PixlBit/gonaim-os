import type { PersonKey, Space } from "@gonaim/couple";

/**
 * كل ما يُخزَّن.
 *
 * ثلاثة أقسام بحدود واضحة:
 *  - `space`   — البيانات المشتركة. تُقرأ وتُكتب من الواجهة عبر أفعال.
 *  - `accounts`— بصمات كلمات السر. **لا تغادر الخادم أبدًا**، لا حتى مقنّعة.
 *  - `sessions`— من داخل ومن أي جهاز. تُعرَض مختصرة، وتُلغى بأمر واحد.
 *
 * والمخزَن كله يُقرأ ويُكتب دفعة واحدة. لاثنين ومساحة واحدة هذا ليس تبسيطًا
 * كسولًا: هو ما يجعل كل كتابة ذرّية بلا معاملات موزّعة، ويجعل النسخ
 * الاحتياطي ملفًا واحدًا يمكن فتحه بالعين بعد عشر سنين.
 */

export interface Account {
  key: PersonKey;
  /** معرّف الدخول — يُقارَن بعد `toLowerCase()`. */
  handle: string;
  /** scrypt بصيغة نصية. لا يُرسَل ولا يُسجَّل. */
  hash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
  /** محاولات فاشلة متتالية. تصفّر عند أول نجاح. */
  failed: number;
  /** قفل مؤقت بعد تكرار الفشل — الوقت هو العقوبة الوحيدة هنا. */
  lockedUntil?: string;
}

export interface Session {
  id: string;
  key: PersonKey;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  /** وصف مختصر للجهاز — ليُعرف الجهاز الغريب ويُلغى. */
  agent?: string;
}

export interface Vault {
  /** يزيد مع كل كتابة للمخزَن كله — أساس منع الكتابة فوق كتابة. */
  rev: number;
  space: Space;
  accounts: Account[];
  sessions: Session[];
  /**
   * حدّ نداءات النموذج اليومية. يعيش مع البيانات لا في الذاكرة، فإعادة
   * تشغيل الخادم لا تصفّر الحد — والفاتورة لا تتحمل عدّادًا ينساه المرء.
   */
  oracle?: { day: string; count: number };
}

export class ConflictError extends Error {
  constructor() {
    super("conflict");
    this.name = "ConflictError";
  }
}

export interface Photo {
  bytes: Uint8Array;
  mime: string;
}

export interface Store {
  read(): Promise<Vault>;
  /**
   * يكتب إن كان `rev` المخزون يساوي `expectedRev`، وإلا يرمي `ConflictError`.
   * التزامن هنا حقيقي: اثنان يفتحان نفس الشاشة على تليفونين.
   */
  write(next: Vault, expectedRev: number): Promise<Vault>;
  putPhoto(photo: Photo): Promise<string>;
  getPhoto(id: string): Promise<Photo | null>;
  removePhoto(id: string): Promise<void>;
  close(): Promise<void>;
  /** وصف مصدر التخزين للتشخيص: "ملف: .ehna/vault.json". */
  describe(): string;
}
