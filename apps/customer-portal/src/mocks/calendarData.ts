import type { CalendarDay, CalendarEvent, SelectedMoment } from "@/types";

export const CALENDAR_DAYS: CalendarDay[] = [
  { id: "day-1", weekdayLabel: "Tue, 24 Sep", summary: "Today" },
  { id: "day-2", weekdayLabel: "Wed, 25 Sep", summary: "One moment" },
  { id: "day-3", weekdayLabel: "Thu, 26 Sep", summary: "2 plans" },
  { id: "day-4", weekdayLabel: "Fri, 27 Sep", summary: "Open" },
  { id: "day-5", weekdayLabel: "Sat, 28 Sep", summary: "Leo's birthday" },
];

export const TODAY_EVENTS: CalendarEvent[] = [
  {
    id: "event-sofia-gift",
    timeLines: ["10:30", "11:00"],
    title: "Choose Sofia's birthday gift",
    description: "Personal reminder · 24 days until her birthday",
    dotTone: "accent",
    tagLabel: "Open plan",
    tagTone: "accent",
    group: "needs-care",
  },
  {
    id: "event-dad-proof",
    timeLines: ["19:00"],
    title: "Wish for Dad: final proof window closes",
    description: "Delivery is not secured until payment is confirmed.",
    dotTone: "rose",
    tagLabel: "Pay now",
    tagTone: "attention",
    group: "needs-care",
  },
  {
    id: "event-sofia-call",
    timeLines: ["Today", "16:00"],
    title: "Sofia 30th planning call",
    description: "Studio Lumen · Maya, Tessa, and Amir attending",
    dotTone: "accent",
    tagLabel: "View event",
    tagTone: "accent",
    group: "this-week",
  },
  {
    id: "event-leo-wish",
    timeLines: ["2 Oct", "08:00"],
    title: "Leo's birthday wish",
    description: "Sealed and scheduled · Delivering in his local time",
    dotTone: "moss",
    tagLabel: "Sealed",
    tagTone: "good",
    group: "this-week",
  },
  {
    id: "event-mia-birthday",
    timeLines: ["11 Oct"],
    title: "Mia's birthday",
    description: "Draft started · no delivery time selected yet",
    dotTone: "rose",
    tagLabel: "Continue draft",
    tagTone: "attention",
    group: "this-week",
  },
];

export const SOFIA_MOMENT: SelectedMoment = {
  title: "Sofia's 30th",
  subtitle: "Friday, 18 October · Client partner at Ardent",
  days: 24,
  clips: 3,
  clipsRemaining: 2,
  contributionLabel: "Group video + handwritten note",
  contributionNote: "£30 of £60 contributed",
  contributionProgress: 50,
  suggestedTimeNote: "Thu, 3 Oct · 16:00–16:30 · all 3 free",
  deliveryConfidenceNote: "Wish draft exists · awaiting 2 contributions",
};
