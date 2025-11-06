-- Criação da tabela approval_tokens para armazenar tokens de aprovação
CREATE TABLE IF NOT EXISTS approval_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  payment_proof_id UUID NOT NULL REFERENCES payment_proofs(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  term_acceptance_id UUID REFERENCES term_acceptance(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_approval_tokens_token ON approval_tokens(token);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_lead_id ON approval_tokens(lead_id);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_payment_proof_id ON approval_tokens(payment_proof_id);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_expires_at ON approval_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_used_at ON approval_tokens(used_at) WHERE used_at IS NULL;

-- Comentários
COMMENT ON TABLE approval_tokens IS 'Armazena tokens únicos gerados após aprovação de comprovantes de pagamento';
COMMENT ON COLUMN approval_tokens.token IS 'Token mascarado/curto para acesso ao formulário (ex: app-a3k9x2m)';
COMMENT ON COLUMN approval_tokens.expires_at IS 'Data de expiração do token (padrão: 30 dias)';
COMMENT ON COLUMN approval_tokens.used_at IS 'Data em que o token foi usado (NULL se ainda não foi usado)';

