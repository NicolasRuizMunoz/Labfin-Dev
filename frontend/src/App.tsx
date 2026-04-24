import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";

import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/auth/ProtectedRoute";

import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import FilesManagerPage from "./pages/FilesManagerPage";
import TendersPage from "./pages/TendersPage";
import LicitacionDetailPage from "./pages/LicitacionDetailPage";
import NotFound from "./pages/NotFound";
import AdminPage from "./pages/AdminPage";
import EscenariosPage from "./pages/EscenariosPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/files" element={<FilesManagerPage />} />
                <Route path="/tenders" element={<TendersPage />} />
                <Route path="/tenders/:id" element={<LicitacionDetailPage />} />
                <Route path="/escenarios" element={<EscenariosPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;