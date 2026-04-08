import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const clinica_id = req.nextUrl.searchParams.get('clinica_id')
  const etapa = req.nextUrl.searchParams.get('etapa')

  if (!clinica_id) {
    return NextResponse.json({ error: 'clinica_id obrigatorio' }, { status: 400 })
  }

  let query = supabase
    .from('whatsapp_leads')
    .select('*')
    .eq('clinica_id', clinica_id)
    .order('ultimo_contato', { ascending: false })

  if (etapa) {
    query = query.eq('etapa', etapa)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ leads: data, total: data?.length || 0 })
}
