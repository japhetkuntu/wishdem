import { Link, useParams } from "react-router-dom";
import { useBirthdayBloom } from "@/hooks/useBirthdayBloom";

export default function BloomCoverPage() {
  const { id } = useParams<{ id: string }>();
  const { bloom, loading } = useBirthdayBloom(id);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1160px] px-4 pb-9 sm:px-8">
        <p className="py-16 text-center text-[12px] text-porcelain/55">Loading…</p>
      </main>
    );
  }

  if (!bloom) {
    return (
      <main className="mx-auto w-full max-w-[1160px] px-4 pb-9 sm:px-8">
        <nav className="flex min-h-[68px] items-center border-b border-porcelain/[0.15]">
          <Link to="/" className="text-[21px] font-extrabold tracking-[-1.4px]">
            Wish<i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
            Dem
          </Link>
        </nav>
        <p className="py-16 text-center text-[12px] text-porcelain/55">
          Nothing has been gathered here yet — contributions will appear once people add their
          memories.
        </p>
      </main>
    );
  }

  const initials = bloom.wishes.map((w) => ({
    letter: w.contributorName[0]?.toUpperCase() ?? "?",
    opened: w.opened,
  }));

  return (
    <main className="mx-auto w-full max-w-[1160px] px-4 pb-10 sm:px-8">
      <nav className="flex min-h-[68px] items-center border-b border-porcelain/[0.15]">
        <Link to="/" className="text-[21px] font-extrabold tracking-[-1.4px]">
          Wish<i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
          Dem
        </Link>
        <span className="ml-auto text-[9px] font-extrabold text-porcelain/68">
          {bloom.deliveryDateLabel.toUpperCase()} · {bloom.recipientName.split(" ")[0].toUpperCase()}'S
          BIRTHDAY
        </span>
      </nav>

      <section className="mt-[72px] grid gap-4 sm:grid-cols-[minmax(0,1fr)_265px] sm:items-center">
        <article className="relative overflow-hidden rounded-[22px] bg-mulberry p-8 text-porcelain [--wd-ink-on-canvas-rgb:246_240_232] shadow-card">
          <span className="text-[9px] font-extrabold tracking-[0.14em] text-champagne">
            A BIRTHDAY BLOOM, GATHERED FOR YOU
          </span>
          <h1 className="my-3 max-w-[540px] font-display text-[clamp(32px,4.5vw,47px)] leading-[1.02]">
            {bloom.recipientName.split(" ")[0]}, this was gathered for you.
          </h1>
          <p className="max-w-[480px] text-[12px] leading-[1.6] text-porcelain/74">
            {bloom.organizerName} and the people who hold pieces of your story have been keeping
            something safe for today. Take all the time you need.
          </p>

          <div className="mt-[22px] rounded-[14px] bg-paper p-[17px] text-ink">
            <b className="text-[9px] tracking-[0.1em] text-mulberry">FROM {bloom.organizerName.toUpperCase()}</b>
            <p className="my-[7px] font-display text-[18px] leading-[1.45]">"{bloom.organizerNote}"</p>
            <span className="text-[9px] text-ink/62">
              {bloom.wishes.length} contributions · sealed until this morning
            </span>
          </div>

          <div className="mt-[19px] flex flex-wrap gap-2">
            <Link to={`/bloom/${id}/gallery?reveal=1`}>
              <button type="button" className="rounded-pill bg-champagne px-[14px] py-[11px] text-[10px] font-extrabold text-plum">
                Begin the reveal
              </button>
            </Link>
            <Link to={`/bloom/${id}/gallery`}>
              <button type="button" className="rounded-pill bg-porcelain/[0.15] px-[14px] py-[11px] text-[10px] font-extrabold text-porcelain">
                View all wishes
              </button>
            </Link>
          </div>
        </article>

        <aside className="rounded-[14px] border border-porcelain/[0.15] p-[17px]">
          <span className="text-[9px] font-extrabold tracking-[0.14em] text-champagne">THE PEOPLE BEHIND IT</span>
          <h2 className="my-2 font-display text-[26px] leading-[1.1]">
            {bloom.wishes.length} people gathered something for you.
          </h2>
          <div className="my-[14px] grid grid-cols-5 gap-[6px]">
            {initials.map((entry, i) => (
              <div
                key={`${entry.letter}-${i}`}
                className={
                  entry.opened
                    ? "grid h-[38px] place-items-center rounded-full bg-champagne text-[11px] font-extrabold text-plum"
                    : "grid h-[38px] place-items-center rounded-full bg-porcelain/[0.09] text-[11px] font-extrabold text-porcelain/70"
                }
              >
                {entry.letter}
              </div>
            ))}
          </div>
          <p className="text-[10px] leading-[1.55] text-porcelain/68">
            Open one at a time, or browse whenever you are ready. Everything is here for you.
          </p>
          <div className="border-t border-porcelain/[0.15] pt-[11px] text-[9px] leading-[1.65] text-porcelain/68">
            <b className="text-porcelain">{bloom.wishes.length} wishes</b> ·{" "}
            {bloom.wishes.filter((w) => w.type === "note").length} notes ·{" "}
            {bloom.wishes.filter((w) => w.type === "photo-note" || w.type === "photo-memory").length}{" "}
            photos
            <br />
            {bloom.wishes.filter((w) => w.type === "voice").length} voice message
            {bloom.wishes.filter((w) => w.type === "voice").length === 1 ? "" : "s"} ·{" "}
            {bloom.wishes.filter((w) => w.type === "video").length} video
          </div>
        </aside>
      </section>
    </main>
  );
}
