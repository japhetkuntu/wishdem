import { Link } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { SiteNav } from "@/components/SiteNav";
import { Seo } from "@/components/Seo";
import { SmoothImage } from "@/components/SmoothImage";
import { ASSETS } from "@/lib/assets";

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
