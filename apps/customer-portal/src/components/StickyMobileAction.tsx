import type { ReactNode } from "react";

/**
 * Wraps a wizard step's primary action row. On mobile it pins to the bottom
 * of the viewport — the whole point being nobody should have to scroll past
 * a page of content to find the button that moves them forward. On sm:+ it
 * dissolves back into the normal document flow, since desktop already keeps
 * the action within view without help.
 */
export function StickyMobileAction({ children }: { children: ReactNode }) {
  return (
    // bg-plum/95 is a fixed dark surface regardless of the active app theme, so
    // any reactive text-porcelain/* inside must be pinned light too — otherwise
    // it renders as near-invisible dark-on-dark in light mode. Unset again at
    // sm:+, where the bar dissolves into the page's own (possibly light) canvas.
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-porcelain/15 bg-plum/95 px-4 py-3 backdrop-blur-sm [--wd-ink-on-canvas-rgb:246_240_232] sm:static sm:z-auto sm:mt-7 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none sm:[--wd-ink-on-canvas-rgb:unset]">
      <div
        className="mx-auto flex max-w-[1260px] flex-wrap items-center gap-3 pb-[env(safe-area-inset-bottom)] sm:mx-0 sm:max-w-none sm:flex-nowrap sm:gap-4 sm:pb-0"
      >
        {children}
      </div>
    </div>
  );
}
