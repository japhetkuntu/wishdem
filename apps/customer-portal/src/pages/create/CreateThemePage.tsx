import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Button } from "@wishdem/design-system";
import { Seo } from "@/components/Seo";
import { CreateLayout } from "@/components/CreateLayout";
import { StickyMobileAction } from "@/components/StickyMobileAction";
import { ThemeCard, ThemePreviewPanel } from "@/components/ThemeCard";
import { AttachmentPicker } from "@/components/AttachmentPicker";
import { WishPreviewModal } from "@/components/WishPreviewModal";
import { useThemes } from "@/hooks/useThemes";
import { useWizardStore } from "@/store/wizardStore";
import { saveThemeAndDeliverStep, sealWish } from "@/lib/api";
import { ApiError } from "@/lib/httpClient";
import type { DeliveryChannel, ThemeId } from "@/types";

const ROUTES: {
  id: DeliveryChannel;
  index: string;
  title: string;
  description: string;
}[] = [
  {
    id: "sms",
    index: "01",
    title: "Send by text",
    description: "The simplest way — we text them a link straight to their private opening moment.",
  },
  {
    id: "link",
    index: "02",
    title: "Just give me the link",
    description: "For when you'd rather see it first yourself, or send it to someone else to pass along — most people prefer text.",
  },
];

const NEEDS_PHONE_NUMBER: DeliveryChannel[] = ["sms"];

/** Was two separate wizard steps (theme, then delivery+seal) — merged into one, since
 * both are really just "how it looks and arrives," and splitting them cost an extra
 * click-through for no real decision-making benefit. */
