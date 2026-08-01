import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { useWizardStore } from "@/store/wizardStore";
import { daysUntil, formatWeekdayDate } from "@/lib/date";
import { getThemeImage } from "@/lib/themeImages";

export default function CreateScheduledPage() {
  const navigate = useNavigate();
  const { recipient, themeId, channel, reset } = useWizardStore();
  const vesselImage = getThemeImage(themeId, "scheduled");

  useEffect(() => {
    if (!recipient) navigate("/create/who", { replace: true });
  }, [recipient, navigate]);

  if (!recipient) return null;

  const days = daysUntil(recipient.birthdayISO);
  const channelLabel =
    channel === "whatsapp"
      ? "WhatsApp notification"
      : channel === "sms"
        ? "SMS notification"
        : "private link";

  function handleDashboard() {
    reset();
    navigate("/dashboard");
  }

  return (
    <main className="grid min-h-screen items-center gap-6 bg-[radial-gradient(circle_at_50%_48%,#4A203D,transparent_42%)] px-6 py-12 sm:grid-cols-2 sm:gap-16 sm:px-[8%]">
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
          {formatWeekdayDate(recipient.birthdayISO)} at {recipient.deliveryTime} — and
          we'll let you know when {recipient.name} opens it.
        </p>
        <Button type="button" onClick={handleDashboard} className="mt-6">
          View on dashboard
        </Button>
        <div className="mt-5 text-[11px] font-extrabold text-champagne">
          £1.49 paid · {channelLabel} ready
        </div>
      </section>

      <div className="relative order-first mx-auto w-full max-w-[410px] justify-self-center sm:order-none">
        <img
          src={vesselImage.src}
          alt={vesselImage.alt}
          className="aspect-square w-full rounded-full border border-champagne/55 object-cover shadow-deep"
        />
        <div className="absolute bottom-[26px] right-[-10px] rounded-md bg-porcelain px-[17px] py-[14px] text-right font-display text-[25px] text-plum shadow-deep">
          {days}
          <small className="mt-1 block font-sans text-[9px] font-extrabold tracking-[0.12em] text-mulberry">
            DAYS HELD
          </small>
        </div>
      </div>
    </main>
  );
}
