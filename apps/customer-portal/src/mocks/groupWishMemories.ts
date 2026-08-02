import type { GroupWishMemory } from "@/types";

const MEMORIES_KEY = "wishdem-mock-group-memories";

function loadMemories(): GroupWishMemory[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(MEMORIES_KEY);
    if (raw) return JSON.parse(raw) as GroupWishMemory[];
  } catch {
    // Corrupt or inaccessible storage — fall back to an empty list.
  }
  return [];
}

export const GROUP_WISH_MEMORIES: GroupWishMemory[] = loadMemories();

export function persistGroupWishMemories() {
  try {
    sessionStorage.setItem(MEMORIES_KEY, JSON.stringify(GROUP_WISH_MEMORIES));
  } catch {
    // Storage unavailable/full — non-fatal for a mock layer.
  }
}

export function findMemoryForContribution(contributionId: string): GroupWishMemory | undefined {
  return GROUP_WISH_MEMORIES.find((m) => m.contributionId === contributionId);
}
