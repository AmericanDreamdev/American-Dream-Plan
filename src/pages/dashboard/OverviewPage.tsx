import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";
import { DashboardStats } from "@/types/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";

interface OverviewPageProps {
  stats: DashboardStats;
}

export const OverviewPage = ({ stats }: OverviewPageProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Visão Geral</h1>
        <p className="text-gray-500 mt-1">Resumo completo do sistema</p>
      </div>

      {/* Stats Cards */}
      <DashboardStatsCards stats={stats} />

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-gray-200 bg-gray-900">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Taxa de Conversão</CardTitle>
            <CardDescription className="text-gray-300">Contratos aceitos vs Total de leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-3xl font-bold text-white">
                  {stats.totalLeads > 0 && stats.totalContracts !== undefined
                    ? ((stats.totalContracts / stats.totalLeads) * 100).toFixed(1)
                    : 0}%
                </div>
                <p className="text-sm text-gray-300 mt-1">
                  {stats.totalContracts || 0} de {stats.totalLeads} leads
                </p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-900">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Taxa de Pagamento</CardTitle>
            <CardDescription className="text-gray-300">Pagamentos confirmados vs Contratos aceitos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-3xl font-bold text-white">
                  {stats.totalContracts > 0 && stats.totalPaid !== undefined
                    ? ((stats.totalPaid / stats.totalContracts) * 100).toFixed(1)
                    : 0}%
                </div>
                <p className="text-sm text-gray-300 mt-1">
                  {stats.totalPaid || 0} de {stats.totalContracts || 0} contratos
                </p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

