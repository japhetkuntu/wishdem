import { apiRequest, ApiError, clearTokens, hasSession, setTokens } from "@/lib/httpClient";
import type {
  Attachment,
  AttachmentKind,
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
  OrganizerGroupWishInvitation,
  MemoryFormat,
  Person,
  Recipient,
  Theme,
  ThemeId,
  User,
  Wish,
} from "@/types";

/**
 * Real network integration for WishDem.Customer.Api. Every export here talks
 * to the backend via `apiRequest` (see lib/httpClient.ts) — components and
 * hooks should only ever import from this module, never call fetch directly.
 */

const AUTH_METHOD_KEY = "wishdem-customer-auth-method";

function rememberAuthMethod(method: "google" | "email") {
  try {
    sessionStorage.setItem(AUTH_METHOD_KEY, method);
  } catch {
    // Non-fatal — auth method display just won't survive a reload.
  }
}

function recallAuthMethod(): "google" | "email" {
  try {
    const stored = sessionStorage.getItem(AUTH_METHOD_KEY);
    if (stored === "google" || stored === "email") return stored;
  } catch {
    // Ignore — fall through to default.
  }
  return "email";
}

/* -------------------------------------------------------------------------- */
/* Themes — purely local presentation data. There is no backend endpoint for  */
/* themes; wishes just store a themeId string. Kept as static content here.   */
/* -------------------------------------------------------------------------- */

const THEMES: Theme[] = [
  {
    id: "velvet-night",
    name: "Velvet Night",
    description:
      "A deep-plum envelope, warm porcelain paper, and one quiet champagne seal. Intimate, considered, and made to open slowly.",
    swatch: "bg-mulberry text-paper",
  },
  {
    id: "garden-letter",
    name: "Garden Letter",
    description:
      "Moss paper and a pressed edge — an unhurried, earthy note that feels handwritten in a garden.",
    swatch: "bg-moss text-paper",
  },
  {
    id: "sunday-morning",
    name: "Sunday Morning",
    description:
      "Rose stock with soft gold detailing — a gentle, easy morning-light feeling.",
    swatch: "bg-rose text-ink",
  },
  {
    id: "afterglow",
    name: "Afterglow",
    description:
      "Ink lacquer and a porcelain note inside — moody on the outside, warm the moment it opens.",
    swatch: "bg-ink text-paper",
  },
];

export async function listThemes(): Promise<Theme[]> {
  return [...THEMES];
}

/* -------------------------------------------------------------------------- */
/* Wishes                                                                     */
/* -------------------------------------------------------------------------- */

/** Backend uses capital-A "whatsApp"; the frontend uses lowercase "whatsapp". */
function channelToBackend(channel: DeliveryChannel): "whatsApp" | "sms" | "link" {
  return channel === "whatsapp" ? "whatsApp" : channel;
}

function channelFromBackend(channel: "whatsApp" | "sms" | "link"): DeliveryChannel {
  return channel === "whatsApp" ? "whatsapp" : channel;
}

