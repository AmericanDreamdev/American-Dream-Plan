import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase com service_role para bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { lead_id, term_acceptance_id, amount, currency, payment_method } =
      await req.json();

    if (!lead_id || !term_acceptance_id) {
      return new Response(
        JSON.stringify({ error: "lead_id and term_acceptance_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se já existe um payment
    const { data: existingPayments } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("lead_id", lead_id)
      .eq("term_acceptance_id", term_acceptance_id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingPayments && existingPayments.length > 0) {
      return new Response(
        JSON.stringify({ payment_id: existingPayments[0].id }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar novo payment
    const { data: newPayment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        lead_id,
        term_acceptance_id,
        amount: amount || 5776.00,
        currency: currency || "BRL",
        status: "pending",
        metadata: {
          payment_method: payment_method || "infinitepay",
          infinitepay_url:
            "https://loja.infinitepay.io/brantimmigration/hea9241-american-dream",
        },
        proof_uploaded_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (paymentError) {
      console.error("Error creating payment:", paymentError);
      return new Response(
        JSON.stringify({ error: paymentError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ payment_id: newPayment.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

