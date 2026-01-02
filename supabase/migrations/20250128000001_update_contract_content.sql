-- Migration para atualizar o conteúdo do contrato American Dream
-- Desativa o termo atual e cria uma nova versão com o conteúdo atualizado

-- Primeiro, desativar todos os termos ativos do tipo lead_contract
UPDATE application_terms
SET is_active = false
WHERE term_type = 'lead_contract' AND is_active = true;

-- Inserir nova versão do contrato com conteúdo atualizado
INSERT INTO application_terms (
  title,
  content,
  term_type,
  is_active,
  version,
  created_at
) VALUES (
  'CONTRATO DE CONSULTORIA AMERICAN DREAM',
  '<h1>CONTRATO DE CONSULTORIA AMERICAN DREAM</h1>
<h2>(Termos e Condições de Contratação)</h2>

<p>Este documento estabelece os termos e condições gerais aplicáveis à contratação dos serviços de Consultoria American Dream, oferecidos pelas empresas abaixo qualificadas.</p>

<p>A aceitação deste contrato, mediante assinatura física, digital ou eletrônica, implica na leitura, compreensão e concordância integral com todas as cláusulas, condições, direitos e deveres aqui descritos.</p>

<hr>

<h2>CLÁUSULA PRIMEIRA – DAS PARTES</h2>

<h3>1.1. CONTRATADAS:</h3>

<p><strong>MIGMA INC</strong>, pessoa jurídica de direito privado, com sede em 3435 Wilshire Blvd, Suite 1740, Los Angeles, CA 90010, USA, e-mail adm@migmainc.com, telefone + 1 213 422 2451 doravante denominada <strong>PRIMEIRA CONTRATADA</strong>;</p>

<p>e</p>

<p><strong>THE FUTURE IMMIGRATION INC</strong>, pessoa jurídica de direito privado, com sede em 17102 W Gatling Rd, Marana, AZ 85653, USA, e-mail info@thefutureimmigration.com, telefone +1 (520) 497-8244, doravante denominada <strong>SEGUNDA CONTRATADA</strong>.</p>

<p>Em conjunto, denominadas <strong>CONTRATADAS</strong>.</p>

<h3>1.2. CONTRATANTE:</h3>

<p>Qualquer pessoa física ou jurídica que aceite formalmente os presentes termos e condições, mediante assinatura física, digital ou eletrônica, reconhecendo ter lido e compreendido integralmente este instrumento, doravante denominada <strong>CONTRATANTE</strong>.</p>

<hr>

<h2>CLÁUSULA SEGUNDA – DO OBJETO</h2>

<h3>2.1.</h3>
<p>O presente contrato tem por objeto a prestação de serviços de Consultoria American Dream, com foco na elaboração de estratégias personalizadas de planejamento de visto e permanência legal nos Estados Unidos da América, abrangendo o estudo do perfil, análise documental e direcionamento estratégico.</p>

<h3>2.2. Os serviços incluídos são:</h3>
<ul>
  <li>Até 2 (duas) sessões estratégicas personalizadas;</li>
  <li>Análise de perfil e objetivos do CONTRATANTE;</li>
  <li>Desenvolvimento de estratégia individualizada;</li>
  <li>Preparação e análise de documentos;</li>
  <li>Processo de visto incluso: Turista (B1/B2), Estudante (F1) ou Troca de Status (Change of Status – COS), conforme o perfil identificado.</li>
</ul>

<h3>2.3.</h3>
<p>O presente contrato contempla apenas consultoria e orientação estratégica, não incluindo representação jurídica, execução processual ou peticionamento junto às autoridades migratórias, os quais poderão ser contratados separadamente.</p>

<hr>

<h2>CLÁUSULA TERCEIRA – DA EXECUÇÃO DOS SERVIÇOS</h2>

<h3>3.1.</h3>
<p>A prestação dos serviços será realizada de forma remota, por meio de plataformas digitais, videoconferência, e-mails e demais meios eletrônicos oficialmente reconhecidos pelas CONTRATADAS.</p>

<h3>3.2.</h3>
<p>As CONTRATADAS comprometem-se a manter sigilo profissional sobre todas as informações recebidas e a tratar os dados do CONTRATANTE com confidencialidade e ética.</p>

<h3>3.3.</h3>
<p>O CONTRATANTE reconhece que a consultoria é de natureza intelectual e personalizada, e que os resultados dependem de sua colaboração, envio de informações e comprometimento durante o processo.</p>

<hr>

<h2>CLÁUSULA QUARTA – DOS BÔNUS</h2>

<h3>4.1.</h3>
<p>O CONTRATANTE terá direito, como benefício adicional, aos seguintes bônus exclusivos:</p>
<ul>
  <li>Participação em Mastermind Presencial de 3 (três) dias nos Estados Unidos;</li>
  <li>Bolsas de estudo de até 100% em instituições parceiras;</li>
  <li>Black Friday 30% de desconto em outros tipos de vistos;</li>
  <li>Networking com empresários e investidores nos Estados Unidos;</li>
  <li>Possibilidade de participação societária em empresa americana, mediante análise e convite das CONTRATADAS.</li>
</ul>

<h3>4.2.</h3>
<p>As despesas pessoais do CONTRATANTE (passagens, hospedagem, transporte, alimentação e correlatos) são de sua responsabilidade exclusiva.</p>

<hr>

<h2>CLÁUSULA QUINTA – DO PAGAMENTO</h2>

<h3>5.1.</h3>
<p>O valor total deste contrato é de <strong>US$ 1.998</strong> (mil novecentos e noventa e oito dólares americanos), divididos em 2 (duas) parcelas iguais de <strong>US$ 999</strong> (novecentos e noventa e nove dólares americanos), sendo:</p>
<ul>
  <li><strong>1ª parcela:</strong> devida no ato da assinatura deste contrato;</li>
  <li><strong>2ª parcela:</strong> deverá ser paga até 1 (um) dia antes da data agendada para a primeira sessão estratégica, cujo agendamento é de livre escolha do CONTRATANTE.</li>
</ul>

<h3>5.2.</h3>
<p>Os pagamentos poderão ser efetuados por transferência bancária internacional, cartão de crédito, ou qualquer outro meio eletrônico aceito pelas CONTRATADAS.</p>

<h3>5.3.</h3>
<p>O não pagamento dentro do prazo acarretará suspensão do atendimento e aplicação de multa de 10% (dez por cento) sobre o valor devido, acrescida de juros de 1% (um por cento) ao mês até a regularização.</p>

<hr>

<h2>CLÁUSULA SEXTA – GARANTIA AMERICAN DREAM</h2>

<h3>6.1.</h3>
<p>Caso, após análise do perfil e documentação, as CONTRATADAS concluam que o CONTRATANTE não é elegível para nenhum tipo de visto ou estratégia real de permanência legal nos Estados Unidos, será realizado o reembolso integral (100%) do valor pago, sem burocracia.</p>

<h3>6.2.</h3>
<p>A garantia aplica-se exclusivamente à inelegibilidade comprovada. Não haverá reembolso em casos de:</p>
<ul>
  <li>a) Desistência ou arrependimento;</li>
  <li>b) Mudança de interesse ou objetivo;</li>
  <li>c) Não comparecimento às sessões;</li>
  <li>d) Negativa de visto por parte das autoridades americanas.</li>
