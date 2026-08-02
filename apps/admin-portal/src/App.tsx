import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import LoginPage from "@/pages/LoginPage";
import OverviewPage from "@/pages/OverviewPage";
import WishesPage from "@/pages/WishesPage";
import PaymentsModerationPage from "@/pages/PaymentsModerationPage";
import DeliveryHealthPage from "@/pages/DeliveryHealthPage";
import AttentionPage from "@/pages/AttentionPage";
import UsersPage from "@/pages/UsersPage";
import ActivityLogPage from "@/pages/ActivityLogPage";
import AccountSecurityPage from "@/pages/AccountSecurityPage";
import ChangePasswordPage from "@/pages/ChangePasswordPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import PasswordUpdatedPage from "@/pages/PasswordUpdatedPage";
import { useAdminAuth } from "@/hooks/useAdminAuth";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-ink/50">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/reset-password/success" element={<PasswordUpdatedPage />} />
      <Route
        path="/account/security"
        element={
          <RequireAuth>
            <AccountSecurityPage />
          </RequireAuth>
        }
      />
      <Route
        path="/account/security/change-password"
        element={
          <RequireAuth>
            <ChangePasswordPage />
          </RequireAuth>
        }
      />
      <Route
        path="/overview"
        element={
          <RequireAuth>
            <OverviewPage />
          </RequireAuth>
        }
      />
      <Route
        path="/wishes"
        element={
          <RequireAuth>
            <WishesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/payments"
        element={
          <RequireAuth>
            <PaymentsModerationPage />
          </RequireAuth>
        }
      />
      <Route
        path="/delivery"
        element={
          <RequireAuth>
            <DeliveryHealthPage />
          </RequireAuth>
        }
      />
      <Route
        path="/attention"
        element={
          <RequireAuth>
            <AttentionPage />
          </RequireAuth>
        }
      />
      <Route
        path="/users"
        element={
          <RequireAuth>
            <UsersPage />
          </RequireAuth>
        }
      />
      <Route
        path="/activity"
        element={
          <RequireAuth>
            <ActivityLogPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
