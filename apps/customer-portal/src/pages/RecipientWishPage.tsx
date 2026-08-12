import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import clsx from "clsx";
import { Button, Loading } from "@wishdem/design-system";
import { Seo } from "@/components/Seo";
import { SealButton } from "@/components/SealButton";
import { AttachmentDisplay } from "@/components/AttachmentDisplay";
import { ShareLinks } from "@/components/ShareLinks";
import { ShareImageActions } from "@/components/ShareImageActions";
import { useAuth } from "@/hooks/useAuth";
import { usePublicWish } from "@/hooks/useWishes";
import { markOpened } from "@/lib/api";
import { formatWeekdayDate } from "@/lib/date";
import { occasionPhrase } from "@/lib/occasion";
import { getThemeImage } from "@/lib/themeImages";

/** This page is reached either from an outside link (SMS/share, no in-app history to
 * go back to) or from a sender's own dashboard ("View details") — either way, there
 * was previously no way out except the browser's own back button. A link to home
 * covers both cases without needing to know which one brought them here. When the
 * sender is the one viewing (logged in), "home" means their dashboard, not the
 * marketing landing page they'd otherwise land on. */
function BackHome({ className, loggedIn }: { className?: string; loggedIn: boolean }) {
  return (
    <Link
      to={loggedIn ? "/dashboard" : "/"}
      className={clsx(
        "inline-flex items-center gap-1 text-[11px] font-extrabold tracking-[0.08em] text-champagne/80 transition-colors hover:text-champagne",
        className,
      )}
    >
      ← WishDem
    </Link>
  );
}

