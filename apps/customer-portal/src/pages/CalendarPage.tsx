import { useState } from "react";
import clsx from "clsx";
import { Button } from "@wishdem/design-system";
import { AppNav } from "@/components/AppNav";
import { useCalendarDays, useCalendarEvents, useSelectedMoment } from "@/hooks/useCalendar";
import type { CalendarEvent, EventTone, TagTone } from "@/types";

const TABS = ["Agenda", "Month", "Week", "Moments", "Availability"];

const DOT_CLASSES: Record<EventTone, string> = {
  accent: "bg-champagne",
  rose: "bg-rose",
  moss: "bg-moss",
};

const TAG_CLASSES: Record<TagTone, string> = {
  accent: "bg-champagne text-plum",
  attention: "bg-rose text-plum",
  good: "bg-moss text-porcelain",
};

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <article className="grid grid-cols-[55px_1fr] items-center gap-[10px] border-t border-porcelain/[0.09] py-[11px] px-2 first:border-0 sm:grid-cols-[68px_1fr_auto]">
      <div className="text-[10px] leading-[1.4] text-porcelain/65">
        {event.timeLines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      <div>
        <h4 className="mb-[3px] text-[11px]">
          <span className={clsx("mr-[5px] inline-block h-2 w-2 rounded-full", DOT_CLASSES[event.dotTone])} />
          {event.title}
        </h4>
        <p className="text-[9px] leading-[1.4] text-porcelain/60">{event.description}</p>
      </div>
      <span
        className={clsx(
          "col-span-2 mt-1 w-fit rounded-pill px-[7px] py-[5px] text-[8px] font-extrabold sm:col-span-1 sm:mt-0 sm:justify-self-end",
          TAG_CLASSES[event.tagTone],
        )}
      >
        {event.tagLabel}
      </span>
    </article>
  );
}

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState("Agenda");
  const [selectedDayId, setSelectedDayId] = useState("day-1");
  const { days } = useCalendarDays();
  const { events } = useCalendarEvents(selectedDayId);
  const { moment } = useSelectedMoment();

  const needsCare = events.filter((e) => e.group === "needs-care");
  const thisWeek = events.filter((e) => e.group === "this-week");
  const selectedDay = days.find((d) => d.id === selectedDayId);

  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 pb-9 pt-6 sm:px-8">
      <AppNav active="calendar" />

      <header className="flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
            YOUR TIME, HELD WITH CARE
          </span>
          <h1 className="font-display text-[clamp(30px,4vw,39px)]">Calendar</h1>
          <p className="text-[11px] text-porcelain/68">
            See what is coming, protect your time, and make sure every meaningful
            delivery is ready.
          </p>
        </div>
        <div className="flex gap-[6px] overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "whitespace-nowrap rounded-pill border border-porcelain/[0.18] px-[10px] py-2 text-[10px] font-extrabold",
                activeTab === tab ? "bg-porcelain text-plum" : "text-porcelain/70",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {activeTab !== "Agenda" ? (
        <div className="grid min-h-[300px] place-items-center rounded-md border border-porcelain/[0.15] text-center text-[13px] text-porcelain/60">
          The {activeTab} view isn't built yet — Agenda has the full experience.
        </div>
      ) : (
        <>
          <div className="mb-3 flex gap-[7px] overflow-x-auto lg:hidden">
            {days.map((day, i) => (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedDayId(day.id)}
                className={clsx(
                  "w-[104px] flex-none rounded-md border border-porcelain/[0.14] p-[10px] text-left text-[10px]",
                  day.id === selectedDayId ? "bg-mulberry text-porcelain" : "text-porcelain/70",
                )}
              >
                <b className="block text-[11px] text-porcelain">
                  <span className="float-right font-extrabold text-champagne">{i + 1}</span>
                  {day.weekdayLabel}
                </b>
                {day.summary}
              </button>
            ))}
          </div>

          <section className="grid gap-[13px] sm:grid-cols-[minmax(0,1fr)_310px] lg:grid-cols-[160px_minmax(0,1fr)_310px]">
            <aside className="hidden rounded-md border border-porcelain/[0.1] bg-porcelain/[0.03] p-[10px] lg:block">
              <h3 className="my-[5px] ml-1 font-display text-[19px]">September</h3>
              {days.map((day, i) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDayId(day.id)}
                  className={clsx(
                    "mb-[3px] block w-full rounded-md p-[10px] text-left text-[10px]",
                    day.id === selectedDayId ? "bg-mulberry text-porcelain" : "text-porcelain/70",
                  )}
                >
                  <b className="block text-[11px] text-porcelain">
                    <span className="float-right font-extrabold text-champagne">{i + 1}</span>
                    {day.weekdayLabel}
                  </b>
                  {day.summary}
                </button>
              ))}
            </aside>

            <section className="rounded-md border border-porcelain/[0.1] bg-porcelain/[0.03] p-4">
            <div className="flex items-baseline justify-between border-b border-porcelain/[0.12] pb-3">
              <h2 className="font-display text-[25px]">
                {selectedDayId === "day-1" ? "Today" : selectedDay?.summary}
              </h2>
              <span className="text-[9px] text-porcelain/55">{selectedDay?.weekdayLabel}</span>
            </div>

            {events.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-porcelain/55">
                Nothing scheduled for this day yet.
              </p>
            ) : (
              <>
                {needsCare.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-[7px] text-[9px] font-extrabold tracking-[0.12em] text-champagne">
                      NEEDS YOUR CARE
                    </div>
                    {needsCare.map((event) => (
                      <EventRow key={event.id} event={event} />
                    ))}
                  </div>
                )}
                {thisWeek.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-[7px] text-[9px] font-extrabold tracking-[0.12em] text-champagne">
                      THIS WEEK
                    </div>
                    {thisWeek.map((event) => (
                      <EventRow key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {moment && (
            <aside className="rounded-md bg-porcelain p-4 text-ink shadow-card">
              <span className="text-[9px] font-extrabold tracking-[0.12em] text-mulberry">
                SELECTED MOMENT
              </span>
              <h3 className="my-[5px] font-display text-[27px]">{moment.title}</h3>
              <p className="text-[10px] text-ink/60">{moment.subtitle}</p>

              <div className="my-[14px] flex gap-[7px]">
                <div className="flex-1 rounded-sm bg-plum/[0.055] p-2 text-center">
                  <b className="text-[15px]">{moment.days}</b>
                  <small className="mt-[2px] block text-[7px] text-ink/60">DAYS</small>
                </div>
                <div className="flex-1 rounded-sm bg-plum/[0.055] p-2 text-center">
                  <b className="text-[15px]">{moment.clips}</b>
                  <small className="mt-[2px] block text-[7px] text-ink/60">CLIPS</small>
                </div>
                <div className="flex-1 rounded-sm bg-plum/[0.055] p-2 text-center">
                  <b className="text-[15px]">{moment.clipsRemaining}</b>
                  <small className="mt-[2px] block text-[7px] text-ink/60">TO GO</small>
                </div>
              </div>

              <div className="border-t border-plum/[0.09] py-[10px] text-[10px]">
                <strong className="block text-[10px]">{moment.contributionLabel}</strong>
                <span className="text-ink/65">{moment.contributionNote}</span>
                <div className="mt-[7px] h-[6px] overflow-hidden rounded-pill bg-plum/[0.09]">
                  <b
                    className="block h-full bg-champagne"
                    style={{ width: `${moment.contributionProgress}%` }}
                  />
                </div>
              </div>
              <div className="border-t border-plum/[0.09] py-[10px] text-[10px]">
                <strong className="block text-[10px]">Suggested time to record</strong>
                <span className="text-ink/65">{moment.suggestedTimeNote}</span>
              </div>
              <div className="border-t border-plum/[0.09] py-[10px] text-[10px]">
                <strong className="block text-[10px]">Delivery confidence</strong>
                <span className="text-ink/65">{moment.deliveryConfidenceNote}</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-[7px]">
                <Button variant="dark" size="sm" className="min-h-0 py-[9px] text-[9px]">
                  Schedule recording
                </Button>
                <Button
                  variant="outline-inverse"
                  size="sm"
                  className="min-h-0 border-plum/15 py-[9px] text-[9px]"
                >
                  Nudge 2 people
                </Button>
              </div>
            </aside>
          )}
          </section>
        </>
      )}
    </main>
  );
}
