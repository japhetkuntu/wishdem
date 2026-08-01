import type { CirclePerson, CircleStats, GroupInvitation } from "@/types";

const CIRCLE_STORAGE_KEY = "wishdem-mock-circle";

const SEED_CIRCLE_PEOPLE: CirclePerson[] = [
  {
    id: "circle-maya",
    name: "Maya Chen",
    initials: "MC",
    avatarTone: "accent",
    relationshipLabel: "Best friend",
    group: "friends",
    birthdayISO: "2026-11-12",
    timezone: "Europe/London",
    note: "Says she wants to try a pottery class. Loves yellow ranunculus.",
    stateLabel: "8 notes · waiting on 3",
    stateTone: "wait",
    actionLabel: "View wish →",
    wishId: "wish-maya",
  },
  {
    id: "circle-leo",
    name: "Leo Hart",
    initials: "LH",
    avatarTone: "moss",
    relationshipLabel: "Friend",
    group: "friends",
    birthdayISO: "2026-10-02",
    timezone: "Europe/London",
    stateLabel: "Sealed for delivery",
    stateTone: "sealed",
    actionLabel: "View wish →",
    wishId: "wish-leo",
  },
  {
    id: "circle-dad",
    name: "Dad",
    initials: "D",
    avatarTone: "rose",
    relationshipLabel: "Family",
    group: "family",
    birthdayISO: "2026-08-21",
    timezone: "Europe/London",
    stateLabel: "No wish started",
    stateTone: "neutral",
    actionLabel: "Begin a wish →",
    wishId: "wish-dad",
  },
  {
    id: "circle-amir",
    name: "Amir Rahman",
    initials: "AR",
    avatarTone: "mulberry",
    relationshipLabel: "Colleague",
    group: "work",
    birthdayISO: null,
    timezone: "Europe/London",
    stateLabel: "Needs a date",
    stateTone: "neutral",
    actionLabel: "Add birthday →",
    recentlyAdded: true,
  },
];

/** Mirrors the same sessionStorage persistence used for wishes (see mocks/db.ts). */
function loadCirclePeople(): CirclePerson[] {
  if (typeof sessionStorage === "undefined") return [...SEED_CIRCLE_PEOPLE];
  try {
    const raw = sessionStorage.getItem(CIRCLE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CirclePerson[];
  } catch {
    // Corrupt or inaccessible storage — fall back to the seed data.
  }
  return [...SEED_CIRCLE_PEOPLE];
}

export const CIRCLE_PEOPLE: CirclePerson[] = loadCirclePeople();

export function persistCirclePeople() {
  try {
    sessionStorage.setItem(CIRCLE_STORAGE_KEY, JSON.stringify(CIRCLE_PEOPLE));
  } catch {
    // Storage unavailable/full — non-fatal for a mock layer.
  }
}

export const SHARED_INVITATIONS: GroupInvitation[] = [
  {
    id: "invite-maya-30th",
    faceInitials: ["LP", "NC", "TR"],
    title: "Maya's 30th",
    description: "Lena invited you to add a note to a group birthday wish.",
    deadlineLabel: "Contributions close in 6 days",
    actionLabel: "Add your message",
  },
];

export const CIRCLE_STATS: CircleStats = {
  peopleCount: 8,
  momentsCount: 3,
};
