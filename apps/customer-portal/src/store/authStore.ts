import { create } from "zustand";
import { getCurrentUser } from "@/lib/api";
import type { User } from "@/types";

/**
 * RequireAuth, AppNav, SiteNav, ProfilePage, LoginPage, and CreateWhoPage each call
 * useAuth() — before this store existed, every one of those was its own independent
 * fetch of /api/profile, so a single page render could fire it 2-3x and every
 * navigation re-fetched from scratch. This module-level store makes them all share
 * one fetch and one cached result instead.
 */
interface AuthState {
  user: User | null;
  loading: boolean;
  fetched: boolean;
  fetchPromise: Promise<void> | null;
  ensureLoaded: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  fetched: false,
  fetchPromise: null,
  ensureLoaded: () => {
    if (get().fetched || get().fetchPromise) return;
    const promise = getCurrentUser().then((u) => {
      set({ user: u, loading: false, fetched: true, fetchPromise: null });
    });
    set({ fetchPromise: promise });
  },
  setUser: (user) => set({ user, loading: false, fetched: true }),
}));
