import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Webhook Router para Parcelow
 * 
 * Este router recebe webhooks do Parcelow e roteia para o sistema correto:
 * - Tenta encontrar o pagamento no banco do American Dream primeiro
 * - Se não encontrar, roteia para o webhook do 323 Network
 * 
 * Estratégia: Como o Parcelow pode ignorar o prefixo "ad-" no reference,
 * verificamos diretamente no banco de dados qual sistema possui o pagamento.
 */
Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        console.log("Parcelow Webhook Router received:", JSON.stringify(body));

        const event = body.event;
        const parcelowOrder = body.order;

        if (!parcelowOrder || !parcelowOrder.id) {
            throw new Error("Invalid webhook payload: missing order.id");
        }

        const parcelowOrderId = String(parcelowOrder.id);
        const reference = parcelowOrder.reference || "";
        
        console.log("Routing decision:", {
            reference,
            parcelowOrderId,
        });

        // Tentar identificar o sistema verificando no banco do American Dream primeiro
        const isAmericanDream = await checkIfAmericanDreamPayment(parcelowOrderId, reference);
        
        console.log("System identification:", {
            isAmericanDream,
            parcelowOrderId,
            reference,
        });

        if (isAmericanDream) {
            // Processar no American Dream
            console.log("Routing to American Dream webhook");
            return await processAmericanDreamWebhook(body, parcelowOrder);
        } else {
            // Rotear para o 323 Network
            console.log("Routing to 323 Network webhook");
            return await routeTo323Network(body);
        }

    } catch (error: any) {
        console.error("Webhook Router Error:", error.message);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});

/**
 * Verifica se o pagamento pertence ao American Dream
 * Tenta buscar o pagamento no banco do American Dream usando parcelow_order_id ou reference
 */
async function checkIfAmericanDreamPayment(parcelowOrderId: string, reference: string): Promise<boolean> {
    const AMERICAN_DREAM_SUPABASE_URL = Deno.env.get("AMERICAN_DREAM_SUPABASE_URL") || 
        "https://xwgdvpicgsjeyqejanwa.supabase.co";
    const AMERICAN_DREAM_SERVICE_ROLE_KEY = Deno.env.get("AMERICAN_DREAM_SERVICE_ROLE_KEY");
    
    if (!AMERICAN_DREAM_SERVICE_ROLE_KEY) {
        console.warn("AMERICAN_DREAM_SERVICE_ROLE_KEY not configured, falling back to reference check");
        // Fallback: verificar pelo reference se tiver prefixo "ad-"
        return reference.startsWith("ad-");
    }

    try {
        const supabaseAmericanDream = createClient(
            AMERICAN_DREAM_SUPABASE_URL,
            AMERICAN_DREAM_SERVICE_ROLE_KEY
        );

        // Tentar buscar por parcelow_order_id primeiro
        const { data: payment, error } = await supabaseAmericanDream
            .from("payments")
            .select("id")
            .eq("parcelow_order_id", parcelowOrderId)
            .maybeSingle();

        if (payment && !error) {
            console.log("Found payment in American Dream by parcelow_order_id:", payment.id);
            return true;
        }

        // Se não encontrou por parcelow_order_id, tentar por reference (removendo prefixo se existir)
        if (reference) {
            const paymentId = reference.startsWith("ad-") ? reference.replace(/^ad-/, "") : reference;
            
            const { data: paymentByRef, error: refError } = await supabaseAmericanDream
                .from("payments")
                .select("id")
                .eq("id", paymentId)
                .maybeSingle();

            if (paymentByRef && !refError) {
                console.log("Found payment in American Dream by reference:", paymentByRef.id);
                return true;
            }
        }

        console.log("Payment not found in American Dream, routing to 323 Network");
        return false;
    } catch (error: any) {
        console.error("Error checking American Dream payment:", error.message);
        // Em caso de erro, usar fallback do reference
        return reference.startsWith("ad-");
    }
}

/**
 * Processa webhook no American Dream - roteia para o webhook do American Dream
 */
async function processAmericanDreamWebhook(body: any, parcelowOrder: any) {
    console.log("Routing to American Dream webhook:", {
        reference: parcelowOrder.reference || "",
        event: body.event,
        parcelowOrderId: parcelowOrder.id,
    });

    // URL do webhook do American Dream
    const AMERICAN_DREAM_WEBHOOK_URL = Deno.env.get("AMERICAN_DREAM_WEBHOOK_URL") || 
        "https://xwgdvpicgsjeyqejanwa.supabase.co/functions/v1/parcelow-webhook";

    console.log("Forwarding webhook to American Dream:", AMERICAN_DREAM_WEBHOOK_URL);

    try {
        const response = await fetch(AMERICAN_DREAM_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const responseData = await response.json().catch(() => ({ message: "No JSON response" }));

        if (!response.ok) {
            console.error("American Dream webhook error:", responseData);
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: `American Dream webhook failed: ${response.status}`,
                    details: responseData 
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
            );
        }

        console.log("American Dream webhook processed successfully");
        return new Response(
            JSON.stringify({ success: true, routed_to: "american-dream", response: responseData }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
    } catch (error: any) {
        console.error("Error routing to American Dream:", error.message);
        return new Response(
            JSON.stringify({ success: false, error: `Failed to route to American Dream: ${error.message}` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
}

/**
 * Roteia webhook para o 323 Network
 */
async function routeTo323Network(body: any) {
    const URL_323_NETWORK = Deno.env.get("URL_323_NETWORK") || "https://pgdvbanwumqjmqeybqnw.supabase.co";
    const webhookUrl = `${URL_323_NETWORK}/functions/v1/parcelow-webhook`;

    console.log("Forwarding webhook to 323 Network:", webhookUrl);

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const responseData = await response.json().catch(() => ({ message: "No JSON response" }));

        if (!response.ok) {
            console.error("323 Network webhook error:", responseData);
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: `323 Network webhook failed: ${response.status}`,
                    details: responseData 
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
            );
        }

        console.log("323 Network webhook processed successfully");
        return new Response(
            JSON.stringify({ success: true, routed_to: "323-network", response: responseData }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
    } catch (error: any) {
        console.error("Error routing to 323 Network:", error.message);
        return new Response(
            JSON.stringify({ success: false, error: `Failed to route to 323 Network: ${error.message}` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
}

