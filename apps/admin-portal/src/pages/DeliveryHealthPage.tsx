import { useState } from "react";
import clsx from "clsx";
import { AdminLayout } from "@/components/AdminLayout";
import { useDeliveryHealth } from "@/hooks/useAdminData";
import type { DeliveryAttempt } from "@/types";

const ATTEMPT_BADGE: Record<DeliveryAttempt["status"], string> = {
  FAILED: "bg-rose/30 text-mulberry",
  RETRYING: "bg-champagne/45 text-plum",
  QUEUED: "bg-periwinkle/[0.17] text-mulberry",
};

const WAVES = [
  { label: "08:00–10:00", percent: 94, tone: "bg-moss", badge: "17 / 18 delivered", badgeTone: "bg-moss/20 text-moss" },
  { label: "10:00–12:00", percent: 83, tone: "bg-champagne", badge: "4 pending", badgeTone: "bg-champagne/45 text-plum" },
  { label: "12:00–14:00", percent: 62, tone: "bg-rose", badge: "5 failed", badgeTone: "bg-rose/30 text-mulberry" },
  { label: "Next · 14:00", percent: 42, tone: "bg-plum/40", badge: "23 queued", badgeTone: "bg-periwinkle/[0.17] text-mulberry" },
];

export default function DeliveryHealthPage() {
  const { stats, attempts, loading, retry } = useDeliveryHealth();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  async function handleRetry(id: string) {
    setRetryingId(id);
    try {
      await retry(id);
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <AdminLayout active="delivery">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-plum/[0.1] pb-4">
        <div>
          <span className="text-[10px] font-extrabold tracking-[0.1em] text-mulberry">
            DELIVERY HEALTH · GMT / ACCRA
          </span>
          <h1 className="mt-1 font-display text-[34px]">Delivery health</h1>
          <p className="text-[11px] text-ink/55">
            Live scheduler state, retry queue, and accountable delivery history.
          </p>
        </div>
        <input
          placeholder="Search delivery or wish ID"
          className="w-full rounded-sm border border-plum/[0.16] px-3 py-[10px] text-[11px] outline-none sm:w-[270px]"
        />
      </header>

      <section className="my-4 grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-5">
        {loading
          ? null
          : stats.map((stat) => (
              <div
                key={stat.label}
                className={clsx(
                  "rounded-md border p-[14px] bg-white",
                  stat.alert ? "border-rose" : "border-plum/[0.11]",
                )}
              >
                <span className="text-[9px] font-extrabold tracking-[0.08em] text-ink/55">{stat.label}</span>
                <b className={clsx("my-1 block font-display text-[28px]", stat.alert && "text-mulberry")}>
                  {stat.value}
                </b>
                <small className="text-[10px] text-ink/55">{stat.note}</small>
              </div>
            ))}
      </section>

      <section className="grid gap-[14px] lg:grid-cols-[1.22fr_.78fr]">
        <article className="rounded-md border border-plum/[0.11] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[21px]">Today's delivery waves</h2>
            <button type="button" className="rounded-sm border border-plum/[0.16] px-[10px] py-[8px] text-[10px]">
              All channels ▾
            </button>
          </div>
          {WAVES.map((wave) => (
            <div key={wave.label} className="grid grid-cols-[78px_1fr_auto] items-center gap-3 border-t border-plum/[0.08] py-[10px] text-[11px]">
              <b>{wave.label}</b>
              <div className="h-2 overflow-hidden rounded-pill bg-plum/[0.07]">
                <i className={clsx("block h-full", wave.tone)} style={{ width: `${wave.percent}%` }} />
              </div>
              <span className={clsx("whitespace-nowrap rounded-pill px-[6px] py-1 text-[9px] font-extrabold", wave.badgeTone)}>
                {wave.badge}
              </span>
            </div>
          ))}
        </article>

        <article className="rounded-md border border-plum/[0.11] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[21px]">Delivery attempts</h2>
            <button type="button" className="rounded-sm border border-plum/[0.16] px-[10px] py-[8px] text-[10px]">
              Failed &amp; retrying ▾
            </button>
          </div>
          {loading ? (
            <p className="py-10 text-center text-[12px] text-ink/50">Loading…</p>
          ) : (
            attempts.map((attempt) => (
              <div key={attempt.id} className="grid grid-cols-[100px_1fr_auto] items-center gap-[10px] border-t border-plum/[0.08] py-3 text-[11px]">
                <span className={clsx("w-max whitespace-nowrap rounded-pill px-[6px] py-1 text-[9px] font-extrabold", ATTEMPT_BADGE[attempt.status])}>
                  {attempt.status}
                  {attempt.triesLabel ? ` · ${attempt.triesLabel}` : ""}
                </span>
                <div>
                  <b className="block">
                    {attempt.id} · {attempt.wishId}
                  </b>
                  <small className="mt-[2px] block text-ink/55">{attempt.detail}</small>
                </div>
                <button
                  type="button"
                  disabled={retryingId === attempt.id}
                  onClick={() => (attempt.status === "FAILED" ? handleRetry(attempt.id) : undefined)}
                  className="rounded-pill bg-champagne px-[11px] py-[9px] text-[10px] font-extrabold text-plum disabled:opacity-50"
                >
                  {retryingId === attempt.id ? "Retrying…" : attempt.actionLabel}
                </button>
              </div>
            ))
          )}
        </article>
      </section>

      <article className="mt-4 rounded-md border border-plum/[0.11] bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-[21px]">Activity &amp; audit log</h2>
          <button type="button" className="rounded-sm border border-plum/[0.16] px-[10px] py-[8px] text-[10px]">
            Today · All actors ▾
          </button>
        </div>
        {[
          { time: "09:42", actor: "K. Asante", action: "retried delivery DLV-90411 for WD-10482", note: "Reason: provider timeout after automated retries · Outcome: queued" },
          { time: "09:31", actor: "A. Boateng", action: "issued a ₵15.00 refund for MM-2784891", note: "Reason: duplicate charge · Linked wish: WD-10410" },
          { time: "09:05", actor: "M. Owusu", action: "removed video content from WD-10398", note: "Reason: explicit sexual content · Moderation case MOD-3012" },
          { time: "08:44", actor: "System reconciler", action: "linked MM-2784710 to delivered wish WD-10377", note: "Provider settlement matched · no staff action needed" },
        ].map((event, i) => (
          <div key={i} className="grid grid-cols-[48px_1fr] gap-[10px] border-t border-plum/[0.08] py-[11px] text-[11px] leading-[1.45]">
            <time className="font-extrabold text-mulberry">{event.time}</time>
            <div>
              <b>{event.actor}</b> {event.action}
              <small className="mt-[2px] block text-ink/55">{event.note}</small>
            </div>
          </div>
        ))}
        <div className="mt-2 border-t border-plum/[0.08] pt-2 text-[10px] text-ink/50">
          Showing 4 of 2,486 events · All timestamps in GMT / Accra
        </div>
      </article>
    </AdminLayout>
  );
}
