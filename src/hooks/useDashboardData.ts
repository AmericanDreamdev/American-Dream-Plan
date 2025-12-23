import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardUser, DashboardStats, RawLead, RawTermAcceptance, RawPayment, RawConsultationForm, Meeting, ClientPlan } from "@/types/dashboard";
import {
  formatDate,
  formatValue,
  calcMinutes,
  getPdfTimestamp,
  isBrazilianPhone,
  getPaymentMethod,
  getStatusPagamento,
  getStatusGeral,
  isConfirmadoPago,
  findRelevantPayment,
} from "@/utils/dashboard";

interface UseDashboardDataReturn {
  users: DashboardUser[];
  stats: DashboardStats;
  consultationForms: RawConsultationForm[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [consultationForms, setConsultationForms] = useState<RawConsultationForm[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalContracts: 0,
    totalPaid: 0,
    totalPending: 0,
    totalNotPaid: 0,
    totalConsultationForms: 0,
    totalPaidSecondPart: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformData = (
    leadsData: RawLead[],
    termAcceptancesData: RawTermAcceptance[],
    allPaymentsData: RawPayment[],
    consultationForms: RawConsultationForm[],
    meetingsData: Meeting[],
    clientPlansData: ClientPlan[]
  ): DashboardUser[] => {
    // Combinar os dados manualmente
    const leadsWithData = leadsData.map((lead) => {
      // Encontrar term_acceptance relacionado (pegar o mais recente)
      const termAcceptances = termAcceptancesData.filter((ta) => ta.lead_id === lead.id) || [];
      const termAcceptance = termAcceptances.length > 0
        ? termAcceptances.sort((a, b) =>
          new Date(b.accepted_at || b.created_at || 0).getTime() -
          new Date(a.accepted_at || a.created_at || 0).getTime()
        )[0]
        : null;

      // Encontrar TODOS os pagamentos do lead
      const payments = allPaymentsData.filter((p) => p.lead_id === lead.id) || [];

      return {
        ...lead,
        term_acceptance: termAcceptance,
        payments: payments,
      };
    });

    // Transformar os dados para o formato esperado
    return leadsWithData.map((lead: any) => {
      const termAcceptance: RawTermAcceptance | null = lead.term_acceptance;
      const payments: RawPayment[] = lead.payments || [];

      // Filtrar pagamentos para a primeira parcela (excluir explicitamente parte 2)
      const paymentsPart1 = payments.filter((p) => {
        const metadata = p.metadata || {};
        return metadata.payment_part !== 2 && metadata.payment_part !== '2';
      });

      // Encontrar pagamento mais relevante (primeira parcela)
      const latestPayment = findRelevantPayment(paymentsPart1, termAcceptance);

      // Encontrar pagamento da segunda parcela (payment_part: 2)
      const secondPartPayments = payments.filter((p) => {
        const metadata = p.metadata || {};
        return metadata.payment_part === 2 || metadata.payment_part === '2';
      });
      const secondPartPayment = secondPartPayments.length > 0
        ? secondPartPayments.sort((a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )[0]
        : null;

      // Encontrar formulário de consulta mais recente para este lead
      const consultationForm = consultationForms
        .filter((form) => form.lead_id === lead.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;

      // Encontrar reuniões do lead
      const firstMeeting = meetingsData?.find(m =>
        m.lead_id === lead.id && m.meeting_type === 'first'
      ) || null;

      const secondMeeting = meetingsData?.find(m =>
        m.lead_id === lead.id && m.meeting_type === 'second'
      ) || null;

      // Encontrar plano do lead
      const clientPlan = clientPlansData?.find(p =>
        p.lead_id === lead.id
      ) || null;

      // Determinar se é confirmado como pago (primeira parcela)
      const confirmedPago = isConfirmadoPago(latestPayment);

      // Determinar se é confirmado como pago (segunda parcela)
      const confirmedPagoSegundaParte = isConfirmadoPago(secondPartPayment);

      // Data de geração do PDF (para brasileiros)
      const pdfGeneratedAt = termAcceptance?.pdf_url && isBrazilianPhone(lead.phone)
        ? getPdfTimestamp(termAcceptance.pdf_url)
        : null;
      const pdfGeneratedAtFormatted = pdfGeneratedAt
        ? formatDate(pdfGeneratedAt.toISOString())
        : null;

      return {
        lead_id: lead.id,
        nome_completo: lead.name,
        email: lead.email,
        telefone: lead.phone,
        data_formulario_formatada: formatDate(lead.created_at) || '',
        term_acceptance_id: termAcceptance?.id || null,
        data_aceitacao_formatada: formatDate(termAcceptance?.accepted_at || null) || null,
        aceitou_contrato: termAcceptance ? 'Sim' : 'Não',
        url_contrato_pdf: termAcceptance?.pdf_url || null,
        payment_id: latestPayment?.id || null,
        status_pagamento_formatado: getStatusPagamento(latestPayment?.status || null, latestPayment),
        valor_formatado: formatValue(latestPayment?.amount || null, latestPayment?.currency || null),
        metodo_pagamento_formatado: getPaymentMethod(latestPayment, lead),
        status_geral: getStatusGeral(lead.status_geral, termAcceptance, latestPayment),
        minutos_formulario_para_contrato: termAcceptance
          ? calcMinutes(termAcceptance.accepted_at || null, lead.created_at)
          : null,
        minutos_contrato_para_pagamento: latestPayment && termAcceptance
          ? calcMinutes(latestPayment.created_at, termAcceptance.accepted_at || null)
          : null,
        // Informações adicionais mais concretas
        data_pagamento_formatada: latestPayment ? formatDate(latestPayment.created_at) : null,
        stripe_session_id: latestPayment?.stripe_session_id || null,
        stripe_payment_intent_id: latestPayment?.stripe_payment_intent_id || null,
        infinitepay_url: latestPayment?.metadata?.infinitepay_url || null,
        payment_metadata: latestPayment?.metadata || null,
        payment_created_at: latestPayment?.created_at || null,
        payment_updated_at: latestPayment?.updated_at || null,
        is_confirmado_pago: confirmedPago,
        pdf_generated_at_formatted: pdfGeneratedAtFormatted,
        is_brazilian: isBrazilianPhone(lead.phone),
        consultation_form_id: consultationForm?.id || null,
        // Reuniões
        first_meeting: firstMeeting,
        second_meeting: secondMeeting,
        // Planejamento
        client_plan: clientPlan,
        // Segunda parcela
        is_confirmado_pago_segunda_parte: confirmedPagoSegundaParte,
        payment_id_segunda_parte: secondPartPayment?.id || null,
        status_pagamento_segunda_parte_formatado: secondPartPayment
          ? getStatusPagamento(secondPartPayment.status || null, secondPartPayment)
          : null,
        valor_segunda_parte_formatado: secondPartPayment
          ? formatValue(secondPartPayment.amount || null, secondPartPayment.currency || null)
          : null,
        metodo_pagamento_segunda_parte_formatado: secondPartPayment
          ? getPaymentMethod(secondPartPayment, lead)
          : null,
        data_pagamento_segunda_parte_formatada: secondPartPayment
          ? formatDate(secondPartPayment.created_at)
          : null,
      };
    });
  };

  const calculateStats = (transformedData: DashboardUser[]): DashboardStats => {
    const totalLeads = transformedData.length;
    const totalContracts = transformedData.filter((u) => u.aceitou_contrato === 'Sim').length;

    // PAGOS: apenas os que estão CONFIRMADOS como pagos
    const paidUsers = transformedData.filter((u) => u.is_confirmado_pago === true);
    const totalPaid = paidUsers.length;

    // PENDENTES
    const totalPending = transformedData.filter((u) =>
      u.status_pagamento_formatado === 'Pendente' ||
      u.status_pagamento_formatado === 'Pendente (Stripe)' ||
      u.status_pagamento_formatado === 'Pendente (InfinitePay)'
    ).length;

    // NÃO PAGARAM
    const totalNotPaid = transformedData.filter((u) => {
      const status = u.status_pagamento_formatado || '';
      if (!u.is_confirmado_pago) {
        return status === 'Não pagou' ||
          status === 'Redirecionado (InfinitePay)' ||
          status === 'Redirecionado (Zelle)' ||
          status === '' ||
          status === null;
      }
      return false;
    }).length;

    // PAGOS SEGUNDA PARCELA: apenas os que estão CONFIRMADOS como pagos na segunda parcela
    const paidSecondPartUsers = transformedData.filter((u) => u.is_confirmado_pago_segunda_parte === true);
    const totalPaidSecondPart = paidSecondPartUsers.length;

    // ESTATÍSTICAS DE REUNIÕES
    const totalFirstMeetingsScheduled = transformedData.filter((u) =>
      u.first_meeting?.status === 'scheduled'
    ).length;

    const totalFirstMeetingsCompleted = transformedData.filter((u) =>
      u.first_meeting?.status === 'completed'
    ).length;

    const totalSecondMeetingsScheduled = transformedData.filter((u) =>
      u.second_meeting?.status === 'scheduled'
    ).length;

    const totalSecondMeetingsCompleted = transformedData.filter((u) =>
      u.second_meeting?.status === 'completed'
    ).length;

    // ESTATÍSTICAS DE PLANEJAMENTOS
    const totalPlansCreated = transformedData.filter((u) =>
      u.client_plan !== null
    ).length;

    const totalPlansInProgress = transformedData.filter((u) =>
      u.client_plan?.status === 'in_progress'
    ).length;

    return {
      totalLeads,
      totalContracts,
      totalPaid,
      totalPending,
      totalNotPaid,
      totalConsultationForms: 0, // Will be updated in fetchData
      totalPaidSecondPart,
      totalFirstMeetingsScheduled,
      totalFirstMeetingsCompleted,
      totalSecondMeetingsScheduled,
      totalSecondMeetingsCompleted,
      totalPlansCreated,
      totalPlansInProgress,
    };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Buscar todos os leads
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select(`
          id,
          name,
          email,
          phone,
          country_code,
          created_at,
          status_geral
        `)
        .order("created_at", { ascending: false });

      if (leadsError) throw leadsError;

      // 2. Buscar todos os term_acceptance
      const { data: termAcceptancesData, error: taError } = await supabase
        .from("term_acceptance")
        .select("*")
        .order("accepted_at", { ascending: false });

      if (taError) {
        console.error("Erro ao buscar term_acceptance:", taError);
        throw taError;
      }

      // 3. Buscar TODOS os pagamentos
      const { data: allPaymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      // 4. Buscar formulários de consultoria
      const { data: consultationFormsData, error: consultationFormsError } = await supabase
        .from("consultation_forms")
        .select(`
          id,
          lead_id,
          payment_id,
          nome_completo,
          email,
          telefone,
          objetivo_principal,
          tipo_visto_desejado,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (consultationFormsError) {
        console.error("Erro ao buscar consultation_forms:", consultationFormsError);
        // Não falhar, apenas logar o erro
      }

      // 5. Buscar reuniões
      const { data: meetingsData, error: meetingsError } = await supabase
        .from("meetings")
        .select("*")
        .order("created_at", { ascending: false });

      if (meetingsError) {
        console.error("Erro ao buscar meetings:", meetingsError);
        // Não falhar, apenas logar o erro
      }

      // 6. Buscar planejamentos de clientes
      const { data: clientPlansData, error: clientPlansError } = await supabase
        .from("client_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (clientPlansError) {
        console.error("Erro ao buscar client_plans:", clientPlansError);
        // Não falhar, apenas logar o erro
      }

      // Enriquecer formulários com dados do lead
      const enrichedForms = (consultationFormsData || []).map((form) => {
        const lead = leadsData?.find((l) => l.id === form.lead_id);
        return {
          ...form,
          lead_name: lead?.name,
          lead_email: lead?.email,
        };
      }) as RawConsultationForm[];

      setConsultationForms(enrichedForms);

      // Transformar dados
      const transformedData = transformData(
        leadsData || [],
        termAcceptancesData || [],
        allPaymentsData || [],
        enrichedForms,
        meetingsData || [],
        clientPlansData || []
      );

      setUsers(transformedData);

      // Calcular estatísticas
      const calculatedStats = calculateStats(transformedData);
      calculatedStats.totalConsultationForms = enrichedForms.length;
      setStats(calculatedStats);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    users,
    stats,
    consultationForms,
    loading,
    error,
    refetch: fetchData,
  };
};

