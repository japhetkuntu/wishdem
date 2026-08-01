import { useEffect, useState } from "react";
import { getSelectedMoment, listCalendarDays, listEventsForDay } from "@/lib/api";
import type { CalendarDay, CalendarEvent, SelectedMoment } from "@/types";

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
    setLoading(true);
    listEventsForDay(dayId).then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, [dayId]);

  return { events, loading };
}

export function useSelectedMoment() {
  const [moment, setMoment] = useState<SelectedMoment | null>(null);

  useEffect(() => {
    getSelectedMoment().then(setMoment);
  }, []);

  return { moment };
}
