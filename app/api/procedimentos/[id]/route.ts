// ⚔️ Excalibur — API Procedimento Individual
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data, error } = await supabase.from('procedimentos').select('*').eq('id', id).single()
    if (error) return NextResponse.json({ erro: error.message }, { status: 404 })
    return NextResponse.json({ procedimento: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const campos = ['nome', 'descricao', 'categoria', 'preco', 'custo', 'duracao_minutos', 'imagem_url', 'ativo', 'requer_anamnese']
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const c of campos) { if (body[c] !== undefined) updates[c] = body[c] }

    const { data, error } = await supabase.from('procedimentos').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ procedimento: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error } = await supabase.from('procedimentos').delete().eq('id', id)
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ mensagem: 'Procedimento removido' })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
