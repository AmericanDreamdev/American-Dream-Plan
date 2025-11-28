import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^17.3.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  session_id: string;
}

// Função auxiliar para obter método de pagamento do PaymentIntent
const getPaymentMethod = async (stripe: Stripe, paymentIntentId: string | null): Promise<string | null> => {
  if (!paymentIntentId) return null;
  
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['charges'],
    });
    
    if (paymentIntent.charges?.data?.length > 0) {
      const charge = paymentIntent.charges.data[0];
      if (charge.payment_method_details?.type) {
        const methodType = charge.payment_method_details.type;
        return methodType === "pix" ? "pix" : methodType === "card" ? "card" : methodType;
      }
    }
    
    if (paymentIntent.payment_method_types?.length > 0) {
      const methodType = paymentIntent.payment_method_types[0];
      return methodType === "pix" ? "pix" : methodType === "card" ? "card" : methodType;
    }
  } catch (err: any) {
    console.error("Error retrieving payment intent:", err.message || err);
  }
  return null;
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { session_id }: RequestBody = await req.json();

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "session_id is required" }),
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

    // Initialize Stripe
    // Prioridade: STRIPE_SECRET_KEY_TEST > STRIPE_SECRET_KEY
    let stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY_TEST");
    if (!stripeSecretKey) {
      stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    }
    
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

    console.log("=== VERIFYING STRIPE SESSION ===");
    console.log("Session ID:", session_id);

    // Buscar sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent'],
    });

    console.log("Stripe session status:", session.payment_status);
    console.log("Stripe session status (detailed):", {
      payment_status: session.payment_status,
      status: session.status,
      payment_intent: session.payment_intent,
    });

    // Buscar pagamento no banco de dados
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("stripe_session_id", session_id)
      .maybeSingle();

    if (paymentError) {
      console.error("Error fetching payment:", paymentError);
      return new Response(
        JSON.stringify({ error: "Error fetching payment from database" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!payment) {
      return new Response(
        JSON.stringify({ error: "Payment not found in database" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Database payment status:", payment.status);

    // Verificar se o pagamento está completo no Stripe mas pendente no banco
    const isCompletedInStripe = session.payment_status === "paid" || session.status === "complete";
    const isPendingInDatabase = payment.status === "pending";

    if (isCompletedInStripe && isPendingInDatabase) {
      console.log("⚠️ Payment is completed in Stripe but pending in database. Updating...");

      // Obter método de pagamento
      const paymentMethod = await getPaymentMethod(stripe, session.payment_intent as string);

      // Preparar update
      const updateData: any = {
        status: "completed",
        stripe_payment_intent_id: session.payment_intent as string,
        updated_at: new Date().toISOString(),
      };

      // Atualizar amount e currency se disponíveis
      if (session.amount_total && session.currency) {
        updateData.amount = session.amount_total / 100;
        updateData.currency = session.currency.toUpperCase();
      }

      // Adicionar método de pagamento ao metadata
      if (paymentMethod) {
        const metadata = payment.metadata || {};
        updateData.metadata = {
          ...metadata,
          payment_method: paymentMethod,
          amount_total: session.amount_total ? session.amount_total / 100 : null,
          currency: session.currency,
          verified_via_stripe: true, // Marcar que foi verificado diretamente no Stripe
        };
      }

      // Atualizar no banco de dados
      const { error: updateError } = await supabase
        .from("payments")
        .update(updateData)
        .eq("stripe_session_id", session_id);

      if (updateError) {
        console.error("Error updating payment:", updateError);
        return new Response(
          JSON.stringify({ 
            error: "Error updating payment status",
            details: updateError.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("✅ Payment status updated to completed");

      return new Response(
        JSON.stringify({
          success: true,
          updated: true,
          payment_status: "completed",
          stripe_payment_status: session.payment_status,
          payment_method: paymentMethod,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Se já está completo em ambos ou não precisa atualizar
    return new Response(
      JSON.stringify({
        success: true,
        updated: false,
        payment_status: payment.status,
        stripe_payment_status: session.payment_status,
        message: isCompletedInStripe 
          ? "Payment already completed in both Stripe and database"
          : "Payment is pending in Stripe",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error verifying stripe session:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

