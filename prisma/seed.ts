import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const d = (offsetDays: number) => new Date(Date.now() + offsetDays * 86400000);

async function main() {
  const hash = await bcrypt.hash("Admin@12345", 10);
  const mk = (name: string, email: string, role: "ADMIN" | "STAFF" | "CUSTOMER") =>
    prisma.user.upsert({ where: { email }, update: {}, create: { name, email, role, passwordHash: hash } });

  await mk("Brightloop Admin", "admin@brightloop.test", "ADMIN");
  await mk("Riya Staff", "staff@brightloop.test", "STAFF");
  const asha = await mk("Asha Nair", "customer@brightloop.test", "CUSTOMER");
  const other = await mk("Other Customer", "other@brightloop.test", "CUSTOMER");

  await prisma.invoice.deleteMany({ where: { number: { startsWith: "DEMO-" } } });
  await prisma.subscription.deleteMany({ where: { number: { startsWith: "DEMO-" } } });
  await prisma.plan.deleteMany({ where: { name: { startsWith: "Demo " } } });

  const crm = await prisma.plan.create({ data: { name: "Demo CRM Pro (monthly)", price: 1499, billingPeriod: "MONTHLY" } });
  const suite = await prisma.plan.create({
    data: { name: "Demo Analytics Suite (yearly)", price: 14999, billingPeriod: "YEARLY", pausable: false, closable: false },
  });
  const support = await prisma.plan.create({
    data: { name: "Demo Support Add-on (monthly)", price: 499, billingPeriod: "MONTHLY", renewable: false },
  });

  const s1 = await prisma.subscription.create({ data: { number: "DEMO-0001", customerId: asha.id, planId: crm.id, status: "ACTIVE", quantity: 5, startDate: d(-60), expiryDate: d(30) } });
  await prisma.subscription.create({ data: { number: "DEMO-0002", customerId: asha.id, planId: suite.id, status: "ACTIVE", quantity: 1, startDate: d(-120), expiryDate: d(245) } });
  await prisma.subscription.create({ data: { number: "DEMO-0003", customerId: asha.id, planId: support.id, status: "QUOTATION", quantity: 2, startDate: d(3) } });
  await prisma.subscription.create({ data: { number: "DEMO-0004", customerId: other.id, planId: crm.id, status: "ACTIVE", quantity: 2, startDate: d(-30), expiryDate: d(60) } });

  const inv = (n: string, status: "PAID" | "CONFIRMED", ps: number, due: number) =>
    prisma.invoice.create({
      data: {
        number: n, subscriptionId: s1.id, customerId: asha.id, status,
        periodStart: d(ps), periodEnd: d(ps + 30), dueDate: d(due),
        subtotal: 7495, tax: 1349.1, discount: 0, total: 8844.1,
      },
    });
  await inv("DEMO-INV-0001", "PAID", -60, -45);
  await inv("DEMO-INV-0002", "CONFIRMED", -30, -15); // overdue
  await inv("DEMO-INV-0003", "CONFIRMED", 0, 15);

  console.log("Seeded. Password for all demo users: Admin@12345");
}

main().finally(() => prisma.$disconnect());
