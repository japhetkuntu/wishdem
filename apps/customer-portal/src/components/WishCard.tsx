import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button } from "@wishdem/design-system";
import type { BadgeTone } from "@wishdem/design-system";
import type { Wish } from "@/types";
import { daysUntilOccasion, formatWishDate } from "@/lib/date";
import { retryWishDelivery } from "@/lib/api";

const AVATAR_COLORS = ["bg-rose text-plum", "bg-moss text-paper", "bg-champagne text-plum", "bg-periwinkle text-plum"];

function avatarClass(seed: string) {
  const idx = seed.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function statusMeta(wish: Wish): { label: string; tone: BadgeTone } {
  if (wish.deliveryFailed) return { label: "DELIVERY FAILED", tone: "draft" };
  if (wish.status === "sealed") return { label: "SEALED", tone: "accent" };
  if (wish.status === "delivered") return { label: "DELIVERED", tone: "accent" };
  if (wish.status === "opened") return { label: "OPENED", tone: "accent" };
  if (!wish.message) return { label: "NEEDS A NOTE", tone: "attention" };
  return { label: "DRAFT", tone: "draft" };
}

export function WishCard({ wish, onRetried }: { wish: Wish; onRetried?: () => void }) {
  const status = statusMeta(wish);
  const isDraft = wish.status === "draft";
  const to = isDraft ? `/create/who?wishId=${wish.id}` : `/w/${wish.id}`;
  const actionLabel = isDraft
    ? wish.message
      ? "Continue draft →"
      : "Start a wish →"
    : "View details →";
  const days = daysUntilOccasion(wish.recipient.occasion, wish.recipient.occasionDateISO);

  const [retrying, setRetrying] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(wish.recipient.phoneNumber ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    if (!phoneNumber.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await retryWishDelivery(wish.id, phoneNumber.trim());
      setRetrying(false);
      onRetried?.();
    } catch {
      setError("That didn't go through — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="border-b border-porcelain/10 px-4 py-[14px] last:border-0">
      <div className="grid grid-cols-[42px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[42px_minmax(0,1fr)_max-content]">
        <div
          className={`grid h-[42px] w-[42px] flex-none place-items-center rounded-full text-[13px] font-extrabold ${avatarClass(
            wish.recipient.name,
          )}`}
        >
          {initials(wish.recipient.name)}
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <b className="truncate text-[14px] sm:min-w-0 sm:flex-1">
              {wish.recipient.name}
              {wish.recipient.relationship ? (
                <span className="hidden font-normal text-porcelain/60 lg:inline">
                  {" "}
                  · {wish.recipient.relationship}
                </span>
              ) : null}
            </b>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <p className="mt-1 truncate text-[11px] leading-[1.45] text-porcelain/65 sm:whitespace-nowrap">
            {isDraft
              ? `${formatWishDate(wish.recipient.occasionDateISO)} · ${days >= 0 ? `${days} days away` : "date passed"}`
              : `${formatWishDate(wish.recipient.occasionDateISO)} · ${wish.channel ?? "link"} · ${wish.attachment ? wish.attachment.kind : "written note"}`}
          </p>
        </div>
        <Link
          to={to}
          className="col-span-2 mt-1 text-left text-[11px] font-extrabold text-champagne sm:col-span-1 sm:mt-0 sm:text-right"
        >
          {actionLabel}
        </Link>
      </div>

      {wish.deliveryFailed && (
        <div className="mt-3 rounded-md border border-rose/40 bg-rose/[0.08] p-[13px] sm:ml-[54px]">
          {!retrying ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] leading-[1.5] text-porcelain/75">
                We couldn't reach {wish.recipient.name} — the phone number on file may be wrong.
              </p>
              <button
                type="button"
                onClick={() => setRetrying(true)}
                className="text-[11px] font-extrabold text-rose"
              >
                Fix & retry →
              </button>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-[10px] font-extrabold tracking-[0.1em] text-champagne">
                {wish.recipient.name}'S PHONE NUMBER
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 024 123 4567"
                  className="min-w-0 flex-1 rounded-md border border-porcelain/25 bg-transparent px-3 py-[9px] text-[13px] font-bold text-porcelain outline-none placeholder:font-normal placeholder:text-porcelain/40"
                />
                <Button type="button" onClick={handleRetry} disabled={submitting || !phoneNumber.trim()}>
                  {submitting ? "Retrying…" : "Retry delivery"}
                </Button>
                <button
                  type="button"
                  onClick={() => setRetrying(false)}
                  className="text-[11px] font-bold text-porcelain/60"
                >
                  Cancel
                </button>
              </div>
              {error && <p className="mt-2 text-[11px] text-rose">{error}</p>}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
