// ⚔️ Excalibur — API Equipe (Time Comercial + Clínico)
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const cargo = searchParams.get('cargo')
    const ativo = searchParams.get('ativo')
    const busca = searchParams.get('busca')

    let query = supabase.from('equipe_membros').select('*').eq('clinica_id', clinicaId).order('nome')
    if (cargo) query = query.eq('cargo', cargo)
    if (ativo !== null && ativo !== undefined) query = query.eq('ativo', ativo === 'true')
    if (busca) query = query.or(`nome.ilike.%${busca}%,email.ilike.%${busca}%`)

    const { data, error } = await query
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

    const todos = data || []
    return NextResponse.json({
      membros: data,
      kpis: {
        total: todos.length,
        ativos: todos.filter(m => m.ativo).length,
        cargos: [...new Set(todos.map(m => m.cargo))],
      },
    })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clinica_id = CLINICA_DEMO_ID, nome, email, telefone, cargo, role, avatar_url, meta_mensal, comissao_percentual, unidades } = body as Record<string, unknown>
    if (!nome || !email) return NextResponse.json({ erro: 'nome e email são obrigatórios' }, { status: 400 })

    const { data, error } = await supabase
      .from('equipe_membros')
      .insert({ clinica_id, nome, email, telefone, cargo: cargo || 'vendedor', role: role || 'membro', avatar_url, meta_mensal: meta_mensal || 0, comissao_percentual: comissao_percentual || 0, unidades: unidades || [] })
      .select().single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ membro: data }, { status: 201 })
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

    const { data, error } = await supabase.from('equipe_membros').update(updates).eq('id', id as string).select().single()
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ membro: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: string }
    if (!id) return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 })

    const { error } = await supabase.from('equipe_membros').update({ ativo: false, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ mensagem: 'Membro desativado' })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
