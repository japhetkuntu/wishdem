import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { Seo } from "@/components/Seo";
import { CreateLayout } from "@/components/CreateLayout";
import { StickyMobileAction } from "@/components/StickyMobileAction";
import { ThemeCard, ThemePreviewPanel } from "@/components/ThemeCard";
import { AttachmentPicker } from "@/components/AttachmentPicker";
import { useThemes } from "@/hooks/useThemes";
import { useWizardStore } from "@/store/wizardStore";
import { saveThemeStep } from "@/lib/api";
import type { ThemeId } from "@/types";

export default function CreateThemePage() {
  const navigate = useNavigate();
  const { themes } = useThemes();
  const { wishId, recipient, fromName, themeId, attachment, setAttachment, setTheme, markSaved } =
    useWizardStore();
  const [selected, setSelected] = useState<ThemeId | null>(themeId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wishId) navigate("/create/who", { replace: true });
  }, [wishId, navigate]);

  const selectedTheme = themes.find((t) => t.id === selected);

  async function handleContinue() {
    if (!wishId || !selected) return;
    setSaving(true);
    setError(null);
    try {
      await saveThemeStep(wishId, selected, recipient ?? undefined, fromName);
      setTheme(selected);
      markSaved();
      navigate("/create/deliver");
    } catch {
      setError("We couldn't save that just now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CreateLayout activeIndex={2}>
      <Seo
        title="Choose a Theme — WishDem"
        description="Choose how your private letter will look and arrive."
        path="/create/theme"
        noindex
      />
      <h1 className="font-display text-[clamp(32px,5vw,54px)] leading-[1.03]">
        Choose the vessel
        <br />
        for {recipient?.name ? `${recipient.name}'s` : "their"} letter.
      </h1>
      <p className="mb-6 mt-2 text-porcelain/70">
        The words stay the same. The way they arrive becomes yours to choose.
      </p>

      <section className="grid gap-4 sm:grid-cols-[1.45fr_.75fr]">
        {/* order-first + sticky: on mobile the theme grid runs long, so without this the
            preview (and the result of tapping a theme) would sit below the fold. Pinning
            it to the top of the viewport means selecting a theme shows its result
            instantly, with zero scrolling — on sm:+ it reverts to the normal side-by-side
            column order and just stays in view while the (much shorter) list scrolls. */}
        <div className="order-first sm:order-2 sm:sticky sm:top-6 sm:self-start">
          <ThemePreviewPanel
            theme={selectedTheme}
            footer={
              <StickyMobileAction>
                <Button type="button" onClick={handleContinue} disabled={!selected || saving}>
                  {saving ? "Saving…" : "Continue to seal & schedule →"}
                </Button>
                {error && <p className="text-[12px] text-rose sm:mt-3 sm:text-mulberry">{error}</p>}
              </StickyMobileAction>
            }
          />
        </div>

        <div className="order-last sm:order-1">
          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 sm:gap-[15px]">
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                selected={selected === theme.id}
                onSelect={() => setSelected(theme.id)}
              />
            ))}
          </div>

          <p className="mt-5 text-[13px]">
            <b className="font-extrabold">Add one memory, if you'd like.</b> One
            optional attachment per wish.
          </p>
          <div className="mt-2">
            <AttachmentPicker value={attachment} onChange={setAttachment} wishId={wishId ?? ""} />
          </div>
        </div>
      </section>
    </CreateLayout>
  );
}
