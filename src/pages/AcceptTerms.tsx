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
import { Loader2, CheckCircle2 } from "lucide-react";

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

    const handleScroll = () => {
      const scrollArea = scrollAreaRef.current;
      if (!scrollArea) return;

      const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (!viewport) return;

      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20; // 20px tolerance
      setHasScrolledToBottom(isAtBottom);
    };

    // Check on mount and after content loads
    const checkInterval = setInterval(() => {
      handleScroll();
    }, 200);

    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.addEventListener("scroll", handleScroll);
      // Initial check
      setTimeout(handleScroll, 300);
      
      return () => {
        clearInterval(checkInterval);
        viewport.removeEventListener("scroll", handleScroll);
      };
    }

    return () => {
      clearInterval(checkInterval);
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle className="text-2xl">
                  {activeTerm?.title || "Termos e Condições"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Leia os termos e condições completos. Role até o final para aceitar.
                </DialogDescription>
              </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12 px-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-4 mx-6 bg-destructive/20 border border-destructive rounded-md text-sm text-destructive">
              {error}
            </div>
          ) : activeTerm ? (
            <>
              <ScrollArea className="flex-1 min-h-0 max-h-[60vh] px-6" ref={scrollAreaRef}>
                <div
                  className="prose prose-invert max-w-none p-4 pb-8 text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_p]:text-gray-300 [&_li]:text-gray-300 [&_strong]:text-white"
                  dangerouslySetInnerHTML={{ __html: activeTerm.content }}
                />
              </ScrollArea>

              <div className="mt-4 space-y-4 border-t border-border pt-4 px-6 pb-6">
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
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Li e concordo com os termos e condições acima.{" "}
                    {!hasScrolledToBottom && (
                      <span className="text-muted-foreground text-xs">
                        (Role até o final para aceitar)
                      </span>
                    )}
                  </Label>
                </div>

                {termsAccepted && (
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Termos aceitos com sucesso!</span>
                  </div>
                )}

                <Button
                  onClick={handleAcceptTerms}
                  disabled={!hasScrolledToBottom || termsAccepted || acceptingTerms}
                  className="w-full bg-primary hover:bg-primary/90"
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

