import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface CalendlyEmbedProps {
  url?: string;
  prefill?: {
    name?: string;
    email?: string;
  };
}

export const CalendlyEmbed = ({ 
  url = "https://calendly.com/contato-brantimmigration/30min",
  prefill 
}: CalendlyEmbedProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar script do Calendly se ainda não estiver carregado
    if (!document.querySelector('script[src*="calendly.com"]')) {
      const script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Construir URL com parâmetros de prefill se disponíveis
  const buildCalendlyUrl = () => {
    if (!url) return "";
    
    try {
      const calendlyUrl = new URL(url);
      
      if (prefill) {
        // Garantir que name seja uma string válida antes de usar
        const name = prefill.name;
        if (name && typeof name === 'string' && name.trim()) {
          calendlyUrl.searchParams.set("name", name.trim());
        }
        
        // Garantir que email seja uma string válida antes de usar
        const email = prefill.email;
        if (email && typeof email === 'string' && email.trim()) {
          calendlyUrl.searchParams.set("email", email.trim());
        }
      }
      
      return calendlyUrl.toString();
    } catch (error) {
      console.error("[CalendlyEmbed] Erro ao construir URL:", error);
      return url; // Retornar URL original em caso de erro
    }
  };

  const calendlyUrl = buildCalendlyUrl();

  const handleIframeLoad = () => {
    // Adicionar um pequeno delay para garantir que o conteúdo esteja totalmente renderizado
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="w-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            <p className="text-sm text-gray-600 font-medium">Carregando calendário...</p>
          </div>
        </div>
      )}
      <iframe
        src={calendlyUrl}
        width="100%"
        height="700"
        frameBorder="0"
        title="Calendly Scheduling"
        className="calendly-inline-widget"
        style={{ minHeight: "700px" }}
        onLoad={handleIframeLoad}
      />
    </div>
  );
};

// Declaração do tipo global para Calendly
declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        prefill?: {
          name?: string;
          email?: string;
        };
      }) => void;
    };
  }
}

