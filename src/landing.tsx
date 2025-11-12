import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import consultant1 from "@/assets/consultant-1.webp";
import consultant2 from "@/assets/consultant-2.webp";
import HeroSection from "@/components/HeroSection";

const WHATSAPP_LINK = "https://chat.whatsapp.com/C5k7GQN1N5L0qmkDZgUlMn";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection whatsappLink={WHATSAPP_LINK} />

      {/* What You'll Learn Section */}
      <section id="benefits" className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-12 text-foreground">
              O que você vai aprender na Live Gratuita
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                "Os 3 pilares para conquistar o sonho americano sem cair nas armadilhas que travam a maioria.",
                "O passo a passo real para organizar sua jornada — do planejamento ao primeiro visto.",
                "Como se preparar emocional e financeiramente para mudar de país com segurança.",
                "Os erros mais comuns que fazem muita gente desistir (e como evitá-los).",
              ].map((item, index) => (
                <Card
                  key={index}
                  className="border-none shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up bg-card"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6 flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                    <p className="text-card-foreground">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-12 text-foreground">
              Para quem é
            </h2>
            <div className="space-y-4 mb-12">
              {[
                "Sempre sonhou em morar nos Estados Unidos, mas não sabe por onde começar.",
                "Quer um plano estruturado, acessível e realista.",
                "Está cansado de informações confusas ou promessas milagrosas.",
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 bg-background p-6 rounded-lg hover:shadow-md transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                  <p className="text-foreground text-lg">{item}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-xl font-semibold mb-8 text-foreground">
              Então essa live é para você.
            </p>
            <div className="text-center">
              <Button
                variant="whatsapp"
                size="lg"
                className="text-lg px-8 py-6 h-auto"
                onClick={() => window.open(WHATSAPP_LINK, "_blank")}
              >
                Quero Participar pelo WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-12 text-foreground">
              Ao entrar no grupo oficial do WhatsApp, você garante
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                "Link da live gratuita em primeira mão.",
                "Materiais de apoio exclusivos (checklists, guias e cronograma).",
                "Avisos antecipados de conteúdos e oportunidades.",
                "Acesso à comunidade oficial para networking e dúvidas.",
              ].map((item, index) => (
                <Card
                  key={index}
                  className="border-none shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up bg-secondary/10"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6 flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                    <p className="text-foreground">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button
                variant="whatsapp"
                size="lg"
                className="text-lg px-8 py-6 h-auto"
                onClick={() => window.open(WHATSAPP_LINK, "_blank")}
              >
                Entrar no Grupo Agora
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Participate Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8">Por que participar</h2>
            <p className="text-xl sm:text-2xl leading-relaxed">
              Você sai com um{" "}
              <span className="font-bold">plano claro e acionável</span> para começar hoje — com suporte de quem
              entende o caminho até o sonho americano.
            </p>
          </div>
        </div>
      </section>

      {/* Instructors Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-16 text-foreground">
              Quem vai te guiar
            </h2>
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Instructor 1 */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up bg-card">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center mb-6">
                    <img
                      src={consultant1}
                      alt="Ceme Suaiden"
                      className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-secondary"
                    />
                    <h3 className="text-2xl font-bold text-card-foreground">Ceme Suaiden</h3>
                    <p className="text-secondary font-semibold">Especialista em Vistos F1</p>
                  </div>
                  <p className="text-card-foreground leading-relaxed">
                    Empresário cuja atuação se destaca por conectar o Brasil e os Estados Unidos. Fundou, em 2014, uma
                    consultoria criada para ser uma ponte robusta entre os dois países, auxiliando brasileiros
                    interessados em internacionalizar negócios, investir ou imigrar para os EUA. Proprietário da holding
                    Suaiden Inc. e dos grupos The Future of English e The Future Immigration Inc., atua com foco em
                    internacionalização e desenvolvimento de oportunidades bilaterais.
                  </p>
                </CardContent>
              </Card>

              {/* Instructor 2 */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up animate-delay-100 bg-card">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center mb-6">
                    <img
                      src={consultant2}
                      alt="Matheus Brant"
                      className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-secondary"
                    />
                    <h3 className="text-2xl font-bold text-card-foreground">Matheus Brant</h3>
                    <p className="text-secondary font-semibold">Especialista em B1/B2 e COS</p>
                  </div>
                  <p className="text-card-foreground leading-relaxed">
                    A prova viva de que o sonho americano é possível. Depois de ter seu visto negado em 2016, voltou
                    aprovado, estudou Business nos EUA e começou do zero — até fundar a Brant Immigration, hoje
                    referência no mercado com mais de 7.000 vidas dolarizadas. Empresário, mentor e sócio da 323 Network
                    em Hollywood, transforma histórias de brasileiros em estratégias reais de entrada, permanência e
                    crescimento nos Estados Unidos.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Garanta sua vaga agora</h2>
            <p className="text-xl sm:text-2xl">
              As vagas do grupo são limitadas para manter a qualidade do suporte e do evento ao vivo.
            </p>
            <Button
              variant="whatsapp"
              size="lg"
              className="text-lg px-8 py-6 h-auto"
              onClick={() => window.open(WHATSAPP_LINK, "_blank")}
            >
              Entrar no Grupo do WhatsApp e Garantir Minha Vaga
            </Button>
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

export default Index;
