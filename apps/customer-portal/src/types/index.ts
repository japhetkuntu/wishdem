export type Relationship =
  | "Best friend"
  | "Partner"
  | "Parent"
  | "Sibling"
  | "Colleague"
  | "Friend"
  | "Other";

export type DeliveryChannel = "sms" | "link";

/** Birthday/Anniversary recur every year automatically; every other occasion is a
 * one-time delivery on the exact date chosen. Values match the backend's camelCase
 * JsonStringEnumConverter output for OccasionType — keep them in sync. */
export type OccasionType =
  | "birthday"
  | "anniversary"
  | "congratulations"
  | "thankYou"
  | "justBecause"
  | "other";

export interface OccasionOption {
  value: OccasionType;
  label: string;
}

export const OCCASION_OPTIONS: OccasionOption[] = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "congratulations", label: "Congratulations" },
  { value: "thankYou", label: "Thank You" },
  { value: "justBecause", label: "Just Because" },
  { value: "other", label: "Something else" },
];

export type ThemeId =
  | "velvet-night"
  | "garden-letter"
  | "sunday-morning"
  | "afterglow";

export type AttachmentKind = "gif" | "image" | "video" | "voice";

export interface Attachment {
  kind: AttachmentKind;
  /** Object URL (image/video/voice) or a GIF library id (gif). */
  url?: string;
  durationSeconds?: number;
  /** Display label — used for GIF library tiles. */
  label?: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  swatch: string; // tailwind bg class for the theme chip
}

export type WishStatus = "draft" | "sealed" | "delivered" | "opened";

export interface Recipient {
  name: string;
  relationship: Relationship;
  occasion: OccasionType;
  /** Custom occasion name — only meaningful (and shown) when occasion is "other". */
  occasionLabel?: string;
  occasionDateISO: string; // yyyy-mm-dd
  deliveryTime: string; // HH:mm
  timezone: string;
  /** Required for sms delivery — the recipient never has a WishDem account,
   * so this is the only way to reach them for that channel. Not needed for "link". */
  phoneNumber?: string;
}

export interface Wish {
  id: string;
  recipient: Recipient;
  message: string;
  attachment: Attachment | null;
  themeId: ThemeId | null;
  channel: DeliveryChannel | null;
  status: WishStatus;
  fromName: string;
  priceLabel: string;
  createdAt: string;
  sealedAt?: string;
  openedAt?: string;
  /** True once the delivery worker has exhausted its retries without reaching the
   * recipient — usually a bad phone number. Retry it via retryWishDelivery(). */
  deliveryFailed: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  authMethod: "google" | "email";
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  country?: string;
  region?: string;
}

export interface CalendarDay {
  id: string;
  weekdayLabel: string;
  summary: string;
  /** Distinct dot colors for whatever's happening that day — lets the month grid show
   * up to a few colored dots under the date without a second network round-trip. */
  tones: EventTone[];
  count: number;
}

export type EventTone = "accent" | "rose" | "moss";
export type TagTone = "accent" | "attention" | "good";
export type PersonTagTone = "accent" | "good" | "alert";

export interface CalendarEvent {
  id: string;
  timeLines: string[];
  title: string;
  description: string;
  dotTone: EventTone;
  tagLabel: string;
  tagTone: TagTone;
  group: "needs-care" | "this-week";
}

export type PersonFilterTag = "upcoming30" | "availableWeek" | "needsAttention";

export interface PersonDetail {
  dateLabel: string;
  availabilityNote: string;
  ruleLabel: string;
  ruleNote: string;
  ruleProgress?: number;
  nextStepLabel: string;
  nextStepNote: string;
  conversationLabel: string;
  conversationNote: string;
}

export interface Person {
  id: string;
  name: string;
  initials: string;
  avatarTone: EventTone | "periwinkle";
  role: string;
  nextMomentTitle: string;
  nextMomentSubtitle: string;
  stateLabel: string;
  stateTagLabel: string;
  stateTagTone: PersonTagTone;
  actionLabel: string;
  filterTags: PersonFilterTag[];
  detail?: PersonDetail;
}

export type CircleGroup = "family" | "friends" | "work";
export type CircleAvatarTone = "accent" | "rose" | "moss" | "mulberry";
export type CircleStateTone = "neutral" | "wait" | "sealed";

