// ⚔️ Excalibur — API Oportunidade Individual
// GET /api/oportunidades/[id] — detalhes
// PATCH /api/oportunidades/[id] — atualizar (mover estágio, editar)
// DELETE /api/oportunidades/[id] — remover
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('oportunidades')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 404 })
    return NextResponse.json({ oportunidade: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao buscar oportunidade'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const campos = [
      'titulo', 'valor', 'probabilidade', 'estagio', 'estagio_id',
      'vendedor_id', 'procedimento', 'data_previsao_fechamento',
      'data_fechamento', 'motivo_perda', 'observacoes', 'tags', 'metadata'
    ]

    for (const campo of campos) {
      if (body[campo] !== undefined) updates[campo] = body[campo]
    }

    // Se mudou para Ganho/Perdido, registrar data_fechamento
    if (body.estagio === 'Ganho' || body.estagio === 'Perdido') {
      updates.data_fechamento = updates.data_fechamento || new Date().toISOString().split('T')[0]
    }

    const { data, error } = await supabase
      .from('oportunidades')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ oportunidade: data, mensagem: 'Oportunidade atualizada' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao atualizar oportunidade'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await supabase
      .from('oportunidades')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ mensagem: 'Oportunidade removida' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao remover oportunidade'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
