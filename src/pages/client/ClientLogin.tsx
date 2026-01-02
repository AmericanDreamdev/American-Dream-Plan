import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ClientLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Redirecionar se já estiver logado
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/client/dashboard", { replace: true });
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("Email ou senha incorretos");
        return;
      }

      if (data.user) {
        // Verificar se usuário tem lead associado (pegando o mais antigo se houver duplicidade)
        const { data: leadData } = await supabase
          .from('leads')
          .select('id, user_id')
          .eq('email', email.toLowerCase())
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!leadData) {
          // Se não tem lead, pode ser admin tentando acessar área de cliente
          // Verifica se é admin
          const isAdmin = data.user.email?.includes('@323network.com') || 
                         data.user.email?.includes('@admin') ||
                         data.user.user_metadata?.role === 'admin';
          
          if (isAdmin) {
            setError("Esta área é apenas para clientes. Use o login do admin.");
            await supabase.auth.signOut();
            return;
          }
          
          // Criar lead para o novo usuário
          await supabase
            .from('leads')
            .insert({
              name: data.user.user_metadata?.nome_completo || email.split('@')[0],
              email: email.toLowerCase(),
              phone: data.user.user_metadata?.telefone || '',
              user_id: data.user.id,
              status_geral: 'cadastrado'
            });
        } else if (leadData.user_id !== data.user.id) {
          // Associar user_id ao lead existente se ainda não estiver associado
          await supabase
            .from('leads')
            .update({ user_id: data.user.id })
            .eq('id', leadData.id);
        }

        // Login bem-sucedido, redirecionar para o dashboard do cliente
        navigate("/client/dashboard", { replace: true });
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="mx-auto mb-4">
            <img 
              src="/logo.png" 
              alt="American Dream" 
              className="h-16 mx-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Acesse sua conta
          </CardTitle>
          <CardDescription className="text-gray-600">
            Acompanhe seu processo American Dream
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pt-0">
          <div className="text-sm text-gray-600 text-center">
            Ainda não tem conta?{" "}
            <Link to="/lead-form" className="text-blue-600 hover:underline font-medium">
              Cadastre-se
            </Link>
          </div>
          <div className="w-full border-t pt-3">
            <Link 
              to="/oferta" 
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
            >
              ← Voltar para a página principal
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ClientLogin;
