// ⚔️ Excalibur — API Sessões de Pacientes (Controle de Pacotes)
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const pacienteId = searchParams.get('paciente_id')
    const pacoteId = searchParams.get('pacote_id')
    const status = searchParams.get('status')

    let query = supabase.from('pacientes_sessoes').select('*').eq('clinica_id', clinicaId).order('data_sessao', { ascending: false })
    if (pacienteId) query = query.eq('paciente_id', pacienteId)
    if (pacoteId) query = query.eq('pacote_id', pacoteId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

    const todas = data || []
    return NextResponse.json({
      sessoes: data,
      stats: {
        total: todas.length,
        realizadas: todas.filter(s => s.status === 'realizada').length,
        pendentes: todas.filter(s => s.status === 'pendente').length,
        faltas: todas.filter(s => s.status === 'faltou').length,
      },
    })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clinica_id = CLINICA_DEMO_ID, paciente_id, pacote_id, procedimento_id, sessao_numero, total_sessoes, data_sessao, hora_sessao, profissional_id, observacoes } = body as Record<string, unknown>
    if (!paciente_id) return NextResponse.json({ erro: 'paciente_id obrigatório' }, { status: 400 })

    const { data, error } = await supabase
      .from('pacientes_sessoes')
      .insert({ clinica_id, paciente_id, pacote_id, procedimento_id, sessao_numero: sessao_numero || 1, total_sessoes: total_sessoes || 1, data_sessao, hora_sessao, profissional_id, observacoes })
      .select().single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ sessao: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body as Record<string, unknown>
    if (!id) return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 })
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from('pacientes_sessoes').update(updates).eq('id', id as string).select().single()
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ sessao: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