</ul>

<hr>

<h2>CLÁUSULA SÉTIMA – DAS OBRIGAÇÕES DO CONTRATANTE</h2>

<h3>7.1.</h3>
<p>O CONTRATANTE compromete-se a:</p>
<ul>
  <li>a) Fornecer informações e documentos verdadeiros, completos e atualizados;</li>
  <li>b) Cumprir pontualmente as obrigações financeiras assumidas;</li>
  <li>c) Respeitar os prazos e orientações fornecidas pelas CONTRATADAS;</li>
  <li>d) Manter comunicação ativa durante o processo;</li>
  <li>e) Preservar a confidencialidade de informações internas e estratégicas recebidas.</li>
</ul>

<h3>7.2.</h3>
<p>O envio de informações falsas, incompletas ou fraudulentas autoriza as CONTRATADAS a rescindir imediatamente o contrato, sem direito a reembolso.</p>

<hr>

<h2>CLÁUSULA OITAVA – DAS OBRIGAÇÕES DAS CONTRATADAS</h2>

<h3>8.1.</h3>
<p>As CONTRATADAS comprometem-se a:</p>
<ul>
  <li>a) Executar os serviços com profissionalismo, zelo, confidencialidade e boa-fé;</li>
  <li>b) Prestar informações claras e objetivas sobre cada etapa do processo;</li>
  <li>c) Manter o CONTRATANTE informado sobre prazos e requisitos necessários.</li>
