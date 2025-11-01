import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Download, RefreshCw, Users, FileText, DollarSign, CheckCircle2, XCircle, Clock, Search, TrendingUp, AlertCircle, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface DashboardUser {
  lead_id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  data_formulario_formatada: string;
  term_acceptance_id: string | null;
  data_aceitacao_formatada: string | null;
  aceitou_contrato: string;
  url_contrato_pdf: string | null;
  payment_id: string | null;
  status_pagamento_formatado: string;
  valor_formatado: string | null;
  metodo_pagamento_formatado: string | null;
  status_geral: string;
  minutos_formulario_para_contrato: number | null;
  minutos_contrato_para_pagamento: number | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalContracts: 0,
    totalPaid: 0,
    totalPending: 0,
    totalNotPaid: 0,
  });

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar TODOS os dados separadamente para garantir que todos sejam retornados
      
        // 1. Buscar todos os leads (incluindo country_code para detectar brasileiros)
        const { data: leadsData, error: leadsError } = await supabase
          .from("leads")
          .select(`
            id,
            name,
            email,
            phone,
            country_code,
            created_at
          `)
          .order("created_at", { ascending: false });

        if (leadsError) throw leadsError;
        
        // 2. Buscar todos os term_acceptance (sem RLS, buscando tudo)
        const { data: termAcceptancesData, error: taError } = await supabase
          .from("term_acceptance")
          .select("*")
          .order("accepted_at", { ascending: false });
          
        if (taError) {
          console.error("Erro ao buscar term_acceptance:", taError);
          throw taError;
        }
        
        // 3. Buscar TODOS os pagamentos (sem filtro)
        const { data: allPaymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false });
          
        if (paymentsError) throw paymentsError;
        
        // Combinar os dados manualmente
        const leadsWithData = (leadsData || []).map((lead: any) => {
          // Encontrar term_acceptance relacionado (pode haver múltiplos, pegar o mais recente)
          const termAcceptances = termAcceptancesData?.filter((ta: any) => ta.lead_id === lead.id) || [];
          // Pegar o mais recente se houver múltiplos
          const termAcceptance = termAcceptances.length > 0 
            ? termAcceptances.sort((a: any, b: any) => 
                new Date(b.accepted_at || b.created_at || 0).getTime() - 
                new Date(a.accepted_at || a.created_at || 0).getTime()
              )[0]
            : null;
          
          // Encontrar TODOS os pagamentos do lead
          const payments = allPaymentsData?.filter((p: any) => p.lead_id === lead.id) || [];
          
          return {
            ...lead,
            term_acceptance: termAcceptance ? [termAcceptance] : [],
            payments: payments
          };
        });

        // Transformar os dados para o formato esperado
        const transformedData: DashboardUser[] = leadsWithData.map((lead: any) => {
          const termAcceptance = Array.isArray(lead.term_acceptance) 
            ? lead.term_acceptance[0] 
            : lead.term_acceptance;
          
          const payments = Array.isArray(lead.payments) ? lead.payments : (lead.payments ? [lead.payments] : []);
          
          // LÓGICA ROBUSTA:
          // 1. Primeiro: buscar TODOS os pagamentos COMPLETOS do lead (não importa qual term_acceptance)
          // 2. Depois: se tem term_acceptance, filtrar por ele, senão pegar qualquer um
          // 3. Se não tem pagamento completo, pegar o mais recente
          const paidStatuses = ['completed', 'zelle_confirmed', 'redirected_to_infinitepay'];
          
          // PASSO 1: Buscar TODOS os pagamentos completos do lead
          const allCompletedPayments = payments.filter((p: any) => 
            p.status && paidStatuses.includes(p.status)
          );
          
          // PASSO 2: Se tem term_acceptance, filtrar por ele
          let relevantCompletedPayment = null;
          if (termAcceptance && allCompletedPayments.length > 0) {
            // Primeiro tenta encontrar com term_acceptance_id correspondente
            relevantCompletedPayment = allCompletedPayments.find((p: any) => 
              p.term_acceptance_id === termAcceptance.id
            );
            
            // Se não encontrou com match exato, pega qualquer pagamento completo (pode ser de outro term_acceptance)
            if (!relevantCompletedPayment && allCompletedPayments.length > 0) {
              relevantCompletedPayment = allCompletedPayments.sort((a: any, b: any) => 
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
              )[0];
            }
          } else if (allCompletedPayments.length > 0) {
            // Se não tem term_acceptance, pega o mais recente completo
            relevantCompletedPayment = allCompletedPayments.sort((a: any, b: any) => 
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )[0];
          }
          
          // PASSO 3: Se não encontrou pagamento completo, buscar pendentes relacionados ao term_acceptance
          const relevantPendingPayments = payments.filter((p: any) => {
            if (!termAcceptance) return p.status === 'pending' || !p.status;
            // Se tem term_acceptance, filtrar por ele
            return (p.status === 'pending' || !p.status) && 
                   (p.term_acceptance_id === termAcceptance.id || !p.term_acceptance_id);
          });
          
          // PASSO 4: Pegar o mais recente pendente ou o completo encontrado
          const latestPending = relevantPendingPayments.sort((a: any, b: any) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          )[0] || null;
          
          // RESULTADO FINAL: Prioriza pagamento completo sobre pendente
          const latestPayment = relevantCompletedPayment || latestPending;

          const formatDate = (date: string | null) => {
            if (!date) return null;
            const d = new Date(date);
            return d.toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
          };

          const formatValue = (amount: number | null, currency: string | null) => {
            if (!amount || !currency) return null;
            if (currency === 'USD') return `US$ ${amount.toFixed(2)}`;
            if (currency === 'BRL') return `R$ ${amount.toFixed(2)}`;
            return `${amount.toFixed(2)} ${currency}`;
          };

          const getPaymentMethod = (payment: any, lead: any) => {
            // Se não tem payment, retornar null
            if (!payment) return null;
            
            const metadata = payment.metadata || {};
            
            // 1. Verificar status do payment primeiro
            if (payment.status === 'redirected_to_infinitepay') {
              return 'InfinitePay';
            }
            
            // 2. Verificar metadata do payment - se tem payment_method explícito, usar ele
            if (metadata.payment_method) {
              const method = metadata.payment_method;
              if (method === 'card') return 'Cartão de Crédito';
              if (method === 'pix') return 'PIX';
              if (method === 'zelle') return 'Zelle';
              if (method === 'infinitepay') return 'InfinitePay';
              return method;
            }
            
            // 3. Verificar se tem requested_payment_method no metadata
            if (metadata.requested_payment_method) {
              const method = metadata.requested_payment_method;
              if (method === 'pix') return 'PIX';
              if (method === 'card') return 'Cartão de Crédito';
            }
            
            // 4. Se o payment está pendente e o lead é brasileiro (country_code = "BR" ou phone começa com +55),
            // verificar se foi redirecionado para InfinitePay
            const isBrazilian = lead?.country_code === 'BR' || 
                              lead?.country_code === '+55' ||
                              lead?.phone?.startsWith('+55') ||
                              lead?.phone?.startsWith('55');
            
            if (isBrazilian && payment.status === 'pending') {
              // Verificar se tem infinitepay_url no metadata (indicando redirecionamento)
              if (metadata.infinitepay_url) {
                return 'InfinitePay';
              }
              // Se o currency é BRL, provavelmente foi para InfinitePay
              if (payment.currency === 'BRL') {
                return 'InfinitePay';
              }
            }
            
            // 5. Se tem checkout_url do Stripe, verificar qual método foi usado
            // Por padrão, se não especificado, Stripe checkout é cartão
            if (metadata.checkout_url && metadata.checkout_url.includes('stripe.com')) {
              // Se não tem payment_method específico, mas tem checkout_url do Stripe,
              // provavelmente é cartão (padrão do Stripe quando não especifica PIX)
              // MAS: se o usuário escolheu PIX, isso deveria estar no metadata
              return 'Cartão de Crédito';
            }
            
            // 6. Se não tem nenhuma informação, retornar null (não mostrar método)
            return null;
          };

          const getStatusPagamento = (status: string | null, payment: any) => {
            // Se não tem pagamento nenhum
            if (!payment || !status) {
              return 'Não pagou';
            }
            
            // Pagamentos CONFIRMADOS (pagos de fato)
            if (status === 'completed') {
              const method = payment?.metadata?.payment_method || payment?.metadata?.requested_payment_method;
              const result = method === 'pix' ? 'Pago (PIX)' : method === 'card' ? 'Pago (Cartão)' : 'Pago (Stripe)';
              return result;
            }
            if (status === 'zelle_confirmed') {
              return 'Pago (Zelle)';
            }
            if (status === 'redirected_to_infinitepay') {
              return 'Redirecionado (InfinitePay)';
            }
            
            // Pagamentos PENDENTES (ainda não confirmados)
            if (status === 'pending') {
              return 'Pendente';
            }
            
            return status;
          };

          const getStatusGeral = () => {
            // Verificar se PAGOU (tem status de pagamento confirmado)
            const pagou = latestPayment && ['completed', 'zelle_confirmed', 'redirected_to_infinitepay'].includes(latestPayment.status);
            
            if (termAcceptance && pagou) {
              return 'Completo (Contrato + Pagamento)';
            }
            if (termAcceptance && latestPayment?.status === 'pending') {
              return 'Contrato Aceito (Pagamento Pendente)';
            }
            if (termAcceptance && !latestPayment) {
              return 'Contrato Aceito (Sem Pagamento)';
            }
            if (!termAcceptance) {
              return 'Apenas Formulário (Sem Contrato)';
            }
            return 'Status Desconhecido';
          };

          const calcMinutes = (date1: string | null, date2: string | null) => {
            if (!date1 || !date2) return null;
            const diff = new Date(date1).getTime() - new Date(date2).getTime();
            return Math.round((diff / 1000 / 60) * 100) / 100;
          };

          return {
            lead_id: lead.id,
            nome_completo: lead.name,
            email: lead.email,
            telefone: lead.phone,
            data_formulario_formatada: formatDate(lead.created_at) || '',
            term_acceptance_id: termAcceptance?.id || null,
            data_aceitacao_formatada: formatDate(termAcceptance?.accepted_at) || null,
            aceitou_contrato: termAcceptance ? 'Sim' : 'Não',
            url_contrato_pdf: termAcceptance?.pdf_url || null,
            payment_id: latestPayment?.id || null,
            status_pagamento_formatado: getStatusPagamento(latestPayment?.status || null, latestPayment),
            valor_formatado: formatValue(latestPayment?.amount || null, latestPayment?.currency || null),
            metodo_pagamento_formatado: getPaymentMethod(latestPayment, lead),
            status_geral: getStatusGeral(),
            minutos_formulario_para_contrato: termAcceptance 
              ? calcMinutes(termAcceptance.accepted_at, lead.created_at)
              : null,
            minutos_contrato_para_pagamento: latestPayment && termAcceptance
              ? calcMinutes(latestPayment.created_at, termAcceptance.accepted_at)
              : null,
          };
        });

        setUsers(transformedData);

        // Calcular estatísticas - LÓGICA SIMPLIFICADA
        const totalLeads = transformedData.length;
        const totalContracts = transformedData.filter(u => u.aceitou_contrato === 'Sim').length;
        
        // PAGOS: status que contém "Pago" ou "Redirecionado" (esses são confirmados)
        const paidUsers = transformedData.filter(u => {
          const status = u.status_pagamento_formatado || '';
          return status.includes('Pago') || status.includes('Redirecionado');
        });
        const totalPaid = paidUsers.length;
        
        // PENDENTES: apenas "Pendente" (sem outros status)
        const totalPending = transformedData.filter(u => 
          u.status_pagamento_formatado === 'Pendente'
        ).length;
        
        // NÃO PAGARAM: "Não pagou" OU não tem status
        const totalNotPaid = transformedData.filter(u => {
          const status = u.status_pagamento_formatado || '';
          return status === 'Não pagou' || status === '';
        }).length;

        setStats({
          totalLeads,
          totalContracts,
          totalPaid,
          totalPending,
          totalNotPaid,
        });
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Adicionar classe ao body para remover fundo azul
    document.body.classList.add('dashboard-page');
    
    return () => {
      // Remover classe quando sair do dashboard
      document.body.classList.remove('dashboard-page');
    };
  }, []);

  // Filtrar usuários baseado na busca e tab ativo
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filtro de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.nome_completo.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          user.telefone.toLowerCase().includes(search)
      );
    }

    // Filtro por tab
    if (activeTab === "paid") {
      filtered = filtered.filter((user) => 
        user.status_pagamento_formatado.includes("Pago") || 
        user.status_pagamento_formatado.includes("Redirecionado")
      );
    } else if (activeTab === "pending") {
      filtered = filtered.filter((user) => user.status_pagamento_formatado === "Pendente");
    } else if (activeTab === "not-paid") {
      filtered = filtered.filter((user) => user.status_pagamento_formatado === "Não pagou");
    }

    return filtered;
  }, [users, searchTerm, activeTab]);

  // Calcular estatísticas filtradas
  const filteredStats = useMemo(() => {
    return {
      total: filteredUsers.length,
      paid: filteredUsers.filter((u) => 
        u.status_pagamento_formatado.includes("Pago") || 
        u.status_pagamento_formatado.includes("Redirecionado")
      ).length,
      pending: filteredUsers.filter((u) => u.status_pagamento_formatado === "Pendente").length,
      notPaid: filteredUsers.filter((u) => u.status_pagamento_formatado === "Não pagou").length,
    };
  }, [filteredUsers]);

  const getStatusBadge = (status: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-600" />
          <p className="mt-4 text-gray-600">Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Erro ao carregar dashboard</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchDashboardData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="w-full mx-auto space-y-6" style={{ maxWidth: '95%' }}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard - American Dream</h1>
            <p className="text-gray-600 mt-2 text-base">Visão completa de todos os usuários e pagamentos</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchDashboardData} variant="outline" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={handleLogout} variant="outline" className="border-red-500 bg-white text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
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

        {/* Tabela de Usuários com Tabs */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-2xl text-gray-900">Usuários</CardTitle>
                <CardDescription className="text-base mt-1 text-gray-600">
                  Lista completa com formulário, contrato e status de pagamento
                </CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300"
                />
              </div>
            </div>
          </CardHeader>
          <Separator className="bg-gray-200" />
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 pt-4">
                <TabsList className="grid w-full md:w-auto grid-cols-4 md:grid-cols-4 bg-gray-100">
                  <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    Todos
                    <Badge variant="secondary" className="ml-1 bg-gray-200 text-gray-700">
                      {stats.totalLeads}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="paid" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    Pagos
                    <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">
                      {stats.totalPaid}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    Pendentes
                    <Badge variant="secondary" className="ml-1 bg-gray-200 text-gray-700">
                      {stats.totalPending}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="not-paid" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    Não Pagaram
                    <Badge variant="secondary" className="ml-1 bg-red-100 text-red-700">
                      {stats.totalNotPaid}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="all" className="mt-4 space-y-0">
                <div className="px-6 pb-6">
                  <div className="text-sm text-gray-500 mb-4">
                    Mostrando {filteredUsers.length} de {users.length} usuários
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
                          <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Status Geral</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">PDF</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center py-12 text-gray-600 bg-white">
                              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-base font-medium text-gray-900">Nenhum usuário encontrado</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {searchTerm ? "Tente uma busca diferente" : "Não há usuários nesta categoria"}
                              </p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user) => (
                            <TableRow key={user.lead_id} className="border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                              <TableCell className="font-semibold text-gray-900 py-3 px-4">{user.nome_completo}</TableCell>
                              <TableCell className="text-gray-700 py-3 px-4">{user.email}</TableCell>
                              <TableCell className="text-gray-700 py-3 px-4">{user.telefone}</TableCell>
                              <TableCell className="text-gray-600 py-3 px-4 text-sm">{user.data_formulario_formatada}</TableCell>
                              <TableCell className="py-3 px-4">
                                <Badge variant={user.aceitou_contrato === 'Sim' ? 'default' : 'outline'} className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                                  {user.aceitou_contrato}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-600 py-3 px-4 text-sm">{user.data_aceitacao_formatada || '-'}</TableCell>
                              <TableCell className="py-3 px-4">{getStatusBadge(user.status_pagamento_formatado)}</TableCell>
                              <TableCell className="font-semibold text-gray-900 py-3 px-4">
                                {user.valor_formatado || '-'}
                              </TableCell>
                              <TableCell className="text-gray-700 py-3 px-4 text-sm">{user.metodo_pagamento_formatado || '-'}</TableCell>
                              <TableCell className="py-3 px-4">
                                <Badge variant="outline" className="text-xs bg-white border-gray-300 text-gray-700">
                                  {user.status_geral}
                                </Badge>
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
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="paid" className="mt-4 space-y-0">
                <div className="px-6 pb-6">
                  <div className="text-sm text-gray-500 mb-4">
                    Mostrando {filteredStats.paid} usuários que pagaram
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
                          <TableHead className="text-sm font-semibold text-gray-900 py-3 px-4">Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.filter(u => u.status_pagamento_formatado.includes("Pago") || u.status_pagamento_formatado.includes("Redirecionado")).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-gray-600 bg-white">
                              Nenhum pagamento confirmado encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.filter(u => u.status_pagamento_formatado.includes("Pago") || u.status_pagamento_formatado.includes("Redirecionado")).map((user) => (
                            <TableRow key={user.lead_id} className="border-gray-200 bg-white hover:bg-gray-50">
                              <TableCell className="font-semibold text-gray-900 py-3 px-4">{user.nome_completo}</TableCell>
                              <TableCell className="text-gray-700 py-3 px-4">{user.email}</TableCell>
                              <TableCell className="py-3 px-4">{getStatusBadge(user.status_pagamento_formatado)}</TableCell>
                              <TableCell className="font-semibold text-green-600 py-3 px-4">{user.valor_formatado || '-'}</TableCell>
                              <TableCell className="text-gray-700 py-3 px-4">{user.metodo_pagamento_formatado || '-'}</TableCell>
                              <TableCell className="text-gray-600 py-3 px-4 text-sm">{user.data_formulario_formatada}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pending" className="mt-4 space-y-0">
                <div className="px-6 pb-6">
                  <div className="text-sm text-gray-500 mb-4">
                    Mostrando {filteredStats.pending} pagamentos pendentes
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
                        {filteredUsers.filter(u => u.status_pagamento_formatado === "Pendente").length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-12 text-gray-600 bg-white">
                              Nenhum pagamento pendente
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.filter(u => u.status_pagamento_formatado === "Pendente").map((user) => (
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
              </TabsContent>

              <TabsContent value="not-paid" className="mt-4 space-y-0">
                <div className="px-6 pb-6">
                  <div className="text-sm text-gray-500 mb-4">
                    Mostrando {filteredStats.notPaid} usuários que não pagaram
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
                        {filteredUsers.filter(u => u.status_pagamento_formatado === "Não pagou").length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-12 text-gray-600 bg-white">
                              Todos os usuários pagaram!
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.filter(u => u.status_pagamento_formatado === "Não pagou").map((user) => (
                            <TableRow key={user.lead_id} className="border-gray-200 bg-white hover:bg-gray-50">
                              <TableCell className="font-semibold text-gray-900 py-3 px-4">{user.nome_completo}</TableCell>
                              <TableCell className="text-gray-700 py-3 px-4">{user.email}</TableCell>
                              <TableCell className="py-3 px-4">
                                <Badge variant={user.aceitou_contrato === 'Sim' ? 'default' : 'outline'} className="text-xs bg-gray-100 text-gray-700 border-gray-300">
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

