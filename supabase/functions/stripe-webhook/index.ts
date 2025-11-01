import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^17.3.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

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

    // Obter o corpo da requisição e o signature header
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "No signature provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        stripeWebhookSecret
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
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
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
          expand: ['charges.data.payment_method'],
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
      } catch (err) {
        console.error("Error retrieving payment intent:", err);
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

