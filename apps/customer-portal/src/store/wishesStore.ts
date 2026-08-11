import { create } from "zustand";
import { listWishes } from "@/lib/api";
import type { Wish } from "@/types";

/**
 * AppNav (for the "sealed wish waiting" reminder) and DashboardPage both call
 * useWishes() — without a shared store, mounting both on the same page fired
 * /api/wishes twice, and every navigation back to a page using either one
 * re-fetched the whole list again. Cached here so it loads once and only
 * refetches when something explicitly calls refresh() (e.g. after sealing a wish).
 */
interface WishesState {
  wishes: Wish[] | null;
  loading: boolean;
  fetchPromise: Promise<void> | null;
  ensureLoaded: () => void;
  refresh: () => void;
  reset: () => void;
}

function load(set: (partial: Partial<WishesState>) => void) {
  const promise = listWishes()
    .then((data) => {
      set({ wishes: data, loading: false, fetchPromise: null });
    })
    .catch(() => {
      // VerifyPage calls useWishes() before the user is actually authenticated (to preview
      // "next to bloom" once they're in) — that fetch always 401s. Without clearing
      // fetchPromise here too, ensureLoaded()'s guard would see it as still in-flight
      // forever and never retry, leaving DashboardPage's real post-login fetch permanently
      // blocked — stuck on "Gathering your wishes" until a full page reload.
      set({ loading: false, fetchPromise: null });
    });
  set({ loading: true, fetchPromise: promise });
}

export const useWishesStore = create<WishesState>((set, get) => ({
  wishes: null,
  loading: true,
  fetchPromise: null,
  ensureLoaded: () => {
    if (get().wishes !== null || get().fetchPromise) return;
    load(set);
  },
  refresh: () => load(set),
  reset: () => set({ wishes: null, loading: true, fetchPromise: null }),
}));
