// @ts-ignore - JSR modules are available in Supabase edge runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore - JSR modules are available in Supabase edge runtime
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  lead_id: string;
  term_acceptance_id: string;
  session_id?: string; // Opcional: session_id do tracker
}

interface Payment {
  id: string;
  stripe_session_id: string | null;
  status: string;
  metadata?: {
    payment_method?: string;
    requested_payment_method?: string;
    [key: string]: any;
  };
  created_at?: string;
  [key: string]: any;
}

// @ts-ignore - Deno is available in edge runtime
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lead_id, term_acceptance_id, session_id }: RequestBody = await req.json();

    if (!lead_id || !term_acceptance_id) {
      return new Response(
        JSON.stringify({ error: "lead_id and term_acceptance_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client with service role
    // @ts-ignore - Deno.env is available in edge runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    // @ts-ignore - Deno.env is available in edge runtime
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("=== CHECKING PIX PAYMENT ===");
    console.log("lead_id:", lead_id);
    console.log("term_acceptance_id:", term_acceptance_id);
    console.log("session_id (from tracker):", session_id);

    let pixPayment: Payment | null = null;

    // Primeiro, tentar buscar por session_id se fornecido (mais preciso)
    if (session_id) {
      console.log("Searching by session_id:", session_id);
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("stripe_session_id", session_id)
        .eq("lead_id", lead_id)
        .eq("term_acceptance_id", term_acceptance_id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching payment by session_id:", error);
      } else if (data) {
        console.log("Found payment by session_id:", {
          id: data.id,
          status: data.status,
          payment_method: data.metadata?.payment_method,
        });
        pixPayment = data;
      }
    }

    // Se não encontrou por session_id, buscar por método PIX
    if (!pixPayment) {
      console.log("Searching by PIX method...");
      const { data: payments, error } = await supabase
        .from("payments")
        .select("*")
        .eq("lead_id", lead_id)
        .eq("term_acceptance_id", term_acceptance_id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching payments:", error);
        return new Response(
          JSON.stringify({ error: "Error fetching payments", details: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log(`Found ${payments?.length || 0} payments, filtering for PIX...`);

      // Filtrar pagamentos com método PIX
      pixPayment = payments?.find((p: Payment) => {
        const metadata = p.metadata || {};
        const isPix = metadata.payment_method === 'pix' || metadata.requested_payment_method === 'pix';
        
        if (isPix) {
          console.log("Found PIX payment:", {
            id: p.id,
            status: p.status,
            session_id: p.stripe_session_id,
            payment_method: metadata.payment_method,
            requested_payment_method: metadata.requested_payment_method,
            created_at: p.created_at,
          });
        }
        
        return isPix;
      }) || null;

      if (!pixPayment && payments && payments.length > 0) {
        console.log("No PIX payment found. Available payments:", payments.map((p: Payment) => ({
          id: p.id,
          status: p.status,
          payment_method: p.metadata?.payment_method,
          requested_payment_method: p.metadata?.requested_payment_method,
          session_id: p.stripe_session_id,
          created_at: p.created_at,
        })));
      }
    }

    if (pixPayment) {
      console.log("✅ PIX payment found:", {
        id: pixPayment.id,
        status: pixPayment.status,
        session_id: pixPayment.stripe_session_id,
      });

      return new Response(
        JSON.stringify({
          success: true,
          found: true,
          payment: {
            id: pixPayment.id,
            stripe_session_id: pixPayment.stripe_session_id,
            status: pixPayment.status,
            metadata: pixPayment.metadata,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      console.log("❌ No PIX payment found");
      return new Response(
        JSON.stringify({
          success: true,
          found: false,
          message: "No PIX payment found",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Error checking PIX payment:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

