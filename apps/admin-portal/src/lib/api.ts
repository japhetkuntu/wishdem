import { apiRequest, ApiError, clearTokens, hasSession, setTokens } from "@/lib/httpClient";
import type {
  AdminCustomer,
  AdminUser,
  AdminWish,
  AttentionCase,
  AuditEvent,
  DeliveryAttempt,
  DeliveryAttemptStatus,
  DeliveryStat,
  DeliveryStatus,
  ModerationCase,
  MoMoStatus,
  MoMoTransaction,
  OverviewData,
  PaymentStatus,
  Severity,
  TeamMember,
} from "@/types";

/* -------------------------------------------------------------------------
 * Backend DTO shapes (Admin.Api). These mirror the real API responses; the
 * functions below map them onto this app's richer frontend types wherever a
 * reasonable, non-fabricated mapping exists.
 * ---------------------------------------------------------------------- */

interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  user: { id: string; email: string; fullName: string; role: string };
}

interface PagedResult<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** What every paginated list function returns to the UI — enough for a
 * Pagination control to render page numbers and a "showing X-Y of Z" line
 * without the caller needing to know the raw backend DTO shape. */
export interface Paginated<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

function toPaginated<TDto, T>(page: PagedResult<TDto>, map: (dto: TDto) => T): Paginated<T> {
  return {
    items: page.items.map(map),
    pageIndex: page.pageIndex,
    pageSize: page.pageSize,
    totalPages: page.totalPages,
    totalCount: page.totalCount,
  };
}

export const DEFAULT_PAGE_SIZE = 8;

/** Every list screen's filtering/search happens server-side — this just turns whatever
 * params a screen has into a query string, skipping anything unset so defaults on the
 * backend apply normally. */
function buildQuery(params: Record<string, string | number | boolean | string[] | undefined>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) usp.append(key, v);
    } else {
      usp.set(key, String(value));
    }
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

type BackendWishStatus = "draft" | "sealed" | "delivered" | "opened";

interface AdminWishResponseDto {
  id: string;
  customerUserId: string;
  customerEmail: string;
  customerName: string;
  fromName: string;
  recipientName: string;
  recipientRelationship: string;
  recipientPhoneNumber: string | null;
  occasion: string;
  occasionLabel: string | null;
  recipientOccasionDate: string | null;
  /** Null until the sender reaches the deliver step of the wizard — draft wishes have no channel yet. */
  channel: string | null;
  status: BackendWishStatus;
  priceLabel: string;
  sealedAtUtc: string | null;
  deliveredAtUtc: string | null;
  openedAtUtc: string | null;
  createdAtUtc: string;
  isStruggling: boolean;
}

type BackendPaymentStatus = "pending" | "succeeded" | "failed" | "reversed" | "refundPending";
type BackendProvider = "mtn" | "telecel" | "airtelTigo";

interface AdminPaymentResponseDto {
  id: string;
  wishId: string;
  senderName: string;
  phoneNumber: string;
  provider: BackendProvider;
  amount: number;
  status: BackendPaymentStatus;
  failureReason: string | null;
  reconciliationMismatch: boolean;
  refundAmount: number | null;
  refundReason: string | null;
  refundedAtUtc: string | null;
  settledAtUtc: string | null;
  createdAtUtc: string;
}

type BackendSeverity = "info" | "medium" | "high" | "critical";
type BackendModerationStatus = "underReview" | "resolved";
type BackendDecision = "approved" | "removed" | null;

interface ModerationCaseResponseDto {
  id: string;
  wishId: string;
  title: string;
  description: string | null;
  evidenceQuote: string | null;
  contentType: string | null;
  severity: BackendSeverity;
  status: BackendModerationStatus;
  assignedToName: string | null;
  reviewerName: string | null;
  decision: BackendDecision;
  decisionReason: string | null;
  decidedAtUtc: string | null;
  createdAtUtc: string;
}

