import { ClientPlan } from "@/types/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, DollarSign, Clock, CheckCircle2, Circle, Timer, MoreVertical, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";
import { EditStepModal } from "./EditStepModal";
import { Edit2 } from "lucide-react";

interface ClientPlanViewProps {
  plan: ClientPlan;
  leadId?: string;
  onUpdate?: () => void;
}

export const ClientPlanView = ({ plan, leadId, onUpdate }: ClientPlanViewProps) => {
  const [editingStep, setEditingStep] = useState<number | null>(null);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Rascunho", className: "bg-gray-500 text-white" },
      presented: { label: "Apresentado", className: "bg-blue-500 text-white" },
      in_progress: { label: "Em Execução", className: "bg-green-500 text-white" },
      completed: { label: "Concluído", className: "bg-purple-500 text-white" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <Timer className="h-5 w-5 text-blue-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepStatusBadge = (status: string) => {
    const config = {
      pending: { label: "Pendente", className: "bg-gray-100 text-gray-700 border-gray-300" },
      in_progress: { label: "Em Andamento", className: "bg-blue-100 text-blue-700 border-blue-300" },
      completed: { label: "Concluído", className: "bg-green-100 text-green-700 border-green-300" },
    };
    const stepConfig = config[status as keyof typeof config] || config.pending;
    return <Badge variant="outline" className={stepConfig.className}>{stepConfig.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleStatusUpdate = async (stepIndex: number, newStatus: string) => {
    if (!leadId) return;

    try {
      const updatedSteps = [...plan.plan_steps];
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        status: newStatus as any
      };

      const { error } = await supabase
        .from('client_plans')
        .update({ plan_steps: updatedSteps })
        .eq('lead_id', leadId);

      if (error) throw error;

      toast.success("Status da etapa atualizado!");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status da etapa");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-900 mb-2">
              {plan.plan_title}
            </CardTitle>
            <div className="flex items-center gap-2 mb-3">
              {getStatusBadge(plan.status)}
            </div>
            {plan.plan_summary && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {plan.plan_summary}
              </p>
            )}
          </div>
          {plan.pdf_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(plan.pdf_url!, '_blank')}
              className="ml-4"
            >
              <FileText className="h-4 w-4 mr-2" />
              Ver PDF
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Informações Gerais */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Duração Estimada</p>
              <p className="text-sm font-semibold text-gray-900">
                {plan.estimated_duration || "Não definido"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Investimento Total</p>
              <p className="text-sm font-semibold text-gray-900">
                {plan.estimated_investment ? formatCurrency(plan.estimated_investment) : "Não definido"}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline de Etapas */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Etapas do Planejamento</h3>
          
          {plan.plan_steps && plan.plan_steps.length > 0 ? (
            <div className="space-y-4">
              {plan.plan_steps.map((step, index) => (
                <div
                  key={step.step_number}
                  className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-l-0"
                >
                  {/* Ícone do Status */}
                  <div className="absolute left-0 top-0 -translate-x-[11px] bg-white">
                    {getStepStatusIcon(step.status)}
                  </div>

                  {/* Conteúdo da Etapa */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-semibold text-gray-500">
                              Etapa {step.step_number}
                            </span>
                            {/* Dropdown para alterar status */}
                            {leadId && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 hover:bg-transparent -ml-2">
                                      {getStepStatusBadge(step.status)}
                                      <ChevronDown className="h-3 w-3 opacity-50" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(index, "pending")}>
                                      Pendente
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(index, "in_progress")}>
                                      Em Andamento
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(index, "completed")}>
                                      Concluído
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                            {!leadId && getStepStatusBadge(step.status)}
                          </div>
                          
                          {leadId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                              onClick={() => setEditingStep(index)}
                              title="Editar etapa"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 mb-1">
                          {step.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Informações da Etapa */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-3 border-t border-gray-100 mt-2">
                      <div>
                        <p className="text-gray-500 mb-1">Responsável</p>
                        <p className="font-semibold text-gray-900">
                          {step.responsible_partners && step.responsible_partners.length > 0 
                            ? step.responsible_partners.join(", ") 
                            : (step.responsible_partner || "-")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Duração</p>
                        <p className="font-semibold text-gray-900">
                          {step.estimated_duration || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Custo Estimado</p>
                        <p className="font-semibold text-gray-900">
                          {step.estimated_cost ? formatCurrency(step.estimated_cost) : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Nenhuma etapa definida ainda</p>
            </div>
          )}
        </div>
      </CardContent>
      <EditStepModal
        plan={plan}
        stepIndex={editingStep !== null ? editingStep : -1}
        open={editingStep !== null}
        onOpenChange={(open) => !open && setEditingStep(null)}
        onSuccess={() => {
          if (onUpdate) onUpdate();
        }}
      />
    </Card>
  );
};

