import { Link } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { SiteNav } from "@/components/SiteNav";
import { Seo } from "@/components/Seo";
import { SmoothImage } from "@/components/SmoothImage";
import { ASSETS } from "@/lib/assets";
import type { OccasionType } from "@/types";

// Testers reported thinking WishDem was a birthday-only tool — the wizard has supported
// six occasion types for a while, but nothing on the landing page ever said so out loud.
// A single example in the hero ("Amina's birthday") read as the whole premise if nothing
// nearby said otherwise, so the hero now shows a spread of occasions (see the date cards
// tucked into its corners below) and this section makes the range impossible to miss at
// a glance either way. Copy mirrors OCCASION_OPTIONS in @/types so the picker and the
// pitch never drift apart.
const OCCASION_SHOWCASE: { value: OccasionType; label: string; body: string; recurring?: boolean }[] = [
  {
    value: "birthday",
    label: "Birthday",
    body: "Say it your way, and we'll remember the date even if you forget to check the calendar.",
    recurring: true,
  },
  {
    value: "anniversary",
    label: "Anniversary",
    body: "Mark the milestone once — it arrives again on its own every year after.",
    recurring: true,
  },
  {
    value: "congratulations",
    label: "Congratulations",
    body: "Have your words ready for the moment they get the good news.",
  },
  {
    value: "thankYou",
    label: "Thank You",
    body: "Some thanks deserve better than a text sent in passing.",
  },
  {
    value: "justBecause",
    label: "Just Because",
    body: "No occasion required. Just a feeling worth keeping until you're ready to share it.",
  },
  {
    value: "other",
    label: "Anything else",
    body: "However you'd name the moment, WishDem holds it until it's time.",
  },
];

