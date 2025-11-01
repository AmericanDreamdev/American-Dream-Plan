import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

// URLs das imagens dos métodos de pagamento
const PAYMENT_METHOD_IMAGES = {
  zelle: "", // Adicione o link da imagem do Zelle aqui
  card: "", // Adicione o link da imagem do Cartão aqui
  pix: "", // Adicione o link da imagem do PIX aqui
};

// Componente SVG do Stripe
const StripeIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className}
    width="512px" 
    height="214px" 
    viewBox="0 0 512 214" 
    version="1.1" 
    xmlns="http://www.w3.org/2000/svg" 
    preserveAspectRatio="xMidYMid"
  >
    <title>Stripe</title>
    <g>
      <path d="M512,110.08 C512,73.6711111 494.364444,44.9422222 460.657778,44.9422222 C426.808889,44.9422222 406.328889,73.6711111 406.328889,109.795556 C406.328889,152.604444 430.506667,174.222222 465.208889,174.222222 C482.133333,174.222222 494.933333,170.382222 504.604444,164.977778 L504.604444,136.533333 C494.933333,141.368889 483.84,144.355556 469.76,144.355556 C455.964444,144.355556 443.733333,139.52 442.168889,122.737778 L511.715556,122.737778 C511.715556,120.888889 512,113.493333 512,110.08 L512,110.08 Z M441.742222,96.5688889 C441.742222,80.4977778 451.555556,73.8133333 460.515556,73.8133333 C469.191111,73.8133333 478.435556,80.4977778 478.435556,96.5688889 L441.742222,96.5688889 Z M351.431111,44.9422222 C337.493333,44.9422222 328.533333,51.4844444 323.555556,56.0355556 L321.706667,47.2177778 L290.417778,47.2177778 L290.417778,213.048889 L325.973333,205.511111 L326.115556,165.262222 C331.235556,168.96 338.773333,174.222222 351.288889,174.222222 C376.746667,174.222222 399.928889,153.742222 399.928889,108.657778 C399.786667,67.4133333 376.32,44.9422222 351.431111,44.9422222 L351.431111,44.9422222 Z M342.897778,142.933333 C334.506667,142.933333 329.528889,139.946667 326.115556,136.248889 L325.973333,83.4844444 C329.671111,79.36 334.791111,76.5155556 342.897778,76.5155556 C355.84,76.5155556 364.8,91.0222222 364.8,109.653333 C364.8,128.711111 355.982222,142.933333 342.897778,142.933333 L342.897778,142.933333 Z M241.493333,36.5511111 L277.191111,28.8711111 L277.191111,1.42108547e-14 L241.493333,7.53777778 L241.493333,36.5511111 Z M241.493333,47.36 L277.191111,47.36 L277.191111,171.804444 L241.493333,171.804444 L241.493333,47.36 Z M203.235556,57.8844444 L200.96,47.36 L170.24,47.36 L170.24,171.804444 L205.795556,171.804444 L205.795556,87.4666667 C214.186667,76.5155556 228.408889,78.5066667 232.817778,80.0711111 L232.817778,47.36 C228.266667,45.6533333 211.626667,42.5244444 203.235556,57.8844444 Z M132.124444,16.4977778 L97.4222222,23.8933333 L97.28,137.813333 C97.28,158.862222 113.066667,174.364444 134.115556,174.364444 C145.777778,174.364444 154.311111,172.231111 159.004444,169.671111 L159.004444,140.8 C154.453333,142.648889 131.982222,149.191111 131.982222,128.142222 L131.982222,77.6533333 L159.004444,77.6533333 L159.004444,47.36 L131.982222,47.36 L132.124444,16.4977778 Z M35.9822222,83.4844444 C35.9822222,77.9377778 40.5333333,75.8044444 48.0711111,75.8044444 C58.88,75.8044444 72.5333333,79.0755556 83.3422222,84.9066667 L83.3422222,51.4844444 C71.5377778,46.7911111 59.8755556,44.9422222 48.0711111,44.9422222 C19.2,44.9422222 0,60.0177778 0,85.1911111 C0,124.444444 54.0444444,118.186667 54.0444444,135.111111 C54.0444444,141.653333 48.3555556,143.786667 40.3911111,143.786667 C28.5866667,143.786667 13.5111111,138.951111 1.56444444,132.408889 L1.56444444,166.257778 C14.7911111,171.946667 28.16,174.364444 40.3911111,174.364444 C69.9733333,174.364444 90.3111111,159.715556 90.3111111,134.257778 C90.1688889,91.8755556 35.9822222,99.4133333 35.9822222,83.4844444 Z" fill="#635BFF"/>
    </g>
  </svg>
);

