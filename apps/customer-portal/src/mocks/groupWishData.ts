import type { GroupWish, GroupWishInvitation } from "@/types";

const GROUP_WISHES_KEY = "wishdem-mock-group-wishes";
const INVITATIONS_KEY = "wishdem-mock-group-invitations";

const SEED_GROUP_WISHES: GroupWish[] = [
  {
    id: "gw-maya",
    title: "Maya's 30th Birthday Memory Book",
    recipientName: "Maya Chen",
    occasion: "Birthday",
    deliveryDateLabel: "Sunday, 18 May",
    collectByLabel: "Friday, 16 May",
    context: "Let's gather the stories that made Maya's twenties unforgettable.",
    formats: ["notes", "photos", "voice", "video"],
    namesVisible: true,
    joinedCount: 0,
    invitedCount: 0,
    viewedCount: 0,
    declinedCount: 0,
    memoriesCount: 0,
    activity: [
      { id: "act-1", message: "You created Maya's Birthday Memory Book." },
      { id: "act-2", message: "Collection deadline set for 16 May." },
    ],
    createdAt: new Date().toISOString(),
  },
];

const SEED_INVITATIONS: GroupWishInvitation[] = [
  {
    id: "invite-maya-jordan",
    title: "Maya's 30th Birthday Memory Book",
    inviterName: "Jordan",
    avatarInitial: "M",
    avatarTone: "mulberry",
    rowSummaryLabel: "Delivery 18 May · 4 people joined · Memories close tomorrow",
    urgencyLabel: "ENDS TODAY",
    urgencyTone: "urgent",
    daysLeftLabel: "3 days left",
    collectionClosesLabel: "16 May · 8:00 PM",
    deliveredLabel: "18 May · her local morning",
    alreadyJoinedLabel: "8 people · 6 memories added",
    participationLabel: "Names visible to the group",
    organizerNote:
      "Maya made our twenties feel like an adventure. Leave the story you hope she never forgets.",
    formats: ["notes", "photos", "voice", "video"],
    status: "invited",
  },
  {
    id: "invite-ravi-hana",
    title: "Ravi's next chapter",
    inviterName: "Hana",
    avatarInitial: "R",
    avatarTone: "moss",
    rowSummaryLabel: "Farewell memory book · Delivery 29 May · 7 people joined",
    urgencyLabel: "2 DAYS LEFT",
    urgencyTone: "new",
    daysLeftLabel: "2 days left",
    collectionClosesLabel: "27 May · 6:00 PM",
    deliveredLabel: "29 May · his local morning",
    alreadyJoinedLabel: "7 people · 5 memories added",
    participationLabel: "Names visible to the group",
    organizerNote: "Ravi's off on a new adventure — send him off with a story only you could tell.",
    formats: ["notes", "photos", "video"],
    status: "invited",
  },
  {
    id: "invite-elise-nadia",
    title: "Elise & Tom, ten years in",
    inviterName: "Nadia",
    avatarInitial: "E",
    avatarTone: "rose",
    rowSummaryLabel: "Anniversary collection · Delivery 4 June · A new invitation",
    urgencyLabel: "NEW",
    urgencyTone: "new",
    daysLeftLabel: "9 days left",
    collectionClosesLabel: "2 June · 6:00 PM",
    deliveredLabel: "4 June · their local morning",
    alreadyJoinedLabel: "2 people · 1 memory added",
    participationLabel: "Names visible to the group",
    organizerNote: "Ten years of Elise and Tom — help us tell them what we've seen.",
    formats: ["notes", "photos"],
    status: "invited",
  },
  {
    id: "invite-lucas-farewell",
    title: "Lucas's farewell book",
    inviterName: "Hana",
    avatarInitial: "L",
    avatarTone: "moss",
    rowSummaryLabel: "Farewell memory book · Delivery 29 May · Joined yesterday",
    urgencyLabel: null,
    urgencyTone: null,
    daysLeftLabel: "0 days left",
    collectionClosesLabel: "27 May · 6:00 PM",
    deliveredLabel: "29 May · his local morning",
    alreadyJoinedLabel: "7 people · 5 memories added",
    participationLabel: "Names visible to the group",
    formats: ["notes", "photos", "voice"],
    status: "joined",
    needNote: "Joined yesterday · add a note, photo, voice note, or short video whenever you are ready.",
  },
  {
    id: "invite-grandma-rose",
    title: "Grandma Rose's 80th",
    inviterName: "Priya",
    avatarInitial: "G",
    avatarTone: "rose",
    rowSummaryLabel: "Birthday collection · Delivered 2 March",
    urgencyLabel: null,
    urgencyTone: null,
    daysLeftLabel: "0 days left",
    collectionClosesLabel: "28 February · 6:00 PM",
    deliveredLabel: "2 March · her local morning",
    alreadyJoinedLabel: "12 people · 12 memories added",
    participationLabel: "Names visible to the group",
    formats: ["notes", "photos"],
    status: "joined",
    needNote: "Your memory was added. This memory book has already been delivered.",
  },
];

function loadGroupWishes(): GroupWish[] {
  if (typeof sessionStorage === "undefined") return [...SEED_GROUP_WISHES];
  try {
    const raw = sessionStorage.getItem(GROUP_WISHES_KEY);
    if (raw) return JSON.parse(raw) as GroupWish[];
  } catch {
    // Corrupt or inaccessible storage — fall back to the seed data.
  }
  return [...SEED_GROUP_WISHES];
}

function loadInvitations(): GroupWishInvitation[] {
  if (typeof sessionStorage === "undefined") return [...SEED_INVITATIONS];
  try {
    const raw = sessionStorage.getItem(INVITATIONS_KEY);
    if (raw) return JSON.parse(raw) as GroupWishInvitation[];
  } catch {
    // Corrupt or inaccessible storage — fall back to the seed data.
  }
  return [...SEED_INVITATIONS];
}

export const GROUP_WISHES: GroupWish[] = loadGroupWishes();
export const GROUP_WISH_INVITATIONS: GroupWishInvitation[] = loadInvitations();

export function persistGroupWishes() {
  try {
    sessionStorage.setItem(GROUP_WISHES_KEY, JSON.stringify(GROUP_WISHES));
  } catch {
    // Storage unavailable/full — non-fatal for a mock layer.
  }
}

export function persistGroupWishInvitations() {
  try {
    sessionStorage.setItem(INVITATIONS_KEY, JSON.stringify(GROUP_WISH_INVITATIONS));
  } catch {
    // Storage unavailable/full — non-fatal for a mock layer.
  }
}

export function findGroupWish(id: string): GroupWish | undefined {
  return GROUP_WISHES.find((g) => g.id === id);
}

export function findGroupWishInvitation(id: string): GroupWishInvitation | undefined {
  return GROUP_WISH_INVITATIONS.find((i) => i.id === id);
}
