// Minimal dev seed so billing can be exercised. Shivani extends this with the 1,000+ rows.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@12345", 10);
  const tax = await prisma.tax.create({ data: { name: "GST 18%", ratePct: 18 } });
  const product = await prisma.product.create({
    data: { name: "Brightloop CRM", type: "Software", salesPrice: 1000, costPrice: 400, taxId: tax.id,
      variants: { create: [{ attribute: "brand", value: "Odoo", extraPrice: 560 }] } },
  });
  const plan = await prisma.plan.create({ data: { name: "CRM Monthly", price: 1000, billingPeriod: "MONTHLY", autoClose: true } });
  await prisma.user.createMany({ data: [
    { id: "demo-admin", email: "admin@brightloop.test", name: "Admin", passwordHash, role: "ADMIN" },
    { id: "demo-customer", email: "customer@brightloop.test", name: "Demo Customer", passwordHash, role: "CUSTOMER" },
  ]});
  await prisma.discount.create({ data: { name: "10% for 5+ seats", type: "PERCENTAGE", value: 10, minQuantity: 5,
    startDate: new Date("2026-01-01"), endDate: new Date("2027-12-31"), scope: "SUBSCRIPTION", usageLimit: 3 } });
  await prisma.quotationTemplate.create({ data: { name: "Standard CRM (5 seats)", planId: plan.id, validityDays: 30,
    lines: { create: [{ productId: product.id, quantity: 5 }] } } });
}
main().finally(() => prisma.$disconnect());
