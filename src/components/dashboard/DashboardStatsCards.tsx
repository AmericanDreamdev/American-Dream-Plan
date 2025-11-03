import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { DashboardStats } from "@/types/dashboard";

interface DashboardStatsCardsProps {
  stats: DashboardStats;
}

export const DashboardStatsCards = ({ stats }: DashboardStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-gray-700">Total de Leads</CardTitle>
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-gray-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{stats.totalLeads}</div>
          <p className="text-xs text-gray-500 mt-1">Total de cadastros</p>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-gray-700">Contratos Aceitos</CardTitle>
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-gray-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{stats.totalContracts}</div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.totalLeads > 0 ? Math.round((stats.totalContracts / stats.totalLeads) * 100) : 0}% conversão
          </p>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-gray-700">Pagamentos Confirmados</CardTitle>
          <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{stats.totalPaid}</div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.totalContracts > 0 ? Math.round((stats.totalPaid / stats.totalContracts) * 100) : 0}% taxa de pagamento
          </p>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-gray-700">Pendentes</CardTitle>
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Clock className="h-5 w-5 text-gray-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{stats.totalPending}</div>
          <p className="text-xs text-gray-500 mt-1">Aguardando confirmação</p>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-gray-700">Não Pagaram</CardTitle>
          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">{stats.totalNotPaid}</div>
          <p className="text-xs text-gray-500 mt-1">Sem pagamento</p>
        </CardContent>
      </Card>
    </div>
  );
};

