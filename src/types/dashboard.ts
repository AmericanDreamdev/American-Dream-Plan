export interface DashboardUser {
  lead_id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  data_formulario_formatada: string;
  term_acceptance_id: string | null;
  data_aceitacao_formatada: string | null;
  aceitou_contrato: string;
  url_contrato_pdf: string | null;
  payment_id: string | null;
  status_pagamento_formatado: string;
  valor_formatado: string | null;
  metodo_pagamento_formatado: string | null;
  status_geral: string;
  minutos_formulario_para_contrato: number | null;
  minutos_contrato_para_pagamento: number | null;
  // Informações adicionais mais concretas
  data_pagamento_formatada: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  infinitepay_url: string | null;
  payment_metadata: any;
  payment_created_at: string | null;
  payment_updated_at: string | null;
  is_confirmado_pago: boolean;
  pdf_generated_at_formatted: string | null;
  is_brazilian: boolean;
}

export interface DashboardStats {
  totalLeads: number;
  totalContracts: number;
  totalPaid: number;
  totalPending: number;
  totalNotPaid: number;
}

export interface RawLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  country_code: string | null;
  created_at: string;
  status_geral: string | null;
}

export interface RawTermAcceptance {
  id: string;
  lead_id: string;
  term_id: string;
  accepted_at: string | null;
  pdf_url: string | null;
  created_at: string;
}

export interface RawPayment {
  id: string;
  lead_id: string;
  term_acceptance_id: string | null;
  status: string | null;
  amount: number;
  currency: string | null;
  metadata: any;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string | null;
}

