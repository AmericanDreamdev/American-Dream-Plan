import { Badge } from "@/components/ui/badge";

interface DashboardBadgeProps {
  status: string;
}

export const getStatusBadge = (status: string) => {
  if (status.includes('Pago') || status.includes('Completo')) {
    return <Badge className="bg-green-600 text-white border-0">{status}</Badge>;
  }
  if (status.includes('Pendente')) {
    return <Badge className="bg-gray-400 text-white border-0">{status}</Badge>;
  }
  if (status.includes('Não pagou') || status.includes('Sem Pagamento')) {
    return <Badge className="bg-red-600 text-white border-0">{status}</Badge>;
  }
  if (status.includes('Redirecionado')) {
    return <Badge className="bg-gray-400 text-white border-0">{status}</Badge>;
  }
  return <Badge variant="outline" className="border-gray-300 bg-white text-gray-700">{status}</Badge>;
};

