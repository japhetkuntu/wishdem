import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { Button, Loading } from "@wishdem/design-system";
import { Seo } from "@/components/Seo";
import { AppNav } from "@/components/AppNav";
import { EmptyState } from "@/components/EmptyState";
import { useCalendarDays, useCalendarEvents } from "@/hooks/useCalendar";
import { daysUntilDate, getMonthGridCells, todayIso } from "@/lib/date";
import type { CalendarEvent, EventTone, TagTone } from "@/types";

const DOT_CLASSES: Record<EventTone, string> = {
  accent: "bg-champagne",
  rose: "bg-rose",
  moss: "bg-moss",
};

const TAG_CLASSES: Record<TagTone, string> = {
  accent: "bg-champagne text-plum",
  attention: "bg-rose text-plum",
  good: "bg-moss text-paper",
};

const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <article className="border-t border-porcelain/[0.09] py-[11px] px-2 first:border-0">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-[12px]">
          <span className={clsx("mr-[6px] inline-block h-2 w-2 rounded-full", DOT_CLASSES[event.dotTone])} />
          {event.title}
        </h4>
        <span
          className={clsx(
            "w-fit flex-none rounded-pill px-[7px] py-[5px] text-[8px] font-extrabold",
            TAG_CLASSES[event.tagTone],
          )}
        >
          {event.tagLabel}
        </span>
      </div>
      <p className="mt-[3px] pl-[14px] text-[10px] leading-[1.4] text-porcelain/60">{event.description}</p>
    </article>
  );
}

