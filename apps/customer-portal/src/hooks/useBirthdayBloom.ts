import { useCallback, useEffect, useState } from "react";
import { getBirthdayBloom } from "@/lib/api";
import type { BirthdayBloom } from "@/types";

/**
 * The Birthday Bloom gallery is a public, token-free link with no recipient
 * account to authenticate — there's no backend identity to persist "opened"/
 * "favorited" state against. That state is purely a per-browser viewing
 * preference, so it's kept in localStorage keyed by the bloom's group-wish id
 * instead of round-tripping to a nonexistent endpoint.
 */
function storageKey(id: string) {
  return `wishdem-bloom-state-${id}`;
}

interface StoredBloomState {
  opened: string[];
  favorited: string[];
}

function readStoredState(id: string): StoredBloomState {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) return { opened: [], favorited: [] };
    const parsed = JSON.parse(raw);
    return {
      opened: Array.isArray(parsed.opened) ? parsed.opened : [],
      favorited: Array.isArray(parsed.favorited) ? parsed.favorited : [],
    };
  } catch {
    return { opened: [], favorited: [] };
  }
}

function writeStoredState(id: string, state: StoredBloomState) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(state));
  } catch {
    // Best-effort only — a full/blocked localStorage shouldn't break the gallery.
  }
}

export function useBirthdayBloom(id: string | undefined) {
  const [bloom, setBloom] = useState<BirthdayBloom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getBirthdayBloom(id).then((data) => {
      if (data) {
        const stored = readStoredState(id);
        data.wishes = data.wishes.map((w) => ({
          ...w,
          opened: w.opened || stored.opened.includes(w.id),
          favorited: w.favorited || stored.favorited.includes(w.id),
        }));
      }
      setBloom(data);
      setLoading(false);
    });
  }, [id]);

  const markOpened = useCallback(
    (wishId: string) => {
      if (!id) return;
      setBloom((prev) => {
        if (!prev) return prev;
        const stored = readStoredState(id);
        if (!stored.opened.includes(wishId)) {
          stored.opened.push(wishId);
          writeStoredState(id, stored);
        }
        return { ...prev, wishes: prev.wishes.map((w) => (w.id === wishId ? { ...w, opened: true } : w)) };
      });
    },
    [id],
  );

  const toggleFavorite = useCallback(
    (wishId: string) => {
      if (!id) return;
      setBloom((prev) => {
        if (!prev) return prev;
        const stored = readStoredState(id);
        const nowFavorited = !stored.favorited.includes(wishId);
        stored.favorited = nowFavorited
          ? [...stored.favorited, wishId]
          : stored.favorited.filter((w) => w !== wishId);
        writeStoredState(id, stored);
        return {
          ...prev,
          wishes: prev.wishes.map((w) => (w.id === wishId ? { ...w, favorited: nowFavorited } : w)),
        };
      });
    },
    [id],
  );

  return { bloom, loading, markOpened, toggleFavorite };
}
