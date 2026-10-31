<<<<<<< HEAD
export const metadata = { title: "Brightloop Subscriptions" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
=======
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brightloop — Subscription Management",
  description: "Plans, subscriptions, invoicing and payments in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
>>>>>>> 9d94d5b124606e296a74351ec4aebede17456d55
}
