-- =============================================
-- EXCALIBUR: Event System + Observabilidade
-- =============================================

-- 1. Tabela eventos_sistema
CREATE TABLE IF NOT EXISTS eventos_sistema (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name text NOT NULL,
  event_version int DEFAULT 1,
  aggregate_type text,
  aggregate_id uuid,
  clinica_id uuid,
  actor_type text DEFAULT 'system',
  actor_id uuid,
  source_system text DEFAULT 'excalibur-app',
  payload_json jsonb DEFAULT '{}',
  metadata_json jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending','processed','failed'))
);

CREATE INDEX IF NOT EXISTS idx_eventos_clinica ON eventos_sistema(clinica_id);
CREATE INDEX IF NOT EXISTS idx_eventos_name ON eventos_sistema(event_name);
CREATE INDEX IF NOT EXISTS idx_eventos_status ON eventos_sistema(status);
CREATE INDEX IF NOT EXISTS idx_eventos_created ON eventos_sistema(created_at DESC);

-- 2. Tabela automacoes_execucoes
CREATE TABLE IF NOT EXISTS automacoes_execucoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow text NOT NULL,
  evento text,
  clinica_id uuid,
  input_json jsonb DEFAULT '{}',
  output_json jsonb DEFAULT '{}',
  status text DEFAULT 'running' CHECK (status IN ('running','success','failed','timeout')),
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  duracao_ms int
);

-- 3. Tabela logs_sistema
CREATE TABLE IF NOT EXISTS logs_sistema (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id uuid,
  user_id uuid,
  rota text,
  metodo text DEFAULT 'GET',
  acao text,
  tipo text DEFAULT 'info' CHECK (tipo IN ('info','warn','error','critical')),
  duracao_ms int,
  status_code int,
  payload jsonb DEFAULT '{}',
  stack_trace text,
  correlation_id uuid DEFAULT gen_random_uuid(),
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_clinica ON logs_sistema(clinica_id);
CREATE INDEX IF NOT EXISTS idx_logs_tipo ON logs_sistema(tipo);
CREATE INDEX IF NOT EXISTS idx_logs_rota ON logs_sistema(rota);
CREATE INDEX IF NOT EXISTS idx_logs_created ON logs_sistema(created_at DESC);

-- 4. Tabela metricas_rotas
CREATE TABLE IF NOT EXISTS metricas_rotas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rota text NOT NULL,
  metodo text DEFAULT 'GET',
  p50_ms int DEFAULT 0,
  p95_ms int DEFAULT 0,
  p99_ms int DEFAULT 0,
  total_requests int DEFAULT 0,
  total_errors int DEFAULT 0,
  error_rate numeric(5,2) DEFAULT 0,
  data date DEFAULT CURRENT_DATE,
  UNIQUE(rota, metodo, data)
);

-- 5. Tabela incidentes
CREATE TABLE IF NOT EXISTS incidentes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  descricao text,
  severidade text DEFAULT 'media' CHECK (severidade IN ('baixa','media','alta','critica')),
  status text DEFAULT 'aberto' CHECK (status IN ('aberto','investigando','resolvido','fechado')),
  afeta_clinicas uuid[],
  root_cause text,
  resolucao text,
  responsavel text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- 6. RLS
ALTER TABLE eventos_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE automacoes_execucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_rotas ENABLE ROW LEVEL SECURITY;

-- 7. Policies (service role full access)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_eventos_all') THEN
    CREATE POLICY "service_eventos_all" ON eventos_sistema FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_logs_all') THEN
    CREATE POLICY "service_logs_all" ON logs_sistema FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_incidentes_all') THEN
    CREATE POLICY "service_incidentes_all" ON incidentes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_automacoes_exec_all') THEN
    CREATE POLICY "service_automacoes_exec_all" ON automacoes_execucoes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_metricas_all') THEN
    CREATE POLICY "service_metricas_all" ON metricas_rotas FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 8. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE eventos_sistema;
ALTER PUBLICATION supabase_realtime ADD TABLE incidentes;

-- 9. Helper: exec_sql for future use
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void AS $$
BEGIN EXECUTE query; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
