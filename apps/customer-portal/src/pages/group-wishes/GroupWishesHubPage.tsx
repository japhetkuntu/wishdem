import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { Button } from "@wishdem/design-system";
import { AppNav } from "@/components/AppNav";
import { useGroupWishes } from "@/hooks/useGroupWishes";
import type { GroupWishInvitation } from "@/types";

type SubTab = "invited" | "joined" | "created" | "completed";
type FilterChip = "endingSoon" | "fromFriends" | "birthdays";

function InvitationCard({ invitation }: { invitation: GroupWishInvitation }) {
  return (
    <article className="flex items-start justify-between gap-3 border-t border-porcelain/[0.09] py-[14px] first:border-0">
      <div className="flex items-start gap-[10px]">
        <div className="grid h-[33px] w-[33px] flex-none place-items-center rounded-full bg-mulberry text-[11px] font-extrabold text-porcelain">
          {invitation.avatarInitial}
        </div>
        <div>
          <span className="text-[9px] font-extrabold tracking-[0.08em] text-champagne">
            {invitation.inviterName.toUpperCase()} INVITED YOU
          </span>
          <h3 className="my-[3px] font-display text-[19px] leading-[1.15]">{invitation.title}</h3>
          <p className="text-[10px] text-porcelain/60">{invitation.rowSummaryLabel}</p>
        </div>
      </div>
      <div className="flex flex-none flex-col items-end gap-[8px]">
        {invitation.urgencyLabel && (
          <span
            className={clsx(
              "whitespace-nowrap rounded-pill px-[8px] py-[4px] text-[8px] font-extrabold",
              invitation.urgencyTone === "urgent" ? "bg-rose text-plum" : "bg-champagne text-plum",
            )}
          >
            {invitation.urgencyLabel}
          </span>
        )}
        {invitation.status === "joined" ? (
          invitation.needNote?.includes("was added") ? (
            <Link to={`/contribute/${invitation.id}/preview`}>
              <Button variant="outline" size="sm" className="min-h-0 py-[7px] text-[9px]">
                View your memory
              </Button>
            </Link>
          ) : (
            <Link to={`/contribute/${invitation.id}`}>
              <Button variant="outline" size="sm" className="min-h-0 py-[7px] text-[9px]">
                Add your memory
              </Button>
            </Link>
          )
        ) : (
          <Link to={`/group-wishes/invitations/${invitation.id}`}>
            <Button variant="outline" size="sm" className="min-h-0 py-[7px] text-[9px]">
              View invitation
            </Button>
          </Link>
        )}
      </div>
    </article>
  );
}

