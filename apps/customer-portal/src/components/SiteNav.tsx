import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, ThemeToggle, useTheme } from "@wishdem/design-system";
import { useAuth } from "@/hooks/useAuth";

const BASE_LINKS = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/how-it-works#faq", label: "Questions" },
];

/**
 * Shared marketing-facing header (Home, How it works). The signed-in app
 * shell (Dashboard, the create wizard) keeps its own nav — different
 * concerns, different links.
 */
export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme("dark");
  const { user } = useAuth();

  // "Your portal" only makes sense once signed in; "Sign in" only makes sense
  // before that — showing both regardless of auth state is how someone already
  // signed in ends up back on the sign-in form for no reason.
  const links = user ? [...BASE_LINKS, { to: "/dashboard", label: "Your portal" }] : BASE_LINKS;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="flex items-center justify-between border-b border-porcelain/[0.14] py-[17px]">
      <Link to="/" className="text-[20px] font-extrabold tracking-[-1.5px]">
        Wish
        <i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
        Dem
      </Link>
      <div className="flex items-center gap-[18px] text-[11px] font-bold text-porcelain/75">
        {links.map((link) => (
          <Link key={link.label} to={link.to} className="hidden sm:inline">
            {link.label}
          </Link>
        ))}
        <ThemeToggle
          theme={theme}
          onToggle={toggle}
          className="grid h-9 w-9 place-items-center rounded-full border border-porcelain/25 text-porcelain hover:border-champagne hover:text-champagne"
        />
        {!user && (
          <Link to="/login">
            <Button variant="outline" size="sm">
              Sign in
            </Button>
          </Link>
        )}
        <Link to="/create/message" className="hidden sm:inline-block">
          <Button size="sm">Create a wish</Button>
        </Link>

        <div ref={menuRef} className="relative sm:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
            className="grid h-9 w-9 place-items-center rounded-full border border-porcelain/25"
          >
            <div className="flex flex-col gap-[3px]">
              <span className="block h-[2px] w-[15px] bg-porcelain" />
              <span className="block h-[2px] w-[15px] bg-porcelain" />
              <span className="block h-[2px] w-[15px] bg-porcelain" />
            </div>
          </button>
          {menuOpen && (
            // Always a dark plum dropdown regardless of app theme — pin the reactive
            // porcelain color fixed for every descendant text/border-porcelain below.
            <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-md border border-porcelain/15 bg-plum p-2 shadow-deep [--wd-ink-on-canvas-rgb:246_240_232]">
              {links.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-sm px-3 py-2 text-[13px] font-bold text-porcelain hover:bg-porcelain/10"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/create/message"
                onClick={() => setMenuOpen(false)}
                className="mt-1 block rounded-sm border-t border-porcelain/10 px-3 pb-1 pt-2 text-[13px] font-bold text-champagne hover:bg-porcelain/10"
              >
                Create a wish
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
