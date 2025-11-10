import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Users } from "lucide-react";
import { SpecialistCarousel } from "@/components/ui/specialist-carousel";
import { Header } from "@/components/Header";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    fill="currentColor" 
    className={className}
    viewBox="0 0 16 16"
  >
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
  </svg>
);

const Home = () => {
  const whatsappLink = "https://chat.whatsapp.com/C5k7GQN1N5L0qmkDZgUlMn";

  return (
    <div className="min-h-screen bg-black text-white relative">
      <Header />
      
      {/* Hero Section - Estilo do bridge-main */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(/hero-american-dream.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.4)",
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-background z-0" />

        <div className="container relative z-10 px-4 py-20 mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Construa seu caminho para o <br />
            <span className="text-shine">American</span>{" "}
            <span className="text-shine">Dream</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            com clareza, estratégia e suporte de quem já chegou lá
          </p>
          
          <p className="text-lg md:text-xl text-white/80 mb-12 max-w-4xl mx-auto">
            Descubra o método que transforma o sonho de viver legalmente nos EUA em um plano prático e real, sem atalhos e sem achismos.
          </p>

          <Button 
            size="xl"
            onClick={() => window.open(whatsappLink, '_blank')}
            className="bg-[#0575E6] text-white hover:bg-[#0685F6] shadow-lg hover:shadow-xl transform hover:scale-105 font-bold px-10 py-6 text-lg"
          >
            <WhatsAppIcon className="h-6 w-6 mr-2" />
            Participar da Live Gratuita
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>

      {/* O que você vai aprender */}
      <section id="o-que-vai-aprender" className="py-24 relative z-10 bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              O que você vai aprender na Live Gratuita
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Conteúdo prático e acionável para começar sua jornada hoje
            </p>
          </div>

          <div className="cards-container-new">
            {[
              {
                number: "01",
                title: "Os 3 pilares para conquistar o sonho americano",
                description: "Sem cair nas armadilhas que travam a maioria"
              },
              {
                number: "02",
                title: "O passo a passo real",
                description: "Para organizar sua jornada — do planejamento ao primeiro visto"
              },
              {
                number: "03",
                title: "Como se preparar emocional e financeiramente",
                description: "Para mudar de país com segurança"
              },
              {
                number: "04",
                title: "Os erros mais comuns",
                description: "Que fazem muita gente desistir (e como evitá-los)"
              }
            ].map((item, index) => (
              <div key={index} className="card-wrapper">
                <a className={`card-interactive card-${index + 1}`} href="#">
                  <p className="card-title">{item.title}</p>
                  <p className="card-description">{item.description}</p>
                  <div className="go-corner">
                    <div className="go-arrow">→</div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section className="py-24 relative z-10 bg-[#0a0e27] overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-4 text-white">
                Para quem é
              </h2>
              <p className="text-xl text-white/80 mb-12">Se você:</p>
            </div>
            
            <div className="for-whom-cards-wrapper">
              <div className="for-whom-cards">
                {[
                  "Sempre sonhou em morar nos Estados Unidos, mas não sabe por onde começar.",
                  "Quer um plano estruturado, acessível e realista.",
                  "Está cansado de informações confusas ou promessas milagrosas."
                ].map((item, index) => (
                  <div key={index} className={`for-whom-mini-card for-whom-card-${index + 1}`}>
                    <p className="for-whom-tip">{String(index + 1).padStart(2, '0')}</p>
                    <p className="for-whom-second-text">{item}</p>
                  </div>
                ))}
              </div>
              
              <div className="for-whom-big-card">
                <p className="for-whom-big-text">Então essa live é para você.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bônus do WhatsApp */}
      <section className="py-24 relative z-10 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-4 text-gray-900">
                Ao entrar no grupo oficial do WhatsApp, você garante
              </h2>
            </div>

            <div className="whatsapp-benefits-container">
              <div className="whatsapp-benefits-list">
                {[
                  {
                    title: "Link da live gratuita",
                    description: "Em primeira mão"
                  },
                  {
                    title: "Materiais de apoio exclusivos",
                    description: "Checklists, guias e cronograma"
                  },
                  {
                    title: "Avisos antecipados",
                    description: "De conteúdos e oportunidades"
                  },
                  {
                    title: "Acesso à comunidade oficial",
                    description: "Para networking e dúvidas"
                  }
                ].map((item, index) => (
                  <div key={index} className="whatsapp-benefit-item">
                    <div className="whatsapp-benefit-icon">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="whatsapp-benefit-content">
                      <h3 className="whatsapp-benefit-title">{item.title}</h3>
                      <p className="whatsapp-benefit-description">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="whatsapp-cta-button">
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-[#0575E6] to-[#021B79] hover:from-[#0685F6] hover:to-[#032B89] text-white text-xl md:text-2xl py-8 font-bold shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                  onClick={() => window.open(whatsappLink, '_blank')}
                >
                  <WhatsAppIcon className="h-6 w-6 mr-3" />
                  Quero participar pelo WhatsApp
                  <ArrowRight className="h-6 w-6 ml-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Por que participar */}
      <section className="py-24 relative z-10 glass">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Por que participar
            </h2>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              Você sai com um <span className="text-primary font-bold">plano claro e acionável</span> para começar hoje — com suporte de quem entende o caminho até o sonho americano.
            </p>
          </div>
        </div>
      </section>

      {/* Especialistas */}
      <section className="py-24 relative z-10 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Quem vai te guiar
            </h2>
            <p className="text-xl text-gray-600">
              Experiência comprovada em processos de visto
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
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

      {/* CTA Final */}
      <section className="py-24 relative z-10 glass">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                Garanta sua vaga agora
              </h2>
              <p className="text-xl text-white/90 mb-8">
                As vagas do grupo são limitadas para manter a qualidade do suporte e do evento ao vivo.
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-[#0575E6] to-[#021B79] hover:from-[#0685F6] hover:to-[#032B89] text-white text-xl md:text-2xl px-12 py-8 font-bold shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                onClick={() => window.open(whatsappLink, '_blank')}
              >
                <WhatsAppIcon className="h-6 w-6 mr-3" />
                Entrar no grupo do WhatsApp e garantir minha vaga
                <ArrowRight className="h-6 w-6 ml-3" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border relative z-10 bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center text-muted-foreground mb-4">
            <p className="mb-4 text-2xl font-bold text-white">American Dream Consultoria</p>
            <p>© 2025 American Dream. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