interface DeliveryHealthDto {
  draft: number;
  due: number;
  delivered: number;
  opened: number;
}

interface CustomerResponseDto {
  id: string;
  email: string;
  name: string;
  createdAtUtc: string;
  lastLoginAtUtc: string | null;
  totalWishCount: number;
  wishCountByStatus: Record<string, number>;
  totalAmountPaid: number;
}

/* -------------------------------------------------------------------------
 * Auth
 *
 * The backend has no GET /api/auth/me-style endpoint, so the logged-in user
 * object returned by login/refresh is persisted here (sessionStorage, kept
 * separate from httpClient's token storage) and read back by
 * getCurrentAdmin() without a network call.
 * ---------------------------------------------------------------------- */

const PERSISTED_USER_KEY = "wishdem-admin-user";

function persistUser(user: AdminUser) {
  try {
    sessionStorage.setItem(PERSISTED_USER_KEY, JSON.stringify(user));
  } catch {
    // Non-fatal — session just won't survive a reload.
  }
}

function loadPersistedUser(): AdminUser | null {
  try {
    const raw = sessionStorage.getItem(PERSISTED_USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

function clearPersistedUser() {
  try {
    sessionStorage.removeItem(PERSISTED_USER_KEY);
  } catch {
    // Nothing to clean up if storage isn't available.
  }
}

function mapUser(dto: LoginResponseDto["user"]): AdminUser {
  return { id: dto.id, name: dto.fullName, email: dto.email, role: dto.role };
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  if (!hasSession()) return null;
  return loadPersistedUser();
}

export async function signInAdmin(email: string, password: string): Promise<AdminUser> {
  const result = await apiRequest<LoginResponseDto>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  setTokens(result.accessToken, result.refreshToken);
  const user = mapUser(result.user);
  persistUser(user);
  return user;
}

export async function signOutAdmin(): Promise<void> {
  try {
    await apiRequest("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: getStoredRefreshTokenForLogout() }),
    });
  } catch {
    // Best-effort — logout should never block clearing local session state.
  }
  clearTokens();
  clearPersistedUser();
}

// httpClient doesn't expose the raw refresh token (by design, to keep a
// single source of truth for token storage), so logout best-effort reads it
// straight from sessionStorage using the same key httpClient uses internally.
function getStoredRefreshTokenForLogout(): string | null {
  try {
    return sessionStorage.getItem("wishdem-admin-refresh-token");
  } catch {
    return null;
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: true }> {
  await apiRequest<boolean>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return { success: true };
}

export async function requestPasswordResetCode(email: string): Promise<{ maskedEmail: string }> {
  const result = await apiRequest<{ maskedEmail: string; expirySeconds: number; devCode?: string | null }>(
    "/api/auth/forgot-password",
    { method: "POST", body: JSON.stringify({ email }), skipAuth: true },
  );
  // devCode is only present outside Production — there's no real email
  // provider wired up yet, so log it for local dev convenience.
  if (result.devCode) {
    // eslint-disable-next-line no-console
    console.info(`[dev] Password reset code for ${email}: ${result.devCode}`);
  }
  return { maskedEmail: result.maskedEmail };
}

export async function resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<{ success: true }> {
  await apiRequest<boolean>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
    skipAuth: true,
  });
  return { success: true };
}

/* -------------------------------------------------------------------------
 * Dashboard overview
 *
 * The backend overview DTO is deliberately much flatter than OverviewData
 * (no waves/signals/activity-feed concept exists server-side). Real counts
 * are mapped in; everything else is left empty/zero rather than fabricated.
 * ---------------------------------------------------------------------- */

interface DashboardOverviewDto {
  totalWishes: number;
  sealedTodayCount: number;
  openedTodayCount: number;
  openModerationCasesCount: number;
  totalRevenue: number;
  totalCustomers: number;
  customersWithWishCount: number;
}

export async function getOverview(): Promise<OverviewData> {
  const dto = await apiRequest<DashboardOverviewDto>("/api/dashboard/overview");

  return {
    kpis: {
      // "Created today" isn't tracked distinctly from "sealed today" by the
      // backend — sealedTodayCount is the closest real signal.
      createdToday: dto.sealedTodayCount,
      createdTodayNote: "",
      createdWeek: dto.totalWishes,
      createdWeekNote: "All-time total",
      // No "due today" concept server-side (see delivery-health for buckets).
      dueToday: 0,
      dueTodayNote: "",
      deliveredToday: dto.openedTodayCount,
      deliveredTodayNote: "",
      // No failed-delivery concept exists yet.
      failedDelivery: 0,
      failedDeliveryNote: "",
      revenueWeek: formatCurrency(dto.totalRevenue),
      revenueWeekNote: "All-time total, not week-scoped",
    },
    // No backend "attention case" summary feed for the overview page — the
    // full attention queue is fetched separately from /api/moderation by
    // listAttentionCases(); we don't duplicate/fabricate a preview here.
    attention: [],
    // No delivery-wave concept server-side.
    waves: [],
    // No activity-feed/audit-log entity exists server-side.
    activity: [],
    signals: [
      { value: String(dto.totalCustomers), label: "Signed up" },
      { value: String(dto.customersWithWishCount), label: "Created a wish" },
      { value: String(dto.openModerationCasesCount), label: "Open moderation cases" },
    ],
  };
}

function formatCurrency(amount: number): string {
  return `GH₵${amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* -------------------------------------------------------------------------
 * Wishes oversight
 * ---------------------------------------------------------------------- */

function formatDateLabel(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

function mapWishDeliveryStatus(status: BackendWishStatus, deliveredAtUtc: string | null, isStruggling: boolean): DeliveryStatus {
  if (status === "delivered" || status === "opened" || deliveredAtUtc) return "DELIVERED";
  // Backed by the same DeliveryAttemptCount threshold the delivery worker itself uses to
  // decide it's struggling — not a status that's merely displayed but never set.
  if (isStruggling) return "FAILED";
  if (status === "sealed") return "SCHEDULED";
  // "draft" has no real delivery-status equivalent in the mock's enum; the
  // closest honest mapping is SCHEDULED (not yet attempted, not failed).
  return "SCHEDULED";
}

function mapWish(dto: AdminWishResponseDto): AdminWish {
  const deliveryStatus = mapWishDeliveryStatus(dto.status, dto.deliveredAtUtc, dto.isStruggling);
  const statusBadge = dto.status.toUpperCase();
  // Draft wishes haven't reached the deliver step yet, so the backend sends no channel.
  const channelLabel = dto.channel ?? "Not chosen yet";

  return {
    id: dto.id,
    createdLabel: `Created ${formatDateLabel(dto.createdAtUtc)} · ${channelLabel}`,
    channel: channelLabel,
    senderName: dto.fromName || dto.customerName,
    recipientName: dto.recipientName,
    recipientPhoneNumber: dto.recipientPhoneNumber,
    scheduleLabel: dto.sealedAtUtc ? formatDateLabel(dto.sealedAtUtc) : "—",
    timezoneLabel: "GMT / Accra",
    deliveryStatus,
    // No per-attempt/retry count tracked server-side — leave blank rather
    // than fabricate a "3 attempts" style detail.
    deliveryDetail: "",
    // The backend has no payment-status field on the wish itself (that
    // lives on the payment record) — PAID is the only honest default here
    // since sealed/delivered/opened wishes imply payment succeeded.
    paymentStatus: "PAID" as PaymentStatus,
    type: channelLabel,
    investigation: {
      statusBadge,
      // No per-wish audit trail exists server-side — these facts are built
      // only from real fields already on the wish, not an invented narrative.
      facts: [
        { label: "Status", value: statusBadge },
        { label: "Channel", value: channelLabel },
        { label: "Recipient", value: `${dto.recipientName} (${dto.recipientRelationship})` },
        // Recipient's phone as entered by the customer — surfaced so an admin can spot a
        // malformed/wrong number when a customer reports a delivery that never arrived.
        { label: "Recipient phone", value: dto.recipientPhoneNumber ?? "Not provided" },
        { label: "Sealed", value: dto.sealedAtUtc ? formatDateLabel(dto.sealedAtUtc) : "Not sealed" },
      ],
      timeline: [
        dto.openedAtUtc && { time: formatDateLabel(dto.openedAtUtc), note: "Opened by recipient" },
        dto.deliveredAtUtc && { time: formatDateLabel(dto.deliveredAtUtc), note: "Delivered" },
        dto.sealedAtUtc && { time: formatDateLabel(dto.sealedAtUtc), note: "Sealed" },
        { time: formatDateLabel(dto.createdAtUtc), note: "Wish created" },
      ].filter((x): x is { time: string; note: string } => Boolean(x)),
    },
  };
}

export interface WishListFilters {
  status?: BackendWishStatus;
  search?: string;
  /** Only wishes that have crossed the "struggling" delivery-attempt threshold. */
  struggling?: boolean;
}

export async function listWishes(
  pageIndex = 0,
  pageSize = DEFAULT_PAGE_SIZE,
  filters: WishListFilters = {},
): Promise<Paginated<AdminWish>> {
  const query = buildQuery({ pageIndex, pageSize, ...filters });
  const page = await apiRequest<PagedResult<AdminWishResponseDto>>(`/api/wishes${query}`);
  return toPaginated(page, mapWish);
}

export async function retryWishDelivery(wishId: string): Promise<AdminWish | null> {
  try {
    const dto = await apiRequest<AdminWishResponseDto>(`/api/wishes/${wishId}/redeliver`, { method: "POST" });
    return mapWish(dto);
  } catch (err) {
    if (err instanceof ApiError && err.code === 404) return null;
    throw err;
  }
}

/** Permanently removes a wish — there's no "Cancelled" wish status, so cancelling means deleting it. */
export async function cancelWish(wishId: string): Promise<void> {
  await apiRequest<void>(`/api/wishes/${wishId}`, { method: "DELETE" });
}

/* -------------------------------------------------------------------------
 * Payments oversight
 * ---------------------------------------------------------------------- */

const MOMO_STATUS_MAP: Record<BackendPaymentStatus, MoMoStatus> = {
  pending: "PENDING",
  succeeded: "SUCCESSFUL",
  failed: "FAILED",
  reversed: "FAILED",
  refundPending: "REFUND_PENDING",
};

const PROVIDER_LABEL_MAP: Record<BackendProvider, string> = {
  mtn: "MTN",
  telecel: "Telecel",
  airtelTigo: "AirtelTigo",
};

function mapPayment(dto: AdminPaymentResponseDto): MoMoTransaction {
  const status = MOMO_STATUS_MAP[dto.status];
  const reconciliationLabel = dto.reconciliationMismatch
    ? "Reconciliation mismatch"
    : dto.settledAtUtc
      ? `Reconciled · ${formatDateLabel(dto.settledAtUtc)}`
      : "Awaiting settlement";

  const actionLabel =
    status === "FAILED" ? "View event" : status === "PENDING" ? "Investigate" : status === "REFUND_PENDING" ? "Review" : "Open";

  return {
    id: dto.id,
    wishId: dto.wishId,
    senderName: dto.senderName,
    provider: PROVIDER_LABEL_MAP[dto.provider],
    amount: formatCurrency(dto.amount),
    rawAmount: dto.amount,
    statusNote: dto.failureReason ?? (dto.settledAtUtc ? `Settled ${formatDateLabel(dto.settledAtUtc)}` : "—"),
    status,
    reconciliationLabel,
    actionLabel,
  };
}

export async function listMoMoTransactions(
  pageIndex = 0,
  pageSize = DEFAULT_PAGE_SIZE,
  search?: string,
): Promise<Paginated<MoMoTransaction>> {
  const query = buildQuery({ pageIndex, pageSize, search });
  const page = await apiRequest<PagedResult<AdminPaymentResponseDto>>(`/api/payments${query}`);
  return toPaginated(page, mapPayment);
}

/** Only a SUCCESSFUL payment can be refunded — the backend rejects any other status. */
export async function refundPayment(
  paymentId: string,
  input: { amount: number; reason: string },
): Promise<MoMoTransaction> {
  const dto = await apiRequest<AdminPaymentResponseDto>(`/api/payments/${paymentId}/refund`, {
    method: "POST",
    body: JSON.stringify({ amount: input.amount, reason: input.reason }),
  });
  return mapPayment(dto);
}

/* -------------------------------------------------------------------------
 * Moderation
 *
 * Backs both PaymentsModerationPage's ModerationCase and AttentionPage's
 * richer AttentionCase from the same /api/moderation endpoint — there's one
 * real "flagged content" concept server-side, presented two ways in the UI.
 * ---------------------------------------------------------------------- */

const SEVERITY_MAP: Record<BackendSeverity, Severity | "info"> = {
  info: "info",
  medium: "medium",
  high: "high",
  critical: "critical",
};

function timeAgoLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `Flagged ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Flagged ${hours}h ago`;
  return `Flagged ${Math.floor(hours / 24)}d ago`;
}

function mapModerationCase(dto: ModerationCaseResponseDto): ModerationCase {
  return {
    id: dto.id,
    wishId: dto.wishId,
    status: dto.status === "resolved" ? "resolved" : "under-review",
    severity: SEVERITY_MAP[dto.severity],
    title: dto.title,
    flaggedAgo: timeAgoLabel(dto.createdAtUtc),
    description: dto.description ?? "",
    evidenceQuote: dto.evidenceQuote ?? "",
    contentType: dto.contentType ?? "Unknown",
    reviewer: dto.reviewerName ?? dto.assignedToName ?? "Unassigned",
    // No sender-account-status join available on this DTO — wishId is the
    // only real linked identifier we have without an extra lookup.
    sender: dto.wishId,
    // No "prior cases" count tracked server-side.
    priorCases: "—",
  };
}

let cachedModerationCases: ModerationCaseResponseDto[] | null = null;

async function fetchModerationCases(): Promise<ModerationCaseResponseDto[]> {
  const page = await apiRequest<PagedResult<ModerationCaseResponseDto>>("/api/moderation?pageIndex=0&pageSize=100");
  cachedModerationCases = page.items;
  return page.items;
}

export async function getModerationCase(): Promise<ModerationCase | null> {
  const cases = await fetchModerationCases();
  const underReview = cases.find((c) => c.status === "underReview") ?? cases[0];
  return underReview ? mapModerationCase(underReview) : null;
}

export async function decideModerationCase(decision: "approved" | "removed"): Promise<ModerationCase | null> {
  const cases = cachedModerationCases ?? (await fetchModerationCases());
  const target = cases.find((c) => c.status === "underReview") ?? cases[0];
  if (!target) return null;
  const dto = await apiRequest<ModerationCaseResponseDto>(`/api/moderation/${target.id}/decide`, {
    method: "POST",
    body: JSON.stringify({ decision, reason: decision === "approved" ? "Approved by admin" : "Removed by admin" }),
  });
  return mapModerationCase(dto);
}

function mapModerationSeverityToUrgency(severity: BackendSeverity): AttentionCase["urgency"] {
  if (severity === "critical" || severity === "high") return "now";
  if (severity === "medium") return "today";
  return "soon";
}

function mapModerationCaseToAttentionCase(dto: ModerationCaseResponseDto): AttentionCase {
  const owner = dto.assignedToName ?? dto.reviewerName ?? "Unassigned";
  const urgency = mapModerationSeverityToUrgency(dto.severity);
  return {
    id: dto.id,
    urgency,
    urgencyLabel: `${urgency.toUpperCase()} · ${dto.severity.toUpperCase()}`,
    title: dto.title,
    description: dto.description ?? dto.evidenceQuote ?? "",
    actionLabel: "Review",
    detail: {
      label: `QUICK RESOLUTION · CASE ${dto.id}`,
      title: dto.title,
      description: dto.description ?? "",
      facts: [
        { label: "WISH", value: dto.wishId },
        { label: "SEVERITY", value: dto.severity.toUpperCase() },
        { label: "CONTENT TYPE", value: dto.contentType ?? "Unknown" },
        { label: "OWNER", value: owner },
      ],
      // No real "impact of your action" copy exists server-side for a
      // moderation case — a neutral, mechanical note instead of invented
      // narrative text.
      impactNote: "Reviewing this case records your decision and reason in the case history.",
      owner,
    },
  };
}

export interface AttentionCaseFilters {
  /** "Now" bucket maps to these two backend severities. */
  severity?: BackendSeverity[];
  assignedAdminUserId?: string;
  search?: string;
}

export async function listAttentionCases(
  pageIndex = 0,
  pageSize = DEFAULT_PAGE_SIZE,
  filters: AttentionCaseFilters = {},
): Promise<Paginated<AttentionCase>> {
  // Filters server-side rather than reusing fetchModerationCases' page-0-of-100 cache —
  // that cache exists for "find any one under-review case" (getModerationCase), which
  // isn't the same thing as a real, page-able queue of them.
  const query = buildQuery({
    pageIndex,
    pageSize,
    status: "UnderReview",
    severity: filters.severity,
    assignedAdminUserId: filters.assignedAdminUserId,
    search: filters.search,
  });
  const page = await apiRequest<PagedResult<ModerationCaseResponseDto>>(`/api/moderation${query}`);
  return toPaginated(page, mapModerationCaseToAttentionCase);
}

/** Assigns the moderation case to the calling admin (self-assign — the backend
 * derives "me" from the auth token, matching the decide endpoint's pattern). */
export async function assignAttentionCase(id: string): Promise<AttentionCase | null> {
  const dto = await apiRequest<ModerationCaseResponseDto>(`/api/moderation/${id}/assign`, {
    method: "POST",
  });
  if (cachedModerationCases) {
    cachedModerationCases = cachedModerationCases.map((c) => (c.id === id ? dto : c));
  }
  return mapModerationCaseToAttentionCase(dto);
}

/* -------------------------------------------------------------------------
 * Delivery health
 * ---------------------------------------------------------------------- */

export async function listDeliveryStats(): Promise<DeliveryStat[]> {
  const dto = await apiRequest<DeliveryHealthDto>("/api/delivery-health");
  return [
    { label: "DUE (SEALED)", value: String(dto.due), note: `${dto.due} wishes` },
    { label: "DELIVERED", value: String(dto.delivered), note: `${dto.delivered} wishes` },
    { label: "OPENED", value: String(dto.opened), note: `${dto.opened} wishes` },
    { label: "DRAFT", value: String(dto.draft), note: `${dto.draft} wishes` },
  ];
}

const DELIVERY_ATTEMPT_STATUS: DeliveryAttemptStatus = "QUEUED";

export async function listDeliveryAttempts(
  pageIndex = 0,
  pageSize = DEFAULT_PAGE_SIZE,
  search?: string,
): Promise<Paginated<DeliveryAttempt>> {
  // There's no per-attempt entity server-side. The best real proxy is the
  // set of wishes that are sealed (i.e. "due"/stuck awaiting delivery),
  // shown here as synthetic QUEUED rows rather than invented failure detail.
  const query = buildQuery({ pageIndex, pageSize, status: "Sealed", search });
  const page = await apiRequest<PagedResult<AdminWishResponseDto>>(`/api/wishes${query}`);
  return toPaginated(page, (dto) => ({
    id: dto.id,
    wishId: dto.id,
    status: DELIVERY_ATTEMPT_STATUS,
    detail: `${dto.channel} · sealed ${dto.sealedAtUtc ? formatDateLabel(dto.sealedAtUtc) : "—"}`,
    actionLabel: "Retry delivery",
  }));
}

export async function retryDeliveryAttempt(id: string): Promise<DeliveryAttempt | null> {
  // id is treated as the wishId — there's no separate attempt-id concept.
  const updated = await retryWishDelivery(id);
  if (!updated) return null;
  return {
    id: updated.id,
    wishId: updated.id,
    status: DELIVERY_ATTEMPT_STATUS,
    detail: `${updated.channel} · retry queued`,
    actionLabel: "Retry delivery",
  };
}

/* -------------------------------------------------------------------------
 * Customers
 *
 * No GET /api/customers list endpoint exists — only get-by-id. We derive a
 * small directory by collecting distinct customerUserIds already visible
 * from the wishes list (dev dataset is small, so N+1 lookups are acceptable)
 * and resolving each via GET /api/customers/{id}.
 * ---------------------------------------------------------------------- */

function mapCustomerStatus(): AdminCustomer["status"] {
  // No status/flag concept exists on the backend customer DTO — ACTIVE is
  // the only honest default without fabricating moderation/payment state.
  return "ACTIVE";
}

function mapCustomer(dto: CustomerResponseDto): AdminCustomer {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    verified: true,
    status: mapCustomerStatus(),
    meta: `${dto.totalWishCount} wish${dto.totalWishCount === 1 ? "" : "es"}`,
    profile: {
      memberSince: formatDateLabel(dto.createdAtUtc),
      activeWishes: dto.totalWishCount,
      nextDelivery: "—",
      timezoneNote: dto.lastLoginAtUtc ? `Last login ${formatDateLabel(dto.lastLoginAtUtc)}` : "Never logged in",
      summary: `${dto.name} has ${dto.totalWishCount} wish${dto.totalWishCount === 1 ? "" : "es"} totalling ${formatCurrency(dto.totalAmountPaid)} paid.`,
      // No per-wish schedule detail available from this DTO alone without
      // extra requests we're not making here — left empty rather than
      // fabricated.
      scheduledWishes: [],
      paymentNote: `${formatCurrency(dto.totalAmountPaid)} paid in total across ${Object.entries(dto.wishCountByStatus)
        .map(([status, count]) => `${count} ${status}`)
        .join(", ")}.`,
      careNotes: [],
    },
  };
}

export async function listCustomers(): Promise<AdminCustomer[]> {
  // Gap: there is no backend list endpoint for customers. We reconstruct a
  // best-effort directory from customerUserIds seen in the wishes list, then
  // resolve each via GET /api/customers/{id}. If that also fails, this
  // returns an empty array rather than fabricated rows.
  let wishPage: PagedResult<AdminWishResponseDto>;
  try {
    wishPage = await apiRequest<PagedResult<AdminWishResponseDto>>("/api/wishes?pageIndex=0&pageSize=100");
  } catch {
    return [];
  }

  const customerIds = Array.from(new Set(wishPage.items.map((w) => w.customerUserId)));
  const customers = await Promise.all(
    customerIds.map(async (id) => {
      try {
        const dto = await apiRequest<CustomerResponseDto>(`/api/customers/${id}`);
        return mapCustomer(dto);
      } catch (err) {
        if (err instanceof ApiError && err.code === 404) return null;
        throw err;
      }
    }),
  );
  return customers.filter((c): c is AdminCustomer => c !== null);
}

/* -------------------------------------------------------------------------
 * Team members — backed by real AdminUser rows. There's no separate pending-
 * invitation entity: an invited account is created immediately with a
 * generated temporary password (emailed to them), and shows as "INVITED"
 * until its first real sign-in (LastLoginAtUtc is still null).
 * ---------------------------------------------------------------------- */

interface TeamMemberResponseDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLoginAtUtc: string | null;
  createdAtUtc: string;
}

function mapTeamMember(dto: TeamMemberResponseDto): TeamMember {
  const status: TeamMember["status"] = !dto.isActive ? "OFFBOARDING" : dto.lastLoginAtUtc ? "ACTIVE" : "INVITED";
  const actionLabel = status === "ACTIVE" ? "Deactivate" : status === "INVITED" ? "Resend invite" : "Reactivate";

  return {
    id: dto.id,
    name: dto.fullName,
    email: dto.email,
    role: dto.role,
    status,
    lastActive: dto.lastLoginAtUtc ? formatDateLabel(dto.lastLoginAtUtc) : "Never signed in",
    actionLabel,
  };
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const dtos = await apiRequest<TeamMemberResponseDto[]>("/api/admin-users");
  return dtos.map(mapTeamMember);
}

export async function inviteTeamMember(input: { email: string; fullName: string; role: string }): Promise<TeamMember> {
  const dto = await apiRequest<TeamMemberResponseDto>("/api/admin-users", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return mapTeamMember(dto);
}

export async function resendTeamMemberInvite(id: string): Promise<TeamMember> {
  const dto = await apiRequest<TeamMemberResponseDto>(`/api/admin-users/${id}/resend-invite`, { method: "POST" });
  return mapTeamMember(dto);
}

export async function deactivateTeamMember(id: string): Promise<TeamMember> {
  const dto = await apiRequest<TeamMemberResponseDto>(`/api/admin-users/${id}/deactivate`, { method: "POST" });
  return mapTeamMember(dto);
}

export async function reactivateTeamMember(id: string): Promise<TeamMember> {
  const dto = await apiRequest<TeamMemberResponseDto>(`/api/admin-users/${id}/reactivate`, { method: "POST" });
  return mapTeamMember(dto);
}

/* -------------------------------------------------------------------------
 * Audit log — backed by real AdminAuditEvent rows, written by the other
 * admin services whenever they complete an accountable action.
 * ---------------------------------------------------------------------- */

interface AuditEventResponseDto {
  id: string;
  adminName: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  summary: string;
  tag: "general" | "contentAccess" | "sensitiveAccess" | "criticalAccess" | "sensitiveExport" | "security";
  createdAtUtc: string;
}

const AUDIT_TAG_MAP: Record<AuditEventResponseDto["tag"], AuditEvent["tag"]> = {
  general: null,
  contentAccess: "CONTENT_ACCESS",
  sensitiveAccess: "SENSITIVE_ACCESS",
  criticalAccess: "CRITICAL_ACCESS",
  sensitiveExport: "SENSITIVE_EXPORT",
  security: "SECURITY",
};

function mapAuditEvent(dto: AuditEventResponseDto): AuditEvent {
  const created = new Date(dto.createdAtUtc);
  return {
    id: dto.id,
    timeLabel: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(created),
    dayLabel: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(created),
    actor: dto.adminName,
    message: dto.summary,
    tag: AUDIT_TAG_MAP[dto.tag],
    resourceType: dto.resourceType,
    resourceId: dto.resourceId,
  };
}

export interface AuditLogFilters {
  /** "My actions" — filters to events performed by this admin, matched by ID rather than
   * a display-name text search. */
  adminUserId?: string;
  /** "Content access" chip — CONTENT_ACCESS and SENSITIVE_ACCESS together. */
  tags?: AuditEventResponseDto["tag"][];
  search?: string;
}

export async function listAuditEvents(
  pageIndex = 0,
  pageSize = DEFAULT_PAGE_SIZE,
  filters: AuditLogFilters = {},
): Promise<Paginated<AuditEvent>> {
  const query = buildQuery({
    pageIndex,
    pageSize,
    adminUserId: filters.adminUserId,
    tags: filters.tags,
    search: filters.search,
  });
  const page = await apiRequest<PagedResult<AuditEventResponseDto>>(`/api/audit-log${query}`);
  return toPaginated(page, mapAuditEvent);
}
