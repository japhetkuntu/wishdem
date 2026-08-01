import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { Button } from "@wishdem/design-system";
import { AppNav } from "@/components/AppNav";
import { useCircle } from "@/hooks/useCircle";
import { daysUntil, formatWishDate } from "@/lib/date";
import type { CircleAvatarTone, CirclePerson, CircleStateTone } from "@/types";

type FilterKey = "up" | "family" | "friends" | "work" | "recent";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "up", label: "Coming up" },
  { key: "family", label: "Family" },
  { key: "friends", label: "Friends" },
  { key: "work", label: "Work" },
  { key: "recent", label: "Recently added" },
];

const SECTION_TITLES: Record<FilterKey, string> = {
  up: "Coming up",
  family: "Family",
  friends: "Friends",
  work: "Work",
  recent: "Recently added",
};

const AVATAR_CLASSES: Record<CircleAvatarTone, string> = {
  accent: "bg-champagne text-plum",
  rose: "bg-rose text-plum",
  moss: "bg-moss text-porcelain",
  mulberry: "bg-mulberry text-porcelain",
};

const STATE_CLASSES: Record<CircleStateTone, string> = {
  neutral: "bg-champagne text-plum",
  wait: "bg-rose text-plum",
  sealed: "bg-moss text-porcelain",
};

function PersonRow({ person }: { person: CirclePerson }) {
  const days = person.birthdayISO ? daysUntil(person.birthdayISO) : null;
  const metaLabel = person.birthdayISO
    ? `${formatWishDate(person.birthdayISO)} · ${days} days`
    : "Add when it feels right";
  const actionHref = person.wishId
    ? person.stateTone === "neutral"
      ? `/create/who?wishId=${person.wishId}`
      : `/w/${person.wishId}`
    : "/circle/new";

  return (
    <article className="grid grid-cols-[1fr_auto] items-center gap-2 border-t border-porcelain/[0.09] px-4 py-[13px] first:border-0 sm:grid-cols-[1.25fr_.8fr_.9fr_auto]">
      <div className="flex items-center gap-[9px]">
        <div
          className={clsx(
            "grid h-[33px] w-[33px] flex-none place-items-center rounded-full text-[10px] font-extrabold",
            AVATAR_CLASSES[person.avatarTone],
          )}
        >
          {person.initials}
        </div>
        <div>
          <strong className="block text-[11px]">{person.name}</strong>
          <span className="text-[9px] text-porcelain/65">{person.relationshipLabel}</span>
        </div>
      </div>
      <div className="hidden text-[9px] text-porcelain/65 sm:block">
        <b className="block text-[10px] text-porcelain">
          {person.birthdayISO ? formatWishDate(person.birthdayISO) : "Birthday unknown"}
          {days !== null && ` · ${days} days`}
        </b>
        {person.birthdayISO ? "Birthday moment" : "Add when it feels right"}
      </div>
      <div className="hidden sm:block">
        <span
          className={clsx(
            "inline-block rounded-pill px-[7px] py-[5px] text-[8px] font-extrabold",
            STATE_CLASSES[person.stateTone],
          )}
        >
          {person.stateLabel}
        </span>
      </div>
      <Link to={actionHref} className="text-right text-[9px] font-extrabold text-champagne">
        {person.actionLabel}
      </Link>
      <div className="col-span-2 text-[9px] text-porcelain/55 sm:hidden">{metaLabel}</div>
    </article>
  );
}

export default function CirclePage() {
  const { people, invitations, stats, loading } = useCircle();
  const [filter, setFilter] = useState<FilterKey>("up");

  const filtered = useMemo(() => {
    if (filter === "family") return people.filter((p) => p.group === "family");
    if (filter === "friends") return people.filter((p) => p.group === "friends");
    if (filter === "work") return people.filter((p) => p.group === "work");
    if (filter === "recent") return people.filter((p) => p.recentlyAdded);
    return [...people].sort((a, b) => {
      const da = a.birthdayISO ? daysUntil(a.birthdayISO) : Infinity;
      const db = b.birthdayISO ? daysUntil(b.birthdayISO) : Infinity;
      return da - db;
    });
  }, [people, filter]);

  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 pb-9 pt-6 sm:px-8">
      <AppNav active="circle" />

      <header className="flex flex-col gap-3 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
            YOUR PRIVATE CONSTELLATION
          </span>
          <h1 className="font-display text-[clamp(30px,4vw,39px)]">Your Circle</h1>
          <p className="text-[11px] text-porcelain/68">
            The people and shared celebrations you're holding close.
          </p>
        </div>
        <Link to="/create/who">
          <Button variant="outline" size="sm">
            Create a group wish
          </Button>
        </Link>
      </header>

      <section className="grid gap-[13px] sm:grid-cols-[minmax(0,1fr)_295px]">
        <div>
          <div className="mb-3 flex flex-wrap gap-[7px]">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={clsx(
                  "whitespace-nowrap rounded-pill border border-porcelain/[0.17] px-[10px] py-[7px] text-[9px] font-extrabold",
                  filter === f.key ? "bg-porcelain text-plum" : "text-porcelain/70",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-md border border-porcelain/[0.1]">
            <h2 className="bg-porcelain/[0.035] px-4 py-[13px] font-display text-[22px]">
              {SECTION_TITLES[filter]}
            </h2>
            {loading ? (
              <p className="py-10 text-center text-[12px] text-porcelain/55">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-[12px] text-porcelain/55">
                No one here yet.
              </p>
            ) : (
              filtered.map((person) => <PersonRow key={person.id} person={person} />)
            )}
          </div>
        </div>

        <aside className="grid gap-[14px] rounded-md bg-porcelain p-[17px] text-ink shadow-card">
          {invitations.length > 0 && (
            <div>
              <span className="text-[9px] font-extrabold tracking-[0.12em] text-mulberry">
                SHARED WITH ME{" "}
                <b className="rounded-pill bg-rose px-[6px] py-[3px] text-plum">
                  {invitations.length}
                </b>
              </span>
              {invitations.map((invite) => (
                <article key={invite.id} className="border-b border-plum/[0.09] py-[14px] last:border-0">
                  <div className="mb-[10px] flex">
                    {invite.faceInitials.map((face, i) => (
                      <span
                        key={face}
                        className={clsx(
                          "-mr-[5px] grid h-[27px] w-[27px] place-items-center rounded-full border-2 border-porcelain text-[7px] font-extrabold",
                          i === 0 && "bg-mulberry text-porcelain",
                          i === 1 && "bg-champagne text-plum",
                          i === 2 && "bg-rose text-plum",
                        )}
                      >
                        {face}
                      </span>
                    ))}
                  </div>
                  <h3 className="my-[5px] font-display text-[23px]">{invite.title}</h3>
                  <p className="text-[10px] leading-[1.45] text-ink/70">{invite.description}</p>
                  <div className="my-[10px] text-[9px] font-extrabold text-mulberry">
                    {invite.deadlineLabel}
                  </div>
                  <Button variant="dark" size="sm" className="min-h-0 py-[9px] text-[9px]">
                    {invite.actionLabel}
                  </Button>
                </article>
              ))}
            </div>
          )}
          {stats && (
            <div className={clsx("text-[10px] leading-[1.45] text-ink/70", invitations.length > 0 && "border-t border-plum/[0.09] pt-[14px]")}>
              <strong className="mb-1 block text-[11px] text-ink">
                Your Circle is growing gently.
              </strong>
              {stats.peopleCount} people remembered · {stats.momentsCount} birthday moments
              held for the months ahead.
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
