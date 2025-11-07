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
    const emailEndpoint = "http://212.1.213.163:3000/send-smtp";
    
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error sending email:", response.status, errorText);
      return false;
    }

    console.log("✅ Email sent successfully to:", to);
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

    // Log para debug (remover em produção se necessário)
    console.log("Webhook received - Signature present:", !!signature);
    console.log("Webhook secret configured:", !!stripeWebhookSecret);
    console.log("Body length:", body.length);

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
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message);
      console.error("Error details:", {
        signatureLength: signature?.length,
        webhookSecretLength: stripeWebhookSecret?.length,
        webhookSecretPrefix: stripeWebhookSecret?.substring(0, 7) + "...",
        bodyLength: body.length,
        bodyIsString: typeof body === "string",
        bodyPreview: body.substring(0, 200),
        errorType: err.type,
        errorCode: err.code,
      });
      
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
                  <h1>Pagamento Confirmado!</h1>
                  <p>Olá ${lead.name},</p>
                  <p>Seu pagamento foi confirmado com sucesso!</p>
                  <p><strong>Método de pagamento:</strong> ${paymentMethodName}</p>
                  <p><strong>Valor:</strong> ${amountFormatted}</p>
                  <p>Obrigado por confiar no American Dream!</p>
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
                  <h1>Pagamento Confirmado!</h1>
                  <p>Olá ${lead.name},</p>
                  <p>Seu pagamento foi confirmado com sucesso!</p>
                  <p><strong>Método de pagamento:</strong> ${paymentMethodName}</p>
                  <p><strong>Valor:</strong> ${amountFormatted}</p>
                  <p>Obrigado por confiar no American Dream!</p>
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