/** "HH:mm" (frontend) <-> "HH:mm:ss" (backend). */
function deliveryTimeToBackend(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

function deliveryTimeFromBackend(time: string): string {
  return time.slice(0, 5);
}

interface WishResponse {
  id: string;
  fromName: string;
  recipientName: string;
  recipientRelationship: string;
  recipientBirthday: string;
  deliveryTime: string;
  recipientTimezone: string;
  recipientPhoneNumber: string | null;
  message: string;
  attachmentKind: AttachmentKind | null;
  attachmentUrl: string | null;
  attachmentDurationSeconds: number | null;
  themeId: string | null;
  channel: "whatsApp" | "sms" | "link" | null;
  status: "draft" | "sealed" | "delivered" | "opened";
  priceLabel: string;
  sealedAtUtc: string | null;
  deliveredAtUtc: string | null;
  openedAtUtc: string | null;
  createdAtUtc: string;
}

interface WishListResponse {
  items: WishResponse[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

function wishFromResponse(res: WishResponse): Wish {
  const attachment: Attachment | null = res.attachmentKind
    ? {
        kind: res.attachmentKind,
        url: res.attachmentUrl ?? undefined,
        durationSeconds: res.attachmentDurationSeconds ?? undefined,
      }
    : null;

  return {
    id: res.id,
    recipient: {
      name: res.recipientName,
      relationship: res.recipientRelationship as Recipient["relationship"],
      birthdayISO: res.recipientBirthday,
      deliveryTime: deliveryTimeFromBackend(res.deliveryTime),
      timezone: res.recipientTimezone,
      phoneNumber: res.recipientPhoneNumber ?? undefined,
    },
    message: res.message,
    attachment,
    themeId: (res.themeId as ThemeId) ?? null,
    channel: res.channel ? channelFromBackend(res.channel) : null,
    status: res.status,
    fromName: res.fromName,
    priceLabel: res.priceLabel,
    createdAt: res.createdAtUtc,
    sealedAt: res.sealedAtUtc ?? undefined,
    openedAt: res.openedAtUtc ?? undefined,
  };
}

interface SaveWishRequestBody {
  fromName: string;
  recipientName: string;
  recipientRelationship: string;
  recipientBirthday: string;
  deliveryTime: string;
  recipientTimezone: string;
  recipientPhoneNumber: string | null;
  message: string;
  attachmentKind: AttachmentKind | null;
  attachmentUrl: string | null;
  attachmentDurationSeconds: number | null;
  themeId: string | null;
  channel: "whatsApp" | "sms" | "link" | null;
}

function saveWishBodyFromWish(wish: Wish): SaveWishRequestBody {
  return {
    fromName: wish.fromName,
    recipientName: wish.recipient.name,
    recipientRelationship: wish.recipient.relationship,
    recipientBirthday: wish.recipient.birthdayISO,
    deliveryTime: deliveryTimeToBackend(wish.recipient.deliveryTime),
    recipientTimezone: wish.recipient.timezone,
    recipientPhoneNumber: wish.recipient.phoneNumber ?? null,
    message: wish.message,
    attachmentKind: wish.attachment?.kind ?? null,
    attachmentUrl: wish.attachment?.url ?? null,
    attachmentDurationSeconds: wish.attachment?.durationSeconds ?? null,
    themeId: wish.themeId,
    channel: wish.channel ? channelToBackend(wish.channel) : null,
  };
}

export async function listWishes(): Promise<Wish[]> {
  const res = await apiRequest<WishListResponse>("/api/wishes?pageIndex=0&pageSize=100");
  return res.items.map(wishFromResponse);
}

export interface DailyWishLimit {
  used: number;
  max: number;
  remaining: number;
}

interface DailyWishLimitResponse {
  used: number;
  max: number;
  remaining: number;
  resetsAtUtc: string;
}

/** New wishes only — editing/sealing an existing draft doesn't count against this. */
export async function getDailyWishLimit(): Promise<DailyWishLimit> {
  const res = await apiRequest<DailyWishLimitResponse>("/api/wishes/daily-limit");
  return { used: res.used, max: res.max, remaining: res.remaining };
}

export async function getWish(id: string): Promise<Wish | null> {
  try {
    const res = await apiRequest<WishResponse>(`/api/wishes/${id}`);
    return wishFromResponse(res);
  } catch (err) {
    if (err instanceof ApiError && err.code === 404) return null;
    throw err;
  }
}

/** Recipient-facing lookup — no auth, 404s unless the wish is no longer Draft. */
export async function getPublicWish(id: string): Promise<Wish | null> {
  try {
    const res = await apiRequest<WishResponse>(`/api/wishes/public/${id}`, { skipAuth: true });
    return wishFromResponse(res);
  } catch (err) {
    if (err instanceof ApiError && err.code === 404) return null;
    throw err;
  }
}

export interface DraftInput {
  id?: string;
  recipient: Recipient;
  fromName?: string;
}

export async function saveWhoStep(input: DraftInput): Promise<Wish> {
  const fromName = input.fromName ?? "You";

  if (input.id) {
    const existing = await getWish(input.id);
    if (existing) {
      const updated: Wish = { ...existing, recipient: input.recipient };
      const res = await apiRequest<WishResponse>(`/api/wishes/${input.id}`, {
        method: "PUT",
        body: JSON.stringify(saveWishBodyFromWish(updated)),
      });
      return wishFromResponse(res);
    }
  }

  const draft: Wish = {
    id: input.id ?? "",
    recipient: input.recipient,
    message: "",
    attachment: null,
    themeId: null,
    channel: null,
    status: "draft",
    fromName,
    priceLabel: "GH₵1.49",
    createdAt: new Date().toISOString(),
  };
  const res = await apiRequest<WishResponse>("/api/wishes", {
    method: "POST",
    body: JSON.stringify(saveWishBodyFromWish(draft)),
  });
  return wishFromResponse(res);
}

/**
 * Lets a signed-out visitor start the create wizard without hitting a 401 on
 * the first save: the recipient details go into the cache under a fresh id
 * (or an existing one, if they're revising before signing in) instead of
 * Postgres. Nothing becomes a real wish, and nothing counts against the
 * daily cap, until claimGuestDraft runs right after login/registration.
 */
export async function saveGuestWhoDraft(draftId: string | null, recipient: Recipient, fromName = "You"): Promise<string> {
  const body = saveWishBodyFromWish({
    id: "",
    recipient,
    message: "",
    attachment: null,
    themeId: null,
    channel: null,
    status: "draft",
    fromName,
    priceLabel: "",
    createdAt: new Date().toISOString(),
  });

  const res = draftId
    ? await apiRequest<{ draftId: string }>(`/api/wishes/drafts/${draftId}`, {
        method: "PUT",
        body: JSON.stringify(body),
        skipAuth: true,
      })
    : await apiRequest<{ draftId: string }>("/api/wishes/drafts", {
        method: "POST",
        body: JSON.stringify(body),
        skipAuth: true,
      });
  return res.draftId;
}

/** Exchanges a stashed guest draft for a real wish belonging to the now-signed-in
 * customer — called immediately after login/registration completes so the wizard
 * can pick up exactly where the visitor left off. */
export async function claimGuestDraft(draftId: string): Promise<Wish> {
  const res = await apiRequest<WishResponse>(`/api/wishes/drafts/${draftId}/claim`, {
    method: "POST",
  });
  return wishFromResponse(res);
}

/**
 * Recovers/creates the wish record server-side when the wizard still holds a
 * wishId or recipient the frontend hasn't confirmed exists yet — mirrors the
 * old mock's `ensureWish` recovery behavior, but against the real API.
 */
async function ensureWish(id: string, recipient: Recipient | null | undefined): Promise<Wish> {
  const existing = await getWish(id);
  if (existing) return existing;
  if (!recipient) throw new Error(`Wish ${id} not found`);
  return saveWhoStep({ recipient });
}

async function putFullWish(wish: Wish): Promise<Wish> {
  const res = await apiRequest<WishResponse>(`/api/wishes/${wish.id}`, {
    method: "PUT",
    body: JSON.stringify(saveWishBodyFromWish(wish)),
  });
  return wishFromResponse(res);
}

interface AttachmentUploadResponse {
  url: string;
  kind: AttachmentKind;
  durationSeconds: number | null;
}

/** Uploads a wish attachment (image/video/voice) to object storage — DigitalOcean
 * Spaces in production, MinIO locally — returning the public URL to persist on the
 * wish. GIFs are library references and never go through this. */
export async function uploadAttachment(wishId: string, file: File | Blob, fileName: string): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file, fileName);
  const res = await apiRequest<AttachmentUploadResponse>(`/api/wishes/${wishId}/upload-attachment`, {
    method: "POST",
    body: formData,
  });
  return { kind: res.kind, url: res.url, durationSeconds: res.durationSeconds ?? undefined };
}

export async function saveMessageStep(
  id: string,
  message: string,
  attachment: Attachment | null,
  recipient?: Recipient,
): Promise<Wish> {
  const wish = await ensureWish(id, recipient);
  return putFullWish({ ...wish, message, attachment });
}

export async function saveThemeStep(
  id: string,
  themeId: ThemeId,
  recipient?: Recipient,
): Promise<Wish> {
  const wish = await ensureWish(id, recipient);
  return putFullWish({ ...wish, themeId });
}

export async function saveDeliverStep(
  id: string,
  channel: DeliveryChannel,
  recipient?: Recipient,
  phoneNumber?: string,
): Promise<Wish> {
  const wish = await ensureWish(id, recipient);
  return putFullWish({
    ...wish,
    channel,
    recipient: phoneNumber ? { ...wish.recipient, phoneNumber } : wish.recipient,
  });
}

/** Wishes are free — this just seals the wish so it's locked in for delivery. */
export async function sealWish(wishId: string): Promise<Wish> {
  const res = await apiRequest<WishResponse>(`/api/wishes/${wishId}/seal`, {
    method: "POST",
    body: JSON.stringify({ promoCode: null }),
  });
  return wishFromResponse(res);
}

export async function markOpened(id: string): Promise<Wish> {
  const res = await apiRequest<WishResponse>(`/api/wishes/public/${id}/mark-opened`, {
    method: "POST",
    skipAuth: true,
  });
  return wishFromResponse(res);
}

/* -------------------------------------------------------------------------- */
/* Auth / profile                                                            */
/* -------------------------------------------------------------------------- */

interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  user: { id: string; email: string; name: string };
}

