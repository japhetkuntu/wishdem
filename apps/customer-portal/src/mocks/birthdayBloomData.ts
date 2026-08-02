import type { BirthdayBloom, BloomWish } from "@/types";

const BLOOM_KEY = "wishdem-mock-birthday-bloom";

const SEED_WISHES: BloomWish[] = [
  {
    id: "bloom-elena",
    contributorName: "Elena",
    relationshipLabel: "Your sister",
    group: "family",
    type: "photo-note",
    quote: "You have always made room for everyone, even when the house was loud.",
    opened: true,
    favorited: true,
  },
  {
    id: "bloom-david",
    contributorName: "David",
    relationshipLabel: "Dad",
    group: "family",
    type: "voice",
    quote: "A warm spoken note from the garden, saved for a quiet moment.",
    mediaDurationSeconds: 72,
    opened: true,
    favorited: false,
  },
  {
    id: "bloom-ruth",
    contributorName: "Grandma Ruth",
    relationshipLabel: "Family",
    group: "family",
    type: "note",
    quote: "A letter is waiting for you.",
    opened: false,
    favorited: false,
  },
  {
    id: "bloom-priya",
    contributorName: "Priya",
    relationshipLabel: "Friend since 2011",
    group: "friends",
    type: "note",
    quote: "Thirty looks very good on you already. I still laugh about the yellow umbrella.",
    opened: true,
    favorited: true,
  },
  {
    id: "bloom-sam",
    contributorName: "Sam",
    relationshipLabel: "College friend",
    group: "friends",
    type: "video",
    quote: "A little birthday toast from across the city.",
    mediaDurationSeconds: 36,
    opened: true,
    favorited: false,
  },
  {
    id: "bloom-aisha",
    contributorName: "Aisha",
    relationshipLabel: "Friend",
    group: "friends",
    type: "photo-memory",
    quote: "One image and a story are waiting.",
    opened: false,
    favorited: false,
  },
];

const SEED_BLOOM: BirthdayBloom = {
  id: "gw-maya",
  recipientName: "Maya Chen",
  deliveryDateLabel: "18 June",
  organizerName: "Jordan",
  organizerNote:
    "A few people who adore you have been saving something for today. Here is your next year, loved loudly.",
  wishes: SEED_WISHES,
};

function loadBloom(): BirthdayBloom {
  if (typeof sessionStorage === "undefined") return structuredClone(SEED_BLOOM);
  try {
    const raw = sessionStorage.getItem(BLOOM_KEY);
    if (raw) return JSON.parse(raw) as BirthdayBloom;
  } catch {
    // Corrupt or inaccessible storage — fall back to the seed data.
  }
  return structuredClone(SEED_BLOOM);
}

export const BIRTHDAY_BLOOM: BirthdayBloom = loadBloom();

export function persistBirthdayBloom() {
  try {
    sessionStorage.setItem(BLOOM_KEY, JSON.stringify(BIRTHDAY_BLOOM));
  } catch {
    // Storage unavailable/full — non-fatal for a mock layer.
  }
}

export function findBloom(id: string): BirthdayBloom | undefined {
  return BIRTHDAY_BLOOM.id === id ? BIRTHDAY_BLOOM : undefined;
}
