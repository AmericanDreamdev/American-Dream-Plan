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

      // Tentar buscar do sessionId se não tiver os IDs na URL
      if (!urlLeadId || !urlTermAcceptanceId) {
        if (sessionId) {
          try {
            // Tentar buscar do payment pelo session_id
            const { data: payment } = await supabase
              .from("payments")
              .select("lead_id, term_acceptance_id")
              .eq("stripe_session_id", sessionId)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (payment?.lead_id && payment?.term_acceptance_id) {
              setLeadId(payment.lead_id);
              setTermAcceptanceId(payment.term_acceptance_id);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error("Error fetching payment info:", err);
          }
        }
      }

      setLoading(false);
    };

    fetchPaymentInfo();
  }, [sessionId, urlLeadId, urlTermAcceptanceId]);

  const handleTryAgain = () => {
    // Sempre tentar redirecionar para página de opções de pagamento
    // Se tiver os IDs, usar eles; senão, redirecionar para o formulário para gerar novos IDs
    if (leadId && termAcceptanceId) {
      navigate(`/payment-options?lead_id=${leadId}&term_acceptance_id=${termAcceptanceId}`);
    } else {
      // Se não tiver os IDs, voltar para o formulário para criar um novo lead/aceitação
      navigate("/lead-form");
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-0">
      <div className="min-h-screen bg-white flex items-center justify-center p-6 relative z-10">
        <Card className="bg-white p-8 max-w-2xl w-full shadow-2xl border border-gray-200">
        <div className="text-center space-y-6">
            <XCircle className="w-20 h-20 text-red-500 mx-auto" />
            <h1 className="text-4xl font-bold text-gray-900">Pagamento Cancelado</h1>
            <p className="text-xl text-gray-700">
            O pagamento foi cancelado. Você pode tentar novamente quando estiver pronto.
          </p>

          <div className="mt-8 space-y-4">
            <Button
              onClick={handleTryAgain}
                className="bg-gradient-to-r from-[#0575E6] to-[#021B79] hover:from-[#0685F6] hover:to-[#032B89] text-white w-full font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
              disabled={loading}
            >
              {loading ? "Carregando..." : "Tentar Novamente"}
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full !border-gray-200 !bg-white !text-gray-500 hover:!bg-gray-100 hover:!text-gray-600 !shadow-none"
            >
              Voltar para o Início
            </Button>
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
};

export default PaymentCancel;