interface ProfileResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  country: string | null;
  region: string | null;
}

function userFromProfile(res: ProfileResponse): User {
  const [firstName, ...rest] = res.name.trim().split(/\s+/);
  return {
    id: res.id,
    name: res.name,
    email: res.email,
    authMethod: recallAuthMethod(),
    firstName: firstName || res.name,
    lastName: rest.length ? rest.join(" ") : undefined,
    avatarUrl: res.avatarUrl ?? undefined,
    dateOfBirth: res.dateOfBirth ?? undefined,
    country: res.country ?? undefined,
    region: res.region ?? undefined,
  };
}

export async function getCurrentUser(): Promise<User | null> {
  if (!hasSession()) return null;
  try {
    const profile = await apiRequest<ProfileResponse>("/api/profile");
    return userFromProfile(profile);
  } catch (err) {
    if (err instanceof ApiError && err.code === 401) {
      clearTokens();
      return null;
    }
    throw err;
  }
}

export async function signOut(): Promise<void> {
  const refreshToken = (() => {
    try {
      return sessionStorage.getItem("wishdem-customer-refresh-token");
    } catch {
      return null;
    }
  })();
  if (refreshToken) {
    try {
      await apiRequest("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        skipAuth: true,
      });
    } catch {
      // Best-effort — sign-out proceeds locally regardless.
    }
  }
  clearTokens();
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
  const name = [input.firstName, input.lastName].filter(Boolean).join(" ").trim() || input.firstName;
  const res = await apiRequest<ProfileResponse>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify({
      name,
      avatarUrl: input.avatarUrl ?? undefined,
      dateOfBirth: input.dateOfBirth,
      country: input.country,
      region: input.region,
    }),
  });
  return userFromProfile(res);
}

