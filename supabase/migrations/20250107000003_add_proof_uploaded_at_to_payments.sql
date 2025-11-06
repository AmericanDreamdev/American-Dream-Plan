-- Adicionar campo opcional para rastreamento de upload de comprovante
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS proof_uploaded_at TIMESTAMPTZ;

-- Índice para consultas
CREATE INDEX IF NOT EXISTS idx_payments_proof_uploaded_at ON payments(proof_uploaded_at) WHERE proof_uploaded_at IS NOT NULL;

-- Comentário
COMMENT ON COLUMN payments.proof_uploaded_at IS 'Data em que o usuário fez upload do comprovante de pagamento';

