import type { ReactNode } from "react";

export function EmptyState({
  badge,
  eyebrow,
  title,
  description,
  chips,
  action,
}: {
  badge: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  chips?: string[];
  action?: ReactNode;
}) {
  return (
    <section className="grid min-h-[520px] place-items-center rounded-lg bg-[radial-gradient(circle_at_50%_40%,#4A203D,transparent_40%)] px-5 py-10 text-center sm:min-h-[700px] sm:px-8">
      <div className="mx-auto max-w-[720px]">
        <div className="mx-auto grid h-[112px] w-[112px] place-items-center rounded-full bg-champagne text-center font-display text-[25px] text-plum">
          {badge}
        </div>
        <span className="mt-6 block text-[11px] font-extrabold tracking-[0.14em] text-champagne">
          {eyebrow}
        </span>
        <h1 className="my-4 font-display text-[clamp(34px,6vw,58px)] leading-[1.05]">
          {title}
        </h1>
        <p className="leading-[1.7] text-porcelain/75">{description}</p>
        {chips && chips.length > 0 && (
          <div className="mt-7 flex flex-wrap justify-center gap-[9px]">
            {chips.map((chip) => (
              <b
                key={chip}
                className="rounded-pill border border-porcelain/25 px-[13px] py-[10px] text-[12px] font-normal"
              >
                {chip}
              </b>
            ))}
          </div>
        )}
        {action && <div className="mt-7">{action}</div>}
      </div>
    </section>
  );
}
