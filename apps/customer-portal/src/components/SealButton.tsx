import { useState } from "react";
import clsx from "clsx";

type Phase = "idle" | "breaking" | "done";

/**
 * The tap-to-open interaction — the emotional centerpiece of the reveal
 * flow. Clicking "Break the seal" scales/cracks the wax seal and fades the
 * envelope away before handing control back via onOpen.
 */
export function SealButton({
  recipientName,
  onOpen,
  imageSrc,
  imageAlt,
}: {
  recipientName: string;
  onOpen: () => void;
  imageSrc?: string;
  imageAlt?: string;
}) {
  const [phase, setPhase] = useState<Phase>("idle");

  function handleClick() {
    if (phase !== "idle") return;
    setPhase("breaking");
    window.setTimeout(() => {
      setPhase("done");
      onOpen();
    }, 850);
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className={clsx(
          "relative mx-auto grid h-[min(58vw,310px)] w-[min(92vw,580px)] place-items-center overflow-hidden rounded-lg border border-porcelain bg-plum shadow-deep transition-all duration-700 ease-out",
          phase === "breaking" && "scale-[1.03]",
          phase === "done" && "pointer-events-none scale-95 opacity-0",
        )}
      >
        {imageSrc && (
          <>
            <img
              src={imageSrc}
              alt={imageAlt ?? ""}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-plum/25" />
          </>
        )}
        <div
          className={clsx(
            "relative z-10 grid h-[116px] w-[116px] place-items-center rounded-full bg-champagne text-center font-display text-[10px] font-extrabold uppercase tracking-[0.14em] text-plum shadow-[0_0_0_15px_var(--tw-shadow-color)] shadow-plum transition-all duration-700 ease-out",
            phase !== "idle" && "scale-[1.4] rotate-[20deg] opacity-0",
          )}
        >
          {recipientName.slice(0, 12).toUpperCase()}
        </div>
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={phase !== "idle"}
        className="relative -mt-7 rounded-pill border border-champagne bg-plum px-6 py-4 text-[13px] font-extrabold text-[#F6F0E8] transition-opacity disabled:opacity-60"
      >
        {phase === "idle" ? "Break the seal" : "Opening…"}
      </button>
    </div>
  );
}
