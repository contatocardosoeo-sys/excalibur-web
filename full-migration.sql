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
-- ⚔️ Excalibur — Migration 002: Agenda + Financeiro

-- AGENDAMENTOS
CREATE TABLE IF NOT EXISTS agendamentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE SET NULL,
  paciente_nome text NOT NULL,
  telefone text,
  data date NOT NULL,
  hora time NOT NULL,
  duracao_min int DEFAULT 60,
  procedimento text,
  status text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado','confirmado','compareceu','cancelado','noshow')),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ag_data ON agendamentos(data, hora);
CREATE INDEX IF NOT EXISTS idx_ag_status ON agendamentos(status);
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ag_all" ON agendamentos;
CREATE POLICY "ag_all" ON agendamentos FOR ALL USING (true) WITH CHECK (true);

-- PROPOSTAS (Excalibur Pay)
CREATE TABLE IF NOT EXISTS propostas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE SET NULL,
  paciente_nome text NOT NULL,
  procedimento text,
  valor_total numeric(10,2) NOT NULL,
  entrada numeric(10,2) DEFAULT 0,
  parcelas int DEFAULT 1,
  valor_parcela numeric(10,2) DEFAULT 0,
  taxa_juros numeric(5,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','negado','pago','cancelado')),
  financeira text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prop_status ON propostas(status);
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prop_all" ON propostas;
CREATE POLICY "prop_all" ON propostas FOR ALL USING (true) WITH CHECK (true);

-- MÉTRICAS DIÁRIAS
CREATE TABLE IF NOT EXISTS metricas_diarias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  data date UNIQUE NOT NULL,
  leads_novos int DEFAULT 0,
  agendamentos int DEFAULT 0,
  comparecimentos int DEFAULT 0,
  fechamentos int DEFAULT 0,
  faturamento numeric(10,2) DEFAULT 0,
  investimento_ads numeric(10,2) DEFAULT 0
);
ALTER TABLE metricas_diarias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "met_all" ON metricas_diarias;
CREATE POLICY "met_all" ON metricas_diarias FOR ALL USING (true) WITH CHECK (true);
