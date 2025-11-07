import { useState } from "react";
import { RawConsultationForm } from "@/types/dashboard";
import { ConsultationFormsTable } from "@/components/dashboard/ConsultationFormsTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface FormsPageProps {
  consultationForms: RawConsultationForm[];
}

export const FormsPage = ({ consultationForms }: FormsPageProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      {/* Forms Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Lista de Formulários</CardTitle>
          <CardDescription>
            Todos os formulários de consulta preenchidos pelos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConsultationFormsTable forms={consultationForms} searchTerm={searchTerm} />
        </CardContent>
      </Card>
    </div>
  );
};

