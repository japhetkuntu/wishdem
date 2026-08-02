import { useMemo, useState } from "react";
import clsx from "clsx";
import { AdminLayout } from "@/components/AdminLayout";
import { useAttentionQueue } from "@/hooks/useAdminData";
import type { AttentionUrgency } from "@/types";

type ChipKey = "open" | "now" | "delivery" | "payment" | "safety" | "assignedToMe";

const URGENCY_BADGE: Record<AttentionUrgency, string> = {
  now: "bg-rose/30 text-mulberry",
  today: "bg-champagne/45 text-plum",
  soon: "bg-periwinkle/[0.17] text-mulberry",
};

const OUTLOOK = [
  { day: "Today", percent: 91, note: "24 / 1 at risk" },
  { day: "Tomorrow", percent: 75, note: "41 / 3 awaiting" },
  { day: "Saturday", percent: 100, note: "66 / 0 at risk" },
];

export default function AttentionPage() {
  const { cases, loading, assignToMe } = useAttentionQueue();
  const [chip, setChip] = useState<ChipKey>("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [holdPlaced, setHoldPlaced] = useState(false);

  const filtered = useMemo(() => {
    if (chip === "now") return cases.filter((c) => c.urgency === "now");
    if (chip === "assignedToMe") return cases.filter((c) => c.detail.owner !== "Unassigned");
    return cases;
  }, [cases, chip]);

  const selected = cases.find((c) => c.id === selectedId) ?? filtered[0] ?? cases[0];

  async function handleAssign() {
    if (!selected) return;
    await assignToMe(selected.id, "You");
  }

  async function handleReminder() {
    setSending(true);
    await new Promise((r) => setTimeout(r, 300));
    setSending(false);
    setSent(true);
  }

  return (
    <AdminLayout active="attention">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          placeholder="Search case, person, wish or delivery ID"
          className="min-w-[260px] flex-1 rounded-pill border border-plum/[0.16] px-[13px] py-[10px] text-[11px] outline-none sm:flex-none sm:w-[380px]"
        />
        <span className="text-[10px] text-ink/55">Assigned to me · GMT / Accra · K. Asante</span>
      </div>

      <section className="my-5">
        <span className="text-[10px] font-extrabold tracking-[0.11em] text-mulberry">
          CARE CONSOLE · TUESDAY 12 NOV
        </span>
        <h1 className="mt-1 font-display text-[34px]">Attention</h1>
        <p className="text-[11px] text-ink/55">
          Future promises that need a person's judgment before the moment is affected.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-[9px] sm:grid-cols-3 lg:grid-cols-5">
        {[
          { value: cases.filter((c) => c.urgency === "now").length || 7, label: "NEEDS ATTENTION NOW", alert: true },
          { value: 12, label: "DUE SOON · 7 DAYS" },
          { value: 3, label: "DELIVERY HOLDS" },
          { value: 2, label: "ESCALATIONS AWAITING REVIEW" },
          { value: "98.7%", label: "READY THIS WEEK" },
        ].map((pulse) => (
          <div key={pulse.label} className={clsx("rounded-md border bg-white p-[13px]", pulse.alert ? "border-rose" : "border-plum/[0.11]")}>
            <b className={clsx("block font-display text-[26px]", pulse.alert && "text-mulberry")}>{pulse.value}</b>
            <span className="text-[9px] font-extrabold tracking-[0.05em] text-ink/55">{pulse.label}</span>
          </div>
        ))}
      </section>

      <section className="mt-4 grid gap-[15px] lg:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-md border border-plum/[0.11] bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[21px]">Priority queue</h2>
            <button type="button" className="rounded-pill bg-plum px-[11px] py-[9px] text-[10px] font-extrabold text-porcelain">
              Saved view: next 72h
            </button>
          </div>
          <div className="my-3 flex flex-wrap gap-[6px]">
            {(
              [
                { key: "open", label: `Open · ${cases.length}` },
                { key: "now", label: "Now" },
                { key: "delivery", label: "Delivery" },
                { key: "payment", label: "Payment" },
                { key: "safety", label: "Safety" },
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
                  onClick={() => {
                    setSelectedId(item.id);
                    setSent(false);
                    setHoldPlaced(false);
                  }}
                  className="col-span-2 mt-1 w-max rounded-pill bg-plum px-[11px] py-[9px] text-[10px] font-extrabold text-porcelain sm:col-span-1 sm:mt-0"
                >
                  {item.actionLabel}
                </button>
              </div>
            ))
          )}
        </article>

        {selected && (
          <aside className="rounded-md bg-porcelain p-4 text-ink">
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
                disabled={sending || sent}
                onClick={handleReminder}
                className="rounded-pill bg-plum px-[11px] py-[9px] text-[10px] font-extrabold text-porcelain disabled:opacity-60"
              >
                {sent ? "Reminder sent ✓" : sending ? "Sending…" : "Send gentle reminder"}
              </button>
              <button
                type="button"
                onClick={handleAssign}
                className="rounded-pill border border-plum/[0.16] bg-white px-[11px] py-[9px] text-[10px] font-extrabold text-plum"
              >
                {selected.detail.owner === "Unassigned" ? "Assign to me" : `Owner: ${selected.detail.owner}`}
              </button>
              <button
                type="button"
                onClick={() => setHoldPlaced(true)}
                className="rounded-pill bg-rose px-[11px] py-[9px] text-[10px] font-extrabold text-plum"
              >
                {holdPlaced ? "Hold placed ✓" : "Place delivery hold"}
              </button>
            </div>

            <div className="mt-4">
              <span className="text-[9px] font-extrabold tracking-[0.11em] text-mulberry">DELIVERY OUTLOOK</span>
              {OUTLOOK.map((day) => (
                <div key={day.day} className="grid grid-cols-[70px_1fr_auto] items-center gap-2 border-t border-plum/[0.08] py-[9px] text-[10px]">
                  <b>{day.day}</b>
                  <div className="h-[7px] overflow-hidden rounded-pill bg-plum/[0.08]">
                    <i className="block h-full bg-moss" style={{ width: `${day.percent}%` }} />
                  </div>
                  <span>{day.note}</span>
                </div>
              ))}
            </div>
          </aside>
        )}
      </section>
    </AdminLayout>
  );
}
