import type { SubscriptionStatus } from "@prisma/client";

// Draft -> Quotation -> Confirmed -> Active -> Closed (any open state can be closed/cancelled)
const FLOW: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  DRAFT: ["QUOTATION", "CLOSED"],
  QUOTATION: ["CONFIRMED", "CLOSED"],
  CONFIRMED: ["ACTIVE", "CLOSED"],
  ACTIVE: ["CLOSED"],
  CLOSED: [],
};

export const canTransition = (from: SubscriptionStatus, to: SubscriptionStatus) => FLOW[from].includes(to);
export const nextStates = (from: SubscriptionStatus) => FLOW[from];
