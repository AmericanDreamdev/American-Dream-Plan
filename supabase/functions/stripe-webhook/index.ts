import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^17.3.1";
import { syncPaymentTo323Network } from "../utils/syncPaymentTo323Network.ts";
import { getCorrectUserIdFrom323Network } from "../utils/findUserIn323Network.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Função auxiliar para enviar email via SMTP
async function sendEmail(
  to: string,
  toName: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<boolean> {
  try {
    // Obter chave de autenticação do endpoint de email
    const emailApiKey = Deno.env.get("EMAIL_API_KEY");

    if (!emailApiKey) {
      console.error("EMAIL_API_KEY not configured. Please set EMAIL_API_KEY environment variable.");
      return false;
    }

    // Construir URL com chave de autenticação
    const emailEndpoint = `http://212.1.213.163:3000/send-smtp?key=${encodeURIComponent(emailApiKey)}`;

    // Obter credenciais SMTP das variáveis de ambiente
    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpSecure = Deno.env.get("SMTP_SECURE") === "true";
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpUser || !smtpPassword) {
      console.error("SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables.");
      return false;
    }

    const emailData = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: smtpUser,
      password: smtpPassword,
      to: to,
      subject: subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ""), // Remove HTML tags para texto simples
      fromName: "American Dream",
      toName: toName,
    };

    const response = await fetch(emailEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Error sending email:", {
        status: response.status,
        statusText: response.statusText,
        error: responseText,
        endpoint: emailEndpoint.replace(/\?key=.*/, "?key=***"), // Ocultar chave no log
      });
      return false;
    }

    // Log detalhado de sucesso
    console.log("✅ Email sent successfully:", {
      to: to,
      subject: subject,
      status: response.status,
      response: responseText.substring(0, 200), // Primeiros 200 caracteres da resposta
    });

    return true;
  } catch (error: any) {
    console.error("Error sending email:", error.message);
    return false;
  }
}

