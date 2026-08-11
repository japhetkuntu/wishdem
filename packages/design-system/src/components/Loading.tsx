import clsx from "clsx";

export type LoadingSize = "page" | "inline";

export interface LoadingProps {
  /** Shown beneath the mark. Keep it short — this is a glance, not a sentence. */
  label?: string;
  /** "page" fills the viewport (use for a whole-page gate); "inline" sits inside an
   * already-rendered layout (use inside a section that's still fetching its own data). */
  size?: LoadingSize;
  className?: string;
}

/** The pulsing gold dot from the WishDem wordmark, animated as the loading indicator
 * itself — so waiting reinforces the brand instead of reading as generic chrome. */
function BrandDot({ big }: { big?: boolean }) {
  const dot = big ? "h-[9px] w-[9px]" : "h-[6px] w-[6px]";
  const ring = big ? "h-[9px] w-[9px]" : "h-[6px] w-[6px]";
  return (
    <span className={clsx("relative inline-flex items-center justify-center align-middle", big ? "mx-[3px] mb-[9px]" : "mx-[2px] mb-[7px]")}>
      <span className={clsx("absolute rounded-full bg-champagne/60 animate-wd-seal-ring", ring)} />
      <span className={clsx("absolute rounded-full bg-champagne/35 animate-wd-seal-ring [animation-delay:.35s]", ring)} />
      <span className={clsx("relative rounded-full bg-champagne animate-wd-seal-pulse", dot)} />
    </span>
  );
}

function Wordmark({ big }: { big?: boolean }) {
  return (
    <span className={clsx("inline-flex font-extrabold tracking-[-1.4px] text-porcelain", big ? "text-[26px]" : "text-[15px]")}>
      Wish
      <BrandDot big={big} />
      Dem
    </span>
  );
}

export function Loading({ label = "Just a moment", size = "inline", className }: LoadingProps) {
  if (size === "page") {
    return (
      <div className={clsx("grid min-h-screen place-items-center", className)}>
        <div className="flex flex-col items-center gap-3 animate-wd-fade-in">
          <Wordmark big />
          {label && <p className="text-[12px] text-porcelain/55">{label}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("flex flex-col items-center justify-center gap-2.5", className ?? "py-10")}>
      <Wordmark />
      {label && <p className="text-[12px] text-porcelain/55">{label}</p>}
    </div>
  );
}
