// ⚔️ Excalibur — API Dashboard de Vendas
// GET /api/vendas/dashboard — KPIs agregados + funil + top vendedores
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { CLINICA_DEMO_ID } from '../../../lib/database.types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clinicaId = searchParams.get('clinica_id') || CLINICA_DEMO_ID
    const periodo = searchParams.get('periodo') || 'mes'

    const agora = new Date()
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString()
    const inicio90d = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const dataInicio = periodo === '90dias' ? inicio90d : inicioMes

    // Queries paralelas
    const [
      oportunidadesRes,
      propostasRes,
      leadsRes,
      metasRes,
      atividadesRes,
    ] = await Promise.all([
      supabase.from('oportunidades').select('*').eq('clinica_id', clinicaId),
      supabase.from('propostas_v2').select('*').eq('clinica_id', clinicaId),
      supabase.from('leads').select('id, etapa, created_at'),
      supabase.from('metas').select('*').eq('clinica_id', clinicaId).eq('ativo', true).eq('tipo', 'vendas').limit(1),
      supabase.from('atividades').select('*').eq('clinica_id', clinicaId).order('created_at', { ascending: false }).limit(10),
    ])

    const oportunidades = oportunidadesRes.data || []
    const propostas = propostasRes.data || []
    const leads = leadsRes.data || []
    const metas = metasRes.data || []
    const atividades = atividadesRes.data || []

    // === KPIs ===
    const opsGanhas = oportunidades.filter(o =>
      o.estagio === 'Ganho' && o.data_fechamento >= dataInicio.split('T')[0]
    )
    const vendasMes = opsGanhas.reduce((s, o) => s + Number(o.valor || 0), 0)
    const ticketMedio = opsGanhas.length > 0 ? vendasMes / opsGanhas.length : 0

    const opsAtivas = oportunidades.filter(o => !['Ganho', 'Perdido'].includes(o.estagio))
    const pipelineAtivo = opsAtivas.reduce((s, o) => s + Number(o.valor || 0), 0)
    const forecast = opsAtivas.reduce((s, o) => s + (Number(o.valor || 0) * (o.probabilidade || 0) / 100), 0)

    const opsFechadas = oportunidades.filter(o => ['Ganho', 'Perdido'].includes(o.estagio))
    const opsGanhasTotal = oportunidades.filter(o => o.estagio === 'Ganho')
    const taxaConversao = opsFechadas.length > 0
      ? (opsGanhasTotal.length / opsFechadas.length) * 100
      : 0

    // Ciclo de vendas médio (dias entre criação e fechamento)
    const ciclos = opsGanhasTotal
      .filter(o => o.data_fechamento && o.created_at)
      .map(o => {
        const criacao = new Date(o.created_at).getTime()
        const fechamento = new Date(o.data_fechamento).getTime()
        return (fechamento - criacao) / (1000 * 60 * 60 * 24)
      })
    const cicloMedio = ciclos.length > 0
      ? Math.round(ciclos.reduce((s, c) => s + c, 0) / ciclos.length)
      : 0

    const metaMensal = metas.length > 0 ? Number(metas[0].valor_meta) : 0
    const percentualMeta = metaMensal > 0 ? Math.round((vendasMes / metaMensal) * 100) : 0

    // === Funil de Conversão ===
    const estagios = ['Novo Lead', 'Qualificacao', 'Contato Inicial', 'Em Negociacao', 'Pagamento Pendente', 'Fechado/Ganho', 'Perdido']
    const funil = estagios.map(estagio => {
      const count = leads.filter(l => l.etapa === estagio).length
      return {
        estagio,
        quantidade: count,
        percentual: leads.length > 0 ? Math.round((count / leads.length) * 100) : 0,
      }
    })

    // === Leads Quentes (score > 60) ===
    // Score calculado: leads com atividades recentes e valor alto
    const leadsQuentes = oportunidades
      .filter(o => o.probabilidade >= 60 && !['Ganho', 'Perdido'].includes(o.estagio))
      .sort((a, b) => Number(b.valor) - Number(a.valor))
      .slice(0, 5)
      .map(o => ({
        id: o.id,
        titulo: o.titulo,
        valor: Number(o.valor),
        score: o.probabilidade,
        estagio: o.estagio,
      }))

    return NextResponse.json({
      kpis: {
        vendas_mes: Math.round(vendasMes * 100) / 100,
        ticket_medio: Math.round(ticketMedio * 100) / 100,
        taxa_conversao: Math.round(taxaConversao * 10) / 10,
        pipeline_ativo: Math.round(pipelineAtivo * 100) / 100,
        pipeline_leads_count: opsAtivas.length,
        forecast: Math.round(forecast * 100) / 100,
        ciclo_vendas_dias: cicloMedio,
        meta_mensal: metaMensal,
        percentual_meta: percentualMeta,
      },
      funil,
      leads_quentes: leadsQuentes,
      atividades_recentes: atividades,
      periodo,
      atualizado_em: agora.toISOString(),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao calcular dashboard'
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
