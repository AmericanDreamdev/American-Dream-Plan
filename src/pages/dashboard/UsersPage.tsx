import { useState, useMemo } from "react";
import { DashboardUser, DashboardStats } from "@/types/dashboard";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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

  return (
    <div className="space-y-6">

      {/* Filtros */}
      <div className="bg-white border-0 rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Filtros</h3>
          {activeFilters.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs text-gray-600 hover:text-gray-900"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={activeFilters.has('hasContract') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('hasContract')
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('hasContract')}
          >
            Com Contrato ({filterCounts.hasContract})
          </Badge>
          <Badge
            variant={activeFilters.has('noContract') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('noContract')
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('noContract')}
          >
            Sem Contrato ({filterCounts.noContract})
          </Badge>
          <Badge
            variant={activeFilters.has('hasPayment') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('hasPayment')
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('hasPayment')}
          >
            Pagou ({filterCounts.hasPayment})
          </Badge>
          <Badge
            variant={activeFilters.has('noPayment') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('noPayment')
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('noPayment')}
          >
            Não Pagou ({filterCounts.noPayment})
          </Badge>
          <Badge
            variant={activeFilters.has('hasForm') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('hasForm')
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('hasForm')}
          >
            Com Formulário ({filterCounts.hasForm})
          </Badge>
          <Badge
            variant={activeFilters.has('noForm') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('noForm')
                ? 'bg-gray-600 text-white border-gray-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('noForm')}
          >
            Sem Formulário ({filterCounts.noForm})
          </Badge>
          <Badge
            variant={activeFilters.has('redirectedZelle') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('redirectedZelle')
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('redirectedZelle')}
          >
            Redirecionado Zelle ({filterCounts.redirectedZelle})
          </Badge>
          <Badge
            variant={activeFilters.has('redirectedInfinitePay') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('redirectedInfinitePay')
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('redirectedInfinitePay')}
          >
            Redirecionado InfinitePay ({filterCounts.redirectedInfinitePay})
          </Badge>
          
          {/* Segunda Parcela */}
          <Badge
            variant={activeFilters.has('paidSecondPart') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('paidSecondPart')
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('paidSecondPart')}
          >
            2ª Parcela Paga ({filterCounts.paidSecondPart})
          </Badge>
          <Badge
            variant={activeFilters.has('awaitingSecondPart') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('awaitingSecondPart')
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('awaitingSecondPart')}
          >
            Aguardando 2ª Parcela ({filterCounts.awaitingSecondPart})
          </Badge>
          
          {/* Reuniões - Primeira */}
          <Badge
            variant={activeFilters.has('firstMeetingScheduled') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('firstMeetingScheduled')
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('firstMeetingScheduled')}
          >
            1ª Reunião Agendada ({filterCounts.firstMeetingScheduled})
          </Badge>
          <Badge
            variant={activeFilters.has('firstMeetingCompleted') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('firstMeetingCompleted')
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('firstMeetingCompleted')}
          >
            1ª Reunião Realizada ({filterCounts.firstMeetingCompleted})
          </Badge>
          
          {/* Reuniões - Segunda */}
          <Badge
            variant={activeFilters.has('secondMeetingScheduled') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('secondMeetingScheduled')
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('secondMeetingScheduled')}
          >
            2ª Reunião Agendada ({filterCounts.secondMeetingScheduled})
          </Badge>
          <Badge
            variant={activeFilters.has('secondMeetingCompleted') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('secondMeetingCompleted')
                ? 'bg-fuchsia-600 text-white border-fuchsia-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('secondMeetingCompleted')}
          >
            2ª Reunião Realizada ({filterCounts.secondMeetingCompleted})
          </Badge>
          
          {/* Planejamento */}
          <Badge
            variant={activeFilters.has('hasPlan') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('hasPlan')
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('hasPlan')}
          >
            Com Planejamento ({filterCounts.hasPlan})
          </Badge>
          <Badge
            variant={activeFilters.has('planInProgress') ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              activeFilters.has('planInProgress')
                ? 'bg-lime-600 text-white border-lime-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleFilter('planInProgress')}
          >
            Plano em Execução ({filterCounts.planInProgress})
          </Badge>
        </div>
        {activeFilters.size > 0 && (
          <div className="mt-3 text-xs text-gray-600">
            Mostrando {filteredUsers.length} de {baseFilteredUsers.length} usuários
          </div>
        )}
      </div>

      {/* Users Table */}
      <DashboardTabs
        users={users}
        filteredUsers={filteredUsers}
        consultationForms={consultationForms}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={stats}
        onUpdate={onUpdate}
      />
    </div>
  );
};

