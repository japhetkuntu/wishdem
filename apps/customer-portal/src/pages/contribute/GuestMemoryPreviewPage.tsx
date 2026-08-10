import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useContributionContext, useMemoryDraft } from "@/hooks/useContribution";
import { AttachmentDisplay } from "@/components/AttachmentDisplay";

export default function GuestMemoryPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { context } = useContributionContext(id);
  const { memory, loading, seal } = useMemoryDraft(id);
  const [sealing, setSealing] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  async function handleSeal() {
    if (!id) return;
    setSealing(true);
    try {
      await seal();
      navigate(`/contribute/${id}/sealed`);
    } finally {
      setSealing(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1160px] px-4 pb-9 sm:px-8">
        <p className="py-16 text-center text-[12px] text-porcelain/55">Loading…</p>
      </main>
    );
  }

  if (!memory) {
    return (
      <main className="mx-auto w-full max-w-[1160px] px-4 pb-9 sm:px-8">
        <p className="py-16 text-center text-[12px] text-porcelain/55">
          You haven't written a memory yet.
        </p>
        <div className="text-center">
          <Link to={`/contribute/${id}`} className="text-[11px] font-bold text-champagne">
            ← Start a memory
          </Link>
        </div>
      </main>
    );
  }

  const recipientFirst = context?.recipientName.split(" ")[0] ?? "them";

  return (
    <main className="mx-auto w-full max-w-[1160px] px-4 pb-10 sm:px-8">
      <nav className="flex min-h-[68px] items-center border-b border-porcelain/[0.15]">
        <Link to="/" className="text-[21px] font-extrabold tracking-[-1.3px]">
          Wish<i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
          Dem
        </Link>
        <span className="ml-auto text-[9px] font-extrabold text-porcelain/68">YOUR MEMORY · PREVIEW</span>
      </nav>

      <section className="mx-auto mt-[50px] grid max-w-[830px] gap-4 sm:grid-cols-[minmax(0,1fr)_270px] sm:items-center">
        <div>
          <span className="text-[9px] font-extrabold tracking-[0.13em] text-champagne">
            A KEEPSAKE CARD FOR {recipientFirst.toUpperCase()}
          </span>
          <h1 className="my-2 font-display text-[38px] leading-[1.08]">See it as {recipientFirst} will receive it.</h1>
          <p className="mb-[18px] text-[11px] leading-[1.6] text-porcelain/68">
            This is the card that will join the finished keepsake. Take a moment — then seal it when
            it feels like you.
          </p>

          <article className="relative max-w-[580px] rounded-[22px] bg-paper p-6 text-ink shadow-card">
            {context && (
              <span className="absolute right-[21px] top-[19px] text-[8px] font-extrabold tracking-[0.1em] text-ink/55">
                FOR {recipientFirst.toUpperCase()} · {context.deliveredLabel.toUpperCase()}
              </span>
            )}
            {memory.whenWhere && (
              <span className="text-[9px] font-extrabold tracking-[0.08em] text-mulberry">
                {memory.whenWhere.toUpperCase()}
              </span>
            )}
            <h2 className="my-[11px] font-display text-[31px] leading-[1.1]">
              {memory.title || "A memory for you"}
            </h2>
            {memory.attachment && (
              <AttachmentDisplay attachment={memory.attachment} fromName={memory.contributorLabel.split("·")[0]?.trim() ?? "them"} />
            )}
            {memory.body && <p className="my-4 font-display text-[14px] leading-[1.65]">{memory.body}</p>}
            <div className="border-t border-plum/10 pt-[13px] text-[10px]">
              <b className="block">{memory.contributorLabel.split("·")[0]?.trim()}</b>
              <span className="text-ink/62">
                {memory.contributorLabel.split("·")[1]?.trim() ?? memory.contributorLabel}
              </span>
            </div>
          </article>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={sealing}
              onClick={handleSeal}
              className="rounded-pill bg-champagne px-[13px] py-[11px] text-[10px] font-extrabold text-plum disabled:opacity-60"
            >
              {sealing ? "Sealing…" : `Seal for ${recipientFirst}`}
            </button>
            <Link to={`/contribute/${id}/compose`}>
              <button type="button" className="rounded-pill bg-porcelain/[0.08] px-[13px] py-[11px] text-[10px] font-extrabold">
                Edit memory
              </button>
            </Link>
            <button
              type="button"
              onClick={() => setSavedNote(true)}
              className="rounded-pill bg-transparent px-[13px] py-[11px] text-[9px] font-extrabold text-porcelain/68 underline"
            >
              {savedNote ? "Saved as draft ✓" : "Save as draft"}
            </button>
          </div>
        </div>

        <aside className="rounded-[14px] bg-paper p-[18px] text-ink">
          <span className="text-[9px] font-extrabold tracking-[0.13em] text-champagne">BEFORE YOU SEAL</span>
          <h2 className="my-[7px] font-display text-[24px]">Personal, private, yours.</h2>
          <p className="text-[10px] leading-[1.55] text-ink/65">
            Your contribution will wait safely with the group collection until {recipientFirst}'s
            birthday.
          </p>
          <div className="border-t border-plum/10 py-[11px] text-[9px] leading-[1.5] text-ink/65">
            <b className="block text-[10px] text-ink">
              Only {recipientFirst} sees it {context?.deliveredLabel}
            </b>
            Other contributors cannot open your memory before delivery.
          </div>
          <div className="border-t border-plum/10 py-[11px] text-[9px] leading-[1.5] text-ink/65">
            <b className="block text-[10px] text-ink">
              Editable until {context?.collectionClosesLabel}
            </b>
            You can return from this invitation to revise your note or replace a file.
          </div>
          <div className="border-t border-plum/10 py-[11px] text-[9px] leading-[1.5] text-ink/65">
            <b className="block text-[10px] text-ink">
              {context?.inviterName ?? "The organizer"} can curate, not rewrite
            </b>
            They may arrange the sequence or ask for a revision, but your words always remain
            attributable to you.
          </div>
        </aside>
      </section>
    </main>
  );
}
