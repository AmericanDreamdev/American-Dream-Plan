import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Search } from "lucide-react";
import { DashboardUser, DashboardStats } from "@/types/dashboard";
import { DashboardFullTable, DashboardPaidTable, DashboardPendingTable, DashboardNotPaidTable } from "./DashboardTable";
import { ConsultationFormsTable } from "./ConsultationFormsTable";
import { RawConsultationForm } from "@/types/dashboard";

interface DashboardTabsProps {
  users: DashboardUser[];
  filteredUsers: DashboardUser[];
  consultationForms: RawConsultationForm[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeTab: string;
  onTabChange: (value: string) => void;
  stats: DashboardStats;
  onUpdate?: () => void;
}

export const DashboardTabs = ({
  users,
  filteredUsers,
  consultationForms,
  searchTerm,
  onSearchChange,
  activeTab,
  onTabChange,
  stats,
  onUpdate,
}: DashboardTabsProps) => {
  return (
    <Card className="border-0 bg-white shadow-md overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white border-gray-300"
            />
          </div>
        </div>
      </CardHeader>
      <Separator className="bg-gray-200" />
      <CardContent className="p-0 overflow-x-auto">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <div className="px-6 pt-4">
            <TabsList className="grid w-full md:w-auto grid-cols-5 md:grid-cols-5 bg-gray-50 border border-gray-200">
              <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                Todos
                <Badge variant="secondary" className="ml-1 bg-gray-200 text-gray-700 text-xs">
                  {stats.totalLeads}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="paid" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                Pagos
                <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 text-xs">
                  {stats.totalPaid}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                Pendentes
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 text-xs">
                  {stats.totalPending}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="not-paid" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                Não Pagaram
                <Badge variant="secondary" className="ml-1 bg-red-100 text-red-700 text-xs">
                  {stats.totalNotPaid}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="consultation" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                Formulários
                <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700 text-xs">
                  {stats.totalConsultationForms}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-4 space-y-0">
            <DashboardFullTable users={filteredUsers} totalUsers={users.length} searchTerm={searchTerm} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="paid" className="mt-4 space-y-0">
            <DashboardPaidTable users={filteredUsers} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="pending" className="mt-4 space-y-0">
            <DashboardPendingTable users={filteredUsers} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="not-paid" className="mt-4 space-y-0">
            <DashboardNotPaidTable users={filteredUsers} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="consultation" className="mt-4 space-y-0">
            <ConsultationFormsTable forms={consultationForms} searchTerm={searchTerm} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

