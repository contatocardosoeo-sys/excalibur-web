// ⚔️ Excalibur — API Cupons
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const codigo = searchParams.get('codigo')

    let query = supabase.from('cupons').select('*').eq('clinica_id', clinicaId).order('created_at', { ascending: false })
    if (codigo) query = query.eq('codigo', codigo)

    const { data, error } = await query
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ cupons: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clinica_id = CLINICA_DEMO_ID, codigo, descricao, tipo, valor, uso_maximo, data_inicio, data_fim, procedimentos_validos } = body as Record<string, unknown>
    if (!codigo || !valor) return NextResponse.json({ erro: 'codigo e valor são obrigatórios' }, { status: 400 })

    const { data, error } = await supabase
      .from('cupons')
      .insert({ clinica_id, codigo: (codigo as string).toUpperCase(), descricao, tipo: tipo || 'percentual', valor, uso_maximo: uso_maximo || 100, data_inicio, data_fim, procedimentos_validos: procedimentos_validos || [] })
      .select().single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ cupom: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body as Record<string, unknown>
    if (!id) return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 })

    const { data, error } = await supabase.from('cupons').update(updates).eq('id', id as string).select().single()
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ cupom: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: string }
    if (!id) return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 })

    const { error } = await supabase.from('cupons').delete().eq('id', id)
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ mensagem: 'Cupom removido' })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
