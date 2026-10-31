"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AsyncPicker, type PickerItem } from "./AsyncPicker";
import { METHOD_LABELS, PAYMENT_METHODS } from "@/lib/constants";
import { money } from "@/lib/format";
import { paymentInputSchema } from "@/lib/validation";

type Props = { today: string; invoice?: { id: string; number: string; balance: number } };
type FieldKey = "invoiceId" | "method" | "amount" | "paidOn" | "note" | "form";
type Errors = Partial<Record<FieldKey, string>>;

export function RecordPaymentForm({ today, invoice }: Props) {
  const router = useRouter();
  const [picked, setPicked] = useState<PickerItem | null>(
    invoice ? { id: invoice.id, label: invoice.number, balance: invoice.balance } : null,
  );
  const [resetKey, setResetKey] = useState(0);
  const [method, setMethod] = useState("");
  const [amount, setAmount] = useState(invoice ? invoice.balance.toFixed(2) : "");
  const [paidOn, setPaidOn] = useState(today);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const balance = picked?.balance;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDone(null);

    const parsed = paymentInputSchema.safeParse({
      invoiceId: picked?.id,
      method: method || undefined,
      amount,
      paidOn,
      note,
    });

    const next: Errors = {};
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      for (const k of ["invoiceId", "method", "amount", "paidOn", "note"] as const) {
        const m = fe[k]?.[0];
        if (m) next[k] = m;
      }
    } else {
      if (parsed.data.paidOn > today) next.paidOn = "Payment date can't be in the future";
      if (balance !== undefined && parsed.data.amount > balance + 0.0001) {
        next.amount = `That's more than the balance of ${money(balance)}`;
      }
    }
    setErrors(next);
    if (!parsed.success || Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        fieldErrors?: Record<string, string[] | undefined>;
        invoice?: { balance: number };
      };

      if (!res.ok) {
        const server: Errors = {};
        for (const [k, v] of Object.entries(json.fieldErrors ?? {})) {
          if (v?.[0]) (server as Record<string, string>)[k] = v[0];
        }
        if (Object.keys(server).length === 0) server.form = json.error ?? "We couldn't record the payment. Try again.";
        setErrors(server);
        return;
      }

      setDone(`Recorded ${money(parsed.data.amount)} against ${picked?.label ?? "the invoice"}.`);
      setNote("");
      setMethod("");
      if (invoice) {
        const left = json.invoice?.balance ?? 0;
        setPicked((p) => (p ? { ...p, balance: left } : p));
        setAmount(left > 0 ? left.toFixed(2) : "");
      } else {
        setPicked(null);
        setAmount("");
        setResetKey((k) => k + 1);
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const err = (k: FieldKey) =>
    errors[k] ? (
      <p className="mt-1 text-xs text-danger" role="alert">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium">Invoice</label>
        {invoice ? (
          <p className="rounded-md border border-line bg-canvas px-3 py-2 text-sm">
            <span className="font-medium">{invoice.number}</span>
            <span className="text-ink-soft"> · balance {money(balance ?? invoice.balance)}</span>
          </p>
        ) : (
          <AsyncPicker
            key={resetKey}
            endpoint="/api/invoices"
            extraParams={{ lookup: "1" }}
            placeholder="Search by invoice number or customer"
            invalid={Boolean(errors.invoiceId)}
            onChange={(item) => {
              setPicked(item);
              if (item?.balance !== undefined) setAmount(item.balance.toFixed(2));
            }}
          />
        )}
        {err("invoiceId")}
      </div>

      <div>
        <label htmlFor="pay-method" className="mb-1 block text-sm font-medium">
          Method
        </label>
        <select
          id="pay-method"
          className={`field ${errors.method ? "field-error" : ""}`}
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="">Choose a method</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {METHOD_LABELS[m]}
            </option>
          ))}
        </select>
        {err("method")}
      </div>

      <div>
        <label htmlFor="pay-amount" className="mb-1 block text-sm font-medium">
          Amount (₹)
        </label>
        <input
          id="pay-amount"
          inputMode="decimal"
          className={`field ${errors.amount ? "field-error" : ""}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
        {balance !== undefined && balance > 0 && (
          <button type="button" className="mt-1 text-xs font-medium text-brand-dark hover:underline" onClick={() => setAmount(balance.toFixed(2))}>
            Pay the full balance ({money(balance)})
          </button>
        )}
        {err("amount")}
      </div>

      <div>
        <label htmlFor="pay-date" className="mb-1 block text-sm font-medium">
          Payment date
        </label>
        <input
          id="pay-date"
          type="date"
          max={today}
          className={`field ${errors.paidOn ? "field-error" : ""}`}
          value={paidOn}
          onChange={(e) => setPaidOn(e.target.value)}
        />
        {err("paidOn")}
      </div>

      <div>
        <label htmlFor="pay-note" className="mb-1 block text-sm font-medium">
          Note <span className="font-normal text-ink-faint">(optional)</span>
        </label>
        <input
          id="pay-note"
          className={`field ${errors.note ? "field-error" : ""}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reference number, cheque no., remarks"
        />
        {err("note")}
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Recording…" : "Record payment"}
        </button>
        {done && (
          <p className="text-sm font-medium text-brand-dark" role="status">
            {done}
          </p>
        )}
        {errors.form && (
          <p className="text-sm text-danger" role="alert">
            {errors.form}
          </p>
        )}
      </div>
    </form>
  );
}
