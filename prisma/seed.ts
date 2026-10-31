// Minimal, repeatable dev seed so authentication and billing can be exercised.
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const demoPassword = "Admin@12345";

async function main() {
  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const tax = await prisma.tax.upsert({
    where: { id: "demo-tax" },
    update: { name: "GST 18%", ratePct: 18 },
    create: { id: "demo-tax", name: "GST 18%", ratePct: 18 },
  });
  const product = await prisma.product.upsert({
    where: { id: "demo-product" },
    update: { name: "Brightloop CRM", type: "Software", salesPrice: 1000, costPrice: 400, taxId: tax.id },
    create: { id: "demo-product", name: "Brightloop CRM", type: "Software", salesPrice: 1000, costPrice: 400, taxId: tax.id },
  });
  await prisma.productVariant.upsert({
    where: { id: "demo-product-variant" },
    update: { productId: product.id, attribute: "brand", value: "Odoo", extraPrice: 560 },
    create: { id: "demo-product-variant", productId: product.id, attribute: "brand", value: "Odoo", extraPrice: 560 },
  });
  const plan = await prisma.plan.upsert({
    where: { id: "demo-plan" },
    update: { name: "CRM Monthly", price: 1000, billingPeriod: "MONTHLY", autoClose: true, pausable: true },
    create: { id: "demo-plan", name: "CRM Monthly", price: 1000, billingPeriod: "MONTHLY", autoClose: true, pausable: true },
  });

  const users = [
    { id: "demo-admin", email: "admin@brightloop.test", name: "Admin", role: "ADMIN" as const },
    { id: "demo-staff", email: "staff@brightloop.test", name: "Staff", role: "STAFF" as const },
    { id: "demo-customer", email: "customer@brightloop.test", name: "Demo Customer", role: "CUSTOMER" as const },
    { id: "demo-other", email: "other@brightloop.test", name: "Other Customer", role: "CUSTOMER" as const },
  ];
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, passwordHash, role: user.role },
      create: { ...user, passwordHash },
    });
  }

  await prisma.discount.upsert({
    where: { id: "demo-discount" },
    update: { name: "10% for 5+ seats", type: "PERCENTAGE", value: 10, minQuantity: 5, startDate: new Date("2026-01-01"), endDate: new Date("2027-12-31"), scope: "SUBSCRIPTION", usageLimit: 3 },
    create: { id: "demo-discount", name: "10% for 5+ seats", type: "PERCENTAGE", value: 10, minQuantity: 5, startDate: new Date("2026-01-01"), endDate: new Date("2027-12-31"), scope: "SUBSCRIPTION", usageLimit: 3 },
  });
  await prisma.quotationTemplate.upsert({
    where: { id: "demo-template" },
    update: { name: "Standard CRM (5 seats)", planId: plan.id, validityDays: 30 },
    create: {
      id: "demo-template",
      name: "Standard CRM (5 seats)",
      planId: plan.id,
      validityDays: 30,
      lines: { create: [{ productId: product.id, quantity: 5 }] },
    },
  });
  await prisma.subscription.upsert({
    where: { number: "DEMO-0001" },
    update: { customerId: "demo-customer", planId: plan.id, status: "ACTIVE", paused: false },
    create: {
      number: "DEMO-0001",
      customerId: "demo-customer",
      planId: plan.id,
      status: "ACTIVE",
      startDate: new Date("2026-10-31"),
      nextInvoiceDate: new Date("2026-10-31"),
      lines: {
        create: [{
          productId: product.id,
          description: product.name,
          quantity: 1,
          unitPrice: 1000,
          amount: 1000,
          taxId: tax.id,
        }],
      },
    },
  });
}

main().finally(() => prisma.$disconnect());
