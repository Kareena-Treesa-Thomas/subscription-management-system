"use client";
import CrudManager, { badge } from "@/components/catalog/CrudManager";
import { taxSchema } from "@/lib/validation/catalog";

export default function TaxesPage() {
  return (
    <CrudManager
      entity="taxes" title="Taxes" singular="tax" schema={taxSchema}
      fields={[
        { name: "name", label: "Name", type: "text", required: true, help: "e.g. GST 18%" },
        { name: "ratePct", label: "Rate (%)", type: "number", required: true },
        { name: "active", label: "Active", type: "checkbox", defaultValue: true },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "ratePct", label: "Rate", render: (r) => `${Number(r.ratePct)}%` },
        { key: "active", label: "Status", render: (r) => badge(r.active) },
      ]}
    />
  );
}
