import { useState } from "react";
import { Button } from "@wishdem/design-system";
import { GOOGLE_AUTH_ENABLED } from "@/lib/featureFlags";

export function AuthPrompt({
  title = "Keep this message safely held.",
  description = "Your draft stays exactly as it is while you sign in.",
  onGoogle,
  onEmail,
}: {
  title?: string;
  description?: string;
  onGoogle: () => void;
  onEmail: (email: string) => void;
}) {
  // With Google hidden, email is the only path in — skip straight to the
  // input instead of making someone tap a "Continue with email" reveal button
  // that's now the sole option anyway.
  const [showEmailField, setShowEmailField] = useState(!GOOGLE_AUTH_ENABLED);
  const [email, setEmail] = useState("");

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) onEmail(email.trim());
  }

  return (
    // text-porcelain here (not just the --wd-ink-on-canvas pin) matters: the h2 below has
    // no color class of its own and inherits — it needs this element's own computed color
    // to already be the fixed cream, not just the variable available for descendants that
    // reference it explicitly.
    <div className="rounded-lg bg-mulberry p-6 text-porcelain [--wd-ink-on-canvas-rgb:246_240_232]">
      <span className="text-[11px] font-extrabold tracking-[0.13em] text-champagne">
        SAVE YOUR LETTER
      </span>
      <h2 className="my-[10px] font-display text-[29px]">{title}</h2>
      <p className="text-[13px] leading-[1.6] text-porcelain/75">{description}</p>
      {GOOGLE_AUTH_ENABLED && (
        <Button type="button" onClick={onGoogle} className="mt-3 w-full">
          Continue with Google
        </Button>
      )}
      {showEmailField ? (
        <form onSubmit={handleEmailSubmit} className="mt-3 flex flex-col gap-2">
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="min-h-[50px] w-full rounded-pill border border-porcelain/40 bg-transparent px-4 text-[13px] text-porcelain placeholder:text-porcelain/50 focus:border-champagne focus:outline-none"
          />
          <Button type="submit" variant="outline" className="w-full">
            Continue
          </Button>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowEmailField(true)}
          className="mt-3 w-full"
        >
          Continue with email
        </Button>
      )}
    </div>
  );
}
