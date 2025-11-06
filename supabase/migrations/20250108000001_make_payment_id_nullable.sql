-- Tornar payment_id opcional (nullable) na tabela consultation_forms
-- Isso permite que formulários sejam submetidos mesmo sem payment_id,
-- mantendo a referência ao lead_id e term_acceptance_id

ALTER TABLE consultation_forms
ALTER COLUMN payment_id DROP NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN consultation_forms.payment_id IS 'ID do pagamento (opcional). Pode ser NULL para casos onde o pagamento foi verificado manualmente fora da plataforma.';

