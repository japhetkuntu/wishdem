import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { SiteNav } from "@/components/SiteNav";
import { Seo } from "@/components/Seo";

const STEPS = [
  {
    num: "01",
    title: "Create or access your account",
    body: "Start a wish in minutes. Your drafts remain yours until you choose to seal one.",
  },
  {
    num: "02",
    title: "Write what you want them to know",
    body: "Add your message, a photo, or a voice note while the feeling is still close.",
  },
  {
    num: "03",
    title: "Choose the moment and seal it",
    body: "Select the occasion, local delivery time, and channel — completely free.",
  },
  {
    num: "04",
    title: "Follow it through to delivery",
    body: "Your portal shows each wish, meaningful updates, and support if you need it.",
  },
];

const CAPABILITIES = [
  {
    title: "View your account",
    body: "Keep your details, timezone, and communication preferences up to date.",
  },
  {
    title: "Manage wishes",
    body: "Review drafts, change eligible delivery details, and see the look of each sealed wish.",
  },
  {
    title: "Track status & updates",
    body: "See when a message is scheduled, approaching its day, and safely delivered.",
  },
  {
    title: "Get personal support",
    body: "Contact our support team when you need help with a date, delivery, or account question.",
  },
];

const REASSURANCES = [
  {
    title: "Private by design",
    body: "Your message is held for its purpose, not displayed to the people around you.",
  },
  {
    title: "Clear timing",
    body: "We distinguish your recipient's occasion date and local delivery time so there is no guesswork.",
  },
  {
    title: "Support when it counts",
    body: "If something needs your attention, we explain it plainly and help you move forward.",
  },
];

const FAQS = [
  {
    q: "Can I change a wish after I create it?",
    a: "Yes. You can edit drafts and make eligible changes before your wish is sealed for delivery.",
  },
  {
    q: "Will my recipient need an account?",
    a: "No. They receive a private delivery link through the channel you choose.",
  },
  {
    q: "How will I know the wish is on track?",
    a: "Your portal shows the scheduled date, delivery updates, and any action needed from you before it arrives.",
  },
];

