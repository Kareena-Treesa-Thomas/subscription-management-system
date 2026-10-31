// Sets or clears the simulated "today" used by every page.
//   npm run date:set -- 2026-12-01     set it
//   npm run date:set -- clear          back to the real date
//   npm run date:set                   show the current value
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    const row = await prisma.appSetting.findUnique({ where: { key: "simulated_date" } });
    console.log(row ? `Simulated date: ${row.value}` : "No simulated date set (using the real date).");
    return;
  }
  if (arg === "clear") {
    await prisma.appSetting.deleteMany({ where: { key: "simulated_date" } });
    console.log("Cleared. The app uses the real date again.");
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(arg) || Number.isNaN(Date.parse(`${arg}T00:00:00Z`))) {
    console.error("Use a date like 2026-12-01, or the word clear.");
    process.exit(1);
  }
  await prisma.appSetting.upsert({
    where: { key: "simulated_date" },
    update: { value: arg },
    create: { key: "simulated_date", value: arg },
  });
  console.log(`Simulated date set to ${arg}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
