import { useState } from "react";
import clsx from "clsx";
import { Pagination } from "@wishdem/design-system";
import { AdminLayout } from "@/components/AdminLayout";
import { useAdminWishes } from "@/hooks/useAdminData";
import { DEFAULT_PAGE_SIZE } from "@/lib/api";
import type { WishListFilters } from "@/lib/api";
import type { AdminWish } from "@/types";

type FilterKey = "all" | "struggling" | "sealed" | "delivered" | "draft";

const FILTER_PARAMS: Record<FilterKey, WishListFilters> = {
  all: {},
  struggling: { struggling: true },
  sealed: { status: "sealed" },
  delivered: { status: "delivered" },
  draft: { status: "draft" },
};

const DELIVERY_BADGE: Record<AdminWish["deliveryStatus"], string> = {
  FAILED: "bg-rose/30 text-mulberry",
  SCHEDULED: "bg-champagne/45 text-plum",
  DELIVERED: "bg-moss/20 text-moss",
};

const PAYMENT_BADGE: Record<AdminWish["paymentStatus"], string> = {
  PAID: "bg-moss/20 text-moss",
  REVERSED: "bg-rose/30 text-mulberry",
};

export default function WishesPage() {
  const { wishes, loading, retry, cancel, pageIndex, setPageIndex, totalPages, totalCount, filters, setFilters } =
    useAdminWishes();
  const [filterKey, setFilterKey] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const selected = wishes.find((w) => w.id === selectedId) ?? wishes[0];

  function handleFilterClick(key: FilterKey) {
    setFilterKey(key);
    setFilters({ ...FILTER_PARAMS[key], search: filters.search });
  }

  function handleSearchChange(value: string) {
    setFilters({ ...FILTER_PARAMS[filterKey], search: value });
  }

  async function handleRetry() {
    if (!selected) return;
    setRetrying(true);
    try {
      await retry(selected.id);
    } finally {
      setRetrying(false);
    }
  }

  async function handleCancel() {
    if (!selected) return;
    if (!window.confirm(`Cancel ${selected.id}? This permanently removes the wish and cannot be undone.`)) return;
    setCancelling(true);
    try {
      await cancel(selected.id);
      setSelectedId(null);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <AdminLayout active="wishes">
      <div className="mb-1 text-[11px] text-porcelain/60">Operations / Wishes</div>
      <input
        value={filters.search ?? ""}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Search Wish ID, sender, recipient or phone"
        className="mb-5 min-w-[280px] rounded-pill border border-plum/[0.16] px-[14px] py-[10px] text-[11px] outline-none sm:w-[430px]"
      />

      <section className="mb-[15px] flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[34px]">Wishes oversight</h1>
          <p className="mt-1 text-[11px] text-porcelain/60">
            {totalCount} total wishes · all dates shown in recipient timezone
          </p>
        </div>
        <button type="button" className="rounded-pill bg-plum px-[13px] py-[11px] text-[11px] font-extrabold text-[#F6F0E8]">
          Export filtered list
        </button>
      </section>

      <div className="mb-3 flex flex-wrap gap-[8px]">
        {(
          [
            { key: "all", label: "All" },
            { key: "struggling", label: "Struggling delivery" },
            { key: "sealed", label: "Sealed" },
            { key: "delivered", label: "Delivered" },
            { key: "draft", label: "Draft" },
          ] as { key: FilterKey; label: string }[]
        ).map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => handleFilterClick(chip.key)}
            className={clsx(
              "whitespace-nowrap rounded-pill border border-plum/[0.15] px-[10px] py-[7px] text-[10px] font-bold",
              filterKey === chip.key ? "bg-champagne/50 border-champagne" : "bg-white text-ink/70",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <section className="grid gap-[16px] lg:grid-cols-[minmax(0,1fr)_352px]">
        <div className="overflow-hidden rounded-md border border-plum/[0.11] bg-white text-ink">
          <div className="hidden grid-cols-[1.15fr_1fr_.95fr_.8fr_.65fr_.7fr] gap-[10px] bg-paper px-[13px] py-[11px] text-[9px] font-extrabold tracking-[0.07em] text-ink/55 lg:grid">
            <span>WISH</span>
            <span>PEOPLE</span>
            <span>SCHEDULE</span>
            <span>DELIVERY</span>
            <span>PAYMENT</span>
            <span>TYPE</span>
          </div>
          {loading ? (
            <p className="py-10 text-center text-[12px] text-ink/50">Loading…</p>
          ) : wishes.length === 0 ? (
            <p className="py-10 text-center text-[12px] text-ink/50">No wishes match that filter.</p>
          ) : (
            wishes.map((wish) => (
              <button
                key={wish.id}
                type="button"
                onClick={() => setSelectedId(wish.id)}
                className={clsx(
                  "grid w-full grid-cols-2 gap-[10px] border-t border-plum/[0.08] px-[13px] py-[11px] text-left text-[11px] first:border-0 lg:grid-cols-[1.15fr_1fr_.95fr_.8fr_.65fr_.7fr]",
                  wish.id === selected?.id && "border-l-[3px] border-l-champagne bg-mulberry/[0.04]",
                )}
              >
                <div>
                  <b className="block">{wish.id}</b>
                  <span className="mt-[2px] block text-[9px] text-ink/50">{wish.createdLabel}</span>
                </div>
                <div>
                  <b className="block">{wish.senderName}</b>
                  <span className="mt-[2px] block text-[9px] text-ink/50">→ {wish.recipientName}</span>
                  {/* Visible at a glance, not just in the detail panel — this is the
                      number customers most often report typos in. */}
                  <span className="mt-[2px] block text-[9px] text-ink/50">
                    {wish.recipientPhoneNumber ?? "No phone on file"}
                  </span>
                </div>
                <div className="hidden lg:block">
                  {wish.scheduleLabel}
                  <span className="mt-[2px] block text-[9px] text-ink/50">{wish.timezoneLabel}</span>
                </div>
                <div className="hidden lg:block">
                  <span className={clsx("rounded-pill px-[6px] py-1 text-[8px] font-extrabold", DELIVERY_BADGE[wish.deliveryStatus])}>
                    {wish.deliveryStatus}
                  </span>
                  {wish.deliveryDetail && <span className="mt-[2px] block text-[9px] text-ink/50">{wish.deliveryDetail}</span>}
                </div>
                <div className="hidden lg:block">
                  <span className={clsx("rounded-pill px-[6px] py-1 text-[8px] font-extrabold", PAYMENT_BADGE[wish.paymentStatus])}>
                    {wish.paymentStatus}
                  </span>
                </div>
                <div className="hidden lg:block">{wish.type}</div>
              </button>
            ))
          )}
          <Pagination
            pageIndex={pageIndex}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={DEFAULT_PAGE_SIZE}
            onPageChange={setPageIndex}
            className="px-[13px] pb-[11px]"
          />
        </div>

        {selected && (
          <aside className="rounded-md border border-plum/[0.11] bg-white p-4 text-ink">
            <span className="text-[9px] font-extrabold tracking-[0.1em] text-mulberry">WISH INVESTIGATION</span>
            <div className="mt-[10px] flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-[23px]">{selected.id}</h2>
                <small className="text-[10px] text-ink/55">
                  {selected.senderName} → {selected.recipientName}
                </small>
              </div>
              <span className={clsx("rounded-pill px-[6px] py-1 text-[8px] font-extrabold", DELIVERY_BADGE[selected.deliveryStatus])}>
                {selected.investigation.statusBadge}
              </span>
            </div>

            <div className="mt-[13px] grid grid-cols-2 gap-[7px]">
              {selected.investigation.facts.map((fact) => (
                <div key={fact.label} className="rounded-sm bg-paper p-[9px] text-[10px]">
                  {fact.label}
                  <b className="mt-[3px] block text-[11px]">{fact.value}</b>
                </div>
              ))}
            </div>

            <div className="mt-[14px] border-t border-plum/[0.1]">
              {selected.investigation.timeline.map((line, i) => (
                <div key={i} className="border-b border-plum/[0.08] py-[9px] text-[10px] leading-[1.45]">
                  <time className="text-ink/55">{line.time}</time> · {line.note}
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-[7px]">
              <button
                type="button"
                disabled={retrying || selected.deliveryStatus !== "FAILED"}
                onClick={handleRetry}
                className="rounded-pill bg-plum px-[11px] py-[10px] text-[10px] font-extrabold text-[#F6F0E8] disabled:opacity-40"
              >
                {retrying ? "Retrying…" : "Retry delivery"}
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                className="rounded-pill bg-rose px-[11px] py-[10px] text-[10px] font-extrabold text-plum disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Cancel wish"}
              </button>
            </div>

            <div className="mt-3 rounded-r-sm border-l-[3px] border-rose bg-rose/10 p-[10px] text-[10px] leading-[1.45]">
              <b>Retry confirmation required.</b>
              <br />
              Retry sends the same {selected.type.toLowerCase()} to the verified destination and
              records your name, time, and reason in the audit log.
            </div>
          </aside>
        )}
      </section>
    </AdminLayout>
  );
}
