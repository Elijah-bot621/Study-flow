// Calendar-date helpers. A calendar date is a YYYY-MM-DD string for a day on the
// student's own (device-local) calendar. Never build one with toISOString(), which uses UTC.

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toLocalDateString(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayLocalDateString(): string {
  return toLocalDateString(new Date());
}

export function parseLocalDate(dateStr: string): Date {
  const match = DATE_ONLY.exec(dateStr);
  if (!match) {
    return new Date(NaN);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const result = new Date(year, month - 1, day);
  // Reject impossible dates such as 2026-02-31, which Date would silently roll over.
  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day) {
    return new Date(NaN);
  }
  return result;
}

export function addDaysToLocalDateString(dateStr: string, days: number): string {
  const base = parseLocalDate(dateStr);
  if (Number.isNaN(base.getTime())) {
    return dateStr;
  }
  base.setDate(base.getDate() + days);
  return toLocalDateString(base);
}
