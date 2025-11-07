import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, LogOut, RefreshCw, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface EnhancedSidebarProps {
  onLogout: () => void;
  onRefresh?: () => void;
}

const menuItems = [
  {
    id: "overview",
    label: "Visão Geral",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    id: "users",
    label: "Usuários",
    icon: Users,
    path: "/dashboard/users",
  },
  {
    id: "forms",
    label: "Formulários",
    icon: FileText,
    path: "/dashboard/forms",
  },
];

export const EnhancedSidebar = ({ 
  onLogout, 
  onRefresh
}: EnhancedSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  // Sidebar branca
  const sidebarBg = "bg-white border-r border-gray-200 shadow-sm";

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white border-gray-200 shadow-md"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 z-40 transition-transform duration-300",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          sidebarBg
        )}
      >
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-americadream.png" 
                alt="American Dream Logo" 
                className="h-10 w-auto object-contain flex-shrink-0"
              />
              <div className="flex-1 overflow-hidden">
                <h1 className="text-base font-bold text-gray-900 leading-tight">American Dream</h1>
                <p className="text-xs text-gray-500 leading-tight">Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left transition-all duration-200",
                    active
                      ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("h-6 w-6 flex-shrink-0", active ? "text-blue-600" : "text-gray-500")} />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            {onRefresh && (
              <Button
                variant="ghost"
                onClick={onRefresh}
                className="w-full justify-start gap-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 border-0"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Atualizar</span>
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={onLogout}
              className="w-full justify-start gap-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 border-0"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

