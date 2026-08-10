import { useMemo, useState } from "react";
import clsx from "clsx";
import { AdminLayout } from "@/components/AdminLayout";
import { useAttentionQueue } from "@/hooks/useAdminData";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { AttentionUrgency } from "@/types";

type ChipKey = "open" | "now" | "assignedToMe";

const URGENCY_BADGE: Record<AttentionUrgency, string> = {
  now: "bg-rose/30 text-mulberry",
  today: "bg-champagne/45 text-plum",
  soon: "bg-periwinkle/[0.17] text-mulberry",
};

const TODAY_LABEL = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date()).toUpperCase();

export default function AttentionPage() {
  const { user } = useAdminAuth();
  const { cases, loading, assignToMe } = useAttentionQueue();
  const [chip, setChip] = useState<ChipKey>("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (chip === "now") return cases.filter((c) => c.urgency === "now");
    if (chip === "assignedToMe") return cases.filter((c) => c.detail.owner !== "Unassigned");
    return cases;
  }, [cases, chip]);

  const selected = cases.find((c) => c.id === selectedId) ?? filtered[0] ?? cases[0];

  async function handleAssign() {
    if (!selected) return;
    await assignToMe(selected.id);
  }

  return (
    <AdminLayout active="attention">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          placeholder="Search case, person, wish or delivery ID"
          className="min-w-[260px] flex-1 rounded-pill border border-plum/[0.16] px-[13px] py-[10px] text-[11px] outline-none sm:flex-none sm:w-[380px]"
        />
        <span className="text-[10px] text-porcelain/60">
          {user ? `Signed in as ${user.name}` : ""} · GMT / Accra
        </span>
      </div>

      <section className="my-5">
        <span className="text-[10px] font-extrabold tracking-[0.11em] text-mulberry">
          CARE CONSOLE · {TODAY_LABEL}
        </span>
        <h1 className="mt-1 font-display text-[34px]">Attention</h1>
        <p className="text-[11px] text-porcelain/60">
          Future promises that need a person's judgment before the moment is affected.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-[9px] sm:grid-cols-3">
        {[
          { value: cases.filter((c) => c.urgency === "now").length, label: "NEEDS ATTENTION NOW", alert: true },
          { value: cases.filter((c) => c.urgency === "today").length, label: "DUE TODAY" },
          { value: cases.filter((c) => c.urgency === "soon").length, label: "COMING UP SOON" },
        ].map((pulse) => (
          <div key={pulse.label} className={clsx("rounded-md border bg-white p-[13px] text-ink", pulse.alert ? "border-rose" : "border-plum/[0.11]")}>
            <b className={clsx("block font-display text-[26px]", pulse.alert && "text-mulberry")}>{pulse.value}</b>
            <span className="text-[9px] font-extrabold tracking-[0.05em] text-ink/55">{pulse.label}</span>
          </div>
        ))}
      </section>

      <section className="mt-4 grid gap-[15px] lg:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-md border border-plum/[0.11] bg-white p-4 text-ink">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[21px]">Priority queue</h2>
          </div>
          <div className="my-3 flex flex-wrap gap-[6px]">
            {(
              [
                { key: "open", label: `Open · ${cases.length}` },
                { key: "now", label: "Now" },
                { key: "assignedToMe", label: "Assigned to me" },
              ] as { key: ChipKey; label: string }[]
            ).map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setChip(c.key)}
                className={clsx(
                  "rounded-pill px-[8px] py-[6px] text-[9px] font-extrabold",
                  chip === c.key ? "bg-champagne/50" : "bg-plum/[0.05] text-ink/70",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          {loading ? (
            <p className="py-10 text-center text-[12px] text-ink/50">Loading…</p>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="grid grid-cols-[82px_1fr] items-center gap-[10px] border-t border-plum/[0.08] py-3 sm:grid-cols-[82px_1fr_auto]">
                <span className={clsx("w-max whitespace-nowrap rounded-pill px-[6px] py-1 text-[8px] font-extrabold", URGENCY_BADGE[item.urgency])}>
                  {item.urgencyLabel}
                </span>
                <div>
                  <b className="text-[11px]">{item.title}</b>
                  <p className="mt-[3px] text-[10px] leading-[1.45] text-ink/55">{item.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className="col-span-2 mt-1 w-max rounded-pill bg-plum px-[11px] py-[9px] text-[10px] font-extrabold text-[#F6F0E8] sm:col-span-1 sm:mt-0"
                >
                  {item.actionLabel}
                </button>
              </div>
            ))
          )}
        </article>

        {selected && (
          <aside className="rounded-md bg-paper p-4 text-ink">
            <span className="text-[9px] font-extrabold tracking-[0.11em] text-mulberry">{selected.detail.label}</span>
            <h2 className="my-[5px] font-display text-[23px]">{selected.detail.title}</h2>
            <p className="text-[11px] leading-[1.55] text-ink/70">{selected.detail.description}</p>

            <div className="my-3 grid grid-cols-2 gap-[7px]">
              {selected.detail.facts.map((fact) => (
                <div key={fact.label} className="rounded-sm bg-white p-[9px] text-[9px] text-ink/55">
                  {fact.label}
                  <b className="mt-[3px] block text-[10px] text-ink">{fact.value}</b>
                </div>
              ))}
            </div>

            <div className="rounded-r-sm border-l-[3px] border-champagne bg-champagne/15 p-[10px] text-[10px] leading-[1.5]">
              <b>Impact of your action</b>
              <br />
              {selected.detail.impactNote}
            </div>

            <div className="mt-3 flex flex-wrap gap-[7px]">
              <button
                type="button"
                onClick={handleAssign}
                className="rounded-pill border border-plum/[0.16] bg-white px-[11px] py-[9px] text-[10px] font-extrabold text-plum"
              >
                {selected.detail.owner === "Unassigned" ? "Assign to me" : `Owner: ${selected.detail.owner}`}
              </button>
            </div>
          </aside>
        )}
      </section>
    </AdminLayout>
  );
}
