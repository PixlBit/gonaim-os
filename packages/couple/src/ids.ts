/**
 * معرّفات.
 *
 * البادئة جزء من المعرّف عمدًا: `item_l8x2…` يُقرأ في سجل أو رسالة خطأ
 * ويُعرف نوعه بلا استعلام. والوقت في أوله يجعل الفرز الأبجدي فرزًا زمنيًا.
 */
export function newId(prefix: string, now: Date = new Date()): string {
  const t = now.getTime().toString(36);
  const r = randomChunk();
  return `${prefix}_${t}${r}`;
}

function randomChunk(): string {
  const c: Crypto | undefined = globalThis.crypto;
  if (c?.getRandomValues) {
    const buf = new Uint8Array(5);
    c.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 8);
  }
  // بيئة بلا crypto — لا تحدث في Node 22 ولا في المتصفح، والاحتياط أرخص من الانفجار
  return Math.random().toString(36).slice(2, 10);
}
