import { useState } from "react";
import clsx from "clsx";

type Phase = "idle" | "cracking" | "lifting" | "done";

// A jagged fault line through the wax disc — not a clean diagonal cut, so the
// two halves read as an actual broken seal rather than a sliced circle.
const CRACK_LEFT =
  "polygon(0% 0%, 50% 0%, 45% 17%, 55% 34%, 39% 50%, 55% 66%, 45% 83%, 50% 100%, 0% 100%)";
const CRACK_RIGHT =
  "polygon(100% 0%, 50% 0%, 45% 17%, 55% 34%, 39% 50%, 55% 66%, 45% 83%, 50% 100%, 100% 100%)";

/**
 * The tap-to-open interaction — the emotional centerpiece of the reveal
 * flow. Clicking "Break the seal" cracks the wax disc along a jagged fault
 * line, the two shards fly apart, and gold light sweeps across the vessel
 * as it lifts away before handing control back via onOpen.
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
    setPhase("cracking");
    window.setTimeout(() => setPhase("lifting"), 320);
    window.setTimeout(() => {
      setPhase("done");
      onOpen();
    }, 320 + 640);
  }

  const cracked = phase !== "idle";
  const lifted = phase === "lifting" || phase === "done";

  return (
    <div className="flex flex-col items-center">
      <div
        className={clsx(
          "relative mx-auto grid h-[min(58vw,310px)] w-[min(92vw,580px)] place-items-center overflow-hidden rounded-lg border border-porcelain bg-plum shadow-deep transition-all duration-700 ease-out",
          lifted && "scale-[1.04]",
          phase === "done" && "pointer-events-none scale-95 opacity-0",
        )}
      >
        {imageSrc && (
          <>
            <img
              src={imageSrc}
              alt={imageAlt ?? ""}
              className={clsx(
                "absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out",
                lifted && "scale-[1.08]",
              )}
            />
            <div className={clsx("absolute inset-0 bg-plum/25 transition-opacity duration-700", lifted && "opacity-40")} />
          </>
        )}

        {/* Light spilling out as the vessel lifts — a single sweep, not a loop, so it reads as one real burst of light. */}
        {lifted && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1/3 -skew-x-[20deg] bg-gradient-to-r from-transparent via-champagne/35 to-transparent animate-wd-shine-sweep" />
          </div>
        )}

        <div className="relative z-10 h-[116px] w-[116px]">
          {/* Intact seal — fades out the instant the crack starts. */}
          <div
            className={clsx(
              "absolute inset-0 grid place-items-center rounded-full bg-champagne text-center font-display text-[10px] font-extrabold uppercase tracking-[0.14em] text-plum shadow-[0_0_0_15px_var(--tw-shadow-color)] shadow-plum transition-opacity duration-150",
              cracked && "opacity-0",
            )}
          >
            {recipientName.slice(0, 12).toUpperCase()}
          </div>

          {/* The two shards — only present once cracking starts. */}
          {cracked && (
            <>
              <div
                className="absolute inset-0 animate-wd-crack-left rounded-full bg-champagne"
                style={{ clipPath: CRACK_LEFT }}
              />
              <div
                className="absolute inset-0 animate-wd-crack-right rounded-full bg-champagne"
                style={{ clipPath: CRACK_RIGHT }}
              />
            </>
          )}
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
