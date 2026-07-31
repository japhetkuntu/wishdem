import {
  currentUser,
  EXISTING_EMAILS,
  findWish,
  setCurrentUser,
  themes,
  wishes,
} from "@/mocks/db";
import { maskEmail } from "@/lib/format";
import type {
  Attachment,
  DeliveryChannel,
  PaymentResult,
  Recipient,
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
  return delay(wish);
}

export async function saveMessageStep(
  id: string,
  message: string,
  attachment: Attachment | null,
): Promise<Wish> {
  const wish = findWish(id);
  if (!wish) throw new Error(`Wish ${id} not found`);
  wish.message = message;
  wish.attachment = attachment;
  return delay(wish);
}

export async function saveThemeStep(id: string, themeId: ThemeId): Promise<Wish> {
  const wish = findWish(id);
  if (!wish) throw new Error(`Wish ${id} not found`);
  wish.themeId = themeId;
  return delay(wish);
}

export async function saveDeliverStep(
  id: string,
  channel: DeliveryChannel,
): Promise<Wish> {
  const wish = findWish(id);
  if (!wish) throw new Error(`Wish ${id} not found`);
  wish.channel = channel;
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
): Promise<PaymentResult> {
  const wish = findWish(wishId);
  if (!wish) throw new Error(`Wish ${wishId} not found`);

  // Deterministic-ish mock: numbers ending in "0" simulate a decline so the
  // payment-failed flow is easy to reach during testing.
  const declines = _phoneNumber.trim().endsWith("0");

  await delay(null);

  if (declines) {
    return { success: false, failureReason: "The mobile money charge was declined." };
  }

  wish.status = "sealed";
  wish.sealedAt = new Date().toISOString();
  return { success: true, reference: `WD-${Math.random().toString(36).slice(2, 10).toUpperCase()}` };
}

export async function markOpened(id: string): Promise<Wish> {
  const wish = findWish(id);
  if (!wish) throw new Error(`Wish ${id} not found`);
  wish.status = "opened";
  wish.openedAt = new Date().toISOString();
  return delay(wish);
}

export async function getCurrentUser(): Promise<User | null> {
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