export default function RecipientWishPage() {
  const { id } = useParams<{ id: string }>();
  const { wish, loading, setWish } = usePublicWish(id);
  const { user } = useAuth();
  const [revealed, setRevealed] = useState(false);

  if (loading) {
    return (
      <main>
        <Seo
          title="Your Wish — WishDem"
          description="A private wish held for you on WishDem."
          path="/w/:id"
          noindex
        />
        <Loading size="page" label="Unwrapping your wish" />
      </main>
    );
  }

  if (!wish) {
    return (
      <main className="grid min-h-screen place-items-center px-5 text-center">
        <Seo
          title="Wish Not Found — WishDem"
          description="This private wish link could not be found."
          path="/w/:id"
          noindex
        />
        <div>
          <h1 className="mb-3 font-display text-[32px]">This wish could not be found.</h1>
          <Link to={user ? "/dashboard" : "/"} className="text-champagne">Return home →</Link>
        </div>
      </main>
    );
  }

  const isOpened = revealed || wish.status === "opened";
  // "sealed" means the delivery worker hasn't confirmed the scheduled moment has
  // arrived yet — the backend rejects opening it early regardless, but showing that
  // up front (no clickable seal at all) is a much better experience than letting
  // someone tap it and get an error back.
  const isDue = wish.status !== "sealed";
  const vesselImage = getThemeImage(wish.themeId, "reveal");

  async function handleOpen() {
    if (!id) return;
    try {
      // The public GET never includes the message/attachment before the wish is opened —
      // markOpened's response is what actually reveals the content, so we store that.
      const revealedWish = await markOpened(id);
      setWish(revealedWish);
      setRevealed(true);
    } catch {
      // SealButton already played its crack animation optimistically by the time this
      // rejects (the isDue gate above makes it exceedingly rare — only a race where the
      // wish's due moment hasn't landed by a few seconds) — a full reload is simpler and
      // more honest than trying to reverse an animation that's already mid-flight, and it
      // naturally re-renders the correct "not yet" state if it's still not due.
      window.location.reload();
    }
  }

  if (!isOpened) {
    const phrase = occasionPhrase(wish.recipient.occasion, wish.recipient.occasionLabel);
    // Fixed-dark page by design (the "someone saved this for you" ceremony), same as
    // the sealed-confirmation screen — a gradient fading to transparent used to reveal
    // the light page canvas at the edges in light mode while the text stayed the light
    // "porcelain" color, going nearly invisible there. bg-plum + the ink-on-canvas
    // override keep it a real dark island regardless of site theme.
    return (
      <main className="relative grid min-h-screen place-items-center bg-plum bg-[radial-gradient(circle_at_50%_48%,#4A203D,transparent_70%)] px-5 py-10 text-center text-porcelain [--wd-ink-on-canvas-rgb:246_240_232]">
        <Seo
          title={`A ${phrase[0].toUpperCase()}${phrase.slice(1)} for ${wish.recipient.name} — WishDem`}
          description={`Someone saved a private ${phrase} for ${wish.recipient.name} on WishDem.`}
          path="/w/:id"
          noindex
        />
        <BackHome className="absolute left-5 top-5" loggedIn={!!user} />
        <section>
          <span className="text-[10px] font-extrabold tracking-[0.15em] text-champagne">
            A {phrase.toUpperCase()} FOR {wish.recipient.name.toUpperCase()}
          </span>
          <h1 className="my-4 font-display text-[clamp(38px,6vw,76px)] leading-[.98]">
            Someone saved
            <br />
            this for <i className="text-rose italic">today.</i>
          </h1>
          <p className="text-[14px] opacity-70">
            From {wish.fromName} · Held for {formatWeekdayDate(wish.recipient.occasionDateISO)}
          </p>

          {isDue ? (
            <>
              <div className="mt-9">
                <SealButton
                  recipientName={wish.recipient.name}
                  onOpen={handleOpen}
                  imageSrc={vesselImage.src}
                  imageAlt={vesselImage.alt}
                />
              </div>
              <div className="mt-4 text-[10px] font-extrabold tracking-[0.13em] text-champagne">
                A PRIVATE WISH, HELD FOR YOUR DAY
              </div>
            </>
          ) : (
            <>
              <div className="mt-9 opacity-60 grayscale">
                <img
                  src={vesselImage.src}
                  alt={vesselImage.alt}
                  className="mx-auto h-[220px] w-[220px] rounded-2xl object-cover shadow-deep"
                />
              </div>
              <div className="mt-4 text-[10px] font-extrabold tracking-[0.13em] text-champagne">
                NOT YET — COME BACK ON {formatWeekdayDate(wish.recipient.occasionDateISO).toUpperCase()}
              </div>
            </>
          )}
        </section>
      </main>
    );
  }

  const openedPhrase = occasionPhrase(wish.recipient.occasion, wish.recipient.occasionLabel);
  return (
    <main className="mx-auto w-full max-w-[1250px] px-4 pb-10 pt-6 sm:px-10">
      <Seo
        title={`${wish.recipient.name}'s ${openedPhrase[0].toUpperCase()}${openedPhrase.slice(1)} — WishDem`}
        description={`An opened ${openedPhrase} from ${wish.fromName} to ${wish.recipient.name} on WishDem.`}
        path="/w/:id"
        noindex
      />
      <BackHome className="mb-5" loggedIn={!!user} />
      <header className="mb-7 flex flex-wrap justify-between gap-2 text-[10px] font-extrabold tracking-[0.13em] text-champagne">
        <span>FOR {wish.recipient.name.toUpperCase()}</span>
        <span>FROM {wish.fromName.toUpperCase()}</span>
      </header>

      <section className="grid items-start gap-6 sm:grid-cols-[minmax(0,1.2fr)_minmax(270px,.65fr)] sm:gap-8">
        <article className={clsx("rounded-lg bg-paper p-6 text-ink shadow-deep sm:p-12", revealed && "animate-wd-reveal-rise")}>
          <span
            className={clsx("text-[10px] font-extrabold tracking-[0.14em] text-mulberry", revealed && "animate-wd-reveal-rise")}
            style={revealed ? { animationDelay: "80ms" } : undefined}
          >
            {formatWeekdayDate(wish.recipient.occasionDateISO).toUpperCase()}
          </span>
          <h1
            className={clsx("my-[22px] font-display text-[36px] sm:text-[44px]", revealed && "animate-wd-reveal-rise")}
            style={revealed ? { animationDelay: "180ms" } : undefined}
          >
            Dear {wish.recipient.name},
          </h1>
          {wish.message.split("\n\n").map((paragraph, i) => (
            <p
              key={i}
              className={clsx("mb-4 font-display text-[17px] leading-[1.65] sm:text-[19px]", revealed && "animate-wd-reveal-rise")}
              style={revealed ? { animationDelay: `${280 + i * 130}ms` } : undefined}
            >
              {paragraph.split("\n").map((line, j) => (
                <span key={j}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          ))}

          {wish.attachment && (
            <div
              className={revealed ? "animate-wd-reveal-rise" : undefined}
              style={revealed ? { animationDelay: `${280 + wish.message.split("\n\n").length * 130 + 120}ms` } : undefined}
            >
              <AttachmentDisplay attachment={wish.attachment} fromName={wish.fromName} />
            </div>
          )}

          <div className="mt-[22px] border-t border-ink/10 pt-[18px]">
            <p className="mb-3 text-[11px] font-extrabold tracking-[0.08em] text-mulberry">
              SHARE THE FEELING
            </p>
            <ShareLinks
              url={window.location.href}
              shareText={`Someone remembered — sending this kindness forward. 💛`}
              tone="light"
            />
            <div className="mt-4 border-t border-ink/10 pt-4">
              <ShareImageActions
                variant="opened"
                recipientName={wish.recipient.name}
                fromName={wish.fromName}
                dateLabel={formatWeekdayDate(wish.recipient.occasionDateISO)}
                quote={wish.message}
                imageSrc={vesselImage.src}
                filename={`wishdem-${wish.recipient.name.toLowerCase().replace(/\s+/g, "-")}`}
                tone="light"
              />
            </div>
          </div>
        </article>

        <aside
          className={clsx("grid gap-[15px] sm:grid-cols-2", revealed && "animate-wd-reveal-rise")}
          style={revealed ? { animationDelay: "520ms" } : undefined}
        >
          <div className="col-span-2 mx-auto grid h-[166px] w-[166px] place-items-center rounded-full bg-champagne text-center font-display text-[20px] leading-[1.1] text-plum shadow-deep sm:col-span-1">
            opened
            <br />
            with love
          </div>
          <section className="col-span-2 rounded-lg bg-mulberry p-6 text-porcelain [--wd-ink-on-canvas-rgb:246_240_232]">
            <span className="text-[9px] font-extrabold tracking-[0.12em] text-champagne">
              A GOOD FEELING IS WORTH SENDING FORWARD
            </span>
            <h2 className="my-3 font-display text-[26px] leading-[1.1]">
              Hold a future wish for someone you love.
            </h2>
            <p className="mb-4 text-[13px] leading-[1.6] text-porcelain/80">
              Write it while the feeling is here. We'll deliver it when it matters.
            </p>
            <Link to="/create/message">
              <Button>Create a wish</Button>
            </Link>
          </section>
        </aside>
      </section>
    </main>
  );
}
