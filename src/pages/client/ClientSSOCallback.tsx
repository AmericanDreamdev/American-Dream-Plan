import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function ClientSSOCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleSSO = async () => {
      const token = searchParams.get('token');

      if (!token) {
        console.error('[SSO] Token não encontrado na URL');
        setError('Token de autenticação não encontrado');
        setTimeout(() => {
          navigate('/client/login');
        }, 2000);
        return;
      }

      try {
        console.log('[SSO] Detectado login automático da 323 Network...');
        
        const { data, error: authError } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: '', // O Supabase reidrata a sessão com o access_token
        });

        if (authError) {
          throw authError;
        }

        if (data?.session) {
          console.log('[SSO] Sessão vinculada com sucesso!');
          
          // Limpar token da URL para segurança e estética
          const newUrl = window.location.pathname.replace('/client/sso-callback', '/client/dashboard');
          window.history.replaceState({}, document.title, newUrl);
          
          // Redirecionar para o dashboard do cliente
          navigate('/client/dashboard', { replace: true });
        } else {
          throw new Error('Sessão não foi criada');
        }
      } catch (err: any) {
        console.error('[SSO] Erro ao validar token externo:', err.message);
        setError(`Falha na autenticação: ${err.message || 'Por favor, tente novamente.'}`);
        setTimeout(() => {
          navigate('/client/login');
        }, 3000);
      }
    };

    handleSSO();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-6">
          <div className="text-red-600 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro na Autenticação</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#0575E6] mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Conectando com 323 Network</h1>
        <p className="text-gray-600">Autenticando sua sessão. Isso levará apenas alguns instantes.</p>
      </div>
    </div>
  );
}
