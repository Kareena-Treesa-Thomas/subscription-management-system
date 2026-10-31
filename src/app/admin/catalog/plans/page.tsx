"use client";
import CrudManager, { money, fmtDate, badge } from "@/components/catalog/CrudManager";
import { planSchema } from "@/lib/validation/catalog";

const yes = (v: boolean) => (v ? "Yes" : "No");

export default function PlansPage() {
  return (
    <CrudManager
      entity="plans" title="Plans" singular="plan" schema={planSchema}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "price", label: "Price (₹)", type: "number", required: true },
        { name: "billingPeriod", label: "Billing period", type: "select", required: true, defaultValue: "MONTHLY",
          options: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map((v) => ({ value: v, label: v[0] + v.slice(1).toLowerCase() })) },
        { name: "minQuantity", label: "Minimum quantity", type: "number", step: "1", required: true, defaultValue: "1" },
        { name: "availableFrom", label: "Available from", type: "date" },
        { name: "availableTo", label: "Available until", type: "date" },
        { name: "autoClose", label: "Close automatically when the plan ends", type: "checkbox" },
        { name: "closable", label: "Customer can close early", type: "checkbox", defaultValue: true },
        { name: "pausable", label: "Customer can pause", type: "checkbox" },
        { name: "renewable", label: "Customer can renew", type: "checkbox", defaultValue: true },
        { name: "active", label: "Active", type: "checkbox", defaultValue: true },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "price", label: "Price", render: (r) => money(r.price) },
        { key: "billingPeriod", label: "Billing" },
        { key: "minQuantity", label: "Min qty" },
        { key: "availability", label: "Available", render: (r) => `${fmtDate(r.availableFrom)} → ${fmtDate(r.availableTo)}` },
        { key: "flags", label: "Auto-close / Early / Pause / Renew", render: (r) => [r.autoClose, r.closable, r.pausable, r.renewable].map(yes).join(" / ") },
        { key: "active", label: "Status", render: (r) => badge(r.active) },
      ]}
    />
  );
}
