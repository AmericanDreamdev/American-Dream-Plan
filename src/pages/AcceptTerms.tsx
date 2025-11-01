import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useTermsAcceptance } from "@/hooks/useTermsAcceptance";
import { Loader2, CheckCircle2, ChevronDown } from "lucide-react";

interface Term {
  id: string;
  title: string;
  content: string;
  term_type: string;
}

const AcceptTerms = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const leadId = (location.state as { leadId?: string })?.leadId;
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [activeTerm, setActiveTerm] = useState<Term | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { recordTermAcceptance, loading: acceptingTerms } =
    useTermsAcceptance();

  // Redirect if no leadId
  useEffect(() => {
    if (!leadId) {
      navigate("/lead-form");
    }
  }, [leadId, navigate]);

  // Load active term and check if already accepted
  useEffect(() => {
    const loadActiveTerm = async () => {
      try {
        // Verificar se já existe aceitação para este lead
        const { data: existingAcceptance } = await supabase
          .from("term_acceptance")
          .select("id")
          .eq("lead_id", leadId)
          .eq("term_type", "lead_contract")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Se já aceitou, redirecionar para página de pagamento
        if (existingAcceptance) {
          navigate("/process-payment", { 
            state: { 
              leadId, 
              termAcceptanceId: existingAcceptance.id 
            },
            replace: true 
          });
          return;
        }

        // Carregar termo ativo
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
        console.error("Error details:", {
          message: err.message,
          code: err.code,
          details: err.details,
          hint: err.hint
        });
        setError(`Erro ao carregar termos: ${err.message || "Tente novamente."}`);
      } finally {
        setLoading(false);
      }
    };

    if (leadId) {
      loadActiveTerm();
    }
  }, [leadId, navigate]);

  // Handle scroll detection
  useEffect(() => {
    if (!activeTerm) return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      const scrollArea = scrollAreaRef.current;
      if (!scrollArea) return;

      const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (!viewport) return;

      const { scrollTop, scrollHeight, clientHeight } = viewport;
      // Aumentar a tolerância para evitar mudanças rápidas de estado
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 30; // 30px tolerance
      
      // Usar debounce para evitar piscar
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
      setHasScrolledToBottom(isAtBottom);
      }, 100);
    };

    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.addEventListener("scroll", handleScroll, { passive: true });
      // Initial check
      setTimeout(handleScroll, 300);
      
      return () => {
        clearTimeout(timeoutId);
        viewport.removeEventListener("scroll", handleScroll);
      };
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [activeTerm]);

  const handleAcceptTerms = async () => {
    if (!activeTerm || !leadId || !hasScrolledToBottom) return;

    try {
      const acceptanceId = await recordTermAcceptance(
        leadId,
        activeTerm.id,
        "lead_contract"
      );

      if (acceptanceId) {
        setTermsAccepted(true);
        
        // Redirecionar para página de pagamento
        navigate("/process-payment", { 
          state: { 
            leadId, 
            termAcceptanceId: acceptanceId 
          } 
        });
      } else {
        setError("Erro ao registrar aceitação. Tente novamente.");
      }
    } catch (err) {
      console.error("Error accepting terms:", err);
      setError("Erro ao processar aceitação. Tente novamente.");
    }
  };

  if (!leadId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <style>{`
        [data-radix-dialog-overlay] {
          background: white !important;
          background-color: white !important;
        }
        .fixed.inset-0.z-50.bg-black\\/80 {
          background: white !important;
          background-color: white !important;
        }
        [class*="bg-black/80"] {
          background: white !important;
          background-color: white !important;
        }
      `}</style>
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent noOverlay className="max-w-4xl max-h-[90vh] flex flex-col p-0 bg-white border-gray-200 shadow-2xl [&>button]:text-gray-700 [&>button]:hover:text-gray-900 [&>button]:hover:bg-gray-100">
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle className="text-2xl text-gray-900">
                  {activeTerm?.title || "Termos e Condições"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Leia os termos e condições completos. Role até o final para aceitar.
                </DialogDescription>
              </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12 px-6">
              <Loader2 className="h-8 w-8 animate-spin text-[#0575E6]" />
            </div>
          ) : error ? (
            <div className="p-4 mx-6 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
              {error}
            </div>
          ) : activeTerm ? (
            <>
              <ScrollArea className="flex-1 min-h-0 max-h-[60vh] px-6 relative" ref={scrollAreaRef}>
                <style>{`
                  .terms-content * {
                    color: #1f2937 !important;
                    color: rgb(31, 41, 55) !important;
                  }
                  .terms-content h1,
                  .terms-content h2,
                  .terms-content h3,
                  .terms-content h4,
                  .terms-content h5,
                  .terms-content h6 {
                    color: #111827 !important;
                    color: rgb(17, 24, 39) !important;
                  }
                  .terms-content p,
                  .terms-content li,
                  .terms-content span,
                  .terms-content div {
                    color: #1f2937 !important;
                    color: rgb(31, 41, 55) !important;
                  }
                  .terms-content a {
                    color: #0575E6 !important;
                  }
                  .terms-content a:hover {
                    color: #021B79 !important;
                  }
                  @keyframes scroll-hint {
                    0%, 100% {
                      transform: translateY(0) scale(1);
                      opacity: 0.6;
                    }
                    50% {
                      transform: translateY(8px) scale(1.1);
                      opacity: 1;
                    }
                  }
                  @keyframes fade-in-out {
                    0%, 100% {
                      opacity: 0.3;
                    }
                    50% {
                      opacity: 0.8;
                    }
                  }
                  .scroll-hint {
                    animation: scroll-hint 2s ease-in-out infinite;
                  }
                  .scroll-fade {
                    animation: fade-in-out 2s ease-in-out infinite;
                  }
                `}</style>
                
                {/* Gradiente inferior indicando mais conteúdo */}
                {!hasScrolledToBottom && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none z-10 flex items-end justify-center pb-2 transition-opacity duration-300">
                    <div className="flex flex-col items-center gap-2 scroll-hint">
                      <ChevronDown className="h-6 w-6 text-[#0575E6] drop-shadow-sm" />
                      <div className="text-xs text-gray-600 font-medium scroll-fade">Continue rolando</div>
                    </div>
                  </div>
                )}

                <div
                  className="prose max-w-none p-4 pb-8 terms-content text-gray-900 [&_*]:!text-gray-900 [&_h1]:!text-gray-900 [&_h2]:!text-gray-900 [&_h3]:!text-gray-900 [&_h4]:!text-gray-900 [&_h5]:!text-gray-900 [&_h6]:!text-gray-900 [&_p]:!text-gray-900 [&_li]:!text-gray-900 [&_span]:!text-gray-900 [&_div]:!text-gray-900 [&_strong]:!text-gray-900 [&_em]:!text-gray-900 [&_a]:!text-[#0575E6] [&_a:hover]:!text-[#021B79]"
                  dangerouslySetInnerHTML={{ __html: activeTerm.content }}
                />

                {/* Indicador no final do conteúdo */}
                {hasScrolledToBottom && (
                  <div className="flex items-center justify-center gap-2 py-4 text-[#0575E6]">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Você leu todos os termos</span>
                  </div>
                )}
              </ScrollArea>

              <div className="mt-4 space-y-4 border-t border-gray-200 pt-4 px-6 pb-6">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="accept-terms"
                    checked={termsAccepted || hasScrolledToBottom}
                    disabled={termsAccepted || !hasScrolledToBottom}
                    onCheckedChange={(checked) => {
                      if (checked && hasScrolledToBottom) {
                        handleAcceptTerms();
                      }
                    }}
                  />
                  <Label
                    htmlFor="accept-terms"
                    className="text-sm leading-none text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Li e concordo com os termos e condições acima.
                  </Label>
                </div>


                {termsAccepted && (
                  <div className="flex items-center gap-2 text-[#0575E6]">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Termos aceitos com sucesso!</span>
                  </div>
                )}

                <Button
                  onClick={handleAcceptTerms}
                  disabled={!hasScrolledToBottom || termsAccepted || acceptingTerms}
                  className={`w-full font-semibold shadow-lg transition-all ${
                    !hasScrolledToBottom
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#0575E6] to-[#021B79] hover:from-[#0685F6] hover:to-[#032B89] text-white hover:shadow-xl"
                  }`}
                  size="lg"
                >
                  {acceptingTerms ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : termsAccepted ? (
                    "Termos Aceitos"
                  ) : (
                    "Aceitar Termos"
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AcceptTerms;


