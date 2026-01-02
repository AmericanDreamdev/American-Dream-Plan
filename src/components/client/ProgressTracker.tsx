import { ClientStage } from "@/hooks/useClientData";
import { Check, Circle, Clock } from "lucide-react";

interface ProgressTrackerProps {
  stages: ClientStage[];
  currentStage: number;
}

const ProgressTracker = ({ stages, currentStage }: ProgressTrackerProps) => {
  const getStageIcon = (stage: ClientStage) => {
    if (stage.isCompleted) {
      return (
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
          <Check className="w-5 h-5 text-white" />
        </div>
      );
    }
    if (stage.isCurrent) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg animate-pulse">
          <Clock className="w-5 h-5 text-white" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
        <Circle className="w-5 h-5 text-gray-400" />
      </div>
    );
  };

  const getStageEmoji = (stageNumber: number) => {
    return "";
  };

  return (
    <div className="space-y-4">
      {/* Versão Desktop */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Linha de conexão */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200" />
          <div 
            className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
            style={{ 
              width: `${((currentStage - 1) / (stages.length - 1)) * 100}%`,
              maxWidth: 'calc(100% - 40px)'
            }}
          />
          
          {/* Estágios */}
          <div className="relative flex justify-between">
            {stages.map((stage) => (
              <div 
                key={stage.stage}
                className="flex flex-col items-center"
                style={{ width: `${100 / stages.length}%` }}
              >
                {getStageIcon(stage)}
                <div className="mt-2 text-center">
                  <p className={`text-xs font-medium mt-1 ${
                    stage.isCompleted ? 'text-green-600' : 
                    stage.isCurrent ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {stage.stageName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Versão Mobile */}
      <div className="md:hidden space-y-3">
        {stages.map((stage, index) => (
          <div 
            key={stage.stage}
            className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
              stage.isCurrent 
                ? 'bg-blue-50 border border-blue-200' 
                : stage.isCompleted 
                  ? 'bg-green-50 border border-green-100' 
                  : 'bg-gray-50 border border-gray-100'
            }`}
          >
            <div className="relative">
              {getStageIcon(stage)}
              {index < stages.length - 1 && (
                <div className={`absolute top-10 left-1/2 w-0.5 h-6 -translate-x-1/2 ${
                  stage.isCompleted ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold ${
                  stage.isCompleted ? 'text-green-700' : 
                  stage.isCurrent ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  {stage.stageName}
                </h3>
              </div>
              <p className={`text-sm mt-1 ${
                stage.isCurrent ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {stage.stageDescription}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;
