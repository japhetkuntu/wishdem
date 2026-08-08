import { useEffect, useState } from "react";
import clsx from "clsx";

export interface ShareLinksProps {
  url: string;
  /** Prefilled text for WhatsApp/X/native share — not used by Facebook, which only
   * accepts a URL. */
  shareText: string;
  /** "dark" for use on the plum/mulberry background, "light" for a porcelain card. */
  tone?: "dark" | "light";
  className?: string;
}

/**
 * A small set of share affordances built entirely from platform share-intent URLs and
 * the Web Share API — no SDKs, no new dependency. Instagram, TikTok, and Snapchat don't
 * support "share this URL" via a web link at all, so they're deliberately left out rather
 * than shown as buttons that can't actually do anything; the native share sheet (shown
 * only where `navigator.share` exists, i.e. mostly mobile) is what reaches those apps.
 */
export function ShareLinks({ url, shareText, tone = "dark", className }: ShareLinksProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard access can be denied — the link is still visible/selectable to the user.
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title: "WishDem", text: shareText, url });
    } catch {
      // The user cancelled the share sheet, or the browser rejected it — nothing to do.
    }
  }

  function openShareWindow(href: string) {
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=600");
  }

  const iconButtonClass = clsx(
    "grid h-10 w-10 place-items-center rounded-full border transition-colors",
    tone === "dark"
      ? "border-porcelain/30 text-porcelain hover:border-champagne hover:text-champagne"
      : "border-plum/25 text-plum hover:border-mulberry hover:text-mulberry",
  );

  return (
    <div className={clsx("flex flex-wrap items-center gap-[10px]", className)}>
      <button
        type="button"
        onClick={handleCopy}
        className={clsx(
          "inline-flex h-10 items-center gap-2 rounded-pill border px-4 text-[11px] font-extrabold transition-colors",
          tone === "dark"
            ? "border-porcelain/30 text-porcelain hover:border-champagne hover:text-champagne"
            : "border-plum/25 text-plum hover:border-mulberry hover:text-mulberry",
        )}
      >
        <LinkIcon />
        {copied ? "Copied!" : "Copy link"}
      </button>

      {canNativeShare && (
        <button type="button" onClick={handleNativeShare} className={iconButtonClass} aria-label="Share">
          <ShareIcon />
        </button>
      )}

      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={iconButtonClass}
        aria-label="Share on WhatsApp"
      >
        <WhatsAppIcon />
      </a>

      <button
        type="button"
        onClick={() =>
          openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
        }
        className={iconButtonClass}
        aria-label="Share on Facebook"
      >
        <FacebookIcon />
      </button>

      <button
        type="button"
        onClick={() =>
          openShareWindow(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`,
          )
        }
        className={iconButtonClass}
        aria-label="Share on X"
      >
        <XIcon />
      </button>
    </div>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07l-1.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.5-1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" strokeLinecap="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.1h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.55-3.7 8.25-8.24 8.25Zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.4 1.02 2.57.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.23-.17-.48-.29Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 21v-7.6h2.55l.38-2.96h-2.93V8.55c0-.86.24-1.44 1.47-1.44h1.57V4.46c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.8 1.38-3.8 3.9v2.18H7.9v2.96h2.56V21h3.04Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 2H22l-7.6 8.68L23.3 22h-6.9l-5.4-7.06L4.8 22H1.7l8.13-9.29L1 2h7.07l4.88 6.46L18.9 2Zm-1.2 18.2h1.7L7.4 3.7H5.58L17.7 20.2Z" />
    </svg>
  );
}
