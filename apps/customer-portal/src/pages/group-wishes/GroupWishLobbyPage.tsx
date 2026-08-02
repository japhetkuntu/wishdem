import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { AppNav } from "@/components/AppNav";
import { useGroupWish } from "@/hooks/useGroupWishes";

const METHODS = [
  { label: "Choose contacts", note: "Pick people from your Circle." },
  { label: "Share by message", note: "Send the invite link over text or chat." },
  { label: "Send an email", note: "Email the invite to anyone, anywhere." },
  { label: "Show QR code", note: "Let people scan in to join instantly." },
];

export default function GroupWishLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { groupWish, loading } = useGroupWish(id);
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    const url = `${window.location.origin}/contribute/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1320px] px-4 pb-9 pt-6 sm:px-8">
        <AppNav active="groupWishes" />
        <p className="py-16 text-center text-[12px] text-porcelain/55">Loading…</p>
      </main>
    );
  }

  if (!groupWish) {
    return (
      <main className="mx-auto w-full max-w-[1320px] px-4 pb-9 pt-6 sm:px-8">
        <AppNav active="groupWishes" />
        <p className="py-16 text-center text-[12px] text-porcelain/55">
          We couldn't find that group wish.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 pb-9 pt-6 sm:px-8">
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
          <div className="rounded-lg bg-mulberry p-6">
            <h1 className="mb-1 font-display text-[30px] leading-[1.1]">Invite people</h1>
            <p className="mb-4 max-w-[440px] text-[12px] leading-[1.6] text-porcelain/75">
              Share this link with anyone who should add a memory to {groupWish.title}.
            </p>
            <Button variant="outline-inverse" size="sm" onClick={handleCopyLink}>
              {copied ? "Link copied ✓" : "Copy invite link"}
            </Button>
          </div>

          <div className="rounded-md border border-porcelain/[0.1] bg-porcelain/[0.03] p-5">
            <h2 className="mb-3 font-display text-[19px]">Bring people in</h2>
            <div className="grid gap-[10px] sm:grid-cols-2">
              {METHODS.map((method) => (
                <button
                  key={method.label}
                  type="button"
                  className="rounded-md border border-porcelain/[0.14] p-4 text-left hover:bg-porcelain/[0.05]"
                >
                  <b className="block text-[12px]">{method.label}</b>
                  <span className="text-[10px] text-porcelain/60">{method.note}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-porcelain/[0.1] p-8 text-center">
            <p className="mb-3 text-[12px] text-porcelain/60">No one invited yet.</p>
            <Button variant="dark" size="sm" onClick={() => navigate("/group-wishes")}>
              Finish inviting
            </Button>
          </div>
        </div>

        <aside className="grid content-start gap-[14px] rounded-md bg-porcelain p-[17px] text-ink shadow-card">
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
