-- Criação da tabela payment_proofs para armazenar comprovantes de pagamento
CREATE TABLE IF NOT EXISTS payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  term_acceptance_id UUID REFERENCES term_acceptance(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('zelle', 'infinitepay')),
  proof_image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payment_proofs_lead_id ON payment_proofs(lead_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_payment_id ON payment_proofs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON payment_proofs(status);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_created_at ON payment_proofs(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_payment_proofs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_proofs_updated_at
  BEFORE UPDATE ON payment_proofs
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_proofs_updated_at();

-- Comentários
COMMENT ON TABLE payment_proofs IS 'Armazena comprovantes de pagamento enviados por usuários para Zelle e InfinitePay';
COMMENT ON COLUMN payment_proofs.payment_method IS 'Método de pagamento: zelle ou infinitepay';
COMMENT ON COLUMN payment_proofs.status IS 'Status do comprovante: pending, approved, rejected';
COMMENT ON COLUMN payment_proofs.proof_image_url IS 'URL da imagem do comprovante no Supabase Storage';

