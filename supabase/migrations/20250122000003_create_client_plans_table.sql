-- Criação da tabela client_plans para armazenar planejamentos individualizados
CREATE TABLE IF NOT EXISTS client_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  plan_title TEXT NOT NULL,
  plan_summary TEXT,
  plan_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_duration TEXT,
  estimated_investment NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'presented', 'in_progress', 'completed')),
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_client_plans_lead_id ON client_plans(lead_id);
CREATE INDEX IF NOT EXISTS idx_client_plans_status ON client_plans(status);
CREATE INDEX IF NOT EXISTS idx_client_plans_created_at ON client_plans(created_at DESC);

-- Índice GIN para busca dentro do JSONB plan_steps
CREATE INDEX IF NOT EXISTS idx_client_plans_steps_gin ON client_plans USING GIN (plan_steps);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_client_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_plans_updated_at
  BEFORE UPDATE ON client_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_client_plans_updated_at();

-- Comentários na tabela
COMMENT ON TABLE client_plans IS 'Planejamentos individualizados criados para cada cliente após a primeira reunião';
COMMENT ON COLUMN client_plans.lead_id IS 'ID do lead (único - cada lead tem apenas um plano)';
COMMENT ON COLUMN client_plans.plan_title IS 'Título do planejamento (ex: "Visto B1/B2 → F1 → EB-2")';
COMMENT ON COLUMN client_plans.plan_summary IS 'Resumo executivo do planejamento';
COMMENT ON COLUMN client_plans.plan_steps IS 'Array JSON com as etapas estruturadas do plano';
COMMENT ON COLUMN client_plans.estimated_duration IS 'Duração total estimada (ex: "18-24 meses")';
COMMENT ON COLUMN client_plans.estimated_investment IS 'Investimento total estimado em USD';
COMMENT ON COLUMN client_plans.status IS 'Status: draft (rascunho), presented (apresentado), in_progress (em execução), completed (concluído)';
COMMENT ON COLUMN client_plans.pdf_url IS 'URL do PDF exportado do planejamento';

-- Exemplo de estrutura do JSONB plan_steps:
-- [
--   {
--     "step_number": 1,
--     "title": "Visto de Turismo B1/B2",
--     "description": "Processo completo de aplicação",
--     "responsible_partner": "Brant",
--     "estimated_duration": "2-3 meses",
--     "estimated_cost": 2500,
--     "status": "pending"
--   }
-- ]