export default function HowItWorksPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    el?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  return (
    <div className="w-full">
      <Seo
        title="How It Works — Schedule a Future Message | WishDem"
        description="See exactly how WishDem works: write a message today for any occasion, choose the date and delivery time, and we deliver it privately — free, with no app to install."
        path="/how-it-works"
      />
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <SiteNav />

        <section className="grid gap-6 py-9 sm:grid-cols-[1.1fr_.9fr] sm:gap-11 sm:py-12">
          <div>
            <span className="text-[10px] font-extrabold tracking-[0.14em] text-champagne">
              A FUTURE MOMENT, CAREFULLY KEPT
            </span>
            <h1 className="my-[10px] font-display text-[clamp(38px,5.3vw,68px)] leading-[1] tracking-[-1.5px] sm:tracking-[-1.8px]">
              Write it now.
              <br />
              Let it arrive <i className="text-rose not-italic italic">when it matters.</i>
            </h1>
            <p className="mb-5 max-w-[520px] text-[13px] leading-[1.65] text-porcelain/70 sm:text-[15px]">
              WishDem gives your message a safe place to wait, then sends it
              privately in the recipient's local time—so care arrives exactly when you
              intended.
            </p>
            <Link to="/create/message">
              <Button>Create a wish</Button>
            </Link>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Private by design", "Edit before sealing", "Clear delivery updates"].map(
                (t) => (
                  <span
                    key={t}
                    // A fixed dark chip (not a translucent champagne tint) — the tint
                    // relied on the page canvas itself being dark for contrast, which
                    // breaks in light mode. A solid bg-plum reads correctly either way.
                    className="rounded-pill bg-plum px-[9px] py-[6px] text-[9px] font-extrabold tracking-[0.05em] text-champagne"
                  >
                    {t}
                  </span>
                ),
              )}
            </div>
          </div>

          <aside className="rounded-lg bg-paper p-4 text-ink shadow-card">
            <div className="flex items-start justify-between gap-3 border-b border-plum/[0.09] pb-[13px]">
              <div>
                <span className="text-[10px] font-extrabold tracking-[0.14em] text-mulberry">
                  YOUR FUTURE DELIVERY
                </span>
                <h2 className="my-1 font-display text-[27px]">For Maya's 28th</h2>
              </div>
              <div className="grid h-[49px] w-[49px] flex-none place-items-center rounded-full bg-champagne text-center font-display text-[10px] leading-[1.1] text-plum">
                kept
                <br />
                for her
              </div>
            </div>
            <div className="flex justify-between border-b border-plum/[0.09] py-[10px] text-[11px] leading-[1.5]">
              Recipient <b>Maya Chen</b>
            </div>
            <div className="flex justify-between border-b border-plum/[0.09] py-[10px] text-[11px] leading-[1.5]">
              Delivery <b className="text-right">14 September · 9:00 AM EDT</b>
            </div>
            <div className="flex justify-between border-b border-plum/[0.09] py-[10px] text-[11px] leading-[1.5]">
              Channel <b>Private message link</b>
            </div>
            <div className="flex justify-between py-[10px] text-[11px] leading-[1.5]">
              Message style <b className="text-right">Velvet Night · voice note attached</b>
            </div>
            <div className="mt-3 rounded-sm bg-moss/[0.1] p-[10px] text-[10px]">
              <b className="text-moss">Scheduled with care.</b> You will receive clear
              updates as the delivery day approaches.
            </div>
          </aside>
        </section>
      </div>

      <section id="journey" className="bg-background px-5 py-8 text-ink sm:px-8 sm:py-10">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-[18px] flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
            <div>
              <span className="text-[10px] font-extrabold tracking-[0.14em] text-mulberry">
                THE SIMPLE JOURNEY
              </span>
              <h2 className="my-1 font-display text-[31px] sm:text-[35px]">
                From a real feeling to a real moment.
              </h2>
            </div>
            <p className="max-w-[400px] text-[12px] leading-[1.55] text-ink/60">
              Every step keeps you in control, with simple reminders and a clear view of
              what happens next.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-4">
            {STEPS.map((step) => (
              <article
                key={step.num}
                className="rounded-md border border-plum/[0.11] bg-white p-[15px]"
              >
                <span className="font-display text-[25px] text-mulberry">{step.num}</span>
                <h3 className="my-[7px] text-[12px] font-bold">{step.title}</h3>
                <p className="text-[10px] leading-[1.55] text-ink/60">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <section id="portal" className="py-9 sm:py-10">
          <div className="grid gap-6 sm:grid-cols-[.8fr_1.2fr] sm:gap-9">
            <div>
              <span className="text-[10px] font-extrabold tracking-[0.14em] text-champagne">
                YOUR PRIVATE PORTAL
              </span>
              <h2 className="my-[7px] font-display text-[31px] leading-[1.1] sm:text-[36px]">
                Everything you need, in one thoughtful place.
              </h2>
              <p className="text-[13px] leading-[1.6] text-porcelain/68">
                Not every future message needs the same attention. Your portal makes it
                easy to see what is waiting, adjust what is still open, and understand
                what will happen next.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-2">
              {CAPABILITIES.map((cap) => (
                <article
                  key={cap.title}
                  className="rounded-md border border-porcelain/[0.17] p-[14px]"
                >
                  <b className="mb-[5px] block text-[11px] text-champagne">{cap.title}</b>
                  <span className="text-[10px] leading-[1.5] text-porcelain/68">
                    {cap.body}
                  </span>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-[10px] sm:grid-cols-3">
            {REASSURANCES.map((card) => (
              <article key={card.title} className="rounded-md bg-mulberry p-[14px] text-porcelain [--wd-ink-on-canvas-rgb:246_240_232]">
                <b className="mb-1 block font-display text-[19px] text-champagne">
                  {card.title}
                </b>
                <span className="text-[10px] leading-[1.5] text-porcelain/72">
                  {card.body}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="grid gap-6 py-9 sm:grid-cols-[.8fr_1.2fr] sm:gap-8 sm:py-10">
          <div>
            <span className="text-[10px] font-extrabold tracking-[0.14em] text-champagne">
              A FEW GOOD QUESTIONS
            </span>
            <h2 className="my-1 font-display text-[31px] sm:text-[36px]">
              We keep the process clear.
            </h2>
            <p className="text-[12px] leading-[1.55] text-porcelain/68">
              Need a little more reassurance before you begin? Here are the things
              people ask most often.
            </p>
          </div>
          <div>
            {FAQS.map((item) => (
              <article key={item.q} className="border-t border-porcelain/[0.16] py-[13px]">
                <b className="text-[12px]">{item.q}</b>
                <p className="mt-[5px] text-[10px] text-porcelain/68">{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-9 flex flex-col items-start gap-5 rounded-lg bg-paper p-6 text-ink sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-[26px] sm:text-[30px]">
              A small act of care, ready for its day.
            </h2>
            <p className="mt-1 text-[11px] text-ink/60">
              Write the message while it is here. We will help it arrive when it
              matters.
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline-inverse" className="w-full sm:w-auto">
                Sign in to your portal
              </Button>
            </Link>
            <Link to="/create/message" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">Create a wish</Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
