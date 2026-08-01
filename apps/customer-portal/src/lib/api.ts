import {
  currentUser,
  EXISTING_EMAILS,
  findWish,
  persistWishes,
  setCurrentUser,
  themes,
  wishes,
} from "@/mocks/db";
import { maskEmail } from "@/lib/format";
import { CALENDAR_DAYS, SOFIA_MOMENT, TODAY_EVENTS } from "@/mocks/calendarData";
import { PEOPLE } from "@/mocks/peopleData";
import {
  CIRCLE_PEOPLE,
  CIRCLE_STATS,
  persistCirclePeople,
  SHARED_INVITATIONS,
} from "@/mocks/circleData";
import type {
  Attachment,
  CalendarDay,
  CalendarEvent,
  CircleGroup,
  CirclePerson,
  CircleStats,
  DeliveryChannel,
  GroupInvitation,
  Person,
  PaymentResult,
  Recipient,
  SelectedMoment,
  ThemeId,
  User,
  Wish,
} from "@/types";

/**
 * Mock service layer standing in for a real backend. Every export here is
 * the seam a future API integration replaces — components and hooks should
 * only ever talk to this module, never to mocks/db directly.
 */
const LATENCY_MS = 260;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

function generateId() {
  return `wish-${Math.random().toString(36).slice(2, 10)}`;
}

export async function listWishes(): Promise<Wish[]> {
  return delay([...wishes]);
}

export async function getWish(id: string): Promise<Wish | null> {
  return delay(findWish(id));
}

export async function listThemes() {
  return delay([...themes]);
}

export interface DraftInput {
  id?: string;
  recipient: Recipient;
  fromName?: string;
}

export async function saveWhoStep(input: DraftInput): Promise<Wish> {
  const existing = input.id ? findWish(input.id) : null;
  if (existing) {
    existing.recipient = input.recipient;
    persistWishes();
    return delay(existing);
  }
  const wish: Wish = {
    id: generateId(),
    recipient: input.recipient,
    message: "",
    attachment: null,
    themeId: null,
    channel: null,
    status: "draft",
    fromName: input.fromName ?? "You",
    priceLabel: "£1.49",
    createdAt: new Date().toISOString(),
  };
  wishes.unshift(wish);
  persistWishes();
  return delay(wish);
}

/**
 * Recovers a wish record the mock "database" has lost track of — e.g. a
 * wishId the wizard still holds from before this tab's mock data was last
 * reset. The wizard already has the recipient in its own persisted state,
 * so steps can rebuild the record instead of failing outright.
 */
function ensureWish(id: string, recipient: Recipient | null | undefined): Wish {
  const existing = findWish(id);
  if (existing) return existing;
  if (!recipient) throw new Error(`Wish ${id} not found`);
  const recovered: Wish = {
    id,
    recipient,
    message: "",
    attachment: null,
    themeId: null,
    channel: null,
    status: "draft",
    fromName: "You",
    priceLabel: "£1.49",
    createdAt: new Date().toISOString(),
  };
  wishes.unshift(recovered);
  return recovered;
}

export async function saveMessageStep(
  id: string,
  message: string,
  attachment: Attachment | null,
  recipient?: Recipient,
): Promise<Wish> {
  const wish = ensureWish(id, recipient);
  wish.message = message;
  wish.attachment = attachment;
  persistWishes();
  return delay(wish);
}

export async function saveThemeStep(
  id: string,
  themeId: ThemeId,
  recipient?: Recipient,
): Promise<Wish> {
  const wish = ensureWish(id, recipient);
  wish.themeId = themeId;
  persistWishes();
  return delay(wish);
}

export async function saveDeliverStep(
  id: string,
  channel: DeliveryChannel,
  recipient?: Recipient,
): Promise<Wish> {
  const wish = ensureWish(id, recipient);
  wish.channel = channel;
  persistWishes();
  return delay(wish);
}

/**
 * Mock Mobile Money charge. Structured so a real payment provider (e.g.
 * Paystack/Flutterwave mobile money) can be swapped in behind this one
 * function without touching the seal-step UI.
 */
export async function chargeMobileMoney(
  wishId: string,
  _phoneNumber: string,
  recipient?: Recipient,
): Promise<PaymentResult> {
  const wish = ensureWish(wishId, recipient);

  // Deterministic-ish mock: numbers ending in "0" simulate a decline so the
  // payment-failed flow is easy to reach during testing.
  const declines = _phoneNumber.trim().endsWith("0");

  await delay(null);

  if (declines) {
    return { success: false, failureReason: "The mobile money charge was declined." };
  }

  wish.status = "sealed";
  wish.sealedAt = new Date().toISOString();
  persistWishes();
  return { success: true, reference: `WD-${Math.random().toString(36).slice(2, 10).toUpperCase()}` };
}

