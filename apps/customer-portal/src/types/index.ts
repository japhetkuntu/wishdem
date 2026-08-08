export type Relationship =
  | "Best friend"
  | "Partner"
  | "Parent"
  | "Sibling"
  | "Colleague"
  | "Friend"
  | "Other";

export type DeliveryChannel = "whatsapp" | "sms" | "link";

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
  birthdayISO: string; // yyyy-mm-dd
  deliveryTime: string; // HH:mm
  timezone: string;
  /** Required for whatsapp/sms delivery — the recipient never has a WishDem account,
   * so this is the only way to reach them for those channels. Not needed for "link". */
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

export interface PaymentResult {
  success: boolean;
  reference?: string;
  failureReason?: string;
}

export interface CalendarDay {
  id: string;
  weekdayLabel: string;
  summary: string;
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

export interface SelectedMoment {
  title: string;
  subtitle: string;
  days: number;
  clips: number;
  clipsRemaining: number;
  contributionLabel: string;
  contributionNote: string;
  contributionProgress: number;
  suggestedTimeNote: string;
  deliveryConfidenceNote: string;
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
