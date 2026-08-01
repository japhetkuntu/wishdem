import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { Stepper } from "./Stepper";
import { useWizardStore } from "@/store/wizardStore";

export function CreateLayout({
  activeIndex,
  children,
  fitViewport = false,
}: {
  activeIndex: number;
  children: ReactNode;
  /** Constrains content to one screen (desktop+ only — mobile's stacked
   * layout genuinely needs to scroll, so this only kicks in at sm:). */
  fitViewport?: boolean;
}) {
  const lastSavedAt = useWizardStore((s) => s.lastSavedAt);

  return (
    <main
      className={clsx(
        "mx-auto w-full max-w-[1260px] px-4 pb-10 pt-6 sm:px-8",
        fitViewport && "sm:flex sm:h-screen sm:flex-col sm:overflow-hidden sm:pb-4",
      )}
    >
      <header className="flex flex-none items-center justify-between gap-4 border-b border-porcelain/[0.14] pb-4">
        <Link to="/" className="text-[19px] font-extrabold tracking-[-1.5px]">
          Wish<i className="mx-[2px] mb-2 inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
          Dem
        </Link>
        <span className="text-[11px] font-extrabold text-champagne">
          {lastSavedAt ? "Draft saved automatically" : "Nothing saved yet"}
        </span>
      </header>
      <div className="flex-none">
        <Stepper activeIndex={activeIndex} />
      </div>
      <div className={clsx("mt-7 sm:mt-9", fitViewport && "sm:min-h-0 sm:flex-1")}>
        {children}
      </div>
    </main>
  );
}
