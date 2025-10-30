import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check } from "lucide-react";
import heroImage from "@/assets/hero-american-dream.jpg";
import consultant1 from "@/assets/consultant-1.jpg";
import consultant2 from "@/assets/consultant-2.jpg";
import processVisual from "@/assets/process-visual.jpg";
import successStudents from "@/assets/success-students.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <Badge className="mb-6 bg-white/20 backdrop-blur-sm text-white text-sm px-4 py-2 border-white/30">
            Consultoria American Dream
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
            Transforme seu sonho<br />americano em realidade
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-12 text-white/90 max-w-3xl mx-auto leading-relaxed">
            Duas autoridades em imigração e educação nos EUA criam sua estratégia personalizada de visto e permanência legal.
          </p>
          <Button variant="hero" size="xl" className="text-lg shadow-2xl">
            Iniciar Consultoria
          </Button>
          <p className="text-sm mt-6 text-white/70">
            Ceme Suaiden × Matheus Brant
          </p>
        </div>
      </section>

      {/* O que é a Consultoria */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Consultoria estratégica completa
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Duas sessões personalizadas com análise profunda do seu perfil, documentos e objetivos para criar um plano de ação real e executável.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-accent mb-2">2</div>
              <h3 className="font-semibold text-lg">Sessões Estratégicas</h3>
              <p className="text-sm text-muted-foreground">Com especialistas certificados</p>
            </div>
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-accent mb-2">100%</div>
              <h3 className="font-semibold text-lg">Personalizado</h3>
              <p className="text-sm text-muted-foreground">Estratégia única para seu perfil</p>
            </div>
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-accent mb-2">3</div>
              <h3 className="font-semibold text-lg">Tipos de Visto</h3>
              <p className="text-sm text-muted-foreground">B1/B2, F1 ou Change of Status</p>
            </div>
          </div>

          <Card className="border-muted bg-muted/30 max-w-4xl mx-auto">
            <CardContent className="pt-6">
              <p className="text-center text-sm text-muted-foreground">
                <strong>Importante:</strong> Esta consultoria é estratégica e orientativa. Não inclui peticionamento jurídico ou representação junto às autoridades migratórias.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Processos de Visto */}
      <section className="py-24 bg-muted/30 relative">
        <div 
          className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${processVisual})` }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-20 text-foreground">
            Processos de Visto
          </h2>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* B1/B2 */}
            <Card className="border-border hover:shadow-xl transition-all bg-background/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl mb-2">B1/B2</CardTitle>
                <Badge className="w-fit bg-primary/10 text-primary border-primary/20">Turista e Negócios</Badge>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 border-t">
                <div className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <p className="text-sm text-muted-foreground">Estratégia de elegibilidade</p>
                </div>
                <div className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <p className="text-sm text-muted-foreground">Orientação DS-160 completa</p>
                </div>
                <div className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <p className="text-sm text-muted-foreground">Simulação de entrevista</p>
                </div>
                <div className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <p className="text-sm text-muted-foreground">Dicas de entrada segura</p>
                </div>
              </CardContent>
            </Card>

            {/* F1 */}
            <Card className="border-accent border-2 hover:shadow-2xl transition-all transform lg:scale-105 bg-background">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl mb-2">F1</CardTitle>
                <Badge className="w-fit bg-accent text-accent-foreground">Visto de Estudante</Badge>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 border-t">
                <div className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <p className="text-sm text-muted-foreground">Escolha estratégica de escola</p>
                </div>
                <div className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <p className="text-sm text-muted-foreground">I-20 e SEVIS orientação</p>
                </div>
                <div className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <p className="text-sm text-muted-foreground">Checklist de matrícula</p>
                </div>
                <div className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <p className="text-sm text-muted-foreground">Work Permit e extensões</p>
                </div>
              </CardContent>
            </Card>

            {/* COS */}
            <Card className="border-border hover:shadow-xl transition-all bg-background/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl mb-2">COS</CardTitle>
                <Badge className="w-fit bg-secondary/10 text-secondary border-secondary/20">Change of Status</Badge>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 border-t">
                <div className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <p className="text-sm text-muted-foreground">Avaliação de elegibilidade</p>
                </div>
                <div className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <p className="text-sm text-muted-foreground">Transição sem sair dos EUA</p>
                </div>
                <div className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <p className="text-sm text-muted-foreground">Planejamento de prazos</p>
                </div>
                <div className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <p className="text-sm text-muted-foreground">Evitar perda de status</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bônus Exclusivos */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20 text-base px-6 py-2">
              Benefícios Exclusivos
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Além da Consultoria
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Acesso a oportunidades reais nos Estados Unidos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="border-border hover:border-accent/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-xl">Mastermind Presencial</CardTitle>
                <CardDescription>3 dias nos EUA com networking exclusivo</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border hover:border-accent/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-xl">Bolsas de Estudo</CardTitle>
                <CardDescription>Até 100% em instituições parceiras</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border hover:border-accent/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-xl">Descontos em Vistos</CardTitle>
                <CardDescription>50% de desconto em outros processos</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border hover:border-accent/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-xl">Networking Premium</CardTitle>
                <CardDescription>Conexões com empresários e investidores</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Especialistas */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-20 text-foreground">
            Seus Especialistas
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <Card className="border-border overflow-hidden group hover:shadow-2xl transition-all">
              <div className="aspect-square overflow-hidden">
                <img 
                  src={consultant1} 
                  alt="Ceme Suaiden" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl mb-2">Ceme Suaiden</CardTitle>
                <Badge className="w-fit mx-auto">The Future of English</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Mais de 1.500 alunos aprovados em escolas e colleges nos EUA. Especialista em programas híbridos com Work Permit e bolsas de estudo.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border overflow-hidden group hover:shadow-2xl transition-all">
              <div className="aspect-square overflow-hidden">
                <img 
                  src={consultant2} 
                  alt="Matheus Brant" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl mb-2">Matheus Brant</CardTitle>
                <Badge className="w-fit mx-auto">Brant Immigration</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Consultor migratório especializado em vistos e permanência legal. Centenas de processos de Change of Status bem-sucedidos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-24 bg-background relative">
        <div 
          className="absolute inset-0 opacity-5 bg-cover bg-center"
          style={{ backgroundImage: `url(${successStudents})` }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-20 text-foreground">
            Histórias de Sucesso
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { name: "Rafael M.", location: "Orlando", text: "Entendi o caminho certo para meu visto F1 e já estou estudando nos EUA." },
              { name: "Larissa P.", location: "Boston", text: "Mostram o caminho exato com clareza e segurança. Vale cada centavo." },
              { name: "Lucas F.", location: "Austin", text: "Primeira vez que alguém realmente analisou meu caso de forma personalizada." },
            ].map((testimonial, i) => (
              <Card key={i} className="border-border bg-background/90 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-6 leading-relaxed">{testimonial.text}</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Investimento */}
      <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
                Investimento na Sua Jornada
              </h2>
              <p className="text-lg text-muted-foreground">
                Plano completo com garantia de resultado
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <Card className="lg:col-span-2 border-2 border-primary/20 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-primary to-primary/80 p-8 md:p-12 text-center text-white">
                  <p className="text-sm font-semibold mb-2 opacity-90">Valor Total</p>
                  <div className="text-5xl md:text-7xl font-bold mb-3">
                    US$ 1.998
                  </div>
                  <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                    <p className="text-lg font-medium">2x US$ 999</p>
                  </div>
                </div>
              
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-3 items-center">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <p className="text-foreground font-medium">Cartão internacional</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <p className="text-foreground font-medium">Transferência bancária</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <p className="text-foreground font-medium">Pagamentos eletrônicos</p>
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">1</div>
                      <div>
                        <p className="font-semibold text-foreground">Primeira parcela</p>
                        <p className="text-sm text-muted-foreground">No ato da contratação</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">2</div>
                      <div>
                        <p className="font-semibold text-foreground">Segunda parcela</p>
                        <p className="text-sm text-muted-foreground">1 dia antes da 1ª sessão</p>
                      </div>
                    </div>
                  </div>

                  <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-lg font-semibold">
                    Garantir Minha Vaga
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-accent/30 bg-accent/5 flex flex-col justify-center">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">Garantia Total</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      100% do valor devolvido se você não for elegível para nenhum processo de visto
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold text-accent">Risco Zero</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-foreground">
            Perguntas Frequentes
          </h2>
          
          <Accordion type="single" collapsible className="max-w-3xl mx-auto space-y-4">
            <AccordionItem value="item-1" className="border rounded-lg px-6 bg-muted/30">
              <AccordionTrigger className="text-left hover:no-underline py-5">
                A consultoria é 100% online?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                Sim. Todas as etapas são realizadas online com acompanhamento direto dos especialistas.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border rounded-lg px-6 bg-muted/30">
              <AccordionTrigger className="text-left hover:no-underline py-5">
                A consultoria garante aprovação do visto?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                Não garantimos aprovação, mas fornecemos análise estratégica completa e orientação para maximizar suas chances de sucesso.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border rounded-lg px-6 bg-muted/30">
              <AccordionTrigger className="text-left hover:no-underline py-5">
                Posso contratar estando nos EUA?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                Sim. Atendemos clientes no Brasil e residentes temporários nos Estados Unidos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border rounded-lg px-6 bg-muted/30">
              <AccordionTrigger className="text-left hover:no-underline py-5">
                Quanto tempo leva para receber o plano?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                Você recebe seu plano estratégico completo em até 5 dias úteis após a segunda sessão.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-gradient-to-br from-primary via-primary to-secondary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,white,transparent_70%)]" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight">
            Comece sua jornada hoje
          </h2>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            Transforme seu desejo em um plano estratégico concreto com dois especialistas dedicados ao seu sucesso.
          </p>
          <Button size="xl" className="text-lg bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all shadow-2xl">
            Agendar Consultoria
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-secondary-foreground">American Dream</h3>
            <p className="text-secondary-foreground/70 text-sm max-w-md mx-auto">
              Transformando sonhos em planos reais desde 2024
            </p>
            <p className="text-secondary-foreground/60 text-xs pt-6 border-t border-secondary-foreground/20">
              © 2024 Consultoria American Dream. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
