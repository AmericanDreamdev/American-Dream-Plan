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
  consultation_form_id: string | null;
  // Segunda parcela
  is_confirmado_pago_segunda_parte: boolean;
  payment_id_segunda_parte: string | null;
  status_pagamento_segunda_parte_formatado: string | null;
  valor_segunda_parte_formatado: string | null;
  metodo_pagamento_segunda_parte_formatado: string | null;
  data_pagamento_segunda_parte_formatada: string | null;
  // Reuniões
  first_meeting: Meeting | null;
  second_meeting: Meeting | null;
  // Planejamento
  client_plan: ClientPlan | null;
}

export interface DashboardStats {
  totalLeads: number;
  totalContracts: number;
  totalPaid: number;
  totalPending: number;
  totalNotPaid: number;
  totalConsultationForms: number;
  totalPaidSecondPart: number;
  totalFirstMeetingsScheduled: number;
  totalFirstMeetingsCompleted: number;
  totalSecondMeetingsScheduled: number;
  totalSecondMeetingsCompleted: number;
  totalPlansCreated: number;
  totalPlansInProgress: number;
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

export interface RawConsultationForm {
  id: string;
  lead_id: string;
  payment_id: string | null;
  nome_completo: string;
  email: string;
  telefone: string;
  objetivo_principal: string | null;
  tipo_visto_desejado: string | null;
  created_at: string;
  lead_name?: string;
  lead_email?: string;
}

export interface Meeting {
  id: string;
  lead_id: string;
  meeting_type: 'first' | 'second';
  scheduled_date: string | null;
  completed_date: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  meeting_link: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanStep {
  step_number: number;
  title: string;
  description: string;
  responsible_partner: string;
  responsible_partners?: string[];
  estimated_duration: string;
  estimated_cost: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ClientPlan {
  id: string;
  lead_id: string;
  plan_title: string;
  plan_summary: string;
  plan_steps: PlanStep[];
  estimated_duration: string;
  estimated_investment: number;
  status: 'draft' | 'presented' | 'in_progress' | 'completed';
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  name: string;
  specialty: string;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

