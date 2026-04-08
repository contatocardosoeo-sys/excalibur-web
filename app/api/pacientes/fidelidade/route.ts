// ⚔️ Excalibur — API Programa de Fidelidade
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const pacienteId = searchParams.get('paciente_id')

    let query = supabase.from('pacientes_fidelidade').select('*').eq('clinica_id', clinicaId)
    if (pacienteId) query = query.eq('paciente_id', pacienteId)

    const { data, error } = await query
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ fidelidade: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, paciente_id, clinica_id = CLINICA_DEMO_ID, pontos_adicionar, pontos_resgatar, nivel } = body as Record<string, unknown>

    if (!id && !paciente_id) return NextResponse.json({ erro: 'id ou paciente_id obrigatório' }, { status: 400 })

    // Buscar registro atual
    let queryFind = supabase.from('pacientes_fidelidade').select('*')
    if (id) queryFind = queryFind.eq('id', id as string)
    else queryFind = queryFind.eq('paciente_id', paciente_id as string).eq('clinica_id', clinica_id as string)

    const { data: atual, error: findErr } = await queryFind.single()

    if (findErr) {
      // Se não existe, criar
      if (paciente_id) {
        const { data: novo, error: insErr } = await supabase
          .from('pacientes_fidelidade')
          .insert({ clinica_id, paciente_id, pontos_total: Number(pontos_adicionar || 0), pontos_disponiveis: Number(pontos_adicionar || 0), nivel: nivel || 'bronze' })
          .select().single()
        if (insErr) return NextResponse.json({ erro: insErr.message }, { status: 500 })
        return NextResponse.json({ fidelidade: novo }, { status: 201 })
      }
      return NextResponse.json({ erro: findErr.message }, { status: 404 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (pontos_adicionar) {
      const add = Number(pontos_adicionar)
      updates.pontos_total = Number(atual.pontos_total) + add
      updates.pontos_disponiveis = Number(atual.pontos_disponiveis) + add
    }

    if (pontos_resgatar) {
      const resg = Number(pontos_resgatar)
      if (resg > Number(atual.pontos_disponiveis)) return NextResponse.json({ erro: 'Pontos insuficientes' }, { status: 400 })
      updates.pontos_disponiveis = Number(atual.pontos_disponiveis) - resg
      updates.pontos_utilizados = Number(atual.pontos_utilizados) + resg
    }

    if (nivel) updates.nivel = nivel

    const { data, error } = await supabase.from('pacientes_fidelidade').update(updates).eq('id', atual.id).select().single()
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ fidelidade: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