/**
 * There is no real Google OAuth client wired into this frontend (no
 * @react-oauth/google, no client ID configured), and the backend itself
 * returns 501 when GoogleAuth:ClientId is unset (the case in dev). Fail fast
 * client-side rather than making a network call that can't succeed.
 */
export async function signInWithGoogle(): Promise<User> {
  throw new Error("Google sign-in isn't configured yet — continue with email instead.");
}

/** Old pre-OTP mock entry point. The real flow is requestOtp + verifyOtp. */
export async function signInWithEmail(_email: string): Promise<User> {
  throw new Error("signInWithEmail is no longer supported — use requestOtp/verifyOtp instead.");
}

export interface OtpRequestResult {
  isNewCustomer: boolean;
  maskedEmail: string;
  expiresInSeconds: number;
  /** Non-null outside Production only — there's no real email provider wired up locally. */
  devCode?: string | null;
}

export async function requestOtp(email: string): Promise<OtpRequestResult> {
  const res = await apiRequest<{
    isNewCustomer: boolean;
    maskedEmail: string;
    expiresInSeconds: number;
    devCode: string | null;
  }>("/api/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipAuth: true,
  });
  if (res.devCode) {
    // eslint-disable-next-line no-console
    console.info(`[dev] OTP code for ${email}: ${res.devCode}`);
  }
  return res;
}

export async function verifyOtp(email: string, code: string, name?: string): Promise<User> {
  const res = await apiRequest<AuthTokenResponse>("/api/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, code, name }),
    skipAuth: true,
  });
  setTokens(res.accessToken, res.refreshToken);
  rememberAuthMethod("email");
  const profile = await apiRequest<ProfileResponse>("/api/profile");
  return userFromProfile(profile);
}

/* -------------------------------------------------------------------------- */
/* Calendar                                                                   */
/* -------------------------------------------------------------------------- */

interface CalendarEventResponse {
  sourceId: string;
  kind: "wishDelivery" | "birthday" | "groupWishDeadline";
  date: string;
  title: string;
  description: string;
}

/**
 * Adapter note: the backend exposes ONE flat event list
 * (`GET /api/calendar`), not a "days" concept. We fetch once, cache the flat
 * list in this module-level variable, then derive `CalendarDay`s (one per
 * distinct date with events) and let `listEventsForDay` read from the cache
 * filtered by date instead of making a second network call.
 */
let calendarEventsCache: CalendarEventResponse[] | null = null;

async function fetchCalendarEvents(): Promise<CalendarEventResponse[]> {
  if (calendarEventsCache) return calendarEventsCache;
  const events = await apiRequest<CalendarEventResponse[]>("/api/calendar");
  calendarEventsCache = events;
  return events;
}

function eventToneForKind(kind: CalendarEventResponse["kind"]): CalendarEvent["dotTone"] {
  if (kind === "birthday") return "rose";
  if (kind === "groupWishDeadline") return "moss";
  return "accent";
}

function tagForKind(kind: CalendarEventResponse["kind"]): { label: string; tone: CalendarEvent["tagTone"] } {
  if (kind === "birthday") return { label: "Birthday", tone: "accent" };
  if (kind === "groupWishDeadline") return { label: "Group wish closes", tone: "attention" };
  return { label: "Wish delivery", tone: "good" };
}

