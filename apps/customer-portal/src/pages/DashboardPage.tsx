import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { WishCard } from "@/components/WishCard";
import { EmptyState } from "@/components/EmptyState";
import { CountdownInline } from "@/components/Countdown";
import { useWishes } from "@/hooks/useWishes";
import { daysUntil, formatWeekdayDate } from "@/lib/date";

export default function DashboardPage() {
  const { wishes, loading } = useWishes();
  const [params] = useSearchParams();
  // `?empty=1` forces the empty-dashboard layout for local testing —
  // otherwise this route reflects the mock data layer's current wishes.
  const forceEmpty = params.get("empty") === "1";

  if (loading) {
    return <main className="grid min-h-screen place-items-center text-porcelain/60">Loading…</main>;
  }

  const showEmpty = forceEmpty || (wishes && wishes.length === 0);

  if (showEmpty) {
    return (
      <main className="mx-auto grid min-h-screen max-w-[1260px] place-items-center px-5 py-8">
        <EmptyState
          badge={"for\nlater"}
          eyebrow="NO WISHES ARE WAITING YET"
          title="Some of the best birthday words arrive before you know you'll need them."
          description="Start with one person. Write while the feeling is here, and let WishDem hold it for their day."
          chips={["For a best friend", "For Mum", "For someone far away", "For next year"]}
          action={
            <Link to="/create/who">
              <Button>Create your first wish</Button>
            </Link>
          }
        />
      </main>
    );
  }

  const list = wishes ?? [];
  const sealedUpcoming = list
    .filter((w) => w.status === "sealed")
    .sort(
      (a, b) => daysUntil(a.recipient.birthdayISO) - daysUntil(b.recipient.birthdayISO),
    );
  const next = sealedUpcoming[0];
  const drafts = list.filter((w) => w.status === "draft" && w.message);
  const delivered = list.filter((w) => w.status === "delivered" || w.status === "opened");
  const recentDelivery = delivered[0];

  const counts = [7, 30, 90].map((horizon) => ({
    horizon,
    count: list.filter((w) => daysUntil(w.recipient.birthdayISO) <= horizon).length,
  }));

  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 pb-9 pt-6 sm:px-8">
      <nav className="flex min-h-[48px] items-center justify-between border-b border-porcelain/[0.14] pb-4">
        <Link to="/" className="text-[21px] font-extrabold tracking-[-1.7px]">
          Wish<i className="mx-[2px] mb-2 inline-block h-[7px] w-[7px] rounded-full bg-champagne align-middle" />
          Dem
        </Link>
        <div className="flex items-center gap-[18px]">
          <span className="hidden text-[12px] font-bold opacity-70 sm:inline">Calendar</span>
          <span className="hidden text-[12px] font-bold opacity-70 sm:inline">People</span>
          <Link to="/create/who">
            <Button>Save a future wish</Button>
          </Link>
        </div>
      </nav>

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
              next one is ready for {next.recipient.name}'s birthday in{" "}
              {daysUntil(next.recipient.birthdayISO)} days.
            </p>
          )}
        </div>
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
            {list.map((wish) => (
              <WishCard key={wish.id} wish={wish} />
            ))}
          </section>

          <section className="mt-5 grid gap-[14px] sm:grid-cols-2">
            {recentDelivery && (
              <article className="rounded-lg bg-porcelain p-[17px] text-ink">
                <span className="mb-[5px] block text-[10px] font-extrabold tracking-[0.14em] text-mulberry">
                  OPENED RECENTLY
                </span>
                <h3 className="mb-[6px] font-display text-[23px] leading-[1.1]">
                  {recentDelivery.recipient.name} received your birthday wish.
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
                  ? `${drafts[0].recipient.name}'s birthday letter is saved with your message ready to finish.`
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
            <section className="rounded-lg bg-mulberry p-[18px]">
              <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
                NEXT DELIVERY
              </span>
              <h3 className="my-[5px] font-display text-[21px]">
                {next.recipient.name}'s birthday wish
              </h3>
              <div className="flex items-center justify-between gap-3 border-y border-porcelain/[0.16] py-[10px] text-[12px]">
                <span>
                  {formatWeekdayDate(next.recipient.birthdayISO)}
                  <br />
                  <small className="opacity-70">{next.recipient.timezone} · {next.channel}</small>
                </span>
                <CountdownInline days={daysUntil(next.recipient.birthdayISO)} />
              </div>
              <p className="mt-[11px] text-[11px] leading-[1.5] text-porcelain/72">
                Sealed and scheduled. You can edit it any time before delivery.
              </p>
            </section>
          )}

          <section className="rounded-lg bg-porcelain/[0.055] p-[18px]">
            <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
              BIRTHDAY HORIZON
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
                Delivered safely via {recentDelivery.channel ?? "private link"} · payment
                receipt available
              </p>
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}
