import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Button } from "@wishdem/design-system";
import { CreateLayout } from "@/components/CreateLayout";
import { useWizardStore } from "@/store/wizardStore";
import { saveDeliverStep } from "@/lib/api";
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

export default function CreateDeliverPage() {
  const navigate = useNavigate();
  const { wishId, recipient, channel, setChannel, markSaved } = useWizardStore();
  const [selected, setSelected] = useState<DeliveryChannel | null>(channel);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!wishId) navigate("/create/who", { replace: true });
  }, [wishId, navigate]);

  async function handleContinue() {
    if (!wishId || !selected) return;
    setSaving(true);
    await saveDeliverStep(wishId, selected);
    setChannel(selected);
    markSaved();
    setSaving(false);
    navigate("/create/seal");
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
                  ? "border-champagne bg-mulberry"
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

      <Button
        type="button"
        onClick={handleContinue}
        disabled={!selected || saving}
        className="mt-7"
      >
        {saving ? "Saving…" : "Continue to seal →"}
      </Button>
    </CreateLayout>
  );
}
