// ⚔️ Excalibur — API Procedimentos (Catálogo de Serviços)
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const categoria = searchParams.get('categoria')
    const busca = searchParams.get('busca')
    const ativo = searchParams.get('ativo')

    let query = supabase
      .from('procedimentos')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('nome')

    if (categoria) query = query.eq('categoria', categoria)
    if (busca) query = query.ilike('nome', `%${busca}%`)
    if (ativo !== null && ativo !== undefined) query = query.eq('ativo', ativo === 'true')

    const { data, error } = await query
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

    const todos = data || []
    const ativos = todos.filter(p => p.ativo)
    const categorias = [...new Set(todos.map(p => p.categoria))]
    const topPreco = todos.reduce((max, p) => Number(p.preco) > Number(max.preco) ? p : max, todos[0] || { preco: 0, nome: '' })

    return NextResponse.json({
      procedimentos: data,
      kpis: {
        total: todos.length,
        ativos: ativos.length,
        categorias: categorias.length,
        top_preco: { nome: topPreco?.nome, preco: Number(topPreco?.preco || 0) },
      },
    })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clinica_id = CLINICA_DEMO_ID, nome, descricao, categoria, preco, custo, duracao_minutos, imagem_url, requer_anamnese } = body as Record<string, unknown>

    if (!nome || !preco) return NextResponse.json({ erro: 'nome e preco são obrigatórios' }, { status: 400 })

    const { data, error } = await supabase
      .from('procedimentos')
      .insert({ clinica_id, nome, descricao, categoria, preco, custo: custo || 0, duracao_minutos: duracao_minutos || 60, imagem_url, requer_anamnese: requer_anamnese || false })
      .select()
      .single()

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ procedimento: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
