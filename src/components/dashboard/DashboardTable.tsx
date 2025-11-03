import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { DashboardUser } from "@/types/dashboard";
import { DashboardTableRow } from "./DashboardTableRow";
import { getStatusBadge } from "./DashboardBadge";

interface DashboardTableProps {
  users: DashboardUser[];
  showEmptyMessage?: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
  columns: number;
}

export const DashboardTable = ({
  users,
  showEmptyMessage = true,
  emptyMessage = "Nenhum usuário encontrado",
  emptySubMessage,
  columns,
}: DashboardTableProps) => {
  if (users.length === 0 && showEmptyMessage) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={columns} className="text-center py-12 text-gray-600 bg-white">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-base font-medium text-gray-900">{emptyMessage}</p>
              {emptySubMessage && (
                <p className="text-sm text-gray-500 mt-1">{emptySubMessage}</p>
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableBody>
        {users.map((user) => (
          <DashboardTableRow key={user.lead_id} user={user} />
        ))}
      </TableBody>
    </Table>
  );
};

// Tabela completa com todas as colunas
interface DashboardFullTableProps {
  users: DashboardUser[];
  totalUsers: number;
  searchTerm?: string;
}

export const DashboardFullTable = ({ users, totalUsers, searchTerm }: DashboardFullTableProps) => {
  return (
    <div className="px-6 pb-6">
      <div className="text-sm text-gray-500 mb-4">
        Mostrando {users.length} de {totalUsers} usuários
      </div>
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 bg-gray-50">
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Nome</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Email</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Telefone</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Data Formulário</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Contrato</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Data Contrato</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Status Pagamento</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Valor</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Método</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Data Pagamento</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Status Geral</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-12 text-gray-600 bg-white">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-base font-medium text-gray-900">Nenhum usuário encontrado</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchTerm ? "Tente uma busca diferente" : "Não há usuários nesta categoria"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <DashboardTableRow key={user.lead_id} user={user} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Tabela simplificada para Pagos
export const DashboardPaidTable = ({ users }: { users: DashboardUser[] }) => {
  const paidUsers = users.filter((u) => u.is_confirmado_pago === true);

  return (
    <div className="px-6 pb-6">
      <div className="text-sm text-gray-500 mb-4">
        Mostrando {paidUsers.length} usuários que pagaram
      </div>
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 bg-gray-50">
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Nome</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Email</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Status Pagamento</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Valor</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Método</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Data Pagamento</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Confirmado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paidUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-600 bg-white">
                  Nenhum pagamento confirmado encontrado
                </TableCell>
              </TableRow>
            ) : (
              paidUsers.map((user) => (
                <TableRow key={user.lead_id} className="border-gray-200 bg-white hover:bg-gray-50">
                  <TableCell className="font-semibold text-gray-900 py-3 px-4">{user.nome_completo}</TableCell>
                  <TableCell className="text-gray-700 py-3 px-4">{user.email}</TableCell>
                  <TableCell className="py-3 px-4">{getStatusBadge(user.status_pagamento_formatado)}</TableCell>
                  <TableCell className="font-semibold text-green-600 py-3 px-4">{user.valor_formatado || '-'}</TableCell>
                  <TableCell className="text-gray-700 py-3 px-4">{user.metodo_pagamento_formatado || '-'}</TableCell>
                  <TableCell className="text-gray-600 py-3 px-4 text-sm">
                    {user.data_pagamento_formatada || '-'}
                    {user.stripe_session_id && (
                      <div className="text-xs text-gray-400 mt-1">
                        Session: {user.stripe_session_id.substring(0, 15)}...
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <Badge className="bg-green-600 text-white text-xs border-0">
                      ✓ Confirmado
                    </Badge>
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

// Tabela simplificada para Pendentes
export const DashboardPendingTable = ({ users }: { users: DashboardUser[] }) => {
  const pendingUsers = users.filter((u) => u.status_pagamento_formatado === "Pendente");

  return (
    <div className="px-6 pb-6">
      <div className="text-sm text-gray-500 mb-4">
        Mostrando {pendingUsers.length} pagamentos pendentes
      </div>
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 bg-gray-50">
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Nome</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Email</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12 text-gray-600 bg-white">
                  Nenhum pagamento pendente
                </TableCell>
              </TableRow>
            ) : (
              pendingUsers.map((user) => (
                <TableRow key={user.lead_id} className="border-gray-200 bg-white hover:bg-gray-50">
                  <TableCell className="font-semibold text-gray-900 py-3 px-4">{user.nome_completo}</TableCell>
                  <TableCell className="text-gray-700 py-3 px-4">{user.email}</TableCell>
                  <TableCell className="text-gray-600 py-3 px-4 text-sm">{user.data_formulario_formatada}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Tabela simplificada para Não Pagaram
export const DashboardNotPaidTable = ({ users }: { users: DashboardUser[] }) => {
  const notPaidUsers = users.filter((u) => {
    const status = u.status_pagamento_formatado || '';
    return !u.is_confirmado_pago && (
      status === "Não pagou" ||
      status === "Redirecionado (InfinitePay)" ||
      status === ''
    );
  });

  return (
    <div className="px-6 pb-6">
      <div className="text-sm text-gray-500 mb-4">
        Mostrando {notPaidUsers.length} usuários que não pagaram
      </div>
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 bg-gray-50">
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Nome</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Email</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Contrato</TableHead>
              <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notPaidUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-gray-600 bg-white">
                  Todos os usuários pagaram!
                </TableCell>
              </TableRow>
            ) : (
              notPaidUsers.map((user) => (
                <TableRow key={user.lead_id} className="border-gray-200 bg-white hover:bg-gray-50">
                  <TableCell className="font-semibold text-gray-900 py-3 px-4">{user.nome_completo}</TableCell>
                  <TableCell className="text-gray-700 py-3 px-4">{user.email}</TableCell>
                  <TableCell className="py-3 px-4">
                    <Badge
                      variant={user.aceitou_contrato === 'Sim' ? 'default' : 'outline'}
                      className="text-xs bg-gray-100 text-gray-700 border-gray-300"
                    >
                      {user.aceitou_contrato}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 py-3 px-4 text-sm">{user.data_formulario_formatada}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