export interface CirclePerson {
  id: string;
  name: string;
  initials: string;
  avatarTone: CircleAvatarTone;
  relationshipLabel: string;
  group: CircleGroup;
  /** null when the birthday hasn't been added yet. */
  birthdayISO: string | null;
  timezone: string;
  note?: string;
  stateLabel: string;
  stateTone: CircleStateTone;
  actionLabel: string;
  /** Links "View wish" to a real wish record when one exists. */
  wishId?: string;
  recentlyAdded?: boolean;
}

export interface GroupInvitation {
  id: string;
  faceInitials: string[];
  title: string;
  description: string;
  deadlineLabel: string;
  actionLabel: string;
}

export interface CircleStats {
  peopleCount: number;
  momentsCount: number;
}

export type GroupWishFormat = "notes" | "photos" | "voice" | "video";

export interface GroupWishActivityEvent {
  id: string;
  message: string;
}

/** A group wish the current user organizes. */
export interface GroupWish {
  id: string;
  title: string;
  recipientName: string;
  occasion: string;
  deliveryDateLabel: string;
  collectByLabel: string;
  context?: string;
  formats: GroupWishFormat[];
  namesVisible: boolean;
  joinedCount: number;
  invitedCount: number;
  viewedCount: number;
  declinedCount: number;
  memoriesCount: number;
  activity: GroupWishActivityEvent[];
  createdAt: string;
}

export type GroupWishInvitationStatus = "invited" | "joined" | "declined" | "not-now";

/** A guest invitation the organizer sent out for one of their own group wishes. */
export interface OrganizerGroupWishInvitation {
  id: string;
  inviteToken: string;
  guestName: string;
  guestEmail?: string;
  status: GroupWishInvitationStatus;
  respondedAt?: string;
  createdAt: string;
}
export type GroupWishUrgencyTone = "urgent" | "new" | null;
export type GroupWishAvatarTone = "mulberry" | "moss" | "rose";

/** An invitation the current user received to join someone else's group wish. */
export interface GroupWishInvitation {
  id: string;
  title: string;
  inviterName: string;
  avatarInitial: string;
  avatarTone: GroupWishAvatarTone;
  rowSummaryLabel: string;
  urgencyLabel: string | null;
  urgencyTone: GroupWishUrgencyTone;
  daysLeftLabel: string;
  collectionClosesLabel: string;
  deliveredLabel: string;
  alreadyJoinedLabel: string;
  participationLabel: string;
  organizerNote?: string;
  formats: GroupWishFormat[];
  status: GroupWishInvitationStatus;
  needNote?: string;
}

export type MemoryFormat = "notes" | "photo" | "voice" | "video";

/**
 * The public-facing shape a guest contributor sees, resolved from either a
 * GroupWish (its organizer's own record) or a GroupWishInvitation (another
 * account's received invite) — the guest link doesn't care which.
 */
export interface ContributionContext {
  id: string;
  title: string;
  inviterName: string;
  recipientName: string;
  deliveredLabel: string;
  collectionClosesLabel: string;
  memoriesWaitingLabel: string;
  memoriesProgress: number;
  daysLeftLabel: string;
  formats: GroupWishFormat[];
}

/** A guest's in-progress or sealed contribution to a group wish. */
export interface GroupWishMemory {
  id: string;
  contributionId: string;
  format: MemoryFormat;
  title?: string;
  body: string;
  whenWhere?: string;
  contributorLabel: string;
  attachment?: Attachment | null;
  sealed: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A single contribution inside a delivered recipient's Birthday Bloom. */
export type BloomCardType = "note" | "photo-note" | "voice" | "video" | "photo-memory";

export interface BloomWish {
  id: string;
  contributorName: string;
  relationshipLabel: string;
  group: "family" | "friends";
  type: BloomCardType;
  quote?: string;
  mediaDurationSeconds?: number;
  opened: boolean;
  favorited: boolean;
}

export interface BirthdayBloom {
  id: string;
  recipientName: string;
  deliveryDateLabel: string;
  organizerName: string;
  organizerNote: string;
  wishes: BloomWish[];
}
