import { forwardRef } from "react";

export interface ShareableWishCardProps {
  /** "teaser" is shown to the sender right after sealing — it must never leak the
   * private message before the recipient opens it. "opened" is shown to the
   * recipient after they've broken the seal, so a short quote is safe to include. */
  variant: "teaser" | "opened";
  recipientName: string;
  fromName: string;
  dateLabel: string;
  quote?: string;
  /** The chosen theme's vessel photo — the same artwork shown during the wizard/reveal,
   * used here as the card's full-bleed backdrop so the export actually looks like the
   * wish itself instead of a generic gradient. */
  imageSrc: string;
}

const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Manrope', -apple-system, sans-serif";

/**
 * A fixed 1080x1080 branded card, sized for Instagram/X/Facebook/WhatsApp previews
 * alike. Rendered off-screen (or visibly, scaled down) and captured to PNG via
 * html-to-image — see useDownloadImage.
 */
export const ShareableWishCard = forwardRef<HTMLDivElement, ShareableWishCardProps>(
  function ShareableWishCard({ variant, recipientName, fromName, dateLabel, quote, imageSrc }, ref) {
    const cleanQuote = quote?.replace(/\s+/g, " ").trim();
    const truncated = cleanQuote && cleanQuote.length > 150;
    const displayQuote = truncated ? `${cleanQuote!.slice(0, 150).trimEnd()}…` : cleanQuote;

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1080,
          position: "relative",
          overflow: "hidden",
          fontFamily: SANS,
          color: "#F6F0E8",
          background: "#1B111D",
        }}
      >
        <img
          src={imageSrc}
          crossOrigin="anonymous"
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.78) saturate(1.08)",
          }}
        />

        {/* Scrim: dark from the bottom up, plus a top wash so the wordmark reads cleanly. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(10,4,11,0.94) 0%, rgba(10,4,11,0.75) 30%, rgba(10,4,11,0.05) 58%, rgba(10,4,11,0.35) 100%)",
          }}
        />

        {/* Frame */}
        <div
          style={{
            position: "absolute",
            inset: 40,
            border: "1.5px solid rgba(246,240,232,0.55)",
            borderRadius: 32,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 76,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 32, fontWeight: 800 }}>
            Wish
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                background: "#E6C87A",
                display: "inline-block",
              }}
            />
            Dem
          </div>

          <div style={{ maxWidth: 900 }}>
            <div
              style={{
                display: "inline-block",
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 3,
                color: "#1B111D",
                background: "#E6C87A",
                padding: "10px 20px",
                borderRadius: 999,
                marginBottom: 30,
              }}
            >
              {variant === "teaser" ? "A FUTURE WISH, SEALED" : `FOR ${recipientName.toUpperCase()}`}
            </div>

            <div
              style={{
                fontFamily: SERIF,
                fontSize: variant === "teaser" ? 88 : displayQuote ? 58 : 88,
                lineHeight: 1.08,
                marginBottom: 32,
                textShadow: "0 2px 24px rgba(0,0,0,0.45)",
              }}
            >
              {variant === "teaser" ? (
                <>
                  A wish for
                  <br />
                  <i>{recipientName}</i> is kept.
                </>
              ) : displayQuote ? (
                <>“{displayQuote}”</>
              ) : (
                <>
                  {recipientName}'s wish
                  <br />
                  is <i>open.</i>
                </>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontSize: 28,
                color: "rgba(246,240,232,0.85)",
                borderTop: "1px solid rgba(246,240,232,0.3)",
                paddingTop: 26,
              }}
            >
              <span style={{ fontWeight: 800, color: "#F6F0E8" }}>{fromName}</span>
              <span style={{ opacity: 0.6 }}>·</span>
              <span>{variant === "teaser" ? `Arrives ${dateLabel}` : dateLabel}</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
