-- Criação da tabela para rastrear tentativas de webhook (sucessos e falhas)
CREATE TABLE IF NOT EXISTS webhook_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT,
  event_type TEXT,
  signature_length INTEGER,
  body_length INTEGER,
  error_message TEXT,
  error_type TEXT,
  user_agent TEXT,
  origin TEXT,
  referer TEXT,
  x_forwarded_for TEXT,
  x_real_ip TEXT,
  request_url TEXT,
  request_method TEXT,
  success BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance e análise
CREATE INDEX IF NOT EXISTS idx_webhook_attempts_event_id ON webhook_attempts(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_attempts_event_type ON webhook_attempts(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_attempts_created_at ON webhook_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_attempts_success ON webhook_attempts(success);
CREATE INDEX IF NOT EXISTS idx_webhook_attempts_x_forwarded_for ON webhook_attempts(x_forwarded_for);

-- Comentários na tabela
COMMENT ON TABLE webhook_attempts IS 'Registra todas as tentativas de webhook do Stripe (sucessos e falhas) para análise e segurança';
COMMENT ON COLUMN webhook_attempts.event_id IS 'ID do evento Stripe (se disponível)';
COMMENT ON COLUMN webhook_attempts.event_type IS 'Tipo do evento Stripe (se disponível)';
COMMENT ON COLUMN webhook_attempts.success IS 'Indica se a verificação de assinatura foi bem-sucedida';
COMMENT ON COLUMN webhook_attempts.x_forwarded_for IS 'IP de origem da requisição (quando disponível)';

