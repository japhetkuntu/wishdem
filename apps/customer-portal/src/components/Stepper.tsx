import clsx from "clsx";

export interface StepDef {
  label: string;
}

export const CREATE_STEPS: StepDef[] = [
  { label: "Your message" },
  { label: "Who it's for" },
  { label: "Choose a look" },
  { label: "Seal & schedule" },
];

export function Stepper({ activeIndex }: { activeIndex: number }) {
  return (
    <nav
      aria-label="Wish creation steps"
      className="mt-4 grid grid-cols-2 gap-[7px] sm:grid-cols-4 sm:gap-2"
    >
      {CREATE_STEPS.map((step, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        return (
          <div
            key={step.label}
            className={clsx(
              "flex min-w-0 items-center gap-2 rounded-md border px-[11px] py-[10px] text-[11px] font-bold",
              isActive
                ? "border-champagne bg-mulberry text-[#F6F0E8]"
                : "border-porcelain/15 text-porcelain/60",
            )}
          >
            <b
              className={clsx(
                "grid h-[21px] w-[21px] flex-none place-items-center rounded-full text-[10px]",
                isActive
                  ? "bg-champagne text-plum"
                  : "bg-porcelain/10 text-porcelain/70",
              )}
            >
              {isDone ? "✓" : index + 1}
            </b>
            <span className="truncate">{step.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
