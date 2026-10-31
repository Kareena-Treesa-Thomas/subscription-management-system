import { formatDate } from "./format";

export const toUtcDate = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);
export const isoOf = (d: Date): string => d.toISOString().slice(0, 10);

export function addDaysIso(iso: string, n: number): string {
  return isoOf(new Date(toUtcDate(iso).getTime() + n * 86_400_000));
}

/** "YYYY-MM" keys for the last `count` months, ending with the month of `today`. */
export function lastMonthKeys(today: string, count: number): string[] {
  const base = toUtcDate(today);
  base.setUTCDate(1);
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(base.getTime());
    d.setUTCMonth(d.getUTCMonth() - i);
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

export type DateRange = { preset: string; from?: string; to?: string; label: string };

export function resolveRange(o: { preset?: string; from?: string; to?: string; today: string }): DateRange {
  const { today } = o;
  if (o.from || o.to) {
    return {
      preset: "custom",
      from: o.from,
      to: o.to,
      label: `${o.from ? formatDate(o.from) : "the start"} to ${o.to ? formatDate(o.to) : "today"}`,
    };
  }
  switch (o.preset) {
    case "30d":
      return { preset: "30d", from: addDaysIso(today, -29), to: today, label: "Last 30 days" };
    case "ytd":
      return { preset: "ytd", from: `${today.slice(0, 4)}-01-01`, to: today, label: "This year" };
    case "all":
      return { preset: "all", label: "All time" };
    default:
      return { preset: "90d", from: addDaysIso(today, -89), to: today, label: "Last 90 days" };
  }
}
