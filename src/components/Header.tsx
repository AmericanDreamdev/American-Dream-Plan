import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { LogIn, LayoutDashboard } from "lucide-react";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/');
  };

  const whatsappLink = 'https://chat.whatsapp.com/C5k7GQN1N5L0qmkDZgUlMn';

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] border-b border-white/20 backdrop-blur-lg bg-gradient-to-r from-[#023E8A]/95 to-[#012A5E]/95 shadow-lg">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg p-2 -ml-2"
            aria-label="Ir para o início"
          >
            <img 
              src="/logo-bg.webp" 
              alt="American Dream Logo" 
              className="h-12 w-auto object-contain"
            />
            <span className="text-xl font-bold text-white hidden sm:inline-block">
              American Dream
            </span>
          </button>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            {!isHomePage && (
              <button
                onClick={() => {
                  const section = document.getElementById('sobre-consultoria');
                  if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="text-white/90 hover:text-white transition-colors font-medium"
              >
                Sobre
              </button>
            )}
            <button
              onClick={() => {
                // Redirecionar para 323 Network
                const network323Url = import.meta.env.VITE_323_NETWORK_URL || "https://323network.com";
                const callbackUrl = new URL("/auth/callback", window.location.origin);
                callbackUrl.searchParams.set("country", "US"); // Padrão, pode ser detectado depois
                const returnTo = encodeURIComponent(callbackUrl.toString());
                
                const redirectUrl = new URL("/login", network323Url);
                redirectUrl.searchParams.set("source", "american-dream");
                redirectUrl.searchParams.set("returnTo", returnTo);
                
                window.location.href = redirectUrl.toString();
              }}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors font-medium"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              Entrar
            </button>
            <button
              onClick={() => {
                if (isHomePage) {
                  window.open(whatsappLink, '_blank');
                } else {
                  navigate('/lead-form');
                }
              }}
              className="px-6 py-2 bg-white text-[#023E8A] rounded-lg font-semibold transition-all hover:bg-white/90 hover:shadow-lg hover:scale-105"
            >
              Começar Agora
            </button>

            {/* Auth Button */}
            <button
                onClick={handleAuthAction}
                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors font-medium ml-2"
            >
                {user ? (
                    <>
                        <LayoutDashboard className="h-4 w-4" />
                        Meu Painel
                    </>
                ) : (
                    <>
                        <LogIn className="h-4 w-4" />
                        Entrar
                    </>
                )}
            </button>
          </nav>

          {/* Mobile Buttons */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => {
                // Redirecionar para 323 Network
                const network323Url = import.meta.env.VITE_323_NETWORK_URL || "https://323network.com";
                const callbackUrl = new URL("/auth/callback", window.location.origin);
                callbackUrl.searchParams.set("country", "US");
                const returnTo = encodeURIComponent(callbackUrl.toString());
                
                const redirectUrl = new URL("/login", network323Url);
                redirectUrl.searchParams.set("source", "american-dream");
                redirectUrl.searchParams.set("returnTo", returnTo);
                
                window.location.href = redirectUrl.toString();
              }}
              className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors font-medium text-sm"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="w-3.5 h-3.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              Entrar
            </button>
            <button
              onClick={() => {
                if (isHomePage) {
                  window.open(whatsappLink, '_blank');
                } else {
                  navigate('/lead-form');
                }
              }}
              className="px-4 py-2 bg-white text-[#0575E6] rounded-lg font-semibold text-sm transition-all hover:bg-white/90"
            >
              Começar
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
