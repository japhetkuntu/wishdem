import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AccountSecurityPage() {
  const { user } = useAdminAuth();

  return (
    <AdminLayout active="overview">
      <div className="mx-auto max-w-[600px] py-6">
        <span className="text-[9px] font-extrabold tracking-[0.13em] text-mulberry">
          ACCOUNT &amp; SECURITY
        </span>
        <h1 className="my-2 font-display text-[34px]">Your account</h1>
        <p className="mb-5 text-[11px] text-porcelain/60">
          Manage the credentials that protect wishes, payments, and customer data.
        </p>

        <div className="rounded-md border border-plum/[0.11] bg-white p-4 text-ink">
          <div className="border-b border-plum/[0.09] pb-3 text-[11px] leading-[1.6]">
            <b className="block text-[12px]">{user?.name ?? "Team member"}</b>
            {user?.email}
            <br />
            {user?.role}
          </div>
          <Link
            to="/account/security/change-password"
            className="mt-3 flex items-center justify-between rounded-sm border border-plum/[0.1] p-3 text-[11px] hover:bg-paper"
          >
            <span>
              <b className="block">Change your password</b>
              <span className="text-ink/55">Update your password and sign other devices out.</span>
            </span>
            <span className="text-[10px] font-extrabold text-mulberry">Open →</span>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
