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
}

export interface PaymentResult {
  success: boolean;
  reference?: string;
  failureReason?: string;
}
