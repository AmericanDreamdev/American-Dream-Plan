import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { DashboardError } from "@/components/dashboard/DashboardError";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { users, stats, loading, error, refetch } = useDashboardData();
  const { filteredUsers, filteredStats } = useDashboardFilters({
    users,
    searchTerm,
    activeTab,
    stats,
  });

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

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="w-full mx-auto space-y-6" style={{ maxWidth: '95%' }}>
        <DashboardHeader onRefresh={refetch} onLogout={handleLogout} />
        <DashboardStatsCards stats={stats} />
        <DashboardTabs
          users={users}
          filteredUsers={filteredUsers}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          stats={stats}
        />
      </div>
    </div>
  );
};

export default Dashboard;
