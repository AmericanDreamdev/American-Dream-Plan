import { useState, useEffect } from "react";
import { ClientPlan, PlanStep, Partner } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, AlertCircle, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ClientPlanFormProps {
  leadId: string;
  plan: ClientPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ClientPlanForm = ({ leadId, plan, open, onOpenChange, onSuccess }: ClientPlanFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [formData, setFormData] = useState({
    plan_title: plan?.plan_title || "",
    plan_summary: plan?.plan_summary || "",
    estimated_duration: plan?.estimated_duration || "",
    estimated_investment: plan?.estimated_investment || 0,
    status: plan?.status || "draft",
    plan_steps: plan?.plan_steps || [] as PlanStep[],
  });

  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      fetchPartners();
      if (plan) {
        setFormData({
          plan_title: plan.plan_title,
          plan_summary: plan.plan_summary,
          estimated_duration: plan.estimated_duration,
          estimated_investment: plan.estimated_investment,
          status: plan.status,
          plan_steps: plan.plan_steps,
        });
      } else {
        setFormData({
          plan_title: "",
          plan_summary: "",
          estimated_duration: "",
          estimated_investment: 0,
          status: "draft",
          plan_steps: [],
        });
      }
    }
  }, [open, plan]);

  const fetchPartners = async () => {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Erro ao buscar parceiros:', error);
    } else {
      setPartners(data || []);
    }
  };

  const addStep = () => {
    const nextStepNumber = formData.plan_steps.length + 1;
    const newStep: PlanStep = {
      step_number: nextStepNumber,
      title: "",
      description: "",
      responsible_partner: "",
      responsible_partners: [],
      estimated_duration: "",
      estimated_cost: 0,
      status: "pending",
    };
    setFormData({ ...formData, plan_steps: [...formData.plan_steps, newStep] });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.plan_steps.filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, step_number: i + 1 }));
    setFormData({ ...formData, plan_steps: newSteps });
  };

  const updateStep = (index: number, field: keyof PlanStep, value: any) => {
    const newSteps = [...formData.plan_steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, plan_steps: newSteps });
  };

  const handleCreatePartner = async (name: string) => {
    if (!name.trim()) return;
    
    // Check if exists
    const existing = partners.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      toast.error("Parceiro já existe!");
      return existing;
    }

    try {
      const { data, error } = await supabase
        .from('partners')
        .insert([{ name, specialty: 'General', is_active: true }])
        .select()
        .single();

      if (error) throw error;

      setPartners([...partners, data]);
      toast.success("Parceiro criado com sucesso!");
      return data;
    } catch (err) {
      console.error("Erro ao criar parceiro:", err);
      toast.error("Erro ao criar parceiro");
      return null;
    }
  };

  const addPartnerToStep = (index: number, partnerName: string) => {
    const step = formData.plan_steps[index];
    const currentPartners = step.responsible_partners || [];
    
    if (currentPartners.includes(partnerName)) return;

    const newPartners = [...currentPartners, partnerName];
    
    const newSteps = [...formData.plan_steps];
    newSteps[index] = { 
      ...step, 
      responsible_partners: newPartners,
      // Sync legacy field with first partner
      responsible_partner: newPartners[0] || ""
    };
    setFormData({ ...formData, plan_steps: newSteps });
  };

  const removePartnerFromStep = (index: number, partnerName: string) => {
    const step = formData.plan_steps[index];
    const currentPartners = step.responsible_partners || [];
    const newPartners = currentPartners.filter(p => p !== partnerName);
    
    const newSteps = [...formData.plan_steps];
    newSteps[index] = { 
      ...step, 
      responsible_partners: newPartners,
      // Sync legacy field with first partner
      responsible_partner: newPartners[0] || ""
    };
    setFormData({ ...formData, plan_steps: newSteps });
  };

  const handleNext = () => {
    if (currentStep === 1) {
       if (!formData.plan_title) {
        toast.error("O título do plano é obrigatório.");
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSave = async () => {
    if (!formData.plan_title) {
      toast.error("O título do plano é obrigatório.");
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        lead_id: leadId,
        ...formData,
      };

      if (plan) {
        // Update
        const { error } = await supabase
          .from('client_plans')
          .update(dataToSave)
          .eq('id', plan.id);
        if (error) throw error;
        toast.success("Planejamento atualizado com sucesso!");
      } else {
        // Insert
        const { error } = await supabase
          .from('client_plans')
          .insert([dataToSave]);
        if (error) throw error;
        toast.success("Planejamento criado com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar plano:', error);
      toast.error(error.message || "Erro ao salvar planejamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan ? "Editar Planejamento" : "Novo Planejamento"} 
            <span className="text-gray-500 font-normal text-sm ml-2">
              (Passo {currentStep} de 2: {currentStep === 1 ? "Informações Gerais" : "Etapas do Plano"})
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {currentStep === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan_title">Título do Plano</Label>
                <Input
                  id="plan_title"
                  placeholder="Ex: Visto Turismo + F1 + EB-2"
                  value={formData.plan_title}
                  onChange={(e) => setFormData({ ...formData, plan_title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plan_summary">Resumo do Planejamento</Label>
                <Textarea
                  id="plan_summary"
                  placeholder="Descreva brevemente a estratégia traçada..."
                  value={formData.plan_summary}
                  onChange={(e) => setFormData({ ...formData, plan_summary: e.target.value })}
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated_duration">Duração Total Estimada</Label>
                  <Input
                    id="estimated_duration"
                    placeholder="Ex: 18-24 meses"
                    value={formData.estimated_duration}
                    onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_investment">Investimento Total (USD)</Label>
                  <Input
                    id="estimated_investment"
                    type="number"
                    value={formData.estimated_investment}
                    onChange={(e) => setFormData({ ...formData, estimated_investment: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status do Plano</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="presented">Apresentado</SelectItem>
                    <SelectItem value="in_progress">Em Execução</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-gray-900">Gerenciar Etapas</h3>
                    <p className="text-xs text-gray-500">Adicione e edite as tarefas do plano</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addStep}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Etapa
                </Button>
              </div>

              {formData.plan_steps.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <AlertCircle className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600">Nenhuma etapa definida</p>
                  <Button variant="link" onClick={addStep} className="mt-2 text-blue-600">
                    Clique aqui para adicionar a primeira etapa
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {formData.plan_steps.map((step, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                      {/* Header da Etapa: Número e Lixeira */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                          Etapa {step.step_number}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                          onClick={() => removeStep(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-700">Título da Etapa</Label>
                          <Input
                            placeholder="Ex: Aplicação para Visto"
                            value={step.title}
                            onChange={(e) => updateStep(index, 'title', e.target.value)}
                            className="bg-gray-50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-700">Descrição</Label>
                          <Textarea
                            placeholder="Detalhes do que será realizado..."
                            className="text-sm bg-gray-50 min-h-[80px]"
                            value={step.description}
                            onChange={(e) => updateStep(index, 'description', e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-700">Duração Est.</Label>
                              <Input
                                placeholder="Ex: 2 semanas"
                                value={step.estimated_duration}
                                onChange={(e) => updateStep(index, 'estimated_duration', e.target.value)}
                                className="bg-gray-50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-700">Custo Est. (USD)</Label>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={step.estimated_cost}
                                onChange={(e) => updateStep(index, 'estimated_cost', Number(e.target.value))}
                                className="bg-gray-50"
                              />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700">Parceiros Responsáveis</Label>
                            
                            {/* Lista de Parceiros Selecionados */}
                            <div className="flex flex-wrap gap-2 mb-2">
                              {(step.responsible_partners || (step.responsible_partner ? [step.responsible_partner] : []))
                                .map(partner => (
                                <Badge key={partner} variant="secondary" className="text-xs gap-1 pr-1">
                                  {partner}
                                  <button
                                    type="button"
                                    onClick={() => removePartnerFromStep(index, partner)}
                                    className="text-gray-500 hover:text-red-500"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <Select
                                onValueChange={(value) => {
                                  if (value === "new_partner") {
                                    // Logic handled by the create input below
                                    return;
                                  }
                                  addPartnerToStep(index, value);
                                }}
                              >
                                <SelectTrigger className="bg-gray-50 h-8 text-xs flex-1">
                                  <SelectValue placeholder="Adicionar parceiro..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {partners.map(p => (
                                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Input para criar novo parceiro */}
                            <div className="flex gap-2 mt-2">
                                <Input 
                                    placeholder="Novo parceiro..." 
                                    className="h-7 text-xs bg-gray-50"
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = e.currentTarget.value;
                                            if (val) {
                                                const newPartner = await handleCreatePartner(val);
                                                if (newPartner) {
                                                    addPartnerToStep(index, newPartner.name);
                                                    e.currentTarget.value = "";
                                                }
                                            }
                                        }
                                    }}
                                />
                                <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-7 w-7 p-0"
                                    title="Criar novo parceiro"
                                    onClick={async (e) => {
                                        // Pega o input irmão anterior
                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                        if (input && input.value) {
                                            const newPartner = await handleCreatePartner(input.value);
                                            if (newPartner) {
                                                addPartnerToStep(index, newPartner.name);
                                                input.value = "";
                                            }
                                        }
                                    }}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700">Status</Label>
                            <Select
                              value={step.status}
                              onValueChange={(value) => updateStep(index, 'status', value)}
                            >
                              <SelectTrigger className="bg-gray-50">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="in_progress">Em Andamento</SelectItem>
                                <SelectItem value="completed">Concluído</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 flex justify-between items-center w-full sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          
          <div className="flex gap-2">
            {currentStep === 2 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                Voltar
              </Button>
            )}
            
            {currentStep === 1 ? (
              <Button type="button" onClick={handleNext}>
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={loading} className="gap-2">
                {loading ? "Salvando..." : <><Save className="h-4 w-4" /> Salvar Planejamento</>}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

