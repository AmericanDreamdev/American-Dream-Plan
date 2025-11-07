import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Users, FileText, CheckCircle2, Clock, XCircle, TrendingUp } from "lucide-react";
import { DashboardStats } from "@/types/dashboard";

interface EnhancedStatsCardsProps {
  stats: DashboardStats;
}

export const EnhancedStatsCards = ({ stats }: EnhancedStatsCardsProps) => {
  const cards = [
    {
      title: "Total de Leads",
      value: stats.totalLeads,
      subtitle: "Total de cadastros",
      icon: Users,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50",
      footer: "Todos os leads",
      footerIcon: <TrendingUp className="h-3 w-3" />,
    },
    {
      title: "Contratos Aceitos",
      value: stats.totalContracts,
      subtitle: `${stats.totalLeads > 0 ? Math.round((stats.totalContracts / stats.totalLeads) * 100) : 0}% conversão`,
      icon: FileText,
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
      footer: "Contratos assinados",
      footerIcon: <FileText className="h-3 w-3" />,
    },
    {
      title: "Pagamentos Confirmados",
      value: stats.totalPaid,
      subtitle: `${stats.totalContracts > 0 ? Math.round((stats.totalPaid / stats.totalContracts) * 100) : 0}% taxa de pagamento`,
      icon: CheckCircle2,
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
      footer: "Pagamentos recebidos",
      footerIcon: <CheckCircle2 className="h-3 w-3" />,
    },
    {
      title: "Pendentes",
      value: stats.totalPending,
      subtitle: "Aguardando confirmação",
      icon: Clock,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50",
      footer: "Em análise",
      footerIcon: <Clock className="h-3 w-3" />,
    },
    {
      title: "Não Pagaram",
      value: stats.totalNotPaid,
      subtitle: "Sem pagamento",
      icon: XCircle,
      iconColor: "text-red-600",
      iconBg: "bg-red-50",
      footer: "Sem confirmação",
      footerIcon: <XCircle className="h-3 w-3" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="card-stats border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">{card.title}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
                  <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                </div>
                <div className={`${card.iconBg} rounded-full p-3 flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
            <div className="px-4 pb-3 pt-0 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
                {card.footerIcon}
                <span>{card.footer}</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

