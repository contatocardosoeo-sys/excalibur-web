// ⚔️ Excalibur — API Autônomo
// Recebe decisões do N8N/Claude e executa ações automaticamente
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

interface DecisaoAutonoma {
  acao: 'nova_feature' | 'corrigir_bug' | 'atualizar_metricas' | 'alertar_ceo' | 'gerar_insight'
  prioridade: 'alta' | 'media' | 'baixa'
  descricao: string
  modulo?: string
  dados?: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as DecisaoAutonoma

    if (!body.acao || !body.descricao) {
      return NextResponse.json({ erro: 'Campos acao e descricao são obrigatórios' }, { status: 400 })
    }

    let resultado: string

    switch (body.acao) {
      case 'gerar_insight': {
        const { error } = await supabase.from('insights_ia').insert({
          tipo: 'acao',
          titulo: `HEAD Autônomo — ${body.modulo || 'geral'}`,
          conteudo: body.descricao,
          prioridade: body.prioridade,
          status: 'ativo',
        })
        resultado = error ? `Erro: ${error.message}` : 'Insight salvo com sucesso'
        break
      }

      case 'alertar_ceo': {
        const { error } = await supabase.from('insights_ia').insert({
          tipo: 'alerta',
          titulo: `ALERTA CEO — ${body.prioridade.toUpperCase()}`,
          conteudo: body.descricao,
          prioridade: body.prioridade,
          status: 'ativo',
        })
        resultado = error ? `Erro: ${error.message}` : 'Alerta enviado ao CEO'
        break
      }

      case 'atualizar_metricas': {
        // Força recalculo chamando a API de métricas
        const res = await fetch(new URL('/api/ceo/metricas', req.url))
        const metricas = await res.json()
        resultado = `Métricas atualizadas: ${metricas.leads?.total || 0} leads, ${metricas.faturamento?.total_pago || 0} faturamento`
        break
      }

      case 'nova_feature':
      case 'corrigir_bug': {
        const { error } = await supabase.from('sync_log').insert({
          origem: 'head-autonomo',
          destino: body.acao === 'nova_feature' ? 'backlog' : 'issues',
          status: 'ok',
          detalhes: `[${body.prioridade}] ${body.descricao}`,
        })
        resultado = error ? `Erro: ${error.message}` : `${body.acao} registrado no backlog`
        break
      }

      default:
        return NextResponse.json({ erro: `Ação desconhecida: ${body.acao}` }, { status: 400 })
    }

    // Log da execução
    await supabase.from('sync_log').insert({
      origem: 'autonomo',
      destino: body.acao,
      status: 'ok',
      detalhes: resultado,
    })

    return NextResponse.json({ sucesso: true, resultado, acao: body.acao })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro no autônomo'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}

// GET — status do sistema autônomo
export async function GET() {
  try {
    const { data: ultimos, error } = await supabase
      .from('sync_log')
      .select('id, origem, destino, status, detalhes, created_at')
      .eq('origem', 'autonomo')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    return NextResponse.json({
      status: 'ativo',
      ultimas_acoes: ultimos ?? [],
      versao: 'v1.0',
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro'
    return NextResponse.json({ status: 'erro', erro: msg }, { status: 500 })
  }
}
