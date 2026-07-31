import { Link } from "react-router-dom";
import { Button } from "@wishdem/design-system";

/**
 * Shared marketing-facing header (Home, How it works). The signed-in app
 * shell (Dashboard, the create wizard) keeps its own nav — different
 * concerns, different links.
 */
export function SiteNav() {
  return (
    <nav className="flex items-center justify-between border-b border-porcelain/[0.14] py-[17px]">
      <Link to="/" className="text-[20px] font-extrabold tracking-[-1.5px]">
        Wish
        <i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
        Dem
      </Link>
      <div className="flex items-center gap-[18px] text-[11px] font-bold text-porcelain/75">
        <Link to="/how-it-works" className="hidden sm:inline">
          How it works
        </Link>
        <Link to="/dashboard" className="hidden sm:inline">
          Your portal
        </Link>
        <Link to="/how-it-works#faq" className="hidden sm:inline">
          Questions
        </Link>
        <Link to="/login">
          <Button variant="outline" size="sm">
            Sign in
          </Button>
        </Link>
        <Link to="/create/who">
          <Button size="sm">Create a wish</Button>
        </Link>
      </div>
    </nav>
  );
}
