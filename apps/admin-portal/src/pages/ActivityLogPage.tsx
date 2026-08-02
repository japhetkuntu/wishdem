import { useMemo, useState } from "react";
import clsx from "clsx";
import { AdminLayout } from "@/components/AdminLayout";
import { useAuditLog } from "@/hooks/useAdminData";
import type { AuditTag } from "@/types";

type ChipKey = "all" | "myTeam" | "contentAccess" | "delivery";

const TAG_CLASSES: Record<Exclude<AuditTag, null>, string> = {
  CONTENT_ACCESS: "bg-periwinkle/[0.17] text-mulberry",
  SENSITIVE_ACCESS: "bg-champagne/50 text-plum",
  CRITICAL_ACCESS: "bg-rose/30 text-mulberry",
  SENSITIVE_EXPORT: "bg-champagne/50 text-plum",
  SECURITY: "bg-moss/20 text-moss",
};

export default function ActivityLogPage() {
  const { events, loading } = useAuditLog();
  const [chip, setChip] = useState<ChipKey>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exportRequested, setExportRequested] = useState(false);

  const filtered = useMemo(() => {
    let list = events;
    if (chip === "contentAccess") list = list.filter((e) => e.tag === "CONTENT_ACCESS" || e.tag === "SENSITIVE_ACCESS");
    if (chip === "delivery") list = list.filter((e) => e.message.toLowerCase().includes("deliver"));
    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter((e) => e.actor.toLowerCase().includes(query) || e.message.toLowerCase().includes(query));
    }
    return list;
  }, [events, chip, search]);

  const selected = events.find((e) => e.id === selectedId) ?? filtered[0] ?? events[0];

  return (
    <AdminLayout active="activity">
      <div className="border-b border-plum/[0.1] pb-4">
        <span className="text-[10px] font-extrabold tracking-[0.1em] text-mulberry">
          ACCOUNTABILITY · GMT / ACCRA
        </span>
        <h1 className="mt-1 font-display text-[34px]">Activity log</h1>
        <p className="text-[11px] text-ink/55">
          An attributable record of operational, account, moderation, and delivery-affecting
          actions.
        </p>
      </div>

      <div className="my-4 flex flex-wrap items-center gap-[8px]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Wish, user, case, delivery, payment or actor"
          className="min-w-[280px] flex-1 rounded-sm border border-plum/[0.16] px-[11px] py-[9px] text-[10px] outline-none"
        />
        {(
          [
            { key: "all", label: "All events" },
            { key: "myTeam", label: "My team" },
            { key: "contentAccess", label: "Content access" },
            { key: "delivery", label: "Delivery" },
          ] as { key: ChipKey; label: string }[]
        ).map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setChip(c.key)}
            className={clsx(
              "whitespace-nowrap rounded-sm border px-[11px] py-[9px] text-[10px] font-bold",
              chip === c.key ? "border-champagne bg-champagne/50" : "border-plum/[0.16] bg-white",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 rounded-md bg-porcelain p-3 text-[10px] text-ink/60">
        <span>
          <b className="text-plum">Retention:</b> Audit evidence is retained until{" "}
          <b className="text-plum">02 Aug 2033</b> under the Operations Accountability policy.
        </span>
        <span className="whitespace-nowrap text-[9px] font-extrabold text-mulberry">
          VIEW RETENTION POLICY →
        </span>
      </div>

      <section className="grid gap-[14px] lg:grid-cols-[1.16fr_.84fr]">
        <article className="rounded-md border border-plum/[0.11] bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-[21px]">Chronological record</h2>
            <span className="text-[10px] text-ink/50">{filtered.length} events matching this view · UTC</span>
          </div>
          {loading ? (
            <p className="py-10 text-center text-[12px] text-ink/50">Loading…</p>
          ) : (
            filtered.map((event) => (
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
                  {event.timeLabel.split(",")[1]?.trim() ?? event.timeLabel}
                  <br />
                  <small className="font-normal text-ink/50">{event.dayLabel}</small>
                </time>
                <div>
                  <b>{event.actor}</b> {event.message}
                  <small className="mt-[2px] block text-ink/50">{event.detailNote}</small>
                  {event.tag && (
                    <span className={clsx("mt-[5px] inline-block rounded-pill px-[6px] py-1 text-[8px] font-extrabold", TAG_CLASSES[event.tag])}>
                      {event.tag.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </article>

        {selected && (
          <aside className="rounded-md border border-plum/[0.11] bg-white p-4">
            <span className="text-[9px] font-extrabold tracking-[0.11em] text-mulberry">
              {selected.detail.label}
            </span>
            <h3 className="my-[6px] font-display text-[25px]">{selected.detail.title}</h3>
            <p className="text-[10px] leading-[1.55] text-ink/60">{selected.detail.description}</p>

            <div className="my-3 grid grid-cols-2 gap-[8px]">
              {selected.detail.facts.map((fact) => (
                <div key={fact.label} className="rounded-sm bg-porcelain p-[10px] text-[9px] text-ink/50">
                  {fact.label}
                  <b className="mt-[3px] block text-[11px] text-ink">{fact.value}</b>
                </div>
              ))}
            </div>

            <div className="rounded-r-sm border-l-[3px] border-champagne bg-champagne/10 p-[11px] text-[10px] leading-[1.5]">
              <b>Recorded reason</b>
              <br />
              {selected.detail.reasonNote}
            </div>

            <div className="mt-3 flex flex-wrap gap-[7px]">
              <button type="button" className="rounded-pill border border-plum/[0.16] bg-white px-[11px] py-[9px] text-[10px] font-bold text-plum">
                Open related record
              </button>
              <button
                type="button"
                onClick={() => setExportRequested(true)}
                disabled={exportRequested}
                className="rounded-pill border border-plum/[0.16] bg-white px-[11px] py-[9px] text-[10px] font-bold text-plum disabled:opacity-60"
              >
                {exportRequested ? "Export requested ✓" : "Request audit export"}
              </button>
            </div>

            <div className="mt-3 border-t border-plum/[0.08] pt-3 text-[9px] text-ink/50">
              Event ID {selected.id} · Generated by WishDem Audit Service · This record cannot be
              edited or removed.
            </div>
          </aside>
        )}
      </section>
    </AdminLayout>
  );
}
