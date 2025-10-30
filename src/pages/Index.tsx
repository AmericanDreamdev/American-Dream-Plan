import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Globe, GraduationCap, Users, Shield, Award, Sparkles, Star } from "lucide-react";
import heroImage from "@/assets/hero-american-dream.jpg";

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
          <Badge className="mb-6 bg-accent text-accent-foreground text-sm px-4 py-2">
            🇺🇸 Consultoria American Dream
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-primary-foreground">
            Transforme seu sonho americano<br />em um plano real.
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-4 text-primary-foreground/90 max-w-4xl mx-auto">
            Duas das maiores autoridades em imigração e educação nos EUA unem forças para criar sua estratégia personalizada de visto e permanência legal.
          </p>
          <p className="text-base md:text-lg mb-10 text-primary-foreground/80 font-medium">
            Ceme Suaiden (The Future of English) + Matheus Brant (Brant Immigration)
          </p>
          <Button variant="hero" size="xl" className="text-lg">
            Quero minha Consultoria American Dream 🚀
          </Button>
        </div>
      </section>

      {/* O que é a Consultoria */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              O que é a Consultoria American Dream
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A Consultoria American Dream foi criada para quem deseja estudar, morar ou mudar de status legalmente nos Estados Unidos, com segurança e estratégia. Em duas sessões estratégicas personalizadas, você receberá uma análise profunda do seu perfil, seus documentos e seus objetivos, com um plano real de ação para o visto ideal.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Users, title: "2 Sessões Estratégicas", desc: "com Ceme Suaiden e Matheus Brant" },
              { icon: Globe, title: "Análise de perfil", desc: "e objetivos pessoais" },
              { icon: CheckCircle2, title: "Preparação documental", desc: "e análise detalhada" },
              { icon: Shield, title: "Estratégia individualizada", desc: "desenvolvida para você" },
              { icon: Award, title: "Processo de visto ideal", desc: "B1/B2, F1 ou COS" },
              { icon: Sparkles, title: "Checklist completo", desc: "e cronograma passo a passo" },
            ].map((item, i) => (
              <Card key={i} className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <item.icon className="w-10 h-10 text-accent mb-3" />
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-base">{item.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card className="border-accent border-2 bg-muted/30">
            <CardContent className="pt-6">
              <p className="text-center text-sm text-muted-foreground">
                <strong>⚠️ Importante:</strong> Esta consultoria é estratégica e orientativa. Não inclui peticionamento jurídico ou representação junto às autoridades migratórias, que podem ser contratados separadamente.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Processos de Visto */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-foreground">
            Processos de Visto Incluídos
          </h2>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* B1/B2 */}
            <Card className="border-border hover:shadow-xl transition-all">
              <CardHeader>
                <Badge className="w-fit mb-3 bg-primary text-primary-foreground">B1/B2</Badge>
                <CardTitle className="text-2xl">Turista e Negócios</CardTitle>
                <CardDescription>Para quem deseja visitar os EUA para turismo, reuniões, eventos ou explorar oportunidades.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm">Estratégia de elegibilidade e coerência do roteiro</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm">Orientação completa para DS-160 e documentação</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm">Simulação de entrevista consular</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm">Dicas de entrada segura e comportamento migratório</p>
                </div>
              </CardContent>
            </Card>

            {/* F1 */}
            <Card className="border-accent border-2 hover:shadow-xl transition-all transform lg:scale-105">
              <CardHeader>
                <Badge className="w-fit mb-3 bg-accent text-accent-foreground">F1 - Mais Popular</Badge>
                <CardTitle className="text-2xl">Visto de Estudante</CardTitle>
                <CardDescription>Para quem deseja estudar nos Estados Unidos com o visto F1.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm">Estratégia de escolha da escola e curso alinhados</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm">Orientação sobre I-20, SEVIS e comprovação financeira</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm">Checklist completo de matrícula e documentação</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm">Diretrizes sobre status, extensões e Work Permit</p>
                </div>
              </CardContent>
            </Card>

            {/* COS */}
            <Card className="border-border hover:shadow-xl transition-all">
              <CardHeader>
                <Badge className="w-fit mb-3 bg-secondary text-secondary-foreground">COS</Badge>
                <CardTitle className="text-2xl">Change of Status</CardTitle>
                <CardDescription>Para quem já está nos EUA e deseja mudar seu status (ex: de turista para estudante).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm">Avaliação de elegibilidade e riscos do processo</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm">Estratégia de transição sem sair dos EUA</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm">Planejamento de tempo, documentação e prazos</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm">Diretrizes para evitar perda de status</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bônus Exclusivos */}
      <section className="py-20 bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)),transparent_50%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent text-accent-foreground text-base px-6 py-2">
              💎 Benefícios Premium
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Bônus Exclusivos
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Mais do que uma consultoria — um portal para oportunidades reais nos EUA.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: "🎓", title: "Mastermind Presencial", desc: "3 dias nos EUA com networking exclusivo" },
              { icon: "🏫", title: "Bolsas de até 100%", desc: "em instituições parceiras selecionadas" },
              { icon: "🪪", title: "50% de desconto", desc: "em outros tipos de vistos" },
              { icon: "🤝", title: "Networking Premium", desc: "com empresários e investidores americanos" },
              { icon: "💼", title: "Participação Societária", desc: "em empresa americana (mediante análise)" },
            ].map((bonus, i) => (
              <Card key={i} className="text-center border-border hover:border-accent transition-colors">
                <CardHeader>
                  <div className="text-5xl mb-4">{bonus.icon}</div>
                  <CardTitle className="text-xl">{bonus.title}</CardTitle>
                  <CardDescription>{bonus.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <p className="text-center text-muted-foreground mt-12 max-w-2xl mx-auto">
            Seu plano não termina no visto. Ele é o início de uma nova fase de crescimento, conexões e liberdade.
          </p>
        </div>
      </section>

      {/* Especialistas */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-foreground">
            Quem são os Especialistas
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <Card className="border-border hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">Ceme Suaiden</CardTitle>
                <Badge className="w-fit mx-auto mt-2">The Future of English</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Empresário e mentor com mais de 1.500 alunos aprovados em escolas e colleges nos EUA. Especialista em programas híbridos com Work Permit, bolsas e mudança de status via educação.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">Matheus Brant</CardTitle>
                <Badge className="w-fit mx-auto mt-2">Brant Immigration</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Consultor migratório e especialista em vistos e estratégias de permanência legal. Responsável por centenas de processos de Change of Status e regularização migratória bem-sucedidos.
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-lg font-medium mt-12 text-foreground">
            Juntos, eles criaram a <span className="text-accent">Consultoria American Dream</span> — a união perfeita entre educação + imigração + planejamento estratégico.
          </p>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-foreground">
            Depoimentos Reais
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { name: "Rafael M.", location: "Orlando", text: "Com a consultoria, entendi o caminho certo para meu visto F1 e já estou estudando nos EUA." },
              { name: "Larissa P.", location: "Boston", text: "Eles mostram o caminho exato com clareza e segurança. Vale cada centavo." },
              { name: "Lucas F.", location: "Austin", text: "Foi a primeira vez que alguém realmente analisou meu caso de forma personalizada." },
            ].map((testimonial, i) => (
              <Card key={i} className="border-border">
                <CardHeader>
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 fill-accent text-accent" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Investimento */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-foreground">
              Investimento e Condições
            </h2>
            
            <Card className="border-accent border-2 shadow-xl">
              <CardHeader className="text-center bg-gradient-to-br from-primary/5 to-accent/5">
                <CardTitle className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                  US$ 1.998
                </CardTitle>
                <CardDescription className="text-lg">ou 2 parcelas de US$ 999</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-foreground">Formas de Pagamento:</h3>
                  <div className="space-y-2">
                    <div className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">Cartão de crédito internacional</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">Transferência bancária internacional</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">Outros meios eletrônicos aceitos</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3 text-foreground">Cronograma de Pagamento:</h3>
                  <div className="space-y-2">
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shrink-0">1</div>
                      <p className="text-muted-foreground">1ª parcela: no ato da assinatura</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shrink-0">2</div>
                      <p className="text-muted-foreground">2ª parcela: até 1 dia antes da primeira sessão</p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Pagamentos fora do prazo geram multa de 10% e juros de 1% ao mês, além de suspensão temporária do atendimento.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Garantia */}
            <Card className="mt-8 border-primary border-2">
              <CardHeader className="text-center">
                <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
                <CardTitle className="text-2xl">Garantia American Dream — 100% Elegibilidade</CardTitle>
                <CardDescription className="text-base">
                  Ou existe um caminho real para você, ou devolvemos 100% do valor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Caso, após a análise do perfil e documentos, as contratadas concluam que você não é elegível para nenhum tipo de visto ou estratégia real de permanência legal nos EUA, será feito reembolso integral (100%) — sem burocracia.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground font-medium mb-2">A garantia não se aplica em casos de:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Desistência ou arrependimento</li>
                    <li>Mudança de interesse ou objetivo</li>
                    <li>Falta às sessões agendadas</li>
                    <li>Negativa de visto pelas autoridades americanas</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-foreground">
            Perguntas Frequentes
          </h2>
          
          <Accordion type="single" collapsible className="max-w-3xl mx-auto">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">A consultoria é 100% online?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Sim. Todas as etapas são realizadas online, com acompanhamento direto dos especialistas.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">A consultoria garante aprovação do visto?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Não. Ela garante a análise estratégica e a elegibilidade real, reduzindo significativamente riscos e erros.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">Posso contratar estando nos EUA?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Sim. Atendemos clientes tanto no Brasil quanto já residentes temporários nos Estados Unidos.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">Quanto tempo leva para receber meu plano final?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Em até 5 dias úteis após a segunda sessão estratégica.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            O seu sonho americano começa com um plano.
          </h2>
          <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto opacity-90">
            Com a Consultoria American Dream, você transforma desejo em direção. Tenha acesso direto a dois especialistas, um plano personalizado e benefícios exclusivos para construir seu futuro nos Estados Unidos com segurança, clareza e propósito.
          </p>
          <Button variant="hero" size="xl" className="text-lg bg-background text-foreground hover:bg-background/90">
            Quero meu Plano American Dream 🇺🇸
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-80">
            © 2025 Consultoria American Dream. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
