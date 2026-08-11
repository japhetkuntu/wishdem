import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Loading } from "@wishdem/design-system";
import { Seo } from "@/components/Seo";
import { AppNav } from "@/components/AppNav";
import { useGroupWish } from "@/hooks/useGroupWishes";

const STATUS_LABEL: Record<string, string> = {
  invited: "Invited",
  joined: "Joined",
  declined: "Declined",
  "not-now": "Not now",
};

const STATUS_CLASS: Record<string, string> = {
  invited: "bg-champagne/[0.16] text-champagne",
  joined: "bg-moss/20 text-moss",
  declined: "bg-rose/20 text-rose",
  "not-now": "bg-porcelain/[0.1] text-porcelain/70",
};

export default function GroupWishLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { groupWish, invitations, loading, invite, seal } = useGroupWish(id);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [sealing, setSealing] = useState(false);

  async function handleCopyLink(token: string) {
    const url = `${window.location.origin}/contribute/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken((t) => (t === token ? null : t)), 2000);
    } catch {
      setCopiedToken(null);
    }
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) return;
    setInviting(true);
    setInviteError(null);
    try {
      await invite({ guestName: guestName.trim(), guestEmail: guestEmail.trim() || undefined });
      setGuestName("");
      setGuestEmail("");
    } catch {
      setInviteError("We couldn't send that invite just now. Please try again.");
    } finally {
      setInviting(false);
    }
  }

  async function handleFinish() {
    setSealing(true);
    try {
      await seal();
      navigate("/group-wishes");
    } catch {
      setInviteError("We couldn't finish inviting just now. Please try again.");
      setSealing(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1320px] px-4 pb-[104px] pt-6 sm:px-8 sm:pb-9">
        <Seo
          title="Invite People — WishDem"
          description="Invite people to contribute to your private group wish on WishDem."
          path="/group-wishes/:id/invite"
          noindex
        />
        <AppNav active="groupWishes" />
        <Loading />
      </main>
    );
  }

  if (!groupWish) {
    return (
      <main className="mx-auto w-full max-w-[1320px] px-4 pb-[104px] pt-6 sm:px-8 sm:pb-9">
        <Seo
          title="Group Wish Not Found — WishDem"
          description="This group wish could not be found."
          path="/group-wishes/:id/invite"
          noindex
        />
        <AppNav active="groupWishes" />
        <p className="py-16 text-center text-[12px] text-porcelain/55">
          We couldn't find that group wish.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 pb-[104px] pt-6 sm:px-8 sm:pb-9">
      <Seo
        title={`Invite People to ${groupWish.title} — WishDem`}
        description={`Invite people to contribute memories to ${groupWish.title} on WishDem.`}
        path="/group-wishes/:id/invite"
        noindex
      />
      <AppNav active="groupWishes" />

      <header className="flex flex-wrap items-center gap-[10px] py-6">
        <span className="rounded-pill bg-champagne px-[10px] py-1 text-[9px] font-extrabold tracking-[0.1em] text-plum">
          INVITING
        </span>
        <span className="text-[10px] text-porcelain/60">
          For {groupWish.recipientName} · Delivers {groupWish.deliveryDateLabel} · Collect by{" "}
          {groupWish.collectByLabel} · Surprise collection
        </span>
      </header>

      <section className="grid gap-[13px] sm:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-[13px]">
          <div className="rounded-lg bg-mulberry p-6 text-porcelain [--wd-ink-on-canvas-rgb:246_240_232]">
            <h1 className="mb-1 font-display text-[30px] leading-[1.1]">Invite people</h1>
            <p className="mb-4 max-w-[440px] text-[12px] leading-[1.6] text-porcelain/75">
              Add a guest below to give them a private link to add a memory to {groupWish.title}.
            </p>
            <form onSubmit={handleInvite} className="grid gap-[8px] sm:grid-cols-[1fr_1fr_auto]">
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Guest's name"
                required
                className="rounded-md border border-porcelain/[0.2] bg-porcelain/[0.06] px-3 py-[10px] text-[12px] outline-none placeholder:text-porcelain/45"
              />
              <input
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Email (optional)"
                type="email"
                className="rounded-md border border-porcelain/[0.2] bg-porcelain/[0.06] px-3 py-[10px] text-[12px] outline-none placeholder:text-porcelain/45"
              />
              <Button type="submit" variant="outline-inverse" size="sm" disabled={inviting || !guestName.trim()}>
                {inviting ? "Inviting…" : "Invite"}
              </Button>
            </form>
            {inviteError && <p className="mt-2 text-[11px] text-rose">{inviteError}</p>}
          </div>

          <div className="rounded-md border border-porcelain/[0.1] bg-porcelain/[0.03] p-5">
            <h2 className="mb-3 font-display text-[19px]">People invited</h2>
            {invitations.length === 0 ? (
              <p className="text-[12px] text-porcelain/55">
                No one invited yet. Add a guest above to get their private link.
              </p>
            ) : (
              <div className="grid gap-[8px]">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-[10px] rounded-md border border-porcelain/[0.1] p-3"
                  >
                    <div>
                      <b className="block text-[12px]">{invitation.guestName}</b>
                      {invitation.guestEmail && (
                        <span className="text-[10px] text-porcelain/55">{invitation.guestEmail}</span>
                      )}
                    </div>
                    <span
                      className={`w-max rounded-pill px-[8px] py-1 text-[9px] font-extrabold ${STATUS_CLASS[invitation.status]}`}
                    >
                      {STATUS_LABEL[invitation.status]}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(invitation.inviteToken)}
                      className="rounded-pill border border-porcelain/[0.2] px-[10px] py-[8px] text-[9px] font-extrabold hover:bg-porcelain/[0.06]"
                    >
                      {copiedToken === invitation.inviteToken ? "Copied ✓" : "Copy link"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-md border border-porcelain/[0.1] p-8 text-center">
            <p className="mb-3 text-[12px] text-porcelain/60">
              {invitations.length === 0
                ? "You can finish inviting later — this group wish stays open until you seal it."
                : `${invitations.length} ${invitations.length === 1 ? "person" : "people"} invited so far.`}
            </p>
            <Button variant="dark" size="sm" onClick={handleFinish} disabled={sealing}>
              {sealing ? "Sealing…" : "Finish inviting & seal"}
            </Button>
          </div>
        </div>

        <aside className="grid content-start gap-[14px] rounded-md bg-paper p-[17px] text-ink shadow-card">
          <div>
            <span className="mb-2 block text-[9px] font-extrabold tracking-[0.12em] text-mulberry">
              COLLECTION STATUS
            </span>
            <div className="grid grid-cols-2 gap-[8px] text-[10px]">
              {[
                { label: "Joined", value: groupWish.joinedCount },
                { label: "Invited", value: groupWish.invitedCount },
                { label: "Viewed", value: groupWish.viewedCount },
                { label: "Declined", value: groupWish.declinedCount },
              ].map((stat) => (
                <div key={stat.label} className="rounded-sm bg-plum/[0.05] p-[10px]">
                  <b className="block font-display text-[20px] text-mulberry">{stat.value}</b>
                  {stat.label}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-plum/[0.09] pt-[14px]">
            <span className="mb-2 block text-[9px] font-extrabold tracking-[0.12em] text-mulberry">
              ACTIVITY
            </span>
            <ul className="grid gap-[8px] text-[10px] leading-[1.5] text-ink/65">
              {groupWish.activity.map((event) => (
                <li key={event.id}>{event.message}</li>
              ))}
            </ul>
          </div>

          <p className="border-t border-plum/[0.09] pt-[14px] text-[9px] leading-[1.5] text-ink/50">
            Only people you invite can see this memory book. {groupWish.recipientName} won't
            see it until it's delivered.
          </p>
          <Link
            to={`/bloom/${id}`}
            className="block border-t border-plum/[0.09] pt-[14px] text-[9px] font-extrabold text-mulberry"
          >
            Preview how {groupWish.recipientName.split(" ")[0]} will see it →
          </Link>
        </aside>
      </section>

      <Link to="/group-wishes" className="mt-6 inline-block text-[10px] font-bold text-champagne">
        ← Back to Group Wishes
      </Link>
    </main>
  );
}
