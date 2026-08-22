/** حساب أيام تقويمية، لا فروق توقيت. `2026-08-22` → `2026-08-27` = 5. */
export function daysBetween(fromISO: string, toISO: string): number {
  const a = Date.UTC(...parts(fromISO));
  const b = Date.UTC(...parts(toISO));
  return Math.round((b - a) / 86_400_000);
}

function parts(iso: string): [number, number, number] {
  const d = iso.slice(0, 10).split("-").map(Number);
  const [y, m, day] = d;
  if (y === undefined || m === undefined || day === undefined) {
    throw new Error(`bad date: ${iso}`);
  }
  return [y, m - 1, day];
}

export function daysSince(iso: string, today: string): number {
  return daysBetween(iso, today);
}

export function daysUntil(iso: string, today: string): number {
  return daysBetween(today, iso);
}
