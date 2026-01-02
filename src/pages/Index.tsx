import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, Shield } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Gallery4 } from "@/components/ui/gallery4";
import { FeatureCard } from "@/components/ui/feature-card";
import { SpecialistCarousel } from "@/components/ui/specialist-carousel";
import { Header } from "@/components/Header";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import heroImage from "@/assets/hero-american-dream.webp";
import consultant2 from "@/assets/consultant-2.webp";
// Imagem do processo removida - usando URL externa
import successStudents from "@/assets/success-students.webp";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white relative">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center z-10 pt-20">
        <div className="absolute inset-0 overflow-hidden">
          {/* Placeholder para imagem do boné American Dream - será substituído quando a imagem estiver disponível */}
          <img 
            src={heroImage} 
            alt="American Dream" 
            className="w-full h-full object-cover opacity-30"
            id="hero-background-hat"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
          />
          {/* Gradiente patriótico azul/branco/vermelho como overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-block mb-6 px-4 py-2 glass border border-primary/30 rounded-full text-sm opacity-0 animate-fade-in-up hover-scale">
              Consultoria American Dream
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight opacity-0 animate-fade-in-up delay-100 text-white">
              O Caminho Seguro e Estratégico para{" "}
              <span className="text-primary">Viver Legalmente</span>{" "}
              nos Estados Unidos
            </h1>
            
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl opacity-0 animate-fade-in-up delay-200">
              Descubra o plano personalizado que vai transformar o seu sonho americano em um projeto real.
            </p>
            
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl opacity-0 animate-fade-in-up delay-250">
              Conquiste seu visto, estude, invista ou viva nos EUA com orientação direta de especialistas americanos, baseados na Califórnia e no Arizona.
            </p>
            
            <p className="text-md text-primary mb-8 max-w-2xl opacity-0 animate-fade-in-up delay-275 font-semibold">
              Mais de 15.000 brasileiros já orientados com sucesso.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in-up delay-300">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 hover-lift"
                onClick={() => navigate("/lead-form")}
              >
                Quero descobrir meu caminho agora
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 border-white/20 hover:bg-white/10 hover-lift"
                onClick={() => {
                  const section = document.getElementById('sobre-consultoria');
                  if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                Saiba Mais
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* O que é a Consultoria */}
      <section id="sobre-consultoria" className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              O que é a Consultoria American Dream
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <p className="text-xl text-muted-foreground leading-relaxed">
              A Consultoria American Dream nasceu nos Estados Unidos com um propósito claro: ajudar brasileiros a viver o sonho americano com inteligência, planejamento e segurança jurídica.
            </p>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Mais do que um atendimento, você recebe um plano estratégico completo — desde a análise de perfil e elegibilidade, até a definição do visto ideal para o seu objetivo de vida: estudar, trabalhar, investir ou simplesmente começar uma nova fase.
            </p>
          </div>
        </div>
      </section>

      {/* O que está incluso */}
      <section className="py-24 relative z-10 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              O que está incluso no seu plano American Dream
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Cada consultoria é 100% personalizada e executada por especialistas em planejamento migratório.
            </p>
            <p className="text-lg text-[#0575E6] mt-4 font-semibold">
              Você terá acesso a:
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
              {
                title: "Até 2 seções estratégicas personalizadas",
                description: "Conduzidas por especialistas"
              },
              {
                title: "Análise completa do seu perfil",
                description: "Objetivos pessoais e profissionais"
              },
              {
                title: "Preparação e revisão detalhada",
                description: "Dos seus documentos"
              },
              {
                title: "Definição do Visto Ideal",
                description: "Analisamos todas as opções de visto disponíveis para encontrar o caminho ideal para você"
              },
              {
                title: "Qual o visto já está incluso",
                description: "Turista (B1/B2), Estudante (F1) ou Troca de Status (COS). Também incluímos consultoria para trabalhar no Canadá"
              },
              {
                title: "Acompanhamento direto",
                description: "Por Matheus Brant e Ceme Suaiden, especialistas sediados nos EUA"
              }
            ].map((item, index) => (
              <FeatureCard
                key={index}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
          
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl text-gray-700">
              Tudo que você precisa para construir o seu plano com segurança, sem riscos e com base em dados reais.
            </p>
          </div>
        </div>
      </section>

      {/* Bônus */}
      <Gallery4
        title="Bônus Exclusivos American Dream"
        description="Ao garantir sua vaga, você desbloqueia benefícios que ampliam sua rede e suas oportunidades nos EUA:"
        items={[
          {
            id: "mastermind",
            title: "Mastermind Presencial",
            description: "3 dias nos Estados Unidos com encontro exclusivo de networking internacional com empresários e investidores.",
            image: "/mastermind.webp"
          },
          {
            id: "bolsas",
            title: "Bolsas de até 100%",
            description: "Condições especiais em escolas e universidades americanas parceiras, reservadas exclusivamente para nossos clientes.",
            image: "/bolsa100.webp"
          },
          {
            id: "desconto",
            title: "50% de desconto",
            description: "Tarifas exclusivas para novos processos de visto. Expanda suas possibilidades com condições especiais.",
            image: "/50desconto 2.webp"
          },
          {
            id: "networking",
            title: "Networking",
            description: "Conexões diretas com empresários e investidores americanos para quem deseja empreender, estudar ou investir.",
            image: "/networking.webp"
          },
          {
            id: "participacao",
            title: "Participação Societária",
            description: "Clientes aprovados podem ser convidados a participar de empresas nos Estados Unidos.",
            image: "/participacao.webp"
          }
        ]}
      />

      {/* Especialistas */}
      <section className="py-24 relative z-10 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Nossos Especialistas
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
                <p className="text-primary mb-4">The Future Immigration Inc.</p>
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
                <p className="text-primary mb-4">Brant Immigration Inc.</p>
                <p className="text-gray-700">
                  Matheus Brant é a prova viva de que o sonho americano é possível. Depois de ter seu visto negado em 2016, ele voltou aprovado, estudou Business nos EUA e começou do zero — até fundar a Brant Immigration, hoje referência no mercado com mais de 7.000 vidas dolarizadas. Empresário, mentor e sócio da 323 Network em Hollywood, Matheus transforma histórias de brasileiros em estratégias reais de entrada, permanência e crescimento nos Estados Unidos. No American Dream, ele mostra o caminho que viveu — do sonho à conquista.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-24 glass relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Histórias de Sucesso
            </h2>
            <p className="text-xl text-muted-foreground">
              Veja o que nossos clientes dizem
            </p>
          </div>

          <div className="relative max-w-7xl mx-auto">
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {[
                  "2bn2Ml1K97Y",
                  "HKtz1jHbftA",
                  "drzJSRi70nI",
                  // Adicione mais IDs de vídeos aqui quando tiver
                  // "videoId4", "videoId5", etc.
                ].map((videoId, index) => (
                  <CarouselItem key={videoId} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <div className="aspect-[9/16] rounded-xl overflow-hidden shadow-2xl bg-black/20 relative">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&controls=1&playsinline=1`}
                        title={`Depoimento ${index + 1}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                      ></iframe>
                      {/* Overlay para ocultar título e nome do canal */}
                      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/90 to-transparent pointer-events-none z-10"></div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 md:-left-12 bg-white/10 hover:bg-white/20 border-white/20 text-white" />
              <CarouselNext className="right-0 md:-right-12 bg-white/10 hover:bg-white/20 border-white/20 text-white" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* Investimento */}
      <section className="py-24 relative z-10 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Investimento
            </h2>
            <p className="text-xl text-gray-700">
              Plano completo para realizar seu sonho americano
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <Card className="p-12 bg-white border-2 border-[#0575E6]/30 shadow-2xl mb-8 hover:shadow-3xl transition-shadow">
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-[#0575E6] to-[#021B79] text-white rounded-full text-sm font-bold mb-6 shadow-lg">
                  OFERTA LIMITADA
                </div>
                
                <div className="mb-6">
                  <div className="text-gray-400 line-through text-2xl mb-2">
                    De US$ 19.997,00
                  </div>
                  <div className="text-6xl font-bold bg-gradient-to-r from-[#0575E6] to-[#021B79] bg-clip-text text-transparent mb-2">
                    US$ 1.998
                  </div>
                  <div className="text-xl text-gray-700 font-medium">
                    Economize US$ 18.000 na sua consultoria completa
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-900">
                    <CheckCircle2 className="text-[#0575E6]" />
                    O que está incluso:
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Até 2 seções estratégicas personalizadas conduzidas por especialistas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Análise completa do seu perfil (objetivos pessoais e profissionais)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Preparação e revisão detalhada dos seus documentos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Definição do visto ideal: Análise completa de todos os tipos de visto disponíveis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Qual o visto já está incluso: Turista (B1/B2), Estudante (F1) ou Troca de Status (COS). Também incluímos consultoria para trabalhar no Canadá</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Atendimento remoto, seguro e confidencial via videoconferência</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Acompanhamento direto por Matheus Brant e Ceme Suaiden, especialistas sediados nos EUA</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Mastermind Presencial - 3 dias nos Estados Unidos com encontro exclusivo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Bolsas de até 100% em escolas e universidades americanas parceiras</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">50% de desconto em tarifas exclusivas para novos processos de visto</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Networking com empresários e investidores americanos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Participação Societária - clientes aprovados podem ser convidados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Treino para entrevista consular</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Suporte durante todo o processo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Acesso ao grupo VIP vitalício</span>
                      </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-900">
                    <Clock className="text-[#0575E6]" />
                    Formas de pagamento:
                  </h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5" />
                      <span className="text-gray-700">Pagamento único seguro via Stripe</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#0575E6] mt-0.5" />
                      <span className="text-gray-700">Processamento instantâneo</span>
                    </li>
                  </ul>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="font-bold mb-2 text-gray-900">Cronograma:</div>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>1. Início imediato, após confirmação.</li>
                      <li>2. Preenchimento do formulário.</li>
                      <li>3. Agendamento da primeira reunião.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-100 w-full max-w-xl mx-auto mb-8 hover:border-[#0575E6]/30 transition-all duration-300 group">
                    <span className="inline-block py-2 px-5 rounded-full bg-white border border-slate-200 text-[#0575E6] text-xs font-extrabold uppercase tracking-[0.2em] mb-6 shadow-sm group-hover:scale-105 transition-transform duration-300">
                      Entrada Facilitada
                    </span>
                    
                    <div className="flex items-start justify-center gap-1 mb-6">
                      <span className="text-3xl text-gray-400 font-bold mt-2 select-none">US$</span>
                      <span className="text-7xl md:text-8xl font-black text-gray-900 tracking-tighter leading-none">999</span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-lg md:text-xl text-gray-900 font-bold">
                        Entrada de 50% para iniciar a mentoria
                      </p>
                      <div className="w-12 h-1 bg-gray-200 mx-auto rounded-full"></div>
                      <p className="text-gray-500 font-medium">
                        Segunda Parcela paga após a primeira sessão estratégica
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="w-full bg-[#0575E6] hover:bg-[#035bb3] text-white text-xl md:text-2xl py-8 font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 rounded-xl border-b-4 border-[#03449e]"
                  onClick={() => navigate("/lead-form")}
                >
                  Garantir minha vaga agora
                </Button>
              </div>
            </Card>

            <Card className="bg-white border-2 border-[#0575E6]/30 shadow-2xl hover:shadow-3xl transition-shadow">
              <div className="p-8 text-center space-y-4">
                <Shield className="w-16 h-16 text-[#0575E6] mx-auto" />
                <h3 className="text-2xl font-bold text-gray-900">Garantia American Dream — Risco Zero</h3>
                <p className="text-lg text-gray-900 font-semibold mb-4">
                  A sua tranquilidade é prioridade.
                </p>
                <p className="text-gray-700">
                  Se, após a análise do seu perfil e documentação, não for identificada nenhuma possibilidade real de visto ou estratégia legal, você receberá 100% do seu dinheiro de volta, sem burocracia.
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-gray-900 font-semibold">Sem letras miúdas. Sem enrolação.</p>
                  <p className="text-[#0575E6] font-medium">
                    Apenas transparência e compromisso real com o seu resultado.
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-4 italic">
                  Essa é a Garantia American Dream — porque o seu futuro merece respeito.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Perguntas Frequentes */}
      <section className="py-24 glass relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-muted-foreground">
              Tire suas dúvidas sobre o processo
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {[
                {
                  q: "O que está incluso na consultoria?",
                  a: "Até 2 seções estratégicas personalizadas conduzidas por especialistas, análise completa do seu perfil (objetivos pessoais e profissionais), preparação e revisão detalhada dos seus documentos, definição do visto já incluso (Turista B1/B2, Estudante F1 ou Troca de Status COS), definição do visto ideal com análise completa de todos os tipos de visto disponíveis (Investidor, Trabalho, Talentos, Transferência Corporativa, Artistas/Atletas, Religioso, Intercâmbio, Estudante Avançado, Cônjuge/Família, NAFTA e Green Card). Também inclui atendimento remoto seguro e confidencial via videoconferência, acompanhamento direto por Matheus Brant e Ceme Suaiden, treino para entrevista consular, suporte durante todo o processo, acesso ao grupo VIP vitalício. Além disso, inclui todos os bônus exclusivos: Mastermind Presencial (3 dias nos EUA), Bolsas de até 100%, 50% de desconto em processos de visto, Networking com empresários e investidores, e Participação Societária."
                },
                {
                  q: "Posso fazer tudo online?",
                  a: "Sim! Todo o atendimento é 100% remoto e seguro — você pode participar de qualquer lugar do mundo."
                },
                {
                  q: "Vocês fazem o processo jurídico do visto?",
                  a: "Não. A consultoria é estratégica e analítica. Caso precise de advogado, indicamos parceiros de confiança nos EUA."
                },
                {
                  q: "E se eu não for elegível a nenhum tipo de visto?",
                  a: "Você recebe 100% do seu dinheiro de volta — é nossa Garantia American Dream."
                },
                {
                  q: "O que é o Mastermind Presencial?",
                  a: "Um evento exclusivo de 3 dias nos EUA com empresários, mentores e investidores. Uma experiência única de conexão e crescimento."
                }
              ].map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="glass border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Chamada Final */}
      <section className="py-24 bg-white relative z-10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <img 
              src="/foto bone american dream.webp"
              loading="lazy"
              fetchPriority="low"
              decoding="async" 
              alt="American Dream - Boné" 
              className="w-full max-w-md mx-auto mb-8"
            />
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900">
              Pronto para realizar o <span className="bg-gradient-to-r from-[#0575E6] to-[#021B79] bg-clip-text text-transparent">American Dream?</span>
            </h2>
            <p className="text-xl text-gray-700">
              Comece sua jornada hoje e tenha o suporte completo de especialistas em vistos americanos.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-[#0575E6] to-[#021B79] hover:from-[#0685F6] hover:to-[#032B89] text-white text-lg px-12 py-6 font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate("/lead-form")}
            >
              Garantir Minha Vaga
            </Button>
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
          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/terms")}
              className="text-[#0575E6] hover:text-[#0685F6] underline text-sm transition-colors"
            >
              Termos e Condições
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
