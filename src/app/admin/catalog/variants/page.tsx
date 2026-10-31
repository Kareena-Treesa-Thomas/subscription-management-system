"use client";
import CrudManager, { money } from "@/components/catalog/CrudManager";
import { variantSchema } from "@/lib/validation/catalog";

export default function VariantsPage() {
  return (
    <CrudManager
      entity="variants" title="Variants" singular="variant" schema={variantSchema}
      fields={[
        { name: "productId", label: "Product", type: "select", required: true, optionsUrl: "/api/catalog/products" },
        { name: "attribute", label: "Attribute", type: "text", required: true, help: "e.g. Brand" },
        { name: "value", label: "Value", type: "text", required: true, help: "e.g. Odoo" },
        { name: "extraPrice", label: "Extra price (₹)", type: "number", required: true, defaultValue: "0", help: "Added to the product price, e.g. 560" },
      ]}
      columns={[
        { key: "product", label: "Product", render: (r) => r.product?.name ?? "—" },
        { key: "attribute", label: "Attribute" },
        { key: "value", label: "Value" },
        { key: "extraPrice", label: "Extra price", render: (r) => `+ ${money(r.extraPrice)}` },
      ]}
    />
  );
}
