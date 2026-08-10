import { useEffect, useState } from "react";
import { listCalendarDays, listEventsForDay } from "@/lib/api";
import type { CalendarDay, CalendarEvent } from "@/types";

export function useCalendarDays() {
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCalendarDays().then((data) => {
      setDays(data);
      setLoading(false);
    });
  }, []);

  return { days, loading };
}

export function useCalendarEvents(dayId: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dayId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    // Guards against the auto-select-on-load race: the initial empty-string call and the
    // real dayId call can both be in flight together, and without this the first request's
    // (empty, stale) result could resolve after the real one and clobber it.
    let cancelled = false;
    setLoading(true);
    listEventsForDay(dayId).then((data) => {
      if (cancelled) return;
      setEvents(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [dayId]);

  return { events, loading };
}
