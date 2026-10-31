import { prisma } from "./db";
import { isValidIsoDate } from "./validation";

export function realToday(): string {
  const tz = process.env.APP_TZ || "Asia/Kolkata";
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** "Today" for the whole app: the simulated date if the demo button set one, else the real date. */
export async function getTodayInfo(): Promise<{ date: string; simulated: boolean }> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: "simulated_date" } });
    if (row && isValidIsoDate(row.value)) return { date: row.value, simulated: true };
  } catch {
    // table missing or DB down: fall back to the real date
  }
  return { date: realToday(), simulated: false };
}

export async function getToday(): Promise<string> {
  return (await getTodayInfo()).date;
}
