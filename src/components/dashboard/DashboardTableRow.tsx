import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Eye, Link2, Copy, Check } from "lucide-react";
import { DashboardUser } from "@/types/dashboard";
import { getStatusBadge } from "./DashboardBadge";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface DashboardTableRowProps {
  user: DashboardUser;
}

export const DashboardTableRow = ({ user }: DashboardTableRowProps) => {
  const navigate = useNavigate();
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const generateConsultationLink = async () => {
    setIsGeneratingLink(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

      const response = await fetch(
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
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao gerar link");
      }

      // Construir URL completa usando window.location.origin
      const fullLink = result.link.startsWith('http') 
        ? result.link 
        : `${window.location.origin}${result.link}`;
      setGeneratedLink(fullLink);
      setIsLinkDialogOpen(true);
      toast.success("Link gerado com sucesso!");
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
  
  return (
    <TableRow key={user.lead_id} className="border-gray-200 bg-white hover:bg-gray-50 transition-colors">
      <TableCell className="font-medium text-gray-900 py-2.5 px-3 text-sm max-w-[140px] truncate" title={user.nome_completo}>
        {user.nome_completo}
      </TableCell>
      <TableCell className="text-gray-700 py-2.5 px-3 text-sm max-w-[160px] truncate" title={user.email}>
        {user.email}
      </TableCell>
      <TableCell className="text-gray-700 py-2.5 px-3 text-xs whitespace-nowrap">{user.telefone}</TableCell>
      <TableCell className="py-2.5 px-3">
        <Badge
          variant={user.aceitou_contrato === 'Sim' ? 'default' : 'outline'}
          className={`text-xs ${
            user.aceitou_contrato === 'Sim' 
              ? 'bg-blue-100 text-blue-700 border-blue-300' 
              : 'bg-gray-100 text-gray-600 border-gray-300'
          }`}
        >
          {user.aceitou_contrato}
        </Badge>
      </TableCell>
      <TableCell className="text-gray-600 py-2.5 px-3 text-xs whitespace-nowrap">
        <div>{user.data_aceitacao_formatada || '-'}</div>
        {user.is_brazilian && user.pdf_generated_at_formatted && (
          <div className="text-[10px] text-gray-500 mt-0.5">
            PDF: {user.pdf_generated_at_formatted}
          </div>
        )}
      </TableCell>
      <TableCell className="py-2.5 px-3">{getStatusBadge(user.status_pagamento_formatado)}</TableCell>
      <TableCell className="font-medium text-gray-900 py-2.5 px-3 text-xs whitespace-nowrap">
        {user.valor_formatado || '-'}
      </TableCell>
      <TableCell className="text-gray-700 py-2.5 px-3 text-xs whitespace-nowrap">{user.metodo_pagamento_formatado || '-'}</TableCell>
      <TableCell className="text-gray-600 py-2.5 px-3 text-xs whitespace-nowrap">
        {user.data_pagamento_formatada || '-'}
      </TableCell>
      <TableCell className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          {user.consultation_form_id ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs text-gray-700 hover:bg-gray-100 border-gray-300 whitespace-nowrap"
              onClick={() => navigate(`/dashboard/consultation-form/${user.consultation_form_id}`)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs text-gray-700 hover:bg-gray-100 border-gray-300 whitespace-nowrap"
                onClick={generateConsultationLink}
                disabled={isGeneratingLink}
              >
                <Link2 className="h-3 w-3 mr-1" />
                {isGeneratingLink ? "Gerando..." : "Gerar Link"}
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
      <TableCell className="py-2.5 px-3 max-w-[180px]">
        <Badge variant="outline" className="text-xs bg-white border-gray-300 text-gray-700 truncate block" title={user.status_geral}>
          {user.status_geral}
        </Badge>
        {user.is_confirmado_pago && (
          <Badge className="mt-1 bg-green-100 text-green-700 text-xs border-0">
            ✓ Confirmado
          </Badge>
        )}
      </TableCell>
      <TableCell className="py-2.5 px-3">
        {user.url_contrato_pdf ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 text-gray-700 hover:bg-gray-100"
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
                // Fallback: abrir em nova aba se o download falhar
                window.open(user.url_contrato_pdf!, '_blank');
              }
            }}
            title="Baixar PDF"
          >
            <Download className="h-3 w-3" />
          </Button>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </TableCell>
    </TableRow>
  );
};

