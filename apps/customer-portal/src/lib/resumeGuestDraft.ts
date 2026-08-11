import type { NavigateFunction } from "react-router-dom";
import { claimGuestDraft } from "@/lib/api";
import { useWizardStore } from "@/store/wizardStore";

/**
 * Called right after login/registration succeeds. If the visitor stashed a
 * guest wish draft before signing in, claims it into a real wish and sends
 * them straight back into the wizard where they left off — otherwise falls
 * back to the normal post-login destination. Keeps this logic in one place
 * since both the Google and email/OTP sign-in paths need it.
 */
export async function resumeAfterAuth(navigate: NavigateFunction): Promise<void> {
  const { draftId, setWishId, clearDraftId } = useWizardStore.getState();

  if (draftId) {
    try {
      const wish = await claimGuestDraft(draftId);
      setWishId(wish.id);
      clearDraftId();
      // The message was already written before signing in (message is now step
      // 1) — the draft carried it along, so pick up at theme, not message again.
      navigate("/create/theme");
      return;
    } catch {
      // Draft expired, or the daily limit was hit on this now-known account — either way
      // there's nothing left to resume, so fall through to the normal destination.
      clearDraftId();
    }
  }

  navigate("/dashboard");
}
