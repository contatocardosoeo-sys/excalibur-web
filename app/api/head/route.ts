// ⚔️ Excalibur HEAD — API Routes
import { NextRequest, NextResponse } from 'next/server'
import {
  consultarHead,
  headAnalisarMetricas,
  headProximaTarefa,
  headEstudoMercado,
} from '../../lib/head'
import { supabase } from '../../lib/supabase'

// POST /api/head — consultar HEAD
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { acao, dados } = body as {
      acao: 'consultar' | 'analisar_metricas' | 'proxima_tarefa' | 'estudo_mercado'
      dados: Record<string, unknown>
    }

    let resultado

    switch (acao) {
      case 'consultar':
        resultado = await consultarHead(dados.pergunta as string)
        break
      case 'analisar_metricas':
        resultado = await headAnalisarMetricas(
          dados as Parameters<typeof headAnalisarMetricas>[0]
        )
        break
      case 'proxima_tarefa':
        resultado = await headProximaTarefa(
          dados as Parameters<typeof headProximaTarefa>[0]
        )
        break
      case 'estudo_mercado':
        resultado = await headEstudoMercado(dados.tema as string)
        break
      default:
        return NextResponse.json({ erro: 'Ação inválida' }, { status: 400 })
    }

    // Salvar log no Supabase
    await supabase.from('head_log').insert({
      acao,
      pergunta: JSON.stringify(dados).slice(0, 500),
      resposta: resultado.conteudo.slice(0, 2000),
      modelo: resultado.modelo,
      tokens: resultado.tokens_usados,
    }).then(() => {})

    return NextResponse.json(resultado)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}

// GET /api/head — buscar últimos insights
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('head_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ insights: [], erro: error.message })
    }
    return NextResponse.json({ insights: data ?? [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro'
    return NextResponse.json({ insights: [], erro: msg })
  }
}