export default function GroupWishesHubPage() {
  const { groupWishes, invitations, loading } = useGroupWishes();
  const [subTab, setSubTab] = useState<SubTab>("invited");
  const [chips, setChips] = useState<FilterChip[]>([]);

  const pendingInvites = invitations.filter((i) => i.status === "invited");
  const joined = invitations.filter((i) => i.status === "joined");

  const counts = {
    invited: pendingInvites.length,
    joined: joined.length,
    created: groupWishes.length,
    completed: 0,
  };

  function toggleChip(chip: FilterChip) {
    setChips((prev) => (prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]));
  }

  const visibleInvites = useMemo(() => {
    let list = pendingInvites;
    if (chips.includes("endingSoon")) list = list.filter((i) => i.urgencyTone === "urgent");
    if (chips.includes("birthdays")) list = list.filter((i) => i.title.toLowerCase().includes("birthday"));
    return list;
  }, [pendingInvites, chips]);

  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 pb-9 pt-6 sm:px-8">
      <AppNav active="groupWishes" />

      <div className="flex flex-wrap gap-[18px] border-b border-porcelain/[0.12] py-4 text-[11px] font-bold">
        <Link to="/dashboard" className="text-porcelain/60">
          My Wishes
        </Link>
        <span className="border-b-2 border-champagne pb-1 text-porcelain">Group Wishes</span>
        <Link to="/dashboard" className="text-porcelain/60">
          Delivered
        </Link>
      </div>

      <header className="flex flex-col gap-3 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-[10px]">
          {counts.invited > 0 && (
            <span className="rounded-pill bg-rose px-[9px] py-[5px] text-[9px] font-extrabold text-plum">
              {counts.invited} PENDING INVITE{counts.invited === 1 ? "" : "S"}
            </span>
          )}
          <h1 className="font-display text-[clamp(28px,4vw,36px)]">Group Wishes</h1>
        </div>
        <Link to="/group-wishes/new">
          <Button size="sm">+ Create</Button>
        </Link>
      </header>

      <div className="mb-3 flex flex-wrap gap-[7px]">
        {(
          [
            { key: "invited", label: `Invited ${counts.invited}` },
            { key: "joined", label: `Joined ${counts.joined}` },
            { key: "created", label: `Created ${counts.created}` },
            { key: "completed", label: `Completed ${counts.completed}` },
          ] as { key: SubTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSubTab(tab.key)}
            className={clsx(
              "whitespace-nowrap rounded-pill border border-porcelain/[0.17] px-[10px] py-[7px] text-[9px] font-extrabold",
              subTab === tab.key ? "bg-porcelain text-plum" : "text-porcelain/70",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="grid gap-[13px] sm:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-md border border-porcelain/[0.1] p-[14px]">
          {loading ? (
            <p className="py-10 text-center text-[12px] text-porcelain/55">Loading…</p>
          ) : subTab === "invited" ? (
            <>
              <div className="mb-3 flex flex-wrap gap-[6px]">
                {(
                  [
                    { key: "endingSoon", label: "Ending soon" },
                    { key: "fromFriends", label: "From friends" },
                    { key: "birthdays", label: "Birthdays" },
                  ] as { key: FilterChip; label: string }[]
                ).map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => toggleChip(chip.key)}
                    className={clsx(
                      "rounded-pill border border-porcelain/[0.17] px-[9px] py-[5px] text-[8px] font-extrabold",
                      chips.includes(chip.key) ? "bg-champagne text-plum" : "text-porcelain/65",
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              {visibleInvites.length === 0 ? (
                <p className="py-10 text-center text-[12px] text-porcelain/55">
                  No pending invitations match that filter.
                </p>
              ) : (
                visibleInvites.map((invite) => <InvitationCard key={invite.id} invitation={invite} />)
              )}
            </>
          ) : subTab === "joined" ? (
            joined.length === 0 ? (
              <p className="py-10 text-center text-[12px] text-porcelain/55">
                You haven't joined a group wish yet.
              </p>
            ) : (
              joined.map((invite) => <InvitationCard key={invite.id} invitation={invite} />)
            )
          ) : subTab === "created" ? (
            groupWishes.length === 0 ? (
              <p className="py-10 text-center text-[12px] text-porcelain/55">
                You haven't created a group wish yet.
              </p>
            ) : (
              groupWishes.map((wish) => (
                <article
                  key={wish.id}
                  className="flex items-center justify-between gap-3 border-t border-porcelain/[0.09] py-[14px] first:border-0"
                >
                  <div>
                    <h3 className="font-display text-[19px] leading-[1.15]">{wish.title}</h3>
                    <p className="text-[10px] text-porcelain/60">
                      {wish.invitedCount} invited · {wish.joinedCount} joined · Delivers{" "}
                      {wish.deliveryDateLabel}
                    </p>
                  </div>
                  <Link to={`/group-wishes/${wish.id}/invite`}>
                    <Button variant="outline" size="sm" className="min-h-0 py-[7px] text-[9px]">
                      Manage invites
                    </Button>
                  </Link>
                </article>
              ))
            )
          ) : (
            <p className="py-10 text-center text-[12px] text-porcelain/55">
              Nothing completed yet.
            </p>
          )}
        </div>

        <aside className="grid content-start gap-[14px] rounded-md bg-porcelain p-[17px] text-ink shadow-card">
          <div>
            <span className="mb-2 block text-[9px] font-extrabold tracking-[0.12em] text-mulberry">
              JOINED · NEEDS YOUR MEMORY
            </span>
            {joined.filter((i) => !i.needNote?.includes("was added")).length === 0 ? (
              <p className="text-[10px] text-ink/55">You're all caught up.</p>
            ) : (
              joined
                .filter((i) => !i.needNote?.includes("was added"))
                .map((invite) => (
                  <div key={invite.id} className="border-t border-plum/[0.09] py-[11px] first:border-0">
                    <b className="block text-[11px]">{invite.title}</b>
                    <span className="text-[10px] text-ink/60">{invite.needNote}</span>
                    <Link to={`/contribute/${invite.id}`} className="mt-[6px] block">
                      <Button variant="dark" size="sm" className="min-h-0 w-full py-[8px] text-[9px]">
                        Add your memory
                      </Button>
                    </Link>
                  </div>
                ))
            )}
          </div>
          <p className="border-t border-plum/[0.09] pt-[14px] text-[9px] leading-[1.5] text-ink/50">
            We'll let you know when someone invites you, joins one of your group wishes, or
            when a collection deadline is close.
          </p>
        </aside>
      </section>
    </main>
  );
}
