-- ⚔️ Excalibur — Migration 003: HEAD IA + Sistema

-- LOG de consultas ao HEAD (Claude API)
CREATE TABLE IF NOT EXISTS head_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  acao text NOT NULL,
  pergunta text,
  resposta text,
  modelo text,
  tokens int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_head_log_acao ON head_log(acao);
CREATE INDEX IF NOT EXISTS idx_head_log_created ON head_log(created_at DESC);
ALTER TABLE head_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "head_log_all" ON head_log;
CREATE POLICY "head_log_all" ON head_log FOR ALL USING (true) WITH CHECK (true);

-- Insights gerados pela IA
CREATE TABLE IF NOT EXISTS insights_ia (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('alerta','oportunidade','previsao','acao','diagnostico')),
  titulo text NOT NULL,
  conteudo text NOT NULL,
  prioridade text DEFAULT 'media' CHECK (prioridade IN ('alta','media','baixa')),
  status text DEFAULT 'novo' CHECK (status IN ('novo','visto','aplicado','descartado')),
  dados_origem jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insights_status ON insights_ia(status);
ALTER TABLE insights_ia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insights_all" ON insights_ia;
CREATE POLICY "insights_all" ON insights_ia FOR ALL USING (true) WITH CHECK (true);

-- Status geral do sistema
CREATE TABLE IF NOT EXISTS sistema_status (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chave text UNIQUE NOT NULL,
  valor text,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sistema_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "status_all" ON sistema_status;
CREATE POLICY "status_all" ON sistema_status FOR ALL USING (true) WITH CHECK (true);

-- Log de sincronização
CREATE TABLE IF NOT EXISTS sync_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  origem text NOT NULL,
  destino text NOT NULL,
  status text DEFAULT 'ok',
  detalhes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sync_all" ON sync_log;
CREATE POLICY "sync_all" ON sync_log FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Realtime nas tabelas chave
ALTER PUBLICATION supabase_realtime ADD TABLE head_log;
ALTER PUBLICATION supabase_realtime ADD TABLE insights_ia;
ALTER PUBLICATION supabase_realtime ADD TABLE sistema_status;
