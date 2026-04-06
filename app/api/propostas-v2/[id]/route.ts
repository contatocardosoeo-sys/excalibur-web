// ⚔️ Excalibur — API Proposta Individual
// GET /api/propostas-v2/[id]
// PATCH /api/propostas-v2/[id] — atualizar status, valores
// DELETE /api/propostas-v2/[id]
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('propostas_v2')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 404 })
    return NextResponse.json({ proposta: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao buscar proposta'
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
      'status', 'paciente_nome', 'paciente_cpf', 'paciente_telefone',
      'procedimentos', 'valor_total', 'desconto_percentual', 'desconto_valor',
      'valor_final', 'entrada', 'parcelas', 'valor_parcela', 'forma_pagamento',
      'financeira', 'taxa_juros', 'valor_financiado', 'validade',
      'vendedor_id', 'vendedor_nome', 'observacoes', 'condicoes',
      'assinatura_url', 'metadata',
    ]

    for (const campo of campos) {
      if (body[campo] !== undefined) updates[campo] = body[campo]
    }

    const { data, error } = await supabase
      .from('propostas_v2')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ proposta: data, mensagem: 'Proposta atualizada' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao atualizar proposta'
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
      .from('propostas_v2')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ mensagem: 'Proposta removida' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao remover proposta'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