export async function listCalendarDays(): Promise<CalendarDay[]> {
  const events = await fetchCalendarEvents();
  const byDate = new Map<string, CalendarEventResponse[]>();
  for (const event of events) {
    const list = byDate.get(event.date) ?? [];
    list.push(event);
    byDate.set(event.date, list);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayEvents]) => {
      const [y, m, d] = date.split("-").map(Number);
      const weekdayLabel = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(
        new Date(y, m - 1, d),
      );
      const summary =
        dayEvents.length === 1
          ? dayEvents[0].title
          : `${dayEvents.length} moments — ${dayEvents[0].title}`;
      const tones = [...new Set(dayEvents.map((e) => eventToneForKind(e.kind)))];
      return { id: date, weekdayLabel, summary, tones, count: dayEvents.length };
    });
}

/** Reads from the module-level cache populated by listCalendarDays/fetchCalendarEvents. */
export async function listEventsForDay(dayId: string): Promise<CalendarEvent[]> {
  const events = await fetchCalendarEvents();
  return events
    .filter((e) => e.date === dayId)
    .map((e) => {
      const tag = tagForKind(e.kind);
      return {
        id: e.sourceId,
        timeLines: [e.date],
        title: e.title,
        description: e.description,
        dotTone: eventToneForKind(e.kind),
        tagLabel: tag.label,
        tagTone: tag.tone,
        group: "this-week",
      };
    });
}

/* -------------------------------------------------------------------------- */
/* Group wishes                                                               */
/* -------------------------------------------------------------------------- */

interface GroupWishResponse {
  id: string;
  title: string;
  recipientName: string;
  occasion: string | null;
  deliveryDate: string | null;
  collectByDate: string | null;
  context: string | null;
  organizerNote: string | null;
  formats: string[];
  namesVisible: boolean;
  status: "collecting" | "sealed" | "delivered";
  sealedAtUtc: string | null;
  deliveredAtUtc: string | null;
  createdAtUtc: string;
  invitedCount: number;
  joinedCount: number;
  declinedCount: number;
  memoriesCount: number;
}

/** Backend uses singular "photo"; the frontend uses plural "photos". */
function formatFromBackend(format: string): GroupWishFormat {
  return format === "photo" ? "photos" : (format as GroupWishFormat);
}

function formatToBackend(format: GroupWishFormat): string {
  return format === "photos" ? "photo" : format;
}

function dateLabel(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

function groupWishFromResponse(res: GroupWishResponse): GroupWish {
  return {
    id: res.id,
    title: res.title,
    recipientName: res.recipientName,
    occasion: res.occasion ?? "",
    deliveryDateLabel: dateLabel(res.deliveryDate),
    collectByLabel: dateLabel(res.collectByDate),
    context: res.context ?? undefined,
    formats: res.formats.map(formatFromBackend),
    namesVisible: res.namesVisible,
    joinedCount: res.joinedCount,
    invitedCount: res.invitedCount,
    viewedCount: 0,
    declinedCount: res.declinedCount,
    memoriesCount: res.memoriesCount,
    activity: [],
    createdAt: res.createdAtUtc,
  };
}

export async function listGroupWishes(): Promise<GroupWish[]> {
  const res = await apiRequest<GroupWishResponse[]>("/api/group-wishes");
  return res.map(groupWishFromResponse);
}

export async function getGroupWish(id: string): Promise<GroupWish | null> {
  try {
    const res = await apiRequest<GroupWishResponse>(`/api/group-wishes/${id}`);
    return groupWishFromResponse(res);
  } catch (err) {
    if (err instanceof ApiError && err.code === 404) return null;
    throw err;
  }
}

/**
 * There is no backend concept of "invitations the logged-in user received" —
 * group-wish guests are token-based and never tied to a CustomerUser account
 * in this system's design. Kept as an export (pages still import it) but
 * always empty.
 */
export async function listGroupWishInvitations(): Promise<GroupWishInvitation[]> {
  return [];
}

export async function getGroupWishInvitation(_id: string): Promise<GroupWishInvitation | null> {
  return null;
}

export interface CreateGroupWishInput {
  title: string;
  recipientName: string;
  occasion: string;
  deliveryDateLabel: string;
  collectByLabel: string;
  /** Raw ISO dates threaded through from GroupWishSetupPage's <input type="date"> fields. */
  deliveryDateISO?: string;
  collectByISO?: string;
  context?: string;
  formats: GroupWishFormat[];
  namesVisible: boolean;
}

export async function createGroupWish(input: CreateGroupWishInput): Promise<GroupWish> {
  const res = await apiRequest<GroupWishResponse>("/api/group-wishes", {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      recipientName: input.recipientName,
      occasion: input.occasion || undefined,
      deliveryDate: input.deliveryDateISO || undefined,
      collectByDate: input.collectByISO || undefined,
      context: input.context,
      formats: input.formats.map(formatToBackend),
      namesVisible: input.namesVisible,
    }),
  });
  return groupWishFromResponse(res);
}

