import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, Shield, Target, Users, Award, BookOpen, Video, FileText, MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import heroImage from "@/assets/hero-american-dream.jpg";
import consultant1 from "@/assets/consultant-1.jpg";
import consultant2 from "@/assets/consultant-2.jpg";
import processVisual from "@/assets/process-visual.jpg";
import successStudents from "@/assets/success-students.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
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
            <div className="inline-block mb-6 px-4 py-2 border border-primary/30 rounded-full text-sm">
              ✓ Consultoria Especializada em Vistos Americanos
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              Realize seu sonho de{" "}
              <span className="text-primary">estudar e trabalhar</span>{" "}
              nos Estados Unidos
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Consultoria completa para obtenção de vistos B1/B2, F1 e Change of Status. 
              Metodologia comprovada com centenas de aprovações.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90">
                Quero Meu Visto
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/20 hover:bg-white/10">
                Saiba Mais
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "500+", label: "Vistos Aprovados" },
              { number: "98%", label: "Taxa de Sucesso" },
              { number: "15+", label: "Anos de Experiência" },
              { number: "24/7", label: "Suporte Dedicado" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O que é a Consultoria */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              O que é a Consultoria American Dream?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Suporte completo e especializado para realizar seu sonho americano
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Análise Personalizada",
                description: "Avaliação detalhada do seu perfil para definir a melhor estratégia de visto"
              },
              {
                icon: FileText,
                title: "Documentação Completa",
                description: "Preparação e revisão de todos os documentos necessários para sua aplicação"
              },
              {
                icon: Users,
                title: "Preparação para Entrevista",
                description: "Treino intensivo com simulações reais de entrevista consular"
              }
            ].map((item, index) => (
              <Card key={index} className="p-8 bg-card border-border hover:border-primary/50 transition-all">
                <item.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Processos de Visto */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Processos de Visto
            </h2>
            <p className="text-xl text-muted-foreground">
              Especialistas em três modalidades de visto
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 bg-card border-border">
              <h3 className="text-2xl font-bold mb-4">Visto B1/B2</h3>
              <p className="text-muted-foreground mb-6">
                Visto de turismo e negócios. Ideal para viagens de até 6 meses.
              </p>
              <ul className="space-y-3">
                {["Análise de perfil", "Preparação de documentos", "Treino de entrevista"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-8 bg-primary/10 border-primary">
              <div className="inline-block px-3 py-1 bg-primary text-white text-sm rounded-full mb-4">
                MAIS PROCURADO
              </div>
              <h3 className="text-2xl font-bold mb-4">Visto F1</h3>
              <p className="text-muted-foreground mb-6">
                Visto de estudante. Estude e trabalhe legalmente nos EUA.
              </p>
              <ul className="space-y-3">
                {["Escolha da escola ideal", "Processo completo de aplicação", "Suporte pós-chegada"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-8 bg-card border-border">
              <h3 className="text-2xl font-bold mb-4">Change of Status</h3>
              <p className="text-muted-foreground mb-6">
                Mudança de status de turista para estudante dentro dos EUA.
              </p>
              <ul className="space-y-3">
                {["Análise de elegibilidade", "Processo legal completo", "Acompanhamento USCIS"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Processo Visual */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Como Funciona o Processo
              </h2>
              <div className="space-y-6">
                {[
                  { number: "01", title: "Consulta Inicial", desc: "Análise do seu perfil e definição de estratégia" },
                  { number: "02", title: "Preparação", desc: "Reunião de documentos e preenchimento de formulários" },
                  { number: "03", title: "Treino", desc: "Simulação e preparação para entrevista consular" },
                  { number: "04", title: "Aprovação", desc: "Acompanhamento até a obtenção do visto" }
                ].map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="text-3xl font-bold text-primary">{step.number}</div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{step.title}</h3>
                      <p className="text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img 
                src={processVisual} 
                alt="Processo" 
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bônus */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Bônus Exclusivos
            </h2>
            <p className="text-xl text-muted-foreground">
              Conteúdo adicional para garantir seu sucesso
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, title: "Guia Completo do Visto", value: "R$ 497" },
              { icon: Video, title: "Aulas Gravadas", value: "R$ 997" },
              { icon: MessageCircle, title: "Grupo VIP", value: "R$ 297" },
              { icon: FileText, title: "Templates Prontos", value: "R$ 397" }
            ].map((bonus, index) => (
              <Card key={index} className="p-6 bg-card border-border text-center">
                <bonus.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">{bonus.title}</h3>
                <div className="text-primary font-bold">{bonus.value}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Especialistas */}
      <section className="py-24">
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
            <Card className="overflow-hidden bg-card border-border">
              <img src={consultant1} alt="Ceme Suaiden" className="w-full h-80 object-cover" />
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">Ceme Suaiden</h3>
                <p className="text-primary mb-4">Especialista em Vistos F1</p>
                <p className="text-muted-foreground">
                  Mais de 10 anos de experiência ajudando estudantes a realizarem 
                  o sonho de estudar nos Estados Unidos.
                </p>
              </div>
            </Card>

            <Card className="overflow-hidden bg-card border-border">
              <img src={consultant2} alt="Matheus Brant" className="w-full h-80 object-cover" />
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
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Histórias de Sucesso
            </h2>
            <p className="text-xl text-muted-foreground">
              Veja o que nossos clientes dizem
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Maria Silva",
                visto: "F1 Aprovado",
                text: "Consegui meu visto de estudante na primeira tentativa! O suporte foi essencial para minha aprovação."
              },
              {
                name: "João Santos",
                visto: "B1/B2 Aprovado",
                text: "Processo tranquilo e bem orientado. A preparação para entrevista fez toda a diferença."
              },
              {
                name: "Ana Costa",
                visto: "COS Aprovado",
                text: "Mudei meu status de turista para estudante com toda segurança e suporte da equipe."
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-8 bg-card border-border">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-primary">★</span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">"{testimonial.text}"</p>
                <div>
                  <div className="font-bold">{testimonial.name}</div>
                  <div className="text-sm text-primary">{testimonial.visto}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Investimento */}
      <section className="py-24">
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
            <Card className="p-12 bg-card border-primary mb-8">
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-bold mb-6">
                  OFERTA LIMITADA
                </div>
                
                <div className="mb-6">
                  <div className="text-muted-foreground line-through text-2xl mb-2">
                    De R$ 14.970,00
                  </div>
                  <div className="text-6xl font-bold text-primary mb-2">
                    R$ 9.970
                  </div>
                  <div className="text-xl text-muted-foreground">
                    ou 12x de R$ 997 sem juros
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
                      "Todos os bônus (valor R$ 2.188)",
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
                      <span>Cartão de crédito em até 12x</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                      <span>Pix com 5% de desconto</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                      <span>Boleto bancário</span>
                    </li>
                  </ul>

                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <div className="font-bold mb-2">Cronograma:</div>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Início imediato após confirmação</li>
                      <li>• Processo: 30-90 dias em média</li>
                      <li>• Suporte até aprovação do visto</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button size="lg" className="w-full text-xl py-8 bg-primary hover:bg-primary/90">
                Quero Garantir Minha Vaga Agora
              </Button>
            </Card>

            <Card className="p-8 bg-secondary border-primary/30">
              <div className="flex items-start gap-4">
                <Shield className="w-12 h-12 text-primary flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold mb-3">Garantia American Dream</h3>
                  <p className="text-muted-foreground mb-4">
                    Caso seu visto seja negado por falha nossa na preparação, você recebe 
                    uma nova consultoria completa sem custo adicional. Sua tranquilidade é 
                    nossa prioridade.
                  </p>
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Award className="w-5 h-5" />
                    <span>100% de Confiança</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {[
                {
                  q: "Qual a taxa de aprovação de vistos?",
                  a: "Nossa taxa de aprovação é de 98% nos últimos 3 anos. Trabalhamos com uma metodologia comprovada e acompanhamento personalizado de cada caso."
                },
                {
                  q: "Quanto tempo demora o processo?",
                  a: "O processo completo leva em média de 30 a 90 dias, dependendo do tipo de visto e da disponibilidade de agendamento no consulado."
                },
                {
                  q: "Quais documentos preciso ter?",
                  a: "Os documentos variam conforme o tipo de visto. Na consulta inicial, faremos uma análise completa e listaremos todos os documentos necessários para seu caso específico."
                },
                {
                  q: "O que acontece se meu visto for negado?",
                  a: "Temos a Garantia American Dream: se houver negação por falha nossa na preparação, você recebe uma nova consultoria completa sem custo adicional."
                },
                {
                  q: "Posso parcelar o investimento?",
                  a: "Sim! Oferecemos parcelamento em até 12x sem juros no cartão de crédito, além de desconto de 5% para pagamento via Pix."
                }
              ].map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-card border-border px-6">
                  <AccordionTrigger className="text-left font-bold">
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

      {/* CTA Final */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Pronto para realizar seu{" "}
              <span className="text-primary">American Dream?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Não deixe seu sonho para depois. Comece agora sua jornada rumo aos Estados Unidos.
            </p>
            <Button size="lg" className="text-xl px-12 py-8 bg-primary hover:bg-primary/90">
              Começar Minha Jornada Agora
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6 text-center">
          <div className="text-2xl font-bold mb-4">American Dream Visa</div>
          <p className="text-muted-foreground">
            © 2024 American Dream Visa. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
