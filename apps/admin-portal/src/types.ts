export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export type Severity = "critical" | "high" | "medium";

export interface AttentionItem {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  actionLabel: string;
}

export type WaveTone = "ok" | "warn" | "bad";

export interface DeliveryWave {
  id: string;
  label: string;
  percent: number;
  ratioLabel: string;
  tone: WaveTone;
  badgeLabel: string;
}

export interface ActivityEvent {
  id: string;
  time: string;
  message: string;
}

export interface OverviewData {
  kpis: {
    createdToday: number;
    createdTodayNote: string;
    createdWeek: number;
    createdWeekNote: string;
    dueToday: number;
    dueTodayNote: string;
    deliveredToday: number;
    deliveredTodayNote: string;
    failedDelivery: number;
    failedDeliveryNote: string;
    revenueWeek: string;
    revenueWeekNote: string;
  };
  attention: AttentionItem[];
  waves: DeliveryWave[];
  activity: ActivityEvent[];
  signals: { value: string; label: string }[];
}

export type DeliveryStatus = "FAILED" | "SCHEDULED" | "DELIVERED";
export type PaymentStatus = "PAID" | "REVERSED";

export interface AdminWish {
  id: string;
  createdLabel: string;
  channel: string;
  senderName: string;
  recipientName: string;
  scheduleLabel: string;
  timezoneLabel: string;
  deliveryStatus: DeliveryStatus;
  deliveryDetail: string;
  paymentStatus: PaymentStatus;
  type: string;
  investigation: {
    statusBadge: string;
    facts: { label: string; value: string }[];
    timeline: { time: string; note: string }[];
  };
}

export type MoMoStatus = "PENDING" | "FAILED" | "SUCCESSFUL" | "REFUND_PENDING";

export interface MoMoTransaction {
  id: string;
  wishId: string;
  senderName: string;
  provider: string;
  amount: string;
  statusNote: string;
  status: MoMoStatus;
  reconciliationLabel: string;
  actionLabel: string;
}

export interface ModerationCase {
  id: string;
  wishId: string;
  status: "resolved" | "under-review";
  severity: Severity | "info";
  title: string;
  flaggedAgo: string;
  description: string;
  evidenceQuote: string;
  contentType: string;
  reviewer: string;
  sender: string;
  priorCases: string;
}

export interface DeliveryStat {
  label: string;
  value: string;
  note: string;
  alert?: boolean;
}

export type DeliveryAttemptStatus = "FAILED" | "RETRYING" | "QUEUED";

export interface DeliveryAttempt {
  id: string;
  wishId: string;
  status: DeliveryAttemptStatus;
  triesLabel?: string;
  detail: string;
  actionLabel: string;
}

export type AttentionUrgency = "now" | "today" | "soon";

export interface AttentionCase {
  id: string;
  urgency: AttentionUrgency;
  urgencyLabel: string;
  title: string;
  description: string;
  actionLabel: string;
  detail: {
    label: string;
    title: string;
    description: string;
    facts: { label: string; value: string }[];
    impactNote: string;
    owner: string;
  };
}

export type CustomerStatus = "ACTION_NEEDED" | "ACTIVE" | "RESTRICTED" | "DELETION_REQUESTED";

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  status: CustomerStatus;
  meta: string;
  profile: {
    memberSince: string;
    activeWishes: number;
    nextDelivery: string;
    timezoneNote: string;
    summary: string;
    scheduledWishes: { recipient: string; meta: string; note: string }[];
    paymentNote: string;
    careNotes: { author: string; time: string; note: string }[];
  };
}

export type TeamStatus = "ACTIVE" | "INVITED" | "OFFBOARDING";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  status: TeamStatus;
  mfa: "ENABLED" | "PENDING";
  lastActive: string;
  locationNote: string;
  actionLabel: string;
}

export type AuditTag =
  | "CONTENT_ACCESS"
  | "SENSITIVE_ACCESS"
  | "CRITICAL_ACCESS"
  | "SENSITIVE_EXPORT"
  | "SECURITY"
  | null;

export interface AuditEvent {
  id: string;
  timeLabel: string;
  dayLabel: string;
  locationNote: string;
  deviceNote: string;
  actor: string;
  message: string;
  detailNote: string;
  tag: AuditTag;
  outcome: string;
  outcomeNote: string;
  detail: {
    label: string;
    title: string;
    description: string;
    facts: { label: string; value: string }[];
    reasonNote: string;
  };
}
