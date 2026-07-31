import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Stepper } from "./Stepper";
import { useWizardStore } from "@/store/wizardStore";

export function CreateLayout({
  activeIndex,
  children,
}: {
  activeIndex: number;
  children: ReactNode;
}) {
  const lastSavedAt = useWizardStore((s) => s.lastSavedAt);

  return (
    <main className="mx-auto w-full max-w-[1260px] px-4 pb-10 pt-6 sm:px-8">
      <header className="flex items-center justify-between gap-4 border-b border-porcelain/[0.14] pb-4">
        <Link to="/" className="text-[19px] font-extrabold tracking-[-1.5px]">
          Wish<i className="mx-[2px] mb-2 inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
          Dem
        </Link>
        <span className="text-[11px] font-extrabold text-champagne">
          {lastSavedAt ? "Draft saved automatically" : "Nothing saved yet"}
        </span>
      </header>
      <Stepper activeIndex={activeIndex} />
      <div className="mt-7 sm:mt-9">{children}</div>
    </main>
  );
}
