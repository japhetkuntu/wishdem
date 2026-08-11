import { Link, useNavigate, useParams } from "react-router-dom";
import { Loading } from "@wishdem/design-system";
import { Seo } from "@/components/Seo";
import type { MemoryFormat } from "@/types";
import { useContributionContext } from "@/hooks/useContribution";

const CHOICES: { format: MemoryFormat; mark: string; label: string; note: string }[] = [
  { format: "notes", mark: "Aa", label: "A written memory", note: "A story, note, or a few honest lines." },
  { format: "photo", mark: "▢", label: "A photo with a story", note: "One image and why it still matters." },
];

export default function GuestMemoryEntryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { context, loading } = useContributionContext(id);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1160px] px-4 pb-9 pt-6 sm:px-8">
        <Seo
          title="Add a Memory — WishDem"
          description="A private, secure invitation to contribute a memory to someone's keepsake on WishDem."
          path="/contribute/:id"
          noindex
        />
        <Loading />
      </main>
    );
  }

  if (!context) {
    return (
      <main className="mx-auto w-full max-w-[1160px] px-4 pb-9 pt-6 sm:px-8">
        <Seo
          title="Invitation Not Found — WishDem"
          description="This guest contribution invitation could not be found."
          path="/contribute/:id"
          noindex
        />
        <p className="py-16 text-center text-[12px] text-porcelain/55">
          We couldn't find that invitation. It may have expired or the link may be incorrect.
        </p>
      </main>
    );
  }

  const recipientFirst = context.recipientName.split(" ")[0];

  return (
    <main className="mx-auto w-full max-w-[1160px] px-4 pb-10 sm:px-8">
      <Seo
        title={`Add a Memory for ${recipientFirst} — WishDem`}
        description={`${context.inviterName} invited you to add a private memory for ${recipientFirst}'s keepsake on WishDem.`}
        path="/contribute/:id"
        noindex
      />
      <nav className="flex min-h-[68px] items-center border-b border-porcelain/[0.15]">
        <Link to="/" className="text-[21px] font-extrabold tracking-[-1.4px]">
          Wish<i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
          Dem
        </Link>
        <span className="ml-auto text-[9px] text-porcelain/68">
          <b className="text-champagne">Secure invitation</b> · no account needed
        </span>
      </nav>

      <section className="grid gap-[18px] py-14 sm:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="self-start rounded-[14px] border border-porcelain/[0.14] p-[23px]">
          <span className="text-[9px] font-extrabold tracking-[0.12em] text-champagne">
            {context.title.toUpperCase()}
          </span>
          <h2 className="my-[9px] font-display text-[27px] leading-[1.1]">
            A little piece of {recipientFirst}'s story, from you.
          </h2>
          <p className="text-[10px] leading-[1.6] text-porcelain/68">
            {context.inviterName} is gathering a private keepsake for {context.recipientName}. Your
            memory will open with the group collection on {context.deliveredLabel}.
          </p>
          <div className="my-[17px] border-t border-porcelain/[0.13] pt-[13px]">
            <b className="text-[10px]">{context.memoriesWaitingLabel}</b>
            <span className="mt-[3px] block text-[9px] leading-[1.5] text-porcelain/63">
              Every contribution stays private until {recipientFirst}'s birthday.
            </span>
            <div className="mt-2 h-[5px] overflow-hidden rounded-pill bg-porcelain/[0.13]">
              <i
                className="block h-full rounded-pill bg-champagne"
                style={{ width: `${context.memoriesProgress}%` }}
              />
            </div>
          </div>
          <div className="rounded-[9px] border border-champagne/30 p-[11px] text-[9px] leading-[1.55] text-porcelain/72">
            <b className="mb-[3px] block text-champagne">Your memory stays protected</b>
            Other contributors cannot read your draft or sealed memory before delivery. You can edit
            it until the collection closes.
          </div>
        </aside>

        <article className="rounded-[22px] bg-paper p-[27px] text-ink shadow-card">
          <span className="text-[9px] font-extrabold tracking-[0.12em] text-mulberry">
            {context.inviterName.toUpperCase()} INVITED YOU
          </span>
          <h1 className="my-[9px] font-display text-[37px] leading-[1.12]">
            Add one memory for {recipientFirst}.
          </h1>
          <p className="max-w-[540px] text-[12px] leading-[1.6] text-ink/68">
            It does not need to be a perfect tribute. A small true thing, a familiar photo, or a few
            spoken words will mean a great deal.
          </p>
          <span className="my-[15px] inline-block rounded-pill bg-champagne px-2 py-[6px] text-[8px] font-extrabold text-plum">
            WE'RE SEALING THIS KEEPSAKE IN {context.daysLeftLabel.toUpperCase()}
          </span>

          <h3 className="my-3 font-display text-[22px]">How would you like to begin?</h3>
          <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-2">
            {CHOICES.map((choice) => (
              <button
                key={choice.format}
                type="button"
                onClick={() => navigate(`/contribute/${id}/compose?type=${choice.format}`)}
                className="min-h-[100px] rounded-[10px] border border-plum/10 p-3 text-left hover:bg-plum/[0.03]"
              >
                <span className="mb-[6px] block font-display text-[22px] text-mulberry">{choice.mark}</span>
                <strong className="block text-[11px]">{choice.label}</strong>
                <p className="mt-[5px] text-[9px] leading-[1.45] text-ink/63">{choice.note}</p>
              </button>
            ))}
            <div className="min-h-[100px] rounded-[10px] bg-mulberry p-3 text-[#F6F0E8]">
              <span className="mb-[6px] block font-display text-[22px] text-champagne">?</span>
              <strong className="block text-[11px]">Help me remember</strong>
              <p className="mt-[5px] text-[9px] leading-[1.45] text-porcelain/72">
                Gentle prompts for when you are not sure where to start.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-start gap-3 border-t border-plum/10 pt-[14px] sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[9px] text-ink/63">
              <b className="text-mulberry">Save this invitation for later</b>
              <br />
              We can email you a secure return link.
            </span>
            <button
              type="button"
              onClick={() => navigate(`/contribute/${id}/compose?type=notes`)}
              className="rounded-pill bg-plum px-[13px] py-[10px] text-[10px] font-extrabold text-[#F6F0E8]"
            >
              Add your memory
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
