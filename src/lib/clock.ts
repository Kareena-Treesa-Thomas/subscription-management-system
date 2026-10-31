import { prisma } from "./prisma";

const KEY = "simulatedDate";

export function startOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** "Today" for the whole app. Honors the admin's simulated date (demo button). */
export async function getToday(): Promise<Date> {
  const row = await prisma.appSetting.findUnique({ where: { key: KEY } });
  return startOfDayUTC(row ? new Date(row.value) : new Date());
}

export async function getSimulatedDate(): Promise<Date | null> {
  const row = await prisma.appSetting.findUnique({ where: { key: KEY } });
  return row ? startOfDayUTC(new Date(row.value)) : null;
}

export async function setSimulatedDate(d: Date) {
  const value = startOfDayUTC(d).toISOString();
  await prisma.appSetting.upsert({ where: { key: KEY }, update: { value }, create: { key: KEY, value } });
}

export async function clearSimulatedDate() {
  await prisma.appSetting.deleteMany({ where: { key: KEY } });
}
