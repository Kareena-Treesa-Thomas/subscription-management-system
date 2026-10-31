export type DisplayStatus = "paid" | "partial" | "outstanding" | "overdue" | "draft" | "cancelled";

/** What the team sees. `dueDate` and `today` are YYYY-MM-DD strings (string comparison is safe). */
export function displayStatus(status: string, dueDate: string, today: string, amountPaid: number): DisplayStatus {
  if (status === "PAID") return "paid";
  if (status === "DRAFT") return "draft";
  if (status === "CANCELLED") return "cancelled";
  if (dueDate < today) return "overdue";
  return amountPaid > 0 ? "partial" : "outstanding";
}
