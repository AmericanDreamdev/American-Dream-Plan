import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useDashboardData } from "@/hooks/useDashboardData";
import { EnhancedDashboardLayout } from "@/components/dashboard/EnhancedDashboardLayout";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { DashboardError } from "@/components/dashboard/DashboardError";
import { OverviewPage } from "@/pages/dashboard/OverviewPage";
import { UsersPage } from "@/pages/dashboard/UsersPage";
import { FormsPage } from "@/pages/dashboard/FormsPage";

// Dashboard component
const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { users, stats, consultationForms, loading, error, refetch } = useDashboardData();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    // Adicionar classe ao body para remover fundo azul
    document.body.classList.add('dashboard-page');

    return () => {
      // Remover classe quando sair do dashboard
      document.body.classList.remove('dashboard-page');
    };
  }, []);

  if (loading) {
    return <DashboardLoading />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={refetch} />;
  }

  // Determinar qual página mostrar baseado na rota
  const renderPage = () => {
    if (location.pathname === "/dashboard/users") {
      return <UsersPage users={users} stats={stats} consultationForms={consultationForms} onUpdate={refetch} />;
    }
    if (location.pathname === "/dashboard/forms") {
      return <FormsPage consultationForms={consultationForms} />;
    }
    // Default: Overview
    return <OverviewPage stats={stats} />;
  };

  return (
    <EnhancedDashboardLayout onLogout={handleLogout} onRefresh={refetch}>
      {renderPage()}
    </EnhancedDashboardLayout>
  );
};

export default Dashboard;
