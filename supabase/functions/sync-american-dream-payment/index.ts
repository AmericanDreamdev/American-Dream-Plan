import { createClient } from "npm:@supabase/supabase-js@^2.39.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Edge Function para sincronizar pagamentos do American Dream com o 323 Network
 * 
 * Esta função deve ser chamada pelo American Dream quando um pagamento é confirmado
 * (seja via Stripe webhook, Zelle manual, ou qualquer outro método)
 * 
 * Payload esperado:
 * {
 *   user_id: string (UUID do usuário no 323 Network - obtido via SSO) OU
 *   email: string (Email do usuário - usado como fallback se user_id não corresponder)
 *   payment_id: string (ID do pagamento no American Dream)
 *   lead_id: string (ID do lead no American Dream - opcional)
 *   amount: number (valor em centavos)
 *   currency: string (ex: 'USD', 'BRL')
 *   payment_method: 'card' | 'pix' | 'zelle'
 *   status: 'completed' | 'pending' | 'failed'
 *   stripe_session_id?: string (se pagamento via Stripe)
 *   stripe_payment_intent_id?: string (se pagamento via Stripe)
 *   metadata?: object (dados adicionais)
 * }
 * 
 * Nota: Se user_id não corresponder a um usuário no 323 Network, a função tentará
 * buscar pelo email automaticamente.
 */
Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Validar autenticação (token do American Dream ou chave de API)
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        // 2. Setup Supabase (323 Network)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 3. Validar token (pode ser token JWT compartilhado ou API key)
        // Por enquanto, vamos usar uma API key compartilhada ou validar o token JWT
        const token = authHeader.replace('Bearer ', '')

        // Verificar se é uma API key compartilhada ou token JWT válido
        // Para produção, você deve configurar uma API key compartilhada
        const sharedApiKey = Deno.env.get('AMERICAN_DREAM_SHARED_API_KEY')
        if (sharedApiKey && token !== sharedApiKey) {
            throw new Error('Invalid API key')
        }

        // 4. Obter dados do pagamento
        const body = await req.json()
        const {
            user_id,
            payment_id,
            lead_id,
            email, // Email opcional para busca alternativa
            amount,
            currency = 'USD',
            payment_method,
            status,
            stripe_session_id,
            stripe_payment_intent_id,
            metadata = {}
        } = body

        // Validações obrigatórias
        if ((!user_id && !email) || !payment_id || !amount || !payment_method || !status) {
            throw new Error('Missing required fields: (user_id or email), payment_id, amount, payment_method, status')
        }

        // 5. Verificar se o usuário existe no 323 Network
        let user
        let finalUserId = user_id

        if (user_id) {
            // Tentar buscar pelo user_id primeiro
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id)

            if (userError || !userData) {
                // Se não encontrou pelo user_id e tem email, tentar pelo email
                if (email) {
                    console.log(`User ${user_id} not found. Searching by email: ${email}`)
                    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

                    if (!listError && users) {
                        const userByEmail = users.find(u => u.email === email)
                        if (userByEmail) {
                            user = userByEmail
                            finalUserId = userByEmail.id
                            console.log(`User found by email. Correct user_id: ${finalUserId}`)
                        } else {
                            throw new Error(`User not found in 323 Network by user_id (${user_id}) or email (${email})`)
                        }
                    } else {
                        throw new Error(`User not found in 323 Network: ${user_id}. Error searching by email: ${listError?.message}`)
                    }
                } else {
                    throw new Error(`User not found in 323 Network: ${user_id}. Email not provided for alternative search.`)
                }
            } else {
                user = userData
            }
        } else if (email) {
            // Se não tem user_id, buscar apenas pelo email
            console.log(`No user_id provided. Searching by email: ${email}`)
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

            if (listError || !users) {
                throw new Error(`Error searching user by email: ${listError?.message || 'No users found'}`)
            }

            const userByEmail = users.find(u => u.email === email)
            if (!userByEmail) {
                throw new Error(`User not found in 323 Network by email: ${email}`)
            }

            user = userByEmail
            finalUserId = userByEmail.id
            console.log(`User found by email. user_id: ${finalUserId}`)
        } else {
            throw new Error('Either user_id or email must be provided')
        }

        if (!user) {
            throw new Error('User not found in 323 Network')
        }

        // 6. Buscar ou criar serviço "American Dream"
        let americanDreamService
        const { data: existingService } = await supabase
            .from('services')
            .select('id')
            .or('nome_pt.eq.American Dream,nome_en.eq.American Dream')
            .single()

        if (existingService) {
            americanDreamService = existingService
        } else {
            // Criar serviço se não existir
            const { data: newService, error: serviceError } = await supabase
                .from('services')
                .insert({
                    nome_pt: 'American Dream',
                    nome_en: 'American Dream',
                    descricao_pt: 'Programa American Dream - Consultoria e planejamento para realização do sonho americano',
                    descricao_en: 'American Dream Program - Consulting and planning to achieve the American dream',
                    categoria: 'mentoring',
                    ativo: true,
                    destaque: true
                })
                .select('id')
                .single()

            if (serviceError) {
                throw new Error(`Failed to create American Dream service: ${serviceError.message}`)
            }
            americanDreamService = newService
        }

        // 7. Verificar se já existe um pagamento com este external_payment_id
        const { data: existingPayment } = await supabase
            .from('service_payments')
            .select('id, status')
            .eq('external_payment_id', payment_id)
            .single()

        if (existingPayment) {
            // Atualizar pagamento existente se o status mudou
            if (existingPayment.status !== status) {
                const { error: updateError } = await supabase
                    .from('service_payments')
                    .update({
                        status: status,
                        updated_at: new Date().toISOString(),
                        ...(stripe_session_id && { stripe_session_id }),
                        ...(stripe_payment_intent_id && { stripe_payment_intent_id }),
                        metadata: {
                            ...metadata,
                            last_sync: new Date().toISOString()
                        }
                    })
                    .eq('id', existingPayment.id)

                if (updateError) {
                    throw new Error(`Failed to update payment: ${updateError.message}`)
                }

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: 'Payment updated',
                        payment_id: existingPayment.id,
                        status: 'updated'
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Payment already exists',
                    payment_id: existingPayment.id,
                    status: 'exists'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 8. Criar service_request (opcional, mas necessário para aparecer em Meus Serviços)
        let serviceRequestId = null
        if (status === 'completed') {
            const { data: serviceRequest, error: requestError } = await supabase
                .from('service_requests')
                .insert({
                    service_id: americanDreamService.id,
                    user_id: finalUserId,
                    status: 'pendente',
                    mensagem: `Pagamento American Dream - ${payment_method.toUpperCase()}${lead_id ? ` (Lead: ${lead_id})` : ''}`
                })
                .select('id')
                .single()

            if (requestError) {
                console.error('Error creating service request:', requestError)
                // Não falhar se não conseguir criar service_request
            } else {
                serviceRequestId = serviceRequest.id
            }
        }

        // 9. Criar service_payment
        const { data: payment, error: paymentError } = await supabase
            .from('service_payments')
            .insert({
                service_id: americanDreamService.id,
                user_id: finalUserId,
                service_request_id: serviceRequestId,
                amount: amount,
                currency: currency,
                payment_method: payment_method,
                status: status,
                source: 'american_dream',
                external_payment_id: payment_id,
                external_lead_id: lead_id || null,
                stripe_session_id: stripe_session_id || null,
                stripe_payment_intent_id: stripe_payment_intent_id || null,
                metadata: {
                    ...metadata,
                    source: 'american_dream',
                    synced_at: new Date().toISOString(),
                    original_user_id: user_id, // Manter referência ao user_id original enviado
                    found_by_email: user_id !== finalUserId // Flag indicando que foi encontrado por email
                }
            })
            .select('id')
            .single()

        if (paymentError) {
            throw new Error(`Failed to create payment: ${paymentError.message}`)
        }

        // 10. Criar notificação para o usuário (se pagamento concluído)
        if (status === 'completed') {
            await supabase.from('notifications').insert({
                user_id: finalUserId,
                type: 'payment_success',
                title: 'Pagamento American Dream confirmado!',
                content: `Seu pagamento via ${payment_method.toUpperCase()} foi confirmado. O serviço já está disponível em "Meus Serviços".`,
                metadata: {
                    source: 'american_dream',
                    payment_id: payment.id,
                    external_payment_id: payment_id
                }
            })
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Payment synced successfully',
                payment_id: payment.id,
                service_request_id: serviceRequestId,
                status: 'created'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Sync payment error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})

