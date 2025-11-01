import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, Shield } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { Gallery4 } from "@/components/ui/gallery4";
import { FeatureCard } from "@/components/ui/feature-card";
import { Header } from "@/components/Header";
import heroImage from "@/assets/hero-american-dream.webp";
import consultant2 from "@/assets/consultant-2.webp";
// Imagem do processo removida - usando URL externa
import successStudents from "@/assets/success-students.webp";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white relative">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center z-10 pt-20">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={heroImage} 
            alt="American Dream" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-block mb-6 px-4 py-2 glass border border-primary/30 rounded-full text-sm opacity-0 animate-fade-in-up hover-scale">
              Consultoria American Dream
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight opacity-0 animate-fade-in-up delay-100">
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
              Mais de 1.500 brasileiros já orientados com sucesso.
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
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
      <section className="py-24 glass relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              O que está incluso no seu plano American Dream
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Cada consultoria é 100% personalizada e executada por especialistas em planejamento migratório.
            </p>
            <p className="text-lg text-primary mt-4 font-semibold">
              Você terá acesso a:
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
              {
                title: "2 sessões estratégicas personalizadas",
                description: "Conduzidas por consultores americanos"
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
                title: "Definição do visto ideal",
                description: "Turista (B1/B2), Estudante (F1) ou Troca de Status (COS)"
              },
              {
                title: "Atendimento remoto, seguro e confidencial",
                description: "Via videoconferência"
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
            <p className="text-xl text-muted-foreground">
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
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Nossos Especialistas
            </h2>
            <p className="text-xl text-muted-foreground">
              Experiência comprovada em processos de visto
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <Card className="overflow-hidden glass glass-hover flex flex-col">
              <div className="w-full h-96 relative overflow-hidden bg-gradient-to-b from-primary/10 to-black/20">
                <img 
                  src="/cemesuaiden.webp" 
                  alt="Ceme Suaiden" 
                  className="w-full h-full object-cover object-top scale-100 hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">Ceme Suaiden</h3>
                <p className="text-primary mb-4">Especialista em Vistos F1</p>
                <p className="text-muted-foreground">
                  Mais de 10 anos de experiência ajudando estudantes a realizarem 
                  o sonho de estudar nos Estados Unidos.
                </p>
              </div>
            </Card>

            <Card className="overflow-hidden glass glass-hover flex flex-col">
              <div className="w-full h-96 relative overflow-hidden bg-gradient-to-b from-primary/10 to-black/20">
                <img 
                  src={consultant2} 
                  alt="Matheus Brant" 
                  className="w-full h-full object-cover object-center scale-100 hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">Matheus Brant</h3>
                <p className="text-primary mb-4">Especialista em B1/B2 e COS</p>
                <p className="text-muted-foreground">
                  Expertise em processos consulares e mudanças de status, 
                  com centenas de casos aprovados.
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Histórias de Sucesso
            </h2>
            <p className="text-xl text-muted-foreground">
              Veja o que nossos clientes dizem
            </p>
          </div>

          <AnimatedTestimonials
            testimonials={[
              {
                quote:
                  "Consegui meu visto de estudante na primeira tentativa! O suporte foi essencial para minha aprovação.",
                name: "Maria Silva",
                designation: "F1 Aprovado",
                src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              },
              {
                quote:
                  "Processo tranquilo e bem orientado. A preparação para entrevista fez toda a diferença.",
                name: "João Santos",
                designation: "B1/B2 Aprovado",
                src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=3560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              },
              {
                quote:
                  "Mudei meu status de turista para estudante com toda segurança e suporte da equipe.",
                name: "Ana Costa",
                designation: "COS Aprovado",
                src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              },
              {
                quote:
                  "A consultoria superou minhas expectativas. Consegui meu visto B1/B2 em tempo recorde e com total segurança.",
                name: "Carlos Oliveira",
                designation: "B1/B2 Aprovado",
                src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              },
            ]}
            autoplay={true}
          />
        </div>
      </section>

      {/* Investimento */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Investimento
            </h2>
            <p className="text-xl text-muted-foreground">
              Plano completo para realizar seu sonho americano
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <Card className="p-12 glass ring-2 ring-primary mb-8 hover-lift">
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-bold mb-6">
                  OFERTA LIMITADA
                </div>
                
                <div className="mb-6">
                  <div className="text-muted-foreground line-through text-2xl mb-2">
                    De US$ 2.997,00
                  </div>
                  <div className="text-6xl font-bold text-primary mb-2">
                    US$ 1.998
                  </div>
                  <div className="text-xl text-muted-foreground">
                    Economize US$ 999 na sua consultoria completa
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <CheckCircle2 className="text-primary" />
                    O que está incluso:
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Consultoria completa B1/B2, F1 ou COS",
                      "Análise e preparação de documentos",
                      "Treino para entrevista consular",
                      "Todos os bônus exclusivos incluídos",
                      "Suporte durante todo o processo",
                      "Acesso ao grupo VIP vitalício"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <Clock className="text-primary" />
                    Formas de pagamento:
                  </h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                      <span>Pagamento único seguro via Stripe</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                      <span>Processamento instantâneo</span>
                    </li>
                  </ul>

                  <div className="glass p-4 rounded-lg">
                    <div className="font-bold mb-2">Cronograma:</div>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Início imediato após confirmação</li>
                      <li>• Processo: 30-90 dias em média</li>
                      <li>• Suporte contínuo até aprovação</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full bg-primary hover:bg-primary/90 text-lg py-6 hover-lift"
                onClick={() => navigate("/lead-form")}
              >
                Garantir Minha Vaga Agora
              </Button>
            </Card>

            <Card className="glass ring-2 ring-primary/50 hover-lift">
              <div className="p-8 text-center space-y-4">
                <Shield className="w-16 h-16 text-primary mx-auto" />
                <h3 className="text-2xl font-bold">Garantia American Dream — Risco Zero</h3>
                <p className="text-lg text-white font-semibold mb-4">
                  A sua tranquilidade é prioridade.
                </p>
                <p className="text-muted-foreground">
                  Se, após a análise do seu perfil e documentação, não for identificada nenhuma possibilidade real de visto ou estratégia legal, você receberá 100% do seu dinheiro de volta, sem burocracia.
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-white font-semibold">Sem letras miúdas. Sem enrolação.</p>
                  <p className="text-primary">
                    Apenas transparência e compromisso real com o seu resultado.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-4 italic">
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
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
                  a: "Duas sessões estratégicas personalizadas, análise de perfil e documentos, plano de ação e orientação sobre o visto ideal para você (B1/B2, F1 ou COS)."
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
      <section className="py-24 glass border-y border-primary/20 relative z-10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold">
              Pronto para realizar o <span className="text-primary">American Dream?</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Comece sua jornada hoje e tenha o suporte completo de especialistas em vistos americanos.
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-lg px-12 py-6 hover-lift"
              onClick={() => navigate("/lead-form")}
            >
              Garantir Minha Vaga
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center text-muted-foreground">
            <p className="mb-4 text-2xl font-bold text-white">American Dream Consultoria</p>
            <p>© 2025 American Dream. Todos os direitos reservados.</p>
            <p className="mt-2 text-sm">Especialistas em vistos americanos B1/B2, F1 e Change of Status</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
