-- Criação da tabela para registrar cliques no link do Hotmart
CREATE TABLE IF NOT EXISTS hotmart_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  term_acceptance_id UUID NOT NULL REFERENCES term_acceptance(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hotmart_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_hotmart_clicks_lead_id ON hotmart_clicks(lead_id);
CREATE INDEX IF NOT EXISTS idx_hotmart_clicks_clicked_at ON hotmart_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_hotmart_clicks_term_acceptance_id ON hotmart_clicks(term_acceptance_id);

-- Comentários na tabela
COMMENT ON TABLE hotmart_clicks IS 'Registra quando um lead clica no link do Hotmart para pagamento';
COMMENT ON COLUMN hotmart_clicks.lead_id IS 'ID do lead que clicou no link';
COMMENT ON COLUMN hotmart_clicks.term_acceptance_id IS 'ID da aceitação de termos relacionada';
COMMENT ON COLUMN hotmart_clicks.clicked_at IS 'Data e hora do clique no link do Hotmart';
COMMENT ON COLUMN hotmart_clicks.hotmart_url IS 'URL do Hotmart que foi clicada';

