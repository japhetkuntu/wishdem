import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Button } from "@wishdem/design-system";
import { AppNav } from "@/components/AppNav";
import { useGroupWishes } from "@/hooks/useGroupWishes";
import type { GroupWishFormat } from "@/types";

const FORMAT_OPTIONS: { key: GroupWishFormat; label: string }[] = [
  { key: "notes", label: "Notes" },
  { key: "photos", label: "Photos" },
  { key: "voice", label: "Voice notes" },
  { key: "video", label: "Short videos" },
];

function formatDateLabel(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function GroupWishSetupPage() {
  const navigate = useNavigate();
  const { create } = useGroupWishes();

  const [recipientName, setRecipientName] = useState("Maya Chen");
  const [occasion, setOccasion] = useState("Birthday");
  const [deliveryDateISO, setDeliveryDateISO] = useState("");
  const [collectByISO, setCollectByISO] = useState("");
  const [context, setContext] = useState("");
  const [formats, setFormats] = useState<GroupWishFormat[]>(["notes", "photos"]);
  const [namesVisible, setNamesVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = `${recipientName.trim().split(" ")[0] || "Their"}'s ${occasion || "Memory"} Book`;

  function toggleFormat(key: GroupWishFormat) {
    setFormats((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!recipientName.trim() || !deliveryDateISO || !collectByISO) return;
    setSaving(true);
    setError(null);
    try {
      const wish = await create({
        title,
        recipientName: recipientName.trim(),
        occasion,
        deliveryDateLabel: formatDateLabel(deliveryDateISO),
        collectByLabel: formatDateLabel(collectByISO),
        deliveryDateISO,
        collectByISO,
        context: context.trim() || undefined,
        formats,
        namesVisible,
      });
      navigate(`/group-wishes/${wish.id}/invite`);
    } catch {
      setError("We couldn't save that just now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 pb-[104px] pt-6 sm:px-8 sm:pb-9">
      <AppNav active="groupWishes" />

      <section className="grid gap-8 py-8 sm:grid-cols-[1.15fr_.85fr] sm:gap-14 sm:py-10">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg bg-paper p-6 text-ink shadow-card"
        >
          <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-mulberry">
            GROUP WISH · STEP 1 OF 2
          </span>
          <h1 className="mb-4 font-display text-[28px] leading-[1.05]">Set the moment.</h1>

          <label className="mb-[6px] block text-[9px] font-extrabold tracking-[0.08em]">
            WHO IS IT FOR
          </label>
          <input
            required
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="e.g. Maya Chen"
            className="w-full rounded-sm border border-plum/[0.13] bg-background px-3 py-[11px] text-[12px] font-semibold text-ink outline-none"
          />

          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
            <div>
              <label className="mb-[6px] mt-[15px] block text-[9px] font-extrabold tracking-[0.08em]">
                OCCASION
              </label>
              <input
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="Birthday"
                className="w-full rounded-sm border border-plum/[0.13] bg-background px-3 py-[11px] text-[12px] font-semibold text-ink outline-none"
              />
            </div>
            <div>
              <label className="mb-[6px] mt-[15px] block text-[9px] font-extrabold tracking-[0.08em]">
                DELIVERY DATE
              </label>
              <input
                id="group-wish-delivery-date"
                required
                type="date"
                value={deliveryDateISO}
                onChange={(e) => setDeliveryDateISO(e.target.value)}
                className="w-full rounded-sm border border-plum/[0.13] bg-background px-3 py-[11px] text-[12px] font-semibold text-ink outline-none"
              />
            </div>
          </div>

          <label className="mb-[6px] mt-[15px] block text-[9px] font-extrabold tracking-[0.08em]">
            COLLECT MEMORIES BY
          </label>
          <input
            id="group-wish-collect-by-date"
            required
            type="date"
            value={collectByISO}
            onChange={(e) => setCollectByISO(e.target.value)}
            className="w-full rounded-sm border border-plum/[0.13] bg-background px-3 py-[11px] text-[12px] font-semibold text-ink outline-none"
          />

          <label className="mb-[6px] mt-[15px] block text-[9px] font-extrabold tracking-[0.08em]">
            CONTEXT <span className="font-medium text-ink/50">· optional</span>
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Tell contributors what this moment is about."
            rows={3}
            className="w-full resize-none rounded-sm border border-plum/[0.13] bg-background px-3 py-[11px] text-[12px] font-semibold text-ink outline-none"
          />

          <label className="mb-[6px] mt-[15px] block text-[9px] font-extrabold tracking-[0.08em]">
            WHAT CAN PEOPLE SHARE?
          </label>
          <div className="flex flex-wrap gap-[6px]">
            {FORMAT_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleFormat(option.key)}
                className={clsx(
                  "rounded-pill border border-plum/[0.15] px-[10px] py-2 text-[9px] font-extrabold",
                  formats.includes(option.key) ? "border-mulberry bg-mulberry text-[#F6F0E8]" : "text-ink/70",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="mb-[6px] mt-[15px] block text-[9px] font-extrabold tracking-[0.08em]">
            JOINING &amp; VISIBILITY
          </label>
          <button
            type="button"
            onClick={() => setNamesVisible(!namesVisible)}
            className="flex w-full items-start gap-[10px] rounded-sm border border-plum/[0.13] bg-background p-3 text-left"
          >
            <span
              className={clsx(
                "mt-[2px] grid h-[16px] w-[16px] flex-none place-items-center rounded-full border-2",
                namesVisible ? "border-mulberry bg-mulberry text-[#F6F0E8]" : "border-plum/25",
              )}
            >
              {namesVisible && "✓"}
            </span>
            <span className="text-[10px] leading-[1.5] text-ink/75">
              <b className="block text-[11px] text-ink">
                Let people join and add their memory later.
              </b>
              Anyone with the invite can add their note, photo, or clip up until the
              collection deadline.
            </span>
          </button>

          {error && <p className="mt-3 text-[12px] text-mulberry">{error}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-[9px]">
            <Button type="submit" variant="dark" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Create & Invite"}
            </Button>
            <span className="text-[9px] text-ink/55">Saved as a draft while you work.</span>
          </div>
        </form>

        <aside className="grid content-start gap-[14px]">
          <div className="rounded-lg bg-mulberry p-[18px] text-porcelain [--wd-ink-on-canvas-rgb:246_240_232]">
            <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
              A GROUP WISH
            </span>
            <h2 className="my-1 font-display text-[24px] leading-[1.15]">
              One memory book, everyone's handwriting.
            </h2>
            <p className="text-[12px] leading-[1.6] text-porcelain/75">
              Invite the people who love {recipientName.trim().split(" ")[0] || "them"} too, and let
              their notes, photos, and voices arrive together as one gift.
            </p>
          </div>

          {[
            {
              label: "Set the moment",
              note: "Choose who it's for, when it delivers, and what people can add.",
            },
            {
              label: "Invite your circle",
              note: "Share a link, message, or QR code — no account required to contribute.",
            },
            {
              label: "It arrives as one gift",
              note: "Every memory is bound together and delivered on the date you choose.",
            },
          ].map((rule) => (
            <div key={rule.label} className="rounded-lg border border-champagne/45 p-[18px]">
              <b className="mb-1 block text-[12px]">{rule.label}</b>
              <p className="text-[11px] leading-[1.5] text-porcelain/65">{rule.note}</p>
            </div>
          ))}

          <p className="rounded-lg bg-porcelain/[0.04] p-[14px] text-[10px] leading-[1.5] text-porcelain/55">
            Only people you invite can see or contribute to this memory book. You choose
            whether their names stay visible to the group.
          </p>
        </aside>
      </section>
    </main>
  );
}
