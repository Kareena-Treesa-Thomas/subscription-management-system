// Call seedCatalog(prisma) from Shivani's prisma/seed.ts, or run alone: npx tsx prisma/seed-catalog.ts
import { PrismaClient } from "@prisma/client";

export async function seedCatalog(prisma: PrismaClient) {
  const find = async <T>(f: Promise<T | null>, c: () => Promise<T>) => (await f) ?? c();

  const gst18 = await find(prisma.tax.findFirst({ where: { name: "GST 18%" } }), () => prisma.tax.create({ data: { name: "GST 18%", ratePct: 18 } }));
  const gst5 = await find(prisma.tax.findFirst({ where: { name: "GST 5%" } }), () => prisma.tax.create({ data: { name: "GST 5%", ratePct: 5 } }));
  await find(prisma.tax.findFirst({ where: { name: "Exempt" } }), () => prisma.tax.create({ data: { name: "Exempt", ratePct: 0 } }));

  const crm = await find(prisma.product.findFirst({ where: { name: "Brightloop CRM" } }), () =>
    prisma.product.create({ data: { name: "Brightloop CRM", type: "SOFTWARE", salesPrice: 1000, costPrice: 400, notes: "Per-seat CRM", taxId: gst18.id } }));
  await find(prisma.product.findFirst({ where: { name: "Brightloop Support Add-on" } }), () =>
    prisma.product.create({ data: { name: "Brightloop Support Add-on", type: "ADDON", salesPrice: 250, costPrice: 80, taxId: gst5.id } }));

  for (const [value, extraPrice] of [["Odoo", 560], ["Custom", 0]] as const) {
    await find(
      prisma.productVariant.findFirst({ where: { productId: crm.id, attribute: "Brand", value } }),
      () => prisma.productVariant.create({ data: { productId: crm.id, attribute: "Brand", value, extraPrice } }),
    );
  }

  const plans = [
    { name: "Monthly", price: 1000, billingPeriod: "MONTHLY", pausable: true },
    { name: "Yearly", price: 10000, billingPeriod: "YEARLY", minQuantity: 5, autoClose: true },
    { name: "Weekly Trial", price: 300, billingPeriod: "WEEKLY", closableEarly: true },
  ] as const;
  for (const p of plans) await find(prisma.plan.findFirst({ where: { name: p.name } }), () => prisma.plan.create({ data: { ...p } }));

  await find(prisma.discount.findFirst({ where: { name: "Volume 10%" } }), () =>
    prisma.discount.create({ data: { name: "Volume 10%", type: "PERCENTAGE", value: 10, scope: "SUBSCRIPTION", minQuantity: 5, startDate: new Date("2026-01-01"), endDate: new Date("2027-12-31"), usageLimit: 100 } }));
  await find(prisma.discount.findFirst({ where: { name: "Welcome ₹500 off" } }), () =>
    prisma.discount.create({ data: { name: "Welcome ₹500 off", type: "FIXED", value: 500, scope: "SUBSCRIPTION", minPurchase: 5000, startDate: new Date("2026-01-01"), endDate: new Date("2027-12-31"), usageLimit: 1000 } }));
}

if (process.argv[1]?.endsWith("seed-catalog.ts")) {
  const prisma = new PrismaClient();
  seedCatalog(prisma).then(() => console.log("Catalog seeded")).finally(() => prisma.$disconnect());
}
