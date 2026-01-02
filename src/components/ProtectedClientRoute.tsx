import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface ProtectedClientRouteProps {
  children: React.ReactNode;
}

const ProtectedClientRoute = ({ children }: ProtectedClientRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        console.log("ProtectedClientRoute: Verificando sessão...");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (!session) {
          console.log("ProtectedClientRoute: Sem sessão");
          setAuthenticated(false);
          setLoading(false);
          return;
        }

        // Verificar se o usuário tem um lead associado
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select('id')
          .eq('email', session.user.email?.toLowerCase())
          .order('created_at', { ascending: false }) // Added order
          .limit(1)
          .maybeSingle();

        if (leadError) {
          console.error("ProtectedClientRoute: Erro ao buscar lead:", leadError);
          // Decide how to handle this error. For now, we'll proceed as if no lead was found.
        }

        if (!leadData) {
          console.log("ProtectedClientRoute: Usuário autenticado, mas sem lead associado.");
          // Optionally redirect to a page to create a lead or show a message
          // For now, we'll still consider them authenticated to access the client area,
          // but the dashboard might handle lead creation.
        } else {
          console.log("ProtectedClientRoute: Lead encontrado para", session.user.email);
        }

        console.log("ProtectedClientRoute: Sessão encontrada para", session.user.email);
        setAuthenticated(true);
        
        // Não vamos bloquear o carregamento por causa do lead.
        // O hook useClientData no dashboard vai lidar com a criação/busca do lead.
        // Isso previne que a rota fique travada "verificando autenticação" se o banco demorar.
        setLoading(false);

      } catch (error) {
        console.error("Auth check error:", error);
        if (mounted) {
          setAuthenticated(false);
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Timeout de segurança para não ficar preso no loading eternamente
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn("ProtectedClientRoute: Timeout de segurança atingido, liberando loading");
        setLoading(false);
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        console.log("ProtectedClientRoute: Auth change event:", event);
        setAuthenticated(!!session);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-400" />
          <p className="mt-4 text-white/80">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/client/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedClientRoute;