</ul>

<hr>

<h2>CLÁUSULA NONA – PRIVACIDADE E PROTEÇÃO DE DADOS</h2>

<h3>9.1.</h3>
<p>As CONTRATADAS comprometem-se a proteger todas as informações e documentos fornecidos pelo CONTRATANTE, em conformidade com as leis de privacidade vigentes nos Estados Unidos.</p>

<h3>9.2.</h3>
<p>O CONTRATANTE autoriza o uso de seus dados pessoais e profissionais para fins de execução contratual e comunicação comercial, inclusive em ambiente digital, plataformas e ferramentas seguras.</p>

<hr>

<h2>CLÁUSULA DÉCIMA – DA IRREVOGABILIDADE E RESCISÃO</h2>

<h3>10.1.</h3>
<p>Este contrato é irrevogável e irretratável, não podendo ser cancelado unilateralmente após a assinatura.</p>

<h3>10.2.</h3>
<p>O CONTRATANTE poderá solicitar a rescisão antes da primeira sessão estratégica, sem direito a reembolso, salvo nas hipóteses previstas na Garantia American Dream.</p>

<h3>10.3.</h3>
<p>Após a realização da primeira sessão, não haverá reembolso parcial ou total, dado o caráter intelectual e personalizado dos serviços.</p>

<h3>10.4.</h3>
<p>As CONTRATADAS poderão rescindir o contrato sem restituição de valores caso o CONTRATANTE descumpra obrigações contratuais, adote condutas inadequadas ou forneça informações falsas.</p>

<hr>

<h2>CLÁUSULA DÉCIMA PRIMEIRA – DISPOSIÇÕES FINAIS</h2>

<h3>11.1.</h3>
<p>Este contrato é regido pelas leis vigentes dos Estados Unidos da América, em especial as do Estado da Califórnia, considerando o domicílio principal da PRIMEIRA CONTRATADA.</p>

<h3>11.2.</h3>
<p>Fica eleito o foro da Comarca de Los Angeles, Estado da Califórnia (EUA), como competente para resolver quaisquer controvérsias oriundas deste contrato.</p>

<h3>11.3.</h3>
<p>O presente instrumento poderá ser assinado fisicamente ou eletronicamente, sendo considerado válido o envio de cópia assinada por e-mail ou plataforma digital.</p>

<h3>11.4.</h3>
<p>A assinatura do CONTRATANTE constitui aceite integral dos termos e condições, dispensando contrassinatura das CONTRATADAS.</p>

<hr>

<h2>CLÁUSULA DÉCIMA SEGUNDA – TERMO DE USO E AUTORIZAÇÃO DE IMAGEM E VOZ</h2>

<h3>12.1.</h3>
<p>O CONTRATANTE autoriza, de forma gratuita e irrevogável, o uso de sua imagem, voz, nome e depoimentos pelas CONTRATADAS, em campanhas publicitárias, vídeos institucionais, sites, redes sociais e demais materiais promocionais, por prazo indeterminado e em âmbito mundial.</p>

<h3>12.2.</h3>
<p>Essa autorização é concedida sem qualquer ônus ou contrapartida financeira, e tem por finalidade divulgar resultados, experiências e ações institucionais relacionadas à Consultoria American Dream.</p>

<h3>12.3.</h3>
<p>As CONTRATADAS comprometem-se a utilizar a imagem e a voz do CONTRATANTE de forma ética, respeitosa e compatível com a finalidade institucional.</p>

<hr>

<p><strong>Los Angeles, Califórnia, ____ de __________________ de 2025.</strong></p>

<hr>

<h3>CONTRATANTE</h3>
<p>Assinatura: ___________________________________________</p>
<p>Nome completo: ________________________________________</p>
<p>E-mail: ________________________________________________</p>
<p>Telefone: ______________________________________________</p>',
  'lead_contract',
  true,
  COALESCE((SELECT MAX(version) FROM application_terms WHERE term_type = 'lead_contract'), 0) + 1,
  NOW()
);

-- Comentário
COMMENT ON TABLE application_terms IS 'Tabela que armazena os termos e condições do contrato. A versão mais recente com is_active=true é a que está em vigor.';



