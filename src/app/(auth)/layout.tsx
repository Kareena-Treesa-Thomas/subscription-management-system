import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-gradient relative min-h-screen overflow-hidden">
      <div className="grid-fade pointer-events-none absolute inset-0" />
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-12">
        <Logo />
        <span className="hidden text-sm font-semibold text-brand-800 sm:block">Powering Your Recurring Business ✦</span>
      </header>
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 pb-12 pt-6 lg:grid-cols-[1.05fr_.95fr] lg:px-16">
        <aside className="hidden lg:block">
          <p className="max-w-xl text-5xl font-extrabold leading-[1.08] tracking-tight text-[#11183D]">
            Smarter Subscriptions.<br /><span className="text-brand-500">Stronger Business.</span>
          </p>
          <p className="mt-5 max-w-lg text-lg leading-7 text-brand-800">Manage subscriptions, automate billing and grow your business with Brightloop.</p>
          <div className="mt-8 space-y-4 text-brand-800">
            {["Automated Billing & Invoicing", "Flexible Plans & Discounts", "Secure & Reliable"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 font-semibold"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-brand-600">{["▥", "ϟ", "✓"][index]}</span>{item}</div>
            ))}
          </div>
          <div className="relative mt-12 h-36 max-w-xl rounded-3xl border border-white/80 bg-white/70 p-6 shadow-card backdrop-blur">
            <p className="text-sm font-bold text-brand-900">Dashboard</p>
            <div className="mt-5 flex items-end gap-3">
              {[28, 42, 34, 62, 54, 80, 72, 96].map((height, i) => <span key={i} className="flex-1 rounded-t-md bg-brand-300/70" style={{ height }} />)}
            </div>
          </div>
        </aside>
        <main className="flex justify-center">
          <div className="w-full max-w-[530px] rounded-3xl border border-white bg-white/90 p-7 shadow-card backdrop-blur sm:p-10">
            <div className="mb-7 text-center lg:hidden"><Logo /></div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