export async function markOpened(id: string): Promise<Wish> {
  const wish = findWish(id);
  if (!wish) throw new Error(`Wish ${id} not found`);
  wish.status = "opened";
  wish.openedAt = new Date().toISOString();
  persistWishes();
  return delay(wish);
}

export async function getCurrentUser(): Promise<User | null> {
  return delay(currentUser);
}

export async function signOut(): Promise<void> {
  setCurrentUser(null);
  return delay(undefined);
}

export async function signInWithGoogle(): Promise<User> {
  const user: User = {
    id: "user-1",
    name: "Leila",
    email: "leila@example.com",
    authMethod: "google",
  };
  setCurrentUser(user);
  return delay(user);
}

export async function signInWithEmail(email: string): Promise<User> {
  const user: User = {
    id: "user-1",
    name: email.split("@")[0] ?? "You",
    email,
    authMethod: "email",
  };
  setCurrentUser(user);
  return delay(user);
}

export interface OtpRequestResult {
  isNewCustomer: boolean;
  maskedEmail: string;
}

/**
 * Mock passwordless code request. A real backend would email a one-time
 * code here; this just decides new-vs-returning from a static mock list so
 * the two verification screens are both reachable.
 */
export async function requestOtp(email: string): Promise<OtpRequestResult> {
  const normalized = email.trim().toLowerCase();
  return delay({
    isNewCustomer: !EXISTING_EMAILS.includes(normalized),
    maskedEmail: maskEmail(normalized),
  });
}

/** Mock verification — any complete 6-digit code is accepted. */
export async function verifyOtp(
  email: string,
  _code: string,
  name?: string,
): Promise<User> {
  const normalized = email.trim().toLowerCase();
  const user: User = {
    id: "user-1",
    name: name?.trim() || normalized.split("@")[0] || "You",
    email: normalized,
    authMethod: "email",
  };
  setCurrentUser(user);
  return delay(user);
}

export async function listCalendarDays(): Promise<CalendarDay[]> {
  return delay([...CALENDAR_DAYS]);
}

/**
 * Only "today" has scripted events in this mock — other days render an
 * empty state rather than pretending to have real content for them.
 */
export async function listEventsForDay(dayId: string): Promise<CalendarEvent[]> {
  return delay(dayId === "day-1" ? [...TODAY_EVENTS] : []);
}

export async function getSelectedMoment(): Promise<SelectedMoment> {
  return delay(SOFIA_MOMENT);
}

export async function listPeople(): Promise<Person[]> {
  return delay([...PEOPLE]);
}

export async function listCirclePeople(): Promise<CirclePerson[]> {
  return delay([...CIRCLE_PEOPLE]);
}

export async function listSharedInvitations(): Promise<GroupInvitation[]> {
  return delay([...SHARED_INVITATIONS]);
}

export async function getCircleStats(): Promise<CircleStats> {
  return delay(CIRCLE_STATS);
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function groupFromRelationship(relationshipLabel: string): CircleGroup {
  if (relationshipLabel === "Family") return "family";
  if (relationshipLabel === "Colleague") return "work";
  return "friends";
}

const CIRCLE_AVATAR_TONES: CirclePerson["avatarTone"][] = [
  "accent",
  "rose",
  "moss",
  "mulberry",
];

export interface AddCirclePersonInput {
  name: string;
  birthdayISO: string | null;
  timezone: string;
  relationshipLabel: string;
  note?: string;
}

export async function addCirclePerson(input: AddCirclePersonInput): Promise<CirclePerson> {
  const person: CirclePerson = {
    id: `circle-${Math.random().toString(36).slice(2, 10)}`,
    name: input.name,
    initials: initialsFrom(input.name),
    avatarTone: CIRCLE_AVATAR_TONES[CIRCLE_PEOPLE.length % CIRCLE_AVATAR_TONES.length],
    relationshipLabel: input.relationshipLabel,
    group: groupFromRelationship(input.relationshipLabel),
    birthdayISO: input.birthdayISO,
    timezone: input.timezone,
    note: input.note,
    stateLabel: input.birthdayISO ? "No wish started" : "Needs a date",
    stateTone: "neutral",
    actionLabel: input.birthdayISO ? "Begin a wish →" : "Add birthday →",
    recentlyAdded: true,
  };
  CIRCLE_PEOPLE.unshift(person);
  persistCirclePeople();
  return delay(person);
}
