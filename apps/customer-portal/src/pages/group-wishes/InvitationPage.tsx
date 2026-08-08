import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { Button } from "@wishdem/design-system";
import { AppNav } from "@/components/AppNav";
import { useGroupWishInvitation } from "@/hooks/useGroupWishes";
import type { GroupWishFormat } from "@/types";

const FORMAT_LABELS: Record<GroupWishFormat, string> = {
  notes: "Notes",
  photos: "Photos",
  voice: "Voice notes",
  video: "Short videos",
};

function dateLabel(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

export default function InvitationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invitation, loading, respond } = useGroupWishInvitation(id);
  const [responding, setResponding] = useState(false);

  async function handleRespond(status: "joined" | "declined" | "not-now") {
    setResponding(true);
    try {
      await respond(status);
      if (status === "declined") {
        navigate("/group-wishes");
      }
    } finally {
      setResponding(false);
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

  if (!invitation) {
    return (
      <main className="mx-auto w-full max-w-[1320px] px-4 pb-9 pt-6 sm:px-8">
        <AppNav active="groupWishes" />
        <p className="py-16 text-center text-[12px] text-porcelain/55">
          We couldn't find that invitation.
        </p>
      </main>
    );
  }

  const recipientFirst = invitation.recipientName.split(" ")[0] || invitation.recipientName;

  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 pb-9 pt-6 sm:px-8">
      <AppNav active="groupWishes" />

      <section className="grid gap-8 py-8 sm:grid-cols-[1.15fr_.85fr] sm:gap-14">
        <div>
          <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
            INVITATION
          </span>
          <h1 className="my-3 max-w-[560px] font-display text-[clamp(30px,4vw,42px)] leading-[1.1]">
            {invitation.inviterName} invited you to {invitation.title}.
          </h1>
          <p className="mb-6 max-w-[540px] text-[13px] leading-[1.6] text-porcelain/70">
            {invitation.organizerNote ??
              `Add a memory to be gathered with everyone else's and delivered as one gift.`}
          </p>

          <div className="mb-6 grid grid-cols-2 gap-[10px] sm:grid-cols-4">
            {[
              { label: "Collection closes", value: dateLabel(invitation.collectByDate) },
              { label: `Delivered to ${recipientFirst}`, value: dateLabel(invitation.deliveryDate) },
              { label: "Occasion", value: invitation.occasion ?? "—" },
            ].map((fact) => (
              <div key={fact.label} className="rounded-md border border-porcelain/[0.14] p-3">
                <span className="mb-1 block text-[8px] font-extrabold tracking-[0.08em] text-champagne">
                  {fact.label.toUpperCase()}
                </span>
                <b className="text-[11px] leading-[1.4]">{fact.value}</b>
              </div>
            ))}
          </div>

          <div className="mb-3 rounded-md bg-porcelain/[0.04] p-4 text-[11px] leading-[1.6] text-porcelain/70">
            You can add a note, a photo, a voice note, or a short video — whatever feels most
            like you. Everything is bound together into one gift when it's delivered.
          </div>
          {invitation.organizerNote && (
            <blockquote className="mb-6 rounded-md border-l-2 border-champagne bg-porcelain/[0.03] p-4 text-[12px] italic leading-[1.6] text-porcelain/80">
              "{invitation.organizerNote}"
              <footer className="mt-2 text-[10px] not-italic text-champagne">
                — {invitation.inviterName}
              </footer>
            </blockquote>
          )}

          {invitation.status === "joined" ? (
            <div className="rounded-md bg-moss/20 p-4">
              <p className="mb-3 text-[12px] font-bold text-moss">
                You've joined this group wish. Add a note, photo, voice note, or short video
                whenever you're ready.
              </p>
              <Link to={`/contribute/${invitation.inviteToken}`}>
                <Button variant="dark" size="sm">
                  Add your memory
                </Button>
              </Link>
            </div>
          ) : invitation.status === "declined" ? (
            <p className="rounded-md bg-rose/20 p-4 text-[12px] font-bold text-rose">
              You've declined this invitation.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-[10px]">
              <Button
                variant="dark"
                size="sm"
                disabled={responding}
                onClick={() => handleRespond("joined")}
              >
                Join this Group Wish
              </Button>
              <Button
                variant="outline-inverse"
                size="sm"
                disabled={responding}
                onClick={() => handleRespond("not-now")}
              >
                Not now
              </Button>
              <button
                type="button"
                disabled={responding}
                onClick={() => handleRespond("declined")}
                className={clsx("text-[10px] font-bold text-porcelain/50 hover:text-rose")}
              >
                Decline invitation
              </button>
            </div>
          )}

          <Link to="/group-wishes" className="mt-6 inline-block text-[10px] font-bold text-champagne">
            ← Back to Group Wishes
          </Link>
        </div>

        <aside className="grid content-start gap-[14px]">
          <div className="rounded-lg border border-champagne/45 p-[18px]">
            <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
              NO RUSH TO WRITE
            </span>
            <p className="mb-3 text-[12px] leading-[1.6] text-porcelain/70">
              Join now and add your memory whenever it feels right, up until the
              collection closes.
            </p>
            <div className="flex flex-wrap gap-[6px]">
              {invitation.formats.map((format) => (
                <span
                  key={format}
                  className="rounded-pill border border-porcelain/[0.17] px-[9px] py-[5px] text-[9px] font-extrabold text-porcelain/70"
                >
                  {FORMAT_LABELS[format]}
                </span>
              ))}
            </div>
          </div>
          <p className="rounded-lg bg-porcelain/[0.04] p-[14px] text-[10px] leading-[1.5] text-porcelain/55">
            Your invitation stays here even if you're not ready yet — nothing expires until
            the collection deadline passes.
          </p>
        </aside>
      </section>
    </main>
  );
}
