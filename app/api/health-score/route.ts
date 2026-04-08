import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET(req: NextRequest) {
  const clinica_id = req.nextUrl.searchParams.get('clinica_id')
  if (!clinica_id) return NextResponse.json({ error: 'clinica_id obrigatório' }, { status: 400 })

  const semana = getWeekString(new Date())
  const { data: adocao } = await supabase
    .from('adocao_clinica')
    .select('*')
    .eq('clinica_id', clinica_id)
    .eq('semana', semana)
    .maybeSingle()

  return NextResponse.json({
    score: adocao?.score || 0,
    classificacao: adocao?.classificacao || 'RISCO',
    semana,
    detalhes: adocao || null,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { clinica_id, ...campos } = body
  if (!clinica_id) return NextResponse.json({ error: 'clinica_id obrigatório' }, { status: 400 })

  const semana = getWeekString(new Date())

  const { data, error } = await supabase
    .from('adocao_clinica')
    .upsert({ clinica_id, semana, ...campos }, { onConflict: 'clinica_id,semana' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

function getWeekString(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
}
