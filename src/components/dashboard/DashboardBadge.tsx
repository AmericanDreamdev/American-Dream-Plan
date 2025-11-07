import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";

interface DashboardBadgeProps {
  status: string;
}

export const getStatusBadge = (status: string) => {
  // Pago - Verde suave e discreto
  if (status.includes('Pago') || status.includes('Completo')) {
    const method = status.includes('Stripe') ? 'Stripe' : 
                   status.includes('PIX') ? 'PIX' : 
                   status.includes('Zelle') ? 'Zelle' : 
                   status.includes('InfinitePay') ? 'InfinitePay' : '';
    return (
      <Badge className="bg-emerald-50/50 text-emerald-600 border border-emerald-100 hover:bg-emerald-50 transition-colors text-xs font-medium px-2.5 py-1">
        <CheckCircle2 className="h-3 w-3 mr-1.5 inline text-emerald-600" />
        {method ? `Pago (${method})` : status}
      </Badge>
    );
  }
  
  // Pendente - Cinza azulado suave
  if (status.includes('Pendente')) {
    const method = status.includes('Stripe') ? 'Stripe' : 
                   status.includes('InfinitePay') ? 'InfinitePay' : '';
    return (
      <Badge className="bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors text-xs font-medium px-2.5 py-1 text-slate-600">
        <Clock className="h-3 w-3 mr-1.5 inline text-slate-500" />
        {method ? `Pendente (${method})` : status}
      </Badge>
    );
  }
  
  // Não pagou - Cinza neutro (não vermelho)
  if (status.includes('Não pagou') || status.includes('Sem Pagamento')) {
    return (
      <Badge className="bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-xs font-medium px-2.5 py-1 text-gray-600">
        <XCircle className="h-3 w-3 mr-1.5 inline text-gray-400" />
        {status}
      </Badge>
    );
  }
  
  // Redirecionado - Azul suave
  if (status.includes('Redirecionado')) {
    const method = status.includes('Zelle') ? 'Zelle' : 
                   status.includes('InfinitePay') ? 'InfinitePay' : '';
    return (
      <Badge className="bg-blue-50/50 text-blue-600 border border-blue-100 hover:bg-blue-50 transition-colors text-xs font-medium px-2.5 py-1">
        <ArrowRight className="h-3 w-3 mr-1.5 inline text-blue-500" />
        {method ? `Redirecionado (${method})` : status}
      </Badge>
    );
  }
  
  // Default - Cinza neutro
  return (
    <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors text-xs font-medium px-2.5 py-1">
      {status}
    </Badge>
  );
};

