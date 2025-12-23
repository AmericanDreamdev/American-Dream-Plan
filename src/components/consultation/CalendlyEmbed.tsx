import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";

interface CalendlyEmbedProps {
  url?: string;
  prefill?: {
    name?: string;
    email?: string;
  };
  onSchedule?: (payload: any) => void;
}

export const CalendlyEmbed = ({ 
  url = "https://calendly.com/contato-brantimmigration/30min",
  prefill,
  onSchedule
}: CalendlyEmbedProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Construir URL com parâmetros de prefill
  const buildCalendlyUrl = () => {
    try {
      const urlObj = new URL(url);
      if (prefill?.name && prefill.name.trim()) {
        urlObj.searchParams.set("name", prefill.name.trim());
      }
      if (prefill?.email && prefill.email.trim()) {
        urlObj.searchParams.set("email", prefill.email.trim());
      }
      return urlObj.toString();
    } catch (error) {
      console.error("[CalendlyEmbed] Erro ao construir URL:", error);
      return url;
    }
  };

  const calendlyUrl = buildCalendlyUrl();

  // Carregar script do Calendly e CSS
  useEffect(() => {
    // Adicionar CSS do Calendly se não existir
    if (!document.querySelector('link[href*="calendly.com/assets/external/widget.css"]')) {
      const link = document.createElement("link");
      link.href = "https://assets.calendly.com/assets/external/widget.css";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    // Adicionar script do Calendly se não existir
    if (!document.querySelector('script[src*="calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.head.appendChild(script);
    }

    // Remover loading após um tempo
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Listener para eventos do Calendly
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Verificar se a mensagem é do Calendly
      if (!e.data || typeof e.data !== 'object') {
        return;
      }

      const eventType = e.data.event;
      
      // Filtrar apenas eventos do Calendly
      if (!eventType || typeof eventType !== 'string' || !eventType.startsWith('calendly.')) {
        return;
      }
      
      if (eventType === "calendly.event_scheduled") {
        if (onSchedule) {
          onSchedule(e.data.payload);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onSchedule]);

  return (
    <div className="w-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10 rounded-lg" style={{ minHeight: "400px" }}>
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            <p className="text-sm text-gray-600 font-medium">Carregando calendário...</p>
          </div>
        </div>
      )}
      {/* Elemento padrão do Calendly com data-url */}
      <div 
        ref={containerRef}
        className="calendly-inline-widget"
        data-url={calendlyUrl}
        style={{ minWidth: "320px", height: "700px" }}
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
        utm?: Record<string, string>;
      }) => void;
    };
  }
}
