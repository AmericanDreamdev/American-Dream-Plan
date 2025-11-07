import { EnhancedStatsCards } from "@/components/dashboard/EnhancedStatsCards";
import { DashboardStats } from "@/types/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";

interface OverviewPageProps {
  stats: DashboardStats;
}

export const OverviewPage = ({ stats }: OverviewPageProps) => {
  const conversionRate = stats.totalLeads > 0 && stats.totalContracts !== undefined
    ? ((stats.totalContracts / stats.totalLeads) * 100).toFixed(1)
    : 0;
  
  const paymentRate = stats.totalContracts > 0 && stats.totalPaid !== undefined
    ? ((stats.totalPaid / stats.totalContracts) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <EnhancedStatsCards stats={stats} />

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle as="h4" className="text-lg font-semibold text-gray-900">Taxa de Conversão</CardTitle>
            <CardDescription className="text-sm text-gray-500">Contratos aceitos vs Total de leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-4xl font-light text-gray-900 mb-2">
                  {conversionRate}%
                </div>
                <p className="text-sm text-gray-500">
                  {stats.totalContracts || 0} de {stats.totalLeads} leads
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-full">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
          <div className="px-6 pb-4 pt-0 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
              <TrendingUp className="h-3 w-3" />
              <span>Taxa de conversão de leads</span>
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle as="h4" className="text-lg font-semibold text-gray-900">Taxa de Pagamento</CardTitle>
            <CardDescription className="text-sm text-gray-500">Pagamentos confirmados vs Contratos aceitos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-4xl font-light text-gray-900 mb-2">
                  {paymentRate}%
                </div>
                <p className="text-sm text-gray-500">
                  {stats.totalPaid || 0} de {stats.totalContracts || 0} contratos
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-full">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
          <div className="px-6 pb-4 pt-0 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
              <DollarSign className="h-3 w-3" />
              <span>Taxa de pagamento confirmado</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

