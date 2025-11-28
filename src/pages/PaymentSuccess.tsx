import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, MessageCircle, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const PaymentSuccess = () => {
  // Componente de sucesso de pagamento - versão otimizada para mobile
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxPollingAttempts = 30; // 30 tentativas = 5 minutos (10s cada)
  const pollingAttemptsRef = useRef(0);

  // Função para verificar se o pagamento está confirmado
  const checkPaymentStatus = (paymentData: any): boolean => {
    if (!paymentData) return false;
    
    // Pagamento confirmado se status for 'completed'
    if (paymentData.status === 'completed') {
      return true;
    }
    
    // Para PIX, verificar se está pendente mas pode estar aguardando confirmação
    const isPix = paymentData.metadata?.payment_method === 'pix' || 
                  paymentData.metadata?.requested_payment_method === 'pix';
    
    // Se for PIX e estiver pendente, ainda não está confirmado
    if (isPix && paymentData.status === 'pending') {
      return false;
    }
    
    return false;
  };

  // Função para verificar status diretamente no Stripe
  const verifyStripeSession = async (sessionId: string) => {
    try {
      console.log("Verifying session status directly with Stripe:", sessionId);
      const { data, error } = await supabase.functions.invoke("verify-stripe-session", {
        body: { session_id: sessionId },
      });

      if (error) {
        console.error("Error verifying stripe session:", error);
        return null;
      }

      if (data?.success && data?.updated) {
        console.log("✅ Payment status updated via Stripe verification");
        // Recarregar informações do pagamento após atualização
        return true;
      }

      return data?.payment_status === "completed";
    } catch (err) {
      console.error("Error calling verify-stripe-session:", err);
      return null;
    }
  };

  // Função para buscar informações do pagamento
  const fetchPaymentInfo = async () => {
    const leadId = searchParams.get("lead_id");
    const termAcceptanceId = searchParams.get("term_acceptance_id");

    try {
      let payment = null;

      // Se tiver session_id, buscar por session_id (Stripe card/PIX direto)
      if (sessionId) {
        const { data, error } = await supabase
          .from("payments")
          .select("*")
          .eq("stripe_session_id", sessionId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching payment by session_id:", error);
        } else if (data) {
          payment = data;
          setPayment(data);
          
          // Se o pagamento estiver pendente, verificar diretamente no Stripe
          if (data.status === "pending") {
            console.log("Payment is pending, verifying with Stripe...");
            const verified = await verifyStripeSession(sessionId);
            
            if (verified) {
              // Recarregar o pagamento após verificação
              const { data: updatedPayment } = await supabase
                .from("payments")
                .select("*")
                .eq("stripe_session_id", sessionId)
                .maybeSingle();
              
              if (updatedPayment) {
                payment = updatedPayment;
                setPayment(updatedPayment);
              }
            }
          }
        }
      }

      // Se não encontrou por session_id e tem lead_id/term_acceptance_id, buscar qualquer pagamento relacionado
      if (!payment && leadId && termAcceptanceId) {
        const { data, error } = await supabase
          .from("payments")
          .select("*")
          .eq("lead_id", leadId)
          .eq("term_acceptance_id", termAcceptanceId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching payment by lead_id:", error);
        } else if (data) {
          payment = data;
          setPayment(data);
          
          // Se tiver session_id e estiver pendente, verificar no Stripe
          if (data.stripe_session_id && data.status === "pending") {
            console.log("Payment is pending, verifying with Stripe...");
            const verified = await verifyStripeSession(data.stripe_session_id);
            
            if (verified) {
              // Recarregar o pagamento após verificação
              const { data: updatedPayment } = await supabase
                .from("payments")
                .select("*")
                .eq("stripe_session_id", data.stripe_session_id)
                .maybeSingle();
              
              if (updatedPayment) {
                payment = updatedPayment;
                setPayment(updatedPayment);
              }
            }
          }
        }
      }

      // Verificar se o pagamento está confirmado
      if (payment) {
        const confirmed = checkPaymentStatus(payment);
        setIsPaymentConfirmed(confirmed);
        
        // Se não estiver confirmado e for PIX, iniciar polling
        if (!confirmed && (payment.metadata?.payment_method === 'pix' || payment.metadata?.requested_payment_method === 'pix')) {
          if (!isPolling && pollingAttemptsRef.current < maxPollingAttempts) {
            setIsPolling(true);
            startPolling();
          }
        }
      }

      // PDF não é mais necessário - removido conforme solicitação
    } catch (err) {
      console.error("Error fetching payment info:", err);
    } finally {
      setLoading(false);
    }
  };

  // Função para fazer polling e verificar quando o pagamento for confirmado
  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      pollingAttemptsRef.current += 1;

      if (pollingAttemptsRef.current >= maxPollingAttempts) {
        // Parar polling após máximo de tentativas
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsPolling(false);
        return;
      }

      // Buscar novamente o pagamento
      const leadId = searchParams.get("lead_id");
      const termAcceptanceId = searchParams.get("term_acceptance_id");

      try {
        let payment = null;
        let currentSessionId = sessionId;

        if (sessionId) {
          const { data } = await supabase
            .from("payments")
            .select("*")
            .eq("stripe_session_id", sessionId)
            .maybeSingle();
          
          if (data) {
            payment = data;
            currentSessionId = data.stripe_session_id || sessionId;
          }
        }

        if (!payment && leadId && termAcceptanceId) {
          const { data } = await supabase
            .from("payments")
            .select("*")
            .eq("lead_id", leadId)
            .eq("term_acceptance_id", termAcceptanceId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (data) {
            payment = data;
            currentSessionId = data.stripe_session_id || null;
          }
        }

        if (payment) {
          // Se estiver pendente e tiver session_id, verificar no Stripe
          if (payment.status === "pending" && currentSessionId) {
            const verified = await verifyStripeSession(currentSessionId);
            
            if (verified) {
              // Recarregar o pagamento após verificação
              const { data: updatedPayment } = await supabase
                .from("payments")
                .select("*")
                .eq("stripe_session_id", currentSessionId)
                .maybeSingle();
              
              if (updatedPayment) {
                payment = updatedPayment;
              }
            }
          }
          
          setPayment(payment);
          const confirmed = checkPaymentStatus(payment);
          
          if (confirmed) {
            setIsPaymentConfirmed(true);
            setIsPolling(false);
            // Parar polling quando confirmado
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        }
      } catch (err) {
        console.error("Error polling payment status:", err);
      }
    }, 10000); // Verificar a cada 10 segundos
  };

  useEffect(() => {
    fetchPaymentInfo();

    // Cleanup: parar polling quando componente desmontar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [sessionId, searchParams]);

  // Determinar se é PIX
  const isPix = payment?.metadata?.payment_method === 'pix' || 
                payment?.metadata?.requested_payment_method === 'pix';

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-0">
        <div className="min-h-screen bg-white flex items-center justify-center p-6 relative z-10">
          <Card className="bg-white p-8 max-w-2xl w-full shadow-2xl border border-gray-200">
            <div className="text-center space-y-6">
              <Loader2 className="w-12 h-12 text-[#0575E6] mx-auto animate-spin" />
              <p className="text-xl text-gray-700">Verificando pagamento...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-0">
      <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 relative z-10">
        <Card className="bg-white p-4 sm:p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-gray-200">
          <div className="text-center space-y-4 sm:space-y-6">
          {isPaymentConfirmed ? (
            <>
                <div className="flex justify-center">
                  <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-[#0575E6] mx-auto" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 px-2">
                  Pagamento Confirmado!
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 px-2">
                Obrigado pelo seu pagamento. Seu contrato foi processado com sucesso.
              </p>
            </>
          ) : isPix && isPolling ? (
            <>
                <div className="flex justify-center">
                  <Loader2 className="w-16 h-16 sm:w-20 sm:h-20 text-[#0575E6] mx-auto animate-spin" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 px-2">
                  Aguardando Confirmação do Pagamento
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 px-2">
                Estamos verificando o pagamento PIX. Isso pode levar alguns minutos.
              </p>
                <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg mx-2">
                  <p className="text-xs sm:text-sm text-blue-800">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  Aguarde enquanto confirmamos seu pagamento. Você será notificado assim que a confirmação for recebida.
                </p>
              </div>
            </>
          ) : (
            <>
                <div className="flex justify-center">
                  <AlertCircle className="w-16 h-16 sm:w-20 sm:h-20 text-orange-500 mx-auto" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 px-2">
                  Pagamento Pendente
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 px-2">
                Seu pagamento ainda não foi confirmado. Por favor, aguarde a confirmação.
              </p>
            </>
          )}

            {/* Botões de ação - Formulário de Consultoria primeiro (mais importante) */}
            <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 px-2">
            {/* Mostrar botão apenas se o pagamento estiver confirmado */}
            {isPaymentConfirmed && (sessionId || searchParams.get("lead_id")) && searchParams.get("lead_id") && (
              <Button
                onClick={() => {
                  const leadId = searchParams.get("lead_id");
                  const paymentId = payment?.id || searchParams.get("payment_id") || "temp";
                  const finalSessionId = sessionId || searchParams.get("session_id");
                  navigate(`/consultation-form?lead_id=${leadId}&payment_id=${paymentId}${finalSessionId ? `&session_id=${finalSessionId}` : ''}`);
                }}
                  className="w-full bg-gradient-to-r from-[#0575E6] to-[#021B79] hover:from-[#0685F6] hover:to-[#032B89] text-white font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base py-6 sm:py-7"
                size="lg"
              >
                Preencher Formulário de Consultoria
              </Button>
            )}
            <Button
              onClick={() => navigate("/oferta")}
              variant="outline"
                className="w-full border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-600 shadow-none text-sm sm:text-base py-6 sm:py-7"
            >
              Voltar para o Início
            </Button>
          </div>

            {/* Seção de contato WhatsApp - abaixo do formulário */}
            <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 p-4 sm:p-6 bg-green-50 border border-green-200 rounded-lg mx-2">
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                Para mais informações, entre em contato conosco:
              </p>
              <Button
                onClick={() => window.open("https://wa.me/13234041292", "_blank")}
                className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base py-6 sm:py-7"
                size="lg"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Entrar em contato via WhatsApp
              </Button>
            </div>
        </div>
      </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;

