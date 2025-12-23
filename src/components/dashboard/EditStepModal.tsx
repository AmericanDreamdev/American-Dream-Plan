import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ClientPlan, PlanStep, Partner } from "@/types/dashboard";

interface EditStepModalProps {
  plan: ClientPlan;
  stepIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditStepModal = ({ plan, stepIndex, open, onOpenChange, onSuccess }: EditStepModalProps) => {
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stepData, setStepData] = useState<PlanStep | null>(null);

  useEffect(() => {
    if (open && plan && typeof stepIndex === 'number') {
      const step = plan.plan_steps[stepIndex];
      // Clone to avoid mutation refs issues
      setStepData({ ...step });
      fetchPartners();
    }
  }, [open, plan, stepIndex]);

  const fetchPartners = async () => {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (data) setPartners(data);
  };

  const handleCreatePartner = async (name: string) => {
    if (!name.trim()) return;
    
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

  const addPartner = (partnerName: string) => {
    if (!stepData) return;
    const current = stepData.responsible_partners || [];
    if (!current.includes(partnerName)) {
      const newPartners = [...current, partnerName];
      setStepData({
        ...stepData,
        responsible_partners: newPartners,
        responsible_partner: newPartners[0] || "" // Sync legado
      });
    }
  };

  const removePartner = (partnerName: string) => {
    if (!stepData) return;
    const current = stepData.responsible_partners || [];
    const newPartners = current.filter(p => p !== partnerName);
    setStepData({
      ...stepData,
      responsible_partners: newPartners,
      responsible_partner: newPartners[0] || "" // Sync legado
    });
  };

  const handleSave = async () => {
    if (!stepData) return;
    if (!stepData.title) {
        toast.error("O título da etapa é obrigatório");
        return;
    }

    setLoading(true);
    try {
      // Create a copy of the steps array
      const newSteps = [...plan.plan_steps];
      // Update the specific step
      newSteps[stepIndex] = stepData;

      const { error } = await supabase
        .from('client_plans')
        .update({ plan_steps: newSteps })
        .eq('id', plan.id);

      if (error) throw error;

      toast.success("Etapa atualizada com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar etapa:", error);
      toast.error("Erro ao salvar etapa");
    } finally {
      setLoading(false);
    }
  };

  if (!stepData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Etapa {stepData.step_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Título da Etapa</Label>
            <Input
              value={stepData.title}
              onChange={(e) => setStepData({ ...stepData, title: e.target.value })}
              placeholder="Ex: Aplicação para Visto"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={stepData.description}
              onChange={(e) => setStepData({ ...stepData, description: e.target.value })}
              placeholder="Detalhes..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duração Estimada</Label>
              <Input
                value={stepData.estimated_duration}
                onChange={(e) => setStepData({ ...stepData, estimated_duration: e.target.value })}
                placeholder="Ex: 2 semanas"
              />
            </div>
            <div className="space-y-2">
              <Label>Custo Estimado (USD)</Label>
              <Input
                type="number"
                value={stepData.estimated_cost}
                onChange={(e) => setStepData({ ...stepData, estimated_cost: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Partner Management */}
          <div className="space-y-2">
            <Label>Parceiros Responsáveis</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(stepData.responsible_partners || (stepData.responsible_partner ? [stepData.responsible_partner] : []))
                .map(partner => (
                <Badge key={partner} variant="secondary" className="text-xs gap-1 pr-1">
                  {partner}
                  <button type="button" onClick={() => removePartner(partner)} className="text-gray-500 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
                <Select onValueChange={(val) => val !== "new" && addPartner(val)}>
                    <SelectTrigger className="flex-1 bg-gray-50 h-9">
                        <SelectValue placeholder="Adicionar parceiro..." />
                    </SelectTrigger>
                    <SelectContent>
                        {partners.map(p => (
                            <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="flex gap-2 mt-2">
                <Input 
                    placeholder="Criar novo parceiro..." 
                    className="h-9 bg-gray-50"
                    onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value;
                            if (val) {
                                const newP = await handleCreatePartner(val);
                                if (newP) {
                                    addPartner(newP.name);
                                    e.currentTarget.value = "";
                                }
                            }
                        }
                    }}
                />
                <Button variant="outline" size="icon" onClick={async (e) => {
                     const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                     if (input && input.value) {
                         const newP = await handleCreatePartner(input.value);
                         if (newP) {
                             addPartner(newP.name);
                             input.value = "";
                         }
                     }
                }}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            {loading ? "Salvando..." : <><Save className="h-4 w-4" /> Salvar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
