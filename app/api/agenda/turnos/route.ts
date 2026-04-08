// ⚔️ Excalibur — API Turnos (Escalas de Profissionais)
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const profissionalId = searchParams.get('profissional_id')
    const diaSemana = searchParams.get('dia_semana')

    let query = supabase.from('turnos').select('*').eq('clinica_id', clinicaId).eq('ativo', true).order('dia_semana').order('hora_inicio')
    if (profissionalId) query = query.eq('profissional_id', profissionalId)
    if (diaSemana) query = query.eq('dia_semana', parseInt(diaSemana))

    const { data, error } = await query
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ turnos: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clinica_id = CLINICA_DEMO_ID, profissional_id, dia_semana, hora_inicio, hora_fim, sala_id, intervalo_minutos } = body as Record<string, unknown>
    if (!profissional_id || dia_semana === undefined || !hora_inicio || !hora_fim) return NextResponse.json({ erro: 'profissional_id, dia_semana, hora_inicio e hora_fim são obrigatórios' }, { status: 400 })

    const { data, error } = await supabase
      .from('turnos')
      .insert({ clinica_id, profissional_id, dia_semana, hora_inicio, hora_fim, sala_id, intervalo_minutos: intervalo_minutos || 30 })
      .select().single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ turno: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body as Record<string, unknown>
    if (!id) return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 })

    const { data, error } = await supabase.from('turnos').update(updates).eq('id', id as string).select().single()
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ turno: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
