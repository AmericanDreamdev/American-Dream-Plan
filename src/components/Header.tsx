import { useNavigate, useLocation } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

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
          <nav className="hidden md:flex items-center gap-6">
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
          </nav>

          {/* Mobile CTA Button */}
          <button
            onClick={() => {
              if (isHomePage) {
                window.open(whatsappLink, '_blank');
              } else {
                navigate('/lead-form');
              }
            }}
            className="md:hidden px-4 py-2 bg-white text-[#0575E6] rounded-lg font-semibold text-sm transition-all hover:bg-white/90"
          >
            Começar
          </button>
        </div>
      </div>
    </header>
  );
};

