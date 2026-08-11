import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import HomePage from "@/pages/HomePage";

const HowItWorksPage = lazy(() => import("@/pages/HowItWorksPage"));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const VerifyPage = lazy(() => import("@/pages/auth/VerifyPage"));
const CreateWhoPage = lazy(() => import("@/pages/create/CreateWhoPage"));
const CreateMessagePage = lazy(() => import("@/pages/create/CreateMessagePage"));
const CreateThemePage = lazy(() => import("@/pages/create/CreateThemePage"));
const CreateDeliverPage = lazy(() => import("@/pages/create/CreateDeliverPage"));
const CreateScheduledPage = lazy(() => import("@/pages/create/CreateScheduledPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const PeoplePage = lazy(() => import("@/pages/PeoplePage"));
const CirclePage = lazy(() => import("@/pages/CirclePage"));
const AddPersonPage = lazy(() => import("@/pages/AddPersonPage"));
const RecipientWishPage = lazy(() => import("@/pages/RecipientWishPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const GroupWishSetupPage = lazy(() => import("@/pages/group-wishes/GroupWishSetupPage"));
const GroupWishLobbyPage = lazy(() => import("@/pages/group-wishes/GroupWishLobbyPage"));
const GroupWishesHubPage = lazy(() => import("@/pages/group-wishes/GroupWishesHubPage"));
const InvitationPage = lazy(() => import("@/pages/group-wishes/InvitationPage"));
const GuestMemoryEntryPage = lazy(() => import("@/pages/contribute/GuestMemoryEntryPage"));
const GuestMemoryComposePage = lazy(() => import("@/pages/contribute/GuestMemoryComposePage"));
const GuestMemoryPreviewPage = lazy(() => import("@/pages/contribute/GuestMemoryPreviewPage"));
const GuestMemorySealedPage = lazy(() => import("@/pages/contribute/GuestMemorySealedPage"));
const BloomCoverPage = lazy(() => import("@/pages/bloom/BloomCoverPage"));
const BloomGalleryPage = lazy(() => import("@/pages/bloom/BloomGalleryPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/legal/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("@/pages/legal/TermsPage"));

// Account-only pages have no guest use case, unlike /create/* (guests start a wish before
// signing in, via the embedded AuthPrompt) or /w/:id, /contribute/*, /bloom/*,
// /group-wishes/invitations/:id (all reached via a link, not a signed-in session).
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// The inverse guard for /login and /login/verify — someone already signed in has no reason
// to see the sign-in form again (whether they typed the URL, hit back, or the nav link
// briefly rendered before their session loaded).
function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
        <Route path="/login/verify" element={<RedirectIfAuthed><VerifyPage /></RedirectIfAuthed>} />
        <Route path="/create/who" element={<CreateWhoPage />} />
        <Route path="/create/message" element={<CreateMessagePage />} />
        <Route path="/create/theme" element={<CreateThemePage />} />
        <Route path="/create/deliver" element={<CreateDeliverPage />} />
        <Route path="/create/scheduled" element={<CreateScheduledPage />} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/account" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
        <Route path="/people" element={<RequireAuth><PeoplePage /></RequireAuth>} />
        <Route path="/circle" element={<RequireAuth><CirclePage /></RequireAuth>} />
        <Route path="/circle/new" element={<RequireAuth><AddPersonPage /></RequireAuth>} />
        <Route path="/group-wishes" element={<RequireAuth><GroupWishesHubPage /></RequireAuth>} />
        <Route path="/group-wishes/new" element={<RequireAuth><GroupWishSetupPage /></RequireAuth>} />
        <Route path="/group-wishes/:id/invite" element={<RequireAuth><GroupWishLobbyPage /></RequireAuth>} />
        <Route path="/group-wishes/invitations/:id" element={<InvitationPage />} />
        <Route path="/contribute/:id" element={<GuestMemoryEntryPage />} />
        <Route path="/contribute/:id/compose" element={<GuestMemoryComposePage />} />
        <Route path="/contribute/:id/preview" element={<GuestMemoryPreviewPage />} />
        <Route path="/contribute/:id/sealed" element={<GuestMemorySealedPage />} />
        <Route path="/bloom/:id" element={<BloomCoverPage />} />
        <Route path="/bloom/:id/gallery" element={<BloomGalleryPage />} />
        <Route path="/w/:id" element={<RecipientWishPage />} />
      </Routes>
    </Suspense>
  );
}