export default function HomePage() {
  return (
    <div className="w-full overflow-hidden">
      <Seo
        title="WishDem — Write a Message Today, Delivered on the Day That Matters"
        description="Write a message now for any occasion — birthday, anniversary, congratulations, or just because — and let WishDem deliver it privately on the day it matters. Free to use, no app required."
        path="/"
      />
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <SiteNav />

        <section className="grid min-h-[auto] items-center gap-5 py-14 sm:min-h-[740px] sm:grid-cols-[1.02fr_.98fr] sm:gap-14 sm:py-0">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[1.4px] text-champagne">
              Future kindness, beautifully kept
            </div>
            <h1 className="my-[18px] max-w-[680px] font-display text-[clamp(40px,5.6vw,78px)] leading-[0.98] tracking-[-2px] sm:tracking-[-3px]">
              Record it once.
              <br />
              We deliver it <i className="not-italic italic">on their day.</i>
            </h1>
            <p className="mb-[30px] max-w-[520px] text-[15px] leading-[1.65] text-porcelain/70 sm:text-[17px]">
              The words are here now. Make them a gift for later—WishDem holds your
              message safely, then sends it at exactly the right moment.
            </p>
            <div className="flex flex-wrap items-center gap-[13px]">
              <Link to="/create/message">
                <Button>Start a future wish</Button>
              </Link>
              <Link to="/how-it-works" className="px-2 py-[14px] text-[13px] font-extrabold">
                See how it feels →
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-[18px] text-[11px] font-bold text-porcelain/50">
              <span className="h-[5px] w-[5px] rounded-full bg-champagne" />
              <span>Completely free to use</span>
              <span>•</span>
              <span>Recipient needs no account</span>
            </div>
          </div>

          <div className="relative order-first flex min-h-[340px] items-center justify-center sm:order-none sm:min-h-[520px]">
            <div className="absolute h-[260px] w-[260px] rounded-full border border-champagne/20 sm:h-[410px] sm:w-[410px]" />
            <div className="absolute h-[204px] w-[204px] rounded-full border border-rose/20 sm:h-[354px] sm:w-[354px]" />
            <div className="relative aspect-[4/5] w-[220px] rotate-[4deg] overflow-hidden rounded-lg shadow-deep sm:w-[min(100%,430px)]">
              <SmoothImage
                src={ASSETS.homeHeroGift.src}
                alt={ASSETS.homeHeroGift.alt}
                loading="eager"
                className="h-full w-full"
              />
            </div>
            <div className="absolute right-[10px] top-[30px] grid h-[72px] w-[72px] place-items-center rounded-full bg-champagne text-center font-display text-[14px] leading-[1.05] text-plum shadow-deep sm:right-[-15px] sm:top-[65px] sm:h-[88px] sm:w-[88px]">
              kept
              <br />
              for you
            </div>
            <div className="absolute bottom-[14px] left-0 rounded-md bg-paper px-[19px] py-4 text-[12px] text-ink shadow-card sm:bottom-[30px] sm:left-[-35px]">
              <strong className="mb-[3px] block font-display text-[22px]">14 Oct</strong>
              Amina's birthday
            </div>
            {/* Two more occasions, tucked into the hero's free corners (top-left, opposite
                the "kept for you" badge; bottom-right, opposite the birthday card) — on
                every viewport, not just desktop, so the "not just birthdays" message
                lands before anyone even scrolls. Smaller and tighter on mobile, where
                there's less room to spare, then grow into their full desktop size/position
                from sm up. Same paper-card format as the birthday example so it reads as
                "more of these," not a different kind of thing. */}
            <div className="absolute left-[2px] top-[6px] -rotate-[3deg] rounded-md bg-paper px-3 py-2 text-[10px] text-ink shadow-card sm:left-[-40px] sm:top-[55px] sm:px-4 sm:py-3 sm:text-[11px]">
              <strong className="mb-[1px] block font-display text-[15px] sm:mb-[2px] sm:text-[18px]">2 Dec</strong>
              Kwame's anniversary
            </div>
            <div className="absolute bottom-[6px] right-[2px] rotate-[3deg] rounded-md bg-paper px-3 py-2 text-[10px] text-ink shadow-card sm:bottom-[115px] sm:right-[-30px] sm:px-4 sm:py-3 sm:text-[11px]">
              <strong className="mb-[1px] block font-display text-[15px] sm:mb-[2px] sm:text-[18px]">20 Nov</strong>
              Ama's congratulations
            </div>
          </div>
        </section>

        <section className="border-t border-porcelain/10 py-12 sm:py-16">
          <div className="mb-8 max-w-[560px] sm:mb-10">
            <div className="text-[11px] font-extrabold uppercase tracking-[1.4px] text-champagne">
              More than birthdays
            </div>
            <h2 className="my-[10px] font-display text-[clamp(28px,3.6vw,42px)] leading-[1.05] tracking-[-1px]">
              For every moment worth keeping.
            </h2>
            <p className="text-[14px] leading-[1.65] text-porcelain/70">
              Anniversaries, congratulations, thank-yous, or simply because you were
              thinking of them — if it is worth saying, it is worth scheduling.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-3">
            {OCCASION_SHOWCASE.map((occasion) => (
              <div
                key={occasion.value}
                className="rounded-md border border-porcelain/[0.14] bg-porcelain/[0.04] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <b className="font-display text-[19px]">{occasion.label}</b>
                  {occasion.recurring && (
                    <span className="whitespace-nowrap rounded-pill bg-champagne/20 px-[7px] py-[3px] text-[8px] font-extrabold uppercase tracking-[0.06em] text-champagne">
                      Repeats yearly
                    </span>
                  )}
                </div>
                <p className="mt-[6px] text-[12px] leading-[1.55] text-porcelain/65">{occasion.body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="hidden items-center justify-between border-t border-porcelain/10 py-5 text-[11px] text-porcelain/45 sm:flex">
          <span>Made for the moments you do not want to miss.</span>
          <span className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-porcelain/70">Terms</Link>
            <Link to="/privacy" className="hover:text-porcelain/70">Privacy</Link>
            <span>WishDem © 2026</span>
          </span>
        </div>
      </div>
    </div>
  );
}
