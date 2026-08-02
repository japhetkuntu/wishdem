import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { CreateLayout } from "@/components/CreateLayout";
import { ThemeCard, ThemePreviewPanel } from "@/components/ThemeCard";
import { useThemes } from "@/hooks/useThemes";
import { useWizardStore } from "@/store/wizardStore";
import { saveThemeStep } from "@/lib/api";
import type { ThemeId } from "@/types";

export default function CreateThemePage() {
  const navigate = useNavigate();
  const { themes } = useThemes();
  const { wishId, recipient, themeId, setTheme, markSaved } = useWizardStore();
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
      await saveThemeStep(wishId, selected, recipient ?? undefined);
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
      <h1 className="font-display text-[clamp(32px,5vw,54px)] leading-[1.03]">
        Choose the vessel
        <br />
        for {recipient?.name ? `${recipient.name}'s` : "their"} letter.
      </h1>
      <p className="mb-6 mt-2 text-porcelain/70">
        The words stay the same. The way they arrive becomes yours to choose.
      </p>

      <section className="grid gap-4 sm:grid-cols-[1.45fr_.75fr]">
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

        <ThemePreviewPanel
          theme={selectedTheme}
          footer={
            <>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={!selected || saving}
                className="mt-5 w-full"
              >
                {saving ? "Saving…" : "Continue to seal & schedule →"}
              </Button>
              {error && <p className="mt-3 text-[12px] text-mulberry">{error}</p>}
            </>
          }
        />
      </section>
    </CreateLayout>
  );
}
