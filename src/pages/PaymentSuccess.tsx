import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        // Buscar payment pelo session_id
        const { data: payment, error } = await supabase
          .from("payments")
          .select("*")
          .eq("stripe_session_id", sessionId)
          .single();

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
  }, [sessionId]);

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

