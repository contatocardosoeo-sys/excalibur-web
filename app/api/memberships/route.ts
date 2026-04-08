// ⚔️ Excalibur — API Memberships (Planos Recorrentes)
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const clinicaId = new URL(req.url).searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const { data, error } = await supabase.from('memberships').select('*').eq('clinica_id', clinicaId).order('preco_mensal')
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ memberships: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clinica_id = CLINICA_DEMO_ID, nome, descricao, preco_mensal, beneficios, procedimentos_inclusos, desconto_adicional, periodo_minimo_meses } = body as Record<string, unknown>
    if (!nome || !preco_mensal) return NextResponse.json({ erro: 'nome e preco_mensal são obrigatórios' }, { status: 400 })

    const { data, error } = await supabase
      .from('memberships')
      .insert({ clinica_id, nome, descricao, preco_mensal, beneficios: beneficios || [], procedimentos_inclusos: procedimentos_inclusos || [], desconto_adicional: desconto_adicional || 0, periodo_minimo_meses: periodo_minimo_meses || 12 })
      .select().single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ membership: data }, { status: 201 })
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

    const { data, error } = await supabase.from('memberships').update(updates).eq('id', id as string).select().single()
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ membership: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
