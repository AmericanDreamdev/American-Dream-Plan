import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Função para gerar token curto e mascarado
function generateShortToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const prefix = "app-";
  let token = prefix;
  for (let i = 0; i < 9; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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

    const { lead_id, term_acceptance_id } = await req.json();

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: "lead_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!term_acceptance_id) {
      return new Response(
        JSON.stringify({ error: "term_acceptance_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o lead existe
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, name, email")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o term_acceptance_id pertence ao lead_id (segurança)
    const { data: termAcceptance, error: termError } = await supabase
      .from("term_acceptance")
      .select("id, lead_id")
      .eq("id", term_acceptance_id)
      .eq("lead_id", lead_id)
      .single();

    if (termError || !termAcceptance) {
      return new Response(
        JSON.stringify({ error: "Term acceptance not found or does not belong to this lead" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se já existe token válido para este lead_id e term_acceptance_id
    const { data: existingToken } = await supabase
      .from("approval_tokens")
      .select("token, expires_at, used_at")
      .eq("lead_id", lead_id)
      .eq("term_acceptance_id", term_acceptance_id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingToken) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          token: existingToken.token,
          link: `/consultation-form/${existingToken.token}`,
          message: "Existing valid token returned"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar novo token
    let token = generateShortToken();
    let tokenExists = true;
    let attempts = 0;
    
    // Garantir que o token é único
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
      return new Response(
        JSON.stringify({ error: "Failed to generate unique token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar token com expiração de 30 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: newToken, error: tokenError } = await supabase
      .from("approval_tokens")
      .insert({
        token,
        lead_id,
        term_acceptance_id,
        payment_id: null,
        payment_proof_id: null,
        expires_at: expiresAt.toISOString(),
        used_at: null,
      })
      .select("token")
      .single();

    if (tokenError) {
      console.error("Error creating token:", tokenError);
      return new Response(
        JSON.stringify({ error: tokenError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construir path relativo do link (o frontend construirá a URL completa)
    const consultationLink = `/consultation-form/${newToken.token}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        token: newToken.token,
        link: consultationLink,
        expires_at: expiresAt.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-consultation-link-with-acceptance function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

