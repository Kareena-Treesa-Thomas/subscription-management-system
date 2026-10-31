"use client";
// One reusable list + create/edit form for every catalog entity.
// Validates on the client with the SAME Zod schema the API uses, then shows server errors too.
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { ZodTypeAny } from "zod";

export type Option = { value: string; label: string };
export type Field = {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "checkbox" | "date" | "select";
  required?: boolean;
  options?: Option[];
  optionsUrl?: string; // e.g. "/api/catalog/products" -> options loaded from API
  allowEmpty?: boolean; // select: show a "None" option
  step?: string;
  help?: string;
  defaultValue?: string | boolean;
};
export type Column = { key: string; label: string; render?: (row: any) => ReactNode };

export const money = (v: unknown) => (v == null || v === "" ? "—" : `₹${Number(v).toLocaleString("en-IN")}`);
export const fmtDate = (v: unknown) => (v ? new Date(v as string).toLocaleDateString("en-IN") : "—");
export const badge = (on: boolean) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${on ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
    {on ? "Active" : "Inactive"}
  </span>
);

type Props = { entity: string; title: string; singular: string; schema: ZodTypeAny; fields: Field[]; columns: Column[] };
const PAGE_SIZE = 10;

const blank = (fields: Field[]) =>
  Object.fromEntries(fields.map((f) => [f.name, f.type === "checkbox" ? Boolean(f.defaultValue ?? false) : (f.defaultValue ?? "")]));

function toPayload(fields: Field[], values: Record<string, any>) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.type === "checkbox") out[f.name] = Boolean(v);
    else if (v === "" || v == null) out[f.name] = f.required ? undefined : null;
    else if (f.type === "number") out[f.name] = Number(v);
    else out[f.name] = typeof v === "string" ? v.trim() : v;
  }
  return out;
}

function toForm(fields: Field[], row: any) {
  const v: Record<string, any> = {};
  for (const f of fields) {
    const x = row[f.name];
    if (f.type === "checkbox") v[f.name] = Boolean(x);
    else if (x == null) v[f.name] = "";
    else if (f.type === "date") v[f.name] = String(x).slice(0, 10);
    else v[f.name] = String(x);
  }
  return v;
}

export default function CrudManager({ entity, title, singular, schema, fields, columns }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<null | { id: string | null }>(null);
  const [values, setValues] = useState<Record<string, any>>(blank(fields));
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [opts, setOpts] = useState<Record<string, Option[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/catalog/${entity}?page=${page}&pageSize=${PAGE_SIZE}&q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const d = await res.json();
      setRows(d.items);
      setTotal(d.total);
      setServerError("");
    } else setServerError((await res.json().catch(() => ({}))).error ?? "Could not load data");
    setLoading(false);
  }, [entity, page, q]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fields.filter((f) => f.optionsUrl).forEach(async (f) => {
      const res = await fetch(`${f.optionsUrl}?pageSize=100&active=true`);
      if (!res.ok) return;
      const d = await res.json();
      setOpts((o) => ({ ...o, [f.name]: d.items.map((i: any) => ({ value: i.id, label: i.name })) }));
    });
  }, [fields]);

  const openNew = () => { setValues(blank(fields)); setErrors({}); setServerError(""); setPanel({ id: null }); };
  const openEdit = (row: any) => { setValues(toForm(fields, row)); setErrors({}); setServerError(""); setPanel({ id: row.id }); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const payload = toPayload(fields, values);
    const parsed = schema.safeParse(payload);
    if (!parsed.success) { setErrors(parsed.error.flatten().fieldErrors as any); return; } // client validation
    setErrors({});
    setSaving(true);
    const editing = panel?.id;
    const res = await fetch(editing ? `/api/catalog/${entity}/${editing}` : `/api/catalog/${entity}`, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) { setPanel(null); load(); return; }
    const d = await res.json().catch(() => ({}));
    if (d.fieldErrors) setErrors(d.fieldErrors); // server validation
    setServerError(d.error ?? "Could not save");
  }

  async function deactivate(row: any) {
    if (!confirm(`Deactivate this ${singular}? Existing subscriptions and invoices keep working.`)) return;
    const res = await fetch(`/api/catalog/${entity}/${row.id}`, { method: "DELETE" });
    if (res.ok) load(); else setServerError("Could not deactivate");
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const input = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <div className="flex gap-2">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }} className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className={`${input} w-48`} />
            <button className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">Search</button>
          </form>
          <button onClick={openNew} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            + New {singular}
          </button>
        </div>
      </div>

      {serverError && !panel && <p className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((c) => <th key={c.key} className="px-4 py-3">{c.label}</th>)}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-400">No {title.toLowerCase()} yet.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {columns.map((c) => <td key={c.key} className="px-4 py-3">{c.render ? c.render(row) : String(row[c.key] ?? "—")}</td>)}
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button onClick={() => openEdit(row)} className="mr-3 text-indigo-600 hover:underline">Edit</button>
                  {row.active !== false && <button onClick={() => deactivate(row)} className="text-red-600 hover:underline">Deactivate</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
        <span>{total} total</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Prev</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      </div>

      {panel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submit} noValidate className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">{panel.id ? "Edit" : "New"} {singular}</h3>
            <div className="space-y-4">
              {fields.map((f) => {
                const err = errors[f.name]?.[0];
                const options = f.options ?? opts[f.name] ?? [];
                return (
                  <div key={f.name}>
                    {f.type === "checkbox" ? (
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={Boolean(values[f.name])} onChange={(e) => setValues({ ...values, [f.name]: e.target.checked })} />
                        {f.label}
                      </label>
                    ) : (
                      <>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          {f.label}{f.required && <span className="text-red-500"> *</span>}
                        </label>
                        {f.type === "textarea" ? (
                          <textarea rows={3} className={input} value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
                        ) : f.type === "select" ? (
                          <select className={input} value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}>
                            <option value="">{f.allowEmpty ? "None" : "Select…"}</option>
                            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <input
                            type={f.type} step={f.type === "number" ? (f.step ?? "0.01") : undefined} className={input}
                            value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                          />
                        )}
                      </>
                    )}
                    {f.help && !err && <p className="mt-1 text-xs text-gray-500">{f.help}</p>}
                    {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
                  </div>
                );
              })}
            </div>
            {serverError && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setPanel(null)} className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