export default function CreateThemePage() {
  const navigate = useNavigate();
  const { themes } = useThemes();
  const {
    wishId,
    recipient,
    fromName,
    message,
    themeId,
    attachment,
    channel,
    setAttachment,
    setTheme,
    setChannel,
    setRecipient,
    setWishId,
    markSaved,
  } = useWizardStore();
  const [selectedTheme, setSelectedTheme] = useState<ThemeId | null>(themeId);
  const [selectedChannel, setSelectedChannel] = useState<DeliveryChannel | null>(channel);
  const [phoneNumber, setPhoneNumber] = useState(recipient?.phoneNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  // The theme grid used to sit permanently at the top of this step, pushing the actual
  // decisions (attachment, delivery, seal) below a wall of photos — most people don't
  // have a strong opinion on the envelope colour and just want to move on. Now a sensible
  // default is picked automatically and the picker only opens if someone actually wants
  // to change it, keeping the main flow to what genuinely needs a decision.
  const [pickingTheme, setPickingTheme] = useState(false);

  useEffect(() => {
    if (!wishId) navigate("/create/who", { replace: true });
  }, [wishId, navigate]);

  useEffect(() => {
    if (!selectedTheme && themes.length > 0) setSelectedTheme(themes[0].id);
  }, [selectedTheme, themes]);

  // Testers reported that a bare "here's a link" delivery feels like spam — most people
  // won't tap a random link from an unknown number. Text message is the default now;
  // the link stays available for the minority who want to preview it themselves first
  // or forward it on, but nobody has to actively choose SMS to get the safer default.
  useEffect(() => {
    if (!selectedChannel) setSelectedChannel("sms");
  }, [selectedChannel]);

  const selectedThemeObj = themes.find((t) => t.id === selectedTheme);
  const needsPhoneNumber = selectedChannel !== null && NEEDS_PHONE_NUMBER.includes(selectedChannel);
  const canSeal =
    !!selectedTheme && !!selectedChannel && (!needsPhoneNumber || phoneNumber.trim().length > 0);

  async function handleSeal() {
    if (!wishId || !selectedTheme || !selectedChannel || !canSeal) return;
    setSaving(true);
    setError(null);
    try {
      const trimmedPhone = needsPhoneNumber ? phoneNumber.trim() : undefined;
      const saved = await saveThemeAndDeliverStep(wishId, selectedTheme, selectedChannel, recipient ?? undefined, trimmedPhone, fromName);
      // saveThemeAndDeliverStep can recover onto a *different* wish id than the one we
      // called it with (ensureWish silently recreates the wish if the original id 404s
      // server-side) — sealing the stale id from the store instead of `saved.id` would
      // 404 forever, failing identically on every retry.
      if (saved.id !== wishId) setWishId(saved.id);
      setTheme(selectedTheme);
      setChannel(selectedChannel);
      if (recipient && trimmedPhone) setRecipient({ ...recipient, phoneNumber: trimmedPhone });
      await sealWish(saved.id);
      markSaved();
      navigate("/create/scheduled");
    } catch (err) {
      // A generic "try again" message here used to hide the real reason (daily wish
      // limit hit, the draft's wish record missing after a guest sign-in, a validation
      // error) — surfacing the backend's actual message makes the failure fixable
      // instead of just repeatable.
      setError(
        err instanceof ApiError
          ? err.message
          : "We couldn't reach WishDem just now — check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <CreateLayout activeIndex={2}>
      <Seo
        title="Choose a Look & Seal It — WishDem"
        description="Choose how your private letter looks and arrives, then seal it — free, no app required."
        path="/create/theme"
        noindex
      />
      <h1 className="font-display text-[clamp(32px,5vw,54px)] leading-[1.03]">
        Almost there —
        <br />
        how should it arrive?
      </h1>
      <p className="mb-6 mt-2 text-porcelain/70">
        We've already picked a look for {recipient?.name ?? "their"} letter. Choose how it
        reaches them, and seal it.
      </p>

      <section className="grid gap-4 sm:grid-cols-[1.45fr_.75fr]">
        {/* order-first + sticky: on mobile this section runs long (attachment picker,
            delivery choice), so without this the preview/seal action would sit below the
            fold — see StickyMobileAction and CreateWhoPage's near-identical reasoning for
            the same pattern. */}
        <div className="order-first sm:order-2 sm:sticky sm:top-6 sm:self-start">
          <ThemePreviewPanel
            theme={selectedThemeObj}
            footer={
              <StickyMobileAction>
                <Button type="button" onClick={handleSeal} disabled={!canSeal || saving}>
                  {saving ? "Sealing…" : "Seal this wish →"}
                </Button>
                <button
                  type="button"
                  onClick={() => setPreviewing(true)}
                  className="text-[11px] font-extrabold text-champagne"
                >
                  Preview your wish →
                </button>
                {error && <p className="text-[12px] text-rose sm:mt-3 sm:text-mulberry">{error}</p>}
              </StickyMobileAction>
            }
          />
          {/* The theme grid used to live permanently in the main flow — most senders don't
              have a strong opinion on it, so it's tucked behind this toggle instead and
              only expands if someone actually wants a different look. */}
          <button
            type="button"
            onClick={() => setPickingTheme((v) => !v)}
            className="mt-3 text-[11px] font-extrabold text-champagne"
          >
            {pickingTheme ? "Hide looks ↑" : "Not this look? Change it →"}
          </button>
          {pickingTheme && (
            <div className="mt-3 grid grid-cols-2 gap-[10px]">
              {themes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  selected={selectedTheme === theme.id}
                  onSelect={() => {
                    setSelectedTheme(theme.id);
                    setPickingTheme(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="order-last sm:order-1">
          <p className="text-[13px]">
            <b className="font-extrabold">Add one memory, if you'd like.</b> One
            optional attachment per wish.
          </p>
          <div className="mt-2">
            <AttachmentPicker value={attachment} onChange={setAttachment} wishId={wishId ?? ""} />
          </div>

          <p className="mb-2 mt-6 text-[13px]">
            <b className="font-extrabold">
              How will {recipient?.name ?? "they"} find it?
            </b>
          </p>
          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
            {ROUTES.map((route) => {
              const active = selectedChannel === route.id;
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => setSelectedChannel(route.id)}
                  className={clsx(
                    "min-h-[110px] rounded-md border p-[14px] text-left transition-colors",
                    active
                      ? "border-champagne bg-mulberry text-porcelain [--wd-ink-on-canvas-rgb:246_240_232]"
                      : "border-porcelain/25 bg-transparent",
                  )}
                >
                  <span className="text-[11px] text-porcelain/60">{route.index}</span>
                  <b className="my-[5px] block">{route.title}</b>
                  <p className="text-[11px] leading-[1.5] text-porcelain/70">{route.description}</p>
                </button>
              );
            })}
          </div>

          {needsPhoneNumber && (
            <div className="mt-4">
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
                SMS delivery needs a number to reach them — they never need a WishDem account.
              </p>
            </div>
          )}
        </div>
      </section>

      {previewing && (
        <WishPreviewModal
          recipientName={recipient?.name ?? ""}
          occasionDateISO={recipient?.occasionDateISO ?? ""}
          fromName={fromName}
          message={message}
          attachment={attachment}
          onClose={() => setPreviewing(false)}
        />
      )}
    </CreateLayout>
  );
}
