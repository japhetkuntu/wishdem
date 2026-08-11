import type { ReactNode } from "react";
import { Link } from "react-router-dom";

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
  /** Each chip is a real shortcut into the wizard, not decoration — they used to look
   * like buttons (bordered pill shape) without being clickable, which is exactly the
   * kind of dead-end tap that makes an app feel broken. */
  chips?: string[];
  action?: ReactNode;
}) {
  return (
    // Fixed dark backdrop (not just a radial glow fading to transparent) — in light mode
    // the fade-out edges used to reveal the light page canvas underneath, while the text
    // stayed the light "porcelain" color meant for a dark background, so it went nearly
    // invisible wherever the gradient had faded out. Forcing a solid bg-plum base plus the
    // ink-on-canvas override makes this a proper "dark island" like the rest of the app's
    // fixed-dark surfaces, so contrast holds regardless of the site theme.
    <section className="grid min-h-[520px] place-items-center rounded-lg bg-plum bg-[radial-gradient(circle_at_50%_40%,#4A203D,transparent_70%)] px-5 py-10 text-center text-porcelain [--wd-ink-on-canvas-rgb:246_240_232] sm:min-h-[700px] sm:px-8">
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
              <Link
                key={chip}
                to="/create/message"
                className="rounded-pill border border-porcelain/25 px-[13px] py-[10px] text-[12px] font-normal transition-colors hover:border-champagne/60 hover:text-champagne"
              >
                {chip}
              </Link>
            ))}
          </div>
        )}
        {action && <div className="mt-7">{action}</div>}
      </div>
    </section>
  );
}
