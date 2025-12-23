import { useState, useMemo, useEffect } from "react";
import { DashboardUser, DashboardStats } from "@/types/dashboard";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Filter, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardPagination } from "@/components/dashboard/DashboardPagination";

interface UsersPageProps {
  users: DashboardUser[];
  stats: DashboardStats;
  consultationForms: any[];
  onUpdate?: () => void;
}

export const UsersPage = ({ users, stats, consultationForms, onUpdate }: UsersPageProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page when context changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, activeFilters, searchTerm]);

  // Calcular contadores para os filtros
  const filterCounts = useMemo(() => {
    return {
      hasContract: users.filter(u => u.aceitou_contrato === 'Sim').length,
      hasPayment: users.filter(u => u.is_confirmado_pago === true).length,
      hasForm: users.filter(u => u.consultation_form_id !== null).length,
      noContract: users.filter(u => u.aceitou_contrato === 'Não').length,
      noPayment: users.filter(u => !u.is_confirmado_pago && (u.status_pagamento_formatado === 'Não pagou' || u.status_pagamento_formatado === '')).length,
      noForm: users.filter(u => u.consultation_form_id === null).length,
      redirectedZelle: users.filter(u => u.status_pagamento_formatado === 'Redirecionado (Zelle)').length,
      redirectedInfinitePay: users.filter(u => u.status_pagamento_formatado === 'Redirecionado (InfinitePay)').length,
      // SEGUNDA PARCELA
      paidSecondPart: users.filter(u => u.is_confirmado_pago_segunda_parte).length,
      awaitingSecondPart: users.filter(u => 
        u.is_confirmado_pago && !u.is_confirmado_pago_segunda_parte
      ).length,
      // REUNIÕES - PRIMEIRA
      firstMeetingScheduled: users.filter(u => 
        u.first_meeting?.status === 'scheduled'
      ).length,
      firstMeetingCompleted: users.filter(u => 
        u.first_meeting?.status === 'completed'
      ).length,
      // REUNIÕES - SEGUNDA
      secondMeetingScheduled: users.filter(u => 
        u.second_meeting?.status === 'scheduled'
      ).length,
      secondMeetingCompleted: users.filter(u => 
        u.second_meeting?.status === 'completed'
      ).length,
      // PLANEJAMENTO
      hasPlan: users.filter(u => u.client_plan !== null).length,
      planInProgress: users.filter(u => 
        u.client_plan?.status === 'in_progress'
      ).length,
    };
  }, [users]);

  const toggleFilter = (filterKey: string) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filterKey)) {
        newFilters.delete(filterKey);
      } else {
        newFilters.add(filterKey);
      }
      return newFilters;
    });
  };

  const clearFilters = () => {
    setActiveFilters(new Set());
  };

  // Aplicar filtros adicionais
  const { filteredUsers: baseFilteredUsers } = useDashboardFilters({
    users,
    searchTerm,
    activeTab,
    stats,
  });

  const filteredUsers = useMemo(() => {
    let result = baseFilteredUsers;

    if (activeFilters.size === 0) {
      return result;
    }

    return result.filter(user => {
      // Se tem filtros ativos, todos devem passar
      let passes = true;

      if (activeFilters.has('hasContract')) {
        passes = passes && user.aceitou_contrato === 'Sim';
      }
      if (activeFilters.has('noContract')) {
        passes = passes && user.aceitou_contrato === 'Não';
      }
      if (activeFilters.has('hasPayment')) {
        passes = passes && user.is_confirmado_pago === true;
      }
      if (activeFilters.has('noPayment')) {
        passes = passes && !user.is_confirmado_pago && (user.status_pagamento_formatado === 'Não pagou' || user.status_pagamento_formatado === '');
      }
      if (activeFilters.has('hasForm')) {
        passes = passes && user.consultation_form_id !== null;
      }
      if (activeFilters.has('noForm')) {
        passes = passes && user.consultation_form_id === null;
      }
      if (activeFilters.has('redirectedZelle')) {
        passes = passes && user.status_pagamento_formatado === 'Redirecionado (Zelle)';
      }
      if (activeFilters.has('redirectedInfinitePay')) {
        passes = passes && user.status_pagamento_formatado === 'Redirecionado (InfinitePay)';
      }
      
      // Segunda parcela
      if (activeFilters.has('paidSecondPart')) {
        passes = passes && user.is_confirmado_pago_segunda_parte === true;
      }
      if (activeFilters.has('awaitingSecondPart')) {
        passes = passes && user.is_confirmado_pago && !user.is_confirmado_pago_segunda_parte;
      }
      
      // Primeira reunião
      if (activeFilters.has('firstMeetingScheduled')) {
        passes = passes && user.first_meeting?.status === 'scheduled';
      }
      if (activeFilters.has('firstMeetingCompleted')) {
        passes = passes && user.first_meeting?.status === 'completed';
      }
      
      // Segunda reunião
      if (activeFilters.has('secondMeetingScheduled')) {
        passes = passes && user.second_meeting?.status === 'scheduled';
      }
      if (activeFilters.has('secondMeetingCompleted')) {
        passes = passes && user.second_meeting?.status === 'completed';
      }
      
      // Planejamento
      if (activeFilters.has('hasPlan')) {
        passes = passes && user.client_plan !== null;
      }
      if (activeFilters.has('planInProgress')) {
        passes = passes && user.client_plan?.status === 'in_progress';
      }

      return passes;
    });
  }, [baseFilteredUsers, activeFilters]);

  // Filter Consultation Forms
  const filteredForms = useMemo(() => {
    return consultationForms.filter((form) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        const nome = form.nome_completo || form.lead_name || "";
        const email = form.email || form.lead_email || "";
        const telefone = form.telefone || "";

        return (
          nome.toLowerCase().includes(search) ||
          email.toLowerCase().includes(search) ||
          telefone.toLowerCase().includes(search)
        );
      });
  }, [consultationForms, searchTerm]);

  // Pagination Logic
  const isConsultationTab = activeTab === 'consultation';
  const currentDataCount = isConsultationTab ? filteredForms.length : filteredUsers.length;
  const totalPages = Math.ceil(currentDataCount / itemsPerPage);

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    if (isConsultationTab) {
        return {
            users: [],
            forms: filteredForms.slice(startIndex, endIndex)
        };
    } else {
        return {
            users: filteredUsers.slice(startIndex, endIndex),
            forms: []
        };
    }
  }, [isConsultationTab, currentPage, itemsPerPage, filteredUsers, filteredForms]);


  const filterGroups = [
    {
      id: "contract",
      label: "Contrato e Lead",
      items: [
        { key: "hasContract", label: "Com Contrato" },
        { key: "noContract", label: "Sem Contrato" },
        { key: "hasForm", label: "Com Formulário" },
        { key: "noForm", label: "Sem Formulário" },
      ]
    },
    {
      id: "financial",
      label: "Financeiro",
      items: [
        { key: "hasPayment", label: "Pagou" },
        { key: "noPayment", label: "Não Pagou" },
        { key: "redirectedZelle", label: "Redir. Zelle" },
        { key: "redirectedInfinitePay", label: "Redir. InfinitePay" },
        { key: "paidSecondPart", label: "2ª Parc. Paga" },
        { key: "awaitingSecondPart", label: "Aguard. 2ª Parc." },
      ]
    },
    {
      id: "meetings",
      label: "Progresso e Reuniões",
      items: [
        { key: "firstMeetingScheduled", label: "1ª Reunião Agendada" },
        { key: "firstMeetingCompleted", label: "1ª Reunião Realizada" },
        { key: "secondMeetingScheduled", label: "2ª Reunião Agendada" },
        { key: "secondMeetingCompleted", label: "2ª Reunião Realizada" },
        { key: "hasPlan", label: "Com Planejamento" },
        { key: "planInProgress", label: "Plano em Execução" },
      ]
    }
  ];

  const getFilterLabel = (key: string) => {
    for (const group of filterGroups) {
      const item = group.items.find((i) => i.key === key);
      if (item) return item.label;
    }
    return key;
  };

  return (
    <div className="space-y-6">

      {/* Filtros Renovados */}
      <div className="flex flex-col gap-4 bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700 mr-2 flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros:
                </span>
                
                {filterGroups.map((group) => (
                    <DropdownMenu key={group.id}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 border-dashed gap-1 text-xs">
                                {group.label}
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[220px]">
                            <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.label}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {group.items.map((item) => {
                                const count = filterCounts[item.key as keyof typeof filterCounts] || 0;
                                const isActive = activeFilters.has(item.key);
                                return (
                                    <DropdownMenuItem 
                                        key={item.key} 
                                        onClick={() => toggleFilter(item.key)}
                                        className="flex items-center justify-between text-xs cursor-pointer py-2"
                                    >
                                        <span className={isActive ? "font-medium text-blue-700" : ""}>
                                            {item.label} <span className="text-gray-400 ml-1 font-normal">({count})</span>
                                        </span>
                                        {isActive && <Check className="h-3 w-3 text-blue-600" />}
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ))}
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                 {activeFilters.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 px-2 lg:px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Limpar Filtros
                      <X className="ml-1 h-3 w-3" />
                    </Button>
                )}
                 <div className="text-xs text-gray-500 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md border">
                    {currentDataCount} resultado(s)
                </div>
            </div>
        </div>

        {/* Active Filters Display */}
        {activeFilters.size > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-dashed">
                {Array.from(activeFilters).map(key => (
                    <Badge variant="secondary" key={key} className="h-6 gap-1 px-2 text-xs font-normal bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 cursor-pointer transition-all" onClick={() => toggleFilter(key)}>
                        {getFilterLabel(key)}
                        <div className="rounded-full hover:bg-blue-200 p-0.5">
                            <X className="h-3 w-3" />
                        </div>
                    </Badge>
                ))}
            </div>
        )}
      </div>

      {/* Users Table */}
      <DashboardTabs
        users={users} // Passes full users for badges logic inside DashboardTabs (if it used them for calculating) - wait, badges usually use 'stats' prop.
        filteredUsers={paginatedResults.users}
        consultationForms={paginatedResults.forms}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={stats}
        onUpdate={onUpdate}
      >
        <DashboardPagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={currentDataCount}
        />
      </DashboardTabs>
    </div>
  );
};
