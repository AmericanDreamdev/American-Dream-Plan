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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
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

    // Verificar autenticação
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

    const { lead_id, term_acceptance_id, payment_id } = await req.json();

    if (!lead_id || !term_acceptance_id) {
      return new Response(
        JSON.stringify({ error: "lead_id and term_acceptance_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se já existe token válido para este lead_id e term_acceptance_id
    const { data: existingToken } = await supabase
      .from("approval_tokens")
      .select("token, expires_at, used_at")
      .eq("lead_id", lead_id)
      .eq("term_acceptance_id", term_acceptance_id)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingToken) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          token: existingToken.token,
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
        payment_id: payment_id || null, // payment_id é opcional
        payment_proof_id: null, // payment_proof_id é opcional agora
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        token: newToken.token,
        expires_at: expiresAt.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-consultation-link function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

