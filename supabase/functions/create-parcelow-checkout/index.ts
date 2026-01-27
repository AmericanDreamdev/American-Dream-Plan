import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParcelowConfig {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
}

const getParcelowConfig = (isLocal: boolean): ParcelowConfig => {
    if (isLocal) {
        // Staging / Sandbox
        const clientIdRaw = Deno.env.get("PARCELOW_CLIENT_ID_STAGING");
        const clientSecretRaw = Deno.env.get("PARCELOW_CLIENT_SECRET_STAGING");
        
        const clientId = clientIdRaw?.trim() || "";
        const clientSecret = clientSecretRaw?.trim() || "";
        
        console.log("Loading STAGING config:", {
            clientIdExists: !!clientIdRaw,
            clientIdLength: clientId.length,
            clientSecretExists: !!clientSecretRaw,
            clientSecretLength: clientSecret.length,
        });
        
        if (!clientId || !clientSecret) {
            throw new Error(
                "Parcelow STAGING credentials not configured. " +
                "Please set PARCELOW_CLIENT_ID_STAGING and PARCELOW_CLIENT_SECRET_STAGING environment variables."
            );
        }
        
        return {
            baseUrl: "https://sandbox-2.parcelow.com.br",
            clientId,
            clientSecret,
        };
    }

    // Produção - Usar secrets do Supabase
    const clientIdRaw = Deno.env.get("PARCELOW_CLIENT_ID_PRODUCTION");
    const clientSecretRaw = Deno.env.get("PARCELOW_CLIENT_SECRET_PRODUCTION");
    
    const clientId = clientIdRaw?.trim() || "";
    const clientSecret = clientSecretRaw?.trim() || "";
    
    console.log("Loading PRODUCTION config:", {
        clientIdExists: !!clientIdRaw,
        clientIdLength: clientId.length,
        clientSecretExists: !!clientSecretRaw,
        clientSecretLength: clientSecret.length,
    });
    
    if (!clientId || !clientSecret) {
        throw new Error(
            "Parcelow PRODUCTION credentials not configured. " +
            "Please set PARCELOW_CLIENT_ID_PRODUCTION and PARCELOW_CLIENT_SECRET_PRODUCTION environment variables."
        );
    }
    
    return {
        baseUrl: "https://app.parcelow.com",
        clientId,
        clientSecret,
    };
};

