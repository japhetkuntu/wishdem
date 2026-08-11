import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { Button } from "@wishdem/design-system";
import { Seo } from "@/components/Seo";
import { AppNav } from "@/components/AppNav";
import { usePeople } from "@/hooks/usePeople";
import type { EventTone, Person } from "@/types";

type FilterKey = "all" | "upcoming30" | "availableWeek" | "needsAttention" | "studioLumen";

const AVATAR_CLASSES: Record<EventTone | "periwinkle", string> = {
  accent: "bg-champagne text-plum",
  rose: "bg-rose text-plum",
  moss: "bg-moss text-paper",
  periwinkle: "bg-periwinkle text-plum",
};

// Person state tags use their own tone set (accent/good/alert), distinct
// from calendar tags (accent/attention/good).
const STATE_TAG_CLASSES: Record<string, string> = {
  accent: "bg-champagne text-plum",
  good: "bg-moss text-paper",
  alert: "bg-rose text-plum",
};

function PersonRow({
  person,
  selected,
  onSelect,
}: {
  person: Person;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      onClick={onSelect}
      className={clsx(
        "grid cursor-pointer grid-cols-[1fr_auto] items-center gap-2 border-t border-porcelain/[0.09] px-[14px] py-[13px] first:border-0 sm:grid-cols-[1.35fr_1.15fr_.92fr_.7fr]",
        // Pinning the reactive ink-on-canvas variable here (not just setting bg) keeps every
        // descendant's text-porcelain/* legible against this always-dark mulberry fill,
        // regardless of which theme is active — same pattern as DashboardPage's mulberry card.
        selected && "bg-mulberry [--wd-ink-on-canvas-rgb:246_240_232]",
      )}
    >
      <div className="flex items-center gap-[9px]">
        <div
          className={clsx(
            "grid h-[31px] w-[31px] flex-none place-items-center rounded-full text-[10px] font-extrabold",
            AVATAR_CLASSES[person.avatarTone],
          )}
        >
          {person.initials}
        </div>
        <div>
          <b className="block text-[11px]">{person.name}</b>
          <small className="text-[9px] leading-[1.4] text-porcelain/65">{person.role}</small>
        </div>
      </div>
      <div className="hidden text-[9px] leading-[1.4] text-porcelain/65 sm:block">
        <b className="text-[10px] text-porcelain">{person.nextMomentTitle}</b>
        <br />
        {person.nextMomentSubtitle}
      </div>
      <div className="hidden text-[9px] leading-[1.4] text-porcelain/65 sm:block">
        {person.stateLabel}
        <span
          className={clsx(
            "mt-[3px] inline-block rounded-pill px-[6px] py-1 text-[8px] font-extrabold",
            STATE_TAG_CLASSES[person.stateTagTone],
          )}
        >
          {person.stateTagLabel}
        </span>
      </div>
      <div className="text-right text-[9px] font-extrabold text-champagne">{person.actionLabel}</div>
    </article>
  );
}

