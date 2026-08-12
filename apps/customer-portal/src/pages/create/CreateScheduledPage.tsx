import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { Seo } from "@/components/Seo";
import { ShareLinks } from "@/components/ShareLinks";
import { ShareImageActions } from "@/components/ShareImageActions";
import { SmoothImage } from "@/components/SmoothImage";
import { useWizardStore } from "@/store/wizardStore";
import { daysUntilOccasion, formatWeekdayDate } from "@/lib/date";
import { getThemeImage } from "@/lib/themeImages";

export default function CreateScheduledPage() {
  const navigate = useNavigate();
  const { wishId, recipient, themeId, channel, reset } = useWizardStore();
  const vesselImage = getThemeImage(themeId, "scheduled");
  // React 18 batches the navigate() + reset() pair below into one update, so this
  // page's own guard effect still runs (on the still-mounted page) once `recipient`
  // disappears — and its navigate("/create/who") wins the race against the dashboard
  // navigation. This ref lets the effect recognize "we're leaving on purpose" and skip
  // firing its own redirect.
  const leavingRef = useRef(false);

  useEffect(() => {
    if (!recipient && !leavingRef.current) navigate("/create/who", { replace: true });
  }, [recipient, navigate]);

  if (!recipient) return null;

  // Clamped for display — a one-time occasion's date can be today or already past
  // (delivered as soon as possible), which shouldn't read as a negative day count.
  const days = Math.max(0, daysUntilOccasion(recipient.occasion, recipient.occasionDateISO));
  const channelLabel = channel === "sms" ? "SMS notification" : "private link";

  function handleDashboard() {
    leavingRef.current = true;
    navigate("/dashboard");
    reset();
  }

  return (
    // Same fixed-dark-island treatment as RecipientWishPage's ceremony screen — this is
    // a celebratory confirmation by design, not meant to flip light in light mode, and
    // the old transparent-edged gradient made the porcelain-colored text unreadable
    // wherever it faded out to the page canvas.
    <main className="grid min-h-screen items-center gap-6 bg-plum bg-[radial-gradient(circle_at_50%_48%,#4A203D,transparent_70%)] px-6 py-12 text-porcelain [--wd-ink-on-canvas-rgb:246_240_232] sm:grid-cols-2 sm:gap-16 sm:px-[8%]">
      <Seo
        title={`${recipient.name}'s Wish Is Sealed — WishDem`}
        description={`${recipient.name}'s private wish has been sealed and scheduled for delivery on WishDem.`}
        path="/create/scheduled"
        noindex
      />
      <section>
        <span className="text-[10px] font-extrabold tracking-[0.14em] text-champagne">
          DELIVERY SECURED
        </span>
        <h1 className="my-4 font-display text-[clamp(44px,6vw,76px)] leading-[1]">
          {recipient.name}'s wish
          <br />
          is <i className="italic">sealed.</i>
        </h1>
        <p className="max-w-[460px] leading-[1.7] text-porcelain/75">
          Held beautifully for {days} days. It will arrive privately on{" "}
          {formatWeekdayDate(recipient.occasionDateISO)} at {recipient.deliveryTime} — and
          we'll let you know when {recipient.name} opens it.
        </p>
        <Button type="button" onClick={handleDashboard} className="mt-6">
          View on dashboard
        </Button>
        <div className="mt-5 text-[11px] font-extrabold text-champagne">
          {channelLabel} ready
        </div>

        {wishId && (
          <div className="mt-7 max-w-[460px] rounded-lg border border-porcelain/[0.14] bg-porcelain/[0.04] p-5">
            <p className="mb-3 text-[11px] font-extrabold tracking-[0.1em] text-champagne">
              {channel === "link" ? "YOUR PRIVATE LINK" : "WANT TO SHARE IT YOURSELF TOO?"}
            </p>
            <p className="mb-4 text-[12px] leading-[1.6] text-porcelain/70">
              {channel === "link"
                ? "Nothing is sent automatically for this channel — send this link to " +
                  `${recipient.name} yourself, whenever feels right.`
                : `We'll deliver it automatically, but you're welcome to send this link to ${recipient.name} directly too.`}
            </p>
            <ShareLinks
              url={`${window.location.origin}/w/${wishId}`}
              shareText={`I've saved something for you on WishDem 💛`}
              tone="dark"
            />
          </div>
        )}

        <div className="mt-5 max-w-[460px] rounded-lg border border-porcelain/[0.14] bg-porcelain/[0.04] p-5">
          <p className="mb-3 text-[11px] font-extrabold tracking-[0.1em] text-champagne">
            TELL THE WORLD (WITHOUT SPOILING IT)
          </p>
          <p className="mb-4 text-[12px] leading-[1.6] text-porcelain/70">
            A shareable card announcing the wish — no private message included.
          </p>
          <ShareImageActions
            variant="teaser"
            recipientName={recipient.name}
            fromName="You"
            dateLabel={formatWeekdayDate(recipient.occasionDateISO)}
            imageSrc={vesselImage.src}
            filename={`wishdem-${recipient.name.toLowerCase().replace(/\s+/g, "-")}`}
            tone="dark"
          />
        </div>
      </section>

      <div className="relative order-first mx-auto w-full max-w-[410px] justify-self-center sm:order-none">
        <SmoothImage
          src={vesselImage.src}
          alt={vesselImage.alt}
          loading="eager"
          className="aspect-square w-full rounded-full border border-champagne/55 shadow-deep"
        />
        <div className="absolute bottom-[26px] right-[-10px] rounded-md bg-paper px-[17px] py-[14px] text-right font-display text-[25px] text-plum shadow-deep">
          {days}
          <small className="mt-1 block font-sans text-[9px] font-extrabold tracking-[0.12em] text-mulberry">
            DAYS HELD
          </small>
        </div>
      </div>
    </main>
  );
}
