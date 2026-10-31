import Link from "next/link";
import { buildQuery } from "@/lib/filters";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  params: Record<string, string | undefined>;
};

export function Pagination({ page, pageSize, total, basePath, params }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const nums: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) nums.push(p);
  const href = (p: number) => `${basePath}${buildQuery({ ...params, page: p > 1 ? String(p) : undefined })}`;
  const linkCls = "rounded-md px-3 py-1.5 text-sm hover:bg-canvas";

  return (
    <div className="flex flex-col gap-3 border-t border-line px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-ink-soft">
        Showing {from.toLocaleString("en-IN")}–{to.toLocaleString("en-IN")} of {total.toLocaleString("en-IN")}
      </p>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        {page > 1 && (
          <Link href={href(page - 1)} className={linkCls}>
            Previous
          </Link>
        )}
        {nums.map((p) => (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={p === page ? "rounded-md bg-ink px-3 py-1.5 text-sm text-white" : linkCls}
          >
            {p}
          </Link>
        ))}
        {page < pages && (
          <Link href={href(page + 1)} className={linkCls}>
            Next
          </Link>
        )}
      </nav>
    </div>
  );
}
