import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Download, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
            .single();

          if (!error && data) {
            payment = data;
          }
        }

        // Se não encontrou por session_id e tem lead_id/term_acceptance_id, buscar pagamento completed
        if (!payment && leadId && termAcceptanceId) {
          const { data, error } = await supabase
            .from("payments")
            .select("*")
            .eq("lead_id", leadId)
            .eq("term_acceptance_id", termAcceptanceId)
            .in("status", ["completed", "zelle_confirmed", "redirected_to_infinitepay"])
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (!error && data) {
            payment = data;
          }
        }

        // Se encontrou pagamento, buscar PDF se tiver term_acceptance_id
        if (payment?.term_acceptance_id) {
          // Buscar term_acceptance para pegar o pdf_url
          const { data: termAcceptance } = await supabase
            .from("term_acceptance")
            .select("pdf_url")
            .eq("id", payment.term_acceptance_id)
            .single();

          if (termAcceptance?.pdf_url) {
            setPdfUrl(termAcceptance.pdf_url);
          }
        }
      } catch (err) {
        console.error("Error fetching payment info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentInfo();
  }, [sessionId, searchParams]);

  return (
    <div className="fixed inset-0 bg-white z-0">
      <div className="min-h-screen bg-white flex items-center justify-center p-6 relative z-10">
      <Card className="bg-white p-8 max-w-2xl w-full shadow-2xl border border-gray-200">
        <div className="text-center space-y-6">
          <CheckCircle2 className="w-20 h-20 text-[#0575E6] mx-auto" />
          <h1 className="text-4xl font-bold text-gray-900">Pagamento Confirmado!</h1>
          <p className="text-xl text-gray-700">
            Obrigado pelo seu pagamento. Seu contrato foi processado com sucesso.
          </p>

          {pdfUrl && (
            <div className="mt-8 space-y-4">
              <p className="text-gray-700">
                Baixe seu contrato assinado:
              </p>
              <Button
                onClick={() => window.open(pdfUrl, "_blank")}
                className="w-full bg-gradient-to-r from-[#0575E6] to-[#021B79] hover:from-[#0685F6] hover:to-[#032B89] text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Baixar Contrato PDF
              </Button>
            </div>
          )}

          <div className="mt-8 space-y-4 p-6 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-gray-700 font-medium mb-2">
              Para mais informações, entre em contato conosco:
            </p>
            <Button
              onClick={() => window.open("https://wa.me/13234041292", "_blank")}
              className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Entrar em contato via WhatsApp
            </Button>
          </div>

          <div className="mt-8 space-y-4">
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

export default PaymentSuccess;

