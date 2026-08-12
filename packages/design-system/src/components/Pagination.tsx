import clsx from "clsx";

export interface PaginationProps {
  /** Zero-based. */
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (pageIndex: number) => void;
  className?: string;
}

/** How many numbered page buttons to show around the current page before
 * collapsing the rest into ellipses — keeps the control usable even when
 * there are dozens of pages. */
const SIBLING_COUNT = 1;

export function Pagination({ pageIndex, totalPages, totalCount, pageSize, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(totalCount, (pageIndex + 1) * pageSize);
  const pages = buildPageList(pageIndex, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={clsx("flex flex-wrap items-center justify-between gap-3 pt-3", className)}
    >
      <span className="text-[10px] text-ink/50">
        Showing {from}–{to} of {totalCount}
      </span>
      <div className="flex items-center gap-[6px]">
        <button
          type="button"
          disabled={pageIndex === 0}
          onClick={() => onPageChange(pageIndex - 1)}
          className="rounded-pill border border-plum/[0.16] bg-white px-[10px] py-[7px] text-[10px] font-bold text-plum disabled:opacity-40"
        >
          Previous
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-[4px] text-[10px] text-ink/40">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === pageIndex ? "page" : undefined}
              className={clsx(
                "min-w-[28px] rounded-pill border px-[8px] py-[7px] text-[10px] font-bold",
                p === pageIndex
                  ? "border-champagne bg-champagne/50 text-plum"
                  : "border-plum/[0.16] bg-white text-plum/70",
              )}
            >
              {p + 1}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={pageIndex >= totalPages - 1}
          onClick={() => onPageChange(pageIndex + 1)}
          className="rounded-pill border border-plum/[0.16] bg-white px-[10px] py-[7px] text-[10px] font-bold text-plum disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  );
}

function buildPageList(current: number, totalPages: number): (number | "…")[] {
  const last = totalPages - 1;
  const start = Math.max(0, current - SIBLING_COUNT);
  const end = Math.min(last, current + SIBLING_COUNT);

  const pages: (number | "…")[] = [];
  pages.push(0);
  if (start > 1) pages.push("…");
  for (let p = Math.max(start, 1); p <= Math.min(end, last - 1); p++) pages.push(p);
  if (end < last - 1) pages.push("…");
  if (last > 0) pages.push(last);
  return pages;
}
