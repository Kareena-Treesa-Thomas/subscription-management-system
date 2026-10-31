import { prisma } from "./prisma";

const KEY = "simulated_date";

export function startOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** "Today" for the whole app. Honors the admin's simulated date (demo button). */
export async function getToday(): Promise<Date> {
  const row = await prisma.appSetting.findUnique({ where: { key: KEY } });
  return row ? parseStoredDate(row.value) : startOfDayUTC(new Date());
}

export async function getSimulatedDate(): Promise<Date | null> {
  const row = await prisma.appSetting.findUnique({ where: { key: KEY } });
  return row ? parseStoredDate(row.value) : null;
}

export async function setSimulatedDate(d: Date) {
  const value = formatDate(startOfDayUTC(d));
  await prisma.appSetting.upsert({ where: { key: KEY }, update: { value }, create: { key: KEY, value } });
}

export async function clearSimulatedDate() {
  await prisma.appSetting.deleteMany({ where: { key: KEY } });
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function parseStoredDate(value: string) {
  return startOfDayUTC(new Date(`${value}T00:00:00Z`));
}
