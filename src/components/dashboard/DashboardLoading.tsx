import { Loader2 } from "lucide-react";

export const DashboardLoading = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-600" />
        <p className="mt-4 text-gray-600">Carregando dados do dashboard...</p>
      </div>
    </div>
  );
};

