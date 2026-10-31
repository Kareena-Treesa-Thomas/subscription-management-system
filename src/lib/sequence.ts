import type { Tx } from "./prisma";

/** Gap-free-ish numbering (SUB-00001, INV-00001) using an atomic upsert on AppSetting. */
export async function nextNumber(tx: Tx, prefix: "SUB" | "INV") {
  const key = `seq:${prefix}`;
  const rows = await tx.$queryRaw<{ value: string }[]>`
    INSERT INTO "AppSetting" ("key","value") VALUES (${key}, '1')
    ON CONFLICT ("key") DO UPDATE SET "value" = ("AppSetting"."value"::int + 1)::text
    RETURNING "value"`;
  return `${prefix}-${String(rows[0].value).padStart(5, "0")}`;
}
