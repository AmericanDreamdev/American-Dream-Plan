import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Shield, Zap, Target, Globe2, GraduationCap, Users } from "lucide-react";
import heroImage from "@/assets/hero-american-dream.jpg";
import consultant1 from "@/assets/consultant-1.jpg";
import consultant2 from "@/assets/consultant-2.jpg";
import processVisual from "@/assets/process-visual.jpg";
import successStudents from "@/assets/success-students.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        
        <div className="relative z-10 container mx-auto px-4 py-32 text-center">
          <Badge className="mb-8 bg-primary/20 border-primary/50 text-primary text-sm px-6 py-2 backdrop-blur-sm">
            Consultoria Estratégica
          </Badge>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 text-foreground leading-[1.1] tracking-tight">
            Seu sonho americano<br />
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              começa aqui
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-12 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Estratégia personalizada de visto e permanência legal com duas autoridades em imigração e educação nos EUA
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-2xl shadow-primary/20">
              Iniciar Consultoria
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-border hover:bg-card">
              Saber Mais
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>2 Sessões Estratégicas</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Garantia 100%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">1.500+</div>
              <p className="text-muted-foreground">Alunos Aprovados</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">100%</div>
              <p className="text-muted-foreground">Personalizado</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">3</div>
              <p className="text-muted-foreground">Tipos de Visto</p>
            </div>
          </div>
        </div>
      </section>

      {/* O que é a Consultoria */}
      <section className="py-32 bg-gradient-to-b from-background to-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Estratégia completa para seu visto
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Duas sessões personalizadas com análise profunda e plano de ação executável
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Target, title: "Análise Profunda", desc: "Perfil, documentos e objetivos" },
              { icon: Zap, title: "Estratégia Única", desc: "Plano desenvolvido para você" },
              { icon: Shield, title: "Segurança Total", desc: "Garantia de elegibilidade" },
            ].map((item, i) => (
              <Card key={i} className="bg-card border-border hover:border-primary/50 transition-all group">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-base">{item.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Processos de Visto */}
      <section className="py-32 relative">
        <div 
          className="absolute inset-0 opacity-5 bg-cover bg-center"
          style={{ backgroundImage: `url(${processVisual})` }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-center mb-20 text-foreground">
            Processos de Visto
          </h2>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-card border-border hover:border-primary/50 transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-primary/20 text-primary border-primary/50">B1/B2</Badge>
                  <Globe2 className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">Turista e Negócios</CardTitle>
                <CardDescription>Para visitas, reuniões e exploração de oportunidades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 border-t border-border">
                {[
                  "Estratégia de elegibilidade",
                  "Orientação DS-160 completa",
                  "Simulação de entrevista",
                  "Dicas de entrada segura"
                ].map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-primary shadow-2xl shadow-primary/20 transform lg:scale-105">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-primary text-primary-foreground">F1 - Popular</Badge>
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">Visto de Estudante</CardTitle>
                <CardDescription>Para estudar nos Estados Unidos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 border-t border-border">
                {[
                  "Escolha estratégica de escola",
                  "I-20 e SEVIS orientação",
                  "Checklist de matrícula",
                  "Work Permit e extensões"
                ].map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-secondary/50 text-foreground border-border">COS</Badge>
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">Change of Status</CardTitle>
                <CardDescription>Para mudar de status já estando nos EUA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 border-t border-border">
                {[
                  "Avaliação de elegibilidade",
                  "Transição sem sair dos EUA",
                  "Planejamento de prazos",
                  "Evitar perda de status"
                ].map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bônus */}
      <section className="py-32 bg-gradient-to-b from-card/50 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-accent/20 text-accent border-accent/50 text-base px-6 py-2">
              Benefícios Exclusivos
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Além da Consultoria
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Oportunidades reais nos Estados Unidos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { title: "Mastermind 3 Dias", desc: "Networking nos EUA" },
              { title: "Bolsas até 100%", desc: "Instituições parceiras" },
              { title: "50% Desconto", desc: "Outros vistos" },
              { title: "Networking Premium", desc: "Empresários e investidores" },
            ].map((bonus, i) => (
              <Card key={i} className="bg-card border-border hover:border-accent/50 transition-all text-center group">
                <CardHeader>
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Check className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle className="text-lg">{bonus.title}</CardTitle>
                  <CardDescription>{bonus.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Especialistas */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-center mb-20 text-foreground">
            Seus Especialistas
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <Card className="bg-card border-border overflow-hidden group hover:border-primary/50 transition-all">
              <div className="aspect-square overflow-hidden bg-muted">
                <img 
                  src={consultant1} 
                  alt="Ceme Suaiden" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl mb-2">Ceme Suaiden</CardTitle>
                <Badge className="w-fit mx-auto bg-primary/20 text-primary border-primary/50">The Future of English</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center leading-relaxed">
                  1.500+ alunos aprovados. Especialista em programas híbridos com Work Permit e bolsas de estudo.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border overflow-hidden group hover:border-primary/50 transition-all">
              <div className="aspect-square overflow-hidden bg-muted">
                <img 
                  src={consultant2} 
                  alt="Matheus Brant" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl mb-2">Matheus Brant</CardTitle>
                <Badge className="w-fit mx-auto bg-primary/20 text-primary border-primary/50">Brant Immigration</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Consultor migratório. Centenas de processos de Change of Status bem-sucedidos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-32 relative">
        <div 
          className="absolute inset-0 opacity-5 bg-cover bg-center"
          style={{ backgroundImage: `url(${successStudents})` }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-center mb-20 text-foreground">
            Histórias de Sucesso
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { name: "Rafael M.", location: "Orlando", text: "Entendi o caminho certo para meu visto F1 e já estou estudando nos EUA." },
              { name: "Larissa P.", location: "Boston", text: "Mostram o caminho exato com clareza e segurança. Vale cada centavo." },
              { name: "Lucas F.", location: "Austin", text: "Primeira vez que alguém analisou meu caso de forma personalizada." },
            ].map((testimonial, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="pt-8">
                  <p className="text-muted-foreground mb-8 leading-relaxed text-lg italic">"{testimonial.text}"</p>
                  <div className="border-t border-border pt-6">
                    <p className="font-semibold text-foreground text-lg">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Investimento */}
      <section className="py-32 bg-gradient-to-b from-background to-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
                Investimento
              </h2>
              <p className="text-xl text-muted-foreground">
                Plano completo com garantia total
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-2 border-primary/50 shadow-2xl shadow-primary/20 overflow-hidden">
                <div className="bg-gradient-to-br from-primary via-primary to-accent p-12 text-center text-white">
                  <p className="text-sm font-semibold mb-2 opacity-90 uppercase tracking-wider">Investimento Total</p>
                  <div className="text-6xl md:text-7xl font-bold mb-4">
                    US$ 1.998
                  </div>
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-8 py-3 rounded-full">
                    <p className="text-xl font-semibold">2x US$ 999</p>
                  </div>
                </div>
                
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-foreground mb-4">Formas de Pagamento</h3>
                    {[
                      "Cartão de crédito internacional",
                      "Transferência bancária",
                      "Pagamentos eletrônicos"
                    ].map((item, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <p className="text-foreground">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-6 space-y-4">
                    <h3 className="font-semibold text-lg text-foreground mb-4">Cronograma</h3>
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">1</div>
                      <div>
                        <p className="font-semibold text-foreground">Primeira parcela</p>
                        <p className="text-sm text-muted-foreground">No ato da contratação</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">2</div>
                      <div>
                        <p className="font-semibold text-foreground">Segunda parcela</p>
                        <p className="text-sm text-muted-foreground">1 dia antes da 1ª sessão</p>
                      </div>
                    </div>
                  </div>

                  <Button size="lg" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg font-semibold py-6 shadow-lg">
                    Garantir Vaga Agora
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-accent/50 bg-gradient-to-br from-accent/10 via-card to-card flex flex-col justify-center shadow-xl">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Shield className="w-10 h-10 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-foreground">Garantia 100%</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Devolução integral se você não for elegível para nenhum processo de visto
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <Badge className="bg-accent/20 text-accent border-accent/50 text-sm px-4 py-2">
                      Risco Zero
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-6xl font-bold text-center mb-20 text-foreground">
            Perguntas Frequentes
          </h2>
          
          <Accordion type="single" collapsible className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "A consultoria é 100% online?",
                a: "Sim. Todas as etapas são online com acompanhamento direto dos especialistas."
              },
              {
                q: "A consultoria garante aprovação do visto?",
                a: "Não garantimos aprovação, mas fornecemos análise estratégica completa para maximizar suas chances."
              },
              {
                q: "Posso contratar estando nos EUA?",
                a: "Sim. Atendemos clientes no Brasil e residentes temporários nos Estados Unidos."
              },
              {
                q: "Quanto tempo leva para receber o plano?",
                a: "Você recebe seu plano completo em até 5 dias úteis após a segunda sessão."
              }
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-border rounded-xl px-6 bg-card hover:border-primary/50 transition-colors">
                <AccordionTrigger className="text-left hover:no-underline py-6 text-lg font-semibold">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(217_91%_60%_/_0.2),transparent_70%)]" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-foreground leading-tight">
            Pronto para começar?
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Transforme seu sonho em realidade com dois especialistas dedicados ao seu sucesso
          </p>
          <Button size="lg" className="text-lg px-12 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-2xl shadow-primary/20">
            Agendar Consultoria
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              American Dream
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Transformando sonhos em planos reais
            </p>
            <p className="text-muted-foreground/60 text-xs pt-6 border-t border-border max-w-md mx-auto">
              © 2024 Consultoria American Dream. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
