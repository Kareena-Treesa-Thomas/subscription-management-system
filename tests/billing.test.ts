// Needs the local DB: docker compose up -d && npx prisma migrate dev. Run: npm test
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { runBilling } from "@/lib/billing/engine";
import { setSimulatedDate, clearSimulatedDate } from "@/lib/clock";
import { createFromTemplate, transitionSubscription } from "@/lib/subscription/service";

let subId: string;
beforeAll(async () => {
  const tpl = await prisma.quotationTemplate.findFirstOrThrow();
  const sub = await createFromTemplate({ templateId: tpl.id, customerId: "demo-customer", startDate: new Date("2026-11-01") });
  subId = sub.id;
  await transitionSubscription(subId, "QUOTATION");
  await transitionSubscription(subId, "CONFIRMED");
  await setSimulatedDate(new Date("2026-11-01"));
});

describe("billing engine", () => {
  it("creates one invoice, with tax and discount", async () => {
    const r = await runBilling();
    expect(r.created.length).toBeGreaterThanOrEqual(1);
    const inv = await prisma.invoice.findFirstOrThrow({ where: { subscriptionId: subId }, include: { lines: true } });
    expect(inv.discountTotal.toString()).toBe("500"); // 10% of 5 x 1000
    expect(inv.taxTotal.toString()).toBe("810");      // 18% of 4500
    expect(inv.total.toString()).toBe("5310");
  });

  it("running billing twice creates no duplicates", async () => {
    await runBilling();
    await runBilling();
    expect(await prisma.invoice.count({ where: { subscriptionId: subId } })).toBe(1);
  });

  it("simulating next month bills the next period only", async () => {
    await setSimulatedDate(new Date("2026-12-01"));
    await runBilling();
    expect(await prisma.invoice.count({ where: { subscriptionId: subId } })).toBe(2);
    await clearSimulatedDate();
  });
});
