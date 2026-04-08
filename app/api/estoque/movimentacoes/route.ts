// ⚔️ Excalibur — API Movimentações de Estoque
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const produtoId = searchParams.get('produto_id')
    const tipo = searchParams.get('tipo')
    const limite = parseInt(searchParams.get('limite') || '50')

    let query = supabase.from('estoque_movimentacoes').select('*').eq('clinica_id', clinicaId).order('created_at', { ascending: false }).limit(limite)
    if (produtoId) query = query.eq('produto_id', produtoId)
    if (tipo) query = query.eq('tipo', tipo)

    const { data, error } = await query
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ movimentacoes: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clinica_id = CLINICA_DEMO_ID, produto_id, tipo, quantidade, motivo, documento, responsavel_id, responsavel_nome, custo_unitario } = body as Record<string, unknown>
    if (!produto_id || !tipo || !quantidade) return NextResponse.json({ erro: 'produto_id, tipo e quantidade são obrigatórios' }, { status: 400 })

    // Buscar quantidade atual do produto
    const { data: produto, error: prodErr } = await supabase.from('estoque').select('quantidade_atual').eq('id', produto_id as string).single()
    if (prodErr) return NextResponse.json({ erro: prodErr.message }, { status: 404 })

    const qtdAnterior = Number(produto.quantidade_atual)
    const qtdMov = Number(quantidade)
    const qtdPosterior = tipo === 'entrada' || tipo === 'devolucao'
      ? qtdAnterior + qtdMov
      : qtdAnterior - qtdMov

    // Registrar movimentação
    const { data, error } = await supabase
      .from('estoque_movimentacoes')
      .insert({ clinica_id, produto_id, tipo, quantidade: qtdMov, quantidade_anterior: qtdAnterior, quantidade_posterior: qtdPosterior, motivo, documento, responsavel_id, responsavel_nome, custo_unitario: custo_unitario || 0 })
      .select().single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

    // Atualizar estoque
    await supabase.from('estoque').update({ quantidade_atual: qtdPosterior, updated_at: new Date().toISOString() }).eq('id', produto_id as string)

    return NextResponse.json({ movimentacao: data, estoque_atualizado: qtdPosterior }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
