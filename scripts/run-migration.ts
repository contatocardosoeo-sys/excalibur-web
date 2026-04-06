// Script para executar migration no Supabase
// Uso: npx tsx scripts/run-migration.ts

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = 'https://hluhlsnodndpskrkbjuw.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

async function runMigration() {
  if (!supabaseServiceKey) {
    console.log('⚠️  SUPABASE_SERVICE_KEY não definida. Executando via SQL Editor no dashboard.')
    console.log('📋 Copie o conteúdo de supabase/migrations/001_multi_tenant_vendas.sql')
    console.log('🌐 Cole em: https://supabase.com/dashboard/project/hluhlsnodndpskrkbjuw/sql/new')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const sql = readFileSync(join(__dirname, '../supabase/migrations/001_multi_tenant_vendas.sql'), 'utf-8')

  console.log('⚔️  Executando migration multi-tenant vendas...')
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

  if (error) {
    console.error('❌ Erro:', error.message)
  } else {
    console.log('✅ Migration executada com sucesso!')
  }
}

runMigration()
