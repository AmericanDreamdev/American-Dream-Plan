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

interface EditUserModalProps {
  user: DashboardUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditUserModal = ({ user, open, onOpenChange, onSuccess }: EditUserModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    paymentStatus: user.status_pagamento_formatado || "Não pagou",
    amount: user.payment_metadata?.amount || "",
    currency: user.payment_metadata?.currency || "USD",
    paymentMethod: user.metodo_pagamento_formatado || "",
    paymentDate: user.data_pagamento_formatada ? 
      new Date(user.payment_created_at || "").toISOString().split('T')[0] : "",
    paymentTime: user.data_pagamento_formatada ? 
      new Date(user.payment_created_at || "").toISOString().split('T')[1]?.split('.')[0] || "" : "",
    notes: "",
  });

  useEffect(() => {
    if (open && user) {
      // Extrair valor do valor_formatado se existir
      let amount = "";
      if (user.valor_formatado) {
        // Remove símbolos de moeda e espaços, mantém números, vírgulas e pontos
        const cleaned = user.valor_formatado.replace(/[^\d,.-]/g, "").replace(/,/g, "");
        if (cleaned) {
          amount = cleaned;
        }
      } else if (user.payment_metadata?.amount) {
        amount = user.payment_metadata.amount.toString();
      }
      
      // Determinar moeda
      let currency = "USD";
      if (user.valor_formatado?.includes("R$")) {
        currency = "BRL";
      } else if (user.valor_formatado?.includes("US$")) {
        currency = "USD";
      }

      setFormData({
        paymentStatus: user.status_pagamento_formatado || "Não pagou",
        amount: amount || "",
        currency: currency,
        paymentMethod: user.metodo_pagamento_formatado || "",
        paymentDate: user.payment_created_at ? 
          new Date(user.payment_created_at).toISOString().split('T')[0] : "",
        paymentTime: user.payment_created_at ? 
          new Date(user.payment_created_at).toISOString().split('T')[1]?.split('.')[0] || "" : "",
        notes: "",
      });
    }
  }, [open, user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

      // Determinar status do pagamento baseado na seleção
      let paymentStatus = "pending";
      let isCompleted = false;

      if (formData.paymentStatus === "Pago (Zelle)") {
        paymentStatus = "zelle_confirmed";
        isCompleted = true;
      } else if (formData.paymentStatus === "Pago (Stripe)" || 
          formData.paymentStatus === "Pago (Cartão)" ||
          formData.paymentStatus === "Pago (PIX)" ||
          formData.paymentStatus === "Pago (InfinitePay)") {
        paymentStatus = "completed";
        isCompleted = true;
      } else if (formData.paymentStatus === "Pendente" ||
                 formData.paymentStatus === "Pendente (Stripe)" ||
                 formData.paymentStatus === "Pendente (InfinitePay)") {
        paymentStatus = "pending";
      } else if (formData.paymentStatus === "Redirecionado (Zelle)") {
        paymentStatus = "redirected_to_zelle";
      } else if (formData.paymentStatus === "Redirecionado (InfinitePay)") {
        paymentStatus = "redirected_to_infinitepay";
      } else {
        paymentStatus = "pending";
      }

      // Determinar método de pagamento no metadata
      let paymentMethod = "";
      if (formData.paymentMethod === "Cartão de Crédito") {
        paymentMethod = "card";
      } else if (formData.paymentMethod === "PIX") {
        paymentMethod = "pix";
      } else if (formData.paymentMethod === "Zelle") {
        paymentMethod = "zelle";
      } else if (formData.paymentMethod === "InfinitePay") {
        paymentMethod = "infinitepay";
      }

      // Preparar data de pagamento
      let paymentDateTime = null;
      if (formData.paymentDate) {
        if (formData.paymentTime) {
          paymentDateTime = new Date(`${formData.paymentDate}T${formData.paymentTime}`).toISOString();
        } else {
          paymentDateTime = new Date(`${formData.paymentDate}T00:00:00`).toISOString();
        }
      }

      // Preparar amount (converter para número)
      const amount = formData.amount && formData.amount.trim() !== "" ? parseFloat(formData.amount) : null;

      // Preparar metadata
      const metadata: any = {
        payment_method: paymentMethod,
        manual_edit: true,
        edited_at: new Date().toISOString(),
        edited_by: session.user.id,
      };

      // Se for InfinitePay ou Zelle confirmado, adicionar flags
      if (paymentStatus === "redirected_to_infinitepay" && isCompleted) {
        metadata.infinitepay_confirmed = true;
        metadata.infinitepay_paid = true;
      }
      if (paymentStatus === "redirected_to_zelle" && isCompleted) {
        metadata.zelle_confirmed = true;
        metadata.zelle_paid = true;
      }

      if (formData.notes) {
        metadata.notes = formData.notes;
      }

      // Preparar dados para enviar à Edge Function
      const requestData: any = {
        lead_id: user.lead_id,
        status: paymentStatus,
        metadata: {
          ...user.payment_metadata,
          ...metadata,
        },
      };

      if (user.payment_id) {
        requestData.payment_id = user.payment_id;
      } else {
        if (!user.term_acceptance_id) {
          toast.error("Usuário precisa ter aceitado o contrato antes de criar um pagamento.");
          return;
        }
        requestData.term_acceptance_id = user.term_acceptance_id;
      }

      if (amount !== null && !isNaN(amount)) {
        requestData.amount = amount;
      }
      if (formData.currency) {
        requestData.currency = formData.currency.toUpperCase();
      }
      if (paymentDateTime) {
        requestData.created_at = paymentDateTime;
      }

      // Chamar Edge Function para atualizar/criar pagamento
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

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar pagamento");
      }

      if (user.payment_id) {
        toast.success("Pagamento atualizado com sucesso!");
      } else {
        toast.success("Pagamento criado com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar pagamento:", error);
      toast.error(error.message || "Erro ao salvar informações do pagamento");
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

        <div className="space-y-6 py-4">
          {/* Informações do Usuário */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Informações do Cliente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-600 font-medium">Nome Completo</Label>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{user.nome_completo}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600 font-medium">Email</Label>
                <p className="text-sm text-gray-700 mt-0.5">{user.email}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600 font-medium">Contrato Aceito</Label>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{user.aceitou_contrato}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600 font-medium">Telefone</Label>
                <p className="text-sm text-gray-700 mt-0.5">{user.telefone}</p>
              </div>
            </div>
          </div>

          {/* Status de Pagamento */}
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
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Pendente (Stripe)">Pendente (Stripe)</SelectItem>
                <SelectItem value="Pendente (InfinitePay)">Pendente (InfinitePay)</SelectItem>
                <SelectItem value="Redirecionado (Zelle)">Redirecionado (Zelle)</SelectItem>
                <SelectItem value="Redirecionado (InfinitePay)">Redirecionado (InfinitePay)</SelectItem>
                <SelectItem value="Não pagou">Não pagou</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Valor e Moeda */}
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

          {/* Método de Pagamento */}
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
              </SelectContent>
            </Select>
          </div>

          {/* Data e Hora do Pagamento */}
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

          {/* Notas */}
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

          {/* Informações Adicionais */}
          {user.payment_id && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Payment ID:</strong> {user.payment_id}
              </p>
              {user.stripe_session_id && (
                <p className="text-xs text-blue-700 mt-1">
                  <strong>Stripe Session:</strong> {user.stripe_session_id.substring(0, 20)}...
                </p>
              )}
            </div>
          )}
        </div>

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

