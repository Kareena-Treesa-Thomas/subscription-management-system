import Link from "next/link";

export default function NotFound() {
  return (
    <div className="panel mx-auto mt-16 max-w-lg p-8">
      <h1 className="text-lg font-semibold">We couldn&rsquo;t find that page</h1>
      <p className="mt-2 text-sm text-ink-soft">The invoice or page you opened doesn&rsquo;t exist.</p>
      <Link href="/invoices" className="btn-quiet mt-5">
        Back to invoices
      </Link>
    </div>
  );
}
