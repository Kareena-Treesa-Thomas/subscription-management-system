"use client";
import CrudManager, { money } from "@/components/catalog/CrudManager";
import { productSchema } from "@/lib/validation/catalog";

export default function ProductsPage() {
  return (
    <CrudManager
      entity="products" title="Products" singular="product" schema={productSchema}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "type", label: "Type", type: "select", required: true, defaultValue: "SOFTWARE",
          options: [["SOFTWARE", "Software"], ["ADDON", "Add-on"], ["SERVICE", "Service"], ["PHYSICAL", "Physical"]].map(([value, label]) => ({ value, label })) },
        { name: "salesPrice", label: "Sales price (₹)", type: "number", required: true },
        { name: "costPrice", label: "Cost price (₹)", type: "number", required: true, defaultValue: "0" },
        { name: "taxId", label: "Tax", type: "select", optionsUrl: "/api/catalog/taxes", allowEmpty: true },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "type", label: "Type" },
        { key: "salesPrice", label: "Sales price", render: (r) => money(r.salesPrice) },
        { key: "costPrice", label: "Cost price", render: (r) => money(r.costPrice) },
        { key: "tax", label: "Tax", render: (r) => (r.tax ? `${r.tax.name} (${Number(r.tax.ratePct)}%)` : "—") },
      ]}
    />
  );
}
