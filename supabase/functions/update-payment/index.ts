import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UpdatePaymentRequest {
  payment_id?: string;
  lead_id: string;
  term_acceptance_id?: string;
  status: string;
  amount?: number;
  currency?: string;
  metadata?: any;
  created_at?: string;
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
        JSON.stringify({ error: "Authorization header required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    // Verificar se o usuário está autenticado usando o service_role client
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: UpdatePaymentRequest = await req.json();

    if (!body.lead_id) {
      return new Response(
        JSON.stringify({ error: "lead_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Preparar dados de atualização
    const updateData: any = {
      status: body.status,
      updated_at: new Date().toISOString(),
    };

    if (body.amount !== undefined && body.amount !== null) {
      updateData.amount = body.amount;
    }

    if (body.currency) {
      updateData.currency = body.currency.toUpperCase();
    }

    if (body.metadata) {
      // Mesclar metadata existente com novo
      if (body.payment_id) {
        const { data: existingPayment } = await supabaseAdmin
          .from("payments")
          .select("metadata")
          .eq("id", body.payment_id)
          .single();

        updateData.metadata = {
          ...(existingPayment?.metadata || {}),
          ...body.metadata,
        };
      } else {
        updateData.metadata = body.metadata;
      }
    }

    if (body.created_at) {
      updateData.created_at = body.created_at;
    }

    // Se já existe um payment_id, atualizar
    if (body.payment_id) {
      const { data, error: updateError } = await supabaseAdmin
        .from("payments")
        .update(updateData)
        .eq("id", body.payment_id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating payment:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, payment: data }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      // Criar novo pagamento
      if (!body.term_acceptance_id) {
        return new Response(
          JSON.stringify({ error: "term_acceptance_id is required to create a new payment" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const insertData: any = {
        lead_id: body.lead_id,
        term_acceptance_id: body.term_acceptance_id,
        status: body.status,
        amount: body.amount || 0,
        currency: body.currency?.toUpperCase() || "USD",
        metadata: body.metadata || {},
      };

      if (body.created_at) {
        insertData.created_at = body.created_at;
      }

      const { data, error: insertError } = await supabaseAdmin
        .from("payments")
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error("Error creating payment:", insertError);
        return new Response(
          JSON.stringify({ error: insertError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, payment: data }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in update-payment function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

