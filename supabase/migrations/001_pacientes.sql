-- ⚔️ Excalibur — Migration 001: Pacientes
-- Rodar no SQL Editor do Supabase dashboard

CREATE TABLE IF NOT EXISTS pacientes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  nome text NOT NULL,
  cpf text,
  telefone text,
  email text,
  data_nascimento date,
  procedimento text,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo','arquivado')),
  observacoes text,
  valor_total numeric(10,2) DEFAULT 0,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pacientes_status ON pacientes(status);
CREATE INDEX IF NOT EXISTS idx_pacientes_lead ON pacientes(lead_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_created ON pacientes(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf) WHERE cpf IS NOT NULL;

-- RLS (anon policy para MVP — endurecer depois)
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pacientes_all" ON pacientes;
CREATE POLICY "pacientes_all" ON pacientes FOR ALL USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pacientes_updated_at ON pacientes;
CREATE TRIGGER pacientes_updated_at BEFORE UPDATE ON pacientes
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
