import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardUser, DashboardStats, RawLead, RawTermAcceptance, RawPayment } from "@/types/dashboard";
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
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalContracts: 0,
    totalPaid: 0,
    totalPending: 0,
    totalNotPaid: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformData = (
    leadsData: RawLead[],
    termAcceptancesData: RawTermAcceptance[],
    allPaymentsData: RawPayment[]
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

      // Encontrar pagamento mais relevante
      const latestPayment = findRelevantPayment(payments, termAcceptance);

      // Determinar se é confirmado como pago
      const confirmedPago = isConfirmadoPago(latestPayment);

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
          status === '' ||
          status === null;
      }
      return false;
    }).length;

    return {
      totalLeads,
      totalContracts,
      totalPaid,
      totalPending,
      totalNotPaid,
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

      // Transformar dados
      const transformedData = transformData(
        leadsData || [],
        termAcceptancesData || [],
        allPaymentsData || []
      );

      setUsers(transformedData);

      // Calcular estatísticas
      const calculatedStats = calculateStats(transformedData);
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
    loading,
    error,
    refetch: fetchData,
  };
};

