import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useClientData } from "@/hooks/useClientData";
import ProgressTracker from "@/components/client/ProgressTracker";
import CurrentAction from "@/components/client/CurrentAction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Loader2, LogOut, RefreshCw, User, Mail, Phone } from "lucide-react";
import { ClientPlanView } from "@/components/dashboard/ClientPlanView";

const ClientDashboard = () => {
  const { clientData, loading, error, refetch } = useClientData();
  const navigate = useNavigate();

  const getStageEmoji = (stageNumber: number) => {
    return "";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/client/login");
  };

  const [showCongrats, setShowCongrats] = useState(false);

  useEffect(() => {
    if (clientData?.clientPlan?.id) {
      const storageKey = `plan_congrats_seen_${clientData.clientPlan.id}`;
      const hasSeen = localStorage.getItem(storageKey);

      if (!hasSeen) {
        setShowCongrats(true);
        // Mark as seen immediately so it doesn't show on next reload/visit
        localStorage.setItem(storageKey, 'true');
      }
    }
  }, [clientData?.clientPlan?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-400" />
          <p className="mt-4 text-white/80">Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={refetch} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
              <Button onClick={handleLogout} variant="ghost">
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                alt="American Dream"
                className="h-10"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Meu Dashboard</h1>
                <p className="text-sm text-gray-500">Acompanhe seu processo American Dream</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={refetch}
                variant="ghost"
                size="sm"
                className="text-gray-600"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-gray-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Boas-vindas */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Olá, {clientData.name.split(' ')[0]}!
          </h2>
          <p className="text-gray-600 mt-1">
            Veja o progresso do seu processo abaixo
          </p>
        </div>

        {/* Progresso ou Plano */}
        {clientData.clientPlan && clientData.secondMeetingCompleted ? (
          <div className="space-y-6">
            {showCongrats && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Parabéns! Seu planejamento está pronto.</h3>
                <p className="text-green-700">Abaixo você pode visualizar todas as etapas detalhadas do seu American Dream.</p>
              </div>
            )}
            <ClientPlanView plan={clientData.clientPlan} />
          </div>
        ) : (
          <>
            {/* Progresso */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Seu Progresso</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressTracker
                  stages={clientData.stages}
                  currentStage={clientData.currentStage}
                />
              </CardContent>
            </Card>

            {/* Ação Atual */}
            <CurrentAction
              stages={clientData.stages}
              currentStage={clientData.currentStage}
              firstMeetingDate={clientData.firstMeetingDate}
              planStatus={clientData.planStatus}
            />
          </>
        )}

        {/* Informações do Cliente */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base text-gray-700">Suas Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Nome</p>
                  <p className="font-medium text-gray-800">{clientData.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">{clientData.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Telefone</p>
                  <p className="font-medium text-gray-800">{clientData.phone || '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link de Suporte */}
        {/* <div className="text-center pt-4">
          <p className="text-gray-500 text-sm">
            Dúvidas? Entre em contato pelo{" "}
            <a 
              href="https://wa.me/+5511999999999" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-600 hover:underline font-medium"
            >
              WhatsApp
            </a>
          </p>
        </div> */}
      </main>
    </div>
  );
};

export default ClientDashboard;
