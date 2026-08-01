import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Button } from "@wishdem/design-system";
import { useAuth } from "@/hooks/useAuth";

export type AppNavKey = "home" | "wishes" | "calendar" | "people" | "circle";

const NAV_LINKS: { key: AppNavKey; label: string; to: string }[] = [
  { key: "home", label: "Home", to: "/dashboard" },
  { key: "wishes", label: "Wishes", to: "/dashboard" },
  { key: "calendar", label: "Calendar", to: "/calendar" },
  { key: "people", label: "People", to: "/people" },
  { key: "circle", label: "Circle", to: "/circle" },
];

function gmtLabel() {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  return `GMT${sign}${Math.abs(offsetMinutes) / 60}`;
}

/**
 * Shared header for the signed-in app shell (Dashboard, Calendar, People).
 * The workspace badge doubles as an account menu — logging out lives one
 * click deep in there rather than as a standalone nav button, so it isn't
 * something people brush past by accident.
 */
export function AppNav({ active }: { active: AppNavKey }) {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <nav className="flex min-h-[59px] items-center gap-4 border-b border-porcelain/[0.15] sm:min-h-[68px] sm:gap-5">
      <Link to="/dashboard" className="mr-1 text-[20px] font-extrabold tracking-[-1.4px] sm:mr-2 sm:text-[21px]">
        Wish
        <i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
        Dem
      </Link>

      {NAV_LINKS.map((link) => {
        const isActive = link.key === active;
        return (
          <Link
            key={link.key}
            to={link.to}
            className={clsx(
              "hidden h-[68px] items-center text-[11px] font-bold sm:flex",
              isActive ? "border-b-2 border-champagne text-porcelain" : "text-porcelain/65",
            )}
          >
            {link.label}
          </Link>
        );
      })}

      <div className="flex-1" />

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-pill border border-champagne/35 px-[10px] py-[7px] text-[10px] font-extrabold text-champagne"
        >
          <span className="hidden sm:inline">MY WISHDEM · {gmtLabel()}</span>
          <span className="sm:hidden">Menu</span>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-20 mt-2 w-60 rounded-md border border-porcelain/15 bg-plum p-2 shadow-deep">
            <div className="mb-1 border-b border-porcelain/10 pb-1 sm:hidden">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.key}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={clsx(
                    "block rounded-sm px-3 py-2 text-[12px] font-bold hover:bg-porcelain/10",
                    link.key === active ? "text-champagne" : "text-porcelain",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="px-3 py-2 text-[11px] leading-[1.4] text-porcelain/60">
              Signed in as
              <br />
              <span className="text-porcelain">{user?.email ?? "you@example.com"}</span>
            </div>
            <Link
              to="/dashboard"
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

      <Link to="/create/who">
        <Button size="sm">+ Create</Button>
      </Link>
    </nav>
  );
}
