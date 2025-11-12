import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Square, Heart, AlertCircle, Video, CheckCircle2, Play, Download, Bell, Users2, MapPin, Building, Award, Shield, Clock, Headphones } from "lucide-react";
import { SpecialistCarousel } from "@/components/ui/specialist-carousel";
import HeroSection from "@/components/HeroSection";

const WHATSAPP_LINK = "https://chat.whatsapp.com/C5k7GQN1N5L0qmkDZgUlMn";

// Componente da seção de WhatsApp
const WhatsAppFormSection = () => {
  return (
    <>
      <style>{`
        .whatsapp-section-no-hover,
        .whatsapp-section-no-hover *,
        .whatsapp-section-no-hover *:hover,
        .whatsapp-section-no-hover *:focus,
        .whatsapp-section-no-hover *:active {
          transition: none !important;
          animation: none !important;
          transform: none !important;
        }
        .whatsapp-section-no-hover button,
        .whatsapp-section-no-hover button:hover {
          transition: background-color 0.2s ease, box-shadow 0.2s ease !important;
          transform: none !important;
        }
      `}</style>
      <section className="whatsapp-section-no-hover py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 text-primary-foreground text-center">
            Ao entrar no grupo oficial do WhatsApp, você garante
          </h2>
          
          <div className="space-y-6 mb-8">
            {[
              {
                icon: Play,
                text: "Link da live gratuita em primeira mão.",
              },
              {
                icon: Download,
                text: "Materiais de apoio exclusivos (checklists, guias e cronograma).",
              },
              {
                icon: Bell,
                text: "Avisos antecipados de conteúdos e oportunidades.",
              },
              {
                icon: Users2,
                text: "Acesso à comunidade oficial para networking e dúvidas.",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-foreground flex items-center justify-center mt-0.5">
                    <span className="text-primary font-bold text-sm">*</span>
                  </div>
                  <p className="text-primary-foreground text-base leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>

          {/* Warning Box */}
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm mb-8">
            <p className="text-lg font-medium text-center lg:text-left text-primary-foreground">
              Vagas limitadas para manter a qualidade do suporte!
            </p>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <Button
              onClick={() => window.open(WHATSAPP_LINK, "_blank")}
              className="bg-[#25D366] hover:bg-[#25D366] text-white text-lg px-8 py-6 h-auto rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                fill="white" 
                className="mr-2"
                viewBox="0 0 16 16"
              >
                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
              </svg>
              Entrar no Grupo WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </section>
    </>
  );
};

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection whatsappLink={WHATSAPP_LINK} />

      {/* What You'll Learn Section */}
      <section id="benefits" className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-4 text-foreground">
              O que você vai aprender na{" "}
              <span className="text-[#023E8A]">Live Gratuita</span>
            </h2>
            
            {/* Subtitle */}
            <p className="text-center text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Conteúdo exclusivo e prático para transformar seu sonho em realidade
            </p>

            {/* Cards Grid */}
            <div className="grid gap-6 sm:grid-cols-2 mb-12">
              {[
                {
                  icon: Trophy,
                  iconColor: "text-[#023E8A]",
                  title: "Os 3 pilares para conquistar o sonho americano",
                  description: "sem cair nas armadilhas que travam a maioria.",
                },
                {
                  icon: Square,
                  iconColor: "text-gray-400",
                  title: "O passo a passo real",
                  description: "para organizar sua jornada — do planejamento ao primeiro visto.",
                },
                {
                  icon: Heart,
                  iconColor: "text-[#023E8A]",
                  title: "Como se preparar emocional e financeiramente",
                  description: "para mudar de país com segurança.",
                },
                {
                  icon: AlertCircle,
                  iconColor: "text-red-500",
                  title: "Os erros mais comuns",
                  description: "que fazem muita gente desistir (e como evitá-los).",
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={index}
                    className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white"
                  >
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className={`flex-shrink-0 ${item.iconColor}`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground mb-1 text-lg">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-base">
                          {item.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <Button
                onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                className="bg-[#023E8A] hover:bg-[#034A9F] text-white text-lg px-8 py-6 h-auto rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Video className="w-5 h-5 mr-2" />
                Live 100% gratuita e ao vivo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left Section - Content */}
            <div className="space-y-6">
              {/* Title */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 text-center lg:text-left">
                Para quem é
              </h2>
              
              {/* Subtitle */}
              <p className="text-lg text-gray-700">
                Se você:
              </p>

              {/* List Items */}
              <div className="space-y-4">
                {[
                  "Sempre sonhou em morar nos Estados Unidos, mas não sabe por onde começar.",
                  "Quer um plano estruturado, acessível e realista.",
                  "Está cansado de informações confusas ou promessas milagrosas.",
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-gray-700 text-base leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>

              {/* Highlight Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
                <p className="text-[#023E8A] font-semibold text-lg text-center">
                  Então essa live é para você.
                </p>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                className="bg-[#25D366] hover:bg-[#20BA5A] text-white text-lg px-8 py-6 h-auto rounded-lg shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  fill="currentColor" 
                  className="mr-2"
                  viewBox="0 0 16 16"
                >
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                </svg>
                Quero Participar
              </Button>
            </div>

            {/* Right Section - Image */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/foto 14 ceme_original.webp"
                  alt="Pessoas olhando para o American Dream"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <WhatsAppFormSection />

      {/* Why Participate Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left Section - Image */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/foto 2.webp"
                  alt="Planejamento e estratégia para o American Dream"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=600&fit=crop";
                  }}
                />
              </div>
            </div>

            {/* Right Section - Content */}
            <div className="space-y-8 text-center lg:text-left">
              {/* Title */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                Por que participar
              </h2>

              {/* Introductory Paragraph */}
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
                Você sai com um{" "}
                <span className="text-[#023E8A] font-bold">plano claro e acionável</span> para começar hoje — com suporte de quem
                entende o caminho até o sonho americano.
              </p>

              {/* Benefits List */}
              <div className="space-y-6">
                {[
                  {
                    icon: MapPin,
                    iconColor: "text-[#023E8A]",
                    title: "Estratégia Clara",
                    description: "Método testado e aprovado por milhares de brasileiros",
                  },
                  {
                    icon: Building,
                    iconColor: "text-red-500",
                    title: "Suporte Especializado",
                    description: "Orientação de quem já viveu essa jornada com sucesso",
                  },
                  {
                    icon: Award,
                    iconColor: "text-[#023E8A]",
                    title: "Resultados Reais",
                    description: "Plano prático que você pode começar a aplicar imediatamente",
                  },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex flex-col items-center lg:flex-row lg:items-start gap-4">
                      <div className={`flex-shrink-0 ${item.iconColor}`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="text-center lg:text-left">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">
                          {item.title}
                        </h3>
                        <p className="text-gray-700 text-base">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA Button */}
              <div className="pt-4 flex justify-center lg:justify-start">
                <Button
                  onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                  className="bg-[#25D366] hover:bg-[#20BA5A] text-white text-lg px-8 py-6 h-auto rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    fill="white" 
                    className="mr-2"
                    viewBox="0 0 16 16"
                  >
                    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                  </svg>
                  Garantir Minha Vaga Agora
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instructors Section */}
      <section className="py-12 md:py-24 relative z-10 bg-white overflow-x-hidden w-full max-w-full">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-gray-900 px-2">
              Quem vai te guiar
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 px-4">
              Experiência comprovada em processos de visto
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-12 max-w-5xl mx-auto">
            <Card className="overflow-hidden bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <div className="w-full relative overflow-hidden bg-gradient-to-b from-primary/10 to-primary/20">
                <SpecialistCarousel
                  images={[
                    "/foto 1 ceme.webp",
                    "/foto 2 ceme.webp",
                    "/foto 3 ceme.webp",
                    "/foto 4 ceme.webp",
                    "/foto 5 ceme.webp",
                    "/foto 7 ceme.webp",
                    "/foto 8 ceme.webp",
                    "/foto 9 ceme.webp",
                    "/foto 10 ceme.webp",
                    "/foto 11 ceme.webp",
                    "/foto 12 ceme.webp",
                    "/foto 13 ceme.webp",
                    "/foto 14 ceme.webp",
                    "/foto ceme 15.webp",
                    "/foto 16 ceme.webp",
                  ]}
                  name="Ceme Suaiden"
                  autoplay={true}
                  interval={4000}
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Ceme Suaiden</h3>
                <p className="text-primary mb-4">Especialista em Vistos F1</p>
                <p className="text-gray-700">
                  Ceme Suaiden é um empresário cuja atuação se destaca justamente por conectar o Brasil e os Estados Unidos. Ele fundou, em 2014, uma consultoria criada para ser uma ponte robusta entre os dois países, auxiliando brasileiros interessados em internacionalizar negócios, investir ou imigrar para os EUA. Suaiden identificou as dificuldades enfrentadas por brasileiros ao tentarem abrir empresas ou conquistar espaço no mercado americano — por isso, sua empresa oferece suporte prático durante todas as etapas do processo. Suaiden também é proprietário da holding Suaiden Inc. e dos grupos The Future of English e The Future Immigration Inc., atuando com foco em internacionalização e desenvolvimento de oportunidades bilaterais. Seu trabalho é reconhecido por transformar sonhos de empreendedores e investidores brasileiros em ativos tangíveis nos EUA, facilitando a entrada legal de pessoas físicas e jurídicas, promovendo investimentos, educação e crescimento mútuo.
                </p>
              </div>
            </Card>

            <Card className="overflow-hidden bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <div className="w-full relative overflow-hidden bg-gradient-to-b from-primary/10 to-primary/20">
                <SpecialistCarousel
                  images={[
                    "/foto 1 brant.webp",
                    "/foto 2 brant.webp",
                    "/foto 2.webp",
                    "/foto 3 bramt.webp",
                    "/foto 5 brat.webp",
                    "/foto 6 brant.webp",
                  ]}
                  name="Matheus Brant"
                  autoplay={true}
                  interval={4000}
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Matheus Brant</h3>
                <p className="text-primary mb-4">Especialista em B1/B2 e COS</p>
                <p className="text-gray-700">
                  Matheus Brant é a prova viva de que o sonho americano é possível. Depois de ter seu visto negado em 2016, ele voltou aprovado, estudou Business nos EUA e começou do zero — até fundar a Brant Immigration, hoje referência no mercado com mais de 7.000 vidas dolarizadas. Empresário, mentor e sócio da 323 Network em Hollywood, Matheus transforma histórias de brasileiros em estratégias reais de entrada, permanência e crescimento nos Estados Unidos. No American Dream, ele mostra o caminho que viveu — do sonho à conquista.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Garanta sua vaga agora
            </h2>
            
            {/* Description */}
            <p className="text-xl sm:text-2xl text-white">
              As vagas do grupo são limitadas para manter a qualidade do suporte e do evento ao vivo.
            </p>

            {/* Badges Container */}
            <div className="flex items-center justify-center space-x-4 sm:space-x-8 bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 my-8 mx-auto">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">100%</div>
                <div className="text-xs sm:text-sm text-gray-300">Gratuito</div>
              </div>
              <div className="w-px h-8 sm:h-12 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">+7K</div>
                <div className="text-xs sm:text-sm text-gray-300">Aprovados</div>
              </div>
              <div className="w-px h-8 sm:h-12 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">Live</div>
                <div className="text-xs sm:text-sm text-gray-300">Ao Vivo</div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4 flex justify-center">
              <button
                onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                className="inline-flex items-center px-4 sm:px-8 md:px-12 py-4 sm:py-6 bg-green-500 text-white font-bold text-base sm:text-lg md:text-xl rounded-xl hover:bg-green-600 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl max-w-full"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  fill="white" 
                  className="mr-2 sm:mr-4 flex-shrink-0"
                  viewBox="0 0 16 16"
                >
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                </svg>
                <span className="hidden md:inline">Entrar no Grupo do WhatsApp e</span>
                <span className="md:ml-1">Garantir Minha Vaga</span>
              </button>
            </div>

            {/* Last Spots Message */}
            <p className="text-white text-sm mt-4">
              Últimas vagas disponíveis!
            </p>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-8">
              {[
                {
                  icon: Shield,
                  title: "Dados Seguros",
                  description: "Suas informações estão protegidas",
                },
                {
                  icon: Clock,
                  title: "Acesso Imediato",
                  description: "Entre no grupo em segundos",
                },
                {
                  icon: Headphones,
                  title: "Suporte Especializado",
                  description: "Tire suas dúvidas com experts",
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-300/30 flex items-center justify-center mb-3">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      {item.title}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>© 2025 American Dream. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
