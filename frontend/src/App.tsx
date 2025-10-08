import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";

import Navigation from "@/components/Navigation";
import ProfileHeader from "@/components/ProfileHeader";

import SelfAssessmentPage from "./pages/SelfAssessmentPage";
import DailyTestPage from "./pages/DailyTestPage";
import SocialDailyTest from "./components/social/SocialDailyTest";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import MarketsPage from "./pages/MarketsPage";
import RealEstatePage from "./pages/RealEstatePage";
import CreditPage from "./pages/CreditPage";
import RetirementPage from "./pages/RetirementPage";
import LFBusinessPage from "./pages/LFBusinessPage";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "@/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {/* Header (se muestra siempre) */}
            <Navigation />
            <ProfileHeader />

            <Routes>
              {/* Pública */}
              <Route path="/auth" element={<AuthPage />} />

              {/* Bloque protegido */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/business" element={<LFBusinessPage />} />
                <Route path="/markets" element={<MarketsPage />} />
                <Route path="/real-estate" element={<RealEstatePage />} />
                <Route path="/credit" element={<CreditPage />} />
                <Route path="/assessment" element={<SelfAssessmentPage />} />
                <Route path="/daily-test" element={<SocialDailyTest />} />
                <Route path="/retirement" element={<RetirementPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
