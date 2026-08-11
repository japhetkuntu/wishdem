import { useNavigate } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { Seo } from "@/components/Seo";
import { CreateLayout } from "@/components/CreateLayout";
import { StickyMobileAction } from "@/components/StickyMobileAction";
import { useWizardStore } from "@/store/wizardStore";

/**
 * The first thing anyone sees in the wizard — writing the actual words.
 * Deliberately has no sign-in wall and no wishId requirement: the message
 * lives in the wizard store (already persisted to sessionStorage) until the
 * next step actually creates the wish and carries it along. Nothing to lose
 * by just... starting.
 */
export default function CreateMessagePage() {
  const navigate = useNavigate();
  const { recipient, message, setMessage } = useWizardStore();

  function handleContinue() {
    if (!message.trim()) return;
    navigate("/create/who");
  }

  return (
    <CreateLayout activeIndex={0}>
      <Seo
        title="Write Your Message — WishDem"
        description="Write the private birthday message you want to hold for someone, delivered exactly when it matters."
        path="/create/message"
        noindex
      />
      <span className="text-[11px] font-extrabold tracking-[0.13em] text-champagne">
        START WITH THE FEELING
      </span>
      <h1 className="my-[10px] max-w-[620px] font-display text-[clamp(30px,4.3vw,48px)] leading-[1.05]">
        What do you want to say?
      </h1>
      <p className="max-w-[560px] text-[13px] leading-[1.6] text-porcelain/70">
        Write it now, exactly as you'd say it. You'll pick who it's for and when it
        arrives next — nothing sends until you seal it.
      </p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={`Dear ${recipient?.name ?? "friend"},\nI hope this year gives you...`}
        rows={9}
        autoFocus
        className="mt-6 min-h-[260px] w-full resize-y rounded-lg bg-paper p-[27px] font-display text-[18px] leading-[1.55] text-ink outline-none placeholder:text-ink/40 sm:text-[20px]"
      />

      <StickyMobileAction>
        <Button type="button" onClick={handleContinue} disabled={!message.trim()}>
          Continue →
        </Button>
        <span className="text-[11px] leading-[1.45] text-porcelain/60">
          Nothing is sent yet — you'll choose who it's for next.
        </span>
      </StickyMobileAction>
    </CreateLayout>
  );
}
