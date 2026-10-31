"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { changeSubscription, type SubOp } from "@/actions/portal";
import { cn } from "@/lib/utils";

type Props = { id: string; status: string; pausable: boolean; closable: boolean; renewable: boolean };

export function SubscriptionActions({ id, status, pausable, closable, renewable }: Props) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<SubOp | null>(null);
  const [error, setError] = useState("");

  const run = (op: SubOp, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(""); setBusy(op);
    start(async () => { const r = await changeSubscription(id, op); if (r.error) setError(r.error); setBusy(null); });
  };

  const btn = (op: SubOp, label: string, tone: "primary" | "plain" | "danger", confirmMsg?: string) => (
    <button
      key={op} disabled={pending} onClick={() => run(op, confirmMsg)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
        tone === "primary" && "bg-brand-500 text-white hover:bg-brand-600",
        tone === "plain" && "border border-line bg-white text-ink hover:bg-slate-50",
        tone === "danger" && "border border-red-200 bg-white text-red-700 hover:bg-red-50"
      )}
    >
      {busy === op && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{label}
    </button>
  );

  const buttons = [];
  if (status === "ACTIVE" && pausable) buttons.push(btn("pause", "Pause", "plain"));
  if (status === "PAUSED") buttons.push(btn("resume", "Resume", "primary"));
  if ((status === "ACTIVE" || status === "CLOSED") && renewable) buttons.push(btn("renew", "Renew", status === "CLOSED" ? "primary" : "plain"));
  if (["ACTIVE", "PAUSED"].includes(status) && closable) buttons.push(btn("close", "Close", "danger", "Close this subscription? It will stop billing."));

  if (!buttons.length) return <p className="text-xs text-ink-mute">No self-service actions for this plan right now.</p>;
  return (
    <div>
      <div className="flex flex-wrap gap-2">{buttons}</div>
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
