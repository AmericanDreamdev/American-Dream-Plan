import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        console.log("Parcelow Webhook received:", JSON.stringify(body));

        const event = body.event;
        const parcelowOrder = body.order;

        if (!parcelowOrder || !parcelowOrder.id) {
            throw new Error("Invalid webhook payload: missing order.id");
        }

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Find payment by parcelow_order_id
        const { data: payment, error: fetchError } = await supabaseAdmin
            .from("payments")
            .select("*")
            .eq("parcelow_order_id", String(parcelowOrder.id))
            .single();

        if (fetchError || !payment) {
            // Tentar por referência se não achou por ID (fallback)
            const reference = parcelowOrder.reference || "";
            
            // Se reference começa com "ad-", remover prefixo antes de buscar
            const paymentId = reference.startsWith("ad-") ? reference.replace(/^ad-/, "") : reference;
            
            if (paymentId) {
                const { data: paymentRef, error: fetchRefError } = await supabaseAdmin
                    .from("payments")
                    .select("*")
                    .eq("id", paymentId)
                    .single();

                if (fetchRefError || !paymentRef) {
                    console.error(`Order not found for Parcelow order ${parcelowOrder.id} and reference ${reference} (payment_id: ${paymentId})`);
                    return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
                }
                // Usar este pagamento
                return processPaymentUpdate(paymentRef, event, parcelowOrder, supabaseAdmin);
            }

            console.error(`Order not found for Parcelow order ${parcelowOrder.id}`);
            return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
        }

        return processPaymentUpdate(payment, event, parcelowOrder, supabaseAdmin);

    } catch (error) {
        console.error("Webhook Error:", error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
    }
});

async function processPaymentUpdate(payment: any, event: string, parcelowOrder: any, supabase: any) {
    let newStatus = payment.status;

    // Mapping Parcelow events to internal status
    // event_order_paid, event_order_declined, event_order_canceled, event_order_expired, event_order_waiting, etc.
    switch (event) {
        case 'event_order_paid':
            newStatus = 'paid';
            break;
        case 'event_order_declined':
        case 'event_order_canceled':
        case 'event_order_expired':
            newStatus = 'failed';
            break;
        case 'event_order_waiting':
        case 'event_order_waiting_payment':
        case 'event_order_waiting_docs':
            newStatus = 'pending';
            break;
    }

    console.log(`Updating payment ${payment.id} to status: ${newStatus} (Parcelow Event: ${event})`);

    const updateData: any = {
        status: newStatus,
        parcelow_status: parcelowOrder.status_text,
        parcelow_status_code: parcelowOrder.status,
        metadata: {
            ...payment.metadata,
            parcelow_event: event,
            parcelow_updated_at: new Date().toISOString(),
            installments: parcelowOrder.payments?.[0]?.installments,
            total_brl: parcelowOrder.payments?.[0]?.total_brl,
        },
        updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", payment.id);

    if (updateError) {
        throw new Error(`Failed to update payment: ${updateError.message}`);
    }

    // Se houver lógica adicional pós-pagamento (ex: liberar conteúdo), adicionar aqui.

    return new Response(JSON.stringify({ success: true, payment_id: payment.id, status: newStatus }), { status: 200 });
}
