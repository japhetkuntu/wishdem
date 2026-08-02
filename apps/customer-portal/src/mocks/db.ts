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

const USER_STORAGE_KEY = "wishdem-mock-user";

function loadCurrentUser(): User | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as User;
  } catch {
    // Corrupt or inaccessible storage — fall back to signed-out.
  }
  return null;
}

export let currentUser: User | null = loadCurrentUser();

export function setCurrentUser(user: User | null) {
  currentUser = user;
  persistCurrentUser();
}

export function persistCurrentUser() {
  try {
    if (currentUser) sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
    else sessionStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Storage unavailable/full — non-fatal for a mock layer.
  }
}

/** Emails treated as already having a WishDem account — everyone else is a new customer. */
export const EXISTING_EMAILS = ["leila@example.com"];

const WISHES_STORAGE_KEY = "wishdem-mock-wishes";

const SEED_WISHES: Wish[] = [
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
  {
    id: "wish-leo",
    recipient: {
      name: "Leo Hart",
      relationship: "Friend",
      birthdayISO: "2026-10-02",
      deliveryTime: "08:00",
      timezone: "Europe/London",
    },
    message: "Leo, here's to another year of your terrible jokes and great company.",
    attachment: null,
    themeId: "velvet-night",
    channel: "whatsapp",
    status: "sealed",
    fromName: "You",
    priceLabel: "£1.49",
    createdAt: "2026-07-10T08:00:00.000Z",
    sealedAt: "2026-07-10T08:05:00.000Z",
  },
];

/**
 * The wizard's draft state persists across reloads via sessionStorage
 * (see store/wizardStore.ts), so the wish records it references need to
 * survive reloads too — otherwise a stale wishId from before a refresh
 * points at nothing, and every save silently fails. Mirroring that same
 * sessionStorage persistence here keeps the two in sync.
 */
function loadWishes(): Wish[] {
  if (typeof sessionStorage === "undefined") return [...SEED_WISHES];
  try {
    const raw = sessionStorage.getItem(WISHES_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Wish[];
  } catch {
    // Corrupt or inaccessible storage — fall back to the seed data.
  }
  return [...SEED_WISHES];
}

export const wishes: Wish[] = loadWishes();

export function persistWishes() {
  try {
    sessionStorage.setItem(WISHES_STORAGE_KEY, JSON.stringify(wishes));
  } catch {
    // Storage unavailable/full — non-fatal for a mock layer.
  }
}

export function findWish(id: string) {
  return wishes.find((w) => w.id === id) ?? null;
}
