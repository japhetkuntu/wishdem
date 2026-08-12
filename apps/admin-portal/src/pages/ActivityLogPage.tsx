import { useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Pagination } from "@wishdem/design-system";
import { AdminLayout } from "@/components/AdminLayout";
import { useAuditLog } from "@/hooks/useAdminData";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { DEFAULT_PAGE_SIZE } from "@/lib/api";
import type { AuditLogFilters } from "@/lib/api";
import type { AuditTag } from "@/types";

type ChipKey = "all" | "myActions" | "contentAccess";

const TAG_CLASSES: Record<Exclude<AuditTag, null>, string> = {
  CONTENT_ACCESS: "bg-periwinkle/[0.17] text-mulberry",
  SENSITIVE_ACCESS: "bg-champagne/50 text-plum",
  CRITICAL_ACCESS: "bg-rose/30 text-mulberry",
  SENSITIVE_EXPORT: "bg-champagne/50 text-plum",
  SECURITY: "bg-moss/20 text-moss",
};

const RESOURCE_ROUTE: Record<string, string> = {
  Wish: "/wishes",
  Payment: "/payments",
  ModerationCase: "/payments",
  AdminUser: "/users",
};

export default function ActivityLogPage() {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const { events, loading, pageIndex, setPageIndex, totalPages, totalCount, filters, setFilters } = useAuditLog();
  const [chip, setChip] = useState<ChipKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = events.find((e) => e.id === selectedId) ?? events[0];

  function handleChipClick(key: ChipKey) {
    setChip(key);
    const chipFilters: AuditLogFilters =
      key === "myActions" && user
        ? { adminUserId: user.id }
        : key === "contentAccess"
          ? { tags: ["contentAccess", "sensitiveAccess"] }
          : {};
    setFilters({ ...chipFilters, search: filters.search });
  }

  function handleSearchChange(value: string) {
    setFilters({ ...filters, search: value });
  }

  return (
    <AdminLayout active="activity">
      <div className="border-b border-plum/[0.1] pb-4">
        <span className="text-[10px] font-extrabold tracking-[0.1em] text-mulberry">
          ACCOUNTABILITY · GMT / ACCRA
        </span>
        <h1 className="mt-1 font-display text-[34px]">Activity log</h1>
        <p className="text-[11px] text-porcelain/60">
          An attributable record of operational, account, moderation, and delivery-affecting
          actions.
        </p>
      </div>

      <div className="my-4 flex flex-wrap items-center gap-[8px]">
        <input
          value={filters.search ?? ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by action summary"
          className="min-w-[280px] flex-1 rounded-sm border border-plum/[0.16] px-[11px] py-[9px] text-[10px] outline-none"
        />
        {(
          [
            { key: "all", label: "All events" },
            { key: "myActions", label: "My actions" },
            { key: "contentAccess", label: "Content access" },
          ] as { key: ChipKey; label: string }[]
        ).map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => handleChipClick(c.key)}
            className={clsx(
              "whitespace-nowrap rounded-sm border px-[11px] py-[9px] text-[10px] font-bold",
              chip === c.key ? "border-champagne bg-champagne/50" : "border-plum/[0.16] bg-white text-ink",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <section className="grid gap-[14px] lg:grid-cols-[1.16fr_.84fr]">
        <article className="rounded-md border border-plum/[0.11] bg-white p-4 text-ink">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-[21px]">Chronological record</h2>
            <span className="text-[10px] text-ink/50">{totalCount} total events · UTC</span>
          </div>
          {loading ? (
            <p className="py-10 text-center text-[12px] text-ink/50">Loading…</p>
          ) : events.length === 0 ? (
            <p className="py-10 text-center text-[12px] text-ink/50">No activity recorded yet.</p>
          ) : (
            events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedId(event.id)}
                className={clsx(
                  "grid w-full grid-cols-[60px_1fr] gap-3 border-t border-plum/[0.08] py-3 text-left text-[11px] leading-[1.45] first:border-0",
                  event.id === selected?.id && "-mx-2 bg-champagne/10 px-2",
                )}
              >
                <time className="text-[9px] font-extrabold text-mulberry">
                  {event.timeLabel}
                  <br />
                  <small className="font-normal text-ink/50">{event.dayLabel}</small>
                </time>
                <div>
                  <b>{event.actor}</b> {event.message}
                  {event.tag && (
                    <span className={clsx("mt-[5px] inline-block rounded-pill px-[6px] py-1 text-[8px] font-extrabold", TAG_CLASSES[event.tag])}>
                      {event.tag.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
          <Pagination
            pageIndex={pageIndex}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={DEFAULT_PAGE_SIZE}
            onPageChange={setPageIndex}
          />
        </article>

        {selected && (
          <aside className="rounded-md border border-plum/[0.11] bg-white p-4 text-ink">
            <span className="text-[9px] font-extrabold tracking-[0.11em] text-mulberry">
              {eventLabel(selected.resourceType)}
            </span>
            <h3 className="my-[6px] font-display text-[25px]">{selected.actor}</h3>
            <p className="text-[10px] leading-[1.55] text-ink/60">{selected.message}</p>

            <div className="my-3 grid grid-cols-2 gap-[8px]">
              <div className="rounded-sm bg-paper p-[10px] text-[9px] text-ink/50">
                RESOURCE
                <b className="mt-[3px] block text-[11px] text-ink">{selected.resourceType}</b>
              </div>
              <div className="rounded-sm bg-paper p-[10px] text-[9px] text-ink/50">
                WHEN
                <b className="mt-[3px] block text-[11px] text-ink">
                  {selected.dayLabel} · {selected.timeLabel}
                </b>
              </div>
            </div>

            {selected.resourceId && RESOURCE_ROUTE[selected.resourceType] && (
              <div className="mt-3 flex flex-wrap gap-[7px]">
                <button
                  type="button"
                  onClick={() => navigate(RESOURCE_ROUTE[selected.resourceType])}
                  className="rounded-pill border border-plum/[0.16] bg-white px-[11px] py-[9px] text-[10px] font-bold text-plum"
                >
                  Open related record
                </button>
              </div>
            )}

            <div className="mt-3 border-t border-plum/[0.08] pt-3 text-[9px] text-ink/50">
              Event ID {selected.id}
            </div>
          </aside>
        )}
      </section>
    </AdminLayout>
  );
}

function eventLabel(resourceType: string): string {
  return `${resourceType.toUpperCase()} EVENT`;
}
