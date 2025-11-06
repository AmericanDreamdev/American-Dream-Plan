-- Criação da tabela para formulários de consultoria
CREATE TABLE IF NOT EXISTS consultation_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  
  -- DADOS PESSOAIS
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  data_nascimento DATE,
  cidade_residencia TEXT,
  estado_civil TEXT,
  possui_filhos BOOLEAN DEFAULT false,
  dependentes JSONB, -- Array de objetos {nome, idade, grau_parentesco}
  
  -- OBJETIVO PRINCIPAL
  objetivo_principal TEXT, -- Estudar, Trabalhar, Empreender, Morar definitivamente, Apenas visitar, Outro
  objetivo_outro TEXT,
  tipo_visto_desejado TEXT, -- Turista (B1/B2), Estudante (F1), Troca de status (COS), Visto de trabalho, Não sei
  periodo_estimado TEXT, -- Nos próximos 3 meses, Em até 6 meses, Em 1 ano, Ainda sem data definida
  pretende_ir_sozinho BOOLEAN,
  pretende_ir_com TEXT, -- Sozinho(a), Com cônjuge, Com cônjuge e filhos, Outro
  
  -- PERFIL PROFISSIONAL E ACADÊMICO
  formacao_academica TEXT, -- Ensino médio, Curso técnico, Graduação, Pós-graduação / Mestrado / Doutorado
  area_formacao_atuacao TEXT,
  cargo_atual TEXT,
  tempo_cargo_atual TEXT,
  nivel_ingles TEXT, -- Básico, Intermediário, Avançado, Fluente
  
  -- SITUAÇÃO FINANCEIRA E INVESTIMENTO
  renda_mensal TEXT,
  possui_bens BOOLEAN DEFAULT false,
  descricao_bens TEXT,
  possui_empresa_cnpj BOOLEAN DEFAULT false,
  ramo_faturamento_empresa TEXT,
  investimento_disposto TEXT, -- Até US$ 5.000, Entre US$ 5.000 e US$ 15.000, Entre US$ 15.000 e US$ 30.000, Acima de US$ 30.000
  fundos_comprovaveis TEXT, -- US$ 10.000, US$ 20.000, US$ 30.000, US$ 40.000, Mais de US$ 40.000
  interesse_dolarizar TEXT, -- Sim, Não, Talvez
  
  -- HISTÓRICO MIGRATÓRIO
  ja_teve_visto_eua BOOLEAN DEFAULT false,
  tipo_visto_anterior TEXT,
  data_visto_anterior TEXT,
  ja_teve_visto_negado BOOLEAN DEFAULT false,
  motivo_visto_negado TEXT,
  ja_viajou_eua BOOLEAN DEFAULT false,
  detalhes_viagem_eua TEXT,
  ja_ficou_ilegal_eua BOOLEAN DEFAULT false,
  possui_parentes_eua BOOLEAN DEFAULT false,
  detalhes_parentes_eua TEXT,
  
  -- INTERESSES EDUCACIONAIS
  interesse_educacional TEXT, -- Curso de inglês, Faculdade / College, Curso técnico, Outro
  interesse_educacional_outro TEXT,
  possui_instituicao_mente BOOLEAN DEFAULT false,
  nome_instituicao TEXT,
  modalidade_curso TEXT, -- Presencial, Híbrido, Online
  busca_bolsa_financiamento TEXT, -- Sim, Não, Talvez
  
  -- NETWORK E OPORTUNIDADES
  conhece_palestrante BOOLEAN DEFAULT false,
  detalhes_palestrante TEXT,
  interesse_participar_eventos TEXT, -- Sim, Não, Talvez
  
  -- EXPECTATIVAS E MOTIVAÇÃO
  expectativas JSONB, -- Array de strings: Planejar entrada legal, Entender opções de visto, etc.
  expectativas_outro TEXT,
  como_conheceu TEXT, -- Instagram, Indicação, YouTube, Google, Outro
  como_conheceu_outro TEXT,
  
  -- DECLARAÇÃO FINAL
  data_declaracao DATE DEFAULT CURRENT_DATE,
  assinatura_digital TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_consultation_forms_lead_id ON consultation_forms(lead_id);
CREATE INDEX IF NOT EXISTS idx_consultation_forms_payment_id ON consultation_forms(payment_id);
CREATE INDEX IF NOT EXISTS idx_consultation_forms_created_at ON consultation_forms(created_at);

-- Comentários na tabela
COMMENT ON TABLE consultation_forms IS 'Formulários de análise prévia de consultoria preenchidos após pagamento';
COMMENT ON COLUMN consultation_forms.lead_id IS 'ID do lead relacionado';
COMMENT ON COLUMN consultation_forms.payment_id IS 'ID do pagamento relacionado (Stripe completed)';
COMMENT ON COLUMN consultation_forms.dependentes IS 'Array JSON com informações dos dependentes';
COMMENT ON COLUMN consultation_forms.expectativas IS 'Array JSON com as expectativas selecionadas';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_consultation_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_consultation_forms_updated_at
  BEFORE UPDATE ON consultation_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_consultation_forms_updated_at();

