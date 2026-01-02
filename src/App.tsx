import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Home from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LeadForm from "./pages/LeadForm";
import AnalysisForm from "./pages/AnalysisForm";
import TermsAndConditions from "./pages/TermsAndConditions";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import PaymentOptions from "./pages/PaymentOptions";
import SecondPayment from "./pages/SecondPayment";
import ZelleCheckout from "./pages/ZelleCheckout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ConsultationForm from "./pages/ConsultationForm";
import ConsultationFormDetails from "./pages/ConsultationFormDetails";
import AuthCallback from "./pages/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedClientRoute from "./components/ProtectedClientRoute";
import { ScrollToTop } from "./components/ScrollToTop";
// Client pages
import ClientLogin from "./pages/client/ClientLogin";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientResetPassword from "./pages/client/ClientResetPassword";

const queryClient = new QueryClient();

// Componente Wrapper para lidar com eventos de Auth que precisam de navegação
const AuthListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se a URL tem o hash de recuperação
    // Isso é necessário porque às vezes o evento dispara antes do componente montar
    if (window.location.hash && window.location.hash.includes("type=recovery")) {
      console.log("Recuperação de senha detectada via URL hash");
      navigate("/client/reset-password");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/client/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
};

// Rotas atualizadas - removidas AcceptTerms e ProcessPayment
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthListener />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/oferta" element={<Index />} />
          <Route path="/lead-form" element={<LeadForm />} />
          <Route path="/analysis-form" element={<AnalysisForm />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route 
            path="/payment-options" 
            element={
              <ProtectedClientRoute>
                <PaymentOptions />
              </ProtectedClientRoute>
            } 
          />
          <Route 
            path="/parcela-2-2" 
            element={
              <ProtectedClientRoute>
                <SecondPayment />
              </ProtectedClientRoute>
            } 
          />
          <Route 
            path="/zelle-checkout" 
            element={
              <ProtectedClientRoute>
                <ZelleCheckout />
              </ProtectedClientRoute>
            } 
          />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route path="/consultation-form" element={<ConsultationForm />} />
          <Route path="/consultation-form/:token" element={<ConsultationForm />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/consultation-form/:id" 
            element={
              <ProtectedRoute>
                <ConsultationFormDetails />
              </ProtectedRoute>
            } 
          />
          {/* Client Routes */}
          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/client/reset-password" element={<ClientResetPassword />} />
          <Route 
            path="/client/dashboard" 
            element={
              <ProtectedClientRoute>
                <ClientDashboard />
              </ProtectedClientRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
