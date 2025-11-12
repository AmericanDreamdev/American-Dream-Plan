import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LeadForm from "./pages/LeadForm";
import AnalysisForm from "./pages/AnalysisForm";
import TermsAndConditions from "./pages/TermsAndConditions";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import PaymentOptions from "./pages/PaymentOptions";
import ZelleCheckout from "./pages/ZelleCheckout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ConsultationForm from "./pages/ConsultationForm";
import ConsultationFormDetails from "./pages/ConsultationFormDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import { ScrollToTop } from "./components/ScrollToTop";

const queryClient = new QueryClient();

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
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/oferta" element={<Index />} />
          <Route path="/lead-form" element={<LeadForm />} />
          <Route path="/analysis-form" element={<AnalysisForm />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/payment-options" element={<PaymentOptions />} />
          <Route path="/zelle-checkout" element={<ZelleCheckout />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route path="/consultation-form" element={<ConsultationForm />} />
          <Route path="/consultation-form/:token" element={<ConsultationForm />} />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