async function getParcelowToken(config: ParcelowConfig) {
    console.log("Fetching Parcelow access token...", {
        baseUrl: config.baseUrl,
        clientIdLength: config.clientId?.length || 0,
        clientIdFirstChars: config.clientId ? config.clientId.substring(0, 5) : "MISSING",
        clientIdLastChars: config.clientId && config.clientId.length > 5 ? config.clientId.substring(config.clientId.length - 5) : "",
        clientSecretLength: config.clientSecret?.length || 0,
    });
    
    // Parcelow espera client_id como número inteiro
    // Remover espaços e tentar converter
    const clientIdTrimmed = config.clientId.trim();
    const clientIdNum = parseInt(clientIdTrimmed, 10);
    
    if (isNaN(clientIdNum)) {
        console.error("Invalid client_id format:", {
            received: clientIdTrimmed,
            length: clientIdTrimmed.length,
            firstChar: clientIdTrimmed.charAt(0),
            isNumeric: /^\d+$/.test(clientIdTrimmed),
        });
        throw new Error(`Invalid Parcelow client_id format: "${clientIdTrimmed}". Expected a numeric integer value.`);
    }
    
    // Verificar se a conversão preservou o valor original (evita casos como "123abc" -> 123)
    if (clientIdNum.toString() !== clientIdTrimmed) {
        console.error("Client ID conversion mismatch:", {
            original: clientIdTrimmed,
            converted: clientIdNum.toString(),
        });
        throw new Error(`Invalid Parcelow client_id: "${clientIdTrimmed}". Must be a valid integer without extra characters.`);
    }
    
    console.log("Using client_id as integer:", clientIdNum);
    
    const requestBody = {
        client_id: clientIdNum,
        client_secret: config.clientSecret.trim(),
        grant_type: "client_credentials",
    };
    
    console.log("Request body (sanitized):", {
        client_id: clientIdNum,
        client_secret_length: requestBody.client_secret.length,
        grant_type: "client_credentials",
    });
    
    const response = await fetch(`${config.baseUrl}/oauth/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
        console.error("Parcelow Auth Error:", errorData);
        throw new Error(`Failed to authenticate with Parcelow: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.access_token;
}

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { payment_id, currency = "USD" } = await req.json();

        if (!payment_id) {
            throw new Error("Payment ID is required");
        }

        // Detect environment
        const origin = req.headers.get("origin") || "";
        const referer = req.headers.get("referer") || "";
        const isLocal = origin.includes("localhost") || origin.includes("127.0.0.1") ||
            referer.includes("localhost") || referer.includes("127.0.0.1");

        console.log(`Environment detected: ${isLocal ? "STAGING (Localhost)" : "PRODUCTION"}`);

        const config = getParcelowConfig(isLocal);

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Fetch Payment and Lead data
        const { data: payment, error: paymentError } = await supabaseAdmin
            .from("payments")
            .select(`
        *,
        leads (*)
      `)
            .eq("id", payment_id)
            .single();

        if (paymentError || !payment) {
            throw new Error(`Payment not found: ${paymentError?.message}`);
        }

        const lead = payment.leads;
        if (!lead) {
            throw new Error("Lead data not found for this payment");
        }

        // 2. Validate CPF (document_number)
        const cpf = lead.document_number;
        if (!cpf) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "CPF_REQUIRED",
                    message: "Lead information is missing CPF (document_number)"
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        const cleanCpf = cpf.replace(/\D/g, "");
        if (cleanCpf.length !== 11) {
            throw new Error("Invalid CPF format. Must have 11 digits.");
        }

        // 3. Get Parcelow Token
        const accessToken = await getParcelowToken(config);

        // 4. Create Order in Parcelow
        console.log(`Creating Parcelow order for payment ${payment_id}...`);

        // Detectar URL base corretamente
        let siteUrl: string;
        if (isLocal) {
            // Em localhost, tentar detectar a porta do referer ou usar padrão do Vite (5173)
            const port = referer.match(/:(\d+)/)?.[1] || "5173";
            siteUrl = `http://localhost:${port}`;
        } else {
            // Em produção, usar URL configurada ou padrão
            siteUrl = Deno.env.get("SITE_URL") || "https://americandream.323network.com";
        }
        
        console.log("Using siteUrl for redirects:", siteUrl);

        // Tentar criar a order
        const attemptCreateOrder = async (email: string) => {
            const response = await fetch(`${config.baseUrl}/api/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    // Prefixo "ad-" (American Dream) para identificar que é deste sistema
                    // O webhook router usará isso para rotear corretamente
                    reference: `ad-${payment.id}`,
                    items: [{
                        reference: `ad-${payment.id}`,
                        description: "American Dream Plan Service",
                        quantity: 1,
                        amount: Math.round(payment.amount * 100), // Enviar em centavos
                    }],
                    client: {
                        name: lead.name || "Cliente",
                        email: email,
                        cpf: cleanCpf,
                    },
                    redirect: {
                        success: `${siteUrl}/payment/success?payment_id=${payment.id}&method=parcelow`,
                        failed: `${siteUrl}/payment/cancel?payment_id=${payment.id}&method=parcelow`,
                    },
                    // Usar webhook router que roteia para o sistema correto
                    // O router identifica pelo prefixo "ad-" no reference
                    notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/parcelow-webhook-router`,
                    webhook_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/parcelow-webhook-router`,
                }),
            });
            return response;
        };

        let orderResponse = await attemptCreateOrder(lead.email);
        let orderData = await orderResponse.json();

        // Lógica para tratar email duplicado conforme documentação
        if (!orderResponse.ok && orderData.message?.includes("Email do cliente existente")) {
            console.log("Duplicate email detected, attempting with alias...");
            const aliasedEmail = lead.email.replace("@", `+${Date.now()}@`);
            orderResponse = await attemptCreateOrder(aliasedEmail);
            orderData = await orderResponse.json();
        }

        if (!orderResponse.ok) {
            console.error("Parcelow Order Error:", orderData);
            throw new Error(`Failed to create Parcelow order: ${JSON.stringify(orderData)}`);
        }

        const parcelowOrder = orderData.data;

        // 5. Update Payment in Database
        const { error: updateError } = await supabaseAdmin
            .from("payments")
            .update({
                parcelow_order_id: String(parcelowOrder.order_id),
                parcelow_checkout_url: parcelowOrder.url_checkout,
                parcelow_status: "Open",
                parcelow_status_code: 0,
                metadata: {
                    ...payment.metadata,
                    parcelow_environment: isLocal ? "staging" : "production",
                    parcelow_created_at: new Date().toISOString(),
                },
            })
            .eq("id", payment_id);

        if (updateError) {
            console.error("Database update error:", updateError);
            // Não falhar por erro de update se o checkout já foi criado, mas logar
        }

        return new Response(
            JSON.stringify({
                success: true,
                checkout_url: parcelowOrder.url_checkout,
                order_id: parcelowOrder.order_id,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error) {
        console.error("Unexpected error:", error.message);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
