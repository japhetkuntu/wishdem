import { Link } from "react-router-dom";
import { Badge } from "@wishdem/design-system";
import type { BadgeTone } from "@wishdem/design-system";
import type { Wish } from "@/types";
import { daysUntil, formatWishDate } from "@/lib/date";

const AVATAR_COLORS = ["bg-rose text-plum", "bg-moss text-porcelain", "bg-champagne text-plum", "bg-periwinkle text-plum"];

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
  if (wish.status === "sealed") return { label: "SEALED", tone: "accent" };
  if (wish.status === "delivered") return { label: "DELIVERED", tone: "accent" };
  if (wish.status === "opened") return { label: "OPENED", tone: "accent" };
  if (!wish.message) return { label: "NEEDS A NOTE", tone: "attention" };
  return { label: "DRAFT", tone: "draft" };
}

export function WishCard({ wish }: { wish: Wish }) {
  const status = statusMeta(wish);
  const isDraft = wish.status === "draft";
  const to = isDraft ? `/create/who?wishId=${wish.id}` : `/w/${wish.id}`;
  const actionLabel = isDraft
    ? wish.message
      ? "Continue draft →"
      : "Start a wish →"
    : "View details →";
  const days = daysUntil(wish.recipient.birthdayISO);

  return (
    <article className="grid grid-cols-[42px_minmax(0,1fr)] items-center gap-3 border-b border-porcelain/10 px-4 py-[14px] last:border-0 sm:grid-cols-[42px_minmax(0,1fr)_max-content]">
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
            ? `${formatWishDate(wish.recipient.birthdayISO)} · ${days >= 0 ? `${days} days away` : "date passed"}`
            : `${formatWishDate(wish.recipient.birthdayISO)} · ${wish.channel ?? "link"} · ${wish.attachment ? wish.attachment.kind : "written note"}`}
        </p>
      </div>
      <Link
        to={to}
        className="col-span-2 mt-1 text-left text-[11px] font-extrabold text-champagne sm:col-span-1 sm:mt-0 sm:text-right"
      >
        {actionLabel}
      </Link>
    </article>
  );
}
