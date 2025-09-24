import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import SelfAssessmentPage from "./pages/SelfAssessmentPage";
import DailyTestPage from "./pages/DailyTestPage";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import MarketsPage from "./pages/MarketsPage";
import RealEstatePage from "./pages/RealEstatePage";
import CreditPage from "./pages/CreditPage";
import RetirementPage from "./pages/RetirementPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navigation />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/markets" element={<MarketsPage />} />
              <Route path="/real-estate" element={<RealEstatePage />} />
              <Route path="/credit" element={<CreditPage />} />
              <Route path="/assessment" element={<SelfAssessmentPage />} />
              <Route path="/daily-test" element={<DailyTestPage />} />
              <Route path="/retirement" element={<RetirementPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
