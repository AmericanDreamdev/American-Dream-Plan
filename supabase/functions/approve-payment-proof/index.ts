import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { syncPaymentTo323Network } from "../utils/syncPaymentTo323Network.ts";
import { getCorrectUserIdFrom323Network } from "../utils/findUserIn323Network.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Função para gerar token curto mascarado
function generateShortToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "app-";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

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

    // Criar cliente para verificar autenticação do usuário
    const supabaseAuth = createClient(
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
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente com service_role para bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse do body da requisição
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { proof_id } = requestBody;

    if (!proof_id) {
      console.error("Missing proof_id in request body:", requestBody);
      return new Response(
        JSON.stringify({ error: "proof_id is required", received: requestBody }),
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

    if (proof.status !== "pending" && proof.status !== "approved") {
      return new Response(
        JSON.stringify({ error: "Proof already processed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Se já foi aprovado, verificar se já tem token. Se não, gerar um.
    if (proof.status === "approved") {
      const { data: existingTokenData } = await supabase
        .from("approval_tokens")
        .select("token, payment_id")
        .eq("payment_proof_id", proof_id)
        .single();
      
      if (existingTokenData) {
        return new Response(
          JSON.stringify({ success: true, token: existingTokenData.token, message: "Proof already approved, returning existing token" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Se não tem token, continuar para gerar um (mas não atualizar status novamente)
        console.log("Proof already approved but no token found, generating new token.");
      }
    }

    // Atualizar status do comprovante (apenas se ainda estiver pending)
    if (proof.status === "pending") {
      const { error: updateProofError } = await supabase
        .from("payment_proofs")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", proof_id);

      if (updateProofError) {
        throw updateProofError;
      }
    }

    // Garantir que existe um payment para este proof
    let paymentIdToUse = proof.payment_id;
    
    if (!paymentIdToUse) {
      // Se não tem payment_id, criar um novo payment
      console.log("Proof não tem payment_id, criando novo payment...");
      
      // Buscar payment existente por lead_id e term_acceptance_id
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("lead_id", proof.lead_id)
        .eq("term_acceptance_id", proof.term_acceptance_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (existingPayment?.id) {
        paymentIdToUse = existingPayment.id;
        console.log("Payment existente encontrado:", paymentIdToUse);
      } else {
        // Criar novo payment
        const { data: newPayment, error: createPaymentError } = await supabase
          .from("payments")
          .insert({
            lead_id: proof.lead_id,
            term_acceptance_id: proof.term_acceptance_id,
            amount: 5776.00, // Valor padrão
            currency: "BRL",
            status: "completed", // Já está aprovado, então completed
            metadata: {
              payment_method: proof.payment_method || "infinitepay",
              approved_via_proof: true,
              proof_id: proof_id,
            },
            proof_uploaded_at: proof.created_at,
          })
          .select("id")
          .single();
        
        if (createPaymentError || !newPayment) {
          console.error("Error creating payment:", createPaymentError);
          throw new Error(`Failed to create payment: ${createPaymentError?.message || "Unknown error"}`);
        }
        
        paymentIdToUse = newPayment.id;
        console.log("Novo payment criado:", paymentIdToUse);
        
        // Atualizar o proof com o payment_id criado
        await supabase
          .from("payment_proofs")
          .update({ payment_id: paymentIdToUse })
          .eq("id", proof_id);
      }
    }
    
    // Atualizar status do payment para completed
    if (paymentIdToUse) {
      const { error: updatePaymentError } = await supabase
        .from("payments")
        .update({
          status: "completed",
        })
        .eq("id", paymentIdToUse);

      if (updatePaymentError) {
        console.error("Error updating payment:", updatePaymentError);
        // Não falhar se não conseguir atualizar o payment
      } else {
        // Buscar dados do payment e lead para sincronização com 323 Network
        const { data: paymentData } = await supabase
          .from("payments")
          .select("amount, currency, lead_id, leads(user_id, email)")
          .eq("id", paymentIdToUse)
          .single();

        // Obter user_id correto do 323 Network (busca por email se necessário)
        if (paymentData && paymentData.amount) {
          try {
            const lead = paymentData.leads as any;
            const correctUserId = await getCorrectUserIdFrom323Network(
              lead?.user_id,
              lead?.email || ""
            );

            if (!correctUserId) {
              console.warn(`⚠️ Could not find user in 323 Network for email ${lead?.email} - skipping sync`);
            } else {
              // Se encontrou um user_id diferente, atualizar o lead para próximas vezes
              if (lead?.user_id !== correctUserId) {
                console.log(`🔄 Updating lead.user_id from ${lead?.user_id} to ${correctUserId}`);
                await supabase
                  .from("leads")
                  .update({ user_id: correctUserId })
                  .eq("id", proof.lead_id);
              }

              // Converter amount para centavos (multiplicar por 100)
              const amountInCents = Math.round((paymentData.amount || 0) * 100);
              
              // Mapear método de pagamento (zelle ou infinitepay -> zelle para 323 Network)
              const paymentMethodFor323 = proof.payment_method === "zelle" || proof.payment_method === "infinitepay" 
                ? "zelle" 
                : "zelle"; // Fallback para zelle
              
              await syncPaymentTo323Network({
                user_id: correctUserId,
                payment_id: paymentIdToUse,
                lead_id: proof.lead_id,
                amount: amountInCents,
                currency: paymentData.currency || "USD",
                payment_method: paymentMethodFor323,
                status: "completed",
                metadata: {
                  american_dream_payment_id: paymentIdToUse,
                  lead_id: proof.lead_id,
                  zelle_proof_id: proof_id,
                  approved_at: new Date().toISOString(),
                  original_user_id: lead?.user_id,
                  found_by_email: lead?.user_id !== correctUserId,
                },
              });
            }
          } catch (syncError: any) {
            // Logar erro mas não falhar a aprovação
            console.error("❌ Failed to sync Zelle payment to 323 Network:", syncError.message);
            // Opcional: Enviar notificação ou criar log de erro
          }
        }
      }
    }

    // Gerar token único
    let token = generateShortToken();
    let tokenExists = true;
    let attempts = 0;

    // Garantir que o token seja único
    while (tokenExists && attempts < 10) {
      const { data: existingToken } = await supabase
        .from("approval_tokens")
        .select("id")
        .eq("token", token)
        .single();

      if (!existingToken) {
        tokenExists = false;
      } else {
        token = generateShortToken();
        attempts++;
      }
    }

    if (tokenExists) {
      throw new Error("Failed to generate unique token");
    }

    // Criar registro do token (expira em 30 dias)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: tokenData, error: tokenError } = await supabase
      .from("approval_tokens")
      .insert({
        token,
        payment_proof_id: proof_id,
        lead_id: proof.lead_id,
        payment_id: paymentIdToUse, // Usar o payment_id garantido (criado ou existente)
        term_acceptance_id: proof.term_acceptance_id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (tokenError) {
      throw tokenError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        token,
        message: "Payment approved successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error approving payment proof:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

