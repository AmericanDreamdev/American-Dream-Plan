import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowLeft } from "lucide-react";

interface Term {
  id: string;
  title: string;
  content: string;
  term_type: string;
}

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Detectar de onde veio: se tem state com returnTo, usa isso, senão tenta pelo referrer
  const returnTo = (location.state as { returnTo?: string })?.returnTo || 
                   (document.referrer.includes('/lead-form') ? '/lead-form' : '/');
  const [activeTerm, setActiveTerm] = useState<Term | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Aplicar fundo branco na montagem e limpar na desmontagem
  useEffect(() => {
    // Salvar estilo original do body
    const originalBodyStyle = document.body.style.cssText;
    const originalHtmlStyle = document.documentElement.style.cssText;
    
    // Aplicar fundo branco
    document.body.style.cssText = 'background: #ffffff !important; background-color: #ffffff !important; background-image: none !important;';
    document.documentElement.style.cssText = 'background: #ffffff !important; background-color: #ffffff !important;';
    
    // Ocultar pseudo-elementos azuis
    const styleElement = document.createElement('style');
    styleElement.id = 'terms-white-bg';
    styleElement.textContent = `
      body::before,
      body::after {
        display: none !important;
      }
      #root {
        background-color: #ffffff !important;
      }
    `;
    document.head.appendChild(styleElement);

    // Cleanup na desmontagem
    return () => {
      document.body.style.cssText = originalBodyStyle;
      document.documentElement.style.cssText = originalHtmlStyle;
      const existingStyle = document.getElementById('terms-white-bg');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  useEffect(() => {
    const loadActiveTerm = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("application_terms")
          .select("*")
          .eq("term_type", "lead_contract")
          .eq("is_active", true)
          .order("version", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          setActiveTerm(data);
        } else {
          setError("Nenhum termo ativo encontrado.");
        }
      } catch (err: any) {
        console.error("Error loading term:", err);
        setError(`Erro ao carregar termos: ${err.message || "Tente novamente."}`);
      } finally {
        setLoading(false);
      }
    };

    loadActiveTerm();
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ backgroundColor: '#ffffff' }}>
      <style>{`
        body {
          background-color: #ffffff !important;
          background: #ffffff !important;
          background-image: none !important;
        }
        html {
          background-color: #ffffff !important;
          background: #ffffff !important;
        }
        body::before,
        body::after {
          display: none !important;
        }
        #root {
          background-color: #ffffff !important;
        }
      `}</style>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(returnTo)}
            className="mb-4 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            style={{ backgroundColor: '#ffffff', color: '#374151', borderColor: '#d1d5db' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          {activeTerm && (
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {activeTerm.title}
            </h1>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0575E6]" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Terms Content */}
        {activeTerm && !loading && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <ScrollArea className="h-[calc(100vh-250px)] p-6">
              <style>{`
                .terms-content * {
                  color: #1f2937 !important;
                }
                .terms-content h1,
                .terms-content h2,
                .terms-content h3,
                .terms-content h4,
                .terms-content h5,
                .terms-content h6 {
                  color: #111827 !important;
                  font-weight: 600;
                  margin-top: 1.5rem;
                  margin-bottom: 0.75rem;
                }
                .terms-content h1 {
                  font-size: 1.875rem;
                }
                .terms-content h2 {
                  font-size: 1.5rem;
                }
                .terms-content h3 {
                  font-size: 1.25rem;
                }
                .terms-content p {
                  margin-bottom: 1rem;
                  line-height: 1.75;
                }
                .terms-content ul,
                .terms-content ol {
                  margin-left: 1.5rem;
                  margin-bottom: 1rem;
                }
                .terms-content li {
                  margin-bottom: 0.5rem;
                  line-height: 1.75;
                }
                .terms-content a {
                  color: #0575E6 !important;
                  text-decoration: underline;
                }
                .terms-content a:hover {
                  color: #021B79 !important;
                }
                .terms-content strong {
                  font-weight: 600;
                  color: #111827 !important;
                }
                .terms-content em {
                  font-style: italic;
                }
              `}</style>
              <div
                className="prose max-w-none terms-content text-gray-900"
                dangerouslySetInnerHTML={{ __html: activeTerm.content }}
              />
            </ScrollArea>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate(returnTo)}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2"
            style={{ backgroundColor: '#ffffff', color: '#374151', borderColor: '#d1d5db' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;

