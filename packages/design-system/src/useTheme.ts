import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "wishdem-theme";

/** Reads the user's explicit choice, if any — null means "no preference saved
 * yet, use this app's own default." Shared across both portals since they may
 * run on the same browser, but each keeps its own sensible default. */
export function getStoredTheme(): ThemeMode | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private browsing, etc.) — the choice just won't persist.
  }
}

/**
 * `defaultTheme` is only used the very first time a browser visits this
 * portal with no saved preference — matches the two apps' current fixed
 * looks (customer-portal dark, admin-portal light) until someone opts to
 * switch, at which point their explicit choice always wins.
 */
export function useTheme(defaultTheme: ThemeMode) {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme() ?? defaultTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return { theme, setTheme, toggle };
}
