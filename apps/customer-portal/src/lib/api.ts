import {
  currentUser,
  EXISTING_EMAILS,
  findWish,
  persistCurrentUser,
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
import {
  findGroupWish,
  findGroupWishInvitation,
  GROUP_WISH_INVITATIONS,
  GROUP_WISHES,
  persistGroupWishes,
  persistGroupWishInvitations,
} from "@/mocks/groupWishData";
import {
  findMemoryForContribution,
  GROUP_WISH_MEMORIES,
  persistGroupWishMemories,
} from "@/mocks/groupWishMemories";
import { findBloom, persistBirthdayBloom } from "@/mocks/birthdayBloomData";
import type {
  Attachment,
  BirthdayBloom,
  BloomWish,
  CalendarDay,
  CalendarEvent,
  CircleGroup,
  CirclePerson,
  CircleStats,
  ContributionContext,
  DeliveryChannel,
  GroupInvitation,
  GroupWish,
  GroupWishFormat,
  GroupWishInvitation,
  GroupWishMemory,
  MemoryFormat,
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

export interface UpdateProfileInput {
  firstName: string;
  lastName?: string;
  avatarUrl?: string | null;
  dateOfBirth?: string;
  country?: string;
  region?: string;
}

export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  if (!currentUser) throw new Error("Not signed in");
  currentUser.firstName = input.firstName;
  currentUser.lastName = input.lastName;
  currentUser.avatarUrl = input.avatarUrl ?? undefined;
  currentUser.dateOfBirth = input.dateOfBirth;
  currentUser.country = input.country;
  currentUser.region = input.region;
  currentUser.name = [input.firstName, input.lastName].filter(Boolean).join(" ") || currentUser.name;
  persistCurrentUser();
  return delay(currentUser);
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

export async function listGroupWishes(): Promise<GroupWish[]> {
  return delay([...GROUP_WISHES]);
}

export async function getGroupWish(id: string): Promise<GroupWish | null> {
  return delay(findGroupWish(id) ?? null);
}

export async function listGroupWishInvitations(): Promise<GroupWishInvitation[]> {
  return delay([...GROUP_WISH_INVITATIONS]);
}

export async function getGroupWishInvitation(id: string): Promise<GroupWishInvitation | null> {
  return delay(findGroupWishInvitation(id) ?? null);
}

export interface CreateGroupWishInput {
  title: string;
  recipientName: string;
  occasion: string;
  deliveryDateLabel: string;
  collectByLabel: string;
  context?: string;
  formats: GroupWishFormat[];
  namesVisible: boolean;
}

export async function createGroupWish(input: CreateGroupWishInput): Promise<GroupWish> {
  const wish: GroupWish = {
    id: `gw-${Math.random().toString(36).slice(2, 10)}`,
    title: input.title,
    recipientName: input.recipientName,
    occasion: input.occasion,
    deliveryDateLabel: input.deliveryDateLabel,
    collectByLabel: input.collectByLabel,
    context: input.context,
    formats: input.formats,
    namesVisible: input.namesVisible,
    joinedCount: 0,
    invitedCount: 0,
    viewedCount: 0,
    declinedCount: 0,
    memoriesCount: 0,
    activity: [{ id: `act-${Math.random().toString(36).slice(2, 8)}`, message: `You created ${input.title}.` }],
    createdAt: new Date().toISOString(),
  };
  GROUP_WISHES.unshift(wish);
  persistGroupWishes();
  return delay(wish);
}

export async function respondToGroupWishInvitation(
  id: string,
  status: "joined" | "declined" | "not-now",
): Promise<GroupWishInvitation> {
  const invitation = findGroupWishInvitation(id);
  if (!invitation) throw new Error(`Invitation ${id} not found`);
  invitation.status = status;
  if (status === "joined") {
    invitation.needNote = "Joined just now · add a note, photo, voice note, or short video whenever you are ready.";
  }
  persistGroupWishInvitations();
  return delay(invitation);
}

/**
 * Resolves the public, no-account-needed guest contribution view — the
 * link a contributor clicks doesn't care whether it points at an invitation
 * the current account received, or a group wish the current account
 * organizes, so this checks both id spaces.
 */
export async function getContributionContext(id: string): Promise<ContributionContext | null> {
  const invitation = findGroupWishInvitation(id);
  if (invitation) {
    return delay({
      id: invitation.id,
      title: invitation.title,
      inviterName: invitation.inviterName,
      recipientName: invitation.title.split("'s")[0] || invitation.title,
      deliveredLabel: invitation.deliveredLabel,
      collectionClosesLabel: invitation.collectionClosesLabel,
      memoriesWaitingLabel: invitation.alreadyJoinedLabel,
      memoriesProgress: 67,
      daysLeftLabel: invitation.daysLeftLabel,
      formats: invitation.formats,
    });
  }
  const wish = findGroupWish(id);
  if (wish) {
    return delay({
      id: wish.id,
      title: wish.title,
      inviterName: currentUser?.name ?? "The organizer",
      recipientName: wish.recipientName,
      deliveredLabel: `Delivers ${wish.deliveryDateLabel}`,
      collectionClosesLabel: `Collect by ${wish.collectByLabel}`,
      memoriesWaitingLabel: `${wish.memoriesCount} memories added so far`,
      memoriesProgress: Math.min(100, wish.memoriesCount * 10),
      daysLeftLabel: "a few days left",
      formats: wish.formats,
    });
  }
  return delay(null);
}

export async function getMemoryDraft(contributionId: string): Promise<GroupWishMemory | null> {
  return delay(findMemoryForContribution(contributionId) ?? null);
}

export interface SaveMemoryDraftInput {
  format: MemoryFormat;
  title?: string;
  body: string;
  whenWhere?: string;
  contributorLabel: string;
  attachment?: Attachment | null;
}

export async function saveMemoryDraft(
  contributionId: string,
  input: SaveMemoryDraftInput,
): Promise<GroupWishMemory> {
  const existing = findMemoryForContribution(contributionId);
  if (existing) {
    Object.assign(existing, input, { updatedAt: new Date().toISOString() });
    persistGroupWishMemories();
    return delay(existing);
  }
  const memory: GroupWishMemory = {
    id: `mem-${Math.random().toString(36).slice(2, 10)}`,
    contributionId,
    sealed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...input,
  };
  GROUP_WISH_MEMORIES.unshift(memory);
  persistGroupWishMemories();
  return delay(memory);
}

export async function sealMemoryDraft(contributionId: string): Promise<GroupWishMemory> {
  const memory = findMemoryForContribution(contributionId);
  if (!memory) throw new Error(`No memory draft for ${contributionId}`);
  memory.sealed = true;
  memory.updatedAt = new Date().toISOString();
  persistGroupWishMemories();
  return delay(memory);
}

export async function getBirthdayBloom(id: string): Promise<BirthdayBloom | null> {
  return delay(findBloom(id) ?? null);
}

export async function markBloomWishOpened(bloomId: string, wishId: string): Promise<BloomWish> {
  const bloom = findBloom(bloomId);
  const wish = bloom?.wishes.find((w) => w.id === wishId);
  if (!bloom || !wish) throw new Error(`Bloom wish ${wishId} not found`);
  wish.opened = true;
  persistBirthdayBloom();
  return delay(wish);
}

export async function toggleBloomWishFavorite(bloomId: string, wishId: string): Promise<BloomWish> {
  const bloom = findBloom(bloomId);
  const wish = bloom?.wishes.find((w) => w.id === wishId);
  if (!bloom || !wish) throw new Error(`Bloom wish ${wishId} not found`);
  wish.favorited = !wish.favorited;
  persistBirthdayBloom();
  return delay(wish);
}