export default function CalendarPage() {
  const { days, loading: daysLoading } = useCalendarDays();
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<Date | null>(null);
  const { events, loading: eventsLoading } = useCalendarEvents(selectedDayId ?? "");

  // Default to the soonest upcoming day (and the month that contains it) once the real
  // list loads — there's no hardcoded "day one", since which date is first depends on
  // what's actually due.
  useEffect(() => {
    if (selectedDayId || days.length === 0) return;
    setSelectedDayId(days[0].id);
    const [y, m] = days[0].id.split("-").map(Number);
    setVisibleMonth(new Date(y, m - 1, 1));
  }, [days, selectedDayId]);

  const today = todayIso();
  const month = visibleMonth ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthLabel = month.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const isCurrentRealMonth =
    month.getFullYear() === new Date().getFullYear() && month.getMonth() === new Date().getMonth();

  const cells = useMemo(() => getMonthGridCells(month.getFullYear(), month.getMonth()), [month]);
  const dayById = useMemo(() => new Map(days.map((d) => [d.id, d])), [days]);

  const totalMoments = days.reduce((sum, d) => sum + d.count, 0);
  const nextDay = days[0];
  const thisMonthCount = days
    .filter((d) => d.id.startsWith(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`))
    .reduce((sum, d) => sum + d.count, 0);

  const selectedDay = selectedDayId ? dayById.get(selectedDayId) : undefined;
  const isSelectedToday = selectedDayId === today;

  function goToMonth(offset: number) {
    setVisibleMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));
  }

  function selectCell(iso: string, inCurrentMonth: boolean) {
    setSelectedDayId(iso);
    if (!inCurrentMonth) {
      const [y, m] = iso.split("-").map(Number);
      setVisibleMonth(new Date(y, m - 1, 1));
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 pb-[104px] pt-6 sm:px-8 sm:pb-9">
      <Seo
        title="Calendar — WishDem"
        description="Your private timeline of upcoming birthdays, wish deliveries, and group wish deadlines."
        path="/calendar"
        noindex
      />
      <AppNav active="calendar" />

      <header className="flex flex-col gap-4 py-6">
        <div>
          <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
            EVERYTHING COMING UP
          </span>
          <h1 className="font-display text-[clamp(30px,4vw,39px)]">Calendar</h1>
          <p className="text-[11px] text-porcelain/68">
            Every birthday and wish delivery you have scheduled, in one simple timeline.
          </p>
        </div>
      </header>

      {daysLoading ? (
        <Loading />
      ) : days.length === 0 ? (
        <div className="grid min-h-[50vh] place-items-center py-8">
          <EmptyState
            badge={"for\nlater"}
            eyebrow="NOTHING ON YOUR CALENDAR YET"
            title="Once you create a wish, its delivery day will show up here."
            description="Birthdays, scheduled deliveries, and group wish deadlines all land on this one timeline — nothing to set up."
            chips={[]}
            action={
              <Link to="/create/message">
                <Button>Create your first wish</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <section className="mb-4 grid grid-cols-3 gap-[10px]">
            <div className="rounded-md border border-porcelain/[0.12] bg-porcelain/[0.03] px-3 py-[13px] text-center sm:py-4">
              <b className="block font-display text-[26px] leading-none text-champagne sm:text-[30px]">
                {totalMoments}
              </b>
              <small className="mt-1 block text-[8px] font-extrabold tracking-[0.08em] text-porcelain/60 sm:text-[9px]">
                MOMENTS AHEAD
              </small>
            </div>
            <div className="rounded-md border border-porcelain/[0.12] bg-porcelain/[0.03] px-3 py-[13px] text-center sm:py-4">
              <b className="block font-display text-[26px] leading-none text-champagne sm:text-[30px]">
                {nextDay ? Math.max(0, daysUntilDate(nextDay.id)) : "—"}
              </b>
              <small className="mt-1 block text-[8px] font-extrabold tracking-[0.08em] text-porcelain/60 sm:text-[9px]">
                DAYS TO NEXT
              </small>
            </div>
            <div className="rounded-md border border-porcelain/[0.12] bg-porcelain/[0.03] px-3 py-[13px] text-center sm:py-4">
              <b className="block font-display text-[26px] leading-none text-champagne sm:text-[30px]">
                {thisMonthCount}
              </b>
              <small className="mt-1 block text-[8px] font-extrabold tracking-[0.08em] text-porcelain/60 sm:text-[9px]">
                THIS MONTH
              </small>
            </div>
          </section>

          <section className="grid gap-[13px] lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="rounded-md border border-porcelain/[0.1] bg-porcelain/[0.03] p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-[20px] sm:text-[23px]">{monthLabel}</h2>
                <div className="flex items-center gap-1">
                  {!isCurrentRealMonth && (
                    <button
                      type="button"
                      onClick={() => setVisibleMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                      className="mr-1 rounded-pill border border-champagne/40 px-[10px] py-[6px] text-[9px] font-extrabold text-champagne"
                    >
                      Today
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => goToMonth(-1)}
                    className="grid h-8 w-8 place-items-center rounded-full text-porcelain/70 hover:bg-porcelain/[0.08] hover:text-porcelain"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => goToMonth(1)}
                    className="grid h-8 w-8 place-items-center rounded-full text-porcelain/70 hover:bg-porcelain/[0.08] hover:text-porcelain"
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-[3px] text-center text-[8px] font-extrabold tracking-[0.06em] text-porcelain/45 sm:gap-1">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label} className="py-1">
                    {label}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-[3px] sm:gap-1">
                {cells.map((cell) => {
                  const dayInfo = dayById.get(cell.iso);
                  const isToday = cell.iso === today;
                  const isSelected = cell.iso === selectedDayId;
                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      onClick={() => selectCell(cell.iso, cell.inCurrentMonth)}
                      className={clsx(
                        "relative flex aspect-square flex-col items-center justify-center gap-[3px] rounded-md text-[11px] transition-colors sm:aspect-[6/5] sm:text-[13px]",
                        isSelected
                          ? "bg-mulberry font-extrabold text-[#F6F0E8]"
                          : cell.inCurrentMonth
                            ? "text-porcelain hover:bg-porcelain/[0.08]"
                            : "text-porcelain/25 hover:bg-porcelain/[0.05]",
                        isToday && !isSelected && "ring-1 ring-inset ring-champagne text-champagne",
                      )}
                    >
                      <span>{cell.day}</span>
                      {dayInfo && (
                        <span className="flex items-center gap-[2px]">
                          {dayInfo.tones.slice(0, 3).map((tone, i) => (
                            <i
                              key={i}
                              className={clsx(
                                "block h-[4px] w-[4px] rounded-full",
                                isSelected ? "bg-[#F6F0E8]" : DOT_CLASSES[tone],
                              )}
                            />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-md border border-porcelain/[0.1] bg-porcelain/[0.03] p-4 lg:sticky lg:top-4 lg:self-start">
              <div className="flex items-baseline justify-between border-b border-porcelain/[0.12] pb-3">
                <h2 className="font-display text-[22px]">
                  {isSelectedToday ? "Today" : selectedDay?.weekdayLabel ?? "Pick a day"}
                </h2>
                {selectedDayId && !isSelectedToday && (
                  <span className="text-[10px] font-bold text-porcelain/50">
                    {daysUntilDate(selectedDayId) >= 0
                      ? `in ${daysUntilDate(selectedDayId)}d`
                      : `${Math.abs(daysUntilDate(selectedDayId))}d ago`}
                  </span>
                )}
              </div>

              {eventsLoading ? (
                <Loading className="py-6" />
              ) : events.length === 0 ? (
                <p className="py-8 text-center text-[12px] text-porcelain/55">
                  Nothing scheduled for this day yet.
                </p>
              ) : (
                <div className="mt-2">
                  {events.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>
          </section>
        </>
      )}
    </main>
  );
}
