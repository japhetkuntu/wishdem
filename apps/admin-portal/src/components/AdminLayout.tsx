import type { ReactNode } from "react";
import { Sidebar, type SidebarKey } from "./Sidebar";

export function AdminLayout({ active, children }: { active: SidebarKey; children: ReactNode }) {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[224px_minmax(0,1fr)]">
      <div className="min-w-0">
        <Sidebar active={active} />
      </div>
      <main className="mx-auto w-full min-w-0 max-w-[1500px] px-4 py-6 sm:px-7">{children}</main>
    </div>
  );
}
