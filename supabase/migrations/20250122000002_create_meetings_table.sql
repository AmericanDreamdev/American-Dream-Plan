-- Criação da tabela meetings para rastrear reuniões (1ª estratégica e 2ª apresentação do plano)
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('first', 'second')),
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_meetings_lead_id ON meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_type ON meetings(meeting_type);
CREATE INDEX IF NOT EXISTS idx_meetings_lead_type ON meetings(lead_id, meeting_type);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meetings_updated_at();

-- Comentários na tabela
COMMENT ON TABLE meetings IS 'Reuniões com clientes: 1ª reunião (estratégica) e 2ª reunião (apresentação do plano)';
COMMENT ON COLUMN meetings.meeting_type IS 'Tipo da reunião: first (1ª estratégica) ou second (2ª apresentação do plano)';
COMMENT ON COLUMN meetings.scheduled_date IS 'Data e hora agendada para a reunião';
COMMENT ON COLUMN meetings.completed_date IS 'Data e hora em que a reunião foi realizada';
COMMENT ON COLUMN meetings.status IS 'Status: scheduled, completed, cancelled, no_show';
COMMENT ON COLUMN meetings.meeting_link IS 'Link do Calendly, Google Meet ou outra plataforma';
COMMENT ON COLUMN meetings.notes IS 'Anotações e observações da reunião';