// Componente SVG do PIX
const PixIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className}
    xmlns="http://www.w3.org/2000/svg" 
    x="0px" 
    y="0px" 
    width="100" 
    height="100" 
    viewBox="0 0 48 48"
  >
    <path fill="#4db6ac" d="M11.9,12h-0.68l8.04-8.04c2.62-2.61,6.86-2.61,9.48,0L36.78,12H36.1c-1.6,0-3.11,0.62-4.24,1.76	l-6.8,6.77c-0.59,0.59-1.53,0.59-2.12,0l-6.8-6.77C15.01,12.62,13.5,12,11.9,12z"></path>
    <path fill="#4db6ac" d="M36.1,36h0.68l-8.04,8.04c-2.62,2.61-6.86,2.61-9.48,0L11.22,36h0.68c1.6,0,3.11-0.62,4.24-1.76	l6.8-6.77c0.59-0.59,1.53-0.59,2.12,0l6.8,6.77C32.99,35.38,34.5,36,36.1,36z"></path>
    <path fill="#4db6ac" d="M44.04,28.74L38.78,34H36.1c-1.07,0-2.07-0.42-2.83-1.17l-6.8-6.78c-1.36-1.36-3.58-1.36-4.94,0	l-6.8,6.78C13.97,33.58,12.97,34,11.9,34H9.22l-5.26-5.26c-2.61-2.62-2.61-6.86,0-9.48L9.22,14h2.68c1.07,0,2.07,0.42,2.83,1.17	l6.8,6.78c0.68,0.68,1.58,1.02,2.47,1.02s1.79-0.34,2.47-1.02l6.8-6.78C34.03,14.42,35.03,14,36.1,14h2.68l5.26,5.26	C46.65,21.88,46.65,26.12,44.04,28.74z"></path>
  </svg>
);

// Componente SVG do Zelle
const ZelleIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className}
    xmlns="http://www.w3.org/2000/svg" 
    x="0px" 
    y="0px" 
    width="100" 
    height="100" 
    viewBox="0 0 48 48"
  >
    <path fill="#a0f" d="M35,42H13c-3.866,0-7-3.134-7-7V13c0-3.866,3.134-7,7-7h22c3.866,0,7,3.134,7,7v22 C42,38.866,38.866,42,35,42z"></path>
    <path fill="#fff" d="M17.5,18.5h14c0.552,0,1-0.448,1-1V15c0-0.552-0.448-1-1-1h-14c-0.552,0-1,0.448-1,1v2.5	C16.5,18.052,16.948,18.5,17.5,18.5z"></path>
    <path fill="#fff" d="M17,34.5h14.5c0.552,0,1-0.448,1-1V31c0-0.552-0.448-1-1-1H17c-0.552,0-1,0.448-1,1v2.5	C16,34.052,16.448,34.5,17,34.5z"></path>
    <path fill="#fff" d="M22.25,11v6c0,0.276,0.224,0.5,0.5,0.5h3.5c0.276,0,0.5-0.224,0.5-0.5v-6c0-0.276-0.224-0.5-0.5-0.5	h-3.5C22.474,10.5,22.25,10.724,22.25,11z"></path>
    <path fill="#fff" d="M22.25,32v6c0,0.276,0.224,0.5,0.5,0.5h3.5c0.276,0,0.5-0.224,0.5-0.5v-6c0-0.276-0.224-0.5-0.5-0.5	h-3.5C22.474,31.5,22.25,31.724,22.25,32z"></path>
    <path fill="#fff" d="M16.578,30.938H22l10.294-12.839c0.178-0.222,0.019-0.552-0.266-0.552H26.5L16.275,30.298	C16.065,30.553,16.247,30.938,16.578,30.938z"></path>
  </svg>
);

