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
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lead_id, term_acceptance_id, payment_method }: RequestBody = await req.json();

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

    // Valor do contrato em USD
    const usdAmount = 99900; // US$ 999,00 em centavos
    
    // Valor fixo para PIX: R$ 5.500,00
    const brlAmount = 550000; // R$ 5.500,00 em centavos (valor fixo para PIX)
    
    // Taxa de câmbio calculada para referência
    const exchangeRate = brlAmount / usdAmount; // Taxa atual baseada no valor fixo

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
    console.log("Amount:", amount, "centavos =", amount / 100, currency === "brl" ? "reais" : "dólares");
    console.log("USD Amount (reference):", usdAmount, "centavos =", usdAmount / 100, "dólares");
    console.log("BRL Amount (for PIX):", brlAmount, "centavos =", brlAmount / 100, "reais");
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
                ? `Consultoria completa para obtenção de vistos B1/B2, F1 e Change of Status. Valor: R$ ${(brlAmount / 100).toFixed(2)}`
                : `Consultoria completa para obtenção de vistos B1/B2, F1 e Change of Status. Valor: US$ ${(usdAmount / 100).toFixed(2)}`,
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
        original_usd_amount: (usdAmount / 100).toString(),
        brl_amount: (brlAmount / 100).toString(),
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
          original_usd_amount: (usdAmount / 100).toString(),
          brl_amount: (brlAmount / 100).toString(),
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

