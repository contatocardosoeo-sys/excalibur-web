const SUPABASE_URL = 'https://hluhlsnodndpskrkbjuw.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsdWhsc25vZG5kcHNrcmtianV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM1MDg3MCwiZXhwIjoyMDkwOTI2ODcwfQ.3gbnB8elQR1f1FOn5hshpF5Vdn4ZEureW3QHQmrws_o'

async function runSQL(sql, label) {
  console.log(`\n⚡ ${label}...`)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({})
  })
  // REST API can't run DDL. Use the pg endpoint instead.
}

// Use direct PostgreSQL connection via Supabase Management API
// Actually, let's use the SQL via the PostgREST rpc endpoint
async function execSQL(sql, label) {
  console.log(`⚡ ${label}...`)

  // First, create a helper function if it doesn't exist
  const createHelper = `
    CREATE OR REPLACE FUNCTION exec_sql(query text)
    RETURNS void AS $$
    BEGIN EXECUTE query; END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  // Try via rpc
  let res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  })

  if (res.ok) {
    console.log(`  ✅ ${label} — OK`)
    return true
  }

  const err = await res.text()
  if (err.includes('exec_sql') && err.includes('does not exist')) {
    // Create the helper first
    console.log('  Creating exec_sql helper...')
    // Can't create it without exec_sql... chicken-and-egg
    // Fall back to using the Supabase SQL HTTP endpoint
  }

  console.log(`  ❌ ${label} — ${err.substring(0, 200)}`)
  return false
}

async function main() {
  console.log('=== EXCALIBUR — Event System + Observabilidade ===\n')

  const sqls = [
    {
      label: '1. Tabela eventos_sistema',
      sql: `CREATE TABLE IF NOT EXISTS eventos_sistema (
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
      )`
    },
    {
      label: '2. Índices eventos_sistema',
      sql: `CREATE INDEX IF NOT EXISTS idx_eventos_clinica ON eventos_sistema(clinica_id);
            CREATE INDEX IF NOT EXISTS idx_eventos_name ON eventos_sistema(event_name);
            CREATE INDEX IF NOT EXISTS idx_eventos_status ON eventos_sistema(status);
            CREATE INDEX IF NOT EXISTS idx_eventos_created ON eventos_sistema(created_at DESC)`
    },
    {
      label: '3. Tabela automacoes_execucoes',
      sql: `CREATE TABLE IF NOT EXISTS automacoes_execucoes (
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
      )`
    },
    {
      label: '4. Tabela logs_sistema',
      sql: `CREATE TABLE IF NOT EXISTS logs_sistema (
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
      )`
    },
    {
      label: '5. Índices logs_sistema',
      sql: `CREATE INDEX IF NOT EXISTS idx_logs_clinica ON logs_sistema(clinica_id);
            CREATE INDEX IF NOT EXISTS idx_logs_tipo ON logs_sistema(tipo);
            CREATE INDEX IF NOT EXISTS idx_logs_rota ON logs_sistema(rota);
            CREATE INDEX IF NOT EXISTS idx_logs_created ON logs_sistema(created_at DESC)`
    },
    {
      label: '6. Tabela metricas_rotas',
      sql: `CREATE TABLE IF NOT EXISTS metricas_rotas (
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
      )`
    },
    {
      label: '7. Tabela incidentes',
      sql: `CREATE TABLE IF NOT EXISTS incidentes (
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
      )`
    },
    {
      label: '8. RLS + Realtime',
      sql: `ALTER TABLE eventos_sistema ENABLE ROW LEVEL SECURITY;
            ALTER TABLE logs_sistema ENABLE ROW LEVEL SECURITY;
            ALTER TABLE incidentes ENABLE ROW LEVEL SECURITY;
            ALTER TABLE automacoes_execucoes ENABLE ROW LEVEL SECURITY;
            ALTER TABLE metricas_rotas ENABLE ROW LEVEL SECURITY;
            ALTER PUBLICATION supabase_realtime ADD TABLE eventos_sistema;
            ALTER PUBLICATION supabase_realtime ADD TABLE incidentes`
    },
    {
      label: '9. RLS Policies — service role full access',
      sql: `CREATE POLICY "service_eventos_all" ON eventos_sistema FOR ALL USING (true) WITH CHECK (true);
            CREATE POLICY "service_logs_all" ON logs_sistema FOR ALL USING (true) WITH CHECK (true);
            CREATE POLICY "service_incidentes_all" ON incidentes FOR ALL USING (true) WITH CHECK (true);
            CREATE POLICY "service_automacoes_all" ON automacoes_execucoes FOR ALL USING (true) WITH CHECK (true);
            CREATE POLICY "service_metricas_all" ON metricas_rotas FOR ALL USING (true) WITH CHECK (true)`
    }
  ]

  for (const { label, sql } of sqls) {
    await execSQL(sql, label)
  }

  console.log('\n=== DONE ===')
}

main().catch(console.error)
