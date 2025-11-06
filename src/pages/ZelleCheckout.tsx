import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Copy, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const ZelleCheckout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("lead_id");
  const termAcceptanceId = searchParams.get("term_acceptance_id");
  
  const [leadData, setLeadData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const zelleEmail = "adm@migmainc.com";
  const amountUSD = 999.00;

  useEffect(() => {
    if (!leadId || !termAcceptanceId) {
      navigate("/payment-options", { replace: true });
      return;
    }

    const fetchLeadData = async () => {
      try {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .eq("id", leadId)
          .single();

        if (error) throw error;
        setLeadData(data);
      } catch (err) {
        console.error("Error fetching lead:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadData();
  }, [leadId, termAcceptanceId, navigate]);

  // Forçar fundo branco na página
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    
    // Salvar estilos originais
    const originalHtmlStyle = html.style.cssText;
    const originalBodyStyle = body.style.cssText;
    
    // Aplicar fundo branco
    html.style.backgroundColor = '#ffffff';
    html.style.background = '#ffffff';
    body.style.backgroundColor = '#ffffff';
    body.style.background = '#ffffff';
    
    // Esconder pseudo-elementos que podem ter gradientes
    const style = document.createElement('style');
    style.id = 'zelle-checkout-white-bg';
    style.textContent = `
      html, body {
        background: #ffffff !important;
        background-color: #ffffff !important;
      }
      html::before, html::after,
      body::before, body::after {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    // Limpar ao desmontar
    return () => {
      html.style.cssText = originalHtmlStyle;
      body.style.cssText = originalBodyStyle;
      const styleEl = document.getElementById('zelle-checkout-white-bg');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando informações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate(`/payment-options?lead_id=${leadId}&term_acceptance_id=${termAcceptanceId}`)}
          className="mb-6 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          style={{ backgroundColor: '#ffffff', color: '#374151', borderColor: '#d1d5db' }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card className="shadow-xl bg-white border border-gray-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Pagamento via Zelle
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Envie o pagamento para o email abaixo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Informações de pagamento */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Valor a pagar
                </label>
                <div className="text-3xl font-bold text-gray-900">
                  US$ {amountUSD.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email do Zelle
                </label>
                <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                  <span className="flex-1 font-mono text-lg text-gray-900">
                    {zelleEmail}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(zelleEmail, "Email")}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Instruções */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Instruções de pagamento:
              </h3>
              <ol className="space-y-3 list-decimal list-inside text-gray-700">
                <li>Abra o aplicativo Zelle no seu celular ou banco</li>
                <li>Selecione a opção "Enviar" ou "Send"</li>
                <li>Digite ou cole o email: <strong className="text-gray-900">{zelleEmail}</strong></li>
                <li>Insira o valor: <strong className="text-gray-900">US$ {amountUSD.toFixed(2)}</strong></li>
                <li>Revise as informações e confirme o pagamento</li>
                <li>Após enviar, clique no botão abaixo para confirmar</li>
              </ol>
            </div>

            {/* Avisos */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Importante:</strong> Certifique-se de enviar o pagamento para o email correto ({zelleEmail}). 
                Após realizar o pagamento, você receberá um link para preencher o formulário de consulta.
              </p>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate(`/payment-options?lead_id=${leadId}&term_acceptance_id=${termAcceptanceId}`)}
                className="flex-1"
              >
                Escolher outro método
              </Button>
              <Button
                onClick={() => {
                  toast.success("Após realizar o pagamento, você receberá um link para preencher o formulário de consulta.");
                  navigate(`/payment-options?lead_id=${leadId}&term_acceptance_id=${termAcceptanceId}`);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Entendi, já realizei o pagamento
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ZelleCheckout;

