import type { Theme, User, Wish } from "@/types";

/**
 * In-memory mock "database". Mutated directly by mocks/api.ts so state
 * survives across navigation within a session. Swap this whole module for
 * real network calls later without touching hooks/components.
 */
export const themes: Theme[] = [
  {
    id: "velvet-night",
    name: "Velvet Night",
    description:
      "A deep-plum envelope, warm porcelain paper, and one quiet champagne seal. Intimate, considered, and made to open slowly.",
    swatch: "bg-mulberry",
  },
  {
    id: "garden-letter",
    name: "Garden Letter",
    description:
      "Moss paper and a pressed edge — an unhurried, earthy note that feels handwritten in a garden.",
    swatch: "bg-moss",
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
    swatch: "bg-ink",
  },
];

export let currentUser: User | null = null;

export function setCurrentUser(user: User | null) {
  currentUser = user;
}

/** Emails treated as already having a WishDem account — everyone else is a new customer. */
export const EXISTING_EMAILS = ["leila@example.com"];

export const wishes: Wish[] = [
  {
    id: "wish-maya",
    recipient: {
      name: "Maya Chen",
      relationship: "Best friend",
      birthdayISO: "2026-11-12",
      deliveryTime: "09:00",
      timezone: "Europe/London",
    },
    message:
      "I hope this year gives you more slow mornings, louder laughs, and every reminder of how loved you are. I'm so proud of the life you're building.\n\nThank you for being the kind of friend who makes ordinary days feel fuller. I hope today holds a little of the same for you.\n\nLove always,\nLeila",
    attachment: { kind: "voice", durationSeconds: 28 },
    themeId: "velvet-night",
    channel: "whatsapp",
    status: "sealed",
    fromName: "Leila",
    priceLabel: "£1.49",
    createdAt: "2026-03-02T10:00:00.000Z",
    sealedAt: "2026-03-02T10:04:00.000Z",
  },
  {
    id: "wish-dad",
    recipient: {
      name: "Dad",
      relationship: "Parent",
      birthdayISO: "2026-08-21",
      deliveryTime: "09:00",
      timezone: "Europe/London",
    },
    message: "",
    attachment: null,
    themeId: null,
    channel: null,
    status: "draft",
    fromName: "You",
    priceLabel: "£1.49",
    createdAt: "2026-07-20T08:00:00.000Z",
  },
  {
    id: "wish-arjun",
    recipient: {
      name: "Arjun Patel",
      relationship: "Colleague",
      birthdayISO: "2026-08-30",
      deliveryTime: "09:00",
      timezone: "Europe/London",
    },
    message: "Your first year leading the team has been something to see.",
    attachment: null,
    themeId: "afterglow",
    channel: "link",
    status: "draft",
    fromName: "You",
    priceLabel: "£1.49",
    createdAt: "2026-07-25T08:00:00.000Z",
  },
  {
    id: "wish-nia",
    recipient: {
      name: "Nia",
      relationship: "Friend",
      birthdayISO: "2026-08-05",
      deliveryTime: "09:00",
      timezone: "Europe/London",
    },
    message: "Nia, thank you for always making time feel lighter.",
    attachment: null,
    themeId: "garden-letter",
    channel: "link",
    status: "delivered",
    fromName: "You",
    priceLabel: "£1.49",
    createdAt: "2026-07-01T08:00:00.000Z",
    sealedAt: "2026-07-01T08:10:00.000Z",
  },
];

export function findWish(id: string) {
  return wishes.find((w) => w.id === id) ?? null;
}
