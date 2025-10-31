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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <Card className="glass p-8 max-w-2xl w-full">
        <div className="text-center space-y-6">
          <CheckCircle2 className="w-20 h-20 text-primary mx-auto" />
          <h1 className="text-4xl font-bold">Pagamento Confirmado!</h1>
          <p className="text-xl text-muted-foreground">
            Obrigado pelo seu pagamento. Seu contrato foi processado com sucesso.
          </p>

          {pdfUrl && (
            <div className="mt-8 space-y-4">
              <p className="text-muted-foreground">
                Baixe seu contrato assinado:
              </p>
              <Button
                onClick={() => window.open(pdfUrl, "_blank")}
                className="bg-primary hover:bg-primary/90"
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

export default PaymentSuccess;

