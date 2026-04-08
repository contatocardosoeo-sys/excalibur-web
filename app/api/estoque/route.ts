// ⚔️ Excalibur — API Estoque (Produtos + Alertas)
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const categoria = searchParams.get('categoria')
    const busca = searchParams.get('busca')

    let query = supabase.from('estoque').select('*').eq('clinica_id', clinicaId).order('nome')
    if (categoria) query = query.eq('categoria', categoria)
    if (busca) query = query.ilike('nome', `%${busca}%`)

    const { data, error } = await query
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

    const todos = data || []
    const hoje = new Date().toISOString().split('T')[0]
    const em30dias = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

    const semEstoque = todos.filter(p => Number(p.quantidade_atual) <= 0)
    const estoqueMinimo = todos.filter(p => Number(p.quantidade_atual) > 0 && Number(p.quantidade_atual) <= Number(p.quantidade_minima))
    const vencendo = todos.filter(p => p.data_validade && p.data_validade <= em30dias && p.data_validade >= hoje)
    const vencidos = todos.filter(p => p.data_validade && p.data_validade < hoje)
    const valorTotal = todos.reduce((s, p) => s + Number(p.preco_custo || 0) * Number(p.quantidade_atual || 0), 0)

    return NextResponse.json({
      produtos: data,
      kpis: {
        valor_total_estoque: Math.round(valorTotal * 100) / 100,
        produtos_cadastrados: todos.length,
        sem_estoque: semEstoque.length,
        estoque_minimo: estoqueMinimo.length,
        vencendo_30dias: vencendo.length,
        vencidos: vencidos.length,
      },
      alertas: {
        sem_estoque: semEstoque.map(p => ({ id: p.id, nome: p.nome })),
        estoque_minimo: estoqueMinimo.map(p => ({ id: p.id, nome: p.nome, atual: p.quantidade_atual, minimo: p.quantidade_minima })),
        vencendo: vencendo.map(p => ({ id: p.id, nome: p.nome, validade: p.data_validade })),
        vencidos: vencidos.map(p => ({ id: p.id, nome: p.nome, validade: p.data_validade })),
      },
    })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clinica_id = CLINICA_DEMO_ID, nome, codigo_sku, categoria, unidade, quantidade_atual, quantidade_minima, preco_custo, preco_venda, fornecedor, lote, data_validade, localizacao, imagem_url } = body as Record<string, unknown>
    if (!nome) return NextResponse.json({ erro: 'nome obrigatório' }, { status: 400 })

    const { data, error } = await supabase
      .from('estoque')
      .insert({ clinica_id, nome, codigo_sku, categoria: categoria || 'insumo', unidade: unidade || 'un', quantidade_atual: quantidade_atual || 0, quantidade_minima: quantidade_minima || 0, preco_custo: preco_custo || 0, preco_venda: preco_venda || 0, fornecedor, lote, data_validade, localizacao, imagem_url })
      .select().single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ produto: data }, { status: 201 })
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

    const { data, error } = await supabase.from('estoque').update(updates).eq('id', id as string).select().single()
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ produto: data })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
