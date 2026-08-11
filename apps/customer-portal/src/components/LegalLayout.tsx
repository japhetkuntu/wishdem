import type { ReactNode } from "react";
import { SiteNav } from "@/components/SiteNav";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

export function LegalLayout({
  title,
  effectiveDate,
  intro,
  sections,
}: {
  title: string;
  effectiveDate: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="w-full">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <SiteNav />

        <section className="py-9 sm:py-12">
          <span className="text-[10px] font-extrabold tracking-[0.14em] text-champagne">
            {effectiveDate.toUpperCase()}
          </span>
          <h1 className="my-3 max-w-[640px] font-display text-[clamp(34px,5vw,54px)] leading-[1.05] tracking-[-1.2px]">
            {title}
          </h1>
          <p className="max-w-[620px] text-[13px] leading-[1.7] text-porcelain/70 sm:text-[14px]">
            {intro}
          </p>
        </section>

        <section className="mb-14 max-w-[720px]">
          {sections.map((section) => (
            <article key={section.heading} className="border-t border-porcelain/[0.14] py-[22px]">
              <h2 className="mb-[10px] font-display text-[20px] sm:text-[23px]">{section.heading}</h2>
              <div className="space-y-[10px] text-[13px] leading-[1.75] text-porcelain/72">
                {section.body}
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
