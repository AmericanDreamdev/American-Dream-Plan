-- Criação da tabela partners para cadastro de parceiros responsáveis
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  specialty TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca por nome
CREATE INDEX IF NOT EXISTS idx_partners_name ON partners(name);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partners_updated_at();

-- Comentários na tabela
COMMENT ON TABLE partners IS 'Cadastro de parceiros responsáveis pela execução de etapas do planejamento';
COMMENT ON COLUMN partners.name IS 'Nome do parceiro (único)';
COMMENT ON COLUMN partners.specialty IS 'Especialidade do parceiro (ex: Vistos de Turismo, Transferências Universitárias)';
COMMENT ON COLUMN partners.is_active IS 'Indica se o parceiro está ativo no sistema';

-- Dados iniciais (seed)
INSERT INTO partners (name, specialty, contact_email, is_active) VALUES
('Brant', 'Vistos de Turismo B1/B2', 'brant@example.com', true),
('The Future', 'Transferências Universitárias e F1', 'thefuture@example.com', true),
('Matheus', 'Consultoria Estratégica', 'matheus@example.com', true),
('Semi', 'Consultoria Estratégica', 'semi@example.com', true)
ON CONFLICT (name) DO NOTHING;

