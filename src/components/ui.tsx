import { cn } from "@/lib/utils";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight", light ? "text-white" : "text-ink", className)}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="11" fill="none" stroke={light ? "#9FD6C8" : "#0E7C66"} strokeWidth="4" strokeDasharray="58 12" strokeLinecap="round" />
        <circle cx="26.6" cy="10.5" r="3.4" fill="#F2A33A" />
      </svg>
      Brightloop
    </span>
  );
}

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-line bg-white shadow-card", className)} {...p} />;
}

const tones = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-saffron-50 text-saffron-700 ring-saffron-100",
  red: "bg-red-50 text-red-700 ring-red-200",
  gray: "bg-slate-100 text-slate-600 ring-slate-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
};
export type Tone = keyof typeof tones;

export function Badge({ tone = "gray", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone])}>{children}</span>;
}

export const statusTone: Record<string, Tone> = {
  ACTIVE: "green", PAID: "green", CONFIRMED: "blue", QUOTATION: "amber", DRAFT: "gray",
  PAUSED: "amber", CLOSED: "gray", CANCELLED: "red", OVERDUE: "red",
};

export function Field({ label, name, error, hint, className, ...p }: {
  label: string; name: string; error?: string; hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <input
        id={name} name={name} aria-invalid={!!error} aria-describedby={error ? `${name}-err` : undefined}
        className={cn(
          "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-mute transition-colors",
          error ? "border-red-400" : "border-line hover:border-brand-300 focus:border-brand-500"
        )}
        {...p}
      />
      {hint && !error && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
      {error && <p id={`${name}-err`} role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Alert({ tone = "red", children }: { tone?: "red" | "green"; children: React.ReactNode }) {
  return (
    <div role={tone === "red" ? "alert" : "status"} className={cn("rounded-lg border px-3.5 py-2.5 text-sm", tone === "red" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800")}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-prose text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{body}</p>
    </div>
  );
}