interface GroupWishInvitationApiResponse {
  id: string;
  inviteToken: string;
  guestName: string;
  guestEmail: string | null;
  status: "invited" | "joined" | "declined" | "notNow";
  respondedAtUtc: string | null;
  createdAtUtc: string;
}

function organizerInvitationFromResponse(res: GroupWishInvitationApiResponse): OrganizerGroupWishInvitation {
  return {
    id: res.id,
    inviteToken: res.inviteToken,
    guestName: res.guestName,
    guestEmail: res.guestEmail ?? undefined,
    status: res.status === "notNow" ? "not-now" : res.status,
    respondedAt: res.respondedAtUtc ?? undefined,
    createdAt: res.createdAtUtc,
  };
}

/** Invites a guest to contribute to one of the current user's own group wishes. */
export async function inviteGuestToGroupWish(
  groupWishId: string,
  input: { guestName: string; guestEmail?: string },
): Promise<OrganizerGroupWishInvitation> {
  const res = await apiRequest<GroupWishInvitationApiResponse>(
    `/api/group-wishes/${groupWishId}/invitations`,
    {
      method: "POST",
      body: JSON.stringify({ guestName: input.guestName, guestEmail: input.guestEmail || undefined }),
    },
  );
  return organizerInvitationFromResponse(res);
}

/** Lists the guest invitations the organizer has sent for one of their own group wishes. */
export async function listGroupWishOrganizerInvitations(
  groupWishId: string,
): Promise<OrganizerGroupWishInvitation[]> {
  const res = await apiRequest<GroupWishInvitationApiResponse[]>(
    `/api/group-wishes/${groupWishId}/invitations`,
  );
  return res.map(organizerInvitationFromResponse);
}

/** Seals a group wish, closing it to new memories ahead of delivery. */
export async function sealGroupWish(groupWishId: string): Promise<GroupWish> {
  const res = await apiRequest<GroupWishResponse>(`/api/group-wishes/${groupWishId}/seal`, {
    method: "POST",
  });
  return groupWishFromResponse(res);
}

/** Deletes a group wish the current user organizes. */
export async function deleteGroupWish(groupWishId: string): Promise<void> {
  await apiRequest<void>(`/api/group-wishes/${groupWishId}`, { method: "DELETE" });
}

/**
 * Guests are token-based and never authenticated, so "responding to an
 * invitation" as the current logged-in user has no backend equivalent
 * either. Kept for signature compatibility with existing hooks/pages.
 */
export async function respondToGroupWishInvitation(
  _id: string,
  _status: "joined" | "declined" | "not-now",
): Promise<GroupWishInvitation> {
  throw new Error("Group wish invitations are guest/token-based — use the invite-token flow instead.");
}

/* -------------------------------------------------------------------------- */
/* Guest invitation / contribution flow (token-based, no auth)                */
/* -------------------------------------------------------------------------- */

interface InvitationContextResponse {
  inviteToken: string;
  title: string;
  inviterName: string;
  recipientName: string;
  occasion: string | null;
  deliveryDate: string | null;
  collectByDate: string | null;
  formats: string[];
  guestName: string;
  status: "invited" | "joined" | "declined" | "notNow";
  organizerNote: string | null;
}

/**
 * Resolves the public, no-account-needed guest contribution view keyed by
 * the invite token from the URL (the `id` route param on contribute/invite
 * pages is actually this opaque token, not a database id).
 */
export async function getContributionContext(token: string): Promise<ContributionContext | null> {
  try {
    const res = await apiRequest<InvitationContextResponse>(
      `/api/group-wishes/invitations/${token}`,
      { skipAuth: true },
    );
    return {
      id: res.inviteToken,
      title: res.title,
      inviterName: res.inviterName,
      recipientName: res.recipientName,
      deliveredLabel: `Delivers ${dateLabel(res.deliveryDate)}`,
      collectionClosesLabel: `Collect by ${dateLabel(res.collectByDate)}`,
      memoriesWaitingLabel: "",
      memoriesProgress: 0,
      daysLeftLabel: res.collectByDate ? `${daysUntilIso(res.collectByDate)} days left` : "",
      formats: res.formats.map(formatFromBackend),
    };
  } catch (err) {
    if (err instanceof ApiError && err.code === 404) return null;
    throw err;
  }
}

function daysUntilIso(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((target - today) / 86_400_000));
}

export async function getGroupWishInvitationContext(token: string) {
  return apiRequest<InvitationContextResponse>(`/api/group-wishes/invitations/${token}`, {
    skipAuth: true,
  });
}

export async function respondToInvitationToken(
  token: string,
  status: "joined" | "declined" | "notNow",
): Promise<InvitationContextResponse> {
  return apiRequest<InvitationContextResponse>(`/api/group-wishes/invitations/${token}/respond`, {
    method: "POST",
    body: JSON.stringify({ status }),
    skipAuth: true,
  });
}

