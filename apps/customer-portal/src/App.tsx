import { Route, Routes } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import LoginPage from "@/pages/auth/LoginPage";
import VerifyPage from "@/pages/auth/VerifyPage";
import CreateWhoPage from "@/pages/create/CreateWhoPage";
import CreateMessagePage from "@/pages/create/CreateMessagePage";
import CreateThemePage from "@/pages/create/CreateThemePage";
import CreateDeliverPage from "@/pages/create/CreateDeliverPage";
import CreateSealPage from "@/pages/create/CreateSealPage";
import CreateScheduledPage from "@/pages/create/CreateScheduledPage";
import CreatePaymentFailedPage from "@/pages/create/CreatePaymentFailedPage";
import DashboardPage from "@/pages/DashboardPage";
import CalendarPage from "@/pages/CalendarPage";
import PeoplePage from "@/pages/PeoplePage";
import CirclePage from "@/pages/CirclePage";
import AddPersonPage from "@/pages/AddPersonPage";
import RecipientWishPage from "@/pages/RecipientWishPage";
import ProfilePage from "@/pages/ProfilePage";
import GroupWishSetupPage from "@/pages/group-wishes/GroupWishSetupPage";
import GroupWishLobbyPage from "@/pages/group-wishes/GroupWishLobbyPage";
import GroupWishesHubPage from "@/pages/group-wishes/GroupWishesHubPage";
import InvitationPage from "@/pages/group-wishes/InvitationPage";
import GuestMemoryEntryPage from "@/pages/contribute/GuestMemoryEntryPage";
import GuestMemoryComposePage from "@/pages/contribute/GuestMemoryComposePage";
import GuestMemoryPreviewPage from "@/pages/contribute/GuestMemoryPreviewPage";
import GuestMemorySealedPage from "@/pages/contribute/GuestMemorySealedPage";
import BloomCoverPage from "@/pages/bloom/BloomCoverPage";
import BloomGalleryPage from "@/pages/bloom/BloomGalleryPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/verify" element={<VerifyPage />} />
      <Route path="/create/who" element={<CreateWhoPage />} />
      <Route path="/create/message" element={<CreateMessagePage />} />
      <Route path="/create/theme" element={<CreateThemePage />} />
      <Route path="/create/deliver" element={<CreateDeliverPage />} />
      <Route path="/create/seal" element={<CreateSealPage />} />
      <Route path="/create/scheduled" element={<CreateScheduledPage />} />
      <Route path="/create/payment-failed" element={<CreatePaymentFailedPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/account" element={<ProfilePage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/people" element={<PeoplePage />} />
      <Route path="/circle" element={<CirclePage />} />
      <Route path="/circle/new" element={<AddPersonPage />} />
      <Route path="/group-wishes" element={<GroupWishesHubPage />} />
      <Route path="/group-wishes/new" element={<GroupWishSetupPage />} />
      <Route path="/group-wishes/:id/invite" element={<GroupWishLobbyPage />} />
      <Route path="/group-wishes/invitations/:id" element={<InvitationPage />} />
      <Route path="/contribute/:id" element={<GuestMemoryEntryPage />} />
      <Route path="/contribute/:id/compose" element={<GuestMemoryComposePage />} />
      <Route path="/contribute/:id/preview" element={<GuestMemoryPreviewPage />} />
      <Route path="/contribute/:id/sealed" element={<GuestMemorySealedPage />} />
      <Route path="/bloom/:id" element={<BloomCoverPage />} />
      <Route path="/bloom/:id/gallery" element={<BloomGalleryPage />} />
      <Route path="/w/:id" element={<RecipientWishPage />} />
    </Routes>
  );
}
