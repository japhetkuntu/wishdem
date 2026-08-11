const DAY_MS = 24 * 60 * 60 * 1000;

/** Days from now until the next yearly occurrence of the given yyyy-mm-dd month/day —
 * used for anything that recurs annually (birthdays, anniversaries). */
export function daysUntil(dateISO: string, from: Date = new Date()): number {
  const [, month, day] = dateISO.split("-").map(Number);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let next = new Date(from.getFullYear(), month - 1, day);
  if (next.getTime() < today.getTime()) {
    next = new Date(from.getFullYear() + 1, month - 1, day);
  }
  return Math.round((next.getTime() - today.getTime()) / DAY_MS);
}

export function formatWishDate(iso: string): string {
  const [, month, day] = iso.split("-").map(Number);
  const date = new Date(2000, month - 1, day);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

export function formatWeekdayDate(iso: string): string {
  const [, month, day] = iso.split("-").map(Number);
  const date = new Date(new Date().getFullYear(), month - 1, day);
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

/** Whole-day difference between a full yyyy-mm-dd calendar date (already resolved to its
 * actual next occurrence, unlike a recurring birthday) and today — negative for the past. */
export function daysUntilDate(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

const RECURRING_OCCASIONS = new Set(["birthday", "anniversary"]);

/** Days until a recipient's occasion arrives — recurring occasions (birthday,
 * anniversary) roll forward to their next yearly occurrence; everything else targets
 * the exact date that was picked, whether it's ahead or already passed. */
export function daysUntilOccasion(occasion: string, occasionDateISO: string): number {
  return RECURRING_OCCASIONS.has(occasion) ? daysUntil(occasionDateISO) : daysUntilDate(occasionDateISO);
}

export interface MonthGridCell {
  iso: string;
  day: number;
  inCurrentMonth: boolean;
}

/** Mon-start 6x7 grid of every cell a real calendar month view needs, including the
 * leading/trailing days from the adjacent months that fill out the first/last week. */
export function getMonthGridCells(year: number, month: number): MonthGridCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekdayMonStart = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: MonthGridCell[] = [];

  for (let i = firstWeekdayMonStart - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    cells.push({ iso: toIsoDate(new Date(year, month - 1, day)), day, inCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ iso: toIsoDate(new Date(year, month, day)), day, inCurrentMonth: true });
  }

  let trailingDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ iso: toIsoDate(new Date(year, month + 1, trailingDay)), day: trailingDay, inCurrentMonth: false });
    trailingDay += 1;
  }

  return cells;
}