interface GroupWishMemoryResponse {
  id: string;
  invitationId: string;
  format: MemoryFormat;
  title: string | null;
  body: string;
  whenWhere: string | null;
  attachmentUrl: string | null;
  attachmentDurationSeconds: number | null;
  isSealed: boolean;
  contributorLabel: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

function memoryFromResponse(res: GroupWishMemoryResponse): GroupWishMemory {
  const attachment: Attachment | null = res.attachmentUrl
    ? {
        kind: res.format === "photo" ? "image" : (res.format as AttachmentKind),
        url: res.attachmentUrl,
        durationSeconds: res.attachmentDurationSeconds ?? undefined,
      }
    : null;
  return {
    id: res.id,
    contributionId: res.invitationId,
    format: res.format,
    title: res.title ?? undefined,
    body: res.body,
    whenWhere: res.whenWhere ?? undefined,
    contributorLabel: res.contributorLabel,
    attachment,
    sealed: res.isSealed,
    createdAt: res.createdAtUtc,
    updatedAt: res.updatedAtUtc,
  };
}

/**
 * The guest memory draft isn't addressable by a stable id ahead of creation
 * on the backend the way the mock assumed — a guest's single in-progress
 * memory for an invitation is looked up via the invitation's memory list.
 * Since contributionId here is the invite token, we resolve the most recent
 * (first) memory for that token, if any.
 */
export async function getMemoryDraft(contributionId: string): Promise<GroupWishMemory | null> {
  try {
    const ctx = await getGroupWishInvitationContext(contributionId);
    void ctx;
  } catch (err) {
    if (err instanceof ApiError && err.code === 404) return null;
    throw err;
  }
  // No endpoint exposes a guest's own draft list without organizer auth, so a
  // brand-new draft is assumed until saveMemoryDraft creates one this session.
  return null;
}

export interface SaveMemoryDraftInput {
  format: MemoryFormat;
  title?: string;
  body: string;
  whenWhere?: string;
  contributorLabel: string;
  attachment?: Attachment | null;
}

/** Module-level cache of the memory id created per invite token this session, so repeat saves PUT instead of POSTing duplicates. */
const memoryIdByToken = new Map<string, string>();

export async function saveMemoryDraft(
  contributionId: string,
  input: SaveMemoryDraftInput,
): Promise<GroupWishMemory> {
  const body = {
    format: input.format,
    title: input.title,
    body: input.body,
    whenWhere: input.whenWhere,
    attachmentUrl: input.attachment?.url,
    attachmentDurationSeconds: input.attachment?.durationSeconds,
  };

  const existingId = memoryIdByToken.get(contributionId);
  if (existingId) {
    const res = await apiRequest<GroupWishMemoryResponse>(
      `/api/group-wishes/invitations/${contributionId}/memories/${existingId}`,
      { method: "PUT", body: JSON.stringify(body), skipAuth: true },
    );
    return memoryFromResponse(res);
  }

  const res = await apiRequest<GroupWishMemoryResponse>(
    `/api/group-wishes/invitations/${contributionId}/memories`,
    { method: "POST", body: JSON.stringify(body), skipAuth: true },
  );
  memoryIdByToken.set(contributionId, res.id);
  return memoryFromResponse(res);
}

export async function sealMemoryDraft(contributionId: string): Promise<GroupWishMemory> {
  const memoryId = memoryIdByToken.get(contributionId);
  if (!memoryId) throw new Error(`No memory draft for ${contributionId}`);
  const res = await apiRequest<GroupWishMemoryResponse>(
    `/api/group-wishes/invitations/${contributionId}/memories/${memoryId}/seal`,
    { method: "POST", skipAuth: true },
  );
  return memoryFromResponse(res);
}

/* -------------------------------------------------------------------------- */
/* Birthday Bloom                                                             */
/* -------------------------------------------------------------------------- */

interface BirthdayBloomResponse {
  groupWishId: string;
  recipientName: string;
  deliveryDate: string | null;
  organizerName: string;
  organizerNote: string | null;
  memories: GroupWishMemoryResponse[];
}

function bloomCardTypeFor(format: MemoryFormat): BloomWish["type"] {
  if (format === "photo") return "photo-note";
  if (format === "voice") return "voice";
  if (format === "video") return "video";
  return "note";
}

export async function getBirthdayBloom(id: string): Promise<BirthdayBloom | null> {
  try {
    const res = await apiRequest<BirthdayBloomResponse>(`/api/birthday-bloom/${id}`, {
      skipAuth: true,
    });
    return {
      id: res.groupWishId,
      recipientName: res.recipientName,
      deliveryDateLabel: dateLabel(res.deliveryDate),
      organizerName: res.organizerName,
      organizerNote: res.organizerNote ?? "",
      wishes: res.memories.map((m) => ({
        id: m.id,
        contributorName: m.contributorLabel,
        relationshipLabel: "",
        group: "friends",
        type: bloomCardTypeFor(m.format),
        quote: m.body || m.title || undefined,
        mediaDurationSeconds: m.attachmentDurationSeconds ?? undefined,
        opened: false,
        favorited: false,
      })),
    };
  } catch (err) {
    if (err instanceof ApiError && err.code === 404) return null;
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/* Circle                                                                     */
/* -------------------------------------------------------------------------- */

interface CirclePersonResponse {
  id: string;
  name: string;
  relationshipLabel: string;
  group: CircleGroup;
  birthday: string | null;
  timezone: string;
  note: string | null;
  createdAtUtc: string;
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

const CIRCLE_AVATAR_TONES: CirclePerson["avatarTone"][] = ["accent", "rose", "moss", "mulberry"];

function circlePersonFromResponse(res: CirclePersonResponse, index: number): CirclePerson {
  return {
    id: res.id,
    name: res.name,
    initials: initialsFrom(res.name),
    avatarTone: CIRCLE_AVATAR_TONES[index % CIRCLE_AVATAR_TONES.length],
    relationshipLabel: res.relationshipLabel,
    group: res.group,
    birthdayISO: res.birthday,
    timezone: res.timezone,
    note: res.note ?? undefined,
    stateLabel: res.birthday ? "No wish started" : "Needs a date",
    stateTone: "neutral",
    actionLabel: res.birthday ? "Begin a wish →" : "Add birthday →",
  };
}

export async function listCirclePeople(): Promise<CirclePerson[]> {
  const res = await apiRequest<CirclePersonResponse[]>("/api/circle");
  return res.map(circlePersonFromResponse);
}

/**
 * No backend concept of "invitations shared with me" exists for the Circle
 * page either — same reasoning as listGroupWishInvitations. Kept as an
 * export since CircleHub-style pages still import it.
 */
export async function listSharedInvitations(): Promise<GroupInvitation[]> {
  return [];
}

export async function getCircleStats(): Promise<CircleStats> {
  const people = await listCirclePeople();
  return { peopleCount: people.length, momentsCount: 0 };
}

export interface AddCirclePersonInput {
  name: string;
  birthdayISO: string | null;
  timezone: string;
  relationshipLabel: string;
  note?: string;
}

export async function addCirclePerson(input: AddCirclePersonInput): Promise<CirclePerson> {
  const group = groupFromRelationship(input.relationshipLabel);
  const res = await apiRequest<CirclePersonResponse>("/api/circle", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      relationshipLabel: input.relationshipLabel,
      group,
      birthday: input.birthdayISO,
      timezone: input.timezone,
      note: input.note,
    }),
  });
  return circlePersonFromResponse(res, 0);
}

/* -------------------------------------------------------------------------- */
/* People-adjacent derived views                                              */
/* -------------------------------------------------------------------------- */

/**
 * There's no backend concept this rich for a "Person" (nextMomentTitle,
 * conversationNote, etc). Derived here from real /api/circle data — only
 * honestly-computable fields are filled; `detail` is left undefined rather
 * than inventing personal narrative content.
 */
export async function listPeople(): Promise<Person[]> {
  const circlePeople = await listCirclePeople();
  return circlePeople.map((p) => {
    const daysAway = p.birthdayISO ? daysUntilIsoIgnoringYear(p.birthdayISO) : null;
    const filterTags: Person["filterTags"] = [];
    if (daysAway !== null && daysAway <= 30) filterTags.push("upcoming30");
    if (!p.birthdayISO) filterTags.push("needsAttention");

    return {
      id: p.id,
      name: p.name,
      initials: p.initials,
      avatarTone: p.avatarTone === "mulberry" ? "periwinkle" : p.avatarTone,
      role: p.relationshipLabel,
      nextMomentTitle: daysAway !== null ? `Birthday in ${daysAway} days` : "No birthday on file",
      nextMomentSubtitle: p.group,
      stateLabel: p.stateLabel,
      stateTagLabel: p.stateTone === "sealed" ? "Sealed" : "Open",
      stateTagTone: p.stateTone === "sealed" ? "good" : "accent",
      actionLabel: p.actionLabel,
      filterTags,
      detail: undefined,
    };
  });
}

function daysUntilIsoIgnoringYear(iso: string): number {
  const [, m, d] = iso.split("-").map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), m - 1, d);
  if (next < today) next = new Date(now.getFullYear() + 1, m - 1, d);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}
