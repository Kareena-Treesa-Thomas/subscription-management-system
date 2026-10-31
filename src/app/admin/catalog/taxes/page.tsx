"use client";
import CrudManager, { badge } from "@/components/catalog/CrudManager";
import { taxSchema } from "@/lib/validation/catalog";

export default function TaxesPage() {
  return (
    <CrudManager
      entity="taxes" title="Taxes" singular="tax" schema={taxSchema}
      fields={[
        { name: "name", label: "Name", type: "text", required: true, help: "e.g. GST 18%" },
        { name: "ratePercent", label: "Rate (%)", type: "number", required: true },
        { name: "active", label: "Active", type: "checkbox", defaultValue: true },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "ratePercent", label: "Rate", render: (r) => `${Number(r.ratePercent)}%` },
        { key: "active", label: "Status", render: (r) => badge(r.active) },
      ]}
    />
  );
}
