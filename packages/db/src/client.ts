import postgres, { type Sql } from "postgres";

export interface DbConfig {
  url: string;
  /** هوية المالك للجلسة — تحدد ما تراه سياسات RLS. */
  ownerId: string;
  max?: number;
}

/**
 * اتصال القاعدة.
 *
 * `auth.uid()` تأتي من Supabase. محليًا نضبط `request.jwt.claims` لكل معاملة
 * حتى تعمل نفس سياسات RLS في التطوير والإنتاج — سياسة تُختبر في بيئة بلا
 * RLS ليست مُختبرة.
 */
export function connect(cfg: DbConfig): Sql {
  return postgres(cfg.url, {
    max: cfg.max ?? 4,
    transform: { undefined: null },
    onnotice: () => {},
  });
}

/** ينفّذ داخل معاملة تحمل هوية المالك. */
export async function asOwner<T>(
  sql: Sql, ownerId: string, fn: (tx: Sql) => Promise<T>,
): Promise<T> {
  return sql.begin(async (tx) => {
    await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: ownerId })}, true)`;
    return fn(tx as unknown as Sql);
  }) as Promise<T>;
}
