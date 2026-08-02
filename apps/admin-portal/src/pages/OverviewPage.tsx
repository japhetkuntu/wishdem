import clsx from "clsx";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { useOverview } from "@/hooks/useAdminData";
import type { Severity } from "@/types";

const SEVERITY_CLASSES: Record<Severity, string> = {
  critical: "bg-rose/25 text-mulberry",
  high: "bg-champagne/35 text-plum",
  medium: "bg-periwinkle/[0.17] text-mulberry",
};

const WAVE_BAR_CLASSES = {
  ok: "bg-moss",
  warn: "bg-champagne",
  bad: "bg-rose",
};

export default function OverviewPage() {
  const { data, loading } = useOverview();

  if (loading || !data) {
    return (
      <AdminLayout active="overview">
        <p className="py-16 text-center text-[12px] text-ink/50">Loading…</p>
      </AdminLayout>
    );
  }

  const { kpis } = data;

  return (
    <AdminLayout active="overview">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-plum/[0.1] pb-4">
        <input
          placeholder="Search wish ID, name, phone, transaction or case"
          className="min-w-[280px] flex-1 rounded-pill border border-plum/[0.14] px-[14px] py-[10px] text-[11px] outline-none"
        />
        <div className="flex items-center gap-3 text-[11px]">
          <b className="rounded-pill bg-champagne/25 px-2 py-[6px] text-[10px]">GMT / ACCRA</b>
          <span className="hidden text-ink/55 sm:inline">Last refreshed 09:48</span>
          <button type="button" className="rounded-pill bg-plum px-[13px] py-[10px] text-[10px] font-extrabold text-porcelain">
            Refresh data
          </button>
        </div>
      </header>

      <section className="my-[17px] flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold tracking-[0.13em] text-mulberry">
            TUESDAY, 12 NOVEMBER
          </span>
          <h1 className="mt-1 font-display text-[34px]">Today's operating condition</h1>
        </div>
        <p className="text-[11px] text-ink/60">
          All core systems reporting · 3 urgent issues assigned to you
        </p>
      </section>

      <section className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "CREATED TODAY", value: kpis.createdToday, note: kpis.createdTodayNote },
          { label: "CREATED THIS WEEK", value: kpis.createdWeek, note: kpis.createdWeekNote },
          { label: "DUE TODAY", value: kpis.dueToday, note: kpis.dueTodayNote },
          { label: "DELIVERED TODAY", value: kpis.deliveredToday, note: kpis.deliveredTodayNote },
          { label: "FAILED DELIVERY", value: kpis.failedDelivery, note: kpis.failedDeliveryNote, alert: true },
          { label: "REVENUE · WEEK", value: kpis.revenueWeek, note: kpis.revenueWeekNote },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={clsx(
              "rounded-md border p-[13px]",
              kpi.alert ? "border-rose bg-background-warm" : "border-plum/[0.1] bg-background-warm",
            )}
          >
            <span className="text-[9px] font-extrabold tracking-[0.07em] text-ink/55">{kpi.label}</span>
            <strong className={clsx("my-[7px] block font-display text-[27px]", kpi.alert && "text-mulberry")}>
              {kpi.value}
            </strong>
            <small className={clsx("text-[9px] font-extrabold text-moss", kpi.alert && "text-mulberry")}>
              {kpi.note}
            </small>
          </div>
        ))}
      </section>

      <section className="mt-[15px] grid gap-[14px] lg:grid-cols-[1.25fr_.75fr]">
        <div className="grid gap-[14px]">
          <article className="rounded-md border border-plum/[0.1] bg-background-warm p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[21px]">Needs attention</h2>
              <Link to="/attention" className="text-[10px] font-extrabold text-mulberry">
                Open all 18 →
              </Link>
            </div>
            <div className="mt-[10px]">
              {data.attention.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[76px_1fr] items-center gap-[10px] border-t border-plum/[0.09] py-[11px] sm:grid-cols-[76px_1fr_auto]"
                >
                  <span
                    className={clsx(
                      "w-max rounded-pill px-[6px] py-1 text-[8px] font-extrabold tracking-[0.05em]",
                      SEVERITY_CLASSES[item.severity],
                    )}
                  >
                    {item.severity.toUpperCase()}
                  </span>
                  <div>
                    <b className="text-[11px]">{item.title}</b>
                    <p className="mt-[3px] text-[10px] text-ink/55">{item.description}</p>
                  </div>
                  <Link to="/attention" className="col-span-2 mt-1 w-max sm:col-span-1 sm:mt-0">
                    <button
                      type="button"
                      className={clsx(
                        "rounded-pill px-[13px] py-[10px] text-[10px] font-extrabold",
                        item.severity === "critical" ? "bg-champagne text-plum" : "bg-plum text-porcelain",
                      )}
                    >
                      {item.actionLabel}
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-md border border-plum/[0.1] bg-background-warm p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[21px]">Delivery readiness</h2>
              <Link to="/delivery" className="text-[10px] font-extrabold text-mulberry">
                Live schedule →
              </Link>
            </div>
            {data.waves.map((wave) => (
              <div
                key={wave.id}
                className="grid grid-cols-[70px_1fr_60px] items-center gap-2 border-t border-plum/[0.09] py-[10px] text-[10px] sm:grid-cols-[94px_1fr_44px]"
              >
                <b>{wave.label}</b>
                <div className="h-[7px] overflow-hidden rounded-pill bg-plum/[0.08]">
                  <i className={clsx("block h-full", WAVE_BAR_CLASSES[wave.tone])} style={{ width: `${wave.percent}%` }} />
                </div>
                <span>{wave.ratioLabel}</span>
              </div>
            ))}
            <div className="grid grid-cols-[70px_1fr_60px] items-center gap-2 border-t border-plum/[0.09] py-[10px] text-[10px] sm:grid-cols-[94px_1fr_44px]">
              <b>Next wave</b>
              <div>
                <b>14:00 GMT</b>
                <br />
                <small className="text-ink/55">23 scheduled deliveries</small>
              </div>
              <span>queued</span>
            </div>
          </article>
        </div>

        <article className="rounded-md border border-plum/[0.1] bg-background-warm p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[21px]">Recent activity</h2>
            <Link to="/activity" className="text-[10px] font-extrabold text-mulberry">
              Audit log →
            </Link>
          </div>
          <div className="mt-[9px]">
            {data.activity.map((event) => (
              <div key={event.id} className="border-t border-plum/[0.09] py-[10px] text-[10px] leading-[1.45]">
                <time className="font-extrabold text-mulberry">{event.time}</time> · {event.message}
              </div>
            ))}
          </div>
          <div className="mt-[14px] grid grid-cols-3 gap-[10px]">
            {data.signals.map((signal) => (
              <div key={signal.label} className="rounded-md bg-plum p-[13px] text-porcelain">
                <b className="block font-display text-[25px] text-champagne">{signal.value}</b>
                <span className="text-[10px]">{signal.label}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AdminLayout>
  );
}
