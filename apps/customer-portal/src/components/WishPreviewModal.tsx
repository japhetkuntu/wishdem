import { useEffect } from "react";
import { AttachmentDisplay } from "@/components/AttachmentDisplay";
import { formatWeekdayDate } from "@/lib/date";
import type { Attachment } from "@/types";

export interface WishPreviewModalProps {
  recipientName: string;
  birthdayISO: string;
  fromName: string;
  message: string;
  attachment: Attachment | null;
  onClose: () => void;
}

/**
 * Shows the wish exactly as the recipient will see it once opened — same layout as the
 * real reveal on RecipientWishPage — so "preview before you seal it" is an actual
 * screen, not just copy on the page. Read-only: no seal/edit actions live here.
 */
export function WishPreviewModal({
  recipientName,
  birthdayISO,
  fromName,
  message,
  attachment,
  onClose,
}: WishPreviewModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-plum/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[88vh] w-full max-w-[560px] overflow-y-auto rounded-lg bg-paper p-6 text-ink shadow-deep sm:p-10"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Preview of your wish"
      >
        <div className="mb-5 flex items-center justify-between">
          <span className="text-[10px] font-extrabold tracking-[0.14em] text-mulberry">
            THIS IS WHAT {recipientName.toUpperCase() || "THEY"} WILL SEE
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-extrabold text-mulberry"
          >
            Close ✕
          </button>
        </div>

        <span className="text-[10px] font-extrabold tracking-[0.14em] text-mulberry">
          {birthdayISO ? formatWeekdayDate(birthdayISO).toUpperCase() : "DELIVERY DAY"}
        </span>
        <h1 className="my-[22px] font-display text-[32px] sm:text-[38px]">
          Dear {recipientName || "them"},
        </h1>
        {message.split("\n\n").map((paragraph, i) => (
          <p key={i} className="mb-4 font-display text-[16px] leading-[1.65] sm:text-[18px]">
            {paragraph.split("\n").map((line, j) => (
              <span key={j}>
                {line}
                <br />
              </span>
            ))}
          </p>
        ))}

        {attachment && <AttachmentDisplay attachment={attachment} fromName={fromName} />}

        <div className="mt-[22px] border-t border-ink/10 pt-[14px] text-[11px] text-ink/50">
          From {fromName || "you"} — sealed until {birthdayISO ? formatWeekdayDate(birthdayISO) : "delivery day"}.
        </div>
      </div>
    </div>
  );
}
