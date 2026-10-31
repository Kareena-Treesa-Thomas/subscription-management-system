import { INVOICE_STATUS_FILTERS, PAYMENT_METHODS, type InvoiceStatusFilter, type PaymentMethodValue } from "./constants";
import { isValidIsoDate } from "./validation";

export type SP = Record<string, string | string[] | undefined>;

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function one(v: string | string[] | undefined): string | undefined {
  const x = Array.isArray(v) ? v[0] : v;
  const t = x?.trim();
  return t ? t : undefined;
}

export const uuidOrUndefined = (v: string | undefined) => (v && uuidRe.test(v) ? v : undefined);
export const dateOrUndefined = (v: string | undefined) => (v && isValidIsoDate(v) ? v : undefined);

export function pageOf(v: string | string[] | undefined): number {
  const n = parseInt(one(v) ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100_000) : 1;
}

export type InvoiceFilters = {
  page: number;
  q?: string;
  status: InvoiceStatusFilter;
  customerId?: string;
  from?: string;
  to?: string;
};

export function parseInvoiceFilters(sp: SP): InvoiceFilters {
  const s = one(sp.status);
  const status = INVOICE_STATUS_FILTERS.some((o) => o.value === s) ? (s as InvoiceStatusFilter) : "all";
  return {
    page: pageOf(sp.page),
    q: one(sp.q)?.slice(0, 80),
    status,
    customerId: uuidOrUndefined(one(sp.customerId)),
    from: dateOrUndefined(one(sp.from)),
    to: dateOrUndefined(one(sp.to)),
  };
}

export type PaymentFilters = {
  page: number;
  q?: string;
  method?: PaymentMethodValue;
  customerId?: string;
  from?: string;
  to?: string;
};

export function parsePaymentFilters(sp: SP): PaymentFilters {
  const m = one(sp.method);
  return {
    page: pageOf(sp.page),
    q: one(sp.q)?.slice(0, 80),
    method: PAYMENT_METHODS.find((x) => x === m),
    customerId: uuidOrUndefined(one(sp.customerId)),
    from: dateOrUndefined(one(sp.from)),
    to: dateOrUndefined(one(sp.to)),
  };
}

export function buildQuery(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `?${s}` : "";
}
