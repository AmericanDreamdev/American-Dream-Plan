import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  onRefresh?: () => void;
}

export const DashboardLayout = ({ children, onLogout, onRefresh }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar onLogout={onLogout} onRefresh={onRefresh} />
      <main className="flex-1 lg:ml-64">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

