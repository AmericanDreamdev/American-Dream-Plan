import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut } from "lucide-react";

interface DashboardHeaderProps {
  onRefresh: () => void;
  onLogout: () => void;
}

export const DashboardHeader = ({ onRefresh, onLogout }: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Dashboard - American Dream</h1>
        <p className="text-gray-600 mt-2 text-base">Visão completa de todos os usuários e pagamentos</p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onRefresh}
          variant="outline"
          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <Button
          onClick={onLogout}
          variant="outline"
          className="border-red-500 bg-white text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
};

