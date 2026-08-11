import type { NavigateFunction } from "react-router-dom";
import { claimGuestDraft } from "@/lib/api";
import { ApiError } from "@/lib/httpClient";
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
    } catch (err) {
      // Draft expired, or the daily limit was hit on this now-known account — either way
      // there's nothing left to resume. Send them back to re-enter the recipient details
      // with a real reason instead of silently dropping them on the dashboard, which
      // looked like their wish had just vanished with no explanation.
      clearDraftId();
      navigate("/create/who", {
        state: {
          resumeError:
            err instanceof ApiError
              ? err.message
              : "We couldn't recover your draft after signing in — please fill this in again.",
        },
      });
      return;
    }
  }

  navigate("/dashboard");
}
