import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Loading } from "@wishdem/design-system";
import { Seo } from "@/components/Seo";
import { AppNav } from "@/components/AppNav";
import { WishCard } from "@/components/WishCard";
import { EmptyState } from "@/components/EmptyState";
import { CountdownInline } from "@/components/Countdown";
import { useWishes } from "@/hooks/useWishes";
import { daysUntilOccasion, formatWeekdayDate } from "@/lib/date";

// Numbered pages ("1 2 3 →") ask you to do arithmetic about how far in your own history
// you want to go — a progressive reveal just asks "a few more?", which reads calmer for a
// list of personal, sentimental moments. Each reveal shows one more handful and nothing
// more; nothing to lose your place in, nothing to page back from.
const REVEAL_BATCH_SIZE = 6;

export default function DashboardPage() {
  const { wishes, loading, refresh } = useWishes();
  const [visibleCount, setVisibleCount] = useState(REVEAL_BATCH_SIZE);
  const [params] = useSearchParams();
  // `?empty=1` forces the empty-dashboard layout for local testing —
  // otherwise this route reflects the mock data layer's current wishes.
  const forceEmpty = params.get("empty") === "1";

  if (loading) {
    return (
      <main>
        <Seo
          title="Your Wishes — WishDem"
          description="Your private dashboard of wishes in progress and scheduled for delivery."
          path="/dashboard"
          noindex
        />
        <Loading size="page" label="Gathering your wishes" />
      </main>
    );
  }

  const showEmpty = forceEmpty || (wishes && wishes.length === 0);

  if (showEmpty) {
    return (
      <main className="mx-auto w-full max-w-[1320px] px-4 pb-[104px] pt-6 sm:px-8 sm:pb-9">
        <Seo
          title="Your Wishes — WishDem"
          description="Your private dashboard of wishes in progress and scheduled for delivery."
          path="/dashboard"
          noindex
        />
        <AppNav active="wishes" />
        <div className="grid min-h-[70vh] place-items-center py-8">
          <EmptyState
            badge={"for\nlater"}
            eyebrow="NO WISHES ARE WAITING YET"
            title="Some of the best words arrive before you know you'll need them."
            description="Start with one person. Write while the feeling is here, and let WishDem hold it for their day."
            chips={["For a best friend", "For Mum", "For someone far away", "For next year"]}
            action={
              <Link to="/create/message">
                <Button>Create your first wish</Button>
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  const list = wishes ?? [];
  const sealedUpcoming = list
    .filter((w) => w.status === "sealed")
    .sort(
      (a, b) => daysUntilOccasion(a.recipient.occasion, a.recipient.occasionDateISO) - daysUntilOccasion(b.recipient.occasion, b.recipient.occasionDateISO),
    );
  const next = sealedUpcoming[0];
  const drafts = list.filter((w) => w.status === "draft" && w.message);
  const delivered = list.filter((w) => w.status === "delivered" || w.status === "opened");
  const recentDelivery = delivered[0];

  // Kept = anything past draft — a real, sealed promise to someone, whether it has
  // arrived yet or not. Counting this (instead of just "delivered") is what makes the
  // number climb the moment you seal a wish, not months later when it finally lands.
  const keptCount = list.filter((w) => w.status !== "draft").length;
  const uniqueRecipients = new Set(list.filter((w) => w.status !== "draft").map((w) => w.recipient.name)).size;

  const counts = [7, 30, 90].map((horizon) => ({
    horizon,
    count: list.filter((w) => daysUntilOccasion(w.recipient.occasion, w.recipient.occasionDateISO) <= horizon).length,
  }));

  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 pb-[104px] pt-6 sm:px-8 sm:pb-9">
      <Seo
        title="Your Wishes — WishDem"
        description="Your private dashboard of wishes in progress and scheduled for delivery."
        path="/dashboard"
        noindex
      />
      <AppNav active="wishes" />

      <section className="flex flex-col gap-3 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-[7px] block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
            GOOD EVENING
          </span>
          <h1 className="font-display text-[clamp(30px,4vw,48px)] leading-[1.05] tracking-[-1.3px]">
            Your wishes are in bloom.
          </h1>
          {next && (
            <p className="mt-2 max-w-[480px] text-[13px] leading-[1.55] text-porcelain/70">
              {list.length} moment{list.length === 1 ? "" : "s"} already in motion. The
              next one is ready for {next.recipient.name} in{" "}
              {daysUntilOccasion(next.recipient.occasion, next.recipient.occasionDateISO)} days.
            </p>
          )}
        </div>
        {keptCount > 0 && (
          <Link
            to="/create/message"
            className="flex flex-none items-center gap-3 rounded-lg border border-champagne/35 bg-porcelain/[0.04] px-4 py-3 transition-colors hover:border-champagne/60 hover:bg-porcelain/[0.07]"
          >
            <div className="text-right">
              <b className="block font-display text-[26px] leading-none text-champagne">{keptCount}</b>
              <small className="text-[9px] font-extrabold tracking-[0.08em] text-porcelain/60">
                MOMENT{keptCount === 1 ? "" : "S"} KEPT{uniqueRecipients > 1 ? ` · ${uniqueRecipients} PEOPLE` : ""}
              </small>
            </div>
            <span className="text-[11px] font-extrabold text-champagne">Keep it going →</span>
          </Link>
        )}
      </section>

      <section className="grid items-start gap-[14px] sm:grid-cols-[minmax(0,1.58fr)_minmax(285px,.72fr)] sm:gap-5">
        <div>
          <section className="overflow-hidden rounded-lg border border-porcelain/[0.14] bg-porcelain/[0.045]">
            <header className="flex items-center justify-between border-b border-porcelain/[0.12] px-[18px] py-[13px]">
              <h2 className="font-display text-[22px]">Upcoming moments</h2>
              <span className="text-[11px] font-extrabold text-champagne">
                {list.length} ACTIVE
              </span>
            </header>
            {list.slice(0, visibleCount).map((wish, i) => (
              <div
                key={wish.id}
                // Only the newest batch is ever mounting for the first time — earlier
                // cards don't remount when visibleCount grows, so this only plays once
                // per card, staggered within its own reveal, never on the ones already settled.
                className="animate-wd-reveal-rise"
                style={{ animationDelay: `${(i % REVEAL_BATCH_SIZE) * 45}ms` }}
              >
                <WishCard wish={wish} onRetried={refresh} />
              </div>
            ))}
            {visibleCount < list.length && (
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + REVEAL_BATCH_SIZE)}
                className="group flex w-full flex-col items-center gap-[9px] border-t border-porcelain/[0.12] px-[18px] py-[16px] text-center transition-colors hover:bg-porcelain/[0.03]"
              >
                <div className="h-[3px] w-full max-w-[220px] overflow-hidden rounded-full bg-porcelain/[0.12]">
                  <div
                    className="h-full rounded-full bg-champagne transition-[width] duration-500 ease-out"
                    style={{ width: `${(visibleCount / list.length) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-extrabold text-champagne transition-transform group-hover:translate-y-[1px]">
                  Reveal {Math.min(REVEAL_BATCH_SIZE, list.length - visibleCount)} more · {visibleCount} of {list.length} →
                </span>
              </button>
            )}
          </section>

          <section className="mt-5 grid gap-[14px] sm:grid-cols-2">
            {recentDelivery && (
              <article className="rounded-lg bg-paper p-[17px] text-ink">
                <span className="mb-[5px] block text-[10px] font-extrabold tracking-[0.14em] text-mulberry">
                  OPENED RECENTLY
                </span>
                <h3 className="mb-[6px] font-display text-[23px] leading-[1.1]">
                  {recentDelivery.recipient.name} received your wish.
                </h3>
                <p className="text-[12px] leading-[1.5] text-ink/70">
                  The letter you sealed is now in their hands.
                </p>
                <Link
                  to={`/w/${recentDelivery.id}`}
                  className="mt-[10px] inline-block text-[11px] font-extrabold text-mulberry"
                >
                  View the opened wish →
                </Link>
              </article>
            )}
            <article className="rounded-lg border border-porcelain/[0.14] bg-porcelain/[0.045] p-[17px]">
              <h3 className="mb-[9px] font-display text-[22px]">
                {drafts.length > 0
                  ? `${drafts.length} draft${drafts.length === 1 ? "" : "s"} waiting.`
                  : "No drafts waiting."}
              </h3>
              <p className="mb-[11px] text-[12px] leading-[1.5] text-porcelain/70">
                {drafts.length > 0
                  ? `${drafts[0].recipient.name}'s letter is saved with your message ready to finish.`
                  : "Every letter you start gets saved automatically as a draft."}
              </p>
              {drafts.length > 0 && (
                <Link
                  to={`/create/who?wishId=${drafts[0].id}`}
                  className="text-[11px] font-extrabold text-champagne"
                >
                  Continue {drafts[0].recipient.name}'s draft →
                </Link>
              )}
            </article>
          </section>
        </div>

        <aside className="grid gap-[14px]">
          {next && (
            <section className="rounded-lg bg-mulberry p-[18px] text-porcelain [--wd-ink-on-canvas-rgb:246_240_232]">
              <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
                NEXT DELIVERY
              </span>
              <h3 className="my-[5px] font-display text-[21px]">
                {next.recipient.name}'s wish
              </h3>
              <div className="flex items-center justify-between gap-3 border-y border-porcelain/[0.16] py-[10px] text-[12px]">
                <span>
                  {formatWeekdayDate(next.recipient.occasionDateISO)}
                  <br />
                  <small className="opacity-70">{next.recipient.timezone} · {next.channel}</small>
                </span>
                <CountdownInline days={daysUntilOccasion(next.recipient.occasion, next.recipient.occasionDateISO)} />
              </div>
              <p className="mt-[11px] text-[11px] leading-[1.5] text-porcelain/72">
                Sealed and scheduled. You can edit it any time before delivery.
              </p>
            </section>
          )}

          <section className="rounded-lg bg-porcelain/[0.055] p-[18px]">
            <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
              WHAT'S AHEAD
            </span>
            <h3 className="my-[5px] mb-[10px] font-display text-[21px]">Moments ahead</h3>
            <div className="grid grid-cols-3 gap-2">
              {counts.map(({ horizon, count }) => (
                <div key={horizon} className="border-r border-porcelain/[0.12] py-[9px] text-center last:border-0">
                  <b className="block font-display text-[26px] text-champagne">{count}</b>
                  <small className="text-[9px] font-extrabold tracking-[0.08em] opacity-65">
                    IN {horizon} DAYS
                  </small>
                </div>
              ))}
            </div>
          </section>

          {recentDelivery && (
            <section className="rounded-lg border border-champagne/35 p-[18px]">
              <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
                RECENT DELIVERY
              </span>
              <b className="text-[12px]">
                {recentDelivery.recipient.name}'s wish reached them.
              </b>
              <p className="mt-[5px] text-[11px] leading-[1.5] text-porcelain/72">
                Delivered safely via {recentDelivery.channel ?? "private link"}
              </p>
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}
