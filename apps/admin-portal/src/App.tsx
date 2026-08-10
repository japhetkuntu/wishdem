import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import LoginPage from "@/pages/LoginPage";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const OverviewPage = lazy(() => import("@/pages/OverviewPage"));
const WishesPage = lazy(() => import("@/pages/WishesPage"));
const PaymentsModerationPage = lazy(() => import("@/pages/PaymentsModerationPage"));
const DeliveryHealthPage = lazy(() => import("@/pages/DeliveryHealthPage"));
const AttentionPage = lazy(() => import("@/pages/AttentionPage"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const ActivityLogPage = lazy(() => import("@/pages/ActivityLogPage"));
const AccountSecurityPage = lazy(() => import("@/pages/AccountSecurityPage"));
const ChangePasswordPage = lazy(() => import("@/pages/ChangePasswordPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const PasswordUpdatedPage = lazy(() => import("@/pages/PasswordUpdatedPage"));

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
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-ink/50">Loading…</div>}>
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
    </Suspense>
  );
}
