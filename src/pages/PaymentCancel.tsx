import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const urlLeadId = searchParams.get("lead_id");
  const urlTermAcceptanceId = searchParams.get("term_acceptance_id");
  const [leadId, setLeadId] = useState<string | null>(urlLeadId || null);
  const [termAcceptanceId, setTermAcceptanceId] = useState<string | null>(urlTermAcceptanceId || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      // Se já temos os IDs da URL, usar eles
      if (urlLeadId && urlTermAcceptanceId) {
        setLeadId(urlLeadId);
        setTermAcceptanceId(urlTermAcceptanceId);
        setLoading(false);
        return;
      }

      // Tentar buscar do sessionId se não tiver os IDs
      if (!urlLeadId || !urlTermAcceptanceId) {
        if (sessionId) {
          try {
            const { data: payment } = await supabase
              .from("payments")
              .select("lead_id, term_acceptance_id")
              .eq("stripe_session_id", sessionId)
              .maybeSingle();

            if (payment) {
              setLeadId(payment.lead_id);
              setTermAcceptanceId(payment.term_acceptance_id);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error("Error fetching payment info:", err);
          }
        }

        // Se ainda não encontrou, tentar buscar o term_acceptance mais recente do lead
        // através dos metadados da última sessão do Stripe ou buscar diretamente
        // Por enquanto, se não encontrar nada, não há muito o que fazer
      }

      setLoading(false);
    };

    fetchPaymentInfo();
  }, [sessionId, urlLeadId, urlTermAcceptanceId]);

  const handleTryAgain = () => {
    if (leadId && termAcceptanceId) {
      navigate("/process-payment", {
        state: { leadId, termAcceptanceId },
      });
    } else {
      navigate("/lead-form");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <Card className="glass p-8 max-w-2xl w-full">
        <div className="text-center space-y-6">
          <XCircle className="w-20 h-20 text-destructive mx-auto" />
          <h1 className="text-4xl font-bold">Pagamento Cancelado</h1>
          <p className="text-xl text-muted-foreground">
            O pagamento foi cancelado. Você pode tentar novamente quando estiver pronto.
          </p>

          <div className="mt-8 space-y-4">
            <Button
              onClick={handleTryAgain}
              className="bg-primary hover:bg-primary/90 w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? "Carregando..." : "Tentar Novamente"}
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
            >
              Voltar para o Início
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaymentCancel;

