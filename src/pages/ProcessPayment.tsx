import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Loader2, CreditCard, CheckCircle2 } from "lucide-react";

const ProcessPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { leadId, termAcceptanceId } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentCreated, setPaymentCreated] = useState(false);

  useEffect(() => {
    if (!leadId || !termAcceptanceId) {
      navigate("/lead-form", { replace: true });
      return;
    }

    // Verificar se o PDF já foi gerado, se não, gerar em background
    const checkAndGeneratePDF = async () => {
      try {
        const { data: termAcceptance, error: termError } = await supabase
          .from("term_acceptance")
          .select("pdf_url")
          .eq("id", termAcceptanceId)
          .maybeSingle();
        
        if (termError) {
          console.error("Error fetching term acceptance:", termError);
          // Continuar mesmo se falhar - tentar gerar PDF de qualquer forma
        }

        // Se não tem PDF ainda, gerar em background
        if (!termAcceptance?.pdf_url) {
          supabase.functions.invoke("generate-contract-pdf", {
            body: {
              lead_id: leadId,
              term_acceptance_id: termAcceptanceId,
            },
          }).catch((pdfErr) => {
            console.error("Error generating PDF:", pdfErr);
            // Não bloqueia o fluxo se falhar
          });
        }
      } catch (err) {
        console.error("Error checking PDF:", err);
      }
    };

    checkAndGeneratePDF();
  }, [leadId, termAcceptanceId, navigate]);

  const handleCreateCheckout = async () => {
    if (!leadId || !termAcceptanceId) return;

    setLoading(true);
    setError(null);

    try {
      // Verificar se já existe um payment pendente ou completo
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("stripe_session_id, status")
        .eq("lead_id", leadId)
        .eq("term_acceptance_id", termAcceptanceId)
        .in("status", ["pending", "completed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Se já existe payment completo, redirecionar para sucesso
      if (existingPayment?.status === "completed") {
        navigate("/payment/success", { 
          state: { session_id: existingPayment.stripe_session_id } 
        });
        return;
      }

      // Se já existe payment pendente, tentar reutilizar (opcional - ou criar novo)
      // Por enquanto vamos sempre criar novo

      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            lead_id: leadId,
            term_acceptance_id: termAcceptanceId,
          },
        }
      );

      if (checkoutError || !checkoutData?.checkout_url) {
        console.error("Error creating checkout session:", checkoutError);
        setError("Erro ao processar pagamento. Tente novamente.");
        setLoading(false);
        return;
      }

      setPaymentCreated(true);
      
      // Redirecionar para o checkout do Stripe
      if (checkoutData.checkout_url) {
        window.location.href = checkoutData.checkout_url;
      }
    } catch (checkoutErr) {
      console.error("Error calling checkout function:", checkoutErr);
      setError("Erro ao processar pagamento. Tente novamente.");
      setLoading(false);
    }
  };

  if (!leadId || !termAcceptanceId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <Card className="glass p-8 max-w-2xl w-full">
        <div className="text-center space-y-6">
          <CheckCircle2 className="w-20 h-20 text-primary mx-auto" />
          <h1 className="text-4xl font-bold">Termos Aceitos!</h1>
          <p className="text-xl text-muted-foreground">
            Seus termos foram aceitos com sucesso. Agora é hora de finalizar o pagamento para continuar com o processo.
          </p>

          <div className="mt-8 space-y-4">
            <div className="bg-background/50 p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold mb-4">Próximos Passos</h3>
              <ul className="text-left space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Termos e condições aceitos</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">→</span>
                  <span>Clique no botão abaixo para acessar o checkout seguro</span>
                </li>
              </ul>
            </div>

            {error && (
              <div className="p-4 bg-destructive/20 border border-destructive rounded-md text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              onClick={handleCreateCheckout}
              disabled={loading || paymentCreated}
              className="bg-primary hover:bg-primary/90 w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : paymentCreated ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Redirecionando para pagamento...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Ir para Pagamento
                </>
              )}
            </Button>

            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
              disabled={loading || paymentCreated}
            >
              Voltar para o Início
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProcessPayment;

