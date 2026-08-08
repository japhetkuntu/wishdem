import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { listAttentionCases, listDeliveryStats } from "@/lib/api";

export type SidebarKey =
  | "overview"
  | "attention"
  | "wishes"
  | "users"
  | "payments"
  | "delivery"
  | "activity";

const BASE_LINKS: { key: SidebarKey; label: string; to: string }[] = [
  { key: "overview", label: "Overview", to: "/overview" },
  { key: "attention", label: "Attention", to: "/attention" },
  { key: "wishes", label: "Wishes", to: "/wishes" },
  { key: "users", label: "Users", to: "/users" },
  { key: "payments", label: "Payments & Moderation", to: "/payments" },
  { key: "delivery", label: "Delivery Health", to: "/delivery" },
  { key: "activity", label: "Activity Log", to: "/activity" },
];

export function Sidebar({ active }: { active: SidebarKey }) {
  const { user } = useAdminAuth();
  // Real counts only — no badge is shown until its number is known, rather
  // than displaying a stale/fabricated placeholder.
  const [counts, setCounts] = useState<Partial<Record<SidebarKey, number>>>({});

  useEffect(() => {
    let cancelled = false;

    listAttentionCases()
      .then((cases) => {
        if (cancelled) return;
        // Attention and Payments & Moderation both surface the same
        // underlying open-moderation-case count from /api/moderation.
        setCounts((prev) => ({ ...prev, attention: cases.length, payments: cases.length }));
      })
      .catch(() => {
        // Leave the badge hidden rather than showing a wrong count.
      });

    listDeliveryStats()
      .then((stats) => {
        if (cancelled) return;
        const due = stats.find((s) => s.label === "DUE (SEALED)");
        if (due) setCounts((prev) => ({ ...prev, delivery: Number(due.value) }));
      })
      .catch(() => {
        // Leave the badge hidden rather than showing a wrong count.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const links = BASE_LINKS.map((link) => ({ ...link, count: counts[link.key] }));

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
        {links.map((link) => (
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
