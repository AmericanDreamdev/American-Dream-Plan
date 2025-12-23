import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ConsultationFormsTableProps {
  forms: Array<{
    id: string;
    lead_id: string;
    payment_id: string;
    nome_completo: string;
    email: string;
    telefone: string;
    objetivo_principal: string | null;
    tipo_visto_desejado: string | null;
    created_at: string;
    lead_name?: string;
    lead_email?: string;
  }>;
  searchTerm?: string;
}

export const ConsultationFormsTable = ({ forms, searchTerm }: ConsultationFormsTableProps) => {
  const navigate = useNavigate();
  
  const filteredForms = forms.filter((form) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      form.nome_completo?.toLowerCase().includes(search) ||
      form.email?.toLowerCase().includes(search) ||
      form.telefone?.toLowerCase().includes(search) ||
      form.lead_name?.toLowerCase().includes(search) ||
      form.lead_email?.toLowerCase().includes(search)
    );
  });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="px-6">
      <div className="text-sm text-gray-500 mb-4">
        Mostrando {filteredForms.length} de {forms.length} formulários
      </div>
      <div className="overflow-x-auto border-0 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 bg-gray-50">
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Nome</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Email</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Telefone</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Objetivo</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Tipo de Visto</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Data de Envio</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredForms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-600 bg-white">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-base font-medium text-gray-900">Nenhum formulário encontrado</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchTerm ? "Tente uma busca diferente" : "Não há formulários de consultoria submetidos"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredForms.map((form) => (
                <TableRow key={form.id} className="border-gray-200 hover:bg-gray-50">
                  <TableCell className="py-3 px-4 text-sm text-gray-900">
                    {form.nome_completo || form.lead_name || "N/A"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-600">
                    {form.email || form.lead_email || "N/A"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-600">
                    {form.telefone || "N/A"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-600">
                    {form.objetivo_principal ? (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                        {form.objetivo_principal.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-600">
                    {form.tipo_visto_desejado ? (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                        {form.tipo_visto_desejado.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-600">
                    {formatDate(form.created_at)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/consultation-form/${form.id}`)}
                        className="flex items-center gap-1 border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                      >
                        <Eye className="h-3 w-3" />
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open("https://calendly.com/contato-brantimmigration/30min", "_blank");
                        }}
                        className="flex items-center gap-1 border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Calendly
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
