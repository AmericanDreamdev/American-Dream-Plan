import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^17.3.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  lead_id: string;
  term_acceptance_id: string;
  payment_method?: "card" | "pix"; // Método de pagamento específico (opcional)
  exchange_rate?: number; // Taxa de câmbio USD → BRL (opcional, do frontend)
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lead_id, term_acceptance_id, payment_method, exchange_rate: frontendExchangeRate }: RequestBody = await req.json();

    if (!lead_id || !term_acceptance_id) {
      return new Response(
        JSON.stringify({ error: "lead_id and term_acceptance_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      console.error("Error fetching lead:", leadError);
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe secret key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    // Valor base do contrato em USD (sem taxas)
    const baseUsdAmount = 99900; // US$ 999,00 em centavos
    const baseUsdAmountDecimal = baseUsdAmount / 100; // US$ 999.00
    
    // Taxas de processamento
    const cardFeePercentage = 0.039; // 3.9%
    const cardFeeFixed = 30; // $0.30 em centavos
    
    // Taxas do Stripe para PIX
    const STRIPE_PIX_PROCESSING_PERCENTAGE = 0.0119; // 1.19% - taxa de processamento
    const STRIPE_CURRENCY_CONVERSION_PERCENTAGE = 0.006; // 0.6% - taxa de conversão de moedas
    const STRIPE_PIX_TOTAL_PERCENTAGE = STRIPE_PIX_PROCESSING_PERCENTAGE + STRIPE_CURRENCY_CONVERSION_PERCENTAGE; // ~1.8%
    
    // ===== OBTER TAXA DE CÂMBIO =====
    // Prioridade 1: Taxa do frontend (recomendado)
    // Prioridade 2: API externa com margem comercial
    // Prioridade 3: Taxa de fallback
    let exchangeRate: number;
    
    if (frontendExchangeRate && frontendExchangeRate > 0) {
      // Usar taxa do frontend (garante consistência)
      exchangeRate = frontendExchangeRate;
      console.log("Using exchange rate from frontend:", exchangeRate);
    } else {
      // Buscar de API externa com margem comercial
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          const baseRate = parseFloat(data.rates.BRL);
          
          // Aplicar margem comercial (4% acima da taxa oficial)
          exchangeRate = baseRate * 1.04;
          console.log("Using exchange rate from API with 4% margin:", exchangeRate, "(base rate:", baseRate + ")");
        } else {
          throw new Error("API response not ok");
        }
      } catch (apiError) {
        console.error("Error fetching exchange rate from API:", apiError);
        // Taxa de fallback
        exchangeRate = 5.6;
        console.log("Using fallback exchange rate:", exchangeRate);
      }
    }
    
    // ===== CALCULAR VALOR PIX COM CONVERSÃO E MARKUP =====
    /**
     * Calcula o valor a cobrar para PIX BRL considerando as taxas do Stripe
     * 
     * @param netAmountUSD - Valor líquido desejado em dólares (ex: 999 para $999.00)
     * @param exchangeRate - Taxa de câmbio USD para BRL (ex: 5.6)
     * @returns Valor a cobrar em centavos de BRL
     */
    const calculatePIXAmountWithFees = (netAmountUSD: number, exchangeRate: number): number => {
      // 1. Converter USD para BRL
      const netAmountBRL = netAmountUSD * exchangeRate;
      
      // 2. Calcular valor antes das taxas do Stripe
      // Fórmula: Valor líquido / (1 - Taxa percentual total)
      const grossAmountBRL = netAmountBRL / (1 - STRIPE_PIX_TOTAL_PERCENTAGE);
      
      // 3. Arredondar para 2 casas decimais e converter para centavos
      const grossAmountRounded = Math.round(grossAmountBRL * 100) / 100;
      const grossAmountInCents = Math.round(grossAmountRounded * 100);
      
      return grossAmountInCents;
    };
    
    // Calcular valor PIX com conversão dinâmica
    const brlAmountWithFee = calculatePIXAmountWithFees(baseUsdAmountDecimal, exchangeRate);
    const baseBrlAmount = Math.round(baseUsdAmountDecimal * exchangeRate * 100); // Valor base em BRL (sem markup) em centavos
    
    // Calcular valores finais com taxas para cartão
    // Cartão: valor base + (valor base * 3.9%) + $0.30
    const usdAmountWithFee = Math.round(baseUsdAmount + (baseUsdAmount * cardFeePercentage) + cardFeeFixed);
    
    // Valores finais para exibição
    const usdAmount = usdAmountWithFee;
    const brlAmount = brlAmountWithFee;
    
    // Calcular valores das taxas para metadata
    const cardFeeAmount = usdAmountWithFee - baseUsdAmount; // Taxa total em centavos
    const pixFeeAmount = brlAmountWithFee - baseBrlAmount; // Taxa total em centavos (markup do Stripe)

    // Detectar URL do site automaticamente se SITE_URL não estiver configurada
    // Tenta pegar do header Referer ou Origin da requisição
    const referer = req.headers.get("referer") || req.headers.get("origin");
    let siteUrl = Deno.env.get("SITE_URL");
    
    if (!siteUrl && referer) {
      try {
        const url = new URL(referer);
        siteUrl = `${url.protocol}//${url.host}`;
      } catch {
        // Se falhar, usar fallback
        siteUrl = "http://localhost:8081";
      }
    }
    
    if (!siteUrl) {
      siteUrl = "http://localhost:8081";
    }

    // Garantir que sempre tenha esquema (http:// ou https://)
    siteUrl = siteUrl.trim().replace(/\/+$/, "");
    
    // Se não tiver esquema, adicionar https:// (ou http:// se for localhost)
    if (!siteUrl.match(/^https?:\/\//i)) {
      if (siteUrl.includes("localhost") || siteUrl.includes("127.0.0.1")) {
        siteUrl = `http://${siteUrl}`;
      } else {
        siteUrl = `https://${siteUrl}`;
      }
    }

    // Função auxiliar para construir URLs sem barras duplas
    const buildUrl = (path: string) => {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      const finalUrl = `${siteUrl}${cleanPath}`;
      
      // Validar que a URL está correta
      try {
        new URL(finalUrl);
        return finalUrl;
      } catch (error) {
        console.error("Invalid URL constructed:", finalUrl, error);
        // Fallback para URL válida
        return `https://americandream.323network.com${cleanPath}`;
      }
    };

    // Determinar método de pagamento e moeda baseado no parâmetro recebido
    const isPixOnly = payment_method === "pix";
    const isCardOnly = payment_method === "card";
    
    // Se for PIX, usar BRL e apenas PIX. Se for card, usar USD e apenas card
    const currency = isPixOnly ? "brl" : "usd";
    const amount = isPixOnly ? brlAmount : usdAmount;
    
    const paymentMethodTypes = isPixOnly 
      ? ["pix"]  // Apenas PIX quando for PIX
      : isCardOnly 
      ? ["card"] // Apenas card quando for card
      : ["card", "pix"]; // Ambos se não especificado (fallback)

    console.log("=== CHECKOUT SESSION CREATION ===");
    console.log("Requested payment method:", payment_method || "not specified");
    console.log("Payment method types:", JSON.stringify(paymentMethodTypes));
    console.log("Currency:", currency);
    console.log("Exchange Rate:", exchangeRate, "(source:", frontendExchangeRate ? "frontend" : "API/fallback" + ")");
    console.log("Base USD Amount:", baseUsdAmount, "centavos =", baseUsdAmountDecimal, "dólares");
    console.log("Base BRL Amount (converted):", baseBrlAmount, "centavos =", baseBrlAmount / 100, "reais");
    console.log("Card Fee:", cardFeePercentage * 100 + "% + $" + (cardFeeFixed / 100).toFixed(2), "=", cardFeeAmount / 100, "dólares");
    console.log("PIX Stripe Fees:", (STRIPE_PIX_TOTAL_PERCENTAGE * 100).toFixed(2) + "% (processing:", (STRIPE_PIX_PROCESSING_PERCENTAGE * 100).toFixed(2) + "%, conversion:", (STRIPE_CURRENCY_CONVERSION_PERCENTAGE * 100).toFixed(2) + "%)");
    console.log("PIX Markup Amount:", pixFeeAmount / 100, "reais");
    console.log("Final USD Amount (with fees):", usdAmount, "centavos =", usdAmount / 100, "dólares");
    console.log("Final BRL Amount (with markup):", brlAmount, "centavos =", brlAmount / 100, "reais");
    console.log("Amount to charge:", amount, "centavos =", amount / 100, currency === "brl" ? "reais" : "dólares");
    console.log("Customer email:", lead.email);

    // Criar sessão de checkout
    // IMPORTANTE: PIX requer BRL obrigatoriamente e não mostra seleção de métodos quando é o único método
    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: "Consultoria American Dream - Contrato de Consultoria",
              description: currency === "brl" 
                ? `Consultoria completa para obtenção de vistos B1/B2, F1 e Change of Status.`
                : `Consultoria completa para obtenção de vistos B1/B2, F1 e Change of Status.`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: buildUrl(`payment/success?session_id={CHECKOUT_SESSION_ID}&lead_id=${lead_id}&term_acceptance_id=${term_acceptance_id}`),
      cancel_url: buildUrl(`payment/cancel?lead_id=${lead_id}&term_acceptance_id=${term_acceptance_id}`),
      customer_email: lead.email,
      metadata: {
        lead_id: lead_id,
        term_acceptance_id: term_acceptance_id,
        lead_name: lead.name,
        base_usd_amount: (baseUsdAmount / 100).toString(),
        base_brl_amount: (baseBrlAmount / 100).toString(),
        final_usd_amount: (usdAmount / 100).toString(),
        final_brl_amount: (brlAmount / 100).toString(),
        card_fee_amount: (cardFeeAmount / 100).toString(),
        pix_fee_amount: (pixFeeAmount / 100).toString(),
        card_fee_percentage: (cardFeePercentage * 100).toString(),
        pix_fee_percentage: (STRIPE_PIX_TOTAL_PERCENTAGE * 100).toFixed(2),
        exchange_rate: exchangeRate.toFixed(3),
      },
      payment_method_options: {
        ...(paymentMethodTypes.includes("card") ? {
          card: {
            installments: {
              enabled: true, // Habilita Mastercard Installments (aparece quando cliente insere cartão Mastercard elegível)
              // Mastercard Installments: parcelamento em 4x sem juros para cartões Mastercard elegíveis
              // Só aparece DEPOIS que o cliente digita o número do cartão Mastercard
            },
          },
        } : {}),
        ...(paymentMethodTypes.includes("pix") ? {
          pix: {
            expires_after_seconds: 86400, // PIX expira em 24 horas (86400 segundos = 1 dia)
          },
        } : {}),
      },
      // IMPORTANTE:
      // 1. PIX requer BRL como moeda - o Stripe converte automaticamente quando PIX é selecionado
      // 2. PIX deve estar habilitado na conta Stripe
      // 3. Para adicionar Klarna, Afterpay ou Affirm: habilite no dashboard e descomente acima
    });

    console.log("=== SESSION CREATED ===");
    console.log("Session ID:", session.id);
    console.log("Session URL:", session.url);
    console.log("Session payment_method_types:", JSON.stringify(session.payment_method_types));
    console.log("Session currency:", session.currency);
    console.log("Session amount_total:", session.amount_total, "centavos =", session.amount_total ? session.amount_total / 100 : "N/A");
    console.log("Session payment_method_options:", JSON.stringify(session.payment_method_options));
    console.log("Session mode:", session.mode);
    console.log("Session payment_status:", session.payment_status);

    // Salvar payment no banco de dados
    // Nota: O valor e moeda serão atualizados pelo webhook quando o pagamento for concluído
    // Agora usando BRL como padrão para permitir PIX
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        lead_id: lead_id,
        term_acceptance_id: term_acceptance_id,
        stripe_session_id: session.id,
        amount: amount / 100, // Valor em centavos convertido para a moeda base
        currency: currency.toUpperCase(), // Moeda base (BRL para PIX, USD para card)
        status: "pending",
        metadata: {
          payment_method: payment_method, // Salvar o método escolhido (card ou pix)
          requested_payment_method: payment_method, // Manter compatibilidade
          base_usd_amount: (baseUsdAmount / 100).toString(),
          base_brl_amount: (baseBrlAmount / 100).toString(),
          final_usd_amount: (usdAmount / 100).toString(),
          final_brl_amount: (brlAmount / 100).toString(),
          card_fee_amount: (cardFeeAmount / 100).toString(),
          pix_fee_amount: (pixFeeAmount / 100).toString(),
          card_fee_percentage: (cardFeePercentage * 100).toString(),
          pix_fee_percentage: (STRIPE_PIX_TOTAL_PERCENTAGE * 100).toFixed(2),
          exchange_rate: exchangeRate.toFixed(3),
          checkout_url: session.url,
        },
      });

    if (paymentError) {
      console.error("Error saving payment:", paymentError);
      // Não falha a requisição, mas loga o erro
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: session.url,
        session_id: session.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

