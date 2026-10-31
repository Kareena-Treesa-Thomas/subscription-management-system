import type { DisplayStatus } from "@/lib/status";

const STYLES: Record<DisplayStatus, { label: string; cls: string }> = {
  paid: { label: "Paid", cls: "bg-brand-tint text-brand-dark" },
  partial: { label: "Part paid", cls: "bg-[#FFF3D6] text-[#7A5200]" },
  outstanding: { label: "Outstanding", cls: "bg-[#E8EEF9] text-[#2A4B8D]" },
  overdue: { label: "Overdue", cls: "bg-danger-tint text-danger" },
  draft: { label: "Draft", cls: "bg-canvas text-ink-soft" },
  cancelled: { label: "Cancelled", cls: "bg-canvas text-ink-faint line-through" },
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const s = STYLES[status];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}
