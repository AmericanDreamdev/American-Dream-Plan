import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^17.3.1";

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

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error("Stripe keys not configured");
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    // IMPORTANTE: Obter o corpo da requisição como RAW TEXT (não parseado)
    // O Stripe precisa do corpo exato como recebido para verificar a assinatura
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
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

    // Verificar webhook signature
    // NOTA: O body DEVE ser o texto raw exatamente como recebido do Stripe
    let event: Stripe.Event;
    try {
      // Log detalhado antes da verificação
      console.log("Attempting webhook signature verification...", {
        signatureLength: signature?.length,
        webhookSecretLength: stripeWebhookSecret?.length,
        webhookSecretPrefix: stripeWebhookSecret?.substring(0, 7) + "...",
        bodyLength: body.length,
        bodyIsString: typeof body === "string",
        bodyFirstChars: body.substring(0, 50),
      });

      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        stripeWebhookSecret
      );
      console.log("✅ Webhook signature verified successfully. Event type:", event.type, "Event ID:", event.id);
      
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
      console.error("❌ Webhook signature verification failed:", err.message);
      
      // Log detalhado do erro
      const errorDetails = {
        signatureLength: signature?.length,
        webhookSecretLength: stripeWebhookSecret?.length,
        webhookSecretPrefix: stripeWebhookSecret?.substring(0, 7) + "...",
        bodyLength: body.length,
        bodyIsString: typeof body === "string",
        bodyPreview: body.substring(0, 200),
        errorType: err.type,
        errorCode: err.code,
        eventId: eventId,
        eventType: eventType,
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
      
      // Se o erro for de assinatura, pode ser que o webhook secret esteja errado
      // ou que o corpo tenha sido modificado
      return new Response(
        JSON.stringify({ 
          error: `Webhook Error: ${err.message}`,
          hint: "Check if STRIPE_WEBHOOK_SECRET is correct. Make sure you're using the webhook secret from Stripe Dashboard > Webhooks > Your endpoint > Signing secret. The secret should start with 'whsec_'",
          troubleshooting: [
            "1. Go to Stripe Dashboard > Webhooks > Your endpoint",
            "2. Click on 'Reveal' to see the signing secret",
            "3. Copy the secret (starts with 'whsec_')",
            "4. Update STRIPE_WEBHOOK_SECRET in Supabase Edge Function environment variables",
            "5. Redeploy the edge function"
          ]
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Função auxiliar para obter método de pagamento do PaymentIntent
    const getPaymentMethod = async (paymentIntentId: string | null): Promise<string | null> => {
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
        console.error("Error retrieving payment intent:", err.message || err);
        // Não falhar o webhook por causa disso, apenas logar o erro
      }
      return null;
    };

    // Processar eventos
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Obter método de pagamento (geralmente cartão para pagamentos síncronos)
        const paymentMethod = await getPaymentMethod(session.payment_intent as string);

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
          
          // Enviar email de confirmação de pagamento
          const leadId = session.metadata?.lead_id;
          if (leadId) {
            try {
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

                const emailSubject = "Pagamento Confirmado - American Dream";
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
                                <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                                  Em breve você receberá mais informações sobre os próximos passos do seu processo.
                                </p>
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

        // Para pagamentos assíncronos, geralmente é PIX
        const paymentMethod = await getPaymentMethod(session.payment_intent as string) || "pix";

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
          
          // Enviar email de confirmação de pagamento
          const leadId = session.metadata?.lead_id;
          if (leadId) {
            try {
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

                const emailSubject = "Pagamento Confirmado - American Dream";
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
                                <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                                  Em breve você receberá mais informações sobre os próximos passos do seu processo.
                                </p>
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

