import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col">
        <Logo light />
        <div className="relative z-10 mt-auto max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">Every renewal, invoice and payment — on time.</h2>
          <p className="mt-4 text-brand-100/80">One place for plans, subscriptions and billing, so nothing gets missed and nothing gets billed twice.</p>
        </div>
        {/* The one memorable element: a billing cycle, closing the loop each period */}
        <svg viewBox="0 0 400 400" className="pointer-events-none absolute -right-24 -top-24 h-[520px] w-[520px] opacity-90" aria-hidden>
          <g className="orbit">
            <circle cx="200" cy="200" r="150" fill="none" stroke="#33A18B" strokeOpacity=".35" strokeWidth="2" />
            <circle cx="200" cy="200" r="110" fill="none" stroke="#9FD6C8" strokeOpacity=".45" strokeWidth="14" strokeDasharray="190 502" strokeLinecap="round" />
            <circle cx="350" cy="200" r="9" fill="#F2A33A" />
            <circle cx="125" cy="330" r="6" fill="#9FD6C8" />
            <circle cx="90" cy="120" r="5" fill="#68BBA8" />
          </g>
        </svg>
      </aside>
      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          {children}
        </div>
      </main>
    </div>
  );
}
