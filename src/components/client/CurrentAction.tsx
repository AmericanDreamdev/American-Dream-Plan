import { Link } from "react-router-dom";
import { ClientStage } from "@/hooks/useClientData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  CreditCard, 
  ClipboardList, 
  Calendar, 
  FileSearch, 
  Banknote, 
  Target, 
  Pin 
} from "lucide-react";

interface CurrentActionProps {
  stages: ClientStage[];
  currentStage: number;
  firstMeetingDate?: string | null;
  planStatus?: string | null;
}

const CurrentAction = ({ stages, currentStage, firstMeetingDate, planStatus }: CurrentActionProps) => {
  const currentStageData = stages.find(s => s.isCurrent);

  if (!currentStageData) {
    // Todos os estágios concluídos
    return (
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-green-800">Parabéns!</CardTitle>
              <CardDescription className="text-green-600">
                Seu processo American Dream está concluído
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-green-700">
            Você completou todas as etapas do seu planejamento. Nossa equipe entrará em contato 
            para os próximos passos da sua jornada para os Estados Unidos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStageContent = () => {
    switch (currentStageData.stage) {
      case 1:
        return {
          icon: <CreditCard className="w-8 h-8 text-blue-600" />,
          title: "Realize seu Pagamento Inicial",
          description: "Para iniciar seu processo, é necessário realizar o pagamento da primeira parcela de US$ 999,00. Oferecemos diversas formas de pagamento.",
          showAction: true
        };
      case 2:
        return {
          icon: <ClipboardList className="w-8 h-8 text-blue-600" />,
          title: "Preencha o Formulário de Consultoria",
          description: "Precisamos conhecer melhor você! Preencha o formulário com suas informações pessoais, profissionais e objetivos para personalizarmos seu planejamento.",
          showAction: true
        };
      case 3:
        return {
          icon: <Calendar className="w-8 h-8 text-blue-600" />,
          title: firstMeetingDate ? "Sua Reunião Estratégica" : "Aguarde o Agendamento",
          description: firstMeetingDate 
            ? `Sua reunião está agendada para ${new Date(firstMeetingDate).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}. Prepare-se para discutir seus objetivos!`
            : "O agendamento da sua primeira reunião estratégica será feito ao final do formulário. Se você já preencheu, aguarde nosso contato.",
          showAction: false
        };
      case 4:
        return {
          icon: <FileSearch className="w-8 h-8 text-blue-600" />,
          title: "Planejamento em Andamento",
          description: planStatus === 'draft' 
            ? "Nosso time de especialistas está trabalhando no seu planejamento personalizado. Este processo leva de 5 a 7 dias úteis."
            : "Seu planejamento está sendo finalizado. Em breve você receberá a notificação para a apresentação.",
          showAction: false
        };
      case 5:
        return {
          icon: <Banknote className="w-8 h-8 text-blue-600" />,
          title: "Segunda Parcela do Investimento",
          description: "Para dar continuidade ao seu processo e agendar a apresentação do plano, realize o pagamento da segunda parcela de US$ 999,00.",
          showAction: true
        };
      case 6:
        return {
          icon: <Target className="w-8 h-8 text-blue-600" />,
          title: "Apresentação do Plano",
          description: "A apresentação completa do seu planejamento American Dream será agendada em breve. Nossa equipe entrará em contato para definir a melhor data.",
          showAction: false
        };
      default:
        return {
          icon: <Pin className="w-8 h-8 text-blue-600" />,
          title: currentStageData.stageName,
          description: currentStageData.stageDescription,
          showAction: currentStageData.actionAvailable
        };
    }
  };

  const content = getStageContent();

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-blue-100">
            {content.icon}
          </div>
          <div>
            <CardTitle className="text-gray-800">{content.title}</CardTitle>
            <CardDescription className="text-blue-600">
              Etapa {currentStageData.stage} de 6
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          {content.description}
        </p>

        {content.showAction && currentStageData.actionAvailable && (
          <Link to={currentStageData.actionLink}>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg">
              {currentStageData.actionLabel}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        )}

        {!content.showAction && (
          <div className="flex items-center gap-2 text-blue-600 bg-blue-100 rounded-lg p-3">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Aguardando próxima etapa...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentAction;
