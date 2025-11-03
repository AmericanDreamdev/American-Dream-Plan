import { useMemo } from "react";
import { DashboardUser, DashboardStats } from "@/types/dashboard";

interface UseDashboardFiltersProps {
  users: DashboardUser[];
  searchTerm: string;
  activeTab: string;
  stats: DashboardStats;
}

interface UseDashboardFiltersReturn {
  filteredUsers: DashboardUser[];
  filteredStats: {
    total: number;
    paid: number;
    pending: number;
    notPaid: number;
  };
}

export const useDashboardFilters = ({
  users,
  searchTerm,
  activeTab,
  stats,
}: UseDashboardFiltersProps): UseDashboardFiltersReturn => {
  // Filtrar usuários baseado na busca e tab ativo
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filtro de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.nome_completo.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          user.telefone.toLowerCase().includes(search)
      );
    }

    // Filtro por tab
    if (activeTab === "paid") {
      // Apenas os que estão confirmados como pagos
      filtered = filtered.filter((user) => user.is_confirmado_pago === true);
    } else if (activeTab === "pending") {
      filtered = filtered.filter((user) => user.status_pagamento_formatado === "Pendente");
    } else if (activeTab === "not-paid") {
      // Não pagaram: não pagou OU redirecionado sem confirmação
      filtered = filtered.filter((user) => {
        const status = user.status_pagamento_formatado || '';
        return !user.is_confirmado_pago && (
          status === "Não pagou" ||
          status === "Redirecionado (InfinitePay)" ||
          status === ''
        );
      });
    }

    return filtered;
  }, [users, searchTerm, activeTab]);

  // Calcular estatísticas filtradas
  const filteredStats = useMemo(() => {
    return {
      total: filteredUsers.length,
      paid: filteredUsers.filter((u) => u.is_confirmado_pago === true).length,
      pending: filteredUsers.filter((u) =>
        u.status_pagamento_formatado === "Pendente" ||
        u.status_pagamento_formatado === "Pendente (Stripe)" ||
        u.status_pagamento_formatado === "Pendente (InfinitePay)"
      ).length,
      notPaid: filteredUsers.filter((u) => {
        const status = u.status_pagamento_formatado || '';
        return !u.is_confirmado_pago && (
          status === "Não pagou" ||
          status === "Redirecionado (InfinitePay)" ||
          status === ''
        );
      }).length,
    };
  }, [filteredUsers]);

  return {
    filteredUsers,
    filteredStats,
  };
};

