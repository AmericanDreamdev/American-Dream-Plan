import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Shield, Video, Users } from "lucide-react";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    fill="currentColor" 
    className={className}
    viewBox="0 0 16 16"
  >
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
  </svg>
);

interface HeroSectionProps {
  whatsappLink: string;
}

const HeroSection = ({ whatsappLink }: HeroSectionProps) => {
  return (
    <>
      <Header />
      <section className="relative pt-24 pb-12 md:pt-28 md:pb-16 lg:py-20 bg-background min-h-screen flex items-start lg:items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center">
            {/* Left Section - Content */}
            <div className="space-y-4 md:space-y-6 text-center lg:text-left order-1">
              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight">
                Construa seu caminho para o{" "}
                <span className="text-[#023E8A] relative inline-block">
                  American Dream
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-red-500"></span>
                </span>
              </h1>
              
              {/* Sub-heading */}
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground">
                com clareza, estratégia e suporte de quem já chegou lá
              </p>
              
              {/* Descriptive Paragraph */}
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
                Descubra o método que transforma o sonho de viver legalmente nos EUA em um plano prático e real, sem atalhos e sem achismos.
              </p>

              {/* CTA Button */}
              <div className="pt-2 md:pt-4 flex justify-center lg:justify-start">
                <Button
                  onClick={() => window.open(whatsappLink, "_blank")}
                  className="bg-[#25D366] hover:bg-[#20BA5A] text-white text-base md:text-lg px-6 md:px-8 py-5 md:py-6 h-auto rounded-lg shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
                >
                  <WhatsAppIcon className="mr-2" />
                  Quero Participar da Live Gratuita
                </Button>
              </div>

              {/* Feature Badges */}
              <div className="flex flex-wrap gap-3 pt-2 md:pt-4 justify-center lg:justify-start">
                <div className="flex items-center gap-2 bg-white px-3 md:px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 text-[#023E8A]" />
                  <span className="text-xs md:text-sm font-medium text-gray-700">100% Gratuito</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 md:px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                  <Video className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                  <span className="text-xs md:text-sm font-medium text-gray-700">Ao Vivo</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 md:px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-[#25D366]" />
                  <span className="text-xs md:text-sm font-medium text-gray-700">+7K Aprovados</span>
                </div>
              </div>
            </div>

            {/* Right Section - Image */}
            <div className="relative order-2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-sm mx-auto lg:max-w-sm">
                <img
                  src="/foto 9 ceme.webp"
                  alt="American Dream - Consultoria"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    // Fallback para uma imagem placeholder se a imagem não existir
                    e.currentTarget.src = "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=600&fit=crop";
                  }}
                />
                
                {/* Live Confirmada Badge */}
                <div className="absolute top-3 md:top-4 left-3 md:left-4 bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg shadow-lg flex items-center gap-2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#25D366] rounded-full"></div>
                  <span className="text-xs md:text-sm font-semibold text-gray-800">Live Confirmada</span>
                </div>

                {/* 7K+ Aprovados Badge */}
                <div className="absolute bottom-3 md:bottom-4 right-3 md:right-4 bg-white px-4 md:px-6 py-3 md:py-4 rounded-lg shadow-lg text-center">
                  <div className="text-2xl md:text-3xl font-bold text-[#023E8A]">7K+</div>
                  <div className="text-xs md:text-sm font-medium text-gray-600">Aprovados</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;

