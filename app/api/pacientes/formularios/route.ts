// ⚔️ Excalibur — API Formulários de Pacientes (Anamnese, Consentimento)
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const pacienteId = searchParams.get('paciente_id')
    const tipo = searchParams.get('tipo')
    const status = searchParams.get('status')

    let query = supabase.from('pacientes_formularios').select('*').eq('clinica_id', clinicaId).order('created_at', { ascending: false })
    if (pacienteId) query = query.eq('paciente_id', pacienteId)
    if (tipo) query = query.eq('tipo', tipo)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ formularios: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clinica_id = CLINICA_DEMO_ID, paciente_id, tipo, titulo, campos } = body as Record<string, unknown>
    if (!paciente_id || !titulo) return NextResponse.json({ erro: 'paciente_id e titulo são obrigatórios' }, { status: 400 })

    const { data, error } = await supabase
      .from('pacientes_formularios')
      .insert({ clinica_id, paciente_id, tipo: tipo || 'anamnese', titulo, campos: campos || [] })
      .select().single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ formulario: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, respostas, status, revisado_por } = body as Record<string, unknown>
    if (!id) return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (respostas) updates.respostas = respostas
    if (status) {
      updates.status = status
      if (status === 'preenchido') updates.preenchido_em = new Date().toISOString()
    }
    if (revisado_por) updates.revisado_por = revisado_por

    const { data, error } = await supabase.from('pacientes_formularios').update(updates).eq('id', id as string).select().single()
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ formulario: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
