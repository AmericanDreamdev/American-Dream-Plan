import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Download, RefreshCw, Users, FileText, DollarSign, CheckCircle2, XCircle, Clock, Search, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

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

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar TODOS os dados separadamente para garantir que todos sejam retornados
      console.log("=== BUSCANDO DADOS DO BANCO ===");
      
      // 1. Buscar todos os leads
      const { data: leadsData, error: leadsError } = await supabase
          .from("leads")
          .select(`
            id,
            name,
            email,
            phone,
            created_at
          `)
          .order("created_at", { ascending: false });

        if (leadsError) throw leadsError;
        console.log("Leads encontrados:", leadsData?.length || 0);
        
        // 2. Buscar todos os term_acceptance
        const { data: termAcceptancesData, error: taError } = await supabase
          .from("term_acceptance")
          .select("*");
          
        if (taError) throw taError;
        console.log("Term acceptances encontrados:", termAcceptancesData?.length || 0);
        
        // 3. Buscar TODOS os pagamentos (sem filtro)
        const { data: allPaymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false });
          
        if (paymentsError) throw paymentsError;
        console.log("Pagamentos encontrados:", allPaymentsData?.length || 0);
        console.log("Pagamentos completos:", allPaymentsData?.filter((p: any) => ['completed', 'zelle_confirmed', 'redirected_to_infinitepay'].includes(p.status)).length);
        
        // Combinar os dados manualmente
        const leadsWithData = (leadsData || []).map((lead: any) => {
          // Encontrar term_acceptance relacionado
          const termAcceptance = termAcceptancesData?.find((ta: any) => ta.lead_id === lead.id);
          
          // Encontrar TODOS os pagamentos do lead
          const payments = allPaymentsData?.filter((p: any) => p.lead_id === lead.id) || [];
          
          return {
            ...lead,
            term_acceptance: termAcceptance ? [termAcceptance] : [],
            payments: payments
          };
        });
        
        console.log("Leads combinados com dados:", leadsWithData.length);

        console.log("=== DASHBOARD DEBUG ===");
        console.log("Total leads encontrados:", leadsWithData.length);
        
        // Verificar quantos pagamentos completos existem
        let totalCompletedPayments = 0;
        leadsWithData.forEach((lead: any) => {
          const payments = Array.isArray(lead.payments) ? lead.payments : (lead.payments ? [lead.payments] : []);
          const completed = payments.filter((p: any) => ['completed', 'zelle_confirmed', 'redirected_to_infinitepay'].includes(p.status));
          if (completed.length > 0) {
            totalCompletedPayments += completed.length;
            console.log(`Lead ${lead.name} (${lead.email}): ${completed.length} pagamento(s) completo(s)`, completed.map((p: any) => ({ id: p.id, status: p.status, term_acceptance_id: p.term_acceptance_id })));
          }
        });
        console.log("Total de pagamentos completos encontrados:", totalCompletedPayments);

        // Transformar os dados para o formato esperado
        const transformedData: DashboardUser[] = leadsWithData.map((lead: any) => {
          const termAcceptance = Array.isArray(lead.term_acceptance) 
            ? lead.term_acceptance[0] 
            : lead.term_acceptance;
          
          const payments = Array.isArray(lead.payments) ? lead.payments : (lead.payments ? [lead.payments] : []);
          
          console.log(`\n--- Processando Lead: ${lead.name} (${lead.email}) ---`);
          console.log("Term Acceptance ID:", termAcceptance?.id || "Nenhum");
          console.log("Total de pagamentos:", payments.length);
          console.log("Pagamentos:", payments.map((p: any) => ({ 
            id: p.id, 
            status: p.status, 
            term_acceptance_id: p.term_acceptance_id,
            created_at: p.created_at 
          })));
          
          // LÓGICA ROBUSTA:
          // 1. Primeiro: buscar TODOS os pagamentos COMPLETOS do lead (não importa qual term_acceptance)
          // 2. Depois: se tem term_acceptance, filtrar por ele, senão pegar qualquer um
          // 3. Se não tem pagamento completo, pegar o mais recente
          const paidStatuses = ['completed', 'zelle_confirmed', 'redirected_to_infinitepay'];
          
          // PASSO 1: Buscar TODOS os pagamentos completos do lead
          const allCompletedPayments = payments.filter((p: any) => 
            p.status && paidStatuses.includes(p.status)
          );
          console.log("Pagamentos completos encontrados:", allCompletedPayments.length, allCompletedPayments.map((p: any) => ({ 
            id: p.id, 
            status: p.status, 
            term_acceptance_id: p.term_acceptance_id 
          })));
          
          // PASSO 2: Se tem term_acceptance, filtrar por ele
          let relevantCompletedPayment = null;
          if (termAcceptance && allCompletedPayments.length > 0) {
            console.log(`Tentando encontrar pagamento completo com term_acceptance_id: ${termAcceptance.id}`);
            // Primeiro tenta encontrar com term_acceptance_id correspondente
            relevantCompletedPayment = allCompletedPayments.find((p: any) => 
              p.term_acceptance_id === termAcceptance.id
            );
            console.log("Match exato encontrado:", relevantCompletedPayment ? "SIM" : "NÃO");
            
            // Se não encontrou com match exato, pega qualquer pagamento completo (pode ser de outro term_acceptance)
            if (!relevantCompletedPayment && allCompletedPayments.length > 0) {
              relevantCompletedPayment = allCompletedPayments.sort((a: any, b: any) => 
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
              )[0];
              console.log("Pegando qualquer pagamento completo (sem match exato):", relevantCompletedPayment.id);
            }
          } else if (allCompletedPayments.length > 0) {
            // Se não tem term_acceptance, pega o mais recente completo
            relevantCompletedPayment = allCompletedPayments.sort((a: any, b: any) => 
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )[0];
            console.log("Pegando pagamento completo (sem term_acceptance):", relevantCompletedPayment.id);
          }
          
          // PASSO 3: Se não encontrou pagamento completo, buscar pendentes relacionados ao term_acceptance
          const relevantPendingPayments = payments.filter((p: any) => {
            if (!termAcceptance) return p.status === 'pending' || !p.status;
            // Se tem term_acceptance, filtrar por ele
            return (p.status === 'pending' || !p.status) && 
                   (p.term_acceptance_id === termAcceptance.id || !p.term_acceptance_id);
          });
          console.log("Pagamentos pendentes relevantes:", relevantPendingPayments.length);
          
          // PASSO 4: Pegar o mais recente pendente ou o completo encontrado
          const latestPending = relevantPendingPayments.sort((a: any, b: any) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          )[0] || null;
          
          // RESULTADO FINAL: Prioriza pagamento completo sobre pendente
          const latestPayment = relevantCompletedPayment || latestPending;
          console.log("Pagamento final selecionado:", latestPayment ? {
            id: latestPayment.id,
            status: latestPayment.status,
            term_acceptance_id: latestPayment.term_acceptance_id
          } : "NENHUM");

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

          const getPaymentMethod = (metadata: any) => {
            if (!metadata || !metadata.payment_method) return null;
            const method = metadata.payment_method;
            if (method === 'card') return 'Cartão de Crédito';
            if (method === 'pix') return 'PIX';
            if (method === 'zelle') return 'Zelle';
            if (method === 'infinitepay') return 'InfinitePay';
            return method;
          };

          const getStatusPagamento = (status: string | null, payment: any) => {
            console.log(`getStatusPagamento chamado - status: ${status}, payment:`, payment ? { id: payment.id, metadata: payment.metadata } : "null");
            
            // Se não tem pagamento nenhum
            if (!payment || !status) {
              console.log("Retornando: Não pagou (sem payment ou status)");
              return 'Não pagou';
            }
            
            // Pagamentos CONFIRMADOS (pagos de fato)
            if (status === 'completed') {
              const method = payment?.metadata?.payment_method || payment?.metadata?.requested_payment_method;
              const result = method === 'pix' ? 'Pago (PIX)' : method === 'card' ? 'Pago (Cartão)' : 'Pago (Stripe)';
              console.log(`Retornando: ${result} (método: ${method})`);
              return result;
            }
            if (status === 'zelle_confirmed') {
              console.log("Retornando: Pago (Zelle)");
              return 'Pago (Zelle)';
            }
            if (status === 'redirected_to_infinitepay') {
              console.log("Retornando: Redirecionado (InfinitePay)");
              return 'Redirecionado (InfinitePay)';
            }
            
            // Pagamentos PENDENTES (ainda não confirmados)
            if (status === 'pending') {
              console.log("Retornando: Pendente");
              return 'Pendente';
            }
            
            console.log(`Retornando status original: ${status}`);
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
            metodo_pagamento_formatado: getPaymentMethod(latestPayment?.metadata || null),
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
        console.log("\n=== ESTATÍSTICAS ===");
        console.log("Total leads:", totalLeads);
        console.log("Total contratos:", totalContracts);
        console.log("Total PAGOS:", totalPaid);
        if (totalPaid > 0) {
          console.log("Usuários que pagaram:", paidUsers.map(u => ({ nome: u.nome_completo, email: u.email, status: u.status_pagamento_formatado })));
        }
        
        // PENDENTES: apenas "Pendente" (sem outros status)
        const totalPending = transformedData.filter(u => 
          u.status_pagamento_formatado === 'Pendente'
        ).length;
        console.log("Total PENDENTES:", totalPending);
        
        // NÃO PAGARAM: "Não pagou" OU não tem status
        const totalNotPaid = transformedData.filter(u => {
          const status = u.status_pagamento_formatado || '';
          return status === 'Não pagou' || status === '';
        }).length;
        console.log("Total NÃO PAGARAM:", totalNotPaid);
        console.log("===================\n");

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
      return <Badge className="bg-green-600 text-white">{status}</Badge>;
    }
    if (status.includes('Pendente')) {
      return <Badge className="bg-yellow-500 text-white">{status}</Badge>;
    }
    if (status.includes('Não pagou') || status.includes('Sem Pagamento')) {
      return <Badge className="bg-red-600 text-white">{status}</Badge>;
    }
    if (status.includes('Redirecionado')) {
      return <Badge className="bg-gray-600 text-white">{status}</Badge>;
    }
    return <Badge variant="outline" className="border-gray-300">{status}</Badge>;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="w-full mx-auto space-y-6" style={{ maxWidth: '95%' }}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard - American Dream</h1>
            <p className="text-gray-600 mt-2 text-base">Visão completa de todos os usuários e pagamentos</p>
          </div>
          <Button onClick={fetchDashboardData} variant="outline" className="border-gray-300 text-gray-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Leads</CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalLeads}</div>
              <p className="text-xs text-gray-500 mt-1">Total de cadastros</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Contratos Aceitos</CardTitle>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalContracts}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalLeads > 0 ? Math.round((stats.totalContracts / stats.totalLeads) * 100) : 0}% conversão
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pagamentos Confirmados</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
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

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.totalPending}</div>
              <p className="text-xs text-gray-500 mt-1">Aguardando confirmação</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Não Pagaram</CardTitle>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
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
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-2xl text-gray-900">Usuários</CardTitle>
                <CardDescription className="text-base mt-1">
                  Lista completa com formulário, contrato e status de pagamento
                </CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 pt-4">
                <TabsList className="grid w-full md:w-auto grid-cols-4 md:grid-cols-4">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    Todos
                    <Badge variant="secondary" className="ml-1">
                      {stats.totalLeads}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="paid" className="flex items-center gap-2">
                    Pagos
                    <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">
                      {stats.totalPaid}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    Pendentes
                    <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-700">
                      {stats.totalPending}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="not-paid" className="flex items-center gap-2">
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
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Nome</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Email</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Telefone</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Data Formulário</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Contrato</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Data Contrato</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Status Pagamento</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Valor</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Método</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Status Geral</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">PDF</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center py-12 text-gray-500">
                              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-base font-medium">Nenhum usuário encontrado</p>
                              <p className="text-sm text-gray-400 mt-1">
                                {searchTerm ? "Tente uma busca diferente" : "Não há usuários nesta categoria"}
                              </p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user) => (
                            <TableRow key={user.lead_id} className="border-gray-100 hover:bg-gray-50 transition-colors">
                              <TableCell className="font-semibold text-gray-900 py-3 px-4">{user.nome_completo}</TableCell>
                              <TableCell className="text-gray-700 py-3 px-4">{user.email}</TableCell>
                              <TableCell className="text-gray-700 py-3 px-4">{user.telefone}</TableCell>
                              <TableCell className="text-gray-600 py-3 px-4 text-sm">{user.data_formulario_formatada}</TableCell>
                              <TableCell className="py-3 px-4">
                                <Badge variant={user.aceitou_contrato === 'Sim' ? 'default' : 'outline'} className="text-xs">
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
                                <Badge variant="outline" className="text-xs">
                                  {user.status_geral}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                {user.url_contrato_pdf ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8"
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
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Nome</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Email</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Status Pagamento</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Valor</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Método</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.filter(u => u.status_pagamento_formatado.includes("Pago") || u.status_pagamento_formatado.includes("Redirecionado")).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                              Nenhum pagamento confirmado encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.filter(u => u.status_pagamento_formatado.includes("Pago") || u.status_pagamento_formatado.includes("Redirecionado")).map((user) => (
                            <TableRow key={user.lead_id} className="border-gray-100 hover:bg-gray-50">
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
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Nome</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Email</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.filter(u => u.status_pagamento_formatado === "Pendente").length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-12 text-gray-500">
                              Nenhum pagamento pendente
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.filter(u => u.status_pagamento_formatado === "Pendente").map((user) => (
                            <TableRow key={user.lead_id} className="border-gray-100 hover:bg-gray-50">
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
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Nome</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Email</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Contrato</TableHead>
                          <TableHead className="text-sm font-semibold text-gray-700 py-3 px-4">Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.filter(u => u.status_pagamento_formatado === "Não pagou").length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                              Todos os usuários pagaram!
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.filter(u => u.status_pagamento_formatado === "Não pagou").map((user) => (
                            <TableRow key={user.lead_id} className="border-gray-100 hover:bg-gray-50">
                              <TableCell className="font-semibold text-gray-900 py-3 px-4">{user.nome_completo}</TableCell>
                              <TableCell className="text-gray-700 py-3 px-4">{user.email}</TableCell>
                              <TableCell className="py-3 px-4">
                                <Badge variant={user.aceitou_contrato === 'Sim' ? 'default' : 'outline'} className="text-xs">
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

