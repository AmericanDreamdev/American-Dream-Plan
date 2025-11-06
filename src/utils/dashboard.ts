import { DashboardUser, RawLead, RawTermAcceptance, RawPayment } from "@/types/dashboard";

/**
 * Formata uma data para o formato brasileiro
 */
export const formatDate = (date: string | null): string | null => {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Formata um valor monetário
 */
export const formatValue = (amount: number | null, currency: string | null): string | null => {
  if (!amount || !currency) return null;
  if (currency === 'USD') return `US$ ${amount.toFixed(2)}`;
  if (currency === 'BRL') return `R$ ${amount.toFixed(2)}`;
  return `${amount.toFixed(2)} ${currency}`;
};

/**
 * Calcula a diferença em minutos entre duas datas
 */
export const calcMinutes = (date1: string | null, date2: string | null): number | null => {
  if (!date1 || !date2) return null;
  const diff = new Date(date1).getTime() - new Date(date2).getTime();
  return Math.round((diff / 1000 / 60) * 100) / 100;
};

/**
 * Extrai timestamp do PDF URL (formato: nome_YYYYMMDD_timestamp.pdf)
 */
export const getPdfTimestamp = (pdfUrl: string | null): Date | null => {
  if (!pdfUrl) return null;
  try {
    const match = pdfUrl.match(/_(\d{8})_(\d{13})\.pdf/);
    if (match && match[2]) {
      const timestamp = parseInt(match[2], 10);
      // Verificar se é um timestamp válido (entre 2000 e 2100)
      if (timestamp > 946684800000 && timestamp < 4102444800000) {
        return new Date(timestamp);
      }
    }
  } catch (err) {
    console.error("Error extracting PDF timestamp:", err);
  }
  return null;
};

/**
 * Verifica se é telefone brasileiro
 */
export const isBrazilianPhone = (phone: string | null): boolean => {
  if (!phone) return false;
  const normalizedPhone = phone.trim();
  return normalizedPhone.startsWith('+55') || normalizedPhone.startsWith('55 ');
};

/**
 * Determina o método de pagamento baseado no payment e lead
 */
export const getPaymentMethod = (payment: RawPayment | null, lead: RawLead): string | null => {
  if (!payment) return null;
  
  const metadata = payment.metadata || {};
  
  // 1. Verificar status do payment primeiro
  if (payment.status === 'redirected_to_infinitepay') {
    return 'InfinitePay';
  }
  
  if (payment.status === 'redirected_to_zelle') {
    return 'Zelle';
  }
  
  // 2. Verificar metadata do payment
  if (metadata.payment_method) {
    const method = metadata.payment_method;
    if (method === 'card') return 'Cartão de Crédito';
    if (method === 'pix') return 'PIX';
    if (method === 'zelle') return 'Zelle';
    if (method === 'infinitepay') return 'InfinitePay';
    return method;
  }
  
  // 3. Verificar requested_payment_method
  if (metadata.requested_payment_method) {
    const method = metadata.requested_payment_method;
    if (method === 'pix') return 'PIX';
    if (method === 'card') return 'Cartão de Crédito';
  }
  
  // 4. Verificar se é brasileiro e foi para InfinitePay
  const isBrazilian = lead?.country_code === 'BR' || 
                    lead?.country_code === '+55' ||
                    lead?.phone?.startsWith('+55') ||
                    lead?.phone?.startsWith('55');
  
  if (isBrazilian && payment.status === 'pending') {
    if (metadata.infinitepay_url) {
      return 'InfinitePay';
    }
    if (payment.currency === 'BRL') {
      return 'InfinitePay';
    }
  }
  
  // 5. Verificar checkout_url do Stripe
  if (metadata.checkout_url && metadata.checkout_url.includes('stripe.com')) {
    return 'Cartão de Crédito';
  }
  
  return null;
};

/**
 * Obtém o status de pagamento formatado
 */
export const getStatusPagamento = (status: string | null, payment: RawPayment | null): string => {
  // Se não tem payment, retornar "Não pagou"
  if (!payment) {
    return 'Não pagou';
  }
  
  // Se tem payment mas não tem status, usar o status do payment
  const actualStatus = status || payment.status || null;
  
  if (!actualStatus) {
    return 'Não pagou';
  }
  
  // Pagamentos CONFIRMADOS
  if (actualStatus === 'completed') {
    const method = payment?.metadata?.payment_method || payment?.metadata?.requested_payment_method;
    const result = method === 'pix' ? 'Pago (PIX)' : method === 'card' ? 'Pago (Cartão)' : 'Pago (Stripe)';
    return result;
  }
  if (actualStatus === 'zelle_confirmed') {
    return 'Pago (Zelle)';
  }
  
  // IMPORTANTE: redirected_to_infinitepay significa APENAS que foi redirecionado
  if (actualStatus === 'redirected_to_infinitepay') {
    const metadata = payment?.metadata || {};
    if (metadata.infinitepay_confirmed === true || metadata.infinitepay_paid === true) {
      return 'Pago (InfinitePay)';
    }
    return 'Redirecionado (InfinitePay)';
  }
  
  // IMPORTANTE: redirected_to_zelle significa APENAS que foi redirecionado
  if (actualStatus === 'redirected_to_zelle') {
    const metadata = payment?.metadata || {};
    if (metadata.zelle_confirmed === true || metadata.zelle_paid === true) {
      return 'Pago (Zelle)';
    }
    return 'Redirecionado (Zelle)';
  }
  
  // Pagamentos PENDENTES
  if (actualStatus === 'pending') {
    const metadata = payment?.metadata || {};
    if (metadata.checkout_url || metadata.stripe_session_id) {
      return 'Pendente (Stripe)';
    }
    if (metadata.infinitepay_url) {
      return 'Pendente (InfinitePay)';
    }
    return 'Pendente';
  }
  
  return actualStatus;
};

/**
 * Obtém o status geral (usa do banco ou calcula como fallback)
 */
export const getStatusGeral = (
  leadStatusGeral: string | null,
  termAcceptance: RawTermAcceptance | null,
  latestPayment: RawPayment | null
): string => {
  // Usar status_geral do banco de dados (calculado via triggers/funções)
  if (leadStatusGeral) {
    return leadStatusGeral;
  }
  
  // Fallback: calcular se não tiver no banco
  const isConfirmadoPago = latestPayment && (
    latestPayment.status === 'completed' || 
    latestPayment.status === 'zelle_confirmed' ||
    (latestPayment.status === 'redirected_to_infinitepay' && 
     (latestPayment.metadata?.infinitepay_confirmed === true || 
      latestPayment.metadata?.infinitepay_paid === true)) ||
    (latestPayment.status === 'redirected_to_zelle' && 
     (latestPayment.metadata?.zelle_confirmed === true || 
      latestPayment.metadata?.zelle_paid === true))
  );
  
  if (termAcceptance && isConfirmadoPago) {
    return 'Completo (Contrato + Pagamento)';
  }
  
  if (termAcceptance && latestPayment?.status === 'pending') {
    const metadata = latestPayment.metadata || {};
    if (metadata.infinitepay_url) {
      return 'Contrato Aceito (Iniciou Pagamento InfinitePay - Aguardando)';
    }
    if (metadata.checkout_url || latestPayment.stripe_session_id) {
      return 'Contrato Aceito (Iniciou Pagamento Stripe - Aguardando)';
    }
    return 'Contrato Aceito (Iniciou Pagamento - Aguardando)';
  }
  
  if (termAcceptance && latestPayment?.status === 'redirected_to_infinitepay' && !isConfirmadoPago) {
    return 'Contrato Aceito (Foi para InfinitePay - Aguardando Confirmação)';
  }
  
  if (termAcceptance && latestPayment?.status === 'redirected_to_zelle' && !isConfirmadoPago) {
    return 'Contrato Aceito (Foi para Zelle - Aguardando Confirmação)';
  }
  
  if (termAcceptance && !latestPayment) {
    return 'Contrato Aceito (Não iniciou pagamento)';
  }
  
  if (!termAcceptance) {
    return 'Apenas Formulário (Sem Contrato)';
  }
  
  return 'Status Desconhecido';
};

/**
 * Determina se o pagamento está confirmado como pago
 */
export const isConfirmadoPago = (payment: RawPayment | null): boolean => {
  if (!payment) return false;
  
  if (payment.status === 'completed' || payment.status === 'zelle_confirmed') {
    return true;
  }
  
  if (payment.status === 'redirected_to_infinitepay') {
    const metadata = payment.metadata || {};
    return metadata.infinitepay_confirmed === true || metadata.infinitepay_paid === true;
  }
  
  if (payment.status === 'redirected_to_zelle') {
    const metadata = payment.metadata || {};
    return metadata.zelle_confirmed === true || metadata.zelle_paid === true;
  }
  
  return false;
};

/**
 * Encontra o pagamento mais relevante para um lead
 */
export const findRelevantPayment = (
  payments: RawPayment[],
  termAcceptance: RawTermAcceptance | null
): RawPayment | null => {
  if (!payments || payments.length === 0) return null;
  
  const paidStatuses = ['completed', 'zelle_confirmed', 'redirected_to_infinitepay', 'redirected_to_zelle'];
  
  // PASSO 1: Buscar TODOS os pagamentos completos
  const allCompletedPayments = payments.filter((p) => 
    p.status && paidStatuses.includes(p.status)
  );
  
  // PASSO 2: Se tem term_acceptance, filtrar por ele
  let relevantCompletedPayment = null;
  if (termAcceptance && allCompletedPayments.length > 0) {
    // Primeiro tenta encontrar com term_acceptance_id correspondente
    relevantCompletedPayment = allCompletedPayments.find((p) => 
      p.term_acceptance_id === termAcceptance.id
    );
    
    // Se não encontrou, pega qualquer pagamento completo
    if (!relevantCompletedPayment && allCompletedPayments.length > 0) {
      relevantCompletedPayment = allCompletedPayments.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )[0];
    }
  } else if (allCompletedPayments.length > 0) {
    // Se não tem term_acceptance, pega o mais recente completo
    relevantCompletedPayment = allCompletedPayments.sort((a, b) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )[0];
  }
  
  // PASSO 3: Se não encontrou pagamento completo, buscar pendentes
  const relevantPendingPayments = payments.filter((p) => {
    if (!termAcceptance) return p.status === 'pending' || !p.status;
    return (p.status === 'pending' || !p.status) && 
           (p.term_acceptance_id === termAcceptance.id || !p.term_acceptance_id);
  });
  
  const latestPending = relevantPendingPayments.sort((a, b) => 
    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  )[0] || null;
  
  // RESULTADO FINAL: Prioriza pagamento completo sobre pendente
  return relevantCompletedPayment || latestPending;
};

