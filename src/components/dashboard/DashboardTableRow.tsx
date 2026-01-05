import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Eye, Link2, Copy, Check, Edit, CheckCircle2, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { DashboardUser } from "@/types/dashboard";
import { getStatusBadge } from "./DashboardBadge";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { EditUserModal } from "./EditUserModal";
import { ClientPlanView } from "./ClientPlanView";
import { MeetingManager } from "./MeetingManager";
import { ClientPlanForm } from "./ClientPlanForm";

interface DashboardTableRowProps {
  user: DashboardUser;
  onUpdate?: () => void;
}

export const DashboardTableRow = ({ user, onUpdate }: DashboardTableRowProps) => {
  const navigate = useNavigate();
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Estados para link da segunda parte
  const [secondPaymentLink, setSecondPaymentLink] = useState<string | null>(null);
  const [isSecondPaymentDialogOpen, setIsSecondPaymentDialogOpen] = useState(false);
  const [secondPaymentLinkCopied, setSecondPaymentLinkCopied] = useState(false);
  
  // Estado para expansão da linha
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);

  const generateConsultationLink = async () => {
    setIsGeneratingLink(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        setIsGeneratingLink(false);
        return;
      }

      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

      let response: Response;
      try {
        response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-consultation-link-for-lead`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              lead_id: user.lead_id,
            }),
            signal: controller.signal,
          }
        );
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error("Tempo de espera esgotado. Tente novamente.");
        }
        throw fetchError;
      }
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = "Erro ao gerar link";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Se não conseguir parsear JSON, usar mensagem padrão
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erro ao gerar link");
      }

      // Construir URL completa usando window.location.origin
      const fullLink = result.link.startsWith('http') 
        ? result.link 
        : `${window.location.origin}${result.link}`;
      setGeneratedLink(fullLink);
      setIsLinkDialogOpen(true);
      
      // Mostrar mensagem de sucesso com informação sobre email
      if (result.email_sent) {
        toast.success("Link gerado e email enviado com sucesso!");
      } else {
        toast.success("Link gerado com sucesso! (Email não enviado - verifique se o lead tem email cadastrado)");
      }
    } catch (error: any) {
      console.error("Erro ao gerar link:", error);
      toast.error(error.message || "Erro ao gerar link de consultoria");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyLinkToClipboard = async () => {
    if (!generatedLink) return;
    
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      toast.error("Erro ao copiar link");
    }
  };

  // Gerar link da segunda parte do pagamento
  const generateSecondPaymentLink = () => {
    if (!user.lead_id || !user.term_acceptance_id) {
      toast.error("Lead não possui term_acceptance_id. É necessário aceitar os termos primeiro.");
      return;
    }

    // Construir URL da segunda parte
    const baseUrl = window.location.origin;
    const secondPaymentUrl = `${baseUrl}/parcela-2-2?lead_id=${user.lead_id}&term_acceptance_id=${user.term_acceptance_id}`;
    
    setSecondPaymentLink(secondPaymentUrl);
    setIsSecondPaymentDialogOpen(true);
    toast.success("Link da segunda parte gerado com sucesso!");
  };

  const copySecondPaymentLink = async () => {
    if (!secondPaymentLink) return;
    
    try {
      await navigator.clipboard.writeText(secondPaymentLink);
      setSecondPaymentLinkCopied(true);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setSecondPaymentLinkCopied(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      toast.error("Erro ao copiar link");
    }
  };
  
  // Formatar data de forma mais compacta (extrair apenas dia/mês de strings formatadas)
  const formatCompactDate = (dateStr: string | null) => {
    if (!dateStr || dateStr === '-') return '-';
    // Se já está no formato DD/MM/YYYY, extrair apenas DD/MM
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
    // Tentar parsear como data ISO
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      }
    } catch {
      // Ignorar erro
    }
    return dateStr;
  };

  // Permitir expandir sempre para que o admin possa gerenciar reuniões e planos
  const hasExpandableContent = true;

  return (
    <>
      <TableRow key={user.lead_id} className="border-gray-200 bg-white hover:bg-blue-50/30 transition-colors">
        {/* Botão de expansão */}
        <TableCell className="py-2 px-2 w-10">
          {hasExpandableContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </TableCell>
        <TableCell className="font-medium text-gray-900 py-2 px-2 text-sm truncate" title={user.nome_completo}>
          {user.nome_completo}
        </TableCell>
      <TableCell className="text-gray-700 py-2 px-2 text-sm truncate hidden lg:table-cell" title={user.email}>
        {user.email}
      </TableCell>
      <TableCell className="text-gray-700 py-2 px-2 text-xs whitespace-nowrap hidden xl:table-cell" title={user.telefone}>
        {user.telefone}
      </TableCell>
      <TableCell className="py-2 px-2">
        <Badge
          variant={user.aceitou_contrato === 'Sim' ? 'default' : 'outline'}
          className={`text-xs font-medium px-2.5 py-1 transition-colors ${
            user.aceitou_contrato === 'Sim' 
              ? 'bg-blue-50/50 text-blue-600 border border-blue-100 hover:bg-blue-50' 
              : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          {user.aceitou_contrato === 'Sim' ? '✓ Aceito' : 'Não aceito'}
        </Badge>
      </TableCell>
      <TableCell className="text-gray-600 py-2 px-2 text-xs whitespace-nowrap hidden xl:table-cell" title={user.data_aceitacao_formatada || ''}>
        <div>{formatCompactDate(user.data_aceitacao_formatada)}</div>
        {user.is_brazilian && user.pdf_generated_at_formatted && (
          <div className="text-[10px] text-gray-500 mt-0.5">
            PDF
          </div>
        )}
      </TableCell>
      <TableCell className="py-2 px-2">
        <div className="flex flex-col gap-2 min-w-[140px]">
          {/* 1ª Parcela */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              1ª Parcela
              {user.metodo_pagamento_formatado && (
                 <span className="font-normal text-[9px] text-gray-300">{user.metodo_pagamento_formatado}</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {getStatusBadge(user.status_pagamento_formatado)}
              {user.valor_formatado && (
                <span className="text-xs font-semibold text-gray-700">{user.valor_formatado}</span>
              )}
            </div>
          </div>

          {/* 2ª Parcela */}
          <div className="flex flex-col gap-1 border-t border-dashed border-gray-200 pt-2">
             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              2ª Parcela
              {user.metodo_pagamento_segunda_parte_formatado && (
                 <span className="font-normal text-[9px] text-gray-300">{user.metodo_pagamento_segunda_parte_formatado}</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {user.status_pagamento_segunda_parte_formatado ? (
                <>
                  {getStatusBadge(user.status_pagamento_segunda_parte_formatado)}
                  {user.valor_segunda_parte_formatado && (
                    <span className="text-xs font-semibold text-gray-700">{user.valor_segunda_parte_formatado}</span>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-400 italic">Pendente</span>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-2 px-2">
        <div className="flex items-center gap-1">
          {user.consultation_form_id ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs text-gray-700 hover:bg-gray-100 border-gray-300"
              onClick={() => navigate(`/dashboard/consultation-form/${user.consultation_form_id}`)}
              title="Ver formulário"
            >
              <Eye className="h-3 w-3" />
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs text-gray-700 hover:bg-gray-100 border-gray-300"
                onClick={generateConsultationLink}
                disabled={isGeneratingLink}
                title="Gerar link de consultoria"
              >
                <Link2 className="h-3 w-3" />
              </Button>
              <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Link de Consultoria Gerado</DialogTitle>
                    <DialogDescription>
                      Envie este link para o usuário preencher o formulário de consultoria.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        value={generatedLink || ""}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyLinkToClipboard}
                        className="whitespace-nowrap"
                      >
                        {linkCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Este link expira em 30 dias e pode ser usado apenas uma vez.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </TableCell>
      <TableCell className="py-2 px-2 hidden xl:table-cell">
        <div className="flex flex-col gap-1.5">
          <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors font-medium px-2.5 py-1 truncate max-w-[120px]" title={user.status_geral}>
            {user.status_geral}
          </Badge>
          {user.is_confirmado_pago && (
            <Badge className="bg-emerald-50/50 text-emerald-600 border border-emerald-100 hover:bg-emerald-50 transition-colors text-xs font-medium px-2 py-0.5 w-fit">
              <CheckCircle2 className="h-3 w-3 mr-1 inline text-emerald-600" />
              Confirmado
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="py-2 px-2">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-200"
            onClick={() => setIsEditModalOpen(true)}
            title="Editar informações de pagamento"
          >
            <Edit className="h-3 w-3" />
          </Button>
          {user.term_acceptance_id && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0 text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200"
              onClick={generateSecondPaymentLink}
              title="Gerar link da segunda parte do pagamento"
            >
              <DollarSign className="h-3 w-3" />
            </Button>
          )}
          {user.url_contrato_pdf && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-gray-600 hover:bg-gray-100"
              onClick={async () => {
                try {
                  const response = await fetch(user.url_contrato_pdf!);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `contrato-${user.nome_completo.replace(/\s+/g, '-')}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                } catch (error) {
                  console.error('Erro ao baixar PDF:', error);
                  window.open(user.url_contrato_pdf!, '_blank');
                }
              }}
              title="Baixar PDF do contrato"
            >
              <Download className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TableCell>

      {/* Dialog para link da segunda parte */}
      <Dialog open={isSecondPaymentDialogOpen} onOpenChange={setIsSecondPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link da Parcela 2/2 American Dream</DialogTitle>
            <DialogDescription>
              Envie este link para o usuário realizar o pagamento da segunda parcela (US$ 1.999,00).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={secondPaymentLink || ""}
                readOnly
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={copySecondPaymentLink}
                className="whitespace-nowrap"
              >
                {secondPaymentLinkCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 font-medium mb-1">Informações do Link:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Valor: US$ 1.999,00 (segunda parte)</li>
                <li>• Métodos disponíveis: Cartão, PIX, Zelle</li>
                <li>• Válido para: {user.nome_completo}</li>
                <li>• Email: {user.email}</li>
              </ul>
            </div>
            <p className="text-xs text-gray-500">
              Este link permite que o usuário acesse diretamente a página de pagamento da segunda parte.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <EditUserModal
        user={user}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={() => {
          if (onUpdate) {
            onUpdate();
          }
        }}
      />
    </TableRow>
    
    {/* Linha expandida com reuniões e planejamento */}
    <TableRow className="bg-gray-50" aria-hidden={!isExpanded}>
      <TableCell colSpan={10} className="p-6">
        <div
          className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
          style={{ maxHeight: isExpanded ? '5000px' : '0px', opacity: isExpanded ? 1 : 0 }}
        >
          <div className="space-y-6">
            {/* Reuniões */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Reuniões</h3>
              <MeetingManager
                leadId={user.lead_id}
                firstMeeting={user.first_meeting}
                secondMeeting={user.second_meeting}
                onUpdate={onUpdate}
                leadName={user.nome_completo}
                leadEmail={user.email}
              />
            </div>

            {/* Planejamento */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Planejamento Individualizado</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPlanFormOpen(true)}
                  className="h-8 text-xs"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  {user.client_plan ? "Editar Plano" : "Criar Plano"}
                </Button>
              </div>

              {user.client_plan ? (
                <ClientPlanView 
                  plan={user.client_plan} 
                  leadId={user.lead_id} 
                  onUpdate={onUpdate}
                />
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-white">
                  <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Nenhum planejamento criado para este cliente.</p>
                  <Button
                    variant="link"
                    className="text-blue-600 font-semibold"
                    onClick={() => setIsPlanFormOpen(true)}
                  >
                    Clique aqui para começar o planejamento
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </TableCell>
    </TableRow>

    {/* Modal de Formulário de Plano */}
    <ClientPlanForm
      leadId={user.lead_id}
      plan={user.client_plan}
      open={isPlanFormOpen}
      onOpenChange={setIsPlanFormOpen}
      onSuccess={() => {
        if (onUpdate) onUpdate();
      }}
    />
    </>
  );
};

