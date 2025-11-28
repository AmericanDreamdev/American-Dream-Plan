import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Eye, Link2, Copy, Check, Edit, CheckCircle2 } from "lucide-react";
import { DashboardUser } from "@/types/dashboard";
import { getStatusBadge } from "./DashboardBadge";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { EditUserModal } from "./EditUserModal";

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

  return (
    <TableRow key={user.lead_id} className="border-gray-200 bg-white hover:bg-blue-50/30 transition-colors">
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
        <div className="flex flex-col gap-1">
          {getStatusBadge(user.status_pagamento_formatado)}
          {user.valor_formatado && (
            <span className="text-xs font-medium text-gray-900">{user.valor_formatado}</span>
          )}
          {user.metodo_pagamento_formatado && (
            <span className="text-[10px] text-gray-500">{user.metodo_pagamento_formatado}</span>
          )}
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
  );
};

