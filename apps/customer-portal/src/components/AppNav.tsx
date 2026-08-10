import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { ThemeToggle, useTheme } from "@wishdem/design-system";
import { useAuth } from "@/hooks/useAuth";
import { useWishes } from "@/hooks/useWishes";
import { daysUntil } from "@/lib/date";

export type AppNavKey = "wishes" | "calendar" | "people" | "circle" | "groupWishes";

// People, Circle, and Group Wishes are built but hidden from MVP nav —
// keep their keys/routes intact, just not linked here for now.
const NAV_LINKS: { key: AppNavKey; label: string; to: string; icon: (props: { className?: string }) => JSX.Element }[] = [
  { key: "wishes", label: "Wishes", to: "/dashboard", icon: GiftIcon },
  { key: "calendar", label: "Calendar", to: "/calendar", icon: CalendarIcon },
];

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="9" width="18" height="12" rx="1.5" />
      <path d="M3 13h18" />
      <path d="M12 9v12" />
      <path d="M12 9C9.5 9 8 7.5 8 5.8 8 4.5 9 3.5 10.2 3.5c1.5 0 1.8 2 1.8 5.5" />
      <path d="M12 9c2.5 0 4-1.5 4-3.2 0-1.3-1-2.3-2.2-2.3-1.5 0-1.8 2-1.8 5.5" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M8 3v4M16 3v4" />
      <circle cx="8.2" cy="14.3" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14.3" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.8" cy="14.3" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.8 20c1-3.6 4-5.5 7.2-5.5s6.2 1.9 7.2 5.5" />
    </svg>
  );
}

/** The always-visible hook back into the app: whichever sealed wish arrives
 * soonest, front and center in the nav — glance at it from any page instead
 * of only on the dashboard. */
function useNextMoment() {
  const { wishes, loading } = useWishes();
  if (loading || !wishes) return null;

  const upcoming = wishes
    .filter((w) => w.status === "sealed")
    .map((w) => ({ wish: w, days: daysUntil(w.recipient.birthdayISO) }))
    .sort((a, b) => a.days - b.days);

  return upcoming[0] ?? null;
}

/**
 * Shared header for the signed-in app shell (Dashboard, Calendar, People).
 * Desktop keeps a single top bar; mobile trades the old hidden-hamburger
 * pattern for a persistent bottom tab bar — always one thumb-reach away,
 * the way a native app would do it.
 */
export function AppNav({ active }: { active: AppNavKey }) {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme("dark");
  const next = useNextMoment();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogOut() {
    setMenuOpen(false);
    await logOut();
    navigate("/");
  }

  const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <>
      <nav className="flex min-h-[59px] items-center gap-2 border-b border-porcelain/[0.15] sm:min-h-[68px] sm:gap-3">
        <Link to="/dashboard" className="mr-1 text-[20px] font-extrabold tracking-[-1.4px] sm:mr-2 sm:text-[21px]">
          Wish
          <i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
          Dem
        </Link>

        {NAV_LINKS.map((link) => {
          const isActive = link.key === active;
          const Icon = link.icon;
          return (
            <Link
              key={link.key}
              to={link.to}
              className={clsx(
                "hidden items-center gap-[7px] rounded-pill px-[13px] py-[9px] text-[11px] font-bold transition-colors sm:flex",
                isActive ? "bg-champagne/[0.16] text-champagne" : "text-porcelain/60 hover:text-porcelain",
              )}
            >
              <Icon className="h-[15px] w-[15px]" />
              {link.label}
            </Link>
          );
        })}

        <div className="flex-1" />

        {next && (
          <Link
            to="/dashboard"
            className="hidden items-center gap-2 rounded-pill border border-champagne/30 bg-champagne/[0.08] py-[7px] pl-[6px] pr-3 text-[10px] font-bold text-champagne transition-colors hover:bg-champagne/[0.14] sm:flex"
          >
            <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-champagne/20 text-[10px]">
              <GiftIcon className="h-[13px] w-[13px]" />
            </span>
            <span className="whitespace-nowrap">
              {next.wish.recipient.name.split(" ")[0]}'s wish ·{" "}
              {next.days <= 0 ? "today" : `${next.days}d`}
            </span>
          </Link>
        )}

        <div ref={menuRef} className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Account menu"
            className="grid h-9 w-9 place-items-center rounded-full bg-champagne text-[13px] font-extrabold text-plum transition-transform hover:scale-105"
          >
            {initial}
          </button>
          {menuOpen && (
            // Always a dark plum dropdown regardless of app theme — pin the reactive
            // porcelain color fixed for every descendant text/border-porcelain below.
            <div className="absolute right-0 top-full z-20 mt-2 w-60 rounded-md border border-porcelain/15 bg-plum p-2 shadow-deep [--wd-ink-on-canvas-rgb:246_240_232]">
              <div className="px-3 py-2 text-[11px] leading-[1.4] text-porcelain/60">
                Signed in as
                <br />
                <span className="text-porcelain">{user?.email ?? "you@example.com"}</span>
              </div>
              <Link
                to="/account"
                onClick={() => setMenuOpen(false)}
                className="block rounded-sm px-3 py-2 text-[12px] font-bold text-porcelain hover:bg-porcelain/10"
              >
                Account settings
              </Link>
              <button
                type="button"
                onClick={handleLogOut}
                className="block w-full rounded-sm px-3 py-2 text-left text-[12px] font-bold text-rose hover:bg-porcelain/10"
              >
                Log out
              </button>
            </div>
          )}
        </div>

        <ThemeToggle
          theme={theme}
          onToggle={toggle}
          className="grid h-9 w-9 flex-none place-items-center rounded-full border border-porcelain/25 text-porcelain hover:border-champagne hover:text-champagne"
        />

        <Link
          to="/create/who"
          className="hidden items-center gap-[6px] rounded-pill bg-champagne px-[17px] py-[11px] text-[11px] font-extrabold text-plum shadow-[0_8px_18px_rgba(230,200,122,.15)] transition-all hover:brightness-105 sm:inline-flex"
        >
          <PlusIcon className="h-[13px] w-[13px]" />
          Create
        </Link>
      </nav>

      {/* Mobile-only bottom tab bar — fixed to the viewport regardless of this
          page's own padding, so it stays reachable while scrolling. Pages using
          AppNav reserve bottom space for it via pb-[104px] on their <main>. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-end justify-around border-t border-porcelain/15 bg-plum px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 text-porcelain [--wd-ink-on-canvas-rgb:246_240_232] sm:hidden">
        {NAV_LINKS.slice(0, 2).map((link) => {
          const isActive = link.key === active;
          const Icon = link.icon;
          return (
            <Link
              key={link.key}
              to={link.to}
              className={clsx(
                "flex flex-1 flex-col items-center gap-1 rounded-md py-1 text-[9px] font-bold",
                isActive ? "text-champagne" : "text-porcelain/55",
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}

        <Link
          to="/create/who"
          aria-label="Create a wish"
          className="relative -top-4 mx-1 grid h-[52px] w-[52px] flex-none place-items-center rounded-full bg-champagne text-plum shadow-deep transition-transform active:scale-95"
        >
          <PlusIcon className="h-[20px] w-[20px]" />
        </Link>

        <Link
          to="/account"
          className="flex flex-1 flex-col items-center gap-1 rounded-md py-1 text-[9px] font-bold text-porcelain/55"
        >
          <UserIcon className="h-5 w-5" />
          Account
        </Link>
      </div>
    </>
  );
}
