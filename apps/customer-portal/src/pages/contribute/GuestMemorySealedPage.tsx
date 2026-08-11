import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loading } from "@wishdem/design-system";
import { Seo } from "@/components/Seo";
import { useContributionContext, useMemoryDraft } from "@/hooks/useContribution";

export default function GuestMemorySealedPage() {
  const { id } = useParams<{ id: string }>();
  const { context, loading: contextLoading } = useContributionContext(id);
  const { memory, loading } = useMemoryDraft(id);
  const [reminderSet, setReminderSet] = useState(false);

  if (loading || contextLoading) {
    return (
      <main className="mx-auto w-full max-w-[1160px] px-4 pb-9 sm:px-8">
        <Seo
          title="Memory Sealed — WishDem"
          description="Your private memory contribution has been sealed and is waiting for delivery on WishDem."
          path="/contribute/:id/sealed"
          noindex
        />
        <Loading />
      </main>
    );
  }

  if (!memory || !memory.sealed) {
    return (
      <main className="mx-auto w-full max-w-[1160px] px-4 pb-9 sm:px-8">
        <Seo
          title="Memory Not Sealed — WishDem"
          description="This memory hasn't been sealed yet on WishDem."
          path="/contribute/:id/sealed"
          noindex
        />
        <p className="py-16 text-center text-[12px] text-porcelain/55">
          This memory hasn't been sealed yet.
        </p>
        <div className="text-center">
          <Link to={`/contribute/${id}`} className="text-[11px] font-bold text-champagne">
            ← Back to the invitation
          </Link>
        </div>
      </main>
    );
  }

  const recipientFirst = context?.recipientName.split(" ")[0] ?? "them";
  const initial = recipientFirst[0]?.toUpperCase() ?? "?";
  const memoriesTotal = 12;
  const memoriesTucked = 9;

  return (
    <main className="mx-auto w-full max-w-[1160px] px-4 pb-10 sm:px-8">
      <Seo
        title={`Your Memory for ${recipientFirst} Is Sealed — WishDem`}
        description={`Your private memory for ${recipientFirst} has been sealed and tucked into their keepsake on WishDem.`}
        path="/contribute/:id/sealed"
        noindex
      />
      <nav className="flex min-h-[68px] items-center border-b border-porcelain/[0.15]">
        <Link to="/" className="text-[21px] font-extrabold tracking-[-1.3px]">
          Wish<i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
          Dem
        </Link>
        <span className="ml-auto text-[9px] font-extrabold text-porcelain/68">PRIVATE INVITATION</span>
      </nav>

      <section className="mx-auto mt-[80px] grid max-w-[830px] gap-4 sm:grid-cols-[minmax(0,1fr)_270px]">
        <article className="relative overflow-hidden rounded-[22px] bg-mulberry p-8 text-[#F6F0E8] shadow-card">
          <span className="text-[9px] font-extrabold tracking-[0.14em] text-champagne">
            YOUR MEMORY HAS BEEN SEALED
          </span>
          <div className="my-4 grid h-[52px] w-[52px] place-items-center rounded-full bg-champagne font-display text-[22px] text-plum">
            {initial}
          </div>
          <h1 className="mb-3 max-w-[470px] font-display text-[38px] leading-[1.04]">
            Your memory is waiting for {recipientFirst}.
          </h1>
          <p className="max-w-[465px] text-[11px] leading-[1.6] text-porcelain/72">
            "{memory.title || "Your memory"}" is safely tucked into {context?.title ?? "the keepsake"},
            ready to open with the group keepsake.
          </p>
          <div className="mt-[23px] flex flex-wrap gap-2">
            <span className="rounded-pill border border-porcelain/25 px-[9px] py-[7px] text-[9px] text-porcelain/82">
              Opens {context?.deliveredLabel ?? "soon"}
            </span>
            <span className="rounded-pill border border-porcelain/25 px-[9px] py-[7px] text-[9px] text-porcelain/82">
              Editable until {context?.collectionClosesLabel ?? "the deadline"}
            </span>
          </div>
        </article>

        <aside className="self-start rounded-[14px] bg-paper p-4 text-ink">
          <span className="text-[9px] font-extrabold tracking-[0.13em] text-mulberry">THE GATHERING</span>
          <h2 className="my-[4px] font-display text-[24px]">A little closer.</h2>
          <p className="text-[10px] leading-[1.5] text-ink/65">
            Your personal note is part of a warm collection — not a public feed.
          </p>
          <div className="border-b border-plum/10 py-[15px]">
            <b className="text-[20px]">{memoriesTucked}th</b>{" "}
            <span className="text-[10px] text-ink/64">memory tucked in</span>
            <div className="my-2 h-[6px] overflow-hidden rounded-pill bg-plum/[0.08]">
              <i
                className="block h-full rounded-pill bg-champagne"
                style={{ width: `${(memoriesTucked / memoriesTotal) * 100}%` }}
              />
            </div>
            <small className="text-[9px] text-ink/62">
              {memoriesTucked} of {memoriesTotal} invited people have added a memory.
            </small>
          </div>
          <div className="mt-[15px] grid gap-[7px]">
            <Link to={`/contribute/${id}/preview`}>
              <button type="button" className="w-full rounded-pill bg-plum px-[10px] py-[10px] text-[9px] font-extrabold text-[#F6F0E8]">
                View your sealed memory
              </button>
            </Link>
            <Link to={`/contribute/${id}`}>
              <button type="button" className="w-full rounded-pill bg-plum/[0.06] px-[10px] py-[10px] text-[9px] font-extrabold text-plum">
                Add another memory
              </button>
            </Link>
            <button
              type="button"
              onClick={() => setReminderSet(true)}
              className="w-full rounded-pill bg-plum/[0.06] px-[10px] py-[10px] text-[9px] font-extrabold text-plum"
            >
              {reminderSet ? "Reminder set ✓" : "Set a birthday reminder"}
            </button>
          </div>
          <div className="mt-[14px] border-t border-plum/10 pt-[14px] text-[9px] leading-[1.5] text-ink/62">
            <b className="text-mulberry">Keep your return path</b>
            <br />
            Copy a secure link to revisit or edit your memory before the keepsake closes.
          </div>
        </aside>
      </section>
    </main>
  );
}
