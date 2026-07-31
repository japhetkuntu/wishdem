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
import RecipientWishPage from "@/pages/RecipientWishPage";

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
      <Route path="/w/:id" element={<RecipientWishPage />} />
    </Routes>
  );
}
