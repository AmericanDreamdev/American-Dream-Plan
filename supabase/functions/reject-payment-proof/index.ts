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
    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verificar se o usuário está autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { proof_id, reason } = await req.json();

    if (!proof_id) {
      return new Response(
        JSON.stringify({ error: "proof_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar o comprovante
    const { data: proof, error: proofError } = await supabase
      .from("payment_proofs")
      .select("*")
      .eq("id", proof_id)
      .single();

    if (proofError || !proof) {
      return new Response(
        JSON.stringify({ error: "Proof not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (proof.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Proof already processed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atualizar status do comprovante
    const { error: updateProofError } = await supabase
      .from("payment_proofs")
      .update({
        status: "rejected",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: reason || null,
      })
      .eq("id", proof_id);

    if (updateProofError) {
      throw updateProofError;
    }

    // Opcional: marcar payment como failed
    if (proof.payment_id) {
      const { error: updatePaymentError } = await supabase
        .from("payments")
        .update({
          status: "failed",
        })
        .eq("id", proof.payment_id);

      if (updatePaymentError) {
        console.error("Error updating payment:", updatePaymentError);
        // Não falhar se não conseguir atualizar o payment
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment rejected successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error rejecting payment proof:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

