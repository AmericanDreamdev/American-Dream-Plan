import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll para o topo quando a rota mudar
    window.scrollTo(0, 0);
  }, [pathname]);

  // Também garantir que role para o topo quando a página for recarregada
  useEffect(() => {
    // Desabilitar restauração automática de scroll do navegador
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    
    // Garantir que está no topo ao carregar
    window.scrollTo(0, 0);
  }, []);

  return null;
};

