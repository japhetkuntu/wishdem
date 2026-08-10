import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { CreateLayout } from "@/components/CreateLayout";
import { AuthPrompt } from "@/components/AuthPrompt";
import { AttachmentPicker } from "@/components/AttachmentPicker";
import { useWizardStore } from "@/store/wizardStore";
import { useAuth } from "@/hooks/useAuth";
import { saveMessageStep } from "@/lib/api";

export default function CreateMessagePage() {
  const navigate = useNavigate();
  const { wishId, recipient, message, attachment, setMessage, setAttachment, markSaved } =
    useWizardStore();
  const { user, continueWithGoogle, continueWithEmail } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wishId) navigate("/create/who", { replace: true });
  }, [wishId, navigate]);

  async function persistAndContinue() {
    if (!wishId) return;
    setSaving(true);
    setError(null);
    try {
      await saveMessageStep(wishId, message, attachment, recipient ?? undefined);
      markSaved();
      navigate("/create/theme");
    } catch {
      setError("We couldn't save that just now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleGoogle() {
    await continueWithGoogle();
    await persistAndContinue();
  }

  async function handleEmail(email: string) {
    // continueWithEmail sends the user to the OTP verify page — the wizard
    // draft is already safely persisted in sessionStorage by useWizardStore,
    // so there's nothing further to save until they return signed in.
    await continueWithEmail(email);
  }

  return (
    <CreateLayout activeIndex={1}>
      <section className="grid gap-6 sm:grid-cols-[1.2fr_.8fr] sm:gap-10">
        <div>
          <span className="text-[11px] font-extrabold tracking-[0.13em] text-champagne">
            THE LETTER IS THE HEART OF IT
          </span>
          <h1 className="my-[10px] font-display text-[clamp(30px,4vw,45px)] leading-[1.05]">
            Write what you want {recipient?.name ?? "them"} to keep.
          </h1>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Dear ${recipient?.name ?? "friend"},\nI hope this year gives you...`}
            rows={7}
            className="min-h-[210px] w-full resize-y rounded-lg bg-paper p-[27px] font-display text-[18px] leading-[1.55] text-ink outline-none placeholder:text-ink/40 sm:text-[20px]"
          />

          <p className="mt-4 text-[13px]">
            <b className="font-extrabold">Add one memory, if you'd like.</b> One
            optional attachment per wish.
          </p>
          <div className="mt-2">
            <AttachmentPicker value={attachment} onChange={setAttachment} wishId={wishId ?? ""} />
          </div>
        </div>

        <aside>
          {user ? (
            <div className="rounded-lg bg-mulberry p-6 text-porcelain [--wd-ink-on-canvas-rgb:246_240_232]">
              <span className="text-[11px] font-extrabold tracking-[0.13em] text-champagne">
                SIGNED IN
              </span>
              <h2 className="my-[10px] font-display text-[29px]">
                Good to have you, {user.name}.
              </h2>
              <p className="mb-4 text-[13px] leading-[1.6] text-porcelain/75">
                Your letter is safely tied to your account.
              </p>
              <Button
                type="button"
                onClick={persistAndContinue}
                disabled={saving || !message.trim()}
                className="w-full"
              >
                {saving ? "Saving…" : "Continue to choose a look →"}
              </Button>
              {error && <p className="mt-3 text-[12px] text-rose">{error}</p>}
            </div>
          ) : (
            <AuthPrompt onGoogle={handleGoogle} onEmail={handleEmail} />
          )}
        </aside>
      </section>
    </CreateLayout>
  );
}