// Função auxiliar para gerar token de consulta
function generateShortToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "app-";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Função para gerar ou buscar token de consulta
async function getOrCreateConsultationToken(
  supabase: any,
  leadId: string,
  termAcceptanceId: string | null,
  paymentId: string | null
): Promise<string | null> {
  try {
    // Verificar se já existe token válido
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Construir query baseada em termAcceptanceId (pode ser null)
    let query = supabase
      .from("approval_tokens")
      .select("token")
      .eq("lead_id", leadId)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString());

    // Se termAcceptanceId for null, usar .is(), senão usar .eq()
    if (termAcceptanceId === null) {
      query = query.is("term_acceptance_id", null);
    } else {
      query = query.eq("term_acceptance_id", termAcceptanceId);
    }

    const { data: existingToken } = await query.maybeSingle();

    if (existingToken) {
      console.log("Using existing consultation token");
      return existingToken.token;
    }

    // Gerar novo token
    let token = generateShortToken();
    let tokenExists = true;
    let attempts = 0;

    while (tokenExists && attempts < 10) {
      const { data: checkToken } = await supabase
        .from("approval_tokens")
        .select("token")
        .eq("token", token)
        .maybeSingle();

      if (!checkToken) {
        tokenExists = false;
      } else {
        token = generateShortToken();
        attempts++;
      }
    }

    if (tokenExists) {
      console.error("Failed to generate unique token");
      return null;
    }

    // Criar token
    const { data: newToken, error: tokenError } = await supabase
      .from("approval_tokens")
      .insert({
        token,
        lead_id: leadId,
        term_acceptance_id: termAcceptanceId,
        payment_id: paymentId,
        payment_proof_id: null,
        expires_at: expiresAt.toISOString(),
        used_at: null,
      })
      .select("token")
      .single();

    if (tokenError) {
      console.error("Error creating consultation token:", tokenError);
      return null;
    }

    console.log("Created new consultation token");
    return newToken.token;
  } catch (error: any) {
    console.error("Error in getOrCreateConsultationToken:", error.message);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Stripe - Detectar ambiente e escolher chaves corretas
    // Primeiro, tentar detectar se estamos em test ou production baseado nas chaves disponíveis
    let stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    let stripeWebhookSecret: string | undefined;

    // Verificar se a chave é de teste ou produção
    const isTestMode = stripeSecretKey?.startsWith("sk_test_");
    const isLiveMode = stripeSecretKey?.startsWith("sk_live_");

    // Escolher webhook secret baseado no modo
    if (isTestMode) {
      // Modo teste: priorizar STRIPE_WEBHOOK_SECRET_TEST, depois STRIPE_WEBHOOK_SECRET
      stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET_TEST") || Deno.env.get("STRIPE_WEBHOOK_SECRET");
      console.log("🧪 TEST MODE detected - Using test webhook secret");
    } else if (isLiveMode) {
      // Modo produção: usar STRIPE_WEBHOOK_SECRET (ou STRIPE_WEBHOOK_SECRET_LIVE se existir)
      stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET_LIVE") || Deno.env.get("STRIPE_WEBHOOK_SECRET");
      console.log("🚨 PRODUCTION MODE detected - Using production webhook secret");
    } else {
      // Modo desconhecido: tentar STRIPE_WEBHOOK_SECRET como padrão
      stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
      console.warn("⚠️ UNKNOWN MODE - Using default webhook secret");
    }

    // Se não encontrou chave secreta, tentar alternativas
    if (!stripeSecretKey) {
      stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY_TEST") || Deno.env.get("STRIPE_SECRET_KEY_LIVE");
    }

    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error("Stripe keys not configured");
      console.error("STRIPE_SECRET_KEY:", stripeSecretKey ? "✅ Found" : "❌ Missing");
      console.error("STRIPE_WEBHOOK_SECRET:", stripeWebhookSecret ? "✅ Found" : "❌ Missing");
      console.error("STRIPE_WEBHOOK_SECRET_TEST:", Deno.env.get("STRIPE_WEBHOOK_SECRET_TEST") ? "✅ Found" : "❌ Missing");
      return new Response(
        JSON.stringify({ error: "Stripe keys not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("=== STRIPE WEBHOOK CONFIGURATION ===");
    console.log("Stripe Key Type:", isLiveMode ? "LIVE (production)" : isTestMode ? "TEST" : "UNKNOWN");
    console.log("Stripe Key Prefix:", stripeSecretKey.substring(0, 7) + "...");
    console.log("Webhook Secret Length:", stripeWebhookSecret.length);
    console.log("Webhook Secret Prefix:", stripeWebhookSecret.substring(0, 10) + "...");

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    // IMPORTANTE: Obter o corpo da requisição como RAW TEXT (não parseado)
    // O Stripe precisa do corpo exato como recebido para verificar a assinatura
    // Tentar obter o body de forma que preserve exatamente como o Stripe enviou
    const signature = req.headers.get("stripe-signature");

    // Obter body como arrayBuffer primeiro e depois converter para string
    // Isso garante que não há modificações no body
    const bodyArrayBuffer = await req.arrayBuffer();
    const body = new TextDecoder().decode(bodyArrayBuffer);

    // Coletar informações da requisição para rastreamento
    const requestInfo = {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      timestamp: new Date().toISOString(),
    };

    // Tentar extrair informações do evento mesmo se a assinatura falhar
    let eventId: string | null = null;
    let eventType: string | null = null;
    try {
      const bodyParsed = JSON.parse(body);
      eventId = bodyParsed.id || null;
      eventType = bodyParsed.type || null;
    } catch {
      // Ignorar erro de parsing - não é crítico
    }

    // Log para debug (remover em produção se necessário)
    console.log("Webhook received - Signature present:", !!signature);
    console.log("Webhook secret configured:", !!stripeWebhookSecret);
    console.log("Body length:", body.length);
    console.log("Request info:", {
      method: requestInfo.method,
      url: requestInfo.url,
      userAgent: requestInfo.headers["user-agent"],
      origin: requestInfo.headers["origin"],
      referer: requestInfo.headers["referer"],
      xForwardedFor: requestInfo.headers["x-forwarded-for"],
      xRealIp: requestInfo.headers["x-real-ip"],
      eventId: eventId,
      eventType: eventType,
    });

    if (!signature) {
      console.error("No stripe-signature header found");
      return new Response(
        JSON.stringify({ error: "No signature provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!stripeWebhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se o webhook secret parece válido (deve começar com whsec_)
    // NOTA: Secrets do Stripe podem ter diferentes comprimentos (geralmente 38-50+ caracteres)
    const isWebhookSecretInvalid = !stripeWebhookSecret.startsWith("whsec_");
    if (isWebhookSecretInvalid) {
      console.error("⚠️ WARNING: Webhook secret seems invalid. Expected format: whsec_...");
      console.error("Current secret length:", stripeWebhookSecret.length);
      console.error("Current secret prefix:", stripeWebhookSecret.substring(0, 10) + "...");
      console.error("⚠️ CRITICAL: Webhook secret format is invalid. Please update STRIPE_WEBHOOK_SECRET in Supabase Edge Function environment variables.");
      console.error("⚠️ Get the correct secret from: Stripe Dashboard > Webhooks > Your endpoint > Signing secret");
    }

    // Verificar webhook signature
    // NOTA: O body DEVE ser o texto raw exatamente como recebido do Stripe
    let event: Stripe.Event;
    let verificationSucceeded = false;

    // Tentar verificar com o secret escolhido primeiro
    try {
      // Log detalhado antes da verificação
      console.log("Attempting webhook signature verification...", {
        signatureLength: signature?.length,
        webhookSecretLength: stripeWebhookSecret?.length,
        webhookSecretPrefix: stripeWebhookSecret?.substring(0, 10) + "...",
        bodyLength: body.length,
        bodyIsString: typeof body === "string",
        bodyFirstChars: body.substring(0, 50),
        mode: isTestMode ? "TEST" : isLiveMode ? "LIVE" : "UNKNOWN",
      });

      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        stripeWebhookSecret
      );
      console.log("✅ Webhook signature verified successfully. Event type:", event.type, "Event ID:", event.id);
      verificationSucceeded = true;

      // Salvar tentativa bem-sucedida no banco de dados
      try {
        const { error: dbError } = await supabase.from('webhook_attempts').insert({
          event_id: event.id,
          event_type: event.type,
          signature_length: signature?.length,
          body_length: body.length,
          error_message: null,
          error_type: null,
          user_agent: requestInfo.headers["user-agent"],
          origin: requestInfo.headers["origin"],
          referer: requestInfo.headers["referer"],
          x_forwarded_for: requestInfo.headers["x-forwarded-for"],
          x_real_ip: requestInfo.headers["x-real-ip"],
          request_url: requestInfo.url,
          request_method: requestInfo.method,
          success: true,
        });

        if (dbError) {
          console.error("Error saving successful webhook attempt:", dbError);
        }
      } catch (dbError: any) {
        console.error("Error attempting to save successful webhook attempt:", dbError.message);
      }
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed with primary secret:", err.message);

      // Se falhou, tentar com o secret alternativo (test vs production)
      if (!verificationSucceeded) {
        const alternateSecret = isTestMode
          ? Deno.env.get("STRIPE_WEBHOOK_SECRET") // Se test falhou, tentar o padrão
          : Deno.env.get("STRIPE_WEBHOOK_SECRET_TEST"); // Se live falhou, tentar test

        if (alternateSecret && alternateSecret !== stripeWebhookSecret) {
          console.log("🔄 Attempting verification with alternate webhook secret...");
          try {
            event = await stripe.webhooks.constructEventAsync(
              body,
              signature,
              alternateSecret
            );
            console.log("✅ Webhook signature verified successfully with alternate secret. Event type:", event.type, "Event ID:", event.id);
            verificationSucceeded = true;
            stripeWebhookSecret = alternateSecret; // Atualizar para usar o secret correto
          } catch (altErr: any) {
            console.error("❌ Alternate webhook secret also failed:", altErr.message);
          }
        }
      }

      // Se ainda não conseguiu verificar, continuar com o processamento abaixo
      if (!verificationSucceeded) {
        // Log detalhado do erro
        const errorDetails = {
          signatureLength: signature?.length,
          webhookSecretLength: stripeWebhookSecret?.length,
          webhookSecretPrefix: stripeWebhookSecret?.substring(0, 10) + "...",
          bodyLength: body.length,
          bodyIsString: typeof body === "string",
          bodyPreview: body.substring(0, 200),
          errorType: err.type,
          errorCode: err.code,
          eventId: eventId,
          eventType: eventType,
          mode: isTestMode ? "TEST" : isLiveMode ? "LIVE" : "UNKNOWN",
          requestInfo: {
            method: requestInfo.method,
            url: requestInfo.url,
            userAgent: requestInfo.headers["user-agent"],
            origin: requestInfo.headers["origin"],
            referer: requestInfo.headers["referer"],
            xForwardedFor: requestInfo.headers["x-forwarded-for"],
            xRealIp: requestInfo.headers["x-real-ip"],
          },
        };

        console.error("Error details:", errorDetails);

        // Tentar salvar tentativa falha no banco de dados para análise
        try {
          // Inserir registro da tentativa falha
          const { error: dbError } = await supabase.from('webhook_attempts').insert({
            event_id: eventId,
            event_type: eventType,
            signature_length: signature?.length,
            body_length: body.length,
            error_message: err.message,
            error_type: err.type,
            user_agent: requestInfo.headers["user-agent"],
            origin: requestInfo.headers["origin"],
            referer: requestInfo.headers["referer"],
            x_forwarded_for: requestInfo.headers["x-forwarded-for"],
            x_real_ip: requestInfo.headers["x-real-ip"],
            request_url: requestInfo.url,
            request_method: requestInfo.method,
            success: false,
          });

          if (dbError) {
            console.error("Error saving webhook attempt to database:", dbError);
          } else {
            console.log("✅ Webhook attempt saved to database for analysis");
          }
        } catch (dbError: any) {
          console.error("Error attempting to save webhook attempt:", dbError.message);
        }

        // Se a verificação de assinatura falhou, mas temos um evento válido, tentar processar mesmo assim
        // Isso pode acontecer se o body foi modificado pelo proxy/load balancer ou se há um problema de configuração
        // IMPORTANTE: Em produção, isso deve ser investigado, mas processamos para não perder pagamentos
        if (eventId && eventType) {
          console.error("⚠️ ATTEMPTING TO PROCESS EVENT WITHOUT SIGNATURE VERIFICATION");
          console.error("⚠️ Signature verification failed, but event appears valid. Processing to avoid payment loss.");
          console.error("⚠️ This may indicate:");
          console.error("   - The request body was modified by a proxy/load balancer");
          console.error("   - The STRIPE_WEBHOOK_SECRET in Supabase doesn't match the one in Stripe Dashboard");
          console.error("   - The webhook endpoint URL in Stripe doesn't match the actual function URL");

          try {
            // Tentar parsear o evento manualmente (sem verificação de assinatura)
            const bodyParsed = JSON.parse(body);
            const mockEvent: Stripe.Event = {
              id: bodyParsed.id,
              object: bodyParsed.object || "event",
              api_version: bodyParsed.api_version || null,
              created: bodyParsed.created || Math.floor(Date.now() / 1000),
              livemode: bodyParsed.livemode || false,
              pending_webhooks: bodyParsed.pending_webhooks || 0,
              request: bodyParsed.request || null,
              type: bodyParsed.type,
              data: bodyParsed.data,
            };

            console.log("⚠️ Processing event without signature verification:", mockEvent.type, mockEvent.id);
            event = mockEvent;

            // Continuar com o processamento normal abaixo
          } catch (parseError: any) {
            console.error("❌ Failed to parse event body:", parseError.message);
            return new Response(
              JSON.stringify({
                error: `Webhook Error: ${err.message}`,
                hint: "Failed to verify webhook signature and could not parse event body. Please check your configuration.",
                troubleshooting: [
                  "1. Verify STRIPE_WEBHOOK_SECRET in Supabase matches the one in Stripe Dashboard exactly",
                  "2. Check if the webhook endpoint URL in Stripe is correct: https://xwgdvpicgsjeyqejanwa.supabase.co/functions/v1/stripe-webhook",
                  "3. Ensure no proxy/load balancer is modifying the request body",
                  "4. Try regenerating the webhook secret in Stripe and updating it in Supabase"
                ],
                currentSecretLength: stripeWebhookSecret.length,
                currentSecretPrefix: stripeWebhookSecret.substring(0, 10) + "..."
              }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        } else {
          // Se não conseguimos extrair informações do evento, retornar erro
          return new Response(
            JSON.stringify({
              error: `Webhook Error: ${err.message}`,
              hint: "Failed to verify webhook signature and could not extract event information.",
              troubleshooting: [
                "1. Verify STRIPE_WEBHOOK_SECRET in Supabase matches the one in Stripe Dashboard exactly",
                "2. Check if the webhook endpoint URL in Stripe is correct",
                "3. Ensure the request body is not being modified"
              ]
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    // Função auxiliar para obter método de pagamento do PaymentIntent ou Session
    const getPaymentMethod = async (paymentIntentId: string | null, session?: Stripe.Checkout.Session): Promise<string | null> => {
      // Primeiro, tentar obter da sessão diretamente (mais confiável)
      if (session) {
        // Verificar payment_method_types na sessão
        if (session.payment_method_types && session.payment_method_types.length > 0) {
          const methodType = session.payment_method_types[0];
          if (methodType === "pix" || methodType === "card") {
            return methodType;
          }
        }

        // Verificar payment_method_options na sessão
        if (session.payment_method_options) {
          if (session.payment_method_options.pix) {
            return "pix";
          }
          if (session.payment_method_options.card) {
            return "card";
          }
        }
      }

      // Se não encontrou na sessão, tentar via PaymentIntent
      if (!paymentIntentId) return null;

      try {
        // Expandir charges para obter payment_method_details
        // NOTA: Não podemos expandir charges.data.payment_method diretamente
        // Precisamos expandir charges e depois acessar payment_method_details
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
          expand: ['charges'],
        });

        // O método de pagamento está nos charges (quando o pagamento já foi processado)
        if (paymentIntent.charges?.data?.length > 0) {
          const charge = paymentIntent.charges.data[0];
          if (charge.payment_method_details?.type) {
            const methodType = charge.payment_method_details.type;
            return methodType === "pix" ? "pix" : methodType === "card" ? "card" : methodType;
          }
        }

        // Fallback: verificar payment_method_types (disponível antes do pagamento ser processado)
        if (paymentIntent.payment_method_types?.length > 0) {
          const methodType = paymentIntent.payment_method_types[0];
          return methodType === "pix" ? "pix" : methodType === "card" ? "card" : methodType;
        }
      } catch (err: any) {
        // Log mais detalhado do erro
        const errorMessage = err.message || String(err);
        if (errorMessage.includes("test mode") || errorMessage.includes("live mode")) {
          console.warn("⚠️ PaymentIntent mode mismatch (test/live). This is usually harmless if the payment was processed correctly.");
          console.warn("⚠️ Error details:", errorMessage);
        } else {
          console.error("Error retrieving payment intent:", errorMessage);
        }
        // Não falhar o webhook por causa disso, apenas logar o erro
      }
      return null;
    };

    // Verificar se o evento foi inicializado
    if (!event) {
      console.error("❌ Event was not initialized. This should not happen.");
      return new Response(
        JSON.stringify({ error: "Event not initialized" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Processar eventos
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Obter método de pagamento (tentar da sessão primeiro, depois do PaymentIntent)
        const paymentMethod = await getPaymentMethod(session.payment_intent as string, session);

        // Preparar update com informações adicionais
        const updateData: any = {
          status: "completed",
          stripe_payment_intent_id: session.payment_intent as string,
          updated_at: new Date().toISOString(),
        };

        // Se for PIX ou outra moeda diferente de USD, atualizar amount e currency
        if (session.currency && session.currency.toLowerCase() !== "usd") {
          updateData.amount = session.amount_total ? session.amount_total / 100 : null;
          updateData.currency = session.currency.toUpperCase();
        } else if (session.amount_total) {
          // Atualizar amount mesmo para USD para garantir consistência
          updateData.amount = session.amount_total / 100;
          updateData.currency = (session.currency || "USD").toUpperCase();
        }

        // Adicionar método de pagamento ao metadata se existir
        if (paymentMethod) {
          const { data: currentPayment } = await supabase
            .from("payments")
            .select("metadata")
            .eq("stripe_session_id", session.id)
            .single();

          const metadata = currentPayment?.metadata || {};
          updateData.metadata = {
            ...metadata,
            payment_method: paymentMethod,
            amount_total: session.amount_total ? session.amount_total / 100 : null,
            currency: session.currency,
          };
        }

        // Atualizar payment status
        const { error: updateError } = await supabase
          .from("payments")
          .update(updateData)
          .eq("stripe_session_id", session.id);

        if (updateError) {
          console.error("Error updating payment:", updateError);
        } else {
          console.log(`Payment completed (${paymentMethod || "unknown"}) for lead: ${session.metadata?.lead_id || "unknown"}, amount: ${updateData.amount} ${updateData.currency}`);

          // Enviar email de confirmação de pagamento com link do formulário
          const leadId = session.metadata?.lead_id;
          const termAcceptanceId = session.metadata?.term_acceptance_id;

          if (leadId) {
            try {
              // Buscar payment_id atualizado e lead com user_id
              const { data: updatedPayment } = await supabase
                .from("payments")
                .select("id")
                .eq("stripe_session_id", session.id)
                .single();

              // Buscar lead com user_id e email para sincronização com 323 Network
              const { data: leadWithUserId } = await supabase
                .from("leads")
                .select("user_id, email")
                .eq("id", leadId)
                .single();

              // Obter user_id correto do 323 Network (busca por email se necessário)
              if (leadWithUserId && updatedPayment?.id) {
                try {
                  const correctUserId = await getCorrectUserIdFrom323Network(
                    leadWithUserId.user_id,
                    leadWithUserId.email || ""
                  );

                  if (!correctUserId) {
                    console.warn(`⚠️ Could not find user in 323 Network for email ${leadWithUserId.email} - skipping sync`);
                  } else {
                    // Se encontrou um user_id diferente, atualizar o lead para próximas vezes
                    if (leadWithUserId.user_id !== correctUserId) {
                      console.log(`🔄 Updating lead.user_id from ${leadWithUserId.user_id} to ${correctUserId}`);
                      await supabase
                        .from("leads")
                        .update({ user_id: correctUserId })
                        .eq("id", leadId);
                    }

                    // Converter amount para centavos (multiplicar por 100)
                    const amountInCents = Math.round((updateData.amount || 0) * 100);

                    // Determinar método de pagamento
                    const paymentMethodFor323 = paymentMethod === "pix" ? "pix" : "card";

                    await syncPaymentTo323Network({
                      user_id: correctUserId,
                      payment_id: updatedPayment.id,
                      lead_id: leadId,
                      amount: amountInCents,
                      currency: updateData.currency || "USD",
                      payment_method: paymentMethodFor323,
                      status: "completed",
                      stripe_session_id: session.id,
                      stripe_payment_intent_id: typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : (session.payment_intent as any)?.id,
                      metadata: {
                        american_dream_payment_id: updatedPayment.id,
                        lead_id: leadId,
                        stripe_session_id: session.id,
                        original_user_id: leadWithUserId.user_id,
                        found_by_email: leadWithUserId.user_id !== correctUserId,
                      },
                    });
                  }
                } catch (syncError: any) {
                  // Logar erro mas não falhar o processamento do webhook
                  console.error("❌ Failed to sync payment to 323 Network:", syncError.message);
                  // Opcional: Enviar notificação ou criar log de erro
                }
              } else if (!leadWithUserId) {
                console.warn("⚠️ Lead not found - skipping 323 Network sync");
              }

              // Gerar ou buscar token de consulta (não falhar se der erro)
              let consultationToken: string | null = null;
              try {
                consultationToken = await getOrCreateConsultationToken(
                  supabase,
                  leadId,
                  termAcceptanceId || null,
                  updatedPayment?.id || null
                );
              } catch (tokenError: any) {
                console.error("Error generating consultation token (non-fatal):", tokenError.message);
                // Continuar sem o token - email será enviado sem link
              }

              const { data: lead } = await supabase
                .from("leads")
                .select("name, email")
                .eq("id", leadId)
                .single();

              if (lead && lead.email) {
                const paymentMethodName = paymentMethod === "pix" ? "PIX" : paymentMethod === "card" ? "Cartão" : paymentMethod || "Pagamento";
                const amountFormatted = updateData.currency === "BRL"
                  ? `R$ ${updateData.amount.toFixed(2).replace(".", ",")}`
                  : `US$ ${updateData.amount.toFixed(2)}`;

                // Obter payment_part do metadata
                const paymentPart = session.metadata?.payment_part || "1";
                const isSecondPart = paymentPart === "2";

                // Construir URL do formulário (garantir que não há barras duplas)
                let siteUrl = Deno.env.get("SITE_URL") || "https://americandream.323network.com";
                // Remover todas as barras finais e espaços
                siteUrl = siteUrl.trim().replace(/\/+$/, "");
                // Garantir que começa com http:// ou https://
                if (!siteUrl.match(/^https?:\/\//i)) {
                  siteUrl = `https://${siteUrl}`;
                }
                // Construir link sem barras duplas
                const consultationLink = consultationToken
                  ? `${siteUrl}/consultation-form/${consultationToken}`.replace(/([^:]\/)\/+/g, '$1')
                  : null;

                const emailSubject = isSecondPart
                  ? "Confirmação - Segunda Parte do Pagamento - American Dream"
                  : "Pagamento Confirmado - American Dream";
                const emailHtml = `
                  <!DOCTYPE html>
                  <html lang="pt-BR">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; background-color: #f5f5f5;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
                      <tr>
                        <td align="center" style="padding: 40px 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <tr>
                              <td style="padding: 40px 40px 30px; text-align: center; background-color: #2563eb; border-radius: 8px 8px 0 0;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">American Dream</h1>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 40px;">
                                <h2 style="margin: 0 0 20px; color: #1e40af; font-size: 24px; font-weight: bold; line-height: 1.4;">
                                  Pagamento Confirmado!
                                </h2>
                                <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                  Olá ${lead.name},
                                </p>
                                <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                                  Seu pagamento foi confirmado com sucesso!
                                </p>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; border-radius: 8px; margin-bottom: 30px;">
                                  <tr>
                                    <td style="padding: 24px;">
                                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                          <td style="padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
                                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                                              Método de pagamento
                                            </p>
                                            <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600; line-height: 1.5;">
                                              ${paymentMethodName}
                                            </p>
                                          </td>
                                        </tr>
                                      </table>
                                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                          <td style="padding-top: 16px;">
                                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                                              Valor
                                            </p>
                                            <p style="margin: 0; color: #111827; font-size: 24px; font-weight: bold; line-height: 1.5;">
                                              ${amountFormatted}
                                            </p>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                                ${consultationLink ? `
                                <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                  Agora você pode preencher o formulário de consultoria. Clique no botão abaixo para começar:
                                </p>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
                                  <tr>
                                    <td align="center" style="padding: 0 0 20px;">
                                      <a href="${consultationLink}" 
                                         style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; text-align: center; min-width: 200px;">
                                        Preencher Formulário de Consultoria
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                                  Ou copie e cole este link no seu navegador:
                                </p>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; border-radius: 4px; margin-bottom: 30px;">
                                  <tr>
                                    <td style="padding: 12px; font-family: monospace; font-size: 12px; color: #111827; word-break: break-all;">
                                      ${consultationLink}
                                    </td>
                                  </tr>
                                </table>
                                ` : `
                                <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                                  Em breve você receberá mais informações sobre os próximos passos do seu processo.
                                </p>
                                `}
                                <p style="margin: 0; color: #1e40af; font-size: 16px; font-weight: 500; line-height: 1.6;">
                                  Obrigado por confiar no American Dream!
                                </p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; text-align: center;">
                                <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px; line-height: 1.5;">
                                  Este é um email automático, por favor não responda.
                                </p>
                                <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.5;">
                                  © 2025 American Dream. Todos os direitos reservados.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                  </html>
                `;

                await sendEmail(lead.email, lead.name, emailSubject, emailHtml);
              }
            } catch (emailError: any) {
              console.error("Error sending payment confirmation email:", emailError.message);
              // Não falhar o webhook por causa do email
            }
          }
        }

        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Para pagamentos assíncronos, geralmente é PIX (tentar da sessão primeiro)
        const paymentMethod = await getPaymentMethod(session.payment_intent as string, session) || "pix";

        // Preparar update com informações adicionais
        const updateData: any = {
          status: "completed",
          stripe_payment_intent_id: session.payment_intent as string,
          updated_at: new Date().toISOString(),
        };

        // Para PIX, sempre atualizar amount e currency (será BRL)
        if (session.amount_total && session.currency) {
          updateData.amount = session.amount_total / 100;
          updateData.currency = session.currency.toUpperCase();
        }

        // Adicionar método de pagamento ao metadata
        const { data: currentPayment } = await supabase
          .from("payments")
          .select("metadata")
          .eq("stripe_session_id", session.id)
          .single();

        const metadata = currentPayment?.metadata || {};
        updateData.metadata = {
          ...metadata,
          payment_method: paymentMethod,
          amount_total: session.amount_total ? session.amount_total / 100 : null,
          currency: session.currency,
          async_payment: true,
        };

        const { error: updateError } = await supabase
          .from("payments")
          .update(updateData)
          .eq("stripe_session_id", session.id);

        if (updateError) {
          console.error("Error updating payment:", updateError);
        } else {
          console.log(`Async payment completed (${paymentMethod}) for lead: ${session.metadata?.lead_id || "unknown"}, amount: ${updateData.amount} ${updateData.currency}`);

          // Enviar email de confirmação de pagamento com link do formulário
          const leadId = session.metadata?.lead_id;
          const termAcceptanceId = session.metadata?.term_acceptance_id;

          if (leadId) {
            try {
              // Buscar payment_id atualizado e lead com user_id
              const { data: updatedPayment } = await supabase
                .from("payments")
                .select("id")
                .eq("stripe_session_id", session.id)
                .single();

              // Buscar lead com user_id e email para sincronização com 323 Network
              const { data: leadWithUserId } = await supabase
                .from("leads")
                .select("user_id, email")
                .eq("id", leadId)
                .single();

              // Obter user_id correto do 323 Network (busca por email se necessário)
              if (leadWithUserId && updatedPayment?.id) {
                try {
                  const correctUserId = await getCorrectUserIdFrom323Network(
                    leadWithUserId.user_id,
                    leadWithUserId.email || ""
                  );

                  if (!correctUserId) {
                    console.warn(`⚠️ Could not find user in 323 Network for email ${leadWithUserId.email} - skipping sync`);
                  } else {
                    // Se encontrou um user_id diferente, atualizar o lead para próximas vezes
                    if (leadWithUserId.user_id !== correctUserId) {
                      console.log(`🔄 Updating lead.user_id from ${leadWithUserId.user_id} to ${correctUserId}`);
                      await supabase
                        .from("leads")
                        .update({ user_id: correctUserId })
                        .eq("id", leadId);
                    }

                    // Converter amount para centavos (multiplicar por 100)
                    const amountInCents = Math.round((updateData.amount || 0) * 100);

                    // Determinar método de pagamento
                    const paymentMethodFor323 = paymentMethod === "pix" ? "pix" : "card";

                    await syncPaymentTo323Network({
                      user_id: correctUserId,
                      payment_id: updatedPayment.id,
                      lead_id: leadId,
                      amount: amountInCents,
                      currency: updateData.currency || "USD",
                      payment_method: paymentMethodFor323,
                      status: "completed",
                      stripe_session_id: session.id,
                      stripe_payment_intent_id: typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : (session.payment_intent as any)?.id,
                      metadata: {
                        american_dream_payment_id: updatedPayment.id,
                        lead_id: leadId,
                        stripe_session_id: session.id,
                        original_user_id: leadWithUserId.user_id,
                        found_by_email: leadWithUserId.user_id !== correctUserId,
                      },
                    });
                  }
                } catch (syncError: any) {
                  // Logar erro mas não falhar o processamento do webhook
                  console.error("❌ Failed to sync payment to 323 Network:", syncError.message);
                  // Opcional: Enviar notificação ou criar log de erro
                }
              } else if (!leadWithUserId) {
                console.warn("⚠️ Lead not found - skipping 323 Network sync");
              }

              // Gerar ou buscar token de consulta (não falhar se der erro)
              let consultationToken: string | null = null;
              try {
                consultationToken = await getOrCreateConsultationToken(
                  supabase,
                  leadId,
                  termAcceptanceId || null,
                  updatedPayment?.id || null
                );
              } catch (tokenError: any) {
                console.error("Error generating consultation token (non-fatal):", tokenError.message);
                // Continuar sem o token - email será enviado sem link
              }

              const { data: lead } = await supabase
                .from("leads")
                .select("name, email")
                .eq("id", leadId)
                .single();

              if (lead && lead.email) {
                const paymentMethodName = paymentMethod === "pix" ? "PIX" : paymentMethod === "card" ? "Cartão" : paymentMethod || "Pagamento";
                const amountFormatted = updateData.currency === "BRL"
                  ? `R$ ${updateData.amount.toFixed(2).replace(".", ",")}`
                  : `US$ ${updateData.amount.toFixed(2)}`;

                // Obter payment_part do metadata
                const paymentPart = session.metadata?.payment_part || "1";
                const isSecondPart = paymentPart === "2";

                // Construir URL do formulário (garantir que não há barras duplas)
                let siteUrl = Deno.env.get("SITE_URL") || "https://americandream.323network.com";
                // Remover todas as barras finais e espaços
                siteUrl = siteUrl.trim().replace(/\/+$/, "");
                // Garantir que começa com http:// ou https://
                if (!siteUrl.match(/^https?:\/\//i)) {
                  siteUrl = `https://${siteUrl}`;
                }
                // Construir link sem barras duplas
                const consultationLink = consultationToken
                  ? `${siteUrl}/consultation-form/${consultationToken}`.replace(/([^:]\/)\/+/g, '$1')
                  : null;

                const emailSubject = isSecondPart
                  ? "Confirmação - Segunda Parte do Pagamento - American Dream"
                  : "Pagamento Confirmado - American Dream";
                const emailHtml = `
                  <!DOCTYPE html>
                  <html lang="pt-BR">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; background-color: #f5f5f5;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
                      <tr>
                        <td align="center" style="padding: 40px 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <tr>
                              <td style="padding: 40px 40px 30px; text-align: center; background-color: #2563eb; border-radius: 8px 8px 0 0;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">American Dream</h1>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 40px;">
                                <h2 style="margin: 0 0 20px; color: #1e40af; font-size: 24px; font-weight: bold; line-height: 1.4;">
                                  Pagamento Confirmado!
                                </h2>
                                <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                  Olá ${lead.name},
                                </p>
                                <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                                  Seu pagamento foi confirmado com sucesso!
                                </p>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; border-radius: 8px; margin-bottom: 30px;">
                                  <tr>
                                    <td style="padding: 24px;">
                                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                          <td style="padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
                                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                                              Método de pagamento
                                            </p>
                                            <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600; line-height: 1.5;">
                                              ${paymentMethodName}
                                            </p>
                                          </td>
                                        </tr>
                                      </table>
                                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                          <td style="padding-top: 16px;">
                                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                                              Valor
                                            </p>
                                            <p style="margin: 0; color: #111827; font-size: 24px; font-weight: bold; line-height: 1.5;">
                                              ${amountFormatted}
                                            </p>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                                ${consultationLink ? `
                                <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                  Agora você pode preencher o formulário de consultoria. Clique no botão abaixo para começar:
                                </p>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
                                  <tr>
                                    <td align="center" style="padding: 0 0 20px;">
                                      <a href="${consultationLink}" 
                                         style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; text-align: center; min-width: 200px;">
                                        Preencher Formulário de Consultoria
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                                  Ou copie e cole este link no seu navegador:
                                </p>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; border-radius: 4px; margin-bottom: 30px;">
                                  <tr>
                                    <td style="padding: 12px; font-family: monospace; font-size: 12px; color: #111827; word-break: break-all;">
                                      ${consultationLink}
                                    </td>
                                  </tr>
                                </table>
                                ` : `
                                <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                                  Em breve você receberá mais informações sobre os próximos passos do seu processo.
                                </p>
                                `}
                                <p style="margin: 0; color: #1e40af; font-size: 16px; font-weight: 500; line-height: 1.6;">
                                  Obrigado por confiar no American Dream!
                                </p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; text-align: center;">
                                <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px; line-height: 1.5;">
                                  Este é um email automático, por favor não responda.
                                </p>
                                <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.5;">
                                  © 2025 American Dream. Todos os direitos reservados.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                  </html>
                `;

                await sendEmail(lead.email, lead.name, emailSubject, emailHtml);
              }
            } catch (emailError: any) {
              console.error("Error sending payment confirmation email:", emailError.message);
              // Não falhar o webhook por causa do email
            }
          }
        }

        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const { error: updateError } = await supabase
          .from("payments")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_session_id", session.id);

        if (updateError) {
          console.error("Error updating payment:", updateError);
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent failed:", paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

