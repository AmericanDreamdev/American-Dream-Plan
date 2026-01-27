import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ParcelowWebhookEvent {
    event: string
    timestamp: string
    order: {
        id: number
        reference: string
        status: number
        status_text: string
        status_public: string
        order_amount: number
        total_usd: number
        total_brl: number
        installments?: number
        order_date: string
        payments?: Array<{
            total_brl: string
            installments: number
            status: number
            payment_method: string
        }>
        client: {
            name: string
            email: string
            cpf: string
            phone?: string
        }
        items?: Array<{
            reference: string
            description: string
            quantity: number
            amount: number
        }>
    }
}

async function processWebhookEvent(event: ParcelowWebhookEvent, supabase: any) {
    const parcelowOrder = event.order

    // Validar estrutura do payload
    if (!parcelowOrder || !parcelowOrder.id) {
        console.error('[Parcelow Webhook] ❌ Invalid payload structure:', JSON.stringify(event, null, 2))
        throw new Error('Invalid webhook payload: missing order.id')
    }

    console.log(`[Parcelow Webhook] Processing event: ${event.event}, Order ID: ${parcelowOrder.id}`)

    // Buscar payment por parcelow_order_id
    const { data: payment, error: paymentError } = await supabase
        .from('service_payments')
        .select('*')
        .eq('parcelow_order_id', String(parcelowOrder.id))
        .single()

    if (paymentError || !payment) {
        console.error(`[Parcelow Webhook] ❌ Payment not found for Parcelow order ${parcelowOrder.id}`)
        throw new Error(`Order not found for Parcelow order ${parcelowOrder.id}`)
    }

    console.log(`[Parcelow Webhook] ✅ Found payment: ${payment.id}`)

    // Mapear evento para status
    let newStatus = payment.status

    switch (event.event) {
        case 'event_order_paid':
            newStatus = 'completed'
            break
        case 'event_order_declined':
        case 'event_order_canceled':
        case 'event_order_expired':
            newStatus = 'failed'
            break
        case 'event_order_waiting':
        case 'event_order_waiting_payment':
        case 'event_order_waiting_docs':
            newStatus = 'pending'
            break
        case 'event_order_confirmed':
            // Manter status atual, apenas atualizar metadata
            break
    }

    // Atualizar payment
    const updateData: any = {
        status: newStatus,
        parcelow_status: parcelowOrder.status_text,
        parcelow_status_code: parcelowOrder.status,
        metadata: {
            ...payment.metadata,
            parcelow_order_id: parcelowOrder.id,
            parcelow_event: event.event,
            parcelow_updated_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
    }

    // Se pagamento completado, adicionar detalhes
    if (newStatus === 'completed' && parcelowOrder.payments && parcelowOrder.payments.length > 0) {
        const totalBrlCents = Math.round(parseFloat(parcelowOrder.payments[0].total_brl) * 100)

        updateData.metadata = {
            ...updateData.metadata,
            installments: parcelowOrder.payments[0].installments,
            total_usd: parcelowOrder.total_usd,
            total_brl: totalBrlCents, // Convertido para centavos
            completed_at: new Date().toISOString()
        }
    }

    const { error: updateError } = await supabase
        .from('service_payments')
        .update(updateData)
        .eq('id', payment.id)

    if (updateError) {
        console.error('[Parcelow Webhook] ❌ Failed to update payment:', updateError)
        throw updateError
    }

    console.log(`[Parcelow Webhook] ✅ Updated payment to status: ${newStatus}`)

    // Se houver service_request_id, atualizar também
    if (payment.service_request_id) {
        if (newStatus === 'completed') {
            await supabase
                .from('service_requests')
                .update({ payment_required: false })
                .eq('id', payment.service_request_id)

            console.log('[Parcelow Webhook] ✅ Updated service_request payment_required to false')
        }
    }

    // Se houver program_id, processar matrícula
    if (payment.program_id && newStatus === 'completed') {
        console.log(`[Parcelow Webhook] Processing program enrollment for program: ${payment.program_id}`)

        // 1. Criar/Atualizar Matrícula
        const { data: enrollment, error: enrollError } = await supabase
            .from('program_enrollments')
            .upsert({
                program_id: payment.program_id,
                user_id: payment.user_id,
                status: 'active',
                payment_status: 'paid',
                payment_amount: payment.amount,
                payment_currency: payment.currency,
                payment_method: 'parcelow',
                payment_id: payment.id,
                paid_at: new Date().toISOString(),
                enrolled_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'program_id,user_id'
            })
            .select()
            .single()

        if (enrollError) {
            console.error('[Parcelow Webhook] ❌ Error updating enrollment:', enrollError)
        } else {
            console.log(`[Parcelow Webhook] ✅ Enrollment ${enrollment.id} activated`)

            // 2. Incrementar contador de alunos
            await supabase.rpc('increment_program_students', { program_id: payment.program_id })

            // 3. Notificação In-App
            await supabase.from('notifications').insert({
                user_id: payment.user_id,
                type: 'program_enrolled',
                title: 'Enrollment confirmed!',
                content: 'Your access to the program via Parcelow has been granted. Enjoy your studies!',
                metadata: {
                    program_id: payment.program_id,
                    enrollment_id: enrollment.id,
                    payment_id: payment.id
                }
            })

            // 4. Enrollment contract is handled automatically by the database trigger
            // 'trigger_enrollment_contract_pdf' on the 'program_enrollments' table.
            console.log('[Parcelow Webhook] ✅ Enrollment contract will be generated by DB trigger')

        }
    }

    // Registrar em admin_logs para auditoria
    await supabase
        .from('admin_logs')
        .insert({
            action: 'parcelow_webhook_processed',
            user_id: payment.user_id,
            metadata: {
                event: event.event,
                parcelow_order_id: parcelowOrder.id,
                payment_id: payment.id,
                status: newStatus
            }
        })

    console.log('[Parcelow Webhook] ✅ Logged to admin_logs')

    return { success: true, payment_id: payment.id, status: newStatus }
}

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Verificar se há corpo na requisição
        if (!req.body) {
            throw new Error('Request body is empty')
        }

        const webhookEvent: ParcelowWebhookEvent = await req.json()

        console.log(`[Parcelow Webhook] Received event: ${webhookEvent.event}`)

        // Inicializar Supabase (sem JWT pois é webhook externo)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Processar evento
        const result = await processWebhookEvent(webhookEvent, supabaseClient)

        return new Response(
            JSON.stringify(result),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('[Parcelow Webhook] ❌ Error:', error.message)

        // Retornar 200 para que Parcelow não faça retry infinito
        // mas logar o erro internamente
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200 // Importante: 200 para evitar retries desnecessários
            }
        )
    }
})
