import { ReactNode, useState } from "react";
import { EnhancedSidebar } from "./EnhancedSidebar";
import { DashboardNavbar } from "./DashboardNavbar";

interface EnhancedDashboardLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  onRefresh?: () => void;
}

export const EnhancedDashboardLayout = ({ 
  children, 
  onLogout, 
  onRefresh 
}: EnhancedDashboardLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedSidebar 
        onLogout={onLogout} 
        onRefresh={onRefresh}
      />
      <div className="lg:ml-64 min-h-screen">
        <DashboardNavbar onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

