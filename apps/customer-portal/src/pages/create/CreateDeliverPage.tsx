import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Button } from "@wishdem/design-system";
import { CreateLayout } from "@/components/CreateLayout";
import { useWizardStore } from "@/store/wizardStore";
import { saveDeliverStep, sealWish } from "@/lib/api";
import type { DeliveryChannel } from "@/types";

const ROUTES: {
  id: DeliveryChannel;
  index: string;
  title: string;
  description: string;
}[] = [
  {
    id: "whatsapp",
    index: "01",
    title: "Send by WhatsApp",
    description: "A private birthday message carries them to their unopened wish.",
  },
  {
    id: "sms",
    index: "02",
    title: "Send by text",
    description: "A simple SMS brings them to their private opening link.",
  },
  {
    id: "link",
    index: "03",
    title: "Give me the link",
    description: "You share the private opening link yourself.",
  },
];

const NEEDS_PHONE_NUMBER: DeliveryChannel[] = ["whatsapp", "sms"];

export default function CreateDeliverPage() {
  const navigate = useNavigate();
  const { wishId, recipient, channel, setChannel, setRecipient, markSaved } = useWizardStore();
  const [selected, setSelected] = useState<DeliveryChannel | null>(channel);
  const [phoneNumber, setPhoneNumber] = useState(recipient?.phoneNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wishId) navigate("/create/who", { replace: true });
  }, [wishId, navigate]);

  const needsPhoneNumber = selected !== null && NEEDS_PHONE_NUMBER.includes(selected);
  const canContinue = !!selected && (!needsPhoneNumber || phoneNumber.trim().length > 0);

  async function handleContinue() {
    if (!wishId || !selected || !canContinue) return;
    setSaving(true);
    setError(null);
    try {
      const trimmedPhone = needsPhoneNumber ? phoneNumber.trim() : undefined;
      await saveDeliverStep(wishId, selected, recipient ?? undefined, trimmedPhone);
      setChannel(selected);
      if (recipient && trimmedPhone) setRecipient({ ...recipient, phoneNumber: trimmedPhone });
      await sealWish(wishId);
      markSaved();
      navigate("/create/scheduled");
    } catch {
      setError("We couldn't save that just now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CreateLayout activeIndex={3}>
      <span className="text-[10px] font-extrabold tracking-[0.14em] text-champagne">
        HOW WILL {recipient?.name?.toUpperCase() ?? "THEY"} FIND THEIR WISH?
      </span>
      <h1 className="my-3 max-w-[560px] font-display text-[clamp(32px,5vw,55px)] leading-[1.05]">
        Let the unopened
        <br />
        gift find them.
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-[10px] sm:grid-cols-3">
        {ROUTES.map((route) => {
          const active = selected === route.id;
          return (
            <button
              key={route.id}
              type="button"
              onClick={() => setSelected(route.id)}
              className={clsx(
                "min-h-[130px] rounded-md border p-[17px] text-left transition-colors sm:min-h-[155px]",
                active
                  ? "border-champagne bg-mulberry text-porcelain [--wd-ink-on-canvas-rgb:246_240_232]"
                  : "border-porcelain/25 bg-transparent",
              )}
            >
              <span className="text-[11px] text-porcelain/60">{route.index}</span>
              <b className="my-[7px] block">{route.title}</b>
              <p className="text-[11px] leading-[1.5] text-porcelain/70">
                {route.description}
              </p>
            </button>
          );
        })}
      </div>

      {needsPhoneNumber && (
        <div className="mt-6 max-w-[360px]">
          <label className="mb-1 block text-[10px] font-extrabold tracking-[0.1em] text-champagne">
            {recipient?.name ?? "THEIR"} PHONE NUMBER
          </label>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g. 024 123 4567"
            className="w-full rounded-md border border-porcelain/25 bg-transparent px-3 py-[12px] text-[13px] font-bold text-porcelain outline-none placeholder:font-normal placeholder:text-porcelain/40"
          />
          <p className="mt-2 text-[11px] leading-[1.5] text-porcelain/60">
            {selected === "whatsapp" ? "WhatsApp" : "SMS"} delivery needs a number to reach
            them — they never need a WishDem account.
          </p>
        </div>
      )}

      <Button
        type="button"
        onClick={handleContinue}
        disabled={!canContinue || saving}
        className="mt-7"
      >
        {saving ? "Sealing…" : "Seal this wish →"}
      </Button>
      {error && <p className="mt-3 text-[12px] text-rose">{error}</p>}
    </CreateLayout>
  );
}