// Componente SVG do Infinite Pay (placeholder - substitua pelo logo oficial quando disponível)
const InfinitePayIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className}
    xmlns="http://www.w3.org/2000/svg" 
    x="0px" 
    y="0px" 
    width="100" 
    height="100" 
    viewBox="0 0 48 48"
  >
    <path fill="#00A8FF" d="M24,4C12.954,4,4,12.954,4,24s8.954,20,20,20s20-8.954,20-20S35.046,4,24,4z"></path>
    <path fill="#fff" d="M24,12c-6.627,0-12,5.373-12,12s5.373,12,12,12s12-5.373,12-12S30.627,12,24,12z M24,32	c-4.418,0-8-3.582-8-8s3.582-8,8-8s8,3.582,8,8S28.418,32,24,32z"></path>
    <path fill="#00A8FF" d="M24,20c-2.209,0-4,1.791-4,4s1.791,4,4,4s4-1.791,4-4S26.209,20,24,20z"></path>
  </svg>
);

const PaymentOptions = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("lead_id");
  const termAcceptanceId = searchParams.get("term_acceptance_id");
  const countryParam = searchParams.get("country") || "US"; // Padrão: EUA
  
  const [loadingCard, setLoadingCard] = useState(false);
  const [loadingPix, setLoadingPix] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>(countryParam.toUpperCase());
  
  // Determinar se é Brasil ou EUA
  const isBrazil = userCountry === "BR";
  const isUSA = userCountry === "US";

  useEffect(() => {
    if (!leadId || !termAcceptanceId) {
      navigate("/lead-form", { replace: true });
      return;
    }

    // Se for Brasil, registrar e redirecionar diretamente para InfinitePay sem mostrar a página
    if (isBrazil) {
      const registerInfinitePayRedirect = async () => {
        try {
          await supabase.from("payments").insert({
            lead_id: leadId,
            term_acceptance_id: termAcceptanceId,
            amount: 5776.00, // Valor do InfinitePay em BRL (R$ 5.776,00)
            currency: "BRL",
            status: "redirected_to_infinitepay",
            metadata: {
              payment_method: "infinitepay",
              infinitepay_url: "https://loja.infinitepay.io/brantimmigration/hea9241-american-dream",
              redirected_at: new Date().toISOString(),
            },
          });
        } catch (err) {
          console.error("Error registering InfinitePay redirect:", err);
          // Não bloqueia o redirecionamento mesmo se houver erro
        }
      };
      
      registerInfinitePayRedirect();
      window.location.href = "https://loja.infinitepay.io/brantimmigration/hea9241-american-dream";
    }
  }, [leadId, termAcceptanceId, navigate, isBrazil]);

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
    style.id = 'payment-options-white-bg';
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
      const styleEl = document.getElementById('payment-options-white-bg');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, []);

  const handleStripeCheckout = async (method: "card" | "pix" = "card") => {
    if (!leadId || !termAcceptanceId) return;

    // Definir loading específico para o método
    if (method === "card") {
      setLoadingCard(true);
    } else {
      setLoadingPix(true);
    }
    setError(null);

    try {
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            lead_id: leadId,
            term_acceptance_id: termAcceptanceId,
            payment_method: method, // Passar o método específico (card ou pix)
          },
        }
      );

      if (checkoutError || !checkoutData?.checkout_url) {
        console.error("Error creating checkout session:", checkoutError);
        setError("Erro ao processar pagamento. Tente novamente.");
        if (method === "card") {
          setLoadingCard(false);
        } else {
          setLoadingPix(false);
        }
        return;
      }

      // Redirecionar para o checkout do Stripe
      if (checkoutData.checkout_url) {
        window.location.href = checkoutData.checkout_url;
      }
    } catch (checkoutErr) {
      console.error("Error calling checkout function:", checkoutErr);
      setError("Erro ao processar pagamento. Tente novamente.");
      if (method === "card") {
        setLoadingCard(false);
      } else {
        setLoadingPix(false);
      }
    }
  };

  const handleZelleCheckout = () => {
    navigate(`/zelle-checkout?lead_id=${leadId}&term_acceptance_id=${termAcceptanceId}`);
  };

  const handleInfinitePayCheckout = async () => {
    if (!leadId || !termAcceptanceId) return;
    
    // Registrar redirecionamento para InfinitePay
    try {
      await supabase.from("payments").insert({
        lead_id: leadId,
        term_acceptance_id: termAcceptanceId,
        amount: 5776.00, // Valor do InfinitePay em BRL (R$ 5.776,00)
        currency: "BRL",
        status: "redirected_to_infinitepay",
        metadata: {
          payment_method: "infinitepay",
          infinitepay_url: "https://loja.infinitepay.io/brantimmigration/hea9241-american-dream",
          redirected_at: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error("Error registering InfinitePay redirect:", err);
      // Não bloqueia o redirecionamento mesmo se houver erro
    }
    
    // Redirecionar diretamente para o link da InfinitePay
    window.location.href = "https://loja.infinitepay.io/brantimmigration/hea9241-american-dream";
  };

  if (!leadId || !termAcceptanceId) {
    return null;
  }

  // Se for Brasil, não renderizar a página (será redirecionado automaticamente)
  if (isBrazil) {
    return null;
  }

  // Renderizar métodos de pagamento baseado no país
  const renderPaymentMethods = () => {
    if (isBrazil) {
      // Brasil: apenas Infinite Pay
      return (
        <div className="grid md:grid-cols-1 gap-4 max-w-md mx-auto">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-gray-200 hover:border-gray-400 bg-white"
            onClick={handleInfinitePayCheckout}
          >
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-20 h-20">
                  <InfinitePayIcon className="w-full h-full" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Infinite Pay</h3>
              <p className="text-sm text-gray-600 mb-4">
                Pagamento via Infinite Pay
              </p>
              <Button 
                className="w-full"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInfinitePayCheckout();
                }}
              >
                Pagar com Infinite Pay
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    } else {
      // EUA: Zelle, Stripe Card e Stripe PIX
      return (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Zelle */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-gray-200 hover:border-gray-400 bg-white"
            onClick={handleZelleCheckout}
          >
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-20 h-20">
                  <ZelleIcon className="w-full h-full" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Zelle</h3>
              <p className="text-sm text-gray-600 mb-4">
                Pagamento rápido e seguro via Zelle
              </p>
              <Button 
                className="w-full"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleZelleCheckout();
                }}
              >
                Pagar com Zelle
              </Button>
            </CardContent>
          </Card>

          {/* Stripe Card */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-gray-200 hover:border-gray-400 bg-white"
            onClick={() => handleStripeCheckout("card")}
          >
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-full max-w-[200px] h-20">
                  <StripeIcon className="w-full h-full" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Cartão de Crédito</h3>
              <p className="text-sm text-gray-600 mb-4">
                Visa, Mastercard, American Express
              </p>
              <Button 
                className="w-full"
                variant="outline"
                disabled={loadingCard}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStripeCheckout("card");
                }}
              >
                {loadingCard ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Pagar com Cartão"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Stripe PIX */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-gray-200 hover:border-gray-400 bg-white"
            onClick={() => handleStripeCheckout("pix")}
          >
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-20 h-20">
                  <PixIcon className="w-full h-full" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">PIX</h3>
              <p className="text-sm text-gray-600 mb-4">
                Pagamento instantâneo via PIX
              </p>
              <Button 
                className="w-full"
                variant="outline"
                disabled={loadingPix}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStripeCheckout("pix");
                }}
              >
                {loadingPix ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Pagar com PIX"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/lead-form")}
          className="mb-6 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          style={{ backgroundColor: '#ffffff', color: '#374151', borderColor: '#d1d5db' }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card className="shadow-xl bg-white border border-gray-200">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">
              Escolha a forma de pagamento
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Selecione o método de pagamento de sua preferência
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
                {error}
              </div>
            )}

            {/* Métodos de pagamento renderizados baseado no país */}
            {renderPaymentMethods()}

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Pagamento seguro processado via Stripe e Zelle</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentOptions;

