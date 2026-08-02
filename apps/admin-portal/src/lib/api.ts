import {
  ATTENTION_CASES,
  AUDIT_EVENTS,
  CUSTOMERS,
  DELIVERY_ATTEMPTS,
  DELIVERY_STATS,
  MODERATION_CASE,
  MOMO_TRANSACTIONS,
  OVERVIEW,
  TEAM_MEMBERS,
  WISHES,
} from "@/mocks/adminData";
import type { AdminUser, ModerationCase } from "@/types";

const LATENCY_MS = 220;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

const AUTH_KEY = "wishdem-admin-user";

function loadUser(): AdminUser | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

let currentUser: AdminUser | null = loadUser();

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  return delay(currentUser);
}

export async function signInAdmin(email: string): Promise<AdminUser> {
  const user: AdminUser = {
    id: "admin-1",
    name: email.split("@")[0]?.replace(/[._]/g, " ") || "Team member",
    email,
    role: "Operations Admin",
  };
  currentUser = user;
  try {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } catch {
    // non-fatal for a mock layer
  }
  return delay(user);
}

export async function signOutAdmin(): Promise<void> {
  currentUser = null;
  try {
    sessionStorage.removeItem(AUTH_KEY);
  } catch {
    // non-fatal
  }
  return delay(undefined);
}

export async function getOverview() {
  return delay(OVERVIEW);
}

export async function listWishes() {
  return delay([...WISHES]);
}

export async function retryWishDelivery(wishId: string) {
  const wish = WISHES.find((w) => w.id === wishId);
  if (wish) {
    wish.deliveryStatus = "SCHEDULED";
    wish.deliveryDetail = "Retry queued";
    wish.investigation.timeline.unshift({ time: "Just now", note: "Retry queued by admin" });
  }
  return delay(wish ?? null);
}

export async function listMoMoTransactions() {
  return delay([...MOMO_TRANSACTIONS]);
}

export async function getModerationCase() {
  return delay({ ...MODERATION_CASE } as ModerationCase);
}

export async function decideModerationCase(decision: "approved" | "removed") {
  MODERATION_CASE.status = "resolved";
  MODERATION_CASE.description =
    decision === "approved"
      ? "Content was reviewed and approved for delivery."
      : "Content was removed and is no longer available to sender or recipient.";
  return delay({ ...MODERATION_CASE });
}

export async function listDeliveryStats() {
  return delay([...DELIVERY_STATS]);
}

export async function listDeliveryAttempts() {
  return delay([...DELIVERY_ATTEMPTS]);
}

export async function retryDeliveryAttempt(id: string) {
  const attempt = DELIVERY_ATTEMPTS.find((d) => d.id === id);
  if (attempt) {
    attempt.status = "QUEUED";
    attempt.detail = attempt.detail.replace(/Provider timeout.*/, "Retry queued by admin");
    attempt.actionLabel = "Open";
  }
  return delay(attempt ?? null);
}

export async function listAttentionCases() {
  return delay([...ATTENTION_CASES]);
}

export async function assignAttentionCase(id: string, owner: string) {
  const item = ATTENTION_CASES.find((a) => a.id === id);
  if (item) item.detail.owner = owner;
  return delay(item ?? null);
}

export async function listCustomers() {
  return delay([...CUSTOMERS]);
}

export async function listTeamMembers() {
  return delay([...TEAM_MEMBERS]);
}

export async function listAuditEvents() {
  return delay([...AUDIT_EVENTS]);
}

export async function changePassword(_current: string, _next: string): Promise<{ success: true }> {
  return delay({ success: true });
}

export async function requestPasswordResetCode(email: string): Promise<{ maskedEmail: string }> {
  const [name, domain] = email.split("@");
  const masked = `${name?.[0] ?? "a"}${"•".repeat(Math.max(3, (name?.length ?? 4) - 1))}@${domain ?? "mail.com"}`;
  return delay({ maskedEmail: masked });
}

export async function resetPasswordWithCode(_code: string, _next: string): Promise<{ success: true }> {
  return delay({ success: true });
}
