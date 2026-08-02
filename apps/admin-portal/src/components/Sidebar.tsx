import { Link } from "react-router-dom";
import clsx from "clsx";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export type SidebarKey =
  | "overview"
  | "attention"
  | "wishes"
  | "users"
  | "payments"
  | "delivery"
  | "activity";

const LINKS: { key: SidebarKey; label: string; to: string; count?: number }[] = [
  { key: "overview", label: "Overview", to: "/overview" },
  { key: "attention", label: "Attention", to: "/attention", count: 18 },
  { key: "wishes", label: "Wishes", to: "/wishes" },
  { key: "users", label: "Users", to: "/users" },
  { key: "payments", label: "Payments & Moderation", to: "/payments", count: 4 },
  { key: "delivery", label: "Delivery Health", to: "/delivery", count: 12 },
  { key: "activity", label: "Activity Log", to: "/activity" },
];

export function Sidebar({ active }: { active: SidebarKey }) {
  const { user } = useAdminAuth();

  return (
    <aside className="border-b border-porcelain/[0.1] bg-plum px-3 py-5 text-porcelain lg:min-h-screen lg:border-b-0 lg:border-r lg:py-5">
      <Link to="/overview" className="mb-6 block px-2 text-[20px] font-extrabold tracking-[-1.5px] lg:mb-6">
        Wish<i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
        Dem
        <small className="ml-2 align-middle text-[9px] font-extrabold tracking-[0.1em] text-champagne">
          ADMIN
        </small>
      </Link>

      <div className="mb-3 hidden px-2 text-[9px] font-extrabold tracking-[0.12em] text-champagne lg:block">
        OPERATIONS WORKSPACE
      </div>

      <nav className="flex gap-[4px] overflow-x-auto lg:grid lg:overflow-visible">
        {LINKS.map((link) => (
          <Link
            key={link.key}
            to={link.to}
            className={clsx(
              "flex min-h-[38px] flex-none items-center whitespace-nowrap rounded-sm px-[10px] text-[12px] font-bold lg:flex-auto lg:whitespace-normal",
              active === link.key ? "bg-mulberry text-porcelain" : "text-porcelain/72 hover:text-porcelain",
            )}
          >
            {link.label}
            {typeof link.count === "number" && (
              <span className="ml-auto rounded-pill bg-champagne px-[6px] py-[2px] text-[9px] font-extrabold text-plum">
                {link.count}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {user && (
        <Link
          to="/account/security"
          className="mt-6 hidden border-t border-porcelain/[0.15] px-2 pt-4 text-[11px] leading-[1.5] hover:text-champagne lg:block"
        >
          <b className="text-champagne">{user.name}</b>
          <br />
          {user.role}
          <br />
          GMT / Accra
        </Link>
      )}
    </aside>
  );
}
