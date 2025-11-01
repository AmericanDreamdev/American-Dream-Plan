-- =====================================================
-- QUERY COMPLETA - DETALHES DE CADA USUÁRIO
-- =====================================================
-- Esta query mostra TODOS os detalhes de cada usuário:
-- - Dados do formulário (nome, email, telefone, data)
-- - Se aceitou contrato e quando (data, IP, navegador, PDF)
-- - Status do pagamento (pago, pendente, não pagou)
-- - Método de pagamento usado (Stripe Card, PIX, Zelle, InfinitePay)
-- - Valores pagos (em USD ou BRL)
-- - Resumo geral do status do usuário
-- =====================================================

SELECT 
    -- ========== DADOS DO LEAD (FORMULÁRIO) ==========
    l.id as lead_id,
    l.name as nome_completo,
    l.email as email,
    l.phone as telefone,
    l.created_at as data_formulario,
    TO_CHAR(l.created_at, 'DD/MM/YYYY HH24:MI:SS') as data_formulario_formatada,
    
    -- ========== DADOS DO CONTRATO ==========
    ta.id as term_acceptance_id,
    ta.accepted_at as data_aceitacao_contrato,
    TO_CHAR(ta.accepted_at, 'DD/MM/YYYY HH24:MI:SS') as data_aceitacao_formatada,
    ta.ip_address as ip_aceitacao,
    ta.user_agent as navegador_aceitacao,
    CASE 
        WHEN ta.id IS NOT NULL THEN 'Sim' 
        ELSE 'Não' 
    END as aceitou_contrato,
    ta.pdf_url as url_contrato_pdf,
    
    -- ========== DADOS DO PAGAMENTO ==========
    p.id as payment_id,
    p.status as status_pagamento,
    CASE 
        WHEN p.status = 'completed' THEN 'Pago (Stripe)'
        WHEN p.status = 'zelle_confirmed' THEN 'Pago (Zelle)'
        WHEN p.status = 'redirected_to_infinitepay' THEN 'Redirecionado (InfinitePay)'
        WHEN p.status = 'pending' THEN 'Pendente'
        WHEN p.status IS NULL THEN 'Não pagou'
        ELSE p.status
    END as status_pagamento_formatado,
    p.amount as valor_pagamento,
    p.currency as moeda,
    CASE 
        WHEN p.currency = 'USD' AND p.amount IS NOT NULL THEN 'US$ ' || ROUND(p.amount::numeric, 2)::text
        WHEN p.currency = 'BRL' AND p.amount IS NOT NULL THEN 'R$ ' || ROUND(p.amount::numeric, 2)::text
        WHEN p.amount IS NOT NULL THEN ROUND(p.amount::numeric, 2)::text || ' ' || p.currency
        ELSE NULL
    END as valor_formatado,
    (p.metadata->>'payment_method')::text as metodo_pagamento,
    CASE 
        WHEN (p.metadata->>'payment_method')::text = 'card' THEN 'Cartão de Crédito'
        WHEN (p.metadata->>'payment_method')::text = 'pix' THEN 'PIX'
        WHEN (p.metadata->>'payment_method')::text = 'zelle' THEN 'Zelle'
        WHEN (p.metadata->>'payment_method')::text = 'infinitepay' THEN 'InfinitePay'
        ELSE (p.metadata->>'payment_method')::text
    END as metodo_pagamento_formatado,
    p.stripe_session_id as stripe_session_id,
    p.stripe_payment_intent_id as stripe_payment_intent_id,
    p.created_at as data_criacao_pagamento,
    TO_CHAR(p.created_at, 'DD/MM/YYYY HH24:MI:SS') as data_criacao_pagamento_formatada,
    p.updated_at as data_atualizacao_pagamento,
    TO_CHAR(p.updated_at, 'DD/MM/YYYY HH24:MI:SS') as data_atualizacao_pagamento_formatada,
    
    -- ========== RESUMO FINAL ==========
    CASE 
        WHEN ta.id IS NOT NULL AND p.status IN ('completed', 'zelle_confirmed', 'redirected_to_infinitepay') THEN 'Completo (Contrato + Pagamento)'
        WHEN ta.id IS NOT NULL AND p.status = 'pending' THEN 'Contrato Aceito (Pagamento Pendente)'
        WHEN ta.id IS NOT NULL AND p.status IS NULL THEN 'Contrato Aceito (Sem Pagamento)'
        WHEN ta.id IS NULL THEN 'Apenas Formulário (Sem Contrato)'
        ELSE 'Status Desconhecido'
    END as status_geral,
    
    -- ========== TEMPO ENTRE ETAPAS (em minutos) ==========
    CASE 
        WHEN ta.accepted_at IS NOT NULL AND l.created_at IS NOT NULL 
        THEN ROUND(EXTRACT(EPOCH FROM (ta.accepted_at - l.created_at)) / 60, 2)
        ELSE NULL
    END as minutos_formulario_para_contrato,
    
    CASE 
        WHEN p.created_at IS NOT NULL AND ta.accepted_at IS NOT NULL 
        THEN ROUND(EXTRACT(EPOCH FROM (p.created_at - ta.accepted_at)) / 60, 2)
        ELSE NULL
    END as minutos_contrato_para_pagamento
    
FROM leads l
LEFT JOIN term_acceptance ta ON ta.lead_id = l.id
LEFT JOIN LATERAL (
    SELECT *
    FROM payments
    WHERE payments.lead_id = l.id 
        AND (payments.term_acceptance_id = ta.id OR (ta.id IS NULL AND payments.term_acceptance_id IS NULL))
    ORDER BY payments.created_at DESC
    LIMIT 1
) p ON true
ORDER BY l.created_at DESC;
