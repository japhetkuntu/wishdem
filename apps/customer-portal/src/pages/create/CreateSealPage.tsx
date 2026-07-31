import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { CreateLayout } from "@/components/CreateLayout";
import { useWizardStore } from "@/store/wizardStore";
import { useThemes } from "@/hooks/useThemes";
import { chargeMobileMoney } from "@/lib/api";
import { formatWeekdayDate } from "@/lib/date";
import { ASSETS } from "@/lib/assets";

const PRICE_LABEL = "£1.49";

export default function CreateSealPage() {
  const navigate = useNavigate();
  const { wishId, recipient, themeId, channel, paymentPhone, setPaymentPhone } =
    useWizardStore();
  const { themes } = useThemes();
  const [charging, setCharging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wishId || !recipient) navigate("/create/who", { replace: true });
  }, [wishId, recipient, navigate]);

  const theme = themes.find((t) => t.id === themeId);
  const channelLabel =
    channel === "whatsapp" ? "WhatsApp" : channel === "sms" ? "SMS" : "Private link";

  async function handlePay(e: FormEvent) {
    e.preventDefault();
    if (!wishId) return;
    setError(null);
    setCharging(true);
    const result = await chargeMobileMoney(wishId, paymentPhone);
    setCharging(false);
    if (result.success) {
      navigate("/create/scheduled");
    } else {
      setError(result.failureReason ?? "The charge could not be completed.");
      navigate("/create/payment-failed");
    }
  }

  return (
    <CreateLayout activeIndex={3}>
      <section className="grid gap-6 sm:grid-cols-[1.1fr_1fr] sm:gap-10">
        <div>
          <span className="text-[10px] font-extrabold tracking-[0.14em] text-champagne">
            LAST LOOK BEFORE IT'S SEALED
          </span>
          <h1 className="my-3 font-display text-[clamp(30px,4vw,44px)] leading-[1.05]">
            Ready to seal {recipient?.name ?? "this"}'s wish?
          </h1>
          <p className="text-[13px] leading-[1.6] text-porcelain/70">
            A small Mobile Money fee confirms the keeping and delivery of this
            wish. Nothing else changes about your letter.
          </p>
        </div>

        <aside className="rounded-lg bg-porcelain p-6 text-ink shadow-card">
          <div className="mb-4 aspect-square w-full overflow-hidden rounded-md">
            <img
              src={ASSETS.paymentSealedLetter.src}
              alt={ASSETS.paymentSealedLetter.alt}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-[10px] font-extrabold tracking-[0.14em] text-mulberry">
            READY TO HOLD
          </span>
          <h2 className="my-[5px] mb-[15px] font-display text-[29px]">
            {recipient?.name ?? "Their"}'s birthday wish
          </h2>

          <div className="flex justify-between gap-[10px] border-t border-plum/[0.13] py-[13px] text-[12px]">
            <span>Delivery</span>
            <b>
              {recipient ? formatWeekdayDate(recipient.birthdayISO) : "—"} ·{" "}
              {recipient?.deliveryTime ?? "—"}
            </b>
          </div>
          <div className="flex justify-between gap-[10px] border-t border-plum/[0.13] py-[13px] text-[12px]">
            <span>Theme</span>
            <b>{theme?.name ?? "Not chosen"}</b>
          </div>
          <div className="flex justify-between gap-[10px] border-t border-plum/[0.13] py-[13px] text-[12px]">
            <span>Notification</span>
            <b>{channelLabel}</b>
          </div>
          <div className="flex justify-between gap-[10px] border-t border-plum/[0.13] py-[13px] text-[12px]">
            <span>Wish keeping & delivery</span>
            <b>{PRICE_LABEL}</b>
          </div>

          <form onSubmit={handlePay} className="mt-3">
            <label className="mb-1 block text-[10px] font-extrabold tracking-[0.1em] text-mulberry">
              MOBILE MONEY NUMBER
            </label>
            <input
              required
              value={paymentPhone}
              onChange={(e) => setPaymentPhone(e.target.value)}
              placeholder="e.g. 024 123 4567"
              className="mb-3 w-full rounded-md border border-plum/20 bg-transparent px-3 py-[12px] text-[13px] font-bold text-ink outline-none placeholder:font-normal placeholder:text-ink/40"
            />
            {error && <p className="mb-3 text-[12px] text-mulberry">{error}</p>}
            <Button type="submit" disabled={charging} className="w-full">
              {charging ? "Charging…" : `Seal my wish — ${PRICE_LABEL}`}
            </Button>
          </form>
        </aside>
      </section>
    </CreateLayout>
  );
}
