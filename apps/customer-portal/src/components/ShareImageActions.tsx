import clsx from "clsx";
import { ShareableWishCard, type ShareableWishCardProps } from "@/components/ShareableWishCard";
import { useShareableImage } from "@/hooks/useShareableImage";

export interface ShareImageActionsProps extends ShareableWishCardProps {
  filename: string;
  tone?: "dark" | "light";
  className?: string;
}

const PREVIEW_SIZE = 168;
const CARD_SIZE = 1080;
const PREVIEW_SCALE = PREVIEW_SIZE / CARD_SIZE;

/** Renders the shareable card (with a small visible preview) and exposes download/share buttons for it. */
export function ShareImageActions({
  filename,
  tone = "dark",
  className,
  ...cardProps
}: ShareImageActionsProps) {
  const { elementRef, busy, error, download, share } = useShareableImage(filename);

  const buttonClass = clsx(
    "inline-flex h-10 items-center gap-2 rounded-pill border px-4 text-[11px] font-extrabold transition-colors disabled:opacity-50",
    tone === "dark"
      ? "border-porcelain/30 text-porcelain hover:border-champagne hover:text-champagne"
      : "border-plum/25 text-plum hover:border-mulberry hover:text-mulberry",
  );

  return (
    <div className={clsx("flex flex-wrap items-center gap-[16px]", className)}>
      <div
        style={{
          width: PREVIEW_SIZE,
          height: PREVIEW_SIZE,
          overflow: "hidden",
          borderRadius: 14,
          flexShrink: 0,
          boxShadow: "0 8px 22px rgba(13,6,14,0.35)",
        }}
      >
        <div
          style={{
            width: CARD_SIZE,
            height: CARD_SIZE,
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: "top left",
          }}
        >
          <ShareableWishCard ref={elementRef} {...cardProps} />
        </div>
      </div>

      <div className="flex flex-col gap-[8px]">
        <div className="flex flex-wrap gap-[8px]">
          <button type="button" onClick={share} disabled={busy} className={buttonClass}>
            <ImageIcon />
            {busy ? "Preparing…" : "Share as image"}
          </button>
          <button type="button" onClick={download} disabled={busy} className={buttonClass}>
            <DownloadIcon />
            Download
          </button>
        </div>
        {error && <p className="text-[11px] text-rose">{error}</p>}
      </div>
    </div>
  );
}

function ImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12m0 0-4-4m4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
