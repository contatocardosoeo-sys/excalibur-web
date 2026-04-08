// ⚔️ Excalibur — API Metas & OKRs
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const tipo = searchParams.get('tipo')
    const ativo = searchParams.get('ativo')

    let query = supabase.from('metas').select('*').eq('clinica_id', clinicaId).order('data_fim', { ascending: false })
    if (tipo) query = query.eq('tipo', tipo)
    if (ativo !== null && ativo !== undefined) query = query.eq('ativo', ativo === 'true')

    const { data, error } = await query
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

    const todas = data || []
    const ativas = todas.filter(m => m.ativo)
    const progresso = ativas.map(m => ({
      id: m.id,
      titulo: m.titulo,
      percentual: Number(m.valor_meta) > 0 ? Math.round((Number(m.valor_atual) / Number(m.valor_meta)) * 100) : 0,
    }))

    return NextResponse.json({ metas: data, progresso, total_ativas: ativas.length })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clinica_id = CLINICA_DEMO_ID, titulo, tipo, periodo, valor_meta, unidade, responsavel_id, data_inicio, data_fim } = body as Record<string, unknown>
    if (!titulo || !valor_meta || !data_inicio || !data_fim) return NextResponse.json({ erro: 'titulo, valor_meta, data_inicio e data_fim são obrigatórios' }, { status: 400 })

    const { data, error } = await supabase
      .from('metas')
      .insert({ clinica_id, titulo, tipo: tipo || 'vendas', periodo: periodo || 'mensal', valor_meta, unidade: unidade || 'reais', responsavel_id, data_inicio, data_fim })
      .select().single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ meta: data }, { status: 201 })
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

    const { data, error } = await supabase.from('metas').update(updates).eq('id', id as string).select().single()
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ meta: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
