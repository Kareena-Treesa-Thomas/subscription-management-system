import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));

export const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

export const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d)) : "—";

export function addPeriod(date: Date, period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY") {
  const d = new Date(date);
  if (period === "DAILY") d.setDate(d.getDate() + 1);
  if (period === "WEEKLY") d.setDate(d.getDate() + 7);
  if (period === "MONTHLY") d.setMonth(d.getMonth() + 1);
  if (period === "YEARLY") d.setFullYear(d.getFullYear() + 1);
  return d;
}

export const periodLabel = (p: string) => ({ DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year" }[p] ?? p);