export default function PeoplePage() {
  const { people } = usePeople();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = people;
    if (filter === "upcoming30") list = list.filter((p) => p.filterTags.includes("upcoming30"));
    if (filter === "availableWeek") list = list.filter((p) => p.filterTags.includes("availableWeek"));
    if (filter === "needsAttention") list = list.filter((p) => p.filterTags.includes("needsAttention"));
    if (filter === "studioLumen") list = list.filter((p) => p.role.includes("Studio Lumen"));

    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(query) || p.role.toLowerCase().includes(query),
      );
    }
    return list;
  }, [people, filter, search]);

  const selected = people.find((p) => p.id === selectedId) ?? filtered[0] ?? people[0];

  const counts = {
    all: people.length,
    upcoming30: people.filter((p) => p.filterTags.includes("upcoming30")).length,
    availableWeek: people.filter((p) => p.filterTags.includes("availableWeek")).length,
    needsAttention: people.filter((p) => p.filterTags.includes("needsAttention")).length,
  };

  const chips: { key: FilterKey; label: string }[] = [
    { key: "all", label: `All people · ${counts.all}` },
    { key: "upcoming30", label: `Upcoming 30 days · ${counts.upcoming30}` },
    { key: "availableWeek", label: `Available this week · ${counts.availableWeek}` },
    { key: "needsAttention", label: `Needs attention · ${counts.needsAttention}` },
    { key: "studioLumen", label: "Studio Lumen" },
  ];

  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 pb-[104px] pt-6 sm:px-8 sm:pb-9">
      <Seo
        title="People — WishDem"
        description="Your private list of the people you hold in mind and their upcoming moments."
        path="/people"
        noindex
      />
      <AppNav active="people" />

      <header className="flex flex-col gap-3 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
            THE PEOPLE YOU HOLD IN MIND
          </span>
          <h1 className="font-display text-[clamp(30px,4vw,39px)]">People</h1>
          <p className="text-[11px] text-porcelain/68">
            Know who matters, what is coming up for them, and the fastest thoughtful
            next step.
          </p>
        </div>
        <Link to="/circle/new">
          <Button variant="outline" size="sm">
            + Add person
          </Button>
        </Link>
      </header>

      <section className="mb-[13px] flex flex-wrap gap-[7px] rounded-md border border-porcelain/[0.1] bg-porcelain/[0.03] p-[11px]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people, Circles, or roles"
          className="min-w-[200px] flex-1 rounded-pill border border-porcelain/[0.17] bg-midnight px-3 py-2 text-[10px] text-porcelain outline-none placeholder:text-porcelain/45"
        />
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setFilter(chip.key)}
            className={clsx(
              "whitespace-nowrap rounded-pill border border-porcelain/[0.17] px-[10px] py-[7px] text-[9px] font-extrabold",
              filter === chip.key ? "bg-paper text-plum" : "text-porcelain/70",
            )}
          >
            {chip.label}
          </button>
        ))}
      </section>

      <section className="grid gap-[13px] sm:grid-cols-[minmax(0,1fr)_326px]">
        <div className="overflow-hidden rounded-md border border-porcelain/[0.1]">
          <div className="hidden grid-cols-[1.35fr_1.15fr_.92fr_.7fr] bg-porcelain/[0.04] px-[14px] py-[10px] text-[8px] font-extrabold tracking-[0.1em] text-porcelain/55 sm:grid">
            <span>PERSON</span>
            <span>NEXT MOMENT</span>
            <span>STATE</span>
            <span>ACTION</span>
          </div>
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-[12px] text-porcelain/55">
              No one matches that search yet.
            </p>
          ) : (
            filtered.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                selected={person.id === selected?.id}
                onSelect={() => setSelectedId(person.id)}
              />
            ))
          )}
        </div>

        {selected && (
          <aside className="rounded-md bg-paper p-[17px] text-ink shadow-card">
            <div className="flex items-center gap-[10px]">
              <div
                className={clsx(
                  "grid h-[43px] w-[43px] place-items-center rounded-full text-[12px] font-extrabold",
                  AVATAR_CLASSES[selected.avatarTone],
                )}
              >
                {selected.initials}
              </div>
              <div>
                <h2 className="font-display text-[27px] leading-[1.05]">{selected.name}</h2>
                <p className="mt-[3px] text-[9px] text-ink/60">{selected.role}</p>
              </div>
            </div>

            {selected.detail ? (
              <>
                <div className="my-[15px] rounded-sm bg-plum/[0.05] p-3">
                  <strong className="text-[11px]">{selected.detail.dateLabel}</strong>
                  <p className="mt-1 text-[9px] text-ink/65">{selected.detail.availabilityNote}</p>
                </div>
                <div className="border-t border-plum/[0.1] py-[11px] text-[10px]">
                  <b className="block">{selected.detail.ruleLabel}</b>
                  <span className="text-ink/64">{selected.detail.ruleNote}</span>
                  {typeof selected.detail.ruleProgress === "number" && (
                    <div className="mt-[7px] h-[5px] overflow-hidden rounded-pill bg-plum/[0.09]">
                      <i
                        className="block h-full bg-champagne"
                        style={{ width: `${selected.detail.ruleProgress}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="border-t border-plum/[0.1] py-[11px] text-[10px]">
                  <b className="block">{selected.detail.nextStepLabel}</b>
                  <span className="text-ink/64">{selected.detail.nextStepNote}</span>
                </div>
                <div className="border-t border-plum/[0.1] py-[11px] text-[10px]">
                  <b className="block">{selected.detail.conversationLabel}</b>
                  <span className="text-ink/64">{selected.detail.conversationNote}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-[7px]">
                  <Button variant="dark" size="sm" className="min-h-0 py-[9px] text-[9px]">
                    Message {selected.name.split(" ")[0]}'s group
                  </Button>
                  <Button variant="outline-inverse" size="sm" className="min-h-0 border-plum/15 py-[9px] text-[9px]">
                    Find a time
                  </Button>
                  <Link to="/create/who">
                    <Button variant="outline-inverse" size="sm" className="min-h-0 w-full border-plum/15 py-[9px] text-[9px]">
                      Create a wish
                    </Button>
                  </Link>
                  <Link to="/calendar">
                    <Button variant="outline-inverse" size="sm" className="min-h-0 w-full border-plum/15 py-[9px] text-[9px]">
                      View calendar
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-[15px] rounded-sm bg-plum/[0.05] p-3 text-[10px] text-ink/65">
                <b className="mb-1 block text-ink">{selected.nextMomentTitle}</b>
                {selected.nextMomentSubtitle} · {selected.stateLabel}
                <Link to="/create/who" className="mt-3 block">
                  <Button variant="dark" size="sm" className="min-h-0 w-full py-[9px] text-[9px]">
                    Create a wish for {selected.name.split(" ")[0]}
                  </Button>
                </Link>
              </div>
            )}
          </aside>
        )}
      </section>
    </main>
  );
}
