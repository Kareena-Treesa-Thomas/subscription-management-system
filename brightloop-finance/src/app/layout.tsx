import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import { getTodayInfo } from "@/lib/today";

export const metadata: Metadata = {
  title: "Brightloop Finance",
  description: "Payments, invoices and the finance dashboard for Brightloop Software",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const today = await getTodayInfo();
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen lg:flex">
          <Sidebar today={today.date} simulated={today.simulated} />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
