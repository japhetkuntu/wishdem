const DAY_MS = 24 * 60 * 60 * 1000;

/** Days from now until the next occurrence of the given yyyy-mm-dd birthday. */
export function daysUntil(birthdayISO: string, from: Date = new Date()): number {
  const [, month, day] = birthdayISO.split("-").map(Number);
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
