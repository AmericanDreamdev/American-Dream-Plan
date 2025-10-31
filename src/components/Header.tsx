import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-primary/20 backdrop-blur-lg">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg p-2 -ml-2"
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
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => {
                const section = document.getElementById('sobre-consultoria');
                if (section) {
                  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              Sobre
            </button>
            <button
              onClick={() => navigate('/lead-form')}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors hover-lift"
            >
              Começar Agora
            </button>
          </nav>

          {/* Mobile CTA Button */}
          <button
            onClick={() => navigate('/lead-form')}
            className="md:hidden px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Começar
          </button>
        </div>
      </div>
    </header>
  );
};

