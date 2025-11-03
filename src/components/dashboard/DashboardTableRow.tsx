import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DashboardUser } from "@/types/dashboard";
import { getStatusBadge } from "./DashboardBadge";

interface DashboardTableRowProps {
  user: DashboardUser;
}

export const DashboardTableRow = ({ user }: DashboardTableRowProps) => {
  return (
    <TableRow key={user.lead_id} className="border-gray-200 bg-white hover:bg-gray-50 transition-colors">
      <TableCell className="font-semibold text-gray-900 py-3 px-4">{user.nome_completo}</TableCell>
      <TableCell className="text-gray-700 py-3 px-4">{user.email}</TableCell>
      <TableCell className="text-gray-700 py-3 px-4">{user.telefone}</TableCell>
      <TableCell className="text-gray-600 py-3 px-4 text-sm">{user.data_formulario_formatada}</TableCell>
      <TableCell className="py-3 px-4">
        <Badge
          variant={user.aceitou_contrato === 'Sim' ? 'default' : 'outline'}
          className="text-xs bg-gray-100 text-gray-700 border-gray-300"
        >
          {user.aceitou_contrato}
        </Badge>
      </TableCell>
      <TableCell className="text-gray-600 py-3 px-4 text-sm">
        {user.data_aceitacao_formatada || '-'}
        {user.is_brazilian && user.pdf_generated_at_formatted && (
          <div className="text-xs text-blue-600 mt-1">
            PDF: {user.pdf_generated_at_formatted}
          </div>
        )}
      </TableCell>
      <TableCell className="py-3 px-4">{getStatusBadge(user.status_pagamento_formatado)}</TableCell>
      <TableCell className="font-semibold text-gray-900 py-3 px-4">
        {user.valor_formatado || '-'}
      </TableCell>
      <TableCell className="text-gray-700 py-3 px-4 text-sm">{user.metodo_pagamento_formatado || '-'}</TableCell>
      <TableCell className="text-gray-600 py-3 px-4 text-sm">
        {user.data_pagamento_formatada || '-'}
        {user.stripe_session_id && (
          <div className="text-xs text-gray-400 mt-1">
            Stripe: {user.stripe_session_id.substring(0, 20)}...
          </div>
        )}
        {user.infinitepay_url && (
          <div className="text-xs text-blue-600 mt-1">
            <a href={user.infinitepay_url} target="_blank" rel="noopener noreferrer" className="underline">
              InfinitePay URL
            </a>
          </div>
        )}
      </TableCell>
      <TableCell className="py-3 px-4">
        <Badge variant="outline" className="text-xs bg-white border-gray-300 text-gray-700">
          {user.status_geral}
        </Badge>
        {user.is_confirmado_pago && (
          <Badge className="ml-2 bg-green-100 text-green-700 text-xs border-0">
            ✓ Confirmado
          </Badge>
        )}
      </TableCell>
      <TableCell className="py-3 px-4">
        {user.url_contrato_pdf ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 text-gray-700 hover:bg-gray-100"
            onClick={() => window.open(user.url_contrato_pdf!, '_blank')}
          >
            <Download className="h-4 w-4" />
          </Button>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>
    </TableRow>
  );
};

