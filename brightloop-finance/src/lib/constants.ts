export const PAGE_SIZE = 20;

export const PAYMENT_METHODS = ["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE"] as const;
export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];

export const METHOD_LABELS: Record<PaymentMethodValue, string> = {
  CASH: "Cash",
  CARD: "Card",
  UPI: "UPI",
  BANK_TRANSFER: "Bank transfer",
  CHEQUE: "Cheque",
};

export const INVOICE_STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "unpaid", label: "Unpaid (outstanding + overdue)" },
  { value: "outstanding", label: "Outstanding (not yet due)" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "draft", label: "Draft" },
  { value: "cancelled", label: "Cancelled" },
] as const;
export type InvoiceStatusFilter = (typeof INVOICE_STATUS_FILTERS)[number]["value"];

export const AGING_BUCKETS = [
  { key: "current", label: "Not yet due", color: "#9AA9BC" },
  { key: "d1_30", label: "1–30 days late", color: "#F2B84B" },
  { key: "d31_60", label: "31–60 days late", color: "#E8893A" },
  { key: "d61_90", label: "61–90 days late", color: "#D0553A" },
  { key: "d90_plus", label: "Over 90 days late", color: "#9F1F2B" },
] as const;
export type AgingKey = (typeof AGING_BUCKETS)[number]["key"];
