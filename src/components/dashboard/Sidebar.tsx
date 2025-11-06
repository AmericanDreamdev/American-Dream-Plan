import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, LogOut, Menu, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarProps {
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

export const Sidebar = ({ onLogout, onRefresh }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white border-gray-200"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40 transition-transform duration-300",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">American Dream</h1>
            <p className="text-sm text-gray-500 mt-1">Dashboard</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
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
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                    active
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-gray-900" : "text-gray-500")} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            {onRefresh && (
              <Button
                variant="outline"
                onClick={onRefresh}
                className="w-full justify-start gap-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-200"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Atualizar</span>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onLogout}
              className="w-full justify-start gap-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-200"
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

