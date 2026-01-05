import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardUser } from "@/types/dashboard";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditUserModalProps {
  user: DashboardUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditUserModal = ({ user, open, onOpenChange, onSuccess }: EditUserModalProps) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"part1" | "part2">("part1");
  const [formData, setFormData] = useState({
    paymentStatus: "",
    amount: "",
    currency: "USD",
    paymentMethod: "",
    paymentDate: "",
    paymentTime: "",
    notes: "",
  });

  const loadDataForTab = (tab: "part1" | "part2") => {
    if (!user) return;

    let status = "Não pagou";
    let amount = "";
    let currency = "USD";
    let method = "";
    let dateStr = "";
    let timeStr = "";
    let notes = "";

    if (tab === "part1") {
      status = user.status_pagamento_formatado || "Não pagou";
      if (user.valor_formatado) {
        const cleaned = user.valor_formatado.replace(/[^\d,.-]/g, "").replace(/,/g, ""); 
        amount = cleaned;
        if (user.valor_formatado.includes("R$")) currency = "BRL";
      } else if (user.payment_metadata?.amount) {
        amount = user.payment_metadata.amount.toString();
        currency = user.payment_metadata?.currency || "USD";
      }
      method = user.metodo_pagamento_formatado || "";
      if (user.payment_created_at) {
        dateStr = new Date(user.payment_created_at).toISOString().split('T')[0];
        timeStr = new Date(user.payment_created_at).toISOString().split('T')[1]?.split('.')[0] || "";
      }
      notes = user.payment_metadata?.notes || "";

    } else {
      // Part 2
      status = user.status_pagamento_segunda_parte_formatado || "Não pagou";
      if (user.valor_segunda_parte_formatado) {
        const cleaned = user.valor_segunda_parte_formatado.replace(/[^\d,.-]/g, "").replace(/,/g, "");
        amount = cleaned;
        if (user.valor_segunda_parte_formatado.includes("R$")) currency = "BRL";
      } else {
        // Default amount for 2nd part if empty
        amount = "1999.00"; 
      }
      method = user.metodo_pagamento_segunda_parte_formatado || "";
      if (user.data_pagamento_segunda_parte_formatada) { 
        // Note: The dashboard type doesn't have raw date for 2nd part explicitly exposed except 'payment_created_at' on user?
        // Actually DashboardUser has flat fields. We might not have the RAW date for the 2nd part easily if not in metadata.
        // But usually 'status_pagamento_segunda...' implies it exists.
        // Let's assume we don't have the exact date if not in a specific field, defaulting to now or empty.
        // Wait, 'payment_created_at' on dashboardUser refers to the payment record found.
        // The query probably joins ONE payment.
        // Actually, the dashboard query logic maps things.
        // If we want to edit 2nd part, we need its ID.
      }
      // Try to find the raw payment date if we have 'payment_id_segunda_parte'.
      // Since we don't have the raw object here, we might miss the exact date.
      // However, for admin edit, we can default to 'today' if empty.
    }

    setFormData({
      paymentStatus: status,
      amount: amount,
      currency: currency,
      paymentMethod: method,
      paymentDate: dateStr,
      paymentTime: timeStr,
      notes: notes,
    });
  };

  useEffect(() => {
    if (open) {
      loadDataForTab(activeTab);
    }
  }, [open, activeTab, user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

      // 1. Determine Status
      let paymentStatus = "pending";
      let isCompleted = false;

      if (formData.paymentStatus.includes("Pago")) {
        paymentStatus = "completed"; // Or specific status like 'zelle_confirmed'
        if (formData.paymentStatus.includes("Zelle")) paymentStatus = "zelle_confirmed";
        isCompleted = true;
      } else if (formData.paymentStatus === "Pago Parcelow") {
        paymentStatus = "completed";
        isCompleted = true;
      } else if (formData.paymentStatus.includes("Redirecionado")) {
         if (formData.paymentStatus.includes("Zelle")) paymentStatus = "redirected_to_zelle";
         else paymentStatus = "redirected_to_infinitepay";
      } else if (formData.paymentStatus.includes("Pendente")) {
        paymentStatus = "pending";
      } else {
        paymentStatus = "pending"; 
        if (formData.paymentStatus === "Não pagou") paymentStatus = "pending"; // Or delete? Usually we just set status.
      }

      // 2. Metadata
      let paymentMethod = "";
      if (formData.paymentMethod === "Cartão de Crédito") paymentMethod = "card";
      else if (formData.paymentMethod === "PIX") paymentMethod = "pix";
      else if (formData.paymentMethod === "Zelle") paymentMethod = "zelle";
      else if (formData.paymentMethod === "InfinitePay") paymentMethod = "infinitepay";
      else if (formData.paymentMethod === "Parcelow") paymentMethod = "parcelow";

      // Inferred method from status if not explicitly set in method dropdown
      if (!paymentMethod) {
        if (formData.paymentStatus.includes("PIX")) paymentMethod = "pix";
        else if (formData.paymentStatus.includes("Cartão")) paymentMethod = "card";
        else if (formData.paymentStatus.includes("Zelle")) paymentMethod = "zelle";
        else if (formData.paymentStatus.includes("InfinitePay")) paymentMethod = "infinitepay";
        else if (formData.paymentStatus.includes("Parcelow")) paymentMethod = "parcelow";
      }

      let paymentDateTime = null;
      if (formData.paymentDate) {
        const time = formData.paymentTime || "00:00:00";
        paymentDateTime = new Date(`${formData.paymentDate}T${time}`).toISOString();
      }

      const amount = formData.amount && formData.amount.trim() !== "" ? parseFloat(formData.amount) : null;

      const metadata: any = {
        payment_method: paymentMethod,
        manual_edit: true,
        edited_at: new Date().toISOString(),
        edited_by: session.user.id,
        payment_part: activeTab === "part1" ? 1 : 2, // IMPORTANT
      };
      
      if (isCompleted) {
          if (paymentMethod === 'zelle') metadata.zelle_paid = true;
          if (paymentMethod === 'infinitepay') metadata.infinitepay_paid = true;
          if (paymentMethod === 'parcelow') metadata.parcelow_paid = true;
      }

      if (formData.notes) metadata.notes = formData.notes;

      // 3. Request Data
      const requestData: any = {
        lead_id: user.lead_id,
        status: paymentStatus,
        metadata: metadata,
      };

      // ID Logic
      const currentPaymentId = activeTab === "part1" ? user.payment_id : user.payment_id_segunda_parte;
      
      if (currentPaymentId) {
        requestData.payment_id = currentPaymentId;
      } else {
        // Create new
         if (!user.term_acceptance_id) {
          toast.error("Usuário precisa ter aceitado o contrato.");
          return;
        }
        requestData.term_acceptance_id = user.term_acceptance_id;
      }

      if (amount !== null) requestData.amount = amount;
      if (formData.currency) requestData.currency = formData.currency;
      if (paymentDateTime) requestData.created_at = paymentDateTime;

      // 4. Call Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao salvar pagamento");

      toast.success(currentPaymentId ? "Pagamento atualizado!" : "Pagamento criado!");
      onSuccess();
      onOpenChange(false);

    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error(error.message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Editar Informações de Pagamento</DialogTitle>
          <DialogDescription className="text-base">
            Gerencie as informações de pagamento do cliente: <strong>{user.nome_completo}</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="part1">1ª Parcela</TabsTrigger>
                <TabsTrigger value="part2">2ª Parcela</TabsTrigger>
            </TabsList>
            
            <div className="space-y-6 py-2">
                {/* Common Form Fields - They bind to formData which updates on tab change */}
                 <div className="space-y-2">
                    <Label htmlFor="paymentStatus" className="text-sm font-semibold">Status de Pagamento *</Label>
                    <Select
                    value={formData.paymentStatus}
                    onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                    >
                    <SelectTrigger id="paymentStatus">
                        <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Pago (Stripe)">Pago (Stripe)</SelectItem>
                        <SelectItem value="Pago (Cartão)">Pago (Cartão)</SelectItem>
                        <SelectItem value="Pago (PIX)">Pago (PIX)</SelectItem>
                        <SelectItem value="Pago (Zelle)">Pago (Zelle)</SelectItem>
                        <SelectItem value="Pago (InfinitePay)">Pago (InfinitePay)</SelectItem>
                        <SelectItem value="Pago Parcelow">Pago Parcelow</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Pendente (Stripe)">Pendente (Stripe)</SelectItem>
                        <SelectItem value="Pendente (InfinitePay)">Pendente (InfinitePay)</SelectItem>
                        <SelectItem value="Pendente Parcelow">Pendente Parcelow</SelectItem>
                        <SelectItem value="Redirecionado (Zelle)">Redirecionado (Zelle)</SelectItem>
                        <SelectItem value="Redirecionado (InfinitePay)">Redirecionado (InfinitePay)</SelectItem>
                        <SelectItem value="Não pagou">Não pagou</SelectItem>
                    </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-semibold">Valor do Pagamento *</Label>
                    <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                    />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-semibold">Moeda *</Label>
                    <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                        <SelectTrigger id="currency">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="USD">USD (US$)</SelectItem>
                        <SelectItem value="BRL">BRL (R$)</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="paymentMethod" className="text-sm font-semibold">Método de Pagamento</Label>
                    <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                    <SelectTrigger id="paymentMethod">
                        <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="Zelle">Zelle</SelectItem>
                        <SelectItem value="InfinitePay">InfinitePay</SelectItem>
                        <SelectItem value="Parcelow">Parcelow</SelectItem>
                    </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="paymentDate" className="text-sm font-semibold">Data do Pagamento</Label>
                    <Input
                        id="paymentDate"
                        type="date"
                        value={formData.paymentDate}
                        onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="paymentTime" className="text-sm font-semibold">Hora do Pagamento</Label>
                    <Input
                        id="paymentTime"
                        type="time"
                        value={formData.paymentTime}
                        onChange={(e) => setFormData({ ...formData, paymentTime: e.target.value })}
                    />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-semibold">Notas Internas (opcional)</Label>
                    <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Adicione notas sobre este pagamento..."
                    rows={3}
                    />
                </div>
                
                 {/* Info Display */}
                 <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                    <p><strong>Editando:</strong> {activeTab === "part1" ? "1ª Parcela" : "2ª Parcela"}</p>
                    {(activeTab === "part1" ? user.payment_id : user.payment_id_segunda_parte) && (
                         <p className="mt-1"><strong>ID:</strong> {activeTab === "part1" ? user.payment_id : user.payment_id_segunda_parte}</p>
                    )}
                 </div>
            </div>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-gray-300"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
