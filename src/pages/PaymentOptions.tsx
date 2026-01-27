import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

// O componente ParcelowIcon foi removido para usar a imagem oficial em /public/parcelow_share.webp

const PaymentOptions = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("lead_id");
  const termAcceptanceId = searchParams.get("term_acceptance_id");
  const countryParam = searchParams.get("country") || "US"; // Padrão: EUA
  
  const [loadingCard, setLoadingCard] = useState(false);
  const [loadingPix, setLoadingPix] = useState(false);
  const [loadingParcelow, setLoadingParcelow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>(countryParam.toUpperCase());
  const [leadData, setLeadData] = useState<any>(null);
  const [showCPFModal, setShowCPFModal] = useState(false);
  const [cpf, setCpf] = useState("");
  const [isUpdatingCPF, setIsUpdatingCPF] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  
  // Flag para evitar processamento múltiplo do retorno
  const hasProcessedReturn = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Estado para forçar re-avaliação quando página é restaurada do bfcache
  const [pageShowTrigger, setPageShowTrigger] = useState(0);

  // Verificar e processar token de autenticação se presente na URL
  useEffect(() => {
    const checkAuthToken = async () => {
      const token = searchParams.get("token");
      
      if (token) {
        try {
          console.log("[PaymentOptions] Token encontrado na URL, autenticando...");
          
          // Tentar autenticar com o token
          const { data: { session }, error: authError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: token, // Fallback: usar o mesmo token como refresh
          });

          if (!authError && session?.user) {
            console.log("[PaymentOptions] Autenticação bem-sucedida:", session.user.id);
            
            // Vincular lead ao user_id se necessário
            if (leadId) {
              const { data: lead, error: leadError } = await supabase
                .from("leads")
                .select("user_id")
                .eq("id", leadId)
                .single();

              if (!leadError && lead && !lead.user_id) {
                console.log("[PaymentOptions] Vinculando lead ao user_id...");
                const { error: updateError } = await supabase
                  .from("leads")
                  .update({ user_id: session.user.id })
                  .eq("id", leadId);

                if (updateError) {
                  console.error("[PaymentOptions] Erro ao vincular lead:", updateError);
                } else {
                  console.log("[PaymentOptions] Lead vinculado com sucesso");
                }
              }
            }
            
            // Remover token da URL após processar
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete("token");
            const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""}`;
            window.history.replaceState({}, "", newUrl);
            
            console.log("[PaymentOptions] Token removido da URL");
          } else {
            console.error("[PaymentOptions] Erro na autenticação:", authError);
          }
        } catch (error) {
          console.error("[PaymentOptions] Erro ao processar token:", error);
        }
      }
    };

    checkAuthToken();
  }, [searchParams, leadId]);
  
  // Determinar se é Brasil (usado apenas para logs e possíveis futuras customizações)
  const isBrazil = userCountry === "BR";

  // Valores base (sem taxas)
  const baseUsdAmount = 1999.00; // US$ 1.999,00
  
  // Taxas de processamento
  const cardFeePercentage = 0.039; // 3.9%
  const cardFeeFixed = 0.30; // $0.30
  
  // Taxas do Stripe para PIX
  const STRIPE_PIX_PROCESSING_PERCENTAGE = 0.0119; // 1.19%
  const STRIPE_CURRENCY_CONVERSION_PERCENTAGE = 0.006; // 0.6%
  const STRIPE_PIX_TOTAL_PERCENTAGE = STRIPE_PIX_PROCESSING_PERCENTAGE + STRIPE_CURRENCY_CONVERSION_PERCENTAGE; // ~1.8%
  
  // Estado para taxa de câmbio
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loadingExchangeRate, setLoadingExchangeRate] = useState(true);
  
  // Obter taxa de câmbio ao carregar o componente
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          const baseRate = parseFloat(data.rates.BRL);
          
          // Aplicar margem comercial (4% acima da taxa oficial)
          const rateWithMargin = baseRate * 1.04;
          setExchangeRate(rateWithMargin);
          console.log("[PaymentOptions] Exchange rate fetched:", rateWithMargin, "(base:", baseRate + ")");
        } else {
          throw new Error("API response not ok");
        }
      } catch (error) {
        console.error("[PaymentOptions] Error fetching exchange rate:", error);
        // Taxa de fallback
        setExchangeRate(5.6);
        console.log("[PaymentOptions] Using fallback exchange rate: 5.6");
      } finally {
        setLoadingExchangeRate(false);
      }
    };
    
    fetchExchangeRate();
  }, []);

  // Carregar dados do lead
  useEffect(() => {
    const fetchLeadData = async () => {
      if (!leadId) return;
      console.log("[PaymentOptions] Fetching lead data for CPF validation...");
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();
      
      if (!error && data) {
        console.log("[PaymentOptions] Lead data fetched:", data.id);
        setLeadData(data);
        if (data.document_number) {
          setCpf(data.document_number);
        }
      } else if (error) {
        console.error("[PaymentOptions] Error fetching lead data:", error);
      }
    };
    fetchLeadData();
  }, [leadId]);
  
  // Calcular valores finais com taxas
  const cardFinalAmount = baseUsdAmount + (baseUsdAmount * cardFeePercentage) + cardFeeFixed; // US$ 1,038.26
  const zelleAmount = baseUsdAmount; // US$ 1.999,00 (sem taxas)
  
  // Calcular valor PIX com conversão dinâmica (se taxa disponível)
  const calculatePIXAmount = (netAmountUSD: number, rate: number): number => {
    // 1. Converter USD para BRL
    const netAmountBRL = netAmountUSD * rate;
    
    // 2. Calcular valor antes das taxas do Stripe
    const grossAmountBRL = netAmountBRL / (1 - STRIPE_PIX_TOTAL_PERCENTAGE);
    
    // 3. Arredondar para 2 casas decimais
    return Math.round(grossAmountBRL * 100) / 100;
  };
  
  const pixFinalAmount = exchangeRate 
    ? calculatePIXAmount(baseUsdAmount, exchangeRate) 
    : null; // Será calculado quando taxa estiver disponível

  // Listener para detectar quando a página é restaurada do bfcache
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log("[PaymentOptions] Page restored from bfcache. Re-evaluating state.");
        // Resetar flag de processamento para permitir re-avaliação
        hasProcessedReturn.current = false;
        // Forçar o useEffect principal a re-executar
        setPageShowTrigger(prev => prev + 1);
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []); // Este useEffect roda apenas uma vez para configurar o listener

  useEffect(() => {
    // Evitar processamento múltiplo
    if (hasProcessedReturn.current) {
      console.log("[PaymentOptions] useEffect: Already processed, skipping");
      return;
    }

    if (!leadId || !termAcceptanceId) {
      navigate("/lead-form", { replace: true });
      return;
    }

    console.log("[PaymentOptions] useEffect: Starting processing", {
      leadId,
      termAcceptanceId,
      isBrazil
    });

    // ===== VERIFICAÇÃO DE RETORNO DO PIX =====
    const pixTrackerKey = `pix_checkout_${leadId}_${termAcceptanceId}`;
    const pixTrackerData = sessionStorage.getItem(pixTrackerKey);
    const referrer = document.referrer;
    const isFromStripe = referrer && (
      referrer.includes("checkout.stripe.com") || 
      referrer.includes("stripe.com")
    );

    console.log("[PaymentOptions] 🔍 Checking PIX tracker:", {
      hasTracker: !!pixTrackerData,
      isFromStripe,
      referrer: referrer ? referrer.substring(0, 100) : "none",
      leadId,
      termAcceptanceId,
    });

    // Verificar se há tracker de PIX (não depender apenas do referrer, pois pode não funcionar com navegação manual)
    if (pixTrackerData) {
      try {
        const tracker = JSON.parse(pixTrackerData);
        const trackerAge = Date.now() - tracker.timestamp;
        const oneHour = 60 * 60 * 1000; // 1 hora em milissegundos
        const ageInMinutes = Math.floor(trackerAge / 60000);

        console.log("[PaymentOptions] 📊 PIX tracker details:", {
          trackerAge: `${ageInMinutes} minutes`,
          isExpired: trackerAge >= oneHour,
          isFromStripe,
          trackerData: tracker,
        });

        // Verificar se o tracker não expirou (1 hora)
        // IMPORTANTE: Não exigir isFromStripe, pois o referrer pode não funcionar com navegação manual
        if (trackerAge < oneHour) {
          console.log("[PaymentOptions] ✅ PIX tracker valid, checking payment status...", {
            note: isFromStripe ? "Detected return from Stripe" : "Tracker found, checking payment (may be manual return)",
          });
          
          // Marcar como processado para evitar processamento múltiplo
          hasProcessedReturn.current = true;
          
          // Buscar pagamento PIX usando edge function (mais confiável)
          const checkPixPayment = async (retryCount = 0) => {
            try {
              console.log(`[PaymentOptions] 🔄 Checking PIX payment via edge function (attempt ${retryCount + 1}/3)...`, {
                leadId,
                termAcceptanceId,
                trackerSessionId: tracker.session_id,
                retryCount,
              });

              // Adicionar pequeno delay no primeiro retry para dar tempo do pagamento ser criado
              if (retryCount > 0) {
                console.log(`[PaymentOptions] ⏳ Waiting 1 second before retry ${retryCount + 1}...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo de delay
              }

              // Chamar edge function para buscar pagamento PIX
              console.log("[PaymentOptions] 📞 Calling edge function check-pix-payment...", {
                functionName: "check-pix-payment",
                body: {
                  lead_id: leadId,
                  term_acceptance_id: termAcceptanceId,
                  session_id: tracker.session_id || undefined,
                },
              });

              const { data: result, error } = await supabase.functions.invoke(
                "check-pix-payment",
                {
                  body: {
                    lead_id: leadId,
                    term_acceptance_id: termAcceptanceId,
                    session_id: tracker.session_id || undefined,
                  },
                }
              );

              console.log("[PaymentOptions] 📥 Edge function call completed", {
                hasError: !!error,
                hasData: !!result,
                error: error,
                result: result,
              });

              if (error) {
                console.error("[PaymentOptions] ❌ Error calling check-pix-payment function:", {
                  error,
                  errorMessage: error.message,
                  errorDetails: error,
                  retryCount,
                  leadId,
                  termAcceptanceId,
                });
                // Limpar tracker em caso de erro após 3 tentativas
                if (retryCount >= 2) {
                  console.log("[PaymentOptions] 🗑️ Clearing tracker after max retries (error)");
                  sessionStorage.removeItem(pixTrackerKey);
                }
                return;
              }

              console.log("[PaymentOptions] 📦 Edge function response:", result);

              if (result?.found && result?.payment) {
                const pixPayment = result.payment;
                console.log("[PaymentOptions] ✅ PIX payment found via edge function", {
                  paymentId: pixPayment.id,
                  sessionId: pixPayment.stripe_session_id || tracker.session_id,
                  status: pixPayment.status,
                });
                
                // Apenas redirecionar se o pagamento foi PAGO ou APROVADO
                // Se ainda está pending, limpar o tracker e deixar o usuário escolher outro método
                if (pixPayment.status === 'paid' || pixPayment.status === 'approved' || pixPayment.status === 'succeeded') {
                  console.log("[PaymentOptions] ✅ Payment is complete, redirecting to success page");
                  
                  // Limpar tracker antes de redirecionar
                  sessionStorage.removeItem(pixTrackerKey);
                  console.log("[PaymentOptions] 🗑️ Tracker cleared before redirect");
                  
                  // Redirecionar para PaymentSuccess
                  const sessionId = pixPayment.stripe_session_id || tracker.session_id;
                  const successUrl = sessionId 
                    ? `/payment/success?session_id=${sessionId}&lead_id=${leadId}&term_acceptance_id=${termAcceptanceId}`
                    : `/payment/success?lead_id=${leadId}&term_acceptance_id=${termAcceptanceId}`;
                  
                  console.log("[PaymentOptions] 🔀 Redirecting to:", successUrl);
                  navigate(successUrl, { replace: true });
                  return;
                } else {
                  console.log("[PaymentOptions] ⏳ Payment is still pending, clearing tracker and letting user choose another method", {
                    status: pixPayment.status,
                  });
                  // Limpar tracker - usuário pode escolher outro método
                  sessionStorage.removeItem(pixTrackerKey);
                  return;
                }
              } else {
                // Se não encontrou e ainda tem tentativas, tentar novamente
                if (retryCount < 2) {
                  console.log(`[PaymentOptions] ⚠️ No PIX payment found yet, retrying (${retryCount + 1}/3)...`, {
                    message: result?.message || "No payment found",
                  });
                  return checkPixPayment(retryCount + 1);
                } else {
                  console.log("[PaymentOptions] ❌ No PIX payment found after retries, clearing tracker", {
                    message: result?.message || "No payment found",
                  });
                  // Se não encontrou pagamento após retries, limpar tracker (pode ter sido cancelado)
                  sessionStorage.removeItem(pixTrackerKey);
                }
              }
            } catch (err) {
              console.error("[PaymentOptions] ❌ Error checking PIX payment:", {
                error: err,
                retryCount,
                leadId,
                termAcceptanceId,
              });
              // Limpar tracker em caso de erro após 3 tentativas
              if (retryCount >= 2) {
                console.log("[PaymentOptions] 🗑️ Clearing tracker after max retries (exception)");
                sessionStorage.removeItem(pixTrackerKey);
              }
            }
          };

          // Executar verificação
          checkPixPayment();
          return; // Não continuar com o resto do useEffect
        } else {
          // Tracker expirado, limpar
          console.log("[PaymentOptions] ⏰ PIX tracker expired, clearing", {
            ageInMinutes: Math.floor(trackerAge / 60000),
            maxAgeInMinutes: 60,
          });
          sessionStorage.removeItem(pixTrackerKey);
        }
      } catch (err) {
        console.error("[PaymentOptions] ❌ Error parsing PIX tracker:", {
          error: err,
          trackerData: pixTrackerData,
        });
        // Limpar tracker em caso de erro
        sessionStorage.removeItem(pixTrackerKey);
      }
    } else {
      console.log("[PaymentOptions] ℹ️ No PIX tracker found");
    }
    // ===== FIM VERIFICAÇÃO DE RETORNO DO PIX =====
  }, [leadId, termAcceptanceId, navigate, isBrazil, pageShowTrigger]);

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

  // Detectar scroll e atualizar indicador ativo
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const cards = container.querySelectorAll('.snap-center');
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      let closestIndex = 0;
      let closestDistance = Infinity;

      cards.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.abs(cardCenter - containerCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveCardIndex(closestIndex);
    };

    container.addEventListener('scroll', handleScroll);
    // Chamar uma vez para definir o estado inicial
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleStripeCheckout = async (method: "card" | "pix" = "card") => {
    if (!leadId || !termAcceptanceId) return;

    // Se escolher outro método (card), limpar tracker de PIX se existir
    if (method === "card") {
      const pixTrackerKey = `pix_checkout_${leadId}_${termAcceptanceId}`;
      const pixTrackerData = sessionStorage.getItem(pixTrackerKey);
      if (pixTrackerData) {
        console.log("[PaymentOptions] 🗑️ Clearing PIX tracker - user chose card instead", {
          key: pixTrackerKey,
          hadTracker: true,
        });
        sessionStorage.removeItem(pixTrackerKey);
      }
    }

    // Definir loading específico para o método
    if (method === "card") {
      setLoadingCard(true);
    } else {
      setLoadingPix(true);
    }
    setError(null);

    try {
      // Preparar body com taxa de câmbio se disponível (para PIX)
      const requestBody: any = {
        lead_id: leadId,
        term_acceptance_id: termAcceptanceId,
        payment_method: method, // Passar o método específico (card ou pix)
      };
      
      // Se for PIX e tiver taxa de câmbio, enviar para garantir consistência
      if (method === "pix" && exchangeRate) {
        requestBody.exchange_rate = exchangeRate;
        console.log("[PaymentOptions] Sending exchange rate to backend:", exchangeRate);
      }
      
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: requestBody,
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

      // Se for PIX, salvar tracker no sessionStorage antes de redirecionar
      if (method === "pix" && leadId && termAcceptanceId) {
        const pixTrackerKey = `pix_checkout_${leadId}_${termAcceptanceId}`;
        const trackerData = {
          lead_id: leadId,
          term_acceptance_id: termAcceptanceId,
          timestamp: Date.now(),
          checkout_url: checkoutData.checkout_url,
          session_id: checkoutData.session_id || null,
        };
        sessionStorage.setItem(pixTrackerKey, JSON.stringify(trackerData));
        console.log("[PaymentOptions] ✅ PIX tracker saved:", {
          key: pixTrackerKey,
          data: trackerData,
          timestamp: new Date(trackerData.timestamp).toISOString(),
        });
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

  const handleZelleCheckout = async () => {
    if (!leadId || !termAcceptanceId) return;
    
    // Limpar tracker de PIX se existir (usuário escolheu outro método)
    const pixTrackerKey = `pix_checkout_${leadId}_${termAcceptanceId}`;
    const pixTrackerData = sessionStorage.getItem(pixTrackerKey);
    if (pixTrackerData) {
      console.log("[PaymentOptions] 🗑️ Clearing PIX tracker - user chose Zelle instead", {
        key: pixTrackerKey,
        hadTracker: true,
      });
      sessionStorage.removeItem(pixTrackerKey);
    }
    
    // Registrar escolha do Zelle no banco de dados
    try {
      // Tentar inserir diretamente - se der erro (duplicata ou 403), não bloquear
      // Não fazer SELECT primeiro para evitar erro 403
      const { error } = await supabase.from("payments").insert({
        lead_id: leadId,
        term_acceptance_id: termAcceptanceId,
        amount: 1999.00, // Valor do Zelle em USD (US$ 1.999,00)
        currency: "USD",
        status: "redirected_to_zelle",
        metadata: {
          payment_method: "zelle",
          zelle_email: "adm@migmainc.com",
          redirected_at: new Date().toISOString(),
        },
      });
      
      // Se der erro (incluindo duplicata ou 403), apenas logar mas não bloquear
      if (error) {
        console.error("Error registering Zelle redirect:", error);
        // Não bloquear a navegação mesmo se houver erro
      }
    } catch (err) {
      console.error("Error registering Zelle redirect:", err);
      // Não bloquear a navegação mesmo se houver erro
    }
    
    // Navegar para a página de checkout do Zelle
    navigate(`/zelle-checkout?lead_id=${leadId}&term_acceptance_id=${termAcceptanceId}`);
  };

  const handleParcelowCheckout = async () => {
    if (!leadId || !termAcceptanceId) return;

    // Se não tiver CPF, abrir modal
    if (!cpf || cpf.replace(/\D/g, "").length !== 11) {
      console.log("[PaymentOptions] CPF missing or invalid, opening modal...");
      setShowCPFModal(true);
      return;
    }
    
    // Limpar tracker de PIX se existir (usuário escolheu outro método)
    const pixTrackerKey = `pix_checkout_${leadId}_${termAcceptanceId}`;
    const pixTrackerData = sessionStorage.getItem(pixTrackerKey);
    if (pixTrackerData) {
      console.log("[PaymentOptions] Clearing PIX tracker - user chose Parcelow instead");
      sessionStorage.removeItem(pixTrackerKey);
    }
    
    setLoadingParcelow(true);
    setError(null);

    try {
      // Primeiro, criar um payment record no banco de dados se não existir ou atualizar
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          lead_id: leadId,
          term_acceptance_id: termAcceptanceId,
          amount: 1999.00,
          currency: "USD",
          status: "pending",
          metadata: {
            payment_method: "parcelow",
            created_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (paymentError || !payment) {
        console.error("Error creating payment record:", paymentError);
        setError("Erro ao processar pagamento. Tente novamente.");
        setLoadingParcelow(false);
        return;
      }

      console.log("[PaymentOptions] Payment record created:", payment.id);

      // Chamar Edge Function para criar checkout no Parcelow
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        "create-parcelow-checkout",
        {
          body: {
            payment_id: payment.id,
            currency: "USD"
          },
        }
      );

      if (checkoutError || !checkoutData?.checkout_url) {
        console.error("Error creating Parcelow checkout session:", {
          checkoutError,
          checkoutData,
          errorMessage: checkoutError?.message,
        });
        
        const errorMessage = checkoutError?.message || checkoutData?.error || checkoutData?.message || "Erro desconhecido";
        
        setError(
          checkoutData?.error === "CPF_REQUIRED" 
            ? "CPF é obrigatório para pagamento via Parcelow." 
            : errorMessage.includes("credentials not configured")
            ? "Configuração de credenciais Parcelow ausente. Entre em contato com o suporte."
            : errorMessage.includes("Failed to authenticate")
            ? "Erro de autenticação com Parcelow. Verifique as credenciais configuradas."
            : `Erro ao processar pagamento via Parcelow: ${errorMessage}`
        );
        setLoadingParcelow(false);
        if (checkoutData?.error === "CPF_REQUIRED") setShowCPFModal(true);
        return;
      }

      // Redirecionar para o checkout da Parcelow
      window.location.href = checkoutData.checkout_url;
    } catch (err) {
      console.error("Error calling Parcelow checkout function:", err);
      setError("Erro ao processar pagamento. Tente novamente.");
      setLoadingParcelow(false);
    }
  };

  const handleUpdateCPF = async () => {
    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      setError("CPF deve ter 11 dígitos.");
      return;
    }

    setIsUpdatingCPF(true);
    try {
      const { error: updateError } = await supabase
        .from("leads")
        .update({ document_number: cpf })
        .eq("id", leadId);

      if (updateError) throw updateError;

      setShowCPFModal(false);
      // Iniciar o checkout após atualizar o CPF
      handleParcelowCheckout();
    } catch (err) {
      console.error("Error updating CPF:", err);
      setError("Erro ao atualizar CPF. Tente novamente.");
    } finally {
      setIsUpdatingCPF(false);
    }
  };

  if (!leadId || !termAcceptanceId) {
    return null;
  }


  // Renderizar métodos de pagamento baseado no país
  const renderPaymentMethods = () => {
    // Todos os países: Parcelow, Zelle, Stripe Card, Stripe PIX
    return (
      <div className="space-y-4">
          {/* Indicador de scroll no mobile */}
          <div className="md:hidden text-center mb-3">
            <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
              <span>Deslize para ver mais opções</span>
              <svg className="w-5 h-5 animate-bounce-horizontal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </p>
          </div>

          {/* Mobile: Swiper horizontal / Desktop: Grid */}
          <div className="relative">
            {/* Gradiente indicador de mais conteúdo à direita - apenas mobile */}
            <div className="md:hidden absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/40 to-transparent pointer-events-none z-0" style={{ right: '8px' }}></div>
            
            <div 
              ref={scrollContainerRef}
              className="md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 flex md:flex-none overflow-x-auto gap-4 pb-4 md:pb-0 pr-8 md:pr-0 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollPaddingRight: '8px' }}
            >
            {/* Parcelow - PRIMEIRO */}
            <div 
              className="group rounded-xl border-2 border-gray-200 hover:border-gray-400 bg-white transition-all duration-200 cursor-pointer hover:shadow-lg relative flex-shrink-0 w-[280px] md:w-auto snap-center flex flex-col z-10"
              onClick={handleParcelowCheckout}
            >
              {/* Badge destaque */}
              <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm z-10">
                21x
              </div>
              
              <div className="p-5 pt-10 flex flex-col flex-grow">
                {/* Logo */}
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-16 flex items-center justify-center overflow-hidden rounded-xl shadow-sm">
                    <img src="/parcelow_share.webp" alt="Parcelow" className="w-full h-full object-cover" />
                  </div>
                </div>
                
                <h4 className="text-lg font-semibold text-gray-900 text-center mb-1">Parcelow</h4>
                <p className="text-xs text-gray-500 text-center mb-3">
                  Parcele em até 21x no cartão
                </p>
                
                {/* Valor */}
                <div className="mb-4 text-center flex-grow">
                  <p className="text-2xl font-bold text-blue-600">
                    ${baseUsdAmount.toFixed(2)}
                  </p>
                </div>
                
                {/* Botão sempre no final */}
                <div className="mt-auto">
                  <Button 
                    variant="outline"
                    className="w-full border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                    disabled={loadingParcelow}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleParcelowCheckout();
                    }}
                  >
                    {loadingParcelow ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Pagar com Parcelow"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Zelle */}
            <div 
              className="group rounded-xl border-2 border-gray-200 hover:border-gray-400 bg-white transition-all duration-200 cursor-pointer hover:shadow-lg flex-shrink-0 w-[280px] md:w-auto snap-center flex flex-col relative z-10"
              onClick={handleZelleCheckout}
            >
              <div className="p-5 flex flex-col flex-grow">
                {/* Logo */}
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <ZelleIcon className="w-full h-full" />
                  </div>
                </div>
                
                <h4 className="text-lg font-semibold text-gray-900 text-center mb-1">Zelle</h4>
                <p className="text-xs text-gray-500 text-center mb-3">
                  Transferência bancária instantânea
                </p>
                
                {/* Valor */}
                <div className="mb-4 text-center flex-grow">
                  <p className="text-2xl font-bold text-blue-600">
                    ${zelleAmount.toFixed(2)}
                  </p>
                </div>
                
                {/* Botão sempre no final */}
                <div className="mt-auto">
                  <Button 
                    variant="outline"
                    className="w-full border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZelleCheckout();
                    }}
                  >
                    Pagar com Zelle
                  </Button>
                </div>
              </div>
            </div>

            {/* Stripe Card */}
            <div 
              className="group rounded-xl border-2 border-gray-200 hover:border-gray-400 bg-white transition-all duration-200 cursor-pointer hover:shadow-lg flex-shrink-0 w-[280px] md:w-auto snap-center flex flex-col relative z-10"
              onClick={() => handleStripeCheckout("card")}
            >
              <div className="p-5 flex flex-col flex-grow">
                {/* Logo */}
                <div className="flex justify-center mb-3">
                  <div className="w-full max-w-[140px] h-14 flex items-center justify-center">
                    <StripeIcon className="w-full h-full" />
                  </div>
                </div>
                
                <h4 className="text-lg font-semibold text-gray-900 text-center mb-1">Cartão de Crédito</h4>
                <p className="text-xs text-gray-500 text-center mb-3">
                  Visa, Mastercard, American Express
                </p>
                
                {/* Valor */}
                <div className="mb-4 text-center flex-grow">
                  <p className="text-2xl font-bold text-blue-600">
                    ${cardFinalAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Taxa de processamento incluída
                  </p>
                </div>
                
                {/* Botão sempre no final */}
                <div className="mt-auto">
                  <Button 
                    variant="outline"
                    className="w-full border-gray-300 hover:border-blue-400 hover:bg-blue-50"
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
                </div>
              </div>
            </div>

            {/* Stripe PIX */}
            <div 
              className="group rounded-xl border-2 border-gray-200 hover:border-gray-400 bg-white transition-all duration-200 cursor-pointer hover:shadow-lg flex-shrink-0 w-[280px] md:w-auto snap-center flex flex-col relative z-10"
              onClick={() => handleStripeCheckout("pix")}
            >
              <div className="p-5 flex flex-col flex-grow">
                {/* Logo */}
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <PixIcon className="w-full h-full" />
                  </div>
                </div>
                
                <h4 className="text-lg font-semibold text-gray-900 text-center mb-1">PIX</h4>
                <p className="text-xs text-gray-500 text-center mb-3">
                  Pagamento instantâneo via PIX
                </p>
                
                {/* Valor */}
                <div className="mb-4 text-center flex-grow">
                  {loadingExchangeRate || pixFinalAmount === null ? (
                    <p className="text-2xl font-bold text-gray-400">
                      Calculando...
                    </p>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-blue-600">
                        R$ {pixFinalAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Taxa de processamento incluída
                      </p>
                    </>
                  )}
                </div>
                
                {/* Botão sempre no final */}
                <div className="mt-auto">
                  <Button 
                    variant="outline"
                    className="w-full border-gray-300 hover:border-blue-400 hover:bg-blue-50"
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
                </div>
              </div>
            </div>
          </div>
          </div>
          
          {/* Indicadores de navegação (dots) - apenas mobile */}
          <div className="md:hidden flex justify-center gap-2 pt-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ease-out ${
                  activeCardIndex === index 
                    ? 'w-8 bg-blue-600 payment-dot-active' 
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Informações de segurança */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Pagamento 100% Seguro</p>
                <p className="text-xs text-gray-600 mt-1">
                  Todas as transações são criptografadas e protegidas. Seus dados estão seguros.
                </p>
              </div>
            </div>
          </div>
        </div>
    );
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
          </CardContent>
        </Card>

        {/* Modal para solicitar CPF (Parcelow) */}
        <Dialog open={showCPFModal} onOpenChange={setShowCPFModal}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>Informação Necessária</DialogTitle>
              <DialogDescription>
                A Parcelow exige o seu CPF para processar pagamentos parcelados para o Brasil.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col space-y-4 py-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  type="text"
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCPFModal(false)}
                className="bg-gray-100 hover:bg-gray-200"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={handleUpdateCPF}
                disabled={isUpdatingCPF || !cpf}
              >
                {isUpdatingCPF ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Continuar para Pagamento"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PaymentOptions;

