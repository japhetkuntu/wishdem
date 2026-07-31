import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { SealButton } from "@/components/SealButton";
import { AttachmentDisplay } from "@/components/AttachmentDisplay";
import { useWish } from "@/hooks/useWishes";
import { markOpened } from "@/lib/api";
import { formatWeekdayDate } from "@/lib/date";
import { ASSETS } from "@/lib/assets";

export default function RecipientWishPage() {
  const { id } = useParams<{ id: string }>();
  const { wish, loading } = useWish(id);
  const [revealed, setRevealed] = useState(false);

  if (loading) {
    return <main className="grid min-h-screen place-items-center text-porcelain/60">Loading…</main>;
  }

  if (!wish) {
    return (
      <main className="grid min-h-screen place-items-center px-5 text-center">
        <div>
          <h1 className="mb-3 font-display text-[32px]">This wish could not be found.</h1>
          <Link to="/" className="text-champagne">Return home →</Link>
        </div>
      </main>
    );
  }

  const isOpened = revealed || wish.status === "opened";

  async function handleOpen() {
    if (!id) return;
    setRevealed(true);
    await markOpened(id);
  }

  if (!isOpened) {
    return (
      <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_50%_48%,#4A203D,transparent_42%)] px-5 py-10 text-center">
        <section>
          <span className="text-[10px] font-extrabold tracking-[0.15em] text-champagne">
            A BIRTHDAY WISH FOR {wish.recipient.name.toUpperCase()}
          </span>
          <h1 className="my-4 font-display text-[clamp(38px,6vw,76px)] leading-[.98]">
            Someone saved
            <br />
            this for <i className="text-rose italic">today.</i>
          </h1>
          <p className="text-[14px] opacity-70">
            From {wish.fromName} · Held for {formatWeekdayDate(wish.recipient.birthdayISO)}
          </p>

          <div className="mt-9">
            <SealButton
              recipientName={wish.recipient.name}
              onOpen={handleOpen}
              imageSrc={ASSETS.revealVelvetEnvelope.src}
              imageAlt={ASSETS.revealVelvetEnvelope.alt}
            />
          </div>

          <div className="mt-4 text-[10px] font-extrabold tracking-[0.13em] text-champagne">
            A PRIVATE WISH, HELD FOR YOUR DAY
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1250px] px-4 pb-10 pt-6 sm:px-10">
      <header className="mb-7 flex flex-wrap justify-between gap-2 text-[10px] font-extrabold tracking-[0.13em] text-champagne">
        <span>FOR {wish.recipient.name.toUpperCase()}, ON YOUR BIRTHDAY</span>
        <span>FROM {wish.fromName.toUpperCase()}</span>
      </header>

      <section className="grid items-start gap-6 sm:grid-cols-[minmax(0,1.2fr)_minmax(270px,.65fr)] sm:gap-8">
        <article className="rounded-lg bg-porcelain p-6 text-ink shadow-deep sm:p-12">
          <span className="text-[10px] font-extrabold tracking-[0.14em] text-mulberry">
            {formatWeekdayDate(wish.recipient.birthdayISO).toUpperCase()}
          </span>
          <h1 className="my-[22px] font-display text-[36px] sm:text-[44px]">
            Dear {wish.recipient.name},
          </h1>
          {wish.message.split("\n\n").map((paragraph, i) => (
            <p key={i} className="mb-4 font-display text-[17px] leading-[1.65] sm:text-[19px]">
              {paragraph.split("\n").map((line, j) => (
                <span key={j}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          ))}

          {wish.attachment && (
            <AttachmentDisplay attachment={wish.attachment} fromName={wish.fromName} />
          )}

          <a className="mt-[18px] inline-block text-[12px] font-extrabold text-mulberry">
            Keep this wish
          </a>
        </article>

        <aside className="grid gap-[15px] sm:grid-cols-2">
          <div className="col-span-2 mx-auto grid h-[166px] w-[166px] place-items-center rounded-full bg-champagne text-center font-display text-[20px] leading-[1.1] text-plum shadow-deep sm:col-span-1">
            opened
            <br />
            with love
          </div>
          <section className="col-span-2 rounded-lg bg-mulberry p-6">
            <span className="text-[9px] font-extrabold tracking-[0.12em] text-champagne">
              A GOOD FEELING IS WORTH SENDING FORWARD
            </span>
            <h2 className="my-3 font-display text-[26px] leading-[1.1]">
              Hold a future birthday wish for someone you love.
            </h2>
            <p className="mb-4 text-[13px] leading-[1.6] text-porcelain/80">
              Write it while the feeling is here. We'll deliver it when it matters.
            </p>
            <Link to="/create/who">
              <Button>Create a wish</Button>
            </Link>
          </section>
        </aside>
      </section>
    </main>
  );
}
