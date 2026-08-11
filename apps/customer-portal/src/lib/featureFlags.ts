/** Google sign-in isn't wired up to a real OAuth client yet (see api.ts's
 * signInWithGoogle, which currently just throws) — hidden by default so the
 * button doesn't dead-end visitors. Set VITE_ENABLE_GOOGLE_AUTH=true once a
 * real client id is configured. */
export const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === "true";
