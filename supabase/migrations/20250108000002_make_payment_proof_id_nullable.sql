-- Tornar payment_proof_id opcional (nullable) na tabela approval_tokens
-- Isso permite gerar tokens diretamente para lead_id e term_acceptance_id
-- sem precisar de um payment_proof

ALTER TABLE approval_tokens
ALTER COLUMN payment_proof_id DROP NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN approval_tokens.payment_proof_id IS 'ID do comprovante de pagamento (opcional). Pode ser NULL para casos onde o link é gerado diretamente sem comprovante.';

