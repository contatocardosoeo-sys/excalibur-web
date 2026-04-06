// Execute migration via Supabase service role
// Run: node scripts/execute-migration.js
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load env
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hluhlsnodndpskrkbjuw.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
})

async function checkTable(name) {
  const { data, error } = await supabase.from(name).select('id').limit(0)
  return !error
}

async function createTableViaInsertDelete(tableName, testRow) {
  // This won't create tables, just check if they exist
  const exists = await checkTable(tableName)
  return exists
}

async function run() {
  console.log('⚔️  Excalibur Migration Check')
  console.log('URL:', supabaseUrl)
  console.log('')

  const tables = [
    'clinicas', 'pipeline_estagios', 'oportunidades', 'atividades',
    'propostas_v2', 'equipe_membros', 'comissoes', 'metas',
    'campanhas_vendas', 'historico_leads'
  ]

  const existing = []
  const missing = []

  for (const table of tables) {
    const exists = await checkTable(table)
    if (exists) {
      existing.push(table)
      console.log(`✅ ${table} — EXISTS`)
    } else {
      missing.push(table)
      console.log(`❌ ${table} — MISSING`)
    }
  }

  console.log('')
  console.log(`Resultado: ${existing.length} existem, ${missing.length} faltam`)

  if (missing.length > 0) {
    console.log('')
    console.log('⚠️  Para criar as tabelas faltantes, execute o SQL abaixo no Supabase SQL Editor:')
    console.log('🌐 https://supabase.com/dashboard/project/hluhlsnodndpskrkbjuw/sql/new')
    console.log('')
    console.log('SQL file: supabase/migrations/001_multi_tenant_vendas.sql')
  }
}

run().catch(console.error)
